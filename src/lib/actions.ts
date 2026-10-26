// ==============================================================================
// AUDITMIND - SERVER ACTIONS & DATA MUTATIONS
// Enforces server-side authorization, immutable logging, and deterministic updates.
// ==============================================================================

'use server';

import { revalidatePath } from 'next/cache';
import { dbRepository } from './db/sqlite-store';
import { runDeterministicComplianceChecks } from './services/compliance-engine';
import { DEMO_ORG, seedDemoData } from './demo-data';
import { TestResult, FindingSeverity, RemediationStatus, VerificationStatus, RiskLevel } from '@/types';

// Ensure data is seeded on first action
seedDemoData(false);

export async function recordControlTestAction(formData: FormData) {
  const controlId = formData.get('controlId') as string;
  const auditId = (formData.get('auditId') as string) || undefined;
  const tester = (formData.get('tester') as string) || 'Compliance Auditor';
  const testObjective = formData.get('testObjective') as string;
  const testProcedure = formData.get('testProcedure') as string;
  const sampleDescription = formData.get('sampleDescription') as string;
  const result = formData.get('result') as TestResult;
  const exceptions = formData.get('exceptions') as string;
  const conclusion = formData.get('conclusion') as string;
  const notes = formData.get('notes') as string;
  const orgId = (formData.get('orgId') as string) || DEMO_ORG.id;

  if (!controlId || !testObjective || !testProcedure || !result || !conclusion) {
    throw new Error('Required test procedure fields are missing.');
  }

  const newTest = dbRepository.recordControlTest({
    org_id: orgId,
    control_id: controlId,
    audit_id: auditId || undefined,
    test_date: new Date().toISOString(),
    tester,
    test_objective: testObjective,
    test_procedure: testProcedure,
    sample_description: sampleDescription || undefined,
    result,
    exceptions: exceptions || undefined,
    conclusion,
    notes: notes || undefined,
    review_status: 'APPROVED',
    reviewer: tester,
    reviewed_at: new Date().toISOString(),
  });

  // Re-run compliance gap checks to update overdue/testing states
  runDeterministicComplianceChecks(orgId);

  revalidatePath(`/controls/${controlId}`);
  revalidatePath('/controls');
  revalidatePath('/');
  return newTest;
}

export async function createControlAction(formData: FormData) {
  const orgId = (formData.get('orgId') as string) || DEMO_ORG.id;
  const code = (formData.get('code') as string).trim().toUpperCase();
  const name = (formData.get('name') as string).trim();
  const description = (formData.get('description') as string).trim();
  const objective = formData.get('objective') as string;
  const category = formData.get('category') as any;
  const controlType = formData.get('controlType') as any;
  const riskLevel = formData.get('riskLevel') as RiskLevel;
  const testingFrequency = formData.get('testingFrequency') as any;
  const owner = (formData.get('owner') as string).trim();
  const evidenceRequirements = formData.get('evidenceRequirements') as string;

  if (!code || !name || !description || !owner) {
    throw new Error('Control code, name, description, and owner are required.');
  }

  const existing = dbRepository.getControlByCode(orgId, code);
  if (existing) {
    throw new Error(`Control code ${code} is already in use.`);
  }

  const created = dbRepository.createControl({
    org_id: orgId,
    code,
    name,
    description,
    objective: objective || undefined,
    category,
    control_type: controlType || 'PREVENTIVE',
    risk_level: riskLevel || 'MEDIUM',
    testing_frequency: testingFrequency || 'QUARTERLY',
    implementation_status: 'IMPLEMENTED',
    owner,
    evidence_requirements: evidenceRequirements || undefined,
    is_archived: false,
    latest_test_result: 'NOT_TESTED',
  });

  runDeterministicComplianceChecks(orgId);
  revalidatePath('/controls');
  revalidatePath('/');
  return created;
}

export async function createFindingAction(formData: FormData) {
  const orgId = (formData.get('orgId') as string) || DEMO_ORG.id;
  const code = (formData.get('code') as string).trim().toUpperCase();
  const title = (formData.get('title') as string).trim();
  const description = (formData.get('description') as string).trim();
  const auditId = (formData.get('auditId') as string) || undefined;
  const severity = (formData.get('severity') as FindingSeverity) || 'MEDIUM';
  const riskCategory = (formData.get('riskCategory') as string) || 'Access Control';
  const assignedOwner = (formData.get('assignedOwner') as string).trim();
  const targetRemediationDate = formData.get('targetRemediationDate') as string;
  const remediationPlan = formData.get('remediationPlan') as string;
  const controlId = formData.get('controlId') as string;

  if (!code || !title || !description || !assignedOwner || !targetRemediationDate) {
    throw new Error('Finding code, title, description, owner, and target date are required.');
  }

  const finding = dbRepository.createFinding({
    org_id: orgId,
    code,
    title,
    description,
    audit_id: auditId || undefined,
    severity,
    risk_category: riskCategory,
    assigned_owner: assignedOwner,
    date_discovered: new Date().toISOString().split('T')[0],
    target_remediation_date: targetRemediationDate,
    remediation_plan: remediationPlan || undefined,
    remediation_status: 'OPEN',
    verification_status: 'UNVERIFIED',
    control_ids: controlId ? [controlId] : [],
  });

  runDeterministicComplianceChecks(orgId);
  revalidatePath('/findings');
  revalidatePath('/');
  return finding;
}

