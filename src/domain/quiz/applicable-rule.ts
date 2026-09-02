import type { TrainingExample } from '../training-example/schema';

export type ApplicableRuleQuizQuestion = {
  momentId: string;
  prompt: string;
  options: { ruleReference: string; label: string }[];
  answer: {
    ruleReference: string;
    explanation: string;
    ruleRefs: string[];
  };
};

export type ApplicableRuleQuizResult = {
  isCorrect: boolean;
  correctRuleReference: string;
  explanation: string;
  ruleRefs: string[];
};

type ApplicableRulePracticeSource = {
  slug: string;
  trainingExample: TrainingExample;
};

export type ApplicableRulePracticeItem = {
  slug: string;
  scenarioTitle: string;
  momentId: string;
  momentLabel: string;
};

export function deriveApplicableRuleQuestion(
  trainingExample: TrainingExample,
  momentId: string,
  availableRuleReferences: readonly string[],
): ApplicableRuleQuizQuestion | null {
  const obligations = trainingExample.rulings.obligations.filter(
    (obligation) =>
      obligation.atMoment === momentId && obligation.type === 'keep-clear',
  );

  if (obligations.length !== 1 || obligations[0].ruleRefs.length !== 1) {
    return null;
  }

  const obligation = obligations[0];
  const moment = trainingExample.situation.moments.find(
    (candidate) => candidate.id === momentId,
  );
  const boatLabels = new Map(
    trainingExample.scenario.boats.map((boat) => [boat.id, boat.label]),
  );
  const boatLabel = boatLabels.get(obligation.boatId);
  const owedToBoatLabel = boatLabels.get(obligation.owedToBoatId);
  const ruleReference = obligation.ruleRefs[0];
  const corpusRuleReferences = [...new Set(availableRuleReferences)].sort();

  if (
    !moment ||
    !boatLabel ||
    !owedToBoatLabel ||
    corpusRuleReferences.length < 2 ||
    !corpusRuleReferences.includes(ruleReference)
  ) {
    return null;
  }

  const options = [
    ruleReference,
    ...corpusRuleReferences
      .filter((candidate) => candidate !== ruleReference)
      .slice(0, 3),
  ].sort();

  return {
    momentId,
    prompt: `Which rule requires ${boatLabel} to keep clear at ${moment.label}?`,
    options: options.map((candidate) => ({
      ruleReference: candidate,
      label: candidate,
    })),
    answer: {
      ruleReference,
      explanation: `${ruleReference} requires ${boatLabel} to keep clear of ${owedToBoatLabel}.`,
      ruleRefs: [ruleReference],
    },
  };
}

export function scoreApplicableRuleAnswer(
  question: ApplicableRuleQuizQuestion,
  selectedRuleReference: string,
): ApplicableRuleQuizResult {
  return {
    isCorrect: selectedRuleReference === question.answer.ruleReference,
    correctRuleReference: question.answer.ruleReference,
    explanation: question.answer.explanation,
    ruleRefs: [...question.answer.ruleRefs],
  };
}

export function listApplicableRulePractice(
  sources: readonly ApplicableRulePracticeSource[],
  availableRuleReferences: readonly string[],
): ApplicableRulePracticeItem[] {
  return sources.flatMap(({ slug, trainingExample }) =>
    trainingExample.situation.moments.flatMap((moment) => {
      const question = deriveApplicableRuleQuestion(
        trainingExample,
        moment.id,
        availableRuleReferences,
      );
      if (!question) return [];

      return [
        {
          slug,
          scenarioTitle: trainingExample.scenario.title,
          momentId: moment.id,
          momentLabel: moment.label,
        },
      ];
    }),
  );
}
