"use client";

import { Rnd } from "react-rnd";
import { CanvasStage } from "./CanvasStage";
import type { CanvasBox } from "./SlotCanvasEditor";

export function FreeImageCanvasEditor({
  canvasWidth,
  canvasHeight,
  imageUrl,
  box,
  otherBoxes,
  onChange,
}: {
  canvasWidth: number;
  canvasHeight: number;
  imageUrl: string;
  box: CanvasBox;
  otherBoxes: (CanvasBox & { label: string })[];
  onChange: (box: CanvasBox) => void;
}) {
  return (
    <CanvasStage
      width={canvasWidth}
      height={canvasHeight}
      className="overflow-hidden rounded-md border bg-[repeating-conic-gradient(#374151_0%_25%,#1f2937_0%_50%)] bg-[length:32px_32px]"
    >
      {(scale) => (
        <>
          {otherBoxes.map((b, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: b.pos_x,
                top: b.pos_y,
                width: b.width,
                height: b.height,
                border: "1px dashed rgba(255,255,255,0.35)",
              }}
            >
              <span className="absolute -top-5 left-0 text-[11px] text-white/60">{b.label}</span>
            </div>
          ))}

          <Rnd
            bounds="parent"
            scale={scale}
            position={{ x: box.pos_x, y: box.pos_y }}
            size={{ width: box.width, height: box.height }}
            onDragStop={(_e, d) => {
              onChange({ pos_x: Math.round(d.x), pos_y: Math.round(d.y), width: box.width, height: box.height });
            }}
            onResizeStop={(_e, _dir, ref, _delta, position) => {
              onChange({
                pos_x: Math.round(position.x),
                pos_y: Math.round(position.y),
                width: Math.round(parseInt(ref.style.width, 10)),
                height: Math.round(parseInt(ref.style.height, 10)),
              });
            }}
            style={{ border: "2px solid #22c55e" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="" className="h-full w-full object-contain" draggable={false} />
          </Rnd>
        </>
      )}
    </CanvasStage>
  );
}
