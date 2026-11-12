import Image from "next/image";

/** Full-bleed real photo behind a dark page header, darkened for legible text. */
export function HeroBackdrop({ src, position = "50% 50%", priority = true }: { src: string; position?: string; priority?: boolean }) {
  return (
    <>
      <Image src={src} alt="" fill priority={priority} sizes="100vw" className="object-cover" style={{ objectPosition: position }} />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgb(22_21_21/0.9)_0%,rgb(22_21_21/0.72)_50%,rgb(22_21_21/0.4)_100%)]" aria-hidden />
      <div className="absolute inset-0 bg-gradient-to-t from-forest-950/50 to-transparent" aria-hidden />
    </>
  );
}
