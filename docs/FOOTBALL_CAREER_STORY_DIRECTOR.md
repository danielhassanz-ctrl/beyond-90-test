# Football Career Story Director

Status: **product-critical internal skill/specification** for Beyond 90.

This document is the source of truth for narrative generation. It is not a library of random football cards. It models how a football career becomes a life story.

## 1. Core promise

Every career must feel chronological, personal, causal and plausibly different. The player should feel that people know them, decisions leave scars, football status is earned, and ordinary life exists before fame.

A green technical test is not sufficient. A build is not narratively acceptable until a scripted human-style playtest of the first season and sampled later seasons is coherent, non-repetitive and emotionally varied.

## 2. Real-career patterns to abstract

These are **patterns**, not biographies to copy.

- **Family separation / academy adaptation** — e.g. Andrés Iniesta: moving young, family agreement, homesickness/adaptation, youth progression before first-team debut. Pattern: family decision -> relocation/adaptation -> academy relationships -> gradual promotion.
- **Patient academy / loans / delayed consolidation** — e.g. Harry Kane and many academy players: youth development, loans, uncertain hierarchy, repeated proof, eventual role. Pattern: prospect -> loan choice -> minutes vs prestige -> return -> competition -> breakthrough or stall.
- **Rejected / late bloomer / lower-level climb** — e.g. Jamie Vardy: rejection, non-league, rediscovery, climbing levels late. Pattern: setback -> identity choice -> lower-level opportunity -> performance -> unexpected re-entry into elite pathway.
- **International relocation / support network / exceptional talent** — e.g. Lionel Messi-type pathway: move country young, family/support infrastructure, academy adaptation, exceptional progression without skipping human cost. Pattern: relocation -> dependency on family/club support -> adaptation -> earned acceleration.
- **Injury-altered career** — elite and non-elite examples. Pattern: injury -> diagnosis -> rehab relationship with physio -> replacement takes role -> comeback choice -> possible altered ceiling or reinvention.
- **Solid professional, not superstar** — long careers in first/second divisions. Pattern: role stability, renewals, family, money, captaincy, transfers, decline, no forced Ballon d'Or arc.

References used when defining these patterns should favour first-party club, league or federation sources.

## 3. Career state model

Narrative eligibility must be driven by:

`age + era + football status + club level + stage + minutes/role + overall + potential + form + fame + money + injuries + trophies + national team + relationships + persistent cast + previous decisions + unresolved threads + seen scenes + season chronology`

### Era

- 16–18: **PROMESA** — home life, family, school/routine, first adviser, first club, adaptation, coach, captain, teammate, physio, first minutes, possible loan discussion.
- 19–21: **IRRUPCIÓN** — fight for role, loan/transfer, first foreign move, first real money, press, youth/senior national-team edge, early relationships.
- 22–25: **CONSOLIDACIÓN** — serious contracts, Europe only if earned, stable partner, sponsor, property, rivalries, transfer leverage.
- 26–30: **PRIME** — branch strongly by status. A 72-rated starter must not live the same life as a 92-rated legend.
- 31–34: **VETERANO** — body management, captaincy, youngsters, decline, salary trade-offs, last major national-team cycle.
- 35+: **LEGADO** — final contracts, return home, retirement, family/assets, post-football direction.

### Football status

`prospect -> squad -> starter -> star -> elite -> legend`

Age gates prevent teenagers from leaking into elite/legend narrative families.

## 4. Mandatory opening spine

For a brand-new 16-year-old career, **no match is eligible** until this sequence is completed:

1. Ordinary home/life scene.
2. Family advice and expectations.
3. Adviser approach.
4. Choice: professional agent / father / trusted person.
5. Evaluate 3–4 real initial clubs with adviser/family context.
6. Adviser/father/trusted person explains and negotiates first development agreement.
7. Signing day.
8. Named coach welcome and role expectations.
9. Preseason/training adaptation.
10. Named captain welcome and dressing-room hierarchy.
11. Named teammate relationship.
12. Named physio/medical baseline.
13. Only now can friendly/youth/debut football appear.

Express, Standard and Pro all preserve this spine.

## 5. Persistent cast

Every career owns a coherent named cast, but persistence follows real-world scope. Generic anonymous substitutes are forbidden once a role has been named **inside the scope where that person belongs**.

### Career-scoped people

These identities follow the player across clubs unless the narrative explicitly ends the relationship:

- adviser: agent / father / trusted person
- family
- established partner / long-term social contact when plausible

### Club-scoped people

These identities belong to the current club and remain stable while the player stays there:

- coach
- captain
- physio
- current teammate(s)

A real transfer must create a new club-scoped cast. The old coach, captain, physio and teammate must not silently follow the player to the new club. Club-specific unresolved threads are closed or transformed on transfer; personal/adviser/family threads may continue.

