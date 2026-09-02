import type { TrainingExample } from '../training-example/schema';

export type MarkRoomQuizQuestion = {
  momentId: string;
  prompt: string;
  options: { boatId: string; label: string }[];
  answer: {
    boatId: string;
    explanation: string;
    ruleRefs: string[];
  };
};

export type MarkRoomQuizResult = {
  isCorrect: boolean;
  correctBoatId: string;
  explanation: string;
  ruleRefs: string[];
};

type MarkRoomPracticeSource = {
  slug: string;
  trainingExample: TrainingExample;
};

export type MarkRoomPracticeItem = {
  slug: string;
  scenarioTitle: string;
  momentId: string;
  momentLabel: string;
};

export function deriveMarkRoomQuestion(
  trainingExample: TrainingExample,
  momentId: string,
): MarkRoomQuizQuestion | null {
  const obligations = trainingExample.rulings.obligations.filter(
    (obligation) =>
      obligation.atMoment === momentId && obligation.type === 'give-mark-room',
  );

  if (obligations.length !== 1) return null;

  const obligation = obligations[0];
  const moment = trainingExample.situation.moments.find(
    (candidate) => candidate.id === momentId,
  );
  const boatLabels = new Map(
    trainingExample.scenario.boats.map((boat) => [boat.id, boat.label]),
  );
  const givingBoatLabel = boatLabels.get(obligation.boatId);
  const owedBoatLabel = boatLabels.get(obligation.owedToBoatId);

  if (!moment || !givingBoatLabel || !owedBoatLabel) return null;

  return {
    momentId,
    prompt: `Which boat is owed mark-room at ${moment.label}?`,
    options: trainingExample.scenario.boats.map((boat) => ({
      boatId: boat.id,
      label: boat.label,
    })),
    answer: {
      boatId: obligation.owedToBoatId,
      explanation: `${owedBoatLabel} is owed mark-room from ${givingBoatLabel}.`,
      ruleRefs: [...obligation.ruleRefs],
    },
  };
}

export function scoreMarkRoomAnswer(
  question: MarkRoomQuizQuestion,
  selectedBoatId: string,
): MarkRoomQuizResult {
  return {
    isCorrect: selectedBoatId === question.answer.boatId,
    correctBoatId: question.answer.boatId,
    explanation: question.answer.explanation,
    ruleRefs: [...question.answer.ruleRefs],
  };
}

export function listMarkRoomPractice(
  sources: readonly MarkRoomPracticeSource[],
): MarkRoomPracticeItem[] {
  return sources.flatMap(({ slug, trainingExample }) =>
    trainingExample.situation.moments.flatMap((moment) => {
      const question = deriveMarkRoomQuestion(trainingExample, moment.id);
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
