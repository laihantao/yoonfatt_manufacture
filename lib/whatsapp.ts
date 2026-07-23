import type { EnquiryItem, Locale } from '@/lib/types';

export function waLink(number: string, text?: string): string {
  const clean = number.replace(/[^0-9]/g, '');
  const base = `https://wa.me/${clean}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

type EnquiryForm = {
  name: string;
  company?: string | null;
  country: string;
  destination: string;
  remarks?: string | null;
};

const intro: Record<Locale, string> = {
  en: 'Hello Yoon Fatt, I would like to enquire about the following products:',
  ms: 'Salam Yoon Fatt, saya ingin membuat pertanyaan tentang produk berikut:',
  zh: '您好 Yoon Fatt，我想咨询以下产品：',
};

const labels: Record<Locale, { units: string; name: string; company: string; country: string; deliverTo: string; ask: string }> = {
  en: {
    units: 'units',
    name: 'Name',
    company: 'Company',
    country: 'Country',
    deliverTo: 'Deliver to',
    ask: 'Could you advise on availability, pricing, and how delivery fees are calculated for this destination?',
  },
  ms: {
    units: 'unit',
    name: 'Nama',
    company: 'Syarikat',
    country: 'Negara',
    deliverTo: 'Hantar ke',
    ask: 'Boleh nasihatkan tentang ketersediaan, harga, dan cara kos penghantaran dikira untuk destinasi ini?',
  },
  zh: {
    units: '件',
    name: '姓名',
    company: '公司',
    country: '国家',
    deliverTo: '运送至',
    ask: '能否告知供货情况、价格，以及此目的地的运费如何计算？',
  },
};

export function buildEnquiryMessage(
  locale: Locale,
  items: EnquiryItem[],
  form: EnquiryForm,
): string {
  const l = labels[locale];
  const lines: string[] = [intro[locale], ''];

  items.forEach((it, i) => {
    const variant = it.variant ? ` (${it.variant})` : '';
    lines.push(`${i + 1}. ${it.name}${variant} × ${it.quantity} ${l.units}`);
  });

  lines.push('');
  const who = [`${l.name}: ${form.name}`];
  if (form.company) who.push(`${l.company}: ${form.company}`);
  lines.push(who.join(' | '));
  lines.push(`${l.country}: ${form.country}`);
  lines.push(`${l.deliverTo}: ${form.destination}`);
  lines.push('');
  lines.push(l.ask);
  if (form.remarks) {
    lines.push('');
    lines.push(form.remarks);
  }

  return lines.join('\n');
}
