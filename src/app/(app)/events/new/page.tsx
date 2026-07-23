import { createClient } from "@/lib/supabase/server";
import { NewEventForm } from "./new-event-form";

export default async function NewEventPage() {
  const supabase = await createClient();
  const { data: templates } = await supabase
    .from("templates")
    .select("id, name, event_types(name)")
    .order("name");

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Novo evento</h1>
        <p className="text-sm text-muted-foreground">
          Escolha o template e o dia. Depois é só preencher o conteúdo.
        </p>
      </div>
      <NewEventForm
        templates={(templates ?? []).map((t) => ({
          id: t.id,
          name: t.name,
          typeName: (t.event_types as unknown as { name: string } | null)?.name ?? "",
        }))}
      />
    </div>
  );
}
