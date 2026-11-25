/**
 * CODECINEMA SVG path renderer.
 * Draws SVG path data as native vector paths on the existing Canvas 2D surface.
 * This keeps frame rendering synchronous and deterministic for preview/export.
 */
export type SvgPathOptions = {
  x?: number;
  y?: number;
  scaleX?: number;
  scaleY?: number;
  rotation?: number;
  fill?: string | null;
  stroke?: string | null;
  lineWidth?: number;
  alpha?: number;
  fillRule?: CanvasFillRule;
};

export function drawSvgPath(
  ctx: CanvasRenderingContext2D,
  pathData: string,
  options: SvgPathOptions = {}
): boolean {
  if (typeof pathData !== "string" || !pathData.trim()) return false;
  try {
    const path = new Path2D(pathData);
    ctx.save();
    ctx.translate(options.x ?? 0, options.y ?? 0);
    ctx.rotate(options.rotation ?? 0);
    ctx.scale(options.scaleX ?? 1, options.scaleY ?? 1);
    ctx.globalAlpha *= Math.max(0, Math.min(1, options.alpha ?? 1));
    if (options.fill !== null) {
      ctx.fillStyle = options.fill ?? "#ffffff";
      ctx.fill(path, options.fillRule ?? "nonzero");
    }
    if (options.stroke) {
      ctx.strokeStyle = options.stroke;
      ctx.lineWidth = Math.max(0, options.lineWidth ?? 1);
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.stroke(path);
    }
    ctx.restore();
    return true;
  } catch {
    return false;
  }
}
