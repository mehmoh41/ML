'use server';
/**
 * @fileOverview A sign language gesture suggestion AI agent.
 *
 * - suggestSignLanguageGestures - A function that suggests sign language gestures.
 * - SuggestSignLanguageGesturesInput - The input type for the suggestSignLanguageGestures function.
 * - SuggestSignLanguageGesturesOutput - The return type for the suggestSignLanguageGestures function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestSignLanguageGesturesInputSchema = z.object({
  existingGestures: z
    .array(z.string())
    .describe('The list of existing sign language gestures.'),
  desiredCapabilities: z
    .string()
    .describe(
      'The desired capabilities or categories of new sign language gestures.'
    ),
});
export type SuggestSignLanguageGesturesInput = z.infer<
  typeof SuggestSignLanguageGesturesInputSchema
>;

const SuggestSignLanguageGesturesOutputSchema = z.object({
  suggestedGestures: z
    .array(z.string())
    .describe('The list of suggested sign language gestures.'),
});
export type SuggestSignLanguageGesturesOutput = z.infer<
  typeof SuggestSignLanguageGesturesOutputSchema
>;

export async function suggestSignLanguageGestures(
  input: SuggestSignLanguageGesturesInput
): Promise<SuggestSignLanguageGesturesOutput> {
  return suggestSignLanguageGesturesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestSignLanguageGesturesPrompt',
  input: {schema: SuggestSignLanguageGesturesInputSchema},
  output: {schema: SuggestSignLanguageGesturesOutputSchema},
  prompt: `You are an expert in sign language and have a deep understanding of various gestures.

You will suggest new sign language gestures based on the existing gestures and the desired capabilities.

Existing Gestures: {{{existingGestures}}}
Desired Capabilities: {{{desiredCapabilities}}}

Please provide a list of suggested gestures that would expand the model's capabilities and improve its recognition of diverse hand movements.`,
});

const suggestSignLanguageGesturesFlow = ai.defineFlow(
  {
    name: 'suggestSignLanguageGesturesFlow',
    inputSchema: SuggestSignLanguageGesturesInputSchema,
    outputSchema: SuggestSignLanguageGesturesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
