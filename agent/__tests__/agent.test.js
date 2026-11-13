const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { createBuffer } = require('../lib/buffer');
const { collect } = require('../lib/collector');

describe('agent buffer', () => {
  it('bounds buffer to maxSize and drops oldest', () => {
    const buf = createBuffer(3);
    buf.add({ id: 1 });
    buf.add({ id: 2 });
    buf.add({ id: 3 });
    assert.equal(buf.size(), 3);

    buf.add({ id: 4 });
    assert.equal(buf.size(), 3);

    const flushed = buf.flush();
    assert.equal(flushed.length, 3);
    assert.deepEqual(flushed.map((e) => e.id), [2, 3, 4]);
    assert.equal(buf.size(), 0);
  });
});

describe('agent collector', () => {
  it('collects valid system metrics with Node built-ins', async () => {
    const metrics = await collect();
    assert.equal(typeof metrics.cpuPercent, 'number');
    assert.equal(typeof metrics.memRssMB, 'number');
    assert.equal(typeof metrics.heapUsedMB, 'number');
    assert.equal(typeof metrics.eventLoopLagMs, 'number');
    assert.equal(typeof metrics.uptimeSec, 'number');

    assert.ok(metrics.cpuPercent >= 0);
    assert.ok(metrics.memRssMB > 0);
    assert.ok(metrics.heapUsedMB > 0);
    assert.ok(metrics.uptimeSec >= 0);
  });
});
