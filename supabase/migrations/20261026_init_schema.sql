-- ==============================================================================
-- AUDITMIND - ENTERPRISE AI COMPLIANCE & AUDIT MANAGEMENT PLATFORM
-- Schema Migration: 20261026_init_schema.sql
-- PostgreSQL / Supabase Schema with Row Level Security (RLS) & Foreign Keys
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Organizations
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    industry VARCHAR(100),
    is_demo BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. User Profiles
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY, -- references auth.users(id)
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'VIEWER', -- ADMIN, COMPLIANCE_MANAGER, AUDITOR, CONTROL_OWNER, VIEWER
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Organization Memberships
CREATE TABLE IF NOT EXISTS organization_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'VIEWER',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, user_id)
);

-- 4. Regulatory Requirements
CREATE TABLE IF NOT EXISTS requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    framework VARCHAR(100) NOT NULL, -- SOC 2, ISO 27001, HIPAA, NIST CSF, GDPR, PCI-DSS
    issuing_authority VARCHAR(150),
    jurisdiction VARCHAR(100),
    effective_date DATE,
    last_reviewed_date DATE,
    status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, RETIRED, PROPOSED
    owner VARCHAR(150),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, code)
);

-- 5. Compliance Controls
CREATE TABLE IF NOT EXISTS controls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    objective TEXT,
    category VARCHAR(100) NOT NULL, -- Access Control, Data Protection, Incident Response, Change Management, Cryptography, Business Continuity
    control_type VARCHAR(50) NOT NULL DEFAULT 'PREVENTIVE', -- PREVENTIVE, DETECTIVE, CORRECTIVE
    risk_level VARCHAR(50) NOT NULL DEFAULT 'MEDIUM', -- CRITICAL, HIGH, MEDIUM, LOW
    testing_frequency VARCHAR(50) NOT NULL DEFAULT 'QUARTERLY', -- MONTHLY, QUARTERLY, SEMI_ANNUALLY, ANNUALLY
    implementation_status VARCHAR(50) NOT NULL DEFAULT 'IMPLEMENTED', -- PLANNED, IMPLEMENTED, PARTIALLY_IMPLEMENTED, NOT_IMPLEMENTED, RETIRED
    owner VARCHAR(150) NOT NULL,
    evidence_requirements TEXT,
    is_archived BOOLEAN DEFAULT FALSE,
    last_tested_date TIMESTAMPTZ,
    next_due_date TIMESTAMPTZ,
    latest_test_result VARCHAR(50) DEFAULT 'NOT_TESTED', -- PASS, FAIL, PARTIALLY_EFFECTIVE, NOT_TESTED, UNABLE_TO_CONCLUDE
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, code)
);

-- 6. Control Requirement Mappings
CREATE TABLE IF NOT EXISTS control_requirement_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    control_id UUID NOT NULL REFERENCES controls(id) ON DELETE CASCADE,
    requirement_id UUID NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(control_id, requirement_id)
);

-- 7. Audit Engagements
CREATE TABLE IF NOT EXISTS audits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    audit_type VARCHAR(100) NOT NULL, -- Internal, External, SOC 2 Type II, ISO 27001 Surveillance
    framework VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    lead_auditor VARCHAR(150) NOT NULL,
    participants TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'PLANNED', -- DRAFT, PLANNED, IN_PROGRESS, UNDER_REVIEW, COMPLETED, ARCHIVED
    summary TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, code)
);

-- 8. Audit Control Scope
CREATE TABLE IF NOT EXISTS audit_control_scopes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
    control_id UUID NOT NULL REFERENCES controls(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(audit_id, control_id)
);

-- 9. Control Tests (Append-Only Historical Records)
CREATE TABLE IF NOT EXISTS control_tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    control_id UUID NOT NULL REFERENCES controls(id) ON DELETE CASCADE,
    audit_id UUID REFERENCES audits(id) ON DELETE SET NULL,
    test_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tester VARCHAR(150) NOT NULL,
    test_objective TEXT NOT NULL,
    test_procedure TEXT NOT NULL,
    sample_description TEXT,
    result VARCHAR(50) NOT NULL, -- PASS, FAIL, PARTIALLY_EFFECTIVE, UNABLE_TO_CONCLUDE
    exceptions TEXT,
    conclusion TEXT NOT NULL,
    notes TEXT,
    review_status VARCHAR(50) NOT NULL DEFAULT 'APPROVED', -- PENDING_REVIEW, APPROVED, REJECTED
    reviewer VARCHAR(150),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Audit Findings
