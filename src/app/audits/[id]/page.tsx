// ==============================================================================
// AUDITMIND - AUDIT ENGAGEMENT WORKPAPERS & CONCLUSION
// Scoped controls, field test procedures, audit findings, and formal completion workflow.
// ==============================================================================

import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  FileCheck2,
  ArrowLeft,
  Calendar,
  User,
  Shield,
  AlertTriangle,
  Lock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Clock,
} from 'lucide-react';
import { dbRepository } from '@/lib/db/sqlite-store';
import { DEMO_ORG, seedDemoData } from '@/lib/demo-data';
import { completeAuditAction } from '@/lib/actions';
export default async function AuditDetailPage({ params }: { params: Promise<{ id: string }> }) {
  seedDemoData(false);
  const { id } = await params;
  const audit = dbRepository.getAuditById(id);

  if (!audit) {
    notFound();
  }

  const isCompleted = audit.status === 'COMPLETED';

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <Link
            href="/audits"
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {audit.code}
              </span>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">{audit.title}</h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Type: {audit.audit_type} • Framework: {audit.framework} • Status: {audit.status}
            </p>
          </div>
        </div>

        {/* STATUS & COMPLETION LOCK BADGE */}
        <div className="flex items-center gap-2">
          {isCompleted ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Completed & Locked Audit</span>
            </span>
          ) : (
            <form action={completeAuditAction} className="flex items-center gap-2">
              <input type="hidden" name="auditId" value={audit.id} />
              <input type="hidden" name="summary" value="Formally finalized audit engagement procedures and signed off on findings." />
              <button
                type="submit"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Complete Engagement</span>
              </button>
            </form>
          )}
        </div>
      </div>

      {/* METADATA GRID */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Lead Auditor</span>
          <div className="text-xs font-semibold text-slate-900 mt-1 truncate">{audit.lead_auditor}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Independent Examination</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Examination Window</span>
          <div className="text-xs font-mono font-semibold text-slate-900 mt-1">
            {new Date(audit.start_date).toLocaleDateString()} – {new Date(audit.end_date).toLocaleDateString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Fieldwork Period</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Controls Evaluated</span>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">{audit.scoped_controls_count}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">In Scope</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Exceptions Logged</span>
          <div className="text-xl font-bold font-mono text-rose-600 mt-1">{audit.findings_count}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Deficiencies</div>
        </div>
      </div>

      {/* AUDIT SUMMARY WORKPAPER */}
      {audit.summary && (
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-2">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Auditor Executive Summary & Opinion</span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50/60 p-4 rounded-lg border border-slate-100">
            {audit.summary}
          </p>
        </div>
      )}

      {/* SCOPED CONTROLS LIST */}
      <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-2xs">
        <div className="px-5 py-3.5 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-semibold text-slate-900">In-Scope Controls ({audit.scoped_controls?.length || 0})</h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">Control Boundary</span>
        </div>

        <div className="divide-y divide-slate-100">
          {audit.scoped_controls?.map(ctrl => (
            <div key={ctrl.id} className="p-4 hover:bg-slate-50/50 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Link href={`/controls/${ctrl.id}`} className="font-mono font-bold text-slate-900 hover:text-blue-600">
                    {ctrl.code}
                  </Link>
                  <span className="text-slate-700 font-medium">{ctrl.name}</span>
                </div>
                <div className="text-slate-400 text-[11px]">Owner: {ctrl.owner} • Category: {ctrl.category}</div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`font-mono text-[10px] px-2 py-0.5 rounded font-bold ${
                    ctrl.latest_test_result === 'PASS'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : ctrl.latest_test_result === 'FAIL'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {ctrl.latest_test_result}
                </span>
                <Link href={`/controls/${ctrl.id}`} className="text-blue-600 hover:underline">
                  View
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FIELD TEST PROCEDURES */}
      <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-2xs">
        <div className="px-5 py-3.5 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-semibold text-slate-900">Recorded Test Procedures & Outcomes ({audit.tests?.length || 0})</h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">Fieldwork Records</span>
        </div>

        <div className="divide-y divide-slate-100">
          {audit.tests?.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              No tests recorded under this specific engagement ID yet.
            </div>
          ) : (
            audit.tests?.map(test => (
              <div key={test.id} className="p-4 hover:bg-slate-50/50 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900">{test.control_code}</span>
                    <span
                      className={`font-mono font-bold px-2 py-0.5 rounded text-[10px] ${
                        test.result === 'PASS'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {test.result}
                    </span>
                  </div>
                  <span className="text-slate-400 font-mono text-[11px]">
                    Tester: {test.tester} • {new Date(test.test_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-slate-700 pl-2 border-l-2 border-slate-200">
                  <p><strong className="text-slate-500 uppercase text-[10px]">Procedure:</strong> {test.test_procedure}</p>
                  <p className="mt-1"><strong className="text-slate-500 uppercase text-[10px]">Conclusion:</strong> {test.conclusion}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ENGAGEMENT FINDINGS */}
      <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-2xs">
        <div className="px-5 py-3.5 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <h2 className="text-sm font-semibold text-slate-900">Identified Deficiencies & Findings ({audit.findings?.length || 0})</h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">Exceptions</span>
        </div>

        <div className="divide-y divide-slate-100">
          {audit.findings?.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              No deficiencies or non-conformities were identified in this audit.
            </div>
          ) : (
            audit.findings?.map(f => (
              <div key={f.id} className="p-4 hover:bg-slate-50/50 flex items-start justify-between text-xs gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-rose-600">{f.code}</span>
                    <span className="font-semibold text-slate-900">{f.title}</span>
                    <span className="font-mono text-[10px] px-1.5 py-0.2 bg-rose-50 text-rose-700 rounded border border-rose-200 font-bold">
                      {f.severity}
                    </span>
                  </div>
                  <p className="text-slate-600">{f.description}</p>
                  <div className="text-slate-400 text-[11px]">
                    Assigned Owner: <strong className="text-slate-700">{f.assigned_owner}</strong> • Remediation: <strong className="text-slate-700">{f.remediation_status}</strong>
                  </div>
                </div>
                <Link
                  href={`/findings/${f.id}`}
                  className="px-2.5 py-1 text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md shrink-0 font-medium"
                >
                  View Finding
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
