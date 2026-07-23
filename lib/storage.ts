// Resolve a product image reference to a displayable URL.
// Seed/scraped rows may store a full http(s) URL; real uploads store a
// Storage path like products/{slug}/{file} in the product-images bucket.
export function publicImageUrl(storagePath: string): string {
  if (/^https?:\/\//.test(storagePath)) return storagePath;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const clean = storagePath.replace(/^\/+/, '');
  return `${base}/storage/v1/object/public/product-images/${clean}`;
}
