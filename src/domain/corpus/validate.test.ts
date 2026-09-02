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
      'leeward-mark-clear-ahead',
      'leeward-mark-overlap',
      'port-starboard',
      'windward-leeward',
      'windward-mark-zone',
    ]);
    expect(entries[2].trainingExample.scenario.title).toBe(
      'Port meets starboard',
    );
    const leewardMarkClearAhead = entries[0].trainingExample;
    expect(leewardMarkClearAhead.scenario.keyframes).toHaveLength(2);
    expect(leewardMarkClearAhead.scenario.courseFeatures[0]).toMatchObject({
      id: 'leeward-mark',
      requiredSide: 'port',
      type: 'mark',
    });
    expect(
      leewardMarkClearAhead.situation.moments[0].relationships,
    ).toContainEqual({
      type: 'relative-position',
      subjectBoatId: 'blue',
      otherBoatId: 'yellow',
      relationship: 'clear-ahead',
    });
    expect(leewardMarkClearAhead.situation.moments[0].boatStates).toEqual([
      expect.objectContaining({ inZoneOfMarks: ['leeward-mark'] }),
      expect.objectContaining({ inZoneOfMarks: [] }),
    ]);
    expect(
      leewardMarkClearAhead.situation.moments[1].relationships,
    ).toContainEqual({
      type: 'relative-position',
      subjectBoatId: 'blue',
      otherBoatId: 'yellow',
      relationship: 'overlapped',
    });
    expect(leewardMarkClearAhead.rulings.obligations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          atMoment: 'position-1',
          boatId: 'yellow',
          owedToBoatId: 'blue',
          ruleRefs: ['RRS 18.2(a)(2)'],
          type: 'give-mark-room',
        }),
        expect.objectContaining({
          atMoment: 'position-2',
          boatId: 'yellow',
          owedToBoatId: 'blue',
          ruleRefs: ['RRS 18.2(a)(2)'],
          type: 'give-mark-room',
        }),
      ]),
    );
    const leewardMarkOverlap = entries[1].trainingExample;
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
    const windwardLeeward = entries[3].trainingExample;
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
    const windwardMarkZone = entries[4].trainingExample;
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
