import { readFileSync } from "node:fs";
import { globSync } from "node:fs";

const files = globSync("src/game/**/*.{ts,tsx}");
const offenders: string[] = [];

// A literal backslash-n followed by source code is almost always an editing
// artifact. Keep the detector broad enough to catch declarations, branches,
// assignments and closing braces so malformed generated patches cannot hide
// behind a narrow token allow-list.
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

console.log(`source artifact smoke: ${files.length} game files clean`);
