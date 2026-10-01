# Plano — Home (Listagem de produtos)

Spec: [`specs/home.md`](../../specs/home.md) · Depende da Fase 0 em [00-orquestracao.md](./00-orquestracao.md)

## Objetivo
Home pública listando todos os produtos com paginação por infinite scroll, mais um endpoint para cadastrar produtos manualmente.

## Banco de dados
Migration `20261001120000_create_products.sql`. **Criada e aplicada pelo orquestrador na Fase 0**, porque o feedback depende dela, mas o schema é definido aqui:

```sql
create table public.products (
  id text primary key,                       -- nanoid gerado na API
  name text not null check (length(trim(name)) > 0),
  description text,
  image_url text not null,                   -- ver ponto para decisão 1
  external_link text not null,
  score numeric(2,1),                        -- média 1.0–5.0; null = sem avaliações (ver ponto 2)
  feedbacks_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_created_at_id_idx on public.products (created_at desc, id desc);
create trigger products_set_updated_at before update on public.products
  for each row execute function public.set_updated_at();   -- função já existe (migration de accounts)
alter table public.products enable row level security;   -- sem policies, como accounts
```

## Backend

1. **`src/lib/validation/products.ts`**:
   - `listProductsSchema`: `cursor` opcional (string opaca) e `limit` (1–50, padrão 12).
   - `createProductSchema`: `name` (1–120), `description` opcional (≤ 1000), `externalLink` (`z.url()` só http/https), `imageUrl` (`z.url()` só https).
2. **`src/server/routers/products.ts`** (o `byId` já vem da Fase 0):
   - `list` (query pública): **paginação por cursor** em `(created_at desc, id desc)`. O cursor é `base64url("<created_at>|<id>")`. Busca `limit + 1` linhas para saber se existe próxima página. Retorna `{ items: ProductCard[], nextCursor: string | null }`, em que `ProductCard = { id, name, description, imageUrl, score, feedbacksCount }`.
   - `create` (mutation): gera o `id` com `nanoid()`, insere e retorna o produto. A autorização acontece no route handler (abaixo).
3. **`src/app/api/v1/products/route.ts`**:
   - `GET`: lê `cursor`/`limit` da query string → **200** com `{ items, nextCursor }`. Sem produtos → `{ items: [], nextCursor: null }`. Parâmetro inválido → 400.
   - `POST`: exige o header `x-api-key` igual a `ADMIN_API_KEY` (comparado com `timingSafeEqual`); sem a chave ou com a chave errada → 401. Body com `name`, `description?`, `external_link`, `image_url` (snake_case no REST, convertido para camelCase antes de chamar a procedure). Sucesso → **201**; validação → 400 com `fieldErrors`.
4. **`supabase/seed.sql`**: cerca de 30 produtos de exemplo, com imagens do Unsplash, para dar para testar o infinite scroll. Para os dados atuais, o agent insere esses produtos chamando o `POST` (sem `db reset`).

## Frontend

1. **`next.config.ts`**: `images.remotePatterns` com `https` (`images.unsplash.com` + hostname `**` enquanto o cadastro for manual). Ver ponto para decisão 1.
2. **`src/app/(platform)/page.tsx`** (server component):
   - Hero curto: título ("Descubra o que vale a pena", por exemplo) + subtítulo.
   - Pré-carrega a primeira página no servidor (`createCaller` + `HydrationBoundary` do TanStack, ou `initialData`), para o conteúdo aparecer sem esperar o JS (requisito de performance).
3. **`src/app/(platform)/_components/product-grid.tsx`** (client):
   - `useInfiniteQuery(trpc.products.list.infiniteQueryOptions({ limit: 12 }, { getNextPageParam: (p) => p.nextCursor }))`.
   - Sentinela com `IntersectionObserver` (`rootMargin: "400px"`) chama `fetchNextPage` antes de chegar ao fim. Botão "Carregar mais" como alternativa acessível.
   - Grid responsivo: 1 coluna no mobile, 2 no `sm`, 3 no `lg`, 4 no `xl`.
   - Estados: skeleton de cards no carregamento, skeletons extras durante o `fetchNextPage`, vazio com ilustração + texto, erro com "Tentar de novo", e um fim de lista discreto ("Você viu todos os produtos").
4. **`src/app/(platform)/_components/product-card.tsx`**:
   - Imagem 4:3 com `next/image` (`sizes` por breakpoint; `priority` só nos primeiros 4), nome (`line-clamp-2`), descrição (`line-clamp-2`) e uma linha com a nota média e a quantidade de avaliações ("Sem avaliações" quando `score` for null).
   - O card inteiro é um `<Link href={`/products/${id}`}>`. A spec pede navegar ao clicar no nome, mas o card todo clicável é o padrão esperado e o nome continua sendo o texto do link. Hover com leve elevação e zoom suave na imagem, respeitando `prefers-reduced-motion`.

## Verificação
- `curl GET /api/v1/products` (vazio e com dados), paginação seguindo `nextCursor` até `null`, sem repetir nem pular itens.
- `curl POST /api/v1/products`: sem chave → 401, body inválido → 400, válido → 201.
- Navegador: grid em 390/768/1440, scroll carrega as páginas seguintes (conferir no network que vai `cursor`), clique no card vai para `/products/:id` (a página é do agent feedback; se ainda não existir, o 404 é esperado).
- Lighthouse rápido na home (LCP / CLS) + `bunx biome check` nos arquivos do agent + `bunx tsc --noEmit`.

## Fora do escopo
Busca, filtros, ordenação, UI de cadastro de produto, upload de imagem para o Storage.

## Pontos para decisão
1. **Imagem:** a spec pede `POST` com "imagem", mas a tabela não tem a coluna. **Recomendação:** coluna `image_url text not null` recebendo uma URL. Alternativa: upload para o Supabase Storage (bucket público), que é mais trabalho e pede multipart no endpoint.
2. **`score: boolean`:** parece erro de digitação, porque um booleano não representa nota. **Recomendação:** `score numeric(2,1)` com a média das avaliações + `feedbacks_count`, mantidos por trigger na tabela de feedbacks (criada pela migration do feedback). Assim a home mostra a nota sem precisar agregar a cada request.
3. **Proteção do `POST /products`:** a spec não diz nada. Deixar aberto permite que qualquer pessoa cadastre produtos. **Recomendação:** header `x-api-key` com `ADMIN_API_KEY`.
4. **Formato da resposta do GET:** a spec fala em "array vazio". Para paginar é preciso o cursor, então **recomendação:** `{ items: [], nextCursor: null }`.
5. **Rota do POST:** a spec diz `/products`. **Recomendação:** `/api/v1/products`, no mesmo padrão versionado dos outros endpoints (o GET da spec já usa `/api/v1/products`).