CREATE TABLE IF NOT EXISTS findings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    audit_id UUID REFERENCES audits(id) ON DELETE SET NULL,
    severity VARCHAR(50) NOT NULL DEFAULT 'MEDIUM', -- CRITICAL, HIGH, MEDIUM, LOW, INFORMATIONAL
    risk_category VARCHAR(100) NOT NULL,
    root_cause TEXT,
    business_impact TEXT,
    assigned_owner VARCHAR(150) NOT NULL,
    date_discovered DATE NOT NULL DEFAULT CURRENT_DATE,
    target_remediation_date DATE NOT NULL,
    remediation_plan TEXT,
    remediation_status VARCHAR(50) NOT NULL DEFAULT 'OPEN', -- OPEN, ASSIGNED, IN_PROGRESS, BLOCKED, PENDING_VERIFICATION, RESOLVED, ACCEPTED_EXCEPTION
    verification_status VARCHAR(50) NOT NULL DEFAULT 'UNVERIFIED', -- UNVERIFIED, PENDING_VERIFICATION, VERIFIED, REJECTED
    resolution_evidence_id UUID,
    resolution_notes TEXT,
    verified_by VARCHAR(150),
    verified_at TIMESTAMPTZ,
    exception_reason TEXT,
    exception_approved_by VARCHAR(150),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, code)
);

-- 11. Finding Controls Mappings
CREATE TABLE IF NOT EXISTS finding_controls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    finding_id UUID NOT NULL REFERENCES findings(id) ON DELETE CASCADE,
    control_id UUID NOT NULL REFERENCES controls(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(finding_id, control_id)
);

-- 12. Remediation Tasks
CREATE TABLE IF NOT EXISTS remediation_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    finding_id UUID NOT NULL REFERENCES findings(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_to VARCHAR(150) NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN', -- OPEN, IN_PROGRESS, COMPLETED, CANCELLED
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Evidence Files
CREATE TABLE IF NOT EXISTS evidence_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    original_filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    storage_path TEXT NOT NULL,
    uploaded_by VARCHAR(150) NOT NULL,
    review_status VARCHAR(50) NOT NULL DEFAULT 'VALID', -- VALID, PENDING_REVIEW, REJECTED, EXPIRED
    review_notes TEXT,
    checksum VARCHAR(64),
    extracted_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, code)
);

-- 14. Evidence Links
CREATE TABLE IF NOT EXISTS evidence_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    evidence_id UUID NOT NULL REFERENCES evidence_files(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL, -- CONTROL, AUDIT, TEST, FINDING
    entity_id UUID NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(evidence_id, entity_type, entity_id)
);

-- 15. Regulatory Policies
CREATE TABLE IF NOT EXISTS policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    version VARCHAR(20) NOT NULL DEFAULT '1.0',
    content TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- DRAFT, ACTIVE, UNDER_REVIEW, RETIRED
    owner VARCHAR(150) NOT NULL,
    review_date DATE NOT NULL,
    last_reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, code)
);

-- 16. Policy Changes & External Updates
CREATE TABLE IF NOT EXISTS policy_changes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    source VARCHAR(255) NOT NULL,
    publication_date DATE,
    effective_date DATE,
    date_discovered DATE NOT NULL DEFAULT CURRENT_DATE,
    impact_summary TEXT,
    review_owner VARCHAR(150) NOT NULL,
    review_status VARCHAR(50) NOT NULL DEFAULT 'PENDING_REVIEW', -- PENDING_REVIEW, REVIEWED, ACTION_REQUIRED, DISMISSED
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, code)
);

-- 17. Policy Impact Assessments
CREATE TABLE IF NOT EXISTS policy_impact_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    policy_change_id UUID NOT NULL REFERENCES policy_changes(id) ON DELETE CASCADE,
    control_id UUID REFERENCES controls(id) ON DELETE CASCADE,
    requirement_id UUID REFERENCES requirements(id) ON DELETE CASCADE,
    impact_level VARCHAR(50) NOT NULL DEFAULT 'MEDIUM', -- HIGH, MEDIUM, LOW, NONE
    notes TEXT,
    proposed_action TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'PROPOSED', -- PROPOSED, APPROVED, REJECTED
    reviewed_by VARCHAR(150),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. Risk Register
CREATE TABLE IF NOT EXISTS risks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    likelihood INT NOT NULL CHECK (likelihood BETWEEN 1 AND 5),
    impact INT NOT NULL CHECK (impact BETWEEN 1 AND 5),
    inherent_score INT NOT NULL, -- likelihood * impact (1-25)
    mitigations TEXT,
    residual_score INT NOT NULL, -- assessed after mitigations
    owner VARCHAR(150) NOT NULL,
    treatment_plan VARCHAR(100) NOT NULL DEFAULT 'MITIGATE', -- MITIGATE, ACCEPT, TRANSFER, AVOID
    review_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, MONITORED, CLOSED
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, code)
);

-- 19. Risk Control Links
CREATE TABLE IF NOT EXISTS risk_controls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    risk_id UUID NOT NULL REFERENCES risks(id) ON DELETE CASCADE,
    control_id UUID NOT NULL REFERENCES controls(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(risk_id, control_id)
);

