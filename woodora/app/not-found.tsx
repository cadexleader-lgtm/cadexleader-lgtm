import Link from "next/link";
import { Logo } from "@/components/art/Logo";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-cream px-6 text-center">
      <Logo />
      <h1 className="text-4xl text-forest">404</h1>
      <p className="text-stone">Page introuvable · Page not found</p>
      <div className="flex gap-3 text-sm font-medium">
        <Link href="/ca" className="rounded-full bg-white px-4 py-2 ring-1 ring-line">🇨🇦 Canada</Link>
        <Link href="/us" className="rounded-full bg-white px-4 py-2 ring-1 ring-line">🇺🇸 United States</Link>
        <Link href="/fr" className="rounded-full bg-white px-4 py-2 ring-1 ring-line">🇫🇷 France</Link>
      </div>
    </main>
  );
}
