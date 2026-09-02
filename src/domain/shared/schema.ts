import { z } from 'zod';

export const entityIdSchema = z
  .string()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use a lowercase, hyphen-separated ID');

export const shortTextSchema = z.string().trim().min(1).max(200);
export const longTextSchema = z.string().trim().min(1).max(5_000);
export const tackSchema = z.enum(['port', 'starboard']);
export const rulesContextSchema = z
  .object({
    discipline: z.enum(['radio_sailing', 'general_rrs']),
    ruleSetVersion: shortTextSchema.optional(),
  })
  .strict();
