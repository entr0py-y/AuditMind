// ==============================================================================
// AUDITMIND - FINDING REMEDIATION & FORMAL VERIFICATION WORKFLOW
// Manages finding resolution lifecycle: submission of evidence, auditor verification,
// exception acceptance with justification, and immutable history.
// ==============================================================================

import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  User,
  Shield,
  FileCheck2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Lock,
} from 'lucide-react';
import { dbRepository } from '@/lib/db/sqlite-store';
import { DEMO_ORG, seedDemoData } from '@/lib/demo-data';
import { updateFindingWorkflowAction } from '@/lib/actions';
export default async function FindingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  seedDemoData(false);
  const { id } = await params;
  const finding = dbRepository.getFindingById(id);

  if (!finding) {
    notFound();
  }

  const isVerified = finding.remediation_status === 'RESOLVED' && finding.verification_status === 'VERIFIED';
  const isAwaitingVerification = (finding.remediation_status === 'RESOLVED' || finding.remediation_status === 'PENDING_VERIFICATION') && finding.verification_status !== 'VERIFIED';
  const isException = finding.remediation_status === 'ACCEPTED_EXCEPTION';

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <Link
            href="/findings"
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                {finding.code}
              </span>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">{finding.title}</h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Severity: {finding.severity} • Category: {finding.risk_category} • Assigned: {finding.assigned_owner}
            </p>
          </div>
        </div>

        <div>
          {isVerified ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Verified & Closed</span>
            </span>
          ) : isAwaitingVerification ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 animate-pulse">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Awaiting Auditor Verification</span>
            </span>
          ) : isException ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200">
              <span>Accepted Exception</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              <span>Status: {finding.remediation_status}</span>
            </span>
          )}
        </div>
      </div>

      {/* CORE SPECIFICATION & ROOT CAUSE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Deficiency Description & Impact</span>
            </h3>

            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Detailed Description</span>
              <p className="text-xs sm:text-sm text-slate-800 mt-1 leading-relaxed">{finding.description}</p>
            </div>

            {finding.root_cause && (
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Identified Root Cause</span>
                <p className="text-xs text-slate-700 mt-1 bg-slate-50 p-3 rounded-lg border border-slate-100 font-medium">
                  {finding.root_cause}
                </p>
              </div>
            )}

            {finding.business_impact && (
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Business & Regulatory Impact</span>
                <p className="text-xs text-slate-700 mt-1">{finding.business_impact}</p>
              </div>
            )}

            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Agreed Remediation Plan</span>
              <p className="text-xs sm:text-sm text-slate-800 mt-1 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                {finding.remediation_plan || 'Remediation plan is currently being drafted by the assigned owner.'}
              </p>
            </div>

            {finding.resolution_notes && (
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Resolution Notes from Owner</span>
                <p className="text-xs text-slate-800 mt-1 bg-emerald-50/40 p-3 rounded-lg border border-emerald-100">
                  {finding.resolution_notes}
                </p>
              </div>
            )}

            {finding.exception_reason && (
              <div className="p-3 rounded-lg bg-purple-50 border border-purple-200 text-purple-900 text-xs">
                <span className="font-bold">Approved Exception Justification: </span>
                <span>{finding.exception_reason}</span>
                <div className="text-[11px] text-purple-700 mt-1">
                  Authorized by: <strong>{finding.exception_approved_by}</strong>
                </div>
              </div>
            )}
          </div>

          {/* FORMAL REMEDIATION WORKFLOW FORMS */}
          {!isVerified && !isException && (
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-blue-600" />
                <span>Formal Remediation & Verification Actions</span>
              </h3>

              {/* ACTION 1: SUBMIT RESOLUTION EVIDENCE (OWNER) */}
              <div className="p-4 rounded-lg border border-slate-100 bg-slate-50/50 space-y-3">
                <div className="text-xs font-bold text-slate-900">Step 1: Submit Remediation for Verification</div>
                <p className="text-[11px] text-slate-500">
                  Record resolution activities and submit for formal auditor verification.
                </p>
                <form action={updateFindingWorkflowAction} className="space-y-3">
                  <input type="hidden" name="findingId" value={finding.id} />
                  <input type="hidden" name="actionType" value="SUBMIT_RESOLUTION" />
                  <textarea
                    required
                    name="resolutionNotes"
                    rows={2}
                    placeholder="Describe specific remediation performed, pull requests merged, or config changes..."
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                  >
                    Submit for Verification
                  </button>
                </form>
              </div>

              {/* ACTION 2: VERIFY REMEDIATION (AUDITOR) */}
              <div className="p-4 rounded-lg border border-emerald-100 bg-emerald-50/30 space-y-3">
                <div className="text-xs font-bold text-slate-900">Step 2: Formal Auditor Verification</div>
                <p className="text-[11px] text-slate-500">
                  Authorized reviewer verifies resolution evidence and completes re-test.
                </p>
                <form action={updateFindingWorkflowAction} className="space-y-3">
                  <input type="hidden" name="findingId" value={finding.id} />
                  <input type="hidden" name="actionType" value="VERIFY_REMEDIATION" />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      required
                      name="verifiedBy"
                      placeholder="Auditor Name (e.g. Elena Rostova)"
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                    <select name="isApproved" className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold">
                      <option value="true">Approve & Mark Verified Resolved</option>
                      <option value="false">Reject (Return for Further Work)</option>
                    </select>
                  </div>
                  <input
                    name="notes"
                    placeholder="Verification test notes or re-test reference..."
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                  >
                    Record Verification Decision
                  </button>
                </form>
              </div>

              {/* ACTION 3: ACCEPT EXCEPTION */}
              <div className="p-4 rounded-lg border border-purple-100 bg-purple-50/20 space-y-3">
                <div className="text-xs font-bold text-slate-900">Alternative: Formal Risk Acceptance / Exception</div>
                <p className="text-[11px] text-slate-500">
                  Accept residual risk with documented justification and executive approval.
                </p>
                <form action={updateFindingWorkflowAction} className="space-y-3">
                  <input type="hidden" name="findingId" value={finding.id} />
                  <input type="hidden" name="actionType" value="ACCEPT_EXCEPTION" />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      required
                      name="approvedBy"
                      placeholder="Approver (e.g. CISO / VP Eng)"
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                    <input
                      required
                      name="exceptionReason"
                      placeholder="Business justification and compensatory controls..."
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                  >
                    Approve Exception
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* METADATA & SIDEBAR */}
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-3 text-xs">
            <h3 className="text-sm font-semibold text-slate-900">Finding Metadata</h3>

            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-slate-500">Severity</span>
              <span className="font-mono font-bold text-rose-600">{finding.severity}</span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-slate-500">Remediation Status</span>
              <span className="font-semibold text-slate-800">{finding.remediation_status}</span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-slate-500">Verification Status</span>
              <span className="font-semibold text-slate-800">{finding.verification_status}</span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-slate-500">Assigned Owner</span>
              <span className="font-semibold text-slate-800">{finding.assigned_owner}</span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-slate-500">Date Discovered</span>
              <span className="font-mono text-slate-800">{new Date(finding.date_discovered).toLocaleDateString()}</span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-slate-500">Target Deadline</span>
              <span className="font-mono font-bold text-slate-900">{new Date(finding.target_remediation_date).toLocaleDateString()}</span>
            </div>

            {finding.verified_by && (
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Verified By</span>
                <span className="font-semibold text-emerald-700">{finding.verified_by}</span>
              </div>
            )}
          </div>

          {/* RELATED CONTROLS */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" />
              <span>Related Controls ({finding.related_controls?.length || 0})</span>
            </h3>

            {finding.related_controls && finding.related_controls.length > 0 ? (
              <div className="space-y-2">
                {finding.related_controls.map(ctrl => (
                  <Link
                    key={ctrl.id}
                    href={`/controls/${ctrl.id}`}
                    className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-100 flex items-center justify-between text-xs transition-colors group block"
                  >
                    <div>
                      <div className="font-mono font-bold text-slate-900 group-hover:text-blue-600">{ctrl.code}</div>
                      <div className="text-slate-600 mt-0.5">{ctrl.name}</div>
                    </div>
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-white border border-slate-200">
                      {ctrl.latest_test_result}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-400 py-2">No controls mapped to this finding.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
