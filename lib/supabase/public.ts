import { createClient } from '@supabase/supabase-js';
import { isSupabaseConfigured } from '@/lib/env';

// Plain anon client for public storefront reads (no cookies → ISR/static
// friendly). RLS limits it to active catalog content + site settings.
export function createSupabasePublicClient() {
  if (!isSupabaseConfigured()) return null;
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  );
}
