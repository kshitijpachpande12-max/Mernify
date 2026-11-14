/**
 * AnimatedGradientText — Magic UI (https://magicui.design/docs/components/animated-gradient-text)
 * High performance animated gradient text headline component.
 * Linear Obsidian & Electric Iris styling.
 */
import React from "react";
import { cn } from "../../lib/utils";

export function AnimatedGradientText({
  children,
  className,
  speed = 1,
  colorFrom = "#ffffff",
  colorTo = "#818cf8",
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
        "inline-block bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-[length:200%_auto] bg-clip-text text-transparent animate-[text-shine_7s_linear_infinite]",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
