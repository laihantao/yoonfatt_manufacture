-- ─────────────────────────────────────────────────────────────
-- Wave 2 — Articles / Resources knowledge base
-- Run in the Supabase SQL editor after 0001_init.sql.
-- ─────────────────────────────────────────────────────────────

create table articles (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  category text not null default 'product-guide',
  cover_path text,                    -- storage path in article-media bucket
  is_published boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger articles_updated before update on articles
  for each row execute function set_updated_at();
create index articles_published_idx on articles(is_published, sort_order);

create table article_translations (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references articles(id) on delete cascade,
  locale text not null check (locale in ('en','ms','zh')),
  title text not null,
  excerpt text,
  -- Ordered content blocks:
  -- [{type:'heading'|'paragraph', text}, {type:'image', path, caption?},
  --  {type:'gallery', images:[{path,caption?}]}, {type:'video', provider, src}]
  body jsonb not null default '[]'::jsonb,
  unique (article_id, locale)
);

-- ── RLS ───────────────────────────────────────────────────────
alter table articles enable row level security;
alter table article_translations enable row level security;

create policy "public read published articles" on articles
  for select using (is_published = true);
create policy "public read article translations" on article_translations
  for select using (true);

create policy "admin all articles" on articles
  for all to authenticated using (true) with check (true);
create policy "admin all article_translations" on article_translations
  for all to authenticated using (true) with check (true);

-- ── Storage bucket: article-media (images + video) ────────────
insert into storage.buckets (id, name, public)
values ('article-media', 'article-media', true)
on conflict (id) do nothing;

create policy "public read article-media" on storage.objects
  for select using (bucket_id = 'article-media');
create policy "admin write article-media" on storage.objects
  for insert to authenticated with check (bucket_id = 'article-media');
create policy "admin update article-media" on storage.objects
  for update to authenticated using (bucket_id = 'article-media');
create policy "admin delete article-media" on storage.objects
  for delete to authenticated using (bucket_id = 'article-media');
