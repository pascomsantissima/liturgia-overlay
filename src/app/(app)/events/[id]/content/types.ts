import type {
  EventFieldValueRow,
  EventSlotTitleRow,
  TemplateSlotFieldRow,
  TemplateSlotRow,
} from "@/types/database";

export type SlotField = TemplateSlotFieldRow;

export type SlotWithFields = TemplateSlotRow & {
  template_slot_fields: SlotField[];
};

export type { EventFieldValueRow, EventSlotTitleRow };
