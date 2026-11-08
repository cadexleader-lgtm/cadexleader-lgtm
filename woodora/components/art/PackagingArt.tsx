// Illustrations by species × packaging (bulk, pallet, Big Bag, net bag, bag,
// box). Colours come from the species (bark and wood), so each of the 36
// combinations has its own visual until a real photo is added.

import { SPECIES, type SpeciesKey } from "@/lib/energy";

export const PACKAGING_ARTS = ["bulk", "pallet", "big-bag", "net-bag", "bag", "box"] as const;
export type PackagingArtKind = (typeof PACKAGING_ARTS)[number];

export function isPackagingArt(v: unknown): v is PackagingArtKind {
  return typeof v === "string" && (PACKAGING_ARTS as readonly string[]).includes(v);
}

function rng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.min(255, Math.max(0, v + amt));
  return `#${((c(n >> 16) << 16) | (c((n >> 8) & 255) << 8) | c(n & 255)).toString(16).padStart(6, "0")}`;
}

interface Colors {
  bark: string;
  wood: string;
  birch: boolean;
}

/** Split log seen from its end: a wedge with bark on the outer arc. */
function Wedge({ cx, cy, r, a0, span, c, rand }: { cx: number; cy: number; r: number; a0: number; span: number; c: Colors; rand: () => number }) {
  const rad = (d: number) => (d * Math.PI) / 180;
  const p = (a: number, rr: number) => [cx + rr * Math.cos(rad(a)), cy + rr * Math.sin(rad(a))];
  const [x1, y1] = p(a0, r);
  const [x2, y2] = p(a0 + span, r);
  const large = span > 180 ? 1 : 0;
  const tone = shade(c.wood, Math.round((rand() - 0.5) * 26));
  const rings = [0.45, 0.68, 0.86].map((f) => {
    const [ax, ay] = p(a0 + 4, r * f);
    const [bx, by] = p(a0 + span - 4, r * f);
    return `M${ax} ${ay} A${r * f} ${r * f} 0 ${large} 1 ${bx} ${by}`;
  });
  return (
    <g>
      <path d={`M${cx} ${cy} L${x1} ${y1} A${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`} fill={tone} stroke={shade(c.wood, -45)} strokeWidth={0.8} />
      {rings.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={shade(c.wood, -38)} strokeOpacity={0.35} strokeWidth={0.8} />
      ))}
      <path d={`M${x1} ${y1} A${r} ${r} 0 ${large} 1 ${x2} ${y2}`} fill="none" stroke={c.bark} strokeWidth={r * 0.16} strokeLinecap="round" />
      {c.birch && <path d={`M${p(a0 + span * 0.4, r)[0]} ${p(a0 + span * 0.4, r)[1]} l1 1`} stroke="#2f2e2b" strokeWidth={r * 0.18} />}
    </g>
  );
}

/** Split log seen from the side, used for loose piles and bags. */
function SideLog({ x, y, len, w, angle, c, rand }: { x: number; y: number; len: number; w: number; angle: number; c: Colors; rand: () => number }) {
  const tone = shade(c.wood, Math.round((rand() - 0.5) * 24));
  return (
    <g transform={`rotate(${angle} ${x} ${y})`}>
      <rect x={x - len / 2} y={y - w / 2} width={len} height={w} rx={2} fill={tone} stroke={shade(c.wood, -50)} strokeWidth={0.8} />
      <rect x={x - len / 2} y={y - w / 2} width={len} height={w * 0.34} rx={2} fill={c.bark} />
      {c.birch && (
        <>
          <rect x={x - len / 4} y={y - w / 2 + 1} width={len * 0.06} height={w * 0.2} fill="#2f2e2b" />
          <rect x={x + len / 8} y={y - w / 2 + 1} width={len * 0.04} height={w * 0.18} fill="#2f2e2b" />
        </>
      )}
      <path d={`M${x - len / 2 + 6} ${y + w * 0.1} H${x + len / 2 - 8}`} stroke={shade(c.wood, -30)} strokeOpacity={0.4} strokeWidth={0.8} />
      <rect x={x + len / 2 - 4} y={y - w / 2} width={4} height={w} rx={1.5} fill={shade(c.wood, 22)} />
    </g>
  );
}

