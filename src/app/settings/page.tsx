// ==============================================================================
// AUDITMIND - SETTINGS & ENVIRONMENT CONFIGURATION
// Organization settings, role-based access matrix, database mode, and demo reset controls.
// ==============================================================================

'use client';

import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Database,
  Bot,
  Key,
  RotateCcw,
  CheckCircle2,
  Users,
  AlertTriangle,
  Server,
  Lock,
} from 'lucide-react';
import { DEMO_ORG } from '@/lib/constants';

export default function SettingsPage() {
  const [isResetting, setIsResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const handleResetDemoData = async () => {
    if (!confirm('Are you sure you want to re-seed demo data? This will reset Northstar Technologies records to their pristine demonstration states.')) {
      return;
    }

    setIsResetting(true);
    setResetMessage(null);
    try {
      const res = await fetch('/api/demo/seed?force=true', { method: 'POST' });
      const data = await res.json();
      setResetMessage(data.message || 'Demo data successfully re-seeded.');
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (e: any) {
      alert(`Error resetting demo data: ${e.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* HEADER */}
      <div className="pb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">System Settings & Administration</h1>
          <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            CONFIGURATION
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Organization profiles, role-based access permissions, database engines, and runtime integrations
        </p>
      </div>

      {resetMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{resetMessage}</span>
        </div>
      )}

      {/* ORGANIZATION PROFILE */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-600" />
          <span>Active Organization Profile</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="text-slate-500 font-medium">Organization Name</label>
            <div className="font-semibold text-slate-900 mt-0.5">{DEMO_ORG.name}</div>
          </div>
          <div>
            <label className="text-slate-500 font-medium">Slug Identifier</label>
            <div className="font-mono text-slate-700 mt-0.5">{DEMO_ORG.slug}</div>
          </div>
          <div>
            <label className="text-slate-500 font-medium">Industry Classification</label>
            <div className="font-semibold text-slate-900 mt-0.5">{DEMO_ORG.industry}</div>
          </div>
          <div>
            <label className="text-slate-500 font-medium">Tenant Data Mode</label>
            <div className="text-emerald-700 font-semibold mt-0.5">Persistent Isolated Workspace (Demo)</div>
          </div>
        </div>
      </div>

      {/* ENVIRONMENT & ENGINE STATUS */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <Server className="w-4 h-4 text-indigo-600" />
          <span>Runtime Environment & Integrations</span>
        </h3>

        <div className="space-y-3 text-xs">
          {/* DATABASE ADAPTER */}
          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="w-4 h-4 text-blue-600" />
              <div>
                <div className="font-semibold text-slate-900">Database Engine</div>
                <div className="text-slate-500 text-[11px]">
                  Node.js Built-in Persistent Relational SQLite (<code className="font-mono text-[10px]">.data/auditmind.sqlite</code>)
                </div>
              </div>
            </div>
            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              OPERATIONAL
            </span>
          </div>

          {/* AI ASSISTANT ENGINE */}
          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bot className="w-4 h-4 text-purple-600" />
              <div>
                <div className="font-semibold text-slate-900">AI Assistant Intelligence</div>
                <div className="text-slate-500 text-[11px]">
                  Local Grounded Compliance Engine (Zero-Hallucination, 12 Structured Tools)
                </div>
              </div>
            </div>
            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              ACTIVE (RULE-GROUNDED)
            </span>
          </div>

          {/* SCHEDULED CRON MONITOR */}
          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Lock className="w-4 h-4 text-amber-600" />
              <div>
                <div className="font-semibold text-slate-900">Periodic Compliance Checks</div>
                <div className="text-slate-500 text-[11px]">
                  Authenticated cron webhook available at <code className="font-mono text-[10px]">POST /api/cron/monitor</code>
                </div>
              </div>
            </div>
            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              IDEMPOTENT ENDPOINT
            </span>
          </div>
        </div>
      </div>

      {/* ROLE-BASED ACCESS CONTROL (RBAC) MATRIX */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-700" />
          <span>Role-Based Access Control (RBAC) Matrix</span>
        </h3>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-600 text-[10px] uppercase font-semibold">
              <tr>
                <th className="p-2.5">Role</th>
                <th className="p-2.5">Controls & Tests</th>
                <th className="p-2.5">Audits</th>
                <th className="p-2.5">Remediation</th>
                <th className="p-2.5">Settings & Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="p-2.5 font-bold font-mono text-blue-600">ADMIN</td>
                <td className="p-2.5 text-emerald-600 font-semibold">Full Access</td>
                <td className="p-2.5 text-emerald-600 font-semibold">Full Access</td>
                <td className="p-2.5 text-emerald-600 font-semibold">Full Access</td>
                <td className="p-2.5 text-emerald-600 font-semibold">Full Access</td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold font-mono text-purple-600">COMPLIANCE_MANAGER</td>
                <td className="p-2.5 text-emerald-600 font-semibold">Create / Edit</td>
                <td className="p-2.5 text-emerald-600 font-semibold">Create / Edit</td>
                <td className="p-2.5 text-emerald-600 font-semibold">Manage / Approve</td>
                <td className="p-2.5 text-slate-400">Read Only</td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold font-mono text-emerald-600">AUDITOR</td>
                <td className="p-2.5 text-emerald-600 font-semibold">Record Tests</td>
                <td className="p-2.5 text-emerald-600 font-semibold">Workpapers</td>
                <td className="p-2.5 text-emerald-600 font-semibold">Verify Remediation</td>
                <td className="p-2.5 text-slate-400">No Access</td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold font-mono text-amber-600">CONTROL_OWNER</td>
                <td className="p-2.5 text-slate-600">View Assigned</td>
                <td className="p-2.5 text-slate-400">Read Only</td>
                <td className="p-2.5 text-emerald-600 font-semibold">Submit Evidence</td>
                <td className="p-2.5 text-slate-400">No Access</td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold font-mono text-slate-600">VIEWER</td>
                <td className="p-2.5 text-slate-400">Read Only</td>
                <td className="p-2.5 text-slate-400">Read Only</td>
                <td className="p-2.5 text-slate-400">Read Only</td>
                <td className="p-2.5 text-slate-400">No Access</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* DEMO DATA RE-SEED CONTROLS */}
      <div className="bg-white rounded-xl border border-rose-200/80 p-5 shadow-2xs space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600" />
          <h3 className="text-sm font-semibold text-slate-900">Demonstration Data Controls</h3>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Reset Northstar Technologies demonstration fixtures back to initial state (restores AC-001 access review history, recurring findings, unverified remediations, and sample audit workpapers).
        </p>

        <button
          onClick={handleResetDemoData}
          disabled={isResetting}
          className="flex items-center gap-2 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
          <span>{isResetting ? 'Resetting Demo Data...' : 'Reset & Re-seed Demo Data'}</span>
        </button>
      </div>
    </div>
  );
}
