import { describe, it, expect, beforeEach } from 'vitest';
import { executeAITool, processAIComplianceQuery } from '../src/lib/services/ai-service';
import { DEMO_ORG, seedDemoData } from '../src/lib/demo-data';

describe('AI Compliance Assistant & Authorized Tool Execution', () => {
  beforeEach(() => {
    seedDemoData(true);
  });

  it('executes get_overdue_controls and retrieves real database records', async () => {
    const orgId = DEMO_ORG.id;
    const res: any = await executeAITool('get_overdue_controls', {}, orgId);

    expect(res).toBeDefined();
    expect(res.count).toBeGreaterThan(0);
    expect(res.controls).toBeInstanceOf(Array);

    const ac001 = res.controls.find((c: any) => c.code === 'AC-001');
    expect(ac001).toBeDefined();
    expect(ac001.url).toBe('/controls/' + ac001.id);
  });

  it('executes get_findings_pending_verification and detects unverified findings', async () => {
    const orgId = DEMO_ORG.id;
    const res: any = await executeAITool('get_findings_pending_verification', {}, orgId);

    expect(res).toBeDefined();
    expect(res.count).toBeGreaterThan(0);

    const fnd001 = res.unverified_findings.find((f: any) => f.code === 'FND-001');
    expect(fnd001).toBeDefined();
    expect(fnd001.remediation_status).toBe('RESOLVED');
    expect(fnd001.verification_status).toBe('UNVERIFIED');
  });

  it('handles non-existent records gracefully without hallucinating', async () => {
    const orgId = DEMO_ORG.id;
    const res: any = await executeAITool('get_control_test_history', { control_code: 'NON-EXISTENT-999' }, orgId);

    expect(res.error).toBeDefined();
    expect(res.error).toContain('not found');
  });

  it('generates grounded responses with citations and direct links', async () => {
    const orgId = DEMO_ORG.id;
    const response = await processAIComplianceQuery('Which controls are overdue for testing?', orgId);

    expect(response.message).toBeDefined();
    expect(response.message.content).toContain('Overdue Controls');
    expect(response.message.citations).toBeInstanceOf(Array);
    expect(response.message.citations?.length).toBeGreaterThan(0);
  });
});
