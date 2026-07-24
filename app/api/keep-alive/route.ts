import { NextResponse } from 'next/server';
import { createSupabasePublicClient } from '@/lib/supabase/public';

// Hit daily by Vercel Cron so the free-tier Supabase project doesn't pause
// after ~7 days of inactivity. Does a trivial read.
export const dynamic = 'force-dynamic';

export async function GET() {
  const sb = createSupabasePublicClient();
  if (!sb) return NextResponse.json({ ok: true, skipped: 'no supabase configured' });

  const { error } = await sb.from('site_settings').select('key').limit(1);
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, ts: new Date().toISOString() });
}
