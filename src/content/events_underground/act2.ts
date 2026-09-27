/**
 * events_underground — ACT II (days ~240–1200). IIa is still comedy — LAN parties and gear that
 * fell off a truck — until Kroll's dinner (`a2.phase_iib`) turns the lights down. Then the informant
 * rumours start, heat starts to matter, the black market wants cash at a payphone, and the first
 * envoy in a good suit sits across from you at the Cathode.
 *
 *  - ev_under_lan_party          repeatable · dialog · LAN night in the back room (Networking)
 *  - ev_under_hot_gear           repeatable · chat · Switch's box of "found" parts (Business)
 *  - ev_under_black_market_drop  once · chat · the Tallyman's payphone deal (OpSec / Business)
 *  - ev_under_informant_rumor    once · dialog → mini-arc · someone is talking (OpSec / Social)
 *  - ev_under_heat_relief_alibi  repeatable · dialog · Deadline's alibi, at a price (OpSec)
 *  - ev_under_aperture_envoy     once · dialog · a Brightline suit with overflow work (Business)
 *
 * HARD RULE: hacking is invented flavor only.
 */
import { defineContent } from '@/engine/registry'
import type { BuffDef, EventDef, ItemDef, QuestDef, SceneDef } from '@/engine/types'
import {
  LYING_LOW,
  RIDING_HIGH,
  actBetween,
  actGte,
  actIs,
  around,
  boardLive,
  buff,
  bump,
  darkTurn,
  free,
  snapshot,
} from './_shared'

// ── ev_under_lan_party ────────────────────────────────────────────────────────
// Repeatable warmth: a LAN night at the back room. Cameos guarded on fate/romance.
const LAN_COUNT = 'ev_under.lan_count'

const lanScene: SceneDef = {
  id: 'ev_under_lan_party_scene',
  channel: 'dialog',
  title: 'LAN Night',
  from: 'Sodium Row back room',
  start: 'setup',
  nodes: {
    setup: {
      speaker: 'narrator',
      text: [
        { if: { var: LAN_COUNT, lte: 1 }, text: 'Six machines, one long-suffering power strip, and a hub that Switch swears is "basically enterprise grade." The couch has absorbed another year of cola. Somebody brought a CRT the size of a washing machine and everyone applauded like it was a newborn.' },
        { if: { var: LAN_COUNT, gte: 2 }, text: 'LAN night again. The power strip has been replaced by a slightly newer power strip, which the room treats as a major civic improvement. The washing-machine CRT is back. It has a name now. The name is Gerald.' },
        { if: around('jax'), text: 'Jax is setting up the frag server and narrating his own trash talk in advance, which is either confidence or a cry for help.' },
        { if: { all: [around('mira'), { npc: 'mira', romance: ['dating', 'partner', 'engaged', 'married'] }] }, text: 'Mira saved you the good seat, the one with the working chair-height, and pretends she didn\'t.' },
        { if: { all: [around('mira'), { npc: 'mira', romance: ['none', 'flirting', 'ex'] }] }, text: 'Mira takes the far corner, back to the wall, and is already three rows above everyone on the scoreboard without appearing to try.' },
        { if: darkTurn, text: 'Nobody says it, but there are fewer chairs than last year, and everyone checks the door when it opens.' },
        'The hub blinks green. Someone kills the overhead light. It is time.',
      ],
      choices: [
        {
          tag: '[Networking]',
          text: 'Get the flaky LAN actually stable so the night doesn\'t die at 1 a.m.',
          check: {
            skill: 'networking',
            dc: 13,
            bonuses: [
              { if: { background: 'arcade_rat' }, add: 2, label: '+2 (you have wired a hundred of these)' },
              { if: { jobTrack: ['network', 'sysadmin'] }, add: 1, label: '+1 (this is literally your day job)' },
            ],
            success: 'good_lan',
            fail: 'bad_lan',
            successEffects: [{ stat: 'mood', add: 8 }, { faction: 'fac.loft', add: 2 }, { xp: 'networking', add: 25 }, buff(RIDING_HIGH)],
            failEffects: [
              { stat: 'mood', add: 2 },
              { stat: 'stress', add: 4 },
              { faction: 'fac.loft', add: -1 },
              { if: around('switch'), then: [{ npc: 'switch', affinity: -2 }] },
            ],
          },
        },
        {
          text: 'Forget the tech. Just play, lose gloriously, and eat cold pizza with people who like you.',
          effects: [{ stat: 'mood', add: 6 }, { stat: 'stress', add: -8 }, { faction: 'fac.loft', add: 1 }, { if: around('jax'), then: [{ npc: 'jax', affinity: 2 }] }],
          goto: 'just_play',
        },
        {
          text: 'Slip out early. There\'s work to do and the work never sleeps.',
          effects: [{ stat: 'mood', add: -2 }, { xp: 'programming', add: 15 }, { if: around('jax'), then: [{ npc: 'jax', affinity: -1 }] }],
          goto: 'left',
        },
      ],
    },
    good_lan: {
      speaker: 'narrator',
      text: [
        { if: around('byteme'), text: 'byteme, at a volume usually reserved for fire alarms: "ZERO LAG. ZERO. {handle} u fixed it. this is the greatest night of my ENTIRE LIFE and im including the day i was born."', else: 'The LAN holds rock-solid all night. Nobody drops. Nobody blames the network for their own bad aim, though several try.' },
        'By Monday the board has a thread called "{handle}\'s LAN: a review (10/10)". You pretend not to read it. You read it four times.',
      ],
    },
    bad_lan: {
      speaker: 'narrator',
      text: [
        'The hub gives up at the worst possible moment, mid-tournament, taking Gerald\'s power supply with it in a small, theatrical puff of smoke.',
        { if: around('switch'), text: 'Switch holds up the scorched cable like evidence at a trial. "Who crimped this?" Everyone looks at you. You crimped it.', else: 'Everyone very carefully doesn\'t look at you, which is worse.' },
        'Still — a warm room, warm people, warm CRTs. Not every night has to be a win to be a good one. It just has to be a story.',
      ],
    },
    just_play: {
      speaker: 'narrator',
      text: 'You come dead last and laugh until it hurts. For a few hours nobody in this room is a handle, a source, or a file. Just kids with modems, holding the line against the quiet.',
    },
    left: {
      speaker: 'narrator',
      text: [
        { if: darkTurn, text: 'You let yourself out into the fog. Behind you the laughter keeps going without you. It always does now — that\'s the deal you keep making, one small night at a time.', else: 'You duck out early with a slice for the road. The work is waiting. The work is always waiting. But the laughter follows you halfway down the block.' },
      ],
    },
  },
}

