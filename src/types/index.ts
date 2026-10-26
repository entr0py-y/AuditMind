// ==============================================================================
// AUDITMIND - DOMAIN MODELS & ENUMS
// ==============================================================================

export type Role = 'ADMIN' | 'COMPLIANCE_MANAGER' | 'AUDITOR' | 'CONTROL_OWNER' | 'VIEWER';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  avatar_url?: string;
  created_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  industry?: string;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export type Framework = 'SOC 2' | 'ISO 27001' | 'HIPAA' | 'NIST CSF' | 'GDPR' | 'PCI-DSS' | 'INTERNAL';

export interface Requirement {
  id: string;
  org_id: string;
  code: string;
  name: string;
  description: string;
  framework: Framework;
  issuing_authority?: string;
  jurisdiction?: string;
  effective_date?: string;
  last_reviewed_date?: string;
  status: 'ACTIVE' | 'RETIRED' | 'PROPOSED';
  owner?: string;
  created_at: string;
}

export type ControlCategory = 
  | 'Access Control'
  | 'Data Protection'
  | 'Incident Response'
  | 'Change Management'
  | 'Cryptography'
  | 'Business Continuity'
  | 'Vulnerability Management'
  | 'Vendor Management';

export type ControlType = 'PREVENTIVE' | 'DETECTIVE' | 'CORRECTIVE';
export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type TestingFrequency = 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUALLY' | 'ANNUALLY';
export type ImplementationStatus = 'PLANNED' | 'IMPLEMENTED' | 'PARTIALLY_IMPLEMENTED' | 'NOT_IMPLEMENTED' | 'RETIRED';
export type TestResult = 'PASS' | 'FAIL' | 'PARTIALLY_EFFECTIVE' | 'NOT_TESTED' | 'UNABLE_TO_CONCLUDE';

export interface Control {
  id: string;
  org_id: string;
  code: string;
  name: string;
  description: string;
  objective?: string;
  category: ControlCategory;
  control_type: ControlType;
  risk_level: RiskLevel;
  testing_frequency: TestingFrequency;
  implementation_status: ImplementationStatus;
  owner: string;
  evidence_requirements?: string;
  is_archived: boolean;
  last_tested_date?: string;
  next_due_date?: string;
  latest_test_result: TestResult;
  created_at: string;
  updated_at: string;
  // Join fields
  requirements?: Requirement[];
  tests_count?: number;
  open_findings_count?: number;
}

export type AuditStatus = 'DRAFT' | 'PLANNED' | 'IN_PROGRESS' | 'UNDER_REVIEW' | 'COMPLETED' | 'ARCHIVED';

export interface Audit {
  id: string;
  org_id: string;
  code: string;
  title: string;
  description: string;
  audit_type: string;
  framework: Framework;
  start_date: string;
  end_date: string;
  lead_auditor: string;
  participants?: string;
  status: AuditStatus;
  summary?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  // Computed/Joined
  scoped_controls_count?: number;
  tests_count?: number;
  findings_count?: number;
}

export type TestReviewStatus = 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';

export interface ControlTest {
  id: string;
  org_id: string;
  control_id: string;
  audit_id?: string;
  test_date: string;
  tester: string;
  test_objective: string;
  test_procedure: string;
  sample_description?: string;
  result: TestResult;
  exceptions?: string;
  conclusion: string;
  notes?: string;
  review_status: TestReviewStatus;
  reviewer?: string;
  reviewed_at?: string;
  created_at: string;
  // Joined
  control_code?: string;
  control_name?: string;
  audit_title?: string;
}

export type FindingSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL';
export type RemediationStatus = 
  | 'OPEN'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'BLOCKED'
  | 'PENDING_VERIFICATION'
  | 'RESOLVED'
  | 'ACCEPTED_EXCEPTION';

export type VerificationStatus = 'UNVERIFIED' | 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED';

export interface Finding {
  id: string;
  org_id: string;
  code: string;
  title: string;
  description: string;
  audit_id?: string;
  severity: FindingSeverity;
  risk_category: string;
  root_cause?: string;
  business_impact?: string;
  assigned_owner: string;
  date_discovered: string;
  target_remediation_date: string;
  remediation_plan?: string;
  remediation_status: RemediationStatus;
  verification_status: VerificationStatus;
  resolution_evidence_id?: string;
  resolution_notes?: string;
  verified_by?: string;
  verified_at?: string;
  exception_reason?: string;
  exception_approved_by?: string;
  created_at: string;
  updated_at: string;
  // Joined
  audit_code?: string;
  audit_title?: string;
  related_controls?: Control[];
  resolution_evidence_title?: string;
}

