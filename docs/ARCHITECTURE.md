# Arquitetura do Projeto
## Front-end
Vamos utilizar as seguintes bibliotecas principais:
- Typescript: Linguagem principal de desenvolvimento com tipagem
- Next.js: Framework para criação e gestão de interfaces
- React.js: Biblioteca para criação e componentização de interfaces
- Biome: Validação/formatação/correção de código (Linter e formatter)
- TailwindCSS: Framework para estilização rápida de interfaces
- Date-fns: Biblioteca para manipulação de datas/hora
- Lucide-React: Biblioteca de ícones
- Shadcn UI: Componentização base (design system)
- React Query: Criação e gestão de queries para ler dados da API e mutations para alterar dados
- React Hook Form: Gestão de estado e submissão de formulários
- Zod: Validação de formulários (schemas compartilhados com o back-end)

## Back-end
Vamos utilizar as seguintes bibliotecas principais:
- Typescript: Linguagem principal de desenvolvimento com tipagem
- Next.js: Framework para criação de APIs
- Bcrypt: Geração de salt + hash da senha (https://www.npmjs.com/package/bcrypt)
- Mastra.ai: Criação e customização de agentes internos
- TRPC: Gestão de endpoints
- Zod: Validação dos dados de entrada da API (mesmos schemas do front-end)

## Runtime e gerenciador de pacotes
Bun: Instalação de dependências e execução de scripts (`bun install`, `bun run dev`)

## Banco de Dados
Supabase: PostgreSQL

## Infraestrutura
Vercel: Hospedar tanto servidor (API) quanto cliente (SPA).

## Automação
N8N: Criação de fluxos automatizados