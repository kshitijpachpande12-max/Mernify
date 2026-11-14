import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MagicCard, ShinyButton, AnimatedGradientText } from '../components/magicui';
import { CanvasCrowd, KineticMenu } from '../components/skipper';
import { AuroraBackground } from '../components/ui/visuals';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
  const [showMenu, setShowMenu] = useState(false);
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
    <div className="relative min-h-screen overflow-hidden bg-[#0b0c0e] text-[#f8fafc] selection:bg-indigo-500/25 selection:text-indigo-200">
      <AuroraBackground />
      <CanvasCrowd className="opacity-40" nodeCount={55} />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between border-b border-[#22242a] bg-[#0e0f13]/85 px-6 py-4 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-600 flex items-center justify-center font-black text-white text-base shadow-[0_0_20px_rgba(99,102,241,0.35)]">
            S
          </div>
          <div className="flex items-center gap-2">
            <AnimatedGradientText className="text-xl font-bold tracking-tight">Sentinel</AnimatedGradientText>
            <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Control Plane
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowMenu(true)}
            className="flex items-center gap-2 text-xs font-mono text-[#94a3b8] hover:text-white bg-[#121316] hover:bg-[#18191d] border border-[#22242a] hover:border-indigo-500/50 px-3 py-1.5 rounded-lg transition-all cursor-pointer group"
          >
            <span className="w-4 h-4 rounded-md bg-[#202227] group-hover:bg-indigo-500/20 border border-[#2c2f38] flex items-center justify-center text-[10px] text-white">
              ⤢
            </span>
            <span>Kinetic Menu</span>
          </button>
          <button
            onClick={logout}
            className="text-sm text-[#94a3b8] transition-colors hover:text-white px-3 py-1.5 rounded-lg hover:bg-[#18191d]"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 mx-auto max-w-4xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[#f8fafc]">Monitored Deployments</h2>
            <p className="text-xs text-[#94a3b8] mt-1">Select a workspace or register a new target application</p>
          </div>
          <span className="text-xs font-mono text-indigo-300 bg-[#121316] px-3.5 py-1.5 rounded-full border border-[#22242a]">
            {projects.length} {projects.length === 1 ? 'Project' : 'Projects'}
          </span>
        </div>

        <form onSubmit={handleCreate} className="mb-8 flex gap-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. production-ecommerce-api"
            className="flex-1 rounded-xl border border-[#22242a] bg-[#121316] px-4 py-3 text-[#f8fafc] placeholder-[#64748b] outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 backdrop-blur-md transition-all"
          />
          <ShinyButton type="submit" disabled={creating || !name.trim()} className="whitespace-nowrap font-medium">
            {creating ? 'Registering…' : '+ New Deployment'}
          </ShinyButton>
        </form>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-950/20 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-12">
            <svg className="h-8 w-8 animate-spin text-indigo-400" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        )}

        {!loading && projects.length === 0 && (
          <MagicCard className="px-6 py-12 text-center text-[#94a3b8] rounded-2xl bg-[#121316] border-[#22242a]">
            <p className="text-lg text-[#f8fafc] font-medium">No projects yet</p>
            <p className="mt-1 text-sm text-[#94a3b8]">Create your first project above to begin telemetry ingestion</p>
          </MagicCard>
        )}

        <div className="space-y-3.5">
          {projects.map((p) => {
            const pid = p.id || p._id;
            return (
              <MagicCard key={pid} className="p-5 rounded-2xl transition-all duration-300 bg-[#121316] border border-[#22242a] hover:border-indigo-500/40">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <button
                    onClick={() => navigate(`/dashboard/${pid}`)}
                    className="text-lg font-bold text-[#f8fafc] transition-colors hover:text-indigo-300 text-left flex items-center gap-2 cursor-pointer"
                  >
                    <span>{p.name}</span>
                    <span className="text-xs text-indigo-400 opacity-60 hover:opacity-100">↗</span>
                  </button>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#64748b] font-mono">
                      {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'Active'}
                    </span>
                    {/* Instant 1-click Delete button */}
                    <button
                      type="button"
                      onClick={() => handleDelete(p)}
                      className="rounded-lg border border-red-500/25 bg-red-950/20 px-3 py-1.5 text-xs text-red-300 transition-all hover:bg-red-900/30 active:scale-95 cursor-pointer flex items-center gap-1 shadow-sm font-medium"
                      title="Delete deployment immediately"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 overflow-hidden text-ellipsis rounded-lg bg-[#0b0c0e] px-3 py-2 font-mono text-xs text-[#94a3b8] border border-[#22242a]">
                    {p.apiKey}
                  </code>
                  <button
                    onClick={() => copyKey(p.apiKey, pid)}
                    className="rounded-lg bg-[#18191d] border border-[#22242a] px-3.5 py-2 text-xs text-[#f8fafc] transition-colors hover:bg-[#22242a] cursor-pointer font-medium"
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
        <div className="fixed bottom-6 right-6 z-50 animate-bounce-in flex items-center gap-3 bg-[#121316] border border-indigo-500/40 text-[#f8fafc] px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-xl">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
          <span className="text-xs font-medium text-[#f8fafc]">{toast.message}</span>
          <button
            onClick={() => handleUndo(toast.project)}
            className="text-xs font-bold text-indigo-400 hover:text-indigo-300 underline underline-offset-2 ml-1 cursor-pointer"
          >
            Undo
          </button>
          <button
            onClick={() => setToast(null)}
            className="text-xs text-[#94a3b8] hover:text-white ml-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Kinetic Navigation Modal */}
      {showMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md">
            <button
              type="button"
              onClick={() => setShowMenu(false)}
              className="absolute -top-12 right-2 text-[#94a3b8] hover:text-white text-xs font-mono uppercase bg-[#141518] hover:bg-[#1f2024] px-3.5 py-1.5 rounded-xl border border-[#22242a] flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
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
