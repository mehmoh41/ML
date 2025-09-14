'use server';
/**
 * @fileOverview Analyzes audio input using GenAI to provide insights such as the presence of music,
 * background noise levels, and clarity of speech, to optimize the performance of the voice recognition model.
 *
 * - analyzeAudio - A function that analyzes the audio.
 * - AnalyzeAudioInput - The input type for the analyzeAudio function.
 * - AnalyzeAudioOutput - The return type for the analyzeAudio function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeAudioInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "The audio data URI to be analyzed, which must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'." // Corrected description
    ),
});
export type AnalyzeAudioInput = z.infer<typeof AnalyzeAudioInputSchema>;

const AnalyzeAudioOutputSchema = z.object({
  musicPresence: z.boolean().describe('Indicates whether music is present in the audio.'),
  noiseLevel: z
    .string()
    .describe(
      'A description of the background noise level in the audio (e.g., low, medium, high).' // Corrected description
    ),
  speechClarity: z
    .string()
    .describe('A qualitative assessment of the speech clarity in the audio (e.g., clear, muffled, noisy).'), // Corrected description
  overallQuality: z
    .string()
    .describe('A summary of the overall audio quality, considering music, noise, and speech.'),
});
export type AnalyzeAudioOutput = z.infer<typeof AnalyzeAudioOutputSchema>;

export async function analyzeAudio(input: AnalyzeAudioInput): Promise<AnalyzeAudioOutput> {
  return analyzeAudioFlow(input);
}

const analyzeAudioPrompt = ai.definePrompt({
  name: 'analyzeAudioPrompt',
  input: {schema: AnalyzeAudioInputSchema},
  output: {schema: AnalyzeAudioOutputSchema},
  prompt: `You are an expert audio analyst. Analyze the given audio and provide insights.

Analyze the following audio data:

{{media url=audioDataUri}}

Consider these aspects:
- Presence of music (true/false)
- Background noise level (low, medium, high)
- Clarity of speech (clear, muffled, noisy)
- Overall audio quality (good, fair, poor)

Based on your analysis, fill in the following information:
Music Presence: {{musicPresence}}
Noise Level: {{noiseLevel}}
Speech Clarity: {{speechClarity}}
Overall Audio Quality: {{overallQuality}}`,
});

const analyzeAudioFlow = ai.defineFlow(
  {
    name: 'analyzeAudioFlow',
    inputSchema: AnalyzeAudioInputSchema,
    outputSchema: AnalyzeAudioOutputSchema,
  },
  async input => {
    const {output} = await analyzeAudioPrompt(input);
    return output!;
  }
);
