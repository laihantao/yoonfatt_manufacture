import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  seedAboutContent,
  seedCompanyInfo,
  seedShippingFaq,
} from '@/lib/seed/data';
import SettingsForm from '@/components/admin/SettingsForm';

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function AdminSettingsPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from('site_settings').select('key, value');
  const byKey = new Map((data ?? []).map((r: any) => [r.key, r.value]));

  const company = { ...seedCompanyInfo, ...(byKey.get('company_info') ?? {}) };
  const about = byKey.get('about_content') ?? seedAboutContent;
  const faq = byKey.get('shipping_faq') ?? seedShippingFaq;

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-900">Site settings</h1>
      <p className="mb-6 mt-1 text-sm text-neutral-500">
        Company details, about-page content, and the shipping FAQ shown on the website.
      </p>
      <SettingsForm company={company} about={about} faq={faq} />
    </div>
  );
}
