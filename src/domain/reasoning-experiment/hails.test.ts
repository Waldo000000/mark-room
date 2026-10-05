import { describe, expect, it } from 'vitest';
import { analyzeHails, case113HailFacts } from './hails';

describe('linked hail duties', () => {
  it('keeps the official relay answer conditional rather than inventing an actual breach', () => {
    const report = analyzeHails(JSON.parse(JSON.stringify(case113HailFacts())));
    expect(report.map((item) => item.status)).toEqual([
      'supported',
      'supported',
      'supported',
      'conditional',
    ]);
    expect(report.some((item) => item.label.includes('breaks'))).toBe(false);
  });
  it('requires M to relay only in the established not-yet-responding branch', () => {
    expect(
      analyzeHails({ ...case113HailFacts(), wAlreadyResponding: false })[3]
        .status,
    ).toBe('supported');
    const responding = analyzeHails({
      ...case113HailFacts(),
      wAlreadyResponding: true,
    });
    expect(responding[3].status).toBe('not-required-in-this-branch');
    expect(responding[2].status).toBe('supported');
  });
  it('does not derive hearing or a need to act from proximity', () => {
    for (const key of ['heardByW', 'wMustRespondBeforeLCanTack'] as const) {
      const facts = case113HailFacts();
      delete facts[key];
      const report = analyzeHails(facts);
      expect(report[1].status).toBe('unresolved');
      expect(report[0].status).toBe('supported');
    }
  });
  it('requires M’s response and handling constraints before declaring the relay branch', () => {
    for (const key of [
      'heardByM',
      'mCannotReplyYouTack',
      'mNeedsWToTack',
    ] as const) {
      const facts = case113HailFacts();
      delete facts[key];
      expect(analyzeHails(facts)[3].status).toBe('unresolved');
    }
  });
  it('requires a response even if the hail breaks Rule 20.1', () => {
    expect(
      analyzeHails({ ...case113HailFacts(), hailMeetsRule201: false }),
    ).toEqual(analyzeHails(case113HailFacts()));
  });
  it('requires established context and a hail but no source ID lookup', () => {
    expect(
      analyzeHails({ ...case113HailFacts(), episodeId: 'different' }),
    ).toEqual(analyzeHails(case113HailFacts()));
    expect(
      analyzeHails({
        ...case113HailFacts(),
        roomToTackHailMade: undefined,
      }).every((item) => item.status === 'unresolved'),
    ).toBe(true);
  });
});
