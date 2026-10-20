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
  QuotaStatus,
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

// Sanitize & deduplicate any list of DiscoveryItems so React never encounters duplicate keys
function sanitizeAndDedupeDiscoveries(items: DiscoveryItem[]): DiscoveryItem[] {
  const seenIds = new Set<string>();
  const seenCanonical = new Set<string>();
  const out: DiscoveryItem[] = [];

  for (let i = 0; i < items.length; i++) {
    const raw = items[i];
    if (!raw || !raw.title) continue;

    let safeId = String(raw.id || '').trim();
    const canonical = String(raw.canonicalId || raw.sourceUrl || raw.title || `item-${i}`).trim();

    // Fix any legacy colliding base64 prefix key 'oa-aHR0cHM6Ly9k'
    if (!safeId || safeId === 'oa-aHR0cHM6Ly9k' || seenIds.has(safeId)) {
      const slug = canonical
        .replace(/^https?:\/\/(doi\.org\/|openalex\.org\/|arxiv\.org\/abs\/)?/i, '')
        .replace(/[^a-zA-Z0-9_-]/g, '-');
      safeId = `paper-${slug || i}`;
    }

    if (seenIds.has(safeId) || seenCanonical.has(canonical)) {
      continue;
    }

    seenIds.add(safeId);
    seenCanonical.add(canonical);
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
  const [searchError, setSearchError] = useState<string | null>(null);
  const [liveSearchSourceSummary, setLiveSearchSourceSummary] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [domainFilter, setDomainFilter] = useState<string>('All');
  const [evidenceFilter, setEvidenceFilter] = useState<string>('All');
  const [fullTextOnly, setFullTextOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'relevance' | 'newest' | 'peer_reviewed'>('relevance');
  const [visibleCount, setVisibleCount] = useState<number>(8);

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

  // Active Workspace Modal State
  const [activeWorkspaceItem, setActiveWorkspaceItem] = useState<DiscoveryItem | null>(null);
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<
    'reader' | 'professor' | 'visual' | 'notes' | 'quiz'
  >('reader');

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

  // Sync URL query params with activeSection and activeWorkspaceItem
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set('section', activeSection);
    if (activeWorkspaceItem) {
      params.set('paper', activeWorkspaceItem.id);
    } else {
      params.delete('paper');
    }
    const nextUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', nextUrl);
  }, [activeSection, activeWorkspaceItem]);

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
    const liveOnly = discoveries.filter((d) => d.isLiveFetched).slice(0, 35);
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

  // Live Multi-Source Search Handler (OpenAlex + arXiv)
  const runLiveSearchQuery = async (rawQuery: string, explicitDomain?: string) => {
    const q = rawQuery.trim();
    if (!q) {
      setLiveSearchSourceSummary(null);
      setSearchError(null);
      return;
    }
    setIsSearchingLive(true);
    setSearchError(null);
    if (activeSection !== 'discover') {
      setActiveSection('discover');
    }
    try {
      const domainParam =
        explicitDomain ||
        (activeCategoryObj ? activeCategoryObj.domains[0] : domainFilter !== 'All' ? domainFilter : '');
      const url = `/api/discover/search?q=${encodeURIComponent(q)}${
        domainParam ? `&domain=${encodeURIComponent(domainParam)}` : ''
      }`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && Array.isArray(data.items)) {
        if (data.items.length > 0) {
          setDiscoveries((prev) => sanitizeAndDedupeDiscoveries([...data.items, ...prev]));
          setLiveSearchSourceSummary(
            `Retrieved ${data.items.length} live papers from ${
              data.sourcesChecked?.join(' & ') || 'OpenAlex & arXiv'
            } for "${q}"`
          );
        } else {
          setLiveSearchSourceSummary(
            `No live external matches found in OpenAlex/arXiv for "${q}". Showing matching local library papers.`
          );
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
    }
  };

  const handleGlobalSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    await runLiveSearchQuery(searchQuery);
  };

  const handleSelectCategory = (categoryId: string) => {
    setActiveCategoryId(categoryId);
    setDomainFilter('All');
    setVisibleCount(8);

    if (categoryId !== 'all') {
      const catObj = RESEARCH_CATEGORIES.find((c) => c.id === categoryId);
      if (catObj && catObj.liveSearchQuery) {
        const count = discoveries.filter((d) =>
          catObj.domains.includes(d.domain)
        ).length;
        if (count < 2) {
          runLiveSearchQuery(catObj.liveSearchQuery, catObj.domains[0]);
        }
      }
    }
  };

  const filteredDiscoveries = useMemo(() => {
    const filtered = discoveries.filter((d) => {
      if (activeCategoryObj) {
        if (!activeCategoryObj.domains.includes(d.domain)) return false;
      }
      if (domainFilter !== 'All' && d.domain !== domainFilter) return false;
      if (evidenceFilter !== 'All' && d.evidenceStatus !== evidenceFilter) return false;
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
    if (sortBy === 'peer_reviewed') {
      return [...filtered].sort((a, b) =>
        a.evidenceStatus === 'Peer-Reviewed' && b.evidenceStatus !== 'Peer-Reviewed' ? -1 : 1
      );
    }
    return filtered;
  }, [discoveries, activeCategoryObj, domainFilter, evidenceFilter, fullTextOnly, searchQuery, sortBy]);

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
    setActiveWorkspaceItem(item);
    setActiveWorkspaceTab(tab);
    setMasteryRecords((prev) => {
      const exists = prev.find((r) => r.discoveryId === item.id);
      if (exists) {
        return prev.map((r) =>
          r.discoveryId === item.id
            ? {
                ...r,
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

  const isSearchOrFilterActive =
    Boolean(searchQuery.trim()) ||
    domainFilter !== 'All' ||
    evidenceFilter !== 'All' ||
    fullTextOnly ||
    Boolean(liveSearchSourceSummary);

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
                        const linked =
                          discoveries.find((d) => d.id === rec.discoveryId) ||
                          SEED_DISCOVERIES[0];
                        return (
                          <div
                            key={rec.discoveryId}
                            onClick={() => openWorkspace(linked, 'reader')}
                            className="group flex items-center justify-between gap-3 p-2 rounded-2xl hover:bg-white/[0.06] transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-white/15">
                                <EditorialArtwork
                                  theme={linked.artworkTheme}
                                  variant="thumb"
                                  className="w-full h-full"
                                />
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-xs font-semibold text-white truncate">
                                  {rec.topicTitle}
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

            {/* 1. HOMEPAGE: CATEGORY-BASED RESEARCH DISCOVERY & SCAN-FRIENDLY PAPER RESULTS */}
            <section id="research-paper-results" className="space-y-5 pt-2">
              <div className="orbit-glass-panel rounded-[28px] p-6 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="inline-flex items-center gap-2 text-xs font-mono text-emerald-300 uppercase tracking-wider mb-1">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Research Discovery · Multi-Source Literature</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                      Explore Research by Category &amp; Topic
                    </h2>
                    <p className="text-xs sm:text-sm text-white/65 mt-0.5">
                      Browse verified research across key disciplines or search live across OpenAlex, Crossref, PubMed, and arXiv.
                    </p>
                  </div>

                  {/* Progressive-Disclosure Filters Toggle */}
                  <div className="flex items-center gap-2">
                    <a
                      href="#github-repositories-section"
                      className="px-3.5 py-2 rounded-full orbit-glass-pill text-xs font-medium text-white/85 hover:text-white transition-colors inline-flex items-center gap-1.5"
                    >
                      <Github className="w-3.5 h-3.5 text-emerald-300" />
                      <span className="hidden sm:inline">GitHub Explorer</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => setShowFilters((prev) => !prev)}
                      className={`px-4 py-2 rounded-full text-xs font-medium transition-colors inline-flex items-center gap-2 ${
                        showFilters
                          ? 'bg-white text-[#0B0A0E] font-semibold'
                          : 'orbit-glass-pill text-white/85 hover:text-white'
                      }`}
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span>{showFilters ? 'Hide Filters' : 'Filters & Sort'}</span>
                    </button>
                  </div>
                </div>

                {/* Primary Research Search Box */}
                <form onSubmit={handleGlobalSearch} className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-white/50 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Enter a topic, paper title, author, or DOI (e.g., 'CRISPR prime editing', 'quantum error correction', 'JWST exoplanet')..."
                      className="w-full pl-11 pr-4 py-3 rounded-2xl bg-black/45 border border-white/15 text-xs sm:text-sm text-white placeholder:text-white/45 focus:outline-none focus:border-white/40"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSearchingLive}
                    className="px-6 py-3 rounded-2xl bg-white text-[#0B0A0E] text-xs sm:text-sm font-bold hover:bg-white/90 transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 shadow-md"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSearchingLive ? 'animate-spin' : ''}`} />
                    <span>{isSearchingLive ? 'Searching Papers...' : 'Search Papers'}</span>
                  </button>
                </form>

                {/* COMPACT HORIZONTAL CATEGORY NAVIGATION BAR */}
                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/55 font-medium">
                      Research Categories (Select to filter or fetch live literature):
                    </span>
                    {activeCategoryId !== 'all' && (
                      <button
                        type="button"
                        onClick={() => handleSelectCategory('all')}
                        className="text-emerald-300 hover:underline text-[11px]"
                      >
                        Show All Categories ({discoveries.length})
                      </button>
                    )}
                  </div>

                  <div
                    role="tablist"
                    aria-label="Research discovery categories"
                    className="flex items-center gap-2 overflow-x-auto pb-1.5 no-scrollbar"
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeCategoryId === 'all'}
                      onClick={() => handleSelectCategory('all')}
                      className={`px-3.5 py-2 rounded-full text-xs font-medium transition-all whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 ${
                        activeCategoryId === 'all'
                          ? 'bg-white text-[#0B0A0E] font-bold shadow-sm'
                          : 'orbit-glass-pill text-white/80 hover:text-white hover:bg-white/15'
                      }`}
                    >
                      <span>All Research</span>
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                          activeCategoryId === 'all'
                            ? 'bg-black/15 text-[#0B0A0E]'
                            : 'bg-white/10 text-white/70'
                        }`}
                      >
                        {discoveries.length}
                      </span>
                    </button>

                    {RESEARCH_CATEGORIES.filter((c) => c.id !== 'all').map((cat) => {
                      const isSelected = activeCategoryId === cat.id;
                      const count = discoveries.filter((d) =>
                        cat.domains.includes(d.domain)
                      ).length;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          role="tab"
                          aria-selected={isSelected}
                          onClick={() => handleSelectCategory(cat.id)}
                          className={`px-3.5 py-2 rounded-full text-xs font-medium transition-all whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-emerald-400 text-[#0B0A0E] font-bold shadow-sm'
                              : 'orbit-glass-pill text-white/80 hover:text-white hover:bg-white/15'
                          }`}
                        >
                          <span>{cat.shortLabel}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                              isSelected
                                ? 'bg-black/20 text-[#0B0A0E]'
                                : 'bg-white/10 text-white/65'
                            }`}
                          >
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Active Category Context Bar with Live Source Fetch */}
                  {activeCategoryObj && (
                    <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-emerald-500/30 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="space-y-0.5">
                        <div className="font-semibold text-white flex items-center gap-2">
                          <span className="text-emerald-300">● {activeCategoryObj.label}</span>
                          <span className="text-white/50 font-mono text-[11px]">
                            ({filteredDiscoveries.length} papers shown)
                          </span>
                        </div>
                        <p className="text-white/65">{activeCategoryObj.description}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isSearchingLive}
                          onClick={() =>
                            runLiveSearchQuery(
                              activeCategoryObj.liveSearchQuery,
                              activeCategoryObj.domains[0]
                            )
                          }
                          className="px-3.5 py-1.5 rounded-full bg-white text-[#0B0A0E] font-semibold hover:bg-white/90 transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <RefreshCw
                            className={`w-3 h-3 ${isSearchingLive ? 'animate-spin' : ''}`}
                          />
                          <span>
                            {isSearchingLive
                              ? 'Fetching...'
                              : `Fetch Live ${activeCategoryObj.shortLabel} Papers`}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectCategory('all')}
                          className="px-3 py-1.5 rounded-full orbit-glass-pill text-white/75 hover:text-white"
                        >
                          Clear Category
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Helpful Search Suggestions */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-white/50">Try searching:</span>
                  {[
                    'Quantum error correction',
                    'CRISPR prime editing',
                    'FlashAttention transformer',
                    'JWST exoplanet atmosphere',
                    '3D Gaussian splatting',
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => {
                        setSearchQuery(suggestion);
                        runLiveSearchQuery(suggestion);
                      }}
                      className="px-3 py-1 rounded-full orbit-glass-pill text-white/80 hover:text-white hover:bg-white/15 transition-colors text-[11px]"
                    >
                      {suggestion}
                    </button>
                  ))}

                  {(isSearchOrFilterActive || activeCategoryId !== 'all') && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setActiveCategoryId('all');
                        setDomainFilter('All');
                        setEvidenceFilter('All');
                        setFullTextOnly(false);
                        setLiveSearchSourceSummary(null);
                        setSearchError(null);
                      }}
                      className="px-3 py-1 rounded-full bg-white/15 text-white hover:bg-white/25 transition-colors text-[11px] font-medium"
                    >
                      Reset Search &amp; Filters
                    </button>
                  )}
                </div>

                {/* Collapsible Advanced Filters (Hidden until requested) */}
                {showFilters && (
                  <div className="pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="text-white/55 block mb-1">Field / Domain</label>
                      <select
                        value={domainFilter}
                        onChange={(e) => {
                          setDomainFilter(e.target.value);
                          setActiveCategoryId('all');
                        }}
                        className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/15 text-white focus:outline-none"
                      >
                        <option value="All">All Fields</option>
                        <option value="AI & Computing">AI &amp; Machine Learning</option>
                        <option value="Quantum & Physics">Science &amp; Physics</option>
                        <option value="Biomedicine & Genomics">Medicine &amp; Biomedical</option>
                        <option value="Civil & Computer Engineering">
                          Civil &amp; Computer Engineering
                        </option>
                        <option value="Space & Astronomy">Space &amp; Astronomy</option>
                        <option value="Clean Tech & Public Service">
                          Climate &amp; Clean Tech
                        </option>
                        <option value="Mathematics">Mathematics</option>
                        <option value="Startups & Policy">Economics &amp; World Affairs</option>
                        <option value="Open-Source & DevTools">Open-Source &amp; DevTools</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-white/55 block mb-1">Publication Type</label>
                      <select
                        value={evidenceFilter}
                        onChange={(e) => setEvidenceFilter(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/15 text-white focus:outline-none"
                      >
                        <option value="All">All Publication Types</option>
                        <option value="Peer-Reviewed">Peer-Reviewed Journals Only</option>
                        <option value="Preprint / Not Yet Peer-Reviewed">
                          Preprints (arXiv / bioRxiv)
                        </option>
                        <option value="Working Open-Source Code">Open-Source Repositories</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-white/55 block mb-1">Sort Results By</label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/15 text-white focus:outline-none"
                      >
                        <option value="relevance">Relevance</option>
                        <option value="peer_reviewed">Peer-Reviewed First</option>
                        <option value="newest">Newest Publication Date</option>
                      </select>
                    </div>

                    <div className="flex items-end">
                      <label className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/15 text-white flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={fullTextOnly}
                          onChange={(e) => setFullTextOnly(e.target.checked)}
                          className="rounded accent-emerald-400"
                        />
                        <span>Full Text / Open Access Only</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Live Search Status or Error Banner */}
                {liveSearchSourceSummary && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between gap-2 text-xs text-emerald-200">
                    <span>{liveSearchSourceSummary}</span>
                    <span className="text-white/60">
                      Showing {filteredDiscoveries.length} matching papers
                    </span>
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
              {filteredDiscoveries.length === 0 ? (
                <div className="orbit-glass-panel rounded-[26px] p-10 text-center space-y-3">
                  <p className="text-base font-bold text-white">
                    No papers match your current category or filter
                  </p>
                  <p className="text-xs text-white/65 max-w-md mx-auto">
                    Fetch live results from OpenAlex and arXiv for this category or clear your active filters.
                  </p>
                  <div className="flex flex-wrap justify-center gap-3 pt-2">
                    {activeCategoryObj && (
                      <button
                        onClick={() =>
                          runLiveSearchQuery(
                            activeCategoryObj.liveSearchQuery,
                            activeCategoryObj.domains[0]
                          )
                        }
                        className="px-5 py-2 rounded-full bg-emerald-400 text-[#0B0A0E] text-xs font-bold"
                      >
                        Fetch Live {activeCategoryObj.shortLabel} Papers
                      </button>
                    )}
                    {searchQuery && (
                      <button
                        onClick={() => runLiveSearchQuery(searchQuery)}
                        className="px-5 py-2 rounded-full bg-white text-[#0B0A0E] text-xs font-bold"
                      >
                        Search Live Databases for &ldquo;{searchQuery}&rdquo;
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setActiveCategoryId('all');
                        setDomainFilter('All');
                        setEvidenceFilter('All');
                        setFullTextOnly(false);
                        setSearchQuery('');
                      }}
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
                          <div className="text-xs text-white/65">
                            <span className="text-white/45">Authors: </span>
                            {paper.authors && paper.authors.length > 0
                              ? paper.authors.join(', ')
                              : 'Authors listed on primary source'}
                          </div>
                        </div>

                        {/* Readable Abstract / Summary */}
                        <p className="text-sm text-[#E4E2DC] leading-relaxed line-clamp-3 max-w-[85ch]">
                          {paper.readerLayers.quickOrientation}
                        </p>

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

                  {/* Incremental Load More */}
                  {filteredDiscoveries.length > visibleCount && (
                    <div className="text-center pt-2">
                      <button
                        onClick={() => setVisibleCount((prev) => prev + 6)}
                        className="px-6 py-2.5 rounded-full orbit-glass-pill text-xs font-semibold text-white hover:bg-white/20 transition-colors"
                      >
                        Show More Papers ({filteredDiscoveries.length - visibleCount} remaining)
                      </button>
                    </div>
                  )}
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

      {/* COMFORTABLE RESEARCH PAPER READER & CONTEXTUAL STUDY WORKSPACE MODAL */}
      {activeWorkspaceItem && (
        <ResearchWorkspaceModal
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
            setActiveWorkspaceItem(paper);
            setActiveWorkspaceTab('reader');
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
