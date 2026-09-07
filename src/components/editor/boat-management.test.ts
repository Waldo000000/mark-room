import { describe, expect, it } from 'vitest';

import { scenarioSchema, type Scenario } from '../../domain/scenario/schema';

import {
  addBoatToScenario,
  BOAT_COLOR_PALETTE,
  removeBoatFromScenario,
} from './boat-management';

function scenarioWith(
  boats: Scenario['boats'],
  keyframes: Scenario['keyframes'],
  sailingArea: Scenario['sailingArea'] = { width: 8, height: 8 },
): Scenario {
  return {
    schemaVersion: '0.5.0',
    id: 'add-boat-test',
    title: 'Add boat test',
    context: { discipline: 'radio_sailing' },
    sailingArea,
    wind: { fromDegrees: 0 },
    boats,
    keyframes,
    courseFeatures: [],
    observedEvents: [],
  };
}

const twoFrameScenario = scenarioWith(
  [
    { id: 'blue', label: 'Custom name', color: BOAT_COLOR_PALETTE[0] },
    { id: 'boat-1', label: 'Anything', color: BOAT_COLOR_PALETTE[1] },
    { id: 'boat-3', label: 'Boat 99', color: BOAT_COLOR_PALETTE[2] },
  ],
  [
    {
      id: 'position-1',
      label: 'Position 1',
      boatStates: [
        {
          boatId: 'blue',
          position: { x: 2, y: 2 },
          headingDegrees: 45,
          tack: 'port',
        },
        {
          boatId: 'boat-1',
          position: { x: 7, y: 7 },
          headingDegrees: 180,
          tack: 'starboard',
        },
        {
          boatId: 'boat-3',
          position: { x: 6, y: 6 },
          headingDegrees: 180,
          tack: 'starboard',
        },
      ],
    },
    {
      id: 'position-2',
      label: 'Position 2',
      boatStates: [
        {
          boatId: 'blue',
          position: { x: 3, y: 3 },
          headingDegrees: 225,
          tack: 'starboard',
        },
        {
          boatId: 'boat-1',
          position: { x: 7, y: 7 },
          headingDegrees: 180,
          tack: 'starboard',
        },
        {
          boatId: 'boat-3',
          position: { x: 6, y: 6 },
          headingDegrees: 180,
          tack: 'starboard',
        },
      ],
    },
  ],
);