const lanParty: EventDef = {
  id: 'ev_under_lan_party',
  category: 'underground',
  weight: 2,
  repeatable: true,
  cooldownDays: 110,
  when: { all: [actBetween(2, 3), boardLive, around('jax'), free] },
  effects: [bump(LAN_COUNT)],
  scene: 'ev_under_lan_party_scene',
}

// ── ev_under_hot_gear ─────────────────────────────────────────────────────────
// Switch sells hardware of dubious provenance. [Business] to spot the dud. Repeatable money beat.
const FLAKY_RAM: BuffDef = {
  id: 'ev_under_flaky_ram',
  name: 'Flaky RAM',
  desc: 'The stick from Switch\'s box throws errors whenever the room gets warm. Every long job is a coin toss until it finally dies.',
  days: 28,
  bad: true,
  mods: [
    { key: 'efficiency', mult: 0.94 },
    { key: 'hack.speed', mult: 0.92 },
  ],
}

const freshRam = (days: number, speed: number): BuffDef => ({
  id: 'ev_under_fresh_ram',
  name: 'Fresh Silicon',
  desc: 'A lucky score of extra memory has your rig humming.',
  days,
  mods: [
    { key: 'hack.speed', mult: speed },
    { key: 'freelance.speed', mult: 1 + (speed - 1) / 2 },
  ],
})

const hotGearScene: SceneDef = {
  id: 'ev_under_hot_gear_scene',
  channel: 'chat',
  title: 'u still need ram?',
  from: 'switch',
  start: 'pitch',
  expiresDays: 14,
  nodes: {
    pitch: {
      speaker: 'switch',
      text: [
        { if: { flag: 'ev_under.ran_for_switch' }, text: 'my favourite bike courier. still got both ankles? good. i have a thing for you, friends-and-family pricing' },
        { if: { flag: 'ev_under.switch_thinks_you_talk' }, text: 'ok so i\'m still not 100% on you. but money doesn\'t have opinions and neither do i, before noon' },
        { if: { flag: 'ev_under.gear_prev_dud' }, text: 'and before you start — yes, i heard about the last stick. that was a statistical event. this box is a different statistic' },
        'got a box of parts that, and i want to be precise about this, "found their way to me." sticks of ram, a couple of drives, one monitor that only has a slight haunting',
        'you look like a person who needs more ram. everybody needs more ram. $80 for a stick that retails triple that. no receipt, no warranty, no questions',
        'i wouldnt sell you garbage. probably. mostly. how good\'s your eye?',
      ],
      choices: [
        {
          tag: '[Business]',
          text: 'Inspect the lot cold — spot the dud before money changes hands.',
          req: { stat: 'money', gte: 80 },
          reqText: 'Requires $80',
          check: {
            skill: 'business',
            dc: 14,
            bonuses: [
              { if: { skill: 'hardware', gte: 30 }, add: 2, label: '+2 (you know silicon)' },
              { if: { background: 'tinkerer' }, add: 2, label: '+2 (you grew up elbow-deep in these)' },
            ],
            success: 'good_buy',
            fail: 'bad_buy',
            successEffects: [{ money: -80 }, { xp: 'hardware', add: 15 }, { clearFlag: 'ev_under.bought_a_dud' }, buff(freshRam(42, 1.08))],
            failEffects: [{ money: -80 }, { stat: 'mood', add: -4 }, { flag: 'ev_under.bought_a_dud' }, buff(FLAKY_RAM)],
          },
        },
        {
          text: 'Buy the cheapest stick on faith and hope for the best.',
          req: { stat: 'money', gte: 40 },
          reqText: 'Requires $40',
          effects: [
            { money: -40 },
            {
              chance: 0.5,
              then: [{ stat: 'mood', add: 3 }, { flag: 'ev_under.faith_paid_off' }, { clearFlag: 'ev_under.bought_a_dud' }, buff(freshRam(28, 1.05))],
              else: [{ stat: 'mood', add: -3 }, { flag: 'ev_under.bought_a_dud' }, { clearFlag: 'ev_under.faith_paid_off' }, buff(FLAKY_RAM)],
            },
          ],
          goto: 'faith',
        },
        {
          text: '"Not the RAM. The haunted monitor. I need to know."',
          req: { stat: 'money', gte: 15 },
          reqText: 'Requires $15',
          effects: [{ money: -15 }, { stat: 'mood', add: 5 }, { npc: 'switch', affinity: 2 }],
          goto: 'haunted',
        },
        { tag: '[Leave]', text: '"I\'ll buy my ghosts retail, thanks."', goto: 'pass' },
      ],
    },
    good_buy: {
      speaker: 'switch',
      text: 'damn. ok. you caught the bad stick before i even said anything. take the good one, and dont tell people i have a conscience. bad for business.',
    },
    bad_buy: {
      speaker: 'switch',
      text: [
        'sold. pleasure doing business.',
        'Three days later that stick starts throwing errors at 2 a.m., always in the middle of something long, and you realize which of you had the better eye.',
      ],
    },
    faith: {
      speaker: 'narrator',
      text: [
        'You hand over the cash and take the mystery stick home.',
        { if: { flag: 'ev_under.faith_paid_off' }, text: 'It boots first time and runs cool. Sometimes the universe rewards blind trust. You decide not to learn anything from this.', else: 'It boots. It crashes. It boots. It runs a whole afternoon and then crashes at the exact moment you forget to save. The universe has made its point.' },
      ],
    },
    haunted: {
      speaker: 'switch',
      text: 'ha. ok. it shows a faint picture of a sailboat even when it\'s off. just a sailboat. nobody knows whose. i\'ve had it two years and honestly i\'ll miss it. take care of him',
    },
    pass: {
      speaker: 'switch',
      text: 'your loss. somebody on the Row\'s gonna be very fast this month and it\'s not gonna be you',
    },
  },
}

