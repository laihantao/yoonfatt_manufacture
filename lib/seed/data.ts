import type { Locale, Spec, ProductVariant, ProductImage } from '@/lib/types';

// ── Seed content ──────────────────────────────────────────────
// Used to render the site before Supabase is wired, and as the
// source the seed script (scripts/seed.ts) will push into the DB.
// Products intentionally include some with only EN translations to
// demonstrate the EN-fallback rule on ms/zh.

type Translated<T> = { en: T } & Partial<Record<Locale, T>>;

export type SeedCategory = {
  slug: string;
  sortOrder: number;
  name: Translated<string>;
};

export type SeedProduct = {
  slug: string;
  sku?: string;
  categorySlug: string;
  price?: number | null;
  displayPrice: boolean;
  isFeatured: boolean;
  sortOrder: number;
  images: ProductImage[];
  variants: ProductVariant[];
  name: Translated<string>;
  description: Translated<string>;
  specs: Translated<Spec[]>;
};

function img(text: string, color = '27532e'): ProductImage {
  // .png is required — placehold.co defaults to SVG, which next/image blocks.
  return {
    url: `https://placehold.co/900x900/${color}/ffffff.png?text=${encodeURIComponent(text)}`,
    alt: text,
  };
}

export const seedCategories: SeedCategory[] = [
  { slug: 'sprayer', sortOrder: 1, name: { en: 'Sprayer', ms: 'Penyembur', zh: '喷雾器' } },
  { slug: 'spray-nozzles', sortOrder: 2, name: { en: 'Spray Nozzles', ms: 'Muncung Penyembur', zh: '喷嘴' } },
  { slug: 'connector-adaptor', sortOrder: 3, name: { en: 'Connector & Adaptor', ms: 'Penyambung & Penyesuai', zh: '接头与转接器' } },
  { slug: 'accessories', sortOrder: 4, name: { en: 'Accessories', ms: 'Aksesori', zh: '配件' } },
  { slug: 'optional-parts', sortOrder: 5, name: { en: 'Optional Parts', ms: 'Bahagian Pilihan', zh: '选配零件' } },
  { slug: 'washer-o-ring', sortOrder: 6, name: { en: 'Washer & O-Ring', ms: 'Gelang & O-Ring', zh: '垫圈与 O 型圈' } },
];

