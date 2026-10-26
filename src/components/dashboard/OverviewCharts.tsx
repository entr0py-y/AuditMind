// ==============================================================================
// AUDITMIND - DASHBOARD DATA VISUALIZATIONS (RECHARTS)
// Displays testing outcome distributions and findings severity breakdowns.
// ==============================================================================

'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface OverviewChartsProps {
  testOutcomes: {
    passed: number;
    failed: number;
    partiallyEffective: number;
    notTested: number;
  };
  findingSeverities: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export function OverviewCharts({ testOutcomes, findingSeverities }: OverviewChartsProps) {
  const outcomeData = [
    { name: 'Passing', count: testOutcomes.passed, color: '#10b981' },
    { name: 'Failing', count: testOutcomes.failed, color: '#ef4444' },
    { name: 'Partially Effective', count: testOutcomes.partiallyEffective, color: '#f59e0b' },
    { name: 'Not Tested', count: testOutcomes.notTested, color: '#94a3b8' },
  ];

  const severityData = [
    { name: 'Critical', value: findingSeverities.critical, color: '#dc2626' },
    { name: 'High', value: findingSeverities.high, color: '#f97316' },
    { name: 'Medium', value: findingSeverities.medium, color: '#eab308' },
    { name: 'Low', value: findingSeverities.low, color: '#3b82f6' },
  ].filter(d => d.value > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* CONTROL EFFECTIVENESS BAR CHART */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Control Testing Outcomes</h3>
            <p className="text-xs text-slate-500">Latest recorded test result across active controls</p>
          </div>
          <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
            {testOutcomes.passed + testOutcomes.failed + testOutcomes.partiallyEffective + testOutcomes.notTested} controls
          </span>
        </div>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={outcomeData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
              <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#334155' }} width={110} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', border: 'none', fontSize: '12px' }}
                cursor={{ fill: '#f1f5f9' }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {outcomeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* OPEN FINDINGS SEVERITY PIE */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Open Findings by Severity</h3>
            <p className="text-xs text-slate-500">Unresolved deficiencies awaiting verified remediation</p>
          </div>
          <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
            {findingSeverities.critical + findingSeverities.high + findingSeverities.medium + findingSeverities.low} open
          </span>
        </div>
        <div className="h-56 w-full flex items-center justify-center">
          {severityData.length === 0 ? (
            <div className="text-xs text-slate-400">No open findings recorded.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', border: 'none', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="flex justify-center gap-4 text-xs font-medium text-slate-600 pt-2 border-t border-slate-100">
          {outcomeData.slice(0, 3).map(o => (
            <div key={o.name} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: o.color }} />
              <span>{o.name}: {o.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
