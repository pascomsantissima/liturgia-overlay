import Link from "next/link";
import { LayoutTemplate, Layers, PenLine } from "lucide-react";
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

export default async function TemplatesPage() {
  const supabase = await createClient();
  const { data: templates } = await supabase
    .from("templates")
    .select("id, name, event_types(name), template_slots(id)")
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Templates</h1>
          <p className="text-sm text-muted-foreground">
            Estruturas reutilizáveis para Missa, Grupo de Oração e Palestra.
          </p>
        </div>
        <Button render={<Link href="/templates/new" />} nativeButton={false} className="brand-gradient border-0 text-white hover:opacity-90">
          <LayoutTemplate className="size-4" />
          Novo template
        </Button>
      </div>

      {!templates || templates.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <LayoutTemplate className="size-6" />
          </div>
          <p className="text-sm font-medium">Nenhum template criado ainda</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Monte a estrutura visual dos textos que aparecem na transmissão.
          </p>
          <Button render={<Link href="/templates/new" />} nativeButton={false} size="sm" className="mt-1">
            Criar o primeiro template
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className="overflow-hidden py-0">
              <div className="brand-gradient h-1.5" />
              <CardHeader className="pt-5">
                <CardTitle className="font-heading text-base">{template.name}</CardTitle>
                <CardDescription className="flex items-center gap-1.5">
                  <Layers className="size-3.5" />
                  {template.template_slots?.length ?? 0} momento(s)
                </CardDescription>
                <CardAction>
                  <Badge variant="secondary">
                    {(template.event_types as unknown as { name: string } | null)?.name ?? "—"}
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardContent className="pb-5">
                <Button
                  render={<Link href={`/templates/${template.id}`} />}
                  nativeButton={false}
                  variant="outline"
                  size="sm"
                >
                  <PenLine className="size-4" />
                  Editar
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
