import type { Locale } from '@/i18n/routing';

export type { Locale };

export type Spec = { label: string; value: string };

export type ProductVariant = {
  label: string; // language-neutral, e.g. "14L"
  sku?: string | null;
};

export type ProductImage = {
  url: string;
  alt?: string | null;
};

export type Category = {
  id: string;
  slug: string;
  name: string; // resolved for the requested locale (EN fallback)
  sortOrder: number;
};

export type Product = {
  id: string;
  slug: string;
  sku?: string | null;
  categorySlug: string;
  categoryName: string; // resolved
  name: string; // resolved
  description: string; // resolved
  specs: Spec[]; // resolved
  price?: number | null;
  displayPrice: boolean;
  isFeatured: boolean;
  sortOrder: number;
  images: ProductImage[];
  variants: ProductVariant[];
};

export type CompanyInfo = {
  name: string;
  coNo: string;
  phone: string;
  fax: string;
  whatsappNumber: string;
  email: string;
  address: string;
  openingHours: string;
  facebookUrl: string;
  mapEmbedUrl: string;
};

export type FaqItem = { question: string; answer: string };

export type AboutContent = {
  paragraphs: string[];
};

// Shape stored in the enquiry cart (localStorage) and posted to the API.
export type EnquiryItem = {
  slug: string;
  name: string;
  variant?: string | null;
  quantity: number;
};

export type EnquiryPayload = {
  name: string;
  company?: string | null;
  country: string;
  destination: string;
  remarks?: string | null;
  items: EnquiryItem[];
  channel: 'whatsapp' | 'email';
  locale: Locale;
};
