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
import type { SlotWithFields, TemplateWithType } from "./types";

export function TemplateEditor({
  template,
  initialSlots,
  eventTypes,
}: {
  template: TemplateWithType;
  initialSlots: SlotWithFields[];
  eventTypes: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [name, setName] = useState(template.name);
  const [eventTypeId, setEventTypeId] = useState(template.event_type_id);
  const [slots, setSlots] = useState(initialSlots);
  const [savingInfo, setSavingInfo] = useState(false);
  const [addingSlot, setAddingSlot] = useState(false);
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
    const { data, error } = await supabase
      .from("template_slots")
      .insert({
        template_id: template.id,
        key: `momento-${nextOrder + 1}`,
        label: "Novo momento",
        sort_order: nextOrder,
      })
      .select("*")
      .single();
    addingSlotRef.current = false;
    setAddingSlot(false);

    if (error || !data) {
      toast.error("Não foi possível adicionar o momento", { description: error?.message });
      return;
    }

    setSlots((prev) => [...prev, { ...data, template_slot_fields: [] }]);
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
          <Button onClick={handleAddSlot} disabled={addingSlot} variant="outline">
            <Plus className="size-4" />
            {addingSlot ? "Adicionando..." : "Adicionar momento"}
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
              onDeleted={() => handleSlotDeleted(slot.id)}
              onUpdated={handleSlotUpdated}
            />
          ))
        )}
      </div>
    </div>
  );
}
