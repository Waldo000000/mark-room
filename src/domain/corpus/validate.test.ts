import path from 'node:path';

import { describe, expect, it } from 'vitest';

import portStarboardMetadata from '../../../corpus/metadata/port-starboard.json';
import portStarboardTrainingExample from '../../../corpus/training-examples/port-starboard.json';
import { deriveMarkZones } from '../scenario/mark-zone';
import { validateCorpusDirectory, validateCorpusRecords } from './validate';

describe('corpus validation', () => {
  it('validates every stored training example and metadata sidecar', async () => {
    const entries = await validateCorpusDirectory(
      path.resolve(process.cwd(), 'corpus'),
    );

    expect(entries.map((entry) => entry.slug)).toEqual([
      'leeward-mark-overlap',
      'port-starboard',
      'windward-leeward',
      'windward-mark-zone',
    ]);
    expect(entries[1].trainingExample.scenario.title).toBe(
      'Port meets starboard',
    );
    const leewardMarkOverlap = entries[0].trainingExample;
    expect(leewardMarkOverlap.scenario.keyframes).toHaveLength(2);
    expect(leewardMarkOverlap.scenario.courseFeatures[0]).toMatchObject({
      id: 'leeward-mark',
      requiredSide: 'port',
      type: 'mark',
    });
    expect(leewardMarkOverlap.rulings.obligations).toContainEqual({
      atMoment: 'position-1',
      boatId: 'yellow',
      owedToBoatId: 'blue',
      ruleRefs: ['RRS 18.2(a)(1)'],
      type: 'give-mark-room',
    });
    const windwardLeeward = entries[2].trainingExample;
    expect(windwardLeeward.situation.moments[0].relationships).toContainEqual({
      type: 'windward-leeward',
      windwardBoatId: 'red',
      leewardBoatId: 'blue',
    });
    expect(windwardLeeward.rulings.obligations[0]).toMatchObject({
      boatId: 'red',
      owedToBoatId: 'blue',
      ruleRefs: ['RRS 11'],
    });
    const windwardMarkZone = entries[3].trainingExample;
    expect(windwardMarkZone.scenario.courseFeatures).toEqual([
      expect.objectContaining({ id: 'windward-mark', type: 'mark' }),
    ]);
    expect(deriveMarkZones(windwardMarkZone.scenario)).toEqual([
      expect.objectContaining({ markId: 'windward-mark', radius: 4 }),
    ]);
    expect(
      windwardMarkZone.situation.moments[0].boatStates.every((state) =>
        state.inZoneOfMarks.includes('windward-mark'),
      ),
    ).toBe(true);
  });

  it('rejects a missing metadata sidecar', () => {
    expect(() =>
      validateCorpusRecords({
        trainingExamples: new Map([
          ['port-starboard', portStarboardTrainingExample],
        ]),
        metadata: new Map(),
      }),
    ).toThrow('has no matching metadata sidecar');
  });

  it('rejects metadata for a different Scenario', () => {
    const metadata = structuredClone(portStarboardMetadata);
    metadata.scenarioId = 'another-scenario';

    expect(() =>
      validateCorpusRecords({
        trainingExamples: new Map([
          ['port-starboard', portStarboardTrainingExample],
        ]),
        metadata: new Map([['port-starboard', metadata]]),
      }),
    ).toThrow('references another-scenario');
  });
});
