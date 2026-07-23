import { useTranslations } from 'next-intl';
import { formatPrice } from '@/lib/format';
import type { Product } from '@/lib/types';

export default function PriceLabel({
  product,
  className = '',
}: {
  product: Pick<Product, 'price' | 'displayPrice'>;
  className?: string;
}) {
  const t = useTranslations('common');

  if (product.displayPrice && product.price != null) {
    return <span className={className}>{formatPrice(product.price)}</span>;
  }
  return (
    <span className={`text-neutral-500 ${className}`}>{t('enquireForPrice')}</span>
  );
}
