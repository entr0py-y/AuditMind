// ==============================================================================
// AUDITMIND - PERSISTENT SQLITE DATABASE ENGINE (NODE:SQLITE)
// Supports zero-configuration standalone persistence, full relational joins,
// append-only historical audit trail, and seamless demo data hydration.
// ==============================================================================

import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import {
  Organization,
  Control,
  ControlTest,
  Audit,
  Finding,
  RemediationTask,
  EvidenceFile,
  Policy,
  PolicyChange,
  PolicyImpactAssessment,
  Risk,
  DetectedGap,
  NotificationItem,
  ActivityLog,
  AIMessage,
  Requirement,
  DashboardMetrics,
} from '@/types';

const DATA_DIR = path.join(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'auditmind.sqlite');

let dbInstance: DatabaseSync | null = null;

export function getDatabase(): DatabaseSync {
  if (dbInstance) return dbInstance;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  dbInstance = new DatabaseSync(DB_FILE);
  dbInstance.exec('PRAGMA journal_mode = WAL;');
  dbInstance.exec('PRAGMA busy_timeout = 10000;');
  dbInstance.exec('PRAGMA foreign_keys = ON;');

  initSchema(dbInstance);
  return dbInstance;
}

export function closeDatabase(): void {
  if (dbInstance) {
    try {
      dbInstance.close();
    } catch (e) {
      // ignore
    }
    dbInstance = null;
  }
}

