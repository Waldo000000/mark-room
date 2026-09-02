import { describe, expect, it } from 'vitest';

import portStarboardTrainingExample from '../../../corpus/training-examples/port-starboard.json';
import { trainingExampleSchema } from '../training-example/schema';
import {
  deriveApplicableRuleQuestion,
  listApplicableRulePractice,
  scoreApplicableRuleAnswer,
} from './applicable-rule';

const validTrainingExample = () =>
  trainingExampleSchema.parse(structuredClone(portStarboardTrainingExample));
const availableRules = ['RRS 11', 'RRS 10'];

describe('applicable-rule quiz', () => {
  it('derives the answer and sorted choices from validated corpus references', () => {
    const question = deriveApplicableRuleQuestion(
      validTrainingExample(),
      'position-1',
      availableRules,
    );

    expect(question).toEqual({
      momentId: 'position-1',
      prompt: 'Which rule requires Yellow to keep clear at Position 1?',
      options: [
        { ruleReference: 'RRS 10', label: 'RRS 10' },
        { ruleReference: 'RRS 11', label: 'RRS 11' },
      ],
      answer: {
        ruleReference: 'RRS 10',
        explanation: 'RRS 10 requires Yellow to keep clear of Blue.',
        ruleRefs: ['RRS 10'],
      },
    });
  });

  it('omits questions that are ambiguous or lack a useful choice set', () => {
    const ambiguous = validTrainingExample();
    ambiguous.rulings.obligations.push({
      atMoment: 'position-1',
      boatId: 'blue',
      type: 'keep-clear',
      owedToBoatId: 'yellow',
      ruleRefs: ['RRS 11'],
    });

    expect(
      deriveApplicableRuleQuestion(
        validTrainingExample(),
        'missing-position',
        availableRules,
      ),
    ).toBeNull();
    expect(
      deriveApplicableRuleQuestion(ambiguous, 'position-1', availableRules),
    ).toBeNull();
    expect(
      deriveApplicableRuleQuestion(validTrainingExample(), 'position-1', [
        'RRS 10',
      ]),
    ).toBeNull();
  });

  it('scores rule choices deterministically', () => {
    const question = deriveApplicableRuleQuestion(
      validTrainingExample(),
      'position-1',
      availableRules,
    );
    if (!question) throw new Error('Expected applicable-rule question');

    expect(scoreApplicableRuleAnswer(question, 'RRS 10')).toMatchObject({
      isCorrect: true,
      correctRuleReference: 'RRS 10',
    });
    expect(scoreApplicableRuleAnswer(question, 'RRS 11')).toEqual({
      isCorrect: false,
      correctRuleReference: 'RRS 10',
      explanation: 'RRS 10 requires Yellow to keep clear of Blue.',
      ruleRefs: ['RRS 10'],
    });
  });

  it('caps corpus-derived choices while retaining the correct rule', () => {
    const question = deriveApplicableRuleQuestion(
      validTrainingExample(),
      'position-1',
      ['RRS 15', 'RRS 14', 'RRS 13', 'RRS 12', 'RRS 11', 'RRS 10'],
    );

    expect(question?.options.map((option) => option.ruleReference)).toEqual([
      'RRS 10',
      'RRS 11',
      'RRS 12',
      'RRS 13',
    ]);
  });

  it('lists eligible moments without exposing rule answers', () => {
    const practice = listApplicableRulePractice(
      [{ slug: 'port-starboard', trainingExample: validTrainingExample() }],
      availableRules,
    );

    expect(practice).toEqual([
      {
        slug: 'port-starboard',
        scenarioTitle: 'Port meets starboard',
        momentId: 'position-1',
        momentLabel: 'Position 1',
      },
      {
        slug: 'port-starboard',
        scenarioTitle: 'Port meets starboard',
        momentId: 'position-2',
        momentLabel: 'Position 2',
      },
    ]);
    expect(practice[0]).not.toHaveProperty('ruleRefs');
    expect(practice[0]).not.toHaveProperty('answer');
  });
});
