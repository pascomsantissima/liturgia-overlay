-- =========================================================================
-- Banco de imagens (upload uma vez, reaproveita em qualquer lugar) +
-- imagens soltas no canvas (posição livre, independentes das mensagens)
-- =========================================================================

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  image_url text not null,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.template_images (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.templates (id) on delete cascade,
  media_asset_id uuid not null references public.media_assets (id) on delete cascade,
  pos_x numeric not null default 0,
  pos_y numeric not null default 0,
  width numeric not null default 200 check (width > 0),
  height numeric not null default 200 check (height > 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on public.template_images (template_id);

create trigger set_updated_at before update on public.template_images
  for each row execute function public.set_updated_at();

-- O grant básico para `authenticated` já é automático a partir daqui em
-- diante (default privileges configurado na migração 0003).

alter table public.media_assets enable row level security;
alter table public.template_images enable row level security;

create policy "media_assets_select" on public.media_assets
  for select to authenticated using (true);
create policy "media_assets_write" on public.media_assets
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "template_images_select" on public.template_images
  for select to authenticated using (true);
create policy "template_images_write" on public.template_images
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

alter publication supabase_realtime add table public.template_images;

-- =========================================================================
-- Overlay público: inclui as imagens soltas do template (sempre visíveis,
-- independente de qual momento está ativo)
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
    'images', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', ti.id,
        'image_url', ma.image_url,
        'pos_x', ti.pos_x,
        'pos_y', ti.pos_y,
        'width', ti.width,
        'height', ti.height
      ) order by ti.sort_order), '[]'::jsonb)
      from public.template_images ti
      join public.media_assets ma on ma.id = ti.media_asset_id
      where ti.template_id = t.id
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
