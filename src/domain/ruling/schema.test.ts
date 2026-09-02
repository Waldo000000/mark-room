import { describe, expect, it } from 'vitest';

import portStarboardEval from '../../../corpus/scenarios/port-starboard.json';
import { rulingSchema } from './schema';

describe('rulingSchema', () => {
  it('models deterministic obligations separately from Situation facts', () => {
    const ruling = rulingSchema.parse(portStarboardEval.expected.ruling);

    expect(ruling.obligations[0].type).toBe('keep-clear');
    expect(ruling.obligations[0].ruleRefs).toEqual(['RRS 10']);
    expect(ruling.obligations[0]).not.toHaveProperty('status');
  });

  it('rejects uncertainty fields and empty rulings', () => {
    const uncertain = structuredClone(
      portStarboardEval.expected.ruling,
    ) as unknown as Record<string, unknown>;
    const obligations = uncertain.obligations as Record<string, unknown>[];
    obligations[0].status = 'conditional';
    expect(rulingSchema.safeParse(uncertain).success).toBe(false);

    const empty = structuredClone(portStarboardEval.expected.ruling);
    empty.obligations = [];
    expect(rulingSchema.safeParse(empty).success).toBe(false);
  });
});
