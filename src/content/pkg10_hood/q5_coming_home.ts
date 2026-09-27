/**
 * PKG-10 — fac_hood_q5_coming_home, "Coming Home" (bible §7.5 step 5; the Hood `fac_<X>_final`).
 *
 * Act IV. The Neighborhood is the one faction whose Inner tier cannot be bought. This step reads
 * everything the arc built — the diner, Dad, the Row's trust — and decides two things:
 *
 *  1. `w.hood_soul` (shared add-only), the ending's warm-room modifier. A high-trust, Cathode-open,
 *     Dad-back Row adds to it here; a cold, hollowed-out Row subtracts. (Only this beat and the
 *     news riders touch it; §11.4 single-count rule.)
 *  2. `npc.dialtone.fate` and `item.exchange_keys`, the finale's physical route into the copper
 *     exchange (bible §6.D). This package is the sole grantor of the keys.
 *      - Marge alive & met & not evicted → `honored`: she hands you the keys herself (or walks the
 *        copper route with you as a finale ally).
 *      - Marge alive but the Row failed her (evicted by redevelopment) → `evicted`: no keys from
 *        her; the finale falls back to the night-watchman bribe (PKG-04).
 *      - Marge never met, or a late-game timed illness → `passed_keys`: `trig_marge_keys` wills you
 *        the keys.
 *
 *  3. `npc.sal.fate = 'took_a_fall'` when the Row is compromised: if your trouble has followed you
 *     home and Sal is tied to you (the back room, or the second mortgage), investigators come for
 *     the back room and someone has to answer for it. At Inner (80) the Row itself closes ranks,
 *     the "Row carries you through a crisis" perk (bible §3 F5); Inner players who aren't in
 *     trouble get the same warmth on the walk home.
 *
 * The "operator" stage is timed (bible §5.3): Marge's health scare has a real clock, and losing it
 * routes to the will, never to a dead end.
 */
import { defineContent } from '@/engine/registry'
import type { Cond, Effect } from '@/engine/types'
import {
  CATHODE_OPEN,
  CLEAR_NO_RAIDS,
  DAD_RETRAINED,
  HOOD_COLD,
  HOOD_INNER,
  HOOD_TRUSTED,
  PLAYER_HOT,
  SAL_AROUND,
  SAL_EXPOSED,
  SET_NO_RAIDS,
} from './shared'

/**
 * "Row compromised" (bible §4.3 Sal `took_a_fall`, §4.6): your trouble has followed you home, and
 * Sal is tied to you, through the back room or the debt he took on for the diner.
 */
const SAL_CRISIS: Cond = { all: [PLAYER_HOT, SAL_EXPOSED, CATHODE_OPEN, SAL_AROUND] }
const CRISIS_DONE = 'fac.hood.sal_crisis_done'

/** Inner (80) perk: the Row carries you through the crisis (bible §3 F5). */
const rowCarriesYou: Effect = {
  buff: {
    id: 'hood_row_carries_you',
    name: 'The Row Carries You',
    desc: 'Porch lights, casseroles, and forty neighbors who never saw a thing. Stress lifts faster and heat cools off on the Row.',
    days: 400,
    mods: [
      { key: 'stress.relief', mult: 1.25 },
      { key: 'heat.decay', add: 0.2 },
      { key: 'mood.daily', add: 1 },
    ],
  },
}

/**
 * Marge's fate is decided here (PKG-10 is the sole writer, §4.6). You met her at the church
 * basement, and:
 *   honored  — the Row still had the standing to keep her on the block (Neighborhood ≥ 20, or you
 *              saved the Cathode). She hands you the keys.
 *   evicted  — you let the Row go cold while Millgate redeveloped around her; nobody had the pull
 *              to stop her landlord. No keys from her.
 *   passed_keys — you never met her, so the keys come by will (below / trig_marge_keys).
 */
const MARGE_MET: Cond = { flag: 'side.met_dialtone' }
const MARGE_PROTECTED: Cond = {
  any: [{ faction: 'fac.hood', gte: 20 }, { flag: 'side.saved_cathode' }, { npc: 'dialtone', affinityGte: 30 }],
}
const MARGE_HANDOFF: Cond = { all: [MARGE_MET, MARGE_PROTECTED, { npc: 'dialtone', fateNot: ['passed_keys', 'passed', 'dead', 'evicted'] }] }
const MARGE_LOST: Cond = { all: [MARGE_MET, { not: MARGE_PROTECTED }] }

const keysInHand: Effect[] = [{ item: 'exchange_keys' }, { flag: 'fac.hood.keys_in_hand' }]

/** The Row's warm-room math for the ending (bible §10 coda). */
const hoodSoul: Effect = {
  if: HOOD_INNER,
  then: [{ var: 'w.hood_soul', add: 3 }],
  else: [
    {
      if: HOOD_TRUSTED,
      then: [{ var: 'w.hood_soul', add: 2 }],
      else: [
        {
          if: { faction: 'fac.hood', gte: 20 },
          then: [{ var: 'w.hood_soul', add: 1 }],
          else: [{ if: { faction: 'fac.hood', lte: -20 }, then: [{ var: 'w.hood_soul', add: -2 }] }],
        },
      ],
    },
  ],
}

