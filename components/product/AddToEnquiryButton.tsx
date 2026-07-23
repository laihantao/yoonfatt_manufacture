'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useEnquiryCart } from '@/components/enquiry/EnquiryCartProvider';
import { useToast } from '@/components/ui/ToastProvider';
import type { EnquiryItem } from '@/lib/types';

export default function AddToEnquiryButton({
  item,
  className = 'btn-primary w-full',
}: {
  item: EnquiryItem;
  className?: string;
}) {
  const t = useTranslations('common');
  const { add } = useEnquiryCart();
  const toast = useToast();
  const [justAdded, setJustAdded] = useState(false);

  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        add(item);
        toast(`${item.name} — ${t('addedToEnquiry')}`);
        setJustAdded(true);
        setTimeout(() => setJustAdded(false), 1500);
      }}
    >
      {justAdded ? `✓ ${t('added')}` : t('addToEnquiry')}
    </button>
  );
}
