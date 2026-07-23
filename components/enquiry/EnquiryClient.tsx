'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { Locale, Product } from '@/lib/types';
import { buildEnquiryMessage, waLink } from '@/lib/whatsapp';
import { formatPrice } from '@/lib/format';
import { useEnquiryCart } from './EnquiryCartProvider';
import ImageCarousel from '@/components/ui/ImageCarousel';
import QuantityStepper from '@/components/ui/QuantityStepper';
import Spinner from '@/components/ui/Spinner';

export default function EnquiryClient({ whatsappNumber }: { whatsappNumber: string }) {
  const t = useTranslations('enquiry');
  const tp = useTranslations('product');
  const locale = useLocale() as Locale;
  const { items, add, setLineQuantity, removeLine, removeProduct, clear, ready } = useEnquiryCart();

  const [form, setForm] = useState({
    name: '',
    company: '',
    country: '',
    destination: '',
    remarks: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // ── Enrich cart lines with full product data (images, variants, price) ──
  const slugKey = useMemo(
    () => [...new Set(items.map((it) => it.slug))].sort().join(','),
    [items],
  );
  const [enriched, setEnriched] = useState<Map<string, Product>>(new Map());
  const [enriching, setEnriching] = useState(false);

  useEffect(() => {
    if (!slugKey) return;
    let cancelled = false;
    setEnriching(true);
    fetch(`/api/products?slugs=${encodeURIComponent(slugKey)}&locale=${locale}`)
      .then((r) => r.json())
      .then((data: { products: Product[] }) => {
        if (cancelled) return;
        setEnriched(new Map(data.products.map((p) => [p.slug, p])));
      })
      .catch(() => {
        // Enrichment is progressive enhancement — cart still works without it.
      })
      .finally(() => !cancelled && setEnriching(false));
    return () => {
      cancelled = true;
    };
  }, [slugKey, locale]);

  // Group lines per product, keeping first-added order.
  const groups = useMemo(() => {
    const order: string[] = [];
    const bySlug = new Map<string, typeof items>();
    for (const it of items) {
      if (!bySlug.has(it.slug)) {
        bySlug.set(it.slug, []);
        order.push(it.slug);
      }
      bySlug.get(it.slug)!.push(it);
    }
    return order.map((slug) => ({ slug, lines: bySlug.get(slug)! }));
  }, [items]);

  const formValid = form.name.trim() && form.country.trim() && form.destination.trim();

  async function record(channel: 'whatsapp' | 'email') {
    return fetch('/api/enquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        company: form.company || null,
        country: form.country,
        destination: form.destination,
        remarks: form.remarks || null,
        items,
        channel,
        locale,
      }),
    });
  }

  async function sendWhatsApp() {
    if (!formValid) return;
    setSubmitting(true);
    await record('whatsapp').catch(() => {});
    const text = buildEnquiryMessage(locale, items, form);
    window.open(waLink(whatsappNumber, text), '_blank', 'noopener');
    setSubmitting(false);
    setDone(true);
    clear();
  }

  async function sendEmail() {
    if (!formValid) return;
    setSubmitting(true);
    await record('email').catch(() => {});
    setSubmitting(false);
    setDone(true);
    clear();
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg rounded-lg border border-brand-200 bg-brand-50 p-8 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-brand-600 text-xl text-white">✓</div>
        <h2 className="mt-4 text-lg font-bold text-brand-800">{t('successTitle')}</h2>
        <p className="mt-2 text-sm text-neutral-600">{t('successBody')}</p>
        <Link href="/products" className="mt-6 inline-block btn-primary">{t('successCta')}</Link>
      </div>
    );
  }

  if (ready && items.length === 0) {
    return (
      <div className="mx-auto max-w-lg rounded-lg border border-dashed border-neutral-300 p-12 text-center">
        <p className="text-neutral-600">{t('empty')}</p>
        <Link href="/products" className="mt-4 inline-block btn-primary">{t('emptyCta')}</Link>
      </div>
    );
  }

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[1fr_380px]">
      {/* ── Product cards ── */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-neutral-900">{t('cartTitle')}</h2>
        <div className="space-y-4">
          {groups.map(({ slug, lines }) => {
            const product = enriched.get(slug);
            const selectedVariants = new Set(lines.map((l) => l.variant ?? null));
            const unselected =
              product?.variants.filter((v) => !selectedVariants.has(v.label)) ?? [];
            const name = product?.name ?? lines[0].name;

            return (
              <div key={slug} className="rounded-lg border border-neutral-200 bg-white p-4">
                <div className="flex gap-4">
                  {/* Image */}
                  <Link href={`/products/${slug}`} className="block flex-shrink-0">
                    {product ? (
                      <ImageCarousel
                        images={product.images}
                        alt={name}
                        sizes="112px"
                        className="h-24 w-24 rounded-md border border-neutral-200 bg-neutral-50 sm:h-28 sm:w-28"
                      />
                    ) : (
                      <div className="grid h-24 w-24 place-items-center rounded-md border border-neutral-200 bg-neutral-50 sm:h-28 sm:w-28">
                        {enriching ? <Spinner className="h-5 w-5 text-neutral-300" /> : null}
                      </div>
                    )}
                  </Link>

                  {/* Details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link
                          href={`/products/${slug}`}
                          className="font-semibold text-neutral-900 hover:text-brand-700"
                        >
                          {name}
                        </Link>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                          {product?.categoryName && (
                            <span className="rounded bg-brand-50 px-1.5 py-0.5 text-brand-700">
                              {product.categoryName}
                            </span>
                          )}
                          {product?.displayPrice && product.price != null && (
                            <span className="font-medium text-neutral-700">{formatPrice(product.price)}</span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        aria-label={t('remove')}
                        onClick={() => removeProduct(slug)}
                        className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-full text-neutral-400 hover:bg-red-50 hover:text-red-600"
                        title={t('remove')}
                      >
                        ✕
                      </button>
                    </div>

                    {/* Selected lines (one per variant) */}
                    <div className="mt-3 space-y-2">
                      {lines.map((line) => (
                        <div
                          key={line.variant ?? '_novariant'}
                          className="flex flex-wrap items-center gap-3 rounded-md bg-neutral-50 px-3 py-2"
                        >
                          {line.variant ? (
                            <span className="min-w-16 text-sm font-medium text-neutral-800">{line.variant}</span>
                          ) : (
                            product && product.variants.length === 0 ? null : (
                              <span className="min-w-16 text-sm text-neutral-400">—</span>
                            )
                          )}
                          <QuantityStepper
                            size="sm"
                            value={line.quantity}
                            onChange={(q) => setLineQuantity(slug, line.variant ?? null, q)}
                          />
                          {lines.length > 1 || product?.variants.length ? (
                            <button
                              type="button"
                              onClick={() => removeLine(slug, line.variant ?? null)}
                              className="ml-auto text-xs text-red-500 hover:underline"
                            >
                              {t('remove')}
                            </button>
                          ) : null}
                        </div>
                      ))}
                    </div>

                    {/* Add another variant of the same product */}
                    {unselected.length > 0 && (
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="text-xs text-neutral-400">{tp('variants')}:</span>
                        {unselected.map((v) => (
                          <button
                            key={v.label}
                            type="button"
                            onClick={() => add({ slug, name, variant: v.label, quantity: 1 })}
                            className="rounded-md border border-dashed border-neutral-300 px-2.5 py-1 text-xs text-neutral-600 hover:border-brand-500 hover:text-brand-700"
                          >
                            + {v.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Form ── */}
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-neutral-900">{t('formTitle')}</h2>
        <div className="space-y-3">
          <Field label={t('name')} required value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <Field label={t('companyOptional')} value={form.company} onChange={(v) => setForm({ ...form, company: v })} />
          <Field label={t('country')} required value={form.country} onChange={(v) => setForm({ ...form, country: v })} />
          <Field label={t('destination')} required value={form.destination} onChange={(v) => setForm({ ...form, destination: v })} />
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">{t('remarksOptional')}</label>
            <textarea
              rows={3}
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>

        <div className="mt-5 space-y-2">
          <button type="button" disabled={!formValid || submitting} onClick={sendWhatsApp} className="btn-whatsapp w-full disabled:opacity-50">
            {submitting ? t('sending') : t('sendViaWhatsapp')}
          </button>
          <button type="button" disabled={!formValid || submitting} onClick={sendEmail} className="btn-outline w-full disabled:opacity-50">
            {submitting ? t('sending') : t('sendViaEmail')}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-neutral-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      />
    </div>
  );
}
