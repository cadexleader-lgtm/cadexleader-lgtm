import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { HeroBackdrop } from "@/components/site/HeroBackdrop";
import { AMBIANCE } from "@/lib/illustrations";

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
  index,
}: {
  kicker?: string;
  title: React.ReactNode;
  subtitle?: string;
  align?: "left" | "center";
  action?: ReactNode;
  tone?: "dark" | "light";
  index?: string;
}) {
  const muted = tone === "dark" ? "text-stone" : "text-cream/60";
  if (align === "center") {
    return (
      <div className="mx-auto mb-12 max-w-2xl text-center">
        {kicker && <p className={`mb-4 text-[0.72rem] font-semibold uppercase tracking-[0.18em] ${muted}`}>{kicker}</p>}
        <h2 className={`text-[2.4rem] leading-[1.02] sm:text-[3.2rem] ${tone === "dark" ? "text-forest" : "text-cream"}`}>{title}</h2>
        {subtitle && <p className={`mt-4 text-[1.02rem] leading-relaxed ${muted}`}>{subtitle}</p>}
      </div>
    );
  }
  return (
    <div className={`mb-10 grid gap-6 border-t pt-6 md:grid-cols-12 ${tone === "dark" ? "border-forest/15" : "border-cream/15"}`}>
      <div className="md:col-span-7">
        {(kicker || index) && (
          <p className={`mb-3 flex items-center gap-3 text-[0.72rem] font-semibold uppercase tracking-[0.18em] ${muted}`}>
            {index && <span className="tabular-nums text-wood">{index}</span>}
            {kicker}
          </p>
        )}
        <h2 className={`text-[2.3rem] leading-[1.02] sm:text-[3rem] ${tone === "dark" ? "text-forest" : "text-cream"}`}>{title}</h2>
      </div>
      <div className="flex flex-col justify-end gap-4 md:col-span-5 md:items-end md:text-right">
        {subtitle && <p className={`max-w-md text-[0.98rem] leading-relaxed ${muted}`}>{subtitle}</p>}
        {action}
      </div>
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
    <span className={`inline-flex items-center gap-1.5 rounded-[2px] px-2 py-0.5 text-[0.7rem] font-semibold uppercase tracking-[0.06em] ${TONES[tone]} ${className}`}>{children}</span>
  );
}

export function Breadcrumbs({ items, tone = "dark" }: { items: Array<{ label: string; href?: string }>; tone?: "dark" | "light" }) {
  const light = tone === "light";
  return (
    <nav aria-label="Breadcrumb" className={`text-sm ${light ? "text-cream/60" : "text-stone"}`}>
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {i > 0 && <span aria-hidden className={light ? "text-cream/35" : "text-stone/50"}>/</span>}
            {it.href ? (
              <Link href={it.href} className={light ? "hover:text-cream" : "hover:text-forest"}>
                {it.label}
              </Link>
            ) : (
              <span aria-current="page" className={light ? "text-cream" : "text-charcoal"}>{it.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function PageHero({
  kicker,
  title,
  intro,
  image = AMBIANCE.livingRoom,
  imagePosition,
  breadcrumbs,
  children,
}: {
  kicker?: string;
  title: string;
  intro?: string;
  /** Real photo behind the header: a page header is never left empty. */
  image?: string;
  imagePosition?: string;
  breadcrumbs?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-forest-950 text-cream">
      <HeroBackdrop src={image} position={imagePosition} />
      <div className="container-page relative py-16 sm:py-24">
        {breadcrumbs && <div className="mb-6">{breadcrumbs}</div>}
        {kicker && <p className="mb-5 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-cream/55">{kicker}</p>}
        <h1 className="max-w-4xl text-[2.8rem] leading-[1] sm:text-[4.2rem]">{title}</h1>
        {intro && <p className="mt-5 max-w-2xl text-lg leading-relaxed text-cream/75">{intro}</p>}
        {children}
      </div>
    </section>
  );
}
