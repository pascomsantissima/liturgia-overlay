"use client";

import { Rnd } from "react-rnd";
import { CanvasStage } from "./CanvasStage";
import { SlotRenderer, type SlotRenderData } from "@/components/slot-renderer/SlotRenderer";

export type CanvasBox = { pos_x: number; pos_y: number; width: number; height: number };

export function SlotCanvasEditor({
  canvasWidth,
  canvasHeight,
  otherSlots,
  activeSlot,
  onChange,
}: {
  canvasWidth: number;
  canvasHeight: number;
  otherSlots: (CanvasBox & { label: string })[];
  activeSlot: SlotRenderData;
  onChange: (box: CanvasBox) => void;
}) {
  return (
    <CanvasStage width={canvasWidth} height={canvasHeight} className="overflow-hidden rounded-md border bg-[repeating-conic-gradient(#374151_0%_25%,#1f2937_0%_50%)] bg-[length:32px_32px]">
      {(scale) => (
        <>
          {otherSlots.map((slot, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: slot.pos_x,
                top: slot.pos_y,
                width: slot.width,
                height: slot.height,
                border: "1px dashed rgba(255,255,255,0.4)",
              }}
            >
              <span className="absolute -top-5 left-0 text-[11px] text-white/70">{slot.label}</span>
            </div>
          ))}

          <Rnd
            bounds="parent"
            scale={scale}
            position={{ x: activeSlot.pos_x, y: activeSlot.pos_y }}
            size={{ width: activeSlot.width, height: activeSlot.height }}
            onDragStop={(_e, d) => {
              onChange({ pos_x: d.x, pos_y: d.y, width: activeSlot.width, height: activeSlot.height });
            }}
            onResizeStop={(_e, _dir, ref, _delta, position) => {
              onChange({
                pos_x: position.x,
                pos_y: position.y,
                width: parseInt(ref.style.width, 10),
                height: parseInt(ref.style.height, 10),
              });
            }}
            style={{ border: "2px solid #22c55e" }}
          >
            <SlotRenderer slot={activeSlot} absolute={false} />
          </Rnd>
        </>
      )}
    </CanvasStage>
  );
}
