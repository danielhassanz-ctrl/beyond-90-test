import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve, basename } from "node:path";

const input = process.argv[2] || "dist/client/_shell.html";
const output = process.argv[3] || "dist/client/Beyond90.html";
const root = dirname(resolve(input));
let html = await readFile(input, "utf8");
const portableAssets = new Map();

function localAssetPath(url) {
  const clean = url.split("?")[0].split("#")[0];
  if (/^(?:https?:|data:|blob:|#)/i.test(clean)) return null;
  const normalized = clean.replace(/^\/+/, "").replace(/^(?:\.\/)+/, "");
  return resolve(root, normalized);
}

function attrValue(attrs, name) {
  const match = attrs.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']+)["']`, "i"));
  return match?.[1] ?? null;
}

function rememberAsset(url, replacement) {
  const clean = url.split("?")[0].split("#")[0];
  const file = basename(clean);
  for (const alias of new Set([clean, clean.replace(/^\/+/, ""), `/${clean.replace(/^\/+/, "")}`, `./${clean.replace(/^\/+/, "")}`, file, `/${file}`, `./${file}`])) {
    if (alias) portableAssets.set(alias, replacement);
  }
}

const styleReplacements = [];
for (const match of html.matchAll(/<link\b([^>]*)>/gi)) {
  const attrs = match[1];
  const rel = attrValue(attrs, "rel");
  const href = attrValue(attrs, "href");
  if (!href || !rel || !rel.split(/\s+/).some((v) => v.toLowerCase() === "stylesheet")) continue;
  const asset = localAssetPath(href);
  if (!asset) continue;
  const css = await readFile(asset, "utf8");
  const cssData = `data:text/css;base64,${Buffer.from(css).toString("base64")}`;
  rememberAsset(href, cssData);
  styleReplacements.push({ start: match.index, end: match.index + match[0].length, value: `<style data-beyond90-portable>${css}</style>` });
}
for (const replacement of styleReplacements.reverse()) html = html.slice(0, replacement.start) + replacement.value + html.slice(replacement.end);
const inlinedStyles = styleReplacements.length;

const scriptReplacements = [];
for (const match of html.matchAll(/<script\b([^>]*)>/gi)) {
  const attrs = match[1];
  const src = attrValue(attrs, "src");
  if (!src) continue;
  const asset = localAssetPath(src);
  if (!asset) continue;
  const js = await readFile(asset, "utf8");
  if (/<\/script/i.test(js)) throw new Error(`Portable bundle contains a literal </script> sequence: ${src}`);

  // The production entry is physically inlined below. TanStack's prerender payload can
  // still contain the old entry URL and may import it during hydration. Point those stale
  // references at a no-op module instead of at a base64 copy of the full bundle: importing
  // the full bundle a second time reintroduces its original relative CSS manifest URL under
  // file:// and causes Safari/WebKit to throw before hydration finishes.
  rememberAsset(src, "data:text/javascript,export%20default%20%7B%7D%3B");

  const openEnd = match.index + match[0].length;
  const closeMatch = /<\/script\s*>/i.exec(html.slice(openEnd));
  if (!closeMatch) throw new Error(`External script tag has no closing </script>: ${src}`);
  const elementEnd = openEnd + closeMatch.index + closeMatch[0].length;
  const cleanAttrs = attrs.replace(/\bsrc\s*=\s*["'][^"']+["']/gi, "").replace(/\s+/g, " ").trim();
  scriptReplacements.push({ start: match.index, end: elementEnd, value: `<script${cleanAttrs ? ` ${cleanAttrs}` : ""} data-beyond90-portable>${js}</script>` });
}
for (const replacement of scriptReplacements.reverse()) html = html.slice(0, replacement.start) + replacement.value + html.slice(replacement.end);
const inlinedScripts = scriptReplacements.length;

html = html.replace(/<link\b([^>]*)>/gi, (tag, attrs) => {
  const rel = attrValue(attrs, "rel");
  return rel?.split(/\s+/).some((v) => v.toLowerCase() === "modulepreload") ? "" : tag;
});

// Rewrite stale TanStack/Vite hydration asset URLs after the real production assets are
// already inline. CSS becomes an absolute data URL; JS entry references become a no-op
// module because the real entry has already executed inline.
for (const [alias, data] of [...portableAssets.entries()].sort((a, b) => b[0].length - a[0].length)) {
  html = html.split(alias).join(data);
}

const remaining = [
  ...html.matchAll(/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi),
  ...html.matchAll(/<link\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>/gi),
  ...html.matchAll(/<(?:img|source|video|audio)\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi),
].map((m) => m[1]).filter((url) => {
  if (/^(?:https?:|data:|blob:|mailto:|tel:|#)/i.test(url)) return false;
  if (/^javascript:/i.test(url)) return false;
  return /(?:^|\/)assets\//.test(url) || /\.(?:js|css|jpe?g|png|webp|svg)(?:[?#]|$)/i.test(url);
});

if (remaining.length) throw new Error(`Portable HTML still has local asset dependencies: ${[...new Set(remaining)].join(", ")}`);
if (!inlinedScripts) throw new Error("Portable HTML did not inline the production script bundle");
if (!html.includes("data-beyond90-portable")) throw new Error("Portable HTML did not inline any production assets");

await writeFile(output, html, "utf8");
const size = Buffer.byteLength(html);
console.log(`PORTABLE_HTML_PREPARED output=${output} bytes=${size} styles=${inlinedStyles} scripts=${inlinedScripts} aliases=${portableAssets.size}`);
