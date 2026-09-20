import fs from "node:fs";
import assert from "node:assert/strict";

const source = fs.readFileSync("src/game/milestone-image-provider.ts", "utf8");

assert.match(source, /PERSISTENT_CACHE_NAME\s*=\s*"beyond90-milestone-images-v2"/, "current paid-scene cache must stay versioned as v2");
assert.match(source, /LEGACY_CACHE_NAME\s*=\s*"beyond90-milestone-images-v1"/, "v1 cache must remain readable while paid scenes can still exist there");
assert.match(source, /legacy\.match\(persistentRequestUrl\(cacheKey, true\)\)/, "restore must probe the exact legacy request key");
assert.match(source, /if \(migrated\) await writePersistentResult\(cacheKey, migrated\)/, "valid v1 paid scenes must migrate into the stronger v2 cache");
assert.match(source, /if \(cached\) return cached;/, "generation must return a restored paid scene before contacting the backend");

// Player photos can be data URLs and are sensitive identity material. They may be
// hashed to identify an already-paid scene, but must never be retained as raw Map
// keys or embedded in Cache API request URLs.
assert.match(source, /const memoryKey = compactCacheKey\(cacheKey\);/, "in-memory cache must fingerprint requests before indexing");
assert.match(source, /successfulRequestCache\.get\(memoryKey\)/, "successful image cache must use the compact fingerprint");
assert.match(source, /inFlightRequestCache\.get\(memoryKey\)/, "in-flight dedupe must use the compact fingerprint");
assert.doesNotMatch(source, /successfulRequestCache\.(?:get|set)\(cacheKey\b/, "raw request/player-photo payload must not be retained in successful cache keys");
assert.doesNotMatch(source, /inFlightRequestCache\.(?:get|set)\(cacheKey\b/, "raw request/player-photo payload must not be retained in in-flight cache keys");
assert.match(source, /compactCacheKey\(cacheKey\)/, "persistent request identity must derive from a compact fingerprint");

console.log("milestone cache migration gate: paid scenes restore safely and player photos stay out of cache keys");
