import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { getCategories, getProducts } from '@/lib/data';
import ProductCard from '@/components/product/ProductCard';
import ProductFilters from '@/components/product/ProductFilters';

export default async function ProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { locale } = await params;
  const { category, q } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations('products');

  const [categories, products] = await Promise.all([
    getCategories(locale as Locale),
    getProducts(locale as Locale, { category, search: q }),
  ]);

  return (
    <div className="container-page py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900">{t('title')}</h1>
        <p className="mt-2 text-neutral-600">{t('subtitle')}</p>
      </header>

      <div className="grid gap-8 md:grid-cols-[220px_1fr]">
        <aside>
          <ProductFilters categories={categories} activeCategory={category} />
        </aside>

        <div>
          <p className="mb-4 text-sm text-neutral-500">{t('resultsCount', { count: products.length })}</p>
          {products.length === 0 ? (
            <div className="rounded-lg border border-dashed border-neutral-300 p-12 text-center text-neutral-500">
              {t('noResults')}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-5 lg:grid-cols-3">
              {products.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
