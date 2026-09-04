// Deterministic Math.random for CI-only QA runs.
// Product/runtime randomness is untouched because this file is only imported by GitHub Actions.
let state = 0x9e3779b9;
Math.random = () => {
  state ^= state << 13;
  state ^= state >>> 17;
  state ^= state << 5;
  return ((state >>> 0) + 0.5) / 4294967296;
};
