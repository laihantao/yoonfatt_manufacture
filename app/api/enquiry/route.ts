import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { EnquiryPayload } from '@/lib/types';

function isValid(body: Partial<EnquiryPayload>): body is EnquiryPayload {
  // Name + channel are always required. Country/destination are required
  // for product enquiries but optional for the general contact form.
  return Boolean(
    body &&
      typeof body.name === 'string' &&
      body.name.trim() &&
      (body.channel === 'email' || body.channel === 'whatsapp'),
  );
}

async function saveToSupabase(body: EnquiryPayload) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return { saved: false as const };

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
  const { error } = await supabase.from('enquiries').insert({
    name: body.name,
    company: body.company ?? null,
    country: body.country,
    destination: body.destination,
    remarks: body.remarks ?? null,
    items: body.items ?? [],
    channel: body.channel,
  });
  if (error) {
    console.error('[enquiry] supabase insert failed:', error.message);
    return { saved: false as const, error: error.message };
  }
  return { saved: true as const };
}

async function sendEmail(body: EnquiryPayload) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.ENQUIRY_TO_EMAIL;
  if (!apiKey || !to) return { emailed: false as const };

  const itemLines =
    body.items?.length
      ? body.items
          .map(
            (it, i) =>
              `${i + 1}. ${it.name}${it.variant ? ` (${it.variant})` : ''} × ${it.quantity}`,
          )
          .join('\n')
      : '(No product items — general enquiry)';

  const text = [
    `New enquiry from ${body.name}`,
    body.company ? `Company: ${body.company}` : null,
    `Country: ${body.country}`,
    `Deliver to: ${body.destination}`,
    `Channel: ${body.channel}`,
    '',
    'Items:',
    itemLines,
    '',
    body.remarks ? `Remarks: ${body.remarks}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Yoon Fatt Website <onboarding@resend.dev>',
      to: [to],
      subject: `New enquiry — ${body.name} (${body.country})`,
      text,
    }),
  });

  if (!res.ok) {
    console.error('[enquiry] resend send failed:', await res.text());
    return { emailed: false as const };
  }
  return { emailed: true as const };
}

export async function POST(request: Request) {
  let body: Partial<EnquiryPayload>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  if (!isValid(body)) {
    return NextResponse.json({ ok: false, error: 'Missing required fields' }, { status: 400 });
  }

  // Save first; email is best-effort. Never fail the user if email/DB is down.
  // WhatsApp enquiries are only recorded (the message goes via wa.me), so
  // email is sent for the email channel only.
  const [saveResult, emailResult] = await Promise.allSettled([
    saveToSupabase(body),
    body.channel === 'email' ? sendEmail(body) : Promise.resolve({ emailed: false as const }),
  ]);

  return NextResponse.json({
    ok: true,
    saved: saveResult.status === 'fulfilled' ? saveResult.value.saved : false,
    emailed: emailResult.status === 'fulfilled' ? emailResult.value.emailed : false,
  });
}
