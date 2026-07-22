import { createClient } from "@/lib/supabase/server";
import { NewTemplateForm } from "./new-template-form";

export default async function NewTemplatePage() {
  const supabase = await createClient();
  const { data: eventTypes } = await supabase.from("event_types").select("id, name").order("name");

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Novo template</h1>
        <p className="text-sm text-muted-foreground">
          Depois de criado, adicione os momentos (slots) de exibição.
        </p>
      </div>
      <NewTemplateForm eventTypes={eventTypes ?? []} />
    </div>
  );
}
