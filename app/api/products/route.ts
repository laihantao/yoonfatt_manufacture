import { NextResponse } from 'next/server';
import { getProduct } from '@/lib/data';
import { locales, type Locale } from '@/i18n/routing';

// GET /api/products?slugs=a,b,c&locale=en
// Returns resolved (localized) product data for the enquiry cart to render
// rich rows: images, category, variants, price. Missing slugs are skipped.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const slugs = (url.searchParams.get('slugs') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 50);
  const localeParam = url.searchParams.get('locale') ?? 'en';
  const locale = (locales as readonly string[]).includes(localeParam)
    ? (localeParam as Locale)
    : 'en';

  const products = (
    await Promise.all(slugs.map((slug) => getProduct(slug, locale)))
  ).filter(Boolean);

  return NextResponse.json({ products });
}
