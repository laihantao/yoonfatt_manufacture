'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { publicImageUrl } from '@/lib/storage';
import { useToast } from '@/components/ui/ToastProvider';
import ImageLightbox from '@/components/ui/ImageLightbox';
import Spinner from '@/components/ui/Spinner';

const LOCALES = ['en', 'ms', 'zh'] as const;
type L = (typeof LOCALES)[number];
const TAB_LABELS: Record<L, string> = { en: 'EN', ms: 'BM', zh: '中文' };

type Spec = { label: string; value: string };
type TrState = { name: string; description: string; specs: Spec[] };
type VariantState = { label: string; sku: string };
type ImageRow = { id: string; storage_path: string; alt: string | null; sort_order: number };

export type ProductFormData = {
  id: string;
  slug: string;
  sku: string | null;
  category_id: string | null;
  price: number | null;
  display_price: boolean;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  product_translations: { locale: string; name: string; description: string | null; specs: Spec[] | null }[];
  product_variants: { label: string; sku: string | null; sort_order: number }[];
  product_images: ImageRow[];
} | null;

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const emptyTr = (): TrState => ({ name: '', description: '', specs: [] });

export default function ProductForm({
  categories,
  product,
}: {
  categories: { id: string; name: string }[];
  product: ProductFormData;
}) {
  const router = useRouter();
  const toast = useToast();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const isEdit = !!product;

  // ── form state ──
  const [slug, setSlug] = useState(product?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [sku, setSku] = useState(product?.sku ?? '');
  const [categoryId, setCategoryId] = useState(product?.category_id ?? categories[0]?.id ?? '');
  const [price, setPrice] = useState(product?.price != null ? String(product.price) : '');
  const [displayPrice, setDisplayPrice] = useState(product?.display_price ?? false);
  const [isActive, setIsActive] = useState(product?.is_active ?? true);
  const [isFeatured, setIsFeatured] = useState(product?.is_featured ?? false);
  const [sortOrder, setSortOrder] = useState(product?.sort_order ?? 0);

  const [tab, setTab] = useState<L>('en');
  const [tr, setTr] = useState<Record<L, TrState>>(() => {
    const init: Record<L, TrState> = { en: emptyTr(), ms: emptyTr(), zh: emptyTr() };
    for (const row of product?.product_translations ?? []) {
      if (LOCALES.includes(row.locale as L)) {
        init[row.locale as L] = {
          name: row.name ?? '',
          description: row.description ?? '',
          specs: (row.specs as Spec[]) ?? [],
        };
      }
    }
    return init;
  });

  const [variants, setVariants] = useState<VariantState[]>(
    (product?.product_variants ?? [])
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((v) => ({ label: v.label, sku: v.sku ?? '' })),
  );

  const [images, setImages] = useState<ImageRow[]>(
    (product?.product_images ?? []).slice().sort((a, b) => a.sort_order - b.sort_order),
  );

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  function setTrField(locale: L, patch: Partial<TrState>) {
    setTr((prev) => ({ ...prev, [locale]: { ...prev[locale], ...patch } }));
  }

  // ── save ──
  async function save() {
    setError(null);
    setNotice(null);
    if (!tr.en.name.trim()) {
      setError('English name is required.');
      setTab('en');
      return;
    }
    if (!slug.trim()) {
      setError('Slug is required.');
      return;
    }
    setSaving(true);
    try {
      const base = {
        slug: slug.trim(),
        sku: sku.trim() || null,
        category_id: categoryId || null,
        price: price.trim() === '' ? null : Number(price),
        display_price: displayPrice,
        is_active: isActive,
        is_featured: isFeatured,
        sort_order: sortOrder,
      };

      let productId = product?.id;
      if (isEdit && productId) {
        const { error } = await supabase.from('products').update(base).eq('id', productId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('products').insert(base).select('id').single();
        if (error) throw error;
        productId = data.id;
      }

      // Translations: EN always saved. BM/ZH saved only if any field filled,
      // otherwise removed so the storefront falls back to English.
      for (const locale of LOCALES) {
        const t = tr[locale];
        const hasContent = t.name.trim() || t.description.trim() || t.specs.length > 0;
        if (locale === 'en' || hasContent) {
          const { error } = await supabase.from('product_translations').upsert(
            {
              product_id: productId,
              locale,
              name: t.name.trim() || tr.en.name.trim(),
              description: t.description.trim() || null,
              specs: t.specs.filter((s) => s.label.trim() || s.value.trim()),
            },
            { onConflict: 'product_id,locale' },
          );
          if (error) throw error;
        } else {
          await supabase.from('product_translations').delete().eq('product_id', productId).eq('locale', locale);
        }
      }

      // Variants: replace wholesale (simple + idempotent).
      {
        const { error } = await supabase.from('product_variants').delete().eq('product_id', productId);
        if (error) throw error;
        const rows = variants
          .filter((v) => v.label.trim())
          .map((v, i) => ({ product_id: productId, label: v.label.trim(), sku: v.sku.trim() || null, sort_order: i }));
        if (rows.length) {
          const { error } = await supabase.from('product_variants').insert(rows);
          if (error) throw error;
        }
      }

      if (!isEdit) {
        toast('Product created — you can now add images below');
        router.replace(`/admin/products/${productId}`);
        return;
      }
      toast('Product saved successfully');
      setNotice('Saved.');
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      toast(`Save failed: ${msg}`, 'error');
    } finally {
      setSaving(false);
    }
  }

  // ── images ──
  async function uploadFiles(files: FileList | null) {
    if (!files || !product) return;
    setUploading(true);
    setError(null);
    try {
      let nextOrder = images.length ? Math.max(...images.map((i) => i.sort_order)) + 1 : 0;
      for (const file of Array.from(files)) {
        const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]+/g, '_')}`;
        const path = `products/${slug}/${safeName}`;
        const { error: upErr } = await supabase.storage.from('product-images').upload(path, file, {
          cacheControl: '3600',
          upsert: false,
        });
        if (upErr) throw upErr;
        const { data, error } = await supabase
          .from('product_images')
          .insert({ product_id: product.id, storage_path: path, alt: tr.en.name || slug, sort_order: nextOrder++ })
          .select('id, storage_path, alt, sort_order')
          .single();
        if (error) throw error;
        setImages((prev) => [...prev, data as ImageRow]);
      }
      toast(`${files.length} image${files.length > 1 ? 's' : ''} uploaded successfully`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      toast(`Upload failed: ${msg}`, 'error');
    } finally {
      setUploading(false);
    }
  }

  async function deleteImage(img: ImageRow) {
    setError(null);
    const { error } = await supabase.from('product_images').delete().eq('id', img.id);
    if (error) {
      setError(error.message);
      toast(`Delete failed: ${error.message}`, 'error');
      return;
    }
    // Best-effort storage cleanup (seed rows store full URLs — skip those).
    if (!/^https?:\/\//.test(img.storage_path)) {
      await supabase.storage.from('product-images').remove([img.storage_path]);
    }
    setImages((prev) => prev.filter((i) => i.id !== img.id));
    toast('Image deleted');
  }

  async function deleteProduct() {
    if (!product) return;
    if (!window.confirm('Delete this product? This cannot be undone.')) return;
    setError(null);
    // Best-effort storage cleanup first.
    const paths = images.map((i) => i.storage_path).filter((p) => !/^https?:\/\//.test(p));
    if (paths.length) await supabase.storage.from('product-images').remove(paths);
    const { error } = await supabase.from('products').delete().eq('id', product.id);
    if (error) {
      setError(error.message);
      toast(`Delete failed: ${error.message}`, 'error');
      return;
    }
    toast('Product deleted');
    router.push('/admin/products');
  }

  const input =
    'w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500';
  const label = 'mb-1 block text-sm font-medium text-neutral-700';

  return (
    <div className="max-w-3xl space-y-6">
      {(error || notice) && (
        <div
          className={`rounded-md px-4 py-3 text-sm ${
            error ? 'bg-red-50 text-red-700' : 'bg-brand-50 text-brand-700'
          }`}
        >
          {error ?? notice}
        </div>
      )}

      {/* ── Basics ── */}
      <section className="rounded-lg border border-neutral-200 bg-white p-6">
        <h2 className="mb-4 font-semibold text-neutral-900">Basics</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label}>URL slug *</label>
            <input
              className={input}
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugTouched(true);
              }}
            />
            <p className="mt-1 text-xs text-neutral-400">
              The product&apos;s web address: /products/<span className="font-mono">{slug || '...'}</span>.
              Auto-generated from the English name (set in Content below).
            </p>
          </div>
          <div>
            <label className={label}>SKU</label>
            <input className={input} value={sku} onChange={(e) => setSku(e.target.value)} />
          </div>
          <div>
            <label className={label}>Category</label>
            <select className={input} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Sort order</label>
            <input
              type="number"
              className={input}
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className={label}>Price (RM)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className={input}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Leave empty if no price"
            />
          </div>
          <div className="flex flex-col justify-end gap-2 pb-1">
            <label className="flex items-center gap-2 text-sm text-neutral-700">
              <input type="checkbox" checked={displayPrice} onChange={(e) => setDisplayPrice(e.target.checked)} />
              Show price on website (otherwise “Enquire for price”)
            </label>
            <label className="flex items-center gap-2 text-sm text-neutral-700">
              <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
              Featured on home page
            </label>
            <label className="flex items-center gap-2 text-sm text-neutral-700">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              Active (visible on website)
            </label>
          </div>
        </div>
      </section>

      {/* ── Content (language tabs) ── */}
      <section className="rounded-lg border border-neutral-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-neutral-900">Content</h2>
          <div className="flex rounded border border-neutral-200 text-xs font-semibold">
            {LOCALES.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setTab(l)}
                className={`px-3 py-1.5 ${tab === l ? 'bg-brand-600 text-white' : 'text-neutral-600 hover:bg-neutral-100'}`}
              >
                {TAB_LABELS[l]}
              </button>
            ))}
          </div>
        </div>
        {tab !== 'en' && (
          <p className="mb-3 rounded bg-neutral-50 px-3 py-2 text-xs text-neutral-500">
            Optional — empty fields fall back to English on the website.
          </p>
        )}
        <div className="space-y-4">
          <div>
            <label className={label}>Name {tab === 'en' && '*'}</label>
            <input
              className={input}
              value={tr[tab].name}
              onChange={(e) => {
                setTrField(tab, { name: e.target.value });
                if (tab === 'en' && !slugTouched) setSlug(slugify(e.target.value));
              }}
            />
          </div>
          <div>
            <label className={label}>Description</label>
            <textarea
              rows={4}
              className={input}
              value={tr[tab].description}
              onChange={(e) => setTrField(tab, { description: e.target.value })}
            />
          </div>
          <div>
            <label className={label}>Specifications</label>
            <div className="space-y-2">
              {tr[tab].specs.map((s, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    className={input}
                    placeholder="Label (e.g. Material)"
                    value={s.label}
                    onChange={(e) => {
                      const specs = tr[tab].specs.slice();
                      specs[i] = { ...specs[i], label: e.target.value };
                      setTrField(tab, { specs });
                    }}
                  />
                  <input
                    className={input}
                    placeholder="Value (e.g. Brass)"
                    value={s.value}
                    onChange={(e) => {
                      const specs = tr[tab].specs.slice();
                      specs[i] = { ...specs[i], value: e.target.value };
                      setTrField(tab, { specs });
                    }}
                  />
                  <button
                    type="button"
                    className="px-2 text-red-500 hover:underline"
                    onClick={() => setTrField(tab, { specs: tr[tab].specs.filter((_, j) => j !== i) })}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="text-sm font-medium text-brand-700 hover:underline"
                onClick={() => setTrField(tab, { specs: [...tr[tab].specs, { label: '', value: '' }] })}
              >
                + Add spec row
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Variants ── */}
      <section className="rounded-lg border border-neutral-200 bg-white p-6">
        <h2 className="mb-1 font-semibold text-neutral-900">Variants</h2>
        <p className="mb-4 text-xs text-neutral-500">Language-neutral options like “14L”, “16L”. Leave empty if none.</p>
        <div className="space-y-2">
          {variants.map((v, i) => (
            <div key={i} className="flex gap-2">
              <input
                className={input}
                placeholder="Label (e.g. 16L)"
                value={v.label}
                onChange={(e) => {
                  const next = variants.slice();
                  next[i] = { ...next[i], label: e.target.value };
                  setVariants(next);
                }}
              />
              <input
                className={input}
                placeholder="SKU (optional)"
                value={v.sku}
                onChange={(e) => {
                  const next = variants.slice();
                  next[i] = { ...next[i], sku: e.target.value };
                  setVariants(next);
                }}
              />
              <button
                type="button"
                className="px-2 text-red-500 hover:underline"
                onClick={() => setVariants(variants.filter((_, j) => j !== i))}
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            className="text-sm font-medium text-brand-700 hover:underline"
            onClick={() => setVariants([...variants, { label: '', sku: '' }])}
          >
            + Add variant
          </button>
        </div>
      </section>

      {/* ── Images ── */}
      <section className="rounded-lg border border-neutral-200 bg-white p-6">
        <h2 className="mb-1 font-semibold text-neutral-900">Images</h2>
        {!isEdit ? (
          <p className="text-sm text-neutral-500">Save the product first, then add images here.</p>
        ) : (
          <>
            <p className="mb-4 text-xs text-neutral-500">
              First image is the cover. Click an image to preview. Uploads go to Supabase Storage.
            </p>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
              {images.map((img, i) => (
                <div key={img.id} className="group relative aspect-square overflow-hidden rounded border border-neutral-200">
                  <button
                    type="button"
                    className="absolute inset-0 cursor-zoom-in"
                    onClick={() => setLightboxIndex(i)}
                    aria-label="Preview image"
                  >
                    <Image src={publicImageUrl(img.storage_path)} alt={img.alt ?? ''} fill sizes="120px" className="object-cover" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteImage(img)}
                    className="absolute right-1 top-1 hidden rounded bg-black/60 px-1.5 py-0.5 text-xs text-white group-hover:block"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            {lightboxIndex !== null && (
              <ImageLightbox
                images={images.map((im) => ({ url: publicImageUrl(im.storage_path), alt: im.alt }))}
                index={lightboxIndex}
                onClose={() => setLightboxIndex(null)}
                onNavigate={setLightboxIndex}
              />
            )}
            <label className="mt-4 inline-block">
              <span className="btn-outline cursor-pointer">
                {uploading ? (
                  <>
                    <Spinner className="h-4 w-4" /> Uploading...
                  </>
                ) : (
                  '+ Upload images'
                )}
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                disabled={uploading}
                onChange={(e) => uploadFiles(e.target.files)}
              />
            </label>
          </>
        )}
      </section>

      {/* ── Actions ── */}
      <div className="flex items-center justify-between">
        <button type="button" onClick={save} disabled={saving} className="btn-primary disabled:opacity-60">
          {saving ? (
            <>
              <Spinner className="h-4 w-4" /> Saving...
            </>
          ) : isEdit ? (
            'Save changes'
          ) : (
            'Create product'
          )}
        </button>
        {isEdit && (
          <button type="button" onClick={deleteProduct} className="btn-danger">
            Delete product
          </button>
        )}
      </div>
    </div>
  );
}
