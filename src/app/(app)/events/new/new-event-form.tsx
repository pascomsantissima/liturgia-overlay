"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
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
import { Card, CardContent } from "@/components/ui/card";

export function NewEventForm({
  templates,
}: {
  templates: { id: string; name: string; typeName: string }[];
}) {
  const router = useRouter();
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const [name, setName] = useState("");
  const [eventDate, setEventDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (loadingRef.current) return;
    if (!templateId) {
      toast.error("Selecione um template");
      return;
    }
    loadingRef.current = true;
    setLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase
      .from("live_events")
      .insert({ template_id: templateId, name, event_date: eventDate })
      .select("id")
      .single();

    loadingRef.current = false;
    setLoading(false);

    if (error || !data) {
      toast.error("Não foi possível criar o evento", { description: error?.message });
      return;
    }

    toast.success("Evento criado");
    router.push(`/events/${data.id}/content`);
  }

  if (templates.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhum template disponível ainda. Peça para um admin criar um template primeiro.
      </p>
    );
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="template">Template</Label>
            <Select value={templateId} onValueChange={(v) => v && setTemplateId(v)}>
              <SelectTrigger id="template" className="w-full">
                <SelectValue>
                  {(value: string | null) =>
                    templates.find((t) => t.id === value)?.name ?? "Selecione"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} {t.typeName ? `(${t.typeName})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Nome do evento</Label>
            <Input
              id="name"
              required
              placeholder="Missa de domingo, 19h"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="event-date">Data</Label>
            <Input
              id="event-date"
              type="date"
              required
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={loading} className="mt-2">
            {loading ? "Criando..." : "Criar evento"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
