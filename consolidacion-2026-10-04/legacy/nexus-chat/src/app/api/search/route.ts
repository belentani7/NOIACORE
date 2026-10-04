import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export const runtime = 'nodejs';
export const maxDuration = 30;

// GET /api/search?q=...&num=10
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const num = Math.min(parseInt(searchParams.get('num') || '8'), 20);

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      );
    }

    const zai = await ZAI.create();

    const results = await zai.functions.invoke('web_search', {
      query,
      num,
    });

    // Format results for display
    const formatted = (Array.isArray(results) ? results : []).map(
      (item: {
        url?: string;
        name?: string;
        snippet?: string;
        host_name?: string;
        date?: string;
      }) => ({
        url: item.url || '',
        title: item.name || '',
        snippet: item.snippet || '',
        domain: item.host_name || '',
        date: item.date || '',
      })
    );

    return NextResponse.json({
      success: true,
      query,
      results: formatted,
      count: formatted.length,
    });
  } catch (error) {
    console.error('Web search error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Search failed' },
      { status: 500 }
    );
  }
}

// POST /api/search - also accepts body for flexibility
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, num = 8 } = body as { query: string; num?: number };

    if (!query) {
      return NextResponse.json(
        { error: 'query is required' },
        { status: 400 }
      );
    }

    const zai = await ZAI.create();

    const results = await zai.functions.invoke('web_search', {
      query,
      num: Math.min(num, 20),
    });

    const formatted = (Array.isArray(results) ? results : []).map(
      (item: {
        url?: string;
        name?: string;
        snippet?: string;
        host_name?: string;
        date?: string;
      }) => ({
        url: item.url || '',
        title: item.name || '',
        snippet: item.snippet || '',
        domain: item.host_name || '',
        date: item.date || '',
      })
    );

    return NextResponse.json({
      success: true,
      query,
      results: formatted,
      count: formatted.length,
    });
  } catch (error) {
    console.error('Web search POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Search failed' },
      { status: 500 }
    );
  }
}
