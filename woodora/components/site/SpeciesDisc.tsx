import { SPECIES, type SpeciesKey } from "@/lib/energy";

/** End-grain disc of a species: bark ring, sapwood and growth rings. */
export function SpeciesDisc({ species, className = "" }: { species: SpeciesKey; className?: string }) {
  const s = SPECIES[species];
  const birch = species === "birch";
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden>
      <defs>
        <radialGradient id={`disc-${species}`} cx="46%" cy="42%" r="62%">
          <stop offset="0%" stopColor={s.wood} />
          <stop offset="100%" stopColor={s.wood} stopOpacity="0.78" />
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="57" fill={s.bark} />
      {birch && (
        <g fill="#2f2e2b">
          <rect x="18" y="20" width="10" height="4" rx="2" transform="rotate(-38 23 22)" />
          <rect x="92" y="88" width="9" height="3.5" rx="1.7" transform="rotate(-40 96 90)" />
          <rect x="96" y="30" width="7" height="3" rx="1.5" transform="rotate(40 99 31)" />
        </g>
      )}
      <circle cx="60" cy="60" r="50" fill={`url(#disc-${species})`} />
      {[44, 37, 30, 23, 16, 9].map((r, i) => (
        <circle key={r} cx={60 + i * 0.6} cy={60 - i * 0.4} r={r} fill="none" stroke="#000" strokeOpacity={0.09 + i * 0.012} strokeWidth="1.1" />
      ))}
      <path d="M61 60 L96 34" stroke="#000" strokeOpacity="0.16" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="61.6" cy="58.6" r="2.4" fill="#000" fillOpacity="0.25" />
    </svg>
  );
}
