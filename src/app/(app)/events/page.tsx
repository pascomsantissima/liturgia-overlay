import Link from "next/link";
import { CalendarDays, PlaySquare, Radio, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const STATUS_LABEL: Record<string, string> = {
  draft: "Rascunho",
  live: "No ar",
  archived: "Arquivado",
};

export default async function EventsPage() {
  const supabase = await createClient();
  const { data: events } = await supabase
    .from("live_events")
    .select("id, name, event_date, status, templates(name)")
    .order("event_date", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Eventos</h1>
          <p className="text-sm text-muted-foreground">
            Missas, grupos de oração e palestras criados a partir de um template.
          </p>
        </div>
        <Button render={<Link href="/events/new" />} nativeButton={false} className="brand-gradient border-0 text-white hover:opacity-90">
          <CalendarDays className="size-4" />
          Novo evento
        </Button>
      </div>

      {!events || events.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Sparkles className="size-6" />
          </div>
          <p className="text-sm font-medium">Nenhum evento criado ainda</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Crie um evento a partir de um template para preparar a próxima transmissão.
          </p>
          <Button render={<Link href="/events/new" />} nativeButton={false} size="sm" className="mt-1">
            Criar o primeiro evento
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <Card key={event.id} className="overflow-hidden py-0">
              <div className="brand-gradient h-1.5" />
              <CardHeader className="pt-5">
                <CardTitle className="font-heading text-base">{event.name}</CardTitle>
                <CardDescription className="flex items-center gap-1.5">
                  <CalendarDays className="size-3.5" />
                  {(event.templates as unknown as { name: string } | null)?.name ?? "—"} ·{" "}
                  {new Date(event.event_date + "T00:00:00").toLocaleDateString("pt-BR")}
                </CardDescription>
                <CardAction>
                  <Badge variant={event.status === "live" ? "default" : "secondary"}>
                    {event.status === "live" && <Radio className="size-3" />}
                    {STATUS_LABEL[event.status] ?? event.status}
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardContent className="flex gap-2 pb-5">
                <Button
                  render={<Link href={`/events/${event.id}/content`} />}
                  nativeButton={false}
                  variant="outline"
                  size="sm"
                >
                  Preencher conteúdo
                </Button>
                <Button render={<Link href={`/events/${event.id}/control`} />} nativeButton={false} size="sm">
                  <PlaySquare className="size-4" />
                  Controlar
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
