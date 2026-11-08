"use client";

import { useEffect, useState } from "react";
import { Check, Copy, MessageCircle } from "lucide-react";
import { useCart } from "./CartProvider";
import { btn } from "@/components/ui";

/** Empties the pre-order once it has been registered. */
export function ClearCartOnMount({ reference }: { reference: string }) {
  const { clear, ready } = useCart();
  useEffect(() => {
    if (!ready) return;
    const key = `foyerwood-cleared-${reference}`;
    if (sessionStorage.getItem(key)) return;
    clear();
    sessionStorage.setItem(key, "1");
  }, [ready, reference, clear]);
  return null;
}

export function WhatsAppActions({ href, message, labels }: { href: string | null; message: string; labels: { cta: string; copy: string; copied: string } }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex flex-wrap gap-3">
      {href && (
        <a href={href} target="_blank" rel="noopener noreferrer" className={btn("wood", "lg", "uppercase tracking-wide")}>
          <MessageCircle className="h-5 w-5" /> {labels.cta}
        </a>
      )}
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(message);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
          } catch {
            /* clipboard unavailable */
          }
        }}
        className={btn(href ? "outline-light" : "light", "lg")}
      >
        {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />} {copied ? labels.copied : labels.copy}
      </button>
    </div>
  );
}
