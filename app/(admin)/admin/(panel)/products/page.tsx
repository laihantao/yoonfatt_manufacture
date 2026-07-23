import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { publicImageUrl } from '@/lib/storage';
import ProductsTable, { type AdminProductRow } from '@/components/admin/ProductsTable';

/* eslint-disable @typescript-eslint/no-explicit-any */
function en(rows: any[] | undefined, field: string, fallback = '') {
  const row = (rows ?? []).find((r) => r.locale === 'en');
  return row?.[field] ?? fallback;
}

export default async function AdminProductsPage() {
  const supabase = await createSupabaseServerClient();
  const [{ data, error }, { data: cats }] = await Promise.all([
    supabase
      .from('products')
      .select(
        `id, slug, price, display_price, is_active, is_featured, sort_order,
         categories ( slug, category_translations ( locale, name ) ),
         product_translations ( locale, name, description ),
         product_images ( storage_path, sort_order )`,
      )
      .order('sort_order', { ascending: true }),
    supabase
      .from('categories')
      .select('slug, sort_order, category_translations ( locale, name )')
      .order('sort_order', { ascending: true }),
  ]);

  const products: AdminProductRow[] = (data ?? []).map((p: any) => {
    const img = (p.product_images ?? []).sort(
      (a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
    )[0];
    return {
      id: p.id,
      slug: p.slug,
      name: en(p.product_translations, 'name', p.slug),
      description: en(p.product_translations, 'description'),
      categoryName: en(p.categories?.category_translations, 'name', p.categories?.slug ?? '—'),
      categorySlug: p.categories?.slug ?? '',
      price: p.price != null ? Number(p.price) : null,
      displayPrice: !!p.display_price,
      isActive: !!p.is_active,
      isFeatured: !!p.is_featured,
      sortOrder: p.sort_order ?? 0,
      thumb: img ? publicImageUrl(img.storage_path) : null,
    };
  });

  const categories = (cats ?? []).map((c: any) => ({
    slug: c.slug as string,
    name: en(c.category_translations, 'name', c.slug),
  }));

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">Products</h1>
        <Link href="/admin/products/new" className="btn-primary">+ Add product</Link>
      </div>

      {error && (
        <p className="mt-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error.message}</p>
      )}

      <ProductsTable products={products} categories={categories} />
    </div>
  );
}
