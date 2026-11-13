import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const API = 'http://localhost:5000';
const MAX_POINTS = 300;

export function useTelemetry({ projectId, token, selectedServices = [], timeRange = 'live', isReplaying = false, replayTime = null }) {
  // Service-keyed data maps
  // Each service has: metrics: [], http: [], errors: [], routes: {}
  const [telemetryData, setTelemetryData] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [serviceStatuses, setServiceStatuses] = useState({});
  const [eventsPerSec, setEventsPerSec] = useState(0);
  const [renderRate, setRenderRate] = useState(0);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Buffer ref for RAF
  const bufferRef = useRef([]);
  const rafIdRef = useRef(null);
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
      if (selectedServices.length > 0) {
        socket.emit('subscribe', { projectId, services: selectedServices });
      }
    });

    socket.on('metrics:batch', (batch) => {
      if (!Array.isArray(batch)) return;
      eventCounterRef.current += batch.length;

      // If replaying incident, pause live stream ingestion into buffer
      if (isReplaying) return;

      bufferRef.current.push(...batch);

      // Schedule RAF flush if not already scheduled
      if (!rafIdRef.current) {
        rafIdRef.current = requestAnimationFrame(flushBuffer);
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
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
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

  // Flush buffer function using RAF
  const flushBuffer = useCallback(() => {
    rafIdRef.current = null;
    const batch = bufferRef.current;
    if (batch.length === 0) return;
    bufferRef.current = [];

    setTelemetryData((prevData) => {
      let updated = { ...prevData };
      let changed = false;

      for (const envelope of batch) {
        const { eventId, serviceName, ts, type, payload } = envelope;

        // Skip if not in selected services (unless none selected)
        if (selectedServices.length > 0 && !selectedServices.includes(serviceName)) {
          continue;
        }

        // Deduplicate by eventId
        if (eventId) {
          if (seenEventIdsRef.current.has(eventId)) continue;
          seenEventIdsRef.current.add(eventId);
          if (seenEventIdsRef.current.size > 10000) {
            // keep set reasonable
            const iter = seenEventIdsRef.current.values();
            for (let i = 0; i < 2000; i++) seenEventIdsRef.current.delete(iter.next().value);
          }
        }

        // Check asOf cursor if historical data was loaded
        const asOf = asOfMapRef.current.get(serviceName);
        if (asOf && ts <= asOf) {
          continue;
        }

        changed = true;
        if (!updated[serviceName]) {
          updated[serviceName] = {
            metrics: [],
            http: [],
            errors: [],
            byRoute: {},
          };
        }

        const svc = { ...updated[serviceName] };

        if (type === 'metrics' && payload) {
          const pt = {
            ts,
            cpuPercent: payload.cpuPercent ?? 0,
            memRssMB: payload.memRssMB ?? 0,
            heapUsedMB: payload.heapUsedMB ?? 0,
            eventLoopLagMs: payload.eventLoopLagMs ?? 0,
            uptimeSec: payload.uptimeSec ?? 0,
          };
          // Insert and maintain sort by ts, sliding window MAX_POINTS
          const nextMetrics = [...svc.metrics, pt];
          if (nextMetrics.length > MAX_POINTS) {
            svc.metrics = nextMetrics.slice(nextMetrics.length - MAX_POINTS);
          } else {
            svc.metrics = nextMetrics;
          }
        } else if (type === 'http' && payload) {
          const pt = {
            ts,
            requests: payload.requests ?? 0,
            errors4xx: payload.errors4xx ?? 0,
            errors5xx: payload.errors5xx ?? 0,
            errorRate: (payload.errors4xx ?? 0) + (payload.errors5xx ?? 0),
            latencyP50: payload.latencyP50 ?? 0,
            latencyP95: payload.latencyP95 ?? 0,
            latencyP99: payload.latencyP99 ?? 0,
          };
          const nextHttp = [...svc.http, pt];
          if (nextHttp.length > MAX_POINTS) {
            svc.http = nextHttp.slice(nextHttp.length - MAX_POINTS);
          } else {
            svc.http = nextHttp;
          }

          if (payload.byRoute) {
            svc.byRoute = { ...svc.byRoute, ...payload.byRoute };
          }
        } else if (type === 'error' && payload) {
          const errItem = {
            id: eventId || `${ts}-${Math.random()}`,
            ts,
            message: payload.message || 'Unknown error',
            stackHash: payload.stackHash || 'generic',
            route: payload.route || 'unknown',
            count: payload.count || 1,
            stack: payload.stack || '',
          };
          svc.errors = [errItem, ...svc.errors.slice(0, 99)];
        }

        updated[serviceName] = svc;
      }

      return changed ? updated : prevData;
    });
  }, [selectedServices]);

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
          )}&type=metrics&from=${from}&to=${now}&limit=1000`,
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
          const asOf = res.asOf || (points.length ? points[points.length - 1].ts : now);
          asOfMapRef.current.set(serviceName, asOf);

          const formattedPoints = points.map((p) => {
            seenEventIdsRef.current.add(p.eventId || p.id || `${p.ts}`);
            return {
              ts: p.ts,
              cpuPercent: p.payload?.cpuPercent ?? p.cpuPercent ?? 0,
              memRssMB: p.payload?.memRssMB ?? p.memRssMB ?? 0,
              heapUsedMB: p.payload?.heapUsedMB ?? p.heapUsedMB ?? 0,
              eventLoopLagMs: p.payload?.eventLoopLagMs ?? p.eventLoopLagMs ?? 0,
              uptimeSec: p.payload?.uptimeSec ?? p.uptimeSec ?? 0,
            };
          });

          // Sort by ts, limit to MAX_POINTS
          formattedPoints.sort((a, b) => a.ts - b.ts);
          const sliced = formattedPoints.slice(-MAX_POINTS);

          next[serviceName] = {
            ...(next[serviceName] || { http: [], errors: [], byRoute: {} }),
            metrics: sliced,
          };
        });
        return next;
      });
    });

    return () => {
      isCancelled = true;
    };
  }, [projectId, token, timeRange, selectedServices]);

  // Compute filtered telemetry data when replaying incident slider is active
  const filteredData = useCallback(() => {
    if (!isReplaying || replayTime === null) {
      return telemetryData;
    }
    const result = {};
    Object.keys(telemetryData).forEach((svc) => {
      const data = telemetryData[svc];
      result[svc] = {
        ...data,
        metrics: data.metrics.filter((pt) => pt.ts <= replayTime),
        http: data.http.filter((pt) => pt.ts <= replayTime),
      };
    });
    return result;
  }, [telemetryData, isReplaying, replayTime]);

  return {
    telemetryData: filteredData(),
    rawTelemetryData: telemetryData,
    alerts,
    serviceStatuses,
    eventsPerSec,
    renderRate,
    isLoadingHistory,
  };
}
