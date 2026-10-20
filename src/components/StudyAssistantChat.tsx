import React, { useState, useEffect, useRef } from 'react';
import {
  DiscoveryItem,
  DifficultyLevel,
  ExplanationLanguage,
  StudyChatMessage,
  StudyChatRolePersona,
  StudyModelTier,
} from '../types/orbit';
import {
  GraduationCap,
  Send,
  Sparkles,
  Trash2,
  Plus,
  RefreshCw,
  Zap,
  Brain,
  BookOpen,
  Quote,
  X,
} from 'lucide-react';

interface StudyAssistantChatProps {
  activePaper?: DiscoveryItem | null;
  attachedPassage?: string;
  onClearAttachedPassage?: () => void;
  language: ExplanationLanguage;
  onLanguageChange: (lang: ExplanationLanguage) => void;
  difficulty: DifficultyLevel;
  onDifficultyChange: (diff: DifficultyLevel) => void;
  onAppendToStudyNotes?: (text: string) => void;
  compact?: boolean;
}

const CHAT_STORAGE_PREFIX = 'orbit_v1_chat_thread_';

export const StudyAssistantChat: React.FC<StudyAssistantChatProps> = ({
  activePaper,
  attachedPassage,
  onClearAttachedPassage,
  language,
  onLanguageChange,
  difficulty,
  onDifficultyChange,
  onAppendToStudyNotes,
  compact = false,
}) => {
  const threadKey = activePaper ? `${CHAT_STORAGE_PREFIX}${activePaper.id}` : `${CHAT_STORAGE_PREFIX}global`;

  const buildWelcomeMessage = (paper?: DiscoveryItem | null): StudyChatMessage => ({
    id: `welcome-${paper?.id || 'global'}`,
    role: 'model',
    text: paper
      ? `Hello! I am your **ORBIT AI Study Assistant** for **"${paper.title}"**.\n\nAsk me to break down any concept, unpack an equation variable-by-variable, test your understanding with Socratic questions, or explain a highlighted passage in **${
          language === 'hinglish' ? 'Hinglish' : 'English'
        }**.`
      : 'Hello! I am your **ORBIT AI Study Assistant**. Ask me any question about quantum error correction, AI architectures, biotechnology, or research methodology—or open any paper to study it together in a multi-turn conversation.',
    createdAt: new Date().toISOString(),
    modelUsed: 'gemini-3.8-flash',
    rolePersona: 'concept_tutor',
  });

  const [messages, setMessages] = useState<StudyChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(threadKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return [buildWelcomeMessage(activePaper)];
  });

  const [rolePersona, setRolePersona] = useState<StudyChatRolePersona>('concept_tutor');
  const [modelTier, setModelTier] = useState<StudyModelTier>('general');
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastFailedInput, setLastFailedInput] = useState<string | null>(null);
  const [addedNoteMsgId, setAddedNoteMsgId] = useState<string | null>(null);

  const threadEndRef = useRef<HTMLDivElement | null>(null);

  // Reload thread when activePaper changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(threadKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          return;
        }
      }
    } catch {
      // ignore
    }
    setMessages([buildWelcomeMessage(activePaper)]);
  }, [threadKey]);

  // Persist thread to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(threadKey, JSON.stringify(messages));
    } catch {
      // ignore storage quota errors
    }
  }, [messages, threadKey]);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isSending]);

  const sendMessage = async (rawPrompt?: string) => {
    const textToSend = (rawPrompt !== undefined ? rawPrompt : inputText).trim();
    if (!textToSend || isSending) return;

    const userMsg: StudyChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text: textToSend,
      createdAt: new Date().toISOString(),
      attachedPassage: attachedPassage || undefined,
    };

    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    if (rawPrompt === undefined) setInputText('');
    setIsSending(true);
    setErrorMsg(null);
    setLastFailedInput(null);

    try {
      const res = await fetch('/api/ai/study-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedHistory.map((m) => ({
            role: m.role,
            text: m.attachedPassage
              ? `[Selected Passage: "${m.attachedPassage}"]\n\n${m.text}`
              : m.text,
          })),
          modelTier,
          rolePersona,
          language,
          difficulty,
          paperContext: activePaper
            ? {
                title: activePaper.title,
                domain: activePaper.domain,
                summary: activePaper.readerLayers.quickOrientation,
                mechanism: activePaper.readerLayers.coreMechanism.join(' '),
                equations: activePaper.equations
                  .map((e) => `${e.title}: ${e.formula} (${e.intuition})`)
                  .join('; '),
                limitations: activePaper.readerLayers.limitationsAndUncertainty,
                selectedPassage: attachedPassage || undefined,
              }
            : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Could not complete study chat turn.');
        setLastFailedInput(textToSend);
      } else {
        const modelReply: StudyChatMessage = {
          id: `mdl-${Date.now()}`,
          role: 'model',
          text: data.reply || 'Here is the breakdown of the concept.',
          createdAt: new Date().toISOString(),
          modelUsed: data.modelUsed,
          rolePersona: data.rolePersona || rolePersona,
        };
        setMessages((prev) => [...prev, modelReply]);
        if (attachedPassage && onClearAttachedPassage) {
          onClearAttachedPassage();
        }
      }
    } catch (err: any) {
      setErrorMsg(
        err.message || 'Network error while contacting the Study Assistant. Click Retry to resend.'
      );
      setLastFailedInput(textToSend);
    } finally {
      setIsSending(false);
    }
  };

  const handleClearHistory = () => {
    const fresh = [buildWelcomeMessage(activePaper)];
    setMessages(fresh);
    localStorage.setItem(threadKey, JSON.stringify(fresh));
    setErrorMsg(null);
  };

  const quickPrompts = activePaper
    ? [
        'Explain the core concept like I am new to this field',
        'Walk through the step-by-step mechanism and why it works',
        'What are the key equations or variables I should memorize?',
        'Quiz me with 1 Socratic question to test my understanding',
      ]
    : [
        'Explain fault-tolerant quantum error correction simply',
        'How does 3D Gaussian Splatting differ from NeRFs?',
        'Explain CRISPR prime editing vs Cas9 double-strand breaks',
        'How should I critically evaluate a scientific preprint?',
      ];

  return (
    <div className="orbit-glass-panel rounded-[26px] border border-white/12 overflow-hidden flex flex-col">
      {/* Top Role Persona & Gemini Model Selector Bar */}
      <div className="p-4 sm:p-5 bg-white/[0.03] border-b border-white/10 space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-400/15 border border-emerald-400/35 flex items-center justify-center text-emerald-300">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white">
                  Gemini Study Assistant
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono">
                  Multi-Turn Chat
                </span>
              </div>
              <p className="text-xs text-white/60">
                {activePaper
                  ? `Studying: ${activePaper.title.slice(0, 68)}${
                      activePaper.title.length > 68 ? '...' : ''
                    }`
                  : 'Ask follow-up questions to build intuition and master complex concepts'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Toggle */}
            <div className="flex items-center bg-black/45 p-0.5 rounded-full border border-white/10 text-[11px]">
              <button
                type="button"
                onClick={() => onLanguageChange('en')}
                className={`px-2.5 py-1 rounded-full transition-colors ${
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
                className={`px-2.5 py-1 rounded-full transition-colors ${
                  language === 'hinglish'
                    ? 'bg-white text-[#0B0A0E] font-semibold'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                Hinglish
              </button>
            </div>

            {/* Depth Selector */}
            <select
              value={difficulty}
              onChange={(e) => onDifficultyChange(e.target.value as DifficultyLevel)}
              aria-label="Explanation depth"
              className="px-2.5 py-1 rounded-full bg-black/45 border border-white/15 text-[11px] text-white focus:outline-none"
            >
              <option value="beginner">Beginner</option>
              <option value="mixed">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>

            <button
              type="button"
              onClick={handleClearHistory}
              title="Reset conversation history"
              className="p-1.5 rounded-full orbit-glass-pill text-white/60 hover:text-rose-300 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Role Persona & Gemini Model Complexity Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
          {/* Role Personas */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-white/50 font-mono mr-1">Tutor Role:</span>
            {[
              {
                id: 'concept_tutor',
                label: 'Concept Explainer',
                desc: 'Step-by-step intuition & analogies',
              },
              {
                id: 'socratic_coach',
                label: 'Socratic Coach',
                desc: 'Guided understanding & recall checks',
              },
              {
                id: 'methodology_critic',
                label: 'Math & Methods Reviewer',
                desc: 'Equations, proofs & experimental rigor',
              },
            ].map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => setRolePersona(role.id as StudyChatRolePersona)}
                title={role.desc}
                className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all ${
                  rolePersona === role.id
                    ? 'bg-emerald-400 text-[#0B0A0E] font-semibold'
                    : 'bg-white/[0.05] text-white/75 hover:text-white border border-white/10'
                }`}
              >
                {role.label}
              </button>
            ))}
          </div>

          {/* Model Complexity Tier Selector */}
          <div className="flex items-center gap-1 bg-black/45 p-1 rounded-full border border-white/10">
            <button
              type="button"
              onClick={() => setModelTier('fast')}
              title="Fast responses using gemini-3.1-flash-lite"
              className={`px-2.5 py-1 rounded-full text-[11px] inline-flex items-center gap-1 transition-all ${
                modelTier === 'fast'
                  ? 'bg-white text-[#0B0A0E] font-semibold'
                  : 'text-white/65 hover:text-white'
              }`}
            >
              <Zap className="w-3 h-3 text-amber-300" />
              <span>Fast (3.1 Lite)</span>
            </button>

            <button
              type="button"
              onClick={() => setModelTier('general')}
              title="General concept study using gemini-3.8-flash"
              className={`px-2.5 py-1 rounded-full text-[11px] inline-flex items-center gap-1 transition-all ${
                modelTier === 'general'
                  ? 'bg-white text-[#0B0A0E] font-semibold'
                  : 'text-white/65 hover:text-white'
              }`}
            >
              <Sparkles className="w-3 h-3 text-emerald-300" />
              <span>General (3.8 Flash)</span>
            </button>

            <button
              type="button"
              onClick={() => setModelTier('complex')}
              title="Deep reasoning & math proofs using gemini-4-argon"
              className={`px-2.5 py-1 rounded-full text-[11px] inline-flex items-center gap-1 transition-all ${
                modelTier === 'complex'
                  ? 'bg-white text-[#0B0A0E] font-semibold'
                  : 'text-white/65 hover:text-white'
              }`}
            >
              <Brain className="w-3 h-3 text-purple-300" />
              <span>Deep (4 Argon)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Attached Highlighted Passage Pill (if user highlighted text in the reader) */}
      {attachedPassage && (
        <div className="px-4 py-2.5 bg-emerald-950/60 border-b border-emerald-500/30 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <Quote className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
            <span className="text-emerald-200 font-medium shrink-0">Attached Excerpt:</span>
            <span className="text-white/85 truncate italic">&ldquo;{attachedPassage}&rdquo;</span>
          </div>
          {onClearAttachedPassage && (
            <button
              type="button"
              onClick={onClearAttachedPassage}
              className="text-white/55 hover:text-white p-1"
              title="Remove attached excerpt"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Scrollable Multi-Turn Conversation Thread */}
      <div
        className={`p-4 sm:p-6 overflow-y-auto space-y-4 ${
          compact ? 'max-h-[380px]' : 'min-h-[320px] max-h-[480px]'
        }`}
      >
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[88%] sm:max-w-[82%] rounded-2xl p-4 space-y-2 ${
                  isUser
                    ? 'bg-white text-[#0B0A0E] rounded-br-xs shadow-md'
                    : 'bg-white/[0.05] border border-white/12 text-[#ECEAE4] rounded-bl-xs'
                }`}
              >
                {msg.attachedPassage && (
                  <div
                    className={`p-2.5 rounded-xl text-xs italic border-l-2 ${
                      isUser
                        ? 'bg-black/10 border-[#0B0A0E]/40 text-[#0B0A0E]/80'
                        : 'bg-black/35 border-emerald-400 text-white/75'
                    }`}
                  >
                    &ldquo;{msg.attachedPassage}&rdquo;
                  </div>
                )}

                <div className="text-sm sm:text-[15px] leading-[1.75] whitespace-pre-line">
                  {msg.text}
                </div>

                {!isUser && (
                  <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] text-white/50">
                    <span className="font-mono">
                      {msg.modelUsed || 'gemini-3.8-flash'} ·{' '}
                      {(msg.rolePersona || 'concept_tutor').replace('_', ' ')}
                    </span>

                    {onAppendToStudyNotes && (
                      <button
                        type="button"
                        onClick={() => {
                          onAppendToStudyNotes(msg.text);
                          setAddedNoteMsgId(msg.id);
                          setTimeout(() => setAddedNoteMsgId(null), 2000);
                        }}
                        className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-emerald-300 font-medium inline-flex items-center gap-1 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        <span>
                          {addedNoteMsgId === msg.id ? 'Added to Study Notes!' : 'Add to Study Notes'}
                        </span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isSending && (
          <div className="flex items-start">
            <div className="px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/10 text-xs text-emerald-300 inline-flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>
                Thinking with{' '}
                {modelTier === 'fast'
                  ? 'gemini-3.1-flash-lite'
                  : modelTier === 'complex'
                  ? 'gemini-4-argon'
                  : 'gemini-3.8-flash'}
                ...
              </span>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs text-amber-200">
            <span>{errorMsg}</span>
            {lastFailedInput && (
              <button
                type="button"
                onClick={() => sendMessage(lastFailedInput)}
                className="px-3 py-1.5 rounded-xl bg-white text-[#0B0A0E] font-bold shrink-0"
              >
                Retry
              </button>
            )}
          </div>
        )}

        <div ref={threadEndRef} />
      </div>

      {/* Starter Concept Prompts + Input Bar */}
      <div className="p-4 bg-[#14121D] border-t border-white/10 space-y-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {quickPrompts.map((qp) => (
            <button
              key={qp}
              type="button"
              disabled={isSending}
              onClick={() => sendMessage(qp)}
              className="px-3 py-1 rounded-full bg-white/[0.05] hover:bg-white/[0.12] border border-white/10 text-[11px] text-white/80 hover:text-white transition-colors text-left"
            >
              {qp}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              language === 'hinglish'
                ? 'Koi bhi concept, formula, ya mechanism poochein...'
                : 'Ask a follow-up question about any concept, formula, or mechanism...'
            }
            className="flex-1 px-4 py-3 rounded-2xl bg-black/50 border border-white/15 text-xs sm:text-sm text-white placeholder:text-white/45 focus:outline-none focus:border-emerald-400"
          />
          <button
            type="submit"
            disabled={isSending || !inputText.trim()}
            className="px-5 py-3 rounded-2xl bg-white text-[#0B0A0E] text-xs sm:text-sm font-bold hover:bg-white/90 disabled:opacity-50 transition-all inline-flex items-center gap-1.5 shrink-0 shadow-md"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Ask</span>
          </button>
        </form>
      </div>
    </div>
  );
};
