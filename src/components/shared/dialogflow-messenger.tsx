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
        // Event listener for when a rich content button or card is clicked
        const handleCardClicked = (event: any) => {
          // Check for a URL in the event payload, which we use for navigation
          const url = event.detail.card.actionLink;

          if (url) {
            router.push(url);
          } else if (event.detail.card.buttons?.[0]?.postback) {
             try {
                const postbackData = JSON.parse(event.detail.card.buttons[0].postback);
                if (postbackData.action === 'navigate' && postbackData.url) {
                    router.push(postbackData.url);
                }
             } catch(e) {
                // Not a JSON postback, ignore
             }
          }
        };
        
        dfMessenger.addEventListener('df-card-clicked', handleCardClicked);

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
          dfMessenger.removeEventListener('df-card-clicked', handleCardClicked);
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
