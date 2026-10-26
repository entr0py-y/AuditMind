// ==============================================================================
// AUDITMIND - DOCUMENT INTELLIGENCE & EXTRACTION PIPELINE
// Validates file uploads, extracts server-side text, parses compliance entities,
// and produces structured extraction proposals with confidence ratings for human review.
// ==============================================================================

import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { dbRepository } from '../db/sqlite-store';

export interface DocumentExtractionProposal {
  sourceFilename: string;
  fileSizeBytes: number;
  checksum: string;
  extractedTextLength: number;
  extractedTextSnippet: string;
  identifiedControls: {
    code: string;
    matchedExisting: boolean;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    contextSnippet: string;
  }[];
  identifiedFindings: {
    title: string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    contextSnippet: string;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  }[];
  extractedDates: string[];
  proposedClassification: 'AUDIT_REPORT' | 'ACCESS_REVIEW' | 'PENETRATION_TEST' | 'POLICY_DOCUMENT' | 'EVIDENCE_OTHER';
}

const UPLOADS_DIR = path.join(process.cwd(), '.data', 'uploads');

export async function processUploadedDocument(
  fileBuffer: Buffer,
  originalFilename: string,
  mimeType: string,
  orgId: string,
  uploadedBy = 'Compliance Officer'
): Promise<{ evidenceFileId: string; proposal: DocumentExtractionProposal }> {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  // Security checks: file size max 25MB
  if (fileBuffer.length > 25 * 1024 * 1024) {
    throw new Error('File size exceeds the 25MB security limit.');
  }

  // Calculate SHA-256 Checksum
  const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');

  // Sanitize filename to prevent path traversal
  const sanitized = path.basename(originalFilename).replace(/[^a-zA-Z0-9._-]/g, '_');
  const storedFilename = `${Date.now()}_${sanitized}`;
  const filePath = path.join(UPLOADS_DIR, storedFilename);

  fs.writeFileSync(filePath, fileBuffer);

  // Extract text
  let extractedText = '';
  if (mimeType === 'application/pdf' || originalFilename.toLowerCase().endsWith('.pdf')) {
    try {
      // Dynamic import of pdf-parse
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse');
      const pdfData = await pdfParse(fileBuffer);
      extractedText = pdfData.text || '';
    } catch (err) {
      console.warn('PDF text extraction error (scanned or protected PDF):', err);
      extractedText = `[PDF text extraction limited or file contains scanned images: ${sanitized}]`;
    }
  } else if (
    mimeType.includes('text') ||
    mimeType.includes('json') ||
    mimeType.includes('csv') ||
    originalFilename.endsWith('.txt') ||
    originalFilename.endsWith('.csv') ||
    originalFilename.endsWith('.md')
  ) {
    extractedText = fileBuffer.toString('utf-8');
  } else {
    extractedText = `[Binary file uploaded: ${sanitized} (${mimeType})]`;
  }

  // Untrusted text protection: truncate excessive lengths
  const safeText = extractedText.slice(0, 100000);

  // NLP / Pattern Extraction
  const existingControls = dbRepository.getControls(orgId);
  const identifiedControls: DocumentExtractionProposal['identifiedControls'] = [];

  // Match known controls
  for (const c of existingControls) {
    const regex = new RegExp(`\\b${c.code}\\b`, 'i');
    if (regex.test(safeText)) {
      const matchIndex = safeText.search(regex);
      const start = Math.max(0, matchIndex - 60);
      const end = Math.min(safeText.length, matchIndex + 100);
      identifiedControls.push({
        code: c.code,
        matchedExisting: true,
        confidence: 'HIGH',
        contextSnippet: safeText.substring(start, end).replace(/\s+/g, ' ').trim(),
      });
    }
  }

  // Look for potential control codes like AC-XXX, CM-XXX, etc.
  const codeRegex = /\b([A-Z]{2,4}-\d{3})\b/g;
  let match;
  while ((match = codeRegex.exec(safeText)) !== null) {
    const code = match[1];
    if (!identifiedControls.some(ic => ic.code.toUpperCase() === code.toUpperCase())) {
      const isExisting = existingControls.some(ec => ec.code.toUpperCase() === code.toUpperCase());
      const start = Math.max(0, match.index - 50);
      const end = Math.min(safeText.length, match.index + 80);
      identifiedControls.push({
        code: code.toUpperCase(),
        matchedExisting: isExisting,
        confidence: isExisting ? 'HIGH' : 'MEDIUM',
        contextSnippet: safeText.substring(start, end).replace(/\s+/g, ' ').trim(),
      });
    }
  }

  // Look for finding/exception patterns
  const identifiedFindings: DocumentExtractionProposal['identifiedFindings'] = [];
  const findingPatterns = [
    { regex: /exception:?\s*([^\.\n]+)/gi, severity: 'HIGH' as const },
    { regex: /deficiency:?\s*([^\.\n]+)/gi, severity: 'HIGH' as const },
    { regex: /finding:?\s*([^\.\n]+)/gi, severity: 'MEDIUM' as const },
    { regex: /non-compliance:?\s*([^\.\n]+)/gi, severity: 'HIGH' as const },
    { regex: /vulnerability:?\s*([^\.\n]+)/gi, severity: 'MEDIUM' as const },
  ];

  for (const p of findingPatterns) {
    let fMatch;
    while ((fMatch = p.regex.exec(safeText)) !== null) {
      if (identifiedFindings.length < 5) {
        const snippet = fMatch[1].trim();
        if (snippet.length > 10) {
          identifiedFindings.push({
            title: snippet.slice(0, 120),
            severity: p.severity,
            contextSnippet: safeText.substring(Math.max(0, fMatch.index - 40), Math.min(safeText.length, fMatch.index + 120)).replace(/\s+/g, ' ').trim(),
            confidence: 'MEDIUM',
          });
        }
      }
    }
  }

  // Extract Dates (e.g. 2025-10-20, October 15, 2025)
  const dateRegex = /\b(\d{4}-\d{2}-\d{2}|\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},?\s+\d{4})\b/gi;
  const datesFound = Array.from(new Set(safeText.match(dateRegex) || [])).slice(0, 8);

  // Classify Document
  let classification: DocumentExtractionProposal['proposedClassification'] = 'EVIDENCE_OTHER';
  const lowerText = safeText.toLowerCase();
  if (lowerText.includes('soc 2') || lowerText.includes('type ii') || lowerText.includes('independent service auditor')) {
    classification = 'AUDIT_REPORT';
  } else if (lowerText.includes('access review') || lowerText.includes('user review') || lowerText.includes('privilege entitlement')) {
    classification = 'ACCESS_REVIEW';
  } else if (lowerText.includes('penetration test') || lowerText.includes('vulnerability assessment') || lowerText.includes('cve-')) {
    classification = 'PENETRATION_TEST';
  } else if (lowerText.includes('policy') || lowerText.includes('standard operating procedure') || lowerText.includes('guidelines')) {
    classification = 'POLICY_DOCUMENT';
  }

  const proposal: DocumentExtractionProposal = {
    sourceFilename: sanitized,
    fileSizeBytes: fileBuffer.length,
    checksum,
    extractedTextLength: safeText.length,
    extractedTextSnippet: safeText.slice(0, 400).replace(/\s+/g, ' ').trim(),
    identifiedControls,
    identifiedFindings,
    extractedDates: datesFound,
    proposedClassification: classification,
  };

  // Generate unique evidence code
  const existingEvidence = dbRepository.getEvidenceFiles(orgId);
  const nextNum = existingEvidence.length + 1;
  const code = `EVI-${String(nextNum).padStart(3, '0')}`;

  const evidenceRecord = dbRepository.createEvidenceFile({
    org_id: orgId,
    code,
    title: originalFilename.replace(/\.[^/.]+$/, ''),
    description: `Auto-ingested ${classification.replace('_', ' ').toLowerCase()} artifact with ${identifiedControls.length} linked control references.`,
    original_filename: sanitized,
    file_type: mimeType,
    file_size: fileBuffer.length,
    storage_path: filePath,
    uploaded_by: uploadedBy,
    review_status: 'VALID',
    checksum,
    extracted_text: safeText,
  });

  // Link to identified existing controls
  for (const ic of identifiedControls) {
    if (ic.matchedExisting) {
      const matchCtrl = existingControls.find(c => c.code.toUpperCase() === ic.code.toUpperCase());
      if (matchCtrl) {
        dbRepository.linkEvidence(orgId, evidenceRecord.id, 'CONTROL', matchCtrl.id, `Matched in ${sanitized}`);
      }
    }
  }

  return {
    evidenceFileId: evidenceRecord.id,
    proposal,
  };
}
