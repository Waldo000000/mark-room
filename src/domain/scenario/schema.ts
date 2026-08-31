import { z } from 'zod';

import { inferTackFromHeading } from './geometry';

export const SCENARIO_SCHEMA_VERSION = '0.1.0' as const;

const entityIdSchema = z
  .string()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use a lowercase, hyphen-separated ID');

const shortTextSchema = z.string().trim().min(1).max(200);
const longTextSchema = z.string().trim().min(1).max(5_000);
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

const zoneFeatureSchema = z
  .object({
    type: z.literal('zone'),
    id: entityIdSchema,
    label: shortTextSchema.optional(),
    center: coordinateSchema,
    radius: z.number().positive(),
    markId: entityIdSchema.optional(),
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
  zoneFeatureSchema,
  lineFeatureSchema,
  boundaryFeatureSchema,
  laylineFeatureSchema,
]);

const factBaseSchema = z.object({
  id: entityIdSchema,
  atKeyframe: entityIdSchema,
});

const tackFactSchema = factBaseSchema
  .extend({
    type: z.literal('tack'),
    boatId: entityIdSchema,
    tack: z.enum(['port', 'starboard']),
  })
  .strict();

const overlapFactSchema = factBaseSchema
  .extend({
    type: z.literal('overlap'),
    subjectBoat: entityIdSchema,
    otherBoat: entityIdSchema,
    relationship: z.enum(['overlapped', 'clear-ahead', 'clear-astern']),
  })
  .strict();

const zoneEntryFactSchema = factBaseSchema
  .extend({
    type: z.literal('zone-entry'),
    boatId: entityIdSchema,
    zoneId: entityIdSchema,
  })
  .strict();

const contactFactSchema = factBaseSchema
  .extend({
    type: z.literal('contact'),
    boatIds: z.array(entityIdSchema).min(1),
    featureId: entityIdSchema.optional(),
  })
  .strict();

const courseChangeFactSchema = factBaseSchema
  .extend({
    type: z.literal('course-change'),
    boatId: entityIdSchema,
    fromHeadingDegrees: headingDegreesSchema,
    toHeadingDegrees: headingDegreesSchema,
  })
  .strict();

const hailFactSchema = factBaseSchema
  .extend({
    type: z.literal('hail'),
    boatId: entityIdSchema,
    message: shortTextSchema,
  })
  .strict();

const penaltyTakenFactSchema = factBaseSchema
  .extend({
    type: z.literal('penalty-taken'),
    boatId: entityIdSchema,
    penaltyType: z.enum(['one-turn', 'two-turns', 'retired', 'other']),
    notes: shortTextSchema.optional(),
  })
  .strict();

export const scenarioFactSchema = z.discriminatedUnion('type', [
  tackFactSchema,
  overlapFactSchema,
  zoneEntryFactSchema,
  contactFactSchema,
  courseChangeFactSchema,
  hailFactSchema,
  penaltyTakenFactSchema,
]);

export const findingTypeSchema = z.enum([
  'right_of_way',
  'keep_clear',
  'entitled_to_room',
  'entitled_to_mark_room',
  'must_give_room',
  'must_avoid_contact',
  'rule_applies',
  'rule_breached',
  'exonerated',
  'penalty',
  'no_breach',
]);

export const scenarioFindingSchema = z
  .object({
    id: entityIdSchema,
    atKeyframe: entityIdSchema.optional(),
    subjectBoat: entityIdSchema,
    findingType: findingTypeSchema,
    otherBoat: entityIdSchema.optional(),
    ruleRefs: z.array(shortTextSchema).min(1),
    status: z.enum(['definite', 'conditional', 'not_determinable']),
    explanation: longTextSchema.optional(),
    provenanceRefs: z.array(entityIdSchema).min(1).optional(),
  })
  .strict();

export const scenarioRulingSchema = z
  .object({
    findings: z.array(scenarioFindingSchema).min(1),
    conclusion: longTextSchema,
  })
  .strict();

