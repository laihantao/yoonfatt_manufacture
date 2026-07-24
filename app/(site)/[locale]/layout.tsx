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
import '@/app/globals.css';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  title: {
    default: 'Yoon Fatt Industries — Agriculture Sprayers Since 1949',
    template: '%s | Yoon Fatt Industries',
  },
  description:
    'Malaysian manufacturer of SOFA agriculture knapsack sprayers and spare parts. Factory in Kluang, Johor, exporting across Asia and Africa.',
};

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

  return (
    // suppressHydrationWarning: browser extensions (e.g. Grammarly) inject
    // attributes into <html>/<body> before React hydrates — harmless mismatch.
    <html lang={locale} suppressHydrationWarning>
      <body suppressHydrationWarning>
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
