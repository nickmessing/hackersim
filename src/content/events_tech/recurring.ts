/**
 * events_tech — RECURRING beats (repeatable with cooldowns). Each one reads the calendar and your
 * history so the familiar shape lands differently every time it comes round:
 *
 *   ev_tech_isp_overage         money   dial-up only   "Unlimited*" hours bill; haggle, blame, or owe
 *   ev_tech_chain_mail          era     Acts I–III     FW: FW: FW: — debunk it, or start a reply-all storm
 *   ev_tech_family_tech_support family  whole game     the family help desk, four eras of the same call
 *   ev_tech_update_reboot       tech    whole game     "Your computer will restart in 10:00"
 *   ev_tech_drive_click         tech    whole game     the click of death; backups or grief
 *   ev_tech_social_network      era     2003+          FriendFold → Pagelet → Roster, each with its own drama
 *   ev_tech_ghost_online        weird   whole game     a buddy who can't be online signs on for four seconds
 *   ev_tech_raid_night          life    Embermoor      the 2 a.m. guild raid (unlocked by the midnight launch)
 *
 * HARD RULE: every "fix" here is invented flavor — no real commands, tools, products or techniques.
 */
import { dayOf } from '@/engine/calendar'
import { defineContent } from '@/engine/registry'
import type { Cond, Effect, EventDef, SceneDef } from '@/engine/types'
import {
  FAMILY_HERO,
  LOST_WORK,
  ONE_MORE_QUEST,
  ROOTED,
  SETTLED,
  SPOOKED,
  actLte,
  around,
  buff,
  employed,
  free,
  inRelationship,
  momHere,
  onDialup,
  owe,
  together,
} from './_shared'

// ── Era boundaries used by the variants ────────────────────────────────────────
const D2003 = dayOf(2003, 0, 1)
const D2006 = dayOf(2006, 0, 1)
const D2009 = dayOf(2009, 0, 1)
const PAGELET_DAY = dayOf(2005, 5, 1)
const ROSTER_DAY = dayOf(2008, 2, 1)

/** Strictly before calendar day `d`. */
const before = (d: number): Cond => ({ day: true, lte: d - 1 })
/** On or after calendar day `d`. */
const since = (d: number): Cond => ({ day: true, gte: d })
/** In [lo, hi). */
const era = (lo: number, hi: number): Cond => ({ all: [since(lo), before(hi)] })

const atHome: Cond = { housing: 'parents_flat' }

// ── Repeat counters ────────────────────────────────────────────────────────────
// Every recurring beat bumps its own counter when it fires (event effects land before the scene
// renders, so the first showing reads 1). The counter caps how often a beat can come round and
// lets the text notice that it has been here before.
type Counter = `ev_tech.${string}_n`
const bump = (v: Counter): Effect => ({ var: v, add: 1 })
/** Fewer than `n` showings so far. */
const under = (v: Counter, n: number): Cond => ({ var: v, lte: n - 1 })
/** This is at least the `n`th showing. */
const nth = (v: Counter, n: number): Cond => ({ var: v, gte: n })
/** Exactly the `n`th showing. */
const nthIs = (v: Counter, n: number): Cond => ({ var: v, eq: n })

// ─────────────────────────────────────────────────────────────────────────────
// ev_tech_isp_overage — NorthLink "Unlimited*"
// ─────────────────────────────────────────────────────────────────────────────
const ispOverageScene: SceneDef = {
  id: 'ev_tech_isp_overage_scene',
  channel: 'mail',
  title: 'Your NorthLink Unlimited* statement',
  from: 'NorthLink Billing',
  start: 'bill',
  expiresDays: 21,
  onExpire: [owe('ev_tech_isp_late', 'NorthLink overage + late fees', 2, 60), { stat: 'stress', add: 3 }],
  nodes: {
    bill: {
      speaker: 'NorthLink Billing',
      text: [
        'Dear Valued Member,\n\nThank you for choosing NorthLink Unlimited*, Port Lumen\'s friendliest way online! Our records show 212 hours of connection this billing period. Your plan includes 150 hours.\n\nOverage: 62 hrs × $1.40 = $86.80, due on receipt.\n\n*"Unlimited" refers to the enthusiasm of our support staff.',
        { if: { all: [{ flag: 'ev_tech.overage_seen' }, nthIs('ev_tech.isp_n', 2)] }, text: 'It is not your first one of these. The letterhead has started to feel like an old acquaintance who only calls when he needs money.' },
        { if: nth('ev_tech.isp_n', 3), text: 'The third one. NorthLink has started enclosing a glossy leaflet titled "Is Unlimited* Right For You?", which is the closest a phone company has ever come to an intervention.' },
        { if: atHome, text: 'The bill is addressed to your father. It is lying open on the kitchen table, flattened under the salt shaker like evidence at a trial.' },
        'Two hundred and twelve hours. You would like to argue with that number. You cannot, in good conscience, argue with that number.',
      ],
      choices: [
        {
          tag: '[Business]',
          text: 'Call the retention line. "I\'m thinking of switching to the competition."',
          check: {
            skill: 'business',
            dc: 12,
            bonuses: [
              { if: { trait: 'silver_tongue' }, add: 2, label: '+2 (silver tongue)' },
              { if: { background: 'class_clown' }, add: 1, label: '+1 (you can talk to anyone)' },
            ],
            success: 'waived',
            fail: 'upsold',
            successEffects: [{ xp: 'business', add: 20 }, { stat: 'mood', add: 3 }, { flag: 'ev_tech.overage_seen' }],
            failEffects: [{ stat: 'stress', add: 4 }, { flag: 'ev_tech.overage_seen' }],
          },
        },
        {
          text: 'Pay it. Eighty-seven dollars of pure shame.',
          effects: [{ money: -87 }, { flag: 'ev_tech.overage_seen' }, { if: atHome, then: [{ npc: 'dad', affinity: 2 }] }],
          goto: 'paid',
        },
        {
          if: { all: [atHome, around('kim')] },
          tag: '[Lie]',
          text: '"Kim was on it all night. Some chat room about a boy band."',
          check: {
            skill: 'social',
            dc: 12,
            bonuses: [{ if: { trait: 'silver_tongue' }, add: 2, label: '+2 (silver tongue)' }],
            success: 'blame_ok',
            fail: 'blame_bad',
            successEffects: [{ npc: 'kim', affinity: -4 }, { flag: 'ev_tech.overage_seen' }],
            failEffects: [{ npc: 'dad', affinity: -3 }, { npc: 'kim', affinity: -2 }, { money: -87 }, { flag: 'ev_tech.overage_seen' }],
          },
        },
        {
          tag: '[Intrusion]',
          text: '"Correct" the meter from the inside. Two hundred and twelve looks a lot like one-forty-nine.',
          req: { skill: 'intrusion', gte: 15 },
          reqText: 'Requires Intrusion 15',
          effects: [
            { stat: 'heat', add: 4 },
            { stat: 'cred', add: 1 },
            { flag: 'ev_tech.overage_seen' },
            { flag: 'ev_tech.fixed_the_meter' },
            { chance: 0.3, then: [{ complication: 'hack', tier: 1 }] },
          ],
          goto: 'meter',
        },
      ],
    },
    waived: {
      speaker: 'NorthLink Billing',
      text: [
        'The retention rep has a voice like warm milk and a script with a branch for exactly you. "I\'m seeing a loyal member since 2001. Let me go ahead and waive that overage, and I\'ll add a courtesy month on us."',
        'You hang up feeling like you won something. You did. You also feel slightly handled, which is the retention team\'s whole art.',
      ],
    },
    upsold: {
      speaker: 'NorthLink Billing',
      text: [
        'Forty minutes later you hang up with the bill intact, a "Premium Unlimited*" upgrade you do not remember agreeing to, and a free NorthLink mouse pad in the mail.',
        'The upgrade costs a dollar a day for two months. The mouse pad is very nice. You have been beaten by a professional.',
      ],
      effects: [owe('ev_tech_isp_premium', 'NorthLink Premium Unlimited* (you did not want this)', 1, 60), { money: -87 }],
    },
    paid: {
      speaker: 'narrator',
      text: [
        'You pay it. You tape a sheet of paper over the modem that says HOURS in your own handwriting and underline it twice.',
        { if: atHome, text: 'Your father sees the receipt, nods once, and says nothing, which from him is a standing ovation.' },
      ],
    },
    blame_ok: {
      speaker: 'dad',
      text: [
        '"KIM." Your father\'s voice goes down the hall like a freight train. You hear a door open, a protest, a long explanation about how she was on the phone with Jess, on the actual phone, the whole time.',
        'It works. Kim looks at you across dinner with the flat, patient eyes of someone who will remember this at your wedding.',
      ],
    },
    blame_bad: {
      speaker: 'dad',
      text: [
        '"Kim doesn\'t know what a chat room is." He holds up the bill. "Kim didn\'t log on at four in the morning on a school night. Four in the morning, twelve days running."',
        'You pay it. You also lose the phone line after 11 p.m. for the foreseeable future, and Kim is going to bring this up at your funeral.',
      ],
      effects: [
        buff({
          id: 'ev_tech_line_curfew',
          name: 'Phone-Line Curfew',
          desc: 'No modem after 11 p.m. under your father\'s roof. You are getting a lot of sleep and very little done.',
          days: 21,
          bad: true,
          mods: [{ key: 'hack.speed', mult: 0.9 }, { key: 'freelance.speed', mult: 0.9 }, { key: 'energy.regen', mult: 1.05 }],
        }),
      ],
    },
    meter: {
      speaker: 'narrator',
      text: [
        'The billing box at NorthLink is held together with default settings and hope. You nudge a number. The next statement says 149 hours, and a little flag in a log somewhere says someone nudged it.',
        'Probably nobody reads that log. Probably.',
      ],
    },
  },
}

