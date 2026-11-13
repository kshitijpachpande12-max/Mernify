import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTelemetry } from '../hooks/useTelemetry';
import ServiceList from '../components/ServiceList';
import MetricsChart from '../components/MetricsChart';
import LatencyChart from '../components/LatencyChart';
import RequestChart from '../components/RequestChart';
import AlertsPanel from '../components/AlertsPanel';
import RouteTable from '../components/RouteTable';
import ErrorGroups from '../components/ErrorGroups';
import DebugFooter from '../components/DebugFooter';
import { GradientText } from '../components/ui/visuals';

const API = 'http://localhost:5000';

export default function Dashboard() {
  const { projectId } = useParams();
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const [services, setServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [activeTabService, setActiveTabService] = useState(null);
  const [timeRange, setTimeRange] = useState('live');
  const [loadingServices, setLoadingServices] = useState(true);

  // Incident Replay state
  const [isReplaying, setIsReplaying] = useState(false);
  const [replaySliderValue, setReplaySliderValue] = useState(100);

  // Fetch available services for project
  useEffect(() => {
    if (!token || !projectId) return;
    let isCancelled = false;

    const fetchServices = async () => {
      try {
        const res = await fetch(`${API}/api/services?projectId=${encodeURIComponent(projectId)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const list = await res.json();
          if (!isCancelled) {
            setServices(list);
            // Default select all or first service if none selected
            if (list.length > 0) {
              const names = list.map((s) => (typeof s === 'string' ? s : s.serviceName));
              setSelectedServices((prev) => (prev.length === 0 ? names : prev));
              setActiveTabService((prev) => (prev ? prev : names[0]));
            }
          }
        }
      } catch {
        // network issue
      } finally {
        if (!isCancelled) setLoadingServices(false);
      }
    };

    fetchServices();
    const interval = setInterval(fetchServices, 10000);
    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [projectId, token]);

  // Handle service checkbox toggle.
  // Pure updater: no other state is set inside it (safe under Strict Mode).
  const toggleService = useCallback((svcName) => {
    setSelectedServices((prev) =>
      prev.includes(svcName) ? prev.filter((s) => s !== svcName) : [...prev, svcName]
    );
  }, []);

  // Keep the active tab valid whenever the selection changes:
  // - if the active service was unchecked, fall back to the first selected one
  // - if nothing was active yet, pick the first selected one
  useEffect(() => {
    setActiveTabService((prev) => {
      if (prev && selectedServices.includes(prev)) return prev;
      return selectedServices[0] || null;
    });
  }, [selectedServices]);

  // Real-time telemetry ingestion and historical fetch.
  // isReplaying is passed so the hook actually pauses live ingestion.
  const {
    telemetryData,
    rawTelemetryData,
    alerts,
    clearAlerts,
    serviceStatuses,
    eventsPerSec,
    renderRate,
    isLoadingHistory,
  } = useTelemetry({
    projectId,
    token,
    selectedServices,
    timeRange,
    isReplaying,
  });

  // Calculate incident replay bounds.
  // rawTelemetryData is an object keyed by service name:
  //   { svc: { metrics: [], http: [], errors: [], byRoute: {} } }
  const replayBounds = useMemo(() => {
    let minTs = Infinity;
    let maxTs = -Infinity;

    for (const svc of Object.values(rawTelemetryData || {})) {
      if (!svc) continue;
      for (const series of [svc.metrics, svc.http, svc.errors]) {
        if (!Array.isArray(series)) continue;
        for (const pt of series) {
          if (Number.isFinite(pt.ts)) {
            if (pt.ts < minTs) minTs = pt.ts;
            if (pt.ts > maxTs) maxTs = pt.ts;
          }
        }
      }
    }

    return minTs === Infinity ? { minTs: 0, maxTs: 0 } : { minTs, maxTs };
  }, [rawTelemetryData]);

  // Scrubbed timestamp for incident replay
  const replayTime = useMemo(() => {
    if (!isReplaying || !replayBounds.minTs || !replayBounds.maxTs) return null;
    const span = replayBounds.maxTs - replayBounds.minTs;
    if (span <= 0) return replayBounds.maxTs;
    return replayBounds.minTs + (span * replaySliderValue) / 100;
  }, [isReplaying, replayBounds, replaySliderValue]);

  // Scrub active service data when replaying
  const activeData = useMemo(() => {
    if (!activeTabService || !telemetryData[activeTabService]) {
      return { metrics: [], http: [], errors: [], byRoute: {} };
    }
    const raw = telemetryData[activeTabService];
    if (!isReplaying || replayTime === null) {
      return raw;
    }
    return {
      ...raw,
      metrics: raw.metrics ? raw.metrics.filter((pt) => pt.ts <= replayTime) : [],
      http: raw.http ? raw.http.filter((pt) => pt.ts <= replayTime) : [],
      errors: raw.errors ? raw.errors.filter((pt) => pt.ts <= replayTime) : [],
    };
  }, [activeTabService, telemetryData, isReplaying, replayTime]);

  return (
    <div className="min-h-screen bg-[#090a0b] text-white flex flex-col pb-12 selection:bg-white/20 selection:text-white">
      {/* Top Navbar */}
      <header className="bg-[#0d0e11]/90 border-b border-zinc-800/80 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-40 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/projects')}
            className="text-zinc-400 hover:text-white transition-colors text-sm flex items-center gap-1.5 font-medium cursor-pointer"
          >
            ← Projects
          </button>
          <div className="h-4 w-px bg-zinc-800" />
          <h1 className="font-bold text-white text-base tracking-tight flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <GradientText className="tracking-tight">Sentinel Telemetry</GradientText>
            <span className="text-zinc-600">•</span>
            <span className="font-mono text-zinc-300 text-xs px-2.5 py-0.5 rounded-full bg-[#121215] border border-zinc-800">{projectId}</span>
          </h1>
        </div>

        {/* Time-Range Selector & Controls */}
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-xl bg-[#121215] p-1 border border-zinc-800 text-xs font-mono">
            {['live', '15min', '1h', '6h'].map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTimeRange(t);
                  if (t === 'live') setIsReplaying(false);
                }}
                className={`px-3 py-1 rounded-lg transition-all capitalize cursor-pointer ${
                  timeRange === t
                    ? 'bg-white text-black font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <button
            onClick={logout}
            className="text-xs text-zinc-400 hover:text-white transition-colors ml-2 px-3 py-1.5 rounded-lg hover:bg-zinc-800/70 cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Replay Scrubbing Bar (Incident Replay) */}
      <div className="bg-[#0d0e11]/95 border-b border-zinc-800/80 px-6 py-2.5 flex flex-wrap items-center gap-4 text-xs">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isReplaying}
            onChange={(e) => setIsReplaying(e.target.checked)}
            className="w-4 h-4 rounded bg-[#090a0b] border-zinc-700 text-amber-500 focus:ring-0"
          />
          <span className={isReplaying ? 'text-amber-400 font-bold' : 'text-zinc-400'}>
            Replay Incident Mode {isReplaying && '(Live Ingestion Paused)'}
          </span>
        </label>

        {isReplaying && (
          <div className="flex-1 flex items-center gap-3 min-w-[200px]">
            <span className="text-zinc-500 font-mono">Scrub:</span>
            <input
              type="range"
              min="0"
              max="100"
              value={replaySliderValue}
              onChange={(e) => setReplaySliderValue(Number(e.target.value))}
              className="flex-1 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
            <span className="font-mono text-amber-300 text-xs">
              {replaySliderValue}% {replayTime ? `(${new Date(replayTime).toLocaleTimeString()})` : ''}
            </span>
          </div>
        )}

        {isLoadingHistory && (
          <span className="text-zinc-300 flex items-center gap-1.5 animate-pulse ml-auto font-mono text-xs">
            <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading historical frames…
          </span>
        )}
      </div>

      {/* Main Body */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar / Services List & Decluttered Alerts */}
        <aside className="w-full md:w-72 bg-[#0d0e11]/60 border-r border-zinc-800/80 p-4 shrink-0 flex flex-col gap-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">Microservices</h2>
              <span className="text-[11px] text-zinc-500 font-mono">
                {selectedServices.length}/{services.length} selected
              </span>
            </div>
            {loadingServices ? (
              <div className="p-4 text-center text-zinc-500 text-xs font-mono">Discovering services…</div>
            ) : (
              <ServiceList
                services={services}
                selected={selectedServices}
                onToggle={toggleService}
                statuses={serviceStatuses}
              />
            )}
          </div>

          <div className="flex-1">
            <AlertsPanel alerts={alerts} onClear={clearAlerts} />
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-6 space-y-6 overflow-x-hidden">
          {selectedServices.length === 0 ? (
            <div className="h-96 flex flex-col items-center justify-center border border-dashed border-zinc-800 rounded-2xl text-zinc-500 bg-[#121215]/30">
              <svg className="w-12 h-12 mb-3 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-base font-bold text-white">Select a microservice to inspect telemetry</p>
              <p className="text-xs mt-1 text-zinc-400">Check one or more services from the left control panel</p>
            </div>
          ) : (
            <>
              {/* Service Tabs */}
              <div className="flex items-center gap-2 border-b border-zinc-800 pb-3 overflow-x-auto">
                {selectedServices.map((svc) => (
                  <button
                    key={svc}
                    onClick={() => setActiveTabService(svc)}
                    className={`px-4 py-2 rounded-xl text-xs font-mono transition-all flex items-center gap-2 cursor-pointer ${
                      activeTabService === svc
                        ? 'bg-[#18191d] text-white border border-zinc-600 font-bold shadow-md'
                        : 'bg-[#121215] border border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span>{svc}</span>
                  </button>
                ))}
              </div>

              {activeTabService && (
                <div className="space-y-6">
                  {/* Rich Metric KPI Stats Row */}
                  {(() => {
                    const metrics = activeData?.metrics || [];
                    const http = activeData?.http || [];
                    const m = metrics[metrics.length - 1];
                    const h = http[http.length - 1];

                    return (
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-4 rounded-2xl bg-[#121215] border border-zinc-800/90 shadow-xl">
                          <div className="flex items-center justify-between text-xs text-zinc-400 font-mono mb-1">
                            <span>CPU UTILIZATION</span>
                            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                          </div>
                          <div className="text-2xl font-bold text-white font-mono tracking-tight">
                            {m?.cpuPercent !== undefined ? `${m.cpuPercent.toFixed(1)}%` : '—'}
                          </div>
                          <div className="text-[10px] text-zinc-400 font-mono mt-1">Core process footprint</div>
                        </div>

                        <div className="p-4 rounded-2xl bg-[#121215] border border-zinc-800/90 shadow-xl">
                          <div className="flex items-center justify-between text-xs text-zinc-400 font-mono mb-1">
                            <span>MEMORY (RSS)</span>
                            <span className="w-2 h-2 rounded-full bg-zinc-400" />
                          </div>
                          <div className="text-2xl font-bold text-white font-mono tracking-tight">
                            {m?.memRssMB !== undefined ? `${Math.round(m.memRssMB)} MB` : '—'}
                          </div>
                          <div className="text-[10px] text-zinc-400 font-mono mt-1">Resident process set</div>
                        </div>

                        <div className="p-4 rounded-2xl bg-[#121215] border border-zinc-800/90 shadow-xl">
                          <div className="flex items-center justify-between text-xs text-zinc-400 font-mono mb-1">
                            <span>P99 LATENCY</span>
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          </div>
                          <div className="text-2xl font-bold text-white font-mono tracking-tight">
                            {h?.latencyP99 !== undefined ? `${h.latencyP99.toFixed(1)} ms` : '—'}
                          </div>
                          <div className="text-[10px] text-emerald-400 font-mono mt-1">Critical tail threshold</div>
                        </div>

                        <div className="p-4 rounded-2xl bg-[#121215] border border-zinc-800/90 shadow-xl">
                          <div className="flex items-center justify-between text-xs text-zinc-400 font-mono mb-1">
                            <span>THROUGHPUT</span>
                            <span className="w-2 h-2 rounded-full bg-white" />
                          </div>
                          <div className="text-2xl font-bold text-white font-mono tracking-tight">
                            {h?.requests !== undefined ? `${h.requests} req/s` : '—'}
                          </div>
                          <div className="text-[10px] text-zinc-400 font-mono mt-1">Active request stream</div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Top Charts Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <MetricsChart serviceName={activeTabService} data={activeData?.metrics || []} />
                    <LatencyChart serviceName={activeTabService} data={activeData?.http || []} />
                  </div>

                  {/* Middle Charts & Tables */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <RequestChart serviceName={activeTabService} data={activeData?.http || []} />
                    <RouteTable serviceName={activeTabService} routes={activeData?.byRoute || {}} />
                  </div>

                  {/* Bottom Error Groups */}
                  <div>
                    <ErrorGroups serviceName={activeTabService} errors={activeData?.errors || []} />
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Real-time Performance Debug Footer */}
      <DebugFooter
        eventsPerSec={eventsPerSec}
        renderRate={renderRate}
        activeServices={selectedServices.length}
      />
    </div>
  );
}
