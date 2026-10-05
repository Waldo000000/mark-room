import { describe, expect, it } from 'vitest';
import {
  deriveFindings,
  evaluateCandidate,
  combinations,
} from '../derivation-experiment/analyze';
import {
  assessCompatibility,
  assessFindings,
} from '../derivation-experiment/findings';
import {
  CASES,
  initialPosition,
  maneuvers,
  poseAt,
  responseOptions,
} from '../derivation-experiment/model';
import { CASE_114_LUFF_FACTS, deriveLuffingDuties } from './group-duties';

describe('linked three-boat assessments', () => {
  it('includes the recipient duties in the source-backed room obligation', () => {
    const report = deriveLuffingDuties(
      JSON.parse(JSON.stringify(CASE_114_LUFF_FACTS)),
    );
    expect(report.duties).toHaveLength(6);
    expect(
      report.dependencies.find((item) => item.dutyId === 'L-16.1-M')!.includes,
    ).toEqual(['M-11-L', 'M-16.1-W']);
    expect(report.duties).toContainEqual({
      id: 'L-16.1-W',
      from: 'L',
      to: 'W',
      kind: 'give-room',
      rule: '16.1',
    });
  });

  it('does not assume an unestablished course change for the middle boat', () => {
    const report = deriveLuffingDuties({
      ...CASE_114_LUFF_FACTS,
      courseChanges: { L: true },
    });
    expect(report.duties.some((item) => item.id === 'M-16.1-W')).toBe(false);
    expect(report.unresolved).toContain(
      'M course change toward W: not established.',
    );
    expect(report.duties.some((item) => item.id === 'L-16.1-M')).toBe(true);
  });

  it('refuses to silently extend this family to unknown overlap or applicability', () => {
    for (const key of [
      'allOverlapped',
      'sameTack',
      'sectionAApplies',
    ] as const) {
      expect(
        deriveLuffingDuties({ ...CASE_114_LUFF_FACTS, [key]: undefined })
          .duties,
      ).toEqual([]);
    }
  });

  it('demonstrates pairwise success without a compatible joint physical response', () => {
    const encounter = CASES.find((item) => item.id === 'three-incompatible')!;
    const packet = deriveFindings(encounter);
    const report = assessCompatibility(JSON.parse(JSON.stringify(packet)));
    expect(report.eachPairHasCandidate).toBe(true);
    expect(report.pairs.map((pair) => pair.candidateCount)).toEqual([
      36, 42, 3,
    ]);
    expect(report.jointCandidateCount).toBe(0);
    const lm = report.pairs[0].middleOptions;
    const mw = report.pairs[2].middleOptions;
    expect(lm.some((id) => mw.includes(id))).toBe(false);
    // Recheck every marginal witness at finer resolution; the discrepancy is
    // not introduced by promoting an unresolved sample into a certificate.
    for (const pair of packet.requiredPairs) {
      const witness = packet.candidates.find((candidate) =>
        candidate.pairs.some(
          (item) =>
            item.boats.join('/') === pair.join('/') &&
            item.status === 'clearance-certified',
        ),
      )!;
      const choice = combinations(encounter).find(
        (item) => `${item.middle.id}/${item.windward!.id}` === witness.id,
      )!;
      expect(
        evaluateCandidate(
          encounter,
          choice.middle,
          choice.windward,
          0.0025,
        ).pairs.find((item) => item.boats.join('/') === pair.join('/'))!.status,
      ).toBe('clearance-certified');
    }
  });

  it('preserves L/M assessment while moving the third boat changes joint feasibility', () => {
    const close = deriveFindings(
      CASES.find((item) => item.id === 'three-incompatible')!,
    );
    const open = deriveFindings(
      CASES.find((item) => item.id === 'three-open')!,
    );
    expect(close.candidates.map((item) => item.pairs[0])).toEqual(
      open.candidates.map((item) => item.pairs[0]),
    );
    expect(assessCompatibility(open).jointCandidateCount).toBeGreaterThan(0);
    expect(assessFindings(close).status).toBe('no-certified-candidate');
  });

  it('does not elevate full-future witnesses into a claim about available knowledge', () => {
    const gradual = { ...CASES[0], luffStart: 1 };
    const abrupt = { ...gradual, luffRate: 90 };
    const option = responseOptions()[0];
    const a = maneuvers(gradual, option);
    const b = maneuvers(abrupt, option);
    for (const time of [0, 0.5, 1]) {
      expect(poseAt(initialPosition(gradual, 'L'), a.L, time)).toEqual(
        poseAt(initialPosition(abrupt, 'L'), b.L, time),
      );
    }
    const first = assessCompatibility(deriveFindings(gradual));
    const second = assessCompatibility(deriveFindings(abrupt));
    expect(first.jointCandidateCount).toBeGreaterThan(0);
    expect(second.jointCandidateCount).toBe(0);
    for (const report of [first, second])
      expect(report.causalAvailability).toBe('not-established');
  });

  it('a declared distant third boat leaves the two-boat assessment possible', () => {
    const distant = { ...CASES[1], windwardGap: 20 };
    expect(
      assessCompatibility(deriveFindings(distant)).jointCandidateCount,
    ).toBeGreaterThan(0);
    expect(assessFindings(deriveFindings(CASES[0])).status).toBe(
      'witness-found',
    );
  });
});
