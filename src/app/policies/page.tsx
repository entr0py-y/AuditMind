// ==============================================================================
// AUDITMIND - POLICIES & REGULATORY REQUIREMENTS
// Internal policy versions, annual review deadlines, and framework requirements.
// ==============================================================================

import Link from 'next/link';
import {
  BookOpenCheck,
  Shield,
  Clock,
  ArrowRight,
  Plus,
  ExternalLink,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { dbRepository } from '@/lib/db/sqlite-store';
import { DEMO_ORG, seedDemoData } from '@/lib/demo-data';
export default async function PoliciesPage() {
  seedDemoData(false);
  const orgId = DEMO_ORG.id;

  const requirements = dbRepository.getRequirements(orgId);
  const policyChanges = dbRepository.getPolicyChanges(orgId);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Policies & Framework Requirements</h1>
            <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {requirements.length} Requirements
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            SOC 2, ISO 27001, HIPAA regulatory mappings and policy impact assessment workflows
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/policies/changes"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <span>External Policy Changes ({policyChanges.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* FRAMEWORKS BREAKDOWN */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Framework</span>
          <div className="text-base font-bold text-slate-900 mt-1">SOC 2 Type II</div>
          <div className="text-xs text-slate-500 mt-0.5">Security, Availability, Confidentiality</div>
          <div className="mt-3 text-xs text-blue-600 font-medium">3 Controls Mapped</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Framework</span>
          <div className="text-base font-bold text-slate-900 mt-1">ISO/IEC 27001:2022</div>
          <div className="text-xs text-slate-500 mt-0.5">Information Security Management</div>
          <div className="mt-3 text-xs text-blue-600 font-medium">2 Controls Mapped</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Framework</span>
          <div className="text-base font-bold text-slate-900 mt-1">HIPAA Security Rule</div>
          <div className="text-xs text-slate-500 mt-0.5">45 CFR § 164.312 Technical Safeguards</div>
          <div className="mt-3 text-xs text-blue-600 font-medium">1 Control Mapped</div>
        </div>
      </div>

      {/* REQUIREMENTS LIST */}
      <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-2xs">
        <div className="px-5 py-3.5 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpenCheck className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-semibold text-slate-900">Regulatory Obligations Catalog</h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">Applicable Standard Clauses</span>
        </div>

        <div className="divide-y divide-slate-100">
          {requirements.map(req => (
            <div key={req.id} className="p-4 hover:bg-slate-50/50 transition-colors space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-xs">
                    {req.code}
                  </span>
                  <span className="font-semibold text-slate-900 text-sm">{req.name}</span>
                </div>
                <span className="font-mono font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                  {req.framework}
                </span>
              </div>
              <p className="text-slate-600 leading-relaxed">{req.description}</p>
              <div className="flex items-center gap-4 text-slate-400 text-[11px] pt-1">
                <span>Authority: <strong className="text-slate-700">{req.issuing_authority}</strong></span>
                <span>•</span>
                <span>Jurisdiction: <strong className="text-slate-700">{req.jurisdiction}</strong></span>
                <span>•</span>
                <span>Owner: <strong className="text-slate-700">{req.owner}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
