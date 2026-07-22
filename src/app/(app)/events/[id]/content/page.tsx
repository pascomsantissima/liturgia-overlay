import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ContentForm } from "./content-form";
import type { EventFieldValueRow, SlotWithFields } from "./types";

export default async function EventContentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("live_events")
    .select("id, name, event_date, template_id, templates(name)")
    .eq("id", id)
    .single();

  if (!event) notFound();

  const { data: slots } = await supabase
    .from("template_slots")
    .select("*, template_slot_fields(*)")
    .eq("template_id", event.template_id)
    .order("sort_order", { ascending: true });

  const { data: values } = await supabase
    .from("event_field_values")
    .select("*")
    .eq("live_event_id", id);

  const orderedSlots = ((slots ?? []) as unknown as SlotWithFields[]).map((s) => ({
    ...s,
    template_slot_fields: [...s.template_slot_fields].sort((a, b) => a.sort_order - b.sort_order),
  }));

  return (
    <ContentForm
      eventId={id}
      eventName={event.name}
      templateName={(event.templates as unknown as { name: string } | null)?.name ?? ""}
      slots={orderedSlots}
      initialValues={(values ?? []) as EventFieldValueRow[]}
    />
  );
}
