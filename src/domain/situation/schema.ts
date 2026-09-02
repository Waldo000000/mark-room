import { z } from 'zod';

import {
  entityIdSchema,
  headingDegreesSchema,
  reportDuplicateIds,
  requireReference,
  rulesContextSchema,
  shortTextSchema,
  tackSchema,
} from '../shared/schema';

export const SITUATION_SCHEMA_VERSION = '0.1.0' as const;

export const sailStateSchema = z
  .object({
    side: z.enum(['port', 'starboard']),
    trimDegrees: z.number().gte(0).lte(90),
    luffing: z.boolean(),
  })
  .strict();

export const boatSituationStateSchema = z
  .object({
    boatId: entityIdSchema,
    tack: tackSchema,
    pointOfSail: z.enum([
      'head-to-wind',
      'close-hauled',
      'reaching',
      'running',
    ]),
    sail: sailStateSchema,
    inZoneOfMarks: z.array(entityIdSchema),
  })
  .strict();

const overlapRelationshipSchema = z
  .object({
    type: z.literal('relative-position'),
    subjectBoatId: entityIdSchema,
    otherBoatId: entityIdSchema,
    relationship: z.enum(['overlapped', 'clear-ahead', 'clear-astern']),
  })
  .strict();

const windwardLeewardRelationshipSchema = z
  .object({
    type: z.literal('windward-leeward'),
    windwardBoatId: entityIdSchema,
    leewardBoatId: entityIdSchema,
  })
  .strict();

const contactRelationshipSchema = z
  .object({
    type: z.literal('contact'),
    boatIds: z.array(entityIdSchema).min(1),
    featureId: entityIdSchema.optional(),
  })
  .strict();

const proximityRelationshipSchema = z
  .object({
    type: z.literal('proximity'),
    subjectBoatId: entityIdSchema,
    otherBoatId: entityIdSchema,
    separationHullLengths: z.number().nonnegative(),
  })
  .strict();

const availableRoomRelationshipSchema = z
  .object({
    type: z.literal('available-room'),
    boatId: entityIdSchema,
    constrainedByBoatId: entityIdSchema.optional(),
    purpose: z.enum([
      'keep-clear',
      'course-change',
      'mark-rounding',
      'obstruction-passing',
    ]),
    available: z.boolean(),
  })
  .strict();

export const situationRelationshipSchema = z.discriminatedUnion('type', [
  overlapRelationshipSchema,
  windwardLeewardRelationshipSchema,
  contactRelationshipSchema,
  proximityRelationshipSchema,
  availableRoomRelationshipSchema,
]);

const hailActionSchema = z
  .object({
    id: entityIdSchema,
    type: z.literal('hail'),
    boatId: entityIdSchema,
    message: shortTextSchema,
  })
  .strict();

const penaltyTakenActionSchema = z
  .object({
    id: entityIdSchema,
    type: z.literal('penalty-taken'),
    boatId: entityIdSchema,
    penaltyType: z.enum(['one-turn', 'two-turns', 'retired', 'other']),
    notes: shortTextSchema.optional(),
  })
  .strict();

export const situationActionSchema = z.discriminatedUnion('type', [
  hailActionSchema,
  penaltyTakenActionSchema,
]);

export const situationMomentSchema = z
  .object({
    id: entityIdSchema,
    label: shortTextSchema,
    boatStates: z.array(boatSituationStateSchema).min(1),
    relationships: z.array(situationRelationshipSchema),
    actions: z.array(situationActionSchema),
  })
  .strict();

const courseChangeSchema = z
  .object({
    type: z.literal('course-change'),
    boatId: entityIdSchema,
    fromHeadingDegrees: headingDegreesSchema,
    toHeadingDegrees: headingDegreesSchema,
  })
  .strict();

const overlapChangeSchema = z
  .object({
    type: z.literal('overlap-change'),
    subjectBoatId: entityIdSchema,
    otherBoatId: entityIdSchema,
    from: z.enum(['overlapped', 'clear-ahead', 'clear-astern']),
    to: z.enum(['overlapped', 'clear-ahead', 'clear-astern']),
  })
  .strict();

const zoneCrossingSchema = z
  .object({
    type: z.literal('zone-crossing'),
    boatId: entityIdSchema,
    markId: entityIdSchema,
    direction: z.enum(['enter', 'leave']),
  })
  .strict();

const contactChangeSchema = z
  .object({
    type: z.literal('contact-change'),
    boatIds: z.array(entityIdSchema).min(1),
    featureId: entityIdSchema.optional(),
    change: z.enum(['starts', 'ends']),
  })
  .strict();

export const situationChangeSchema = z.discriminatedUnion('type', [
  courseChangeSchema,
  overlapChangeSchema,
  zoneCrossingSchema,
  contactChangeSchema,
]);

export const situationTransitionSchema = z
  .object({
    fromMomentId: entityIdSchema,
    toMomentId: entityIdSchema,
    changes: z.array(situationChangeSchema).min(1),
  })
  .strict();

