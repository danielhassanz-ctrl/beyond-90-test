# Beyond 90 — Delivery certification gate

Branch: `recovery-v4-19-delivery-gate`

This branch is not certified playable until every gate below passes against the exact delivered public URL.

## Build independence
- [x] Recovery branch isolated from `main`.
- [x] Vite configuration no longer imports `@lovable.dev/vite-tanstack-config`.
- [x] Lovable runtime error reporting removed from root application path.
- [x] Clean dependency install succeeds outside Lovable (GitHub Actions run 33373747506).
- [x] `npm run typecheck` succeeds (GitHub Actions run 33373747506).
- [x] `npm run build` succeeds (GitHub Actions run 33373747506).

## Delivered URL E2E
- [ ] Cold start returns a successful page.
- [ ] Initial UI renders on iPhone-sized viewport.
- [ ] Loading state exits.
- [ ] First interaction responds.
- [ ] New Career opens setup.
- [ ] Setup can be completed.
- [ ] Club selection can be completed.
- [ ] First playable decision resolves.
- [ ] Season progresses without a stalled state.
- [ ] Full career can reach retirement/end state.
- [ ] Reload/continue restores a saved career.
- [ ] No blank screen, infinite spinner, dead button or blocked transition observed.

## Rule
Do not describe this build as stable, playable, ready to test, complete, or delivery-certified until every applicable box above has been verified against the exact delivery URL.
