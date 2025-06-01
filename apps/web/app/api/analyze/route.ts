import { NextRequest, NextResponse } from 'next/server';
import { startAnalysis } from '@/lib/analysis';

export async function POST(request: NextRequest) {
  try {
    const { projectPath, includeTests, analysisDepth } = await request.json();

    if (!projectPath) {
      return NextResponse.json({ error: 'Missing project path' }, { status: 400 });
    }

    const analysisId = await startAnalysis(projectPath, includeTests, analysisDepth);

    return NextResponse.json({ analysisId }, { status: 200 });
  } catch (error) {
    console.error('Error starting analysis:', error);
    return NextResponse.json({ error: 'Failed to start analysis' }, { status: 500 });
  }
}
