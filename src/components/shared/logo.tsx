import { Sparkles } from 'lucide-react';
import React from 'react';

export function Logo() {
  return (
    <div
      className="group flex items-center gap-2"
      aria-label="ModelVerse home"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Sparkles className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
      </div>
      <span className="text-lg font-semibold font-headline text-primary transition-opacity group-data-[collapsible=icon]:opacity-0">
        ModelVerse
      </span>
    </div>
  );
}
