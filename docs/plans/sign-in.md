# Plano — Sign-In (Autenticação)

Spec: [`specs/sign-in.md`](../../specs/sign-in.md) · Depende da Fase 0 em [00-orquestracao.md](./00-orquestracao.md)

## Objetivo
Permitir que quem já tem conta entre com email e senha, com a sessão guardada em cookie, e mostrar no cabeçalho da plataforma o botão "Entrar" ou o avatar da pessoa logada.

## Decisões técnicas

| Tema | Decisão | Motivo |
|---|---|---|
| Sessão | JWT HS256 assinado com `jose`, em cookie `session` (`httpOnly`, `secure` em produção, `sameSite: lax`, `path: /`, 7 dias) | Padrão "stateless session" do guia de autenticação do Next 16; não precisa de tabela nova nem de uma consulta ao banco por request |
| Conteúdo do JWT | `sub` (accountId), `firstName`, `lastName`, `email`, `exp` | O header mostra nome e email sem consultar o banco (requisito de performance) |
| Leitura da sessão | `getSession()` com `cache()` do React: lê o cookie, roda `jwtVerify` e devolve `null` se o token for inválido ou estiver expirado | Uma verificação por render, reaproveitada pelo layout, pelas páginas e pelo tRPC |
| Verificação de senha | `bcrypt.compare`. Se o email não existir, compara com um hash fixo mesmo assim | Tempo de resposta igual para email inexistente e senha errada, para não dar pista de quais emails têm conta |
| Conta inativa (`active = false`) | Responde 401 com a mesma mensagem genérica | Não revela o estado da conta |
| Endpoint | Procedure tRPC `auth.signIn` usada pelo front + route handler REST `POST /api/v1/sign-in` delegando via `createCaller` | Mesmo padrão do sign-up (`api/v1/sign-up/route.ts`) |
| Cookie dentro do tRPC | `createSession()` chama `(await cookies()).set(...)`; funciona tanto em `/api/trpc` quanto em `/api/v1/sign-in` porque os dois são Route Handlers | Uma única implementação |
| Avatar | `https://api.dicebear.com/9.x/initials/svg?seed=<Nome Sobrenome>`, com `<img>` comum (o SVG externo exige `dangerouslyAllowSVG` no `next/image`) | Pedido da spec, sem configuração extra |

## Backend

1. **`src/lib/validation/sign-in.ts`**: `signInSchema` com `email` (trim, lowercase, `z.email`) e `password` (`min(1)`, sem regra de tamanho, para não revelar a política de senha no login). Exportar `SignInInput`.
2. **`src/server/password.ts`**: adicionar `verifyPassword(password, hash)` e a constante do hash fixo. *(Arquivo do sign-up; só o sign-in mexe nele.)*
3. **`src/server/session.ts`**: implementar o contrato da Fase 0 (`createSession`, `deleteSession`, `getSession`). Falhar com erro claro se `SESSION_SECRET` não estiver definido.
4. **`src/server/routers/auth.ts`**:
   - `signIn` (mutation): busca a conta por email (`ilike` ou `eq` com o email já em lowercase, usando o índice `lower(email)`), verifica a senha e chama `createSession`. Retorna `{ id, firstName, lastName, email }`. Falha → `TRPCError UNAUTHORIZED` com "Email ou senha inválidos.".
   - `signOut` (mutation): `deleteSession()`. *Ver ponto para decisão 1.*
   - `me` (query): devolve `ctx.session`.
5. **`src/app/api/v1/sign-in/route.ts`**: JSON inválido → 400; `ZodError` → 400 com `fieldErrors`; `UNAUTHORIZED` → 401; sucesso → **200** com os dados da conta e o `Set-Cookie`.

## Frontend

1. **`src/components/auth-hero.tsx`**: extrair o painel esquerdo (gradiente, features, depoimento) de `auth/sign-up/page.tsx` e reaproveitar nas duas telas, com título configurável. Atualizar o sign-up para usar o componente.
2. **`src/app/auth/sign-in/page.tsx` + `sign-in-form.tsx`**:
   - O mesmo split screen do sign-up (só no desktop; no mobile, só o formulário com o logo).
   - Campos email e senha (`PasswordInput` já existente), React Hook Form + `zodResolver(signInSchema)`, validação `onBlur` e depois `onChange`.
   - Botão com estado de carregamento; erro 401 → `Alert` vermelho (`variant="destructive"`) no topo do formulário com "Email ou senha inválidos.", e o foco volta para o campo de senha.
   - Sucesso → `router.replace("/")` + `router.refresh()`, para o header renderizar de novo já com a sessão.
   - Link "Ainda não tem conta? Criar conta" → `/auth/sign-up`. A tela de sucesso do sign-up já aponta para `/auth/sign-in`.
   - Se a pessoa já estiver logada e abrir `/auth/sign-in`, redireciona para `/` (checagem no server component da página).
3. **`src/components/site-header.tsx`** (server component): logo "Avalia" à esquerda, linkando para `/`. À direita, se `getSession()` vier vazio, botão "Entrar" (`/auth/sign-in`); se houver sessão, `<UserMenu />`. Sticky, com fundo translúcido e `backdrop-blur`, borda inferior sutil.
4. **`src/components/user-menu.tsx`** (client): avatar Dicebear + nome e sobrenome + email (o email some no mobile). Abre um menu (`bunx shadcn add dropdown-menu`) com o item "Sair", que chama `auth.signOut` e depois `router.refresh()`.
5. **Home esqueleto:** a spec pede uma home vazia, mas a Fase 0 já cria o stub e o agent **home** é o dono dela. O sign-in **não** mexe em `(platform)/page.tsx`.

## Verificação
- `curl` em `/api/v1/sign-in`: body inválido → 400; senha errada → 401; email inexistente → 401 com a mesma mensagem; credenciais corretas → 200 com `Set-Cookie: session=...; HttpOnly`.
- Navegador (desktop 1440 e mobile 390): erro de validação no cliente, alert vermelho no 401, login com sucesso leva para `/` com o avatar no header, "Sair" volta para o botão "Entrar".
- Cookie adulterado na mão → tratado como deslogado, sem erro 500.
- `bunx biome check` nos arquivos do agent + `bunx tsc --noEmit`.

## Fora do escopo
Recuperação de senha, "lembrar de mim", OAuth, rate limiting, proteção de rotas via `proxy.ts` (nenhuma rota é privada ainda; o feedback protege no endpoint e decide o bloco na própria página).

## Pontos para decisão
1. **Logout ("Sair")**: a spec não pede. Recomendo incluir: são 5 linhas e, sem ele, não dá para trocar de conta nem testar o estado deslogado. **Recomendação: incluir.**
2. **Redirect depois do login**: a spec pede ir para `/`. Voltar para a página de origem (por exemplo, o detalhe do produto) seria melhor UX, mas fica fora da spec. **Recomendação: seguir a spec (`/`).**
