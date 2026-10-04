import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

export const runtime = 'nodejs';
export const maxDuration = 30;

// POST /api/conversations/[id]/generate-title - Generate title from first message
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const conversation = await db.conversation.findUnique({
      where: { id },
      include: {
        messages: {
          where: { role: 'user' },
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    if (
      conversation.title !== 'New Conversation' &&
      !conversation.title.startsWith('Conversation')
    ) {
      return NextResponse.json({ title: conversation.title, skipped: true });
    }

    const firstMessage = conversation.messages[0];
    if (!firstMessage) {
      return NextResponse.json({ title: conversation.title, skipped: true });
    }

    const zai = await ZAI.create();

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content:
            'You generate concise, descriptive titles (max 6 words) for chat conversations based on the user\'s first message. Respond with ONLY the title, no quotes, no punctuation at the end. Use the same language as the user\'s message.',
        },
        {
          role: 'user',
          content: firstMessage.content.substring(0, 500),
        },
      ],
      thinking: { type: 'disabled' },
      temperature: 0.3,
    });

    const title =
      completion.choices[0]?.message?.content?.trim().slice(0, 80) ||
      'New Conversation';

    await db.conversation.update({
      where: { id },
      data: { title },
    });

    return NextResponse.json({ title, skipped: false });
  } catch (error) {
    console.error('Generate title error:', error);
    return NextResponse.json(
      { error: 'Failed to generate title' },
      { status: 500 }
    );
  }
}
