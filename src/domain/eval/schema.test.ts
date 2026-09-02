import { describe, expect, it } from 'vitest';

import portStarboardEval from '../../../corpus/scenarios/port-starboard.json';
import { scenarioEvalCaseSchema } from './schema';

describe('scenarioEvalCaseSchema', () => {
  it('contains only pipeline input and expected outputs', () => {
    const evalCase = scenarioEvalCaseSchema.parse(portStarboardEval);

    expect(Object.keys(evalCase)).toEqual(['input', 'expected']);
    expect(Object.keys(evalCase.expected)).toEqual(['situation', 'ruling']);
  });

  it('requires the expected Situation to identify its input Scenario', () => {
    const evalCase = structuredClone(portStarboardEval);
    evalCase.expected.situation.scenarioId = 'another-scenario';

    expect(scenarioEvalCaseSchema.safeParse(evalCase).success).toBe(false);
  });
});
