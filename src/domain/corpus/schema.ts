import { z } from 'zod';

import {
  entityIdSchema,
  longTextSchema,
  reportDuplicateIds,
  shortTextSchema,
} from '../shared/schema';

export const provenanceSchema = z
  .object({
    sourceId: entityIdSchema,
    sourceType: z.enum([
      'world_sailing_rule',
      'world_sailing_case',
      'official_interpretation',
      'club_training',
      'competitor_reference',
      'user_report',
      'image',
      'video',
      'other',
    ]),
    title: shortTextSchema.optional(),
    publisher: shortTextSchema.optional(),
    url: z.url().optional(),
    documentVersion: shortTextSchema.optional(),
    publicationDate: z.iso.date().optional(),
    accessedAt: z.iso.datetime({ offset: true }).optional(),
    pageOrSection: shortTextSchema.optional(),
    extractionMethod: z.enum([
      'manual',
      'agent_assisted',
      'ocr',
      'image_reconstruction',
      'video_reconstruction',
    ]),
    notes: longTextSchema.optional(),
  })
  .strict();

const unverifiedSchema = z
  .object({ status: z.literal('unverified'), notes: longTextSchema.optional() })
  .strict();

const reviewedFields = {
  verifiedBy: shortTextSchema,
  verifiedAt: z.iso.datetime({ offset: true }),
  notes: longTextSchema.optional(),
};

export const verificationSchema = z.discriminatedUnion('status', [
  unverifiedSchema,
  z.object({ status: z.literal('agent-reviewed'), ...reviewedFields }).strict(),
  z.object({ status: z.literal('human-verified'), ...reviewedFields }).strict(),
]);

export const corpusMetadataSchema = z
  .object({
    scenarioId: entityIdSchema,
    teachingText: longTextSchema.optional(),
    provenance: z.array(provenanceSchema).min(1),
    verification: verificationSchema,
  })
  .strict()
  .superRefine((metadata, context) => {
    reportDuplicateIds(
      metadata.provenance.map((source) => source.sourceId),
      ['provenance'],
      context,
      'sourceId',
    );
  });

export type Provenance = z.infer<typeof provenanceSchema>;
export type Verification = z.infer<typeof verificationSchema>;
export type CorpusMetadata = z.infer<typeof corpusMetadataSchema>;
