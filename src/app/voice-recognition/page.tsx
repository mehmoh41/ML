import VoiceRecognitionView from '@/components/features/voice-recognition-view';
import { PageHeader } from '@/components/shared/page-header';
import Script from 'next/script';

export default function VoiceRecognitionPage() {
  return (
    <>
      <Script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@1.3.1/dist/tf.min.js" />
      <Script src="https://cdn.jsdelivr.net/npm/@tensorflow-models/speech-commands@0.4.0/dist/speech-commands.min.js" />
      <div className="container mx-auto max-w-5xl px-4 py-8 md:py-12">
        <PageHeader
          title="Voice Recognition"
          description="Use your microphone to detect if you are singing or just talking. The model will analyze the audio in real-time."
        />
        <VoiceRecognitionView />
      </div>
    </>
  );
}
