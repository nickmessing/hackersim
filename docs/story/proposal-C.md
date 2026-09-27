# HACKERSIM — Story Proposal C

## "The Systemic-Agency Cut"

> A narrative-design proposal built around one principle: **the systems ARE the story.**
> Every schedule hour, every contract, every dollar and every point of Heat is a
> sentence the player writes. Factions want incompatible things; the world remembers;
> and there are many roads through each act, none of them the "correct" one.

---

## 1. Logline, Themes, and the Tonal Descent

### Logline

**It is the last autumn of the old internet.** You are eighteen, fresh out of high
school in a rusting river city, with a beige tower, a 33.6k modem, and no plan. Over
the next decade you can become a respected engineer, a legendary intruder, a burned-out
ghost, a federal asset, or the person who quietly decides what a whole city is allowed
to know about itself. The machine you're really learning to operate is your own life.

### Themes

- **Access is power, and power is a debt.** Every door you learn to open is a door
  someone else can be pushed through. The game keeps a ledger.
- **You cannot be trusted by everyone.** Reputation is not a score that only goes up.
  Pleasing the Underground costs you the Bureau; the union of sysadmins despises the
  carders; your mother's approval and your best contract cannot coexist in the same week.
- **The idle life is the real life.** Sleep, food, rent, a parent's cough, a partner's
  patience — these are not "life-sim garnish." They are the resource economy that story
  choices spend. Burnout is a plot device.
- **The old net dies and something colder is built on its grave.** Act by act, the
  free, anonymous, gloriously amateur internet is enclosed, indexed, surveilled and
  monetized. The player is complicit in whichever direction it tips.
- **Nostalgia is a trap.** The warm dial-up handshake becomes the sound of a wiretap.

### The tonal descent (light → dark), mapped to acts

| Act | Tone | Emotional register | What the world feels like |
|---|---|---|---|
| **Act I — "Handshake"** | Warm, comedic, nostalgic | Underdog slice-of-life | Fixing grandmothers' PCs, forum flame wars, a boss who thinks "the internet" is a program you open. |
| **Act II — "Escalation"** | Wry but tightening | Stakes and consequences arrive | Your first real money, your first raid scare, your first funeral, your first NDA. |
| **Act III — "Enclosure"** | Cold, paranoid, morally grey | Conspiracy techno-thriller | Surveillance law passes or fails *because of you*; friends flip; the city's data is a battlefield. |
| **Act IV — "Ghost"** | Bleak, quiet, with gallows humor | Reckoning and legacy | You decide what kind of ruin or renaissance you leave behind. Dark jokes still land. |

The humor never fully dies — a character who cracks jokes at a stakeout in Act IV is
doing exactly what people do. But by then the jokes cost something.

---

## 2. The World

### The city: **Vireburg** ("Vire")

A mid-sized industrial river city in a generic, unnamed English-speaking country, ~640,000
people. Old money in steel and shipping, new money nowhere yet. Fog off the Vire River,
a decaying tram network, a downtown of 1970s concrete banks and one gleaming new "tech
park" that the mayor keeps promising will make Vireburg "the next Silicon anything." It
never quite does.

Neighborhoods the player will live in and move between:

- **Ashmill** — the old working-class east side. Row houses, the player's parents' flat,
  cheap noodle shops, the internet café where it all starts. Where you're *from*.
- **The Terrace** — student district around Vireburg Polytechnic. Dorms, cheap bars,
  photocopied zines, the first place you can afford to move to alone.
- **Kessler Heights** — money. Glass, security guards, the tech park, the good hospital.
  Where you end up if you win the legit game, or where you break in if you don't.
- **The Flats** — flood-prone industrial south. Warehouses, a defunct telephone exchange,
  the physical places the Underground meets when it dares to meet at all.
- **Ferrow** — the suburb of cul-de-sacs and strip malls. Your first house, maybe. Where
  the game's quietest, saddest endings live.

### Era details (grounding, ~Sept 2001 → ~2013)

Dial-up modems and the sacred handshake screech; busy signals; "get off the phone, I'm
online." AOL-style walled gardens giving way to the open web. Napster's ghost and its
successors. LAN parties hauling CRT monitors in car trunks. Burned CD-Rs labeled in
marker. IRC and ICQ-style pagers. Web rings and guestbooks. The dotcom crash still
smoking. Then, across the decade: broadband creeping in (ISDN → DSL → cable → fiber),
forums professionalizing into "social," phones getting cameras, "the cloud," the first
data-breach panics, the first surveillance laws written in a hurry after a crisis.

### 9 notable organizations, companies & places

1. **Nettr / "The Net Nook"** — the Ashmill internet café where the player takes their
   first jobs and meets the Underground. Owner: Yolanda "Yo" Prakash. Later a battleground
   when a chain tries to buy it out.
2. **CompuFix Vireburg** — a strip-mall PC repair franchise; the player's likely first
   real employer. Corporate, cheerful, exploitative. Their motto: "We Fix It Or It's Free!"
   (It is never free.)
3. **Halloran Steel Data Services (HSDS)** — the steel dynasty's failing attempt to
   pivot to "IT services." Old servers, older money, desperate for anyone under 30. A
   legit career ladder AND a soft target.
4. **Ardent Systems** — the tech-park darling startup: "personal firewall for the family."
   Charismatic founder, VC money, cutting corners. Rises or falls partly on player action.
   Their consumer product secretly phones home — a late-game reveal.
5. **Meridian Telecom** — the regional phone/ISP monopoly. Owns the copper, the exchange
   in the Flats, and increasingly the government's ear. The Enclosure's corporate engine.
6. **Vireburg Polytechnic ("the Poly")** — the university. Entrance exam, semesters,
   a CS degree, a legendary and burned-out professor, and the campus network as a training
   ground / first real intrusion target.
7. **The Undertow** — not a place but the name for Vireburg's underground BBS/forum,
   passed hand to hand. Its physical meets happen in the Flats. Home of the Underground faction.
8. **Vireburg Metro PD — Cyber Unit ("the Cage")** — three detectives and a budget, at
   first a joke, later terrifyingly competent when federal money arrives.
9. **The Ridgeline Bureau field office** — the federal presence. Quiet until Act II, then
   it never leaves. Runs the "flip a hacker into an asset" program the player can be caught by.

*(Optional 10th, for flavor):* **Saint Bartholomew's Hospital, Kessler Heights** — where
parents get sick, where a late arc's data theft has real human stakes.

---

## 3. Factions (5)

Reputation with each faction is a **-100…+100** scalar (`rep.<faction>`), surfaced as a
named tier. Crucially, **advancing one faction usually damages at least one other**, and
some actions damage rep silently (the world finds out later). Each faction offers
concrete mechanical goods so rep is never abstract.

### 3.1 The Undertow (underground hacker collective)

- **Ethos / goal:** information wants to be free; corporations and cops are the enemy;
  loyalty to the scene above all. Increasingly radicalized as Enclosure looms.
- **Leader:** **`spectra`** (Nadia Volk), late 20s, ex-Meridian engineer who was fired
  and blacklisted for reporting a security flaw. Brilliant, warm, and slowly hardening
  into a zealot.
- **Offers:** contract board (hacking jobs), rare tools (custom rootkits, proxy chains,
  0-days), safehouse access (reduces Heat gain), and the only people who'll hide you
  after a raid.
- **Rep rises:** completing forum contracts, leaking corporate data publicly (not selling
  it), sheltering a burned member, refusing to cooperate with the Bureau, sharing your
  own exploits for free.
- **Rep falls:** selling data instead of leaking it, working a legit security job that
  "hardens the enemy," being seen with cops, taking Bureau money, doxxing a scene member.
- **Conflicts:** hates the Bureau (mutual) and Meridian (mutual); distrusts the Guild
  ("bootlickers with badges"); an uneasy, transactional relationship with the Carders
  (money vs. principle).

### 3.2 The Sysadmin Guild (legit professional community)

