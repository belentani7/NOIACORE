import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auditLog } from '@/lib/audit';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

// GET /api/cookie-consent - Obtener consentimiento actual
export async function GET(req: NextRequest) {
  try {
    // Buscar el consentimiento más reciente
    const consent = await db.cookieConsent.findFirst({
      orderBy: { lastUpdated: 'desc' },
    });
    return NextResponse.json({ consent });
  } catch (error) {
    console.error('Get cookie consent error:', error);
    return NextResponse.json(
      { error: 'Error al obtener consentimiento' },
      { status: 500 }
    );
  }
}

// POST /api/cookie-consent - Registrar consentimiento de cookies (RGPD art. 7)
export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(req);
    const rl = checkRateLimit(ip, 'default');
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Demasiadas peticiones' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter || 60) } }
      );
    }

    const body = await req.json();
    const { necessary = true, preferences, analytics, marketing, policyVersion = '1.0' } = body;

    // Las cookies necesarias (técnicas) siempre son true - no requieren consentimiento
    const consent = await db.cookieConsent.create({
      data: {
        necessary: true,
        preferences: Boolean(preferences),
        analytics: Boolean(analytics),
        marketing: Boolean(marketing),
        ipAddress: ip,
        userAgent: req.headers.get('user-agent') || null,
        policyVersion,
      },
    });

    // Auditoría - RGPD art. 7(1): demostrar consentimiento
    await auditLog({
      action: 'CONSENT_GRANT',
      resource: 'cookie_consent',
      resourceId: consent.id,
      req,
      metadata: {
        necessary: true,
        preferences: Boolean(preferences),
        analytics: Boolean(analytics),
        marketing: Boolean(marketing),
        policyVersion,
      },
    });

    return NextResponse.json({ consent, success: true });
  } catch (error) {
    console.error('Cookie consent error:', error);
    return NextResponse.json(
      { error: 'Error al registrar consentimiento' },
      { status: 500 }
    );
  }
}
