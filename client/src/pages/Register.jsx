import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuroraBackground, GradientText, MagicCard, ShinyButton } from '../components/ui/visuals';

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
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#05060d] px-4">
      <AuroraBackground />
      <MagicCard className="w-full max-w-md p-8">
        <GradientText className="block text-center text-3xl font-bold">Mernitor</GradientText>
        <p className="mb-8 mt-2 text-center text-slate-400">Create your account</p>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg border border-white/10 bg-slate-900/80 px-4 py-2.5 text-white placeholder-slate-500 outline-none ring-cyan-400/40 focus:ring-2"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-white/10 bg-slate-900/80 px-4 py-2.5 text-white placeholder-slate-500 outline-none ring-cyan-400/40 focus:ring-2"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-lg border border-white/10 bg-slate-900/80 px-4 py-2.5 text-white placeholder-slate-500 outline-none ring-cyan-400/40 focus:ring-2"
              placeholder="••••••••"
            />
          </div>
          <ShinyButton type="submit" disabled={loading} className="w-full">
            {loading ? 'Creating account…' : 'Create Account'}
          </ShinyButton>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-cyan-300 hover:text-cyan-200">Sign in</Link>
        </p>
      </MagicCard>
    </div>
  );
}
