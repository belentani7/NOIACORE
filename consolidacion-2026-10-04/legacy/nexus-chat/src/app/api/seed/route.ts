import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const DEFAULT_TEMPLATES = [
  {
    title: 'Code Reviewer',
    description: 'Get expert feedback on your code',
    content:
      'You are an expert code reviewer. Analyze the following code for:\n1. Bugs and potential issues\n2. Performance improvements\n3. Best practices\n4. Readability\n\nProvide specific, actionable suggestions with code examples. Be constructive.',
    category: 'development',
    icon: 'code',
  },
  {
    title: 'Explain Like I\'m 5',
    description: 'Simple explanations for complex topics',
    content:
      'Explain the following topic as if you were talking to a 5-year-old child. Use simple words, fun analogies, and avoid jargon. Keep it short and engaging.',
    category: 'learning',
    icon: 'graduation-cap',
  },
  {
    title: 'Professional Translator',
    description: 'Translate text accurately preserving nuance',
    content:
      'You are a professional translator. Translate the following text. Preserve the original tone, style, and cultural nuances. If there are idioms, find equivalent expressions in the target language.',
    category: 'writing',
    icon: 'languages',
  },
  {
    title: 'Creative Story Writer',
    description: 'Generate engaging stories and narratives',
    content:
      'You are a creative fiction writer. Write an engaging story based on the user\'s prompt. Include vivid descriptions, interesting characters, and a compelling plot. Use narrative techniques like show-don\'t-tell.',
    category: 'writing',
    icon: 'pen-tool',
  },
  {
    title: 'SQL Query Helper',
    description: 'Write and optimize SQL queries',
    content:
      'You are a SQL expert. Help write, optimize, and debug SQL queries. Explain your reasoning, suggest indexes, and provide alternative approaches. Always format SQL with proper indentation.',
    category: 'development',
    icon: 'database',
  },
  {
    title: 'Email Composer',
    description: 'Draft professional emails for any occasion',
    content:
      'You are a professional email writer. Compose clear, concise, and polite emails. Match the appropriate tone (formal, casual, apologetic, persuasive) based on the context. Include a subject line suggestion.',
    category: 'writing',
    icon: 'mail',
  },
  {
    title: 'Brainstorming Partner',
    description: 'Generate ideas and creative solutions',
    content:
      'You are a creative brainstorming partner. Help generate diverse, innovative ideas for the user\'s challenge. Provide both practical and out-of-the-box suggestions. Group ideas by theme.',
    category: 'creative',
    icon: 'lightbulb',
  },
  {
    title: 'Data Analyst',
    description: 'Analyze data and extract insights',
    content:
      'You are a data analyst. Help analyze the provided data, identify trends, patterns, and anomalies. Provide clear insights and actionable recommendations. Suggest visualizations when appropriate.',
    category: 'analysis',
    icon: 'bar-chart',
  },
  {
    title: 'Travel Planner',
    description: 'Plan the perfect trip itinerary',
    content:
      'You are an expert travel planner. Create detailed, personalized itineraries. Include must-see attractions, local food recommendations, transportation tips, and hidden gems. Consider the traveler\'s budget and preferences.',
    category: 'lifestyle',
    icon: 'plane',
  },
  {
    title: 'Recipe Creator',
    description: 'Generate recipes from available ingredients',
    content:
      'You are a creative chef. Suggest delicious recipes based on the available ingredients. Include prep time, cooking instructions, and tips for variations. Consider dietary restrictions if mentioned.',
    category: 'lifestyle',
    icon: 'chef-hat',
  },
  {
    title: 'Math Tutor',
    description: 'Step-by-step math problem solver',
    content:
      'You are a patient math tutor. Solve math problems step by step, explaining each step clearly. Use LaTeX notation for formulas when helpful. Verify your final answer.',
    category: 'learning',
    icon: 'calculator',
  },
  {
    title: 'Resume Optimizer',
    description: 'Improve your resume for ATS systems',
    content:
      'You are a resume expert and ATS optimization specialist. Review the provided resume and suggest improvements for:\n1. ATS compatibility (keywords, formatting)\n2. Impact statements (quantify achievements)\n3. Skills highlighting\n4. Overall structure\n\nProvide specific rewrites where needed.',
    category: 'career',
    icon: 'briefcase',
  },
];

// POST /api/seed - Seed initial data (templates + default settings)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { force = false } = body as { force?: boolean };

    // Seed default settings
    const existingSettings = await db.userSettings.findUnique({
      where: { id: 'default' },
    });
    if (!existingSettings) {
      await db.userSettings.create({ data: { id: 'default' } });
    }

    // Seed templates
    const existingTemplates = await db.promptTemplate.count();
    let createdCount = 0;

    if (existingTemplates === 0 || force) {
      if (force && existingTemplates > 0) {
        await db.promptTemplate.deleteMany({});
      }
      await db.promptTemplate.createMany({
        data: DEFAULT_TEMPLATES.map((t) => ({
          ...t,
          icon: t.icon || null,
          description: t.description || '',
        })),
      });
      createdCount = DEFAULT_TEMPLATES.length;
    }

    return NextResponse.json({
      success: true,
      settingsCreated: !existingSettings,
      templatesCreated: createdCount,
      totalTemplates: await db.promptTemplate.count(),
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { error: 'Failed to seed data' },
      { status: 500 }
    );
  }
}
