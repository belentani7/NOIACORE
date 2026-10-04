import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/conversations/import - Import a conversation from JSON
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { conversation: importData } = body;

    if (!importData || !importData.title || !Array.isArray(importData.messages)) {
      return NextResponse.json(
        { error: 'Invalid import format. Expected { conversation: { title, messages, ... } }' },
        { status: 400 }
      );
    }

    // Get default settings
    const settings = await db.userSettings.findUnique({ where: { id: 'default' } });

    // Create the conversation
    const conversation = await db.conversation.create({
      data: {
        title: importData.title || 'Imported Conversation',
        systemPrompt: importData.systemPrompt || settings?.systemPrompt || null,
        model: importData.model || settings?.defaultModel || 'default',
        temperature: importData.temperature ?? settings?.temperature ?? 0.7,
        tags: JSON.stringify(importData.tags || []),
      },
    });

    // Create all messages
    for (const msg of importData.messages) {
      await db.message.create({
        data: {
          conversationId: conversation.id,
          role: msg.role || 'user',
          content: msg.content || '',
          type: msg.type || 'text',
          metadata: msg.metadata ? JSON.stringify(msg.metadata) : null,
          reaction: msg.reaction || null,
          bookmarked: msg.bookmarked || false,
        },
      });
    }

    return NextResponse.json({
      success: true,
      conversationId: conversation.id,
      messageCount: importData.messages.length,
    });
  } catch (error) {
    console.error('Import conversation error:', error);
    return NextResponse.json(
      { error: 'Failed to import conversation' },
      { status: 500 }
    );
  }
}