export const seedProducts: SeedProduct[] = [
  {
    slug: 'sofa-knapsack-sprayer',
    sku: 'SF-KS-16',
    categorySlug: 'sprayer',
    price: 189.0,
    displayPrice: true,
    isFeatured: true,
    sortOrder: 1,
    images: [img('SOFA Knapsack Sprayer'), img('SOFA Sprayer Side', '2f6837'), img('SOFA Sprayer Detail', '3f8248')],
    variants: [
      { label: '14L', sku: 'SF-KS-14' },
      { label: '16L', sku: 'SF-KS-16' },
      { label: '20L', sku: 'SF-KS-20' },
    ],
    name: {
      en: 'SOFA Knapsack Sprayer',
      ms: 'Penyembur Galas SOFA',
      zh: 'SOFA 背负式喷雾器',
    },
    description: {
      en: 'The flagship SOFA manual knapsack sprayer, engineered for durability in demanding plantation and agricultural use. Comfortable padded straps, high-pressure pump, and long-lasting spare part support.',
      ms: 'Penyembur galas manual SOFA yang menjadi kebanggaan kami, direka untuk ketahanan dalam kegunaan ladang dan pertanian yang mencabar. Tali berlapik selesa, pam tekanan tinggi dan sokongan alat ganti yang tahan lama.',
      zh: '我们的旗舰 SOFA 手动背负式喷雾器，专为严苛的种植园与农业作业打造，坚固耐用。配备舒适的加厚背带、高压泵浦，以及持久的配件支持。',
    },
    specs: {
      en: [
        { label: 'Tank capacity', value: '14L / 16L / 20L' },
        { label: 'Material', value: 'High-density polyethylene' },
        { label: 'Pump type', value: 'Manual lever, high pressure' },
        { label: 'Working pressure', value: '2 – 4 bar' },
      ],
      zh: [
        { label: '水箱容量', value: '14升 / 16升 / 20升' },
        { label: '材质', value: '高密度聚乙烯' },
        { label: '泵浦类型', value: '手动杠杆式，高压' },
        { label: '工作压力', value: '2 – 4 巴' },
      ],
    },
  },
  {
    slug: 'adjustable-fan-jet-nozzle',
    sku: 'SF-NZ-AFJ',
    categorySlug: 'spray-nozzles',
    price: 12.5,
    displayPrice: false,
    isFeatured: true,
    sortOrder: 2,
    images: [img('Adjustable Fan Jet Nozzle', '3f8248')],
    variants: [],
    // EN only — ms/zh should fall back to EN on the storefront.
    name: { en: 'Adjustable Fan Jet Nozzle' },
    description: {
      en: 'Brass adjustable fan jet nozzle producing an even fan spray pattern. Adjust from a fine mist to a solid jet for versatile field application.',
    },
    specs: {
      en: [
        { label: 'Material', value: 'Brass' },
        { label: 'Pattern', value: 'Adjustable fan / jet' },
        { label: 'Thread', value: 'Standard lance thread' },
      ],
    },
  },
  {
    slug: 'brass-trigger-valve',
    sku: 'SF-TV-01',
    categorySlug: 'accessories',
    price: 24.0,
    displayPrice: false,
    isFeatured: true,
    sortOrder: 3,
    images: [img('Brass Trigger Valve', '2f6837')],
    variants: [],
    name: { en: 'Brass Trigger Valve', ms: 'Injap Pencetus Loyang', zh: '铜制扳机阀' },
    description: {
      en: 'Heavy-duty brass trigger valve with comfortable grip and reliable shut-off. A long-lasting replacement part for knapsack sprayers.',
      zh: '重型铜制扳机阀，握感舒适、关闭可靠，是背负式喷雾器耐用的更换配件。',
    },
    specs: {
      en: [
        { label: 'Material', value: 'Brass' },
        { label: 'Connection', value: 'Hose + lance thread' },
      ],
    },
  },
  {
    slug: 'lance-extension-tube',
    sku: 'SF-LN-60',
    categorySlug: 'accessories',
    price: null,
    displayPrice: false,
    isFeatured: false,
    sortOrder: 4,
    images: [img('Lance Extension Tube', '224327')],
    variants: [
      { label: '45cm' },
      { label: '60cm' },
      { label: '90cm' },
    ],
    name: { en: 'Lance Extension Tube', ms: 'Tiub Sambungan Lans', zh: '喷杆延长管' },
    description: {
      en: 'Durable spray lance extension tube for extended reach when spraying tall crops or trees. Available in multiple lengths.',
    },
    specs: {
      en: [
        { label: 'Lengths', value: '45cm / 60cm / 90cm' },
        { label: 'Material', value: 'Brass / stainless' },
      ],
    },
  },
  {
    slug: 'hose-connector-adaptor',
    sku: 'SF-CN-12',
    categorySlug: 'connector-adaptor',
    price: 6.0,
    displayPrice: false,
    isFeatured: false,
    sortOrder: 5,
    images: [img('Hose Connector Adaptor', '3f8248')],
    variants: [],
    name: { en: 'Hose Connector & Adaptor', ms: 'Penyambung & Penyesuai Hos', zh: '软管接头与转接器' },
    description: {
      en: 'Quick-fit hose connector and adaptor set to join spray hoses and lances securely without leaks.',
    },
    specs: { en: [{ label: 'Material', value: 'Nylon / brass' }] },
  },
  {
    slug: 'pump-piston-repair-kit',
    sku: 'SF-OP-PK',
    categorySlug: 'optional-parts',
    price: null,
    displayPrice: false,
    isFeatured: false,
    sortOrder: 6,
    images: [img('Pump Piston Repair Kit', '27532e')],
    variants: [],
    name: { en: 'Pump Piston Repair Kit', ms: 'Kit Baik Pulih Piston Pam', zh: '泵浦活塞维修套件' },
    description: {
      en: 'Complete piston repair kit to restore pump pressure. Includes piston, seals and washers for common SOFA knapsack models.',
    },
    specs: { en: [{ label: 'Fits', value: 'SOFA knapsack sprayers' }] },
  },
  {
    slug: 'o-ring-seal-set',
    sku: 'SF-WR-OR',
    categorySlug: 'washer-o-ring',
    price: 3.5,
    displayPrice: false,
    isFeatured: false,
    sortOrder: 7,
    images: [img('O-Ring Seal Set', '2f6837')],
    variants: [],
    name: { en: 'O-Ring & Washer Seal Set', ms: 'Set Gelang O-Ring', zh: 'O 型圈与垫圈套装' },
    description: {
      en: 'Assorted O-ring and washer seal set for maintenance and leak prevention across sprayer joints.',
    },
    specs: { en: [{ label: 'Material', value: 'Nitrile rubber' }] },
  },
  {
    slug: 'cone-mist-nozzle',
    sku: 'SF-NZ-CM',
    categorySlug: 'spray-nozzles',
    price: 9.0,
    displayPrice: false,
    isFeatured: false,
    sortOrder: 8,
    images: [img('Cone Mist Nozzle', '3f8248')],
    variants: [],
    name: { en: 'Cone Mist Nozzle', ms: 'Muncung Kabus Kon', zh: '锥形雾化喷嘴' },
    description: {
      en: 'Hollow-cone mist nozzle for fine, even coverage — ideal for pesticide and foliar application.',
    },
    specs: { en: [{ label: 'Pattern', value: 'Hollow cone mist' }] },
  },
];

