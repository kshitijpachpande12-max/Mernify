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

  // Handle service checkbox toggle
  const toggleService = useCallback((svcName) => {
    setSelectedServices((prev) => {
      if (prev.includes(svcName)) {
        const next = prev.filter((s) => s !== svcName);
        if (activeTabService === svcName) {
          setActiveTabService(next[0] || null);
        }
        return next;
      } else {
        const next = [...prev, svcName];
        if (!activeTabService) setActiveTabService(svcName);
        return next;
      }
    });
  }, [activeTabService]);

  // Calculate replay time timestamp based on slider position and available data
  const {
    telemetryData,
    rawTelemetryData,
    alerts,
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
    replayTime: useMemo(() => {
      if (!isReplaying) return null;
      // Find min and max ts across selected services
      let minTs = Infinity;
      let maxTs = -Infinity;
      selectedServices.forEach((svc) => {
        const d = rawTelemetryData[svc];
        if (d?.metrics?.length) {
          minTs = Math.min(minTs, d.metrics[0].ts);
          maxTs = Math.max(maxTs, d.metrics[d.metrics.length - 1].ts);
        }
      });
      if (minTs === Infinity || maxTs === -Infinity) return null;
      return minTs + (maxTs - minTs) * (replaySliderValue / 100);
    }, [isReplaying, replaySliderValue, rawTelemetryData, selectedServices]),
  });

  const activeData = activeTabService ? telemetryData[activeTabService] : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-12">
      {/* Top Navbar */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/projects')}
            className="text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-1.5"
          >
            ← Projects
          </button>
          <div className="h-4 w-px bg-slate-800" />
          <h1 className="font-bold text-white text-base tracking-tight">
            Mernitor Telemetry — <span className="font-mono text-cyan-400 text-sm">{projectId}</span>
          </h1>
        </div>

        {/* Time-Range Selector & Controls */}
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-lg bg-slate-800 p-1 border border-slate-700 text-xs">
            {['live', '15min', '1h', '6h'].map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTimeRange(t);
                  if (t === 'live') setIsReplaying(false);
                }}
                className={`px-3 py-1 rounded-md transition-all capitalize ${
                  timeRange === t
                    ? 'bg-cyan-600 text-white font-medium shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <button
            onClick={logout}
            className="text-xs text-slate-400 hover:text-rose-400 transition-colors ml-2"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Replay Scrubbing Bar (Incident Replay) */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 px-6 py-2 flex flex-wrap items-center gap-4 text-xs">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isReplaying}
            onChange={(e) => setIsReplaying(e.target.checked)}
            className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-amber-500"
          />
          <span className={isReplaying ? 'text-amber-400 font-medium' : 'text-slate-400'}>
            Replay Incident Mode {isReplaying && '(Live Paused)'}
          </span>
        </label>

        {isReplaying && (
          <div className="flex-1 flex items-center gap-3 min-w-[200px]">
            <span className="text-slate-500">History Scrub:</span>
            <input
              type="range"
              min="0"
              max="100"
              value={replaySliderValue}
              onChange={(e) => setReplaySliderValue(Number(e.target.value))}
              className="flex-1 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <span className="font-mono text-amber-300 w-12 text-right">{replaySliderValue}%</span>
          </div>
        )}

        {isLoadingHistory && (
          <span className="text-cyan-400 flex items-center gap-1.5 animate-pulse ml-auto">
            <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading historical data…
          </span>
        )}
      </div>

      {/* Main Body */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar / Services List */}
        <aside className="w-full md:w-64 bg-slate-900/40 border-r border-slate-800 p-4 shrink-0 flex flex-col gap-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Services</h2>
              <span className="text-[11px] text-slate-500">
                {selectedServices.length}/{services.length} selected
              </span>
            </div>
            {loadingServices ? (
              <div className="p-4 text-center text-slate-500 text-xs">Discovering services…</div>
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
            <AlertsPanel alerts={alerts} />
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-6 space-y-6 overflow-x-hidden">
          {selectedServices.length === 0 ? (
            <div className="h-96 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-2xl text-slate-500">
              <svg className="w-12 h-12 mb-3 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-base font-medium text-slate-300">Select a service to view metrics</p>
              <p className="text-xs mt-1 text-slate-500">Check one or more services from the left sidebar</p>
            </div>
          ) : (
            <>
              {/* Service Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
                {selectedServices.map((svc) => (
                  <button
                    key={svc}
                    onClick={() => setActiveTabService(svc)}
                    className={`px-4 py-2 rounded-lg text-xs font-mono transition-all flex items-center gap-2 ${
                      activeTabService === svc
                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-semibold'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>{svc}</span>
                  </button>
                ))}
              </div>

              {activeTabService && (
                <div className="space-y-6">
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
