import EmotionDetectionImageView from '@/components/features/emotion-detection-image-view';
import { PageHeader } from '@/components/shared/page-header';
import Script from 'next/script';

export default function EmotionDetectionImagePage() {
  return (
    <>
      <Script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest/dist/tf.min.js" />
      <Script src="https://cdn.jsdelivr.net/npm/@teachablemachine/image@latest/dist/teachablemachine-image.min.js" />
      <div className="container mx-auto max-w-5xl px-4 py-8 md:py-12">
        <PageHeader
          title="Emotion Detection (Image)"
          description="A more accurate model trained to recognize emotions using image analysis. It displays a real-time detection of your facial expression."
        />
        <EmotionDetectionImageView />
      </div>
    </>
  );
}
