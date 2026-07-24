'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { articleMediaUrl } from '@/lib/storage';
import { useToast } from '@/components/ui/ToastProvider';
import Spinner from '@/components/ui/Spinner';
import ArticleBlocks from '@/components/resources/ArticleBlocks';
import { ARTICLE_CATEGORIES, type ArticleBlock } from '@/lib/types';

const LOCALES = ['en', 'ms', 'zh'] as const;
type L = (typeof LOCALES)[number];
const TAB_LABELS: Record<L, string> = { en: 'EN', ms: 'BM', zh: '中文' };
const CAT_LABELS: Record<string, string> = {
  'product-guide': 'Product Guides',
  'spare-parts': 'Spare Parts Guide',
  maintenance: 'Maintenance & Troubleshooting',
  'how-to': 'How-to & Assembly',
};

type TrState = { title: string; excerpt: string; blocks: ArticleBlock[] };

export type ArticleFormData = {
  id: string;
  slug: string;
  category: string;
  cover_path: string | null;
  is_published: boolean;
  sort_order: number;
  article_translations: { locale: string; title: string; excerpt: string | null; blocks: ArticleBlock[] }[];
} | null;

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

const emptyTr = (): TrState => ({ title: '', excerpt: '', blocks: [] });

export default function ArticleForm({ article }: { article: ArticleFormData }) {
  const router = useRouter();
  const toast = useToast();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const isEdit = !!article;

  const [slug, setSlug] = useState(article?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [category, setCategory] = useState(article?.category ?? 'product-guide');
  const [coverPath, setCoverPath] = useState<string | null>(article?.cover_path ?? null);
  const [isPublished, setIsPublished] = useState(article?.is_published ?? false);
  const [sortOrder, setSortOrder] = useState(article?.sort_order ?? 0);

  const [tab, setTab] = useState<L>('en');
  const [tr, setTr] = useState<Record<L, TrState>>(() => {
    const init: Record<L, TrState> = { en: emptyTr(), ms: emptyTr(), zh: emptyTr() };
    for (const row of article?.article_translations ?? []) {
      if (LOCALES.includes(row.locale as L)) {
        init[row.locale as L] = {
          title: row.title ?? '',
          excerpt: row.excerpt ?? '',
          blocks: Array.isArray(row.blocks) ? row.blocks : [],
        };
      }
    }
    return init;
  });

  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const current = tr[tab];
  function setCurrent(patch: Partial<TrState>) {
    setTr((prev) => ({ ...prev, [tab]: { ...prev[tab], ...patch } }));
  }
  function setBlocks(blocks: ArticleBlock[]) {
    setCurrent({ blocks });
  }

  // ── media upload to article-media bucket ──
  async function upload(file: File): Promise<string | null> {
    const safe = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]+/g, '_')}`;
    const path = `articles/${slug || 'draft'}/${safe}`;
    const { error } = await supabase.storage.from('article-media').upload(path, file, { upsert: false });
    if (error) {
      toast(`Upload failed: ${error.message}`, 'error');
      return null;
    }
    return path;
  }

  // ── block operations ──
  function addBlock(block: ArticleBlock) {
    setBlocks([...current.blocks, block]);
  }
  function updateBlock(i: number, block: ArticleBlock) {
    const next = current.blocks.slice();
    next[i] = block;
    setBlocks(next);
  }
  function removeBlock(i: number) {
    setBlocks(current.blocks.filter((_, j) => j !== i));
  }
  function moveBlock(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= current.blocks.length) return;
    const next = current.blocks.slice();
    [next[i], next[j]] = [next[j], next[i]];
    setBlocks(next);
  }

  // ── save ──
  async function save() {
    if (!tr.en.title.trim()) {
      setTab('en');
      toast('English title is required', 'error');
      return;
    }
    const finalSlug = (slug.trim() || slugify(tr.en.title)).trim();
    setSaving(true);
    try {
      const base = {
        slug: finalSlug,
        category,
        cover_path: coverPath,
        is_published: isPublished,
        sort_order: sortOrder,
      };
      let articleId = article?.id;
      if (isEdit && articleId) {
        const { error } = await supabase.from('articles').update(base).eq('id', articleId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('articles').insert(base).select('id').single();
        if (error) throw error;
        articleId = data.id;
      }

      for (const locale of LOCALES) {
        const t = tr[locale];
        const hasContent = t.title.trim() || t.excerpt.trim() || t.blocks.length > 0;
        if (locale === 'en' || hasContent) {
          const { error } = await supabase.from('article_translations').upsert(
            {
              article_id: articleId,
              locale,
              title: t.title.trim() || tr.en.title.trim(),
              excerpt: t.excerpt.trim() || null,
              body: t.blocks,
            },
            { onConflict: 'article_id,locale' },
          );
          if (error) throw error;
        } else {
          await supabase.from('article_translations').delete().eq('article_id', articleId).eq('locale', locale);
        }
      }

      toast(isEdit ? 'Article saved successfully' : 'Article created successfully');
      if (!isEdit) router.replace(`/admin/resources/${articleId}`);
      else router.refresh();
    } catch (e) {
      toast(`Save failed: ${e instanceof Error ? e.message : String(e)}`, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function deleteArticle() {
    if (!article) return;
    if (!window.confirm('Delete this article? This cannot be undone.')) return;
    const { error } = await supabase.from('articles').delete().eq('id', article.id);
    if (error) {
      toast(`Delete failed: ${error.message}`, 'error');
      return;
    }
    toast('Article deleted');
    router.push('/admin/resources');
  }

  const input =
    'w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500';
  const label = 'mb-1 block text-sm font-medium text-neutral-700';

  return (
    <div className="max-w-3xl space-y-6">
      {/* ── Basics ── */}
      <section className="rounded-lg border border-neutral-200 bg-white p-6">
        <h2 className="mb-4 font-semibold text-neutral-900">Article settings</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label}>Category</label>
            <select className={input} value={category} onChange={(e) => setCategory(e.target.value)}>
              {ARTICLE_CATEGORIES.map((c) => (
                <option key={c} value={c}>{CAT_LABELS[c]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>URL slug</label>
            <input
              className={input}
              value={slug}
              placeholder={slugify(tr.en.title) || 'auto from title'}
              onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }}
            />
          </div>
          <div>
            <label className={label}>Sort order</label>
            <input type="number" className={input} value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value) || 0)} />
          </div>
          <label className="flex items-end gap-2 pb-2 text-sm text-neutral-700">
            <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
            Published (visible on website)
          </label>
        </div>

        {/* Cover image */}
        <div className="mt-4">
          <label className={label}>Cover image</label>
          <div className="flex items-center gap-4">
            {coverPath ? (
              <div className="relative h-20 w-32 overflow-hidden rounded border border-neutral-200">
                <Image src={articleMediaUrl(coverPath)} alt="" fill sizes="128px" className="object-cover" />
                <button
                  type="button"
                  onClick={() => setCoverPath(null)}
                  className="absolute right-1 top-1 rounded bg-black/60 px-1.5 text-xs text-white"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="grid h-20 w-32 place-items-center rounded border border-dashed border-neutral-300 text-xs text-neutral-400">
                No cover
              </div>
            )}
            <label className="inline-block">
              <span className="btn-outline cursor-pointer text-sm">{uploading ? 'Uploading...' : 'Upload cover'}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  setUploading(true);
                  const p = await upload(f);
                  setUploading(false);
                  if (p) setCoverPath(p);
                }}
              />
            </label>
          </div>
        </div>
      </section>

      {/* ── Content (language tabs) ── */}
      <section className="rounded-lg border border-neutral-200 bg-white p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold text-neutral-900">Content</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPreview((p) => !p)}
              className={`rounded border px-3 py-1.5 text-xs font-semibold ${
                preview ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-neutral-200 text-neutral-600'
              }`}
            >
              {preview ? 'Editing' : 'Preview'}
            </button>
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
        </div>

        {tab !== 'en' && (
          <p className="mb-3 rounded bg-neutral-50 px-3 py-2 text-xs text-neutral-500">
            Optional — leave empty to fall back to English on the website.
          </p>
        )}

        {/* Title + excerpt */}
        <div className="space-y-3">
          <div>
            <label className={label}>Title {tab === 'en' && '*'}</label>
            <input
              className={input}
              value={current.title}
              onChange={(e) => {
                setCurrent({ title: e.target.value });
                if (tab === 'en' && !slugTouched) setSlug(slugify(e.target.value));
              }}
            />
          </div>
          <div>
            <label className={label}>Excerpt (short summary)</label>
            <textarea rows={2} className={input} value={current.excerpt} onChange={(e) => setCurrent({ excerpt: e.target.value })} />
          </div>
        </div>

        {/* Body */}
        <div className="mt-5">
          <label className={label}>Body</label>
          {preview ? (
            <div className="rounded-lg border border-neutral-200 p-4">
              {current.title && <h1 className="mb-2 text-2xl font-bold text-neutral-900">{current.title}</h1>}
              {current.excerpt && <p className="mb-4 text-lg text-neutral-600">{current.excerpt}</p>}
              {current.blocks.length ? (
                <ArticleBlocks blocks={current.blocks} />
              ) : (
                <p className="text-sm text-neutral-400">No content blocks yet.</p>
              )}
            </div>
          ) : (
            <BlockEditor
              blocks={current.blocks}
              onUpdate={updateBlock}
              onRemove={removeBlock}
              onMove={moveBlock}
              onAdd={addBlock}
              upload={upload}
              uploading={uploading}
              setUploading={setUploading}
            />
          )}
        </div>
      </section>

      {/* ── Actions ── */}
      <div className="flex items-center justify-between">
        <button type="button" onClick={save} disabled={saving} className="btn-primary disabled:opacity-60">
          {saving ? (<><Spinner className="h-4 w-4" /> Saving...</>) : isEdit ? 'Save changes' : 'Create article'}
        </button>
        {isEdit && (
          <button type="button" onClick={deleteArticle} className="btn-danger">Delete article</button>
        )}
      </div>
    </div>
  );
}

// ── Block editor ──────────────────────────────────────────────
function BlockEditor({
  blocks,
  onUpdate,
  onRemove,
  onMove,
  onAdd,
  upload,
  uploading,
  setUploading,
}: {
  blocks: ArticleBlock[];
  onUpdate: (i: number, b: ArticleBlock) => void;
  onRemove: (i: number) => void;
  onMove: (i: number, dir: -1 | 1) => void;
  onAdd: (b: ArticleBlock) => void;
  upload: (f: File) => Promise<string | null>;
  uploading: boolean;
  setUploading: (v: boolean) => void;
}) {
  const input =
    'w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500';

  return (
    <div className="space-y-3">
      {blocks.map((block, i) => (
        <div key={i} className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-neutral-400">{block.type}</span>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => onMove(i, -1)} disabled={i === 0} className="px-1.5 text-neutral-500 disabled:opacity-30">↑</button>
              <button type="button" onClick={() => onMove(i, 1)} disabled={i === blocks.length - 1} className="px-1.5 text-neutral-500 disabled:opacity-30">↓</button>
              <button type="button" onClick={() => onRemove(i)} className="px-1.5 text-red-500">✕</button>
            </div>
          </div>

          {block.type === 'heading' && (
            <input className={input} placeholder="Heading text" value={block.text} onChange={(e) => onUpdate(i, { ...block, text: e.target.value })} />
          )}
          {block.type === 'paragraph' && (
            <textarea rows={4} className={input} placeholder="Paragraph text" value={block.text} onChange={(e) => onUpdate(i, { ...block, text: e.target.value })} />
          )}
          {block.type === 'image' && (
            <ImageBlockEditor block={block} onUpdate={(b) => onUpdate(i, b)} upload={upload} uploading={uploading} setUploading={setUploading} />
          )}
          {block.type === 'gallery' && (
            <GalleryBlockEditor block={block} onUpdate={(b) => onUpdate(i, b)} upload={upload} uploading={uploading} setUploading={setUploading} />
          )}
          {block.type === 'video' && (
            <VideoBlockEditor block={block} onUpdate={(b) => onUpdate(i, b)} upload={upload} uploading={uploading} setUploading={setUploading} />
          )}
        </div>
      ))}

      {/* Add block */}
      <div className="flex flex-wrap gap-2 rounded-lg border border-dashed border-neutral-300 p-3">
        <span className="self-center text-xs text-neutral-400">Add block:</span>
        {([
          ['heading', 'Heading'],
          ['paragraph', 'Paragraph'],
          ['image', 'Image'],
          ['gallery', 'Gallery'],
          ['video', 'Video'],
        ] as const).map(([type, label]) => (
          <button
            key={type}
            type="button"
            onClick={() =>
              onAdd(
                type === 'heading' ? { type, text: '' }
                : type === 'paragraph' ? { type, text: '' }
                : type === 'image' ? { type, path: '', caption: '' }
                : type === 'gallery' ? { type, images: [] }
                : { type: 'video', provider: 'youtube', src: '' },
              )
            }
            className="rounded border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:border-brand-500 hover:text-brand-700"
          >
            + {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function UploadButton({
  accept,
  label,
  uploading,
  onFile,
}: {
  accept: string;
  label: string;
  uploading: boolean;
  onFile: (f: File) => void;
}) {
  return (
    <label className="inline-block">
      <span className="btn-outline cursor-pointer text-xs">{uploading ? 'Uploading...' : label}</span>
      <input type="file" accept={accept} className="hidden" disabled={uploading}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ''; }} />
    </label>
  );
}

function ImageBlockEditor({ block, onUpdate, upload, uploading, setUploading }: {
  block: Extract<ArticleBlock, { type: 'image' }>;
  onUpdate: (b: ArticleBlock) => void;
  upload: (f: File) => Promise<string | null>;
  uploading: boolean;
  setUploading: (v: boolean) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        {block.path ? (
          <div className="relative h-20 w-32 overflow-hidden rounded border border-neutral-200">
            <Image src={articleMediaUrl(block.path)} alt="" fill sizes="128px" className="object-cover" />
          </div>
        ) : (
          <div className="grid h-20 w-32 place-items-center rounded border border-dashed border-neutral-300 text-xs text-neutral-400">No image</div>
        )}
        <UploadButton accept="image/*" label={block.path ? 'Replace' : 'Upload image'} uploading={uploading}
          onFile={async (f) => { setUploading(true); const p = await upload(f); setUploading(false); if (p) onUpdate({ ...block, path: p }); }} />
      </div>
      <input className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" placeholder="Caption (optional)"
        value={block.caption ?? ''} onChange={(e) => onUpdate({ ...block, caption: e.target.value })} />
    </div>
  );
}

function GalleryBlockEditor({ block, onUpdate, upload, uploading, setUploading }: {
  block: Extract<ArticleBlock, { type: 'gallery' }>;
  onUpdate: (b: ArticleBlock) => void;
  upload: (f: File) => Promise<string | null>;
  uploading: boolean;
  setUploading: (v: boolean) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {block.images.map((img, i) => (
          <div key={i} className="relative h-16 w-16 overflow-hidden rounded border border-neutral-200">
            <Image src={articleMediaUrl(img.path)} alt="" fill sizes="64px" className="object-cover" />
            <button type="button" onClick={() => onUpdate({ ...block, images: block.images.filter((_, j) => j !== i) })}
              className="absolute right-0.5 top-0.5 rounded bg-black/60 px-1 text-xs text-white">✕</button>
          </div>
        ))}
      </div>
      <UploadButton accept="image/*" label="+ Add image" uploading={uploading}
        onFile={async (f) => { setUploading(true); const p = await upload(f); setUploading(false); if (p) onUpdate({ ...block, images: [...block.images, { path: p }] }); }} />
    </div>
  );
}

function VideoBlockEditor({ block, onUpdate, upload, uploading, setUploading }: {
  block: Extract<ArticleBlock, { type: 'video' }>;
  onUpdate: (b: ArticleBlock) => void;
  upload: (f: File) => Promise<string | null>;
  uploading: boolean;
  setUploading: (v: boolean) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex gap-2 text-sm">
        <label className="flex items-center gap-1">
          <input type="radio" checked={block.provider === 'youtube'} onChange={() => onUpdate({ type: 'video', provider: 'youtube', src: '' })} />
          YouTube link
        </label>
        <label className="flex items-center gap-1">
          <input type="radio" checked={block.provider === 'file'} onChange={() => onUpdate({ type: 'video', provider: 'file', src: '' })} />
          Upload file
        </label>
      </div>
      {block.provider === 'youtube' ? (
        <input className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" placeholder="https://youtube.com/watch?v=..."
          value={block.src} onChange={(e) => onUpdate({ ...block, src: e.target.value })} />
      ) : (
        <div className="flex items-center gap-3">
          {block.src ? <span className="text-xs text-brand-700">✓ Video uploaded</span> : <span className="text-xs text-neutral-400">No video</span>}
          <UploadButton accept="video/*" label={block.src ? 'Replace video' : 'Upload video'} uploading={uploading}
            onFile={async (f) => { setUploading(true); const p = await upload(f); setUploading(false); if (p) onUpdate({ ...block, src: p }); }} />
        </div>
      )}
    </div>
  );
}
