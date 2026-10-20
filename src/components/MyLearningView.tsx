import React, { useState, useEffect, useMemo } from 'react';
import {
  DiscoveryItem,
  GitHubRepoAnalysis,
  KnowledgeEdge,
  MasteryRecord,
  StructuredNote,
  WatchlistItem,
} from '../types/orbit';
import { EditorialArtwork } from './EditorialArtwork';
import { LearningPathGraph } from './LearningPathGraph';
import { INITIAL_KNOWLEDGE_EDGES } from '../data/seedDiscoveries';
import { WatchtowerView } from './WatchtowerView';
import { GitHubExplorerView } from './GitHubExplorerView';
import { WorldTrendsView } from './WorldTrendsView';
import {
  BookMarked,
  Download,
  Upload,
  Network,
  BookOpen,
  GraduationCap,
  FileText,
  ExternalLink,
  Radar,
  GitBranch,
  Globe,
  Check,
  Search,
} from 'lucide-react';

interface MyLearningViewProps {
  savedNotes: StructuredNote[];
  masteryRecords: MasteryRecord[];
  knowledgeEdges: KnowledgeEdge[];
  bookmarkedIds: string[];
  discoveries: DiscoveryItem[];
  watchlists: WatchlistItem[];
  telegramConfigured: boolean;
  initialSubTab?: 'saved_papers' | 'learning_path' | 'watched_topics' | 'open_source' | 'trends';
  onToggleBookmark: (id: string) => void;
  onExportLibraryJson: () => void;
  onImportLibraryJson: (file: File) => void;
  onOpenDiscovery: (
    item: DiscoveryItem,
    tab?: 'reader' | 'professor' | 'visual' | 'notes' | 'quiz'
  ) => void;
  onAddWatch: (
    watch: Omit<WatchlistItem, 'id' | 'lastCheckedAt' | 'lastStatus' | 'updates'>
  ) => void;
  onToggleWatch: (id: string) => void;
  onDeleteWatch: (id: string) => void;
  onCheckWatchNow: (id: string) => Promise<void>;
  onSaveRepoAsDiscovery: (repo: GitHubRepoAnalysis) => DiscoveryItem;
}

