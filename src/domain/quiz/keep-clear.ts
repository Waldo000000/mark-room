import type { TrainingExample } from '../training-example/schema';

export type KeepClearQuizQuestion = {
  momentId: string;
  prompt: string;
  options: { boatId: string; label: string }[];
  answer: {
    boatId: string;
    explanation: string;
    ruleRefs: string[];
  };
};

export type KeepClearQuizResult = {
  isCorrect: boolean;
  correctBoatId: string;
  explanation: string;
  ruleRefs: string[];
};

type KeepClearPracticeSource = {
  slug: string;
  trainingExample: TrainingExample;
};

export type KeepClearPracticeItem = {
  slug: string;
  scenarioTitle: string;
  momentId: string;
  momentLabel: string;
  ruleRefs: string[];
};

export function deriveKeepClearQuestion(
  trainingExample: TrainingExample,
  momentId: string,
): KeepClearQuizQuestion | null {
  const obligations = trainingExample.rulings.obligations.filter(
    (obligation) =>
      obligation.atMoment === momentId && obligation.type === 'keep-clear',
  );

  if (obligations.length !== 1) return null;

  const obligation = obligations[0];
  const moment = trainingExample.situation.moments.find(
    (candidate) => candidate.id === momentId,
  );
  const boatLabels = new Map(
    trainingExample.scenario.boats.map((boat) => [boat.id, boat.label]),
  );
  const boatLabel = boatLabels.get(obligation.boatId);
  const owedToBoatLabel = boatLabels.get(obligation.owedToBoatId);

  if (!moment || !boatLabel || !owedToBoatLabel) return null;

  return {
    momentId,
    prompt: `Which boat must keep clear at ${moment.label}?`,
    options: trainingExample.scenario.boats.map((boat) => ({
      boatId: boat.id,
      label: boat.label,
    })),
    answer: {
      boatId: obligation.boatId,
      explanation: `${boatLabel} must keep clear of ${owedToBoatLabel}.`,
      ruleRefs: [...obligation.ruleRefs],
    },
  };
}

export function scoreKeepClearAnswer(
  question: KeepClearQuizQuestion,
  selectedBoatId: string,
): KeepClearQuizResult {
  return {
    isCorrect: selectedBoatId === question.answer.boatId,
    correctBoatId: question.answer.boatId,
    explanation: question.answer.explanation,
    ruleRefs: [...question.answer.ruleRefs],
  };
}

export function listKeepClearPractice(
  sources: readonly KeepClearPracticeSource[],
): KeepClearPracticeItem[] {
  return sources.flatMap(({ slug, trainingExample }) =>
    trainingExample.situation.moments.flatMap((moment) => {
      const question = deriveKeepClearQuestion(trainingExample, moment.id);
      if (!question) return [];

      return [
        {
          slug,
          scenarioTitle: trainingExample.scenario.title,
          momentId: moment.id,
          momentLabel: moment.label,
          ruleRefs: [...question.answer.ruleRefs],
        },
      ];
    }),
  );
}
