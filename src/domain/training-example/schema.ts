import { z } from 'zod';

import { rulingSchema } from '../ruling/schema';
import { scenarioSchema } from '../scenario/schema';
import { situationSchema } from '../situation/schema';

export const trainingExampleSchema = z
  .object({
    scenario: scenarioSchema,
    situation: situationSchema,
    rulings: rulingSchema,
  })
  .strict()
  .superRefine((trainingExample, context) => {
    const { rulings, scenario, situation } = trainingExample;

    if (situation.scenarioId !== scenario.id) {
      context.addIssue({
        code: 'custom',
        path: ['situation', 'scenarioId'],
        message: 'Situation must reference the Scenario ID',
      });
    }
    if (
      JSON.stringify(situation.context) !== JSON.stringify(scenario.context)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['situation', 'context'],
        message: 'Situation context must match the Scenario context',
      });
    }

    const scenarioBoats = new Map(
      scenario.boats.map((boat) => [boat.id, boat.label]),
    );
    const situationBoats = new Map(
      situation.boats.map((boat) => [boat.id, boat.label]),
    );
    if (
      JSON.stringify([...situationBoats]) !== JSON.stringify([...scenarioBoats])
    ) {
      context.addIssue({
        code: 'custom',
        path: ['situation', 'boats'],
        message: 'Situation boats must match the Scenario boats',
      });
    }

    const keyframeIds = scenario.keyframes.map((keyframe) => keyframe.id);
    const momentIds = situation.moments.map((moment) => moment.id);
    if (JSON.stringify(momentIds) !== JSON.stringify(keyframeIds)) {
      context.addIssue({
        code: 'custom',
        path: ['situation', 'moments'],
        message: 'Situation moments must match the Scenario keyframes',
      });
    }

    const boatIds = new Set(situation.boats.map((boat) => boat.id));
    const validMomentIds = new Set(momentIds);
    [...rulings.obligations, ...rulings.outcomes].forEach(
      (statement, index) => {
        const collection =
          index < rulings.obligations.length ? 'obligations' : 'outcomes';
        const collectionIndex =
          collection === 'obligations'
            ? index
            : index - rulings.obligations.length;
        const path = ['rulings', collection, collectionIndex];

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
        if (
          'owedToBoatId' in statement &&
          !boatIds.has(statement.owedToBoatId)
        ) {
          context.addIssue({
            code: 'custom',
            path: [...path, 'owedToBoatId'],
            message: `Unknown Situation boat ID: ${statement.owedToBoatId}`,
          });
        }
      },
    );
  });

export type TrainingExample = z.infer<typeof trainingExampleSchema>;
