/**
 * Scraper / migration script (M5) — one-off import of the existing
 * yoonfatt.com.my WooCommerce catalog into Supabase.
 *
 * Run with:  npm run scrape
 * Idempotent: matches on slug, safe to re-run. Images are re-uploaded
 * (upsert) and product_images rows replaced.
 *
 * Requires in .env.local: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 */
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const BASE = 'https://yoonfatt.com.my';
const LISTING_PAGES = 6;
const DELAY_MS = 250;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

// ── helpers ──────────────────────────────────────────────────

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchHtml(pageUrl: string): Promise<string> {
  const res = await fetch(pageUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; YoonFattMigration/1.0)' },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${pageUrl}`);
  return res.text();
}

// Known typos on the source site. Every applied fix is logged.
const TYPO_FIXES: [RegExp, string][] = [
  [/AdjustabIe/g, 'Adjustable'], // capital I instead of l
  [/Indusries/g, 'Industries'],
  [/\s{2,}/g, ' '],
];

const corrections: string[] = [];
function fixTypos(text: string, context: string): string {
  let out = text;
  for (const [re, repl] of TYPO_FIXES) {
    if (re.test(out)) {
      const before = out;
      out = out.replace(re, repl);
      if (before !== out) corrections.push(`${context}: "${before}" → "${out}"`);
    }
    re.lastIndex = 0;
  }
  return out.trim();
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function contentTypeFor(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  return (
    { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif' }[
      ext ?? ''
    ] ?? 'application/octet-stream'
  );
}

// ── scraping ─────────────────────────────────────────────────

type ScrapedProduct = {
  slug: string;
  name: string;
  categoryNames: string[];
  sku: string | null;
  price: number | null;
  description: string;
  specs: { label: string; value: string }[];
  variants: { label: string }[];
  imageUrls: string[];
  sourceUrl: string;
};

async function collectProductUrls(): Promise<string[]> {
  const urls = new Set<string>();
  for (let page = 1; page <= LISTING_PAGES; page++) {
    const pageUrl = page === 1 ? `${BASE}/products/` : `${BASE}/products/page/${page}/`;
    try {
      const html = await fetchHtml(pageUrl);
      const $ = cheerio.load(html);
      $('a[href*="/product/"]').each((_, el) => {
        const href = $(el).attr('href');
        if (!href) return;
        const m = href.match(/\/product\/([^/?#]+)\/?/);
        if (m) urls.add(`${BASE}/product/${m[1]}/`);
      });
      console.log(`• listing page ${page}: ${urls.size} product URLs so far`);
    } catch (e) {
      console.warn(`• listing page ${page} failed:`, (e as Error).message);
    }
    await sleep(DELAY_MS);
  }
  return [...urls];
}

async function scrapeProduct(productUrl: string): Promise<ScrapedProduct> {
  const html = await fetchHtml(productUrl);
  const $ = cheerio.load(html);

  const urlSlug = productUrl.match(/\/product\/([^/?#]+)\/?/)![1];
  const rawName = $('h1.product_title').first().text().trim() || urlSlug;
  const name = fixTypos(rawName, urlSlug);

  const categoryNames = $('.posted_in a')
    .map((_, el) => $(el).text().trim())
    .get();

  const skuText = $('.sku').first().text().trim();
  const sku = skuText && skuText.toLowerCase() !== 'n/a' ? skuText : null;

  // Price (rarely present)
  let price: number | null = null;
  const priceText = $('p.price .woocommerce-Price-amount').first().text().replace(/[^\d.]/g, '');
  if (priceText) {
    const parsed = Number.parseFloat(priceText);
    if (Number.isFinite(parsed) && parsed > 0) price = parsed;
  }

  // Description: short description + long description tab
  const shortDesc = $('.woocommerce-product-details__short-description').text().trim();
  const longDesc = $('#tab-description')
    .clone()
    .find('h2')
    .remove()
    .end()
    .text()
    .trim();
  const description = fixTypos([shortDesc, longDesc].filter(Boolean).join('\n\n'), `${urlSlug} description`);

  // Specs from the "Additional information" attributes table
  const specs: { label: string; value: string }[] = [];
  $('table.woocommerce-product-attributes tr').each((_, row) => {
    const label = $(row).find('th').text().trim();
    const value = $(row).find('td').text().trim().replace(/\s*\n\s*/g, ', ');
    if (label && value) specs.push({ label, value });
  });

  // Variants from variation dropdowns
  const variants: { label: string }[] = [];
  $('table.variations select option').each((_, opt) => {
    const label = $(opt).text().trim();
    const value = $(opt).attr('value');
    if (value && label && !/choose an option/i.test(label)) variants.push({ label });
  });

  // Gallery images: prefer full-size link, fall back to img src
  const imageUrls: string[] = [];
  $('.woocommerce-product-gallery__image').each((_, fig) => {
    const href = $(fig).find('a').attr('href');
    const src = $(fig).find('img').attr('data-large_image') ?? $(fig).find('img').attr('src');
    const img = href ?? src;
    if (img && !imageUrls.includes(img)) imageUrls.push(img);
  });

  // Clean the slug (fix typos there too, keep it recognisable)
  const slug = slugify(fixTypos(urlSlug.replace(/-/g, ' '), `${urlSlug} slug`));

  return { slug, name, categoryNames, sku, price, description, specs, variants, imageUrls, sourceUrl: productUrl };
}

// ── persistence ──────────────────────────────────────────────

async function ensureCategories(): Promise<Map<string, string>> {
  const { data } = await supabase
    .from('categories')
    .select('id, slug, category_translations ( locale, name )');
  const byName = new Map<string, string>(); // lowercased EN name -> id
  for (const c of data ?? []) {
    const en = (c as any).category_translations?.find((t: any) => t.locale === 'en');
    if (en) byName.set(en.name.toLowerCase(), c.id);
    byName.set(c.slug.replace(/-/g, ' '), c.id);
  }
  return byName;
}

async function resolveCategoryId(
  byName: Map<string, string>,
  names: string[],
): Promise<string | null> {
  for (const n of names) {
    const key = n.toLowerCase().replace(/&amp;/g, '&');
    if (byName.has(key)) return byName.get(key)!;
  }
  // Create the first unknown category on the fly
  if (names.length) {
    const name = names[0];
    const slug = slugify(name);
    const { data, error } = await supabase
      .from('categories')
      .upsert({ slug, sort_order: 99, is_active: true }, { onConflict: 'slug' })
      .select('id')
      .single();
    if (!error && data) {
      await supabase
        .from('category_translations')
        .upsert({ category_id: data.id, locale: 'en', name }, { onConflict: 'category_id,locale' });
      byName.set(name.toLowerCase(), data.id);
      return data.id;
    }
  }
  return null;
}

async function migrateImages(productId: string, slug: string, imageUrls: string[], alt: string) {
  await supabase.from('product_images').delete().eq('product_id', productId);
  let order = 0;
  let uploaded = 0;
  for (const imgUrl of imageUrls) {
    try {
      const res = await fetch(imgUrl);
      if (!res.ok) throw new Error(`${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      const filename = decodeURIComponent(imgUrl.split('/').pop() ?? `image-${order}.png`).replace(
        /[^a-zA-Z0-9.-]+/g,
        '_',
      );
      const path = `products/${slug}/${filename}`;
      const { error: upErr } = await supabase.storage
        .from('product-images')
        .upload(path, buf, { contentType: contentTypeFor(filename), upsert: true });
      if (upErr) throw upErr;
      const { error } = await supabase
        .from('product_images')
        .insert({ product_id: productId, storage_path: path, alt, sort_order: order++ });
      if (error) throw error;
      uploaded++;
    } catch (e) {
      console.warn(`  ! image failed (${imgUrl}):`, (e as Error).message);
    }
    await sleep(100);
  }
  return uploaded;
}

async function persist(p: ScrapedProduct, categoryByName: Map<string, string>, sortOrder: number) {
  const categoryId = await resolveCategoryId(categoryByName, p.categoryNames);

  const { data: prod, error } = await supabase
    .from('products')
    .upsert(
      {
        slug: p.slug,
        sku: p.sku,
        category_id: categoryId,
        price: p.price, // stored even though hidden
        display_price: false, // ALWAYS false for migrated products
        is_active: true,
        sort_order: sortOrder,
      },
      { onConflict: 'slug' },
    )
    .select('id')
    .single();
  if (error || !prod) throw error ?? new Error('upsert failed');

  const { error: trErr } = await supabase.from('product_translations').upsert(
    {
      product_id: prod.id,
      locale: 'en',
      name: p.name,
      description: p.description || null,
      specs: p.specs,
    },
    { onConflict: 'product_id,locale' },
  );
  if (trErr) throw trErr;

  await supabase.from('product_variants').delete().eq('product_id', prod.id);
  if (p.variants.length) {
    await supabase.from('product_variants').insert(
      p.variants.map((v, i) => ({ product_id: prod.id, label: v.label, sort_order: i })),
    );
  }

  const uploaded = await migrateImages(prod.id, p.slug, p.imageUrls, p.name);
  return { id: prod.id, uploaded };
}

// ── main ─────────────────────────────────────────────────────

async function main() {
  console.log('Collecting product URLs…');
  const urls = await collectProductUrls();
  console.log(`Found ${urls.length} products.\n`);

  const categoryByName = await ensureCategories();

  let ok = 0;
  let images = 0;
  let pricesFound = 0;
  const failures: string[] = [];

  for (let i = 0; i < urls.length; i++) {
    const productUrl = urls[i];
    try {
      const scraped = await scrapeProduct(productUrl);
      const { uploaded } = await persist(scraped, categoryByName, i + 1);
      ok++;
      images += uploaded;
      if (scraped.price != null) pricesFound++;
      console.log(
        `✓ [${i + 1}/${urls.length}] ${scraped.name} (${scraped.slug}) — ${uploaded} image(s)${
          scraped.variants.length ? `, ${scraped.variants.length} variant(s)` : ''
        }`,
      );
    } catch (e) {
      failures.push(`${productUrl}: ${(e as Error).message}`);
      console.warn(`✗ [${i + 1}/${urls.length}] ${productUrl}:`, (e as Error).message);
    }
    await sleep(DELAY_MS);
  }

  console.log('\n──────── Summary ────────');
  console.log(`Products migrated : ${ok}/${urls.length}`);
  console.log(`Images uploaded   : ${images}`);
  console.log(`Prices found      : ${pricesFound} (display_price left OFF for all)`);
  console.log(`Corrections       : ${corrections.length}`);
  corrections.forEach((c) => console.log(`  - ${c}`));
  if (failures.length) {
    console.log(`Failures (${failures.length}) — re-run to retry:`);
    failures.forEach((f) => console.log(`  - ${f}`));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
