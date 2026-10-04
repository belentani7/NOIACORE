import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/settings - Get user settings (singleton)
export async function GET() {
  try {
    let settings = await db.userSettings.findUnique({ where: { id: 'default' } });
    if (!settings) {
      settings = await db.userSettings.create({
        data: { id: 'default' },
      });
    }
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// PATCH /api/settings - Update settings
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const allowedFields = [
      'theme',
      'defaultModel',
      'temperature',
      'systemPrompt',
      'ttsVoice',
      'ttsSpeed',
      'ttsEnabled',
      'streamingEnabled',
      'maxHistoryMessages',
    ];

    const data: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        data[field] = body[field];
      }
    }

    const settings = await db.userSettings.upsert({
      where: { id: 'default' },
      update: data,
      create: { id: 'default', ...data },
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