const ispOverage: EventDef = {
  id: 'ev_tech_isp_overage',
  category: 'money',
  weight: 2,
  repeatable: true,
  cooldownDays: 240,
  when: { all: [onDialup, { day: true, gte: 21 }, actLte(2), free, under('ev_tech.isp_n', 3)] },
  scene: 'ev_tech_isp_overage_scene',
  effects: [bump('ev_tech.isp_n')],
}

// ─────────────────────────────────────────────────────────────────────────────
// ev_tech_chain_mail — FW: FW: FW:
// ─────────────────────────────────────────────────────────────────────────────
const chainMailScene: SceneDef = {
  id: 'ev_tech_chain_mail_scene',
  channel: 'mail',
  title: 'FW: FW: FW: FW: fwd: READ THIS BEFORE IT IS TOO LATE!!!',
  from: 'Cannery Row Neighbors List',
  start: 'mail',
  expiresDays: 14,
  nodes: {
    mail: {
      speaker: 'Cannery Row Neighbors List',
      text: [
        { if: around('grandma_ruth'), text: 'Forwarded by {npc:grandma_ruth}, who forwards everything, with the note: "IS THIS TRUE?? sending just in case. Love, R."', else: 'Forwarded by someone\'s aunt on the Row list, with the note: "sending just in case!!!"' },
        { if: before(D2003), text: '"CasementSoft is testing a new e-mail tracking program and will PAY YOU $5.00 for every person you forward this to!!! My cousin\'s lawyer got a check for $2,340!!! This is NOT a hoax, I checked!!!"' },
        { if: era(D2003, D2006), text: '"WARNING!!! A new virus called TEDDY BEAR is hiding on your computer RIGHT NOW. Look for a file called BRUIN.SYS with a little bear on it and DELETE IT. Your antivirus CANNOT see it!!! Forward to everyone you love!!!"' },
        { if: era(D2006, D2009), text: '"Next week ALL CELL PHONE NUMBERS are being released to telemarketers!!! You have until Friday to call this number and opt out. Forward to everyone before it\'s too late!!!"' },
        { if: since(D2009), text: '"Starting Monday, ROSTER will OWN ALL YOUR PHOTOS unless you copy and paste this legal notice onto your profile: I DO NOT GIVE ROSTER PERMISSION to use my pictures, per the Statute of Port Lumen, Article 12..."' },
        'The CC line is 212 addresses long. It includes the church choir, the pizza place, two people who died in 1999, and — halfway down, between the choir and the pizza — the address you use on the Loft.',
        { if: { flag: 'ev_tech.reply_all_storm' }, text: 'The list moderator has added a line to the footer since last time: "PLEASE DO NOT REPLY ALL. You know who you are."' },
        { if: nthIs('ev_tech.chain_n', 2), text: 'It is a different panic from the last one and exactly the same email. Chain letters on the Row do not die; they molt.' },
        { if: nth('ev_tech.chain_n', 3), text: 'Somewhere in the quoted history, forty forwards down, you can see the fossil of the last one of these, and your own reply to it, still politely explaining. Nobody read it then either.' },
      ],
      choices: [
        {
          tag: '[Social]',
          text: 'Reply-all with a gentle, funny debunk that nobody can be embarrassed by.',
          check: {
            skill: 'social',
            dc: 12,
            bonuses: [
              { if: { trait: 'silver_tongue' }, add: 2, label: '+2 (silver tongue)' },
              { if: { background: 'class_clown' }, add: 2, label: '+2 (you know how to work a room)' },
              { if: { flag: 'ev_tech.reply_all_storm' }, add: -2, label: '−2 (they remember last time)' },
            ],
            success: 'debunk_win',
            fail: 'storm',
            successEffects: [{ faction: 'fac.hood', add: 2 }, { stat: 'mood', add: 3 }, { xp: 'social', add: 20 }, { flag: 'ev_tech.row_it_guy' }],
            failEffects: [
              { faction: 'fac.hood', add: -3 },
              { stat: 'stress', add: 5 },
              { flag: 'ev_tech.reply_all_storm' },
              { chance: 0.35, then: [{ complication: 'social' }] },
            ],
          },
        },
        {
          text: 'Reply privately, kindly, to the one who sent it.',
          effects: [
            { stat: 'mood', add: 1 },
            { if: around('grandma_ruth'), then: [{ npc: 'grandma_ruth', affinity: 3 }], else: [{ faction: 'fac.hood', add: 1 }] },
          ],
          goto: 'private',
        },
        {
          tag: '[OpSec]',
          text: 'Forget the hoax. Your Loft address is in that CC line. Get it out of every inbox it landed in.',
          check: {
            skill: 'opsec',
            dc: 13,
            bonuses: [
              { if: { trait: 'paranoid' }, add: 2, label: '+2 (paranoid)' },
              { if: { background: 'latchkey' }, add: 1, label: '+1 (latchkey instincts)' },
            ],
            success: 'scrubbed',
            fail: 'leaked',
            successEffects: [{ stat: 'heat', add: -2 }, { xp: 'opsec', add: 20 }],
            failEffects: [{ stat: 'heat', add: 4 }, { stat: 'cred', add: -1 }, { faction: 'fac.loft', add: -1 }, { flag: 'ev_tech.handle_leaked' }],
          },
        },
        {
          if: around('jax'),
          text: 'Forward it to Jax with "WE\'RE GONNA BE RICH."',
          effects: [{ npc: 'jax', affinity: 2 }, { stat: 'mood', add: 3 }],
          goto: 'jax',
        },
        { tag: '[Leave]', text: 'Delete. You have been forwarded this exact email before.', effects: [{ stat: 'stress', add: -1 }] },
      ],
    },
    debunk_win: {
      speaker: 'narrator',
      text: [
        'You write four lines, a joke about your own cousin\'s lawyer, and a link to the hoax-busting page. By evening there are nine replies. Seven say "LOL thank you." One says "I knew it." One, from the pizza place, offers you a coupon.',
        'By the weekend, three different neighbors have asked you to "look at" their computers. You have become, without applying, the Row\'s IT guy.',
      ],
    },
    storm: {
      speaker: 'narrator',
      text: [
        'Your reply-all is funny. It is also the spark. Within an hour, someone replies-all to ask to be removed. Forty people reply-all to say STOP REPLYING ALL. The choir director replies-all with a hymn.',
        'By midnight the list server has sent 11,000 messages and fallen over. The moderator bans the one address that started it. It is yours. Mrs. Pell from 4B tells the laundromat you "broke the email."',
      ],
      choices: [
        {
          text: 'Write the moderator a real apology, by hand, and slip it under her door.',
          effects: [{ faction: 'fac.hood', add: 1 }, { stat: 'stress', add: -2 }],
          goto: 'storm_sorry',
        },
        { text: 'Unsubscribe from the Row list forever. It was always too many emails anyway.', effects: [{ stat: 'mood', add: -2 }] },
      ],
    },
    storm_sorry: {
      speaker: 'narrator',
      text: 'The moderator reinstates you a week later with a note: "Apology accepted. Your reply was genuinely funny, which is the problem." You are on probation. The Row has a long memory and a short list.',
    },
    private: {
      speaker: 'narrator',
      text: [
        '"Oh, thank goodness," comes the reply, within the minute. "I thought it was probably silly but what if it wasn\'t." Then a second message: "Can you look at my printer sometime?"',
        'It is always the printer.',
      ],
    },
    scrubbed: {
      speaker: 'narrator',
      text: 'It takes a long, dull evening — a polite note to the moderator, a friendly word to three forwarders, a scrubbed signature, a new address for the Loft. By morning your handle and your real name are strangers again. They should stay that way.',
    },
    leaked: {
      speaker: 'narrator',
      text: [
        'You chase it, and chasing it is what gets it noticed. A neighbor replies-all: "why is {handle} in here, is that a hacker name??" Someone else: "that\'s the Tan kid, I think."',
        'Your handle and your street are now in the same thread, archived on a list server run by a man who has never deleted anything in his life.',
      ],
    },
    jax: {
      speaker: 'jax',
      text: 'JaxAttack: DUDE. forwarded to 40 ppl. my mom forwarded it to HER 40 ppl. we are going to be SO rich. first thing i buy is a hovercraft',
    },
  },
}