const hotGear: EventDef = {
  id: 'ev_under_hot_gear',
  category: 'money',
  weight: 2,
  repeatable: true,
  cooldownDays: 130,
  when: { all: [actBetween(1, 3), around('switch'), { npc: 'switch', fateNot: ['sellout'] }] },
  effects: [snapshot('ev_under.bought_a_dud', 'ev_under.gear_prev_dud')],
  scene: 'ev_under_hot_gear_scene',
}

// ── ev_under_black_market_drop ────────────────────────────────────────────────
// A cash deal at a payphone for a one-of-a-kind (entirely fictional) relay box. Read the drop
// wrong and the market goes cold on you; buy blind while you're hot and it might be a setup.
const HUSHLINE: ItemDef = {
  id: 'ev_under_hushline',
  name: 'Hushline Relay',
  category: 'tool',
  shop: 'blackmarket',
  price: 900,
  unique: true,
  hidden: true,
  tier: 3,
  desc: 'A beige box the size of a paperback, hand-built by somebody who signs their solder joints. Nobody on the Row knows how it works. Everybody agrees it makes you harder to follow.',
  mods: [
    { key: 'trace', mult: 1.2 },
    { key: 'hack.heat', mult: 0.9 },
  ],
}

const MARKET_COLD: BuffDef = {
  id: 'ev_under_market_cold',
  name: 'Market Gone Cold',
  desc: 'Word on the Row is you spook sellers. Nobody will quote you a price until it blows over, and the good gigs go to other handles.',
  days: 35,
  bad: true,
  mods: [
    { key: 'cred.gain', mult: 0.8 },
    { key: 'freelance.pay', mult: 0.9 },
  ],
}

