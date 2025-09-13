"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";

const titles: { [key: string]: string } = {
  "/emotion-detection": "Emotion Detection",
  "/sign-language": "Sign Language",
  "/voice-recognition": "Voice Recognition",
};

export function SiteHeader() {
  const pathname = usePathname();
  const title = titles[pathname] ?? "MM Models";

  return (
    <header className="sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <h1 className="font-headline text-xl font-semibold">{title}</h1>
        </div>
        
        <div className="md:hidden">
          <SidebarTrigger />
        </div>
        
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          {/* Add header actions here, e.g. user menu */}
        </div>
      </div>
    </header>
  );
}
