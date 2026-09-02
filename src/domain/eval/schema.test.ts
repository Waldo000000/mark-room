import { describe, expect, it } from 'vitest';

import portStarboardEvalCase from '../../../corpus/eval-cases/port-starboard.json';
import { scenarioEvalCaseSchema } from './schema';

const validEvalCase = () => structuredClone(portStarboardEvalCase);

describe('scenarioEvalCaseSchema', () => {
  it('contains only pipeline input and expected outputs', () => {
    const evalCase = scenarioEvalCaseSchema.parse(validEvalCase());

    expect(Object.keys(evalCase)).toEqual(['input', 'expected']);
    expect(Object.keys(evalCase.expected)).toEqual(['situation', 'ruling']);
  });

  it('requires Situation to reference its input Scenario', () => {
    const evalCase = validEvalCase();
    evalCase.expected.situation.scenarioId = 'another-scenario';

    expect(scenarioEvalCaseSchema.safeParse(evalCase).success).toBe(false);
  });

  it('requires the Situation boats and moments to match Scenario', () => {
    const evalCase = validEvalCase();
    evalCase.expected.situation.boats[0].label = 'Another boat';
    evalCase.expected.situation.moments[0].id = 'another-moment';

    const result = scenarioEvalCaseSchema.safeParse(evalCase);

    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((issue) => issue.message);
      expect(messages).toContain(
        'Situation boats must match the input Scenario boats',
      );
      expect(messages).toContain(
        'Situation moments must match the input Scenario keyframes',
      );
    }
  });

  it('requires Ruling references to exist in Situation', () => {
    const evalCase = validEvalCase();
    evalCase.expected.ruling.obligations[0].owedToBoatId = 'unknown-boat';

    const result = scenarioEvalCaseSchema.safeParse(evalCase);

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
