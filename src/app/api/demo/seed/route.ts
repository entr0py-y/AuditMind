// ==============================================================================
// AUDITMIND - DEMO DATA ONBOARDING & RESET API
// ==============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { seedDemoData, DEMO_ORG } from '@/lib/demo-data';
import { runDeterministicComplianceChecks } from '@/lib/services/compliance-engine';

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const force = url.searchParams.get('force') === 'true';

    seedDemoData(force);
    const gapResults = runDeterministicComplianceChecks(DEMO_ORG.id);

    return NextResponse.json({
      success: true,
      message: force ? 'Demonstration data successfully reset.' : 'Demonstration data loaded.',
      organization: DEMO_ORG,
      complianceChecks: gapResults,
    });
  } catch (err: any) {
    console.error('Demo seed error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
