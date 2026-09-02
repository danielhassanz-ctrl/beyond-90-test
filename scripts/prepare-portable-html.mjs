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

// Inline every local stylesheet emitted by the production build.
const styleLinks = [...html.matchAll(/<link\b[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi)];
for (const match of styleLinks) {
  const asset = localAssetPath(match[1]);
  if (!asset) continue;
  const css = await readFile(asset, "utf8");
  html = html.replace(match[0], `<style data-beyond90-portable>${css}</style>`);
}

// Inline local scripts. The portable Vite build has code splitting disabled,
// so the entry module is self-contained and safe to execute from file://.
const moduleScripts = [...html.matchAll(/<script\b([^>]*)src=["']([^"']+)["']([^>]*)><\/script>/gi)];
for (const match of moduleScripts) {
  const asset = localAssetPath(match[2]);
  if (!asset) continue;
  const js = await readFile(asset, "utf8");
  if (/<\/script/i.test(js)) {
    throw new Error(`Portable bundle contains a literal </script> sequence: ${match[2]}`);
  }
  const attrs = `${match[1]} ${match[3]}`.replace(/\s+/g, " ").trim();
  html = html.replace(match[0], `<script ${attrs} data-beyond90-portable>${js}</script>`);
}

// Modulepreload links are unnecessary once the bundle is inline and can trigger
// file-origin fetches in Safari/WebKit.
html = html.replace(/<link\b[^>]*rel=["']modulepreload["'][^>]*>/gi, "");

// A truly portable file must not retain real HTML tags that load local assets.
// Do not scan arbitrary src=/href= strings inside the inlined JS/SSR payload:
// those are application data and created a false positive for the original entry URL.
const remaining = [
  ...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi),
  ...html.matchAll(/<link\b[^>]*\bhref=["']([^"']+)["'][^>]*>/gi),
  ...html.matchAll(/<(?:img|source|video|audio)\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi),
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
if (!html.includes("data-beyond90-portable")) {
  throw new Error("Portable HTML did not inline any production assets");
}

await writeFile(output, html, "utf8");
const size = Buffer.byteLength(html);
console.log(`PORTABLE_HTML_PREPARED output=${output} bytes=${size} styles=${styleLinks.length} scripts=${moduleScripts.length}`);
