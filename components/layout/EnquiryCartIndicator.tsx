'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useEnquiryCart } from '@/components/enquiry/EnquiryCartProvider';

export default function EnquiryCartIndicator() {
  const t = useTranslations('enquiry');
  const { count, ready } = useEnquiryCart();

  return (
    <Link
      href="/enquiry"
      className="relative flex items-center gap-1.5 rounded bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-700 hover:bg-brand-100"
    >
      <span aria-hidden>🛒</span>
      <span className="hidden sm:inline">{t('cartIndicator')}</span>
      {ready && count > 0 && (
        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand-600 px-1 text-xs text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
