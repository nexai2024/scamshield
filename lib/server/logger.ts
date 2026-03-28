/**
 * Structured logging for API routes and server modules.
 * Logs one JSON line per event (works with Vercel / platform log drains).
 * Set LOG_LEVEL=debug|info|warn|error (default: info).
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_RANK: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const SENSITIVE_KEY = /(secret|token|password|apikey|api_key|authorization|cookie|bearer|sk_live|sk_test|private_key)/i;

function minConfiguredLevel(): number {
  const raw = (process.env.LOG_LEVEL || 'info').toLowerCase();
  if (raw === 'debug') return LEVEL_RANK.debug;
  if (raw === 'warn') return LEVEL_RANK.warn;
  if (raw === 'error') return LEVEL_RANK.error;
  return LEVEL_RANK.info;
}

export function serializeError(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    const base: Record<string, unknown> = {
      errName: err.name,
      errMessage: err.message,
    };
    if (process.env.NODE_ENV !== 'production' && err.stack) {
      base.errStack = err.stack;
    }
    return base;
  }
  return { errMessage: String(err) };
}

function sanitizeContext(ctx?: Record<string, unknown>, depth = 0): Record<string, unknown> | undefined {
  if (!ctx || depth > 6) return undefined;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(ctx)) {
    if (SENSITIVE_KEY.test(k)) {
      out[k] = '[REDACTED]';
      continue;
    }
    if (v === undefined) continue;
    if (v instanceof Error) {
      out[k] = serializeError(v);
      continue;
    }
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      out[k] = sanitizeContext(v as Record<string, unknown>, depth + 1);
      continue;
    }
    out[k] = v;
  }
  return Object.keys(out).length ? out : undefined;
}

function write(level: LogLevel, scope: string, message: string, context?: Record<string, unknown>) {
  if (LEVEL_RANK[level] < minConfiguredLevel()) return;

  const entry: Record<string, unknown> = {
    ts: new Date().toISOString(),
    level,
    scope,
    msg: message,
  };
  const sanitized = sanitizeContext(context);
  if (sanitized) entry.ctx = sanitized;

  const line = JSON.stringify(entry);
  switch (level) {
    case 'error':
      console.error(line);
      break;
    case 'warn':
      console.warn(line);
      break;
    default:
      console.log(line);
  }
}

export function createLogger(scope: string) {
  return {
    debug: (message: string, context?: Record<string, unknown>) => write('debug', scope, message, context),
    info: (message: string, context?: Record<string, unknown>) => write('info', scope, message, context),
    warn: (message: string, context?: Record<string, unknown>) => write('warn', scope, message, context),
    error: (message: string, context?: Record<string, unknown>) => write('error', scope, message, context),
  };
}
