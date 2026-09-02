import { z } from 'zod';

import { entityIdSchema, shortTextSchema } from '../shared/schema';

export const RULING_SCHEMA_VERSION = '0.1.0' as const;

const statementBaseSchema = z.object({
  atMoment: entityIdSchema,
  boatId: entityIdSchema,
  ruleRefs: z.array(shortTextSchema).min(1),
});

export const obligationSchema = statementBaseSchema
  .extend({
    type: z.enum([
      'keep-clear',
      'give-room',
      'give-mark-room',
      'avoid-contact',
    ]),
    owedToBoatId: entityIdSchema,
  })
  .strict();

export const outcomeSchema = statementBaseSchema
  .extend({
    type: z.enum(['rule-breached', 'exonerated', 'penalty', 'no-breach']),
  })
  .strict();

export const rulingSchema = z
  .object({
    schemaVersion: z.literal(RULING_SCHEMA_VERSION),
    obligations: z.array(obligationSchema),
    outcomes: z.array(outcomeSchema),
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

    [...ruling.obligations, ...ruling.outcomes].forEach((statement) => {
      if (new Set(statement.ruleRefs).size !== statement.ruleRefs.length) {
        context.addIssue({
          code: 'custom',
          path: ['ruleRefs'],
          message: 'Rule references must be unique',
        });
      }
    });
  });

export type Obligation = z.infer<typeof obligationSchema>;
export type Outcome = z.infer<typeof outcomeSchema>;
export type Ruling = z.infer<typeof rulingSchema>;
