# HackerSim — Redesign v2 (after the first real playtest)

Player feedback that drives this pass:
1. Boring stretches — not enough happens between story beats.
2. Bad rolls feel like "a little bad" — they need real branching sub-stories with lasting impact.
3. University takes forever → **done**: semesters and course hours halved.
4. Terminal barely used → **every hack is a terminal op** (commands + time pressure, not hidden rolls).
5. Gigs need a **queue**; the careful/normal/fast approaches stay on gigs only.
6. More gig offers.
7. Rebalance everything for **weekly turns** (`DAYS_PER_STEP = 7`, 60 s real per week at 1×).
8. **Offline progress removed** → done.

Already implemented by the lead (read the code, don't rewrite): `src/engine/events.ts` (event
director + complications), new effects in `effects.ts` (`trait`, `obligation`, `removeObligation`,
`complication`, `event`), new conds (`obligation`, `eventFired`), obligations in expenses
(`sim/life.ts`), `EventDef`/`OpSpec`/`OpResult`/`OpReport` types, registry `C.events`, validator
support, balance constants (see `src/engine/balance.ts`: boards, queue sizes, prep hours, script
penalties, event director), job XP curve, offline removal.

## Time model reminder
Each simulated 24-hour cycle = one **week**; the calendar moves 7 days per cycle. Per-hour gains are
multiplied by 7 (see `time.ts`), energy/stress/mood are per typical day. Content `day` numbers are
calendar days. Trigger `chance` is converted per turn by `perStep`. Scene `delayHours ≥ 24` are
divided by 7. Timers/reply windows < 14 days are stretched to 14.

## A. Hacking = terminal ops (engine: `src/engine/sim/contracts.ts`, new `src/engine/sim/missiongen.ts`)

Flow: **offer → accept (hold up to `MAX_ACTIVE_HACKS`=3) → recon/prep via scheduled Hacking hours →
launch in the Terminal (any time before `deadlineDay`) → debrief.**

- **Generation.** On accept, a procedural hack gets `missionDef = generateMission(state, spec, {...})`
  from its template's `op: OpSpec` (network archetype, goal, loot, docs). Story `ContractDef`s use
  their `mission` MissionDef if set, else a generated one from a sensible default spec. Generation is
  deterministic from the game RNG, scales with tier/DC: 2–6 hosts (gateway → intermediates → target),
  port difficulties from DC, traceSeconds ≈ 150 s (tier 1) → 70 s (tier 5) before modifiers, proxies
  to bounce through, logs, encrypted target files at tier ≥ 3, decoy files, flavor docs. Every
  generated mission must be **solvable** (goal host reachable from a known host via links; goal files
  exist; payloads exist for upload goals).
- **Prep.** Scheduled `hack` hours add recon work to the first accepted hack whose `prep < prepNeeded`
  (`PREP_HOURS_BY_TIER`), with XP. Prep is optional but makes the op easier. `opMission(state, uid)`
  returns a copy of the mission with prep perks applied: ≥25% all hosts known; ≥50% port difficulties
  −1; ≥75% trace ×1.35; 100% trace ×1.6 and one target port pre-opened. `prepPerks(c)` returns
  human-readable perk lines for the UI. With no accepted hack, hack hours are practice (as before).
- **Resolution** — `completeOp(state, uid, result: OpResult): OpReport` (called by the Terminal):
  - all goals, `logsLeft` 0 → **clean**: full pay, heat ×0.6, full cred.
  - all goals, logs left → **messy**: full pay, heat ×(1 + 0.35 × logsLeft).
  - some goals, not traced → **partial**: pay × done/total × 0.6, half cred, heat as messy.
  - aborted with nothing done → **aborted**: no pay, cred −1, heat 0.3 × base × logsLeft.
  - **traced** → no pay, heat ×2.5, cred −half, and `triggerComplication(state, 'hack', tier)` —
    a consequence sub-story (police letter, ISP termination, a sysadmin who hunts you...).
  Story contracts: clean/messy = `onSuccess`, everything else = `onFail`. Sets `c.report`,
  `state.lastReport` (UI shows a debrief), history, notify.
