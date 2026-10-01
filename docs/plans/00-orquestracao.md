# Orquestração — execução paralela de sign-in, home e feedback

As três specs dependem umas das outras:

```
sign-in ──(sessão / protectedProcedure)──┐
                                          ├──> feedback
home ─────(tabela products / byId)───────┘
```

Elas também mexem nos mesmos arquivos (`_app.ts`, `database.types.ts`, `package.json`, layout). Para rodar os 3 agents **em paralelo** sem conflito, o orquestrador faz antes uma **Fase 0** que congela os contratos entre as features. Depois cada agent só edita os arquivos que são dele.

> O projeto não é um repositório git, então não dá para isolar com worktree. O isolamento vem da **posse de arquivos** (tabela abaixo).

---

## Fase 0 — Fundação (orquestrador, sequencial, antes dos agents)

1. **Dependências:** `bun add jose` (assinar o JWT da sessão, recomendado pelo guia de autenticação do Next 16). Adicionar `SESSION_SECRET` e `ADMIN_API_KEY` em `.env.local` (valores aleatórios) e em `.env.example` (vazios).
2. **Migrations** (timestamps reservados, aplicadas com `supabase migration up` no Supabase local):
   - `20261001120000_create_products.sql` (schema em [home.md](./home.md#banco-de-dados))
   - `20261001120100_create_products_feedbacks.sql` (schema em [feedback.md](./feedback.md#banco-de-dados))
   - Regenerar `src/server/database.types.ts` com `supabase gen types typescript --local` + `biome format`.
3. **Contrato de sessão** `src/server/session.ts` (stub com assinatura fixa, implementado pelo agent sign-in):
   ```ts
   export type Session = { accountId: string; firstName: string; lastName: string; email: string };
   export async function createSession(account: Session): Promise<void>;
   export async function deleteSession(): Promise<void>;
   export const getSession: () => Promise<Session | null>; // React cache()
   ```
4. **tRPC com contexto:** `createContext` passa a devolver `{ session: await getSession() }`; criar `protectedProcedure` (lança `UNAUTHORIZED` sem sessão e garante `ctx.session` não nulo). Ajustar `createCaller` em `api/v1/sign-up/route.ts` e `api/trpc/[trpc]/route.ts`.
5. **Registro de routers** em `_app.ts`: `auth`, `products`, `feedbacks`. Criar `products.ts` e `feedbacks.ts` vazios (`router({})`), menos `products.byId`, que já sai implementado (é o contrato que o feedback consome; a consulta é trivial).
6. **Layout da plataforma:** route group `src/app/(platform)/layout.tsx` renderizando `<SiteHeader />` (stub em `src/components/site-header.tsx`) + `{children}`. Mover a home para `src/app/(platform)/page.tsx` (stub com título) e apagar o redirect de `src/app/page.tsx`. As páginas `/auth/*` ficam fora do grupo (sem header, com o split screen).
7. **Dev server compartilhado:** `bun run dev` na porta 3000, em background, gerenciado pelo orquestrador.
8. **Checagem:** `bunx tsc --noEmit` e `bun run lint` passando antes de subir os agents.

---

## Posse de arquivos (quem pode editar o quê)

| Arquivo / área | Dono |
|---|---|
| `package.json`, `bun.lock`, `.env*`, `supabase/migrations/*`, `database.types.ts`, `_app.ts`, `src/server/trpc.ts`, `src/app/(platform)/layout.tsx` | **Orquestrador** (Fase 0). Agent que precisar mudar algo aqui **pede ao orquestrador** e não edita. |
| `src/server/session.ts`, `src/server/password.ts`, `src/server/routers/auth.ts`, `src/lib/validation/sign-in.ts`, `src/app/auth/**`, `src/app/api/v1/sign-in/**`, `src/components/site-header.tsx`, `src/components/user-menu.tsx`, `src/components/auth-hero.tsx` | **sign-in** |
| `src/server/routers/products.ts` (exceto `byId`), `src/lib/validation/products.ts`, `src/app/(platform)/page.tsx`, `src/app/(platform)/_components/**`, `src/app/api/v1/products/route.ts`, `next.config.ts`, `supabase/seed.sql` | **home** |
| `src/server/routers/feedbacks.ts`, `src/lib/validation/feedback.ts`, `src/app/(platform)/products/[id]/**`, `src/app/api/v1/products/[id]/feedbacks/**`, `src/components/score-input.tsx`, `src/components/score-display.tsx` | **feedback** |
| `src/components/ui/*` (shadcn) | Qualquer um pode **adicionar** componente novo com `bunx shadcn add`; ninguém altera os que já existem. |

## Regras para os agents

- Ler `AGENTS.md` e a doc do Next em `node_modules/next/dist/docs/` antes de codar (Next 16: `cookies()` é async, middleware agora se chama `proxy.ts`).
- Carregar a skill `frontend-design` e seguir a identidade visual do projeto: índigo/violeta, marca "Avalia", Schibsted Grotesk, tokens de `globals.css`.
- **Não** rodar `next build` nem subir outro `next dev`: isso derruba o `.next` compartilhado. Usar o servidor em `http://localhost:3000` e abrir uma aba própria no chrome-devtools.
- Validar só os próprios arquivos: `bunx biome check <arquivos>` e `bunx tsc --noEmit`. Se o tsc acusar erro em arquivo de outro agent, reportar e não corrigir.
- Não rodar `supabase db reset` (apagaria os dados de teste dos outros).
- Ao terminar, entregar um relatório com: arquivos criados/alterados, como cada critério de aceitação foi verificado e qualquer desvio da spec.

## Fase 2 — Integração (orquestrador, depois dos 3 agents)

1. `bunx tsc --noEmit`, `bun run lint`, `bun run build`.
2. Teste ponta a ponta no navegador: cadastro → login → home com produtos (infinite scroll) → detalhe → enviar avaliação → logout → detalhe mostra o bloco de "entre para avaliar".
3. Testar a API REST com `curl`: `POST /api/v1/sign-in` (200/400/401), `GET /api/v1/products`, `POST /api/v1/products` (com e sem a chave), `POST /api/v1/products/:id/feedbacks` (401/400/201).
4. Revisão final (`ecc:code-reviewer` + `ecc:security-reviewer` nos arquivos de auth) e correção do que aparecer.
