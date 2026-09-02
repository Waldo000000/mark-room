import { z } from 'zod';

import {
  entityIdSchema,
  longTextSchema,
  reportDuplicateIds,
  shortTextSchema,
} from '../shared/schema';

export const RULING_SCHEMA_VERSION = '0.1.0' as const;

export const obligationSchema = z
  .object({
    id: entityIdSchema,
    atMoment: entityIdSchema.optional(),
    boatId: entityIdSchema,
    type: z.enum([
      'keep-clear',
      'give-room',
      'give-mark-room',
      'avoid-contact',
    ]),
    owedToBoatId: entityIdSchema.optional(),
    ruleRefs: z.array(shortTextSchema).min(1),
    explanation: longTextSchema.optional(),
  })
  .strict();

export const outcomeSchema = z
  .object({
    id: entityIdSchema,
    atMoment: entityIdSchema.optional(),
    boatId: entityIdSchema,
    type: z.enum(['rule-breached', 'exonerated', 'penalty', 'no-breach']),
    ruleRefs: z.array(shortTextSchema).min(1),
    explanation: longTextSchema.optional(),
  })
  .strict();

export const rulingSchema = z
  .object({
    schemaVersion: z.literal(RULING_SCHEMA_VERSION),
    obligations: z.array(obligationSchema),
    outcomes: z.array(outcomeSchema),
    conclusion: longTextSchema,
  })
  .strict()
  .superRefine((ruling, context) => {
    if (ruling.obligations.length + ruling.outcomes.length === 0) {
      context.addIssue({
        code: 'custom',
        path: ['obligations'],
        message: 'A ruling requires at least one obligation or outcome',
      });
    }
    reportDuplicateIds(
      [...ruling.obligations, ...ruling.outcomes].map((item) => item.id),
      ['statements'],
      context,
    );
  });

export type Obligation = z.infer<typeof obligationSchema>;
export type Outcome = z.infer<typeof outcomeSchema>;
export type Ruling = z.infer<typeof rulingSchema>;
