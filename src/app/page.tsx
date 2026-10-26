// ==============================================================================
// AUDITMIND - OVERVIEW DASHBOARD
// Operational intelligence answering: "What needs attention right now?"
// Displays real database metrics, exact numerators/denominators, priority attention items,
// upcoming deadlines, and traceable activity trails.
// ==============================================================================

import Link from 'next/link';
import {
  ShieldAlert,
  ShieldCheck,
  Clock,
  AlertTriangle,
  FileCheck,
  ArrowRight,
  TrendingUp,
  Calendar,
  User,
  History,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { dbRepository } from '@/lib/db/sqlite-store';
import { runDeterministicComplianceChecks } from '@/lib/services/compliance-engine';
import { DEMO_ORG, seedDemoData } from '@/lib/demo-data';
import { OverviewCharts } from '@/components/dashboard/OverviewCharts';
import { QuickActionModals } from '@/components/dashboard/QuickActionModals';
export default function OverviewPage() {
  seedDemoData(false);
  const orgId = DEMO_ORG.id;

  // Run deterministic compliance checks to sync detected gaps
  runDeterministicComplianceChecks(orgId);

  const metrics = dbRepository.getDashboardMetrics(orgId);
  const controls = dbRepository.getControls(orgId);
  const activeGaps = dbRepository.getDetectedGaps(orgId, 'ACTIVE');
  const findings = dbRepository.getFindings(orgId);
  const audits = dbRepository.getAudits(orgId);
  const activityLogs = dbRepository.getActivityLogs(orgId, 6);

  // Chart data calculations
  const passingCount = controls.filter(c => c.latest_test_result === 'PASS').length;
  const failingCount = controls.filter(c => c.latest_test_result === 'FAIL').length;
  const partiallyCount = controls.filter(c => c.latest_test_result === 'PARTIALLY_EFFECTIVE').length;
  const notTestedCount = controls.filter(c => c.latest_test_result === 'NOT_TESTED').length;

  const openFindings = findings.filter(f => f.remediation_status !== 'RESOLVED' && f.remediation_status !== 'ACCEPTED_EXCEPTION');
  const criticalFindings = openFindings.filter(f => f.severity === 'CRITICAL').length;
  const highFindings = openFindings.filter(f => f.severity === 'HIGH').length;
  const mediumFindings = openFindings.filter(f => f.severity === 'MEDIUM').length;
  const lowFindings = openFindings.filter(f => f.severity === 'LOW' || f.severity === 'INFORMATIONAL').length;

  // Upcoming / Overdue Deadlines
  const now = Date.now();
  const upcomingDeadlines = [
    ...controls
      .filter(c => c.next_due_date)
      .map(c => ({
        id: c.id,
        code: c.code,
        title: c.name,
        type: 'CONTROL_TEST' as const,
        date: c.next_due_date!,
        owner: c.owner,
        url: `/controls/${c.id}`,
        isOverdue: new Date(c.next_due_date!).getTime() < now,
      })),
    ...openFindings.map(f => ({
      id: f.id,
      code: f.code,
      title: f.title,
      type: 'REMEDIATION' as const,
      date: f.target_remediation_date,
      owner: f.assigned_owner,
      url: `/findings/${f.id}`,
      isOverdue: new Date(f.target_remediation_date).getTime() < now,
    })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* TOP HEADER & QUICK ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Compliance & Audit Overview</h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200">
              NORTHSTAR TECHNOLOGIES
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time compliance health, audit readiness metrics, and priority action items
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/assistant"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ask AI Assistant</span>
          </Link>
          <QuickActionModals controls={controls} />
        </div>
      </div>

      {/* CORE KPI SUMMARY METRICS (WITH NUMERATORS & DENOMINATORS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* TOTAL ACTIVE CONTROLS & TESTING RATE */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Control Testing Rate</span>
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{metrics.controlTestingRate.percentage}%</span>
            <span className="text-xs font-mono text-slate-500">
              ({metrics.controlTestingRate.tested} of {metrics.controlTestingRate.total} tested)
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span className="text-emerald-600 font-medium">{metrics.passingControls} passing</span>
            <span className="text-rose-600 font-medium">{metrics.failingControls} failing</span>
            <span className="text-slate-400 font-medium">{metrics.noTestHistoryControls} untested</span>
          </div>
        </div>

        {/* OVERDUE FOR TESTING */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Testing Overdue</span>
            <Clock className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-bold ${metrics.overdueControls > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {metrics.overdueControls}
            </span>
            <span className="text-xs text-slate-500">controls past deadline</span>
          </div>
          <div className="mt-3 text-xs text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span>Frequency-based check</span>
            <Link href="/controls?filter=overdue" className="text-blue-600 font-medium hover:underline flex items-center gap-0.5">
              <span>View</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* OPEN FINDINGS & SEVERITY */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Open Audit Findings</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{metrics.openFindings}</span>
            <span className="text-xs text-rose-600 font-semibold font-mono">
              ({metrics.highSeverityOpenFindings} High/Critical)
            </span>
          </div>
          <div className="mt-3 text-xs text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span>{metrics.overdueRemediationTasks} past target deadline</span>
            <Link href="/findings" className="text-blue-600 font-medium hover:underline flex items-center gap-0.5">
              <span>Tracker</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* UNVERIFIED REMEDIATIONS */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Remediation Verification</span>
            <AlertCircle className="w-4 h-4 text-violet-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-violet-700">{metrics.findingsAwaitingVerification}</span>
            <span className="text-xs text-slate-500">awaiting formal test</span>
          </div>
          <div className="mt-3 text-xs text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-slate-500">Verified: {metrics.remediationRate.verifiedResolved}/{metrics.remediationRate.totalFindings}</span>
            <Link href="/findings?filter=unverified" className="text-blue-600 font-medium hover:underline flex items-center gap-0.5">
              <span>Review</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* SECTION: PRIORITY ATTENTION LIST (DETERMINISTIC COMPLIANCE GAPS) */}
      <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-2xs">
        <div className="px-5 py-3.5 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <h2 className="text-sm font-semibold text-slate-900">Priority Attention List</h2>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold">
              {activeGaps.length} Active Gaps
            </span>
          </div>
          <span className="text-xs text-slate-500">Deterministic gap engine output</span>
        </div>

        <div className="divide-y divide-slate-100">
          {activeGaps.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <span>All active controls and remediation workflows are currently operating within required parameters.</span>
            </div>
          ) : (
            activeGaps.slice(0, 5).map(gap => {
              const severityColor =
                gap.severity === 'CRITICAL'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : gap.severity === 'HIGH'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-blue-50 text-blue-700 border-blue-200';

              const targetUrl =
                gap.related_entity_type === 'CONTROL'
                  ? `/controls/${gap.related_entity_id}`
                  : gap.related_entity_type === 'FINDING'
                  ? `/findings/${gap.related_entity_id}`
                  : `/policies/changes`;

              return (
                <div key={gap.id} className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border ${severityColor}`}>
                        {gap.severity}
                      </span>
                      <span className="text-xs font-mono text-slate-400 font-medium">
                        {gap.gap_type.replace(/_/g, ' ')}
                      </span>
                      <h3 className="text-xs font-semibold text-slate-900">{gap.title}</h3>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2">{gap.explanation}</p>
                    {gap.suggested_action && (
                      <div className="text-[11px] text-blue-700 font-medium pt-0.5">
                        ↳ Action: {gap.suggested_action}
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 flex items-center">
                    <Link
                      href={targetUrl}
                      className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs"
                    >
                      <span>Investigate</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* SECTION: DATA VISUALIZATIONS */}
      <OverviewCharts
        testOutcomes={{
          passed: passingCount,
          failed: failingCount,
          partiallyEffective: partiallyCount,
          notTested: notTestedCount,
        }}
        findingSeverities={{
          critical: criticalFindings,
          high: highFindings,
          medium: mediumFindings,
          low: lowFindings,
        }}
      />

      {/* SPLIT SECTION: UPCOMING DEADLINES & RECENT ACTIVITY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* UPCOMING DEADLINES */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              <h3 className="text-sm font-semibold text-slate-900">Upcoming & Overdue Deadlines</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">Next 30 Days</span>
          </div>

          <div className="space-y-3">
            {upcomingDeadlines.length === 0 ? (
              <div className="text-xs text-slate-400 py-4 text-center">No upcoming deadlines recorded.</div>
            ) : (
              upcomingDeadlines.map(item => (
                <div
                  key={`${item.type}-${item.id}`}
                  className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-slate-900">{item.code}</span>
                      <span className="text-[11px] text-slate-400">
                        {item.type === 'CONTROL_TEST' ? 'Control Testing' : 'Remediation'}
                      </span>
                      {item.isOverdue && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 bg-rose-100 text-rose-700 rounded">
                          OVERDUE
                        </span>
                      )}
                    </div>
                    <div className="text-slate-700 line-clamp-1">{item.title}</div>
                    <div className="text-[11px] text-slate-400">Owner: {item.owner}</div>
                  </div>
                  <div className="text-right">
                    <div className={`font-mono font-semibold ${item.isOverdue ? 'text-rose-600' : 'text-slate-700'}`}>
                      {new Date(item.date).toLocaleDateString()}
                    </div>
                    <Link href={item.url} className="text-blue-600 hover:underline text-[11px]">
                      View Record
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RECENT ACTIVITY AUDIT TRAIL */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-slate-500" />
              <h3 className="text-sm font-semibold text-slate-900">Immutable Audit Activity Trail</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">Live Logs</span>
          </div>

          <div className="space-y-3">
            {activityLogs.length === 0 ? (
              <div className="text-xs text-slate-400 py-4 text-center">No activity recorded yet.</div>
            ) : (
              activityLogs.map(log => (
                <div key={log.id} className="flex items-start gap-3 text-xs pb-2 border-b border-slate-100 last:border-none">
                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-[10px] shrink-0 mt-0.5">
                    {log.actor_name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900 truncate">{log.actor_name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-slate-600">
                      <span className="font-mono text-[11px] font-semibold text-blue-600">{log.action.replace(/_/g, ' ')}</span>
                      <span> on {log.entity_type.toLowerCase()}</span>
                    </div>
                    {log.reason && (
                      <div className="text-[11px] text-slate-500 italic mt-0.5">"{log.reason}"</div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
