// ==============================================================================
// AUDITMIND - DEMONSTRATION DATA GENERATOR
// Organization: Northstar Technologies — DEMO DATA
// Realistic GRC scenarios showcasing persistent audit memory, recurring findings,
// unverified remediations, overdue testing, missing evidence, and policy impacts.
// ==============================================================================

import { getDatabase, dbRepository } from './db/sqlite-store';
import { DEMO_ORG } from './constants';
export { DEMO_ORG };

export function seedDemoData(force = false) {
  const db = getDatabase();

  const existing = db.prepare('SELECT id FROM organizations WHERE id = ?').get(DEMO_ORG.id);
  if (existing && !force) {
    return;
  }

  // Clear demo records if force re-seeding
  if (existing && force) {
    db.exec(`
      DELETE FROM activity_logs WHERE org_id = '${DEMO_ORG.id}';
      DELETE FROM notifications WHERE org_id = '${DEMO_ORG.id}';
      DELETE FROM detected_gaps WHERE org_id = '${DEMO_ORG.id}';
      DELETE FROM risk_controls;
      DELETE FROM risks WHERE org_id = '${DEMO_ORG.id}';
      DELETE FROM policy_impact_assessments WHERE org_id = '${DEMO_ORG.id}';
      DELETE FROM policy_changes WHERE org_id = '${DEMO_ORG.id}';
      DELETE FROM policies WHERE org_id = '${DEMO_ORG.id}';
      DELETE FROM evidence_links WHERE org_id = '${DEMO_ORG.id}';
      DELETE FROM evidence_files WHERE org_id = '${DEMO_ORG.id}';
      DELETE FROM remediation_tasks WHERE org_id = '${DEMO_ORG.id}';
      DELETE FROM finding_controls;
      DELETE FROM findings WHERE org_id = '${DEMO_ORG.id}';
      DELETE FROM control_tests WHERE org_id = '${DEMO_ORG.id}';
      DELETE FROM audit_controls;
      DELETE FROM audits WHERE org_id = '${DEMO_ORG.id}';
      DELETE FROM control_requirements;
      DELETE FROM controls WHERE org_id = '${DEMO_ORG.id}';
      DELETE FROM requirements WHERE org_id = '${DEMO_ORG.id}';
      DELETE FROM organizations WHERE id = '${DEMO_ORG.id}';
    `);
  }

  const now = new Date();
  const isoNow = now.toISOString();

  // Helper date generators
  const daysAgo = (days: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - days);
    return d.toISOString();
  };

  const daysFromNow = (days: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    return d.toISOString();
  };

  // 1. Organization
  db.prepare(`
    INSERT INTO organizations (id, name, slug, industry, is_demo, created_at, updated_at)
    VALUES (?, ?, ?, ?, 1, ?, ?)
  `).run(DEMO_ORG.id, DEMO_ORG.name, DEMO_ORG.slug, DEMO_ORG.industry, daysAgo(365), isoNow);

  // 2. Requirements (SOC 2, ISO 27001, HIPAA, NIST CSF)
  const requirements = [
    {
      id: 'req-soc2-cc6.1',
      org_id: DEMO_ORG.id,
      code: 'SOC2-CC6.1',
      name: 'Logical Access Security',
      description: 'The entity implements logical access security software, infrastructure, and architectures over protected information assets.',
      framework: 'SOC 2',
      issuing_authority: 'AICPA',
      jurisdiction: 'United States',
      effective_date: '2024-01-01',
      last_reviewed_date: '2025-06-15',
      status: 'ACTIVE',
      owner: 'Elena Rostova (CISO)',
      created_at: daysAgo(300),
    },
    {
      id: 'req-soc2-cc6.2',
      org_id: DEMO_ORG.id,
      code: 'SOC2-CC6.2',
      name: 'User Registration and Access Modification',
      description: 'Prior to issuing system credentials and granting system access, the entity registers and authorizes new internal and external users.',
      framework: 'SOC 2',
      issuing_authority: 'AICPA',
      jurisdiction: 'United States',
      effective_date: '2024-01-01',
      last_reviewed_date: '2025-06-15',
      status: 'ACTIVE',
      owner: 'Elena Rostova (CISO)',
      created_at: daysAgo(300),
    },
    {
      id: 'req-soc2-cc8.1',
      org_id: DEMO_ORG.id,
      code: 'SOC2-CC8.1',
      name: 'Change Management & Authorization',
      description: 'The entity authorizes, designs, develops or acquires, configures, documents, tests, approves, and implements changes to infrastructure, data, software, and procedures.',
      framework: 'SOC 2',
      issuing_authority: 'AICPA',
      jurisdiction: 'United States',
      effective_date: '2024-01-01',
      last_reviewed_date: '2025-08-10',
      status: 'ACTIVE',
      owner: 'Marcus Vance (VP Engineering)',
      created_at: daysAgo(300),
    },
    {
      id: 'req-iso-a9.2',
      org_id: DEMO_ORG.id,
      code: 'ISO-27001-A.9.2',
      name: 'User Access Management',
      description: 'A formal user registration and de-registration process shall be implemented to enable assignment of access rights.',
      framework: 'ISO 27001',
      issuing_authority: 'ISO / IEC',
      jurisdiction: 'International',
      effective_date: '2024-03-01',
      last_reviewed_date: '2025-07-20',
      status: 'ACTIVE',
      owner: 'Elena Rostova (CISO)',
      created_at: daysAgo(300),
    },
    {
      id: 'req-hipaa-164.312',
      org_id: DEMO_ORG.id,
      code: 'HIPAA-164.312(a)(1)',
      name: 'Access Control Standard',
      description: 'Implement technical policies and procedures for electronic information systems that maintain electronic protected health information to allow access only to those persons or software programs that have been granted access rights.',
      framework: 'HIPAA',
      issuing_authority: 'HHS OCR',
      jurisdiction: 'United States',
      effective_date: '2024-01-01',
      last_reviewed_date: '2025-09-01',
      status: 'ACTIVE',
      owner: 'Sarah Jenkins (Privacy Officer)',
      created_at: daysAgo(300),
    },
  ];

  for (const req of requirements) {
    db.prepare(`
      INSERT INTO requirements (id, org_id, code, name, description, framework, issuing_authority, jurisdiction, effective_date, last_reviewed_date, status, owner, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.id, req.org_id, req.code, req.name, req.description, req.framework,
      req.issuing_authority, req.jurisdiction, req.effective_date, req.last_reviewed_date,
      req.status, req.owner, req.created_at
    );
  }

  // 3. Controls (14 realistic controls)
  const controls = [
    {
      id: 'ctrl-ac-001',
      org_id: DEMO_ORG.id,
      code: 'AC-001',
      name: 'Quarterly User Access Review',
      description: 'Management reviews user and privileged access rights across all production systems and cloud infrastructure on a quarterly basis to ensure least privilege and remove stale accounts.',
      objective: 'Prevent unauthorized or lingering administrative access to customer production environments.',
      category: 'Access Control',
      control_type: 'DETECTIVE',
      risk_level: 'HIGH',
      testing_frequency: 'QUARTERLY',
      implementation_status: 'IMPLEMENTED',
      owner: 'Elena Rostova (CISO)',
      evidence_requirements: 'Signed manager access review sign-off sheets, Okta active users export, and AWS IAM credential reports.',
      is_archived: 0,
      last_tested_date: daysAgo(180), // Tested 6 months ago in 2025 SOC 2 audit
      next_due_date: daysAgo(90),     // Overdue by 90 days!
      latest_test_result: 'FAIL',     // Failed in last audit
      created_at: daysAgo(300),
      updated_at: daysAgo(60),
    },
    {
      id: 'ctrl-ac-002',
      org_id: DEMO_ORG.id,
      code: 'AC-002',
      name: 'Privileged Access Least Privilege Enforcement',
      description: 'Privileged AWS and database accounts must require Just-In-Time (JIT) access approval with automatic session timeout after 2 hours.',
      objective: 'Ensure zero permanent root/admin access to production clusters.',
      category: 'Access Control',
      control_type: 'PREVENTIVE',
      risk_level: 'CRITICAL',
      testing_frequency: 'SEMI_ANNUALLY',
      implementation_status: 'IMPLEMENTED',
      owner: 'DevOps Lead (Alex Kumar)',
      evidence_requirements: 'AWS IAM Identity Center permission set configurations, Teleport audit logs, and approval tickets.',
      is_archived: 0,
      last_tested_date: daysAgo(60),
      next_due_date: daysFromNow(120),
      latest_test_result: 'PASS',
      created_at: daysAgo(300),
      updated_at: daysAgo(60),
    },
    {
      id: 'ctrl-cm-001',
      org_id: DEMO_ORG.id,
      code: 'CM-001',
      name: 'Production Change Management & Code Review Approval',
      description: 'All code and infrastructure changes deployed to production environments must be tracked in Jira, peer-reviewed by at least one qualified engineer, and pass automated CI/CD security checks before merge.',
      objective: 'Prevent unauthorized or defective code changes from impacting production security and stability.',
      category: 'Change Management',
      control_type: 'PREVENTIVE',
      risk_level: 'HIGH',
      testing_frequency: 'QUARTERLY',
      implementation_status: 'IMPLEMENTED',
      owner: 'Marcus Vance (VP Engineering)',
      evidence_requirements: 'GitHub branch protection settings, pull request review logs, and CI/CD deployment pipeline logs.',
      is_archived: 0,
      last_tested_date: daysAgo(95),
      next_due_date: daysAgo(5), // Overdue by 5 days!
      latest_test_result: 'FAIL', // Recurring finding!
      created_at: daysAgo(300),
      updated_at: daysAgo(30),
    },
    {
      id: 'ctrl-ia-001',
      org_id: DEMO_ORG.id,
      code: 'IA-001',
      name: 'Mandatory Multi-Factor Authentication (MFA)',
      description: 'Multi-Factor Authentication (FIDO2 WebAuthn or TOTP) is enforced for all corporate identity logins, VPN connections, and privileged cloud access.',
      objective: 'Mitigate credential stuffing and phishing attacks against workforce credentials.',
      category: 'Access Control',
      control_type: 'PREVENTIVE',
      risk_level: 'CRITICAL',
      testing_frequency: 'QUARTERLY',
      implementation_status: 'IMPLEMENTED',
      owner: 'IT Operations (David Park)',
      evidence_requirements: 'Okta MFA global policy enforcement reports, AWS IAM MFA compliance script output.',
      is_archived: 0,
      last_tested_date: daysAgo(110),
      next_due_date: daysAgo(20), // Overdue by 20 days!
      latest_test_result: 'PASS',
      created_at: daysAgo(300),
      updated_at: daysAgo(20),
    },
    {
      id: 'ctrl-ds-001',
      org_id: DEMO_ORG.id,
      code: 'DS-001',
      name: 'Data Encryption at Rest',
      description: 'All customer databases, object storage buckets (S3), and block volumes (EBS) are encrypted using AES-256 with AWS KMS customer-managed keys rotated annually.',
      objective: 'Protect sensitive customer data against physical theft or unauthorized storage volume extraction.',
      category: 'Data Protection',
      control_type: 'PREVENTIVE',
      risk_level: 'HIGH',
      testing_frequency: 'SEMI_ANNUALLY',
      implementation_status: 'IMPLEMENTED',
      owner: 'Cloud Architect (Siddharth Rao)',
      evidence_requirements: 'AWS KMS key policy screenshots, AWS Config rule evaluation report for s3-bucket-server-side-encryption-enabled.',
      is_archived: 0,
      last_tested_date: daysAgo(140),
      next_due_date: daysFromNow(40),
      latest_test_result: 'PASS',
      created_at: daysAgo(300),
      updated_at: daysAgo(140),
    },
    {
      id: 'ctrl-ds-002',
      org_id: DEMO_ORG.id,
      code: 'DS-002',
      name: 'Data Encryption in Transit',
      description: 'All network traffic to and within public-facing endpoints enforces TLS 1.3 (minimum TLS 1.2) with strict HSTS policies.',
      objective: 'Prevent eavesdropping or man-in-the-middle attacks on customer communications.',
      category: 'Data Protection',
      control_type: 'PREVENTIVE',
      risk_level: 'HIGH',
      testing_frequency: 'ANNUALLY',
      implementation_status: 'IMPLEMENTED',
      owner: 'DevOps Lead (Alex Kumar)',
      evidence_requirements: 'SSL Labs grade A+ reports and Cloudflare SSL/TLS configuration exports.',
      is_archived: 0,
      last_tested_date: daysAgo(200),
      next_due_date: daysFromNow(165),
      latest_test_result: 'PASS',
      created_at: daysAgo(300),
      updated_at: daysAgo(200),
    },
    {
      id: 'ctrl-ir-001',
      org_id: DEMO_ORG.id,
      code: 'IR-001',
      name: 'Annual Incident Response Tabletop Simulation',
      description: 'The security incident response team conducts an annual simulated security tabletop exercise to validate response playbooks, escalation paths, and breach notification obligations.',
      objective: 'Ensure organizational readiness and compliance with 72-hour breach notification regulations.',
      category: 'Incident Response',
      control_type: 'DETECTIVE',
      risk_level: 'HIGH',
      testing_frequency: 'ANNUALLY',
      implementation_status: 'IMPLEMENTED',
      owner: 'Elena Rostova (CISO)',
      evidence_requirements: 'Post-mortem tabletop exercise report, attendee roster, and action items tracker.',
      is_archived: 0,
      last_tested_date: daysAgo(320),
      next_due_date: daysFromNow(45),
      latest_test_result: 'PASS',
      created_at: daysAgo(300),
      updated_at: daysAgo(45),
    },
    {
      id: 'ctrl-vm-001',
      org_id: DEMO_ORG.id,
      code: 'VM-001',
      name: 'Weekly Automated Vulnerability Scanning',
      description: 'Automated vulnerability scanning is performed weekly on all container images, code dependencies (Snyk), and external network perimeters.',
      objective: 'Identify and prioritize known CVEs in production services before exploitation.',
      category: 'Vulnerability Management',
      control_type: 'DETECTIVE',
      risk_level: 'HIGH',
      testing_frequency: 'MONTHLY',
      implementation_status: 'IMPLEMENTED',
      owner: 'SecOps (Nadia Sterling)',
      evidence_requirements: 'Snyk project vulnerability dashboard and AWS Inspector scan reports.',
      is_archived: 0,
      last_tested_date: daysAgo(20),
      next_due_date: daysFromNow(10),
      latest_test_result: 'PASS',
      created_at: daysAgo(300),
      updated_at: daysAgo(20),
    },
    {
      id: 'ctrl-vm-002',
      org_id: DEMO_ORG.id,
      code: 'VM-002',
      name: 'Annual Third-Party Penetration Testing',
      description: 'An independent certified penetration testing vendor conducts an annual grey-box penetration test against the web application, APIs, and cloud infrastructure.',
      objective: 'Validate external defenses and identify zero-day or complex logic flaws.',
      category: 'Vulnerability Management',
      control_type: 'DETECTIVE',
      risk_level: 'CRITICAL',
      testing_frequency: 'ANNUALLY',
      implementation_status: 'IMPLEMENTED',
      owner: 'Elena Rostova (CISO)',
      evidence_requirements: 'Executive summary report from external pen-testing firm and remediation verification letter.',
      is_archived: 0,
      last_tested_date: daysAgo(150),
      next_due_date: daysFromNow(215),
      latest_test_result: 'PARTIALLY_EFFECTIVE',
      created_at: daysAgo(300),
      updated_at: daysAgo(150),
    },
    {
      id: 'ctrl-bc-001',
      org_id: DEMO_ORG.id,
      code: 'BC-001',
      name: 'Disaster Recovery Backup & Restoration Testing',
      description: 'Automated database snapshots are replicated cross-region and tested for successful restoration to meet RTO (< 4 hours) and RPO (< 1 hour) requirements.',
      objective: 'Ensure business resilience in the event of an AWS regional outage or catastrophic ransomware event.',
      category: 'Business Continuity',
      control_type: 'CORRECTIVE',
      risk_level: 'HIGH',
      testing_frequency: 'SEMI_ANNUALLY',
      implementation_status: 'IMPLEMENTED',
      owner: 'SRE Lead (Jordan Reed)',
      evidence_requirements: 'AWS RDS cross-region replication status, restore drill execution runbook and timestamp logs.',
      is_archived: 0,
      last_tested_date: daysAgo(170),
      next_due_date: daysFromNow(10),
      latest_test_result: 'PASS',
      created_at: daysAgo(300),
      updated_at: daysAgo(170),
    },
    {
      id: 'ctrl-hr-001',
      org_id: DEMO_ORG.id,
      code: 'HR-001',
      name: 'New Hire Background Checks and Security Awareness Training',
      description: 'All employees complete criminal background checks prior to hire and complete mandatory security awareness training within 30 days of employment and annually thereafter.',
      objective: 'Ensure workforce trustworthiness and security mindfulness.',
      category: 'Access Control',
      control_type: 'PREVENTIVE',
      risk_level: 'MEDIUM',
      testing_frequency: 'ANNUALLY',
      implementation_status: 'IMPLEMENTED',
      owner: 'People Ops (Rachel Adams)',
      evidence_requirements: 'Checkr background check completion logs and KnowBe4 training completion percentage reports.',
      is_archived: 0,
      last_tested_date: daysAgo(210),
      next_due_date: daysFromNow(155),
      latest_test_result: 'PASS',
      created_at: daysAgo(300),
      updated_at: daysAgo(210),
    },
    {
      id: 'ctrl-cc-001',
      org_id: DEMO_ORG.id,
      code: 'CC-001',
      name: 'Centralized Security Logging & SIEM Alerting',
      description: 'CloudTrail, VPC flow logs, and application authentication logs are shipped to a centralized SIEM with automated alerting for anomalous administrative activity.',
      objective: 'Provide non-repudiation audit trails and immediate detection of unauthorized activities.',
      category: 'Incident Response',
      control_type: 'DETECTIVE',
      risk_level: 'HIGH',
      testing_frequency: 'QUARTERLY',
      implementation_status: 'IMPLEMENTED',
      owner: 'SecOps (Nadia Sterling)',
      evidence_requirements: 'Datadog SIEM log retention configuration (365 days) and sample critical alert notification test.',
      is_archived: 0,
      last_tested_date: daysAgo(75),
      next_due_date: daysFromNow(15),
      latest_test_result: 'PASS',
      created_at: daysAgo(300),
      updated_at: daysAgo(75),
    },
    {
      id: 'ctrl-ven-001',
      org_id: DEMO_ORG.id,
      code: 'VEN-001',
      name: 'Third-Party Vendor Risk Assessment',
      description: 'All third-party SaaS vendors and sub-processors undergo a security risk assessment and must provide a current SOC 2 Type II or ISO 27001 report before contract execution.',
      objective: 'Prevent supply chain vulnerabilities from compromising company or customer data.',
      category: 'Vendor Management',
      control_type: 'PREVENTIVE',
      risk_level: 'MEDIUM',
      testing_frequency: 'ANNUALLY',
      implementation_status: 'PARTIALLY_IMPLEMENTED',
      owner: 'Procurement & Security (Elena Rostova)',
      evidence_requirements: 'Vendor risk assessment reviews, completed security questionnaires, and vendor SOC 2 reports.',
      is_archived: 0,
      last_tested_date: null, // NEVER TESTED!
      next_due_date: daysAgo(30),
      latest_test_result: 'NOT_TESTED',
      created_at: daysAgo(300),
      updated_at: daysAgo(30),
    },
  ];

  for (const c of controls) {
    db.prepare(`
      INSERT INTO controls (
        id, org_id, code, name, description, objective, category, control_type,
        risk_level, testing_frequency, implementation_status, owner,
        evidence_requirements, is_archived, last_tested_date, next_due_date,
        latest_test_result, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      c.id, c.org_id, c.code, c.name, c.description, c.objective, c.category, c.control_type,
      c.risk_level, c.testing_frequency, c.implementation_status, c.owner,
      c.evidence_requirements, c.is_archived, c.last_tested_date, c.next_due_date,
      c.latest_test_result, c.created_at, c.updated_at
    );
  }

  // Map controls to requirements
  const mappings = [
    { control_id: 'ctrl-ac-001', requirement_id: 'req-soc2-cc6.1' },
    { control_id: 'ctrl-ac-001', requirement_id: 'req-iso-a9.2' },
    { control_id: 'ctrl-ac-002', requirement_id: 'req-soc2-cc6.2' },
    { control_id: 'ctrl-cm-001', requirement_id: 'req-soc2-cc8.1' },
    { control_id: 'ctrl-ia-001', requirement_id: 'req-soc2-cc6.1' },
    { control_id: 'ctrl-ds-001', requirement_id: 'req-hipaa-164.312' },
  ];
  for (const m of mappings) {
    db.prepare('INSERT OR IGNORE INTO control_requirements (control_id, requirement_id) VALUES (?, ?)').run(m.control_id, m.requirement_id);
  }

  // 4. Historical Audits
  const audits = [
    {
      id: 'aud-2025-soc2',
      org_id: DEMO_ORG.id,
      code: 'AUD-2025-01',
      title: '2025 Annual SOC 2 Type II Audit',
      description: 'Comprehensive Type II examination of Security, Availability, and Confidentiality trust service criteria over the audit period Oct 1, 2024 to Sep 30, 2025.',
      audit_type: 'External SOC 2 Type II',
      framework: 'SOC 2',
      start_date: '2025-10-01',
      end_date: '2025-11-15',
      lead_auditor: 'Kroll & Co. (Partner: Jonathan Vance)',
      participants: 'Elena Rostova, Marcus Vance, Alex Kumar',
      status: 'COMPLETED',
      summary: 'The audit identified two exceptions: missing quarterly user access review documentation (AC-001) and unapproved emergency pull request merges in Production (CM-001). All other controls operating effectively.',
      completed_at: '2025-11-20T16:00:00Z',
      created_at: daysAgo(210),
      updated_at: daysAgo(180),
    },
    {
      id: 'aud-2025-iso',
      org_id: DEMO_ORG.id,
      code: 'AUD-2025-02',
      title: '2025 ISO 27001 Surveillance Audit',
      description: 'Annual surveillance audit evaluating compliance with ISO/IEC 27001:2022 ISMS requirements.',
      audit_type: 'External Surveillance',
      framework: 'ISO 27001',
      start_date: '2025-12-01',
      end_date: '2025-12-10',
      lead_auditor: 'BSI Group (Lead: Melissa Sterling)',
      participants: 'Elena Rostova, Sarah Jenkins',
      status: 'COMPLETED',
      summary: 'Surveillance audit successful with one minor non-conformity noted regarding production change tracking procedures (CM-001).',
      completed_at: '2025-12-15T18:00:00Z',
      created_at: daysAgo(150),
      updated_at: daysAgo(130),
    },
    {
      id: 'aud-2026-internal',
      org_id: DEMO_ORG.id,
      code: 'AUD-2026-01',
      title: '2026 Q1 Internal Security & Readiness Audit',
      description: 'Internal readiness assessment ahead of 2026 recertification audits, focusing on access reviews, change management, and encryption evidence.',
      audit_type: 'Internal Readiness',
      framework: 'SOC 2',
      start_date: '2026-03-01',
      end_date: '2026-04-15',
      lead_auditor: 'Internal Audit (Nadia Sterling)',
      participants: 'Elena Rostova, Alex Kumar, David Park',
      status: 'IN_PROGRESS',
      summary: 'Testing in progress. Preliminary sampling reveals access review verification remains outstanding.',
      completed_at: null,
      created_at: daysAgo(45),
      updated_at: daysAgo(2),
    },
  ];

  for (const a of audits) {
    db.prepare(`
      INSERT INTO audits (id, org_id, code, title, description, audit_type, framework, start_date, end_date, lead_auditor, participants, status, summary, completed_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      a.id, a.org_id, a.code, a.title, a.description, a.audit_type, a.framework,
      a.start_date, a.end_date, a.lead_auditor, a.participants, a.status,
      a.summary, a.completed_at, a.created_at, a.updated_at
    );
  }

  // Link controls to audits
  const auditControls = [
    { audit_id: 'aud-2025-soc2', control_id: 'ctrl-ac-001' },
    { audit_id: 'aud-2025-soc2', control_id: 'ctrl-ac-002' },
    { audit_id: 'aud-2025-soc2', control_id: 'ctrl-cm-001' },
    { audit_id: 'aud-2025-soc2', control_id: 'ctrl-ia-001' },
    { audit_id: 'aud-2025-soc2', control_id: 'ctrl-ds-001' },
    { audit_id: 'aud-2025-iso', control_id: 'ctrl-cm-001' },
    { audit_id: 'aud-2025-iso', control_id: 'ctrl-ac-001' },
    { audit_id: 'aud-2026-internal', control_id: 'ctrl-ac-001' },
    { audit_id: 'aud-2026-internal', control_id: 'ctrl-ia-001' },
    { audit_id: 'aud-2026-internal', control_id: 'ctrl-cm-001' },
  ];
  for (const ac of auditControls) {
    db.prepare('INSERT OR IGNORE INTO audit_controls (audit_id, control_id) VALUES (?, ?)').run(ac.audit_id, ac.control_id);
  }

  // 5. Historical Control Tests (Demonstrating timeline & repeated tests)
  const tests = [
    // AC-001 Test in 2025 SOC 2 audit (FAILED)
    {
      id: 'test-ac001-2025-failed',
      org_id: DEMO_ORG.id,
      control_id: 'ctrl-ac-001',
      audit_id: 'aud-2025-soc2',
      test_date: '2025-10-20T10:00:00Z',
      tester: 'Jonathan Vance (Kroll & Co.)',
      test_objective: 'Verify that user access reviews were completed quarterly for production AWS IAM and Okta admin groups during Q1, Q2, and Q3 2025.',
      test_procedure: 'Requested access review meeting minutes and manager sign-off sheets for 25 sampled engineers with production access.',
      sample_description: '25 sampled active engineering accounts with production access.',
      result: 'FAIL',
      exceptions: 'For Q2 2025, no documentation or manager sign-off could be located for 4 former contractors whose access remained active 45 days after termination.',
      conclusion: 'Control AC-001 operated ineffectively during Q2 2025. Finding FND-001 logged.',
      notes: 'Management committed to implementing automated Jira de-provisioning workflows.',
      review_status: 'APPROVED',
      reviewer: 'Melissa Sterling (Lead Quality Reviewer)',
      reviewed_at: '2025-10-22T14:00:00Z',
      created_at: '2025-10-20T10:00:00Z',
    },
    // AC-002 Test (PASSED)
    {
      id: 'test-ac002-2025-passed',
      org_id: DEMO_ORG.id,
      control_id: 'ctrl-ac-002',
      audit_id: 'aud-2025-soc2',
      test_date: '2025-10-24T11:30:00Z',
      tester: 'Jonathan Vance (Kroll & Co.)',
      test_objective: 'Inspect Teleport JIT access configurations and sample 15 privileged production sessions.',
      test_procedure: 'Verified that all 15 sessions required 2-person approval and expired within 120 minutes.',
      sample_description: '15 randomly selected Teleport SSH sessions into production EKS nodes.',
      result: 'PASS',
      exceptions: null,
      conclusion: 'Control AC-002 operated effectively.',
      notes: 'No exceptions identified.',
      review_status: 'APPROVED',
      reviewer: 'Jonathan Vance',
      reviewed_at: '2025-10-25T09:00:00Z',
      created_at: '2025-10-24T11:30:00Z',
    },
    // CM-001 Test in 2025 SOC 2 (FAILED)
    {
      id: 'test-cm001-2025-failed',
      org_id: DEMO_ORG.id,
      control_id: 'ctrl-cm-001',
      audit_id: 'aud-2025-soc2',
      test_date: '2025-10-28T14:00:00Z',
      tester: 'Jonathan Vance (Kroll & Co.)',
      test_objective: 'Verify that all production releases during sample periods included peer code review approval prior to deployment.',
      test_procedure: 'Sampled 40 pull requests merged into the main production branch in GitHub.',
      sample_description: '40 sampled production deployments from January to September 2025.',
      result: 'FAIL',
      exceptions: '2 pull requests (PR #402 and PR #415) were emergency hotfixes pushed by repo administrators bypassing branch protection without second approval.',
      conclusion: 'Control CM-001 failed due to emergency bypass without retrospective approval.',
      notes: 'Finding FND-002 logged.',
      review_status: 'APPROVED',
      reviewer: 'Jonathan Vance',
      reviewed_at: '2025-10-29T16:00:00Z',
      created_at: '2025-10-28T14:00:00Z',
    },
    // CM-001 Test in 2025 ISO 27001 (FAILED AGAIN - RECURRING ISSUE!)
    {
      id: 'test-cm001-iso-failed',
      org_id: DEMO_ORG.id,
      control_id: 'ctrl-cm-001',
      audit_id: 'aud-2025-iso',
      test_date: '2025-12-05T15:00:00Z',
      tester: 'Melissa Sterling (BSI Group)',
      test_objective: 'Evaluate adherence to change management standard under ISO 27001 clause A.8.32.',
      test_procedure: 'Inspected 20 recent production hotfixes from November 2025.',
      sample_description: '20 emergency hotfix deployments.',
      result: 'FAIL',
      exceptions: '1 hotfix deployed directly on November 14 lacked retrospective post-deployment review within the required 48-hour SLA.',
      conclusion: 'Recurring deviation in change management hotfix governance.',
      notes: 'Finding FND-003 logged.',
      review_status: 'APPROVED',
      reviewer: 'Melissa Sterling',
      reviewed_at: '2025-12-06T10:00:00Z',
      created_at: '2025-12-05T15:00:00Z',
    },
    // IA-001 Test (PASSED)
    {
      id: 'test-ia001-2025-passed',
      org_id: DEMO_ORG.id,
      control_id: 'ctrl-ia-001',
      audit_id: 'aud-2025-soc2',
      test_date: '2025-11-02T13:00:00Z',
      tester: 'Jonathan Vance (Kroll & Co.)',
      test_objective: 'Verify 100% MFA enrollment across Okta and AWS IAM.',
      test_procedure: 'Queried Okta API and AWS IAM credential report for active accounts without hardware/software MFA.',
      sample_description: '100% of 142 active enterprise accounts.',
      result: 'PASS',
      exceptions: null,
      conclusion: 'MFA strictly enforced across all tested accounts.',
      notes: 'No exceptions identified.',
      review_status: 'APPROVED',
      reviewer: 'Jonathan Vance',
      reviewed_at: '2025-11-03T11:00:00Z',
      created_at: '2025-11-02T13:00:00Z',
    },
  ];

  for (const t of tests) {
    db.prepare(`
      INSERT INTO control_tests (
        id, org_id, control_id, audit_id, test_date, tester, test_objective,
        test_procedure, sample_description, result, exceptions, conclusion,
        notes, review_status, reviewer, reviewed_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      t.id, t.org_id, t.control_id, t.audit_id, t.test_date, t.tester,
      t.test_objective, t.test_procedure, t.sample_description, t.result,
      t.exceptions, t.conclusion, t.notes, t.review_status, t.reviewer,
      t.reviewed_at, t.created_at
    );
  }

  // 6. Evidence Files
  const evidenceFiles = [
    {
      id: 'evi-2025-soc2-report',
      org_id: DEMO_ORG.id,
      code: 'EVI-001',
      title: '2025 Annual SOC 2 Type II Final Auditor Report',
      description: 'Official signed SOC 2 Type II independent service auditor report issued by Kroll & Co.',
      original_filename: 'Northstar_2025_SOC2_TypeII_Report_Signed.pdf',
      file_type: 'application/pdf',
      file_size: 4892040,
      storage_path: '/secure-vault/audits/2025/Northstar_SOC2_Final.pdf',
      uploaded_by: 'Elena Rostova (CISO)',
      review_status: 'VALID',
      checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      extracted_text: 'INDEPENDENT AUDITOR REPORT: We have examined Northstar Technologies description of its Cloud SaaS Platform. In our opinion, except for the matter described in Section IV (Control AC-001 and CM-001 exceptions), controls were suitably designed and operating effectively...',
      created_at: daysAgo(175),
    },
    {
      id: 'evi-access-rev-q3',
      org_id: DEMO_ORG.id,
      code: 'EVI-002',
      title: 'Q3 2025 Okta User Access Review Signoff Spreadsheet',
      description: 'Engineering and Operations manager sign-off checklist for Q3 2025 access certification.',
      original_filename: 'Q3_2025_Access_Review_Signoffs.xlsx',
      file_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      file_size: 245100,
      storage_path: '/secure-vault/evidence/access/Q3_2025_Signoffs.xlsx',
      uploaded_by: 'David Park (IT Operations)',
      review_status: 'VALID',
      checksum: '9f83c605d4c82b3e925b4290f1036f5413f29b556b605c5ec22e6261c7f0d611',
      extracted_text: 'Summary of access reviews conducted on September 28, 2025. 142 users reviewed. 4 contractor de-provisionings logged in Jira SEC-402.',
      created_at: daysAgo(160),
    },
    {
      id: 'evi-fnd001-resolution',
      org_id: DEMO_ORG.id,
      code: 'EVI-003',
      title: 'Automated Offboarding Jira Workflow Configuration & SOP',
      description: 'Resolution evidence uploaded by employee stating contractor de-provisioning is now automated.',
      original_filename: 'HR_Offboarding_Automation_SOP_v2.pdf',
      file_type: 'application/pdf',
      file_size: 890120,
      storage_path: '/secure-vault/remediation/FND-001_Resolution_Doc.pdf',
      uploaded_by: 'Alex Kumar (DevOps Lead)',
      review_status: 'PENDING_REVIEW', // Awaiting audit verification!
      checksum: 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb',
      extracted_text: 'Standard Operating Procedure: Automated de-provisioning triggers via Webhook from BambooHR to Okta API within 1 hour of termination timestamp.',
      created_at: daysAgo(60),
    },
    {
      id: 'evi-pentest-2025',
      org_id: DEMO_ORG.id,
      code: 'EVI-004',
      title: '2025 External Penetration Test Executive Summary',
      description: 'Annual penetration testing report delivered by Bishop Fox on November 2025.',
      original_filename: 'BishopFox_PenTest_Executive_Summary_2025.pdf',
      file_type: 'application/pdf',
      file_size: 1940220,
      storage_path: '/secure-vault/pentest/2025_BishopFox_PenTest.pdf',
      uploaded_by: 'Elena Rostova (CISO)',
      review_status: 'VALID',
      checksum: '3a427f7f18b625c2763f684c3c2e7a3e742c069b2d3989dbf7324838ccb85ebc',
      extracted_text: 'PENETRATION TEST REPORT: Overall security posture was found robust. Identified 1 medium severity finding regarding verbose API error stack traces and 2 low severity findings.',
      created_at: daysAgo(150),
    },
  ];

  for (const ef of evidenceFiles) {
    db.prepare(`
      INSERT INTO evidence_files (id, org_id, code, title, description, original_filename, file_type, file_size, storage_path, uploaded_by, review_status, checksum, extracted_text, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      ef.id, ef.org_id, ef.code, ef.title, ef.description, ef.original_filename,
      ef.file_type, ef.file_size, ef.storage_path, ef.uploaded_by,
      ef.review_status, ef.checksum, ef.extracted_text, ef.created_at
    );
  }

  // 7. Findings & Remediation (SHOWCASING CORE SCENARIOS)
  const findings = [
    // Scenario 1: AC-001 Finding FND-001 marked 'RESOLVED' but UNVERIFIED!
    {
      id: 'fnd-2025-001',
      org_id: DEMO_ORG.id,
      code: 'FND-001',
      title: 'Incomplete User Access Review & Lingering Contractor Accounts',
      description: 'During the 2025 SOC 2 Type II audit, 4 terminated contractor accounts remained active in production AWS IAM for over 45 days past their departure date.',
      audit_id: 'aud-2025-soc2',
      severity: 'HIGH',
      risk_category: 'Access Control',
      root_cause: 'Manual offboarding email notification process failed when contract ended prematurely.',
      business_impact: 'Risk of unauthorized access or data exfiltration via dormant credentials.',
      assigned_owner: 'Alex Kumar (DevOps Lead)',
      date_discovered: '2025-10-21',
      target_remediation_date: daysAgo(45), // Target date passed
      remediation_plan: 'Implement automated BambooHR webhook integration to instantly revoke Okta and AWS access upon employee termination.',
      remediation_status: 'RESOLVED',       // Marked resolved by Alex Kumar
      verification_status: 'UNVERIFIED',    // BUT NO SUBSEQUENT AUDIT TEST OR VERIFICATION RECORDED!
      resolution_evidence_id: 'evi-fnd001-resolution',
      resolution_notes: 'Automated webhook script implemented in AWS Lambda and tested in staging. Marked resolved.',
      verified_by: null,
      verified_at: null,
      exception_reason: null,
      exception_approved_by: null,
      created_at: daysAgo(180),
      updated_at: daysAgo(60),
    },
    // Scenario 2: CM-001 Finding FND-002 (Recurring issue across audits!)
    {
      id: 'fnd-2025-002',
      org_id: DEMO_ORG.id,
      code: 'FND-002',
      title: 'Bypass of Pull Request Code Review During Emergency Hotfixes',
      description: 'Emergency hotfix PR #402 and #415 were merged into production main branch without peer review signoff.',
      audit_id: 'aud-2025-soc2',
      severity: 'HIGH',
      risk_category: 'Change Management',
      root_cause: 'GitHub branch protection allowed repository administrators to force-push emergency fixes without approval.',
      business_impact: 'Potential introduction of unvetted vulnerabilities or system instability into production.',
      assigned_owner: 'Marcus Vance (VP Engineering)',
      date_discovered: '2025-10-29',
      target_remediation_date: daysAgo(30), // Overdue remediation!
      remediation_plan: 'Enforce strict GitHub branch rules removing bypass privileges even for administrators; require automated PagerDuty emergency override tokens with mandatory 24h retrospective review.',
      remediation_status: 'IN_PROGRESS',
      verification_status: 'UNVERIFIED',
      resolution_evidence_id: null,
      resolution_notes: 'Jira ticket ENG-890 opened. Configuration updated in GitHub for 3 of 5 production repositories.',
      verified_by: null,
      verified_at: null,
      created_at: daysAgo(175),
      updated_at: daysAgo(20),
    },
    // Scenario 3: FND-003 Recurring ISO finding
    {
      id: 'fnd-2025-003',
      org_id: DEMO_ORG.id,
      code: 'FND-003',
      title: 'Lack of Retrospective Documentation on Emergency Changes',
      description: 'ISO 27001 audit identified emergency change applied November 14 lacking completed post-deployment documentation.',
      audit_id: 'aud-2025-iso',
      severity: 'MEDIUM',
      risk_category: 'Change Management',
      root_cause: 'Engineers neglected to fill out retrospective form following midnight incident resolution.',
      business_impact: 'Non-conformity with ISO 27001 change documentation procedures.',
      assigned_owner: 'Marcus Vance (VP Engineering)',
      date_discovered: '2025-12-06',
      target_remediation_date: daysAgo(15), // OVERDUE!
      remediation_plan: 'Create automated Slack bot reminding on-call engineers to submit post-mortem docs within 24 hours of incident close.',
      remediation_status: 'ASSIGNED',
      verification_status: 'UNVERIFIED',
      resolution_evidence_id: null,
      resolution_notes: null,
      verified_by: null,
      verified_at: null,
      created_at: daysAgo(140),
      updated_at: daysAgo(140),
    },
    // Scenario 4: FND-004 Pen-test verbose error traces (Resolved and Verified!)
    {
      id: 'fnd-2025-004',
      org_id: DEMO_ORG.id,
      code: 'FND-004',
      title: 'Verbose Stack Trace Leakage in GraphQL Public API',
      description: 'Bishop Fox pen-test discovered GraphQL API 500 responses exposed internal PostgreSQL query structures and database schema names.',
      audit_id: null,
      severity: 'MEDIUM',
      risk_category: 'Application Security',
      root_cause: 'Apollo Server debug mode was inadvertently left enabled in production environment flags.',
      business_impact: 'Information disclosure aiding targeted SQL injection attempts.',
      assigned_owner: 'Alex Kumar (DevOps Lead)',
      date_discovered: '2025-11-20',
      target_remediation_date: daysAgo(90),
      remediation_plan: 'Disable Apollo Server debug flag in production helm values and implement generic error masking middleware.',
      remediation_status: 'RESOLVED',
      verification_status: 'VERIFIED', // Fully verified!
      resolution_evidence_id: 'evi-pentest-2025',
      resolution_notes: 'Pull request #502 merged. Production curl tests verify sanitized JSON error payloads.',
      verified_by: 'Elena Rostova (CISO)',
      verified_at: daysAgo(85),
      created_at: daysAgo(150),
      updated_at: daysAgo(85),
    },
  ];

  for (const f of findings) {
    db.prepare(`
      INSERT INTO findings (
        id, org_id, code, title, description, audit_id, severity, risk_category,
        root_cause, business_impact, assigned_owner, date_discovered, target_remediation_date,
        remediation_plan, remediation_status, verification_status, resolution_evidence_id,
        resolution_notes, verified_by, verified_at, exception_reason, exception_approved_by,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      f.id,
      f.org_id,
      f.code,
      f.title,
      f.description,
      f.audit_id || null,
      f.severity,
      f.risk_category,
      f.root_cause || null,
      f.business_impact || null,
      f.assigned_owner,
      f.date_discovered,
      f.target_remediation_date,
      f.remediation_plan || null,
      f.remediation_status,
      f.verification_status,
      f.resolution_evidence_id || null,
      f.resolution_notes || null,
      f.verified_by || null,
      f.verified_at || null,
      f.exception_reason || null,
      f.exception_approved_by || null,
      f.created_at,
      f.updated_at
    );
  }

  // Link findings to controls
  const findingControls = [
    { finding_id: 'fnd-2025-001', control_id: 'ctrl-ac-001' },
    { finding_id: 'fnd-2025-002', control_id: 'ctrl-cm-001' },
    { finding_id: 'fnd-2025-003', control_id: 'ctrl-cm-001' },
    { finding_id: 'fnd-2025-004', control_id: 'ctrl-vm-002' },
  ];
  for (const fc of findingControls) {
    db.prepare('INSERT OR IGNORE INTO finding_controls (finding_id, control_id) VALUES (?, ?)').run(fc.finding_id, fc.control_id);
  }

  // 8. Policy Changes & Impact Assessment
  const policyChanges = [
    {
      id: 'pc-2026-nist-800-63b',
      org_id: DEMO_ORG.id,
      code: 'CHG-2026-01',
      title: 'NIST SP 800-63B Digital Identity Guidelines Revision (AAL2 / Passkeys)',
      description: 'NIST issued updated recommendations discouraging mandatory periodic password expiration in favor of phishing-resistant FIDO2 passkeys and adaptive risk-based authentication.',
      source: 'National Institute of Standards and Technology (NIST)',
      publication_date: '2026-02-15',
      effective_date: '2026-06-01',
      date_discovered: daysAgo(30),
      impact_summary: 'May require revising password rotation policies and updating control IA-001 and AC-001 to support passwordless FIDO2 WebAuthn tokens.',
      review_owner: 'Elena Rostova (CISO)',
      review_status: 'PENDING_REVIEW', // Needs review!
      created_at: daysAgo(30),
    },
    {
      id: 'pc-2026-sec-cyber-disclosure',
      org_id: DEMO_ORG.id,
      code: 'CHG-2026-02',
      title: 'SEC Incident Materiality & 4-Day Cyber Disclosure Enforcement Update',
      description: 'Clarification regarding Item 1.05 Form 8-K reporting requirements for material cybersecurity incidents, tightening board oversight requirements.',
      source: 'U.S. Securities and Exchange Commission',
      publication_date: '2026-01-10',
      effective_date: '2026-03-01',
      date_discovered: daysAgo(50),
      impact_summary: 'Affects IR-001 Incident Response Plan to mandate 96-hour regulatory disclosure timelines and formal board briefing protocol.',
      review_owner: 'Sarah Jenkins (Privacy Officer)',
      review_status: 'ACTION_REQUIRED',
      created_at: daysAgo(50),
    },
  ];

  for (const pc of policyChanges) {
    db.prepare(`
      INSERT INTO policy_changes (id, org_id, code, title, description, source, publication_date, effective_date, date_discovered, impact_summary, review_owner, review_status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      pc.id, pc.org_id, pc.code, pc.title, pc.description, pc.source,
      pc.publication_date, pc.effective_date, pc.date_discovered,
      pc.impact_summary, pc.review_owner, pc.review_status, pc.created_at
    );
  }

  // Policy Impact Assessments
  const assessments = [
    {
      id: 'pia-001',
      org_id: DEMO_ORG.id,
      policy_change_id: 'pc-2026-nist-800-63b',
      control_id: 'ctrl-ia-001',
      requirement_id: 'req-soc2-cc6.1',
      impact_level: 'HIGH',
      notes: 'Control IA-001 currently permits SMS OTP as a fallback. NIST revision explicitly flags SMS OTP as vulnerable to SIM-swap attacks and mandates phasing it out in favor of hardware FIDO2 or TOTP.',
      proposed_action: 'Deprecate SMS OTP in Okta policy by Q2 2026; mandate YubiKey or authenticator app for 100% of employees.',
      status: 'PROPOSED',
      reviewed_by: null,
      reviewed_at: null,
      created_at: daysAgo(25),
    },
    {
      id: 'pia-002',
      org_id: DEMO_ORG.id,
      policy_change_id: 'pc-2026-sec-cyber-disclosure',
      control_id: 'ctrl-ir-001',
      requirement_id: null,
      impact_level: 'HIGH',
      notes: 'IR-001 incident playbook must explicitly integrate legal counsel triage within 24 hours of severity 1 incident declaration to determine SEC Form 8-K materiality.',
      proposed_action: 'Update Incident Response SOP Section 4.2 (Regulatory Reporting) and conduct tabletop rehearsal with General Counsel.',
      status: 'PROPOSED',
      reviewed_by: null,
      reviewed_at: null,
      created_at: daysAgo(40),
    },
  ];

  for (const pia of assessments) {
    db.prepare(`
      INSERT INTO policy_impact_assessments (id, org_id, policy_change_id, control_id, requirement_id, impact_level, notes, proposed_action, status, reviewed_by, reviewed_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      pia.id, pia.org_id, pia.policy_change_id, pia.control_id, pia.requirement_id,
      pia.impact_level, pia.notes, pia.proposed_action, pia.status,
      pia.reviewed_by, pia.reviewed_at, pia.created_at
    );
  }

  // 9. Risk Register (5x5 matrix calculations)
  const risks = [
    {
      id: 'rsk-001',
      org_id: DEMO_ORG.id,
      code: 'RSK-001',
      title: 'Privileged Cloud Account Takeover via Phishing or Session Hijacking',
      description: 'An attacker compromises an AWS IAM or Kubernetes administrative credential leading to multi-tenant customer data exfiltration.',
      category: 'Information Security',
      likelihood: 4,
      impact: 5,
      inherent_score: 20, // 4 * 5 = 20 (Critical)
      mitigations: 'MFA enforced (IA-001), Teleport JIT access with 2-hour timeout (AC-002), and Datadog CloudTrail anomaly detection (CC-001).',
      residual_score: 8,  // Reduced to 8 (Medium)
      owner: 'Elena Rostova (CISO)',
      treatment_plan: 'MITIGATE',
      review_date: daysFromNow(60),
      status: 'ACTIVE',
      created_at: daysAgo(300),
      updated_at: daysAgo(30),
    },
    {
      id: 'rsk-002',
      org_id: DEMO_ORG.id,
      code: 'RSK-002',
      title: 'Unvetted Emergency Production Deployment Introducing Data Corruption',
      description: 'An unreviewed emergency hotfix deployed directly into main bypasses testing and introduces regression into production database.',
      category: 'Operational Risk',
      likelihood: 4,
      impact: 4,
      inherent_score: 16, // High
      mitigations: 'Branch protection rules (CM-001), automated CI smoke testing, RDS cross-region point-in-time recovery (BC-001).',
      residual_score: 12, // High (due to recurring audit findings FND-002 and FND-003)
      owner: 'Marcus Vance (VP Engineering)',
      treatment_plan: 'MITIGATE',
      review_date: daysFromNow(30),
      status: 'ACTIVE',
      created_at: daysAgo(300),
      updated_at: daysAgo(10),
    },
    {
      id: 'rsk-003',
      org_id: DEMO_ORG.id,
      code: 'RSK-003',
      title: 'Third-Party SaaS Sub-Processor Data Breach',
      description: 'A critical analytics or infrastructure vendor experiences a breach exposing customer telemetry or PII.',
      category: 'Third-Party Risk',
      likelihood: 3,
      impact: 4,
      inherent_score: 12,
      mitigations: 'Vendor security assessment (VEN-001), SOC 2 report reviews, data minimization protocols.',
      residual_score: 9,
      owner: 'Sarah Jenkins (Privacy Officer)',
      treatment_plan: 'MITIGATE',
      review_date: daysFromNow(90),
      status: 'ACTIVE',
      created_at: daysAgo(250),
      updated_at: daysAgo(40),
    },
  ];

  for (const r of risks) {
    db.prepare(`
      INSERT INTO risks (id, org_id, code, title, description, category, likelihood, impact, inherent_score, mitigations, residual_score, owner, treatment_plan, review_date, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      r.id, r.org_id, r.code, r.title, r.description, r.category,
      r.likelihood, r.impact, r.inherent_score, r.mitigations,
      r.residual_score, r.owner, r.treatment_plan, r.review_date,
      r.status, r.created_at, r.updated_at
    );
  }

  // 10. Initial Activity Logs
  const activityLogs = [
    {
      org_id: DEMO_ORG.id,
      actor_name: 'Jonathan Vance',
      actor_email: 'jvance@kroll-audit.com',
      action: 'AUDIT_COMPLETED',
      entity_type: 'AUDIT',
      entity_id: 'aud-2025-soc2',
      after_state: { code: 'AUD-2025-01', status: 'COMPLETED' },
      reason: 'Formal audit conclusion and report sign-off.',
      created_at: daysAgo(175),
    },
    {
      org_id: DEMO_ORG.id,
      actor_name: 'Alex Kumar',
      actor_email: 'alex.kumar@northstar.internal',
      action: 'FINDING_UPDATED',
      entity_type: 'FINDING',
      entity_id: 'fnd-2025-001',
      before_state: { remediation_status: 'IN_PROGRESS' },
      after_state: { remediation_status: 'RESOLVED', verification_status: 'UNVERIFIED' },
      reason: 'Automated de-provisioning script deployed to AWS Lambda. Awaiting audit verification.',
      created_at: daysAgo(60),
    },
    {
      org_id: DEMO_ORG.id,
      actor_name: 'Elena Rostova',
      actor_email: 'elena.rostova@northstar.internal',
      action: 'POLICY_CHANGE_ADDED',
      entity_type: 'POLICY_CHANGE',
      entity_id: 'pc-2026-nist-800-63b',
      after_state: { code: 'CHG-2026-01', title: 'NIST SP 800-63B Revision' },
      reason: 'Published guidelines require impact assessment against IAM controls.',
      created_at: daysAgo(30),
    },
  ];

  for (const log of activityLogs) {
    dbRepository.logActivity(log);
  }
}
