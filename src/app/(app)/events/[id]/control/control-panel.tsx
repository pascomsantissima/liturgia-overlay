"use client";

import { useEffect, useState } from "react";
import { EyeOff, Link2, Radio } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CanvasStage } from "@/components/canvas/CanvasStage";
import { SlotRenderer } from "@/components/slot-renderer/SlotRenderer";
import type { EventFieldValueRow, EventSlotTitleRow, SlotWithFields } from "../content/types";

export function ControlPanel({
  eventId,
  eventName,
  templateName,
  canvasWidth,
  canvasHeight,
  publicToken,
  initialActiveSlotId,
  slots,
  values: initialValues,
  titleOverrides: initialTitleOverrides,
}: {
  eventId: string;
  eventName: string;
  templateName: string;
  canvasWidth: number;
  canvasHeight: number;
  publicToken: string;
  initialActiveSlotId: string | null;
  slots: SlotWithFields[];
  values: EventFieldValueRow[];
  titleOverrides: EventSlotTitleRow[];
}) {
  const [activeSlotId, setActiveSlotId] = useState(initialActiveSlotId);
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(initialValues.map((v) => [v.template_slot_field_id, v.value])),
  );
  const [titleOverrides, setTitleOverrides] = useState<Record<string, string>>(() =>
    Object.fromEntries(initialTitleOverrides.map((t) => [t.template_slot_id, t.title])),
  );
  const [overlayUrl] = useState(() =>
    typeof window !== "undefined" ? `${window.location.origin}/overlay/${publicToken}` : "",
  );
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`event-control-${eventId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "live_events", filter: `id=eq.${eventId}` },
        (payload) => {
          const row = payload.new as { active_slot_id: string | null };
          setActiveSlotId(row.active_slot_id);
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "event_field_values", filter: `live_event_id=eq.${eventId}` },
        (payload) => {
          const row = payload.new as EventFieldValueRow | undefined;
          if (!row) return;
          setValues((prev) => ({ ...prev, [row.template_slot_field_id]: row.value }));
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "event_slot_titles", filter: `live_event_id=eq.${eventId}` },
        (payload) => {
          const row = payload.new as EventSlotTitleRow | undefined;
          if (!row) return;
          setTitleOverrides((prev) => ({ ...prev, [row.template_slot_id]: row.title }));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  async function handleSetActive(slotId: string | null) {
    setSwitching(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("live_events")
      .update({ active_slot_id: slotId })
      .eq("id", eventId);
    setSwitching(false);

    if (error) {
      toast.error("Não foi possível trocar a mensagem", { description: error.message });
      return;
    }
    setActiveSlotId(slotId);
  }

  async function handleCopyUrl() {
    await navigator.clipboard.writeText(overlayUrl);
    toast.success("Link copiado");
  }

  function effectiveLabel(slot: SlotWithFields) {
    return titleOverrides[slot.id]?.trim() || slot.label;
  }

  const activeSlot = slots.find((s) => s.id === activeSlotId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">{eventName}</h1>
        <p className="text-sm text-muted-foreground">{templateName} · controle ao vivo</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading">
            <Link2 className="size-4 text-primary" />
            Link do OBS (Browser Source)
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
          <code className="rounded bg-muted px-2 py-1 text-sm">{overlayUrl || "gerando..."}</code>
          <Button size="sm" variant="outline" onClick={handleCopyUrl} disabled={!overlayUrl}>
            Copiar link
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="flex flex-col gap-3">
          <Button
            variant={activeSlotId === null ? "default" : "outline"}
            onClick={() => handleSetActive(null)}
            disabled={switching}
          >
            <EyeOff className="size-4" />
            Ocultar tudo
          </Button>
          {slots.map((slot) => (
            <Button
              key={slot.id}
              variant={activeSlotId === slot.id ? "default" : "outline"}
              onClick={() => handleSetActive(slot.id)}
              disabled={switching}
              className={
                activeSlotId === slot.id
                  ? "justify-start brand-gradient border-0 text-white hover:opacity-90"
                  : "justify-start"
              }
            >
              {activeSlotId === slot.id && (
                <Badge className="mr-1 gap-1 border-0 bg-white/20 text-white">
                  <Radio className="size-3" />
                  No ar
                </Badge>
              )}
              {effectiveLabel(slot)}
            </Button>
          ))}
          {slots.length === 0 && (
            <p className="text-sm text-muted-foreground">Este template não tem momentos configurados.</p>
          )}
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-muted-foreground">Pré-visualização</p>
          <CanvasStage
            width={canvasWidth}
            height={canvasHeight}
            className="overflow-hidden rounded-md border bg-[repeating-conic-gradient(#374151_0%_25%,#1f2937_0%_50%)] bg-[length:32px_32px]"
          >
            {() => (
              <>
                {activeSlot?.template_images.map((img) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={img.id}
                    src={img.image_url}
                    alt=""
                    style={{
                      position: "absolute",
                      left: img.pos_x,
                      top: img.pos_y,
                      width: img.width,
                      height: img.height,
                      objectFit: "contain",
                    }}
                  />
                ))}
                {activeSlot && (
                  <SlotRenderer
                    slot={{
                      ...activeSlot,
                      label: effectiveLabel(activeSlot),
                      fields: activeSlot.template_slot_fields.map((f) => ({
                        key: f.key,
                        label: f.label,
                        value: values[f.id] ?? "",
                        bg_color: f.bg_color,
                        bg_opacity: f.bg_opacity,
                        bg_gradient_to: f.bg_gradient_to,
                        bg_gradient_direction: f.bg_gradient_direction,
                      })),
                    }}
                  />
                )}
              </>
            )}
          </CanvasStage>
        </div>
      </div>
    </div>
  );
}
