# HACKERSIM — Story Proposal B: "The Silent Owner"

*A conspiracy-driven techno-thriller campaign for HACKERSIM.*

> Design note: everything below is written to be implementable as data. Named entities use `id`-style handles so they can become records. Choices are written as **CHOICE POINT** blocks with options, skill checks, and consequences expressed as `flags`, `rep` deltas, NPC `fate` changes, and `world` variable changes. Terminal missions are marked and always paired with an auto-resolve fallback. This is a *fiction / game design* document; all "hacking" is abstracted game mechanics (dice rolls, skill checks, resource management) in the tradition of Uplink and Watch_Dogs, not real-world technique.

---

## 1. Logline, Themes, Tone Shift

**Logline.** In the autumn of 2001, a broke eighteen-year-old fixes a neighbor's infected PC for pocket money — and finds a program on it that shouldn't exist. Over a decade, chasing that thread from a dial-up bedroom to the server rooms of a telecom giant, they discover that half the city is quietly wired into a surveillance-and-control system called **AQUIFER**, and that everyone who could stop it is either bought, scared, or already inside it. The player decides who owns the future: the state, the corporation, the underground, or no one.

**Core themes.**
- **Ownership of information.** Who owns the data you leave behind just by living? The title "The Silent Owner" refers to whoever ends up controlling AQUIFER — and the game keeps asking the player if it should be them.
- **Complicity by degrees.** Nobody wakes up a villain. The game escalates through small, defensible choices ("just this once", "it's only metadata", "they'd do it to me").
- **The cost of seeing clearly.** Paranoia as both survival skill and disease. OPSEC keeps you alive; it also isolates you.
- **Nostalgia rotting into dread.** The warm, dumb optimism of the early web curdling into the surveillance age. The game is, structurally, an argument that the second thing grew out of the first.

**Tone shift across acts.**
- **Act I — "Beige Boxes" (light).** Slice-of-life comedy. Fixing grandma's PC, dial-up screeching, forum flame wars, a boss who thinks the internet is a physical place. The conspiracy is present only as an itch: a weird file, a coincidence, a stranger who's too interested. Stakes are social and financial.
- **Act II — "Handshake" (warming, then cooling).** The player is now competent and connected. Freelance and underground work pays. The comedy continues but the jokes start landing on real people getting hurt. First deaths, first betrayals, first time the player realizes they were used. The itch becomes a pattern.
- **Act III — "Deep Packet" (dark).** Full techno-thriller. The city's institutions are compromised; the player is a person of interest; NPCs disappear. Moral grey soup — every faction wants to *use* AQUIFER, not destroy it. Dark humor survives as gallows humor.
- **Act IV — "Root" (climax + resolution).** Endgame. The player has leverage over the whole system and must decide what to do with it. Consequences of every prior choice cash out. Tone: opera. Then a quiet, human epilogue.

---

## 2. World

### The city: **Halvern**
A fictional mid-sized river city (~600,000 people) in a generic English-speaking country. Old industry (steel, a defunct typewriter/electronics plant) went bust in the 80s–90s; the local government bet the city's recovery on becoming a **telecom and data hub**. Cheap land, tax breaks, and a fat fiber trunk laid along the old rail line drew server farms and call centers. Everyone's uncle either lost a factory job or got a headset job. Grey, rainy, proud, broke. Districts:

- **Rowan Heights** — where the player starts. Working-class flats, the parents' apartment, a strip mall with a computer shop and a check-cashing place.
- **The Grid** — downtown business core; glass towers of the telecom and finance companies. Feels like a foreign country to a Rowan Heights kid.
- **Old Foundry / The Stacks** — decommissioned steel works turned into the region's biggest data center campus. Chain-link, floodlights, humming cooling towers. Later: the physical heart of the conspiracy.
- **Deller University campus** — commuter college; the player can enroll here.
- **Nix Alley** — a real alley behind an electronics wholesaler that became the informal hardware black market; also the meatspace meeting spot for the local underground.
- **Sublevel** — not a place, a state of mind: how locals call the region's BBS-turned-web underground.

### Era details (Sept 2001 onward)
Dial-up screech, busy signals, "get off the phone I'm downloading", $19.95/mo ISP, AOL-style discs everywhere, ICQ/uh-oh sounds, Napster's corpse and its imitators, the dot-com crash still fresh (companies folding, laid-off "webmasters"), Y2K jokes, LAN parties, burned CD-Rs, IE vs Netscape, the smell of a warm CRT. As years pass: broadband arrives, phones get cameras, social networking is born, laptops get cheap, "cyber" becomes a headline word after real-world scares. The world clock drives fashion, tech prices, salaries, and slang.

### Notable organizations / companies / places (10)

1. **Halcyon Telecom (`org_halcyon`)** — regional telecom giant; owns the fiber trunk, most DSL, and the Old Foundry data center. Public face of the city's revival. Secret owner/operator of **AQUIFER**. The prestige employer.
2. **Meridian Data Systems (`org_meridian`)** — Halcyon's data-center contractor; runs the physical servers. Bland, underpaid, overworked. A great place to get inside without anyone noticing you.
3. **CompuCabin (`org_compucabin`)** — the Rowan Heights strip-mall computer shop. Player's likely first real job. Owned by lovable cheapskate **Merle**.
4. **Nakamura & Voss / "N&V" (`org_nv`)** — a boutique security-consulting firm; does pen-tests for banks. Legit path's peak. Ethically slippery.
5. **Deller University (`org_deller`)** — commuter college; CS department, an ambitious professor, a computer lab that becomes a plot location.
6. **First Halvern Savings (`org_fhs`)** — regional bank; target, victim, and later an unexpected ally against Halcyon.
7. **The Halvern Herald (`org_herald`)** — city newspaper, fading, with one bulldog reporter. The player's route to going public.
8. **State Bureau field office (`org_bureau`)** — federal law-enforcement cyber unit; runs "the Task Force." Not evil, not clean — hungry for AQUIFER for its own reasons.
9. **Sublevel / the board (`org_sublevel`)** — the underground forum itself as an institution: mods, a reputation economy, factions within.
10. **Ferris & Kline Logistics (`org_fk`)** — a "shipping company" that's a front for a carding/fraud crew; nostalgic-seedy, a way into the criminal economy.
11. *(bonus)* **Bright Horizons Assisted Living (`place_brighthorizons`)** — where a key NPC's mother lives; late-game reveals AQUIFER touches even here (billing, cameras). Used to make surveillance feel personal.

---

## 3. Factions (5)

Reputation is tracked per faction, range **-100..+100**, with named tiers. Rep rises by completing that faction's quests, choosing dialogue that flatters their worldview, and hurting their rivals; falls by betrayal, siding with rivals, getting caught embarrassing them, or public exposure. High rep unlocks arcs, gear, safehouses, and unique endings; hostile rep triggers harassment events. Every faction's ultimate goal is **AQUIFER**, which is what makes the endgame a four-way (plus one) standoff.

### F1 — **The Sublevel** (`fac_sublevel`) — the underground
- **Goal:** keep the net free, weird, and theirs. Split internally between old-guard hacktivist idealists and new-money criminal opportunists.
- **Leaders:** `zerocool_grandpa` (real name **Art Deng**), 40s, founding sysop, principled, tired. And **`vandal`** (real name **Kesh**), 20s, charismatic, wants to *sell* AQUIFER access, not burn it.
- **Offers:** contracts, gear discounts at Nix Alley, safehouse, exploits ("methods"), and the "burn it all" endgame path.
- **Rep up:** complete contracts without collateral damage, protect other members from the Bureau, share methods freely. **Rep down:** snitch, hoard, work openly for Halcyon or the Bureau, get sloppy and raise heat on the whole board.
- **Conflict:** hates the **Bureau** most; despises **Halcyon**; ambivalent toward **N&V** ("sellouts, but useful").

