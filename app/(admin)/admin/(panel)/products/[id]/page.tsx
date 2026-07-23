import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import ProductForm, { type ProductFormData } from '@/components/admin/ProductForm';

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const [{ data: product }, { data: cats }] = await Promise.all([
    supabase
      .from('products')
      .select(
        `id, slug, sku, category_id, price, display_price, is_active, is_featured, sort_order,
         product_translations ( locale, name, description, specs ),
         product_variants ( label, sku, sort_order ),
         product_images ( id, storage_path, alt, sort_order )`,
      )
      .eq('id', id)
      .maybeSingle(),
    supabase
      .from('categories')
      .select('id, slug, category_translations ( locale, name )')
      .order('sort_order', { ascending: true }),
  ]);

  if (!product) notFound();

  const categories = (cats ?? []).map((c: any) => ({
    id: c.id as string,
    name:
      (c.category_translations ?? []).find((t: any) => t.locale === 'en')?.name ?? c.slug,
  }));

  const p = product as any;
  const formData: ProductFormData = {
    ...p,
    price: p.price != null ? Number(p.price) : null,
  };

  return (
    <div>
      <Link href="/admin/products" className="text-sm text-neutral-500 hover:text-brand-700">← Products</Link>
      <h1 className="mb-6 mt-2 text-2xl font-bold text-neutral-900">Edit product</h1>
      <ProductForm categories={categories} product={formData} />
    </div>
  );
}
