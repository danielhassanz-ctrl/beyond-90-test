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
- No repeated routine minor-injury diagnosis (for example two independent `Sobrecarga muscular` decisions) in the first 15; a recurrence must be an explicitly authored escalation such as a named relapse with new consequences.
- No red-card incident while the current state says the player is unavailable through injury.
- No more than two consecutive decisions from the same narrative family.
- Passive matches without an interactive key moment do not count as meaningful decisions.
- Adviser/family identities persist; coach/captain/physio/current-teammate identities remain stable while clubId is unchanged.
- At least five distinct decision families appear among the first 15 decisions.
- At least one personal/family/life decision and one football-development decision appear after the opening.
- No elite money, sponsorship, Europe or senior-national-team scene without prerequisites.

## Transfer/cast continuity checks

For sampled careers containing at least one real club transfer:

- adviser and established personal/social identities persist unless an authored breakup/change occurs;
- coach, captain, physio and current teammate rotate when the player changes clubs;
- new club-scoped identities remain stable on repeated lookups inside the new club;
- unresolved coach/teammate conflicts from the former club do not continue as if they belonged to the new dressing room;
- any former-coach/former-teammate callback is explicitly framed as former-club history;
- legacy saves without a cast scope marker preserve their current names on load and rotate only after the next real transfer.

## Full-season boredom checks

Fail if any of these are observed:

- same title reused as an independent scene;
- same conflict setup reused with cosmetic wording changes;
- same three choices reused for the same narrative purpose;
- more than one generic background-match incident card of the same family in a season;
- a routine minor injury immediately recurs after recovery instead of allowing a recovery/cooldown window;
- a callback that only repeats the original event instead of changing the situation;
- a simulated background run produces a decision card even though nothing career-changing happened;
- an injured player receives an on-field incident that requires him to have played during the injury window.

## Full-career sampling

Across multiple seeds to retirement, log and reject:

- adviser/family/long-term social identity drift without authored cause;
- club-scoped cast drift without a transfer;
- club-scoped people incorrectly following the player after a transfer;
- silent recasting of legacy saves merely on load;
- promises never referenced again despite relevant future situations;
- impossible competition chronology;
- repeated adviser/family crises;
- identical transfer conversations across clubs;
- repeated generic match summaries counted as meaningful decisions;
- lifestyle/status scenes that exceed the player's actual salary/fame/career level.

## Release rule

Passing typecheck/build/WebKit does not mean the narrative build is acceptable. The narrative build is testable only when this gate and the automated anti-repetition suite are both green.