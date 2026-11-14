/**
 * AnimatedGradientText — Magic UI (https://magicui.design/docs/components/animated-gradient-text)
 * High performance animated gradient text headline component.
 * Adapted from official Magic UI source (MIT License).
 */
import React from "react";
import { cn } from "../../lib/utils";

export function AnimatedGradientText({
  children,
  className,
  speed = 1,
  colorFrom = "#ffffff",
  colorTo = "#a1a1aa",
  ...props
}) {
  return (
    <span
      style={{
        "--bg-size": `${speed * 300}%`,
        "--color-from": colorFrom,
        "--color-to": colorTo,
      }}
      className={cn(
        "inline-block bg-gradient-to-r from-white via-zinc-400 to-white bg-[length:200%_auto] bg-clip-text text-transparent animate-[text-shine_6s_linear_infinite]",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
