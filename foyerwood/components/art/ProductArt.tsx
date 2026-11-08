// Art-directed product illustrations, drawn in the brand palette. They are
// used whenever a product has no photo yet, so that no card is ever empty.
// Deterministic: the same seed always produces the same drawing.

import { SPECIES, type SpeciesKey } from "@/lib/energy";
import { PackagingArt, isPackagingArt } from "./PackagingArt";

type Art =
  | "logs"
  | "kiln"
  | "logs-pallet"
  | "logs-bag"
  | "pellets-bag"
  | "pellets-pallet"
  | "briquettes"
  | "kindling"
  | "starters"
  | "meter"
  | "carrier";

const BG: Record<string, [string, string]> = {
  logs: ["#efe6d6", "#e2d3bb"],
  kiln: ["#f4e6d3", "#e9cfb0"],
  "logs-pallet": ["#ece4d4", "#ddd0b8"],
  "logs-bag": ["#eee7d9", "#dfd3bd"],
  "pellets-bag": ["#e7ece5", "#d3ddd3"],
  "pellets-pallet": ["#e6ebe3", "#d0dacf"],
  briquettes: ["#efe7da", "#e1d4c0"],
  kindling: ["#f1e9db", "#e4d6bf"],
  starters: ["#f2eadf", "#e5d8c4"],
  meter: ["#e5ebe6", "#d2ddd5"],
  carrier: ["#efe7da", "#e0d3bd"],
};

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
  const r = Math.min(255, Math.max(0, (n >> 16) + amt));
  const g = Math.min(255, Math.max(0, ((n >> 8) & 255) + amt));
  const b = Math.min(255, Math.max(0, (n & 255) + amt));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

/** One log seen from its cut end: bark, sapwood, growth rings and drying checks. */
function LogEnd({ x, y, r, bark, wood, rand, id }: { x: number; y: number; r: number; bark: string; wood: string; rand: () => number; id: string }) {
  const rings = 4 + Math.floor(rand() * 3);
  const cx = x + (rand() - 0.5) * r * 0.25;
  const cy = y + (rand() - 0.5) * r * 0.25;
  const birch = bark === SPECIES.birch.bark;
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={bark} />
      {birch && (
        <>
          <path d={`M${x - r * 0.9} ${y - r * 0.2}h${r * 0.35}`} stroke="#3b3a36" strokeWidth={r * 0.06} strokeLinecap="round" />
          <path d={`M${x + r * 0.5} ${y + r * 0.6}h${r * 0.3}`} stroke="#3b3a36" strokeWidth={r * 0.05} strokeLinecap="round" />
        </>
      )}
      <circle cx={x} cy={y} r={r * 0.86} fill={`url(#${id}-wood)`} />
      {Array.from({ length: rings }, (_, i) => (
        <ellipse
          key={i}
          cx={cx}
          cy={cy}
          rx={(r * 0.8 * (i + 1)) / (rings + 0.6)}
          ry={(r * 0.76 * (i + 1)) / (rings + 0.6)}
          fill="none"
          stroke={shade(wood, -38)}
          strokeOpacity={0.35 + rand() * 0.25}
          strokeWidth={r * 0.028}
        />
      ))}
      <path
        d={`M${cx} ${cy} L${x + r * 0.78 * Math.cos(rand() * 6.28)} ${y + r * 0.78 * Math.sin(rand() * 6.28)}`}
        stroke={shade(wood, -60)}
        strokeOpacity="0.55"
        strokeWidth={r * 0.035}
        strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r={r * 0.06} fill={shade(wood, -55)} />
    </g>
  );
}

