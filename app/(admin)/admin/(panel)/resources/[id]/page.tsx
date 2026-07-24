import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import ArticleForm, { type ArticleFormData } from '@/components/admin/ArticleForm';

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('articles')
    .select('id, slug, category, cover_path, is_published, sort_order, article_translations ( locale, title, excerpt, body )')
    .eq('id', id)
    .maybeSingle();

  if (!data) notFound();

  const a = data as any;
  const formData: ArticleFormData = {
    id: a.id,
    slug: a.slug,
    category: a.category,
    cover_path: a.cover_path,
    is_published: a.is_published,
    sort_order: a.sort_order,
    article_translations: (a.article_translations ?? []).map((t: any) => ({
      locale: t.locale,
      title: t.title,
      excerpt: t.excerpt,
      blocks: Array.isArray(t.body) ? t.body : [],
    })),
  };

  return (
    <div>
      <Link href="/admin/resources" className="text-sm text-neutral-500 hover:text-brand-700">← Resources</Link>
      <h1 className="mb-6 mt-2 text-2xl font-bold text-neutral-900">Edit article</h1>
      <ArticleForm article={formData} />
    </div>
  );
}