export const provenanceSchema = z
  .object({
    sourceId: entityIdSchema,
    sourceType: z.enum([
      'world_sailing_rule',
      'world_sailing_case',
      'official_interpretation',
      'club_training',
      'competitor_reference',
      'user_report',
      'image',
      'video',
      'other',
    ]),
    title: shortTextSchema.optional(),
    publisher: shortTextSchema.optional(),
    url: z.url().optional(),
    documentVersion: shortTextSchema.optional(),
    publicationDate: z.iso.date().optional(),
    accessedAt: z.iso.datetime({ offset: true }).optional(),
    pageOrSection: shortTextSchema.optional(),
    extractionMethod: z.enum([
      'manual',
      'agent_assisted',
      'ocr',
      'image_reconstruction',
      'video_reconstruction',
    ]),
    notes: longTextSchema.optional(),
  })
  .strict();

const unverifiedSchema = z
  .object({
    status: z.literal('unverified'),
    notes: longTextSchema.optional(),
  })
  .strict();

const reviewedVerificationFields = {
  verifiedBy: shortTextSchema,
  verifiedAt: z.iso.datetime({ offset: true }),
  notes: longTextSchema.optional(),
};

const agentReviewedSchema = z
  .object({
    status: z.literal('agent-reviewed'),
    ...reviewedVerificationFields,
  })
  .strict();

const humanVerifiedSchema = z
  .object({
    status: z.literal('human-verified'),
    ...reviewedVerificationFields,
  })
  .strict();

export const verificationSchema = z.discriminatedUnion('status', [
  unverifiedSchema,
  agentReviewedSchema,
  humanVerifiedSchema,
]);

