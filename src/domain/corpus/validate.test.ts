import { describe, expect, it } from 'vitest';

import portStarboardMetadata from '../../../corpus/metadata/port-starboard.json';
import portStarboard from '../../../corpus/scenarios/port-starboard.json';
import {
  CorpusValidationError,
  validateCorpusDirectory,
  validateCorpusDocuments,
} from './validate';

const metadataDocument = {
  filePath: 'metadata.json',
  value: portStarboardMetadata,
};

describe('corpus validation', () => {
  it('validates every checked-in eval and its sidecar metadata', async () => {
    const corpus = await validateCorpusDirectory();

    expect(corpus.files).toHaveLength(4);
    expect(corpus.evalCases.map((item) => item.input.id).sort()).toEqual([
      'development-port-starboard-crossing',
      'development-windward-leeward-overlap',
    ]);
    expect(corpus.metadata).toHaveLength(2);
  });

  it('rejects scenario IDs reused by another eval file', () => {
    expect(() =>
      validateCorpusDocuments(
        [
          { filePath: 'one.json', value: portStarboard },
          { filePath: 'two.json', value: structuredClone(portStarboard) },
        ],
        [metadataDocument],
      ),
    ).toThrow(/duplicate scenario ID development-port-starboard-crossing/);
  });

  it('requires exactly one provenance and verification sidecar per eval', () => {
    expect(() =>
      validateCorpusDocuments(
        [{ filePath: 'scenario.json', value: portStarboard }],
        [],
      ),
    ).toThrow(/No corpus metadata JSON files were found/);
  });

  it('reports cross-boundary reference failures with their location', () => {
    const invalidEval = structuredClone(portStarboard);
    invalidEval.expected.ruling.obligations[0].boatId = 'missing';

    try {
      validateCorpusDocuments(
        [{ filePath: 'broken.json', value: invalidEval }],
        [metadataDocument],
      );
      throw new Error('Expected validation to fail');
    } catch (error) {
      expect(error).toBeInstanceOf(CorpusValidationError);
      expect((error as Error).message).toContain(
        'broken.json: expected.ruling.obligations.0.boatId',
      );
    }
  });

  it('rejects a missing Situation moment for a Scenario keyframe', () => {
    const invalidEval = structuredClone(portStarboard);
    invalidEval.input.keyframes.push({
      ...structuredClone(invalidEval.input.keyframes[0]),
      id: 'position-2',
      label: 'Position 2',
    });

    expect(() =>
      validateCorpusDocuments(
        [{ filePath: 'broken.json', value: invalidEval }],
        [metadataDocument],
      ),
    ).toThrow(/Situation moments must match Scenario keyframes/);
  });
});