describe('addBoatToScenario', () => {
  it('uses the first unused generated ID independent of custom labels', () => {
    const result = addBoatToScenario(twoFrameScenario, 'blue');

    expect(result.boatId).toBe('boat-2');
    expect(result.scenario.boats.at(-1)).toEqual({
      id: 'boat-2',
      label: 'Boat 2',
      color: BOAT_COLOR_PALETTE[3],
    });
  });

  it('adds one state to every frame and copies the selected heading and tack', () => {
    const result = addBoatToScenario(twoFrameScenario, 'blue');
    const newStates = result.scenario.keyframes.map((keyframe) =>
      keyframe.boatStates.find((state) => state.boatId === result.boatId),
    );

    expect(newStates).toMatchObject([
      { headingDegrees: 45, tack: 'port' },
      { headingDegrees: 225, tack: 'starboard' },
    ]);
    expect(
      result.scenario.keyframes.map((frame) => frame.boatStates.length),
    ).toEqual([4, 4]);
    for (const keyframe of result.scenario.keyframes) {
      const newState = keyframe.boatStates.at(-1);
      expect(newState).toBeDefined();
      for (const existingState of keyframe.boatStates.slice(0, -1)) {
        expect(
          Math.hypot(
            newState!.position.x - existingState.position.x,
            newState!.position.y - existingState.position.y,
          ),
        ).toBeGreaterThanOrEqual(1);
      }
    }
    expect(scenarioSchema.safeParse(result.scenario).success).toBe(true);
  });

  it('does not mutate the existing scenario data', () => {
    const snapshot = structuredClone(twoFrameScenario);
    const result = addBoatToScenario(twoFrameScenario, 'blue');

    expect(twoFrameScenario).toEqual(snapshot);
    expect(result.scenario).not.toBe(twoFrameScenario);
    expect(result.scenario.keyframes[0].boatStates.slice(0, 3)).toEqual(
      snapshot.keyframes[0].boatStates,
    );
  });

  it('uses the first state as a heading fallback if the selected boat is absent', () => {
    const result = addBoatToScenario(twoFrameScenario, 'missing-boat');
    const newState = result.scenario.keyframes[0].boatStates.at(-1);

    expect(newState).toMatchObject({ headingDegrees: 45, tack: 'port' });
  });

  it('keeps placement valid in a sailing area smaller than one hull length', () => {
    const tinyScenario = scenarioWith(
      [{ id: 'blue', label: 'Blue' }],
      [
        {
          id: 'position-1',
          label: 'Position 1',
          boatStates: [
            {
              boatId: 'blue',
              position: { x: 0.003, y: 0.002 },
              headingDegrees: 180,
              tack: 'starboard',
            },
          ],
        },
      ],
      { width: 0.006, height: 0.004 },
    );
    const result = addBoatToScenario(tinyScenario, 'blue');
    const position = result.scenario.keyframes[0].boatStates.at(-1)?.position;

    expect(position?.x).toBeGreaterThanOrEqual(0);
    expect(position?.x).toBeLessThanOrEqual(0.006);
    expect(position?.y).toBeGreaterThanOrEqual(0);
    expect(position?.y).toBeLessThanOrEqual(0.004);
    expect(scenarioSchema.safeParse(result.scenario).success).toBe(true);
  });

  it('chooses a deterministic best-effort position in a crowded area', () => {
    const crowdedScenario = scenarioWith(
      [
        { id: 'one', label: 'One' },
        { id: 'two', label: 'Two' },
        { id: 'three', label: 'Three' },
        { id: 'four', label: 'Four' },
      ],
      [
        {
          id: 'position-1',
          label: 'Position 1',
          boatStates: [
            {
              boatId: 'one',
              position: { x: 0, y: 0 },
              headingDegrees: 0,
              tack: 'port',
            },
            {
              boatId: 'two',
              position: { x: 1, y: 0 },
              headingDegrees: 0,
              tack: 'port',
            },
            {
              boatId: 'three',
              position: { x: 0, y: 1 },
              headingDegrees: 0,
              tack: 'port',
            },
            {
              boatId: 'four',
              position: { x: 1, y: 1 },
              headingDegrees: 0,
              tack: 'port',
            },
          ],
        },
      ],
      { width: 1, height: 1 },
    );

    const first = addBoatToScenario(crowdedScenario, 'one');
    const second = addBoatToScenario(crowdedScenario, 'one');
    const position = first.scenario.keyframes[0].boatStates.at(-1)?.position;

    expect(position).toEqual({ x: 0.5, y: 0.5 });
    expect(second.scenario.keyframes[0].boatStates.at(-1)?.position).toEqual(
      position,
    );
    expect(scenarioSchema.safeParse(first.scenario).success).toBe(true);
  });

  it('uses a valid fallback color after every palette color is taken', () => {
    const boats = BOAT_COLOR_PALETTE.map((color, index) => ({
      id: `existing-${index + 1}`,
      label: `Existing ${index + 1}`,
      color: index === 0 ? color.toLowerCase() : color,
    }));
    const keyframes = [
      {
        id: 'position-1',
        label: 'Position 1',
        boatStates: boats.map((boat, index) => ({
          boatId: boat.id,
          position: { x: index, y: 0 },
          headingDegrees: 0,
          tack: 'port' as const,
        })),
      },
    ];
    const result = addBoatToScenario(
      scenarioWith(boats, keyframes, { width: 10, height: 2 }),
      boats[0].id,
    );

    expect(result.scenario.boats.at(-1)?.color).toMatch(/^#[0-9A-F]{6}$/);
    expect(scenarioSchema.safeParse(result.scenario).success).toBe(true);
  });
});

describe('removeBoatFromScenario', () => {
  const scenario = scenarioWith(
    [
      { id: 'blue', label: 'Blue', color: BOAT_COLOR_PALETTE[0] },
      { id: 'yellow', label: 'Yellow', color: BOAT_COLOR_PALETTE[1] },
      { id: 'red', label: 'Red', color: BOAT_COLOR_PALETTE[2] },
    ],
    twoFrameScenario.keyframes.map((keyframe) => ({
      ...keyframe,
      boatStates: [
        keyframe.boatStates[0],
        { ...keyframe.boatStates[1], boatId: 'yellow' },
        {
          boatId: 'red',
          position: { x: 1, y: 1 },
          headingDegrees: 90,
          tack: 'port' as const,
        },
      ],
    })),
  );
  scenario.id = 'remove-boat-test';
  scenario.title = 'Remove boat test';
  scenario.courseFeatures = [
    {
      type: 'mark',
      id: 'mark-1',
      label: 'Mark 1',
      position: { x: 4, y: 4 },
      requiredSide: 'port',
    },
  ];
  scenario.observedEvents = [
    {
      id: 'blue-hail-1',
      type: 'hail',
      atKeyframe: 'position-1',
      boatId: 'blue',
      message: 'Room',
    },
    {
      id: 'yellow-hail-1',
      type: 'hail',
      atKeyframe: 'position-1',
      boatId: 'yellow',
      message: 'Starboard',
    },
    {
      id: 'blue-penalty-1',
      type: 'penalty-taken',
      atKeyframe: 'position-2',
      boatId: 'blue',
      penaltyType: 'one-turn',
      notes: 'Clear of other boats',
    },
  ];

  it('removes the identity, every state, and all related event types', () => {
    const result = removeBoatFromScenario(scenario, 'blue');

    expect(result).not.toBeNull();
    expect(result?.scenario.boats.map((boat) => boat.id)).toEqual([
      'yellow',
      'red',
    ]);
    expect(
      result?.scenario.keyframes.map((keyframe) =>
        keyframe.boatStates.map((state) => state.boatId),
      ),
    ).toEqual([
      ['yellow', 'red'],
      ['yellow', 'red'],
    ]);
    expect(result?.scenario.observedEvents).toEqual([
      scenario.observedEvents[1],
    ]);
    expect(scenarioSchema.safeParse(result?.scenario).success).toBe(true);
  });

  it('preserves unrelated data without mutating the source scenario', () => {
    const snapshot = structuredClone(scenario);
    const result = removeBoatFromScenario(scenario, 'yellow');

    expect(scenario).toEqual(snapshot);
    expect(result?.scenario).not.toBe(scenario);
    expect(result?.scenario.boats[0]).toBe(scenario.boats[0]);
    expect(result?.scenario.courseFeatures).toBe(scenario.courseFeatures);
    expect(result?.scenario.wind).toBe(scenario.wind);
    expect(result?.scenario.context).toBe(scenario.context);
    expect(result?.scenario.observedEvents).toEqual([
      scenario.observedEvents[0],
      scenario.observedEvents[2],
    ]);
  });

  it('selects the next remaining boat, or the previous boat at the end', () => {
    expect(removeBoatFromScenario(scenario, 'yellow')?.selectedBoatId).toBe(
      'red',
    );
    expect(removeBoatFromScenario(scenario, 'red')?.selectedBoatId).toBe(
      'yellow',
    );
  });

  it('refuses to remove the last boat or an unknown boat', () => {
    const oneBoatScenario = scenarioWith(
      [{ id: 'only', label: 'Only' }],
      [
        {
          id: 'position-1',
          label: 'Position 1',
          boatStates: [
            {
              boatId: 'only',
              position: { x: 1, y: 1 },
              headingDegrees: 0,
              tack: 'port',
            },
          ],
        },
      ],
    );

    expect(removeBoatFromScenario(oneBoatScenario, 'only')).toBeNull();
    expect(removeBoatFromScenario(scenario, 'missing')).toBeNull();
  });
});
