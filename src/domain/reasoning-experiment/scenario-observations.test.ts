import { describe, expect, it } from 'vitest';
import { analyzeFacts } from './analyze';
import {
  observeScenario,
  prerequisiteInventory,
  scenarioPairFacts,
} from './scenario-observations';
import { syntheticScenario } from './synthetic-scenario';

describe('bounded Scenario observations', () => {
  it('reports only hails recorded at the selected position without inventing recipients', () => {
    const scenario = syntheticScenario();
    scenario.observedEvents = [
      {
        id: 'hail-1',
        type: 'hail',
        boatId: 's',
        atKeyframe: 'middle',
        message: 'Room to tack',
      },
    ];
    expect(observeScenario(scenario, 'before').hails).toEqual([]);
    expect(observeScenario(scenario, 'middle').hails).toEqual([
      { id: 'hail-1', boatId: 's', message: 'Room to tack' },
    ]);
    scenario.observedEvents = [];
    expect(observeScenario(scenario, 'middle').hails).toEqual([]);
  });
  it('derives pair observations in hull lengths at the selected keyframe', () => {
    const observations = observeScenario(syntheticScenario(), 'middle');
    expect(observations.pairs[0]).toMatchObject({
      boatIds: ['s', 'p'],
      oppositeTacks: true,
    });
    expect(observations.pairs[0].centerSeparation).toBeCloseTo(Math.sqrt(10));
    expect(observations.changes[0].headingDifference).toBe(15);
    expect(observations.changes[0].displacement).toBeCloseTo(Math.sqrt(2));
  });

  it('changes only the timing-dependent measurement when durations change', () => {
    const scenario = syntheticScenario();
    const fast = observeScenario(scenario, 'middle', 1);
    const slow = observeScenario(scenario, 'middle', 4);
    const untimed = observeScenario(scenario, 'middle');
    expect(fast.pairs).toEqual(slow.pairs);
    expect(fast.changes[0].displacementRate).toBeCloseTo(
      slow.changes[0].displacementRate! * 4,
    );
    expect(untimed.changes[0].displacementRate).toBeNull();
    expect(untimed.changes[0].assumedSeconds).toBeNull();
    expect(
      analyzeFacts(scenarioPairFacts(scenario, fast.keyframeId, ['s', 'p'])),
    ).toEqual(
      analyzeFacts(scenarioPairFacts(scenario, slow.keyframeId, ['s', 'p'])),
    );
  });

  it('does not create a course-change or room premise from heading changes', () => {
    const scenario = syntheticScenario();
    const packet = scenarioPairFacts(scenario, 'middle', ['s', 'p']);
    expect(packet.facts.map((fact) => fact.key)).toEqual([
      'opposite-tacks',
      'starboard-role',
    ]);
    expect(
      prerequisiteInventory(packet).find(
        (item) => item.key === 'course-changed',
      )!.basis,
    ).toBe('unresolved');
    expect(
      analyzeFacts(packet).findings.every(
        (finding) => finding.status === 'unresolved',
      ),
    ).toBe(true);
  });

  it('shows a conditional snapshot duty only with explicit applicability assumption', () => {
    const scenario = syntheticScenario();
    const packet = scenarioPairFacts(scenario, 'middle', ['s', 'p'], true);
    const report = analyzeFacts(JSON.parse(JSON.stringify(packet)));
    expect(report.findings[0]).toMatchObject({
      status: 'supported',
      assumptions: ['rules-apply'],
    });
    expect(
      report.findings
        .slice(1)
        .every((finding) => finding.status === 'unresolved'),
    ).toBe(true);
    expect(packet.episodeId).toBe('synthetic-opposing-tacks:middle');
  });

  it('recomputes changed tack and position rather than retaining old facts', () => {
    const scenario = syntheticScenario();
    const prior = observeScenario(scenario, 'middle');
    const changed = structuredClone(scenario);
    changed.keyframes[1].boatStates[1].tack = 'starboard';
    changed.keyframes[1].boatStates[1].headingDegrees = 300;
    changed.keyframes[1].boatStates[1].position.x = 1;
    const next = observeScenario(changed, 'middle');
    expect(next.pairs[0].oppositeTacks).toBe(false);
    expect(next.pairs[0].centerSeparation).not.toBe(
      prior.pairs[0].centerSeparation,
    );
    expect(
      scenarioPairFacts(changed, 'middle', ['s', 'p']).facts[0].value,
    ).toBe(false);
  });

  it('has no previous interval at the first keyframe', () => {
    expect(observeScenario(syntheticScenario(), 'before', 1).changes).toEqual(
      [],
    );
  });

  it('reports endpoint angular difference across north without inferring a turn path', () => {
    const scenario = syntheticScenario();
    scenario.keyframes[0].boatStates[0].headingDegrees = 350;
    scenario.keyframes[1].boatStates[0].headingDegrees = 10;
    expect(
      observeScenario(scenario, 'middle').changes[0].headingDifference,
    ).toBe(20);
  });

  it('does not retain pair findings when a participant is removed', () => {
    const scenario = syntheticScenario();
    scenario.boats = scenario.boats.slice(0, 1);
    for (const frame of scenario.keyframes)
      frame.boatStates = frame.boatStates.slice(0, 1);
    const observations = observeScenario(scenario, 'middle');
    expect(observations.pairs).toEqual([]);
    expect(() => scenarioPairFacts(scenario, 'middle', ['s', 'p'])).toThrow(
      'Two distinct',
    );
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects invalid assumed duration %s',
    (seconds) => {
      expect(() =>
        observeScenario(syntheticScenario(), 'middle', seconds),
      ).toThrow('positive and finite');
    },
  );
});
