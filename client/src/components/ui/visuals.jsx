import React from 'react';
import { BorderBeam } from '../magicui/border-beam';
import { MagicCard } from '../magicui/magic-card';
import { ShinyButton } from '../magicui/shiny-button';
import { AnimatedGradientText } from '../magicui/animated-gradient-text';

export { BorderBeam, MagicCard, ShinyButton, AnimatedGradientText };

export function AuroraBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="aurora-blob aurora-blob-a" />
      <div className="aurora-blob aurora-blob-b" />
      <div className="aurora-grid" />
    </div>
  );
}

export function GradientText({ children, className = '' }) {
  return (
    <AnimatedGradientText className={className}>
      {children}
    </AnimatedGradientText>
  );
}

export function Panel({ children, className = '' }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-zinc-800/90 bg-[#121215]/90 ${className}`}>
      <BorderBeam size={80} duration={14} colorFrom="#ffffff" colorTo="#3f3f46" borderWidth={1} />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
