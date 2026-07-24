import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { waLink } from '@/lib/whatsapp';
import type { CompanyInfo } from '@/lib/types';

export default function Footer({ company }: { company: CompanyInfo }) {
  const t = useTranslations();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-neutral-200 bg-neutral-50">
      <div className="container-page grid gap-10 py-12 md:grid-cols-4">
        {/* Company */}
        <div className="md:col-span-1">
          <Image
            src="/logo.png"
            alt="Yoon Fatt Industries (M) Sdn. Bhd."
            width={220}
            height={44}
            className="h-10 w-auto"
          />
          <p className="mt-3 text-sm text-neutral-600">{company.name}</p>
          {company.coNo && (
            <p className="mt-1 text-xs text-neutral-500">
              {t('footer.coNo')}: {company.coNo}
            </p>
          )}
        </div>

        {/* Quick links */}
        <div>
          <h3 className="text-sm font-semibold text-neutral-900">{t('footer.quickLinks')}</h3>
          <ul className="mt-3 space-y-2 text-sm text-neutral-600">
            <li><Link href="/products" className="hover:text-brand-600">{t('nav.products')}</Link></li>
            <li><Link href="/sofa-sprayer" className="hover:text-brand-600">{t('nav.sofaSprayer')}</Link></li>
            <li><Link href="/resources" className="hover:text-brand-600">{t('nav.resources')}</Link></li>
            <li><Link href="/about" className="hover:text-brand-600">{t('nav.about')}</Link></li>
            <li><Link href="/contact" className="hover:text-brand-600">{t('nav.contact')}</Link></li>
            <li><Link href="/enquiry" className="hover:text-brand-600">{t('footer.shippingFaq')}</Link></li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="text-sm font-semibold text-neutral-900">{t('footer.contact')}</h3>
          <ul className="mt-3 space-y-2 text-sm text-neutral-600">
            <li>{company.address}</li>
            <li>
              <span className="text-neutral-400">{t('footer.officeTel')}: </span>
              <a href={`tel:${company.phone.replace(/\s/g, '')}`} className="hover:text-brand-600">{company.phone}</a>
            </li>
            {company.fax && (
              <li>
                <span className="text-neutral-400">{t('footer.fax')}: </span>
                {company.fax}
              </li>
            )}
            {company.whatsappNumber && (
              <li>
                <span className="text-neutral-400">{t('footer.salesContact')}: </span>
                <a
                  href={waLink(company.whatsappNumber)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-brand-600"
                >
                  {company.whatsappNumber}
                </a>
              </li>
            )}
            {company.email && !company.email.startsWith('{{') && (
              <li>
                <span className="text-neutral-400">{t('contact.email')}: </span>
                <a href={`mailto:${company.email}`} className="hover:text-brand-600">{company.email}</a>
              </li>
            )}
          </ul>
          <h3 className="mt-5 text-sm font-semibold text-neutral-900">{t('footer.openingHours')}</h3>
          <p className="mt-2 whitespace-pre-line text-sm text-neutral-600">{company.openingHours}</p>
        </div>

        {/* Map */}
        <div>
          <h3 className="text-sm font-semibold text-neutral-900">{company.address}</h3>
          <div className="mt-3 overflow-hidden rounded-lg border border-neutral-200">
            <iframe
              title="Map"
              src={company.mapEmbedUrl}
              className="h-40 w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-neutral-200 py-4">
        <div className="container-page flex flex-col items-center justify-between gap-2 text-xs text-neutral-500 sm:flex-row">
          <p>© {year} {company.name}. {t('footer.rights')}</p>
          {company.facebookUrl && (
            <a href={company.facebookUrl} target="_blank" rel="noopener noreferrer" className="hover:text-brand-600">
              Facebook
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}
