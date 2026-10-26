// ==============================================================================
// AUDITMIND - REPORTS & DATA EXPORTS MODULE
// Generates formal executive audit summaries, testing effectiveness reports,
// remediation aging profiles, and RFC-4180 CSV exports.
// ==============================================================================

import Link from 'next/link';
import {
  FileBarChart2,
  Download,
  Printer,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import { dbRepository } from '@/lib/db/sqlite-store';
import { DEMO_ORG, seedDemoData } from '@/lib/demo-data';
export default async function ReportsPage() {
  seedDemoData(false);
  const orgId = DEMO_ORG.id;

  const metrics = dbRepository.getDashboardMetrics(orgId);
  const controls = dbRepository.getControls(orgId);
  const findings = dbRepository.getFindings(orgId);
  const audits = dbRepository.getAudits(orgId);
  const gaps = dbRepository.getDetectedGaps(orgId, 'ACTIVE');

  const generationTime = new Date().toLocaleString();

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Compliance Reports & Exports</h1>
            <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              AUDIT-READY
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Formal compliance packages, testing aging profiles, and downloadable CSV records
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={undefined}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* CSV EXPORT DOWNLOAD CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <a
          href="/api/export/controls"
          download
          className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs hover:border-blue-400 transition-all group block"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Controls Export</span>
            <Download className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
          </div>
          <div className="mt-2 text-base font-bold text-slate-900">{controls.length} Controls</div>
          <p className="text-[11px] text-slate-400 mt-1">Full specifications, testing dates, and results</p>
          <span className="text-xs font-semibold text-blue-600 group-hover:underline mt-3 block">Download CSV →</span>
        </a>

        <a
          href="/api/export/findings"
          download
          className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs hover:border-blue-400 transition-all group block"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Findings Tracker</span>
            <Download className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
          </div>
          <div className="mt-2 text-base font-bold text-slate-900">{findings.length} Findings</div>
          <p className="text-[11px] text-slate-400 mt-1">Severities, owners, deadlines, verification status</p>
          <span className="text-xs font-semibold text-blue-600 group-hover:underline mt-3 block">Download CSV →</span>
        </a>

        <a
          href="/api/export/audits"
          download
          className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs hover:border-blue-400 transition-all group block"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Audits Summary</span>
            <Download className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
          </div>
          <div className="mt-2 text-base font-bold text-slate-900">{audits.length} Engagements</div>
          <p className="text-[11px] text-slate-400 mt-1">Scope, lead auditors, findings count</p>
          <span className="text-xs font-semibold text-blue-600 group-hover:underline mt-3 block">Download CSV →</span>
        </a>

        <a
          href="/api/export/gaps"
          download
          className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs hover:border-blue-400 transition-all group block"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Active Gaps Export</span>
            <Download className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
          </div>
          <div className="mt-2 text-base font-bold text-slate-900">{gaps.length} Active Gaps</div>
          <p className="text-[11px] text-slate-400 mt-1">Deterministic compliance engine output</p>
          <span className="text-xs font-semibold text-blue-600 group-hover:underline mt-3 block">Download CSV →</span>
        </a>
      </div>

      {/* FORMAL AUDIT PACKAGE PREVIEW */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Executive GRC Status Package</h2>
            <p className="text-xs text-slate-500">Northstar Technologies — Continuous Audit Readiness</p>
          </div>
          <div className="text-right text-xs text-slate-400 font-mono">
            Report Generated: {generationTime}
          </div>
        </div>

        {/* SUMMARY STATS TABLE */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs">
            <span className="text-slate-500 uppercase text-[10px] font-semibold">Testing Baseline</span>
            <div className="text-lg font-bold text-slate-900 mt-1">
              {metrics.controlTestingRate.tested} / {metrics.controlTestingRate.total}
            </div>
            <div className="text-[11px] text-slate-400">{metrics.controlTestingRate.percentage}% of catalog tested</div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs">
            <span className="text-slate-500 uppercase text-[10px] font-semibold">Pass Rate</span>
            <div className="text-lg font-bold text-emerald-700 mt-1">
              {metrics.controlPassRate.passed} / {metrics.controlPassRate.tested}
            </div>
            <div className="text-[11px] text-slate-400">{metrics.controlPassRate.percentage}% tested passed</div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs">
            <span className="text-slate-500 uppercase text-[10px] font-semibold">Open Findings</span>
            <div className="text-lg font-bold text-amber-700 mt-1">{metrics.openFindings}</div>
            <div className="text-[11px] text-rose-600 font-semibold">{metrics.highSeverityOpenFindings} High / Critical</div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs">
            <span className="text-slate-500 uppercase text-[10px] font-semibold">Pending Verification</span>
            <div className="text-lg font-bold text-violet-700 mt-1">{metrics.findingsAwaitingVerification}</div>
            <div className="text-[11px] text-slate-400">Awaiting auditor re-test</div>
          </div>
        </div>

        {/* COMPLIANCE DISCLOSURE NOTE */}
        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
          <div className="font-semibold text-slate-800">Compliance Statement & Audit Provenance:</div>
          <p className="leading-relaxed">
            This report represents calculated operational readiness based upon recorded audit workpapers, control tests, and documented remediation evidence. AuditMind does not issue legal certifications. Controls lacking verification tests are explicitly excluded from verified remediation calculations.
          </p>
        </div>
      </div>
    </div>
  );
}
