// Woodora mark: a log end-grain whose growth rings form a flame.

export function LogoMark({ className = "h-9 w-9", tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  const bg = tone === "dark" ? "#183D32" : "#F6F3EB";
  const ring = tone === "dark" ? "#F6F3EB" : "#183D32";
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect width="40" height="40" rx="11" fill={bg} />
      <circle cx="20" cy="21" r="13" fill="none" stroke="#B47B4D" strokeWidth="2.2" />
      <path
        d="M20 9.5c3.6 4.2 7.3 7.6 7.3 12.3a7.3 7.3 0 0 1-14.6 0c0-2.7 1.4-4.6 3-6.4.2 2 1.2 3.4 2.6 3.9-.9-3.5.2-6.6 1.7-9.8Z"
        fill="none"
        stroke={ring}
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
      <circle cx="20" cy="23.3" r="2.1" fill="#B47B4D" />
    </svg>
  );
}

export function Logo({ tone = "dark", className = "" }: { tone?: "dark" | "light"; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark tone={tone} />
      <span
        className={`font-display text-[1.6rem] leading-none tracking-tight ${tone === "dark" ? "text-forest" : "text-cream"}`}
      >
        Woodora
      </span>
    </span>
  );
}
