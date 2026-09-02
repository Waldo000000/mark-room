import { describe, expect, it } from 'vitest';

import leewardMarkOverlapTrainingExample from '../../../corpus/training-examples/leeward-mark-overlap.json';
import { trainingExampleSchema } from '../training-example/schema';
import {
  deriveMarkRoomQuestion,
  listMarkRoomPractice,
  scoreMarkRoomAnswer,
} from './mark-room';

const validTrainingExample = () =>
  trainingExampleSchema.parse(
    structuredClone(leewardMarkOverlapTrainingExample),
  );

describe('mark-room quiz', () => {
  it('derives the boat owed mark-room from one structured obligation', () => {
    const question = deriveMarkRoomQuestion(
      validTrainingExample(),
      'position-1',
    );

    expect(question).toEqual({
      momentId: 'position-1',
      prompt: 'Which boat is owed mark-room at First boat reaches the zone?',
      options: [
        { boatId: 'blue', label: 'Blue' },
        { boatId: 'yellow', label: 'Yellow' },
      ],
      answer: {
        boatId: 'blue',
        explanation: 'Blue is owed mark-room from Yellow.',
        ruleRefs: ['RRS 18.2(a)(1)'],
      },
    });
  });

  it('does not create a question without one unambiguous obligation', () => {
    const trainingExample = validTrainingExample();
    trainingExample.rulings.obligations.push({
      atMoment: 'position-1',
      boatId: 'blue',
      type: 'give-mark-room',
      owedToBoatId: 'yellow',
      ruleRefs: ['RRS test'],
    });

    expect(
      deriveMarkRoomQuestion(validTrainingExample(), 'missing-position'),
    ).toBeNull();
    expect(deriveMarkRoomQuestion(trainingExample, 'position-1')).toBeNull();
  });

  it('scores correct and incorrect boat choices deterministically', () => {
    const question = deriveMarkRoomQuestion(
      validTrainingExample(),
      'position-1',
    );
    if (!question) throw new Error('Expected mark-room question');

    expect(scoreMarkRoomAnswer(question, 'blue')).toMatchObject({
      isCorrect: true,
      correctBoatId: 'blue',
    });
    expect(scoreMarkRoomAnswer(question, 'yellow')).toEqual({
      isCorrect: false,
      correctBoatId: 'blue',
      explanation: 'Blue is owed mark-room from Yellow.',
      ruleRefs: ['RRS 18.2(a)(1)'],
    });
  });

  it('lists eligible moments without exposing answers or rule references', () => {
    const practice = listMarkRoomPractice([
      {
        slug: 'leeward-mark-overlap',
        trainingExample: validTrainingExample(),
      },
    ]);

    expect(practice).toEqual([
      {
        slug: 'leeward-mark-overlap',
        scenarioTitle: 'Inside overlap at a leeward mark',
        momentId: 'position-1',
        momentLabel: 'First boat reaches the zone',
      },
      {
        slug: 'leeward-mark-overlap',
        scenarioTitle: 'Inside overlap at a leeward mark',
        momentId: 'position-2',
        momentLabel: 'Approaching the mark',
      },
    ]);
    expect(practice[0]).not.toHaveProperty('answer');
    expect(practice[0]).not.toHaveProperty('boatId');
    expect(practice[0]).not.toHaveProperty('ruleRefs');
  });
});
