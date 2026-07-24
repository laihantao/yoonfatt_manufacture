import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { SITE_URL, localeAlternates } from '@/lib/seo';
import { getProducts, getArticles } from '@/lib/data';

// Static, localized paths (no locale prefix).
const STATIC_PATHS = ['', '/products', '/sofa-sprayer', '/resources', '/about', '/contact'];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  const push = (path: string, priority = 0.7) => {
    for (const locale of routing.locales) {
      entries.push({
        url: `${SITE_URL}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority,
        alternates: { languages: localeAlternates(path) },
      });
    }
  };

  STATIC_PATHS.forEach((p) => push(p, p === '' ? 1 : 0.8));

  // Dynamic content (fetched once in the default locale — URLs are the same
  // across locales, only the alternates differ).
  try {
    const products = await getProducts(routing.defaultLocale);
    products.forEach((p) => push(`/products/${p.slug}`, 0.7));
  } catch {
    /* ignore — sitemap should never crash the build */
  }
  try {
    const articles = await getArticles(routing.defaultLocale);
    articles.forEach((a) => push(`/resources/${a.slug}`, 0.6));
  } catch {
    /* ignore */
  }

  return entries;
}
