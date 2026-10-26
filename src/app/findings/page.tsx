// ==============================================================================
// AUDITMIND - FINDINGS & REMEDIATION TRACKER
// Deficiencies, severity tiers, root causes, remediation deadlines, and verification workflows.
// ==============================================================================

import Link from 'next/link';
import {
  AlertTriangle,
  Download,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  User,
  Shield,
  ArrowRight,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { dbRepository } from '@/lib/db/sqlite-store';
import { DEMO_ORG, seedDemoData } from '@/lib/demo-data';
import { QuickActionModals } from '@/components/dashboard/QuickActionModals';
export default async function FindingsPage({
  searchParams,
}: {
  searchParams: Promise<{ severity?: string; status?: string; search?: string; filter?: string }>;
}) {
  seedDemoData(false);
  const { severity, status, search, filter } = await searchParams;

  const orgId = DEMO_ORG.id;
  let allFindings = dbRepository.getFindings(orgId, {
    severity: severity !== 'ALL' ? severity : undefined,
    status: status !== 'ALL' ? status : undefined,
    search,
  });

  const now = Date.now();

  if (filter === 'unverified') {
    allFindings = allFindings.filter(
      f => (f.remediation_status === 'RESOLVED' || f.remediation_status === 'PENDING_VERIFICATION') &&
           f.verification_status !== 'VERIFIED'
    );
  } else if (filter === 'overdue') {
    allFindings = allFindings.filter(
      f => f.remediation_status !== 'RESOLVED' &&
           f.remediation_status !== 'ACCEPTED_EXCEPTION' &&
           new Date(f.target_remediation_date).getTime() < now
    );
  }

  const controls = dbRepository.getControls(orgId);

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return <span className="font-mono text-[10px] px-2 py-0.5 rounded font-bold bg-rose-100 text-rose-800 border border-rose-300">CRITICAL</span>;
      case 'HIGH':
        return <span className="font-mono text-[10px] px-2 py-0.5 rounded font-bold bg-amber-100 text-amber-800 border border-amber-300">HIGH</span>;
      case 'MEDIUM':
        return <span className="font-mono text-[10px] px-2 py-0.5 rounded font-bold bg-yellow-100 text-yellow-800 border border-yellow-300">MEDIUM</span>;
      default:
        return <span className="font-mono text-[10px] px-2 py-0.5 rounded font-bold bg-blue-100 text-blue-800 border border-blue-200">LOW</span>;
    }
  };

  const getStatusBadge = (remStatus: string, verStatus: string) => {
    if (remStatus === 'RESOLVED' && verStatus === 'VERIFIED') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3" /> VERIFIED RESOLVED
        </span>
      );
    }
    if ((remStatus === 'RESOLVED' || remStatus === 'PENDING_VERIFICATION') && verStatus !== 'VERIFIED') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
          <AlertCircle className="w-3 h-3" /> AWAITING VERIFICATION
        </span>
      );
    }
    if (remStatus === 'ACCEPTED_EXCEPTION') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
          ACCEPTED EXCEPTION
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
        {remStatus}
      </span>
    );
  };

  return (
    <div className="space-y-5">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Audit Findings & Remediation</h1>
            <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {allFindings.length} Records
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Deficiencies, assigned remediation owners, target deadlines, and auditor verification signoffs
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href="/api/export/findings"
            download
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Findings CSV</span>
          </a>
          <QuickActionModals controls={controls} />
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <form className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              name="search"
              defaultValue={search || ''}
              placeholder="Search finding code or title..."
              className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg w-52 focus:outline-blue-600 bg-slate-50/50"
            />
          </div>

          <select
            name="severity"
            defaultValue={severity || 'ALL'}
            className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-700 bg-slate-50/50"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <select
            name="status"
            defaultValue={status || 'ALL'}
            className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-700 bg-slate-50/50"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="PENDING_VERIFICATION">Pending Verification</option>
            <option value="RESOLVED">Resolved</option>
            <option value="ACCEPTED_EXCEPTION">Accepted Exception</option>
          </select>

          <button
            type="submit"
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
          >
            Filter
          </button>

          {(severity || status || search || filter) && (
            <Link href="/findings" className="text-xs text-rose-600 hover:underline px-2 py-1">
              Reset
            </Link>
          )}
        </form>

        <div className="flex items-center gap-2">
          <Link
            href="/findings?filter=unverified"
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
              filter === 'unverified'
                ? 'bg-amber-50 border-amber-300 text-amber-800'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Awaiting Verification Only
          </Link>
          <Link
            href="/findings?filter=overdue"
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
              filter === 'overdue'
                ? 'bg-rose-50 border-rose-300 text-rose-700'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Overdue Deadlines
          </Link>
        </div>
      </div>

      {/* FINDINGS TABLE */}
      <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 border-collapse">
            <thead className="bg-slate-50/80 text-slate-700 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Finding Code</th>
                <th className="py-3 px-4">Title & Context</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Related Controls</th>
                <th className="py-3 px-4">Assigned Owner</th>
                <th className="py-3 px-4">Target Deadline</th>
                <th className="py-3 px-4">Workflow Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allFindings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No findings match the current criteria.
                  </td>
                </tr>
              ) : (
                allFindings.map(f => {
                  const isOverdue =
                    f.remediation_status !== 'RESOLVED' &&
                    f.remediation_status !== 'ACCEPTED_EXCEPTION' &&
                    new Date(f.target_remediation_date).getTime() < now;

                  return (
                    <tr key={f.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        <Link href={`/findings/${f.id}`} className="hover:text-blue-600">
                          {f.code}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 max-w-sm">
                        <Link href={`/findings/${f.id}`} className="font-semibold text-slate-900 hover:text-blue-600 block line-clamp-1">
                          {f.title}
                        </Link>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{f.description}</p>
                      </td>
                      <td className="py-3.5 px-4">{getSeverityBadge(f.severity)}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {f.related_controls && f.related_controls.length > 0 ? (
                            f.related_controls.map(c => (
                              <Link
                                key={c.id}
                                href={`/controls/${c.id}`}
                                className="font-mono text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-600 rounded"
                              >
                                {c.code}
                              </Link>
                            ))
                          ) : (
                            <span className="text-slate-400">N/A</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-800 font-medium truncate max-w-[130px]">
                        {f.assigned_owner}
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        <div className={isOverdue ? 'text-rose-600 font-bold flex items-center gap-1' : 'text-slate-700'}>
                          {isOverdue && <Clock className="w-3 h-3 text-rose-600" />}
                          <span>{new Date(f.target_remediation_date).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">{getStatusBadge(f.remediation_status, f.verification_status)}</td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/findings/${f.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                        >
                          <span>Manage</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
