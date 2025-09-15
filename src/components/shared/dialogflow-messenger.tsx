"use client";

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

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      const dfMessenger = document.querySelector('df-messenger');
      if (dfMessenger) {
        // Wait for the component to be ready
        dfMessenger.addEventListener('df-messenger-loaded', () => {
          const shadowRoot = dfMessenger.shadowRoot;
          if (shadowRoot) {
            // Change chat button icon
            const style = shadowRoot.querySelector('style');
            if (style) {
              style.textContent += `
                button.chat-button {
                  background-image: url('/favicon.ico');
                  background-size: cover;
                }
              `;
            }
            
            // Add logo to title
            const titleElement = shadowRoot.querySelector('.df-messenger-font-title.title-wrapper > .title');
            if (titleElement && !titleElement.querySelector('img')) {
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
      }
    }
  }, [isMounted]);

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
