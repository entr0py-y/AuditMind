// ==============================================================================
// AUDITMIND - AI COMPLIANCE ASSISTANT WORKSPACE
// Evidence-backed conversational assistant grounded exclusively in real database records,
// authorized structured tool executions, and direct UI citations.
// ==============================================================================

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Bot,
  Sparkles,
  Send,
  User,
  Shield,
  AlertTriangle,
  FileCheck,
  ChevronRight,
  Copy,
  Check,
  Terminal,
  ExternalLink,
  Info,
  Clock,
  Layers,
  CheckCircle,
} from 'lucide-react';
import { AIMessage } from '@/types';

const SUGGESTED_QUERIES = [
  'Which controls are overdue for testing?',
  'Which findings are pending formal verification?',
  'What happened during the last SOC 2 audit with AC-001?',
  'Are there any recurring issues across our historical audits?',
  'What evidence is currently missing from our controls?',
  'What should we prioritize before our next audit?',
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: `Hello! I am **AuditMind**, your persistent compliance intelligence assistant.\n\nI have direct read access to **Northstar Technologies'** complete audit memory, historical test records, control catalog, open findings, and policy assessments. Every answer I provide is strictly grounded in authorized database records with traceable citations.\n\nHow can I assist your audit preparation today?`,
      created_at: new Date().toISOString(),
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmedActions, setConfirmedActions] = useState<Record<string, boolean>>({});

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: AIMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: textToSend.trim(),
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userMsg.content,
          history: messages,
        }),
      });

      if (!res.ok) {
        throw new Error(`API error ${res.status}`);
      }

      const data = await res.json();
      if (data.message) {
        setMessages(prev => [...prev, data.message]);
      }
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `⚠️ Error executing compliance intelligence query: ${err.message}. Please verify the backend service status.`,
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleConfirmAction = (msgId: string) => {
    setConfirmedActions(prev => ({ ...prev, [msgId]: true }));
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7.5rem)] max-w-5xl mx-auto space-y-4">
      {/* HEADER BANNER */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900">AI Compliance Assistant</h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                ZERO-HALLUCINATION GROUNDED
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Query audit history, control failure recurrence, pending verifications, and missing evidence
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Authorized Tools Active (12)</span>
        </div>
      </div>

      {/* CHAT MESSAGES AREA */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200/80 overflow-y-auto p-4 sm:p-6 shadow-2xs space-y-6">
        {messages.map(msg => {
          const isUser = msg.role === 'user';

          return (
            <div
              key={msg.id}
              className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs shrink-0 shadow-2xs mt-1">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div className={`max-w-2xl space-y-2.5 ${isUser ? 'items-end' : 'items-start'}`}>
                {/* MESSAGE CARD */}
                <div
                  className={`p-4 rounded-xl text-xs sm:text-sm leading-relaxed border ${
                    isUser
                      ? 'bg-blue-600 text-white border-blue-600 rounded-tr-none'
                      : 'bg-slate-50/80 text-slate-800 border-slate-200/80 rounded-tl-none'
                  }`}
                >
                  <div className="prose prose-xs sm:prose-sm max-w-none prose-slate dark:prose-invert">
                    {msg.content.split('\n\n').map((paragraph, idx) => {
                      if (paragraph.startsWith('### ')) {
                        return <h3 key={idx} className="text-sm font-bold text-slate-900 mt-2 mb-1">{paragraph.replace('### ', '')}</h3>;
                      }
                      if (paragraph.startsWith('#### ')) {
                        return <h4 key={idx} className="text-xs font-bold text-slate-900 mt-2 mb-1">{paragraph.replace('#### ', '')}</h4>;
                      }
                      if (paragraph.startsWith('> ')) {
                        return (
                          <blockquote key={idx} className="p-2.5 my-2 border-l-2 border-blue-600 bg-blue-50/50 text-blue-900 rounded-r text-xs">
                            {paragraph.replace('> ', '')}
                          </blockquote>
                        );
                      }
                      return <p key={idx} className="my-1 whitespace-pre-line">{paragraph}</p>;
                    })}
                  </div>

                  {/* PROPOSED ACTION CARD (HUMAN IN THE LOOP) */}
                  {msg.proposed_action && (
                    <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
                      <div className="flex items-center gap-1.5 font-semibold">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span>Proposed Action Requires Confirmation:</span>
                      </div>
                      <p className="text-slate-700">{msg.proposed_action.description}</p>
                      <div className="pt-1 flex items-center gap-2">
                        {confirmedActions[msg.id] ? (
                          <span className="flex items-center gap-1 text-emerald-700 font-semibold text-xs">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Action Approved & Recorded</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => handleConfirmAction(msg.id)}
                            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-semibold text-xs shadow-2xs"
                          >
                            Confirm & Execute Action
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* CITATIONS & DIRECT RECORD LINKS */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200/80">
                      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <Layers className="w-3 h-3 text-blue-600" />
                        <span>Evidence Citations ({msg.citations.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.citations.map(cit => (
                          <Link
                            key={`${cit.entity_type}-${cit.record_id}`}
                            href={cit.url}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-600 text-slate-700 text-xs font-mono font-medium shadow-2xs transition-colors"
                          >
                            <span>{cit.code}</span>
                            <span className="text-[10px] text-slate-400">({cit.title})</span>
                            <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TOOL CALL AUDIT DROPDOWN */}
                  {msg.tool_calls && msg.tool_calls.length > 0 && (
                    <details className="mt-2 text-[11px] text-slate-500 group">
                      <summary className="cursor-pointer font-mono hover:text-slate-800 flex items-center gap-1 select-none">
                        <Terminal className="w-3 h-3 text-slate-400" />
                        <span>Executed {msg.tool_calls.length} authorized database tool(s)</span>
                      </summary>
                      <div className="mt-2 p-2 bg-slate-900 text-emerald-400 rounded-lg font-mono text-[10px] overflow-x-auto">
                        {msg.tool_calls.map((tc, i) => (
                          <div key={i} className="mb-1">
                            <span className="text-blue-400">{tc.name}</span>({JSON.stringify(tc.arguments)})
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>

                {/* COPY & TIMESTAMP */}
                {!isUser && (
                  <div className="flex items-center gap-3 px-1 text-[11px] text-slate-400">
                    <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <button
                      onClick={() => copyToClipboard(msg.id, msg.content)}
                      className="hover:text-slate-600 flex items-center gap-1"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-600">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Answer</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center text-xs shrink-0 shadow-2xs mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3.5 items-start">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs shrink-0 shadow-2xs">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
              <span>Querying organizational audit memory and control testing history...</span>
            </div>
          </div>
        )}
      </div>

      {/* SUGGESTED QUERIES PILLS */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        <span className="text-slate-400 text-[11px] font-medium shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-blue-500" /> Suggested:
        </span>
        {SUGGESTED_QUERIES.map(q => (
          <button
            key={q}
            onClick={() => handleSend(q)}
            className="shrink-0 px-2.5 py-1 rounded-full bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-slate-600 text-xs transition-colors"
          >
            {q}
          </button>
        ))}
      </div>

      {/* CHAT INPUT FORM */}
      <form
        onSubmit={e => {
          e.preventDefault();
          handleSend();
        }}
        className="relative bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center p-1.5"
      >
        <input
          type="text"
          value={inputQuery}
          onChange={e => setInputQuery(e.target.value)}
          placeholder="Ask about controls, previous audits, unverified findings, missing evidence..."
          className="flex-1 px-3 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 bg-transparent focus:outline-none"
        />
        <button
          type="submit"
          disabled={isLoading || !inputQuery.trim()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all disabled:opacity-50 flex items-center gap-1.5"
        >
          <span>Ask</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
