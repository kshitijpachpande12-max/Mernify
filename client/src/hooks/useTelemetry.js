import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const MAX_POINTS = 300;
const FLUSH_MS = 200;

export function useTelemetry({
  projectId,
  token,
  selectedServices = [],
  timeRange = 'live',
  isReplaying = false,
  replayTime = null,
  services = [],
}) {
  // Service-keyed data maps
  // Each service has: metrics: [], http: [], errors: [], byRoute: {}
  const [telemetryData, setTelemetryData] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [serviceStatuses, setServiceStatuses] = useState({});
  const [eventsPerSec, setEventsPerSec] = useState(0);
  const [renderRate, setRenderRate] = useState(0);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Buffer ref. Flushed on a timer so charts do not repaint every frame.
  const bufferRef = useRef([]);
  const flushTimerRef = useRef(null);
  const seenEventIdsRef = useRef(new Set());
  const asOfMapRef = useRef(new Map()); // serviceName -> asOf ts
  const lastSeenMapRef = useRef(new Map()); // serviceName -> epoch ms
  const socketRef = useRef(null);

  // Refs that always hold the latest values, so long-lived socket handlers
  // never read stale props and we don't have to reconnect when they change.
  const selectedServicesRef = useRef(selectedServices);
  useEffect(() => {
    selectedServicesRef.current = selectedServices;
  }, [selectedServices]);

  const isReplayingRef = useRef(isReplaying);
  useEffect(() => {
    isReplayingRef.current = isReplaying;
  }, [isReplaying]);

  const flushBufferRef = useRef(null);

  // Counters for debug footer
  const eventCounterRef = useRef(0);
  const renderCounterRef = useRef(0);
  const statsIntervalRef = useRef(null);

  // Increment render counter on each render
  renderCounterRef.current += 1;

  // Track events/sec and render rate
  useEffect(() => {
    statsIntervalRef.current = setInterval(() => {
      setEventsPerSec(eventCounterRef.current);
      setRenderRate(renderCounterRef.current);
      eventCounterRef.current = 0;
      renderCounterRef.current = 0;
    }, 1000);

    return () => {
      if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
    };
  }, []);

  // Socket connection to "/dashboard".
  // NOTE: isReplaying is intentionally NOT a dependency. It is read through
  // isReplayingRef so toggling replay mode does not tear down the socket.
  useEffect(() => {
    if (!token || !projectId) return;

    const socket = io(`${API}/dashboard`, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      // Use the ref so a reconnect resubscribes to the CURRENT selection
      const current = selectedServicesRef.current;
      socket.emit('subscribe', {
        projectId,
        services: current && current.length > 0 ? current : undefined,
      });
    });

    socket.on('connect_error', (err) => {
      console.warn('[Sentinel Socket] Connection error:', err.message);
    });

    socket.on('metrics:batch', (batch) => {
      if (!Array.isArray(batch)) return;
      eventCounterRef.current += batch.length;

      // While replaying an incident, drop live events (ingestion paused)
      if (isReplayingRef.current) return;

      bufferRef.current.push(...batch);

      if (!flushTimerRef.current) {
        flushTimerRef.current = setTimeout(() => {
          flushTimerRef.current = null;
          flushBufferRef.current?.();
        }, FLUSH_MS);
      }
    });

    socket.on('alert:new', (alert) => {
      setAlerts((prev) => [alert, ...prev.slice(0, 99)]);
    });

    socket.on('service:status', (data) => {
      if (data && data.serviceName) {
        const nextStatus = data.status || (data.up ? 'up' : 'down');
        setServiceStatuses((prev) => ({
          ...prev,
          [data.serviceName]: nextStatus,
        }));
        if (nextStatus === 'up') {
          lastSeenMapRef.current.set(data.serviceName, Date.now());
        } else {
          lastSeenMapRef.current.set(data.serviceName, 0);
        }
      }
    });

    return () => {
      if (flushTimerRef.current) {
        clearTimeout(flushTimerRef.current);
        flushTimerRef.current = null;
      }
      socket.disconnect();
      socketRef.current = null;
    };
  }, [projectId, token]);

  // Handle subscription diffs when selectedServices change
  const prevSelectedRef = useRef([]);
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !socket.connected) {
      prevSelectedRef.current = selectedServices;
      return;
    }

    const prev = prevSelectedRef.current;
    const added = selectedServices.filter((s) => !prev.includes(s));
    const removed = prev.filter((s) => !selectedServices.includes(s));

    if (added.length > 0) {
      socket.emit('subscribe', { projectId, services: added });
    }
    if (removed.length > 0) {
      socket.emit('unsubscribe', { projectId, services: removed });
    }

    prevSelectedRef.current = selectedServices;
  }, [projectId, selectedServices]);

  // Apply a buffered batch in one pass per service.
  // All filtering / dedupe (which mutates refs) happens OUTSIDE the state
  // updater, so the updater stays pure and is safe under React Strict Mode
  // (which may invoke updaters twice in development).
  const flushBuffer = useCallback(() => {
    const batch = bufferRef.current;
    if (batch.length === 0) return;
    bufferRef.current = [];

    const incoming = new Map();
    const currentSelected = selectedServicesRef.current;

    for (const envelope of batch) {
      const { eventId, serviceName, ts, type, payload } = envelope;

      if (currentSelected && currentSelected.length > 0 && !currentSelected.includes(serviceName)) {
        continue;
      }

      if (eventId) {
        if (seenEventIdsRef.current.has(eventId)) continue;
        seenEventIdsRef.current.add(eventId);
        if (seenEventIdsRef.current.size > 10000) {
          const iter = seenEventIdsRef.current.values();
          for (let i = 0; i < 2000; i++) seenEventIdsRef.current.delete(iter.next().value);
        }
      }

      const asOf = asOfMapRef.current.get(serviceName);
      if (asOf && ts <= asOf) continue;

      let bucket = incoming.get(serviceName);
      if (!bucket) {
        bucket = { metrics: [], http: [], errors: [], routes: null };
        incoming.set(serviceName, bucket);
      }

      if (type === 'metrics' && payload) {
        bucket.metrics.push({
          ts,
          cpuPercent: payload.cpuPercent ?? 0,
          memRssMB: payload.memRssMB ?? 0,
          heapUsedMB: payload.heapUsedMB ?? 0,
          eventLoopLagMs: payload.eventLoopLagMs ?? 0,
          uptimeSec: payload.uptimeSec ?? 0,
        });
      } else if (type === 'http' && payload) {
        bucket.http.push({
          ts,
          requests: payload.requests ?? 0,
          errors4xx: payload.errors4xx ?? 0,
          errors5xx: payload.errors5xx ?? 0,
          errorRate: (payload.errors4xx ?? 0) + (payload.errors5xx ?? 0),
          latencyP50: payload.latencyP50 ?? 0,
          latencyP95: payload.latencyP95 ?? 0,
          latencyP99: payload.latencyP99 ?? 0,
        });
        if (payload.byRoute) {
          bucket.routes = bucket.routes ? { ...bucket.routes, ...payload.byRoute } : { ...payload.byRoute };
        }
      } else if (type === 'error' && payload) {
        bucket.errors.push({
          id: eventId || `${ts}-${Math.random()}`,
          ts,
          message: payload.message || 'Unknown error',
          stackHash: payload.stackHash || 'generic',
          route: payload.route || 'unknown',
          count: payload.count || 1,
          stack: payload.stack || '',
        });
      }
    }

    if (incoming.size === 0) return;

    // Mark telemetry arrival time for each service and reconcile status to 'up'
    const now = Date.now();
    for (const serviceName of incoming.keys()) {
      lastSeenMapRef.current.set(serviceName, now);
    }
    setServiceStatuses((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const serviceName of incoming.keys()) {
        if (next[serviceName] !== 'up') {
          next[serviceName] = 'up';
          changed = true;
        }
      }
      return changed ? next : prev;
    });

    // Pure updater: only merges `incoming` into previous state.
    setTelemetryData((prevData) => {
      const updated = { ...prevData };

      for (const [serviceName, bucket] of incoming) {
        const changed = bucket.metrics.length || bucket.http.length || bucket.errors.length || bucket.routes;
        if (!changed) continue;

        const prev = updated[serviceName] || { metrics: [], http: [], errors: [], byRoute: {} };
        let metrics = prev.metrics;
        let http = prev.http;
        let errors = prev.errors;
        let byRoute = prev.byRoute;

        if (bucket.metrics.length) {
          metrics = prev.metrics.concat(bucket.metrics);
          if (metrics.length > MAX_POINTS) metrics = metrics.slice(metrics.length - MAX_POINTS);
        }
        if (bucket.http.length) {
          http = prev.http.concat(bucket.http);
          if (http.length > MAX_POINTS) http = http.slice(http.length - MAX_POINTS);
        }
        if (bucket.errors.length) {
          errors = bucket.errors.concat(prev.errors).slice(0, 100);
        }
        if (bucket.routes) {
          byRoute = { ...prev.byRoute, ...bucket.routes };
        }

        updated[serviceName] = { metrics, http, errors, byRoute };
      }

      return updated;
    });
  }, []);

  flushBufferRef.current = flushBuffer;

  // Synchronize statuses when services list updates from REST polling
  useEffect(() => {
    if (!services || services.length === 0) return;
    setServiceStatuses((prev) => {
      const next = { ...prev };
      let changed = false;

      for (const svc of services) {
        const name = typeof svc === 'string' ? svc : svc.serviceName;
        if (!name) continue;

        if (svc && Array.isArray(svc.instances) && svc.instances.length > 0) {
          const anyUp = svc.instances.some((i) => i.status === 'up');
          const latestSeen = svc.instances.reduce(
            (max, i) => Math.max(max, i.lastSeen ? new Date(i.lastSeen).getTime() : 0),
            0
          );

          if (latestSeen > 0 && !lastSeenMapRef.current.has(name)) {
            lastSeenMapRef.current.set(name, latestSeen);
          }

          if (!anyUp && next[name] !== 'down') {
            next[name] = 'down';
            changed = true;
          } else if (anyUp && next[name] === undefined) {
            next[name] = 'up';
            changed = true;
          }
        } else if (next[name] === undefined) {
          next[name] = 'down';
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [services]);

  // Client-side Heartbeat / Silence detection:
  // In 'live' mode, if no telemetry packet is received for >15s, transition status to 'down'
  useEffect(() => {
    if (isReplaying || timeRange !== 'live') return;

    const timer = setInterval(() => {
      const now = Date.now();
      const SILENCE_TIMEOUT = 60000; // 60 seconds (prevents premature false 'down' under cloud/batch jitter)

      setServiceStatuses((prev) => {
        let changed = false;
        const next = { ...prev };

        for (const [svcName, lastSeen] of lastSeenMapRef.current.entries()) {
          if (lastSeen > 0 && now - lastSeen > SILENCE_TIMEOUT) {
            if (next[svcName] !== 'down') {
              next[svcName] = 'down';
              changed = true;
            }
          }
        }
        return changed ? next : prev;
      });
    }, 2000);

    return () => clearInterval(timer);
  }, [isReplaying, timeRange]);

  // Load instant telemetry on mount and historical backfills on timeRange changes
  useEffect(() => {
    if (!token || !projectId || selectedServices.length === 0) {
      return;
    }

    let isCancelled = false;
    setIsLoadingHistory(true);

    const now = Date.now();
    let durationMs = 5 * 60 * 1000; // 5m default for live mode instant seed
    let fetchLimit = 150;
    if (timeRange === '15min') {
      durationMs = 15 * 60 * 1000;
      fetchLimit = 300;
    } else if (timeRange === '1h') {
      durationMs = 60 * 60 * 1000;
      fetchLimit = 500;
    } else if (timeRange === '6h') {
      durationMs = 6 * 60 * 60 * 1000;
      fetchLimit = 1000;
    }
    const from = now - durationMs;

    const fetchHistoryForService = async (service) => {
      try {
        const res = await fetch(
          `${API}/api/telemetry?projectId=${encodeURIComponent(projectId)}&service=${encodeURIComponent(
            service
          )}&from=${from}&to=${now}&limit=${fetchLimit}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) return null;
        return await res.json();
      } catch {
        return null;
      }
    };

    Promise.all(selectedServices.map((svc) => fetchHistoryForService(svc))).then((results) => {
      if (isCancelled) return;
      setIsLoadingHistory(false);

      setTelemetryData((prev) => {
        const next = { ...prev };
        results.forEach((res, idx) => {
          if (!res) return;
          const serviceName = selectedServices[idx];
          const points = res.points || [];

          // Only set asOf cursor if historical points were actually returned
          if (points.length > 0 && res.asOf) {
            asOfMapRef.current.set(serviceName, res.asOf);
          }

          const histMetrics = [];
          const histHttp = [];
          const histErrors = [];
          const histRoutes = {};

          points.forEach((p) => {
            seenEventIdsRef.current.add(p.eventId || p.id || `${p.ts}`);
            const pay = p.payload || {};

            if (p.type === 'metrics' || pay.cpuPercent !== undefined) {
              histMetrics.push({
                ts: p.ts,
                cpuPercent: pay.cpuPercent ?? p.cpuPercent ?? 0,
                memRssMB: pay.memRssMB ?? p.memRssMB ?? 0,
                heapUsedMB: pay.heapUsedMB ?? p.heapUsedMB ?? 0,
                eventLoopLagMs: pay.eventLoopLagMs ?? p.eventLoopLagMs ?? 0,
                uptimeSec: pay.uptimeSec ?? p.uptimeSec ?? 0,
              });
            } else if (p.type === 'http' || pay.requests !== undefined) {
              histHttp.push({
                ts: p.ts,
                requests: pay.requests ?? 0,
                errors4xx: pay.errors4xx ?? 0,
                errors5xx: pay.errors5xx ?? 0,
                errorRate: (pay.errors4xx ?? 0) + (pay.errors5xx ?? 0),
                latencyP50: pay.latencyP50 ?? 0,
                latencyP95: pay.latencyP95 ?? 0,
                latencyP99: pay.latencyP99 ?? 0,
              });
              if (pay.byRoute) {
                Object.assign(histRoutes, pay.byRoute);
              }
            } else if (p.type === 'error') {
              histErrors.push({
                id: p.eventId || `${p.ts}`,
                ts: p.ts,
                message: pay.message || 'Error',
                stackHash: pay.stackHash || 'generic',
                route: pay.route || 'unknown',
                count: pay.count || 1,
                stack: pay.stack || '',
              });
            }
          });

          histMetrics.sort((a, b) => a.ts - b.ts);
          histHttp.sort((a, b) => a.ts - b.ts);

          const existing = next[serviceName] || { metrics: [], http: [], errors: [], byRoute: {} };
          next[serviceName] = {
            metrics: histMetrics.length > 0 ? histMetrics.slice(-MAX_POINTS) : existing.metrics,
            http: histHttp.length > 0 ? histHttp.slice(-MAX_POINTS) : existing.http,
            errors: histErrors.length > 0 ? histErrors.slice(0, 99) : existing.errors,
            byRoute: Object.keys(histRoutes).length > 0 ? { ...existing.byRoute, ...histRoutes } : existing.byRoute,
          };
        });
        return next;
      });
    });

    return () => {
      isCancelled = true;
    };
  }, [projectId, token, timeRange, selectedServices]);

  const clearAlerts = useCallback(async () => {
    setAlerts([]);
    try {
      await fetch(`${API}/api/alerts?projectId=${encodeURIComponent(projectId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // ignore
    }
  }, [projectId, token]);

  // Compute filtered telemetry data when replaying incident slider is active
  const filteredData = useCallback(() => {
    if (!isReplaying || replayTime === null) {
      return telemetryData;
    }
    const result = {};
    Object.keys(telemetryData).forEach((svc) => {
      const data = telemetryData[svc];
      if (!data) return;
      result[svc] = {
        ...data,
        metrics: data.metrics ? data.metrics.filter((pt) => pt.ts <= replayTime) : [],
        http: data.http ? data.http.filter((pt) => pt.ts <= replayTime) : [],
        errors: data.errors ? data.errors.filter((pt) => pt.ts <= replayTime) : [],
      };
    });
    return result;
  }, [telemetryData, isReplaying, replayTime]);

  return {
    telemetryData: isReplaying && replayTime !== null ? filteredData() : telemetryData,
    rawTelemetryData: telemetryData,
    alerts,
    clearAlerts,
    serviceStatuses,
    eventsPerSec,
    renderRate,
    isLoadingHistory,
  };
}