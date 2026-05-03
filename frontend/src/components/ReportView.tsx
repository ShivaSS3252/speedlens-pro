'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useMutation } from '@apollo/client';
import { GENERATE_FIX } from '@/lib/graphql/operations';
import type { Fix, Issue, Suggestion, HistoryEntry, Report } from '@/lib/graphql/generated';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';

interface Props {
  report: Report;
  history?: HistoryEntry[];
  onReaudit?: () => void;
  reauditLoading?: boolean;
  onExportPdf?: () => void;
}

// ─── Score Ring (glowing SVG) ─────────────────────────────────────────────────

const R = 42;
const CIRCUMFERENCE = 2 * Math.PI * R;

function ringColor(score: number) {
  if (score >= 90) return '#4ade80';
  if (score >= 50) return '#fbbf24';
  return '#f87171';
}

function ringTrackColor(score: number) {
  if (score >= 90) return '#052e16';
  if (score >= 50) return '#422006';
  return '#3b0000';
}

function ringLabel(score: number) {
  if (score >= 90) return 'Good';
  if (score >= 50) return 'Needs Work';
  return 'Poor';
}

function ScoreRing({ score, label }: { score: number; label: string }) {
  const [offset, setOffset] = useState(CIRCUMFERENCE);

  useEffect(() => {
    const t = setTimeout(() => setOffset(CIRCUMFERENCE * (1 - score / 100)), 100);
    return () => clearTimeout(t);
  }, [score]);

  const color = ringColor(score);
  const track = ringTrackColor(score);
  const filterId = `glow-${label}`;

  return (
    <div className="flex flex-1 flex-col items-center gap-3">
      <svg width="120" height="120" viewBox="0 0 120 120" style={{ filter: `drop-shadow(0 0 10px ${color}55)` }}>
        <defs>
          <filter id={filterId} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Track */}
        <circle cx="60" cy="60" r={R} fill="none" stroke={track} strokeWidth="9" />
        {/* Arc */}
        <circle
          cx="60" cy="60" r={R} fill="none"
          stroke={color} strokeWidth="9"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
          filter={`url(#${filterId})`}
          style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
        {/* Score number */}
        <text
          x="60" y="58" textAnchor="middle" dominantBaseline="central"
          fill={color} fontSize="24" fontWeight="900" fontFamily="system-ui,sans-serif"
        >
          {score}
        </text>
        {/* /100 */}
        <text
          x="60" y="74" textAnchor="middle" dominantBaseline="central"
          fill={color} fontSize="9" fontWeight="600" fontFamily="system-ui,sans-serif" opacity="0.6"
        >
          /100
        </text>
      </svg>
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{label}</p>
        <p className="mt-0.5 text-xs font-semibold" style={{ color }}>{ringLabel(score)}</p>
      </div>
    </div>
  );
}

// ─── Sparkline History Chart ──────────────────────────────────────────────────

