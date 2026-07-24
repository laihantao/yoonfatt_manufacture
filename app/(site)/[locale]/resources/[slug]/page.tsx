import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { getArticle } from '@/lib/data';
import { SITE_URL, SITE_NAME, pageMetadata } from '@/lib/seo';
import ArticleBlocks from '@/components/resources/ArticleBlocks';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const article = await getArticle(slug, locale as Locale);
  if (!article) return {};
  return pageMetadata({
    locale,
    path: `/resources/${slug}`,
    title: article.title,
    description: article.excerpt || undefined,
    images: article.coverUrl ? [article.coverUrl] : undefined,
    type: 'article',
  });
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('resources');
  const tCat = await getTranslations('resources.cat');
  const tHome = await getTranslations('home');

  const article = await getArticle(slug, locale as Locale);
  if (!article) notFound();

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt || undefined,
    image: article.coverUrl || undefined,
    datePublished: article.createdAt,
    url: `${SITE_URL}/${locale}/resources/${article.slug}`,
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` },
    },
  };

  return (
    <article className="container-page max-w-3xl py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <Link href="/resources" className="mb-6 inline-block text-sm text-neutral-500 hover:text-brand-600">
        ← {t('backToResources')}
      </Link>

      <span className="text-sm font-semibold text-brand-600">{tCat(article.category)}</span>
      <h1 className="mt-1 text-2xl font-bold text-neutral-900 sm:text-3xl">{article.title}</h1>
      {article.excerpt && <p className="mt-3 text-lg text-neutral-600">{article.excerpt}</p>}

      <div className="mt-8">
        <ArticleBlocks blocks={article.blocks} />
      </div>

      {/* CTA back into the catalogue — drives parts/sprayer enquiries */}
      <div className="mt-12 rounded-xl bg-brand-50 p-6 text-center">
        <p className="text-neutral-700">{t('relatedCta')}</p>
        <div className="mt-4 flex justify-center gap-3">
          <Link href="/products" className="btn-primary">{tHome('ctaProducts')}</Link>
        </div>
      </div>
    </article>
  );
}
