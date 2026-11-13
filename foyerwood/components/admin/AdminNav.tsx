"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BookOpen, Camera, ClipboardList, Gift, LayoutDashboard, LogOut, Mail, Map, Menu, Package, Settings, Star, Truck, Users, X, ExternalLink,
} from "lucide-react";
import { LogoMark } from "@/components/art/Logo";
import { logoutAction } from "@/app/admin/actions";

const NAV = [
  { href: "/admin", label: "Tableau de bord", Icon: LayoutDashboard },
  { href: "/admin/orders", label: "Précommandes", Icon: ClipboardList, badge: "orders" },
  { href: "/admin/products", label: "Produits & stocks", Icon: Package },
  { href: "/admin/photos", label: "Photos du catalogue", Icon: Camera },
  { href: "/admin/promotions", label: "Promotions & cadeaux", Icon: Gift },
  { href: "/admin/suppliers", label: "Fournisseurs", Icon: Truck },
  { href: "/admin/zones", label: "Zones de livraison", Icon: Map },
  { href: "/admin/reviews", label: "Avis clients", Icon: Star, badge: "reviews" },
  { href: "/admin/blog", label: "Articles", Icon: BookOpen },
  { href: "/admin/messages", label: "Messages", Icon: Mail, badge: "messages" },
  { href: "/admin/newsletter", label: "Newsletter", Icon: Users },
  { href: "/admin/settings", label: "Réglages", Icon: Settings },
];

export function AdminNav({ user, badges, demo }: { user: { name: string; email: string }; badges: Record<string, number>; demo: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const active = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));
  const nav = (
    <nav className="flex flex-1 flex-col gap-0.5 px-3 py-4">
      {NAV.map(({ href, label, Icon, badge }) => (
        <Link
          key={href}
          href={href}
          onClick={() => setOpen(false)}
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${active(href) ? "bg-cream/10 font-medium text-cream" : "text-cream/65 hover:bg-cream/5 hover:text-cream"}`}
        >
          <Icon className="h-[18px] w-[18px]" />
          <span className="flex-1">{label}</span>
          {badge && badges[badge] > 0 && <span className="rounded-full bg-wood px-2 py-0.5 text-[0.7rem] font-semibold text-ink">{badges[badge]}</span>}
        </Link>
      ))}
      <Link href="/" target="_blank" className="mt-4 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-cream/65 hover:text-cream">
        <ExternalLink className="h-[18px] w-[18px]" /> Voir le site
      </Link>
    </nav>
  );
  const footer = (
    <div className="border-t border-cream/10 p-4">
      {demo && <p className="mb-3 rounded-lg bg-wood/20 px-3 py-2 text-xs text-wood-100">Base de démonstration locale (PGlite)</p>}
      <p className="truncate text-sm font-medium text-cream">{user.name}</p>
      <p className="truncate text-xs text-cream/55">{user.email}</p>
      <form action={logoutAction}>
        <button type="submit" className="mt-3 flex items-center gap-2 text-xs text-cream/65 hover:text-cream">
          <LogOut className="h-3.5 w-3.5" /> Se déconnecter
        </button>
      </form>
    </div>
  );
  return (
    <>
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col bg-forest text-cream lg:flex">
        <Link href="/admin" className="flex items-center gap-2.5 px-6 py-5">
          <LogoMark tone="light" />
          <span className="font-display text-xl">Foyerwood</span>
          <span className="rounded bg-cream/10 px-1.5 py-0.5 text-[0.65rem] uppercase tracking-wider text-cream/70">Admin</span>
        </Link>
        {nav}
        {footer}
      </aside>
      <div className="sticky top-0 z-30 flex items-center justify-between bg-forest px-4 py-3 text-cream lg:hidden">
        <Link href="/admin" className="flex items-center gap-2">
          <LogoMark tone="light" className="h-8 w-8" />
          <span className="font-display text-lg">Foyerwood Admin</span>
        </Link>
        <button type="button" onClick={() => setOpen(true)} aria-label="Menu" className="rounded-lg p-2 hover:bg-cream/10">
          <Menu className="h-5 w-5" />
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col overflow-y-auto bg-forest text-cream">
            <div className="flex items-center justify-between px-5 py-4">
              <span className="font-display text-xl">Foyerwood</span>
              <button type="button" onClick={() => setOpen(false)} aria-label="Fermer" className="rounded-lg p-2 hover:bg-cream/10">
                <X className="h-5 w-5" />
              </button>
            </div>
            {nav}
            {footer}
          </div>
        </div>
      )}
    </>
  );
}