export interface RemediationTask {
  id: string;
  org_id: string;
  finding_id: string;
  title: string;
  description?: string;
  assigned_to: string;
  due_date: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface EvidenceFile {
  id: string;
  org_id: string;
  code: string;
  title: string;
  description?: string;
  original_filename: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  uploaded_by: string;
  review_status: 'VALID' | 'PENDING_REVIEW' | 'REJECTED' | 'EXPIRED';
  review_notes?: string;
  checksum?: string;
  extracted_text?: string;
  created_at: string;
  // Joined links
  linked_entities?: {
    entity_type: 'CONTROL' | 'AUDIT' | 'TEST' | 'FINDING';
    entity_id: string;
    entity_name?: string;
  }[];
}

export interface Policy {
  id: string;
  org_id: string;
  code: string;
  title: string;
  version: string;
  content?: string;
  status: 'DRAFT' | 'ACTIVE' | 'UNDER_REVIEW' | 'RETIRED';
  owner: string;
  review_date: string;
  last_reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PolicyChange {
  id: string;
  org_id: string;
  code: string;
  title: string;
  description: string;
  source: string;
  publication_date?: string;
  effective_date?: string;
  date_discovered: string;
  impact_summary?: string;
  review_owner: string;
  review_status: 'PENDING_REVIEW' | 'REVIEWED' | 'ACTION_REQUIRED' | 'DISMISSED';
  created_at: string;
  // Joined
  assessments_count?: number;
}

export interface PolicyImpactAssessment {
  id: string;
  org_id: string;
  policy_change_id: string;
  control_id?: string;
  requirement_id?: string;
  impact_level: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
  notes?: string;
  proposed_action?: string;
  status: 'PROPOSED' | 'APPROVED' | 'REJECTED';
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  // Joined
  control_code?: string;
  control_name?: string;
}

export interface Risk {
  id: string;
  org_id: string;
  code: string;
  title: string;
  description: string;
  category: string;
  likelihood: number; // 1-5
  impact: number; // 1-5
  inherent_score: number; // 1-25
  mitigations?: string;
  residual_score: number; // 1-25
  owner: string;
  treatment_plan: 'MITIGATE' | 'ACCEPT' | 'TRANSFER' | 'AVOID';
  review_date: string;
  status: 'ACTIVE' | 'MONITORED' | 'CLOSED';
  created_at: string;
  updated_at: string;
  related_controls?: Control[];
}

export type GapType = 
  | 'OVERDUE_TESTING'
  | 'MISSING_TEST_HISTORY'
  | 'MISSING_EVIDENCE'
  | 'UNVERIFIED_REMEDIATION'
  | 'OVERDUE_REMEDIATION'
  | 'RECURRING_FINDING'
  | 'STALE_POLICY_REVIEW'
  | 'POLICY_CHANGE_IMPACT'
  | 'UNREVIEWED_TEST'
  | 'UPCOMING_DEADLINE';

export interface DetectedGap {
  id: string;
  org_id: string;
  gap_type: GapType;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  explanation: string;
  related_entity_type: 'CONTROL' | 'FINDING' | 'AUDIT' | 'POLICY' | 'TEST';
  related_entity_id: string;
  suggested_action?: string;
  status: 'ACTIVE' | 'RESOLVED' | 'DISMISSED' | 'UNDER_REVIEW';
  detected_at: string;
  resolved_at?: string;
  // Joined metadata
  entity_code?: string;
  entity_title?: string;
}

export interface NotificationItem {
  id: string;
  org_id: string;
  title: string;
  message: string;
  category: 'OVERDUE_TEST' | 'OVERDUE_REMEDIATION' | 'UNVERIFIED_REMEDIATION' | 'MISSING_EVIDENCE' | 'POLICY_ALERT' | 'AUDIT_EVENT';
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  link_url?: string;
  is_read: boolean;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  org_id: string;
  actor_name: string;
  actor_email: string;
  action: string;
  entity_type: string;
  entity_id: string;
  before_state?: Record<string, unknown>;
  after_state?: Record<string, unknown>;
  reason?: string;
  created_at: string;
}

export interface DashboardMetrics {
  totalControls: number;
  passingControls: number;
  failingControls: number;
  overdueControls: number;
  noTestHistoryControls: number;
  openFindings: number;
  highSeverityOpenFindings: number;
  overdueRemediationTasks: number;
  findingsAwaitingVerification: number;
  upcomingAuditsCount: number;
  // Numerator / Denominator breakdowns
  controlTestingRate: { tested: number; total: number; percentage: number };
  controlPassRate: { passed: number; tested: number; percentage: number };
  remediationRate: { verifiedResolved: number; totalFindings: number; percentage: number };
}

export interface AICitation {
  record_id: string;
  entity_type: 'CONTROL' | 'FINDING' | 'AUDIT' | 'TEST' | 'EVIDENCE' | 'POLICY' | 'GAP';
  code: string;
  title: string;
  url: string;
  excerpt?: string;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tool_calls?: {
    name: string;
    arguments: Record<string, unknown>;
    result?: unknown;
  }[];
  citations?: AICitation[];
  proposed_action?: {
    type: string;
    description: string;
    payload: Record<string, unknown>;
    confirmed: boolean;
  };
  created_at: string;
}