const chainMail: EventDef = {
  id: 'ev_tech_chain_mail',
  category: 'era',
  weight: 2,
  repeatable: true,
  cooldownDays: 280,
  when: { all: [{ day: true, gte: 14 }, actLte(3), free, under('ev_tech.chain_n', 4)] },
  scene: 'ev_tech_chain_mail_scene',
  effects: [bump('ev_tech.chain_n')],
}

// ─────────────────────────────────────────────────────────────────────────────
// ev_tech_family_tech_support — the family help desk
// ─────────────────────────────────────────────────────────────────────────────
const familyHelpScene: SceneDef = {
  id: 'ev_tech_family_tech_support_scene',
  channel: 'mail',
  title: 'the computer is doing the thing again',
  from: 'Home',
  start: 'call',
  expiresDays: 14,
  onExpire: [{ if: momHere, then: [{ npc: 'mom', affinity: -2 }], else: [{ npc: 'dad', affinity: -2 }] }],
  nodes: {
    call: {
      speaker: 'Home',
      text: [
        { if: atHome, text: 'An email arrives from the next room. Subject in all capitals. You could hear the keyboard through the wall.' },
        { if: { all: [before(D2003), momHere] }, text: 'From Mom: "A WINDOW SAYS THE COMPUTER HAS 1,437 VIRUSES. IT SAYS SPEEDDOCTOR 2002 PRO WILL FIX THEM FOR $49.95. I HAVE TYPED IN HALF OF THE CARD NUMBER. IS THIS NORMAL. DON\'T TELL YOUR FATHER."' },
        { if: { all: [before(D2003), { not: momHere }] }, text: 'From Dad: "A window says the computer has 1,437 viruses and wants $49.95 to fix it. I have not paid it. I have not closed it either. It is flashing."' },
        { if: era(D2003, D2006), text: 'From Dad: "The internet is broken. All of it. The little blue globe is gone and Kim says it isn\'t her fault. Also there are now five search bars at the top of the screen and one of them is talking."' },
        { if: era(D2006, D2009), text: 'From Mom, or possibly Dad on Mom\'s account: "ALL OF THE PHOTOS FROM THE CAMERA ARE GONE. The ones from the beach. The ones of the cake. I plugged it in and the computer ate them. Please call."' },
        { if: since(D2009), text: 'From Dad: "The new phone is too smart. It keeps telling everyone on the Row where I am. Also my ringtone is an air horn now and I cannot find the button. I am in the hardware store. People are staring."' },
        { if: nthIs('ev_tech.family_help_n', 1), text: 'You know this email. You have received this email in some form every season since you learned what a modem was. It is less a request than a sacrament.' },
        { if: nthIs('ev_tech.family_help_n', 2), text: 'The last time you fixed it, you left a sticky note on the monitor: DO NOT CLICK THE FLASHING THINGS. The sticky note is still there. It has, you suspect, been clicked.' },
        { if: nthIs('ev_tech.family_help_n', 3), text: 'There is a folder on your own desktop now called "home_fixes," with notes in it, like a doctor keeping a chart on a patient who will not stop eating gravel.' },
        { if: nth('ev_tech.family_help_n', 4), text: 'You have been the family help desk for years now. The problems change with the decade. The capital letters never do. Somewhere along the line it stopped feeling like a chore and started feeling like the way they say they miss you.' },
      ],
      choices: [
        {
          tag: '[Systems]',
          text: 'Talk them through it over the phone. Slowly. Using no words longer than "click."',
          check: {
            skill: 'systems',
            dc: 12,
            bonuses: [
              { if: { background: 'tinkerer' }, add: 2, label: '+2 (you grew up fixing things)' },
              { if: { flag: 'ev_tech.row_it_guy' }, add: 2, label: '+2 (you do this for the whole Row)' },
              { if: { trait: 'empath' }, add: 1, label: '+1 (you can hear when they are about to panic)' },
            ],
            success: 'phone_fix',
            fail: 'phone_fail',
            successEffects: [buff(FAMILY_HERO), { xp: 'systems', add: 20 }, { if: momHere, then: [{ npc: 'mom', affinity: 3 }], else: [{ npc: 'dad', affinity: 3 }] }],
            failEffects: [{ stat: 'stress', add: 5 }],
          },
        },
        {
          text: 'Go over in person. Bring nothing but patience and an appetite.',
          effects: [
            { stat: 'energy', add: -12 },
            { stat: 'mood', add: 4 },
            { stat: 'health', add: 2 },
            buff(FAMILY_HERO),
            { if: momHere, then: [{ npc: 'mom', affinity: 4 }] },
            { if: around('dad'), then: [{ npc: 'dad', affinity: 3 }] },
          ],
          goto: 'in_person',
        },
        {
          if: { all: [around('kim'), since(D2003)] },
          text: 'Get Kim to do it. She lives there. She knows things.',
          effects: [{ money: -20 }, { npc: 'kim', affinity: 2 }],
          goto: 'kim',
        },
        {
          text: '"Unplug it. From the wall. Walk away slowly."',
          effects: [{ if: momHere, then: [{ npc: 'mom', affinity: -1 }], else: [{ npc: 'dad', affinity: -1 }] }],
          goto: 'unplug',
        },
      ],
    },
    phone_fix: {
      speaker: 'narrator',
      text: [
        'It takes fifty minutes, two "no, the OTHER left," and one long silence in which you are certain they have wandered off to make tea. But it works.',
        { if: before(D2003), text: 'The SpeedDoctor window is closed, the half-typed card number is deleted, and your mother knows, now, that a window which shouts about viruses is the virus.' },
        { if: era(D2003, D2006), text: 'The little blue globe is back. Four of the five search bars are gone. The fifth one you leave, because Dad has named it "Gerald" and grown attached.' },
        { if: era(D2006, D2009), text: 'The beach photos were never gone. They were in a folder with a name like a license plate. Mom cries a little when the cake loads.' },
        { if: since(D2009), text: 'The air horn is now a gentle chime. Dad\'s location is shared with exactly one person, and it is Mom, who says she has always known where he was anyway.' },
        { if: around('kim'), text: 'A plate of food arrives by way of Kim the next time you pass by, with a note: "from the Help Desk\'s biggest fans."', else: 'A plate of food is waiting for you the next time you pass by, with a note: "from the Help Desk\'s biggest fans."' },
      ],
    },
    phone_fail: {
      speaker: 'narrator',
      text: [
        'You say "click Start." They click "Shut Down." You say "now wait." They do not wait. There is a sound over the phone, a small electronic sigh, and then nothing on their end will turn on at all.',
        { if: before(D2003), text: 'Worse: before the screen died, the SpeedDoctor window got the rest of the card number. Somebody in a country with no extradition treaty is buying a lot of ringtones.' },
        'Now it is not a question of a window. Now it is a question of a machine that won\'t boot and a parent who is very quietly blaming themselves.',
      ],
      effects: [
        {
          if: before(D2003),
          then: [
            owe('ev_tech_card_dispute', 'Covering the SpeedDoctor charges on the family card', 3, 28),
            { if: momHere, then: [{ npc: 'mom', affinity: -2 }] },
          ],
        },
      ],
      choices: [
        {
          text: 'Drive over tonight and fix it properly, however long it takes.',
          effects: [
            { stat: 'energy', add: -18 },
            { stat: 'stress', add: 3 },
            { xp: 'systems', add: 25 },
            { if: momHere, then: [{ npc: 'mom', affinity: 3 }], else: [{ npc: 'dad', affinity: 3 }] },
          ],
          goto: 'late_fix',
        },
        {
          text: 'Pay the CompCastle house-call guys. You do not have another night in you.',
          req: { stat: 'money', gte: 120 },
          reqText: 'Requires $120',
          effects: [{ money: -120 }, { stat: 'stress', add: -2 }],
          goto: 'paid_help',
        },
        {
          text: 'Tell them it\'s dead and they should just get a new one.',
          effects: [
            { if: momHere, then: [{ npc: 'mom', affinity: -4 }], else: [{ npc: 'dad', affinity: -4 }] },
            { stat: 'mood', add: -3 },
          ],
          goto: 'give_up',
        },
      ],
    },
    in_person: {
      speaker: 'narrator',
      text: [
        'The fix takes nine minutes. The visit takes four hours. There is soup, there is a long story about a cousin, there is a second, unrelated problem with the television remote which you also fix.',
        'You leave with leftovers in three containers and the feeling, faint but real, of being a person who is good for something at home.',
      ],
    },
    kim: {
      speaker: 'kim',
      text: [
        '"Fixed it," Kim reports twenty minutes later. "It was the monitor cable. It\'s always the monitor cable. That\'ll be twenty dollars."',
        '"Also," she adds, "I\'m keeping the fifth search bar. Gerald stays."',
      ],
    },
    unplug: {
      speaker: 'narrator',
      text: [
        'There is a pause. Then, over the phone, the sound of a plug leaving a wall with great force.',
        'It is, technically, the correct first step. It is also, you gather from the silence, not what they wanted from you. They wanted you to come.',
      ],
    },
    late_fix: {
      speaker: 'narrator',
      text: 'Midnight. Then one. Then two, sitting on the floor of the spare room with the case open and a parent asleep upright in the chair behind you. At 2:40 it boots. You leave a sticky note on the monitor: "DO NOT CLICK SHUT DOWN." They will keep that note for years.',
    },
    paid_help: {
      speaker: 'narrator',
      text: 'A man in a CompCastle polo shirt arrives, fixes it in twenty minutes and charges for an hour. He tells your parents their child "must be very busy." They agree that you must be.',
    },
    give_up: {
      speaker: 'narrator',
      text: 'The line goes quiet. "Okay," they say, in the voice parents use when they are deciding not to be hurt. The machine sits dark in the spare room for a month before anyone mentions it again.',
    },
  },
}

