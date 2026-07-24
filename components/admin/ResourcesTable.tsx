'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Spinner from '@/components/ui/Spinner';

export type AdminArticleRow = {
  id: string;
  slug: string;
  title: string;
  categoryLabel: string;
  coverUrl: string | null;
  isPublished: boolean;
};

export default function ResourcesTable({ articles }: { articles: AdminArticleRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [clickedId, setClickedId] = useState<string | null>(null);

  function openEdit(id: string) {
    setClickedId(id);
    startTransition(() => router.push(`/admin/resources/${id}`));
  }

  return (
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
          {articles.map((a) => (
            <tr
              key={a.id}
              onClick={() => openEdit(a.id)}
              className="cursor-pointer transition-colors hover:bg-brand-50/60"
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="relative h-10 w-16 flex-shrink-0 overflow-hidden rounded bg-neutral-100">
                    {a.coverUrl && <Image src={a.coverUrl} alt="" fill sizes="64px" className="object-cover" />}
                  </div>
                  <div>
                    <div className="font-medium text-neutral-900">{a.title}</div>
                    <div className="text-xs text-neutral-400">{a.slug}</div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-neutral-600">{a.categoryLabel}</td>
              <td className="px-4 py-3">
                <span
                  className={`rounded px-2 py-0.5 text-xs font-medium ${
                    a.isPublished ? 'bg-brand-100 text-brand-700' : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {a.isPublished ? 'Published' : 'Draft'}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                {isPending && clickedId === a.id ? (
                  <Spinner className="h-4 w-4 text-brand-600" />
                ) : (
                  <span className="font-medium text-brand-700">Edit</span>
                )}
              </td>
            </tr>
          ))}
          {articles.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-10 text-center text-neutral-400">No articles yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
