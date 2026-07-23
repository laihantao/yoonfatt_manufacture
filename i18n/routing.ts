import { defineRouting } from 'next-intl/routing';

export const locales = ['en', 'ms', 'zh'] as const;
export type Locale = (typeof locales)[number];

export const routing = defineRouting({
  locales,
  defaultLocale: 'en',
  // Always prefix so /en, /ms, /zh are explicit and SEO-friendly (hreflang).
  localePrefix: 'always',
});
