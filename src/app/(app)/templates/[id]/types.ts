import type {
  AutofitConfig,
  AutofitMode,
  FieldType,
  GradientDirection,
  LineBackground,
  TemplateSlotFieldRow,
  TemplateSlotRow,
  TextStyle,
} from "@/types/database";

export type SlotField = TemplateSlotFieldRow;

export type SlotWithFields = TemplateSlotRow & {
  template_slot_fields: SlotField[];
};

export type TemplateWithType = {
  id: string;
  name: string;
  canvas_width: number;
  canvas_height: number;
  event_type_id: string;
  event_types: { name: string } | null;
};

export type { AutofitConfig, AutofitMode, FieldType, GradientDirection, LineBackground, TextStyle };