### F2 — **Halcyon Telecom** (`fac_halcyon`) — the corporate-state machine
- **Goal:** own the region's information layer completely; AQUIFER is their crown jewel, sold quietly to advertisers, insurers, and the government. Growth, deniability, control.
- **Leaders:** **Lenore Vance** (`npc_vance`), VP of "Network Assurance," the human face of the machine; and above her the near-invisible **The Steward** (see cast), who *is* AQUIFER's silent owner.
- **Offers:** money, the legit prestige career, resources, protection from the law, and the "become the owner" endgame.
- **Rep up:** take their jobs, keep quiet, deliver people or data they want, sabotage rivals. **Rep down:** leak, help the Herald, help the Sublevel, refuse the ask.
- **Conflict:** manages the **Bureau** (regulatory capture); buys **N&V**'s silence; wants the **Sublevel** eradicated; treats **First Halvern** as a client to be milked.

### F3 — **The Task Force** (`fac_bureau`) — federal cyber law enforcement
- **Goal:** stop cybercrime, yes — but the ambitious agents also want to *seize* AQUIFER as the ultimate investigative tool. Order, career advancement, and a very convenient god-view of the city.
- **Leaders:** **Agent Dana Cho** (`npc_cho`), by-the-book but idealistic and increasingly disillusioned; and **Agent Ruttker** (`npc_ruttker`), who wants AQUIFER for the Bureau and will bend anything to get it.
- **Offers:** immunity deals, a "confidential informant" career, clean records, witness protection, and the "hand it to the state" endgame.
- **Rep up:** flip contacts, feed them intel, wear a wire, deliver Halcyon or Sublevel heads. **Rep down:** burn CIs, expose their overreach, stay dark.
- **Conflict:** legally over the **Sublevel**; captured by **Halcyon** at the top but with honest agents fighting that; uses **N&V** as deputized experts.

### F4 — **Nakamura & Voss** (`fac_nv`) — the legit-but-slippery security firm
- **Goal:** money and reputation; be the trusted third party everyone hires. They *know* about AQUIFER and have chosen to profit from silence. Represents the "adult" compromise.
- **Leaders:** **Priya Nakamura** (`npc_priya`), brilliant, mentor-shaped, morally exhausted; and **Gil Voss** (`npc_voss`), the rainmaker who sold out years ago.
- **Offers:** the top legit salary, elite training, tools, a respectable identity, and the "reform from within / whistleblow professionally" endgame.
- **Rep up:** do clean professional work, keep client confidence, bring them the truth quietly. **Rep down:** go rogue, embarrass a client, leak, work criminal jobs under their nose.
- **Conflict:** paid by both **Halcyon** and the **Bureau**; quietly contemptuous of the **Sublevel** but recruits from it.

### F5 — **The Herald / the Public** (`fac_public`) — the light of day
- **Goal:** the truth, printed. A stand-in for "the public interest." Weakest faction, no muscle, easiest to get killed — but the only one that can end AQUIFER by *exposure* rather than *capture*.
- **Leaders:** **Frank Osei** (`npc_osei`), veteran investigative reporter with a failing paper and a spine; and the crusading blogger **`glasshouse`** (real name **Tam**).
- **Offers:** no money, but leverage, moral clarity, protective publicity ("too public to disappear"), and the "burn it in the open / go public" endgame.
- **Rep up:** feed verified documents, protect sources, go on record. **Rep down:** feed false leads, get a source killed, cut a private deal instead of publishing.
- **Conflict:** hunted quietly by **Halcyon**; distrusted by the **Bureau** ("you'll blow our case"); used and used-up by the **Sublevel**.

---

## 4. Cast (18 NPCs)

Format: `handle` — Name, role — *voice sample* — arc — possible fates.

1. **`beige_wizard`** — **Merle Tannhauser**, owner of CompuCabin, first boss. — *"Son, if the internet's down, you reboot the internet. That's the whole job."* — Comic mentor; secretly proud of the player; his shop is failing as big-box stores arrive. Arc: keep the shop alive, or watch him get bought out. **Fates:** retires happy (player saves shop) / bitter and broke / dies of a heart attack mid-Act-III, leaving the player his old server as inheritance (and a clue).

2. **`zerocool_grandpa`** — **Art Deng**, Sublevel founding sysop. — *"I ran a board when 'online' meant one guy at a time. I've watched three of these panics. This one's different. This one remembers you."* — Idealist mentor; wants to expose AQUIFER but won't hurt bystanders. **Fates:** martyr (arrested/dies protecting the board) / exiled abroad / lives to see it burn / betrayed by the player into the Bureau's hands.

3. **`vandal`** — **Kesh Mowatt**, ambitious Sublevel up-and-comer. — *"Idealism's a luxury for people whose lights are on. I want to sell the map, not set fire to it."* — Rival/foil; wants to monetize AQUIFER. Can be the player's partner-in-crime or nemesis. **Fates:** becomes the new Silent Owner (if player enables) / arrested / killed by Halcyon / redeemed by the player / kills the player's ally.

4. **`dialup_dana`** — **Agent Dana Cho**, Task Force. — *"I joined to catch predators. Now my boss wants me to build one. Help me not become the thing, and I'll keep you out of a cell."* — The honest cop; the player's possible conscience inside law enforcement. **Fates:** whistleblower hero / scapegoated and fired / promoted into complicity / dead (if she pushes too hard alone) / the player's romance.

5. **`ruttker`** — **Agent Cole Ruttker**, Task Force. — *"Privacy is a preference. Safety is a mandate. I know which one testifies at my hearing."* — Antagonist-shaped fed who wants AQUIFER for the state. **Fates:** gets AQUIFER (bad ending) / exposed and disgraced / dies / becomes an uneasy ally against Halcyon if the player plays factions off.

6. **`ln_vance`** — **Lenore Vance**, Halcyon VP. — *"We don't spy, sweetheart. We provide continuity of service. People love continuity."* — Polished corporate antagonist; true believer that control is care. Can be seduced (professionally) into a schism against the Steward. **Fates:** ascends to run AQUIFER / falls in a boardroom coup / flips against the Steward (player-enabled) / prison / quietly retires to an island.

7. **`the_steward`** — **? / "The Steward"** — the Silent Owner. Identity is a mid-game reveal. — *"I don't own anything. Ownership is a liability. I simply make sure the water keeps flowing."* — The mystery at the center. Candidate identities the writing supports: a founder of Halcyon presumed dead; or **Art Deng's** old BBS partner; or a composite AI-ish committee. **Fates:** unmasked and destroyed / escapes with a backup / *is the player* (a chilling ending) / never existed as one person (the deepest reveal).

8. **`priya_n`** — **Priya Nakamura**, N&V partner, mentor. — *"I found AQUIFER in '99. I wrote a report. They bought the report, and my house. Ask yourself what your silence costs before you sell it, because someone will name a price."* — Tragic mentor; wants the player to do what she couldn't. **Fates:** finally testifies / bought again / dies with the report unfinished / hands the player her life's evidence.

9. **`gil_voss`** — **Gil Voss**, N&V rainmaker. — *"Ethics are a competitive disadvantage I can't afford this quarter."* — Smooth sellout; comic-then-sinister. **Fates:** exposed / flees / becomes an unexpected source out of spite / dies in the boardroom coup.

