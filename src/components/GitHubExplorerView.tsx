import React, { useState, useEffect, useRef } from 'react';
import {
  DiscoveryItem,
  GitHubRepoAnalysis,
  WatchlistItem,
} from '../types/orbit';
import {
  GitHubCatalogRepoItem,
  SEED_GITHUB_REPOS,
} from '../data/seedDiscoveries';
import { EditorialArtwork } from './EditorialArtwork';
import {
  GitBranch,
  Star,
  GitFork,
  ExternalLink,
  Search,
  BookOpen,
  FileText,
  GraduationCap,
  Bookmark,
  Check,
  RefreshCw,
  AlertCircle,
  Terminal,
  ShieldAlert,
  X,
  Code2,
  Scale,
  Clock,
  BellPlus,
  Sparkles,
  ArrowLeft,
  ChevronRight,
  SlidersHorizontal,
  Layers,
  HelpCircle,
} from 'lucide-react';

interface GitHubExplorerViewProps {
  discoveries: DiscoveryItem[];
  bookmarkedIds?: string[];
  onToggleBookmark?: (id: string) => void;
  onOpenWorkspace: (
    item: DiscoveryItem,
    tab?: 'reader' | 'professor' | 'visual' | 'notes' | 'quiz'
  ) => void;
  onSaveRepoAsDiscovery: (repo: GitHubRepoAnalysis) => DiscoveryItem;
  onAskProfessorAboutRepo?: (repo: GitHubRepoAnalysis, prompt: string) => void;
  onAddWatch: (
    watch: Omit<WatchlistItem, 'id' | 'lastCheckedAt' | 'lastStatus' | 'updates'>
  ) => void;
  onBackToDiscover?: () => void;
  initialInspectRepo?: string | null;
}

const GITHUB_TOPIC_PRESETS = [
  { id: 'all', label: 'All Featured & Verified', query: '' },
  { id: 'transformers', label: 'AI & Transformers', query: 'transformers attention llm' },
  { id: 'gaussian-splatting', label: '3D Vision & Splatting', query: '3d gaussian splatting nerf' },
  { id: 'quantum-computing', label: 'Quantum & Physics', query: 'quantum error correction qubit' },
  { id: 'bioinformatics', label: 'Biomed & Genomics', query: 'bioinformatics genomics protein' },
  { id: 'climate-modeling', label: 'Climate & Earth', query: 'weather forecasting climate model' },
  { id: 'theorem-proving', label: 'Math & Theorem Proving', query: 'theorem proving formal math' },
  { id: 'reverse-engineering', label: 'Systems & Security', query: 'reverse engineering binary analysis' },
];

const LANGUAGE_FILTERS = [
  'All',
  'Python',
  'C++',
  'CUDA',
  'Rust',
  'TypeScript',
  'Go',
  'Jupyter Notebook',
];

