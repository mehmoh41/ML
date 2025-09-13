import VoiceRecognitionView from '@/components/features/voice-recognition-view';
import { PageHeader } from '@/components/shared/page-header';

export default function VoiceRecognitionPage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 md:py-12">
      <PageHeader
        title="Voice Recognition"
        description="Record your voice to detect if you are singing or just talking. You can also analyze the audio quality using our AI-powered tool."
      />
      <VoiceRecognitionView />
    </div>
  );
}
