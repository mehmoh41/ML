import SignLanguagePoseView from '@/components/features/sign-language-pose-view';
import { PageHeader } from '@/components/shared/page-header';
import Script from 'next/script';

export default function SignLanguagePosePage() {
  return (
    <>
      <Script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@1.3.1/dist/tf.min.js" />
      <Script src="https://cdn.jsdelivr.net/npm/@teachablemachine/pose@0.8/dist/teachablemachine-pose.min.js" />
      <div className="container mx-auto max-w-5xl px-4 py-8 md:py-12">
        <PageHeader
          title="Sign Language Recognition (Pose)"
          description="A model trained to recognize basic hand gestures using body pose. It displays a real-time translation of signs."
        />
        <SignLanguagePoseView />
      </div>
    </>
  );
}