export function LogStack({ seed, species, rows = 4, cols = 5, x0 = 70, y0 = 120, r = 34, kiln = false }: { seed: string; species: SpeciesKey; rows?: number; cols?: number; x0?: number; y0?: number; r?: number; kiln?: boolean }) {
  const rand = rng(seed);
  const bark = SPECIES[species]?.bark ?? SPECIES.mixed_hardwood.bark;
  const wood = kiln ? "#e8c79c" : SPECIES[species]?.wood ?? "#dcb486";
  const id = `a${seed.replace(/[^a-z0-9]/gi, "").slice(0, 10)}`;
  const logs: React.ReactNode[] = [];
  for (let row = rows - 1; row >= 0; row--) {
    for (let c = 0; c < cols - (row % 2 ? 1 : 0); c++) {
      const x = x0 + c * r * 2 + (row % 2 ? r : 0) + (rand() - 0.5) * 4;
      const y = y0 + row * r * 1.78 + (rand() - 0.5) * 4;
      logs.push(<LogEnd key={`${row}-${c}`} x={x} y={y} r={r * (0.9 + rand() * 0.14)} bark={bark} wood={wood} rand={rand} id={id} />);
    }
  }
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-wood`} cx="45%" cy="40%" r="70%">
          <stop offset="0%" stopColor={shade(wood, 18)} />
          <stop offset="100%" stopColor={shade(wood, -22)} />
        </radialGradient>
      </defs>
      {logs}
    </g>
  );
}

function Pellets({ seed, x, y, w, h, count = 70 }: { seed: string; x: number; y: number; w: number; h: number; count?: number }) {
  const rand = rng(seed + "p");
  return (
    <g>
      {Array.from({ length: count }, (_, i) => {
        const px = x + rand() * w;
        const py = y + h - Math.pow(rand(), 0.6) * h * (1 - Math.abs(px - (x + w / 2)) / (w / 1.6));
        const a = rand() * 180;
        return (
          <rect
            key={i}
            x={px}
            y={py}
            width={16 + rand() * 10}
            height={7}
            rx={3.5}
            fill={rand() > 0.5 ? "#c9a06e" : "#b88c5a"}
            stroke="#8f6a41"
            strokeWidth="0.8"
            transform={`rotate(${a} ${px} ${py})`}
          />
        );
      })}
    </g>
  );
}

function Bag({ x, y, w, h, label, accent = "#244E3E" }: { x: number; y: number; w: number; h: number; label: string; accent?: string }) {
  return (
    <g>
      <path
        d={`M${x + 8} ${y} h${w - 16} q8 0 8 10 v${h - 22} q0 12 -12 12 h${-(w - 24)} q-12 0 -12 -12 v${-(h - 22)} q0 -10 8 -10 z`}
        fill="#fbf8f2"
        stroke="#d7cdb9"
        strokeWidth="2"
      />
      <rect x={x + 10} y={y + 2} width={w - 20} height="10" fill="#efe8da" />
      <rect x={x + 18} y={y + h * 0.3} width={w - 36} height={h * 0.38} rx="8" fill={accent} />
      <text x={x + w / 2} y={y + h * 0.48} textAnchor="middle" fontFamily="Instrument Serif, Georgia, serif" fontSize={w * 0.13} fill="#F6F3EB">
        Foyerwood
      </text>
      <text x={x + w / 2} y={y + h * 0.6} textAnchor="middle" fontFamily="Inter, sans-serif" fontSize={w * 0.075} fill="#d9b48f" letterSpacing="1.5">
        {label}
      </text>
      <circle cx={x + w / 2} cy={y + h * 0.82} r={w * 0.06} fill="none" stroke="#B47B4D" strokeWidth="2" />
    </g>
  );
}

function Pallet({ x, y, w }: { x: number; y: number; w: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height="10" rx="2" fill="#c49a6c" />
      {[0, 0.47, 0.94].map((f) => (
        <rect key={f} x={x + f * (w - 22)} y={y + 10} width="22" height="14" fill="#a87d52" />
      ))}
      <rect x={x} y={y + 24} width={w} height="8" rx="2" fill="#b58a5c" />
    </g>
  );
}

export function ProductArt({
  art,
  species,
  seed,
  className = "",
  label,
}: {
  art: string | null | undefined;
  species?: SpeciesKey | null;
  seed: string;
  className?: string;
  label?: string;
}) {
  if (isPackagingArt(art)) {
    return <PackagingArt kind={art} species={species ?? "mixed_hardwood"} seed={seed} className={className} label={label} />;
  }
  const kind = (art && art in BG ? art : "logs") as Art;
  const [c1, c2] = BG[kind];
  const sp: SpeciesKey = species ?? "mixed_hardwood";
  const gid = `bg-${seed.replace(/[^a-z0-9]/gi, "").slice(0, 12)}-${kind}`;

  let content: React.ReactNode;
  switch (kind) {
    case "kiln":
      content = (
        <>
          {[0, 1, 2].map((i) => (
            <path
              key={i}
              d={`M${120 + i * 80} 70 q12 -14 0 -28 q-12 -14 0 -28`}
              fill="none"
              stroke="#d9893f"
              strokeOpacity="0.45"
              strokeWidth="5"
              strokeLinecap="round"
            />
          ))}
          <LogStack seed={seed} species={sp} rows={3} cols={5} x0={84} y0={150} r={33} kiln />
        </>
      );
      break;
    case "logs-pallet":
      content = (
        <>
          <rect x="62" y="64" width="276" height="190" rx="6" fill="#ffffff" opacity="0.35" />
          <LogStack seed={seed} species={sp} rows={4} cols={5} x0={92} y0={96} r={28} kiln={sp !== "oak"} />
          <Pallet x={56} y={258} w={288} />
        </>
      );
      break;
    case "logs-bag":
      content = (
        <>
          <Bag x={120} y={70} w={160} h={210} label="EXTRA-SEC" accent="#9a6339" />
          <LogStack seed={seed} species={sp} rows={1} cols={3} x0={130} y0={74} r={24} kiln />
        </>
      );
      break;
    case "pellets-bag":
      content = (
        <>
          <Bag x={118} y={56} w={164} h={220} label="PELLETS" />
          <Pellets seed={seed} x={60} y={250} w={280} h={40} count={60} />
        </>
      );
      break;
    case "pellets-pallet":
      content = (
        <>
          {[0, 1, 2].map((i) => (
            <Bag key={`b${i}`} x={70 + i * 88} y={136} w={86} h={120} label="PELLETS" />
          ))}
          {[0, 1].map((i) => (
            <Bag key={`t${i}`} x={114 + i * 88} y={44} w={86} h={112} label="PELLETS" />
          ))}
          <Pallet x={60} y={258} w={280} />
        </>
      );
      break;
    case "briquettes": {
      const rand = rng(seed);
      content = (
        <>
          {Array.from({ length: 9 }, (_, i) => {
            const row = Math.floor(i / 3);
            const x = 104 + (i % 3) * 66 + (row % 2) * 30;
            const y = 220 - row * 58;
            return (
              <g key={i}>
                <rect x={x - 30} y={y - 26} width="80" height="52" rx="10" fill="#a8774a" />
                <circle cx={x - 30} cy={y} r="26" fill="#c99a68" stroke="#8a5f38" strokeWidth="2" />
                <circle cx={x - 30} cy={y} r="7" fill="#6d4a2b" />
                <circle cx={x - 30} cy={y} r={14 + rand() * 4} fill="none" stroke="#8a5f38" strokeOpacity="0.5" strokeWidth="1.5" />
              </g>
            );
          })}
        </>
      );
      break;
    }
    case "kindling": {
      const rand = rng(seed);
      content = (
        <>
          {Array.from({ length: 26 }, (_, i) => {
            const y = 120 + i * 5.4 + (rand() - 0.5) * 6;
            return (
              <rect key={i} x={70 + rand() * 20} y={y} width={250 - rand() * 30} height="7" rx="2" fill={rand() > 0.5 ? "#dcb486" : "#e6c48f"} stroke="#b88f5f" strokeWidth="0.8" />
            );
          })}
          <rect x="150" y="112" width="12" height="154" rx="3" fill="#7c5a3a" />
          <rect x="236" y="112" width="12" height="154" rx="3" fill="#7c5a3a" />
        </>
      );
      break;
    }
    case "starters": {
      const rand = rng(seed);
      content = (
        <>
          {Array.from({ length: 7 }, (_, i) => {
            const x = 100 + (i % 4) * 66 + (i > 3 ? 33 : 0);
            const y = i > 3 ? 210 : 150;
            return (
              <g key={i}>
                {Array.from({ length: 18 }, (_, k) => (
                  <path
                    key={k}
                    d={`M${x - 26 + rand() * 6} ${y + (rand() - 0.5) * 24} q${26} ${-20 + rand() * 40} ${52} 0`}
                    fill="none"
                    stroke={rand() > 0.5 ? "#d8b17f" : "#c79c66"}
                    strokeWidth="2.4"
                  />
                ))}
              </g>
            );
          })}
          <path d="M200 70 c14 16 26 28 26 44 a26 26 0 0 1 -52 0 c0 -10 6 -18 12 -24 c1 8 5 12 10 14 c-3 -12 0 -22 4 -34z" fill="#d9893f" opacity="0.85" />
        </>
      );
      break;
    }
    case "meter":
      content = (
        <>
          <rect x="140" y="60" width="120" height="200" rx="26" fill="#244E3E" />
          <rect x="158" y="84" width="84" height="56" rx="8" fill="#e3ebe5" />
          <text x="200" y="122" textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight="600" fontSize="28" fill="#2A2828">
            16%
          </text>
          <circle cx="182" cy="176" r="12" fill="#B47B4D" />
          <circle cx="218" cy="176" r="12" fill="#2f6350" />
          <rect x="176" y="260" width="8" height="34" rx="3" fill="#9aa59e" />
          <rect x="216" y="260" width="8" height="34" rx="3" fill="#9aa59e" />
        </>
      );
      break;
    case "carrier":
      content = (
        <>
          <path d="M120 120 h160 l-14 140 h-132z" fill="#5d655f" />
          <path d="M120 120 h160 l-6 40 h-148z" fill="#4c534e" />
          <path d="M150 120 q0 -56 50 -56 q50 0 50 56" fill="none" stroke="#9a6339" strokeWidth="10" strokeLinecap="round" />
          <LogStack seed={seed} species={sp} rows={1} cols={3} x0={152} y0={112} r={22} />
        </>
      );
      break;
    default:
      content = <LogStack seed={seed} species={sp} rows={4} cols={5} x0={74} y0={92} r={30} />;
  }

  return (
    <svg viewBox="0 0 400 320" className={className} role="img" aria-label={label} preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c1} />
          <stop offset="100%" stopColor={c2} />
        </linearGradient>
      </defs>
      <rect width="400" height="320" fill={`url(#${gid})`} />
      <ellipse cx="200" cy="300" rx="170" ry="16" fill="#2A2828" opacity="0.07" />
      {content}
    </svg>
  );
}
