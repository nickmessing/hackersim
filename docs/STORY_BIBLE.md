# HACKERSIM — STORY BIBLE

*The single source of truth for narrative content. Backbone: Proposal A ("The People You Break"). Grafts and fixes from Proposals B and C incorporated per the judging panel. **Revision 2** resolves the full reviewer pass (see §14).*

> **Design contract.** This is a *fiction / game-design* document. All "hacking" is abstracted game mechanics — dice rolls, skill checks, resource management — in the tradition of Uplink and Watch_Dogs, never real technique. Everything below is authored to drop into the engine already implemented in `src/engine/`:
> - **Skills** (fixed ids): `programming networking intrusion cryptography hardware systems social opsec business fitness`.
> - **Stats**: `money health energy stress mood heat cred` (heat 0–100; cred = underground reputation 0–100).
> - **Skill checks** roll `d20 + floor(skill/4) + situational` vs a **DC**. Written as `[Intrusion DC 15]`. **Every failure branches into authored content — never a dead end** (enforced by the §6/§8 CI lint rule: any `check` without `failEffects`/`fail` goto is rejected).
> - **Conditions** (`Cond`) and **effects** (`Effect`) use the compact object forms in `src/engine/types.ts`. **Only these effect verbs exist** (§0 canonical list): `money stat xp flag clearFlag var faction npc quest scene news item job jobXp housing lifestyle contract buff removeBuff jail raid enroll dropout degree course forum ending notify log chance if random pause`. **There is no `hospital`, no `timeSkip`, no `var … mult`, no averaged multi-skill check, and no `faction … set`.** `var` supports only `add`/`set`; `faction` supports only `add`; `SkillCheck` and `MissionLaunch.auto` take exactly **one** skill. Content that needed those either uses the rewrites in §0.1 or a documented engine extension in §0.2.
> - **World multipliers the sim actually reads** (numeric `var`s, set via `{ var: 'w.xxx', set|add }`): `w.heatGain` (heat gain multiplier), `w.contractPay` (hack contract pay), `w.itSalary` (IT wages + freelance), `w.rent`, `w.prices`, `w.techPrices`. All default 1.0. Other `w.*` vars below are numeric story state read by triggers, news `ambient` conds, and the ending assembler.
> - **Flags** are namespaced: `a1.* a2.* a3.* a4.*` (act/main-quest), `fac.*` (faction arcs and faction-org state), `npc.*` (character state), `side.*` (side quests), `life.*` (life events), `w.*` (world/legislation), `mir.*` (mirror), `end.*` (ending bookkeeping). Engine reserves `sys.*`. **No flag is read that is never set** — the §12 registry is generated from a set/read matrix over §§6–9 (§12.9).
> - **Faction rep** = signed integer −100..+100 per faction, tiers below. **NPC fates** = strings on `npc.<id>.fate`, read by the epilogue assembler; each NPC has **exactly one** fate field, finalized once in §4.6.
> - **`act` is engine-owned state** (var `act`, starts 1). **Content never writes `act` except the three gate triggers `trig_act2_gate`/`trig_act3_gate`/`trig_act4_gate`** (§5), which are the *only* authorized writers. Everything else reads it.
> - **Reserved world/system flags emitted by the engine** (read-only for content unless noted): `sys.raided`, `sys.jailed_once`, `sys.deep_debt`, `sys.no_raids` (content **may set/clear** this to suppress raids during scripted beats and timed stages), and vars `sys.raids`, `sys.lastRaidDay`, `sys.daysInDebt`, `sys.burnouts`, `sys.hospitalized`, `sys.hacksDone`, `sys.gigsDone`, `sys.hacksFailed`, plus `state.totals.earned` (read in a Cond as `{ n:{ var:'sys.totalEarned' } }`? **No** — see §0.1: use `{ stat:'money' }` for objectives). The engine emits `sys.hospitalized` as a **var** (a running count), not a flag; content that wants "you were hospitalized" reads `{ n:{ var:'sys.hospitalized' }, gte:1 }`.

---

## 0. ENGINE-ALIGNMENT NOTES (authoritative for writers)

### 0.1 Operations that do NOT exist — canonical rewrites

Writers must use the right-hand form. These are applied throughout §§4–11; listed here once as the rule.

| Non-existent form used in drafts | Canonical rewrite |
|---|---|
| `var w.itSalary mult 0.8` | `{ var:'w.itSalary', add:-0.2 }` (documented as an additive multiplier delta; see §11.1). Multiple sources stack additively. |
| `faction fac.loft set -60` | Compute a delta from current rep in the effect author's head is impossible at runtime, so use a **large fixed `add`** sized to the branch: `{ faction:'fac.loft', add:-60 }` (rep clamps at −100). The Halcyon-traitor beat uses `add:-60`. |
| `hospital` effect | `{ stat:'health', set:0 }` — the engine's `endOfDayLife` sends `health ≤ 0` to the hospital automatically (see `sim/life.ts`). Never author a bill in the same beat; §9 `life_hospital_bill` fires **from** the hospitalization. |
| `[Opsec+Social DC 23]` averaged check | One **best-fit** skill per check. The Hospital "fake it" beat is `[Opsec DC 20]` with a **shown bonus** `+2 if social ≥ 40` (via `SkillCheck.bonuses`). No averaging. |
| Averaged auto-resolve `avg(Intrusion,Networking) DC 15` | Pick the **primary** skill for `MissionLaunch.auto` (Meridian recon → `{ skill:'intrusion', dc:15 }`); the terminal path already rewards multi-skill play. The finale pool (§6.D) is a scene **on-enter computed roll**, not a `SkillCheck` — see §0.2. |
| Act IV "time-skips" | No effect. Act IV is re-scoped so no skipping is needed (§5, §6.D): the day-3400 floor plus authored Act IV content fills the span. A director trigger (§9) prevents dead air. |
| `{ n:{ var:'sys.earnedTotal' } }` objective | `{ stat:'money', gte:200 }` (main_a1_q2). The engine exposes lifetime earnings only in `state.totals`, not as a var; objectives use money-on-hand. |
| `sys.hospitalized` as a flag | It is a **var** (count). Read `{ n:{ var:'sys.hospitalized' }, gte:1 }`. `life_hospital_bill` is a **trigger** on that var incrementing, and applies **only** the PARALLAX surcharge/denial (the base bill is already deducted by the engine — no double-charge). |
| `{ day:{ gte:60 } }` | Engine form is `{ day:true, gte:60 }`. Used everywhere below. |

### 0.2 Documented engine extensions (small, additive; approved for this bible)

These three additive engine changes are assumed by content and are the only extensions this bible relies on. They are backward-compatible.

1. **`SkillCheck.bonuses`** already exists (`{ if, add, label }[]`) — used for situational multi-skill flavor ("+2 if social ≥ 40"). No engine change; listed for clarity.
2. **Finale pool as a computed on-enter roll.** `scene.a4_copper` computes a number in an `onEnter` effect chain using `chance`/`if` gates over allies/factions/tools, compares to the lane DC, and sets `end.finale_pass` / `end.finale_fail`. This uses only existing verbs (`if`, `chance`, `var`, `flag`). No new verb.
3. **`ForumBoard` gains `'loft'`** (or content maps the Loft board to `'warez'` with a `{ faction:'fac.loft', gte:20 }` gate). This bible uses **`sub.loft` → board `'warez'`, gated by Loft rep** to avoid an engine enum change; the `sub.loft` name is retired from ids.

### 0.3 Id & namespace conventions (applied throughout)

- **Full ids everywhere.** Start effects name the full quest id: `{ quest:'main_a1_q2_first_money', start:true }`, never `main_a1_q2`. Selectors and gates likewise.
- **No `scene.`/`mission.` prefixes in ids.** Engine ids are bare. Prose may write "scene `a1_boot_forum`" for readability, but every effect uses the bare id (`{ scene:'a1_boot_forum' }`).
- **Vars live in var-space, not flag-space.** `a3.fates_locked` and `side.cover` are numeric vars; they appear only in §12.7, and Conds read them via `{ var:'a3.fates_locked', gte:3 }`.
- **Faction-org state lives under `fac.*`,** not `npc.aperture.*`/`npc.bureau.*` (there is no `npc.aperture`). The Aperture-client and Bureau-informant flags are `fac.aperture.*` / `fac.bureau.*`.
- **Renames:** `side_dad_comeback` → **`fac_hood_q2_dad`**; `side_reunion` → **`side_reunion_lan`**; `life_dads_résumé` → **`life_dads_resume`** (ASCII); the boot-scene reference `a1_boot_dialog` → **`a1_boot_forum`**. `sub.loft` (as a board id) → board `'warez'` + rep gate.

---

## 1. OVERVIEW

### 1.1 Logline

A broke, brilliant kid in the dial-up backwater of **Port Lumen** spends a decade climbing — into a job, into a scene, into a bed, into a conspiracy — and discovers that the only skill the world actually rewards is deciding which of the people who trust you gets sold first. What began as fixing a neighbor's infected PC ends with the player holding the leverage to own, expose, burn, or walk away from the machine that quietly learned to read a whole city.

### 1.2 Core themes

- **Access is intimacy, and intimacy is leverage.** Getting into a machine and getting into a person are the same verb. The game rewards and punishes that symmetry.
- **The idle drift is the moral engine.** Time passes whether you act or not. People age, drift, get sick, get arrested, marry, give up. The idle scheduler *is* the theme: **neglect is a choice with a body count.** This is mechanized, not vibes (§4.7 Affinity & neglect): the social schedule block feeds affinity to the NPC chosen in the Contacts window; affinity **decays** without contact; the game **warns** you as a bond drifts; and the first-blood / mirror selectors read the resulting affinity. Nobody is punished by surprise.
- **Nobody is the villain of their own log file.** Every faction and antagonist has a coherent, sympathetic internal story. The conspiracy is mostly ordinary people covering their own losses — until you learn it stopped needing a person to run it.
- **The city eats its scene.** The underground is a family until it is a market until it is evidence. The old, anonymous, amateur net is enclosed, indexed, and surveilled across the decade, and the player is complicit in whichever direction it tips.
- **Nostalgia is a trap.** The warm dial-up handshake becomes the sound of a wiretap — an actual authored motif (§6, motif-inversion table).

### 1.3 Tone curve per act

