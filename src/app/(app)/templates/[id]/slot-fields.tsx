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
import type { FieldType, GradientDirection, SlotField } from "./types";

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
        field_type: "textarea",
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
      <p className="text-xs text-muted-foreground">
        Cada campo é uma linha independente na exibição, com sua própria cor de fundo (ou gradiente).
      </p>

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
              <TableHead>Cor</TableHead>
              <TableHead>Opacidade</TableHead>
              <TableHead>Gradiente</TableHead>
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
  const [bgColor, setBgColor] = useState(field.bg_color);
  const [bgOpacity, setBgOpacity] = useState(field.bg_opacity);
  const [gradientTo, setGradientTo] = useState(field.bg_gradient_to ?? "");
  const [gradientDirection, setGradientDirection] = useState<GradientDirection>(
    field.bg_gradient_direction,
  );
  const [saving, setSaving] = useState(false);

  const dirty =
    key !== field.key ||
    label !== field.label ||
    fieldType !== field.field_type ||
    required !== field.required ||
    bgColor !== field.bg_color ||
    bgOpacity !== field.bg_opacity ||
    gradientTo !== (field.bg_gradient_to ?? "") ||
    gradientDirection !== field.bg_gradient_direction;

  async function handleSave() {
    setSaving(true);
    const updatedField: SlotField = {
      ...field,
      key,
      label,
      field_type: fieldType,
      required,
      bg_color: bgColor,
      bg_opacity: bgOpacity,
      bg_gradient_to: gradientTo || null,
      bg_gradient_direction: gradientDirection,
    };
    const supabase = createClient();
    const { data, error } = await supabase
      .from("template_slot_fields")
      .update({
        key,
        label,
        field_type: fieldType,
        required,
        bg_color: bgColor,
        bg_opacity: bgOpacity,
        bg_gradient_to: gradientTo || null,
        bg_gradient_direction: gradientDirection,
      })
      .eq("id", field.id)
      .select("id");
    setSaving(false);

    if (error) {
      toast.error("Não foi possível salvar o campo", { description: error.message });
      return;
    }
    if (!data || data.length === 0) {
      toast.error("Não foi possível salvar o campo", {
        description: "O campo não foi encontrado. Recarregue a página e tente novamente.",
      });
      return;
    }
    onUpdated(updatedField);
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
      <TableCell>
        <Input
          type="color"
          className="h-8 w-12 p-1"
          value={bgColor}
          onChange={(e) => setBgColor(e.target.value)}
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          step={0.05}
          min={0}
          max={1}
          className="h-8 w-20"
          value={bgOpacity}
          onChange={(e) => setBgOpacity(Number(e.target.value))}
        />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Checkbox
            checked={gradientTo !== ""}
            onCheckedChange={(v) => setGradientTo(v === true ? bgColor : "")}
          />
          {gradientTo !== "" && (
            <>
              <Input
                type="color"
                className="h-8 w-12 p-1"
                value={gradientTo}
                onChange={(e) => setGradientTo(e.target.value)}
              />
              <Select
                value={gradientDirection}
                onValueChange={(v) => v && setGradientDirection(v as GradientDirection)}
              >
                <SelectTrigger className="h-8 w-28">
                  <SelectValue>
                    {(value: GradientDirection | null) =>
                      value === "vertical" ? "Vertical" : "Horizontal"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="horizontal">Horizontal</SelectItem>
                  <SelectItem value="vertical">Vertical</SelectItem>
                </SelectContent>
              </Select>
            </>
          )}
        </div>
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
