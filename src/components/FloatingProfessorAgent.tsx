import React, { useState, useEffect, useRef } from 'react';
import {
  DiscoveryItem,
  DifficultyLevel,
  ExplanationLanguage,
  ProfessorActionType,
  ProfessorAgentMessage,
  ProfessorContextPayload,
  ProfessorProposedChange,
  StructuredNote,
} from '../types/orbit';
import {
  GraduationCap,
  Sparkles,
  Send,
  X,
  RotateCcw,
  PlusCircle,
  Check,
  AlertTriangle,
  BookOpen,
  FileText,
  ExternalLink,
  Quote,
  Square,
  Undo2,
  HelpCircle,
  Table,
  Search,
  SlidersHorizontal,
  Wrench,
} from 'lucide-react';

interface FloatingProfessorAgentProps {
  routeSection: 'discover' | 'repositories' | 'library' | 'notes';
  librarySubTab?: string;
  isReaderModalOpen: boolean;
  readerMode?: 'reader' | 'explain' | 'notes';
  readingProgressPercent?: number;
  activePaper?: DiscoveryItem | null;
  allDiscoveries: DiscoveryItem[];
  activeNote?: StructuredNote | null;
  savedNotes: StructuredNote[];
  selectedText: string;
  onClearSelectedText: () => void;
  language: ExplanationLanguage;
  onLanguageChange: (lang: ExplanationLanguage) => void;
  difficulty: DifficultyLevel;
  onDifficultyChange: (diff: DifficultyLevel) => void;
  onApproveAndSaveNote: (note: StructuredNote) => Promise<boolean> | void;
  onOpenDiscovery: (
    item: DiscoveryItem,
    tab?: 'reader' | 'professor' | 'visual' | 'notes' | 'quiz'
  ) => void;
  onOpenMyNotes: (noteId?: string) => void;
  onToggleBookmark: (paperId: string) => void;
  bookmarkedIds: string[];
  externalOpenRequest?: {
    open: boolean;
    initialPrompt?: string;
    actionType?: ProfessorActionType;
    targetTerm?: string;
    selectedPassage?: string;
    timestamp: number;
  } | null;
}

const PROFESSOR_SESSION_STORAGE_KEY = 'orbit_v3_professor_agent_turns';

