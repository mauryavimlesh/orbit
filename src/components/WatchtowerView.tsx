import React, { useState } from 'react';
import { DiscoveryItem, WatchlistItem } from '../types/orbit';
import { EditorialArtwork } from './EditorialArtwork';
import {
  Radar,
  RefreshCw,
  Plus,
  Pause,
  Play,
  Trash2,
  Send,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  BookOpen,
} from 'lucide-react';

interface WatchtowerViewProps {
  watchlists: WatchlistItem[];
  discoveries: DiscoveryItem[];
  telegramConfigured: boolean;
  onAddWatch: (
    watch: Omit<WatchlistItem, 'id' | 'lastCheckedAt' | 'lastStatus' | 'updates'>
  ) => void;
  onToggleWatch: (id: string) => void;
  onDeleteWatch: (id: string) => void;
  onCheckWatchNow: (id: string) => Promise<void>;
  onOpenDiscovery: (
    item: DiscoveryItem,
    tab?: 'reader' | 'professor' | 'visual' | 'notes' | 'quiz'
  ) => void;
}

export const WatchtowerView: React.FC<WatchtowerViewProps> = ({
  watchlists,
  discoveries,
  telegramConfigured,
  onAddWatch,
  onToggleWatch,
  onDeleteWatch,
  onCheckWatchNow,
  onOpenDiscovery,
}) => {
  const [targetType, setTargetType] =
    useState<WatchlistItem['targetType']>('Topic / Field');
  const [targetQuery, setTargetQuery] = useState('');
  const [displayTitle, setDisplayTitle] = useState('');
  const [importanceThreshold, setImportanceThreshold] = useState<
    WatchlistItem['importanceThreshold']
  >('Meaningful Changes Only');
  const [cadence, setCadence] = useState<WatchlistItem['cadence']>('Daily Briefing');
  const [checkingId, setCheckingId] = useState<string | null>(null);

  // Optional Telegram briefing test
  const [telegramChatId, setTelegramChatId] = useState('');
  const [telegramStatusMsg, setTelegramStatusMsg] = useState<string | null>(null);

  const handleCreateWatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetQuery.trim()) return;
    onAddWatch({
      targetType,
      targetQuery: targetQuery.trim(),
      displayTitle: displayTitle.trim() || targetQuery.trim(),
      sourcesMonitored:
        targetType === 'GitHub Repository'
          ? ['GitHub REST API (/repos & /releases)']
          : ['arXiv API', 'OpenAlex Scholarly Graph', 'PubMed Entrez'],
      importanceThreshold,
      cadence,
      active: true,
    });
    setTargetQuery('');
    setDisplayTitle('');
  };

  const handleRunLiveCheck = async (id: string) => {
    setCheckingId(id);
    try {
      await onCheckWatchNow(id);
    } finally {
      setCheckingId(null);
    }
  };

  const handleSendTelegramBriefing = async () => {
    setTelegramStatusMsg('Sending briefing via server...');
    try {
      const res = await fetch('/api/notify/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: telegramChatId.trim(),
          summaryText: `ORBIT Watchtower Briefing: ${watchlists.length} active research watches monitored.`,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTelegramStatusMsg(data.error || 'Telegram dispatch not configured.');
      } else {
        setTelegramStatusMsg('Briefing dispatched via server-side Telegram Bot API!');
      }
    } catch {
      setTelegramStatusMsg('Could not reach server notification endpoint.');
    }
  };

  const findRelatedDiscovery = (watch: WatchlistItem): DiscoveryItem | undefined => {
    const q = (watch.targetQuery + ' ' + watch.displayTitle).toLowerCase();
    return discoveries.find(
      (d) =>
        d.canonicalId.toLowerCase() === watch.targetQuery.toLowerCase() ||
        (q.includes('quantum') && d.id === 'disc-quantum-surface-code') ||
        (q.includes('gods-eye-view') && d.id === 'disc-gods-eye-view') ||
        (q.includes('bohr') && d.id === 'disc-bohr-hemoglobin') ||
        (q.includes('flash') && d.id === 'disc-sparse-flash-attention')
    );
  };

  return (
    <div className="space-y-6">
      {/* Unified Warm Glassmorphic Hero Header for Research Watchtower */}
      <div className="relative rounded-[28px] overflow-hidden border border-white/12 p-6 sm:p-8 shadow-2xl">
        <EditorialArtwork
          theme="clean_energy_grid"
          variant="hero"
          className="absolute inset-0 w-full h-full opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#09080E]/95 via-[#09080E]/80 to-[#09080E]/55" />

        <div className="relative z-10 space-y-5">
          <div className="space-y-1.5 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full orbit-glass-pill text-xs font-mono text-emerald-300">
              <Radar className="w-3.5 h-3.5" />
              <span>Research Watchtower · Longitudinal State Diff &amp; Alert Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Track Meaningful Scientific &amp; Technical Changes Over Time
            </h1>
            <p className="text-xs sm:text-sm text-white/75 leading-relaxed">
              Clicking <strong>Check Live Upstream Now</strong> queries OpenAlex, arXiv, or GitHub REST in real time, compares the latest state against your baseline snapshot, and explains whether new evidence strengthens or modifies prior understanding.
            </p>
          </div>

          {/* Add New Watch Form */}
          <form
            onSubmit={handleCreateWatch}
            className="pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3"
          >
            <select
              value={targetType}
              onChange={(e) => setTargetType(e.target.value as any)}
              className="px-3.5 py-2.5 rounded-2xl bg-black/50 border border-white/15 text-xs text-white focus:outline-none"
            >
              <option value="Topic / Field">Topic / Field</option>
              <option value="Research Paper">Research Paper / DOI</option>
              <option value="GitHub Repository">GitHub Repository (owner/repo)</option>
              <option value="Researcher / Lab">Researcher / Lab</option>
            </select>

            <input
              type="text"
              value={targetQuery}
              onChange={(e) => setTargetQuery(e.target.value)}
              placeholder="Query or owner/repo (e.g., CRISPR prime editing)..."
              className="px-3.5 py-2.5 rounded-2xl bg-black/50 border border-white/15 text-xs text-white placeholder:text-white/45 focus:outline-none"
            />

            <input
              type="text"
              value={displayTitle}
              onChange={(e) => setDisplayTitle(e.target.value)}
              placeholder="Display Title (optional)..."
              className="px-3.5 py-2.5 rounded-2xl bg-black/50 border border-white/15 text-xs text-white placeholder:text-white/45 focus:outline-none"
            />

            <select
              value={importanceThreshold}
              onChange={(e) => setImportanceThreshold(e.target.value as any)}
              className="px-3.5 py-2.5 rounded-2xl bg-black/50 border border-white/15 text-xs text-white focus:outline-none"
            >
              <option value="Meaningful Changes Only">Meaningful Changes Only</option>
              <option value="Major Breakthroughs Only">Major Breakthroughs Only</option>
              <option value="All Updates">All Updates</option>
            </select>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-2xl bg-white text-[#0B0A0E] text-xs font-bold hover:bg-white/90 transition-colors inline-flex items-center justify-center gap-1.5 shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Watch</span>
            </button>
          </form>
        </div>
      </div>

      {/* Active Watches List & 7-Point Delta Breakdown */}
      <div className="space-y-5">
        {watchlists.map((watch) => {
          const relatedDiscovery = findRelatedDiscovery(watch);
          return (
            <div
              key={watch.id}
              className="orbit-glass-panel rounded-[26px] p-6 space-y-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-white/10">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-white/60">
                    <span className={watch.active ? 'text-emerald-300' : 'text-white/40'}>
                      {watch.active ? '● Active Watch' : '○ Paused'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{watch.targetType}</span>
                    <span aria-hidden="true">·</span>
                    <span>Threshold: {watch.importanceThreshold}</span>
                    <span aria-hidden="true">·</span>
                    <span>Last Checked: {new Date(watch.lastCheckedAt).toLocaleString()}</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mt-1">
                    {watch.displayTitle}
                  </h3>
                  <p className="text-xs text-white/55 font-mono mt-0.5">
                    Query: <code>{watch.targetQuery}</code> · Sources:{' '}
                    {watch.sourcesMonitored.join(', ')}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {relatedDiscovery && (
                    <button
                      onClick={() => onOpenDiscovery(relatedDiscovery, 'reader')}
                      className="px-3.5 py-2 rounded-full orbit-glass-pill text-xs font-medium text-white hover:bg-white/20 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Reopen Lesson &amp; Notes</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleRunLiveCheck(watch.id)}
                    disabled={checkingId === watch.id}
                    className="px-4 py-2 rounded-full bg-white text-[#0B0A0E] text-xs font-bold hover:bg-white/90 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shadow-sm"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${checkingId === watch.id ? 'animate-spin' : ''}`}
                    />
                    <span>
                      {checkingId === watch.id
                        ? 'Checking Upstream...'
                        : 'Check Live Upstream Now'}
                    </span>
                  </button>
                  <button
                    onClick={() => onToggleWatch(watch.id)}
                    className="p-2 rounded-full orbit-glass-pill text-white/80 hover:text-white"
                    title={watch.active ? 'Pause watch' : 'Resume watch'}
                  >
                    {watch.active ? (
                      <Pause className="w-3.5 h-3.5" />
                    ) : (
                      <Play className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() => onDeleteWatch(watch.id)}
                    className="p-2 rounded-full orbit-glass-pill text-rose-300 hover:bg-rose-500/20"
                    title="Remove watch"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 7-Point Structured State Comparison Updates */}
              <div className="space-y-4">
                {watch.updates.map((upd) => (
                  <div
                    key={upd.id}
                    className="p-5 rounded-2xl bg-black/35 border border-white/10 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                      <span className="text-emerald-300">
                        1. What Is New: {upd.whatIsNew}
                      </span>
                      <span className="text-white/55">
                        3. Source &amp; Date: {upd.sourceAndDate}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                        <span className="font-mono text-white/50 block">
                          2. What Changed vs. Last Known State
                        </span>
                        <p className="text-white/85 leading-relaxed">
                          {upd.whatChangedFromBaseline}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                        <span className="font-mono text-white/50 block">
                          4. Why It Matters &amp; 5. Impact on Prior Understanding
                        </span>
                        <p className="text-white/85 leading-relaxed">
                          <strong className="text-emerald-300">
                            [{upd.impactOnPriorUnderstanding}]
                          </strong>{' '}
                          {upd.whyItMatters}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
                      <div>
                        <span className="font-mono text-amber-300">
                          6. What Remains Uncertain:{' '}
                        </span>
                        <span className="text-white/75">{upd.remainingUncertainty}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <span className="font-mono text-sky-300">
                            7. Recommended Next Step:{' '}
                          </span>
                          <span className="text-white/80">{upd.recommendedNextAction}</span>
                        </div>
                        <a
                          href={upd.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-emerald-300 hover:underline font-mono shrink-0"
                        >
                          <span>Source</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Optional Server-Side Telegram Bot Integration Card */}
      <div className="orbit-glass-panel rounded-[26px] p-6 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-mono">
            {telegramConfigured ? (
              <span className="text-emerald-300 inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Server-Side Telegram Bot Token Configured</span>
              </span>
            ) : (
              <span className="text-amber-300 inline-flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                <span>
                  Optional Telegram Bot Channel (Not Yet Configured in Server Secrets)
                </span>
              </span>
            )}
          </div>
        </div>
        <p className="text-xs text-white/65 leading-relaxed">
          Telegram is an optional delivery channel for daily research briefings. For security, bot tokens are read exclusively on the server via <code>process.env.TELEGRAM_BOT_TOKEN</code> in AI Studio <strong>Settings &gt; Secrets</strong> and are never exposed in client-side code.
        </p>
        <div className="flex flex-col sm:flex-row gap-2.5 max-w-xl">
          <input
            type="text"
            value={telegramChatId}
            onChange={(e) => setTelegramChatId(e.target.value)}
            placeholder="Telegram Chat ID (optional override if TELEGRAM_DEFAULT_CHAT_ID is set)..."
            className="flex-1 px-3.5 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white font-mono"
          />
          <button
            onClick={handleSendTelegramBriefing}
            className="px-4 py-2 rounded-xl orbit-glass-pill text-xs font-medium text-white hover:bg-white/20 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Test Briefing Dispatch</span>
          </button>
        </div>
        {telegramStatusMsg && (
          <p className="text-xs font-mono text-amber-200">{telegramStatusMsg}</p>
        )}
      </div>
    </div>
  );
};
