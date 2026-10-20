import React, { useState, useMemo, useEffect, useRef } from 'react';
import { DiscoveryItem, StructuredNote } from '../types/orbit';
import {
  FileText,
  BookOpen,
  ExternalLink,
  Copy,
  Download,
  Trash2,
  Edit3,
  Check,
  Search,
  Plus,
  RotateCw,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  RefreshCw,
  List,
  AlertCircle,
} from 'lucide-react';

interface NotesDocumentViewProps {
  savedNotes: StructuredNote[];
  discoveries: DiscoveryItem[];
  initialSelectedNoteId?: string | null;
  onSaveOrUpdateNote: (note: StructuredNote) => Promise<boolean> | void;
  onDeleteNote: (noteId: string) => void;
  onOpenDiscovery: (
    item: DiscoveryItem,
    tab?: 'reader' | 'professor' | 'visual' | 'notes' | 'quiz'
  ) => void;
}

export const NotesDocumentView: React.FC<NotesDocumentViewProps> = ({
  savedNotes,
  discoveries,
  initialSelectedNoteId,
  onSaveOrUpdateNote,
  onDeleteNote,
  onOpenDiscovery,
}) => {
  const approvedNotes = useMemo(() => {
    const seen = new Set<string>();
    return savedNotes.filter((n) => {
      if (n.status !== 'approved_saved' || seen.has(n.id)) return false;
      seen.add(n.id);
      return true;
    });
  }, [savedNotes]);

  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(
    initialSelectedNoteId || approvedNotes[0]?.id || null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('saved');
  const [copiedToast, setCopiedToast] = useState(false);
  const [showOutline, setShowOutline] = useState(true);
  const [showConceptReview, setShowConceptReview] = useState(false);
  const [flippedCardIds, setFlippedCardIds] = useState<Record<string, boolean>>({});
  const autosaveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (initialSelectedNoteId) {
      setSelectedNoteId(initialSelectedNoteId);
    }
  }, [initialSelectedNoteId]);

  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return approvedNotes;
    const q = searchQuery.toLowerCase();
    return approvedNotes.filter(
      (n) =>
        n.discoveryTitle.toLowerCase().includes(q) ||
        n.executiveSummary.toLowerCase().includes(q) ||
        n.userPersonalAnnotations.toLowerCase().includes(q)
    );
  }, [approvedNotes, searchQuery]);

  const activeNote = useMemo(() => {
    return (
      filteredNotes.find((n) => n.id === selectedNoteId) ||
      filteredNotes[0] ||
      null
    );
  }, [filteredNotes, selectedNoteId]);

  const linkedPaper = activeNote
    ? discoveries.find((d) => d.id === activeNote.discoveryId)
    : undefined;

  // Derive worked example text when not explicitly stored on the note
  const getWorkedExampleForNote = (note: StructuredNote, paper?: DiscoveryItem): string => {
    if (note.workedExamples && note.workedExamples.trim()) {
      return note.workedExamples;
    }
    if (paper?.readerLayers?.beginnerExplanation) {
      return `${paper.readerLayers.beginnerExplanation}\n\nApplied Walkthrough: ${
        paper.equations?.[0]?.intuition ||
        note.mechanismSteps[0] ||
        'Trace the input state through the primary mechanism to verify the empirical output.'
      }`;
    }
    return `Consider a concrete scenario applying "${note.discoveryTitle}":\n1. Input Setup: Establish the baseline parameters and prerequisite assumptions (${
      note.prerequisites.slice(0, 2).join('; ') || 'standard domain conditions'
    }).\n2. Transformation: Apply the core mechanism (${
      note.mechanismSteps[0] || 'primary methodological step'
    }).\n3. Measurable Outcome: Compare the resulting output against the baseline control to verify the improvement described in the study.`;
  };

  // Local editable state synced to activeNote
  const [editTitle, setEditTitle] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [editWhyItMatters, setEditWhyItMatters] = useState('');
  const [editWorkedExamples, setEditWorkedExamples] = useState('');
  const [editMethods, setEditMethods] = useState('');
  const [editLimitations, setEditLimitations] = useState('');
  const [editPersonalNotes, setEditPersonalNotes] = useState('');

  const startEditing = (note: StructuredNote) => {
    setEditTitle(note.discoveryTitle);
    setEditSummary(note.executiveSummary);
    setEditWhyItMatters(note.whyItMatters);
    setEditWorkedExamples(getWorkedExampleForNote(note, linkedPaper));
    setEditMethods(note.methodsAndEvidence);
    setEditLimitations(note.limitationsAndCritique);
    setEditPersonalNotes(note.userPersonalAnnotations);
    setIsEditing(true);
    setAutosaveStatus('saved');
  };

  // Trigger debounced autosave whenever user edits a field in edit mode
  const scheduleAutosave = (nextFields: {
    title?: string;
    summary?: string;
    why?: string;
    workedExamples?: string;
    methods?: string;
    limitations?: string;
    personal?: string;
  }) => {
    if (!activeNote) return;
    setAutosaveStatus('saving');
    if (autosaveTimerRef.current) {
      window.clearTimeout(autosaveTimerRef.current);
    }
    const merged: StructuredNote = {
      ...activeNote,
      discoveryTitle: (nextFields.title ?? editTitle).trim() || activeNote.discoveryTitle,
      executiveSummary: nextFields.summary ?? editSummary,
      whyItMatters: nextFields.why ?? editWhyItMatters,
      workedExamples: nextFields.workedExamples ?? editWorkedExamples,
      methodsAndEvidence: nextFields.methods ?? editMethods,
      limitationsAndCritique: nextFields.limitations ?? editLimitations,
      userPersonalAnnotations: nextFields.personal ?? editPersonalNotes,
      updatedAt: new Date().toISOString(),
    };
    autosaveTimerRef.current = window.setTimeout(async () => {
      try {
        const res = await onSaveOrUpdateNote(merged);
        setAutosaveStatus(res === false ? 'error' : 'saved');
      } catch {
        setAutosaveStatus('error');
      }
    }, 600);
  };

  const saveDocumentEditsNow = async () => {
    if (!activeNote) return;
    if (autosaveTimerRef.current) {
      window.clearTimeout(autosaveTimerRef.current);
    }
    setAutosaveStatus('saving');
    const updated: StructuredNote = {
      ...activeNote,
      discoveryTitle: editTitle.trim() || activeNote.discoveryTitle,
      executiveSummary: editSummary,
      whyItMatters: editWhyItMatters,
      workedExamples: editWorkedExamples,
      methodsAndEvidence: editMethods,
      limitationsAndCritique: editLimitations,
      userPersonalAnnotations: editPersonalNotes,
      updatedAt: new Date().toISOString(),
    };
    try {
      const res = await onSaveOrUpdateNote(updated);
      setAutosaveStatus(res === false ? 'error' : 'saved');
      setIsEditing(false);
    } catch {
      setAutosaveStatus('error');
    }
  };

  const insertRichBlockIntoAnnotations = (snippet: string) => {
    if (!activeNote) return;
    if (!isEditing) {
      const nextPersonal = activeNote.userPersonalAnnotations
        ? `${activeNote.userPersonalAnnotations}\n\n${snippet}`
        : snippet;
      setEditTitle(activeNote.discoveryTitle);
      setEditSummary(activeNote.executiveSummary);
      setEditWhyItMatters(activeNote.whyItMatters);
      setEditWorkedExamples(getWorkedExampleForNote(activeNote, linkedPaper));
      setEditMethods(activeNote.methodsAndEvidence);
      setEditLimitations(activeNote.limitationsAndCritique);
      setEditPersonalNotes(nextPersonal);
      setIsEditing(true);
      scheduleAutosave({
        title: activeNote.discoveryTitle,
        summary: activeNote.executiveSummary,
        why: activeNote.whyItMatters,
        workedExamples: getWorkedExampleForNote(activeNote, linkedPaper),
        methods: activeNote.methodsAndEvidence,
        limitations: activeNote.limitationsAndCritique,
        personal: nextPersonal,
      });
    } else {
      const nextPersonal = editPersonalNotes
        ? `${editPersonalNotes}\n\n${snippet}`
        : snippet;
      setEditPersonalNotes(nextPersonal);
      scheduleAutosave({ personal: nextPersonal });
    }
  };

  const buildMarkdown = (n: StructuredNote) => {
    const workedEx = getWorkedExampleForNote(n, linkedPaper);
    return `# ${n.discoveryTitle}\n\n**Source:** ${n.sourceUrl}\n**Last Updated:** ${new Date(
      n.updatedAt
    ).toLocaleDateString()}\n\n## 1. Introduction & Executive Summary\n\n${
      n.executiveSummary
    }\n\n## 2. Why This Research Matters\n\n${
      n.whyItMatters
    }\n\n## 3. Core Concepts & Definitions\n\n${n.coreConceptsAndDefinitions
      .map((c) => `- **${c.term}**: ${c.definition}`)
      .join('\n')}\n\n## 4. Theoretical & Step-by-Step Mechanism\n\n${n.mechanismSteps
      .map((s, i) => `${i + 1}. ${s}`)
      .join('\n\n')}\n\n## 5. Worked Examples & Intuitive Walkthrough\n\n${workedEx}\n\n## 6. Empirical Findings & Evidence\n\n${
      n.methodsAndEvidence
    }\n\n## 7. Key Formulas & Quantitative Models\n\n${
      n.equations.length > 0
        ? n.equations.map((eq) => `### ${eq.title}\n\`${eq.formula}\`\n${eq.intuition}`).join('\n\n')
        : 'Not applicable to this study.'
    }\n\n## 8. Limitations & Critical Evaluation\n\n${
      n.limitationsAndCritique
    }\n\n## 9. Key Takeaways & Revision Summary\n\n${n.examRevisionSheet
      .map((b) => `- ${b}`)
      .join('\n')}\n\n## 10. Source References & Personal Reflections\n\n${
      n.citations.map((c) => `- ${c.label} (${c.venue}, ${c.year}) — ${c.url}`).join('\n')
    }\n\n### Personal Reflections\n${n.userPersonalAnnotations || 'None recorded.'}\n`;
  };

  const handleCopyMarkdown = (note: StructuredNote) => {
    navigator.clipboard?.writeText(buildMarkdown(note));
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2000);
  };

  const handleDownloadMarkdown = (note: StructuredNote) => {
    const md = buildMarkdown(note);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.discoveryTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const scrollToNoteSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* LEFT COLUMN (3 cols): Document Index & Quick Note Generator */}
      <aside className="lg:col-span-3 orbit-glass-panel rounded-[26px] p-4 space-y-4">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-sm font-bold text-white">Study Documents</h2>
            <p className="text-[11px] text-white/55">
              {approvedNotes.length} saved {approvedNotes.length === 1 ? 'document' : 'documents'}
            </p>
          </div>
        </div>

        {/* Search Notes */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-white/45 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search study documents..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder:text-white/45 focus:outline-none focus:border-white/30"
          />
        </div>

        {/* Notes List */}
        {filteredNotes.length === 0 ? (
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-xs text-white/65 space-y-2">
            <p>No saved study notes match your filter yet.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {filteredNotes.map((note) => {
              const isSelected = activeNote?.id === note.id;
              return (
                <button
                  key={note.id}
                  onClick={async () => {
                    if (isEditing) {
                      await saveDocumentEditsNow();
                    }
                    setSelectedNoteId(note.id);
                    setIsEditing(false);
                  }}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all space-y-1 ${
                    isSelected
                      ? 'bg-white text-[#0B0A0E] border-white shadow-md'
                      : 'bg-white/[0.03] text-white border-white/10 hover:bg-white/[0.07]'
                  }`}
                >
                  <div className="text-xs font-bold line-clamp-2 leading-snug">
                    {note.discoveryTitle}
                  </div>
                  <div
                    className={`text-[11px] font-mono ${
                      isSelected ? 'text-[#0B0A0E]/70' : 'text-white/50'
                    }`}
                  >
                    Updated {new Date(note.updatedAt).toLocaleDateString()}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Quick Create Study Note from Any Paper */}
        <div className="pt-3 border-t border-white/10 space-y-2">
          <span className="text-[11px] font-mono text-white/50 block px-1">
            Generate New Note From Paper:
          </span>
          <div className="space-y-1.5">
            {discoveries.slice(0, 4).map((d) => (
              <button
                key={d.id}
                onClick={() => onOpenDiscovery(d, 'notes')}
                className="w-full text-left px-3 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-xs text-white/85 flex items-center justify-between gap-2 transition-colors"
              >
                <span className="truncate">{d.title}</span>
                <Plus className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* RIGHT MAIN DOCUMENT STAGE (9 cols): Clean, Long-Form Academic Document */}
      <main className="lg:col-span-9">
        {!activeNote ? (
          <div className="orbit-glass-panel rounded-[28px] p-10 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl orbit-glass-pill mx-auto flex items-center justify-center text-emerald-300">
              <FileText className="w-6 h-6" />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h2 className="text-lg font-bold text-white">
                Create Your First Research Study Document
              </h2>
              <p className="text-xs sm:text-sm text-white/65 leading-relaxed">
                Open any research paper or GitHub repository and click <strong>Create Study Notes</strong> to generate a complete long-form document with definitions, worked examples, formulas, and revision summaries.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2.5 pt-2">
              {discoveries.slice(0, 2).map((d) => (
                <button
                  key={d.id}
                  onClick={() => onOpenDiscovery(d, 'notes')}
                  className="px-4 py-2.5 rounded-full bg-white text-[#0B0A0E] text-xs font-bold hover:bg-white/90 transition-colors"
                >
                  Create Note: {d.title.slice(0, 38)}...
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-[28px] bg-[#111018] border border-white/12 p-6 sm:p-10 space-y-8 shadow-2xl">
            {/* Document Top Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-white/10">
              <div className="flex flex-wrap items-center gap-2">
                {linkedPaper && (
                  <>
                    <button
                      onClick={() => onOpenDiscovery(linkedPaper, 'reader')}
                      className="px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/15 border border-white/10 text-xs font-medium text-white transition-colors inline-flex items-center gap-1.5"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Open Source Paper</span>
                    </button>
                    <button
                      onClick={() => onOpenDiscovery(linkedPaper, 'professor')}
                      className="px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/15 border border-white/10 text-xs font-medium text-white transition-colors inline-flex items-center gap-1.5"
                    >
                      <GraduationCap className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Ask Professor</span>
                    </button>
                  </>
                )}
                <a
                  href={activeNote.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/15 border border-white/10 text-xs font-mono text-white/80 hover:text-white inline-flex items-center gap-1.5"
                >
                  <span>Primary Source</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                {/* Live Autosave Status Badge */}
                <span className="px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/10 text-[11px] font-mono inline-flex items-center gap-1.5">
                  {autosaveStatus === 'saving' ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin text-amber-300" />
                      <span className="text-amber-200">Autosaving...</span>
                    </>
                  ) : autosaveStatus === 'error' ? (
                    <>
                      <AlertCircle className="w-3 h-3 text-rose-400" />
                      <span className="text-rose-300">Save error — click Done Editing to retry</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3 h-3 text-emerald-300" />
                      <span className="text-emerald-300">Saved to Library</span>
                    </>
                  )}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowOutline((prev) => !prev)}
                  className="px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-white/15 border border-white/10 text-xs font-medium text-white/85 inline-flex items-center gap-1.5"
                >
                  <List className="w-3.5 h-3.5 text-emerald-300" />
                  <span>{showOutline ? 'Hide Outline' : 'Outline'}</span>
                </button>

                {!isEditing ? (
                  <button
                    onClick={() => startEditing(activeNote)}
                    className="px-4 py-2 rounded-xl bg-white text-[#0B0A0E] text-xs font-bold hover:bg-white/90 transition-colors inline-flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Mode</span>
                  </button>
                ) : (
                  <button
                    onClick={saveDocumentEditsNow}
                    className="px-4 py-2 rounded-xl bg-emerald-400 text-[#0B0A0E] text-xs font-bold hover:bg-emerald-300 transition-colors inline-flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Reading Mode (Save)</span>
                  </button>
                )}

                <button
                  onClick={() => handleCopyMarkdown(activeNote)}
                  className="px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-white/15 border border-white/10 text-xs font-medium text-white inline-flex items-center gap-1.5"
                >
                  {copiedToast ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span className="text-emerald-200">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleDownloadMarkdown(activeNote)}
                  className="px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-white/15 border border-white/10 text-xs font-medium text-white inline-flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export .md</span>
                </button>

                <button
                  onClick={() => onDeleteNote(activeNote.id)}
                  title="Delete study document"
                  className="p-2 rounded-xl bg-white/[0.04] hover:bg-rose-500/15 border border-white/10 text-white/50 hover:text-rose-300 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Collapsible Document Outline (Table of Contents) */}
            {showOutline && (
              <nav
                aria-label="Study document outline"
                className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2.5"
              >
                <div className="flex items-center justify-between text-xs font-mono text-white/55">
                  <span>DOCUMENT OUTLINE · JUMP TO SECTION</span>
                  <span>{isEditing ? 'EDITING MODE ACTIVE' : 'READING MODE'}</span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {[
                    { id: 'note-sec-intro', label: '1. Introduction' },
                    { id: 'note-sec-significance', label: '2. Research Significance' },
                    { id: 'note-sec-definitions', label: '3. Definitions & Terminology' },
                    { id: 'note-sec-mechanism', label: '4. Step-by-Step Mechanism' },
                    { id: 'note-sec-worked', label: '5. Worked Example' },
                    { id: 'note-sec-evidence', label: '6. Empirical Evidence' },
                    ...(activeNote.equations.length > 0
                      ? [{ id: 'note-sec-formulas', label: '7. Formulas & Models' }]
                      : []),
                    { id: 'note-sec-limitations', label: '8. Limitations & Critique' },
                    { id: 'note-sec-takeaways', label: '9. Key Takeaways' },
                    { id: 'note-sec-references', label: '10. References & Personal Notes' },
                  ].map((sec) => (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => scrollToNoteSection(sec.id)}
                      className="px-3 py-1 rounded-lg bg-white/[0.04] hover:bg-white/10 border border-white/10 text-white/80 hover:text-emerald-300 transition-colors"
                    >
                      {sec.label}
                    </button>
                  ))}
                </div>
              </nav>
            )}

            {/* Quick Structured Block Inserter when Editing */}
            {isEditing && (
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/25 text-xs">
                <span className="text-emerald-300 font-mono text-[11px]">
                  Editing Mode · Insert block into Personal Reflections:
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      insertRichBlockIntoAnnotations('### Subheading\nWrite your analytical note here...')
                    }
                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                  >
                    + Subheading
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      insertRichBlockIntoAnnotations(
                        '| Variable / Condition | Baseline | Observed Result |\n| --- | --- | --- |\n| Primary Metric | -- | -- |'
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                  >
                    + Summary Table
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      insertRichBlockIntoAnnotations(
                        'Worked Calculation:\n- Given:\n- Formula applied:\n- Conclusion:'
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                  >
                    + Worked Example
                  </button>
                </div>
              </div>
            )}

            {/* CONTINUOUS LONG-FORM ACADEMIC STUDY DOCUMENT */}
            <article className="max-w-[74ch] mx-auto space-y-10 text-[#F4F3EF] leading-relaxed">
              {/* Document Title & Provenance Header */}
              <header className="space-y-3 border-b border-white/10 pb-6">
                <div className="flex flex-wrap items-center gap-2 text-xs text-emerald-300 font-mono">
                  <span>STRUCTURED STUDY DOCUMENT</span>
                  <span>·</span>
                  <span>Updated {new Date(activeNote.updatedAt).toLocaleDateString()}</span>
                  {activeNote.tags && activeNote.tags.length > 0 && (
                    <>
                      <span>·</span>
                      <span className="text-white/65">{activeNote.tags.join(' · ')}</span>
                    </>
                  )}
                </div>

                {isEditing ? (
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => {
                      setEditTitle(e.target.value);
                      scheduleAutosave({ title: e.target.value });
                    }}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/25 text-xl sm:text-2xl font-bold text-white focus:outline-none focus:border-emerald-400"
                  />
                ) : (
                  <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight tracking-tight">
                    {activeNote.discoveryTitle}
                  </h1>
                )}

                <div className="text-xs text-white/60 flex flex-wrap items-center gap-3 pt-1">
                  <span>
                    Source URL:{' '}
                    <a
                      href={activeNote.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-300 hover:underline font-mono"
                    >
                      {activeNote.sourceUrl}
                    </a>
                  </span>
                </div>
              </header>

              {/* 1. Introduction & Executive Summary */}
              <section id="note-sec-intro" className="space-y-3 scroll-mt-6">
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  1. Introduction &amp; Executive Summary
                </h2>
                {isEditing ? (
                  <textarea
                    rows={4}
                    value={editSummary}
                    onChange={(e) => {
                      setEditSummary(e.target.value);
                      scheduleAutosave({ summary: e.target.value });
                    }}
                    className="w-full p-4 rounded-xl bg-black/50 border border-white/20 text-sm sm:text-base text-white leading-relaxed focus:outline-none focus:border-emerald-400"
                  />
                ) : (
                  <p className="text-base text-[#E8E6E0] leading-[1.85] whitespace-pre-line">
                    {activeNote.executiveSummary}
                  </p>
                )}
              </section>

              {/* 2. Research Significance & Context */}
              <section id="note-sec-significance" className="space-y-3 scroll-mt-6">
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  2. Research Significance &amp; Problem Context
                </h2>
                {isEditing ? (
                  <textarea
                    rows={3}
                    value={editWhyItMatters}
                    onChange={(e) => {
                      setEditWhyItMatters(e.target.value);
                      scheduleAutosave({ why: e.target.value });
                    }}
                    className="w-full p-4 rounded-xl bg-black/50 border border-white/20 text-sm sm:text-base text-white leading-relaxed focus:outline-none focus:border-emerald-400"
                  />
                ) : (
                  <div className="pl-4 border-l-2 border-emerald-400/60 space-y-2">
                    <p className="text-base text-[#E8E6E0] leading-[1.85] whitespace-pre-line">
                      {activeNote.whyItMatters}
                    </p>
                  </div>
                )}

                {activeNote.prerequisites && activeNote.prerequisites.length > 0 && (
                  <div className="pt-2 space-y-1.5">
                    <h3 className="text-xs font-mono uppercase tracking-wider text-white/55">
                      Foundational Prerequisites
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-white/80">
                      {activeNote.prerequisites.map((prereq, idx) => (
                        <li key={idx}>{prereq}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>

              {/* 3. Definitions and Important Terminology */}
              {activeNote.coreConceptsAndDefinitions.length > 0 && (
                <section id="note-sec-definitions" className="space-y-4 scroll-mt-6">
                  <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                    3. Definitions &amp; Essential Terminology
                  </h2>
                  <div className="overflow-x-auto rounded-xl border border-white/12">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="bg-white/[0.04] border-b border-white/10 text-xs font-mono uppercase text-white/60">
                          <th className="py-3 px-4 w-1/3">Technical Term</th>
                          <th className="py-3 px-4">Definition &amp; Role in Study</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {activeNote.coreConceptsAndDefinitions.map((c, idx) => (
                          <tr key={idx}>
                            <td className="py-3.5 px-4 font-semibold text-emerald-300 align-top">
                              {c.term}
                            </td>
                            <td className="py-3.5 px-4 text-[#E4E2DC] leading-relaxed">
                              {c.definition}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {/* 4. Step-by-Step Mechanism & Methodology */}
              {activeNote.mechanismSteps.length > 0 && (
                <section id="note-sec-mechanism" className="space-y-4 scroll-mt-6">
                  <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                    4. Theoretical &amp; Step-by-Step Mechanism
                  </h2>
                  <ol className="space-y-3 text-base text-[#E8E6E0] leading-[1.8]">
                    {activeNote.mechanismSteps.map((step, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="font-mono text-xs font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/25 rounded-md px-2 py-0.5 mt-1 shrink-0">
                          Step {i + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </section>
              )}

              {/* 5. Examples & Worked Explanations */}
              <section id="note-sec-worked" className="space-y-3 scroll-mt-6">
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  5. Examples &amp; Worked Explanation
                </h2>
                {isEditing ? (
                  <textarea
                    rows={5}
                    value={editWorkedExamples}
                    onChange={(e) => {
                      setEditWorkedExamples(e.target.value);
                      scheduleAutosave({ workedExamples: e.target.value });
                    }}
                    className="w-full p-4 rounded-xl bg-black/50 border border-white/20 text-sm sm:text-base text-white leading-relaxed focus:outline-none focus:border-emerald-400"
                  />
                ) : (
                  <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-sky-300 block">
                      Intuition &amp; Worked Walkthrough
                    </span>
                    <p className="text-base text-[#E8E6E0] leading-[1.85] whitespace-pre-line">
                      {getWorkedExampleForNote(activeNote, linkedPaper)}
                    </p>
                  </div>
                )}
              </section>

              {/* 6. Empirical Evidence & Findings */}
              <section id="note-sec-evidence" className="space-y-3 scroll-mt-6">
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  6. Empirical Evidence, Data &amp; Findings
                </h2>
                {isEditing ? (
                  <textarea
                    rows={4}
                    value={editMethods}
                    onChange={(e) => {
                      setEditMethods(e.target.value);
                      scheduleAutosave({ methods: e.target.value });
                    }}
                    className="w-full p-4 rounded-xl bg-black/50 border border-white/20 text-sm sm:text-base text-white leading-relaxed focus:outline-none focus:border-emerald-400"
                  />
                ) : (
                  <p className="text-base text-[#E8E6E0] leading-[1.85] whitespace-pre-line">
                    {activeNote.methodsAndEvidence}
                  </p>
                )}
              </section>

              {/* 7. Equations & Quantitative Models (When Present) */}
              {activeNote.equations.length > 0 && (
                <section id="note-sec-formulas" className="space-y-4 scroll-mt-6">
                  <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                    7. Formulas &amp; Quantitative Relationships
                  </h2>
                  <div className="space-y-4">
                    {activeNote.equations.map((eq, idx) => (
                      <div
                        key={idx}
                        className="p-5 rounded-2xl bg-black/40 border border-white/12 space-y-3"
                      >
                        <div className="text-xs font-semibold text-white/85">{eq.title}</div>
                        <div className="p-3.5 rounded-xl bg-white/[0.03] font-mono text-sm sm:text-base text-emerald-300 overflow-x-auto">
                          {eq.formula}
                        </div>
                        {eq.variables && eq.variables.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs text-white/75">
                            {eq.variables.map((v, vIdx) => (
                              <div key={vIdx} className="font-mono">
                                <strong className="text-white">{v.symbol}</strong>: {v.meaning} (
                                {v.unit})
                              </div>
                            ))}
                          </div>
                        )}
                        <p className="text-xs sm:text-sm text-white/80 leading-relaxed pt-1 border-t border-white/10">
                          <strong className="text-white">Physical / Mathematical Intuition:</strong>{' '}
                          {eq.intuition}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* 8. Limitations & Critical Evaluation */}
              <section id="note-sec-limitations" className="space-y-3 scroll-mt-6">
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  8. Methodological Limitations &amp; Open Questions
                </h2>
                {isEditing ? (
                  <textarea
                    rows={4}
                    value={editLimitations}
                    onChange={(e) => {
                      setEditLimitations(e.target.value);
                      scheduleAutosave({ limitations: e.target.value });
                    }}
                    className="w-full p-4 rounded-xl bg-black/50 border border-white/20 text-sm sm:text-base text-white leading-relaxed focus:outline-none focus:border-emerald-400"
                  />
                ) : (
                  <p className="text-base text-[#E8E6E0] leading-[1.85] whitespace-pre-line">
                    {activeNote.limitationsAndCritique}
                  </p>
                )}
              </section>

              {/* 9. Key Takeaways & Revision Summary */}
              {activeNote.examRevisionSheet.length > 0 && (
                <section id="note-sec-takeaways" className="space-y-3 scroll-mt-6">
                  <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                    9. Key Takeaways &amp; Revision Summary
                  </h2>
                  <ul className="space-y-2.5 pl-1">
                    {activeNote.examRevisionSheet.map((bullet, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-3 text-base text-[#E8E6E0] leading-relaxed"
                      >
                        <span className="text-emerald-300 font-bold mt-1">•</span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* 10. Source References & Personal Annotations */}
              <section
                id="note-sec-references"
                className="space-y-5 pt-4 border-t border-white/10 scroll-mt-6"
              >
                {activeNote.citations && activeNote.citations.length > 0 && (
                  <div className="space-y-2.5">
                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                      10. Source References &amp; Citations
                    </h2>
                    <ul className="space-y-2 text-xs sm:text-sm text-white/75">
                      {activeNote.citations.map((cit) => (
                        <li
                          key={cit.id}
                          className="p-3 rounded-xl bg-white/[0.02] border border-white/10 flex flex-wrap items-center justify-between gap-2"
                        >
                          <div>
                            <span className="font-semibold text-white">{cit.label}</span>
                            <span className="text-white/55 block text-xs">
                              {cit.authors} · {cit.venue} ({cit.year}) · {cit.statusLabel}
                            </span>
                          </div>
                          <a
                            href={cit.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-mono text-emerald-300 hover:underline inline-flex items-center gap-1"
                          >
                            <span>Open Source</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                      Personal Notes, Excerpts &amp; Reflections
                    </h3>
                    {!isEditing && (
                      <button
                        onClick={() => startEditing(activeNote)}
                        className="text-xs text-emerald-300 hover:underline"
                      >
                        + Edit or add reflection
                      </button>
                    )}
                  </div>

                  {isEditing ? (
                    <textarea
                      rows={6}
                      value={editPersonalNotes}
                      onChange={(e) => {
                        setEditPersonalNotes(e.target.value);
                        scheduleAutosave({ personal: e.target.value });
                      }}
                      placeholder="Write your own synthesis, open questions, or project ideas here..."
                      className="w-full p-4 rounded-xl bg-black/50 border border-white/20 text-sm sm:text-base text-white leading-relaxed focus:outline-none focus:border-emerald-400 font-mono"
                    />
                  ) : (
                    <div className="p-5 rounded-xl bg-white/[0.02] border border-white/10 text-base text-[#E8E6E0] leading-relaxed whitespace-pre-line">
                      {activeNote.userPersonalAnnotations ||
                        'No personal annotations added yet. Click "Edit Mode" or save passages from the Article Reader.'}
                    </div>
                  )}
                </div>
              </section>

              {/* Optional Collapsible Self-Check Questions */}
              {activeNote.flashcards.length > 0 && (
                <section className="pt-4 border-t border-white/10">
                  <button
                    onClick={() => setShowConceptReview((prev) => !prev)}
                    className="w-full flex items-center justify-between py-2 text-left text-sm font-semibold text-white/80 hover:text-white"
                  >
                    <span>
                      Revision Self-Check Questions ({activeNote.flashcards.length} cards)
                    </span>
                    {showConceptReview ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  {showConceptReview && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3">
                      {activeNote.flashcards.map((fc) => {
                        const flipped = !!flippedCardIds[fc.id];
                        return (
                          <div
                            key={fc.id}
                            onClick={() =>
                              setFlippedCardIds((prev) => ({
                                ...prev,
                                [fc.id]: !prev[fc.id],
                              }))
                            }
                            className="p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/25 cursor-pointer space-y-2 transition-all"
                          >
                            <div className="flex items-center justify-between text-[11px] font-mono text-white/50">
                              <span>{flipped ? 'ANSWER' : 'QUESTION'}</span>
                              <span className="inline-flex items-center gap-1 text-emerald-300">
                                <RotateCw className="w-3 h-3" /> Flip
                              </span>
                            </div>
                            <p className="text-sm text-white leading-relaxed">
                              {flipped ? fc.back : fc.front}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              )}
            </article>
          </div>
        )}
      </main>
    </div>
  );
};
