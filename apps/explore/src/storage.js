import { DEFAULT_PREFERENCES, validatePreferences } from './contracts.js';

export const PREFERENCES_KEY = 'orbit-explore:preferences:v1';
const browserStorage = () => globalThis.localStorage;

// Storage access itself can throw in sandboxed/private contexts. Never let it
// prevent learning; failure is intentionally a session-only preference change.
export function savePreferences(preferences, getStorage = browserStorage) {
  try {
    const value = validatePreferences(preferences);
    getStorage().setItem(PREFERENCES_KEY, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function loadPreferences(getStorage = browserStorage) {
  const defaults = () => ({ ...DEFAULT_PREFERENCES });
  try {
    const storage = getStorage();
    const stored = storage.getItem(PREFERENCES_KEY);
    // Never interpret an unknown/corrupt current payload as legacy data or
    // overwrite it on read. Explicit later user changes may replace it.
    if (stored !== null) return validatePreferences(JSON.parse(stored));
    const legacy = {
      locale: storage.getItem('orbit-lang'),
      difficulty: storage.getItem('orbit-level'),
      low: storage.getItem('orbit-low'),
      mastery: storage.getItem('orbit-mastery'),
    };
    const value = defaults();
    if (['en', 'hi'].includes(legacy.locale)) value.locale = legacy.locale;
    if (['beginner', 'standard', 'advanced'].includes(legacy.difficulty)) value.difficulty = legacy.difficulty;
    for (const key of ['low', 'mastery']) {
      if (legacy[key] === 'true' || legacy[key] === 'false') value[key] = legacy[key] === 'true';
    }
    if (Object.values(legacy).some(item => item !== null)) savePreferences(value, () => storage);
    return value;
  } catch {
    return defaults();
  }
}
