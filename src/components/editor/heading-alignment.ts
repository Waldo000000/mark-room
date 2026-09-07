import { normalizeDegrees } from '../../domain/scenario/geometry';
import type { Scenario } from '../../domain/scenario/schema';

export const HEADING_ALIGNMENT_COINCIDENCE_TOLERANCE = 0.01;

export type HeadingAlignmentPair = {
  boatId: string;
  keyframeId: string;
};

type ScenarioPosition = { x: number; y: number };

export function headingFromDisplacement(
  previousPosition: ScenarioPosition | undefined,
  nextPosition: ScenarioPosition,
  currentHeadingDegrees: number,
): number {
  if (!previousPosition) return currentHeadingDegrees;

  const deltaX = nextPosition.x - previousPosition.x;
  const deltaY = nextPosition.y - previousPosition.y;
  if (
    Math.hypot(deltaX, deltaY) <=
    HEADING_ALIGNMENT_COINCIDENCE_TOLERANCE + 1e-12
  ) {
    return currentHeadingDegrees;
  }

  return normalizeDegrees(
    Math.round((Math.atan2(deltaX, deltaY) * 180) / Math.PI),
  );
}

export function alignedHeadingForBoatMove({
  boatId,
  currentHeadingDegrees,
  keyframeId,
  nextPosition,
  scenario,
}: {
  boatId: string;
  currentHeadingDegrees: number;
  keyframeId: string;
  nextPosition: ScenarioPosition;
  scenario: Scenario;
}): number {
  const keyframeIndex = scenario.keyframes.findIndex(
    (keyframe) => keyframe.id === keyframeId,
  );
  const previousPosition =
    keyframeIndex > 0
      ? scenario.keyframes[keyframeIndex - 1].boatStates.find(
          (state) => state.boatId === boatId,
        )?.position
      : undefined;

  return headingFromDisplacement(
    previousPosition,
    nextPosition,
    currentHeadingDegrees,
  );
}

export function isHeadingAlignmentDisabled(
  pairs: readonly HeadingAlignmentPair[],
  pair: HeadingAlignmentPair,
): boolean {
  return pairs.some(
    (candidate) =>
      candidate.boatId === pair.boatId &&
      candidate.keyframeId === pair.keyframeId,
  );
}

export function withHeadingAlignmentDisabled(
  pairs: readonly HeadingAlignmentPair[],
  pair: HeadingAlignmentPair,
  disabled: boolean,
): HeadingAlignmentPair[] {
  const withoutPair = pairs.filter(
    (candidate) =>
      candidate.boatId !== pair.boatId ||
      candidate.keyframeId !== pair.keyframeId,
  );

  return disabled ? [...withoutPair, pair] : withoutPair;
}

export function parseDisabledHeadingAlignmentPairs(
  value: unknown,
  scenario: Scenario,
): HeadingAlignmentPair[] {
  if (!Array.isArray(value)) return [];

  const pairs: HeadingAlignmentPair[] = [];
  for (const candidate of value) {
    if (
      !candidate ||
      typeof candidate !== 'object' ||
      !('boatId' in candidate) ||
      typeof candidate.boatId !== 'string' ||
      !('keyframeId' in candidate) ||
      typeof candidate.keyframeId !== 'string'
    ) {
      continue;
    }

    const pair = {
      boatId: candidate.boatId,
      keyframeId: candidate.keyframeId,
    };
    const keyframe = scenario.keyframes.find(
      (item) => item.id === pair.keyframeId,
    );
    if (
      !scenario.boats.some((boat) => boat.id === pair.boatId) ||
      !keyframe?.boatStates.some((state) => state.boatId === pair.boatId) ||
      isHeadingAlignmentDisabled(pairs, pair)
    ) {
      continue;
    }

    pairs.push(pair);
  }

  return pairs;
}
