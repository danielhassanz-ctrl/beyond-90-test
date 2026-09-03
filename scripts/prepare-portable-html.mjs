import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve, basename } from "node:path";

const input = process.argv[2] || "dist/client/_shell.html";
const output = process.argv[3] || "dist/client/Beyond90.html";
const root = dirname(resolve(input));
let html = await readFile(input, "utf8");
const portableAssets = new Map();
const noopModule = "data:text/javascript,export%20default%20%7B%7D%3B";

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

  // The real production entry is physically inlined below. We temporarily map stale
  // prerender references to a unique no-op URL so they can be located and removed from
  // TanStack's hydration manifest after all normal asset rewriting has finished.
  rememberAsset(src, noopModule);

  const openEnd = match.index + match[0].length;
  const closeMatch = /<\/script\s*>/i.exec(html.slice(openEnd));
  if (!closeMatch) throw new Error(`External script tag has no closing </script>: ${src}`);
  const elementEnd = openEnd + closeMatch.index + closeMatch[0].length;

  const cleanAttrs = attrs
    .replace(/\bsrc\s*=\s*["'][^"']+["']/gi, "")
    .replace(/\sasync(?:\s*=\s*(?:["'][^"']*["']|[^\s>]+))?/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  scriptReplacements.push({ start: match.index, end: elementEnd, value: `<script${cleanAttrs ? ` ${cleanAttrs}` : ""} data-beyond90-portable>${js}</script>` });
}
for (const replacement of scriptReplacements.reverse()) html = html.slice(0, replacement.start) + replacement.value + html.slice(replacement.end);
const inlinedScripts = scriptReplacements.length;

html = html.replace(/<link\b([^>]*)>/gi, (tag, attrs) => {
  const rel = attrValue(attrs, "rel");
  return rel?.split(/\s+/).some((v) => v.toLowerCase() === "modulepreload") ? "" : tag;
});

for (const [alias, data] of [...portableAssets.entries()].sort((a, b) => b[0].length - a[0].length)) {
  html = html.split(alias).join(data);
}

// Safari on a physical iPhone still receives TanStack's serialized prerender manifest even
// though the production entry has already been executed inline. Leaving the stale JS entry
// in `preloads`/`scripts` makes hydration attempt a second module load from a data: URL.
// WebKit has a history of origin/loading differences around module/data/blob URLs, and this
// extra load is unnecessary for a truly self-contained document. Remove it entirely.
const escapedNoopModule = noopModule.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
html = html.replace(
  new RegExp(`preloads:\\$R\\[(\\d+)\\]=\\["${escapedNoopModule}"\\]`, "g"),
  "preloads:$R[$1]=[]",
);
html = html.replace(
  new RegExp(`scripts:\\$R\\[(\\d+)\\]=\\[\\$R\\[\\d+\\]=\\{attrs:\\$R\\[\\d+\\]=\\{type:"module",async:!0,src:"${escapedNoopModule}"\\}\\}\\]`, "g"),
  "scripts:$R[$1]=[]",
);

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
if (/<script\b[^>]*data-beyond90-portable[^>]*\basync\b/i.test(html)) throw new Error("Portable production script still has async execution enabled");
if (html.includes(noopModule)) throw new Error("Portable HTML still contains a stale hydration module URL");

// Physical Safari is the release gate. Automated WebKit can still miss device-only startup
// failures, so the portable build must never leave a tester staring at an unexplained black
// screen. This tiny watchdog stays invisible when the app renders normally; on an uncaught
// startup error or a persistently blank body it replaces the black screen with the concrete
// error text that can be reported back and fixed.
const safariDiagnostic = `<script data-beyond90-safari-diagnostic>(function(){var shown=false,lastError="";function text(v){try{return String(v&&v.stack||v&&v.message||v||"Unknown startup error")}catch(_){return"Unknown startup error"}}function show(reason){if(shown)return;shown=true;var d=document.createElement("div");d.setAttribute("data-beyond90-startup-error","");d.style.cssText="position:fixed;inset:0;z-index:2147483647;background:#090909;color:#f5f5f5;padding:24px;font:15px/1.45 -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;overflow:auto;white-space:pre-wrap";d.textContent="Beyond 90 no ha podido arrancar en Safari.\\n\\n"+reason+"\\n\\nHaz una captura de esta pantalla.";(document.body||document.documentElement).appendChild(d)}window.addEventListener("error",function(e){lastError=text(e.error||e.message)});window.addEventListener("unhandledrejection",function(e){lastError=text(e.reason)});setTimeout(function(){var b=document.body;var visible=b&&((b.innerText||"").trim().length>20||b.querySelector("button,a,input,[role=button],img,svg"));if(!visible)show(lastError||"El documento sigue vacío 6 segundos después de iniciar. Posible fallo de hidratación o ejecución de JavaScript.")},6000)})();</script>`;
const firstPortableScript = html.indexOf("<script", html.indexOf("data-beyond90-portable") > -1 ? 0 : 0);
if (firstPortableScript > -1) html = html.slice(0, firstPortableScript) + safariDiagnostic + html.slice(firstPortableScript);
else html = html.replace(/<\/head>/i, `${safariDiagnostic}</head>`);
if (!html.includes("data-beyond90-safari-diagnostic")) throw new Error("Portable HTML did not install the Safari startup diagnostic");

await writeFile(output, html, "utf8");
const size = Buffer.byteLength(html);
console.log(`PORTABLE_HTML_PREPARED output=${output} bytes=${size} styles=${inlinedStyles} scripts=${inlinedScripts} aliases=${portableAssets.size}`);
