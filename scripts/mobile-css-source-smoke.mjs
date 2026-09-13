import fs from "node:fs";

const css = fs.readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
const bodyMatch = css.match(/body\s*\{([\s\S]*?)\n\s*\}/);

if (!bodyMatch) {
  throw new Error("Mobile CSS QA: body block not found");
}

const body = bodyMatch[1];

if (body.includes("\\n")) {
  throw new Error("Mobile CSS QA: literal \\n escape found in body declarations");
}

for (const declaration of [
  "min-height: 100%;",
  "min-height: 100dvh;",
  "overscroll-behavior-y: none;",
  "-webkit-text-size-adjust: 100%;",
]) {
  if (!body.includes(declaration)) {
    throw new Error(`Mobile CSS QA: missing required declaration: ${declaration}`);
  }
}

console.log("Mobile CSS source QA passed");
