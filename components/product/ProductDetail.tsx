'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import type { Locale, Product } from '@/lib/types';
import { formatPrice } from '@/lib/format';
import { waLink } from '@/lib/whatsapp';
import { useEnquiryCart } from '@/components/enquiry/EnquiryCartProvider';
import { useToast } from '@/components/ui/ToastProvider';
import QuantityStepper from '@/components/ui/QuantityStepper';

export default function ProductDetail({
  product,
  whatsappNumber,
}: {
  product: Product;
  whatsappNumber: string;
}) {
  const t = useTranslations('product');
  const tc = useTranslations('common');
  const locale = useLocale() as Locale;
  const { add } = useEnquiryCart();
  const toast = useToast();

  const [activeImage, setActiveImage] = useState(0);
  const [variant, setVariant] = useState<string | null>(
    product.variants[0]?.label ?? null,
  );
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const cover = product.images[activeImage] ?? product.images[0];

  const waText = `${
    { en: 'Hello Yoon Fatt, I am interested in', ms: 'Salam Yoon Fatt, saya berminat dengan', zh: '您好 Yoon Fatt，我想咨询' }[locale]
  }: ${product.name}${variant ? ` (${variant})` : ''}`;

  return (
    <div className="grid gap-8 md:grid-cols-2">
      {/* Gallery */}
      <div>
        <div className="relative aspect-square overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50">
          {cover && (
            <Image
              src={cover.url}
              alt={cover.alt ?? product.name}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              priority
            />
          )}
        </div>
        {product.images.length > 1 && (
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {product.images.map((img, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveImage(i)}
                className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded border-2 ${
                  i === activeImage ? 'border-brand-600' : 'border-transparent'
                }`}
              >
                <Image src={img.url} alt={img.alt ?? ''} fill sizes="64px" className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div>
        <span className="text-sm font-medium text-brand-600">{product.categoryName}</span>
        <h1 className="mt-1 text-2xl font-bold text-neutral-900 sm:text-3xl">{product.name}</h1>
        {product.sku && (
          <p className="mt-1 text-sm text-neutral-500">{t('sku')}: {product.sku}</p>
        )}

        <div className="mt-4 text-xl font-semibold text-neutral-900">
          {product.displayPrice && product.price != null ? (
            formatPrice(product.price)
          ) : (
            <span className="text-neutral-500">{tc('enquireForPrice')}</span>
          )}
        </div>

        {product.description && (
          <p className="mt-5 whitespace-pre-line leading-relaxed text-neutral-700">
            {product.description}
          </p>
        )}

        {/* Variant selector */}
        {product.variants.length > 0 && (
          <div className="mt-6">
            <label className="mb-2 block text-sm font-medium text-neutral-700">{t('variants')}</label>
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
        )}

        {/* Quantity */}
        <div className="mt-6">
          <label className="mb-2 block text-sm font-medium text-neutral-700">{t('quantity')}</label>
          <QuantityStepper value={quantity} onChange={setQuantity} />
        </div>

        {/* CTAs */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            className="btn-primary flex-1"
            onClick={() => {
              add({ slug: product.slug, name: product.name, variant, quantity });
              toast(`${product.name}${variant ? ` (${variant})` : ''} × ${quantity} — ${tc('addedToEnquiry')}`);
              setJustAdded(true);
              setTimeout(() => setJustAdded(false), 1500);
            }}
          >
            {justAdded ? `✓ ${tc('added')}` : tc('addToEnquiry')}
          </button>
          <a
            href={waLink(whatsappNumber, waText)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-whatsapp flex-1"
          >
            {t('whatsappAboutThis')}
          </a>
        </div>

        {/* Specs */}
        {product.specs.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-3 text-lg font-semibold text-neutral-900">{t('specifications')}</h2>
            <table className="w-full text-sm">
              <tbody>
                {product.specs.map((s, i) => (
                  <tr key={i} className="border-b border-neutral-100">
                    <td className="py-2 pr-4 font-medium text-neutral-600">{s.label}</td>
                    <td className="py-2 text-neutral-900">{s.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
