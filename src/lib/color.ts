export function hexToRgba(hex: string, opacity: number): string {
  const normalized = hex.replace("#", "");
  const full =
    normalized.length === 3
      ? normalized
          .split("")
          .map((c) => c + c)
          .join("")
      : normalized;

  const r = parseInt(full.slice(0, 2), 16) || 0;
  const g = parseInt(full.slice(2, 4), 16) || 0;
  const b = parseInt(full.slice(4, 6), 16) || 0;

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/** Estilo de fundo (sólido ou gradiente) de uma linha (título ou campo). */
export function lineBackgroundStyle(line: {
  bg_color: string;
  bg_opacity: number;
  bg_gradient_to?: string | null;
  bg_gradient_direction?: "horizontal" | "vertical";
}): { backgroundColor: string } | { backgroundImage: string } {
  if (!line.bg_gradient_to) {
    return { backgroundColor: hexToRgba(line.bg_color, line.bg_opacity) };
  }

  const from = hexToRgba(line.bg_color, line.bg_opacity);
  const to = hexToRgba(line.bg_gradient_to, line.bg_opacity);
  const angle = line.bg_gradient_direction === "vertical" ? "to bottom" : "to right";

  return { backgroundImage: `linear-gradient(${angle}, ${from}, ${to})` };
}
