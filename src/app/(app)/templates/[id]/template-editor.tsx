"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SlotCard } from "./slot-card";
import type { MediaAssetRow, SlotWithFields, TemplateWithType } from "./types";

export function TemplateEditor({
  template,
  initialSlots,
  eventTypes,
  initialMediaAssets,
}: {
  template: TemplateWithType;
  initialSlots: SlotWithFields[];
  eventTypes: { id: string; name: string }[];
  initialMediaAssets: MediaAssetRow[];
}) {
  const router = useRouter();
  const [name, setName] = useState(template.name);
  const [eventTypeId, setEventTypeId] = useState(template.event_type_id);
  const [slots, setSlots] = useState(initialSlots);
  const [mediaAssets, setMediaAssets] = useState(initialMediaAssets);
  const [savingInfo, setSavingInfo] = useState(false);
  const [addingSlot, setAddingSlot] = useState(false);
  const addingSlotRef = useRef(false);

  function handleMediaAssetAdded(asset: MediaAssetRow) {
    setMediaAssets((prev) => [...prev, asset]);
  }

  async function handleSaveInfo(event: FormEvent) {
    event.preventDefault();
    setSavingInfo(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("templates")
      .update({ name, event_type_id: eventTypeId })
      .eq("id", template.id);
    setSavingInfo(false);

    if (error) {
      toast.error("Não foi possível salvar", { description: error.message });
      return;
    }
    toast.success("Template atualizado");
    router.refresh();
  }

  async function handleAddSlot(baseSlot: SlotWithFields | null) {
    if (addingSlotRef.current) return;
    addingSlotRef.current = true;
    setAddingSlot(true);
    const supabase = createClient();
    const nextOrder = slots.length;

    const { data, error } = await supabase
      .from("template_slots")
      .insert({
        template_id: template.id,
        key: `momento-${nextOrder + 1}`,
        label: "Novo momento",
        sort_order: nextOrder,
        ...(baseSlot && {
          pos_x: baseSlot.pos_x,
          pos_y: baseSlot.pos_y,
          width: baseSlot.width,
          height: baseSlot.height,
          bg_color: baseSlot.bg_color,
          bg_opacity: baseSlot.bg_opacity,
          bg_gradient_to: baseSlot.bg_gradient_to,
          bg_gradient_direction: baseSlot.bg_gradient_direction,
          title_editable: baseSlot.title_editable,
          image_url: baseSlot.image_url,
          image_pos_x: baseSlot.image_pos_x,
          image_pos_y: baseSlot.image_pos_y,
          image_width: baseSlot.image_width,
          image_height: baseSlot.image_height,
          text_style: baseSlot.text_style,
          autofit_config: baseSlot.autofit_config,
        }),
      })
      .select("*")
      .single();

    if (error || !data) {
      addingSlotRef.current = false;
      setAddingSlot(false);
      toast.error("Não foi possível adicionar o momento", { description: error?.message });
      return;
    }

    let clonedFields: SlotWithFields["template_slot_fields"] = [];
    if (baseSlot && baseSlot.template_slot_fields.length > 0) {
      const { data: fieldsData, error: fieldsError } = await supabase
        .from("template_slot_fields")
        .insert(
          baseSlot.template_slot_fields.map((f) => ({
            template_slot_id: data.id,
            key: f.key,
            label: f.label,
            field_type: f.field_type,
            max_length: f.max_length,
            required: f.required,
            sort_order: f.sort_order,
            bg_color: f.bg_color,
            bg_opacity: f.bg_opacity,
            bg_gradient_to: f.bg_gradient_to,
            bg_gradient_direction: f.bg_gradient_direction,
          })),
        )
        .select("*");

      if (fieldsError) {
        toast.error("Momento criado, mas não foi possível copiar os campos", {
          description: fieldsError.message,
        });
      } else {
        clonedFields = fieldsData ?? [];
      }
    }

    let clonedImages: SlotWithFields["template_images"] = [];
    if (baseSlot && baseSlot.template_images.length > 0) {
      const { data: imagesData, error: imagesError } = await supabase
        .from("template_images")
        .insert(
          baseSlot.template_images.map((img) => ({
            template_slot_id: data.id,
            media_asset_id: img.media_asset_id,
            pos_x: img.pos_x,
            pos_y: img.pos_y,
            width: img.width,
            height: img.height,
            sort_order: img.sort_order,
          })),
        )
        .select("*");

      if (imagesError) {
        toast.error("Momento criado, mas não foi possível copiar as imagens", {
          description: imagesError.message,
        });
      } else {
        const urlByAssetId = new Map(baseSlot.template_images.map((img) => [img.media_asset_id, img.image_url]));
        clonedImages = (imagesData ?? []).map((img) => ({
          ...img,
          image_url: urlByAssetId.get(img.media_asset_id) ?? "",
        }));
      }
    }

    addingSlotRef.current = false;
    setAddingSlot(false);
    setSlots((prev) => [
      ...prev,
      { ...data, template_slot_fields: clonedFields, template_images: clonedImages },
    ]);
  }

  function handleSlotDeleted(slotId: string) {
    setSlots((prev) => prev.filter((s) => s.id !== slotId));
  }

  function handleSlotUpdated(updated: SlotWithFields) {
    setSlots((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  }

  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Dados do template</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveInfo} className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="w-64" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="event-type">Tipo de evento</Label>
              <Select value={eventTypeId} onValueChange={(v) => v && setEventTypeId(v)}>
                <SelectTrigger id="event-type" className="w-48">
                  <SelectValue>
                    {(value: string | null) => eventTypes.find((t) => t.id === value)?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {eventTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="submit"
              disabled={savingInfo}
              className="brand-gradient border-0 text-white hover:opacity-90"
            >
              {savingInfo ? "Salvando..." : "Salvar"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold tracking-tight">Momentos de exibição</h2>
          <Button onClick={() => handleAddSlot(null)} disabled={addingSlot} variant="outline">
            <Plus className="size-4" />
            {addingSlot ? "Adicionando..." : "Adicionar momento em branco"}
          </Button>
        </div>

        {slots.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum momento cadastrado. Adicione o primeiro (ex: Abertura, Leitura, Salmo, Avisos).
          </p>
        ) : (
          slots.map((slot) => (
            <SlotCard
              key={slot.id}
              slot={slot}
              otherSlots={slots.filter((s) => s.id !== slot.id)}
              canvasWidth={template.canvas_width}
              canvasHeight={template.canvas_height}
              mediaAssets={mediaAssets}
              onMediaAssetAdded={handleMediaAssetAdded}
              onDeleted={() => handleSlotDeleted(slot.id)}
              onUpdated={handleSlotUpdated}
              onDuplicate={() => handleAddSlot(slot)}
              duplicating={addingSlot}
            />
          ))
        )}
      </div>
    </div>
  );
}