function Pile({ seed, c, cx, base, width, height, count }: { seed: string; c: Colors; cx: number; base: number; width: number; height: number; count: number }) {
  const rand = rng(seed + "pile");
  const layers = 7;
  const logs: Array<{ x: number; y: number; len: number; w: number; angle: number }> = [];
  for (let l = 0; l < layers; l++) {
    const f = 1 - l / layers;
    const layerWidth = width * Math.sqrt(f);
    const n = Math.max(2, Math.round((count / layers) * (0.6 + f * 0.8)));
    for (let i = 0; i < n; i++) {
      logs.push({
        x: cx + (i / (n - 1 || 1) - 0.5) * layerWidth + (rand() - 0.5) * 18,
        y: base - (l / layers) * height + (rand() - 0.5) * 8,
        len: 44 + rand() * 26,
        w: 13 + rand() * 6,
        angle: (rand() - 0.5) * 70 + (rand() > 0.7 ? 90 : 0) * (rand() > 0.5 ? 1 : -1) * 0.3,
      });
    }
  }
  return (
    <g>
      {logs.map((l, i) => (
        <SideLog key={i} {...l} c={c} rand={rand} />
      ))}
    </g>
  );
}

function WedgeGrid({ seed, c, x, y, w, h, r }: { seed: string; c: Colors; x: number; y: number; w: number; h: number; r: number }) {
  const rand = rng(seed + "grid");
  const items: React.ReactNode[] = [];
  const step = r * 1.15;
  let k = 0;
  for (let yy = y + r * 0.6; yy < y + h + r * 0.2; yy += step * 0.82) {
    for (let xx = x + (k % 2 ? step / 2 : 0); xx < x + w + r * 0.2; xx += step) {
      items.push(
        <Wedge key={`${xx}-${yy}`} cx={xx + (rand() - 0.5) * 5} cy={yy + (rand() - 0.5) * 5} r={r * (0.85 + rand() * 0.3)} a0={rand() * 360} span={70 + rand() * 60} c={c} rand={rand} />,
      );
    }
    k++;
  }
  return (
    <g>
      <defs>
        <clipPath id={`clip-${seed.replace(/[^a-z0-9]/gi, "")}`}>
          <rect x={x} y={y} width={w} height={h} />
        </clipPath>
      </defs>
      <rect x={x} y={y} width={w} height={h} fill={shade(c.wood, -70)} />
      <g clipPath={`url(#clip-${seed.replace(/[^a-z0-9]/gi, "")})`}>{items}</g>
    </g>
  );
}

const BG: Record<PackagingArtKind, [string, string]> = {
  bulk: ["#e9eee6", "#d4dccf"],
  pallet: ["#efe7d8", "#dfd2bb"],
  "big-bag": ["#e6ece8", "#cfd9d2"],
  "net-bag": ["#f2eadd", "#e4d6bf"],
  bag: ["#efe9de", "#e0d5c2"],
  box: ["#ece6dc", "#ddd2c0"],
};

