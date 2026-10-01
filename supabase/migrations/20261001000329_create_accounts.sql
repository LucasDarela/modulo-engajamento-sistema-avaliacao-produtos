create table public.accounts (
  id text primary key,
  first_name text not null check (length(trim(first_name)) > 0),
  last_name text not null check (length(trim(last_name)) > 0),
  email text not null,
  password text not null,
  salt text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Email é único sem diferenciar maiúsculas/minúsculas
create unique index accounts_email_unique on public.accounts (lower(email));

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger accounts_set_updated_at
before update on public.accounts
for each row execute function public.set_updated_at();

-- Sem policies: só a service role (API) acessa a tabela; anon/authenticated ficam bloqueados
alter table public.accounts enable row level security;
