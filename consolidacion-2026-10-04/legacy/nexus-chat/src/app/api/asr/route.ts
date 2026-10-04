import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export const runtime = 'nodejs';
export const maxDuration = 60;

// POST /api/asr - Transcribe audio (base64)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { audioBase64, mimeType } = body as {
      audioBase64: string;
      mimeType?: string;
    };

    if (!audioBase64) {
      return NextResponse.json(
        { error: 'audioBase64 is required' },
        { status: 400 }
      );
    }

    // Strip data URL prefix if present
    const base64Data = audioBase64.replace(/^data:[^;]+;base64,/, '');

    const zai = await ZAI.create();

    const response = await zai.audio.asr.create({
      file_base64: base64Data,
    });

    const transcript = response.text || '';

    return NextResponse.json({
      success: true,
      transcript,
    });
  } catch (error) {
    console.error('ASR API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'ASR failed' },
      { status: 500 }
    );
  }
}
