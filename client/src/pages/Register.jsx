import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CanvasCrowd, KineticTitle, LiquidSimulation } from '../components/skipper';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(name, email, password);
      navigate('/projects');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#090a0b] text-white flex items-center justify-center p-4 sm:p-6 lg:p-12 overflow-x-hidden selection:bg-white/20 selection:text-white">
      {/* Vercel Liquid Simulation Layer */}
      <LiquidSimulation className="opacity-80" />

      {/* Canvas Crowd Particle Layer */}
      <CanvasCrowd nodeCount={50} className="opacity-55" />

      {/* Grid Pattern */}
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-10" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#090a0b]/60 via-transparent to-[#090a0b]/90" />

      {/* Card Container */}
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-6">
          <KineticTitle subtitle="DEPLOY TELEMETRY CONTROL PLANE" />
        </div>

        <div className="relative rounded-3xl bg-[#121215]/95 border border-zinc-800/90 p-7 sm:p-9 backdrop-blur-2xl shadow-[0_0_60px_rgba(0,0,0,0.8)] transition-all hover:border-zinc-600">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-white tracking-tight">Create Organization</h2>
            <p className="text-xs text-zinc-400 mt-1">Initialize your distributed telemetry workspace</p>
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
                Full Name / Organization
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Cloud Operations Team"
                className="w-full px-4 py-3 bg-[#090a0b] border border-zinc-700 rounded-xl text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5 font-medium">
                Work Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="ops@company.io"
                className="w-full px-4 py-3 bg-[#090a0b] border border-zinc-700 rounded-xl text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 transition-all font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5 font-medium">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="••••••••••••"
                className="w-full px-4 py-3 bg-[#090a0b] border border-zinc-700 rounded-xl text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-white hover:bg-zinc-200 disabled:opacity-50 text-black font-bold text-sm rounded-xl shadow-lg shadow-white/10 transition-all duration-200 transform active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer mt-2 uppercase tracking-wider"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-black" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Initializing…
                </span>
              ) : (
                <span>Register & Launch Workspace →</span>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-zinc-800 text-center">
            <p className="text-xs text-zinc-400">
              Already have an account?{' '}
              <Link to="/login" className="text-white hover:text-zinc-300 underline font-semibold ml-1">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