// ── Site settings seed ────────────────────────────────────────

export const seedCompanyInfo = {
  name: 'Yoon Fatt Industries (M) Sdn. Bhd.',
  co_no: '198701006304 (164975-A)',
  phone: '+60 7-772 4341',
  fax: '+60 7-772 3499',
  // TEMP: user's own number for testing. Finalize to 60127125933 before launch.
  whatsapp_number: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '60187629696',
  // TEMP: developer email until the real company inbox is confirmed.
  email: process.env.NEXT_PUBLIC_COMPANY_EMAIL || 'laihantao.dev@gmail.com',
  address: '16, Jalan Jati, 86000 Kluang, Johor, Malaysia',
  opening_hours: 'Mon – Fri: 8:00 – 17:00\nSat, Sun & Public Holidays: Closed',
  facebook_url: 'https://www.facebook.com/',
  map_embed_url:
    'https://www.google.com/maps?q=16+Jalan+Jati+86000+Kluang+Johor+Malaysia&output=embed',
};

export const seedAboutContent: Record<Locale, { paragraphs: string[] }> = {
  en: {
    paragraphs: [
      'Founded in 1949, Yoon Fatt Industries (M) Sdn. Bhd. is a Malaysian manufacturer of agriculture sprayers and spare parts, best known for our flagship SOFA brand of knapsack sprayers.',
      'From our factory in Kluang, Johor, we manufacture and export durable, affordable spraying equipment to customers across Asia and Africa.',
      'Three generations of manufacturing experience stand behind every product — built to last, backed by long-lasting spare part support.',
    ],
  },
  ms: {
    paragraphs: [
      'Ditubuhkan pada tahun 1949, Yoon Fatt Industries (M) Sdn. Bhd. ialah pengeluar penyembur pertanian dan alat ganti dari Malaysia, terkenal dengan jenama utama kami SOFA untuk penyembur galas.',
      'Dari kilang kami di Kluang, Johor, kami mengeluarkan dan mengeksport peralatan penyembur yang tahan lama dan berpatutan kepada pelanggan di seluruh Asia dan Afrika.',
      'Tiga generasi pengalaman pembuatan menyokong setiap produk — dibina untuk tahan lama, disokong dengan bekalan alat ganti yang berkekalan.',
    ],
  },
  zh: {
    paragraphs: [
      'Yoon Fatt Industries (M) Sdn. Bhd. 创立于 1949 年，是马来西亚的农业喷雾器及配件制造商，以旗舰品牌 SOFA 背负式喷雾器最为人熟知。',
      '我们从柔佛居銮的工厂制造并出口耐用、实惠的喷雾设备，服务遍及亚洲与非洲的客户。',
      '三代人的制造经验是每一件产品的后盾 —— 坚固耐用，并有持久的配件供应作支持。',
    ],
  },
};

export const seedShippingFaq: Record<Locale, { question: string; answer: string }[]> = {
  en: [
    { question: 'What is the minimum order quantity (MOQ)?', answer: 'TODO: MOQ varies by product. Please send an enquiry for details.' },
    { question: 'What are your lead times?', answer: 'TODO: Typical lead time is X weeks depending on quantity and destination.' },
    { question: 'Do you ship by sea and air?', answer: 'TODO: Yes — we arrange sea and air freight. Delivery fees depend on destination and volume.' },
  ],
  ms: [
    { question: 'Apakah kuantiti pesanan minimum (MOQ)?', answer: 'TODO: MOQ berbeza mengikut produk. Sila hantar pertanyaan untuk butiran.' },
    { question: 'Berapa lama masa penghantaran?', answer: 'TODO: Masa penghantaran biasa ialah X minggu bergantung pada kuantiti dan destinasi.' },
    { question: 'Adakah anda menghantar melalui laut dan udara?', answer: 'TODO: Ya — kami menguruskan penghantaran laut dan udara. Kos bergantung pada destinasi dan volum.' },
  ],
  zh: [
    { question: '最低起订量（MOQ）是多少？', answer: 'TODO：MOQ 因产品而异，请发送询价以获取详情。' },
    { question: '交货周期是多久？', answer: 'TODO：一般交货周期约为 X 周，视数量与目的地而定。' },
    { question: '你们提供海运和空运吗？', answer: 'TODO：可以 —— 我们可安排海运与空运，费用视目的地与体积而定。' },
  ],
};
