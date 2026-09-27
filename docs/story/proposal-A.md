# HACKERSIM — Story Proposal A: "The People You Break"

**Angle:** Character-driven. The conspiracy is not a puzzle you solve; it is a thing that happens to the people you love while you are looking at a screen. Every major beat is anchored to a face, a voice, and a fate you caused.

**Design contract:** Everything below is written to be implementable as data. Named entities use stable ids. CHOICE POINTS list options with concrete effects (`flag:`, `rep:`, `fate:`, `world:`, `stat:`). Skill checks use the project's d20 + (skill/4) + situational model with an explicit DC. Terminal missions always name their auto-resolve fallback. Side quests and news items are pre-tagged with their trigger conditions.

---

## 1. Logline, themes, tonal arc

**Logline.** A broke, brilliant kid in the dial-up backwater of Port Lumen spends a decade climbing — into a job, into a scene, into a bed, into a conspiracy — and discovers that the only real skill the world rewards is deciding which of the people who trust you gets sold first.

**Core themes.**
- **Access is intimacy, and intimacy is leverage.** Getting into a machine and getting into a person are the same verb in this game. The player will be asked to treat both the same way, and the story punishes and rewards that symmetry.
- **The idle drift.** Time passes whether you act or not. People age, drift, get sick, get arrested, get married, give up. The idle core *is* the theme: neglect is a choice with a body count.
- **Nobody is the villain of their own log file.** Every faction and every antagonist has a coherent, sympathetic internal story. The "conspiracy" is mostly ordinary people covering their own losses.
- **The city eats its scene.** The underground is a family until it is a market until it is evidence.

**Tonal arc (light → dark), mapped to acts.**

- **Act I — "The Whir of the Modem" (nostalgic comedy).** Fixing grandmothers' PCs, forum flame wars, a boss who thinks RAM is a browser, a crush who signs off with `*hugz*`. Stakes are $40 and dignity. The darkness is only a rumor in a locked forum subboard.
- **Act II — "Everyone's Getting Paid" (dramedy, tightening).** The dot-com money is real now. Friends start making choices that can't be undone. The first raid. The first funeral-adjacent scare. Humor survives but it's gallows now.
- **Act III — "Signal Intelligence" (techno-thriller).** Surveillance, a federal flip, a corporate acquisition that is actually a data-laundering operation, a friend wearing a wire. The city passes a law because of something *you* did.
- **Act IV — "The Long Tail" (consequence).** No new mechanics, only bills coming due. Who's alive, who's free, who still speaks to you. Endings are epilogues you've been writing for ten in-game years.

The comedy never fully dies — the last act still has a character who insists the feds tapped his line through the toaster — but by Act IV a joke is how people cope with a wake.

---

## 2. World: Port Lumen and the dial-up era

**Port Lumen** — a mid-sized rust-and-fiber port city on a grey inland sea. Old money in shipping and paper mills; new money arriving on T1 lines. Fog off the water, a defunct streetcar system, a university on the hill, server farms moving into the gutted mill district because the power is cheap and nobody asks questions. Neighborhoods the game names:

- **Cannery Row (aka "the Flats")** — cheap, damp, where the player's parents live. Payphones still work. The BBS scene never quite died here.
- **Millgate** — reclaimed industrial lofts, the first ISPs, the "cyber-café" *Terminal Velocity*, and later the corporate campuses. Gentrifies visibly across acts.
- **The Hill** — Lumen State University, the observatory, the good coffee, the quiet server room in the Comp Sci basement.
- **Harbor Point** — money, the *Meridian Trust* bank tower, the yacht club, the mayor's donors.
- **Sodium Row** — the strip of neon under the highway: arcades, an all-night diner (*The Cathode*), a pager/electronics shop, and the back room where the scene physically meets.

**Era texture.** Dial-up handshakes, busy signals, "get off the phone, I'm downloading," AOL-style walled gardens, burned CD-Rs, LAN parties in basements, the smell of a CRT, warez on 40 floppies, the specific dread of a download failing at 98%, cordless phones interfering with modems, the Y2K hangover, the dot-com bubble's last inflation and its 2001-2002 deflation, the post-9/11 surveillance mood arriving as *ambient*, not topical — new laws, new wiretaps, new money for "critical infrastructure protection," all fictionalized.

**6-10 notable orgs / places (each a data anchor).**

1. **Meridian Trust Bank** (`org.meridian`) — the city's old bank, digitizing badly. Its online banking rollout is the game's recurring soft target and, later, the site of a legendary heist.
2. **Halcyon Systems** (`org.halcyon`) — the local dot-com darling; project management "for the connected enterprise." Burns bright, IPOs, and its collapse or survival is a world variable. Employs the player's mentor.
3. **Aperture Data Solutions** (`org.aperture`) — a "data hygiene and consumer insight" firm in Millgate. Seems dull. Is the conspiracy's laundry.
4. **Lumen State University** (`org.lsu`) — degrees, the entrance exam, the CS basement, a professor who runs a very interesting research grant.
5. **NorthLink ISP** (`org.northlink`) — the local dial-up/DSL provider. Owns the pipes; later owns your logs.
6. **CompCastle** (`org.compcastle`) — the big-box computer store where the player might take a soul-crushing retail tech job. Boss is a legend of incompetence.
7. **Terminal Velocity** (`place.tv_cafe`) — Millgate cyber-café, neutral ground, where the scene and the squares mix. Owned by an ex-hacker gone straight (mostly).
8. **The Cathode Diner** (`place.cathode`) — 24-hour diner on Sodium Row, where every hard conversation happens.
9. **Port Lumen PD — Cyber Unit** (`org.plpd_cyber`) — three detectives and a confiscated-hardware closet, punching above their weight because the feds keep loaning them toys.
10. **The Bureau field office** (`org.bureau`) — fictional federal agency ("the Bureau"), a satellite office that arrives in Act II and never leaves.

---

## 3. Factions (5)

Reputation is a signed integer per faction, roughly -100..+100, surfaced as tiers (Hostile / Wary / Neutral / Trusted / Inner). Actions list explicit `rep:` deltas below and in quests.

