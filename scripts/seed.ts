/**
 * Seed script — pushes seed content into Supabase and creates the admin user.
 * Run with:  npm run seed   (loads .env.local via --env-file)
 *
 * Idempotent: upserts on slug/key, so it is safe to re-run.
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *           ADMIN_EMAIL, ADMIN_PASSWORD.
 */
import { createClient } from '@supabase/supabase-js';
import {
  seedCategories,
  seedProducts,
  seedCompanyInfo,
  seedAboutContent,
  seedShippingFaq,
} from '../lib/seed/data';
import { locales } from '../i18n/routing';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

async function seedCategoriesTable() {
  for (const c of seedCategories) {
    const { data: cat, error } = await supabase
      .from('categories')
      .upsert({ slug: c.slug, sort_order: c.sortOrder, is_active: true }, { onConflict: 'slug' })
      .select('id')
      .single();
    if (error || !cat) throw error ?? new Error(`category ${c.slug}`);

    for (const locale of locales) {
      const name = c.name[locale] ?? c.name.en;
      await supabase
        .from('category_translations')
        .upsert({ category_id: cat.id, locale, name }, { onConflict: 'category_id,locale' });
    }
  }
  console.log(`✓ ${seedCategories.length} categories`);
}

async function seedProductsTable() {
  // Map category slug -> id
  const { data: cats } = await supabase.from('categories').select('id, slug');
  const catBySlug = new Map((cats ?? []).map((c) => [c.slug, c.id]));

  for (const p of seedProducts) {
    const { data: prod, error } = await supabase
      .from('products')
      .upsert(
        {
          slug: p.slug,
          sku: p.sku ?? null,
          category_id: catBySlug.get(p.categorySlug) ?? null,
          price: p.price ?? null,
          display_price: p.displayPrice,
          is_active: true,
          is_featured: p.isFeatured,
          sort_order: p.sortOrder,
        },
        { onConflict: 'slug' },
      )
      .select('id')
      .single();
    if (error || !prod) throw error ?? new Error(`product ${p.slug}`);

    // Translations (only EN is mandatory; ms/zh optional -> fallback at read time)
    for (const locale of locales) {
      const name = p.name[locale];
      if (!name && locale !== 'en') continue; // leave missing so fallback applies
      await supabase.from('product_translations').upsert(
        {
          product_id: prod.id,
          locale,
          name: name ?? p.name.en,
          description: p.description[locale] ?? (locale === 'en' ? p.description.en : null),
          specs: (p.specs[locale] ?? (locale === 'en' ? p.specs.en : [])) as unknown as object,
        },
        { onConflict: 'product_id,locale' },
      );
    }

    // Variants — clear and re-insert to stay idempotent.
    await supabase.from('product_variants').delete().eq('product_id', prod.id);
    if (p.variants.length) {
      await supabase.from('product_variants').insert(
        p.variants.map((v, i) => ({
          product_id: prod.id,
          label: v.label,
          sku: v.sku ?? null,
          sort_order: i,
        })),
      );
    }

    // Images — NOTE: seed uses placeholder URLs stored directly in storage_path.
    // The real scraper (M5) uploads to Storage and stores products/{slug}/{file}.
    await supabase.from('product_images').delete().eq('product_id', prod.id);
    if (p.images.length) {
      await supabase.from('product_images').insert(
        p.images.map((img, i) => ({
          product_id: prod.id,
          storage_path: img.url,
          alt: img.alt ?? null,
          sort_order: i,
        })),
      );
    }
  }
  console.log(`✓ ${seedProducts.length} products (with translations, variants, images)`);
}

async function seedSettings() {
  const aboutByLocale = Object.fromEntries(
    locales.map((l) => [l, seedAboutContent[l]]),
  );
  const faqByLocale = Object.fromEntries(
    locales.map((l) => [l, seedShippingFaq[l]]),
  );

  const rows: { key: string; value: unknown }[] = [
    { key: 'company_info', value: seedCompanyInfo },
    { key: 'about_content', value: aboutByLocale },
    { key: 'shipping_faq', value: faqByLocale },
  ];
  for (const row of rows) {
    await supabase.from('site_settings').upsert(row, { onConflict: 'key' });
  }
  console.log(`✓ site_settings (${rows.map((r) => r.key).join(', ')})`);
}

async function seedAdminUser() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.log('• Skipping admin user (ADMIN_EMAIL/ADMIN_PASSWORD not set)');
    return;
  }
  const { error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error && !/already/i.test(error.message)) {
    console.warn('• Admin user:', error.message);
  } else {
    console.log(`✓ Admin user ready: ${email}`);
  }
}

async function main() {
  console.log('Seeding Supabase...');
  await seedCategoriesTable();
  // Demo products are opt-in only — the real catalog comes from `npm run scrape`.
  // Re-adding demos on a normal re-run would pollute the live catalog.
  if (process.argv.includes('--demo-products')) {
    await seedProductsTable();
  } else {
    console.log('• Skipping demo products (pass --demo-products to include)');
  }
  await seedSettings();
  await seedAdminUser();
  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
