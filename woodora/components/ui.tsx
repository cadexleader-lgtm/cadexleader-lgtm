import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "light" | "wood" | "outline-light";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-pine text-cream hover:bg-forest shadow-[0_1px_0_rgb(255_255_255/0.08)_inset,0_6px_16px_-8px_rgb(22_21_21/0.6)]",
  secondary: "bg-white text-forest ring-1 ring-line hover:ring-pine/40 hover:bg-cream",
  ghost: "text-forest hover:bg-forest/5",
  light: "bg-cream text-forest hover:bg-white",
  wood: "bg-wood text-ink hover:bg-wood-600 shadow-[0_6px_16px_-8px_rgb(192_112_10/0.7)]",
  "outline-light": "text-cream ring-1 ring-cream/35 hover:bg-cream/10 hover:ring-cream/60",
};
const SIZES: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm gap-1.5",
  md: "h-11 px-5 text-[0.95rem] gap-2",
  lg: "h-13 px-7 text-base gap-2.5",
};

export function btn(variant: Variant = "primary", size: Size = "md", extra = "") {
  return `inline-flex items-center justify-center rounded-full font-medium transition duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${extra}`;
}

export function ButtonLink({
  variant,
  size,
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={btn(variant, size, className)} {...props} />;
}

export function SectionHeading({
  kicker,
  title,
  subtitle,
  align = "left",
  action,
  tone = "dark",
}: {
  kicker?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  action?: ReactNode;
  tone?: "dark" | "light";
}) {
  return (
    <div className={`mb-8 flex flex-col gap-4 sm:mb-10 ${align === "center" ? "items-center text-center" : "md:flex-row md:items-end md:justify-between"}`}>
      <div className={align === "center" ? "max-w-2xl" : "max-w-2xl"}>
        {kicker && <p className="kicker mb-3">{kicker}</p>}
        <h2 className={`text-3xl leading-[1.1] sm:text-[2.6rem] ${tone === "dark" ? "text-forest" : "text-cream"}`}>{title}</h2>
        {subtitle && <p className={`mt-3 text-[1.02rem] leading-relaxed ${tone === "dark" ? "text-stone" : "text-cream/75"}`}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

const TONES = {
  neutral: "bg-cream-200 text-charcoal",
  info: "bg-sage-100 text-pine",
  success: "bg-[#e3efe6] text-success",
  warning: "bg-wood-100 text-wood-600",
  danger: "bg-[#f6e3df] text-danger",
} as const;

export function Badge({ tone = "neutral", children, className = "" }: { tone?: keyof typeof TONES; children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${TONES[tone]} ${className}`}>{children}</span>
  );
}

export function Breadcrumbs({ items }: { items: Array<{ label: string; href?: string }> }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-stone">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {i > 0 && <span aria-hidden className="text-stone/50">/</span>}
            {it.href ? (
              <Link href={it.href} className="hover:text-forest">
                {it.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-charcoal">{it.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function PageHero({ kicker, title, intro, children }: { kicker?: string; title: string; intro?: string; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden bg-forest text-cream">
      <div className="grain absolute inset-0" aria-hidden />
      <div className="container-page relative py-14 sm:py-20">
        {kicker && <p className="kicker mb-4 text-wood-100/90">{kicker}</p>}
        <h1 className="max-w-3xl text-4xl leading-[1.08] sm:text-5xl">{title}</h1>
        {intro && <p className="mt-5 max-w-2xl text-lg leading-relaxed text-cream/75">{intro}</p>}
        {children}
      </div>
    </section>
  );
}
