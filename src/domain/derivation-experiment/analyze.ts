import { hullClearance } from './geometry';
import {
  candidateWorks,
  type Assessment,
  type CandidateFinding,
  type FindingsPacket,
  type PairFinding,
} from './findings';
import {
  PROFILE,
  initialPosition,
  maneuvers,
  poseAt,
  responseOptions,
  type BoatId,
  type ExperimentCase,
  type ResponseOption,
} from './model';

export function boatPairs(encounter: ExperimentCase): [BoatId, BoatId][] {
  return encounter.boats.flatMap((boat, index) =>
    encounter.boats
      .slice(index + 1)
      .map((other) => [boat, other] as [BoatId, BoatId]),
  );
}

export function combinations(encounter: ExperimentCase) {
  const options = responseOptions();
  return options
    .filter((option) => option.delay >= (encounter.minimumMiddleDelay ?? 0))
    .flatMap<{ middle: ResponseOption; windward: ResponseOption | undefined }>(
      (middle) =>
        encounter.boats.includes('W')
          ? options.map((windward) => ({ middle, windward }))
          : [{ middle, windward: undefined }],
    );
}

export function evaluateCandidate(
  encounter: ExperimentCase,
  middle: ResponseOption,
  windward?: ResponseOption,
  step: number = PROFILE.sampleSeconds,
): CandidateFinding {
  if (!Number.isFinite(step) || step <= 0 || step > PROFILE.horizonSeconds)
    throw new Error('Invalid assessment step');
  const turns = maneuvers(encounter, middle, windward);
  const count = Math.ceil(PROFILE.horizonSeconds / step);
  const actualStep = PROFILE.horizonSeconds / count;
  const times = Array.from(
    { length: count + 1 },
    (_, index) => index * actualStep,
  );
  const trajectories = Object.fromEntries(
    encounter.boats.map((boat) => [
      boat,
      times.map((time) =>
        poseAt(initialPosition(encounter, boat), turns[boat], time),
      ),
    ]),
  ) as Record<BoatId, ReturnType<typeof poseAt>[]>;
  const pairs: PairFinding[] = boatPairs(encounter).map(([first, second]) => {
    let minimum = Number.POSITIVE_INFINITY;
    let limitingIndex = 0;
    times.forEach((_, index) => {
      const clearance = hullClearance(
        trajectories[first][index],
        trajectories[second][index],
      );
      if (clearance < minimum) {
        minimum = clearance;
        limitingIndex = index;
      }
    });
    // Each capsule-axis endpoint moves at most v + halfAxis * angularRate.
    // Distance between the two axes is Lipschitz with the sum of those bounds.
    // Every instant is at most step/2 from a sample. A nonnegative lower bound
    // therefore certifies clearance throughout the interval, not just at samples.
    const halfAxis = (PROFILE.hullLength - PROFILE.hullWidth) / 2;
    const speedBound =
      2 * PROFILE.speed +
      (halfAxis * (turns[first].rate + turns[second].rate) * Math.PI) / 180;
    const lower = minimum - (speedBound * actualStep) / 2;
    return {
      boats: [first, second],
      status:
        minimum < 0
          ? 'hull-intersection'
          : lower >= 0
            ? 'clearance-certified'
            : 'resolution-limit',
      lowerClearanceBoundHullLengths: lower,
      minimumSampledClearanceHullLengths: minimum,
      limitingSampleSeconds: times[limitingIndex],
    };
  });
  return {
    id: `${middle.id}/${windward?.id ?? 'none'}`,
    middleOption: middle.id,
    ...(windward ? { windwardOption: windward.id } : {}),
    pairs,
  };
}

export function deriveFindings(encounter: ExperimentCase): FindingsPacket {
  return {
    version: 'experimental-1',
    caseId: encounter.id,
    profileId: PROFILE.id,
    intervalSeconds: [0, PROFILE.horizonSeconds],
    requiredPairs: boatPairs(encounter),
    candidates: combinations(encounter).map(({ middle, windward }) =>
      evaluateCandidate(encounter, middle, windward),
    ),
  };
}

export function analyzeShared(encounter: ExperimentCase): {
  assessment: Assessment;
  evidence: CandidateFinding[];
} {
  const evidence: CandidateFinding[] = [];
  for (const { middle, windward } of combinations(encounter)) {
    const candidate = evaluateCandidate(encounter, middle, windward);
    evidence.push(candidate);
    if (candidateWorks(candidate, boatPairs(encounter))) {
      return {
        assessment: {
          status: 'witness-found',
          witnessId: candidate.id,
          evaluatedCandidates: evidence.length,
        },
        evidence,
      };
    }
  }
  return {
    assessment: {
      status: 'no-certified-candidate',
      witnessId: null,
      evaluatedCandidates: evidence.length,
    },
    evidence,
  };
}
