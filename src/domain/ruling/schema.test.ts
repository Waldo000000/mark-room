import { describe, expect, it } from 'vitest';

import portStarboardEvalCase from '../../../corpus/eval-cases/port-starboard.json';
import { rulingSchema, type Ruling } from './schema';

const portStarboardRuling = portStarboardEvalCase.expected.ruling;

describe('rulingSchema', () => {
  it('validates structured obligations without prose or statement IDs', () => {
    const ruling: Ruling = rulingSchema.parse(portStarboardRuling);
    const obligation = ruling.obligations[0];

    expect(obligation.type).toBe('keep-clear');
    expect(obligation).not.toHaveProperty('id');
    expect(obligation).not.toHaveProperty('explanation');
    expect(ruling).not.toHaveProperty('conclusion');
  });

  it('rejects an empty ruling', () => {
    expect(
      rulingSchema.safeParse({
        schemaVersion: '0.1.0',
        obligations: [],
        outcomes: [],
      }).success,
    ).toBe(false);
  });

  it('requires the boat owed each obligation', () => {
    const ruling = structuredClone(portStarboardRuling);
    const obligation = ruling.obligations[0] as Record<string, unknown>;
    delete obligation.owedToBoatId;

    expect(rulingSchema.safeParse(ruling).success).toBe(false);
  });

  it('rejects presentation prose', () => {
    const ruling = structuredClone(portStarboardRuling) as Record<
      string,
      unknown
    >;
    ruling.conclusion = 'Yellow must keep clear.';

    expect(rulingSchema.safeParse(ruling).success).toBe(false);
  });
});
