/**
 * PKG-03 — Act III climax, beat 8: `main_a3_q8_meridian_heist` (bible §6.C, CP-C3).
 *
 * Drain / expose / protect / sting Meridian. One convergent operation with per-`a2.spine` route
 * variants, a crew-select, a telegraphed pre-heist warning, and mid-heist decisions. Deaths are
 * NOT a pure roll: byteme `dead` needs `npc.byteme.used` + an ignored corner-cut; Jax `dead` needs
 * `npc.jax.exposed` + an ignored `a3.warned_about_jax`; a fail with `a3.chose_speed_over_mira` puts
 * Mira in the casualty seat. Otherwise a fail is a non-fatal setback (`a3.burned`) — never game over.
 * The clean pull ([Cryptography DC 20]) is its own method and yields `a3.ghost_protocol`.
 *
 * Fail branch (bible §6.C "forced into someone's protection", REDESIGN_V2 §D): every `a3.burned`
 * outcome opens `main_a3_q8b_burned`. Whose hand you take decides a lasting mark — Deadline's '94
 * route (`npc.deadline.saved_you`, the Ghost Habits scar), Kroll (the Owned scar, `a3.owes_kroll`),
 * Reyes (the On the Tape scar, `a3.burned_came_in`), Vale (money + a counsel obligation), the Row
 * (the Burned scar, a possible complication) or nobody ([Opsec DC 18]). `a3.burned_protector` (str)
 * is read by PKG-04's long-tail scene, finale and epilogues. A spurned mirror (q4) skims the job.
 *
 * Cross-package ids referenced by exact bible id (owners in parentheses):
 *   mission a3_signal_intelligence (PKG-17); flags a2.spine / a2.recon_sloppy (PKG-02),
 *   npc.jax.exposed / npc.jax.flipped (PKG-02/07), npc.byteme.used (PKG-12), npc.dad.mill_job
 *   (PKG-15), npc.calderon.ally_case (PKG-07), end.has_evidence (PKG-04); item priya_proof (PKG-00);
 *   news.meridian_collapse / news.aperture_exposed (PKG-16, which own the w.* riders).
 */
import { defineContent } from '@/engine/registry'
import type { Cond, Effect } from '@/engine/types'

const available = {
  jax: { npc: 'jax', fateNot: ['dead', 'arrested', 'gone'] } as Cond,
  mira: { npc: 'mira', fateNot: ['dead', 'gone', 'rival', 'casualty', 'flips_you'] } as Cond,
  byteme: { npc: 'byteme', fateNot: ['dead', 'arrested_young', 'turns'] } as Cond,
  deadline: { npc: 'deadline', fateNot: 'passed' } as Cond,
}

/** A spurned mirror (q4 turn fail) was in the tower too, a step ahead of you. */
const mirrorSkims: Effect = {
  if: { flag: 'a3.mirror_spurned' },
  then: [
    { stat: 'heat', add: 8 },
    {
      if: { flag: 'a3.route', eq: 'drain' },
      then: [
        { money: -40000 },
        { notify: 'Forty thousand of the Meridian drain landed somewhere you never routed it. A calling card waited in the empty account: "same first job. i just didn\'t stop to make friends." — mirror', kind: 'bad' },
      ],
      else: [{ notify: 'Someone else was inside Meridian with you tonight, leaving your methods on every door like fingerprints. mirror, making sure you get the credit.', kind: 'bad' }],
    },
  ],
}

/** Burned: the run came apart with your prints on it. Someone has to pull you out (bible §6.C). */
const burnedFollowUp: Effect[] = [
  { quest: 'main_a3_q8b_burned', start: true },
  { scene: 'a3_burned', delayHours: 30 },
]

