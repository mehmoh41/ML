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