-- 20. Detected Compliance Gaps (Deterministic Engine Output)
CREATE TABLE IF NOT EXISTS detected_gaps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    gap_type VARCHAR(100) NOT NULL, -- OVERDUE_TESTING, MISSING_TEST_HISTORY, MISSING_EVIDENCE, UNVERIFIED_REMEDIATION, OVERDUE_REMEDIATION, RECURRING_FINDING, STALE_POLICY_REVIEW, POLICY_CHANGE_IMPACT, UNREVIEWED_TEST
    severity VARCHAR(50) NOT NULL DEFAULT 'MEDIUM', -- CRITICAL, HIGH, MEDIUM, LOW
    title VARCHAR(255) NOT NULL,
    explanation TEXT NOT NULL,
    related_entity_type VARCHAR(50) NOT NULL, -- CONTROL, FINDING, AUDIT, POLICY, TEST
    related_entity_id UUID NOT NULL,
    suggested_action TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, RESOLVED, DISMISSED, UNDER_REVIEW
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    UNIQUE(org_id, gap_type, related_entity_type, related_entity_id, status)
);

-- 21. In-App Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    category VARCHAR(100) NOT NULL, -- OVERDUE_TEST, OVERDUE_REMEDIATION, UNVERIFIED_REMEDIATION, MISSING_EVIDENCE, POLICY_ALERT, AUDIT_EVENT
    priority VARCHAR(50) NOT NULL DEFAULT 'MEDIUM', -- CRITICAL, HIGH, MEDIUM, LOW
    link_url VARCHAR(255),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 22. Immutable Audit Activity Logs
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    actor_name VARCHAR(150) NOT NULL,
    actor_email VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL, -- CONTROL_CREATED, TEST_RECORDED, FINDING_UPDATED, REMEDIATION_VERIFIED, EVIDENCE_UPLOADED, etc.
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    before_state JSONB,
    after_state JSONB,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 23. AI Conversations & Grounded Citations
CREATE TABLE IF NOT EXISTS ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL, -- user, assistant, system
    content TEXT NOT NULL,
    tool_calls JSONB,
    citations JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 24. Scheduled Monitoring Execution Runs
CREATE TABLE IF NOT EXISTS scheduled_job_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    job_name VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL, -- SUCCESS, FAILED, RUNNING
    summary TEXT,
    details JSONB,
    executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_controls_org_category ON controls(org_id, category);
CREATE INDEX IF NOT EXISTS idx_controls_org_status ON controls(org_id, implementation_status);
CREATE INDEX IF NOT EXISTS idx_controls_org_due ON controls(org_id, next_due_date);
CREATE INDEX IF NOT EXISTS idx_tests_control_date ON control_tests(control_id, test_date DESC);
CREATE INDEX IF NOT EXISTS idx_findings_org_status ON findings(org_id, remediation_status);
CREATE INDEX IF NOT EXISTS idx_findings_org_severity ON findings(org_id, severity);
CREATE INDEX IF NOT EXISTS idx_evidence_org_type ON evidence_files(org_id, file_type);
CREATE INDEX IF NOT EXISTS idx_gaps_org_status ON detected_gaps(org_id, status);
CREATE INDEX IF NOT EXISTS idx_activity_org_date ON activity_logs(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_org_read ON notifications(org_id, is_read);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE control_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE remediation_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_impact_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE detected_gaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_job_runs ENABLE ROW LEVEL SECURITY;

-- Helper function: Get user organizations
CREATE OR REPLACE FUNCTION get_user_org_ids()
RETURNS SETOF UUID AS $$
    SELECT org_id FROM organization_members WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Organization Access Policies (Users can only access records from their organizations)
CREATE POLICY org_member_isolation_controls ON controls
    FOR ALL USING (org_id IN (SELECT get_user_org_ids()));

CREATE POLICY org_member_isolation_audits ON audits
    FOR ALL USING (org_id IN (SELECT get_user_org_ids()));

CREATE POLICY org_member_isolation_tests ON control_tests
    FOR ALL USING (org_id IN (SELECT get_user_org_ids()));

CREATE POLICY org_member_isolation_findings ON findings
    FOR ALL USING (org_id IN (SELECT get_user_org_ids()));

CREATE POLICY org_member_isolation_evidence ON evidence_files
    FOR ALL USING (org_id IN (SELECT get_user_org_ids()));

CREATE POLICY org_member_isolation_gaps ON detected_gaps
    FOR ALL USING (org_id IN (SELECT get_user_org_ids()));

CREATE POLICY org_member_isolation_notifications ON notifications
    FOR ALL USING (org_id IN (SELECT get_user_org_ids()));

CREATE POLICY org_member_isolation_activity ON activity_logs
    FOR SELECT USING (org_id IN (SELECT get_user_org_ids()));
