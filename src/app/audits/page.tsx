// ==============================================================================
// AUDITMIND - AUDITS & ENGAGEMENTS MODULE
// Manages internal readiness, external SOC 2, ISO 27001 surveillance engagements,
// control scope mappings, workpaper summaries, and completion locks.
// ==============================================================================

import Link from 'next/link';
import {
  FileCheck2,
  Calendar,
  User,
  Plus,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Download,
} from 'lucide-react';
import { dbRepository } from '@/lib/db/sqlite-store';
import { DEMO_ORG, seedDemoData } from '@/lib/demo-data';
import { createAuditAction } from '@/lib/actions';
export default async function AuditsPage() {
  seedDemoData(false);
  const orgId = DEMO_ORG.id;
  const audits = dbRepository.getAudits(orgId);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200">COMPLETED</span>;
      case 'IN_PROGRESS':
        return <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-blue-50 text-blue-700 border border-blue-200">IN PROGRESS</span>;
      case 'UNDER_REVIEW':
        return <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-amber-50 text-amber-700 border border-amber-200">UNDER REVIEW</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-slate-100 text-slate-700 border border-slate-200">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Audit Engagements</h1>
            <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {audits.length} Engagements
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Historical and active SOC 2, ISO 27001, and internal security examinations
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href="/api/export/audits"
            download
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Audits CSV</span>
          </a>
        </div>
      </div>

      {/* AUDITS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {audits.map(audit => (
          <div
            key={audit.id}
            className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs hover:border-blue-300 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {audit.code}
                </span>
                {getStatusBadge(audit.status)}
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{audit.title}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{audit.description}</p>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Framework:</span>
                  <span className="font-semibold text-slate-800">{audit.framework}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Lead Auditor:</span>
                  <span className="text-slate-800 truncate max-w-[150px]">{audit.lead_auditor}</span>
                </div>
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="text-slate-400">Period:</span>
                  <span>{new Date(audit.start_date).toLocaleDateString()} – {new Date(audit.end_date).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
                <div className="p-2 rounded bg-slate-50 border border-slate-100">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Controls</div>
                  <div className="text-xs font-mono font-bold text-slate-900">{audit.scoped_controls_count}</div>
                </div>
                <div className="p-2 rounded bg-slate-50 border border-slate-100">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Tests</div>
                  <div className="text-xs font-mono font-bold text-slate-900">{audit.tests_count}</div>
                </div>
                <div className="p-2 rounded bg-slate-50 border border-slate-100">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Findings</div>
                  <div className="text-xs font-mono font-bold text-rose-600">{audit.findings_count}</div>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                {audit.completed_at ? `Completed ${new Date(audit.completed_at).toLocaleDateString()}` : 'Active'}
              </span>
              <Link
                href={`/audits/${audit.id}`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                <span>View Engagement</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
