import path from 'node:path';

import { describe, expect, it } from 'vitest';

import portStarboardEvalCase from '../../../corpus/eval-cases/port-starboard.json';
import portStarboardMetadata from '../../../corpus/metadata/port-starboard.json';
import { validateCorpusDirectory, validateCorpusRecords } from './validate';

describe('corpus validation', () => {
  it('validates every stored EvalCase and metadata sidecar', async () => {
    const entries = await validateCorpusDirectory(
      path.resolve(process.cwd(), 'corpus'),
    );

    expect(entries.map((entry) => entry.slug)).toEqual(['port-starboard']);
    expect(entries[0].evalCase.input.title).toBe('Port meets starboard');
  });

  it('rejects a missing metadata sidecar', () => {
    expect(() =>
      validateCorpusRecords({
        evalCases: new Map([['port-starboard', portStarboardEvalCase]]),
        metadata: new Map(),
      }),
    ).toThrow('has no matching metadata sidecar');
  });

  it('rejects metadata for a different Scenario', () => {
    const metadata = structuredClone(portStarboardMetadata);
    metadata.scenarioId = 'another-scenario';

    expect(() =>
      validateCorpusRecords({
        evalCases: new Map([['port-starboard', portStarboardEvalCase]]),
        metadata: new Map([['port-starboard', metadata]]),
      }),
    ).toThrow('references another-scenario');
  });
});
