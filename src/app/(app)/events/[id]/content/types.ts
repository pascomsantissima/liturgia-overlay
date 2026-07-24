import type {
  EventFieldValueRow,
  EventSlotTitleRow,
  TemplateSlotFieldRow,
  TemplateSlotRow,
} from "@/types/database";

export type SlotField = TemplateSlotFieldRow;

export type SlotImage = {
  id: string;
  image_url: string;
  pos_x: number;
  pos_y: number;
  width: number;
  height: number;
};

export type SlotWithFields = TemplateSlotRow & {
  template_slot_fields: SlotField[];
  template_images: SlotImage[];
};

export type { EventFieldValueRow, EventSlotTitleRow };
