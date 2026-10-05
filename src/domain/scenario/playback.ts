import { inferTackFromHeading, normalizeDegrees } from './geometry';
import type { BoatState, Scenario } from './schema';

// Presentation timing only. This does not add physical timestamps to Scenario.
export function playbackDuration(scenario: Scenario): number {
  return scenario.keyframes.length - 1;
}

export function playbackBoatStates(
  scenario: Scenario,
  seconds: number,
): BoatState[] {
  const time = Math.max(
    0,
    Math.min(
      playbackDuration(scenario),
      Number.isFinite(seconds) ? seconds : 0,
    ),
  );
  const index = Math.floor(time);
  const from = scenario.keyframes[index];
  const fraction = time - index;
  // Preserve authored endpoint values exactly, including explicit tack.
  if (fraction === 0) return from.boatStates;
  const nextById = new Map(
    scenario.keyframes[index + 1].boatStates.map((state) => [
      state.boatId,
      state,
    ]),
  );
  return from.boatStates.map((start) => {
    const end = nextById.get(start.boatId)!; // Valid Scenario has every boat in every frame.
    let turn =
      normalizeDegrees(end.headingDegrees - start.headingDegrees + 180) - 180;
    if (turn === -180) turn = 180; // Deterministic illustrative tie: clockwise.
    const headingDegrees = normalizeDegrees(
      start.headingDegrees + turn * fraction,
    );
    return {
      ...start,
      position: {
        x: start.position.x + (end.position.x - start.position.x) * fraction,
        y: start.position.y + (end.position.y - start.position.y) * fraction,
      },
      headingDegrees,
      tack:
        inferTackFromHeading(headingDegrees, scenario.wind.fromDegrees) ??
        start.tack,
    };
  });
}
