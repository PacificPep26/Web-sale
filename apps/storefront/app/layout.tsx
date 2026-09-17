import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import { themeFor } from "@/themes/registry";
import { Header } from "@/components/layout/Header";
import { ConditionalFooter } from "@/components/layout/ConditionalFooter";

export async function generateMetadata(): Promise<Metadata> {
  const theme = themeFor((await headers()).get("host"));
  return {
    title: { default: `${theme.brand} — ${theme.hero.eyebrow}`, template: `%s · ${theme.brand}` },
    description: theme.tagline,
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
        <Header />
        <main className="flex-1">{children}</main>
        <ConditionalFooter eyewear={theme.key === "eyewear"} />
      </body>
    </html>
  );
}
