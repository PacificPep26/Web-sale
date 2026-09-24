import { ToyFooter } from "@/components/toys/toy-footer"
import { ToyCartProvider } from "@/components/toys/toy-cart"
import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import { themeFor } from "@/themes/registry";
import { Header } from "@/components/layout/Header";
import { ConditionalFooter } from "@/components/layout/ConditionalFooter";
import { FloatingWhatsAppWidget } from "@/components/ui/FloatingWhatsAppWidget";
import Script from "next/script";

const GOOGLE_ADS_TAG_ID = "AW-18406999814"

export async function generateMetadata(): Promise<Metadata> {
  const theme = themeFor((await headers()).get("host"));
  return {
    title: { default: `${theme.brand} — ${theme.hero.eyebrow}`, template: `%s · ${theme.brand}` },
    description: theme.tagline,
    ...(theme.key === "toys" ? { icons: { icon: "/playpuff/icon.png" } } : {}),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const host = (await headers()).get("host");
  const theme = themeFor(host);
  const fontHref = `https://fonts.googleapis.com/css2?${[...theme.fonts, ...(theme.extraFonts ?? [])]
    .map((f) => `family=${f}`)
    .join("&")}&display=swap`;

  return (
    <html lang="en" data-theme={theme.key} className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href={fontHref} />
      </head>
      <body className="flex min-h-full flex-col">
        {theme.key === "eyewear" && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_TAG_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-ads-base-tag" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GOOGLE_ADS_TAG_ID}');`}
            </Script>
          </>
        )}
        <FloatingWhatsAppWidget />
        {theme.key === "toys" ? (
          <ToyCartProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <ToyFooter />
          </ToyCartProvider>
        ) : (
          <>
            <Header />
            <main className="flex-1">{children}</main>
            <ConditionalFooter eyewear={theme.key === "eyewear"} />
          </>
        )}
      </body>
    </html>
  );
}
