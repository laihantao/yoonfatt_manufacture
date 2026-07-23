'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useEnquiryCart } from '@/components/enquiry/EnquiryCartProvider';
import { useToast } from '@/components/ui/ToastProvider';
import QuantityStepper from '@/components/ui/QuantityStepper';
import type { Product } from '@/lib/types';

/**
 * Consistent "Add to Enquiry" for product cards:
 * - product WITHOUT variants → adds directly (qty 1)
 * - product WITH variants → opens a quick-add sheet to pick the variant
 *   and quantity first (same information as the detail page), so a card
 *   add is never less specific than a detail-page add.
 */
export default function QuickAddButton({
  product,
  className = 'btn-primary w-full text-xs',
}: {
  product: Product;
  className?: string;
}) {
  const t = useTranslations();
  const { add } = useEnquiryCart();
  const toast = useToast();

  const [open, setOpen] = useState(false);
  const [variant, setVariant] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  const hasVariants = product.variants.length > 0;
  const cover = product.images[0];

  function directAdd() {
    add({ slug: product.slug, name: product.name, variant: null, quantity: 1 });
    toast(`${product.name} — ${t('common.addedToEnquiry')}`);
  }

  function confirmAdd() {
    if (!variant) return;
    add({ slug: product.slug, name: product.name, variant, quantity });
    toast(`${product.name} (${variant}) × ${quantity} — ${t('common.addedToEnquiry')}`);
    setOpen(false);
    setVariant(null);
    setQuantity(1);
  }

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (hasVariants) setOpen(true);
          else directAdd();
        }}
      >
        {t('common.addToEnquiry')}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen(false);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-md rounded-t-2xl bg-white p-5 sm:rounded-2xl"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <div className="flex items-start gap-3">
              {cover && (
                <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-neutral-200">
                  <Image src={cover.url} alt={cover.alt ?? product.name} fill sizes="64px" className="object-cover" />
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-neutral-900">{product.name}</h3>
                <p className="text-xs text-neutral-500">{product.categoryName}</p>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full text-neutral-400 hover:bg-neutral-100"
              >
                ✕
              </button>
            </div>

            <div className="mt-4">
              <p className="mb-2 text-sm font-medium text-neutral-700">{t('product.selectVariant')}</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v.label}
                    type="button"
                    onClick={() => setVariant(v.label)}
                    className={`rounded-md border px-4 py-2 text-sm font-medium ${
                      variant === v.label
                        ? 'border-brand-600 bg-brand-50 text-brand-700'
                        : 'border-neutral-300 text-neutral-700 hover:border-neutral-400'
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <p className="mb-2 text-sm font-medium text-neutral-700">{t('product.quantity')}</p>
              <QuantityStepper value={quantity} onChange={setQuantity} />
            </div>

            <button
              type="button"
              disabled={!variant}
              onClick={confirmAdd}
              className="btn-primary mt-5 w-full disabled:opacity-50"
            >
              {t('common.addToEnquiry')}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