10. **`osei`** — **Frank Osei**, Herald reporter. — *"I've got column inches and a mortgage and exactly one nerve left. Bring me something I can print without getting sued into the river, and I'll make this city look."* — The public conscience; the player's route to daylight. **Fates:** publishes the story of the decade / killed/silenced (raises the stakes hard) / discredited with planted lies / wins a prize, loses everything.

11. **`glasshouse`** — **Tam Osei**, Frank's estranged kid, blogger. — *"Dad thinks the truth needs permission. I just hit publish."* — Reckless idealist; new-media foil to old-media Frank. **Fates:** doxxed and ruined / becomes a movement / dead / reconciles with Frank.

12. **`mom` / `dad`** — **Renata & Bill Koveric**, the player's parents. — Mom: *"I don't care what it pays, I care that men in jackets came to my door."* Dad: *"Your grandfather worked the Foundry forty years. Now you work... the Foundry. Funny old world."* — The life-sim anchor. Dad worked the steel plant now a data center; Mom cleans offices in the Grid. Arc: pride vs. fear; money troubles; Dad's heart. **Fates:** proud and safe / evicted (money quest fails) / Dad dies (health event; can be prevented with money/time) / one parent learns the truth and either shields or reports the player.

13. **`sib`** — **Josie Kovaric**, 14 at start, kid sister. — *"Teach me the cheat codes for real life, dorkface."* — Grows up across the game; can follow the player into tech, or into trouble. Late-game she can be endangered by the player's enemies — the emotional pressure valve. **Fates:** becomes a hacker herself / a cop (irony) / hurt because of the player / thriving, oblivious, safe.

14. **`solder_queen`** — **Bex**, Nix Alley hardware dealer. — *"You want fast, cheap, or not-on-a-list? Pick two. Ha. Pick one."* — Comic-relief fixer, gear source, gossip conduit. **Fates:** busted (player can warn her) / goes legit selling to Meridian / becomes a key smuggler of the player's data out of the city.

15. **`headset_hank`** — **Hank Ojo**, Meridian night-shift tech, later friend/inside man. — *"Twelve dollars an hour to guard the machines that watch me. You laughing? I'm laughing."* — Everyman; the human face of the people AQUIFER surveils; can become the player's inside access to the Foundry. **Fates:** promoted (unwitting complicity) / fired and radicalized (joins Sublevel) / dies in the Act-IV Foundry sequence / walks away with the player.

16. **`prof_calloway`** — **Professor Ada Calloway**, Deller CS dept. — *"I published a paper in '97 predicting exactly this. Nobody cited it. Now everybody's living in the footnotes."* — Academic mentor; university path; gave early warning nobody heeded; may have consulted for Halcyon and regrets it. **Fates:** vindicated public expert / discredited / recruited by the Bureau as an advisor / quietly disappears.

17. **`ex_or_love`** — **Nadia Rourke**, Deller student / journalist-in-training (romance option A). — *"You get this look when you're hiding a browser tab. I'm a reporter. I notice tabs."* — Romance + tension: her career ambition (she's Osei's intern) can collide with the player's secrets. **Fates:** partner-for-life / leaves over the lies / becomes the reporter who breaks the player's story / dies as collateral.

18. **`ferris`** — **"Mr. Ferris"** (real name unknown), fraud-crew boss at Ferris & Kline. — *"I don't do violence. Violence is for people without good records and better lawyers. I do... inconvenience."* — Charming criminal patron; the money-fast-and-dirty path; secretly a low-level Halcyon asset (they launder through him). **Fates:** flips to the player / arrested / found to be a Halcyon cutout (mid-game clue) / dead in a Halcyon cleanup.

*(Romance option B: **`dialup_dana`** / Agent Cho; option C: **`vandal`** / Kesh — three romances spanning three factions, each with plot friction.)*

---

## 5. Act-by-Act Main Plot

Time and gating: Acts are gated by **progression** (skills, career, rep, flags), with a soft date floor so the world clock and life-sim keep pace. Each act ends on a hard **PIVOT** choice that sets its dominant flags.

### ACT I — "Beige Boxes" (Sept 2001 → ~2003; light)
**Gate to start Act II:** any two of {`skill.intrusion>=20`, `skill.networking>=20`, `skill.social>=20`} AND `flag.act1_pivot_done` AND rep with any faction ≥ +25.

**Opening.** Tutorialized through the fake desktop: player fixes a neighbor's virus-riddled PC for $20 (teaches skill checks, terminal-lite, schedule). Comedy of the era. During the cleanup the player finds a hidden, professionally-made background program — not a normal virus. It phones home to a Halcyon address and quietly logs the neighbor's activity. The player can ignore it, delete it, or **keep a copy** (the first breadcrumb, `item.sample_aquifer_stub`).

**Beat 1 — Getting a life.** Player must make rent-adjacent money: get the CompuCabin job (`beige_wizard`), take Sublevel starter contracts, or freelance. Introduces schedule/idle economy. Merle comedy. First forum drama on Sublevel (a flame war the player can inflame or defuse — teaches rep).

**Beat 2 — The itch.** The same hidden program shows up on *another* customer's machine at CompuCabin. And another. Always the same Halcyon-installed DSL "helper." A customer complains their bank knew about a purchase they hadn't told anyone about. `zerocool_grandpa` DMs the player: *"You keep pulling that thread, kid. Where'd you get that sample?"*

