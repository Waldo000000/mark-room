'use client';

import { useId } from 'react';

export type KeyframeScrubberItem = {
  id: string;
  label: string;
};

type KeyframeScrubberProps = {
  activeKeyframeId: string;
  keyframes: KeyframeScrubberItem[];
  onSelect: (keyframeId: string) => void;
};

export function KeyframeScrubber({
  activeKeyframeId,
  keyframes,
  onSelect,
}: KeyframeScrubberProps) {
  const inputId = useId();
  const activeIndex = Math.max(
    0,
    keyframes.findIndex((keyframe) => keyframe.id === activeKeyframeId),
  );
  const activeKeyframe = keyframes[activeIndex];

  if (!activeKeyframe) return null;

  const position = activeIndex + 1;
  const valueText = `${activeKeyframe.label}, position ${position} of ${keyframes.length}`;

  return (
    <div className="grid gap-2">
      <label
        className="text-sm font-semibold"
        data-testid="active-keyframe-label"
        htmlFor={inputId}
      >
        {activeKeyframe.label}{' '}
        <span className="font-normal text-muted-foreground">
          ({position} of {keyframes.length})
        </span>
      </label>
      <input
        id={inputId}
        aria-label="Select scenario position"
        aria-valuetext={valueText}
        className="min-h-11 w-full accent-primary"
        data-testid="keyframe-slider"
        max={keyframes.length}
        min="1"
        step="1"
        type="range"
        value={position}
        onChange={(event) => {
          const selectedKeyframe =
            keyframes[Number(event.currentTarget.value) - 1];
          if (selectedKeyframe) onSelect(selectedKeyframe.id);
        }}
      />
    </div>
  );
}
