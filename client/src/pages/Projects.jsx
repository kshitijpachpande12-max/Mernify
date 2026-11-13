import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuroraBackground, GradientText, MagicCard, ShinyButton } from '../components/ui/visuals';

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
    try {
      const res = await fetch(`${API}/api/projects/${pendingDelete.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => String(p.id) !== String(pendingDelete.id)));
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
    <div className="relative min-h-screen overflow-hidden bg-[#05060d]">
      <AuroraBackground />
      <header className="relative z-10 flex items-center justify-between border-b border-white/10 bg-slate-950/50 px-6 py-4 backdrop-blur">
        <GradientText className="text-xl font-bold">Mernitor</GradientText>
        <button onClick={logout} className="text-sm text-slate-400 transition-colors hover:text-white">
          Sign out
        </button>
      </header>

      <main className="relative z-10 mx-auto max-w-4xl p-6">
        <h2 className="mb-6 text-2xl font-semibold text-white">Projects</h2>

        <form onSubmit={handleCreate} className="mb-8 flex gap-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New project name"
            className="flex-1 rounded-lg border border-white/10 bg-slate-950/70 px-4 py-2.5 text-white placeholder-slate-500 outline-none ring-cyan-400/40 focus:ring-2"
          />
          <ShinyButton type="submit" disabled={creating || !name.trim()}>
            {creating ? 'Creating…' : 'Create'}
          </ShinyButton>
        </form>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
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
          <MagicCard className="px-6 py-12 text-center text-slate-400">
            <p className="text-lg text-slate-200">No projects yet</p>
            <p className="mt-1 text-sm">Create your first project above</p>
          </MagicCard>
        )}

        <div className="space-y-3">
          {projects.map((p) => (
            <MagicCard key={p.id} className="p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <button
                  onClick={() => navigate(`/dashboard/${p.id}`)}
                  className="text-lg font-medium text-cyan-300 transition-colors hover:text-cyan-200"
                >
                  {p.name}
                </button>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPendingDelete(p)}
                    className="rounded-lg border border-rose-500/30 px-3 py-1.5 text-xs text-rose-300 transition-colors hover:bg-rose-500/10"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 overflow-hidden text-ellipsis rounded bg-slate-900/80 px-3 py-2 font-mono text-xs text-slate-400">
                  {p.apiKey}
                </code>
                <button
                  onClick={() => copyKey(p.apiKey, p.id)}
                  className="rounded bg-slate-800 px-3 py-2 text-xs text-slate-300 transition-colors hover:bg-slate-700"
                >
                  {copied === p.id ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </MagicCard>
          ))}
        </div>
      </main>

      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-project-title"
            className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-950 p-6 shadow-2xl"
          >
            <h3 id="delete-project-title" className="text-lg font-semibold text-white">
              Delete {pendingDelete.name}?
            </h3>
            <p className="mt-2 text-sm text-slate-400">
              This removes the project and its telemetry, alerts, and service history.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setPendingDelete(null)}
                className="rounded-lg px-4 py-2 text-sm text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={confirmDelete}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-500 disabled:cursor-not-allowed disabled:bg-rose-900"
              >
                {deleting ? 'Deleting…' : 'Delete project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
