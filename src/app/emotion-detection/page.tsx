import EmotionDetectionView from '@/components/features/emotion-detection-view';
import { PageHeader } from '@/components/shared/page-header';

export default function EmotionDetectionPage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 md:py-12">
      <PageHeader
        title="Emotion Detection"
        description="Use your webcam to detect emotions in real-time. You can also 'train' the model by capturing samples of your expressions to improve its (simulated) accuracy."
      />
      <EmotionDetectionView />
    </div>
  );
}
