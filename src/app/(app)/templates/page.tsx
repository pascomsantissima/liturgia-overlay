import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function TemplatesPage() {
  const supabase = await createClient();
  const { data: templates } = await supabase
    .from("templates")
    .select("id, name, event_types(name), template_slots(id)")
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Templates</h1>
          <p className="text-sm text-muted-foreground">
            Estruturas reutilizáveis para Missa, Grupo de Oração e Palestra.
          </p>
        </div>
        <Button render={<Link href="/templates/new" />} nativeButton={false}>
          Novo template
        </Button>
      </div>

      {!templates || templates.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum template criado ainda.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <CardTitle>{template.name}</CardTitle>
                <CardDescription>
                  {(template.event_types as unknown as { name: string } | null)?.name ?? "—"} ·{" "}
                  {template.template_slots?.length ?? 0} momento(s)
                </CardDescription>
                <CardAction>
                  <Button
                    render={<Link href={`/templates/${template.id}`} />}
                    nativeButton={false}
                    variant="outline"
                    size="sm"
                  >
                    Editar
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
