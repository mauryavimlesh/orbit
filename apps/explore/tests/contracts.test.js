import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_PREFERENCES, validatePreferences, validateSceneSnapshot, createSceneSnapshot } from '../src/contracts.js';

const scene = () => ({ schemaVersion: 1, sceneId: 'gravity-orbits', speed: 100,
  gravity: 100, zoom: 0, selected: 'planet', index: 0, playing: true,
  locale: 'en', difficulty: 'standard', low: false });

test('default preferences validate, are immutable, and return a defensive copy', () => {
  assert.ok(Object.isFrozen(DEFAULT_PREFERENCES));
  const copy = validatePreferences(DEFAULT_PREFERENCES);
  assert.deepEqual(copy, DEFAULT_PREFERENCES);
  copy.locale = 'hi';
  assert.equal(DEFAULT_PREFERENCES.locale, 'en');
});

test('contracts reject nonobjects, absent and unknown own fields', () => {
  for (const input of [null, [], 1, 'scene', undefined, {}]) {
    assert.throws(() => validatePreferences(input));
    assert.throws(() => validateSceneSnapshot(input));
  }
  assert.throws(() => validatePreferences({ ...DEFAULT_PREFERENCES, tracking: true }));
  assert.throws(() => validatePreferences({ ...DEFAULT_PREFERENCES, [Symbol('x')]: true }));
  const missing = scene(); delete missing.speed;
  assert.throws(() => validateSceneSnapshot(missing));
  assert.throws(() => validateSceneSnapshot({ ...scene(), result: {} }));
});

test('contracts reject accessors without executing them', () => {
  let executed = false;
  const value = { ...DEFAULT_PREFERENCES };
  Object.defineProperty(value, 'locale', { get() { executed = true; return 'en'; } });
  assert.throws(() => validatePreferences(value));
  assert.equal(executed, false);
  const hidden = { ...DEFAULT_PREFERENCES };
  Object.defineProperty(hidden, 'locale', { value: 'en', enumerable: false });
  assert.throws(() => validatePreferences(hidden));
});

test('preferences reject future versions, invalid enums and boolean coercion', () => {
  for (const [key, values] of Object.entries({ schemaVersion: [0, 2, '1'], locale: ['fr', 'EN', null],
    difficulty: ['', 'expert', null], low: [0, 'true', null], mastery: [1, 'false', null] })) {
    for (const value of values) assert.throws(() => validatePreferences({ ...DEFAULT_PREFERENCES, [key]: value }));
  }
});

test('scene captures only versioned learning context, excluding trajectories and user text', () => {
  const input = { ...scene(), result: { states: ['large trajectory'] }, question: 'private text', mastery: true };
  assert.deepEqual(createSceneSnapshot(input), scene());
  const original = scene();
  const copy = validateSceneSnapshot(original);
  copy.speed = 180;
  assert.equal(original.speed, 100);
});

test('scene boundaries and enum combinations validate', () => {
  for (const speed of [10, 100, 180]) for (const gravity of [20, 100, 200]) {
    assert.equal(validateSceneSnapshot({ ...scene(), speed, gravity }).speed, speed);
  }
  assert.equal(validateSceneSnapshot({ ...scene(), selected: 'star', locale: 'hi', difficulty: 'advanced',
    zoom: 2, playing: false, low: true, index: Number.MAX_SAFE_INTEGER }).locale, 'hi');
});

test('scene rejects nonfinite numbers, wrong units, off-step and out-of-range values', () => {
  for (const key of ['speed', 'gravity', 'zoom', 'index']) {
    for (const value of [NaN, Infinity, -Infinity, '100', null, -1, 0.5]) {
      assert.throws(() => validateSceneSnapshot({ ...scene(), [key]: value }));
    }
  }
  for (const [key, values] of Object.entries({ speed: [0, 11, 185], gravity: [0, 21, 205], zoom: [3],
    index: [Number.MAX_SAFE_INTEGER + 1], selected: ['moon'], sceneId: ['other'], playing: ['true'], schemaVersion: [2] })) {
    for (const value of values) assert.throws(() => validateSceneSnapshot({ ...scene(), [key]: value }));
  }
});
