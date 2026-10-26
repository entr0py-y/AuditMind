// ==============================================================================
// AUDITMIND - ENTERPRISE GRC APPLICATION SHELL
// Persistent sidebar, top bar, breadcrumbs, search trigger, and notification hub.
// ==============================================================================

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Bot,
  ShieldCheck,
  FileCheck2,
  AlertOctagon,
  FolderArchive,
  BookOpenCheck,
  Activity,
  FileBarChart2,
  Bell,
  Settings,
  ChevronDown,
  Search,
  Sparkles,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Menu,
  X,
} from 'lucide-react';
import { GlobalSearchModal } from '../search/GlobalSearchModal';
import { runMonitoringNowAction } from '@/lib/actions';

interface AppShellProps {
  children: React.ReactNode;
  unreadNotificationsCount?: number;
  activeGapsCount?: number;
  searchItems?: {
    id: string;
    code: string;
    title: string;
    type: 'CONTROL' | 'AUDIT' | 'FINDING' | 'EVIDENCE';
    url: string;
    badge: string;
  }[];
}

export function AppShell({
  children,
  unreadNotificationsCount = 0,
  activeGapsCount = 0,
  searchItems = [],
}: AppShellProps) {
  const pathname = usePathname();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isRunningCheck, setIsRunningCheck] = useState(false);

  const navLinks = [
    { name: 'Overview', href: '/', icon: LayoutDashboard },
    { name: 'AI Assistant', href: '/assistant', icon: Bot, isAi: true },
    { name: 'Controls & Requirements', href: '/controls', icon: ShieldCheck },
    { name: 'Audits', href: '/audits', icon: FileCheck2 },
    { name: 'Findings & Remediation', href: '/findings', icon: AlertOctagon, badge: activeGapsCount > 0 ? `${activeGapsCount}` : undefined },
    { name: 'Evidence Library', href: '/evidence', icon: FolderArchive },
    { name: 'Policies & Changes', href: '/policies', icon: BookOpenCheck },
    { name: 'Risk Register', href: '/risks', icon: Activity },
    { name: 'Reports', href: '/reports', icon: FileBarChart2 },
    { name: 'Notifications', href: '/notifications', icon: Bell, badge: unreadNotificationsCount > 0 ? `${unreadNotificationsCount}` : undefined },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const handleRunMonitoring = async () => {
    setIsRunningCheck(true);
    try {
      await runMonitoringNowAction();
    } catch (e) {
      console.error(e);
    } finally {
      setIsRunningCheck(false);
    }
  };

  // Generate dynamic breadcrumbs
  const getBreadcrumb = () => {
    if (pathname === '/') return 'Overview';
    const parts = pathname.split('/').filter(Boolean);
    return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' / ');
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 font-sans">
      {/* Global Search Dialog */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        items={searchItems}
      />

      {/* MOBILE SIDEBAR BACKDROP */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* LEFT SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800 transition-transform duration-200 lg:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* LOGO & BRAND */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800 bg-slate-950/40">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 font-bold text-sm tracking-wider">
              AM
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-white">AUDITMIND</span>
              <span className="text-[10px] block font-mono text-blue-400 font-medium -mt-1">
                COMPLIANCE AGENT
              </span>
            </div>
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-1 text-slate-400 hover:text-white lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* NAVIGATION LINKS */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navLinks.map(item => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.isAi ? 'text-blue-400' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-blue-800 text-white' : 'bg-slate-800 text-blue-300 border border-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {item.isAi && !isActive && (
                  <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* BOTTOM USER & ORGANIZATION BAR */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/30">
          <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60 mb-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Organization
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded font-semibold border border-amber-500/30">
                DEMO
              </span>
            </div>
            <div className="text-xs font-semibold text-white mt-1 truncate">
              Northstar Technologies
            </div>
          </div>

          <div className="flex items-center gap-3 px-2 py-1.5">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs text-white border border-slate-600">
              ER
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white truncate">Elena Rostova</div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <span>CISO</span>
                <span className="w-1 h-1 rounded-full bg-slate-500" />
                <span className="text-blue-400 font-mono text-[10px]">ADMIN</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* TOP BAR */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <Link href="/" className="hover:text-slate-800">AuditMind</Link>
              <span>/</span>
              <span className="text-slate-900 font-semibold">{getBreadcrumb()}</span>
            </div>
          </div>

          {/* TOP BAR ACTIONS */}
          <div className="flex items-center gap-3">
            {/* Global Search Button */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-500 text-xs transition-colors"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Search records...</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono text-slate-400">
                ⌘K
              </kbd>
            </button>

            {/* Run Proactive Compliance Check Button */}
            <button
              onClick={handleRunMonitoring}
              disabled={isRunningCheck}
              title="Run deterministic gap detection engine"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs transition-all disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isRunningCheck ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">Check Gaps</span>
            </button>

            {/* Notification Bell */}
            <Link
              href="/notifications"
              className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
              )}
            </Link>

            {/* Grounded Simulation Badge */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Persistent SQLite Local Engine</span>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