### F1 — The Loft (`fac.loft`) — the local underground scene
**What it is.** Not a syndicate — a friend group with a private forum (the "Underground Forum" board `sub.loft`) and a physical back room on Sodium Row. Warez, phreaking lore, mutual aid, ego, drama.
**Leader.** **Corvid** (`npc.corvid`), the sysop who's been running the board since the BBS days. Believes in the scene as a *commons*.
**Offers.** Contract leads (low/mid heat), tool trades, alibis, the tightest social scene, the "we don't rat" ethic.
**Rep up:** sharing tools/knowledge freely, protecting members from heat, refusing to work for corps against the scene. **Rep down:** selling out a member, hoarding a 0-day for profit, working with the Bureau, doxxing.
**Conflict:** hates Aperture (`fac.aperture`) on principle; distrusts the Bureau; ambivalent toward money (Halcyon's success tempts members away).

### F2 — Aperture / "the Client" (`fac.aperture`) — corporate data underworld
**What it is.** Aperture Data Solutions plus the shell of contractors it runs. Presents as legitimate. Buys breaches, launders stolen databases into "consumer insight," and quietly builds the surveillance backbone the Bureau will later rent.
**Leader.** **Vanessa Kroll** (`npc.kroll`), VP of "Special Accounts." Warm, funny, terrifyingly reasonable.
**Offers.** Money. Real money. Clean-looking legit-adjacent contracts, career fast-tracks, legal cover, "we make problems go away."
**Rep up:** delivering data, discretion, betraying the scene profitably, sabotaging rivals. **Rep down:** leaking their operations, moral grandstanding, helping the Bureau against them (complicated — see arcs).
**Conflict:** predator on the Loft; frenemy-then-rival of the Bureau; quietly owns pieces of Halcyon and NorthLink.

### F3 — The Bureau (`fac.bureau`) — federal cyber enforcement
**What it is.** The fictional federal agency's Port Lumen cyber effort, riding the new post-crisis funding wave.
**Leader.** **Agent Dana Reyes** (`npc.reyes`), field agent, true believer turning cynic.
**Offers.** Immunity, expunged records, a badge-adjacent "consultant" path, the ability to make the Loft or Aperture suffer. Costs you the scene's trust forever if discovered.
**Rep up:** informing, flipping, delivering evidence, closing cases. **Rep down:** tipping off targets, destroying evidence, going dark.
**Conflict:** wants to eat Aperture but keeps being told from above to leave it alone (because Aperture feeds the Bureau data); hunts the Loft because it's easy and looks good in reports.

### F4 — Halcyon / the Legit Ladder (`fac.halcyon`) — the straight world
**What it is.** The dot-com economy: Halcyon Systems, CompCastle, NorthLink, the university placement office. The path where you get a title, options, a 401k, and a slow death of the soul or a genuinely good life — player's call.
**Leader.** **Marcus Vale** (`npc.vale`), Halcyon's charismatic founder-CEO; and your mentor **Priya Raman** (`npc.priya`) who works there.
**Offers.** Salary, equity, housing you can afford, health insurance (matters — see life sim), a degree's payoff, legitimate power that can later *protect* your friends.
**Rep up:** shipping, promotions, closing deals, staying clean. **Rep down:** getting caught moonlighting as a hacker, scandals, sabotaging the company.
**Conflict:** Halcyon is secretly leveraged by Aperture money; going high enough in Halcyon means discovering you work for the conspiracy in a suit.

### F5 — The Neighborhood (`fac.hood`) — Cannery Row / ordinary people
**What it is.** Not organized. The player's parents, neighbors, the diner, the old BBS grognards, the church basement computer class. The moral ballast.
**Leader.** No leader; anchored by **Sal** (`npc.sal`), who runs the Cathode, and the player's **Mom** (`npc.mom`).
**Offers.** Home-cooked meals (stat restoration), cheap rent, gossip (intel), forgiveness, a reason. Low material value, high stat/mood/health value.
**Rep up:** helping neighbors, showing up for family, staying human. **Rep down:** neglect, bringing heat to the Row, becoming a stranger.
**Conflict:** none, by design — this faction is what every other faction costs you. Its rep is the game's conscience meter.

---

## 4. Cast (16 NPCs)

Format: `id` — Name, role — *voice sample* — arc — fates.

### Inner circle

**`npc.jax` — "jax0r" / Jacob Tan, best friend.**
*Voice:* "Dude. DUDE. I got Quake running on the school library machine. This is the best day of my LIFE and also I think I broke the school."
Your ride-or-die since the sixth grade. Funnier than he is careful. Wants the scene to be a *family*, not a business. Enters as comic relief; becomes the moral center; the person the whole tragedy is measured against.
*Arc:* discovers he's good — really good — at social engineering, which scares him. Falls in with a contract that's over his head to impress you / pay his sister's medical bills.
*Fates:* **Alive & free** (you protect him); **arrested taking your fall** (you let/ask him); **flipped informant** (Bureau gets him, he betrays the Loft to save himself — can be redeemed); **dead** (an Act III raid he shouldn't have been at, if you sent him); **gone straight & estranged** (he walks away from the scene and from you); **partner-in-the-end** (survives, runs the diner's back room with you).

**`npc.priya` — "root_cause" / Priya Raman, mentor.**
*Voice:* "Rule one: the machine is never the vulnerability. The person who bought the machine is the vulnerability. Rule two: you are a person who bought a machine."
Late 30s, a legend who went legit at Halcyon after her own scene got someone hurt in the '90s. Sees you as a second chance to do it right, or a relapse she can't look away from.
*Arc:* torn between the safety she built and the guilt that she abandoned the scene. Discovers Halcyon is dirty (Aperture money) and has to choose whether to blow it up.
*Fates:* **whistleblower martyr** (loses everything, becomes a folk hero, maybe dies); **complicit & promoted** (buries it, becomes the thing she hated — can become an Act IV antagonist); **your co-founder** (you and she build something clean); **broken/quit** (drinks, leaves the city); **saved by you** (you take the fall so her name stays clean).

**`npc.corvid` — "Corvid" / Eleanor Voss, scene elder & Loft sysop.**
*Voice:* "The scene isn't the tools. The scene is that when the cops came for Deadline in '94, forty of us wiped our drives the same night and nobody said a word. *That's* the scene. Don't let them buy it out from under you."
40s, runs the board, keeps the ethics, remembers every betrayal for a decade. Aperture wants to buy her list of contacts; the Bureau wants her testimony.
*Arc:* the last true believer, watching the commons get enclosed. Her arc is whether the scene survives her.
*Fates:* **martyred** (Bureau makes an example, long sentence); **exile** (flees, board goes dark); **bought** (Aperture flips her, devastating to the Loft); **succeeded** (she names *you* the next sysop before going out clean); **vindicated** (Act IV: the scene reforms around her ethic).

**`npc.mira` — "静默 / silence_dev" / Mira Okonkwo, rival → possibly love interest.**
*Voice:* "You brute-forced it? Cute. I read the source, found the logic flaw, and had coffee. We are not the same. ...The coffee's still warm if you want to see how I did it."
Your age, transferred into the scene from a bigger city, does everything cleaner and quieter than you. Elegant, prickly, competitive, secretly lonely. The game's most flexible relationship: rival, best-collaborator, or the great love.
*Arc:* running from something in her old city (a job that went bad, a person who died). Whether she trusts you determines whether she runs again.
*Fates:* **partner/spouse** (romance path, life-sim marriage); **the one who got away** (leaves Port Lumen, sends one last message years later); **rival-to-the-end** (works for Aperture *against* you); **casualty** (a shared job goes wrong on a branch where you chose speed over her plan); **the person who flips YOU** (if betrayed, she's the one who hands you to the Bureau).

### Family

**`npc.mom` — Linh Tan, mother.**
*Voice:* "I don't understand what you do. I understand you don't sleep, and you flinch when the phone rings. A mother can work with that."
Works two jobs, doesn't get computers, gets *you*. The health-and-money pressure engine of Act II.
*Fates:* **healthy & proud**; **seriously ill** (the medical-bills crisis — a major Act II money fork); **passes** (if the illness quest is failed/ignored — permanent, world-changing); **estranged** (if you bring enough heat/shame to the Row).

**`npc.dad` — Robert Tan, father.**
*Voice:* "My father fixed radios. I fix engines. You fix... ghosts, I guess. Long as one of us can fix something."
Laid off from the paper mill in Act I (world event); his re-employment or spiral is a quiet barometer of the city's economy and your help.
*Fates:* **retrained/employed** (you help him learn PCs — sweet side arc); **drinking/absent**; **your first legit client** (he becomes the neighborhood's PC guy with your backing).

**`npc.kim` — Kim Tan, younger sister.**
*Voice:* "You think I don't know what ICQ number you use for the *other* stuff? I'm fourteen, not blind. Buy my silence with a burned CD."
Sharp, watches everything, idolizes then fears then judges then maybe forgives you. Her trajectory (college? trouble? following you into the scene?) is shaped by your example.
*Fates:* **thriving** (you kept her out of it); **follows you in** (she becomes a young hacker — proud or horrified, your call); **in danger** (Act III: a faction uses her to pressure you); **estranged**.

### Straight world

**`npc.vale` — Marcus Vale, Halcyon CEO.**
*Voice:* "I'm not selling software. I'm selling the *feeling* that the future already arrived and you're standing in it. The software's just how we bill for it."
Visionary, seductive, hollow at the center. Genuinely likes you; genuinely owned by Aperture. The face of the "success is a trap" theme.
*Fates:* **flames out** (dot-com crash + scandal, arrested or ruined); **escapes clean** (cashes out before the collapse, becomes a Bureau-protected asset); **your patron** (protects you and your friends with his money — if you keep his secret); **exposed by you**.

**`npc.dolores` — Dolores "Dee" Briggs, CompCastle store manager, first boss.**
*Voice:* "The customer says the internet is broken. The customer's *monitor* is unplugged. We do not tell the customer that. We *heal* the customer. Go heal the customer."
Peak Act I comedy. Incompetent, kind, weirdly wise. The tutorial boss and a recurring warm cameo.
*Fates:* **promoted absurdly** (ends up your boss again in a corporate arc); **laid off** (crash) → you might hire her; **runs for city council** (running gag that pays off — becomes a minor political ally in Act IV surveillance-law fights).

**`npc.sal` — Sal Moretti, Cathode Diner owner, neighborhood anchor.**
*Voice:* "You kids and your modems. In my day we had a rotary phone and a knife. Simpler times. Eat. You look like a dropped call."
Ex-something (never says), sees everyone, judges no one, feeds everyone. The confessional booth of the game.
*Fates:* stable anchor; **the diner closes** (gentrification world-event — a loss); **his back room becomes your base**; **he takes a fall for you** (Act IV, if the Row is compromised).

### The scene & the law

**`npc.reyes` — Agent Dana Reyes, Bureau.**
*Voice:* "I came here to catch the people hollowing out this city. Turns out my own office is renting their tools. So. You and me, we're gonna have a complicated few years."
Idealist eroding into pragmatist. The most dangerous relationship because she can be right. Antagonist, tempter, or unlikely ally.
*Fates:* **your handler** (you flip, she protects you); **broken/reassigned** (blows the whistle on her own agency, buried); **your nemesis** (hunts you to the end); **turned** (Act IV: quits, joins the clean-startup ending).

**`npc.kroll` — Vanessa Kroll, Aperture VP.**
*Voice:* "I'm not the bad guy. I'm the *market*. Somebody was always going to buy this data. Aren't you glad it's someone who takes you to dinner first?"
The devil who keeps his word. Never lies to you, which is worse. The best-paying and most corrosive relationship.
*Fates:* **your boss** (Aperture ending); **cut loose** (her superiors burn her — you can save or finish her); **flips on the conspiracy** (if you find her leverage); **arrested** (only if you and the Bureau and Priya all align — the hardest, best "good" ending component).

**`npc.deadline` — "Deadline" / Theo Marsh, cautionary-tale elder.**
*Voice:* "'94. Confiscated my rig, my books, my dog's vet records for some reason. Did fourteen months. Came out, the scene had a new slang and none of my friends had drives anymore. Learn from me: back up your *life*, not your data."
The scene's ghost of Christmas future. Lives in Cannery Row on disability, drinks at the Cathode, gives the best and most terrifying advice.
*Fates:* **redeemed mentor** (helps you avoid his mistakes); **relapse** (you pull him into one last job — dark); **saves your life** (Act III, the old man knows an escape route nobody else does).

**`npc.byte` — "byteme" / Danny Pham, script kiddie.**
*Voice:* "I DDOS'd my own school so we'd get a snow day. It worked. I am basically a god. Teach me EVERYTHING, I'll pay you in Mountain Dew and admiration."
16, reckless, hero-worships you, brings heat like a toddler brings mud. Comic relief that curdles: your example shapes whether he becomes Jax's tragedy 2.0.
*Fates:* **your protégé done right** (grows into a careful pro); **arrested young** (your recklessness rubbed off); **dead/overdose/accident** (the darkest optional beat — a kid who copied you); **turns on you** (feels used, becomes a Bureau tip).

**`npc.grace` — Grace Okafor, alt love interest (straight-world).**
*Voice:* "You keep two lives. I can tell. I'm a nurse — I'm very good at knowing when someone's hiding a wound. I'm not asking which life is real. I'm asking which one you're bringing to dinner."
ER nurse, met via the Mom-illness arc or the neighborhood. Grounded, warm, wants a normal life, an anchor to the light path. The romance that only works if you leave the darkness.
*Fates:* **spouse & normal life** (a "good, quiet" ending); **left behind** (you chose the scene); **collateral** (Act III danger if you don't protect your civilian life); **the reason you flip** (you go clean for her).

**`npc.oracle` — "the Oracle" / anonymous, the conspiracy's whisper.**
*Voice:* "You think Aperture is the top? Aperture is a *cost center*. Look at who insures the risk. Look at NorthLink's parent company. No — don't reply. This channel is already too warm."
Never seen, contacts you via increasingly paranoid channels from Act II. May be Priya's old partner, a Bureau leak, or Kroll's rival — the game keeps it ambiguous until an Act IV reveal keyed to your choices (the Oracle's identity is *set by which faction you're closest to*, a nice data trick).
*Fates:* revealed as one of: **Priya's dead-partner-not-dead**, **Reyes going rogue**, **Deadline's old handle**, or **Kroll hedging her bets** — determined by dominant faction rep at the Act III→IV gate.

---

## 5. Act-by-act main plot

Notation for each CHOICE POINT: **[id]** prompt → options with `effects`.

### ACT I — "The Whir of the Modem"
**Gate to start:** none (game open).
**Gate to Act II:** any two of { skill ≥ 25 in programming OR intrusion; a legit job at level ≥ 2 OR Loft rep ≥ Trusted; `flag:act1_bond_jax` set; `money ≥ 1500` }.
**Tone:** comedy, discovery, tiny stakes.

**Beats.**
1. **Intro — "Boot Sequence."** Sept 2001. Your beige box, your 33.6k modem, your Mom yelling to get off the phone. Jax pages you (BuddyPager) about a leaked shareware crack. Tutorial: schedule a day, watch time flow, gain your first XP. First joke, first `*hugz*` from Mira in a forum thread where she dunks on you.
2. **First money.** Two openings, not exclusive:
   - *Legit:* CompCastle hires you as bench tech under Dee. Tutorial job. Fix "the internet is broken" (monitor unplugged). Comedy quests.
   - *Scene:* Corvid posts a starter contract on `sub.loft` — crack the copy protection on a game. Low heat, low pay, big cred.
3. **The Loft back room.** Jax drags you to Sodium Row. Meet Corvid, Deadline (drunk, ominous), byteme (worshipful). Establish the ethic: "we don't rat."
4. **Rivalry ignites.** Mira solves a board challenge you were working on, publicly, faster. **[CP-A1]** below.
5. **Dad's layoff (world event, ~Nov 2001).** The mill sheds jobs. Money pressure begins. Optional side arc to help Dad.
6. **Act I climax — "The Grandma Job."** A neighbor's PC (fac.hood) is infected; fixing it, you find it's part of a botnet phoning home to *Aperture's* address range. First thread of the conspiracy, played as a "huh, weird" — you don't understand it yet. Corvid does, and goes quiet. **[CP-A2]** below.

**[CP-A1] The public dunk (rivalry with Mira).**
Mira just showed you up on the board.
- *"GG, teach me that source-read trick."* → `rep.loft +3`, `flag:mira_respect`, opens collab track. (Humility path.)
- *"Lucky read. Race you on the next one."* → `flag:mira_rivalry`, sets competitive track; unlocks a recurring race minigame.
- *[Social DC 12] "You transferred from Ridgeport. I heard why you left."* → success: `flag:mira_secret_hinted`, she's rattled, respect+fear; failure: `rep.loft -5`, she humiliates you further, `stat:mood -10`. (Aggressive path — teaches skill checks have teeth.)

**[CP-A2] The Grandma Job discovery.**
You found Aperture's fingerprint in a neighbor's malware.
- *Tell Corvid everything.* → `rep.loft +8`, `flag:corvid_trusts`, Corvid starts feeding you real leads in Act II; sets conspiracy on the "scene" track.
- *Clean it, say nothing, keep the sample.* → `flag:has_aperture_sample` (a powerful evidence item usable in Act III with any faction), `rep.loft +0`. (The hoarder's path — knowledge is capital.)
- *Report it to NorthLink's abuse line (the "responsible" move).* → `rep.halcyon +5`, but `world:aperture_alerted=true` (they now know someone noticed — raises your baseline heat gain in Act II by +10%). The naive good deed has a cost.

**Terminal mission (optional, Act I):** "The Library Card." Break the late-fee database at LSU to clear byteme's fine. Trivial DC. Teaches the terminal UI. *Auto-resolve fallback:* Intrusion check DC 8.

---

### ACT II — "Everyone's Getting Paid"
**Gate to Act II→III:** { conspiracy exposure level ≥ 2 (accrued via beats/side quests) } AND { one faction at Trusted+ } AND { `flag:act2_first_raid` resolved } AND { the Mom-illness arc reached a resolution (any outcome) }.
**Tone:** the money is real, the choices start scarring. Dot-com peak then wobble.

**Beats.**
1. **The offer (Aperture enters).** Vanessa Kroll pages you directly — she saw your work (the Grandma Job, or a contract, depending on Act I). Buys you dinner at Harbor Point. Offers a "consulting" gig: pull a marketing database from a competitor. Clean-looking. Great money. **[CP-B1].**
2. **Priya recruits / warns.** If you leaned legit, Priya gets you an interview at Halcyon. If you leaned scene, she corners you at the Cathode and tries to pull you out. Either way: mentorship deepens. She reveals she was scene, and someone got hurt.
3. **Jax overreaches.** To help pay his sister's (Kim-parallel — actually his own sister `npc.jax_sister`) medical bills, Jax takes an Aperture contract *behind your back* that's too hot. **[CP-B2].**
4. **Mom's illness (major life-sim fork, ~mid Act II).** Linh collapses; no insurance (unless you took the Halcyon job with benefits). The bills are enormous. This is the game's financial gut-punch and the fork that pushes players toward whatever pays fastest — which is Aperture. **[CP-B3].**
5. **The First Raid.** Heat crosses threshold. Port Lumen PD Cyber (Reyes observing) raids a Loft member. Who gets raided depends on your choices — could be you, Jax, byteme, or Corvid. Confiscation, a jail scare, reputation shockwave. `flag:act2_first_raid`. **[CP-B4].**
6. **Mira's wall.** Whether rival or flame, Mira's Ridgeport secret surfaces: a job there killed someone, and she's terrified of repeating it. Romance can bloom or curdle here. Skill-checked emotional scene.
7. **Act II climax — "The Meridian Test."** Aperture/Kroll offers the big one: a dry run on Meridian Trust's new online banking (not the heist yet — reconnaissance). Simultaneously, Reyes makes first contact and offers you a way out — become an informant. **[CP-B5].** This is the act's hinge and sets your Act III faction spine.

**[CP-B1] Kroll's first contract.**
- *Take it, deliver clean.* → `money +5000`, `rep.aperture +15`, `heat +10`, `flag:aperture_client`. Opens Aperture arc.
- *Take it but skim a copy of the data for yourself/Loft.* → `money +5000`, `rep.aperture +15`, `rep.loft +5`, `flag:aperture_client`, `flag:double_dealer` (Kroll finds out eventually — Act III consequence).
- *Refuse, tell Corvid Aperture is recruiting.* → `rep.aperture -10`, `rep.loft +12`, `flag:refused_kroll`, Kroll respects it (weirdly) and circles back later with a better offer.
- *[Business DC 14] Negotiate for equity/retainer instead of one-off.* → success: `flag:aperture_retainer` (steady income stream, deeper hook), `rep.aperture +20`; failure: she laughs, `money +5000` only, `flag:aperture_client`.

**[CP-B2] Jax in over his head.**
Jax's hot contract is about to burn him. He calls you at 3am from the Cathode.
- *Take it over / finish it for him.* → `heat +20` (onto you), `rep with jax +huge`, `flag:jax_protected`, sets Jax's best-fate track.
- *Talk him into aborting and eating the loss.* → `stat: jax's family bills unpaid` (his sister arc worsens), `flag:jax_aborted`, Jax is safe but resentful/ashamed.
- *[Social DC 15] Buy him time by feeding the client a convincing partial.* → success: everyone safe, `flag:jax_covered`, `rep.aperture +5` (Kroll notices your smooth talk); failure: client spooked, `heat +15` on both, `flag:jax_exposed` (feeds his arrest fate).
- *Let him handle it (do nothing).* → `flag:jax_alone`; if you're not there in Act II's raid, this is the flag that can get him arrested or worse.

**[CP-B3] Mom's medical bills.**
The hospital wants money you don't have.
- *Take the fastest Aperture job to cover it.* → `money +bills`, `rep.aperture +15`, `heat +25`, `flag:sold_out_for_mom` (the game never lets you feel purely bad about this — it's love — but it deepens the hook).
- *Ask Halcyon/Priya for an advance/insurance.* → requires `flag:halcyon_employed`; if yes: `rep.halcyon +5`, `flag:priya_debt` (you owe her); if no: option greyed with teaser "Requires: Halcyon employment."
- *Crowd the neighborhood — Sal, Deadline, the Row chip in.* → `rep.hood +20`, `money +partial`, `flag:hood_carried_you` (they'll call this in later — beautifully, not cruelly), Mom survives but recovery is slow.
- *Do a bank job early (reckless).* → `[Intrusion DC 18]` terminal or auto; success: `money +lots`, `heat +40`, `flag:early_bank_job` (Reyes flags you hard); failure: `flag:mom_illness_worsens` toward her death fate, `heat +30`. High risk, teaches the game means it.
- *Can't pay (time runs out).* → `fate:mom → seriously ill/decline`; permanent world change: `world:mom_gone` possible by late Act II, `stat:stress +permanent`, unlocks a grief arc and a "why I do this now" motivation shift.

**[CP-B4] The First Raid — who takes it.**
(Target computed from flags; the CHOICE is your response.)
- If they're at YOUR door: *Wipe and stonewall* `[Opsec DC 16]` → success: `flag:clean_raid`, `rep.loft +15` (you didn't crack); failure: confiscation, `heat` resets lower but `flag:on_bureau_radar`, jail 3 days (`stat` hit, time skip).
- If Jax is raided and you have `flag:jax_alone`: *Rush to take the fall for him* → `flag:took_jax_fall`, jail 10 days, `rep.loft +25`, sets Jax "alive & free, owes you everything." *Or let him face it* → `fate:jax → arrested` track begins.
- If Corvid is raided: *Organize the scene to wipe in solidarity (the '94 move)* `[Social DC 14]` → success: `rep.loft +30`, `flag:solidarity`, legendary; failure: some members panic and one turns informant seed.

**[CP-B5] The Meridian Test / Reyes's offer — Act II hinge.**
Kroll wants recon on Meridian. Reyes offers you immunity to inform.
- *Do the recon for Kroll, hide it from Reyes.* → `rep.aperture +20`, `flag:meridian_recon`, Aperture-spine for Act III.
- *Take Reyes's deal; feed her Aperture.* → `rep.bureau +20`, `rep.aperture -30` (secretly), `flag:informant`, Bureau-spine. Corvid must NEVER know (`flag:informant_secret`).
- *Take Reyes's deal but double-cross her to protect the Loft.* → `flag:double_agent`, `rep.bureau +10`, `rep.loft +10` (hidden), extremely high-wire Act III.
- *Refuse both; go clean, commit to Halcyon/Priya.* → `rep.halcyon +25`, `flag:went_straight`, Halcyon-spine; the conspiracy now hunts you as a loose end from the *inside*.
- *[Cryptography DC 17] Wire yourself and record Kroll's ask as insurance.* → success: `flag:kroll_recording` (a nuclear evidence item), `rep.aperture` unchanged (she doesn't know); failure: she gets suspicious, `flag:kroll_wary`.

**Terminal mission (Act II):** "Meridian Recon." Map the bank's DMZ, find the online-banking staging server, plant a beacon, get out before the trace timer. Medium DC, proxy-bounce mechanic introduced. *Auto-resolve fallback:* Intrusion + Networking averaged, DC 15; failure raises heat, not game over.

---

### ACT III — "Signal Intelligence"
**Gate to Act III→IV:** { the Meridian Heist resolved (any outcome) } AND { conspiracy exposure ≥ 5 } AND { at least three NPC fates locked } AND { the Oracle's identity revealed }.
**Tone:** techno-thriller. Surveillance is ambient. Everyone's compromised. The law you helped cause.

**Beats.**
1. **The law changes (world event).** Partly *because of the Meridian recon leak / the first raid publicity*, Port Lumen passes the **Municipal Network Security Act** (`world:mnsa_passed`). NorthLink must log everything; heat gain city-wide +25%; new "investigation" event frequency up. Dee (if she ran for council) is a swing vote — a callback payoff.
2. **The Oracle reveal.** Identity resolves per dominant faction (see `npc.oracle`). Delivers the shape of the conspiracy: Aperture launders breaches → NorthLink pipes → Bureau rents the surveillance → Halcyon's money makes it look like commerce. Nobody planned it; everybody profits.
3. **Priya's discovery.** She finds Aperture's money inside Halcyon. Comes to you, terrified, with a choice about whether to blow it up. **[CP-C1].**
4. **The wire.** Someone in your inner circle is wearing a wire for the Bureau — Jax (if flipped), Mira (if betrayed), or byteme (if used). A tense scene where you can detect it. **[CP-C2].**
5. **Kim/family in the crosshairs.** A faction leverages your family (Kim endangered, or Mom's memory used against you if she passed). Personal stakes peak. Skill-checked rescue/defusal.
6. **Act III climax — "The Meridian Heist" (or its refusal).** The real job: drain / expose / protect Meridian Trust. Framing depends on your spine (Aperture heist for profit; Bureau sting; Loft Robin-Hood exposure; Halcyon inside-protection). The city's biggest night. **[CP-C3].** Multiple NPCs' fates lock here based on who you bring and who you protect.

**[CP-C1] Priya's dilemma.**
She has proof Halcyon is dirty.
- *Help her blow the whistle.* → `flag:whistleblow_prepped`, `rep.halcyon -40`, `rep.bureau +15`, sets Priya "martyr" track and a "good" ending branch; `world:halcyon_stock_wobble`.
- *Talk her down to protect her (and your friends' jobs).* → `flag:priya_silenced`, `rep.halcyon +10`, Priya "complicit" track, she resents you or thanks you (branch on her affinity).
- *Take her proof and sell it to Kroll/Aperture for protection.* → `money +huge`, `rep.aperture +30`, `fate:priya → betrayed` (she may become an Act IV antagonist or break), darkest mentor betrayal.
- *[Business DC 18] Use the proof to force Vale (Halcyon) to clean house from inside.* → success: `flag:vale_reformed`, `world:halcyon_survives_clean`, unique "reform from within" branch, `rep.halcyon +20`; failure: Vale tips Kroll, `flag:kroll_hunts_priya`.

**[CP-C2] The wire.**
You suspect an inner-circle member is recording you.
- *[Opsec DC 16] Sweep the meeting spot / detect the wire.* → success: you know who; proceed with eyes open; failure: you talk freely, `flag:incriminated` (Act IV evidence against you).
- *Confront them directly.* → branches per NPC: Jax breaks down (redeemable), Mira goes cold (may flip fully), byteme panics (may bolt). Sets that NPC's fate flag.
- *Feed them false info to burn the Bureau.* → `[Social DC 17]` success: `rep.bureau -20`, `flag:fed_the_wire`, brutal on Reyes; failure: `flag:bureau_onto_you_hard`.
- *Cut them out coldly, say nothing.* → relationship `-huge`, that NPC drifts toward a lonely fate; you stay safe.

**[CP-C3] The Meridian Heist — Act III climax.**
Framing per spine; the shared choice is *what you actually do inside* and *who you protect.* Bring a crew (choose up to 2 of: Jax, Mira, byteme, Deadline). Each has a role and a risk.
- *Aperture spine — drain it for Kroll.* → `money +massive`, `rep.aperture +40`, `world:meridian_collapse` (bank fails, city recession deepens, `world:salaries_down`), `heat +50`. If byteme is on the crew and you cut corners: `fate:byteme → arrested/dead`.
- *Bureau spine — sting the whole thing.* → `rep.bureau +40`, mass arrests; you choose who gets swept: **[sub-choice]** protect the Loft (`rep.loft` salvaged but Kroll walks) or take Aperture (Kroll falls but the Loft gets caught in the net). Sets many fates.
- *Loft spine — expose it, Robin Hood.* → leak Meridian's dirty dealings + Aperture ties to the News. `world:aperture_exposed`, `rep.loft +50`, `heat +40`, `flag:folk_hero`. Requires `flag:kroll_recording` OR `flag:has_aperture_sample` OR Priya's proof to succeed at `[Intrusion DC 18]`; else it's dismissed as a hoax.
- *Halcyon spine — sabotage the heist to protect the city's money.* → you flip the job against everyone, `rep.halcyon +40`, `flag:the_good_soldier`, Vale protects you, but the scene marks you a traitor forever (`rep.loft → Hostile`).
- *[Cryptography DC 20] The clean pull — take the evidence, not the money, and vanish.* → success: `flag:ghost_protocol`, you hold the whole conspiracy's proof and owe no one; the ultimate leverage into Act IV's rarest endings; failure: trace completes, `flag:burned`, forced into someone's protection.

**Terminal mission (Act III):** "Signal Intelligence." The full Uplink-lite loop against Meridian: proxy chain of 4+, live trace timer, IDS to slip `[Intrusion DC 18]`, crack the transaction DB, decide to download/wipe/plant, scrub logs `[Opsec DC 16]`. Crew members grant bonuses or introduce risk events (byteme trips an alarm on a botched roll). *Auto-resolve fallback:* weighted skill roll of (Intrusion+Networking+Cryptography+Opsec)/4 vs DC 18, with crew and gear modifiers; failure = setback + heat + a crew casualty roll, never a game over.

---

### ACT IV — "The Long Tail"
**Gate:** entered automatically after C3.
**Tone:** consequence, epilogue-in-motion, dark humor as grief management. No new systems — the idle loop continues but the world is now the version your choices made. 1-3 in-game years compress via time skips punctuated by "reckoning" scenes.

**Beats.**
1. **The reckonings.** A scene each with the surviving inner circle where fates lock: Jax, Mira, Priya, Corvid, Reyes/Kroll (whichever survived), family. Each is a quiet conversation, not a boss fight.
2. **The last leverage.** If you hold `flag:ghost_protocol` / `flag:kroll_recording` / whistleblow proof, one final **[CP-D1]**: what you do with the truth. This selects among the top-tier endings.
3. **The city.** A montage keyed to `world:` variables: is Halcyon a tombstone or a clean success? Did the diner close? Is the MNSA repealed (if Dee-councilmember + you campaigned) or entrenched? Recession or recovery?
4. **The last day.** A final free day where you can visit whoever's left. Then the epilogue.

**[CP-D1] What the truth is for.**
(Requires holding decisive evidence.)
- *Publish everything.* → "The Reckoning" ending family; `world:aperture_destroyed`, mass fallout, you're a hunted hero.
- *Bury it for a quiet life.* → "The Civilian" ending family; peace, complicity, a normal happiness that the game refuses to fully condemn.
- *Sell it, retire rich and dirty.* → "The Ghost King" ending; you win the game the world plays and lose the one your friends played.
- *Give it to the one person who'll use it right (Priya/Reyes/Corvid, if alive & trusted).* → "The Handoff" ending; you step out of the story so it can end better than you could make it.

---

## 6. Faction arcs

Each arc runs across acts, gated by rep and story flags.

### F1 — The Loft arc: "Keep the Commons" (`arc.loft`)
1. **Initiation — "Prove You Won't Rat."** Corvid gives a low-heat contract; a planted opportunity to sell a member out for extra cash tests you. *Branch:* refuse (`rep +8`) / take the bait (`rep -15`, Corvid never fully trusts you).
2. **"The Enclosure."** Aperture starts poaching Loft members with money. Recruit/dissuade three members via Social checks. *Branch:* keep the scene whole (`flag:loft_intact`) / let it hollow (`flag:loft_bleeding`).
3. **"Solidarity or Sauve-Qui-Peut."** The first raid; organize the collective wipe or don't (ties to CP-B4).
4. **"The Sysop Question."** Corvid, facing prison/exile, must name a successor. *Branch:* you accept (`flag:you_are_sysop`, huge Act IV weight) / decline (`npc.mira` or `npc.deadline` takes it) / the board goes dark.
5. **"The Last Commons."** Act IV: rebuild the scene clean, or hold its funeral. Determines `world:scene_survives`.

### F2 — Aperture arc: "Special Accounts" (`arc.aperture`)
1. **"Dinner at Harbor Point."** Kroll's first contract (CP-B1).
2. **"The Retainer."** Steady work; each job launders a real breach. A moment you realize the "marketing data" is people's medical/financial records. *Branch:* keep going (`rep +`, `flag:knowing_complicity`) / skim evidence (`flag:building_a_case`).
3. **"The Competitor."** Kroll asks you to sabotage a rival firm — which employs a neighbor/friend. Personal cost. *Branch.*
4. **"The Meridian Job."** The heist as profit (CP-C3 Aperture spine).
5. **"Made."** Act IV: Kroll offers you her seat as she's pushed out from above. *Branch:* take it (become the conspiracy) / use the moment to burn it / save Kroll as an unlikely ally.

### F3 — The Bureau arc: "Cooperating Witness" (`arc.bureau`)
1. **"The Approach."** Reyes offers immunity (CP-B5). 
2. **"First Delivery."** Feed her a small case; feel the wire's weight. *Branch:* real intel / false intel (double-agent seed).
3. **"The Line You Won't Cross."** She asks you to hand over a friend (Jax/Corvid). *Branch:* comply (`fate` locks, `rep.bureau +`) / refuse and jeopardize the deal / feed a decoy `[Social DC 17]`.
4. **"The Rot Upstairs."** Reyes discovers her own office protects Aperture. She goes off-book with you. *Branch:* help her whistleblow / talk her back to safety / exploit it.
5. **"The Sting."** Meridian as Bureau operation (CP-C3 Bureau spine); choose your sacrificial targets.

### F4 — Halcyon arc: "Vesting Schedule" (`arc.halcyon`)
1. **"The Interview."** Priya gets you in; Dee (laid off, rehired here as office manager — callback) greets you.
2. **"Ship It."** Career quests: crunch, a promotion, options that vest across acts (a literal `money` time-bomb tied to `world:halcyon_stock`).
3. **"The Audit."** You brush against Aperture's money in the books. *Branch:* look away / dig (feeds CP-C1).
4. **"The Crash."** Dot-com deflation world event; layoffs. Protect your team or your options. *Branch.*
5. **"Golden Handcuffs / Golden Parachute."** Act IV: Vale offers you real power if you keep the secret. *Branch:* ascend (complicit success) / reform from within (`flag:vale_reformed`) / detonate.

### F5 — The Neighborhood arc: "Home Directory" (`arc.hood`)
1. **"Fix Grandma's PC."** The recurring warm quest; each fix = `rep.hood +`, small money, big mood.
2. **"Dad's Comeback."** Teach Dad PCs (Hardware/Social checks) → he becomes the Row's tech guy. *Branch:* invest time (sweet fate) / neglect (his spiral).
3. **"The Row Chips In."** They carry you through a crisis (CP-B3 option) — creating a debt of *love*, not money.
4. **"Save the Cathode."** Gentrification threatens Sal's diner. *Branch:* buy in / fundraise `[Business DC 15]` / let it close (`world:cathode_gone`).
5. **"Coming Home."** Act IV: the Row is the only faction whose "Inner" tier can't be bought — it's the ending-modifier that decides whether any dark ending still has a warm room in it.

---

## 7. Side quests (28)

**Family**
1. **"Y2K Leftovers"** — Dad's old boss begs you to check if the mill's ancient billing system is a ticking bomb; it isn't, but you find the layoffs were decided *before* the "computer problem" excuse. Tell Dad the truth or let him keep his dignity.
2. **"Kim's First Login"** — Kim wants a computer for school; the only one you can afford is a hot one from a contract. Give her clean or dirty hardware (sets a `flag` that echoes in her fate).
3. **"The Slideshow"** — Mom wants you to digitize the family photos before an old CD rots. Pure warmth. Skipping it (letting time run out) means the photos are lost — a quiet permanent loss.
4. **"Uncle's Pyramid"** — A relative is deep in an online MLM/Ponzi; you can hack proof it's a scam (family shame) or stay out (he loses the house). Twist: the scam is an Aperture shell.
5. **"Dad's Dating Profile"** (if Mom passed) — Dad, lonely, asks you to set up an online dating account. Comedy that turns tender; you can vet a match who's actually a romance scammer.

**Friends**
6. **"Jax's Sister"** — Recurring: her illness/bills are Jax's whole motivation. Help fund treatment legit or hot; the method shapes Jax's fate.
7. **"byteme's Snow Day"** — Danny DDoS'd his school again. Cover for him, teach him to do it invisibly (dangerous mentorship), or scare him straight.
8. **"Deadline's Dog"** — Theo's dog needs a vet he can't afford; the vet's records were in that '94 confiscation (running gag). Pay, hack a discount, or organize the Row.
9. **"Corvid's Backup"** — Corvid asks you to hold a dead-man's-switch archive of the scene's secrets. Guard it, read it (betrayal), or refuse the burden.
10. **"The Reunion LAN"** — Organize one last Quake LAN party for the old crew; who shows up is a live readout of your friendships. Pure nostalgia; optional bittersweet if members are jailed/dead.

**Romance**
11. **"The Coffee's Still Warm"** — Mira's opening romance beat; a late-night collab that becomes something. Skill-check emotional honesty.
12. **"Two Lives"** — Grace asks which life you're bringing to dinner; you literally choose which wardrobe/apartment/story to present. Sets civilian-cover strength.
13. **"Ridgeport"** — Go with Mira to confront what she ran from; a person there wants revenge for the job that killed someone. Defuse `[Social DC 17]`, take the blame for her, or learn she lied about her role.
14. **"Meet the Parents"** — Bring a partner to the Row. Mom/Dad's reaction, and whether you can hide the hacker life over dinner `[Social DC 14]`.
15. **"The Proposal Server"** — Hide a marriage proposal inside a custom webpage/BBS door game. Adorable. Can be sabotaged by a jealous rival if `flag:mira_rivalry` + you chose Grace.

**Freelance clients**
16. **"The Divorce Drive"** — A client wants their soon-to-be-ex's deleted emails recovered. Recover them, fabricate them (dark), or discover the ex is the real victim and flip who you help.
17. **"Overdue"** — A small-business owner is being crushed by a bigger firm's malware; fix it and trace it to Aperture (conspiracy breadcrumb).
18. **"The Vanishing Highscore"** — An arcade owner's machine keeps getting cracked for free credits; the culprit is byteme. Rat, cover, or turn it into a lesson.
19. **"Wedding Video, .avi"** — Recover a couple's corrupted wedding video from a dying HDD; sweet, hardware-skill flavored, tiny stakes, big feels.
20. **"The Church Basement Class"** — Teach seniors to use email; one of them turns out to be an old phreaker who taught Corvid (lore drop) and offers a legendary analog trick.

**Neighborhood / oddities / easter eggs**
21. **"The Haunted Modem"** — A neighbor swears their modem is possessed (it's crosstalk from a cordless phone + a war-dialer someone's running). Solve the "ghost." Dial-up nostalgia gold.
22. **"51 Floppies"** — Someone needs a game restored from a shoebox of floppies, three of which are bad. A physical-media puzzle; the 51st disk has a decade-old love letter on it.
23. **"The BBS That Wouldn't Die"** — Find a still-running BBS from 1991 on a forgotten line; its sysop died years ago, the board runs on. Preserve it, or harvest its user list (dark).
24. **"Press Any Key"** — Dee's PC won't start; the "any key" gag. Pure comedy, `rep.halcyon +` and a laugh.
25. **"The Konami Contact"** — Enter a code sequence in the BuddyPager and the Oracle drops an extra clue (easter egg that's also foreshadowing).
26. **"Tamagotchi Triage"** — Kim's virtual pet is "dying"; hack its save state to revive it. Establishes you'll break any rule for family, in miniature.

**Dark / late-game**
27. **"The Wire You Planted"** — A tool you sold/taught is now being used by the Bureau to surveil the Row. Recall it, weaponize it, or live with it. Directly ties your Act I generosity to Act III surveillance.
28. **"byteme's Funeral"** (only if `fate:byteme → dead`) — Organize or attend the kid's service. Who you have to look at (Jax, Corvid, his mom) depends on your choices. No mechanics. The game's quietest, hardest room.

---

## 8. Endings (8)

Each: conditions → epilogue sketch. Endings are computed from flags/rep/fates, not a single final button.

**E1 — "The Reckoning" (heroic exposure).**
*Conditions:* `flag:folk_hero` OR `flag:whistleblow_prepped` + decisive evidence held + `world:aperture_exposed`; Loft or Bureau spine.
*Epilogue:* Aperture collapses; NorthLink's surveillance contracts are canceled; the MNSA is repealed after hearings (Dee's swing vote if she's on council). You're a hunted celebrity — indicted but a folk hero; you skip the city or take a plea and become a reform advocate. Priya (if alive) testifies beside you. Corvid, vindicated, reopens the board. Jax runs the Cathode back room. The city is poorer, freer, and remembers your handle.

**E2 — "The Ghost King" (dirty win).**
*Conditions:* Aperture spine, `arc.aperture` step 5 = take Kroll's seat; low `rep.hood`; friends betrayed.
*Epilogue:* You are Special Accounts now. Rich, protected, alone. Kroll (if you finished her) is a cautionary story you tell interns. Jax doesn't return your pages. Mira works two floors down and doesn't look at you. The city hums along, surveilled and solvent. Last shot: your reflection in a dark monitor, and no `*hugz*` in the inbox for years.

**E3 — "The Handoff" (self-erasure for the greater good).**
*Conditions:* `flag:ghost_protocol` + CP-D1 "give it to the one who'll use it right" + that NPC alive & Trusted.
*Epilogue:* You vanish. The evidence goes to Reyes/Priya/Corvid, who finishes what you couldn't without your body count. A postcard to the Row, no return address. The scene tells stories about the ghost who had the whole thing and *walked away clean*. Bittersweet, quietly the "best" ending — you gave up being the protagonist so the ending could be good.

**E4 — "The Civilian" (chose the light).**
*Conditions:* `flag:went_straight` + Grace or Mira (settled) + `rep.hood` high + buried the truth (CP-D1).
*Epilogue:* A normal job (Halcyon-clean if `flag:vale_reformed`, else a modest firm). A marriage. A mortgage in Millgate. You know what you know and you sleep anyway, mostly. The conspiracy grinds on without you, smaller for your absence, larger than your peace. The photos got digitized. Mom (if saved) holds a grandchild. It is a happy ending that the game lets you feel slightly guilty about.

**E5 — "Keeper of the Commons" (the scene wins).**
*Conditions:* `flag:you_are_sysop` + `flag:loft_intact` + `world:scene_survives`; Corvid succeeded you cleanly.
*Epilogue:* You run the board now. It's smaller, careful, clean — mutual aid, not warez. Byteme (grown, careful) is your right hand. You beat Aperture not by destroying it but by outlasting it as *something worth belonging to*. Deadline gets his dog. The Cathode stays open. Not every thread of the conspiracy is cut, but the commons is still here, and so are your friends.

**E6 — "Cooperating Witness" (the Bureau ending).**
*Conditions:* Bureau spine, `flag:informant`, survived the sting; `rep.loft` destroyed.
*Epilogue:* Expunged record, a consultant badge, a Bureau salary. You put real predators away — and some friends too. Reyes (if she stayed) is your partner and neither of you says the quiet part. You did good and it cost the exact people who taught you how. The Row doesn't invite you to things. You tell yourself the math worked. Some nights you believe it.

**E7 — "Burnout" (the human failure).**
*Conditions:* health/stress in the red for sustained late game; Mom's death arc + neglected relationships; no decisive evidence.
*Epilogue:* No prison, no glory. Just a body that quit. You're 30 and you feel 50. The conspiracy didn't get you; the idle drift did — the years you spent at the screen while people left the room. A short, grey epilogue: who still visits (almost no one), what you never finished. The game's warning shot about its own core loop, delivered without cruelty.

**E8 — "Scorched Earth" (mutual destruction).**
*Conditions:* `flag:double_agent` played to the end + `flag:kroll_recording` + you turned every faction against each other.
*Epilogue:* Aperture, the Bureau office, and Halcyon all burn in overlapping scandals you engineered. The MNSA collapses in the chaos. It's a Pyrrhic bonfire: the city's tech economy craters (`world:salaries_down`, recession), good people lose jobs alongside the guilty, and you're the only one who understands why it all happened — from a motel room, feeding coins to a payphone, genuinely unsure if you saved the city or just proved you could end it. The most "Disco Elysium" ending: technically a win, morally a question mark, unforgettable.

*(E9/E10 stubs for later: "The Marriage" — a romance-locked variant of E4/E5 where the partner's fate is the epilogue's spine; "The Protégé" — Kim or byteme carries your legacy forward, good or catastrophic, as a post-credits hook.)*

---

## 9. World-reaction system

**24 example news headlines (`news.id` — trigger → text).** The News window pulls from a pool filtered by set flags/world vars.

1. `news.mill_layoffs` (`world:mill_layoffs`) — "Port Lumen Paper Sheds 200 Jobs; 'Automation,' Says Management."
2. `news.aperture_alerted` (`world:aperture_alerted`) — "Local 'Data Hygiene' Firm Aperture Posts Record Quarter."
3. `news.first_raid_public` (`flag:act2_first_raid`) — "PD Cyber Unit Seizes 'Hacker Cache' in Sodium Row Raid."
4. `news.jax_arrest` (`fate:jax → arrested`) — "Teen Charged in Bank Systems Intrusion; 'A Good Kid,' Neighbors Say."
5. `news.mom_fundraiser` (`flag:hood_carried_you`) — "Cannery Row Diner Hosts Benefit for Ailing Neighbor."
6. `news.mnsa_passed` (`world:mnsa_passed`) — "Council Passes Network Security Act; ISPs to Retain All Logs." → **effect:** heat gain +25%.
7. `news.mnsa_repealed` (`world:mnsa_repealed`) — "Amid Scandal, Council Repeals Surveillance Law." → **effect:** heat gain -25% back to baseline.
8. `news.halcyon_ipo` (`world:halcyon_ipo`) — "Halcyon Systems Soars on Debut; Vale Named 'Man of the Year.'" → **effect:** your Halcyon options value +.
9. `news.halcyon_crash` (`world:halcyon_stock_wobble`) — "Halcyon Shares Halved as Dot-Com Air Escapes." → **effect:** options value -, layoffs event.
10. `news.halcyon_clean` (`flag:vale_reformed`) — "Halcyon 'Cleans House,' Cuts Ties to Data Broker." → **effect:** `world:halcyon_survives_clean`.
11. `news.meridian_collapse` (`world:meridian_collapse`) — "Meridian Trust Insolvent After 'Catastrophic Breach.'" → **effect:** `world:salaries_down`, recession deepens, prices -.
12. `news.aperture_exposed` (`world:aperture_exposed`) — "LEAKED: How a 'Marketing' Firm Sold the City's Secrets." → **effect:** Aperture rep offers dry up, Bureau scrambles.
13. `news.bureau_scandal` (`rep.bureau` self-destruct branch) — "Federal Office Accused of Renting Tools From Firm It Should Investigate."
14. `news.byteme_tragedy` (`fate:byteme → dead`) — "Community Mourns 16-Year-Old; Questions About Online 'Scene.'"
15. `news.corvid_trial` (`fate:corvid → martyred`) — "'Sysop' Sentenced to 8 Years; Supporters Call It Overreach."
16. `news.cathode_closes` (`world:cathode_gone`) — "Beloved 24-Hour Diner Closes as Millgate Rents Soar."
17. `news.cathode_saved` (`flag:saved_cathode`) — "Neighbors Buy the Cathode; 'It's Ours Now,' Says Owner."
18. `news.dee_council` (`flag:dee_council`) — "Former Retail Manager Wins Council Seat on 'Common Sense Tech' Platform."
19. `news.mira_leaves` (`fate:mira → the one who got away`) — "Rising Tech Talent Departs Port Lumen for the Coast."
20. `news.dad_business` (`flag:dad_tech_guy`) — "Cannery Row's Own 'PC Doctor' Books Solid Through Spring."
21. `news.dotcom_recovery` (`world:salaries_up`) — "Tech Hiring Rebounds; Starting Salaries Up 20% Downtown." → **effect:** legit job pay +, `world:salaries_up`.
22. `news.crackdown` (`heat` city-wide high) — "Mayor Vows 'Zero Tolerance' for Cybercrime After String of Breaches." → **effect:** investigation event frequency +.
23. `news.folk_hero` (`flag:folk_hero`) — "Who Is 'the Handle'? City Split on Vigilante Hacker." → **effect:** Loft recruitment +, heat +.
24. `news.priya_whistleblow` (`fate:priya → martyr`) — "Halcyon Engineer's Testimony Rocks Data-Broker Industry."

**World variables (state that other systems read).**
- `world:heat_gain_modifier` (float; MNSA +0.25, repeal resets, crackdown +0.15).
- `world:salaries` (enum: crash_low / baseline / recovery_high) — sets legit job pay and freelance rates.
- `world:prices` (tracks rent/hardware; recession lowers, recovery raises).
- `world:halcyon_state` (rising / crashed / clean / dead) — affects options, jobs, Vale/Priya fates.
- `world:meridian_state` (healthy / breached / collapsed) — affects bank contracts and city economy.
- `world:aperture_state` (thriving / exposed / destroyed) — gates Aperture contracts.
- `world:scene_state` (vibrant / bleeding / dark / reformed) — Loft contract availability and mood.
- `world:surveillance_level` (low / high) — heat, investigation frequency, opsec DCs.
- `world:cathode_open` (bool), `world:mill_open` (bool), `world:dad_state`, `world:mom_state` — neighborhood texture and available warm-restore locations.
- `world:investigation_frequency` (event cadence for raids/probes).

**Feedback loops (so the world feels causal).**
- High player heat → `crackdown` headline → `investigation_frequency +` → more raids → NPC fates lock → new headlines. 
- A big heist → `meridian_collapse` → `salaries_down` → your friends' legit jobs pay less → they're more tempted by Aperture → the scene bleeds. The player *sees* their choices ripple through everyone's paycheck.

---

## 10. Life-sim integration

The life sim is not a parallel track; it's the *pressure system* that makes the plot's temptations land.

**Family ↔ plot.**
- **Mom's illness (CP-B3)** is the engine that makes Aperture's dirty money feel *necessary*, not greedy. Insurance from a Halcyon job (life-sim benefit) is a mechanical reward that changes a moral scene. Her fate (`world:mom_state`) reshapes your motivation, available warm-restore location (home meals), and Kim's trajectory.
- **Dad's layoff/comeback** ties the city's economy (`world:mill_open`, `world:salaries`) to a personal arc, and teaching him PCs is a Hardware/Social skill sink with an emotional payoff.
- **Kim** mirrors your ethics: your hardware/opsec choices literally set flags that steer whether she thrives, follows you in, or is endangered — the clearest "you cause fates" loop, applied to family.

**Romance ↔ plot.**
- **Mira** fuses the rivalry mechanic (board races, collab bonuses on contracts) with the deepest romance. Choosing her means your best hacking partner is also the person whose death or betrayal hurts most — mechanics and stakes are the same object. Her Ridgeport secret gates a trust threshold that unlocks joint terminal missions with a partner bonus.
- **Grace** is the anchor to the light: dating her raises mood/health (life-sim), lowers your tolerance for heat scenes narratively, and her civilian status becomes an Act III vulnerability (`collateral` fate) that the plot exploits — your two lives collide mechanically via the `flag:two_lives_strength` cover stat set in side quest #12.
- Marriage is a life-sim milestone with plot teeth: a spouse's fate becomes an ending spine (E9 stub), and a partner can be brought as crew (Mira) or must be *protected from* the crew (Grace).

**Housing ↔ plot.**
- Housing tier (parents' flat → dorm/rented room → Millgate apartment → own place) gates *operational security*: a raid at your parents' flat endangers family (`rep.hood`, Kim), while your own place lets you run hotter but costs rent that ties you to income sources (legit vs. Aperture). Moving out is both a life goal and a strategic op-sec decision. `world:prices` (recession/recovery) makes housing affordability swing with the plot's economic events.

**Health/stress/energy ↔ plot & idle core.**
- The idle scheduler forces the theme: hours spent hacking/working are hours *not* spent on family, romance, fitness, or rest. **Burnout (E7)** is a real ending, reachable purely by optimizing income and neglecting the humans — the life sim is how the game critiques its own grind. Warm-restore locations (home meals, the Cathode, a partner) exist only if you kept those relationships and places alive, so neglect compounds mechanically.
- Stress raises skill-check failure variance in emotional scenes (a stressed player fumbles the Social check to talk Jax down), fusing stat management with narrative outcomes.

**University ↔ plot.**
- LSU enrollment (entrance exam = a skill-gated life event) provides the degree that gates the top legit jobs (Halcyon senior roles), a semester schedule that competes with contract time (idle-core tension), the CS basement as a low-heat operating base, and a professor NPC whose research grant is quietly Aperture/Bureau-funded — the university is both the cleanest path and another door into the conspiracy. Dropping out, finishing, or weaponizing a student position are all viable and flagged.

**The unifying claim.** In HACKERSIM, the life sim isn't the thing you do between missions. It's the *price sheet*. Every dark choice is cheap because someone you love needs money, time, or protection you didn't have — and every ending is really just the invoice for how you spent the one resource the idle clock never stops draining: the people in the room while you were staring at the screen.

---

*Proposal A ends. Ready to decompose into `scenes/`, `quests/`, `npcs/`, `factions/`, `news/`, and `world/` data modules on request.*
