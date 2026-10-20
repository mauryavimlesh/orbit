import React, { useState, useEffect, useRef } from 'react';
import {
  DiscoveryItem,
  DifficultyLevel,
  ExplanationLanguage,
  HighlightColor,
  PaperAnnotation,
  ProfessorActionType,
  StructuredNote,
  WatchlistItem,
  EquationSpec,
} from '../types/orbit';
import { VisualLaboratory } from './VisualLaboratory';
import {
  ArrowLeft,
  BookOpen,
  GraduationCap,
  FileText,
  ExternalLink,
  Sparkles,
  Check,
  BellPlus,
  Bookmark,
  List,
  Sliders,
  Copy,
  Download,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  ShieldAlert,
  Quote,
  RefreshCw,
  Send,
  X,
  Highlighter,
  MessageSquare,
  Type,
  Trash2,
  Clock,
  Compass,
  ZoomIn,
  Info,
  Layers,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { MathFormulaBlock, LatexTextRenderer } from './MathFormulaBlock';
import { CitationNetworkGraph } from './CitationNetworkGraph';

interface ResearchWorkspaceModalProps {
  item: DiscoveryItem;
  initialTab?: 'reader' | 'professor' | 'visual' | 'notes' | 'quiz';
  initialScrollTop?: number;
  initialReadingProgress?: number;
  existingSavedNote?: StructuredNote;
  language: ExplanationLanguage;
  onLanguageChange: (lang: ExplanationLanguage) => void;
  difficulty: DifficultyLevel;
  onDifficultyChange: (diff: DifficultyLevel) => void;
  onClose: () => void;
  onApproveAndSaveNote: (note: StructuredNote) => Promise<boolean> | void;
  onRecordQuizResult: (discoveryId: string, scorePercent: number) => void;
  onReadingProgressChange?: (
    discoveryId: string,
    progressPercent: number,
    scrollTop: number
  ) => void;
  onAddWatch: (
    watch: Omit<WatchlistItem, 'id' | 'lastCheckedAt' | 'lastStatus' | 'updates'>
  ) => void;
  onOpenMyNotes?: (noteId: string) => void;
  onJumpToLearningPath?: () => void;
  isBookmarked: boolean;
  onToggleBookmark: (id: string) => void;
  allDiscoveries?: DiscoveryItem[];
  onSelectDiscovery?: (item: DiscoveryItem) => void;
  onUpdateDiscoveryItem?: (updatedItem: DiscoveryItem) => void;
  onFocusModeChange?: (isFocus: boolean) => void;
  onTriggerGlobalSearch?: (query: string) => void;
  onOpenRepoInExplorer?: (repoFullName: string) => void;
}

interface ExplainConversationTurn {
  id: string;
  role: 'user' | 'model';
  actionType: ProfessorActionType;
  text: string;
  selectedPassage?: string;
  analogies?: string;
  caveats?: string;
  sourceReference?: {
    label: string;
    canonicalId: string;
    url: string;
  };
  modelUsed?: string;
}

interface ActiveTermPopoverState {
  term: string;
  definition: string;
  furtherExplanation?: string;
  exampleText?: string;
  isLoadingExtra?: boolean;
}

function getGroundedTermDefinition(
  term: string,
  item: DiscoveryItem,
  language: ExplanationLanguage
): { definition: string; further: string; example: string } {
  const lower = term.toLowerCase();

  if (lower.includes('pinhole')) {
    return {
      definition:
        language === 'hinglish'
          ? 'Ek simplified camera model jo 3D points ko ek single projection point (optical center) ke zariye 2D image plane par project karta hai.'
          : 'A simplified camera model that projects 3D points onto a 2D image plane through a single projection point.',
      further:
        language === 'hinglish'
          ? `Is paper (${item.title}) mein Structure-from-Motion (COLMAP) har video frame ke liye pinhole projection model ka upyog karke focal length aur camera center estimate karta hai taaki 3D Gaussian splats sahi jagah initialize ho sakein.`
          : `In "${item.title}", Structure-from-Motion (COLMAP/GLOMAP) uses the pinhole projection geometry to relate 3D world coordinates (X, Y, Z) to 2D pixel coordinates (u, v) via the camera's focal length and optical center before initializing 3D Gaussians.`,
      example:
        language === 'hinglish'
          ? 'Example: Jab drone kisi building ke charo taraf udta hai, pinhole model batata hai ki building ki chhat ka 3D corner camera sensor ke kis exact (u, v) pixel par dikhega.'
          : 'Example: If a 3D building corner is at camera-space coordinates (X, Y, Z) with focal length f, the pinhole camera model projects it onto the 2D image plane at pixel coordinates u = f · (X / Z) + cx and v = f · (Y / Z) + cy.',
    };
  }

  if (lower.includes('intrinsic') || lower.includes('extrinsic')) {
    return {
      definition:
        'Mathematical matrices that separate a camera’s internal lens geometry (intrinsic matrix K: focal length and principal point) from its 3D position and orientation in the world (extrinsic matrix [R | t]).',
      further: `In "${item.title}", solving accurate [R | t] camera poses across frames is required before differentiable 3D Gaussian Splatting rasterization can project 3D ellipsoids onto the screen.`,
      example:
        'Example: Zooming a lens changes the intrinsic matrix K, whereas walking around an object with the camera changes the extrinsic rotation R and translation t.',
    };
  }

  if (lower.includes('structure-from-motion') || lower.includes('sfm')) {
    return {
      definition:
        'A photogrammetric technique that estimates 3D structures and camera motion trajectories from a sequence of overlapping 2D images.',
      further: `In "${item.title}", SfM matches visual features (like SIFT or SuperPoint keypoints) across video keyframes and runs bundle adjustment to produce the initial sparse 3D point cloud.`,
      example:
        'Example: Tracking the same statue corner across 40 handheld video frames allows SfM to triangulate both the statue’s 3D shape and the path of your phone.',
    };
  }

  if (lower.includes('gaussian splatting') || lower.includes('covariance')) {
    return {
      definition:
        'A real-time 3D scene representation that models geometry and appearance as millions of semi-transparent 3D Gaussian ellipsoids with view-dependent color.',
      further: `Unlike slow neural ray-marching (NeRFs), "${item.title}" projects 3D Gaussians onto 2D screen tiles using their 3D covariance matrix Σ = R S S^T R^T and alpha-blends them at 60+ FPS.`,
      example:
        'Example: A thin tree branch is represented by a stretched, narrow 3D ellipsoid oriented along the branch, while a flat wall uses wide, flat ellipsoids.',
    };
  }

  if (lower.includes('superposition') || lower.includes('decoherence')) {
    return {
      definition:
        'Superposition allows a qubit to hold a linear combination of |0⟩ and |1⟩ states, while decoherence (T1 relaxation and T2 dephasing) is the loss of that quantum state due to environmental noise.',
      further: `In "${item.title}", physical transmon qubits lose coherence within tens of microseconds, motivating surface code error correction to protect logical states over hundreds of microseconds.`,
      example:
        'Example: Thermal photons or stray magnetic fields flip a qubit’s phase (Z error) or state (X error) before a computation finishes.',
    };
  }

  if (lower.includes('parity check') || lower.includes('repetition')) {
    return {
      definition:
        'An error-detection method that checks whether an even or odd number of bits have flipped across a group of data elements without reading each element in isolation.',
      further: `In "${item.title}", surface codes generalize classical parity checks to 2D quantum lattices so errors can be localized from syndrome changes.`,
      example:
        'Example: If two qubits should have matching states, a parity check reports "same" or "different" without revealing whether both are |0⟩ or both are |1⟩.',
    };
  }

  if (lower.includes('stabilizer') || lower.includes('ancilla')) {
    return {
      definition:
        'Dedicated measurement qubits (ancillas) that extract joint X-parity and Z-parity syndromes from neighboring data qubits without collapsing the encoded logical quantum state.',
      further: `In "${item.title}", ancilla qubits are measured every 1.1 microseconds to build a 3D space-time syndrome graph for real-time decoding.`,
      example:
        'Example: A Z-stabilizer ancilla interacts with 4 surrounding data qubits and flips if one of those 4 data qubits suffered a bit-flip (X) error.',
    };
  }

  return {
    definition: `A key technical concept in "${item.title}" (${item.domain}) that underpins the paper's methodology and empirical analysis.`,
    further: `Within "${item.title}", this concept connects the foundational background to the core mechanism: ${
      item.readerLayers.coreMechanism[0] || item.readerLayers.quickOrientation
    }`,
    example: `In the context of ${item.sourceName} (${item.publishedAt}), researchers apply "${term}" when evaluating: ${item.oneSentenceWhyItMatters}`,
  };
}

export const ResearchWorkspaceModal: React.FC<ResearchWorkspaceModalProps> = ({
  item: incomingItem,
  initialTab = 'reader',
  initialScrollTop = 0,
  initialReadingProgress = 15,
  existingSavedNote,
  language,
  onLanguageChange,
  difficulty,
  onDifficultyChange,
  onClose,
  onApproveAndSaveNote,
  onRecordQuizResult,
  onReadingProgressChange,
  onAddWatch,
  onOpenMyNotes,
  isBookmarked,
  onToggleBookmark,
  allDiscoveries = [],
  onSelectDiscovery,
  onUpdateDiscoveryItem,
  onFocusModeChange,
  onTriggerGlobalSearch,
  onOpenRepoInExplorer,
}) => {
  const [enrichedItem, setEnrichedItem] = useState<DiscoveryItem>(incomingItem);
  const item = enrichedItem;
  const [enrichmentStatus, setEnrichmentStatus] = useState<'idle' | 'loading' | 'enriched' | 'error'>('idle');
  const [enrichmentSources, setEnrichmentSources] = useState<string[]>([]);
  const [showEmbeddedPdf, setShowEmbeddedPdf] = useState<boolean>(false);
  const mapInitialMode = (
    tab: 'reader' | 'professor' | 'visual' | 'notes' | 'quiz'
  ): 'reader' | 'explain' | 'notes' => {
    if (tab === 'notes') return 'notes';
    if (tab === 'professor' || tab === 'quiz') return 'explain';
    return 'reader';
  };

  const [mode, setMode] = useState<'reader' | 'explain' | 'notes'>(
    mapInitialMode(initialTab)
  );
  const [showOutline, setShowOutline] = useState(false);
  const [showInlineLab, setShowInlineLab] = useState(initialTab === 'visual');
  const [showQuickQuiz, setShowQuickQuiz] = useState(initialTab === 'quiz');
  const [showExplainSettings, setShowExplainSettings] = useState(false);
  const [watchAddedToast, setWatchAddedToast] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);

  // Priority 1: Full-Screen Distraction-Free Focus Reading Mode
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);

  const toggleFocusMode = () => {
    const currentScroll = scrollContainerRef.current?.scrollTop ?? 0;
    setIsFocusMode((prev) => {
      const next = !prev;
      if (onFocusModeChange) {
        onFocusModeChange(next);
      }
      requestAnimationFrame(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = currentScroll;
        }
      });
      return next;
    });
  };

  // Keyboard shortcut listener: Pressing Escape exits Focus Mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFocusMode) {
        toggleFocusMode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocusMode]);

  // Typography & Reading Layout state (with local persistence)
  const [fontSize, setFontSize] = useState<'compact' | 'normal' | 'large'>(() => {
    try {
      const saved = localStorage.getItem('orbit_reader_fontsize');
      return saved === 'compact' || saved === 'large' ? saved : 'normal';
    } catch {
      return 'normal';
    }
  });
  const [readingWidth, setReadingWidth] = useState<'comfortable' | 'expanded'>(() => {
    try {
      const saved = localStorage.getItem('orbit_reader_width');
      return saved === 'expanded' ? 'expanded' : 'comfortable';
    } catch {
      return 'comfortable';
    }
  });
  const [readerFontFamily, setReaderFontFamily] = useState<'sans' | 'serif'>(() => {
    try {
      const saved = localStorage.getItem('orbit_reader_fontfamily');
      return saved === 'serif' ? 'serif' : 'sans';
    } catch {
      return 'sans';
    }
  });
  const [readerLineSpacing, setReaderLineSpacing] = useState<'standard' | 'relaxed'>(() => {
    try {
      const saved = localStorage.getItem('orbit_reader_linespacing');
      return saved === 'relaxed' ? 'relaxed' : 'standard';
    } catch {
      return 'standard';
    }
  });
  const [showTypographyMenu, setShowTypographyMenu] = useState(false);

  // Sync typography preferences to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('orbit_reader_fontsize', fontSize);
      localStorage.setItem('orbit_reader_width', readingWidth);
      localStorage.setItem('orbit_reader_fontfamily', readerFontFamily);
      localStorage.setItem('orbit_reader_linespacing', readerLineSpacing);
    } catch {
      // ignore storage errors
    }
  }, [fontSize, readingWidth, readerFontFamily, readerLineSpacing]);

  // Intelligent Annotations & Highlights state (persisted to localStorage)
  const [annotations, setAnnotations] = useState<PaperAnnotation[]>(() => {
    try {
      const raw = localStorage.getItem(`orbit_annotations_${item.id}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [showAnnotationsDrawer, setShowAnnotationsDrawer] = useState(false);
  const [annotationFilterColor, setAnnotationFilterColor] = useState<string>('all');
  const [activeMarginNoteInput, setActiveMarginNoteInput] = useState<{
    text: string;
    color: HighlightColor;
    noteText: string;
  } | null>(null);

  // LaTeX & Formula Inspector state
  const [activeFormulaInspectorId, setActiveFormulaInspectorId] = useState<string | null>(null);

  // Figure & Architecture Diagram Lightbox state
  const [activeFigureLightbox, setActiveFigureLightbox] = useState<{
    title: string;
    caption: string;
    diagramType?: string;
  } | null>(null);

  // Universal Feedback Toast
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Scroll-depth Reading Progress Bar state & refs (bidirectionally synced)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const savedReaderScrollTopRef = useRef<number>(Math.max(0, initialScrollTop));
  const savedReaderProgressRef = useRef<number>(
    Math.max(0, Math.min(100, initialReadingProgress))
  );
  const isProgrammaticScrollRef = useRef<boolean>(false);
  const [readingProgress, setReadingProgress] = useState<number>(
    Math.max(0, Math.min(100, initialReadingProgress))
  );

  // Sync if incomingItem changes while modal is open & trigger multi-source deep enrichment
  const triggerDeepPaperEnrichment = async (targetPaper: DiscoveryItem) => {
    setEnrichmentStatus('loading');
    try {
      const res = await fetch('/api/research/paper-detail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paperId: targetPaper.id,
          canonicalId: targetPaper.canonicalId,
          doi: targetPaper.doi,
          arxivId: targetPaper.arxivId,
          pmid: targetPaper.pmid,
          pmcid: targetPaper.pmcid,
          title: targetPaper.title,
          existingItem: targetPaper,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.item && data.item.id === targetPaper.id) {
          setEnrichedItem(data.item);
          setEnrichmentSources(Array.isArray(data.sourcesChecked) ? data.sourcesChecked : []);
          setEnrichmentStatus('enriched');
          if (onUpdateDiscoveryItem) {
            onUpdateDiscoveryItem(data.item);
          }
          return;
        }
      }
      setEnrichmentStatus('idle');
    } catch {
      setEnrichmentStatus('error');
    }
  };

  useEffect(() => {
    setEnrichedItem(incomingItem);
    setShowEmbeddedPdf(false);
    setEnrichmentStatus('idle');
    setEnrichmentSources([]);
    savedReaderScrollTopRef.current = Math.max(0, initialScrollTop);
    savedReaderProgressRef.current = Math.max(0, Math.min(100, initialReadingProgress));
    setReadingProgress(savedReaderProgressRef.current);
    setActiveTermPopover(null);
    setInlineReaderExplanation(null);
    setExplainTurns([]);
    setActiveMarginNoteInput(null);
    setActiveFormulaInspectorId(null);
    setActiveFigureLightbox(null);
    try {
      const raw = localStorage.getItem(`orbit_annotations_${incomingItem.id}`);
      setAnnotations(raw ? JSON.parse(raw) : []);
    } catch {
      setAnnotations([]);
    }

    if (
      incomingItem.isLiveFetched ||
      incomingItem.doi ||
      incomingItem.arxivId ||
      incomingItem.pmid
    ) {
      triggerDeepPaperEnrichment(incomingItem);
    }
  }, [incomingItem.id]);

  // Restore & synchronize scroll position and readingProgress when entering/returning to reader mode
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    if (mode === 'reader') {
      const rafId = requestAnimationFrame(() => {
        const container = scrollContainerRef.current;
        if (!container) return;
        const maxScroll = Math.max(0, container.scrollHeight - container.clientHeight);
        isProgrammaticScrollRef.current = true;

        if (maxScroll <= 0) {
          container.scrollTop = 0;
          savedReaderScrollTopRef.current = 0;
          savedReaderProgressRef.current = 100;
          setReadingProgress(100);
        } else if (savedReaderScrollTopRef.current > 0) {
          const clampedTop = Math.min(maxScroll, savedReaderScrollTopRef.current);
          container.scrollTop = clampedTop;
          const syncedPct = Math.min(
            100,
            Math.max(0, Math.round((clampedTop / maxScroll) * 100))
          );
          savedReaderScrollTopRef.current = clampedTop;
          savedReaderProgressRef.current = syncedPct;
          setReadingProgress(syncedPct);
          if (onReadingProgressChange) {
            onReadingProgressChange(item.id, syncedPct, clampedTop);
          }
        } else if (savedReaderProgressRef.current > 0) {
          const derivedTop = Math.round((savedReaderProgressRef.current / 100) * maxScroll);
          container.scrollTop = derivedTop;
          savedReaderScrollTopRef.current = derivedTop;
          setReadingProgress(savedReaderProgressRef.current);
          if (onReadingProgressChange) {
            onReadingProgressChange(item.id, savedReaderProgressRef.current, derivedTop);
          }
        } else {
          container.scrollTop = 0;
          savedReaderScrollTopRef.current = 0;
          savedReaderProgressRef.current = 0;
          setReadingProgress(0);
        }

        requestAnimationFrame(() => {
          isProgrammaticScrollRef.current = false;
        });
      });
      return () => cancelAnimationFrame(rafId);
    } else {
      isProgrammaticScrollRef.current = true;
      el.scrollTop = 0;
      requestAnimationFrame(() => {
        isProgrammaticScrollRef.current = false;
      });
    }
  }, [mode, item.id]);

  const handleContainerScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isProgrammaticScrollRef.current) return;
    if (mode !== 'reader') return;

    const target = e.currentTarget;
    const maxScroll = Math.max(0, target.scrollHeight - target.clientHeight);
    if (maxScroll <= 0) {
      savedReaderScrollTopRef.current = 0;
      savedReaderProgressRef.current = 100;
      setReadingProgress(100);
      if (onReadingProgressChange) {
        onReadingProgressChange(item.id, 100, 0);
      }
      return;
    }

    const currentScrollTop = Math.max(0, target.scrollTop);
    const pct = Math.min(100, Math.max(0, Math.round((currentScrollTop / maxScroll) * 100)));

    savedReaderScrollTopRef.current = currentScrollTop;
    savedReaderProgressRef.current = pct;
    setReadingProgress(pct);

    if (onReadingProgressChange) {
      onReadingProgressChange(item.id, pct, currentScrollTop);
    }
  };

  const handleProgressBarSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetPct = Math.round(clickRatio * 100);

    if (mode !== 'reader') {
      savedReaderProgressRef.current = targetPct;
      savedReaderScrollTopRef.current = 0;
      setReadingProgress(targetPct);
      setMode('reader');
      return;
    }

    const maxScroll = Math.max(0, container.scrollHeight - container.clientHeight);
    const targetScrollTop = Math.round(clickRatio * maxScroll);
    isProgrammaticScrollRef.current = true;
    container.scrollTop = targetScrollTop;
    savedReaderScrollTopRef.current = targetScrollTop;
    savedReaderProgressRef.current = targetPct;
    setReadingProgress(targetPct);
    if (onReadingProgressChange) {
      onReadingProgressChange(item.id, targetPct, targetScrollTop);
    }
    requestAnimationFrame(() => {
      isProgrammaticScrollRef.current = false;
    });
  };

  const handleCloseWithSync = () => {
    if (onReadingProgressChange) {
      onReadingProgressChange(
        item.id,
        savedReaderProgressRef.current,
        savedReaderScrollTopRef.current
      );
    }
    onClose();
  };

  // Text selection state for contextual AI assistance in Reader mode
  const [selectedPassage, setSelectedPassage] = useState<string>('');
  const [passageAddedToast, setPassageAddedToast] = useState(false);

  // BUG 2 FIX: Contextual Term Definition Popover state (stays on Read Paper route/tab!)
  const [activeTermPopover, setActiveTermPopover] = useState<ActiveTermPopoverState | null>(
    null
  );

  // BUG 2 & 4 FIX: Inline Reader Passage/Section Explanation state (stays on Read Paper route/tab!)
  const [inlineReaderExplanation, setInlineReaderExplanation] = useState<{
    actionType: ProfessorActionType;
    label: string;
    passage: string;
    explanation: string;
    analogies?: string;
    caveats?: string;
    loading: boolean;
    error?: string | null;
  } | null>(null);

  const handleMouseUpSelection = () => {
    const sel = window.getSelection();
    const text = sel ? sel.toString().trim() : '';
    if (text.length >= 3 && text.length <= 900) {
      setSelectedPassage(text);
    }
  };

  // Estimated reading time in minutes based on reader layers word count
  const estimatedReadingTimeMinutes = Math.max(
    3,
    Math.round(
      (
        item.readerLayers.quickOrientation +
        ' ' +
        item.readerLayers.historicalFoundations +
        ' ' +
        item.readerLayers.coreMechanism.join(' ') +
        ' ' +
        item.readerLayers.methodsAndEvidence +
        ' ' +
        item.readerLayers.findings +
        ' ' +
        item.readerLayers.limitationsAndUncertainty
      ).split(/\s+/).length / 180
    )
  );

  const handleAddHighlight = (text: string, color: HighlightColor, note?: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const newAnnotation: PaperAnnotation = {
      id: `ann-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      discoveryId: item.id,
      text: trimmed,
      color,
      note: note?.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    const updated = [newAnnotation, ...annotations];
    setAnnotations(updated);
    try {
      localStorage.setItem(`orbit_annotations_${item.id}`, JSON.stringify(updated));
    } catch {
      // ignore
    }
    const colorLabel =
      color === 'emerald'
        ? 'Key Concept (Emerald)'
        : color === 'amber'
        ? 'Question (Amber)'
        : color === 'sky'
        ? 'Definition (Sky)'
        : color === 'purple'
        ? 'Mechanism (Purple)'
        : 'Critique (Rose)';
    setFeedbackToast(`Highlighted as ${colorLabel}${note ? ' with margin note' : ''}`);
    setTimeout(() => setFeedbackToast(null), 2500);
    setSelectedPassage('');
    setActiveMarginNoteInput(null);
  };

  const handleDeleteAnnotation = (id: string) => {
    const updated = annotations.filter((a) => a.id !== id);
    setAnnotations(updated);
    try {
      localStorage.setItem(`orbit_annotations_${item.id}`, JSON.stringify(updated));
    } catch {
      // ignore
    }
    setFeedbackToast('Annotation removed');
    setTimeout(() => setFeedbackToast(null), 2000);
  };

  const handleExportAllHighlightsToNotes = () => {
    if (annotations.length === 0) return;
    const formatted = annotations
      .map(
        (a, i) =>
          `[Highlight ${i + 1} - ${a.color.toUpperCase()}]: "${a.text}"${
            a.note ? `\n> Personal Margin Note: ${a.note}` : ''
          }`
      )
      .join('\n\n');

    setNoteDraft((prev) => ({
      ...prev,
      userPersonalAnnotations: prev.userPersonalAnnotations
        ? `${prev.userPersonalAnnotations}\n\n### Exported Highlights & Margin Notes (${new Date().toLocaleDateString()})\n${formatted}`
        : `### Exported Highlights & Margin Notes (${new Date().toLocaleDateString()})\n${formatted}`,
    }));
    setFeedbackToast(`Exported ${annotations.length} highlight(s) to Study Notes!`);
    setTimeout(() => setFeedbackToast(null), 3000);
  };

  const handleCopyQuoteWithCitation = (text: string) => {
    const authorsStr =
      item.authors && item.authors.length > 0
        ? item.authors.slice(0, 3).join(', ') + (item.authors.length > 3 ? ' et al.' : '')
        : item.sourceName;
    const citation = `"${text}" — ${authorsStr} (${item.publishedAt}), "${item.title}". Source: ${item.sourceUrl}`;
    navigator.clipboard.writeText(citation);
    setFeedbackToast('Copied quote with academic citation to clipboard!');
    setTimeout(() => setFeedbackToast(null), 2500);
    setSelectedPassage('');
  };

  const handleCopyFormulaLatex = (formula: string) => {
    navigator.clipboard.writeText(formula);
    setFeedbackToast(`Copied formula LaTeX to clipboard: ${formula}`);
    setTimeout(() => setFeedbackToast(null), 2500);
  };

  // Typography & Layout Helper Methods for Long-Form Reader Mode
  const getReaderParagraphClasses = () => {
    const sizeCls =
      fontSize === 'compact'
        ? 'text-[15px] sm:text-[15.5px]'
        : fontSize === 'large'
        ? 'text-[18.5px] sm:text-[19.5px]'
        : 'text-[17px] sm:text-[17.5px]';
    const fontCls = readerFontFamily === 'serif' ? 'font-serif' : 'font-sans-body';
    const leadingCls = readerLineSpacing === 'relaxed' ? 'leading-[1.96]' : 'leading-[1.82]';
    return `${sizeCls} ${fontCls} ${leadingCls} text-[#EDEBE5] font-normal tracking-[0.008em] selection:bg-emerald-500/30 selection:text-white`;
  };

  const getReaderHeadingClasses = (level: 'h2' | 'h3') => {
    const fontCls = readerFontFamily === 'serif' ? 'font-serif' : 'font-display';
    if (level === 'h2') {
      return `${fontCls} text-xl sm:text-2xl md:text-[26px] font-bold text-white tracking-tight leading-snug`;
    }
    return `${fontCls} text-base sm:text-lg font-semibold text-white tracking-tight leading-snug`;
  };

  // Close on Escape key (syncing reading progress before closing)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeTermPopover) {
          setActiveTermPopover(null);
          return;
        }
        if (isFocusMode) {
          toggleFocusMode();
          return;
        }
        handleCloseWithSync();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [item.id, onClose, activeTermPopover, isFocusMode]);

  // BUG 2 & 4 HANDLER 1: Define a Technical Term in-place (NEVER switches to Explain Paper tab!)
  const handleDefineTechnicalTerm = (
    e: React.MouseEvent,
    term: string
  ) => {
    e.stopPropagation();
    const grounded = getGroundedTermDefinition(term, item, language);
    setActiveTermPopover({
      term,
      definition: grounded.definition,
    });
  };

  const handleTermPopoverExplainFurther = async () => {
    if (!activeTermPopover) return;
    const grounded = getGroundedTermDefinition(activeTermPopover.term, item, language);
    setActiveTermPopover((prev) =>
      prev ? { ...prev, furtherExplanation: grounded.further } : null
    );
  };

  const handleTermPopoverGiveExample = async () => {
    if (!activeTermPopover) return;
    const grounded = getGroundedTermDefinition(activeTermPopover.term, item, language);
    setActiveTermPopover((prev) =>
      prev ? { ...prev, exampleText: grounded.example } : null
    );
  };

  // BUG 2 & 4 HANDLER 2: Explain or Simplify a Selected Passage or Section IN-PLACE inside Reader mode
  const handleInlineReaderAction = async (
    actionType: ProfessorActionType,
    promptText: string,
    passageText: string,
    label: string
  ) => {
    setInlineReaderExplanation({
      actionType,
      label,
      passage: passageText,
      explanation: '',
      loading: true,
      error: null,
    });

    const combinedQuestion = passageText
      ? `[Selected Source Passage: "${passageText}"]\n\nAction (${actionType} - ${label}): ${promptText}`
      : promptText;

    try {
      const res = await fetch('/api/ai/professor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: item.title,
          summary: item.readerLayers.quickOrientation,
          mechanism: item.readerLayers.coreMechanism.join(' '),
          limitations: item.readerLayers.limitationsAndUncertainty,
          question: combinedQuestion,
          difficulty,
          language,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setInlineReaderExplanation((prev) =>
          prev
            ? {
                ...prev,
                loading: false,
                error: data.error || 'Could not complete explanation request.',
              }
            : null
        );
      } else {
        setInlineReaderExplanation((prev) =>
          prev
            ? {
                ...prev,
                loading: false,
                explanation: data.explanation,
                analogies: data.analogies,
                caveats: data.caveats,
              }
            : null
        );
      }
    } catch (err: any) {
      setInlineReaderExplanation((prev) =>
        prev
          ? {
              ...prev,
              loading: false,
              error: err.message || 'Network error while requesting explanation.',
            }
          : null
      );
    }
  };

  // BUG 3 & 4 HANDLER 3: Simple, Clean Conversation State for "Explain this paper" mode
  const [explainInput, setExplainInput] = useState('');
  const [explainTurns, setExplainTurns] = useState<ExplainConversationTurn[]>([]);
  const [explainLoading, setExplainLoading] = useState(false);
  const [explainError, setExplainError] = useState<string | null>(null);
  const [lastExplainAttempt, setLastExplainAttempt] = useState<{
    question: string;
    actionType: ProfessorActionType;
    passage?: string;
  } | null>(null);
  const explainEndRef = useRef<HTMLDivElement | null>(null);

  const handleAskExplainPaper = async (
    questionText: string,
    actionType: ProfessorActionType = 'ask_question',
    passageContext?: string
  ) => {
    const q = questionText.trim();
    if (!q || explainLoading) return;

    const userTurn: ExplainConversationTurn = {
      id: `exp-usr-${Date.now()}`,
      role: 'user',
      actionType,
      text: q,
      selectedPassage: passageContext || undefined,
    };

    setExplainTurns((prev) => [...prev, userTurn]);
    setExplainInput('');
    setExplainLoading(true);
    setExplainError(null);
    setLastExplainAttempt({ question: q, actionType, passage: passageContext });

    const combinedQuestion = passageContext
      ? `[Selected Source Passage: "${passageContext}"]\n\nAction (${actionType}): ${q}`
      : q;

    try {
      const res = await fetch('/api/ai/professor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: item.title,
          summary: item.readerLayers.quickOrientation,
          mechanism: item.readerLayers.coreMechanism.join(' '),
          limitations: item.readerLayers.limitationsAndUncertainty,
          question: combinedQuestion,
          difficulty,
          language,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setExplainError(data.error || 'Could not complete explanation request.');
      } else {
        const modelTurn: ExplainConversationTurn = {
          id: `exp-mdl-${Date.now()}`,
          role: 'model',
          actionType,
          text: data.explanation,
          analogies: data.analogies,
          caveats: data.caveats,
          modelUsed: data.modelUsed,
          sourceReference: {
            label: `${item.title} (${item.sourceName}, ${item.publishedAt})`,
            canonicalId: item.canonicalId,
            url: item.fullTextUrl || item.sourceUrl,
          },
        };
        setExplainTurns((prev) => [...prev, modelTurn]);
        setTimeout(() => {
          explainEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }, 60);
      }
    } catch (err: any) {
      setExplainError(
        err.message || 'Network error while requesting explanation. Click Retry to resend.'
      );
    } finally {
      setExplainLoading(false);
    }
  };

  // Build or hydrate initial study document
  const buildInitialDraft = (): StructuredNote => {
    if (existingSavedNote) {
      return { ...existingSavedNote };
    }
    return {
      id: `note-${item.id}`,
      discoveryId: item.id,
      discoveryTitle: item.title,
      sourceUrl: item.sourceUrl,
      status: 'draft_preview',
      language,
      executiveSummary: item.readerLayers.quickOrientation,
      whyItMatters: item.oneSentenceWhyItMatters,
      prerequisites: [...item.readerLayers.prerequisites],
      coreConceptsAndDefinitions: [
        {
          term: item.domain,
          definition:
            language === 'hinglish'
              ? item.readerLayers.beginnerExplanationHinglish
              : item.readerLayers.beginnerExplanation,
        },
        {
          term: 'Publication & Evidence Status',
          definition: `${item.evidenceStatus} (${item.sourceName}, Published ${item.publishedAt})`,
        },
      ],
      mechanismSteps:
        language === 'hinglish'
          ? [...item.readerLayers.coreMechanismHinglish]
          : [...item.readerLayers.coreMechanism],
      workedExamples: `Applied Scenario (${item.title}):\n1. Baseline Context: ${item.readerLayers.historicalFoundations}\n2. Mechanism Execution: ${item.readerLayers.coreMechanism[0] || item.oneSentenceWhyItMatters}\n3. Measured Outcome: ${item.readerLayers.findings}\n4. Practical Application: ${item.readerLayers.applicationsAndImplications}`,
      methodsAndEvidence: `${item.readerLayers.methodsAndEvidence}\n\nKey Findings: ${item.readerLayers.findings}`,
      equations: [...item.equations],
      limitationsAndCritique: `${item.readerLayers.limitationsAndUncertainty}\n\nFalsifiability: ${item.readerLayers.criticalAnalysisAndFalsifiability}`,
      examRevisionSheet: [
        `Core Thesis: ${item.oneSentenceWhyItMatters}`,
        `Primary Mechanism: ${item.readerLayers.coreMechanism[0] || ''}`,
        `Key Limitation: ${item.readerLayers.limitationsAndUncertainty}`,
        `Key Formula: ${item.equations[0]?.formula || 'Refer to methodology section'}`,
      ],
      userPersonalAnnotations: '',
      tags: [item.domain, item.evidenceStatus],
      flashcards: [
        {
          id: `fc-1-${item.id}`,
          front: `What is the core mechanism of "${item.title}"?`,
          back: item.readerLayers.coreMechanism.join(' → '),
        },
        {
          id: `fc-2-${item.id}`,
          front: `What are the main limitations of "${item.title}"?`,
          back: item.readerLayers.limitationsAndUncertainty,
        },
      ],
      citations: [...item.readerLayers.references],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  const [noteDraft, setNoteDraft] = useState<StructuredNote>(buildInitialDraft);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [showNoteOutline, setShowNoteOutline] = useState(true);
  const [autosaveState, setAutosaveState] = useState<
    'idle' | 'saving' | 'saved' | 'error'
  >(existingSavedNote ? 'saved' : 'idle');
  const [aiNoteEnhancing, setAiNoteEnhancing] = useState(false);
  const autosaveTimerRef = useRef<number | null>(null);

  // Quiz state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Reset noteDraft and quiz state whenever the active paper ID changes or when enrichment completes on an unedited draft
  useEffect(() => {
    setNoteDraft(buildInitialDraft());
    setIsEditingNote(false);
    setAutosaveState(existingSavedNote ? 'saved' : 'idle');
    setSelectedAnswers({});
    setQuizSubmitted(false);
  }, [incomingItem.id]);

  useEffect(() => {
    if (!existingSavedNote && !isEditingNote && enrichmentStatus === 'enriched') {
      setNoteDraft(buildInitialDraft());
    }
  }, [enrichmentStatus, enrichedItem]);

  const updateNoteFieldWithAutosave = (updater: (prev: StructuredNote) => StructuredNote) => {
    setNoteDraft((prev) => {
      const next: StructuredNote = {
        ...updater(prev),
        status: 'approved_saved',
        approvedAt: prev.approvedAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setAutosaveState('saving');
      if (autosaveTimerRef.current) {
        window.clearTimeout(autosaveTimerRef.current);
      }
      autosaveTimerRef.current = window.setTimeout(async () => {
        try {
          const ok = await onApproveAndSaveNote(next);
          setAutosaveState(ok === false ? 'error' : 'saved');
        } catch {
          setAutosaveState('error');
        }
      }, 700);
      return next;
    });
  };

  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) {
        window.clearTimeout(autosaveTimerRef.current);
      }
    };
  }, []);

  const handleAppendPassageToNotes = (passage: string) => {
    const cleanQuote = `> "${passage}"\n— Extracted from ${item.title} (${item.sourceName}, ${item.publishedAt})`;
    updateNoteFieldWithAutosave((prev) => ({
      ...prev,
      userPersonalAnnotations: prev.userPersonalAnnotations
        ? `${prev.userPersonalAnnotations}\n\n${cleanQuote}`
        : cleanQuote,
    }));
    setPassageAddedToast(true);
    setTimeout(() => setPassageAddedToast(false), 2500);
  };

  const handleEnhanceDraftWithAi = async () => {
    if (aiNoteEnhancing) return;
    setAiNoteEnhancing(true);
    try {
      const res = await fetch('/api/ai/note-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: item.title,
          domain: item.domain,
          quickOrientation: item.readerLayers.quickOrientation,
          mechanism: item.readerLayers.coreMechanism,
          limitations: item.readerLayers.limitationsAndUncertainty,
          language,
          difficulty,
        }),
      });
      const data = await res.json();
      if (res.ok && data.executiveSummary) {
        updateNoteFieldWithAutosave((prev) => ({
          ...prev,
          language,
          executiveSummary: data.executiveSummary,
          whyItMatters: data.whyItMatters || prev.whyItMatters,
          examRevisionSheet:
            Array.isArray(data.examRevisionBullets) && data.examRevisionBullets.length > 0
              ? data.examRevisionBullets
              : prev.examRevisionSheet,
        }));
      }
    } catch {
      setAutosaveState('error');
    } finally {
      setAiNoteEnhancing(false);
    }
  };

  const handleExplicitSaveNote = async () => {
    setAutosaveState('saving');
    const approved: StructuredNote = {
      ...noteDraft,
      status: 'approved_saved',
      approvedAt: noteDraft.approvedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setNoteDraft(approved);
    setIsEditingNote(false);
    try {
      const ok = await onApproveAndSaveNote(approved);
      setAutosaveState(ok === false ? 'error' : 'saved');
    } catch {
      setAutosaveState('error');
    }
  };

  const buildMarkdownFromNote = (n: StructuredNote) => {
    const workedExSection = n.workedExamples
      ? `\n## Worked Examples & Applied Scenarios\n\n${n.workedExamples}\n`
      : '';
    return `# ${n.discoveryTitle}\n\n**Source:** ${n.sourceUrl}\n**Saved:** ${new Date(
      n.updatedAt
    ).toLocaleDateString()}\n\n## 1. Introduction & Executive Summary\n\n${
      n.executiveSummary
    }\n\n## 2. Why This Research Matters\n\n${
      n.whyItMatters
    }\n\n## 3. Core Concepts & Definitions\n\n${n.coreConceptsAndDefinitions
      .map((c) => `- **${c.term}**: ${c.definition}`)
      .join('\n')}\n\n## 4. Methodology & Mechanism\n\n${n.mechanismSteps
      .map((s, i) => `${i + 1}. ${s}`)
      .join('\n\n')}\n${workedExSection}\n## 5. Empirical Findings & Evidence\n\n${
      n.methodsAndEvidence
    }\n\n## 6. Limitations & Open Questions\n\n${
      n.limitationsAndCritique
    }\n\n## 7. Key Takeaways for Revision\n\n${n.examRevisionSheet
      .map((b) => `- ${b}`)
      .join('\n')}\n\n## 8. Personal Notes & Selected Passages\n\n${
      n.userPersonalAnnotations || 'No personal notes added yet.'
    }\n`;
  };

  const handleCopyNote = () => {
    navigator.clipboard?.writeText(buildMarkdownFromNote(noteDraft));
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2000);
  };

  const handleDownloadNoteMarkdown = () => {
    const md = buildMarkdownFromNote(noteDraft);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${noteDraft.discoveryTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleQuizSubmit = () => {
    setQuizSubmitted(true);
    if (item.quiz.length === 0) return;
    let correct = 0;
    item.quiz.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctIndex) correct += 1;
    });
    const pct = Math.round((correct / item.quiz.length) * 100);
    onRecordQuizResult(item.id, pct);
  };

  const handleFollowTopic = () => {
    onAddWatch({
      targetType:
        item.sourceType === 'GitHub Repository' ? 'GitHub Repository' : 'Research Paper',
      targetQuery: item.canonicalId,
      displayTitle: item.title,
      sourcesMonitored: [item.sourceName, 'OpenAlex Citations'],
      importanceThreshold: 'Meaningful Changes Only',
      cadence: 'Daily Briefing',
      active: true,
    });
    setWatchAddedToast(true);
    setTimeout(() => setWatchAddedToast(false), 3000);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const hasOpenFullText =
    item.fullTextAvailable !== undefined
      ? item.fullTextAvailable
      : item.sourceType === 'Preprint (arXiv / bioRxiv)' ||
        item.sourceType === 'GitHub Repository' ||
        !item.isLiveFetched;

  return (
    <div
      className={`fixed inset-0 z-50 flex ${
        isFocusMode
          ? 'bg-[#0B0A0E] p-0'
          : 'items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4'
      } overflow-hidden`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="workspace-modal-title"
    >
      <div
        className={`w-full h-full ${
          isFocusMode
            ? 'max-w-none bg-[#0B0A0E] rounded-none border-none'
            : 'max-w-5xl sm:h-[94vh] bg-[#111017] sm:rounded-[28px] border border-white/12 shadow-2xl'
        } overflow-hidden flex flex-col`}
      >
        {/* TOP SCROLL-DEPTH READING PROGRESS BAR (Interactive & Synced) */}
        <div
          onClick={handleProgressBarSeek}
          className="w-full h-2 bg-white/10 shrink-0 relative overflow-hidden cursor-pointer group"
          role="progressbar"
          aria-valuenow={readingProgress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Paper reading scroll progress"
          title={`Reading progress: ${readingProgress}% (Click anywhere on bar to jump to position)`}
        >
          <div
            className="h-full bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-300 transition-all duration-150 ease-out"
            style={{ width: `${readingProgress}%` }}
          />
        </div>

        {/* UNIVERSAL FEEDBACK TOAST NOTIFICATION */}
        {feedbackToast && (
          <div className="absolute top-4 right-4 z-50 bg-[#191724] border border-emerald-400/50 text-white text-xs px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 animate-fade-in pointer-events-none">
            <Check className="w-4 h-4 text-emerald-300 shrink-0" />
            <span className="font-medium text-emerald-100">{feedbackToast}</span>
          </div>
        )}

        {/* DISTRACTION-FREE FOCUS MODE HEADER OR STANDARD WORKSPACE HEADER */}
        {isFocusMode ? (
          <header className="px-4 sm:px-8 py-3 bg-[#13111C]/95 border-b border-white/10 flex items-center justify-between gap-4 shrink-0 relative z-30">
            {/* Left: Article title & indicator */}
            <div className="flex items-center gap-3 min-w-0">
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[11px] font-mono font-semibold text-emerald-300 uppercase tracking-wider shrink-0">
                ● Focus Mode
              </span>
              <h1 className="text-xs sm:text-sm font-bold text-white truncate max-w-sm sm:max-w-md hidden sm:block">
                {item.title}
              </h1>
            </div>

            {/* Center: Reading progress + Typography Menu */}
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono text-emerald-300 px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/10 shrink-0">
                Read {readingProgress}%
              </span>

              {/* Typography controls accessible in focus mode */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowTypographyMenu((prev) => !prev)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors inline-flex items-center gap-1.5 ${
                    showTypographyMenu
                      ? 'bg-white/20 text-white'
                      : 'orbit-glass-pill text-white/80 hover:text-white'
                  }`}
                  title="Reading typography and layout controls"
                >
                  <Type className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Typography</span>
                </button>

                {showTypographyMenu && (
                  <div className="absolute right-0 mt-2 z-50 w-64 p-3.5 rounded-2xl bg-[#181622] border border-white/15 shadow-2xl space-y-3 text-xs animate-fade-in">
                    <div className="flex items-center justify-between text-white/50 text-[10px] font-mono uppercase tracking-wider">
                      <span>Reading Typography</span>
                      <button
                        onClick={() => setShowTypographyMenu(false)}
                        className="hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Typeface */}
                    <div className="space-y-1.5">
                      <span className="text-white/70 block font-medium">Typeface</span>
                      <div className="grid grid-cols-2 gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
                        <button
                          type="button"
                          onClick={() => setReaderFontFamily('sans')}
                          className={`py-1 rounded-lg transition-colors font-sans-body ${
                            readerFontFamily === 'sans'
                              ? 'bg-white text-[#0B0A0E] font-semibold'
                              : 'text-white/70 hover:text-white'
                          }`}
                        >
                          Sans (Modern)
                        </button>
                        <button
                          type="button"
                          onClick={() => setReaderFontFamily('serif')}
                          className={`py-1 rounded-lg transition-colors font-serif ${
                            readerFontFamily === 'serif'
                              ? 'bg-white text-[#0B0A0E] font-semibold'
                              : 'text-white/70 hover:text-white'
                          }`}
                        >
                          Serif (Journal)
                        </button>
                      </div>
                    </div>

                    {/* Font Size */}
                    <div className="space-y-1.5">
                      <span className="text-white/70 block font-medium">Font Size</span>
                      <div className="grid grid-cols-3 gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
                        {(['compact', 'normal', 'large'] as const).map((sz) => (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => setFontSize(sz)}
                            className={`py-1 rounded-lg capitalize transition-colors ${
                              fontSize === sz
                                ? 'bg-white text-[#0B0A0E] font-semibold'
                                : 'text-white/70 hover:text-white'
                            }`}
                          >
                            {sz}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Reading Column Width */}
                    <div className="space-y-1.5">
                      <span className="text-white/70 block font-medium">Column Width</span>
                      <div className="grid grid-cols-2 gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
                        <button
                          type="button"
                          onClick={() => setReadingWidth('comfortable')}
                          className={`py-1 rounded-lg transition-colors ${
                            readingWidth === 'comfortable'
                              ? 'bg-white text-[#0B0A0E] font-semibold'
                              : 'text-white/70 hover:text-white'
                          }`}
                        >
                          Balanced (68ch)
                        </button>
                        <button
                          type="button"
                          onClick={() => setReadingWidth('expanded')}
                          className={`py-1 rounded-lg transition-colors ${
                            readingWidth === 'expanded'
                              ? 'bg-white text-[#0B0A0E] font-semibold'
                              : 'text-white/70 hover:text-white'
                          }`}
                        >
                          Wide (82ch)
                        </button>
                      </div>
                    </div>

                    {/* Line Spacing */}
                    <div className="space-y-1.5">
                      <span className="text-white/70 block font-medium">Line Spacing</span>
                      <div className="grid grid-cols-2 gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
                        <button
                          type="button"
                          onClick={() => setReaderLineSpacing('standard')}
                          className={`py-1 rounded-lg transition-colors ${
                            readerLineSpacing === 'standard'
                              ? 'bg-white text-[#0B0A0E] font-semibold'
                              : 'text-white/70 hover:text-white'
                          }`}
                        >
                          Standard
                        </button>
                        <button
                          type="button"
                          onClick={() => setReaderLineSpacing('relaxed')}
                          className={`py-1 rounded-lg transition-colors ${
                            readerLineSpacing === 'relaxed'
                              ? 'bg-white text-[#0B0A0E] font-semibold'
                              : 'text-white/70 hover:text-white'
                          }`}
                        >
                          Relaxed
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Exit Focus Mode Button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleFocusMode}
                className="px-4 py-2 rounded-full bg-emerald-400 hover:bg-emerald-300 text-[#0B0A0E] font-bold text-xs inline-flex items-center gap-1.5 transition-colors shadow-lg cursor-pointer"
                title="Exit focus mode and return to standard workspace layout (Esc)"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Exit Focus Mode</span>
                <span className="hidden sm:inline opacity-70 font-mono text-[10px] ml-0.5">(Esc)</span>
              </button>
            </div>
          </header>
        ) : (
          /* STANDARD WORKSPACE HEADER */
          <header className="px-4 sm:px-6 py-3 bg-[#16141F] border-b border-white/10 flex flex-wrap items-center justify-between gap-3 shrink-0 relative">
            {/* Left: Back to Results, Outline Toggle, Highlights & Typography Controls */}
            <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCloseWithSync}
              className="px-3.5 py-2 rounded-full orbit-glass-pill text-xs font-medium text-white hover:bg-white/20 transition-colors inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Results</span>
            </button>

            {mode === 'reader' && (
              <>
                <button
                  onClick={() => setShowOutline((prev) => !prev)}
                  className={`px-3 py-2 rounded-full text-xs font-medium transition-colors inline-flex items-center gap-1.5 ${
                    showOutline
                      ? 'bg-white/20 text-white'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                  title="Toggle section outline"
                >
                  <List className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Contents</span>
                </button>

                <button
                  onClick={() => setShowAnnotationsDrawer((prev) => !prev)}
                  className={`px-3 py-2 rounded-full text-xs font-medium transition-colors inline-flex items-center gap-1.5 ${
                    showAnnotationsDrawer
                      ? 'bg-emerald-500/25 border border-emerald-400/50 text-emerald-200'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                  title="Open Annotations & Highlights drawer"
                >
                  <Highlighter className="w-3.5 h-3.5 text-emerald-300" />
                  <span className="hidden sm:inline">Highlights</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-white/10 font-mono text-[10px] text-white">
                    {annotations.length}
                  </span>
                </button>

                {/* Typography & Layout Customizer */}
                <div className="relative">
                  <button
                    onClick={() => setShowTypographyMenu((prev) => !prev)}
                    className={`px-3 py-2 rounded-full text-xs font-medium transition-colors inline-flex items-center gap-1.5 ${
                      showTypographyMenu
                        ? 'bg-white/20 text-white'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                    title="Reading typography and layout controls"
                  >
                    <Type className="w-3.5 h-3.5" />
                    <span className="hidden lg:inline capitalize">{fontSize}</span>
                  </button>

                  {showTypographyMenu && (
                    <div className="absolute left-0 mt-2 z-50 w-64 p-3.5 rounded-2xl bg-[#181622] border border-white/15 shadow-2xl space-y-3 text-xs animate-fade-in">
                      <div className="flex items-center justify-between text-white/50 text-[10px] font-mono uppercase tracking-wider">
                        <span>Reading Typography</span>
                        <button
                          onClick={() => setShowTypographyMenu(false)}
                          className="hover:text-white"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Typeface */}
                      <div className="space-y-1.5">
                        <span className="text-white/70 block font-medium">Typeface</span>
                        <div className="grid grid-cols-2 gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
                          <button
                            type="button"
                            onClick={() => setReaderFontFamily('sans')}
                            className={`py-1 rounded-lg transition-colors font-sans-body ${
                              readerFontFamily === 'sans'
                                ? 'bg-white text-[#0B0A0E] font-semibold'
                                : 'text-white/70 hover:text-white'
                            }`}
                          >
                            Sans (Modern)
                          </button>
                          <button
                            type="button"
                            onClick={() => setReaderFontFamily('serif')}
                            className={`py-1 rounded-lg transition-colors font-serif ${
                              readerFontFamily === 'serif'
                                ? 'bg-white text-[#0B0A0E] font-semibold'
                                : 'text-white/70 hover:text-white'
                            }`}
                          >
                            Serif (Journal)
                          </button>
                        </div>
                      </div>

                      {/* Font Size */}
                      <div className="space-y-1.5">
                        <span className="text-white/70 block font-medium">Font Size</span>
                        <div className="grid grid-cols-3 gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
                          {(['compact', 'normal', 'large'] as const).map((sz) => (
                            <button
                              key={sz}
                              type="button"
                              onClick={() => setFontSize(sz)}
                              className={`py-1 rounded-lg capitalize transition-colors ${
                                fontSize === sz
                                  ? 'bg-white text-[#0B0A0E] font-semibold'
                                  : 'text-white/70 hover:text-white'
                              }`}
                            >
                              {sz}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Reading Column Width */}
                      <div className="space-y-1.5">
                        <span className="text-white/70 block font-medium">Column Width</span>
                        <div className="grid grid-cols-2 gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
                          <button
                            type="button"
                            onClick={() => setReadingWidth('comfortable')}
                            className={`py-1 rounded-lg transition-colors ${
                              readingWidth === 'comfortable'
                                ? 'bg-white text-[#0B0A0E] font-semibold'
                                : 'text-white/70 hover:text-white'
                            }`}
                          >
                            Balanced (68ch)
                          </button>
                          <button
                            type="button"
                            onClick={() => setReadingWidth('expanded')}
                            className={`py-1 rounded-lg transition-colors ${
                              readingWidth === 'expanded'
                                ? 'bg-white text-[#0B0A0E] font-semibold'
                                : 'text-white/70 hover:text-white'
                            }`}
                          >
                            Wide (82ch)
                          </button>
                        </div>
                      </div>

                      {/* Line Spacing */}
                      <div className="space-y-1.5">
                        <span className="text-white/70 block font-medium">Line Spacing</span>
                        <div className="grid grid-cols-2 gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
                          <button
                            type="button"
                            onClick={() => setReaderLineSpacing('standard')}
                            className={`py-1 rounded-lg transition-colors ${
                              readerLineSpacing === 'standard'
                                ? 'bg-white text-[#0B0A0E] font-semibold'
                                : 'text-white/70 hover:text-white'
                            }`}
                          >
                            Standard
                          </button>
                          <button
                            type="button"
                            onClick={() => setReaderLineSpacing('relaxed')}
                            className={`py-1 rounded-lg transition-colors ${
                              readerLineSpacing === 'relaxed'
                                ? 'bg-white text-[#0B0A0E] font-semibold'
                                : 'text-white/70 hover:text-white'
                            }`}
                          >
                            Relaxed
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            <span
              className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/10 text-[11px] font-mono text-emerald-300"
              title="Synchronized reading progress for this paper"
            >
              Read {readingProgress}%
            </span>

            {mode === 'reader' && (
              <span
                className="hidden xl:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/[0.03] text-[11px] font-mono text-white/50"
                title="Estimated reading time"
              >
                <Clock className="w-3 h-3" />
                <span>~{estimatedReadingTimeMinutes} min read</span>
              </span>
            )}
          </div>

          {/* Center: 3 Distinct Task Modes (Read Paper | Explain Paper | Study Notes) */}
          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-full border border-white/10">
            <button
              onClick={() => setMode('reader')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all inline-flex items-center gap-1.5 ${
                mode === 'reader'
                  ? 'bg-white text-[#0B0A0E] font-semibold shadow-sm'
                  : 'text-white/75 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Read Paper</span>
            </button>

            <button
              onClick={() => setMode('explain')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all inline-flex items-center gap-1.5 ${
                mode === 'explain'
                  ? 'bg-white text-[#0B0A0E] font-semibold shadow-sm'
                  : 'text-white/75 hover:text-white'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Explain Paper</span>
            </button>

            <button
              onClick={() => setMode('notes')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all inline-flex items-center gap-1.5 ${
                mode === 'notes'
                  ? 'bg-white text-[#0B0A0E] font-semibold shadow-sm'
                  : 'text-white/75 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Study Notes</span>
            </button>
          </div>

          {/* Right: Focus Reading Toggle, Save to Library & Original Source Link */}
          <div className="flex items-center gap-2">
            {mode === 'reader' && (
              <button
                type="button"
                onClick={toggleFocusMode}
                title="Enter distraction-free full-screen reading mode"
                className="px-3.5 py-2 rounded-full orbit-glass-pill text-xs font-semibold text-emerald-300 hover:text-white hover:bg-emerald-500/20 border border-emerald-500/35 transition-all inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Focus Reading</span>
              </button>
            )}

            <button
              onClick={() => onToggleBookmark(item.id)}
              className={`px-3.5 py-2 rounded-full text-xs font-medium transition-colors inline-flex items-center gap-1.5 ${
                isBookmarked
                  ? 'bg-emerald-400/20 text-emerald-200 border border-emerald-400/40'
                  : 'orbit-glass-pill text-white/85 hover:text-white'
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
              href={item.fullTextUrl || item.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-full orbit-glass-pill text-xs font-medium text-white/85 hover:text-white transition-colors inline-flex items-center gap-1.5"
              title="Open original publisher or repository page"
            >
              <span className="hidden sm:inline">Original Source</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </header>
      )}

        {/* CONTEXTUAL SELECTION BAR IN READER MODE (With 5 Color Highlights & Margin Notes) */}
        {mode === 'reader' && selectedPassage && (
          <div className="px-4 sm:px-6 py-2.5 bg-[#171524] border-b border-emerald-500/35 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 animate-fade-in shadow-xl">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Quote className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
              <span className="text-emerald-200 font-medium shrink-0">Selected:</span>
              <span className="text-white/90 truncate italic">
                &ldquo;{selectedPassage}&rdquo;
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {/* 5-Color Highlight Quick Palette */}
              <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-full border border-white/10" title="Highlight passage with color tag">
                <span className="text-[10px] text-white/50 mr-1 font-mono">Highlight:</span>
                <button
                  type="button"
                  onClick={() => handleAddHighlight(selectedPassage, 'emerald')}
                  className="w-4 h-4 rounded-full bg-emerald-400 hover:scale-125 transition-transform"
                  title="Key Concept / Core Finding (Emerald)"
                  aria-label="Highlight in emerald"
                />
                <button
                  type="button"
                  onClick={() => handleAddHighlight(selectedPassage, 'amber')}
                  className="w-4 h-4 rounded-full bg-amber-400 hover:scale-125 transition-transform"
                  title="Methodology / Question (Amber)"
                  aria-label="Highlight in amber"
                />
                <button
                  type="button"
                  onClick={() => handleAddHighlight(selectedPassage, 'sky')}
                  className="w-4 h-4 rounded-full bg-sky-400 hover:scale-125 transition-transform"
                  title="Definition / Background (Sky)"
                  aria-label="Highlight in sky"
                />
                <button
                  type="button"
                  onClick={() => handleAddHighlight(selectedPassage, 'purple')}
                  className="w-4 h-4 rounded-full bg-purple-400 hover:scale-125 transition-transform"
                  title="Theory / Mechanism (Purple)"
                  aria-label="Highlight in purple"
                />
                <button
                  type="button"
                  onClick={() => handleAddHighlight(selectedPassage, 'rose')}
                  className="w-4 h-4 rounded-full bg-rose-400 hover:scale-125 transition-transform"
                  title="Limitation / Critical Note (Rose)"
                  aria-label="Highlight in rose"
                />
              </div>

              {/* Add Personal Margin Note */}
              <button
                type="button"
                onClick={() =>
                  setActiveMarginNoteInput({
                    text: selectedPassage,
                    color: 'emerald',
                    noteText: '',
                  })
                }
                className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium transition-colors inline-flex items-center gap-1"
              >
                <MessageSquare className="w-3 h-3 text-emerald-300" />
                <span>+ Margin Note</span>
              </button>

              {selectedPassage.length <= 55 && (
                <button
                  type="button"
                  onClick={(e) => handleDefineTechnicalTerm(e, selectedPassage)}
                  className="px-3 py-1 rounded-full bg-white text-[#0B0A0E] font-semibold hover:bg-white/90 transition-colors"
                >
                  Define term
                </button>
              )}

              <button
                type="button"
                onClick={() =>
                  handleInlineReaderAction(
                    'explain_selection',
                    'Explain this selected passage clearly in plain language and how it fits into the paper.',
                    selectedPassage,
                    'Explain selection'
                  )
                }
                className="px-3 py-1 rounded-full bg-emerald-400 text-[#0B0A0E] font-semibold hover:bg-emerald-300 transition-colors"
              >
                Explain
              </button>

              <button
                type="button"
                onClick={() =>
                  handleInlineReaderAction(
                    'simplify_selection',
                    'Simplify this selected passage in plain, beginner-friendly language.',
                    selectedPassage,
                    'Simplify selection'
                  )
                }
                className="px-3 py-1 rounded-full orbit-glass-pill text-white hover:bg-white/20 transition-colors"
              >
                Simplify
              </button>

              <button
                type="button"
                onClick={() => handleAppendPassageToNotes(selectedPassage)}
                className="px-3 py-1 rounded-full orbit-glass-pill text-white hover:bg-white/20 transition-colors"
              >
                {passageAddedToast ? '✓ Added' : '+ Notes'}
              </button>

              <button
                type="button"
                onClick={() => handleCopyQuoteWithCitation(selectedPassage)}
                className="px-3 py-1 rounded-full orbit-glass-pill text-white hover:bg-white/20 transition-colors"
                title="Copy quote with academic citation"
              >
                Copy quote
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedPassage('');
                  setActiveMarginNoteInput(null);
                }}
                aria-label="Dismiss selection toolbar"
                className="p-1 text-white/60 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* INLINE MARGIN NOTE COMPOSER MODAL (Attached to Selected Passage) */}
        {mode === 'reader' && activeMarginNoteInput && (
          <div className="px-4 sm:px-6 py-3 bg-[#13111C] border-b border-white/15 animate-fade-in text-xs shrink-0">
            <div className="max-w-[76ch] mx-auto space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white inline-flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Attach Personal Margin Note to Highlight</span>
                </span>
                <button
                  type="button"
                  onClick={() => setActiveMarginNoteInput(null)}
                  className="text-white/60 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-2.5 rounded-xl bg-black/40 border-l-2 border-emerald-400 text-white/75 italic line-clamp-2">
                &ldquo;{activeMarginNoteInput.text}&rdquo;
              </div>

              <div className="flex items-center gap-3">
                <span className="text-white/60">Color Category:</span>
                <div className="flex items-center gap-1.5">
                  {(['emerald', 'amber', 'sky', 'purple', 'rose'] as HighlightColor[]).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setActiveMarginNoteInput((prev) => prev ? { ...prev, color: c } : null)}
                      className={`w-5 h-5 rounded-full transition-transform ${
                        activeMarginNoteInput.color === c ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                      } ${
                        c === 'emerald'
                          ? 'bg-emerald-400'
                          : c === 'amber'
                          ? 'bg-amber-400'
                          : c === 'sky'
                          ? 'bg-sky-400'
                          : c === 'purple'
                          ? 'bg-purple-400'
                          : 'bg-rose-400'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <textarea
                rows={2}
                value={activeMarginNoteInput.noteText}
                onChange={(e) =>
                  setActiveMarginNoteInput((prev) =>
                    prev ? { ...prev, noteText: e.target.value } : null
                  )
                }
                placeholder="Write your note, question, or conceptual connection here..."
                className="w-full p-2.5 rounded-xl bg-black/50 border border-white/15 text-white placeholder:text-white/40 focus:outline-none focus:border-emerald-400"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveMarginNoteInput(null)}
                  className="px-3 py-1.5 rounded-lg text-white/70 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleAddHighlight(
                      activeMarginNoteInput.text,
                      activeMarginNoteInput.color,
                      activeMarginNoteInput.noteText
                    )
                  }
                  className="px-4 py-1.5 rounded-lg bg-emerald-400 text-[#0B0A0E] font-semibold hover:bg-emerald-300 transition-colors"
                >
                  Save Highlight &amp; Note
                </button>
              </div>
            </div>
          </div>
        )}

        {/* INLINE CONTEXTUAL PASSAGE EXPLANATION POPOVER IN READER MODE (Preserves Reader route & scroll!) */}
        {mode === 'reader' && inlineReaderExplanation && (
          <div className="px-4 sm:px-6 py-3.5 bg-[#171522] border-b border-emerald-500/35 shrink-0">
            <div className="max-w-[76ch] mx-auto space-y-2.5 text-xs sm:text-sm">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-300">
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Professor · {inlineReaderExplanation.label}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setInlineReaderExplanation(null)}
                  aria-label="Close explanation"
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-xs text-white/75 hover:text-white inline-flex items-center gap-1"
                >
                  <span>Close</span>
                  <X className="w-3 h-3" />
                </button>
              </div>

              {inlineReaderExplanation.passage && (
                <div className="p-2.5 rounded-xl bg-black/40 border-l-2 border-emerald-400 text-xs text-white/75 italic line-clamp-2">
                  &ldquo;{inlineReaderExplanation.passage}&rdquo;
                </div>
              )}

              {inlineReaderExplanation.loading ? (
                <div className="flex items-center gap-2 text-xs text-emerald-300 py-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating explanation for selected passage...</span>
                </div>
              ) : inlineReaderExplanation.error ? (
                <div className="text-xs text-amber-300">{inlineReaderExplanation.error}</div>
              ) : (
                <div className="space-y-2">
                  <p className="text-white/95 leading-relaxed whitespace-pre-line">
                    {inlineReaderExplanation.explanation}
                  </p>
                  {inlineReaderExplanation.analogies && (
                    <p className="text-xs text-emerald-200/90">
                      <strong>Analogy:</strong> {inlineReaderExplanation.analogies}
                    </p>
                  )}
                  <div className="pt-1 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleInlineReaderAction(
                          'simplify_selection',
                          'Give a concrete, intuitive example of this passage.',
                          inlineReaderExplanation.passage,
                          'Example for passage'
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-white"
                    >
                      Give an example
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleAppendPassageToNotes(inlineReaderExplanation.explanation)
                      }
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-emerald-300"
                    >
                      {passageAddedToast ? '✓ Saved to Notes' : '+ Save to Study Notes'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setInlineReaderExplanation(null)}
                      className="px-2.5 py-1 rounded-lg text-xs text-white/60 hover:text-white"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MAIN SCROLLABLE WORKSPACE BODY */}
        <div
          ref={scrollContainerRef}
          onScroll={handleContainerScroll}
          onMouseUp={handleMouseUpSelection}
          className="flex-1 overflow-y-auto overflow-x-hidden relative flex"
        >
          {/* Unified Navigation & Annotations Sidebar (Toggled via Contents or Highlights buttons) */}
          {mode === 'reader' && (showOutline || showAnnotationsDrawer) && (
            <aside className="w-72 shrink-0 border-r border-white/10 bg-[#14121C] p-4 hidden md:flex flex-col gap-4 sticky top-0 h-fit max-h-[85vh] overflow-y-auto animate-fade-in">
              {/* Tab Switcher: Contents vs Highlights */}
              <div className="flex items-center justify-between gap-1 bg-black/40 p-1 rounded-xl border border-white/10 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setShowOutline(true);
                    setShowAnnotationsDrawer(false);
                  }}
                  className={`flex-1 py-1.5 rounded-lg font-medium transition-colors inline-flex items-center justify-center gap-1.5 ${
                    showOutline && !showAnnotationsDrawer
                      ? 'bg-white text-[#0B0A0E] font-semibold'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  <List className="w-3 h-3" />
                  <span>Contents</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowAnnotationsDrawer(true);
                    setShowOutline(false);
                  }}
                  className={`flex-1 py-1.5 rounded-lg font-medium transition-colors inline-flex items-center justify-center gap-1.5 ${
                    showAnnotationsDrawer
                      ? 'bg-emerald-400 text-[#0B0A0E] font-semibold'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  <Highlighter className="w-3 h-3" />
                  <span>Highlights ({annotations.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowOutline(false);
                    setShowAnnotationsDrawer(false);
                  }}
                  className="p-1 rounded-lg text-white/40 hover:text-white transition-colors"
                  title="Close sidebar"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* TAB 1: ARTICLE SECTIONS OUTLINE */}
              {showOutline && !showAnnotationsDrawer && (
                <div className="space-y-4">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-white/45">
                    Article Sections
                  </div>
                  <nav className="space-y-1.5 text-xs">
                    {[
                      { id: 'sec-abstract', label: '1. Abstract & Overview' },
                      { id: 'sec-background', label: '2. Background & Context' },
                      { id: 'sec-methods', label: '3. Methodology & Mechanism' },
                      { id: 'sec-findings', label: '4. Findings & Evidence' },
                      { id: 'sec-limitations', label: '5. Limitations & Caveats' },
                      { id: 'sec-references', label: '6. References & Citations' },
                      { id: 'sec-related', label: '7. Related Research' },
                    ].map((s) => (
                      <button
                        key={s.id}
                        onClick={() => scrollToSection(s.id)}
                        className="block w-full text-left py-1.5 px-2.5 rounded-lg text-white/75 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        {s.label}
                      </button>
                    ))}
                  </nav>

                  <div className="pt-4 border-t border-white/10 space-y-2">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-white/45">
                      Contextual Actions
                    </div>
                    <button
                      onClick={() => setMode('explain')}
                      className="w-full text-left py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-emerald-300 font-medium transition-colors"
                    >
                      Explain This Paper →
                    </button>
                    <button
                      onClick={() => setMode('notes')}
                      className="w-full text-left py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-white/85 font-medium transition-colors"
                    >
                      Open Study Notes →
                    </button>
                    <button
                      onClick={handleFollowTopic}
                      className="w-full text-left py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-white/70 transition-colors inline-flex items-center gap-1.5"
                    >
                      <BellPlus className="w-3.5 h-3.5 text-emerald-300" />
                      <span>{watchAddedToast ? 'Following Topic!' : 'Watch for Updates'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: SAVED HIGHLIGHTS & MARGIN NOTES */}
              {showAnnotationsDrawer && (
                <div className="space-y-3.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">Your Highlights</span>
                    {annotations.length > 0 && (
                      <button
                        type="button"
                        onClick={handleExportAllHighlightsToNotes}
                        className="text-[11px] font-mono text-emerald-300 hover:underline"
                        title="Append all highlights into the Study Note draft"
                      >
                        Export to Notes →
                      </button>
                    )}
                  </div>

                  {/* Filter by Highlight Color */}
                  {annotations.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {['all', 'emerald', 'amber', 'sky', 'purple', 'rose'].map((col) => (
                        <button
                          key={col}
                          type="button"
                          onClick={() => setAnnotationFilterColor(col)}
                          className={`px-2 py-0.5 rounded-full capitalize text-[10px] transition-colors ${
                            annotationFilterColor === col
                              ? 'bg-white text-[#0B0A0E] font-bold'
                              : 'bg-white/5 text-white/60 hover:text-white'
                          }`}
                        >
                          {col}
                        </button>
                      ))}
                    </div>
                  )}

                  {annotations.length === 0 ? (
                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-center space-y-2">
                      <Highlighter className="w-6 h-6 text-emerald-300/50 mx-auto" />
                      <p className="text-white/65 leading-relaxed text-[11px]">
                        No highlights yet. Select any text in the article to highlight in 5 colors or attach margin notes.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
                      {annotations
                        .filter(
                          (a) =>
                            annotationFilterColor === 'all' ||
                            a.color === annotationFilterColor
                        )
                        .map((ann) => {
                          const borderColor =
                            ann.color === 'emerald'
                              ? 'border-emerald-400'
                              : ann.color === 'amber'
                              ? 'border-amber-400'
                              : ann.color === 'sky'
                              ? 'border-sky-400'
                              : ann.color === 'purple'
                              ? 'border-purple-400'
                              : 'border-rose-400';
                          return (
                            <div
                              key={ann.id}
                              className={`p-3 rounded-xl bg-black/40 border-l-2 ${borderColor} border-y border-r border-white/10 space-y-2 group`}
                            >
                              <div className="flex items-center justify-between text-[10px] text-white/50 font-mono">
                                <span className="capitalize text-emerald-300 font-semibold">
                                  ● {ann.color}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAnnotation(ann.id)}
                                  className="text-white/40 hover:text-rose-300 p-0.5"
                                  title="Delete highlight"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>

                              <p className="text-white/90 text-xs italic line-clamp-3">
                                &ldquo;{ann.text}&rdquo;
                              </p>

                              {ann.note && (
                                <div className="p-2 rounded-lg bg-white/[0.05] text-[11px] text-emerald-200/90">
                                  <strong>Note:</strong> {ann.note}
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}
            </aside>
          )}

          {/* MODE 1: COMFORTABLE ARTICLE READER */}
          {mode === 'reader' && (
            <article
              className={`flex-1 px-6 sm:px-10 md:px-14 lg:px-16 py-8 sm:py-14 mx-auto space-y-14 transition-all ${
                readingWidth === 'expanded' ? 'max-w-[82ch]' : 'max-w-[68ch]'
              }`}
            >
              {/* Clinical / High-Stakes Notice when relevant */}
              {item.highStakesMedicalNotice && (
                <div className="rounded-2xl bg-amber-950/20 border-l-4 border-amber-400 border-y border-r border-amber-500/20 p-4 sm:p-5 flex items-start gap-3.5 text-xs text-amber-200">
                  <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <strong className="font-semibold text-amber-300">Educational Literature Notice:</strong> This biomedical research overview is synthesized for academic study and is not clinical or medical advice.
                  </div>
                </div>
              )}

              {/* Article Bibliographic Header */}
              <header className="space-y-5 pb-8 border-b border-white/[0.08]">
                {/* Clean Unboxed Metadata */}
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-white/55">
                  <span className="font-semibold text-emerald-400">{item.evidenceStatus}</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-white/80">{item.sourceName}</span>
                  <span aria-hidden="true">·</span>
                  <span>Published {item.publishedAt}</span>
                  <span aria-hidden="true">·</span>
                  <span>{item.domain}</span>
                </div>

                <h1
                  id="workspace-modal-title"
                  className={`${
                    readerFontFamily === 'serif' ? 'font-serif' : 'font-display'
                  } text-2xl sm:text-3xl md:text-[34px] font-bold text-white tracking-tight leading-[1.26] text-balance`}
                >
                  {item.title}
                </h1>

                {/* Actual Authors List */}
                <div className="text-sm sm:text-base text-white/70 leading-relaxed font-normal">
                  <span className="text-white/45">Authors: </span>
                  {item.authors && item.authors.length > 0
                    ? item.authors.join(', ')
                    : 'Listed on primary source record'}
                </div>

                {/* Provenance & Full-Text Availability Box */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.025] border border-white/[0.08] space-y-3 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`font-semibold ${
                            hasOpenFullText ? 'text-emerald-300' : 'text-amber-200'
                          }`}
                        >
                          {item.accessStatus === 'open_access_pdf' || item.pdfUrl
                            ? '● Open-Access PDF & Full Manuscript Available'
                            : item.accessStatus === 'open_access_full_text' || hasOpenFullText
                            ? '● Open-Access Full Text Available'
                            : item.hasRealAbstract !== false
                            ? '● Verified Author Abstract & Metadata (Full Text on Publisher Site)'
                            : '● Bibliographic Metadata Record (Full Text on Publisher Site)'}
                        </span>
                        {enrichmentStatus === 'loading' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[11px] font-mono text-emerald-300">
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            <span>Enriching from Semantic Scholar, arXiv &amp; Europe PMC...</span>
                          </span>
                        )}
                        {enrichmentStatus === 'enriched' && enrichmentSources.length > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[11px] font-mono text-emerald-300">
                            <Check className="w-3 h-3" />
                            <span>Verified via {enrichmentSources.join(' · ')}</span>
                          </span>
                        )}
                      </div>
                      <div className="text-white/55 font-mono text-[11px] flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>Canonical ID: {item.canonicalId}</span>
                        {item.doi && <span>DOI: {item.doi}</span>}
                        {item.arxivId && <span>arXiv: {item.arxivId}</span>}
                        {item.pmid && <span>PMID: {item.pmid}</span>}
                        {item.pmcid && <span>PMCID: {item.pmcid}</span>}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {(item.pdfUrl || item.sourceType === 'Preprint (arXiv / bioRxiv)') && (
                        <button
                          type="button"
                          onClick={() => setShowEmbeddedPdf((prev) => !prev)}
                          className={`px-3.5 py-2 rounded-full font-semibold transition-colors inline-flex items-center gap-1.5 ${
                            showEmbeddedPdf
                              ? 'bg-emerald-400 text-[#0B0A0E]'
                              : 'bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/35 text-emerald-200'
                          }`}
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>{showEmbeddedPdf ? 'Hide Embedded PDF' : 'Read Embedded PDF'}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => triggerDeepPaperEnrichment(item)}
                        disabled={enrichmentStatus === 'loading'}
                        className="px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-[11px] font-mono text-white/80 hover:text-white inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
                        title="Query Semantic Scholar, arXiv, Europe PMC Full-Text XML, and Hugging Face Papers for deep metadata"
                      >
                        <RefreshCw
                          className={`w-3 h-3 text-emerald-300 ${
                            enrichmentStatus === 'loading' ? 'animate-spin' : ''
                          }`}
                        />
                        <span>{enrichmentStatus === 'loading' ? 'Enriching...' : 'Verify / Enrich'}</span>
                      </button>

                      {item.providerLinks &&
                        item.providerLinks.length > 1 &&
                        item.providerLinks.map((pl, idx) => (
                          <a
                            key={idx}
                            href={pl.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.14] border border-white/10 text-[11px] font-mono text-emerald-300 inline-flex items-center gap-1 transition-colors"
                            title={`Verified record on ${pl.providerName}`}
                          >
                            <span>{pl.providerName}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        ))}
                      <a
                        href={item.pdfUrl || item.fullTextUrl || item.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 rounded-full bg-white text-[#0B0A0E] font-semibold hover:bg-white/90 transition-colors inline-flex items-center gap-1.5 shadow-sm"
                      >
                        <span>
                          {item.pdfUrl || item.sourceType === 'Preprint (arXiv / bioRxiv)'
                            ? 'Open PDF / Preprint'
                            : item.sourceType === 'GitHub Repository'
                            ? 'Open GitHub Repository'
                            : 'Open Publisher / DOI Page'}
                        </span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  {/* Associated GitHub Repositories Banner when available */}
                  {item.associatedRepos && item.associatedRepos.length > 0 && (
                    <div className="pt-2.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] font-mono text-emerald-300">
                        Companion &amp; Related Code Repositories ({item.associatedRepos.length}):
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        {item.associatedRepos.map((repo, rIdx) => (
                          <div
                            key={rIdx}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/40 border border-white/15 text-[11px]"
                          >
                            <span className="font-mono font-semibold text-white">{repo.fullName}</span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                                repo.matchConfidence === 'high_verified' ||
                                repo.provenance === 'Papers with Code / HF Verified'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : 'bg-white/10 text-white/65'
                              }`}
                            >
                              {repo.matchConfidence === 'high_verified' ||
                              repo.provenance === 'Papers with Code / HF Verified'
                                ? 'Verified Paper Repo'
                                : 'Topic Match'}
                            </span>
                            {onOpenRepoInExplorer && (
                              <button
                                type="button"
                                onClick={() => onOpenRepoInExplorer(repo.fullName)}
                                className="text-emerald-300 hover:underline font-mono ml-1"
                              >
                                Inspect Code →
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Embedded PDF / Manuscript Reader Panel */}
                {showEmbeddedPdf && (item.pdfUrl || item.fullTextUrl) && (
                  <div className="rounded-2xl overflow-hidden border border-emerald-500/35 bg-[#0D0C12] space-y-2 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 px-2 py-1 text-xs">
                      <span className="font-mono text-emerald-300">
                        Direct Manuscript PDF Stream · {item.pdfUrl || item.fullTextUrl}
                      </span>
                      <div className="flex items-center gap-3">
                        <a
                          href={item.pdfUrl || item.fullTextUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white/80 hover:text-white underline inline-flex items-center gap-1"
                        >
                          <span>Open Fullscreen PDF in New Tab</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <button
                          type="button"
                          onClick={() => setShowEmbeddedPdf(false)}
                          className="text-white/60 hover:text-white"
                        >
                          Close PDF
                        </button>
                      </div>
                    </div>
                    <iframe
                      src={item.pdfUrl || item.fullTextUrl}
                      title={`PDF Viewer for ${item.title}`}
                      className="w-full h-[640px] rounded-xl bg-white"
                    />
                  </div>
                )}
              </header>

              {/* SECTION 1: ABSTRACT & OVERVIEW */}
              <section id="sec-abstract" className="space-y-6 pt-2">
                <div className="flex flex-wrap items-baseline justify-between gap-3 pb-3 border-b border-white/[0.06]">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono tracking-widest uppercase text-emerald-400 font-semibold">
                      01 // ABSTRACT &amp; CONTRIBUTION
                    </span>
                    <h2 className={`${getReaderHeadingClasses('h2')} mt-1.5`}>
                      Abstract &amp; Research Contribution
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleInlineReaderAction(
                          'explain_selection',
                          'Summarize this abstract in 3 clear bullet points and explain its main contribution.',
                          item.readerLayers.quickOrientation,
                          'Abstract Summary'
                        )
                      }
                      className="px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-xs font-medium text-emerald-300 hover:text-emerald-200 transition-colors inline-flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Summarize section</span>
                    </button>
                  </div>
                </div>

                {/* SciTLDR Summary when available from Semantic Scholar */}
                {item.tldrSummary && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1.5">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-emerald-300">
                      Semantic Scholar SciTLDR · Concise Paper Summary
                    </div>
                    <p className="text-sm sm:text-base text-white/90 leading-relaxed">
                      <LatexTextRenderer text={item.tldrSummary} />
                    </p>
                  </div>
                )}

                <div className={getReaderParagraphClasses()}>
                  <LatexTextRenderer text={item.readerLayers.quickOrientation} />
                </div>

                <div className="p-5 sm:p-6 rounded-2xl bg-emerald-950/20 border-l-4 border-emerald-400 border-y border-r border-emerald-500/15 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300 font-mono">
                      Core Epistemic Takeaway
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleInlineReaderAction(
                          'simplify_selection',
                          'Explain why this research matters in simple terms for a student new to the field.',
                          item.oneSentenceWhyItMatters,
                          'Plain-Language Takeaway'
                        )
                      }
                      className="text-xs text-emerald-300 hover:text-emerald-200 transition-colors inline-flex items-center gap-1"
                    >
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>Explain simply</span>
                    </button>
                  </div>
                  <p className="text-sm sm:text-base text-white/95 leading-relaxed font-medium">
                    <LatexTextRenderer text={item.oneSentenceWhyItMatters} />
                  </p>
                </div>

                {/* Full-Text XML / Structured Manuscript Sections when available */}
                {item.structuredSections && item.structuredSections.length > 0 && (
                  <div className="space-y-4 pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono uppercase tracking-wider text-emerald-300">
                        {item.structuredSections.some((s) => s.sourceBasis === 'full_text')
                          ? 'Extracted Open-Access Full-Text Manuscript Sections'
                          : 'Structured Paper Breakdown'}
                      </span>
                      <span className="text-[11px] font-mono text-white/45">
                        {item.structuredSections.some((s) => s.sourceBasis === 'full_text')
                          ? 'Source: Europe PMC JATS XML'
                          : 'Source: Author Abstract Decomposition'}
                      </span>
                    </div>
                    <div className="space-y-4">
                      {item.structuredSections.map((sec) => (
                        <div
                          key={sec.id}
                          className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-2.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="text-base font-bold text-white">{sec.heading}</h3>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/5 text-white/55">
                              {sec.sourceBasis === 'full_text' ? 'Full-Text XML' : 'Structured Abstract'}
                            </span>
                          </div>
                          <div className={`${getReaderParagraphClasses()} whitespace-pre-line`}>
                            <LatexTextRenderer text={sec.content} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Extracted Manuscript Figures & Captions when available */}
                {item.figures && item.figures.length > 0 && (
                  <div className="space-y-3 pt-3">
                    <div className="text-xs font-mono uppercase tracking-wider text-emerald-300">
                      Manuscript Figures &amp; Captions ({item.figures.length})
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      {item.figures.map((fig) => (
                        <div
                          key={fig.id}
                          className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1.5 text-xs sm:text-sm"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-emerald-300">{fig.label}</span>
                            {fig.sourceNote && (
                              <span className="text-[11px] font-mono text-white/45">{fig.sourceNote}</span>
                            )}
                          </div>
                          <p className="text-white/85 leading-relaxed">
                            <LatexTextRenderer text={fig.caption} />
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Extracted Manuscript Data Tables when available */}
                {item.tables && item.tables.length > 0 && (
                  <div className="space-y-3 pt-3">
                    <div className="text-xs font-mono uppercase tracking-wider text-emerald-300">
                      Manuscript Tables ({item.tables.length})
                    </div>
                    {item.tables.map((tbl) => (
                      <div
                        key={tbl.id}
                        className="rounded-2xl border border-white/12 overflow-hidden bg-black/30 space-y-2 p-4"
                      >
                        <div className="text-xs font-semibold text-white/90">{tbl.caption}</div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="border-b border-white/15 bg-white/[0.04] text-emerald-300 font-mono">
                                {tbl.headers.map((h, hIdx) => (
                                  <th key={hIdx} className="py-2 px-3">
                                    {h}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                              {tbl.rows.map((row, rIdx) => (
                                <tr key={rIdx}>
                                  {row.map((cell, cIdx) => (
                                    <td key={cIdx} className="py-2 px-3 text-white/80">
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* SECTION 2: BACKGROUND & PREREQUISITES */}
              <section id="sec-background" className="space-y-6 pt-12 sm:pt-14 border-t border-white/[0.08]">
                <div className="flex flex-wrap items-baseline justify-between gap-3 pb-3 border-b border-white/[0.06]">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono tracking-widest uppercase text-emerald-400 font-semibold">
                      02 // BACKGROUND &amp; FOUNDATIONS
                    </span>
                    <h2 className={`${getReaderHeadingClasses('h2')} mt-1.5`}>
                      Historical Foundations &amp; Conceptual Prerequisites
                    </h2>
                  </div>
                </div>

                <p className={getReaderParagraphClasses()}>
                  {item.readerLayers.historicalFoundations}
                </p>

                {item.readerLayers.prerequisites.length > 0 && (
                  <div className="p-5 sm:p-6 rounded-2xl bg-white/[0.025] border border-white/[0.08] space-y-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-white/90 uppercase tracking-wider font-mono">
                        Key Prerequisites (Click to inspect definition)
                      </span>
                      <span className="text-[11px] text-white/45 font-mono">
                        Contextual popup
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {item.readerLayers.prerequisites.map((pre, idx) => {
                        const isSelectedTerm = activeTermPopover?.term === pre;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={(e) => handleDefineTechnicalTerm(e, pre)}
                            className={`px-3 py-1.5 rounded-xl border text-xs transition-colors text-left ${
                              isSelectedTerm
                                ? 'bg-emerald-400/20 border-emerald-400 text-emerald-200 font-semibold'
                                : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-white/85 hover:text-emerald-200'
                            }`}
                          >
                            • {pre}
                          </button>
                        );
                      })}
                    </div>

                    {/* CONTEXTUAL TERM DEFINITION POPOVER CARD */}
                    {activeTermPopover && (
                      <div
                        role="region"
                        aria-label={`Definition of ${activeTermPopover.term}`}
                        className="mt-3 p-4 sm:p-5 rounded-2xl bg-[#161422] border border-emerald-400/40 shadow-xl space-y-3 animate-fade-in"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300 block">
                              Professor · Technical Term Definition
                            </span>
                            <h4 className="text-sm sm:text-base font-bold text-white mt-0.5">
                              {activeTermPopover.term}
                            </h4>
                          </div>
                          <button
                            type="button"
                            onClick={() => setActiveTermPopover(null)}
                            aria-label="Close definition"
                            className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <p className="text-xs sm:text-sm text-[#ECEAE4] leading-relaxed">
                          {activeTermPopover.definition}
                        </p>

                        {activeTermPopover.furtherExplanation && (
                          <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white/90 leading-relaxed space-y-1">
                            <span className="font-semibold text-emerald-300 block">
                              How it works in this paper:
                            </span>
                            <p>{activeTermPopover.furtherExplanation}</p>
                          </div>
                        )}

                        {activeTermPopover.exampleText && (
                          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-100 leading-relaxed space-y-1">
                            <span className="font-semibold text-emerald-300 block">
                              Concrete Example:
                            </span>
                            <p>{activeTermPopover.exampleText}</p>
                          </div>
                        )}

                        <div className="pt-1 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={handleTermPopoverExplainFurther}
                            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition-colors"
                          >
                            Explain further
                          </button>
                          <button
                            type="button"
                            onClick={handleTermPopoverGiveExample}
                            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition-colors"
                          >
                            Give an example
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveTermPopover(null)}
                            className="px-3 py-1.5 rounded-xl text-xs font-medium text-white/65 hover:text-white transition-colors"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </section>

              {/* SECTION 3: METHODOLOGY & HOW IT WORKS */}
              <section id="sec-methods" className="space-y-6 pt-12 sm:pt-14 border-t border-white/[0.08]">
                <div className="flex flex-wrap items-baseline justify-between gap-3 pb-3 border-b border-white/[0.06]">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono tracking-widest uppercase text-emerald-400 font-semibold">
                      03 // METHODOLOGY &amp; MECHANISM
                    </span>
                    <h2 className={`${getReaderHeadingClasses('h2')} mt-1.5`}>
                      Methodology &amp; Step-by-Step Mechanism
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleInlineReaderAction(
                        'explain_selection',
                        `Walk me through the methodology and core mechanism of "${item.title}" step by step.`,
                        item.readerLayers.coreMechanism.join(' '),
                        'Methodology Walkthrough'
                      )
                    }
                    className="px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-xs font-medium text-emerald-300 hover:text-emerald-200 transition-colors inline-flex items-center gap-1.5"
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>Explain methodology</span>
                  </button>
                </div>

                {/* Structured Phase Walkthrough */}
                <div className="space-y-6">
                  {item.readerLayers.coreMechanism.map((step, i) => (
                    <div
                      key={i}
                      className="group relative pl-6 border-l-2 border-white/20 hover:border-emerald-400/90 transition-colors space-y-2 py-1"
                    >
                      <div className="text-[11px] font-mono font-semibold text-emerald-400/90 tracking-wider">
                        PHASE {String(i + 1).padStart(2, '0')}
                      </div>
                      <p className={getReaderParagraphClasses()}>
                        {step}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-white/50 group-hover:text-white/80 transition-colors pt-0.5">
                        <button
                          type="button"
                          onClick={() =>
                            handleInlineReaderAction(
                              'explain_selection',
                              'Explain this specific mechanism step in simpler detail.',
                              step,
                              `Mechanism Step ${i + 1}`
                            )
                          }
                          className="hover:text-emerald-300 transition-colors inline-flex items-center gap-1"
                        >
                          <span>Explain step</span>
                          <span>&rarr;</span>
                        </button>
                        <span>·</span>
                        <button
                          type="button"
                          onClick={() => handleAppendPassageToNotes(step)}
                          className="hover:text-emerald-300 transition-colors"
                        >
                          + Quote in notes
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Mathematical Formulation */}
                {item.equations.length > 0 && (
                  <div className="space-y-4 pt-4">
                    <div className="text-xs font-mono uppercase tracking-wider text-white/60">
                      Mathematical Formulation &amp; Closed-Form Relations
                    </div>
                    {item.equations.map((eq) => {
                      const isInspecting = activeFormulaInspectorId === eq.id;
                      return (
                        <div
                          key={eq.id}
                          className="rounded-2xl bg-[#0B0A0F] border border-white/12 p-5 sm:p-6 space-y-3.5"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-white/85">{eq.title}</span>
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleCopyFormulaLatex(eq.formula)}
                                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-[11px] font-mono text-white/80 hover:text-white transition-colors inline-flex items-center gap-1"
                                title="Copy LaTeX formula to clipboard"
                              >
                                <Copy className="w-3 h-3 text-emerald-300" />
                                <span>Copy LaTeX</span>
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveFormulaInspectorId(isInspecting ? null : eq.id)
                                }
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors inline-flex items-center gap-1 ${
                                  isInspecting
                                    ? 'bg-emerald-400 text-[#0B0A0E] font-semibold'
                                    : 'bg-white/10 hover:bg-white/20 text-white'
                                }`}
                              >
                                <Info className="w-3 h-3" />
                                <span>{isInspecting ? 'Hide breakdown' : 'Variable breakdown'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleInlineReaderAction(
                                    'explain_selection',
                                    `Explain every variable and the physical intuition behind the formula: ${eq.formula}`,
                                    `${eq.title}: ${eq.formula} (${eq.intuition})`,
                                    'Equation Breakdown'
                                  )
                                }
                                className="text-xs text-emerald-300 hover:underline"
                              >
                                Explain formula &rarr;
                              </button>
                            </div>
                          </div>

                          <MathFormulaBlock formula={eq.formula} title={eq.title} />

                          <p className="text-sm text-white/85 leading-relaxed">
                            <strong className="text-white">Intuition:</strong> {eq.intuition}
                          </p>

                          {/* Variable breakdown drawer */}
                          {isInspecting && (
                            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2 text-xs animate-fade-in">
                              <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-300">
                                Variable Glossary &amp; Formulation Scope
                              </div>
                              <div className="space-y-1.5 text-white/80">
                                <div>• <strong>Formula:</strong> <code className="font-mono text-emerald-200">{eq.formula}</code></div>
                                <div>• <strong>Theoretical Basis:</strong> {eq.intuition}</div>
                                <div>• <strong>Empirical Boundary:</strong> Evaluated under the methodology described in {item.sourceName} ({item.publishedAt}).</div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Progressive Disclosure: Interactive Parameter Simulation & Diagram Inspector */}
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowInlineLab((prev) => !prev)}
                    className="px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/12 text-xs font-medium text-white transition-colors inline-flex items-center gap-2"
                  >
                    <Sliders className="w-3.5 h-3.5 text-emerald-300" />
                    <span>
                      {showInlineLab
                        ? 'Hide Interactive Parameter Simulation'
                        : 'Explore Interactive Parameter Simulation'}
                    </span>
                    {showInlineLab ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setActiveFigureLightbox({
                        title: `Architecture & Methodology Pipeline: ${item.title}`,
                        caption: `System architecture and empirical dataflow for "${item.title}" (${item.domain}). Maps the end-to-end mechanism from foundational inputs through experimental execution to verified empirical conclusions.`,
                        diagramType: item.artworkTheme,
                      })
                    }
                    className="px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/12 text-xs font-medium text-white transition-colors inline-flex items-center gap-2"
                  >
                    <ZoomIn className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Inspect System Architecture Diagram</span>
                  </button>
                </div>

                {showInlineLab && (
                  <div className="mt-4">
                    <VisualLaboratory initialSandboxId={item.visualSandboxId} />
                  </div>
                )}
              </section>

              {/* SECTION 4: FINDINGS & EVIDENCE */}
              <section id="sec-findings" className="space-y-6 pt-12 sm:pt-14 border-t border-white/[0.08]">
                <div className="flex flex-wrap items-baseline justify-between gap-3 pb-3 border-b border-white/[0.06]">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono tracking-widest uppercase text-emerald-400 font-semibold">
                      04 // EVIDENCE &amp; FINDINGS
                    </span>
                    <h2 className={`${getReaderHeadingClasses('h2')} mt-1.5`}>
                      Key Findings &amp; Empirical Results
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleInlineReaderAction(
                        'explain_selection',
                        'Summarize the empirical findings and how they were measured.',
                        `${item.readerLayers.methodsAndEvidence} ${item.readerLayers.findings}`,
                        'Findings Summary'
                      )
                    }
                    className="px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-xs font-medium text-emerald-300 hover:text-emerald-200 transition-colors inline-flex items-center gap-1.5"
                  >
                    <span>Summarize findings &rarr;</span>
                  </button>
                </div>

                <div className="space-y-4">
                  <p className={getReaderParagraphClasses()}>{item.readerLayers.methodsAndEvidence}</p>
                  <p className={getReaderParagraphClasses()}>{item.readerLayers.findings}</p>
                </div>

                <div className="p-5 sm:p-6 rounded-2xl bg-white/[0.025] border-l-4 border-emerald-400 border-y border-r border-white/[0.08] text-sm text-white/90 leading-relaxed">
                  <span className="text-emerald-300 font-semibold block text-xs uppercase tracking-wider font-mono mb-1">
                    Practical &amp; Engineering Applications
                  </span>
                  {item.readerLayers.applicationsAndImplications}
                </div>
              </section>

              {/* SECTION 5: LIMITATIONS & OPEN QUESTIONS */}
              <section id="sec-limitations" className="space-y-6 pt-12 sm:pt-14 border-t border-white/[0.08]">
                <div className="flex flex-wrap items-baseline justify-between gap-3 pb-3 border-b border-white/[0.06]">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-[10px] font-mono tracking-widest uppercase text-amber-400 font-semibold">
                      05 // LIMITATIONS &amp; FALSIFIABILITY
                    </span>
                    <h2 className={`${getReaderHeadingClasses('h2')} mt-1.5`}>
                      Limitations, Caveats &amp; Open Questions
                    </h2>
                  </div>
                </div>

                <div className="p-5 sm:p-6 rounded-2xl bg-amber-950/20 border-l-4 border-amber-400 border-y border-r border-amber-500/20 space-y-4">
                  <div className={getReaderParagraphClasses()}>
                    {item.readerLayers.limitationsAndUncertainty}
                  </div>
                  <div className="pt-3 border-t border-amber-500/20 text-xs sm:text-sm text-amber-100/90 leading-relaxed">
                    <strong className="text-amber-300 font-mono uppercase tracking-wider block mb-1">
                      Falsifiability &amp; Verification Criteria:
                    </strong>
                    {item.readerLayers.criticalAnalysisAndFalsifiability}
                  </div>
                </div>
              </section>

              {/* SECTION 6: CITATION NETWORK, MULTI-SOURCE PROVENANCE & REFERENCES */}
              <section id="sec-references" className="space-y-6 pt-12 sm:pt-14 border-t border-white/[0.08]">
                <div className="flex flex-wrap items-baseline justify-between gap-3 pb-3 border-b border-white/[0.06]">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono tracking-widest uppercase text-emerald-400 font-semibold">
                      06 // CITATION NETWORK &amp; REPOSITORIES
                    </span>
                    <h2 className={`${getReaderHeadingClasses('h2')} mt-1.5`}>
                      Interactive Citation Graph &amp; Source References
                    </h2>
                  </div>
                </div>

                {/* D3 Interactive Citation Network Visualization */}
                <CitationNetworkGraph
                  item={item}
                  allDiscoveries={allDiscoveries}
                  onSelectDiscovery={onSelectDiscovery}
                  onTriggerGlobalSearch={onTriggerGlobalSearch}
                  onOpenRepoInExplorer={onOpenRepoInExplorer}
                />

                <div className="space-y-3 pt-2">
                  <div className="text-xs font-mono uppercase tracking-wider text-white/55">
                    Bibliographic References &amp; Verified Records
                  </div>
                  {item.readerLayers.references.map((ref) => (
                    <div
                      key={ref.id}
                      className="p-4 sm:p-5 rounded-2xl bg-white/[0.025] border border-white/[0.08] hover:border-white/15 transition-colors flex flex-wrap items-center justify-between gap-3 text-sm"
                    >
                      <div className="space-y-1">
                        <div className="font-semibold text-white">{ref.label}</div>
                        <div className="text-xs text-white/60">
                          {ref.authors} · {ref.venue} ({ref.year}) ·{' '}
                          <span className="text-emerald-300 font-medium">{ref.statusLabel}</span>
                        </div>
                      </div>
                      <a
                        href={ref.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-full orbit-glass-pill text-xs font-mono text-emerald-300 hover:bg-white/15 transition-colors inline-flex items-center gap-1.5"
                      >
                        <span>View Source</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ))}
                </div>
              </section>

              {/* SECTION 7: RELATED RESEARCH & CONTINUED LEARNING */}
              <section id="sec-related" className="space-y-6 pt-12 sm:pt-14 border-t border-white/[0.08]">
                <div className="flex flex-wrap items-baseline justify-between gap-3 pb-3 border-b border-white/[0.06]">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono tracking-widest uppercase text-emerald-400 font-semibold">
                      07 // EXTENSIONS &amp; ADJACENT WORK
                    </span>
                    <h2 className={`${getReaderHeadingClasses('h2')} mt-1.5`}>
                      Related Research &amp; Continued Learning
                    </h2>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-300">
                    Connected Learning Path
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {(
                    allDiscoveries
                      .filter((d) => d.id !== item.id && (d.domain === item.domain || d.sourceType === item.sourceType))
                      .slice(0, 2).length > 0
                      ? allDiscoveries
                          .filter((d) => d.id !== item.id && (d.domain === item.domain || d.sourceType === item.sourceType))
                          .slice(0, 2)
                      : allDiscoveries.filter((d) => d.id !== item.id).slice(0, 2)
                  ).map((rel) => (
                    <div
                      key={rel.id}
                      className="p-5 rounded-2xl bg-white/[0.025] border border-white/[0.08] hover:border-emerald-500/30 transition-all flex flex-col justify-between space-y-3.5 group"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-emerald-300">{rel.domain}</span>
                          <span className="text-white/50">{rel.sourceName}</span>
                        </div>
                        <h4
                          onClick={() => {
                            if (onSelectDiscovery) {
                              onSelectDiscovery(rel);
                            }
                          }}
                          className="font-bold text-base text-white hover:text-emerald-200 cursor-pointer leading-snug"
                        >
                          {rel.title}
                        </h4>
                        <p className="text-xs text-white/70 line-clamp-2 leading-relaxed">
                          {rel.oneSentenceWhyItMatters}
                        </p>
                      </div>

                      <div className="pt-2 flex items-center justify-between border-t border-white/[0.06] text-xs">
                        <span className="text-white/50 text-[11px] font-mono">
                          Published {rel.publishedAt}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (onSelectDiscovery) {
                              onSelectDiscovery(rel);
                            }
                          }}
                          className="px-3 py-1 rounded-full bg-white text-[#0B0A0E] text-xs font-semibold hover:bg-white/90 transition-colors inline-flex items-center gap-1 shadow-sm"
                        >
                          <span>Open in Reader</span>
                          <BookOpen className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* CALM BOTTOM WORKFLOW BAR: Explain or Create Study Notes */}
              <footer className="pt-8 border-t border-white/15 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="text-sm font-semibold text-white">
                    Reading Progress: {readingProgress}%
                  </div>
                  <div className="text-xs text-white/60">
                    Ask for a paper-level explanation or generate a structured study note document.
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setMode('explain')}
                    className="px-5 py-2.5 rounded-full orbit-glass-pill text-xs sm:text-sm font-medium text-white hover:bg-white/20 transition-colors inline-flex items-center gap-2"
                  >
                    <GraduationCap className="w-4 h-4 text-emerald-300" />
                    <span>Explain This Paper</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('notes')}
                    className="px-5 py-2.5 rounded-full bg-white text-[#0B0A0E] text-xs sm:text-sm font-bold hover:bg-white/90 transition-colors inline-flex items-center gap-2 shadow-md"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Create Study Notes</span>
                  </button>
                </div>
              </footer>
            </article>
          )}

          {/* MODE 2: EXPLAIN THIS PAPER (BUG 3 FIX: Clean, Uncrowded Conversational Design) */}
          {mode === 'explain' && (
            <div className="flex-1 px-5 sm:px-10 md:px-16 py-8 sm:py-12 max-w-[70ch] mx-auto flex flex-col justify-between space-y-6">
              <div className="space-y-6">
                {/* Clean, Minimal Header with Secondary Settings Control */}
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/10">
                  <div className="space-y-1">
                    <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                      Explain this paper
                    </h2>
                    <p className="text-xs sm:text-sm text-white/65 leading-relaxed">
                      Ask questions about <strong>{item.title}</strong>, summarize key findings, or unpack difficult sections.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowExplainSettings((prev) => !prev)}
                    aria-label="Explanation settings"
                    aria-expanded={showExplainSettings}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium inline-flex items-center gap-1.5 shrink-0 transition-colors ${
                      showExplainSettings
                        ? 'bg-white/15 text-white'
                        : 'orbit-glass-pill text-white/75 hover:text-white'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Settings</span>
                  </button>
                </div>

                {/* Secondary Collapsible Settings Menu (Hidden by default to keep initial state calm) */}
                {showExplainSettings && (
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-white/60">Language:</span>
                      <div className="flex items-center rounded-full bg-black/40 p-0.5 border border-white/10">
                        <button
                          type="button"
                          onClick={() => onLanguageChange('en')}
                          className={`px-3 py-1 rounded-full transition-colors ${
                            language === 'en'
                              ? 'bg-white text-[#0B0A0E] font-semibold'
                              : 'text-white/70'
                          }`}
                        >
                          English
                        </button>
                        <button
                          type="button"
                          onClick={() => onLanguageChange('hinglish')}
                          className={`px-3 py-1 rounded-full transition-colors ${
                            language === 'hinglish'
                              ? 'bg-white text-[#0B0A0E] font-semibold'
                              : 'text-white/70'
                          }`}
                        >
                          Hinglish
                        </button>
                      </div>

                      <span className="text-white/60 ml-2">Depth:</span>
                      <div className="flex items-center rounded-full bg-black/40 p-0.5 border border-white/10">
                        {(['beginner', 'mixed', 'advanced'] as DifficultyLevel[]).map((lvl) => (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => onDifficultyChange(lvl)}
                            className={`px-2.5 py-1 rounded-full capitalize transition-colors ${
                              difficulty === lvl
                                ? 'bg-emerald-400 text-[#0B0A0E] font-semibold'
                                : 'text-white/65'
                            }`}
                          >
                            {lvl}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {item.quiz.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowQuickQuiz((prev) => !prev)}
                          className="text-emerald-300 hover:underline"
                        >
                          {showQuickQuiz ? 'Hide concept quiz' : 'Open concept quiz'}
                        </button>
                      )}
                      {explainTurns.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setExplainTurns([])}
                          className="text-white/60 hover:text-white"
                        >
                          Clear conversation
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Contextual Suggestions (Shown cleanly in initial state before any question is asked) */}
                {explainTurns.length === 0 && !explainLoading && (
                  <div className="space-y-3 py-4">
                    <span className="text-xs text-white/50 block">
                      Suggested questions
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {[
                        {
                          label: 'Summarize key findings',
                          prompt:
                            'Summarize the core empirical findings and main methodological limitations of this paper.',
                          actionType: 'explain_paper' as ProfessorActionType,
                        },
                        {
                          label: 'Explain a difficult section',
                          prompt:
                            'Explain the core mechanism and methodology of this paper step by step with a simple analogy.',
                          actionType: 'explain_paper' as ProfessorActionType,
                        },
                        {
                          label: 'Walk through the core formula',
                          prompt:
                            'Explain the primary mathematical equation in this paper and what each variable represents.',
                          actionType: 'ask_question' as ProfessorActionType,
                        },
                        {
                          label: 'What are the main limitations?',
                          prompt:
                            'What are the key boundary assumptions, limitations, and open questions in this research?',
                          actionType: 'ask_question' as ProfessorActionType,
                        },
                      ].map((sug) => (
                        <button
                          key={sug.label}
                          type="button"
                          onClick={() =>
                            handleAskExplainPaper(sug.prompt, sug.actionType)
                          }
                          className="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-xs text-white/85 hover:text-white transition-colors text-left"
                        >
                          {sug.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Conversation Thread (Only shown after the user asks a question) */}
                {explainTurns.length > 0 && (
                  <div className="space-y-4">
                    {explainTurns.map((turn) => {
                      const isUser = turn.role === 'user';
                      return (
                        <div
                          key={turn.id}
                          className={`flex flex-col ${
                            isUser ? 'items-end' : 'items-start'
                          }`}
                        >
                          <div
                            className={`w-full max-w-[92%] rounded-2xl p-4 sm:p-5 space-y-3 ${
                              isUser
                                ? 'bg-white text-[#0B0A0E] rounded-br-xs shadow-sm'
                                : 'bg-white/[0.04] border border-white/12 text-[#ECEAE4] rounded-bl-xs'
                            }`}
                          >
                            {turn.selectedPassage && (
                              <div
                                className={`p-2.5 rounded-xl text-xs italic border-l-2 ${
                                  isUser
                                    ? 'bg-black/10 border-[#0B0A0E]/40 text-[#0B0A0E]/80'
                                    : 'bg-black/40 border-emerald-400 text-white/80'
                                }`}
                              >
                                &ldquo;{turn.selectedPassage}&rdquo;
                              </div>
                            )}

                            <div className="text-sm sm:text-base leading-[1.75] whitespace-pre-line">
                              {turn.text}
                            </div>

                            {!isUser && turn.analogies && (
                              <div className="p-3 rounded-xl bg-emerald-500/[0.07] border border-emerald-500/20 text-xs sm:text-sm text-emerald-100 leading-relaxed">
                                <strong className="text-emerald-300">Intuition &amp; Analogy: </strong>
                                {turn.analogies}
                              </div>
                            )}

                            {!isUser && turn.caveats && (
                              <div className="text-xs text-amber-200/90 leading-relaxed">
                                <strong>Boundary / Limitation: </strong>
                                {turn.caveats}
                              </div>
                            )}

                            {/* Source Reference & Follow-Up Actions Near the Response */}
                            {!isUser && (
                              <div className="pt-2.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
                                {turn.sourceReference && (
                                  <a
                                    href={turn.sourceReference.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-white/55 hover:text-emerald-300 inline-flex items-center gap-1"
                                  >
                                    <span>Source: {turn.sourceReference.canonicalId}</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}

                                <div className="flex flex-wrap items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleAskExplainPaper(
                                        'Explain that in simpler terms with a concrete example.',
                                        'explain_paper'
                                      )
                                    }
                                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white/85 hover:text-white transition-colors"
                                  >
                                    Explain simpler
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleAppendPassageToNotes(turn.text)}
                                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-emerald-300 transition-colors"
                                  >
                                    {passageAddedToast
                                      ? '✓ Saved to Notes'
                                      : '+ Save to Study Notes'}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {explainLoading && (
                  <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center gap-2.5 text-xs text-emerald-300">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Generating explanation from verified paper context...</span>
                  </div>
                )}

                {explainError && (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs text-amber-200">
                    <span>{explainError}</span>
                    {lastExplainAttempt && (
                      <button
                        type="button"
                        onClick={() =>
                          handleAskExplainPaper(
                            lastExplainAttempt.question,
                            lastExplainAttempt.actionType,
                            lastExplainAttempt.passage
                          )
                        }
                        className="px-3 py-1.5 rounded-lg bg-white text-[#0B0A0E] font-semibold hover:bg-white/90 shrink-0"
                      >
                        Retry
                      </button>
                    )}
                  </div>
                )}

                {/* Optional Concept Quiz (Only shown if explicitly toggled via Settings or Quiz tab) */}
                {showQuickQuiz && item.quiz.length > 0 && (
                  <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-white">
                        Concept Check ({item.quiz.length} Questions)
                      </h3>
                      <button
                        type="button"
                        onClick={() => setShowQuickQuiz(false)}
                        className="text-xs text-white/60 hover:text-white"
                      >
                        Close quiz
                      </button>
                    </div>
                    {item.quiz.map((q, qIdx) => {
                      const userChoice = selectedAnswers[q.id];
                      const isCorrect = userChoice === q.correctIndex;
                      return (
                        <div key={q.id} className="space-y-2.5">
                          <div className="text-sm font-semibold text-white">
                            {qIdx + 1}. {q.question}
                          </div>
                          <div className="space-y-2">
                            {q.options.map((opt, oIdx) => {
                              const selected = userChoice === oIdx;
                              return (
                                <button
                                  key={oIdx}
                                  type="button"
                                  onClick={() => {
                                    setSelectedAnswers((prev) => ({
                                      ...prev,
                                      [q.id]: oIdx,
                                    }));
                                    setQuizSubmitted(false);
                                  }}
                                  className={`w-full text-left p-3 rounded-xl border text-xs sm:text-sm transition-colors ${
                                    selected
                                      ? 'bg-white text-[#0B0A0E] border-white font-medium'
                                      : 'bg-white/[0.03] text-white/80 border-white/10 hover:bg-white/[0.08]'
                                  }`}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                          {quizSubmitted && userChoice !== undefined && (
                            <div
                              className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                                isCorrect
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                                  : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                              }`}
                            >
                              <div className="font-semibold">
                                {isCorrect ? '✓ Correct' : '× Review Concept:'}
                              </div>
                              <p>{q.explanationWhyRight}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <button
                      type="button"
                      onClick={handleQuizSubmit}
                      className="px-5 py-2 rounded-full bg-white text-[#0B0A0E] text-xs font-bold hover:bg-white/90 transition-colors"
                    >
                      Check Answers
                    </button>
                  </div>
                )}

                <div ref={explainEndRef} />
              </div>

              {/* Single Clean Message Input at Bottom */}
              <div className="pt-4 border-t border-white/10 space-y-3">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAskExplainPaper(explainInput, 'ask_question');
                  }}
                  className="flex items-center gap-2.5"
                >
                  <input
                    type="text"
                    value={explainInput}
                    onChange={(e) => setExplainInput(e.target.value)}
                    placeholder={
                      language === 'hinglish'
                        ? 'Is paper ke baare mein apna sawal poochein...'
                        : 'Ask a question about this paper...'
                    }
                    className="flex-1 rounded-2xl bg-black/50 border border-white/15 px-4 py-3 text-sm text-white placeholder:text-white/45 focus:outline-none focus:border-emerald-400"
                  />
                  <button
                    type="submit"
                    disabled={explainLoading || !explainInput.trim()}
                    className="px-5 py-3 rounded-2xl bg-white text-[#0B0A0E] text-xs font-bold hover:bg-white/90 transition-colors disabled:opacity-50 shrink-0 inline-flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Ask</span>
                  </button>
                </form>

                <div className="flex items-center justify-between text-xs text-white/55">
                  <button
                    type="button"
                    onClick={() => setMode('reader')}
                    className="hover:text-white transition-colors"
                  >
                    ← Back to paper ({readingProgress}% read)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('notes')}
                    className="text-emerald-300 hover:underline inline-flex items-center gap-1"
                  >
                    <span>Create study notes</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODE 3: DOCUMENT-LED STUDY NOTES WORKSPACE WITH REAL DEBOUNCED AUTOSAVE */}
          {mode === 'notes' && (
            <div className="flex-1 px-5 sm:px-10 md:px-16 py-8 sm:py-10 max-w-[78ch] mx-auto space-y-7">
              {/* Calm Document Action Header with Explicit Autosave Indicator */}
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/12 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono">
                    {autosaveState === 'saving' && (
                      <span className="text-amber-300 inline-flex items-center gap-1.5">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>Autosaving changes...</span>
                      </span>
                    )}
                    {autosaveState === 'saved' && (
                      <span className="text-emerald-300 inline-flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>All changes saved in My Notes (Local + SQLite)</span>
                      </span>
                    )}
                    {autosaveState === 'error' && (
                      <span className="text-rose-300">
                        ▲ Saved locally (Server sync error — click Save to retry)
                      </span>
                    )}
                    {autosaveState === 'idle' && (
                      <span className="text-white/70">
                        Study Document Preview · Click Save or edit any field to autosave
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/65 mt-0.5">
                    Structured academic study document linked to <strong>{item.title}</strong>.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNoteOutline((prev) => !prev)}
                    className="px-3 py-2 rounded-full orbit-glass-pill text-xs font-medium text-white/85 hover:text-white transition-colors inline-flex items-center gap-1.5"
                  >
                    <List className="w-3.5 h-3.5" />
                    <span>{showNoteOutline ? 'Hide Outline' : 'Outline'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingNote((prev) => !prev)}
                    className="px-3.5 py-2 rounded-full orbit-glass-pill text-xs font-medium text-white hover:bg-white/20 transition-colors"
                  >
                    {isEditingNote ? 'Reading View' : 'Edit Document'}
                  </button>
                  <button
                    type="button"
                    onClick={handleEnhanceDraftWithAi}
                    disabled={aiNoteEnhancing}
                    className="px-3.5 py-2 rounded-full orbit-glass-pill text-xs font-medium text-white hover:bg-white/20 disabled:opacity-50 transition-colors"
                  >
                    {aiNoteEnhancing ? 'Refining...' : 'Refine with AI'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyNote}
                    className="px-3.5 py-2 rounded-full orbit-glass-pill text-xs font-medium text-white hover:bg-white/20 transition-colors inline-flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedToast ? 'Copied!' : 'Copy'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadNoteMarkdown}
                    className="px-3.5 py-2 rounded-full orbit-glass-pill text-xs font-medium text-white hover:bg-white/20 transition-colors inline-flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>.md</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExplicitSaveNote}
                    disabled={autosaveState === 'saving'}
                    className="px-4 py-2 rounded-full bg-white text-[#0B0A0E] text-xs font-bold hover:bg-white/90 transition-colors inline-flex items-center gap-1.5 shadow-md"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>
                      {autosaveState === 'saved' ? 'Saved in My Notes' : 'Save to My Notes'}
                    </span>
                  </button>
                </div>
              </div>

              {autosaveState === 'saved' && onOpenMyNotes && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-200">
                  <span>This study document is saved in your permanent notebook.</span>
                  <button
                    type="button"
                    onClick={() => onOpenMyNotes(noteDraft.id)}
                    className="font-semibold underline hover:text-white"
                  >
                    Open in My Notes Workspace →
                  </button>
                </div>
              )}

              {/* Collapsible Document Outline / Table of Contents */}
              {showNoteOutline && (
                <nav
                  aria-label="Study note sections"
                  className="p-4 rounded-2xl bg-[#15141D] border border-white/10 space-y-2.5"
                >
                  <div className="text-[11px] font-mono uppercase tracking-wider text-emerald-300">
                    Document Structure &amp; Quick Jump
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {[
                      { id: 'modal-note-sec-1', label: '1. Overview & Significance' },
                      { id: 'modal-note-sec-2', label: '2. Key Concepts & Definitions' },
                      { id: 'modal-note-sec-3', label: '3. Methodology & Mechanism' },
                      { id: 'modal-note-sec-4', label: '4. Worked Examples' },
                      { id: 'modal-note-sec-5', label: '5. Formulas & Equations' },
                      { id: 'modal-note-sec-6', label: '6. Findings & Evidence Table' },
                      { id: 'modal-note-sec-7', label: '7. Takeaways & Revision' },
                      { id: 'modal-note-sec-8', label: '8. Personal Notes & Citations' },
                    ].map((sec) => (
                      <button
                        key={sec.id}
                        type="button"
                        onClick={() => scrollToSection(sec.id)}
                        className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-white/80 hover:text-white transition-colors"
                      >
                        {sec.label}
                      </button>
                    ))}
                  </div>
                </nav>
              )}

              {/* CONTINUOUS VERTICAL DOCUMENT SHEET */}
              <div className="p-6 sm:p-10 rounded-[28px] bg-[#16151E] border border-white/10 space-y-8 shadow-xl">
                {/* Document Title & Source Link */}
                <header className="space-y-2 pb-6 border-b border-white/10">
                  <div className="text-xs font-mono text-emerald-300">
                    STUDY NOTE · {item.domain.toUpperCase()}
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                    {noteDraft.discoveryTitle}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-white/60 pt-1">
                    <span>Source: {item.sourceName}</span>
                    <span>·</span>
                    <span>Published: {item.publishedAt}</span>
                    <span>·</span>
                    <a
                      href={noteDraft.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-300 hover:underline inline-flex items-center gap-1"
                    >
                      <span>Original Paper ({item.canonicalId})</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </header>

                {/* 1. Introduction & Overview */}
                <section id="modal-note-sec-1" className="space-y-3">
                  <h2 className="text-lg font-bold text-white">
                    1. Introduction &amp; Executive Summary
                  </h2>
                  {isEditingNote ? (
                    <textarea
                      rows={5}
                      value={noteDraft.executiveSummary}
                      onChange={(e) =>
                        updateNoteFieldWithAutosave((prev) => ({
                          ...prev,
                          executiveSummary: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl bg-black/40 border border-white/15 p-4 text-sm sm:text-base text-white leading-relaxed focus:outline-none focus:border-white/40"
                    />
                  ) : (
                    <p className="text-base text-[#ECEAE4] leading-[1.8]">
                      {noteDraft.executiveSummary}
                    </p>
                  )}

                  {/* Callout Box for Core Significance */}
                  <div className="p-4 rounded-2xl bg-emerald-500/[0.07] border-l-4 border-emerald-400 space-y-1">
                    <div className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">
                      Key Significance
                    </div>
                    {isEditingNote ? (
                      <textarea
                        rows={2}
                        value={noteDraft.whyItMatters}
                        onChange={(e) =>
                          updateNoteFieldWithAutosave((prev) => ({
                            ...prev,
                            whyItMatters: e.target.value,
                          }))
                        }
                        className="w-full rounded-lg bg-black/40 border border-white/15 p-2.5 text-sm text-white"
                      />
                    ) : (
                      <p className="text-sm sm:text-base text-white/90 leading-relaxed">
                        {noteDraft.whyItMatters}
                      </p>
                    )}
                  </div>
                </section>

                {/* 2. Key Concepts & Definitions */}
                <section id="modal-note-sec-2" className="space-y-3 pt-4 border-t border-white/10">
                  <h2 className="text-lg font-bold text-white">
                    2. Key Concepts &amp; Definitions
                  </h2>
                  <div className="space-y-3">
                    {noteDraft.coreConceptsAndDefinitions.map((c, idx) => (
                      <div key={idx} className="text-base text-[#ECEAE4] leading-[1.75]">
                        <strong className="text-white">{c.term}: </strong>
                        <span>{c.definition}</span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* 3. Methodology & Step-by-Step Mechanism */}
                <section id="modal-note-sec-3" className="space-y-3 pt-4 border-t border-white/10">
                  <h2 className="text-lg font-bold text-white">
                    3. Methodology &amp; Core Mechanism
                  </h2>
                  <ol className="list-decimal list-inside space-y-2.5 text-base text-[#ECEAE4] leading-[1.8]">
                    {noteDraft.mechanismSteps.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ol>
                </section>

                {/* 4. Worked Examples & Applied Scenarios */}
                <section id="modal-note-sec-4" className="space-y-3 pt-4 border-t border-white/10">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-lg font-bold text-white">
                      4. Worked Examples &amp; Concrete Scenarios
                    </h2>
                    <button
                      type="button"
                      onClick={() =>
                        updateNoteFieldWithAutosave((prev) => ({
                          ...prev,
                          workedExamples: `${prev.workedExamples ? `${prev.workedExamples}\n\n` : ''}Quantitative Walkthrough (${item.sourceName}):\n• Input Parameters: Baseline constraints from ${item.title}.\n• Transformation: ${item.readerLayers.coreMechanism[0] || 'Execute primary mechanism'}.\n• Empirical Verification: ${item.readerLayers.findings}`,
                        }))
                      }
                      className="px-3 py-1 rounded-full orbit-glass-pill text-xs text-emerald-300 hover:text-white transition-colors"
                    >
                      + Append Worked Example
                    </button>
                  </div>

                  {isEditingNote ? (
                    <textarea
                      rows={5}
                      value={noteDraft.workedExamples || ''}
                      onChange={(e) =>
                        updateNoteFieldWithAutosave((prev) => ({
                          ...prev,
                          workedExamples: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl bg-black/40 border border-white/15 p-4 text-sm text-white leading-relaxed focus:outline-none focus:border-white/40"
                    />
                  ) : (
                    <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 text-sm sm:text-base text-[#ECEAE4] whitespace-pre-line leading-[1.8]">
                      {noteDraft.workedExamples ||
                        `Applied Scenario: ${item.readerLayers.applicationsAndImplications}`}
                    </div>
                  )}
                </section>

                {/* 5. Formulas & Key Equations (High-Fidelity KaTeX) */}
                <section id="modal-note-sec-5" className="space-y-3 pt-4 border-t border-white/10">
                  <h2 className="text-lg font-bold text-white">
                    5. Key Formulas &amp; Mathematical Intuition (LaTeX)
                  </h2>
                  {noteDraft.equations.length > 0 ? (
                    noteDraft.equations.map((eq) => (
                      <div
                        key={eq.id}
                        className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3"
                      >
                        <div className="text-xs font-semibold text-white/85">{eq.title}</div>
                        <MathFormulaBlock formula={eq.formula} title={eq.title} />
                        <div className="text-sm text-white/80 leading-relaxed">
                          <LatexTextRenderer text={eq.intuition} />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-white/65 italic">
                      Conceptual / empirical study — no formal closed-form equations specified in source metadata.
                    </p>
                  )}
                </section>

                {/* 6. Findings, Evidence Summary Table & Limitations */}
                <section id="modal-note-sec-6" className="space-y-4 pt-4 border-t border-white/10">
                  <h2 className="text-lg font-bold text-white">
                    6. Empirical Findings, Evidence Table &amp; Limitations
                  </h2>
                  <p className="text-base text-[#ECEAE4] leading-[1.8] whitespace-pre-line">
                    {noteDraft.methodsAndEvidence}
                  </p>

                  {/* Structured Evidence & Provenance Summary Table */}
                  <div className="overflow-x-auto rounded-2xl border border-white/10">
                    <table className="w-full text-left border-collapse text-xs sm:text-sm">
                      <thead>
                        <tr className="bg-white/[0.06] text-white/80 border-b border-white/10">
                          <th className="py-2.5 px-4 font-semibold">Dimension</th>
                          <th className="py-2.5 px-4 font-semibold">Verified Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10 text-[#ECEAE4]">
                        <tr>
                          <td className="py-2.5 px-4 font-medium text-white/70">Evidence Tier</td>
                          <td className="py-2.5 px-4">{item.evidenceStatus} ({item.sourceName})</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-4 font-medium text-white/70">Primary Finding</td>
                          <td className="py-2.5 px-4">{item.readerLayers.findings}</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-4 font-medium text-white/70">Practical Impact</td>
                          <td className="py-2.5 px-4">{item.readerLayers.applicationsAndImplications}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-500/[0.06] border border-amber-500/20 text-sm text-amber-100/90 leading-relaxed whitespace-pre-line">
                    <strong className="text-amber-300 block mb-1">
                      Limitations &amp; Open Questions:
                    </strong>
                    {noteDraft.limitationsAndCritique}
                  </div>
                </section>

                {/* 7. Key Revision Takeaways & Practice Questions */}
                <section id="modal-note-sec-7" className="space-y-4 pt-4 border-t border-white/10">
                  <h2 className="text-lg font-bold text-white">
                    7. Summary Takeaways &amp; Revision Check
                  </h2>
                  <ul className="space-y-2 text-base text-[#ECEAE4] leading-[1.75]">
                    {noteDraft.examRevisionSheet.map((b, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <span className="text-emerald-400 mt-1">•</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>

                  {noteDraft.flashcards && noteDraft.flashcards.length > 0 && (
                    <div className="space-y-2.5 pt-2">
                      <div className="text-xs font-mono uppercase tracking-wider text-emerald-300">
                        Active Recall Questions
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {noteDraft.flashcards.map((fc) => (
                          <div
                            key={fc.id}
                            className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1.5 text-xs sm:text-sm"
                          >
                            <div className="font-semibold text-white">Q: {fc.front}</div>
                            <div className="text-white/75">A: {fc.back}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </section>

                {/* 8. Personal Notes & Selected Passages (Always editable with debounced autosave) */}
                <section id="modal-note-sec-8" className="space-y-3 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white">
                      8. Personal Notes &amp; Quoted Passages
                    </h2>
                    <span className="text-xs font-mono text-white/45">
                      Autosaves as you type
                    </span>
                  </div>
                  <textarea
                    rows={5}
                    value={noteDraft.userPersonalAnnotations}
                    onChange={(e) =>
                      updateNoteFieldWithAutosave((prev) => ({
                        ...prev,
                        userPersonalAnnotations: e.target.value,
                      }))
                    }
                    placeholder="Write your own insights, questions, or synthesis here (automatically saved to My Notes)..."
                    className="w-full rounded-2xl bg-black/35 border border-white/15 p-4 text-sm sm:text-base text-white placeholder:text-white/40 leading-relaxed focus:outline-none focus:border-white/35"
                  />
                </section>

                {/* 9. Linked References */}
                <section className="space-y-2 pt-4 border-t border-white/10 text-xs text-white/65">
                  <div className="font-semibold text-white uppercase tracking-wider">
                    Source Reference
                  </div>
                  {noteDraft.citations.map((cit) => (
                    <div key={cit.id}>
                      {cit.authors} ({cit.year}). <em>{cit.label}</em>. {cit.venue}.{' '}
                      <a
                        href={cit.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-300 hover:underline"
                      >
                        {cit.url}
                      </a>
                    </div>
                  ))}
                </section>
              </div>
            </div>
          )}
        </div>

        {/* FIGURE & ARCHITECTURE DIAGRAM LIGHTBOX MODAL */}
        {activeFigureLightbox && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in"
            onClick={() => setActiveFigureLightbox(null)}
          >
            <div
              className="w-full max-w-2xl bg-[#161422] border border-emerald-500/35 rounded-3xl p-6 space-y-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300 block">
                    System Architecture &amp; Methodology Diagram
                  </span>
                  <h3 className="text-lg font-bold text-white mt-0.5">
                    {activeFigureLightbox.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveFigureLightbox(null)}
                  className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Schematic Diagram Canvas / Card */}
              <div className="p-6 rounded-2xl bg-black/60 border border-white/10 flex flex-col items-center justify-center space-y-3">
                <div className="w-full h-44 rounded-xl bg-gradient-to-br from-emerald-950/40 via-black/80 to-purple-950/30 border border-white/10 flex items-center justify-center p-4 text-center">
                  <div className="space-y-2 max-w-md">
                    <Compass className="w-8 h-8 text-emerald-400 mx-auto" />
                    <div className="text-xs font-mono text-emerald-200">
                      [Verified Empirical Dataflow Pipeline]
                    </div>
                    <div className="text-xs text-white/70">
                      Inputs &rarr; Core Mathematical Transformation &rarr; Empirical Measurement &rarr; Falsifiable Output
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-white/85 leading-relaxed">
                {activeFigureLightbox.caption}
              </p>

              <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const caption = activeFigureLightbox.caption;
                    setActiveFigureLightbox(null);
                    handleInlineReaderAction(
                      'explain_selection',
                      `Explain the system architecture and dataflow diagram of "${item.title}" in detail.`,
                      caption,
                      'System Architecture Explanation'
                    );
                  }}
                  className="px-4 py-2 rounded-full bg-emerald-400 text-[#0B0A0E] text-xs font-bold hover:bg-emerald-300 transition-colors inline-flex items-center gap-1.5"
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Ask Professor About This Diagram</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFigureLightbox(null)}
                  className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FLOATING QUICK-EXIT FOCUS MODE BUTTON */}
        {isFocusMode && (
          <button
            type="button"
            onClick={toggleFocusMode}
            className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-full bg-[#181624]/95 border border-emerald-400/40 text-emerald-200 hover:text-white hover:bg-emerald-500/25 text-xs font-semibold shadow-2xl backdrop-blur-md inline-flex items-center gap-2 transition-all cursor-pointer"
            title="Exit focus mode and return to standard view (Esc)"
          >
            <Minimize2 className="w-4 h-4 text-emerald-300" />
            <span>Exit Focus Mode</span>
            <span className="opacity-70 font-mono text-[10px] ml-0.5">(Esc)</span>
          </button>
        )}
      </div>
    </div>
  );
};
