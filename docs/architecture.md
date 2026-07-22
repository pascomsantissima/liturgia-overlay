# Arquitetura — Sistema de overlays ao vivo para transmissão da Missa

## Contexto

A pastoral de comunicação transmite a Missa ao vivo pelo YouTube via OBS Studio. Hoje, os textos exibidos na tela (avisos litúrgicos: leituras, salmo, avisos, etc.) são montados como camadas no Photoshop, e um operador precisa mostrar/ocultar camadas manualmente e salvar o arquivo para que o OBS capte a mudança. Como vários voluntários com conhecimento básico de Photoshop operam o sistema, isso gera erros frequentes.

O objetivo é substituir esse fluxo por uma aplicação web com três níveis de tela, separando quem pode mexer na estrutura visual (avançado/confiável) de quem só preenche texto (operador comum), e um terceiro nível que apenas liga/desliga qual mensagem está visível ao vivo — eliminando a edição manual de camadas e a exportação de arquivo.

Decisões confirmadas:
- **Hospedagem na internet** — operadores podem preparar conteúdo remotamente antes da Missa.
- **Integração com o OBS via Browser Source** — página web com fundo transparente, atualizada automaticamente em tempo real, sem exportar/salvar arquivo manualmente.

## Stack

**Next.js 16 (App Router, TypeScript) + Supabase (Postgres + Auth + Realtime + Storage), hospedado no Vercel.**

Por quê: nenhum servidor próprio para manter, camadas gratuitas do Vercel + Supabase cobrem o uso de uma paróquia, o Supabase Realtime resolve a sincronização ao vivo sem servidor de WebSocket próprio, e o modelo de dados é fortemente relacional (template → slot → campo → evento → valor).

> **Nota Next.js 16**: o arquivo de guarda de rotas se chama `proxy.ts` (não mais `middleware.ts` — renomeado na v16) com uma função exportada `proxy`. `params`/`searchParams`/`cookies()` são sempre assíncronos (`await`).

## Modelo de dados (Postgres/Supabase)

- `event_types` — categorias de template (Missa, Grupo de Oração, Palestra)
- `templates` — um template pertence a um `event_type`, define a tela 1920×1080
- `template_slots` — os "momentos" de exibição dentro de um template (ex: Abertura, Leitura, Salmo, Avisos), cada um com posição/tamanho, cor de fundo, imagem fixa opcional, configuração de auto-ajuste de texto e estilo de texto
- `template_slot_fields` — os campos de texto que cada slot precisa (ex: "referência" + "texto" de uma leitura)
- `profiles` — perfil do usuário autenticado, com `role` (`admin` ou `operator`)
- `live_events` — uma Missa/evento específico criado a partir de um template, com `active_slot_id` (qual slot está visível agora) e `public_token` (segredo da URL pública do overlay)
- `event_field_values` — os valores de texto preenchidos pelo operador para um evento específico

Ver `supabase/migrations/0001_init.sql` para o schema completo com tipos e constraints.

## Controle de acesso

- **Row Level Security (RLS) do Postgres** é a barreira real: `is_admin()` bloqueia no banco qualquer escrita em `templates`/`template_slots`/`template_slot_fields` vinda de quem não é admin. Operadores só leem essas tabelas e leem/escrevem em `live_events`/`event_field_values`.
- **Overlay público** (`/overlay/[publicToken]`): sem login. A função `SECURITY DEFINER` `get_public_event_snapshot(token)` valida o token e devolve só os dados necessários. Nenhuma permissão direta ao papel `anon`. Atualização via canal de Realtime Broadcast nomeado a partir do token.
- `proxy.ts` bloqueia operador de acessar `/templates/**` na interface (camada extra, não a principal).

## Posicionamento livre + auto-ajuste de texto

- Editor tipo canvas do quadro 1920×1080 usando `react-rnd`.
- Componente `SlotRenderer` compartilhado entre editor, controle e overlay — garante paridade visual.
- `useAutoFitText`: hook próprio (busca binária de tamanho de fonte via `ResizeObserver`), sem dependência de terceiros pouco mantida.
- Imagens no bucket `template-assets` do Supabase Storage.

## Mapa de telas

| Rota | Quem acessa | Função |
|---|---|---|
| `/login` | pública | Login (Supabase Auth) |
| `/templates`, `/templates/[id]` | só admin | Lista e editor de templates |
| `/events`, `/events/new` | admin + operador | Lista/criação de eventos |
| `/events/[id]/content` | admin + operador | Preenchimento de conteúdo (só valores) |
| `/events/[id]/control` | admin + operador | Controle ao vivo (slot ativo) |
| `/overlay/[publicToken]` | pública | Página do OBS Browser Source |

## Fases de construção

1. Base (scaffold + contas Vercel/Supabase)
2. Schema + Auth + RBAC
3. Editor de template (formulário)
4. Editor visual (canvas) + auto-ajuste
5. Eventos + preenchimento de conteúdo
6. Controle ao vivo + overlay + Realtime
7. Robustez (usuários, docs OBS, ensaio antes do uso real)

## Verificação

- RLS: operador não consegue alterar `template_slots`; admin consegue; anônimo só via função pública.
- Tempo real: duas janelas (controle + overlay) propagando em menos de 1s.
- Auto-ajuste: textos de tamanhos variados não vazam da caixa.
- OBS real: Browser Source 1920×1080, fundo transparente, atualização sem "Refresh browser".
- Ensaio completo de uma Missa fictícia antes do primeiro uso ao vivo real, com o Photoshop como plano B nessa primeira vez.
