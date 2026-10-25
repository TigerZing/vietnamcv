import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";

import { IntlProvider } from "@/components/layout/intl-provider";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { routing } from "@/i18n/routing";
import { env } from "@/lib/env";
import { DEFAULT_THEME, THEME_COLORS, themeInitScript } from "@/lib/theme";

import "../globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-be-vietnam-pro",
  display: "swap",
});

const TIME_ZONE = "Asia/Ho_Chi_Minh";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  // The inline theme script updates this when a saved light theme is applied.
  themeColor: THEME_COLORS[DEFAULT_THEME],
};

export async function generateMetadata({
  params,
}: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return {
    metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
    title: { default: t("title"), template: t("titleTemplate") },
    description: t("description"),
    alternates: {
      canonical: `/${locale}`,
      languages: Object.fromEntries(
        routing.locales.map((code) => [code, `/${code}`]),
      ),
    },
    openGraph: {
      type: "website",
      siteName: t("title"),
      locale: locale === "vi" ? "vi_VN" : "en_US",
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  const t = await getTranslations({ locale, namespace: "Common" });
  const messages = await getMessages({ locale });

  return (
    // suppressHydrationWarning: the inline script may switch data-theme before hydration.
    <html
      lang={locale}
      className={beVietnamPro.variable}
      data-theme={DEFAULT_THEME}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <IntlProvider locale={locale} messages={messages} timeZone={TIME_ZONE}>
          <a
            href="#main-content"
            className="sr-only z-50 rounded-md bg-accent px-4 py-2 text-accent-foreground focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
          >
            {t("skipToContent")}
          </a>
          <SiteHeader />
          <main
            id="main-content"
            className="mx-auto w-full max-w-6xl flex-1 px-4 py-8"
          >
            {children}
          </main>
          <SiteFooter />
        </IntlProvider>
      </body>
    </html>
  );
}
