// Currency is MYR only, rendered as "RM 1,234.00".
export function formatPrice(price: number): string {
  return `RM ${price.toLocaleString('en-MY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function imageUrl(url: string): string {
  return url;
}
