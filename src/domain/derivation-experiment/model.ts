// Isolated research model. These values are declared hypotheses, not RRS limits.
export const PROFILE = {
  id: 'synthetic-luff-v1',
  hullLength: 1,
  hullWidth: 0.4,
  speed: 0.8,
  responseDelays: [0.25, 0.6, 1] as readonly number[],
  turnRates: [12, 24, 36] as readonly number[],
  sampleSeconds: 0.025,
  horizonSeconds: 5,
  initialHeading: 300,
  turnDegrees: 45,
} as const;

export type Point = { x: number; y: number };
export type BoatId = 'L' | 'M' | 'W';
export type Pose = Point & { heading: number };
export type Maneuver = { start: number; rate: number };
export type ResponseOption = { id: string; delay: number; rate: number };
export type ExperimentCase = {
  id: string;
  title: string;
  question: string;
  boats: BoatId[];
  middleGap: number;
  windwardGap: number;
  luffStart: number;
  luffRate: number;
  minimumMiddleDelay?: number;
};

export const CASES: ExperimentCase[] = [
  {
    id: 'two-gradual',
    title: 'Two boats: gradual luff',
    question: 'Can a declared response maintain hull clearance?',
    boats: ['L', 'M'],
    middleGap: 0.7,
    windwardGap: 0,
    luffStart: 0.5,
    luffRate: 15,
  },
  {
    id: 'three-close',
    title: 'Three boats: close windward neighbour',
    question: 'Can one combination work for all three boats?',
    boats: ['L', 'M', 'W'],
    middleGap: 0.7,
    windwardGap: 0.43,
    luffStart: 0.5,
    luffRate: 15,
  },
  {
    id: 'three-open',
    title: 'Three boats: more space to windward',
    question: 'Does relaxing the third-boat constraint change the result?',
    boats: ['L', 'M', 'W'],
    middleGap: 0.7,
    windwardGap: 1.1,
    luffStart: 0.5,
    luffRate: 15,
  },
  {
    id: 'two-abrupt',
    title: 'Two boats: abrupt luff',
    question:
      'How does the same total turn at a different rate affect the responses?',
    boats: ['L', 'M'],
    middleGap: 0.7,
    windwardGap: 0,
    luffStart: 0.5,
    luffRate: 90,
  },
  {
    id: 'two-delayed',
    title: 'Two boats: delayed response subset',
    question: 'What changes if only later responses are considered?',
    boats: ['L', 'M'],
    middleGap: 0.7,
    windwardGap: 0,
    luffStart: 0.5,
    luffRate: 15,
    minimumMiddleDelay: 1,
  },
];

export function responseOptions(): ResponseOption[] {
  return PROFILE.responseDelays.flatMap((delay) =>
    PROFILE.turnRates.map((rate) => ({
      id: `delay-${delay}-rate-${rate}`,
      delay,
      rate,
    })),
  );
}

export function initialPosition(
  encounter: ExperimentCase,
  boat: BoatId,
): Point {
  const distance =
    boat === 'L'
      ? 0
      : encounter.middleGap + (boat === 'W' ? encounter.windwardGap : 0);
  // The windward normal to heading 300 degrees points north-east.
  return { x: 5 + distance * 0.5, y: 1.4 + (distance * Math.sqrt(3)) / 2 };
}

export function maneuvers(
  encounter: ExperimentCase,
  middle: ResponseOption,
  windward?: ResponseOption,
): Record<BoatId, Maneuver> {
  const middleStart = encounter.luffStart + middle.delay;
  return {
    L: { start: encounter.luffStart, rate: encounter.luffRate },
    M: { start: middleStart, rate: middle.rate },
    // W responds to M's observable turn, not to a future collision or L's future path.
    W: {
      start: middleStart + (windward?.delay ?? 0),
      rate: windward?.rate ?? 0,
    },
  };
}

export function poseAt(initial: Point, maneuver: Maneuver, time: number): Pose {
  const radians = Math.PI / 180;
  const heading0 = PROFILE.initialHeading * radians;
  const rate = maneuver.rate * radians;
  const before = Math.min(time, maneuver.start);
  const turning =
    rate > 0
      ? Math.min(
          Math.max(0, time - maneuver.start),
          (PROFILE.turnDegrees * radians) / rate,
        )
      : 0;
  const after = Math.max(0, time - before - turning);
  const heading1 = heading0 + rate * turning;
  const dx =
    Math.sin(heading0) * before +
    (rate ? (Math.cos(heading0) - Math.cos(heading1)) / rate : 0) +
    Math.sin(heading1) * after;
  const dy =
    Math.cos(heading0) * before +
    (rate ? (Math.sin(heading1) - Math.sin(heading0)) / rate : 0) +
    Math.cos(heading1) * after;
  return {
    x: initial.x + PROFILE.speed * dx,
    y: initial.y + PROFILE.speed * dy,
    heading: heading1 / radians,
  };
}

export function traceAt(
  encounter: ExperimentCase,
  middle: ResponseOption,
  windward: ResponseOption | undefined,
  time: number,
) {
  const turns = maneuvers(encounter, middle, windward);
  return encounter.boats.map((id) => ({
    id,
    ...poseAt(initialPosition(encounter, id), turns[id], time),
  }));
}
