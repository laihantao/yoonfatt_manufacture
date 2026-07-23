-- ─────────────────────────────────────────────────────────────
-- Yoon Fatt — initial schema
-- Run in the Supabase SQL editor (or `supabase db push`).
-- ─────────────────────────────────────────────────────────────

create extension if not exists "pgcrypto";

-- Auto-update updated_at on any row change.
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── categories ────────────────────────────────────────────────
create table categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger categories_updated before update on categories
  for each row execute function set_updated_at();

create table category_translations (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories(id) on delete cascade,
  locale text not null check (locale in ('en','ms','zh')),
  name text not null,
  unique (category_id, locale)
);

-- ── products ──────────────────────────────────────────────────
create table products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  sku text,
  category_id uuid references categories(id) on delete set null,
  price numeric(10,2),
  display_price boolean not null default false,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger products_updated before update on products
  for each row execute function set_updated_at();
create index products_category_idx on products(category_id);

create table product_translations (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  locale text not null check (locale in ('en','ms','zh')),
  name text not null,
  description text,
  specs jsonb not null default '[]'::jsonb, -- array of {label, value}
  unique (product_id, locale)
);

create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  storage_path text not null, -- products/{product_slug}/{filename}
  alt text,
  sort_order int not null default 0
);
create index product_images_product_idx on product_images(product_id);

create table product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  label text not null, -- language-neutral, e.g. "14L"
  sku text,
  sort_order int not null default 0
);
create index product_variants_product_idx on product_variants(product_id);

-- ── site_settings (single row per key) ────────────────────────
create table site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
create trigger site_settings_updated before update on site_settings
  for each row execute function set_updated_at();

-- ── enquiries ─────────────────────────────────────────────────
create table enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text,
  country text,
  destination text,
  remarks text,
  items jsonb not null default '[]'::jsonb, -- array of {product_id, slug, name, variant, quantity}
  channel text not null check (channel in ('whatsapp','email')),
  handled boolean not null default false,
  created_at timestamptz not null default now()
);
create index enquiries_created_idx on enquiries(created_at desc);

-- ── promo_codes (SCHEMA ONLY — feature not built) ─────────────
create table promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  type text not null check (type in ('percent','fixed')),
  value numeric not null,
  min_spend numeric,
  starts_at timestamptz,
  expires_at timestamptz,
  usage_limit int,
  used_count int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────
alter table categories            enable row level security;
alter table category_translations enable row level security;
alter table products              enable row level security;
alter table product_translations  enable row level security;
alter table product_images        enable row level security;
alter table product_variants      enable row level security;
alter table site_settings         enable row level security;
alter table enquiries             enable row level security;
alter table promo_codes           enable row level security;

-- Public (anon) read of active catalog content + settings.
create policy "public read active categories" on categories
  for select using (is_active = true);
create policy "public read category translations" on category_translations
  for select using (true);
create policy "public read active products" on products
  for select using (is_active = true);
create policy "public read product translations" on product_translations
  for select using (true);
create policy "public read product images" on product_images
  for select using (true);
create policy "public read product variants" on product_variants
  for select using (true);
create policy "public read site settings" on site_settings
  for select using (true);

-- Public may submit enquiries only.
create policy "public insert enquiries" on enquiries
  for insert with check (true);

-- Authenticated admin: full CRUD on everything.
create policy "admin all categories" on categories
  for all to authenticated using (true) with check (true);
create policy "admin all category_translations" on category_translations
  for all to authenticated using (true) with check (true);
create policy "admin all products" on products
  for all to authenticated using (true) with check (true);
create policy "admin all product_translations" on product_translations
  for all to authenticated using (true) with check (true);
create policy "admin all product_images" on product_images
  for all to authenticated using (true) with check (true);
create policy "admin all product_variants" on product_variants
  for all to authenticated using (true) with check (true);
create policy "admin all site_settings" on site_settings
  for all to authenticated using (true) with check (true);
create policy "admin all enquiries" on enquiries
  for all to authenticated using (true) with check (true);
create policy "admin all promo_codes" on promo_codes
  for all to authenticated using (true) with check (true);

-- ─────────────────────────────────────────────────────────────
-- Storage bucket: product-images (public read, authenticated write)
-- ─────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "public read product-images" on storage.objects
  for select using (bucket_id = 'product-images');
create policy "admin write product-images" on storage.objects
  for insert to authenticated with check (bucket_id = 'product-images');
create policy "admin update product-images" on storage.objects
  for update to authenticated using (bucket_id = 'product-images');
create policy "admin delete product-images" on storage.objects
  for delete to authenticated using (bucket_id = 'product-images');
