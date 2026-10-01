# Plano — Feedback (Avaliações de produto)

Spec: [`specs/feedback.md`](../../specs/feedback.md) · Depende da Fase 0 em [00-orquestracao.md](./00-orquestracao.md)

## Objetivo
Página pública de detalhe do produto (`/products/[id]`) com as informações do produto, a lista de avaliações e, para quem está logado, um formulário de nova avaliação (nota de 1 a 5 + comentário). Para quem não está logado, a página mostra um bloco pedindo para entrar.

## Banco de dados
Migration `20261001120100_create_products_feedbacks.sql`. **Criada e aplicada pelo orquestrador na Fase 0**, mas o schema é definido aqui:

```sql
create table public.products_feedbacks (
  id text primary key,                                         -- nanoid
  score smallint not null check (score between 1 and 5),
  comment text not null check (length(trim(comment)) between 1 and 2000),
  created_at timestamptz not null default now(),
  created_by text not null references public.accounts (id) on delete cascade,
  product_id text not null references public.products (id) on delete cascade
);
create index products_feedbacks_product_created_idx
  on public.products_feedbacks (product_id, created_at desc);
alter table public.products_feedbacks enable row level security;   -- sem policies

-- Mantém products.score (média) e products.feedbacks_count atualizados
create function public.refresh_product_score() returns trigger language plpgsql as $$
begin
  update public.products p set
    score = (select round(avg(score)::numeric, 1) from public.products_feedbacks where product_id = p.id),
    feedbacks_count = (select count(*) from public.products_feedbacks where product_id = p.id)
  where p.id = coalesce(new.product_id, old.product_id);
  return null;
end; $$;
create trigger products_feedbacks_refresh_score
  after insert or delete on public.products_feedbacks
  for each row execute function public.refresh_product_score();
```

## Backend

1. **`src/lib/validation/feedback.ts`**: `createFeedbackSchema` com `productId` (string não vazia), `score` (`z.int().min(1).max(5)`, mensagem "Escolha uma nota de 1 a 5") e `comment` (trim, 1–2000, mensagem "Conte um pouco sobre sua experiência").
2. **`src/server/routers/feedbacks.ts`**:
   - `listByProduct` (query pública): `{ productId }` → avaliações em ordem `created_at desc`, com o autor via join (`author:accounts(first_name,last_name)`). Retorna **só** id, score, comment, createdAt e `author { firstName, lastName }`. Nunca email nem senha.
   - `create` (**`protectedProcedure`** da Fase 0): confere se o produto existe (`NOT_FOUND`), insere com `id: nanoid()` e `created_by: ctx.session.accountId`, e retorna a avaliação criada já no formato da lista.
3. **`src/app/api/v1/products/[id]/feedbacks/route.ts`** (REST, no mesmo padrão dos outros): `POST` com JSON `{ score, comment }` → 201; sem sessão → 401; validação → 400; produto inexistente → 404. `GET` → 200 com a lista (array, vazio se não houver avaliações).
4. O produto é lido com `products.byId`, já entregue na Fase 0.

## Frontend

1. **`src/app/(platform)/products/[id]/page.tsx`** (server component; `params` é uma Promise no Next 16):
   - Em paralelo (`Promise.all`): `products.byId`, `feedbacks.listByProduct` e `getSession()`. Produto inexistente → `notFound()`.
   - `generateMetadata` com o nome do produto.
   - **Topo do produto:** imagem grande (`next/image`, `priority`), nome, descrição, a média em destaque (por exemplo "4,3" com estrelas e "12 avaliações"), um mini histograma de distribuição 5→1 (calculado da lista) e o botão "Ver na loja" (`external_link`, `target="_blank" rel="noopener noreferrer"`). Layout em 2 colunas no desktop, empilhado no mobile.
   - **Seção "Avaliações":** a lista primeiro e o formulário depois, como pede a spec.
   - `not-found.tsx` com um estado elegante e um link de volta para a home.
2. **`_components/feedback-list.tsx`**: cada item tem avatar Dicebear (iniciais do autor, como no header), nome, data relativa (`date-fns` `formatDistanceToNow` com locale `ptBR`), estrelas e comentário (preservando as quebras de linha). Lista vazia: "Seja a primeira pessoa a avaliar este produto."
3. **`_components/feedback-form.tsx`** (client, só renderizado com sessão):
   - React Hook Form + `zodResolver`. `ScoreInput` acessível (um `radiogroup` de 5 estrelas, navegável por setas, com hover e foco visíveis e um rótulo textual da nota: "Péssimo"… "Excelente"). Textarea com contador de caracteres.
   - `trpc.feedbacks.create` → sucesso: limpa o formulário, mostra uma confirmação inline e chama `router.refresh()` para atualizar a lista e a média (o server component busca tudo de novo). Erro → `Alert` vermelho.
4. **`_components/sign-in-prompt.tsx`** (sem sessão): um card com ícone, "Entre para avaliar este produto" e os botões "Entrar" (`/auth/sign-in`) e "Criar conta" (`/auth/sign-up`).
5. **`src/components/score-display.tsx`** e **`score-input.tsx`**: estrelas reutilizáveis, com estrela parcial para médias como 4,3.

## Verificação
- Inserir um produto de teste direto no banco (`supabase` local) se a home ainda não tiver feito o seed.
- `curl POST /api/v1/products/:id/feedbacks`: sem cookie → 401; com o cookie de uma sessão válida (depois que o sign-in estiver pronto, ou na integração) → 201; score 0 ou 6 → 400; id inexistente → 404.
- Conferir no banco que `products.score` e `feedbacks_count` mudam depois de cada insert (trigger).
- Navegador 390/1440: deslogado vê lista + bloco de login; logado vê lista + formulário; enviar uma avaliação atualiza a lista e a média sem recarregar a página inteira; uso só pelo teclado no `ScoreInput`.
- `bunx biome check` nos arquivos do agent + `bunx tsc --noEmit`.

> O teste logado depende da sessão real do agent sign-in, que roda em paralelo. Se ela ainda não estiver pronta, o agent valida a proteção (401) e o estado deslogado, e o caminho logado fica para a Fase 2 com o orquestrador.

## Fora do escopo
Editar ou excluir avaliações, paginação das avaliações, moderação, curtidas/respostas, envio de email.

## Pontos para decisão
1. **Uma avaliação por pessoa por produto?** A spec não diz. **Recomendação:** permitir várias por enquanto (fiel à spec). Se quiser limitar, basta um `unique (product_id, created_by)` + 409 no endpoint.
2. **Paginação das avaliações:** a spec pede "listar todas". **Recomendação:** listar todas agora; paginar quando o volume justificar.
