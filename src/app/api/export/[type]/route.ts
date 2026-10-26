// ==============================================================================
// AUDITMIND - CSV EXPORT API
// Produces RFC 4180 compliant CSV exports for controls, findings, audits, and gaps
// ==============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { dbRepository } from '@/lib/db/sqlite-store';
import { DEMO_ORG, seedDemoData } from '@/lib/demo-data';

function sanitizeCsvValue(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  seedDemoData(false);

  const orgId = DEMO_ORG.id;
  let csvContent = '';
  let filename = `auditmind_${type}_export.csv`;

  switch (type) {
    case 'controls': {
      const controls = dbRepository.getControls(orgId);
      const headers = ['Code', 'Name', 'Category', 'Control Type', 'Risk Level', 'Testing Frequency', 'Implementation Status', 'Latest Test Result', 'Owner', 'Last Tested Date', 'Next Due Date'];
      const rows = controls.map(c => [
        c.code,
        c.name,
        c.category,
        c.control_type,
        c.risk_level,
        c.testing_frequency,
        c.implementation_status,
        c.latest_test_result,
        c.owner,
        c.last_tested_date ? new Date(c.last_tested_date).toISOString().split('T')[0] : 'N/A',
        c.next_due_date ? new Date(c.next_due_date).toISOString().split('T')[0] : 'N/A',
      ]);
      csvContent = [headers.map(sanitizeCsvValue).join(','), ...rows.map(r => r.map(sanitizeCsvValue).join(','))].join('\n');
      filename = `controls_export_${Date.now()}.csv`;
      break;
    }

    case 'findings': {
      const findings = dbRepository.getFindings(orgId);
      const headers = ['Finding Code', 'Title', 'Severity', 'Risk Category', 'Assigned Owner', 'Discovered Date', 'Target Remediation Date', 'Remediation Status', 'Verification Status', 'Related Controls'];
      const rows = findings.map(f => [
        f.code,
        f.title,
        f.severity,
        f.risk_category,
        f.assigned_owner,
        f.date_discovered,
        f.target_remediation_date,
        f.remediation_status,
        f.verification_status,
        f.related_controls?.map(c => c.code).join('; ') || 'N/A',
      ]);
      csvContent = [headers.map(sanitizeCsvValue).join(','), ...rows.map(r => r.map(sanitizeCsvValue).join(','))].join('\n');
      filename = `findings_export_${Date.now()}.csv`;
      break;
    }

    case 'audits': {
      const audits = dbRepository.getAudits(orgId);
      const headers = ['Audit Code', 'Title', 'Type', 'Framework', 'Lead Auditor', 'Start Date', 'End Date', 'Status', 'Scoped Controls Count', 'Findings Count'];
      const rows = audits.map(a => [
        a.code,
        a.title,
        a.audit_type,
        a.framework,
        a.lead_auditor,
        a.start_date,
        a.end_date,
        a.status,
        a.scoped_controls_count,
        a.findings_count,
      ]);
      csvContent = [headers.map(sanitizeCsvValue).join(','), ...rows.map(r => r.map(sanitizeCsvValue).join(','))].join('\n');
      filename = `audits_export_${Date.now()}.csv`;
      break;
    }

    case 'gaps': {
      const gaps = dbRepository.getDetectedGaps(orgId, 'ACTIVE');
      const headers = ['Gap Type', 'Severity', 'Title', 'Explanation', 'Entity Type', 'Suggested Action', 'Status', 'Detected At'];
      const rows = gaps.map(g => [
        g.gap_type,
        g.severity,
        g.title,
        g.explanation,
        g.related_entity_type,
        g.suggested_action || '',
        g.status,
        g.detected_at,
      ]);
      csvContent = [headers.map(sanitizeCsvValue).join(','), ...rows.map(r => r.map(sanitizeCsvValue).join(','))].join('\n');
      filename = `compliance_gaps_${Date.now()}.csv`;
      break;
    }

    default:
      return NextResponse.json({ error: `Unsupported export type: ${type}` }, { status: 400 });
  }

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
