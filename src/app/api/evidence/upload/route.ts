// ==============================================================================
// AUDITMIND - SECURE EVIDENCE UPLOAD & DOCUMENT PIPELINE API
// ==============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { processUploadedDocument } from '@/lib/services/document-service';
import { DEMO_ORG, seedDemoData } from '@/lib/demo-data';

export async function POST(req: NextRequest) {
  try {
    seedDemoData(false);
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const orgId = (formData.get('orgId') as string) || DEMO_ORG.id;
    const uploadedBy = (formData.get('uploadedBy') as string) || 'Compliance Manager';

    if (!file) {
      return NextResponse.json({ error: 'No file provided in form data.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await processUploadedDocument(
      buffer,
      file.name,
      file.type || 'application/octet-stream',
      orgId,
      uploadedBy
    );

    return NextResponse.json({
      success: true,
      evidenceFileId: result.evidenceFileId,
      proposal: result.proposal,
    });
  } catch (err: any) {
    console.error('Evidence upload error:', err);
    return NextResponse.json({ error: err.message || 'Failed to process evidence file.' }, { status: 500 });
  }
}
