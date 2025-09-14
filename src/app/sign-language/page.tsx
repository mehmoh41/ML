import SignLanguageView from '@/components/features/sign-language-view';
import { PageHeader } from '@/components/shared/page-header';
import Script from 'next/script';

export default function SignLanguagePage() {
  return (
    <>
      <Script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest/dist/tf.min.js" />
      <Script src="https://cdn.jsdelivr.net/npm/@teachablemachine/image@latest/dist/teachablemachine-image.min.js" />
      <div className="container mx-auto max-w-5xl px-4 py-8 md:py-12">
        <PageHeader
          title="Sign Language Recognition"
          description="A model trained to recognize basic hand gestures. It displays a real-time translation of signs."
        />
        <SignLanguageView />
      </div>
    </>
  );
}
