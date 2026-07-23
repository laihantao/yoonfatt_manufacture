'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

const labels: Record<string, string> = {
  en: 'EN',
  ms: 'BM',
  zh: '中文',
};

export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="flex items-center rounded border border-neutral-200 text-xs font-semibold">
      {routing.locales.map((l, i) => (
        <button
          key={l}
          type="button"
          onClick={() => router.replace(pathname, { locale: l })}
          className={`px-2 py-1.5 transition-colors ${
            locale === l ? 'bg-brand-600 text-white' : 'text-neutral-600 hover:bg-neutral-100'
          } ${i === 0 ? 'rounded-l' : ''} ${i === routing.locales.length - 1 ? 'rounded-r' : ''}`}
        >
          {labels[l] ?? l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
