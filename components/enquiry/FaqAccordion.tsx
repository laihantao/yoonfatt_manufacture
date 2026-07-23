'use client';

import { useState } from 'react';
import type { FaqItem } from '@/lib/types';

export default function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="divide-y divide-neutral-200 rounded-lg border border-neutral-200">
      {items.map((item, i) => (
        <div key={i}>
          <button
            type="button"
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left text-sm font-medium text-neutral-900"
          >
            {item.question}
            <span className="text-neutral-400">{open === i ? '−' : '+'}</span>
          </button>
          {open === i && (
            <p className="px-4 pb-4 text-sm text-neutral-600">{item.answer}</p>
          )}
        </div>
      ))}
    </div>
  );
}
