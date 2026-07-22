# Deploy e operação

## 1. Criar o projeto no Supabase

1. Crie uma conta gratuita em [supabase.com](https://supabase.com) e um novo projeto.
2. No SQL Editor do projeto, cole e rode o conteúdo de [`supabase/migrations/0001_init.sql`](../supabase/migrations/0001_init.sql). Isso cria as tabelas, as políticas de segurança (RLS), as funções e o bucket de imagens.
3. Em **Settings → API**, copie a **Project URL** e a **anon public key**.

## 2. Criar o primeiro usuário admin

1. Em **Authentication → Users**, clique em "Add user" e crie um usuário (e-mail + senha) para o primeiro administrador.
2. Assim que o usuário é criado, um registro é criado automaticamente em `profiles` com papel `operator`.
3. No SQL Editor, promova esse usuário a admin (troque o e-mail):

   ```sql
   update public.profiles
   set role = 'admin'
   where id = (select id from auth.users where email = 'seuemail@exemplo.com');
   ```

4. Para os demais operadores, repita o passo 1 (eles ficam como `operator` por padrão — só um admin precisa promovê-los se algum também precisar mexer em templates).

## 3. Configurar variáveis de ambiente

Local (`.env.local`, nunca commitado):

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## 4. Deploy no Vercel

1. Crie uma conta gratuita em [vercel.com](https://vercel.com) e conecte o repositório do Git.
2. Ao importar o projeto, aponte o **Root Directory** para `liturgia-overlay/`.
3. Em **Environment Variables**, adicione as mesmas duas variáveis do passo 3.
4. Deploy.

## 5. Checklist antes do primeiro uso ao vivo

- [ ] Migração rodada sem erros no Supabase.
- [ ] Usuário admin criado e promovido.
- [ ] Deploy no Vercel concluído e acessível.
- [ ] Login funciona com o usuário admin.
- [ ] Um template de teste foi criado, com pelo menos um momento configurado (posição, cor, campos de texto).
- [ ] Um evento de teste foi criado a partir desse template.
- [ ] Conteúdo preenchido em `/events/[id]/content`.
- [ ] Mensagem ativada em `/events/[id]/control` aparece na pré-visualização.
- [ ] Link `/overlay/[token]` testado como Browser Source real no OBS (ver [`obs-setup.md`](obs-setup.md)) — a mensagem aparece e desaparece em tempo real sem precisar dar refresh na fonte.
- [ ] Testado com dois operadores ao mesmo tempo (uma aba de conteúdo + uma de controle) para confirmar que a sincronização em tempo real funciona entre eles.
- [ ] Ensaio completo de uma Missa fictícia, do início ao fim.

## Observação sobre o plano gratuito do Supabase

Projetos gratuitos do Supabase pausam automaticamente após 7 dias sem nenhuma chamada de API. Como o sistema é usado toda semana para a Missa, isso não deve ser um problema na prática — mas se o projeto ficar muito tempo sem uso (ex: durante um recesso), pode ser necessário reativá-lo manualmente no painel do Supabase antes da próxima transmissão.
