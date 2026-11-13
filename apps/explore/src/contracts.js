// Runtime contracts are independent of renderer, storage, and numerical solver.
export const SCHEMA_VERSION = 1;
export const DEFAULT_PREFERENCES = Object.freeze({
  schemaVersion: SCHEMA_VERSION,
  locale: 'en',
  difficulty: 'standard',
  low: false,
  mastery: false,
});

function record(value, keys) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('Expected a contract object');
  }
  const actual = Reflect.ownKeys(value);
  if (actual.length !== keys.length || actual.some(key => !keys.includes(key))) {
    throw new TypeError('Unexpected or missing contract field');
  }
  for (const key of keys) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !Object.hasOwn(descriptor, 'value') || !descriptor.enumerable) {
      throw new TypeError('Contract fields must be enumerable own data properties');
    }
  }
}

function version(value) {
  if (value !== SCHEMA_VERSION) throw new RangeError('Unsupported schema version');
}

function oneOf(value, values, name) {
  if (!values.includes(value)) throw new RangeError(`Invalid ${name}`);
}

function bool(value, name) {
  if (typeof value !== 'boolean') throw new TypeError(`Invalid ${name}`);
}

function integer(value, min, max, name, increment = 1) {
  if (!Number.isSafeInteger(value) || value < min || value > max || (value - min) % increment !== 0) {
    throw new RangeError(`Invalid ${name}`);
  }
}

export function validatePreferences(value) {
  record(value, Object.keys(DEFAULT_PREFERENCES));
  version(value.schemaVersion);
  oneOf(value.locale, ['en', 'hi'], 'locale');
  oneOf(value.difficulty, ['beginner', 'standard', 'advanced'], 'difficulty');
  bool(value.low, 'low');
  bool(value.mastery, 'mastery');
  return { ...value };
}

const SCENE_KEYS = ['schemaVersion', 'sceneId', 'speed', 'gravity', 'zoom', 'selected', 'index', 'playing', 'locale', 'difficulty', 'low'];

export function validateSceneSnapshot(value) {
  record(value, SCENE_KEYS);
  version(value.schemaVersion);
  oneOf(value.sceneId, ['gravity-orbits'], 'sceneId');
  integer(value.speed, 10, 180, 'speed', 5);
  integer(value.gravity, 20, 200, 'gravity', 5);
  integer(value.zoom, 0, 2, 'zoom');
  integer(value.index, 0, Number.MAX_SAFE_INTEGER, 'index');
  oneOf(value.selected, ['planet', 'star'], 'selected');
  bool(value.playing, 'playing');
  validatePreferences({ schemaVersion: value.schemaVersion, locale: value.locale,
    difficulty: value.difficulty, low: value.low, mastery: false });
  return { ...value };
}

export function createSceneSnapshot(state) {
  return validateSceneSnapshot({
    schemaVersion: SCHEMA_VERSION,
    sceneId: 'gravity-orbits',
    speed: state.speed,
    gravity: state.gravity,
    zoom: state.zoom,
    selected: state.selected,
    index: state.index,
    playing: state.playing,
    locale: state.locale,
    difficulty: state.difficulty,
    low: state.low,
  });
}
