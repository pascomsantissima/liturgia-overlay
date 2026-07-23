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

export function NewTemplateForm({ eventTypes }: { eventTypes: { id: string; name: string }[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [eventTypeId, setEventTypeId] = useState(eventTypes[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (loadingRef.current) return;
    if (!eventTypeId) {
      toast.error("Selecione o tipo de evento");
      return;
    }
    loadingRef.current = true;
    setLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase
      .from("templates")
      .insert({ name, event_type_id: eventTypeId })
      .select("id")
      .single();

    loadingRef.current = false;
    setLoading(false);

    if (error || !data) {
      toast.error("Não foi possível criar o template", { description: error?.message });
      return;
    }

    toast.success("Template criado");
    router.push(`/templates/${data.id}`);
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              required
              placeholder="Missa dominical"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="event-type">Tipo de evento</Label>
            <Select value={eventTypeId} onValueChange={(v) => v && setEventTypeId(v)}>
              <SelectTrigger id="event-type" className="w-full">
                <SelectValue placeholder="Selecione">
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
            disabled={loading}
            className="mt-2 brand-gradient border-0 text-white hover:opacity-90"
          >
            {loading ? "Criando..." : "Criar template"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
