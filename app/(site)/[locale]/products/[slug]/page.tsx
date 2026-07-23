import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { getCompanyInfo, getProduct, getRelatedProducts } from '@/lib/data';
import ProductDetail from '@/components/product/ProductDetail';
import ProductCard from '@/components/product/ProductCard';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = await getProduct(slug, locale as Locale);
  if (!product) return {};
  return {
    title: product.name,
    description: product.description?.slice(0, 160),
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const product = await getProduct(slug, locale as Locale);
  if (!product) notFound();

  const [related, company] = await Promise.all([
    getRelatedProducts(product, locale as Locale),
    getCompanyInfo(),
  ]);

  return (
    <div className="container-page py-10">
      <Link href="/products" className="mb-6 inline-block text-sm text-neutral-500 hover:text-brand-600">
        ← {t('common.backToProducts')}
      </Link>

      <ProductDetail product={product} whatsappNumber={company.whatsappNumber} />

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-xl font-bold text-neutral-900">{t('product.relatedProducts')}</h2>
          <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
