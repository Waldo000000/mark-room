import { describe, expect, it } from 'vitest';
import example from '../../../corpus/training-examples/port-starboard.json';
import { scenarioSchema } from './schema';
import { playbackBoatStates, playbackDuration } from './playback';

function fixture() {
  const scenario = scenarioSchema.parse(example.scenario);
  scenario.keyframes[0].boatStates[0] = {
    boatId: scenario.boats[0].id,
    position: { x: 1, y: 2 },
    headingDegrees: 359,
    tack: 'starboard',
  };
  scenario.keyframes[1].boatStates[0] = {
    boatId: scenario.boats[0].id,
    position: { x: 3, y: 4 },
    headingDegrees: 1,
    tack: 'port',
  };
  return scenario;
}

describe('illustrative one-second playback', () => {
  it('uses each recorded interval in a longer sequence', () => {
    const scenario = fixture();
    const third = structuredClone(scenario.keyframes[1]);
    third.id = 'third';
    third.boatStates[0].position = { x: 7, y: 6 };
    scenario.keyframes.push(third);
    expect(playbackDuration(scenario)).toBe(2);
    expect(playbackBoatStates(scenario, 1)).toEqual(
      scenario.keyframes[1].boatStates,
    );
    expect(playbackBoatStates(scenario, 1.5)[0].position).toEqual({
      x: 5,
      y: 5,
    });
    expect(playbackBoatStates(scenario, 2)).toEqual(third.boatStates);
  });
  it('preserves every authored endpoint, clamps time and does not modify input', () => {
    const scenario = fixture();
    const before = structuredClone(scenario);
    expect(playbackDuration(scenario)).toBe(scenario.keyframes.length - 1);
    for (let index = 0; index < scenario.keyframes.length; index++)
      expect(playbackBoatStates(scenario, index)).toEqual(
        scenario.keyframes[index].boatStates,
      );
    expect(playbackBoatStates(scenario, -2)).toEqual(
      scenario.keyframes[0].boatStates,
    );
    expect(playbackBoatStates(scenario, 999)).toEqual(
      scenario.keyframes.at(-1)!.boatStates,
    );
    playbackBoatStates(scenario, 0.5);
    expect(scenario).toEqual(before);
  });
  it('interpolates positions and takes the short arc across north', () => {
    const scenario = fixture();
    expect(playbackBoatStates(scenario, 0.5)[0]).toMatchObject({
      position: { x: 2, y: 3 },
      headingDegrees: 0,
      tack: 'starboard',
    });
    expect(playbackBoatStates(scenario, 0.75)[0]).toMatchObject({
      headingDegrees: 0.5,
      tack: 'port',
    });
    scenario.keyframes[0].boatStates[0].headingDegrees = 1;
    scenario.keyframes[1].boatStates[0].headingDegrees = 359;
    expect(playbackBoatStates(scenario, 0.5)[0].headingDegrees).toBe(0);
  });
  it('retains preceding explicit tack in ambiguous geometry and matches boats by identity', () => {
    const scenario = fixture();
    scenario.keyframes[0].boatStates[0].headingDegrees = 170;
    scenario.keyframes[1].boatStates[0].headingDegrees = 190;
    scenario.keyframes[1].boatStates.reverse();
    expect(playbackBoatStates(scenario, 0.5)[0]).toMatchObject({
      position: { x: 2, y: 3 },
      headingDegrees: 180,
      tack: 'starboard',
    });
    expect(
      playbackBoatStates(scenario, 1).find(
        (boat) => boat.boatId === scenario.boats[0].id,
      )!.tack,
    ).toBe('port');
  });
  it('chooses a clockwise half-turn tie and handles a single keyframe', () => {
    const scenario = fixture();
    scenario.keyframes[0].boatStates[0].headingDegrees = 0;
    scenario.keyframes[1].boatStates[0].headingDegrees = 180;
    expect(playbackBoatStates(scenario, 0.5)[0].headingDegrees).toBe(90);
    scenario.keyframes = scenario.keyframes.slice(0, 1);
    expect(playbackDuration(scenario)).toBe(0);
    expect(playbackBoatStates(scenario, 10)).toEqual(
      scenario.keyframes[0].boatStates,
    );
  });
});
