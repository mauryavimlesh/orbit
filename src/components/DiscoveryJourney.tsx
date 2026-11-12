import React, { useMemo, useState } from 'react';
import type { DiscoveryItem, MasteryRecord } from '../types/orbit';
import { ArrowRight, BookOpen, Check, Compass, GraduationCap } from 'lucide-react';

const INTERESTS_KEY = 'orbit_v1_journey_interests';

function loadInterests(): string[] {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(INTERESTS_KEY) || '[]');
    return Array.isArray(stored) ? stored.filter((value): value is string => typeof value === 'string').slice(0, 3) : [];
  } catch {
    return [];
  }
}

interface Props {
  discoveries: DiscoveryItem[];
  masteryRecords: MasteryRecord[];
  visitedIds: string[];
  bookmarkedIds: string[];
  onOpen: (item: DiscoveryItem, mode?: 'reader' | 'quiz') => void;
  onOpenLibrary: () => void;
}

/**
 * Local, user-controlled discovery guidance. No remote profiling, streaks,
 * simulated progress, or fabricated mastery statistics.
 */
export const DiscoveryJourney: React.FC<Props> = ({
  discoveries, masteryRecords, visitedIds, bookmarkedIds, onOpen, onOpenLibrary,
}) => {
  const [interests, setInterests] = useState<string[]>(loadInterests);
  const domains = useMemo(() => Array.from(new Set(discoveries.map((item) => item.domain))).slice(0, 12), [discoveries]);
  const realRecords = useMemo(
    () => masteryRecords.filter((record) => visitedIds.includes(record.discoveryId)),
    [masteryRecords, visitedIds]
  );
  const readCount = realRecords.filter((record) => record.progressPercent >= 80).length;
  const practicedCount = realRecords.filter((record) => record.quizAttempts > 0).length;
  const continueRecord = [...realRecords]
    .filter((record) => record.progressPercent < 80)
    .sort((a, b) => Date.parse(b.lastStudiedAt || '') - Date.parse(a.lastStudiedAt || ''))[0];
  const continuePaper = continueRecord && discoveries.find((paper) => paper.id === continueRecord.discoveryId);

  const recommended = useMemo(() => {
    const candidates = discoveries.filter((item) => !visitedIds.includes(item.id));
    return candidates
      .map((item, index) => ({
        item, index,
        score: (interests.includes(item.domain) ? 10 : 0)
          + (bookmarkedIds.includes(item.id) ? 3 : 0)
          + (item.evidenceStatus === 'Peer-Reviewed' ? 1 : 0),
      }))
      .sort((a, b) => b.score - a.score || a.index - b.index)
      .slice(0, 3).map(({item}) => item);
  }, [discoveries, visitedIds, interests, bookmarkedIds]);

  const toggleInterest = (domain: string) => {
    const next = interests.includes(domain)
      ? interests.filter((item) => item !== domain)
      : [...interests, domain].slice(0, 3);
    setInterests(next);
    try { localStorage.setItem(INTERESTS_KEY, JSON.stringify(next)); } catch { /* private mode */ }
  };

  return (
    <section aria-labelledby="orbit-journey-title" className="orbit-glass-panel rounded-[28px] p-5 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <span className="text-[11px] uppercase tracking-wider text-emerald-300 font-mono">Your discovery journey</span>
          <h2 id="orbit-journey-title" className="font-display text-xl sm:text-2xl font-bold text-white">
            {visitedIds.length ? 'Continue learning at your pace' : 'Find your first discovery'}
          </h2>
          <p className="text-xs sm:text-sm text-white/70 max-w-2xl">
            Pick a few interests, open something fascinating, then practice when you're ready. No streak pressure.
          </p>
        </div>
        <button type="button" onClick={onOpenLibrary}
          className="orbit-glass-pill rounded-full px-4 py-2 text-xs text-white hover:bg-white/20 inline-flex items-center gap-2">
          My learning <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-white">What interests you?</h3>
          <span className="text-[11px] text-white/55">{interests.length}/3 selected · stored on this device</span>
        </div>
        <div className="flex flex-wrap gap-2" aria-label="Choose up to three research interests">
          {domains.map((domain) => {
            const selected = interests.includes(domain);
            return (
              <button type="button" key={domain} onClick={() => toggleInterest(domain)}
                aria-pressed={selected} disabled={!selected && interests.length >= 3}
                className={`rounded-full px-3 py-1.5 border text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  selected ? 'bg-emerald-400/20 text-emerald-200 border-emerald-400/50'
                    : 'orbit-glass-pill text-white/75 hover:text-white hover:bg-white/20'
                }`}>
                {selected && <Check className="w-3 h-3 inline-block mr-1" aria-hidden="true" />}{domain}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3" aria-label="Your actual learning activity">
        {[
          { label: 'Explored', value: visitedIds.length, help: 'Topics you opened' },
          { label: 'Read 80%+', value: readCount, help: 'Topics you read most of' },
          { label: 'Practiced', value: practicedCount, help: 'Topics with a quiz attempt' },
        ].map((metric) => (
          <div key={metric.label} className="orbit-glass-subtle rounded-2xl p-3 sm:p-4 text-center">
            <div className="text-xl sm:text-2xl font-semibold text-white font-mono" aria-label={`${metric.value} ${metric.label}`}>{metric.value}</div>
            <div className="text-xs text-white/85 font-medium">{metric.label}</div>
            <div className="text-[10px] text-white/50 mt-1">{metric.help}</div>
          </div>
        ))}
      </div>

      {continuePaper && (
        <div className="orbit-glass-subtle rounded-2xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] text-emerald-300 font-semibold">Pick up where you left off</div>
            <p className="text-sm text-white font-medium line-clamp-2">{continuePaper.title}</p>
            <p className="text-xs text-white/55">{continueRecord.progressPercent}% read so far</p>
          </div>
          <button type="button" onClick={() => onOpen(continuePaper, 'reader')}
            className="rounded-full bg-white text-[#0B0A0E] text-xs font-bold px-4 py-2 flex items-center gap-2">
            Resume <BookOpen className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex flex-wrap justify-between gap-2 items-center">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2"><Compass className="w-4 h-4 text-emerald-300" /> Suggested for you</h3>
          <span className="text-[11px] text-white/55">{interests.length ? 'Matched to your interests' : 'Explore a few starting points'}</span>
        </div>
        {recommended.length ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {recommended.map((paper) => (
              <div key={paper.id} className="orbit-glass-subtle rounded-2xl p-4 flex flex-col gap-3 min-w-0">
                <div className="text-[11px] text-emerald-300">{paper.domain}</div>
                <h4 className="text-sm font-semibold text-white leading-snug line-clamp-3">{paper.title}</h4>
                <p className="text-xs text-white/65 line-clamp-2 flex-1">{paper.oneSentenceWhyItMatters}</p>
                <button type="button" onClick={() => onOpen(paper, 'reader')}
                  className="self-start rounded-full bg-white text-[#0B0A0E] px-4 py-2 text-xs font-bold inline-flex items-center gap-2">
                  Explore <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="orbit-glass-subtle rounded-2xl p-4 text-xs text-white/70">
            You've opened all the currently loaded discoveries. Search another topic to keep exploring.
          </div>
        )}
      </div>
      {realRecords.length > 0 && practicedCount === 0 && (
        <p className="text-xs text-white/65 flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-emerald-300 shrink-0" />
          When you're ready, use a paper's quiz to check your understanding. Reading alone is not counted as mastery.
        </p>
      )}
    </section>
  );
};
