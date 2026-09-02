import path from 'node:path';

import { describe, expect, it } from 'vitest';

import portStarboardMetadata from '../../../corpus/metadata/port-starboard.json';
import portStarboardTrainingExample from '../../../corpus/training-examples/port-starboard.json';
import { validateCorpusDirectory, validateCorpusRecords } from './validate';

describe('corpus validation', () => {
  it('validates every stored training example and metadata sidecar', async () => {
    const entries = await validateCorpusDirectory(
      path.resolve(process.cwd(), 'corpus'),
    );

    expect(entries.map((entry) => entry.slug)).toEqual(['port-starboard']);
    expect(entries[0].trainingExample.scenario.title).toBe(
      'Port meets starboard',
    );
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
