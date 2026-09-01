import { describe, expect, it } from 'vitest';

import portStarboard from '../../../corpus/scenarios/port-starboard.json';
import {
  CorpusValidationError,
  validateCorpusDirectory,
  validateCorpusDocuments,
} from './validate';

describe('corpus validation', () => {
  it('validates every checked-in scenario', async () => {
    const corpus = await validateCorpusDirectory();

    expect(corpus.files).toHaveLength(2);
    expect(corpus.scenarios.map((scenario) => scenario.id).sort()).toEqual([
      'development-port-starboard-crossing',
      'development-windward-leeward-overlap',
    ]);
  });

  it('rejects scenario IDs reused by another file', () => {
    expect(() =>
      validateCorpusDocuments([
        { filePath: 'one.json', value: portStarboard },
        { filePath: 'two.json', value: structuredClone(portStarboard) },
      ]),
    ).toThrow(/duplicate scenario ID development-port-starboard-crossing/);
  });

  it('reports the file and field for invalid scenario data', () => {
    const invalidScenario = structuredClone(portStarboard) as Record<
      string,
      unknown
    >;
    delete invalidScenario.provenance;

    try {
      validateCorpusDocuments([
        { filePath: 'broken.json', value: invalidScenario },
      ]);
      throw new Error('Expected validation to fail');
    } catch (error) {
      expect(error).toBeInstanceOf(CorpusValidationError);
      expect((error as Error).message).toContain('broken.json: provenance');
    }
  });
});
