import type { Metadata } from 'next';
import { ToastProvider } from '@/components/ui/ToastProvider';
import '@/app/globals.css';

export const metadata: Metadata = {
  title: 'Admin — Yoon Fatt',
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: browser extensions (e.g. Grammarly) inject
    // attributes into <html>/<body> before React hydrates — harmless mismatch.
    <html lang="en" suppressHydrationWarning>
      <body className="bg-neutral-100 text-neutral-800" suppressHydrationWarning>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
