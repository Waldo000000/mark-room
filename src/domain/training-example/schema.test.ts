import { describe, expect, it } from 'vitest';

import portStarboardTrainingExample from '../../../corpus/training-examples/port-starboard.json';
import windwardMarkTrainingExample from '../../../corpus/training-examples/windward-mark-zone.json';
import { trainingExampleSchema } from './schema';

const validTrainingExample = () =>
  structuredClone(portStarboardTrainingExample);

describe('trainingExampleSchema', () => {
  it('composes Scenario, Situation, and Rulings directly', () => {
    const trainingExample = trainingExampleSchema.parse(validTrainingExample());

    expect(Object.keys(trainingExample)).toEqual([
      'scenario',
      'situation',
      'rulings',
    ]);
  });

  it('requires Situation to reference its Scenario', () => {
    const trainingExample = validTrainingExample();
    trainingExample.situation.scenarioId = 'another-scenario';

    expect(trainingExampleSchema.safeParse(trainingExample).success).toBe(
      false,
    );
  });

  it('requires the Situation boats and moments to match Scenario', () => {
    const trainingExample = validTrainingExample();
    trainingExample.situation.boats[0].label = 'Another boat';
    trainingExample.situation.moments[0].id = 'another-moment';

    const result = trainingExampleSchema.safeParse(trainingExample);

    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((issue) => issue.message);
      expect(messages).toContain(
        'Situation boats must match the Scenario boats',
      );
      expect(messages).toContain(
        'Situation moments must match the Scenario keyframes',
      );
    }
  });

  it('requires Situation marks to match Scenario marks', () => {
    const trainingExample = structuredClone(windwardMarkTrainingExample);
    trainingExample.situation.marks[0].label = 'Another mark';

    const result = trainingExampleSchema.safeParse(trainingExample);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.message)).toContain(
        'Situation marks must match the Scenario marks',
      );
    }
  });

  it('matches unlabeled marks by ID', () => {
    const trainingExample = structuredClone(windwardMarkTrainingExample);
    delete (trainingExample.scenario.courseFeatures[0] as { label?: string })
      .label;
    delete (trainingExample.situation.marks[0] as { label?: string }).label;

    expect(trainingExampleSchema.safeParse(trainingExample).success).toBe(true);
  });

  it('requires Ruling references to exist in Situation', () => {
    const trainingExample = validTrainingExample();
    trainingExample.rulings.obligations[0].owedToBoatId = 'unknown-boat';

    const result = trainingExampleSchema.safeParse(trainingExample);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) =>
          issue.message.includes('Unknown Situation boat ID'),
        ),
      ).toBe(true);
    }
  });
});