const familyTechSupport: EventDef = {
  id: 'ev_tech_family_tech_support',
  category: 'family',
  weight: 2,
  repeatable: true,
  cooldownDays: 250,
  when: { all: [free, { day: true, gte: 20 }, { any: [momHere, around('dad')] }, under('ev_tech.family_help_n', 5)] },
  scene: 'ev_tech_family_tech_support_scene',
  effects: [bump('ev_tech.family_help_n')],
}

// ─────────────────────────────────────────────────────────────────────────────
// ev_tech_update_reboot — "Your computer will restart in 10:00"
// ─────────────────────────────────────────────────────────────────────────────
const updateRebootScene: SceneDef = {
  id: 'ev_tech_update_reboot_scene',
  channel: 'dialog',
  title: 'Casement Update',
  from: 'Casement Update',
  start: 'popup',
  nodes: {
    popup: {
      speaker: 'Casement Update',
      text: [
        'A grey box slides up from the corner of the screen, polite as a bailiff.',
        { if: before(D2003), text: 'CASEMENT UPDATE — Critical Update 4 of 4 has been installed. Your computer will restart in 10:00. [Restart Now] [Postpone]' },
        { if: era(D2003, D2009), text: 'CASEMENT UPDATE — Service Pack 2 is ready (147 MB). Your computer will restart in 10:00 to finish installing. Estimated time: 3 hours. [Restart Now] [Postpone]' },
        { if: since(D2009), text: 'CASEMENT UPDATE — Installing update 47 of 112. Do not turn off your computer. Your computer will restart in 10:00. [Restart Now] [Postpone]' },
        { if: nthIs('ev_tech.reboot_n', 1), text: 'You have eleven windows open. One of them is work you have not saved since Tuesday. One of them is a conversation you were halfway through. The countdown says 9:58.' },
        { if: nthIs('ev_tech.reboot_n', 2), text: 'Again. You know this box now: its font, its fake patience, the little hourglass it wears like a smirk. Fourteen windows open this time. The countdown says 9:57.' },
        { if: nth('ev_tech.reboot_n', 3), text: 'You and the grey box have a history. You could draw its buttons from memory. You have a text file open called "UNSAVED - do not lose" and the irony is not lost on you. The countdown says 9:59.' },
        { if: { flag: 'ev_tech.unpatched' }, text: 'Last time you yanked the network cable instead of letting it patch. It has been nagging you ever since, like a smoke alarm with a low battery.' },
      ],
      choices: [
        {
          tag: '[Systems]',
          text: 'Kill the countdown. You know where the scheduler hides.',
          check: {
            skill: 'systems',
            dc: 11,
            bonuses: [{ if: { background: 'tinkerer' }, add: 1, label: '+1 (you have fought this box before)' }],
            success: 'killed',
            fail: 'rebooted',
            successEffects: [{ xp: 'systems', add: 15 }, { stat: 'mood', add: 2 }],
            failEffects: [{ stat: 'stress', add: 3 }],
          },
        },
        {
          text: 'Click Postpone. Keep clicking Postpone. Forever, if necessary.',
          effects: [{ stat: 'stress', add: 3 }],
          goto: 'postpone',
        },
        {
          text: 'Save everything, let it restart, and go make tea.',
          effects: [{ stat: 'stress', add: -4 }, { stat: 'mood', add: 2 }, { clearFlag: 'ev_tech.unpatched' }],
          goto: 'tea',
        },
        {
          tag: '[Paranoid]',
          text: 'Unplug the network. Nobody updates this machine but you.',
          if: { any: [{ trait: 'paranoid' }, { skill: 'opsec', gte: 20 }] },
          effects: [{ stat: 'stress', add: -2 }, { flag: 'ev_tech.unpatched' }],
          goto: 'unplugged',
        },
      ],
    },
    killed: {
      speaker: 'narrator',
      text: 'Three menus deep, behind a setting named like a legal disclaimer, the countdown dies with a small, sulky chime. You save everything twice anyway. You are learning.',
    },
    rebooted: {
      speaker: 'narrator',
      text: [
        'You find the scheduler. It finds you back: the box respawns every ten minutes like a horror-movie villain. At 1:12 a.m., mid-save, the screen goes blue-grey and the machine restarts itself with the calm of something that has never lost work in its life.',
        { if: { flag: 'ev_tech.lost_it_all' }, text: 'Your autosave habit, born of old pain, catches almost everything. You lose four minutes and a sentence. You have lost worse. You remember exactly how much worse.', else: 'Tuesday\'s work is gone. Not corrupted, not recoverable: gone, as if you never did it. You sit in the dark while the update bar crawls.' },
        { if: { all: [nth('ev_tech.reboot_n', 2), { not: { flag: 'ev_tech.lost_it_all' } }] }, text: 'It has done this to you before. You swore, last time, that you would start saving every ten minutes. You swear it again now, with feeling, to the ceiling.' },
      ],
      effects: [{ if: { flag: 'ev_tech.lost_it_all' }, then: [{ stat: 'stress', add: 1 }], else: [buff(LOST_WORK), { stat: 'stress', add: 5 }, { stat: 'mood', add: -4 }] }],
    },
    postpone: {
      speaker: 'narrator',
      text: [
        'Postpone. Postpone. You get into a rhythm. At some point you realize you have been clicking Postpone for so long that you have stopped doing whatever the other windows were for.',
        'At 4 a.m., while you sleep, it wins.',
      ],
      effects: [
        {
          random: [
            { weight: 6, effects: [{ log: 'You saved before bed. The 4 a.m. restart costs you nothing but dignity.' }] },
            { weight: 4, effects: [buff(LOST_WORK), { log: 'You did not save before bed. The 4 a.m. restart takes a day of work with it.', kind: 'bad' }] },
          ],
        },
      ],
    },
    tea: {
      speaker: 'narrator',
      text: 'The kettle clicks off at the same moment the machine chimes back awake. Everything is where you left it. Somewhere in the grey box\'s heart a hole you never knew about has quietly been closed. Tea is good. Updates are, you admit, fine.',
    },
    unplugged: {
      speaker: 'narrator',
      text: 'You pull the cable. The box goes quiet, confused, and then passive-aggressive: a little shield icon in the corner turns yellow and stays yellow. Your machine is now exactly as secure as the day you last let it patch, which you are sure is fine.',
    },
  },
}

const updateReboot: EventDef = {
  id: 'ev_tech_update_reboot',
  category: 'tech',
  weight: 1,
  repeatable: true,
  cooldownDays: 300,
  when: { all: [{ day: true, gte: 60 }, free, under('ev_tech.reboot_n', 4)] },
  scene: 'ev_tech_update_reboot_scene',
  effects: [bump('ev_tech.reboot_n')],
}

