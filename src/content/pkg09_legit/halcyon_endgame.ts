/**
 * PKG-09 — Halcyon, part 3 (bible §7.4 steps 5–6, E10 "Vesting").
 *
 *  - `fac_halcyon_q5_handcuffs` (Act IV) — Vale offers you the table. Ascend
 *    (`fac.halcyon.made_partner`) / reform (`npc.vale.reformed`, publishes `halcyon_clean`) /
 *    detonate (`npc.vale.exposed`, an evidence fragment — feeds E1) / walk out with Priya (starts
 *    q6). Guarded: never after `a3.whistleblow_prepped`, never once Halcyon is 'dead'.
 *  - `fac_halcyon_q6_founders` (Act IV, Halcyon's `fac_<X>_final`) — you and Priya build something
 *    clean → `end.clean_startup`, Priya 'cofounder'. Always resolves (completed or declined →
 *    failed) so main_a4_q2's finales stage can never stall on it. Also reachable when Halcyon is
 *    already dead (Priya pitches it at the liquidation), since then q5 can never start.
 *
 * Vale's fate is written here directly per branch (PKG-09 owns `npc.vale.fate`), matching the
 * §4.6 rules, so it is correct whichever order this and main_a4_q1 run in.
 */
import { defineContent } from '@/engine/registry'
import type { Cond, Effect } from '@/engine/types'

const HALCYON_JOB = 'job_halcyon_junior'

const isClean: Cond = { flag: 'w.halcyon_state', eq: 'clean' }
const valeCameClean: Cond = { any: [isClean, { flag: 'npc.vale.reformed' }] }

/** Priya is still here, still herself, and still speaks to you. */
const priyaAvailable: Cond = {
  all: [
    { npc: 'priya', met: true },
    { npc: 'priya', fateNot: ['broken', 'martyr'] },
    { npc: 'priya', affinityGte: 30 },
    { not: { flag: 'a3.kroll_hunts_priya' } },
    { not: { flag: 'a3.whistleblow_prepped' } },
  ],
}

const LEAVE_HALCYON: Effect[] = [{ if: { job: HALCYON_JOB }, then: [{ job: null }] }, { var: 'fac.halcyon.options', set: 0 }]

const DETONATE_CORE: Effect[] = [
  { flag: 'fac.halcyon.detonated' },
  { flag: 'npc.vale.exposed' },
  { npc: 'vale', fate: 'exposed' },
  { var: 'evidence_fragments', add: 1 },
  { var: 'w.exposure', add: 2 },
  { flag: 'w.halcyon_state', set: 'crashed' },
  { faction: 'fac.aperture', add: -10 },
  ...LEAVE_HALCYON,
]

const REFORM_BONUSES = [
  { if: { flag: 'a2.building_a_case' }, add: 2, label: '+2 you kept the ledger pages' },
  { if: { item: 'priya_proof' }, add: 2, label: '+2 Priya\'s proof' },
  { if: { flag: 'fac.halcyon.steadied' }, add: 2, label: '+2 you saved his company once' },
]

const REFORM_WIN: Effect[] = [
  { flag: 'npc.vale.reformed' },
  { npc: 'vale', fate: 'reformed' },
  { news: 'halcyon_clean' },
  { faction: 'fac.halcyon', add: 10 },
  { faction: 'fac.aperture', add: -15 },
  { npc: 'priya', affinity: 5 },
]

/** You threatened Marcus Vale on his own boat and lost. He makes calls. */
const REFORM_FAIL: Effect[] = [
  { faction: 'fac.halcyon', add: -15 },
  { flag: 'fac.halcyon.vale_enemy' },
  { trait: 'pkg09_legit_blackballed' },
  { stat: 'stress', add: 10 },
]

/** Aperture's lawyers found the badge that pulled the audit exports. */
const APERTURE_SUIT = 'pkg09_aperture_suit'

const HIRE_BONUSES = [
  { if: { flag: 'fac.halcyon.founders_dee' }, add: 2, label: '+2 Dee runs the office' },
  { if: { flag: 'fac.halcyon.founders_wes' }, add: 2, label: '+2 Wes keeps the servers up' },
  { if: { flag: 'fac.halcyon.founders_team' }, add: 2, label: '+2 the old third floor' },
]

const LAUNCHED: Effect[] = [
  { flag: 'end.clean_startup' },
  { npc: 'priya', fate: 'cofounder' },
  { npc: 'priya', affinity: 10 },
  { faction: 'fac.halcyon', add: 5 },
  {
    buff: {
      id: 'founder_pride',
      name: 'Founder',
      desc: 'You built something that doesn\'t sell anyone. Hard days feel lighter.',
      days: 730,
      mods: [
        { key: 'stress.relief', mult: 1.1 },
        { key: 'mood.daily', add: 0.5 },
      ],
    },
  },
]

