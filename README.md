# Liturgia Overlay

Sistema para substituir o fluxo manual de camadas no Photoshop usado para exibir textos litúrgicos na transmissão da Missa pelo OBS Studio.

- **Admin**: monta templates (Missa, Grupo de Oração, Palestra) com os "momentos" de exibição — posição na tela, cor de fundo, imagem fixa e campos de texto de cada um.
- **Operador**: preenche o conteúdo de texto de um evento (uma Missa específica) sem poder alterar a estrutura do template.
- **Controle ao vivo**: escolhe qual mensagem está visível no momento durante a transmissão.
- **Overlay** (`/overlay/[token]`): página pública de fundo transparente, usada como Browser Source no OBS, atualizada automaticamente em tempo real.

Ver o plano de arquitetura completo em [`docs/architecture.md`](docs/architecture.md).

## Stack

Next.js 16 (App Router) + Supabase (Postgres, Auth, Realtime, Storage), hospedado no Vercel.

## Desenvolvimento local

Duas opções:

- **Com Docker, 100% local, sem criar conta em nada** — ver [`docs/local-dev.md`](docs/local-dev.md). Recomendado para testar antes de decidir hospedar de verdade.
- **Contra um projeto Supabase na nuvem** (mesmo fluxo usado em produção):
  1. Criar um projeto gratuito em [supabase.com](https://supabase.com).
  2. Copiar `.env.example` para `.env.local` e preencher com a URL e a anon key do projeto (Settings > API).
  3. Rodar as migrações em `supabase/migrations/` no SQL Editor do Supabase.

Em ambos os casos, depois é só instalar as dependências e subir o servidor:

```bash
npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

Guia completo de configuração do OBS Browser Source e deploy em produção: [`docs/obs-setup.md`](docs/obs-setup.md) e [`docs/runbook.md`](docs/runbook.md).