const dropScene: SceneDef = {
  id: 'ev_under_black_market_drop_scene',
  channel: 'chat',
  title: 'heard u want quiet',
  from: 'Tallyman',
  start: 'offer',
  expiresDays: 14,
  onExpire: [{ log: 'The Tallyman\'s offer went stale. Someone else is carrying his beige box now.', kind: 'info' }],
  nodes: {
    offer: {
      speaker: 'Tallyman',
      text: [
        'u dont know me. i know u. ppl say ur handle in rooms i sit in',
        'i build boxes. one box. the hushline. makes u sound like nobody in particular. $900, exact, cash. payphone on cannery & 5th, thursday, 11pm. come alone. dont be early. dont be late. dont be weird',
        '- T',
      ],
      choices: [
        {
          tag: '[OpSec]',
          text: 'Be early anyway. Watch the corner from the laundromat for an hour before you commit to anything.',
          check: {
            skill: 'opsec',
            dc: 15,
            bonuses: [
              { if: { trait: 'paranoid' }, add: 2, label: '+2 (paranoid)' },
              { if: { background: 'latchkey' }, add: 1, label: '+1 (you learned to read a street early)' },
              { if: { trait: 'ev_under_street_smart' }, add: 1, label: '+1 (street smart)' },
            ],
            success: 'clean_read',
            fail: 'spotted',
            successEffects: [{ xp: 'opsec', add: 25 }],
            failEffects: [{ stat: 'cred', add: -3 }, buff(MARKET_COLD), { flag: 'ev_under.spooked_the_tallyman' }],
          },
        },
        {
          tag: '[Business]',
          text: 'Page back first. Negotiate the price before you ever set foot on Cannery.',
          check: {
            skill: 'business',
            dc: 14,
            bonuses: [{ if: { stat: 'cred', gte: 35 }, add: 2, label: '+2 (your name carries weight)' }],
            success: 'haggled',
            fail: 'haggle_bad',
          },
        },
        {
          text: 'Show up on the dot with $900 in an envelope. No questions.',
          req: { stat: 'money', gte: 900 },
          reqText: 'Requires $900',
          effects: [
            { money: -900 },
            {
              if: { stat: 'heat', gte: 40 },
              then: [
                {
                  chance: 0.35,
                  then: [{ flag: 'ev_under.tallyman_sting' }, { stat: 'heat', add: 10 }, { complication: 'legal' }],
                  else: [{ item: 'ev_under_hushline' }, { flag: 'ev_under.bought_hushline' }],
                },
              ],
              else: [{ item: 'ev_under_hushline' }, { flag: 'ev_under.bought_hushline' }],
            },
          ],
          goto: 'blind',
        },
        { tag: '[Leave]', text: 'Delete the page. You don\'t buy things from people who know your handle before you know theirs.', effects: [{ stat: 'stress', add: -2 }], goto: 'declined' },
      ],
    },
    clean_read: {
      speaker: 'narrator',
      text: 'An hour of cold coffee in the laundromat window and you\'ve seen everything the corner has: two cabbies, a man walking a very old dog, and at 10:58 a nervous guy in a windbreaker who checks the payphone coin return four times. No parked cars with people in them. No one watching but you. The Tallyman is exactly what he said he is — scared, and good with a soldering iron.',
      choices: [
        {
          text: 'Walk over and pay his price. He earned it by being honest.',
          req: { stat: 'money', gte: 900 },
          reqText: 'Requires $900',
          effects: [{ money: -900 }, { item: 'ev_under_hushline' }, { flag: 'ev_under.bought_hushline' }, { stat: 'cred', add: 1 }],
          goto: 'bought',
        },
        {
          text: 'Walk over and let him see that you watched the whole hour. Then offer $650.',
          req: { stat: 'money', gte: 650 },
          reqText: 'Requires $650',
          effects: [{ money: -650 }, { item: 'ev_under_hushline' }, { flag: 'ev_under.bought_hushline' }],
          goto: 'bought_cheap',
        },
        { text: 'You\'ve seen enough to know he\'s real. You\'ve also seen enough to know you don\'t need him. Go home.', goto: 'declined' },
      ],
    },
    spotted: {
      speaker: 'Tallyman',
      text: [
        'saw u. in the laundromat. an HOUR. u think i dont look at windows?? i build boxes for ppl who look at windows',
        'deal off. and im telling everyone i sell to that {handle} watches corners like a cop. dont page me again',
        'By Sunday two other sellers have stopped answering you. The market on the Row is small, and it talks.',
      ],
    },
    haggled: {
      speaker: 'Tallyman',
      text: 'ok. ok. $600. ur a hard person. i respect hard people. thursday, 11. dont be weird',
      choices: [
        {
          text: 'Go on Thursday. Bring exactly $600.',
          req: { stat: 'money', gte: 600 },
          reqText: 'Requires $600',
          effects: [{ money: -600 }, { item: 'ev_under_hushline' }, { flag: 'ev_under.bought_hushline' }, { xp: 'business', add: 20 }],
          goto: 'bought_cheap',
        },
        { text: 'Now that you know the real price, you also know you can wait. Let it go.', goto: 'declined' },
      ],
    },
    haggle_bad: {
      speaker: 'Tallyman',
      text: 'no. u want to haggle, the price goes UP. $1200. also i dont like u now. thursday. or never. never is fine',
      choices: [
        {
          text: 'Pay the insult price. You want the box.',
          req: { stat: 'money', gte: 1200 },
          reqText: 'Requires $1,200',
          effects: [{ money: -1200 }, { item: 'ev_under_hushline' }, { flag: 'ev_under.bought_hushline' }, { stat: 'mood', add: -3 }],
          goto: 'bought',
        },
        { text: 'Never is fine.', effects: [{ stat: 'cred', add: -1 }], goto: 'declined' },
      ],
    },
    blind: {
      speaker: 'narrator',
      text: [
        { if: { flag: 'ev_under.tallyman_sting' }, text: 'Nobody in a windbreaker. The payphone rings at 11:00 exactly and a voice you don\'t know says "wrong corner, friend," and hangs up. Your envelope is gone from the ledge when you turn around. So is the car that was parked across the street with its engine running — and it takes you most of the walk home to realize it had been parked there all night, with two people in it who never once looked at the payphone.', else: 'A nervous man in a windbreaker, a paper bag, a nod. He counts the money twice without taking it out of the envelope. "Don\'t open it here," he says, and is gone before you can say anything back. The box inside is warm, beige, and signed in solder.' },
      ],
    },
    bought: {
      speaker: 'narrator',
      text: 'The box goes into your bag and then into your rig. The fan note changes. Something about your connection feels quieter, the way a room feels quieter after someone turns off a fridge you didn\'t know was running.',
    },
    bought_cheap: {
      speaker: 'Tallyman',
      text: 'ur going to be a problem for somebody. not me i hope. the box likes a cool room. dont drop it. dont tell anyone where u got it. -T',
    },
    declined: {
      speaker: 'narrator',
      text: 'Thursday comes and goes. At 11 p.m. you are somewhere else entirely, and a payphone on Cannery rings for nobody.',
    },
  },
}

