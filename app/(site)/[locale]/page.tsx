import Image from 'next/image';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { getAboutContent, getCompanyInfo, getFeaturedProducts } from '@/lib/data';
import ProductCard from '@/components/product/ProductCard';

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('home');

  const [featured, company, about] = await Promise.all([
    getFeaturedProducts(locale as Locale),
    getCompanyInfo(),
    getAboutContent(locale as Locale),
  ]);

  const highlights = [
    { title: t('highlightQualityTitle'), body: t('highlightQualityBody'), icon: '✓' },
    { title: t('highlightProcessTitle'), body: t('highlightProcessBody'), icon: '⚙' },
    { title: t('highlightPricingTitle'), body: t('highlightPricingBody'), icon: '₮' },
  ];

  return (
    <>
      {/* Hero — full-width field imagery with dark overlay for readability */}
      <section className="relative overflow-hidden text-white">
        <Image
          src="/hero-field.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-900/85 via-brand-900/60 to-brand-900/30" />
        <div className="container-page relative py-24 md:py-36">
          <div className="max-w-2xl">
            <span className="mb-3 inline-block w-fit rounded-full bg-brand-600/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
              {t('heritageTitle')}
            </span>
            <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:text-5xl">
              {t('heroTagline')}
            </h1>
            <p className="mt-5 max-w-lg text-base text-brand-50 sm:text-lg">
              {t('heroSubtitle')}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/products" className="btn bg-white text-brand-800 hover:bg-brand-50">
                {t('ctaProducts')}
              </Link>
              <Link href="/sofa-sprayer" className="btn border border-white/60 text-white hover:bg-white/10">
                {t('ctaShowcase')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="container-page py-16">
        <h2 className="text-center text-2xl font-bold text-neutral-900">{t('highlightsTitle')}</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {highlights.map((h) => (
            <div key={h.title} className="rounded-lg border border-neutral-200 bg-white p-6 text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-brand-50 text-xl text-brand-600">
                {h.icon}
              </div>
              <h3 className="mt-4 font-semibold text-neutral-900">{h.title}</h3>
              <p className="mt-2 text-sm text-neutral-600">{h.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured products */}
      {featured.length > 0 && (
        <section className="bg-neutral-50 py-16">
          <div className="container-page">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-neutral-900">{t('featuredTitle')}</h2>
                <p className="mt-1 text-sm text-neutral-600">{t('featuredSubtitle')}</p>
              </div>
              <Link href="/products" className="hidden text-sm font-semibold text-brand-700 hover:underline sm:block">
                {t('viewAll')} →
              </Link>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-5 lg:grid-cols-4">
              {featured.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* About brief */}
      <section className="container-page grid gap-8 py-16 md:grid-cols-2">
        <div>
          <span className="text-sm font-semibold uppercase tracking-wide text-brand-600">
            {t('heritageTitle')}
          </span>
          <h2 className="mt-2 text-2xl font-bold text-neutral-900">{company.name}</h2>
          <div className="mt-4 space-y-3 text-neutral-600">
            {about.paragraphs.slice(0, 2).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          <Link href="/about" className="mt-6 inline-block btn-outline">
            {t('heritageTitle')} →
          </Link>
        </div>
        <div className="relative">
          <div className="overflow-hidden rounded-2xl shadow-lg">
            <Image
              src="/factory.jpg"
              alt="Yoon Fatt Industries factory in Kluang, Johor"
              width={960}
              height={660}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="absolute -bottom-5 left-6 rounded-xl bg-brand-700 px-5 py-3 text-white shadow-lg">
            <div className="text-2xl font-bold leading-none">1949</div>
            <p className="mt-1 text-xs text-brand-100">{t('heritageTitle')}</p>
          </div>
        </div>
      </section>

      {/* Contact strip */}
      <section className="bg-brand-800 py-12 text-white">
        <div className="container-page flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
          <div>
            <h2 className="text-xl font-bold">{t('contactStripTitle')}</h2>
            <p className="mt-1 text-brand-100">{company.address} · {company.phone}</p>
          </div>
          <Link href="/contact" className="btn bg-white text-brand-800 hover:bg-brand-50">
            {t('contactStripTitle')}
          </Link>
        </div>
      </section>
    </>
  );
}
