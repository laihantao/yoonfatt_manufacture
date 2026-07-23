'use client';

import { useMemo, useState, useTransition } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { formatPrice } from '@/lib/format';
import Spinner from '@/components/ui/Spinner';

export type AdminProductRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  categoryName: string;
  categorySlug: string;
  price: number | null;
  displayPrice: boolean;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  thumb: string | null;
};

type SortField = 'default' | 'name' | 'price';
type StatusFilter = 'all' | 'active' | 'hidden' | 'featured' | 'price-shown';

function Badge({ on, label }: { on: boolean; label: string }) {
  return (
    <span
      className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
        on ? 'bg-brand-100 text-brand-700' : 'bg-neutral-100 text-neutral-400'
      }`}
    >
      {label}
    </span>
  );
}

export default function ProductsTable({
  products,
  categories,
}: {
  products: AdminProductRow[];
  categories: { slug: string; name: string }[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [clickedId, setClickedId] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [sortField, setSortField] = useState<SortField>('default');
  const [sortAsc, setSortAsc] = useState(true);

  function toggleSort(field: Exclude<SortField, 'default'>) {
    if (sortField === field) {
      // asc → desc → back to default order
      if (sortAsc) setSortAsc(false);
      else {
        setSortField('default');
        setSortAsc(true);
      }
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  }

  const sortIndicator = (field: SortField) =>
    sortField === field ? (sortAsc ? ' ▲' : ' ▼') : '';

  const filtered = useMemo(() => {
    let rows = products;

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      rows = rows.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q),
      );
    }
    if (category) rows = rows.filter((p) => p.categorySlug === category);
    if (status !== 'all') {
      rows = rows.filter((p) =>
        status === 'active'
          ? p.isActive
          : status === 'hidden'
            ? !p.isActive
            : status === 'featured'
              ? p.isFeatured
              : p.displayPrice,
      );
    }

    const sorted = rows.slice();
    if (sortField === 'name') {
      sorted.sort((a, b) => a.name.localeCompare(b.name) * (sortAsc ? 1 : -1));
    } else if (sortField === 'price') {
      // Products without a price sink to the bottom in both directions.
      sorted.sort((a, b) => {
        if (a.price == null && b.price == null) return 0;
        if (a.price == null) return 1;
        if (b.price == null) return -1;
        return (a.price - b.price) * (sortAsc ? 1 : -1);
      });
    } else {
      sorted.sort((a, b) => a.sortOrder - b.sortOrder);
    }
    return sorted;
  }, [products, search, category, status, sortField, sortAsc]);

  function openEdit(id: string) {
    setClickedId(id);
    startTransition(() => router.push(`/admin/products/${id}`));
  }

  const select =
    'rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500';

  return (
    <div>
      {/* Toolbar */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Search name or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${select} w-64 flex-shrink-0`}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className={select}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>{c.name}</option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)} className={select}>
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="hidden">Hidden</option>
          <option value="featured">Featured</option>
          <option value="price-shown">Price shown</option>
        </select>
        <span className="ml-auto text-sm text-neutral-500">
          {filtered.length} of {products.length}
        </span>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-4 py-3">
                <button type="button" onClick={() => toggleSort('name')} className="uppercase hover:text-brand-700">
                  Product{sortIndicator('name')}
                </button>
              </th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">
                <button type="button" onClick={() => toggleSort('price')} className="uppercase hover:text-brand-700">
                  Price{sortIndicator('price')}
                </button>
              </th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {filtered.map((p) => (
              <tr
                key={p.id}
                onClick={() => openEdit(p.id)}
                className="cursor-pointer transition-colors hover:bg-brand-50/60"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded bg-neutral-100">
                      {p.thumb && (
                        <Image src={p.thumb} alt="" fill sizes="40px" className="object-cover" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-neutral-900">{p.name}</div>
                      <div className="text-xs text-neutral-400">{p.slug}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-neutral-600">{p.categoryName}</td>
                <td className="px-4 py-3 text-neutral-600">
                  {p.price != null ? formatPrice(p.price) : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    <Badge on={p.isActive} label={p.isActive ? 'Active' : 'Hidden'} />
                    <Badge on={p.displayPrice} label="Price shown" />
                    <Badge on={p.isFeatured} label="Featured" />
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  {isPending && clickedId === p.id ? (
                    <Spinner className="h-4 w-4 text-brand-600" />
                  ) : (
                    <span className="font-medium text-brand-700">Edit</span>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-neutral-400">
                  No products match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