/** Route payoffs, applied only on a successful run. */
const winByRoute: Effect[] = [
  mirrorSkims,
  {
    if: { flag: 'a3.route', eq: 'drain' },
    then: [
      { money: 250000 },
      { faction: 'fac.aperture', add: 40 },
      { faction: 'fac.loft', add: -15 },
      { stat: 'heat', add: 50 },
      { news: 'meridian_collapse' },
      { if: { flag: 'a3.mill_sabotage' }, then: [{ npc: 'dad', affinity: -15 }, { notify: 'You brought the datacenter down with the bank — your father\'s new floor went dark with it.', kind: 'bad' }] },
      { if: { flag: 'a3.hollis_frame' }, then: [{ flag: 'npc.hollis.your_ally' }, { flag: 'npc.kroll.charged' }] },
    ],
  },
  {
    if: { flag: 'a3.route', eq: 'sting' },
    then: [
      { faction: 'fac.bureau', add: 40 },
      { flag: 'w.meridian_state', set: 'breached' },
      { notify: 'The sting closes like a fist. Cuffs in the Millgate parking structure at dawn.', kind: 'story' },
      { if: { flag: 'a3.sting_take_aperture' }, then: [{ flag: 'npc.kroll.charged' }, { if: { item: 'priya_proof' }, then: [{ flag: 'a3.whistleblow_prepped' }] }] },
      { if: { flag: 'a3.sting_protect' }, then: [{ faction: 'fac.loft', add: 10 }, { notify: 'You steered the arrests away from the scene. The Loft is bruised, not broken. Kroll walks.', kind: 'story' }] },
      { if: { flag: 'a3.sting_pd' }, then: [{ notify: 'Detective Calderon made the arrest herself — local, clean, by the book. She bought you the worst coffee in the precinct.', kind: 'story' }] },
    ],
  },
  {
    if: { flag: 'a3.route', eq: 'expose' },
    then: [
      {
        if: { flag: 'a3.expose_no_evidence' },
        then: [
          { flag: 'a3.hoax' },
          { stat: 'heat', add: 20 },
          { notify: 'You leaked everything you had — and it wasn\'t enough. Dismissed as a hoax by a conspiracy nut. But you named them. That will matter later, or it will haunt you.', kind: 'bad' },
        ],
        else: [
          { news: 'aperture_exposed' },
          { faction: 'fac.loft', add: 50 },
          { stat: 'heat', add: 40 },
          { flag: 'a3.folk_hero' },
          { flag: 'w.meridian_state', set: 'breached' },
          { notify: 'It lands. The whole ugly architecture, in daylight, on the front page. For one glorious, dangerous week you are the handle everyone is asking about.', kind: 'story' },
        ],
      },
    ],
  },
  {
    if: { flag: 'a3.route', eq: 'sabotage' },
    then: [
      { faction: 'fac.halcyon', add: 40 },
      { flag: 'a3.good_soldier' },
      { faction: 'fac.loft', add: -60 },
      { notify: 'You made the whole thing fail from the inside, and let Vale be the man who saved the day. He shook your hand too long and said "family" twice. The scene will call you a traitor, and it will be right.', kind: 'story' },
    ],
  },
  { flag: 'a3.heist_resolved' },
]

/** Non-fatal setback, plus the specific deaths that neglect made reachable. */
const loseAndCasualty: Effect[] = [
  { flag: 'a3.burned' },
  ...burnedFollowUp,
  { stat: 'heat', add: 30 },
  { if: { flag: 'a2.recon_sloppy' }, then: [{ stat: 'heat', add: 10 }] },
  {
    if: { all: [{ flag: 'a3.crew_jax' }, { flag: 'npc.jax.exposed' }, { flag: 'a3.warned_about_jax' }] },
    then: [
      { npc: 'jax', fate: 'dead' },
      { notify: 'They warned you not to bring him. Jax didn\'t make it out. His pager number still works. You will never call it, and you will never cancel it.', kind: 'bad' },
    ],
    else: [
      {
        if: { all: [{ flag: 'a3.crew_byteme' }, { flag: 'npc.byteme.used' }, { flag: 'a3.cut_corners' }] },
        then: [
          { npc: 'byteme', fate: 'dead' },
          { notify: 'The corner you cut was the one holding Kevin up. He was younger than you were when you started.', kind: 'bad' },
        ],
        else: [
          {
            if: { all: [{ flag: 'a3.crew_mira' }, { flag: 'a3.chose_speed_over_mira' }] },
            then: [
              { npc: 'mira', fate: 'casualty' },
              { notify: 'You went fast instead of right, over her plan, and Mira paid for it. You will think about that more than anything else you have done.', kind: 'bad' },
            ],
            else: [
              { stat: 'stress', add: 15 },
              { notify: 'It comes apart, but everyone gets out — bruised, spooked, whole. You burned the operation, not a person. This time.', kind: 'bad' },
            ],
          },
        ],
      },
    ],
  },
  { flag: 'a3.heist_resolved' },
]

