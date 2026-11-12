import type { DiscoveryItem } from '../types/orbit';

export interface JourneyActivity {
  readPercent: number;
  quizAttempts: number;
  lastOpenedAt: string;
}

export type LearningNextStep = {
  item: DiscoveryItem;
  action: 'resume' | 'practice';
  readPercent: number;
} | null;

/** Counts observed interactions only; seeded demonstration records are excluded. */
export function summarizeJourney(activity: Record<string, JourneyActivity>) {
  const values = Object.values(activity);
  return {
    explored: values.length,
    read: values.filter((record) => record.readPercent >= 80).length,
    practiced: values.filter((record) => record.quizAttempts > 0).length,
  };
}

/** Continue an unfinished paper, or suggest a quiz for one read but not practiced. */
export function chooseNextLearningStep(
  discoveries: DiscoveryItem[],
  activity: Record<string, JourneyActivity>,
): LearningNextStep {
  const candidates: Array<{ item: DiscoveryItem; action: 'resume' | 'practice'; readPercent: number; lastOpenedAt: string }> = [];
  for (const item of discoveries) {
    const record = activity[item.id];
    if (!record) continue;
    if (record.readPercent < 80) {
      candidates.push({ item, action: 'resume', readPercent: record.readPercent, lastOpenedAt: record.lastOpenedAt });
    } else if (record.quizAttempts === 0) {
      candidates.push({ item, action: 'practice', readPercent: record.readPercent, lastOpenedAt: record.lastOpenedAt });
    }
  }
  candidates.sort((a, b) => {
    const aTime = Date.parse(a.lastOpenedAt) || 0;
    const bTime = Date.parse(b.lastOpenedAt) || 0;
    return bTime - aTime;
  });
  const next = candidates[0];
  return next ? { item: next.item, action: next.action, readPercent: next.readPercent } : null;
}

/** Transparent, non-AI ranking; respects selected interests and past exploration. */
export function recommendDiscoveries(
  discoveries: DiscoveryItem[],
  activity: Record<string, JourneyActivity>,
  interests: string[],
  bookmarks: string[],
  limit = 3,
) {
  return discoveries
    .filter((item) => !Object.prototype.hasOwnProperty.call(activity, item.id))
    .map((item, index) => ({
      item,
      index,
      score: (interests.includes(item.domain) ? 10 : 0)
        + (bookmarks.includes(item.id) ? 3 : 0)
        + (item.evidenceStatus === 'Peer-Reviewed' ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, Math.max(0, limit))
    .map(({ item }) => item);
}
