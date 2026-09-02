import type { Obligation, Outcome, Ruling } from '@/src/domain/ruling/schema';

type BoatLabels = ReadonlyMap<string, string>;

function resolveBoatLabel(boatLabels: BoatLabels, boatId: string) {
  return boatLabels.get(boatId) ?? boatId;
}

export function selectRulingStatements(ruling: Ruling, momentId: string) {
  return {
    obligations: ruling.obligations.filter(
      (statement) => statement.atMoment === momentId,
    ),
    outcomes: ruling.outcomes.filter(
      (statement) => statement.atMoment === momentId,
    ),
  };
}

export function describeObligation(
  obligation: Obligation,
  boatLabels: BoatLabels,
): string {
  const boat = resolveBoatLabel(boatLabels, obligation.boatId);
  const owedToBoat = resolveBoatLabel(boatLabels, obligation.owedToBoatId);

  switch (obligation.type) {
    case 'keep-clear':
      return `${boat} must keep clear of ${owedToBoat}.`;
    case 'give-room':
      return `${boat} must give room to ${owedToBoat}.`;
    case 'give-mark-room':
      return `${boat} must give mark-room to ${owedToBoat}.`;
    case 'avoid-contact':
      return `${boat} must avoid contact with ${owedToBoat}.`;
  }
}

export function describeOutcome(
  outcome: Outcome,
  boatLabels: BoatLabels,
): string {
  const boat = resolveBoatLabel(boatLabels, outcome.boatId);

  switch (outcome.type) {
    case 'rule-breached':
      return `${boat}: rule breach recorded.`;
    case 'exonerated':
      return `${boat}: exoneration recorded.`;
    case 'penalty':
      return `${boat}: penalty recorded.`;
    case 'no-breach':
      return `${boat}: no breach recorded.`;
  }
}
