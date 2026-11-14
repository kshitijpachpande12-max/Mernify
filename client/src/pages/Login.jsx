import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TextRevealCard } from '../components/magicui';
import { CanvasCrowd, KineticTitle, KineticMenu, LiquidSimulation } from '../components/skipper';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/projects');
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = () => {
    setEmail('demo@mernify.dev');
    setPassword('demo1234');
  };

  return (
    <div className="relative min-h-screen bg-[#0b0c0e] text-[#f8fafc] flex items-center justify-center p-4 sm:p-6 lg:p-12 overflow-x-hidden selection:bg-indigo-500/25 selection:text-indigo-200">
      {/* Liquid Simulation Layer */}
      <LiquidSimulation className="opacity-70" />

      {/* Canvas Crowd Particle Layer */}
      <CanvasCrowd nodeCount={55} className="opacity-50" />

      {/* Subtle Grid and Dark Vignette */}
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-10" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0b0c0e]/60 via-transparent to-[#0b0c0e]/90" />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Column: App Showcase & Intro */}
        <div className="lg:col-span-7 space-y-6 text-left">
          {/* Top Badge & Kinetic Menu Button */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#121316]/90 border border-[#22242a] backdrop-blur-md shadow-sm">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              <span className="text-xs font-mono font-semibold tracking-wider text-indigo-300 uppercase">
                SENTINEL v2.0 • REAL-TIME OBSERVABILITY
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowMenu(true)}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#121316] hover:bg-[#18191d] border border-[#22242a] hover:border-indigo-500/50 text-xs font-mono text-[#94a3b8] hover:text-white transition-all shadow-sm cursor-pointer group"
            >
              <span className="w-4 h-4 rounded-md bg-[#202227] group-hover:bg-indigo-500/20 border border-[#2c2f38] flex items-center justify-center text-[10px] text-white">
                ⤢
              </span>
              <span>Kinetic Menu</span>
            </button>
          </div>

          {/* Kinetic Title */}
          <div className="pt-2">
            <KineticTitle subtitle="DISTRIBUTED CLOUD TELEMETRY & INCIDENT AI" />
          </div>

          {/* Text Reveal Box (Magic UI) */}
          <TextRevealCard
            title="✦ THE MISSION-CRITICAL TELEMETRY STACK"
            text="Sentinel delivers sub-millisecond event streaming, automated statistical anomaly detection, and timeline scrubbing to pinpoint microservice latency spikes and catastrophic failures before they impact your users."
          />

          {/* High-End Feature Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            <div className="p-4 rounded-xl bg-[#121316]/80 border border-[#22242a] backdrop-blur-md hover:border-indigo-500/40 transition-all duration-300 group">
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-sm">
                  ⚡
                </div>
                <h4 className="font-bold text-[#f8fafc] text-sm group-hover:text-indigo-300 transition-colors">
                  100k+ Events / Sec
                </h4>
              </div>
              <p className="text-xs text-[#94a3b8] leading-relaxed font-normal">
                Zero-copy ingestion engine with batched WebSocket transports and ring-buffer deduplication.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#121316]/80 border border-[#22242a] backdrop-blur-md hover:border-indigo-500/40 transition-all duration-300 group">
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-sm">
                  🧠
                </div>
                <h4 className="font-bold text-[#f8fafc] text-sm group-hover:text-indigo-300 transition-colors">
                  Z-Score Anomaly AI
                </h4>
              </div>
              <p className="text-xs text-[#94a3b8] leading-relaxed font-normal">
                Sliding-window statistical outlier recognition flags sudden CPU runaway and latency degradation.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#121316]/80 border border-[#22242a] backdrop-blur-md hover:border-indigo-500/40 transition-all duration-300 group">
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-sm">
                  ⏳
                </div>
                <h4 className="font-bold text-[#f8fafc] text-sm group-hover:text-indigo-300 transition-colors">
                  Time-Travel Replay
                </h4>
              </div>
              <p className="text-xs text-[#94a3b8] leading-relaxed font-normal">
                Scrub through historical timelines to step-by-step reconstruct critical service outages.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#121316]/80 border border-[#22242a] backdrop-blur-md hover:border-indigo-500/40 transition-all duration-300 group">
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-sm">
                  🛡️
                </div>
                <h4 className="font-bold text-[#f8fafc] text-sm group-hover:text-indigo-300 transition-colors">
                  Zero-Overhead Agent
                </h4>
              </div>
              <p className="text-xs text-[#94a3b8] leading-relaxed font-normal">
                Lightweight Node SDK captures process metrics, event loop lags, and per-endpoint HTTP percentiles.
              </p>
            </div>
          </div>

          {/* Live Cluster Status Simulation Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-xl bg-[#121316]/90 border border-[#22242a] backdrop-blur-md text-xs font-mono">
            <div className="flex items-center gap-2 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold">CLUSTER STATUS: HEALTHY</span>
            </div>
            <div className="flex items-center gap-4 text-[#94a3b8]">
              <span>INGEST: <strong className="text-indigo-300 font-mono">148.2k/s</strong></span>
              <span>P99: <strong className="text-emerald-400 font-mono">2.1ms</strong></span>
              <span>UPTIME: <strong className="text-[#f8fafc] font-mono">99.99%</strong></span>
            </div>
          </div>
        </div>

        {/* Right Column: Linear Obsidian Auth Card */}
        <div className="lg:col-span-5">
          <div className="relative rounded-3xl bg-[#121316]/95 border border-[#22242a] p-7 sm:p-9 backdrop-blur-2xl shadow-[0_0_60px_rgba(0,0,0,0.8)] transition-all hover:border-indigo-500/40">
            {/* Top subtle iris glow */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="mb-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white text-2xl font-black mb-3 shadow-[0_0_20px_rgba(99,102,241,0.35)]">
                S
              </div>
              <h2 className="text-2xl font-bold text-[#f8fafc] tracking-tight">Access Sentinel</h2>
              <p className="text-xs text-[#94a3b8] mt-1">Authenticate into your telemetry control plane</p>
            </div>

            {error && (
              <div className="bg-red-950/40 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl mb-5 text-xs flex items-center gap-2">
                <span className="text-base">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#94a3b8] mb-1.5 font-medium">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="operator@sentinel.dev"
                  className="w-full px-4 py-3 bg-[#0b0c0e] border border-[#22242a] rounded-xl text-[#f8fafc] text-sm placeholder-[#64748b] focus:outline-none focus:ring-1 focus:ring-indigo-500/60 focus:border-indigo-500/60 transition-all font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#94a3b8] font-medium">
                    Password
                  </label>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="w-full px-4 py-3 bg-[#0b0c0e] border border-[#22242a] rounded-xl text-[#f8fafc] text-sm placeholder-[#64748b] focus:outline-none focus:ring-1 focus:ring-indigo-500/60 focus:border-indigo-500/60 transition-all"
                />
              </div>

              {/* Quick Fill Demo Credentials button */}
              <button
                type="button"
                onClick={handleDemoFill}
                className="w-full py-2 text-xs text-indigo-300 hover:text-white bg-[#18191d] hover:bg-[#22242a] border border-[#22242a] rounded-lg transition-all font-mono cursor-pointer"
              >
                ⚡ Autofill Demo Credentials
              </button>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-950/60 border border-indigo-400/30 transition-all duration-200 transform active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Authenticating…
                  </span>
                ) : (
                  <span>Launch Control Center →</span>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-[#1e2026] text-center">
              <p className="text-xs text-[#94a3b8]">
                Need a new deployment?{' '}
                <Link to="/register" className="text-indigo-400 hover:text-indigo-300 underline font-semibold ml-1">
                  Create Account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Kinetic Navigation Modal */}
      {showMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md">
            <button
              type="button"
              onClick={() => setShowMenu(false)}
              className="absolute -top-12 right-2 text-[#94a3b8] hover:text-white text-xs font-mono uppercase bg-[#141518] hover:bg-[#1f2024] px-3.5 py-1.5 rounded-xl border border-[#22242a] flex items-center gap-1.5 transition-all shadow-md"
            >
              <span>✕</span> Close
            </button>
            <KineticMenu onClose={() => setShowMenu(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
