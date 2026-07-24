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
import { Separator } from "@/components/ui/separator";
import { SlotCard } from "./slot-card";
import { TemplateImages } from "./template-images";
import type { MediaAssetRow, SlotWithFields, TemplateImageRow, TemplateWithType } from "./types";

export function TemplateEditor({
  template,
  initialSlots,
  eventTypes,
  initialMediaAssets,
  initialImages,
}: {
  template: TemplateWithType;
  initialSlots: SlotWithFields[];
  eventTypes: { id: string; name: string }[];
  initialMediaAssets: MediaAssetRow[];
  initialImages: (TemplateImageRow & { image_url: string })[];
}) {
  const router = useRouter();
  const [name, setName] = useState(template.name);
  const [eventTypeId, setEventTypeId] = useState(template.event_type_id);
  const [slots, setSlots] = useState(initialSlots);
  const [savingInfo, setSavingInfo] = useState(false);
  const [addingSlot, setAddingSlot] = useState(false);
  const [baseSlotId, setBaseSlotId] = useState<string | null>(null);
  const addingSlotRef = useRef(false);

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

  async function handleAddSlot() {
    if (addingSlotRef.current) return;
    addingSlotRef.current = true;
    setAddingSlot(true);
    const supabase = createClient();
    const nextOrder = slots.length;
    const baseSlot = slots.find((s) => s.id === baseSlotId) ?? null;

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

    addingSlotRef.current = false;
    setAddingSlot(false);
    setSlots((prev) => [...prev, { ...data, template_slot_fields: clonedFields }]);
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
          <div className="flex items-end gap-2">
            {slots.length > 0 && (
              <div className="flex flex-col gap-2">
                <Label className="text-xs text-muted-foreground">
                  Basear posição, cores e campos em
                </Label>
                <Select
                  value={baseSlotId ?? "none"}
                  onValueChange={(v) => setBaseSlotId(v === "none" ? null : v)}
                >
                  <SelectTrigger className="w-56">
                    <SelectValue>
                      {(value: string | null) =>
                        value && value !== "none"
                          ? (slots.find((s) => s.id === value)?.label ?? "Em branco")
                          : "Em branco"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Em branco</SelectItem>
                    {slots.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button onClick={handleAddSlot} disabled={addingSlot} variant="outline">
              <Plus className="size-4" />
              {addingSlot ? "Adicionando..." : "Adicionar momento"}
            </Button>
          </div>
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
              onDeleted={() => handleSlotDeleted(slot.id)}
              onUpdated={handleSlotUpdated}
            />
          ))
        )}
      </div>

      <Separator />

      <div>
        <h2 className="font-heading text-lg font-semibold tracking-tight">
          Imagens no canvas (posição livre)
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Use esta seção para colocar uma imagem em qualquer ponto da tela (logo, marca d&apos;água,
          etc.), independente dos momentos acima — ela fica sempre visível, sem depender de qual
          momento está ativo.
        </p>
        <TemplateImages
          templateId={template.id}
          canvasWidth={template.canvas_width}
          canvasHeight={template.canvas_height}
          slotsForContext={slots.map((s) => ({
            label: s.label,
            pos_x: s.pos_x,
            pos_y: s.pos_y,
            width: s.width,
            height: s.height,
          }))}
          initialMediaAssets={initialMediaAssets}
          initialImages={initialImages}
        />
      </div>
    </div>
  );
}
