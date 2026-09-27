# HackerSim — Content Authoring Guide

This is the contract for everyone writing game content. The **story** is defined in
`docs/STORY_BIBLE.md` (authoritative for plot, cast, flags, ownership). The **data model** is
`src/engine/types.ts` (read it fully before writing anything). This guide explains how the engine
*behaves* so the content plays the way the bible intends.

## 1. Files & ownership

- Content lives in `src/content/<package_dir>/*.ts`. Every file must
  `export default defineContent({ ... })` (import from `@/engine/registry`). Files are discovered
  automatically — there is no index to edit.
- **Only create/edit files inside your own package directory.** Never edit engine or UI code or
  another package's files. If you believe the engine is missing something, work around it with the
  existing verbs and note it in your final report.
- Split large packages into several files (e.g. `q1_boot.ts`, `q2_money.ts`, `scenes_*.ts`); keep
  files < ~1500 lines.
- Package directories:

| Package | Dir |
|---|---|
| PKG-00 Cast, factions, world | `src/content/pkg00_world/` |
| PKG-01 Act I | `src/content/pkg01_act1/` |
| PKG-02 Act II | `src/content/pkg02_act2/` |
| PKG-03 Act III | `src/content/pkg03_act3/` |
| PKG-04 Act IV & endings | `src/content/pkg04_act4/` |
| PKG-05 Loft arc | `src/content/pkg05_loft/` |
| PKG-06 Aperture arc | `src/content/pkg06_aperture/` |
| PKG-07 Bureau & Cage arcs | `src/content/pkg07_bureau/` |
| PKG-09 Halcyon, LSU, NorthLink | `src/content/pkg09_legit/` |
| PKG-10 Neighborhood arc | `src/content/pkg10_hood/` |
| PKG-11 Family & romance sides | `src/content/pkg11_family/` |
| PKG-12 Friends & freelance sides | `src/content/pkg12_friends/` |
| PKG-13 Neighborhood/oddity sides | `src/content/pkg13_oddities/` |
| PKG-14 Dark late-game sides | `src/content/pkg14_dark/` |
| PKG-15 Life & random events | `src/content/pkg15_life/` |
| PKG-16 News, forum, world wiring | `src/content/pkg16_news/` |
| PKG-17 Terminal missions | `src/content/pkg17_missions/` |
| PKG-18 Jobs, contracts, buffs, reactivity | `src/content/pkg18_jobs/` |
| ECON Items, housing, lifestyle, courses, backgrounds, traits, contract templates | `src/content/economy/` |

