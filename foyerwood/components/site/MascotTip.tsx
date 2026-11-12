import Link from "next/link";
import { ArrowRight } from "lucide-react";

/** Foyo with a short tip in a speech bubble. */
export function MascotTip({ text, href, cta, className = "" }: { text: string; href?: string; cta?: string; className?: string }) {
  return (
    <div className={`flex items-center gap-3 sm:gap-5 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/illustrations/foyo.svg" alt="" className="h-20 w-auto shrink-0 sm:h-24" />
      <div className="relative rounded-2xl bg-white px-4 py-3 ring-1 ring-line sm:px-5">
        <span aria-hidden className="absolute -left-[7px] top-1/2 h-3.5 w-3.5 -translate-y-1/2 rotate-45 border-b border-l border-line bg-white" />
        <p className="relative text-[0.92rem] leading-snug text-charcoal">{text}</p>
        {href && cta && (
          <Link href={href} className="relative mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-wood-600 underline decoration-wood/30 underline-offset-4 hover:decoration-wood-600">
            {cta} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
}