function SparklineChart({ history, currentId }: { history: HistoryEntry[]; currentId: string }) {
  if (history.length < 2) return null;

  const W = 360, H = 80, PAD = 12;
  const n = history.length;
  const xOf = (i: number) => PAD + (i / (n - 1)) * (W - 2 * PAD);
  const yOf = (s: number) => H - PAD - (s / 100) * (H - 2 * PAD);

  const mPts = history.map((e, i) => `${xOf(i)},${yOf(e.mobileScore)}`).join(' ');
  const dPts = history.map((e, i) => `${xOf(i)},${yOf(e.desktopScore)}`).join(' ');

  return (
    <div className="mt-4">
      <div className="mb-2 flex gap-4">
        <span className="flex items-center gap-1.5 text-xs text-blue-400">
          <span className="inline-block h-0.5 w-4 rounded-full bg-blue-400" /> Mobile
        </span>
        <span className="flex items-center gap-1.5 text-xs text-orange-400">
          <span className="inline-block h-0.5 w-4 rounded-full bg-orange-400" /> Desktop
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 80 }}>
        <polyline points={mPts} fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinejoin="round" />
        <polyline points={dPts} fill="none" stroke="#fb923c" strokeWidth="2" strokeLinejoin="round" />
        {history.map((e, i) => (
          <React.Fragment key={e.id}>
            <circle cx={xOf(i)} cy={yOf(e.mobileScore)} r={e.id === currentId ? 5 : 3}
              fill={e.id === currentId ? '#3b82f6' : '#60a5fa'}>
              <title>Mobile {e.mobileScore} — {new Date(e.createdAt).toLocaleString()}</title>
            </circle>
            <circle cx={xOf(i)} cy={yOf(e.desktopScore)} r={e.id === currentId ? 5 : 3}
              fill={e.id === currentId ? '#ea580c' : '#fb923c'}>
              <title>Desktop {e.desktopScore} — {new Date(e.createdAt).toLocaleString()}</title>
            </circle>
          </React.Fragment>
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-xs text-slate-600">
        <span>{new Date(history[0].createdAt).toLocaleDateString()}</span>
        {history.length > 2 && <span>{history.length} audits</span>}
        <span>{new Date(history[history.length - 1].createdAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
}

// ─── Fix Block ────────────────────────────────────────────────────────────────

function FixBlock({ fix }: { fix: Fix }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(fix.code ?? '').then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-zinc-700/60 bg-[#040608]">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2">
        <span className="font-mono text-xs font-semibold text-orange-400">{fix.language ?? ''}</span>
        <button
          onClick={handleCopy}
          className="no-print rounded-md border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs font-medium text-slate-400
                     transition hover:border-orange-500/50 hover:bg-zinc-700 hover:text-orange-300"
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto px-4 py-4 text-xs leading-relaxed text-emerald-300">
        <code>{fix.code ?? ''}</code>
      </pre>
      {fix.explanation && (
        <p className="border-t border-zinc-800 px-4 py-2.5 text-xs italic text-slate-500">
          {fix.explanation}
        </p>
      )}
    </div>
  );
}

// ─── Issue Item ───────────────────────────────────────────────────────────────

function IssueItem({ item, techStack }: { item: Issue; techStack: string }) {
  const [fix, setFix] = useState<Fix | null>(null);
  const [failed, setFailed] = useState(false);

  const [doGenerateFix, { loading: fixLoading }] = useMutation(GENERATE_FIX, {
    onCompleted(data) {
      if (data?.generateFix?.code) {
        setFix(data.generateFix);
        setFailed(false);
      } else {
        setFailed(true);
      }
    },
    onError() { setFailed(true); },
  });

  function handleFixIt(e: React.MouseEvent) {
    e.stopPropagation();
    setFailed(false);
    doGenerateFix({
      variables: {
        title: item.title,
        description: item.description ?? '',
        displayValue: item.displayValue ?? null,
        techStack,
      },
    });
  }

  return (
    <AccordionItem
      value={item.id}
      className="rounded-xl border border-zinc-800 border-l-[3px] border-l-red-500/70 bg-zinc-900/60 shadow-sm"
    >
      <AccordionTrigger className="pr-5 text-slate-200 hover:text-white">
        {item.title}
      </AccordionTrigger>
      <AccordionContent className="border-zinc-800/60">
        {item.description && (
          <p className="text-xs leading-relaxed text-slate-300">{item.description}</p>
        )}
        {fix ? (
          <FixBlock fix={fix} />
        ) : (
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={handleFixIt}
              disabled={fixLoading}
              className="no-print inline-flex items-center gap-1.5 rounded-lg border border-orange-500/30 bg-orange-500/10
                         px-3 py-1.5 text-xs font-semibold text-orange-400
                         transition hover:bg-orange-500/20 hover:text-orange-300 disabled:opacity-60"
            >
              {fixLoading ? (
                <>
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-orange-400/30 border-t-orange-400" />
                  Generating…
                </>
              ) : (
                <>{failed ? '↺ Retry Fix' : '⚡ Fix It'}</>
              )}
            </button>
            {failed && <span className="text-xs text-red-400">Could not generate. Try again.</span>}
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}

// ─── Suggestion Item ──────────────────────────────────────────────────────────

function SuggestionItem({ item }: { item: Suggestion }) {
  return (
    <AccordionItem
      value={item.id}
      className="rounded-xl border border-zinc-800 border-l-[3px] border-l-amber-500/70 bg-zinc-900/60 shadow-sm"
    >
      <AccordionTrigger className="pr-5 text-slate-200 hover:text-white">
        {item.title}
      </AccordionTrigger>
      <AccordionContent className="border-zinc-800/60">
        {item.description && (
          <p className="text-xs leading-relaxed text-slate-300">{item.description}</p>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ReportView({
  report,
  history = [],
  onReaudit,
  reauditLoading,
  onExportPdf,
}: Props) {
  const [linkCopied, setLinkCopied] = useState(false);

  function handleCopyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  }

  return (
    <div className="w-full max-w-2xl space-y-5">

      {/* ── Score Card ────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-6 backdrop-blur-sm">

        {/* Score rings */}
        <div className="flex gap-6">
          <ScoreRing label="Mobile" score={report.mobileScore} />
          <div className="w-px bg-zinc-800" />
          <ScoreRing label="Desktop" score={report.desktopScore} />
        </div>

        {/* Divider */}
        <div className="my-5 h-px bg-zinc-800" />

        {/* URL */}
        <p className="break-all text-center font-mono text-xs font-semibold text-slate-200">{report.url}</p>

        {/* Tech stack badge */}
        {report.techStack && (
          <div className="mt-3 flex justify-center">
            <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1 text-xs font-semibold text-orange-400">
              {report.techStack}
            </span>
          </div>
        )}

        {/* Action buttons */}
        <div className="no-print mt-5 flex flex-wrap justify-center gap-2">
          {onReaudit && (
            <button
              onClick={onReaudit}
              disabled={reauditLoading}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/80 px-4 py-2
                         text-xs font-semibold text-slate-300 transition hover:border-zinc-600 hover:bg-zinc-700 hover:text-white
                         disabled:cursor-not-allowed disabled:opacity-50"
            >
              {reauditLoading ? (
                <>
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-zinc-500 border-t-orange-400" />
                  Re-auditing…
                </>
              ) : '↺ Run Again'}
            </button>
          )}
          {onExportPdf && (
            <button
              onClick={onExportPdf}
              disabled={reauditLoading}
              className="rounded-lg border border-zinc-700 bg-zinc-800/80 px-4 py-2 text-xs font-semibold
                         text-slate-300 transition hover:border-zinc-600 hover:bg-zinc-700 hover:text-white disabled:opacity-50"
            >
              ↓ Export PDF
            </button>
          )}
          <button
            onClick={handleCopyLink}
            disabled={reauditLoading}
            className="rounded-lg border border-zinc-700 bg-zinc-800/80 px-4 py-2 text-xs font-semibold
                       text-slate-300 transition hover:border-zinc-600 hover:bg-zinc-700 hover:text-white disabled:opacity-50"
          >
            {linkCopied ? '✓ Copied!' : '⎘ Share Link'}
          </button>
        </div>

        {/* Score history */}
        {history.length >= 2 && (
          <div className="mt-5 border-t border-zinc-800 pt-5">
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-slate-400">Score History</p>
            <SparklineChart history={history} currentId={report.id} />
          </div>
        )}

        {/* Re-audit progress */}
        {reauditLoading && (
          <div className="mt-4 rounded-xl border border-orange-500/20 bg-orange-500/8 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-orange-400/30 border-t-orange-400" />
              <div>
                <p className="text-xs font-semibold text-orange-300">Running new audit…</p>
                <p className="text-xs text-slate-600">Lighthouse + AI fixes. Up to 45 seconds.</p>
              </div>
            </div>
            <div className="mt-2 h-0.5 w-full overflow-hidden rounded-full bg-zinc-800">
              <div className="h-full w-1/3 animate-[progress_1.5s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-orange-500 to-amber-400" />
            </div>
          </div>
        )}
      </div>

      {/* ── Analyze another URL ───────────────────────────────────────────── */}
      <div className="no-print">
        {reauditLoading ? (
          <span className="cursor-not-allowed text-sm text-slate-500">← Analyze another URL</span>
        ) : (
          <Link href="/" className="text-sm font-medium text-slate-300 transition hover:text-orange-400">
            ← Analyze another URL
          </Link>
        )}
      </div>

      {/* ── Issues & Suggestions ──────────────────────────────────────────── */}
      {!reauditLoading && (
        <>
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
              <span className="inline-block h-2 w-2 rounded-full bg-red-500/80" />
              Issues
              <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-red-400 border border-red-500/20">
                {report.issues.length}
              </span>
            </h2>
            {report.issues.length === 0 ? (
              <p className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-5 py-4 text-sm text-slate-600">
                No issues detected.
              </p>
            ) : (
              <Accordion type="multiple" className="space-y-2">
                {report.issues.map((item) => (
                  <IssueItem key={item.id} item={item} techStack={report.techStack ?? 'HTML/CSS/JS'} />
                ))}
              </Accordion>
            )}
          </section>

          <section>
            <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
              <span className="inline-block h-2 w-2 rounded-full bg-amber-500/80" />
              Suggestions
              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-amber-400 border border-amber-500/20">
                {report.suggestions.length}
              </span>
            </h2>
            {report.suggestions.length === 0 ? (
              <p className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-5 py-4 text-sm text-slate-600">
                No suggestions.
              </p>
            ) : (
              <Accordion type="multiple" className="space-y-2">
                {report.suggestions.map((item) => (
                  <SuggestionItem key={item.id} item={item} />
                ))}
              </Accordion>
            )}
          </section>
        </>
      )}
    </div>
  );
}
