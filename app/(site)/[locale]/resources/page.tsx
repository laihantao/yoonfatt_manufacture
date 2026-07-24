import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { getArticles } from '@/lib/data';
import { pageMetadata } from '@/lib/seo';
import ResourcesGrid from '@/components/resources/ResourcesGrid';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'resources' });
  return pageMetadata({ locale, path: '/resources', title: t('title'), description: t('subtitle') });
}

export default async function ResourcesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('resources');
  const articles = await getArticles(locale as Locale);

  return (
    <div className="container-page py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900">{t('title')}</h1>
        <p className="mt-2 max-w-2xl text-neutral-600">{t('subtitle')}</p>
      </header>
      <ResourcesGrid articles={articles} />
    </div>
  );
}
