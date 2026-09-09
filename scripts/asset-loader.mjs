const ASSET_RE = /\.(?:avif|gif|jpe?g|png|svg|webp)(?:\?.*)?$/i;

export async function load(url, context, nextLoad) {
  if (ASSET_RE.test(url)) {
    return {
      format: "module",
      shortCircuit: true,
      source: `export default ${JSON.stringify(url)};`,
    };
  }
  return nextLoad(url, context);
}