function initSchema(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS organizations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      industry TEXT,
      is_demo INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'VIEWER',
      avatar_url TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS requirements (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      framework TEXT NOT NULL,
      issuing_authority TEXT,
      jurisdiction TEXT,
      effective_date TEXT,
      last_reviewed_date TEXT,
      status TEXT DEFAULT 'ACTIVE',
      owner TEXT,
      created_at TEXT NOT NULL,
      UNIQUE(org_id, code)
    );

    CREATE TABLE IF NOT EXISTS controls (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      objective TEXT,
      category TEXT NOT NULL,
      control_type TEXT NOT NULL,
      risk_level TEXT NOT NULL,
      testing_frequency TEXT NOT NULL,
      implementation_status TEXT NOT NULL,
      owner TEXT NOT NULL,
      evidence_requirements TEXT,
      is_archived INTEGER DEFAULT 0,
      last_tested_date TEXT,
      next_due_date TEXT,
      latest_test_result TEXT DEFAULT 'NOT_TESTED',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(org_id, code)
    );

    CREATE TABLE IF NOT EXISTS control_requirements (
      control_id TEXT NOT NULL REFERENCES controls(id) ON DELETE CASCADE,
      requirement_id TEXT NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
      PRIMARY KEY (control_id, requirement_id)
    );

    CREATE TABLE IF NOT EXISTS audits (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      code TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      audit_type TEXT NOT NULL,
      framework TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      lead_auditor TEXT NOT NULL,
      participants TEXT,
      status TEXT NOT NULL,
      summary TEXT,
      completed_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(org_id, code)
    );

    CREATE TABLE IF NOT EXISTS audit_controls (
      audit_id TEXT NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
      control_id TEXT NOT NULL REFERENCES controls(id) ON DELETE CASCADE,
      PRIMARY KEY (audit_id, control_id)
    );

    CREATE TABLE IF NOT EXISTS control_tests (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      control_id TEXT NOT NULL REFERENCES controls(id) ON DELETE CASCADE,
      audit_id TEXT REFERENCES audits(id) ON DELETE SET NULL,
      test_date TEXT NOT NULL,
      tester TEXT NOT NULL,
      test_objective TEXT NOT NULL,
      test_procedure TEXT NOT NULL,
      sample_description TEXT,
      result TEXT NOT NULL,
      exceptions TEXT,
      conclusion TEXT NOT NULL,
      notes TEXT,
      review_status TEXT NOT NULL DEFAULT 'APPROVED',
      reviewer TEXT,
      reviewed_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS findings (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      code TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      audit_id TEXT REFERENCES audits(id) ON DELETE SET NULL,
      severity TEXT NOT NULL,
      risk_category TEXT NOT NULL,
      root_cause TEXT,
      business_impact TEXT,
      assigned_owner TEXT NOT NULL,
      date_discovered TEXT NOT NULL,
      target_remediation_date TEXT NOT NULL,
      remediation_plan TEXT,
      remediation_status TEXT NOT NULL,
      verification_status TEXT NOT NULL,
      resolution_evidence_id TEXT,
      resolution_notes TEXT,
      verified_by TEXT,
      verified_at TEXT,
      exception_reason TEXT,
      exception_approved_by TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(org_id, code)
    );

    CREATE TABLE IF NOT EXISTS finding_controls (
      finding_id TEXT NOT NULL REFERENCES findings(id) ON DELETE CASCADE,
      control_id TEXT NOT NULL REFERENCES controls(id) ON DELETE CASCADE,
      PRIMARY KEY (finding_id, control_id)
    );

    CREATE TABLE IF NOT EXISTS remediation_tasks (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      finding_id TEXT NOT NULL REFERENCES findings(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      assigned_to TEXT NOT NULL,
      due_date TEXT NOT NULL,
      status TEXT NOT NULL,
      completed_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS evidence_files (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      code TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      original_filename TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      storage_path TEXT NOT NULL,
      uploaded_by TEXT NOT NULL,
      review_status TEXT NOT NULL DEFAULT 'VALID',
      review_notes TEXT,
      checksum TEXT,
      extracted_text TEXT,
      created_at TEXT NOT NULL,
      UNIQUE(org_id, code)
    );

    CREATE TABLE IF NOT EXISTS evidence_links (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      evidence_id TEXT NOT NULL REFERENCES evidence_files(id) ON DELETE CASCADE,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL,
      UNIQUE(evidence_id, entity_type, entity_id)
    );

    CREATE TABLE IF NOT EXISTS policies (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      code TEXT NOT NULL,
      title TEXT NOT NULL,
      version TEXT NOT NULL DEFAULT '1.0',
      content TEXT,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      owner TEXT NOT NULL,
      review_date TEXT NOT NULL,
      last_reviewed_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(org_id, code)
    );

    CREATE TABLE IF NOT EXISTS policy_changes (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      code TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      source TEXT NOT NULL,
      publication_date TEXT,
      effective_date TEXT,
      date_discovered TEXT NOT NULL,
      impact_summary TEXT,
      review_owner TEXT NOT NULL,
      review_status TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
      created_at TEXT NOT NULL,
      UNIQUE(org_id, code)
    );

    CREATE TABLE IF NOT EXISTS policy_impact_assessments (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      policy_change_id TEXT NOT NULL REFERENCES policy_changes(id) ON DELETE CASCADE,
      control_id TEXT REFERENCES controls(id) ON DELETE CASCADE,
      requirement_id TEXT REFERENCES requirements(id) ON DELETE CASCADE,
      impact_level TEXT NOT NULL DEFAULT 'MEDIUM',
      notes TEXT,
      proposed_action TEXT,
      status TEXT NOT NULL DEFAULT 'PROPOSED',
      reviewed_by TEXT,
      reviewed_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS risks (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      code TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      likelihood INTEGER NOT NULL,
      impact INTEGER NOT NULL,
      inherent_score INTEGER NOT NULL,
      mitigations TEXT,
      residual_score INTEGER NOT NULL,
      owner TEXT NOT NULL,
      treatment_plan TEXT NOT NULL DEFAULT 'MITIGATE',
      review_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(org_id, code)
    );

    CREATE TABLE IF NOT EXISTS risk_controls (
      risk_id TEXT NOT NULL REFERENCES risks(id) ON DELETE CASCADE,
      control_id TEXT NOT NULL REFERENCES controls(id) ON DELETE CASCADE,
      PRIMARY KEY (risk_id, control_id)
    );

    CREATE TABLE IF NOT EXISTS detected_gaps (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      gap_type TEXT NOT NULL,
      severity TEXT NOT NULL,
      title TEXT NOT NULL,
      explanation TEXT NOT NULL,
      related_entity_type TEXT NOT NULL,
      related_entity_id TEXT NOT NULL,
      suggested_action TEXT,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      detected_at TEXT NOT NULL,
      resolved_at TEXT,
      UNIQUE(org_id, gap_type, related_entity_type, related_entity_id, status)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      category TEXT NOT NULL,
      priority TEXT NOT NULL,
      link_url TEXT,
      is_read INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      actor_name TEXT NOT NULL,
      actor_email TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      before_state TEXT,
      after_state TEXT,
      reason TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ai_conversations (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ai_messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      tool_calls TEXT,
      citations TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS scheduled_job_runs (
      id TEXT PRIMARY KEY,
      org_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
      job_name TEXT NOT NULL,
      status TEXT NOT NULL,
      summary TEXT,
      details TEXT,
      executed_at TEXT NOT NULL
    );
  `);
}

// ==============================================================================
// REPOSITORY LAYER IMPLEMENTATION
// ==============================================================================

export const dbRepository = {
  // Organizations
  getOrganizations(): Organization[] {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM organizations ORDER BY name ASC').all() as any[];
    return rows.map(r => ({ ...r, is_demo: Boolean(r.is_demo) }));
  },

  getOrganizationById(id: string): Organization | null {
    const db = getDatabase();
    const r = db.prepare('SELECT * FROM organizations WHERE id = ?').get(id) as any;
    if (!r) return null;
    return { ...r, is_demo: Boolean(r.is_demo) };
  },

  // Requirements
  getRequirements(orgId: string): Requirement[] {
    const db = getDatabase();
    return db.prepare('SELECT * FROM requirements WHERE org_id = ? ORDER BY code ASC').all(orgId) as unknown as Requirement[];
  },

  // Controls
  getControls(orgId: string, filter?: { category?: string; status?: string; search?: string }): Control[] {
    const db = getDatabase();
    let query = 'SELECT * FROM controls WHERE org_id = ? AND is_archived = 0';
    const params: any[] = [orgId];

    if (filter?.category && filter.category !== 'ALL') {
      query += ' AND category = ?';
      params.push(filter.category);
    }
    if (filter?.status && filter.status !== 'ALL') {
      query += ' AND implementation_status = ?';
      params.push(filter.status);
    }
    if (filter?.search) {
      query += ' AND (code LIKE ? OR name LIKE ? OR description LIKE ?)';
      const s = `%${filter.search}%`;
      params.push(s, s, s);
    }

    query += ' ORDER BY code ASC';
    const controls = db.prepare(query).all(...params) as any[];

    // Fetch test counts and open findings counts
    return controls.map(c => {
      const testsCount = (db.prepare('SELECT COUNT(*) as count FROM control_tests WHERE control_id = ?').get(c.id) as any)?.count || 0;
      const findingsCount = (db.prepare(`
        SELECT COUNT(*) as count FROM findings f
        JOIN finding_controls fc ON f.id = fc.finding_id
        WHERE fc.control_id = ? AND f.remediation_status NOT IN ('RESOLVED', 'ACCEPTED_EXCEPTION')
      `).get(c.id) as any)?.count || 0;

      return {
        ...c,
        is_archived: Boolean(c.is_archived),
        tests_count: testsCount,
        open_findings_count: findingsCount,
      };
    });
  },

  getControlById(id: string): Control | null {
    const db = getDatabase();
    const c = db.prepare('SELECT * FROM controls WHERE id = ?').get(id) as any;
    if (!c) return null;

    const testsCount = (db.prepare('SELECT COUNT(*) as count FROM control_tests WHERE control_id = ?').get(c.id) as any)?.count || 0;
    const findingsCount = (db.prepare(`
      SELECT COUNT(*) as count FROM findings f
      JOIN finding_controls fc ON f.id = fc.finding_id
      WHERE fc.control_id = ? AND f.remediation_status NOT IN ('RESOLVED', 'ACCEPTED_EXCEPTION')
    `).get(c.id) as any)?.count || 0;

    const reqs = db.prepare(`
      SELECT r.* FROM requirements r
      JOIN control_requirements cr ON r.id = cr.requirement_id
      WHERE cr.control_id = ?
    `).all(c.id) as unknown as Requirement[];

    return {
      ...c,
      is_archived: Boolean(c.is_archived),
      tests_count: testsCount,
      open_findings_count: findingsCount,
      requirements: reqs,
    };
  },

  getControlByCode(orgId: string, code: string): Control | null {
    const db = getDatabase();
    const c = db.prepare('SELECT * FROM controls WHERE org_id = ? AND code = ?').get(orgId, code) as any;
    if (!c) return null;
    return this.getControlById(c.id);
  },

  createControl(control: Omit<Control, 'id' | 'created_at' | 'updated_at'>): Control {
    const db = getDatabase();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO controls (
        id, org_id, code, name, description, objective, category, control_type,
        risk_level, testing_frequency, implementation_status, owner,
        evidence_requirements, is_archived, last_tested_date, next_due_date,
        latest_test_result, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      control.org_id,
      control.code,
      control.name,
      control.description,
      control.objective || null,
      control.category,
      control.control_type,
      control.risk_level,
      control.testing_frequency,
      control.implementation_status,
      control.owner,
      control.evidence_requirements || null,
      control.is_archived ? 1 : 0,
      control.last_tested_date || null,
      control.next_due_date || null,
      control.latest_test_result || 'NOT_TESTED',
      now,
      now
    );

    this.logActivity({
      org_id: control.org_id,
      actor_name: 'Compliance Officer',
      actor_email: 'compliance@northstar.internal',
      action: 'CONTROL_CREATED',
      entity_type: 'CONTROL',
      entity_id: id,
      after_state: { code: control.code, name: control.name },
    });

    return this.getControlById(id)!;
  },

  updateControl(id: string, updates: Partial<Control>): Control | null {
    const db = getDatabase();
    const current = this.getControlById(id);
    if (!current) return null;

    const fields: string[] = [];
    const values: any[] = [];

    const allowed = [
      'name', 'description', 'objective', 'category', 'control_type',
      'risk_level', 'testing_frequency', 'implementation_status', 'owner',
      'evidence_requirements', 'is_archived', 'last_tested_date', 'next_due_date',
      'latest_test_result'
    ];

    for (const key of allowed) {
      if ((updates as any)[key] !== undefined) {
        fields.push(`${key} = ?`);
        let val = (updates as any)[key];
        if (key === 'is_archived') val = val ? 1 : 0;
        values.push(val);
      }
    }

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    db.prepare(`UPDATE controls SET ${fields.join(', ')} WHERE id = ?`).run(...values);

    this.logActivity({
      org_id: current.org_id,
      actor_name: 'System / User',
      actor_email: 'user@northstar.internal',
      action: 'CONTROL_UPDATED',
      entity_type: 'CONTROL',
      entity_id: id,
      before_state: current as any,
      after_state: updates as any,
    });

    return this.getControlById(id);
  },

  // Control Tests (Append-Only Historical Records)
  getControlTests(controlId: string): ControlTest[] {
    const db = getDatabase();
    return db.prepare(`
      SELECT ct.*, c.code as control_code, c.name as control_name, a.title as audit_title
      FROM control_tests ct
      JOIN controls c ON ct.control_id = c.id
      LEFT JOIN audits a ON ct.audit_id = a.id
      WHERE ct.control_id = ?
      ORDER BY ct.test_date DESC, ct.created_at DESC
    `).all(controlId) as unknown as unknown as ControlTest[];
  },

  getAllTests(orgId: string): ControlTest[] {
    const db = getDatabase();
    return db.prepare(`
      SELECT ct.*, c.code as control_code, c.name as control_name, a.title as audit_title
      FROM control_tests ct
      JOIN controls c ON ct.control_id = c.id
      LEFT JOIN audits a ON ct.audit_id = a.id
      WHERE ct.org_id = ?
      ORDER BY ct.test_date DESC
    `).all(orgId) as unknown as unknown as ControlTest[];
  },

  recordControlTest(test: Omit<ControlTest, 'id' | 'created_at'>): ControlTest {
    const db = getDatabase();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO control_tests (
        id, org_id, control_id, audit_id, test_date, tester, test_objective,
        test_procedure, sample_description, result, exceptions, conclusion,
        notes, review_status, reviewer, reviewed_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      test.org_id,
      test.control_id,
      test.audit_id || null,
      test.test_date,
      test.tester,
      test.test_objective,
      test.test_procedure,
      test.sample_description || null,
      test.result,
      test.exceptions || null,
      test.conclusion,
      test.notes || null,
      test.review_status || 'APPROVED',
      test.reviewer || null,
      test.reviewed_at || null,
      now
    );

    // Deterministically recalculate control's latest_test_result, last_tested_date, and next_due_date
    const control = this.getControlById(test.control_id);
    if (control) {
      let intervalMonths = 3;
      if (control.testing_frequency === 'MONTHLY') intervalMonths = 1;
      else if (control.testing_frequency === 'QUARTERLY') intervalMonths = 3;
      else if (control.testing_frequency === 'SEMI_ANNUALLY') intervalMonths = 6;
      else if (control.testing_frequency === 'ANNUALLY') intervalMonths = 12;

      const testDateObj = new Date(test.test_date);
      const nextDueObj = new Date(testDateObj);
      nextDueObj.setMonth(nextDueObj.getMonth() + intervalMonths);

      this.updateControl(control.id, {
        latest_test_result: test.result,
        last_tested_date: test.test_date,
        next_due_date: nextDueObj.toISOString(),
      });
    }

    this.logActivity({
      org_id: test.org_id,
      actor_name: test.tester,
      actor_email: 'auditor@northstar.internal',
      action: 'TEST_RECORDED',
      entity_type: 'CONTROL_TEST',
      entity_id: id,
      after_state: { control_id: test.control_id, result: test.result, conclusion: test.conclusion },
    });

    return db.prepare('SELECT * FROM control_tests WHERE id = ?').get(id) as unknown as ControlTest;
  },

  // Audits
  getAudits(orgId: string): Audit[] {
    const db = getDatabase();
    const audits = db.prepare('SELECT * FROM audits WHERE org_id = ? ORDER BY start_date DESC').all(orgId) as any[];

    return audits.map(a => {
      const scopedCount = (db.prepare('SELECT COUNT(*) as count FROM audit_controls WHERE audit_id = ?').get(a.id) as any)?.count || 0;
      const testsCount = (db.prepare('SELECT COUNT(*) as count FROM control_tests WHERE audit_id = ?').get(a.id) as any)?.count || 0;
      const findingsCount = (db.prepare('SELECT COUNT(*) as count FROM findings WHERE audit_id = ?').get(a.id) as any)?.count || 0;

      return {
        ...a,
        scoped_controls_count: scopedCount,
        tests_count: testsCount,
        findings_count: findingsCount,
      };
    });
  },

  getAuditById(id: string): (Audit & { scoped_controls?: Control[]; findings?: Finding[]; tests?: ControlTest[] }) | null {
    const db = getDatabase();
    const a = db.prepare('SELECT * FROM audits WHERE id = ?').get(id) as any;
    if (!a) return null;

    const scoped = db.prepare(`
      SELECT c.* FROM controls c
      JOIN audit_controls ac ON c.id = ac.control_id
      WHERE ac.audit_id = ?
    `).all(a.id) as unknown as Control[];

    const tests = db.prepare(`
      SELECT ct.*, c.code as control_code, c.name as control_name
      FROM control_tests ct
      JOIN controls c ON ct.control_id = c.id
      WHERE ct.audit_id = ?
      ORDER BY ct.test_date DESC
    `).all(a.id) as unknown as unknown as ControlTest[];

    const findings = db.prepare(`
      SELECT * FROM findings WHERE audit_id = ? ORDER BY severity ASC
    `).all(a.id) as unknown as Finding[];

    return {
      ...a,
      scoped_controls: scoped,
      tests,
      findings,
      scoped_controls_count: scoped.length,
      tests_count: tests.length,
      findings_count: findings.length,
    };
  },

  createAudit(audit: Omit<Audit, 'id' | 'created_at' | 'updated_at'> & { control_ids?: string[] }): Audit {
    const db = getDatabase();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO audits (
        id, org_id, code, title, description, audit_type, framework,
        start_date, end_date, lead_auditor, participants, status, summary,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      audit.org_id,
      audit.code,
      audit.title,
      audit.description,
      audit.audit_type,
      audit.framework,
      audit.start_date,
      audit.end_date,
      audit.lead_auditor,
      audit.participants || null,
      audit.status,
      audit.summary || null,
      now,
      now
    );

    if (audit.control_ids && audit.control_ids.length > 0) {
      const stmt = db.prepare('INSERT OR IGNORE INTO audit_controls (audit_id, control_id) VALUES (?, ?)');
      for (const cid of audit.control_ids) {
        stmt.run(id, cid);
      }
    }

    this.logActivity({
      org_id: audit.org_id,
      actor_name: audit.lead_auditor,
      actor_email: 'auditor@northstar.internal',
      action: 'AUDIT_CREATED',
      entity_type: 'AUDIT',
      entity_id: id,
      after_state: { code: audit.code, title: audit.title },
    });

    return this.getAuditById(id)!;
  },

  updateAudit(id: string, updates: Partial<Audit>): Audit | null {
    const db = getDatabase();
    const current = this.getAuditById(id);
    if (!current) return null;

    const fields: string[] = [];
    const values: any[] = [];

    const allowed = ['title', 'description', 'audit_type', 'framework', 'start_date', 'end_date', 'lead_auditor', 'participants', 'status', 'summary', 'completed_at'];

    for (const key of allowed) {
      if ((updates as any)[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push((updates as any)[key]);
      }
    }

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    db.prepare(`UPDATE audits SET ${fields.join(', ')} WHERE id = ?`).run(...values);

    this.logActivity({
      org_id: current.org_id,
      actor_name: 'Lead Auditor',
      actor_email: 'auditor@northstar.internal',
      action: 'AUDIT_UPDATED',
      entity_type: 'AUDIT',
      entity_id: id,
      before_state: current as any,
      after_state: updates as any,
    });

    return this.getAuditById(id);
  },

  // Findings & Remediation
  getFindings(orgId: string, filter?: { status?: string; severity?: string; search?: string }): Finding[] {
    const db = getDatabase();
    let query = `
      SELECT f.*, a.code as audit_code, a.title as audit_title, ef.title as resolution_evidence_title
      FROM findings f
      LEFT JOIN audits a ON f.audit_id = a.id
      LEFT JOIN evidence_files ef ON f.resolution_evidence_id = ef.id
      WHERE f.org_id = ?
    `;
    const params: any[] = [orgId];

    if (filter?.status && filter.status !== 'ALL') {
      query += ' AND f.remediation_status = ?';
      params.push(filter.status);
    }
    if (filter?.severity && filter.severity !== 'ALL') {
      query += ' AND f.severity = ?';
      params.push(filter.severity);
    }
    if (filter?.search) {
      query += ' AND (f.code LIKE ? OR f.title LIKE ? OR f.description LIKE ?)';
      const s = `%${filter.search}%`;
      params.push(s, s, s);
    }

    query += ' ORDER BY f.target_remediation_date ASC, f.created_at DESC';
    const findings = db.prepare(query).all(...params) as any[];

    return findings.map(f => {
      const controls = db.prepare(`
        SELECT c.* FROM controls c
        JOIN finding_controls fc ON c.id = fc.control_id
        WHERE fc.finding_id = ?
      `).all(f.id) as unknown as Control[];

      return {
        ...f,
        related_controls: controls,
      };
    });
  },

  getFindingById(id: string): Finding | null {
    const db = getDatabase();
    const f = db.prepare(`
      SELECT f.*, a.code as audit_code, a.title as audit_title, ef.title as resolution_evidence_title
      FROM findings f
      LEFT JOIN audits a ON f.audit_id = a.id
      LEFT JOIN evidence_files ef ON f.resolution_evidence_id = ef.id
      WHERE f.id = ?
    `).get(id) as any;
    if (!f) return null;

    const controls = db.prepare(`
      SELECT c.* FROM controls c
      JOIN finding_controls fc ON c.id = fc.control_id
      WHERE fc.finding_id = ?
    `).all(f.id) as unknown as Control[];

    return {
      ...f,
      related_controls: controls,
    };
  },

  createFinding(finding: Omit<Finding, 'id' | 'created_at' | 'updated_at'> & { control_ids?: string[] }): Finding {
    const db = getDatabase();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO findings (
        id, org_id, code, title, description, audit_id, severity, risk_category,
        root_cause, business_impact, assigned_owner, date_discovered, target_remediation_date,
        remediation_plan, remediation_status, verification_status, resolution_evidence_id,
        resolution_notes, verified_by, verified_at, exception_reason, exception_approved_by,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      finding.org_id,
      finding.code,
      finding.title,
      finding.description,
      finding.audit_id || null,
      finding.severity,
      finding.risk_category,
      finding.root_cause || null,
      finding.business_impact || null,
      finding.assigned_owner,
      finding.date_discovered,
      finding.target_remediation_date,
      finding.remediation_plan || null,
      finding.remediation_status,
      finding.verification_status,
      finding.resolution_evidence_id || null,
      finding.resolution_notes || null,
      finding.verified_by || null,
      finding.verified_at || null,
      finding.exception_reason || null,
      finding.exception_approved_by || null,
      now,
      now
    );

    if (finding.control_ids && finding.control_ids.length > 0) {
      const stmt = db.prepare('INSERT OR IGNORE INTO finding_controls (finding_id, control_id) VALUES (?, ?)');
      for (const cid of finding.control_ids) {
        stmt.run(id, cid);
      }
    }

    this.logActivity({
      org_id: finding.org_id,
      actor_name: finding.assigned_owner,
      actor_email: 'owner@northstar.internal',
      action: 'FINDING_CREATED',
      entity_type: 'FINDING',
      entity_id: id,
      after_state: { code: finding.code, title: finding.title, severity: finding.severity },
    });

    return this.getFindingById(id)!;
  },

  updateFinding(id: string, updates: Partial<Finding>): Finding | null {
    const db = getDatabase();
    const current = this.getFindingById(id);
    if (!current) return null;

    const fields: string[] = [];
    const values: any[] = [];

    const allowed = [
      'title', 'description', 'severity', 'risk_category', 'root_cause',
      'business_impact', 'assigned_owner', 'target_remediation_date',
      'remediation_plan', 'remediation_status', 'verification_status',
      'resolution_evidence_id', 'resolution_notes', 'verified_by', 'verified_at',
      'exception_reason', 'exception_approved_by'
    ];

    for (const key of allowed) {
      if ((updates as any)[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push((updates as any)[key]);
      }
    }

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    db.prepare(`UPDATE findings SET ${fields.join(', ')} WHERE id = ?`).run(...values);

    this.logActivity({
      org_id: current.org_id,
      actor_name: updates.verified_by || current.assigned_owner,
      actor_email: 'compliance@northstar.internal',
      action: 'FINDING_UPDATED',
      entity_type: 'FINDING',
      entity_id: id,
      before_state: current as any,
      after_state: updates as any,
      reason: updates.resolution_notes || updates.exception_reason || undefined,
    });

    return this.getFindingById(id);
  },

  // Evidence Management
  getEvidenceFiles(orgId: string): EvidenceFile[] {
    const db = getDatabase();
    const files = db.prepare('SELECT * FROM evidence_files WHERE org_id = ? ORDER BY created_at DESC').all(orgId) as unknown as EvidenceFile[];

    return files.map(ef => {
      const links = db.prepare('SELECT entity_type, entity_id, notes FROM evidence_links WHERE evidence_id = ?').all(ef.id) as any[];
      return {
        ...ef,
        linked_entities: links,
      };
    });
  },

  getEvidenceById(id: string): EvidenceFile | null {
    const db = getDatabase();
    const ef = db.prepare('SELECT * FROM evidence_files WHERE id = ?').get(id) as any;
    if (!ef) return null;

    const links = db.prepare('SELECT entity_type, entity_id, notes FROM evidence_links WHERE evidence_id = ?').all(ef.id) as any[];
    return {
      ...ef,
      linked_entities: links,
    };
  },

  createEvidenceFile(file: Omit<EvidenceFile, 'id' | 'created_at'> & { link_to?: { entity_type: string; entity_id: string } }): EvidenceFile {
    const db = getDatabase();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO evidence_files (
        id, org_id, code, title, description, original_filename, file_type,
        file_size, storage_path, uploaded_by, review_status, review_notes,
        checksum, extracted_text, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      file.org_id,
      file.code,
      file.title,
      file.description || null,
      file.original_filename,
      file.file_type,
      file.file_size,
      file.storage_path,
      file.uploaded_by,
      file.review_status || 'VALID',
      file.review_notes || null,
      file.checksum || null,
      file.extracted_text || null,
      now
    );

    if (file.link_to) {
      const linkId = crypto.randomUUID();
      db.prepare(`
        INSERT OR IGNORE INTO evidence_links (id, org_id, evidence_id, entity_type, entity_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(linkId, file.org_id, id, file.link_to.entity_type, file.link_to.entity_id, now);
    }

    this.logActivity({
      org_id: file.org_id,
      actor_name: file.uploaded_by,
      actor_email: 'uploader@northstar.internal',
      action: 'EVIDENCE_UPLOADED',
      entity_type: 'EVIDENCE',
      entity_id: id,
      after_state: { code: file.code, title: file.title, filename: file.original_filename },
    });

    return this.getEvidenceById(id)!;
  },

  linkEvidence(orgId: string, evidenceId: string, entityType: string, entityId: string, notes?: string) {
    const db = getDatabase();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    db.prepare(`
      INSERT OR IGNORE INTO evidence_links (id, org_id, evidence_id, entity_type, entity_id, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, orgId, evidenceId, entityType, entityId, notes || null, now);
  },

  // Policies & Changes
  getPolicies(orgId: string): Policy[] {
    const db = getDatabase();
    return db.prepare('SELECT * FROM policies WHERE org_id = ? ORDER BY code ASC').all(orgId) as unknown as Policy[];
  },

  getPolicyChanges(orgId: string): (PolicyChange & { assessments?: PolicyImpactAssessment[] })[] {
    const db = getDatabase();
    const changes = db.prepare('SELECT * FROM policy_changes WHERE org_id = ? ORDER BY date_discovered DESC').all(orgId) as unknown as unknown as PolicyChange[];

    return changes.map(pc => {
      const assessments = db.prepare(`
        SELECT pia.*, c.code as control_code, c.name as control_name
        FROM policy_impact_assessments pia
        LEFT JOIN controls c ON pia.control_id = c.id
        WHERE pia.policy_change_id = ?
      `).all(pc.id) as unknown as unknown as PolicyImpactAssessment[];

      return {
        ...pc,
        assessments_count: assessments.length,
        assessments,
      };
    });
  },

  createPolicyChange(pc: Omit<PolicyChange, 'id' | 'created_at'>): PolicyChange {
    const db = getDatabase();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO policy_changes (
        id, org_id, code, title, description, source, publication_date,
        effective_date, date_discovered, impact_summary, review_owner,
        review_status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      pc.org_id,
      pc.code,
      pc.title,
      pc.description,
      pc.source,
      pc.publication_date || null,
      pc.effective_date || null,
      pc.date_discovered,
      pc.impact_summary || null,
      pc.review_owner,
      pc.review_status || 'PENDING_REVIEW',
      now
    );

    return db.prepare('SELECT * FROM policy_changes WHERE id = ?').get(id) as unknown as PolicyChange;
  },

  createPolicyImpactAssessment(pia: Omit<PolicyImpactAssessment, 'id' | 'created_at'>): PolicyImpactAssessment {
    const db = getDatabase();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO policy_impact_assessments (
        id, org_id, policy_change_id, control_id, requirement_id, impact_level,
        notes, proposed_action, status, reviewed_by, reviewed_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      pia.org_id,
      pia.policy_change_id,
      pia.control_id || null,
      pia.requirement_id || null,
      pia.impact_level,
      pia.notes || null,
      pia.proposed_action || null,
      pia.status || 'PROPOSED',
      pia.reviewed_by || null,
      pia.reviewed_at || null,
      now
    );

    return db.prepare('SELECT * FROM policy_impact_assessments WHERE id = ?').get(id) as unknown as PolicyImpactAssessment;
  },

  // Risks
  getRisks(orgId: string): Risk[] {
    const db = getDatabase();
    const risks = db.prepare('SELECT * FROM risks WHERE org_id = ? ORDER BY inherent_score DESC').all(orgId) as unknown as unknown as Risk[];
    return risks.map(r => {
      const controls = db.prepare(`
        SELECT c.* FROM controls c
        JOIN risk_controls rc ON c.id = rc.control_id
        WHERE rc.risk_id = ?
      `).all(r.id) as unknown as Control[];
      return {
        ...r,
        related_controls: controls,
      };
    });
  },

  createRisk(risk: Omit<Risk, 'id' | 'created_at' | 'updated_at'> & { control_ids?: string[] }): Risk {
    const db = getDatabase();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO risks (
        id, org_id, code, title, description, category, likelihood, impact,
        inherent_score, mitigations, residual_score, owner, treatment_plan,
        review_date, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      risk.org_id,
      risk.code,
      risk.title,
      risk.description,
      risk.category,
      risk.likelihood,
      risk.impact,
      risk.inherent_score,
      risk.mitigations || null,
      risk.residual_score,
      risk.owner,
      risk.treatment_plan,
      risk.review_date,
      risk.status,
      now,
      now
    );

    if (risk.control_ids && risk.control_ids.length > 0) {
      const stmt = db.prepare('INSERT OR IGNORE INTO risk_controls (risk_id, control_id) VALUES (?, ?)');
      for (const cid of risk.control_ids) {
        stmt.run(id, cid);
      }
    }

    return db.prepare('SELECT * FROM risks WHERE id = ?').get(id) as unknown as Risk;
  },

  // Detected Compliance Gaps
  getDetectedGaps(orgId: string, status = 'ACTIVE'): DetectedGap[] {
    const db = getDatabase();
    return db.prepare(`
      SELECT dg.*
      FROM detected_gaps dg
      WHERE dg.org_id = ? AND dg.status = ?
      ORDER BY 
        CASE dg.severity 
          WHEN 'CRITICAL' THEN 1 
          WHEN 'HIGH' THEN 2 
          WHEN 'MEDIUM' THEN 3 
          ELSE 4 
        END ASC,
        dg.detected_at DESC
    `).all(orgId, status) as unknown as unknown as DetectedGap[];
  },

  upsertGap(gap: Omit<DetectedGap, 'id' | 'detected_at'>): DetectedGap {
    const db = getDatabase();
    const existing = db.prepare(`
      SELECT * FROM detected_gaps 
      WHERE org_id = ? AND gap_type = ? AND related_entity_type = ? AND related_entity_id = ? AND status = 'ACTIVE'
    `).get(gap.org_id, gap.gap_type, gap.related_entity_type, gap.related_entity_id) as any;

    if (existing) {
      db.prepare(`
        UPDATE detected_gaps 
        SET severity = ?, title = ?, explanation = ?, suggested_action = ?
        WHERE id = ?
      `).run(gap.severity, gap.title, gap.explanation, gap.suggested_action || null, existing.id);
      return { ...existing, ...gap };
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO detected_gaps (
        id, org_id, gap_type, severity, title, explanation,
        related_entity_type, related_entity_id, suggested_action, status, detected_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      gap.org_id,
      gap.gap_type,
      gap.severity,
      gap.title,
      gap.explanation,
      gap.related_entity_type,
      gap.related_entity_id,
      gap.suggested_action || null,
      gap.status || 'ACTIVE',
      now
    );

    return db.prepare('SELECT * FROM detected_gaps WHERE id = ?').get(id) as unknown as DetectedGap;
  },

  resolveGap(id: string): void {
    const db = getDatabase();
    const now = new Date().toISOString();
    db.prepare("UPDATE detected_gaps SET status = 'RESOLVED', resolved_at = ? WHERE id = ?").run(now, id);
  },

  // Notifications
  getNotifications(orgId: string): NotificationItem[] {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM notifications WHERE org_id = ? ORDER BY created_at DESC LIMIT 50').all(orgId) as any[];
    return rows.map(r => ({ ...r, is_read: Boolean(r.is_read) }));
  },

  createNotification(notif: Omit<NotificationItem, 'id' | 'created_at'>): NotificationItem {
    const db = getDatabase();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO notifications (id, org_id, title, message, category, priority, link_url, is_read, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      notif.org_id,
      notif.title,
      notif.message,
      notif.category,
      notif.priority,
      notif.link_url || null,
      notif.is_read ? 1 : 0,
      now
    );

    return { ...notif, id, created_at: now };
  },

  markNotificationAsRead(id: string): void {
    const db = getDatabase();
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(id);
  },

  markAllNotificationsRead(orgId: string): void {
    const db = getDatabase();
    db.prepare('UPDATE notifications SET is_read = 1 WHERE org_id = ?').run(orgId);
  },

  // Activity Logs
  logActivity(log: Omit<ActivityLog, 'id' | 'created_at'> & { created_at?: string }): void {
    const db = getDatabase();
    const id = crypto.randomUUID();
    const now = log.created_at || new Date().toISOString();

    db.prepare(`
      INSERT INTO activity_logs (
        id, org_id, actor_name, actor_email, action, entity_type, entity_id,
        before_state, after_state, reason, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      log.org_id,
      log.actor_name,
      log.actor_email,
      log.action,
      log.entity_type,
      log.entity_id,
      log.before_state ? JSON.stringify(log.before_state) : null,
      log.after_state ? JSON.stringify(log.after_state) : null,
      log.reason || null,
      now
    );
  },

  getActivityLogs(orgId: string, limit = 50): ActivityLog[] {
    const db = getDatabase();
    const rows = db.prepare(`
      SELECT * FROM activity_logs WHERE org_id = ? ORDER BY created_at DESC, rowid DESC LIMIT ?
    `).all(orgId, limit) as any[];

    return rows.map(r => ({
      ...r,
      before_state: r.before_state ? JSON.parse(r.before_state) : undefined,
      after_state: r.after_state ? JSON.parse(r.after_state) : undefined,
    }));
  },

  // Scheduled Monitoring Logs
  logScheduledRun(run: { org_id?: string; job_name: string; status: string; summary?: string; details?: any }): void {
    const db = getDatabase();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO scheduled_job_runs (id, org_id, job_name, status, summary, details, executed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      run.org_id || null,
      run.job_name,
      run.status,
      run.summary || null,
      run.details ? JSON.stringify(run.details) : null,
      now
    );
  },

  // Dashboard Metrics Aggregator
  getDashboardMetrics(orgId: string): DashboardMetrics {
    const db = getDatabase();
    const now = new Date().toISOString();

    const totalControls = (db.prepare('SELECT COUNT(*) as c FROM controls WHERE org_id = ? AND is_archived = 0').get(orgId) as any)?.c || 0;
    const passingControls = (db.prepare("SELECT COUNT(*) as c FROM controls WHERE org_id = ? AND is_archived = 0 AND latest_test_result = 'PASS'").get(orgId) as any)?.c || 0;
    const failingControls = (db.prepare("SELECT COUNT(*) as c FROM controls WHERE org_id = ? AND is_archived = 0 AND latest_test_result = 'FAIL'").get(orgId) as any)?.c || 0;
    const noTestHistoryControls = (db.prepare("SELECT COUNT(*) as c FROM controls WHERE org_id = ? AND is_archived = 0 AND latest_test_result = 'NOT_TESTED'").get(orgId) as any)?.c || 0;
    const overdueControls = (db.prepare("SELECT COUNT(*) as c FROM controls WHERE org_id = ? AND is_archived = 0 AND next_due_date IS NOT NULL AND next_due_date < ?").get(orgId, now) as any)?.c || 0;

    const openFindings = (db.prepare("SELECT COUNT(*) as c FROM findings WHERE org_id = ? AND remediation_status NOT IN ('RESOLVED', 'ACCEPTED_EXCEPTION')").get(orgId) as any)?.c || 0;
    const highSeverityOpenFindings = (db.prepare("SELECT COUNT(*) as c FROM findings WHERE org_id = ? AND remediation_status NOT IN ('RESOLVED', 'ACCEPTED_EXCEPTION') AND severity IN ('CRITICAL', 'HIGH')").get(orgId) as any)?.c || 0;
    const overdueRemediationTasks = (db.prepare("SELECT COUNT(*) as c FROM findings WHERE org_id = ? AND remediation_status NOT IN ('RESOLVED', 'ACCEPTED_EXCEPTION') AND target_remediation_date < ?").get(orgId, now) as any)?.c || 0;
    const findingsAwaitingVerification = (db.prepare("SELECT COUNT(*) as c FROM findings WHERE org_id = ? AND (remediation_status = 'PENDING_VERIFICATION' OR (remediation_status = 'RESOLVED' AND verification_status != 'VERIFIED'))").get(orgId) as any)?.c || 0;

    const upcomingAuditsCount = (db.prepare("SELECT COUNT(*) as c FROM audits WHERE org_id = ? AND status IN ('PLANNED', 'IN_PROGRESS')").get(orgId) as any)?.c || 0;

    const testedControls = totalControls - noTestHistoryControls;
    const controlTestingRate = {
      tested: testedControls,
      total: totalControls,
      percentage: totalControls > 0 ? Math.round((testedControls / totalControls) * 100) : 0,
    };

    const controlPassRate = {
      passed: passingControls,
      tested: testedControls,
      percentage: testedControls > 0 ? Math.round((passingControls / testedControls) * 100) : 0,
    };

    const totalFindings = (db.prepare('SELECT COUNT(*) as c FROM findings WHERE org_id = ?').get(orgId) as any)?.c || 0;
    const verifiedResolved = (db.prepare("SELECT COUNT(*) as c FROM findings WHERE org_id = ? AND remediation_status = 'RESOLVED' AND verification_status = 'VERIFIED'").get(orgId) as any)?.c || 0;

    const remediationRate = {
      verifiedResolved,
      totalFindings,
      percentage: totalFindings > 0 ? Math.round((verifiedResolved / totalFindings) * 100) : 0,
    };

    return {
      totalControls,
      passingControls,
      failingControls,
      overdueControls,
      noTestHistoryControls,
      openFindings,
      highSeverityOpenFindings,
      overdueRemediationTasks,
      findingsAwaitingVerification,
      upcomingAuditsCount,
      controlTestingRate,
      controlPassRate,
      remediationRate,
    };
  },
};
