'use server';
/**
 * @fileOverview A flow for creating structured memories from text and voice inputs.
 *
 * - createMemory - A function that handles the creation of a structured memory.
 * - CreateMemoryInput - The input type for the createMemory function.
 * - CreateMemoryOutput - The return type for the createMemory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CreateMemoryInputSchema = z.object({
  text: z.string().describe('The text content of the memory.'),
  voiceDataUri: z
    .string()
    .optional()
    .describe(
      'Optional voice data associated with the memory, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' // Per Guidance
    ),
});
export type CreateMemoryInput = z.infer<typeof CreateMemoryInputSchema>;

const CreateMemoryOutputSchema = z.object({
  structuredMemory: z.string().describe('A structured representation of the memory.'),
});
export type CreateMemoryOutput = z.infer<typeof CreateMemoryOutputSchema>;

export async function createMemory(input: CreateMemoryInput): Promise<CreateMemoryOutput> {
  return createMemoryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'createMemoryPrompt',
  input: {schema: CreateMemoryInputSchema},
  output: {schema: CreateMemoryOutputSchema},
  prompt: `You are an AI assistant that creates structured memories from user inputs.

  Create a structured representation of the following input, suitable for retrieval augmented generation (RAG).

  Input: {{{text}}}
  {{~#if voiceDataUri}}Voice Data: {{media url=voiceDataUri}}{{/if}}
  Structured Memory:`, // Use Handlebars syntax
});

const createMemoryFlow = ai.defineFlow(
  {
    name: 'createMemoryFlow',
    inputSchema: CreateMemoryInputSchema,
    outputSchema: CreateMemoryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
