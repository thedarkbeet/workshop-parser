import type { MetadataRoute } from "next";

import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(
    routing.locales.map(locale => [locale, `${SITE_URL}/${locale}`]),
  ) as Record<string, string>;

  languages["x-default"] = `${SITE_URL}/${routing.defaultLocale}`;

  return routing.locales.map(locale => ({
    url: `${SITE_URL}/${locale}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 1,
    alternates: { languages },
  }));
}
