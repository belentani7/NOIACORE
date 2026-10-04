import { NextRequest, NextResponse } from 'next/server';
import { getAuditLogs, cleanupOldAuditLogs } from '@/lib/audit';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

// GET /api/audit - Obtener logs de auditoría (panel admin)
export async function GET(req: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(req);
    const rl = checkRateLimit(ip, 'default');
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Demasiadas peticiones', retryAfter: rl.retryAfter },
        {
          status: 429,
          headers: {
            'Retry-After': String(rl.retryAfter || 60),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(rl.resetTime),
          },
        }
      );
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);
    const offset = parseInt(searchParams.get('offset') || '0');
    const action = searchParams.get('action') || undefined;
    const resource = searchParams.get('resource') || undefined;
    const userId = searchParams.get('userId') || undefined;

    const { logs, total } = await getAuditLogs(limit, offset, {
      action,
      resource,
      userId,
    });

    return NextResponse.json({
      logs,
      total,
      limit,
      offset,
      hasMore: offset + logs.length < total,
    });
  } catch (error) {
    console.error('Audit logs error:', error);
    return NextResponse.json(
      { error: 'Error al obtener logs de auditoría' },
      { status: 500 }
    );
  }
}

// POST /api/audit/cleanup - Limpiar logs antiguos (tarea programada)
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const retentionDays = parseInt(
      searchParams.get('retentionDays') || '365'
    );

    const deletedCount = await cleanupOldAuditLogs(retentionDays);

    return NextResponse.json({
      success: true,
      deletedCount,
      retentionDays,
      message: `Eliminados ${deletedCount} logs con más de ${retentionDays} días`,
    });
  } catch (error) {
    console.error('Audit cleanup error:', error);
    return NextResponse.json(
      { error: 'Error al limpiar logs' },
      { status: 500 }
    );
  }
}
