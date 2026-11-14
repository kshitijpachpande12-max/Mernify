/**
 * MagicCard — Magic UI (https://magicui.design/docs/components/magic-card)
 * A spotlight card with mouse-tracking gradient overlay.
 * Adapted from the official Magic UI source (MIT License).
 */
import React, { useCallback, useEffect, useRef } from "react";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { cn } from "../../lib/utils";

export function MagicCard({
  children,
  className,
  gradientSize = 200,
  gradientColor = "#262626",
  gradientOpacity = 0.8,
  ...props
}) {
  const cardRef = useRef(null);
  const mouseX = useMotionValue(-gradientSize);
  const mouseY = useMotionValue(-gradientSize);

  const handleMouseMove = useCallback(
    (e) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      mouseX.set(e.clientX - rect.left);
      mouseY.set(e.clientY - rect.top);
    },
    [mouseX, mouseY]
  );

  const handleMouseOut = useCallback(
    (e) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      ) {
        mouseX.set(-gradientSize);
        mouseY.set(-gradientSize);
      }
    },
    [mouseX, mouseY, gradientSize]
  );

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    el.addEventListener("mousemove", handleMouseMove);
    el.addEventListener("mouseout", handleMouseOut);
    return () => {
      el.removeEventListener("mousemove", handleMouseMove);
      el.removeEventListener("mouseout", handleMouseOut);
    };
  }, [handleMouseMove, handleMouseOut]);

  const background = useMotionTemplate`
    radial-gradient(${gradientSize}px circle at ${mouseX}px ${mouseY}px, ${gradientColor}, transparent 100%)
  `;

  return (
    <div
      ref={cardRef}
      className={cn(
        "group relative flex size-full overflow-hidden rounded-2xl border border-zinc-800/80 bg-[#121215] text-white shadow-2xl shadow-black/50 backdrop-blur-xl",
        className
      )}
      {...props}
    >
      <div className="relative z-10 size-full">{children}</div>
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background, opacity: gradientOpacity }}
      />
    </div>
  );
}