export default defineContent({
  quests: [
    {
      id: 'main_a3_q8_meridian_heist',
      title: 'The Meridian Job',
      kind: 'main',
      act: 3,
      priority: 30,
      summary:
        'Everything runs through Meridian Trust: the bank, Aperture\'s money, PARALLAX\'s pipes. One operation to drain it, expose it, sting it, or sabotage it — your road decided by the person you chose to be at the hinge. Pick your crew. Listen to the warnings. Not everyone has to come home.',
      rewards: 'The shape of the endgame',
      start: 'wait',
      stages: {
        wait: {
          text: 'The job everyone has been circling for a decade. Recon is done, alliances are set, and the only thing left is to walk in as whoever you\'ve become.',
          hint: 'A little time to assemble. Then it\'s the Meridian job. Your Act II hinge decides your routes; crew and evidence change the odds.',
          objectives: [
            { id: 'wait', text: 'Set up the Meridian job', when: { day: true, gte: 2200 }, hint: 'The window opens on its own. Make sure the people you\'ll want are still speaking to you.' },
          ],
          onComplete: [{ scene: 'a3_heist' }],
          next: 'run',
        },
        run: {
          text: 'The Meridian job is live. Crew, route, and the corners you cut — all of it decides who walks out and what the city wakes up to.',
          hint: 'Follow the operation to the end. When Deadline or Sal warns you about who you brought, listen.',
          objectives: [
            { id: 'done', text: 'Run the Meridian job', when: { flag: 'a3.heist_resolved' }, hint: 'See the operation through, however it ends.' },
          ],
        },
      },
    },
    // ── Fail branch: burned at Meridian (bible §6.C "forced into someone's protection") ──
    {
      id: 'main_a3_q8b_burned',
      title: 'Burned',
      kind: 'main',
      act: 3,
      priority: 29,
      summary:
        'Meridian came apart with your fingerprints on the lock. Your face is a still frame on somebody\'s monitor. You cannot get out of this alone — or you can, but it will cost you a different way. Someone is going to pull you out, and whoever it is, you will owe them for the rest of the story.',
      rewards: 'Whose protection you live under',
      start: 'pulled',
      stages: {
        pulled: {
          text: 'You are burned. The people who can make it go away are already calling. Choose whose hand you take — Deadline\'s old route, Kroll\'s warm voice, Reyes\'s interview room, Vale\'s lawyers, the Row — or go to ground alone.',
          hint: 'A dialog opens within a day or two. Every protector leaves a mark (a scar, a debt, a faction shift). Going it alone is a hard Opsec roll.',
          objectives: [
            {
              id: 'protected',
              text: 'Decide who pulls you out',
              when: { flag: 'a3.burned_resolved' },
              hint: 'Follow the dialog to a choice. Which doors are open depends on who still trusts you.',
            },
          ],
        },
      },
    },
  ],
  scenes: [
    {
      id: 'a3_heist',
      channel: 'dialog',
      title: 'The Meridian Job',
      start: 'brief',
      nodes: {
        brief: {
          speaker: 'narrator',
          text: [
            'The old Meridian Trust tower, digitizing badly for a decade, is where everything meets: the bank\'s money, Aperture\'s laundry, PARALLAX\'s pipes. Get into it and you get into all of it.',
            { if: { flag: 'a2.spine', eq: 'aperture' }, text: 'Kroll set this up as a favor to you, which means it is also a leash. She thinks she knows which way you\'ll pull.' },
            { if: { flag: 'a2.spine', eq: 'bureau' }, text: 'Reyes has a warrant half-drafted and a promise that this time the arrests go up the chain, not just down it.' },
            { if: { flag: 'a2.spine', eq: 'loft' }, text: 'Corvid asked for one thing: don\'t sell it, don\'t sting it — burn it into daylight so the whole city can see.' },
            { if: { flag: 'a2.spine', eq: 'halcyon' }, text: 'Vale wants a quiet failure — the job that never quite happens, so his beautiful company stays clean and you stay indispensable.' },
            { if: { flag: 'fac.bureau.onto_you_hard' }, text: 'Marlow\'s people have been two cars behind you for a month now. Not close enough to stop you. Close enough to be in the room afterward.' },
            { if: { flag: 'a3.mirror_spurned' }, text: 'And somewhere out there, mirror knows you are doing this tonight. You can feel it the way you feel weather in a bad knee.' },
            { if: { trait: 'pkg03_act3_parallax_scored' }, text: 'PARALLAX already has a risk score with your name on it. Tonight you find out whether it priced you right.' },
            'First: who\'s with you. Choose carefully. The best crew is the one still willing to answer your page.',
          ],
          next: 'crew1',
        },
        crew1: {
          speaker: 'narrator',
          text: 'Your first pick. You can take up to two — or go in alone and answer to no one but the trace clock.',
          choices: [
            { text: 'Jax — the talker. He can get a badge to hold a door.', if: available.jax, effects: [{ flag: 'a3.crew_jax' }, { npc: 'jax', affinity: 4 }], goto: 'crew2' },
            { text: 'Mira — the crypto. Slow, clean, never leaves a fingerprint.', if: available.mira, effects: [{ flag: 'a3.crew_mira' }, { npc: 'mira', affinity: 4 }], goto: 'crew2' },
            { text: 'byteme — the speed. Faster than sense, twice as loud.', if: available.byteme, effects: [{ flag: 'a3.crew_byteme' }, { npc: 'byteme', affinity: 4 }], goto: 'crew2' },
            { text: 'Deadline — the old routes. He knows doors that predate the locks.', if: available.deadline, effects: [{ flag: 'a3.crew_deadline' }, { npc: 'deadline', affinity: 4 }], goto: 'crew2' },
            { tag: '[Solo]', text: 'Nobody. Fewer people to lose is fewer people to lose.', goto: 'warn' },
          ],
        },
        crew2: {
          speaker: 'narrator',
          text: 'One more, or go with who you\'ve got.',
          choices: [
            { text: 'Jax — the talker.', if: { all: [available.jax, { not: { flag: 'a3.crew_jax' } }] }, effects: [{ flag: 'a3.crew_jax' }, { npc: 'jax', affinity: 4 }], goto: 'warn' },
            { text: 'Mira — the crypto.', if: { all: [available.mira, { not: { flag: 'a3.crew_mira' } }] }, effects: [{ flag: 'a3.crew_mira' }, { npc: 'mira', affinity: 4 }], goto: 'warn' },
            { text: 'byteme — the speed.', if: { all: [available.byteme, { not: { flag: 'a3.crew_byteme' } }] }, effects: [{ flag: 'a3.crew_byteme' }, { npc: 'byteme', affinity: 4 }], goto: 'warn' },
            { text: 'Deadline — the old routes.', if: { all: [available.deadline, { not: { flag: 'a3.crew_deadline' } }] }, effects: [{ flag: 'a3.crew_deadline' }, { npc: 'deadline', affinity: 4 }], goto: 'warn' },
            { tag: '[Enough]', text: 'That\'s the crew. Let\'s go.', goto: 'warn' },
          ],
        },
        warn: {
          speaker: 'deadline',
          text: [
            'Deadline catches your sleeve at the door, Sal hovering behind him with a thermos nobody asked for. "Before you go. Two things a man who did fourteen months tells a friend."',
            '"One: the building doesn\'t care how good you are. It cares who you brought."',
            { if: { all: [{ flag: 'a3.crew_jax' }, { flag: 'npc.jax.exposed' }] }, text: '"Two: don\'t bring the kid whose name is already in a file. Jax is exposed. You take him in there and it goes wrong, it goes wrong on HIM. Leave him at the Cathode. I\'m asking you." (You hear it. Whether you listen is on you.)' },
            { if: { all: [{ flag: 'a3.crew_jax' }, { flag: 'npc.jax.flipped' }] }, text: '"Two: you know he flipped. You\'re walking a wired man into a bank. Either that\'s the plan or it\'s a funeral. Which is it?"' },
            { if: { all: [{ flag: 'a3.crew_byteme' }, { flag: 'npc.byteme.used' }] }, text: '"Two: the kid byteme runs hot and you\'ve been running him hotter. Don\'t let him cut a corner that\'s holding him up."' },
          ],
          effects: [
            { if: { all: [{ flag: 'a3.crew_jax' }, { flag: 'npc.jax.exposed' }] }, then: [{ flag: 'a3.warned_about_jax' }] },
          ],
          next: 'route',
        },
        route: {
          speaker: 'narrator',
          text: [
            'Inside now, or as good as. The plan splits here, along the road you chose at the hinge years ago. Whatever you do to Meridian, you do to everything it touches.',
            'There is always the clean pull — pure crypto, owe no one, hold the whole proof — if your hands are good enough.',
          ],
          choices: [
            { tag: '[Drain]', text: 'Drain it. Empty the accounts, let Meridian fall, take the money.', if: { flag: 'a2.spine', eq: 'aperture' }, effects: [{ flag: 'a3.route', set: 'drain' }], goto: 'drain_mill' },
            { tag: '[Sting]', text: 'Sting it. Let the arrests fall where you point them.', if: { flag: 'a2.spine', eq: 'bureau' }, effects: [{ flag: 'a3.route', set: 'sting' }], goto: 'sting_sub' },
            {
              tag: '[Expose]',
              text: 'Expose it. Leak the whole Meridian–Aperture web into daylight, Robin Hood.',
              if: { flag: 'a2.spine', eq: 'loft' },
              effects: [
                { flag: 'a3.route', set: 'expose' },
                { if: { not: { flag: 'end.has_evidence' } }, then: [{ flag: 'a3.expose_no_evidence' }] },
              ],
              goto: 'mid',
            },
            { tag: '[Sabotage]', text: 'Sabotage the job. Make it fail so Halcyon stays clean and you stay useful.', if: { flag: 'a2.spine', eq: 'halcyon' }, effects: [{ flag: 'a3.route', set: 'sabotage' }], goto: 'mid' },
            {
              tag: '[Cryptography DC 20]',
              text: 'The clean pull. Take the whole proof yourself, quiet, owing nobody.',
              effects: [{ flag: 'a3.route', set: 'clean' }],
              check: {
                skill: 'cryptography',
                dc: 20,
                bonuses: [{ if: { item: 'old_tool' }, add: 2, label: "+2 (the phreaker's toolbox)" }],
                success: 'clean_win',
                fail: 'clean_fail',
              },
            },
            {
              tag: '[Betray]',
              text: 'Betray your backers — drain it for yourself no matter whose plan this was.',
              req: { faction: 'fac.aperture', gte: 50 },
              reqText: 'Requires deep Aperture standing (and it runs hotter)',
              effects: [{ flag: 'a3.route', set: 'drain' }, { flag: 'a3.betrayal' }, { stat: 'heat', add: 15 }],
              goto: 'drain_mill',
            },
          ],
        },
        drain_mill: {
          speaker: 'narrator',
          text: [
            { if: { flag: 'npc.dad.mill_job' }, text: 'The drain runs through the mill-district datacenter — the old paper mill, where your father clocks in now, walking the floor he used to. Bringing Meridian down means bringing that floor down. His floor.', else: 'The drain runs through the mill-district datacenter, humming in the gutted paper mill where a whole generation of the Row used to work.' },
          ],
          choices: [
            { text: 'Sabotage the datacenter too. Total collapse; no half measures.', if: { flag: 'npc.dad.mill_job' }, effects: [{ flag: 'a3.mill_sabotage' }], goto: 'drain_hollis' },
            { text: 'Spare the datacenter. Take the bank, leave the mill floor cold but standing.', effects: [{ flag: 'a3.mill_spared' }], goto: 'drain_hollis' },
          ],
        },
        drain_hollis: {
          speaker: 'narrator',
          text: 'Hollis reaches you on a burner while you work — grey Miles Hollis, who has always wanted Kroll\'s chair. "There\'s a version of tonight where the mess lands on Vanessa. I\'d owe you. You\'d like being owed by me."',
          choices: [
            { text: 'Let Hollis frame Kroll. Point the wreckage at her.', effects: [{ flag: 'a3.hollis_frame' }], goto: 'mid' },
            { text: 'No deals with Compliance. Keep your hands on your own leash.', goto: 'mid' },
          ],
        },
        sting_sub: {
          speaker: 'reyes',
          text: '"Your call on the shape of it," Reyes says, quiet on the line. "We can protect the scene and let the small fish swim, or we go up the chain and try for Aperture itself — riskier, and Kroll doesn\'t scare."',
          choices: [
            { text: 'Protect the Loft. Steer the arrests away from the scene.', effects: [{ flag: 'a3.sting_protect' }], goto: 'mid' },
            { text: 'Take Aperture. Go all the way up, whatever it costs.', effects: [{ flag: 'a3.sting_take_aperture' }], goto: 'mid' },
            { text: 'Let PD make the arrest — clean, local, on the record.', if: { flag: 'npc.calderon.ally_case' }, effects: [{ flag: 'a3.sting_pd' }], goto: 'mid' },
          ],
        },
        mid: {
          speaker: 'narrator',
          text: 'Mid-operation, the two decisions that always come: how fast, and how careful.',
          choices: [
            { text: "Trust Mira's slow, clean plan. Let her set the pace.", if: { flag: 'a3.crew_mira' }, goto: 'run_op' },
            { text: 'Override Mira. Go fast, your way, damn the plan.', if: { flag: 'a3.crew_mira' }, effects: [{ flag: 'a3.chose_speed_over_mira' }], goto: 'run_op' },
            { text: 'Cut corners to shave hours off the clock.', effects: [{ flag: 'a3.cut_corners' }], goto: 'run_op' },
            { text: 'Play it careful. Slow is smooth, smooth is fast.', goto: 'run_op' },
          ],
        },
        run_op: {
          speaker: 'narrator',
          text: [
            'And then it\'s just you and the machine and the trace clock, the way it always is in the end. The login page is held together with duct tape and a merger. Everything you\'ve trained for since a beige box in your mother\'s house comes down to the next few minutes.',
            'Open the terminal and do it by hand, or trust your instincts and let it ride.',
          ],
          mission: {
            mission: 'a3_signal_intelligence',
            success: 'win',
            fail: 'lose',
            auto: { skill: 'intrusion', dc: 18 },
          },
        },
        win: {
          speaker: 'narrator',
          text: [
            'It works. Whatever it cost, whatever it meant — it works, and the tower\'s secrets are yours to spend.',
            { if: { flag: 'a3.route', eq: 'drain' }, text: 'The accounts empty into places only you can reach. Meridian Trust, a hundred and forty years old, does not open on Monday.' },
            { if: { flag: 'a3.route', eq: 'sting' }, text: 'The wire holds, the warrant is good, and for once the arrests go where you aimed them.' },
            { if: { all: [{ flag: 'a3.route', eq: 'expose' }, { not: { flag: 'a3.expose_no_evidence' } }] }, text: 'The whole rotten web goes up on a mirror site by midnight, and by morning the city cannot un-see it.' },
            { if: { flag: 'a3.route', eq: 'sabotage' }, text: 'The job dies exactly the quiet death Vale wanted, and no one but you will ever know you killed it.' },
          ],
          effects: winByRoute,
        },
        lose: {
          speaker: 'narrator',
          text: [
            'It comes apart in your hands. A trace you didn\'t see, a door that was watched, a plan that met a wall.',
            'You get out — you always get out; the story doesn\'t end in a bank vault — but not clean, and not free, and maybe not everyone.',
          ],
          effects: loseAndCasualty,
        },
        clean_win: {
          speaker: 'narrator',
          text: [
            'No crew, no faction, no favors owed. Just you and a cipher, and hands good enough to lift the whole proof out clean and leave the lock still thinking it\'s shut.',
            'You hold everything now, and owe no one for it. It is the loneliest kind of power, and the only kind nobody can take back.',
          ],
          effects: [
            { flag: 'a3.ghost_protocol' },
            { flag: 'w.meridian_state', set: 'breached' },
            { flag: 'a3.heist_resolved' },
          ],
        },
        clean_fail: {
          speaker: 'narrator',
          text: [
            'The cipher is a hair past you tonight. The trace finds you first, and you bail with your fingerprints on the lock and nothing to show for it.',
            'You\'re burned. Somebody is going to have to pull you out of this, and pulling costs.',
          ],
          effects: [
            { flag: 'a3.burned' },
            { stat: 'heat', add: 30 },
            ...burnedFollowUp,
            { flag: 'a3.heist_resolved' },
          ],
        },
      },
    },
    {
      id: 'a3_burned',
      channel: 'dialog',
      title: 'Burned',
      start: 'open',
      nodes: {
        open: {
          speaker: 'narrator',
          text: [
            'Thirty hours after Meridian. You have slept for two of them. Your phone has rung eleven times from numbers you do not have saved, and the news has a grainy still from a lobby camera that is not quite your face, yet.',
            'You know how this goes. Somebody is about to make this go away for you, or somebody is about to make you go away. The only choice left is whose hand you take on the way out.',
            { if: { flag: 'a3.route', eq: 'drain' }, text: 'You did not even get the money. The accounts froze with your hands still in them.' },
          ],
          choices: [
            {
              tag: '[Deadline\'s route]',
              text: '"The \'94 way out. You said there was one nobody\'s used since. I need it now."',
              if: { all: [{ npc: 'deadline', met: true }, { npc: 'deadline', fateNot: ['passed', 'dead', 'missing'] }, { npc: 'deadline', affinityGte: 25 }] },
              effects: [
                { flag: 'npc.deadline.saved_you' },
                { npc: 'deadline', affinity: 10 },
                { money: -3000 },
                { stat: 'heat', add: -25 },
                { trait: 'pkg03_act3_ghost_habits' },
                { flag: 'a3.burned_protector', set: 'deadline' },
              ],
              goto: 'deadline',
            },
            {
              tag: '[Kroll]',
              text: 'Answer the call from the number you were told never to write down.',
              if: { all: [{ faction: 'fac.aperture', gte: 20 }, { npc: 'kroll', fateNot: ['arrested', 'dead'] }] },
              effects: [
                { trait: 'pkg03_act3_owned' },
                { faction: 'fac.aperture', add: 10 },
                { var: 'w.enclosure', add: 1 },
                { stat: 'heat', add: -35 },
                { flag: 'a3.owes_kroll' },
                { flag: 'a3.burned_protector', set: 'kroll' },
              ],
              goto: 'kroll',
            },
            {
              tag: '[Reyes]',
              text: 'Walk into the federal building before they come get you. Ask for Agent Reyes by name.',
              if: { all: [{ faction: 'fac.bureau', gte: 20 }, { not: { flag: 'fac.bureau.onto_you_hard' } }, { npc: 'reyes', met: true }] },
              effects: [
                { faction: 'fac.bureau', add: 12 },
                { faction: 'fac.loft', add: -15 },
                { stat: 'heat', add: -30 },
                { trait: 'pkg03_act3_on_the_tape' },
                { flag: 'a3.burned_came_in' },
                { flag: 'a3.burned_protector', set: 'reyes' },
              ],
              goto: 'reyes',
            },
            {
              tag: '[Vale · $15,000]',
              text: 'Call Marcus Vale. Halcyon has lawyers for exactly this kind of misunderstanding.',
              if: { faction: 'fac.halcyon', gte: 20 },
              req: { stat: 'money', gte: 15000 },
              reqText: 'Requires $15,000 for the first invoice',
              effects: [
                { money: -15000 },
                { obligation: { id: 'pkg03_act3_halcyon_counsel', label: 'Halcyon outside counsel ("courtesy rate")', perDay: 40, days: 150 } },
                { faction: 'fac.halcyon', add: 8 },
                { stat: 'heat', add: -25 },
                { flag: 'a3.vale_cleaned_up' },
                { flag: 'a3.burned_protector', set: 'vale' },
              ],
              goto: 'vale',
            },
            {
              tag: '[The Row]',
              text: 'Go home. Let Cannery Row do what it has always done for its own: see nothing, say less.',
              if: { faction: 'fac.hood', gte: 20 },
              effects: [
                { faction: 'fac.hood', add: 5 },
                { stat: 'heat', add: -20 },
                { trait: 'pkg03_act3_burned' },
                {
                  buff: {
                    id: 'pkg03_act3_lying_low_row',
                    name: 'Lying Low on the Row',
                    desc: 'A cot in somebody\'s back room, casseroles, no screens. Stress fades; work crawls.',
                    days: 30,
                    mods: [
                      { key: 'hack.speed', mult: 0.8 },
                      { key: 'stress.relief', mult: 1.25 },
                    ],
                  },
                },
                { chance: 0.4, then: [{ complication: 'social' }] },
                { flag: 'a3.burned_protector', set: 'row' },
              ],
              goto: 'row',
            },
            {
              tag: '[Opsec DC 18]',
              text: 'Nobody. You go to ground alone, the way you should have been living all along.',
              check: {
                skill: 'opsec',
                dc: 18,
                bonuses: [
                  { if: { flag: 'life.y2k_safehouse' }, add: 2, label: '+2 (the Y2K safehouse, still stocked)' },
                  { if: { trait: 'paranoid' }, add: 1, label: '+1 (you were always halfway to ground)' },
                ],
                success: 'ground_ok',
                fail: 'ground_fail',
                successEffects: [
                  { trait: 'pkg03_act3_ghost_habits' },
                  { stat: 'heat', add: -20 },
                  { flag: 'a3.burned_protector', set: 'nobody' },
                ],
                failEffects: [
                  { trait: 'pkg03_act3_burned' },
                  { stat: 'heat', add: 10 },
                  { complication: 'legal', tier: 4 },
                  { flag: 'a3.burned_protector', set: 'nobody' },
                ],
              },
            },
          ],
        },
        deadline: {
          speaker: 'deadline',
          text: [
            '"Figured you\'d call." He is already in his coat. "There\'s a way out of this city nobody\'s used since \'94, because the people who knew it either did time or got religion. I did both."',
            'For nine days you live his way: cash, a borrowed name, a room over a laundromat with the radio on so the walls can\'t hear. He never once says I told you so. On the tenth day the still frame on the news is somebody else\'s face, and he drops you at the corner like a cab. "Back up your life," he says. "Not your data." You finally understand what he meant.',
          ],
          effects: [{ flag: 'a3.burned_resolved' }],
        },
        kroll: {
          speaker: 'kroll',
          text: [
            '"There you are." Warm as a kitchen. "Don\'t say anything on this line, sweetheart. Don\'t say anything on any line for a week. By Friday the lobby footage will have been a maintenance glitch, and the detective who asked about it will have a very exciting new opportunity in Ridgeport."',
            '"No, you don\'t owe me." A pause, perfectly timed. "You\'ll just find you want to take my calls. That\'s all. That\'s all it ever is."',
          ],
          effects: [{ flag: 'a3.burned_resolved' }],
        },
        reyes: {
          speaker: 'reyes',
          text: [
            'Reyes meets you in the lobby herself, which she did not have to do. The interview room is beige and cold and has a camera in the corner she does not pretend isn\'t there. "You talk, it\'s on tape," she says. "You don\'t, it\'s on tape anyway. The difference is whether I can help."',
            'You talk. Not everything. Enough. When you walk out six hours later the still frame is off the news, and your name is in a federal file as a "cooperating individual," and somewhere on Sodium Row the word gets around that you came in. It always gets around.',
          ],
          effects: [{ flag: 'a3.burned_resolved' }],
        },
        vale: {
          speaker: 'vale',
          text: [
            '"Family," Vale says, before you finish the sentence. By the afternoon three lawyers in beautiful shoes have explained to two police departments that you were at a Halcyon offsite that night, with forty witnesses and a catering receipt.',
            'The first invoice arrives the next morning, marked COURTESY RATE, and the invoices keep arriving every week after that, like a subscription to being grateful.',
          ],
          effects: [{ flag: 'a3.burned_resolved' }],
        },
        row: {
          speaker: 'narrator',
          text: [
            'You sleep on a cot in the back of the laundromat on Cannery Row for a month. Mrs. Alvarez brings soup. Sal brings pie and news. When a man in a good coat walks the block asking about "a young computer person," forty people who have known you since you were eight have never heard of you.',
            'The Row keeps you. The Row also knows, now, what it is keeping — and some of them are going to be asked about it again, by people less polite than the man in the coat.',
          ],
          effects: [{ flag: 'a3.burned_resolved' }],
        },
        ground_ok: {
          speaker: 'narrator',
          text: [
            'You vanish like weather. Cash, a different café every morning, a phone you throw in the Sound on day three. Nobody pulls you out, which means nobody owns you after.',
            'By the time it is safe to come up, you have learned to live like a person nobody can model. You find you cannot quite stop.',
          ],
          effects: [{ flag: 'a3.burned_resolved' }],
        },
        ground_fail: {
          speaker: 'narrator',
          text: [
            'You go to ground, and the ground is not as deep as you thought. On the sixth day a detective you have never met leaves a business card under your windshield wiper, at the motel you checked into under a name you made up that morning.',
            'Nobody arrests you. Nobody has to. The card says CALL ME, and the city\'s cameras know the shape of your walk now, and they are not going to forget it.',
          ],
          effects: [{ flag: 'a3.burned_resolved' }],
        },
      },
    },
  ],
})
