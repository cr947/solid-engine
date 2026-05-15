import { NextResponse } from 'next/server';
import { runAgentLoop } from '@/lib/agent';

export async function POST() {
  try {
    const result = await runAgentLoop();
    return NextResponse.json({ success: true, picksGenerated: result.picksSaved });
  } catch (error) {
    console.error('POST /api/agent error:', error);
    return NextResponse.json({ success: false, error: 'Unable to run agent' }, { status: 500 });
  }
}
