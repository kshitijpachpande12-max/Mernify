import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LiquidSimulation from '../components/LiquidSimulation';
import CanvasCrowd from '../components/CanvasCrowd';
import KineticTitle from '../components/KineticTitle';
import TextRevealBox from '../components/TextRevealBox';

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
    setEmail('demo@sentinel.dev');
    setPassword('password123');
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-12 overflow-x-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Vercel Liquid Simulation Layer */}
      <LiquidSimulation className="opacity-90" />

      {/* Canvas Crowd Particle Layer */}
      <CanvasCrowd nodeCount={60} className="opacity-70" />

      {/* Subtle Grid and Dark Gradient Vignette */}
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-15" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-950/40 via-transparent to-slate-950/80" />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Column: App Showcase & Intro */}
        <div className="lg:col-span-7 space-y-6 text-left">
          {/* Top Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-cyan-500/30 backdrop-blur-md shadow-sm">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-xs font-mono font-medium tracking-wide text-cyan-300">
              SENTINEL v2.0 • REAL-TIME OBSERVABILITY
            </span>
          </div>

          {/* Kinetic Title */}
          <div className="pt-2">
            <KineticTitle subtitle="DISTRIBUTED CLOUD TELEMETRY & INCIDENT AI" />
          </div>

          {/* Text Reveal Box */}
          <TextRevealBox
            title="✦ THE MISSION-CRITICAL TELEMETRY STACK"
            text="Sentinel delivers sub-millisecond event streaming, automated statistical anomaly detection, and timeline scrubbing to pinpoint microservice latency spikes and catastrophic failures before they impact your users."
          />

          {/* High-End Feature Highlights (Skipper UI style) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md hover:border-cyan-500/40 transition-all duration-300 group">
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold text-sm">
                  ⚡
                </div>
                <h4 className="font-semibold text-white text-sm group-hover:text-cyan-300 transition-colors">
                  100k+ Events / Sec
                </h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Zero-copy ingestion engine with batched WebSocket transports and ring-buffer deduplication.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md hover:border-indigo-500/40 transition-all duration-300 group">
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-sm">
                  🧠
                </div>
                <h4 className="font-semibold text-white text-sm group-hover:text-indigo-300 transition-colors">
                  Z-Score Anomaly AI
                </h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Sliding-window statistical outlier recognition flags sudden CPU runaway and latency degradation.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md hover:border-teal-500/40 transition-all duration-300 group">
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 font-bold text-sm">
                  ⏳
                </div>
                <h4 className="font-semibold text-white text-sm group-hover:text-teal-300 transition-colors">
                  Time-Travel Replay
                </h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Scrub through historical timelines to step-by-step reconstruct critical service outages.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md hover:border-purple-500/40 transition-all duration-300 group">
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-sm">
                  🛡️
                </div>
                <h4 className="font-semibold text-white text-sm group-hover:text-purple-300 transition-colors">
                  Zero-Overhead Agent
                </h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Lightweight Node SDK captures process metrics, event loop lags, and per-endpoint HTTP percentiles.
              </p>
            </div>
          </div>

          {/* Live Cluster Status Simulation Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md text-xs font-mono">
            <div className="flex items-center gap-2 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>CLUSTER STATUS: HEALTHY</span>
            </div>
            <div className="flex items-center gap-4 text-slate-400">
              <span>INGEST: <strong className="text-cyan-400 font-mono">148.2k/s</strong></span>
              <span>P99: <strong className="text-teal-400 font-mono">2.1ms</strong></span>
              <span>UPTIME: <strong className="text-slate-200 font-mono">99.99%</strong></span>
            </div>
          </div>
        </div>

        {/* Right Column: Luxury Glassmorphic Auth Card */}
        <div className="lg:col-span-5">
          <div className="relative rounded-3xl bg-slate-900/80 border border-white/10 p-7 sm:p-9 backdrop-blur-2xl shadow-[0_0_60px_rgba(0,0,0,0.8)] transition-all hover:border-cyan-500/40">
            {/* Top decorative glow */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="mb-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-2xl font-black mb-3 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                S
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Access Sentinel</h2>
              <p className="text-xs text-slate-400 mt-1">Authenticate into your telemetry control plane</p>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 px-4 py-3 rounded-xl mb-5 text-xs flex items-center gap-2">
                <span className="text-base">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="operator@sentinel.dev"
                  className="w-full px-4 py-3 bg-slate-950/80 border border-slate-700/80 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-300">
                    Password
                  </label>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="w-full px-4 py-3 bg-slate-950/80 border border-slate-700/80 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Quick Fill Demo Credentials button */}
              <button
                type="button"
                onClick={handleDemoFill}
                className="w-full py-1.5 text-xs text-cyan-400/90 hover:text-cyan-300 bg-cyan-950/30 hover:bg-cyan-950/50 border border-cyan-800/40 rounded-lg transition-all font-mono"
              >
                ⚡ Autofill Demo Credentials
              </button>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold text-sm rounded-xl shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all duration-300 transform active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
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

            <div className="mt-6 pt-5 border-t border-slate-800 text-center">
              <p className="text-xs text-slate-400">
                Need a new deployment?{' '}
                <Link to="/register" className="text-cyan-400 hover:text-cyan-300 font-medium ml-1">
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