const blackMarketDrop: EventDef = {
  id: 'ev_under_black_market_drop',
  category: 'money',
  weight: 2,
  when: { all: [actBetween(2, 3), { stat: 'cred', gte: 18 }, { not: { item: 'ev_under_hushline' } }, free] },
  scene: 'ev_under_black_market_drop_scene',
}

// ── ev_under_informant_rumor + "The Whisper in the Back Room" ─────────────────
const rumorScene: SceneDef = {
  id: 'ev_under_informant_rumor_scene',
  channel: 'dialog',
  title: 'Someone Is Talking',
  from: 'Sodium Row back room',
  pause: true,
  start: 'room',
  nodes: {
    room: {
      speaker: 'deadline',
      text: [
        'The back room is too quiet for a Friday. Deadline has the worst chair and both hands around a coffee gone cold.',
        '"Somebody\'s talking. A courier got picked up Tuesday and walked out Thursday, and that math only works one way." He looks at you, then at the door, then back. "\'94 started exactly like this. A funny feeling and a phone that clicked."',
        { if: { flag: 'fac.bureau.informant' }, text: '"And before you ask — no, I don\'t think it\'s you. If I did, we wouldn\'t be talking." Your stomach does something complicated. You keep your face very still.' },
        { if: { trait: 'ev_under_marked_snitch' }, text: 'He doesn\'t say the other thing. He doesn\'t have to. Half the room already thinks it\'s you.' },
      ],
      choices: [
        {
          tag: '[OpSec]',
          text: 'Quietly work out who got flipped — trace the timeline, not the person.',
          check: {
            skill: 'opsec',
            dc: 15,
            bonuses: [
              { if: { trait: 'paranoid' }, add: 2, label: '+2 (paranoia, finally useful)' },
              { if: { skill: 'intrusion', gte: 35 }, add: 1, label: '+1 (you know how they build a case)' },
            ],
            success: 'dig_ok',
            fail: 'dig_bad',
            successEffects: [{ quest: 'ev_under_q_who_talks', start: true }, { stat: 'cred', add: 1 }],
            failEffects: [{ complication: 'social' }, { stat: 'stress', add: 8 }, { stat: 'heat', add: 5 }, { flag: 'ev_under.rumor_mishandled' }],
          },
        },
        {
          tag: '[Social]',
          text: 'Read the room instead of the logs. Let people talk; guilt has a smell.',
          check: {
            skill: 'social',
            dc: 15,
            bonuses: [
              { if: { trait: 'empath' }, add: 2, label: '+2 (you feel the room)' },
              { if: { trait: 'hothead' }, add: -2, label: '−2 (you want someone to blame)' },
            ],
            success: 'dig_ok',
            fail: 'accuse_wrong',
            successEffects: [{ quest: 'ev_under_q_who_talks', start: true }, { faction: 'fac.loft', add: 1 }],
            failEffects: [
              { if: around('byteme'), then: [{ npc: 'byteme', affinity: -6 }] },
              { trait: 'ev_under_marked_snitch' },
              { faction: 'fac.loft', add: -3 },
              { flag: 'ev_under.accused_wrong' },
            ],
          },
        },
        {
          text: 'Call Reyes tonight and tell her to leave the courier alone — whatever it costs you on her side of the ledger.',
          if: { all: [{ flag: 'fac.bureau.informant' }, around('reyes')] },
          effects: [{ faction: 'fac.bureau', add: -4 }, { faction: 'fac.loft', add: 2 }, { npc: 'reyes', affinity: -2 }, { stat: 'stress', add: 6 }, { flag: 'ev_under.shielded_the_courier' }],
          goto: 'shielded',
        },
        {
          text: 'Lie low. Go dark, wait it out, let the storm pass over someone else.',
          effects: [buff(LYING_LOW), { stat: 'heat', add: -6 }, { faction: 'fac.loft', add: -1 }, { flag: 'ev_under.went_dark_on_rumor' }],
          goto: 'lay_low',
        },
        {
          text: '"You\'re seeing ghosts, old man. It\'s \'94 in your head, not the room."',
          effects: [{ npc: 'deadline', affinity: -4 }, { stat: 'mood', add: -2 }],
          goto: 'dismissed',
        },
      ],
    },
    dig_ok: {
      speaker: 'deadline',
      text: '"Good. Careful, though — the surest way to make an informant is to accuse an innocent one. Pull the thread. Don\'t yank it." He almost smiles. "You\'d have survived \'94, kid."',
    },
    dig_bad: {
      speaker: 'deadline',
      text: [
        'You go looking and someone notices you looking. By morning half the board thinks *you\'re* the one asking too many questions.',
        'Deadline calls you, voice low: "Whatever you touched, it touched back. Stay off the board a few days. And kid — when they ask, and they will, you were never curious about anything in your life."',
      ],
    },
    accuse_wrong: {
      speaker: 'narrator',
      text: [
        { if: around('byteme'), text: 'You point — quietly, just to Deadline — at the kid who\'s been jumpy all month. byteme. Of course byteme; byteme is jumpy every month. The whisper gets out anyway, because whispers always do, and the look on his face when he hears it is something you will be able to picture for a long time.', else: 'You point — quietly, just to Deadline — at the wrong person. The whisper gets out anyway, because whispers always do.' },
        'By the weekend the back room watches you the way you were watching everyone else. Somebody asks, not quite joking, whether your phone clicks too.',
      ],
    },
    shielded: {
      speaker: 'reyes',
      text: '"You\'re asking me to lose a lead to protect a kid who carries discs on a bike." A long pause on the line. "Fine. He\'s off the board. But understand what you just spent. The next time you need me to not look at something, I\'m going to remember that you already asked." She hangs up without saying goodbye, which she has never done before.',
    },
    lay_low: {
      speaker: 'narrator',
      text: 'You stop posting. You stop showing up. The board learns to spell your absence. The heat cools and so does everything else — but you\'re still here, and being still here is the whole game.',
    },
    dismissed: {
      speaker: 'deadline',
      text: '"Maybe." He drinks the cold coffee anyway. "I hope you\'re right. I was wrong once, in \'94. I only had to be wrong once."',
    },
  },
}

