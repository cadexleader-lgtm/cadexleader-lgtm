"use client";

import { Printer } from "lucide-react";

export function PrintButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex h-10 items-center gap-2 rounded-full bg-forest px-5 text-sm font-medium text-cream transition hover:bg-pine"
    >
      <Printer className="h-4 w-4" /> {label}
    </button>
  );
}
