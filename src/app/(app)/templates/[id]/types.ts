import type {
  AutofitConfig,
  AutofitMode,
  FieldType,
  GradientDirection,
  LineBackground,
  MediaAssetRow,
  TemplateImageRow,
  TemplateSlotFieldRow,
  TemplateSlotRow,
  TextStyle,
} from "@/types/database";

export type SlotField = TemplateSlotFieldRow;

export type SlotImagePlacement = TemplateImageRow & { image_url: string };

export type SlotWithFields = TemplateSlotRow & {
  template_slot_fields: SlotField[];
  template_images: SlotImagePlacement[];
};

export type TemplateWithType = {
  id: string;
  name: string;
  canvas_width: number;
  canvas_height: number;
  event_type_id: string;
  event_types: { name: string } | null;
};

export type {
  AutofitConfig,
  AutofitMode,
  FieldType,
  GradientDirection,
  LineBackground,
  MediaAssetRow,
  TemplateImageRow,
  TextStyle,
};
