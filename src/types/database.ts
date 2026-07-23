export type ProfileRole = "admin" | "operator";
export type EventStatus = "draft" | "live" | "archived";
export type FieldType = "text" | "textarea";
export type AutofitMode = "shrink-only" | "shrink-and-wrap";

export type AutofitConfig = {
  mode: AutofitMode;
  min_font_size: number;
  max_font_size: number;
};

export type TextStyle = {
  font_family?: string;
  color?: string;
  font_weight?: string;
  text_align?: "left" | "center" | "right";
  title_font_size?: number;
  title_color?: string;
};

// Nota: usar `type` (não `interface`) nos tipos abaixo é obrigatório — o
// supabase-js valida a Database contra `Record<string, unknown>`, e uma
// `interface` não recebe assinatura de índice implícita em TypeScript,
// então falha essa checagem silenciosamente (resolve para `never`).

export type ProfileRow = {
  id: string;
  display_name: string;
  role: ProfileRole;
  created_at: string;
};

export type EventTypeRow = {
  id: string;
  name: string;
  slug: string;
};

export type TemplateRow = {
  id: string;
  event_type_id: string;
  name: string;
  canvas_width: number;
  canvas_height: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type TemplateSlotRow = {
  id: string;
  template_id: string;
  key: string;
  label: string;
  sort_order: number;
  pos_x: number;
  pos_y: number;
  width: number;
  height: number;
  bg_color: string;
  bg_opacity: number;
  image_url: string | null;
  image_pos_x: number;
  image_pos_y: number;
  image_width: number;
  image_height: number;
  text_style: TextStyle;
  autofit_config: AutofitConfig;
  created_at: string;
  updated_at: string;
};

export type TemplateSlotFieldRow = {
  id: string;
  template_slot_id: string;
  key: string;
  label: string;
  field_type: FieldType;
  max_length: number | null;
  required: boolean;
  sort_order: number;
};

export type LiveEventRow = {
  id: string;
  template_id: string;
  name: string;
  event_date: string;
  status: EventStatus;
  active_slot_id: string | null;
  public_token: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type EventFieldValueRow = {
  id: string;
  live_event_id: string;
  template_slot_field_id: string;
  value: string;
  updated_by: string | null;
  updated_at: string;
};

export type PublicEventSnapshot = {
  event: { id: string; name: string; status: EventStatus };
  canvas: { width: number; height: number };
  active_slot: {
    id: string;
    key: string;
    label: string;
    pos_x: number;
    pos_y: number;
    width: number;
    height: number;
    bg_color: string;
    bg_opacity: number;
    image_url: string | null;
    image_pos_x: number;
    image_pos_y: number;
    image_width: number;
    image_height: number;
    text_style: TextStyle;
    autofit_config: AutofitConfig;
    fields: { key: string; label: string; field_type: FieldType; value: string }[];
  } | null;
};

type TableDef<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: TableDef<ProfileRow, { id: string } & Partial<ProfileRow>, Partial<ProfileRow>>;
      event_types: TableDef<EventTypeRow, Partial<EventTypeRow>, Partial<EventTypeRow>>;
      templates: TableDef<
        TemplateRow,
        { event_type_id: string; name: string } & Partial<TemplateRow>,
        Partial<TemplateRow>
      >;
      template_slots: TableDef<
        TemplateSlotRow,
        { template_id: string; key: string; label: string } & Partial<TemplateSlotRow>,
        Partial<TemplateSlotRow>
      >;
      template_slot_fields: TableDef<
        TemplateSlotFieldRow,
        { template_slot_id: string; key: string; label: string } & Partial<TemplateSlotFieldRow>,
        Partial<TemplateSlotFieldRow>
      >;
      live_events: TableDef<
        LiveEventRow,
        { template_id: string; name: string } & Partial<LiveEventRow>,
        Partial<LiveEventRow>
      >;
      event_field_values: TableDef<
        EventFieldValueRow,
        { live_event_id: string; template_slot_field_id: string } & Partial<EventFieldValueRow>,
        Partial<EventFieldValueRow>
      >;
    };
    Views: Record<string, never>;
    Functions: {
      get_public_event_snapshot: {
        Args: { token: string };
        Returns: PublicEventSnapshot;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
