/**
 * ShinyButton — Magic UI (https://magicui.design/docs/components/shiny-button)
 * A clean modern button with dynamic sheen animation.
 * Zero external dependency implementation.
 */
import React from "react";
import { cn } from "../../lib/utils";

export const ShinyButton = React.forwardRef(
  ({ children, className, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          "shiny-btn relative overflow-hidden rounded-xl px-6 py-2.5 font-bold transition-all duration-200 ease-out cursor-pointer active:scale-[0.98] hover:scale-[1.01]",
          "bg-gradient-to-b from-zinc-800 to-zinc-900 text-white border border-zinc-700/80 shadow-lg shadow-black/40",
          "hover:border-zinc-500 hover:shadow-white/10 hover:from-zinc-750 hover:to-zinc-850",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
          className
        )}
        {...props}
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          {children}
        </span>
      </button>
    );
  }
);

ShinyButton.displayName = "ShinyButton";
