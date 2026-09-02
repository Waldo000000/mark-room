import { z } from 'zod';

import {
  entityIdSchema,
  rulesContextSchema,
  shortTextSchema,
  tackSchema,
} from '../shared/schema';

export const SITUATION_SCHEMA_VERSION = '0.2.0' as const;

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
    sailLuffing: z.boolean(),
    inZoneOfMarks: z.array(entityIdSchema),
  })
  .strict();

const relativePositionSchema = z
  .object({
    type: z.literal('relative-position'),
    subjectBoatId: entityIdSchema,
    otherBoatId: entityIdSchema,
    relationship: z.enum(['overlapped', 'clear-ahead', 'clear-astern']),
  })
  .strict();

const windwardLeewardSchema = z
  .object({
    type: z.literal('windward-leeward'),
    windwardBoatId: entityIdSchema,
    leewardBoatId: entityIdSchema,
  })
  .strict();

const markPositionSchema = z
  .object({
    type: z.literal('mark-position'),
    markId: entityIdSchema,
    insideBoatId: entityIdSchema,
    outsideBoatId: entityIdSchema,
  })
  .strict();

const contactSchema = z
  .object({
    type: z.literal('contact'),
    boatIds: z.array(entityIdSchema).min(1),
    markId: entityIdSchema.optional(),
  })
  .strict();

const proximitySchema = z
  .object({
    type: z.literal('proximity'),
    subjectBoatId: entityIdSchema,
    otherBoatId: entityIdSchema,
    separationHullLengths: z.number().nonnegative(),
  })
  .strict();

const availableRoomSchema = z
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
  relativePositionSchema,
  windwardLeewardSchema,
  markPositionSchema,
  contactSchema,
  proximitySchema,
  availableRoomSchema,
]);

export const situationActionSchema = z.discriminatedUnion('type', [
  z
    .object({
      type: z.literal('hail'),
      boatId: entityIdSchema,
      message: shortTextSchema,
    })
    .strict(),
  z
    .object({
      type: z.literal('penalty-taken'),
      boatId: entityIdSchema,
      penaltyType: z.enum(['one-turn', 'two-turns', 'retired', 'other']),
      notes: shortTextSchema.optional(),
    })
    .strict(),
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
  })
  .strict()
  .superRefine((situation, context) => {
    const reportDuplicates = (
      ids: string[],
      path: (string | number)[],
      field = 'id',
    ) => {
      const seen = new Set<string>();
      ids.forEach((id, index) => {
        if (seen.has(id)) {
          context.addIssue({
            code: 'custom',
            path: [...path, index, field],
            message: `Duplicate ID: ${id}`,
          });
        }
        seen.add(id);
      });
    };

    const boatIds = new Set(situation.boats.map((boat) => boat.id));
    const markIds = new Set(situation.marks.map((mark) => mark.id));
    const requireReference = (
      id: string,
      ids: Set<string>,
      path: (string | number)[],
      label: string,
    ) => {
      if (!ids.has(id)) {
        context.addIssue({
          code: 'custom',
          path,
          message: `Unknown ${label}: ${id}`,
        });
      }
    };
    const requireBoat = (id: string, path: (string | number)[]) =>
      requireReference(id, boatIds, path, 'boat ID');

    reportDuplicates(
      situation.boats.map((boat) => boat.id),
      ['boats'],
    );
    reportDuplicates(
      situation.marks.map((mark) => mark.id),
      ['marks'],
    );
    reportDuplicates(
      situation.moments.map((moment) => moment.id),
      ['moments'],
    );

    situation.moments.forEach((moment, momentIndex) => {
      const stateBoatIds = moment.boatStates.map((state) => state.boatId);
      reportDuplicates(
        stateBoatIds,
        ['moments', momentIndex, 'boatStates'],
        'boatId',
      );
      boatIds.forEach((boatId) => {
        if (!stateBoatIds.includes(boatId)) {
          context.addIssue({
            code: 'custom',
            path: ['moments', momentIndex, 'boatStates'],
            message: `Missing boat state: ${boatId}`,
          });
        }
      });

      moment.boatStates.forEach((state, stateIndex) => {
        const statePath = ['moments', momentIndex, 'boatStates', stateIndex];
        requireBoat(state.boatId, [...statePath, 'boatId']);
        state.inZoneOfMarks.forEach((markId, markIndex) =>
          requireReference(
            markId,
            markIds,
            [...statePath, 'inZoneOfMarks', markIndex],
            'mark ID',
          ),
        );
      });

      moment.relationships.forEach((relationship, relationshipIndex) => {
        const path = [
          'moments',
          momentIndex,
          'relationships',
          relationshipIndex,
        ];
        if (
          relationship.type === 'relative-position' ||
          relationship.type === 'proximity'
        ) {
          requireBoat(relationship.subjectBoatId, [...path, 'subjectBoatId']);
          requireBoat(relationship.otherBoatId, [...path, 'otherBoatId']);
        } else if (relationship.type === 'windward-leeward') {
          requireBoat(relationship.windwardBoatId, [...path, 'windwardBoatId']);
          requireBoat(relationship.leewardBoatId, [...path, 'leewardBoatId']);
        } else if (relationship.type === 'mark-position') {
          requireReference(
            relationship.markId,
            markIds,
            [...path, 'markId'],
            'mark ID',
          );
          requireBoat(relationship.insideBoatId, [...path, 'insideBoatId']);
          requireBoat(relationship.outsideBoatId, [...path, 'outsideBoatId']);
          if (relationship.insideBoatId === relationship.outsideBoatId) {
            context.addIssue({
              code: 'custom',
              path: [...path, 'outsideBoatId'],
              message: 'Inside and outside boats must be different',
            });
          }
        } else if (relationship.type === 'contact') {
          relationship.boatIds.forEach((boatId, boatIndex) =>
            requireBoat(boatId, [...path, 'boatIds', boatIndex]),
          );
          if (relationship.markId) {
            requireReference(
              relationship.markId,
              markIds,
              [...path, 'markId'],
              'mark ID',
            );
          }
        } else {
          requireBoat(relationship.boatId, [...path, 'boatId']);
          if (relationship.constrainedByBoatId) {
            requireBoat(relationship.constrainedByBoatId, [
              ...path,
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
  });

export type BoatSituationState = z.infer<typeof boatSituationStateSchema>;
export type SituationRelationship = z.infer<typeof situationRelationshipSchema>;
export type SituationMoment = z.infer<typeof situationMomentSchema>;
export type Situation = z.infer<typeof situationSchema>;