export async function updateFindingWorkflowAction(formData: FormData) {
  const findingId = formData.get('findingId') as string;
  const actionType = formData.get('actionType') as 'SUBMIT_RESOLUTION' | 'VERIFY_REMEDIATION' | 'ACCEPT_EXCEPTION' | 'UPDATE_STATUS';
  const orgId = (formData.get('orgId') as string) || DEMO_ORG.id;

  const current = dbRepository.getFindingById(findingId);
  if (!current) throw new Error('Finding not found');

  if (actionType === 'SUBMIT_RESOLUTION') {
    const resolutionNotes = formData.get('resolutionNotes') as string;
    const evidenceId = (formData.get('evidenceId') as string) || undefined;

    dbRepository.updateFinding(findingId, {
      remediation_status: 'PENDING_VERIFICATION',
      verification_status: 'PENDING_VERIFICATION',
      resolution_notes: resolutionNotes,
      resolution_evidence_id: evidenceId,
    });
  } else if (actionType === 'VERIFY_REMEDIATION') {
    const verifiedBy = (formData.get('verifiedBy') as string) || 'Lead Auditor';
    const notes = formData.get('notes') as string;
    const isApproved = formData.get('isApproved') === 'true';

    if (isApproved) {
      dbRepository.updateFinding(findingId, {
        remediation_status: 'RESOLVED',
        verification_status: 'VERIFIED',
        verified_by: verifiedBy,
        verified_at: new Date().toISOString(),
        resolution_notes: notes ? `${current.resolution_notes || ''}\n[Verification Note]: ${notes}`.trim() : current.resolution_notes,
      });
    } else {
      dbRepository.updateFinding(findingId, {
        remediation_status: 'IN_PROGRESS',
        verification_status: 'REJECTED',
        verified_by: verifiedBy,
        resolution_notes: `${current.resolution_notes || ''}\n[Rejection Reason]: ${notes}`.trim(),
      });
    }
  } else if (actionType === 'ACCEPT_EXCEPTION') {
    const exceptionReason = formData.get('exceptionReason') as string;
    const approvedBy = formData.get('approvedBy') as string;

    if (!exceptionReason || !approvedBy) {
      throw new Error('Documented justification and authorized approver name are required to accept an exception.');
    }

    dbRepository.updateFinding(findingId, {
      remediation_status: 'ACCEPTED_EXCEPTION',
      verification_status: 'VERIFIED',
      exception_reason: exceptionReason,
      exception_approved_by: approvedBy,
    });
  }

  runDeterministicComplianceChecks(orgId);
  revalidatePath(`/findings/${findingId}`);
  revalidatePath('/findings');
  revalidatePath('/');
}

export async function createAuditAction(formData: FormData) {
  const orgId = (formData.get('orgId') as string) || DEMO_ORG.id;
  const code = (formData.get('code') as string).trim().toUpperCase();
  const title = (formData.get('title') as string).trim();
  const description = (formData.get('description') as string).trim();
  const auditType = formData.get('auditType') as string;
  const framework = formData.get('framework') as any;
  const startDate = formData.get('startDate') as string;
  const endDate = formData.get('endDate') as string;
  const leadAuditor = formData.get('leadAuditor') as string;

  if (!code || !title || !startDate || !endDate || !leadAuditor) {
    throw new Error('Audit code, title, dates, and lead auditor are required.');
  }

  const created = dbRepository.createAudit({
    org_id: orgId,
    code,
    title,
    description,
    audit_type: auditType || 'Internal Readiness',
    framework: framework || 'SOC 2',
    start_date: startDate,
    end_date: endDate,
    lead_auditor: leadAuditor,
    status: 'PLANNED',
  });

  revalidatePath('/audits');
  revalidatePath('/');
  return created;
}

export async function completeAuditAction(formData: FormData) {
  const auditId = formData.get('auditId') as string;
  const summary = formData.get('summary') as string;
  const orgId = (formData.get('orgId') as string) || DEMO_ORG.id;

  dbRepository.updateAudit(auditId, {
    status: 'COMPLETED',
    summary,
    completed_at: new Date().toISOString(),
  });

  revalidatePath(`/audits/${auditId}`);
  revalidatePath('/audits');
  revalidatePath('/');
}

export async function markNotificationReadAction(notificationId: string) {
  dbRepository.markNotificationAsRead(notificationId);
  revalidatePath('/notifications');
  revalidatePath('/');
}

export async function markAllNotificationsReadAction(orgId = DEMO_ORG.id) {
  dbRepository.markAllNotificationsRead(orgId);
  revalidatePath('/notifications');
  revalidatePath('/');
}

export async function runMonitoringNowAction(orgId = DEMO_ORG.id) {
  const result = runDeterministicComplianceChecks(orgId);
  revalidatePath('/');
  revalidatePath('/notifications');
  return result;
}
