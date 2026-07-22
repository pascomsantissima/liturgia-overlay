-- Liturgia Overlay: schema, RLS e funções públicas
-- Rodar no SQL Editor do Supabase (ou `supabase db push`).

create extension if not exists "pgcrypto";

-- =========================================================================
-- Helpers
-- =========================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================================================================
-- Tabelas
-- =========================================================================

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  role text not null default 'operator' check (role in ('admin', 'operator')),
  created_at timestamptz not null default now()
);

create table public.event_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique
);

create table public.templates (
  id uuid primary key default gen_random_uuid(),
  event_type_id uuid not null references public.event_types (id),
  name text not null,
  canvas_width integer not null default 1920,
  canvas_height integer not null default 1080,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.template_slots (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.templates (id) on delete cascade,
  key text not null,
  label text not null,
  sort_order integer not null default 0,
  pos_x numeric not null default 0 check (pos_x >= 0),
  pos_y numeric not null default 0 check (pos_y >= 0),
  width numeric not null default 800 check (width > 0),
  height numeric not null default 200 check (height > 0),
  bg_color text not null default '#000000',
  bg_opacity numeric not null default 1 check (bg_opacity between 0 and 1),
  image_url text,
  image_pos_x numeric not null default 0,
  image_pos_y numeric not null default 0,
  image_width numeric not null default 120,
  image_height numeric not null default 120,
  text_style jsonb not null default '{}'::jsonb,
  autofit_config jsonb not null default
    '{"mode":"shrink-and-wrap","min_font_size":16,"max_font_size":64}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (template_id, key)
);

create table public.template_slot_fields (
  id uuid primary key default gen_random_uuid(),
  template_slot_id uuid not null references public.template_slots (id) on delete cascade,
  key text not null,
  label text not null,
  field_type text not null default 'text' check (field_type in ('text', 'textarea')),
  max_length integer,
  required boolean not null default false,
  sort_order integer not null default 0,
  unique (template_slot_id, key)
);

create table public.live_events (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.templates (id),
  name text not null,
  event_date date not null default current_date,
  status text not null default 'draft' check (status in ('draft', 'live', 'archived')),
  active_slot_id uuid references public.template_slots (id) on delete set null,
  public_token uuid not null default gen_random_uuid() unique,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.event_field_values (
  id uuid primary key default gen_random_uuid(),
  live_event_id uuid not null references public.live_events (id) on delete cascade,
  template_slot_field_id uuid not null references public.template_slot_fields (id) on delete cascade,
  value text not null default '',
  updated_by uuid references public.profiles (id),
  updated_at timestamptz not null default now(),
  unique (live_event_id, template_slot_field_id)
);

create index on public.template_slots (template_id);
create index on public.template_slot_fields (template_slot_id);
create index on public.live_events (template_id);
create index on public.event_field_values (live_event_id);
create index on public.event_field_values (template_slot_field_id);

create trigger set_updated_at before update on public.templates
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.template_slots
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.live_events
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.event_field_values
  for each row execute function public.set_updated_at();

-- SECURITY DEFINER: precisa ler profiles independente da RLS de profiles,
-- para ser usada dentro das próprias policies sem recursão. Definida aqui
-- (depois das tabelas) porque funções `language sql` são validadas contra
-- o catálogo já na criação, ao contrário de `plpgsql`.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- =========================================================================
-- Novo usuário -> profile automático (role padrão: operator)
-- =========================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', new.email));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Impede que um operador se autopromova a admin via update direto na própria
-- linha, quando a alteração vem de uma sessão autenticada (PostgREST). Fora
-- desse contexto (SQL Editor, `psql`, migrações) auth.uid() é nulo — esse é
-- o caminho de bootstrap para promover o primeiro admin, e exige acesso
-- direto ao banco, um nível de confiança já maior que o da aplicação.
create or replace function public.prevent_role_self_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and new.role <> old.role and not public.is_admin() then
    raise exception 'apenas administradores podem alterar o papel de um usuário';
  end if;
  return new;
end;
$$;

create trigger guard_role_change
  before update on public.profiles
  for each row execute function public.prevent_role_self_escalation();

-- =========================================================================
-- RLS
-- =========================================================================

-- GRANT é o portão grosso do Postgres (permite a operação); RLS abaixo é o
-- filtro fino (restringe quais linhas). Sem o GRANT, mesmo um usuário
-- autenticado com policy favorável recebe "permission denied". `anon` não
-- recebe nada aqui de propósito — só acessa via a função pública mais abaixo.
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;

alter table public.profiles enable row level security;
alter table public.event_types enable row level security;
alter table public.templates enable row level security;
alter table public.template_slots enable row level security;
alter table public.template_slot_fields enable row level security;
alter table public.live_events enable row level security;
alter table public.event_field_values enable row level security;

-- profiles: cada um vê o próprio + admin vê todos; cada um edita o próprio
-- (role protegido pelo trigger acima), admin edita qualquer um.
create policy "profiles_select" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

create policy "profiles_update" on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- event_types: leitura para todo autenticado, escrita só admin.
create policy "event_types_select" on public.event_types
  for select to authenticated using (true);
create policy "event_types_write" on public.event_types
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- templates / template_slots / template_slot_fields: leitura para todo
-- autenticado (operador precisa ler a estrutura para preencher conteúdo),
-- escrita (insert/update/delete) só admin.
create policy "templates_select" on public.templates
  for select to authenticated using (true);
create policy "templates_write" on public.templates
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "template_slots_select" on public.template_slots
  for select to authenticated using (true);
create policy "template_slots_write" on public.template_slots
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "template_slot_fields_select" on public.template_slot_fields
  for select to authenticated using (true);
create policy "template_slot_fields_write" on public.template_slot_fields
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- live_events: qualquer autenticado lê/cria/atualiza; exclusão só admin
-- (evita que um operador apague um evento por engano).
create policy "live_events_select" on public.live_events
  for select to authenticated using (true);
create policy "live_events_insert" on public.live_events
  for insert to authenticated with check (true);
create policy "live_events_update" on public.live_events
  for update to authenticated using (true) with check (true);
create policy "live_events_delete" on public.live_events
  for delete to authenticated using (public.is_admin());

-- event_field_values: qualquer autenticado lê/escreve (é só o conteúdo de texto).
create policy "event_field_values_all" on public.event_field_values
  for all to authenticated using (true) with check (true);

-- Nenhuma policy é criada para o papel anon: o overlay público só acessa
-- dados através da função SECURITY DEFINER abaixo.

-- =========================================================================
-- Overlay público (sem login)
-- =========================================================================

create or replace function public.get_public_event_snapshot(token uuid)
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select jsonb_build_object(
    'event', jsonb_build_object(
      'id', e.id,
      'name', e.name,
      'status', e.status
    ),
    'canvas', jsonb_build_object(
      'width', t.canvas_width,
      'height', t.canvas_height
    ),
    'active_slot', case when s.id is null then null else jsonb_build_object(
      'id', s.id,
      'key', s.key,
      'label', s.label,
      'pos_x', s.pos_x,
      'pos_y', s.pos_y,
      'width', s.width,
      'height', s.height,
      'bg_color', s.bg_color,
      'bg_opacity', s.bg_opacity,
      'image_url', s.image_url,
      'image_pos_x', s.image_pos_x,
      'image_pos_y', s.image_pos_y,
      'image_width', s.image_width,
      'image_height', s.image_height,
      'text_style', s.text_style,
      'autofit_config', s.autofit_config,
      'fields', (
        select coalesce(jsonb_agg(jsonb_build_object(
          'key', f.key,
          'label', f.label,
          'field_type', f.field_type,
          'value', coalesce(v.value, '')
        ) order by f.sort_order), '[]'::jsonb)
        from public.template_slot_fields f
        left join public.event_field_values v
          on v.template_slot_field_id = f.id and v.live_event_id = e.id
        where f.template_slot_id = s.id
      )
    ) end
  )
  from public.live_events e
  join public.templates t on t.id = e.template_id
  left join public.template_slots s on s.id = e.active_slot_id
  where e.public_token = token;
$$;

grant execute on function public.get_public_event_snapshot(uuid) to anon, authenticated;

-- =========================================================================
-- Broadcast em tempo real para o overlay (canal público nomeado pelo token)
-- =========================================================================

create or replace function public.notify_event_snapshot_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform realtime.send(
    jsonb_build_object('changed_at', now()),
    'snapshot_changed',
    'overlay:' || new.public_token::text,
    false
  );
  return new;
end;
$$;

create trigger broadcast_live_event_change
  after update on public.live_events
  for each row execute function public.notify_event_snapshot_change();

create or replace function public.notify_event_field_value_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token uuid;
begin
  select public_token into v_token
  from public.live_events
  where id = new.live_event_id;

  if v_token is not null then
    perform realtime.send(
      jsonb_build_object('changed_at', now()),
      'snapshot_changed',
      'overlay:' || v_token::text,
      false
    );
  end if;
  return new;
end;
$$;

create trigger broadcast_event_field_value_change
  after insert or update on public.event_field_values
  for each row execute function public.notify_event_field_value_change();

-- =========================================================================
-- Realtime: sincronização entre operadores (Postgres Changes, autenticado)
-- =========================================================================

alter publication supabase_realtime add table public.event_field_values;
alter publication supabase_realtime add table public.live_events;

-- =========================================================================
-- Storage: imagens fixas dos templates
-- =========================================================================

insert into storage.buckets (id, name, public)
values ('template-assets', 'template-assets', true)
on conflict (id) do nothing;

create policy "template_assets_public_read" on storage.objects
  for select using (bucket_id = 'template-assets');

create policy "template_assets_admin_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'template-assets' and public.is_admin());

create policy "template_assets_admin_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'template-assets' and public.is_admin());

create policy "template_assets_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'template-assets' and public.is_admin());

-- =========================================================================
-- Seed: tipos de evento padrão
-- =========================================================================

insert into public.event_types (name, slug) values
  ('Missa', 'missa'),
  ('Grupo de Oração', 'grupo-de-oracao'),
  ('Palestra', 'palestra')
on conflict (slug) do nothing;
