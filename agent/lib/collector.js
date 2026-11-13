'use strict';

const os = require('os');

/**
 * System-metrics collector using only Node.js built-ins.
 */

let prevCpuInfo = null; // { idle, total } from the last sample

function cpuSnapshot() {
  const cpus = os.cpus();
  let idle = 0;
  let total = 0;
  for (const cpu of cpus) {
    const t = cpu.times;
    idle += t.idle;
    total += t.user + t.nice + t.sys + t.idle + t.irq;
  }
  return { idle, total };
}

/**
 * Measure event-loop lag by scheduling a setTimeout(0) and seeing how
 * long the runtime actually takes to fire it.
 */
function measureEventLoopLag() {
  return new Promise((resolve) => {
    const start = process.hrtime.bigint();
    setTimeout(() => {
      const delta = Number(process.hrtime.bigint() - start) / 1e6; // ms
      resolve(delta);
    }, 0);
  });
}

/**
 * Collect a single metrics snapshot.
 * On the very first call we need to wait ~100 ms for a CPU delta; after that
 * we compare against the previous snapshot (no extra wait).
 */
async function collect() {
  // --- CPU percentage ---------------------------------------------------
  const cur = cpuSnapshot();
  let cpuPercent = 0;

  if (prevCpuInfo) {
    const idleDelta = cur.idle - prevCpuInfo.idle;
    const totalDelta = cur.total - prevCpuInfo.total;
    cpuPercent = totalDelta === 0 ? 0 : +((1 - idleDelta / totalDelta) * 100).toFixed(2);
  } else {
    // First call — take a short sample so we return something meaningful
    const first = cpuSnapshot();
    await new Promise((r) => setTimeout(r, 100));
    const second = cpuSnapshot();
    const idleDelta = second.idle - first.idle;
    const totalDelta = second.total - first.total;
    cpuPercent = totalDelta === 0 ? 0 : +((1 - idleDelta / totalDelta) * 100).toFixed(2);
  }
  prevCpuInfo = cur;

  // --- Memory -----------------------------------------------------------
  const mem = process.memoryUsage();
  const memRssMB = +(mem.rss / 1024 / 1024).toFixed(2);
  const heapUsedMB = +(mem.heapUsed / 1024 / 1024).toFixed(2);

  // --- Event-loop lag ---------------------------------------------------
  const eventLoopLagMs = +(await measureEventLoopLag()).toFixed(2);

  // --- Uptime -----------------------------------------------------------
  const uptimeSec = +process.uptime().toFixed(2);

  return { cpuPercent, memRssMB, heapUsedMB, eventLoopLagMs, uptimeSec };
}

module.exports = { collect };
