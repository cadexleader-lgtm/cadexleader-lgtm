"use client";

import { useState, useTransition } from "react";
import { AlertCircle, CheckCircle2, Loader2, MapPin } from "lucide-react";
import { checkDeliveryAction, type DeliveryCheckResult } from "@/app/[site]/actions";
import { btn } from "@/components/ui";

export function DeliveryChecker({ siteId, labels, placeholder }: { siteId: string; labels: { postal: string; check: string }; placeholder: string }) {
  const [postal, setPostal] = useState("");
  const [result, setResult] = useState<DeliveryCheckResult | null>(null);
  const [pending, start] = useTransition();
  return (
    <div>
      <form
        className="flex flex-col gap-3 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => setResult(await checkDeliveryAction(siteId, postal)));
        }}
      >
        <div className="relative flex-1">
          <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone" />
          <input value={postal} onChange={(e) => setPostal(e.target.value)} required aria-label={labels.postal} placeholder={placeholder} className="field pl-10 uppercase" />
        </div>
        <button type="submit" disabled={pending} className={btn("primary", "md")}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />} {labels.check}
        </button>
      </form>
      {result && (
        <div className={`mt-4 rounded-xl p-4 text-sm animate-fade-in ${result.ok ? "bg-sage-100 text-pine" : "bg-[#f6e3df] text-danger"}`} role="status">
          <p className="flex items-center gap-2 font-medium">
            {result.ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />} {result.message}
          </p>
          {result.details.map((d) => (
            <p key={d} className="mt-1 opacity-90">{d}</p>
          ))}
        </div>
      )}
    </div>
  );
}
