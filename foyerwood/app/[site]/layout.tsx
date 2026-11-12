import type { Metadata } from "next";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { listPublishedArticles } from "@/lib/data/blog";
import { CartProvider } from "@/components/cart/CartProvider";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { FloatingCart } from "@/components/cart/FloatingCart";
import { listProducts, toPublicProduct } from "@/lib/data/products";
import { loadSite, type SiteParams } from "@/lib/site-context";
import { SITES, SITE_IDS, blogPath, categoryPath, productPath, routePath, siblingSites } from "@/lib/sites";
import { MARKETS } from "@/lib/markets";
import { getDict } from "@/lib/i18n";
import { loc, money } from "@/lib/format";
import { whatsappLink } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: SiteParams): Promise<Metadata> {
  const { site: siteId } = await params;
  const ctx = await loadSite(siteId);
  return {
    title: { default: ctx.t.meta.title, template: "%s · Foyerwood" },
    description: ctx.t.meta.description,
    openGraph: { siteName: "Foyerwood", locale: ctx.site.locale.replace("-", "_"), type: "website" },
  };
}

export default async function SiteLayout({ children, params }: SiteParams & { children: React.ReactNode }) {
  const { site: siteId } = await params;
  const ctx = await loadSite(siteId);
  const { site, t, categories } = ctx;
  const market = MARKETS[site.market];
  const siblings = siblingSites(site).map((s) => s.id);

  const sites = SITE_IDS.map((id) => {
    const s = SITES[id];
    const m = MARKETS[s.market];
    const d = getDict(s.lang);
    return {
      id,
      flag: m.flag,
      label: `${m.names[s.lang]}${m.languages.length > 1 ? ` — ${s.lang === "fr" ? "Français" : "English"}` : ""}`,
      sublabel: `${m.currency} · ${d.nav.shop}`,
      href: s.prefix,
      current: id === site.id,
      sameMarket: siblings.includes(id),
    };
  });

  // Compact catalogue for the slide-in cart (name, photo, price, quantities).
  const drawerProducts = (await listProducts(site.market, site.lang)).map((prod) => {
    const pub = toPublicProduct(prod, site.lang);
    return {
      id: pub.id,
      name: pub.name,
      href: productPath(site, pub.slug),
      image: pub.image,
      priceCents: pub.priceCents,
      unitLabel: pub.unitLabel,
      unitLabelPlural: pub.unitLabelPlural,
      minQty: pub.minQty,
      maxQty: pub.maxQty,
    };
  });

  return (
    <CartProvider market={site.market}>
      <Header
        homeHref={site.prefix}
        shopHref={routePath(site, "shop")}
        calculatorHref={routePath(site, "calculator")}
        aboutHref={routePath(site, "about")}
        preorderHref={routePath(site, "preorder")}
        blogHref={blogPath(site)}
        contactHref={routePath(site, "contact")}
        faqHref={routePath(site, "faq")}
        deliveryHref={routePath(site, "delivery")}
        trackHref={routePath(site, "track")}
        categories={categories
          .filter((c) => c.active)
          .map((c) => ({ key: c.id, name: loc(c.name, site.lang), description: loc(c.description, site.lang), href: categoryPath(site, c.id) }))}
        sites={sites}
        current={{ flag: market.flag, currency: market.currency, short: market.languages.length > 1 ? site.lang.toUpperCase() : market.id.toUpperCase() }}
        contact={{
          phone: ctx.settings.contactPhone,
          email: ctx.settings.contactEmail,
          whatsappHref: whatsappLink(ctx.settings.whatsappNumber),
          freeLabel: ctx.freeThresholdCents
            ? t.topbar.freeDeliveryFrom.replace("{amount}", money(site, ctx.freeThresholdCents, market.currency))
            : t.topbar.freeDelivery,
        }}
        labels={{
          home: t.nav.home,
          shop: t.nav.shop,
          categories: t.nav.categories,
          calculator: t.nav.calculator,
          about: t.nav.about,
          blog: t.nav.blog,
          contact: t.nav.contact,
          faq: t.nav.faq,
          delivery: t.nav.delivery,
          track: t.nav.track,
          search: t.nav.search,
          searchPlaceholder: t.nav.searchPlaceholder,
          cart: t.nav.cart,
          cartCount: t.nav.cartCount,
          openMenu: t.nav.openMenu,
          closeMenu: t.nav.closeMenu,
          allProducts: t.nav.allProducts,
          country: t.nav.country,
          skip: t.nav.skip,
          countryNotice: t.nav.countryNotice.replace("{country}", market.names[site.lang]),
          whatsapp: t.topbar.whatsapp,
        }}
      />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer ctx={ctx} articles={await listPublishedArticles(site.lang, site.market, 3)} />
      <FloatingCart
        products={drawerProducts.map(({ id, name, image }) => ({ id, name, image }))}
        hideOn={[routePath(site, "preorder")]}
        labels={{ open: t.nav.cartCount, added: t.cartDrawer.added }}
      />
      <CartDrawer
        products={drawerProducts}
        currency={market.currency}
        locale={site.locale}
        preorderHref={routePath(site, "preorder")}
        shopHref={routePath(site, "shop")}
        freeThresholdCents={ctx.freeThresholdCents}
        labels={{
          ...t.cartDrawer,
          perUnit: t.common.perUnit,
          minQty: t.common.minQty,
          decrease: t.common.decrease,
          increase: t.common.increase,
          quantity: t.common.quantity,
          photoPending: t.common.photoPending,
        }}
      />
    </CartProvider>
  );
}