export const GitHubExplorerView: React.FC<GitHubExplorerViewProps> = ({
  discoveries,
  bookmarkedIds = [],
  onToggleBookmark,
  onOpenWorkspace,
  onSaveRepoAsDiscovery,
  onAskProfessorAboutRepo,
  onAddWatch,
  onBackToDiscover,
  initialInspectRepo,
}) => {
  // Explorer filters & query state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState('all');
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [sortBy, setSortBy] = useState<'stars' | 'updated'>('stars');
  const [page, setPage] = useState(1);
  const perPage = 12;

  // Repositories list state
  const [repos, setRepos] = useState<GitHubCatalogRepoItem[]>(SEED_GITHUB_REPOS);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState<number>(SEED_GITHUB_REPOS.length);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [lastFetchedLabel, setLastFetchedLabel] = useState<string | null>(null);
  const [showFiltersPopover, setShowFiltersPopover] = useState(false);
  const loadMoreSentinelRef = useRef<HTMLDivElement>(null);

  // Repository Detail Modal / Inspection state
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailRepoName, setDetailRepoName] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [inspectedAnalysis, setInspectedAnalysis] = useState<GitHubRepoAnalysis | null>(null);
  const [detailActiveTab, setDetailActiveTab] = useState<'overview' | 'readme' | 'setup'>('overview');
  const [watchAddedToast, setWatchAddedToast] = useState(false);

  // Idea Comparator state
  const [showIdeaComparator, setShowIdeaComparator] = useState(false);
  const [ideaQuery, setIdeaQuery] = useState('');
  const [ideaLoading, setIdeaLoading] = useState(false);
  const [ideaResults, setIdeaResults] = useState<{
    query: string;
    checkedAt: string;
    repos: Array<{
      fullName: string;
      description: string;
      stars: number;
      license: string;
      url: string;
      updatedAt: string;
    }>;
    papers: Array<{
      title: string;
      venue: string;
      year: string;
      url: string;
      citations: number;
    }>;
    synthesisNote: string;
  } | null>(null);

  // Fetch repositories from live API with pagination
  const fetchRepositories = async (opts: {
    q?: string;
    topicId?: string;
    language?: string;
    sort?: 'stars' | 'updated';
    pageNumber?: number;
    append?: boolean;
  }) => {
    const q = opts.q !== undefined ? opts.q : searchQuery;
    const topicId = opts.topicId !== undefined ? opts.topicId : selectedTopicId;
    const language = opts.language !== undefined ? opts.language : selectedLanguage;
    const sort = opts.sort !== undefined ? opts.sort : sortBy;
    const pageNum = opts.pageNumber !== undefined ? opts.pageNumber : 1;
    const isAppend = opts.append === true;

    const presetObj = GITHUB_TOPIC_PRESETS.find((t) => t.id === topicId);
    const effectiveQuery =
      q.trim() ||
      presetObj?.query ||
      (pageNum > 1 ? 'machine-learning OR deep-learning OR scientific-computing' : '');

    // If default "all" with no query and language "All" on page 1, show verified seeds first
    if (!effectiveQuery && language === 'All' && topicId === 'all' && pageNum === 1) {
      const sortedSeeds = [...SEED_GITHUB_REPOS].sort((a, b) =>
        sort === 'updated'
          ? b.updatedAt.localeCompare(a.updatedAt)
          : b.stars - a.stars
      );
      setRepos(sortedSeeds);
      setTotalCount(sortedSeeds.length);
      setHasMore(true);
      setApiError(null);
      setIsRateLimited(false);
      setLastFetchedLabel(null);
      return;
    }

    if (isAppend) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }
    setApiError(null);

    try {
      const params = new URLSearchParams();
      if (effectiveQuery) params.set('q', effectiveQuery);
      if (language !== 'All') params.set('language', language);
      params.set('sort', sort);
      params.set('page', String(pageNum));
      params.set('per_page', String(perPage));

      const res = await fetch(`/api/github/discover?${params.toString()}`);
      const data = await res.json();

      if (data.rateLimited) {
        setIsRateLimited(true);
        // Fall back to matching seed catalog items so UI is never blank
        const qLower = effectiveQuery.toLowerCase();
        const filteredSeeds = SEED_GITHUB_REPOS.filter((r) => {
          const matchesLang = language === 'All' || r.language.toLowerCase() === language.toLowerCase();
          const matchesQ =
            !qLower ||
            r.fullName.toLowerCase().includes(qLower) ||
            r.description.toLowerCase().includes(qLower) ||
            r.topics.some((t) => t.toLowerCase().includes(qLower));
          return matchesLang && matchesQ;
        });
        if (!isAppend) {
          setRepos(filteredSeeds.length > 0 ? filteredSeeds : SEED_GITHUB_REPOS);
          setTotalCount(filteredSeeds.length);
        }
        setHasMore(false);
        setLastFetchedLabel(
          'GitHub API rate limit reached for unauthenticated requests (60 req/hr). Showing verified local research repositories.'
        );
        return;
      }

      if (!res.ok) {
        setApiError(data.error || 'Could not query GitHub search API.');
        return;
      }

      setIsRateLimited(false);
      const incomingItems: GitHubCatalogRepoItem[] = Array.isArray(data.items)
        ? data.items
        : [];

      if (isAppend) {
        setRepos((prev) => {
          const seen = new Set(prev.map((r) => r.fullName.toLowerCase()));
          const newUnique = incomingItems.filter((r) => !seen.has(r.fullName.toLowerCase()));
          return [...prev, ...newUnique];
        });
      } else {
        setRepos(incomingItems);
      }

      setTotalCount(data.totalCount || incomingItems.length);
      setHasMore(Boolean(data.hasMore));
      setLastFetchedLabel(
        `Retrieved ${data.totalCount?.toLocaleString() || incomingItems.length} repositories from GitHub REST API`
      );
    } catch {
      setApiError('Network connection to GitHub REST API timed out. Displaying verified local catalog.');
      if (!isAppend) {
        setRepos(SEED_GITHUB_REPOS);
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  // Open repository detail modal and fetch live README
  const handleOpenDetail = async (repoItem: GitHubCatalogRepoItem | string) => {
    const fullName =
      typeof repoItem === 'string'
        ? repoItem.trim().replace(/^https?:\/\/github\.com\//i, '').replace(/\/+$/, '')
        : repoItem.fullName;

    if (!fullName.includes('/')) {
      setApiError('Please enter a valid repository in owner/repo format (e.g., Dao-AILab/flash-attention).');
      return;
    }

    setDetailModalOpen(true);
    setDetailRepoName(fullName);
    setDetailActiveTab('overview');
    setDetailError(null);
    setDetailLoading(true);

    // Initial placeholder while fetching
    const localSeed = discoveries.find(
      (d) => d.repoAnalysis?.fullName.toLowerCase() === fullName.toLowerCase()
    )?.repoAnalysis;

    if (localSeed) {
      setInspectedAnalysis(localSeed);
    } else if (typeof repoItem !== 'string') {
      setInspectedAnalysis({
        fullName: repoItem.fullName,
        repoUrl: repoItem.htmlUrl,
        stars: repoItem.stars,
        forks: repoItem.forks,
        openIssues: repoItem.openIssues,
        license: repoItem.license,
        language: repoItem.language,
        lastReleaseTag: `Updated ${repoItem.updatedAt}`,
        lastUpdated: repoItem.updatedAt,
        topics: repoItem.topics,
        maturityStatus: repoItem.stars > 1000 ? 'Active Research Tool' : 'Experimental Prototype',
        whatItDoes: repoItem.description,
        problemSolved: `Open-source ${repoItem.language} implementation for ${repoItem.topics.join(', ') || 'scientific research'}.`,
        internalArchitecture: [
          `Primary Language: ${repoItem.language}`,
          `Stars: ${repoItem.stars.toLocaleString()} · Forks: ${repoItem.forks.toLocaleString()}`,
          'Fetching README and package details live from GitHub REST API...',
        ],
        noveltyComparison: 'Live metadata from GitHub.',
        hardwareAndPrerequisites: [
          `${repoItem.language} runtime in an isolated container or virtualenv`,
        ],
        safeSetupSteps: [
          '1. Create a clean isolated environment before cloning.',
          `2. git clone https://github.com/${repoItem.fullName}.git`,
          '3. Review requirements and dependencies before installation.',
        ],
        securityAndSandboxWarnings: [
          'Never execute unverified setup scripts with root privileges.',
        ],
        alternatives: [],
      });
    }

    try {
      const res = await fetch(`/api/github/inspect?repo=${encodeURIComponent(fullName)}`);
      const data = await res.json();
      if (!res.ok) {
        setDetailError(data.error || 'Could not fetch repository README from GitHub.');
      } else if (data.repoAnalysis) {
        setInspectedAnalysis(data.repoAnalysis);
      }
    } catch (err: any) {
      setDetailError(err.message || 'Failed to inspect repository metadata.');
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    if (initialInspectRepo && initialInspectRepo.includes('/')) {
      handleOpenDetail(initialInspectRepo);
    }
  }, [initialInspectRepo]);

  const handleSaveAndBookmark = (repoItem: GitHubCatalogRepoItem | GitHubRepoAnalysis) => {
    let analysis: GitHubRepoAnalysis;
    if ('problemSolved' in repoItem) {
      analysis = repoItem;
    } else {
      analysis = {
        fullName: repoItem.fullName,
        repoUrl: repoItem.htmlUrl,
        stars: repoItem.stars,
        forks: repoItem.forks,
        openIssues: repoItem.openIssues,
        license: repoItem.license,
        language: repoItem.language,
        lastReleaseTag: `Updated ${repoItem.updatedAt}`,
        lastUpdated: repoItem.updatedAt,
        topics: repoItem.topics,
        maturityStatus: repoItem.stars > 1000 ? 'Active Research Tool' : 'Experimental Prototype',
        whatItDoes: repoItem.description,
        problemSolved: `Open-source ${repoItem.language} implementation.`,
        internalArchitecture: [
          `Primary Language: ${repoItem.language}`,
          `Stars: ${repoItem.stars.toLocaleString()} · Forks: ${repoItem.forks.toLocaleString()}`,
        ],
        noveltyComparison: 'Inspected via GitHub REST API.',
        hardwareAndPrerequisites: [`${repoItem.language} runtime environment`],
        safeSetupSteps: [`git clone https://github.com/${repoItem.fullName}.git`],
        securityAndSandboxWarnings: ['Audit dependencies before executing.'],
        alternatives: [],
      };
    }
    const savedDiscovery = onSaveRepoAsDiscovery(analysis);
    if (onToggleBookmark && !bookmarkedIds.includes(savedDiscovery.id)) {
      onToggleBookmark(savedDiscovery.id);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed.includes('/') && !trimmed.includes(' ')) {
      handleOpenDetail(trimmed);
    } else {
      setPage(1);
      fetchRepositories({ q: trimmed, pageNumber: 1, append: false });
    }
  };

  const handleLoadMore = () => {
    if (isLoading || isLoadingMore || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchRepositories({ pageNumber: nextPage, append: true });
  };

  useEffect(() => {
    const el = loadMoreSentinelRef.current;
    if (!el || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isLoading && !isLoadingMore && hasMore) {
          handleLoadMore();
        }
      },
      { rootMargin: '260px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, isLoading, isLoadingMore, page, searchQuery, selectedTopicId, selectedLanguage, sortBy]);

  const activeFilterCount =
    (selectedTopicId !== 'all' ? 1 : 0) +
    (selectedLanguage !== 'All' ? 1 : 0) +
    (sortBy !== 'stars' ? 1 : 0);

  const resetRepoFilters = () => {
    setSearchQuery('');
    setSelectedTopicId('all');
    setSelectedLanguage('All');
    setSortBy('stars');
    setPage(1);
    fetchRepositories({ q: '', topicId: 'all', language: 'All', sort: 'stars', pageNumber: 1, append: false });
  };

  const handleCompareIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ideaQuery.trim()) return;
    setIdeaLoading(true);
    try {
      const res = await fetch('/api/github/compare-idea', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea: ideaQuery }),
      });
      const data = await res.json();
      if (res.ok) {
        setIdeaResults(data);
      }
    } catch {
      // handled gracefully
    } finally {
      setIdeaLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* COMPACT HERO HEADER */}
      <div className="relative rounded-[24px] overflow-hidden border border-white/12 p-4 sm:p-6 shadow-xl">
        <EditorialArtwork
          theme="geospatial_splatting"
          variant="hero"
          className="absolute inset-0 w-full h-full opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#09080E]/95 via-[#09080E]/85 to-[#09080E]/65" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-sky-500/15 border border-sky-500/30 text-[11px] font-mono text-sky-300">
              <GitBranch className="w-3 h-3" />
              <span>GitHub Repositories Explorer · Real Code &amp; Research Artifacts</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Open-Source Research Repositories &amp; Implementations
            </h1>
            <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
              Inspect live READMEs, language breakdowns, and code implementations linked to scientific papers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <span className="px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 text-white/80 font-mono text-xs">
              ● {totalCount.toLocaleString()} Repos
            </span>
            {onBackToDiscover && (
              <button
                type="button"
                onClick={onBackToDiscover}
                className="px-3.5 py-1.5 rounded-full orbit-glass-pill hover:bg-white/20 text-xs font-semibold text-white inline-flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Research Papers</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* COMPACT EXPLORER SEARCH & FILTER BAR */}
      <div className="orbit-glass-panel rounded-[24px] p-4 sm:p-5 space-y-3 border border-white/12 relative">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
          <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-white/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search repositories by topic or enter owner/repo (e.g., 'Dao-AILab/flash-attention', 'gaussian splatting')..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-black/45 border border-white/15 text-xs sm:text-sm text-white placeholder:text-white/45 focus:outline-none focus:border-white/40"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 sm:px-5 py-2.5 rounded-2xl bg-white text-[#0B0A0E] text-xs font-bold hover:bg-white/90 transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Searching...' : 'Search'}</span>
            </button>
          </form>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowFiltersPopover((prev) => !prev)}
              className={`px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all inline-flex items-center gap-2 border ${
                showFiltersPopover || activeFilterCount > 0
                  ? 'bg-white text-[#0B0A0E] border-white shadow-sm'
                  : 'orbit-glass-pill text-white border-white/15 hover:bg-white/15'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters &amp; Sort</span>
              {activeFilterCount > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    showFiltersPopover || activeFilterCount > 0
                      ? 'bg-[#0B0A0E] text-sky-300'
                      : 'bg-sky-500/20 text-sky-200'
                  }`}
                >
                  {activeFilterCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowIdeaComparator((prev) => !prev)}
              className={`px-3.5 py-2.5 rounded-2xl text-xs font-medium transition-colors inline-flex items-center gap-1.5 ${
                showIdeaComparator
                  ? 'bg-purple-500/25 border border-purple-400 text-purple-200'
                  : 'orbit-glass-pill text-white/80 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-300" />
              <span className="hidden sm:inline">Idea Prior Art</span>
            </button>
          </div>
        </div>

        {/* Active Filter Removable Chips (shown only when useful) */}
        {(activeFilterCount > 0 || Boolean(searchQuery.trim()) || isRateLimited) && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-mono text-white/45 mr-1">Active:</span>
            {searchQuery.trim() && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] text-white">
                <span>Query: &ldquo;{searchQuery.trim()}&rdquo;</span>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setPage(1);
                    fetchRepositories({ q: '', pageNumber: 1, append: false });
                  }}
                  className="hover:text-rose-300"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedTopicId !== 'all' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-500/15 border border-sky-500/30 text-[11px] text-sky-200">
                <span>
                  Topic: {GITHUB_TOPIC_PRESETS.find((t) => t.id === selectedTopicId)?.label}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTopicId('all');
                    setPage(1);
                    fetchRepositories({ topicId: 'all', pageNumber: 1, append: false });
                  }}
                  className="hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedLanguage !== 'All' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[11px] text-emerald-200">
                <span>Language: {selectedLanguage}</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedLanguage('All');
                    setPage(1);
                    fetchRepositories({ language: 'All', pageNumber: 1, append: false });
                  }}
                  className="hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {sortBy !== 'stars' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] text-white/85">
                <span>Sort: Recently Updated</span>
                <button
                  type="button"
                  onClick={() => {
                    setSortBy('stars');
                    setPage(1);
                    fetchRepositories({ sort: 'stars', pageNumber: 1, append: false });
                  }}
                  className="hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {(activeFilterCount > 0 || Boolean(searchQuery.trim())) && (
              <button
                type="button"
                onClick={resetRepoFilters}
                className="px-2.5 py-1 rounded-full text-[11px] font-mono text-rose-300 hover:bg-rose-500/15 transition-colors"
              >
                Clear all
              </button>
            )}
          </div>
        )}

        {/* COMPACT FILTERS & SORT POPOVER / MOBILE BOTTOM SHEET */}
        {showFiltersPopover && (
          <div className="fixed inset-x-0 bottom-0 z-50 sm:static sm:inset-auto sm:z-30 bg-[#12101B] sm:bg-black/75 border-t sm:border border-white/15 rounded-t-3xl sm:rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xl backdrop-blur-xl max-h-[82vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-sky-300" />
                <span className="text-xs sm:text-sm font-bold text-white">
                  Repository Filters &amp; Sort
                </span>
              </div>
              <div className="flex items-center gap-2">
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={resetRepoFilters}
                    className="px-2.5 py-1 rounded-full text-[11px] text-rose-300 hover:bg-rose-500/15"
                  >
                    Reset all
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowFiltersPopover(false)}
                  className="px-3 py-1 rounded-full bg-sky-400 text-[#0B0A0E] text-xs font-bold hover:bg-sky-300"
                >
                  Apply &amp; Done
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Group 1: Topic Preset */}
              <div className="space-y-2">
                <label className="text-[11px] font-mono uppercase tracking-wider text-white/55 block">
                  Research Code Topic
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {GITHUB_TOPIC_PRESETS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setSelectedTopicId(t.id);
                        setSearchQuery('');
                        setPage(1);
                        fetchRepositories({ topicId: t.id, q: '', pageNumber: 1, append: false });
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                        selectedTopicId === t.id
                          ? 'bg-white text-[#0B0A0E] font-bold'
                          : 'bg-white/[0.05] text-white/75 hover:text-white border border-white/10'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Group 2: Programming Language */}
              <div className="space-y-2">
                <label className="text-[11px] font-mono uppercase tracking-wider text-white/55 block">
                  Programming Language
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {LANGUAGE_FILTERS.map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => {
                        setSelectedLanguage(lang);
                        setPage(1);
                        fetchRepositories({ language: lang, pageNumber: 1, append: false });
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                        selectedLanguage === lang
                          ? 'bg-sky-400 text-[#0B0A0E] font-bold'
                          : 'bg-white/[0.05] text-white/75 hover:text-white border border-white/10'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              {/* Group 3: Sort Order */}
              <div className="space-y-2">
                <label className="text-[11px] font-mono uppercase tracking-wider text-white/55 block">
                  Sort Repositories By
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSortBy('stars');
                      setPage(1);
                      fetchRepositories({ sort: 'stars', pageNumber: 1, append: false });
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      sortBy === 'stars'
                        ? 'bg-white text-[#0B0A0E] font-bold'
                        : 'bg-white/[0.05] text-white/75 hover:text-white border border-white/10'
                    }`}
                  >
                    Most Stars
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSortBy('updated');
                      setPage(1);
                      fetchRepositories({ sort: 'updated', pageNumber: 1, append: false });
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      sortBy === 'updated'
                        ? 'bg-white text-[#0B0A0E] font-bold'
                        : 'bg-white/[0.05] text-white/75 hover:text-white border border-white/10'
                    }`}
                  >
                    Recently Updated
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* IDEA COMPARATOR DRAWER (Collapsible) */}
      {showIdeaComparator && (
        <div className="orbit-glass-panel rounded-[28px] p-6 space-y-4 border border-purple-500/30 animate-fade-in">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-mono text-purple-300 uppercase tracking-wider mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Idea Prior-Art Comparator</span>
              </div>
              <h2 className="text-lg font-bold text-white">
                Has Someone Already Built Something Like This?
              </h2>
              <p className="text-xs text-white/65 mt-0.5">
                Describe an idea, system design, or algorithm. ORBIT queries live GitHub repositories and OpenAlex literature to identify closest existing projects.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowIdeaComparator(false)}
              className="p-1 rounded-lg text-white/50 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleCompareIdea} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={ideaQuery}
              onChange={(e) => setIdeaQuery(e.target.value)}
              placeholder="Describe your project idea (e.g. 'sparse attention CUDA kernel with hopper TMA' or 'drone video gaussian splatting pipeline')..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder:text-white/45 focus:outline-none focus:border-purple-400"
            />
            <button
              type="submit"
              disabled={ideaLoading}
              className="px-5 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs inline-flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 ${ideaLoading ? 'animate-spin' : ''}`} />
              <span>{ideaLoading ? 'Comparing...' : 'Compare Idea'}</span>
            </button>
          </form>

          {ideaResults && (
            <div className="space-y-4 pt-2">
              <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/30 text-xs text-purple-100">
                <strong>Prior Art Assessment:</strong> {ideaResults.synthesisNote}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Related Repos */}
                <div className="space-y-2">
                  <span className="font-semibold text-white/80 block">Related Open-Source Repositories:</span>
                  {ideaResults.repos.map((r, i) => (
                    <div
                      key={i}
                      onClick={() => handleOpenDetail(r.fullName)}
                      className="p-3 rounded-xl bg-white/[0.04] border border-white/10 hover:border-white/25 cursor-pointer space-y-1"
                    >
                      <div className="font-semibold text-sky-300 hover:underline">{r.fullName}</div>
                      <p className="text-white/70 line-clamp-2">{r.description}</p>
                      <div className="text-[10px] text-white/50 font-mono">
                        ⭐ {r.stars.toLocaleString()} · License: {r.license} · Updated {r.updatedAt}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Related Papers */}
                <div className="space-y-2">
                  <span className="font-semibold text-white/80 block">Related Scholarly Literature:</span>
                  {ideaResults.papers.map((p, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-white/[0.04] border border-white/10 space-y-1"
                    >
                      <div className="font-semibold text-emerald-300 line-clamp-1">{p.title}</div>
                      <div className="text-white/60">{p.venue} · {p.year}</div>
                      <div className="text-[10px] text-white/50 font-mono">
                        Cited by {p.citations.toLocaleString()} papers
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ERROR MESSAGE DISPLAY */}
      {apiError && (
        <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-300 shrink-0" />
            <span>{apiError}</span>
          </div>
          <button
            type="button"
            onClick={() => setApiError(null)}
            className="p-1 rounded-lg text-amber-300 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* REPOSITORY CARDS GRID */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-8">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="orbit-glass-panel rounded-[24px] p-5 border border-white/10 space-y-3 animate-pulse"
            >
              <div className="h-5 bg-white/10 rounded w-2/3" />
              <div className="h-4 bg-white/5 rounded w-full" />
              <div className="h-4 bg-white/5 rounded w-4/5" />
              <div className="pt-4 flex justify-between">
                <div className="h-4 bg-white/10 rounded w-1/4" />
                <div className="h-8 bg-white/10 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : repos.length === 0 ? (
        <div className="orbit-glass-panel rounded-[28px] p-12 text-center space-y-3 border border-white/12">
          <GitBranch className="w-10 h-10 text-white/30 mx-auto" />
          <h3 className="text-base font-bold text-white">No repositories matched your query</h3>
          <p className="text-xs text-white/60 max-w-md mx-auto">
            Try adjusting your search terms, selecting &ldquo;All&rdquo; for programming language, or resetting the topic preset.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedLanguage('All');
              setSelectedTopicId('all');
              fetchRepositories({ q: '', language: 'All', topicId: 'all', pageNumber: 1 });
            }}
            className="px-4 py-2 rounded-full bg-white text-[#0B0A0E] text-xs font-bold hover:bg-white/90"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {repos.map((repo) => {
              const savedDiscoveryId = `disc-repo-${repo.fullName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
              const isSaved = bookmarkedIds.includes(savedDiscoveryId);

              return (
                <div
                  key={repo.fullName}
                  className="orbit-glass-panel rounded-[24px] p-5 sm:p-6 border border-white/10 hover:border-white/25 transition-all flex flex-col justify-between space-y-4 group"
                >
                  {/* Top Metadata Row: Language, License, Updated */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-white/60">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-300 font-mono text-[11px] font-medium">
                          {repo.language}
                        </span>
                        <span className="text-[11px] font-mono text-white/50">
                          {repo.license}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-white/45 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{repo.updatedAt}</span>
                      </span>
                    </div>

                    {/* Repo Title & Owner */}
                    <div>
                      <h3
                        onClick={() => handleOpenDetail(repo)}
                        className="text-base sm:text-lg font-bold text-white group-hover:text-sky-300 cursor-pointer leading-snug break-words transition-colors"
                      >
                        {repo.fullName}
                      </h3>
                      <p className="text-xs text-white/65 line-clamp-3 mt-1.5 leading-relaxed">
                        {repo.description}
                      </p>
                    </div>

                    {/* Topics tags */}
                    {repo.topics && repo.topics.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {repo.topics.slice(0, 4).map((t) => (
                          <span
                            key={t}
                            onClick={() => {
                              setSearchQuery(t);
                              setPage(1);
                              fetchRepositories({ q: t, pageNumber: 1 });
                            }}
                            className="px-2 py-0.5 rounded-md bg-white/[0.04] hover:bg-white/10 text-[10px] font-mono text-white/60 hover:text-white cursor-pointer transition-colors"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Bottom Metrics & Actions */}
                  <div className="pt-3 border-t border-white/[0.08] space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono text-white/70">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1 text-amber-300">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>{repo.stars.toLocaleString()}</span>
                        </span>
                        <span className="inline-flex items-center gap-1 text-white/60">
                          <GitFork className="w-3.5 h-3.5" />
                          <span>{repo.forks.toLocaleString()}</span>
                        </span>
                      </div>

                      <a
                        href={repo.htmlUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white/50 hover:text-white inline-flex items-center gap-1 text-[11px]"
                        title="View repository on GitHub"
                      >
                        <span>GitHub</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleOpenDetail(repo)}
                        className="flex-1 py-2 px-3 rounded-full bg-white text-[#0B0A0E] text-xs font-bold hover:bg-white/90 transition-colors inline-flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Inspect README</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSaveAndBookmark(repo)}
                        className={`p-2 rounded-full transition-colors ${
                          isSaved
                            ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40'
                            : 'orbit-glass-pill text-white/80 hover:text-white'
                        }`}
                        title={isSaved ? 'Saved in ORBIT Library' : 'Save to ORBIT Library'}
                      >
                        {isSaved ? (
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                        ) : (
                          <Bookmark className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Continuous Repository Loading Sentinel & Incremental Load More Action */}
          <div
            ref={loadMoreSentinelRef}
            className="text-center pt-3 pb-1 flex flex-col items-center justify-center gap-2"
          >
            {hasMore ? (
              <button
                type="button"
                disabled={isLoadingMore}
                onClick={handleLoadMore}
                className="px-6 py-2.5 rounded-full orbit-glass-pill text-xs font-bold text-white hover:bg-white/20 transition-all inline-flex items-center gap-2 shadow-lg disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingMore ? 'animate-spin' : ''}`} />
                <span>
                  {isLoadingMore
                    ? `Loading Page ${page + 1} from GitHub...`
                    : `Load More Repositories (Page ${page + 1} · or scroll to auto-load)`}
                </span>
              </button>
            ) : (
              <span className="text-[11px] font-mono text-white/45 py-1">
                All matching repositories loaded ({repos.length} unique repositories).
              </span>
            )}
          </div>
        </div>
      )}

      {/* REPOSITORY DETAIL & LIVE README MODAL */}
      {detailModalOpen && inspectedAnalysis && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-0 sm:p-4 overflow-hidden"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-4xl h-full sm:h-[90vh] bg-[#111018] sm:rounded-[28px] border border-white/15 overflow-hidden flex flex-col shadow-2xl animate-fade-in">
            {/* Modal Header */}
            <div className="p-4 sm:p-6 bg-[#161422] border-b border-white/10 flex items-center justify-between gap-3 shrink-0">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2.5 py-0.5 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-300 font-mono">
                    {inspectedAnalysis.language}
                  </span>
                  <span className="text-white/60 font-mono text-[11px]">
                    License: {inspectedAnalysis.license}
                  </span>
                  <span className="text-white/40">·</span>
                  <span className="text-white/60 font-mono text-[11px]">
                    Updated {inspectedAnalysis.lastUpdated}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-white truncate">
                  {inspectedAnalysis.fullName}
                </h2>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={inspectedAnalysis.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-full orbit-glass-pill text-xs font-medium text-white/85 hover:text-white inline-flex items-center gap-1.5"
                >
                  <span className="hidden sm:inline">GitHub</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  type="button"
                  onClick={() => setDetailModalOpen(false)}
                  className="p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="px-6 py-2.5 bg-[#14121E] border-b border-white/10 flex items-center justify-between gap-3 text-xs shrink-0">
              <div className="flex items-center gap-1 bg-black/40 p-1 rounded-full border border-white/10">
                <button
                  type="button"
                  onClick={() => setDetailActiveTab('overview')}
                  className={`px-3.5 py-1.5 rounded-full font-medium transition-all ${
                    detailActiveTab === 'overview'
                      ? 'bg-white text-[#0B0A0E] font-semibold'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  Architecture Overview
                </button>
                <button
                  type="button"
                  onClick={() => setDetailActiveTab('readme')}
                  className={`px-3.5 py-1.5 rounded-full font-medium transition-all ${
                    detailActiveTab === 'readme'
                      ? 'bg-white text-[#0B0A0E] font-semibold'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  Live README.md
                </button>
                <button
                  type="button"
                  onClick={() => setDetailActiveTab('setup')}
                  className={`px-3.5 py-1.5 rounded-full font-medium transition-all ${
                    detailActiveTab === 'setup'
                      ? 'bg-white text-[#0B0A0E] font-semibold'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  Safe Setup &amp; Sandbox
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveAndBookmark(inspectedAnalysis)}
                  className="px-3.5 py-1.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/35 font-medium inline-flex items-center gap-1.5 transition-colors"
                >
                  <Bookmark className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Save to Library</span>
                </button>
              </div>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-[#ECEAE4]">
              {detailLoading && !inspectedAnalysis.readmeContent && (
                <div className="p-8 text-center text-xs text-white/50 space-y-2">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto text-sky-400" />
                  <p>Fetching full README and language breakdown from GitHub REST API...</p>
                </div>
              )}

              {detailError && (
                <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{detailError}</span>
                </div>
              )}

              {/* TAB 1: OVERVIEW */}
              {detailActiveTab === 'overview' && (
                <div className="space-y-6">
                  {/* Summary Callout */}
                  <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-5 space-y-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-sky-300 block">
                      Repository Summary
                    </span>
                    <p className="text-white/90 leading-relaxed">
                      {inspectedAnalysis.whatItDoes}
                    </p>
                    <div className="text-xs text-white/60 pt-1">
                      <strong>Problem Solved:</strong> {inspectedAnalysis.problemSolved}
                    </div>
                  </div>

                  {/* Real Metrics Lockup */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                    <div className="p-3.5 rounded-xl bg-black/40 border border-white/10">
                      <span className="text-white/50 block text-[10px]">STARS</span>
                      <span className="text-base font-bold text-amber-300 mt-0.5 block">
                        ⭐ {inspectedAnalysis.stars.toLocaleString()}
                      </span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-black/40 border border-white/10">
                      <span className="text-white/50 block text-[10px]">FORKS</span>
                      <span className="text-base font-bold text-white mt-0.5 block">
                        🍴 {inspectedAnalysis.forks.toLocaleString()}
                      </span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-black/40 border border-white/10">
                      <span className="text-white/50 block text-[10px]">OPEN ISSUES</span>
                      <span className="text-base font-bold text-white/80 mt-0.5 block">
                        {inspectedAnalysis.openIssues}
                      </span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-black/40 border border-white/10">
                      <span className="text-white/50 block text-[10px]">LICENSE</span>
                      <span className="text-sm font-bold text-emerald-300 mt-0.5 block truncate">
                        {inspectedAnalysis.license}
                      </span>
                    </div>
                  </div>

                  {/* Architecture & Engineering Details */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-mono uppercase tracking-wider text-white/60">
                      Internal Architecture &amp; Repository Layout
                    </h4>
                    <div className="space-y-2 text-xs text-white/80">
                      {inspectedAnalysis.internalArchitecture.map((arch, i) => (
                        <div key={i} className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                          {arch}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Ask Professor CTA */}
                  {onAskProfessorAboutRepo && (
                    <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/30 to-sky-950/30 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-4">
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">Ask Professor to Explain this Repository</h4>
                        <p className="text-xs text-white/70">
                          Receive an architectural walkthrough, setup guidance, or connect this project to related scholarly papers.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setDetailModalOpen(false);
                          onAskProfessorAboutRepo(
                            inspectedAnalysis,
                            `Explain the architecture, key files, and setup requirements of ${inspectedAnalysis.fullName} in detail.`
                          );
                        }}
                        className="px-4 py-2 rounded-full bg-emerald-400 hover:bg-emerald-300 text-[#0B0A0E] text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-lg"
                      >
                        <GraduationCap className="w-3.5 h-3.5" />
                        <span>Explain Architecture</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: LIVE README */}
              {detailActiveTab === 'readme' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-white/50 pb-2 border-b border-white/10">
                    <span>README.md from default branch</span>
                    <a
                      href={`${inspectedAnalysis.repoUrl}#readme`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-300 hover:underline inline-flex items-center gap-1"
                    >
                      <span>View raw on GitHub</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {inspectedAnalysis.readmeContent ? (
                    <div className="p-5 rounded-2xl bg-black/50 border border-white/12 text-xs font-mono text-[#ECEAE4] leading-relaxed whitespace-pre-wrap overflow-x-auto max-h-[60vh]">
                      {inspectedAnalysis.readmeContent}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-xs text-white/50 space-y-2">
                      <FileText className="w-8 h-8 text-white/30 mx-auto" />
                      <p>
                        README not directly returned by API or unauthenticated rate limit reached.
                      </p>
                      <a
                        href={inspectedAnalysis.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sky-300 hover:underline inline-flex items-center gap-1"
                      >
                        <span>Inspect README on GitHub &rarr;</span>
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: SETUP & CONTAINER SANDBOX */}
              {detailActiveTab === 'setup' && (
                <div className="space-y-5">
                  <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200 space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-amber-300">
                      <ShieldAlert className="w-4 h-4" />
                      <span>Security &amp; Non-Execution Policy</span>
                    </div>
                    <p className="leading-relaxed">
                      ORBIT never auto-executes untrusted code or arbitrary repository shell scripts. Always inspect setup manifests inside an isolated container.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-mono uppercase tracking-wider text-white/60">
                      Recommended Safe Container Setup Steps
                    </h4>
                    <div className="space-y-2">
                      {inspectedAnalysis.safeSetupSteps.map((step, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-black/40 border border-white/10 font-mono text-xs text-emerald-300"
                        >
                          {step}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-mono uppercase tracking-wider text-white/60">
                      Hardware Prerequisites
                    </h4>
                    <ul className="space-y-1 text-xs text-white/80 list-disc list-inside">
                      {inspectedAnalysis.hardwareAndPrerequisites.map((hw, idx) => (
                        <li key={idx}>{hw}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
