// EnhanceEmotionDetectionWithGenAI Flow
'use server';

/**
 * @fileOverview Enhances emotion detection using GenAI by incorporating textual descriptions.
 *
 * - enhanceEmotionDetection - A function to enhance emotion detection with GenAI.
 * - EnhanceEmotionDetectionInput - The input type for the enhanceEmotionDetection function.
 * - EnhanceEmotionDetectionOutput - The return type for the enhanceEmotionDetection function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const EnhanceEmotionDetectionInputSchema = z.object({
  emotion: z.string().describe('The emotion to enhance (e.g., Happy, Sad, Angry).'),
  description: z.string().describe('A detailed textual description of the emotion and scenarios where it might be expressed.'),
  currentAccuracy: z.number().describe('The current accuracy of the emotion detection model for the specified emotion (0 to 1).'),
});
export type EnhanceEmotionDetectionInput = z.infer<typeof EnhanceEmotionDetectionInputSchema>;

const EnhanceEmotionDetectionOutputSchema = z.object({
  enhancedAccuracy: z.number().describe('The potential enhanced accuracy of the emotion detection model after incorporating the description (0 to 1).'),
  reasoning: z.string().describe('Explanation of how the provided description can improve emotion detection accuracy.'),
});
export type EnhanceEmotionDetectionOutput = z.infer<typeof EnhanceEmotionDetectionOutputSchema>;

export async function enhanceEmotionDetection(input: EnhanceEmotionDetectionInput): Promise<EnhanceEmotionDetectionOutput> {
  return enhanceEmotionDetectionFlow(input);
}

const enhanceEmotionDetectionPrompt = ai.definePrompt({
  name: 'enhanceEmotionDetectionPrompt',
  input: { schema: EnhanceEmotionDetectionInputSchema },
  output: { schema: EnhanceEmotionDetectionOutputSchema },
  prompt: `You are an AI assistant designed to enhance emotion detection models. 
You receive the emotion to enhance, a textual description of the emotion, and the current accuracy of the emotion detection model for that emotion.
Based on the description, you should determine the potential enhanced accuracy of the model (a number between 0 and 1) and provide reasoning for how the description helps improve the model.

Emotion: {{{emotion}}}
Description: {{{description}}}
Current Accuracy: {{{currentAccuracy}}}

Enhanced Accuracy: 
Reasoning: `,
});

const enhanceEmotionDetectionFlow = ai.defineFlow(
  {
    name: 'enhanceEmotionDetectionFlow',
    inputSchema: EnhanceEmotionDetectionInputSchema,
    outputSchema: EnhanceEmotionDetectionOutputSchema,
  },
  async (input) => {
    const { output } = await enhanceEmotionDetectionPrompt(input);
    return output!;
  }
);
