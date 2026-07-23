import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import ProductForm from '@/components/admin/ProductForm';

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function NewProductPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('categories')
    .select('id, slug, category_translations ( locale, name )')
    .order('sort_order', { ascending: true });

  const categories = (data ?? []).map((c: any) => ({
    id: c.id as string,
    name:
      (c.category_translations ?? []).find((t: any) => t.locale === 'en')?.name ?? c.slug,
  }));

  return (
    <div>
      <Link href="/admin/products" className="text-sm text-neutral-500 hover:text-brand-700">← Products</Link>
      <h1 className="mb-6 mt-2 text-2xl font-bold text-neutral-900">Add product</h1>
      <ProductForm categories={categories} product={null} />
    </div>
  );
}
