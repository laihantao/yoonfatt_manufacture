import { createSupabaseServerClient } from '@/lib/supabase/server';
import HandledToggle from '@/components/admin/HandledToggle';

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function AdminEnquiriesPage() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('enquiries')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  const enquiries = data ?? [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-900">Enquiries</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Latest first. Click a row to expand the enquired items.
      </p>

      {error && (
        <p className="mt-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error.message}</p>
      )}

      <div className="mt-6 space-y-3">
        {enquiries.map((e: any) => (
          <details key={e.id} className="group rounded-lg border border-neutral-200 bg-white">
            <summary className="flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 [&::-webkit-details-marker]:hidden">
              <span className="text-xs text-neutral-400">
                {new Date(e.created_at).toLocaleString('en-MY', { dateStyle: 'medium', timeStyle: 'short' })}
              </span>
              <span className="font-medium text-neutral-900">{e.name}</span>
              {e.company && <span className="text-sm text-neutral-500">({e.company})</span>}
              <span className="text-sm text-neutral-600">{e.country}</span>
              <span
                className={`rounded px-2 py-0.5 text-xs font-medium ${
                  e.channel === 'whatsapp' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                }`}
              >
                {e.channel}
              </span>
              <span className="ml-auto flex items-center gap-3">
                <span className="text-xs text-neutral-400">
                  {(e.items ?? []).length} item{(e.items ?? []).length === 1 ? '' : 's'}
                </span>
                <HandledToggle id={e.id} handled={!!e.handled} />
              </span>
            </summary>
            <div className="border-t border-neutral-100 px-4 py-3 text-sm">
              <dl className="grid gap-x-8 gap-y-1 sm:grid-cols-2">
                <div><dt className="inline font-medium text-neutral-500">Deliver to: </dt><dd className="inline text-neutral-800">{e.destination || '—'}</dd></div>
                <div><dt className="inline font-medium text-neutral-500">Country: </dt><dd className="inline text-neutral-800">{e.country || '—'}</dd></div>
              </dl>
              {(e.items ?? []).length > 0 && (
                <ul className="mt-3 space-y-1">
                  {(e.items as any[]).map((it, i) => (
                    <li key={i} className="text-neutral-800">
                      {i + 1}. {it.name}
                      {it.variant ? ` (${it.variant})` : ''} × {it.quantity}
                    </li>
                  ))}
                </ul>
              )}
              {e.remarks && (
                <p className="mt-3 whitespace-pre-line rounded bg-neutral-50 px-3 py-2 text-neutral-600">{e.remarks}</p>
              )}
            </div>
          </details>
        ))}
        {enquiries.length === 0 && !error && (
          <div className="rounded-lg border border-dashed border-neutral-300 p-10 text-center text-neutral-400">
            No enquiries yet.
          </div>
        )}
      </div>
    </div>
  );
}
