// ==============================================================================
// AUDITMIND - DETERMINISTIC COMPLIANCE CALCULATION & GAP DETECTION ENGINE
// Evaluates rules in strict deterministic application code (never hallucinated):
// - Overdue control testing
// - Controls lacking test history
// - Missing required evidence
// - Unverified remediations (finding marked resolved without verified evidence/test)
// - Overdue remediation deadlines
// - Recurring findings across multiple audits
// - Stale policy reviews
// - Unreviewed policy change impacts
// - Unreviewed test results
// ==============================================================================

import { dbRepository } from '../db/sqlite-store';
import { Control, Finding, DetectedGap, TestingFrequency } from '@/types';

export interface ComplianceRunResult {
  gapsDetected: number;
  newGapsCount: number;
  notificationsCreated: number;
  details: {
    overdueTesting: number;
    noTestHistory: number;
    missingEvidence: number;
    unverifiedRemediation: number;
    overdueRemediation: number;
    recurringFindings: number;
    stalePolicies: number;
    unreviewedChanges: number;
  };
}

export function calculateNextDueDate(lastTestedDate: string | null | undefined, frequency: TestingFrequency): string {
  const baseDate = lastTestedDate ? new Date(lastTestedDate) : new Date();
  const next = new Date(baseDate);

  switch (frequency) {
    case 'MONTHLY':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'QUARTERLY':
      next.setMonth(next.getMonth() + 3);
      break;
    case 'SEMI_ANNUALLY':
      next.setMonth(next.getMonth() + 6);
      break;
    case 'ANNUALLY':
      next.setFullYear(next.getFullYear() + 1);
      break;
    default:
      next.setMonth(next.getMonth() + 3);
  }
  return next.toISOString();
}

export function isDateOverdue(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  return new Date(dateStr).getTime() < Date.now();
}

