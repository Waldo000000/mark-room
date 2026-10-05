import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  analyzeShared,
  combinations,
  deriveFindings,
  evaluateCandidate,
} from './analyze';
import { assessFindings, type FindingsPacket } from './findings';
import { hullClearance } from './geometry';
import {
  CASES,
  PROFILE,
  initialPosition,
  maneuvers,
  poseAt,
  responseOptions,
} from './model';

describe('timed luffing boundary experiment', () => {
  it.each(CASES)(
    'agrees through JSON-only and shared analysis: $id',
    (encounter) => {
      const packet = deriveFindings(encounter);
      const detached = JSON.parse(JSON.stringify(packet)) as FindingsPacket;
      const strict = assessFindings(detached);
      const shared = analyzeShared(encounter).assessment;
      expect(strict.status).toBe(shared.status);
      expect(strict.witnessId).toBe(shared.witnessId);
      expect(shared.evaluatedCandidates).toBeLessThanOrEqual(
        strict.evaluatedCandidates,
      );
    },
  );

  it('distinguishes gradual, crowded, relaxed, abrupt and delayed-response experiments', () => {
    expect(
      CASES.map(
        (encounter) => assessFindings(deriveFindings(encounter)).status,
      ),
    ).toEqual([
      'witness-found',
      'no-certified-candidate',
      'witness-found',
      'no-certified-candidate',
      'no-certified-candidate',
    ]);
    expect(deriveFindings(CASES[1]).requiredPairs).toEqual([
      ['L', 'M'],
      ['L', 'W'],
      ['M', 'W'],
    ]);
  });

  it('agrees on additional gap variants and verifies every reported witness at finer resolution', () => {
    for (const middleGap of [0.6, 0.8])
      for (const windwardGap of [0.5, 0.9]) {
        const encounter = { ...CASES[1], middleGap, windwardGap };
        const packet = deriveFindings(encounter);
        const strict = assessFindings(packet);
        const shared = analyzeShared(encounter).assessment;
        expect(strict.witnessId).toBe(shared.witnessId);
        if (strict.witnessId) {
          const choice = combinations(encounter).find(
            ({ middle, windward }) =>
              `${middle.id}/${windward?.id ?? 'none'}` === strict.witnessId,
          )!;
          expect(
            evaluateCandidate(
              encounter,
              choice.middle,
              choice.windward,
              0.0025,
            ).pairs.every(
              (pair) => pair.minimumSampledClearanceHullLengths >= 0,
            ),
          ).toBe(true);
        }
      }
  });

  it('does not turn a certificate resolution limit into contact or a sailing breach', () => {
    const packet = deriveFindings(CASES[0]);
    packet.candidates.forEach((candidate) =>
      candidate.pairs.forEach((pair) => {
        pair.status = 'resolution-limit';
      }),
    );
    expect(assessFindings(packet).status).toBe('no-certified-candidate');
    expect(JSON.stringify(assessFindings(packet))).not.toMatch(
      /breach|insufficient-room/,
    );
  });

  it('keeps the findings consumer independent of geometry and encounter code', () => {
    const source = readFileSync(
      new URL('./findings.ts', import.meta.url),
      'utf8',
    );
    expect(source).not.toMatch(/^import\s/m);
    const packet = deriveFindings(CASES[0]);
    expect(JSON.stringify(packet)).not.toMatch(
      /"(x|y|heading|rate|position|trajectory)":/,
    );
  });

  it('needs one common candidate rather than a different solution for each pair', () => {
    const pair = (boats: [string, string], clear: boolean) => ({
      boats,
      status: clear
        ? ('clearance-certified' as const)
        : ('hull-intersection' as const),
      lowerClearanceBoundHullLengths: clear ? 0.1 : -0.1,
      minimumSampledClearanceHullLengths: clear ? 0.1 : -0.1,
      limitingSampleSeconds: 1,
    });
    const packet: FindingsPacket = {
      version: 'experimental-1',
      profileId: 'test',
      caseId: 'incompatible',
      intervalSeconds: [0, 2],
      requiredPairs: [
        ['L', 'M'],
        ['M', 'W'],
      ],
      candidates: [
        {
          id: 'first',
          middleOption: 'one',
          pairs: [pair(['L', 'M'], true), pair(['M', 'W'], false)],
        },
        {
          id: 'second',
          middleOption: 'two',
          pairs: [pair(['L', 'M'], false), pair(['M', 'W'], true)],
        },
      ],
    };
    expect(assessFindings(packet).status).toBe('no-certified-candidate');
    packet.candidates[0].pairs[1] = pair(['M', 'W'], true);
    expect(assessFindings(packet).witnessId).toBe('first');
    packet.candidates[0].pairs.pop();
    expect(assessFindings(packet).status).toBe('no-certified-candidate');
  });

  it('uses the entire hull including rotation and intersection of axes', () => {
    const north = { x: 0, y: 0, heading: 0 };
    expect(hullClearance(north, { x: 0, y: 1.2, heading: 0 })).toBeCloseTo(0.2);
    expect(hullClearance(north, { x: 0.6, y: 0, heading: 0 })).toBeCloseTo(0.2);
    expect(hullClearance(north, { x: 0.6, y: 0, heading: 90 })).toBeLessThan(0);
    expect(hullClearance(north, { x: 0, y: 0, heading: 90 })).toBeCloseTo(-0.4);
    const a = { x: 1, y: 2, heading: 300 };
    const b = { x: 1.2, y: 2.6, heading: 320 };
    expect(hullClearance(a, b)).toBeCloseTo(hullClearance(b, a));
    expect(hullClearance(a, b)).toBeCloseTo(
      hullClearance(
        { x: 2, y: -1, heading: 30 },
        { x: 2.6, y: -1.2, heading: 50 },
      ),
    );
  });

  it('integrates straight travel and an exact constant-rate arc in hull lengths', () => {
    const initial = { x: 0, y: 0 };
    const turn = { start: 1, rate: 30 };
    expect(poseAt(initial, turn, 0)).toEqual({ x: 0, y: 0, heading: 300 });
    const before = poseAt(initial, turn, 1);
    expect(before.x).toBeCloseTo(-Math.sqrt(3) * 0.4);
    expect(before.y).toBeCloseTo(0.4);
    expect(poseAt(initial, turn, 2.5).heading).toBeCloseTo(345);
    expect(poseAt(initial, turn, 5).heading).toBeCloseTo(345);
    const distance = Math.hypot(
      poseAt(initial, turn, 5).x - poseAt(initial, turn, 4).x,
      poseAt(initial, turn, 5).y - poseAt(initial, turn, 4).y,
    );
    expect(distance).toBeCloseTo(PROFILE.speed);
  });

  it('activates each response after the triggering action', () => {
    const encounter = CASES[1];
    for (const { middle, windward } of combinations(encounter)) {
      const turns = maneuvers(encounter, middle, windward);
      expect(turns.M.start).toBeGreaterThan(turns.L.start);
      expect(turns.W.start).toBeGreaterThan(turns.M.start);
      expect(
        poseAt(initialPosition(encounter, 'M'), turns.M, encounter.luffStart)
          .heading,
      ).toBeCloseTo(300);
    }
    // Search is still retrospective. This verifies causal activation of each
    // candidate, not a universally successful online choice between candidates.
  });

  it('certifies clearance between samples with a motion bound, never just non-contact samples', () => {
    const encounter = CASES[0];
    const option = responseOptions()[1];
    const fine = evaluateCandidate(encounter, option, undefined, 0.005);
    const coarse = evaluateCandidate(encounter, option, undefined, 0.5);
    expect(coarse.pairs[0].lowerClearanceBoundHullLengths).toBeLessThan(
      coarse.pairs[0].minimumSampledClearanceHullLengths,
    );
    expect(coarse.pairs[0].minimumSampledClearanceHullLengths).toBeGreaterThan(
      0,
    );
    expect(coarse.pairs[0].status).toBe('resolution-limit');
    expect(fine.pairs[0].status).toBe('clearance-certified');
    expect(() => evaluateCandidate(encounter, option, undefined, 0)).toThrow(
      'Invalid assessment step',
    );
  });
});
