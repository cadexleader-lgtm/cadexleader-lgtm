"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Check, Copy, Mail, MessageCircle, Printer, Send } from "lucide-react";

export function ProformaToolbar({
  backHref,
  publicUrl,
  whatsappHref,
  mailtoHref,
  markSent,
  status,
  warnings,
}: {
  backHref: string;
  publicUrl: string;
  whatsappHref: string | null;
  mailtoHref: string;
  /** Server action marking the pro forma as sent. */
  markSent: () => Promise<void>;
  status: string;
  warnings: string[];
}) {
  const [copied, setCopied] = useState(false);
  const btn = "inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium transition";
  return (
    <div className="no-print sticky top-0 z-10 border-b border-line bg-white/95 backdrop-blur print:hidden">
      <div className="mx-auto flex max-w-[210mm] flex-wrap items-center gap-2 px-4 py-3">
        <Link href={backHref} className={`${btn} text-forest hover:bg-cream`}>
          <ArrowLeft className="h-4 w-4" /> Commande
        </Link>
        <span className="flex-1" />
        <button type="button" onClick={() => window.print()} className={`${btn} bg-forest text-cream hover:bg-pine`}>
          <Printer className="h-4 w-4" /> PDF / Imprimer
        </button>
        {whatsappHref && (
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className={`${btn} bg-[#25D366] text-white hover:brightness-95`}>
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </a>
        )}
        <a href={mailtoHref} className={`${btn} bg-wood text-ink hover:bg-ember`}>
          <Mail className="h-4 w-4" /> E-mail
        </a>
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(publicUrl);
              setCopied(true);
              setTimeout(() => setCopied(false), 2500);
            } catch {
              /* clipboard unavailable */
            }
          }}
          className={`${btn} ring-1 ring-line hover:bg-cream`}
        >
          {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />} {copied ? "Lien copié" : "Copier le lien client"}
        </button>
        {status === "draft" ? (
          <form action={markSent}>
            <button type="submit" className={`${btn} ring-1 ring-forest text-forest hover:bg-forest hover:text-cream`}>
              <Send className="h-4 w-4" /> Marquer comme envoyée
            </button>
          </form>
        ) : (
          <span className="inline-flex h-10 items-center gap-1.5 rounded-full bg-sage-100 px-4 text-sm font-medium text-pine">
            <Check className="h-4 w-4" /> {status === "sent" ? "Envoyée" : status === "accepted" ? "Acceptée" : status === "expired" ? "Expirée" : "Annulée"}
          </span>
        )}
      </div>
      {warnings.length > 0 && (
        <div className="mx-auto max-w-[210mm] px-4 pb-3">
          <div className="rounded-lg bg-wood-100 px-4 py-2 text-xs leading-relaxed text-wood-600">
            <strong>À compléter dans Réglages pour une pro forma complète : </strong>
            {warnings.join(" · ")}{" "}
            <Link href="/admin/settings" className="font-semibold underline">Ouvrir les réglages</Link>
          </div>
        </div>
      )}
    </div>
  );
}
