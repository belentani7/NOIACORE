import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/search-messages?q=...&limit=20
// Full-text search across all message content
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const limit = Math.min(parseInt(searchParams.get('limit') || '30'), 50);

    if (!query.trim()) {
      return NextResponse.json({ results: [], count: 0 });
    }

    // Search message content (case-insensitive contains)
    const messages = await db.message.findMany({
      where: {
        content: {
          contains: query,
        },
      },
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

    // Format results with context snippet
    const results = filtered.map((m) => {
      const content = m.content || '';
      const lowerContent = content.toLowerCase();
      const lowerQuery = query.toLowerCase();
      const matchIndex = lowerContent.indexOf(lowerQuery);

      // Build a snippet around the match
      let snippet = content;
      if (matchIndex >= 0) {
        const start = Math.max(0, matchIndex - 60);
        const end = Math.min(content.length, matchIndex + query.length + 60);
        snippet =
          (start > 0 ? '…' : '') +
          content.slice(start, end) +
          (end < content.length ? '…' : '');
      } else {
        // Truncate if no direct match found (shouldn't happen with contains)
        snippet = content.slice(0, 120) + (content.length > 120 ? '…' : '');
      }

      return {
        id: m.id,
        content: m.content,
        snippet,
        role: m.role,
        type: m.type,
        createdAt: m.createdAt,
        conversationId: m.conversationId,
        conversationTitle: m.conversation?.title || 'Untitled',
        bookmarked: m.bookmarked,
        reaction: m.reaction,
      };
    });

    return NextResponse.json({
      results,
      count: results.length,
      query,
    });
  } catch (error) {
    console.error('Search messages error:', error);
    return NextResponse.json(
      { error: 'Failed to search messages' },
      { status: 500 }
    );
  }
}
