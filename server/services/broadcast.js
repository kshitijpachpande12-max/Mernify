// Broadcast service — delta buffer per room, flush to dashboard clients

const BROADCAST_INTERVAL = 100; // ms

// key: "projectId:::serviceName" -> envelopes[]
const roomBuffers = new Map();
let broadcastTimer = null;

function addEvents(events) {
  for (const ev of events) {
    const key = `${ev.projectId}:::${ev.serviceName}`;
    if (!roomBuffers.has(key)) {
      roomBuffers.set(key, []);
    }
    // Ensure envelope shape with epoch ms ts and string IDs
    const envelope = {
      eventId: ev.eventId,
      projectId: String(ev.projectId),
      serviceName: ev.serviceName,
      instanceId: ev.instanceId,
      seq: ev.seq,
      ts: ev.ts instanceof Date ? ev.ts.getTime() : ev.ts,
      type: ev.type,
      payload: ev.payload,
    };
    roomBuffers.get(key).push(envelope);
  }
}

function flush(dashboardIo) {
  if (!dashboardIo) return;

  for (const [key, events] of roomBuffers.entries()) {
    if (events.length === 0) continue;
    const [projectId, serviceName] = key.split(':::');
    // Broadcast to service room, project room, and alias rooms
    dashboardIo
      .to(`project:${projectId}:service:${serviceName}`)
      .to(`project:${projectId}`)
      .to(`project:proj_demo:service:${serviceName}`)
      .to('project:proj_demo')
      .emit('metrics:batch', events);
  }
  roomBuffers.clear();
}

function emitAlert(dashboardIo, alert) {
  if (!dashboardIo) return;
  const alertObj = {
    id: alert.id || (alert._id ? alert._id.toString() : String(alert)),
    projectId: String(alert.projectId),
    serviceName: alert.serviceName,
    type: alert.type,
    metric: alert.metric,
    severity: alert.severity,
    message: alert.message,
    value: alert.value,
    threshold: alert.threshold,
    ts: alert.ts instanceof Date ? alert.ts.getTime() : alert.ts || Date.now(),
    resolved: !!alert.resolved,
  };
  dashboardIo
    .to(`project:${alert.projectId}:service:${alert.serviceName}`)
    .to(`project:${alert.projectId}`)
    .to(`project:proj_demo:service:${alert.serviceName}`)
    .to('project:proj_demo')
    .emit('alert:new', alertObj);
}

function emitServiceStatus(dashboardIo, status) {
  if (!dashboardIo) return;
  const statusObj = {
    serviceName: status.serviceName,
    instanceId: status.instanceId,
    status: status.status, // "up" | "down"
    ts: status.ts instanceof Date ? status.ts.getTime() : status.ts || Date.now(),
  };
  dashboardIo
    .to(`project:${status.projectId}:service:${status.serviceName}`)
    .to(`project:${status.projectId}`)
    .to(`project:proj_demo:service:${status.serviceName}`)
    .to('project:proj_demo')
    .emit('service:status', statusObj);
}

function startBroadcasting(dashboardIo) {
  if (broadcastTimer) return;
  broadcastTimer = setInterval(() => flush(dashboardIo), BROADCAST_INTERVAL);
}

function stopBroadcasting() {
  if (broadcastTimer) {
    clearInterval(broadcastTimer);
    broadcastTimer = null;
  }
}

module.exports = {
  addEvents,
  flush,
  emitAlert,
  emitServiceStatus,
  startBroadcasting,
  stopBroadcasting,
};
