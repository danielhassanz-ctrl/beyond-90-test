import fs from "node:fs";
import assert from "node:assert/strict";

const source = fs.readFileSync("src/game/milestone-image-provider.ts", "utf8");

assert.match(source, /PERSISTENT_CACHE_NAME\s*=\s*"beyond90-milestone-images-v2"/, "current paid-scene cache must stay versioned as v2");
assert.match(source, /LEGACY_CACHE_NAME\s*=\s*"beyond90-milestone-images-v1"/, "v1 cache must remain readable while paid scenes can still exist there");
assert.match(source, /legacy\.match\(persistentRequestUrl\(cacheKey, true\)\)/, "restore must probe the exact legacy request key");
assert.match(source, /if \(migrated\) await writePersistentResult\(cacheKey, migrated\)/, "valid v1 paid scenes must migrate into the stronger v2 cache");
assert.match(source, /if \(cached\) return cached;/, "generation must return a restored paid scene before contacting the backend");

console.log("milestone cache migration gate: paid v1 scenes restore into v2 before generation");
