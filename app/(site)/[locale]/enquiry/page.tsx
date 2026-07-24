import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { getCompanyInfo, getShippingFaq } from '@/lib/data';
import EnquiryClient from '@/components/enquiry/EnquiryClient';
import FaqAccordion from '@/components/enquiry/FaqAccordion';

// The enquiry cart is user-specific — keep it out of search indexes.
export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default async function EnquiryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('enquiry');

  const [company, faq] = await Promise.all([
    getCompanyInfo(),
    getShippingFaq(locale as Locale),
  ]);

  return (
    <div className="container-page py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900">{t('title')}</h1>
        <p className="mt-2 max-w-2xl text-neutral-600">{t('subtitle')}</p>
      </header>

      <EnquiryClient whatsappNumber={company.whatsappNumber} />

      <section className="mt-16 max-w-3xl">
        <h2 className="mb-4 text-xl font-bold text-neutral-900">{t('faqTitle')}</h2>
        <FaqAccordion items={faq} />
      </section>
    </div>
  );
}
