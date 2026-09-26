import { readFileSync } from "node:fs";
import { globSync } from "node:fs";

const files = globSync("src/game/**/*.{ts,tsx}");
const offenders: string[] = [];

for (const file of files) {
  const source = readFileSync(file, "utf8");
  if (/\\n\s{2,}(?:\/\/|let |const |if |return |export |function )/.test(source)) {
    offenders.push(file);
  }
}

if (offenders.length) {
  throw new Error(`Escaped newline source artifact found in: ${offenders.join(", ")}`);
}

console.log(`source artifact smoke: ${files.length} game files clean`);
