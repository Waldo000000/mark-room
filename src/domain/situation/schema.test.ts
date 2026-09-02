import { describe, expect, it } from 'vitest';

import portStarboardEvalCase from '../../../corpus/eval-cases/port-starboard.json';
import { situationSchema, type Situation } from './schema';

const portStarboardSituation = portStarboardEvalCase.expected.situation;

describe('situationSchema', () => {
  it('validates a self-contained RRS-language situation', () => {
    const situation: Situation = situationSchema.parse(portStarboardSituation);

    expect(situation.scenarioId).toBe('development-port-starboard-crossing');
    expect(situation.moments[0].boatStates[0]).not.toHaveProperty('position');
    expect(situation.moments[0].boatStates[0]).not.toHaveProperty(
      'headingDegrees',
    );
  });

  it('rejects unknown boat references', () => {
    const situation = structuredClone(portStarboardSituation);
    situation.moments[0].boatStates[0].boatId = 'unknown-boat';

    const result = situationSchema.safeParse(situation);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) =>
          issue.message.includes('Unknown boat ID'),
        ),
      ).toBe(true);
    }
  });

  it('rejects incomplete moments', () => {
    const situation = structuredClone(portStarboardSituation);
    situation.moments[0].boatStates.pop();

    const result = situationSchema.safeParse(situation);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some(
          (issue) => issue.message === 'Missing boat state: yellow',
        ),
      ).toBe(true);
    }
  });
});
