"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { FieldType, SlotField } from "./types";

export function SlotFields({
  slotId,
  fields,
  onChange,
}: {
  slotId: string;
  fields: SlotField[];
  onChange: (fields: SlotField[]) => void;
}) {
  const [adding, setAdding] = useState(false);
  const addingRef = useRef(false);

  async function handleAdd() {
    if (addingRef.current) return;
    addingRef.current = true;
    setAdding(true);
    const supabase = createClient();
    const nextOrder = fields.length;
    const { data, error } = await supabase
      .from("template_slot_fields")
      .insert({
        template_slot_id: slotId,
        key: `campo-${nextOrder + 1}`,
        label: "Novo campo",
        field_type: "text",
        sort_order: nextOrder,
      })
      .select("*")
      .single();
    addingRef.current = false;
    setAdding(false);

    if (error || !data) {
      toast.error("Não foi possível adicionar o campo", { description: error?.message });
      return;
    }
    onChange([...fields, data]);
  }

  function handleFieldUpdated(updated: SlotField) {
    onChange(fields.map((f) => (f.id === updated.id ? updated : f)));
  }

  function handleFieldDeleted(fieldId: string) {
    onChange(fields.filter((f) => f.id !== fieldId));
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Campos de texto do conteúdo</p>
        <Button size="sm" variant="outline" onClick={handleAdd} disabled={adding}>
          {adding ? "Adicionando..." : "Adicionar campo"}
        </Button>
      </div>

      {fields.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhum campo ainda (ex: &quot;referência&quot;, &quot;texto&quot;).
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Identificador</TableHead>
              <TableHead>Rótulo</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Obrigatório</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((field) => (
              <FieldRow
                key={field.id}
                field={field}
                onUpdated={handleFieldUpdated}
                onDeleted={() => handleFieldDeleted(field.id)}
              />
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function FieldRow({
  field,
  onUpdated,
  onDeleted,
}: {
  field: SlotField;
  onUpdated: (field: SlotField) => void;
  onDeleted: () => void;
}) {
  const [key, setKey] = useState(field.key);
  const [label, setLabel] = useState(field.label);
  const [fieldType, setFieldType] = useState<FieldType>(field.field_type);
  const [required, setRequired] = useState(field.required);
  const [saving, setSaving] = useState(false);

  const dirty =
    key !== field.key || label !== field.label || fieldType !== field.field_type || required !== field.required;

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("template_slot_fields")
      .update({ key, label, field_type: fieldType, required })
      .eq("id", field.id)
      .select("*")
      .single();
    setSaving(false);

    if (error || !data) {
      toast.error("Não foi possível salvar o campo", { description: error?.message });
      return;
    }
    onUpdated(data);
  }

  async function handleDelete() {
    if (!confirm(`Excluir o campo "${field.label}"?`)) return;
    const supabase = createClient();
    const { error } = await supabase.from("template_slot_fields").delete().eq("id", field.id);
    if (error) {
      toast.error("Não foi possível excluir o campo", { description: error.message });
      return;
    }
    onDeleted();
  }

  return (
    <TableRow>
      <TableCell>
        <Input value={key} onChange={(e) => setKey(e.target.value)} className="h-8 w-32" />
      </TableCell>
      <TableCell>
        <Input value={label} onChange={(e) => setLabel(e.target.value)} className="h-8 w-40" />
      </TableCell>
      <TableCell>
        <Select value={fieldType} onValueChange={(v) => v && setFieldType(v as FieldType)}>
          <SelectTrigger className="h-8 w-32">
            <SelectValue>
              {(value: FieldType | null) => (value === "textarea" ? "Texto longo" : "Texto curto")}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text">Texto curto</SelectItem>
            <SelectItem value="textarea">Texto longo</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Checkbox checked={required} onCheckedChange={(v) => setRequired(v === true)} />
      </TableCell>
      <TableCell className="flex gap-2">
        {dirty && (
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={handleDelete}>
          Excluir
        </Button>
      </TableCell>
    </TableRow>
  );
}
