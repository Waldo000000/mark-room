import { describe, expect, it } from 'vitest';

import type { Obligation, Outcome, Ruling } from '@/src/domain/ruling/schema';
import {
  describeObligation,
  describeOutcome,
  selectRulingStatements,
} from './ruling-presentation';

const boatLabels = new Map([
  ['alpha', 'Alpha'],
  ['bravo', 'Bravo'],
]);

const obligationBase: Omit<Obligation, 'type'> = {
  atMoment: 'position-1',
  boatId: 'alpha',
  owedToBoatId: 'bravo',
  ruleRefs: ['RRS test'],
};

const outcomeBase: Omit<Outcome, 'type'> = {
  atMoment: 'position-1',
  boatId: 'alpha',
  ruleRefs: ['RRS test'],
};

describe('ruling presentation', () => {
  it.each([
    ['keep-clear', 'Alpha must keep clear of Bravo.'],
    ['give-room', 'Alpha must give room to Bravo.'],
    ['give-mark-room', 'Alpha must give mark-room to Bravo.'],
    ['avoid-contact', 'Alpha must avoid contact with Bravo.'],
  ] satisfies [Obligation['type'], string][])('%s obligation', (type, text) => {
    expect(describeObligation({ ...obligationBase, type }, boatLabels)).toBe(
      text,
    );
  });

  it.each([
    ['rule-breached', 'Alpha: rule breach recorded.'],
    ['exonerated', 'Alpha: exoneration recorded.'],
    ['penalty', 'Alpha: penalty recorded.'],
    ['no-breach', 'Alpha: no breach recorded.'],
  ] satisfies [Outcome['type'], string][])('%s outcome', (type, text) => {
    expect(describeOutcome({ ...outcomeBase, type }, boatLabels)).toBe(text);
  });

  it('selects every obligation and outcome at the requested moment', () => {
    const ruling: Ruling = {
      schemaVersion: '0.1.0',
      obligations: [
        { ...obligationBase, type: 'keep-clear' },
        { ...obligationBase, type: 'avoid-contact' },
      ],
      outcomes: [
        { ...outcomeBase, type: 'rule-breached' },
        { ...outcomeBase, type: 'penalty' },
        { ...outcomeBase, atMoment: 'position-2', type: 'no-breach' },
      ],
    };

    const selected = selectRulingStatements(ruling, 'position-1');

    expect(selected.obligations).toHaveLength(2);
    expect(selected.outcomes).toHaveLength(2);
    expect(selected.outcomes.map((outcome) => outcome.type)).toEqual([
      'rule-breached',
      'penalty',
    ]);
  });
});