const whisperFollowup: SceneDef = {
  id: 'ev_under_whisper_followup_scene',
  channel: 'chat',
  title: 'i found it',
  from: 'deadline',
  start: 'reveal',
  nodes: {
    reveal: {
      speaker: 'deadline',
      text: [
        'it wasnt a rat. not really. a kid got scared, gave up a name to make a scary man stop talking, and hated himself the second he did it. thats all it ever is. scared people, not evil ones',
        'i had a word with him. quiet. he\'s going to be ok, and so is the courier, mostly',
        'you handled it right. you looked without pointing. thats the whole art of it. the scene owes you one it\'ll never say out loud',
      ],
      choices: [
        {
          text: '"Nobody gets burned for being scared. We look after our own."',
          effects: [{ faction: 'fac.loft', add: 3 }, { npc: 'deadline', affinity: 5 }, { trait: 'ev_under_street_smart' }, { flag: 'ev_under.whisper_resolved' }],
          goto: 'own',
        },
        {
          text: '"Keep his name to yourself. He doesn\'t need to be a story."',
          effects: [{ faction: 'fac.loft', add: 2 }, { npc: 'deadline', affinity: 4 }, { stat: 'cred', add: 2 }, { flag: 'ev_under.whisper_resolved' }],
          goto: 'quiet',
        },
        {
          text: '"Give me his name. I want to know who I can\'t trust."',
          effects: [{ npc: 'deadline', affinity: -3 }, { stat: 'cred', add: 1 }, { flag: 'ev_under.whisper_resolved' }, { flag: 'ev_under.wanted_the_name' }],
          goto: 'name',
        },
      ],
    },
    own: {
      speaker: 'deadline',
      text: 'thats the answer i was hoping for. you learned something tonight youll use for the rest of your life, and it wasnt about computers. go to bed',
    },
    quiet: {
      speaker: 'deadline',
      text: 'it stays with me then. and with the dog. the dog is very discreet',
    },
    name: {
      speaker: 'deadline',
      text: 'no. and thats the last lesson for tonight. the day you keep a list of who you cant trust is the day you start being the scary man. goodnight kid',
    },
  },
}

const whoTalksQuest: QuestDef = {
  id: 'ev_under_q_who_talks',
  title: 'The Whisper in the Back Room',
  kind: 'personal',
  act: 2,
  giver: 'deadline',
  priority: 5,
  rewards: 'The scene\'s quiet trust',
  summary: 'A courier got picked up and walked out too fast. Somebody talked. Find out who — without turning a scared kid into a marked one.',
  start: 'dig',
  stages: {
    dig: {
      text: 'You told Deadline you\'d find the leak. Pull the thread carefully; the fastest way to make an informant is to accuse an innocent one.',
      hint: 'Deadline will page you in a week or two, once you\'ve both worked it quietly. Watch your pager.',
      onEnter: [{ scene: 'ev_under_whisper_followup_scene', delayHours: 24 * 10 }],
      objectives: [
        {
          id: 'resolve',
          text: 'Hear what Deadline found',
          when: { flag: 'ev_under.whisper_resolved' },
          hint: 'Answer Deadline when he pages you with what he found.',
        },
      ],
      onComplete: [{ log: 'The whisper is settled. No one got burned. The scene remembers that, even if it never says so.', kind: 'story' }],
    },
  },
}

const informantRumor: EventDef = {
  id: 'ev_under_informant_rumor',
  category: 'underground',
  weight: 2,
  when: { all: [actGte(2), darkTurn, boardLive, around('deadline'), { day: true, gte: 760 }, free] },
  scene: 'ev_under_informant_rumor_scene',
}

// ── ev_under_heat_relief_alibi ────────────────────────────────────────────────
// A repeatable heat-relief opportunity brokered by Deadline. Price scales with the act.
const ALIBI_COUNT = 'ev_under.alibi_count'

