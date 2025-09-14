import React from 'react';

export function Logo() {
  return (
    <div
      className="group flex items-center gap-2"
      aria-label="Models home"
    >
      <span className="text-lg font-semibold font-headline text-primary transition-opacity group-data-[collapsible=icon]:opacity-0">
        Models
      </span>
    </div>
  );
}
