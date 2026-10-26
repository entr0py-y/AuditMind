import { describe, it, expect, beforeEach } from 'vitest';
import { calculateNextDueDate, isDateOverdue, runDeterministicComplianceChecks } from '../src/lib/services/compliance-engine';
import { dbRepository } from '../src/lib/db/sqlite-store';
import { DEMO_ORG, seedDemoData } from '../src/lib/demo-data';

describe('Compliance Engine & Deterministic Gap Detection', () => {
  beforeEach(() => {
    seedDemoData(true); // Force pristine demo state
  });

  it('calculates correct next due date based on testing frequencies', () => {
    const baseDate = '2026-01-01T00:00:00Z';

    const monthlyDue = calculateNextDueDate(baseDate, 'MONTHLY');
    expect(new Date(monthlyDue).getMonth()).toBe(1); // February (0-indexed 1)

    const quarterlyDue = calculateNextDueDate(baseDate, 'QUARTERLY');
    expect(new Date(quarterlyDue).getMonth()).toBe(3); // April (0-indexed 3)

    const semiDue = calculateNextDueDate(baseDate, 'SEMI_ANNUALLY');
    expect(new Date(semiDue).getMonth()).toBe(6); // July (0-indexed 6)

    const annualDue = calculateNextDueDate(baseDate, 'ANNUALLY');
    expect(new Date(annualDue).getFullYear()).toBe(2027);
  });

  it('accurately evaluates past and future date overdue states', () => {
    const pastDate = '2020-01-01T00:00:00Z';
    const futureDate = '2030-01-01T00:00:00Z';

    expect(isDateOverdue(pastDate)).toBe(true);
    expect(isDateOverdue(futureDate)).toBe(false);
    expect(isDateOverdue(null)).toBe(false);
  });

  it('detects unverified remediation for findings marked resolved without auditor verification', () => {
    const orgId = DEMO_ORG.id;
    const result = runDeterministicComplianceChecks(orgId);

    // Finding FND-001 is marked resolved by employee, but verification is missing
    const activeGaps = dbRepository.getDetectedGaps(orgId, 'ACTIVE');
    const unverifiedGap = activeGaps.find(g => g.gap_type === 'UNVERIFIED_REMEDIATION');

    expect(unverifiedGap).toBeDefined();
    expect(unverifiedGap?.title).toContain('FND-001');
    expect(unverifiedGap?.explanation).toContain('Remediation cannot be accepted as fact without verification');
  });

  it('detects recurring findings for controls failing across multiple audits', () => {
    const orgId = DEMO_ORG.id;
    runDeterministicComplianceChecks(orgId);

    const activeGaps = dbRepository.getDetectedGaps(orgId, 'ACTIVE');
    const recurringGap = activeGaps.find(g => g.gap_type === 'RECURRING_FINDING');

    expect(recurringGap).toBeDefined();
    expect(recurringGap?.title).toContain('CM-001');
  });

  it('guarantees idempotency and prevents duplicate active gaps when executed repeatedly', () => {
    const orgId = DEMO_ORG.id;

    // First run creates active gaps
    const firstRun = runDeterministicComplianceChecks(orgId);
    expect(firstRun.gapsDetected).toBeGreaterThan(0);

    // Second run must NOT create duplicate gaps or notifications
    const secondRun = runDeterministicComplianceChecks(orgId);
    expect(secondRun.newGapsCount).toBe(0);
    expect(secondRun.notificationsCreated).toBe(0);
    expect(secondRun.gapsDetected).toBe(firstRun.gapsDetected);
  });
});
