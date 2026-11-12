"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Copy, Mail, MessageCircle, PenLine, Phone } from "lucide-react";
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

/** Every way the customer can write to us first after a pre-order. */
export function ContactActions({
  whatsappHref,
  siteHref,
  emailHref,
  phoneHref,
  message,
  labels,
}: {
  whatsappHref: string | null;
  siteHref: string;
  emailHref: string | null;
  phoneHref: string | null;
  message: string;
  labels: { whatsapp: string; site: string; email: string; call: string; copy: string; copied: string };
}) {
  const [copied, setCopied] = useState(false);
  const secondary = "inline-flex h-11 items-center gap-2 rounded-[3px] px-4 text-sm font-semibold text-cream ring-1 ring-cream/30 transition hover:bg-cream/10";
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        {whatsappHref && (
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className={btn("wood", "lg", "uppercase tracking-wide")}>
            <MessageCircle className="h-5 w-5" /> {labels.whatsapp}
          </a>
        )}
        <Link href={siteHref} className={whatsappHref ? secondary : btn("wood", "lg")}>
          <PenLine className={whatsappHref ? "h-4 w-4" : "h-5 w-5"} /> {labels.site}
        </Link>
      </div>
      <div className="flex flex-wrap gap-3">
        {emailHref && (
          <a href={emailHref} className={secondary}>
            <Mail className="h-4 w-4" /> {labels.email}
          </a>
        )}
        {phoneHref && (
          <a href={phoneHref} className={secondary}>
            <Phone className="h-4 w-4" /> {labels.call}
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
          className={secondary}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? labels.copied : labels.copy}
        </button>
      </div>
    </div>
  );
}
