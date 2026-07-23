import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { Product } from '@/lib/types';
import PriceLabel from './PriceLabel';
import QuickAddButton from './QuickAddButton';
import ImageCarousel from '@/components/ui/ImageCarousel';

export default function ProductCard({ product }: { product: Product }) {
  const t = useTranslations('common');

  return (
    <div className="group flex flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white transition-shadow hover:shadow-md">
      <Link href={`/products/${product.slug}`} className="relative block">
        <ImageCarousel
          images={product.images}
          alt={product.name}
          className="aspect-square bg-neutral-50"
          imageClassName="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <span className="absolute left-2 top-2 z-10 rounded bg-brand-600/90 px-2 py-0.5 text-xs font-medium text-white">
          {product.categoryName}
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <Link href={`/products/${product.slug}`}>
          <h3 className="line-clamp-2 text-sm font-semibold text-neutral-900 group-hover:text-brand-700">
            {product.name}
          </h3>
        </Link>
        <div className="mt-1 text-sm font-medium">
          <PriceLabel product={product} />
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <QuickAddButton product={product} />
          <Link href={`/products/${product.slug}`} className="btn-outline w-full text-xs">
            {t('viewDetails')}
          </Link>
        </div>
      </div>
    </div>
  );
}
