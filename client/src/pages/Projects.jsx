import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuroraBackground, GradientText, MagicCard, ShinyButton } from '../components/ui/visuals';
import LiquidSimulation from '../components/LiquidSimulation';

const API = 'http://localhost:5000';

export default function Projects() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(null);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);

  const getAuthToken = () => {
    return (
      token ||
      localStorage.getItem('sentinel_token') ||
      localStorage.getItem('mernitor_token') ||
      localStorage.getItem('mernify_token') ||
      ''
    );
  };

  const fetchProjects = async () => {
    try {
      const authToken = getAuthToken();
      const res = await fetch(`${API}/api/projects`, {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });
      if (res.ok) {
        setProjects(await res.json());
      }
    } catch {
      setError('Could not load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [token]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    setError('');
    try {
      const authToken = getAuthToken();
      const res = await fetch(`${API}/api/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (res.ok) {
        const proj = await res.json();
        setProjects((prev) => [...prev, proj]);
        setName('');
      } else {
        const body = await res.json().catch(() => ({}));
        setError(body.error || 'Could not create project');
      }
    } catch {
      setError('Could not create project');
    } finally {
      setCreating(false);
    }
  };

  const copyKey = async (key, id) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setError('Could not copy the API key');
    }
  };

  // 1-Click Instant Delete: removes item from screen immediately on the first click!
  const handleDelete = async (projectToDelete) => {
    const targetId = projectToDelete.id || projectToDelete._id || projectToDelete.apiKey || projectToDelete.name;
    if (!targetId) return;

    // 1. Optimistic instant removal on 1st click
    setProjects((prev) => prev.filter((p) => String(p.id || p._id) !== String(targetId)));
    setError('');

    // Show undo toast for 5 seconds
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({
      project: projectToDelete,
      message: `Deleted "${projectToDelete.name}"`,
    });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 5000);

    // 2. Fire backend delete immediately
    const authToken = getAuthToken();
    try {
      await fetch(`${API}/api/projects/${encodeURIComponent(targetId)}`, {
        method: 'DELETE',
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });
    } catch (err) {
      console.warn('Backend delete sync note:', err);
    }
  };

  const handleUndo = (projectToRestore) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast(null);
    setProjects((prev) => [...prev, projectToRestore]);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#05060d] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
      <AuroraBackground />
      <LiquidSimulation className="opacity-30" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between border-b border-white/10 bg-slate-950/60 px-6 py-4 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center font-black text-white text-base shadow-[0_0_15px_rgba(6,182,212,0.4)]">
            S
          </div>
          <div className="flex items-center gap-2">
            <GradientText className="text-xl font-bold">Sentinel</GradientText>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Control Plane
            </span>
          </div>
        </div>
        <button
          onClick={logout}
          className="text-sm text-slate-400 transition-colors hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-900"
        >
          Sign out
        </button>
      </header>

      {/* Main Container */}
      <main className="relative z-10 mx-auto max-w-4xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-white">Monitored Deployments</h2>
            <p className="text-xs text-slate-400 mt-1">Select a workspace or register a new target application</p>
          </div>
          <span className="text-xs font-mono text-cyan-400 bg-slate-900/80 px-3 py-1 rounded-full border border-white/10">
            {projects.length} {projects.length === 1 ? 'Project' : 'Projects'}
          </span>
        </div>

        <form onSubmit={handleCreate} className="mb-8 flex gap-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. production-ecommerce-api"
            className="flex-1 rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white placeholder-slate-500 outline-none ring-cyan-400/40 focus:ring-2 backdrop-blur-md"
          />
          <ShinyButton type="submit" disabled={creating || !name.trim()} className="whitespace-nowrap">
            {creating ? 'Registering…' : '+ New Deployment'}
          </ShinyButton>
        </form>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-12">
            <svg className="h-8 w-8 animate-spin text-cyan-400" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        )}

        {!loading && projects.length === 0 && (
          <MagicCard className="px-6 py-12 text-center text-slate-400 rounded-2xl">
            <p className="text-lg text-slate-200 font-medium">No projects yet</p>
            <p className="mt-1 text-sm">Create your first project above to begin telemetry ingestion</p>
          </MagicCard>
        )}

        <div className="space-y-3.5">
          {projects.map((p) => {
            const pid = p.id || p._id;
            return (
              <MagicCard key={pid} className="p-5 rounded-2xl transition-all duration-300">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <button
                    onClick={() => navigate(`/dashboard/${pid}`)}
                    className="text-lg font-medium text-cyan-300 transition-colors hover:text-cyan-200 text-left flex items-center gap-2"
                  >
                    <span>{p.name}</span>
                    <span className="text-xs text-cyan-400 opacity-60 hover:opacity-100">↗</span>
                  </button>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 font-mono">
                      {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'Active'}
                    </span>
                    {/* Instant 1-click Delete button */}
                    <button
                      type="button"
                      onClick={() => handleDelete(p)}
                      className="rounded-lg border border-rose-500/30 px-3 py-1.5 text-xs text-rose-300 transition-all hover:bg-rose-500/20 active:scale-95 cursor-pointer flex items-center gap-1 shadow-sm"
                      title="Delete deployment immediately"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 overflow-hidden text-ellipsis rounded-lg bg-slate-900/80 px-3 py-2 font-mono text-xs text-slate-400 border border-white/5">
                    {p.apiKey}
                  </code>
                  <button
                    onClick={() => copyKey(p.apiKey, pid)}
                    className="rounded-lg bg-slate-800 px-3 py-2 text-xs text-slate-300 transition-colors hover:bg-slate-700 cursor-pointer"
                  >
                    {copied === pid ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              </MagicCard>
            );
          })}
        </div>
      </main>

      {/* Floating Undo Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce-in flex items-center gap-3 bg-slate-900/95 border border-cyan-500/30 text-white px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-xl">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-medium text-slate-200">{toast.message}</span>
          <button
            onClick={() => handleUndo(toast.project)}
            className="text-xs font-bold text-cyan-400 hover:text-cyan-300 underline underline-offset-2 ml-1 cursor-pointer"
          >
            Undo
          </button>
          <button
            onClick={() => setToast(null)}
            className="text-xs text-slate-500 hover:text-slate-300 ml-1"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
