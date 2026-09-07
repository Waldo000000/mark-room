import type { BoatState, Scenario } from '../../domain/scenario/schema';

export const BOAT_COLOR_PALETTE = [
  '#2563EB',
  '#EAB308',
  '#DC2626',
  '#16A34A',
  '#7C3AED',
  '#EA580C',
  '#0891B2',
  '#DB2777',
] as const;

const FALLBACK_BOAT_COLOR = '#0F766E';
const PREFERRED_SEPARATION = 1;
const NEARBY_OFFSET = 1.25;
const AREA_GRID_INTERVALS = 20;

type Point = { x: number; y: number };

export type AddBoatResult = {
  scenario: Scenario;
  boatId: string;
};

export type RemoveBoatResult = {
  scenario: Scenario;
  selectedBoatId: string;
};

function clamp(value: number, maximum: number): number {
  return Math.min(Math.max(value, 0), maximum);
}

function boundedPoint(point: Point, width: number, height: number): Point {
  return {
    x: clamp(Math.round(clamp(point.x, width) * 100) / 100, width),
    y: clamp(Math.round(clamp(point.y, height) * 100) / 100, height),
  };
}

function squaredDistance(first: Point, second: Point): number {
  return (first.x - second.x) ** 2 + (first.y - second.y) ** 2;
}

function placementCandidates(source: Point, width: number, height: number) {
  const diagonalOffset = NEARBY_OFFSET / Math.sqrt(2);
  const nearbyOffsets = [
    { x: NEARBY_OFFSET, y: 0 },
    { x: -NEARBY_OFFSET, y: 0 },
    { x: 0, y: NEARBY_OFFSET },
    { x: 0, y: -NEARBY_OFFSET },
    { x: diagonalOffset, y: diagonalOffset },
    { x: -diagonalOffset, y: diagonalOffset },
    { x: diagonalOffset, y: -diagonalOffset },
    { x: -diagonalOffset, y: -diagonalOffset },
  ];
  const candidates = nearbyOffsets.map((offset) =>
    boundedPoint(
      { x: source.x + offset.x, y: source.y + offset.y },
      width,
      height,
    ),
  );

  for (let yIndex = 0; yIndex <= AREA_GRID_INTERVALS; yIndex += 1) {
    for (let xIndex = 0; xIndex <= AREA_GRID_INTERVALS; xIndex += 1) {
      candidates.push(
        boundedPoint(
          {
            x: (width * xIndex) / AREA_GRID_INTERVALS,
            y: (height * yIndex) / AREA_GRID_INTERVALS,
          },
          width,
          height,
        ),
      );
    }
  }

  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    const key = `${candidate.x}:${candidate.y}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function choosePosition(
  source: Point,
  existingStates: BoatState[],
  width: number,
  height: number,
): Point {
  const candidates = placementCandidates(source, width, height);
  let bestCandidate = candidates[0] ?? boundedPoint(source, width, height);
  let bestMinimumDistanceSquared = -1;
  let bestSourceDistanceSquared = Number.POSITIVE_INFINITY;

  for (const candidate of candidates) {
    const minimumDistanceSquared = Math.min(
      ...existingStates.map((state) =>
        squaredDistance(candidate, state.position),
      ),
    );
    const sourceDistanceSquared = squaredDistance(candidate, source);
    const reachesPreferredSeparation =
      minimumDistanceSquared >= PREFERRED_SEPARATION ** 2;
    const bestReachesPreferredSeparation =
      bestMinimumDistanceSquared >= PREFERRED_SEPARATION ** 2;
    const isBetter = reachesPreferredSeparation
      ? !bestReachesPreferredSeparation ||
        sourceDistanceSquared < bestSourceDistanceSquared
      : !bestReachesPreferredSeparation &&
        minimumDistanceSquared > bestMinimumDistanceSquared;

    if (isBetter) {
      bestCandidate = candidate;
      bestMinimumDistanceSquared = minimumDistanceSquared;
      bestSourceDistanceSquared = sourceDistanceSquared;
    }
  }

  return bestCandidate;
}

function nextBoatIdentity(scenario: Scenario) {
  const boatIds = new Set(scenario.boats.map((boat) => boat.id));
  let boatNumber = 1;

  while (boatIds.has(`boat-${boatNumber}`)) boatNumber += 1;

  return {
    boatId: `boat-${boatNumber}`,
    label: `Boat ${boatNumber}`,
  };
}

function nextBoatColor(scenario: Scenario): string {
  const usedColors = new Set(
    scenario.boats
      .map((boat) => boat.color?.toUpperCase())
      .filter((color): color is string => Boolean(color)),
  );

  return (
    BOAT_COLOR_PALETTE.find((color) => !usedColors.has(color.toUpperCase())) ??
    FALLBACK_BOAT_COLOR
  );
}

export function addBoatToScenario(
  scenario: Scenario,
  selectedBoatId: string,
): AddBoatResult {
  const { boatId, label } = nextBoatIdentity(scenario);
  const { width, height } = scenario.sailingArea;

  return {
    boatId,
    scenario: {
      ...scenario,
      boats: [
        ...scenario.boats,
        { id: boatId, label, color: nextBoatColor(scenario) },
      ],
      keyframes: scenario.keyframes.map((keyframe) => {
        const sourceState =
          keyframe.boatStates.find(
            (state) => state.boatId === selectedBoatId,
          ) ?? keyframe.boatStates[0];

        if (!sourceState) return keyframe;

        return {
          ...keyframe,
          boatStates: [
            ...keyframe.boatStates,
            {
              boatId,
              position: choosePosition(
                sourceState.position,
                keyframe.boatStates,
                width,
                height,
              ),
              headingDegrees: sourceState.headingDegrees,
              tack: sourceState.tack,
            },
          ],
        };
      }),
    },
  };
}

export function removeBoatFromScenario(
  scenario: Scenario,
  boatId: string,
): RemoveBoatResult | null {
  const removedBoatIndex = scenario.boats.findIndex(
    (boat) => boat.id === boatId,
  );
  if (removedBoatIndex < 0 || scenario.boats.length === 1) return null;

  const boats = scenario.boats.filter((boat) => boat.id !== boatId);
  const selectedBoatId = boats[Math.min(removedBoatIndex, boats.length - 1)].id;

  return {
    selectedBoatId,
    scenario: {
      ...scenario,
      boats,
      keyframes: scenario.keyframes.map((keyframe) => ({
        ...keyframe,
        boatStates: keyframe.boatStates.filter(
          (state) => state.boatId !== boatId,
        ),
      })),
      observedEvents: scenario.observedEvents.filter(
        (event) => event.boatId !== boatId,
      ),
    },
  };
}
