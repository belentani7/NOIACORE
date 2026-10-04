import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

function parseTags(tags: unknown): string[] {
  if (Array.isArray(tags)) {
    return tags.filter((t) => typeof t === 'string').slice(0, 10);
  }
  return [];
}

// GET /api/conversations - List all conversations
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const archived = searchParams.get('archived') === 'true';
    const search = searchParams.get('search') || '';
    const tag = searchParams.get('tag') || '';

    const conversations = await db.conversation.findMany({
      where: {
        archived,
        ...(search ? { title: { contains: search } } : {}),
        ...(tag ? { tags: { contains: tag } } : {}),
      },
      orderBy: [{ pinned: 'desc' }, { updatedAt: 'desc' }],
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { content: true, role: true, createdAt: true },
        },
        _count: { select: { messages: true } },
      },
    });

    // Parse tags from JSON string to array
    const parsed = conversations.map((c) => ({
      ...c,
      tags: (() => {
        try {
          const parsed = JSON.parse(c.tags || '[]');
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      })(),
    }));

    return NextResponse.json({ conversations: parsed });
  } catch (error) {
    console.error('List conversations error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

// POST /api/conversations - Create new conversation
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, systemPrompt, model, temperature, tags } = body;

    const settings = await db.userSettings.findUnique({ where: { id: 'default' } });

    const conversation = await db.conversation.create({
      data: {
        title: title || 'New Conversation',
        systemPrompt: systemPrompt || settings?.systemPrompt || null,
        model: model || settings?.defaultModel || 'default',
        temperature: temperature ?? settings?.temperature ?? 0.7,
        tags: JSON.stringify(parseTags(tags)),
      },
    });

    return NextResponse.json({
      conversation: {
        ...conversation,
        tags: parseTags(conversation.tags),
      },
    });
  } catch (error) {
    console.error('Create conversation error:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}
