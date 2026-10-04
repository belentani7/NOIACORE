import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/stats - Get conversation and message statistics
export async function GET(req: NextRequest) {
  try {
    // Total conversations
    const totalConversations = await db.conversation.count({
      where: { archived: false },
    });

    const pinnedCount = await db.conversation.count({
      where: { archived: false, pinned: true },
    });

    // Total messages
    const totalMessages = await db.message.count();

    // Messages by role
    const userMessages = await db.message.count({ where: { role: 'user' } });
    const assistantMessages = await db.message.count({
      where: { role: 'assistant' },
    });

    // Messages by type
    const textMessages = await db.message.count({ where: { type: 'text' } });
    const visionMessages = await db.message.count({
      where: { type: 'vision' },
    });
    const searchMessages = await db.message.count({
      where: { type: 'search' },
    });
    const imageGenMessages = await db.message.count({
      where: { type: 'image-gen' },
    });

    // Reactions
    const positiveReactions = await db.message.count({
      where: { reaction: 'up' },
    });
    const negativeReactions = await db.message.count({
      where: { reaction: 'down' },
    });

    // Bookmarks
    const bookmarkedCount = await db.message.count({
      where: { bookmarked: true },
    });

    // Conversations with tags
    const conversationsWithTags = await db.conversation.findMany({
      where: { archived: false, tags: { not: '[]' } },
      select: { tags: true },
    });
    const tagCounts: Record<string, number> = {};
    conversationsWithTags.forEach((c) => {
      try {
        const tags = JSON.parse(c.tags);
        if (Array.isArray(tags)) {
          tags.forEach((t: string) => {
            tagCounts[t] = (tagCounts[t] || 0) + 1;
          });
        }
      } catch {
        // ignore
      }
    });

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentMessages = await db.message.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group by day
    const activityByDay: Array<{ date: string; count: number }> = [];
    const dayMap: Record<string, number> = {};
    recentMessages.forEach((m) => {
      const dayKey = m.createdAt.toISOString().split('T')[0];
      dayMap[dayKey] = (dayMap[dayKey] || 0) + 1;
    });
    Object.entries(dayMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([date, count]) => {
        activityByDay.push({ date, count });
      });

    // Total characters/tokens estimate
    const allMessages = await db.message.findMany({
      select: { content: true },
    });
    const totalCharacters = allMessages.reduce(
      (sum, m) => sum + (m.content?.length || 0),
      0
    );
    const estimatedTokens = Math.ceil(totalCharacters / 4);

    return NextResponse.json({
      conversations: {
        total: totalConversations,
        pinned: pinnedCount,
      },
      messages: {
        total: totalMessages,
        byRole: {
          user: userMessages,
          assistant: assistantMessages,
        },
        byType: {
          text: textMessages,
          vision: visionMessages,
          search: searchMessages,
          imageGen: imageGenMessages,
        },
      },
      reactions: {
        positive: positiveReactions,
        negative: negativeReactions,
      },
      bookmarks: bookmarkedCount,
      tags: tagCounts,
      activity: activityByDay,
      content: {
        totalCharacters,
        estimatedTokens,
      },
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
