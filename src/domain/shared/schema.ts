import { z } from 'zod';

export const entityIdSchema = z
  .string()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use a lowercase, hyphen-separated ID');

export const shortTextSchema = z.string().trim().min(1).max(200);
export const longTextSchema = z.string().trim().min(1).max(5_000);
export const headingDegreesSchema = z.number().gte(0).lt(360);
export const tackSchema = z.enum(['port', 'starboard']);

export const rulesContextSchema = z
  .object({
    discipline: z.enum(['radio_sailing', 'general_rrs']),
    ruleSetVersion: shortTextSchema,
  })
  .strict();

export function reportDuplicateIds(
  values: string[],
  path: (string | number)[],
  context: z.RefinementCtx,
  field = 'id',
) {
  const seen = new Set<string>();

  values.forEach((value, index) => {
    if (seen.has(value)) {
      context.addIssue({
        code: 'custom',
        path: [...path, index, field],
        message: `Duplicate ID: ${value}`,
      });
    }
    seen.add(value);
  });
}

export function requireReference(
  value: string,
  validValues: Set<string>,
  path: (string | number)[],
  label: string,
  context: z.RefinementCtx,
) {
  if (!validValues.has(value)) {
    context.addIssue({
      code: 'custom',
      path,
      message: `Unknown ${label}: ${value}`,
    });
  }
}

export type Tack = z.infer<typeof tackSchema>;
export type RulesContext = z.infer<typeof rulesContextSchema>;
