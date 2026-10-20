import React, { useEffect, useState } from 'react';
import { DiscoveryItem, WatchlistItem } from '../types/orbit';
import { EditorialArtwork } from './EditorialArtwork';
import {
  Globe,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  BellPlus,
  BookOpen,
} from 'lucide-react';

interface TrendPulseItem {
  id: string;
  title: string;
  platform: string;
  category: string;
  url: string;
  publishedAt: string;
  popularityMetric: string;
  growthRateSignal: string;
  sourceCredibility:
    | 'Peer-Reviewed / Primary'
    | 'Developer / Technical'
    | 'Social Discussion (Verify Claims)';
  noveltySignal: string;
  technicalSignificance: string;
  learningValue: string;
  evidenceCheckNote: string;
}

interface WorldTrendsViewProps {
  discoveries: DiscoveryItem[];
  onOpenDiscovery: (
    item: DiscoveryItem,
    tab?: 'reader' | 'professor' | 'visual' | 'notes' | 'quiz'
  ) => void;
  onAddWatch: (
    watch: Omit<WatchlistItem, 'id' | 'lastCheckedAt' | 'lastStatus' | 'updates'>
  ) => void;
}

export const WorldTrendsView: React.FC<WorldTrendsViewProps> = ({
  discoveries,
  onOpenDiscovery,
  onAddWatch,
}) => {
  const [items, setItems] = useState<TrendPulseItem[]>([]);
  const [checkedAt, setCheckedAt] = useState<string>('');
  const [sourcesChecked, setSourcesChecked] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [watchedId, setWatchedId] = useState<string | null>(null);

  const fetchTrends = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/trends/pulse');
      const data = await res.json();
      if (res.ok && Array.isArray(data.items)) {
        setItems(data.items);
        setCheckedAt(data.retrievedAt);
        setSourcesChecked(data.sourcesChecked || []);
      }
    } catch {
      // keep previous state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrends();
  }, []);

  const filtered =
    categoryFilter === 'All'
      ? items
      : items.filter((item) =>
          item.category.toLowerCase().includes(categoryFilter.toLowerCase())
        );

  return (
    <div className="space-y-6">
      {/* Unified Warm Glassmorphic Hero Header for World Trends */}
      <div className="relative rounded-[28px] overflow-hidden border border-white/12 p-6 sm:p-8 shadow-2xl">
        <EditorialArtwork
          theme="sparse_attention"
          variant="hero"
          className="absolute inset-0 w-full h-full opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#09080E]/95 via-[#09080E]/80 to-[#09080E]/55" />

        <div className="relative z-10 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full orbit-glass-pill text-xs font-mono text-emerald-300">
                <Globe className="w-3.5 h-3.5" />
                <span>
                  Global Trend Intelligence · Rising in Sources Checked
                  {checkedAt ? ` · Updated ${new Date(checkedAt).toLocaleTimeString()}` : ''}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Multi-Signal Trend Analysis (Viral Velocity Separated from Evidence Quality)
              </h1>
              <p className="text-xs sm:text-sm text-white/75 leading-relaxed">
                Separates popularity, growth rate, source credibility, novelty, technical significance, and learning value so viral discussion is never mistaken for peer-reviewed proof.
              </p>
            </div>

            <button
              onClick={fetchTrends}
              disabled={loading}
              className="px-5 py-2.5 rounded-full bg-white text-[#0B0A0E] text-xs font-bold hover:bg-white/90 transition-colors inline-flex items-center gap-2 whitespace-nowrap shadow-md"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Refreshing Public Feeds...' : 'Refresh Live Signals'}</span>
            </button>
          </div>

          {/* Honest Platform Coverage Banner */}
          <div className="rounded-2xl bg-black/45 border border-white/12 p-4 flex items-start gap-3 text-xs text-white/80">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1 leading-relaxed">
              <div>
                <strong className="text-white">
                  Transparent Source Coverage &amp; Known Blind Spots:
                </strong>{' '}
                ORBIT checks permitted open APIs (
                <span className="font-mono text-emerald-300">
                  {sourcesChecked.length > 0
                    ? sourcesChecked.join(', ')
                    : 'Hacker News Firebase API, GitHub Public REST, OpenAlex & arXiv'}
                </span>
                ).
              </div>
              <div className="text-white/55">
                Closed commercial firehoses (X/Twitter paid API, Instagram Graph, YouTube Data quota-restricted feeds) are not scraped without authorized keys. Signals below represent activity <em>rising in the public sources checked</em>, not universal global consensus.
              </div>
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10">
            {['All', 'AI & Systems', 'Science & Bio', 'Open-Source Tools'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-4 py-2 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                  categoryFilter === cat
                    ? 'bg-white text-[#0B0A0E] font-bold shadow-sm'
                    : 'orbit-glass-pill text-white/75 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Multi-Signal Trend Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.map((item) => {
          const matchingDiscovery = discoveries.find(
            (d) =>
              (item.title.toLowerCase().includes('quantum') &&
                d.id === 'disc-quantum-surface-code') ||
              (item.title.toLowerCase().includes('gaussian') &&
                d.id === 'disc-gods-eye-view')
          );

          return (
            <div
              key={item.id}
              className="orbit-glass-panel rounded-[26px] p-6 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                  <span className="text-white/60">
                    {item.platform} · {item.category} · {item.publishedAt}
                  </span>
                  <span
                    className={
                      item.sourceCredibility === 'Peer-Reviewed / Primary'
                        ? 'text-emerald-300'
                        : item.sourceCredibility === 'Developer / Technical'
                        ? 'text-sky-300'
                        : 'text-amber-300'
                    }
                  >
                    {item.sourceCredibility === 'Peer-Reviewed / Primary'
                      ? '● Primary Evidence'
                      : item.sourceCredibility === 'Developer / Technical'
                      ? '◆ Technical Repo / Thread'
                      : '▲ Social Signal (Unverified)'}
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                  {item.title}
                </h3>

                {/* 6-Dimensional Separated Signal Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                    <span className="text-[10px] text-white/45 block">1. Popularity</span>
                    <span className="font-mono text-white/90">{item.popularityMetric}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                    <span className="text-[10px] text-white/45 block">2. Growth Velocity</span>
                    <span className="font-mono text-amber-300">{item.growthRateSignal}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                    <span className="text-[10px] text-white/45 block">3. Source Credibility</span>
                    <span className="text-white/90">{item.sourceCredibility}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                    <span className="text-[10px] text-white/45 block">4. Novelty</span>
                    <span className="text-white/85">{item.noveltySignal}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                    <span className="text-[10px] text-white/45 block">5. Tech Significance</span>
                    <span className="text-white/85">{item.technicalSignificance}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                    <span className="text-[10px] text-white/45 block">6. Learning Value</span>
                    <span className="text-emerald-300">{item.learningValue}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-1.5 text-white/65">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="line-clamp-1">{item.evidenceCheckNote}</span>
                </div>

                <div className="flex items-center gap-2">
                  {matchingDiscovery && (
                    <button
                      onClick={() => onOpenDiscovery(matchingDiscovery, 'reader')}
                      className="px-3 py-1.5 rounded-full bg-white text-[#0B0A0E] text-xs font-semibold hover:bg-white/90 inline-flex items-center gap-1"
                    >
                      <BookOpen className="w-3 h-3" />
                      <span>Open Deep Reader</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      onAddWatch({
                        targetType: 'Topic / Field',
                        targetQuery: item.title,
                        displayTitle: item.title,
                        sourcesMonitored: [item.platform, 'OpenAlex Works'],
                        importanceThreshold: 'Meaningful Changes Only',
                        cadence: 'Daily Briefing',
                        active: true,
                      });
                      setWatchedId(item.id);
                      setTimeout(() => setWatchedId(null), 2500);
                    }}
                    className="px-3 py-1.5 rounded-full orbit-glass-pill text-white hover:bg-white/20 inline-flex items-center gap-1"
                  >
                    <BellPlus className="w-3 h-3 text-emerald-300" />
                    <span>{watchedId === item.id ? 'Watching!' : 'Watch Trend'}</span>
                  </button>

                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-emerald-300 hover:underline font-mono shrink-0"
                  >
                    <span>Source</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
