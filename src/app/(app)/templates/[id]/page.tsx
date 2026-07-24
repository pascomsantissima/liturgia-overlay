import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TemplateEditor } from "./template-editor";
import type { MediaAssetRow, SlotWithFields, TemplateImageRow, TemplateWithType } from "./types";

export default async function TemplateEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: template } = await supabase
    .from("templates")
    .select("id, name, canvas_width, canvas_height, event_type_id, event_types(name)")
    .eq("id", id)
    .single();

  if (!template) notFound();

  const { data: slots } = await supabase
    .from("template_slots")
    .select("*, template_slot_fields(*)")
    .eq("template_id", id)
    .order("sort_order", { ascending: true });

  const { data: eventTypes } = await supabase.from("event_types").select("id, name").order("name");

  const { data: mediaAssets } = await supabase
    .from("media_assets")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: templateImages } = await supabase
    .from("template_images")
    .select("*, media_assets(image_url)")
    .eq("template_id", id)
    .order("sort_order", { ascending: true });

  const initialSlots = ((slots ?? []) as unknown as SlotWithFields[]).map((s) => ({
    ...s,
    template_slot_fields: [...s.template_slot_fields].sort((a, b) => a.sort_order - b.sort_order),
  }));

  const initialImages = ((templateImages ?? []) as unknown as (TemplateImageRow & {
    media_assets: { image_url: string } | null;
  })[]).map((img) => ({ ...img, image_url: img.media_assets?.image_url ?? "" }));

  return (
    <TemplateEditor
      template={template as unknown as TemplateWithType}
      initialSlots={initialSlots}
      eventTypes={eventTypes ?? []}
      initialMediaAssets={(mediaAssets ?? []) as MediaAssetRow[]}
      initialImages={initialImages}
    />
  );
}
