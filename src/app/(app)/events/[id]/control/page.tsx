import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ControlPanel } from "./control-panel";
import type { EventFieldValueRow, EventSlotTitleRow, SlotWithFields } from "../content/types";
import type { TemplateImageRow } from "@/types/database";

export default async function EventControlPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("live_events")
    .select("id, name, active_slot_id, public_token, template_id, templates(name, canvas_width, canvas_height)")
    .eq("id", id)
    .single();

  if (!event) notFound();

  const { data: slots } = await supabase
    .from("template_slots")
    .select("*, template_slot_fields(*), template_images(*, media_assets(image_url))")
    .eq("template_id", event.template_id)
    .order("sort_order", { ascending: true });

  const { data: values } = await supabase
    .from("event_field_values")
    .select("*")
    .eq("live_event_id", id);

  const { data: titleOverrides } = await supabase
    .from("event_slot_titles")
    .select("*")
    .eq("live_event_id", id);

  const template = event.templates as unknown as {
    name: string;
    canvas_width: number;
    canvas_height: number;
  } | null;

  const orderedSlots = (
    (slots ?? []) as unknown as (Omit<SlotWithFields, "template_images"> & {
      template_images: (TemplateImageRow & { media_assets: { image_url: string } | null })[];
    })[]
  ).map((s) => ({
    ...s,
    template_slot_fields: [...s.template_slot_fields].sort((a, b) => a.sort_order - b.sort_order),
    template_images: s.template_images.map((img) => ({
      id: img.id,
      image_url: img.media_assets?.image_url ?? "",
      pos_x: img.pos_x,
      pos_y: img.pos_y,
      width: img.width,
      height: img.height,
    })),
  }));

  return (
    <ControlPanel
      eventId={id}
      eventName={event.name}
      templateName={template?.name ?? ""}
      canvasWidth={template?.canvas_width ?? 1920}
      canvasHeight={template?.canvas_height ?? 1080}
      publicToken={event.public_token}
      initialActiveSlotId={event.active_slot_id}
      slots={orderedSlots}
      values={(values ?? []) as EventFieldValueRow[]}
      titleOverrides={(titleOverrides ?? []) as EventSlotTitleRow[]}
    />
  );
}
