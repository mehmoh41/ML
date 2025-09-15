import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { MainSidebar } from '@/components/layout/main-sidebar';
import { SiteHeader } from '@/components/layout/site-header';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'ML Model Showcase',
  description: 'Showcase of Machine Learning Models',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        <style>{`
          df-messenger {
            --df-messenger-chat-icon: url('/favicon.ico');
          }
        `}</style>
      </head>
      <body className="font-body antialiased">
        <Script
          src="https://www.gstatic.com/dialogflow-console/fast/messenger/bootstrap.js?v=1"
          strategy="beforeInteractive"
        />
        <SidebarProvider>
          <MainSidebar />
          <SidebarInset>
            <SiteHeader />
            <main>{children}</main>
          </SidebarInset>
        </SidebarProvider>
        <df-messenger
          intent="WELCOME"
          chat-title="MM"
          agent-id="d401ea4a-dda5-43fc-a39b-6908fb9ccc15"
          language-code="en"
        ></df-messenger>
        <Toaster />
      </body>
    </html>
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
