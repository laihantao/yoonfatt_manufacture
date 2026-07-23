'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/ToastProvider';
import Spinner from '@/components/ui/Spinner';

const LOCALES = ['en', 'ms', 'zh'] as const;
type L = (typeof LOCALES)[number];
const TAB_LABELS: Record<L, string> = { en: 'EN name *', ms: 'BM name', zh: '中文 name' };

export type CategoryRow = {
  id: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  names: Record<L, string>;
  productCount: number;
  activeProductCount: number;
};

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

const input =
  'w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500';

type EditState = {
  id: string | null; // null = creating new
  slug: string;
  sortOrder: number;
  isActive: boolean;
  names: Record<L, string>;
};

const emptyEdit = (nextSort: number): EditState => ({
  id: null,
  slug: '',
  sortOrder: nextSort,
  isActive: true,
  names: { en: '', ms: '', zh: '' },
});

export default function CategoriesManager({ categories }: { categories: CategoryRow[] }) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const toast = useToast();
  const router = useRouter();

  const [edit, setEdit] = useState<EditState | null>(null);
  const [busy, setBusy] = useState<string | null>(null); // category id or 'save'

  function startEdit(c: CategoryRow) {
    setEdit({ id: c.id, slug: c.slug, sortOrder: c.sortOrder, isActive: c.isActive, names: { ...c.names } });
  }

  async function save() {
    if (!edit) return;
    if (!edit.names.en.trim()) {
      toast('English name is required', 'error');
      return;
    }
    const slug = edit.slug.trim() || slugify(edit.names.en);
    setBusy('save');
    try {
      let categoryId = edit.id;
      if (categoryId) {
        const { error } = await supabase
          .from('categories')
          .update({ slug, sort_order: edit.sortOrder, is_active: edit.isActive })
          .eq('id', categoryId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('categories')
          .insert({ slug, sort_order: edit.sortOrder, is_active: edit.isActive })
          .select('id')
          .single();
        if (error) throw error;
        categoryId = data.id;
      }
      for (const locale of LOCALES) {
        const name = edit.names[locale].trim();
        if (name) {
          const { error } = await supabase
            .from('category_translations')
            .upsert({ category_id: categoryId, locale, name }, { onConflict: 'category_id,locale' });
          if (error) throw error;
        } else if (locale !== 'en') {
          await supabase
            .from('category_translations')
            .delete()
            .eq('category_id', categoryId)
            .eq('locale', locale);
        }
      }
      toast(edit.id ? 'Category saved successfully' : 'Category created successfully');
      setEdit(null);
      router.refresh();
    } catch (e) {
      toast(`Save failed: ${e instanceof Error ? e.message : String(e)}`, 'error');
    } finally {
      setBusy(null);
    }
  }

  async function toggleActive(c: CategoryRow) {
    setBusy(c.id);
    const { error } = await supabase
      .from('categories')
      .update({ is_active: !c.isActive })
      .eq('id', c.id);
    setBusy(null);
    if (error) {
      toast(`Update failed: ${error.message}`, 'error');
      return;
    }
    toast(c.isActive ? `"${c.names.en}" set to inactive` : `"${c.names.en}" set to active`);
    router.refresh();
  }

  async function remove(c: CategoryRow) {
    // Guard: never delete a category that still has products bound to it.
    if (c.productCount > 0) {
      toast(
        `Cannot delete "${c.names.en}" — ${c.productCount} product(s) still use this category (${c.activeProductCount} active). Reassign them first.`,
        'error',
      );
      return;
    }
    if (!window.confirm(`Delete category "${c.names.en}"? This cannot be undone.`)) return;

    setBusy(c.id);
    // Re-verify on the live data in case products changed since page load.
    const { count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', c.id);
    if ((count ?? 0) > 0) {
      setBusy(null);
      toast(`Cannot delete — ${count} product(s) are using this category.`, 'error');
      return;
    }
    const { error } = await supabase.from('categories').delete().eq('id', c.id);
    setBusy(null);
    if (error) {
      toast(`Delete failed: ${error.message}`, 'error');
      return;
    }
    toast('Category deleted');
    router.refresh();
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          className="btn-primary"
          onClick={() => setEdit(emptyEdit(categories.length + 1))}
        >
          + Add category
        </button>
      </div>

      {/* Edit / create form */}
      {edit && (
        <div className="mb-6 rounded-lg border border-brand-200 bg-white p-5">
          <h2 className="mb-4 font-semibold text-neutral-900">
            {edit.id ? 'Edit category' : 'New category'}
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {LOCALES.map((l) => (
              <div key={l}>
                <label className="mb-1 block text-sm font-medium text-neutral-700">{TAB_LABELS[l]}</label>
                <input
                  className={input}
                  value={edit.names[l]}
                  onChange={(e) => {
                    const names = { ...edit.names, [l]: e.target.value };
                    setEdit({
                      ...edit,
                      names,
                      // Auto-slug for new categories while untouched
                      slug: edit.id || edit.slug ? edit.slug : slugify(l === 'en' ? e.target.value : edit.names.en),
                    });
                  }}
                />
              </div>
            ))}
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">URL slug</label>
              <input
                className={input}
                value={edit.slug}
                placeholder={slugify(edit.names.en) || 'auto'}
                onChange={(e) => setEdit({ ...edit, slug: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">Sort order</label>
              <input
                type="number"
                className={input}
                value={edit.sortOrder}
                onChange={(e) => setEdit({ ...edit, sortOrder: Number(e.target.value) || 0 })}
              />
            </div>
            <label className="flex items-end gap-2 pb-2 text-sm text-neutral-700">
              <input
                type="checkbox"
                checked={edit.isActive}
                onChange={(e) => setEdit({ ...edit, isActive: e.target.checked })}
              />
              Active (visible on website)
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={save} disabled={busy === 'save'} className="btn-primary disabled:opacity-60">
              {busy === 'save' ? (
                <>
                  <Spinner className="h-4 w-4" /> Saving...
                </>
              ) : (
                'Save category'
              )}
            </button>
            <button type="button" onClick={() => setEdit(null)} className="btn-outline">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Products</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {categories.map((c) => (
              <tr key={c.id} className="hover:bg-neutral-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-neutral-900">{c.names.en}</div>
                  <div className="text-xs text-neutral-400">
                    {c.slug}
                    {c.names.ms && ` · ${c.names.ms}`}
                    {c.names.zh && ` · ${c.names.zh}`}
                  </div>
                </td>
                <td className="px-4 py-3 text-neutral-600">
                  {c.productCount}
                  {c.productCount > 0 && (
                    <span className="text-xs text-neutral-400"> ({c.activeProductCount} active)</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                      c.isActive ? 'bg-brand-100 text-brand-700' : 'bg-neutral-100 text-neutral-400'
                    }`}
                  >
                    {c.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-3">
                    {busy === c.id ? (
                      <Spinner className="h-4 w-4 text-brand-600" />
                    ) : (
                      <>
                        <button type="button" onClick={() => startEdit(c)} className="font-medium text-brand-700 hover:underline">
                          Edit
                        </button>
                        <button type="button" onClick={() => toggleActive(c)} className="text-neutral-500 hover:underline">
                          {c.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(c)}
                          disabled={c.productCount > 0}
                          title={
                            c.productCount > 0
                              ? `${c.productCount} product(s) still use this category`
                              : 'Delete category'
                          }
                          className={`${
                            c.productCount > 0
                              ? 'cursor-not-allowed text-neutral-300'
                              : 'text-red-600 hover:underline'
                          }`}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
