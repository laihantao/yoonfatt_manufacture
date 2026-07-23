'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { Locale } from '@/lib/types';

export default function ContactForm() {
  const t = useTranslations('contact');
  const te = useTranslations('enquiry');
  const locale = useLocale() as Locale;
  const [status, setStatus] = useState<'idle' | 'sending' | 'done'>('idle');
  const [form, setForm] = useState({ name: '', contact: '', message: '' });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    const remarks = [form.contact ? `Contact: ${form.contact}` : null, form.message]
      .filter(Boolean)
      .join('\n\n');
    await fetch('/api/enquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        country: '-',
        destination: '-',
        remarks,
        items: [],
        channel: 'email',
        locale,
      }),
    });
    setStatus('done');
    setForm({ name: '', contact: '', message: '' });
  }

  if (status === 'done') {
    return (
      <div className="rounded-lg border border-brand-200 bg-brand-50 p-6 text-center">
        <p className="font-semibold text-brand-800">{te('successTitle')}</p>
        <p className="mt-1 text-sm text-neutral-600">{te('successBody')}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">
          {te('name')} <span className="text-red-500">*</span>
        </label>
        <input
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">
          {t('email')} / {t('phone')}
        </label>
        <input
          value={form.contact}
          onChange={(e) => setForm({ ...form, contact: e.target.value })}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">
          {t('message')} <span className="text-red-500">*</span>
        </label>
        <textarea
          required
          rows={5}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>
      <button type="submit" disabled={status === 'sending'} className="btn-primary w-full disabled:opacity-60">
        {status === 'sending' ? te('sending') : t('send')}
      </button>
    </form>
  );
}
