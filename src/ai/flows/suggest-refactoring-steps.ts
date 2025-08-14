'use server';

/**
 * @fileOverview An AI agent that suggests optimal refactoring steps using an LLM to automatically decide the ordering of renames and consider potential naming conflicts, prioritizing minimal downtime by generating backward compatible SQL.
 *
 * - suggestRefactoringSteps - A function that handles the suggestion of refactoring steps.
 * - SuggestRefactoringStepsInput - The input type for the suggestRefactoringSteps function.
 * - SuggestRefactoringStepsOutput - The return type for the suggestRefactoringSteps function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestRefactoringStepsInputSchema = z.object({
  tables: z.array(
    z.object({
      schema: z.string(),
      name: z.string(),
      columns: z.array(z.object({name: z.string(), type: z.string()})),
      foreignKeys: z.array(z.object({name: z.string()})),
      indexes: z.array(z.object({name: z.string()})),
    })
  ).describe('An array of table information from the database schema.'),
  renames: z.array(
    z.object({
      scope: z.string(),
      area: z.string().optional(),
      tableFrom: z.string(),
      tableTo: z.string().nullable().optional(),
      columnFrom: z.string().nullable().optional(),
      columnTo: z.string().nullable().optional(),
      type: z.string().nullable().optional(),
      note: z.string().nullable().optional(),
    })
  ).describe('An array of rename operations to consider.'),
});
export type SuggestRefactoringStepsInput = z.infer<
  typeof SuggestRefactoringStepsInputSchema
>;

const SuggestRefactoringStepsOutputSchema = z.object({
  orderedRenames: z.array(
    z.object({
      scope: z.string(),
      area: z.string().optional(),
      tableFrom: z.string(),
      tableTo: z.string().nullable().optional(),
      columnFrom: z.string().nullable().optional(),
      columnTo: z.string().nullable().optional(),
      type: z.string().nullable().optional(),
      note: z.string().nullable().optional(),
    })
  ).describe('An array of rename operations, ordered for minimal downtime and conflict avoidance.'),
  rationale: z.string().describe('The LLM rationale for the suggested ordering.'),
});
export type SuggestRefactoringStepsOutput = z.infer<
  typeof SuggestRefactoringStepsOutputSchema
>;

export async function suggestRefactoringSteps(
  input: SuggestRefactoringStepsInput
): Promise<SuggestRefactoringStepsOutput> {
  return suggestRefactoringStepsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestRefactoringStepsPrompt',
  input: {schema: SuggestRefactoringStepsInputSchema},
  output: {schema: SuggestRefactoringStepsOutputSchema},
  prompt: `You are an expert database refactoring assistant. Given a database schema and a list of rename operations, you will suggest an optimal ordering of these operations to minimize downtime and avoid naming conflicts.  You will also provide a short rationale for the ordering.

Here is the database schema:
{{#each tables}}
  Table: {{name}} (Schema: {{schema}})
  Columns:{{#each columns}} {{name}} ({{type}}){{/each}}
  Foreign Keys:{{#each foreignKeys}} {{name}}{{/each}}
  Indexes:{{#each indexes}} {{name}}{{/each}}
{{/each}}

Here are the rename operations to consider:
{{#each renames}}
  Scope: {{scope}}, Table From: {{tableFrom}}, Table To: {{tableTo}}, Column From: {{columnFrom}}, Column To: {{columnTo}}, Type: {{type}}, Note: {{note}}
{{/each}}

Please provide the ordered list of rename operations and your rationale.

Output in JSON format:
{ "orderedRenames": [ /* ordered rename operations */ ], "rationale": "/* rationale */"}
`,
});

const suggestRefactoringStepsFlow = ai.defineFlow(
  {
    name: 'suggestRefactoringStepsFlow',
    inputSchema: SuggestRefactoringStepsInputSchema,
    outputSchema: SuggestRefactoringStepsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
