// Resolve a product image reference to a displayable URL.
// Seed/scraped rows may store a full http(s) URL; real uploads store a
// Storage path like products/{slug}/{file} in the product-images bucket.
export function publicImageUrl(storagePath: string, bucket = 'product-images'): string {
  if (/^https?:\/\//.test(storagePath)) return storagePath;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const clean = storagePath.replace(/^\/+/, '');
  return `${base}/storage/v1/object/public/${bucket}/${clean}`;
}

// Article images/video live in the article-media bucket.
export function articleMediaUrl(storagePath: string): string {
  return publicImageUrl(storagePath, 'article-media');
}
