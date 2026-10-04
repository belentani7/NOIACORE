import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const maxDuration = 120;

const SUPPORTED_SIZES = [
  '1024x1024',
  '768x1344',
  '864x1152',
  '1344x768',
  '1152x864',
  '1440x720',
  '720x1440',
];

// POST /api/image-gen - Generate image from prompt
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      prompt,
      size = '1024x1024',
      conversationId,
      save = true,
    } = body as {
      prompt: string;
      size?: string;
      conversationId?: string;
      save?: boolean;
    };

    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'prompt is required' },
        { status: 400 }
      );
    }

    if (!SUPPORTED_SIZES.includes(size)) {
      return NextResponse.json(
        {
          error: `Unsupported size. Use one of: ${SUPPORTED_SIZES.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const zai = await ZAI.create();

    const response = await zai.images.generations.create({
      prompt: prompt.trim(),
      size,
    });

    const imageBase64 = response.data[0]?.base64;
    if (!imageBase64) {
      return NextResponse.json(
        { error: 'No image data returned' },
        { status: 500 }
      );
    }

    // Optionally save to database
    let imageId: string | undefined;
    if (save) {
      const saved = await db.generatedImage.create({
        data: {
          prompt: prompt.trim(),
          base64: imageBase64,
          size,
          conversationId: conversationId || null,
        },
      });
      imageId = saved.id;
    }

    return NextResponse.json({
      success: true,
      imageId,
      imageUrl: `data:image/png;base64,${imageBase64}`,
      prompt: prompt.trim(),
      size,
    });
  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Image generation failed',
      },
      { status: 500 }
    );
  }
}
