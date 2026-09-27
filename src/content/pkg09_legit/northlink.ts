/**
 * PKG-09 — the NorthLink sysadmin/network ladder (bible §7.7). Wes Tran is its face.
 *
 *  - `fac_northlink_q1_logs`      — the retention request. Comply / minimize (or refuse, and learn
 *                                   that refusing isn't the same as minimizing).
 *  - `fac_northlink_q2_tap`       — the MNSA-era compliance box in rack nine. Install
 *                                   (Wes 'company_man') / leak it with Wes (Wes 'whistle', an
 *                                   evidence fragment, `w.public_opinion +`) / install it wrong.
 *  - `fac_northlink_q3_promotion` — network-engineer promotion, or exit.
 *
 * The arc starts for anyone on the sysadmin/network job tracks (PKG-18's jobs, matched by track so
 * no job ids are assumed), or for a strong networker Wes brings in as a night-shift contractor.
 * Wes's fate is written only here (PKG-09 owns `npc.northlink_wes.fate`). All "tap" talk stays
 * at story level: a sealed vendor box, a binder, a routing sheet — no technique.
 */
import { defineContent } from '@/engine/registry'
import type { Choice, Cond, Effect } from '@/engine/types'

const onTheLadder: Cond = { jobTrack: ['sysadmin', 'network'] }

const COMPLY: Effect[] = [
  { flag: 'fac.northlink.complied' },
  { faction: 'fac.halcyon', add: 5 },
  { faction: 'fac.bureau', add: 3 },
  { var: 'w.enclosure', add: 1 },
  { npc: 'northlink_wes', affinity: 2 },
  { flag: 'fac.northlink.logs_decided' },
]

const LEAK_CORE: Effect[] = [
  { flag: 'fac.northlink.tap_leaked' },
  { npc: 'northlink_wes', fate: 'whistle', affinity: 10 },
  { var: 'evidence_fragments', add: 1 },
  { var: 'w.exposure', add: 1 },
  { faction: 'fac.aperture', add: -10 },
  { flag: 'fac.northlink.tap_decided' },
]

const INSTALLED: Effect[] = [
  { flag: 'fac.northlink.tap_installed' },
  { npc: 'northlink_wes', fate: 'company_man' },
  { var: 'w.enclosure', add: 1 },
  { faction: 'fac.bureau', add: 8 },
  { faction: 'fac.aperture', add: 5 },
  { faction: 'fac.halcyon', add: 5 },
  { faction: 'fac.loft', add: -3 },
  { flag: 'fac.northlink.tap_decided' },
]

const PROMOTED: Effect[] = [
  { flag: 'fac.northlink.promoted' },
  { money: 3000 },
  { xp: 'networking', add: 300 },
  { xp: 'systems', add: 150 },
  { faction: 'fac.halcyon', add: 8 },
  { flag: 'fac.northlink.career_decided' },
]

const decideChoices: Choice[] = [
  { text: '"Fine. Keep everything, like the memo says."', effects: COMPLY, goto: 'complied' },
  {
    text: 'Satisfy the memo on paper: keep only what the law actually requires, and boil the rest down to counts that can\'t point at anybody.',
    check: {
      skill: 'systems',
      dc: 14,
      bonuses: [{ if: { flag: 'fac.northlink.knows_vendor' }, add: 2, label: '+2 you know who\'s asking' }],
      success: 'minimized',
      fail: 'minimize_broke',
      successEffects: [{ flag: 'fac.northlink.minimized' }, { faction: 'fac.hood', add: 3 }, { faction: 'fac.bureau', add: -3 }, { npc: 'northlink_wes', affinity: 5 }, { flag: 'fac.northlink.logs_decided' }],
      failEffects: [
        { flag: 'fac.northlink.minimized' },
        { flag: 'fac.northlink.partner_watching' },
        { faction: 'fac.halcyon', add: -5 },
        { npc: 'northlink_wes', affinity: 3 },
        { stat: 'stress', add: 6 },
        { chance: 0.3, then: [{ complication: 'work' }] },
        { flag: 'fac.northlink.logs_decided' },
      ],
    },
  },
  {
    text: '"Not on my shift."',
    effects: [{ flag: 'fac.northlink.complied' }, { flag: 'fac.northlink.refused' }, { npc: 'northlink_wes', affinity: -2 }, { flag: 'fac.northlink.logs_decided' }],
    goto: 'refused',
  },
]