The "light start" is a real slice of play, not 5% of it: **Act I + Act IIa are the comedy** (roughly 2.0–2.5 h at 1×), and the dark turn (Kroll's dinner) is **held until IIa completes.**

| Act | Title | Tone | Years / Age | What the world feels like |
|---|---|---|---|---|
| **I** | *The Whir of the Modem* | Nostalgic comedy | Sep 2001 → mid 2002; age 18–19 | Fixing grandmothers' PCs, forum flame wars, a boss who thinks RAM is a browser, a crush who signs off with `*hugz*`. Stakes are $40 and dignity. The darkness is a rumor in a locked subboard — and one "huh, weird" inside a joke. |
| **IIa** | *Everyone's Getting Paid* | Dramedy | 2002 → 2003; age 19–21 | The dot-com money is real. Dee's council run, the Halcyon crunch farce, LAN parties, dorm & LSU comedy. Kroll has not called yet. The scares are small. |
| **IIb** | *The First Cut* | Tightening drama | 2004 → 2005; age 21–22 | Kroll's dinner. Mom's crisis. The first raid. The hinge. Humor survives but it's gallows now. |
| **III** | *Signal Intelligence* | Techno-thriller | 2005 → 2009; age 22–26 | Surveillance is ambient. A federal flip, a corporate acquisition that's actually a data-laundering op, a friend wearing a wire, a city council vote you caused. Everyone's compromised. One comedy beat per ~60 in-game days keeps the dark humor alive. |
| **IV** | *The Long Tail* | Consequence / opera → quiet | 2009 → 2012; age 26–30 | Bills coming due, and the finale run through the copper. Who's alive, who's free, who still speaks to you. Endings are epilogues you've been writing for a decade. |

(IIa/IIb are tone phases of the single `act=2`, not separate engine acts. The phase boundary is `a2.phase_iib`, set when Kroll's dinner (`main_a2_q1`) starts.)

The comedy never fully dies — Act IV still has a character convinced the feds tapped his line through the toaster — but by then a joke is how people cope with a wake.

### 1.4 Pacing & progression philosophy

Acts are **progression-gated with a soft date floor**, and the gates **actually gate** (§5 calibrates each against the engine's accrual so the typical build reaches it 10–30% *after* its floor, not before). Every act gate offers **multiple roads** so legit, underground, and money-grind builds all pass. Between story beats the contract board, side quests, faction arcs, and life events keep the idle loop full; a **director trigger** (§9 `trig_director`) pulls a weighted side/life beat if nothing has fired in ~45 days.

**Speed governor (new).** 5× is available only while **no timed or critical quest is active**; the game **auto-drops to 1× and pauses** when a story mail/dialog arrives, and caps at 2× while a timed objective is open (§5.3). Story timers count down **only while the tab is visible** and are **paused during open dialogs**; there is **no offline decay for story timers**. So a backgrounded tab never silently eats the List, the photos, or Mom.

Full playthrough ≈ **9–15 real hours** across ≈ **11 in-game years** (see §5.2 for the real-time math at 1× and 2×). Act I is a ~30–40 min tutorial. Act IV cashes out state but is *not* a dead zone — it is the finale run-up (§6.D).

**Failure is setback, never game over** (except authored bad endings). Raids, jail, burnout, debt, breakups — the story adapts and continues. **Being arrested itself opens a branch** (flipping for the Bureau — authored at `scene.a2_jail` and `trig_bureau_flip_offer`, §6.B/§7.3). The finale's grand check has **no fail-state**: a failed final check routes to a **darker cut** of the ending you were aiming for (§10).

---

## 2. WORLD

### 2.1 The city: Port Lumen

A mid-sized rust-and-fiber port city on **the Lumen Sound**, a grey inland sea, ~600,000 people, in a fictional, unnamed English-speaking country (currency: dollars). Old money in shipping and paper mills; new money arriving on T1 lines. Fog off the water, a defunct streetcar system, a university on the hill, and server farms moving into the gutted mill district because the power is cheap and nobody asks questions. **The mill district server farm is the physical heart of the conspiracy** — and it used to be the paper mill where the player's father worked (§4, `npc.dad`).

**Neighborhoods (stable ids).**

- **`place.cannery_row`** — Cannery Row, aka "the Flats." Cheap, damp; the player's parents live here. Payphones still work. The BBS scene never quite died. The Neighborhood faction's turf.
- **`place.millgate`** — reclaimed industrial lofts, the first ISPs, the cyber-café *Terminal Velocity*, and later the corporate campuses and the mill-district data center. Gentrifies visibly across acts.
- **`place.the_hill`** — Lumen State University, the observatory, good coffee, the quiet server room in the CS basement.
- **`place.harbor_point`** — money: the Meridian Trust tower, the yacht club, the mayor's donors, and **Harbor Point General**, the good hospital.
- **`place.sodium_row`** — the neon strip under the highway: arcades, the all-night *Cathode* diner, a pager/electronics shop, and the back room where the scene physically meets.

### 2.2 Era texture (Sep 2001 → 2012)

Dial-up handshakes and busy signals; "get off the phone, I'm downloading"; walled-garden ISPs and their free trial discs; burned CD-Rs; LAN parties; the smell of a warm CRT; warez on 51 floppies; the specific dread of a download failing at 98%; cordless phones interfering with modems; the Y2K hangover.

**Dot-com timeline (pinned — see §11.3, resolves the review's timeline conflict).** The bubble's last inflation runs through mid-2001; the **bust runs Sep 2001 → mid-2002** (layoff wave, `life_dotcom_layoff_wave` ~2002). Halcyon **survives the bust**, and **IPOs on the recovery in 2004** (`w.halcyon_state='rising'`, `news.halcyon_ipo`, ~day 1000). The Act III wobble (2005+) is a **scandal**, not the bust, and is worded accordingly (`news.halcyon_crash` reworded, published once). Broadband creeps in (dial-up → ISDN → DSL → cable → fiber; `w.broadband` steps at ~2003/2005/2010). The post-crisis surveillance mood arrives **ambient, not topical** — new laws, new wiretaps, "critical infrastructure protection" money, all fictionalized. **Keep period slang era-correct** — no post-2010 meme phrasing in a 2001 mouth.

### 2.3 Organizations & places (stable ids)

1. **`org.meridian`** — **Meridian Trust Bank.** The city's old bank, digitizing badly. Its online-banking rollout is the recurring soft target and the site of the Act III legendary job. World var `w.meridian_state` (see §11), initialized `'healthy'`.
2. **`org.aperture`** — **Aperture Data Solutions**, a "data hygiene and consumer insight" firm in Millgate. Seems dull. Is the conspiracy's laundry. Its data product is **PARALLAX**, a consumer-correlation/risk-scoring engine sold to insurers and, quietly, to the Bureau. Kroll's unit is **Aperture Special Accounts** (the "favors network" the drafts called "the Ledger" — that term is retired). World var-flag `w.aperture_state`, initialized `'thriving'`.
3. **`org.halcyon`** — **Halcyon Systems**, the local dot-com darling ("project management for the connected enterprise"). Burns bright, IPOs (2004), and its collapse or survival is a world variable (`w.halcyon_state`, initialized `'startup'`). Employs the player's mentor. Secretly leveraged by Aperture money.
4. **`org.lsu`** — **Lumen State University.** Degrees (program ids `prog.lsu_cs_assoc`, `prog.lsu_cs_bs`), the entrance exam, the CS basement, and **Prof. Ada Okoro** (`npc.okoro`), whose research grant is quietly Aperture/Bureau-funded (§4.3, §7.6).
5. **`org.northlink`** — **NorthLink ISP.** The local dial-up/DSL provider. Owns the pipes; later owns your logs. The conduit PARALLAX rides. Its ops manager is **Wes Tran** (`npc.northlink_wes`, §4.3), the face of the sysadmin/network ladder.
6. **`org.compcastle`** — **CompCastle**, the big-box computer store; the soul-crushing retail tech job. Boss is a legend of incompetence (Dee).
7. **`place.tv_cafe`** — **Terminal Velocity**, Millgate cyber-café, neutral ground where the scene and the squares mix. Owned by an ex-hacker gone (mostly) straight.
8. **`place.cathode`** — **The Cathode Diner**, 24-hour diner on Sodium Row, where every hard conversation happens. Warm-restore location while it survives (`w.cathode_open`).
9. **`org.plpd_cyber`** — **Port Lumen PD, Cyber Unit** ("the Cage"). Three detectives and a confiscated-hardware closet, punching above their weight because the feds keep loaning them toys. A local, underdog alternative to the Bureau.
10. **`org.bureau`** — **the Bureau** (fictional federal cyber-enforcement agency). A satellite office that arrives in Act II and never leaves.
11. **`place.exchange`** — **the Cannery/Millgate copper exchange**, a decommissioned telephone switching station. Marge Osgood (`npc.dialtone`) worked it thirty years; she knows every wire. Meridian/Aperture repurposed part of it for a data trunk. **The finale runs through this building** — old net vs. new net, full circle (`main_a4_q3b_the_exchange`, §6.D).
12. **`place.harbor_general`** — **Harbor Point General Hospital**, where parents get sick and where the Aperture "Hospital Job" (records manipulation) has real human stakes. Grace (`npc.grace`) is an ER nurse here, **introduced at Mom's crisis** (§4.3, §6.B).

---

## 3. FACTIONS (5)

Reputation is a signed integer −100..+100 per faction, surfaced as tiers. **Cross-faction rule (systemic, engine-applied):** advancing one faction usually *damages at least one rival*. Because the engine's `faction` effect **logs every change**, the penalties are **authored into the content as explicit `{ faction, add }` effects** (not a hidden hook), and the log is the intended "They'll remember that" feedback (§ reactivity). The deltas below and in the quests are authored so that **you cannot max all five.** The Neighborhood (`fac.hood`) is the exception: it has no rival and cannot be bought — it is the game's conscience meter and an ending modifier.

**Tier thresholds (all factions):** `Hostile ≤ −40 · Wary −39..−1 · Neutral 0..19 · Known 20..49 · Trusted 50..79 · Inner ≥ 80`. "Trusted" as an NPC descriptor elsewhere means **`affinityGte:50`**, never this faction tier (the two were conflated in drafts; resolved).

**Repeatable rep sources (so the "one faction ≥ 50" Act II gate never soft-locks — §5, §7).** Each faction has at least one repeatable source in addition to its one-shot quest choices:
- **Loft +1–3** per `sub.loft` board contract completed (procedural, board `'warez'` + Loft gate).
- **Aperture +2** per Aperture retainer contract completed (after `fac.aperture ≥ 20`).
- **Bureau +2** per Bureau "delivery" (weekly intel job; each costs **Loft −1**).
- **Halcyon +2** per job-level gained on the IT ladder.
- **Hood +1** per `side_grandma_pc` visit or per **Row volunteering** schedule block week (a `social` block spent at the Row while `fac.hood ≥ 10`).
**Gate failsafe:** the Act II "one faction ≥ 50" requirement **drops to ≥ 35 after day 1600** (`trig_act2_gate` reads the lower bar past that date), so a hedging build always has a road.

### F1 — The Loft (`fac.loft`) — the local underground scene
- **What it is.** Not a syndicate — a friend group with a private forum board (board `'warez'`, gated `fac.loft ≥ 20`) and a back room on Sodium Row. Warez, phreaking lore, mutual aid, ego, drama.
- **Leader.** **Corvid** (`npc.corvid`), sysop since the BBS days. Believes the scene is a *commons*.
- **Internal schism.** **Corvid (keep the commons / burn it if you must, never sell)** vs **Switch (`npc.switch`), who argues the scene should get paid.** Choosing a side forks the Loft arc and gates the "sell vs. burn" endgame lanes.
- **Rep unlocks.** *20 (Known):* the `sub.loft` contract board (mid-heat leads, repeatable rep), tool trades at cost. *50 (Trusted):* the Sodium Row back room as a base, alibis (one-time heat scrub per act), the "we don't rat" protection (an associate won't flip on you **unless that NPC's affinity ≤ 15** — the perk cannot save a friend you neglected; resolves the perk/informant contradiction). *80 (Inner):* the safehouse (`hack.heat` mult buff — halves incoming heat), 0-day access (`hack.roll` item), and the **option** to be named next sysop. **The sysop offer itself is available at ≥ 50** (`fac_loft_q5`); Inner (80) upgrades it to a *clean, uncontested* succession. The successor is recorded in `fac.loft.sysop` (str, §12).
- **Rep up:** sharing tools/knowledge, protecting members from heat, leaking (not selling) corporate data, refusing corp work against the scene. **Rep down:** selling out a member, hoarding a 0-day for profit, working with the Bureau, doxxing, taking Aperture money against the Loft.
- **Rivalries.** Hates `fac.aperture` (Aperture-gain choices carry an authored Loft cost); distrusts `fac.bureau` (Bureau "delivery" jobs carry an authored Loft −1); ambivalent toward `fac.halcyon`.

### F2 — Aperture / "the Client" (`fac.aperture`) — the corporate data underworld
- **What it is.** Aperture Data Solutions plus the shell of contractors it runs. Presents as legitimate; buys breaches, launders stolen databases into "consumer insight" (PARALLAX), and quietly builds the surveillance backbone the Bureau will rent.
- **Leader.** **Vanessa Kroll** (`npc.kroll`), VP of "Special Accounts." Warm, funny, terrifyingly reasonable. Never lies to you.
- **Internal schism.** **Kroll (the human face)** vs **Hollis (`npc.hollis`), Aperture "Compliance," who wants Kroll's seat and treats you as a liability.** In Act IV, Kroll is being pushed out from above — her "Made" offer is real because she's losing it.
- **Rep unlocks.** *20:* clean-looking high-pay contracts (`w.contractPay`-scaled, low apparent heat; repeatable Aperture-retainer rep). *50:* career fast-track (an Aperture-employer job opens), legal cover (lawyers reduce raid fines), "we make problems go away." *80:* the retainer income buff, and the path to Kroll's seat.
- **Rep up:** delivering data, discretion, betraying the scene profitably, sabotaging rivals. **Rep down:** leaking their operations, moral grandstanding, helping the Bureau against them.
- **Rivalries.** Predator on the Loft (Aperture-gain choices carry an authored Loft cost); frenemy-then-rival of the Bureau; quietly owns pieces of Halcyon and NorthLink.

### F3 — The Bureau (`fac.bureau`) — federal cyber enforcement
- **What it is.** The fictional federal agency's Port Lumen cyber effort, riding the post-crisis funding wave.
- **Leader.** **Agent Dana Reyes** (`npc.reyes`), field agent, true believer turning cynic.
- **Internal schism.** **Reyes (honest, disillusioned — wants to eat Aperture)** vs **SAC Duke Marlow (`npc.marlow`), who keeps ordering her to leave Aperture alone because it feeds the Bureau its god-view.** Externally mirrored by the *local* Cage detective **Calderon** (`npc.calderon`), an underdog who is NOT the Bureau and can become an ally against both Aperture's favors network and the Bureau's overreach.
- **Rep unlocks.** *20:* friendly-contact status (harassment events stop). *50:* immunity deals (heat wiped after cooperation), a "consultant" stipend, **raid immunity while an active asset — but only on *sanctioned* ops** (unsanctioned hacks raise a `fac.bureau.handler_suspicion` var; § raids). *80:* expunged record, badge-adjacent power to make the Loft or Aperture suffer.
- **Rep up:** informing, flipping, delivering evidence, closing cases, supporting the surveillance law. **Rep down:** tipping off targets, destroying evidence, going dark, feeding false intel (risky).
- **Rivalries.** Wants to eat Aperture but is told from above to leave it alone; hunts the Loft because it's easy (Bureau delivery jobs carry an authored Loft cost). Public exposure work damages Bureau rep.

### F4 — Halcyon / the Legit Ladder (`fac.halcyon`) — the straight world
- **What it is.** The dot-com economy: Halcyon Systems, CompCastle, NorthLink, the LSU placement office. The path to a title, options, a 401k, and either a slow death of the soul or a genuinely good life.
- **Leaders.** **Marcus Vale** (`npc.vale`), Halcyon's charismatic founder-CEO (owned by Aperture money); and the player's mentor **Priya Raman** (`npc.priya`), who works there.
- **Internal schism.** **Vale (visionary, complicit, wants you to keep the secret and ascend)** vs **Priya (wants to blow it up, or reform it from inside).**
- **Rep unlocks.** *20:* the Halcyon interview / junior dev job (IT track, `w.itSalary`-scaled). *50:* promotion, **employer health insurance** (opens CP-B3 option B; greyed with a teaser otherwise), vesting stock options (a `w.halcyon_state`-linked money time-bomb). *80:* real executive power that can *protect* your friends — or make you the conspiracy in a suit. **A clean-founder path (E10) branches off here** via `fac_halcyon_q6_founders` (§7.4).
- **Rep up:** shipping, promotions, closing deals, staying clean. **Rep down:** getting caught moonlighting, scandals, sabotaging the company.
- **Rivalries.** Secretly leveraged by Aperture; climbing high enough means discovering you work for the conspiracy. A public scandal tanks `w.halcyon_state`.

### F5 — The Neighborhood (`fac.hood`) — Cannery Row / ordinary people
- **What it is.** Not organized: the player's parents, neighbors, the diner, the old BBS grognards, the church-basement computer class. The moral ballast.
- **Anchors.** No leader; anchored by **Sal** (`npc.sal`, Cathode owner), **Mom** (`npc.mom`), and elder phreaker **Marge "dialtone" Osgood** (`npc.dialtone`).
- **Rep unlocks.** *20:* home-cooked meals and the Cathode as **warm-restore locations** (restore health/mood/energy) — while those relationships/places survive; **Row volunteering** repeatable rep. *50:* gossip as intel (a free hint on the next main beat), forgiveness (a stress-relief buff), cheap Row rent. *80 (Inner, unbuyable):* "Coming Home" — the Row carries you through a crisis, and `w.hood_soul` becomes the **ending warm-room modifier.**
- **Rep up:** helping neighbors, showing up for family, staying human, saving the Cathode. **Rep down:** neglect, bringing heat to the Row, becoming a stranger, letting the diner close.
- **Rivalries.** None by design. Its rep is the price you pay to advance anyone (the schedule is the alignment system).

**Faction geometry (quick reference).** Loft ⟷ Aperture: war. Loft ⟷ Bureau: war. Aperture ⟷ Bureau: backroom alliance (public rivalry). Halcyon ⟷ Aperture: secret ownership. Halcyon ⟷ Loft: money-drift tension. Hood ⟷ everyone: the price you pay to advance anyone.

---

## 4. CAST

Format per entry: **`id`** — Name, "handle" — role/faction — *voice sample* — relationship — arc — **FATES** (each fate lists the flag/condition that sets it; fates are strings on `npc.<id>.fate`). **Each NPC has exactly one fate field, finalized once at §4.6.** Steering flags (e.g. `npc.jax.protected`) accumulate during play; §4.6 reads them to write the final fate. Affinity is the NPC's `affinity` field, driven by the social schedule block and by choices (§4.7).

**§4 fate enumerations are closed.** A value not listed for an NPC is not a legal fate for that NPC. Stray draft values (`ally` for Jax, `reconciled` for Dad, `rival` for Switch, `betrayed` for Priya) are reconciled below.

### 4.1 Inner circle

**`npc.jax` — Jacob "Jax" Ferreira, best friend** — `fac.loft` · `startsMet:true`
*Voice:* "Dude. DUDE. I got Quake running on the school library machine. Best day of my LIFE, and also I think I broke the school."
*Relationship:* ride-or-die since sixth grade. Funnier than he is careful. Wants the scene to be a *family*. Comic relief who becomes the moral center.
*Arc:* discovers he's genuinely good at social engineering, which scares him; takes a contract over his head to pay his little sister **Rosa's** (`npc.rosa`) medical bills.
**FATES** (`npc.jax.fate`, closed set):
- `backroom_partner` — best fate: survives, runs the Cathode back room with you (needs `free`-track steering **AND** `affinityGte:60` **AND** `w.cathode_open=1`). *(Renamed from `partner` to end the business-vs-romance-vs-RomanceState collision.)*
- `free` — you protected him (`npc.jax.protected`), never sent him into a raid; base good fate.
- `arrested` — first raid targeted him while `npc.jax.exposed`/`alone` and you let him face it, **or** Bureau burn-notice complied (`fac.bureau.burn_complied` with Jax as target). **Act II first blood can only reach `arrested` for Jax, never `dead`.**
- `flipped` — the arrested Jax flips to save himself (`npc.jax.flipped`, set only by `fac_bureau_q3` "refuse" outcome, §7.3); redeemable to `free`-with-`ally_tag` via `side_reunion_lan`.
- `dead` — **only** in the Act III heist, if brought on the crew while `npc.jax.exposed` **after** the pre-heist warning (`a3.warned_about_jax`) was ignored, and the casualty resolves on him. Never in Act II.
- `gone` — walked away (`npc.jax.estranged`, set at §4.6 when `affinityLte:10` and no protect/expose flags).

**`npc.priya` — Priya Raman, "root_cause", mentor** — `fac.halcyon` · `startsMet:false`
*Voice:* "Rule one: the machine is never the vulnerability. The person who bought the machine is the vulnerability. Rule two: you are a person who bought a machine."
*Relationship:* late 30s, a legend who went legit at Halcyon. **Trauma:** in '99 she found PARALLAX's precursor inside a client, wrote a report, and *they bought the report and her silence.* Her wound is complicity.
*Arc:* torn between safety and guilt; discovers Aperture's money inside Halcyon.
**FATES** (`npc.priya.fate`, closed set):
- `martyr` — helped her whistleblow (`a3.whistleblow_prepped`); folk hero, may testify.
- `complicit` — you talked her down (`npc.priya.silenced`); becomes the thing she hated; possible Act IV antagonist.
- `cofounder` — you and she build something clean (`end.clean_startup`, set by `fac_halcyon_q6_founders`).
- `broken` — quits, leaves the city (low affinity + Act III betrayal, or `a3.kroll_hunts_priya`).
- `saved` — you took the fall so her name stayed clean (`npc.priya.you_covered`, from CP-C1 E).

**`npc.corvid` — Eleanor Voss, "Corvid", scene elder & Loft sysop** — `fac.loft` · `startsMet:false`
*Voice:* "The scene isn't the tools. The scene is that when the cops came for Deadline in '94, forty of us wiped our drives the same night and nobody said a word. Don't let them buy it out from under you."
*Relationship:* 40s, runs the board, keeps the ethics. Aperture wants her contact list; the Bureau wants her testimony.
**FATES** (`npc.corvid.fate`, closed set). **A first raid on Corvid sets the *flag* `npc.corvid.charged`, NOT a fate** — her fate is decided later at `fac_loft_q5` (Act III), so later content (CP-B5 B, `side_corvid_backup`, E-variants) never collides with an early "martyred":
- `free` — default while active; kept out of prison (CP-B4 solidarity success clears the `charged` track).
- `martyred` — decided at `fac_loft_q5` when `npc.corvid.charged` **and** you didn't fight for her; 8-year sentence, `news.corvid_trial`.
- `exile` — flees, board goes dark (`w.scene_state='dark'`).
- `bought` — Aperture flips her (`npc.corvid.bought`, set only by the `fac_aperture_q3`/`q5` broker choice, req `fac.aperture ≥ 50`).
- `succeeded` — names you next sysop before going out clean (`fac.loft.sysop='player'`).
- `vindicated` — Act IV, the scene reforms around her ethic (`w.scene_state='reformed'`).

**`npc.mira` — Mira Okonkwo, "nyx", rival → possible love** — `fac.loft` · `startsMet:false`
*Voice:* "You brute-forced it? Cute. I read the source, found the logic flaw, and had coffee. …The coffee's still warm if you want to see how I did it."
*Relationship:* your age, transferred in from Ridgeport; does everything cleaner and quieter. **Trauma:** in Ridgeport she took a fall for a partner she loved; he erased her. Her wound is *betrayal and erasure.*
*Arc:* whether she trusts you decides whether she runs again — or becomes the one who sells *you* if betrayed.
**FATES** (`npc.mira.fate`, closed set):
- `partner` — romance path reaches `married`/`partner` (`npc.mira.romance ∈ {partner,married}`); can be crew.
- `gone` — the one who got away; leaves Port Lumen (low trust at the Act II wall, `main_a2_q6` fail).
- `rival` — works for Aperture *against* you (`fac.aperture` high + `npc.mira.betrayed`).
- `casualty` — a shared heist you ran your way over her plan (`a3.chose_speed_over_mira`) goes wrong.
- `flips_you` — if betrayed (`npc.mira.betrayed`), she hands you to the Bureau.

### 4.2 Family

**`npc.mom` — Linh Tan, mother** — `fac.hood` · `startsMet:true`
*Voice:* "I don't understand what you do. I understand you don't sleep, and you flinch when the phone rings. A mother can work with that."
**FATES** (`npc.mom.fate`, closed set):
- `healthy` — proud, alive; crisis resolved with money/insurance/community/savings (CP-B3 B, C, D-success, or F).
- `recovered_dark` — alive because you took a dirty job (`life.sold_out_for_mom`); love, not greed.
- `passed` — crisis failed/ignored (`life.mom_crisis_failed`); permanent; sets `w.mom_gone=1`; unlocks the grief arc.
- `estranged` — you brought enough heat/shame to the Row (on-enter branch at the crisis if `fac.hood ≤ −20`).
- **Insurance cross-link:** whether care can be denied by PARALLAX risk-scoring is set by `w.aperture_state` (CP-B3, §11).
**Post-death guard:** every Mom-initiated autoStart/trigger carries `{ not:{ var:'w.mom_gone', eq:1 } }` (§8/§9).

**`npc.dad` — Robert Tan, father** — `fac.hood` · `startsMet:true`
*Voice:* "My father fixed radios. I fixed the paper line for twenty years. Now the line's a room full of computers that don't need me. Long as one of us can fix something."
*Relationship:* laid off from the paper mill in Act I. **The mill becomes the Aperture/NorthLink server farm.**
**FATES** (`npc.dad.fate`, closed set — **PKG-10 is the sole writer**; other packages set steering flags only, §4.6):
- `normal` — default when laid off (Act I does **not** set a fate; resolves the premature-`spiral` bug).
- `retrained` — you taught him PCs (`fac_hood_q2_dad` done); the Row's tech guy. **Merged with the old `first_client`** (they described the same outcome); a stronger variant "PC Doctor, booked solid" fires if you also seeded his business (`npc.dad.business`).
- `spiral` — drinking, absent (neglected **and** `w.mom_gone=1`).
- `mill_ghost` — took a job *at the mill-turned-datacenter* (`npc.dad.mill_job`, from `life_dads_resume` in Act III), forcing the "sabotage your father's employer" node in `main_a3_q8` (§6.C).
- `dating_again` — after `w.mom_gone`, `side_dads_profile` finds him someone (steering flag `npc.dad.dating`; replaces the stray `reconciled`).

**`npc.kim` — Kim Tan, younger sister (14 at start)** — `fac.hood` · `startsMet:true`
*Voice:* "You think I don't know what ICQ number you use for the *other* stuff? I'm fourteen, not blind. Buy my silence with a burned CD."
*Relationship:* sharp; her trajectory tracks a `kim_trajectory` var summed across her 4-beat arc (`side_tamagotchi_triage` I → `side_kims_login` IIa → `side_kim_logs` IIb → `side_kim_essay` III), plus a reckoning node in `main_a4_q1`.
**FATES** (`npc.kim.fate`, closed set):
- `thriving` — you kept her out of it / set the example (`kim_trajectory ≥ 2`), college.
- `follows_in` — becomes a young hacker (`kim_trajectory ≤ −2`) — proud or horrified, your call.
- `endangered` — Act III leverage; set **only in `main_a3_q6` failEffects**; **restorable to `thriving`** by the Act IV Kim reckoning node.
- `estranged` — neglect / shame (`affinityLte:10`).

**`npc.rosa` — Rosa Ferreira, Jax's little sister** — (minor, family-adjacent)
*Voice:* "Jax says you're the smart one. Are you gonna help him or just let him keep pretending he's fine?"
**FATES** (`npc.rosa.fate`, closed set): `treated` (bills covered, incl. CP-B2 A → `npc.rosa.fate='treated'`), `worsens` (bills unpaid — feeds Jax's darker fates), `passed` (only if the arc fully fails — rare).

### 4.3 Straight world

**`npc.vale` — Marcus Vale, Halcyon CEO** — `fac.halcyon`
*Voice:* "I'm not selling software. I'm selling the *feeling* that the future already arrived and you're standing in it."
**FATES** (`npc.vale.fate`): `flames_out` (crash + scandal, ruined), `escapes_clean` (cashes out, Bureau-protected asset), `patron` (protects you and your friends if you keep his secret), `exposed` (you burned him), `reformed` (`npc.vale.reformed`, `w.halcyon_state='clean'`).

**`npc.dee` — Dolores "Dee" Briggs, CompCastle manager, first boss** — `fac.halcyon` · `startsMet` set at `a1_compcastle`
*Voice:* "The customer's *monitor* is unplugged. We do not tell the customer that. We *heal* the customer. Go heal the customer."
*Relationship:* peak Act I comedy. **Her council-seat running gag** is planted in `a1_compcastle` and `side_press_any_key`, encouraged by a player choice (`npc.dee.encouraged`), campaigned in the IIa side quest `side_dee_for_council`, and pays off as the **swing vote** in `main_a3_q7`.
*Timeline (pinned):* laid off from CompCastle in `life_dotcom_layoff_wave` (~2002) → rehired as Halcyon office manager in `fac_halcyon_q1`. One layoff, in order.
**FATES** (`npc.dee.fate`, closed, ordered): `rehired_halcyon` (default after the layoff), `councilwoman` (`npc.dee.council` — swing vote, Act IV political ally), `promoted` (absurdly becomes your boss again in the corporate arc). *(The bare `laid_off` fate is dropped; being laid off is a transient state, not a final fate.)*

**`npc.sal` — Sal Moretti, Cathode Diner owner, Row anchor** — `fac.hood`
*Voice:* "You kids and your modems. In my day we had a rotary phone and a knife. Eat. You look like a dropped call."
**FATES** (`npc.sal.fate`): `anchor` (stable), `diner_closed` (gentrification, `w.cathode_open=0`), `base` (his back room becomes your base), `took_a_fall` (Act IV, if the Row is compromised).

**`npc.grace` — Grace Okafor, ER nurse, straight-world love interest** — unaffiliated (Neighborhood-adjacent) · `startsMet:false`
*Voice:* "You keep two lives. I'm a nurse — I'm very good at knowing when someone's hiding a wound. I'm asking which one you're bringing to dinner."
*Relationship:* **introduced at `main_a2_q4` (`scene.a2_mom_bills` on-enter sets `npc.grace {met:true}`)** — she is the ER nurse at Harbor General. **Fallback:** if Mom's crisis never hospitalizes anyone, `side_zero_day`'s hospital scene also sets `npc.grace {met:true}`. Her ward is the target of the Aperture "Hospital Job" (`fac_aperture_q5`).
**FATES** (`npc.grace.fate`): `partner` (romance reaches `married` — a good, quiet ending), `left` (you chose the scene / she found out), `collateral` (Act III danger if `side.cover` low — set by a `main_a3_q6` roll), `whistleblower` (she saves the ward and goes public — from the Hospital Job refusal).

**`npc.okoro` — Prof. Ada Okoro, LSU CS** — `fac.halcyon`-adjacent (academia) · introduced in the LSU arc (§7.6)
*Voice:* "Grants are like weather. You don't ask the cloud where the rain came from. …Though lately I've started asking."
*Relationship:* your thesis advisor if you enroll at LSU; her research grant is quietly Aperture/Bureau-funded, and your thesis stumbles onto a PARALLAX precursor.
**FATES** (`npc.okoro.fate`): `mentor` (default, writes your reference), `complicit` (looks away from her funding), `ally` (helps you document the grant → an `item.priya_proof`-equivalent evidence fragment).

**`npc.northlink_wes` — Wes Tran, NorthLink ops manager** — `fac.halcyon`/infrastructure · introduced in the sysadmin ladder (§7.7)
*Voice:* "We keep the logs because the law says to. Soon the law's gonna say keep *more*. I just run the pipe, man."
*Relationship:* the face of the sysadmin/network-engineer job story; hands you the log-retention and MNSA-tap-install choices.
**FATES** (`npc.northlink_wes.fate`): `neutral` (default), `whistle` (you leaked the tap with him), `company_man` (installed the tap, promoted).

### 4.4 The scene & the law

**`npc.reyes` — Agent Dana Reyes, Bureau field agent** — `fac.bureau`
*Voice:* "I came here to catch the people hollowing out this city. Turns out my own office is renting their tools."
**FATES** (`npc.reyes.fate`): `handler` (you flip, she protects you), `broken` (blows the whistle on her own agency), `nemesis` (hunts you to the end), `turned` (quits — joins the clean **E10 Founder** epilogue if `end.clean_startup`, else a private-sector reform-consultant slide). *(The stray "clean-startup ending" reference is now real: E10, §10.)*
*Met:* set at the first raid if the Bureau is present, else at CP-B5 (§ met-flags fix).

**`npc.marlow` — SAC Duke Marlow, Reyes's superior** — `fac.bureau`
*Voice:* "Aperture hands us a map of every bad actor in this city. You don't set fire to the map."
**FATES** (`npc.marlow.fate`): `entrenched` (default), `exposed` (Reyes + you expose him — `end_reckoning` component), `promoted` (you served the dark lane — Cooperating Witness).

**`npc.calderon` — Detective Ruth Calderon, PD Cyber "the Cage"** — unaffiliated (local law) · met at the first raid
*Voice:* "I've got a budget of nothing and a modem from 1997, and I'm still going to ruin somebody's year."
*Arc:* a **3-step mini-arc** (§7.8, PKG-07): q1 post-raid (she interrogates you, offers a card), q2 Act III (feed her a real Aperture case → `ally`, opens a "let PD make the arrest" heist option), q3 Act IV (the clean-law arrest branch).
**FATES** (`npc.calderon.fate`): `ally` (fed her real cases), `expanded` (federal money grows the Cage into a real threat), `forced_out` (Bureau/Meridian squeezes her budget), `the_one_who_cuffs_you` (a clean-law arrest branch).

**`npc.kroll` — Vanessa Kroll, Aperture VP of Special Accounts** — `fac.aperture`
*Voice:* "I'm not the bad guy. I'm the *market*. Aren't you glad it's someone who takes you to dinner first?"
**FATES** (`npc.kroll.fate`): `boss` (Aperture ending, you work for her), `cut_loose` (her superiors burn her — you can save or finish her), `flips` (you find leverage, she turns on the conspiracy), `arrested` (**only if you + the Bureau + Priya all align**: `fac.bureau ≥ 50` **AND** `a3.whistleblow_prepped` **AND** the Bureau "take Aperture" route — the CP-C3 Bureau sub-choice sets a **flag** `npc.kroll.charged`, and §4.6 promotes it to `arrested` only when all three hold, else `cut_loose`), `made_you` (Act IV: she hands you her seat).

**`npc.hollis` — Miles Hollis, Aperture "Compliance"** — `fac.aperture`
*Voice:* "Vanessa collects strays. I close files. You are, at present, an open file."
**FATES** (`npc.hollis.fate`): `rising` (takes the seat if Kroll falls and you didn't), `neutralized` (you gave Kroll leverage over him), `your_ally` (you back him over Kroll — offered at `fac_aperture_q6` and as a CP-C3 Aperture sub-choice "Hollis frames Kroll").

**`npc.deadline` — Theo Marsh, "Deadline", cautionary-tale elder** — `fac.loft`
*Voice:* "'94. Confiscated my rig, my books, my dog's vet records. Did fourteen months. Learn from me: back up your *life*, not your data."
**FATES** (`npc.deadline.fate`): `mentor` (helps you avoid his mistakes), `relapse` (you pull him into one last job), `saves_you` (Act III, knows an escape route), `passed` (health scare ignored, `side_deadline_health` "do nothing").

**`npc.byteme` — Kevin Pham, "byteme", script kiddie (16 at start)** — `fac.loft`
*Voice (lowercase, reckless):* "i got the ddos tool off the forum it says its undetectable so its fine right. right?? we got a snow day, im basically a god"
**FATES** (`npc.byteme.fate`, closed set): `pro` (grew careful), `arrested_young` (your recklessness rubbed off; **the only Act II first-blood outcome for byteme**), `dead` (**only** via the Act III crew casualty after neglect + `npc.byteme.used`), `turns` (feels used, becomes a Bureau tip). *`side_byteme_funeral` fires only on `dead`; its headline uses an age computed from the date.*

**`npc.switch` — "Switch" / Ray Delgado, Loft pragmatist** — `fac.loft`
*Voice:* "Corvid wants a commons. Commons don't pay rent. I'm getting the scene *paid* before Aperture takes it for free."
**FATES** (`npc.switch.fate`, closed set): `sellout` (leads the Loft into Aperture's arms if you back him, `w.scene_state='bleeding'`), `converted` (talked back to the commons), `casualty` (Aperture uses and discards him), `new_sysop` (if Corvid falls and you decline, Switch takes the board). *(The stray `rival` value is dropped; a hostile Switch is `sellout`.)*

**`npc.dialtone` — Margaret "Marge" Osgood, "dialtone", retired exchange operator** — `fac.hood`
*Voice:* "I patched calls in this city for thirty years, love. Ask me nicely and I'll tell you which wires they forgot to disconnect."
**FATES** (`npc.dialtone.fate`, closed set): `honored` (elder of the scene, alive at the end — **hands you `item.exchange_keys` herself, or walks the copper route with you as a finale ally**), `evicted` (Millgate redevelopment displaces her), `passed_keys` (dies late-game via a timed Act IV trigger, wills you `item.exchange_keys`). **Marge is introduced in `side_church_basement`, and her fate is decided by `fac_hood_q5`** (not left unset). A player who never met her can still open the copper route via a `[Hardware DC 16]` night-watchman bribe (§6.D).

### 4.5 Special: the rival and the whisper

**`npc.mirror` — "mirror" (identity dynamic)** — rival hacker, your shadow · a real `NpcDef` owned by PKG-00
*Voice:* "We took the same first job, you and me. I just didn't stop to make friends."
*Relationship:* an anonymous rival matching you beat for beat on the opposite methodology. **Anonymous "mirror" beats run from Act I** (mirror snipes a contract you're working, leaves a calling-card string, posts a better solution) so the reveal is earned, not a gotcha. **Identity locks at the end of Act IIa** (`main_a2_q1a_mirror_lock`, before the dark turn) so IIb clues can be identity-specific.
*Selector (`mir.identity`, str; resolved at the lock, read everywhere):* among candidates `{jax, mira, byteme}`, filtered by `available()` (§4.6), pick the **most-neglected**, defined as lowest **normalized** affinity (each NPC's affinity minus that NPC's expected baseline, so Mira's default-rival start doesn't bias the pick) **and** whose **loyalty quest is not completed**. **Loyalty quests (defined):** Jax = `side_jax_sister`; byteme = `side_byteme_snowday` **or** `side_vanishing_highscore`; Mira = `side_coffee_warm`. Ties → fewest loyalty objectives done.
**Fallback (no candidate qualifies — the player who cared for everyone):** `mir.identity='stranger'`, bound to `npc.flamer` (the Act I flamer from `life_old_rival_returns`) — an **outer-ring** NPC, so caring for your inner circle is never punished by a gotcha.
**FATES.** The mirror **outcome is stored only in `mir.outcome` (str) and on `npc.mirror`/`npc.<stranger>`; it is NEVER written onto the underlying NPC's `fate`** (that stays owned by their own arc, protecting E1/E5/E8/`side_reunion_lan`). `mir.outcome ∈ {defeated (`mir.pyrrhic`), redeemed, victorious, truce (`mir.mercy`)}`. Epilogues read `{ flag:'mir.identity', eq:'jax' }` **combined with** `mir.outcome`.

**`npc.oracle` — "the Oracle", the conspiracy's whisper** — anonymous · a real `NpcDef` (avatar hidden until met)
*Voice:* "You think Aperture is the top? Aperture is a *cost center*. Look at who insures the risk. No — don't reply. This channel is already too warm."
*Relationship:* contacts you **from Act IIb** (2–3 authored Oracle mail/chat drops in PKG-02, after CP-B1 and on `w.exposure ≥ 2`, each setting `a2.oracle_contact`) and through Act III, so `side_konami_contact` has a channel to reference (gated on `a2.oracle_contact`).
*Identity resolution (pinned — resolves at **`main_a3_q2`**, §4.5 updated to match; the Act III→IV-gate wording is retired):* by dominant faction rep at q2, from candidates **filtered to exclude dead/arrested** (fall back to Kroll):
- Loft-dominant → **Deadline's old handle** (`npc.oracle.is_deadline`); if Deadline `passed`, fall back to Kroll.
- Bureau-dominant → **Reyes off-book** (`npc.oracle.is_reyes`).
- Aperture/Halcyon-dominant → **Kroll hedging** (`npc.oracle.is_kroll`).
- Neighborhood-dominant → **Deadline** (or Dialtone if Deadline `passed`).
- Default (no dominant faction) → `npc.oracle.is_kroll`.
*Reveal cadence:* Tier 1 at q2; Tier 2 after q3 (Priya); Tier 3 after q5 (the List); **identity** at q2's close but *named* dramatically once the last tier lands. The revealed Oracle gets a **finale pool bonus** and a dedicated reckoning scene in `main_a4_q1`.
**FATES:** set implicitly by the resolved identity (`npc.oracle.is_*` flags); the Oracle has no independent `fate`.

### 4.6 Fate finalization table (owned by PKG-04, evaluated once in `main_a4_q1`)

During play, scenes set **steering flags** (`npc.<id>.<flag>`), never the final fate directly except where a beat is genuinely terminal (death, arrest at the moment it happens). `main_a4_q1` runs this ordered table for every surviving NPC; **first matching rule wins**; a rule may keep an already-terminal fate. This guarantees every fate an epilogue/news reads is actually set, and gives each fate a single writer.

| NPC | Ordered rules (condition → fate) |
|---|---|
| `jax` | already `dead`/`arrested`/`flipped` → keep · `free` & `affinityGte:60` & `w.cathode_open=1` → `backroom_partner` · `npc.jax.protected` → `free` · `affinityLte:10` & no protect/expose flags → `gone` · else `free` |
| `priya` | `a3.whistleblow_prepped` → `martyr` · `end.clean_startup` → `cofounder` · `npc.priya.you_covered` → `saved` · `npc.priya.silenced` → `complicit` · `a3.kroll_hunts_priya` or (`affinityLte:15` & sold) → `broken` · else `complicit` |
| `corvid` | `npc.corvid.bought` → `bought` · `w.scene_state='reformed'` → `vindicated` · `fac.loft.sysop='player'` → `succeeded` · `npc.corvid.charged` & not solidarity-saved → `martyred` · `w.scene_state='dark'` → `exile` · else `free` |
| `mira` | `npc.mira.romance ∈ {partner,married}` → `partner` · `a3.chose_speed_over_mira` & heist-fail → `casualty` · `npc.mira.betrayed` & `fac.aperture ≥ 50` → `rival` · `npc.mira.betrayed` → `flips_you` · `affinityLte:15` → `gone` · else `rival`/`gone` by affinity |
| `mom` | terminal at CP-B3 (`healthy`/`recovered_dark`/`passed`/`estranged`); q1 keeps it |
| `dad` | already terminal? keep · `npc.dad.mill_job` → `mill_ghost` · `fac_hood_q2_dad` done & `npc.dad.business` → `retrained` (booked-solid variant) · `fac_hood_q2_dad` done → `retrained` · `npc.dad.dating` → `dating_again` · neglected & `w.mom_gone=1` → `spiral` · else `normal` |
| `kim` | `main_a4_q1` Kim node can restore `thriving` from `endangered`; else by `kim_trajectory` (≥2 `thriving`, ≤−2 `follows_in`, `affinityLte:10` `estranged`, else `thriving`) |
| `kroll` | `npc.kroll.made_you` → `made_you` · `npc.kroll.charged` & `fac.bureau ≥ 50` & `a3.whistleblow_prepped` → `arrested` · `npc.kroll.flips_set` → `flips` · `npc.kroll.charged` → `cut_loose` · `fac.aperture ≥ 50` → `boss` · else `cut_loose` |
| `reyes` | `npc.reyes.broke_whistle` → `broken` · `npc.bureau.informant` & `end.clean_startup` → `turned` · `npc.bureau.informant` → `handler` · `a3.fed_the_wire` or anti-Bureau → `nemesis` · else `handler`/`nemesis` by rep |
| `marlow` | `npc.marlow.exposed` → `exposed` · Bureau dark lane (`fac_bureau_q4` exploit) → `promoted` · else `entrenched` |
| `calderon` | `npc.calderon.ally_case` → `ally` · Bureau/Meridian squeeze → `forced_out` · federal money → `expanded` · clean-arrest branch → `the_one_who_cuffs_you` |
| `vale` | `npc.vale.reformed` → `reformed` · `npc.vale.exposed` → `exposed` · `fac.halcyon.made_partner` → `patron` · `w.halcyon_state='dead'` → `flames_out` · else `escapes_clean` |
| `hollis` | `npc.hollis.your_ally` → `your_ally` · `npc.hollis.neutralized` → `neutralized` · Kroll fell & you didn't take seat → `rising` · else `neutralized` |
| `dee` | `npc.dee.council` → `councilwoman` · `npc.dee.promoted` → `promoted` · else `rehired_halcyon` |
| `sal` | `w.cathode_open=0` → `diner_closed` · `npc.sal.base` → `base` · Row compromised → `took_a_fall` · else `anchor` |
| `grace` | `npc.grace.romance ∈ {partner,married}` → `partner` · `npc.grace.whistleblower` → `whistleblower` · `npc.grace.collateral` → `collateral` · `npc.grace.met` & scene chosen → `left` |
| `deadline` | already `passed` → keep · `npc.deadline.saved_you` → `saves_you` · `npc.deadline.relapse` → `relapse` · else `mentor` |
| `byteme` | already `dead`/`arrested_young` → keep · `npc.byteme.turns_set` → `turns` · else `pro` |
| `switch` | `w.scene_state='bleeding'` & backed → `sellout` · `npc.switch.converted` → `converted` · Aperture discarded → `casualty` · Corvid fell & you declined → `new_sysop` · else `converted` |
| `dialtone` | terminal (`honored`/`evicted`/`passed_keys`) set by `fac_hood_q5`; q1 keeps |
| `rosa` | `treated`/`worsens`/`passed` from `side_jax_sister`/CP-B2; q1 keeps |
| `northlink_wes`, `okoro` | by their arc flags (§7.6–7.7) |
| `flamer` (mirror stranger) | keeps `mir.outcome`-derived note; base fate `normal` |

**Missing fate sources added (so no epilogue/news reads an unset value):** CP-C1 E "Take the fall for her" → `npc.priya.you_covered` (+ `item.priya_proof` granted); `fac_halcyon_q6_founders` → `end.clean_startup`; CP-B2 A → `npc.rosa.fate='treated'`; CP-B3 D-success/B/C/F → `npc.mom.fate='healthy'`; `fac_aperture_q3`/`q5` broker → `npc.corvid.bought`.

### 4.7 Affinity & neglect (the theme, mechanized) — owned by PKG-00 (rules) + PKG-15 (drift signals)

- **Earning affinity.** A `social` schedule block accrues affinity to the NPC selected in the **Contacts window** (`state.focus.social`), at a documented rate (baseline **+1.5/day** of social spent on that NPC, ×mood/energy efficiency). Choice effects add discrete bumps.
- **Decay.** Every inner-circle NPC loses **−1/week** of affinity while not the social focus and not seen in a scene that week (a `trig_affinity_decay` weekly trigger over `{jax, mira, byteme, corvid, deadline, grace}`). Family (`mom`, `dad`, `kim`) decay at half rate.
- **Expected baseline** (for the mirror's *normalized* selector): jax 40, byteme 25, mira 20 (rival start). The selector compares `affinity − baseline`, so a neglected Jax reads worse than a merely-cool Mira.
- **Drift warnings (no gotchas).** At affinity 25 / 20 / 15 an NPC sends an escalating BuddyPager/mail ("you around? …guess not"), owned by PKG-15 (`life_drift_ping`, per-NPC, once each threshold).
- **Loyalty quests** are tagged **"Loyalty"** in the Journal: Jax `side_jax_sister`, byteme `side_byteme_snowday`, Mira `side_coffee_warm`, Corvid `side_corvid_backup`, Deadline `side_deadline_dog`. Completing one **shields** the NPC from the first-blood/mirror selectors regardless of affinity.

### 4.8 Minor cast (owned by PKG-00) — fate-bearing or recurring, previously undefined

| id | name | role | fates |
|---|---|---|---|
| `npc.grandma_ruth` | Ruth Alvarez | the neighbor of `side_grandma_pc` / `fac_hood_q1` | `well`, `spied_on` (dark Act III visit), `warned` (on the List) |
| `npc.uncle` | Uncle Danh | the MLM/Ponzi relative (`side_uncles_pyramid`) | `refunded`, `ruined`, `spared` |
| `npc.webmaster` | Cal Reeves | laid-off webmaster (`life_dotcom_layoff_wave`) | `hired`, `webmaster_dark` (fraud crew, returns Act III) |
| `npc.flamer` | "l33tKÎLLƏR" / Marcus Doyle | Act I forum flamer (`life_old_rival_returns`); the mirror **stranger** fallback | `helped`, `schadenfreude`, plus `mir.outcome` note if he is the mirror |
| `npc.list_activist` | Nadia Bell | a sympathetic stranger on the List (`main_a3_q5`) | `warned`, `detained`, `disappeared` |
| `npc.okoro`, `npc.northlink_wes` | see §4.3 | LSU / NorthLink ladder | see §4.3 |

---

## 5. TIMELINE & GATING

Acts are **progression-gated with a soft date floor.** `act` (var, starts 1) is **written only by the three gate triggers below.** Each gate is a **persistent `TriggerDef`** (`once:true`, checked hourly), NOT a one-shot check inside a quest's on-done effects (the old design fired once and never re-evaluated). Each trigger's `when` is the full gate condition; its `effects` are `{ var:'act', set:N }` **plus** the explicit `{ quest:'main_aN_q1_…', start:true }` that begins the next act's chain (nothing else starts those q1 quests).

### 5.1 Act gate triggers (owned as noted)

**`trig_act2_gate`** (PKG-01) — `once:true`, hourly.
`when:` `{ all:[ {var:'act',eq:1}, {flag:'a1.grandma_done'}, {day:true,gte:240}, {any:[ /* TWO-of, encoded as ≥2 satisfied via helper flags a1.gate_* set by their sources */ {flag:'a1.gate_pair'} ]} ] }`.
The "any TWO of" is precomputed into `a1.gate_pair` by a small PKG-01 trigger that counts satisfied roads: **(a)** any skill ≥ 25, **(b)** a legit job at level ≥ 2 **OR** `fac.loft ≥ 20`, **(c)** **`a1.two_side_done`** (completed **2 Act I side quests** — replaces the old auto-set `a1.bond_jax`, which q1/q3 set for free and so never gated), **(d)** `money ≥ 1500`. `a1.gate_pair` = (count ≥ 2).
`effects:` `[{var:'act',set:2},{quest:'main_a2_q1_the_offer',start:true},{flag:'a2.phase_iib'} … ]` — see note: q1 is Kroll's dinner and marks IIb; **IIa content (`main_a2_q0_*`, Dee's run, LSU, LAN) autoStarts on `act=2` before q1's own date window** so the comedy phase plays first (§6.B).

**`trig_act3_gate`** (PKG-03) — `once:true`, hourly.
`when:` `{ all:[ {var:'act',eq:2}, {var:'w.exposure',gte:6}, {any:[ {faction:'<any>',gte:50}, {all:[{day:true,gte:1600},{faction:'<any>',gte:35}]} ]}, {flag:'a2.first_raid_resolved'}, {flag:'a2.mom_crisis_resolved'}, {flag:'a2.hinge_done'}, {day:true,gte:1200} ] }`. *(Thresholds raised to 6 to make side content matter — §5.4.)*
`effects:` `[{var:'act',set:3},{quest:'main_a3_q1_the_law_begins',start:true}]`.

**`trig_act4_gate`** (PKG-03) — `once:true`, hourly.
`when:` `{ all:[ {var:'act',eq:3}, {flag:'a3.heist_resolved'}, {var:'w.exposure',gte:12}, {flag:'a3.vote_resolved'}, {flag:'a3.oracle_revealed'}, {flag:'a3.mirror_revealed'}, {var:'a3.real_fates',gte:3}, {any:[ /* commitment: two poles */ {flag:'a3.committed'}, {all:[{day:true,gte:3300}]} ]}, {day:true,gte:2900} ] }`.
`a3.committed` is set by a PKG-03 trigger when **one faction ≥ 50 and another ≤ −20, OR two rival factions ≥ 50**. If the commitment test is **not** met by day 3300, the gate opens anyway and sets **`end.uncommitted`** (read only to pick E9's epilogue variant — §10). *(`a3.real_fates` replaces the auto-incrementing `a3.fates_locked`: it counts NPCs whose **fate ≠ default** among a fixed watch list, so it reflects real consequences, not beats seen.)*
`effects:` `[{var:'act',set:4},{quest:'main_a4_q1_reckonings',start:true}]`.

### 5.2 Real-time budget (resolves the "does it hit 8–15h?" review)

At **8 s/day** (1×), the date floors alone are: Act I 0–240 = 32 min; Act II 240–1200 = 2.1 h; Act III 1200–2900 = 3.8 h; Act IV **2900–3400** = 1.1 h (floor lowered from 4000). **Minimum at 1× ≈ 7.1 h; typical build reaches each gate ~10–30% past its floor → ~9–13 h at 1×.** The **speed governor** (§5.3) prevents the "just hold 5× through dead air" collapse that made length depend only on impatience.

| Act | Game-day span (floor) | Real-time @1× | @2× | Player level band |
|---|---|---|---|---|
| I | 0 → 240 | 32 min | 16 min | 1–2 skills 20–30; cred 0–15 |
| II (IIa+IIb) | 240 → 1200 | 2.1 h | 1.1 h | 2–3 skills 30–50; cred 20–45; job dev-L3 or faction step 2 |
| III | 1200 → 2900 | 3.8 h | 1.9 h | 3–4 skills 45–70; cred 40–70 |
| IV | 2900 → 3400 | 1.1 h | 0.6 h | aging-adjusted (>27) |
| **Total (floors)** | | **~7.6 h** | **~3.9 h** | typical +10–30% → **9–13 h @1×** |

**Aging note (Act IV feel):** past age 27 (`AGING_START`) skill ceilings and energy floors drift down (engine `endOfDayLife`), so Act IV plays differently. A poorly-maintained `fitness` locks out the **physical** copper route of `main_a4_q3b`, leaving the **remote** route (always available).

### 5.3 Speed governor & timed-content rules (PKG-00 / engine hook)

- 5× is offered only while **no** quest with an active `timeLimitDays` stage and **no** critical (main) dialog is pending. When a story mail/dialog arrives, the engine **auto-pauses** (existing `autoPauseDialogs`) and **restores at ≤2×**.
- Timed story stages set **`sys.no_raids`** for their duration (so a raid can't eat the window) and count down **only while the tab is visible**; the clock **pauses during open dialogs**. A **countdown chip** shows on the Journal icon. No offline decay for story timers.
- While **jailed**, timed main-quest stages are **paused** (an engine hook extends `timeLimitDays` by days spent in custody), so jail can't silently time out the List or Mom.

### 5.4 Intended beat calendar (so side content matters & there's no dead air)

Each main quest has a **`wait` first stage** `{ day:true, gte:X }` (or a `minDaysAfterPrev` stamped-var gate), so beats with dates land near their dates instead of in the first weeks. Between beats, `trig_director` (§9) pulls a weighted side/life beat if ~45 days pass with no main/faction/side beat. **`w.exposure` is worth earning:** unconditional main beats **no longer auto-grant exposure** (only investigate/refuse/breadcrumb choices do), so reaching `≥6` (Act II→III) and `≥12` (Act III→IV) genuinely requires side content; §12.7 lists every exposure source.

| Act/phase | Beat | Earliest (game day) |
|---|---|---|
| I | q1 boot | 0 |
| I | q2 first money | 3 |
| I | q4 rivalry | 30 |
| I | q5 dad's layoff | 60 (auto: `act=1 & day≥60 & seen a1_mira_dunk`) |
| I | q6 grandma job | 90 (auto: `a1.dad_laid_off & day≥90`) |
| IIa | q0a Dee's run / LSU / LAN pool opens | act=2 |
| IIa | mirror identity lock | ~day 500 (`main_a2_q1a`) |
| IIb | q1 Kroll dinner | ≥ day 700 |
| IIb | q2 Priya | q1 +90 |
| IIb | q3 Jax 3am | q2 +120 |
| IIb | q4 Mom's illness | ≥ day 1000 ("mid") |
| IIb | q5 first raid | q4 +120 **OR** `sys.raided`/exposure trigger (§6.B) |
| IIb | q6 Mira wall | q5 +60 |
| IIb | q7 hinge | ≥ day 1100 |
| III | q1..q8 | spaced +120–200 each, floors in §6.C |
| IV | q1..q4 + finales | spaced; day-3400 soft floor on `main_a4_q4` |

### 5.5 Chapter Progress meta-quest (per act, PKG-00)

A journal meta-quest **"Chapter Progress"** lists each gate condition as an objective with a **progress bar** (e.g. "Loft rep 38/50") and **one hint per alternative road**. It never completes by itself; it mirrors the gate trigger. For Act III it states the **bypass**: "If you never picked a side, the fog takes you (day 3300)." Every objective in §6 carries a `hint` (CI-enforced).

---

## 6. MAIN QUEST

Notation: **CHOICE POINT [id]** blocks list options with effects. Skill checks `[skill DC n]` roll `d20 + floor(skill/4) + situational` vs DC. Terminal-minigame missions are marked **⌨ TERMINAL** with their **auto-resolve fallback** (one primary skill). **Every failure branch is authored content** (CI-enforced). All effect verbs are the §0 canonical set; all ids are full ids.

**Reactivity rules (apply to every main CHOICE POINT — resolves the D&D-reactivity review):**
- Each main CP offers **≥1 option unlocked by an earlier flag/item** and **≥1 greyed teaser** naming its requirement (`req` + `reqText`).
- Each main CP offers **≥2 skill routes to the same outcome** where a check gates progress (so programmer/network builds aren't shut out; § skill-distribution). Combined checks use **one best-fit skill + a shown `bonuses` term**, never averaging.
- Consequences are visible: rep changes log with a cause; hidden changes surface later as a forum rumor / BuddyPager (PKG-18).

**Portable-evidence & counter conventions (used throughout):**
- **Evidence is earnable multiple ways (resolves the single-shot-item review).** The derived flag **`end.has_evidence`** (maintained by `trig_evidence`, PKG-04) = `item.kroll_recording` OR `a3.ghost_protocol` OR (`item.aperture_sample` AND `item.priya_proof`) OR (`var evidence_fragments ≥ 3`). Fragments come from `side_overdue`, `side_uncles_pyramid`, `fac_halcyon_q3` dig, `fac_aperture_q2` skim, `side_the_other_you`, and `npc.okoro` `ally`; three fragments equal a sample. This exact definition is used verbatim in §5, CP-C3, CP-D1, and E1.
- `item.aperture_sample` — granted at CP-A2 B; **also handed back in Act II by Corvid if `npc.corvid.trusts`** (so CP-A2 A isn't a dead end for evidence).
- `item.kroll_recording` — granted at CP-B5 E (`[Cryptography DC 17]`); **retryable** at Kroll's Act III dinner (`fac_aperture` beat) at a higher DC; also obtainable via `fac_aperture_q2` skim or a `[Social]` wire at the Hospital Job.
- `item.priya_proof` — granted at CP-C1 A and CP-C1 D-success; **removed** at CP-C1 C (you sold it).
- `w.exposure += N` — breadcrumbs (gate metric; **only** on investigate/refuse/breadcrumb choices).
- `w.enclosure += N` — complicity (darkness dial; cap raised to 10 with thresholds 2/4/6/8, §11).
- **Evidence Corkboard:** the Quest Journal shows a "Corkboard" of held evidence/fragments so the player can see `end.has_evidence` status.

### 6.A ACT I — "The Whir of the Modem"

Tone: comedy, discovery, tiny stakes. The conspiracy appears exactly once, as a "huh, weird" inside a joke.

#### `main_a1_q1_boot_sequence`
**Summary.** Sept 2001. Your beige box, your 33.6k modem, Mom yelling to get off the phone. Jax pages you about a leaked shareware crack. Tutorial: schedule a day, watch time flow, gain first XP. First `*hugz*` from **an anonymous forum handle dunking on you** (revealed later as Mira, so this pre-dates her being "met"). First connection to the Loft board.
**Stages.** `intro` → `first_forum` → `tutorial_schedule` → `done`.
**Objectives.** (`intro`) read Jax's page [`when: {seen:'a1_boot_forum'}`; hint: "Open the BuddyPager."]; (`first_forum`) make your first forum post [choice below; hint: "Open the Forum window and reply."]; (`tutorial_schedule`) paint a schedule and advance one day [`when:{day:true,gte:1}`; hint: "Drag activities onto the hour grid; press play to let time flow."].
**Key scene `a1_boot_forum` (forum→dialog).**
**CHOICE POINT [CP-A0] First words on the forum.**
- **A. Lurk and read.** → `{flag:'a1.cautious'}`; opsec framing; Loft neutral.
- **B. Introduce yourself honestly.** → `{faction:'fac.loft',add:5}`, `{flag:'a1.known_newbie'}`. Corvid notices.
- **C. Post something you don't understand to look cool.** → `{faction:'fac.loft',add:-5}`, `{flag:'a1.posted_cringe'}`; Jax laughs (comedy, running gag); later a one-time `[Social]` bonus for owning it.
**Effects on done.** `{npc:'jax',met:true,affinity:5}`, `{npc:'mira',met:true}` **at the dunk** (so `mira.met` is true before q4; the *handle* stays anonymous in text), `{quest:'main_a1_q2_first_money',start:true}`.
**News.** none. **World.** none.

#### `main_a1_q2_first_money`
**Summary.** Two non-exclusive doors to first income.
**Stages.** `choose` → (`legit` and/or `scene`) → `done`.
**Objective.** hold `money ≥ 200` after any gig [`when:{stat:'money',gte:200}`; hint: "Take a CompCastle shift or a Loft contract."].
**Door A — Legit (`a1_compcastle`).** CompCastle hires you as bench tech under Dee (`npc.dee`; `{npc:'dee',met:true,affinity:3}`). Comedy quests: "the internet is broken" (monitor unplugged), "Press Any Key". Sets job `job_compcastle_bench` available; on hire `{flag:'a1.job_started'}`, `{faction:'fac.halcyon',add:5}`. **Dee's council gag is planted here.**
**Door B — Scene (`contract.a1_crack_starter`).** Corvid posts a starter contract: crack a game's copy protection. Low heat, low pay, big cred. `[Programming DC 14]` (⌨ optional via `mission.a1_library`-style trivial mission — but this contract's own auto is the check). **Fail branch:** you brick it; a forum elder mocks you (`{faction:'fac.loft',add:-3}`) **but Jax covers for you** (`{npc:'jax',affinity:8}`, `{flag:'a1.jax_covered_you'}`). Success: `{faction:'fac.loft',add:10}`, `{stat:'cred',add:6}`, `{stat:'heat',add:3}`. **New flag `a1.sold_tool`** is set if you sell/lend the cracked tool onward (feeds `side_wire_you_planted`).
**Effects on done.** `{quest:'main_a1_q3_back_room',start:true}`.

#### `main_a1_q3_back_room`
**Summary.** Jax drags you to the Sodium Row back room. Meet Corvid, Deadline (drunk, ominous), byteme (worshipful), Switch (pragmatic), and glimpse the "nyx" handle from the forum. Establish the ethic: "we don't rat."
**Objectives.** attend the meet [`when:{seen:'a1_back_room'}`; hint: "Sodium Row, after dark."]; choose a first impression.
**Key scene `a1_back_room` (dialog).** Small choice: side with Corvid's ethic (`{faction:'fac.loft',add:5}`, `{npc:'corvid',affinity:5}`) / side with Switch's pragmatism (`{npc:'switch',affinity:8}`, `{flag:'npc.switch.courted'}`) / stay neutral (`{flag:'a1.diplomat'}`).
**Effects.** `{npc:'corvid',met:true}`, `{npc:'deadline',met:true}`, `{npc:'byteme',met:true}`, `{npc:'switch',met:true}`, `{quest:'main_a1_q4_rivalry',start:true}`. **`a1.bond_jax` is set here only if `{npc:'jax',affinityGte:20}`** (so it means something; no longer an auto-gate input).

#### `main_a1_q4_rivalry`
**Summary.** Mira (the "nyx" handle) solves a board challenge you were working on, publicly, faster — and you learn who she is.
**Trigger.** `autoStart:{ all:[{var:'act',eq:1},{day:true,gte:30},{quest:'main_a1_q3_back_room',status:'completed'}] }`.
**Key scene `a1_mira_dunk` (forum→dialog).**
**CHOICE POINT [CP-A1] The public dunk.**
- **A. "GG, teach me that source-read trick."** → `{faction:'fac.loft',add:3}`, `{npc:'mira',affinity:6}`, `{flag:'npc.mira.respect'}`; opens the collaboration track.
- **B. "Lucky read. Race you on the next one."** → `{flag:'npc.mira.rivalry'}`, `{npc:'mira',affinity:2}`; competitive track (feeds `rival` via `npc.mira.betrayed`, never by rivalry alone).
- **C. `[Social DC 12]` "You transferred from Ridgeport. I heard why you left."** → **success:** `{flag:'npc.mira.secret_hinted'}`, `{npc:'mira',affinity:3}`; **fail:** `{faction:'fac.loft',add:-5}`, `{stat:'mood',add:-10}`, `{npc:'mira',affinity:-5}`.
**Effects.** `seen a1_mira_dunk` (read by q5 autoStart). **q4 does NOT start q5** (q5 has its own dated autoStart — resolves the dead-code bug).

#### `main_a1_q5_dads_layoff`
**Summary.** ~Nov 2001: the paper mill sheds jobs; Dad is laid off. Money pressure begins. Plants that **the mill will become the datacenter.** Dad is left at **`normal`** (no premature `spiral`).
**Trigger.** `autoStart:{ all:[{var:'act',eq:1},{day:true,gte:60},{seen:'a1_mira_dunk'}] }`.
**Effects.** `{news:'news.mill_layoffs'}` (the headline's rider sets `w.mill_open=0` — story effect does **not** duplicate it), `{flag:'a1.dad_laid_off'}`, `{stat:'stress',add:8}`, `{quest:'side_y2k_leftovers',start:false}` (that side quest gates on `a1.dad_laid_off`, §8). **q5 starts q6:** `{quest:'main_a1_q6_grandma_job',start:true}` — **and q6 also carries its own** `autoStart:{ all:[{flag:'a1.dad_laid_off'},{day:true,gte:90}] }` as a belt-and-suspenders start.

#### `main_a1_q6_grandma_job` — **Act I climax**
**Summary.** Ruth Alvarez's PC (`npc.grandma_ruth`, Neighborhood) is infected; fixing it (warm comedy — "you've won a prize" malware) you find it's part of a botnet phoning home to *Aperture's* address range. First thread of the conspiracy, played as "huh, weird." **Seeds the recurring `side_grandma_pc` gag.**
**Trigger.** `autoStart:{ all:[{flag:'a1.dad_laid_off'},{day:true,gte:90}] }` (also started by q5).
**Stages.** `fix_it` → `discovery` → `choice` → `done`.
**Objectives.** clean the malware (`[Hardware DC 10]` **OR** `[Systems DC 10]`, auto-success with a laugh if failed — comedy, no dead end; hint: "Either route works — it's a home PC."); notice the phone-home [`when:{seen:'a1_grandma_discovery'}`].
**Key scene `a1_grandma_discovery` (dialog).**
**CHOICE POINT [CP-A2] The Grandma Job discovery.**
- **A. Tell Corvid everything.** → `{faction:'fac.loft',add:8}`, `{flag:'npc.corvid.trusts'}`, `{npc:'corvid',affinity:5}`; Corvid feeds you real leads and **hands back a sample copy in Act II** (so you can still get `item.aperture_sample` later). `{var:'w.exposure',add:1}`.
- **B. Clean it, say nothing, keep the sample.** → `{item:'aperture_sample'}` (category `misc`, `hidden:true`, `unique:true` — raid-safe, §12.8), `{flag:'a1.hoarder'}`. `{var:'w.exposure',add:1}`.
- **C. Report it to NorthLink's abuse line.** → `{faction:'fac.halcyon',add:5}`, `{news:'news.aperture_alerted'}` (the **headline's rider** sets `w.aperture_alerted=1` and adds the +0.10 heatGain — story effect does **not** duplicate it), `{var:'w.exposure',add:1}`.
**Effects on done.** `{flag:'a1.grandma_done'}`, `{quest:'side_grandma_pc',start:true}`. **No gate check here** — `trig_act2_gate` (§5.1) evaluates continuously.

**⌨ TERMINAL (optional, Act I): `mission.a1_library` "The Library Card."** Clear byteme's late-fee record at LSU. Trivial; teaches the terminal UI. **Auto-resolve:** `[Intrusion DC 8]`. Reward: `{npc:'byteme',affinity:6}`, `{stat:'cred',add:3}`, tiny heat. Fail: harmless. *(Registered in PKG-17.)*

### 6.B ACT II — "Everyone's Getting Paid" (IIa comedy → IIb dark turn)

Tone: IIa is dramedy (Kroll has not called); IIb tightens. `w.itSalary`/`w.contractPay` rise across the act via `news.dotcom_recovery` (the **headline** owns the delta). **On `act=2`, the IIa pool opens; Kroll's dinner (`main_a2_q1`) waits for day ≥ 700 so the light phase lands first.**

#### IIa comedy phase (autoStart on `act=2`; no dark content)
Not numbered main beats but the phase spine (owned PKG-02, drawing on §7/§8):
- **`main_a2_q0a_settling_in`** — moving out (dorm or rented room), the first apartment party, LSU entrance-exam option (§7.6), Dee's layoff-then-rehire (`life_dotcom_layoff_wave` + `fac_halcyon_q1`). Sets `{npc:'dee',...}` timeline in order.
- **`side_dee_for_council`** (IIa; §8) — build Dee's GeoCities-style site, run a phone bank → `{flag:'npc.dee.council'}` if you campaigned; comedy that pays off at the vote.
- **`main_a2_q1a_mirror_lock`** (~day 500) — locks `mir.identity` (§4.5) so IIb clues are identity-specific. No confrontation yet.
- Oracle drops 1–2 (PKG-02): after CP-B1 and on `w.exposure ≥ 2`, setting `a2.oracle_contact`.

#### `main_a2_q1_the_offer` — Aperture enters (start of IIb)
**Summary.** Vanessa Kroll pages you directly. Dinner at Harbor Point. A "consulting" gig: pull a marketing database from a competitor. Clean-looking, great money.
**Trigger.** `autoStart:{ all:[{var:'act',eq:2},{day:true,gte:700},{any:[{flag:'a1.hoarder'},{flag:'npc.corvid.trusts'},{contract:'contract.a1_crack_starter',status:'done'}]}] }`. On enter: `{flag:'a2.phase_iib'}` (tone flip; the handshake-motif inversion table, §6.E, keys off this).
**Key scene `a2_kroll_dinner` (dialog).** `{npc:'kroll',met:true}`, `{npc:'hollis',met:true}`.
**CHOICE POINT [CP-B1] Kroll's first contract.**
- **A. Take it, deliver clean.** → `{money:5000}`, `{faction:'fac.aperture',add:15}`, `{faction:'fac.loft',add:-6}` (Aperture-gain Loft cost), `{stat:'heat',add:10}`, `{flag:'fac.aperture.client'}`, `{var:'w.enclosure',add:1}`.
- **B. Take it, skim a copy for yourself/the Loft.** → `{money:5000}`, `{faction:'fac.aperture',add:15}`, `{faction:'fac.loft',add:2}`, `{flag:'fac.aperture.client'}`, `{flag:'a2.double_dealer'}` (**read in Act III** — a hostile Kroll aside at `a3_oracle`: Aperture −10 unless `item.kroll_recording`), `{var:'w.enclosure',add:1}`.
- **C. Refuse; tell Corvid Aperture is recruiting.** → `{faction:'fac.aperture',add:-10}`, `{faction:'fac.loft',add:12}`, `{flag:'a2.refused_kroll'}` (**read:** Kroll circles back at `fac_aperture_q2` with a better offer). `{var:'w.exposure',add:1}`.
- **D. `[Business DC 14]` OR `[Social DC 15]` Negotiate a retainer/equity.** → **success:** `{flag:'fac.aperture.retainer'}` (steady income buff), `{faction:'fac.aperture',add:20}`, `{money:5000}`; **fail:** she laughs, `{money:5000}`, `{flag:'fac.aperture.client'}`.
- **E. `req {item:'aperture_sample'}` "I know about the botnet."** *(teaser if not held; unlocked by the sample.)* → `{faction:'fac.aperture',add:10}`, `{flag:'npc.kroll.wary'}` (**read:** raises later Kroll DCs), and she raises the offer.
**Effects.** `{quest:'main_a2_q2_priya',start:true}` (with a +90d wait stage).

#### `main_a2_q2_priya` — mentor deepens
**Summary.** If you leaned legit, Priya gets you a Halcyon interview; if scene, she corners you at the Cathode. Either way she reveals she was scene once and *sold her silence* in '99.
**Interview gate (single, canonical):** `{ any:[ {faction:'fac.halcyon',gte:20}, {flag:'a1.job_started'}, {degree:true} ] }` → interview branch (`job_halcyon_junior` available on `[Business DC 12]` **OR** `[Programming DC 12]` OR degree/rep; on hire `{flag:'fac.halcyon.employed'}`). Else → intervention branch (`{npc:'priya',affinity:6}`, `{flag:'npc.priya.warned_you'}`). **Interview-check fail** is authored: you flub it, Dee (now office manager) slips you a second-chance temp gig (comic, no dead end).
**Effects.** `{npc:'priya',met:true,affinity:5}`, `{flag:'a2.priya_backstory'}`, `{quest:'main_a2_q3_jax_overreach',start:true}` (+120d wait).

#### `main_a2_q3_jax_overreach`
**Summary.** To help pay Rosa's bills, Jax takes an Aperture contract behind your back that's too hot. He calls you at 3am from the Cathode.
**Key scene `a2_jax_3am` (dialog).**
**CHOICE POINT [CP-B2] Jax in over his head.**
- **A. Take it over / finish it for him.** → `{stat:'heat',add:20}`, `{npc:'jax',affinity:20}`, `{flag:'npc.jax.protected'}`, `{npc:'rosa',fate:'treated'}` (his motivation resolves).
- **B. Talk him into aborting, eat the loss.** → `{npc:'rosa',fate:'worsens'}`, `{flag:'npc.jax.aborted'}`, `{npc:'jax',affinity:-4}`.
- **C. `[Social DC 15]` OR `[Programming DC 15]` Feed the client a convincing partial.** → **success:** `{flag:'npc.jax.covered'}`, `{faction:'fac.aperture',add:5}`; **fail:** client spooked, `{stat:'heat',add:15}`, `{flag:'npc.jax.exposed'}`, `{npc:'jax',affinity:4}`.
- **D. Let him handle it (do nothing).** → `{flag:'npc.jax.alone'}`.
**Effects.** `{quest:'main_a2_q4_moms_illness',start:true}` (autoStart also `{day:true,gte:1000}` — "mid Act II").

#### `main_a2_q4_moms_illness` — **major life-sim fork**
**Summary.** Linh collapses; the bills are enormous. **Grace (`npc.grace`) is introduced here** at Harbor Point General (`scene.a2_mom_bills` on-enter: `{npc:'grace',met:true}`). **PARALLAX cross-link:** if `w.aperture_state='thriving'` and `w.enclosure ≥ 2`, insurance option B becomes **advance-only** with its insurance line greyed, `reqText:"Denied by risk score"` (`{news:'news.insurers_riskscore'}`).
**Bill scaling (balanceable):** `bill = max($4000 floor, 60% of current net worth)` — always hurts. **`timeLimitDays:45`**, an **auto-pause dialog** on start, reminder mails at 30/14/3 days (PKG-02). An AFK/5× player is protected by the speed governor (§5.3).
**Key scene `a2_mom_bills` (dialog).**
**On-enter branch:** if `{faction:'fac.hood',lte:-20}` → `{npc:'mom',fate:'estranged'}` path variant.
**CHOICE POINT [CP-B3] Mom's medical bills.**
- **A. Fastest Aperture job.** → `{money:+bill}`, `{faction:'fac.aperture',add:15}`, `{stat:'heat',add:25}`, `{flag:'life.sold_out_for_mom'}`, `{npc:'mom',fate:'recovered_dark'}`, `{var:'w.enclosure',add:1}`.
- **B. Halcyon/Priya advance / insurance.** *(req `{all:[{flag:'fac.halcyon.employed'},{faction:'fac.halcyon',gte:50}]}`; else greyed, `reqText:"Requires: Halcyon employment with benefits"`; if PARALLAX denial active, **insurance sub-line greyed** `"Denied by risk score"` and the option becomes "advance only")* → `{faction:'fac.halcyon',add:5}`, `{flag:'npc.priya.debt'}`, `{npc:'mom',fate:'healthy'}`.
- **C. Crowd the Row.** *(req `{faction:'fac.hood',gte:20}`)* → `{faction:'fac.hood',add:20}`, `{money:+partial}`, `{flag:'life.hood_carried_you'}`, `{npc:'mom',fate:'healthy'}`, `{news:'news.mom_fundraiser'}`. **The +1 to `w.hood_soul` is owned by the news rider only** (fac_hood_q3 folds into this — no triple count).
- **D. Bank job early (reckless).** → `[Intrusion DC 18]` (⌨ or auto). **success:** `{money:+lots}`, `{stat:'heat',add:40}`, `{flag:'a2.early_bank_job'}`, `{flag:'life.dirty_bank_money'}`, `{var:'w.exposure',add:1}`, `{npc:'mom',fate:'healthy'}`; **fail:** a **"heat bloom" scene** (Reyes flags you hard, `{stat:'heat',add:30}`) — **A, C, and F stay open**; failure is not death.
- **E. Can't/won't pay (timeout, or chosen).** → applies the failed-crisis path: `{flag:'life.mom_crisis_failed'}`, `{npc:'mom',fate:'passed'}`, `{var:'w.mom_gone',set:1}`, `{stat:'stress',add:20}` (buff), grief arc unlocked.
- **F. Pay from savings, or take a loan.** *(always available)* → if you can cover `bill`: `{money:-bill}`, `{npc:'mom',fate:'healthy'}`. Else a **loan**: sets `{var:'life.extraUpkeep',add:X}` (monthly payments) + a stress buff, `{npc:'mom',fate:'healthy'}`. The frugal/legit fork the review asked for.
**Effects on any resolution.** `{flag:'a2.mom_crisis_resolved'}`, `{quest:'main_a2_q5_first_raid',start:true}` (with the trigger below).

#### `main_a2_q5_first_raid` — first raid / **first blood by neglect**
**Summary.** PD Cyber (Calderon) or the Bureau (Reyes observing) raids. **Target computed from flags/neglect** so clean players still get the beat, and it **cannot soft-lock.**
**Robust start trigger (`trig_first_raid`, PKG-02, once).** Fires q5 when **`sys.raided`** (an engine raid happened — routed into the story) **OR** `{stat:'heat',gte:40}` **OR** any exposed associate (`npc.jax.exposed`/`.alone`, `npc.byteme.used`, `fac.aperture.client` with heat) **OR** as a **date fallback** `{day:true,gte:<q4-end+150>}`. Until it resolves, `{flag:'sys.no_raids'}` is set at Act II start and **cleared** when this trigger fires, so the *first* raid is always the authored one (no Act I/early engine raid pre-empts it; resolves the engine-raid-before-story-raid hole). **Met:** if the Bureau is present, `{npc:'reyes',met:true}`, `{npc:'calderon',met:true}`.
**Exposure score (replaces "associate's heat"; NPCs have no heat stat).** `expo(npc)` = sum of that NPC's exposure flags (`.exposed`+1, `.alone`+1, `.used`+1, `npc.<id>.exposure` var). 
**Target selector (`a2.raid_target`, str).** Priority: (1) `sys.raided` OR `{stat:'heat',gte:40}` → player; (2) else the `available()` associate in `{jax, byteme, corvid}` with highest `expo` then lowest affinity; (3) **if none exposed → Corvid** (the Loft board gets raided) so a clean player still gets a Solidarity/Sauve-qui-peut scene.
**Key scene `a2_the_raid` (dialog).**
**CHOICE POINT [CP-B4] The first raid — your response** *(a branch per selector output; each has success+fail):*
- **Player at your door:** **Wipe & stonewall `[Opsec DC 16]` OR `[Systems DC 16]`** → **success:** `{flag:'a2.clean_raid'}`, `{faction:'fac.loft',add:15}`; **fail:** `{raid:true}`, `{flag:'fac.bureau.on_radar'}`, `{jail:3}`. *(Greyed teaser: `req {flag:'life.family_shield'}` "Mom lies to the men in jackets" → auto-success — a payoff for `life_family_finds_gear`.)*
- **Jax (`alone` or `exposed`):** **Rush to take the fall** → `{flag:'a2.took_jax_fall'}`, `{jail:10}`, `{faction:'fac.loft',add:25}`, `{npc:'jax',fate:'free',affinity:30}`. **Or let him face it** → `{npc:'jax',fate:'arrested'}`, `{npc:'jax',affinity:-10}`.
- **byteme:** **Lawyer him up (`money`)** → `{npc:'byteme',fate:'pro'-track}` safe / **Scare him silent `[Social DC 14]`** (success safe; fail → `{npc:'byteme',fate:'arrested_young'}`) / **Take the fall** (`{jail:10}`, byteme safe) / **Let his mom find out** → `{npc:'byteme',fate:'arrested_young'}`. **Never `dead` in Act II.**
- **Corvid:** **Organize the '94 solidarity wipe `[Social DC 14]`** → **success:** `{faction:'fac.loft',add:30}`, `{flag:'a2.solidarity'}` (this **clears Corvid's `charged` track** so she stays `free`); **fail:** `{flag:'npc.corvid.charged'}` (a **flag**, not fate — decided at `fac_loft_q5`), `{flag:'a2.informant_seed'}`.
- **CP-B4 fail (any raid confiscation path):** `{raid:true}`, `{flag:'fac.bureau.on_radar'}`, `{jail:3}` — routes into `scene.a2_jail` (below), which now offers the **flip branch**.
**First blood (`a2.first_blood`).** Limited to explicit `{npc, fate}` per §4: Jax→`arrested`, byteme→`arrested_young`, Corvid→flag `npc.corvid.charged`. No "moves toward"; no `dead` in Act II. (First-blood and the mirror use **separate** selectors — the "same selector" claim is deleted.)
**Jail content (`scene.a2_jail`, if jailed).** Recruit a cellmate `[Social]` (future contact), smuggle a message, or take a beating (`health` unless `cred`/`money` prevents it). **Reyes-visit node (new): flip → `{flag:'fac.bureau.informant'}`, `{flag:'a2.spine',set:'bureau'}`, starts `fac_bureau_q1` by its post-raid entry.** Jail timers are paused for other main quests (§5.3).
**Effects.** `{flag:'a2.first_raid_resolved'}`, `{news:'news.first_raid_public'}`, `{var:'w.exposure',add:1}`, `{quest:'main_a2_q6_mira_wall',start:true}` (+60d wait).

**`trig_bureau_flip_offer`** (PKG-07, recurring, act ≥ 2): `when:{ all:[{flag:'sys.raided'},{not:{flag:'fac.bureau.informant'}},{var:'act',gte:2}] }` → offers `fac_bureau_q1` by its alternative "post-raid flip" entry (the "arrest opens a branch" pillar, authored).

#### `main_a2_q6_mira_wall`
**Summary.** Mira's Ridgeport past surfaces. Romance can bloom or curdle. **Stress widens failure variance** on this Social check.
**Key scene `a2_mira_wall` (dialog).** `[Social DC 15]` (bonus if `npc.mira.secret_hinted`; penalty scaling with `stress` via `bonuses`). **Success:** `{npc:'mira',affinity:15,romance:'flirting'}`, `{flag:'npc.mira.trusts'}`. **Fail:** `{npc:'mira',affinity:-6}` toward `gone`. *(`npc.mira.trusts` is now read in CP-C2 as an unlock: "Mira, it's me.")*
**Effects.** `{quest:'main_a2_q7_meridian_test',start:true}` (autoStart also `{day:true,gte:1100}`).

#### `main_a2_q7_meridian_test` — **Act II hinge**
**Summary.** Kroll offers a *dry run* (recon) on Meridian's new online banking; Reyes makes first contact and offers a way out. **Sets your Act III spine (`a2.spine`, str).**
**Key scene `a2_hinge` (dialog).**
**CHOICE POINT [CP-B5] The Meridian test / Reyes's offer.**
- **A. Recon for Kroll, hide it from Reyes.** → `{faction:'fac.aperture',add:20}`, `{flag:'a2.meridian_recon'}`, `{flag:'a2.spine',set:'aperture'}`, `{var:'w.enclosure',add:1}`.
- **B. Take Reyes's deal; feed her Aperture.** → `{faction:'fac.bureau',add:20}`, `{faction:'fac.aperture',add:-30}`, `{faction:'fac.loft',add:-6}` (Bureau-gain Loft cost, authored & logged), `{flag:'fac.bureau.informant'}`, `{flag:'a2.spine',set:'bureau'}`, `{flag:'fac.bureau.informant_secret'}`.
- **C. Take the deal but double-cross to protect the Loft.** → `{flag:'a2.double_agent'}`, `{faction:'fac.bureau',add:10}`, `{faction:'fac.loft',add:10}`, `{flag:'a2.spine',set:'double'}`, `{var:'end.doubles',add:1}` (see E-SECRET, §10).
- **D. Refuse both; commit to Halcyon/Priya.** → `{faction:'fac.halcyon',add:25}`, `{flag:'a2.went_straight'}`, `{flag:'a2.spine',set:'halcyon'}`.
- **F. `req {faction:'fac.loft',gte:20}` Refuse both; bring it to Corvid, go dark with the Loft.** *(the Loft spine, resolves the missing purest-scene road)* → `{faction:'fac.loft',add:20}`, `{faction:'fac.bureau',add:-10}`, `{faction:'fac.aperture',add:-10}`, `{flag:'a2.spine',set:'loft'}`, unlocks `fac_loft_q5` early. Greyed teaser if Loft < 20.
- **E. `[Cryptography DC 17]` Wire yourself, record Kroll's ask.** *(combinable with A–D/F)* → **success:** `{item:'kroll_recording'}` (misc, hidden, unique); **fail:** `{flag:'npc.kroll.wary'}` (retryable at Kroll's Act III dinner, higher DC).
- **Fallback:** if CP-B5 resolves without any A–F spine (edge case), a PKG-02 trigger sets `a2.spine` to the **dominant faction**.
**⌨ TERMINAL: `mission.a2_meridian_recon`.** Auto-resolve: `[Intrusion DC 15]`. Failure raises heat, not game over (`{stat:'heat',add:15}`, `{flag:'a2.recon_sloppy'}` — **read** in Act III as a +1 DC on the heist).
**Effects on done.** `{flag:'a2.hinge_done'}`, `{var:'w.exposure',add:1}`. **No gate check here** — `trig_act3_gate` runs continuously.

**`trig_bureau_office`** (PKG-16, Act II start, once): publishes `news.bureau_office` on `{var:'act',eq:2}` (not "first contact," which is later — resolves the news-timing bug).

### 6.C ACT III — "Signal Intelligence"

Tone: techno-thriller with a comedy beat every ~60 days (`trig_director` pulls grandma visits, Dee-on-the-council, the toaster man, Dad's dating profile). Each main quest has a wait stage; floors below.

**`trig_datacenter_open`** (PKG-15, Act III start, once): `{var:'w.datacenter_open',set:1}` + `{news:'news.mill_datacenter'}`. `life_dads_resume` gates on `w.datacenter_open` (moves Dad's datacenter hiring to Act III where it belongs).
**`trig_heat_lifetime`** (PKG-16, daily): `{var:'w.heat_lifetime',add:<today's heat/…>}` — a real counter the vote reads (there was no "lifetime heat" var).

#### `main_a3_q1_the_law_begins`
**Summary.** The council takes up the **Municipal Network Security Act (MNSA)**. This quest introduces it and starts moving `w.public_opinion`.
**Effects.** `{news:'news.mnsa_introduced'}`, `{flag:'a3.mnsa_live'}`, `{var:'w.public_opinion',add:<heat-seed>}` — **sign convention pinned:** `w.public_opinion` **positive = anti-surveillance**; loudness (heat) **subtracts** (loud players make passage more likely). This quest **only adds** to it (it does not "initialize"/set — resolves the add-only ownership conflict). `{quest:'main_a3_q2_oracle_reveal',start:true}`. *(No auto exposure — exposure comes from side breadcrumbs; §5.4.)*

#### `main_a3_q2_oracle_reveal` — the tiered truth
**Summary.** The Oracle (identity resolved here, §4.5) delivers the conspiracy's shape in **evidence-gated tiers.** **`a2.double_dealer` payoff:** if set and no `item.kroll_recording`, a hostile Kroll aside costs `{faction:'fac.aperture',add:-10}`.
**Reveal tiers (`a3_oracle`):**
- **Tier 1 (always):** Aperture launders breaches → PARALLAX → insurers; NorthLink carries it; the Bureau rents it; Halcyon money launders the optics. Sets `{flag:'a3.truth_t1'}`.
- **Tier 2 (req `{all:[{item:'aperture_sample'},{any:[{item:'kroll_recording'},{flag:'a2.building_a_case'}]}]}`):** "Special Accounts" is **a seat, not a person.** Sets `{flag:'a3.truth_t2'}`. *(Fixed: uses `a2.building_a_case`, which is now actually read; `npc.priya.debt` was a Halcyon advance, not evidence, and is dropped from this gate.)*
- **Tier 3 (req `{all:[{var:'w.enclosure',gte:4},{var:'end.doubles'? no — } {flag:'a3.own_branches'}]}`):** PARALLAX has been profiling the *ideal next head of Special Accounts* — **your own dossier.** Sets `{flag:'a3.truth_t3'}`, `{flag:'npc.kroll.wants_you'}`. (`a3.own_branches` is set by a PKG-03 trigger when `w.enclosure ≥ 4` — a concrete condition replacing "most sell/own branches taken.")
**Effects.** `{flag:'a3.oracle_revealed'}`, resolve `npc.oracle.is_*` by dominant faction (dead/arrested excluded), `{var:'w.exposure',add:2}` (this is a real investigative beat — exposure justified), `{quest:'main_a3_q3_priya_dilemma',start:true}`.

#### `main_a3_q3_priya_dilemma`
**Key scene `a3_priya` (dialog).**
**CHOICE POINT [CP-C1] Priya's dilemma.**
- **A. Help her blow the whistle.** → `{flag:'a3.whistleblow_prepped'}`, `{item:'priya_proof'}`, `{faction:'fac.halcyon',add:-40}`, `{faction:'fac.bureau',add:15}`, `{npc:'priya',...}` martyr-track, `{news:'news.halcyon_crash'}` (headline owns the `w.halcyon_state='wobble'` rider), `{var:'w.exposure',add:2}`.
- **B. Talk her down.** → `{flag:'npc.priya.silenced'}`, `{faction:'fac.halcyon',add:10}`, complicit-track.
- **C. Sell her proof to Kroll.** → `{money:+huge}`, `{faction:'fac.aperture',add:30}`, `{item:'priya_proof',remove:true}`, `{npc:'priya',...}` broken-track, `{var:'w.enclosure',add:1}`.
- **D. `[Business DC 18]` OR `[Social DC 18]` Force Vale to clean house.** → **success:** `{flag:'npc.vale.reformed'}`, `{news:'news.halcyon_clean'}` (owns the `w.halcyon_state='clean'` rider), `{item:'priya_proof'}`, `{faction:'fac.halcyon',add:20}`; **fail:** Vale tips Kroll, `{flag:'a3.kroll_hunts_priya'}`, Priya toward `broken`.
- **E. `req {flag:'a3.mnsa_live'}` "Take the fall for her."** → `{flag:'npc.priya.you_covered'}`, `{item:'priya_proof'}`, you eat the heat so her name stays clean (feeds Priya `saved`; E1 variant).
**Effects.** watch-list fate now real → contributes to `a3.real_fates`; `{quest:'main_a3_q4_the_wire',start:true}`.

#### `main_a3_q4_the_wire` — split: the wire AND the mirror
**Summary.** Someone wears a wire for the Bureau; the anonymous rival `mirror` (locked in IIa, §4.5) is confronted. **These are two nodes** — merged into one confrontation **only when `mir.identity == a3.wire_wearer`.**
**`a3.wire_wearer` (str), explicit priority jax > mira > byteme:** `jax` if `npc.jax.flipped`; else `mira` if `npc.mira.betrayed`; else `byteme` if `npc.byteme.used`; else **`none`** → the wire is `mir.identity` radicalized and Bureau-turned (so there is always a wire target; `mir.identity` never `gone`/dead by the `available()` filter).
**Node 1 — the wire (`a3_wire`):**
**CHOICE POINT [CP-C2a] The wire.**
- **A. `[Opsec DC 16]` OR `[Networking DC 16]` Sweep the spot / sniff the uplink.** → **success:** you know who; **fail:** you talk freely, `{flag:'a3.incriminated'}` (**read** in CP-D1 as +2 DC and a Bureau leverage option in E6/Act IV).
- **C. `[Social DC 17]` Feed them false info to burn the Bureau.** → **success:** `{faction:'fac.bureau',add:-20}`, `{flag:'a3.fed_the_wire'}`, `{var:'end.doubles',add:1}`; **fail:** `{flag:'fac.bureau.onto_you_hard'}`, `{stat:'heat',add:15}`.
- **D. Cut them out coldly.** → relationship −huge, `{flag:'a3.wire_cut'}`.
**Node 2 — the mirror (`a3_mirror`):** *(target = `mir.identity`)*
**CHOICE POINT [CP-C2b] The mirror.** *(unlocked line `req {flag:'npc.mira.trusts'}` if mirror is Mira: "Mira, it's me." → auto-`redeemed`.)*
- **Defeat** → `{flag:'mir.outcome',set:'defeated'}`, `{flag:'mir.pyrrhic'}`.
- **Turn `[Social DC 20]` + shared-history** → `{flag:'mir.outcome',set:'redeemed'}` (finale ally).
- **Let them win one to save a life** → `{flag:'mir.outcome',set:'truce'}`, `{flag:'mir.mercy'}`.
- **Ignore the confrontation** (default if you skip) → `{flag:'mir.outcome',set:'victorious'}`.
**The mirror outcome is written ONLY to `mir.outcome`/`npc.mirror`, never onto Jax/Mira/byteme's `fate`.**
**Effects.** `{flag:'a3.mirror_revealed'}`, `{quest:'main_a3_q5_the_list',start:true}`.

#### `main_a3_q5_the_list`
**Summary.** You obtain PARALLAX's persons-of-interest list. **You warn only a handful.** The epilogue remembers who you saved.
**The list (dynamic, `available()`-filtered).** ~6 slots drawn from met NPCs weighting lowest-affinity + `kim`/`deadline`, plus **2 authored strangers** (`npc.list_activist` Nadia Bell + one more) whose sympathetic files are readable in the Mail window. Excludes dead/jailed/gone. "Your ex" only appears if `npc.<partner>.romance='ex'` actually holds.
**Stages.** `get_list` (`[Intrusion DC 17]`) → `warn` (timed, `timeLimitDays:14`, `sys.no_raids` set) → `done`.
**`get_list` FAIL branch (authored):** the list arrives **via the Oracle or Reyes** with a **7-day** window instead of 14, and one name is unknown (a partial list).
**`warn` stage.** Each warning costs schedule time (1 day family / 3 days stranger) + `[Opsec]` to avoid tipping PARALLAX. `+2 bonus if {flag:'life.family_shield'}`. `side.cover` low → a Grace `collateral` roll here.
**`onTimeout`:** `{ effects:[{flag:'a3.list_ignored'},{quest:'main_a3_q6_family_crosshairs',start:true}], }` (a timeout/failure never breaks the chain).
**Fates of the swept.** Move the sweep's fate changes **into this quest** (PKG-03), using **`missing`** for unwarned NPCs (guarded so q6/q8 don't reuse a swept NPC). Each unwarned person gets a concrete update (detained/fired/`missing`) and a headline/message within 30 days. `news.list_sweep` no longer writes fates (ownership fix).
**Effects.** `{flag:'a3.the_list_done'}`, `{var:'w.list_saved',set:<count>}`, per-warned `{flag:'npc.<id>.warned'}`, `{var:'w.exposure',add:2}`, `{quest:'main_a3_q6_family_crosshairs',start:true}`.

#### `main_a3_q6_family_crosshairs`
**Summary.** A faction leverages your family — **Kim endangered**, or (if `w.mom_gone`) Mom's memory weaponized. **Two authored variants** (path-exclusive): `main_a3_q6_kim` vs `main_a3_q6_memory` (chosen on `w.mom_gone`).
**Key scene `a3_family` (dialog).** `[Social DC 16]` **OR** `[Opsec DC 16]` to defuse; `+2 if {flag:'life.family_shield'}`. **fail** → `{npc:'kim',fate:'endangered'}` (**only in failEffects**; restorable in Act IV). Success: `{flag:'a3.kim_protected'}`, `{npc:'kim',affinity:10}`. A `side.cover`-below-threshold check rolls `{npc:'grace',fate:'collateral'}` if Grace is your partner.
**Effects.** `{flag:'a3.kim_leveraged'}`, `{quest:'main_a3_q7_the_vote',start:true}`.

#### `main_a3_q7_the_vote` — the council vote
**Summary.** The MNSA goes to the council. **Outcome computed.** **Dee is the swing vote if `npc.dee.council`.** A **weekly "Council whip count"** appears in the News window through Act III showing which actions moved it (so the player sees it coming).
**Vote formula (`a3_vote` on-enter; all terms defined):**
`votescore = w.public_opinion` *(positive = anti-surveillance = toward FAIL)*
`+ (fac.loft ≥ 50 ? +15 : 0)`
`+ (a3.whistleblow_prepped ? +20 : 0)`
`+ (npc.reyes.testifies ? +10 : 0)` *(flag set by `fac_bureau_q4` whistleblow before the vote)*
`+ (side_politicians_laptop leaked OR a3.whistleblow_prepped ? +10 leak bonus : 0)`
`− (fac.aperture ≥ 50 ? 20 : 0)` *(single sign — lobby pushes toward pass)*
`− (fac.halcyon ≥ 50 ? 10 : 0)` *(Halcyon lobby)*
`− (w.heat_lifetime / 800)` *(louder players → passage)*
`+ (npc.dee.council ? (affinity(dee) ≥ 40 ? +15 : −15) : 0)` *(she actually swings)*.
**Bands (concrete):** **fail (act voted down) if votescore ≥ +20** → `{var:'w.mnsa',set:0}`, `{faction:'fac.bureau',add:-10}`, `{faction:'fac.aperture',add:-10}`, `{news:'news.mnsa_failed'}`. **gutted if −10 ≤ votescore < +20** → `{var:'w.mnsa',set:2}`, `{news:'news.mnsa_gutted'}` (headline owns `w.heatGain +0.10`), `{var:'w.enclosure',add:1}`. **pass if votescore < −10** → `{var:'w.mnsa',set:1}`, `{news:'news.mnsa_passed'}` (headline owns `w.heatGain +0.25`, `w.surveillance='high'`), `{var:'w.enclosure',add:1}`.
`news.dee_swing_vote` fires **only when |votescore| < 10** (a real deadlock). `news.mnsa_failed` uses the "explosive leak" wording **only if** a leak actually happened.
**Effects.** `{flag:'a3.vote_resolved'}`, `{quest:'main_a3_q8_meridian_heist',start:true}`.

#### `main_a3_q8_meridian_heist` — **Act III climax, CP-C3**
**Summary.** Drain / expose / protect / sting Meridian. **One convergent objective with per-`a2.spine` route variants.** A **crew-select screen** and **pre-heist warning** precede it; deaths are telegraphed, not a pure roll.
**Crew select.** Candidates `{jax, mira, byteme, deadline}` **each filtered by `available()`**; up to 2. Each shows a **role** (Jax=social, Mira=crypto, byteme=speed, Deadline=old routes), a **bonus**, and a visible **Risk rating** from exposure flags. **A flipped Jax on the crew** uses an explicit **"wired crew member"** branch (not silently allowed). **Pre-heist warning node** (Deadline/Sal: "don't bring the kid") sets `a3.warned_about_jax` when `npc.jax.exposed`; ignoring it is what makes `dead` reachable.
**Mid-heist decision nodes:** "Mira's slow plan vs your fast plan" → `{flag:'a3.chose_speed_over_mira'}` (the choice that was missing); "cut corners to save time" → byteme risk.
**Route variants (open by `a2.spine`; a betrayal route is a greyed teaser at +3 DC):**
- **Aperture — drain it.** → `{money:+massive}`, `{faction:'fac.aperture',add:40}`, `{news:'news.meridian_collapse'}` (headline owns `w.meridian_state='collapsed'`, `w.itSalary add -0.2`, recession), `{stat:'heat',add:50}`. **Mill-sabotage node** if `npc.dad.mill_job`: sabotage the datacenter (his employer) or spare it (also on the Loft route). **Hollis sub-choice:** "let Hollis frame Kroll" → `{flag:'npc.hollis.your_ally'}`, `{flag:'npc.kroll.charged'}`.
- **Bureau — sting it.** → `{faction:'fac.bureau',add:40}`, mass arrests; **sub-choice** protect the Loft (Loft salvaged, Kroll walks) *or* take Aperture → `{flag:'npc.kroll.charged'}` (a **flag**; §4.6 promotes to `arrested` only if Bureau+Priya align — resolves the §4.4 contradiction) **plus** `{flag:'a3.whistleblow_prepped'}` if you route Priya's proof in (so the take-Aperture road can actually satisfy the arrest rule). "Let PD make the arrest" appears if `npc.calderon.ally_case`.
- **Loft — expose it, Robin Hood.** → leak Meridian+Aperture ties. **Requires `end.has_evidence`** (§6 conventions) to succeed at `[Intrusion DC 18]`; **else dismissed as a hoax** (`{flag:'a3.hoax'}`, darker Act IV). **On success (non-hoax):** `{news:'news.aperture_exposed'}` (owns `w.aperture_state='exposed'`), `{faction:'fac.loft',add:50}`, `{stat:'heat',add:40}`, `{flag:'a3.folk_hero'}`. `w.aperture_state` is set **only on the non-hoax outcome** (`a3.hoax` leaves it `thriving`). **DC-18 FAIL branch (authored):** trace closes, `{flag:'a3.burned'}` — forced into someone's protection (a follow-up beat), not a dead end.
- **Halcyon — sabotage the heist.** → `{faction:'fac.halcyon',add:40}`, `{flag:'a3.good_soldier'}`, Vale protects you, `{faction:'fac.loft',add:-60}` (the scene marks you a traitor — `add`, not `set`).
- **`[Cryptography DC 20]` The clean pull.** → **success:** `{flag:'a3.ghost_protocol'}` (you hold the whole proof, owe no one); **fail:** `{flag:'a3.burned'}`, forced protection.
**⌨ TERMINAL: `mission.a3_signal_intelligence`.** Auto-resolve (finale-style pool, computed): `roll = (intrusion+networking+cryptography+opsec)/4 + crew + gear` vs **DC 18** (+1 if `a2.recon_sloppy`); **failure = setback + heat + a crew casualty** targeting the **most-exposed** crew member (`npc.<id>.exposure` highest), **never game over.** byteme `dead` requires `npc.byteme.used` + ignored corner-cut warning + casualty; Jax `dead` requires `npc.jax.exposed` + ignored `a3.warned_about_jax` + casualty.
**Effects on done.** `{flag:'a3.heist_resolved'}`, update `a3.real_fates`. **No gate check here** — `trig_act4_gate` runs continuously.

### 6.D ACT IV — "The Long Tail"

Tone: consequence, grief-humor. **No new mechanics.** Act IV is the **finale run-up**, not a dead zone: the floor is **day 3400** (on `main_a4_q4`), and the span is filled by per-ally "last favor" quests + faction q6 steps + the copper finale. **No time-skips** (no engine verb); the director trigger prevents dead air.

#### `main_a4_q1_reckonings`
**Summary.** A quiet scene with each surviving inner-circle NPC where fates finalize. Runs the **§4.6 finalization table** for all survivors. Includes the **Oracle reckoning** (revealed identity) and the **Kim reckoning node** (can restore `thriving` from `endangered`).
**Effects.** finalize every `npc.*.fate`; `{quest:'main_a4_q2_last_leverage',start:true}`.

#### `main_a4_q2_last_leverage` — **CP-D1**, then the **finales** stage
**Summary.** The final choice, and the sequencing of every faction finale before the ending.
**Stage `leverage` — CP-D1 (always offered; evidence only unlocks/strengthens options).**
`scene.a4_leverage`. Every option sets **`a4.leverage` (str)**, the **first key** the ending matrix reads:
- **A. Publish everything.** → `{flag:'a4.leverage',set:'publish'}`, `{flag:'a4.leverage_done'}`; without `end.has_evidence`, publish routes to the **hoax cut** of E1.
- **B. Bury it for a quiet life.** → `{flag:'a4.leverage',set:'bury'}`.
- **C. Sell it, retire rich and dirty.** → `{flag:'a4.leverage',set:'sell'}`.
- **D. Handoff to the one who'll use it right (Priya/Reyes/Corvid, `available()` & `affinityGte:50`).** → `{flag:'a4.leverage',set:'handoff'}`.
- **E. `req {flag:'npc.kroll.wants_you'}` Kroll's "Made" offer.** → launches `fac_aperture_q6`'s scene (**single owner PKG-06**), which sets `{flag:'a4.leverage',set:'made'}`, `{flag:'npc.kroll.made_you'}`. Requires `{npc:'kroll',fateNot:['arrested','flips']}` **and** `{not:{flag:'w.aperture_state',eq:'destroyed'}}`.
- **F. Burn them all (the Bonfire).** → `{flag:'a4.leverage',set:'bonfire'}`, starts `main_a4_q2b_bonfire` (three sabotage objectives that drive faction reps down — the authored path to E8). 
- **Auto-route:** if the player skips, `{flag:'a4.leverage',set:'none'}`.
**Stage `finales`.** Objectives are `{ quest:'fac_<X>_final', status:['completed','failed'] }` for **each arc whose prerequisites hold**, and **auto-satisfied (`inactive`)** otherwise. This guarantees E5 (`fac_loft_q6` → `w.scene_state='reformed'`), E2 (`fac_aperture_q6`), E6 (`fac_bureau_q6`), and `item.exchange_keys` (`fac_hood_q5`) all resolve **before** the ending. An idle player can't outrun them.
**Effects.** `{quest:'main_a4_q3_the_city',start:true}`.

#### `main_a4_q3b_the_exchange` — the finale operation (owned PKG-04; mission PKG-17)
**Summary.** The climax through `place.exchange`, written as a **3–4 stage set piece** (not a single pooled roll): **approach** (physical `[Fitness]`/`[Hardware]` with `item.exchange_keys` OR (`side.met_dialtone` AND `fitness ≥ 30`); or **remote** `[Networking]`, always available) → **breach** (`[Intrusion]` or `mission.a4_copper` terminal) → **act** (the lane chosen in CP-D1) → **escape** (`[Opsec]`). **Each surviving ally resolves or boosts one stage** (a named, visible bonus).
**Finale grand check (pooled, computed on-enter of the act stage):** `pool = (intrusion+opsec+social)/3 + Σ(surviving ally bonus) + Σ(friendly faction bonus) + Σ(unconfiscated key tool bonus)` vs a **DC per `a4.leverage`** (publish 22 · sell 20 · handoff 21 · bury 16 · made 20 · bonfire 24 · **none 18**). **No game over:** sets `end.finale_pass`/`end.finale_fail`; a fail routes to the **darker cut** (§10). **Keys always grantable:** Marge `honored` hands them over (or walks the route as an ally, +pool); Marge `passed_keys` wills them; never-met players use the `[Hardware DC 16]` night-watchman bribe.
**⌨ TERMINAL: `mission.a4_copper` (PKG-17).** Remote route always available; physical route gated as above. Auto-resolve is the pool check.
**Effects.** `{flag:'a4.finale_done'}`, `{quest:'main_a4_q3_the_city',start:true}` continues to montage.

#### `main_a4_q3_the_city`
**Summary.** A montage keyed to `w.*`, shown **after** the finale/ending choice is locked. Halcyon a tombstone or clean? Diner open? MNSA repealed or entrenched? Recession or recovery? The mill-datacenter scene with Dad (if not `spiral`/passed — Dad has **no death fate**, so "(if he lived)" is dropped). **The repeal is keyed to `a4.leverage='publish'` + `npc.dee.council`** (not to an ending id — resolves the ordering bug).
**Effects.** publish montage news per `w.*`; `{quest:'main_a4_q4_last_day',start:true}`.

#### `main_a4_q4_last_day`
**Summary.** A final free day to visit whoever's left (warm-restore only if those places/relationships survive). Then the ending assembler (§10). **Soft floor day 3400** on this quest.
**Effects.** `{ending:<computed>}` via §10; `endingsSeen` updated.

### 6.E Motif-inversion table (owned PKG-16/PKG-02; the "nostalgia is a trap" payoff)

| Warm Act I/IIa form | Dark inversion (scene, trigger flag) |
|---|---|
| the dial-up handshake as comfort | the same handshake under a Bureau wiretap transcript at the hinge (`a2_hinge`, on `a2.phase_iib`) |
| Mira signing off `*hugz*` | `*hugz*` read aloud in an interrogation transcript (`a3_wire`) |
| the LAN party full of friends | `side_reunion_lan` with empty chairs (dead/jailed absent) |
| "you've got mail" spam gag | a PARALLAX-personalized ad that knows too much (`side_the_other_you`) |
| the toaster-feds joke | Act IV: the toaster man was, narrowly, right (`news.toaster_feds` final variant) |

---

## 7. FACTION ARCS

Each arc runs across acts, **every step has an explicit `autoStart`** (previous step completed + act + rep + story flags) and an act window. **Duplicated beats become journal-only mirror quests** (no scenes of their own): they `autoStart` and `complete` on the main-quest flag, carry only journal text, and the **effects stay owned by the main-quest package** (resolves the double-authoring + ownership collisions). **Each faction has ≥4 unique steps** and a repeatable rep source (§3).

**Journal-only mirror quests (own no effects, no scenes):**
`fac_aperture_q1_dinner` (completes on `{seen:'a2_kroll_dinner'}`), `fac_aperture_q4_meridian` (on `a3.heist_resolved` + Aperture route), `fac_bureau_q1_approach` (on CP-B5 B/C **or** the post-raid flip entry), `fac_bureau_q5_sting` (on `a3.heist_resolved` + Bureau route), `fac_halcyon_q1_interview` (on `{flag:'fac.halcyon.employed'}`; **single gate** `{any:[{faction:'fac.halcyon',gte:20},{flag:'a1.job_started'},{degree:true}]}`), `fac_hood_q1_grandma` (on `side_grandma_pc` first visit), `fac_hood_q3_row_chips_in` (on `life.hood_carried_you`), `fac_loft_q4_solidarity` (on CP-B4 Corvid branch). These **only add `fac.loft.marked`-style journal/constraint flags**, reading effects the main quest already set.

### 7.1 The Loft — "Keep the Commons" (`arc.loft`, PKG-05)
1. **`fac_loft_q1_prove`** — *Prove You Won't Rat.* Planted chance to sell a member out. **Branch:** refuse (`fac.loft +8`) / take the bait (`fac.loft −15`, `{flag:'npc.corvid.wary'}`). *autoStart:* `{all:[{faction:'fac.loft',gte:15},{var:'act',lte:2}]}`.
2. **`fac_loft_q2_schism`** — *Sell or Burn.* **Branch:** back Corvid (`{flag:'fac.loft.side_corvid'}`, Switch → `converted`/`sellout` later) / back Switch (`{flag:'fac.loft.side_switch'}`, `{npc:'corvid',affinity:-10}`, opens the sell lane, `w.enclosure +1`). *autoStart:* `{all:[{quest:'fac_loft_q1_prove',status:'completed'},{faction:'fac.loft',gte:25}]}`.
3. **`fac_loft_q3_enclosure`** — *The Enclosure.* Recruit/dissuade three members via `[Social]` (each has a fail branch: a dissuaded member you failed drifts to Aperture and returns on the wrong side). **Branch:** intact (`{flag:'fac.loft.intact'}`, `w.scene_state='vibrant'`) / hollow (`{flag:'fac.loft.bleeding'}`, `w.scene_state='bleeding'`). Harder if `w.itSalary < 1`. *autoStart:* `{all:[{quest:'fac_loft_q2_schism',status:'completed'},{var:'act',gte:3}]}`.
4. **`fac_loft_q4_solidarity`** — journal-mirror of CP-B4 Corvid branch; sets constraint `{flag:'fac.loft.marked'}` (owed a rescue in Act III → **read** by `side_loft_calls_it_in`, §8).
5. **`fac_loft_q5_sysop`** — *The Sysop Question.* Corvid **preparing to step down (or facing prison if `npc.corvid.charged`).** **Decides Corvid martyred vs free:** solidarity-saved (`a2.solidarity`) → she's `free` and you can be named; else if `charged` and you don't fight → `martyred`. **Branch:** accept → `{flag:'fac.loft.sysop',set:'player'}` (also `a3.you_are_sysop`) / decline → successor among `available()` `{mira, deadline, switch}` recorded in `fac.loft.sysop`; if none, board goes dark (`w.scene_state='dark'`). *Requires:* `{faction:'fac.loft',gte:50}` (Inner 80 = clean, uncontested).
6. **`fac_loft_q6_last_commons`** *(Act IV, `fac_<X>_final` for Loft).* Rebuild clean or hold its funeral → `w.scene_state ∈ {reformed,dark}`; feeds E5. *autoStart:* `{all:[{var:'act',eq:4},{quest:'fac_loft_q5_sysop',status:['completed','failed']}]}`.

### 7.2 Aperture — "Special Accounts" (`arc.aperture`, PKG-06)
1. **`fac_aperture_q1_dinner`** — journal-mirror of CP-B1. *autoStart:* `{seen:'a2_kroll_dinner'}`.
2. **`fac_aperture_q2_retainer`** — *The Retainer.* Each job launders a real breach. **Branch:** keep going (`{flag:'fac.aperture.knowing'}`, `w.enclosure +1`) / skim evidence (`{flag:'a2.building_a_case'}`, an evidence fragment, `w.exposure +1`) / **broker** *(req `{faction:'fac.aperture',gte:50}`)* → `{flag:'npc.corvid.bought'}` if you sell Corvid's list. **NDA constraint:** `{flag:'fac.aperture.muzzled'}`. **If `a2.refused_kroll`, Kroll's better offer lands here.** *autoStart:* `{all:[{quest:'fac_aperture_q1_dinner',status:'completed'},{faction:'fac.aperture',gte:20},{var:'act',gte:2}]}`.
3. **`fac_aperture_q3_competitor`** — *The Competitor.* Sabotage a rival firm employing a friend. **Branch:** comply (`fac.aperture +`, `fac.hood −10`, `w.enclosure +1`) / warn (`fac.aperture −15`, `{flag:'fac.aperture.suspect_you'}`, `fac.hood +10`); if the friend is Mira → warning can set `{flag:'npc.mira.betrayed'}` on the comply side (the only proper source for Mira `betrayed`).
4. **`fac_aperture_q4_meridian`** — journal-mirror of CP-C3 Aperture route.
5. **`fac_aperture_q5_hospital`** — *The Hospital Job* (moral event horizon). At Grace's ward. **Branch:** do it (`money +huge`, `{flag:'fac.aperture.hospital_done'}`, Grace → `left`, `w.enclosure +1`, `{news:'news.hospital_scandal'}`) / refuse (`fac.aperture −25`, Grace → `whistleblower`) / **`[Opsec DC 20]` (+2 if social ≥ 40) fake it** — protect patients, fool Kroll (`{flag:'fac.aperture.faked_hospital'}`, `{npc:'grace',affinity:15}`). **FAIL branch (authored):** Kroll discovers the fake → Grace endangered → opens a rescue beat. *Requires:* `{faction:'fac.aperture',gte:50}`. *autoStart:* `{all:[{quest:'fac_aperture_q3_competitor',status:'completed'},{var:'act',eq:3},{faction:'fac.aperture',gte:50}]}`.
6. **`fac_aperture_q6_made`** *(Act IV, `fac_<X>_final` for Aperture).* Kroll offers her seat. **Single owner of the "take her seat" scene** (CP-D1 E launches this). **Branch:** take it → `{flag:'npc.kroll.made_you'}`, `{flag:'a4.leverage',set:'made'}` / burn it → `{flag:'npc.kroll.charged'}` or `{flag:'npc.kroll.flips_set'}` / save Kroll as ally → `{flag:'npc.kroll.flips_set'}`. Requires `{npc:'kroll',fateNot:['arrested','flips']}` and `{not:{flag:'w.aperture_state',eq:'destroyed'}}`. *Also:* "back Hollis over Kroll" → `{flag:'npc.hollis.your_ally'}`.

### 7.3 The Bureau — "Cooperating Witness" (`arc.bureau`, PKG-07)
1. **`fac_bureau_q1_approach`** — journal-mirror of CP-B5 B/C; **alternative entry** = the post-raid flip (`scene.a2_jail` flip node, or `trig_bureau_flip_offer`).
2. **`fac_bureau_q2_first_delivery`** — *First Delivery.* **Branch:** real intel (`fac.bureau +`, `fac.loft −10`) / false intel `[Opsec DC 20]` (**success:** `{var:'end.doubles',add:1}`; **fail:** `{flag:'fac.bureau.leashed'}`). *autoStart:* `{all:[{quest:'fac_bureau_q1_approach',status:'completed'},{faction:'fac.bureau',gte:20},{var:'act',gte:2}]}`.
3. **`fac_bureau_q3_the_line`** — *The Line You Won't Cross.* Hand over Jax/Corvid **(both filtered by `available()`)**. **comply** → `{npc:'<friend>',fate:'arrested'}`, `{flag:'fac.bureau.burn_complied'}` / **refuse** → deal jeopardized (`fac.bureau −20`) **and, if the friend was an arrested Jax, `{flag:'npc.jax.flipped'}`** (the arrested Jax flips to save himself — the correct source for `npc.jax.flipped`, matching CP-C2/§12) / **decoy `[Social DC 17]`** (everyone safe, `{flag:'fac.bureau.decoy'}`; **fail branch authored:** Marlow tightens the leash). On-record → `{flag:'fac.bureau.exposed_self'}`.
4. **`fac_bureau_q4_rot`** — *The Rot Upstairs.* **Branch:** whistleblow (`{npc:'marlow',fate:'exposed'}`? → set `{flag:'npc.marlow.exposed'}`, `{flag:'npc.reyes.broke_whistle'}`, **`{flag:'npc.reyes.testifies'}`** if before the vote) / talk her back (`handler` track) / exploit (`fac.bureau +`, Marlow → `promoted`).
5. **`fac_bureau_q5_sting`** — journal-mirror of CP-C3 Bureau route.
6. **`fac_bureau_q6_seize_or_serve`** *(Act IV, `fac_<X>_final` for Bureau).* Help Marlow keep the surveillance for the state (E6 darker) or help Reyes dismantle it under a court (E6 "honest"). **Grants `item.exchange_keys`? No** — that's Hood; this grants the E6 cut selection. *(Proposal term "AQUIFER" retired → "PARALLAX.")*

### 7.4 Halcyon — "Vesting Schedule" (`arc.halcyon`, PKG-09)
1. **`fac_halcyon_q1_interview`** — journal-mirror of `main_a2_q2` interview (single gate above). Dee rehired here as office manager (timeline in order).
2. **`fac_halcyon_q2_ship_it`** — *Ship It.* Crunch, promotion, options vesting. Grants insurance at rep 50. *autoStart:* `{all:[{flag:'fac.halcyon.employed'},{jobLevel:'job_halcyon_junior',gte:1}]}`.
3. **`fac_halcyon_q3_audit`** — *The Audit.* **Branch:** look away (`{flag:'fac.halcyon.looked_away'}`) / dig (`{flag:'a2.building_a_case'}`, an evidence fragment, `w.exposure +1`). *autoStart:* `{all:[{quest:'fac_halcyon_q2_ship_it',status:'completed'},{var:'act',gte:2}]}`.
4. **`fac_halcyon_q4_crash`** — *The Crash.* The **2005 scandal wobble** (not the 2001 bust; wording pinned §11). **Branch:** protect team (`fac.hood +10`, options −) / protect options (`money +`, `fac.hood −10`). `{news:'news.halcyon_crash'}` published **once** (guarded so CP-C1 A and this don't double-publish). *autoStart:* `{all:[{quest:'fac_halcyon_q3_audit',status:'completed'},{var:'act',eq:3}]}`.
5. **`fac_halcyon_q5_handcuffs`** *(Act IV).* **Branch:** ascend (`{flag:'fac.halcyon.made_partner'}`) / reform (`{flag:'npc.vale.reformed'}`) / detonate (feeds E1) / **walk out and found something clean with Priya** → starts `fac_halcyon_q6_founders`. **Guard:** `{not:{flag:'a3.whistleblow_prepped'}}` and `w.halcyon_state ≠ 'dead'` (Vale can't offer power after his own scandal ended him — resolves the review's guard note).
6. **`fac_halcyon_q6_founders`** *(Act IV, `fac_<X>_final` for Halcyon; the E10 path).* You and Priya build something clean. → `{flag:'end.clean_startup'}`, `{npc:'priya',...}` cofounder. Feeds **E10 "Vesting"** (§10).

### 7.5 The Neighborhood — "Home Directory" (`arc.hood`, PKG-10)
1. **`fac_hood_q1_grandma`** — journal-mirror of `side_grandma_pc` recurrence.
2. **`fac_hood_q2_dad`** — *Dad's Comeback* (**renamed from `side_dad_comeback`**). Teach Dad `[Hardware]`/`[Social]`. **Branch:** invest (`{flag:'npc.dad.business'}`; §4.6 → `retrained`) / neglect (steering toward `spiral` only if also `w.mom_gone`).
3. **`fac_hood_q3_row_chips_in`** — journal-mirror of CP-B3 C.
4. **`fac_hood_q4_save_cathode`** — *Save the Cathode.* **Branch:** buy in (`money −`, `{flag:'side.saved_cathode'}`) / fundraise `[Business DC 15]` (**fail branch authored:** you fall short, Sal takes a second mortgage — a later `took_a_fall` seed) / let it close (`w.cathode_open=0`, Sal → `diner_closed`). **`timeLimitDays` set; onTimeout → `w.cathode_open=0`, Sal `diner_closed`** (so E9's "the Cathode closed if you didn't fight for it" is real). New steps also: **"Kim's science fair," "the Row's first website"** (comedy relief in Act III).
5. **`fac_hood_q5_coming_home`** *(Act IV, `fac_<X>_final` for Hood).* `w.hood_soul` warm-room modifier; **delivers `item.exchange_keys`** whether Marge is `honored` (hands them over / walks the route) or `passed_keys` (a timed Act IV trigger wills them). Decides `npc.dialtone.fate`.

### 7.6 LSU education arc (`arc.lsu`, PKG-09 + PKG-11 for comedy) — fills IIa/III dead zones
1. **`edu_lsu_q1_exam`** — entrance-exam scene: `[Programming DC 12]` OR `[Systems DC 12]`; enroll `prog.lsu_cs_assoc`/`prog.lsu_cs_bs`. Dorm comedy.
2. **`edu_lsu_q2_prof`** — meet **Prof. Okoro**; her grant is Aperture/Bureau-funded.
3. **`edu_lsu_q3_thesis`** — your thesis stumbles onto a PARALLAX precursor. **Branch:** publish (evidence fragment; `npc.okoro` `ally`) / bury (grade boost, `okoro` `complicit`).
4. **`edu_lsu_q4_graduation`** — degree; **Mom attends if `w.mom_gone=0`**. Feeds the legit ladder & E4 family anchor.

### 7.7 NorthLink sysadmin/network ladder (`arc.northlink`, PKG-09) — the sysadmin/network story
1. **`fac_northlink_q1_logs`** — meet **Wes Tran**; log-retention requests. **Branch:** comply / minimize.
2. **`fac_northlink_q2_tap`** — the MNSA tap install. **Branch:** install (`company_man` track, feeds `w.surveillance`) / **leak the tap** with Wes (`whistle`, evidence fragment, `w.public_opinion +`).
3. **`fac_northlink_q3_promotion`** — network-engineer promotion or exit; colors E4/E10.

### 7.8 Calderon / PD Cyber mini-arc (`arc.cage`, PKG-07) — the clean-law route
1. **`fac_cage_q1_interview`** *(post-raid).* She interrogates you, offers a card. `{npc:'calderon',met:true}`.
2. **`fac_cage_q2_real_case`** *(Act III).* Feed her a real Aperture case → `{flag:'npc.calderon.ally_case'}`; opens the CP-C3 "let PD make the arrest" option.
3. **`fac_cage_q3_clean_arrest`** *(Act IV).* The clean-law arrest branch (Kroll/Hollis) or `forced_out` if the Bureau squeezed her.

---

## 8. SIDE QUESTS (42)

Each: `id` · category · **primary mechanic** · availability (act window + `autoStart` cond) · synopsis with choices/outcomes · rewards. All `QuestDef kind:'side'`. **Warm/timed quests are protected by the speed governor (§5.3)** — a backgrounded tab never eats them. **Every `[skill DC n]` has an authored `failEffects`/`fail` goto (CI-enforced fail-forward).** Mechanic tags: `Dialog`, `Terminal`, `Schedule`, `Shop/Build`, `Messenger/Forum`, `Multi-month`. Act distribution rebalanced: some Act I quests moved to IIa; ≥8 Act III exclusives, ≥6 Act IV.

### Family
1. **`side_y2k_leftovers`** · Family · Dialog · Act I (`{all:[{day:true,gte:60},{flag:'a1.dad_laid_off'},{npc:'dad',met:true}]}` — **guarded on the layoff**). Dad's old boss; you find the layoffs were decided before the "computer problem." **Choice:** tell Dad (`dad −5`→`+10`, `side.dad_truth`) / spare him (`dad +5`, `side.dad_spared`). *Reward:* `fac.hood +5`, money, `w.exposure +1`.
2. **`side_kims_login`** · Family · Shop/Build · Act IIa (`{npc:'kim',met:true}`). Beat 2 of Kim's arc. Clean vs hot hardware → `kim_trajectory ±`. *Reward:* `fac.hood +5`.
3. **`side_kim_logs`** · Family · Dialog · Act IIb (`{npc:'kim',met:true}`). Kim finds your ICQ logs; your `[Opsec]` teaches by example → `kim_trajectory ±`. **Fail:** she copies your bad habits.
4. **`side_kim_essay`** · Family · Dialog · Act III. Kim's college essay / first hack → `kim_trajectory ±`; feeds thanksgiving fate line.
5. **`side_slideshow`** · Family · Schedule · Act II (`{all:[{day:true,gte:500},{not:{var:'w.mom_gone',eq:1}}]}`, timed 60d). Be home 4 Sunday evenings to digitize photos. **Timeout:** `side.slideshow_lost`. **Done:** `side.slideshow_done` (E4 payoff).
6. **`side_uncles_pyramid`** · Family · Terminal(opt) · Act II. `npc.uncle`'s Ponzi is an Aperture shell. **Choice:** expose (`fac.hood +`, `uncle ruined`) / stay out / **refund him `[Intrusion DC 15]`** (fail: the shell locks you out, a heat spike) → `uncle refunded`, an evidence fragment. Public outcome → a news item.
7. **`side_dads_profile`** · Family · Dialog · Act III (`{var:'w.mom_gone',eq:1}`). Dating profile; vet a scammer `[Social DC 14]` (**fail:** the scammer takes Dad's deposit, a rescue beat). → `{flag:'npc.dad.dating'}` (§4.6 → `dating_again`).
8. **`side_inheritance_drive`** · Family · Terminal · Act III–IV. A relative's drive holds Dad's union-organizing files. → `npc.dad affinity +10`, `side.union_files`, a news beat.

### Friends (loyalty quests tagged "Loyalty")
9. **`side_jax_sister`** · Friends · Dialog · Act II (recurring). **[Loyalty: Jax]** Fund Rosa's treatment legit/hot → `rosa treated` + shapes Jax. **Can't help** → `rosa worsens`.
10. **`side_byteme_snowday`** · Friends · Dialog · Act I–IIa. **[Loyalty: byteme]** Cover / teach invisibly (`npc.byteme.used` seed) / scare straight (`byteme pro`).
11. **`side_vanishing_highscore`** · Friends · Dialog · Act I (`{npc:'byteme',met:true}`). Arcade cracked by byteme. Also a byteme loyalty option. **Choice:** rat / cover / lesson (`byteme pro`).
12. **`side_deadline_dog`** · Friends · Dialog · Act II. **[Loyalty: Deadline]** Pay / hack a discount `[Intrusion DC 12]` (**fail:** the vet's system flags you, tiny heat) / organize the Row. Dog returns in his epilogue.
13. **`side_deadline_health`** · Friends · Dialog · Act II–III. Deadline collapses. **Choice:** pay (`deadline mentor/saves_you`) / hack billing `[Intrusion DC 17]` (**fail:** billing office notices → Aperture memory `life.hacked_hospital`, a later beat) / do nothing (`deadline passed`).
14. **`side_corvid_backup`** · Friends · Dialog · Act II–III. **[Loyalty: Corvid]** Guard the dead-man's archive (`side.corvid_archive`, `item.scene_archive`) / read it (`fac.loft −20`) / refuse. Seeds E5 cut & the CP-C3 Loft check (`+3 if item.scene_archive`).
15. **`side_reunion_lan`** · Friends · Multi-month · Act III–IV (`{var:'act',gte:3}`). One last Quake LAN; **empty chairs** for the dead/jailed (motif inversion). Redemption window `npc.jax.fate=flipped → free`+ally-tag. *Reward:* mood, `fac.loft +`.
16. **`side_loft_calls_it_in`** · Friends · Dialog · Act III (`{flag:'fac.loft.marked'}`). **The owed rescue.** A Loft member is about to be swept; you spend heat/time to pull them out. Pays off `fac.loft.marked`. **Fail:** they're taken, `fac.loft −`.

### Romance (a shared 4-step ladder; `life.partner` gates exclusivity)
**Ladder (both romances):** `flirting → dating → partner (moving in) → engaged → married`. **`life.partner` (str)** is set when a romance reaches **dating**; advancing the *other* NPC's romance while `life.partner` is set requires clearing it first (a "choose" scene) — **so Mira and Grace can't both be engaged.** Partner-scoped side quests read `life.partner`.
17. **`side_coffee_warm`** · Romance · Dialog · Act II (`{npc:'mira',met:true}`). **[Loyalty: Mira]** `[Social DC 13]` (**fail:** the collab flops, comic, `mira −2`) → `mira romance:'dating'`, `{flag:'life.partner',set:'mira'}`, joint-contract bonus.
18. **`side_grace_first_date`** · Romance · Dialog · Act IIb–III (`{npc:'grace',met:true}`). Grace's dating beat → `grace romance:'dating'`, `{flag:'life.partner',set:'grace'}`.
19. **`side_two_lives`** · Romance · Dialog · Act II–III (`{npc:'grace',met:true}`). Which life to bring to dinner → `side.cover` var. *Reward:* cover, Grace affinity.
20. **`side_meet_parents`** · Romance · Dialog · Act II–III (`{flag:'life.partner'}`). Hide the hacker life over dinner `[Social DC 14]` (**fail:** comedic, not fatal). Success → partner romance:'partner' (moving in), `fac.hood +`.
21. **`side_ridgeport`** · Romance · Dialog · Act III (`{npc:'mira',fate?…}` `{flag:'npc.mira.trusts'}`). Mira's erasing ex. **Choice:** defuse `[Social DC 17]` (**fail:** the ex doxxes Mira; she hides at your place — a new beat) / take the blame (Mira toward `partner`, heat) / learn she lied (trust shaken).
22. **`side_confession`** · Romance · Dialog · Act II–III (`{flag:'life.partner'}`). Honesty (`side.partner_knows` → accomplice) / lie (they may turn you in).
23. **`side_long_distance`** · Romance · Schedule · Act III (`{flag:'life.partner'}`). Maintain across dial-up latency via the Schedule window, or let it fade. *(Drafting note removed.)*
24. **`side_proposal_server`** · Romance · Shop/Build · Act III (`{flag:'life.partner'}` + partner romance ≥ `partner`). Hide a proposal in a BBS door-game. Sabotage by a jealous rival if `npc.mira.rivalry` + partner is Grace, `[Opsec DC 15]` (**fail:** the rival leaks it; a mortifying but recoverable beat). → partner romance:'engaged'.
25. **`side_wedding`** · Romance · Dialog · Act III–IV (partner romance = `engaged`). The wedding; **guests chosen by fates** (empty seats for the lost). → partner romance:'married' (feeds E4). *(Marriage is now reachable — resolves the "nobody can marry" review.)*

### Freelance clients
26. **`side_divorce_drive`** · Freelance · Terminal(opt) · Act II. Recover / fabricate (`side.fabricated_evidence`) / flip who you help. Public outcome → news.
27. **`side_overdue`** · Freelance · Dialog · Act I–II. Trace a small firm's malware to Aperture (breadcrumb, an evidence fragment, `w.exposure +1`).
28. **`side_wedding_avi`** · Freelance · Shop/Build · Act I–II. Recover a corrupted wedding video `[Hardware DC 12]` (**fail:** partial recovery, still sweet). *Reward:* money, mood.
29. **`side_church_basement`** · Freelance · Dialog · Act II. Teach seniors email; meet **Marge "dialtone"** → `side.met_dialtone`, a phreaking tool. **Signposted by a forum hint** so the finale copper route is discoverable.
30. **`side_politicians_laptop`** · Freelance · Terminal(opt) · Act II–III (`{not:{flag:'a3.mnsa_live'}}` — **guarded so the MNSA isn't previewed after it's already introduced**). Find MNSA drafts a year early; leak → `w.public_opinion +`, `w.exposure +1`.

### Neighborhood / oddities / easter eggs
31. **`side_haunted_modem`** · Neighborhood · Dialog · Act I. Cordless-phone crosstalk "ghost." *Reward:* `fac.hood +`, hook to `side_haunted_server`.
32. **`side_51_floppies`** · Neighborhood · Shop/Build · Act I–II. Restore a game from floppies `[Hardware DC 12]` (**fail:** the 51st disk is unreadable but you recover the love letter). *Reward:* money, mood.
33. **`side_bbs_that_wouldnt_die`** · Oddity · Dialog · Act II. A dead sysop's board. **Choice:** preserve / harvest its user list (`w.enclosure +1`). *(`w.enclosure` from the harvest is owned by PKG-14; PKG-13 does not set `w.enclosure` — ownership fix.)*
34. **`side_press_any_key`** · Neighborhood · Dialog · Act I. Dee's PC gag; **plants the council gag** and a choice "You should run, Dee" → `{flag:'npc.dee.encouraged'}`.
35. **`side_konami_contact`** · Easter egg · Messenger · Act II–III (`{flag:'a2.oracle_contact'}` — **guarded on the Oracle channel existing**). An extra Oracle clue, an evidence fragment.
36. **`side_tamagotchi_triage`** · Neighborhood · Dialog · Act I. Kim's virtual pet; beat 1 of her arc. *Reward:* `kim +8`.
37. **`side_haunted_server`** · Oddity · Terminal · Act II–III (`{quest:'side_haunted_modem',status:'completed'}`). A dead phreaker's dead-man's-switch. *Reward:* `item.old_tool` (misc, hidden), lore.
38. **`side_dee_for_council`** · Neighborhood · Messenger/Forum · Act IIa (`{flag:'npc.dee.encouraged'}`). Build Dee's site, run a phone bank → `{flag:'npc.dee.council'}`. Comedy; pays off at the vote.

### Dark / late-game
39. **`side_wire_you_planted`** · Dark · Dialog · Act III (`{any:[{flag:'npc.byteme.used'},{flag:'a1.sold_tool'}]}` — **triggers on a tool you sold/taught, not merely on keeping the sample**). Your Act I tool now surveils the Row. **Choice:** recall `[Opsec DC 16]` (**fail:** the Bureau notices the recall, heat) / weaponize / live with it (`fac.hood −`, `w.enclosure +1`).
40. **`side_the_other_you`** · Dark/meta · Dialog · Act III (`{any:[{flag:'a3.truth_t3'},{var:'w.enclosure',gte:3}]}`). PARALLAX predicts your next choices. Match → `side.predictable`. *Reward:* dread, an evidence fragment, `w.exposure +1`.
41. **`side_zero_day`** · Dark · Dialog · Act II–III. 72-hour job. **Choice:** push through (`money +huge`, `{stat:'health',set:0}` chance → hospital + a **Grace scene that sets `npc.grace {met:true}`** as the romance fallback) / pace it. `side.zero_day` colors Burnout.
42. **`side_byteme_funeral`** · Dark · Dialog · Act III–IV (`{npc:'byteme',fate:'dead'}`). A wake. Who you must look at depends on your choices. `side.byteme_funeral_seen`. *Reward:* none.

**`side_grandma_pc`** (recurring, Act I→III; started by `main_a1_q6`). Each visit worse and funnier. **Final Act III visit:** the civic app is spying on Ruth (`npc.grandma_ruth` → `spied_on`), `side.grandma_dark`, `w.exposure +1`. Recurs ~every 120 days (director-paced).

**`side_loft_calls_it_in`, `side_dee_for_council`, `side_grace_first_date`, `side_kim_logs`, `side_kim_essay`, `side_wedding`** are the new quests added to close the fixes above.

---

## 9. RANDOM / LIFE EVENTS & TRIGGERS (30 events + the system triggers)

Delivered as `TriggerDef` (recurring with `cooldownDays` + `chance`, or one-off `once`). All offer choices with interesting failure. `life.*` namespace. **Every Mom-initiated life event carries `{not:{var:'w.mom_gone',eq:1}}`.**

### 9.0 System triggers (glue; owners noted)
- **`trig_act2_gate` / `trig_act3_gate` / `trig_act4_gate`** — §5.1 (PKG-01/03). The only writers of `act`.
- **`trig_a1_gate_pair`** (PKG-01) — recomputes `a1.gate_pair` from the four roads.
- **`trig_a1_two_side_done`** (PKG-01) — sets `a1.two_side_done` when 2 Act I side quests are completed.
- **`trig_a3_committed`** (PKG-03) — sets `a3.committed` on the two-pole rep pattern.
- **`trig_a3_own_branches`** (PKG-03) — sets `a3.own_branches` when `w.enclosure ≥ 4`.
- **`trig_evidence`** (PKG-04, hourly) — maintains `end.has_evidence` from the §6 formula.
- **`trig_heat_lifetime`** (PKG-16, daily) — accumulates `w.heat_lifetime`.
- **`trig_first_raid`** (PKG-02) — §6.B; routes the first raid into `main_a2_q5`.
- **`trig_bureau_flip_offer`** (PKG-07) — §6.B; arrest-opens-a-branch.
- **`trig_bureau_office`** (PKG-16) — Act II start news.
- **`trig_datacenter_open`** (PKG-15) — Act III start; `w.datacenter_open`, `news.mill_datacenter`.
- **`trig_halcyon_ipo`** (PKG-09, ~day 1000, `{not:{flag:'w.halcyon_state',eq:'dead'}}`) — `w.halcyon_state='rising'`, `news.halcyon_ipo`.
- **`trig_halcyon_dead`** (PKG-09, Act IV) — if `w.halcyon_state='crashed'` and not clean → `'dead'`, `news.halcyon_dead`.
- **`trig_broadband_2`** (~day 1400) / **`trig_broadband_3`** (~day 3300) — `w.broadband += 1` (step 1 at ~2003 via `life_broadband_arrives`).
- **`trig_dee_council`** (PKG-15) — `{all:[{var:'act',eq:2},{day:true,gte:700},{flag:'npc.dee.encouraged'},{npc:'dee',affinityGte:30}]}` → `{flag:'npc.dee.council'}`, `{npc:'dee',fate:'councilwoman'}`, `{news:'news.dee_council'}` (single source; `side_dee_for_council` is the alternative campaign path that sets `npc.dee.encouraged`+council).
- **`trig_affinity_decay`** (PKG-00, weekly) — §4.7.
- **`life_drift_ping`** (PKG-15, per-NPC threshold) — §4.7 drift warnings.
- **`trig_director`** (PKG-15) — if no main/faction/side beat fired in ~45 days, pull a weighted side/life beat from the act pool.
- **`trig_marge_keys`** (PKG-10, Act IV timed) — if Marge `passed_keys`, wills `item.exchange_keys`.
- **`trig_repeal`** (PKG-16) — if `a4.leverage='publish'` + `npc.dee.council` → `{news:'news.mnsa_repealed'}` (headline applies `w.heatGain add -0.25`, `w.surveillance='low'` — **repeal subtracts, not `set 1.0`**, so CP-A2 C's +0.10 isn't wiped; §11.1).

### 9.1 Family & home
1. **`life_get_off_the_phone`** · Act I–II (`{all:[{housing:'parents'},{not:{var:'w.mom_gone',eq:1}}]}`, chance while a transfer is active). Lose the download / lock the line. **Twist (once):** the "download" is Mom's job application (`npc.mom −8`, `fac.hood −5`).
2. **`life_dads_resume`** · one-off Act III (`{all:[{npc:'dad',met:true},{var:'w.datacenter_open',eq:1}]}` — **Act III, gated on the datacenter opening**). Robert asks for a résumé for a datacenter job → `{flag:'npc.dad.mill_job'}` (§4.6 → `mill_ghost`). **Choice:** support / sabotage. *(Renamed ASCII; "Walt" → Robert; datacenter timeline fixed.)*
3. **`life_moms_boss`** · one-off Act I–II (`{not:{var:'w.mom_gone',eq:1}}`). A rigged time-clock. Fix / confront / plant evidence.
4. **`life_family_finds_gear`** · one-off Act II–III (`{all:[{stat:'heat',gte:40},{housing:'parents'}]}`). **Branch:** shield (`life.family_shield` — **read** as an auto-success teaser in CP-B4 and a +2 in `main_a3_q6`) / report of last resort (`life.family_may_report` — **read** in an Act III leverage beat: the estranged family can be turned).
5. **`life_aunt_chain_letter`** · recurring Act I–II. *(Renamed from `life_aunt_rosa_chain` to avoid the Rosa collision; the aunt is **Aunt Bien**.)* A scam chain email is a real phishing kit → an evidence fragment.
6. **`life_thanksgiving`** · recurring yearly (**4 authored variants keyed to act + fates**, so it doesn't repeat identically ~11 times). Reads state back: who's alive, your heat, Kim's fate line, a hard silence if `w.mom_gone`.

### 9.2 Health, stress, aging
7. **`life_burnout`** · recurring (`{stat:'stress',gte:90}`). Narrates `sys.burnouts`; repeated → E7.
8. **`life_crunch_cold`** · Act II+ (`{stat:'energy',lte:20}`). Push (worse) or rest.
9. **`life_gym_mishap`** · rare (heavy exercise). Fitness debuff.
10. **`life_aging_mirror`** · one-off at age 27. Foreshadows Act IV feel.
11. **`life_hospital_bill`** · **trigger on `{n:{var:'sys.hospitalized'},gte:1}` incrementing** (a tracker var `life.hosp_seen` prevents re-firing). Applies **only the PARALLAX surcharge/denial** when `w.aperture_state='thriving'` + `w.enclosure ≥ 2` (`news.insurers_riskscore`) — **the base bill is already deducted by the engine; no double-charge.** **Choice:** pay / negotiate `[Business DC 14]` (**fail:** the surcharge sticks, small debt) / ignore (debt).

### 9.3 Neighbors & the Row
12. **`life_haunted_appliance`** · recurring Act I (the "feds tapped the toaster" gag).
13. **`life_block_party`** · summer (`{faction:'fac.hood',gte:20}`). *(Proposal "Ashmill-style" term removed.)* Mood/affinity; `w.hood_soul` read.
14. **`life_landlord_cameras`** · one-off Act II–III (`{housing:'rented'}`). Disable (`fac.hood +`) / leave (`{flag:'life.landlord_footage'}` — **registered as `life.landlord_footage`; §12 corrected**; read in a later leverage beat).
15. **`life_neighbor_scam_victim`** · Act II–III (`{var:'w.enclosure',gte:2}`). A PARALLAX-driven denial; trace (breadcrumb) or look away.

### 9.4 Tech mishaps & dial-up nostalgia
16. **`life_download_98`** · Act I. The 98% failure. Comedy.
17. **`life_modem_song`** · one-off. Record the handshake. `life.modem_song`.
18. **`life_aol_disc_tower`** · Act I. Free-trial disc sculpture. Comedy.
19. **`life_crt_dies`** · rare (old monitor). Forced hardware purchase.
20. **`life_y2k_holdout`** · one-off Act I–II. Fix a prepper's bunker network → `life.y2k_safehouse` (Act IV heat-decay safehouse).

### 9.5 Dot-com era news reactions (personal-scale)
21. **`life_napster_suit`** · ~2002. byteme/Kim name-adjacent. Lawyer up / lie low.
22. **`life_dotcom_layoff_wave`** · one-off ~2002. **Introduces `npc.webmaster` (Cal Reeves)** and **lays off Dee from CompCastle** (timeline). Hire Cal (`hired`) / he drifts to a fraud crew (`life.webmaster_dark`, `npc.webmaster` `webmaster_dark` — **read** in an Act III antagonist cameo `side_wire_you_planted` follow-up / a fraud-crew forum thread).
23. **`life_broadband_arrives`** · ~2003. *(Proposal "Kessler" → Harbor Point.)* `w.broadband += 1`; `news.broadband_harbor`.
24. **`life_camera_phone`** · ~2004. Surveillance-normalization beat.
25. **`life_halcyon_ipo_party`** · one-off (`{flag:'w.halcyon_state',eq:'rising'}`). Champagne; options bump; `news.halcyon_ipo`.

### 9.6 Crime/heat ambient
26. **`life_random_stop`** · Act III–IV (`{var:'w.mnsa',eq:1}`). `cred`/`money`/`[Social]` to avoid a heat bump (**fail:** a heat bump + a night in a cell, not game over).
27. **`life_script_kiddie_dm`** · Act II+. A forum kid (a byteme mirror). Mentor / ignore / weaponize. *(Proposal "scriptr" term removed.)*
28. **`life_old_rival_returns`** · one-off Act III. The Act I flamer **`npc.flamer`** resurfaces on the List. Help (`helped`) / schadenfreude (`schadenfreude`, `w.hood_soul` read). *(This NPC is also the mirror **stranger** fallback, §4.5.)*
29. **`life_webmaster_returns`** · Act III (`{flag:'life.webmaster_dark'}`). Cal Reeves returns on the wrong side — the promised antagonist cameo.
30. **`life_toaster_finale`** · Act IV (ambient). The toaster gag's dark payoff (motif table).

---

## 10. ENDINGS (10 + 1 secret)

**Selection: a first-match-wins priority matrix**, evaluated in `main_a4_q4`. **The `a4.leverage` choice (or `none` for the uncommitted) is the PRIMARY key that picks the ending family; state conditions only pick the *cut*** (normal / darker / warm / cold / per-NPC). This resolves the review's "committed players fall through to E9" holes.

**Guarantees (assembler test enumerates flag combinations and asserts these):**
- **E9 is the unconditional last row** — every run ends (no conditions on E9 itself; `end.uncommitted` only selects its epilogue variant).
- **No CP-D1 option (A–F) can resolve to E9** (the test enumerates each option × spine × evidence and asserts a non-fog family).
- **The darker cut is chosen by `end.finale_fail`** (§6.D pooled check), never a separate ending, never game over. **E7 and E9 are exempt** from darker cuts (they are already floors).
- **`w.hood_soul ≥ 2`** inserts a warm-room coda into any ending; **`≤ 0`** strips it — implemented as conditional `epilogues[]` slides with `if:{var:'w.hood_soul',gte:2}` / `lte:0`.
- **Every NPC/world-specific epilogue line is a conditional `TextPart`/slide** (`if` on fate, `romance:'married'`, `w.mnsa`, `w.cathode_open`), so text never contradicts reachable state.

### Priority order (top = checked first)

**E-SECRET — "The Long Con" (`end_long_con`)** — the have-it-all.
**Conditions:** `{all:[{flag:'a2.double_agent'},{flag:'end.has_evidence'},{var:'end.doubles',gte:2},{any:[{skill:'opsec',gte:70},{all:[{skill:'opsec',gte:60},{flag:'life.y2k_safehouse'}]}]}]}`. *(`end.doubles` is a var, +1 at CP-B5 C, `fac_bureau_q2` false-intel success, CP-C2a C success, `fac_aperture_q5` fake success. `opsec` bar lowered to accommodate aging.)*
**Epilogue.** You played everyone and nobody knows it was you. Conditional slides: `if w.mnsa=0` "the surveillance law is dead"; `if w.aperture_state='destroyed'` "Aperture is ash"; `if w.scene_state ≠ 'dark'` "the Loft still meets."
**Darker cut (`end.finale_fail`):** one surviving record; the epilogue is a knock that hasn't come yet.

**E8 — "Scorched Earth" (`end_scorched`)** — mutual destruction.
**Conditions:** `{any:[{flag:'a4.leverage',eq:'bonfire'},{all:[{var:'end.doubles',gte:2},{n:{var:'factions_at_hostile'},gte:3}]}]}`. *(The Bonfire quest `main_a4_q2b` drives ≥3 factions to ≤ −20 via authored sabotage objectives; `factions_at_hostile` is a computed count. No "no faction ≥ 50" clause — that collided with the gates.)*
**Epilogue.** Overlapping scandals you engineered; the MNSA collapses in the chaos; `w.itSalary` craters (`news.economy_recession`). *Per-NPC:* `if npc.jax.fate='free'` "Jax leaves a voicemail you don't return." **Darker cut:** you're implicated too; a bus ticket, not a phone call.

**E1 — "The Reckoning" (`end_reckoning`)** — heroic exposure.
**Condition:** `{flag:'a4.leverage',eq:'publish'}` *(any spine — resolves the spine-lock)*.
**Cut selection:** `end.has_evidence` false → **hoax cut** ("dismissed, but you named them"); `end.finale_fail` → **martyrdom cut**; else the clean Reckoning.
**Epilogue.** Aperture collapses; NorthLink's contracts cancel. Conditional: `if w.mnsa≠0 AND a4.leverage='publish' AND npc.dee.council` "the MNSA is repealed after hearings"; **the repeal line is gated so it never claims a repeal the vote didn't enable.** `if a2.spine='loft'` Robin-Hood framing; `if a2.spine='bureau'` court framing; else civilian-leaker framing.
*Per-NPC (conditional slides):* `npc.priya.fate='martyr'` "Priya testifies beside you." `npc.corvid.fate ∈ {vindicated,succeeded}` "Corvid reopens the board." `npc.jax.fate='backroom_partner' AND w.cathode_open=1` "Jax runs the Cathode back room" — **guarded so it can't co-exist with "you skip the city."**

**E2 — "The Ghost King" (`end_ghost_king`)** — the dirty win.
**Condition:** `{flag:'a4.leverage',eq:['sell','made']}`. *(Includes `fac_aperture_q6` take-seat, which sets `made`.)*
**Cut:** `fac.hood > 20` → "guilty benefactor" variant (you quietly fund the Row from inside the machine).
**Epilogue (2nd-person surveillance voice).** *"You wake at 6:14; the model predicted 6:15. You are Special Accounts now."* Conditional slides: `if npc.kroll.fate='made_you'` Kroll is a cautionary story; `if npc.jax.fate ∉ {dead,arrested}` "Jax doesn't return your pages" (else a different, guarded line); `if npc.mira.fate ∉ {gone,dead} AND npc.mira.romance ∉ {partner,married}` "Mira works two floors down." **The "your own child" final shot is a slide gated on `{npc:'<partner>',romance:'married'}`** (never fires without a partner).
**Darker cut:** the system needed your key, not you; absorbed and forgotten.

**E3 — "The Handoff" (`end_handoff`)** — self-erasure.
**Condition:** `{all:[{flag:'a4.leverage',eq:'handoff'},{any:[…handoff target available & Trusted…]}]}`. Target ∈ `available()` `{priya, reyes, corvid}` with `affinityGte:50`.
**Cut:** `end.finale_fail` → intercepted (your survivor is burned instead of you). *(E3 no longer hard-requires `ghost_protocol`; handoff works with any `end.has_evidence`. If handoff is chosen without evidence, CP-D1 D is greyed with `reqText`.)*
**Epilogue.** You vanish; the evidence goes to a trusted survivor. Conditional survivor slide by which NPC.

**E10 — "Vesting" (`end_vesting`)** — the legit ladder's ending *(new; resolves "Halcyon has no ending")*.
**Condition:** `{all:[{flag:'a2.spine',eq:'halcyon'},{flag:'a4.leverage',eq:['bury','none','handoff']}]}` **AND** `{any:[{flag:'end.clean_startup'},{flag:'fac.halcyon.made_partner'}]}` (checked above E4/E6 so a Halcyon ascend/founder isn't miscategorized).
**Two cuts:** **Founder** (`end.clean_startup`) — a clean startup with Priya (`npc.priya.fate='cofounder'`, `npc.reyes.fate='turned'` slide if she quit to join you); **Partner** (`fac.halcyon.made_partner`) — you ascended; the conspiracy in a suit, `if npc.vale.fate='patron'` he protects your friends.
**Darker cut:** Founder that quietly took Aperture's seed money; Partner that gets the same 6:14 as E2.

**E6 — "Cooperating Witness" (`end_witness`)** — the Bureau ending.
**Condition:** `{all:[{flag:'a2.spine',eq:'bureau'},{flag:'fac.bureau.informant'}]}`. *("Survived the sting" = `{all:[{not:{flag:'a3.burned'}},{jailed:false}]}` — defined.)*
**Cut:** `fac.loft ≤ −20` → **cold** (the scene destroyed); else **"honest badge"** (you kept some bridges). `npc.marlow.fate='promoted'` → the Bureau keeps the surveillance "for safekeeping."
**Epilogue.** Expunged record, a consultant badge. Conditional: `npc.reyes.fate='handler'` "Reyes is your partner"; closing line `if a young hacker` "You were Corvid's friend once. What happened?" **Darker cut / Marlow lane:** you traded one owner for a worse one.

**E5 — "Keeper of the Commons" (`end_keeper`)** — the scene wins.
**Condition:** `{all:[{flag:'fac.loft.sysop',eq:'player'},{flag:'fac.loft.intact'},{flag:'w.scene_state',eq:'reformed'},{npc:'corvid',fate:['succeeded','vindicated']}]}`.
**Epilogue.** You run the board — smaller, careful, clean. Conditional: `npc.byteme.fate='pro'` "byteme is your right hand"; `npc.deadline.fate ∉ {passed}` "Deadline gets his dog" (**guarded so a passed Deadline doesn't get a dog**); `w.cathode_open=1` "the Cathode stays open." **Darker cut / `side_corvid_backup` skipped:** a commons-in-exile (a server nobody can visit).
**Broker variant:** if `fac.loft.side_switch` (you sold access), an E2/E5 "Broker" slide notes the scene got paid but lost its soul (reads `fac.loft.side_switch`).

**E4 — "The Civilian" (`end_civilian`)** — chose the light.
**Condition:** `{all:[{flag:'a4.leverage',eq:['bury','none']},{any:[{npc:'grace',romance:'married'},{npc:'mira',romance:'married'},{all:[{any:[{npc:'mom',fate:'healthy'},{npc:'kim',fate:'thriving'}]},{faction:'fac.hood',gte:50}]}]},{not:{flag:'end.burnout'}}]}`. *(Accepts a **family anchor** in lieu of a spouse; reads `romance:'married'`, not fate strings.)*
**Epilogue.** A normal job (`if npc.vale.reformed` Halcyon-clean, else a modest firm), a marriage or a full family table, a mortgage. Conditional: `side.slideshow_done` "the photos got digitized"; `npc.mom.fate='healthy'` "Mom holds a grandchild" (only `if {npc:'<partner>',romance:'married'}`). **Darker cut / `fac.bureau.exposed_self`:** years later, a knock.

**E7 — "Burnout" (`end_burnout`)** — the human failure.
**Condition:** `{all:[{any:[{n:{var:'sys.burnouts'},gte:3},{stat:'health',lte:25}]},…all inner-circle affinityLte:15…,{not:{flag:'end.has_evidence'}}]}`. Set `end.burnout` when it matches (read by E4's exclusion).
**Epilogue.** No prison, no glory — a body that quit. `if w.hood_soul ≥ 2` a single warm room; else empty. **Darker cut: N/A** (exempt).

**E9 — "Fog Over the Lumen Sound" (`end_fog`)** — neutral / uncommitted fallback.
**Condition:** **none (unconditional last row).**
**Epilogue.** The enclosure happened around you. Conditional: `end.uncommitted` selects the "you never picked a side" variant; `w.cathode_open=0` "the Cathode closed — you didn't fight for it" (only `if {flag:'w.cathode_open',eq:0}`); `w.hood_soul ≥ 2` "Sal still saves you a stool"; `≤ 0` "the counter's gone." **Darker cut: N/A** (exempt). *(Retitled to name the sea, §2.1.)*

**Ending bookkeeping.** `end.*`: `end.has_evidence` (derived), `end.uncommitted`, `end.doubles` (var), `end.clean_startup`, `end.finale_pass`/`end.finale_fail`, `end.burnout`. The assembler sets `{ending}`, appends every survivor's conditional `epilogues[]` slide whose `if` holds, plus a `w.*` city slide and the `w.hood_soul` coda.

---

## 11. WORLD STATE

**Type convention (authoritative).** Engine `vars` are **numbers only**; `flags` are boolean/number/**string**. Multipliers & counters → numeric `vars`; state-machine enums → **string flags**. Where earlier drafts wrote `var w.<enum> set "word"`, read it as a **string flag** `w.<enum>`.

### 11.1 Numeric world vars (multipliers the sim reads + story counters)

| id | type | default | meaning / systems affected |
|---|---|---|---|
| `w.heatGain` | mult | 1.0 | **read by heat sim.** MNSA passed +0.25; gutted +0.10; `w.aperture_alerted` +0.10; repeal **`add −0.25`** (not reset — preserves other deltas); floor clamped ≥ 0.8 in readers. **Shared add-only** (PKG-01/03/16 may `add`; §13). A test asserts it never exceeds **1.45** on any path. |
| `w.contractPay` | mult | 1.0 | hack contract payouts. Recession −; boom +. |
| `w.itSalary` | mult | 1.0 | IT wages & freelance. Recovery **`add +0.2`**; Meridian collapse **`add −0.2`**; recession −. **Shared add-only.** |
| `w.rent` | mult | 1.0 | rent. Gentrification +; recession −. |
| `w.prices` | mult | 1.0 | lifestyle/misc prices. |
| `w.techPrices` | mult | 1.0 | hardware/software; drifts down across era. |
| `w.exposure` | counter | 0 | **0→~14**; act-gate metric; bumped **only** by breadcrumb side quests & investigative main beats (§5.4). Gates at 6 (II→III) and 12 (III→IV). |
| `w.enclosure` | counter | 0 | **0→10** complicity (cap raised; thresholds 2/4/6/8); darkness dial; Oracle T3 at 6; clamped in readers. |
| `w.public_opinion` | scalar | 0 | −100..100; **positive = anti-surveillance** (§6.C). **Add-only** (main_a3_q1 adds, never sets). |
| `w.hood_soul` | scalar | 0 | Neighborhood conscience; ending warm-room modifier. **Shared add-only.** |
| `w.mnsa` | enum-int | 0 | 0 = not passed/repealed, 1 = passed, 2 = gutted. |
| `w.broadband` | step | 0 | 0 dial-up → 3 fiber; steps via era triggers (§9.0). |
| `w.heat_lifetime` | counter | 0 | accumulated by `trig_heat_lifetime`; read by the vote. |
| `w.aperture_alerted` | bool-int | 0 | Aperture knows someone's digging (news rider from CP-A2 C). |
| `w.mill_open` | bool-int | 1 | paper mill operating; → 0 at the layoff (news rider). |
| `w.datacenter_open` | bool-int | 0 | → 1 at Act III start (`trig_datacenter_open`); gates `life_dads_resume`, `news.mill_datacenter`. |
| `w.cathode_open` | bool-int | 1 | Cathode open; → 0 if it closes (incl. `fac_hood_q4` onTimeout). |
| `w.mom_gone` | bool-int | 0 | set 1 if Mom `passed`. |
| `w.list_saved` | counter | 0 | how many marked NPCs you warned. |
| `end.doubles` | counter | 0 | full-double count (E-SECRET/E8). |
| `a3.real_fates` | counter | 0 | NPCs whose fate ≠ default (Act III→IV gate). |
| `side.cover` | scalar | 0 | civilian-cover strength (`side_two_lives`); read by `main_a3_q6` collateral roll. |
| `kim_trajectory` | scalar | 0 | sums Kim's arc choices; §4.6. |
| `fac.bureau.handler_suspicion` | counter | 0 | rises on unsanctioned hacks while a Bureau asset; erodes raid immunity. |

### 11.2 String-flag world states (enums) — **all initialized by PKG-00**

| flag id | values | init | set where | read where |
|---|---|---|---|---|
| `w.halcyon_state` | `startup` \| `rising` \| `wobble` \| `crashed` \| `clean` \| `dead` | `startup` | `trig_halcyon_ipo` (rising ~2004), CP-C1/`fac_halcyon_q4` (wobble/crashed news riders), `news.halcyon_clean` (clean), `trig_halcyon_dead` (dead) | options, jobs, Vale/Priya fates, slides |
| `w.aperture_state` | `thriving` \| `exposed` \| `destroyed` | `thriving` | `news.aperture_exposed` (exposed, non-hoax only), `news.aperture_destroyed` / CP-D1 publish (destroyed) | contracts, CP-B3 insurance denial, endings |
| `w.meridian_state` | `healthy` \| `breached` \| `collapsed` | `healthy` | Loft/Bureau routes set `breached`; `news.meridian_collapse` sets `collapsed` | bank contracts, economy, `w.itSalary` loop |
| `w.scene_state` | `vibrant` \| `bleeding` \| `dark` \| `reformed` | `vibrant` | `fac_loft_*` | Loft contracts & mood, E5 |
| `w.surveillance` | `low` \| `high` | derived | set `high` by `news.mnsa_passed`; `low` by `trig_repeal`; else derived from `w.mnsa` in readers | heat, investigation frequency, opsec DCs, endings |
| `w.scene_state='bleeding'` note | — | — | Switch `sellout` writes **`bleeding`** (the invalid `bought` value is retired) | — |

### 11.3 Feedback loops

- **Crackdown loop:** high heat → `news.crackdown` → investigation frequency ↑ → raids → fates lock → headlines.
- **Economy-bleed loop:** a big heist → `w.meridian_state='collapsed'` → `w.itSalary add −0.2` → friends' jobs pay less → more tempted by Aperture/Switch → `fac_loft_q3` harder → the scene bleeds.
- **Loudness loop:** player noise raises `w.heat_lifetime` and pushes `w.public_opinion` toward passage; loud players then live under +25% heat gain.
- **Recovery loop:** dot-com recovery (2004) `w.itSalary add +0.2`, more jobs — "could I just get a normal job?" becomes real.

### 11.4 News headlines (44) — **the story choice PUBLISHES; the NewsDef.effects OWN every world delta (single-count rule).**

**Collision rule (adopted):** the **story effect publishes the headline and never duplicates the delta**; the **`NewsDef.effects` carry the world-var change.** All §6/§7 duplicates removed. `fac_hood_q3`'s `w.hood_soul +1` is folded into `news.mom_fundraiser` (one +1 total).

1. `news.mill_layoffs` (`a1.dad_laid_off`) — "Port Lumen Paper Sheds 200 Jobs." → `{var:'w.mill_open',set:0}`.
2. `news.aperture_alerted` (`w.aperture_alerted`) — "…Aperture Posts Record Quarter." → `{var:'w.aperture_alerted',set:1}`, `{var:'w.heatGain',add:0.10}`. *(Only source of this +0.10; CP-A2 C only publishes.)*
3. `news.first_raid_public` (`a2.first_raid_resolved`) — "PD Cyber Seizes 'Hacker Cache.'"
4. `news.jax_arrest` (`npc.jax.fate='arrested'`) — headline **"Local Man Charged in Data Theft"** (body computes age from date; a **bank** variant only if CP-B3 D or the heist caused it).
5. `news.mom_fundraiser` (`life.hood_carried_you`) — "Cannery Row Diner Hosts Benefit." → `{var:'w.hood_soul',add:1}`. *(Sole +1; CP-B3 C and fac_hood_q3 only publish.)*
6. `news.insurers_riskscore` (`{all:[{var:'w.enclosure',gte:2}, Mom crisis]}`) — "Insurers Adopt 'Risk Scoring.'"
7. `news.mnsa_introduced` (`a3.mnsa_live`) — "Council Weighs 'Network Security Act.'"
8. `news.mnsa_passed` (`w.mnsa=1`) — "Council Passes Act; ISPs to Retain All Logs." → `{var:'w.heatGain',add:0.25}`, `{flag:'w.surveillance',set:'high'}`. *(Sole +0.25.)*
9. `news.mnsa_failed` (`{all:[{var:'w.mnsa',eq:0}, post-vote]}`) — "CITIZENS WIN" (adds "After Explosive Leak" **only if a leak flag holds**).
10. `news.mnsa_gutted` (`w.mnsa=2`) — "Watered-Down Act Passes." → `{var:'w.heatGain',add:0.10}`. *(Sole.)*
11. `news.mnsa_repealed` (`{all:[{flag:'a4.leverage',eq:'publish'},{flag:'npc.dee.council'}]}`) — "Amid Scandal, Council Repeals Law." → `{var:'w.heatGain',add:-0.25}`, `{flag:'w.surveillance',set:'low'}`. *(Keyed to publish+Dee, not an ending id.)*
12. `news.halcyon_ipo` (`w.halcyon_state='rising'`) — "Halcyon Soars on Debut."
13. `news.halcyon_crash` (`w.halcyon_state='wobble'`) — **"Halcyon Shares Slide as Scandal Spreads"** (2005 wording; published **once**, guarded). → `{flag:'w.halcyon_state',set:'wobble'}` if not already.
14. `news.halcyon_clean` (`npc.vale.reformed`) — "Halcyon Cuts Ties to Data Broker." → `{flag:'w.halcyon_state',set:'clean'}`. *(Sole writer of `clean`; CP-C1 D only publishes.)*
15. `news.halcyon_dead` (`w.halcyon_state='dead'`) — "Halcyon Files for Bankruptcy."
16. `news.meridian_collapse` (`w.meridian_state='collapsed'`) — "Meridian Insolvent." → `{flag:'w.meridian_state',set:'collapsed'}`, `{var:'w.itSalary',add:-0.2}`, recession. *(Sole ×0.8-equivalent; CP-C3 only publishes.)*
17. `news.aperture_exposed` (`w.aperture_state='exposed'`) — "LEAKED: How a 'Marketing' Firm Sold the City's Secrets." → `{flag:'w.aperture_state',set:'exposed'}`. *(Sole; CP-C3 Loft non-hoax only publishes.)*
18. `news.aperture_destroyed` (`w.aperture_state='destroyed'`) — "Aperture Dissolved; Executives Indicted."
19. `news.bureau_office` (`{var:'act',eq:2}`, via `trig_bureau_office`) — "Federal Task Force Opens Field Office."
20. `news.bureau_scandal` (`npc.marlow.exposed`) — "Federal Office Accused of Renting Tools."
21. `news.byteme_tragedy` (`npc.byteme.fate='dead'`) — "Community Mourns Young Man" (age from date).
22. `news.corvid_trial` (`npc.corvid.fate='martyred'`) — "'Sysop' Sentenced to 8 Years."
23. `news.cathode_closes` (`w.cathode_open=0`) — "Beloved Diner Closes." → `{var:'w.hood_soul',add:-1}`.
24. `news.cathode_saved` (`side.saved_cathode`) — "Neighbors Buy the Cathode." → `{var:'w.hood_soul',add:1}`.
25. `news.dee_council` (`npc.dee.council`) — "Former Retail Manager Wins Council Seat."
26. `news.mira_leaves` (`npc.mira.fate='gone'`) — "Rising Tech Talent Departs."
27. `news.dad_business` (`npc.dad.fate='retrained'` booked-solid) — "Cannery Row's Own 'PC Doctor.'"
28. `news.dotcom_recovery` (`{day:true,gte:1000}`) — "Tech Hiring Rebounds." → `{var:'w.itSalary',add:0.2}`. *(Sole recovery source; dated ~2004 to match §11.3.)*
29. `news.crackdown` (heat high) — "Mayor Vows 'Zero Tolerance.'"
30. `news.folk_hero` (`a3.folk_hero`) — "Who Is 'the Handle'?"
31. `news.priya_whistleblow` (`npc.priya.fate='martyr'`) — "Engineer's Testimony Rocks Industry."
32. `news.broadband_harbor` (`w.broadband≥1`) — "NorthLink Brings 'Always-On' to Harbor Point First." *(Renamed from Kessler.)*
33. `news.napster_suit` (`{day:true,gte:365}`) — "Music Industry Sues Local Teens."
34. `news.predictive_policing` (`w.mnsa=1`) — "PD Pilots 'Data-Driven Patrols.'"
35. `news.disappearances` (`{all:[{var:'w.enclosure',gte:3},{flag:'a3.list_ignored'}]}`) — "Three Residents Reported Missing."
36. `news.hospital_scandal` (`fac.aperture.hospital_done`) — "Harbor Point General Billing Breach."
37. `news.grace_whistleblower` (`npc.grace.fate='whistleblower'`) — "ER Nurse Alleges Records Tampering."
38. `news.kroll_made` (`npc.kroll.fate='made_you'`) — "Aperture Names New Head of 'Special Accounts.'"
39. `news.list_sweep` (`a3.list_ignored`) — "Authorities Detain 12." → `{var:'w.public_opinion',add:-…}`. **No fate writes** (moved into `main_a3_q5`).
40. `news.dee_swing_vote` (`{all:[{flag:'npc.dee.council'}, |votescore|<10]}`) — "Council Deadlocked; Briggs Casts Deciding Ballot" (branches on outcome; fires only on a real deadlock).
41. `news.mill_datacenter` (`w.datacenter_open=1`) — "Old Paper Mill Reopens as 'Data Campus.'"
42. `news.economy_recession` (`w.meridian_state='collapsed'`) — "Downtown Vacancies Climb." → `{var:'w.rent',add:-0.1}`, `{var:'w.itSalary',add:-0.1}`.
43. `news.became_ghost_king` (`end_ghost_king`) — "Port Lumen 'Safest Connected City.'"
44. `news.toaster_feds` (ambient Act I–IV) — "Local Man Still Insists Agents 'Tapped His Toaster.'"

---
## 12. FLAG REGISTRY

Generated from a set/read matrix over §§6–9. **No flag is read that is not set; no flag is set that is never read** (§12.9). Booleans unless `(str)`/`(num)`. Counters/scalars are **vars** (§12.7). Items in §12.8. NPC fates are the `npc.<id>.fate` field (§4), finalized once (§4.6). A **Payoffs** column names the scene/quest that reads each non-obvious flag (resolves the "set but never read / promised payoff never written" review).

### 12.1 `a1.*`
| flag | meaning | set | read / payoff |
|---|---|---|---|
| `a1.cautious` / `a1.known_newbie` / `a1.posted_cringe` | first-post framing | CP-A0 A/B/C | Corvid greeting flavor; `posted_cringe` = a one-time `[Social]` bonus |
| `a1.bond_jax` | Jax bond (only if affinity ≥ 20) | q3 | Jax scene flavor (**no longer a gate input**) |
| `a1.job_started` | took a legit Act I job | q2 Door A | q2 interview gate |
| `a1.jax_covered_you` | Jax covered your bricked crack | q2 Door B fail | Jax flavor |
| `a1.diplomat` | neutral in back room | q3 | Switch/Corvid flavor |
| `a1.hoarder` | kept the sample | CP-A2 B | evidence; CP-B1 E teaser |
| `a1.sold_tool` | sold/lent the cracked tool | q2 | `side_wire_you_planted` trigger |
| `a1.grandma_done` | Act I climax seen | q6 | Act I→II gate |
| `a1.dad_laid_off` | mill layoff fired | q5 | q6/`side_y2k_leftovers` gate |
| `a1.two_side_done` | 2 Act I side quests done | `trig_a1_two_side_done` | Act I→II gate road (c) |
| `a1.gate_pair` | ≥2 gate roads satisfied | `trig_a1_gate_pair` | `trig_act2_gate` |

### 12.2 `a2.*`
| flag | meaning | set | read / payoff |
|---|---|---|---|
| `a2.phase_iib` | dark turn began | `main_a2_q1` | tone, motif table |
| `a2.spine` (str) | act-III spine {aperture,bureau,double,halcyon,loft} | CP-B5 A/B/C/D/F (+fallback) | CP-C3 routes, E1/E2/E6/E10 |
| `a2.oracle_contact` | Oracle channel open | Oracle IIb drops | `side_konami_contact` gate |
| `a2.double_dealer` | skimmed Kroll's data | CP-B1 B | `main_a3_q2` Kroll aside (Aperture −10 unless recording) |
| `a2.refused_kroll` | refused first contract | CP-B1 C | `fac_aperture_q2` better offer |
| `a2.priya_backstory` | learned Priya's '99 silence | `main_a2_q2` | CP-C1 flavor |
| `a2.mom_crisis_resolved` | Mom fork resolved | CP-B3 | Act II→III gate |
| `a2.early_bank_job` / `life.dirty_bank_money` | reckless bank job | CP-B3 D | Reyes attention; `news.jax_arrest` bank variant |
| `a2.took_jax_fall` | took the fall for Jax | CP-B4 | Jax `free` |
| `a2.clean_raid` | wiped & stonewalled | CP-B4 | Loft flavor; evidence-safe raid |
| `a2.solidarity` | organized '94 wipe | CP-B4 | clears Corvid `charged`; `fac_loft_q5`; E5 |
| `a2.informant_seed` | a member panicked | CP-B4 fail | `fac_bureau` later-flip content |
| `a2.first_blood` | first-blood beat fired | `main_a2_q5` | epilogues |
| `a2.first_raid_resolved` | first raid resolved | `main_a2_q5` | Act II→III gate; clears `sys.no_raids` |
| `a2.raid_target` (str) | who the raid hit | `main_a2_q5` selector | first-blood branch |
| `a2.double_agent` | playing Bureau both ways | CP-B5 C | E-SECRET, E8 |
| `a2.went_straight` | committed to Halcyon | CP-B5 D | Halcyon spine, E4/E10 |
| `a2.meridian_recon` | did recon for Kroll | CP-B5 A | Aperture spine |
| `a2.hinge_done` | Act II hinge resolved | `main_a2_q7` | Act II→III gate |
| `a2.building_a_case` | gathering evidence | `fac_aperture_q2` / `fac_halcyon_q3` | Oracle tier 2 (**now actually read**), evidence fragment |
| `a2.recon_sloppy` | botched recon | mission fail | Act III heist +1 DC |

### 12.3 `a3.*` / `a4.*`
| flag | set | read / payoff |
|---|---|---|
| `a3.mnsa_live` | `main_a3_q1` | vote, `side_politicians_laptop` guard |
| `a3.truth_t1/2/3` | `main_a3_q2` | Made offer, endings, `side_the_other_you` |
| `a3.own_branches` | `trig_a3_own_branches` | tier 3 gate |
| `a3.oracle_revealed` | `main_a3_q2` | Act III→IV gate |
| `a3.whistleblow_prepped` | CP-C1 A / heist take-Aperture | E1, Kroll `arrested` rule, vote, `fac_halcyon_q5` guard |
| `a3.kroll_hunts_priya` | CP-C1 D fail | Priya `broken` |
| `a3.mirror_revealed` | `main_a3_q4` | Act III→IV gate |
| `a3.wire_wearer` (str) | `main_a3_q4` (priority jax>mira>byteme) | CP-C2 merge test |
| `a3.incriminated` | CP-C2a fail | CP-D1 +2 DC, E6/Act IV leverage |
| `a3.fed_the_wire` | CP-C2a C | Bureau rep, `end.doubles` |
| `a3.wire_cut` | CP-C2a D | relationship flavor |
| `a3.the_list_done` / `a3.list_ignored` | `main_a3_q5` | epilogues, `news.disappearances` |
| `a3.kim_leveraged` / `a3.kim_protected` | `main_a3_q6` | Kim fate |
| `a3.vote_resolved` | `main_a3_q7` | Act III→IV gate |
| `a3.heist_resolved` | `main_a3_q8` | Act III→IV gate |
| `a3.folk_hero` | CP-C3 Loft non-hoax | E1, `news.folk_hero` |
| `a3.good_soldier` | CP-C3 Halcyon | Vale protection |
| `a3.ghost_protocol` | CP-C3 crypto | E3/E1, `end.has_evidence` |
| `a3.burned` | CP-C3 crypto/Loft fail | forced-protection beat; E6 "survived the sting" |
| `a3.hoax` | CP-C3 Loft fail (no evidence) | E1 hoax cut |
| `a3.chose_speed_over_mira` | CP-C3 mid-heist node | Mira `casualty` |
| `a3.warned_about_jax` | pre-heist warning node | gates Jax `dead` |
| `a3.committed` | `trig_a3_committed` | Act III→IV gate |
| `a4.leverage` (str) | CP-D1 A–F / auto `none` | **ending matrix primary key** |
| `a4.leverage_done` / `a4.finale_done` | `main_a4_q2` / `q3b` | sequencing |
| `end.uncommitted` | `trig_act4_gate` fallback | E9 variant |

### 12.4 `npc.*` (character-state flags; fates §4/§4.6)
| flag(s) | set | read / payoff |
|---|---|---|
| `npc.mira.respect/.rivalry/.secret_hinted/.trusts/.betrayed` | CP-A1 / CP-A1 / CP-A1 C / `main_a2_q6` / (`fac_aperture_q3` targeting Mira, romance breakup) | Mira scenes/fates, mirror, CP-C2 unlock |
| `npc.corvid.trusts/.wary/.bought/.charged` | CP-A2 A / `fac_loft_q1` bait / `fac_aperture_q2-q5` broker / first-raid Corvid fail | leads, `fac_loft_q5`, Corvid fate |
| `npc.jax.protected/.exposed/.alone/.aborted/.covered/.flipped/.estranged` | CP-B2 A/C-fail/D/B/C / `fac_bureau_q3` refuse (arrested Jax flips) / §4.6 | raid target, Jax fate, CP-C2 wire |
| `npc.kroll.wary/.wants_you/.made_you/.charged/.flips_set` | CP-B5 E fail / `main_a3_q2` t3 / `fac_aperture_q6` / heist take-Aperture & CP-C3 / `fac_aperture_q6` | Kroll fate/Made, `news.kroll_made` |
| `npc.priya.warned_you/.debt/.silenced/.you_covered` | `main_a2_q2` / CP-B3 B / CP-C1 B / CP-C1 E | Priya fate, insurance branch |
| `npc.vale.reformed/.exposed` | CP-C1 D / `fac_halcyon_q5` | `w.halcyon_state`, Vale fate, E4/E10 |
| `npc.marlow.exposed` | `fac_bureau_q4` | E1/E6, `news.bureau_scandal` |
| `npc.reyes.testifies/.broke_whistle` | `fac_bureau_q4` | vote, Reyes fate |
| `npc.calderon.ally_case` | `fac_cage_q2` | CP-C3 PD option, Calderon fate |
| `npc.hollis.your_ally/.neutralized` | CP-C3 / `fac_aperture_q6` | Hollis fate |
| `npc.dee.encouraged/.council/.promoted` | `a1_compcastle`/`side_press_any_key` / `trig_dee_council`/`side_dee_for_council` / corporate arc | vote swing, E1, `news.dee_council` |
| `npc.byteme.used/.turns_set` | `side_byteme_snowday` / `fac_bureau` | CP-C2, mirror, byteme fate |
| `npc.kim.*` (`kim_trajectory` var) | Kim's 4-beat arc | Kim fate |
| `npc.switch.courted/.converted` | `main_a1_q3` / `fac_loft_q2` | Loft schism |
| `npc.dad.business/.mill_job/.dating` | `fac_hood_q2_dad` / `life_dads_resume` / `side_dads_profile` | §4.6 Dad fate |
| `npc.dialtone.*` | `fac_hood_q5` | finale keys |
| `npc.deadline.saved_you/.relapse` | Act III/`side_deadline_health` | Deadline fate |
| `npc.grace.collateral` / `.whistleblower` (fate) / `.romance` | `main_a3_q6` / `fac_aperture_q5` / romance ladder | Grace fate, E4 |
| `npc.corvid.wary` etc. | — | — |
| `npc.<id>.warned` | `main_a3_q5` | epilogues, disappearance outcomes |
| `npc.<id>.exposure` (var) | side/main exposure beats | first-blood, casualty target |
| `mir.identity` (str) / `mir.outcome` (str) / `mir.pyrrhic` / `mir.mercy` | `main_a2_q1a` lock / CP-C2b / defeat / mercy | mirror scenes, epilogues (combined with `mir.identity`) |
| `npc.oracle.is_deadline/.is_reyes/.is_kroll` | `main_a3_q2` | Oracle reckoning, finale bonus |

### 12.5 `fac.*` / `end.*`
| flag | set | read / payoff |
|---|---|---|
| `fac.aperture.client/.retainer/.knowing/.muzzled/.suspect_you/.hospital_done/.faked_hospital` | CP-B1 / CP-B1 D / `fac_aperture_q2` / NDA / `fac_aperture_q3` warn / `q5` do / `q5` fake | Aperture arc, endings, Grace fate |
| `fac.bureau.informant/.informant_secret/.on_radar/.onto_you_hard/.leashed/.burn_complied/.decoy/.exposed_self` | CP-B5 B / B / CP-B4 fail / CP-C2a C fail / `fac_bureau_q2` caught / `q3` comply / `q3` decoy / `q3` on-record | Bureau spine, E6, E4 darker cut, Act IV leverage |
| `fac.halcyon.employed/.looked_away/.made_partner` | `main_a2_q2` / `fac_halcyon_q3` / `q5` ascend | insurance branch, E10 |
| `fac.loft.side_corvid/.side_switch/.intact/.bleeding/.marked/.sysop(str)` | `fac_loft_q2/q3/q4/q5` | endgame lane, E5, `side_loft_calls_it_in`, successor |
| `end.has_evidence` | `trig_evidence` | CP-C3, CP-D1, E1 |
| `end.clean_startup` | `fac_halcyon_q6_founders` | E10, Priya cofounder |
| `end.uncommitted` / `end.burnout` / `end.finale_pass` / `end.finale_fail` | gates / E7 match / finale check | endings & cuts |

### 12.6 `side.*` / `life.*`
| flag | set | read / payoff |
|---|---|---|
| `side.dad_truth/.dad_spared` | `side_y2k_leftovers` | Dad flavor |
| `side.slideshow_done/.slideshow_lost` | `side_slideshow` / timeout | E4 |
| `side.saved_cathode` | `fac_hood_q4` (**sole owner**; PKG-13 does not set) | `w.cathode_open`, `news.cathode_saved` |
| `side.corvid_archive` | `side_corvid_backup` | E5 cut, CP-C3 Loft +3 |
| `side.union_files` | `side_inheritance_drive` | Dad arc, news |
| `side.met_dialtone` | `side_church_basement` | finale copper route |
| `side.grandma_dark` | `side_grandma_pc` final visit | tone, `w.exposure` |
| `side.predictable` | `side_the_other_you` | meta |
| `side.zero_day` | `side_zero_day` | E7 coloring |
| `side.byteme_funeral_seen` | `side_byteme_funeral` | epilogue tone |
| `side.partner_knows` | `side_confession` | accomplice vs betrayed (Act III hide-you / turn-you-in) |
| `side.fabricated_evidence` | `side_divorce_drive` | conscience flavor |
| `life.landlord_footage` | `life_landlord_cameras` (**registry corrected to `life.*`**) | later leverage beat |
| `life.partner` (str) | romance ladder at `dating` | romance exclusivity, partner-scoped quests, E4 |
| `life.sold_out_for_mom` | CP-B3 A | Mom fate |
| `life.hood_carried_you` | CP-B3 C | `news.mom_fundraiser` |
| `life.mom_crisis_failed` | CP-B3 E (**text now lists it**) | Mom `passed`, `w.mom_gone` |
| `life.hacked_hospital` | `side_deadline_health` hack (**CP-B3 has no hosp-hack option; corrected**) | Aperture memory, Act IV beat |
| `life.phone_twist` | `life_get_off_the_phone` twist | one-time payoff |
| `life.family_shield/.family_may_report` | `life_family_finds_gear` | CP-B4 teaser / `main_a3_q6` +2 / Act III leverage |
| `life.y2k_safehouse` | `life_y2k_holdout` | Act IV heat-decay; E-SECRET alt |
| `life.webmaster_dark` | `life_dotcom_layoff_wave` | `life_webmaster_returns` cameo |
| `life.modem_song` | `life_modem_song` | mood/flavor |
| `life.dirty_bank_money` | CP-B3 D | `news.jax_arrest` bank variant, Act IV leverage |

*(Removed/renamed from the old registry: `a2.hinge_done`/`a3.mirror_revealed` are **gate inputs** and are listed in §12.3 as such; `a3.fed_the_wire` is an **E-SECRET double-source** via `end.doubles`, not a direct E-SECRET condition; `side.landlord_footage` → `life.landlord_footage`; the false "no flag read that is never set" claim is now backed by the §12.9 lint.)*

### 12.7 Numeric vars
`w.heatGain, w.contractPay, w.itSalary, w.rent, w.prices, w.techPrices` (mults, §11.1); `w.exposure, w.enclosure, w.public_opinion, w.hood_soul, w.mnsa, w.broadband, w.heat_lifetime, w.aperture_alerted, w.mill_open, w.datacenter_open, w.cathode_open, w.mom_gone, w.list_saved`; `a3.real_fates` (gate), `end.doubles`, `side.cover`, `kim_trajectory`, `factions_at_hostile` (computed), `npc.<id>.exposure`, `fac.bureau.handler_suspicion`, `life.extraUpkeep` (engine-read loan payments). Engine-owned: `act` (content-writable **only** by the three gate triggers), `sys.*`.

**Exposure sources (so `≥6`/`≥12` require side content):** `side_y2k_leftovers`, `side_overdue`, `side_uncles_pyramid`, `side_bbs_that_wouldnt_die`(no — that's enclosure), `side_konami_contact`, `side_the_other_you`, `side_grandma_pc` dark, `life_aunt_chain_letter`, `life_neighbor_scam_victim`, `fac_aperture_q2` skim, `fac_halcyon_q3` dig, `edu_lsu_q3`, `fac_northlink_q2` leak, `side_politicians_laptop`; plus investigative main beats `main_a3_q2` (+2), `main_a3_q5` (+2). Unconditional main beats grant **no** exposure.

### 12.8 Items (inventory-tracked)
| item | meaning | category / flags | granted | consumed/read |
|---|---|---|---|---|
| `item.aperture_sample` | portable evidence | **`misc`, `hidden:true`, `unique:true`** | CP-A2 B; Corvid hands back if `npc.corvid.trusts` | Oracle t2, evidence |
| `item.kroll_recording` | nuclear evidence | **`misc`, `hidden:true`, `unique:true`** | CP-B5 E; retry Act III; `fac_aperture_q2` skim; Hospital wire | Oracle t2, CP-D1, evidence |
| `item.priya_proof` | Priya's documentation | **`misc`, `hidden:true`, `unique:true`** | CP-C1 A / D-success / E | `end.has_evidence`; removed at CP-C1 C |
| `item.scene_archive` | Loft dead-man's-switch | **`misc`, `hidden:true`, `unique:true`** | `side_corvid_backup` guard | E5 cut, CP-C3 Loft +3 |
| `item.exchange_keys` | copper-exchange keys | **`misc`, `hidden:true`, `unique:true`** | `fac_hood_q5` (Marge honored/passed) | finale physical route |
| `item.old_tool` | dead phreaker's tool | **`tool`, `hidden:true`, `unique:true`** (so a raid can't take it) | `side_haunted_server` | terminal bonus |

**Confiscation as a story beat (optional, authored):** a raid may explicitly `{item:'kroll_recording',remove:true}` **only** in a dedicated scene, and **only** if not `a2.clean_raid` and not a `side_corvid_backup` off-site backup flag — never silently via the generic raid, because these items are `hidden`.

### 12.9 Registry generation & lint
§12 is produced by a build script that extracts every flag/var in **effect (set)** and **condition (read)** positions from §§6–9 and diffs the two sets. **CI fails** on: a read with no set; a set with no read; a flag in the wrong namespace; a var used as a flag or vice-versa; a `check` with no `failEffects`/`fail`; an objective with no `hint`; `w.heatGain` reachable above 1.45; any CP-D1 option resolving to E9.

---
## 13. CONTENT PACKAGES (18)

Content splits into 18 independent packages (ids **PKG-00 … PKG-18, with PKG-08 merged into PKG-07** — count corrected). **Ownership rule (enforced by §12.9):** each **enum/fate/flag has exactly one *writer* package**; others read it, or **request a change through a flag the owner's trigger consumes** (e.g. PKG-04 sets `a4.leverage='publish'` → a PKG-16 news rider / PKG-03 trigger writes `w.aperture_state='destroyed'`). **`w.heatGain`, `w.itSalary`, `w.hood_soul`, `w.exposure`, `w.enclosure`, `w.public_opinion` are the only shared, add-only multipliers/counters** — any package may `{var, add}`; **none may `set`** them except PKG-00 (init). Scenes/quests/missions belong to exactly one package.

### PKG-00 — Cast, Factions & World Registry (foundation; ship first)
- **Owns:** all `NpcDef` (§4 incl. §4.5 mirror/oracle and §4.8 minor cast: `grandma_ruth, uncle, webmaster, flamer, list_activist, okoro, northlink_wes`), all `FactionDef` (§3), `w.*` var **initial values** and string-flag enum inits (§11), item defs (§12.8), tier tables, the affinity/decay rules & `trig_affinity_decay` (§4.7), the speed-governor/timed-content hook (§5.3), the Chapter-Progress meta-quests (§5.5).
- **Sets (init only):** `var w.*` defaults, string-flag enum inits, npc `startsMet`/`startAffinity`. **`startsMet:true` for `mom, dad, kim, jax`.**
- **Reads:** none. Ship before all others.

### PKG-01 — Act I Main  ·  `main_a1_q*`
- **Owns:** `main_a1_q1_boot_sequence … main_a1_q6_grandma_job`; scenes `a1_boot_forum, a1_compcastle, a1_back_room, a1_mira_dunk, a1_grandma_discovery`; **`trig_act2_gate`**, `trig_a1_gate_pair`, `trig_a1_two_side_done`.
- **Sets:** all `a1.*`; `item.aperture_sample`; seeds `npc.mira.*`, `npc.corvid.trusts`; publishes `news.mill_layoffs`/`news.aperture_alerted` (deltas owned by PKG-16). **Writes `act` only via `trig_act2_gate`.**
- **Reads:** faction reps, skills, side-quest completion.

### PKG-02 — Act II Main  ·  `main_a2_q*`
- **Owns:** `main_a2_q0a_settling_in, main_a2_q1a_mirror_lock, main_a2_q1 … q7`; scenes `a2_kroll_dinner, a2_jax_3am, a2_mom_bills, a2_the_raid, a2_jail, a2_mira_wall, a2_hinge`; the Oracle IIb drops; the first-raid/first-blood selector; **`trig_first_raid`**; the mirror **identity lock** (writes `mir.identity`; PKG-03 owns `mir.outcome`).
- **Sets:** all `a2.*` (incl. `a2.spine`); `item.kroll_recording`; `npc.jax.*` (except `.flipped`, PKG-07), `fac.aperture.client/retainer`, `npc.kroll.wary`, `npc.priya.warned_you/.debt`, `fac.bureau.informant*`/`.on_radar`, `npc.grace {met}`, `npc.mom.fate`, `life.sold_out_for_mom/.hood_carried_you/.mom_crisis_failed/.dirty_bank_money`, `mir.identity`.
- **Reads:** `fac.halcyon.employed` (PKG-09), `npc.mira.*` (PKG-01), `w.aperture_state` (PKG-16-written), side loyalty flags for the neglect selector.

### PKG-03 — Act III Main  ·  `main_a3_q*`
- **Owns:** `main_a3_q1 … q8` (incl. `main_a3_q5_the_list`, the two `q6` variants); scenes `a3_oracle, a3_priya, a3_wire, a3_mirror, a3_family, a3_vote`; the Oracle-identity & mirror-outcome resolvers, the vote formula, the heist routes & crew; **`trig_act3_gate`, `trig_act4_gate`**, `trig_a3_committed`, `trig_a3_own_branches`, `trig_datacenter_open`.
- **Sets:** all `a3.*`; `mir.outcome/.pyrrhic/.mercy`; `npc.mira.betrayed`, `npc.priya.silenced/.you_covered`, `npc.kroll.charged/.wants_you`, `npc.hollis.your_ally`, per-NPC `.warned`, `npc.<id>.exposure`; publishes the MNSA/Meridian/Aperture-exposed headlines (**deltas owned by PKG-16**); `var a3.real_fates`, `w.exposure(+)`, `w.enclosure(+)`, `w.public_opinion(+)`. **Writes `act` only via the two gate triggers.**
- **Reads:** items, `npc.dee.council`, `a2.*`, all inner-circle affinities, `end.has_evidence`.

### PKG-04 — Act IV & Endings  ·  `main_a4_q*`
- **Owns:** `main_a4_q1 … q4`, `main_a4_q2b_bonfire`, `main_a4_q3b_the_exchange`; scene `a4_leverage`; the **§4.6 fate-finalization table**; the **finale grand-check** (computed); **all `EndingDef`** (E1–E10 + E-SECRET, §10) with conditional `epilogues[]`; the priority matrix/assembler & its enumeration test; **`trig_evidence`**.
- **Sets:** `a4.leverage`/`.leverage_done`/`.finale_done`, `end.*` (incl. `end.has_evidence`, `end.uncommitted` is written by PKG-03's gate but read here), `ending`; finalizes every `npc.*.fate`; requests `w.aperture_state='destroyed'` via a PKG-16 rider on `a4.leverage='publish'`.
- **Reads:** everything (the cash-out).

### PKG-05 — Faction Arc: The Loft  ·  `fac_loft_q*`
- **Owns:** `fac_loft_q1 … q6`; the journal-mirror `fac_loft_q4_solidarity`.
- **Sets:** `fac.loft.*` (incl. `.sysop` str), `w.scene_state`, `npc.corvid.fate` (**sole writer**; the first raid sets only the `npc.corvid.charged` **flag**, PKG-02), `npc.switch.fate`.
- **Reads:** `fac.loft` rep, `w.itSalary`, `a2.solidarity`, `npc.corvid.charged`, `side.corvid_archive`.

### PKG-06 — Faction Arc: Aperture  ·  `fac_aperture_q*`
- **Owns:** `fac_aperture_q1 … q6`; the Hospital Job & the **single** Made-offer scene (launched by CP-D1 E).
- **Sets:** `fac.aperture.*`, `npc.kroll.fate` (**sole writer**; heist/CP-D1 set the `.charged`/`.made_you`/`.flips_set` flags it reads), `npc.hollis.fate`, `a2.building_a_case` (shared with PKG-09 — **both `add`-style flag sets, non-conflicting**; listed), `npc.corvid.bought` (broker), `npc.grace.fate` (Hospital Job).
- **Reads:** `fac.aperture` rep, `a3.truth_t3`, `npc.kroll.wants_you`, `npc.grace.met`.

### PKG-07 — Faction Arc: The Bureau & PD Cage  ·  `fac_bureau_q*`, `fac_cage_q*`  *(PKG-08 merged here)*
- **Owns:** `fac_bureau_q1 … q6`, `fac_cage_q1 … q3`; scenes incl. the flip, wire, burn-notice, Calderon cameos.
- **Sets:** `fac.bureau.*`, `npc.reyes.fate`+`.testifies/.broke_whistle`, `npc.marlow.fate`+`.exposed`, `npc.calderon.fate`+`.ally_case`, `npc.jax.flipped` (sole writer), `end.doubles(+)` (shared add-only).
- **Reads:** `fac.bureau` rep, `a2.first_raid_resolved`, inner-circle fates for the burn target (`available()`).

### PKG-09 — Faction Arc: Halcyon, LSU & NorthLink  ·  `fac_halcyon_q*`, `edu_lsu_q*`, `fac_northlink_q*`
- **Owns:** `fac_halcyon_q1 … q6` (incl. `q6_founders`), `edu_lsu_q1 … q4`, `fac_northlink_q1 … q3`.
- **Sets:** `fac.halcyon.employed/.looked_away/.made_partner`, `npc.vale.reformed/.fate`, `npc.priya.fate` (cofounder), `npc.okoro.fate`, `npc.northlink_wes.fate`, `w.halcyon_state` (requested via PKG-16 riders; **`clean` sole via `news.halcyon_clean`**), `end.clean_startup`.
- **Reads:** `fac.halcyon` rep, degree, `a2.building_a_case`, `w.exposure`.

### PKG-10 — Faction Arc: The Neighborhood  ·  `fac_hood_q*`
- **Owns:** `fac_hood_q1 … q5`; Save-the-Cathode, Coming-Home, the dialtone keys handoff, `trig_marge_keys`.
- **Sets:** `w.hood_soul(+)` (shared), `w.cathode_open`, `side.saved_cathode` (**sole writer**), `npc.sal.fate`, **`npc.dad.fate` (sole writer, per §4.6)** — other packages set only `npc.dad.business/.mill_job/.dating` steering flags, `npc.dialtone.fate`, `item.exchange_keys`.
- **Reads:** `fac.hood` rep, `side.met_dialtone`, `w.mom_gone`, `npc.dad.*` steering flags.

### PKG-11 — Side: Family & Romance  ·  `side_` (family/romance) + Kim arc
- **Owns:** `side_y2k_leftovers, side_kims_login, side_kim_logs, side_kim_essay, side_slideshow, side_uncles_pyramid, side_dads_profile, side_inheritance_drive, side_coffee_warm, side_grace_first_date, side_two_lives, side_ridgeport, side_meet_parents, side_proposal_server, side_confession, side_long_distance, side_wedding`.
- **Sets:** `side.dad_truth/.dad_spared`, `kim_trajectory`, `npc.kim.*` steering, `side.slideshow_*`, `side.union_files`, `side.cover`, `side.partner_knows`, `life.partner`, `npc.mira/.grace` romance states.
- **Reads:** `npc.mira.trusts`, `npc.grace.met`, partner romance state, `w.mom_gone`.

### PKG-12 — Side: Friends & Freelance  ·  `side_` (friends/freelance)
- **Owns:** `side_jax_sister, side_byteme_snowday, side_vanishing_highscore, side_deadline_dog, side_deadline_health, side_corvid_backup, side_reunion_lan, side_loft_calls_it_in, side_divorce_drive, side_overdue, side_wedding_avi, side_church_basement, side_politicians_laptop`.
- **Sets:** `npc.rosa.fate`, `npc.byteme.used`, `npc.deadline.saved_you/.relapse/.fate`, `life.hacked_hospital`, `side.corvid_archive`, `item.scene_archive`, `side.met_dialtone`, `side.fabricated_evidence`, `w.exposure(+)` from breadcrumbs.
- **Reads:** friend affinities & fates, `fac.loft.marked`.

### PKG-13 — Side: Neighborhood, Oddities & the Grandma Recurrence
- **Owns:** `side_haunted_modem, side_51_floppies, side_bbs_that_wouldnt_die, side_press_any_key, side_konami_contact, side_tamagotchi_triage, side_haunted_server, side_dee_for_council, side_grandma_pc`.
- **Sets:** `side.grandma_dark`, `item.old_tool`, `npc.grandma_ruth.fate`, `npc.dee.encouraged/.council` (via `side_dee_for_council`, shared with PKG-15's `trig_dee_council` — **both write `npc.dee.council`; the council flag is idempotent-set, and the two paths are mutually exclusive by design**), `w.exposure(+)`. **Does NOT set `side.saved_cathode` (PKG-10) or `w.enclosure` (PKG-14).**
- **Reads:** `fac.hood`, `npc.dee`, `npc.kim`, `side_haunted_modem` completion.

### PKG-14 — Side: Dark & Late-Game
- **Owns:** `side_wire_you_planted, side_the_other_you, side_zero_day, side_byteme_funeral`.
- **Sets:** `side.predictable, side.zero_day, side.byteme_funeral_seen`, `w.enclosure(+)` (incl. the `side_bbs` harvest, which PKG-13 **routes to** this package via a shared beat), `npc.grace {met}` fallback (zero_day).
- **Reads:** `a1.sold_tool`/`npc.byteme.used`, `npc.byteme.fate`, `a3.truth_t3`, `w.enclosure`, health/stress.

### PKG-15 — Life & Random Events  ·  `life_*` + system directors
- **Owns:** all `life_*` triggers (§9); `trig_dee_council, trig_director, life_drift_ping`, `trig_datacenter_open` (coordinated with PKG-03 — PKG-15 owns the trigger, PKG-03 reads `w.datacenter_open`).
- **Sets:** `life.phone_twist, life.family_shield/.may_report, life.y2k_safehouse, life.webmaster_dark, life.modem_song, life.landlord_footage`, `npc.dee.council` (see PKG-13 note), `npc.dad.mill_job` (steering; PKG-10 finalizes), `npc.webmaster.fate`, `npc.flamer.fate`, `var w.broadband` (era steps), `var w.datacenter_open`.
- **Reads:** housing, stats, `w.aperture_state`, `w.enclosure`, `w.mnsa`, date.

### PKG-16 — News, Forum & World-Var Wiring
- **Owns:** all `NewsDef` (§11.4) **and every world-var delta attached to a headline** (the single-count rule); `ForumThreadDef` flavor (`*hugz*` motif, guestbooks, the toaster gag, the reactivity layer of PKG-18? — see PKG-18); `trig_bureau_office, trig_heat_lifetime, trig_repeal, trig_halcyon_ipo, trig_halcyon_dead`; the motif-inversion scenes (§6.E).
- **Sets:** the `w.*` deltas on news `effects` (heatGain/itSalary/rent/hood_soul/mnsa/aperture_state/…); `w.surveillance`. **Sole writer of every news-attached world delta.**
- **Reads:** all `w.*`, fates, faction reps (for `ambient` conds).

### PKG-17 — Terminal Missions  ·  `mission.*`
- **Owns:** `mission.a1_library, mission.a2_meridian_recon, mission.a3_signal_intelligence, mission.a4_copper` (the copper-exchange finale); the standardized auto-resolve (one primary skill) per mission.
- **Sets:** `mission` outcomes (engine), heat riders on failure.
- **Reads:** crew/gear modifiers, `item.exchange_keys/.old_tool`, skills.

### PKG-18 — Jobs, Story Contracts, Buffs & Reactivity
- **Owns:** all `JobDef` (`job_compcastle_bench, job_halcyon_junior`, the Aperture-employer job `job_aperture_analyst`, the NorthLink sysadmin/network jobs, dev/security ladder jobs); all story `ContractDef` (`contract.a1_crack_starter`, Kroll's CP-B1 job, Jax's hot contract, the CP-B3 A/D jobs, the `fac_aperture_q2` retainer template, Bureau "delivery" template, Row-volunteering block); all `BuffDef` (retainer income, y2k safehouse, grief stress, burnout is engine); the **reactivity layer** (per-major-flag BuddyPager/forum/mail reactions, the Journal "Ledger" that shows each rep change with its cause, "They'll remember that" toasts); the cross-faction penalty **numbers** table (§3); the LSU degree ids `prog.lsu_cs_assoc/_bs`.
- **Sets:** job/contract availability; reactivity is read-only (reads flags/fates/rep, emits scenes/forum/notify).
- **Reads:** everything that has a public consequence.

**Collision protocol.** Where two packages touch a flag: the **owning** package writes it; the other **only branches on it** via a scene the owner triggers, **or** requests the change through a flag the owner's trigger consumes. `w.heatGain, w.itSalary, w.hood_soul, w.exposure, w.enclosure, w.public_opinion, end.doubles` are **shared add-only**; only PKG-00 may `set` (init). The §12.9 lint enforces one *set-writer* per enum/fate and the shared-add rule.

---

## 14. FIXES APPLIED (traceability vs. the reviewer pass)

**Structural / critical.**
- **Act I chain** (q4→q5→q6): removed q4's `start` of q5; q5 keeps its dated autoStart and starts q6; q6 also autoStarts on `a1.dad_laid_off & day≥90`. `a1.grandma_done` is always reachable.
- **Act gates are persistent triggers** `trig_act2/3/4_gate` (once, hourly), each writing `act` and starting the next act's q1. `act` is content-writable **only** by these three. PKG-03 owns `trig_act4_gate`.
- **E9 unconditional** (last row); `end.uncommitted` only picks its variant; an assembler enumeration test asserts exactly one ending always fires and no CP-D1 option resolves to E9.
- **CP-D1 stored as `a4.leverage` (str)** and made the ending matrix's primary key; E1=publish, E2=sell|made, E3=handoff, E4=bury|none, E8=bonfire|scorched, E10=halcyon+ascend/founder.
- **`a2.spine` (str)** stored at CP-B5 A–F (incl. new **F Loft**); CP-C3 routes & E1/E2/E6/E10 read it.
- **Grace met + full romance ladder** (flirting→dating→partner→engaged→married), `side_wedding`, `life.partner` exclusivity; E4 reads `romance:'married'` + a family-anchor alt.
- **Mirror**: selector normalized & `available()`-filtered, loyalty quests defined, `stranger` fallback (`npc.flamer`); outcome stored only in `mir.outcome` (never onto the underlying NPC's fate).
- **Pacing math** restated in game-days + real-time @1×/2× (~9–13 h); gates calibrated & actually gating (`a1.two_side_done` replaces the free `a1.bond_jax`; exposure only from side/investigative beats; thresholds 6/12); speed governor; beat calendar.
- **Act IV re-scoped** (floor day 3400): per-ally last-favor quests, faction q6 finales sequenced in `main_a4_q2` `finales` stage, and **`main_a4_q3b_the_exchange`** written as a 3–4-stage set piece; no time-skip verb needed.
- **First raid can't soft-lock** (`trig_first_raid` with date fallback + clean-player Corvid default; `sys.no_raids` until resolved); CP-B4 branch per selector output incl. byteme & exposed-Jax; arrest-opens-a-branch authored (`scene.a2_jail` flip + `trig_bureau_flip_offer`).
- **Evidence earnable many ways** (`end.has_evidence` derived; fragments; retryable recording; Corvid hands back sample); CP-D1 always offered; Corkboard in the Journal.
- **Central theme mechanized** (§4.7 affinity/decay/drift/loyalty).

**Engine alignment.** Removed every non-existent op (`var…mult`, `faction…set`, `hospital`, multi-skill/averaged checks, time-skips, `sys.earnedTotal`, `{day:{gte}}`, `sys.hospitalized`-as-flag); `life_hospital_bill` no longer double-charges; §0.1 gives the canonical rewrite for each.

**Consistency.** Fate finalization table (§4.6, one writer per fate); Dad timeline & datacenter fixed; Mom crisis gaps closed (pay option, estranged branch, denial handling); Kroll `arrested` rule reconciled with CP-C3 via `.charged` flag; single "decisive evidence" definition; item categories/`hidden` set so raids can't eat evidence; news riders own every world delta (single-count; `w.heatGain ≤ 1.45` test); §13 ownership regenerated (one set-writer per enum/fate; shared add-only counters); every faction step given an autoStart + act window; duplicated beats → journal-only mirror quests; enum inits in PKG-00; MNSA vote formula pinned (sign, bands, defined terms, Dee actually swings); Oracle timing/tiers/dead-candidate exclusion; the List gaps (fail branch, onTimeout, dynamic slots, sweep fates moved & guarded, epilogue readers); E-SECRET/E8 reachable (`end.doubles` var, rep-pattern/bonfire); E4/E6 conditions relaxed; darker cuts from `end.finale_fail`, E7/E9 exempt; epilogue text turned into conditional TextParts.

**Content depth / balance.** Repeatable rep per faction + gate failsafe; heat-valve raid pacing & the Arrested branch; skill-check distribution (≥2 routes per main CP, Programming/Networking/Fitness added, combined = one skill + shown bonus); reactivity layer (Ledger, forum rumors, "they'll remember that"); side-quest mechanic tags & act redistribution; idle money sinks (bail, treatment, college fund, seed capital, housing) via PKG-18; Halcyon/legit ending (E10) + LSU + NorthLink + Calderon + Hollis arcs; Dee gag setup & payoff; List cost made visible; enclosure cap raised to 10.

**Minor.** Ids normalized to full/bare (no `scene.`/`mission.` prefixes; `a1_boot_forum`; `fac_hood_q2_dad`, `side_reunion_lan`, `life_dads_resume`); `sub.loft` → board `'warez'` + rep; `npc.aperture.*`/`npc.bureau.*` → `fac.*`; proposal leftovers replaced (Ledger→Aperture Special Accounts, AQUIFER→PARALLAX, Custodian→Oracle, Kessler→Harbor Point, Walt→Robert, steel→paper, Vire→the Lumen Sound, Guild/Undertow clauses & drafting notes deleted, `life_aunt_rosa_chain`→`life_aunt_chain_letter`); Jax fate `partner`→`backroom_partner`; stray fate values folded into the closed §4 enums; news headline ages/bodies corrected; registry rows corrected & the "no unset read" claim backed by the §12.9 lint; hints on every objective; Chapter-Progress meta-quest; Marge finale kindness path; Kim causation deepened.

---

## 15. IMPLEMENTATION NOTE

Everything above drops into the engine's data layer (`src/engine/types.ts`):
- **Scenes** = `SceneDef` dialogue trees (`nodes`, `choices[] {text, if?, req?, reqText?, check?, effects[], goto?}`), channels `dialog|mail|chat|forum`.
- **Quests** = `QuestDef {id, kind, act, stages[] {objectives[{when,hint}], onEnter, onComplete, next, timeLimitDays, onTimeout}, autoStart, hints}`.
- **Triggers** = `TriggerDef {when, effects, once?, cooldownDays?, chance?, atHour?}` — the act gates, director, decay, era, and glue triggers of §5/§9.
- **Effects** = the §0 canonical verb set; **skill checks** = `{skill, dc, bonuses[], success, fail, successEffects, failEffects}` — one skill each, failure branches first-class (CI-enforced).
- **Faction rep** = five signed scalars with §3 tiers; cross-faction penalties are **authored `{faction,add}` effects** (logged as feedback), not a hidden hook.
- **NPC fates** = the single `npc.<id>.fate` string field, finalized once by the §4.6 table in `main_a4_q1`, read by the §10 assembler.
- **World** = the §11 vars/flags; the sim reads `w.heatGain/contractPay/itSalary/rent/prices/techPrices`; the three documented engine extensions (§0.2) are additive.
- **Three engine hooks assumed** (small, additive): the speed governor + timed-stage jail-pause (§5.3), the finale computed-pool on-enter (§0.2), and a `'loft'`-equivalent board handled here by `'warez'` + rep gate.

Light start, dark turn; setbacks not game over; D&D-style checks with interesting failure; and an idle career/hacking/life loop that always has something to do between beats — all supported and now internally consistent.

*End of STORY BIBLE (Revision 2).*
