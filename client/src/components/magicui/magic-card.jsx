/**
 * MagicCard — Magic UI (https://magicui.design/docs/components/magic-card)
 * A spotlight card with mouse-tracking gradient overlay.
 * Zero external dependency implementation.
 */
import React, { useRef } from "react";
import { cn } from "../../lib/utils";

export function MagicCard({
  children,
  className,
  gradientSize = 250,
  gradientColor = "rgba(255, 255, 255, 0.08)",
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
        "magic-card group relative flex size-full overflow-hidden rounded-2xl border border-zinc-800/80 bg-[#121215] text-white shadow-2xl shadow-black/50 backdrop-blur-xl transition-all duration-300",
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
          background: `radial-gradient(var(--gradient-size, 250px) circle at var(--mx, -500px) var(--my, -500px), var(--gradient-color, rgba(255, 255, 255, 0.08)), transparent 80%)`,
        }}
        aria-hidden="true"
      />
      <div className="relative z-10 size-full">{children}</div>
    </div>
  );
}
