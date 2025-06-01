import { NextRequest, NextResponse } from 'next/server';
import { AIManager } from '../../../../lib/ai/ai-manager';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, language } = body;

    if (!code || !language) {
      return NextResponse.json({ error: 'Code and language are required' }, { status: 400 });
    }

    const aiManager = new AIManager();
    const explanation = await aiManager.explainCode(code, language);

    return NextResponse.json({ explanation });
  } catch (error) {
    console.error('Error in AI explain route:', error);
    // Check if error is an instance of Error
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ error: 'Failed to get explanation', details: errorMessage }, { status: 500 });
  }
}
