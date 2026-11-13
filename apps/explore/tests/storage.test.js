import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_PREFERENCES } from '../src/contracts.js';
import { loadPreferences, savePreferences, PREFERENCES_KEY } from '../src/storage.js';

function memory(initial = {}) {
  const values = new Map(Object.entries(initial));
  return { values, getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value) };
}

test('fresh storage returns defaults without writing', () => {
  const storage = memory();
  const result = loadPreferences(() => storage);
  assert.deepEqual(result, DEFAULT_PREFERENCES);
  assert.notEqual(result, DEFAULT_PREFERENCES);
  assert.equal(storage.values.size, 0);
});

test('preferences roundtrip using only the namespaced key', () => {
  const storage = memory({ unrelated: 'preserve' });
  const value = { ...DEFAULT_PREFERENCES, locale: 'hi', difficulty: 'advanced', low: true, mastery: true };
  assert.equal(savePreferences(value, () => storage), true);
  assert.deepEqual(loadPreferences(() => storage), value);
  assert.equal(storage.values.get('unrelated'), 'preserve');
  assert.equal(storage.values.size, 2);
});

test('legacy preferences migrate without deleting old or unrelated data', () => {
  const storage = memory({ 'orbit-lang': 'hi', 'orbit-level': 'beginner', 'orbit-low': 'true', 'orbit-mastery': 'true' });
  const value = loadPreferences(() => storage);
  assert.deepEqual(value, { schemaVersion: 1, locale: 'hi', difficulty: 'beginner', low: true, mastery: true });
  assert.deepEqual(JSON.parse(storage.values.get(PREFERENCES_KEY)), value);
  assert.equal(storage.values.get('orbit-lang'), 'hi');
});

test('invalid legacy values fall back independently', () => {
  const storage = memory({ 'orbit-lang': 'hi', 'orbit-level': 'expert', 'orbit-low': '1', 'orbit-mastery': 'FALSE' });
  assert.deepEqual(loadPreferences(() => storage), { ...DEFAULT_PREFERENCES, locale: 'hi' });
});

test('valid current payload takes priority over stale legacy data', () => {
  const storage = memory({ [PREFERENCES_KEY]: JSON.stringify(DEFAULT_PREFERENCES), 'orbit-lang': 'hi' });
  assert.deepEqual(loadPreferences(() => storage), DEFAULT_PREFERENCES);
});

test('corrupt, invalid and future payloads safely default without overwriting', () => {
  for (const raw of ['{', 'null', '[]', JSON.stringify({ ...DEFAULT_PREFERENCES, schemaVersion: 2 }),
    JSON.stringify({ ...DEFAULT_PREFERENCES, locale: 'fr' }), JSON.stringify({ ...DEFAULT_PREFERENCES, tracking: true })]) {
    const storage = memory({ [PREFERENCES_KEY]: raw, 'orbit-lang': 'hi' });
    assert.deepEqual(loadPreferences(() => storage), DEFAULT_PREFERENCES);
    assert.equal(storage.values.get(PREFERENCES_KEY), raw);
  }
});

test('blocked storage acquisition or reads cannot break startup', () => {
  for (const getStorage of [() => { throw new Error('blocked'); }, () => undefined,
    () => ({ getItem() { throw new Error('blocked'); } })]) {
    assert.deepEqual(loadPreferences(getStorage), DEFAULT_PREFERENCES);
    assert.equal(savePreferences(DEFAULT_PREFERENCES, getStorage), false);
  }
});

test('quota failures preserve readable migrated preferences in memory', () => {
  const storage = memory({ 'orbit-lang': 'hi' });
  storage.setItem = () => { throw new Error('quota'); };
  assert.equal(loadPreferences(() => storage).locale, 'hi');
  assert.equal(savePreferences(DEFAULT_PREFERENCES, () => storage), false);
});

test('invalid saves are rejected before writing or acquiring storage', () => {
  let accessed = false;
  assert.equal(savePreferences({ ...DEFAULT_PREFERENCES, low: 'true' }, () => { accessed = true; return memory(); }), false);
  assert.equal(accessed, false);
});
