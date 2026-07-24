"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { FreeImageCanvasEditor } from "@/components/canvas/FreeImageCanvasEditor";
import type { CanvasBox } from "@/components/canvas/SlotCanvasEditor";
import type { MediaAssetRow, TemplateImageRow } from "./types";

type Placement = TemplateImageRow & { image_url: string };

export function TemplateImages({
  templateId,
  canvasWidth,
  canvasHeight,
  slotsForContext,
  initialMediaAssets,
  initialImages,
}: {
  templateId: string;
  canvasWidth: number;
  canvasHeight: number;
  slotsForContext: { label: string; pos_x: number; pos_y: number; width: number; height: number }[];
  initialMediaAssets: MediaAssetRow[];
  initialImages: Placement[];
}) {
  const [mediaAssets, setMediaAssets] = useState(initialMediaAssets);
  const [images, setImages] = useState(initialImages);
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

    setMediaAssets((prev) => [...prev, data]);
    toast.success("Imagem enviada ao banco");
  }

  async function handleAddPlacement(asset: MediaAssetRow) {
    const supabase = createClient();
    const nextOrder = images.length;
    const { data, error } = await supabase
      .from("template_images")
      .insert({
        template_id: templateId,
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

    setImages((prev) => [...prev, { ...data, image_url: asset.image_url }]);
  }

  async function handleUpdatePlacement(placement: Placement, box: CanvasBox) {
    setImages((prev) => prev.map((p) => (p.id === placement.id ? { ...p, ...box } : p)));
    const supabase = createClient();
    const { error } = await supabase
      .from("template_images")
      .update(box)
      .eq("id", placement.id);

    if (error) {
      toast.error("Não foi possível salvar a posição", { description: error.message });
    }
  }

  async function handleRemovePlacement(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("template_images").delete().eq("id", id);
    if (error) {
      toast.error("Não foi possível remover", { description: error.message });
      return;
    }
    setImages((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-1 text-sm font-medium">Banco de imagens</p>
        <p className="mb-2 text-xs text-muted-foreground">
          Envie uma imagem uma vez e use quantas vezes quiser, em qualquer posição do canvas.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          {mediaAssets.map((asset) => (
            <button
              key={asset.id}
              type="button"
              onClick={() => handleAddPlacement(asset)}
              title="Adicionar ao canvas"
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
              className="text-sm"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file);
              }}
            />
          </div>
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Imagens no canvas</p>
        {images.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma imagem posicionada ainda. Clique numa imagem do banco acima para adicionar.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {images.map((placement) => (
              <Card key={placement.id} className="p-4">
                <CardContent className="flex flex-col gap-3 p-0">
                  <FreeImageCanvasEditor
                    canvasWidth={canvasWidth}
                    canvasHeight={canvasHeight}
                    imageUrl={placement.image_url}
                    box={{
                      pos_x: placement.pos_x,
                      pos_y: placement.pos_y,
                      width: placement.width,
                      height: placement.height,
                    }}
                    otherBoxes={slotsForContext}
                    onChange={(box) => handleUpdatePlacement(placement, box)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="self-start text-destructive"
                    onClick={() => handleRemovePlacement(placement.id)}
                  >
                    Remover do canvas
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