`src/content/core/seed.ts` holds a two-item seed (`parents_flat`, `moms_cooking`); ECON replaces it
(delete the seed's entries by moving them into `economy/` and deleting `core/seed.ts`).

## 2. Id conventions (strict — parallel writers depend on these)

The bible's prose sometimes prefixes ids for readability. **In code, ids are:**

| Kind | Code id | Bible prose may say |
|---|---|---|
| NPC | `mom`, `jax`, `grandma_ruth` | `npc.mom` |
| Faction | `fac.loft`, `fac.aperture`, `fac.bureau`, `fac.halcyon`, `fac.hood` | same |
| Scene | `a1_boot_forum` | `scene.a1_boot_forum` |
| Quest | `main_a1_q1_boot_sequence`, `fac_loft_q1_...`, `side_...` | same |
| Trigger | `trig_act2_gate`, `life_...` | same |
| Mission | `a1_library` | `mission.a1_library` |
| News | `mill_layoffs` | `news.mill_layoffs` |
| Item | `aperture_sample` | `item.aperture_sample` |
| Story contract | `a1_crack_starter` | `contract.a1_crack_starter` |
| Program (degree) | `lsu_cs_assoc`, `lsu_cs_bs` | `prog.lsu_cs_assoc` |
| Job | `job_compcastle_bench` | same |
| Ending | exactly the bible's ids, e.g. `end_reckoning` | E1 |
| Forum thread | `forum_...` | |

**Flags** keep their namespaced dotted names exactly as in bible §12 (`a1.grandma_done`,
`npc.jax.flipped`, `fac.loft.sysop`, `w.aperture_state`, ...). **NPC fates are NOT flags**: write them
with the npc effect `{ npc: 'jax', fate: 'arrested' }` and read with `{ npc: 'jax', fate: 'arrested' }`.
Romance likewise: `{ npc: 'grace', romance: 'dating' }`. Affinity: `{ npc: 'jax', affinity: 5 }` (delta).

**World vars** (`w.*` numbers) use `{ var: 'w.exposure', add: 1 }` / read `{ var: 'w.exposure', gte: 6 }`.
String-valued world states (e.g. `w.aperture_state`) are **flags** holding strings:
`{ flag: 'w.aperture_state', set: 'thriving' }` / `{ flag: 'w.aperture_state', eq: 'thriving' }`.

When a bible-referenced id is owned by another package, **use the exact id from the bible** and trust
the owner to create it. If the bible doesn't give an id you need from another package, don't invent a
cross-package dependency — keep it inside your package.

## 3. How the engine behaves

**Time.** 1 game day = 8 real seconds at 1×. Everything story-side (quest objectives, triggers,
scheduled scenes) is checked **every game hour**. Day 0 = Sat 1 Sep 2001; `dayOf(y, m0, d)` in
`@/engine/calendar` converts dates (you may import it in content: `import { dayOf } from '@/engine/calendar'`).
Age = 18 + day/365.25.

**Scenes** (`SceneDef`) are dialogue graphs delivered through a channel:
- `dialog`: opens a modal window immediately and **auto-pauses** the game. Use for big moments only
  (in-person conversations, choice points). ~1 per main quest beat.
- `mail`: lands in the Mail inbox; the player reads it whenever. Choices render as reply buttons.
- `chat`: a BuddyPager conversation with `from` (an NPC id) — render as instant messages; keep lines short
  and chatty, era-appropriate (`brb`, `lol`, `:P`, `*hugz*`).
- `forum`: a thread on the Loft BBS (`board` required: general/warez/security/market/offtopic/jobs).
- Set `pause: true` on non-dialog scenes that are urgent.
- Delivery: `{ scene: 'id' }` or `{ scene: 'id', delayHours: 12 }`. A scene that is still unanswered is
  never duplicated. Scenes can be re-delivered after they finish (repeatable life events).
- **Node `effects` run when the node is entered — the start node's effects run on delivery.** Put
  consequences on choices or later nodes.
- `next` = a "Continue" button. A node with no `choices`, `next` or `mission` ends the scene.
- A choice with no `goto` ends the scene after applying its effects.
- `if` hides a choice; `req` shows it greyed out with `reqText` (use this to tease locked options:
  `reqText: 'Requires Intrusion 20'` — the UI also auto-describes simple reqs).
- `tag` prefixes a choice: `[Lie]`, `[Bribe $200]`, `[Leave]`.
- **Skill checks** (`check`): one skill, DC, optional situational `bonuses`, `success`/`fail` node ids,
  `successEffects`/`failEffects`. Roll = d20 + floor(skill/4) + bonuses (+ gear). Nat 20 always
  succeeds, nat 1 always fails. The UI shows `[Intrusion 14 · DC 15 · 55%]`. **Every fail node must be
  real content** — a different outcome, a cost, a complication — never "nothing happens".
  DC guide: 8 trivial · 12 easy · 15 medium · 18 hard · 22 very hard · 26 heroic. Players' mods: Act I ≈ +2..+6,
  Act II ≈ +6..+11, Act III ≈ +10..+16, Act IV ≈ +13..+20.
- **Terminal missions** from a node: `mission: { mission, success, fail, auto: { skill, dc } }` — the UI
  offers "Open Terminal" (the minigame) or "Auto-resolve" (a check). Both go to success/fail.
- Rich text: `text` may be a string (split into paragraphs on blank lines) or an array of paragraphs where
  items can be `{ if: Cond, text, else? }` — **use this a lot** to make scenes react to past choices,
  fates, faction rep, romance, background and traits. Tokens: `{name}`, `{handle}`, `{npc:jax}`,
  `{nick:jax}`, `{money}`, `{date}`, `{age}`.
- `speaker` on a node: an NPC id, `'player'`, `'narrator'`, or a free label (`'Kroll's assistant'`).
- `expiresDays` + `onExpire` for replies that go stale (the bible's "the moment passed" beats).

**Quests** (`QuestDef`): stages with objectives. Objectives are `Cond`s that **latch** once true
(checked hourly). When all non-optional objectives are done: `onComplete` effects, then `next`
(a stage id, or `[{ if, stage }, ..., { stage }]` branches), or the quest ends (`outcome`).
`timeLimitDays` + `onTimeout` for timed stages (the engine caps speed at 2× while any timed stage is
running and freezes timers while jailed; set `sys.no_raids` during timed stages as the bible says, and clear it after).
- **Every objective needs a `hint`** (validator-enforced; a stage-level `hint` also satisfies it).
- Objectives completed only by story choices: `when: { flag: 'a1.whatever' }` and set that flag in the
  scene, or `when: { never: true }` + `{ quest: id, objective: objId }` effect.
- Give objectives a `progress` bar when numeric: `progress: { of: { skill: 'intrusion' }, target: 20 }`.
- Start quests by `autoStart` (checked hourly) or `{ quest: id, start: true }`. Jump stages with
  `{ quest: id, stage: 's3' }`; end with `complete: true` / `fail: true`.
- `kind`: `main` (tracked by default), `faction`, `side`, `personal`, `tutorial`. Journal groups by kind.
- Stage `text` is the journal entry (write it in 2nd person, present tense, 1–3 sentences, with voice).

**Triggers** (`TriggerDef`): `when` → `effects`, checked **every game hour**. `once` defaults to
**true**. For repeatables set `once: false` with `cooldownDays` and/or `chance`.
`chance` is **per hourly check**: "about once every N days" ≈ `atHour: 9, chance: 1/N`.
Use `atHour` for "morning mail" beats (8–10) so events don't arrive at 3 a.m. unless intended.

**Engine-owned state you can read** (never write unless noted):
- flags `sys.raided`, `sys.jailed_once`, `sys.deep_debt`, `sys.postgame`; `sys.no_raids` (content may set/clear);
  `edu.exam_failed.<program>`, `edu.dropout.<program>`, `edu.expelled.<program>`.
- vars `act` (only the act-gate triggers write it), `sys.raids`, `sys.lastRaidDay`, `sys.daysInDebt`,
  `sys.burnouts`, `sys.hospitalized`, `sys.hacksDone`, `sys.hacksFailed`, `sys.gigsDone`,
  `aff.last.<npc>` (last contact day).
- World multipliers the sim reads (default 1.0): `w.heatGain`, `w.contractPay`, `w.itSalary`, `w.rent`,
  `w.prices`, `w.techPrices`. Change them with `{ var, add }` deltas (bible §11 single-count rule: only
  news effects own the deltas).
- Stats: `money`, `health`/`energy`/`stress`/`mood`/`heat`/`cred` (0–100). `{ stat: 'health', set: 0 }`
  sends the player to hospital at the end of the day.
- Raids: engine-driven from heat ≥ 70, or `{ raid: true }`. Jail: `{ jail: days }`.
- NPC affinity: social time on the Contacts-selected NPC ≈ +1.5/day; `NpcDef.decay` = weekly loss
  when neglected 7+ days (no social time, no scene `from` them). Inner circle decay 1, family 0.5.

**Condition/effect verbs**: exactly those in `types.ts`. There is no `hospital`, `timeSkip`, var `mult`,
faction `set`, averaged checks, or arithmetic. For "count of things" keep a var and `add` to it from
each source; for "two of four roads" use a helper trigger per road that adds to a counter var.

## 4. Writing quality bar

- **Voice first.** Every NPC has a distinct voice (see bible §4 voice samples). Era-correct slang
  (2001–2012), no modern memes. Mail has headers and signatures; chats are lowercase and quick; forum
  posts have sigs, flame wars and ASCII art; dialogs read like a good CRPG — concise narration, sharp lines.
- **Light start, dark turn.** Act I / IIa: funny, warm, nostalgic, small stakes. IIb onward: tighter,
  consequences land, humor turns gallows. Keep one comedic beat per stretch even in Act III.
- **Choices must matter.** Each choice point sets flags/rep/fates the bible lists; later text should
  *react* (conditional paragraphs, different replies, news, NPC coldness). Show faction trade-offs with
  explicit `{ faction, add }` deltas in both directions.
- **3–4 options per real choice**, at least one skill-checked, at least one locked/teaser option where
  sensible, and a "walk away" where plausible. Mix skills — not everything is Intrusion (Social, OpSec,
  Business, Programming, Networking, Hardware, Fitness, Systems, Cryptography all get checks).
- **Sizing:** a main quest = 2–5 stages and 1–4 scenes; a key dialog scene = 8–25 nodes; a side quest =
  1–3 scenes. Paragraphs ≤ ~4 sentences. The bible is the plot; you write the actual scenes, lines,
  mails, chats and journal text at full quality.
- **Hacking is fiction.** All hacking is abstract game mechanics (dice, skill checks, the fictional
  terminal). Never include real exploit techniques, real attack commands, real malware, working code, or
  instructions that would help anyone attack a real system. Use invented product/tool names, invented
  companies and invented people only. Describe hacking with texture and jargon-flavored color
  ("the login page is held together with duct tape and optimism"), not procedures.
- No real brands/people: fictionalize (the bible already does: CompCastle, NorthLink, Halcyon...).

## 5. Validate before you finish

```
npx vue-tsc --build                         # types (must pass for your files)
npx eslint src/content/<your_dir>           # lint
CONTENT_FILTER=<your_dir> npx vitest run tests/content.test.ts   # references, reachability, hints
```
Errors about ids owned by *other* packages that don't exist yet are expected while everyone works in
parallel — list them in your final report ("waiting on PKG-xx for ids: ...") but fix everything that is yours:
unknown nodes, unreachable nodes, flags you read that nobody in the bible sets, missing hints, typos.

## 6. Economy & balance reference (ECON + PKG-18)

Money is dollars, 2001 prices. Daily costs and incomes (engine pays salary per day worked):

- **Lifestyle / day**: instant ramen $3 (health −0.3, mood −0.3) · Mom's cooking $0 (only at parents') ·
  normal groceries $9 · decent $18 (health +0.1, mood +0.2) · good $35 · luxury $80.
- **Housing rent / day**: parents' flat $0 · dorm room $9 (needs enrollment) · shared room $12 ·
  studio $24 · 1-bed apartment $38 · nice loft $65 · penthouse $140. Owned house: buy $160k–$400k, no rent.
  `comfort` 0.85–1.35 (sleep regen), mods for stress relief.
- **Jobs (pay/day at level 0; +7%/level up to level ~25)**: odd jobs $25–40 (4–6h) · CompCastle bench $45 ·
  help desk $60 · junior dev $90 · developer $140 · senior dev $210 · sysadmin $120 → senior $200 ·
  network engineer $170 · security analyst $230 · security consultant $340 · lead/manager $300–450 ·
  CTO/partner $600+. Shifts 4–10h; night shifts exist (data center ops, 22:00). Requirements climb:
  skill 10 → 25 → 40 → 55 → 70 plus previous job level 3–6 and sometimes a degree/flag.
  Each job trains 2–3 skills (skillXp 2–6 per hour), stress 0.6–2.2/h, energy 3–5.5/h.
- **Hack contracts (templates)**: tier 1 pay $60–250 · 2: $300–900 · 3: $1k–3.5k · 4: $4k–12k ·
  5: $15k–45k. DC 10–14 / 14–17 / 17–20 / 20–24 / 24–28. Hours 6–16 / 12–30 / 24–50 / 40–80 / 60–120.
  Heat 2–5 / 4–8 / 7–12 / 10–16 / 14–22. Cred 0.5–1.5 / 1–2.5 / 2–4 / 3–5 / 4–7.
- **Freelance templates**: tier 1 $40–140 · 2: $150–500 · 3: $500–1.6k · 4: $1.5k–5k · 5: $5k–15k,
  DC 8–12 … 20–24, hours similar to hacks, heat 0, cred 0.
- **Hardware** (slot items, tier = generation; newest purchase auto-equips if tier ≥ current):
  CPU (start `beige_pc_p2` tier 0) → 2002 P3-class $450 → 2003 P4-class $800 → 2006 dual-core $700 →
  2009 quad-core $900 · RAM (start `ram_64mb`) 128MB $60 → 256MB $110 → 512MB $160 → 1GB $220 → 4GB $180 ·
  storage (start `hdd_4gb`) 20GB $90 → 80GB $140 → 250GB $160 → 1TB $150 · network (start `modem_33k`)
  56k $70 → ISDN $250 (+$2/day, 2002) → DSL $120 (+$1.5/day, gated `{ var: 'w.broadband', gte: 1 }`) →
  cable $150 (+$2/day, `w.broadband ≥ 2`) → fiber $200 (+$3/day, `w.broadband ≥ 3`) · monitor
  (start `crt_14in`) 17" CRT $180 → 19" CRT $260 → LCD $400. Gate later hardware with
  `available: { day: true, gte: dayOf(...) }`. Mods: CPU → `hack.speed`/`freelance.speed` mult 1.1–1.8,
  `crack.speed`; RAM → `xp.programming`, speeds 1.05–1.3; network → `hack.speed`, `trace` 1.1–1.6;
  monitor → `efficiency` 1.02–1.08, `stress.gain` 0.95.
- **Software/tools** (fictional names!): scanner, cracker, proxy chain, log cleaner, rootkit-ish
  "persistence kit", encryption suite — `hack.roll` +1..+3, `hack.heat` 0.7–0.9, `trace` 1.2–1.5,
  `heat.decay` +0.2–0.5; blackmarket ones need cred. Books: `xp.<skill>` mult 1.15–1.4, $15–80.
  Furniture/gadgets: ergonomic chair (energy.drain 0.93), coffee machine (efficiency 1.04), gym membership
  (upkeep $2/day, xp.fitness 1.3), pager/cellphone (social), car (energy.drain 0.95, upkeep).
- **Courses**: $80–1500, 30–200 study hours, give targeted skill XP (course.skillXp 16–30/h) and a
  completion flag/cert (e.g. `cert.network_plus_like`). **Programs** (PKG-18): LSU associate
  (4 semesters, tuition $1,200/sem, 10:00–14:00 classes, exam `[Programming DC 12]`), BS (8 semesters, $1,800/sem).
- **Backgrounds** (fixed ids — other packages may branch on them with `{ background: 'tinkerer' }`):
  `tinkerer` "Basement Tinkerer" (+hardware 8, +systems 4, $250) · `mathlete` "Math Olympiad"
  (+cryptography 8, +programming 5, $150) · `class_clown` "Class Clown" (+social 10, +business 2, $200) ·
  `latchkey` "Latchkey Kid" (+opsec 6, +intrusion 4, $300) · `arcade_rat` "Arcade Rat" (+networking 5,
  +intrusion 5, +fitness 2, $120). Each also sets flag `bg.<id>`.
  **Traits** (fixed ids, pick 2 at start; branch with `{ trait: 'empath' }`): `night_owl`, `caffeine_fiend`,
  `empath`, `paranoid` (heat decay +, stress gain +), `silver_tongue` (check.social +2), `bookworm`,
  `gym_rat`, `hothead`, `iron_stomach`, `glass_cannon` — each 1–3 mods. **Main/side scenes are
  encouraged to add background/trait-specific dialog options** (e.g. `if: { background: 'tinkerer' }`).
