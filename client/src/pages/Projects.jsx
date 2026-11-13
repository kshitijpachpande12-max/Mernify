import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API = 'http://localhost:5000';

export default function Projects() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(null);

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${API}/api/projects`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setProjects(await res.json());
      }
    } catch {
      // network error
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
      }
    } catch {
      // network error
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
      // fallback
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Mernify</h1>
        <button onClick={logout} className="text-sm text-slate-400 hover:text-white transition-colors">
          Sign out
        </button>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        <h2 className="text-2xl font-semibold text-white mb-6">Projects</h2>

        {/* Create project */}
        <form onSubmit={handleCreate} className="flex gap-3 mb-8">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New project name"
            className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <button
            type="submit"
            disabled={creating || !name.trim()}
            className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
          >
            {creating ? 'Creating…' : 'Create'}
          </button>
        </form>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <svg className="animate-spin h-8 w-8 text-cyan-500" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          </div>
        )}

        {/* Empty */}
        {!loading && projects.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <p className="text-lg">No projects yet</p>
            <p className="text-sm mt-1">Create your first project above</p>
          </div>
        )}

        {/* Project list */}
        <div className="space-y-3">
          {projects.map((p) => (
            <div
              key={p.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => navigate(`/dashboard/${p.id}`)}
                  className="text-lg font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  {p.name}
                </button>
                <span className="text-xs text-slate-500">
                  {new Date(p.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-slate-800 px-3 py-2 rounded font-mono text-slate-400 overflow-hidden text-ellipsis">
                  {p.apiKey}
                </code>
                <button
                  onClick={() => copyKey(p.apiKey, p.id)}
                  className="px-3 py-2 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
                >
                  {copied === p.id ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
