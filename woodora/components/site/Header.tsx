"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Calculator, Check, ChevronDown, Globe, Mail, Menu, MessageCircle, PackageSearch, Phone, Search, ShoppingBasket, Truck, X } from "lucide-react";
import { Logo } from "@/components/art/Logo";
import { useCart } from "@/components/cart/CartProvider";

export interface HeaderProps {
  homeHref: string;
  shopHref: string;
  calculatorHref: string;
  aboutHref: string;
  preorderHref: string;
  blogHref: string;
  contactHref: string;
  faqHref: string;
  deliveryHref: string;
  trackHref: string;
  categories: Array<{ key: string; name: string; description: string; href: string }>;
  sites: Array<{ id: string; label: string; sublabel: string; flag: string; href: string; current: boolean; sameMarket: boolean }>;
  current: { flag: string; currency: string; short: string };
  contact: { phone: string | null; email: string | null; whatsappHref: string | null; freeLabel: string };
  labels: {
    home: string;
    shop: string;
    categories: string;
    calculator: string;
    about: string;
    blog: string;
    contact: string;
    faq: string;
    delivery: string;
    track: string;
    search: string;
    searchPlaceholder: string;
    cart: string;
    cartCount: string;
    openMenu: string;
    closeMenu: string;
    allProducts: string;
    country: string;
    skip: string;
    countryNotice: string;
    whatsapp: string;
  };
}

const COOKIE = "woodora_site";

