import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { siteUrl } from "@/lib/site-url";
import "@fontsource-variable/instrument-sans";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "Foyerwood", template: "%s · Foyerwood" },
  applicationName: "Foyerwood",
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#161515",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const h = await headers();
  const lang = h.get("x-foyerwood-lang") === "en" ? "en" : "fr";
  return (
    <html lang={lang}>
      <body className="flex min-h-dvh flex-col">{children}</body>
    </html>
  );
}
