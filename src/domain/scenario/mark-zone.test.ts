import { describe, expect, it } from 'vitest';

import windwardMarkTrainingExample from '../../../corpus/training-examples/windward-mark-zone.json';
import { scenarioSchema } from './schema';
import { deriveMarkZones, markZoneRadiusHullLengths } from './mark-zone';

describe('mark zones', () => {
  it('uses the discipline-specific 2025-2028 zone distance', () => {
    expect(markZoneRadiusHullLengths('general_rrs')).toBe(3);
    expect(markZoneRadiusHullLengths('radio_sailing')).toBe(4);
  });

  it('derives each zone from its mark instead of Scenario zone geometry', () => {
    const scenario = scenarioSchema.parse(windwardMarkTrainingExample.scenario);

    expect(deriveMarkZones(scenario)).toEqual([
      {
        center: { x: 4, y: 5.5 },
        label: '4 hull length zone',
        markId: 'windward-mark',
        radius: 4,
      },
    ]);
  });
});
