'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/ToastProvider';

export default function HandledToggle({ id, handled }: { id: string; handled: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.from('enquiries').update({ handled: !handled }).eq('id', id);
    setBusy(false);
    if (error) {
      toast(`Update failed: ${error.message}`, 'error');
      return;
    }
    toast(handled ? 'Marked as unhandled' : 'Marked as handled');
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className={`rounded px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
        handled
          ? 'bg-brand-100 text-brand-700 hover:bg-brand-200'
          : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
      }`}
    >
      {handled ? '✓ Handled' : 'Mark handled'}
    </button>
  );
}