export default defineContent({
  traits: [
    {
      id: 'pkg09_legit_person_of_interest',
      name: 'Person of Interest',
      desc: 'The rack-nine leak was traced to your shift. A federal liaison has your number and calls it sometimes, late, just to hear you answer. Your line is flagged; your heat never quite cools.',
      scar: true,
      bad: true,
      mods: [
        { key: 'heat.decay', add: -0.2 },
        { key: 'trace', mult: 0.95 },
      ],
    },
  ],

  quests: [
    // ── 1. The logs ─────────────────────────────────────────────────────────
    {
      id: 'fac_northlink_q1_logs',
      title: 'Keep Everything',
      kind: 'faction',
      act: 2,
      faction: 'fac.halcyon',
      giver: 'northlink_wes',
      priority: 15,
      summary:
        'NorthLink owns the pipes. Every modem in Port Lumen that sings its little handshake song is singing it to NorthLink. Somebody would like NorthLink to start remembering the songs.',
      rewards: 'Standing on the legit ladder, and a friend in the NOC',
      autoStart: {
        all: [
          { var: 'act', gte: 2 },
          { any: [onTheLadder, { all: [{ skill: 'networking', gte: 35 }, { skill: 'systems', gte: 25 }] }] },
        ],
      },
      start: 'night',
      stages: {
        night: {
          text: [
            { if: onTheLadder, text: 'Your rotation puts you on NorthLink\'s night shift in the network operations center, under an ops manager named Wes Tran.', else: 'NorthLink is short two people on nights since the layoff wave, and their ops manager, Wes Tran, has heard you know your way around a network. He wants you in as a contractor.' },
          ],
          onEnter: [{ scene: 'nl_night_shift', delayHours: 24 * 2 }],
          objectives: [
            {
              id: 'decided',
              text: 'Work a night shift with Wes',
              when: { flag: 'fac.northlink.logs_decided' },
              hint: 'Answer the night-shift dialog at the NorthLink NOC. There\'s a memo. There\'s always a memo.',
            },
          ],
        },
      },
    },

    // ── 2. The tap ──────────────────────────────────────────────────────────
    {
      id: 'fac_northlink_q2_tap',
      title: 'The Box in Rack Nine',
      kind: 'faction',
      act: 3,
      faction: 'fac.halcyon',
      giver: 'northlink_wes',
      priority: 20,
      summary:
        'The council is arguing about the Municipal Network Security Act. NorthLink isn\'t waiting for the vote. A crate has arrived, and Wes has to sign that it\'s installed.',
      rewards: 'A choice about the city\'s pipes',
      autoStart: { all: [{ quest: 'fac_northlink_q1_logs', status: 'completed' }, { flag: 'a3.mnsa_live' }, { var: 'act', gte: 3 }] },
      start: 'crate',
      stages: {
        crate: {
          text: 'Wes pages you at dinner: "need u at the NOC. bring nothing. tell nobody. its a box." It is, in fact, a box.',
          onEnter: [{ scene: 'nl_tap', delayHours: 24 * 10 }],
          objectives: [
            {
              id: 'decided',
              text: 'Deal with the box in rack nine',
              when: { flag: 'fac.northlink.tap_decided' },
              hint: 'Answer the dialog at the NOC. Installing it is easy. Anything else takes Opsec or Hardware — and nerve.',
            },
          ],
          onComplete: [{ scene: 'nl_promotion_offer', delayHours: 24 * 60 }],
        },
      },
    },

    // ── 3. Promotion or exit ────────────────────────────────────────────────
    {
      id: 'fac_northlink_q3_promotion',
      title: 'Network Engineer',
      kind: 'faction',
      act: 3,
      faction: 'fac.halcyon',
      giver: 'northlink_wes',
      priority: 15,
      summary: 'Corporate has noticed you. Corporate noticing you is the best and worst thing that can happen on the night shift.',
      rewards: 'A title, or a clean exit',
      autoStart: { seen: 'nl_promotion_offer' },
      start: 'offer',
      stages: {
        offer: {
          text: [
            { if: { npc: 'northlink_wes', fate: 'company_man' }, text: 'Wes has a window office now. He keeps the blinds closed. He wants someone he trusts in his old chair.' },
            { if: { npc: 'northlink_wes', fate: 'whistle' }, text: 'Wes got fired, then interviewed, then quietly un-fired. NorthLink wants to look like it rewards honesty. It has an offer for you, too.' },
            { if: { npc: 'northlink_wes', fate: 'neutral' }, text: 'NorthLink corporate wants to talk about your future. Wes says to wear a shirt with buttons.' },
          ],
          objectives: [
            {
              id: 'decided',
              text: 'Decide your future at NorthLink',
              when: { flag: 'fac.northlink.career_decided' },
              hint: 'Answer the promotion dialog. Business can get you the title on your own terms.',
            },
          ],
        },
      },
    },
  ],

  scenes: [
    // ── The night shift ─────────────────────────────────────────────────────
    {
      id: 'nl_night_shift',
      channel: 'dialog',
      title: 'NOC, 3 a.m.',
      start: 'noc',
      nodes: {
        noc: {
          speaker: 'narrator',
          text: [
            'NorthLink\'s network operations center is a windowless room in Millgate full of blinking lights, humming racks, and one heroically overworked space heater with a hand-lettered sign: DO NOT UNPLUG — WES. It is 3 a.m. Somewhere out there, eleven thousand modems are singing to this room.',
            'Wes Tran wears a headset even though nobody is calling. He hands you a coffee in a mug that says I SURVIVED Y2K AND ALL I GOT WAS THIS MUG.',
          ],
          next: 'memo',
        },
        memo: {
          speaker: 'northlink_wes',
          text: [
            '"So here\'s the thing, man." He slides a memo across the desk. RECORDS RETENTION REQUEST. "Right now we keep connection records thirty days, because the law says thirty days. Who dialed in, when, from where. Then it rolls off. Thirty days."',
            '"This says eighteen months. Every subscriber. Bundled up monthly and shipped to \'an approved data partner\' for \'infrastructure protection analytics.\' It\'s signed by our VP and by some federal liaison whose name I can\'t pronounce." He rubs his eyes. "We keep the logs because the law says to. Soon the law\'s gonna say keep more. This ain\'t the law yet. This is somebody asking nice."',
            '"I gotta set it up by Monday. Or you do. You\'re better at this than me."',
          ],
          effects: [{ npc: 'northlink_wes', met: true, fate: 'neutral' }],
          choices: [
            ...decideChoices,
            {
              text: '"Before we do anything: who is the \'approved data partner\'?"',
              check: {
                skill: 'networking',
                dc: 15,
                success: 'vendor',
                fail: 'vendor_noticed',
                successEffects: [{ flag: 'fac.northlink.knows_vendor' }],
                failEffects: [{ flag: 'fac.northlink.asked_loud' }, { faction: 'fac.aperture', add: -5 }, { stat: 'heat', add: 5 }],
              },
            },
          ],
        },
        vendor: {
          speaker: 'northlink_wes',
          text: [
            'You don\'t go poking at anything. You just read the paperwork the way Wes never had time to: the delivery address, the contract number, the name on the service agreement. It isn\'t a government office. It\'s a company in Millgate, three blocks from here. Aperture Data Solutions.',
            'Wes reads it over your shoulder and goes quiet. "The data hygiene people? They sponsor the Little League team." He sits down. "Man. I just run the pipe."',
          ],
          choices: decideChoices,
        },
        vendor_noticed: {
          speaker: 'northlink_wes',
          text: [
            'You ask around a little too loudly. By 9 a.m. an email has arrived at NorthLink from a compliance address at a company called Aperture, very politely asking who at NorthLink "has questions about the partnership," and whether those questions "could be directed through proper channels."',
            'Wes deletes it, then undeletes it, then prints it and puts it in his drawer. "Okay. So now they know somebody asked." He looks at you. "And they know which shift was on when they got asked. That\'s a short list, man. It\'s got two names on it." A pause. "Still gotta set it up by Monday."',
          ],
          choices: decideChoices,
        },
        complied: {
          speaker: 'northlink_wes',
          text: 'You build the retention job. It runs clean on the first try, bundling eighteen months of a city\'s late nights into neat monthly packages for a partner neither of you will ever meet. Wes signs off on it and says "thanks, man," and means it, because it\'s less work for him. You drive home at dawn past eleven thousand dark windows, each one with a modem that will now remember.',
        },
        minimized: {
          speaker: 'northlink_wes',
          text: [
            'You build exactly what the law requires and not one byte more: thirty days of real records, and after that, only totals. How many people dialed in from Cannery Row on a Tuesday. Not who. The monthly bundle ships on time, fat with numbers and empty of people.',
            'Wes reads the output for a long time. "That\'s... technically compliant," he says finally. "Technically, man." He grins for the first time all night. "I\'m gonna sleep so good."',
          ],
        },
        minimize_broke: {
          speaker: 'northlink_wes',
          text: [
            'The job you build is careful and clever and, on its first run, falls over so loudly that it pages three managers and the partner\'s end of the line. The "approved data partner" emails twice before breakfast about "irregularities in the initial delivery."',
            'Wes takes the call. "Space heater tripped the breaker," he tells them, with total conviction. "Old building." He hangs up and looks at you. "Fix it quieter, man. But yeah. Keep it thin." You do, eventually. It costs you a week of nights and a little of NorthLink\'s patience.',
            'It costs something else, too. The partner\'s next email asks for "the name of the engineer responsible for the initial configuration, for our records." Wes doesn\'t answer it. He doesn\'t delete it, either.',
          ],
        },
        refused: {
          speaker: 'northlink_wes',
          text: '"Okay." Wes nods slowly. "Then it\'s on mine." He does it himself, badly and slowly, over the whole weekend, the full eighteen months, every subscriber, exactly what the memo asked. On Monday he looks like he hasn\'t slept. "You kept your hands clean, man. The logs are still kept." He isn\'t angry. That\'s the part that stays with you.',
        },
      },
    },

    // ── The box in rack nine ────────────────────────────────────────────────
    {
      id: 'nl_tap',
      channel: 'dialog',
      title: 'Rack Nine',
      start: 'crate',
      nodes: {
        crate: {
          speaker: 'narrator',
          text: [
            'The crate is gray, waist-high, and stenciled LUMEN-CIP SENTINEL — CRITICAL INFRASTRUCTURE PROTECTION APPLIANCE. It came with a binder, a routing sheet, and a man from the vendor in a windbreaker who wouldn\'t give his last name and left before the coffee finished brewing.',
            'The binder explains, in the passive voice, what the box does. It sits in the core of NorthLink\'s network, where every connection in the city passes through, and it quietly makes a copy of everything that goes by for a "partner facility."',
            { if: { var: 'w.mnsa', eq: 1 }, text: 'The Act passed. This isn\'t a request anymore. It\'s the law.' },
            { if: { var: 'w.mnsa', eq: 2 }, text: 'The watered-down Act "encourages voluntary participation." The binder has the word "voluntary" underlined, as if that helps.' },
            { if: { all: [{ var: 'w.mnsa', eq: 0 }, { not: { flag: 'a3.vote_resolved' } }] }, text: 'The council hasn\'t even voted yet. This is a "voluntary pilot," ahead of the law, so that when the law arrives everything is already in place.' },
            { if: { all: [{ var: 'w.mnsa', eq: 0 }, { flag: 'a3.vote_resolved' }] }, text: 'The Act failed. The city voted no. The box came anyway, as a "private partnership."' },
            { if: { flag: 'fac.northlink.knows_vendor' }, text: 'The partner facility\'s address is a block in Millgate you\'ve seen before, on a retention memo, years ago.' },
            { if: { flag: 'fac.northlink.partner_watching' }, text: 'Before he left, the man in the windbreaker asked, pleasantly, which of you built the retention job "with the irregularities." Wes said he did. The man wrote something down anyway, and looked at you while he wrote it.' },
            { if: { flag: 'fac.northlink.asked_loud' }, text: 'The man in the windbreaker called you by your name. Your full name. You never gave it to him.' },
          ],
          next: 'wes',
        },
        wes: {
          speaker: 'northlink_wes',
          text: '"They want it in rack nine by Friday." Wes hasn\'t taken his headset off. "I\'m supposed to sign that it\'s installed, and that it\'s the only one, and that I don\'t know what\'s in it." He laughs, and it comes out wrong. "Three things. I only know one of them is true."',
          choices: [
            { text: 'Rack it, cable it, sign it. It\'s the job.', effects: INSTALLED, goto: 'installed' },
            {
              text: '"We leak it. The binder, the routing sheet, all of it. Together."',
              check: {
                skill: 'opsec',
                dc: 17,
                bonuses: [
                  { if: { flag: 'fac.northlink.knows_vendor' }, add: 2, label: '+2 you know whose box it is' },
                  { if: { all: [{ flag: 'fac.northlink.minimized' }, { not: { flag: 'fac.northlink.partner_watching' } }] }, add: 2, label: '+2 you\'ve been careful since the memo' },
                  { if: { flag: 'fac.northlink.partner_watching' }, add: -2, label: '-2 the vendor remembers your retention job' },
                  { if: { flag: 'fac.northlink.asked_loud' }, add: -2, label: '-2 Aperture already knows your name' },
                ],
                success: 'leak_clean',
                fail: 'leak_traced',
                successEffects: [...LEAK_CORE, { var: 'w.public_opinion', add: 10 }, { faction: 'fac.bureau', add: -10 }, { faction: 'fac.hood', add: 5 }],
                failEffects: [
                  ...LEAK_CORE,
                  { var: 'w.public_opinion', add: 6 },
                  { faction: 'fac.bureau', add: -15 },
                  { stat: 'heat', add: 15 },
                  { flag: 'fac.northlink.leak_traced' },
                  { trait: 'pkg09_legit_person_of_interest' },
                  { complication: 'legal' },
                ],
              },
            },
            {
              text: 'Install it — wrong. Racked, lit up, humming, and copying absolutely nothing of use.',
              check: {
                skill: 'hardware',
                dc: 16,
                bonuses: [
                  { if: { background: 'tinkerer' }, add: 2, label: '+2 basement tinkerer' },
                  { if: { flag: 'fac.northlink.partner_watching' }, add: -2, label: '-2 the vendor will check your work first' },
                ],
                success: 'sabotaged',
                fail: 'sabotage_found',
                successEffects: [{ flag: 'fac.northlink.tap_sabotaged' }, { faction: 'fac.hood', add: 3 }, { npc: 'northlink_wes', affinity: 5 }, { flag: 'fac.northlink.tap_decided' }],
                failEffects: [
                  ...INSTALLED,
                  { stat: 'heat', add: 10 },
                  { faction: 'fac.bureau', add: -5 },
                  { npc: 'northlink_wes', affinity: -10 },
                  { flag: 'fac.northlink.wes_burned' },
                  { chance: 0.3, then: [{ complication: 'work' }] },
                ],
              },
            },
            {
              text: '"I\'m not putting that in. I\'m done here."',
              tag: '[Quit]',
              effects: [
                { flag: 'fac.northlink.walked' },
                { npc: 'northlink_wes', fate: 'company_man' },
                { faction: 'fac.hood', add: 3 },
                { if: onTheLadder, then: [{ job: null }] },
                { flag: 'fac.northlink.tap_decided' },
              ],
              goto: 'walked',
            },
          ],
        },
        installed: {
          speaker: 'narrator',
          text: [
            'It takes forty minutes. The box slides into rack nine like it was always meant to be there, and a row of small green lights comes on and stays on. Wes signs all three lines.',
            'A month later, NorthLink makes him Director of Network Operations, "in recognition of a seamless compliance deployment." He gets a window office. He keeps the blinds closed.',
          ],
        },
        leak_clean: {
          speaker: 'narrator',
          text: [
            'You photograph every page of the binder at 4 a.m. with a disposable camera from the drugstore, develop it at a one-hour photo place in Ridgeport, and mail the prints to June Albescu at the Lumen Ledger from a mailbox outside the Cathode. No names. No return address. Nothing that says NOC.',
            '"THE BOX IN RACK NINE" runs on a Sunday, above the fold, with a photo of the routing sheet. The council chamber fills with people holding printouts. NorthLink fires Wes on Monday "pending review," and three reporters are on his doorstep by Tuesday, and by the end of the month NorthLink quietly un-fires him because firing him looks worse than keeping him.',
          ],
        },
        leak_traced: {
          speaker: 'narrator',
          text: [
            'The story runs — "THE BOX IN RACK NINE," above the fold — but the binder photos have NorthLink\'s internal page numbers on them, and only two badges were in the NOC that night. Wes takes the fall on purpose, loudly, so they stop looking at you. They fire him in front of everyone. A federal liaison starts calling your number and not leaving messages.',
            'Three reporters are on Wes\'s doorstep by Tuesday. He gives them coffee. "I just ran the pipe," he tells the Ledger. "Turns out the pipe was the story."',
            'He takes the fall. You take the rest: a name on a list in a federal office, a liaison who calls your number some nights just to listen to you say hello, and the knowledge that it was your camera, your one-hour photo, your mailbox outside the Cathode.',
          ],
        },
        sabotaged: {
          speaker: 'narrator',
          text: 'You install it perfectly. Racked, powered, every green light green, every page of the binder followed exactly — except one small, patient mistake in how it\'s wired into the core, the kind of mistake that looks like the building\'s fault. It hums. It glows. It copies nothing anyone will ever be able to use. Wes signs all three lines and doesn\'t ask you anything, which is the nicest thing anyone has done for you in a year.',
        },
        sabotage_found: {
          speaker: 'narrator',
          text: [
            'The man in the windbreaker comes back on the eighth day with a laptop and a very small screwdriver. He finds it in forty minutes. He says nothing to you. He says a great deal, quietly, to Wes\'s VP.',
            'Wes has to redo the install himself, properly, with the man standing behind him holding the very small screwdriver, for six nights running. His VP watches from the doorway every one of them.',
            'NorthLink promotes him anyway, after, because now he\'s the only one they trust with the box. He takes the window office. He doesn\'t call you. When you pass him in the hall he says "man" and nothing after it, which from Wes is a door slammed shut.',
          ],
        },
        walked: {
          speaker: 'northlink_wes',
          text: '"Yeah." Wes doesn\'t argue. He watches you pack the mug. "Somebody\'s gonna put it in, man. Might as well be somebody who knows what it is." He does it that night, alone. A month later they make him a director. He sends you a postcard of the Millgate skyline with one line on the back: "window office. blinds closed. miss you."',
        },
      },
    },

    // ── Promotion or exit ───────────────────────────────────────────────────
    {
      id: 'nl_promotion_offer',
      channel: 'dialog',
      title: 'Your Future at NorthLink',
      start: 'offer',
      nodes: {
        offer: {
          speaker: 'northlink_wes',
          text: [
            { if: { npc: 'northlink_wes', fate: 'company_man' }, text: 'Wes\'s new office has a window, a plant somebody gave him that he is visibly killing, and the blinds down. "Director of Network Operations." He says it like a diagnosis. "I need somebody in my old chair who I don\'t gotta explain things to. Network Engineer II. Real money. Your own shift."' },
            { if: { npc: 'northlink_wes', fate: 'whistle' }, text: 'Wes calls from the payphone at the Cathode. "So. They fired me, then the story ran, and now they want me back with a title so it looks like they reward honesty." A long exhale. "I don\'t want it, man. But they asked about you, too. Network Engineer II. Real money. You should hear them out — or come with me."' },
            { if: { npc: 'northlink_wes', fate: 'neutral' }, text: 'Wes walks you up to the sixth floor, where the carpet gets thicker. "Corporate noticed you," he says in the elevator. "Network Engineer II. Real money. Just... read what you sign, man."' },
            { if: { flag: 'fac.northlink.tap_installed' }, text: 'Rack nine is still humming. You can feel it from the elevator. You tell yourself you can\'t.' },
            { if: { flag: 'fac.northlink.wes_burned' }, text: 'He doesn\'t offer you his hand. "I\'m offering because corporate said to," he says. "They made me redo your wiring with a man standing behind me. I want you to know I haven\'t forgotten, so we\'re not pretending."' },
            { if: { flag: 'fac.northlink.leak_traced' }, text: 'There is a lawyer in the room when the VP makes the offer. He doesn\'t say anything. He just takes notes, and every time you answer a question, he writes down how long you took to answer it.' },
          ],
          choices: [
            { text: '"I\'ll take it."', effects: PROMOTED, goto: 'promoted' },
            {
              text: '"I\'ll take it on one condition — in writing: NorthLink keeps logs exactly as long as the law says, and not a day longer."',
              check: {
                skill: 'business',
                dc: 15,
                success: 'policy',
                fail: 'no_policy',
                successEffects: [...PROMOTED, { flag: 'fac.northlink.policy_won' }, { faction: 'fac.hood', add: 5 }],
                failEffects: [...PROMOTED, { stat: 'stress', add: 5 }, { chance: 0.3, then: [{ complication: 'work' }] }],
              },
            },
            {
              text: '"No. I\'m going independent — the Row\'s small shops need someone they can trust with their pipes."',
              effects: [
                { flag: 'fac.northlink.exited' },
                { faction: 'fac.hood', add: 3 },
                { if: onTheLadder, then: [{ job: null }] },
                { if: { npc: 'northlink_wes', fate: 'whistle' }, then: [{ flag: 'npc.northlink_wes.joined_you' }, { npc: 'northlink_wes', affinity: 8 }] },
                {
                  buff: {
                    id: 'independent_consultant',
                    name: 'Independent Consultant',
                    desc: 'NorthLink references and a list of small shops that trust you. Freelance pays better.',
                    days: 365,
                    mods: [{ key: 'freelance.pay', mult: 1.1 }],
                  },
                },
                { flag: 'fac.northlink.career_decided' },
              ],
              goto: 'exited',
            },
          ],
        },
        promoted: {
          speaker: 'northlink_wes',
          text: '"Network Engineer II." Wes shakes your hand, then, awkwardly, hugs you, headset and all. "Welcome to the part of the building where they give you a chair that doesn\'t squeak. You\'re gonna hate it. You\'re gonna be great at it." The raise is real. So is the certification program that comes with it. So is the quiet, every night, of a building that remembers everything.',
        },
        policy: {
          speaker: 'narrator',
          text: [
            'The VP of Operations reads your one-paragraph condition three times, looking for the trick. There isn\'t one. "Exactly as long as the law requires," he repeats. "That\'s... what we do." You smile. "Then it won\'t cost you anything to write it down."',
            'He writes it down. It goes in the policy manual, page 214, in a font nobody will ever read. It is the most important thing you\'ve ever gotten anyone to sign.',
          ],
        },
        no_policy: {
          speaker: 'narrator',
          text: 'The VP of Operations listens, nods thoughtfully, says "let\'s take that offline," and hands you the title and the raise with a warm handshake and absolutely no piece of paper. "Offline" turns out to be a place where conditions go to live forever. You have a better chair now. You check the retention settings every Monday anyway.',
        },
        exited: {
          speaker: 'narrator',
          text: [
            'You hand in your badge and your I SURVIVED Y2K mug. Within a month you\'re the person the Row calls when the florist\'s network dies, when the church office gets a virus, when Sal\'s credit card machine starts printing receipts in what looks like Greek.',
            { if: { flag: 'npc.northlink_wes.joined_you' }, text: 'Wes comes with you. He brings the space heater. "Our own shop," he says, unpacking it in a rented room over a laundromat. "No boxes in the rack I\'m not allowed to open."', else: 'The pay is worse. The hours are worse. Nobody asks you to keep anything longer than it needs keeping.' },
          ],
        },
      },
    },
  ],
})
