// Floating embers (pure CSS, deterministic positions).
export function Embers({ count = 26, className = "" }: { count?: number; className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      {Array.from({ length: count }, (_, i) => {
        const left = (i * 37) % 100;
        const size = 2 + ((i * 7) % 4);
        const dur = 7 + ((i * 13) % 9);
        const delay = -((i * 17) % 14);
        const drift = ((i * 29) % 60) - 30;
        return (
          <span
            key={i}
            className="ember"
            style={
              {
                left: `${left}%`,
                width: size,
                height: size,
                animationDuration: `${dur}s`,
                animationDelay: `${delay}s`,
                "--drift": `${drift}px`,
              } as React.CSSProperties
            }
          />
        );
      })}
    </div>
  );
}
