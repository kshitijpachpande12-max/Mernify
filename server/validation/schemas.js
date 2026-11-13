const { z } = require('zod');

// ── Auth schemas ──────────────────────────────────────────────
const registerSchema = z.object({
  name:     z.string().min(1),
  email:    z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(6),
});

// ── Project schema ────────────────────────────────────────────
const projectSchema = z.object({
  name: z.string().min(1),
});

// ── Payload sub-schemas ───────────────────────────────────────
const metricsPayload = z.object({
  cpuPercent:      z.number(),
  memRssMB:        z.number(),
  heapUsedMB:      z.number(),
  eventLoopLagMs:  z.number(),
  uptimeSec:       z.number(),
});

const httpPayload = z.object({
  windowMs:    z.number(),
  requests:    z.number(),
  errors4xx:   z.number(),
  errors5xx:   z.number(),
  latencyP50:  z.number(),
  latencyP95:  z.number(),
  latencyP99:  z.number(),
  byRoute:     z.record(
    z.object({
      count:  z.number(),
      errors: z.number(),
      p95:    z.number(),
    })
  ),
});

const errorPayload = z.object({
  message:   z.string(),
  stackHash: z.string(),
  route:     z.string().optional(),
  count:     z.number().optional(),
  stack:     z.string().optional(),
});

const heartbeatPayload = z.object({});

const customPayload = z.object({
  name:  z.string(),
  value: z.any(),
});

const logPayload = z.object({
  level:   z.enum(['info', 'warn', 'error']),
  message: z.string(),
});

// ── Envelope schema ───────────────────────────────────────────
const envelopeSchema = z
  .object({
    eventId:     z.string(),
    projectId:   z.string(),
    serviceName: z.string(),
    instanceId:  z.string(),
    seq:         z.number().int().nonnegative(),
    ts:          z.number().positive(),
    type:        z.enum(['metrics', 'http', 'error', 'heartbeat', 'custom', 'log']),
    payload:     z.object({}).passthrough(),
  })
  .superRefine((data, ctx) => {
    let result;
    switch (data.type) {
      case 'metrics':
        result = metricsPayload.safeParse(data.payload);
        break;
      case 'http':
        result = httpPayload.safeParse(data.payload);
        break;
      case 'error':
        result = errorPayload.safeParse(data.payload);
        break;
      case 'heartbeat':
        result = heartbeatPayload.safeParse(data.payload);
        break;
      case 'custom':
        result = customPayload.safeParse(data.payload);
        break;
      case 'log':
        result = logPayload.safeParse(data.payload);
        break;
      default:
        return;
    }
    if (result && !result.success) {
      for (const issue of result.error.issues) {
        ctx.addIssue({
          ...issue,
          path: ['payload', ...issue.path],
        });
      }
    }
  });

// ── Ingest schema ─────────────────────────────────────────────
const ingestSchema = z.object({
  events: z.array(envelopeSchema).min(1).max(5000),
});

module.exports = {
  registerSchema,
  loginSchema,
  projectSchema,
  envelopeSchema,
  ingestSchema,
};
