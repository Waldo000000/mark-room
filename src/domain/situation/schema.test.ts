import { describe, expect, it } from 'vitest';

import portStarboardEval from '../../../corpus/scenarios/port-starboard.json';
import { situationSchema, type Situation } from './schema';

describe('situationSchema', () => {
  it('captures self-contained RRS-language state without geometry', () => {
    const situation = situationSchema.parse(
      portStarboardEval.expected.situation,
    );

    expect(situation.moments[0].boatStates[0].pointOfSail).toBe('close-hauled');
    expect(situation.moments[0].boatStates[0].sail.luffing).toBe(false);
    expect(situation).not.toHaveProperty('sailingArea');
    expect(situation.moments[0].boatStates[0]).not.toHaveProperty('position');
  });

  it('rejects renderer hull polygons as non-RRS state', () => {
    const situation = structuredClone(
      portStarboardEval.expected.situation,
    ) as unknown as Situation & { hullPolygons: unknown[] };
    situation.hullPolygons = [];

    expect(situationSchema.safeParse(situation).success).toBe(false);
  });

  it('supports ordered moments and explicit RRS-language transitions', () => {
    const situation = structuredClone(
      portStarboardEval.expected.situation,
    ) as Situation;
    const nextMoment = structuredClone(situation.moments[0]);
    nextMoment.id = 'position-2';
    nextMoment.label = 'Position 2';
    situation.moments.push(nextMoment);
    situation.transitions.push({
      fromMomentId: 'position-1',
      toMomentId: 'position-2',
      changes: [
        {
          type: 'course-change',
          boatId: 'yellow',
          fromHeadingDegrees: 45,
          toHeadingDegrees: 60,
        },
      ],
    });

    expect(situationSchema.safeParse(situation).success).toBe(true);
  });
});
