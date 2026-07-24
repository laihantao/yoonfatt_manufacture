import type {
  AboutContent,
  Article,
  ArticleBlock,
  Category,
  CompanyInfo,
  FaqItem,
  Locale,
  Product,
  Spec,
} from '@/lib/types';
import {
  seedAboutContent,
  seedCategories,
  seedCompanyInfo,
  seedProducts,
  seedShippingFaq,
  type SeedProduct,
} from '@/lib/seed/data';
import { createSupabasePublicClient } from '@/lib/supabase/public';
import { publicImageUrl, articleMediaUrl } from '@/lib/storage';

// ── Data access layer ─────────────────────────────────────────
// Reads from Supabase when configured; otherwise (or on any error)
// falls back to local seed data so the site always renders.
//
// Fallback rule: if a locale's value is missing/empty, use `en`.

function emptyish(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
}

// ---- Seed path (used as fallback) ----

function seedPick<T>(map: { en: T } & Partial<Record<Locale, T>>, locale: Locale): T {
  const value = map[locale];
  return emptyish(value) ? map.en : (value as T);
}

function seedCategoryName(slug: string, locale: Locale): string {
  const c = seedCategories.find((c) => c.slug === slug);
  return c ? seedPick(c.name, locale) : slug;
}

function resolveSeedProduct(p: SeedProduct, locale: Locale): Product {
  return {
    id: p.slug,
    slug: p.slug,
    sku: p.sku ?? null,
    categorySlug: p.categorySlug,
    categoryName: seedCategoryName(p.categorySlug, locale),
    name: seedPick(p.name, locale),
    description: seedPick(p.description, locale),
    specs: seedPick(p.specs, locale) as Spec[],
    price: p.price ?? null,
    displayPrice: p.displayPrice,
    isFeatured: p.isFeatured,
    sortOrder: p.sortOrder,
    images: p.images,
    variants: p.variants,
  };
}

// ---- Supabase row → resolved shapes ----

type TrRow = { locale: string; name?: string; description?: string | null; specs?: unknown };

