"use client";

import { useActionState, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Star } from "lucide-react";
import { contactAction, reviewAction, trackAction, type FormState, type TrackState } from "@/app/[site]/actions";
import { btn } from "@/components/ui";

function Status({ state }: { state: FormState }) {
  if (state.status === "idle" || !state.message) return null;
  const ok = state.status === "success";
  return (
    <p role={ok ? "status" : "alert"} className={`flex items-start gap-2 rounded-xl p-3 text-sm ${ok ? "bg-sage-100 text-pine" : "bg-[#f6e3df] text-danger"}`}>
      {ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />} {state.message}
    </p>
  );
}

const Honeypot = () => <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />;

export function ContactForm({
  site,
  labels,
  subjects,
  sendLabel,
  sendingLabel,
  optional,
}: {
  site: string;
  labels: Record<"name" | "email" | "phone" | "subject" | "order" | "message", string>;
  subjects: string[];
  sendLabel: string;
  sendingLabel: string;
  optional: string;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(contactAction, { status: "idle" });
  if (state.status === "success") return <Status state={state} />;
  return (
    <form action={action} className="grid gap-5 sm:grid-cols-2">
      <input type="hidden" name="site" value={site} />
      <Honeypot />
      <div>
        <label className="field-label" htmlFor="c-name">{labels.name}</label>
        <input id="c-name" name="name" required minLength={2} className="field" autoComplete="name" />
      </div>
      <div>
        <label className="field-label" htmlFor="c-email">{labels.email}</label>
        <input id="c-email" name="email" type="email" required className="field" autoComplete="email" />
      </div>
      <div>
        <label className="field-label" htmlFor="c-phone">{labels.phone} <span className="font-normal text-stone">({optional})</span></label>
        <input id="c-phone" name="phone" type="tel" className="field" autoComplete="tel" />
      </div>
      <div>
        <label className="field-label" htmlFor="c-subject">{labels.subject}</label>
        <select id="c-subject" name="subject" className="field" defaultValue={subjects[0]}>
          {subjects.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className="field-label" htmlFor="c-order">{labels.order} <span className="font-normal text-stone">({optional})</span></label>
        <input id="c-order" name="order" className="field uppercase" placeholder="FW-…" />
      </div>
      <div className="sm:col-span-2">
        <label className="field-label" htmlFor="c-message">{labels.message}</label>
        <textarea id="c-message" name="message" required minLength={10} rows={5} className="field" />
      </div>
      <div className="space-y-3 sm:col-span-2">
        <Status state={state} />
        <button type="submit" disabled={pending} className={btn("primary", "md")}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />} {pending ? sendingLabel : sendLabel}
        </button>
      </div>
    </form>
  );
}

export function TrackForm({
  site,
  labels,
}: {
  site: string;
  labels: { reference: string; referencePlaceholder: string; email: string; submit: string; status: string; cancelled: string };
}) {
  const [state, action, pending] = useActionState<TrackState, FormData>(trackAction, { status: "idle" });
  return (
    <div className="space-y-8">
      <form action={action} className="card grid gap-5 p-6 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <input type="hidden" name="site" value={site} />
        <div>
          <label className="field-label" htmlFor="t-ref">{labels.reference}</label>
          <input id="t-ref" name="reference" required className="field uppercase" placeholder={labels.referencePlaceholder} />
        </div>
        <div>
          <label className="field-label" htmlFor="t-email">{labels.email}</label>
          <input id="t-email" name="email" type="email" required className="field" autoComplete="email" />
        </div>
        <button type="submit" disabled={pending} className={btn("primary", "md", "h-[46px]")}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />} {labels.submit}
        </button>
      </form>
      {state.status === "error" && <Status state={state} />}
      {state.status === "success" && state.order && (
        <div className="card p-6 sm:p-8 animate-fade-up">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-mono text-xl font-semibold text-forest">{state.order.reference}</p>
            <p className="text-sm text-stone">{state.order.placedOn}</p>
          </div>
          <p className="mt-2 text-stone">
            {labels.status} : <strong className="text-charcoal">{state.order.statusLabel}</strong>
          </p>
          {state.order.cancelled ? (
            <p className="mt-6 rounded-xl bg-[#f6e3df] p-4 text-danger">{labels.cancelled}</p>
          ) : (
            <ol className="mt-8 grid gap-4 sm:grid-cols-5">
              {state.order.steps.map((s, i) => {
                const done = i <= state.order!.stepIndex;
                return (
                  <li key={s} className="flex items-center gap-3 sm:flex-col sm:items-start">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${done ? "bg-pine text-cream" : "bg-cream-200 text-stone"}`}>
                      {done ? <CheckCircle2 className="h-5 w-5" /> : i + 1}
                    </span>
                    <span className={`text-sm ${done ? "font-medium text-charcoal" : "text-stone"}`}>{s}</span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}

export function ReviewForm({
  site,
  labels,
}: {
  site: string;
  labels: Record<"reference" | "email" | "name" | "city" | "rating" | "titleField" | "body" | "submit" | "stars", string>;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(reviewAction, { status: "idle" });
  if (state.status === "success") return <Status state={state} />;
  return (
    <form action={action} className="grid gap-5 sm:grid-cols-2">
      <input type="hidden" name="site" value={site} />
      <Honeypot />
      <div>
        <label className="field-label" htmlFor="r-ref">{labels.reference}</label>
        <input id="r-ref" name="reference" required className="field uppercase" placeholder="FW-…" />
      </div>
      <div>
        <label className="field-label" htmlFor="r-email">{labels.email}</label>
        <input id="r-email" name="email" type="email" required className="field" />
      </div>
      <div>
        <label className="field-label" htmlFor="r-name">{labels.name}</label>
        <input id="r-name" name="name" required className="field" />
      </div>
      <div>
        <label className="field-label" htmlFor="r-city">{labels.city}</label>
        <input id="r-city" name="city" className="field" />
      </div>
      <fieldset className="sm:col-span-2">
        <legend className="field-label">{labels.rating}</legend>
        <StarRating label={labels.stars} />
      </fieldset>
      <div className="sm:col-span-2">
        <label className="field-label" htmlFor="r-title">{labels.titleField}</label>
        <input id="r-title" name="title" className="field" maxLength={120} />
      </div>
      <div className="sm:col-span-2">
        <label className="field-label" htmlFor="r-body">{labels.body}</label>
        <textarea id="r-body" name="body" required minLength={20} rows={5} className="field" />
      </div>
      <div className="space-y-3 sm:col-span-2">
        <Status state={state} />
        <button type="submit" disabled={pending} className={btn("primary", "md")}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />} {labels.submit}
        </button>
      </div>
    </form>
  );
}

function StarRating({ label }: { label: string }) {
  const [value, setValue] = useState(5);
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="flex gap-1" role="radiogroup" onMouseLeave={() => setHover(0)}>
      <input type="hidden" name="rating" value={value} />
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={label.replace("{n}", String(n))}
          onMouseEnter={() => setHover(n)}
          onClick={() => setValue(n)}
          className={`transition ${n <= shown ? "text-wood" : "text-cream-300"}`}
        >
          <Star className="h-8 w-8 fill-current" />
        </button>
      ))}
    </div>
  );
}
