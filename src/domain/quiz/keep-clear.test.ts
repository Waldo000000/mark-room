import { describe, expect, it } from 'vitest';

import portStarboardTrainingExample from '../../../corpus/training-examples/port-starboard.json';
import { trainingExampleSchema } from '../training-example/schema';
import {
  deriveKeepClearQuestion,
  listKeepClearPractice,
  scoreKeepClearAnswer,
} from './keep-clear';

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

  it('lists every eligible moment without exposing answer data', () => {
    const practice = listKeepClearPractice([
      { slug: 'port-starboard', trainingExample: validTrainingExample() },
    ]);

    expect(practice).toEqual([
      {
        slug: 'port-starboard',
        scenarioTitle: 'Port meets starboard',
        momentId: 'position-1',
        momentLabel: 'Position 1',
        ruleRefs: ['RRS 10'],
      },
      {
        slug: 'port-starboard',
        scenarioTitle: 'Port meets starboard',
        momentId: 'position-2',
        momentLabel: 'Position 2',
        ruleRefs: ['RRS 10'],
      },
    ]);
    expect(practice[0]).not.toHaveProperty('answer');
    expect(practice[0]).not.toHaveProperty('correctBoatId');
  });

  it('omits ambiguous moments while preserving source and moment order', () => {
    const ambiguous = validTrainingExample();
    ambiguous.rulings.obligations.push({
      atMoment: 'position-1',
      boatId: 'blue',
      type: 'keep-clear',
      owedToBoatId: 'yellow',
      ruleRefs: ['RRS test'],
    });

    expect(
      listKeepClearPractice([
        { slug: 'ambiguous', trainingExample: ambiguous },
        { slug: 'eligible', trainingExample: validTrainingExample() },
      ]).map(({ momentId, slug }) => `${slug}:${momentId}`),
    ).toEqual([
      'ambiguous:position-2',
      'eligible:position-1',
      'eligible:position-2',
    ]);
  });
});
