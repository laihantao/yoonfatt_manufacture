'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { usePathname, useRouter } from '@/i18n/navigation';
import type { Category } from '@/lib/types';

export default function ProductFilters({
  categories,
  activeCategory,
}: {
  categories: Category[];
  activeCategory?: string;
}) {
  const t = useTranslations('products');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') ?? '');

  function updateParams(next: { category?: string | null; q?: string | null }) {
    const params = new URLSearchParams(searchParams.toString());
    if ('category' in next) {
      if (next.category) params.set('category', next.category);
      else params.delete('category');
    }
    if ('q' in next) {
      if (next.q) params.set('q', next.q);
      else params.delete('q');
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          updateParams({ q: query });
        }}
      >
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </form>

      {/* Category filter */}
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          {t('filterByCategory')}
        </h3>
        {/* Mobile: dropdown */}
        <select
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm md:hidden"
          value={activeCategory ?? ''}
          onChange={(e) => updateParams({ category: e.target.value || null })}
        >
          <option value="">{t('allCategories')}</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>{c.name}</option>
          ))}
        </select>
        {/* Desktop: list */}
        <ul className="hidden space-y-1 md:block">
          <li>
            <button
              type="button"
              onClick={() => updateParams({ category: null })}
              className={`w-full rounded px-3 py-2 text-left text-sm ${
                !activeCategory ? 'bg-brand-50 font-semibold text-brand-700' : 'text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              {t('allCategories')}
            </button>
          </li>
          {categories.map((c) => (
            <li key={c.slug}>
              <button
                type="button"
                onClick={() => updateParams({ category: c.slug })}
                className={`w-full rounded px-3 py-2 text-left text-sm ${
                  activeCategory === c.slug ? 'bg-brand-50 font-semibold text-brand-700' : 'text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                {c.name}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
