"use client";

import { useAutoFitText } from "@/hooks/useAutoFitText";
import { lineBackgroundStyle } from "@/lib/color";
import type { AutofitConfig, LineBackground, TextStyle } from "@/types/database";

const PADDING = 16;
const IMAGE_GAP = 16;
const DEFAULT_TITLE_FONT_SIZE = 20;

export type SlotRenderField = LineBackground & {
  key: string;
  label: string;
  value: string;
};

export type SlotRenderData = LineBackground & {
  label: string;
  pos_x: number;
  pos_y: number;
  width: number;
  height: number;
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
  const fontFamily = slot.text_style.font_family ?? "Arial, Helvetica, sans-serif";
  const textColor = slot.text_style.color ?? "#ffffff";
  const titleColor = slot.text_style.title_color ?? textColor;
  const titleFontSize = slot.text_style.title_font_size ?? DEFAULT_TITLE_FONT_SIZE;
  const titleHeight = Math.round(titleFontSize * 1.6);

  const contentLeft = slot.image_url ? slot.image_pos_x + slot.image_width + IMAGE_GAP : PADDING;
  const contentWidth = Math.max(slot.width - contentLeft - PADDING, 10);
  const fieldsAreaHeight = Math.max(slot.height - titleHeight, 0);
  const fieldHeight = slot.fields.length > 0 ? fieldsAreaHeight / slot.fields.length : 0;

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
          left: 0,
          top: 0,
          width: slot.width,
          height: titleHeight,
          ...lineBackgroundStyle(slot),
        }}
      />
      <div
        style={{
          position: "absolute",
          left: contentLeft,
          top: 0,
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
            color: titleColor,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {slot.label}
        </span>
      </div>

      {slot.fields.map((field, index) => (
        <FieldLine
          key={field.key}
          field={field}
          top={titleHeight + index * fieldHeight}
          height={fieldHeight}
          contentLeft={contentLeft}
          contentWidth={contentWidth}
          fullWidth={slot.width}
          fontFamily={fontFamily}
          textColor={textColor}
          textStyle={slot.text_style}
          autofitConfig={slot.autofit_config}
        />
      ))}

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
    </div>
  );
}

function FieldLine({
  field,
  top,
  height,
  contentLeft,
  contentWidth,
  fullWidth,
  fontFamily,
  textColor,
  textStyle,
  autofitConfig,
}: {
  field: SlotRenderField;
  top: number;
  height: number;
  contentLeft: number;
  contentWidth: number;
  fullWidth: number;
  fontFamily: string;
  textColor: string;
  textStyle: TextStyle;
  autofitConfig: AutofitConfig;
}) {
  const { containerRef, textRef, fontSize } = useAutoFitText(field.value || " ", autofitConfig);
  const textHeight = Math.max(height - PADDING, 10);

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: 0,
          top,
          width: fullWidth,
          height,
          ...lineBackgroundStyle(field),
        }}
      />
      <div
        ref={containerRef}
        style={{
          position: "absolute",
          left: contentLeft,
          top: top + PADDING / 2,
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
            fontWeight: textStyle.font_weight ?? "700",
            textAlign: textStyle.text_align ?? "left",
            whiteSpace: autofitConfig.mode === "shrink-only" ? "nowrap" : "pre-wrap",
            overflowWrap: autofitConfig.mode === "shrink-and-wrap" ? "anywhere" : "normal",
            lineHeight: 1.2,
          }}
        >
          {field.value}
        </div>
      </div>
    </>
  );
}
