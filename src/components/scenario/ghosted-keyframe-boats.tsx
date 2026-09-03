import {
  BoatGlyph,
  deriveSailPresentation,
} from '@/src/components/scenario/boat-glyph';
import type { Scenario } from '@/src/domain/scenario/schema';

export const GHOSTED_BOAT_OPACITY = '0.28';

type GhostedKeyframeBoatsProps = {
  activeKeyframeId: string;
  scenario: Scenario;
};

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
