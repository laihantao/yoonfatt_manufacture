import Image from 'next/image';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { getAboutContent, getCompanyInfo } from '@/lib/data';

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const [about, company] = await Promise.all([
    getAboutContent(locale as Locale),
    getCompanyInfo(),
  ]);

  return (
    <div className="container-page max-w-3xl py-16">
      <span className="text-sm font-semibold uppercase tracking-wide text-brand-600">
        {t('home.heritageTitle')}
      </span>
      <h1 className="mt-2 text-3xl font-bold text-neutral-900">{t('about.title')}</h1>

      <div className="mt-8 overflow-hidden rounded-2xl shadow">
        <Image
          src="/factory.jpg"
          alt="Yoon Fatt Industries factory in Kluang, Johor"
          width={960}
          height={660}
          className="h-auto w-full object-cover"
        />
      </div>

      <div className="mt-8 space-y-5 leading-relaxed text-neutral-700">
        {about.paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      <div className="mt-12 grid gap-4 rounded-xl bg-brand-50 p-8 sm:grid-cols-3">
        <div className="text-center">
          <div className="text-3xl font-bold text-brand-700">1949</div>
          <p className="mt-1 text-sm text-neutral-600">{t('home.heritageTitle')}</p>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-brand-700">SOFA</div>
          <p className="mt-1 text-sm text-neutral-600">{t('nav.sofaSprayer')}</p>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-brand-700">Kluang</div>
          <p className="mt-1 text-sm text-neutral-600">{company.address}</p>
        </div>
      </div>
    </div>
  );
}
