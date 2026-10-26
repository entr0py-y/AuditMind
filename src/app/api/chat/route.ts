// ==============================================================================
// AUDITMIND - AI COMPLIANCE ASSISTANT CHAT API
// ==============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { processAIComplianceQuery } from '@/lib/services/ai-service';
import { DEMO_ORG, seedDemoData } from '@/lib/demo-data';

export async function POST(req: NextRequest) {
  try {
    seedDemoData(false);
    const body = await req.json();
    const { query, orgId = DEMO_ORG.id, history = [] } = body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json({ error: 'Query parameter is required.' }, { status: 400 });
    }

    const response = await processAIComplianceQuery(query.trim(), orgId, history);
    return NextResponse.json(response);
  } catch (err: any) {
    console.error('Chat API Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to process compliance query.' }, { status: 500 });
  }
}
