import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export const runtime = 'nodejs';
export const maxDuration = 60;

// POST /api/vision - Analyze image(s) with text prompt
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, images, conversationHistory } = body as {
      prompt: string;
      images: { url: string; name?: string }[];
      conversationHistory?: { role: string; content: string }[];
    };

    if (!prompt || !images || images.length === 0) {
      return NextResponse.json(
        { error: 'prompt and images are required' },
        { status: 400 }
      );
    }

    const zai = await ZAI.create();

    // Build content array for vision API
    const content: Array<
      | { type: 'text'; text: string }
      | { type: 'image_url'; image_url: { url: string } }
    > = [{ type: 'text', text: prompt }];

    for (const img of images) {
      content.push({
        type: 'image_url',
        image_url: { url: img.url },
      });
    }

    // Build messages including conversation history if provided
    const messages: Array<Record<string, unknown>> = [];
    if (conversationHistory && conversationHistory.length > 0) {
      for (const msg of conversationHistory) {
        messages.push({
          role: msg.role === 'system' ? 'assistant' : msg.role,
          content: msg.content,
        });
      }
    }
    messages.push({ role: 'user', content });

    const response = await zai.chat.completions.createVision({
      messages: messages as never,
      thinking: { type: 'disabled' },
    });

    const result = response.choices[0]?.message?.content || '';

    return NextResponse.json({
      success: true,
      analysis: result,
      imagesAnalyzed: images.length,
    });
  } catch (error) {
    console.error('Vision API error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Vision analysis failed',
      },
      { status: 500 }
    );
  }
}
