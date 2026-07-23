import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getCompanyInfo } from '@/lib/data';
import { waLink } from '@/lib/whatsapp';
import ContactForm from '@/components/contact/ContactForm';

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('contact');
  const company = await getCompanyInfo();

  const rows = [
    { label: t('phone'), value: company.phone, href: `tel:${company.phone.replace(/\s/g, '')}` },
    company.fax ? { label: 'Fax', value: company.fax, href: null } : null,
    { label: t('whatsapp'), value: company.whatsappNumber, href: waLink(company.whatsappNumber) },
    company.email && !company.email.startsWith('{{')
      ? { label: t('email'), value: company.email, href: `mailto:${company.email}` }
      : null,
    { label: t('address'), value: company.address, href: null },
  ].filter(Boolean) as { label: string; value: string; href: string | null }[];

  return (
    <div className="container-page py-16">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-neutral-900">{t('title')}</h1>
        <p className="mt-2 max-w-2xl text-neutral-600">{t('subtitle')}</p>
      </header>

      <div className="grid gap-10 md:grid-cols-2">
        <div>
          <dl className="space-y-4">
            {rows.map((r) => (
              <div key={r.label} className="flex flex-col border-b border-neutral-100 pb-4">
                <dt className="text-sm font-medium text-neutral-500">{r.label}</dt>
                <dd className="mt-0.5 text-neutral-900">
                  {r.href ? (
                    <a href={r.href} className="hover:text-brand-600" target={r.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">
                      {r.value}
                    </a>
                  ) : (
                    r.value
                  )}
                </dd>
              </div>
            ))}
            <div>
              <dt className="text-sm font-medium text-neutral-500">{t('openingHours')}</dt>
              <dd className="mt-0.5 whitespace-pre-line text-neutral-900">{company.openingHours}</dd>
            </div>
          </dl>

          <div className="mt-6 overflow-hidden rounded-lg border border-neutral-200">
            <iframe title="Map" src={company.mapEmbedUrl} className="h-64 w-full" loading="lazy" />
          </div>
        </div>

        <div>
          <h2 className="mb-4 text-lg font-semibold text-neutral-900">{t('formTitle')}</h2>
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
