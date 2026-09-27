/**
 * PKG-09 — Halcyon, part 2 (bible §7.4 steps 3–4).
 *
 *  - `fac_halcyon_q3_audit` — the pre-IPO audit finds Halcyon's shy biggest customer.
 *    Look away (`fac.halcyon.looked_away`) or dig (`a2.building_a_case`, an evidence fragment,
 *    `w.exposure +1`).
 *  - `fac_halcyon_q4_crash` — the 2005 scandal wobble (NOT the 2001 bust). Publishes
 *    `halcyon_crash` once (the headline's rider owns the 'wobble' state; publishNews dedupes, and
 *    we skip it entirely if Halcyon already came clean). Branch: protect the team (Hood +10,
 *    options gone) / protect your options (money, Hood −10). A Business or Programming check can
 *    steady the ship; otherwise this package moves `w.halcyon_state` to 'crashed', which is what
 *    PKG-16's `trig_halcyon_dead` reads in Act IV.
 */
import { dayOf } from '@/engine/calendar'
import { defineContent } from '@/engine/registry'
import type { Cond, Effect } from '@/engine/types'

const HALCYON_JOB = 'job_halcyon_junior'

function payTranches(perTranche: number): Effect[] {
  return [
    {
      if: { var: 'fac.halcyon.options', gte: 3 },
      then: [{ money: perTranche * 3 }],
      else: [
        {
          if: { var: 'fac.halcyon.options', eq: 2 },
          then: [{ money: perTranche * 2 }],
          else: [{ if: { var: 'fac.halcyon.options', eq: 1 }, then: [{ money: perTranche }] }],
        },
      ],
    },
    { var: 'fac.halcyon.options', set: 0 },
  ]
}

const knowsTheAddress: Cond = { any: [{ item: 'aperture_sample' }, { flag: 'npc.corvid.trusts' }] }
const isClean: Cond = { flag: 'w.halcyon_state', eq: 'clean' }

/** How the company comes out of the crash scene (this package owns the 'crashed' step). */
const RESOLVE_STATE: Effect[] = [
  {
    if: { not: isClean },
    then: [
      {
        if: { flag: 'fac.halcyon.steadied' },
        then: [{ flag: 'w.halcyon_state', set: 'wobble' }],
        else: [{ flag: 'w.halcyon_state', set: 'crashed' }],
      },
    ],
  },
  { flag: 'fac.halcyon.crash_decided' },
  { scene: 'hal_crash_after', delayHours: 24 * 7 },
]

/** Your rescue plan dies in the boardroom: the stock has no floor now (RESOLVE_STATE → 'crashed'). */
const BOARD_IGNORES: Effect[] = [{ flag: 'fac.halcyon.plan_coaster' }, { stat: 'stress', add: 8 }, { stat: 'mood', add: -6 }]

/** Dee takes the wheel — unless she's busy being a councilwoman. */
const DEE_PROMOTION: Effect[] = [{ if: { not: { flag: 'npc.dee.council' } }, then: [{ flag: 'npc.dee.promoted' }] }]

const CASE_BONUSES = [
  { if: knowsTheAddress, add: 2, label: '+2 you know that address block' },
  { if: { flag: 'fac.halcyon.noticed_partnership' }, add: 2, label: '+2 you\'ve wondered since the Fishbowl' },
]

const DIG_WIN: Effect[] = [{ flag: 'a2.building_a_case' }, { var: 'evidence_fragments', add: 1 }, { var: 'w.exposure', add: 1 }]
const DIG_LOSE: Effect[] = [
  { flag: 'a2.building_a_case' },
  { var: 'w.exposure', add: 1 },
  { flag: 'fac.halcyon.flagged_by_it' },
  { faction: 'fac.halcyon', add: -8 },
  { stat: 'stress', add: 8 },
]

