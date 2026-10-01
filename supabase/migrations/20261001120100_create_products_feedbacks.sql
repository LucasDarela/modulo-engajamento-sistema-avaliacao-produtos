create table public.products_feedbacks (
  id text primary key,
  score smallint not null check (score between 1 and 5),
  comment text not null check (length(trim(comment)) between 1 and 2000),
  created_at timestamptz not null default now(),
  created_by text not null references public.accounts (id) on delete cascade,
  product_id text not null references public.products (id) on delete cascade
);

create index products_feedbacks_product_created_idx
  on public.products_feedbacks (product_id, created_at desc);

create index products_feedbacks_created_by_idx
  on public.products_feedbacks (created_by);

-- Sem policies: só a service role (API) acessa a tabela
alter table public.products_feedbacks enable row level security;

-- Mantém products.score (média) e products.feedbacks_count em dia
create or replace function public.refresh_product_score()
returns trigger
language plpgsql
as $$
declare
  target_product_id text := coalesce(new.product_id, old.product_id);
begin
  update public.products
  set
    score = (
      select round(avg(f.score)::numeric, 1)
      from public.products_feedbacks f
      where f.product_id = target_product_id
    ),
    feedbacks_count = (
      select count(*)
      from public.products_feedbacks f
      where f.product_id = target_product_id
    )
  where id = target_product_id;
  return null;
end;
$$;

create trigger products_feedbacks_refresh_score
after insert or delete on public.products_feedbacks
for each row execute function public.refresh_product_score();