function pickTr(rows: TrRow[] | undefined, locale: Locale, field: 'name' | 'description' | 'specs') {
  const list = rows ?? [];
  const localeRow = list.find((r) => r.locale === locale);
  const enRow = list.find((r) => r.locale === 'en');
  const val = localeRow?.[field];
  if (!emptyish(val)) return val;
  return enRow?.[field];
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapProductRow(row: any, locale: Locale): Product {
  const cat = row.categories;
  const catName =
    pickTr(cat?.category_translations, locale, 'name') ?? cat?.slug ?? '';
  const images = (row.product_images ?? [])
    .slice()
    .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((im: any) => ({ url: publicImageUrl(im.storage_path), alt: im.alt ?? null }));
  const variants = (row.product_variants ?? [])
    .slice()
    .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((v: any) => ({ label: v.label, sku: v.sku ?? null }));

  return {
    id: row.id,
    slug: row.slug,
    sku: row.sku ?? null,
    categorySlug: cat?.slug ?? '',
    categoryName: catName as string,
    name: (pickTr(row.product_translations, locale, 'name') as string) ?? row.slug,
    description: (pickTr(row.product_translations, locale, 'description') as string) ?? '',
    specs: ((pickTr(row.product_translations, locale, 'specs') as Spec[]) ?? []),
    price: row.price != null ? Number(row.price) : null,
    displayPrice: !!row.display_price,
    isFeatured: !!row.is_featured,
    sortOrder: row.sort_order ?? 0,
    images,
    variants,
  };
}

const PRODUCT_SELECT = `
  id, slug, sku, price, display_price, is_featured, sort_order, category_id,
  categories ( slug, category_translations ( locale, name ) ),
  product_translations ( locale, name, description, specs ),
  product_images ( storage_path, alt, sort_order ),
  product_variants ( label, sku, sort_order )
`;

async function fetchActiveProducts(locale: Locale): Promise<Product[] | null> {
  const sb = createSupabasePublicClient();
  if (!sb) return null;
  const { data, error } = await sb
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  if (error) {
    console.error('[data] products fetch failed, using seed:', error.message);
    return null;
  }
  return (data ?? []).map((row) => mapProductRow(row, locale));
}

// ── Public API ────────────────────────────────────────────────

export async function getCategories(locale: Locale): Promise<Category[]> {
  const sb = createSupabasePublicClient();
  if (sb) {
    const { data, error } = await sb
      .from('categories')
      .select('id, slug, sort_order, category_translations ( locale, name )')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    if (!error && data) {
      return data.map((c: any) => ({
        id: c.id,
        slug: c.slug,
        name: (pickTr(c.category_translations, locale, 'name') as string) ?? c.slug,
        sortOrder: c.sort_order ?? 0,
      }));
    }
    console.error('[data] categories fetch failed, using seed:', error?.message);
  }
  return seedCategories
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((c) => ({ id: c.slug, slug: c.slug, name: seedPick(c.name, locale), sortOrder: c.sortOrder }));
}

export async function getProducts(
  locale: Locale,
  opts: { category?: string; search?: string } = {},
): Promise<Product[]> {
  let items = await fetchActiveProducts(locale);
  if (!items) items = seedProducts.map((p) => resolveSeedProduct(p, locale));

  if (opts.category) items = items.filter((p) => p.categorySlug === opts.category);
  if (opts.search) {
    const q = opts.search.toLowerCase().trim();
    items = items.filter(
      (p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q),
    );
  }
  return items.sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getProduct(slug: string, locale: Locale): Promise<Product | null> {
  const sb = createSupabasePublicClient();
  if (sb) {
    const { data, error } = await sb
      .from('products')
      .select(PRODUCT_SELECT)
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle();
    if (!error && data) return mapProductRow(data, locale);
    if (error) console.error('[data] product fetch failed, using seed:', error.message);
    else return null; // configured + not found => genuinely missing
  }
  const p = seedProducts.find((p) => p.slug === slug);
  return p ? resolveSeedProduct(p, locale) : null;
}

export async function getFeaturedProducts(locale: Locale): Promise<Product[]> {
  return (await getProducts(locale)).filter((p) => p.isFeatured);
}

export async function getRelatedProducts(
  product: Product,
  locale: Locale,
  limit = 4,
): Promise<Product[]> {
  return (await getProducts(locale, { category: product.categorySlug }))
    .filter((p) => p.slug !== product.slug)
    .slice(0, limit);
}

async function getSetting<T>(key: string): Promise<T | null> {
  const sb = createSupabasePublicClient();
  if (!sb) return null;
  const { data, error } = await sb.from('site_settings').select('value').eq('key', key).maybeSingle();
  if (error || !data) {
    if (error) console.error(`[data] setting ${key} failed, using seed:`, error.message);
    return null;
  }
  return data.value as T;
}

export async function getCompanyInfo(): Promise<CompanyInfo> {
  const s = (await getSetting<typeof seedCompanyInfo>('company_info')) ?? seedCompanyInfo;
  return {
    name: s.name,
    coNo: s.co_no,
    phone: s.phone,
    fax: (s as { fax?: string }).fax ?? '',
    whatsappNumber: s.whatsapp_number,
    email: s.email,
    address: s.address,
    openingHours: s.opening_hours,
    facebookUrl: s.facebook_url,
    mapEmbedUrl: s.map_embed_url,
  };
}

export async function getAboutContent(locale: Locale): Promise<AboutContent> {
  const s = await getSetting<Record<Locale, AboutContent>>('about_content');
  const source = s ?? seedAboutContent;
  return source[locale] ?? source.en;
}

export async function getShippingFaq(locale: Locale): Promise<FaqItem[]> {
  const s = await getSetting<Record<Locale, FaqItem[]>>('shipping_faq');
  const source = s ?? seedShippingFaq;
  return source[locale] ?? source.en;
}

// ── Articles / Resources ──────────────────────────────────────

const ARTICLE_SELECT = `
  id, slug, category, cover_path, is_published, created_at, sort_order,
  article_translations ( locale, title, excerpt, body )
`;

function mapArticleRow(row: any, locale: Locale): Article {
  const trs = (row.article_translations ?? []) as any[];
  const localeTr = trs.find((t) => t.locale === locale);
  const enTr = trs.find((t) => t.locale === 'en');
  const tr = localeTr && !emptyish(localeTr.title) ? localeTr : (enTr ?? localeTr ?? {});
  // Blocks fall back to EN as a whole if this locale has no blocks.
  const blocks: ArticleBlock[] =
    (Array.isArray(tr.body) && tr.body.length ? tr.body : enTr?.body) ?? [];

  return {
    id: row.id,
    slug: row.slug,
    category: row.category ?? 'product-guide',
    coverUrl: row.cover_path ? articleMediaUrl(row.cover_path) : null,
    title: (tr.title as string) ?? enTr?.title ?? row.slug,
    excerpt: (tr.excerpt as string) ?? enTr?.excerpt ?? '',
    blocks,
    isPublished: !!row.is_published,
    createdAt: row.created_at,
  };
}

export async function getArticles(
  locale: Locale,
  opts: { category?: string; limit?: number } = {},
): Promise<Article[]> {
  const sb = createSupabasePublicClient();
  if (!sb) return [];
  let query = sb
    .from('articles')
    .select(ARTICLE_SELECT)
    .eq('is_published', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });
  if (opts.category) query = query.eq('category', opts.category);
  if (opts.limit) query = query.limit(opts.limit);

  const { data, error } = await query;
  if (error) {
    // Table may not exist yet (migration not run) — fail soft.
    console.error('[data] articles fetch failed:', error.message);
    return [];
  }
  return (data ?? []).map((row) => mapArticleRow(row, locale));
}

export async function getArticle(slug: string, locale: Locale): Promise<Article | null> {
  const sb = createSupabasePublicClient();
  if (!sb) return null;
  const { data, error } = await sb
    .from('articles')
    .select(ARTICLE_SELECT)
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle();
  if (error || !data) {
    if (error) console.error('[data] article fetch failed:', error.message);
    return null;
  }
  return mapArticleRow(data, locale);
}