const alibiScene: SceneDef = {
  id: 'ev_under_alibi_scene',
  channel: 'dialog',
  title: 'An Alibi, If You Want One',
  from: 'Sodium Row back room',
  start: 'offer',
  nodes: {
    offer: {
      speaker: 'deadline',
      text: [
        { if: { var: ALIBI_COUNT, lte: 1 }, text: '"You\'re running warm, kid. I can smell it on you, and if I can, so can they."', else: '"Warm again." He doesn\'t make it a question. "You know I can\'t keep doing this forever. The liars I use are getting old. So am I."' },
        'Deadline taps the number written on the inside of his wrist. "There\'s a way to cool off. A few of us vouch you were somewhere boring on the nights that matter. A witness or two, a receipt from a place that remembers you. Costs a favour and a little cash. Cheaper than a lawyer. Much cheaper than a cell."',
        { if: { trait: 'ev_under_known_to_police' }, text: '"Won\'t lie to you: with your name already in a folder, it won\'t take as well. They remember you."' },
      ],
      choices: [
        {
          text: 'Take the brokered alibi. Pay the favour, take the cool-down.',
          if: actIs(2),
          req: { stat: 'money', gte: 300 },
          reqText: 'Requires $300',
          effects: [{ money: -300 }, { stat: 'heat', add: -18 }, { stat: 'cred', add: -1 }, { npc: 'deadline', affinity: 2 }, { flag: 'ev_under.used_alibi' }],
          goto: 'brokered',
        },
        {
          text: 'Take the brokered alibi. The liars cost more these days.',
          if: actGte(3),
          req: { stat: 'money', gte: 1200 },
          reqText: 'Requires $1,200',
          effects: [{ money: -1200 }, { stat: 'heat', add: -20 }, { stat: 'cred', add: -1 }, { npc: 'deadline', affinity: 2 }, { flag: 'ev_under.used_alibi' }],
          goto: 'brokered',
        },
        {
          tag: '[OpSec]',
          text: 'Do it clean and cheap yourself — he just points, you build the cover.',
          check: {
            skill: 'opsec',
            dc: 16,
            bonuses: [
              { if: { trait: 'paranoid' }, add: 2, label: '+2 (paranoid)' },
              { if: { item: 'sw_anon_os' }, add: 1, label: '+1 (a clean live disc)' },
              { if: { trait: 'ev_under_known_to_police' }, add: -2, label: '−2 (they already know your name)' },
            ],
            success: 'clean_ok',
            fail: 'clean_bad',
            successEffects: [{ money: -60 }, { stat: 'heat', add: -20 }, { xp: 'opsec', add: 25 }],
            failEffects: [{ money: -60 }, { stat: 'heat', add: 6 }, { complication: 'legal' }, { flag: 'ev_under.alibi_backfired' }],
          },
        },
        {
          text: 'Just go quiet on your own. No favours owed.',
          effects: [buff(LYING_LOW), { stat: 'heat', add: -8 }],
          goto: 'quiet',
        },
        { tag: '[Leave]', text: '"I\'ll ride it out loud. Heat\'s just weather."', effects: [{ stat: 'cred', add: 1 }, { npc: 'deadline', affinity: -1 }], goto: 'loud' },
      ],
    },
    brokered: {
      speaker: 'deadline',
      text: '"Done. You were at a very boring card game with three very reliable liars. Go home, sleep, stop looking over your shoulder for a week." He means it kindly. He always does.',
    },
    clean_ok: {
      speaker: 'narrator',
      text: 'You build your own cover, tidy and deniable, and Deadline watches you do it with the quiet pride of a man seeing his own tricks done better. The heat bleeds off. Nobody owns a piece of you for it.',
    },
    clean_bad: {
      speaker: 'deadline',
      text: '"Kid." A long breath. "You built a cover with a hole in it, and somebody already looked through the hole. Now there\'s a real question with your name on it." He writes a lawyer\'s number on a napkin. "Just in case. Call her before you call me."',
    },
    quiet: {
      speaker: 'narrator',
      text: 'No brokers, no favours. You just disappear for a while, and the heat forgets you a little. It\'s slower this way. It\'s also nobody\'s business but yours.',
    },
    loud: {
      speaker: 'deadline',
      text: '"Weather." He laughs without any fun in it. "I said that once. Word for word. Back up your life, kid, not your data." He goes back to his coffee.',
    },
  },
}

const heatReliefAlibi: EventDef = {
  id: 'ev_under_heat_relief_alibi',
  category: 'underground',
  weight: 3,
  repeatable: true,
  cooldownDays: 90,
  when: { all: [actGte(2), { stat: 'heat', gte: 38 }, around('deadline'), { faction: 'fac.loft', gte: 20 }, boardLive, free] },
  effects: [bump(ALIBI_COUNT)],
  scene: 'ev_under_alibi_scene',
}

