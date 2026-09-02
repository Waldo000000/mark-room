import { describe, expect, it } from 'vitest';

import portStarboardMetadata from '../../../corpus/metadata/port-starboard.json';

import { corpusMetadataSchema, type CorpusMetadata } from './schema';

describe('corpusMetadataSchema', () => {
  it('validates provenance and verification outside Scenario', () => {
    const metadata: CorpusMetadata = corpusMetadataSchema.parse(
      portStarboardMetadata,
    );

    expect(metadata.scenarioId).toBe('development-port-starboard-crossing');
    expect(metadata.provenance[0].publisher).toBe('World Sailing');
    expect(metadata.verification.status).toBe('unverified');
  });

  it('requires reviewer details for reviewed records', () => {
    const metadata = structuredClone(portStarboardMetadata) as Record<
      string,
      unknown
    >;
    metadata.verification = { status: 'human-verified' };

    expect(corpusMetadataSchema.safeParse(metadata).success).toBe(false);
  });

  it('rejects duplicate source IDs', () => {
    const metadata = structuredClone(portStarboardMetadata);
    metadata.provenance.push(structuredClone(metadata.provenance[0]));

    const result = corpusMetadataSchema.safeParse(metadata);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) =>
          issue.message.includes('Duplicate source ID'),
        ),
      ).toBe(true);
    }
  });

  it('rejects unknown properties', () => {
    const metadata = structuredClone(portStarboardMetadata) as Record<
      string,
      unknown
    >;
    metadata.canonical = true;

    expect(corpusMetadataSchema.safeParse(metadata).success).toBe(false);
  });
});