// ─────────────────────────────────────────────────────────────────────────────
// ev_tech_drive_click — the click of death
// ─────────────────────────────────────────────────────────────────────────────
const driveClickScene: SceneDef = {
  id: 'ev_tech_drive_click_scene',
  channel: 'dialog',
  title: 'Click. Click. Click.',
  from: 'your desk, 2:14 a.m.',
  start: 'click',
  nodes: {
    click: {
      speaker: 'narrator',
      text: [
        'It starts at 2:14 a.m.: a soft, rhythmic tick from inside the case, like a moth trapped in a lampshade. Click. Whirr. Click. The machine stalls when you open a folder, thinks about it, and clicks again.',
        { if: { item: 'hdd_1tb' }, text: 'It is the terabyte drive. It has your entire decade on it: every project, every log, every photo, the folder named "misc" that is actually the most important folder in your life.', else: 'It is your main drive. It has everything on it: projects, logs, the folder named "misc" that is actually the most important folder in your life.' },
        { if: { flag: 'ev_tech.lost_it_all' }, text: 'Your stomach drops. And then — slowly — un-drops. There is a backup. There is always a backup now. You made sure of that the last time this happened.' },
        { if: nthIs('ev_tech.drive_n', 1), text: 'The board calls this sound the Click of Death. The board is dramatic. The board is not wrong.' },
        { if: nth('ev_tech.drive_n', 2), text: 'You know this sound. Everyone who has heard it once knows it forever, the way you know your own name shouted across a car park. Another drive. Another 2 a.m.' },
      ],
      choices: [
        {
          if: { flag: 'ev_tech.lost_it_all' },
          text: 'Restore last night\'s backup to a new drive and let this one die in peace.',
          effects: [{ money: -80 }, { stat: 'mood', add: 3 }, buff(SETTLED)],
          goto: 'restored',
        },
        {
          tag: '[Systems]',
          text: 'Copy everything to the spare drive right now, most important first, before it dies.',
          check: {
            skill: 'systems',
            dc: 13,
            bonuses: [
              { if: { trait: 'night_owl' }, add: 1, label: '+1 (2 a.m. is your hour)' },
              { if: { background: 'tinkerer' }, add: 1, label: '+1 (you know drives by their sounds)' },
            ],
            success: 'saved',
            fail: 'lost',
            successEffects: [{ xp: 'systems', add: 30 }, { money: -80 }, { stat: 'stress', add: 2 }],
            failEffects: [buff(LOST_WORK), { stat: 'stress', add: 10 }, { stat: 'mood', add: -8 }, { trait: 'ev_tech_scar_lost_it_all' }],
          },
        },
        {
          text: 'The freezer trick. Everyone on the board swears by it.',
          goto: 'freezer',
        },
        {
          text: 'Drive it to the data-recovery lab in Millgate. Pay whatever it costs.',
          req: { stat: 'money', gte: 350 },
          reqText: 'Requires $350',
          effects: [{ money: -350 }, { stat: 'stress', add: 3 }],
          goto: 'lab',
        },
      ],
    },
    restored: {
      speaker: 'narrator',
      text: 'It takes an hour and a new drive. The old one clicks its way into the drawer of dead things. You sleep, afterward, like someone who planned ahead, because you did — the hard way.',
    },
    saved: {
      speaker: 'narrator',
      text: [
        'You triage like an ER nurse: work first, then logs, then photos, then "misc." The drive clicks faster, louder, a dying thing trying to say something. At 94% it stops clicking forever.',
        'You got everything that mattered. You hold the new drive for a while, like it might also die if you let go.',
      ],
    },
    lost: {
      speaker: 'narrator',
      text: [
        'You start with the wrong folder. By the time you realize, the drive has stopped spinning up at all; the last click is a small, final sound, like a door latching in another room.',
        'It is gone. Months of work. The logs. The photos. You sit very still and do the arithmetic of what you have lost, and the arithmetic keeps getting longer.',
      ],
      choices: [
        {
          if: employed,
          tag: '[Business]',
          text: 'Tell the people waiting on your work the truth, and ask for time.',
          check: {
            skill: 'business',
            dc: 12,
            success: 'truth_ok',
            fail: 'truth_bad',
            successEffects: [{ xp: 'business', add: 20 }],
            failEffects: [{ money: -150 }, { chance: 0.5, then: [{ complication: 'gig' }] }],
          },
        },
        {
          text: 'Rebuild what you can from memory, all weekend, on coffee and spite.',
          effects: [{ stat: 'energy', add: -20 }, { stat: 'stress', add: 6 }, { xp: 'programming', add: 30 }],
          goto: 'rebuild',
        },
        { text: 'Close the case. Go outside. Look at the sky for a while.', effects: [{ stat: 'stress', add: -3 }, { stat: 'mood', add: -2 }] },
      ],
    },
    truth_ok: {
      speaker: 'narrator',
      text: '"Honestly," comes the reply, "that happened to me in \'98. Take two weeks." The kindness of strangers who have also heard the click.',
    },
    truth_bad: {
      speaker: 'narrator',
      text: '"We had a deadline," comes the reply, and then a refund request, and then silence. You pay it back. Somewhere a client tells another client your name, in the wrong tone of voice.',
    },
    rebuild: {
      speaker: 'narrator',
      text: 'It is worse the second time and also, strangely, better — you remember what you meant, not what you typed. By Monday you have most of it back and a new rule written on a sticky note: BACK UP YOUR LIFE.',
    },
    freezer: {
      speaker: 'narrator',
      text: 'You wrap the drive in a sandwich bag, put it between the frozen peas and a tub of Mom\'s soup, and wait an hour. Folk medicine for machines. Then you plug it back in, breath held.',
      effects: [
        {
          random: [
            {
              weight: 45,
              effects: [
                { money: -80 },
                { xp: 'hardware', add: 10 },
                { stat: 'mood', add: 5 },
                { notify: 'The freezer trick works. The drive spins up for exactly long enough. You copy everything and buy a new one.', kind: 'good' },
              ],
            },
            {
              weight: 55,
              effects: [
                buff(LOST_WORK),
                { stat: 'stress', add: 8 },
                { trait: 'ev_tech_scar_lost_it_all' },
                { notify: 'Condensation. The drive gives one wet, apologetic click and never spins again.', kind: 'bad' },
              ],
            },
          ],
        },
      ],
    },
    lab: {
      speaker: 'narrator',
      text: 'A man in a clean-room suit, who looks like he has not seen daylight since the last century, takes the drive through an airlock. Three days later he hands you back your life on four CD-Rs and a look that says "back up."',
    },
  },
}

const driveClick: EventDef = {
  id: 'ev_tech_drive_click',
  category: 'tech',
  weight: 1,
  repeatable: true,
  cooldownDays: 420,
  when: { all: [{ day: true, gte: 90 }, free, under('ev_tech.drive_n', 3)] },
  scene: 'ev_tech_drive_click_scene',
  effects: [bump('ev_tech.drive_n')],
}

// ─────────────────────────────────────────────────────────────────────────────
// ev_tech_social_network — FriendFold → Pagelet → Roster
// ─────────────────────────────────────────────────────────────────────────────
const ffEra = before(PAGELET_DAY)
const pageletEra = era(PAGELET_DAY, ROSTER_DAY)
const rosterEra = since(ROSTER_DAY)

