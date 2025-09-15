import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { MainSidebar } from '@/components/layout/main-sidebar';
import { SiteHeader } from '@/components/layout/site-header';
import Script from 'next/script';
import DialogflowMessenger from '@/components/shared/dialogflow-messenger';

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
          strategy="lazyOnload"
        />
        <SidebarProvider>
          <MainSidebar />
          <SidebarInset>
            <SiteHeader />
            <main>{children}</main>
          </SidebarInset>
        </SidebarProvider>
        <DialogflowMessenger />
        <Toaster />
      </body>
    </html>
  );
}
