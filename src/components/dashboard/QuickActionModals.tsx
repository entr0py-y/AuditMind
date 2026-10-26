// ==============================================================================
// AUDITMIND - QUICK ACTION MODALS
// Allows instant creation of controls, recording tests, and logging findings.
// ==============================================================================

'use client';

import React, { useState } from 'react';
import { Plus, X, Shield, FileCheck, AlertTriangle } from 'lucide-react';
import { createControlAction, recordControlTestAction, createFindingAction } from '@/lib/actions';
import { Control } from '@/types';

export function QuickActionModals({ controls = [] }: { controls: Control[] }) {
  const [modalType, setModalType] = useState<'NONE' | 'CONTROL' | 'TEST' | 'FINDING'>('NONE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const closeModal = () => {
    setModalType('NONE');
    setErrorMsg(null);
  };

  const handleCreateControl = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const formData = new FormData(e.currentTarget);
      await createControlAction(formData);
      closeModal();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecordTest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const formData = new FormData(e.currentTarget);
      await recordControlTestAction(formData);
      closeModal();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateFinding = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const formData = new FormData(e.currentTarget);
      await createFindingAction(formData);
      closeModal();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* QUICK ACTION BUTTONS */}
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          onClick={() => setModalType('CONTROL')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Control</span>
        </button>
        <button
          onClick={() => setModalType('TEST')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
        >
          <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Record Test</span>
        </button>
        <button
          onClick={() => setModalType('FINDING')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
          <span>Log Finding</span>
        </button>
      </div>

      {/* MODAL WRAPPER */}
      {modalType !== 'NONE' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-md bg-blue-50 border border-blue-100 text-blue-600">
                  {modalType === 'CONTROL' && <Shield className="w-4 h-4" />}
                  {modalType === 'TEST' && <FileCheck className="w-4 h-4 text-emerald-600" />}
                  {modalType === 'FINDING' && <AlertTriangle className="w-4 h-4 text-rose-600" />}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    {modalType === 'CONTROL' && 'Add Compliance Control'}
                    {modalType === 'TEST' && 'Record Control Effectiveness Test'}
                    {modalType === 'FINDING' && 'Log Audit Finding / Deficiency'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {modalType === 'CONTROL' && 'Register a new policy control in the organization catalog'}
                    {modalType === 'TEST' && 'Append a formal operating test record into immutable history'}
                    {modalType === 'FINDING' && 'Document a new audit exception and assign remediation'}
                  </p>
                </div>
              </div>
              <button onClick={closeModal} className="p-1 text-slate-400 hover:text-slate-600 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="mx-5 mt-4 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {errorMsg}
              </div>
            )}

            {/* CREATE CONTROL FORM */}
            {modalType === 'CONTROL' && (
              <form onSubmit={handleCreateControl} className="p-5 space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Control Code *</label>
                    <input
                      required
                      name="code"
                      placeholder="e.g. AC-003"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono focus:outline-blue-600 uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Risk Level *</label>
                    <select name="riskLevel" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs">
                      <option value="CRITICAL">Critical</option>
                      <option value="HIGH">High</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="LOW">Low</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Control Name *</label>
                  <input
                    required
                    name="name"
                    placeholder="e.g. Just-In-Time Database Access"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-blue-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
                    <select name="category" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs">
                      <option value="Access Control">Access Control</option>
                      <option value="Data Protection">Data Protection</option>
                      <option value="Change Management">Change Management</option>
                      <option value="Incident Response">Incident Response</option>
                      <option value="Vulnerability Management">Vulnerability Management</option>
                      <option value="Business Continuity">Business Continuity</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Testing Frequency *</label>
                    <select name="testingFrequency" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs">
                      <option value="QUARTERLY">Quarterly</option>
                      <option value="MONTHLY">Monthly</option>
                      <option value="SEMI_ANNUALLY">Semi-Annually</option>
                      <option value="ANNUALLY">Annually</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Description *</label>
                  <textarea
                    required
                    name="description"
                    rows={2}
                    placeholder="Detailed explanation of the control requirement and enforcement mechanism..."
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-blue-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Owner *</label>
                    <input
                      required
                      name="owner"
                      placeholder="e.g. Alex Kumar (DevOps Lead)"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Control Type</label>
                    <select name="controlType" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs">
                      <option value="PREVENTIVE">Preventive</option>
                      <option value="DETECTIVE">Detective</option>
                      <option value="CORRECTIVE">Corrective</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Evidence Requirements</label>
                  <input
                    name="evidenceRequirements"
                    placeholder="e.g. AWS IAM permission set exports, Teleport audit logs"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs disabled:opacity-50"
                  >
                    {isSubmitting ? 'Creating...' : 'Create Control'}
                  </button>
                </div>
              </form>
            )}

            {/* RECORD TEST FORM */}
            {modalType === 'TEST' && (
              <form onSubmit={handleRecordTest} className="p-5 space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Control *</label>
                  <select required name="controlId" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono">
                    {controls.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.code} — {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Test Outcome *</label>
                    <select name="result" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold">
                      <option value="PASS">PASS (Operating Effectively)</option>
                      <option value="FAIL">FAIL (Exception Identified)</option>
                      <option value="PARTIALLY_EFFECTIVE">Partially Effective</option>
                      <option value="UNABLE_TO_CONCLUDE">Unable to Conclude</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tester Name *</label>
                    <input
                      required
                      name="tester"
                      defaultValue="Internal Audit Team"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Test Objective *</label>
                  <input
                    required
                    name="testObjective"
                    placeholder="e.g. Verify quarterly access review sign-off sheets for production AWS accounts."
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Test Procedure & Sample Description *</label>
                  <textarea
                    required
                    name="testProcedure"
                    rows={2}
                    placeholder="Describe testing methodology, sample size (e.g. 25 accounts sampled), and verification artifacts inspected..."
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Exceptions Identified (if any)</label>
                  <input
                    name="exceptions"
                    placeholder="Describe any non-conformities, deviations, or lingering access..."
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Formal Conclusion *</label>
                  <textarea
                    required
                    name="conclusion"
                    rows={2}
                    placeholder="Auditor formal opinion on control operating effectiveness..."
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs disabled:opacity-50"
                  >
                    {isSubmitting ? 'Recording...' : 'Append Test Record'}
                  </button>
                </div>
              </form>
            )}

            {/* LOG FINDING FORM */}
            {modalType === 'FINDING' && (
              <form onSubmit={handleCreateFinding} className="p-5 space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Finding Code *</label>
                    <input
                      required
                      name="code"
                      placeholder="e.g. FND-005"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Severity *</label>
                    <select name="severity" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs">
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="LOW">Low</option>
                      <option value="INFORMATIONAL">Informational</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Finding Title *</label>
                  <input
                    required
                    name="title"
                    placeholder="e.g. Missing MFA enforcement for staging SSH bastion"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Description & Root Cause *</label>
                  <textarea
                    required
                    name="description"
                    rows={2}
                    placeholder="Explain the deficiency, how it was discovered, and root cause..."
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Owner *</label>
                    <input
                      required
                      name="assignedOwner"
                      placeholder="e.g. Alex Kumar"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Target Date *</label>
                    <input
                      required
                      type="date"
                      name="targetRemediationDate"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Linked Control (Optional)</label>
                  <select name="controlId" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono">
                    <option value="">-- None / General Finding --</option>
                    {controls.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.code} — {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs disabled:opacity-50"
                  >
                    {isSubmitting ? 'Logging...' : 'Log Finding'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