const socialScene: SceneDef = {
  id: 'ev_tech_social_network_scene',
  channel: 'mail',
  title: 'You have (1) new friend request!',
  from: 'The Social Web',
  start: 'invite',
  expiresDays: 21,
  nodes: {
    invite: {
      speaker: 'The Social Web',
      text: [
        { if: ffEra, text: 'FriendFold is here, and everyone you know joined in the same week. It has one feature that matters: TOP FRIENDS, a public, ranked list of your eight favorite people, in order, for the whole world to see.' },
        { if: { all: [ffEra, around('jax')] }, text: 'Jax has already made his. You are number one. He has sent you a message about it with eleven exclamation points and the words "no pressure." There is pressure.' },
        { if: pageletEra, text: 'Pagelet has eaten FriendFold. Profiles have autoplay songs now, glitter backgrounds, and a "Top 8" that has made at least two couples on Sodium Row break up.' },
        { if: { all: [pageletEra, around('kim')] }, text: 'Kim\'s Pagelet is the best on the Row — and on it, under "About Me," next to a very good self-portrait, is your family\'s street address, a photo of the front door, and the words "my sibling is {handle}, like the hacker, ask me anything."' },
        { if: { all: [pageletEra, { not: around('kim') }] }, text: 'Your old FriendFold page has been migrated to Pagelet without your consent. It now plays a song you liked in 2003 at full volume to anyone who visits.' },
        { if: rosterEra, text: 'Roster is the clean, blue one. Real names only. Everyone is on it — your coworkers, your old teachers, the guy from the pager shop. And this morning, a friend request from someone you did not expect to see there.' },
        { if: { all: [rosterEra, momHere] }, text: 'It is your mother. Her profile picture is a sunflower. Her first status update, from nine minutes ago, reads: "HELLO IS THIS WORKING."' },
        { if: { all: [rosterEra, { not: momHere }, around('dad')] }, text: 'It is your father. His profile picture is a wrench. His first status update reads, in full: "Robert Tan has joined Roster."' },
        { if: { all: [rosterEra, { not: momHere }, { not: around('dad') }] }, text: 'It is Mr. Petrakis, your tenth-grade computer teacher. His profile picture is the same beige monitor he taught you on. He has 1,100 friends. All of them were his students.' },
      ],
      choices: [
        // FriendFold
        {
          if: { all: [ffEra, around('jax')] },
          text: 'Jax at number one. Obviously. Since sixth grade.',
          effects: [
            { npc: 'jax', affinity: 5 },
            { stat: 'mood', add: 2 },
            { if: around('byteme'), then: [{ npc: 'byteme', affinity: -2 }] },
          ],
          goto: 'ff_jax',
        },
        {
          if: { all: [ffEra, inRelationship] },
          text: 'Your partner at number one. Let the world know.',
          effects: [
            { if: together('mira'), then: [{ npc: 'mira', affinity: 4 }] },
            { if: together('grace'), then: [{ npc: 'grace', affinity: 4 }] },
            { if: around('jax'), then: [{ npc: 'jax', affinity: -2 }] },
          ],
          goto: 'ff_love',
        },
        {
          if: ffEra,
          tag: '[Social]',
          text: 'Craft a ranking so diplomatic that nobody can possibly be hurt.',
          check: {
            skill: 'social',
            dc: 13,
            bonuses: [
              { if: { trait: 'empath' }, add: 2, label: '+2 (empath)' },
              { if: { trait: 'silver_tongue' }, add: 1, label: '+1 (silver tongue)' },
            ],
            success: 'ff_diplomat',
            fail: 'ff_offended',
            successEffects: [
              { xp: 'social', add: 20 },
              { if: around('jax'), then: [{ npc: 'jax', affinity: 2 }] },
              { if: around('byteme'), then: [{ npc: 'byteme', affinity: 2 }] },
              { if: around('mira'), then: [{ npc: 'mira', affinity: 2 }] },
            ],
            failEffects: [
              { if: around('jax'), then: [{ npc: 'jax', affinity: -5 }] },
              { flag: 'ev_tech.top8_drama' },
              { stat: 'stress', add: 4 },
              { chance: 0.3, then: [{ complication: 'social' }] },
            ],
          },
        },
        {
          if: ffEra,
          text: 'Refuse to rank anyone. Public lists of your friends are how wars start.',
          effects: [{ xp: 'opsec', add: 10 }, { stat: 'mood', add: -1 }, { if: around('jax'), then: [{ npc: 'jax', affinity: -1 }] }],
          goto: 'ff_refuse',
        },
        // Pagelet
        {
          if: { all: [pageletEra, around('kim')] },
          tag: '[OpSec]',
          text: 'Sit Kim down and scrub her page together — without making it a lecture.',
          check: {
            skill: 'opsec',
            dc: 13,
            bonuses: [
              { if: { trait: 'paranoid' }, add: 2, label: '+2 (paranoid)' },
              { if: { trait: 'empath' }, add: 2, label: '+2 (you know how to not sound like Dad)' },
            ],
            success: 'pg_scrubbed',
            fail: 'pg_fight',
            successEffects: [{ npc: 'kim', affinity: 3 }, { stat: 'heat', add: -2 }, { xp: 'opsec', add: 20 }],
            failEffects: [{ npc: 'kim', affinity: -5 }, { stat: 'heat', add: 3 }, { flag: 'ev_tech.kim_page_public' }],
          },
        },
        {
          if: { all: [pageletEra, around('kim')] },
          text: 'Quietly report her page for "impersonation" so it gets taken down.',
          effects: [{ stat: 'heat', add: -3 }, { npc: 'kim', affinity: -4 }],
          goto: 'pg_report',
        },
        {
          if: pageletEra,
          text: 'Lean in. Glitter background, autoplay song, the works.',
          effects: [{ stat: 'mood', add: 4 }, { xp: 'social', add: 15 }, { stat: 'cred', add: -1 }],
          goto: 'pg_own',
        },
        {
          if: pageletEra,
          text: 'Ignore it. Nobody will ever read these.',
          effects: [{ stat: 'heat', add: 2 }],
          goto: 'pg_ignore',
        },
        // Roster
        {
          if: { all: [rosterEra, { any: [momHere, around('dad')] }] },
          text: 'Accept. It\'s your parent.',
          effects: [
            { if: momHere, then: [{ npc: 'mom', affinity: 4 }], else: [{ npc: 'dad', affinity: 4 }] },
            { stat: 'mood', add: 2 },
            { flag: 'ev_tech.roster_made' },
          ],
          goto: 'ro_accept',
        },
        {
          if: { all: [rosterEra, { any: [momHere, around('dad')] }] },
          tag: '[Systems]',
          text: 'Accept — then build a privacy-list labyrinth so precise that family only ever sees family things.',
          check: {
            skill: 'systems',
            dc: 14,
            success: 'ro_lists',
            fail: 'ro_wrong_list',
            successEffects: [{ xp: 'systems', add: 25 }, { if: momHere, then: [{ npc: 'mom', affinity: 3 }], else: [{ npc: 'dad', affinity: 3 }] }, { flag: 'ev_tech.roster_made' }],
            failEffects: [
              { if: momHere, then: [{ npc: 'mom', affinity: -4 }], else: [{ npc: 'dad', affinity: -4 }] },
              { stat: 'stress', add: 6 },
              { stat: 'cred', add: -2 },
              { flag: 'ev_tech.roster_made' },
              { chance: 0.3, then: [{ complication: 'social' }] },
            ],
          },
        },
        {
          if: { all: [rosterEra, { any: [momHere, around('dad')] }] },
          text: 'Leave the request sitting there. Forever. A small, unanswered question.',
          effects: [{ if: momHere, then: [{ npc: 'mom', affinity: -3 }], else: [{ npc: 'dad', affinity: -3 }] }],
          goto: 'ro_ignore',
        },
        {
          if: { all: [rosterEra, { not: { any: [momHere, around('dad')] } }] },
          text: 'Accept, and make a Roster. Everyone is on it; you might as well be.',
          effects: [{ stat: 'mood', add: 2 }, { xp: 'social', add: 15 }, { flag: 'ev_tech.roster_made' }],
          goto: 'ro_join',
        },
        {
          if: rosterEra,
          text: 'Don\'t make a Roster at all. Your real name, on the internet, on purpose? No.',
          effects: [{ stat: 'heat', add: -2 }, { xp: 'opsec', add: 15 }, { stat: 'mood', add: -1 }, { flag: 'ev_tech.no_roster' }],
          goto: 'ro_refuse',
        },
      ],
    },
    ff_jax: {
      speaker: 'jax',
      text: 'JaxAttack: YESSSS. top friends 4 life. byteme is kinda salty he\'s #6 but he\'ll live. we should get matching jackets. im serious. im looking at jackets',
    },
    ff_love: {
      speaker: 'narrator',
      text: 'You put them at number one. The next time you see them, they don\'t mention it at all, which is how you know they have checked it several times. Jax, at number two, sends a single "cool. cool cool cool."',
    },
    ff_diplomat: {
      speaker: 'narrator',
      text: 'You rank by "the order I met you," add a line of text — "all of you are #1, this is just chronology" — and somehow it lands. Three people tell you it\'s the nicest Top Friends on FriendFold. Nobody is at war. You are a statesman.',
    },
    ff_offended: {
      speaker: 'narrator',
      text: [
        'You go alphabetical. It seems fair. Alphabetical puts "byteme" above "Jax." You did not think about that. Jax thought about it for eleven hours.',
        '"its fine," he writes, which is the least fine sentence in the language. The drama spreads to the Loft: the board has opinions on your Top 8, and so, it turns out, does everyone on it.',
      ],
    },
    ff_refuse: {
      speaker: 'narrator',
      text: 'Your FriendFold page has no Top Friends, no photo, and one line of text: "I don\'t rank people." It is either very principled or very weird. The Row decides it is both.',
    },
    pg_scrubbed: {
      speaker: 'kim',
      text: [
        'You don\'t lecture. You show her what a stranger can learn from her page in three minutes, and you do it like a magic trick. She goes quiet, then very fast, and then the address is gone, the door photo is gone, and your handle is gone.',
        '"Okay," she says. "That was actually creepy. Thanks." The self-portrait stays. It\'s a very good self-portrait.',
      ],
    },
    pg_fight: {
      speaker: 'kim',
      text: [
        '"You\'re not my DAD," she says, about thirty seconds in. Then a lot of other things, at volume. The door slams. The page stays up. That night she adds a new line: "my sibling is a control freak."',
        'Your handle, your street, and your front door are still sitting there for anyone who searches.',
      ],
    },
    pg_report: {
      speaker: 'narrator',
      text: 'Pagelet takes the page down in two days. Kim spends a week rebuilding it and another week asking everyone who reported her. She figures it out. She always figures it out. The new page is private — and so, for a while, is she, from you.',
    },
    pg_own: {
      speaker: 'narrator',
      text: 'Your page is a crime against the visual arts and you love it. The Loft finds it within the hour. Someone screenshots the glitter. You will be hearing about the glitter for years.',
    },
    pg_ignore: {
      speaker: 'narrator',
      text: 'You ignore it. Pagelet does not ignore you: search engines index everything, forever, and your name now sits a little closer to your handle in the machine\'s long memory.',
    },
    ro_accept: {
      speaker: 'narrator',
      text: [
        'You accept. Within the hour there is a comment on your profile photo: "SO PROUD OF MY BABY," in capitals, visible to everyone you have ever worked with.',
        { if: employed, text: 'Your manager likes the comment. You will never be able to have a serious meeting with that man again.' },
        'It is mortifying. It is also, if you are honest, the nicest thing that has happened on the internet this year.',
      ],
    },
    ro_lists: {
      speaker: 'narrator',
      text: 'Family. Work. Friends. Row. A fifth list, "Scene," which contains no one and exists as a firewall. It takes an evening. Your parent sees birthdays and fish you caught. Nobody sees anything else. It holds.',
    },
    ro_wrong_list: {
      speaker: 'narrator',
      text: [
        'You build the lists. You drag the wrong group into the wrong box. For one weekend your parent can see a photo someone tagged of you in the back room at 4 a.m., eyes like a raccoon, three monitors glowing — and the Loft can see your baby pictures.',
        'Both parties comment. Neither comment is kind. You fix it by Monday. Monday is too late.',
      ],
    },
    ro_ignore: {
      speaker: 'narrator',
      text: 'The request sits there. Every time you log in, a little red "1" asks you the question again. Your parent never mentions it. That is how you know they noticed.',
    },
    ro_join: {
      speaker: 'narrator',
      text: 'You make a Roster. Within a week you have two hundred friends, forty of whom you would cross the street to avoid, and a photo from a 2002 LAN party you did not know existed. Mr. Petrakis comments "so proud!!" on everything. It is, you admit, kind of nice.',
    },
    ro_refuse: {
      speaker: 'narrator',
      text: 'You become one of the last people in Port Lumen without a Roster. At parties, people look at you like you just said you don\'t own a television. You don\'t, particularly, care. Nobody can tag you in anything.',
    },
  },
}

