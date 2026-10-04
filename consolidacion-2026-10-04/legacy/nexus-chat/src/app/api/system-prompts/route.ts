import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/system-prompts - List all custom system prompts
export async function GET() {
  try {
    const prompts = await db.systemPrompt.findMany({
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
    return NextResponse.json({ prompts });
  } catch (error) {
    console.error('List system prompts error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system prompts' },
      { status: 500 }
    );
  }
}

// POST /api/system-prompts - Create a new custom system prompt
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, content, isDefault = false } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: 'title and content are required' },
        { status: 400 }
      );
    }

    // If this is set as default, unset any existing default
    if (isDefault) {
      await db.systemPrompt.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const prompt = await db.systemPrompt.create({
      data: { title, content, isDefault },
    });

    return NextResponse.json({ prompt });
  } catch (error) {
    console.error('Create system prompt error:', error);
    return NextResponse.json(
      { error: 'Failed to create system prompt' },
      { status: 500 }
    );
  }
}