// ── ev_under_aperture_envoy ───────────────────────────────────────────────────
// A quiet suit makes a side offer. Reads faction rep; never Kroll/Hollis themselves (a cutout).
const envoyScene: SceneDef = {
  id: 'ev_under_aperture_envoy_scene',
  channel: 'dialog',
  title: 'The Suit at the Counter',
  from: 'The Cathode Diner',
  pause: true,
  start: 'booth',
  nodes: {
    booth: {
      speaker: 'Brightline courier',
      text: [
        'The suit is too clean for the Cathode. He orders coffee he doesn\'t drink and slides a business card face-down across the counter: BRIGHTLINE DIRECT — DATA SERVICES. No name.',
        '"A mutual acquaintance says you\'re discreet and good. We have overflow work. A folder needs tidying. It pays four figures and it never happened."',
        { if: { faction: 'fac.aperture', gte: 20 }, text: '"You already know the shape of this. Same as the retainer, just off the books, just this once." He smiles like a closing door.' },
        { if: { faction: 'fac.loft', gte: 50 }, text: 'You know exactly who "Brightline" cuts its cheques for. The card practically smells of the Millgate lobby fountain.' },
        { if: { stat: 'money', lte: 300 }, text: 'Your rent is due Friday. He can probably tell. He probably knew before he sat down.' },
      ],
      choices: [
        {
          text: 'Take the folder. Money is money and the rent is the rent.',
          effects: [
            { money: 1400 },
            { stat: 'heat', add: 6 },
            { faction: 'fac.aperture', add: 4 },
            { faction: 'fac.loft', add: -3 },
            { flag: 'ev_under.took_brightline' },
          ],
          goto: 'took',
        },
        {
          tag: '[Business]',
          text: '"Overflow means you\'re short-handed. That\'s not a four-figure problem. Let\'s talk more."',
          check: {
            skill: 'business',
            dc: 17,
            bonuses: [
              { if: { faction: 'fac.aperture', gte: 20 }, add: 2, label: '+2 (they already value you)' },
              { if: { trait: 'silver_tongue' }, add: 1, label: '+1 (silver tongue)' },
            ],
            success: 'squeeze_ok',
            fail: 'squeeze_bad',
          },
        },
        {
          text: '"Tell your acquaintance I don\'t do laundry." Slide the card back.',
          effects: [{ faction: 'fac.loft', add: 3 }, { stat: 'cred', add: 2 }, { faction: 'fac.aperture', add: -2 }, { flag: 'ev_under.refused_brightline' }],
          goto: 'refused',
        },
        {
          text: 'Take the card, note the car he leaves in, and decide later.',
          if: { faction: 'fac.loft', gte: 30 },
          effects: [{ stat: 'cred', add: 1 }, { flag: 'ev_under.brightline_watched' }],
          goto: 'watched',
        },
      ],
    },
    took: {
      speaker: 'narrator',
      text: 'The folder is thin and heavy at once — a stranger\'s whole life, ironed flat into columns. You do the work. The money lands clean. Something on Sodium Row goes a degree colder toward you, and you tell yourself you can\'t feel it.',
    },
    squeeze_ok: {
      speaker: 'Brightline courier',
      text: '"...Three." The smile doesn\'t change but something behind it recalculates you. "We\'ll be in touch. People who know their price are so much easier to keep."',
      effects: [{ money: 3200 }, { stat: 'heat', add: 8 }, { faction: 'fac.aperture', add: 5 }, { faction: 'fac.loft', add: -4 }, { flag: 'ev_under.took_brightline' }],
    },
    squeeze_bad: {
      speaker: 'Brightline courier',
      text: [
        '"Four figures was the offer. And now I\'m told you\'re difficult." He takes the card back. "Difficult is a note in a file, friend. We keep excellent files."',
        'He leaves exact change for the coffee. Somewhere in Millgate, a note gets typed.',
      ],
      effects: [{ faction: 'fac.aperture', add: -3 }, { flag: 'ev_under.brightline_noted' }, { stat: 'stress', add: 5 }, buff({ id: 'ev_under_being_watched', name: 'Being Watched', desc: 'A grey car has been parked on your block three mornings running. It is probably nothing. It is making you careful and tired.', days: 28, bad: true, mods: [{ key: 'stress.gain', mult: 1.1 }, { key: 'hack.heat', mult: 1.1 }] })],
    },
    refused: {
      speaker: 'narrator',
      text: [
        'He pockets the card without a flicker, leaves the untouched coffee and a tip too large to be human, and is gone.',
        { if: { var: 'w.cathode_open', eq: 1 }, text: 'Sal watches him go and quietly refills your cup for free. "Good," is all he says.' },
      ],
    },
    watched: {
      speaker: 'narrator',
      text: 'He drives a car the Row could never afford, and you have a face now, and a name for the shape of the thing. Not a weapon. Not yet. Just a card you didn\'t throw away.',
    },
  },
}

const apertureEnvoy: EventDef = {
  id: 'ev_under_aperture_envoy',
  category: 'underground',
  weight: 2,
  when: { all: [actGte(2), darkTurn, { day: true, gte: 820 }, { flag: 'w.aperture_state', eq: 'thriving' }, free] },
  scene: 'ev_under_aperture_envoy_scene',
}

export default defineContent({
  items: [HUSHLINE],
  events: [lanParty, hotGear, blackMarketDrop, informantRumor, heatReliefAlibi, apertureEnvoy],
  quests: [whoTalksQuest],
  scenes: [lanScene, hotGearScene, dropScene, rumorScene, whisperFollowup, alibiScene, envoyScene],
})