Legacy saves must not recast people merely because they are loaded. They adopt their current club as the existing cast scope and rotate club-scoped identities only on the next real transfer.

Callbacks must reuse the correct identities and remember the prior choice. Example: if the player told the adviser at 16 to prioritise minutes, a transfer conversation at 19 should be able to quote or paraphrase that priority. If the player moves clubs, a later callback from the former coach must be explicitly framed as a former-coach contact, never as if that coach still runs the new dressing room.

## 6. Narrative arc rules

An arc is not one card. It has setup, pressure, choice, consequence and possible delayed callback.

Example: competition for a place

1. coach explains hierarchy
2. rival/teammate appears
3. training or selection consequence
4. captain/agent reaction
5. role changes or loan becomes plausible
6. months later callback based on what player did

Quiet beats are necessary. Constant crisis is boring.

## 7. Hard anti-repetition rules

A resolved setup cannot reappear as the same situation with the same dramatic purpose.

Forbidden:

- same title repeated in a career unless it is a clearly labelled evolving series with new context
- near-identical body text
- same three choices repeated for the same conflict
- repeated generic adviser calls
- repeated `match_flash` cards for the same incident family within a short span
- repeated red-card cards without distinct causal context
- showing an on-field disciplinary incident while the player is already unavailable through injury
- callbacks that merely restate the original scene

A callback is allowed only if it **advances** the story: new actor response, changed role, delayed consequence, relationship shift, contract effect, family effect, etc.

## 8. Match and simulation policy

Key matches are selective. Simulated blocks are background, not filler decisions.

A background simulation should normally produce **no card**. It may surface a card only if a truly unique, context-changing event occurred and it has not already been surfaced recently.

`match_flash` is not allowed as a reusable generic decision source. If the engine detects repeated flash families/titles/options, it should suppress them and advance time.

If `injury != null`, the player cannot simultaneously receive a simulated red-card/played-match incident unless the chronology explicitly places that incident before the injury and the UI communicates that order.

## 9. Decision density

Meaningful decisions per season:

- EXPRESS: 10–15
- STANDARD: 20–25
- PRO: 30–40

Passive summaries do not count. Repetitive filler does not count. Generic `continue` cards do not count.

If the scheduler lacks enough authored/contextual decisions, it must prefer fewer decisions over duplicate filler. Quotas never justify repetition.

## 10. Career variability

The engine must support, without forcing:

- prodigy to superstar
- excellent but never global superstar
- solid first-division professional
- second-division / journeyman career
- late bloomer
- rejected-and-rebuilt path
- repeated loans
- injury-changed trajectory
- one-club career
- money-first career
- return-to-origin arc
- early peak and decline
- career derailed before elite level

## 11. Competition chronology

Domestic, European and national-team scenes require actual eligibility.

- Europe only from club qualification/context.
- Senior national team only from nationality + merit + age/status.
- Continental tournament from correct confederation.
- World Cup/continental cycles must respect calendar years.
- Major tournament cards are emotionally weighted and history-aware, not generic match cards.

## 12. Human-style pre-release playtest gate

Before asking the user to test a narrative build, run scripted careers as if playing, not merely unit tests.

### Opening test

For at least 12 deterministic seeds across all three pacing modes:

- record the first 15 playable decisions in order
- verify zero match before opening spine completion
- verify adviser/family identities persist and club-scoped names stay stable while the club is unchanged
- verify no duplicate title/text/choice set
- verify at least 5 distinct decision families among first 15 decisions
- verify no impossible status/money/competition scene

### First-season boredom test

For the same careers:

- no narrative title appears more than once
- no generic flash family appears more than once unless a distinctly authored escalation exists
- no three-card repetition loop
- no more than two consecutive decisions from the same narrative family
- no contradiction between injury availability and match incidents
- at least one personal-life/family/relationship decision and one football-development decision after the opening

### Full-career sampling

Sample multiple careers to retirement and flag:

- adviser/family/long-term social identity drift without an authored breakup/change
- coach/captain/physio/current-teammate drift without a transfer
- club-scoped people incorrectly following the player after a transfer
- legacy saves silently changing cast on load
- duplicate/near-duplicate text
- repeated choice triples
- repeated unresolved setup
- age/status leakage
- unearned Europe/national-team scenes
- money/lifestyle mismatch
- forgotten promises
- callbacks without new consequence

A build that fails the boredom test is not sent to the user even if typecheck/build/WebKit are green.

## 13. Release principle

Beyond 90 is an interactive autobiography, not a football event deck.

When in doubt, ask: **Would this scene make sense in a real player's biography at this exact age, status and point in time — and is it different enough from everything the player has just seen to be worth a decision?**

If not, suppress it.