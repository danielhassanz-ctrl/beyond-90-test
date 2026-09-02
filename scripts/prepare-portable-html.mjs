import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const input = process.argv[2] || "dist/client/_shell.html";
const output = process.argv[3] || "dist/client/Beyond90.html";
const root = dirname(resolve(input));
let html = await readFile(input, "utf8");

function localAssetPath(url) {
  const clean = url.split("?")[0].split("#")[0];
  if (/^(?:https?:|data:|blob:|#)/i.test(clean)) return null;
  const normalized = clean
    .replace(/^\/+/, "")
    .replace(/^(?:\.\/)+/, "");
  return resolve(root, normalized);
}

function attrValue(attrs, name) {
  const match = attrs.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']+)["']`, "i"));
  return match?.[1] ?? null;
}

// Inline local stylesheets. Process from the end so replacements cannot invalidate offsets.
const styleReplacements = [];
for (const match of html.matchAll(/<link\b([^>]*)>/gi)) {
  const attrs = match[1];
  const rel = attrValue(attrs, "rel");
  const href = attrValue(attrs, "href");
  if (!href || !rel || !rel.split(/\s+/).some((v) => v.toLowerCase() === "stylesheet")) continue;
  const asset = localAssetPath(href);
  if (!asset) continue;
  const css = await readFile(asset, "utf8");
  styleReplacements.push({ start: match.index, end: match.index + match[0].length, value: `<style data-beyond90-portable>${css}</style>` });
}
for (const replacement of styleReplacements.reverse()) {
  html = html.slice(0, replacement.start) + replacement.value + html.slice(replacement.end);
}
const inlinedStyles = styleReplacements.length;

// Inline every local external script by locating its opening tag first. This deliberately
// does not depend on a single regex matching the whole script element, which proved brittle
// with TanStack/Vite's generated shell markup.
const scriptReplacements = [];
for (const match of html.matchAll(/<script\b([^>]*)>/gi)) {
  const attrs = match[1];
  const src = attrValue(attrs, "src");
  if (!src) continue;
  const asset = localAssetPath(src);
  if (!asset) continue;

  const js = await readFile(asset, "utf8");
  if (/<\/script/i.test(js)) {
    throw new Error(`Portable bundle contains a literal </script> sequence: ${src}`);
  }

  const openEnd = match.index + match[0].length;
  const closeMatch = /<\/script\s*>/i.exec(html.slice(openEnd));
  if (!closeMatch) {
    throw new Error(`External script tag has no closing </script>: ${src}`);
  }
  const elementEnd = openEnd + closeMatch.index + closeMatch[0].length;
  const cleanAttrs = attrs
    .replace(/\bsrc\s*=\s*["'][^"']+["']/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  scriptReplacements.push({
    start: match.index,
    end: elementEnd,
    value: `<script${cleanAttrs ? ` ${cleanAttrs}` : ""} data-beyond90-portable>${js}</script>`,
  });
}
for (const replacement of scriptReplacements.reverse()) {
  html = html.slice(0, replacement.start) + replacement.value + html.slice(replacement.end);
}
const inlinedScripts = scriptReplacements.length;

// Modulepreload links are unnecessary once the bundle is inline and can trigger
// file-origin fetches in Safari/WebKit.
html = html.replace(/<link\b([^>]*)>/gi, (tag, attrs) => {
  const rel = attrValue(attrs, "rel");
  return rel?.split(/\s+/).some((v) => v.toLowerCase() === "modulepreload") ? "" : tag;
});

// A truly portable file must not retain real HTML tags that load local assets.
const remaining = [
  ...html.matchAll(/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi),
  ...html.matchAll(/<link\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>/gi),
  ...html.matchAll(/<(?:img|source|video|audio)\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi),
]
  .map((m) => m[1])
  .filter((url) => {
    if (/^(?:https?:|data:|blob:|mailto:|tel:|#)/i.test(url)) return false;
    if (/^javascript:/i.test(url)) return false;
    return /(?:^|\/)assets\//.test(url) || /\.(?:js|css|jpe?g|png|webp|svg)(?:[?#]|$)/i.test(url);
  });

if (remaining.length) {
  throw new Error(`Portable HTML still has local asset dependencies: ${[...new Set(remaining)].join(", ")}`);
}
if (!inlinedScripts) {
  throw new Error("Portable HTML did not inline the production script bundle");
}
if (!html.includes("data-beyond90-portable")) {
  throw new Error("Portable HTML did not inline any production assets");
}

await writeFile(output, html, "utf8");
const size = Buffer.byteLength(html);
console.log(`PORTABLE_HTML_PREPARED output=${output} bytes=${size} styles=${inlinedStyles} scripts=${inlinedScripts}`);
