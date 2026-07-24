"use client";

import { use, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CanvasStage } from "@/components/canvas/CanvasStage";
import { SlotRenderer } from "@/components/slot-renderer/SlotRenderer";
import type { PublicEventSnapshot } from "@/types/database";

export default function OverlayPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [snapshot, setSnapshot] = useState<PublicEventSnapshot | null>(null);

  useEffect(() => {
    document.documentElement.style.background = "transparent";
    document.body.style.background = "transparent";
  }, []);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function loadSnapshot() {
      const { data } = await supabase.rpc("get_public_event_snapshot", { token });
      if (!cancelled && data) setSnapshot(data);
    }

    loadSnapshot();

    const channel = supabase
      .channel(`overlay:${token}`, { config: { private: false } })
      .on("broadcast", { event: "snapshot_changed" }, () => {
        loadSnapshot();
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [token]);

  if (!snapshot) {
    return <div className="h-screen w-screen bg-transparent" />;
  }

  const slot = snapshot.active_slot;

  return (
    <div className="h-screen w-screen bg-transparent">
      <CanvasStage width={snapshot.canvas.width} height={snapshot.canvas.height}>
        {() => (
          <>
            {snapshot.images.map((img) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={img.id}
                src={img.image_url}
                alt=""
                style={{
                  position: "absolute",
                  left: img.pos_x,
                  top: img.pos_y,
                  width: img.width,
                  height: img.height,
                  objectFit: "contain",
                }}
              />
            ))}
            {slot && (
              <SlotRenderer
                slot={{
                  ...slot,
                  fields: slot.fields.map((f) => ({
                    key: f.key,
                    label: f.label,
                    value: f.value,
                    bg_color: f.bg_color,
                    bg_opacity: f.bg_opacity,
                    bg_gradient_to: f.bg_gradient_to,
                    bg_gradient_direction: f.bg_gradient_direction,
                  })),
                }}
              />
            )}
          </>
        )}
      </CanvasStage>
    </div>
  );
}
