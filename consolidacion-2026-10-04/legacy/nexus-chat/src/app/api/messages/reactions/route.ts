import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/messages/reactions - Get all messages with reactions (up or down)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || ''; // 'up', 'down', or '' for both
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    const where = type
      ? { reaction: type }
      : { reaction: { not: null } };

    const messages = await db.message.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        conversation: {
          select: {
            id: true,
            title: true,
            archived: true,
          },
        },
      },
    });

    // Filter out messages from archived conversations
    const filtered = messages.filter((m) => !m.conversation?.archived);

    const results = filtered.map((m) => ({
      id: m.id,
      content: m.content,
      role: m.role,
      type: m.type,
      reaction: m.reaction,
      createdAt: m.createdAt,
      conversationId: m.conversationId,
      conversationTitle: m.conversation?.title || 'Untitled',
      bookmarked: m.bookmarked,
    }));

    return NextResponse.json({
      results,
      count: results.length,
      positiveCount: results.filter((r) => r.reaction === 'up').length,
      negativeCount: results.filter((r) => r.reaction === 'down').length,
    });
  } catch (error) {
    console.error('Get reactions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reactions' },
      { status: 500 }
    );
  }
}
