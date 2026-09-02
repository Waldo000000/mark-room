import { z } from 'zod';

import {
  entityIdSchema,
  headingDegreesSchema,
  longTextSchema,
  reportDuplicateIds,
  requireReference,
  rulesContextSchema,
  shortTextSchema,
  tackSchema,
} from '../shared/schema';
import { inferTackFromHeading } from './geometry';

export const SCENARIO_SCHEMA_VERSION = '0.2.0' as const;

const coordinateSchema = z
  .object({ x: z.number().nonnegative(), y: z.number().nonnegative() })
  .strict();

export const windSchema = z
  .object({ fromDegrees: headingDegreesSchema })
  .strict();

export const sailingAreaSchema = z
  .object({ width: z.number().positive(), height: z.number().positive() })
  .strict();

export const boatSchema = z
  .object({
    id: entityIdSchema,
    label: shortTextSchema,
    sailNumber: shortTextSchema.optional(),
    color: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/, 'Use a six-digit hex color')
      .optional(),
  })
  .strict();

export const boatStateSchema = z
  .object({
    boatId: entityIdSchema,
    position: coordinateSchema,
    headingDegrees: headingDegreesSchema,
    tack: tackSchema,
  })
  .strict();

export const keyframeSchema = z
  .object({
    id: entityIdSchema,
    label: shortTextSchema,
    boatStates: z.array(boatStateSchema).min(1),
  })
  .strict();

const markFeatureSchema = z
  .object({
    type: z.literal('mark'),
    id: entityIdSchema,
    label: shortTextSchema.optional(),
    position: coordinateSchema,
    radius: z.number().positive().optional(),
  })
  .strict();

const lineFeatureSchema = z
  .object({
    type: z.literal('line'),
    id: entityIdSchema,
    label: shortTextSchema.optional(),
    start: coordinateSchema,
    end: coordinateSchema,
  })
  .strict();

const boundaryFeatureSchema = z
  .object({
    type: z.literal('boundary'),
    id: entityIdSchema,
    label: shortTextSchema.optional(),
    points: z.array(coordinateSchema).min(3),
  })
  .strict();

export const courseFeatureSchema = z.discriminatedUnion('type', [
  markFeatureSchema,
  lineFeatureSchema,
  boundaryFeatureSchema,
]);

const observedEventBaseSchema = z.object({
  id: entityIdSchema,
  atKeyframe: entityIdSchema,
  boatId: entityIdSchema,
});

const hailEventSchema = observedEventBaseSchema
  .extend({ type: z.literal('hail'), message: shortTextSchema })
  .strict();

const penaltyTakenEventSchema = observedEventBaseSchema
  .extend({
    type: z.literal('penalty-taken'),
    penaltyType: z.enum(['one-turn', 'two-turns', 'retired', 'other']),
    notes: shortTextSchema.optional(),
  })
  .strict();

export const observedEventSchema = z.discriminatedUnion('type', [
  hailEventSchema,
  penaltyTakenEventSchema,
]);

