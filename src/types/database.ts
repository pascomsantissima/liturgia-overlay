export type ProfileRole = "admin" | "operator";
export type EventStatus = "draft" | "live" | "archived";
export type FieldType = "text" | "textarea";
export type AutofitMode = "shrink-only" | "shrink-and-wrap";
export type GradientDirection = "horizontal" | "vertical";

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

/** Cor de fundo sólida ou gradiente de uma linha (título ou um campo). */
export type LineBackground = {
  bg_color: string;
  bg_opacity: number;
  bg_gradient_to: string | null;
  bg_gradient_direction: GradientDirection;
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
  bg_gradient_to: string | null;
  bg_gradient_direction: GradientDirection;
  title_editable: boolean;
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
  bg_color: string;
  bg_opacity: number;
  bg_gradient_to: string | null;
  bg_gradient_direction: GradientDirection;
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

export type EventSlotTitleRow = {
  id: string;
  live_event_id: string;
  template_slot_id: string;
  title: string;
  updated_by: string | null;
  updated_at: string;
};

export type MediaAssetRow = {
  id: string;
  name: string;
  image_url: string;
  created_by: string | null;
  created_at: string;
};

export type TemplateImageRow = {
  id: string;
  template_id: string;
  media_asset_id: string;
  pos_x: number;
  pos_y: number;
  width: number;
  height: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type PublicEventSnapshot = {
  event: { id: string; name: string; status: EventStatus };
  canvas: { width: number; height: number };
  images: { id: string; image_url: string; pos_x: number; pos_y: number; width: number; height: number }[];
  active_slot:
    | (LineBackground & {
        id: string;
        key: string;
        label: string;
        pos_x: number;
        pos_y: number;
        width: number;
        height: number;
        image_url: string | null;
        image_pos_x: number;
        image_pos_y: number;
        image_width: number;
        image_height: number;
        text_style: TextStyle;
        autofit_config: AutofitConfig;
        fields: (LineBackground & {
          key: string;
          label: string;
          field_type: FieldType;
          value: string;
        })[];
      })
    | null;
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
      event_slot_titles: TableDef<
        EventSlotTitleRow,
        { live_event_id: string; template_slot_id: string } & Partial<EventSlotTitleRow>,
        Partial<EventSlotTitleRow>
      >;
      media_assets: TableDef<
        MediaAssetRow,
        { image_url: string } & Partial<MediaAssetRow>,
        Partial<MediaAssetRow>
      >;
      template_images: TableDef<
        TemplateImageRow,
        { template_id: string; media_asset_id: string } & Partial<TemplateImageRow>,
        Partial<TemplateImageRow>
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
