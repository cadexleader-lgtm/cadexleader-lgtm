"use client";

import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

export interface ChoiceOption {
  siteId: string;
  href: string;
  label: string;
}

export function MarketChoice({
  flag,
  country,
  currency,
  detail,
  options,
  suggested,
  suggestedLabel,
}: {
  flag: string;
  country: string;
  currency: string;
  detail: string;
  options: ChoiceOption[];
  suggested: boolean;
  suggestedLabel: string;
}) {
  const router = useRouter();
  const go = (o: ChoiceOption) => {
    document.cookie = `woodora_site=${o.siteId}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    router.push(o.href);
  };
  return (
    <div
      className={`relative flex flex-col rounded-3xl p-6 backdrop-blur transition ${
        suggested ? "bg-cream text-charcoal shadow-2xl ring-2 ring-wood" : "bg-cream/[0.07] text-cream ring-1 ring-cream/15 hover:bg-cream/[0.11]"
      }`}
    >
      {suggested && (
        <span className="absolute -top-3 left-6 rounded-full bg-wood px-3 py-1 text-xs font-semibold uppercase tracking-wider text-ink">
          {suggestedLabel}
        </span>
      )}
      <span className="text-4xl leading-none">{flag}</span>
      <p className={`mt-4 font-display text-3xl ${suggested ? "text-forest" : "text-cream"}`}>{country}</p>
      <p className={`mt-1 text-sm ${suggested ? "text-stone" : "text-cream/65"}`}>
        {currency} · {detail}
      </p>
      <div className="mt-6 grid gap-2">
        {options.map((o) => (
          <button
            key={o.siteId}
            type="button"
            onClick={() => go(o)}
            className={`flex h-11 items-center justify-between rounded-full px-5 text-sm font-medium transition ${
              suggested ? "bg-pine text-cream hover:bg-forest" : "bg-cream text-forest hover:bg-white"
            }`}
          >
            {o.label}
            <ArrowRight className="h-4 w-4" />
          </button>
        ))}
      </div>
    </div>
  );
}
