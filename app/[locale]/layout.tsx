import type { Metadata } from "next";

import { Analytics } from "@vercel/analytics/next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Geist, Geist_Mono } from "next/font/google";
import { notFound } from "next/navigation";

import { LanguageSwitcher } from "@/components/language-switcher";
import { routing } from "@/i18n/routing";

import "../globals.css";
import { SITE_URL } from "@/lib/site-url";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const ogLocales: Record<string, string> = {
  ru: "ru_RU",
  en: "en_US",
};

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  const title = t("title");
  const description = t("description");
  const canonicalPath = `/${locale}`;

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    alternates: {
      canonical: canonicalPath,
      languages: {
        "ru": "/ru",
        "en": "/en",
        "x-default": `/${routing.defaultLocale}`,
      },
    },
    openGraph: {
      type: "website",
      url: canonicalPath,
      siteName: "Workshop Parser",
      title,
      description,
      locale: ogLocales[locale] ?? locale,
      alternateLocale: routing.locales
        .filter(l => l !== locale)
        .map(l => ogLocales[l] ?? l),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider>
          <div className="mx-auto flex w-full max-w-[920px] items-center justify-between px-8 py-3 sm:px-14 lg:px-20">
            <a
              href="https://thebeet.dev"
              className="group text-sm font-medium"
            >
              <span className="text-zinc-900">thebeet</span>
              <span className="text-zinc-500 transition-colors duration-300 group-hover:text-rose-700">
                .dev
              </span>
            </a>
            <LanguageSwitcher />
          </div>
          {children}
          <Analytics />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
