/**
 * Rate Limiting en memoria - Previene ataques de fuerza bruta y DDoS.
 * Cumple con OWASP API Security Top 10 (API4:2023 - Unrestricted Resource Consumption).
 *
 * Para producción, considerar Redis o similar para distribución entre instancias.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
  blocked: boolean;
}

const RATE_LIMIT_STORE = new Map<string, RateLimitEntry>();

interface RateLimitConfig {
  windowMs: number; // Ventana de tiempo (ms)
  maxRequests: number; // Máximo de peticiones por ventana
  blockDurationMs?: number; // Cuánto bloquear tras exceder (ms)
}

// Configuraciones por tipo de endpoint
export const RATE_LIMITS = {
  // Chat: 30 mensajes por minuto por IP (prevenir abuso LLM)
  chat: { windowMs: 60_000, maxRequests: 30, blockDurationMs: 60_000 },
  // Image generation: 10 por minuto (costoso)
  imageGen: { windowMs: 60_000, maxRequests: 10, blockDurationMs: 120_000 },
  // TTS: 20 por minuto
  tts: { windowMs: 60_000, maxRequests: 20, blockDurationMs: 60_000 },
  // ASR: 20 por minuto
  asr: { windowMs: 60_000, maxRequests: 20, blockDurationMs: 60_000 },
  // Web search: 30 por minuto
  search: { windowMs: 60_000, maxRequests: 30, blockDurationMs: 60_000 },
  // API general: 100 por minuto
  default: { windowMs: 60_000, maxRequests: 100, blockDurationMs: 30_000 },
  // Autenticación (cuando exista): 5 intentos por minuto
  auth: { windowMs: 60_000, maxRequests: 5, blockDurationMs: 300_000 },
} as const;

export type RateLimitType = keyof typeof RATE_LIMITS;

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number; // segundos hasta reset si bloqueado
}

/**
 * Verifica si una petición está dentro del límite permitido.
 * Debe llamarse al inicio de cada endpoint protegido.
 */
export function checkRateLimit(
  identifier: string,
  type: RateLimitType = 'default'
): RateLimitResult {
  const config = RATE_LIMITS[type];
  const now = Date.now();
  const key = `${type}:${identifier}`;

  const entry = RATE_LIMIT_STORE.get(key);

  // Sin entrada previa - permitir
  if (!entry) {
    RATE_LIMIT_STORE.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
      blocked: false,
    });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs,
    };
  }

  // Si estaba bloqueado, verificar si ya pasó el tiempo de bloqueo
  if (entry.blocked && config.blockDurationMs) {
    if (now < entry.resetTime) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
        retryAfter: Math.ceil((entry.resetTime - now) / 1000),
      };
    }
    // Bloqueo expirado - resetear
    RATE_LIMIT_STORE.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
      blocked: false,
    });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs,
    };
  }

  // Ventana expirada - resetear
  if (now >= entry.resetTime) {
    RATE_LIMIT_STORE.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
      blocked: false,
    });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs,
    };
  }

  // Incrementar contador
  entry.count++;

  // Verificar si excede el límite
  if (entry.count > config.maxRequests) {
    entry.blocked = true;
    if (config.blockDurationMs) {
      entry.resetTime = now + config.blockDurationMs;
    }
    RATE_LIMIT_STORE.set(key, entry);

    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter: Math.ceil((entry.resetTime - now) / 1000),
    };
  }

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Obtiene la IP del cliente desde la request para usar como identificador.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  const cfIp = req.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp.trim();
  return 'unknown';
}

/**
 * Limpia entradas expiradas del store para evitar memory leaks.
 * Debe llamarse periódicamente (ej: cada 5 minutos).
 */
export function cleanupRateLimitStore(): number {
  const now = Date.now();
  let cleaned = 0;
  for (const [key, entry] of RATE_LIMIT_STORE.entries()) {
    if (now >= entry.resetTime) {
      RATE_LIMIT_STORE.delete(key);
      cleaned++;
    }
  }
  return cleaned;
}

// Limpieza automática cada 5 minutos
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    cleanupRateLimitStore();
  }, 5 * 60 * 1000).unref?.();
}