export const MyLearningView: React.FC<MyLearningViewProps> = ({
  savedNotes,
  masteryRecords,
  knowledgeEdges,
  bookmarkedIds,
  discoveries,
  watchlists,
  telegramConfigured,
  initialSubTab = 'saved_papers',
  onToggleBookmark,
  onExportLibraryJson,
  onImportLibraryJson,
  onOpenDiscovery,
  onAddWatch,
  onToggleWatch,
  onDeleteWatch,
  onCheckWatchNow,
  onSaveRepoAsDiscovery,
}) => {
  const [subTab, setSubTab] = useState<
    'saved_papers' | 'learning_path' | 'watched_topics' | 'open_source' | 'trends'
  >(initialSubTab);
  const [libraryFilter, setLibraryFilter] = useState('');

  useEffect(() => {
    setSubTab(initialSubTab);
  }, [initialSubTab]);

  const bookmarkedDiscoveries = useMemo(() => {
    const seen = new Set<string>();
    return discoveries.filter((d) => {
      if (!bookmarkedIds.includes(d.id) || seen.has(d.id)) return false;
      seen.add(d.id);
      if (libraryFilter.trim()) {
        const q = libraryFilter.toLowerCase();
        return (
          d.title.toLowerCase().includes(q) ||
          d.domain.toLowerCase().includes(q) ||
          d.sourceName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [discoveries, bookmarkedIds, libraryFilter]);

  const approvedNotesCount = savedNotes.filter((n) => n.status === 'approved_saved').length;

  return (
    <div className="space-y-6">
      {/* Clean, Calm Library Header */}
      <div className="orbit-glass-panel rounded-[28px] p-6 sm:p-8 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              My Research Library
            </h1>
            <p className="text-xs sm:text-sm text-white/70">
              Your saved papers, reading progress, concept connections, and followed research topics.
            </p>
          </div>

          {/* Simple Backup / Restore Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onExportLibraryJson}
              className="px-4 py-2 rounded-full orbit-glass-pill text-xs font-medium text-white hover:bg-white/20 transition-colors inline-flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Backup (.json)</span>
            </button>

            <label className="px-4 py-2 rounded-full orbit-glass-pill text-xs font-medium text-white hover:bg-white/20 transition-colors inline-flex items-center gap-1.5 cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Restore (.json)</span>
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onImportLibraryJson(file);
                }}
              />
            </label>
          </div>
        </div>

        {/* Clean Progressive Disclosure Navigation inside My Library */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-white/10">
          {[
            {
              id: 'saved_papers',
              label: `Saved Papers & Progress (${bookmarkedIds.length})`,
              icon: BookMarked,
            },
            {
              id: 'learning_path',
              label: 'Learning Path',
              icon: Network,
            },
            {
              id: 'watched_topics',
              label: `Followed Topics (${watchlists.length})`,
              icon: Radar,
            },
            {
              id: 'open_source',
              label: 'Open-Source Code Inspector',
              icon: GitBranch,
            },
            {
              id: 'trends',
              label: 'Emerging Signals',
              icon: Globe,
            },
          ].map((t) => {
            const Icon = t.icon;
            const active = subTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setSubTab(t.id as any)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                  active
                    ? 'bg-white text-[#0B0A0E] font-bold shadow-sm'
                    : 'orbit-glass-pill text-white/75 hover:text-white hover:bg-white/15'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: SAVED PAPERS & READING PROGRESS (Default, Scan-Friendly) */}
      {subTab === 'saved_papers' && (
        <div className="space-y-6">
          {/* Saved Papers List */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 px-1">
              <div>
                <h2 className="text-lg font-bold text-white">
                  Saved Papers ({bookmarkedDiscoveries.length})
                </h2>
                <span className="text-xs text-white/55">
                  {approvedNotesCount} saved study {approvedNotesCount === 1 ? 'note' : 'notes'}
                </span>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-white/45 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={libraryFilter}
                  onChange={(e) => setLibraryFilter(e.target.value)}
                  placeholder="Filter saved papers..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-full orbit-glass-pill text-xs text-white placeholder:text-white/45 focus:outline-none"
                />
              </div>
            </div>

            {bookmarkedDiscoveries.length === 0 ? (
              <div className="orbit-glass-panel rounded-[26px] p-8 text-center space-y-2">
                <p className="text-sm font-semibold text-white">
                  No papers saved to your library yet
                </p>
                <p className="text-xs text-white/65 max-w-md mx-auto">
                  Click <strong>Save</strong> on any research paper in Discover or inside the Paper Reader to keep it here for quick reading and note-taking.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookmarkedDiscoveries.map((paper) => {
                  const masteryRec = masteryRecords.find((m) => m.discoveryId === paper.id);
                  const readPct = masteryRec?.progressPercent || 15;
                  return (
                    <article
                      key={paper.id}
                      className="orbit-glass-panel rounded-[24px] p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 border border-white/10 hover:border-white/20 transition-all"
                    >
                      <div className="flex items-start gap-4 min-w-0 flex-1">
                        <div
                          onClick={() => onOpenDiscovery(paper, 'reader')}
                          className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 border border-white/15 cursor-pointer hidden sm:block"
                        >
                          <EditorialArtwork
                            theme={paper.artworkTheme}
                            variant="thumb"
                            className="w-full h-full"
                          />
                        </div>

                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="text-emerald-300 font-medium">
                              ● {paper.evidenceStatus}
                            </span>
                            <span className="text-white/40">·</span>
                            <span className="text-white/75">{paper.sourceName}</span>
                            <span className="text-white/40">·</span>
                            <span className="text-white/60">{paper.publishedAt}</span>
                            <span className="text-white/40">·</span>
                            <span className="text-emerald-300 font-mono text-[11px]">
                              Reading Progress: {readPct}%
                            </span>
                          </div>

                          <h3
                            onClick={() => onOpenDiscovery(paper, 'reader')}
                            className="text-base sm:text-lg font-bold text-white hover:text-emerald-200 cursor-pointer leading-snug"
                          >
                            {paper.title}
                          </h3>

                          <div className="text-xs text-white/60">
                            {paper.authors?.join(', ')}
                          </div>

                          <p className="text-xs sm:text-sm text-white/75 line-clamp-2 leading-relaxed pt-0.5">
                            {paper.oneSentenceWhyItMatters}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0 w-full md:w-auto justify-end pt-3 md:pt-0 border-t md:border-t-0 border-white/10">
                        <button
                          onClick={() => onOpenDiscovery(paper, 'reader')}
                          className="px-4 py-2 rounded-full bg-white text-[#0B0A0E] text-xs font-bold hover:bg-white/90 transition-colors inline-flex items-center gap-1.5"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Read Paper</span>
                        </button>
                        <button
                          onClick={() => onOpenDiscovery(paper, 'professor')}
                          className="px-3.5 py-2 rounded-full orbit-glass-pill text-xs font-medium text-white hover:bg-white/20 transition-colors inline-flex items-center gap-1.5"
                        >
                          <GraduationCap className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Explain</span>
                        </button>
                        <button
                          onClick={() => onOpenDiscovery(paper, 'notes')}
                          className="px-3.5 py-2 rounded-full orbit-glass-pill text-xs font-medium text-white hover:bg-white/20 transition-colors inline-flex items-center gap-1.5"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Notes</span>
                        </button>
                        <button
                          onClick={() => onToggleBookmark(paper.id)}
                          title="Remove from Saved Library"
                          className="px-3 py-2 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-500/35 text-xs font-medium inline-flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Saved</span>
                        </button>
                        <a
                          href={paper.fullTextUrl || paper.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-full orbit-glass-pill text-white/75 hover:text-white"
                          title="Open original DOI/source"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          {/* Reading & Concept Progress List */}
          <div className="orbit-glass-panel rounded-[26px] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Reading &amp; Study History</h3>
                <p className="text-xs text-white/60">
                  Papers you have recently opened, with scroll-depth reading progress.
                </p>
              </div>
              <button
                onClick={() => setSubTab('learning_path')}
                className="px-3.5 py-1.5 rounded-full orbit-glass-pill text-xs text-emerald-300 hover:text-white transition-colors"
              >
                Open Full Learning Path View →
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {masteryRecords.map((rec) => {
                const disc = discoveries.find((d) => d.id === rec.discoveryId);
                return (
                  <div
                    key={rec.discoveryId}
                    onClick={() => disc && onOpenDiscovery(disc, 'reader')}
                    className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/25 cursor-pointer flex items-center justify-between gap-4 transition-all"
                  >
                    <div className="min-w-0 space-y-1 flex-1">
                      <span className="text-[11px] font-mono text-emerald-300 block">
                        {rec.domain}
                      </span>
                      <h4 className="text-sm font-bold text-white truncate">{rec.topicTitle}</h4>
                      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-400 rounded-full transition-all duration-300"
                          style={{ width: `${rec.progressPercent}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-mono font-bold text-white">
                        {rec.progressPercent}%
                      </div>
                      <span className="text-[10px] text-white/50">Read</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive D3.js Learning Path Visualization within My Learning */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div>
                <h2 className="text-lg font-bold text-white">
                  Learning Path — Mastered Topics &amp; Knowledge Connections
                </h2>
                <p className="text-xs text-white/60">
                  Interactive D3.js node-graph mapping your mastered research topics, active lessons, and prerequisite connections.
                </p>
              </div>
            </div>
            <LearningPathGraph
              masteryRecords={masteryRecords}
              knowledgeEdges={knowledgeEdges.length > 0 ? knowledgeEdges : INITIAL_KNOWLEDGE_EDGES}
              discoveries={discoveries}
              onOpenDiscovery={(item, tab) => onOpenDiscovery(item, tab)}
            />
          </div>
        </div>
      )}

      {/* TAB 2: D3 LEARNING PATH GRAPH (Progressive Disclosure) */}
      {subTab === 'learning_path' && (
        <LearningPathGraph
          masteryRecords={masteryRecords}
          knowledgeEdges={knowledgeEdges.length > 0 ? knowledgeEdges : INITIAL_KNOWLEDGE_EDGES}
          discoveries={discoveries}
          onOpenDiscovery={(item, tab) => onOpenDiscovery(item, tab)}
        />
      )}

      {/* TAB 3: FOLLOWED TOPICS / WATCHTOWER */}
      {subTab === 'watched_topics' && (
        <WatchtowerView
          watchlists={watchlists}
          discoveries={discoveries}
          onAddWatch={onAddWatch}
          onToggleWatch={onToggleWatch}
          onDeleteWatch={onDeleteWatch}
          onCheckWatchNow={onCheckWatchNow}
          onOpenDiscovery={(item, tab) => onOpenDiscovery(item, tab)}
          telegramConfigured={telegramConfigured}
        />
      )}

      {/* TAB 4: OPEN-SOURCE CODE INSPECTOR */}
      {subTab === 'open_source' && (
        <GitHubExplorerView
          discoveries={discoveries}
          onOpenWorkspace={(item, tab) => onOpenDiscovery(item, tab || 'reader')}
          onSaveRepoAsDiscovery={onSaveRepoAsDiscovery}
          onAddWatch={onAddWatch}
        />
      )}

      {/* TAB 5: EMERGING SIGNALS */}
      {subTab === 'trends' && (
        <WorldTrendsView
          discoveries={discoveries}
          onOpenDiscovery={(item, tab) => onOpenDiscovery(item, tab)}
          onAddWatch={onAddWatch}
        />
      )}
    </div>
  );
};