export const scenarioSchema = z
  .object({
    schemaVersion: z.literal(SCENARIO_SCHEMA_VERSION),
    id: entityIdSchema,
    title: shortTextSchema,
    prompt: longTextSchema,
    context: rulesContextSchema,
    sailingArea: sailingAreaSchema,
    wind: windSchema,
    boats: z.array(boatSchema).min(1),
    keyframes: z.array(keyframeSchema).min(1),
    courseFeatures: z.array(courseFeatureSchema),
    observedEvents: z.array(observedEventSchema),
  })
  .strict()
  .superRefine((scenario, context) => {
    reportDuplicateIds(
      scenario.boats.map((boat) => boat.id),
      ['boats'],
      context,
    );
    reportDuplicateIds(
      scenario.keyframes.map((keyframe) => keyframe.id),
      ['keyframes'],
      context,
    );
    reportDuplicateIds(
      scenario.courseFeatures.map((feature) => feature.id),
      ['courseFeatures'],
      context,
    );
    reportDuplicateIds(
      scenario.observedEvents.map((event) => event.id),
      ['observedEvents'],
      context,
    );

    const boatIds = new Set(scenario.boats.map((boat) => boat.id));
    const keyframeIds = new Set(
      scenario.keyframes.map((keyframe) => keyframe.id),
    );

    const checkPointBounds = (
      point: { x: number; y: number },
      path: (string | number)[],
    ) => {
      if (point.x > scenario.sailingArea.width) {
        context.addIssue({
          code: 'custom',
          path: [...path, 'x'],
          message: 'Coordinate exceeds sailing area width',
        });
      }
      if (point.y > scenario.sailingArea.height) {
        context.addIssue({
          code: 'custom',
          path: [...path, 'y'],
          message: 'Coordinate exceeds sailing area height',
        });
      }
    };

    scenario.keyframes.forEach((keyframe, keyframeIndex) => {
      const stateBoatIds = keyframe.boatStates.map((state) => state.boatId);
      const uniqueStateBoatIds = new Set(stateBoatIds);

      stateBoatIds.forEach((boatId, stateIndex) => {
        requireReference(
          boatId,
          boatIds,
          ['keyframes', keyframeIndex, 'boatStates', stateIndex, 'boatId'],
          'boat ID',
          context,
        );
        if (stateBoatIds.indexOf(boatId) !== stateIndex) {
          context.addIssue({
            code: 'custom',
            path: [
              'keyframes',
              keyframeIndex,
              'boatStates',
              stateIndex,
              'boatId',
            ],
            message: `Duplicate boat state: ${boatId}`,
          });
        }
      });

      boatIds.forEach((boatId) => {
        if (!uniqueStateBoatIds.has(boatId)) {
          context.addIssue({
            code: 'custom',
            path: ['keyframes', keyframeIndex, 'boatStates'],
            message: `Missing boat state: ${boatId}`,
          });
        }
      });

      keyframe.boatStates.forEach((state, stateIndex) => {
        checkPointBounds(state.position, [
          'keyframes',
          keyframeIndex,
          'boatStates',
          stateIndex,
          'position',
        ]);

        const inferredTack = inferTackFromHeading(
          state.headingDegrees,
          scenario.wind.fromDegrees,
        );
        if (inferredTack && inferredTack !== state.tack) {
          context.addIssue({
            code: 'custom',
            path: [
              'keyframes',
              keyframeIndex,
              'boatStates',
              stateIndex,
              'tack',
            ],
            message: `Tack conflicts with heading and wind: expected ${inferredTack}`,
          });
        }
      });
    });

    scenario.courseFeatures.forEach((feature, featureIndex) => {
      if (feature.type === 'mark') {
        checkPointBounds(feature.position, [
          'courseFeatures',
          featureIndex,
          'position',
        ]);
      } else if (feature.type === 'boundary') {
        feature.points.forEach((point, pointIndex) => {
          checkPointBounds(point, [
            'courseFeatures',
            featureIndex,
            'points',
            pointIndex,
          ]);
        });
      } else {
        checkPointBounds(feature.start, [
          'courseFeatures',
          featureIndex,
          'start',
        ]);
        checkPointBounds(feature.end, ['courseFeatures', featureIndex, 'end']);
      }
    });

    scenario.observedEvents.forEach((event, eventIndex) => {
      requireReference(
        event.atKeyframe,
        keyframeIds,
        ['observedEvents', eventIndex, 'atKeyframe'],
        'keyframe ID',
        context,
      );
      requireReference(
        event.boatId,
        boatIds,
        ['observedEvents', eventIndex, 'boatId'],
        'boat ID',
        context,
      );
    });
  });

export type SailingArea = z.infer<typeof sailingAreaSchema>;
export type Wind = z.infer<typeof windSchema>;
export type Boat = z.infer<typeof boatSchema>;
export type BoatState = z.infer<typeof boatStateSchema>;
export type Keyframe = z.infer<typeof keyframeSchema>;
export type CourseFeature = z.infer<typeof courseFeatureSchema>;
export type ObservedEvent = z.infer<typeof observedEventSchema>;
export type Scenario = z.infer<typeof scenarioSchema>;
