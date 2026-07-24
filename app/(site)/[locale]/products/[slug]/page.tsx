import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { getCompanyInfo, getProduct, getRelatedProducts } from '@/lib/data';
import { SITE_URL, SITE_NAME, pageMetadata } from '@/lib/seo';
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
  return pageMetadata({
    locale,
    path: `/products/${slug}`,
    title: product.name,
    description: product.description?.slice(0, 160) || `${product.name} — ${product.categoryName}`,
    images: product.images[0] ? [product.images[0].url] : undefined,
  });
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

  // Product structured data (JSON-LD). Price is omitted unless display_price.
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || undefined,
    sku: product.sku || undefined,
    category: product.categoryName,
    brand: { '@type': 'Brand', name: 'SOFA' },
    image: product.images.map((im) => im.url),
    url: `${SITE_URL}/${locale}/products/${product.slug}`,
    manufacturer: { '@type': 'Organization', name: SITE_NAME },
    ...(product.displayPrice && product.price != null
      ? {
          offers: {
            '@type': 'Offer',
            priceCurrency: 'MYR',
            price: product.price,
            availability: 'https://schema.org/InStock',
            url: `${SITE_URL}/${locale}/products/${product.slug}`,
          },
        }
      : {}),
  };

  return (
    <div className="container-page py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
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
