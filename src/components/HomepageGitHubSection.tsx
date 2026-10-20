import React, { useState, useEffect } from 'react';
import {
  DiscoveryItem,
  GitHubRepoAnalysis,
  WatchlistItem,
} from '../types/orbit';
import {
  GitHubCatalogRepoItem,
  SEED_GITHUB_REPOS,
} from '../data/seedDiscoveries';
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
} from 'lucide-react';

interface HomepageGitHubSectionProps {
  discoveries: DiscoveryItem[];
  bookmarkedIds: string[];
  externalRepoSearchRequest?: {
    query: string;
    paperTitle?: string;
    isVerifiedCompanion?: boolean;
    timestamp: number;
  } | null;
  onToggleBookmark: (id: string) => void;
  onSaveRepoAsDiscovery: (repo: GitHubRepoAnalysis) => DiscoveryItem;
  onOpenWorkspace: (
    item: DiscoveryItem,
    tab?: 'reader' | 'professor' | 'visual' | 'notes' | 'quiz'
  ) => void;
  onAskProfessorAboutRepo: (repo: GitHubRepoAnalysis, prompt: string) => void;
  onAddWatch: (
    watch: Omit<WatchlistItem, 'id' | 'lastCheckedAt' | 'lastStatus' | 'updates'>
  ) => void;
  onExploreAllRepositories?: () => void;
}

const GITHUB_TOPIC_PRESETS = [
  { id: 'all', label: 'Trending & Verified', query: '' },
  { id: 'transformers', label: 'AI & Transformers', query: 'transformers attention llm' },
  { id: 'gaussian-splatting', label: '3D Vision & Splatting', query: '3d gaussian splatting nerf' },
  { id: 'quantum-computing', label: 'Quantum & Physics', query: 'quantum error correction qubit' },
  { id: 'bioinformatics', label: 'Biomed & Genomics', query: 'bioinformatics genomics protein' },
  { id: 'climate-modeling', label: 'Climate & Earth', query: 'weather forecasting climate model' },
  { id: 'theorem-proving', label: 'Math & Theorem Proving', query: 'theorem proving formal math' },
  { id: 'reverse-engineering', label: 'Systems & Security', query: 'reverse engineering binary analysis' },
];

const LANGUAGE_FILTERS = ['All', 'Python', 'C++', 'CUDA', 'Rust', 'TypeScript', 'Jupyter Notebook'];