export const FloatingProfessorAgent: React.FC<FloatingProfessorAgentProps> = ({
  routeSection,
  librarySubTab,
  isReaderModalOpen,
  readerMode,
  readingProgressPercent,
  activePaper,
  allDiscoveries,
  activeNote,
  savedNotes,
  selectedText,
  onClearSelectedText,
  language,
  onLanguageChange,
  difficulty,
  onDifficultyChange,
  onApproveAndSaveNote,
  onOpenDiscovery,
  onOpenMyNotes,
  onToggleBookmark,
  bookmarkedIds,
  externalOpenRequest,
}) => {
  // Strictly collapsed by default on page load and navigation
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [lastFailedRequest, setLastFailedRequest] = useState<{
    prompt: string;
    actionType?: ProfessorActionType;
    targetTerm?: string;
    passage?: string;
  } | null>(null);
  const [comparisonPaperId, setComparisonPaperId] = useState<string>('');
  const [revealedQuizAnswers, setRevealedQuizAnswers] = useState<Record<string, boolean>>({});
  const [actionFeedbackToast, setActionFeedbackToast] = useState<string | null>(null);
  const [undoSnapshots, setUndoSnapshots] = useState<Record<string, StructuredNote>>({});

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const lastHandledTimestampRef = useRef<number>(0);

  // Do NOT prefill with a lengthy welcome greeting before the user has asked anything
  const [messages, setMessages] = useState<ProfessorAgentMessage[]>(() => {
    try {
      const raw = localStorage.getItem(PROFESSOR_SESSION_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.filter((m: any) => m && m.id !== 'prof-welcome-init');
        }
      }
    } catch {
      // ignore storage errors
    }
    return [];
  });

  // Persist user-initiated conversation turns across route changes
  useEffect(() => {
    try {
      localStorage.setItem(PROFESSOR_SESSION_STORAGE_KEY, JSON.stringify(messages.slice(-24)));
    } catch {
      // ignore quota errors
    }
  }, [messages]);

  // Auto-scroll inside the Professor panel only when it is open and messages change
  useEffect(() => {
    if (isOpen && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages.length, isGenerating, isOpen]);

  // Handle explicit external open requests (e.g. from top nav button or explicit user action)
  useEffect(() => {
    if (
      externalOpenRequest &&
      externalOpenRequest.open &&
      externalOpenRequest.timestamp > lastHandledTimestampRef.current
    ) {
      lastHandledTimestampRef.current = externalOpenRequest.timestamp;
      setIsOpen(true);
      if (externalOpenRequest.initialPrompt) {
        sendAgentRequest(externalOpenRequest.initialPrompt, {
          actionType: externalOpenRequest.actionType,
          targetTerm: externalOpenRequest.targetTerm,
          overridePassage: externalOpenRequest.selectedPassage,
        });
      } else {
        setTimeout(() => inputRef.current?.focus(), 60);
      }
    }
  }, [externalOpenRequest]);

  const showToast = (msg: string) => {
    setActionFeedbackToast(msg);
    setTimeout(() => setActionFeedbackToast(null), 3000);
  };

  const comparisonPaper: DiscoveryItem | null =
    allDiscoveries.find((d) => d.id === comparisonPaperId) ||
    allDiscoveries.find((d) => d.id !== activePaper?.id) ||
    null;

  const resolvedActiveNote =
    activeNote ||
    (activePaper ? savedNotes.find((n) => n.discoveryId === activePaper.id) || null : null);

  const buildContextPayload = (options?: {
    actionType?: ProfessorActionType;
    targetTerm?: string;
    overridePassage?: string;
  }): ProfessorContextPayload => {
    const passageToUse =
      options?.overridePassage !== undefined ? options.overridePassage : selectedText;

    return {
      actionType: options?.actionType,
      targetTerm: options?.targetTerm,
      routeSection,
      librarySubTab,
      isReaderModalOpen,
      readerMode,
      readingProgressPercent,
      selectedText: passageToUse || undefined,
      language,
      difficulty,
      activePaper: activePaper
        ? {
            id: activePaper.id,
            canonicalId: activePaper.canonicalId,
            title: activePaper.title,
            authors: activePaper.authors || [],
            sourceName: activePaper.sourceName,
            publishedAt: activePaper.publishedAt,
            evidenceStatus: activePaper.evidenceStatus,
            fullTextAvailable:
              activePaper.fullTextAvailable !== undefined
                ? activePaper.fullTextAvailable
                : !activePaper.isLiveFetched ||
                  activePaper.sourceType === 'Preprint (arXiv / bioRxiv)' ||
                  activePaper.sourceType === 'GitHub Repository',
            sourceUrl: activePaper.sourceUrl,
            quickOrientation: activePaper.readerLayers.quickOrientation,
            coreMechanism: activePaper.readerLayers.coreMechanism,
            methodsAndEvidence: activePaper.readerLayers.methodsAndEvidence,
            findings: activePaper.readerLayers.findings,
            limitations: activePaper.readerLayers.limitationsAndUncertainty,
            equations: activePaper.equations.map((e) => ({
              title: e.title,
              formula: e.formula,
              intuition: e.intuition,
            })),
          }
        : null,
      comparisonPaper: comparisonPaper
        ? {
            id: comparisonPaper.id,
            title: comparisonPaper.title,
            sourceName: comparisonPaper.sourceName,
            publishedAt: comparisonPaper.publishedAt,
            evidenceStatus: comparisonPaper.evidenceStatus,
            quickOrientation: comparisonPaper.readerLayers.quickOrientation,
            coreMechanism: comparisonPaper.readerLayers.coreMechanism,
            limitations: comparisonPaper.readerLayers.limitationsAndUncertainty,
          }
        : null,
      activeNote: resolvedActiveNote
        ? {
            id: resolvedActiveNote.id,
            discoveryId: resolvedActiveNote.discoveryId,
            discoveryTitle: resolvedActiveNote.discoveryTitle,
            status: resolvedActiveNote.status,
            executiveSummary: resolvedActiveNote.executiveSummary,
            whyItMatters: resolvedActiveNote.whyItMatters,
            mechanismSteps: resolvedActiveNote.mechanismSteps,
            methodsAndEvidence: resolvedActiveNote.methodsAndEvidence,
            limitationsAndCritique: resolvedActiveNote.limitationsAndCritique,
            examRevisionSheet: resolvedActiveNote.examRevisionSheet,
            userPersonalAnnotations: resolvedActiveNote.userPersonalAnnotations,
          }
        : null,
    };
  };

  // Concise, context-aware suggestions with explicit action types
  const getContextualSuggestions = (): Array<{
    label: string;
    prompt: string;
    actionType: ProfessorActionType;
  }> => {
    if (selectedText) {
      return [
        {
          label: 'Explain selection',
          prompt: 'Explain this selected passage clearly and how it fits into the paper.',
          actionType: 'explain_selection',
        },
        {
          label: 'Simplify selection',
          prompt:
            language === 'hinglish'
              ? 'Simplify this selected passage in easy Hinglish.'
              : 'Simplify this selected passage in plain, beginner-friendly language.',
          actionType: 'simplify_selection',
        },
        {
          label: 'Create study notes',
          prompt: 'Create proper study notes from this paper including this selected passage.',
          actionType: 'create_notes',
        },
      ];
    }

    if (routeSection === 'notes' || (isReaderModalOpen && readerMode === 'notes')) {
      return [
        {
          label: 'Add a worked example',
          prompt: 'Add a worked example to my existing notes.',
          actionType: 'ask_question',
        },
        {
          label: 'Organize these notes',
          prompt: 'Organize these notes and improve their clarity for revision.',
          actionType: 'ask_question',
        },
        {
          label: 'Generate revision questions',
          prompt: 'Turn these notes into revision questions with model answers.',
          actionType: 'ask_question',
        },
      ];
    }

    if (isReaderModalOpen || activePaper) {
      return [
        {
          label: 'Explain this paper',
          prompt: 'Explain this paper simply with an intuitive real-world analogy.',
          actionType: 'explain_paper',
        },
        {
          label: 'Summarize key findings',
          prompt: 'Summarize the key empirical findings and main limitations of this paper.',
          actionType: 'ask_question',
        },
        {
          label: 'Create study notes',
          prompt: 'Create proper study notes from this paper.',
          actionType: 'create_notes',
        },
        {
          label: 'Find related research',
          prompt: 'Find related research and papers that test or challenge this conclusion.',
          actionType: 'ask_question',
        },
      ];
    }

    return [
      {
        label: 'Explain featured paper',
        prompt: 'Explain the featured research paper and why it matters.',
        actionType: 'explain_paper',
      },
      {
        label: 'Compare top papers',
        prompt: 'Compare these two papers in a structured table.',
        actionType: 'ask_question',
      },
      {
        label: 'Find related research',
        prompt: 'Find research on fault-tolerant quantum error correction thresholds.',
        actionType: 'ask_question',
      },
    ];
  };

  const sendAgentRequest = async (
    overridePrompt?: string,
    options?: {
      actionType?: ProfessorActionType;
      targetTerm?: string;
      overridePassage?: string;
      simulateToolFailure?: boolean;
    }
  ) => {
    const promptToUse = (overridePrompt !== undefined ? overridePrompt : inputText).trim();
    if (!promptToUse || isGenerating) return;

    const resolvedActionType: ProfessorActionType =
      options?.actionType ||
      (options?.targetTerm
        ? 'define_term'
        : (options?.overridePassage || selectedText) &&
          promptToUse.toLowerCase().includes('simplif')
        ? 'simplify_selection'
        : options?.overridePassage || selectedText
        ? 'explain_selection'
        : promptToUse.toLowerCase().includes('create study notes') ||
          promptToUse.toLowerCase().includes('create proper study notes')
        ? 'create_notes'
        : promptToUse.toLowerCase().includes('explain this paper')
        ? 'explain_paper'
        : 'ask_question');

    const contextPayload = buildContextPayload({
      actionType: resolvedActionType,
      targetTerm: options?.targetTerm,
      overridePassage: options?.overridePassage,
    });

    const userMsg: ProfessorAgentMessage = {
      id: `prof-usr-${Date.now()}`,
      role: 'user',
      text: promptToUse,
      createdAt: new Date().toISOString(),
      actionType: resolvedActionType,
      targetTerm: options?.targetTerm,
      selectedPassage: contextPayload.selectedText,
      contextSnapshotLabel: options?.targetTerm
        ? `Term: ${options.targetTerm}`
        : contextPayload.activePaper
        ? contextPayload.activePaper.title.slice(0, 38)
        : routeSection.toUpperCase(),
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    if (overridePrompt === undefined) setInputText('');
    setIsGenerating(true);
    setErrorBanner(null);
    setLastFailedRequest(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await fetch('/api/ai/professor-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          userMessage: promptToUse,
          conversationHistory: nextHistory.slice(-8).map((m) => ({
            role: m.role,
            text: m.text,
          })),
          context: contextPayload,
          simulateToolFailure: options?.simulateToolFailure || false,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorBanner(data.error || 'Professor encountered an error processing your request.');
        setLastFailedRequest({
          prompt: promptToUse,
          actionType: resolvedActionType,
          targetTerm: options?.targetTerm,
          passage: contextPayload.selectedText,
        });
      } else {
        const modelMsg: ProfessorAgentMessage = {
          id: `prof-mdl-${Date.now()}`,
          role: 'model',
          text: data.reply || 'Here is the explanation based on your current context.',
          createdAt: new Date().toISOString(),
          actionType: data.actionType || resolvedActionType,
          targetTerm: data.targetTerm || options?.targetTerm,
          inferredMode: data.inferredMode || 'ASK',
          modelUsed: data.modelUsed || 'gemini-3.8-flash',
          contextSnapshotLabel: data.contextSnapshotLabel,
          selectedPassage: data.selectedPassage,
          citations: data.citations,
          comparisonTable: data.comparisonTable,
          equations: data.equations,
          revisionQuestions: data.revisionQuestions,
          relatedPapers: data.relatedPapers,
          toolExecutions: data.toolExecutions,
        };
        setMessages((prev) => [...prev, modelMsg]);
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        setErrorBanner('Generation stopped.');
      } else {
        setErrorBanner(err?.message || 'Network error while reaching Professor.');
      }
      setLastFailedRequest({
        prompt: promptToUse,
        actionType: resolvedActionType,
        targetTerm: options?.targetTerm,
        passage: contextPayload.selectedText,
      });
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleNewConversation = () => {
    setMessages([]);
    localStorage.removeItem(PROFESSOR_SESSION_STORAGE_KEY);
    setErrorBanner(null);
    setLastFailedRequest(null);
    setShowSettingsMenu(false);
    showToast('Cleared conversation');
  };

  const handleApproveProposedChange = async (
    messageId: string,
    toolId: string,
    change: ProfessorProposedChange
  ) => {
    if (change.changeType === 'create_note' && change.proposedNoteDraft) {
      const existing = savedNotes.find((n) => n.id === change.proposedNoteDraft?.id);
      if (existing) {
        setUndoSnapshots((prev) => ({ ...prev, [change.id]: { ...existing } }));
      }
      const fullNote: StructuredNote = {
        id: change.proposedNoteDraft.id || `note-${Date.now()}`,
        discoveryId:
          change.proposedNoteDraft.discoveryId || activePaper?.id || `disc-${Date.now()}`,
        discoveryTitle:
          change.proposedNoteDraft.discoveryTitle || activePaper?.title || 'Study Note',
        sourceUrl:
          change.proposedNoteDraft.sourceUrl || activePaper?.sourceUrl || 'https://openalex.org',
        status: 'approved_saved',
        language: change.proposedNoteDraft.language || language,
        executiveSummary: change.proposedNoteDraft.executiveSummary || '',
        whyItMatters: change.proposedNoteDraft.whyItMatters || '',
        prerequisites: change.proposedNoteDraft.prerequisites || [],
        coreConceptsAndDefinitions:
          change.proposedNoteDraft.coreConceptsAndDefinitions || [],
        mechanismSteps: change.proposedNoteDraft.mechanismSteps || [],
        methodsAndEvidence: change.proposedNoteDraft.methodsAndEvidence || '',
        equations: change.proposedNoteDraft.equations || [],
        limitationsAndCritique: change.proposedNoteDraft.limitationsAndCritique || '',
        examRevisionSheet: change.proposedNoteDraft.examRevisionSheet || [],
        userPersonalAnnotations: change.proposedNoteDraft.userPersonalAnnotations || '',
        tags: change.proposedNoteDraft.tags || ['Professor Generated'],
        flashcards: change.proposedNoteDraft.flashcards || [],
        citations: change.proposedNoteDraft.citations || [],
        createdAt: change.proposedNoteDraft.createdAt || new Date().toISOString(),
        approvedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await onApproveAndSaveNote(fullNote);
      showToast(`Saved "${fullNote.discoveryTitle}" to My Notes`);
    } else if (change.changeType === 'update_note') {
      const targetNote =
        savedNotes.find((n) => n.id === change.targetNoteId) ||
        activeNote ||
        savedNotes[0];
      if (targetNote) {
        setUndoSnapshots((prev) => ({ ...prev, [change.id]: { ...targetNote } }));
        const updated: StructuredNote = {
          ...targetNote,
          status: 'approved_saved',
          userPersonalAnnotations:
            change.proposedValue !== undefined
              ? change.proposedValue
              : targetNote.userPersonalAnnotations,
          updatedAt: new Date().toISOString(),
        };
        await onApproveAndSaveNote(updated);
        showToast(`Updated "${targetNote.discoveryTitle}"`);
      }
    } else if (
      (change.changeType === 'save_bookmark' || change.changeType === 'remove_bookmark') &&
      change.targetPaperId
    ) {
      onToggleBookmark(change.targetPaperId);
      showToast(
        change.changeType === 'remove_bookmark'
          ? 'Removed paper from My Library'
          : 'Saved paper to My Library'
      );
    }

    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId || !m.toolExecutions) return m;
        return {
          ...m,
          toolExecutions: m.toolExecutions.map((t) =>
            t.id === toolId && t.proposedChange
              ? {
                  ...t,
                  status: 'completed',
                  proposedChange: { ...t.proposedChange, status: 'approved' },
                }
              : t
          ),
        };
      })
    );
  };

  const handleRejectProposedChange = (messageId: string, toolId: string) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId || !m.toolExecutions) return m;
        return {
          ...m,
          toolExecutions: m.toolExecutions.map((t) =>
            t.id === toolId && t.proposedChange
              ? {
                  ...t,
                  proposedChange: { ...t.proposedChange, status: 'rejected' },
                }
              : t
          ),
        };
      })
    );
    showToast('Discarded proposed change');
  };

  const handleUndoApprovedChange = async (
    messageId: string,
    toolId: string,
    changeId: string
  ) => {
    const prior = undoSnapshots[changeId];
    if (prior) {
      await onApproveAndSaveNote(prior);
      showToast(`Restored previous version of "${prior.discoveryTitle}"`);
    }
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId || !m.toolExecutions) return m;
        return {
          ...m,
          toolExecutions: m.toolExecutions.map((t) =>
            t.id === toolId && t.proposedChange
              ? {
                  ...t,
                  status: 'requires_approval',
                  proposedChange: { ...t.proposedChange, status: 'undone' },
                }
              : t
          ),
        };
      })
    );
  };

  const suggestions = getContextualSuggestions();
  const contextLabel = selectedText
    ? 'Selected passage'
    : activePaper
    ? activePaper.title
    : resolvedActiveNote
    ? resolvedActiveNote.discoveryTitle
    : routeSection === 'notes'
    ? 'My Notes'
    : routeSection === 'library'
    ? 'My Library'
    : 'Discover';

  // COLLAPSED STATE: Compact, unobtrusive floating Professor button in bottom-right corner
  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-[60] flex items-center gap-2 max-w-[calc(100vw-2rem)]">
        {selectedText && !isReaderModalOpen && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#15131E]/95 border border-emerald-400/35 shadow-xl backdrop-blur-xl">
            <button
              type="button"
              onClick={() => {
                setIsOpen(true);
                sendAgentRequest(
                  'Explain this selected passage clearly and how it fits into the paper.',
                  { actionType: 'explain_selection', overridePassage: selectedText }
                );
              }}
              className="px-2.5 py-1 rounded-full bg-emerald-400 text-[#0B0A0E] text-[11px] font-bold hover:bg-emerald-300 transition-colors"
            >
              Explain selection
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOpen(true);
                sendAgentRequest('Simplify this selected passage in plain language.', {
                  actionType: 'simplify_selection',
                  overridePassage: selectedText,
                });
              }}
              className="px-2.5 py-1 rounded-full bg-white/10 text-white text-[11px] font-medium hover:bg-white/20 transition-colors"
            >
              Simplify
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Open Professor research assistant"
          title="Ask Professor — Explain terms, passages, or papers"
          className="group pl-3 pr-4 py-2.5 rounded-full bg-[#15131E]/95 hover:bg-[#1C1928] border border-white/15 hover:border-emerald-400/50 text-white shadow-[0_10px_30px_rgba(0,0,0,0.65)] backdrop-blur-xl transition-all inline-flex items-center gap-2 shrink-0"
        >
          <span className="w-7 h-7 rounded-full bg-emerald-400/15 border border-emerald-400/35 flex items-center justify-center text-emerald-300">
            <GraduationCap className="w-4 h-4" />
          </span>
          <span className="text-xs font-semibold tracking-tight text-white">Professor</span>
        </button>
      </div>
    );
  }

  // EXPANDED STATE: Lightweight side panel on desktop, responsive drawer on mobile
  return (
    <div
      className="fixed inset-x-0 bottom-0 sm:inset-auto sm:bottom-4 sm:right-4 z-[60] pointer-events-none flex justify-end"
      role="dialog"
      aria-modal="false"
      aria-label="Professor AI Assistant"
    >
      <aside className="pointer-events-auto w-full sm:w-[380px] md:w-[400px] max-h-[82vh] sm:h-[580px] sm:max-h-[calc(100vh-2rem)] bg-[#13111C]/98 rounded-t-[24px] sm:rounded-[24px] border-t sm:border border-white/15 shadow-[0_20px_60px_rgba(0,0,0,0.85)] backdrop-blur-2xl flex flex-col overflow-hidden">
        {/* SIMPLIFIED HEADER (BUG 5): Icon + Name, Optional Context Label, Secondary Settings & Single Close Button (X) */}
        <header className="px-4 py-3 bg-[#171522] border-b border-white/10 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-400/15 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-white leading-tight">Professor</h2>
              <p className="text-[11px] text-white/55 truncate" title={contextLabel}>
                {contextLabel}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setShowSettingsMenu((prev) => !prev)}
              aria-label="Professor settings"
              aria-expanded={showSettingsMenu}
              title="Language, depth & session options"
              className={`p-2 rounded-full transition-colors ${
                showSettingsMenu
                  ? 'bg-white/15 text-white'
                  : 'text-white/65 hover:text-white hover:bg-white/10'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close Professor"
              title="Close Professor"
              className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* SECONDARY COLLAPSIBLE SETTINGS MENU (Only revealed when user clicks Settings) */}
        {showSettingsMenu && (
          <div className="px-4 py-3 bg-black/50 border-b border-white/10 space-y-2.5 text-xs shrink-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-white/60">Language</span>
              <div className="flex items-center bg-white/[0.05] p-0.5 rounded-full border border-white/10 text-[11px]">
                <button
                  type="button"
                  onClick={() => onLanguageChange('en')}
                  className={`px-2.5 py-0.5 rounded-full transition-colors ${
                    language === 'en'
                      ? 'bg-white text-[#0B0A0E] font-semibold'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => onLanguageChange('hinglish')}
                  className={`px-2.5 py-0.5 rounded-full transition-colors ${
                    language === 'hinglish'
                      ? 'bg-white text-[#0B0A0E] font-semibold'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  Hinglish
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-white/60">Explanation Depth</span>
              <div className="flex items-center bg-white/[0.05] p-0.5 rounded-full border border-white/10 text-[11px]">
                {(['beginner', 'mixed', 'advanced'] as DifficultyLevel[]).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => onDifficultyChange(lvl)}
                    className={`px-2.5 py-0.5 rounded-full capitalize transition-colors ${
                      difficulty === lvl
                        ? 'bg-emerald-400 text-[#0B0A0E] font-semibold'
                        : 'text-white/70 hover:text-white'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-white/60">Compare against</span>
              <select
                value={comparisonPaper?.id || ''}
                onChange={(e) => setComparisonPaperId(e.target.value)}
                className="max-w-[200px] px-2 py-1 rounded-lg bg-black/60 border border-white/15 text-[11px] text-white truncate"
              >
                {allDiscoveries
                  .filter((d) => d.id !== activePaper?.id)
                  .slice(0, 10)
                  .map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title.slice(0, 44)}
                    </option>
                  ))}
              </select>
            </div>

            <div className="pt-1 border-t border-white/10 flex items-center justify-between">
              <button
                type="button"
                onClick={handleNewConversation}
                className="text-[11px] text-white/70 hover:text-white inline-flex items-center gap-1"
              >
                <PlusCircle className="w-3 h-3 text-emerald-300" />
                <span>Clear conversation</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowSettingsMenu(false);
                  sendAgentRequest('Simulate failed tool call to verify safe error handling', {
                    simulateToolFailure: true,
                  });
                }}
                className="text-[10px] text-white/45 hover:text-amber-300"
              >
                Test tool failure guard
              </button>
            </div>
          </div>
        )}

        {/* SELECTED PASSAGE CONTEXT BAR (When text is highlighted) */}
        {selectedText && (
          <div className="px-3.5 py-2 bg-emerald-950/60 border-b border-emerald-500/25 flex items-center justify-between gap-2 text-xs shrink-0">
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <Quote className="w-3 h-3 text-emerald-300 shrink-0" />
              <span className="text-[11px] text-white/90 truncate italic">
                &ldquo;{selectedText}&rdquo;
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() =>
                  sendAgentRequest(
                    'Explain this selected passage clearly and how it fits into the paper.',
                    { actionType: 'explain_selection', overridePassage: selectedText }
                  )
                }
                className="px-2 py-0.5 rounded-full bg-emerald-400 text-[#0B0A0E] text-[10px] font-bold hover:bg-emerald-300"
              >
                Explain
              </button>
              <button
                type="button"
                onClick={() =>
                  sendAgentRequest('Simplify this selected passage in plain language.', {
                    actionType: 'simplify_selection',
                    overridePassage: selectedText,
                  })
                }
                className="px-2 py-0.5 rounded-full bg-white/10 text-white text-[10px] hover:bg-white/20"
              >
                Simplify
              </button>
              <button
                type="button"
                onClick={onClearSelectedText}
                aria-label="Clear selected text"
                className="p-0.5 text-white/50 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* Feedback Toast Banner */}
        {actionFeedbackToast && (
          <div className="px-4 py-1.5 bg-emerald-500/20 border-b border-emerald-500/35 text-xs text-emerald-200 flex items-center gap-2 shrink-0">
            <Check className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
            <span>{actionFeedbackToast}</span>
          </div>
        )}

        {/* MAIN CONVERSATION AREA */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-3.5">
          {messages.length === 0 ? (
            /* CALM, UNCLUTTERED INITIAL STATE (No prefilled wall of text) */
            <div className="h-full flex flex-col justify-center py-6 space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-white">
                  {activePaper ? 'Ask about this paper' : 'How can I help with your research?'}
                </h3>
                <p className="text-xs text-white/60 leading-relaxed">
                  {activePaper
                    ? `Ask a question, define a technical term, or generate study notes for "${activePaper.title}".`
                    : 'Ask a question, explain a selected passage, or organize your study notes.'}
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((sug) => (
                  <button
                    key={sug.label}
                    type="button"
                    disabled={isGenerating}
                    onClick={() =>
                      sendAgentRequest(sug.prompt, { actionType: sug.actionType })
                    }
                    className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs text-white/85 hover:text-white transition-colors text-left"
                  >
                    {sug.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`w-full max-w-[95%] rounded-2xl p-3.5 space-y-2.5 ${
                      isUser
                        ? 'bg-white text-[#0B0A0E] rounded-br-xs shadow-sm'
                        : 'bg-white/[0.04] border border-white/10 text-[#ECEAE4] rounded-bl-xs'
                    }`}
                  >
                    {/* Quoted Selection if attached */}
                    {msg.selectedPassage && (
                      <div
                        className={`p-2 rounded-xl text-[11px] italic border-l-2 ${
                          isUser
                            ? 'bg-black/10 border-[#0B0A0E]/40 text-[#0B0A0E]/80'
                            : 'bg-black/40 border-emerald-400 text-white/80'
                        }`}
                      >
                        &ldquo;{msg.selectedPassage}&rdquo;
                      </div>
                    )}

                    {/* Main Formatted Response Text */}
                    <div className="text-xs sm:text-[13px] leading-[1.7] whitespace-pre-line break-words">
                      {msg.text}
                    </div>

                    {/* Follow-up actions when defining a specific term */}
                    {!isUser && msg.actionType === 'define_term' && msg.targetTerm && (
                      <div className="pt-1.5 flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            sendAgentRequest(
                              `Explain "${msg.targetTerm}" further and how it connects to the core mechanism of this paper.`,
                              { actionType: 'define_term', targetTerm: msg.targetTerm }
                            )
                          }
                          className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] text-white font-medium transition-colors"
                        >
                          Explain further
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            sendAgentRequest(
                              `Give a concrete, intuitive example of "${msg.targetTerm}" in action.`,
                              { actionType: 'define_term', targetTerm: msg.targetTerm }
                            )
                          }
                          className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] text-white font-medium transition-colors"
                        >
                          Give an example
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsOpen(false)}
                          className="px-2.5 py-1 rounded-lg text-[11px] text-white/60 hover:text-white transition-colors"
                        >
                          Close
                        </button>
                      </div>
                    )}

                    {/* STRUCTURED EQUATION CARDS */}
                    {msg.equations && msg.equations.length > 0 && (
                      <div className="space-y-2 pt-1">
                        {msg.equations.map((eq, i) => (
                          <div
                            key={i}
                            className="p-2.5 rounded-xl bg-black/50 border border-white/10 space-y-1"
                          >
                            <div className="text-[11px] font-semibold text-white">{eq.title}</div>
                            <div className="p-2 rounded-lg bg-white/[0.04] font-mono text-xs text-emerald-300 overflow-x-auto">
                              {eq.formula}
                            </div>
                            <p className="text-[11px] text-white/80 leading-relaxed">
                              {eq.explanation}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* STRUCTURED COMPARISON / DATA TABLE */}
                    {msg.comparisonTable && (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-300">
                          <Table className="w-3 h-3" />
                          <span>Comparison Table</span>
                        </div>
                        <div className="overflow-x-auto rounded-xl border border-white/12 bg-black/40">
                          <table className="w-full text-left border-collapse text-[11px]">
                            <thead>
                              <tr className="border-b border-white/12 bg-white/[0.05]">
                                {msg.comparisonTable.headers.map((h, i) => (
                                  <th key={i} className="p-2 font-semibold text-white">
                                    {h}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                              {msg.comparisonTable.rows.map((row, rIdx) => (
                                <tr key={rIdx}>
                                  {row.map((cell, cIdx) => (
                                    <td
                                      key={cIdx}
                                      className={`p-2 align-top leading-relaxed ${
                                        cIdx === 0 ? 'font-medium text-white' : 'text-white/80'
                                      }`}
                                    >
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* ACTIVE-RECALL REVISION QUESTIONS */}
                    {msg.revisionQuestions && msg.revisionQuestions.length > 0 && (
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-300">
                          <HelpCircle className="w-3 h-3" />
                          <span>Revision Questions</span>
                        </div>
                        {msg.revisionQuestions.map((rq, idx) => {
                          const qKey = `${msg.id}-rq-${idx}`;
                          const isRevealed = Boolean(revealedQuizAnswers[qKey]);
                          return (
                            <div
                              key={qKey}
                              className="p-2.5 rounded-xl bg-black/45 border border-white/10 space-y-1.5 text-xs"
                            >
                              <div className="font-semibold text-white">
                                Q{idx + 1}. {rq.question}
                              </div>
                              {isRevealed ? (
                                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-100 leading-relaxed">
                                  <strong className="text-emerald-300">Answer: </strong>
                                  {rq.answer}
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setRevealedQuizAnswers((prev) => ({ ...prev, [qKey]: true }))
                                  }
                                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white/85 text-[11px] font-medium transition-colors"
                                >
                                  Show Answer
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* LIVE RELATED RESEARCH RESULTS */}
                    {msg.relatedPapers && msg.relatedPapers.length > 0 && (
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-300">
                          <Search className="w-3 h-3" />
                          <span>Related Research (OpenAlex)</span>
                        </div>
                        {msg.relatedPapers.map((rp) => {
                          const isSaved = bookmarkedIds.includes(rp.id);
                          return (
                            <div
                              key={rp.id}
                              className="p-2.5 rounded-xl bg-black/45 border border-white/12 space-y-1.5 text-xs"
                            >
                              <div className="text-[10px] text-emerald-300 font-mono">
                                {rp.sourceName} · {rp.publishedAt}
                              </div>
                              <div className="font-bold text-white leading-snug">{rp.title}</div>
                              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                <button
                                  type="button"
                                  onClick={() => onOpenDiscovery(rp, 'reader')}
                                  className="px-2.5 py-1 rounded-full bg-white text-[#0B0A0E] text-[10px] font-bold hover:bg-white/90 inline-flex items-center gap-1"
                                >
                                  <BookOpen className="w-3 h-3" />
                                  <span>Open</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onToggleBookmark(rp.id)}
                                  className="px-2.5 py-1 rounded-full orbit-glass-pill text-[10px] text-white/85 hover:text-white"
                                >
                                  {isSaved ? '✓ Saved' : '+ Save'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* AGENTIC TOOL EXECUTION & PREVIEW / APPROVAL / UNDO CARDS */}
                    {msg.toolExecutions && msg.toolExecutions.length > 0 && (
                      <div className="space-y-2.5 pt-2 border-t border-white/10">
                        {msg.toolExecutions.map((tool) => {
                          const prop = tool.proposedChange;
                          return (
                            <div
                              key={tool.id}
                              className={`p-3 rounded-xl border space-y-2 text-xs ${
                                tool.status === 'failed'
                                  ? 'bg-rose-500/10 border-rose-500/35 text-rose-100'
                                  : tool.status === 'unsupported'
                                  ? 'bg-amber-500/10 border-amber-500/35 text-amber-100'
                                  : tool.status === 'requires_approval'
                                  ? 'bg-emerald-500/[0.08] border-emerald-400/35 text-white'
                                  : 'bg-black/45 border-white/15 text-white/90'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 font-mono text-[10px]">
                                  <Wrench className="w-3 h-3 text-emerald-300 shrink-0" />
                                  <span className="font-semibold">{tool.toolName}</span>
                                </div>
                                <span className="text-[10px] font-mono text-emerald-300">
                                  {tool.status === 'requires_approval'
                                    ? 'Needs Approval'
                                    : tool.status}
                                </span>
                              </div>

                              <p className="text-[11px] leading-relaxed">{tool.summary}</p>

                              {tool.errorMessage && (
                                <div className="p-2 rounded-lg bg-black/40 border border-white/10 text-[10px] font-mono text-amber-200">
                                  {tool.errorMessage}
                                </div>
                              )}

                              {prop && (
                                <div className="p-2.5 rounded-xl bg-black/50 border border-white/12 space-y-2">
                                  <div className="font-bold text-white text-xs">{prop.title}</div>
                                  {prop.proposedValue && (
                                    <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-[11px] text-white/90 max-h-32 overflow-y-auto whitespace-pre-line">
                                      {prop.proposedValue}
                                    </div>
                                  )}

                                  {prop.status === 'pending_approval' || prop.status === 'undone' ? (
                                    <div className="flex flex-wrap items-center gap-2 pt-1">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleApproveProposedChange(msg.id, tool.id, prop)
                                        }
                                        className="px-3 py-1 rounded-full bg-emerald-400 text-[#0B0A0E] text-[11px] font-bold hover:bg-emerald-300 transition-colors inline-flex items-center gap-1"
                                      >
                                        <Check className="w-3 h-3" />
                                        <span>Approve &amp; Save</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleRejectProposedChange(msg.id, tool.id)}
                                        className="px-2.5 py-1 rounded-full orbit-glass-pill text-[11px] text-white/75 hover:text-white"
                                      >
                                        Discard
                                      </button>
                                    </div>
                                  ) : prop.status === 'approved' ? (
                                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                                      <span className="text-emerald-300 font-mono text-[10px] inline-flex items-center gap-1">
                                        <Check className="w-3 h-3" />
                                        <span>Saved</span>
                                      </span>
                                      <div className="flex items-center gap-1.5">
                                        {prop.targetNoteId && (
                                          <button
                                            type="button"
                                            onClick={() => onOpenMyNotes(prop.targetNoteId)}
                                            className="px-2 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-[10px] text-white inline-flex items-center gap-1"
                                          >
                                            <FileText className="w-2.5 h-2.5 text-emerald-300" />
                                            <span>Open Notes</span>
                                          </button>
                                        )}
                                        {undoSnapshots[prop.id] && (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleUndoApprovedChange(msg.id, tool.id, prop.id)
                                            }
                                            className="px-2 py-0.5 rounded-full orbit-glass-pill text-[10px] text-amber-300 hover:text-white inline-flex items-center gap-1"
                                          >
                                            <Undo2 className="w-2.5 h-2.5" />
                                            <span>Undo</span>
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-[10px] text-white/50 font-mono">
                                      Discarded
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Sourced Citations Footer */}
                    {!isUser && msg.citations && msg.citations.length > 0 && (
                      <div className="pt-1.5 border-t border-white/10 space-y-1 text-[10px] text-white/55">
                        {msg.citations.map((cit, i) => (
                          <div key={i} className="flex items-center justify-between gap-2">
                            <span className="truncate">{cit.label}</span>
                            <a
                              href={cit.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-300 hover:underline shrink-0 inline-flex items-center gap-1"
                            >
                              <span>Source</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Loading & Stop Generation Indicator */}
          {isGenerating && (
            <div className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-white/[0.04] border border-white/10 text-xs text-emerald-300">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>Thinking...</span>
              </div>
              <button
                type="button"
                onClick={handleStopGeneration}
                className="px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-200 text-[10px] font-medium hover:bg-rose-500/30 inline-flex items-center gap-1"
              >
                <Square className="w-2 h-2 fill-current" />
                <span>Stop</span>
              </button>
            </div>
          )}

          {/* Error & Retry State */}
          {errorBanner && (
            <div className="p-3 rounded-2xl bg-amber-500/12 border border-amber-500/35 flex items-center justify-between gap-2 text-xs text-amber-200">
              <div className="flex items-center gap-2 min-w-0">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span className="truncate">{errorBanner}</span>
              </div>
              {lastFailedRequest && (
                <button
                  type="button"
                  onClick={() =>
                    sendAgentRequest(lastFailedRequest.prompt, {
                      actionType: lastFailedRequest.actionType,
                      targetTerm: lastFailedRequest.targetTerm,
                      overridePassage: lastFailedRequest.passage,
                    })
                  }
                  className="px-2.5 py-1 rounded-lg bg-white text-[#0B0A0E] text-[11px] font-bold shrink-0 inline-flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Retry</span>
                </button>
              )}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* COMPACT INPUT FOOTER */}
        <footer className="p-3 bg-[#161421] border-t border-white/10 space-y-2 shrink-0">
          {messages.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
              {suggestions.slice(0, 3).map((sug) => (
                <button
                  key={sug.label}
                  type="button"
                  disabled={isGenerating}
                  onClick={() =>
                    sendAgentRequest(sug.prompt, { actionType: sug.actionType })
                  }
                  className="px-2.5 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-[10px] text-white/75 hover:text-white whitespace-nowrap shrink-0 transition-colors"
                >
                  {sug.label}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendAgentRequest(undefined, { actionType: 'ask_question' });
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                selectedText
                  ? 'Ask about selected passage...'
                  : 'Ask a question...'
              }
              className="flex-1 min-w-0 px-3.5 py-2 rounded-xl bg-black/55 border border-white/15 text-xs sm:text-sm text-white placeholder:text-white/45 focus:outline-none focus:border-emerald-400"
            />
            <button
              type="submit"
              disabled={isGenerating || !inputText.trim()}
              aria-label="Send message"
              className="px-3.5 py-2 rounded-xl bg-white text-[#0B0A0E] text-xs font-bold hover:bg-white/90 disabled:opacity-50 transition-all inline-flex items-center gap-1 shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>
        </footer>
      </aside>
    </div>
  );
};
