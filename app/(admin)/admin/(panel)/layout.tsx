import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import AdminNav from '@/components/admin/AdminNav';
import LogoutButton from '@/components/admin/LogoutButton';

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  return (
    <div className="flex min-h-screen">
      {/* Sticky full-viewport sidebar — does not grow/scroll with page content */}
      <aside className="sticky top-0 flex h-screen w-56 flex-shrink-0 flex-col justify-between overflow-y-auto bg-neutral-900 p-4">
        <div>
          <div className="mb-6 flex items-center gap-2 px-1">
            <span className="grid h-8 w-8 place-items-center rounded bg-brand-600 text-xs font-bold text-white">YF</span>
            <span className="font-bold text-white">Admin</span>
          </div>
          <AdminNav />
        </div>
        <div className="border-t border-white/10 pt-3">
          <p className="truncate px-3 pb-2 text-xs text-neutral-500">{user.email}</p>
          <LogoutButton />
        </div>
      </aside>
      <main className="flex-1 overflow-x-hidden p-8">{children}</main>
    </div>
  );
}
