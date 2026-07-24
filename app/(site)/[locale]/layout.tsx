import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { EnquiryCartProvider } from '@/components/enquiry/EnquiryCartProvider';
import { ToastProvider } from '@/components/ui/ToastProvider';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import WhatsAppFloat from '@/components/layout/WhatsAppFloat';
import { getCompanyInfo } from '@/lib/data';
import { SITE_URL, SITE_NAME, pageMetadata } from '@/lib/seo';
import '@/app/globals.css';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const DESCRIPTIONS: Record<string, string> = {
  en: 'Malaysian manufacturer of SOFA agriculture knapsack sprayers and spare parts — built and assembled in-house in Kluang, Johor since 1949. Nationwide East & West Malaysia.',
  ms: 'Pengeluar penyembur galas pertanian SOFA dan alat ganti dari Malaysia — dibuat dan dipasang sendiri di Kluang, Johor sejak 1949. Seluruh Malaysia Timur & Barat.',
  zh: '马来西亚 SOFA 农业背负式喷雾器及配件制造商 —— 自 1949 年起在柔佛居銮自有工厂生产与组装，服务全马东西马。',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: 'Yoon Fatt Industries — Agriculture Sprayers Since 1949',
      template: '%s | Yoon Fatt Industries',
    },
    ...pageMetadata({
      locale,
      path: '',
      description: DESCRIPTIONS[locale] ?? DESCRIPTIONS.en,
    }),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }
  setRequestLocale(locale);

  const messages = await getMessages();
  const company = await getCompanyInfo();

  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: `${SITE_URL}/${locale}`,
    logo: `${SITE_URL}/logo.png`,
    foundingDate: '1949',
    telephone: company.phone,
    email: company.email?.startsWith('{{') ? undefined : company.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: company.address,
      addressCountry: 'MY',
    },
    sameAs: company.facebookUrl ? [company.facebookUrl] : undefined,
  };

  return (
    // suppressHydrationWarning: browser extensions (e.g. Grammarly) inject
    // attributes into <html>/<body> before React hydrates — harmless mismatch.
    <html lang={locale} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <NextIntlClientProvider messages={messages}>
          <ToastProvider>
          <EnquiryCartProvider>
            <div className="flex min-h-screen flex-col">
              <Header />
              <main className="flex-1">{children}</main>
              <Footer company={company} />
            </div>
            <WhatsAppFloat whatsappNumber={company.whatsappNumber} />
          </EnquiryCartProvider>
          </ToastProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
