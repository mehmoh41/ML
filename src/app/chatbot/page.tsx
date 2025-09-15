import { PageHeader } from '@/components/shared/page-header';
import Script from 'next/script';

export default function ChatbotPage() {
  return (
    <>
      <Script
        src="https://www.gstatic.com/dialogflow-console/fast/messenger/bootstrap.js?v=1"
        strategy="beforeInteractive"
      />
      <div className="container mx-auto max-w-5xl px-4 py-8 md:py-12">
        <PageHeader
          title="Chatbot"
          description="Interact with our AI assistant powered by Dialogflow."
        />
        <div className="fixed bottom-4 right-4 z-50">
          <df-messenger
            intent="WELCOME"
            chat-title="ml-support-agent"
            agent-id="d401ea4a-dda5-43fc-a39b-6908fb9ccc15"
            language-code="en"
          ></df-messenger>
        </div>
        <div className="flex items-center justify-center rounded-lg border border-dashed bg-card p-12 text-center text-muted-foreground shadow-sm" style={{ height: '60vh' }}>
          <p>The chatbot is active in the bottom right corner of your screen.</p>
        </div>
      </div>
    </>
  );
}

// Extend JSX to recognize the df-messenger custom element
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'df-messenger': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        intent?: string;
        'chat-title'?: string;
        'agent-id'?: string;
        'language-code'?: string;
      };
    }
  }
}
