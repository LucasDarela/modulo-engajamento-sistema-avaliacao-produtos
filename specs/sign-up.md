# Sign-up (Criação de conta)

## Escopo
Front-end, Back-end, Banco de dados.

## Contexto
Precisamos implementar o fluxo de criação de conta (sign-up) da aplicação. O usuário deverá fornecer:
- Primeiro nome
- Sobrenome
- Email
- Senha
- Confirmação de senha

## Requisitos funcionais
1. Precisamos adicionar validação no formulário na camada de cliente
    1. Caso formulário esteja valido podemos enviar a requisição para API
2. Os campos de nome e sobrenome devem ser separados e não podem estar vazios
3. O campo de email deve ser valido (padrão de email) e não pode ser duplicado
4. Precisamos criar uma nova conta no banco de dados na tabela `accounts`
    1. `id`: nanoid (gerado com `nanoid` na camada de API)
    2. `first_name`: string (recebido pelo usuário)
    3. `last_name`: string (recebido pelo usuário)
    4. `email`: string (recebido pelo usuário)
    5. `password`: text (hashed recebida pelo usuário)
    6. `created_at`: timestamp (gerado automaticamente)
    7. `updated_at`: timestamp (gerado automaticamente)
    8. `active`: boolean (true)
    9. `salt`: text (hashed)
5. A requisição deve ser um `POST` para `/api/v1/sign-up` e receber os dados como json no `BODY`
6. Caso tudo dê certo retornar `201` ou erros de acordo com a validação:
    1. `400`: Má formatação de dados
    2. `409`: Email já cadastrado

## Requisitos não funcionais
- Segurança: precisamos salvar as senhas de forma segura no banco de dados
    - Precisamos receber dados do cliente de forma segura usando HTTPS (para previnir network sniff)
- UI/UX: Boa experiencia de uso atraves de uma interface bonita, elegante e moderna
- Performance: A requisição deve ser rápida e eficiente

## Você deve
- Você deve criar a base do projeto com um endpoind inicial para criação de conta
- Criar a base do projeto com uma página inicial para a integrace de criacao de conta
- Configurar as bibliotecas base

## Você não deve
- Implementar qualquer outra funcionalidade que não esteja relacionada com sign-uo (criação de contas)
- Não vamos realizar nenhum envio de email no momento, apenas processar a requisição, salvar no banco de dados e retornar um sucesso

## Tecnologias (Stack)
React.js, Next.js, React-Hook-Form, Shadcn, Tailwind, Supabase, TRPC, Bunjs

## Critérios de aceitação
- Temos uma página para criar a nova conta em `/auth/sign-up``
- A página contem um formulario com validacao
- A plataforma consegue se comunicar com a API para enviar os dados a receber uma resposta
- Estamos informando possíveis erros
    - Mostrar um alert em vermelho no formulário
- Estamos informando o sucesso de criação da conta:
    - Navegar para `/auth/sign-up/success`
    
## Resultado esperado
Pessoas conseguem criar uma nova conta na plataforma