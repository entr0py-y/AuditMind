// ==============================================================================
// AUDITMIND - CONTROL DETAIL & IMMUTABLE TEST HISTORY TIMELINE
// Preserves chronological test records, mapped frameworks, findings, and evidence.
// ==============================================================================

import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Shield,
  ArrowLeft,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  AlertCircle,
  AlertTriangle,
  FileCheck,
  FolderArchive,
  History,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { dbRepository } from '@/lib/db/sqlite-store';
import { auditMemoryService } from '@/lib/services/audit-memory';
import { DEMO_ORG, seedDemoData } from '@/lib/demo-data';
import { QuickActionModals } from '@/components/dashboard/QuickActionModals';
export default async function ControlDetailPage({ params }: { params: Promise<{ id: string }> }) {
  seedDemoData(false);
  const { id } = await params;
  const control = dbRepository.getControlById(id);

  if (!control) {
    notFound();
  }

  const memory = auditMemoryService.getControlMemory(control.id);
  const tests = dbRepository.getControlTests(control.id);
  const allEvidence = dbRepository.getEvidenceFiles(DEMO_ORG.id);
  const linkedEvidence = allEvidence.filter(e =>
    e.linked_entities?.some(le => le.entity_id === control.id)
  );

  const isOverdue = control.next_due_date && new Date(control.next_due_date).getTime() < Date.now();

  return (
    <div className="space-y-6">
      {/* TOP NAVIGATION & ACTION BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <Link
            href="/controls"
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {control.code}
              </span>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">{control.name}</h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Category: {control.category} • Risk: {control.risk_level} • Frequency: {control.testing_frequency}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <QuickActionModals controls={[control]} />
        </div>
      </div>

      {/* MEMORY ALERT BANNER (IF UNVERIFIED REMEDIATION OR RECURRING ISSUES) */}
      {memory?.hasUnverifiedRemediation && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800">
              Audit Memory Warning: Remediation Unverified
            </h4>
            <p className="text-xs text-slate-700 leading-relaxed">
              A previous audit finding associated with this control ({memory.unverifiedFindings.map(f => f.code).join(', ')}) was marked resolved by the control owner. However, <strong>no subsequent control verification test or formal auditor re-test has been recorded</strong>.
            </p>
          </div>
        </div>
      )}

      {/* GRID: CONTROL METADATA & REVIEWS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* LEFT TWO COLUMNS: SPECIFICATIONS & FRAMEWORKS */}
        <div className="lg:col-span-2 space-y-5">
          {/* CONTROL SPECIFICATION CARD */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" />
              <span>Control Specification</span>
            </h3>

            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</span>
              <p className="text-xs sm:text-sm text-slate-800 mt-1 leading-relaxed">{control.description}</p>
            </div>

            {control.objective && (
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Control Objective</span>
                <p className="text-xs text-slate-700 mt-1 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 font-medium">
                  {control.objective}
                </p>
              </div>
            )}

            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Evidence Requirements</span>
              <p className="text-xs text-slate-700 mt-1">
                {control.evidence_requirements || 'Standard operating documentation and manager sign-off logs.'}
              </p>
            </div>
          </div>

          {/* MAPPED REGULATORY REQUIREMENTS */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>Mapped Regulatory Requirements ({control.requirements?.length || 0})</span>
            </h3>

            {control.requirements && control.requirements.length > 0 ? (
              <div className="space-y-2">
                {control.requirements.map(req => (
                  <div key={req.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-900">{req.code}</span>
                      <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-[10px]">
                        {req.framework}
                      </span>
                    </div>
                    <div className="font-semibold text-slate-800 mt-1">{req.name}</div>
                    <div className="text-slate-500 text-[11px] mt-0.5">{req.description}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-400 py-2">No regulatory mappings explicitly linked.</div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: TESTING STATUS & METRICS */}
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">Operational Testing Status</h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Latest Recorded Result</span>
                <span
                  className={`font-semibold px-2 py-0.5 rounded font-mono text-[11px] ${
                    control.latest_test_result === 'PASS'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : control.latest_test_result === 'FAIL'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {control.latest_test_result}
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Control Owner</span>
                <span className="font-semibold text-slate-800">{control.owner}</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Testing Frequency</span>
                <span className="font-semibold font-mono text-slate-800">{control.testing_frequency}</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Last Tested Date</span>
                <span className="font-mono text-slate-800">
                  {control.last_tested_date ? new Date(control.last_tested_date).toLocaleDateString() : 'Never'}
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Next Scheduled Deadline</span>
                <span className={`font-mono font-bold ${isOverdue ? 'text-rose-600 flex items-center gap-1' : 'text-slate-800'}`}>
                  {isOverdue && <Clock className="w-3 h-3 text-rose-600" />}
                  {control.next_due_date ? new Date(control.next_due_date).toLocaleDateString() : 'Not Scheduled'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Historical Test Count</span>
                <span className="font-semibold font-mono text-slate-800">{tests.length} records</span>
              </div>
            </div>
          </div>

          {/* LINKED EVIDENCE ARTIFACTS */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <FolderArchive className="w-4 h-4 text-blue-600" />
              <span>Linked Evidence ({linkedEvidence.length})</span>
            </h3>

            {linkedEvidence.length > 0 ? (
              <div className="space-y-2">
                {linkedEvidence.map(ef => (
                  <div key={ef.id} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-semibold text-slate-900">{ef.code}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {(ef.file_size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                    <div className="font-medium text-slate-800 truncate mt-0.5">{ef.title}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-400 py-2">
                No evidence files currently linked to this control.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION: APPEND-ONLY CONTROL TESTING HISTORY TIMELINE */}
      <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-2xs">
        <div className="px-5 py-3.5 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-semibold text-slate-900">Historical Test Records & Workpapers</h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-200/60 font-semibold text-slate-700">
              {tests.length} Chronological Entries
            </span>
          </div>
          <span className="text-xs text-slate-400 font-mono">Immutable Audit Trail</span>
        </div>

        <div className="divide-y divide-slate-100">
          {tests.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No tests recorded for this control yet. Use "Record Test" to log the initial baseline test.
            </div>
          ) : (
            tests.map(test => {
              const isPass = test.result === 'PASS';
              const isFail = test.result === 'FAIL';

              return (
                <div key={test.id} className="p-5 hover:bg-slate-50/50 transition-colors space-y-3 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] flex items-center gap-1 ${
                          isPass
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : isFail
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {isPass ? <CheckCircle2 className="w-3 h-3" /> : isFail ? <XCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        {test.result}
                      </span>
                      <span className="font-semibold text-slate-900">
                        {test.audit_title ? `Engagement: ${test.audit_title}` : 'Independent Periodic Test'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
                      <span>Tester: <strong className="text-slate-700">{test.tester}</strong></span>
                      <span>•</span>
                      <span>Date: <strong className="text-slate-700">{new Date(test.test_date).toLocaleDateString()}</strong></span>
                    </div>
                  </div>

                  <div className="space-y-1.5 pl-2 border-l-2 border-slate-200">
                    <div>
                      <span className="font-semibold text-slate-500 uppercase text-[10px]">Objective: </span>
                      <span className="text-slate-800">{test.test_objective}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-500 uppercase text-[10px]">Procedure: </span>
                      <span className="text-slate-700">{test.test_procedure}</span>
                    </div>
                    {test.sample_description && (
                      <div>
                        <span className="font-semibold text-slate-500 uppercase text-[10px]">Sample Description: </span>
                        <span className="text-slate-700 font-mono text-[11px]">{test.sample_description}</span>
                      </div>
                    )}
                    {test.exceptions && (
                      <div className="p-2 rounded bg-rose-50/70 border border-rose-200 text-rose-800 mt-1">
                        <span className="font-bold">Exceptions Identified: </span>
                        <span>{test.exceptions}</span>
                      </div>
                    )}
                    <div className="pt-1">
                      <span className="font-semibold text-slate-500 uppercase text-[10px]">Formal Conclusion: </span>
                      <span className="text-slate-900 font-medium">{test.conclusion}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
