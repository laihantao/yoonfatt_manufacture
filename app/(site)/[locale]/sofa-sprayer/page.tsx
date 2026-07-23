import Image from 'next/image';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { getCompanyInfo, getProduct } from '@/lib/data';
import { waLink } from '@/lib/whatsapp';

// MVP: static showcase. The GSAP scroll-driven experience is a later phase;
// the anatomy content below is already JSON-driven so it can be reused.
const anatomy = [
  { key: 'tank', en: 'Durable Tank', body: 'High-density polyethylene tank built to resist chemicals and impact.' },
  { key: 'pump', en: 'High-Pressure Pump', body: 'Manual lever pump delivers consistent, strong spray pressure.' },
  { key: 'lance', en: 'Spray Lance', body: 'Balanced lance with comfortable grip and reliable trigger valve.' },
  { key: 'nozzle', en: 'Adjustable Nozzle', body: 'From fine mist to solid jet for versatile field application.' },
];

export default async function SofaSprayerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const [company, hero] = await Promise.all([
    getCompanyInfo(),
    getProduct('plastic-knapsack-sprayer-sofa', locale as Locale),
  ]);

  return (
    <div>
      {/* Hero */}
      <section className="bg-brand-800 py-24 text-white">
        <div className="container-page grid gap-10 md:grid-cols-2">
          <div className="flex flex-col justify-center">
            <span className="w-fit rounded-full bg-brand-600/60 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
              SOFA
            </span>
            <h1 className="mt-3 text-4xl font-bold leading-tight md:text-5xl">
              {hero?.name ?? 'SOFA Knapsack Sprayer'}
            </h1>
            <p className="mt-4 max-w-md text-brand-100">{hero?.description}</p>
            <div className="mt-8 flex gap-3">
              {hero && (
                <Link href={`/products/${hero.slug}`} className="btn bg-white text-brand-800 hover:bg-brand-50">
                  {t('common.viewDetails')}
                </Link>
              )}
              <a href={waLink(company.whatsappNumber)} target="_blank" rel="noopener noreferrer" className="btn-whatsapp">
                {t('common.whatsappUs')}
              </a>
            </div>
          </div>
          <div className="grid place-items-center">
            {hero?.images[0] ? (
              <div className="relative aspect-square w-full max-w-sm overflow-hidden rounded-2xl bg-white/10 p-4">
                <Image
                  src={hero.images[0].url}
                  alt={hero.images[0].alt ?? hero.name}
                  fill
                  sizes="(max-width: 768px) 90vw, 400px"
                  className="object-contain p-4"
                />
              </div>
            ) : (
              <div className="grid aspect-square w-full max-w-sm place-items-center rounded-2xl border-2 border-dashed border-white/30 text-brand-100">
                SOFA sprayer image
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Anatomy */}
      <section className="container-page py-20">
        <h2 className="text-center text-2xl font-bold text-neutral-900">{t('nav.sofaSprayer')}</h2>
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {anatomy.map((a) => (
            <div key={a.key} className="rounded-lg border border-neutral-200 p-6">
              <h3 className="font-semibold text-brand-700">{a.en}</h3>
              <p className="mt-2 text-sm text-neutral-600">{a.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-neutral-50 py-16">
        <div className="container-page text-center">
          <h2 className="text-2xl font-bold text-neutral-900">{t('home.contactStripTitle')}</h2>
          <div className="mt-6 flex justify-center gap-3">
            {hero && (
              <Link href={`/products/${hero.slug}`} className="btn-primary">{t('common.viewDetails')}</Link>
            )}
            <a href={waLink(company.whatsappNumber)} target="_blank" rel="noopener noreferrer" className="btn-whatsapp">
              {t('common.whatsappUs')}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
