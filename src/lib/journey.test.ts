import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { chooseNextLearningStep, recommendDiscoveries, summarizeJourney } from './journey';
import type { DiscoveryItem } from '../types/orbit';

const paper = (id: string, domain: DiscoveryItem['domain'], reviewed = true) =>
  ({ id, domain, evidenceStatus: reviewed ? 'Peer-Reviewed' : 'Preprint' }) as DiscoveryItem;

describe('ORBIT learning journey', () => {
  it('starts at zero with no user activity', () => {
    assert.deepEqual(summarizeJourney({}), { explored: 0, read: 0, practiced: 0 });
  });

  it('counts actual reading and quiz attempts separately', () => {
    const activity = {
      first: { readPercent: 84, quizAttempts: 0, lastOpenedAt: '2026-11-01T00:00:00Z' },
      second: { readPercent: 30, quizAttempts: 1, lastOpenedAt: '2026-11-02T00:00:00Z' },
    };
    assert.deepEqual(summarizeJourney(activity), { explored: 2, read: 1, practiced: 1 });
  });

  it('prioritizes a recent unfinished read', () => {
    const items = [paper('one', 'AI & Computing'), paper('two', 'Mathematics')];
    const activity = {
      one: { readPercent: 20, quizAttempts: 0, lastOpenedAt: '2026-11-05T00:00:00Z' },
      two: { readPercent: 60, quizAttempts: 0, lastOpenedAt: '2026-11-08T00:00:00Z' },
    };
    assert.deepEqual(chooseNextLearningStep(items, activity), { item: items[1], action: 'resume', readPercent: 60 });
  });

  it('offers practice only once a paper is mostly read', () => {
    const items = [paper('one', 'AI & Computing')];
    const activity = { one: { readPercent: 90, quizAttempts: 0, lastOpenedAt: '2026-11-05T00:00:00Z' } };
    assert.equal(chooseNextLearningStep(items, activity)?.action, 'practice');
    activity.one.quizAttempts = 1;
    assert.equal(chooseNextLearningStep(items, activity), null);
  });

  it('personalizes recommendations without repeating visited topics', () => {
    const items = [paper('a', 'Mathematics'), paper('b', 'AI & Computing'), paper('c', 'AI & Computing')];
    const activity = { b: { readPercent: 10, quizAttempts: 0, lastOpenedAt: '2026-11-05T00:00:00Z' } };
    assert.deepEqual(recommendDiscoveries(items, activity, ['AI & Computing'], [], 3).map((p) => p.id), ['c', 'a']);
  });

  it('has stable, non-random defaults', () => {
    const items = [paper('first', 'AI & Computing'), paper('second', 'Mathematics')];
    assert.deepEqual(recommendDiscoveries(items, {}, [], [], 3).map((p) => p.id), ['first', 'second']);
  });
});
