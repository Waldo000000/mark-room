import { z } from 'zod';

import {
  entityIdSchema,
  rulesContextSchema,
  shortTextSchema,
  tackSchema,
} from '../shared/schema';
import { inferTackFromHeading } from './geometry';

export const SCENARIO_SCHEMA_VERSION = '0.4.0' as const;

const coordinateSchema = z
  .object({
    x: z.number().nonnegative(),
    y: z.number().nonnegative(),
  })
  .strict();

const headingDegreesSchema = z.number().gte(0).lt(360);

export const windSchema = z
  .object({
    fromDegrees: headingDegreesSchema,
  })
  .strict();

export const sailingAreaSchema = z
  .object({
    width: z.number().positive(),
    height: z.number().positive(),
  })
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

const laylineFeatureSchema = z
  .object({
    type: z.literal('layline'),
    id: entityIdSchema,
    label: shortTextSchema.optional(),
    start: coordinateSchema,
    end: coordinateSchema,
    markId: entityIdSchema.optional(),
  })
  .strict();

export const courseFeatureSchema = z.discriminatedUnion('type', [
  markFeatureSchema,
  lineFeatureSchema,
  boundaryFeatureSchema,
  laylineFeatureSchema,
]);

const observedEventBaseSchema = z.object({
  id: entityIdSchema,
  atKeyframe: entityIdSchema,
});

const hailEventSchema = observedEventBaseSchema
  .extend({
    type: z.literal('hail'),
    boatId: entityIdSchema,
    message: shortTextSchema,
  })
  .strict();

const penaltyTakenEventSchema = observedEventBaseSchema
  .extend({
    type: z.literal('penalty-taken'),
    boatId: entityIdSchema,
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
    const reportDuplicateIds = (
      ids: string[],
      collectionPath: (string | number)[],
      idField = 'id',
    ) => {
      const seen = new Set<string>();
      ids.forEach((id, index) => {
        if (seen.has(id)) {
          context.addIssue({
            code: 'custom',
            path: [...collectionPath, index, idField],
            message: `Duplicate ID: ${id}`,
          });
        }
        seen.add(id);
      });
    };

    reportDuplicateIds(
      scenario.boats.map((boat) => boat.id),
      ['boats'],
    );
    reportDuplicateIds(
      scenario.keyframes.map((keyframe) => keyframe.id),
      ['keyframes'],
    );
    reportDuplicateIds(
      scenario.courseFeatures.map((feature) => feature.id),
      ['courseFeatures'],
    );
    reportDuplicateIds(
      scenario.observedEvents.map((event) => event.id),
      ['observedEvents'],
    );
    const boatIds = new Set(scenario.boats.map((boat) => boat.id));
    const keyframeIds = new Set(
      scenario.keyframes.map((keyframe) => keyframe.id),
    );
    const markIds = new Set(
      scenario.courseFeatures
        .filter((feature) => feature.type === 'mark')
        .map((mark) => mark.id),
    );
    const requireReference = (
      value: string,
      validValues: Set<string>,
      path: (string | number)[],
      label: string,
    ) => {
      if (!validValues.has(value)) {
        context.addIssue({
          code: 'custom',
          path,
          message: `Unknown ${label}: ${value}`,
        });
      }
    };

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
      if ('markId' in feature && feature.markId) {
        requireReference(
          feature.markId,
          markIds,
          ['courseFeatures', featureIndex, 'markId'],
          'mark ID',
        );
      }

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
      );
      requireReference(
        event.boatId,
        boatIds,
        ['observedEvents', eventIndex, 'boatId'],
        'boat ID',
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