export function runDeterministicComplianceChecks(orgId: string): ComplianceRunResult {
  const controls = dbRepository.getControls(orgId);
  const findings = dbRepository.getFindings(orgId);
  const evidenceFiles = dbRepository.getEvidenceFiles(orgId);
  const policies = dbRepository.getPolicies(orgId);
  const policyChanges = dbRepository.getPolicyChanges(orgId);
  const audits = dbRepository.getAudits(orgId);

  const existingActiveGaps = dbRepository.getDetectedGaps(orgId, 'ACTIVE');
  const existingGapKeys = new Set(existingActiveGaps.map(g => `${g.gap_type}-${g.related_entity_type}-${g.related_entity_id}`));

  let newGapsCount = 0;
  let notificationsCount = 0;

  const counts = {
    overdueTesting: 0,
    noTestHistory: 0,
    missingEvidence: 0,
    unverifiedRemediation: 0,
    overdueRemediation: 0,
    recurringFindings: 0,
    stalePolicies: 0,
    unreviewedChanges: 0,
  };

  const processGap = (gapData: Omit<DetectedGap, 'id' | 'detected_at'>, notify: { title: string; message: string; priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'; linkUrl: string; category: any }) => {
    const key = `${gapData.gap_type}-${gapData.related_entity_type}-${gapData.related_entity_id}`;
    const isNew = !existingGapKeys.has(key);

    dbRepository.upsertGap(gapData);

    if (isNew) {
      newGapsCount++;
      // Create in-app notification for new gaps to prevent alert fatigue
      dbRepository.createNotification({
        org_id: orgId,
        title: notify.title,
        message: notify.message,
        category: notify.category,
        priority: notify.priority,
        link_url: notify.linkUrl,
        is_read: false,
      });
      notificationsCount++;
    }
  };

  // 1. OVERDUE TESTING CHECK
  for (const ctrl of controls) {
    if (ctrl.next_due_date && isDateOverdue(ctrl.next_due_date)) {
      counts.overdueTesting++;
      const daysOverdue = Math.floor((Date.now() - new Date(ctrl.next_due_date).getTime()) / (1000 * 60 * 60 * 24));
      processGap({
        org_id: orgId,
        gap_type: 'OVERDUE_TESTING',
        severity: ctrl.risk_level === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
        title: `Control ${ctrl.code} Testing Overdue`,
        explanation: `Control ${ctrl.code} (${ctrl.name}) was scheduled for ${ctrl.testing_frequency.toLowerCase()} testing on ${new Date(ctrl.next_due_date).toLocaleDateString()}, but is now overdue by ${daysOverdue} days. Last tested: ${ctrl.last_tested_date ? new Date(ctrl.last_tested_date).toLocaleDateString() : 'Never'}.`,
        related_entity_type: 'CONTROL',
        related_entity_id: ctrl.id,
        suggested_action: `Initiate a control effectiveness test procedure and assign a qualified tester immediately.`,
        status: 'ACTIVE',
      }, {
        title: `Overdue Test: Control ${ctrl.code}`,
        message: `Control ${ctrl.code} is overdue for testing by ${daysOverdue} days.`,
        priority: ctrl.risk_level === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
        linkUrl: `/controls/${ctrl.id}`,
        category: 'OVERDUE_TEST',
      });
    }

    // 2. MISSING TEST HISTORY CHECK
    if (ctrl.latest_test_result === 'NOT_TESTED' && ctrl.implementation_status === 'IMPLEMENTED') {
      counts.noTestHistory++;
      processGap({
        org_id: orgId,
        gap_type: 'MISSING_TEST_HISTORY',
        severity: 'MEDIUM',
        title: `Control ${ctrl.code} Missing Baseline Test History`,
        explanation: `Control ${ctrl.code} is marked as IMPLEMENTED but has zero recorded test records in the audit trail. Baseline effectiveness cannot be verified.`,
        related_entity_type: 'CONTROL',
        related_entity_id: ctrl.id,
        suggested_action: `Perform initial baseline control design and operating test.`,
        status: 'ACTIVE',
      }, {
        title: `Missing Baseline Test: ${ctrl.code}`,
        message: `Control ${ctrl.code} has no recorded test history.`,
        priority: 'MEDIUM',
        linkUrl: `/controls/${ctrl.id}`,
        category: 'OVERDUE_TEST',
      });
    }

    // 3. MISSING REQUIRED EVIDENCE CHECK
    if (ctrl.evidence_requirements && ctrl.evidence_requirements.trim().length > 0) {
      // Check if evidence is linked to this control
      const hasEvidence = evidenceFiles.some(ef => ef.linked_entities?.some(le => le.entity_id === ctrl.id));
      if (!hasEvidence && (ctrl.latest_test_result === 'PASS' || ctrl.latest_test_result === 'PARTIALLY_EFFECTIVE')) {
        counts.missingEvidence++;
        processGap({
          org_id: orgId,
          gap_type: 'MISSING_EVIDENCE',
          severity: 'HIGH',
          title: `Control ${ctrl.code} Missing Artifact Evidence`,
          explanation: `Control ${ctrl.code} requires specific evidence (${ctrl.evidence_requirements}), but no corresponding document artifact is linked in the Evidence Library.`,
          related_entity_type: 'CONTROL',
          related_entity_id: ctrl.id,
          suggested_action: `Upload the required evidence files and link them to control ${ctrl.code}.`,
          status: 'ACTIVE',
        }, {
          title: `Missing Evidence: ${ctrl.code}`,
          message: `Control ${ctrl.code} requires evidence artifacts that are not yet linked.`,
          priority: 'HIGH',
          linkUrl: `/controls/${ctrl.id}`,
          category: 'MISSING_EVIDENCE',
        });
      }
    }
  }

  // 4. FINDINGS CHECKS: UNVERIFIED REMEDIATION & OVERDUE REMEDIATION
  for (const fnd of findings) {
    // Unverified remediation check:
    // Core scenario: An employee marked finding resolved, but no subsequent verification or test was recorded!
    if ((fnd.remediation_status === 'RESOLVED' || fnd.remediation_status === 'PENDING_VERIFICATION') && fnd.verification_status !== 'VERIFIED') {
      counts.unverifiedRemediation++;

      const relatedCtrlCodes = fnd.related_controls?.map(c => c.code).join(', ') || 'N/A';
      processGap({
        org_id: orgId,
        gap_type: 'UNVERIFIED_REMEDIATION',
        severity: fnd.severity === 'CRITICAL' || fnd.severity === 'HIGH' ? 'HIGH' : 'MEDIUM',
        title: `Finding ${fnd.code} Remediation Awaiting Formal Verification`,
        explanation: `Finding ${fnd.code} ("${fnd.title}") was marked '${fnd.remediation_status}' by ${fnd.assigned_owner}. However, no subsequent independent verification test or formal auditor signoff has been recorded. Remediation cannot be accepted as fact without verification.`,
        related_entity_type: 'FINDING',
        related_entity_id: fnd.id,
        suggested_action: `Conduct a re-test on affected control(s) (${relatedCtrlCodes}) to confirm the remediation is operating effectively.`,
        status: 'ACTIVE',
      }, {
        title: `Verification Required: Finding ${fnd.code}`,
        message: `Remediation for ${fnd.code} is marked complete but requires verification.`,
        priority: 'HIGH',
        linkUrl: `/findings/${fnd.id}`,
        category: 'UNVERIFIED_REMEDIATION',
      });
    }

    // Overdue remediation check
    if (fnd.remediation_status !== 'RESOLVED' && fnd.remediation_status !== 'ACCEPTED_EXCEPTION') {
      if (isDateOverdue(fnd.target_remediation_date)) {
        counts.overdueRemediation++;
        const daysOverdue = Math.floor((Date.now() - new Date(fnd.target_remediation_date).getTime()) / (1000 * 60 * 60 * 24));
        processGap({
          org_id: orgId,
          gap_type: 'OVERDUE_REMEDIATION',
          severity: fnd.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
          title: `Finding ${fnd.code} Past Remediation Deadline`,
          explanation: `Finding ${fnd.code} (${fnd.severity}) assigned to ${fnd.assigned_owner} missed its target remediation deadline of ${new Date(fnd.target_remediation_date).toLocaleDateString()} by ${daysOverdue} days. Current status: ${fnd.remediation_status}.`,
          related_entity_type: 'FINDING',
          related_entity_id: fnd.id,
          suggested_action: `Escalate to ${fnd.assigned_owner} and management to unblock remediation or document an approved exception.`,
          status: 'ACTIVE',
        }, {
          title: `Overdue Remediation: Finding ${fnd.code}`,
          message: `Finding ${fnd.code} is overdue by ${daysOverdue} days.`,
          priority: fnd.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
          linkUrl: `/findings/${fnd.id}`,
          category: 'OVERDUE_REMEDIATION',
        });
      }
    }
  }

  // 5. RECURRING FINDINGS CHECK ACROSS AUDITS
  // Check if multiple findings are associated with the same control across different audits
  const controlFindingMap: Record<string, Finding[]> = {};
  for (const fnd of findings) {
    if (fnd.related_controls) {
      for (const c of fnd.related_controls) {
        if (!controlFindingMap[c.id]) controlFindingMap[c.id] = [];
        controlFindingMap[c.id].push(fnd);
      }
    }
  }

  for (const [ctrlId, ctrlFindings] of Object.entries(controlFindingMap)) {
    if (ctrlFindings.length >= 2) {
      const distinctAudits = new Set(ctrlFindings.map(f => f.audit_id).filter(Boolean));
      if (distinctAudits.size >= 2) {
        counts.recurringFindings++;
        const ctrl = controls.find(c => c.id === ctrlId);
        const codes = ctrlFindings.map(f => f.code).join(', ');
        processGap({
          org_id: orgId,
          gap_type: 'RECURRING_FINDING',
          severity: 'HIGH',
          title: `Recurring Deficiencies Detected for Control ${ctrl?.code || ctrlId}`,
          explanation: `Control ${ctrl?.code || ctrlId} (${ctrl?.name}) has triggered findings across ${distinctAudits.size} distinct audit engagements (${codes}). This indicates systematic root causes rather than isolated anomalies.`,
          related_entity_type: 'CONTROL',
          related_entity_id: ctrlId,
          suggested_action: `Perform comprehensive root cause analysis and redesign control operational procedures.`,
          status: 'ACTIVE',
        }, {
          title: `Recurring Deficiency: Control ${ctrl?.code}`,
          message: `Repeated audit findings detected for control ${ctrl?.code} across multiple engagements.`,
          priority: 'HIGH',
          linkUrl: `/controls/${ctrlId}`,
          category: 'AUDIT_EVENT',
        });
      }
    }
  }

  // 6. STALE POLICY REVIEWS
  for (const pol of policies) {
    if (isDateOverdue(pol.review_date)) {
      counts.stalePolicies++;
      processGap({
        org_id: orgId,
        gap_type: 'STALE_POLICY_REVIEW',
        severity: 'MEDIUM',
        title: `Policy ${pol.code} Annual Review Overdue`,
        explanation: `Internal policy ${pol.code} ("${pol.title}") was due for annual review on ${new Date(pol.review_date).toLocaleDateString()}. Policy owner: ${pol.owner}.`,
        related_entity_type: 'POLICY',
        related_entity_id: pol.id,
        suggested_action: `Initiate policy review workflow and update document version.`,
        status: 'ACTIVE',
      }, {
        title: `Policy Review Overdue: ${pol.code}`,
        message: `Policy ${pol.code} has passed its scheduled review date.`,
        priority: 'MEDIUM',
        linkUrl: `/policies`,
        category: 'POLICY_ALERT',
      });
    }
  }

  // 7. UNREVIEWED POLICY CHANGE IMPACTS
  for (const pc of policyChanges) {
    if (pc.review_status === 'PENDING_REVIEW' || pc.review_status === 'ACTION_REQUIRED') {
      counts.unreviewedChanges++;
      processGap({
        org_id: orgId,
        gap_type: 'POLICY_CHANGE_IMPACT',
        severity: 'MEDIUM',
        title: `External Policy Update ${pc.code} Requires Review`,
        explanation: `External regulatory update "${pc.title}" from ${pc.source} was discovered on ${new Date(pc.date_discovered).toLocaleDateString()} and has unconfirmed control impacts.`,
        related_entity_type: 'POLICY',
        related_entity_id: pc.id,
        suggested_action: `Review proposed control impact assessments and approve required control modifications.`,
        status: 'ACTIVE',
      }, {
        title: `Policy Update Pending Review: ${pc.code}`,
        message: `External regulatory update ${pc.code} requires control impact assessment.`,
        priority: 'MEDIUM',
        linkUrl: `/policies/changes`,
        category: 'POLICY_ALERT',
      });
    }
  }

  const allActiveGaps = dbRepository.getDetectedGaps(orgId, 'ACTIVE');

  return {
    gapsDetected: allActiveGaps.length,
    newGapsCount,
    notificationsCreated: notificationsCount,
    details: counts,
  };
}
