import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AppShell } from '@/components/layout/AppShell';
import { dbRepository } from '@/lib/db/sqlite-store';
import { DEMO_ORG, seedDemoData } from '@/lib/demo-data';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'AuditMind — AI Governance, Risk & Compliance Platform',
  description: 'AI-powered compliance and audit management with persistent audit memory, deterministic gap detection, and evidence-backed intelligence.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Ensure database initialized and seeded
  seedDemoData(false);

  const orgId = DEMO_ORG.id;
  const unreadNotifs = dbRepository.getNotifications(orgId).filter(n => !n.is_read).length;
  const activeGaps = dbRepository.getDetectedGaps(orgId, 'ACTIVE').length;

  // Build lightweight search index
  const controls = dbRepository.getControls(orgId);
  const audits = dbRepository.getAudits(orgId);
  const findings = dbRepository.getFindings(orgId);
  const evidence = dbRepository.getEvidenceFiles(orgId);

  const searchItems = [
    ...controls.map(c => ({
      id: c.id,
      code: c.code,
      title: c.name,
      type: 'CONTROL' as const,
      url: `/controls/${c.id}`,
      badge: c.latest_test_result,
    })),
    ...audits.map(a => ({
      id: a.id,
      code: a.code,
      title: a.title,
      type: 'AUDIT' as const,
      url: `/audits/${a.id}`,
      badge: a.status,
    })),
    ...findings.map(f => ({
      id: f.id,
      code: f.code,
      title: f.title,
      type: 'FINDING' as const,
      url: `/findings/${f.id}`,
      badge: f.severity,
    })),
    ...evidence.map(e => ({
      id: e.id,
      code: e.code,
      title: e.title,
      type: 'EVIDENCE' as const,
      url: `/evidence`,
      badge: e.file_type.split('/')[1] || 'DOC',
    })),
  ];

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-slate-50 text-slate-900">
        <AppShell
          unreadNotificationsCount={unreadNotifs}
          activeGapsCount={activeGaps}
          searchItems={searchItems}
        >
          {children}
        </AppShell>
      </body>
    </html>
  );
}