function rememberSite(id: string) {
  document.cookie = `${COOKIE}=${id}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}

export function Header(p: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { count, ready } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [siteOpen, setSiteOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [bump, setBump] = useState(false);
  const siteRef = useRef<HTMLDivElement>(null);
  const prevCount = useRef(count);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (ready && count > prevCount.current) {
      setBump(true);
      const t = setTimeout(() => setBump(false), 600);
      prevCount.current = count;
      return () => clearTimeout(t);
    }
    prevCount.current = count;
  }, [count, ready]);

  useEffect(() => {
    setMenuOpen(false);
    setSiteOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (siteRef.current && !siteRef.current.contains(e.target as Node)) setSiteOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSiteOpen(false);
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const isActive = (href: string) => (href === p.homeHref ? pathname === href : pathname?.startsWith(href));

  const chooseSite = (s: HeaderProps["sites"][number]) => {
    rememberSite(s.id);
    setSiteOpen(false);
    setMenuOpen(false);
    router.push(s.href);
  };

  const onSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get("q")?.toString().trim();
    setMenuOpen(false);
    router.push(q ? `${p.shopHref}?q=${encodeURIComponent(q)}` : p.shopHref);
  };

  const cartButton = (compact = false) => (
    <Link
      href={p.preorderHref}
      className={`relative flex h-9 items-center gap-2 rounded-full bg-wood pl-3 pr-3.5 text-sm font-semibold text-white transition hover:bg-wood-600 ${bump ? "scale-110" : ""}`}
      aria-label={p.labels.cartCount.replace("{n}", String(count))}
    >
      <ShoppingBasket className="h-4 w-4" />
      {!compact && <span className="hidden uppercase tracking-wide sm:inline">{p.labels.cart}</span>}
      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[0.7rem] font-bold text-wood-600">{ready ? count : 0}</span>
    </Link>
  );

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-full focus:bg-forest focus:px-4 focus:py-2 focus:text-cream">
        {p.labels.skip}
      </a>

      {/* Utility bar */}
      <div className="bg-forest-950 text-[0.8rem] text-cream/80">
        <div className="container-page flex h-11 items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-5">
            {p.contact.phone && (
              <a href={`tel:${p.contact.phone.replace(/\s/g, "")}`} className="hidden items-center gap-1.5 hover:text-cream md:flex">
                <Phone className="h-3.5 w-3.5 text-wood" /> {p.contact.phone}
              </a>
            )}
            {p.contact.email && (
              <a href={`mailto:${p.contact.email}`} className="hidden items-center gap-1.5 text-wood-100 hover:text-cream lg:flex">
                <Mail className="h-3.5 w-3.5 text-wood" /> {p.contact.email}
              </a>
            )}
            {p.contact.whatsappHref && (
              <a href={p.contact.whatsappHref} target="_blank" rel="noopener noreferrer" className="hidden items-center gap-1.5 hover:text-cream md:flex">
                <MessageCircle className="h-3.5 w-3.5 text-wood" /> {p.labels.whatsapp}
              </a>
            )}
            <span className="flex items-center gap-1.5 truncate font-medium uppercase tracking-wider text-cream">
              <Truck className="h-3.5 w-3.5 shrink-0 text-wood" /> {p.contact.freeLabel}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <form onSubmit={onSearch} role="search" className="hidden h-8 items-center overflow-hidden rounded-md bg-white md:flex">
              <input
                name="q"
                type="search"
                placeholder={p.labels.searchPlaceholder}
                aria-label={p.labels.search}
                className="h-full w-56 bg-transparent px-3 text-[0.8rem] text-charcoal placeholder:text-stone/60 focus:outline-none lg:w-64"
              />
              <button type="submit" aria-label={p.labels.search} className="flex h-full w-9 items-center justify-center bg-wood text-white hover:bg-wood-600">
                <Search className="h-4 w-4" />
              </button>
            </form>
            <Link href={p.trackHref} className="hidden items-center gap-1.5 px-2 font-medium uppercase tracking-wide hover:text-cream xl:flex">
              <PackageSearch className="h-3.5 w-3.5 text-wood" /> {p.labels.track}
            </Link>
            <div className="relative" ref={siteRef}>
              <button
                type="button"
                onClick={() => setSiteOpen((v) => !v)}
                aria-expanded={siteOpen}
                aria-label={p.labels.country}
                className="flex h-8 items-center gap-1.5 rounded-md px-2 font-medium hover:bg-cream/10 hover:text-cream"
              >
                <span className="text-sm leading-none">{p.current.flag}</span>
                {p.current.short} · {p.current.currency}
                <ChevronDown className="h-3 w-3" />
              </button>
              {siteOpen && <SiteMenu sites={p.sites} onChoose={chooseSite} title={p.labels.country} notice={p.labels.countryNotice} />}
            </div>
            <div className="hidden sm:block">{cartButton()}</div>
          </div>
        </div>
      </div>

      {/* Main header */}
      <header className={`sticky top-0 z-40 border-b bg-white/95 backdrop-blur-md transition-shadow duration-300 ${scrolled ? "border-line shadow-[0_8px_24px_-16px_rgb(24_61_50/0.35)]" : "border-wood/30"}`}>
        <div className={`container-page flex items-center gap-6 transition-all duration-300 ${scrolled ? "h-16" : "h-20"}`}>
          <Link href={p.homeHref} className="shrink-0" aria-label="Woodora">
            <Logo />
          </Link>

          <nav className="ml-auto hidden items-center lg:flex" aria-label="Main">
            {p.categories.map((c, i) => (
              <span key={c.key} className="flex items-center">
                {i > 0 && <span className="h-3.5 w-px bg-line" aria-hidden />}
                <Link
                  href={c.href}
                  title={c.description}
                  className={`relative px-2.5 py-2 text-[0.86rem] font-medium transition-colors xl:px-3.5 xl:text-[0.92rem] ${
                    isActive(c.href)
                      ? "text-wood-600 after:absolute after:inset-x-2.5 after:-bottom-[1px] after:h-[2px] after:bg-wood xl:after:inset-x-3.5"
                      : "text-charcoal/85 hover:text-wood-600"
                  }`}
                >
                  {c.name}
                </Link>
              </span>
            ))}
            <Link
              href={p.calculatorHref}
              className={`ml-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[0.88rem] font-semibold transition ${
                isActive(p.calculatorHref) ? "bg-wood text-white" : "bg-forest text-cream hover:bg-pine"
              }`}
            >
              <Calculator className="h-4 w-4" /> {p.labels.calculator}
            </Link>
          </nav>

          <div className="ml-auto flex items-center gap-2 lg:hidden">
            <div className="sm:hidden">{cartButton(true)}</div>
            <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full text-forest hover:bg-cream" onClick={() => setMenuOpen(true)} aria-label={p.labels.openMenu}>
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-forest-950/55 animate-fade-in" onClick={() => setMenuOpen(false)} />
          <div className="absolute inset-y-0 right-0 flex w-[88%] max-w-sm flex-col overflow-y-auto bg-cream shadow-2xl animate-fade-in">
            <div className="flex h-[72px] items-center justify-between border-b border-line px-5">
              <Logo />
              <button type="button" onClick={() => setMenuOpen(false)} aria-label={p.labels.closeMenu} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={onSearch} role="search" className="mx-5 mt-4 flex h-11 items-center overflow-hidden rounded-xl bg-white ring-1 ring-line">
              <input name="q" type="search" placeholder={p.labels.searchPlaceholder} aria-label={p.labels.search} className="h-full flex-1 bg-transparent px-3 text-sm focus:outline-none" />
              <button type="submit" aria-label={p.labels.search} className="flex h-full w-11 items-center justify-center bg-wood text-white">
                <Search className="h-4 w-4" />
              </button>
            </form>
            <div className="px-5 pt-5">
              <p className="kicker mb-3">{p.labels.categories}</p>
              <div className="grid grid-cols-2 gap-2">
                {p.categories.map((c) => (
                  <Link key={c.key} href={c.href} className="rounded-xl bg-white px-3 py-2.5 text-sm font-medium text-forest ring-1 ring-line">
                    {c.name}
                  </Link>
                ))}
              </div>
              <Link href={p.calculatorHref} className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-forest px-3 py-3 text-sm font-semibold text-cream">
                <Calculator className="h-4 w-4" /> {p.labels.calculator}
              </Link>
            </div>
            <nav className="flex flex-col px-3 py-4 text-[1.05rem]" aria-label="Mobile">
              {[
                [p.homeHref, p.labels.home],
                [p.shopHref, p.labels.allProducts],
                [p.aboutHref, p.labels.about],
                [p.blogHref, p.labels.blog],
                [p.deliveryHref, p.labels.delivery],
                [p.faqHref, p.labels.faq],
                [p.contactHref, p.labels.contact],
                [p.trackHref, p.labels.track],
              ].map(([href, label]) => (
                <Link key={href} href={href} className={`rounded-xl px-3 py-2.5 ${isActive(href) ? "bg-white text-forest" : "text-charcoal"}`}>
                  {label}
                </Link>
              ))}
            </nav>
            <div className="mt-auto border-t border-line px-6 py-5">
              <p className="kicker mb-3">{p.labels.country}</p>
              <div className="grid gap-2">
                {p.sites.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => chooseSite(s)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm ring-1 ${s.current ? "bg-white ring-pine/40" : "ring-line"}`}
                  >
                    <span className="text-lg">{s.flag}</span>
                    <span className="flex-1">
                      <span className="block font-medium text-charcoal">{s.label}</span>
                      <span className="block text-xs text-stone">{s.sublabel}</span>
                    </span>
                    {s.current && <Check className="h-4 w-4 text-pine" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SiteMenu({
  sites,
  onChoose,
  title,
  notice,
}: {
  sites: HeaderProps["sites"];
  onChoose: (s: HeaderProps["sites"][number]) => void;
  title: string;
  notice: string;
}) {
  return (
    <div className="absolute right-0 top-full z-50 mt-2 w-80 animate-fade-in rounded-2xl bg-white p-2 text-charcoal shadow-[var(--shadow-lift)] ring-1 ring-line">
      <p className="flex items-center gap-2 px-3 pb-2 pt-2 text-xs font-semibold uppercase tracking-wider text-stone">
        <Globe className="h-3.5 w-3.5" /> {title}
      </p>
      {sites.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => onChoose(s)}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-cream ${s.current ? "bg-cream" : ""}`}
        >
          <span className="text-xl leading-none">{s.flag}</span>
          <span className="flex-1">
            <span className="block text-sm font-medium text-charcoal">{s.label}</span>
            <span className="block text-xs text-stone">{s.sublabel}</span>
          </span>
          {s.current && <Check className="h-4 w-4 text-pine" />}
        </button>
      ))}
      <p className="px-3 pb-2 pt-2 text-xs leading-snug text-stone">{notice}</p>
    </div>
  );
}
