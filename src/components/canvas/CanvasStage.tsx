"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export function CanvasStage({
  width,
  height,
  children,
  className,
}: {
  width: number;
  height: number;
  children: (scale: number) => ReactNode;
  className?: string;
}) {
  const outerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const entryWidth = entries[0]?.contentRect.width;
      if (entryWidth) setScale(entryWidth / width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [width]);

  return (
    <div
      ref={outerRef}
      className={className}
      style={{ position: "relative", width: "100%", aspectRatio: `${width} / ${height}` }}
    >
      {scale > 0 && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width,
            height,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          {children(scale)}
        </div>
      )}
    </div>
  );
}
