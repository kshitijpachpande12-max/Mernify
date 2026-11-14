/**
 * BorderBeam — Magic UI (https://magicui.design/docs/components/border-beam)
 * An animated beam of light that travels along the border of its container.
 * Linear Obsidian & Electric Iris styling.
 */
import React from "react";
import { cn } from "../../lib/utils";

export function BorderBeam({
  className,
  size = 60,
  duration = 9,
  borderWidth = 1,
  colorFrom = "#818cf8",
  colorTo = "#22242a",
  style,
}) {
  return (
    <div
      className={cn("border-beam pointer-events-none absolute inset-0 rounded-[inherit]", className)}
      style={{
        animationDuration: `${duration}s`,
        padding: `${borderWidth}px`,
        ...style,
      }}
      aria-hidden="true"
    />
  );
}