export const situationSchema = z
  .object({
    schemaVersion: z.literal(SITUATION_SCHEMA_VERSION),
    scenarioId: entityIdSchema,
    context: rulesContextSchema,
    boats: z.array(
      z.object({ id: entityIdSchema, label: shortTextSchema }).strict(),
    ),
    marks: z.array(
      z
        .object({ id: entityIdSchema, label: shortTextSchema.optional() })
        .strict(),
    ),
    moments: z.array(situationMomentSchema).min(1),
    transitions: z.array(situationTransitionSchema),
  })
  .strict()
  .superRefine((situation, context) => {
    reportDuplicateIds(
      situation.boats.map((boat) => boat.id),
      ['boats'],
      context,
    );
    reportDuplicateIds(
      situation.marks.map((mark) => mark.id),
      ['marks'],
      context,
    );
    reportDuplicateIds(
      situation.moments.map((moment) => moment.id),
      ['moments'],
      context,
    );

    const boatIds = new Set(situation.boats.map((boat) => boat.id));
    const markIds = new Set(situation.marks.map((mark) => mark.id));
    const momentIds = new Set(situation.moments.map((moment) => moment.id));

    const requireBoat = (boatId: string, path: (string | number)[]) =>
      requireReference(boatId, boatIds, path, 'boat ID', context);

    situation.moments.forEach((moment, momentIndex) => {
      const stateBoatIds = moment.boatStates.map((state) => state.boatId);
      reportDuplicateIds(
        stateBoatIds,
        ['moments', momentIndex, 'boatStates'],
        context,
        'boatId',
      );
      const stateBoatSet = new Set(stateBoatIds);
      boatIds.forEach((boatId) => {
        if (!stateBoatSet.has(boatId)) {
          context.addIssue({
            code: 'custom',
            path: ['moments', momentIndex, 'boatStates'],
            message: `Missing boat state: ${boatId}`,
          });
        }
      });

      moment.boatStates.forEach((state, stateIndex) => {
        requireBoat(state.boatId, [
          'moments',
          momentIndex,
          'boatStates',
          stateIndex,
          'boatId',
        ]);
        state.inZoneOfMarks.forEach((markId, markIndex) =>
          requireReference(
            markId,
            markIds,
            [
              'moments',
              momentIndex,
              'boatStates',
              stateIndex,
              'inZoneOfMarks',
              markIndex,
            ],
            'mark ID',
            context,
          ),
        );
      });

      moment.relationships.forEach((relationship, relationshipIndex) => {
        const basePath = [
          'moments',
          momentIndex,
          'relationships',
          relationshipIndex,
        ];
        if (
          relationship.type === 'relative-position' ||
          relationship.type === 'proximity'
        ) {
          requireBoat(relationship.subjectBoatId, [
            ...basePath,
            'subjectBoatId',
          ]);
          requireBoat(relationship.otherBoatId, [...basePath, 'otherBoatId']);
        } else if (relationship.type === 'windward-leeward') {
          requireBoat(relationship.windwardBoatId, [
            ...basePath,
            'windwardBoatId',
          ]);
          requireBoat(relationship.leewardBoatId, [
            ...basePath,
            'leewardBoatId',
          ]);
        } else if (relationship.type === 'contact') {
          relationship.boatIds.forEach((boatId, boatIndex) =>
            requireBoat(boatId, [...basePath, 'boatIds', boatIndex]),
          );
        } else {
          requireBoat(relationship.boatId, [...basePath, 'boatId']);
          if (relationship.constrainedByBoatId) {
            requireBoat(relationship.constrainedByBoatId, [
              ...basePath,
              'constrainedByBoatId',
            ]);
          }
        }
      });

      moment.actions.forEach((action, actionIndex) =>
        requireBoat(action.boatId, [
          'moments',
          momentIndex,
          'actions',
          actionIndex,
          'boatId',
        ]),
      );
    });

    situation.transitions.forEach((transition, transitionIndex) => {
      const transitionPath = ['transitions', transitionIndex];
      requireReference(
        transition.fromMomentId,
        momentIds,
        [...transitionPath, 'fromMomentId'],
        'moment ID',
        context,
      );
      requireReference(
        transition.toMomentId,
        momentIds,
        [...transitionPath, 'toMomentId'],
        'moment ID',
        context,
      );

      transition.changes.forEach((change, changeIndex) => {
        const changePath = [...transitionPath, 'changes', changeIndex];
        if (
          change.type === 'course-change' ||
          change.type === 'zone-crossing'
        ) {
          requireBoat(change.boatId, [...changePath, 'boatId']);
        } else if (change.type === 'overlap-change') {
          requireBoat(change.subjectBoatId, [
            ...changePath,
            'subjectBoatId',
          ]);
          requireBoat(change.otherBoatId, [...changePath, 'otherBoatId']);
        } else {
          change.boatIds.forEach((boatId, boatIndex) =>
            requireBoat(boatId, [...changePath, 'boatIds', boatIndex]),
          );
        }

        if (change.type === 'zone-crossing') {
          requireReference(
            change.markId,
            markIds,
            [...changePath, 'markId'],
            'mark ID',
            context,
          );
        }
      });
    });
  });

export type SailState = z.infer<typeof sailStateSchema>;
export type BoatSituationState = z.infer<typeof boatSituationStateSchema>;
export type SituationRelationship = z.infer<typeof situationRelationshipSchema>;
export type SituationMoment = z.infer<typeof situationMomentSchema>;
export type Situation = z.infer<typeof situationSchema>;
