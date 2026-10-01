create table public.products (
  id text primary key,
  name text not null check (length(trim(name)) > 0),
  description text,
  image_url text not null,
  external_link text not null,
  -- Média das avaliações (1.0–5.0); null enquanto não houver avaliações
  score numeric(2, 1),
  feedbacks_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Paginação por cursor em (created_at desc, id desc)
create index products_created_at_id_idx on public.products (created_at desc, id desc);

create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

-- Sem policies: só a service role (API) acessa a tabela
alter table public.products enable row level security;