export default defineContent({
  quests: [
    // ── Step 3: The Audit ───────────────────────────────────────────────────
    {
      id: 'fac_halcyon_q3_audit',
      title: 'The Audit',
      kind: 'faction',
      act: 2,
      faction: 'fac.halcyon',
      giver: 'vale',
      priority: 20,
      summary:
        'Before a company goes public, strangers in pleated trousers read every number it has ever written down. Halcyon\'s numbers are beautiful. One of them is a little too beautiful.',
      rewards: 'Halcyon rep — or a piece of the truth',
      autoStart: { all: [{ quest: 'fac_halcyon_q2_ship_it', status: 'completed' }, { var: 'act', gte: 2 }] },
      start: 'prep',
      stages: {
        prep: {
          text: [
            { if: { flag: 'w.halcyon_state', eq: 'rising' }, text: 'Halcyon\'s first audit as a public company is coming, and the CFO is recruiting engineers who can pull data without breaking it.', else: 'The IPO is coming. Before it does, an accounting firm has to swear on its reputation that Halcyon is what it says it is. The CFO is recruiting engineers who can pull data without breaking it.' },
          ],
          onEnter: [{ scene: 'hal_audit_mail', delayHours: 24 * 20 }],
          objectives: [
            {
              id: 'asked',
              text: 'Wait for the auditors to arrive',
              when: { seen: 'hal_audit_mail' },
              hint: 'Keep working. Anneliese Crane, the CFO, will send for you when the auditors land.',
            },
          ],
          onComplete: [{ scene: 'hal_ledger', delayHours: 30 }],
          next: 'ledger',
        },
        ledger: {
          text: 'The auditors want revenue exports, and you are the engineer who stays late. Somewhere in the numbers is Halcyon\'s biggest customer, and the question of what, exactly, it is buying.',
          objectives: [
            {
              id: 'decided',
              text: 'Decide what you saw in the ledger',
              when: { flag: 'fac.halcyon.audit_decided' },
              hint: 'Answer the late-night dialog in the records room. Looking away is a choice. So is looking closer.',
            },
          ],
        },
      },
    },

    // ── Step 4: The Crash ───────────────────────────────────────────────────
    {
      id: 'fac_halcyon_q4_crash',
      title: 'The Crash',
      kind: 'faction',
      act: 3,
      faction: 'fac.halcyon',
      giver: 'vale',
      priority: 25,
      summary:
        'It isn\'t the bust. The bust was 2001, and Halcyon survived it. This is 2005, and this time the thing going wrong is Halcyon itself.',
      rewards: 'Your team, your options, or the company — pick',
      autoStart: {
        all: [
          { quest: 'fac_halcyon_q3_audit', status: 'completed' },
          { var: 'act', eq: 3 },
          { day: true, gte: dayOf(2005, 2, 1) },
        ],
      },
      start: 'breaks',
      stages: {
        breaks: {
          text: [
            { if: isClean, text: 'Halcyon cut its dirty partner loose, and the honest quarter has arrived: forty percent of the revenue is gone, the stock is in free fall, and the board wants blood by Friday.', else: 'The story broke overnight. Halcyon\'s biggest customer doesn\'t really use Halcyon, the stock is in free fall, and the board wants blood by Friday.' },
          ],
          onEnter: [
            { if: { not: isClean }, then: [{ news: 'halcyon_crash' }] },
            { scene: 'hal_crash_chat' },
            { scene: 'hal_crash_board', delayHours: 48 },
          ],
          objectives: [
            {
              id: 'decided',
              text: 'Get through the emergency board week',
              when: { flag: 'fac.halcyon.crash_decided' },
              hint: 'Answer the dialog when Vale calls you upstairs. A strong Business or Programming hand might save more than yourself.',
            },
          ],
        },
      },
    },
  ],

  scenes: [
    // ── The auditors are coming ─────────────────────────────────────────────
    {
      id: 'hal_audit_mail',
      channel: 'mail',
      title: 'Audit support — tonight, if you can',
      from: 'Anneliese Crane (CFO)',
      start: 'ask',
      nodes: {
        ask: {
          text: [
            'Hi,',
            'The team from Pruett & Vance arrives Monday for fieldwork. They will need revenue-by-customer exports going back three years, reconciled against usage. Engineering tells me you are careful and that you do not panic when a database looks at you funny. I need both of those things.',
            'You\'ll be working with their associate, Bernard Oyelaran. He is very young and very thorough and I would take it as a personal kindness if you did not frighten him.',
            'Records room, second floor. I\'ve ordered food. It is not pizza. I promise it is not pizza.',
            'Thank you,\nAnneliese Crane\nChief Financial Officer, Halcyon Systems',
          ],
        },
      },
    },

    // ── The ledger ──────────────────────────────────────────────────────────
    {
      id: 'hal_ledger',
      channel: 'dialog',
      title: 'The Records Room',
      start: 'room',
      nodes: {
        room: {
          speaker: 'narrator',
          text: [
            'Eleven p.m. The records room is a windowless box with a humming server, a box of pad thai (not pizza; Crane kept her word), and Bernard Oyelaran of Pruett & Vance, twenty-four years old, tie loosened exactly one centimeter.',
            'The exports reconcile. All of them but one. Halcyon\'s largest customer is something called Lumen Sound Holdings. It pays for four thousand Beacon seats. In three years, according to the usage logs, nobody at Lumen Sound Holdings has logged in once.',
            'And there\'s something else. Beacon\'s "Directory Sync" feature — the one that keeps every customer\'s org charts and contact lists tidy — sends a copy of all of it, every night at 3 a.m., to an address block that doesn\'t belong to Halcyon.',
            { if: knowsTheAddress, text: 'You know that block. The last time you saw it, it was inside a "you\'ve won a prize!" pop-up on Ruth Alvarez\'s PC, phoning home at 3:12 a.m. to a dull little Millgate company called Aperture.' },
          ],
          next: 'bernard',
        },
        bernard: {
          speaker: 'Bernard Oyelaran',
          text: '"So." Bernard pushes his glasses up. "I\'m supposed to sign that this is fine. Is this fine? You can tell me it\'s fine. I would honestly love for you to tell me it\'s fine."',
          choices: [
            {
              text: '"Not my department. Sign it, Bernard."',
              effects: [{ flag: 'fac.halcyon.looked_away' }, { faction: 'fac.halcyon', add: 6 }],
              goto: 'look_away',
            },
            {
              text: 'Follow the nightly sync to where it lands. Quietly.',
              check: { skill: 'systems', dc: 15, bonuses: CASE_BONUSES, success: 'dig_win', fail: 'dig_lose', successEffects: DIG_WIN, failEffects: DIG_LOSE },
            },
            {
              text: 'Read the sync feature\'s source code and see who wrote the address in.',
              check: { skill: 'programming', dc: 15, bonuses: CASE_BONUSES, success: 'dig_win', fail: 'dig_lose', successEffects: DIG_WIN, failEffects: DIG_LOSE },
            },
            { text: '"Hold that thought." Page Priya.', goto: 'priya' },
            { text: 'Take it to Vale in the morning. Straight up.', goto: 'vale' },
          ],
        },
        look_away: {
          speaker: 'narrator',
          text: [
            'Bernard exhales like a punctured tire and signs. The number goes into the filing as "strategic data partnership revenue," a phrase so boring that it is basically invisible.',
            'You go home at one. You sleep fine. That\'s the part you think about later: how fine you slept.',
          ],
          effects: [{ flag: 'fac.halcyon.audit_decided' }],
        },
        dig_win: {
          speaker: 'narrator',
          text: [
            'You don\'t touch anything that would leave a mark. You just watch, the way you\'d follow a stray cat home: the nightly bundle, the hop out of Halcyon, the landing spot. The landing spot is Aperture Data Solutions. The paperwork says Lumen Sound Holdings is registered at a lawyer\'s office in Harbor Point, and the lawyer also represents Aperture.',
            'Halcyon isn\'t just being paid by Aperture. Halcyon is Aperture\'s front door into every company that runs on Beacon. You print two pages, fold them into quarters, and put them in your shoe like it\'s 1954.',
            'Bernard, bless him, is asleep on the pad thai.',
          ],
          effects: [{ flag: 'fac.halcyon.audit_decided' }],
        },
        dig_lose: {
          speaker: 'narrator',
          text: [
            'You get far enough to see the shape of it — Aperture\'s shape — and then a monitoring alert you didn\'t know existed pages the night operator, who pages IT, who pages Anneliese Crane at 2 a.m.',
            'At nine the next morning you are sitting across from Crane in her office, which has no view, because she gave the view to Sales. There is a printout on her desk: your badge number, a timestamp, and the words DIRECTORY SYNC circled twice.',
            '"Help me understand," she says, very politely, "why an engineer was poking at a customer feature at midnight, during an audit, with an auditor asleep on the pad thai."',
          ],
          choices: [
            {
              text: '"Reconciliation. The usage numbers didn\'t match, so I checked the feature that generates them."',
              tag: '[Lie]',
              effects: [
                { flag: 'fac.halcyon.lied_to_crane' },
                {
                  buff: {
                    id: 'hal_under_review',
                    name: 'Under Review',
                    desc: 'Your bonus is "pending review," your badge opens fewer doors, and somebody in Finance reads your commit messages now.',
                    days: 120,
                    bad: true,
                    mods: [
                      { key: 'pay', mult: 0.9 },
                      { key: 'stress.gain', mult: 1.08 },
                    ],
                  },
                },
                { chance: 0.3, then: [{ complication: 'work' }] },
              ],
              goto: 'crane_door',
            },
            {
              text: '"Look where the sync goes, Anneliese. Then tell me what I should have done."',
              tag: '[Truth]',
              effects: [{ flag: 'fac.halcyon.crane_knows' }, { faction: 'fac.halcyon', add: -4 }],
              goto: 'crane_truth',
            },
          ],
        },
        crane_door: {
          speaker: 'narrator',
          text: [
            'She says "of course," in a voice like a door closing.',
            'You keep your job. Your bonus goes "pending review," and your badge stops opening the records room, and for the rest of the quarter somebody in Finance reads every commit you make. You walk out with only what you saw and a half page of notes, folded small.',
          ],
          effects: [{ flag: 'fac.halcyon.audit_decided' }],
        },
        crane_truth: {
          speaker: 'Anneliese Crane',
          text: [
            'She reads the address block on your notes. She reads it again. Then she takes off her reading glasses and pinches the bridge of her nose for a long time, like someone who has been carrying a very heavy box and has just been told what\'s in it.',
            '"I have to write you up. For the record. There has to be a record." She writes it. It is two sentences long. "And I have to think about what I didn\'t hear this morning." She slides your notes back across the desk without copying them.',
            '"Go back to work. If anyone asks, you were reconciling." At the door she adds, not looking up: "The numbers were always too beautiful. I kept telling myself I was the only one who noticed."',
          ],
          effects: [{ flag: 'fac.halcyon.audit_decided' }],
        },
        priya: {
          speaker: 'priya',
          text: [
            'She\'s there in twenty minutes, parka over pajamas again. She reads the screen standing up, and you watch the color leave her face.',
            { if: { flag: 'a2.priya_backstory' }, text: '"This is it," she says quietly. "This is what I found in \'99. The thing I wrote up. The thing they paid me to forget." She laughs, once, awful. "It grew up. It got a job. It got a job here."', else: '"I have seen this before," she says quietly. "A long time ago, somewhere else. I wrote a report about it. It did not go well for the report." She doesn\'t say anything else for a while.' },
          ],
          choices: [
            {
              text: '"Then dig with me. Carefully. Tonight."',
              check: {
                skill: 'cryptography',
                dc: 14,
                bonuses: [{ if: { always: true }, add: 2, label: '+2 Priya is reading over your shoulder' }, ...CASE_BONUSES],
                success: 'priya_dig_win',
                fail: 'priya_dig_lose',
                successEffects: [...DIG_WIN, { npc: 'priya', affinity: 5 }],
                failEffects: [...DIG_LOSE, { npc: 'priya', affinity: 3 }, { flag: 'fac.halcyon.priya_written_up' }],
              },
            },
            {
              text: '"You\'re scared. Then we leave it. For now."',
              effects: [{ flag: 'fac.halcyon.looked_away' }, { faction: 'fac.halcyon', add: 4 }, { npc: 'priya', affinity: 3 }],
              goto: 'priya_leave',
            },
          ],
        },
        priya_dig_win: {
          speaker: 'priya',
          text: [
            'The nightly bundle is locked, but whoever locked it was lazy in a way Priya recognizes, and she talks you through it in her short surgeon\'s sentences until the contents open like a sealed letter held to a lamp. Org charts. Home numbers. Every Beacon customer in the city, filed and cross-filed, going to Aperture.',
            '"Print two pages," she says. "Not ten. Two. Ten is a crusade. Two is insurance." She watches you fold them. "I\'m sorry. I should have looked years ago."',
          ],
          effects: [{ flag: 'fac.halcyon.audit_decided' }],
        },
        priya_dig_lose: {
          speaker: 'priya',
          text: [
            'The lock holds, and something behind it notices you trying. Priya pulls your hands off the keyboard like it\'s a hot stove. "Stop. Stop. That\'s enough." She knows exactly what an alarm feels like from the inside.',
            'In the morning Crane asks you both, very politely, about the midnight access. Priya lies beautifully, for both of you: it was her idea, her login, her curiosity. You never touched the keyboard.',
            'Crane writes her up anyway. "Unauthorized access to customer systems during audit fieldwork." It goes in her file, which after six years at Halcyon contained nothing but praise. Priya signs it without reading it, goes to the roof, and doesn\'t come down until lunch. You have what you saw, and not much else, and someone else\'s name on the paper that should have had yours.',
          ],
          effects: [{ flag: 'fac.halcyon.audit_decided' }],
        },
        priya_leave: {
          speaker: 'priya',
          text: 'She nods, too fast. "For now." She tells Bernard to sign, and he does, and she walks you to the elevator without a word. At the doors she says, not looking at you: "You were right to call me. Don\'t ever call me about this again." You\'ve never seen her scared before. It\'s worse than you would have guessed.',
          effects: [{ flag: 'fac.halcyon.audit_decided' }],
        },
        vale: {
          speaker: 'vale',
          text: [
            'Vale\'s office is a corner of glass looking out over the Sound. He listens to you with his whole face, nodding, delighted, as if you\'re telling him about a movie.',
            '"Lumen Sound. Our shyest friends." He opens a drawer and slides an envelope across the desk. "You know what I see? I see someone who notices things. That\'s rare. That\'s leadership. This is a refresh grant — another four thousand options — because I want the people who notice things to be very, very happy here."',
          ],
          choices: [
            {
              text: 'Take the envelope. Say thank you.',
              effects: [{ flag: 'fac.halcyon.looked_away' }, { flag: 'fac.halcyon.vale_bought_you' }, { var: 'fac.halcyon.options', add: 1 }, { faction: 'fac.halcyon', add: 10 }],
              goto: 'vale_took',
            },
            {
              text: 'Leave the envelope on the desk. "I\'d rather know what I\'m being thanked for."',
              effects: [{ faction: 'fac.halcyon', add: -5 }, { flag: 'fac.halcyon.refused_grant' }],
              goto: 'vale_refused',
            },
          ],
        },
        vale_took: {
          speaker: 'vale',
          text: '"There it is." He comes around the desk and shakes your hand with both of his. "Family." On the way out you pass Bernard in the hallway, looking at you with the expression of a man who wanted very badly to be told it was fine and has now been told. He signs that afternoon.',
          effects: [{ flag: 'fac.halcyon.audit_decided' }],
        },
        vale_refused: {
          speaker: 'narrator',
          text: 'Vale\'s smile stays exactly where it is while the warmth leaves it, like a house with the heat switched off. "Take the day," he says. "Think about the future." You go back down to the records room instead. Bernard is still there. The exports are still open.',
          choices: [
            {
              text: 'Follow the nightly sync to where it lands.',
              check: { skill: 'systems', dc: 15, bonuses: CASE_BONUSES, success: 'dig_win', fail: 'dig_lose', successEffects: DIG_WIN, failEffects: DIG_LOSE },
            },
            {
              text: 'Read the sync feature\'s source code.',
              check: { skill: 'programming', dc: 15, bonuses: CASE_BONUSES, success: 'dig_win', fail: 'dig_lose', successEffects: DIG_WIN, failEffects: DIG_LOSE },
            },
            {
              text: 'Close the laptop. Some doors you only get to walk out of once.',
              effects: [{ flag: 'fac.halcyon.looked_away' }],
              goto: 'look_away',
            },
          ],
        },
      },
    },

    // ── The ticker ──────────────────────────────────────────────────────────
    {
      id: 'hal_crash_chat',
      channel: 'chat',
      title: 'Dee',
      from: 'dee',
      pause: true,
      start: 'ticker',
      nodes: {
        ticker: {
          text: [
            'HAVE YOU SEEN THE TICKER',
            'sorry. caps lock. i dont know how to turn it off on this thing, kim showed me once',
            { if: { flag: 'a3.whistleblow_prepped' }, text: 'priya is on the front page of the ledger. PRIYA. testifying. i am so proud of her i could throw up' },
            { if: { all: [{ not: { flag: 'a3.whistleblow_prepped' } }, { not: isClean }] }, text: 'the lumen ledger says our biggest customer "does not meaningfully exist." i ordered them a fruit basket last christmas' },
            { if: isClean, text: 'marcus cut ties with the data people like you all wanted and now the money is gone with them. honest is expensive apparently. HLCN is down 40 before lunch' },
            { if: { not: isClean }, text: 'HLCN is down 60. SIXTY. the koi can tell. gerald hasnt come up all morning' },
            'board meets thursday. marcus wants to see you after. he has the blinds down. marcus never has the blinds down',
          ],
          choices: [
            { text: 'hang in there dee. i\'m coming in', effects: [{ npc: 'dee', affinity: 2 }], goto: 'coming' },
            { text: 'how bad is it for the people on 3?', goto: 'people' },
          ],
        },
        coming: { text: 'bring coffee. the good kind. the budget is frozen and i have been drinking the decaf from the lobby like an animal' },
        people: { text: 'bad, honey. they want 40 percent. they want NAMES. i have worked here three years and i know every one of those names\'s kids birthdays\n\nbring coffee' },
      },
    },

    // ── The emergency board week ────────────────────────────────────────────
    {
      id: 'hal_crash_board',
      channel: 'dialog',
      title: 'Blinds Down',
      start: 'office',
      nodes: {
        office: {
          speaker: 'narrator',
          text: [
            'Vale\'s corner office, blinds down for the first time in Halcyon history. Vale is in a gray sweater instead of the turtleneck, which frightens people more than the stock price. Anneliese Crane sits by the window with a spreadsheet printed so small it looks like a texture.',
            { if: { job: HALCYON_JOB }, text: 'You still have a badge. For now, everybody does.', else: 'You haven\'t worked here in a while. Dee signed you in as "an outside pair of eyes." Vale shook your hand at the door like you\'d never left.' },
            { if: { flag: 'fac.halcyon.moonlight_file' }, text: 'Crane has a personnel folder open on her knee. It is yours. There is a yellow sticky note on the front in Dee\'s pencil, MOONLIGHTING?, and under it, in Vale\'s fountain pen, one word: USEFUL.' },
            { if: { flag: 'fac.halcyon.crane_knows' }, text: 'When you come in, Crane looks up from the spreadsheet and holds your eye for exactly one second. It is the look of someone who has been waiting since the audit to be in a room with you when it finally happened.' },
            { if: { all: [{ flag: 'fac.halcyon.flagged_by_it' }, { not: { flag: 'fac.halcyon.crane_knows' } }] }, text: 'Crane doesn\'t look at you. She hasn\'t, not properly, since the morning after the audit.' },
          ],
          next: 'vale_ask',
        },
        vale_ask: {
          speaker: 'vale',
          text: [
            '"The board wants forty percent. They want a list by Friday. I need people who know who\'s actually good." He rubs his eyes. "I built this place with my hands. I am not going to let a newspaper take it apart."',
            { if: { flag: 'fac.halcyon.asked_burn' }, text: 'He looks at you. "You asked me about the burn rate at your first all-hands. Everybody laughed." Nobody is laughing now.' },
          ],
          choices: [
            {
              text: 'Put a restructuring plan on the table: cut the Harbor Point lease, the jet share, the parties — keep the engineers.',
              check: {
                skill: 'business',
                dc: 18,
                bonuses: [
                  { if: { flag: 'fac.halcyon.asked_burn' }, add: 2, label: '+2 you\'ve been watching the burn since day one' },
                  { if: { course: 'course_financial_modeling' }, add: 2, label: '+2 Financial Modeling' },
                  { if: { flag: 'fac.halcyon.crane_knows' }, add: 2, label: '+2 Crane slides you the real numbers' },
                ],
                success: 'steady_business',
                fail: 'board_ignores',
                successEffects: [{ flag: 'fac.halcyon.steadied' }, { faction: 'fac.halcyon', add: 10 }, { faction: 'fac.hood', add: 5 }, ...DEE_PROMOTION],
                failEffects: BOARD_IGNORES,
              },
            },
            {
              text: '"Give me six weeks and a team. Beacon 3 ships, and the market gets a reason to come back."',
              check: {
                skill: 'programming',
                dc: 18,
                bonuses: [
                  { if: { flag: 'fac.halcyon.shipped' }, add: 2, label: '+2 you\'ve saved a ship night before' },
                  { if: { flag: 'fac.halcyon.tuesday_fixed' }, add: 1, label: '+1 you fixed the Tuesday build' },
                  { if: { trait: 'pkg09_legit_tuesday' }, add: -2, label: '-2 the board has heard about Tuesday' },
                ],
                success: 'steady_ship',
                fail: 'board_ignores',
                successEffects: [{ flag: 'fac.halcyon.steadied' }, { faction: 'fac.halcyon', add: 10 }, { faction: 'fac.hood', add: 5 }, ...DEE_PROMOTION],
                failEffects: BOARD_IGNORES,
              },
            },
            { text: '"Let\'s talk about the list."', goto: 'the_ask' },
          ],
        },
        steady_business: {
          speaker: 'narrator',
          text: [
            'You walk the board through it on Thursday with a laser pointer Dee found in a drawer marked MISC (DANGEROUS). The Harbor Point satellite office: gone. The jet share: gone. The quarterly "vision retreat" at the Yacht Club: very gone. The cuts are ugly and specific and they add up.',
            'The board, which expected a bloodbath, is so relieved to be handed a spreadsheet that it approves a ten percent cut instead of forty. Anneliese Crane shakes your hand like she\'s been waiting years for someone to say "jet share" out loud in that room.',
            { if: { not: { flag: 'npc.dee.council' } }, text: 'Then, in an act of corporate absurdity nobody will ever fully explain, the board names Dee Briggs interim Chief Operating Officer, on the grounds that she is the only person in the building who knows where anything is. She is, technically, your boss again.' },
          ],
          next: 'the_ask',
        },
        steady_ship: {
          speaker: 'narrator',
          text: [
            'Six weeks. You live on the third floor with a team of eleven, a futon, and a whiteboard that says DAYS SINCE LAST ALL-NIGHTER: 0 in permanent marker. Beacon 3 ships on day forty-one, fast and clean and without a single thing called "Directory Sync."',
            'The analysts, who love a comeback more than they love being right, call it "a return to fundamentals." The board cuts ten percent instead of forty. Vale takes the credit on television and, off camera, hugs you so hard your badge cracks.',
            { if: { not: { flag: 'npc.dee.council' } }, text: 'The board also names Dee Briggs interim Chief Operating Officer, because she personally kept all eleven of you fed. She is, technically, your boss again. She has already made a sign-out sheet for the futon.' },
          ],
          next: 'the_ask',
        },
        board_ignores: {
          speaker: 'narrator',
          text: [
            'The board thanks you for your input and does not read it. You watch a man in a very good suit use your plan as a coaster. When you leave the room, the number is still forty percent, and HLCN is down another eight.',
            {
              if: { not: isClean },
              text: 'That was the last door. Without a plan the market can believe in, there is no floor under the stock, and everyone in the room knows it. Halcyon is not going to wobble. It is going to fall, and you were the last person who tried to catch it.',
              else: 'Halcyon will survive being honest; the clean books see to that. It will just survive smaller, and without most of the people you walked in here trying to save.',
            },
          ],
          next: 'the_ask',
        },
        the_ask: {
          speaker: 'narrator',
          text: [
            { if: { flag: 'fac.halcyon.steadied' }, text: 'Ten percent is still people. Vale still wants names — fewer of them — by Friday.', else: 'Forty percent. Vale still wants names by Friday.' },
            { if: { flag: 'fac.halcyon.priya_written_up' }, text: 'He slides a draft across the desk to get you started. The first name on it, in Crane\'s tidy hand, is Priya Raman. In the margin, in pencil: "audit access — see file." The night in the records room. Her login. Her lie.' },
            'And afterwards, in the hallway, Anneliese Crane falls into step beside you. "There is a trading window," she says, looking straight ahead. "It closes Monday, before the next filing. I am not telling you anything. I am telling you what day it is."',
          ],
          choices: [
            {
              text: 'Refuse to hand over names. Write the humane version instead: severance, coverage, references — with Dee.',
              effects: [
                { flag: 'fac.halcyon.protected_team' },
                { faction: 'fac.hood', add: 10 },
                { faction: 'fac.halcyon', add: -5 },
                { var: 'fac.halcyon.options', set: 0 },
                { npc: 'dee', affinity: 5 },
                { npc: 'priya', affinity: 3 },
                { if: { flag: 'fac.halcyon.priya_written_up' }, then: [{ npc: 'priya', affinity: 4 }] },
                ...DEE_PROMOTION,
              ],
              goto: 'protect',
            },
            {
              text: 'Exercise everything and sell in Crane\'s window. Protect yourself.',
              if: { var: 'fac.halcyon.options', gte: 1 },
              effects: [...payTranches(6000), { flag: 'fac.halcyon.sold_options' }, { faction: 'fac.hood', add: -10 }, { faction: 'fac.halcyon', add: 3 }],
              goto: 'sold',
            },
            {
              text: 'Give Vale his list. Somebody has to.',
              effects: [
                { flag: 'fac.halcyon.gave_names' },
                { faction: 'fac.halcyon', add: 8 },
                { faction: 'fac.hood', add: -10 },
                { npc: 'dee', affinity: -5 },
                { stat: 'stress', add: 10 },
                { if: { flag: 'fac.halcyon.priya_written_up' }, then: [{ flag: 'fac.halcyon.named_priya' }, { npc: 'priya', affinity: -15 }] },
              ],
              goto: 'names',
            },
            {
              text: '"I\'m done." Walk out while you still like yourself.',
              tag: '[Quit]',
              effects: [
                { flag: 'fac.halcyon.walked_at_crash' },
                { var: 'fac.halcyon.options', set: 0 },
                { faction: 'fac.halcyon', add: -5 },
                { if: { job: HALCYON_JOB }, then: [{ job: null }] },
              ],
              goto: 'walked',
            },
          ],
        },
        protect: {
          speaker: 'dee',
          text: [
            'You and Dee take over the Fishbowl for two days. She brings a label maker. You bring a spreadsheet. Together you write the gentlest layoff in the history of Port Lumen: real severance, six months of coverage, a reference letter for every single person, signed by someone who actually knows their work.',
            { if: { flag: 'fac.halcyon.priya_written_up' }, text: 'The first thing you do is take Priya\'s name off Crane\'s draft. You don\'t tell her. Dee does, apparently, because the next morning there is a bowl of pho on your desk with a lid on it and no note.' },
            '"I have fired people for eleven years," Dee says at 1 a.m., labeling a box FOR PEOPLE WHO ARE SCARED. "I have never once done it right. This is the first time." She doesn\'t cry. She labels another box.',
            'Your options, underwater and unexercised, you let drown. It feels less like losing money than like putting down something heavy.',
          ],
          effects: RESOLVE_STATE,
        },
        sold: {
          speaker: 'narrator',
          text: [
            'You exercise and sell on Friday afternoon, inside the window, completely legally, in a way that will look very bad in a newspaper if a newspaper ever looks. The money lands Monday.',
            { if: { not: { flag: 'fac.halcyon.steadied' } }, text: 'On Tuesday the second story runs, and HLCN falls through the floor to a dollar forty. Half the third floor held because Vale asked them to. You didn\'t. They know you didn\'t.', else: 'On Tuesday HLCN wobbles, then holds, then climbs a little. You sold near the bottom anyway. Money is money. Nobody on the third floor says anything to your face.' },
          ],
          effects: RESOLVE_STATE,
        },
        names: {
          speaker: 'narrator',
          text: [
            'You write the list on a legal pad in Vale\'s office with the blinds down. It takes forty minutes. Some of the names are easy. Two of them are people who covered for you on ship night. You write those two last and the pen goes through the paper.',
            { if: { flag: 'fac.halcyon.named_priya' }, text: 'You leave Priya\'s name where Crane put it, at the top. You tell yourself she\'ll land anywhere. Vale reads the list and crosses her name off himself. "Not Priya. Priya knows where the bodies are." He says it like a compliment. That afternoon she walks past your desk without slowing down, and you understand that he showed her the draft.' },
            'Vale reads it, nods, and says "thank you" like you handed him a coffee. On Friday, Dee walks every person on the list to the elevator herself. She doesn\'t look at you once all day.',
          ],
          effects: RESOLVE_STATE,
        },
        walked: {
          speaker: 'narrator',
          text: [
            'You leave your badge on Vale\'s desk. He looks at it for a long time, like it\'s a word he forgot. "Nobody walks out of this company," he says finally. "People get walked out. There\'s a difference."',
            '"Not today," you say. Downstairs, Gerald the koi surfaces as you pass, for the first time all week, which you choose to take as a blessing.',
          ],
          effects: RESOLVE_STATE,
        },
      },
    },

    // ── A week later ────────────────────────────────────────────────────────
    {
      id: 'hal_crash_after',
      channel: 'mail',
      title: 'After',
      from: 'priya',
      start: 'after',
      nodes: {
        after: {
          text: [
            'A week on. Here is what I know.',
            { if: { flag: 'fac.halcyon.steadied' }, text: 'We\'re still here. Smaller, bruised, still here. The stock is a joke, but it\'s a joke with a pulse. I walked past your desk this morning and somebody had left a coffee on it for you. Nobody would admit to it.', else: 'It\'s over, mostly. The lights are on and the koi are fed, but the company is a shell with a logo. The board is "exploring options." That is what people say when there aren\'t any.' },
            { if: { flag: 'fac.halcyon.protected_team' }, text: 'Forty-one people signed a card for you. Dee made me promise to mail it and not "make it weird." I am not making it weird. I am saying: forty-one people. Somebody drew Gerald on the back.' },
            { if: { flag: 'fac.halcyon.sold_options' }, text: 'People noticed you sold before the second story. I\'m not going to tell you how to feel about it. I sold mine at the IPO and I still don\'t know how to feel about that.' },
            { if: { flag: 'fac.halcyon.gave_names' }, text: 'Lorena from QA asked me if you picked her. I said I didn\'t know. I did know. I\'m telling you so that one of us carries it.' },
            { if: { flag: 'fac.halcyon.named_priya' }, text: 'Marcus showed me the draft. Your handwriting, my name at the top, where Anneliese put it after the audit night. I lied to her for you that night. I want you to know I remember that I did, and that I remember what you did with it.' },
            { if: { all: [{ flag: 'fac.halcyon.plan_coaster' }, { not: { flag: 'fac.halcyon.steadied' } }] }, text: 'The board member who used your plan as a coaster resigned on Tuesday "to spend time with his boat." Nobody put your plan back on the table. I found it in the recycling and kept it. Page four was right. Page four was always right.' },
            { if: { flag: 'fac.halcyon.walked_at_crash' }, text: 'You walked. Half the building wishes they had. The other half is angry you got to. Both halves bought you a drink in their heads.' },
            { if: { flag: 'npc.dee.promoted' }, text: 'Dee is COO. She has an office with a door now. She keeps it open and stands in it like a lighthouse.' },
            '— P.',
            'P.S. Rule six. There is no rule six. I just wanted you to know I was still counting.',
          ],
        },
      },
    },
  ],
})