- **Script it** — `scriptOp(state, uid): OpReport`: skip the terminal. Visible odds
  `scriptChance(state, c)` = contract success chance with `SCRIPT_ROLL_PENALTY`; success pays
  ×`SCRIPT_PAY_MULT`, heat ×`SCRIPT_HEAT_MULT`; failure = traced outcome (complication).
- Deadlines: accepted hacks not run by `deadlineDay` fail (cred loss, story `onFail`).
- `resolveContract` stays for gigs (and a `forced` boolean keeps working for old callers by mapping to
  completeOp clean/traced for hacks).

## B. Gigs = idle queue
- Accept up to `MAX_ACTIVE_GIGS` = 6 gigs; each keeps its approach (careful/normal/fast). Scheduled
  Freelance hours work the **first** gig in the queue; when it completes (roll as before) the next one
  continues. `moveContract(state, uid, -1|+1)` reorders within its kind.
- Failed gigs: `GIG_FAIL_COMPLICATION_CHANCE` to spawn a `'gig'` complication.
- Boards: `HACK_BOARD_SIZE` 5 + `GIG_BOARD_SIZE` 8 offers, topped up **every turn**; offers last
  `CONTRACT_OFFER_DAYS` (3 turns). Template pay is final (multipliers retired = 1).

## C. Events & complications (content)
- `EventDef` (see types): `category`, `when`, `weight`, `repeatable`/`cooldownDays`, `scene`,
  `effects`. The director fires ~one every 1–2 turns, avoiding recent categories. Write events as
  short, punchy scenes (3–10 nodes) with 2–4 real choices; at least a third include a skill check
  whose failure matters. Gate by era (`day`), act, job track, housing, relationships, background,
  traits, heat, money — so the pool stays relevant all game. Mail/chat for small things, dialog for
  moments.
- **Complications** = `EventDef` with `complication: { sources, minTier, maxTier }`. Sources: `hack`
  (traced ops), `gig` (failed gigs), `social`, `work`, `legal`, `health`, `any`. Content spawns them
  from fail branches with `{ complication: 'social' }` etc. A complication is a **sub-story with
  lasting impact**: usually a scene + a 2–4 stage quest (`kind: 'personal'`, title prefixed
  "Complication:") whose outcomes leave marks:
  - **scars**: permanent traits (`TraitDef` with `scar: true`, `bad` if negative) via `{ trait }` —
    e.g. "Known to Police" (heat decay −), "Burned Bridge", "Carpal Tunnel", "Paranoid Sleeper"; some
    are double-edged or even positive ("Street Smart").
  - **obligations**: `{ obligation: { id, label, perDay, days? } }` — fines, lawsuits, loan
    repayments, medical bills; can be settled early via choices (`removeObligation`).
  - NPC grudges (affinity, fate), faction damage, lost job (`{ job: null }`), confiscations, raids,
    buffs/debuffs lasting weeks, flags later content reads.
  Severity scales with tier. Always offer ways to mitigate (pay, talk, lie, lawyer up, lay low)
  — some checked, and mitigation failure can escalate.

## D. Fail-branch pass (existing content)
For the existing ~300 checks: failure must be a *different story*, not a slap on the wrist. Upgrade
important checks (main quest, faction arcs, big side-quest moments): the fail node leads to its own
branch (new nodes and, where it fits, a new sub-quest or a `{ complication }`) with lasting impact
(scar/obligation/grudge/fate/flag read later). Minor checks: at least a meaningful cost plus, where
plausible, a chance of a complication (`{ chance: 0.3, then: [{ complication: 'social' }] }`).
Never break gates: keep every flag the bible's gates/endings read (§12); a failure path must still
set the progression flags the success path sets (possibly with a worse variant flag alongside).

## E. Balance targets (weekly turns)
- Real time ≈ 8–10 h at 1× for a full run; something (event, mail, story) at least every ~2 turns.
- Legit end money ≈ $300k–700k; hacker ≈ $0.8–2M with real risk (traced ops, raids ≥ 1–3 per
  reckless run). Gigs: 2–4 finish per turn with a full queue; a hack op every 1–3 turns.
- Job levels: first promotions after ~1–2 months, cap after ~6 months.
- University associate ≈ 1 year, BS ≈ 2 years (semesters halved).
