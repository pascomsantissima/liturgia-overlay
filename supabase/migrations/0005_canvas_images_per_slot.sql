-- =========================================================================
-- Imagens do canvas passam a pertencer a um momento (slot) específico, não
-- ao template inteiro. Antes, uma imagem livre no canvas ficava visível o
-- tempo todo, em qualquer momento ativo — o correto é ela só aparecer
-- quando aquele momento específico estiver no ar (a exceção natural: ao
-- "basear" um novo momento em outro já configurado, suas imagens são
-- copiadas junto, então o novo momento nasce com as mesmas imagens).
-- =========================================================================

alter table public.template_images
  drop constraint template_images_template_id_fkey;

alter table public.template_images
  rename column template_id to template_slot_id;

alter table public.template_images
  add constraint template_images_template_slot_id_fkey
    foreign key (template_slot_id) references public.template_slots (id) on delete cascade;

-- =========================================================================
-- Overlay público: as imagens do canvas agora vêm dentro de `active_slot`,
-- filtradas pelo momento ativo (antes eram uma lista solta no topo, sempre
-- visível independente do momento).
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
        where ti.template_slot_id = s.id
      ),
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
