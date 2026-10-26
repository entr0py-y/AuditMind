// ==============================================================================
// AUDITMIND - PERSISTENT ORGANIZATIONAL AUDIT MEMORY SYSTEM
// Traverses historical records, test timelines, cross-audit finding recurrences,
// remediation attempts, and verification provenance.
// ==============================================================================

import { dbRepository } from '../db/sqlite-store';
import { ControlTest, Finding, Control, Audit } from '@/types';

export interface ControlAuditMemory {
  control: Control;
  testHistory: ControlTest[];
  testsCount: number;
  passCount: number;
  failCount: number;
  latestTest?: ControlTest;
  associatedFindings: Finding[];
  hasUnverifiedRemediation: boolean;
  unverifiedFindings: Finding[];
  isRecurringIssue: boolean;
  historicalAuditsInvolved: { auditId: string; auditCode: string; auditTitle: string; testResult: string }[];
  summaryAnalysis: string;
}

export interface RecurringIssueCluster {
  controlId: string;
  controlCode: string;
  controlName: string;
  findings: Finding[];
  auditsInvolved: { id: string; code: string; title: string }[];
  totalFindingsCount: number;
  unresolvedCount: number;
  rootCauses: string[];
}

export const auditMemoryService = {
  // Deep memory inspection for a specific control
  getControlMemory(controlId: string): ControlAuditMemory | null {
    const control = dbRepository.getControlById(controlId);
    if (!control) return null;

    const testHistory = dbRepository.getControlTests(controlId);
    const passCount = testHistory.filter(t => t.result === 'PASS').length;
    const failCount = testHistory.filter(t => t.result === 'FAIL').length;
    const latestTest = testHistory.length > 0 ? testHistory[0] : undefined;

    // Get all findings associated with this control across all historical audits
    const allOrgFindings = dbRepository.getFindings(control.org_id);
    const associatedFindings = allOrgFindings.filter(f =>
      f.related_controls?.some(c => c.id === controlId)
    );

    const unverifiedFindings = associatedFindings.filter(
      f => (f.remediation_status === 'RESOLVED' || f.remediation_status === 'PENDING_VERIFICATION') &&
           f.verification_status !== 'VERIFIED'
    );

    const hasUnverifiedRemediation = unverifiedFindings.length > 0;

    // Check distinct audits involved
    const auditsMap = new Map<string, { auditId: string; auditCode: string; auditTitle: string; testResult: string }>();
    for (const t of testHistory) {
      if (t.audit_id && !auditsMap.has(t.audit_id)) {
        auditsMap.set(t.audit_id, {
          auditId: t.audit_id,
          auditCode: t.control_code || 'AUDIT',
          auditTitle: t.audit_title || 'Audit Engagement',
          testResult: t.result,
        });
      }
    }

    const isRecurringIssue = associatedFindings.length >= 2 || failCount >= 2;

    // Synthesize structured human-readable memory analysis
    let summary = `Control ${control.code} has ${testHistory.length} recorded historical test(s). `;
    if (failCount > 0) {
      summary += `It has experienced ${failCount} recorded failure(s). `;
    } else if (testHistory.length > 0) {
      summary += `All recorded tests have been effective. `;
    } else {
      summary += `No baseline test has ever been recorded. `;
    }

    if (hasUnverifiedRemediation) {
      summary += `CRITICAL NOTE: Finding ${unverifiedFindings.map(f => f.code).join(', ')} was marked resolved by the owner, but no subsequent verification test or auditor sign-off is on file. `;
    }

    if (isRecurringIssue) {
      summary += `RECURRING ALERT: Multiple findings have been lodged against this control across separate audits. `;
    }

    return {
      control,
      testHistory,
      testsCount: testHistory.length,
      passCount,
      failCount,
      latestTest,
      associatedFindings,
      hasUnverifiedRemediation,
      unverifiedFindings,
      isRecurringIssue,
      historicalAuditsInvolved: Array.from(auditsMap.values()),
      summaryAnalysis: summary.trim(),
    };
  },

  // Discover all recurring issues across the organization's entire history
  getRecurringIssues(orgId: string): RecurringIssueCluster[] {
    const controls = dbRepository.getControls(orgId);
    const findings = dbRepository.getFindings(orgId);
    const audits = dbRepository.getAudits(orgId);
    const auditMap = new Map(audits.map(a => [a.id, a]));

    const clusters: RecurringIssueCluster[] = [];

    for (const ctrl of controls) {
      const ctrlFindings = findings.filter(f => f.related_controls?.some(c => c.id === ctrl.id));
      if (ctrlFindings.length >= 2) {
        const auditIds = Array.from(new Set(ctrlFindings.map(f => f.audit_id).filter(Boolean))) as string[];
        const auditsInvolved = auditIds.map(aid => {
          const a = auditMap.get(aid);
          return { id: aid, code: a?.code || aid, title: a?.title || 'Audit' };
        });

        const unresolvedCount = ctrlFindings.filter(f => f.remediation_status !== 'RESOLVED' && f.remediation_status !== 'ACCEPTED_EXCEPTION').length;
        const rootCauses = Array.from(new Set(ctrlFindings.map(f => f.root_cause).filter(Boolean))) as string[];

        clusters.push({
          controlId: ctrl.id,
          controlCode: ctrl.code,
          controlName: ctrl.name,
          findings: ctrlFindings,
          auditsInvolved,
          totalFindingsCount: ctrlFindings.length,
          unresolvedCount,
          rootCauses,
        });
      }
    }

    return clusters;
  },

  // Query audit history memory for AI Assistant retrieval
  searchAuditMemory(orgId: string, query: string) {
    const q = query.toLowerCase();
    const controls = dbRepository.getControls(orgId);
    const findings = dbRepository.getFindings(orgId);
    const audits = dbRepository.getAudits(orgId);
    const tests = dbRepository.getAllTests(orgId);
    const evidence = dbRepository.getEvidenceFiles(orgId);

    const matchedControls = controls.filter(c =>
      c.code.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q)
    );

    const matchedFindings = findings.filter(f =>
      f.code.toLowerCase().includes(q) ||
      f.title.toLowerCase().includes(q) ||
      f.description.toLowerCase().includes(q) ||
      (f.root_cause && f.root_cause.toLowerCase().includes(q))
    );

    const matchedAudits = audits.filter(a =>
      a.code.toLowerCase().includes(q) ||
      a.title.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q)
    );

    const matchedTests = tests.filter(t =>
      t.test_procedure.toLowerCase().includes(q) ||
      t.conclusion.toLowerCase().includes(q) ||
      (t.exceptions && t.exceptions.toLowerCase().includes(q))
    );

    const matchedEvidence = evidence.filter(e =>
      e.code.toLowerCase().includes(q) ||
      e.title.toLowerCase().includes(q) ||
      (e.extracted_text && e.extracted_text.toLowerCase().includes(q))
    );

    return {
      matchedControls,
      matchedFindings,
      matchedAudits,
      matchedTests,
      matchedEvidence,
    };
  },
};
