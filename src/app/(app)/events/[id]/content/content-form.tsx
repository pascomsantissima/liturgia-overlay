"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EventFieldValueRow, SlotWithFields } from "./types";

export function ContentForm({
  eventId,
  eventName,
  templateName,
  slots,
  initialValues,
}: {
  eventId: string;
  eventName: string;
  templateName: string;
  slots: SlotWithFields[];
  initialValues: EventFieldValueRow[];
}) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(initialValues.map((v) => [v.template_slot_field_id, v.value])),
  );
  const dirtyRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`event-content-${eventId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "event_field_values", filter: `live_event_id=eq.${eventId}` },
        (payload) => {
          const row = payload.new as EventFieldValueRow | undefined;
          if (!row) return;
          if (dirtyRef.current.has(row.template_slot_field_id)) return;
          setValues((prev) => ({ ...prev, [row.template_slot_field_id]: row.value }));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  function handleFieldChange(fieldId: string, value: string) {
    dirtyRef.current.add(fieldId);
    setValues((prev) => ({ ...prev, [fieldId]: value }));
  }

  async function handleSaveSlot(slot: SlotWithFields) {
    const supabase = createClient();
    const rows = slot.template_slot_fields.map((field) => ({
      live_event_id: eventId,
      template_slot_field_id: field.id,
      value: values[field.id] ?? "",
    }));

    const { error } = await supabase
      .from("event_field_values")
      .upsert(rows, { onConflict: "live_event_id,template_slot_field_id" });

    if (error) {
      toast.error("Não foi possível salvar", { description: error.message });
      return;
    }

    slot.template_slot_fields.forEach((f) => dirtyRef.current.delete(f.id));
    toast.success(`"${slot.label}" salvo`);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">{eventName}</h1>
        <p className="text-sm text-muted-foreground">
          {templateName} · preencha o texto de cada momento. A estrutura do template não pode ser
          alterada aqui.
        </p>
      </div>

      {slots.length === 0 ? (
        <p className="text-sm text-muted-foreground">Este template ainda não tem momentos configurados.</p>
      ) : (
        slots.map((slot) => (
          <Card key={slot.id} className="overflow-hidden py-0">
            <div className="brand-gradient h-1" />
            <CardHeader className="pt-5">
              <CardTitle className="font-heading">{slot.label}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 pb-5">
              {slot.template_slot_fields.length === 0 ? (
                <p className="text-sm text-muted-foreground">Este momento não tem campos de texto.</p>
              ) : (
                slot.template_slot_fields.map((field) => (
                  <div key={field.id} className="flex flex-col gap-2">
                    <Label htmlFor={field.id}>
                      {field.label}
                      {field.required && <span className="text-destructive"> *</span>}
                    </Label>
                    {field.field_type === "textarea" ? (
                      <Textarea
                        id={field.id}
                        rows={4}
                        maxLength={field.max_length ?? undefined}
                        value={values[field.id] ?? ""}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      />
                    ) : (
                      <Input
                        id={field.id}
                        maxLength={field.max_length ?? undefined}
                        value={values[field.id] ?? ""}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      />
                    )}
                  </div>
                ))
              )}
              {slot.template_slot_fields.length > 0 && (
                <Button
                  onClick={() => handleSaveSlot(slot)}
                  className="self-start brand-gradient border-0 text-white hover:opacity-90"
                >
                  Salvar {slot.label}
                </Button>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
