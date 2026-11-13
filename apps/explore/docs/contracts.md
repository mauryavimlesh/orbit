# Explore v1 runtime contracts

The dependency-free contracts in `src/contracts.js` are the authoritative v1
runtime boundary. They reject missing/unknown fields, accessor properties,
unsupported versions, implicit type coercion, invalid enums and nonfinite
numbers. Validation returns a new shallow object; all accepted fields are
primitives. This is deliberately a small orbital-scene contract, not a claim of
a general-purpose content authoring or physics interchange standard.

## Preferences

`validatePreferences(value)` accepts exactly:

| Field | Accepted values | Default |
|---|---|---|
| schemaVersion | integer `1` | `1` |
| locale | `en`, `hi` | `en` |
| difficulty | `beginner`, `standard`, `advanced` | `standard` |
| low | boolean | `false` |
| mastery | boolean | `false` |

`DEFAULT_PREFERENCES` is frozen. Difficulty and locale enums constrain application
state; they do not imply that all lesson content is translated or reviewed.
Mastery represents one local challenge, not verified competency or identity.

## Scene snapshot

`createSceneSnapshot(appState)` projects only supported context fields and
validates them. `validateSceneSnapshot(value)` accepts exactly:

| Field | Accepted values / meaning |
|---|---|
| schemaVersion | `1` |
| sceneId | `gravity-orbits` |
| speed | integer 10–180 in steps of 5; percent of baseline circular speed |
| gravity | integer 20–200 in steps of 5; percent of baseline gravitational parameter |
| zoom | integer 0–2 |
| selected | `planet`, `star` |
| index | nonnegative safe integer; index into recomputed trajectory |
| playing | boolean |
| locale, difficulty, low | same enums/types as preferences |

The snapshot excludes trajectories, user questions, identity and mastery.
It is not a scientific solver state. `index` must additionally be bounded to
the actual trajectory length when applied by a consumer; validation alone
cannot know that derived length. Snapshot creation is pure and performs no
storage or network operation. Future renderers can consume this boundary
without moving solver internals into persisted preferences.

## Storage, compatibility and privacy

`loadPreferences(getStorage = () => globalThis.localStorage)` returns valid
preferences directly. `savePreferences(preferences, getStorage = default)`
returns a success boolean. The getter is injectable for deterministic tests
and catches browsers that throw when accessing `localStorage` itself.

The key is `orbit-explore:preferences:v1`. Only the five preference fields are
written; no account, token, question or trajectory is persisted. Reads are
untrusted input and always validated. A corrupt or unsupported current payload
returns defaults without overwriting it or falling back to stale legacy data.
An explicit subsequent save may replace it with v1 data.

When no current payload exists, the four legacy keys `orbit-lang`,
`orbit-level`, `orbit-low` and `orbit-mastery` migrate independently using
allowlists. Invalid values fall back to defaults. Migration leaves old and
unrelated keys untouched. Failed migration writes still return the valid
migrated preferences in memory. All blocked/unavailable storage and quota
failures degrade to in-memory operation; callers may disclose failed saves.

No migrations from a future schema are guessed. A new contract version must
add explicit migration policy, fixtures and regression tests before release.
Run `node --test tests/contracts.test.js tests/storage.test.js` from this app
to verify corruption, compatibility, boundary and privacy cases.
