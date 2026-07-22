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

  if (!snapshot?.active_slot) {
    return <div className="h-screen w-screen bg-transparent" />;
  }

  const slot = snapshot.active_slot;

  return (
    <div className="h-screen w-screen bg-transparent">
      <CanvasStage width={snapshot.canvas.width} height={snapshot.canvas.height}>
        {() => (
          <SlotRenderer
            slot={{
              ...slot,
              fields: slot.fields.map((f) => ({ key: f.key, label: f.label, value: f.value })),
            }}
          />
        )}
      </CanvasStage>
    </div>
  );
}
