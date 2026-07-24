'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type NavItem = {
  href: string;
  label: string;
  exact?: boolean;
  children?: { href: string; label: string; exact?: boolean }[];
};

const items: NavItem[] = [
  { href: '/admin', label: 'Dashboard', exact: true },
  { href: '/admin/products', label: 'Products' },
  { href: '/admin/enquiries', label: 'Enquiries' },
  {
    href: '/admin/settings',
    label: 'Settings',
    children: [
      { href: '/admin/settings', label: 'Site info', exact: true },
      { href: '/admin/settings/categories', label: 'Categories' },
    ],
  },
];

export default function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <nav className="space-y-1">
      {items.map((it) =>
        it.children ? (
          <div key={it.href}>
            <div
              className={`px-3 py-2 text-sm ${
                isActive(it.href) ? 'font-semibold text-white' : 'text-neutral-300'
              }`}
            >
              {it.label}
            </div>
            <div className="ml-3 space-y-1 border-l border-white/10 pl-2">
              {it.children.map((c) => (
                <Link
                  key={c.href}
                  href={c.href}
                  onClick={onNavigate}
                  className={`block rounded px-3 py-1.5 text-sm ${
                    isActive(c.href, c.exact)
                      ? 'bg-brand-600 text-white'
                      : 'text-neutral-400 hover:bg-white/10 hover:text-neutral-200'
                  }`}
                >
                  {c.label}
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <Link
            key={it.href}
            href={it.href}
            onClick={onNavigate}
            className={`block rounded px-3 py-2 text-sm ${
              isActive(it.href, it.exact)
                ? 'bg-brand-600 text-white'
                : 'text-neutral-300 hover:bg-white/10'
            }`}
          >
            {it.label}
          </Link>
        ),
      )}
    </nav>
  );
}
