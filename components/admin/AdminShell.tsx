'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import AdminNav from './AdminNav';
import LogoutButton from './LogoutButton';

export default function AdminShell({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the mobile drawer on route change.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const sidebar = (
    <div className="flex h-full flex-col justify-between p-4">
      <div>
        <div className="mb-6 flex items-center gap-2 px-1">
          <span className="grid h-8 w-8 place-items-center rounded bg-brand-600 text-xs font-bold text-white">YF</span>
          <span className="font-bold text-white">Admin</span>
        </div>
        <AdminNav onNavigate={() => setOpen(false)} />
      </div>
      <div className="border-t border-white/10 pt-3">
        <p className="truncate px-3 pb-2 text-xs text-neutral-500">{email}</p>
        <LogoutButton />
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar (static) */}
      <aside className="sticky top-0 hidden h-screen w-56 flex-shrink-0 overflow-y-auto bg-neutral-900 md:block">
        {sidebar}
      </aside>

      {/* Mobile drawer + overlay */}
      <div className={`fixed inset-0 z-50 md:hidden ${open ? '' : 'pointer-events-none'}`}>
        <div
          className={`absolute inset-0 bg-black/50 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setOpen(false)}
        />
        <aside
          className={`absolute inset-y-0 left-0 w-64 overflow-y-auto bg-neutral-900 shadow-xl transition-transform duration-300 ${
            open ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {sidebar}
        </aside>
      </div>

      {/* Content column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-neutral-200 bg-white px-4 md:hidden">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setOpen(true)}
            className="grid h-9 w-9 place-items-center rounded border border-neutral-200 text-lg"
          >
            ☰
          </button>
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded bg-brand-600 text-xs font-bold text-white">YF</span>
            <span className="font-bold text-neutral-900">Admin</span>
          </div>
        </header>

        <main className="min-w-0 flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
