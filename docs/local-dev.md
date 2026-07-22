# Testar localmente com Docker (sem conta na nuvem)

Isso sobe um Supabase completo (Postgres, Auth, Realtime, Storage, Studio) na sua máquina via Docker, orquestrado pela CLI do Supabase — nenhuma conta ou projeto na nuvem é necessário só para testar.

## Pré-requisitos

- **Docker Desktop instalado e aberto** ([docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)). No Windows, o instalador cuida do WSL2 automaticamente; normalmente pede para reiniciar o computador na primeira instalação.
- Node.js (já usado pelo resto do projeto).

Confirme que o Docker está rodando:

```bash
docker info
```

Se der erro, abra o app "Docker Desktop" e espere o ícone ficar "Running" antes de continuar.

## 1. Subir o Supabase local

Dentro de `liturgia-overlay/`:

```bash
npx supabase start
```

Na primeira vez, isso baixa as imagens Docker (pode demorar alguns minutos). Ao terminar, ele imprime algo assim:

```
API URL: http://127.0.0.1:54321
GraphQL URL: http://127.0.0.1:54321/graphql/v1
Studio URL: http://127.0.0.1:54323
anon key: eyJhbG...
service_role key: eyJhbG...
```

As migrações em `supabase/migrations/0001_init.sql` (tabelas, RLS, funções, bucket de imagens) já são aplicadas automaticamente nesse momento.

## 2. Configurar o `.env.local`

Crie `liturgia-overlay/.env.local` (não é commitado) com a **API URL** e a **anon key** impressas acima:

```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
```

## 3. Criar o usuário admin de teste

Abra o **Studio URL** (`http://127.0.0.1:54323`) no navegador — é a mesma interface do Supabase na nuvem, só que local:

1. **Authentication → Users → Add user** (e-mail/senha; não precisa confirmar e-mail no ambiente local).
2. **SQL Editor**, rode (trocando o e-mail):

   ```sql
   update public.profiles
   set role = 'admin'
   where id = (select id from auth.users where email = 'teste@exemplo.com');
   ```

## 4. Rodar o app

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000), entre com o usuário criado, e siga o checklist de verificação do [`runbook.md`](runbook.md#5-checklist-antes-do-primeiro-uso-ao-vivo) — criar template, arrastar no canvas, criar evento, preencher conteúdo, ativar mensagem, conferir `/overlay/[token]`.

## Comandos úteis

```bash
npx supabase status   # reimprime as URLs/keys se você fechar o terminal
npx supabase stop     # desliga os containers
npx supabase db reset # apaga os dados locais e reaplica as migrações do zero
```

## Quando estiver pronto pra ir pro ar de verdade

Este ambiente local é só para testes. Para a transmissão real, siga [`runbook.md`](runbook.md) (projeto Supabase na nuvem + deploy no Vercel) — os dados criados localmente não são os mesmos usados em produção.
