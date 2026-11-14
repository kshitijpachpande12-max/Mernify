/**
 * KineticMenu — Skipper UI (https://skiper-ui.com)
 * Brutalist kinetic navigation card with sliced typography, glitch hover physics,
 * expand action control, and dashed status radar.
 * Exact replication of the Skipper UI kinetic typography menu.
 * Zero external dependencies (Pure React + CSS / Tailwind).
 */
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "../../lib/utils";

const DEFAULT_MENU_ITEMS = [
  { id: "home", label: "HOME", path: "/login" },
  { id: "collections", label: "COLLECTIONS", path: "/projects" },
  { id: "pricing", label: "PRICING", path: "/projects" },
  { id: "howtouse", label: "HOWTOUSE", path: "/login" },
  { id: "account", label: "ACCOUNT", path: "/projects" },
  { id: "login", label: "LOGIN", path: "/login" },
];

/**
 * Sliced Typography Item
 * Slices text into offset layers with horizontal seam lines on hover.
 */
function SlicedItem({ item, isHovered, onHover, onLeave, onClick }) {
  return (
    <button
      type="button"
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onClick}
      className="relative block select-none cursor-pointer focus:outline-none py-0.5 my-0.5 w-full text-center group transition-transform duration-200 active:scale-95"
      aria-label={item.label}
    >
      {/* Base Text */}
      <div
        className={cn(
          "font-black text-3xl sm:text-4xl md:text-5xl uppercase tracking-tighter text-white transition-opacity duration-150 leading-none",
          isHovered ? "opacity-0" : "opacity-100"
        )}
      >
        {item.label}
      </div>

      {/* Sliced Kinetic State */}
      {isHovered && (
        <div className="absolute inset-0 flex items-center justify-center font-black text-3xl sm:text-4xl md:text-5xl uppercase tracking-tighter text-white leading-none pointer-events-none">
          {/* Top Slice Layer: offset left */}
          <span
            className="absolute inset-0 flex items-center justify-center text-white"
            style={{
              clipPath: "polygon(0 0, 100% 0, 100% 44%, 0 44%)",
              transform: "translateX(-4px)",
            }}
          >
            {item.label}
          </span>

          {/* Middle Slice Layer: offset right */}
          <span
            className="absolute inset-0 flex items-center justify-center text-white"
            style={{
              clipPath: "polygon(0 42%, 100% 42%, 100% 68%, 0 68%)",
              transform: "translateX(4px)",
            }}
          >
            {item.label}
          </span>

          {/* Bottom Slice Layer: offset left */}
          <span
            className="absolute inset-0 flex items-center justify-center text-white"
            style={{
              clipPath: "polygon(0 66%, 100% 66%, 100% 100%, 0 100%)",
              transform: "translateX(-2px)",
            }}
          >
            {item.label}
          </span>

          {/* Glitch Cut Horizontal Seams */}
          <div
            className="absolute left-2 right-2 h-[2px] bg-white top-[43%] pointer-events-none"
            style={{ transform: "scaleX(1.02)" }}
          />
          <div
            className="absolute left-2 right-2 h-[2px] bg-white top-[67%] pointer-events-none"
            style={{ transform: "scaleX(1.02)" }}
          />

          {/* Stylized Horizontal Letter Cuts like in screenshot */}
          <div className="absolute top-[44%] left-[-4px] w-2.5 h-[2px] bg-indigo-400" />
          <div className="absolute top-[68%] right-[-4px] w-2.5 h-[2px] bg-indigo-400" />
        </div>
      )}
    </button>
  );
}

/**
 * KineticMenu Component
 * Exactly matches the brutalist kinetic typography navigation card shown in the user screenshot.
 */
export function KineticMenu({
  items = DEFAULT_MENU_ITEMS,
  className,
  onItemSelect,
  initialHovered = "howtouse",
  onClose,
}) {
  const navigate = useNavigate();
  const [hoveredId, setHoveredId] = useState(initialHovered);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSelect = (item) => {
    if (onItemSelect) {
      onItemSelect(item);
    } else if (item.path) {
      navigate(item.path);
    }
    if (onClose) onClose();
  };

  return (
    <div
      className={cn(
        "relative w-full max-w-[340px] sm:max-w-[400px] mx-auto rounded-[32px] sm:rounded-[36px] bg-[#141518] border border-[#22242a] p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] backdrop-blur-2xl transition-all duration-300",
        isExpanded && "scale-105 border-indigo-500/50 shadow-indigo-950/40",
        className
      )}
    >
      {/* Top Header Row matching screenshot */}
      <div className="relative flex items-center justify-between mb-5 sm:mb-7">
        {/* Empty left anchor spacer for perfect center alignment */}
        <div className="w-9 h-9" />

        {/* Center Expand/Popout Icon Button */}
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          title="Toggle Expand / Fullscreen"
          className="w-9 h-9 rounded-xl bg-[#202227] hover:bg-[#282b33] border border-[#2c2f38] flex items-center justify-center text-white/80 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95"
        >
          {/* Popout / Diagonal Outward Arrows Icon from screenshot */}
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 3h6v6" />
            <path d="M9 21H3v-6" />
            <path d="M21 3l-7 7" />
            <path d="M3 21l7-7" />
          </svg>
        </button>

        {/* Top-Right Dotted Spinning Indicator from screenshot */}
        <div className="w-9 h-9 flex items-center justify-end">
          <div
            className="w-5 h-5 rounded-full border-2 border-dashed border-white/70 animate-spin"
            style={{ animationDuration: "8s" }}
            title="Active Telemetry Pulse"
          />
        </div>
      </div>

      {/* Centered Vertically Stacked Kinetic Navigation List */}
      <div className="flex flex-col items-center justify-center gap-1.5 sm:gap-2 my-2 sm:my-3">
        {items.map((item) => (
          <SlicedItem
            key={item.id}
            item={item}
            isHovered={hoveredId === item.id}
            onHover={() => setHoveredId(item.id)}
            onLeave={() => setHoveredId(null)}
            onClick={() => handleSelect(item)}
          />
        ))}
      </div>

      {/* Bottom Status Ribbon */}
      <div className="mt-5 pt-3.5 border-t border-[#22242a] flex items-center justify-between text-[11px] font-mono text-[#64748b]">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[#94a3b8] font-semibold">SKIPPER UI</span>
        </div>
        <span className="uppercase tracking-wider text-indigo-400 font-medium">
          KINETIC NAV
        </span>
      </div>
    </div>
  );
}