const socialNetwork: EventDef = {
  id: 'ev_tech_social_network',
  category: 'era',
  weight: 2,
  repeatable: true,
  cooldownDays: 300,
  // Once per network: each era's site gets exactly one showing (tracked in ev_tech.social_era).
  when: {
    all: [
      since(dayOf(2003, 4, 1)),
      free,
      under('ev_tech.social_n', 3),
      {
        any: [
          { all: [ffEra, { var: 'ev_tech.social_era', lte: 0 }] },
          { all: [pageletEra, { var: 'ev_tech.social_era', lte: 1 }] },
          { all: [rosterEra, { var: 'ev_tech.social_era', lte: 2 }] },
        ],
      },
    ],
  },
  scene: 'ev_tech_social_network_scene',
  effects: [
    bump('ev_tech.social_n'),
    {
      if: ffEra,
      then: [{ var: 'ev_tech.social_era', set: 1 }],
      else: [{ if: pageletEra, then: [{ var: 'ev_tech.social_era', set: 2 }], else: [{ var: 'ev_tech.social_era', set: 3 }] }],
    },
  ],
}

// ─────────────────────────────────────────────────────────────────────────────
// ev_tech_ghost_online — a buddy who can't be online signs on for four seconds
// ─────────────────────────────────────────────────────────────────────────────
const jaxInside: Cond = { all: [{ npc: 'jax', met: true }, { npc: 'jax', fate: ['arrested', 'flipped'] }] }
const bytemeGone: Cond = { all: [{ not: jaxInside }, { npc: 'byteme', met: true }, { npc: 'byteme', fate: ['arrested_young', 'dead'] }] }
const plainGhost: Cond = { all: [{ not: jaxInside }, { not: bytemeGone }] }

const ghostScene: SceneDef = {
  id: 'ev_tech_ghost_online_scene',
  channel: 'dialog',
  title: 'BuddyPager',
  from: 'BuddyPager',
  start: 'ping',
  nodes: {
    ping: {
      speaker: 'narrator',
      text: [
        'BuddyPager plays the door-creak sound it uses when a buddy signs on. You glance at the list out of habit, and then you stop breathing for a second.',
        { if: jaxInside, text: 'JaxAttack. Online. The little icon is green. Jax has not touched a keyboard of his own since the Bureau took him, and the Bureau has his hard drives — and somebody, right now, just logged into his account.' },
        { if: bytemeGone, text: 'byteme. Online. The little icon is green. Kevin has not been anywhere near a keyboard in a long time — and somebody who knows his password just logged in.' },
        { if: plainGhost, text: 'xX_DeadAir_Xx — a buddy you added at a LAN party in 2001 and never once spoke to. The account went grey years ago. It is green now.' },
        'Four seconds. Then the icon goes grey again, and the list is exactly as it was.',
        { if: { all: [{ flag: 'ev_tech.ghost_seen' }, nthIs('ev_tech.ghost_n', 2)] }, text: 'It has happened before. You had half convinced yourself you imagined it.' },
        { if: nth('ev_tech.ghost_n', 3), text: 'Third time. Once is a glitch and twice is a coincidence; you have stopped pretending to know what three is. You wrote the dates down after last time. It is roughly a year, every time.' },
      ],
      choices: [
        {
          tag: '[Networking]',
          text: 'Trace the sign-on. The presence server keeps a return address for four seconds, too.',
          check: {
            skill: 'networking',
            dc: 13,
            bonuses: [{ if: { background: 'arcade_rat' }, add: 2, label: '+2 (you grew up on these networks)' }],
            success: 'traced',
            fail: 'ghost_fail',
            successEffects: [{ xp: 'networking', add: 25 }, { flag: 'ev_tech.ghost_seen' }],
            failEffects: [buff(SPOOKED), { stat: 'stress', add: 4 }, { flag: 'ev_tech.ghost_seen' }],
          },
        },
        {
          if: { not: bytemeGone },
          text: 'Send a message. Just: "hello?"',
          effects: [{ flag: 'ev_tech.ghost_seen' }],
          goto: 'hello',
        },
        {
          text: 'Remove the buddy from your list. Some doors you close yourself.',
          effects: [{ stat: 'mood', add: -2 }, { stat: 'stress', add: -1 }, { flag: 'ev_tech.ghost_seen' }],
          goto: 'remove',
        },
        {
          text: 'Do nothing. Sit with it. Watch the grey name for a while.',
          effects: [{ flag: 'ev_tech.ghost_seen' }],
          goto: 'watch',
        },
      ],
    },
    traced: {
      speaker: 'narrator',
      text: [
        { if: plainGhost, text: 'The answer is almost funny: BuddyPager migrated its old servers last night and replayed a few seconds of 2001 presence data into the present. For four seconds, the network remembered a stranger. You are strangely moved by that.' },
        { if: jaxInside, text: 'The sign-on came from a block of addresses registered to a federal building downtown. Somebody at the Bureau is reading Jax\'s old buddy list, one name at a time. Yours is on it. It has always been on it.' },
        { if: bytemeGone, text: 'The sign-on came from a house on the east side of the Row, from a family account. His family, then. Someone who loves him, reading old messages at midnight. You hope it helps them. You close the window gently, as if they could hear.' },
      ],
      effects: [
        { if: jaxInside, then: [{ stat: 'heat', add: 3 }, { stat: 'stress', add: 3 }] },
        { if: plainGhost, then: [{ stat: 'mood', add: 3 }] },
        { if: bytemeGone, then: [{ stat: 'mood', add: -2 }, buff(ROOTED)] },
      ],
    },
    ghost_fail: {
      speaker: 'narrator',
      text: [
        'The trace comes back as nothing: no address, no hop, no server that admits to having ever heard of the account. That should not be possible. You try again. Nothing.',
        'The next night, at the same minute, the door-creak plays again. You do not look this time. You hear it anyway, for a week, every time the house settles.',
      ],
    },
    hello: {
      speaker: 'narrator',
      text: [
        { if: plainGhost, text: 'An auto-reply comes back instantly, preserved in amber from 2001: "brb pizza :D". You laugh out loud, alone, at two in the morning. Somewhere, a stranger went for pizza eight years ago and never came back to this window.' },
        { if: jaxInside, text: 'No reply. The message sits there, delivered, unread. Two days later a blank profile with no name adds you as a buddy. You don\'t accept. You don\'t delete it either. You just know it\'s watching.' },
      ],
      effects: [
        { if: plainGhost, then: [{ stat: 'mood', add: 4 }] },
        { if: jaxInside, then: [{ stat: 'heat', add: 2 }, buff(SPOOKED)] },
      ],
    },
    remove: {
      speaker: 'narrator',
      text: 'You right-click, choose Remove, and confirm. The list is one name shorter. It feels like closing a window in a house where nobody lives anymore — necessary, and a little unkind.',
    },
    watch: {
      speaker: 'narrator',
      text: [
        'You watch the grey name for a long time. It does not light up again.',
        { if: jaxInside, text: 'You think about Jax, and about who else is watching the same list, and you get up and check that your door is locked, twice.' },
        { if: bytemeGone, text: 'You think about the kid who paged you at 2 a.m. because he ran a thing. You wish, very much, that he would page you now.' },
        { if: plainGhost, text: 'It is oddly comforting: a whole generation of the net asleep in that list, dreaming of LAN parties, and occasionally turning over in its sleep.' },
      ],
      effects: [
        { if: plainGhost, then: [buff(ROOTED)] },
        { if: { not: plainGhost }, then: [{ stat: 'stress', add: 3 }] },
      ],
    },
  },
}

