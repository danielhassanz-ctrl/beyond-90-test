import { readFileSync } from "node:fs";
import { globSync } from "node:fs";

const files = globSync("src/**/*.{ts,tsx}");
const offenders: string[] = [];

// A literal backslash-n followed by source code is almost always an editing
// artifact. Scan the whole application source, not only the game engine:
// malformed patches in onboarding, save recovery or share-card UI are just as
// capable of breaking the V1 player flow.
const escapedSourceNewline = /\\n[ \t]*(?:(?:\/\/)|(?:const|let|var|if|else|return|throw|export|function|switch|case|for|while|try|catch|finally|break|continue)\b|[}\]])/;

for (const file of files) {
  const source = readFileSync(file, "utf8");
  if (escapedSourceNewline.test(source)) {
    offenders.push(file);
  }
}

if (offenders.length) {
  throw new Error(`Escaped newline source artifact found in: ${offenders.join(", ")}`);
}

console.log(`source artifact smoke: ${files.length} application files clean`);
