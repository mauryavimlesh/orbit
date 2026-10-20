/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  DiscoveryItem,
  DifficultyLevel,
  ExplanationLanguage,
  GitHubRepoAnalysis,
  KnowledgeEdge,
  MasteryRecord,
  ProviderStatusReport,
  QuotaStatus,
  ResearchProviderId,
  StructuredNote,
  WatchlistItem,
} from './types/orbit';
import {
  SEED_DISCOVERIES,
  INITIAL_MASTERY_RECORDS,
  INITIAL_KNOWLEDGE_EDGES,
  INITIAL_WATCHLISTS,
  RESEARCH_CATEGORIES,
} from './data/seedDiscoveries';
import { EditorialArtwork } from './components/EditorialArtwork';
import { ResearchWorkspaceModal } from './components/ResearchWorkspaceModal';
import { MyLearningView } from './components/MyLearningView';
import { NotesDocumentView } from './components/NotesDocumentView';
import { FloatingProfessorAgent } from './components/FloatingProfessorAgent';
import { HomepageGitHubSection } from './components/HomepageGitHubSection';
import { GitHubExplorerView } from './components/GitHubExplorerView';
import { LatexTextRenderer } from './components/MathFormulaBlock';
import {
  Search,
  Bell,
  ChevronDown,
  Play,
  BookOpen,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Sparkles,
  SlidersHorizontal,
  RefreshCw,
  Check,
  FileText,
  GraduationCap,
  ExternalLink,
  AlertCircle,
  X,
  Github,
} from 'lucide-react';

type NavSection = 'discover' | 'repositories' | 'library' | 'notes';

const STORAGE_KEYS = {
  NOTES: 'orbit_v1_saved_notes',
  MASTERY: 'orbit_v1_mastery_records',
  BOOKMARKS: 'orbit_v1_bookmarks',
  WATCHLISTS: 'orbit_v1_watchlists',
  LIVE_DISCOVERIES: 'orbit_v2_live_discoveries',
  SCROLL_POSITIONS: 'orbit_v1_scroll_positions',
  LANG: 'orbit_v1_lang',
  DIFF: 'orbit_v1_difficulty',
};

// Sanitize & deduplicate any list of DiscoveryItems across pages and providers using DOI, arXiv ID, PMID, canonical ID, and normalized title
function sanitizeAndDedupeDiscoveries(items: DiscoveryItem[]): DiscoveryItem[] {
  const seenIds = new Set<string>();
  const seenCanonical = new Set<string>();
  const seenDois = new Set<string>();
  const seenArxiv = new Set<string>();
  const seenPmids = new Set<string>();
  const seenNormTitles = new Set<string>();
  const out: DiscoveryItem[] = [];

  for (let i = 0; i < items.length; i++) {
    const raw = items[i];
    if (!raw || !raw.title) continue;

    let safeId = String(raw.id || '').trim();
    const canonical = String(raw.canonicalId || raw.sourceUrl || raw.title || `item-${i}`).trim();
    const doiKey = raw.doi ? raw.doi.toLowerCase().trim() : '';
    const arxivKey = raw.arxivId ? raw.arxivId.toLowerCase().replace(/v\d+$/i, '').trim() : '';
    const pmidKey = raw.pmid ? String(raw.pmid).trim() : '';
    const normTitleKey = raw.title
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 90);

    // Fix any legacy colliding base64 prefix key 'oa-aHR0cHM6Ly9k'
    if (!safeId || safeId === 'oa-aHR0cHM6Ly9k' || seenIds.has(safeId)) {
      const slug = canonical
        .replace(/^https?:\/\/(doi\.org\/|openalex\.org\/|arxiv\.org\/abs\/)?/i, '')
        .replace(/[^a-zA-Z0-9_-]/g, '-');
      safeId = `paper-${slug || i}`;
    }

    if (
      seenIds.has(safeId) ||
      seenCanonical.has(canonical.toLowerCase()) ||
      (doiKey && seenDois.has(doiKey)) ||
      (arxivKey && seenArxiv.has(arxivKey)) ||
      (pmidKey && seenPmids.has(pmidKey)) ||
      (normTitleKey.length >= 24 && seenNormTitles.has(normTitleKey))
    ) {
      continue;
    }

    seenIds.add(safeId);
    seenCanonical.add(canonical.toLowerCase());
    if (doiKey) seenDois.add(doiKey);
    if (arxivKey) seenArxiv.add(arxivKey);
    if (pmidKey) seenPmids.add(pmidKey);
    if (normTitleKey.length >= 24) seenNormTitles.add(normTitleKey);

    out.push({
      ...raw,
      id: safeId,
      canonicalId: canonical,
    });
  }

  return out;
}

// Default exemplary study note so "My Notes" is immediately useful on first visit
const DEFAULT_SEED_NOTE: StructuredNote = {
  id: 'note-disc-quantum-surface-code',
  discoveryId: 'disc-quantum-surface-code',
  discoveryTitle: SEED_DISCOVERIES[0].title,
  sourceUrl: SEED_DISCOVERIES[0].sourceUrl,
  status: 'approved_saved',
  language: 'en',
  executiveSummary: SEED_DISCOVERIES[0].readerLayers.quickOrientation,
  whyItMatters: SEED_DISCOVERIES[0].oneSentenceWhyItMatters,
  prerequisites: [...SEED_DISCOVERIES[0].readerLayers.prerequisites],
  coreConceptsAndDefinitions: [
    {
      term: 'Surface Code Lattice',
      definition:
        'A two-dimensional grid of physical superconducting qubits where data qubits store quantum states and stabilizer qubits detect bit-flip (X) and phase-flip (Z) syndromes without collapsing the logical state.',
    },
    {
      term: 'Fault-Tolerant Threshold (p < p_th)',
      definition:
        'The critical physical gate error rate (~1%) below which adding more physical qubits (increasing code distance d) exponentially suppresses logical errors instead of amplifying noise.',
    },
  ],
  mechanismSteps: [...SEED_DISCOVERIES[0].readerLayers.coreMechanism],
  methodsAndEvidence: `${SEED_DISCOVERIES[0].readerLayers.methodsAndEvidence}\n\nKey Findings: ${SEED_DISCOVERIES[0].readerLayers.findings}`,
  equations: [...SEED_DISCOVERIES[0].equations],
  limitationsAndCritique: `${SEED_DISCOVERIES[0].readerLayers.limitationsAndUncertainty}\n\nFalsifiability: ${SEED_DISCOVERIES[0].readerLayers.criticalAnalysisAndFalsifiability}`,
  examRevisionSheet: [
    'Below the fault-tolerant threshold (p < p_th), each increase in surface code distance d from 3 to 5 to 7 cuts the logical error rate by more than half (Λ = 2.14 ± 0.02).',
    'Stabilizer ancilla qubits measure parity checks rather than reading data qubits directly, preserving quantum superposition.',
    'Real-time correlated syndrome decoding must finish within the 1.1 microsecond superconducting cycle window.',
  ],
  userPersonalAnnotations:
    'Key takeaway for quantum computing architecture: hardware scale only helps once physical two-qubit gate fidelity crosses the ~99% fault-tolerance threshold.',
  tags: ['Quantum & Physics', 'Peer-Reviewed', 'Study Note'],
  flashcards: [
    {
      id: 'fc-seed-1',
      front: 'Why does logical error decrease exponentially with code distance d only when p < p_th?',
      back: 'Because the scaling ratio (p / p_th) is < 1; raising a fraction < 1 to power (d+1)/2 drives logical error toward zero.',
    },
    {
      id: 'fc-seed-2',
      front: 'How do stabilizer qubits detect errors without destroying the quantum state?',
      back: 'They measure multi-qubit X and Z parities (syndromes) rather than measuring individual data qubit states.',
    },
  ],
  citations: [...SEED_DISCOVERIES[0].readerLayers.references],
  createdAt: '2025-02-15T10:00:00.000Z',
  approvedAt: '2025-02-15T10:05:00.000Z',
  updatedAt: '2025-02-15T10:05:00.000Z',
};

