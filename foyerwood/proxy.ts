import { NextResponse, type NextRequest } from "next/server";
import { parsePublicPath, SITES, isSiteId, type SiteId } from "./lib/sites";
import { ACTIVE_SITE_IDS, fallbackSite, isSiteActive } from "./lib/launch";

export const SITE_COOKIE = "foyerwood_site";

// Public, localized URLs (/fr/boutique, /ca/en/shop…) are rewritten to the
// internal routes (app/[site]/shop…). Unknown slugs end on the 404 page.
export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  const browserLang = (req.headers.get("accept-language") ?? "").toLowerCase().startsWith("fr") ? "fr" : "en";

  // Root: send returning visitors to their market, otherwise show the chooser.
  // With a single open country there is nothing to choose: go straight to it.
  if (pathname === "/") {
    const saved = req.cookies.get(SITE_COOKIE)?.value;
    if (saved && isSiteId(saved) && isSiteActive(SITES[saved as SiteId])) {
      return NextResponse.redirect(new URL(SITES[saved as SiteId].prefix + search, req.url));
    }
    if (new Set(ACTIVE_SITE_IDS.map((id) => SITES[id].market)).size === 1) {
      return NextResponse.redirect(new URL(fallbackSite(browserLang).prefix + search, req.url));
    }
    const headers = new Headers(req.headers);
    headers.set("x-foyerwood-lang", (req.headers.get("accept-language") ?? "").toLowerCase().startsWith("fr") ? "fr" : "en");
    return NextResponse.next({ request: { headers } });
  }

  // Internal ids are not public URLs: /ca-en/... → /ca/en/...
  if (pathname === "/ca-en" || pathname.startsWith("/ca-en/")) {
    return NextResponse.redirect(new URL(pathname.replace(/^\/ca-en/, "/ca/en") + search, req.url), 308);
  }

  const parsed = parsePublicPath(pathname);
  if (!parsed) return NextResponse.next();

  // Country not open yet: temporary redirect to the home page of an open one.
  if (!isSiteActive(parsed.site)) {
    return NextResponse.redirect(new URL(fallbackSite(parsed.site.lang).prefix, req.url), 307);
  }

  const headers = new Headers(req.headers);
  headers.set("x-foyerwood-lang", parsed.site.lang);
  headers.set("x-foyerwood-site", parsed.site.id);
  headers.set("x-foyerwood-path", pathname);

  const internal = parsed.known
    ? `/${parsed.site.id}${parsed.internal.length ? "/" + parsed.internal.join("/") : ""}`
    : `/${parsed.site.id}/_unknown`;
  return NextResponse.rewrite(new URL(internal + search, req.url), { request: { headers } });
}

export const config = {
  matcher: ["/((?!_next/|api/|admin|documents/|uploads/|favicon|icon|apple-icon|opengraph|robots.txt|sitemap.xml|.*\\.[a-z0-9]+$).*)"],
};
