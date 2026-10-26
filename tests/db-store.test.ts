import { describe, it, expect, beforeEach } from 'vitest';
import { dbRepository } from '../src/lib/db/sqlite-store';
import { DEMO_ORG, seedDemoData } from '../src/lib/demo-data';

describe('Persistent Relational Database & Audit Trail', () => {
  beforeEach(() => {
    seedDemoData(true);
  });

  it('creates and retrieves a new compliance control with unique code', () => {
    const orgId = DEMO_ORG.id;
    const testCode = `TEST-CTRL-${Date.now()}`;

    const created = dbRepository.createControl({
      org_id: orgId,
      code: testCode,
      name: 'Automated CI/CD Secret Scanning',
      description: 'Scans repositories for hardcoded API keys and credentials prior to merge.',
      category: 'Change Management',
      control_type: 'PREVENTIVE',
      risk_level: 'HIGH',
      testing_frequency: 'MONTHLY',
      implementation_status: 'IMPLEMENTED',
      owner: 'SecOps Team',
      is_archived: false,
      latest_test_result: 'NOT_TESTED',
    });

    expect(created.id).toBeDefined();
    expect(created.code).toBe(testCode);

    const retrieved = dbRepository.getControlById(created.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.name).toBe('Automated CI/CD Secret Scanning');
  });

  it('preserves chronological append-only control test history without overwriting previous tests', () => {
    const orgId = DEMO_ORG.id;
    const control = dbRepository.getControlByCode(orgId, 'AC-001');
    expect(control).toBeDefined();

    const initialHistory = dbRepository.getControlTests(control!.id);
    const initialCount = initialHistory.length;

    // Record Test 1: FAIL
    const test1 = dbRepository.recordControlTest({
      org_id: orgId,
      control_id: control!.id,
      test_date: '2026-01-15T10:00:00Z',
      tester: 'External Auditor',
      test_objective: 'Verify AWS IAM credentials review',
      test_procedure: 'Sampled 20 user accounts',
      result: 'FAIL',
      conclusion: 'Control failed due to 2 unapproved accounts.',
      review_status: 'APPROVED',
    });

    // Record Test 2: PASS (Re-test)
    const test2 = dbRepository.recordControlTest({
      org_id: orgId,
      control_id: control!.id,
      test_date: '2026-02-20T14:00:00Z',
      tester: 'External Auditor',
      test_objective: 'Re-test access review workflow',
      test_procedure: 'Re-tested 20 accounts after de-provisioning script deployment',
      result: 'PASS',
      conclusion: 'Control operating effectively on re-test.',
      review_status: 'APPROVED',
    });

    const updatedHistory = dbRepository.getControlTests(control!.id);
    expect(updatedHistory.length).toBe(initialCount + 2);

    // Verify chronological order (newest first)
    expect(updatedHistory[0].id).toBe(test2.id);
    expect(updatedHistory[0].result).toBe('PASS');
    expect(updatedHistory[1].id).toBe(test1.id);
    expect(updatedHistory[1].result).toBe('FAIL');

    // Control latest result must reflect newest test
    const updatedControl = dbRepository.getControlById(control!.id);
    expect(updatedControl?.latest_test_result).toBe('PASS');
  });

  it('records immutable audit activity logs on state changes', () => {
    const orgId = DEMO_ORG.id;
    const initialLogs = dbRepository.getActivityLogs(orgId);

    dbRepository.logActivity({
      org_id: orgId,
      actor_name: 'Lead Auditor',
      actor_email: 'auditor@kroll.internal',
      action: 'CONTROL_TEST_VERIFIED',
      entity_type: 'CONTROL',
      entity_id: 'ctrl-ac-001',
      reason: 'Formal quarterly compliance sign-off.',
    });

    const logs = dbRepository.getActivityLogs(orgId);
    expect(logs.length).toBe(initialLogs.length + 1);
    expect(logs[0].action).toBe('CONTROL_TEST_VERIFIED');
    expect(logs[0].actor_name).toBe('Lead Auditor');
  });
});
