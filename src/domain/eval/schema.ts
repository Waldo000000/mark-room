import { z } from 'zod';

import { rulingSchema } from '../ruling/schema';
import { scenarioSchema } from '../scenario/schema';
import { situationSchema } from '../situation/schema';

export const scenarioEvalCaseSchema = z
  .object({
    input: scenarioSchema,
    expected: z
      .object({
        situation: situationSchema,
        ruling: rulingSchema,
      })
      .strict(),
  })
  .strict()
  .superRefine((evalCase, context) => {
    const { input } = evalCase;
    const { ruling, situation } = evalCase.expected;

    if (situation.scenarioId !== input.id) {
      context.addIssue({
        code: 'custom',
        path: ['expected', 'situation', 'scenarioId'],
        message: 'Situation must reference the input Scenario ID',
      });
    }
    if (JSON.stringify(situation.context) !== JSON.stringify(input.context)) {
      context.addIssue({
        code: 'custom',
        path: ['expected', 'situation', 'context'],
        message: 'Situation context must match the input Scenario context',
      });
    }

    const scenarioBoats = new Map(
      input.boats.map((boat) => [boat.id, boat.label]),
    );
    const situationBoats = new Map(
      situation.boats.map((boat) => [boat.id, boat.label]),
    );
    if (
      JSON.stringify([...situationBoats]) !== JSON.stringify([...scenarioBoats])
    ) {
      context.addIssue({
        code: 'custom',
        path: ['expected', 'situation', 'boats'],
        message: 'Situation boats must match the input Scenario boats',
      });
    }

    const keyframeIds = input.keyframes.map((keyframe) => keyframe.id);
    const momentIds = situation.moments.map((moment) => moment.id);
    if (JSON.stringify(momentIds) !== JSON.stringify(keyframeIds)) {
      context.addIssue({
        code: 'custom',
        path: ['expected', 'situation', 'moments'],
        message: 'Situation moments must match the input Scenario keyframes',
      });
    }

    const boatIds = new Set(situation.boats.map((boat) => boat.id));
    const validMomentIds = new Set(momentIds);
    [...ruling.obligations, ...ruling.outcomes].forEach((statement, index) => {
      const collection =
        index < ruling.obligations.length ? 'obligations' : 'outcomes';
      const collectionIndex =
        collection === 'obligations'
          ? index
          : index - ruling.obligations.length;
      const path = ['expected', 'ruling', collection, collectionIndex];

      if (!validMomentIds.has(statement.atMoment)) {
        context.addIssue({
          code: 'custom',
          path: [...path, 'atMoment'],
          message: `Unknown Situation moment ID: ${statement.atMoment}`,
        });
      }
      if (!boatIds.has(statement.boatId)) {
        context.addIssue({
          code: 'custom',
          path: [...path, 'boatId'],
          message: `Unknown Situation boat ID: ${statement.boatId}`,
        });
      }
      if ('owedToBoatId' in statement && !boatIds.has(statement.owedToBoatId)) {
        context.addIssue({
          code: 'custom',
          path: [...path, 'owedToBoatId'],
          message: `Unknown Situation boat ID: ${statement.owedToBoatId}`,
        });
      }
    });
  });

export type ScenarioEvalCase = z.infer<typeof scenarioEvalCaseSchema>;
