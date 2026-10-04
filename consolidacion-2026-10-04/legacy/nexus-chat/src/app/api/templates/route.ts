import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/templates - List all templates
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');

    const templates = await db.promptTemplate.findMany({
      where: category ? { category } : {},
      orderBy: [{ category: 'asc' }, { title: 'asc' }],
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('List templates error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

// POST /api/templates - Create new template
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, content, category = 'general', icon } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: 'title and content are required' },
        { status: 400 }
      );
    }

    const template = await db.promptTemplate.create({
      data: { title, description, content, category, icon },
    });

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Create template error:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}
