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
    <div className="relative min-h-screen bg-[#0b0c0e] text-[#f8fafc] flex items-center justify-center p-4 sm:p-6 lg:p-12 overflow-x-hidden selection:bg-indigo-500/25 selection:text-indigo-200">
      {/* Vercel Liquid Simulation Layer */}
      <LiquidSimulation className="opacity-70" />

      {/* Canvas Crowd Particle Layer */}
      <CanvasCrowd nodeCount={50} className="opacity-50" />

      {/* Grid Pattern */}
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-10" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0b0c0e]/60 via-transparent to-[#0b0c0e]/90" />

      {/* Card Container */}
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-6">
          <KineticTitle subtitle="DEPLOY TELEMETRY CONTROL PLANE" />
        </div>

        <div className="relative rounded-3xl bg-[#121316]/95 border border-[#22242a] p-7 sm:p-9 backdrop-blur-2xl shadow-[0_0_60px_rgba(0,0,0,0.8)] transition-all hover:border-indigo-500/40">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-[#f8fafc] tracking-tight">Create Organization</h2>
            <p className="text-xs text-[#94a3b8] mt-1">Initialize your distributed telemetry workspace</p>
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
                Full Name / Organization
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Cloud Operations Team"
                className="w-full px-4 py-3 bg-[#0b0c0e] border border-[#22242a] rounded-xl text-[#f8fafc] text-sm placeholder-[#64748b] focus:outline-none focus:ring-1 focus:ring-indigo-500/60 focus:border-indigo-500/60 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#94a3b8] mb-1.5 font-medium">
                Work Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="ops@company.io"
                className="w-full px-4 py-3 bg-[#0b0c0e] border border-[#22242a] rounded-xl text-[#f8fafc] text-sm placeholder-[#64748b] focus:outline-none focus:ring-1 focus:ring-indigo-500/60 focus:border-indigo-500/60 transition-all font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#94a3b8] mb-1.5 font-medium">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="••••••••••••"
                className="w-full px-4 py-3 bg-[#0b0c0e] border border-[#22242a] rounded-xl text-[#f8fafc] text-sm placeholder-[#64748b] focus:outline-none focus:ring-1 focus:ring-indigo-500/60 focus:border-indigo-500/60 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-950/60 border border-indigo-400/30 transition-all duration-200 transform active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer mt-2 uppercase tracking-wider"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
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

          <div className="mt-6 pt-5 border-t border-[#22242a] text-center">
            <p className="text-xs text-[#94a3b8]">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-400 hover:text-indigo-300 underline font-semibold ml-1">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
