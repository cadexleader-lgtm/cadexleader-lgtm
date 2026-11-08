"use client";

import { useActionState } from "react";
import { subscribeAction, type FormState } from "@/app/[site]/actions";

export function NewsletterForm({
  site,
  labels,
  tone = "dark",
}: {
  site: string;
  labels: { placeholder: string; subscribe: string; consent: string };
  tone?: "dark" | "light";
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(subscribeAction, { status: "idle" });
  if (state.status === "success") {
    return <p className={`rounded-xl px-4 py-3 text-sm ${tone === "dark" ? "bg-cream/10 text-cream" : "bg-sage-100 text-pine"}`}>{state.message}</p>;
  }
  return (
    <form action={action} className="w-full">
      <input type="hidden" name="site" value={site} />
      <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <div className={`flex gap-2 rounded-full p-1.5 ${tone === "dark" ? "bg-cream/10 ring-1 ring-cream/15" : "bg-white ring-1 ring-line"}`}>
        <input
          type="email"
          name="email"
          required
          placeholder={labels.placeholder}
          aria-label={labels.placeholder}
          className={`min-w-0 flex-1 bg-transparent px-3.5 text-[0.95rem] focus:outline-none ${tone === "dark" ? "text-cream placeholder:text-cream/50" : "text-charcoal placeholder:text-stone/60"}`}
        />
        <button type="submit" disabled={pending} className="shrink-0 rounded-full bg-wood px-4 py-2 text-sm font-medium text-ink transition hover:bg-wood-600 disabled:opacity-60">
          {labels.subscribe}
        </button>
      </div>
      {state.status === "error" && <p className="mt-2 text-sm text-[#f0b9a8]">{state.message}</p>}
      <p className={`mt-2 text-xs ${tone === "dark" ? "text-cream/50" : "text-stone"}`}>{labels.consent}</p>
    </form>
  );
}
