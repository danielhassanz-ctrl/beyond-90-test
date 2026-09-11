# Real Career Playtest Gate

This checklist is mandatory before asking the user to test a narrative build.

## First 15 decisions

For 12 deterministic new-career seeds split across Express / Standard / Pro, record the first 15 playable decisions and fail the run if any condition below is violated.

- No match before mandatory opening is complete.
- No repeated title.
- No near-duplicate setup text.
- No repeated identical choice triple.
- No repeated generic adviser check/call.
- No repeated `match_flash` family within the first 15 decisions.
- No red-card incident while the current state says the player is unavailable through injury.
- No more than two consecutive decisions from the same narrative family.
- Persistent adviser, coach, captain and physio names remain unchanged.
- At least five distinct decision families appear among the first 15 decisions.
- At least one personal/family/life decision and one football-development decision appear after the opening.
- No elite money, sponsorship, Europe or senior-national-team scene without prerequisites.

## Full-season boredom checks

Fail if any of these are observed:

- same title reused as an independent scene;
- same conflict setup reused with cosmetic wording changes;
- same three choices reused for the same narrative purpose;
- more than one generic background-match incident card of the same family in a season;
- a callback that only repeats the original event instead of changing the situation;
- a simulated background run produces a decision card even though nothing career-changing happened;
- an injured player receives an on-field incident that requires him to have played during the injury window.

## Full-career sampling

Across multiple seeds to retirement, log and reject:

- cast name drift;
- promises never referenced again despite relevant future situations;
- impossible competition chronology;
- repeated adviser/family crises;
- identical transfer conversations across clubs;
- repeated generic match summaries counted as meaningful decisions;
- lifestyle/status scenes that exceed the player's actual salary/fame/career level.

## Release rule

Passing typecheck/build/WebKit does not mean the narrative build is acceptable. The narrative build is testable only when this gate and the automated anti-repetition suite are both green.