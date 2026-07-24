import type { Metadata } from 'next';
import { routing } from '@/i18n/routing';

// Production URL — set NEXT_PUBLIC_SITE_URL in the environment (e.g. Vercel).
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
).replace(/\/$/, '');

export const SITE_NAME = 'Yoon Fatt Industries (M) Sdn. Bhd.';

const OG_LOCALE: Record<string, string> = {
  en: 'en_MY',
  ms: 'ms_MY',
  zh: 'zh_MY',
};

// hreflang alternates for a locale-agnostic path (e.g. '/products', '' for home).
export function localeAlternates(path: string) {
  const languages: Record<string, string> = {};
  for (const l of routing.locales) languages[l] = `${SITE_URL}/${l}${path}`;
  languages['x-default'] = `${SITE_URL}/${routing.defaultLocale}${path}`;
  return languages;
}

/**
 * Build canonical + hreflang + OpenGraph metadata for a localized page.
 * `path` has no locale prefix and no trailing slash (use '' for the home page).
 */
export function pageMetadata({
  locale,
  path,
  title,
  description,
  images,
  type = 'website',
}: {
  locale: string;
  path: string;
  title?: string;
  description?: string;
  images?: string[];
  type?: 'website' | 'article';
}): Metadata {
  const url = `${SITE_URL}/${locale}${path}`;
  const ogImages = (images && images.length ? images : ['/hero-field.png']).map((src) =>
    src.startsWith('http') ? src : `${SITE_URL}${src}`,
  );
  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: localeAlternates(path),
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      locale: OG_LOCALE[locale] ?? 'en_MY',
      type,
      images: ogImages,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImages,
    },
  };
}
