import { z } from 'zod';

import { rulingSchema } from '../ruling/schema';
import { scenarioSchema } from '../scenario/schema';
import { situationSchema } from '../situation/schema';

export type EvalCase<Input, Expected> = {
  input: Input;
  expected: Expected;
};

export const scenarioEvalCaseSchema = z
  .object({
    input: scenarioSchema,
    expected: z
      .object({ situation: situationSchema, ruling: rulingSchema })
      .strict(),
  })
  .strict()
  .superRefine((evalCase, context) => {
    if (evalCase.expected.situation.scenarioId !== evalCase.input.id) {
      context.addIssue({
        code: 'custom',
        path: ['expected', 'situation', 'scenarioId'],
        message: 'Situation must reference the input Scenario ID',
      });
    }

    if (
      JSON.stringify(evalCase.expected.situation.context) !==
      JSON.stringify(evalCase.input.context)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['expected', 'situation', 'context'],
        message: 'Situation context must match the input Scenario context',
      });
    }
  });

export type ScenarioEvalCase = z.infer<typeof scenarioEvalCaseSchema>;
