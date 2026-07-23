import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';

async function count(table: string) {
  const supabase = await createSupabaseServerClient();
  const { count } = await supabase.from(table).select('*', { count: 'exact', head: true });
  return count ?? 0;
}

export default async function AdminDashboard() {
  const [products, categories, enquiries, newEnquiries] = await Promise.all([
    count('products'),
    count('categories'),
    count('enquiries'),
    (async () => {
      const supabase = await createSupabaseServerClient();
      const { count } = await supabase
        .from('enquiries')
        .select('*', { count: 'exact', head: true })
        .eq('handled', false);
      return count ?? 0;
    })(),
  ]);

  const cards = [
    { label: 'Products', value: products, href: '/admin/products' },
    { label: 'Categories', value: categories, href: '/admin/products' },
    { label: 'Enquiries', value: enquiries, href: '/admin/enquiries' },
    { label: 'Unhandled enquiries', value: newEnquiries, href: '/admin/enquiries' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>
      <p className="mt-1 text-sm text-neutral-500">Manage your catalog and enquiries.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="rounded-lg border border-neutral-200 bg-white p-5 hover:border-brand-400">
            <div className="text-3xl font-bold text-brand-700">{c.value}</div>
            <div className="mt-1 text-sm text-neutral-500">{c.label}</div>
          </Link>
        ))}
      </div>

      <div className="mt-8">
        <Link href="/admin/products/new" className="btn-primary">+ Add product</Link>
      </div>
    </div>
  );
}
