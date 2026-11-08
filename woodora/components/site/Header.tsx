"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, Search, ShoppingBasket, X, Check, Globe } from "lucide-react";
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
  const [catOpen, setCatOpen] = useState(false);
  const [siteOpen, setSiteOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const catRef = useRef<HTMLDivElement>(null);
  const siteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setCatOpen(false);
    setSiteOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (catRef.current && !catRef.current.contains(e.target as Node)) setCatOpen(false);
      if (siteRef.current && !siteRef.current.contains(e.target as Node)) setSiteOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setCatOpen(false);
        setSiteOpen(false);
        setSearchOpen(false);
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
  const navLink = (href: string, label: string) => (
    <Link
      href={href}
      className={`relative rounded-full px-3.5 py-2 text-[0.94rem] font-medium transition hover:text-forest ${
        isActive(href) ? "text-forest after:absolute after:inset-x-3.5 after:-bottom-0.5 after:h-[2px] after:rounded after:bg-wood" : "text-charcoal/80"
      }`}
    >
      {label}
    </Link>
  );

  const chooseSite = (s: HeaderProps["sites"][number]) => {
    rememberSite(s.id);
    setSiteOpen(false);
    setMenuOpen(false);
    router.push(s.href);
  };

  const onSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get("q")?.toString().trim();
    router.push(q ? `${p.shopHref}?q=${encodeURIComponent(q)}` : p.shopHref);
  };

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-full focus:bg-forest focus:px-4 focus:py-2 focus:text-cream">
        {p.labels.skip}
      </a>
      <header
        className={`sticky top-0 z-40 border-b transition-colors duration-300 ${
          scrolled ? "border-line bg-cream/92 backdrop-blur-md" : "border-transparent bg-cream"
        }`}
      >
        <div className="container-page flex h-[72px] items-center gap-4">
          <Link href={p.homeHref} className="shrink-0" aria-label="Woodora">
            <Logo />
          </Link>

          <nav className="ml-6 hidden flex-1 items-center justify-center gap-0.5 lg:flex" aria-label="Main">
            {navLink(p.homeHref, p.labels.home)}
            {navLink(p.shopHref, p.labels.shop)}
            <div className="relative" ref={catRef}>
              <button
                type="button"
                onClick={() => setCatOpen((v) => !v)}
                aria-expanded={catOpen}
                className="flex items-center gap-1 rounded-full px-3.5 py-2 text-[0.94rem] font-medium text-charcoal/80 transition hover:text-forest"
              >
                {p.labels.categories}
                <ChevronDown className={`h-4 w-4 transition ${catOpen ? "rotate-180" : ""}`} />
              </button>
              {catOpen && (
                <div className="absolute left-1/2 top-full z-50 mt-3 w-[620px] -translate-x-1/2 animate-fade-in rounded-2xl bg-white p-3 shadow-[var(--shadow-lift)] ring-1 ring-line">
                  <div className="grid grid-cols-2 gap-1">
                    {p.categories.map((c) => (
                      <Link key={c.key} href={c.href} className="group rounded-xl p-3.5 transition hover:bg-cream">
                        <span className="block font-display text-lg text-forest group-hover:text-pine">{c.name}</span>
                        <span className="mt-0.5 block text-[0.84rem] leading-snug text-stone">{c.description}</span>
                      </Link>
                    ))}
                  </div>
                  <Link href={p.shopHref} className="mt-1 flex items-center justify-between rounded-xl bg-forest px-4 py-3 text-sm font-medium text-cream hover:bg-pine">
                    {p.labels.allProducts}
                    <span aria-hidden>→</span>
                  </Link>
                </div>
              )}
            </div>
            {navLink(p.calculatorHref, p.labels.calculator)}
            {navLink(p.aboutHref, p.labels.about)}
          </nav>

          <div className="ml-auto flex items-center gap-1.5 lg:ml-0">
            <div className="relative hidden sm:block" ref={siteRef}>
              <button
                type="button"
                onClick={() => setSiteOpen((v) => !v)}
                aria-expanded={siteOpen}
                aria-label={p.labels.country}
                className="flex h-10 items-center gap-2 rounded-full px-3 text-sm font-medium text-charcoal ring-1 ring-line transition hover:bg-white"
              >
                <span className="text-base leading-none">{p.current.flag}</span>
                <span>{p.current.short}</span>
                <span className="text-stone">· {p.current.currency}</span>
                <ChevronDown className="h-3.5 w-3.5 text-stone" />
              </button>
              {siteOpen && <SiteMenu sites={p.sites} onChoose={chooseSite} title={p.labels.country} notice={p.labels.countryNotice} />}
            </div>
            <button
              type="button"
              onClick={() => setSearchOpen((v) => !v)}
              aria-label={p.labels.search}
              aria-expanded={searchOpen}
              className="flex h-10 w-10 items-center justify-center rounded-full text-charcoal transition hover:bg-white hover:text-forest"
            >
              <Search className="h-[19px] w-[19px]" />
            </button>
            <Link
              href={p.preorderHref}
              className="relative flex h-10 items-center gap-2 rounded-full bg-forest pl-3 pr-3.5 text-sm font-medium text-cream transition hover:bg-pine"
              aria-label={p.labels.cartCount.replace("{n}", String(count))}
            >
              <ShoppingBasket className="h-[18px] w-[18px]" />
              <span className="hidden md:inline">{p.labels.cart}</span>
              <span
                className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[0.7rem] font-semibold transition ${
                  ready && count > 0 ? "bg-wood text-white" : "bg-cream/15 text-cream/80"
                }`}
              >
                {ready ? count : 0}
              </span>
            </Link>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full text-forest hover:bg-white lg:hidden"
              onClick={() => setMenuOpen(true)}
              aria-label={p.labels.openMenu}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>

        {searchOpen && (
          <div className="border-t border-line bg-cream/95 backdrop-blur animate-fade-in">
            <form onSubmit={onSearch} className="container-page flex items-center gap-3 py-3" role="search">
              <Search className="h-5 w-5 text-stone" aria-hidden />
              <input
                ref={searchRef}
                name="q"
                type="search"
                placeholder={p.labels.searchPlaceholder}
                aria-label={p.labels.search}
                className="h-11 flex-1 bg-transparent text-lg text-charcoal placeholder:text-stone/60 focus:outline-none"
              />
              <button type="submit" className="rounded-full bg-pine px-4 py-2 text-sm font-medium text-cream hover:bg-forest">
                {p.labels.search}
              </button>
            </form>
          </div>
        )}
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-forest-950/50 animate-fade-in" onClick={() => setMenuOpen(false)} />
          <div className="absolute inset-y-0 right-0 flex w-[88%] max-w-sm flex-col overflow-y-auto bg-cream shadow-2xl animate-fade-in">
            <div className="flex h-[72px] items-center justify-between border-b border-line px-5">
              <Logo />
              <button type="button" onClick={() => setMenuOpen(false)} aria-label={p.labels.closeMenu} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-col px-3 py-4 text-lg" aria-label="Mobile">
              {[
                [p.homeHref, p.labels.home],
                [p.shopHref, p.labels.shop],
                [p.calculatorHref, p.labels.calculator],
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
            <div className="border-t border-line px-6 py-4">
              <p className="kicker mb-3">{p.labels.categories}</p>
              <div className="grid grid-cols-2 gap-2">
                {p.categories.map((c) => (
                  <Link key={c.key} href={c.href} className="rounded-xl bg-white px-3 py-2.5 text-sm font-medium text-forest ring-1 ring-line">
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>
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
    <div className="absolute right-0 top-full z-50 mt-3 w-80 animate-fade-in rounded-2xl bg-white p-2 shadow-[var(--shadow-lift)] ring-1 ring-line">
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
