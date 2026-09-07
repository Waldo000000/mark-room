import { describe, expect, it } from 'vitest';

import type { Scenario } from '../../domain/scenario/schema';

import {
  alignedHeadingForBoatMove,
  headingFromDisplacement,
  isHeadingAlignmentDisabled,
  parseDisabledHeadingAlignmentPairs,
  withHeadingAlignmentDisabled,
} from './heading-alignment';

const scenario = {
  boats: [{ id: 'boat:one' }, { id: 'boat-two' }],
  keyframes: [
    {
      id: 'frame:one',
      boatStates: [
        { boatId: 'boat:one', position: { x: 1, y: 1 } },
        { boatId: 'boat-two', position: { x: 3, y: 3 } },
      ],
    },
    {
      id: 'frame-two',
      boatStates: [
        { boatId: 'boat:one', position: { x: 2, y: 2 } },
        { boatId: 'boat-two', position: { x: 4, y: 4 } },
      ],
    },
  ],
} as Scenario;

describe('headingFromDisplacement', () => {
  it.each([
    [{ x: 0, y: 1 }, 0],
    [{ x: 1, y: 0 }, 90],
    [{ x: 0, y: -1 }, 180],
    [{ x: -1, y: 0 }, 270],
    [{ x: 1, y: 1 }, 45],
    [{ x: -1, y: 1 }, 315],
  ])('uses compass headings for displacement to %j', (next, heading) => {
    expect(headingFromDisplacement({ x: 0, y: 0 }, next, 123)).toBe(heading);
  });

  it('preserves the last heading for a missing or coincident previous point', () => {
    expect(headingFromDisplacement(undefined, { x: 4, y: 4 }, 359)).toBe(359);
    expect(
      headingFromDisplacement({ x: 1, y: 1 }, { x: 1.006, y: 1.008 }, 271),
    ).toBe(271);
    expect(
      headingFromDisplacement({ x: 100, y: 100 }, { x: 100.01, y: 100 }, 88),
    ).toBe(88);
  });

  it('rounds and wraps a north-westerly heading', () => {
    expect(
      headingFromDisplacement({ x: 0, y: 0 }, { x: -0.001, y: 1 }, 180),
    ).toBe(0);
  });
});

describe('alignedHeadingForBoatMove', () => {
  it('uses only the immediately previous keyframe', () => {
    const missingFromImmediate = structuredClone(scenario);
    missingFromImmediate.keyframes[1].boatStates =
      missingFromImmediate.keyframes[1].boatStates.filter(
        (state) => state.boatId !== 'boat:one',
      );
    missingFromImmediate.keyframes.push({
      id: 'frame-three',
      label: 'Frame three',
      boatStates: [
        {
          boatId: 'boat:one',
          position: { x: 6, y: 6 },
          headingDegrees: 123,
          tack: 'port',
        },
      ],
    });

    expect(
      alignedHeadingForBoatMove({
        boatId: 'boat:one',
        currentHeadingDegrees: 123,
        keyframeId: 'frame-three',
        nextPosition: { x: 1, y: 1 },
        scenario: missingFromImmediate,
      }),
    ).toBe(123);
  });
});

describe('disabled heading alignment metadata', () => {
  it('validates, filters stale entries, and de-duplicates pairs', () => {
    expect(
      parseDisabledHeadingAlignmentPairs(
        [
          { boatId: 'boat:one', keyframeId: 'frame-two' },
          { boatId: 'boat:one', keyframeId: 'frame-two' },
          { boatId: 'missing', keyframeId: 'frame-two' },
          { boatId: 'boat:one', keyframeId: 'missing' },
          { boatId: 1, keyframeId: 'frame-two' },
          null,
        ],
        scenario,
      ),
    ).toEqual([{ boatId: 'boat:one', keyframeId: 'frame-two' }]);
  });

  it('updates exact object pairs even when IDs contain delimiters', () => {
    const pair = { boatId: 'boat:one', keyframeId: 'frame:one' };
    const disabled = withHeadingAlignmentDisabled([], pair, true);

    expect(isHeadingAlignmentDisabled(disabled, pair)).toBe(true);
    expect(withHeadingAlignmentDisabled(disabled, pair, false)).toEqual([]);
  });
});
