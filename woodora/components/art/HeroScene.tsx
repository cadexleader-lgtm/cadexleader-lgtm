// Immersive hero illustration: night forest, warm glow and a woodpile.
import { LogStack } from "./ProductArt";

function pine(x: number, base: number, h: number) {
  const w = h * 0.42;
  const tiers = 4;
  let d = "";
  for (let i = 0; i < tiers; i++) {
    const top = base - h + (i * h) / (tiers + 0.6);
    const bottom = top + h * 0.42;
    const half = (w * (0.5 + i * 0.22)) / 2;
    d += `M${x} ${top} L${x + half} ${bottom} L${x - half} ${bottom} Z `;
  }
  d += `M${x - h * 0.025} ${base - h * 0.08} h${h * 0.05} v${h * 0.08} h${-h * 0.05} Z`;
  return d;
}

export function HeroScene({ className = "" }: { className?: string }) {
  const back = [40, 130, 210, 300, 380, 470, 560, 640, 720, 820, 910, 1000, 1090, 1170].map((x, i) => pine(x, 560, 260 + ((i * 37) % 90)));
  const mid = [0, 110, 240, 360, 520, 680, 1040, 1150].map((x, i) => pine(x, 620, 330 + ((i * 53) % 120)));
  const embers = Array.from({ length: 22 }, (_, i) => ({
    x: 760 + ((i * 97) % 300),
    y: 180 + ((i * 61) % 300),
    r: 1.2 + ((i * 7) % 3) * 0.7,
    o: 0.25 + ((i * 13) % 5) * 0.1,
  }));
  return (
    <svg viewBox="0 0 1200 700" className={className} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="hero-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0e241d" />
          <stop offset="60%" stopColor="#183d32" />
          <stop offset="100%" stopColor="#1d4739" />
        </linearGradient>
        <radialGradient id="hero-glow" cx="78%" cy="62%" r="45%">
          <stop offset="0%" stopColor="#d9893f" stopOpacity="0.55" />
          <stop offset="45%" stopColor="#b47b4d" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#b47b4d" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1200" height="700" fill="url(#hero-sky)" />
      <circle cx="210" cy="140" r="46" fill="#f6f3eb" opacity="0.08" />
      <circle cx="210" cy="140" r="30" fill="#f6f3eb" opacity="0.12" />
      <path d={back.join(" ")} fill="#8fa898" opacity="0.09" />
      <rect width="1200" height="700" fill="url(#hero-glow)" />
      <path d={mid.join(" ")} fill="#0e241d" opacity="0.75" />
      <path d="M0 610 Q 300 585 600 605 T 1200 600 V700 H0Z" fill="#0e241d" />
      <g transform="translate(700 330)">
        <rect x="-10" y="-20" width="470" height="300" rx="10" fill="#0e241d" opacity="0.35" />
        <LogStack seed="hero-woodpile" species="oak" rows={5} cols={7} x0={30} y0={20} r={32} />
      </g>
      {embers.map((e, i) => (
        <circle key={i} cx={e.x} cy={e.y} r={e.r} fill="#ffb066" opacity={e.o} />
      ))}
    </svg>
  );
}

export function CategoryBanner({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 1200 260" className={className} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="1200" height="260" fill="#183d32" />
      <path d={[60, 180, 300, 430, 980, 1100, 1190].map((x, i) => pine(x, 260, 150 + ((i * 41) % 70))).join(" ")} fill="#8fa898" opacity="0.1" />
      <circle cx="1000" cy="200" r="220" fill="#b47b4d" opacity="0.12" />
    </svg>
  );
}
