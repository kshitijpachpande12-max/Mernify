import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const API = 'http://localhost:5000';
const MAX_POINTS = 300;
const FLUSH_MS = 200;

export function useTelemetry({ projectId, token, selectedServices = [], timeRange = 'live', isReplaying = false, replayTime = null }) {
  // Service-keyed data maps
  // Each service has: metrics: [], http: [], errors: [], routes: {}
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
  const socketRef = useRef(null);

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

  // Socket connection to "/dashboard"
  useEffect(() => {
    if (!token || !projectId) return;

    const socket = io(`${API}/dashboard`, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('subscribe', {
        projectId,
        services: selectedServices && selectedServices.length > 0 ? selectedServices : undefined,
      });
    });

    socket.on('metrics:batch', (batch) => {
      if (!Array.isArray(batch)) return;
      eventCounterRef.current += batch.length;

      // If replaying incident, pause live stream ingestion into buffer
      if (isReplaying) return;

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
        setServiceStatuses((prev) => ({
          ...prev,
          [data.serviceName]: data.status || (data.up ? 'up' : 'down'),
        }));
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
  }, [projectId, token, isReplaying]);

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

  // Ref to always access latest selectedServices inside flushBuffer
  const selectedServicesRef = useRef(selectedServices);
  useEffect(() => {
    selectedServicesRef.current = selectedServices;
  }, [selectedServices]);

  const flushBufferRef = useRef(null);

  // Apply a buffered batch in one pass per service.
  const flushBuffer = useCallback(() => {
    const batch = bufferRef.current;
    if (batch.length === 0) return;
    bufferRef.current = [];

    setTelemetryData((prevData) => {
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

      if (incoming.size === 0) return prevData;

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

  // Load historical telemetry when timeRange changes or services change
  useEffect(() => {
    if (!token || !projectId || timeRange === 'live' || selectedServices.length === 0) {
      return;
    }

    let isCancelled = false;
    setIsLoadingHistory(true);

    const now = Date.now();
    let durationMs = 15 * 60 * 1000; // 15m
    if (timeRange === '1h') durationMs = 60 * 60 * 1000;
    if (timeRange === '6h') durationMs = 6 * 60 * 60 * 1000;
    const from = now - durationMs;

    const fetchHistoryForService = async (service) => {
      try {
        const res = await fetch(
          `${API}/api/telemetry?projectId=${encodeURIComponent(projectId)}&service=${encodeURIComponent(
            service
          )}&from=${from}&to=${now}&limit=1000`,
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
