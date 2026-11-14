/**
 * ShinyButton — Magic UI (https://magicui.design/docs/components/shiny-button)
 * A clean modern button with dynamic sheen animation.
 * Linear Obsidian & Electric Iris styling.
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
          "bg-gradient-to-b from-indigo-600 to-indigo-700 text-white border border-indigo-400/40 shadow-lg shadow-indigo-950/50",
          "hover:border-indigo-300 hover:shadow-indigo-500/25 hover:from-indigo-500 hover:to-indigo-600",
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