export default defineContent({
  traits: [
    {
      id: 'pkg09_legit_blackballed',
      name: 'Blackballed',
      desc: 'You threatened Marcus Vale on his own boat, and lost. Every legit hiring manager in Port Lumen has heard a version of the story since, and in every version you are the one holding the knife.',
      scar: true,
      bad: true,
      mods: [
        { key: 'pay', mult: 0.95 },
        { key: 'check.business', add: -1 },
      ],
    },
  ],

  quests: [
    // ── Step 5: Golden Handcuffs ────────────────────────────────────────────
    {
      id: 'fac_halcyon_q5_handcuffs',
      title: 'Golden Handcuffs',
      kind: 'faction',
      act: 4,
      faction: 'fac.halcyon',
      giver: 'vale',
      priority: 30,
      summary:
        'Marcus Vale has one last offer. It is the best offer anyone will ever make you, and it comes with a key to a room you have spent years trying not to stand in.',
      rewards: 'A seat at the table — or the door',
      autoStart: {
        all: [
          { var: 'act', eq: 4 },
          { quest: 'fac_halcyon_q4_crash', status: 'completed' },
          { not: { flag: 'a3.whistleblow_prepped' } },
          { not: { flag: 'w.halcyon_state', eq: 'dead' } },
        ],
      },
      start: 'offer',
      stages: {
        offer: {
          text: [
            'Vale wants to see you on his boat. Not in the office. On the boat.',
            { if: valeCameClean, text: 'He cut Aperture loose, and Halcyon lived through it. What he wants now, you honestly can\'t guess.', else: 'His phone keeps buzzing with a contact saved only as "V.K." He keeps not answering it.' },
          ],
          onEnter: [{ scene: 'hal_handcuffs', delayHours: 24 * 14 }],
          objectives: [
            {
              id: 'decided',
              text: 'Hear Vale\'s offer',
              when: { flag: 'fac.halcyon.handcuffs_decided' },
              hint: 'Wait for the invitation to the Yacht Club, then answer the dialog. Ascending needs Halcyon rep 60; walking out needs Priya still in your corner.',
            },
          ],
        },
      },
    },

    // ── Step 6: Founders (Halcyon's final; the E10 path) ────────────────────
    {
      id: 'fac_halcyon_q6_founders',
      title: 'Vesting',
      kind: 'faction',
      act: 4,
      faction: 'fac.halcyon',
      giver: 'priya',
      priority: 30,
      summary:
        'Two engineers, one kitchen table, one rule. Build something that doesn\'t sell anyone. It turns out to be the hardest thing either of you has ever tried.',
      rewards: 'A company of your own',
      autoStart: {
        all: [
          { var: 'act', eq: 4 },
          { flag: 'w.halcyon_state', eq: 'dead' },
          { quest: 'fac_halcyon_q2_ship_it', status: 'completed' },
          { quest: 'fac_halcyon_q5_handcuffs', status: 'inactive' },
          priyaAvailable,
        ],
      },
      start: 'table',
      stages: {
        table: {
          text: [
            { if: { flag: 'fac.halcyon.founder_walk' }, text: 'You walked off Marcus Vale\'s boat and into Priya\'s kitchen. There is a legal pad on the table with one line written on it.', else: 'Halcyon is being sold for parts. Priya is at the liquidation with a plan and a bucket.' },
          ],
          onEnter: [
            {
              if: { flag: 'fac.halcyon.founder_walk' },
              then: [{ scene: 'hal_founders_table', delayHours: 24 * 3 }],
              else: [{ scene: 'hal_founders_wake' }],
            },
          ],
          objectives: [
            {
              id: 'founded',
              text: 'Found the company',
              when: { flag: 'fac.halcyon.founded' },
              hint: 'Sit down at Priya\'s kitchen table and answer the dialog. Naming things is the second hardest problem in computing.',
            },
          ],
          next: 'seed',
        },
        seed: {
          text: '{flag:fac.halcyon.startup_name} exists on paper. Paper, as Priya likes to say, burns. You need seed money that doesn\'t come with somebody else\'s hand inside it.',
          onEnter: [{ scene: 'hal_founders_seed', delayHours: 24 * 10 }],
          objectives: [
            {
              id: 'seeded',
              text: 'Raise the seed money',
              when: { flag: 'fac.halcyon.seeded' },
              hint: 'Answer the seed-money dialog. Savings, a Business pitch, or the Row (Neighborhood 50) all work. One offer is too easy. It is always the easy one.',
            },
          ],
          next: 'launch',
        },
        launch: {
          text: 'A month of eighteen-hour days in a rented room over the Cathode. Version one ships the night the lease runs out, because of course it does.',
          onEnter: [{ scene: 'hal_founders_launch', delayHours: 24 * 30 }],
          objectives: [
            {
              id: 'launched',
              text: 'Launch version one',
              when: { flag: 'end.clean_startup' },
              hint: 'Answer the launch-night dialog. Whatever the servers do, the company is real the moment the first stranger pays you.',
            },
          ],
        },
      },
    },
  ],

  scenes: [
    // ── Vale's last offer ───────────────────────────────────────────────────
    {
      id: 'hal_handcuffs',
      channel: 'dialog',
      title: 'Golden Handcuffs',
      start: 'boat',
      nodes: {
        boat: {
          speaker: 'narrator',
          text: [
            'The Lumen Sound Yacht Club at dusk: gray water, gray sky, and Vale\'s boat, which is named MOONSHOT in letters you can read from the parking lot. He meets you on the dock in the turtleneck, back from wherever it went during the bad year.',
            { if: isClean, text: 'Halcyon is smaller now, and honest, and pays its bills. The stock is dull. Vale looks ten years older and, somehow, lighter.' },
            { if: { flag: 'w.halcyon_state', eq: 'crashed' }, text: 'Halcyon is a husk with a logo. Vale has bought most of it back for pennies with money he won\'t describe. "Lazarus," he says, and grins, and you realize he read your server logs from ship night years ago.' },
            { if: { flag: 'w.halcyon_state', eq: 'wobble' }, text: 'Halcyon survived the scandal, bruised. The stock has crawled back to half of what it was. Vale talks about it like a man describing a war he won.' },
            { if: { flag: 'fac.halcyon.walked_at_crash' }, text: '"You walked out on me," he says, pouring two glasses. "I respected it. I also never forgot it."' },
            { if: { all: [{ flag: 'fac.halcyon.plan_coaster' }, { flag: 'w.halcyon_state', eq: 'crashed' }] }, text: 'In the cabin, in a cheap frame above the chart table, is a coffee-ringed printout you recognize: your restructuring plan, the one the board used as a coaster. "Page four," Vale says, following your eyes. "Page four would have saved us. I look at it every morning."' },
            { if: { flag: 'fac.halcyon.pushed_vale' }, text: '"You asked me for eight thousand options in your first review," he says. "In the Fishbowl, in front of Priya. I said no. I\'ve thought about that more than you\'d guess."' },
          ],
          next: 'offer',
        },
        offer: {
          speaker: 'vale',
          text: [
            '"Partner." He lets the word sit. "A board seat. One percent. A title you pick. Your name next to mine on the next magazine cover."',
            { if: valeCameClean, text: '"The company\'s clean now. You know what that cost. I want people at the table who\'ll keep it that way — and who can still make it grow."', else: '"All I ask is what I\'ve always asked. Our shy friends stay happy. Lumen Sound stays a line on a slide. You keep being someone who notices things — and who knows what not to say about them."' },
            { if: { not: valeCameClean }, text: 'His phone buzzes on the table. V.K. He turns it face down without looking.' },
            { if: { all: [{ not: valeCameClean }, { flag: 'fac.halcyon.moonlight_file' }] }, text: '"And don\'t look so worried about your nights. I know about your nights. I\'ve always known." He smiles. "Why do you think you\'re on this boat? A man who keeps secrets in two directions is exactly the kind of man a table needs."' },
          ],
          choices: [
            {
              text: '"Partner." Take the seat.',
              req: { faction: 'fac.halcyon', gte: 60 },
              reqText: 'Requires Halcyon rep 60 — he only offers the table to people he trusts',
              effects: [
                { flag: 'fac.halcyon.made_partner' },
                { npc: 'vale', fate: 'patron' },
                { faction: 'fac.halcyon', add: 20 },
                { money: 25000 },
                { buff: { id: 'halcyon_partner_draw', name: 'Partner\'s Draw', desc: 'A partner\'s cut of Halcyon, paid with your salary.', days: 1000, mods: [{ key: 'pay', mult: 1.25 }] } },
                { if: { flag: 'w.halcyon_state', eq: 'crashed' }, then: [{ flag: 'w.halcyon_state', set: 'wobble' }] },
                { if: { not: valeCameClean }, then: [{ var: 'w.enclosure', add: 1 }, { faction: 'fac.hood', add: -5 }, { npc: 'priya', affinity: -8 }] },
              ],
              goto: 'ascend',
            },
            {
              text: '"Cut Aperture loose, Marcus. Tonight. Or I walk and take the ledger with me."',
              if: { not: valeCameClean },
              check: { skill: 'business', dc: 20, bonuses: REFORM_BONUSES, success: 'reform_win', fail: 'reform_fail', successEffects: REFORM_WIN, failEffects: REFORM_FAIL },
            },
            {
              text: '"You told me once you\'re selling a feeling. Sell yourself one: what it feels like to be clean."',
              if: { not: valeCameClean },
              check: { skill: 'social', dc: 20, bonuses: REFORM_BONUSES, success: 'reform_win', fail: 'reform_fail', successEffects: REFORM_WIN, failEffects: REFORM_FAIL },
            },
            {
              text: 'Say nothing. Tomorrow, hand the ledger to the Lumen Ledger.',
              tag: '[Detonate]',
              if: { not: valeCameClean },
              req: { any: [{ flag: 'a2.building_a_case' }, { var: 'evidence_fragments', gte: 1 }] },
              reqText: 'Requires something to detonate: the audit ledger, or other evidence',
              goto: 'detonate',
            },
            {
              text: '"No. I\'m walking — and I\'m taking Priya with me. We\'re going to build something clean."',
              req: priyaAvailable,
              reqText: 'Requires Priya still in your corner (affinity 30+, still in Port Lumen)',
              effects: [{ flag: 'fac.halcyon.founder_walk' }, { flag: 'fac.halcyon.founder_in' }, ...LEAVE_HALCYON],
              goto: 'walk',
            },
            { text: '"Thank you. But I like my job. I\'d like to keep liking it."', effects: [{ faction: 'fac.halcyon', add: 2 }], goto: 'decline' },
          ],
        },
        ascend: {
          speaker: 'vale',
          text: [
            'He clinks his glass against yours so hard they both ring. "Partner." He says it the way other men say "son."',
            { if: valeCameClean, text: 'The company you help run is honest and small and growing. It is also, from this chair, astonishingly easy to protect the people you love. A word to the right person and Kim\'s internship happens. A call and Jax\'s record goes quiet at a background check. This is what power is, it turns out: other people\'s problems, solved by lunch.', else: 'From this chair, it is astonishingly easy to protect the people you love. A word and Kim\'s internship happens. A call and a friend\'s record goes quiet at a background check. You don\'t ask what V.K. gets in return. You notice that you have stopped noticing.' },
          ],
          effects: [{ flag: 'fac.halcyon.handcuffs_decided' }],
        },
        reform_win: {
          speaker: 'vale',
          text: [
            'Vale is quiet for a long time. The boat creaks. Out on the Sound, a buoy bell rings, once, like the one he rang on IPO day.',
            '"Do you know what she\'ll do?" he says finally. You both know who "she" is. "She\'ll smile, and say she understands, and she will mean it. That\'s the worst part." He picks up the phone. He turns it face up. He calls V.K., and while it rings he says, not to you, "Moonshot."',
            'Halcyon announces the end of its "strategic data partnership" the next morning. The stock drops eleven percent and then, weirdly, starts to climb.',
          ],
          effects: [{ flag: 'fac.halcyon.handcuffs_decided' }],
        },
        reform_fail: {
          speaker: 'vale',
          text: [
            '"No." It is the first time you\'ve ever heard him say the word without a smile around it. "You don\'t get to threaten me on my own boat. I made you."',
            'The offer is gone. The warmth is gone. What\'s left is a man in a turtleneck and a phone buzzing face down on the table. He turns it over, finally, and reads something on it, and you watch him decide what you are now.',
            '"Marcus Vale knows everyone in this city who has ever hired anyone," he says pleasantly, as if reading you a weather report. "By Monday, so will you."',
          ],
          choices: [
            {
              text: 'Then burn it. Hand the ledger to the Lumen Ledger tomorrow.',
              tag: '[Detonate]',
              req: { any: [{ flag: 'a2.building_a_case' }, { var: 'evidence_fragments', gte: 1 }] },
              reqText: 'Requires something to detonate: the audit ledger, or other evidence',
              goto: 'detonate',
            },
            {
              text: '"Then I\'m walking. With Priya."',
              req: priyaAvailable,
              reqText: 'Requires Priya still in your corner (affinity 30+, still in Port Lumen)',
              effects: [{ flag: 'fac.halcyon.founder_walk' }, { flag: 'fac.halcyon.founder_in' }, ...LEAVE_HALCYON],
              goto: 'walk',
            },
            { text: 'Put the glass down and leave. Let him keep his boat.', goto: 'decline' },
          ],
        },
        detonate: {
          speaker: 'narrator',
          text: [
            'The Lumen Ledger\'s tech reporter, June Albescu, meets you at the Cathode at 6 a.m., because reporters and diners are the only things in this city awake at 6 a.m. You slide the folded pages across the table. Lumen Sound Holdings. Four thousand seats nobody uses. Every Beacon customer\'s org chart, going somewhere at 3 a.m. every night for years.',
            'She reads them twice. "If I run this, they will want to know where it came from."',
          ],
          choices: [
            {
              text: 'Make sure it comes from nowhere. Paper trail, timing, the whole thing — clean.',
              check: {
                skill: 'opsec',
                dc: 18,
                bonuses: [{ if: { flag: 'fac.halcyon.vale_enemy' }, add: -2, label: '-2 Vale is already watching for this' }],
                success: 'detonate_ghost',
                fail: 'detonate_traced',
                successEffects: [...DETONATE_CORE, { faction: 'fac.halcyon', add: -25 }],
                failEffects: [
                  ...DETONATE_CORE,
                  { faction: 'fac.halcyon', add: -40 },
                  { stat: 'heat', add: 15 },
                  { flag: 'fac.halcyon.named_by_aperture' },
                  { obligation: { id: APERTURE_SUIT, label: 'Legal defense: Aperture Data Solutions v. you', perDay: 40, days: 150 } },
                  { scene: 'hal_aperture_letter', delayHours: 24 * 6 },
                ],
              },
            },
            {
              text: '"Put my name on it."',
              tag: '[On the record]',
              effects: [...DETONATE_CORE, { faction: 'fac.halcyon', add: -40 }, { faction: 'fac.hood', add: 5 }, { stat: 'heat', add: 8 }],
              goto: 'detonate_named',
            },
          ],
        },
        detonate_ghost: {
          speaker: 'narrator',
          text: [
            '"HALCYON\'S SHY CUSTOMER" runs above the fold two days later, sourced to "documents reviewed by the Ledger." Nobody can say where they came from. Vale holds a press conference on the dock and cries, beautifully, on camera. The boat is repossessed within the month.',
            'You watch it on the TV over the Cathode counter. Sal refills your coffee without asking and says, "Friend of yours?" and you say "used to be," and he says "those are the worst kind," and he\'s right.',
          ],
          effects: [{ flag: 'fac.halcyon.handcuffs_decided' }],
        },
        detonate_traced: {
          speaker: 'narrator',
          text: [
            'The story runs, and it lands like a bomb — and by the afternoon, three people at Halcyon have worked out exactly whose badge pulled those exports during the audit. Your phone rings until you unplug it. Aperture\'s lawyers send a letter so polite it reads like a threat in a nice font, and then a second one, less polite, with a docket number on it. You hire the cheapest lawyer in the Yellow Pages who doesn\'t also do divorces. He bills by the quarter-hour. He rounds up.',
            'Vale calls once. You let it ring. His voicemail is eleven seconds of silence and then, very quietly, "I made you." You delete it. You don\'t delete it. You delete it.',
          ],
          effects: [{ flag: 'fac.halcyon.handcuffs_decided' }],
        },
        detonate_named: {
          speaker: 'narrator',
          text: [
            'June Albescu runs it with your name in the second paragraph. It is the bravest thing you\'ve ever done and it feels like stepping off a roof.',
            'Your mailbox fills with hate and gratitude in roughly equal measure. Ruth Alvarez, of all people, mails you a card that just says "GOOD FOR YOU" in shaky capitals and a twenty-dollar bill "for lunch." You frame the card. You spend the twenty on lunch, because she\'d check.',
          ],
          effects: [{ flag: 'fac.halcyon.handcuffs_decided' }],
        },
        walk: {
          speaker: 'vale',
          text: [
            'Vale laughs, and for once it sounds real. "Priya. Of course Priya. She\'s been trying to leave since the day I hired her." He raises his glass to you anyway. "Nobody walks away from a table like this."',
            '"Watch me," you say, and you do, down the dock, past the gulls, out to the parking lot where your car is parked next to a boat you will never think about owning again. You call Priya from the payphone by the gate. She picks up on the first ring. "Well?" she says. "Kitchen table," you say. "Tomorrow." She hangs up without saying goodbye, which is how you know she\'s crying.',
          ],
          effects: [{ flag: 'fac.halcyon.handcuffs_decided' }, { quest: 'fac_halcyon_q6_founders', start: true }],
        },
        decline: {
          speaker: 'vale',
          text: '"You like your job." He says it like a diagnosis. Then he shrugs, and pours himself another, and looks out at the Sound. "Maybe you\'re the smartest one of all of us. Get off my boat before I talk you into something."',
          effects: [{ flag: 'fac.halcyon.handcuffs_decided' }],
        },
      },
    },

    // ── Detonation traced: Aperture sues the source ─────────────────────────
    {
      id: 'hal_aperture_letter',
      channel: 'mail',
      title: 'Aperture Data Solutions — Notice of Claim',
      from: 'Whitcombe & Vey LLP',
      pause: true,
      start: 'claim',
      nodes: {
        claim: {
          text: [
            'Dear {name},',
            'This firm represents Aperture Data Solutions, Inc. Our client has reason to believe that you removed confidential commercial records from the premises of Halcyon Systems and caused them to be published, to our client\'s considerable and continuing injury.',
            'Our client is prepared to resolve this matter without further expense to either party upon (1) your execution of the enclosed Non-Disparagement Agreement and (2) reimbursement of costs in the amount of $2,500. Absent a reply, we will proceed, and we are, as you may imagine, very patient.',
            'Sincerely,\nT. Pruitt, for Whitcombe & Vey LLP\nHarbor Point',
            'Stapled to the back, on a yellow sticky note, from your lawyer: "They will bleed you by the quarter-hour until you blink. Just so you know what you\'re paying me to watch. — L. Dworkin, Esq."',
          ],
          choices: [
            {
              text: 'Sign their agreement and pay the "costs." Buy the silence back.',
              tag: '[Pay $2,500]',
              req: { stat: 'money', gte: 2500 },
              reqText: 'Requires $2,500',
              effects: [{ money: -2500 }, { removeObligation: APERTURE_SUIT }, { flag: 'fac.halcyon.settled_aperture' }, { faction: 'fac.aperture', add: 5 }, { stat: 'stress', add: -5 }],
              goto: 'settled',
            },
            {
              text: 'Call June Albescu. The Ledger has lawyers, and its lawyers enjoy this sort of thing.',
              check: {
                skill: 'social',
                dc: 16,
                bonuses: [
                  { if: { faction: 'fac.hood', gte: 30 }, add: 2, label: '+2 the Row is writing letters to the editor' },
                  { if: { var: 'evidence_fragments', gte: 2 }, add: 2, label: '+2 you can prove every word' },
                ],
                success: 'ledger_yes',
                fail: 'ledger_no',
                successEffects: [{ removeObligation: APERTURE_SUIT }, { flag: 'fac.halcyon.ledger_lawyer' }, { faction: 'fac.hood', add: 3 }, { var: 'w.public_opinion', add: 2 }],
                failEffects: [
                  { obligation: { id: APERTURE_SUIT, label: 'Legal defense: Aperture Data Solutions v. you (amended)', perDay: 55, days: 150 } },
                  { stat: 'stress', add: 8 },
                  { complication: 'legal' },
                ],
              },
            },
            {
              text: 'Countersue. You have the ledger pages, and more besides.',
              tag: '[Evidence]',
              req: { var: 'evidence_fragments', gte: 2 },
              reqText: 'Requires at least two pieces of evidence',
              effects: [{ removeObligation: APERTURE_SUIT }, { flag: 'fac.halcyon.countersued' }, { var: 'w.exposure', add: 1 }, { faction: 'fac.aperture', add: -10 }, { stat: 'heat', add: 6 }],
              goto: 'countersued',
            },
            { text: 'Let Dworkin bill. You\'ll fight it the slow way, a quarter-hour at a time.', effects: [{ stat: 'stress', add: 4 }], goto: 'slow' },
          ],
        },
        settled: {
          text: 'The signed agreement goes back by courier. The reply comes the same afternoon, one line on heavy cream paper: "Our client thanks you for your discretion." Discretion. You have heard that word before, from Hollis, printed on the side of a very expensive pen. You never say Aperture\'s name out loud again. You notice, after a while, that you don\'t want to.',
        },
        ledger_yes: {
          text: [
            'June Albescu calls back in an hour. "Our general counsel read the complaint and laughed so hard he had to take his glasses off. He says, and I quote, \'Oh, I hope they try.\'"',
            'The Ledger\'s lawyers answer Whitcombe & Vey with a nineteen-page letter that uses the word "frivolous" eleven times. Aperture withdraws the claim within the month. June runs a short item about it on page two. The Row clips it.',
          ],
        },
        ledger_no: {
          text: [
            'June calls back in an hour, and you can hear the answer in how she says hello. "Counsel says the paper defends the paper. It doesn\'t defend the source. I\'m so sorry. I fought for it."',
            'Whitcombe & Vey smell blood through the phone line. The amended complaint arrives Thursday: more counts, more pages, and a second partner\'s name on the letterhead. Dworkin\'s invoices get thicker. So does the feeling that someone is standing outside your building at night, taking notes.',
          ],
        },
        countersued: {
          text: 'Dworkin files your countersuit on a Friday afternoon, "because nobody at a big firm reads anything on a Friday afternoon." On Monday, Whitcombe & Vey request a thirty-day extension. On day twenty-nine, Aperture drops the whole thing without comment. Discovery, it turns out, is a word that frightens people with a great deal to discover.',
        },
        slow: {
          text: 'You file the letter in a shoebox. The shoebox fills. Dworkin bills by the quarter-hour and rounds up, and every month the invoice arrives on the same day as the rent, like a second landlord who never fixes anything.',
        },
      },
    },

    // ── Dead-route opening: the liquidation ─────────────────────────────────
    {
      id: 'hal_founders_wake',
      channel: 'dialog',
      title: 'Everything Must Go',
      start: 'auction',
      nodes: {
        auction: {
          speaker: 'narrator',
          text: [
            'Halcyon\'s liquidation auction, the fourth floor, a Tuesday. Men with clipboards are selling the four-hundred-dollar mesh chairs in lots of twelve. Somebody buys the SHIP IT banner for four dollars. The foosball table goes to a dentist.',
            'Priya is standing by the koi pond with a plastic bucket. "Lot 214," she says, without turning around. "Gerald. I bid nine dollars. Nobody else wanted him." Gerald regards you from the bucket with profound disappointment.',
          ],
          next: 'pitch',
        },
        pitch: {
          speaker: 'priya',
          text: [
            '"I\'ve been thinking about what we could have built, if the thing we built hadn\'t been a front door for somebody else." She shifts the bucket to her other hip. "Something small. Pays everyone on time. Doesn\'t sell anyone. One rule."',
            '"I don\'t want to do it with anyone else. That\'s the pitch. It\'s a bad pitch. I\'m an engineer."',
          ],
          choices: [
            { text: '"It\'s the best pitch I\'ve ever heard. I\'m in."', effects: [{ flag: 'fac.halcyon.founder_in' }, { npc: 'priya', affinity: 5 }, { scene: 'hal_founders_table', delayHours: 24 * 2 }], goto: 'in' },
            { text: '"I can\'t, Priya. Not again. Not now."', goto: 'out' },
          ],
        },
        in: {
          speaker: 'priya',
          text: '"Good." She hands you the bucket. "You\'re carrying Gerald. Kitchen table, Thursday. Bring a legal pad. Bring two." She walks out past the men with clipboards like a woman leaving a funeral early to go to a wedding.',
        },
        out: {
          speaker: 'priya',
          text: '"Okay." She nods too many times. "Okay. It was a bad pitch." She picks up the bucket and walks out, and you stand by the empty koi pond for a long time, and a man with a clipboard asks if you\'re part of lot 215.',
          effects: [{ quest: 'fac_halcyon_q6_founders', fail: true }],
        },
      },
    },

    // ── The kitchen table ───────────────────────────────────────────────────
    {
      id: 'hal_founders_table',
      channel: 'dialog',
      title: 'Kitchen Table',
      start: 'table',
      nodes: {
        table: {
          speaker: 'narrator',
          text: [
            'Priya\'s kitchen, Millgate, 9 p.m. Two legal pads, a pot of terrible coffee, and a whiteboard propped against the fridge.',
            { if: { quest: 'fac_halcyon_q5_handcuffs', status: 'completed' }, text: 'At the top of the whiteboard, in Priya\'s handwriting: RULE ONE: WE DON\'T SELL ANYONE.', else: 'Gerald is in a new tank on the counter, glowering. At the top of the whiteboard, in Priya\'s handwriting: RULE ONE: WE DON\'T SELL ANYONE.' },
            '"Everything else is negotiable," she says. "Starting with the name. I\'ve been calling it \'the thing\' for a week and I hate it."',
          ],
          choices: [
            { text: '"Rule Two Software. Because you are, in fact, a person who bought a machine."', effects: [{ flag: 'fac.halcyon.startup_name', set: 'Rule Two Software' }], goto: 'named' },
            { text: '"Lighthouse. Something you steer by in the fog."', effects: [{ flag: 'fac.halcyon.startup_name', set: 'Lighthouse Systems' }], goto: 'named' },
            { text: '"Gerald Labs."', effects: [{ flag: 'fac.halcyon.startup_name', set: 'Gerald Labs' }], goto: 'named_gerald' },
            { text: '"Cannery Code. Named after where we come from."', effects: [{ flag: 'fac.halcyon.startup_name', set: 'Cannery Code Co.' }, { faction: 'fac.hood', add: 3 }], goto: 'named' },
          ],
        },
        named: {
          speaker: 'priya',
          text: '"{flag:fac.halcyon.startup_name}." She writes it on the whiteboard, under the rule, and steps back. "Okay. I don\'t hate it. That\'s the highest compliment I give. Now: who do we call first?"',
          next: 'hires',
        },
        named_gerald: {
          speaker: 'priya',
          text: 'Priya stares at you. Then at the fish. The fish stares at her. "Gerald Labs," she says slowly, and writes it on the whiteboard, and underlines it twice, and starts laughing so hard she has to hold the fridge. "Fine. FINE. He\'s the only one of us with investor experience. Now: who do we call first?"',
          next: 'hires',
        },
        hires: {
          speaker: 'priya',
          text: [
            '"We can afford one person. Maybe. If they\'ll take equity and soup."',
            { if: { flag: 'fac.halcyon.protected_team' }, text: 'Before you can answer, her phone rings. Then yours. Then hers again. Word travels. Half your old third floor — the ones you and Dee walked out with severance and references — want to know if it\'s true.' },
          ],
          choices: [
            {
              text: 'Call Dee. Nobody else could run an office on equity and soup.',
              if: { all: [{ npc: 'dee', met: true }, { not: { flag: 'npc.dee.council' } }] },
              effects: [{ flag: 'fac.halcyon.founders_dee' }, { npc: 'dee', affinity: 5 }],
              goto: 'dee',
            },
            {
              text: 'Call Wes Tran. Somebody has to keep the servers breathing.',
              if: { npc: 'northlink_wes', met: true },
              effects: [{ flag: 'fac.halcyon.founders_wes' }, { npc: 'northlink_wes', affinity: 5 }],
              goto: 'wes',
            },
            {
              text: 'Take the calls from the old third floor. All of them.',
              if: { flag: 'fac.halcyon.protected_team' },
              effects: [{ flag: 'fac.halcyon.founders_team' }, { faction: 'fac.hood', add: 3 }],
              goto: 'team',
            },
            { text: '"Nobody yet. Just us. Let\'s see if we like each other at 4 a.m."', goto: 'just_us' },
          ],
        },
        dee: {
          speaker: 'dee',
          text: [
            'Dee answers on the second ring. You explain. There is a long pause.',
            { if: { flag: 'npc.dee.promoted' }, text: '"I was a CHIEF OPERATING OFFICER, sweetheart. I had a door." Another pause. "The door was overrated. I\'ll bring the label maker."', else: '"Equity," she repeats. "And soup." Another pause. "I have been waiting my entire life for somebody to offer me equity and soup. I\'ll bring the label maker."' },
          ],
          next: 'founded',
        },
        wes: {
          speaker: 'northlink_wes',
          text: [
            { if: { flag: 'fac.northlink.wes_burned' }, text: 'Wes lets it ring a long time. "You got me a man with a screwdriver standing behind me for a week, man. Redoing your wiring while my VP watched." A long breath, and the space heater ticking. "...A clean shop, though. No boxes I\'m not allowed to open." Another breath. "Okay. I\'m in. But I check your wiring. All of it. Forever."' },
            {
              if: { all: [{ not: { flag: 'fac.northlink.wes_burned' } }, { flag: 'npc.northlink_wes.joined_you' }] },
              text: '"Man, I already quit for you once," Wes says. "What\'s once more?" You can hear the space heater in the background. He brought it with him.',
            },
            {
              if: { all: [{ not: { flag: 'fac.northlink.wes_burned' } }, { not: { flag: 'npc.northlink_wes.joined_you' } }] },
              text: '"A clean shop," Wes says slowly. "No boxes in the rack I\'m not allowed to open." You can hear him thinking. "I just run the pipe, man. But I\'d like to run a pipe I\'m proud of." He\'s in.',
            },
          ],
          next: 'founded',
        },
        team: {
          speaker: 'narrator',
          text: 'By midnight there are nine people in Priya\'s kitchen and two on the fire escape. Lorena from QA brought her own chair. Somebody brought a whiteboard marker that actually works, which gets a round of applause. Nobody is being paid. Everybody is laughing. Priya looks at you over the crowd like she\'s watching something grow back after a fire.',
          next: 'founded',
        },
        just_us: {
          speaker: 'priya',
          text: '"Just us." She pours two more cups of the terrible coffee. "Good. I\'ve never started anything with someone I trusted before. I want to see what it feels like." It feels, at 4 a.m., a lot like being eighteen and awake with a modem, except this time you know exactly what you\'re building.',
          next: 'founded',
        },
        founded: {
          speaker: 'narrator',
          text: 'At 2 a.m. you file the incorporation papers on Priya\'s ancient fax machine. It screams the whole way through, the old handshake song, and neither of you says anything, and then you both do: "That\'s the sound." It is. It\'s the sound of something starting.',
          effects: [{ flag: 'fac.halcyon.founded' }],
        },
      },
    },

    // ── Seed money ──────────────────────────────────────────────────────────
    {
      id: 'hal_founders_seed',
      channel: 'dialog',
      title: 'Seed',
      start: 'money',
      nodes: {
        money: {
          speaker: 'priya',
          text: [
            '"We need fifteen thousand to get through version one. Servers, a room, soup." Priya taps the legal pad. "I\'ve got some. Not enough."',
            'That afternoon a courier brings a term sheet from Sound Harbor Ventures, an investor neither of you has ever pitched. Two hundred and fifty thousand dollars. Generous terms. A board observer seat. The fax cover sheet is on heavy cream paper.',
            { if: { flag: 'a2.building_a_case' }, text: 'You know the address on the letterhead. It\'s the same Harbor Point law office that registered Lumen Sound Holdings.' },
          ],
          choices: [
            {
              text: 'Bootstrap it. Put in fifteen thousand of your own.',
              req: { stat: 'money', gte: 15000 },
              reqText: 'Requires $15,000 on hand',
              effects: [{ money: -15000 }, { flag: 'fac.halcyon.seeded' }, { flag: 'fac.halcyon.bootstrapped' }, { npc: 'priya', affinity: 3 }],
              goto: 'bootstrap',
            },
            {
              text: 'Pitch clean money: the Harbor Point credit union, a retired shipping heiress who loathes Marcus Vale.',
              check: {
                skill: 'business',
                dc: 18,
                bonuses: [
                  { if: { flag: 'fac.halcyon.made_partner' }, add: 2, label: '+2 you know how Vale pitched' },
                  { if: { course: 'course_bootstrapping' }, add: 2, label: '+2 Bootstrapping course' },
                  { if: { trait: 'pkg09_legit_blackballed' }, add: -2, label: '-2 Vale has been making calls' },
                ],
                success: 'angels',
                fail: 'half',
                successEffects: [{ flag: 'fac.halcyon.seeded' }, { faction: 'fac.halcyon', add: 5 }],
                failEffects: [{ flag: 'fac.halcyon.seeded' }, { flag: 'fac.halcyon.priya_mortgaged' }, { stat: 'stress', add: 10 }, { npc: 'priya', affinity: 5 }],
              },
            },
            {
              text: 'Ask the Row. Sal, Marge, the church investment club, your parents\' neighbors.',
              req: { faction: 'fac.hood', gte: 50 },
              reqText: 'Requires the Neighborhood at Trusted (50)',
              effects: [{ flag: 'fac.halcyon.seeded' }, { flag: 'fac.halcyon.row_funded' }, { faction: 'fac.hood', add: 5 }, { var: 'w.hood_soul', add: 1 }],
              goto: 'row',
            },
            {
              text: 'Sign the Sound Harbor term sheet. Don\'t tell Priya where it came from.',
              tag: '[Easy money]',
              if: { not: { flag: 'w.aperture_state', eq: 'destroyed' } },
              effects: [{ flag: 'fac.halcyon.seeded' }, { flag: 'fac.halcyon.aperture_seed' }, { var: 'w.enclosure', add: 1 }, { faction: 'fac.aperture', add: 10 }],
              goto: 'dirty',
            },
          ],
        },
        bootstrap: {
          speaker: 'priya',
          text: 'You write the check at her kitchen table. Priya looks at it for a long time, then puts it on the fridge under a magnet shaped like a lighthouse. "We\'re not cashing that until Monday," she says. "I want to look at it all weekend. Nobody has ever bet on me with their own money before."',
        },
        angels: {
          speaker: 'narrator',
          text: [
            'The credit union loan officer is a woman named Pearl who has been waiting eleven years for someone to walk in with a business plan that doesn\'t include the word "synergy." The shipping heiress, Mrs. Ondine Farrow, is ninety-one and asks exactly one question: "Is Marcus Vale involved?" You say no. She writes the check before you finish the word.',
            'Fifteen thousand, clean, from people who will never ask you for anything except to answer the phone when they call.',
          ],
        },
        half: {
          speaker: 'narrator',
          text: [
            'Pearl at the credit union likes you and can do seven thousand, not fifteen. Mrs. Farrow falls asleep during your pitch, wakes up, and asks if you know Marcus Vale. You worked for him. The meeting ends there.',
            { if: { trait: 'pkg09_legit_blackballed' }, text: 'Two more meetings cancel the morning of. One of them sends flowers, which is somehow worse. Vale\'s calls got there before you did.' },
            'That night Priya remortgages her condo without telling you until it\'s done. "Don\'t," she says, when you open your mouth. "Rule one. We don\'t sell anyone. I didn\'t say anything about me."',
          ],
          choices: [
            {
              text: '"Then put my name on half of it. We don\'t sell anyone, and we don\'t let anyone carry it alone."',
              effects: [
                { obligation: { id: 'pkg09_priya_condo', label: 'Half of Priya\'s second mortgage', perDay: 14, days: 360 } },
                { flag: 'fac.halcyon.split_mortgage' },
                { npc: 'priya', affinity: 6 },
              ],
              goto: 'half_split',
            },
            {
              text: 'Say nothing. She said don\'t. Build something worth the risk she took.',
              effects: [{ stat: 'stress', add: 6 }],
              goto: 'half_hers',
            },
          ],
        },
        half_split: {
          speaker: 'priya',
          text: 'She looks at you for a long time. Then she gets the loan papers out of a kitchen drawer, where she has apparently been keeping them next to the takeout menus, and slides them across the table. "Page six," she says. "Initial every line. If this company dies, it dies owing the bank, not me." Her voice does something on "me." You initial every line.',
        },
        half_hers: {
          speaker: 'narrator',
          text: 'You don\'t argue. She wouldn\'t let you win. But on your way out you see the mortgage statement on her fridge, under the lighthouse magnet where your check would have gone, and you understand that she is going to look at it every morning before she looks at the server logs. Now so are you.',
        },
        row: {
          speaker: 'narrator',
          text: [
            'Sal puts a pickle jar on the Cathode counter with a hand-lettered sign: THE KID\'S COMPANY. By Sunday it holds nine thousand dollars in small bills, a savings bond from 1971 and an IOU from Marge Osgood for "one wiring diagram, on demand."',
            'The church investment club, eleven women in their seventies, votes to buy in after a two-hour meeting that is mostly about pie. Your mother\'s neighbor puts in forty dollars and asks for a share certificate "so I can show my grandson." You print it at the library. It\'s the best document you\'ve ever made.',
          ],
        },
        dirty: {
          speaker: 'narrator',
          text: [
            'You sign it at the post office, alone, and fax it back from the counter. The money lands the next morning. Priya is so happy she forgets to ask where it came from, and you let her forget.',
            'The board observer never comes to a single meeting. He doesn\'t have to. Every quarter a report goes to a Harbor Point law office, cc a set of initials you know. The company is clean. The money isn\'t. You decide those can be two different things. You will spend years deciding it again.',
          ],
        },
      },
    },

    // ── Launch night ────────────────────────────────────────────────────────
    {
      id: 'hal_founders_launch',
      channel: 'dialog',
      title: 'Version One',
      start: 'room',
      nodes: {
        room: {
          speaker: 'narrator',
          text: [
            'A rented room over the Cathode, 11:40 p.m. The lease runs out at midnight, because of course it does. Sal has sent up pie. The radiator knocks like it wants in on the launch.',
            '{flag:fac.halcyon.startup_name} version one is small: project management for small shops, the kind of places Beacon never bothered to sell to. The Row\'s plumber. The florist on Millgate. A food bank. It stores their data on your servers, and nowhere else, ever. That\'s the whole pitch.',
            { if: { flag: 'fac.halcyon.founders_dee' }, text: 'Dee has labeled every cable in the room. The labels are color-coded. There is a legend. It is laminated.' },
            { if: { flag: 'fac.halcyon.founders_wes' }, text: 'Wes has his space heater plugged into the one outlet that isn\'t running a server, and a headset on, even though nobody is calling. Yet.' },
            { if: { flag: 'fac.halcyon.founders_team' }, text: 'Nine people are crammed around four desks. Lorena from QA has found eleven bugs since dinner and is visibly thrilled about each one.' },
            'Priya looks at you. "Push the button."',
          ],
          choices: [
            {
              text: 'Push it, and ride the code through the first hour yourself.',
              check: { skill: 'programming', dc: 18, bonuses: HIRE_BONUSES, success: 'smooth', fail: 'rough' },
            },
            {
              text: 'Push it, and babysit the servers like a newborn.',
              check: { skill: 'systems', dc: 17, bonuses: HIRE_BONUSES, success: 'smooth', fail: 'rough' },
            },
            {
              text: 'Let Priya push it. You get on the phone and sell the first ten customers personally.',
              check: { skill: 'business', dc: 17, bonuses: HIRE_BONUSES, success: 'sold_out', fail: 'rough' },
            },
          ],
        },
        smooth: {
          speaker: 'narrator',
          text: [
            'It just works. That\'s the whole story, and it is so rare that for twenty minutes nobody in the room trusts it. The first customer signs up at 12:04 a.m.: the florist on Millgate, who is apparently also up at midnight, doing her books.',
            'Priya prints the signup confirmation and tapes it to the wall. Then she sits down on the floor with her back against the knocking radiator and laughs until she cries.',
          ],
          effects: LAUNCHED,
          next: 'after',
        },
        sold_out: {
          speaker: 'narrator',
          text: [
            'You work the phone like it\'s CompCastle on a Saturday. The plumber. The florist. The food bank. A daycare. Sal, who does not need project management software, buys two licenses "for the diner and for the idea." By 1 a.m. there are ten paying customers and one very tired founder with a phone-shaped dent in their ear.',
            'Priya watches the signups tick over on the monitor and doesn\'t say anything. She doesn\'t have to.',
          ],
          effects: LAUNCHED,
          next: 'after',
        },
        rough: {
          speaker: 'narrator',
          text: [
            'The servers fall over at 12:07, get back up at 12:31, fall over again at 1:15, and spend the rest of the night limping like a three-legged dog. Sal\'s pie goes cold. The radiator wins.',
            'The postmortem, at 6 a.m. on the fire escape, is short: two dead drives and a power strip older than Priya\'s car. The replacements come out of your own pocket, because the company account has eleven dollars in it and a note from Dee that says DON\'T.',
            'But in the morning there are four customers, and not one of them has left. The florist writes in: "It crashed twice and I still like it better than the big one. You answered the phone." That\'s the pitch, it turns out. You answer the phone. You don\'t sell anyone.',
          ],
          effects: [
            ...LAUNCHED,
            { flag: 'fac.halcyon.rough_launch' },
            { money: -1500 },
            { stat: 'stress', add: 10 },
            { stat: 'energy', add: -15 },
            { chance: 0.3, then: [{ complication: 'work' }] },
          ],
          next: 'after',
        },
        after: {
          speaker: 'priya',
          text: [
            'Dawn over the Lumen Sound, gray as always. Priya is on the fire escape with the last of the terrible coffee.',
            '"Rule one," she says. "We don\'t sell anyone." A long pause. "You know what I realized? That was always rule one. Everything I told you about machines and people — that was all just the commentary."',
            { if: { flag: 'fac.halcyon.aperture_seed' }, text: 'Your pager buzzes. A single line, no name: "Congratulations on the launch. — V.K." You turn it face down on the railing, the way Marcus used to. Priya doesn\'t notice. You make sure she doesn\'t notice.' },
            { if: { flag: 'fac.halcyon.row_funded' }, text: 'Down on the street, Sal is taping a newspaper clipping about the launch to the Cathode window, next to the menu. Half the Row owns a piece of you now. You\'ve never felt so owned, or so free.' },
            { if: { all: [{ flag: 'fac.halcyon.priya_mortgaged' }, { not: { flag: 'fac.halcyon.split_mortgage' } }] }, text: 'She has the mortgage statement folded in her parka pocket. You know because she touches the pocket every time the signup counter ticks over, like a woman checking that her keys are still there.' },
            { if: { flag: 'fac.halcyon.split_mortgage' }, text: 'She holds up her coffee cup. "To page six," she says. You clink. Somewhere a bank owns half of each of you, evenly, which is the most trusting thing either of you has ever signed.' },
            { if: { flag: 'fac.halcyon.rough_launch' }, text: 'Somebody (Priya denies it) has written on the whiteboard: DAYS SINCE LAST CRASH: 0. Under it, in Priya\'s hand: CUSTOMERS LOST: 0. The second number is the one she underlines.' },
          ],
        },
      },
    },
  ],
})