export function PackagingArt({ kind, species, seed, className = "", label }: { kind: PackagingArtKind; species: SpeciesKey; seed: string; className?: string; label?: string }) {
  const sp = SPECIES[species] ?? SPECIES.mixed_hardwood;
  const c: Colors = { bark: sp.bark, wood: sp.wood, birch: species === "birch" };
  const id = `pk-${seed.replace(/[^a-z0-9]/gi, "").slice(0, 14)}-${kind}`;
  const [b1, b2] = BG[kind];
  let content: React.ReactNode = null;

  if (kind === "bulk") {
    content = (
      <>
        <ellipse cx="200" cy="292" rx="175" ry="18" fill="#2A2828" opacity="0.12" />
        <Pile seed={seed} c={c} cx={200} base={285} width={310} height={190} count={58} />
      </>
    );
  } else if (kind === "pallet") {
    const wood = "#d7b98c";
    content = (
      <>
        <ellipse cx="200" cy="300" rx="150" ry="12" fill="#2A2828" opacity="0.12" />
        <WedgeGrid seed={seed} c={c} x={92} y={48} w={216} h={218} r={21} />
        {[48, 120, 192, 258].map((yy) => (
          <rect key={yy} x="84" y={yy - 6} width="232" height="13" rx="2" fill={wood} stroke="#b08e5f" strokeWidth="1" />
        ))}
        <rect x="80" y="40" width="14" height="236" rx="2" fill={shade(wood, -8)} stroke="#b08e5f" />
        <rect x="306" y="40" width="14" height="236" rx="2" fill={shade(wood, -8)} stroke="#b08e5f" />
        <path d="M94 260 L306 60" stroke="#b08e5f" strokeWidth="1" opacity="0" />
        <rect x="74" y="276" width="252" height="10" rx="2" fill="#c49a6c" />
        {[0, 0.47, 0.94].map((f) => (
          <rect key={f} x={74 + f * 230} y="286" width="22" height="14" fill="#a87d52" />
        ))}
      </>
    );
  } else if (kind === "big-bag") {
    content = (
      <>
        <ellipse cx="200" cy="300" rx="160" ry="12" fill="#2A2828" opacity="0.12" />
        <Pile seed={seed} c={c} cx={200} base={128} width={230} height={70} count={30} />
        <path d="M78 118 Q72 200 84 286 L316 286 Q328 200 322 118 Z" fill="#f6f5f1" stroke="#cfcac0" strokeWidth="2" />
        {Array.from({ length: 22 }, (_, i) => (
          <path key={i} d={`M${86 + i * 10.6} 122 L${88 + i * 10.6} 284`} stroke="#e4e1da" strokeWidth="1" />
        ))}
        {Array.from({ length: 16 }, (_, i) => (
          <path key={`h${i}`} d={`M82 ${130 + i * 10} L318 ${130 + i * 10}`} stroke="#ebe8e1" strokeWidth="1" />
        ))}
        <path d="M100 118 L100 286 M300 118 L300 286" stroke="#5b86b8" strokeWidth="3" strokeDasharray="6 4" />
        {[86, 300].map((x) => (
          <path key={x} d={`M${x} 120 q7 -36 14 0`} fill="none" stroke="#f6f5f1" strokeWidth="7" strokeLinecap="round" />
        ))}
        <rect x="160" y="190" width="80" height="34" rx="4" fill="#2A2828" />
        <text x="200" y="212" textAnchor="middle" fontFamily="DM Serif Display, Georgia, serif" fontSize="15" fill="#F6F3EB">Woodora</text>
      </>
    );
  } else if (kind === "net-bag") {
    content = (
      <>
        <ellipse cx="200" cy="296" rx="110" ry="12" fill="#2A2828" opacity="0.12" />
        <clipPath id={`${id}-net`}>
          <path d="M128 90 Q110 180 122 286 L278 286 Q290 180 272 90 Q200 70 128 90 Z" />
        </clipPath>
        <g clipPath={`url(#${id}-net)`}>
          <WedgeGrid seed={seed} c={c} x={110} y={78} w={180} h={210} r={22} />
          {Array.from({ length: 26 }, (_, i) => (
            <path key={i} d={`M${60 + i * 12} 60 L${-40 + i * 12} 300`} stroke="#d0532f" strokeWidth="2" opacity="0.9" />
          ))}
          {Array.from({ length: 26 }, (_, i) => (
            <path key={`b${i}`} d={`M${-40 + i * 12} 60 L${60 + i * 12} 300`} stroke="#d0532f" strokeWidth="2" opacity="0.9" />
          ))}
        </g>
        <path d="M128 90 Q110 180 122 286 L278 286 Q290 180 272 90" fill="none" stroke="#b6472a" strokeWidth="2.5" />
        <path d="M150 86 Q200 40 250 86" fill="none" stroke="#d0532f" strokeWidth="5" />
        <rect x="186" y="60" width="28" height="14" rx="3" fill="#b6472a" />
        <rect x="236" y="196" width="58" height="40" rx="4" fill="#F6F3EB" stroke="#d7cdb9" transform="rotate(8 265 216)" />
        <text x="265" y="220" textAnchor="middle" fontFamily="DM Serif Display, Georgia, serif" fontSize="11" fill="#2A2828" transform="rotate(8 265 216)">Woodora</text>
      </>
    );
  } else if (kind === "bag") {
    content = (
      <>
        <ellipse cx="200" cy="298" rx="120" ry="12" fill="#2A2828" opacity="0.12" />
        <Pile seed={seed} c={c} cx={200} base={112} width={150} height={60} count={18} />
        <path d="M118 100 L112 284 Q112 292 122 292 L278 292 Q288 292 288 284 L282 100 Z" fill="#c9a87c" stroke="#a88658" strokeWidth="2" />
        <path d="M118 100 L282 100 L280 116 L120 116 Z" fill="#b9966a" />
        {Array.from({ length: 9 }, (_, i) => (
          <path key={i} d={`M${130 + i * 17} 120 L${128 + i * 17} 286`} stroke="#b9966a" strokeWidth="1" opacity="0.6" />
        ))}
        <rect x="140" y="160" width="120" height="78" rx="6" fill="#2A2828" />
        <text x="200" y="196" textAnchor="middle" fontFamily="DM Serif Display, Georgia, serif" fontSize="20" fill="#F6F3EB">Woodora</text>
        <text x="200" y="218" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="9" letterSpacing="2" fill="#d9b48f">{(SPECIES[species]?.names.en ?? "").toUpperCase()}</text>
      </>
    );
  } else if (kind === "box") {
    content = (
      <>
        <ellipse cx="200" cy="298" rx="140" ry="12" fill="#2A2828" opacity="0.12" />
        <path d="M96 120 L200 92 L304 120 L200 148 Z" fill={shade(c.wood, -80)} />
        <g clipPath={`url(#${id}-top)`}>
          <clipPath id={`${id}-top`}>
            <path d="M100 120 L200 94 L300 120 L200 146 Z" />
          </clipPath>
          <WedgeGrid seed={seed} c={c} x={100} y={92} w={200} h={56} r={14} />
        </g>
        <path d="M96 120 L200 148 L200 292 L96 264 Z" fill="#c79f6e" stroke="#a7804f" strokeWidth="1.5" />
        <path d="M304 120 L200 148 L200 292 L304 264 Z" fill="#b48b5b" stroke="#a7804f" strokeWidth="1.5" />
        <path d="M96 120 L70 92 L176 66 L200 92 Z" fill="#d3ad7c" stroke="#a7804f" strokeWidth="1.5" />
        <path d="M304 120 L330 92 L224 66 L200 92 Z" fill="#c29b69" stroke="#a7804f" strokeWidth="1.5" />
        <path d="M112 170 L184 190 L184 236 L112 216 Z" fill="#2A2828" />
        <text x="148" y="208" textAnchor="middle" fontFamily="DM Serif Display, Georgia, serif" fontSize="13" fill="#F6F3EB" transform="skewY(15) translate(0 -40)">Woodora</text>
      </>
    );
  }

  return (
    <svg viewBox="0 0 400 320" className={className} role="img" aria-label={label} preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={b1} />
          <stop offset="100%" stopColor={b2} />
        </linearGradient>
      </defs>
      <rect width="400" height="320" fill={`url(#${id}-bg)`} />
      {content}
    </svg>
  );
}
