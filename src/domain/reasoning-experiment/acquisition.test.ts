import { describe, expect, it } from 'vitest';
import { analyzeAcquisition, case93AcquisitionFacts } from './acquisition';

function statuses(packet = case93AcquisitionFacts()) {
  return Object.fromEntries(
    analyzeAcquisition(JSON.parse(JSON.stringify(packet))).findings.map(
      (item) => [item.id, item.status],
    ),
  );
}
describe('right-of-way acquisition from event history', () => {
  it('does not assume Rule 11 or 12 while completion of tacking is unestablished', () => {
    const facts = case93AcquisitionFacts();
    delete facts.evidence.noTackingDuty;
    expect(statuses(facts)).toMatchObject({
      'before-duty': 'unresolved',
      'current-duty': 'unresolved',
      acquisition: 'unresolved',
    });
  });
  it('derives the bounded source episode with breaches and exoneration separate', () => {
    const result = statuses();
    expect(Object.values(result).every((item) => item === 'supported')).toBe(
      true,
    );
    expect(result['breach-11']).toBe('supported');
    expect(result.exoneration).toBe('supported');
  });
  it('missing history withholds acquisition but preserves current independent duties', () => {
    const facts = case93AcquisitionFacts();
    delete facts.evidence.beforeAstern;
    expect(statuses(facts)).toMatchObject({
      acquisition: 'unresolved',
      'room-15': 'unresolved',
      'breach-15': 'unresolved',
      'current-duty': 'supported',
      'room-16': 'supported',
      'breach-16': 'supported',
      exoneration: 'supported',
    });
  });
  it('the other-boat action exception does not remove the separate course-change duty', () => {
    const facts = case93AcquisitionFacts();
    facts.evidence.causedByOther!.value = true;
    expect(statuses(facts)).toMatchObject({
      acquisition: 'supported',
      'room-15': 'not-supported',
      'breach-15': 'not-supported',
      'room-16': 'supported',
      'breach-16': 'supported',
    });
  });
  it('does not infer insufficient room from missing response evidence', () => {
    const facts = case93AcquisitionFacts();
    delete facts.evidence.noResponse;
    expect(statuses(facts)).toMatchObject({
      'room-15': 'supported',
      'room-16': 'supported',
      'breach-15': 'unresolved',
      'breach-16': 'unresolved',
    });
  });
  it('does not turn missing initial-period scope into an arbitrary seconds threshold', () => {
    const facts = case93AcquisitionFacts();
    delete facts.evidence.initialPeriod;
    expect(statuses(facts)).toMatchObject({
      'breach-15': 'unresolved',
      'breach-16': 'supported',
    });
    facts.evidence.initialPeriod = {
      value: false,
      basis: 'diagnostic',
      explanation: 'Outside the initial period.',
    };
    expect(statuses(facts)['breach-15']).toBe('not-supported');
  });
  it('acquisition can require initial room even without a course change', () => {
    const facts = case93AcquisitionFacts();
    facts.evidence.changesCourse!.value = false;
    expect(statuses(facts)).toMatchObject({
      'room-15': 'supported',
      'room-16': 'not-supported',
    });
  });
  it('withholds exoneration without entitlement assessment, not the established breach', () => {
    const facts = case93AcquisitionFacts();
    delete facts.evidence.withinRoom;
    expect(statuses(facts)).toMatchObject({
      'breach-11': 'supported',
      exoneration: 'unresolved',
    });
  });
  it('does not carry an initial entitlement indefinitely after acquisition', () => {
    const facts = case93AcquisitionFacts();
    facts.evidence.changesCourse!.value = false;
    facts.evidence.initialPeriod!.value = false;
    expect(statuses(facts)).toMatchObject({
      'room-15': 'supported',
      'room-entitlement': 'not-supported',
      exoneration: 'not-supported',
    });
  });
  it('uses facts and roles, not the source episode ID, and rejects identical participants', () => {
    const facts = case93AcquisitionFacts();
    facts.episodeId = 'another-example';
    facts.boats = { leeward: 'X', windward: 'Y' };
    expect(statuses(facts)).toEqual(statuses());
    expect(analyzeAcquisition(facts).findings[0].label).toContain(
      'X must keep clear of Y',
    );
    facts.boats.windward = 'X';
    expect(analyzeAcquisition(facts).diagnostics).toHaveLength(1);
    expect(
      Object.values(statuses(facts)).every((item) => item === 'unresolved'),
    ).toBe(true);
  });
});
