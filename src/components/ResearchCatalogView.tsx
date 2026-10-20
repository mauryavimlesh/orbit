import React, { useState, useMemo } from 'react';
import { DiscoveryItem, WatchlistItem } from '../types/orbit';
import { EditorialArtwork } from './EditorialArtwork';
import {
  Search,
  RefreshCw,
  BookOpen,
  GraduationCap,
  Sliders,
  FileText,
  Bookmark,
  Check,
  BellPlus,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';

interface ResearchCatalogViewProps {
  discoveries: DiscoveryItem[];
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  onRunLiveSearch: (e?: React.FormEvent) => Promise<void>;
  isSearchingLive: boolean;
  bookmarkedIds: string[];
  onToggleBookmark: (id: string) => void;
  onOpenWorkspace: (
    item: DiscoveryItem,
    tab?: 'reader' | 'professor' | 'visual' | 'notes' | 'quiz'
  ) => void;
  onAddWatch: (
    watch: Omit<WatchlistItem, 'id' | 'lastCheckedAt' | 'lastStatus' | 'updates'>
  ) => void;
}

export const ResearchCatalogView: React.FC<ResearchCatalogViewProps> = ({
  discoveries,
  searchQuery,
  onSearchQueryChange,
  onRunLiveSearch,
  isSearchingLive,
  bookmarkedIds,
  onToggleBookmark,
  onOpenWorkspace,
  onAddWatch,
}) => {
  const [domainFilter, setDomainFilter] = useState<string>('All');
  const [evidenceFilter, setEvidenceFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'relevance' | 'newest' | 'evidence'>('relevance');
  const [expandedId, setExpandedId] = useState<string | null>(discoveries[0]?.id || null);
  const [watchedToastId, setWatchedToastId] = useState<string | null>(null);

  const quickTopics = [
    'Fault-Tolerant Quantum Surface Codes',
    'CRISPR Prime Editing',
    'FlashAttention-3 Tiling',
    'MOF-303 Atmospheric Water Harvesting',
    '3D Gaussian Splatting',
  ];

  const filteredAndSorted = useMemo(() => {
    const filtered = discoveries.filter((d) => {
      if (domainFilter !== 'All' && d.domain !== domainFilter) return false;
      if (evidenceFilter !== 'All' && d.evidenceStatus !== evidenceFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          d.title.toLowerCase().includes(q) ||
          d.oneSentenceWhyItMatters.toLowerCase().includes(q) ||
          d.domain.toLowerCase().includes(q) ||
          d.sourceName.toLowerCase().includes(q)
        );
      }
      return true;
    });

    if (sortBy === 'newest') {
      return [...filtered].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    }
    if (sortBy === 'evidence') {
      return [...filtered].sort((a, b) =>
        a.evidenceStatus === 'Peer-Reviewed' && b.evidenceStatus !== 'Peer-Reviewed' ? -1 : 1
      );
    }
    return filtered;
  }, [discoveries, domainFilter, evidenceFilter, searchQuery, sortBy]);

  return (
    <div className="space-y-6">
      {/* Warm Glassmorphic Hero Header for Research & Literature */}
      <div className="relative rounded-[28px] overflow-hidden border border-white/12 p-6 sm:p-8 shadow-2xl">
        <EditorialArtwork
          theme="biotech_bohr"
          variant="hero"
          className="absolute inset-0 w-full h-full opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#09080E]/95 via-[#09080E]/80 to-[#09080E]/60" />

        <div className="relative z-10 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full orbit-glass-pill text-xs font-mono text-emerald-300">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Primary Literature & Evidence Engine · OpenAlex · arXiv · PubMed · Crossref</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Science, Research Papers & Empirical Verification
              </h1>
              <p className="text-xs sm:text-sm text-white/75 leading-relaxed">
                Every discovery separates primary source metadata from AI interpretation, attaches claim-level provenance, and opens directly into the 14-Layer Research Reader, Adaptive Professor, and Visual Lab.
              </p>
            </div>
          </div>

          {/* Live Multi-Source Query Bar */}
          <form onSubmit={onRunLiveSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-white/50 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                placeholder="Query live arXiv, OpenAlex, PubMed & Crossref by topic, DOI, or research question..."
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-black/50 border border-white/15 text-xs sm:text-sm text-white placeholder:text-white/45 focus:outline-none focus:border-white/40"
              />
            </div>
            <button
              type="submit"
              disabled={isSearchingLive}
              className="px-6 py-3 rounded-2xl bg-white text-[#0B0A0E] text-xs sm:text-sm font-bold hover:bg-white/90 transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 shadow-lg"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSearchingLive ? 'animate-spin' : ''}`} />
              <span>{isSearchingLive ? 'Querying Live Databases...' : 'Search Live Literature'}</span>
            </button>
          </form>

          {/* Quick-Try Scientific Query Chips */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-white/50 font-mono text-[11px]">Quick Query:</span>
            {quickTopics.map((topic) => (
              <button
                key={topic}
                type="button"
                onClick={() => {
                  onSearchQueryChange(topic);
                }}
                className="px-3 py-1 rounded-full orbit-glass-pill text-white/80 hover:text-white hover:bg-white/20 transition-colors text-[11px]"
              >
                {topic}
              </button>
            ))}
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchQueryChange('')}
                className="px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-200 text-[11px]"
              >
                Reset Query
              </button>
            )}
          </div>

          {/* Domain, Evidence & Sort Filter Bar */}
          <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                'All',
                'Quantum & Physics',
                'AI & Computing',
                'Biomedicine & Genomics',
                'Open-Source & DevTools',
                'Clean Tech & Public Service',
              ].map((dom) => (
                <button
                  key={dom}
                  onClick={() => setDomainFilter(dom)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                    domainFilter === dom
                      ? 'bg-white text-[#0B0A0E] font-bold shadow-sm'
                      : 'orbit-glass-pill text-white/70 hover:text-white'
                  }`}
                >
                  {dom}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <select
                value={evidenceFilter}
                onChange={(e) => setEvidenceFilter(e.target.value)}
                className="px-3.5 py-1.5 rounded-full orbit-glass-pill text-white bg-black/50 focus:outline-none"
              >
                <option value="All">All Evidence Tiers</option>
                <option value="Peer-Reviewed">● Peer-Reviewed Only</option>
                <option value="Preprint / Not Yet Peer-Reviewed">▲ Preprints Only</option>
                <option value="Working Open-Source Code">◆ Working Code / Repo</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3.5 py-1.5 rounded-full orbit-glass-pill text-white bg-black/50 focus:outline-none"
              >
                <option value="relevance">Sort: Multi-Signal Relevance</option>
                <option value="evidence">Sort: Highest Evidence First</option>
                <option value="newest">Sort: Newest Publication Date</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Research Cards Grid */}
      {filteredAndSorted.length === 0 ? (
        <div className="orbit-glass-panel rounded-[28px] p-10 text-center space-y-3">
          <p className="text-base font-bold text-white">
            No Local Matches for &ldquo;{searchQuery}&rdquo;
          </p>
          <p className="text-xs text-white/65 max-w-md mx-auto">
            Click <strong>Search Live Literature</strong> above to query OpenAlex and arXiv in real time, or reset your domain/evidence filters.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => onRunLiveSearch()}
              className="px-5 py-2.5 rounded-full bg-white text-[#0B0A0E] text-xs font-bold"
            >
              Query Live APIs Now
            </button>
            <button
              onClick={() => {
                setDomainFilter('All');
                setEvidenceFilter('All');
                onSearchQueryChange('');
              }}
              className="px-5 py-2.5 rounded-full orbit-glass-pill text-xs text-white"
            >
              Reset Filters
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {filteredAndSorted.map((item) => {
            const isExpanded = expandedId === item.id;
            const isBookmarked = bookmarkedIds.includes(item.id);
            return (
              <article
                key={item.id}
                className="orbit-glass-panel rounded-[28px] overflow-hidden border border-white/12 transition-all"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12">
                  {/* Left Visual Artwork Column (4 cols on desktop) */}
                  <div
                    onClick={() => onOpenWorkspace(item, 'reader')}
                    className="lg:col-span-4 relative min-h-[210px] cursor-pointer group overflow-hidden"
                  >
                    <EditorialArtwork
                      theme={item.artworkTheme}
                      variant="card"
                      className="absolute inset-0 w-full h-full transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#09080E] via-[#09080E]/35 to-transparent" />

                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2">
                      <span className="px-3 py-1 rounded-full orbit-glass-pill text-[11px] font-mono text-emerald-300">
                        {item.evidenceStatus === 'Peer-Reviewed'
                          ? '● Peer-Reviewed'
                          : item.sourceType === 'GitHub Repository'
                          ? '◆ Open-Source Code'
                          : '▲ Preprint'}
                      </span>
                      {item.isLiveFetched && (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[10px] font-mono text-emerald-200">
                          Live Fetched
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-4 left-4 right-4">
                      <span className="text-xs text-white/75 font-mono block">
                        {item.domain} · Published {item.publishedAt}
                      </span>
                      <span className="text-[11px] text-white/55 font-mono block mt-0.5">
                        Source: {item.sourceName}
                      </span>
                    </div>
                  </div>

                  {/* Right Content & Multi-Signal Breakdown (8 cols on desktop) */}
                  <div className="lg:col-span-8 p-6 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <h3
                          onClick={() => onOpenWorkspace(item, 'reader')}
                          className="text-lg sm:text-xl font-bold text-white hover:text-emerald-200 cursor-pointer leading-snug"
                        >
                          {item.title}
                        </h3>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => {
                              onAddWatch({
                                targetType:
                                  item.sourceType === 'GitHub Repository'
                                    ? 'GitHub Repository'
                                    : 'Research Paper',
                                targetQuery: item.canonicalId,
                                displayTitle: item.title,
                                sourcesMonitored: [item.sourceName, 'OpenAlex Citations'],
                                importanceThreshold: 'Meaningful Changes Only',
                                cadence: 'Daily Briefing',
                                active: true,
                              });
                              setWatchedToastId(item.id);
                              setTimeout(() => setWatchedToastId(null), 2500);
                            }}
                            className="px-3 py-1.5 rounded-full orbit-glass-pill text-xs text-white/85 hover:text-white inline-flex items-center gap-1.5"
                          >
                            <BellPlus className="w-3.5 h-3.5 text-emerald-300" />
                            <span>
                              {watchedToastId === item.id ? 'Watching!' : 'Watch'}
                            </span>
                          </button>

                          <button
                            onClick={() => onToggleBookmark(item.id)}
                            className={`p-2 rounded-full transition-colors ${
                              isBookmarked
                                ? 'bg-white text-[#0B0A0E]'
                                : 'orbit-glass-pill text-white hover:bg-white/20'
                            }`}
                            title="Bookmark in My Learning"
                          >
                            {isBookmarked ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : (
                              <Bookmark className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
                        {item.oneSentenceWhyItMatters}
                      </p>

                      {/* Explainable Multi-Signal Strip */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs">
                        <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10">
                          <span className="text-[10px] text-white/45 block">Evidence Tier</span>
                          <span className="font-medium text-emerald-300">
                            {item.signals.evidenceTier}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10">
                          <span className="text-[10px] text-white/45 block">Momentum</span>
                          <span className="text-white/90">{item.signals.momentum}</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10">
                          <span className="text-[10px] text-white/45 block">Novelty</span>
                          <span className="text-white/90">{item.signals.novelty}</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10">
                          <span className="text-[10px] text-white/45 block">Learning Value</span>
                          <span className="text-amber-200">{item.signals.learningValue}</span>
                        </div>
                      </div>

                      {/* Expandable Technical Methodology & Limitations Preview */}
                      {isExpanded && (
                        <div className="mt-3 p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3 text-xs">
                          <div>
                            <span className="font-mono text-emerald-300 block">
                              Quick Orientation & Methodology
                            </span>
                            <p className="text-white/85 mt-1 leading-relaxed">
                              {item.readerLayers.quickOrientation}
                            </p>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-white/10">
                            <div>
                              <span className="font-mono text-amber-300 block">
                                Limitations & Open Questions
                              </span>
                              <p className="text-white/75 mt-1 leading-relaxed">
                                {item.readerLayers.limitationsAndUncertainty}
                              </p>
                            </div>
                            <div>
                              <span className="font-mono text-sky-300 block">
                                Prerequisites Needed
                              </span>
                              <ul className="text-white/75 mt-1 space-y-1">
                                {item.readerLayers.prerequisites.map((p, idx) => (
                                  <li key={idx}>· {p}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Connected Cross-Page Action Bar */}
                    <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => onOpenWorkspace(item, 'reader')}
                          className="px-4 py-2 rounded-full bg-white text-[#0B0A0E] text-xs font-bold hover:bg-white/90 transition-colors inline-flex items-center gap-1.5 shadow-sm"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>14-Layer Reader</span>
                        </button>
                        <button
                          onClick={() => onOpenWorkspace(item, 'professor')}
                          className="px-3.5 py-2 rounded-full orbit-glass-pill text-xs font-medium text-white hover:bg-white/20 transition-colors inline-flex items-center gap-1.5"
                        >
                          <GraduationCap className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Adaptive Professor</span>
                        </button>
                        <button
                          onClick={() => onOpenWorkspace(item, 'visual')}
                          className="px-3.5 py-2 rounded-full orbit-glass-pill text-xs font-medium text-white hover:bg-white/20 transition-colors inline-flex items-center gap-1.5"
                        >
                          <Sliders className="w-3.5 h-3.5 text-sky-300" />
                          <span>Visual Lab</span>
                        </button>
                        <button
                          onClick={() => onOpenWorkspace(item, 'notes')}
                          className="px-3.5 py-2 rounded-full orbit-glass-pill text-xs font-medium text-white hover:bg-white/20 transition-colors inline-flex items-center gap-1.5"
                        >
                          <FileText className="w-3.5 h-3.5 text-amber-300" />
                          <span>Draft Notes</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : item.id)}
                          className="text-xs text-white/65 hover:text-white inline-flex items-center gap-1 font-mono"
                        >
                          <span>{isExpanded ? 'Hide Preview' : 'Methodology Preview'}</span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <a
                          href={item.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-mono text-emerald-300 hover:underline inline-flex items-center gap-1"
                        >
                          <span>Primary Source</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
