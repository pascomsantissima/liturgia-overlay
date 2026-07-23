"use client";

import { useAutoFitText } from "@/hooks/useAutoFitText";
import { hexToRgba } from "@/lib/color";
import type { AutofitConfig, TextStyle } from "@/types/database";

const PADDING = 16;
const IMAGE_GAP = 16;
const TITLE_GAP = 4;
const DEFAULT_TITLE_FONT_SIZE = 20;

export type SlotRenderField = {
  key: string;
  label: string;
  value: string;
};

export type SlotRenderData = {
  label: string;
  pos_x: number;
  pos_y: number;
  width: number;
  height: number;
  bg_color: string;
  bg_opacity: number;
  image_url: string | null;
  image_pos_x: number;
  image_pos_y: number;
  image_width: number;
  image_height: number;
  text_style: TextStyle;
  autofit_config: AutofitConfig;
  fields: SlotRenderField[];
};

/**
 * `absolute=false` renders filling its parent instead of using slot.pos_x/y/width/height —
 * usado quando um container externo (ex: react-rnd) já controla a posição/tamanho.
 */
export function SlotRenderer({ slot, absolute = true }: { slot: SlotRenderData; absolute?: boolean }) {
  const text = slot.fields
    .map((f) => f.value)
    .filter(Boolean)
    .join("\n");

  const { containerRef, textRef, fontSize } = useAutoFitText(text || " ", slot.autofit_config);

  const fontFamily = slot.text_style.font_family ?? "Arial, Helvetica, sans-serif";
  const textColor = slot.text_style.color ?? "#ffffff";
  const titleFontSize = slot.text_style.title_font_size ?? DEFAULT_TITLE_FONT_SIZE;
  const titleHeight = Math.round(titleFontSize * 1.6);

  const contentLeft = slot.image_url ? slot.image_pos_x + slot.image_width + IMAGE_GAP : PADDING;
  const contentWidth = Math.max(slot.width - contentLeft - PADDING, 10);
  const textHeight = Math.max(slot.height - PADDING * 2 - titleHeight - TITLE_GAP, 10);

  return (
    <div
      style={
        absolute
          ? {
              position: "absolute",
              left: slot.pos_x,
              top: slot.pos_y,
              width: slot.width,
              height: slot.height,
              overflow: "hidden",
            }
          : { position: "relative", width: "100%", height: "100%", overflow: "hidden" }
      }
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: hexToRgba(slot.bg_color, slot.bg_opacity),
        }}
      />

      {slot.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={slot.image_url}
          alt=""
          style={{
            position: "absolute",
            left: slot.image_pos_x,
            top: slot.image_pos_y,
            width: slot.image_width,
            height: slot.image_height,
            objectFit: "contain",
          }}
        />
      )}

      <div
        style={{
          position: "absolute",
          left: contentLeft,
          top: PADDING,
          width: contentWidth,
          height: titleHeight,
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
        }}
      >
        <span
          style={{
            width: "100%",
            fontFamily,
            fontSize: titleFontSize,
            fontWeight: 700,
            letterSpacing: "0.02em",
            textTransform: "uppercase",
            color: textColor,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {slot.label}
        </span>
      </div>

      <div
        ref={containerRef}
        style={{
          position: "absolute",
          left: contentLeft,
          top: PADDING + titleHeight + TITLE_GAP,
          width: contentWidth,
          height: textHeight,
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          ref={textRef}
          style={{
            width: "100%",
            fontSize,
            fontFamily,
            color: textColor,
            fontWeight: slot.text_style.font_weight ?? "700",
            textAlign: slot.text_style.text_align ?? "left",
            whiteSpace: slot.autofit_config.mode === "shrink-only" ? "nowrap" : "pre-wrap",
            overflowWrap: slot.autofit_config.mode === "shrink-and-wrap" ? "anywhere" : "normal",
            lineHeight: 1.2,
          }}
        >
          {text}
        </div>
      </div>
    </div>
  );
}
