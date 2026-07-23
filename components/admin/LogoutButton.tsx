'use client';

import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export default function LogoutButton() {
  async function logout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.assign('/admin/login');
  }
  return (
    <button
      type="button"
      onClick={logout}
      className="w-full rounded px-3 py-2 text-left text-sm text-neutral-300 hover:bg-white/10"
    >
      Sign out
    </button>
  );
}
