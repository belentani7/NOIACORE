import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/messages - Create a new message
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { conversationId, role, content, type = 'text', metadata } = body;

    if (!conversationId || !role || !content) {
      return NextResponse.json(
        { error: 'conversationId, role, and content are required' },
        { status: 400 }
      );
    }

    const message = await db.message.create({
      data: {
        conversationId,
        role,
        content,
        type,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });

    // Update conversation's updatedAt
    await db.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ message });
  } catch (error) {
    console.error('Create message error:', error);
    return NextResponse.json(
      { error: 'Failed to create message' },
      { status: 500 }
    );
  }
}

// PATCH /api/messages - Update a message (e.g., for editing, reactions, bookmarks)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, content, metadata, reaction, bookmarked } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const message = await db.message.update({
      where: { id },
      data: {
        ...(content !== undefined && { content }),
        ...(metadata !== undefined && { metadata: JSON.stringify(metadata) }),
        ...(reaction !== undefined && { reaction }),
        ...(bookmarked !== undefined && { bookmarked }),
      },
    });

    return NextResponse.json({ message });
  } catch (error) {
    console.error('Update message error:', error);
    return NextResponse.json(
      { error: 'Failed to update message' },
      { status: 500 }
    );
  }
}
