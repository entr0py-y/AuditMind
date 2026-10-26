// ==============================================================================
// AUDITMIND - EVIDENCE LIBRARY & DOCUMENT INTELLIGENCE
// Secure evidence storage, PDF text extraction, entity matching, and provenance.
// ==============================================================================

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FolderArchive,
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Shield,
  Search,
  ExternalLink,
  Sparkles,
  FileCode,
  FileSpreadsheet,
} from 'lucide-react';
import { EvidenceFile, Control } from '@/types';

export default function EvidencePage() {
  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceFile[]>([]);
  const [controls, setControls] = useState<Control[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadResult, setUploadResult] = useState<any>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/demo/seed', { method: 'POST' });
      // Reload controls and evidence
      const chatRes = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'get_missing_evidence' }),
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch from SSR data or client endpoint
    fetch('/api/export/controls')
      .catch(() => {});
    setIsLoading(false);
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('uploadedBy', 'Elena Rostova (CISO)');

    try {
      const res = await fetch('/api/evidence/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setUploadResult(data);
      // Reload page state
      window.location.reload();
    } catch (err: any) {
      alert(`Upload error: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Evidence Library</h1>
            <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              DOCUMENT VAULT
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographically verified audit artifacts, automated PDF text extraction, and control associations
          </p>
        </div>

        {/* UPLOAD EVIDENCE BUTTON */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>{isUploading ? 'Ingesting Artifact...' : 'Upload Evidence File'}</span>
            <input
              type="file"
              onChange={handleFileUpload}
              disabled={isUploading}
              accept=".pdf,.txt,.csv,.json,.xlsx"
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* DOCUMENT EXTRACTION SUCCESS POPUP */}
      {uploadResult && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-slate-800 text-xs space-y-2 animate-in fade-in">
          <div className="flex items-center gap-2 font-bold text-blue-900 text-sm">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Document Intelligence Pipeline Complete: {uploadResult.proposal?.sourceFilename}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-2.5 rounded bg-white border border-blue-100">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Classification</span>
              <div className="font-bold text-slate-900 mt-0.5">{uploadResult.proposal?.proposedClassification}</div>
            </div>
            <div className="p-2.5 rounded bg-white border border-blue-100">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Identified Controls</span>
              <div className="font-bold text-blue-700 mt-0.5">
                {uploadResult.proposal?.identifiedControls?.length || 0} Controls Matched
              </div>
            </div>
            <div className="p-2.5 rounded bg-white border border-blue-100">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">SHA-256 Checksum</span>
              <div className="font-mono text-[10px] truncate text-slate-600 mt-0.5">{uploadResult.proposal?.checksum}</div>
            </div>
          </div>
          <p className="text-slate-600 text-[11px] pt-1">
            Snippet: "{uploadResult.proposal?.extractedTextSnippet}..."
          </p>
        </div>
      )}

      {/* EVIDENCE ARTIFACTS INVENTORY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* ARTIFACT 1: SOC 2 TYPE II REPORT */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-red-50 text-red-600 border border-red-100">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <span className="font-mono text-xs font-bold text-blue-600">EVI-001</span>
                <h3 className="text-sm font-bold text-slate-900">2025 Annual SOC 2 Type II Final Auditor Report</h3>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200">
              VALID
            </span>
          </div>

          <p className="text-xs text-slate-600 line-clamp-2">
            Official signed SOC 2 Type II independent service auditor report issued by Kroll & Co. for period Oct 1, 2024 to Sep 30, 2025.
          </p>

          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 font-mono text-[11px] text-slate-600 space-y-1">
            <div className="flex justify-between">
              <span>File: Northstar_2025_SOC2_TypeII_Report_Signed.pdf</span>
              <span>4.89 MB</span>
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              SHA-256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-slate-400">Uploaded by: Elena Rostova</span>
            <span className="text-blue-600 font-medium">Mapped to: AUD-2025-01, AC-001, CM-001</span>
          </div>
        </div>

        {/* ARTIFACT 2: ACCESS REVIEW SIGNOFFS */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <span className="font-mono text-xs font-bold text-blue-600">EVI-002</span>
                <h3 className="text-sm font-bold text-slate-900">Q3 2025 Okta User Access Review Signoff Spreadsheet</h3>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200">
              VALID
            </span>
          </div>

          <p className="text-xs text-slate-600 line-clamp-2">
            Engineering and Operations manager sign-off checklist for Q3 2025 access certification.
          </p>

          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 font-mono text-[11px] text-slate-600 space-y-1">
            <div className="flex justify-between">
              <span>File: Q3_2025_Access_Review_Signoffs.xlsx</span>
              <span>245.1 KB</span>
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              SHA-256: 9f83c605d4c82b3e925b4290f1036f5413f29b556b605c5ec22e6261c7f0d611
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-slate-400">Uploaded by: David Park</span>
            <span className="text-blue-600 font-medium">Mapped to: AC-001</span>
          </div>
        </div>

        {/* ARTIFACT 3: FND-001 RESOLUTION DOCUMENT (PENDING REVIEW) */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <span className="font-mono text-xs font-bold text-blue-600">EVI-003</span>
                <h3 className="text-sm font-bold text-slate-900">Automated Offboarding Jira Workflow & SOP</h3>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-amber-50 text-amber-800 border border-amber-300 animate-pulse">
              PENDING REVIEW
            </span>
          </div>

          <p className="text-xs text-slate-600 line-clamp-2">
            Resolution evidence uploaded by employee stating contractor de-provisioning is now automated via Lambda.
          </p>

          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 font-mono text-[11px] text-slate-600 space-y-1">
            <div className="flex justify-between">
              <span>File: HR_Offboarding_Automation_SOP_v2.pdf</span>
              <span>890.1 KB</span>
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              SHA-256: ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-slate-400">Uploaded by: Alex Kumar</span>
            <span className="text-amber-700 font-medium">Mapped to: FND-001 (Awaiting verification)</span>
          </div>
        </div>

        {/* ARTIFACT 4: PENETRATION TEST REPORT */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-purple-50 text-purple-600 border border-purple-100">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <span className="font-mono text-xs font-bold text-blue-600">EVI-004</span>
                <h3 className="text-sm font-bold text-slate-900">2025 External Penetration Test Executive Summary</h3>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200">
              VALID
            </span>
          </div>

          <p className="text-xs text-slate-600 line-clamp-2">
            Annual grey-box penetration testing report delivered by Bishop Fox on November 2025.
          </p>

          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 font-mono text-[11px] text-slate-600 space-y-1">
            <div className="flex justify-between">
              <span>File: BishopFox_PenTest_Executive_Summary_2025.pdf</span>
              <span>1.94 MB</span>
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              SHA-256: 3a427f7f18b625c2763f684c3c2e7a3e742c069b2d3989dbf7324838ccb85ebc
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-slate-400">Uploaded by: Elena Rostova</span>
            <span className="text-blue-600 font-medium">Mapped to: VM-002, FND-004</span>
          </div>
        </div>
      </div>
    </div>
  );
}
