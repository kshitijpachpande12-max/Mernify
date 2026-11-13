const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const {
  registerSchema,
  loginSchema,
  projectSchema,
  envelopeSchema,
  ingestSchema,
} = require('../validation/schemas');

describe('registerSchema', () => {
  it('accepts valid input', () => {
    const result = registerSchema.safeParse({
      name: 'Test',
      email: 'test@example.com',
      password: 'secret123',
    });
    assert.ok(result.success);
  });

  it('rejects missing name', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      password: 'secret123',
    });
    assert.ok(!result.success);
  });

  it('rejects short password', () => {
    const result = registerSchema.safeParse({
      name: 'Test',
      email: 'test@example.com',
      password: '12345',
    });
    assert.ok(!result.success);
  });

  it('rejects invalid email', () => {
    const result = registerSchema.safeParse({
      name: 'Test',
      email: 'not-an-email',
      password: 'secret123',
    });
    assert.ok(!result.success);
  });
});

describe('loginSchema', () => {
  it('accepts valid input', () => {
    const result = loginSchema.safeParse({
      email: 'test@example.com',
      password: 'secret123',
    });
    assert.ok(result.success);
  });

  it('rejects missing email', () => {
    const result = loginSchema.safeParse({ password: 'secret123' });
    assert.ok(!result.success);
  });
});

describe('projectSchema', () => {
  it('accepts valid input', () => {
    const result = projectSchema.safeParse({ name: 'My Project' });
    assert.ok(result.success);
  });

  it('rejects empty name', () => {
    const result = projectSchema.safeParse({ name: '' });
    assert.ok(!result.success);
  });
});

describe('envelopeSchema', () => {
  const baseEnvelope = {
    eventId: 'evt-1',
    projectId: 'proj-1',
    serviceName: 'api-server',
    instanceId: 'inst-1',
    seq: 0,
    ts: Date.now(),
    type: 'metrics',
    payload: {
      cpuPercent: 42.5,
      memRssMB: 128,
      heapUsedMB: 64,
      eventLoopLagMs: 1.2,
      uptimeSec: 3600,
    },
  };

  it('accepts valid metrics envelope', () => {
    const result = envelopeSchema.safeParse(baseEnvelope);
    assert.ok(result.success);
  });

  it('accepts valid http envelope', () => {
    const result = envelopeSchema.safeParse({
      ...baseEnvelope,
      type: 'http',
      payload: {
        windowMs: 60000,
        requests: 100,
        errors4xx: 2,
        errors5xx: 1,
        latencyP50: 10,
        latencyP95: 50,
        latencyP99: 100,
        byRoute: {
          '/api/users': { count: 50, errors: 1, p95: 40 },
        },
      },
    });
    assert.ok(result.success);
  });

  it('accepts valid error envelope', () => {
    const result = envelopeSchema.safeParse({
      ...baseEnvelope,
      type: 'error',
      payload: {
        message: 'Something broke',
        stackHash: 'abc123',
      },
    });
    assert.ok(result.success);
  });

  it('accepts valid heartbeat envelope', () => {
    const result = envelopeSchema.safeParse({
      ...baseEnvelope,
      type: 'heartbeat',
      payload: {},
    });
    assert.ok(result.success);
  });

  it('accepts valid custom envelope', () => {
    const result = envelopeSchema.safeParse({
      ...baseEnvelope,
      type: 'custom',
      payload: { name: 'deployment', value: { version: '1.0.0' } },
    });
    assert.ok(result.success);
  });

  it('accepts valid log envelope', () => {
    const result = envelopeSchema.safeParse({
      ...baseEnvelope,
      type: 'log',
      payload: { level: 'info', message: 'Server started' },
    });
    assert.ok(result.success);
  });

  it('rejects negative seq', () => {
    const result = envelopeSchema.safeParse({
      ...baseEnvelope,
      seq: -1,
    });
    assert.ok(!result.success);
  });

  it('rejects invalid type', () => {
    const result = envelopeSchema.safeParse({
      ...baseEnvelope,
      type: 'unknown',
    });
    assert.ok(!result.success);
  });

  it('rejects metrics with missing payload fields', () => {
    const result = envelopeSchema.safeParse({
      ...baseEnvelope,
      type: 'metrics',
      payload: { cpuPercent: 42 }, // missing other fields
    });
    assert.ok(!result.success);
  });

  it('rejects log with invalid level', () => {
    const result = envelopeSchema.safeParse({
      ...baseEnvelope,
      type: 'log',
      payload: { level: 'debug', message: 'test' },
    });
    assert.ok(!result.success);
  });
});

describe('ingestSchema', () => {
  it('accepts a batch of 1 event', () => {
    const result = ingestSchema.safeParse({
      events: [
        {
          eventId: 'e1',
          projectId: 'p1',
          serviceName: 'svc',
          instanceId: 'i1',
          seq: 0,
          ts: Date.now(),
          type: 'heartbeat',
          payload: {},
        },
      ],
    });
    assert.ok(result.success);
  });

  it('rejects empty events array', () => {
    const result = ingestSchema.safeParse({ events: [] });
    assert.ok(!result.success);
  });

  it('rejects when events is missing', () => {
    const result = ingestSchema.safeParse({});
    assert.ok(!result.success);
  });
});
