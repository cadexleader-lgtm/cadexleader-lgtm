"use client";

import { useActionState, useEffect, useState } from "react";
import { Check, Loader2, MessageCircle } from "lucide-react";
import { useCart } from "./CartProvider";
import { saveWhatsappAction, type FormState } from "@/app/[site]/actions";

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

/** Optional: the customer leaves (or changes) a WhatsApp number we may use to reach them. */
export function WhatsappOptIn({
  site,
  reference,
  token,
  current,
  placeholder,
  labels,
}: {
  site: string;
  reference: string;
  token: string;
  current: string | null;
  placeholder: string;
  labels: { title: string; text: string; onFile: string; change: string; save: string; field: string };
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveWhatsappAction, { status: "idle" });
  const [editing, setEditing] = useState(!current);
  useEffect(() => {
    if (state.status === "success") setEditing(false);
  }, [state]);

  return (
    <div className="rounded-2xl bg-cream/[0.06] p-5 ring-1 ring-cream/15">
      <p className="flex items-center gap-2 font-semibold text-cream">
        <MessageCircle className="h-4 w-4 text-wood" /> {labels.title}
      </p>
      {!editing && current ? (
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-cream/80">
          <Check className="h-4 w-4 text-wood" />
          {labels.onFile.replace("{phone}", current)}
          <button type="button" onClick={() => setEditing(true)} className="font-semibold text-cream underline underline-offset-4">
            {labels.change}
          </button>
        </p>
      ) : (
        <>
          <p className="mt-1.5 text-sm text-cream/70">{labels.text}</p>
          <form action={action} className="mt-3 flex flex-wrap gap-2">
            <input type="hidden" name="site" value={site} />
            <input type="hidden" name="reference" value={reference} />
            <input type="hidden" name="token" value={token} />
            <label htmlFor="wa-number" className="sr-only">{labels.field}</label>
            <input
              id="wa-number"
              name="whatsapp"
              type="tel"
              inputMode="tel"
              required
              defaultValue={current ?? ""}
              placeholder={placeholder}
              aria-invalid={state.status === "error"}
              aria-describedby={state.message ? "wa-status" : undefined}
              className="h-11 min-w-0 flex-1 basis-56 rounded-[3px] bg-cream px-3 text-[0.95rem] text-ink placeholder:text-stone focus:outline-none focus-visible:ring-2 focus-visible:ring-wood"
            />
            <button
              type="submit"
              disabled={pending}
              className="inline-flex h-11 items-center gap-2 rounded-[3px] px-4 text-sm font-semibold text-cream ring-1 ring-cream/30 transition hover:bg-cream/10 disabled:opacity-60"
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />} {labels.save}
            </button>
          </form>
        </>
      )}
      {state.message && (
        <p id="wa-status" role="status" className={`mt-2 text-sm ${state.status === "error" ? "text-ember" : "text-cream/80"}`}>
          {state.message}
        </p>
      )}
    </div>
  );
}
