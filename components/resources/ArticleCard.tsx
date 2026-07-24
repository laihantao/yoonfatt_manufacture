import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { Article } from '@/lib/types';

export default function ArticleCard({ article }: { article: Article }) {
  const t = useTranslations('resources');
  const tCat = useTranslations('resources.cat');

  return (
    <Link
      href={`/resources/${article.slug}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-video overflow-hidden bg-neutral-100">
        {article.coverUrl ? (
          <Image
            src={article.coverUrl}
            alt={article.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-3xl text-neutral-300">📄</div>
        )}
        <span className="absolute left-2 top-2 rounded bg-brand-600/90 px-2 py-0.5 text-xs font-medium text-white">
          {tCat(article.category)}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-semibold text-neutral-900 group-hover:text-brand-700">{article.title}</h3>
        {article.excerpt && (
          <p className="mt-1 line-clamp-2 text-sm text-neutral-600">{article.excerpt}</p>
        )}
        <span className="mt-3 text-sm font-semibold text-brand-700">{t('readMore')} →</span>
      </div>
    </Link>
  );
}
