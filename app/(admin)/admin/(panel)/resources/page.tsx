import Link from 'next/link';
import Image from 'next/image';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { articleMediaUrl } from '@/lib/storage';

/* eslint-disable @typescript-eslint/no-explicit-any */
const CAT_LABELS: Record<string, string> = {
  'product-guide': 'Product Guides',
  'spare-parts': 'Spare Parts Guide',
  maintenance: 'Maintenance & Troubleshooting',
  'how-to': 'How-to & Assembly',
};

function enTitle(rows: any[] | undefined, fallback: string) {
  return (rows ?? []).find((r) => r.locale === 'en')?.title ?? fallback;
}

export default async function AdminResourcesPage() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('articles')
    .select('id, slug, category, cover_path, is_published, sort_order, article_translations ( locale, title )')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  const articles = data ?? [];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">Resources</h1>
        <Link href="/admin/resources/new" className="btn-primary">+ Add article</Link>
      </div>
      <p className="mt-1 text-sm text-neutral-500">Guides, spare-part references and maintenance articles for the public site.</p>

      {error && (
        <p className="mt-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          {error.message}
          {/relation .* does not exist/i.test(error.message) &&
            ' — run supabase/migrations/0002_articles.sql in the Supabase SQL editor first.'}
        </p>
      )}

      <div className="mt-6 overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-4 py-3">Article</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {articles.map((a: any) => (
              <tr key={a.id} className="hover:bg-neutral-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-16 flex-shrink-0 overflow-hidden rounded bg-neutral-100">
                      {a.cover_path && (
                        <Image src={articleMediaUrl(a.cover_path)} alt="" fill sizes="64px" className="object-cover" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-neutral-900">{enTitle(a.article_translations, a.slug)}</div>
                      <div className="text-xs text-neutral-400">{a.slug}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-neutral-600">{CAT_LABELS[a.category] ?? a.category}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${
                      a.is_published ? 'bg-brand-100 text-brand-700' : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {a.is_published ? 'Published' : 'Draft'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/resources/${a.id}`} className="font-medium text-brand-700 hover:underline">Edit</Link>
                </td>
              </tr>
            ))}
            {articles.length === 0 && !error && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-neutral-400">No articles yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