export const scenarioSchema = z
  .object({
    schemaVersion: z.literal(SCENARIO_SCHEMA_VERSION),
    id: entityIdSchema,
    title: shortTextSchema,
    prompt: longTextSchema,
    context: z
      .object({
        discipline: z.enum(['radio_sailing', 'general_rrs']),
        ruleSetVersion: shortTextSchema.optional(),
      })
      .strict(),
    sailingArea: sailingAreaSchema,
    wind: windSchema,
    boats: z.array(boatSchema).min(1),
    keyframes: z.array(keyframeSchema).min(1),
    courseFeatures: z.array(courseFeatureSchema),
    facts: z.array(scenarioFactSchema),
    ruling: scenarioRulingSchema,
    teachingText: longTextSchema,
    provenance: z.array(provenanceSchema).min(1),
    verification: verificationSchema,
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
      scenario.facts.map((fact) => fact.id),
      ['facts'],
    );
    reportDuplicateIds(
      scenario.ruling.findings.map((finding) => finding.id),
      ['ruling', 'findings'],
    );
    reportDuplicateIds(
      scenario.provenance.map((source) => source.sourceId),
      ['provenance'],
      'sourceId',
    );

    const boatIds = new Set(scenario.boats.map((boat) => boat.id));
    const keyframeIds = new Set(
      scenario.keyframes.map((keyframe) => keyframe.id),
    );
    const featureIds = new Set(
      scenario.courseFeatures.map((feature) => feature.id),
    );
    const markIds = new Set(
      scenario.courseFeatures
        .filter((feature) => feature.type === 'mark')
        .map((mark) => mark.id),
    );
    const zoneIds = new Set(
      scenario.courseFeatures
        .filter((feature) => feature.type === 'zone')
        .map((zone) => zone.id),
    );
    const provenanceIds = new Set(
      scenario.provenance.map((source) => source.sourceId),
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
      } else if (feature.type === 'zone') {
        checkPointBounds(feature.center, [
          'courseFeatures',
          featureIndex,
          'center',
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

    scenario.facts.forEach((fact, factIndex) => {
      requireReference(
        fact.atKeyframe,
        keyframeIds,
        ['facts', factIndex, 'atKeyframe'],
        'keyframe ID',
      );

      const requireBoat = (boatId: string, field: string) =>
        requireReference(
          boatId,
          boatIds,
          ['facts', factIndex, field],
          'boat ID',
        );

      if (fact.type === 'overlap') {
        requireBoat(fact.subjectBoat, 'subjectBoat');
        requireBoat(fact.otherBoat, 'otherBoat');
        if (fact.subjectBoat === fact.otherBoat) {
          context.addIssue({
            code: 'custom',
            path: ['facts', factIndex, 'otherBoat'],
            message: 'A boat cannot be related to itself',
          });
        }
      } else if (fact.type === 'zone-entry') {
        requireBoat(fact.boatId, 'boatId');
        requireReference(
          fact.zoneId,
          zoneIds,
          ['facts', factIndex, 'zoneId'],
          'zone ID',
        );
      } else if (fact.type === 'contact') {
        fact.boatIds.forEach((boatId, boatIndex) => {
          requireReference(
            boatId,
            boatIds,
            ['facts', factIndex, 'boatIds', boatIndex],
            'boat ID',
          );
          if (fact.boatIds.indexOf(boatId) !== boatIndex) {
            context.addIssue({
              code: 'custom',
              path: ['facts', factIndex, 'boatIds', boatIndex],
              message: `Duplicate contact participant: ${boatId}`,
            });
          }
        });
        if (fact.featureId) {
          requireReference(
            fact.featureId,
            featureIds,
            ['facts', factIndex, 'featureId'],
            'course feature ID',
          );
        }
        if (fact.boatIds.length + (fact.featureId ? 1 : 0) < 2) {
          context.addIssue({
            code: 'custom',
            path: ['facts', factIndex],
            message: 'Contact requires at least two participants',
          });
        }
      } else {
        requireBoat(fact.boatId, 'boatId');
      }

      if (fact.type === 'tack') {
        const keyframe = scenario.keyframes.find(
          (candidate) => candidate.id === fact.atKeyframe,
        );
        const boatState = keyframe?.boatStates.find(
          (state) => state.boatId === fact.boatId,
        );
        const inferredTack = boatState
          ? inferTackFromHeading(
              boatState.headingDegrees,
              scenario.wind.fromDegrees,
            )
          : null;

        if (inferredTack && inferredTack !== fact.tack) {
          context.addIssue({
            code: 'custom',
            path: ['facts', factIndex, 'tack'],
            message: `Tack conflicts with heading and wind: expected ${inferredTack}`,
          });
        }
      }
    });

    scenario.ruling.findings.forEach((finding, findingIndex) => {
      const findingPath = ['ruling', 'findings', findingIndex] as const;
      requireReference(
        finding.subjectBoat,
        boatIds,
        [...findingPath, 'subjectBoat'],
        'boat ID',
      );
      if (finding.otherBoat) {
        requireReference(
          finding.otherBoat,
          boatIds,
          [...findingPath, 'otherBoat'],
          'boat ID',
        );
        if (finding.otherBoat === finding.subjectBoat) {
          context.addIssue({
            code: 'custom',
            path: [...findingPath, 'otherBoat'],
            message: 'A finding cannot compare a boat with itself',
          });
        }
      }
      if (finding.atKeyframe) {
        requireReference(
          finding.atKeyframe,
          keyframeIds,
          [...findingPath, 'atKeyframe'],
          'keyframe ID',
        );
      }
      finding.provenanceRefs?.forEach((sourceId, sourceIndex) => {
        requireReference(
          sourceId,
          provenanceIds,
          [...findingPath, 'provenanceRefs', sourceIndex],
          'provenance source ID',
        );
      });
      if (new Set(finding.ruleRefs).size !== finding.ruleRefs.length) {
        context.addIssue({
          code: 'custom',
          path: [...findingPath, 'ruleRefs'],
          message: 'Rule references must be unique',
        });
      }
      if (
        finding.status !== 'definite' &&
        (!finding.explanation || finding.explanation.length === 0)
      ) {
        context.addIssue({
          code: 'custom',
          path: [...findingPath, 'explanation'],
          message: `${finding.status} findings require an explanation`,
        });
      }
    });
  });

export type SailingArea = z.infer<typeof sailingAreaSchema>;
export type Wind = z.infer<typeof windSchema>;
export type Boat = z.infer<typeof boatSchema>;
export type BoatState = z.infer<typeof boatStateSchema>;
export type Keyframe = z.infer<typeof keyframeSchema>;
export type CourseFeature = z.infer<typeof courseFeatureSchema>;
export type ScenarioFact = z.infer<typeof scenarioFactSchema>;
export type ScenarioFinding = z.infer<typeof scenarioFindingSchema>;
export type ScenarioRuling = z.infer<typeof scenarioRulingSchema>;
export type Provenance = z.infer<typeof provenanceSchema>;
export type Verification = z.infer<typeof verificationSchema>;
export type Scenario = z.infer<typeof scenarioSchema>;
