import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

/**
 * Sistema de auditoría - Cumple con RGPD art. 30, LOPDGDD art. 31, ENS CCN-STIC 804
 * Registra TODAS las acciones que afectan a datos personales para trazabilidad.
 */

export type AuditAction =
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
  | 'EXPORT'
  | 'IMPORT'
  | 'LOGIN'
  | 'LOGOUT'
  | 'CONSENT_GRANT'
  | 'CONSENT_REVOKE'
  | 'DATA_EXPORT'
  | 'DATA_DELETE';

export type AuditResource =
  | 'conversation'
  | 'message'
  | 'settings'
  | 'bookmark'
  | 'tag'
  | 'reaction'
  | 'system_prompt'
  | 'template'
  | 'cookie_consent'
  | 'user_data';

interface AuditEntry {
  action: AuditAction;
  resource: AuditResource;
  resourceId?: string;
  userId?: string;
  req?: NextRequest;
  metadata?: Record<string, unknown>;
}

/**
 * Registra un evento de auditoría en la base de datos.
 * No lanza errores para no interrumpir el flujo principal (fail-safe).
 */
export async function auditLog(entry: AuditEntry): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        action: entry.action,
        resource: entry.resource,
        resourceId: entry.resourceId || null,
        userId: entry.userId || 'anonymous',
        ipAddress: extractIpAddress(entry.req) || null,
        userAgent: entry.req?.headers.get('user-agent') || null,
        metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
      },
    });
  } catch (error) {
    // Fail-safe: registrar error en consola pero no interrumpir operación
    console.error('Audit log failed:', error);
  }
}

/**
 * Extrae la IP real del cliente, considerando proxies y load balancers.
 */
function extractIpAddress(req?: NextRequest): string | null {
  if (!req) return null;
  // X-Forwarded-For (proxy estándar)
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  // X-Real-IP (nginx)
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  // CF-Connecting-IP (Cloudflare)
  const cfIp = req.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp.trim();
  return null;
}

/**
 * Obtiene eventos de auditoría paginados (para panel de administrador).
 */
export async function getAuditLogs(
  limit = 100,
  offset = 0,
  filters?: { action?: string; resource?: string; userId?: string }
) {
  const where = {
    ...(filters?.action ? { action: filters.action } : {}),
    ...(filters?.resource ? { resource: filters.resource } : {}),
    ...(filters?.userId ? { userId: filters.userId } : {}),
  };

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
    }),
    db.auditLog.count({ where }),
  ]);

  return { logs, total };
}

/**
 * Limpia logs de auditoría antiguos según política de retención.
 * Cumple con RGPD art. 5(1)(e) - limitación de conservación.
 */
export async function cleanupOldAuditLogs(retentionDays = 365): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - retentionDays);

  const result = await db.auditLog.deleteMany({
    where: { timestamp: { lt: cutoff } },
  });

  return result.count;
}
