import { createSupabaseServerClient } from '@/lib/supabase/server';
import CategoriesManager, { type CategoryRow } from '@/components/admin/CategoriesManager';

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function AdminCategoriesPage() {
  const supabase = await createSupabaseServerClient();
  const [{ data: cats }, { data: prods }] = await Promise.all([
    supabase
      .from('categories')
      .select('id, slug, sort_order, is_active, category_translations ( locale, name )')
      .order('sort_order', { ascending: true }),
    supabase.from('products').select('category_id, is_active'),
  ]);

  const counts = new Map<string, { total: number; active: number }>();
  for (const p of prods ?? []) {
    if (!p.category_id) continue;
    const c = counts.get(p.category_id) ?? { total: 0, active: 0 };
    c.total++;
    if (p.is_active) c.active++;
    counts.set(p.category_id, c);
  }

  const categories: CategoryRow[] = (cats ?? []).map((c: any) => {
    const name = (locale: string) =>
      (c.category_translations ?? []).find((t: any) => t.locale === locale)?.name ?? '';
    return {
      id: c.id,
      slug: c.slug,
      sortOrder: c.sort_order ?? 0,
      isActive: !!c.is_active,
      names: { en: name('en') || c.slug, ms: name('ms'), zh: name('zh') },
      productCount: counts.get(c.id)?.total ?? 0,
      activeProductCount: counts.get(c.id)?.active ?? 0,
    };
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-900">Categories</h1>
      <p className="mb-2 mt-1 text-sm text-neutral-500">
        Manage product categories. A category can only be deleted when no products use it.
      </p>
      <CategoriesManager categories={categories} />
    </div>
  );
}
