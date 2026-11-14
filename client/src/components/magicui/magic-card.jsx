/**
 * MagicCard — Magic UI (https://magicui.design/docs/components/magic-card)
 * A spotlight card with mouse-tracking gradient overlay.
 * Linear Obsidian & Electric Iris styling.
 */
import React, { useRef } from "react";
import { cn } from "../../lib/utils";

export function MagicCard({
  children,
  className,
  gradientSize = 260,
  gradientColor = "rgba(99, 102, 241, 0.08)",
  gradientOpacity = 0.8,
  ...props
}) {
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    el.style.setProperty("--my", `${e.clientY - rect.top}px`);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className={cn(
        "magic-card group relative flex size-full overflow-hidden rounded-2xl border border-[#22242a] bg-[#121316] text-[#f8fafc] shadow-2xl shadow-black/60 backdrop-blur-xl transition-all duration-300 hover:border-[#2e3038]",
        className
      )}
      style={{
        "--gradient-size": `${gradientSize}px`,
        "--gradient-color": gradientColor,
      }}
      {...props}
    >
      {/* Background Spotlight Glow */}
      <div
        className="pointer-events-none absolute -inset-px rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(var(--gradient-size, 260px) circle at var(--mx, -500px) var(--my, -500px), var(--gradient-color, rgba(99, 102, 241, 0.08)), transparent 80%)`,
        }}
        aria-hidden="true"
      />
      <div className="relative z-10 size-full">{children}</div>
    </div>
  );
}
