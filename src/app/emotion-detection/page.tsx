import EmotionDetectionView from '@/components/features/emotion-detection-view';
import { PageHeader } from '@/components/shared/page-header';
import Script from 'next/script';

export default function EmotionDetectionPage() {
  return (
    <>
      <Script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@1.3.1/dist/tf.min.js" />
      <Script src="https://cdn.jsdelivr.net/npm/@teachablemachine/pose@0.8/dist/teachablemachine-pose.min.js" />
      <div className="container mx-auto max-w-5xl px-4 py-8 md:py-12">
        <PageHeader
          title="Emotion Detection"
          description="Use your webcam to detect emotions in real-time. You can also 'train' the model by capturing samples of your expressions to improve its (simulated) accuracy."
        />
        <EmotionDetectionView />
      </div>
    </>
  );
}
