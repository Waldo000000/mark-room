import {
  BoatGlyph,
  deriveSailPresentation,
} from '@/src/components/scenario/boat-glyph';
import type { Scenario } from '@/src/domain/scenario/schema';

export const GHOSTED_BOAT_OPACITY = '0.28';
export const KEYFRAME_TRACK_LINE_OPACITY = '0.36';

type GhostedKeyframeBoatsProps = {
  activeKeyframeId: string;
  scenario: Scenario;
};

type KeyframeTrackLinesProps = {
  scenario: Scenario;
};

function formatTrackCoordinate(value: number): string {
  return String(Math.round(value * 100) / 100);
}

function keyframeTrackPoints(scenario: Scenario, boatId: string): string {
  return scenario.keyframes
    .map((keyframe) =>
      keyframe.boatStates.find((state) => state.boatId === boatId),
    )
    .filter((state) => state !== undefined)
    .map(
      (state) =>
        `${formatTrackCoordinate(state.position.x)},${formatTrackCoordinate(
          scenario.sailingArea.height - state.position.y,
        )}`,
    )
    .join(' ');
}

export function KeyframeTrackLines({ scenario }: KeyframeTrackLinesProps) {
  return (
    <g
      aria-hidden="true"
      data-testid="keyframe-track-lines"
      pointerEvents="none"
    >
      {scenario.boats.map((boat) => {
        const points = keyframeTrackPoints(scenario, boat.id);
        if (!points.includes(' ')) return null;

        return (
          <polyline
            key={boat.id}
            data-boat-id={boat.id}
            data-testid={`keyframe-track-line-${boat.id}`}
            fill="none"
            opacity={KEYFRAME_TRACK_LINE_OPACITY}
            points={points}
            stroke={boat.color ?? '#0f766e'}
            strokeDasharray="0.14 0.12"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="0.055"
            vectorEffect="non-scaling-stroke"
          />
        );
      })}
    </g>
  );
}

export function GhostedKeyframeBoats({
  activeKeyframeId,
  scenario,
}: GhostedKeyframeBoatsProps) {
  const boatsById = new Map(scenario.boats.map((boat) => [boat.id, boat]));

  return (
    <g
      aria-hidden="true"
      data-active-keyframe-id={activeKeyframeId}
      data-labels="hidden"
      data-testid="ghosted-keyframe-context"
      pointerEvents="none"
    >
      {scenario.keyframes
        .filter((keyframe) => keyframe.id !== activeKeyframeId)
        .flatMap((keyframe) =>
          keyframe.boatStates.map((state) => {
            const boat = boatsById.get(state.boatId);
            if (!boat) return null;

            const screenY = scenario.sailingArea.height - state.position.y;

            return (
              <g
                key={`${keyframe.id}-${boat.id}`}
                data-boat-id={boat.id}
                data-keyframe-id={keyframe.id}
                data-testid={`ghost-boat-${keyframe.id}-${boat.id}`}
                opacity={GHOSTED_BOAT_OPACITY}
              >
                <g
                  transform={`translate(${state.position.x} ${screenY}) rotate(${state.headingDegrees})`}
                >
                  <BoatGlyph
                    color={boat.color ?? '#0f766e'}
                    sail={deriveSailPresentation(
                      state.headingDegrees,
                      scenario.wind.fromDegrees,
                      state.tack,
                    )}
                  />
                </g>
              </g>
            );
          }),
        )}
    </g>
  );
}
