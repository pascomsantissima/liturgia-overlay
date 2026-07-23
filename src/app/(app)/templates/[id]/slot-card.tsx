"use client";

import { useRef, useState } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SlotFields } from "./slot-fields";
import { SlotCanvasEditor, type CanvasBox } from "@/components/canvas/SlotCanvasEditor";
import type { AutofitMode, SlotWithFields } from "./types";

export function SlotCard({
  slot,
  otherSlots,
  canvasWidth,
  canvasHeight,
  onDeleted,
  onUpdated,
}: {
  slot: SlotWithFields;
  otherSlots: SlotWithFields[];
  canvasWidth: number;
  canvasHeight: number;
  onDeleted: () => void;
  onUpdated: (slot: SlotWithFields) => void;
}) {
  const [form, setForm] = useState({
    key: slot.key,
    label: slot.label,
    pos_x: slot.pos_x,
    pos_y: slot.pos_y,
    width: slot.width,
    height: slot.height,
    bg_color: slot.bg_color,
    bg_opacity: slot.bg_opacity,
    image_url: slot.image_url,
    image_pos_x: slot.image_pos_x,
    image_pos_y: slot.image_pos_y,
    image_width: slot.image_width,
    image_height: slot.image_height,
    autofit_mode: slot.autofit_config.mode,
    min_font_size: slot.autofit_config.min_font_size,
    max_font_size: slot.autofit_config.max_font_size,
    title_font_size: slot.text_style.title_font_size ?? 20,
    text_color: slot.text_style.color ?? "#ffffff",
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("template_slots")
      .update({
        key: form.key,
        label: form.label,
        pos_x: form.pos_x,
        pos_y: form.pos_y,
        width: form.width,
        height: form.height,
        bg_color: form.bg_color,
        bg_opacity: form.bg_opacity,
        image_url: form.image_url,
        image_pos_x: form.image_pos_x,
        image_pos_y: form.image_pos_y,
        image_width: form.image_width,
        image_height: form.image_height,
        autofit_config: {
          mode: form.autofit_mode,
          min_font_size: form.min_font_size,
          max_font_size: form.max_font_size,
        },
        text_style: { ...slot.text_style, title_font_size: form.title_font_size, color: form.text_color },
      })
      .eq("id", slot.id)
      .select("*")
      .single();
    setSaving(false);

    if (error || !data) {
      toast.error("Não foi possível salvar o momento", { description: error?.message });
      return;
    }

    toast.success("Momento salvo");
    onUpdated({ ...data, template_slot_fields: slot.template_slot_fields });
  }

  async function handleDelete() {
    if (!confirm(`Excluir o momento "${slot.label}"? Essa ação não pode ser desfeita.`)) return;
    setDeleting(true);
    const supabase = createClient();
    const { error } = await supabase.from("template_slots").delete().eq("id", slot.id);
    setDeleting(false);

    if (error) {
      toast.error("Não foi possível excluir", { description: error.message });
      return;
    }
    onDeleted();
  }

  async function handleImageUpload(file: File) {
    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `${slot.template_id}/${slot.id}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("template-assets")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      setUploading(false);
      toast.error("Não foi possível enviar a imagem", { description: uploadError.message });
      return;
    }

    const { data } = supabase.storage.from("template-assets").getPublicUrl(path);
    set("image_url", data.publicUrl);
    setUploading(false);
  }

  function handleUseParishLogo() {
    const size = Math.min(100, Math.max(40, form.height - 24));
    set("image_url", "/logo.jpg");
    set("image_pos_x", 12);
    set("image_pos_y", Math.round((form.height - size) / 2));
    set("image_width", size);
    set("image_height", size);
  }

  const previewFields = slot.template_slot_fields.map((f) => ({
    key: f.key,
    label: f.label,
    value: f.label,
  }));

  return (
    <Card className="overflow-hidden py-0">
      <div className="brand-gradient h-1" />
      <CardHeader className="pt-5">
        <CardTitle className="font-heading">{slot.label || "Momento sem nome"}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 pb-5">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="flex flex-col gap-2">
            <Label>Identificador</Label>
            <Input value={form.key} onChange={(e) => set("key", e.target.value)} />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label>Nome do momento (título fixo exibido)</Label>
            <Input value={form.label} onChange={(e) => set("label", e.target.value)} />
          </div>
          <NumberField
            label="Tamanho do título"
            value={form.title_font_size}
            onChange={(v) => set("title_font_size", v)}
          />
        </div>

        <Separator />

        <div>
          <p className="mb-2 text-sm font-medium">Posição e tamanho</p>
          <p className="mb-3 text-xs text-muted-foreground">
            Arraste e redimensione a caixa verde para posicionar a mensagem na tela (1920×1080).
          </p>
          <SlotCanvasEditor
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
            otherSlots={otherSlots.map((s) => ({
              label: s.label,
              pos_x: s.pos_x,
              pos_y: s.pos_y,
              width: s.width,
              height: s.height,
            }))}
            activeSlot={{
              label: form.label,
              pos_x: form.pos_x,
              pos_y: form.pos_y,
              width: form.width,
              height: form.height,
              bg_color: form.bg_color,
              bg_opacity: form.bg_opacity,
              image_url: form.image_url,
              image_pos_x: form.image_pos_x,
              image_pos_y: form.image_pos_y,
              image_width: form.image_width,
              image_height: form.image_height,
              text_style: { ...slot.text_style, title_font_size: form.title_font_size, color: form.text_color },
              autofit_config: {
                mode: form.autofit_mode,
                min_font_size: form.min_font_size,
                max_font_size: form.max_font_size,
              },
              fields: previewFields.length > 0 ? previewFields : [{ key: "preview", label: "", value: form.label }],
            }}
            onChange={(box: CanvasBox) => {
              set("pos_x", box.pos_x);
              set("pos_y", box.pos_y);
              set("width", box.width);
              set("height", box.height);
            }}
          />
          <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <NumberField label="X" value={form.pos_x} onChange={(v) => set("pos_x", v)} />
            <NumberField label="Y" value={form.pos_y} onChange={(v) => set("pos_y", v)} />
            <NumberField label="Largura" value={form.width} onChange={(v) => set("width", v)} />
            <NumberField label="Altura" value={form.height} onChange={(v) => set("height", v)} />
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Cor de fundo</p>
          <div className="flex items-end gap-4">
            <div className="flex flex-col gap-2">
              <Label>Cor</Label>
              <Input
                type="color"
                className="h-9 w-16 p-1"
                value={form.bg_color}
                onChange={(e) => set("bg_color", e.target.value)}
              />
            </div>
            <NumberField
              label="Opacidade (0 a 1)"
              value={form.bg_opacity}
              step={0.05}
              min={0}
              max={1}
              onChange={(v) => set("bg_opacity", v)}
            />
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Imagem fixa (canto esquerdo)</p>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-2">
              <Label>Arquivo</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="text-sm"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                }}
                disabled={uploading}
              />
            </div>
            <Button type="button" variant="outline" size="sm" onClick={handleUseParishLogo}>
              Usar logo da Pascom
            </Button>
            {form.image_url && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.image_url} alt="" className="h-12 w-12 rounded border object-contain" />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    set("image_url", null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                >
                  Remover
                </Button>
              </>
            )}
          </div>
          {form.image_url && (
            <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <NumberField label="X" value={form.image_pos_x} onChange={(v) => set("image_pos_x", v)} />
              <NumberField label="Y" value={form.image_pos_y} onChange={(v) => set("image_pos_y", v)} />
              <NumberField label="Largura" value={form.image_width} onChange={(v) => set("image_width", v)} />
              <NumberField label="Altura" value={form.image_height} onChange={(v) => set("image_height", v)} />
            </div>
          )}
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Texto (título e mensagem)</p>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-2">
              <Label>Cor da fonte</Label>
              <Input
                type="color"
                className="h-9 w-16 p-1"
                value={form.text_color}
                onChange={(e) => set("text_color", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Modo de ajuste</Label>
              <Select
                value={form.autofit_mode}
                onValueChange={(v) => v && set("autofit_mode", v as AutofitMode)}
              >
                <SelectTrigger className="w-56">
                  <SelectValue>
                    {(value: AutofitMode | null) =>
                      value === "shrink-only" ? "Encolher numa linha só" : "Encolher e quebrar linha"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shrink-and-wrap">Encolher e quebrar linha</SelectItem>
                  <SelectItem value="shrink-only">Encolher numa linha só</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <NumberField
              label="Fonte mínima"
              value={form.min_font_size}
              onChange={(v) => set("min_font_size", v)}
            />
            <NumberField
              label="Fonte máxima"
              value={form.max_font_size}
              onChange={(v) => set("max_font_size", v)}
            />
          </div>
        </div>

        <Separator />

        <SlotFields
          slotId={slot.id}
          fields={slot.template_slot_fields}
          onChange={(fields) => onUpdated({ ...slot, ...form, template_slot_fields: fields })}
        />

        <Separator />

        <div className="flex items-center gap-2">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="brand-gradient border-0 text-white hover:opacity-90"
          >
            {saving ? "Salvando..." : "Salvar momento"}
          </Button>
          <Button onClick={handleDelete} disabled={deleting} variant="destructive">
            {deleting ? "Excluindo..." : "Excluir momento"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function NumberField({
  label,
  value,
  onChange,
  step = 1,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <Input
        type="number"
        className="w-28"
        value={value}
        step={step}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
