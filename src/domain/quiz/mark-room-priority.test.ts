import { describe, expect, it } from 'vitest';

import clearAhead from '../../../corpus/training-examples/leeward-mark-clear-ahead.json';
import { trainingExampleSchema } from '../training-example/schema';
import {
  deriveApplicableRuleQuestion,
  listApplicableRulePractice,
} from './applicable-rule';
import { deriveKeepClearQuestion, listKeepClearPractice } from './keep-clear';
import { deriveMarkRoomQuestion } from './mark-room';

describe('mark-room quiz priority', () => {
  const example = trainingExampleSchema.parse(clearAhead);
  const sources = [
    { slug: 'leeward-mark-clear-ahead', trainingExample: example },
  ];
  const rules = ['RRS 11', 'RRS 12'];

  it.each(['position-1', 'position-2'])(
    'suppresses both keep-clear variants at %s',
    (momentId) => {
      expect(deriveKeepClearQuestion(example, momentId)).toBeNull();
      expect(deriveApplicableRuleQuestion(example, momentId, rules)).toBeNull();
      expect(deriveMarkRoomQuestion(example, momentId)?.answer.boatId).toBe(
        'blue',
      );
    },
  );

  it('omits mark-room moments from both keep-clear practice lists', () => {
    expect(listKeepClearPractice(sources)).toEqual([]);
    expect(listApplicableRulePractice(sources, rules)).toEqual([]);
  });

  it('explains the simultaneous keep-clear obligation without cancelling it', () => {
    const question = deriveMarkRoomQuestion(example, 'position-2');
    expect(question?.answer).toEqual({
      boatId: 'blue',
      explanation:
        'Blue is owed mark-room from Yellow. Blue must still keep clear of Yellow under RRS 11; the mark-room obligation does not remove that keep-clear obligation.',
      ruleRefs: ['RRS 18.2(a)(2)', 'RRS 11'],
    });
  });

  it('does not let a different moment suppress a keep-clear question', () => {
    const modified = structuredClone(example);
    modified.rulings.obligations = modified.rulings.obligations.filter(
      (obligation) =>
        obligation.atMoment !== 'position-2' ||
        obligation.type !== 'give-mark-room',
    );
    expect(deriveKeepClearQuestion(modified, 'position-2')?.answer.boatId).toBe(
      'blue',
    );
    expect(
      deriveApplicableRuleQuestion(modified, 'position-2', rules)?.answer
        .ruleReference,
    ).toBe('RRS 11');
  });
});