const ghostOnline: EventDef = {
  id: 'ev_tech_ghost_online',
  category: 'weird',
  weight: 1,
  repeatable: true,
  cooldownDays: 365,
  when: { all: [{ day: true, gte: 200 }, free, under('ev_tech.ghost_n', 3)] },
  scene: 'ev_tech_ghost_online_scene',
  effects: [bump('ev_tech.ghost_n')],
}

// ─────────────────────────────────────────────────────────────────────────────
// ev_tech_raid_night — Embermoor Online, 2 a.m., the Drowned Cathedral
// ─────────────────────────────────────────────────────────────────────────────
const raidScene: SceneDef = {
  id: 'ev_tech_raid_night_scene',
  channel: 'chat',
  title: 'RAID TONITE 2AM!!!',
  from: 'Thornwick',
  start: 'call',
  expiresDays: 7,
  onExpire: [{ stat: 'mood', add: -1 }],
  nodes: {
    call: {
      speaker: 'Thornwick',
      text: [
        'Thornwick: RAID TONITE. 2am. Drowned Cathedral. we need a healer and u ARE the healer {handle}',
        'Thornwick: 38 ppl confirmed. dont be the guy who has "work" lol',
        { if: { flag: 'ev_tech.guild_drama' }, text: 'Thornwick: also pls no drama this time. loot council is still mad about last time' },
        { if: { flag: 'ev_tech.raid_lead' }, text: 'Thornwick: ur calling pulls again right?? ppl actually listen to u' },
        { if: nthIs('ev_tech.raid_n', 2), text: 'Thornwick: new tier btw. the Cathedral flooded again (patch notes lol). boss has a second phase now and it SCREAMS' },
        { if: nthIs('ev_tech.raid_n', 3), text: 'Thornwick: half the old guild quit for the new game. the other half is here. we recruited a 14yo from the forums who heals better than both of us, dont tell him' },
        { if: nth('ev_tech.raid_n', 4), text: 'Thornwick: honestly we could do the Cathedral blindfolded at this point. we are doing it for the vibes. and the one boot that never drops' },
        { if: together('grace'), text: 'Grace is asleep next to you, or doing a very good impression of it. She has a 7 a.m. shift. She knows what 2 a.m. means.' },
        { if: together('mira'), text: 'Mira glances at the screen from the other side of the couch. "The Cathedral? Your healing rotation is inefficient. I\'m just saying."' },
      ],
      choices: [
        {
          tag: '[Social]',
          text: 'Log in and lead. Call every pull like an air traffic controller.',
          check: {
            skill: 'social',
            dc: 13,
            bonuses: [
              { if: { flag: 'ev_tech.raid_lead' }, add: 2, label: '+2 (they follow you now)' },
              { if: { trait: 'hothead' }, add: -2, label: '−2 (hothead)' },
            ],
            success: 'raid_win',
            fail: 'raid_wipe',
            successEffects: [{ stat: 'mood', add: 8 }, { stat: 'stress', add: -6 }, { stat: 'energy', add: -10 }, { flag: 'ev_tech.raid_lead' }, buff(ONE_MORE_QUEST)],
            failEffects: [
              { stat: 'stress', add: 6 },
              { stat: 'energy', add: -15 },
              { stat: 'mood', add: -4 },
              { flag: 'ev_tech.guild_drama' },
              { if: together('grace'), then: [{ npc: 'grace', affinity: -3 }] },
              { if: together('mira'), then: [{ npc: 'mira', affinity: -2 }] },
            ],
          },
        },
        {
          text: 'Log in, heal quietly, say nothing, go to bed at 5.',
          effects: [{ stat: 'mood', add: 4 }, { stat: 'energy', add: -10 }, { stat: 'stress', add: -3 }],
          goto: 'quiet',
        },
        {
          text: '"Not tonight. Sleep is a buff too."',
          effects: [{ stat: 'stress', add: 1 }, { if: inRelationship, then: [{ stat: 'mood', add: 2 }] }],
          goto: 'skip',
        },
        {
          text: 'Cancel your subscription. Tonight. While you still have the willpower.',
          effects: [
            { clearFlag: 'ev_tech.embermoor' },
            { removeBuff: 'ev_tech_one_more_quest' },
            { flag: 'ev_tech.quit_embermoor' },
            { stat: 'mood', add: -3 },
            { stat: 'stress', add: -2 },
            buff(SETTLED),
            { if: together('grace'), then: [{ npc: 'grace', affinity: 3 }] },
            { if: together('mira'), then: [{ npc: 'mira', affinity: 3 }] },
          ],
          goto: 'quit',
        },
      ],
    },
    raid_win: {
      speaker: 'Thornwick',
      text: [
        'Thornwick: HOLY. first kill on the Drowned King. FIRST ON THE SERVER. 38 ppl screaming on voice chat',
        'Thornwick: and u dropped the Tidecaller Staff. im not even mad. ok im a little mad. GG healer',
        '(It is 4:40 a.m. You are the happiest you have been in weeks and you have a meeting in four hours.)',
      ],
    },
    raid_wipe: {
      speaker: 'Thornwick',
      text: [
        'Thornwick: ok so. 11 wipes. ELEVEN. u called "heal left" and meant right',
        'Thornwick: loot council wants a word. also Dagmaw ragequit and took the guild bank password with him. this is a whole thing now',
        { if: inRelationship, text: '(Beside you, a voice in the dark: "Did you just yell HEAL in your sleep? You weren\'t asleep. You yelled it awake.")' },
      ],
    },
    quiet: {
      speaker: 'Thornwick',
      text: 'Thornwick: gg. clean run. u never say anything but u never let anyone die either. respect',
    },
    skip: {
      speaker: 'Thornwick',
      text: [
        'Thornwick: k. noted.',
        { if: { flag: 'ev_tech.guild_drama' }, text: 'Thornwick: fyi officers are talking about "attendance." just saying' },
      ],
      effects: [{ if: { flag: 'ev_tech.guild_drama' }, then: [{ chance: 0.4, then: [{ clearFlag: 'ev_tech.embermoor' }, { removeBuff: 'ev_tech_one_more_quest' }, { notify: 'You have been removed from <Tide & Tithe>. Embermoor feels very quiet.', kind: 'bad' }] }] }],
    },
    quit: {
      speaker: 'Thornwick',
      text: [
        'Thornwick: wait what. WAIT. who heals now',
        'Thornwick: ...ok. real talk. good for u. i quit twice. it didnt take either time. if u come back ur spot is here',
        '(You shut the laptop. The room is very quiet. You can hear the fridge. You had forgotten the fridge made a sound.)',
      ],
    },
  },
}

const raidNight: EventDef = {
  id: 'ev_tech_raid_night',
  category: 'life',
  weight: 2,
  repeatable: true,
  cooldownDays: 200,
  when: { all: [{ flag: 'ev_tech.embermoor' }, free, under('ev_tech.raid_n', 5)] },
  scene: 'ev_tech_raid_night_scene',
  effects: [bump('ev_tech.raid_n')],
}

export default defineContent({
  scenes: [ispOverageScene, chainMailScene, familyHelpScene, updateRebootScene, driveClickScene, socialScene, ghostScene, raidScene],
  events: [ispOverage, chainMail, familyTechSupport, updateReboot, driveClick, socialNetwork, ghostOnline, raidNight],
})