- **Ethos / goal:** craft, responsibility, keeping the lights on. They believe in
  disclosure *through channels*, mentorship, and building a real IT profession in a city
  that treats them like janitors.
- **Leader:** **Professor Idris Bello**, 50s, burned-out Poly professor and Guild elder,
  once a phreaker himself, now the conscience of the legit path.
- **Offers:** legit job referrals (career ladder shortcuts), certification course
  discounts, code review that boosts freelance success, character references that lower
  Heat during investigations, and eventually a seat at the table where the surveillance
  law is debated.
- **Rep rises:** legit employment and promotions, responsible disclosure of bugs,
  mentoring a junior NPC, refusing destructive contracts, testifying / speaking publicly
  for sane policy.
- **Rep falls:** getting arrested, defacements and public damage, selling out a client,
  ghosting a job, being outed as Undertow.
- **Conflicts:** philosophical enemy of the Undertow (they respect each other's skill,
  despise each other's methods); the Guild is the Bureau's reluctant ally and Meridian's
  reluctant critic.

### 3.3 The Ridgeline Bureau (federal law enforcement / intelligence)

- **Ethos / goal:** control the emerging cyber-threat landscape; recruit talent by
  flipping it; and — the darker read — build the surveillance apparatus the Enclosure
  requires, using crises as leverage.
- **Leader:** **Special Agent Marcus Thorne** (handle-in-files: `RB-THORNE`), 40s,
  patient, genuinely believes he's the adult in the room. Not a cartoon villain; the
  scariest thing about him is how reasonable he sounds.
- **Offers:** charges dropped / Heat wiped, a stipend (steady income), immunity to raids,
  access to state-level tools and targets, and information about other factions. In
  return: informing, and eventually operations against your own people.
- **Rep rises:** cooperating after arrest, informing on the Undertow or Carders,
  completing "sanctioned" operations, supporting the surveillance law.
- **Rep falls:** burning an operation, warning a target, going public with what you know,
  refusing an op, feeding them false information (risky — they may catch it).
- **Conflicts:** the Undertow's mortal enemy; uses the Guild as cover and consultants;
  a symbiotic backroom relationship with Meridian (data access for legal air-cover).

### 3.4 The Ledger (organized cyber-crime / carders)

- **Ethos / goal:** money, discretion, and the long game. Not ideologues — professionals.
  They fence data, run card fraud, launder through shell companies, and would very much
  like the player's talent on retainer.
- **Leader:** **`brass`** (identity unknown for most of the game; revealed as **Delphine
  Osei**, a respectable-seeming Kessler Heights "consultant"), speaks only through
  intermediaries early on.
- **Offers:** the highest-paying contracts in the game, money-laundering (turns "dirty"
  money usable, lowers Heat from cash), fake identities (huge Heat/relocation tool),
  bail money, and muscle. But their jobs escalate: what starts as "clone a database" ends
  as "we need someone at Saint Bartholomew's to disappear from the transplant list."
- **Rep rises:** completing paid jobs cleanly, laundering through them, keeping your mouth
  shut, bringing them a score.
- **Rep falls:** leaking instead of selling (that's *their* inventory you're giving away),
  cooperating with the Bureau, botching a job loudly, skimming.
- **Conflicts:** the Bureau wants them destroyed; the Undertow uses them but is disgusted
  by them; they *love* the Enclosure — surveillance capitalism is just their business model
  with a logo.

### 3.5 Meridian Telecom (corporate incumbent / the Enclosure engine)

- **Ethos / goal:** own the pipes, then own what flows through them. Lobby the surveillance
  law into existence, buy the café chains and startups, and turn the open net into a metered,
  monitored utility. The closest thing to a systemic antagonist — but joinable.
- **Leader:** **Vaughn Halloran**, heir to the steel dynasty, now Meridian's board chair —
  the man who decided the family's future was data, not steel. Smooth, generational-wealth
  charm, treats the whole city as an inheritance he's optimizing.
- **Offers:** the most prestigious legit career capstone (Meridian is the endgame
  corporate ladder), enormous salary, stock options that make you rich in an ending,
  political protection (Heat immunity via lawyers), and the power to *set world variables*
  — you can be the one who writes the surveillance policy.
- **Rep rises:** the legit corporate ladder, delivering competitors' secrets, supporting
  the law, helping acquisitions go through.
- **Rep falls:** whistleblowing, sabotaging acquisitions, siding with unions/community,
  leaking their data (they will find you).
- **Conflicts:** despised by the Undertow and community NPCs; the Guild is torn (Meridian
  is the biggest legit employer AND the enemy of everything the Guild values); the Bureau
  is a partner; the Ledger is a discreet vendor.

**Faction geometry (quick reference):**
- Undertow ⟷ Bureau: war.
- Undertow ⟷ Meridian: war.
- Guild ⟷ Undertow: rivalry with mutual respect.
- Guild ⟷ Meridian: employment vs. conscience (the Guild's central tragedy).
- Bureau ⟷ Meridian: backroom alliance.
- Ledger ⟷ everyone: transactional; loved by Meridian's logic, hunted by the Bureau.

You cannot max all five. The game is *about* which two or three you choose, and who you
burn to get there.

---

## 4. Cast (16 NPCs)

Each has: **handle · name · role · voice sample · arc · fates.** "Fates" are outcome
states set by flags at endgame; the epilogue reads them.

---

**1. `pixelkid` · Danny Okafor · your best friend, the ride-or-die**
- *Voice:* "Dude. DUDE. It downloaded 40% overnight. Forty. We are so back."
- *Arc:* Danny is the reason you started. Endless enthusiasm, mediocre skill, huge heart.
  Wants you both to "go legit and make a real company someday." As you rise (either track),
  Danny either grows with you or gets left behind and resentful.
- *Fates:* **Partner-in-a-real-startup** (you both went legit, high Guild/Meridian) ·
  **Casualty of your world** (you pulled him into a job that went wrong → jail or worse) ·
  **Estranged** (you chose the Undertow/Ledger; he couldn't follow) · **Quiet neighbor**
  (you drifted; he's fine; you're not close; it aches).

**2. `spectra` · Nadia Volk · Undertow leader** *(see Factions)*
- *Voice:* "They fired me for telling the truth about their network. So now I tell
  everyone everything. That's not revenge. That's *maintenance*."
- *Arc:* From principled whistleblower to something harder as the Enclosure wins ground.
  If the player keeps her grounded, she becomes a genuine reform leader; if abandoned or
  betrayed, she goes fully underground / militant.
- *Fates:* **Martyr** (arrested/killed in a raid you could've prevented) · **Reformer**
  (survives, testifies, becomes public conscience) · **Ghost** (vanishes, occasional
  encrypted message) · **Sellout** (you turn her, Bureau route — she never forgives you,
  the scene never forgets).

**3. `RB-THORNE` · Marcus Thorne · Ridgeline Bureau handler** *(see Factions)*
- *Voice:* "I'm not the bad guy in your story. I'm the guy who decides whether your story
  has more chapters. Sit down."
- *Arc:* Reasonable → revealed as architect of the flip program and quiet backer of the
  law. Can be exposed, obeyed, or played.
- *Fates:* **Promoted** (you served him well) · **Disgraced** (you exposed him) · **Your
  puppet** (you doubled him — rare, high-Opsec/Social path) · **The one who buried you**
  (bad endings).

**4. `yo` · Yolanda Prakash · café owner, den mother**
- *Voice:* "You break my machines, you fix my machines, and you still owe me for the
  Mountain Dew. Sit. Eat something that isn't beige."
- *Arc:* The Net Nook is the game's hearth. Meridian's café-chain acquisition threatens
  her. Player can save, sell, or lose the café — it becomes a barometer of Ashmill's soul.
- *Fates:* **Still open** (community wins) · **Bought out, comfortable** (she took the
  money, half-relieved, half-hollow) · **Bankrupt/gone** (you or the world failed her).

**5. `halcyon` · Priya Halloran · Vaughn's estranged daughter, idealist coder**
- *Voice:* "My father thinks the city is a spreadsheet. I'm the line item he can't
  balance."
- *Arc:* A romanceable ally who bridges worlds — Halloran blood, Undertow sympathies.
  Can become the player's inside line to Meridian, a love interest, a whistleblower, or
  a casualty of choosing her father's side.
- *Fates:* **Partner & co-conspirator** · **Estranged from you** · **Broken (chose her
  father, hates herself)** · **Dead (Ledger/late-game tragedy)** · **The new Meridian**
  (she inherits and reforms it — a bittersweet best-case).

**6. `brass` · Delphine Osei · The Ledger, hidden boss** *(see Factions)*
- *Voice:* "Principles are a subscription, sweetheart. Most people can't afford the
  monthly fee. I can. That's the only difference between us."
- *Arc:* An unseen hand, then a face, then either your patron, your executioner, or your
  mark.
- *Fates:* **Empire intact** · **Dethroned by you** · **Your silent partner** (Ledger
  ending) · **Fled the city**.

**7. `gasket` · Tomás Rivera · CompuFix coworker, then Guild ally**
- *Voice:* "Rule one of tech support: the customer lied. Rule two: it's always the cable.
  Rule three: never let them watch you Google it."
- *Arc:* Cynical, funny, secretly the most decent person you'll meet. Your first legit
  mentor. Gets sick in Act III (uninsured — a *system* the player can spend money/plot on).
- *Fates:* **Healthy, running his own shop** · **Bankrupted by medical debt** · **Dead
  (you didn't/couldn't help)** · **Whistleblower alongside you**.

**8. `dialtone` · Margaret "Marge" Osgood · retired Meridian phone-exchange operator**
- *Voice:* "I patched calls in this city for thirty years, love. I know every wire in the
  Flats. Ask me nicely and I'll tell you which ones they forgot to disconnect."
- *Arc:* Nostalgia incarnate and a secret weapon — she knows the physical telephone
  infrastructure, enabling old-school phreaking and a route into Meridian's copper.
- *Fates:* **Honored elder of the scene** · **Evicted (redevelopment)** · **Passed away,
  leaves you the exchange keys** (a tearjerker item handoff).

**9. `crashcart` · Dr. Lena Voss · ER doctor, romance/ally, ethical foil**
- *Voice:* "You keep bringing me your friends with 'accidents.' One day it'll be you on
  the table. I'd like there to be someone worth saving."
- *Arc:* The person who makes the human cost literal. Romanceable. Her hospital is a late
  Ledger target. She's the moral tripwire of Act IV.
- *Fates:* **Partner (your anchor)** · **Left you (couldn't watch you sink)** · **Complicit
  (you dragged her into the hospital job)** · **Whistleblower who saves the ward**.

**10. `scriptr` · Kevin Mao · teenage script-kiddie you mentor (or corrupt)**
- *Voice:* "i got the tool off the forum it says its undetectable so its fine right. right??"
- *Arc:* A mirror of who you were. You can mentor him toward the Guild, weaponize him for
  the Undertow/Ledger, or ignore him. His fate is the game's verdict on your influence.
- *Fates:* **Your protégé, gone legit** · **Arrested young (on you)** · **Surpasses you
  (rival)** · **Dead in a raid** · **Turned informant (the Bureau got to him)**.

**11. `sable` · Detective Ruth Cardenas · Metro PD Cyber Unit ("the Cage")**
- *Voice:* "I've got a budget of nothing and a modem from 1997, and I'm still going to
  ruin somebody's year. Might as well be somebody who deserves it."
- *Arc:* Local cop, underdog, not the Bureau. Can become an unlikely ally against both
  the Ledger and the Bureau's overreach — or the one who catches you.
- *Fates:* **Ally against the Enclosure** · **Promoted into the Cage's expansion** · **Forced
  out** · **The one who cuffs you**.

**12. `mom` · Irene, your mother · family, the heart of the life-sim**
- *Voice:* "I don't understand what you do at that computer all night. I just want you to
  understand that I'm scared, and I'm proud, and I can't tell which one wins."
- *Arc:* Works two jobs. Disapproves of hacking she half-understands. A health crisis
  (Act II/III) forces a money/morality choice that defines the player's whole run.
- *Fates:* **Healthy, proud, moved to a better place by you** · **Recovered but you took a
  dark job to pay for it** · **Passed (couldn't afford care / too late)** · **Estranged
  (she found out what you are)**.

**13. `dad` · Walt, your father · absent-ish, laid-off steelworker**
- *Voice:* "Steel built this city and then it didn't need us anymore. Whatever you're
  doing with those computers — just don't let it be the kind of thing that stops needing
  people."
- *Arc:* Laid off by the Halloran pivot (personal ties Meridian to your family). Bitter,
  proud, slowly reconciling. Optional arc: he takes a job at Meridian's warehouse and you
  must decide whether to sabotage the company that employs your own father.
- *Fates:* **Reconciled** · **Re-employed (Meridian, complicated)** · **Passed** · **Leaves
  town**.

**14. `mirror` · unknown → revealed · rival hacker, your shadow**
- *Voice:* "We took the same first job, you and me. I just didn't stop to make friends."
- *Arc:* An anonymous rival matching the player beat-for-beat on the opposite methodology.
  If the player is Undertow-idealist, `mirror` is a nihilist Ledger asset; if the player
  goes legit, `mirror` is the intruder haunting your networks. Revealed in Act III to be
  someone from Act I (dynamically: whichever early NPC the player neglected). A systemic,
  personalized nemesis.
- *Fates:* **Defeated** · **Redeemed (you pulled them back)** · **Victorious (a bad
  ending's author)** · **Uneasy truce**.

**15. `wren` · Sofia Antar · investigative journalist**
- *Voice:* "Off the record? Nothing's off the record anymore. That's the story. That's
  always the story now."
- *Arc:* Wants the truth about Meridian, the Bureau, and the law. The player's leaks feed
  her — or she becomes a threat to expose the player. The main conduit for the world-reaction
  news system.
- *Fates:* **Pulitzer-grade exposé (your leaks land)** · **Silenced (bought, threatened,
  or worse)** · **Turns on you** · **Partners with you to break the final story**.

**16. `null` · "The Custodian" · late-game hidden entity**
- *Voice:* "You've been reading the city's mail for years. Did you never wonder who reads
  yours?"
- *Arc:* An Act IV revelation: someone has been *above* the whole game — a deep-state
  data-broker (could be revealed as `brass`, Thorne's superior, or an AI-adjacent
  early-surveillance program, depending on flags). The "who's really in control" reveal
  that recontextualizes the Enclosure.
- *Fates:* **Exposed** · **Inherited by you (you become the Custodian — the darkest
  ending)** · **Untouchable (you never even find out — a quiet, unsettling non-ending)**.

---

## 5. Act-by-Act Main Plot

Notation: `flag.X` = story flag; `rep.<faction> +/-N` = reputation change; `world.X` =
world variable; **DC** = skill-check difficulty (d20 + skill/4 + situational).

Acts are **progression-gated, not date-gated** — the calendar advances, but an act only
opens when the player meets thresholds, so idle players and rushers both flow naturally.
Between beats, the contract board, side quests, and life events keep the idle loop full.

---

### ACT I — "Handshake" (age 18, ~Sept 2001 → ~mid 2002)

**Gate to start:** none (opening).
**Gate to advance to Act II:** any TWO of — a skill ≥ 25 · first job held ≥ level 2 ·
`rep.undertow ≥ 15` OR `rep.guild ≥ 15` · `flag.first_contract_done` · $2,000 saved.
(Multiple roads out — the whole point.)

**Opening scene (DIALOG window):** Your modem connects for the first time to *The
Undertow*, a BBS Danny found. The screech, the ANSI-art logo, a welcome from `spectra`.
Meanwhile your mother calls up the stairs to get off the phone line. Immediately the two
worlds — home and net — are set in tension. First choice:

> **CHOICE — "First words on the forum"**
> - **A. Lurk and read.** (`flag.cautious`, +Opsec framing, Undertow neutral)
> - **B. Introduce yourself honestly.** (`rep.undertow +5`, `flag.known_newbie`)
> - **C. Post something you don't understand to look cool.** (comedic; `rep.undertow -5`,
>   Danny laughs at you, unlocks a running gag; +Social later for owning it)

**Beat 1 — The First Job.** `yo` at the Net Nook offers you cash to de-virus the café PCs.
Tutorializes the schedule/idle loop. Meet `gasket` who tips you toward CompuFix.

**Beat 2 — Two doors.** Parallel intro to both tracks:
- *Legit:* CompuFix interview (Business/Social check, **DC 12** to negotiate above minimum
  wage). Meet Tomás. Career ladder begins.
- *Underground:* `spectra` posts your first contract — crack the copy protection on a game
  everyone wants. **Programming DC 14.** Success: `rep.undertow +10`, first Heat (+3).
  Failure branch: you brick it, a forum elder mocks you, but `pixelkid` covers for you —
  bonding.

**Beat 3 — Grandma's PC (the tonal thesis).** A neighborhood side-quest that's pure warm
comedy: fix an old woman's computer, discover it's riddled with "you've won a prize"
malware. Later this same malware strain turns out to be an early Ardent Systems / Meridian
data-harvester — the first thread of the conspiracy, hidden inside a joke. (`flag.saw_the_harvester`
— matters in Act III.)

> **CHOICE POINT — "The Café Chain Offer" (Act I climax)**
> A café chain (Meridian-backed, though you don't know it yet) offers `yo` a buyout. She
> asks your advice and, secretly, whether you'd help her "make the numbers look bad" to
> scare them off (light fraud) OR help her modernize to compete legitimately.
> - **A. Help her fake bad numbers.** Undertow-flavored. `rep.undertow +10`, `rep.guild -5`,
>   Heat +8, `flag.cafe_fraud`. Café survives *dishonestly* (bites back in Act III audit).
> - **B. Help her modernize (legit).** Guild-flavored. Requires Business ≥ 20 or $1,500
>   loaned. `rep.guild +10`, café survives honestly, `flag.cafe_legit`.
> - **C. Tell her to take the money.** `yo.fate = bought_out`. Ashmill loses its hearth
>   early. `rep.undertow -10`. But you get a cut as "advisor" ($$$) and `flag.pragmatist`.
> - **D. [Locked — Social DC 18, greyed teaser] "Broker a better deal."** If unlocked,
>   café stays independent AND you make money AND `wren` (journalist) notices you — opens
>   an Act II thread.

**Terminal-mission moment (optional):** Beat 2's contract can be done via the Terminal
minigame (scan the game's license server, patch the check) OR auto-resolved by the
Programming check. Teaches the minigame with zero stakes.

**Life-sim in Act I:** parents' curfew and phone-line conflict (schedule friction);
first crush (Danny sets you up, or you meet `halcyon` at a LAN party, or `crashcart` when
someone gets hurt at said LAN party); the choice to enroll at the Poly (entrance exam
mini-arc — Programming/Business check) or skip college for the streets.

---

### ACT II — "Escalation" (age ~19–22, ~2002 → ~2005)

**Gate to start:** completed Act I gate.
**Gate to advance to Act III:** `flag.first_raid_scare` (triggered by Heat ≥ 40 once) AND
one faction at "Trusted" tier (rep ≥ 50) AND `flag.moms_crisis_resolved` (the health
event, resolved any way) AND career OR reputation milestone (job ≥ dev/level-3, or a
completed faction arc step 2).

This is where money, consequences, and the first funeral arrive. The dotcom recovery
starts; salaries rise (`world.salary_index` climbs); broadband spreads (`world.broadband`
+1 → cheaper, faster hacking but also easier tracing).

**Beat 1 — The Money Job.** The Ledger reaches out (through `brass`'s intermediary). A
genuinely lucrative contract: clone HSDS's customer database. Introduces high-pay/high-Heat
economics and money-laundering.

> **CHOICE — "What you do with the HSDS data"**
> - **A. Sell to the Ledger.** Big money. `rep.ledger +15`, `rep.undertow -10` (you
>   commodified data). `flag.sold_hsds`.
> - **B. Leak it publicly via the Undertow.** No money, huge cred. `rep.undertow +20`,
>   `rep.ledger -15`, Heat +15, HSDS stock craters (`world.hsds_collapse`), thousands of
>   Vireburgers' data exposed (a *cost* — `wren` writes about the victims). `flag.leaked_hsds`.
> - **C. Extort HSDS quietly.** Social/Business DC 16. Money + `flag.blackmailer` (Bureau
>   takes note early). Neither faction loves it.
> - **D. Report the vulnerability to HSDS (responsible disclosure).** Guild path. Small
>   consulting fee, `rep.guild +20`, they hire you (career shortcut). `flag.disclosed_hsds`.
>   The Ledger marks you as unreliable (`rep.ledger -10`).

**Beat 2 — Mom's Crisis (the life-sim fulcrum).** Irene collapses; it's serious; the good
care at Saint Bartholomew's costs money you may not have. This is the game's moral engine:
- Pay legitimately (drains savings, maybe forces you to stay in a job you hate → career-lock
  but `mom.fate = healthy`, `flag.stayed_clean`).
- Take a fast Ledger job to cover it (`mom.fate = recovered_dark`, `rep.ledger +10`, Heat
  spike, `flag.crossed_line_for_family` — the game's most-referenced flag).
- Crack the hospital's billing system to erase the debt (Intrusion **DC 17**; success =
  free care + `flag.hacked_hospital` which the Ledger *remembers* and exploits in Act IV;
  failure = Heat +20 and a near-miss with `sable`).
- Let the Guild/community rally (if `rep.guild` high, a fundraiser — `flag.community_saved_mom`,
  a genuinely warm beat that pays off in the "hometown hero" ending).

**Beat 3 — The First Raid Scare.** If Heat crossed 40, `sable`'s Cage OR the Bureau kicks
your door (or Danny's, or `scriptr`'s — whoever you exposed most). A tense DIALOG:

> **CHOICE — "The Raid"**
> - Hide/wipe in time (Opsec **DC 18**, or `flag.safehouse` from Undertow) → escape,
>   `rep.undertow +10`.
> - Get caught → **the Bureau flip offer arrives** (Thorne, first appearance in person).
>   Accept: `rep.bureau +20`, charges gone, `flag.asset` — you are now an informant.
>   Refuse: jail days (idle time-skip, skill decay, `rep.undertow +15`, `flag.did_time`,
>   `mirror` arc seeds).
> - Take the fall for a friend (`pixelkid`/`scriptr`) → they go free, you do time,
>   massive affinity, `flag.took_the_fall` (unlocks loyalty endings).

**Beat 4 — `gasket` gets sick.** Uninsured Tomás needs help. A quieter echo of Mom's
crisis, this time a *friend* — tests whether the player extends their new power outward or
hoards it. Sets `gasket.fate`.

**Beat 5 — `halcyon` opens the door.** Priya Halloran approaches (romance and/or alliance).
Reveals she suspects her father's Meridian is building something dangerous with harvested
consumer data (the Beat-3 malware from Act I). Hands the player the Act III main thread.

**Terminal-mission moments:** the hospital billing hack; a Meridian copper-tap with
`dialtone`'s help (phreak the old exchange to intercept a data line — the "old net
vs. new net" set-piece). Always a skill-check fallback.

**World reactions this act:** HSDS collapse or survival; the first "cybercrime" headlines;
salary index rising; the surveillance law is *introduced* to the city council (dormant —
becomes Act III's spine).

---

### ACT III — "Enclosure" (age ~22–26, ~2005 → ~2009)

**Gate to start:** Act II gate.
**Gate to advance to Act IV:** `flag.law_resolved` (the surveillance vote happens — the
act's climax) AND two of your faction reps at opposite poles (the game verifies you've
*committed* — you can't fence-sit into the finale) AND `flag.mirror_revealed`.

The tone goes cold. Broadband is everywhere (`world.broadband ≥ 2`), forums are
professionalizing, and Meridian + the Bureau push the **Vireburg Information Security Act
(VISA)** — a surveillance law that, if passed, permanently raises `world.heat_gain_mult`
(all hacking gets riskier), legalizes bulk data collection, and hands Meridian/Bureau the
city's traffic.

**Beat 1 — The Custodian's shadow.** The Act I harvester + HSDS data + Meridian's product
all connect: someone has been quietly building a dossier on *the whole city* for years.
`wren` and `halcyon` both pull threads. The player realizes the game they've been playing
is smaller than the game being played on them.

**Beat 2 — Choose your instrument.** The player must pick *how* to fight (or feed) the
Enclosure. This is a hub with four escalating operations, and the player commits to a
primary lane (each is a mini-arc; can do more than one at rep cost):

- **Expose (Undertow/journalist):** feed `wren` an airtight story. Requires evidence
  gathered via contracts/terminal missions. `world.public_opinion` shifts against VISA.
- **Sabotage (Undertow/Ledger):** technically wreck Meridian's data center or the vote
  infrastructure. High Heat, `world.meridian_stock` hit, but "the ends justify" tension.
- **Legislate (Guild):** work the *legitimate* channels — testify, lobby, get the Guild
  and `sable` onside. Slower, requires Business/Social, but durable and low-Heat.
- **Profit (Ledger/Meridian):** help the law *pass* and cash in. Betray the city for a
  seat at the table. `rep.meridian +++`, sets up the plutocrat endings.

**Beat 3 — `mirror` revealed.** Your shadow-rival is unmasked — dynamically, it's the Act I
NPC you neglected most (e.g. if you abandoned `scriptr`, he's `mirror`, radicalized; if you
spurned `halcyon`, she is; if you burned Danny, it's him). A deeply personal confrontation.

> **CHOICE POINT — "Confronting `mirror`"**
> - **Defeat them** (skill-off; Terminal duel or auto-resolve) → `mirror.fate = defeated`,
>   but you become what you beat (`flag.pyrrhic`).
> - **Turn them** (Social **DC 20** + relevant history flags) → `mirror.fate = redeemed`,
>   powerful ally for the finale, one of the most satisfying paths.
> - **Join them** → abandon your prior faction lane; `flag.crossed_over` — a dark pivot.
> - **Let them win one** (sacrifice a goal to save a life) → `flag.mercy`, changes an
>   ending.

**Beat 4 — The betrayal beat.** Someone you trusted flips. *Who* depends on rep:
- Low Undertow → `spectra` cuts you off (or is arrested because of your carelessness).
- High Bureau → Thorne asks you to burn a *specific friend* (Danny, `spectra`, `scriptr`).
  The `flag.asset` payoff — the game's hardest single choice.
- High Ledger → `brass` asks for the hospital job (calling in `flag.hacked_hospital` /
  `crashcart`'s ward). Money vs. lives, explicitly.

**Beat 5 — The Vote (Act III climax, DIALOG + world resolution).** VISA goes to the city
council. The outcome is computed from `world.public_opinion`, which faction you empowered,
`wren`'s story landing, `sable`'s testimony, `halcyon`'s inside sabotage, and Meridian's
lobbying muscle. Outcomes:
- **VISA fails** → `world.surveillance = false`, Heat-gain normal, open net survives (for
  now), Meridian wounded (`world.meridian_stock` down), Bureau furious.
- **VISA passes** → `world.surveillance = true`, `world.heat_gain_mult = 1.5`, bulk
  collection legal, `null`/Custodian empowered, the city gets colder. Sets up dystopian
  endings.
- **VISA passes *gutted*** (a compromise the Guild/legit path can engineer) → partial
  surveillance, a bittersweet middle where you saved *something*.

**Life-sim in Act III:** you're likely living alone now (Terrace/Kessler depending on
track); romance either deepens toward partnership (move in together — shared finances,
shared risk) or fractures under your Heat/absences; a possible pregnancy/marriage decision
with `halcyon` or `crashcart` that changes what you're willing to risk; `dad`'s Meridian
warehouse job forces the "sabotage your father's employer" dilemma; `dialtone` may pass
away, willing you the exchange keys.

---

### ACT IV — "Ghost" (age ~26–30, ~2009 → ~2013)

**Gate to start:** Act III gate (VISA resolved, committed reps, `mirror` resolved).
**Gate to endings:** the finale operation completes; endings selected by the flag/rep matrix
in §8.

Bleak, quiet, consequential. The city you made is the city you live in now. Broadband is
fiber (`world.broadband = 3`); the amateur net is basically gone; "social" platforms and
the first data-breach panics define the culture.

**Beat 1 — The Custodian revealed (`null`).** The final antagonist steps forward. Depending
on flags, `null` is: the Bureau's true controller above Thorne; `brass`/the Ledger having
quietly won; or an early automated surveillance system (VISA's child) that now runs
semi-autonomously. `null` makes the player an offer: **inherit the whole apparatus.**

**Beat 2 — The last job.** A single culminating operation whose *shape* is set by your
committed lane, but whose *target* is always the Custodian's data core (physically, the
old Flats exchange Meridian repurposed — bringing `dialtone`'s keys and the whole "old
net" motif full circle). Big Terminal set-piece with a trace timer, plus a full skill-check
fallback for players who never touched the minigame.

> **CHOICE POINT — "At the Core" (the game's final fork)**
> - **Destroy it.** Wipe the city's mass dossier. Freedom, but also chaos: banks, hospitals,
>   the Bureau all lose data; real people are hurt in the blast radius. `flag.scorched_earth`.
> - **Expose it.** Hand everything to `wren` (if alive/loyal). The truth comes out; slow,
>   institutional reckoning; the least bloody, hardest-to-reach "good" path (needs high
>   journalist + Guild history).
> - **Take it.** Become the new Custodian. Ultimate power, ultimate corruption.
>   `flag.became_custodian` — the darkest ending, and the one the systemic build rewards a
>   pure-Ledger/Meridian/Bureau optimizer with (the game lets you "win" into a monster).
> - **Trade it.** Hand it to a faction for a price (safety, wealth, a loved one's freedom).
>   Pragmatic, grey, sets faction-ascendancy endings.
> - **Walk away.** Requires `flag.mercy` / high-life-sim investment: you choose the people
>   over the mission. `flag.chose_life`. Leads to the quiet-domestic endings.

**Beat 3 — Consequences cascade.** Rapid-fire resolution scenes for each surviving NPC,
each honest to accumulated flags: Danny, `spectra`, `halcyon`/`crashcart`, `gasket`,
`scriptr`, your parents, `wren`, `sable`, Thorne, `brass`. Then the epilogue (§8).

**Life-sim in Act IV:** you may have a family now; a child changes the meaning of every
risk; aging is visible (skill caps, energy floors); the choice between a stable legit life
you built and one last dangerous truth. The idle systems don't stop — even at the end,
there's rent.

---

## 6. Faction Arcs

Each faction has a self-contained quest chain that runs *alongside* the main plot, gated by
rep tiers, with branch points. Completing one deeply usually forecloses another.

### 6.1 The Undertow — "Signal / Noise"
1. **Initiation** — First forum contract; `spectra` vouches for you. (Act I)
2. **The Blacklist** — Learn *why* she was fired; recover her Meridian evidence from a
   dead-drop server. Branch: keep it as leverage (Ledger-ish) or arm her with it (pure).
3. **The Safehouse** — Establish/defend the Flats safehouse. Choice: fortify it (community)
   or use it as a honeypot if you're secretly Bureau (betrayal seed).
4. **The Leak of Leaks** — Coordinate a mass disclosure against Meridian. Branch: full dump
   (max chaos, `world.hsds`-style collapse) vs. surgical (targets execs, spares civilians —
   requires Opsec/Social, keeps `spectra` from radicalizing).
5. **Schism** — If you've also courted Guild/Bureau, the scene splits. Reconcile them
   (Social **DC 22**) or pick a side; `spectra.fate` set here.
6. **The Last Broadcast** — Feeds directly into Act IV's "Expose" finale.

### 6.2 The Sysadmin Guild — "Uptime"
1. **The Reference** — Bello mentors you; first legit referral. (Act I/II)
2. **Responsible Disclosure** — Find a bug in Ardent's firewall; report it *properly*.
   Branch: they thank you (Guild +) vs. they bury it and you must decide whether to go
   public (Undertow pull).
3. **The Certification** — Complete a paid course arc (life-sim: time + money + a hard
   exam skill-check). Unlocks senior career tiers.
4. **The Mentor's Confession** — Bello reveals his phreaker past and his guilt; a personal
   quest to protect an old friend (could be `dialtone`).
5. **Testimony** — Prepare the Guild's case against VISA for the Act III vote. Branch:
   principled full-throat opposition vs. a pragmatic "gut the bill" compromise.
6. **The Seat at the Table** — Leads to legit-reformer endings.

### 6.3 The Ridgeline Bureau — "Asset"
1. **The Flip** — Triggered by getting caught (or volunteering). Thorne's offer. (Act II)
2. **Small Fish** — Inform on a minor scene member (`scriptr`?). Branch: real intel vs.
   feed false intel (Opsec **DC 20**; if caught, Thorne escalates the leash).
3. **The Wire** — Plant surveillance in the Undertow safehouse. The point of no return with
   the scene.
4. **Burn Notice** — Thorne orders you to sacrifice a specific friend. Comply, refuse (and
   flee), or **double Thorne** (turn the Bureau's own op — highest-skill path, `flag.doubled_bureau`).
5. **The Handler's Secret** — Discover Thorne answers to `null`. Branch: loyal ascension vs.
   expose your own handler.
6. **Sanctioned** — Leads to enforcer/asset endings, or (if you doubled him) to the
   "brought down the Bureau" ending.

### 6.4 The Ledger — "The Fee"
1. **The Intermediary** — First paid job, cash and laundering intro. (Act II)
2. **Clean Money** — Set up a shell company (Business skill; life-sim: a fake job that
   explains your income to family/Bureau).
3. **The Fence** — Choose a specialty: data brokerage, card fraud, or corporate espionage
   (each tunes which contracts appear and which NPCs you meet).
4. **Meeting `brass`** — Delphine reveals herself; a test of loyalty (skim and she knows;
   loyalty unlocks the empire).
5. **The Hospital Job** — The moral event horizon: `crashcart`'s ward. Do it, refuse (she
   marks you), or *fake* it (protect the patients, fool `brass` — Opsec/Social **DC 23**,
   the hardest legit-conscience-inside-crime path).
6. **Succession** — Leads to crime-lord endings, or to dethroning `brass`.

### 6.5 Meridian Telecom — "Vertical Integration"
1. **The Internship** — Enter the corporate ladder (needs degree or Guild rep). (Act II)
2. **Optimization** — Your first ethically grey corporate task (help "right-size" HSDS
   after its collapse — you may be firing your own father's friends).
3. **The Acquisition** — Help Meridian buy the café chain / an Undertow-adjacent startup.
   Betray your roots for the promotion.
4. **The Halloran Question** — Vaughn tests your loyalty against `halcyon`; choose father or
   daughter.
5. **Writing the Law** — You personally draft provisions of VISA. `world` variables literally
   set by your choices here.
6. **The Board** — Leads to plutocrat/CEO endings (and, if you also hold the Custodian data,
   the "own the city" ultra-dark ending).

---

## 7. Side Quests (28)

Short, self-contained, each with a twist or choice. Categorized. All condition-triggered,
all leave a flag.

**Family**
1. **"Get Off The Phone"** — Recurring early gag: Mom needs the line; you're mid-download.
   Choose to lose the download (affinity +) or lock the line (affinity −, but finish the
   job). Twist: one time the "download" is actually Mom's online job application — losing
   it matters.
2. **"Dad's Résumé"** — Walt asks you to make him a résumé for a Meridian warehouse job. Do
   it well and he gets hired — by the company you may be fighting. Choice to sabotage or
   support.
3. **"Aunt Rosa's Chain Email"** — A relative forwards a scam; debunk it gently or ride the
   family-tech-support fame. Twist: the "scam" is a real early phishing kit you can reverse
   for a lead.
4. **"The Inheritance Drive"** — A late-game hard drive from a deceased relative holds a
   family secret (Dad's old union-organizing files — recontextualizes the steel layoffs).

**Friends**
5. **"Danny's Big Idea"** — He wants to start a company selling burned game CDs. Talk him
   down (legal safety) or bankroll it (fun, risky, `flag.danny_business`).
6. **"scriptr's First Hack"** — Kevin's about to do something dumb. Mentor, stop, or
   weaponize him. Sets his fate early.
7. **"LAN Party Meltdown"** — Comedy: someone's rig catches fire mid-tournament; you MacGyver
   a fix (Hardware check) — and meet `crashcart` when the smoke gets someone.
8. **"gasket's Side Gig"** — Help Tomás moonlight fixing PCs off-CompuFix's-books; get
   caught by the franchise or cover cleanly.

**Romance**
9. **"First Date, No Signal"** — With `halcyon` or `crashcart`: a date keeps getting
   interrupted by pages/contracts. Choose presence over work (affinity) or blow it off.
10. **"Meet the Parents"** — Bring a partner to the Ashmill flat; Mom interrogates; a
    Social gauntlet with real affinity stakes.
11. **"The Confession"** — Tell your partner what you really do. Honesty (risk) vs. lie
    (they may find out anyway). Gates the "partner as accomplice vs. betrayed" fork.
12. **"Long Distance"** — If a partner leaves Vireburg for a job, maintain the relationship
    across dial-up latency (a literal minigame of scheduled calls) or let it fade.

**Freelance clients**
13. **"The Divorce Job"** — A client wants their spouse's email cracked. Refuse (ethics),
    do it (money + Heat), or investigate and find the spouse is the real victim (twist —
    flip the client).
14. **"The Small Business"** — Set up a bakery's first website. Wholesome. Twist: they can't
    pay, offer barter (free bread for a year — a recurring health/mood buff item).
15. **"The Politician's Laptop"** — A city councilman needs "data recovery." You find VISA
    drafts a year early — foreshadowing, and a leak opportunity.
16. **"Y2K Leftovers"** — A paranoid client still hasn't trusted computers since Y2K; a
    comedic contract that pays absurdly for trivial work.

**Neighborhood**
17. **"The Net Nook Tournament"** — Run a StarCraft-style tourney at Yo's café; community
    warmth + a rivalry with `scriptr`.
18. **"Tram Card Hack"** — The kids want free tram fares. Petty crime with heart; a gateway
    to Opsec basics and a `sable` near-miss.
19. **"The Landlord's Cameras"** — Your building's landlord installs sketchy cameras; disable
    them (privacy hero) or leave them (and later use the footage).
20. **"Block Party"** — Pure life-sim: throw an Ashmill block party (mood/affinity for the
    whole neighborhood; foreshadows which ending the city "deserves").

**Oddities / easter eggs**
21. **"The Haunted Server"** — A machine in the Flats keeps answering pings from an IP that
    doesn't exist. Investigate → a dead phreaker's automated dead-man's-switch (lore + a
    rare tool). `dialtone` connection.
22. **"ASCII Cathedral"** — Find a legendary hidden BBS board that's pure early-net art and
    poetry; a meditative, no-stakes reward for explorers.
23. **"The Numbers Station"** — Your modem catches a shortwave-style data broadcast; decode
    it (Crypto) for a Custodian breadcrumb, years early.
24. **"press START"** — An arcade-cabinet in the café hides a minigame that, if beaten,
    unlocks a cosmetic and a wink to the "obscure Russian sim" this game descends from.

**Dial-up nostalgia humor**
25. **"The Sound"** — A quest where you must record the *perfect* modem handshake for a
    friend's answering machine. Deeply stupid, deeply beloved. Mood buff.
26. **"You've Got Mail (Too Much)"** — Your inbox is 90% "make money fast" spam; a comedic
    inbox-cleaning arc that teaches spam-filtering AND hides one real, important message
    you might delete.

**Dark late-game**
27. **"The List"** — Under VISA, you're asked to help compile a "persons of interest" list.
    It includes people you know. Pad it, poison it, or comply. `flag.the_list` echoes hard
    in the epilogue.
28. **"Zero Day, Zero Sleep"** — A burnout arc: you can push through a 72-hour job for a
    huge payoff at the cost of a health event (possible hospitalization, `crashcart` scene).
    The game literally punishes the "no-sleep grind" the genre romanticizes.

---

## 8. Endings (8)

Endings are selected by a **flag/rep matrix** evaluated in Act IV, prioritized top-to-bottom
(first match wins; ties broken by dominant faction). Each has conditions + an epilogue sketch.

---

### E1 — "The Architect" (legit reformer — the hard-won bright ending)
**Conditions:** `flag.law_resolved = failed` OR `gutted`; `rep.guild ≥ 70`; finale = **Expose**;
`wren.fate = exposé`; `mirror.fate = redeemed`; high life-sim (partner + stable health).
**Epilogue:** Vireburg's open net survives, bruised but real. You lead a chartered
cybersecurity co-op out of the tech park; `halcyon`/`crashcart` your partner; Danny's your
COO if he survived; `spectra` becomes a public reformer; the Net Nook still hums. Thorne is
disgraced. The city on the news: *"Vireburg rejects surveillance overreach; becomes model
for digital rights."* You are tired, older, and you sleep fine.

### E2 — "Ghost in the Wire" (Undertow martyr-legend)
**Conditions:** `rep.undertow ≥ 80`; finale = **Destroy** or **Expose**; `flag.did_time`
or `flag.took_the_fall`; refused every Bureau overture.
**Epilogue:** You vanish. The dossier is ash. The Bureau never finds you. Years later,
`scriptr` (now legit) tells a kid at the Net Nook a story about a hacker who "burned the
whole thing down and walked into the fog." `spectra` keeps your handle alive. You send one
encrypted message a year to a partner who waits. Bittersweet, mythic, lonely.

### E3 — "The Custodian" (ultimate dark — the optimizer's trap)
**Conditions:** `flag.became_custodian`; dominant rep Bureau/Meridian/Ledger; `flag.the_list`;
low life-sim/high-power.
**Epilogue:** You took the core. You now read everyone's mail and no one reads yours. VISA
is total. Vireburg is safe, clean, and quietly dead. You're rich beyond sense in a Kessler
Heights tower. The final shot: your own child asks what you do all night, and you give them
the exact non-answer your mother once got. You have become the machine. The warmest thing
in the ending is how cold it is.

### E4 — "Vertical Integration" (Meridian plutocrat)
**Conditions:** `rep.meridian ≥ 80`; VISA passed; finale = **Take** or **Trade** (to Meridian);
`halcyon.fate = broken` or `new_meridian`.
**Epilogue:** You're on Meridian's board, maybe its CEO. If `halcyon` reformed the company
with you, there's a sliver of light (E4b bittersweet variant: Priya makes Meridian *slightly*
decent). Otherwise: you own the pipes and everything in them. Vaughn calls you "the best
investment I ever made." `wren` is "no longer with us professionally." Money can't fix the
quiet.

### E5 — "The Fee Comes Due" (Ledger crime-lord / or downfall)
**Conditions:** `rep.ledger ≥ 80`; finale = **Trade** (to Ledger) or **Take**; `flag.hospital_job`
resolved for the Ledger.
**Epilogue (two variants):** *Ascendant* — you dethroned or succeeded `brass`; you run
Vireburg's shadow economy from behind a legit consultancy; comfortable, hunted, alone.
*Downfall* — you skimmed or botched; `brass`'s people find you; a cold, abrupt final scene.
Either way, the money was real and so was the cost.

### E6 — "Uptime" (quiet legit life — the humble good ending)
**Conditions:** moderate `rep.guild`; finale = **Walk away**; `flag.chose_life`; strong
family/romance flags; low Heat; you never went truly dark.
**Epilogue:** You're a senior engineer at a decent firm. You married your partner, you have
a small house in Ferrow, you coach `scriptr`'s kid-brother's robotics team. You never
changed the world. You changed your street. Mom is healthy and proud. The last scene is a
Sunday dinner. It's enough, and the game *means* that it's enough.

### E7 — "Asset" (the Bureau's man — grey institutional ending)
**Conditions:** `rep.bureau ≥ 75`; `flag.asset`; `flag.burn_notice_complied`; VISA passed.
**Epilogue:** You're a full Bureau operative now, respectable, effective, and haunted. The
friend you burned (Danny/`spectra`/`scriptr`) is a name you don't say. Thorne is promoted;
you're his heir. You catch the next generation of you. The final line, from a young hacker
you're arresting: *"You were `spectra`'s friend once. What happened?"* You don't answer.

### E8 — "Fog Over the Vire" (the neutral / failure-adjacent quiet ending)
**Conditions:** no faction ≥ 60 (you never committed); finale = **Walk away** by default;
mid everything.
**Epilogue:** The Enclosure happened around you; you neither caused nor stopped it. You
still fix PCs. The Net Nook closed; you didn't fight for it. You're not unhappy — you're
just *there*, in a city that got a little colder while you kept your head down. `wren`'s
last article doesn't mention you, because there was nothing to mention. The most honest
ending, and the one the game gently suggests you could have avoided.

*(Optional secret E9 — "The Long Con": if `flag.doubled_bureau` + `flag.doubled` on two
other factions + Opsec maxed → you played everyone, kept the city free, AND got rich, AND
nobody knows it was you. The only "have it all" ending, brutally hard to reach, requiring
near-perfect Opsec across the whole game.)*

---

## 9. World-Reaction System

The world reacts through the **News feed**, **prices/salaries**, **job/contract availability**,
and **law/Heat variables**. News headlines are data objects: `{ id, trigger: <flag/world
condition>, text, mood, sets?: <world var> }`. Below, 22 example headlines tied to specific
player choices, plus the world variables they read/write.

### Example news headlines (trigger → headline)

1. `flag.leaked_hsds` → *"THOUSANDS EXPOSED: Halloran Steel Data Breach Dumps Customer
   Records Online. Class-action looms."* (mood: grim; sets `world.hsds_collapse=true`,
   `world.public_data_fear +20`)
2. `flag.disclosed_hsds` → *"Local Whitehat Quietly Saves Halloran From Disaster; Firm
   'Grateful.'"* (sets `rep.guild` visible, `world.hsds_collapse=false`)
3. `flag.cafe_legit` → *"Ashmill's Net Nook Goes Wireless; Beats Back Chain Buyout."*
4. `yo.fate = bought_out` → *"Another Corner Café Falls: QuikNet Chain Absorbs Beloved Net
   Nook."* (mood: melancholy; `world.ashmill_soul -10`)
5. `flag.first_raid_scare` (city-wide) → *"Metro PD Announces New 'Cyber Unit'; Budget
   'Modest,' Ambitions Large."* (introduces `sable`)
6. `flag.asset` (Bureau active) → *"Federal Cybercrime Task Force Opens Vireburg Field
   Office."* (sets `world.federal_presence=true`)
7. VISA introduced → *"Council Weighs 'Information Security Act'; Meridian Applauds, Critics
   Cry Surveillance."*
8. VISA **passed** → *"IT'S LAW: Vireburg Information Security Act Passes 6-3. Bulk Data
   Collection Now Legal."* (sets `world.surveillance=true`, `world.heat_gain_mult=1.5`,
   `world.public_opinion -15`)
9. VISA **failed** → *"CITIZENS WIN: Surveillance Act Voted Down After Explosive Leak."*
   (sets `world.surveillance=false`; if `wren.exposé`, credits "an anonymous source")
10. VISA **gutted** → *"Watered-Down Security Act Passes; Rights Groups Call It 'A Draw.'"*
11. `flag.sabotaged_meridian_dc` → *"Meridian Data Center Suffers 'Catastrophic Outage';
    Sabotage Suspected. Stock Tumbles."* (sets `world.meridian_stock -30`)
12. `world.meridian_stock < 40` → *"Meridian Shares Hit Record Low; Halloran Faces Board
    Revolt."* (unlocks discounted Meridian acquisition contracts; salaries at Meridian drop)
13. `flag.hacked_hospital` (if discovered) → *"Saint Bartholomew's Billing System Breached;
    Patient Records at Risk."* (sets `world.hospital_scandal=true`, raises Ledger interest)
14. `gasket.fate = bankrupt` → *"Uninsured and Underwater: A Vireburg Repairman's Story"*
    (Wren human-interest; `world.healthcare_anger +10`)
15. `flag.community_saved_mom` → *"Neighborhood Rallies to Save Local Mother; 'This Is What
    Ashmill Is.'"* (mood: warm; `world.ashmill_soul +15`)
16. `flag.danny_business` succeeds → *"Two Local Kids Turn Bedroom Startup Into Real Jobs."*
17. `flag.the_list` complied → *"Authorities Detain 12 in Coordinated 'Cyber Sweep.'"*
    (some are named NPCs; sets their fates; `world.fear +20`)
18. `mirror.fate = victorious` (bad path) → *"Mystery Intruder Cripples City Services;
    Police Baffled."*
19. `spectra.fate = martyr` → *"Hacker 'spectra' Arrested in Pre-Dawn Raid; Supporters Vow
    Retaliation."* (`world.undertow_militancy +20`)
20. `spectra.fate = reformer` → *"From Fugitive to Advocate: Ex-Hacker Testifies on Digital
    Rights."*
21. `world.salary_index` rising (dotcom recovery, ~Act II→III) → *"Tech Hiring Rebounds;
    Vireburg Salaries Up 18% As Dotcom Gloom Lifts."* (raises all legit pay; more jobs)
22. `flag.became_custodian` (E3 epilogue) → *"Vireburg Named 'Safest Connected City';
    Crime, and Dissent, at Historic Lows."* (the chilling triumphant headline)

*(Extra flavor headlines: broadband rollout ("Meridian Brings 'Always-On' Internet to
Kessler Heights First" — a class/access commentary), the Napster-era ("Music Industry Sues
Local Teens Over File Sharing"), and running gags reacting to the player's forum antics.)*

### World variables (read by systems, written by choices)

- `world.surveillance` (bool) — VISA state; gates `heat_gain_mult`.
- `world.heat_gain_mult` (1.0 default → 1.5 under VISA, 0.8 if VISA crushed + Undertow
  ascendant) — multiplies all Heat gain.
- `world.public_opinion` (-100…100) — feeds the VISA vote and ending tone.
- `world.meridian_stock` / `world.hsds_collapse` — corporate rise/fall; changes which
  jobs/contracts exist and their pay.
- `world.salary_index` (climbs with the dotcom recovery, ~2003+) — scales legit wages.
- `world.broadband` (0 dial-up → 3 fiber) — faster work, but rising trace risk over time.
- `world.federal_presence` (bool) — Bureau active; raises raid competence.
- `world.ashmill_soul` / `world.public_data_fear` / `world.healthcare_anger` — social
  mood meters that color news, NPC lines, and which endings feel "earned."
- `world.undertow_militancy` — escalates Undertow tactics and `spectra`'s arc.
- `world.hospital_scandal`, `world.fear`, `world.the_list_active` — dark-timeline switches.

The core loop: **player choice → sets flag/world var → news feed reports it → prices,
salaries, jobs, contracts, Heat math, and NPC dialogue all read the new value → the world
visibly, mechanically different.** Consequence you can *feel* in your schedule and wallet.

---

## 10. Life-Sim Integration (how the human systems carry the plot)

The idle life-sim isn't a backdrop; it's the resource layer every plot choice spends against.
Concrete intertwinings:

- **Family as moral collateral.** Mom's Act II health crisis is the single most consequential
  fork in the game precisely because it's a *life-sim* event (money + time + health) that
  forces a *plot* commitment (clean vs. Ledger vs. hospital-hack). Dad's Meridian job makes
  the corporate antagonist personal. The family flags (`mom.fate`, `dad.fate`) are read by
  half the endings.

- **Romance as accomplice-or-anchor.** `halcyon` and `crashcart` aren't just affinity meters
  — one is your inside line to Meridian and a whistleblower risk; the other is the literal
  human cost of the Ledger's hospital job. The "Confession" side quest gates whether your
  partner becomes an accomplice (shares Heat, hides you) or a betrayed party (can turn you
  in). Moving in together merges finances and risk. Marriage/children raise the stakes of
  every dangerous choice and unlock the "chose life" endings.

- **Housing as a progress ledger you live in.** Parents' flat → Terrace dorm → Kessler
  apartment or Ferrow house isn't cosmetic: your address changes Heat (a Kessler condo has
  better opsec but a Ledger address gets you noticed), changes which NPCs visit, and is the
  visible scorecard of which track you're winning. Losing your place after a raid is a
  setback that reroutes the plot (back to the parents' flat = a humbling, story-rich beat).

- **Health, aging, burnout as pacing brakes.** Energy/stress/health gate how hard you can
  push. The "Zero Day, Zero Sleep" side quest weaponizes the genre's grind fantasy into a
  hospitalization. Aging (18→30) lowers skill ceilings and energy floors late-game, so Act
  IV *feels* different to play — you can't brute-force like you did at 19. Burnout can force
  a job change mid-career-ladder, which is itself a plot pressure.

- **University as a branching investment.** The Poly entrance-exam mini-arc (Act I) is
  optional; enrolling costs years of schedule time and money but unlocks the senior legit
  ladder (Meridian internship needs a degree or elite Guild rep) and the Bello mentor arc.
  Skipping it commits you toward the underground/self-taught identity earlier. Semesters,
  a hard final-exam skill-check, and the degree flag are all read by the career gates.

- **The schedule IS the alignment system.** How the player splits free hours — study vs.
  freelance vs. hacking-contracts vs. social vs. rest — *is* their character build and their
  moral drift, with no separate "morality meter." Spend every hour on Ledger contracts and
  neglect the "social" block, and you'll watch affinity decay pull `crashcart` toward the
  "left you" fate and `scriptr` toward "arrested young." The most powerful storytelling
  device in the game is the thing the player was going to touch anyway: their own calendar.

---

## Implementation note (for the data layer, later)

Everything above is authored to drop into structured data:
- **Scenes** = dialogue trees (`nodes`, `choices[] {text, requires?, checks?, effects[]}`).
- **Quests** = `{ id, act, stages[] {objectives[], onComplete effects}, hints[] }`.
- **Triggers** = `{ when: <condition over flags/world/stats/date>, do: effects[] }`.
- **Effects** = a small verb set: `setFlag`, `addRep`, `setFate`, `pushNews`, `setWorld`,
  `giveItem`, `adjStat`, `unlockContract/Job`, `startScene`.
- **Skill checks** = `{ skill, dc, bonusFrom?: [items/flags/stats], onPass, onFail }` —
  failure branches are authored as first-class content, never dead ends.
- **Faction rep** = five -100…100 scalars with named tiers and cross-faction penalty rules.
- **NPC fates** = enum per NPC, set by flags, read by the epilogue assembler.

The story is the systems. Ship the systems well, and the story tells itself differently for
every player — which is the whole point of this cut.
