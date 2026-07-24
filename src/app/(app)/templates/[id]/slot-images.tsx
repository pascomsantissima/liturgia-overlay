"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Label } from "@/components/ui/label";
import type { MediaAssetRow, SlotImagePlacement } from "./types";

export function SlotImages({
  slotId,
  images,
  mediaAssets,
  onMediaAssetAdded,
  onPlacementAdded,
  onPlacementRemoved,
}: {
  slotId: string;
  images: SlotImagePlacement[];
  mediaAssets: MediaAssetRow[];
  onMediaAssetAdded: (asset: MediaAssetRow) => void;
  onPlacementAdded: (placement: SlotImagePlacement) => void;
  onPlacementRemoved: (id: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(file: File) {
    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `bank/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("template-assets")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      setUploading(false);
      toast.error("Não foi possível enviar a imagem", { description: uploadError.message });
      return;
    }

    const { data: publicUrlData } = supabase.storage.from("template-assets").getPublicUrl(path);

    const { data, error } = await supabase
      .from("media_assets")
      .insert({ name: file.name, image_url: publicUrlData.publicUrl })
      .select("*")
      .single();

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (error || !data) {
      toast.error("Não foi possível salvar no banco de imagens", { description: error?.message });
      return;
    }

    onMediaAssetAdded(data);
    toast.success("Imagem enviada ao banco");
  }

  async function handleAddPlacement(asset: MediaAssetRow) {
    const supabase = createClient();
    const nextOrder = images.length;
    const { data, error } = await supabase
      .from("template_images")
      .insert({
        template_slot_id: slotId,
        media_asset_id: asset.id,
        pos_x: 60,
        pos_y: 60,
        width: 200,
        height: 200,
        sort_order: nextOrder,
      })
      .select("*")
      .single();

    if (error || !data) {
      toast.error("Não foi possível adicionar ao canvas", { description: error?.message });
      return;
    }

    onPlacementAdded({ ...data, image_url: asset.image_url });
  }

  async function handleRemovePlacement(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("template_images").delete().eq("id", id);
    if (error) {
      toast.error("Não foi possível remover", { description: error.message });
      return;
    }
    onPlacementRemoved(id);
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="mb-1 text-sm font-medium">Imagens no canvas (posição livre deste momento)</p>
        <p className="mb-2 text-xs text-muted-foreground">
          Clique numa imagem do banco para colocá-la no canvas acima — arraste e redimensione ali
          mesmo, junto com a caixa de mensagem. Fica visível só quando este momento estiver ativo. O
          banco é compartilhado — envie uma vez e reaproveite em qualquer momento.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          {mediaAssets.map((asset) => (
            <button
              key={asset.id}
              type="button"
              onClick={() => handleAddPlacement(asset)}
              title="Adicionar ao canvas deste momento"
              className="flex size-16 items-center justify-center rounded border bg-muted/40 p-1 hover:ring-2 hover:ring-primary"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={asset.image_url} alt={asset.name} className="max-h-full max-w-full object-contain" />
            </button>
          ))}
          <div className="flex flex-col gap-1">
            <Label className="text-xs">Enviar nova imagem</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="cursor-pointer text-sm"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file);
              }}
            />
          </div>
        </div>
      </div>

      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((img) => (
            <div key={img.id} className="flex items-center gap-2 rounded border bg-muted/30 px-2 py-1 text-xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.image_url} alt="" className="size-6 object-contain" />
              <button
                type="button"
                onClick={() => handleRemovePlacement(img.id)}
                className="text-destructive hover:underline"
              >
                Remover do canvas
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
