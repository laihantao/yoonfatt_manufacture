import { createBrowserClient } from '@supabase/ssr';

// Browser client for client components (admin forms). Carries the session
// from cookies, so writes run as the authenticated admin (RLS allows CRUD).
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
