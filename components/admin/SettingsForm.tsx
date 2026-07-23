'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/ToastProvider';

const LOCALES = ['en', 'ms', 'zh'] as const;
type L = (typeof LOCALES)[number];
const TAB_LABELS: Record<L, string> = { en: 'EN', ms: 'BM', zh: '中文' };

type CompanyValue = {
  name: string;
  co_no: string;
  phone: string;
  fax: string;
  whatsapp_number: string;
  email: string;
  address: string;
  opening_hours: string;
  facebook_url: string;
  map_embed_url: string;
};
type AboutValue = Record<L, { paragraphs: string[] }>;
type FaqValue = Record<L, { question: string; answer: string }[]>;

const input =
  'w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500';
const label = 'mb-1 block text-sm font-medium text-neutral-700';

function LangTabs({ tab, setTab }: { tab: L; setTab: (l: L) => void }) {
  return (
    <div className="flex rounded border border-neutral-200 text-xs font-semibold">
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setTab(l)}
          className={`px-3 py-1.5 ${tab === l ? 'bg-brand-600 text-white' : 'text-neutral-600 hover:bg-neutral-100'}`}
        >
          {TAB_LABELS[l]}
        </button>
      ))}
    </div>
  );
}

export default function SettingsForm({
  company: initialCompany,
  about: initialAbout,
  faq: initialFaq,
}: {
  company: CompanyValue;
  about: AboutValue;
  faq: FaqValue;
}) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const toast = useToast();
  const router = useRouter();

  const [company, setCompany] = useState<CompanyValue>(initialCompany);
  const [about, setAbout] = useState<Record<L, string>>({
    en: (initialAbout.en?.paragraphs ?? []).join('\n\n'),
    ms: (initialAbout.ms?.paragraphs ?? []).join('\n\n'),
    zh: (initialAbout.zh?.paragraphs ?? []).join('\n\n'),
  });
  const [faq, setFaq] = useState<FaqValue>({
    en: initialFaq.en ?? [],
    ms: initialFaq.ms ?? [],
    zh: initialFaq.zh ?? [],
  });
  const [aboutTab, setAboutTab] = useState<L>('en');
  const [faqTab, setFaqTab] = useState<L>('en');
  const [saving, setSaving] = useState<string | null>(null);

  async function saveSetting(key: string, value: unknown, labelText: string) {
    setSaving(key);
    const { error } = await supabase
      .from('site_settings')
      .upsert({ key, value }, { onConflict: 'key' });
    setSaving(null);
    if (error) {
      toast(`Save failed: ${error.message}`, 'error');
      return;
    }
    toast(`${labelText} saved successfully`);
    router.refresh();
  }

  const companyFields: { key: keyof CompanyValue; label: string; textarea?: boolean }[] = [
    { key: 'name', label: 'Company name' },
    { key: 'co_no', label: 'Company no.' },
    { key: 'phone', label: 'Phone (Tel)' },
    { key: 'fax', label: 'Fax' },
    { key: 'whatsapp_number', label: 'WhatsApp number (digits only, with country code)' },
    { key: 'email', label: 'Email' },
    { key: 'address', label: 'Address', textarea: true },
    { key: 'opening_hours', label: 'Opening hours (one line per entry)', textarea: true },
    { key: 'facebook_url', label: 'Facebook URL' },
    { key: 'map_embed_url', label: 'Google Maps embed URL' },
  ];

  return (
    <div className="max-w-3xl space-y-6">
      {/* ── Company info ── */}
      <section className="rounded-lg border border-neutral-200 bg-white p-6">
        <h2 className="mb-4 font-semibold text-neutral-900">Company information</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {companyFields.map((f) => (
            <div key={f.key} className={f.textarea ? 'sm:col-span-2' : ''}>
              <label className={label}>{f.label}</label>
              {f.textarea ? (
                <textarea
                  rows={3}
                  className={input}
                  value={company[f.key]}
                  onChange={(e) => setCompany({ ...company, [f.key]: e.target.value })}
                />
              ) : (
                <input
                  className={input}
                  value={company[f.key]}
                  onChange={(e) => setCompany({ ...company, [f.key]: e.target.value })}
                />
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          disabled={saving === 'company_info'}
          onClick={() => saveSetting('company_info', company, 'Company information')}
          className="btn-primary mt-5 disabled:opacity-60"
        >
          {saving === 'company_info' ? 'Saving...' : 'Save company info'}
        </button>
      </section>

      {/* ── About content ── */}
      <section className="rounded-lg border border-neutral-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-neutral-900">About page content</h2>
          <LangTabs tab={aboutTab} setTab={setAboutTab} />
        </div>
        <p className="mb-2 text-xs text-neutral-500">
          Separate paragraphs with an empty line.
        </p>
        <textarea
          rows={8}
          className={input}
          value={about[aboutTab]}
          onChange={(e) => setAbout({ ...about, [aboutTab]: e.target.value })}
        />
        <button
          type="button"
          disabled={saving === 'about_content'}
          onClick={() => {
            const value = Object.fromEntries(
              LOCALES.map((l) => [
                l,
                { paragraphs: about[l].split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean) },
              ]),
            );
            saveSetting('about_content', value, 'About content');
          }}
          className="btn-primary mt-4 disabled:opacity-60"
        >
          {saving === 'about_content' ? 'Saving...' : 'Save about content'}
        </button>
      </section>

      {/* ── Shipping FAQ ── */}
      <section className="rounded-lg border border-neutral-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-neutral-900">Shipping & Ordering FAQ</h2>
          <LangTabs tab={faqTab} setTab={setFaqTab} />
        </div>
        <div className="space-y-4">
          {faq[faqTab].map((item, i) => (
            <div key={i} className="rounded-md border border-neutral-200 p-3">
              <div className="flex items-start gap-2">
                <div className="flex-1 space-y-2">
                  <input
                    className={input}
                    placeholder="Question"
                    value={item.question}
                    onChange={(e) => {
                      const next = faq[faqTab].slice();
                      next[i] = { ...next[i], question: e.target.value };
                      setFaq({ ...faq, [faqTab]: next });
                    }}
                  />
                  <textarea
                    rows={2}
                    className={input}
                    placeholder="Answer"
                    value={item.answer}
                    onChange={(e) => {
                      const next = faq[faqTab].slice();
                      next[i] = { ...next[i], answer: e.target.value };
                      setFaq({ ...faq, [faqTab]: next });
                    }}
                  />
                </div>
                <button
                  type="button"
                  className="px-1 text-red-500 hover:underline"
                  onClick={() => setFaq({ ...faq, [faqTab]: faq[faqTab].filter((_, j) => j !== i) })}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            className="text-sm font-medium text-brand-700 hover:underline"
            onClick={() =>
              setFaq({ ...faq, [faqTab]: [...faq[faqTab], { question: '', answer: '' }] })
            }
          >
            + Add Q&A
          </button>
        </div>
        <button
          type="button"
          disabled={saving === 'shipping_faq'}
          onClick={() => {
            const value = Object.fromEntries(
              LOCALES.map((l) => [
                l,
                faq[l].filter((x) => x.question.trim() || x.answer.trim()),
              ]),
            );
            saveSetting('shipping_faq', value, 'Shipping FAQ');
          }}
          className="btn-primary mt-4 disabled:opacity-60"
        >
          {saving === 'shipping_faq' ? 'Saving...' : 'Save FAQ'}
        </button>
      </section>
    </div>
  );
}
