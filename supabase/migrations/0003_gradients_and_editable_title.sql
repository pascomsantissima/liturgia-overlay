-- =========================================================================
-- Fundo em gradiente (título e cada campo de conteúdo, independentes)
-- =========================================================================

-- template_slots: bg_color/bg_opacity já existentes passam a valer para a
-- barra do TÍTULO especificamente (antes era a caixa inteira). Adicionamos
-- o suporte a gradiente para essa barra.
alter table public.template_slots
  add column bg_gradient_to text,
  add column bg_gradient_direction text not null default 'horizontal'
    check (bg_gradient_direction in ('horizontal', 'vertical'));

-- Cada campo de conteúdo (uma "linha" de mensagem) tem sua própria cor de
-- fundo / gradiente, independente do título e dos outros campos.
alter table public.template_slot_fields
  add column bg_color text not null default '#000000',
  add column bg_opacity numeric not null default 1 check (bg_opacity between 0 and 1),
  add column bg_gradient_to text,
  add column bg_gradient_direction text not null default 'horizontal'
    check (bg_gradient_direction in ('horizontal', 'vertical'));

-- =========================================================================
-- Título editável por evento (flag no template + valor por evento)
-- =========================================================================

alter table public.template_slots
  add column title_editable boolean not null default false;

create table public.event_slot_titles (
  id uuid primary key default gen_random_uuid(),
  live_event_id uuid not null references public.live_events (id) on delete cascade,
  template_slot_id uuid not null references public.template_slots (id) on delete cascade,
  title text not null default '',
  updated_by uuid references public.profiles (id),
  updated_at timestamptz not null default now(),
  unique (live_event_id, template_slot_id)
);

create index on public.event_slot_titles (live_event_id);

create trigger set_updated_at before update on public.event_slot_titles
  for each row execute function public.set_updated_at();

-- Garante que tabelas futuras também recebam o grant básico automaticamente
-- (na migração 0001 o grant só valia para as tabelas que já existiam então).
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;

grant select, insert, update, delete on public.event_slot_titles to authenticated;

alter table public.event_slot_titles enable row level security;

create policy "event_slot_titles_all" on public.event_slot_titles
  for all to authenticated using (true) with check (true);

alter publication supabase_realtime add table public.event_slot_titles;

create or replace function public.notify_event_slot_title_change()
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

create trigger broadcast_event_slot_title_change
  after insert or update on public.event_slot_titles
  for each row execute function public.notify_event_slot_title_change();

-- =========================================================================
-- Overlay público: reconstruído com título efetivo (override do evento,
-- se existir e não estiver vazio) e estilo (cor/gradiente) por linha
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
      'label', coalesce(nullif(et.title, ''), s.label),
      'pos_x', s.pos_x,
      'pos_y', s.pos_y,
      'width', s.width,
      'height', s.height,
      'bg_color', s.bg_color,
      'bg_opacity', s.bg_opacity,
      'bg_gradient_to', s.bg_gradient_to,
      'bg_gradient_direction', s.bg_gradient_direction,
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
          'value', coalesce(v.value, ''),
          'bg_color', f.bg_color,
          'bg_opacity', f.bg_opacity,
          'bg_gradient_to', f.bg_gradient_to,
          'bg_gradient_direction', f.bg_gradient_direction
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
  left join public.event_slot_titles et
    on et.live_event_id = e.id and et.template_slot_id = s.id
  where e.public_token = token;
$$;
