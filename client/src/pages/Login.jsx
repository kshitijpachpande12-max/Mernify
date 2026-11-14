import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TextRevealCard } from '../components/magicui';
import { CanvasCrowd, KineticTitle, LiquidSimulation } from '../components/skipper';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    <div className="relative min-h-screen bg-[#090a0b] text-white flex items-center justify-center p-4 sm:p-6 lg:p-12 overflow-x-hidden selection:bg-white/20 selection:text-white">
      {/* Vercel Liquid Simulation Layer */}
      <LiquidSimulation className="opacity-80" />

      {/* Canvas Crowd Particle Layer */}
      <CanvasCrowd nodeCount={55} className="opacity-60" />

      {/* Subtle Grid and Dark Vignette */}
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-10" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#090a0b]/60 via-transparent to-[#090a0b]/90" />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Column: App Showcase & Intro */}
        <div className="lg:col-span-7 space-y-6 text-left">
          {/* Top Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#121215]/90 border border-zinc-700/80 backdrop-blur-md shadow-sm">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="text-xs font-mono font-semibold tracking-wider text-zinc-300 uppercase">
              SENTINEL v2.0 • REAL-TIME OBSERVABILITY
            </span>
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
            <div className="p-4 rounded-xl bg-[#121215]/80 border border-zinc-800 backdrop-blur-md hover:border-zinc-500/60 transition-all duration-300 group">
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white font-bold text-sm">
                  ⚡
                </div>
                <h4 className="font-bold text-white text-sm group-hover:text-zinc-200 transition-colors">
                  100k+ Events / Sec
                </h4>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed font-normal">
                Zero-copy ingestion engine with batched WebSocket transports and ring-buffer deduplication.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#121215]/80 border border-zinc-800 backdrop-blur-md hover:border-zinc-500/60 transition-all duration-300 group">
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white font-bold text-sm">
                  🧠
                </div>
                <h4 className="font-bold text-white text-sm group-hover:text-zinc-200 transition-colors">
                  Z-Score Anomaly AI
                </h4>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed font-normal">
                Sliding-window statistical outlier recognition flags sudden CPU runaway and latency degradation.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#121215]/80 border border-zinc-800 backdrop-blur-md hover:border-zinc-500/60 transition-all duration-300 group">
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white font-bold text-sm">
                  ⏳
                </div>
                <h4 className="font-bold text-white text-sm group-hover:text-zinc-200 transition-colors">
                  Time-Travel Replay
                </h4>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed font-normal">
                Scrub through historical timelines to step-by-step reconstruct critical service outages.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#121215]/80 border border-zinc-800 backdrop-blur-md hover:border-zinc-500/60 transition-all duration-300 group">
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white font-bold text-sm">
                  🛡️
                </div>
                <h4 className="font-bold text-white text-sm group-hover:text-zinc-200 transition-colors">
                  Zero-Overhead Agent
                </h4>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed font-normal">
                Lightweight Node SDK captures process metrics, event loop lags, and per-endpoint HTTP percentiles.
              </p>
            </div>
          </div>

          {/* Live Cluster Status Simulation Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-xl bg-[#121215]/90 border border-zinc-800 backdrop-blur-md text-xs font-mono">
            <div className="flex items-center gap-2 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold">CLUSTER STATUS: HEALTHY</span>
            </div>
            <div className="flex items-center gap-4 text-zinc-400">
              <span>INGEST: <strong className="text-white font-mono">148.2k/s</strong></span>
              <span>P99: <strong className="text-emerald-400 font-mono">2.1ms</strong></span>
              <span>UPTIME: <strong className="text-zinc-200 font-mono">99.99%</strong></span>
            </div>
          </div>
        </div>

        {/* Right Column: Luxury Obsidian Auth Card */}
        <div className="lg:col-span-5">
          <div className="relative rounded-3xl bg-[#121215]/95 border border-zinc-800/90 p-7 sm:p-9 backdrop-blur-2xl shadow-[0_0_60px_rgba(0,0,0,0.8)] transition-all hover:border-zinc-600">
            {/* Top subtle silver glow */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/5 rounded-full blur-3xl pointer-events-none" />

            <div className="mb-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700 text-white text-2xl font-black mb-3 shadow-[0_0_20px_rgba(255,255,255,0.15)]">
                S
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Access Sentinel</h2>
              <p className="text-xs text-zinc-400 mt-1">Authenticate into your telemetry control plane</p>
            </div>

            {error && (
              <div className="bg-red-950/40 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl mb-5 text-xs flex items-center gap-2">
                <span className="text-base">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5 font-medium">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="operator@sentinel.dev"
                  className="w-full px-4 py-3 bg-[#090a0b] border border-zinc-700 rounded-xl text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 transition-all font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 font-medium">
                    Password
                  </label>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="w-full px-4 py-3 bg-[#090a0b] border border-zinc-700 rounded-xl text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 transition-all"
                />
              </div>

              {/* Quick Fill Demo Credentials button */}
              <button
                type="button"
                onClick={handleDemoFill}
                className="w-full py-2 text-xs text-zinc-300 hover:text-white bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700 rounded-lg transition-all font-mono cursor-pointer"
              >
                ⚡ Autofill Demo Credentials
              </button>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-white hover:bg-zinc-200 disabled:opacity-50 text-black font-bold text-sm rounded-xl shadow-lg shadow-white/10 transition-all duration-200 transform active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-black" viewBox="0 0 24 24">
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

            <div className="mt-6 pt-5 border-t border-zinc-800 text-center">
              <p className="text-xs text-zinc-400">
                Need a new deployment?{' '}
                <Link to="/register" className="text-white hover:text-zinc-300 underline font-semibold ml-1">
                  Create Account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
