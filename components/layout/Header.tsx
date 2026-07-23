'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import type { CompanyInfo } from '@/lib/types';
import LanguageSwitcher from './LanguageSwitcher';
import EnquiryCartIndicator from './EnquiryCartIndicator';

const navItems = [
  { href: '/', key: 'home' },
  { href: '/products', key: 'products' },
  { href: '/sofa-sprayer', key: 'sofaSprayer' },
  { href: '/about', key: 'about' },
  { href: '/contact', key: 'contact' },
] as const;

export default function Header({ company }: { company: CompanyInfo }) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center">
          <Image
            src="/logo.png"
            alt="Yoon Fatt Industries (M) Sdn. Bhd."
            width={220}
            height={44}
            priority
            className="h-9 w-auto sm:h-10"
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded px-3 py-2 text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? 'text-brand-700'
                  : 'text-neutral-700 hover:text-brand-600'
              }`}
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={`tel:${company.phone.replace(/\s/g, '')}`}
            className="hidden text-sm font-semibold text-brand-700 lg:block"
          >
            {company.phone}
          </a>
          <LanguageSwitcher />
          <EnquiryCartIndicator />
          <button
            type="button"
            className="grid h-9 w-9 place-items-center rounded border border-neutral-200 md:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            <span className="text-lg leading-none">{open ? '✕' : '☰'}</span>
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {open && (
        <nav className="border-t border-neutral-200 bg-white md:hidden">
          <div className="container-page flex flex-col py-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`rounded px-2 py-3 text-sm font-medium ${
                  isActive(item.href) ? 'text-brand-700' : 'text-neutral-700'
                }`}
              >
                {t(item.key)}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
