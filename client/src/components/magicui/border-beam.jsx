/**
 * BorderBeam — Magic UI (https://magicui.design/docs/components/border-beam)
 * An animated beam of light that travels along the border of its container.
 * Adapted from the official Magic UI source (MIT License).
 */
import React from "react";
import { cn } from "../../lib/utils";
import { motion } from "framer-motion";

export function BorderBeam({
  className,
  size = 50,
  duration = 6,
  delay = 0,
  colorFrom = "#ffffff",
  colorTo = "#71717a",
  reverse = false,
  initialOffset = 0,
  borderWidth = 1.5,
  style,
}) {
  return (
    <div
      className="pointer-events-none absolute inset-0 rounded-[inherit] border border-transparent"
      style={{
        WebkitMaskImage:
          "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
        WebkitMaskComposite: "xor",
        maskImage:
          "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
        maskComposite: "exclude",
        padding: `${borderWidth}px`,
      }}
    >
      <motion.div
        className={cn("absolute aspect-square", className)}
        style={{
          width: size,
          offsetPath: `rect(0 auto auto 0 round ${size}px)`,
          background: `linear-gradient(to left, ${colorFrom}, ${colorTo}, transparent)`,
          ...style,
        }}
        initial={{ offsetDistance: `${initialOffset}%` }}
        animate={{
          offsetDistance: reverse
            ? [`${100 - initialOffset}%`, `${-initialOffset}%`]
            : [`${initialOffset}%`, `${100 + initialOffset}%`],
        }}
        transition={{
          repeat: Infinity,
          ease: "linear",
          duration,
          delay: -delay,
        }}
      />
    </div>
  );
}
