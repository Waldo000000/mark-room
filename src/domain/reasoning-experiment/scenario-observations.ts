import { normalizeDegrees } from '../scenario/geometry';
import type { Scenario } from '../scenario/schema';
import {
  FACTS,
  type FactEvidence,
  type FactKey,
  type FactPacket,
} from './facts';

export type ScenarioObservations = {
  scenarioId: string;
  keyframeId: string;
  boats: {
    id: string;
    label: string;
    tack: 'port' | 'starboard';
    headingDegrees: number;
  }[];
  pairs: {
    boatIds: [string, string];
    oppositeTacks: boolean;
    centerSeparation: number;
  }[];
  changes: {
    boatId: string;
    from: string;
    to: string;
    headingDifference: number;
    displacement: number;
    assumedSeconds: number | null;
    displacementRate: number | null;
  }[];
};

// Endpoint observations only. No playback interpolation, reconstructed track,
// equipment model, legal overlap, contact, keep-clear or room assessment.
export function observeScenario(
  scenario: Scenario,
  keyframeId: string,
  assumedIntervalSeconds?: number,
): ScenarioObservations {
  if (
    assumedIntervalSeconds !== undefined &&
    (!Number.isFinite(assumedIntervalSeconds) || assumedIntervalSeconds <= 0)
  )
    throw new Error(
      'Experimental interval duration must be positive and finite.',
    );
  const index = scenario.keyframes.findIndex(
    (frame) => frame.id === keyframeId,
  );
  if (index < 0) throw new Error('Unknown keyframe');
  const frame = scenario.keyframes[index];
  const previous = scenario.keyframes[index - 1];
  return {
    scenarioId: scenario.id,
    keyframeId,
    boats: frame.boatStates.map((boat) => ({
      id: boat.boatId,
      label: scenario.boats.find((item) => item.id === boat.boatId)!.label,
      tack: boat.tack,
      headingDegrees: boat.headingDegrees,
    })),
    pairs: frame.boatStates.flatMap((first, position) =>
      frame.boatStates.slice(position + 1).map((second) => ({
        boatIds: [first.boatId, second.boatId] as [string, string],
        oppositeTacks: first.tack !== second.tack,
        centerSeparation: Math.hypot(
          first.position.x - second.position.x,
          first.position.y - second.position.y,
        ),
      })),
    ),
    changes: previous
      ? frame.boatStates.map((boat) => {
          const before = previous.boatStates.find(
            (item) => item.boatId === boat.boatId,
          )!;
          const displacement = Math.hypot(
            boat.position.x - before.position.x,
            boat.position.y - before.position.y,
          );
          return {
            boatId: boat.boatId,
            from: previous.id,
            to: frame.id,
            headingDifference:
              normalizeDegrees(
                boat.headingDegrees - before.headingDegrees + 180,
              ) - 180,
            displacement,
            assumedSeconds: assumedIntervalSeconds ?? null,
            displacementRate:
              assumedIntervalSeconds === undefined
                ? null
                : displacement / assumedIntervalSeconds,
          };
        })
      : [],
  };
}

// The caller names the roles being tested; the starboard-role premise can be
// false. Snapshot tack observations do not establish continuous interval tack.
export function scenarioPairFacts(
  scenario: Scenario,
  keyframeId: string,
  boatIds: [string, string],
  assumeRulesApply = false,
): FactPacket {
  const observations = observeScenario(scenario, keyframeId);
  const first = observations.boats.find((boat) => boat.id === boatIds[0]);
  const second = observations.boats.find((boat) => boat.id === boatIds[1]);
  if (!first || !second || first.id === second.id)
    throw new Error('Two distinct observed boats are required');
  const episodeId = `${scenario.id}:${observations.keyframeId}`;
  const facts: FactEvidence[] = [
    {
      key: 'opposite-tacks',
      value: first.tack !== second.tack,
      episodeId,
      world: 'actual',
      basis: 'derived',
      evidence: `Authored tack values at ${observations.keyframeId}; no assertion between keyframes.`,
    },
    {
      key: 'starboard-role',
      value: first.tack === 'starboard',
      episodeId,
      world: 'actual',
      basis: 'derived',
      evidence: `Authored tack of ${first.label} at ${observations.keyframeId}.`,
    },
  ];
  if (assumeRulesApply)
    facts.push({
      key: 'rules-apply',
      value: true,
      episodeId,
      world: 'actual',
      basis: 'assumption',
      evidence:
        'Explicit research assumption: Part 2 Section A applies at this snapshot. Scenario alone does not establish racing/applicability conditions.',
    });
  return {
    version: 'pairwise-facts-v1',
    episodeId,
    context: {
      discipline: scenario.context.discipline,
      ruleSet: scenario.context.ruleSetVersion ?? 'unspecified',
    },
    boats: { starboard: first.label, port: second.label },
    facts,
  };
}

export function prerequisiteInventory(
  packet: FactPacket,
): { key: FactKey; label: string; basis: string; reason: string }[] {
  return (Object.keys(FACTS) as FactKey[]).map((key) => {
    const fact = packet.facts.find((item) => item.key === key);
    return {
      key,
      label: FACTS[key].label,
      basis: fact?.basis ?? 'unresolved',
      reason:
        fact?.evidence ??
        (key === 'course-changed' || key === 'further-change'
          ? 'Endpoint headings do not establish the continuous course, its timing or promptness.'
          : key === 'rules-apply'
            ? 'Rules context identifies a discipline, not all applicability conditions.'
            : 'Requires a scoped sailing assessment not implemented by these endpoint observations; no source assessment has been substituted.'),
    };
  });
}
