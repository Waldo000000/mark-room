import { describe, expect, it } from 'vitest';

import portStarboardTrainingExample from '../../../corpus/training-examples/port-starboard.json';
import { trainingExampleSchema } from '../training-example/schema';
import { deriveKeepClearQuestion, scoreKeepClearAnswer } from './keep-clear';

const validTrainingExample = () =>
  trainingExampleSchema.parse(structuredClone(portStarboardTrainingExample));

describe('keep-clear quiz', () => {
  it('derives one answer from the structured obligation at a moment', () => {
    const question = deriveKeepClearQuestion(
      validTrainingExample(),
      'position-1',
    );

    expect(question).toEqual({
      momentId: 'position-1',
      prompt: 'Which boat must keep clear at Position 1?',
      options: [
        { boatId: 'blue', label: 'Blue' },
        { boatId: 'yellow', label: 'Yellow' },
      ],
      answer: {
        boatId: 'yellow',
        explanation: 'Yellow must keep clear of Blue.',
        ruleRefs: ['RRS 10'],
      },
    });
  });

  it('does not create a question without one unambiguous obligation', () => {
    const trainingExample = validTrainingExample();
    trainingExample.rulings.obligations.push({
      atMoment: 'position-1',
      boatId: 'blue',
      type: 'keep-clear',
      owedToBoatId: 'yellow',
      ruleRefs: ['RRS test'],
    });

    expect(
      deriveKeepClearQuestion(validTrainingExample(), 'missing-position'),
    ).toBeNull();
    expect(deriveKeepClearQuestion(trainingExample, 'position-1')).toBeNull();
  });

  it('scores correct and incorrect boat choices deterministically', () => {
    const question = deriveKeepClearQuestion(
      validTrainingExample(),
      'position-1',
    );
    if (!question) throw new Error('Expected keep-clear question');

    expect(scoreKeepClearAnswer(question, 'yellow')).toMatchObject({
      isCorrect: true,
      correctBoatId: 'yellow',
    });
    expect(scoreKeepClearAnswer(question, 'blue')).toEqual({
      isCorrect: false,
      correctBoatId: 'yellow',
      explanation: 'Yellow must keep clear of Blue.',
      ruleRefs: ['RRS 10'],
    });
  });
});
