import Link from "next/link";
import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { STATUS_LABELS, STATUS_TONE, type OrderStatus } from "@/lib/order-status";
import { Badge } from "@/components/ui";

export function Flash({ ok, error }: { ok?: string; error?: string }) {
  if (!ok && !error) return null;
  return (
    <p
      role={error ? "alert" : "status"}
      className={`mb-6 flex items-start gap-2 rounded-xl px-4 py-3 text-sm ${error ? "bg-[#f6e3df] text-danger" : "bg-sage-100 text-pine"}`}
    >
      {error ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
      {error ?? ok}
    </p>
  );
}

export function PageTitle({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-3xl text-forest sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1.5 text-stone">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, children, actions, id, className = "" }: { title?: string; children: ReactNode; actions?: ReactNode; id?: string; className?: string }) {
  return (
    <section id={id} className={`card scroll-mt-6 overflow-hidden ${className}`}>
      {title && (
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <h2 className="font-sans text-[0.95rem] font-semibold text-forest">{title}</h2>
          {actions}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={STATUS_TONE[status]}>{STATUS_LABELS[status].fr}</Badge>;
}

export function Field({ label, name, hint, className = "", ...props }: { label: string; name: string; hint?: string; className?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={className}>
      <label className="field-label" htmlFor={`f-${name}`}>{label}</label>
      <input id={`f-${name}`} name={name} className="field" {...props} />
      {hint && <p className="mt-1 text-xs text-stone">{hint}</p>}
    </div>
  );
}

export function TextArea({ label, name, hint, className = "", ...props }: { label: string; name: string; hint?: string; className?: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className={className}>
      <label className="field-label" htmlFor={`f-${name}`}>{label}</label>
      <textarea id={`f-${name}`} name={name} className="field" rows={3} {...props} />
      {hint && <p className="mt-1 text-xs text-stone">{hint}</p>}
    </div>
  );
}

export function Select({
  label,
  name,
  options,
  hint,
  className = "",
  ...props
}: { label: string; name: string; options: Array<{ value: string; label: string }>; hint?: string; className?: string } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={className}>
      <label className="field-label" htmlFor={`f-${name}`}>{label}</label>
      <select id={`f-${name}`} name={name} className="field" {...props}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {hint && <p className="mt-1 text-xs text-stone">{hint}</p>}
    </div>
  );
}

export function Check({ label, name, defaultChecked, hint }: { label: string; name: string; defaultChecked?: boolean; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 text-sm">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-0.5 h-4 w-4 accent-pine" />
      <span>
        <span className="font-medium text-charcoal">{label}</span>
        {hint && <span className="block text-xs text-stone">{hint}</span>}
      </span>
    </label>
  );
}

export function SubmitButton({ children, variant = "primary" }: { children: ReactNode; variant?: "primary" | "danger" | "secondary" }) {
  const cls =
    variant === "danger"
      ? "bg-danger text-white hover:bg-danger/90"
      : variant === "secondary"
        ? "bg-white text-forest ring-1 ring-line hover:bg-cream"
        : "bg-pine text-cream hover:bg-forest";
  return <button type="submit" className={`inline-flex h-10 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium transition ${cls}`}>{children}</button>;
}

export function TabLinks({ items, current }: { items: Array<{ href: string; label: string; key: string }>; current: string }) {
  return (
    <div className="mb-6 flex flex-wrap gap-1.5">
      {items.map((i) => (
        <Link
          key={i.key}
          href={i.href}
          className={`rounded-full px-3.5 py-1.5 text-sm font-medium ring-1 transition ${i.key === current ? "bg-forest text-cream ring-forest" : "bg-white text-charcoal ring-line hover:ring-pine/40"}`}
        >
          {i.label}
        </Link>
      ))}
    </div>
  );
}

export const MARKET_TABS = (base: string, extra = "") => [
  { key: "", href: `${base}${extra ? `?${extra}` : ""}`, label: "Tous les marchés" },
  { key: "ca", href: `${base}?m=ca${extra ? `&${extra}` : ""}`, label: "🇨🇦 Canada" },
  { key: "us", href: `${base}?m=us${extra ? `&${extra}` : ""}`, label: "🇺🇸 États-Unis" },
  { key: "fr", href: `${base}?m=fr${extra ? `&${extra}` : ""}`, label: "🇫🇷 France" },
];

export type SearchProps = { searchParams: Promise<Record<string, string | undefined>> };
