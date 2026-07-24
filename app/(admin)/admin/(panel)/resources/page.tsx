import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { articleMediaUrl } from '@/lib/storage';
import ResourcesTable, { type AdminArticleRow } from '@/components/admin/ResourcesTable';

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

  const articles: AdminArticleRow[] = (data ?? []).map((a: any) => ({
    id: a.id,
    slug: a.slug,
    title: enTitle(a.article_translations, a.slug),
    categoryLabel: CAT_LABELS[a.category] ?? a.category,
    coverUrl: a.cover_path ? articleMediaUrl(a.cover_path) : null,
    isPublished: !!a.is_published,
  }));

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

      <ResourcesTable articles={articles} />
    </div>
  );
}
