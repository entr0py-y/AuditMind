// ==============================================================================
// AUDITMIND - GLOBAL SEARCH MODAL (CMD+K)
// Fast keyboard-first search across Controls, Audits, Findings, and Evidence
// ==============================================================================

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Shield, FileCheck, AlertTriangle, FileText, X } from 'lucide-react';

interface SearchResultItem {
  id: string;
  code: string;
  title: string;
  type: 'CONTROL' | 'AUDIT' | 'FINDING' | 'EVIDENCE';
  url: string;
  badge: string;
}

export function GlobalSearchModal({
  isOpen,
  onClose,
  items,
}: {
  isOpen: boolean;
  onClose: () => void;
  items: SearchResultItem[];
}) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Trigger open
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filtered = query.trim()
    ? items.filter(
        i =>
          i.code.toLowerCase().includes(query.toLowerCase()) ||
          i.title.toLowerCase().includes(query.toLowerCase()) ||
          i.type.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : items.slice(0, 6);

  const getIcon = (type: string) => {
    switch (type) {
      case 'CONTROL':
        return <Shield className="w-4 h-4 text-blue-600" />;
      case 'AUDIT':
        return <FileCheck className="w-4 h-4 text-emerald-600" />;
      case 'FINDING':
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      default:
        return <FileText className="w-4 h-4 text-indigo-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="relative border-b border-slate-100 flex items-center px-4">
          <Search className="w-5 h-5 text-slate-400 mr-2" />
          <input
            autoFocus
            type="text"
            placeholder="Search controls, audits, findings, evidence... (Esc to close)"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full py-3 text-sm text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="p-2 max-h-96 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">
              No matching records found for "{query}".
            </div>
          ) : (
            <div className="space-y-1">
              <div className="px-2 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {query ? 'Results' : 'Suggested Records'}
              </div>
              {filtered.map(item => (
                <Link
                  key={`${item.type}-${item.id}`}
                  href={item.url}
                  onClick={onClose}
                  className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-md bg-slate-100 group-hover:bg-white border border-slate-200">
                      {getIcon(item.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-slate-900">{item.code}</span>
                        <span className="text-xs text-slate-500">{item.type}</span>
                      </div>
                      <div className="text-sm text-slate-700 line-clamp-1">{item.title}</div>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600">
                    {item.badge}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px]">↑↓</span>
            <span>Navigate</span>
            <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px] ml-2">↵</span>
            <span>Select</span>
          </div>
          <span>AuditMind Search</span>
        </div>
      </div>
    </div>
  );
}
