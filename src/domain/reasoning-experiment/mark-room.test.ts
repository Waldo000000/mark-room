import { describe, expect, it } from 'vitest';
import {
  case114MarkFacts,
  deriveMarkRoomDuties,
  MARK_GATES,
} from './mark-room';

describe('detached mark-room history', () => {
  it('derives all three source duties and the middle boat dependency after serialization', () => {
    const report = deriveMarkRoomDuties(
      JSON.parse(JSON.stringify(case114MarkFacts())),
    );
    expect(report.duties.map(({ from, to }) => [from, to])).toEqual([
      ['A', 'B'],
      ['A', 'C'],
      ['B', 'C'],
    ]);
    expect(
      report.dependencies.find((item) => item.dutyId === 'A-18.2(a)(1)-B')!
        .includes,
    ).toEqual(['B-18.2(a)(1)-C']);
  });
  it('requires historical evidence, not the current order', () => {
    const facts = case114MarkFacts();
    facts.pairs.forEach((pair) => {
      delete pair.entry;
    });
    expect(deriveMarkRoomDuties(facts).duties).toEqual([]);
    expect(
      deriveMarkRoomDuties(facts).findings.every(
        (item) => item.status === 'unresolved',
      ),
    ).toBe(true);
  });
  it('changes duties with reversed history without receiving current geometry', () => {
    const facts = case114MarkFacts();
    facts.pairs.forEach((pair) => {
      pair.entry = {
        outside: pair.entry!.inside,
        inside: pair.entry!.outside,
        overlapped: true,
      };
    });
    const report = deriveMarkRoomDuties(facts);
    expect(report.duties.map(({ from, to }) => [from, to])).toEqual([
      ['B', 'A'],
      ['C', 'A'],
      ['C', 'B'],
    ]);
    expect(
      report.dependencies.find((item) => item.dutyId === 'C-18.2(a)(1)-B')!
        .includes,
    ).toEqual(['B-18.2(a)(1)-A']);
  });
  it.each(Object.keys(MARK_GATES) as (keyof typeof MARK_GATES)[])(
    'withholds the affected pair when %s is missing or excluded',
    (key) => {
      for (const value of [undefined, false]) {
        const facts = case114MarkFacts();
        facts.pairs[2].applicability[key] = value;
        const report = deriveMarkRoomDuties(facts);
        expect(report.duties.map((item) => item.id)).toEqual([
          'A-18.2(a)(1)-B',
          'A-18.2(a)(1)-C',
        ]);
        expect(report.findings[2].reasons.length).toBeGreaterThan(0);
        expect(report.dependencies[0].includes).toEqual([]);
      }
    },
  );
  it('does not silently evaluate other entry branches or invalid identities', () => {
    for (const entry of [
      { outside: 'A', inside: 'B', overlapped: false },
      { outside: 'X', inside: 'B', overlapped: true },
    ]) {
      const facts = case114MarkFacts();
      facts.pairs[0].entry = entry;
      expect(deriveMarkRoomDuties(facts).findings[0].status).toBe('unresolved');
    }
    const facts = case114MarkFacts();
    facts.pairs.push(structuredClone(facts.pairs[0]));
    expect(
      deriveMarkRoomDuties(facts).duties.some(
        (item) => item.id === 'A-18.2(a)(1)-B',
      ),
    ).toBe(false);
  });
});
