// ==============================================================================
// AUDITMIND - SCHEDULED COMPLIANCE MONITORING API
// Safe to invoke periodically (e.g., via Vercel Cron or external scheduler).
// Idempotent execution: prevents duplicate alerts and tracks job execution history.
// ==============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { runDeterministicComplianceChecks } from '@/lib/services/compliance-engine';
import { dbRepository } from '@/lib/db/sqlite-store';
import { seedDemoData, DEMO_ORG } from '@/lib/demo-data';

export async function POST(req: NextRequest) {
  return handleMonitoring(req);
}

export async function GET(req: NextRequest) {
  return handleMonitoring(req);
}

async function handleMonitoring(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET || 'auditmind-internal-cron-key-2026';

  // Verify cron secret if configured
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized scheduled job invocation.' }, { status: 401 });
  }

  try {
    // Ensure demo org exists
    seedDemoData(false);

    const orgs = dbRepository.getOrganizations();
    const targetOrgId = orgs.length > 0 ? orgs[0].id : DEMO_ORG.id;

    const startTime = Date.now();
    const result = runDeterministicComplianceChecks(targetOrgId);
    const durationMs = Date.now() - startTime;

    const summary = `Evaluated compliance conditions in ${durationMs}ms: ${result.gapsDetected} total active gaps (${result.newGapsCount} new), ${result.notificationsCreated} notifications created.`;

    dbRepository.logScheduledRun({
      org_id: targetOrgId,
      job_name: 'DAILY_COMPLIANCE_GAP_MONITOR',
      status: 'SUCCESS',
      summary,
      details: {
        durationMs,
        ...result,
      },
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      organizationId: targetOrgId,
      executionSummary: summary,
      metrics: result,
    });
  } catch (err: any) {
    console.error('Scheduled compliance monitor failure:', err);

    dbRepository.logScheduledRun({
      job_name: 'DAILY_COMPLIANCE_GAP_MONITOR',
      status: 'FAILED',
      summary: `Job failed: ${err.message}`,
      details: { error: err.stack },
    });

    return NextResponse.json(
      { success: false, error: err.message || 'Internal error during compliance check.' },
      { status: 500 }
    );
  }
}
