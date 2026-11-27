import { afterEach, describe, expect, it, vi } from "vitest";
import { CANONICAL_ORIGIN, siteUrl } from "@/lib/site-url";

describe("public base URL", () => {
  afterEach(() => vi.unstubAllEnvs());
  it("uses the official www domain in production, never the Vercel address", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://cadexleader-lgtm.vercel.app");
    expect(siteUrl()).toBe("https://www.foyerwoods.com");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://foyerwoods.com/");
    expect(siteUrl()).toBe(CANONICAL_ORIGIN);
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://www.foyerwood.com");
    expect(siteUrl()).toBe(CANONICAL_ORIGIN);
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    expect(siteUrl()).toBe(CANONICAL_ORIGIN);
  });
});
