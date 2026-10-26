// ==============================================================================
// AUDITMIND - CONTROLS & REQUIREMENTS MODULE
// Complete control management, advanced filters, testing status, and CSV exports.
// ==============================================================================

import Link from 'next/link';
import {
  ShieldCheck,
  Plus,
  Download,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { dbRepository } from '@/lib/db/sqlite-store';
import { DEMO_ORG, seedDemoData } from '@/lib/demo-data';
import { QuickActionModals } from '@/components/dashboard/QuickActionModals';
export default async function ControlsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; status?: string; search?: string; filter?: string }>;
}) {
  seedDemoData(false);
  const { category, status, search, filter } = await searchParams;

  const orgId = DEMO_ORG.id;
  let allControls = dbRepository.getControls(orgId, {
    category: category !== 'ALL' ? category : undefined,
    status: status !== 'ALL' ? status : undefined,
    search,
  });

  if (filter === 'overdue') {
    const now = Date.now();
    allControls = allControls.filter(c => c.next_due_date && new Date(c.next_due_date).getTime() < now);
  }

  const getResultBadge = (result: string) => {
    switch (result) {
      case 'PASS':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle2 className="w-3 h-3" /> PASS</span>;
      case 'FAIL':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200"><XCircle className="w-3 h-3" /> FAIL</span>;
      case 'PARTIALLY_EFFECTIVE':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200"><AlertCircle className="w-3 h-3" /> Partially Effective</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200"><HelpCircle className="w-3 h-3" /> Not Tested</span>;
    }
  };

  const now = Date.now();

  return (
    <div className="space-y-5">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Compliance Controls Catalog</h1>
            <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {allControls.length} Controls
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Internal policies, automated controls, testing frequencies, and operational effectiveness
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href="/api/export/controls"
            download
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </a>
          <QuickActionModals controls={allControls} />
        </div>
      </div>

      {/* FILTER CONTROLS BAR */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <form className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              name="search"
              defaultValue={search || ''}
              placeholder="Search code or title..."
              className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg w-52 focus:outline-blue-600 bg-slate-50/50"
            />
          </div>

          <select
            name="category"
            defaultValue={category || 'ALL'}
            className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-700 bg-slate-50/50"
          >
            <option value="ALL">All Categories</option>
            <option value="Access Control">Access Control</option>
            <option value="Data Protection">Data Protection</option>
            <option value="Change Management">Change Management</option>
            <option value="Incident Response">Incident Response</option>
            <option value="Vulnerability Management">Vulnerability Management</option>
            <option value="Business Continuity">Business Continuity</option>
          </select>

          <button
            type="submit"
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
          >
            Filter
          </button>

          {(category || search || filter) && (
            <Link
              href="/controls"
              className="text-xs text-rose-600 hover:underline px-2 py-1"
            >
              Reset
            </Link>
          )}
        </form>

        <div className="flex items-center gap-2">
          <Link
            href="/controls?filter=overdue"
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
              filter === 'overdue'
                ? 'bg-rose-50 border-rose-300 text-rose-700'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Show Overdue Only
          </Link>
        </div>
      </div>

      {/* CONTROLS TABLE */}
      <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 border-collapse">
            <thead className="bg-slate-50/80 text-slate-700 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Control Code</th>
                <th className="py-3 px-4">Name & Objective</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Risk Level</th>
                <th className="py-3 px-4">Frequency</th>
                <th className="py-3 px-4">Latest Result</th>
                <th className="py-3 px-4">Next Due Date</th>
                <th className="py-3 px-4">Owner</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allControls.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No controls found matching current filter criteria.
                  </td>
                </tr>
              ) : (
                allControls.map(c => {
                  const isOverdue = c.next_due_date && new Date(c.next_due_date).getTime() < now;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        <Link href={`/controls/${c.id}`} className="hover:text-blue-600 flex items-center gap-1">
                          <span>{c.code}</span>
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <Link href={`/controls/${c.id}`} className="font-semibold text-slate-900 hover:text-blue-600 block line-clamp-1">
                          {c.name}
                        </Link>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{c.description}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-700">{c.category}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`font-mono text-[10px] px-2 py-0.5 rounded font-bold ${
                            c.risk_level === 'CRITICAL'
                              ? 'bg-rose-100 text-rose-700'
                              : c.risk_level === 'HIGH'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {c.risk_level}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                        {c.testing_frequency}
                      </td>
                      <td className="py-3.5 px-4">
                        {getResultBadge(c.latest_test_result)}
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        {c.next_due_date ? (
                          <div className={isOverdue ? 'text-rose-600 font-bold flex items-center gap-1' : 'text-slate-700'}>
                            {isOverdue && <Clock className="w-3 h-3 text-rose-600" />}
                            <span>{new Date(c.next_due_date).toLocaleDateString()}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">Not Scheduled</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 truncate max-w-[130px]">
                        {c.owner}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/controls/${c.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                        >
                          <span>History</span>
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
