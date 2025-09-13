import SignLanguageView from '@/components/features/sign-language-view';
import { PageHeader } from '@/components/shared/page-header';

export default function SignLanguagePage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 md:py-12">
      <PageHeader
        title="Sign Language Recognition"
        description="A model trained to recognize basic hand gestures. It displays a real-time (simulated) translation of signs like 'A', 'B', 'C', 'Hello', and 'Thank You'."
      />
      <SignLanguageView />
    </div>
  );
}