**CHOICE POINT A1 — The Sample.**
- **Option 1: Hand the sample to `zerocool_grandpa`.** → `rep.fac_sublevel +15`, `flag.trusted_by_deng`, unlocks Sublevel investigation arc.
- **Option 2: Post it publicly on Sublevel for clout.** → `rep.fac_sublevel +5`, `flag.sample_public`, `world.halcyon_alerted=true` (Halcyon now knows someone's looking; raises future heat), unlocks a paranoia subplot (someone's watching the player back).
- **Option 3: Sell it to `ferris`.** → `money +$300`, `rep.fac_sublevel -10`, `flag.ferris_owes_you`, Ferris quietly forwards it to his Halcyon handler (`world.halcyon_alerted=true`), unlocks the criminal money path early.
- **Option 4: Delete it and walk away.** → `flag.act1_walked_away`. The game *lets* you — for now. The itch returns via a personal hook in Beat 3 regardless (Josie's school gets the same "helper" installed).

**Beat 3 — It's personal.** The Halcyon "helper" gets installed citywide via a "free security upgrade" (news event; comedy of clueless adoption). It lands on the family PC and Josie's school lab. Whatever the player chose in A1, they now have a personal reason to care. Small terminal-lite mission (optional; auto-resolve fallback): quietly pull the helper's config off the home PC to learn it uploads to the Old Foundry.

**Beat 4 — Meeting the grown-ups.** Depending on early leanings the player is contacted by a faction rep for the first "real" job:
- Sublevel (`vandal`): deface Halcyon's marketing site to "warn people." (Raises heat; high visibility.)
- N&V (`priya_n`): a *legit* consulting internship — she noticed the player's forum posts. ("I want to know what you know. Legally.")
- Bureau (`dialup_dana`): a knock on the door. They noticed the defacement/sample too. Offer: be a friendly contact, stay out of trouble.
- Halcyon (via a CompuCabin corporate contract): Merle's shop lands a subcontract; player can meet `ln_vance` and be charmed/recruited.

**PIVOT (end of Act I) — CHOICE POINT A2: "Who do you call when it gets weird?"** The player picks a *primary early alignment* (not permanent, but sets starting rep and the Act II opener). Sets `flag.act1_pivot_done` and one of `flag.lean_sublevel / lean_nv / lean_bureau / lean_halcyon / lean_public` (if they went to Osei instead). Each grants +25 rep to that faction, a small signature perk, and colors how NPCs greet Act II.

**Skill-checked moments in Act I:** `[Social DC 10]` calm the flame war; `[Hardware DC 12]` recover data from a dying drive (customer sob-story quest); `[Intrusion DC 14]` pull the helper config without tripping it; `[Networking DC 12]` trace the upload destination to the Foundry.

**World changes from Act I:** `world.helper_deployed=true` (baseline surveillance now exists in-world), possibly `world.halcyon_alerted`, news feed shifts from purely comedic to "new security features praised by mayor."

---

### ACT II — "Handshake" (~2003 → ~2006; warming then cooling)
**Gate to Act III:** `flag.act2_pivot_done` AND a "big score" completed for at least one faction AND `skill.opsec>=30` (the game teaches you'll die without it) AND one NPC death or betrayal has occurred (`flag.first_blood`).

**Opening.** Time skip montage (news headlines: broadband arrives, first camera phones, a national "cyber-terror" scare that Halcyon exploits). The player is now competent, has a foothold in their chosen faction, and better gear. The comedy's still here but the jobs matter now.

**Beat 5 — The Meridian job.** All paths converge on getting inside **Meridian Data Systems** (the contractor running Halcyon's Foundry servers), because that's where AQUIFER physically lives. Routes:
- Sublevel: social-engineer or exploit your way in.
- N&V: get *hired* onto a pen-test contract for Meridian (walk in the front door — the game's best joke: the legit path is the sneakiest).
- Bureau: get deputized/warranted access.
- Halcyon: get a real job there and betray from inside.
- `headset_hank` is your possible inside man regardless of route.

**TERMINAL MISSION — "The Cold Aisle" (optional; auto-resolve fallback via `[Intrusion + Systems]` combined check).** Inside Meridian's network the player maps AQUIFER's shape for the first time: it's not a wiretap, it's a **correlation engine** — it ingests DSL logs, bank feeds, store loyalty cards, the DMV, and builds a predictive dossier on every resident. The trace-timer/log-wipe mechanics teach heat. Loot: `item.aquifer_schema` (the first hard proof).

**CHOICE POINT B1 — "What do you do with proof?"**
- **Publish (Osei/Tam):** `rep.fac_public +25`, `flag.first_leak`, `world.herald_investigating=true`. Halcyon retaliates: a Sublevel member gets raided (possible `first_blood`), and the player's heat spikes.
- **Sell/broker (`vandal`/Halcyon):** `money +$$$`, `rep.fac_halcyon +15` or `fac_sublevel +10`, `flag.you_have_a_price`. AQUIFER *expands* using your access. Someone you know gets hurt by a prediction (a friend flagged as a "risk," loses a loan/job).
- **Give to the Bureau:** `rep.fac_bureau +20`, `flag.ci_asset`. Ruttker doesn't shut AQUIFER down — he starts asking Halcyon to *share* it. Dana is horrified. Seed of the Bureau's corruption.
- **Sit on it (N&V/Priya):** `rep.fac_nv +15`, `flag.professional_silence`. Priya: *"Good. Now we build a case that can't be bought. Slowly."* Safer, but AQUIFER keeps growing while you wait.

**Beat 6 — First blood.** Whatever the route, someone pays. Scripted-but-variable: the person who dies/gets ruined is chosen by the player's neglect (an NPC whose loyalty quest the player skipped is the most likely victim — the game punishes what you ignore). Candidates: `headset_hank` (fired/killed), a Sublevel member, or — if the player's OPSEC is low and they involved family — Josie gets scared by a "visit." Sets `flag.first_blood` and names `flag.first_victim=<id>`.

**Beat 7 — The Steward's shadow.** The player realizes AQUIFER isn't run by Vance — she reports to someone. A name surfaces in old records: a Halcyon co-founder, **presumed dead in 1998**, whose "estate" still signs off on the system. Mystery escalates. `zerocool_grandpa` goes pale when he hears the name — he knew them, back in the BBS days.

**CHOICE POINT B2 — Loyalty test.** Each faction demands a proof of commitment that costs the player something real:
- Sublevel: burn a bridge to Halcyon/N&V publicly. (Locks off easy legit re-entry.)
- Halcyon: deliver a name — flip on a Sublevel friend. (`fate` change: friend arrested unless the player warns them, which Halcyon detects.)
- Bureau: wear a wire into Nix Alley. (Endangers `solder_queen`.)
- N&V: sign an NDA that legally muzzles you if you ever find the truth. (Sets `flag.muzzled`, a ticking constraint.)
- Public: go on the record with your real name. (Sets `flag.exposed_self`, "too public to disappear" — protective but paints a target.)

**PIVOT (end of Act II) — CHOICE POINT B3:** the player commits to a *primary faction* for Act III (rep threshold gate). Sets `flag.act2_pivot_done`, `flag.primary_faction=<id>`. This is the last easy off-ramp; switching later costs dearly.

**Skill-checked / terminal moments:** `[Social DC 16]` talk past a Meridian guard; `[Systems DC 18]` read the correlation schema; `[Opsec DC 15]` wipe your presence (fail → heat + a Bureau file opens on you); `[Cryptography DC 17]` crack the Steward's estate archive.

**World changes:** `world.broadband=true` (heat mechanics shift; more logging, faster jobs), `world.cyber_scare_law` may pass (if the player was loud in Act I/II → law passes → **heat gain +25% for everyone**, a persistent difficulty knob tied to player noise), `world.aquifer_scope` grows each time the player sells/leaks-without-finishing.

---

### ACT III — "Deep Packet" (~2006 → ~2009; dark)
**Gate to Act IV:** unmask the Steward (`flag.steward_identity_known`) AND acquire the master leverage (`item.aquifer_master_key` OR `item.priya_dossier` OR `item.osei_publishable_package`) AND survive the mid-act raid/investigation.

**Opening.** Full thriller. AQUIFER is now woven into the city: cameras with faces, predictive policing pilots, insurance denials, a "helpful" civic app. Comedy is now gallows humor. The player is a person of interest; heat management is central. NPCs start disappearing.

**Beat 8 — The disappearances.** People who knew too much vanish or "move away." The player must protect their inner circle: a defensive management layer where you spend time/money/skill to keep NPCs safe (relocate `solder_queen`, get `headset_hank` off the night shift, keep Josie out of it). Neglect kills.

**Beat 9 — Unmasking the Steward (the central mystery).** A layered clue trail assembled from earlier loot:
- The estate signatures (`item.aquifer_schema` metadata).
- Art Deng's BBS backups (`zerocool_grandpa` gives them if `flag.trusted_by_deng`).
- Priya's suppressed 1999 report (`item.priya_dossier` if `rep.fac_nv` high).
- A dead-drop from a repentant insider (Vance, if the player cultivated her).

**REVEAL (branching by evidence gathered):**
- **Default reveal:** the Steward is **Halcyon co-founder Victor Aldiss**, who faked his death in '98 to run AQUIFER free of any board, law, or name. A person who chose to become an *owner with no fingerprints*.
- **Deeper reveal (if the player has Deng's backups + Priya's report):** "The Steward" is a **role**, not a person — a rotating seat held by whoever controls the master key. Aldiss is just the current occupant. This reframes the endgame: you can't kill it by killing him; you can only decide who sits in the chair (or burn the chair).
- **Darkest reveal (if the player took every "sell/own" branch):** the system has been *grooming a successor*, and the profile it built of the ideal next Steward is **the player's own dossier**. AQUIFER wants you to have it. (Sets `flag.steward_wants_player`.)

**CHOICE POINT C1 — Vance's schism.** Lenore Vance, threatened by Aldiss, secretly offers the player an alliance: help her depose the Steward and *she'll* run AQUIFER "responsibly."
- **Ally with Vance:** `flag.vance_pact`, `rep.fac_halcyon` splits (you gain Vance's loyalists, lose Aldiss's), unlocks the boardroom-coup path to the "New Management" ending.
- **Refuse / expose her to Aldiss:** Vance is purged (`fate.vance=purged`), Aldiss consolidates, the game gets harder but a cleaner "burn it" run stays open.
- **Play both:** `[Social DC 20]` / `[Opsec DC 20]` to string them along for extra resources; failure → both turn on you (brutal mid-act raid).

**Beat 10 — The Raid (setback, not game over).** Heat cashes out: a coordinated raid on the player and/or their faction. Confiscation of gear, jail days (idle-time skip), a rep hit, and one NPC fate locked in. Crucially this **opens branches**:
- If the Bureau raids you and Dana runs it, she offers a flip deal (become a full CI → unlocks Bureau endgame even if you were anti-Bureau).
- If Halcyon "raids" you (private security), surviving it earns Sublevel respect and a safehouse.
- Jail itself has content: recruit a cellmate, get a message out via `solder_queen`, or catch a beating that costs `health` (preventable with `rep` or `money`).

**CHOICE POINT C2 — The Master Leverage.** The act climaxes on acquiring the thing that makes Act IV possible. Three routes, each producing a different key item and coloring the finale:
- **The Foundry heist (Sublevel/criminal):** physically reach AQUIFER's master node. **TERMINAL MISSION "Root the Aquifer"** (auto-resolve fallback: a big pooled `[Intrusion+Systems+Opsec]` check with `headset_hank`'s help as a modifier). Loot: `item.aquifer_master_key`.
- **The dossier (N&V/legal):** finish Priya's court-proof case. Loot: `item.priya_dossier`. Requires protecting Priya through Beat 8.
- **The package (Public):** assemble a bulletproof, un-suppressible story for Osei/Tam. Loot: `item.osei_publishable_package`. Requires keeping Osei alive.
- **The deal (Halcyon/Bureau):** *be given* controlled access in exchange for loyalty. Loot: `item.aquifer_seat` (you're now inside the chair). Sets `flag.you_are_inside`.

**PIVOT (end of Act III):** `flag.act3_pivot_done`, `flag.leverage_type=<key/dossier/package/seat>`, `flag.steward_identity_known=true`. The player now holds real power over the whole system.

**Skill/terminal moments:** `[Cryptography DC 22]` break the estate vault; `[Opsec DC 22]` survive the raid clean; `[Social DC 21]` turn a purged Vance loyalist into a source; the Foundry terminal mission with a live trace-timer and proxy-bounce mechanic (thematically: the deeper you go, the faster it notices).

**World changes:** `world.predictive_policing=true` (random stop-events in the city; higher baseline heat), `world.disappearances` counter (public unease rises), `world.aquifer_scope=max`. If the player has been public throughout, `world.herald_series_running=true` (the city is starting to *ask questions* — a protective ambient factor).

---

### ACT IV — "Root" (~2009 → ~2012; climax + resolution)
**Gate:** `flag.act3_pivot_done`.

**Opening.** Everything converges over a tense final in-game season. All surviving factions know the player holds leverage and make their final pitch. This is the "cash out every choice" act: prior flags, rep, NPC fates, and world variables determine which endings are *available* and how they play. The act is short, dense, and choice-driven.

**Beat 11 — The Convergence.** A single event (a citywide AQUIFER outage the player triggers as a proof-of-power, or a public hearing, or a blackout) forces every faction into the open. The player holds the deciding vote.

**Beat 12 — The Final Choice (the ending selector).** A climactic DIALOG sequence at the Foundry / the hearing / the newsroom (location depends on `leverage_type`). The player's accumulated state gates which of the endings below they can pick. This is where **Section 8** endings trigger.

**Skill/terminal moments:** the finale's climactic action is a single grand check scaled by everything the player built — `[Systems + Opsec + Social]` pooled, modified by every ally still alive, every faction still friendly, every piece of gear not confiscated. There is no fail-state "game over" — a failed final check routes to a *darker version* of the ending the player aimed for (e.g., you burn AQUIFER but get caught → martyr instead of ghost).

---

## 6. Faction Arcs (one per faction)

Each arc is a quest chain (`quest_*`) with staged objectives and branches. Steps set flags/rep and feed the main plot.

### F1 Sublevel — "Free The Water"
1. **`q_sub_1` Proving Ground:** run three clean starter contracts (no collateral). *Branch:* a contract turns out to hurt an innocent — abort (rep+, money-) or finish (money+, `flag.sub_collateral`).
2. **`q_sub_2` The Sample:** deliver `item.sample_aquifer_stub` to Deng. Unlocks his backups later.
3. **`q_sub_3` The Schism:** Deng vs. Vandal over whether to sell or burn AQUIFER. Pick a side → `flag.sub_side_deng/vandal`; affects whether the endgame "burn" or "sell" path is available and who leads the board.
4. **`q_sub_4` The Foundry Map:** the Meridian recon (Beat 5) from the underground angle.
5. **`q_sub_5` Protect The Board:** during Act III raids, choose who to save when the Bureau comes — Deng, Vandal, or the archive. Locks their fates.
6. **`q_sub_6` Root The Aquifer:** the Foundry heist (Beat 10 terminal mission). Yields `item.aquifer_master_key`.

### F2 Halcyon — "Continuity Of Service"
1. **`q_hal_1` Onboarding:** get hired (or subcontracted). Comedy of corporate culture. `flag.hal_badge`.
2. **`q_hal_2` Small Asks:** a series of escalating "harmless" tasks (pull a log, flag a customer, quiet a complaint). Each raises `rep.fac_halcyon` and `flag.hal_complicity++`. The game tracks how many you did — it matters in the epilogue.
3. **`q_hal_3` The Prediction:** you're asked to act on an AQUIFER prediction against a specific person — who turns out to be someone you know (or Josie's teacher, or Hank). Refuse (rep-, `flag.hal_refused_once`) or comply (`flag.hal_crossed_line`).
4. **`q_hal_4` Meeting Vance:** she takes you under her wing; learn AQUIFER's "care not surveillance" gospel.
5. **`q_hal_5` The Steward's Errand:** an assignment that only makes sense once you realize Vance answers to someone. Clue toward the reveal.
6. **`q_hal_6` The Seat:** be offered controlled ownership (`item.aquifer_seat`) — the "become the machine" path.

### F3 Task Force — "Lawful Intercept"
1. **`q_bur_1` The Knock:** first contact with Cho. Agree to be a friendly contact or refuse (harassment events if you refuse).
2. **`q_bur_2` Small Fish:** flip a minor Sublevel target. *Branch:* warn them secretly (`[Opsec DC 16]`; success → `flag.double_agent`, fail → Halcyon/Bureau notices).
3. **`q_bur_3` Ruttker's Ambition:** discover Ruttker wants AQUIFER for the Bureau, not to destroy it. Report him to Cho (`flag.bur_cho_alliance`) or help him (`rep+`, `flag.bur_ruttker_ally`).
4. **`q_bur_4` The Wire:** Nix Alley operation (Beat B2). Endangers `solder_queen`.
5. **`q_bur_5` The Raid:** you're on the *inside* of the Act III raid, or its target flipping (Beat 10).
6. **`q_bur_6` Seize Or Serve:** final Bureau step — help Ruttker seize AQUIFER (bad "state ownership" ending) or help Cho blow the whistle on the Bureau's overreach (the "honest cop" ending).

### F4 N&V — "Chain Of Custody"
1. **`q_nv_1` The Internship:** Priya hires you off your forum reputation.
2. **`q_nv_2` The Pen-Test:** legit contract that's secretly the Meridian recon (front-door route to Beat 5).
3. **`q_nv_3` The NDA:** the muzzle choice (B2). Signing gates a mid-game twist where you must break it at real cost.
4. **`q_nv_4` Priya's Report:** she reveals the suppressed 1999 dossier and asks you to help finish what she couldn't.
5. **`q_nv_5` Voss's Betrayal:** Gil is selling client info to Halcyon. Expose him (rep+, firm splits) or blackmail him (money+, `flag.own_voss`).
6. **`q_nv_6` Court-Proof:** assemble `item.priya_dossier` — the "reform / legal reckoning" path.

### F5 Herald/Public — "On The Record"
1. **`q_pub_1` The Tip:** feed Osei your first real lead. He demands corroboration (teaches evidence-gathering).
2. **`q_pub_2` Two Sources:** get a second independent source (a great excuse to send the player to a rival faction).
3. **`q_pub_3` The Spike:** Halcyon leans on the Herald's owner to kill the story. Go around via Tam's blog (`flag.went_indie`) or fight for the print edition (`[Social DC 18]` to stiffen Osei's editor).
4. **`q_pub_4` Protect The Source:** keep a whistleblower (often Vance or Hank) alive and credible.
5. **`q_pub_5` The Smear:** Halcyon plants lies to discredit you/Osei. Pre-empt it (`[Opsec/Social]`) or ride it out.
6. **`q_pub_6` Publish:** assemble `item.osei_publishable_package` — the "expose it in daylight" path. *Branch:* Osei alive → front page; Osei dead → Tam publishes it raw and messy (different ending flavor).

---

## 7. Side Quests (30)

**Family**
1. **`sq_dads_heart`** — Dad has chest pains; the good hospital wants money the family doesn't have. Pay (money-, `fate.dad=saved`), take a dirty Ferris job to afford it (heat+), or let the public clinic handle it (risk `fate.dad=dies`). Later AQUIFER's insurance-denial subplot can be *why* he was denied — a gut-punch tie-in.
2. **`sq_moms_boss`** — Mom's office-cleaning boss is skimming her hours via a rigged time-clock. Fix it quietly, confront him (comedy), or plant evidence and get him fired (she's mortified either way).
3. **`sq_josie_grows`** — Across the game Josie asks to learn "computers." Teach her (she becomes capable — asset or endangered), deflect her (she gets into trouble on her own), or steer her legit (she becomes a cop — Act IV irony).
4. **`sq_family_secret`** — A parent finds the player's gear/heat. They either become a shield (lie to the men in jackets) or, if the relationship soured, a reporter of last resort.
5. **`sq_grandma_pc`** — Recurring comic quest: fix Grandma's PC. Each visit it's worse and funnier. Final visit (Act III): Grandma's "helpful" civic app is spying on her; the joke stops being funny.

**Friends**
6. **`sq_hank_promotion`** — Hank's up for a Meridian promotion that would end your inside access. Sabotage it (keep your man; hurt him), help it (lose access; gain a grateful friend inside management), or level with him (recruit him properly).
7. **`sq_lan_party`** — Organize a LAN party (pure nostalgia, buffs mood/social). One guest turns out to be a Bureau informant — a clue you can catch with `[Social DC 15]`.
8. **`sq_bex_bust`** — `solder_queen` is about to be raided. Warn her (rep+, she owes you), or let it happen and buy her confiscated stock cheap at auction (cold money+).
9. **`sq_old_rival`** — A script-kiddie who flamed you in Act I resurfaces in Act III genuinely in danger. Help your old enemy or savor the schadenfreude.
10. **`sq_dengs_last_board`** — Help Art Deng migrate his ancient BBS one last time before it dies. Emotional; unlocks a hidden archive with a Steward clue.

**Romance**
11. **`sq_nadia_tabs`** — Nadia (reporter-intern) keeps noticing your secrets. Come clean (deepens romance, endangers her career/life), keep lying (romance strains), or feed her a *safe* story to protect her.
12. **`sq_cho_line`** — Romance with Agent Cho across the law/crime line. A late choice: run away together (abandon the endgame), or stay and let duty pull you apart.
13. **`sq_vandal_heat`** — Romance/partnership with Kesh; intoxicating and dangerous. She'll ask you to cross a line "for us." The relationship is a Trojan horse for the "sell AQUIFER" path.
14. **`sq_anniversary`** — A relationship-maintenance quest: you scheduled a date but a contract's timer collides. Choose the person or the payout (mood vs. money/rep).
15. **`sq_the_ring`** — Marriage proposal option. Requires housing tier + stable stress. A married partner becomes leverage enemies can use — the game warns you gently.

**Freelance clients**
16. **`sq_divorce_data`** — A client wants their spouse's email cracked "for the custody case." Refuse (opsec of the soul), do it and learn the spouse is the real victim (moral whiplash), or do it and get blackmail material of your own.
17. **`sq_small_biz`** — A local bakery got ransomware'd. Save their recipes (wholesome), and discover the ransomware routes payments through Ferris & Kline — a thread into the fraud crew.
18. **`sq_the_church`** — A congregation's donation site is skimming. The "hacker" is their own teen. Turn the kid in, cover for them (mentor them into Sublevel), or fix it and say nothing.
19. **`sq_influencer_zero`** — An early blogger (proto-influencer) pays you to inflate their hit counter. Comedy of vanity metrics; later they become an unwitting megaphone you can use for the Public ending.
20. **`sq_repo_job`** — A repo company hires you to locate a debtor via their online trail. Doing it teaches you AQUIFER-lite tracking — and the "debtor" is someone sympathetic. Warn them or collect the fee.

**Neighborhood / dial-up nostalgia humor**
21. **`sq_phone_line_war`** — The upstairs neighbor keeps picking up the phone and killing your downloads. Negotiate a schedule (social), or "accidentally" reroute their line (petty genius).
22. **`sq_aol_disc_tower`** — Collect the free-trial ISP discs plaguing the neighborhood into an art sculpture; a hidden coaster-throwing minigame; buffs mood. Pure era joke.
23. **`sq_y2k_bunker`** — A doomsday-prepper neighbor is still waiting for Y2K in 2003. Fix his "bunker network"; he becomes a paranoid but useful off-grid ally in Act IV (his cash-only, no-logs house = a safehouse).
24. **`sq_the_webmaster`** — A laid-off dot-com "webmaster" begs for work. Hire him (loyal, slightly useless, comic), or he drifts to Ferris's crew and shows up later on the wrong side.
25. **`sq_modem_song`** — Easter egg: recognize an NPC's "lucky ringtone" as an actual handshake sequence hiding a message. Pure fan-service for the nostalgic.

**Oddities / easter eggs**
26. **`sq_ghost_in_bbs`** — A dead user keeps posting on Sublevel. Investigation reveals a scheduled-post script from someone who's gone — melancholy, ties to the disappearances theme early.
27. **`sq_numbers_station`** — A weird numbers-station broadcast decodes (with `[Cryptography]`) into AQUIFER node coordinates. Optional deep-lore breadcrumb; a hidden shortcut to the Steward reveal.
28. **`sq_the_other_you`** — AQUIFER's predictive profile of the *player* leaks to you: it "predicts" your next three choices. Chilling meta-moment; if the game's own choice-tracking matches its predictions, an achievement/flag `flag.predictable`.

**Dark late-game**
29. **`sq_flip_or_burn`** — A friend you recruited is arrested and offered a deal to flip on you. Reach them first: talk them down (`[Social]`), break them out of the process (heat++), or cut them loose (they flip; `fate` = enemy).
30. **`sq_the_list`** — Late-game, you obtain AQUIFER's "risk list" — people it has marked for "intervention." You can warn a handful before your window closes. Who you save (an activist? your ex? a stranger with a sympathetic file?) is remembered in the epilogue. You cannot save everyone. This quest is the thesis of the game in miniature.

---

## 8. Endings (8)

Endings are gated by `flag.leverage_type`, `flag.primary_faction`, rep thresholds, key NPC fates, `flag.hal_complicity`, and the final check outcome. A failed final check routes to the "darker cut" noted per ending. Each has an epilogue sketch (player / key NPCs / city).

### E1 — "New Management" (Halcyon reform-from-inside)
**Conditions:** `flag.vance_pact`, `leverage_type=seat` or `key`, high `rep.fac_halcyon`, Vance alive. You depose Aldiss and install Vance (or yourself under her) to run AQUIFER "ethically."
**Epilogue:** AQUIFER survives, now with "oversight." *Player:* wealthy executive, haunted; the system still watches — just politely. *Vance:* CEO; genuinely believes she's the good version. *City:* prosperous, pacified, quietly unfree. **Darker cut (failed check):** Vance betrays you the moment Aldiss is gone; you're the fall guy; AQUIFER unchanged.

### E2 — "The Silent Owner" (you become the machine)
**Conditions:** `flag.steward_wants_player`, `leverage_type=key`, took mostly "sell/own" branches, low empathy flags. You take the chair. The title lands on you.
**Epilogue:** *Player:* the new Steward — no name, no fingerprints, total view. A cold, powerful, lonely ending narrated in second person as *the system* now describing *you*. *NPCs:* those who trusted you are managed, not freed. *City:* stable, watched, yours. The most seductive-then-horrifying ending. **Darker cut:** the system doesn't need *you*, just your key — you're absorbed and forgotten, a footnote in your own dossier.

### E3 — "Burn It Down" (Sublevel / total destruction)
**Conditions:** `leverage_type=key`, `flag.sub_side_deng` (or Vandal if you kept the burn intent), Foundry heist done, high `rep.fac_sublevel`. You destroy AQUIFER's master node and dump/erase the correlation data.
**Epilogue:** *Player:* fugitive folk hero, off-grid (the Y2K bunker pays off), or dead-as-legend if final check failed (martyr). *Deng:* vindicated, gives an interview, retires. *Vandal:* furious you burned a fortune (if she wanted to sell) or triumphant beside you (if aligned). *City:* chaos then relief; the data hub reputation collapses (`world.economy=recession`), thousands of call-center jobs gone — freedom with a price. **Darker cut:** you burn it but they have an off-site backup you didn't find (seeded if you skipped `sq_numbers_station`); AQUIFER reboots in another city.

### E4 — "On The Record" (Public / exposure)
**Conditions:** `leverage_type=package`, high `rep.fac_public`, Osei or Tam alive. You publish everything. AQUIFER dies in the light, not in a fire.
**Epilogue:** *Player:* protected witness, testifies, becomes a reluctant public figure; can't hack anymore (everyone knows your face). *Osei:* career-defining series, maybe a national prize; or, if he died, Tam publishes it raw and becomes a movement leader. *City:* reckoning, hearings, reform laws (`world.privacy_law=passed`) — a bittersweet, institutional win. The "grown-up" hopeful ending. **Darker cut:** the smear (`sq_pub_5` failed) sticks; the story's dismissed as a hoax for years before vindication.

### E5 — "The Honest Cop" (Bureau / lawful reckoning)
**Conditions:** `flag.bur_cho_alliance`, Ruttker exposed, `leverage_type=dossier` or `package`, Cho alive. AQUIFER is seized *and dismantled* under a court, Ruttker disgraced.
**Epilogue:** *Player:* immunity, a quiet civilian life, maybe a consulting gig; the only ending where you sleep okay. *Cho:* whistleblower who reformed her own agency; promoted or forced out heroically. *Ruttker:* indicted. *City:* trust in institutions dented but the rule of law holds. **Darker cut:** the Bureau seizes AQUIFER and *keeps* it "for safekeeping" (Ruttker wins the internal fight); you traded one owner for a worse one — bleeds into E6.

### E6 — "Lawful Intercept" (Bureau / state ownership — bad)
**Conditions:** `flag.bur_ruttker_ally`, `leverage_type=seat/key` handed to the Bureau. The state now runs AQUIFER.
**Epilogue:** *Player:* decorated informant, comfortable, complicit; the walls have your name on the good side of the list. *Ruttker:* runs a national program. *City:* orderly, surveilled forever, the crime rate "impressively low." A chilling authoritarian-drift ending. **Darker cut:** they use you up and file you under the watched anyway.

### E7 — "The Professional" (N&V / managed reform, compromised)
**Conditions:** high `rep.fac_nv`, `flag.muzzled` broken at cost, `leverage_type=dossier`, Priya alive. AQUIFER isn't destroyed — it's *regulated into a boring, audited utility* through legal settlements. Nobody's happy; nobody dies.
**Epilogue:** *Player:* respected consultant, financially set, morally ambiguous, alive. *Priya:* finally at peace, retires. *City:* AQUIFER persists as a heavily-regulated "civic data service" — the realist's ending: you didn't win, you contained. **Darker cut:** the regulation is captured within five years; the epilogue text jumps to 2020 and it's everywhere now, worse, normal.

### E8 — "Ghost" (walk away / small human ending)
**Conditions:** low involvement across the board, or deliberately chose family/romance over the endgame (`sq_cho_line` runaway, or repeatedly protected Josie/parents over faction asks). You give up the leverage and disappear into an ordinary life.
**Epilogue:** *Player:* off-grid, small town, a partner (whoever you kept), fixing PCs for cash — a return to Act I's innocence, chosen this time. AQUIFER continues without you; the final line is a distant news headline on a diner TV that you deliberately don't turn up. *NPCs:* the ones you saved live; the ones you didn't are a weight you carry. *City:* unchanged. The quietest, most personal ending — a rebuke to the whole power fantasy. **Darker cut:** they find you anyway years later (if `flag.exposed_self`), and it ends on a knock at the door.

*(Optional secret E9 — "The Role" — if the player achieved the "deeper reveal" (Steward is a rotating seat) and then *destroyed the chair itself* (a hidden combination of burn + expose + refuse-to-sit): the only ending where the concept of a Silent Owner is ended, not transferred. Hardest to reach; the "true" ending for completionists.)*

---

## 9. World-Reaction System

**Design.** The news feed, prices, salaries, job/contract availability, and heat gain are driven by `world.*` variables that specific choices set. Below: 22 example headlines tied to triggers, then the world variables.

### Example news headlines (trigger → headline)

1. `flag.sample_public` set → *"'Cyber Vandals' Deface Local Telecom Site; Halcyon Calls It 'Isolated'"*
2. `world.helper_deployed` (Act I) → *"Halcyon's Free 'SafeNet Helper' Praised by Mayor: 'A Safer Internet for Halvern'"*
3. `flag.first_leak` (B1 publish) → *"LEAKED: Does Your DSL Company Know Where You Shop? Halcyon Denies 'Correlation Engine'"*
4. `flag.first_blood`, victim = Sublevel member → *"Local Man Arrested in Pre-Dawn Raid; Neighbors 'Shocked'"*
5. `flag.cyber_scare_law` passes → *"State Passes Sweeping Anti-Hacking Act; Penalties Doubled"* (→ `world.heat_gain_mult=1.25`)
6. Player sells to Halcyon (B1) → *"Halcyon Announces 'Predictive Fraud Protection' Partnership with First Halvern Savings"* (→ `world.aquifer_scope++`)
7. `sq_dads_heart` denied via AQUIFER → *"Insurers Adopt 'Risk Scoring'; Some Patients Say They Were Denied Without Explanation"*
8. `fate.beige_wizard=bought_out` → *"CompuCabin Closes After 22 Years; 'Couldn't Compete,' Says Owner"*
9. `world.broadband=true` → *"Halvern Goes Broadband: 'The Dial-Up Days Are Over'"* (→ faster contracts, more logging → `world.heat_gain_base++`)
10. `world.predictive_policing=true` → *"Halvern PD Pilots 'Data-Driven Patrols'; Civil Liberties Groups Object"*
11. `fate.osei=killed` → *"Veteran Herald Reporter Frank Osei Dies in Car Accident; Colleagues 'Devastated'"* (the game lets the player suspect it wasn't)
12. `flag.went_indie` (Tam's blog breaks it) → *"Anonymous Blog 'Glasshouse' Alleges Citywide Surveillance; Halcyon Threatens Suit"*
13. `world.disappearances>=3` → *"Where Did They Go? Three Halvern Residents Reported Missing This Year"*
14. `fate.vance=purged` → *"Halcyon VP Lenore Vance Resigns 'to Spend Time with Family'"*
15. `flag.steward_identity_known` + expose → *"THE MAN WHO FAKED HIS DEATH: Inside AQUIFER and the Ghost Who Built It"*
16. E3 burn ending → *"CATASTROPHIC FAILURE AT OLD FOUNDRY DATA CENTER; Halcyon Systems Down Citywide"* → `world.economy=recession`, `world.jobs_available--`
17. E4 expose ending → *"AQUIFER: The Surveillance Program That Watched a City. A Herald Investigation."* → `world.privacy_law=passed`
18. E6 Bureau ending → *"Federal Task Force Hails 'Historic' Cybercrime Reduction in Halvern"* (the quiet horror in the subtext)
19. `world.dotcom_recovery` (time-based, ~2004) → *"Tech Hiring Rebounds; Salaries Climb as 'Data Economy' Booms"* → `world.salary_mult++`, more dev jobs
20. Player raises heat citywide (loud playstyle) → *"Police Warn of 'Organized Cyber Crime Ring' Operating in Halvern"* → contract prices up, heat gain up
21. `sq_josie_grows=cop` → *"Youngest Cadet in Class: A Halvern Success Story"* (bittersweet if player is deep in crime)
22. `flag.ferris_exposed` → *"Shipping Firm Was Front for Fraud Ring, Prosecutors Say"* (and a buried line linking it to a "telecom subcontractor" if the player found the cutout clue)

### World variables (persistent, choice-driven)

- `world.heat_gain_mult` (default 1.0; `cyber_scare_law` → 1.25; `privacy_law` → 0.85) — how fast heat accrues for everyone.
- `world.heat_gain_base` — rises with broadband/logging era shifts.
- `world.aquifer_scope` (0–5) — how deep AQUIFER reaches; each sell/leak-without-finish and each Halcyon "small ask" increments it; drives insurance/policing events and the darkness of epilogues.
- `world.economy` (`recovery`/`boom`/`recession`) — dotcom recovery raises salaries and dev-job supply; a burn ending can crash it.
- `world.salary_mult` — legit pay scaling with the era and economy.
- `world.jobs_available` / `world.contracts_available` — which career rungs and underground contracts exist; shift with world state (e.g., N&V only hires post-2003; bank jobs appear once `world.aquifer_scope>=3` makes them lucrative and dangerous).
- `world.disappearances` — counter; raises public unease and, past thresholds, a protective "the city is watching back" modifier for Public-aligned players.
- `world.halcyon_alerted` — Halcyon knows someone's digging; raises targeted heat and enables surveillance-of-the-player subplots.
- `world.privacy_law` / `world.cyber_scare_law` — mutually-influenced legislation states set by how public vs. how loud-criminal the player has been.
- `world.prices_gear` — Nix Alley prices swing with busts (`sq_bex_bust`) and crackdowns.

---

## 10. Life-Sim Integration

The life-sim is not a side system — it's the **pressure and the stakes** that make the conspiracy hurt. Concrete intertwinings:

- **Family ↔ plot.** Dad worked the steel plant that became the Foundry — the literal heart of AQUIFER — so the player's origin is bound to the antagonist's building; a late scene can happen where Dad walks his kid through the old shop floor, now a server hall (`sq_dads_heart`'s emotional payoff). Mom cleans Grid offices, giving a plausible early physical-access hook and a "she saw something" thread. Josie's arc turns family into either the player's greatest support or the enemies' best pressure point (`sq_flip_or_burn`, `sq_the_list` can put a family member on the risk list). AQUIFER's insurance-scoring can be *why* Dad is denied care — the systemic evil made unbearably personal.

- **Romance ↔ plot.** Each romance sits on a fault line: Nadia (Public — your secrets threaten her career and life), Cho (Bureau — love across the law), Kesh/Vandal (Sublevel — love as a pull toward selling out). Romances gate certain endings (E8 "Ghost" is richest with a kept partner; `sq_cho_line` can *end the campaign early* by running away — a legitimate, human "ending" the game respects). A married partner becomes leverage (`flag.spouse` → enemies can target them), and the marriage quest requires the housing/stress life-sim to be in a good state, so domestic stability and conspiracy risk are in constant tension.

- **Housing ↔ heat & story.** Housing tier is both comfort and OPSEC: the parents' flat (Act I) means family exposure; a rented room lowers family risk but costs money; the Y2K prepper's off-grid house (`sq_y2k_bunker`) becomes a **safehouse that reduces heat gain** — a life-sim reward feeding the thriller. A raid (Beat 10) can cost you your housing tier, forcing you back to your parents' flat (shame + renewed family exposure), tying setback to sim.

- **Health/stress ↔ pacing.** Long hacking hours spike `stress` and drain `health`; burnout events force rest days that stall contract timers (the idle loop's natural rhythm). Aging matters over the 10–15 in-game years: `fitness` decays without upkeep; a health crisis in the player's late 20s can gate out physical-heist endings (E3 Foundry) unless maintained — so the sim quietly shapes which finale is even reachable.

- **University ↔ career gate.** Enrolling at Deller (`org_deller`, entrance exam = a skill check, semesters = scheduled study time, tuition = money pressure that can push the player toward dirty jobs) unlocks the top legit rungs (developer → N&V) and Professor Calloway's arc (early-warning lore + a Halcyon-consulting regret that's a Steward clue). Dropping out is viable and pushes the player underground — the sim choice *is* a faction choice.

- **The economy as mood ring.** `world.economy` (dotcom recovery, boom, or a player-caused crash) sets whether legit life is a viable escape or a trap — making the recurring question "could I just get a normal job and be happy?" a real, shifting option rather than a fixed backdrop. In E8, the answer is finally yes, at the cost of everything you learned.

Everything above resolves to data: `scenes` (dialogue trees with skill-checked and requirement-gated choices), `quests` (`quest_*` with staged `objectives` as condition→progress and `hints`), `triggers` (`condition → effects`: set `flag`, adjust `rep.*`, change `fate.*`, push `news`, mutate `world.*`), and the item/skill/stat economy already specified in the game brief. The conspiracy is the spine; the life-sim is the flesh; the factions are the joints that let the whole thing bend toward eight very different ends.
