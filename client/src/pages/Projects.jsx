import React, { useState, useEffect } from 'react';
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
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${API}/api/projects`, {
        headers: { Authorization: `Bearer ${token}` },
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
      const res = await fetch(`${API}/api/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
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

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    setError('');
    const targetId = pendingDelete.id || pendingDelete._id;
    try {
      const res = await fetch(`${API}/api/projects/${encodeURIComponent(targetId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => String(p.id || p._id) !== String(targetId)));
        setPendingDelete(null);
      } else {
        const body = await res.json().catch(() => ({}));
        setError(body.error || 'Could not delete project');
      }
    } catch {
      setError('Could not delete project');
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    if (!pendingDelete) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape' && !deleting) setPendingDelete(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pendingDelete, deleting]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#05060d] text-slate-100">
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
        <button onClick={logout} className="text-sm text-slate-400 transition-colors hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-900">
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
                    <button
                      type="button"
                      onClick={() => setPendingDelete(p)}
                      className="rounded-lg border border-rose-500/30 px-3 py-1.5 text-xs text-rose-300 transition-colors hover:bg-rose-500/10 cursor-pointer flex items-center gap-1"
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

      {/* Delete Confirmation Modal */}
      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-project-title"
            className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-950 p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 text-lg font-bold">
                ⚠️
              </div>
              <div>
                <h3 id="delete-project-title" className="text-lg font-semibold text-white">
                  Delete {pendingDelete.name}?
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">This action is permanent and cannot be undone.</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed bg-slate-900/80 p-3 rounded-xl border border-white/5">
              Permanently cascades and deletes all associated telemetry events, service states, alerts, and rollups for this project.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setPendingDelete(null)}
                className="rounded-xl px-4 py-2 text-xs text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={confirmDelete}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500 disabled:cursor-not-allowed disabled:bg-rose-900 transition-colors cursor-pointer shadow-lg shadow-rose-600/30"
              >
                {deleting ? 'Deleting…' : 'Delete Project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
