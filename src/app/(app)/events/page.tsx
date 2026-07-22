import Link from "next/link";
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Eventos</h1>
          <p className="text-sm text-muted-foreground">
            Missas, grupos de oração e palestras criados a partir de um template.
          </p>
        </div>
        <Button render={<Link href="/events/new" />} nativeButton={false}>
          Novo evento
        </Button>
      </div>

      {!events || events.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum evento criado ainda.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <Card key={event.id}>
              <CardHeader>
                <CardTitle>{event.name}</CardTitle>
                <CardDescription>
                  {(event.templates as unknown as { name: string } | null)?.name ?? "—"} ·{" "}
                  {new Date(event.event_date + "T00:00:00").toLocaleDateString("pt-BR")}
                </CardDescription>
                <CardAction>
                  <Badge variant={event.status === "live" ? "default" : "secondary"}>
                    {STATUS_LABEL[event.status] ?? event.status}
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Button
                  render={<Link href={`/events/${event.id}/content`} />}
                  nativeButton={false}
                  variant="outline"
                  size="sm"
                >
                  Preencher conteúdo
                </Button>
                <Button
                  render={<Link href={`/events/${event.id}/control`} />}
                  nativeButton={false}
                  size="sm"
                >
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