export const HomepageGitHubSection: React.FC<HomepageGitHubSectionProps> = ({
  discoveries,
  bookmarkedIds,
  externalRepoSearchRequest,
  onToggleBookmark,
  onSaveRepoAsDiscovery,
  onOpenWorkspace,
  onAskProfessorAboutRepo,
  onAddWatch,
  onExploreAllRepositories,
}) => {
  const [selectedTopicId, setSelectedTopicId] = useState<string>('all');
  const [languageFilter, setLanguageFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'stars' | 'updated'>('stars');
  const [repoSearchInput, setRepoSearchInput] = useState<string>('');
  const [linkedPaperContext, setLinkedPaperContext] = useState<{
    paperTitle: string;
    isVerifiedCompanion?: boolean;
  } | null>(null);

  const [repos, setRepos] = useState<GitHubCatalogRepoItem[]>(SEED_GITHUB_REPOS);
  const [isLoadingRepos, setIsLoadingRepos] = useState<boolean>(false);
  const [repoSearchError, setRepoSearchError] = useState<string | null>(null);
  const [isRateLimited, setIsRateLimited] = useState<boolean>(false);
  const [lastFetchedLabel, setLastFetchedLabel] = useState<string | null>(null);

  // Repository Detail Modal State
  const [inspectModalOpen, setInspectModalOpen] = useState<boolean>(false);
  const [inspectingRepoName, setInspectingRepoName] = useState<string | null>(null);
  const [inspectLoading, setInspectLoading] = useState<boolean>(false);
  const [inspectError, setInspectError] = useState<string | null>(null);
  const [inspectedAnalysis, setInspectedAnalysis] = useState<GitHubRepoAnalysis | null>(null);
  const [detailTab, setDetailTab] = useState<'overview' | 'readme' | 'setup'>('overview');
  const [watchAddedToast, setWatchAddedToast] = useState<boolean>(false);

  const runLiveRepoDiscovery = async (opts: {
    q?: string;
    topicId?: string;
    language?: string;
    sort?: 'stars' | 'updated';
  }) => {
    const activeQ = opts.q !== undefined ? opts.q : repoSearchInput;
    const activeTopic = opts.topicId !== undefined ? opts.topicId : selectedTopicId;
    const activeLang = opts.language !== undefined ? opts.language : languageFilter;
    const activeSort = opts.sort !== undefined ? opts.sort : sortBy;

    // If default 'all' with no query and 'All' language, show verified seed repos + any cached
    const presetObj = GITHUB_TOPIC_PRESETS.find((t) => t.id === activeTopic);
    const effectiveQuery = activeQ.trim() || presetObj?.query || '';

    if (!effectiveQuery && activeLang === 'All' && activeTopic === 'all') {
      const sortedSeeds = [...SEED_GITHUB_REPOS].sort((a, b) =>
        activeSort === 'updated'
          ? b.updatedAt.localeCompare(a.updatedAt)
          : b.stars - a.stars
      );
      setRepos(sortedSeeds);
      setRepoSearchError(null);
      setIsRateLimited(false);
      setLastFetchedLabel(null);
      return;
    }

    setIsLoadingRepos(true);
    setRepoSearchError(null);
    setIsRateLimited(false);

    try {
      const params = new URLSearchParams();
      if (effectiveQuery) params.set('q', effectiveQuery);
      if (activeLang !== 'All') params.set('language', activeLang);
      params.set('sort', activeSort);

      const res = await fetch(`/api/github/discover?${params.toString()}`);
      const data = await res.json();

      if (res.status === 429 || data.rateLimited) {
        setIsRateLimited(true);
        const localFiltered = SEED_GITHUB_REPOS.filter((r) => {
          const matchesLang =
            activeLang === 'All' || r.language.toLowerCase() === activeLang.toLowerCase();
          const qLower = effectiveQuery.toLowerCase();
          const matchesQ =
            !qLower ||
            r.fullName.toLowerCase().includes(qLower) ||
            r.description.toLowerCase().includes(qLower) ||
            r.topics.some((t) => t.toLowerCase().includes(qLower));
          return matchesLang && matchesQ;
        });
        setRepos(localFiltered.length > 0 ? localFiltered : SEED_GITHUB_REPOS);
        return;
      }

      if (!res.ok) {
        setRepoSearchError(data.error || 'Could not query GitHub repositories.');
        return;
      }

      if (Array.isArray(data.items) && data.items.length > 0) {
        setRepos(data.items);
        setLastFetchedLabel(
          `Retrieved ${data.items.length} repositories from GitHub REST API`
        );
      } else {
        setRepos([]);
        setLastFetchedLabel('No matching repositories found on GitHub for this filter.');
      }
    } catch {
      setRepoSearchError(
        'GitHub search API is temporarily unreachable. Showing verified benchmark repositories.'
      );
      setRepos(SEED_GITHUB_REPOS);
    } finally {
      setIsLoadingRepos(false);
    }
  };

  // Handle Journey B: Research to GitHub external trigger
  useEffect(() => {
    if (!externalRepoSearchRequest) return;
    const q = externalRepoSearchRequest.query.trim();
    setRepoSearchInput(q);
    setSelectedTopicId('all');
    if (externalRepoSearchRequest.paperTitle) {
      setLinkedPaperContext({
        paperTitle: externalRepoSearchRequest.paperTitle,
        isVerifiedCompanion: externalRepoSearchRequest.isVerifiedCompanion,
      });
    } else {
      setLinkedPaperContext(null);
    }
    runLiveRepoDiscovery({ q, topicId: 'all' });
  }, [externalRepoSearchRequest]);

  // Open Repository Detail Modal and fetch live README + metadata
  const handleOpenRepoDetail = async (repoItem: GitHubCatalogRepoItem | string) => {
    const fullName =
      typeof repoItem === 'string'
        ? repoItem.trim().replace(/^https?:\/\/github\.com\//i, '').replace(/\/+$/, '')
        : repoItem.fullName;

    if (!fullName.includes('/')) {
      setRepoSearchError('Enter a valid owner/repo (e.g., Dao-AILab/flash-attention) or search keyword.');
      return;
    }

    setInspectModalOpen(true);
    setInspectingRepoName(fullName);
    setDetailTab('overview');
    setInspectError(null);

    // Check if we have a local seed analysis first for instant display while fetching live README
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
        problemSolved: `Open-source ${repoItem.language} implementation (${repoItem.topics.join(', ') || 'research software'}).`,
        internalArchitecture: [
          `Primary Language: ${repoItem.language}`,
          `Stars: ${repoItem.stars.toLocaleString()} · Forks: ${repoItem.forks.toLocaleString()} · Open Issues: ${repoItem.openIssues}`,
          'Fetching live repository metadata and README.md from GitHub REST API...',
        ],
        noveltyComparison: 'Metadata retrieved from GitHub REST API.',
        hardwareAndPrerequisites: [
          `${repoItem.language} environment inside an isolated Docker container or virtual environment`,
        ],
        safeSetupSteps: [
          '1. Create an isolated container or virtual environment before cloning.',
          `2. git clone https://github.com/${repoItem.fullName}.git`,
          '3. Inspect dependency manifests and README instructions before executing build scripts.',
        ],
        securityAndSandboxWarnings: [
          'Never run unverified setup scripts with root privileges.',
        ],
        alternatives: [],
      });
    }

    setInspectLoading(true);
    try {
      const res = await fetch(`/api/github/inspect?repo=${encodeURIComponent(fullName)}`);
      const data = await res.json();
      if (res.ok && data.repoAnalysis) {
        setInspectedAnalysis(data.repoAnalysis);
      } else if (!localSeed && typeof repoItem === 'string') {
        setInspectError(data.error || `Could not load ${fullName} from GitHub.`);
      }
    } catch {
      if (!localSeed && typeof repoItem === 'string') {
        setInspectError('Network error while contacting GitHub REST API.');
      }
    } finally {
      setInspectLoading(false);
    }
  };

  const getRepoDiscoveryId = (fullName: string) => {
    const existing = discoveries.find(
      (d) => d.repoAnalysis?.fullName.toLowerCase() === fullName.toLowerCase()
    );
    if (existing) return existing.id;
    return `disc-repo-${fullName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  };

  const handleSaveCatalogRepoToLibrary = (repoItem: GitHubCatalogRepoItem) => {
    const analysis: GitHubRepoAnalysis = {
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
      problemSolved: `Open-source ${repoItem.language} repository (${repoItem.topics.join(', ') || 'research code'}).`,
      internalArchitecture: [
        `Primary Language: ${repoItem.language} · License: ${repoItem.license}`,
        `Community Telemetry: ${repoItem.stars.toLocaleString()} Stars · ${repoItem.forks.toLocaleString()} Forks`,
      ],
      noveltyComparison: 'Indexed via GitHub REST API.',
      hardwareAndPrerequisites: [`${repoItem.language} runtime in an isolated virtual environment`],
      safeSetupSteps: [
        '1. Provision an isolated virtual environment or container.',
        `2. git clone ${repoItem.htmlUrl}.git`,
        '3. Review README.md and dependency manifests before installing.',
      ],
      securityAndSandboxWarnings: [
        'Always inspect build scripts before running locally.',
      ],
      alternatives: [],
    };
    const disc = onSaveRepoAsDiscovery(analysis);
    onToggleBookmark(disc.id);
  };

  return (
    <section id="homepage-github-section" className="space-y-5 pt-4">
      <div className="orbit-glass-panel rounded-[28px] p-6 sm:p-7 space-y-5 border border-white/12">
        {/* Section Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/15 border border-sky-500/30 text-xs font-mono text-sky-300">
              <GitBranch className="w-3.5 h-3.5" />
              <span>GitHub Repositories · Open-Source Research &amp; Code</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Discover Open-Source Research Implementations &amp; Repositories
            </h2>
            <p className="text-xs sm:text-sm text-white/65 leading-relaxed">
              Explore real GitHub repositories linked to research topics, inspect README documentation and language metadata, ask Professor to explain the architecture, or generate structured setup notes.
            </p>
          </div>

          {/* Sort & Reset Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center rounded-full bg-black/45 border border-white/12 p-1 text-xs">
              <button
                type="button"
                onClick={() => {
                  setSortBy('stars');
                  runLiveRepoDiscovery({ sort: 'stars' });
                }}
                className={`px-3 py-1 rounded-full transition-colors ${
                  sortBy === 'stars'
                    ? 'bg-white text-[#0B0A0E] font-semibold'
                    : 'text-white/65 hover:text-white'
                }`}
              >
                Most Stars
              </button>
              <button
                type="button"
                onClick={() => {
                  setSortBy('updated');
                  runLiveRepoDiscovery({ sort: 'updated' });
                }}
                className={`px-3 py-1 rounded-full transition-colors ${
                  sortBy === 'updated'
                    ? 'bg-white text-[#0B0A0E] font-semibold'
                    : 'text-white/65 hover:text-white'
                }`}
              >
                Recently Updated
              </button>
            </div>

            {onExploreAllRepositories && (
              <button
                type="button"
                onClick={onExploreAllRepositories}
                className="px-4 py-2 rounded-full bg-white text-[#0B0A0E] hover:bg-white/90 text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-md shrink-0 cursor-pointer"
              >
                <span>Explore All Repositories</span>
                <span>&rarr;</span>
              </button>
            )}
          </div>
        </div>

        {/* Linked Paper Relationship Banner (Journey B: Research to GitHub) */}
        {linkedPaperContext && (
          <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/25 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <Sparkles className="w-4 h-4 text-sky-300 shrink-0" />
              <div className="min-w-0">
                <span className="font-semibold text-white">
                  {linkedPaperContext.isVerifiedCompanion
                    ? 'Verified Companion Repository Match: '
                    : 'Suggested Topic Repositories (Inferred from Paper Topic): '}
                </span>
                <span className="text-white/75 truncate">
                  {linkedPaperContext.paperTitle}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setLinkedPaperContext(null);
                setRepoSearchInput('');
                setSelectedTopicId('all');
                runLiveRepoDiscovery({ q: '', topicId: 'all' });
              }}
              className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white/85 shrink-0"
            >
              Show All Featured Repos
            </button>
          </div>
        )}

        {/* Search & Direct owner/repo Inspector Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const trimmed = repoSearchInput.trim();
            if (trimmed.includes('/') && !trimmed.includes(' ')) {
              handleOpenRepoDetail(trimmed);
            } else {
              setLinkedPaperContext(null);
              runLiveRepoDiscovery({ q: trimmed });
            }
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-white/45 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={repoSearchInput}
              onChange={(e) => setRepoSearchInput(e.target.value)}
              placeholder="Search GitHub topics/projects (e.g., 'gaussian splatting', 'flash attention') or enter owner/repo..."
              className="w-full pl-11 pr-9 py-3 rounded-2xl bg-black/45 border border-white/15 text-xs sm:text-sm text-white placeholder:text-white/45 focus:outline-none focus:border-white/40"
            />
            {repoSearchInput && (
              <button
                type="button"
                onClick={() => {
                  setRepoSearchInput('');
                  setLinkedPaperContext(null);
                  runLiveRepoDiscovery({ q: '' });
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/45 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={isLoadingRepos}
            className="px-5 py-3 rounded-2xl bg-white text-[#0B0A0E] text-xs sm:text-sm font-bold hover:bg-white/90 transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRepos ? 'animate-spin' : ''}`} />
            <span>
              {isLoadingRepos
                ? 'Searching GitHub...'
                : repoSearchInput.trim().includes('/') && !repoSearchInput.trim().includes(' ')
                ? 'Inspect owner/repo'
                : 'Explore Repositories'}
            </span>
          </button>
        </form>

        {/* Topic Discovery Bar + Language Filter */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {GITHUB_TOPIC_PRESETS.map((topic) => {
              const active = selectedTopicId === topic.id && !linkedPaperContext;
              return (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => {
                    setSelectedTopicId(topic.id);
                    setLinkedPaperContext(null);
                    setRepoSearchInput(topic.query);
                    runLiveRepoDiscovery({
                      q: topic.query,
                      topicId: topic.id,
                    });
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-sky-400 text-[#0B0A0E] font-bold shadow-sm'
                      : 'orbit-glass-pill text-white/75 hover:text-white hover:bg-white/15'
                  }`}
                >
                  {topic.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-mono text-white/50">Language:</span>
            <select
              value={languageFilter}
              onChange={(e) => {
                const nextLang = e.target.value;
                setLanguageFilter(nextLang);
                runLiveRepoDiscovery({ language: nextLang });
              }}
              aria-label="Filter repositories by programming language"
              className="px-3 py-1.5 rounded-xl bg-black/50 border border-white/15 text-xs text-white focus:outline-none"
            >
              {LANGUAGE_FILTERS.map((lang) => (
                <option key={lang} value={lang}>
                  {lang === 'All' ? 'All Languages' : lang}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status / Rate-Limit / Error Notices */}
        {isRateLimited && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between gap-3 text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                GitHub public API rate limit reached for unauthenticated search queries. Showing verified repository records.
              </span>
            </div>
          </div>
        )}

        {repoSearchError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-between gap-3 text-xs text-rose-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{repoSearchError}</span>
            </div>
            <button
              type="button"
              onClick={() => runLiveRepoDiscovery({})}
              className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {lastFetchedLabel && !isRateLimited && !repoSearchError && (
          <div className="flex items-center justify-between text-[11px] font-mono text-white/55 px-1">
            <span>{lastFetchedLabel}</span>
            <span>Source: GitHub Public REST API</span>
          </div>
        )}

        {/* Repository Cards Grid */}
        {isLoadingRepos ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="rounded-2xl p-5 bg-white/[0.03] border border-white/10 animate-pulse space-y-3 h-52"
              >
                <div className="h-4 w-2/3 bg-white/10 rounded" />
                <div className="h-3 w-full bg-white/10 rounded" />
                <div className="h-3 w-4/5 bg-white/10 rounded" />
                <div className="pt-6 flex gap-2">
                  <div className="h-7 w-20 bg-white/10 rounded-full" />
                  <div className="h-7 w-20 bg-white/10 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : repos.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/10 text-center space-y-3">
            <p className="text-sm font-semibold text-white">
              No repositories matched that filter combination.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedTopicId('all');
                setLanguageFilter('All');
                setRepoSearchInput('');
                setLinkedPaperContext(null);
                runLiveRepoDiscovery({ q: '', topicId: 'all', language: 'All' });
              }}
              className="px-4 py-2 rounded-full bg-white text-[#0B0A0E] text-xs font-bold"
            >
              Reset Repository Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {repos.map((repo) => {
              const discId = getRepoDiscoveryId(repo.fullName);
              const isSaved = bookmarkedIds.includes(discId);

              return (
                <article
                  key={repo.fullName}
                  onClick={() => handleOpenRepoDetail(repo)}
                  className="group rounded-[22px] p-5 bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 hover:border-white/25 transition-all flex flex-col justify-between gap-4 cursor-pointer"
                >
                  <div className="space-y-3">
                    {/* Top Row: Owner/Name + Language Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[11px] font-mono text-white/50 block truncate">
                          {repo.owner}
                        </span>
                        <h3 className="text-base font-bold font-mono text-white group-hover:text-sky-300 transition-colors truncate">
                          {repo.name}
                        </h3>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-md bg-sky-500/15 border border-sky-500/30 text-[11px] font-mono text-sky-300 shrink-0">
                        {repo.language}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-xs sm:text-sm text-white/75 leading-relaxed line-clamp-3">
                      {repo.description}
                    </p>

                    {/* Topics */}
                    {repo.topics && repo.topics.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {repo.topics.slice(0, 4).map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/10 text-[10px] font-mono text-white/65"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 pt-2 border-t border-white/10">
                    {/* Telemetry Strip: Stars, Forks, License, Updated */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-white/60">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1 text-amber-300">
                          <Star className="w-3.5 h-3.5 fill-amber-300/30" />
                          {repo.stars.toLocaleString()}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <GitFork className="w-3 h-3" />
                          {repo.forks.toLocaleString()}
                        </span>
                        <span className="truncate max-w-[110px]" title={repo.license}>
                          {repo.license}
                        </span>
                      </div>
                      <span className="text-white/45">{repo.updatedAt}</span>
                    </div>

                    {/* Card Actions */}
                    <div
                      className="flex items-center justify-between gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => handleOpenRepoDetail(repo)}
                        className="px-3.5 py-1.5 rounded-xl bg-white text-[#0B0A0E] text-xs font-bold hover:bg-white/90 transition-colors inline-flex items-center gap-1.5"
                      >
                        <Code2 className="w-3.5 h-3.5" />
                        <span>Inspect Project</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleSaveCatalogRepoToLibrary(repo)}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors inline-flex items-center gap-1 ${
                            isSaved
                              ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/35'
                              : 'bg-white/[0.06] hover:bg-white/15 text-white/80 border border-white/10'
                          }`}
                        >
                          {isSaved ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-300" />
                              <span>Saved</span>
                            </>
                          ) : (
                            <>
                              <Bookmark className="w-3 h-3" />
                              <span>Save</span>
                            </>
                          )}
                        </button>

                        <a
                          href={repo.htmlUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Open ${repo.fullName} on GitHub`}
                          className="p-1.5 rounded-xl bg-white/[0.06] hover:bg-white/15 text-white/75 hover:text-white border border-white/10"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* REPOSITORY DETAIL MODAL (Coherent Inspection, Live README, Metadata, Professor & Notes Workflow) */}
      {inspectModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
          onClick={() => setInspectModalOpen(false)}
        >
          <div
            className="w-full max-w-4xl max-h-[90vh] rounded-[28px] bg-[#100F16] border border-white/15 shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <header className="px-5 sm:px-7 py-4 border-b border-white/10 flex items-center justify-between gap-4 bg-[#14131C]">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-sky-300">
                  <GitBranch className="w-3.5 h-3.5" />
                  <span>GitHub Repository Detail</span>
                  {inspectedAnalysis?.language && (
                    <>
                      <span className="text-white/30">·</span>
                      <span>{inspectedAnalysis.language}</span>
                    </>
                  )}
                  {inspectedAnalysis?.license && (
                    <>
                      <span className="text-white/30">·</span>
                      <span>License: {inspectedAnalysis.license}</span>
                    </>
                  )}
                </div>
                <h3 className="text-lg sm:text-xl font-bold font-mono text-white truncate mt-0.5">
                  {inspectedAnalysis?.fullName || inspectingRepoName}
                </h3>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {inspectedAnalysis && (
                  <a
                    href={inspectedAnalysis.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/15 border border-white/10 text-xs font-mono text-emerald-300 inline-flex items-center gap-1.5"
                  >
                    <span>Open on GitHub</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setInspectModalOpen(false)}
                  aria-label="Close repository inspector"
                  className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/15 text-white/75 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </header>

            {/* Sub-navigation & Learning Actions Bar (Journey C: Repository to Learning) */}
            {inspectedAnalysis && (
              <div className="px-5 sm:px-7 py-3 border-b border-white/10 bg-[#121119] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  {[
                    { id: 'overview', label: 'Overview & Architecture' },
                    {
                      id: 'readme',
                      label: inspectedAnalysis.readmeRetrieved
                        ? 'README.md (Live)'
                        : 'README & Docs',
                    },
                    { id: 'setup', label: 'Safe Setup & Sandbox' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setDetailTab(t.id as any)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                        detailTab === t.id
                          ? 'bg-white text-[#0B0A0E] font-bold'
                          : 'text-white/70 hover:text-white hover:bg-white/[0.06]'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Save Repository to Library */}
                  {(() => {
                    const discId = getRepoDiscoveryId(inspectedAnalysis.fullName);
                    const isSaved = bookmarkedIds.includes(discId);
                    return (
                      <button
                        type="button"
                        onClick={() => {
                          const disc = onSaveRepoAsDiscovery(inspectedAnalysis);
                          onToggleBookmark(disc.id);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors inline-flex items-center gap-1.5 ${
                          isSaved
                            ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/35'
                            : 'bg-white/[0.06] hover:bg-white/15 text-white border border-white/10'
                        }`}
                      >
                        {isSaved ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-300" />
                            <span>Saved in Library</span>
                          </>
                        ) : (
                          <>
                            <Bookmark className="w-3.5 h-3.5" />
                            <span>Save to Library</span>
                          </>
                        )}
                      </button>
                    );
                  })()}

                  {/* Ask Professor to Explain Project */}
                  <button
                    type="button"
                    onClick={() => {
                      const disc = onSaveRepoAsDiscovery(inspectedAnalysis);
                      setInspectModalOpen(false);
                      onAskProfessorAboutRepo(
                        inspectedAnalysis,
                        `Explain the purpose, architecture, and safe setup workflow of the GitHub repository ${inspectedAnalysis.fullName} based on its retrieved metadata and README.`
                      );
                      void disc;
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-xs font-semibold text-emerald-200 inline-flex items-center gap-1.5"
                  >
                    <GraduationCap className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Ask Professor</span>
                  </button>

                  {/* Create Study Notes / Setup Guide */}
                  <button
                    type="button"
                    onClick={() => {
                      const disc = onSaveRepoAsDiscovery(inspectedAnalysis);
                      setInspectModalOpen(false);
                      onOpenWorkspace(disc, 'notes');
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-white text-[#0B0A0E] text-xs font-bold hover:bg-white/90 inline-flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Create Study Notes</span>
                  </button>
                </div>
              </div>
            )}

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
              {inspectLoading && (
                <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/25 flex items-center gap-2.5 text-xs text-sky-200">
                  <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                  <span>
                    Retrieving live repository metadata, language breakdown, and README.md from GitHub REST API...
                  </span>
                </div>
              )}

              {inspectError && (
                <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-200">
                  {inspectError}
                </div>
              )}

              {inspectedAnalysis && detailTab === 'overview' && (
                <div className="space-y-6">
                  {/* Source Transparency Notice */}
                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-white/70 flex items-center justify-between gap-3">
                    <span>
                      Grounded in public GitHub REST API metadata
                      {inspectedAnalysis.readmeRetrieved ? ' and retrieved README.md' : ''}. Source code files are not executed.
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onAddWatch({
                          targetType: 'GitHub Repository',
                          targetQuery: inspectedAnalysis.fullName,
                          displayTitle: `${inspectedAnalysis.fullName} Releases`,
                          sourcesMonitored: ['GitHub REST API'],
                          importanceThreshold: 'Meaningful Changes Only',
                          cadence: 'Weekly Digest',
                          active: true,
                        });
                        setWatchAddedToast(true);
                        setTimeout(() => setWatchAddedToast(false), 2500);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-emerald-300 font-mono text-[11px] inline-flex items-center gap-1 shrink-0"
                    >
                      <BellPlus className="w-3 h-3" />
                      <span>{watchAddedToast ? 'Watching!' : 'Watch Releases'}</span>
                    </button>
                  </div>

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
                      <span className="text-[11px] text-white/50 block">Stars</span>
                      <span className="text-lg font-mono font-bold text-amber-300">
                        ★ {inspectedAnalysis.stars.toLocaleString()}
                      </span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
                      <span className="text-[11px] text-white/50 block">Forks</span>
                      <span className="text-lg font-mono font-bold text-white">
                        {inspectedAnalysis.forks.toLocaleString()}
                      </span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
                      <span className="text-[11px] text-white/50 block">Open Issues</span>
                      <span className="text-lg font-mono font-bold text-white">
                        {inspectedAnalysis.openIssues}
                      </span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
                      <span className="text-[11px] text-white/50 block">Last Activity</span>
                      <span className="text-sm font-mono font-semibold text-emerald-300 block mt-1">
                        {inspectedAnalysis.lastUpdated}
                      </span>
                    </div>
                  </div>

                  {/* Languages Breakdown when retrieved from GitHub API */}
                  {inspectedAnalysis.languagesBreakdown &&
                    Object.keys(inspectedAnalysis.languagesBreakdown).length > 0 && (
                      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2.5">
                        <span className="text-xs font-mono text-white/60 block">
                          Repository Languages Breakdown (GitHub API)
                        </span>
                        {(() => {
                          const entries = Object.entries(
                            inspectedAnalysis.languagesBreakdown!
                          ) as Array<[string, number]>;
                          const totalBytes = entries.reduce((acc, [, b]) => acc + b, 0) || 1;
                          return (
                            <div className="flex flex-wrap gap-2">
                              {entries.slice(0, 6).map(([lang, bytes]) => {
                                const pct = Math.max(1, Math.round((bytes / totalBytes) * 100));
                                return (
                                  <span
                                    key={lang}
                                    className="px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 text-xs font-mono text-white/85"
                                  >
                                    {lang}: <strong className="text-sky-300">{pct}%</strong>
                                  </span>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    )}

                  {/* Topics */}
                  {inspectedAnalysis.topics && inspectedAnalysis.topics.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-mono text-white/50 mr-1">Topics:</span>
                      {inspectedAnalysis.topics.map((t) => (
                        <span
                          key={t}
                          className="px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/10 text-xs font-mono text-white/80"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Purpose & Problem Solved */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1.5">
                      <span className="text-xs font-mono text-emerald-300">
                        Project Purpose
                      </span>
                      <p className="text-sm text-white/85 leading-relaxed">
                        {inspectedAnalysis.whatItDoes}
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1.5">
                      <span className="text-xs font-mono text-sky-300">
                        Engineering Context &amp; Scope
                      </span>
                      <p className="text-sm text-white/85 leading-relaxed">
                        {inspectedAnalysis.problemSolved}
                      </p>
                    </div>
                  </div>

                  {/* Architecture Stages */}
                  <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-3">
                    <span className="text-xs font-mono text-emerald-300 block">
                      Architecture &amp; Structure Summary
                    </span>
                    <div className="space-y-2">
                      {inspectedAnalysis.internalArchitecture.map((stage, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-xs sm:text-sm font-mono text-white/85"
                        >
                          {stage}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {inspectedAnalysis && detailTab === 'readme' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-white/60 font-mono">
                    <span>
                      {inspectedAnalysis.readmeRetrieved
                        ? `README.md retrieved directly from ${inspectedAnalysis.fullName}`
                        : 'Live README.md not deposited or rate-limited; showing repository summary'}
                    </span>
                    <a
                      href={inspectedAnalysis.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-300 hover:underline inline-flex items-center gap-1"
                    >
                      <span>View Full Repo on GitHub</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="p-5 rounded-2xl bg-black/55 border border-white/12 font-mono text-xs sm:text-sm text-[#E8E6E0] leading-relaxed whitespace-pre-wrap overflow-x-auto max-h-[52vh]">
                    {inspectedAnalysis.readmeContent ||
                      `# ${inspectedAnalysis.fullName}\n\n${inspectedAnalysis.whatItDoes}\n\n## Overview\n${inspectedAnalysis.problemSolved}\n\n## Architecture\n${inspectedAnalysis.internalArchitecture.join(
                        '\n'
                      )}\n\nOpen ${inspectedAnalysis.repoUrl} to browse the full source tree and documentation.`}
                  </div>
                </div>
              )}

              {inspectedAnalysis && detailTab === 'setup' && (
                <div className="space-y-5">
                  <div className="p-5 rounded-2xl bg-emerald-500/[0.07] border border-emerald-500/25 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-mono text-emerald-300">
                      <Terminal className="w-4 h-4" />
                      <span>Safe Evaluation &amp; Container Setup Steps</span>
                    </div>
                    <ul className="space-y-2 text-xs sm:text-sm text-white/85">
                      {inspectedAnalysis.safeSetupSteps.map((step, i) => (
                        <li key={i} className="leading-relaxed">
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-mono text-amber-300">
                      <ShieldAlert className="w-4 h-4" />
                      <span>Security &amp; Sandbox Precautions</span>
                    </div>
                    <ul className="space-y-2 text-xs text-amber-100/90">
                      {inspectedAnalysis.securityAndSandboxWarnings.map((w, i) => (
                        <li key={i}>▲ {w}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
