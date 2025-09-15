"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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

export default function DialogflowMessenger() {
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      const dfMessenger = document.querySelector('df-messenger');
      if (dfMessenger) {
        // Event listener for when a response is received from Dialogflow
        const handleResponseReceived = (event: any) => {
          const richContent = event.detail.response.queryResult.fulfillmentMessages.find(
            (msg: any) => msg.payload && msg.payload.richContent
          );

          if (richContent) {
            const infoCard = richContent.payload.richContent[0].find(
              (item: any) => item.type === 'info' && item.event?.name === 'navigate'
            );

            if (infoCard && infoCard.event.parameters?.url) {
              const url = infoCard.event.parameters.url;
              router.push(url);
            }
          }
        };

        dfMessenger.addEventListener('df-response-received', handleResponseReceived);

        // Wait for the component to be ready for styling
        dfMessenger.addEventListener('df-messenger-loaded', () => {
          const shadowRoot = dfMessenger.shadowRoot;
          if (shadowRoot) {
            const style = shadowRoot.querySelector('style');
            if (style) {
              // Change chat button icon
              style.textContent += `
                button.chat-button {
                  background-image: url('/favicon.ico');
                  background-size: cover;
                }
              `;
            }
            
            const titleElement = shadowRoot.querySelector('.df-messenger-font-title.title-wrapper > .title');
            if (titleElement && !titleElement.querySelector('img')) {
              // Add logo to title
              const img = document.createElement('img');
              img.src = '/favicon.ico';
              img.style.width = '24px';
              img.style.height = '24px';
              img.style.marginRight = '8px';
              img.style.verticalAlign = 'middle';
              titleElement.prepend(img);
            }
          }
        });
        
        // Cleanup function to remove event listener
        return () => {
          dfMessenger.removeEventListener('df-response-received', handleResponseReceived);
        };
      }
    }
  }, [isMounted, router]);

  if (!isMounted) {
    return null;
  }

  return (
    <df-messenger
      intent="WELCOME"
      chat-title="MM"
      agent-id="d401ea4a-dda5-43fc-a39b-6908fb9ccc15"
      language-code="en"
    ></df-messenger>
  );
}
