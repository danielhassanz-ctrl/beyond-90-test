import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const input = process.argv[2] || "dist/client/_shell.html";
const output = process.argv[3] || "dist/client/Beyond90.html";
const root = dirname(resolve(input));
let html = await readFile(input, "utf8");

function localAssetPath(url) {
  const clean = url.split("?")[0].split("#")[0];
  if (/^(?:https?:|data:|blob:|#)/i.test(clean)) return null;
  return resolve(root, clean.replace(/^\/(?:\.\/)+/, "").replace(/^\.\//, "").replace(/^\//, ""));
}

function attrValue(attrs, name) {
  const match = attrs.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']+)["']`, "i"));
  return match?.[1] ?? null;
}

// Inline every local stylesheet regardless of attribute order.
const linkTags = [...html.matchAll(/<link\b([^>]*)>/gi)];
let inlinedStyles = 0;
for (const match of linkTags) {
  const attrs = match[1];
  const rel = attrValue(attrs, "rel");
  const href = attrValue(attrs, "href");
  if (!href || !rel || !rel.split(/\s+/).some((v) => v.toLowerCase() === "stylesheet")) continue;
  const asset = localAssetPath(href);
  if (!asset) continue;
  const css = await readFile(asset, "utf8");
  html = html.replace(match[0], `<style data-beyond90-portable>${css}</style>`);
  inlinedStyles += 1;
}

// Inline every local external script regardless of attribute order/newlines.
// The portable Vite build has code splitting disabled, so the entry module is self-contained.
const scriptTags = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
let inlinedScripts = 0;
for (const match of scriptTags) {
  const attrs = match[1];
  const src = attrValue(attrs, "src");
  if (!src) continue;
  const asset = localAssetPath(src);
  if (!asset) continue;
  const js = await readFile(asset, "utf8");
  if (/<\/script/i.test(js)) {
    throw new Error(`Portable bundle contains a literal </script> sequence: ${src}`);
  }
  const cleanAttrs = attrs
    .replace(/\bsrc\s*=\s*["'][^"']+["']/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  html = html.replace(
    match[0],
    `<script${cleanAttrs ? ` ${cleanAttrs}` : ""} data-beyond90-portable>${js}</script>`,
  );
  inlinedScripts += 1;
}

// Modulepreload links are unnecessary once the bundle is inline and can trigger
// file-origin fetches in Safari/WebKit. Match regardless of attribute order.
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
