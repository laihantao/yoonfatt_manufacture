import Link from 'next/link';
import ArticleForm from '@/components/admin/ArticleForm';

export default function NewArticlePage() {
  return (
    <div>
      <Link href="/admin/resources" className="text-sm text-neutral-500 hover:text-brand-700">← Resources</Link>
      <h1 className="mb-6 mt-2 text-2xl font-bold text-neutral-900">Add article</h1>
      <ArticleForm article={null} />
    </div>
  );
}