const cathodeSoul: Effect = { if: CATHODE_OPEN, then: [{ var: 'w.hood_soul', add: 1 }] }
const dadSoul: Effect = { if: DAD_RETRAINED, then: [{ var: 'w.hood_soul', add: 1 }] }

/** Where the arc goes once you've walked the Row (and, if it came to that, stood up for Sal). */
const KEYS_ROUTE: { if?: Cond; stage: string }[] = [
  { if: { flag: 'fac.hood.keys_in_hand' }, stage: 'done' },
  { if: { npc: 'dialtone', fate: 'passed_keys' }, stage: 'will' },
  { if: MARGE_HANDOFF, stage: 'operator' },
  { if: MARGE_LOST, stage: 'evicted' },
  { if: MARGE_MET, stage: 'will' },
  { stage: 'no_keys' },
]

/** Sal's fall costs the Row some of its warmth; you standing up for him doesn't. */
const salFalls: Effect[] = [
  { npc: 'sal', fate: 'took_a_fall' },
  { var: 'w.hood_soul', add: -1 },
  { faction: 'fac.hood', add: -6 },
]

export default defineContent({
  traits: [
    {
      id: 'pkg10_hood_the_drive',
      name: 'The Drive Under the Couch',
      desc: 'You missed one drive, and an old man who fed you for twenty years said "that\'s mine" and paid for it. You check everything twice now. You sleep worse. Both of those are Sal\'s doing, and neither is his fault.',
      scar: true,
      bad: true,
      mods: [
        { key: 'stress.gain', mult: 1.06 },
        { key: 'check.opsec', add: 1 },
      ],
    },
  ],

  quests: [
    {
      id: 'fac_hood_q5_coming_home',
      title: 'Coming Home',
      kind: 'faction',
      act: 4,
      faction: 'fac.hood',
      giver: 'dialtone',
      priority: 60,
      autoStart: {
        all: [
          { var: 'act', gte: 4 },
          { any: [{ quest: 'fac_hood_q4_save_cathode', status: ['completed', 'failed'] }, { day: true, gte: 3100 }] },
        ],
      },
      rewards: 'The Row carries you home · the exchange keys',
      summary: [
        'The Long Tail. You are older than you meant to be, in a city you helped make. Whatever else is true, Cannery Row is still where you are from.',
        'Marge Osgood patched this city\'s calls for thirty years. She knows every wire in the Flats, including the ones that run to the one building this whole story has been circling toward. She has been waiting for you to come home and ask.',
      ],
      start: 'reckon',
      stages: {
        reckon: {
          text: [
            'Take a day on the Row. See who\'s still here, and who\'s gone, and what it all came to.',
            { if: HOOD_INNER, text: 'The porch lights are on all down the block. The Row decided a long time ago that you were theirs, and the Row does not un-decide.' },
            { if: HOOD_COLD, text: 'The curtains move when you walk past, and then they don\'t. You brought too much down here, too many times. A neighborhood remembers.' },
          ],
          onEnter: [hoodSoul, cathodeSoul, dadSoul, { scene: 'hood_coming_home', delayHours: 8 }],
          objectives: [
            {
              id: 'walk',
              text: 'Walk the Row one more time',
              when: { flag: 'fac.hood.came_home' },
              hint: 'A dialog opens on its own. Take your time with it.',
            },
          ],
          next: [{ if: SAL_CRISIS, stage: 'crisis' }, ...KEYS_ROUTE],
        },

        // Your trouble followed you home, and it found Sal first.
        crisis: {
          text: [
            'Two men in good raincoats have been in the Cathode three nights running, drinking tea, asking the waitress about the back room. Sal is feeding them pie and telling them nothing. He cannot do that forever.',
            { if: HOOD_INNER, text: 'The Row has noticed. The Row is, in its own way, getting organized.' },
          ],
          onEnter: [{ scene: 'hood_sal_fall', delayHours: 20 }],
          objectives: [
            {
              id: 'stand',
              text: 'Decide who answers for the back room',
              when: { flag: CRISIS_DONE },
              hint: 'A dialog opens on its own at the Cathode. Whoever you let answer for that room will carry it.',
            },
          ],
          next: KEYS_ROUTE,
        },

        // Marge is alive and on the block: her health scare, and the handoff.
        operator: {
          text: [
            'Marge Osgood has something for you, and she wants to give it to you herself, at the old exchange, before her hip or her landlord or the century has anything more to say about it.',
            'She left a number. It rings a rotary phone. Answer it soon.',
          ],
          timeLimitDays: 20,
          onEnter: [SET_NO_RAIDS, { scene: 'hood_marge_keys', delayHours: 18 }],
          objectives: [
            {
              id: 'keys',
              text: 'Meet Marge at the exchange',
              when: { flag: 'fac.hood.keys_in_hand' },
              hint: 'A dialog opens on its own. Go to Marge before her twenty days run out — she has been waiting a long time.',
            },
          ],
          onTimeout: { stage: 'will', effects: [{ flag: 'fac.hood.missed_marge' }] },
          next: 'done',
        },

        // The Row failed her: she was pushed out. No keys from her; the finale uses the bribe.
        evicted: {
          text: 'Marge Osgood\'s flat went to the redevelopment. She lives with her niece in Ridgeport now. The exchange is locked, and the person who knew every key is gone from the block.',
          onEnter: [{ npc: 'dialtone', fate: 'evicted' }, { scene: 'hood_marge_evicted', delayHours: 24 }],
          objectives: [
            {
              id: 'call',
              text: 'Call Marge in Ridgeport',
              when: { flag: 'fac.hood.marge_called' },
              hint: 'A dialog opens on its own. She always did phone collect, on principle.',
            },
          ],
          next: 'done',
        },

        // She's gone: the keys come by will.
        will: {
          text: [
            { if: { flag: 'fac.hood.missed_marge' }, text: 'You waited too long. Marge went into Harbor Point General on a Tuesday and didn\'t come out. There was a package at her niece\'s with your name on it, and a note in careful operator\'s handwriting.' },
            { if: { not: { flag: 'fac.hood.missed_marge' } }, text: 'Marge Osgood passed in the winter, at ninety-one, in her own bed with the cat on her feet. She left the whole scene something. The something with your name on it was heavier than the rest.' },
          ],
          onEnter: [{ npc: 'dialtone', fate: 'passed_keys' }, { scene: 'hood_marge_will', delayHours: 24 }],
          objectives: [
            {
              id: 'inherit',
              text: 'Open Marge\'s bequest',
              when: { flag: 'fac.hood.keys_in_hand' },
              hint: 'A letter arrives. Open it when you\'re ready.',
            },
          ],
          next: 'done',
        },

        // You never met Marge. No keys, no willed inheritance — the finale's copper route falls
        // back to the night-watchman bribe (PKG-04 / §6.D). The Row still carries you home.
        no_keys: {
          text: 'You never did meet the old operator everyone on the scene calls dialtone. The exchange is locked, and the one person who knew every key to it is a name in stories you half-heard. If the finale runs through that building, you\'ll be going in the hard way.',
          onEnter: [{ scene: 'hood_no_keys', delayHours: 12 }],
          objectives: [
            {
              id: 'hardway',
              text: 'Find another way toward the exchange',
              when: { flag: 'fac.hood.no_keys_seen' },
              hint: 'A note arrives. There\'s always another way in. It just costs more.',
            },
          ],
          next: 'done',
        },

        done: {
          text: [
            { if: { flag: 'fac.hood.keys_in_hand' }, text: 'You have Marge\'s keys, every one tagged in faded ballpoint. Whatever the finale asks of you, there is now a door on the Row that opens to no one else.' },
            { if: { not: { flag: 'fac.hood.keys_in_hand' } }, text: 'The exchange is locked and the person who knew it best is gone. There are other ways in. There always are. They just cost more.' },
            { if: { trait: 'pkg10_hood_the_drive' }, text: 'Nico runs the grill at the Cathode now. Sal sits on the customer side. Every time you walk in, he looks at you for exactly one second, and then pours your coffee.' },
            'You came home. It turns out that was the hard part.',
          ],
          onEnter: [CLEAR_NO_RAIDS],
          objectives: [
            {
              id: 'home',
              text: 'Come home',
              when: { always: true },
              hint: 'This resolves on its own.',
            },
          ],
        },
      },
    },
  ],

  scenes: [
    // ── The walk ───────────────────────────────────────────────────────────
    {
      id: 'hood_coming_home',
      channel: 'dialog',
      title: 'Coming Home',
      start: 'walk',
      nodes: {
        walk: {
          speaker: 'narrator',
          text: [
            'You walk the Row the long way, the way you used to walk it home from the bus, past the shuttered mill with its new blue floodlights and the humming fence nobody\'s father works behind anymore.',
            {
              if: CATHODE_OPEN,
              text: 'The C in the Cathode sign is still flickering. Sal is behind the counter through the fogged glass, pouring coffee for the four-in-the-morning crowd that never quite goes away. He sees you and lifts the pot an inch: your booth\'s open.',
              else: 'Where the Cathode used to be is a wine bar with a chalkboard and one long table. The neon\'s gone. People stand on the corner outside out of some habit they can\'t explain, and then don\'t know where to go.',
            },
          ],
          next: 'family',
        },
        family: {
          speaker: 'narrator',
          text: [
            { if: { npc: 'mom', fate: 'healthy' }, text: 'Your mother is on her morning walk, doctor\'s orders, reporting on everyone\'s business to everyone else\'s business. She loops your arm through hers without breaking stride or conversation.' },
            { if: { npc: 'mom', fate: 'recovered_dark' }, text: 'Your mother is on the porch with her tea. She\'s alive because of money you never explained, and she has never asked. She just takes your hand for a second, and reads your face like a letter in a language she used to know.' },
            { if: { var: 'w.mom_gone', eq: 1 }, text: 'Your mother\'s reading glasses are still on the kitchen windowsill. Nobody has moved them. You don\'t either.' },
            { if: DAD_RETRAINED, text: 'Your father is on a house call two doors down, business cards in his shirt pocket, explaining a modem to a widow with enormous patience. He waves the screwdriver at you: five minutes.' },
            { if: { all: [DAD_RETRAINED, { flag: 'fac.hood.payroll_late' }] }, text: 'The cannery still sends its computers across town to a man in Harbor Point. Nobody on the Row has mentioned payroll Friday in years. Everybody on the Row still remembers it, which is how you know it happened here.' },
            { if: { all: [DAD_RETRAINED, { flag: 'npc.dad.overshadowed' }, { not: { flag: 'npc.dad.mended' } }] }, text: 'He still calls you before any job he isn\'t sure of, and you still end up holding the screwdriver, and neither of you has ever worked out how to stop.' },
            { if: { flag: 'npc.dad.bad_wrist' }, text: 'His left wrist never did set right after the Lamplighter. He holds a screwdriver differently now, a little stiffly, and tells everyone the weather is coming a day before it does.' },
            { if: { flag: 'npc.dad.er_debt' }, text: 'Kim says he still takes the bus to Harbor Point General on the first of every month and pays the cashier in cash. He has never once mentioned it to you. He never will.' },
            { if: { npc: 'dad', fate: 'mill_ghost' }, text: 'Your father is coming off the night shift at the data campus that used to be his mill, walking the same floor between machines that don\'t need him. He nods, and doesn\'t stop.' },
            { if: { npc: 'dad', fate: 'spiral' }, text: 'Your father is on the front steps with a paper bag folded around a bottle. He lifts a hand when you pass. It costs him something to lift it.' },
            { if: { npc: 'kim', fate: 'thriving' }, text: 'Kim\'s off at college, but her acceptance letter is still magneted to the fridge, curling at the corners, next to a photo of the two of you that neither of you remembers being taken.' },
          ],
          next: 'weight',
        },
        weight: {
          speaker: 'narrator',
          text: [
            {
              if: HOOD_INNER,
              text: 'You expected the Row to be smaller. It isn\'t. Every porch light on the block is on, even in daylight, even the ones on empty houses, because somebody down here started leaving them on years ago and nobody ever said stop.',
              else: 'The Row is smaller than you remember, the way everything from childhood is. Half the faces are new. Some of the ones that aren\'t won\'t quite meet your eye. You did that, or you let it happen, which the Row counts the same.',
            },
            'You sit down on the sea wall at the bottom of the street, where the Flats run out into the grey water, and you let the day be quiet for a while.',
          ],
          choices: [
            {
              if: HOOD_INNER,
              text: 'Get up. Knock on the first lit porch.',
              tag: '[Inner]',
              effects: [{ flag: 'fac.hood.came_home' }, { stat: 'stress', add: -20 }, { stat: 'heat', add: -10 }, { stat: 'mood', add: 12 }, rowCarriesYou],
              goto: 'porches',
            },
            {
              text: 'Think about who\'s still here.',
              effects: [{ flag: 'fac.hood.came_home' }, { stat: 'stress', add: -8 }, { stat: 'mood', add: 6 }],
              goto: 'end',
            },
            {
              text: 'Think about who isn\'t.',
              effects: [{ flag: 'fac.hood.came_home' }, { stat: 'mood', add: -4 }],
              goto: 'end',
            },
          ],
        },
        porches: {
          speaker: 'narrator',
          text: [
            'Mrs. Castellano answers before you finish knocking, as if she has been standing behind the door for ten years. She is holding a casserole. Nobody on Cannery Row has ever been able to explain how she does that.',
            'Then it is the Pruszynskis\' porch, and the Oduya twins\' mother, and Ruth\'s niece, and a man you don\'t know who says you fixed his mother\'s computer in 2002 and she talked about it until the day she died. Somebody puts a plate in your hands. Somebody else takes your coat, and you don\'t get it back until midnight.',
            {
              if: PLAYER_HOT,
              text: 'Nobody asks what you do, or why a car with government plates has been idling at the end of the block all week. Mr. Pruszynski, eighty-four, goes out and asks the car for directions to a church that closed in 1980, at length, until it leaves.',
              else: 'Nobody asks what you do. Nobody has to. For one evening you are just the Tan kid who fixes things, which, it turns out, is the only title you ever actually wanted.',
            },
            '"You look terrible," Mrs. Castellano tells you, beaming, and gives you seconds. On the Row, that is how they say welcome home.',
          ],
          next: 'end',
        },
        end: {
          speaker: 'narrator',
          text: [
            {
              if: { flag: 'side.met_dialtone' },
              text: 'A gull comes down the wind. Behind you, up the street, a rotary phone rings in a downstairs window — three rings, then silence, then three rings again, the way the exchange used to signal an outside line. Marge\'s window. She always did know when you\'d come home.',
              else: 'A gull comes down the wind. The tide is coming in over the old cannery pilings, the way it has since before the mill, since before the copper, since before any of it. Some things the city can\'t enclose. Not for lack of trying.',
            },
          ],
        },
      },
    },

    // ── The Row compromised: who answers for the back room ─────────────────
    {
      id: 'hood_sal_fall',
      channel: 'dialog',
      title: 'Two Men in Raincoats',
      start: 'open',
      nodes: {
        open: {
          speaker: 'narrator',
          text: [
            'The Cathode at two in the morning, and the two men in raincoats are finally gone for the night. They left exact change and a tip of eleven percent, which Sal holds up to the light like evidence.',
            {
              if: { flag: 'npc.sal.base' },
              text: 'He locks the front door, which you did not know it had, and walks you back through the kitchen to the room he gave you. Your things are still where you left them. Nobody has touched them. Somebody, you can tell, has wanted to.',
              else: 'He locks the front door, which you did not know it had, and sits down across from you in your old booth with the second-mortgage papers folded in his apron pocket, where he keeps everything he worries about.',
            },
          ],
          next: 'sal',
        },
        sal: {
          speaker: 'sal',
          text: [
            '"They got a paper from a judge. Thursday they come back and look at my back room, and my books, and whatever else a paper lets a man in a raincoat look at."',
            {
              if: { flag: 'npc.sal.second_mortgage' },
              text: '"And the bank called. Funny thing. Same week. Somebody asked the bank about my loan." He shrugs, heavily. "Everybody wants to know about Sal all of a sudden."',
            },
            '"So here\'s what happens. Thursday, they ask whose room it is. I say mine. They ask what\'s in it. I say none of your business, and my lawyer, who is my cousin Dom and who does wills, says a lot of Latin. I\'m old. What are they gonna do, make me older?"',
          ],
          choices: [
            {
              text: 'Let him do it. He\'s offering. He means it.',
              tag: '[Let Sal take it]',
              effects: [...salFalls, { stat: 'heat', add: -25 }, { npc: 'sal', affinity: -4 }, { flag: CRISIS_DONE }],
              goto: 'sal_takes',
            },
            {
              text: '"No. It\'s my room. Thursday, I\'m the one standing in it."',
              tag: '[Take it yourself]',
              effects: [
                { money: -2500 },
                { jail: 3 },
                { stat: 'stress', add: 15 },
                { faction: 'fac.hood', add: 10 },
                { npc: 'sal', affinity: 12 },
                { flag: 'fac.hood.stood_for_sal' },
                { flag: CRISIS_DONE },
              ],
              goto: 'you_answer',
            },
            {
              text: 'Thursday is three days off. Make sure that when they open the door, there\'s nothing in the room but a couch.',
              check: {
                skill: 'opsec',
                dc: 18,
                bonuses: [
                  { if: HOOD_TRUSTED, add: 2, label: 'The Row keeps watch' },
                  { if: { trait: 'paranoid' }, add: 2, label: 'Paranoid' },
                  { if: { background: 'latchkey' }, add: 1, label: 'Latchkey kid' },
                ],
                success: 'clean',
                fail: 'found',
                successEffects: [{ stat: 'heat', add: -15 }, { npc: 'sal', affinity: 6 }, { flag: CRISIS_DONE }],
                failEffects: [
                  ...salFalls,
                  { stat: 'heat', add: -10 },
                  { stat: 'mood', add: -8 },
                  { trait: 'pkg10_hood_the_drive' },
                  { flag: CRISIS_DONE },
                ],
              },
            },
            {
              text: '"Sal. Call Ruth. Call the choir. Call everybody."',
              tag: '[Inner]',
              req: HOOD_INNER,
              reqText: 'Requires Neighborhood 80 (Inner): only the Row itself can do this',
              effects: [
                { stat: 'heat', add: -20 },
                { faction: 'fac.hood', add: 5 },
                { npc: 'sal', affinity: 8 },
                { flag: 'fac.hood.row_closed_ranks' },
                { flag: CRISIS_DONE },
                rowCarriesYou,
              ],
              goto: 'ranks',
            },
          ],
        },
        sal_takes: {
          speaker: 'narrator',
          text: [
            'Thursday, the men in raincoats open the back room. Sal stands in the doorway in his apron and says it is his, all of it, and when they ask him what a sixty-eight-year-old short-order cook wants with that much equipment, he tells them it runs the jukebox.',
            'They charge him with obstruction. Cousin Dom says a great deal of Latin. It ends in a plea: a fine that takes the last of his savings, eighteen months\' probation, and a condition that he stay away from "the premises in question," which is his own kitchen.',
            'His nephew Nico runs the grill now. The pie is not the same. Sal comes in every morning at six and sits on the customer side of the counter, where you once saw him sit only once, and drinks his coffee, and tells Nico he\'s doing it wrong.',
            'He never says a word to you about it. That is the worst part. He never will.',
          ],
        },
        you_answer: {
          speaker: 'narrator',
          text: [
            'Thursday you are standing in the back room when they open the door. You say it\'s yours. You say Sal didn\'t know what was in it, which is true, and that he never asked, which is also true, and which is the most loyal thing anybody has ever done for you.',
            'It costs you a lawyer who does not do wills, three nights in a cell that smells like a bus station, and your name on a form in a building you had spent a decade staying out of.',
            'When you get out, the C in the Cathode sign is flickering, and there is a plate at the counter with a slice of pie on it and a fork laid across it, the way Sal lays a fork for somebody he\'s been waiting for. "Eat," he says. "You look like a dropped call." His hand is shaking a little when he pours the coffee. He doesn\'t mention it. Neither do you.',
          ],
        },
        clean: {
          speaker: 'narrator',
          text: [
            'Three nights. You take the room apart and carry it out through the alley a box at a time, in a laundry cart, under a tarp, under a load of Sal\'s tablecloths. Where it goes stays between you and a storage unit in Ridgeport rented under a name that belongs to nobody.',
            'You scrub the walls. You replace the phone jack with a new one and then age the new one with coffee and a cigarette lighter. You move the couch six inches so the carpet marks match.',
            'Thursday, the men in raincoats find a couch, a calendar from 1987, and a box of Christmas lights. They stay forty minutes. One of them buys a whole pie on the way out. Sal charges him double and gives him a receipt.',
          ],
        },
        found: {
          speaker: 'narrator',
          text: [
            'You get almost all of it out. Almost. On Thursday morning one of the men in raincoats kneels down, reaches under the couch you moved six inches, and comes up with a single drive you missed, holding it up between two fingers like a tooth.',
            'Sal looks at the drive. Then he looks at you, across the kitchen, for exactly one second. Then he turns to the man in the raincoat and says, "That\'s mine."',
            'They charge him with obstruction. It ends in a plea: a fine, eighteen months\' probation, and a condition that he stay away from his own kitchen. His nephew Nico runs the grill now. Sal comes in every morning and sits on the customer side of the counter. He does not bring it up. He does not have to.',
            'You were one drive away. One. You will think about the underside of that couch for the rest of your life.',
          ],
          choices: [
            {
              text: 'Pay his fine. All of it, every month, for as long as it takes. He doesn\'t get a vote.',
              effects: [
                { obligation: { id: 'pkg10_sal_fine', label: 'Sal\'s fine and Cousin Dom\'s fees', perDay: 15, days: 200 } },
                { npc: 'sal', affinity: 6 },
                { faction: 'fac.hood', add: 3 },
                { flag: 'fac.hood.paid_sals_fine' },
              ],
              goto: 'found_paid',
            },
            {
              text: 'Try to thank him.',
              goto: 'found_thanks',
            },
            {
              text: 'Say nothing. Stay away from the Cathode for a while. It\'s safer for him.',
              effects: [{ npc: 'sal', affinity: -8 }, { faction: 'fac.hood', add: -3 }],
              goto: 'found_away',
            },
          ],
        },
        found_paid: {
          speaker: 'sal',
          text: [
            'The first envelope goes to Cousin Dom\'s office. The second comes back to you, unopened, with SAL written across it in grease pencil and underlined twice. You send it again. He sends it back again.',
            'On the fourth month he stops sending it back. Instead there is a pie on your doorstep every first of the month, with no note. On the Row, that is a receipt.',
          ],
        },
        found_thanks: {
          speaker: 'sal',
          text: [
            'You find him at the counter the next morning, on the customer side, and you start to say it. He holds up one hand without looking at you.',
            '"Kid. It was my kitchen." He pushes a cup of coffee across the counter with one finger. "Next time, check under the couch." It is the only joke he will ever make about it. It is not really a joke.',
          ],
        },
        found_away: {
          speaker: 'narrator',
          text: [
            'You stay away. It is the sensible thing. It is also, you slowly realize, the thing everybody on the Row watches you do.',
            'Nico tells you, months later, that Sal kept your booth empty the whole time, and put a RESERVED sign on it, and yelled at a cab driver who sat there. He never said who it was reserved for. He didn\'t have to.',
          ],
        },
        ranks: {
          speaker: 'narrator',
          text: [
            'Sal looks at you for a long moment. Then he picks up the phone behind the register, the black one with the rotary dial, and starts dialing numbers he knows by heart.',
            'Thursday, when the men in raincoats arrive with their paper, they cannot get in the door. Every booth is full. Every stool. Ruth Alvarez is at the counter with the choir. The Knights of the Harbor are in the back booths in their sashes. Mr. Pruszynski has brought the accordion. Somebody has organized a bake sale on the sidewalk, in the rain, on a Thursday.',
            'When they finally reach the back room, forty-one people are waiting to give a statement. All forty-one were in that room on every night in question, playing bingo. Mrs. Castellano has a bingo card with the dates written on it. She will not let them touch it, because it is laminated.',
            'The men in raincoats stay three hours, take eleven pages of notes about bingo, and do not come back. On the way out one of them asks Sal, quietly, whether the pie is always this good. "Only for the neighbors," Sal says.',
          ],
        },
      },
    },

    // ── Marge hands you the keys ───────────────────────────────────────────
    {
      id: 'hood_marge_keys',
      channel: 'dialog',
      title: 'The Frame Room',
      start: 'call',
      nodes: {
        call: {
          speaker: 'narrator',
          text: [
            'The number rings a rotary phone in Marge Osgood\'s downstairs window. She picks up on the third ring, because "a lady never picks up on the first, love, it looks desperate, and never on the fifth, it looks deaf."',
            '"Meet me at the exchange. The Cannery-Millgate. You remember where. Bring a torch and don\'t wear anything you like — the frame room floods."',
          ],
          next: 'exchange',
        },
        exchange: {
          speaker: 'narrator',
          text: [
            'The old telephone exchange: a windowless brick blockhouse behind the copper yard, the kind of building a city forgets it owns. Half of it is dark and cold and thirty years asleep. The other half hums — new conduit, new locks, a "Millgate Data — Restricted" sign somebody screwed over a door that has said DO NOT ENTER since 1961.',
            'Marge is waiting at the side door in her good coat and her cat-eye glasses, with a heavy iron ring of keys and a torch of her own. She looks up at the humming half of the building the way you\'d look at a stranger living in your childhood bedroom.',
          ],
          next: 'marge',
        },
        marge: {
          speaker: 'dialtone',
          text: [
            '"Thirty years I patched this city, love. Every wedding, every death, every cheat and every alibi came through my board, and I never told a soul, because that was the job."',
            '"Then they gutted my frame room and put their computers in and called it a data campus, and now they listen to everything and tell everyone, and they call THAT the job." She snorts. "Progress."',
            'She lifts the ring of keys. Each one is tagged in faded ballpoint: FRAME ROOM. CABLE VAULT. DO NOT — (the rest worn off).',
            '"Their shiny new trunk runs through my old copper, because copper\'s cheaper than they think and nobody reads the old prints but me. There\'s a way in they don\'t know about, because I am the only one left alive who does."',
          ],
          choices: [
            {
              text: '"Give me the keys, Marge. I\'ll take it from here."',
              effects: [...keysInHand, { npc: 'dialtone', fate: 'honored' }, { npc: 'dialtone', affinity: 6 }],
              goto: 'handoff',
            },
            {
              text: '"Come with me. When it\'s time, I want you on the copper beside me."',
              req: { skill: 'fitness', gte: 20 },
              reqText: 'Requires Fitness 20 (it is a long climb through the cable vault)',
              effects: [...keysInHand, { npc: 'dialtone', fate: 'honored' }, { flag: 'fac.hood.marge_walks' }, { npc: 'dialtone', affinity: 10 }],
              goto: 'together',
            },
            {
              text: '"Marge — is this legal?"',
              goto: 'legal',
            },
          ],
        },
        legal: {
          speaker: 'dialtone',
          text: [
            'She laughs so hard she has to hold the doorframe. "Legal! Love, I ran a party line for thirty years. Legal is a story the phone company tells so you\'ll pay the bill."',
            '"This is my building. My wires. They put a fence around it and a word on the door, but they didn\'t lay one inch of that copper. I did, with these hands, in the winter of \'71, and I know where all the bodies are because I helped bury the cable."',
          ],
          choices: [
            {
              text: '"Then give me the keys."',
              effects: [...keysInHand, { npc: 'dialtone', fate: 'honored' }, { npc: 'dialtone', affinity: 6 }],
              goto: 'handoff',
            },
            {
              text: '"Come with me, then. I\'m not doing this without you."',
              req: { skill: 'fitness', gte: 20 },
              reqText: 'Requires Fitness 20 (it is a long climb through the cable vault)',
              effects: [...keysInHand, { npc: 'dialtone', fate: 'honored' }, { flag: 'fac.hood.marge_walks' }, { npc: 'dialtone', affinity: 10 }],
              goto: 'together',
            },
          ],
        },
        handoff: {
          speaker: 'narrator',
          text: [
            'She folds your hand around the ring of keys, both of hers over yours, cool and papery and absolutely steady.',
            '"Frame room floods, so mind your feet. Cable vault\'s a squeeze, so mind your head. And the trunk you want runs behind the old B-panel, where I used to hide my cigarettes from the supervisor." She pats your cheek. "Bring them back, love. The keys, and the building with them, if you can manage it. Somebody ought to."',
            'The keys are heavier than they look. Thirty years of somebody\'s working life, warm from her pocket, in your hand.',
          ],
        },
        together: {
          speaker: 'narrator',
          text: [
            'She looks at you for a long moment over the cat-eye glasses. Then she pockets her half of the keys and hands you the ring, and something in her face goes twenty years younger.',
            '"All right. When it\'s time, you call this number and let it ring three, then three. I\'ll bring the good torch and the bad language." She pats the doorframe of the old exchange like the flank of a horse. "One more shift on the board, love. One more shift, and then they can have their fence back."',
            'You have the keys, and you have Marge, which is worth more than the keys.',
          ],
        },
      },
    },

    // ── Marge, evicted ─────────────────────────────────────────────────────
    {
      id: 'hood_marge_evicted',
      channel: 'dialog',
      title: 'Collect Call from Ridgeport',
      start: 'phone',
      nodes: {
        phone: {
          speaker: 'narrator',
          text: [
            'The operator asks if you\'ll accept a collect call from Ridgeport. Of course you will. Marge Osgood has phoned collect on principle since the day the phone company stopped being hers.',
          ],
          next: 'marge',
        },
        marge: {
          speaker: 'dialtone',
          text: [
            '"They took the flat, love. The whole block. \'Redevelopment.\' Thirty years I lived over that copper and they gave me ninety days and a gift basket." Her voice is bright and terrible. "There was a pear in it. I ate the pear."',
            '"My niece has a lovely spare room in Ridgeport with a view of a parking structure. I have a cat, a cardigan, and no more building to give you."',
            '"But listen. The exchange. There\'s a night watchman now, name of Petey, drinks his supper. And there\'s a way behind the old B-panel, where I hid my cigarettes. You won\'t need my keys if you\'ve got a clever tongue and a handful of what Petey drinks. I\'m sorry it\'s not more. I\'m sorry it\'s not the whole building, tied up in a bow."',
          ],
          choices: [
            {
              text: '"You gave me plenty, Marge. Petey and the B-panel. I\'ll take it from there."',
              effects: [{ flag: 'fac.hood.marge_called' }, { flag: 'fac.hood.watchman_tip' }, { npc: 'dialtone', affinity: 4 }],
              goto: 'thanks',
            },
            {
              text: '"This isn\'t right. The Row should have fought for you. I should have."',
              effects: [{ flag: 'fac.hood.marge_called' }, { flag: 'fac.hood.watchman_tip' }, { stat: 'mood', add: -6 }, { npc: 'dialtone', affinity: 5 }],
              goto: 'fought',
            },
          ],
        },
        thanks: {
          speaker: 'dialtone',
          text: [
            '"Good. Good." A pause, and the sound of a cat being displaced from a lap. "Do one thing for me, love. When you\'re in there, on my copper, in the dark — say hello to the old B-panel. It kept my secrets for thirty years. It can keep yours for one night."',
          ],
        },
        fought: {
          speaker: 'dialtone',
          text: [
            '"Don\'t." It comes down the line sharp, then softens. "You had a whole city to save, love. You can\'t save a city and an old woman\'s flat in the same week. Nobody can. I patched enough calls to know a person only has so many lines."',
            '"Go and use my copper. That\'s the flat I care about. That\'s the one they can\'t truly take, because I built it and they only bought it."',
          ],
        },
      },
    },

    // ── Never met her ──────────────────────────────────────────────────────
    {
      id: 'hood_no_keys',
      channel: 'dialog',
      title: 'The Hard Way In',
      start: 'ask',
      nodes: {
        ask: {
          speaker: 'narrator',
          text: [
            'You ask around the Row about the old telephone exchange. Everyone points you to the same person, and the same answer: you should have asked dialtone, and dialtone is past asking now.',
            'The old-timers on the church-basement bench tell it in fragments over bad coffee. There\'s a night watchman, name of Petey, who drinks his supper. There\'s a way in behind something they call "the B-panel," where a certain operator used to hide her cigarettes. And there\'s a lock you don\'t have the key to, which means you\'ll be going in the hard way, and the hard way costs.',
          ],
          choices: [
            {
              text: 'Write it all down. Petey. The B-panel. Small bills.',
              effects: [{ flag: 'fac.hood.no_keys_seen' }, { flag: 'fac.hood.watchman_tip' }, { stat: 'mood', add: -3 }],
              goto: 'ok',
            },
          ],
        },
        ok: {
          speaker: 'narrator',
          text: 'You\'ll figure it. You always do. But you find yourself wishing, more than you expected to, that you\'d taken one afternoon in all these years to sit in a church basement and let an old woman correct your wiring.',
        },
      },
    },

    // ── Marge's will ───────────────────────────────────────────────────────
    {
      id: 'hood_marge_will',
      channel: 'mail',
      title: 'From the estate of Margaret Osgood',
      from: 'M. Osgood (Estate)',
      start: 'letter',
      nodes: {
        letter: {
          effects: keysInHand,
          text: [
            'To {name}, who fixed things,',
            'If you are reading this, I have finally been disconnected. Don\'t make a face. Ninety-one years is a long call and I stayed on the line as long as they\'d let me.',
            'My niece has the cat, my sister has the good china, and the scene has my boards and my notebooks, which are worth nothing and everything. You have the keys.',
            'They are the keys to the Cannery-Millgate exchange, every one tagged in my own hand, because a key without a name on it is just a threat. FRAME ROOM floods, so mind your feet. CABLE VAULT is a squeeze, so mind your head. The trunk you want runs behind the old B-panel, where I hid my cigarettes from a supervisor who has been dead for twenty years and can no longer object.',
            'They built their listening machine on top of my copper because they thought the old net was dead. The old net is not dead, love. It is just quiet, and patient, and it remembers every wire. So do you. That is why I chose you.',
            'Bring the keys back if you can. Bring the building with them if you can manage it. And if you can\'t — well. I patched a great many calls that didn\'t go the way anyone wanted, and the sun came up regardless.',
            'Mind the frame room. It floods.',
            'Margaret "dialtone" Osgood\nOperator, Cannery-Millgate Exchange, 1961–1991\n(Retired. Finally.)',
          ],
          choices: [
            {
              text: 'Put the keys in your pocket. Say you\'ll bring them back.',
              effects: [{ npc: 'dialtone', affinity: 5 }, { stat: 'mood', add: -6 }],
              goto: 'promise',
            },
          ],
        },
        promise: {
          speaker: 'narrator',
          text: [
            'The keys are heavier than they look. You weigh them in your hand for a long time, thirty years of somebody\'s working life, tagged in a hand that will never write another word.',
            'Then you put them in your pocket, where they clink once, like a phone hanging up, and you go to work.',
          ],
        },
      },
    },
  ],

  triggers: [
    // Bible §9.0 / §7.5: if Marge was met and is still on the block deep into Act IV but you never
    // opened the handoff, a quiet late-game illness takes her and wills you the keys. Guarded so it
    // never fires once the keys are already in hand or the quest already resolved her.
    {
      id: 'trig_marge_keys',
      when: {
        all: [
          { var: 'act', gte: 4 },
          { day: true, gte: 3300 },
          { flag: 'side.met_dialtone' },
          { npc: 'dialtone', fateNot: ['passed_keys', 'passed', 'dead', 'evicted', 'honored'] },
          { not: { flag: 'fac.hood.keys_in_hand' } },
          { not: { quest: 'fac_hood_q5_coming_home', status: 'active', stage: ['operator', 'will'] } },
        ],
      },
      atHour: 8,
      effects: [
        { npc: 'dialtone', fate: 'passed_keys' },
        { scene: 'hood_marge_will' },
        { log: 'Marge Osgood passed. Her keys came to you.', kind: 'story' },
      ],
    },
  ],
})
