import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auditLog } from '@/lib/audit';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

// GET /api/privacy/export - Exportar todos los datos del usuario (RGPD art. 20 - Portabilidad)
export async function GET(req: NextRequest) {
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

    // Recopilar TODOS los datos del usuario
    const [conversations, settings, bookmarks, systemPrompts, templates] =
      await Promise.all([
        db.conversation.findMany({
          where: { archived: false },
          include: { messages: true },
        }),
        db.userSettings.findUnique({ where: { id: 'default' } }),
        db.message.findMany({
          where: { bookmarked: true },
        }),
        db.systemPrompt.findMany(),
        db.promptTemplate.findMany(),
      ]);

    const exportData = {
      exportDate: new Date().toISOString(),
      exportedBy: 'RGPD art. 20 - Derecho a la portabilidad de los datos',
      jurisdiction: 'España - RGPD (UE) 2016/679, LOPDGDD',
      data: {
        conversations: conversations.map((c) => ({
          id: c.id,
          title: c.title,
          systemPrompt: c.systemPrompt,
          model: c.model,
          temperature: c.temperature,
          tags: (() => {
            try {
              return JSON.parse(c.tags);
            } catch {
              return [];
            }
          })(),
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
          messages: c.messages.map((m) => ({
            role: m.role,
            content: m.content,
            type: m.type,
            reaction: m.reaction,
            bookmarked: m.bookmarked,
            createdAt: m.createdAt,
          })),
        })),
        settings,
        bookmarks: bookmarks.map((b) => ({
          id: b.id,
          content: b.content,
          role: b.role,
          createdAt: b.createdAt,
          conversationId: b.conversationId,
        })),
        systemPrompts,
        templates,
      },
      summary: {
        totalConversations: conversations.length,
        totalMessages: conversations.reduce(
          (sum, c) => sum + c.messages.length,
          0
        ),
        totalBookmarks: bookmarks.length,
        totalSystemPrompts: systemPrompts.length,
        totalTemplates: templates.length,
      },
    };

    // Auditoría
    await auditLog({
      action: 'DATA_EXPORT',
      resource: 'user_data',
      req,
      metadata: {
        conversations: exportData.summary.totalConversations,
        messages: exportData.summary.totalMessages,
      },
    });

    return NextResponse.json(exportData);
  } catch (error) {
    console.error('Privacy export error:', error);
    return NextResponse.json(
      { error: 'Error al exportar datos' },
      { status: 500 }
    );
  }
}

// DELETE /api/privacy/delete - Derecho al olvido (RGPD art. 17)
export async function DELETE(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const confirm = searchParams.get('confirm');

    if (confirm !== 'DELETE_EVERYTHING') {
      return NextResponse.json(
        {
          error:
            'Confirmación requerida. Añade ?confirm=DELETE_EVERYTHING para confirmar el borrado completo.',
          warning:
            'Esta acción eliminará TODOS tus datos permanentemente y no se puede deshacer.',
        },
        { status: 400 }
      );
    }

    // Borrar TODOS los datos (ordenado por foreign keys)
    await db.message.deleteMany();
    await db.conversation.deleteMany();
    await db.systemPrompt.deleteMany();
    await db.generatedImage.deleteMany();
    await db.cookieConsent.deleteMany();
    // Reset settings to defaults
    await db.userSettings.upsert({
      where: { id: 'default' },
      update: {
        theme: 'system',
        systemPrompt:
          'You are Nexus AI, a helpful, knowledgeable and friendly AI assistant.',
        analyticsEnabled: false,
        marketingEnabled: false,
        consentDate: null,
        consentVersion: null,
      },
      create: { id: 'default' },
    });

    // Auditoría (antes de borrar logs, registrar esta acción crítica)
    await auditLog({
      action: 'DATA_DELETE',
      resource: 'user_data',
      req,
      metadata: {
        reason: 'RGPD art. 17 - Derecho de supresión (derecho al olvido)',
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      message:
        'Todos tus datos han sido eliminados permanentemente (RGPD art. 17 - Derecho al olvido).',
      deletedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Privacy delete error:', error);
    return NextResponse.json(
      { error: 'Error al eliminar datos' },
      { status: 500 }
    );
  }
}