export default function App() {
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const [activeSection, setActiveSection] = useState<NavSection>(() => {
    const params = new URLSearchParams(window.location.search);
    const sec = params.get('section');
    if (sec === 'library' || sec === 'notes' || sec === 'discover') return sec;
    if (sec === 'repositories' || sec === 'github') return 'repositories';
    return 'discover';
  });
  const [librarySubTab, setLibrarySubTab] = useState<
    'saved_papers' | 'learning_path' | 'watched_topics' | 'open_source' | 'trends'
  >('saved_papers');

  const [discoveries, setDiscoveries] = useState<DiscoveryItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.LIVE_DISCOVERIES);
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return sanitizeAndDedupeDiscoveries([...parsed, ...SEED_DISCOVERIES]);
      }
    } catch {
      // fallback to seed
    }
    return sanitizeAndDedupeDiscoveries(SEED_DISCOVERIES);
  });

  const [heroIndex, setHeroIndex] = useState<number>(0);
  const [sidebarSort, setSidebarSort] = useState<'Today' | 'High Evidence'>('Today');

  // Search, Category & Progressive-Disclosure Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState<string>('all');
  const [externalRepoSearchRequest, setExternalRepoSearchRequest] = useState<{
    query: string;
    paperTitle?: string;
    isVerifiedCompanion?: boolean;
    timestamp: number;
  } | null>(null);
  const [isSearchingLive, setIsSearchingLive] = useState(false);
  const [isLoadingMorePapers, setIsLoadingMorePapers] = useState(false);
  const [liveSearchPage, setLiveSearchPage] = useState<number>(1);
  const [hasMoreLivePapers, setHasMoreLivePapers] = useState<boolean>(true);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [liveSearchSourceSummary, setLiveSearchSourceSummary] = useState<string | null>(null);
  const [providerReports, setProviderReports] = useState<ProviderStatusReport[]>([]);
  const [duplicatesMergedCount, setDuplicatesMergedCount] = useState<number>(0);
  const [selectedProviders, setSelectedProviders] = useState<ResearchProviderId[]>([]);
  const [yearFilter, setYearFilter] = useState<'all' | '2025-2026' | '2024-2026' | '2020-2026'>('all');
  const [initialInspectRepo, setInitialInspectRepo] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [domainFilter, setDomainFilter] = useState<string>('All');
  const [evidenceFilter, setEvidenceFilter] = useState<string>('All');
  const [fullTextOnly, setFullTextOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'relevance' | 'newest' | 'citations' | 'peer_reviewed'>('relevance');
  const [visibleCount, setVisibleCount] = useState<number>(10);
  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);

  // User Learning & Personalization State
  const [language, setLanguage] = useState<ExplanationLanguage>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LANG);
    return saved === 'hinglish' ? 'hinglish' : 'en';
  });
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DIFF);
    return (saved as DifficultyLevel) || 'mixed';
  });

  const [savedNotes, setSavedNotes] = useState<StructuredNote[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.NOTES);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : [DEFAULT_SEED_NOTE];
    } catch {
      return [DEFAULT_SEED_NOTE];
    }
  });
  const [selectedNoteIdForView, setSelectedNoteIdForView] = useState<string | null>(null);

  const [masteryRecords, setMasteryRecords] = useState<MasteryRecord[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.MASTERY);
      const parsed = raw ? JSON.parse(raw) : INITIAL_MASTERY_RECORDS;
      // Deduplicate by discoveryId
      const seen = new Set<string>();
      return (Array.isArray(parsed) ? parsed : INITIAL_MASTERY_RECORDS).filter((r: MasteryRecord) => {
        if (!r?.discoveryId || seen.has(r.discoveryId)) return false;
        seen.add(r.discoveryId);
        return true;
      });
    } catch {
      return INITIAL_MASTERY_RECORDS;
    }
  });

  const [readingScrollPositions, setReadingScrollPositions] = useState<Record<string, number>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SCROLL_POSITIONS);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
      const parsed = raw ? JSON.parse(raw) : ['disc-quantum-surface-code', 'disc-gods-eye-view'];
      return Array.from(new Set(Array.isArray(parsed) ? parsed : []));
    } catch {
      return ['disc-quantum-surface-code', 'disc-gods-eye-view'];
    }
  });

  const [watchlists, setWatchlists] = useState<WatchlistItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.WATCHLISTS);
      return raw ? JSON.parse(raw) : INITIAL_WATCHLISTS;
    } catch {
      return INITIAL_WATCHLISTS;
    }
  });

  const [knowledgeEdges] = useState<KnowledgeEdge[]>(INITIAL_KNOWLEDGE_EDGES);

  // Active Workspace Modal State (hydrated from ?paper= query param when available)
  const [activeWorkspaceItem, setActiveWorkspaceItem] = useState<DiscoveryItem | null>(() => {
    const params = new URLSearchParams(window.location.search);
    const paperParam = params.get('paper')?.trim();
    if (!paperParam) return null;
    return (
      discoveries.find(
        (d) =>
          d.id === paperParam ||
          d.canonicalId.toLowerCase() === paperParam.toLowerCase() ||
          (d.doi && d.doi.toLowerCase() === paperParam.toLowerCase())
      ) || null
    );
  });
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<
    'reader' | 'professor' | 'visual' | 'notes' | 'quiz'
  >('reader');
  const [isResolvingUrlPaper, setIsResolvingUrlPaper] = useState<boolean>(() => {
    const params = new URLSearchParams(window.location.search);
    const paperParam = params.get('paper')?.trim();
    if (!paperParam) return false;
    const foundLocally = discoveries.some(
      (d) =>
        d.id === paperParam ||
        d.canonicalId.toLowerCase() === paperParam.toLowerCase() ||
        (d.doi && d.doi.toLowerCase() === paperParam.toLowerCase())
    );
    return !foundLocally;
  });
  const [urlPaperError, setUrlPaperError] = useState<{
    paperId: string;
    message: string;
  } | null>(null);

  // Top-right dropdowns & Persistent Professor Agent trigger
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [professorOpenRequest, setProfessorOpenRequest] = useState<{
    open: boolean;
    initialPrompt?: string;
    timestamp: number;
  } | null>(null);
  const [globalSelectedText, setGlobalSelectedText] = useState<string>('');
  const [quotaStatus, setQuotaStatus] = useState<QuotaStatus | null>(null);

  // Cmd/Ctrl + K shortcut to focus search & global text selection capture for Professor
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    const onSelectionChange = () => {
      const sel = window.getSelection();
      const text = sel ? sel.toString().trim() : '';
      if (text.length >= 4 && text.length <= 900) {
        setGlobalSelectedText(text);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('mouseup', onSelectionChange);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('mouseup', onSelectionChange);
    };
  }, []);

  // Resolve ?paper= query param from live multi-source backend if not in local discoveries, and support browser Back/Forward (popstate)
  const resolveOrOpenPaperById = async (
    paperIdOrQuery: string,
    fallbackTitle?: string,
    tab: 'reader' | 'professor' | 'visual' | 'notes' | 'quiz' = 'reader'
  ) => {
    const cleanId = paperIdOrQuery.trim();
    if (!cleanId) return;
    const localMatch = discoveries.find(
      (d) =>
        d.id === cleanId ||
        d.canonicalId.toLowerCase() === cleanId.toLowerCase() ||
        (d.doi && d.doi.toLowerCase() === cleanId.toLowerCase()) ||
        (fallbackTitle && d.title.toLowerCase() === fallbackTitle.toLowerCase())
    );
    if (localMatch) {
      setUrlPaperError(null);
      setIsResolvingUrlPaper(false);
      openWorkspace(localMatch, tab);
      return;
    }

    setIsResolvingUrlPaper(true);
    setUrlPaperError(null);
    try {
      const qs = new URLSearchParams({ id: cleanId });
      if (fallbackTitle) qs.set('title', fallbackTitle);
      const res = await fetch(`/api/research/paper-detail?${qs.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data?.item) {
          setDiscoveries((prev) => sanitizeAndDedupeDiscoveries([data.item, ...prev]));
          setActiveWorkspaceItem(data.item);
          setActiveWorkspaceTab(tab);
          setIsResolvingUrlPaper(false);
          return;
        }
      }
      setUrlPaperError({
        paperId: cleanId,
        message: `No verified scholarly record matched identifier "${cleanId}". Check the paper ID, DOI, or arXiv identifier, or search across our 10 connected research indices.`,
      });
    } catch {
      setUrlPaperError({
        paperId: cleanId,
        message: `Network error while resolving paper "${cleanId}". Please retry or search for the paper title.`,
      });
    } finally {
      setIsResolvingUrlPaper(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialPaperId = params.get('paper')?.trim();
    if (initialPaperId && !activeWorkspaceItem) {
      resolveOrOpenPaperById(initialPaperId);
    }

    const onPopState = () => {
      const popParams = new URLSearchParams(window.location.search);
      const sec = popParams.get('section');
      if (sec === 'library' || sec === 'notes' || sec === 'discover') {
        setActiveSection(sec);
      } else if (sec === 'repositories' || sec === 'github') {
        setActiveSection('repositories');
      }
      const pId = popParams.get('paper')?.trim();
      if (!pId) {
        setActiveWorkspaceItem(null);
        setUrlPaperError(null);
      } else {
        resolveOrOpenPaperById(pId);
      }
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Sync URL query params with activeSection and activeWorkspaceItem
  useEffect(() => {
    if (isResolvingUrlPaper) return;
    const params = new URLSearchParams(window.location.search);
    const currentSec = params.get('section');
    const currentPaper = params.get('paper');
    params.set('section', activeSection);
    if (activeWorkspaceItem) {
      params.set('paper', activeWorkspaceItem.id);
    } else if (!urlPaperError) {
      params.delete('paper');
    }
    const nextUrl = `${window.location.pathname}?${params.toString()}`;
    if (currentPaper !== (activeWorkspaceItem?.id || null) || currentSec !== activeSection) {
      window.history.pushState({}, '', nextUrl);
    } else {
      window.history.replaceState({}, '', nextUrl);
    }
  }, [activeSection, activeWorkspaceItem, isResolvingUrlPaper, urlPaperError]);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(savedNotes));
  }, [savedNotes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MASTERY, JSON.stringify(masteryRecords));
  }, [masteryRecords]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarkedIds));
  }, [bookmarkedIds]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WATCHLISTS, JSON.stringify(watchlists));
  }, [watchlists]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SCROLL_POSITIONS, JSON.stringify(readingScrollPositions));
  }, [readingScrollPositions]);

  useEffect(() => {
    const liveOnly = discoveries.filter((d) => d.isLiveFetched).slice(0, 120);
    localStorage.setItem(STORAGE_KEYS.LIVE_DISCOVERIES, JSON.stringify(liveOnly));
  }, [discoveries]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LANG, language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DIFF, difficulty);
  }, [difficulty]);

  // Bidirectional hydration with server SQLite database on mount
  useEffect(() => {
    const syncWithServer = async () => {
      try {
        const res = await fetch('/api/library/hydrate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            notes: savedNotes,
            liveDiscoveries: discoveries.filter((d) => d.isLiveFetched),
            masteryRecords,
            watchlists,
            bookmarkedIds,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.quotaStatus) setQuotaStatus(data.quotaStatus);
          if (Array.isArray(data.notes) && data.notes.length > savedNotes.length) {
            setSavedNotes(data.notes);
          }
          if (Array.isArray(data.liveDiscoveries) && data.liveDiscoveries.length > 0) {
            setDiscoveries((prev) =>
              sanitizeAndDedupeDiscoveries([...data.liveDiscoveries, ...prev])
            );
          }
        }
      } catch {
        // LocalStorage remains active if server is restarting
      }
    };
    syncWithServer();
  }, []);

  const activeCategoryObj = useMemo(
    () => RESEARCH_CATEGORIES.find((c) => c.id === activeCategoryId && c.id !== 'all') || null,
    [activeCategoryId]
  );

  // Live Multi-Source Search Handler (10 Academic & Open-Source Research Providers) with Scalable Pagination
  const runLiveSearchQuery = async (
    rawQuery: string,
    explicitDomain?: string,
    overrideProviders?: ResearchProviderId[],
    overrideSort?: 'relevance' | 'newest' | 'citations' | 'peer_reviewed',
    overrideYearFilter?: 'all' | '2025-2026' | '2024-2026' | '2020-2026',
    pageNumber: number = 1,
    append: boolean = false
  ) => {
    const q = rawQuery.trim();
    if (!q) {
      setLiveSearchSourceSummary(null);
      setSearchError(null);
      return;
    }
    if (append) {
      setIsLoadingMorePapers(true);
    } else {
      setIsSearchingLive(true);
      setLiveSearchPage(1);
      setHasMoreLivePapers(true);
      setVisibleCount(12);
    }
    setSearchError(null);
    if (activeSection !== 'discover') {
      setActiveSection('discover');
    }
    try {
      const domainParam =
        explicitDomain ||
        (activeCategoryObj ? activeCategoryObj.domains[0] : domainFilter !== 'All' ? domainFilter : '');
      const effectiveProviders =
        overrideProviders ??
        (selectedProviders.length > 0
          ? selectedProviders
          : activeCategoryObj?.defaultProviders || []);
      const effectiveSort = overrideSort || sortBy;
      const effectiveYear = overrideYearFilter || yearFilter;

      const params = new URLSearchParams();
      params.set('q', q);
      params.set('page', String(pageNumber));
      params.set('limit', '8');
      if (domainParam) params.set('domain', domainParam);
      if (effectiveProviders.length > 0) {
        params.set('providers', effectiveProviders.join(','));
      }
      if (effectiveSort === 'newest') {
        params.set('sort', 'newest');
      } else if (effectiveSort === 'citations') {
        params.set('sort', 'citations');
      } else {
        params.set('sort', 'relevance');
      }
      if (effectiveYear === '2025-2026') {
        params.set('yearFrom', '2025');
        params.set('yearTo', '2026');
      } else if (effectiveYear === '2024-2026') {
        params.set('yearFrom', '2024');
        params.set('yearTo', '2026');
      } else if (effectiveYear === '2020-2026') {
        params.set('yearFrom', '2020');
        params.set('yearTo', '2026');
      }
      if (fullTextOnly) {
        params.set('openAccessOnly', 'true');
      }
      if (evidenceFilter === 'Peer-Reviewed') {
        params.set('type', 'peer_reviewed');
      } else if (evidenceFilter === 'Preprint / Not Yet Peer-Reviewed') {
        params.set('type', 'preprint');
      }

      const res = await fetch(`/api/discover/search?${params.toString()}`);
      const data = await res.json();
      if (res.ok && Array.isArray(data.items)) {
        if (Array.isArray(data.providerReports)) {
          setProviderReports(data.providerReports);
        }
        setDuplicatesMergedCount((prev) =>
          append ? prev + Number(data.duplicatesMerged || 0) : Number(data.duplicatesMerged || 0)
        );

        if (data.items.length > 0) {
          let addedCount = 0;
          setDiscoveries((prev) => {
            const combined = append
              ? sanitizeAndDedupeDiscoveries([...prev, ...data.items])
              : sanitizeAndDedupeDiscoveries([...data.items, ...prev]);
            addedCount = Math.max(0, combined.length - prev.length);
            return combined;
          });
          setLiveSearchPage(pageNumber);
          if (append) {
            setVisibleCount((prev) => prev + Math.max(8, data.items.length));
          }
          if (data.items.length < 3 && addedCount === 0 && append) {
            setHasMoreLivePapers(false);
          } else {
            setHasMoreLivePapers(true);
          }
          setLiveSearchSourceSummary(
            `Retrieved live literature (Page ${pageNumber}) across ${
              data.sourcesChecked?.join(', ') || 'multi-source databases'
            } for "${q}"`
          );
        } else {
          if (append) {
            setHasMoreLivePapers(false);
          } else {
            setLiveSearchSourceSummary(
              `No live external matches found in selected sources for "${q}". Showing matching local library papers.`
            );
          }
        }
      } else {
        setSearchError('Could not complete live database query. Showing local library matches.');
      }
    } catch {
      setSearchError(
        'Live research APIs are temporarily unreachable. Showing verified local papers.'
      );
    } finally {
      setIsSearchingLive(false);
      setIsLoadingMorePapers(false);
    }
  };

  const handleGlobalSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    await runLiveSearchQuery(searchQuery, undefined, undefined, undefined, undefined, 1, false);
  };

  const handleLoadNextPageOfPapers = async () => {
    if (isSearchingLive || isLoadingMorePapers) return;
    if (visibleCount < filteredDiscoveries.length) {
      setVisibleCount((prev) => prev + 10);
      if (visibleCount + 10 < filteredDiscoveries.length) {
        return;
      }
    }
    if (!hasMoreLivePapers) return;
    const nextPage = liveSearchPage + 1;
    const effectiveQuery =
      searchQuery.trim() ||
      activeCategoryObj?.liveSearchQuery ||
      (domainFilter !== 'All' ? domainFilter : 'breakthrough scientific research');
    await runLiveSearchQuery(
      effectiveQuery,
      activeCategoryObj?.domains[0] || (domainFilter !== 'All' ? domainFilter : undefined),
      selectedProviders.length > 0 ? selectedProviders : activeCategoryObj?.defaultProviders,
      sortBy,
      yearFilter,
      nextPage,
      true
    );
  };

  const handleSelectCategory = (categoryId: string) => {
    setActiveCategoryId(categoryId);
    setDomainFilter('All');
    setVisibleCount(10);
    setLiveSearchPage(1);
    setHasMoreLivePapers(true);

    if (categoryId !== 'all') {
      const catObj = RESEARCH_CATEGORIES.find((c) => c.id === categoryId);
      if (catObj && catObj.liveSearchQuery) {
        if (catObj.id === 'latest_2025_2026') {
          setYearFilter('2025-2026');
          setSortBy('newest');
          runLiveSearchQuery(
            catObj.liveSearchQuery,
            undefined,
            catObj.defaultProviders,
            'newest',
            '2025-2026',
            1,
            false
          );
          return;
        }
        const count = discoveries.filter((d) =>
          catObj.domains.includes(d.domain)
        ).length;
        if (count < 4) {
          runLiveSearchQuery(
            catObj.liveSearchQuery,
            catObj.domains[0],
            catObj.defaultProviders,
            catObj.defaultSort === 'newest'
              ? 'newest'
              : catObj.defaultSort === 'citations'
              ? 'citations'
              : 'relevance',
            undefined,
            1,
            false
          );
        }
      }
    }
  };

  const filteredDiscoveries = useMemo(() => {
    const filtered = discoveries.filter((d) => {
      if (activeCategoryObj && activeCategoryObj.id !== 'latest_2025_2026') {
        if (!activeCategoryObj.domains.includes(d.domain)) return false;
      }
      if (domainFilter !== 'All' && d.domain !== domainFilter) return false;
      if (evidenceFilter !== 'All' && d.evidenceStatus !== evidenceFilter) return false;
      if (selectedProviders.length > 0) {
        const pMatch =
          (d.primaryProvider && selectedProviders.includes(d.primaryProvider)) ||
          selectedProviders.some((pid) =>
            d.sourceName.toLowerCase().includes(pid.replace('semanticscholar', 'semantic')) ||
            (d.contributingSources || []).some((cs) =>
              cs.toLowerCase().includes(pid.replace('semanticscholar', 'semantic'))
            )
          );
        if (!pMatch) return false;
      }
      if (yearFilter !== 'all') {
        const pubYear = d.publicationYear || Number(d.publishedAt?.slice(0, 4)) || 2025;
        if (yearFilter === '2025-2026' && pubYear < 2025) return false;
        if (yearFilter === '2024-2026' && pubYear < 2024) return false;
        if (yearFilter === '2020-2026' && pubYear < 2020) return false;
      }
      if (fullTextOnly) {
        const hasFull =
          d.fullTextAvailable !== undefined
            ? d.fullTextAvailable
            : d.sourceType === 'Preprint (arXiv / bioRxiv)' ||
              d.sourceType === 'GitHub Repository' ||
              !d.isLiveFetched;
        if (!hasFull) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesText =
          d.title.toLowerCase().includes(q) ||
          d.oneSentenceWhyItMatters.toLowerCase().includes(q) ||
          d.readerLayers.quickOrientation.toLowerCase().includes(q) ||
          d.domain.toLowerCase().includes(q) ||
          d.sourceName.toLowerCase().includes(q) ||
          d.canonicalId.toLowerCase().includes(q) ||
          (d.authors || []).some((a) => a.toLowerCase().includes(q));
        return matchesText;
      }
      return true;
    });

    if (sortBy === 'newest') {
      return [...filtered].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    }
    if (sortBy === 'citations') {
      return [...filtered].sort((a, b) => (b.citationCount || 0) - (a.citationCount || 0));
    }
    if (sortBy === 'peer_reviewed') {
      return [...filtered].sort((a, b) =>
        a.evidenceStatus === 'Peer-Reviewed' && b.evidenceStatus !== 'Peer-Reviewed' ? -1 : 1
      );
    }
    return filtered;
  }, [
    discoveries,
    activeCategoryObj,
    domainFilter,
    evidenceFilter,
    selectedProviders,
    yearFilter,
    fullTextOnly,
    searchQuery,
    sortBy,
  ]);

  const featuredHeroItem = discoveries[heroIndex % discoveries.length] || SEED_DISCOVERIES[0];

  const sidebarDiscoveries = useMemo(() => {
    const list = [...discoveries];
    if (sidebarSort === 'High Evidence') {
      return list.filter((d) => d.evidenceStatus === 'Peer-Reviewed').slice(0, 3);
    }
    return list.slice(0, 3);
  }, [discoveries, sidebarSort]);

  const openWorkspace = (
    item: DiscoveryItem,
    tab: 'reader' | 'professor' | 'visual' | 'notes' | 'quiz' = 'reader'
  ) => {
    setUrlPaperError(null);
    setDiscoveries((prev) =>
      prev.some((d) => d.id === item.id)
        ? prev
        : sanitizeAndDedupeDiscoveries([item, ...prev])
    );
    setActiveWorkspaceItem(item);
    setActiveWorkspaceTab(tab);
    setMasteryRecords((prev) => {
      const exists = prev.find((r) => r.discoveryId === item.id);
      if (exists) {
        return prev.map((r) =>
          r.discoveryId === item.id
            ? {
                ...r,
                topicTitle: item.title,
                lastStudiedAt: new Date().toISOString(),
              }
            : r
        );
      }
      return [
        {
          discoveryId: item.id,
          topicTitle: item.title,
          domain: item.domain,
          progressPercent: 0,
          masteryEstimate: 30,
          quizAttempts: 0,
          lastQuizScore: 0,
          lastStudiedAt: new Date().toISOString(),
          nextReviewDueAt: new Date(Date.now() + 86400000 * 2).toISOString(),
          weakConcepts: [],
        },
        ...prev,
      ];
    });
  };

  const handleUpdateDiscoveryItem = (updatedItem: DiscoveryItem) => {
    setDiscoveries((prev) =>
      prev.map((d) => (d.id === updatedItem.id ? updatedItem : d))
    );
    setActiveWorkspaceItem((prev) =>
      prev && prev.id === updatedItem.id ? updatedItem : prev
    );
  };

  // Update reading progress & scroll position from ResearchWorkspaceModal in exact 1:1 sync
  const handleReadingProgressChange = (
    discoveryId: string,
    progressPercent: number,
    scrollTop: number
  ) => {
    setReadingScrollPositions((prev) => ({
      ...prev,
      [discoveryId]: scrollTop,
    }));
    setMasteryRecords((prev) =>
      prev.map((r) =>
        r.discoveryId === discoveryId
          ? {
              ...r,
              progressPercent: Math.max(0, Math.min(100, progressPercent)),
              lastStudiedAt: new Date().toISOString(),
            }
          : r
      )
    );
  };

  const handleSaveRepoAsDiscovery = (repo: GitHubRepoAnalysis): DiscoveryItem => {
    const existing = discoveries.find(
      (d) => d.repoAnalysis?.fullName.toLowerCase() === repo.fullName.toLowerCase()
    );
    if (existing) return existing;

    const newDisc: DiscoveryItem = {
      id: `disc-repo-${repo.fullName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      canonicalId: `github:${repo.fullName}`,
      title: `${repo.fullName} — Open-Source Architecture & Technical Study`,
      shortSubtitle: repo.whatItDoes.slice(0, 95),
      domain: 'Open-Source & DevTools',
      sourceType: 'GitHub Repository',
      sourceName: 'GitHub Public REST API',
      sourceUrl: repo.repoUrl,
      authors: [repo.fullName.split('/')[0] || 'Open-Source Maintainers'],
      publishedAt: repo.lastUpdated,
      retrievedAt: new Date().toISOString().slice(0, 10),
      evidenceStatus: 'Working Open-Source Code',
      isLiveFetched: true,
      fullTextAvailable: true,
      fullTextUrl: repo.repoUrl,
      artworkTheme: 'geospatial_splatting',
      oneSentenceWhyItMatters: repo.whatItDoes,
      signals: {
        freshness: `Updated ${repo.lastUpdated} · Release ${repo.lastReleaseTag}`,
        evidenceTier: 'Moderate (Preprint / Primary Code)',
        momentum: `${repo.stars.toLocaleString()} Stars · ${repo.forks.toLocaleString()} Forks`,
        novelty: 'Open-source engineering implementation inspected via GitHub REST API',
        learningValue: 'Practical system architecture & safe container sandboxing',
      },
      readerLayers: {
        quickOrientation: repo.whatItDoes,
        sourceAndStatus: `GitHub Repository (${repo.fullName}) · License: ${repo.license} · Primary Language: ${repo.language}`,
        beginnerExplanation: `${repo.whatItDoes} It addresses the engineering challenge: ${repo.problemSolved}`,
        beginnerExplanationHinglish: `${repo.fullName} ek open-source repository hai (${repo.language}). Yeh solve karta hai: ${repo.problemSolved}`,
        prerequisites: repo.hardwareAndPrerequisites,
        historicalFoundations:
          'Built on modern open-source modular software engineering and reproducible container workflows.',
        coreMechanism: repo.internalArchitecture,
        coreMechanismHinglish: repo.internalArchitecture,
        methodsAndEvidence: `Public source code repository with ${repo.stars} stars, ${repo.forks} forks, and ${repo.openIssues} open issues.`,
        findings: `Provides a working ${repo.language} implementation under ${repo.license} license.`,
        limitationsAndUncertainty: repo.securityAndSandboxWarnings.join(' '),
        applicationsAndImplications: repo.problemSolved,
        criticalAnalysisAndFalsifiability:
          'GitHub stars measure community attention, not cryptographic security or formal verification. Always audit dependencies in an isolated container.',
        relatedWork: repo.alternatives.map((a) => `${a.name}: ${a.comparison}`),
        whatToWatchNext: `Monitor upstream releases (${repo.lastReleaseTag}) and issue tracker.`,
        references: [
          {
            id: `ref-${Date.now()}`,
            label: `${repo.fullName} Repository`,
            authors: repo.fullName.split('/')[0] || 'Maintainers',
            venue: 'GitHub',
            year: repo.lastUpdated.slice(0, 4),
            url: repo.repoUrl,
            doiOrId: `github:${repo.fullName}`,
            statusLabel: 'Open-Source Repo',
          },
        ],
      },
      equations: [],
      visualSandboxId: 'repo_pipeline',
      repoAnalysis: repo,
      quiz: [
        {
          id: `q-repo-${Date.now()}`,
          question: `What is the safest way to evaluate ${repo.fullName} locally?`,
          options: [
            'Run install scripts directly as root on the host machine',
            'Inspect dependencies and run inside an isolated container or virtual environment',
            'Assume high GitHub star count guarantees zero vulnerabilities',
            'Skip license verification before commercial deployment',
          ],
          correctIndex: 1,
          explanationWhyRight:
            'Open-source repositories should always be evaluated inside an isolated environment or container after dependency inspection.',
          misconceptionDiagnosed: 'Confusing repository popularity with security auditing.',
        },
      ],
    };

    setDiscoveries((prev) => sanitizeAndDedupeDiscoveries([newDisc, ...prev]));
    return newDisc;
  };

  const handleApproveAndSaveNote = async (note: StructuredNote): Promise<boolean> => {
    setSavedNotes((prev) => {
      const others = prev.filter((n) => n.id !== note.id);
      return [note, ...others];
    });
    try {
      const res = await fetch('/api/notes/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note }),
      });
      return res.ok;
    } catch {
      // Mirrored in localStorage
      return true;
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    setSavedNotes((prev) => prev.filter((n) => n.id !== noteId));
    try {
      await fetch(`/api/notes/${encodeURIComponent(noteId)}`, { method: 'DELETE' });
    } catch {
      // Mirrored in localStorage
    }
  };

  const handleRecordQuizResult = async (discoveryId: string, scorePercent: number) => {
    setMasteryRecords((prev) =>
      prev.map((r) => {
        if (r.discoveryId !== discoveryId) return r;
        const blendedMastery = Math.min(
          100,
          Math.round(r.masteryEstimate * 0.35 + scorePercent * 0.65)
        );
        return {
          ...r,
          progressPercent: 100,
          masteryEstimate: blendedMastery,
          quizAttempts: r.quizAttempts + 1,
          lastQuizScore: scorePercent,
          lastStudiedAt: new Date().toISOString(),
        };
      })
    );
  };

  const handleToggleBookmark = (id: string) => {
    setBookmarkedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleAddWatch = (
    newWatch: Omit<WatchlistItem, 'id' | 'lastCheckedAt' | 'lastStatus' | 'updates'>
  ) => {
    const created: WatchlistItem = {
      ...newWatch,
      id: `watch-${Date.now()}`,
      lastCheckedAt: new Date().toISOString(),
      lastStatus: 'Nominal',
      updates: [
        {
          id: `upd-init-${Date.now()}`,
          checkedAt: new Date().toISOString(),
          whatIsNew: `Baseline snapshot recorded for "${newWatch.displayTitle}"`,
          whatChangedFromBaseline:
            'Initial watch established. Click "Check Live Upstream Now" in Followed Topics at any time to compare live API publications against this baseline.',
          sourceAndDate: `Baseline · ${new Date().toISOString().slice(0, 10)}`,
          whyItMatters: 'Prevents manual re-checking across research databases and GitHub.',
          impactOnPriorUnderstanding: 'Adds technical detail',
          remainingUncertainty: 'Awaiting next upstream publication or release cycle.',
          recommendedNextAction: 'Run a live upstream check in Followed Topics.',
          sourceUrl: 'https://openalex.org',
        },
      ],
    };
    setWatchlists((prev) => [created, ...prev]);
  };

  const handleCheckWatchNow = async (watchId: string) => {
    const target = watchlists.find((w) => w.id === watchId);
    if (!target) return;
    try {
      const res = await fetch('/api/watchtower/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType: target.targetType,
          targetQuery: target.targetQuery,
          displayTitle: target.displayTitle,
        }),
      });
      const data = await res.json();
      if (res.ok && data.diff) {
        setWatchlists((prev) =>
          prev.map((w) =>
            w.id === watchId
              ? {
                  ...w,
                  lastCheckedAt: new Date().toISOString(),
                  lastStatus: 'Update Detected',
                  updates: [data.diff, ...w.updates],
                }
              : w
          )
        );
      }
    } catch {
      // handled gracefully
    }
  };

  const handleExportLibraryJson = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      app: 'ORBIT Discovery-to-Mastery System',
      savedNotes: savedNotes.filter((n) => n.status === 'approved_saved'),
      masteryRecords,
      watchlists,
      bookmarkedIds,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orbit-learning-library-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportLibraryJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(String(ev.target?.result || '{}'));
        if (Array.isArray(parsed.savedNotes)) setSavedNotes(parsed.savedNotes);
        if (Array.isArray(parsed.masteryRecords)) setMasteryRecords(parsed.masteryRecords);
        if (Array.isArray(parsed.watchlists)) setWatchlists(parsed.watchlists);
        if (Array.isArray(parsed.bookmarkedIds)) setBookmarkedIds(parsed.bookmarkedIds);
      } catch {
        // invalid JSON ignored safely
      }
    };
    reader.readAsText(file);
  };

  const activeFilterCount =
    (activeCategoryId !== 'all' ? 1 : 0) +
    (domainFilter !== 'All' ? 1 : 0) +
    (evidenceFilter !== 'All' ? 1 : 0) +
    (yearFilter !== 'all' ? 1 : 0) +
    (selectedProviders.length > 0 ? 1 : 0) +
    (fullTextOnly ? 1 : 0) +
    (sortBy !== 'relevance' ? 1 : 0);

  const isSearchOrFilterActive =
    Boolean(searchQuery.trim()) ||
    activeFilterCount > 0 ||
    Boolean(liveSearchSourceSummary);

  const resetAllFiltersAndSearch = () => {
    setSearchQuery('');
    setActiveCategoryId('all');
    setDomainFilter('All');
    setEvidenceFilter('All');
    setSelectedProviders([]);
    setYearFilter('all');
    setFullTextOnly(false);
    setSortBy('relevance');
    setLiveSearchSourceSummary(null);
    setProviderReports([]);
    setSearchError(null);
    setLiveSearchPage(1);
    setHasMoreLivePapers(true);
    setVisibleCount(10);
  };

  // Continuous Research Discovery: IntersectionObserver automatically loads more results near bottom
  useEffect(() => {
    const el = loadMoreSentinelRef.current;
    if (!el || activeSection !== 'discover') return;
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (!first?.isIntersecting) return;
        if (isSearchingLive || isLoadingMorePapers) return;
        if (visibleCount < filteredDiscoveries.length) {
          setVisibleCount((prev) => prev + 8);
        } else if (hasMoreLivePapers && (isSearchOrFilterActive || filteredDiscoveries.length >= 6)) {
          handleLoadNextPageOfPapers();
        }
      },
      { rootMargin: '280px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [
    activeSection,
    visibleCount,
    filteredDiscoveries.length,
    isSearchingLive,
    isLoadingMorePapers,
    hasMoreLivePapers,
    isSearchOrFilterActive,
    liveSearchPage,
    searchQuery,
    activeCategoryId,
    domainFilter,
    selectedProviders,
    sortBy,
    yearFilter,
  ]);

  const approvedNotesCount = savedNotes.filter((n) => n.status === 'approved_saved').length;

  return (
    <div className="min-h-screen relative bg-[#0B0A0F] text-[#F4F3EF] flex flex-col">
      {/* Warm Atmospheric Blurred Backdrop matching the reference */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        <div className="absolute -top-24 -left-24 w-[540px] h-[540px] rounded-full bg-[#8E4A59]/25 blur-[130px]" />
        <div className="absolute top-1/4 right-0 w-[620px] h-[620px] rounded-full bg-[#D67C63]/18 blur-[150px]" />
        <div className="absolute bottom-0 left-1/3 w-[580px] h-[480px] rounded-full bg-[#3D5A80]/20 blur-[140px]" />
      </div>

      {/* Main Framed Glassmorphic Container */}
      <div className="relative z-10 w-full max-w-[1440px] mx-auto px-3 sm:px-6 py-4 sm:py-6 flex-1 flex flex-col gap-5">
        {/* TOP HORIZONTAL NAVIGATION BAR (Simple, Predictable 3-Destination Architecture) */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          {/* Upper-Left Prominent Glass Search Field */}
          <form
            onSubmit={handleGlobalSearch}
            className="w-full sm:w-80 md:w-96 lg:w-[420px] relative shrink-0"
          >
            <Search className="w-4 h-4 text-white/60 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search papers, topics, authors, or DOI (⌘K)..."
              className="w-full pl-11 pr-24 py-2.5 rounded-full orbit-glass-pill text-xs sm:text-sm text-white placeholder:text-white/55 focus:outline-none focus:border-white/35 transition-all"
            />
            {searchQuery && (
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setLiveSearchSourceSummary(null);
                    setSearchError(null);
                  }}
                  aria-label="Clear search"
                  className="p-1 text-white/50 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <button
                  type="submit"
                  disabled={isSearchingLive}
                  className="px-3 py-1 rounded-full bg-white text-[#0B0A0E] text-[11px] font-bold hover:bg-white/90 transition-colors"
                >
                  {isSearchingLive ? '...' : 'Search'}
                </button>
              </div>
            )}
          </form>

          {/* Center Simplified Primary Navigation: Discover | My Library | My Notes */}
          <nav
            aria-label="Primary navigation"
            className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-1 max-w-full"
          >
            {[
              { id: 'discover', label: 'Discover' },
              { id: 'repositories', label: 'Repositories' },
              {
                id: 'library',
                label: `My Library (${bookmarkedIds.length})`,
              },
              {
                id: 'notes',
                label: `My Notes (${approvedNotesCount})`,
              },
            ].map((nav) => {
              const isActive = activeSection === nav.id;
              return (
                <button
                  key={nav.id}
                  onClick={() => setActiveSection(nav.id as NavSection)}
                  className={`px-5 py-2 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'orbit-glass-pill-active text-white font-semibold shadow-sm'
                      : 'text-white/70 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  {nav.label}
                </button>
              );
            })}
          </nav>

          {/* Right Professor Agent Trigger, Notification Bell & Profile / Learning Preferences Pill */}
          <div className="flex items-center gap-2.5 shrink-0 relative">
            <button
              onClick={() => {
                setProfessorOpenRequest({
                  open: true,
                  timestamp: Date.now(),
                });
                setShowNotifDropdown(false);
                setShowProfileDropdown(false);
              }}
              aria-label="Open ORBIT Professor AI Agent"
              className="px-3.5 py-2 rounded-full orbit-glass-pill text-xs font-semibold text-emerald-300 hover:text-white hover:bg-white/20 transition-all inline-flex items-center gap-1.5"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Professor AI</span>
            </button>

            <button
              onClick={() => {
                setShowNotifDropdown((prev) => !prev);
                setShowProfileDropdown(false);
              }}
              aria-label="Followed topic updates"
              className="w-10 h-10 rounded-full orbit-glass-pill flex items-center justify-center text-white/85 hover:text-white hover:bg-white/20 transition-colors relative"
            >
              <Bell className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                setShowProfileDropdown((prev) => !prev);
                setShowNotifDropdown(false);
              }}
              className="pl-2 pr-3.5 py-1.5 rounded-full orbit-glass-pill flex items-center gap-2.5 hover:bg-white/15 transition-colors text-left"
            >
              <div className="w-7 h-7 rounded-full bg-white/90 text-[#0B0A0E] flex items-center justify-center text-xs font-bold">
                OS
              </div>
              <div className="hidden md:block leading-tight">
                <div className="text-xs font-semibold text-white">ORBIT Scholar</div>
                <div className="text-[10px] text-white/55">
                  {language === 'hinglish' ? 'Hinglish' : 'English'} · {difficulty}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-white/60" />
            </button>

            {/* Followed Topics Alerts Dropdown */}
            {showNotifDropdown && (
              <div className="absolute right-0 top-12 w-80 orbit-glass-panel rounded-2xl p-4 z-40 space-y-3 border border-white/15">
                <div className="flex items-center justify-between text-xs font-semibold text-white">
                  <span>Followed Topic Updates</span>
                  <button
                    onClick={() => {
                      setShowNotifDropdown(false);
                      setLibrarySubTab('watched_topics');
                      setActiveSection('library');
                    }}
                    className="text-emerald-300 hover:underline text-[11px]"
                  >
                    Open Library
                  </button>
                </div>
                {watchlists.slice(0, 2).map((w) => (
                  <div
                    key={w.id}
                    className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs space-y-1"
                  >
                    <div className="font-medium text-white truncate">{w.displayTitle}</div>
                    <div className="text-white/65 line-clamp-2">
                      {w.updates[0]?.whatIsNew || 'Monitoring active.'}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Reading & Explanation Preferences Dropdown */}
            {showProfileDropdown && (
              <div className="absolute right-0 top-12 w-80 orbit-glass-panel rounded-2xl p-4 z-40 space-y-4 border border-white/15 text-xs">
                <div>
                  <span className="font-semibold text-white block">
                    Reading &amp; Explanation Preferences
                  </span>
                  <p className="text-white/60 mt-0.5">
                    Choose your default explanation language and depth when asking the Adaptive Professor.
                  </p>
                </div>

                <div className="space-y-2">
                  <span className="text-white/75 block font-medium">Explanation Language</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => setLanguage('en')}
                      className={`py-1.5 rounded-lg border ${
                        language === 'en'
                          ? 'bg-white text-[#0B0A0E] border-white font-semibold'
                          : 'bg-white/5 text-white/70 border-white/10'
                      }`}
                    >
                      English
                    </button>
                    <button
                      onClick={() => setLanguage('hinglish')}
                      className={`py-1.5 rounded-lg border ${
                        language === 'hinglish'
                          ? 'bg-white text-[#0B0A0E] border-white font-semibold'
                          : 'bg-white/5 text-white/70 border-white/10'
                      }`}
                    >
                      Hinglish
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-white/75 block font-medium">Explanation Depth</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['beginner', 'mixed', 'advanced'] as DifficultyLevel[]).map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => setDifficulty(lvl)}
                        className={`py-1.5 rounded-lg border capitalize ${
                          difficulty === lvl
                            ? 'bg-emerald-400 text-[#0B0A0E] border-emerald-400 font-semibold'
                            : 'bg-white/5 text-white/70 border-white/10'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* DESTINATION 1: DISCOVER (Preserves the Editorial Glassmorphic Homepage + Search-Led Paper Results) */}
        {activeSection === 'discover' && (
          <div className="space-y-8 flex-1">
            {/* PRESERVED HOMEPAGE 2-COLUMN SHOWCASE */}
            {!isSearchOrFilterActive && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                {/* NARROW LEFT SIDEBAR (3 cols on 12-col grid) */}
                <aside className="lg:col-span-3 flex flex-col gap-5">
                  {/* Top Left Card: New Discoveries */}
                  <div className="orbit-glass-panel rounded-[28px] p-4 flex flex-col gap-3.5">
                    <div className="flex items-center justify-between px-1">
                      <h2 className="text-sm font-bold text-white tracking-tight">
                        New Discoveries
                      </h2>
                      <button
                        onClick={() =>
                          setSidebarSort((prev) =>
                            prev === 'Today' ? 'High Evidence' : 'Today'
                          )
                        }
                        className="text-[11px] text-white/60 hover:text-white transition-colors"
                      >
                        Sort by <strong className="text-white font-semibold">{sidebarSort}</strong>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {sidebarDiscoveries.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => openWorkspace(item, 'reader')}
                          className="group relative h-32 rounded-[20px] overflow-hidden cursor-pointer border border-white/10"
                        >
                          <EditorialArtwork
                            theme={item.artworkTheme}
                            variant="thumb"
                            className="w-full h-full transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
                          <div className="absolute bottom-3 left-3.5 right-3.5 flex items-end justify-between gap-2">
                            <div>
                              <span className="text-[10px] text-emerald-300 font-mono block">
                                {item.domain} · {item.evidenceStatus}
                              </span>
                              <h3 className="text-xs font-semibold text-white leading-snug line-clamp-2 mt-0.5">
                                {item.title}
                              </h3>
                            </div>
                            <button
                              aria-label={`Read ${item.title}`}
                              className="w-7 h-7 rounded-full bg-white/25 backdrop-blur-md border border-white/30 flex items-center justify-center text-white group-hover:bg-white group-hover:text-[#0B0A0E] transition-colors shrink-0"
                            >
                              <Play className="w-3 h-3 fill-current ml-0.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bottom Left Card: Continue Progress */}
                  <div className="orbit-glass-panel rounded-[28px] p-4 flex-1 flex flex-col justify-between gap-3">
                    <div className="flex items-center justify-between px-1">
                      <h2 className="text-sm font-bold text-white tracking-tight">
                        Continue Progress
                      </h2>
                      <button
                        onClick={() => {
                          setLibrarySubTab('saved_papers');
                          setActiveSection('library');
                        }}
                        className="text-[11px] text-white/55 hover:text-white"
                      >
                        My Library
                      </button>
                    </div>

                    <div className="space-y-2.5 my-auto">
                      {masteryRecords.slice(0, 4).map((rec) => {
                        const linked = discoveries.find((d) => d.id === rec.discoveryId);
                        return (
                          <div
                            key={rec.discoveryId}
                            onClick={() => {
                              if (linked) {
                                openWorkspace(linked, 'reader');
                              } else {
                                resolveOrOpenPaperById(rec.discoveryId, rec.topicTitle, 'reader');
                              }
                            }}
                            className="group flex items-center justify-between gap-3 p-2 rounded-2xl hover:bg-white/[0.06] transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-white/15">
                                <EditorialArtwork
                                  theme={linked?.artworkTheme || 'scholarly_paper'}
                                  variant="thumb"
                                  className="w-full h-full"
                                />
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-xs font-semibold text-white truncate">
                                  {linked?.title || rec.topicTitle}
                                </h4>
                                <span className="text-[11px] text-white/50 font-mono block">
                                  Read {rec.progressPercent}%
                                </span>
                              </div>
                            </div>

                            <button
                              aria-label={`Resume ${rec.topicTitle}`}
                              className="w-7 h-7 rounded-full bg-white/10 group-hover:bg-white group-hover:text-[#0B0A0E] text-white/80 flex items-center justify-center transition-colors shrink-0"
                            >
                              <Play className="w-3 h-3 fill-current ml-0.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </aside>

                {/* RIGHT MAIN STAGE: Featured Hero + Horizontal "You might like" Discovery Row (9 cols) */}
                <main className="lg:col-span-9 flex flex-col justify-between gap-5">
                  {/* FEATURED HERO PANEL */}
                  <div className="relative rounded-[28px] overflow-hidden border border-white/12 min-h-[360px] sm:min-h-[395px] flex flex-col justify-between p-6 sm:p-8 shadow-2xl">
                    <EditorialArtwork
                      theme={featuredHeroItem.artworkTheme}
                      variant="hero"
                      className="absolute inset-0 w-full h-full"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#09080E] via-[#09080E]/55 to-black/15" />

                    {/* Top Status Badge */}
                    <div className="relative z-10 flex items-center justify-between gap-4">
                      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full orbit-glass-pill text-xs font-medium text-white">
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>Featured Paper · {featuredHeroItem.evidenceStatus}</span>
                      </div>

                      <span className="text-xs font-mono text-white/75 hidden sm:inline">
                        {featuredHeroItem.sourceName} · {featuredHeroItem.publishedAt}
                      </span>
                    </div>

                    {/* Middle/Bottom Editorial Content & Action Controls */}
                    <div className="relative z-10 space-y-5 mt-auto pt-12">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-white/85">
                        <span className="px-3 py-1 rounded-full orbit-glass-pill">
                          {featuredHeroItem.domain}
                        </span>
                        <span className="px-3 py-1 rounded-full orbit-glass-pill">
                          {featuredHeroItem.authors.slice(0, 2).join(', ')}
                        </span>
                      </div>

                      <div className="max-w-2xl space-y-2">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight">
                          {featuredHeroItem.title}
                        </h1>
                        <p className="text-xs sm:text-sm text-white/80 leading-relaxed line-clamp-2">
                          {featuredHeroItem.oneSentenceWhyItMatters}
                        </p>
                      </div>

                      {/* Hero Bottom Controls */}
                      <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            onClick={() => openWorkspace(featuredHeroItem, 'reader')}
                            className="px-6 py-3 rounded-full bg-white text-[#0B0A0E] text-xs sm:text-sm font-bold hover:bg-white/90 transition-all inline-flex items-center gap-2 shadow-lg whitespace-nowrap"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Read Paper</span>
                          </button>

                          <button
                            onClick={() => openWorkspace(featuredHeroItem, 'professor')}
                            className="px-5 py-3 rounded-full orbit-glass-pill hover:bg-white/20 text-white text-xs sm:text-sm font-medium transition-all inline-flex items-center gap-2 whitespace-nowrap"
                          >
                            <GraduationCap className="w-3.5 h-3.5" />
                            <span>Explain Paper</span>
                          </button>

                          <button
                            onClick={() => handleToggleBookmark(featuredHeroItem.id)}
                            aria-label="Save featured paper"
                            className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${
                              bookmarkedIds.includes(featuredHeroItem.id)
                                ? 'bg-white text-[#0B0A0E]'
                                : 'orbit-glass-pill text-white hover:bg-white/20'
                            }`}
                          >
                            {bookmarkedIds.includes(featuredHeroItem.id) ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Bookmark className="w-4 h-4" />
                            )}
                          </button>
                        </div>

                        {/* Functional Hero Carousel Controls */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              setHeroIndex(
                                (prev) => (prev - 1 + discoveries.length) % discoveries.length
                              )
                            }
                            aria-label="Previous featured discovery"
                            className="w-10 h-10 rounded-full orbit-glass-pill hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              setHeroIndex((prev) => (prev + 1) % discoveries.length)
                            }
                            aria-label="Next featured discovery"
                            className="w-10 h-10 rounded-full orbit-glass-pill hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* HORIZONTAL DISCOVERY ROW BELOW HERO ("You might like") */}
                  <div className="space-y-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                      <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                        You might like
                      </h2>
                      <div className="flex items-center gap-2">
                        <a
                          href="#research-paper-results"
                          className="px-3 py-1 rounded-full orbit-glass-pill text-xs text-white/80 hover:text-white transition-colors"
                        >
                          Research Categories ↓
                        </a>
                        <a
                          href="#github-repositories-section"
                          className="px-3 py-1 rounded-full orbit-glass-pill text-xs text-emerald-300 hover:text-white transition-colors inline-flex items-center gap-1.5"
                        >
                          <Github className="w-3.5 h-3.5" />
                          <span>GitHub Repositories ↓</span>
                        </a>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                      {discoveries.slice(0, 4).map((card) => (
                        <div
                          key={card.id}
                          onClick={() => openWorkspace(card, 'reader')}
                          className="group relative h-64 rounded-[24px] overflow-hidden border border-white/12 cursor-pointer flex flex-col justify-between p-4 shadow-lg"
                        >
                          <EditorialArtwork
                            theme={card.artworkTheme}
                            variant="card"
                            className="absolute inset-0 w-full h-full transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#09080E] via-[#09080E]/50 to-transparent" />

                          {/* Card Top Row */}
                          <div className="relative z-10 flex items-center justify-between">
                            <span className="px-2.5 py-1 rounded-full orbit-glass-pill text-[10px] font-mono text-white/90">
                              {card.evidenceStatus === 'Peer-Reviewed'
                                ? '● Peer-Reviewed'
                                : card.sourceType === 'GitHub Repository'
                                ? '◆ GitHub Repo'
                                : '▲ Preprint'}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openWorkspace(card, 'notes');
                              }}
                              title="Create study notes"
                              className="w-7 h-7 rounded-full orbit-glass-pill flex items-center justify-center text-white/80 hover:text-white"
                            >
                              <MoreHorizontal className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Card Bottom Lockup */}
                          <div className="relative z-10 flex items-end justify-between gap-2.5 mt-auto">
                            <div className="min-w-0">
                              <span className="text-[11px] text-white/70 block truncate">
                                {card.domain}
                              </span>
                              <h3 className="text-sm font-bold text-white leading-snug line-clamp-2 mt-0.5">
                                {card.title}
                              </h3>
                              <p className="text-[11px] text-white/65 line-clamp-2 mt-1 leading-relaxed">
                                {card.shortSubtitle}
                              </p>
                            </div>

                            <button
                              aria-label={`Read ${card.title}`}
                              className="w-10 h-10 rounded-full bg-white text-[#0B0A0E] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform shrink-0"
                            >
                              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </main>
              </div>
            )}

            {/* 1. HOMEPAGE: COMPACT SEARCH, GLOBAL FILTER & SORT SYSTEM & CONTINUOUS PAPER DISCOVERY */}
            <section id="research-paper-results" className="space-y-4 pt-1">
              <div className="orbit-glass-panel rounded-[26px] p-5 sm:p-6 space-y-4 relative">
                {/* Compact Header + Essential Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="inline-flex items-center gap-2 text-[11px] font-mono text-emerald-300 uppercase tracking-wider mb-0.5">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Multi-Source Literature Discovery · 10 Live Academic Indices</span>
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                      Explore &amp; Search Research Literature
                    </h2>
                  </div>

                  {/* Compact Action Controls: Quick GitHub Jump + Compact Filters & Sort Trigger */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveSection('repositories')}
                      className="px-3.5 py-2 rounded-full orbit-glass-pill text-xs font-medium text-white/85 hover:text-white transition-colors inline-flex items-center gap-1.5"
                    >
                      <Github className="w-3.5 h-3.5 text-emerald-300" />
                      <span className="hidden sm:inline">Repositories</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowFilters((prev) => !prev)}
                      aria-expanded={showFilters}
                      className={`px-4 py-2 rounded-full text-xs font-semibold transition-all inline-flex items-center gap-2 ${
                        showFilters || activeFilterCount > 0
                          ? 'bg-white text-[#0B0A0E] shadow-md'
                          : 'orbit-glass-pill text-white/90 hover:text-white'
                      }`}
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span>Filters &amp; Sort</span>
                      {activeFilterCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-emerald-500 text-[#0B0A0E] text-[10px] font-mono font-bold">
                          {activeFilterCount}
                        </span>
                      )}
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform ${
                          showFilters ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Primary Research Search Box */}
                <form onSubmit={handleGlobalSearch} className="flex flex-col sm:flex-row gap-2.5">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-white/50 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search topics, titles, authors, DOI, or arXiv ID across 10 research databases..."
                      className="w-full pl-11 pr-9 py-2.5 rounded-2xl bg-black/45 border border-white/15 text-xs sm:text-sm text-white placeholder:text-white/45 focus:outline-none focus:border-white/40"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        aria-label="Clear search query"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/45 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={isSearchingLive}
                    className="px-5 py-2.5 rounded-2xl bg-white text-[#0B0A0E] text-xs sm:text-sm font-bold hover:bg-white/90 transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 shadow-md"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSearchingLive ? 'animate-spin' : ''}`} />
                    <span>{isSearchingLive ? 'Searching...' : 'Search Papers'}</span>
                  </button>
                </form>

                {/* Essential Active-Filter Indicators (Removable Chips Only When Useful) */}
                {(activeFilterCount > 0 || Boolean(searchQuery.trim())) && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-xs">
                    <span className="text-[11px] font-mono text-white/50 mr-1">Active:</span>

                    {searchQuery.trim() && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-white text-[11px]">
                        <span>Query: &ldquo;{searchQuery.trim()}&rdquo;</span>
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="text-white/60 hover:text-white"
                          aria-label="Remove query filter"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}

                    {activeCategoryObj && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-[11px] font-medium">
                        <span>Category: {activeCategoryObj.shortLabel}</span>
                        <button
                          type="button"
                          onClick={() => handleSelectCategory('all')}
                          className="text-emerald-200/70 hover:text-white"
                          aria-label="Remove category filter"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}

                    {domainFilter !== 'All' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-[11px] font-medium">
                        <span>Field: {domainFilter}</span>
                        <button
                          type="button"
                          onClick={() => setDomainFilter('All')}
                          className="text-emerald-200/70 hover:text-white"
                          aria-label="Remove field filter"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}

                    {yearFilter !== 'all' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-200 text-[11px] font-mono">
                        <span>Years: {yearFilter}</span>
                        <button
                          type="button"
                          onClick={() => setYearFilter('all')}
                          className="text-sky-200/70 hover:text-white"
                          aria-label="Remove year filter"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}

                    {evidenceFilter !== 'All' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-200 text-[11px]">
                        <span>Type: {evidenceFilter}</span>
                        <button
                          type="button"
                          onClick={() => setEvidenceFilter('All')}
                          className="text-amber-200/70 hover:text-white"
                          aria-label="Remove publication type filter"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}

                    {fullTextOnly && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-[11px]">
                        <span>Open Access / Full Text Only</span>
                        <button
                          type="button"
                          onClick={() => setFullTextOnly(false)}
                          className="text-emerald-200/70 hover:text-white"
                          aria-label="Remove open access filter"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}

                    {selectedProviders.length > 0 && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-200 text-[11px] font-mono">
                        <span>
                          Sources ({selectedProviders.length}): {selectedProviders.join(', ')}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedProviders([])}
                          className="text-violet-200/70 hover:text-white"
                          aria-label="Reset sources filter"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}

                    {sortBy !== 'relevance' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-white/90 text-[11px]">
                        <span>Sort: {sortBy.replace('_', ' ')}</span>
                        <button
                          type="button"
                          onClick={() => setSortBy('relevance')}
                          className="text-white/60 hover:text-white"
                          aria-label="Reset sort order"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={resetAllFiltersAndSearch}
                      className="px-2.5 py-1 rounded-full text-[11px] font-semibold text-rose-300 hover:text-white hover:bg-rose-500/20 transition-colors ml-1"
                    >
                      Clear all
                    </button>
                  </div>
                )}

                {/* COMPACT GLOBAL FILTERS & SORT POPOVER / MOBILE BOTTOM SHEET */}
                {showFilters && (
                  <>
                    {/* Mobile Backdrop */}
                    <div
                      className="fixed inset-0 z-40 bg-black/65 backdrop-blur-xs sm:hidden"
                      onClick={() => setShowFilters(false)}
                      aria-hidden="true"
                    />
                    <div
                      role="dialog"
                      aria-label="Filters and Sort Options"
                      className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-[#13111C] border-t border-white/20 p-5 space-y-5 shadow-2xl sm:static sm:z-20 sm:max-h-none sm:rounded-2xl sm:bg-black/55 sm:border sm:border-white/15 sm:p-5 sm:shadow-xl animate-fade-in"
                    >
                      <div className="flex items-center justify-between border-b border-white/10 pb-3">
                        <div className="flex items-center gap-2">
                          <SlidersHorizontal className="w-4 h-4 text-emerald-300" />
                          <h3 className="text-sm font-bold text-white">
                            Filters &amp; Sort ({activeFilterCount} active)
                          </h3>
                        </div>
                        <div className="flex items-center gap-2">
                          {activeFilterCount > 0 && (
                            <button
                              type="button"
                              onClick={resetAllFiltersAndSearch}
                              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-[11px] font-medium text-rose-300"
                            >
                              Reset All
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setShowFilters(false)}
                            className="p-1 rounded-lg text-white/60 hover:text-white"
                            aria-label="Close filters"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* 1. Subject / Research Category */}
                      <div className="space-y-2 text-xs">
                        <label className="text-white/65 font-semibold uppercase tracking-wider font-mono text-[10px] block">
                          1. Subject / Research Category
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleSelectCategory('all')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                              activeCategoryId === 'all'
                                ? 'bg-white text-[#0B0A0E] font-bold'
                                : 'bg-white/[0.05] text-white/75 hover:text-white border border-white/10'
                            }`}
                          >
                            All Disciplines ({discoveries.length})
                          </button>
                          {RESEARCH_CATEGORIES.filter((c) => c.id !== 'all').map((cat) => {
                            const isSelected = activeCategoryId === cat.id;
                            return (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => handleSelectCategory(cat.id)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                                  isSelected
                                    ? 'bg-emerald-400 text-[#0B0A0E] font-bold'
                                    : 'bg-white/[0.05] text-white/75 hover:text-white border border-white/10'
                                }`}
                              >
                                {cat.shortLabel}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* 2. Field, Publication Date, Publication Type & Sorting */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-2 border-t border-white/10">
                        <div>
                          <label className="text-white/60 font-mono text-[10px] uppercase tracking-wider block mb-1">
                            Specific Domain
                          </label>
                          <select
                            value={domainFilter}
                            onChange={(e) => {
                              setDomainFilter(e.target.value);
                              setActiveCategoryId('all');
                            }}
                            className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white focus:outline-none"
                          >
                            <option value="All">All Fields</option>
                            <option value="AI & Computing">AI &amp; Machine Learning</option>
                            <option value="Quantum & Physics">Physics &amp; Quantum</option>
                            <option value="Biomedicine & Genomics">Medicine &amp; Biomedical</option>
                            <option value="Civil & Computer Engineering">
                              Civil &amp; Computer Engineering
                            </option>
                            <option value="Political Science">Political Science</option>
                            <option value="Economics">Economics &amp; Finance</option>
                            <option value="Social Sciences">Social Sciences</option>
                            <option value="Space & Astronomy">Space &amp; Astronomy</option>
                            <option value="Clean Tech & Public Service">
                              Climate &amp; Clean Tech
                            </option>
                            <option value="Mathematics">Mathematics</option>
                            <option value="Startups & Policy">Policy &amp; Governance</option>
                            <option value="Open-Source & DevTools">Open-Source &amp; DevTools</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-white/60 font-mono text-[10px] uppercase tracking-wider block mb-1">
                            Publication Date
                          </label>
                          <select
                            value={yearFilter}
                            onChange={(e) =>
                              setYearFilter(
                                e.target.value as 'all' | '2025-2026' | '2024-2026' | '2020-2026'
                              )
                            }
                            className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white focus:outline-none"
                          >
                            <option value="all">All Publication Years</option>
                            <option value="2025-2026">2025–2026 (Latest Research)</option>
                            <option value="2024-2026">2024–2026 (Last 2 Years)</option>
                            <option value="2020-2026">2020–2026 (Since 2020)</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-white/60 font-mono text-[10px] uppercase tracking-wider block mb-1">
                            Publication Type
                          </label>
                          <select
                            value={evidenceFilter}
                            onChange={(e) => setEvidenceFilter(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white focus:outline-none"
                          >
                            <option value="All">All Publication Types</option>
                            <option value="Peer-Reviewed">Peer-Reviewed Journals Only</option>
                            <option value="Preprint / Not Yet Peer-Reviewed">
                              Preprints &amp; Working Papers (arXiv / SSRN / RePEc)
                            </option>
                            <option value="Working Open-Source Code">Open-Source Repositories</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-white/60 font-mono text-[10px] uppercase tracking-wider block mb-1">
                            Sort Results By
                          </label>
                          <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white focus:outline-none"
                          >
                            <option value="relevance">Relevance</option>
                            <option value="newest">Newest Publication Date</option>
                            <option value="citations">Most Cited</option>
                            <option value="peer_reviewed">Peer-Reviewed First</option>
                          </select>
                        </div>
                      </div>

                      {/* 3. Research Sources / Databases & Access Type */}
                      <div className="space-y-2.5 pt-2 border-t border-white/10 text-xs">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <label className="text-white/65 font-semibold uppercase tracking-wider font-mono text-[10px]">
                            3. Research Sources &amp; Access Type
                          </label>
                          <label className="inline-flex items-center gap-2 cursor-pointer text-emerald-300 font-medium">
                            <input
                              type="checkbox"
                              checked={fullTextOnly}
                              onChange={(e) => setFullTextOnly(e.target.checked)}
                              className="rounded accent-emerald-400"
                            />
                            <span>Open Access / Full Text PDF Only</span>
                          </label>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedProviders([])}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                              selectedProviders.length === 0
                                ? 'bg-white text-[#0B0A0E] font-bold'
                                : 'bg-white/[0.05] text-white/75 hover:text-white border border-white/10'
                            }`}
                          >
                            All 10 Sources
                          </button>
                          {(
                            [
                              { id: 'openalex', label: 'OpenAlex' },
                              { id: 'semanticscholar', label: 'Semantic Scholar' },
                              { id: 'arxiv', label: 'arXiv' },
                              { id: 'europepmc', label: 'Europe PMC' },
                              { id: 'pubmed', label: 'PubMed / NCBI' },
                              { id: 'doaj', label: 'DOAJ' },
                              { id: 'core', label: 'CORE' },
                              { id: 'repec', label: 'RePEc / IDEAS' },
                              { id: 'ssrn', label: 'SSRN' },
                              { id: 'paperswithcode', label: 'Papers with Code' },
                            ] as Array<{ id: ResearchProviderId; label: string }>
                          ).map((prov) => {
                            const active = selectedProviders.includes(prov.id);
                            return (
                              <button
                                key={prov.id}
                                type="button"
                                onClick={() => {
                                  const next = active
                                    ? selectedProviders.filter((p) => p !== prov.id)
                                    : [...selectedProviders, prov.id];
                                  setSelectedProviders(next);
                                }}
                                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                                  active
                                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200 font-semibold'
                                    : 'bg-white/[0.04] border-white/10 text-white/75 hover:text-white'
                                }`}
                              >
                                {prov.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Popover / Sheet Footer Actions */}
                      <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                        <span className="text-[11px] font-mono text-white/60">
                          {filteredDiscoveries.length} matching papers in local &amp; live buffer
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={resetAllFiltersAndSearch}
                            className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition-colors"
                          >
                            Clear All
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowFilters(false);
                              const qToRun =
                                searchQuery.trim() ||
                                activeCategoryObj?.liveSearchQuery ||
                                (domainFilter !== 'All' ? domainFilter : '');
                              if (
                                qToRun ||
                                selectedProviders.length > 0 ||
                                yearFilter !== 'all' ||
                                fullTextOnly
                              ) {
                                runLiveSearchQuery(
                                  qToRun || 'breakthrough scientific research',
                                  activeCategoryObj?.domains[0] ||
                                    (domainFilter !== 'All' ? domainFilter : undefined),
                                  selectedProviders.length > 0 ? selectedProviders : undefined,
                                  sortBy,
                                  yearFilter,
                                  1,
                                  false
                                );
                              }
                            }}
                            className="px-5 py-2 rounded-full bg-emerald-400 text-[#0B0A0E] text-xs font-bold hover:bg-emerald-300 transition-colors shadow-md"
                          >
                            Apply &amp; Update Results
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Live Multi-Provider Search Status & Provider Diagnostics Banner */}
                {liveSearchSourceSummary && (
                  <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 space-y-2 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-emerald-200">
                      <span className="font-medium">{liveSearchSourceSummary}</span>
                      <span className="text-white/70 font-mono text-[11px]">
                        Showing {Math.min(visibleCount, filteredDiscoveries.length)} of{' '}
                        {filteredDiscoveries.length} loaded papers
                        {duplicatesMergedCount > 0
                          ? ` · ${duplicatesMergedCount} duplicates merged`
                          : ''}
                      </span>
                    </div>

                    {providerReports.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-emerald-500/15">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-white/45 mr-1">
                          Sources:
                        </span>
                        {providerReports.map((rep) => (
                          <span
                            key={rep.providerId}
                            title={rep.message || `${rep.endpointUsed} (${rep.latencyMs}ms)`}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-mono inline-flex items-center gap-1 ${
                              rep.status === 'ok' && rep.count > 0
                                ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30'
                                : rep.status === 'rate_limited' || rep.status === 'requires_key'
                                ? 'bg-amber-500/15 text-amber-200 border border-amber-500/25'
                                : 'bg-white/[0.05] text-white/50 border border-white/10'
                            }`}
                          >
                            <span>{rep.providerName}:</span>
                            <strong>
                              {rep.status === 'ok'
                                ? `${rep.count}`
                                : rep.status === 'rate_limited'
                                ? 'rate-limited'
                                : rep.status === 'requires_key'
                                ? 'optional key'
                                : '0'}
                            </strong>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {searchError && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between gap-3 text-xs text-amber-200">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{searchError}</span>
                    </div>
                    <button
                      onClick={() => runLiveSearchQuery(searchQuery)}
                      className="px-3 py-1 rounded-lg bg-white/15 text-white hover:bg-white/25 font-medium shrink-0"
                    >
                      Retry
                    </button>
                  </div>
                )}
              </div>

              {/* SCAN-FRIENDLY, TRUSTWORTHY PAPER RESULTS LIST */}
              {isSearchingLive && filteredDiscoveries.length === 0 ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((skeletonIdx) => (
                    <div
                      key={skeletonIdx}
                      className="orbit-glass-panel rounded-[24px] p-6 border border-white/10 animate-pulse space-y-3"
                    >
                      <div className="h-4 w-1/3 bg-white/10 rounded" />
                      <div className="h-6 w-3/4 bg-white/15 rounded" />
                      <div className="h-4 w-full bg-white/10 rounded" />
                      <div className="h-4 w-5/6 bg-white/10 rounded" />
                    </div>
                  ))}
                </div>
              ) : filteredDiscoveries.length === 0 ? (
                <div className="orbit-glass-panel rounded-[26px] p-8 text-center space-y-3">
                  <p className="text-base font-bold text-white">
                    No papers in local buffer match your current filter
                  </p>
                  <p className="text-xs text-white/65 max-w-md mx-auto">
                    Query live across our 10 connected research databases for this topic or clear your active filters.
                  </p>
                  <div className="flex flex-wrap justify-center gap-3 pt-2">
                    <button
                      onClick={() =>
                        runLiveSearchQuery(
                          searchQuery.trim() ||
                            activeCategoryObj?.liveSearchQuery ||
                            (domainFilter !== 'All' ? domainFilter : 'breakthrough scientific research'),
                          activeCategoryObj?.domains[0] ||
                            (domainFilter !== 'All' ? domainFilter : undefined)
                        )
                      }
                      className="px-5 py-2 rounded-full bg-emerald-400 text-[#0B0A0E] text-xs font-bold"
                    >
                      Search Live Across 10 Research Databases
                    </button>
                    <button
                      onClick={resetAllFiltersAndSearch}
                      className="px-5 py-2 rounded-full orbit-glass-pill text-xs text-white"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {filteredDiscoveries.slice(0, visibleCount).map((paper) => {
                    const isBookmarked = bookmarkedIds.includes(paper.id);
                    const hasFullText =
                      paper.fullTextAvailable !== undefined
                        ? paper.fullTextAvailable
                        : paper.sourceType === 'Preprint (arXiv / bioRxiv)' ||
                          paper.sourceType === 'GitHub Repository' ||
                          !paper.isLiveFetched;

                    return (
                      <article
                        key={paper.id}
                        className="orbit-glass-panel rounded-[24px] p-5 sm:p-6 border border-white/10 hover:border-white/20 transition-all space-y-3"
                      >
                        {/* Top Metadata Row: Content Type, Evidence Status, Source, Date, Category, Full-Text Indicator */}
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`px-2.5 py-0.5 rounded-full font-medium ${
                                paper.evidenceStatus === 'Peer-Reviewed'
                                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                  : paper.sourceType === 'GitHub Repository'
                                  ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                                  : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                              }`}
                            >
                              {paper.evidenceStatus}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/10 text-white/75 text-[11px]">
                              {paper.sourceType}
                            </span>
                            <span className="text-white/80 font-medium">{paper.sourceName}</span>
                            <span className="text-white/40">·</span>
                            <span className="text-white/65">{paper.publishedAt}</span>
                            <span className="text-white/40">·</span>
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-200 text-[11px]">
                              {paper.domain}
                            </span>
                            {typeof paper.citationCount === 'number' && paper.citationCount > 0 && (
                              <span className="px-2 py-0.5 rounded-full bg-white/[0.05] text-[11px] font-mono text-white/75">
                                {paper.citationCount.toLocaleString()} citations
                              </span>
                            )}
                            {paper.contributingSources && paper.contributingSources.length > 1 && (
                              <span className="px-2 py-0.5 rounded-full bg-violet-500/15 border border-violet-500/30 text-[10px] font-mono text-violet-200">
                                Verified across {paper.contributingSources.join(' + ')}
                              </span>
                            )}
                          </div>

                          <span
                            className={`text-[11px] font-mono ${
                              hasFullText ? 'text-emerald-300' : 'text-white/55'
                            }`}
                          >
                            {hasFullText
                              ? '● Full Text / Open Access Available'
                              : '○ Verified Abstract + Publisher Link'}
                          </span>
                        </div>

                        {/* Paper Title & Authors */}
                        <div className="space-y-1">
                          <h3
                            onClick={() => openWorkspace(paper, 'reader')}
                            className="text-lg sm:text-xl font-bold text-white hover:text-emerald-200 cursor-pointer leading-snug"
                          >
                            {paper.title}
                          </h3>
                          <div className="text-xs text-white/65 flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span>
                              <span className="text-white/45">Authors: </span>
                              {paper.authors && paper.authors.length > 0
                                ? paper.authors.join(', ')
                                : 'Authors listed on primary source'}
                            </span>
                            {paper.doi && (
                              <span className="font-mono text-[11px] text-white/45">
                                DOI: {paper.doi}
                              </span>
                            )}
                            {paper.arxivId && (
                              <span className="font-mono text-[11px] text-amber-300/80">
                                arXiv:{paper.arxivId}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Readable Abstract / Summary with Inline LaTeX Support */}
                        <div className="text-sm text-[#E4E2DC] leading-relaxed line-clamp-3 max-w-[85ch]">
                          <LatexTextRenderer text={paper.readerLayers.quickOrientation} />
                        </div>

                        {/* Action Bar: Read Paper | Explain | Create Notes | Save | Original Source */}
                        <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              onClick={() => openWorkspace(paper, 'reader')}
                              className="px-4 py-2 rounded-full bg-white text-[#0B0A0E] text-xs font-bold hover:bg-white/90 transition-colors inline-flex items-center gap-1.5 shadow-sm"
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                              <span>Read Paper</span>
                            </button>

                            <button
                              onClick={() => openWorkspace(paper, 'professor')}
                              className="px-3.5 py-2 rounded-full orbit-glass-pill text-xs font-medium text-white hover:bg-white/20 transition-colors inline-flex items-center gap-1.5"
                            >
                              <GraduationCap className="w-3.5 h-3.5 text-emerald-300" />
                              <span>Explain</span>
                            </button>

                            <button
                              onClick={() => openWorkspace(paper, 'notes')}
                              className="px-3.5 py-2 rounded-full orbit-glass-pill text-xs font-medium text-white hover:bg-white/20 transition-colors inline-flex items-center gap-1.5"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Create Notes</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setExternalRepoSearchRequest({
                                  query:
                                    paper.relatedRepoQuery ||
                                    paper.repoAnalysis?.fullName ||
                                    paper.domain.split('&')[0].trim(),
                                  paperTitle: paper.title,
                                  isVerifiedCompanion: Boolean(paper.repoAnalysis),
                                  timestamp: Date.now(),
                                });
                                document
                                  .getElementById('github-repositories-section')
                                  ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                              }}
                              className="px-3.5 py-2 rounded-full orbit-glass-pill text-xs font-medium text-white/80 hover:text-white transition-colors inline-flex items-center gap-1.5"
                              title="Explore related open-source implementations in the GitHub Repositories section below"
                            >
                              <Github className="w-3.5 h-3.5 text-sky-300" />
                              <span className="hidden sm:inline">Related Code</span>
                            </button>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleBookmark(paper.id)}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors inline-flex items-center gap-1.5 ${
                                isBookmarked
                                  ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/35'
                                  : 'orbit-glass-pill text-white/80 hover:text-white'
                              }`}
                            >
                              {isBookmarked ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                                  <span>Saved</span>
                                </>
                              ) : (
                                <>
                                  <Bookmark className="w-3.5 h-3.5" />
                                  <span>Save</span>
                                </>
                              )}
                            </button>

                            <a
                              href={paper.fullTextUrl || paper.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 rounded-full orbit-glass-pill text-xs font-mono text-white/80 hover:text-white inline-flex items-center gap-1"
                            >
                              <span>Source</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      </article>
                    );
                  })}

                  {/* Continuous Research Loading Sentinel & Incremental Pagination Control */}
                  <div
                    ref={loadMoreSentinelRef}
                    className="pt-3 pb-1 flex flex-col items-center justify-center gap-2.5 text-center"
                  >
                    {isLoadingMorePapers ? (
                      <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full orbit-glass-pill text-xs text-emerald-300 font-medium">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>
                          Loading Page {liveSearchPage + 1} across connected research databases...
                        </span>
                      </div>
                    ) : filteredDiscoveries.length > visibleCount || hasMoreLivePapers ? (
                      <button
                        type="button"
                        onClick={handleLoadNextPageOfPapers}
                        className="px-6 py-2.5 rounded-full orbit-glass-pill text-xs font-semibold text-white hover:bg-white/20 transition-colors inline-flex items-center gap-2"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-emerald-300" />
                        <span>
                          {filteredDiscoveries.length > visibleCount
                            ? `Show More Papers (${
                                filteredDiscoveries.length - visibleCount
                              } buffered · or scroll to auto-load)`
                            : `Load More Live Papers (Page ${liveSearchPage + 1} across 10 Databases)`}
                        </span>
                      </button>
                    ) : (
                      <div className="text-[11px] font-mono text-white/45 py-2">
                        End of current multi-source result stream ({filteredDiscoveries.length} unique papers loaded).
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>

            {/* 2. HOMEPAGE: DEDICATED GITHUB REPOSITORIES DISCOVERY SECTION */}
            <HomepageGitHubSection
              discoveries={discoveries}
              bookmarkedIds={bookmarkedIds}
              externalRepoSearchRequest={externalRepoSearchRequest}
              onToggleBookmark={handleToggleBookmark}
              onSaveRepoAsDiscovery={handleSaveRepoAsDiscovery}
              onOpenWorkspace={(item, tab) => openWorkspace(item, tab || 'reader')}
              onAskProfessorAboutRepo={(repo, prompt) => {
                handleSaveRepoAsDiscovery(repo);
                setProfessorOpenRequest({
                  open: true,
                  initialPrompt: prompt,
                  timestamp: Date.now(),
                });
              }}
              onAddWatch={handleAddWatch}
              onExploreAllRepositories={() => setActiveSection('repositories')}
            />
          </div>
        )}

        {/* DESTINATION: REPOSITORY EXPLORER ROUTE */}
        {activeSection === 'repositories' && (
          <GitHubExplorerView
            discoveries={discoveries}
            bookmarkedIds={bookmarkedIds}
            onToggleBookmark={handleToggleBookmark}
            onOpenWorkspace={(item, tab) => openWorkspace(item, tab || 'reader')}
            onSaveRepoAsDiscovery={handleSaveRepoAsDiscovery}
            onAskProfessorAboutRepo={(repo, prompt) => {
              handleSaveRepoAsDiscovery(repo);
              setProfessorOpenRequest({
                open: true,
                initialPrompt: prompt,
                timestamp: Date.now(),
              });
            }}
            onAddWatch={handleAddWatch}
            onBackToDiscover={() => setActiveSection('discover')}
            initialInspectRepo={initialInspectRepo}
          />
        )}

        {/* DESTINATION 2: MY LIBRARY (Saved Papers, Reading Progress, D3 Concept Map, Followed Topics & Open-Source Tools) */}
        {activeSection === 'library' && (
          <MyLearningView
            savedNotes={savedNotes}
            masteryRecords={masteryRecords}
            knowledgeEdges={knowledgeEdges}
            bookmarkedIds={bookmarkedIds}
            discoveries={discoveries}
            watchlists={watchlists}
            telegramConfigured={!!quotaStatus?.telegramConfigured}
            initialSubTab={librarySubTab}
            onToggleBookmark={handleToggleBookmark}
            onExportLibraryJson={handleExportLibraryJson}
            onImportLibraryJson={handleImportLibraryJson}
            onOpenDiscovery={(item, tab) => openWorkspace(item, tab || 'reader')}
            onAddWatch={handleAddWatch}
            onToggleWatch={(id) =>
              setWatchlists((prev) =>
                prev.map((w) => (w.id === id ? { ...w, active: !w.active } : w))
              )
            }
            onDeleteWatch={(id) => setWatchlists((prev) => prev.filter((w) => w.id !== id))}
            onCheckWatchNow={handleCheckWatchNow}
            onSaveRepoAsDiscovery={handleSaveRepoAsDiscovery}
          />
        )}

        {/* DESTINATION 3: MY NOTES (Calm, Continuous Vertical-Scrolling Study Document Workspace) */}
        {activeSection === 'notes' && (
          <NotesDocumentView
            savedNotes={savedNotes}
            discoveries={discoveries}
            initialSelectedNoteId={selectedNoteIdForView}
            onSaveOrUpdateNote={handleApproveAndSaveNote}
            onDeleteNote={handleDeleteNote}
            onOpenDiscovery={(item, tab) => openWorkspace(item, tab || 'reader')}
          />
        )}
      </div>

      {/* URL PAPER RESOLUTION / UNKNOWN PAPER ID ERROR STATE */}
      {(isResolvingUrlPaper || urlPaperError) && !activeWorkspaceItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-lg w-full orbit-glass-panel rounded-3xl p-6 sm:p-8 border border-white/15 space-y-4 text-center">
            {isResolvingUrlPaper ? (
              <>
                <RefreshCw className="w-8 h-8 text-emerald-300 animate-spin mx-auto" />
                <h3 className="text-lg font-bold text-white">
                  Resolving Scholarly Record Across Connected Sources...
                </h3>
                <p className="text-xs sm:text-sm text-white/70">
                  Querying OpenAlex, Semantic Scholar, arXiv, and Europe PMC to verify metadata and full-text availability.
                </p>
              </>
            ) : (
              urlPaperError && (
                <>
                  <AlertCircle className="w-9 h-9 text-amber-400 mx-auto" />
                  <h3 className="text-lg font-bold text-white">
                    Scholarly Record Not Found ({urlPaperError.paperId})
                  </h3>
                  <p className="text-xs sm:text-sm text-white/75 leading-relaxed">
                    {urlPaperError.message}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        const q = urlPaperError.paperId.replace(/^live-[a-z0-9_]+-/i, '');
                        setUrlPaperError(null);
                        setSearchQuery(q);
                        setActiveSection('discover');
                        runLiveSearchQuery(q);
                      }}
                      className="px-4 py-2 rounded-full bg-emerald-400 text-[#0B0A0E] text-xs font-bold hover:bg-emerald-300 transition-colors"
                    >
                      Search Across 10 Providers
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUrlPaperError(null);
                        const params = new URLSearchParams(window.location.search);
                        params.delete('paper');
                        window.history.replaceState(
                          {},
                          '',
                          `${window.location.pathname}?${params.toString()}`
                        );
                      }}
                      className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors"
                    >
                      Return to Discovery Feed
                    </button>
                  </div>
                </>
              )
            )}
          </div>
        </div>
      )}

      {/* COMFORTABLE RESEARCH PAPER READER & CONTEXTUAL STUDY WORKSPACE MODAL */}
      {activeWorkspaceItem && (
        <ResearchWorkspaceModal
          key={activeWorkspaceItem.id}
          item={activeWorkspaceItem}
          initialTab={activeWorkspaceTab}
          initialScrollTop={readingScrollPositions[activeWorkspaceItem.id] ?? 0}
          initialReadingProgress={
            masteryRecords.find((r) => r.discoveryId === activeWorkspaceItem.id)
              ?.progressPercent ?? 0
          }
          existingSavedNote={savedNotes.find(
            (n) => n.discoveryId === activeWorkspaceItem.id
          )}
          language={language}
          onLanguageChange={setLanguage}
          difficulty={difficulty}
          onDifficultyChange={setDifficulty}
          onClose={() => setActiveWorkspaceItem(null)}
          onApproveAndSaveNote={handleApproveAndSaveNote}
          onRecordQuizResult={handleRecordQuizResult}
          onReadingProgressChange={handleReadingProgressChange}
          onAddWatch={handleAddWatch}
          onOpenMyNotes={(noteId) => {
            setActiveWorkspaceItem(null);
            setSelectedNoteIdForView(noteId);
            setActiveSection('notes');
          }}
          onJumpToLearningPath={() => {
            setActiveWorkspaceItem(null);
            setLibrarySubTab('learning_path');
            setActiveSection('library');
          }}
          isBookmarked={bookmarkedIds.includes(activeWorkspaceItem.id)}
          onToggleBookmark={handleToggleBookmark}
          allDiscoveries={discoveries}
          onSelectDiscovery={(paper) => {
            openWorkspace(paper, 'reader');
          }}
          onUpdateDiscoveryItem={handleUpdateDiscoveryItem}
          onTriggerGlobalSearch={(q) => {
            setActiveWorkspaceItem(null);
            setSearchQuery(q);
            runLiveSearchQuery(q);
          }}
          onOpenRepoInExplorer={(repoFullName) => {
            setActiveWorkspaceItem(null);
            setInitialInspectRepo(repoFullName);
            setActiveSection('repositories');
          }}
        />
      )}

      {/* PERSISTENT FLOATING CONTEXT-AWARE PROFESSOR AI AGENT (Ask · Explain · Do) */}
      <FloatingProfessorAgent
        routeSection={activeSection}
        librarySubTab={librarySubTab}
        isReaderModalOpen={Boolean(activeWorkspaceItem)}
        readerMode={
          activeWorkspaceTab === 'notes'
            ? 'notes'
            : activeWorkspaceTab === 'professor'
            ? 'explain'
            : 'reader'
        }
        readingProgressPercent={
          activeWorkspaceItem
            ? masteryRecords.find((r) => r.discoveryId === activeWorkspaceItem.id)
                ?.progressPercent ?? 0
            : undefined
        }
        activePaper={
          activeWorkspaceItem || (activeSection === 'discover' ? featuredHeroItem : null)
        }
        allDiscoveries={discoveries}
        activeNote={
          activeWorkspaceItem
            ? savedNotes.find((n) => n.discoveryId === activeWorkspaceItem.id) || null
            : selectedNoteIdForView
            ? savedNotes.find((n) => n.id === selectedNoteIdForView) || savedNotes[0] || null
            : savedNotes[0] || null
        }
        savedNotes={savedNotes}
        selectedText={globalSelectedText}
        onClearSelectedText={() => setGlobalSelectedText('')}
        language={language}
        onLanguageChange={setLanguage}
        difficulty={difficulty}
        onDifficultyChange={setDifficulty}
        onApproveAndSaveNote={handleApproveAndSaveNote}
        onOpenDiscovery={(item, tab) => {
          setDiscoveries((prev) => sanitizeAndDedupeDiscoveries([item, ...prev]));
          openWorkspace(item, tab || 'reader');
        }}
        onOpenMyNotes={(noteId) => {
          setActiveWorkspaceItem(null);
          if (noteId) setSelectedNoteIdForView(noteId);
          setActiveSection('notes');
        }}
        onToggleBookmark={handleToggleBookmark}
        bookmarkedIds={bookmarkedIds}
        externalOpenRequest={professorOpenRequest}
      />
    </div>
  );
}
