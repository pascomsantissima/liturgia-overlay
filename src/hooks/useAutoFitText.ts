"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { AutofitConfig } from "@/types/database";

export function useAutoFitText(text: string, config: AutofitConfig) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState(config.max_font_size);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const textEl = textRef.current;
    if (!container || !textEl) return;

    function overflowsAt(size: number) {
      textEl!.style.fontSize = `${size}px`;
      if (config.mode === "shrink-only") {
        return textEl!.scrollWidth > container!.clientWidth || textEl!.scrollHeight > container!.clientHeight;
      }
      return textEl!.scrollHeight > container!.clientHeight;
    }

    function fit() {
      let lo = config.min_font_size;
      let hi = config.max_font_size;
      let best = lo;

      while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (!overflowsAt(mid)) {
          best = mid;
          lo = mid + 1;
        } else {
          hi = mid - 1;
        }
      }

      textEl!.style.fontSize = `${best}px`;
      setFontSize(best);
    }

    fit();

    const observer = new ResizeObserver(fit);
    observer.observe(container);
    return () => observer.disconnect();
  }, [text, config.mode, config.min_font_size, config.max_font_size]);

  return { containerRef, textRef, fontSize };
}
