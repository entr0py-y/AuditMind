// ==============================================================================
// AUDITMIND - RISK REGISTER & 5x5 ASSESSMENT MATRIX
// Documented, configurable 5x5 risk scoring methodology, inherent vs residual risk,
// control mitigations, and treatment plans.
// ==============================================================================

import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  Shield,
  Clock,
  ArrowRight,
  TrendingDown,
  Layers,
} from 'lucide-react';
import { dbRepository } from '@/lib/db/sqlite-store';
import { DEMO_ORG, seedDemoData } from '@/lib/demo-data';
export default async function RiskRegisterPage() {
  seedDemoData(false);
  const orgId = DEMO_ORG.id;
  const risks = dbRepository.getRisks(orgId);

  const getScoreBadge = (score: number) => {
    if (score >= 15) {
      return <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300">{score} (Critical)</span>;
    }
    if (score >= 10) {
      return <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">{score} (High)</span>;
    }
    if (score >= 5) {
      return <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-yellow-100 text-yellow-800 border border-yellow-300">{score} (Medium)</span>;
    }
    return <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">{score} (Low)</span>;
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Enterprise Risk Register</h1>
            <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {risks.length} Assessed Risks
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            5x5 Likelihood vs Impact scoring methodology, control mitigations, and residual risk tracking
          </p>
        </div>
      </div>

      {/* 5x5 METHODOLOGY OVERVIEW */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            <span>Risk Assessment Methodology (5x5 Scoring Matrix)</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">Inherent Score = Likelihood (1-5) × Impact (1-5)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 text-xs">
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200">
            <div className="font-bold text-rose-800">Critical (15 - 25)</div>
            <p className="text-rose-700 text-[11px] mt-0.5">Requires immediate executive escalation & continuous automated monitoring.</p>
          </div>
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
            <div className="font-bold text-amber-800">High (10 - 14)</div>
            <p className="text-amber-700 text-[11px] mt-0.5">Formal mitigation controls and quarterly verification required.</p>
          </div>
          <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
            <div className="font-bold text-yellow-800">Medium (5 - 9)</div>
            <p className="text-yellow-700 text-[11px] mt-0.5">Standard operational detective controls and annual review.</p>
          </div>
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
            <div className="font-bold text-blue-800">Low (1 - 4)</div>
            <p className="text-blue-700 text-[11px] mt-0.5">Acceptable residual exposure within operational risk appetite.</p>
          </div>
        </div>
      </div>

      {/* RISKS INVENTORY TABLE */}
      <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 border-collapse">
            <thead className="bg-slate-50/80 text-slate-700 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Risk ID</th>
                <th className="py-3 px-4">Risk Scenario & Description</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Inherent Risk</th>
                <th className="py-3 px-4">Control Mitigations</th>
                <th className="py-3 px-4">Residual Risk</th>
                <th className="py-3 px-4">Treatment</th>
                <th className="py-3 px-4">Owner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {risks.map(r => (
                <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{r.code}</td>
                  <td className="py-3.5 px-4 max-w-sm">
                    <div className="font-semibold text-slate-900">{r.title}</div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{r.description}</p>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-700">{r.category}</td>
                  <td className="py-3.5 px-4 font-mono">
                    {getScoreBadge(r.inherent_score)}
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      L:{r.likelihood} × I:{r.impact}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 max-w-xs">
                    <p className="text-[11px] text-slate-700">{r.mitigations || 'No mitigations specified'}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {r.related_controls?.map(c => (
                        <Link
                          key={c.id}
                          href={`/controls/${c.id}`}
                          className="font-mono text-[10px] px-1.5 py-0.2 bg-blue-50 text-blue-700 hover:underline rounded"
                        >
                          {c.code}
                        </Link>
                      ))}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono">
                    <div className="flex items-center gap-1.5">
                      <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
                      {getScoreBadge(r.residual_score)}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-mono font-bold text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                      {r.treatment_plan}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-800 font-medium truncate max-w-[120px]">
                    {r.owner}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
