import SignLanguageImageView from '@/components/features/sign-language-image-view';
import { PageHeader } from '@/components/shared/page-header';
import Script from 'next/script';

export default function SignLanguageImagePage() {
  return (
    <>
      <Script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest/dist/tf.min.js" />
      <Script src="https://cdn.jsdelivr.net/npm/@teachablemachine/image@latest/dist/teachablemachine-image.min.js" />
      <div className="container mx-auto max-w-5xl px-4 py-8 md:py-12">
        <PageHeader
          title="Sign Language Recognition (Image)"
          description="A more accurate model trained to recognize hand gestures using image analysis. It displays a real-time translation of signs."
        />
        <SignLanguageImageView />
      </div>
    </>
  );
}
