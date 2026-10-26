// ==============================================================================
// AUDITMIND - POLICY CHANGES & REGULATORY IMPACT ASSESSMENTS
// Tracks external regulatory updates, AI-assisted control impact assessments,
// and proposed control modifications awaiting human approval.
// ==============================================================================

import Link from 'next/link';
import {
  BookOpenCheck,
  ArrowLeft,
  Calendar,
  AlertCircle,
  Shield,
  CheckCircle2,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { dbRepository } from '@/lib/db/sqlite-store';
import { DEMO_ORG, seedDemoData } from '@/lib/demo-data';
export default async function PolicyChangesPage() {
  seedDemoData(false);
  const orgId = DEMO_ORG.id;
  const policyChanges = dbRepository.getPolicyChanges(orgId);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <Link
            href="/policies"
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">External Policy Changes & Updates</h1>
              <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                {policyChanges.length} Monitored Updates
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Regulatory revisions, external guidance updates, and control impact triage
            </p>
          </div>
        </div>
      </div>

      {/* POLICY CHANGES CARDS */}
      <div className="space-y-5">
        {policyChanges.map(pc => (
          <div
            key={pc.id}
            className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                    {pc.code}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">{pc.title}</h3>
                </div>
                <div className="text-xs text-slate-500">
                  Source: <strong className="text-slate-700">{pc.source}</strong> • Discovered: {new Date(pc.date_discovered).toLocaleDateString()}
                </div>
              </div>

              <span
                className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${
                  pc.review_status === 'ACTION_REQUIRED'
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {pc.review_status.replace(/_/g, ' ')}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
              {pc.description}
            </p>

            {/* AI IMPACT SUMMARY */}
            {pc.impact_summary && (
              <div className="p-3 rounded-lg bg-blue-50/50 border border-blue-100 text-xs text-blue-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>AI Impact Triage Assessment:</span>
                </div>
                <p className="text-slate-700">{pc.impact_summary}</p>
              </div>
            )}

            {/* PROPOSED CONTROL MODIFICATIONS */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Assessed Control Modifications ({pc.assessments?.length || 0})
              </span>

              {pc.assessments?.map(pia => (
                <div
                  key={pia.id}
                  className="p-3 rounded-lg border border-slate-200/80 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-blue-600">{pia.control_code}</span>
                      <span className="font-medium text-slate-800">{pia.control_name}</span>
                      <span className="font-mono text-[10px] px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded font-bold">
                        Impact: {pia.impact_level}
                      </span>
                    </div>
                    <p className="text-slate-600">{pia.notes}</p>
                    {pia.proposed_action && (
                      <div className="text-slate-900 font-medium">
                        ↳ Proposed Control Update: <em>{pia.proposed_action}</em>
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 text-slate-700">
                      {pia.status}
                    </span>
                    <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold text-xs shadow-2xs">
                      Review & Approve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
