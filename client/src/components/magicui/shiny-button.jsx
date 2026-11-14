/**
 * ShinyButton — Magic UI (https://magicui.design/docs/components/shiny-button)
 * A clean modern button with dynamic sheen animation.
 * Adapted from official Magic UI source (MIT License).
 */
import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

export const ShinyButton = React.forwardRef(
  ({ children, className, disabled, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        disabled={disabled}
        whileHover={{ scale: disabled ? 1 : 1.02 }}
        whileTap={{ scale: disabled ? 1 : 0.98 }}
        className={cn(
          "relative overflow-hidden rounded-xl px-6 py-2.5 font-bold transition-all duration-300 ease-out cursor-pointer",
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
        {/* Shimmer sweep effect */}
        <motion.span
          className="absolute inset-0 z-0 block bg-gradient-to-r from-transparent via-white/15 to-transparent -skew-x-12"
          initial={{ x: "-100%" }}
          animate={{ x: "200%" }}
          transition={{
            repeat: Infinity,
            repeatDelay: 2.5,
            duration: 1.5,
            ease: "easeInOut",
          }}
        />
      </motion.button>
    );
  }
);

ShinyButton.displayName = "ShinyButton";
