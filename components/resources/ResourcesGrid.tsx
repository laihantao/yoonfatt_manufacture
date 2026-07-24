'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Article } from '@/lib/types';
import { ARTICLE_CATEGORIES } from '@/lib/types';
import ArticleCard from './ArticleCard';

export default function ResourcesGrid({ articles }: { articles: Article[] }) {
  const t = useTranslations('resources');
  const tCat = useTranslations('resources.cat');
  const [category, setCategory] = useState<string>('');

  // Only show category tabs that actually have articles.
  const usedCategories = useMemo(
    () => ARTICLE_CATEGORIES.filter((c) => articles.some((a) => a.category === c)),
    [articles],
  );

  const filtered = category ? articles.filter((a) => a.category === category) : articles;

  if (articles.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-neutral-300 p-12 text-center text-neutral-500">
        {t('empty')}
      </div>
    );
  }

  return (
    <div>
      {usedCategories.length > 1 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategory('')}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              !category ? 'bg-brand-600 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            {t('allCategories')}
          </button>
          {usedCategories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                category === c ? 'bg-brand-600 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {tCat(c)}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((a) => (
          <ArticleCard key={a.id} article={a} />
        ))}
      </div>
    </div>
  );
}
