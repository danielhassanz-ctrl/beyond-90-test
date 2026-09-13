# Beyond 90 — Delivery certification gate

Public delivery target: `https://danielhassanz-ctrl.github.io/beyond-90-test/`

The production source is `main`. Historical recovery/product branches are not allowed to publish over the public URL.

## Required pre-deploy gates
A production Pages build is allowed to proceed only after the workflow in `.github/workflows/pages.yml` passes the current source through:

- clean lockfile install
- TypeScript typecheck
- mandatory life-first opening QA
- career pacing QA
- competition pacing QA
- persistent-cast QA
- deterministic full-career QA
- branch/narrative QA
- narrative anti-repetition QA
- human-style first-15-decision QA
- first-15 quality floor
- alternative first-15 branch playtest
- extended gameplay QA
- production static build

## Required public HTTPS evidence
The Pages workflow must deploy the exact `main` commit and then verify the live HTTPS URL, not a local preview.

The post-deploy job must fail unless all of the following are true:

- the Pages URL is HTTPS;
- `__build_sha.txt` served by the public site equals the exact GitHub commit being deployed;
- the root document is reachable;
- direct SPA routes for `cantera`, `carrera`, `historia`, `legado`, `onboarding`, `patrimonio` and `relaciones` are reachable;
- the real `Nueva carrera` flow passes in Playwright WebKit using an iPhone device profile;
- the mandatory player photo can be processed and persisted;
- the life-first opening, adviser choice, academy offers and club agreement can be completed;
- the resulting save survives reload;
- save recovery passes when the primary save is missing or corrupt;
- fallback persistence passes when the primary write path fails;
- the legacy/post-career route can rehydrate from persisted state without a WebKit navigation race.

## Sharing/mobile regression
The main branch also carries a dedicated WebKit regression for the iPhone share path. A failed native PNG share must recover inside the preview dialog, retain the generated card and share copy, provide a working copy-text fallback and close cleanly without requiring a second native share call.

## Certification rule
Do not describe a commit as delivered merely because the build job succeeded. The release evidence is the successful `Beyond 90 public delivery` workflow for that exact `main` SHA, including its `Verify deployed HTTPS on iPhone WebKit` job.

If the live verification job is red, cancelled, or serving a different SHA, the public build is not certified regardless of local or pre-deploy results.
