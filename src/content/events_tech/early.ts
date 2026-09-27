/**
 * events_tech — EARLY one-offs (Act I → Act II, 2001–2005). Comedy with teeth:
 *
 *   ev_tech_worm            tech    2001–03  HONEYBUN.EXE from Jax's address → mini-arc "Complication: Patient Zero"
 *   ev_tech_auction_scam    money   2002–05  a Vortex 9000 XT for $140 on BidBarn (it's a photograph)
 *   ev_tech_capacitors      tech    2003–07  the capacitor bloat; recap it yourself or let the smoke out
 *   ev_tech_game_launch     era     2004–05  the Embermoor Online midnight launch (unlocks ev_tech_raid_night)
 *   ev_tech_lighthouse_cam  weird   2001–04  the Gull Point webcam and its 3:10 a.m. light (follow-up in late.ts)
 *   ev_tech_easter_egg      work    2002+    the flight simulator hidden in Ledger 2000
 *
 * HARD RULE: invented software, invented worms, invented hardware; no real technique anywhere.
 */
import { dayOf } from '@/engine/calendar'
import { defineContent } from '@/engine/registry'
import type { Cond, EventDef, QuestDef, SceneDef } from '@/engine/types'
import {
  FRIED_RIG,
  GUILT,
  JUNKWARE,
  NEW_TOY,
  ONE_MORE_QUEST,
  SETTLED,
  SPOOKED,
  THIN_ICE,
  actLte,
  around,
  between,
  buff,
  employed,
  free,
  officeJob,
} from './_shared'

const atCompCastle: Cond = { job: ['job_compcastle_bench', 'job_compcastle_lead'] }
const deeAtStore: Cond = { all: [atCompCastle, around('dee'), { not: { flag: 'life.dee_laid_off' } }] }

// ─────────────────────────────────────────────────────────────────────────────
// ev_tech_worm — "i made you something :)"
// ─────────────────────────────────────────────────────────────────────────────
const wormScene: SceneDef = {
  id: 'ev_tech_worm_scene',
  channel: 'mail',
  title: 'i made you something :)',
  from: 'jax',
  start: 'mail',
  expiresDays: 10,
  onExpire: [{ xp: 'opsec', add: 5 }],
  nodes: {
    mail: {
      speaker: 'jax',
      text: [
        'From: JaxAttack\nSubject: i made you something :)\n\nhey!! check out the attachment, i made it for you, u will LOVE it\n\n[ Attachment: HONEYBUN.EXE — 41 KB ]',
        'You read it twice. Jax does not write "u will LOVE it." Jax writes "DUDE." Jax has never, in all the years since sixth grade, made you anything that fit in 41 kilobytes.',
        { if: { flag: 'ev_tech.unpatched' }, text: 'In the corner of your screen, the little shield icon is still yellow from the last time you refused to let the machine update.' },
      ],
      choices: [
        {
          tag: '[Systems]',
          text: 'Open it on the junk machine you keep in the closet for exactly this.',
          check: {
            skill: 'systems',
            dc: 12,
            bonuses: [
              { if: { background: 'tinkerer' }, add: 2, label: '+2 (the junk machine is your baby)' },
              { if: { trait: 'paranoid' }, add: 2, label: '+2 (paranoid: it was never on the network)' },
              { if: { flag: 'ev_tech.unpatched' }, add: -2, label: '−2 (you haven\'t patched in months)' },
            ],
            success: 'dissect',
            fail: 'escaped',
            successEffects: [{ stat: 'cred', add: 2 }, { faction: 'fac.loft', add: 2 }, { xp: 'systems', add: 30 }, { flag: 'ev_tech.honeybun_cure' }],
            failEffects: [{ stat: 'stress', add: 6 }, buff(JUNKWARE), { quest: 'ev_tech_q_patient_zero', start: true }],
          },
        },
        {
          text: 'Double-click it. It\'s from Jax.',
          effects: [{ stat: 'stress', add: 8 }, buff(JUNKWARE), { quest: 'ev_tech_q_patient_zero', start: true }],
          goto: 'clicked',
        },
        {
          text: 'Page Jax first: "did you send me something?"',
          goto: 'ask_jax',
        },
        {
          tag: '[Leave]',
          text: 'Delete it unread.',
          effects: [{ xp: 'opsec', add: 10 }],
          goto: 'deleted',
        },
      ],
    },
    dissect: {
      speaker: 'narrator',
      text: [
        'On the junk machine, sealed off from everything, HONEYBUN wakes up, shows a cartoon honeybun doing a little dance, and then tries very hard to find an address book to mail itself to. There isn\'t one. It sulks. You watch it sulk, and take notes.',
        'By 3 a.m. you understand the whole silly thing — a mass-mailer with a sweet tooth — and you post a plain-language cleanup guide to the Loft. By Friday, "the HONEYBUN fix" has been downloaded from the board four hundred times. Corvid pins it.',
      ],
    },
    escaped: {
      speaker: 'narrator',
      text: [
        'The honeybun dances. It is, for three seconds, delightful. Then you notice the junk machine\'s network light, which should be dark, blinking — because two weeks ago you plugged it in "just for a minute" and never unplugged it.',
        'HONEYBUN finds your address book. It finds everyone in it. It sends itself, with your name on it, to your mother, the Row list, your old teachers, the Loft, and a woman you met once at a bus stop in 2000. The modem sings for forty minutes and you cannot make it stop.',
      ],
    },
    clicked: {
      speaker: 'narrator',
      text: [
        'A cartoon honeybun appears and does a little dance. It is, briefly, the best thing on your screen all week.',
        'Then the modem light starts blinking on its own. Then it keeps blinking. HONEYBUN is reading your address book, and it is mailing itself, with your name on it, to every person you have ever emailed.',
      ],
    },
    ask_jax: {
      speaker: 'jax',
      text: [
        'JaxAttack: send u what? i didnt send anything',
        'JaxAttack: dude my computer is being SO weird btw. it keeps dialing by itself. my mom says the phone bill has calls to places. is that bad. that sounds bad',
      ],
      choices: [
        {
          tag: '[Systems]',
          text: 'Walk him through cleaning it out, step by step, over the pager.',
          check: {
            skill: 'systems',
            dc: 12,
            success: 'jax_clean',
            fail: 'jax_mess',
            successEffects: [{ npc: 'jax', affinity: 5 }, { xp: 'systems', add: 25 }],
            failEffects: [{ npc: 'jax', affinity: -2 }, { stat: 'stress', add: 3 }],
          },
        },
        {
          text: '"Unplug it. Take it to CompCastle. Don\'t touch anything."',
          effects: [{ npc: 'jax', affinity: 1 }],
          goto: 'jax_store',
        },
      ],
    },
    jax_clean: {
      speaker: 'jax',
      text: 'JaxAttack: IT STOPPED DIALING. dude ur a WIZARD. i owe u a large pizza and my firstborn. mostly the pizza',
    },
    jax_mess: {
      speaker: 'jax',
      text: [
        'JaxAttack: ok so the dialing stopped. also my Kobold Keep saves are gone. all of them. level 44 dwarf. gone',
        'JaxAttack: its fine. its FINE. i will just be sad forever. (its fine lol, not ur fault)',
      ],
    },
    jax_store: {
      speaker: 'jax',
      text: 'JaxAttack: ok taking it in. the CompCastle guy said "who taught you to unplug it, that\'s the smartest thing anyone did all day." im telling everyone that was me',
    },
    deleted: {
      speaker: 'narrator',
      text: 'You delete it. Over the next three days the whole Row gets infected — your inbox fills with dancing honeybuns from people you have met once — but none of them came from you. The Loft is already hunting for patient zero. It is not you. This time.',
    },
  },
}

const worm: EventDef = {
  id: 'ev_tech_worm',
  category: 'tech',
  weight: 2,
  when: { all: [between(30, dayOf(2003, 5, 30)), around('jax'), free] },
  scene: 'ev_tech_worm_scene',
}

// ── Complication: Patient Zero (the worm's fail branch) ────────────────────────
const pzRoundsScene: SceneDef = {
  id: 'ev_tech_pz_rounds_scene',
  channel: 'mail',
  title: 'RE: RE: RE: WHAT IS THIS HONEYBUN THING',
  from: 'Everyone You Know',
  start: 'inbox',
  pause: true,
  nodes: {
    inbox: {
      speaker: 'Everyone You Know',
      text: [
        'Your inbox is a crime scene. Forty-one replies, all to the same message, all with your name on it:',
        '"The bun is dancing and it won\'t stop. — the choir director." "My computer is calling Ohio. Why is my computer calling Ohio." "Is this a joke? My son says it\'s a VIRUS."',
        { if: employed, text: 'One is from your manager at work. It is one line: "Please see me."' },
        { if: around('grandma_ruth'), text: '{npc:grandma_ruth}: "Dear, the little bun is very cute but it has eaten my recipes. All of them. Even the empanadas."' },
        { if: around('corvid'), text: 'And one from Corvid, to the whole Loft list, not to you: "Whoever patient zero is, I would like a word. The headers say it started on the Row."' },
      ],
      choices: [
        {
          tag: '[Systems]',
          text: 'Go door to door with a boot disk and a bag of apologies. Clean every machine on the Row yourself.',
          check: {
            skill: 'systems',
            dc: 13,
            bonuses: [{ if: { flag: 'ev_tech.row_it_guy' }, add: 2, label: '+2 (you know every machine on the Row)' }],
            success: 'clean_ok',
            fail: 'clean_bad',
            successEffects: [
              { faction: 'fac.hood', add: 3 },
              { stat: 'energy', add: -20 },
              { xp: 'systems', add: 40 },
              { flag: 'ev_tech.pz_cleaned' },
              { flag: 'ev_tech.pz_answered' },
              { if: around('grandma_ruth'), then: [{ npc: 'grandma_ruth', affinity: 4 }] },
            ],
            failEffects: [
              { faction: 'fac.hood', add: -2 },
              { stat: 'energy', add: -20 },
              buff(GUILT),
              { flag: 'ev_tech.pz_cleaned' },
              { flag: 'ev_tech.pz_wiped_photos' },
              { flag: 'ev_tech.pz_answered' },
            ],
          },
        },
        {
          text: 'Post to the Loft, under your own handle: "It was me. Here\'s the cure. I\'m sorry."',
          effects: [{ stat: 'cred', add: -2 }, { faction: 'fac.loft', add: 1 }, { flag: 'ev_tech.pz_owned' }, { flag: 'ev_tech.pz_answered' }],
          goto: 'owned',
        },
        {
          tag: '[Lie]',
          text: 'Tell everyone your NorthLink account was "hacked." You were a victim too.',
          check: {
            skill: 'social',
            dc: 15,
            bonuses: [{ if: { trait: 'silver_tongue' }, add: 2, label: '+2 (silver tongue)' }],
            success: 'lie_ok',
            fail: 'lie_bad',
            successEffects: [{ flag: 'ev_tech.pz_lied_clean' }, { flag: 'ev_tech.pz_answered' }],
            failEffects: [{ stat: 'cred', add: -2 }, { flag: 'ev_tech.pz_lied' }, { flag: 'ev_tech.pz_answered' }],
          },
        },
        {
          text: 'Say nothing to anyone. It will blow over.',
          effects: [{ flag: 'ev_tech.pz_ignored' }, { flag: 'ev_tech.pz_answered' }, { faction: 'fac.hood', add: -2 }],
          goto: 'silence',
        },
      ],
    },
    clean_ok: {
      speaker: 'narrator',
      text: [
        'It takes a week of evenings. You sit in eleven kitchens. You clean eleven machines, and you recover every recipe, including the empanadas, from a backup Grandma Ruth did not know she had.',
        'By the end, people are not angry anymore. They are feeding you. "The HONEYBUN kid," the laundromat calls you, fondly. It could have been much worse.',
      ],
    },
    clean_bad: {
      speaker: 'narrator',
      text: [
        'Ten kitchens go fine. In the eleventh, Mrs. Kowalczyk\'s, you are tired and fast and you clean the wrong folder. Six years of photos of her grandchildren go with the worm.',
        'She says it\'s all right. She says it twice. She does not offer you coffee, and on the Row, that is how you know it isn\'t.',
      ],
    },
    owned: {
      speaker: 'narrator',
      text: 'The replies come in fast and mean, and then — slower — decent. "Took guts." "The cure works, thx." Corvid posts one line under yours: "This is how it\'s done. Noted." Your cred takes the hit. Something else, harder to measure, doesn\'t.',
    },
    lie_ok: {
      speaker: 'narrator',
      text: 'You write it well: shock, outrage, a warning about NorthLink security. People believe you. Grandma Ruth sends you a sympathy card. You put it in a drawer and don\'t look at it again, and you know exactly why.',
    },
    lie_bad: {
      speaker: 'narrator',
      text: 'You write it badly — too many details, the wrong details. Someone on the Loft replies with a single, quiet question about your timestamps. Then a second person replies to that. Then the thread goes silent in the way threads go silent when people are checking something.',
    },
    silence: {
      speaker: 'narrator',
      text: 'You say nothing. The mails keep coming, and then they stop, and the silence that follows is not forgiveness. On the Row, people stop mentioning computers when you walk into the laundromat.',
    },
  },
}

const pzReckoningScene: SceneDef = {
  id: 'ev_tech_pz_reckoning_scene',
  channel: 'forum',
  board: 'general',
  title: 'HONEYBUN post-mortem (who was patient zero?)',
  from: 'Loft BBS',
  start: 'thread',
  nodes: {
    thread: {
      speaker: 'Loft BBS',
      text: [
        'The thread has been up for a week. Two hundred posts. Somebody has drawn an ASCII honeybun wearing a crown:\n\n    ( @ @ )  HONEYBUN\n     \\ ~ /   KING OF THE ROW\n      |||\n',
        { if: { any: [{ flag: 'ev_tech.pz_lied' }, { flag: 'ev_tech.pz_ignored' }] }, text: 'And halfway down, someone has posted the headers: the first infected message, the first hop, the first address. Yours. Under it: "patient zero, everybody. and they never said a word."' },
        { if: { any: [{ flag: 'ev_tech.pz_owned' }, { flag: 'ev_tech.pz_cleaned' }] }, text: 'Halfway down, somebody asks who patient zero was. The next reply: "{handle}, and they owned it and fixed half the Row. drop it." Surprisingly, people drop it.' },
        { if: { flag: 'ev_tech.pz_lied_clean' }, text: 'Halfway down, somebody asks who patient zero was. Somebody else says "NorthLink breach, it was in the news." Nobody checks. The thread moves on to arguing about the crown.' },
      ],
      effects: [
        {
          if: { any: [{ flag: 'ev_tech.pz_lied' }, { flag: 'ev_tech.pz_ignored' }] },
          then: [{ trait: 'ev_tech_scar_patient_zero' }, { faction: 'fac.loft', add: -2 }, { stat: 'cred', add: -2 }],
        },
        { if: { any: [{ flag: 'ev_tech.pz_owned' }, { flag: 'ev_tech.pz_cleaned' }] }, then: [{ flag: 'ev_tech.honeybun_kid' }, { stat: 'cred', add: 1 }] },
      ],
      choices: [
        {
          if: { any: [{ flag: 'ev_tech.pz_lied' }, { flag: 'ev_tech.pz_ignored' }] },
          text: 'Post under your own handle: "Yeah. It was me. I should have said so."',
          effects: [{ faction: 'fac.loft', add: 1 }, { stat: 'mood', add: -2 }, { flag: 'ev_tech.pz_done' }],
          goto: 'late_owned',
        },
        {
          if: { any: [{ flag: 'ev_tech.pz_lied' }, { flag: 'ev_tech.pz_ignored' }] },
          text: 'Log off. Let them talk.',
          effects: [{ stat: 'stress', add: 4 }, { flag: 'ev_tech.pz_done' }],
          goto: 'logged_off',
        },
        {
          if: { not: { any: [{ flag: 'ev_tech.pz_lied' }, { flag: 'ev_tech.pz_ignored' }] } },
          text: 'Reply with an ASCII honeybun wearing a dunce cap. Own the bit.',
          effects: [{ stat: 'mood', add: 4 }, { stat: 'cred', add: 1 }, { flag: 'ev_tech.pz_done' }],
          goto: 'bit',
        },
        {
          if: { not: { any: [{ flag: 'ev_tech.pz_lied' }, { flag: 'ev_tech.pz_ignored' }] } },
          text: 'Say nothing. Close the thread. It\'s over.',
          effects: [{ flag: 'ev_tech.pz_done' }],
          goto: 'over',
        },
      ],
    },
    late_owned: {
      speaker: 'corvid',
      text: '"Late is better than never and worse than on time." That\'s all Corvid posts. People take it as permission to stop piling on. They do not take it as permission to forget. They never will.',
    },
    logged_off: {
      speaker: 'narrator',
      text: 'You log off. The thread runs another hundred posts without you. "Patient Zero" becomes a nickname you will hear, now and then, for years — from people who were not even on the board in 2002.',
    },
    bit: {
      speaker: 'narrator',
      text: 'The dunce-cap honeybun gets forty "LOL"s and gets pinned under the crowned one. The scene loves a person who can take a joke about themselves. The HONEYBUN kid. You could be called worse.',
    },
    over: {
      speaker: 'narrator',
      text: 'You close the thread. A week later it has scrolled off the front page, and HONEYBUN is just a story the board tells new people. It\'s over. You were lucky, and you know it.',
    },
  },
}

const patientZeroQuest: QuestDef = {
  id: 'ev_tech_q_patient_zero',
  title: 'Complication: Patient Zero',
  kind: 'personal',
  summary: 'HONEYBUN.EXE got out of your machine and mailed itself to everyone you know, with your name on it. How you face that decides what the scene remembers.',
  start: 'rounds',
  rewards: 'Your standing on the Row and the Loft — or a nickname you will never shake',
  stages: {
    rounds: {
      text: 'HONEYBUN went out to your whole address book. The fallout is coming: angry neighbors, a curious Loft, maybe your boss. Decide how you answer for it.',
      onEnter: [{ scene: 'ev_tech_pz_rounds_scene', delayHours: 168 }],
      objectives: [
        {
          id: 'answer',
          text: 'Answer for HONEYBUN',
          when: { flag: 'ev_tech.pz_answered' },
          hint: 'The fallout mail lands within a week. Clean up, confess, lie, or stay silent — each one leaves a different mark.',
        },
      ],
      next: 'reckoning',
    },
    reckoning: {
      text: 'The Loft is running a post-mortem on HONEYBUN. Someone will name patient zero; what they say depends on what you did.',
      onEnter: [{ scene: 'ev_tech_pz_reckoning_scene', delayHours: 336 }],
      objectives: [
        {
          id: 'read_thread',
          text: 'Face the HONEYBUN post-mortem thread',
          when: { flag: 'ev_tech.pz_done' },
          hint: 'The thread goes up on the Loft BBS a couple of weeks after the fallout.',
        },
      ],
    },
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// ev_tech_auction_scam — BidBarn, "NEW IN BOX!!"
// ─────────────────────────────────────────────────────────────────────────────
const auctionScene: SceneDef = {
  id: 'ev_tech_auction_scam_scene',
  channel: 'mail',
  title: 'Congratulations! You WON: Arcturus Vortex 9000 XT — NEW IN BOX!!',
  from: 'BidBarn',
  start: 'won',
  expiresDays: 10,
  nodes: {
    won: {
      speaker: 'BidBarn',
      text: [
        'Congratulations, {handle}! You are the winning bidder on:\n\nARCTURUS VORTEX 9000 XT — 128MB — NEW IN BOX!!! RARE!!! NO RESERVE!!!\nWinning bid: $140.00\nSeller: vortex_deals_4u (feedback: 0)',
        'You bid at 3 a.m. with a bravado you do not remember. The Vortex is the card everyone on the board wants and nobody can find. It retails for $399. You got it for $140.',
        'A second message, from the seller, arrived eleven seconds later: "Congrats!! Please pay by wire transfer ONLY, no BidBarn Protect, it takes too long, ship same day!!! God bless."',
        { if: deeAtStore, text: 'On the break-room wall at CompCastle there is a flyer, in Dee\'s handwriting: THE VORTEX IS BACKORDERED UNTIL THE HEAT DEATH OF THE UNIVERSE. DO NOT ASK.' },
      ],
      choices: [
        {
          text: 'Wire the money. $140 for a Vortex is a miracle and miracles don\'t wait.',
          effects: [{ money: -140 }],
          goto: 'photo',
        },
        {
          tag: '[Business]',
          text: 'Insist on BidBarn Protect. Watch him squirm.',
          check: {
            skill: 'business',
            dc: 12,
            bonuses: [{ if: { flag: 'ev_tech.read_fine_print' }, add: 2, label: '+2 (you read the fine print now)' }],
            success: 'squirm',
            fail: 'charmed',
            successEffects: [{ xp: 'business', add: 20 }, { stat: 'mood', add: 2 }],
            failEffects: [{ money: -140 }],
          },
        },
        {
          if: deeAtStore,
          text: 'Ask Dee what she thinks.',
          effects: [{ npc: 'dee', affinity: 2 }, { stat: 'mood', add: 2 }],
          goto: 'dee',
        },
        { tag: '[Leave]', text: 'Retract the bid. Nothing that good is real.', effects: [{ stat: 'mood', add: -1 }], goto: 'walk' },
      ],
    },
    charmed: {
      speaker: 'BidBarn seller',
      text: '"I totally understand!! Protect is great. The only thing is, my mother is in the hospital and the fees would really hurt us right now. But of course it\'s up to you!!" He is so nice about it. You wire the money before you finish feeling bad for him.',
      next: 'photo',
    },
    photo: {
      speaker: 'narrator',
      text: [
        'The box arrives nine days later. It is a big box. Inside the big box is a smaller box. Inside the smaller box, carefully wrapped in bubble wrap, is a photograph of an Arcturus Vortex 9000 XT, printed on an inkjet, slightly smudged.',
        'You re-read the listing. In tiny grey text at the bottom, under the shipping details: "Item as pictured."',
      ],
      choices: [
        {
          tag: '[Business]',
          text: 'File a dispute with BidBarn. Cite everything. Be relentless.',
          check: {
            skill: 'business',
            dc: 14,
            success: 'dispute_won',
            fail: 'dispute_lost',
            successEffects: [{ money: 70 }, { xp: 'business', add: 25 }],
            failEffects: [{ trait: 'ev_tech_scar_read_fine_print' }, { stat: 'stress', add: 4 }],
          },
        },
        {
          tag: '[Networking]',
          text: 'Track down who "vortex_deals_4u" actually is.',
          check: {
            skill: 'networking',
            dc: 14,
            bonuses: [{ if: { background: 'latchkey' }, add: 1, label: '+1 (you notice things)' }],
            success: 'found_seller',
            fail: 'lost_seller',
            successEffects: [{ money: 140 }, { stat: 'cred', add: 1 }, { xp: 'networking', add: 25 }],
            failEffects: [{ trait: 'ev_tech_scar_read_fine_print' }, { stat: 'stress', add: 3 }],
          },
        },
        {
          text: 'Frame the photograph. It is, honestly, a very nice photograph.',
          effects: [{ stat: 'mood', add: 3 }, { flag: 'ev_tech.framed_vortex' }, { trait: 'ev_tech_scar_read_fine_print' }],
          goto: 'framed',
        },
      ],
    },
    squirm: {
      speaker: 'narrator',
      text: 'The seller replies twice, both times with a new reason Protect would be "complicated," and then — when you ask a third time, politely — the listing vanishes, the account vanishes, and so does the problem. You keep your $140. The Vortex remains a legend.',
    },
    dee: {
      speaker: 'dee',
      text: '"Honey." Dee takes your hand like a doctor about to deliver news. "Nobody sells a Vortex for a hundred and forty dollars. Nobody sells a Vortex. I have had one on order since June and I am a manager. Retract that bid and go heal a customer."',
    },
    walk: {
      speaker: 'narrator',
      text: 'You retract the bid. Three days later, the board has a thread titled "BIDBARN VORTEX SCAM — who else got the photo?" It has forty replies. You don\'t post in it. You just read it, slowly, with enormous satisfaction.',
    },
    dispute_won: {
      speaker: 'BidBarn',
      text: 'BidBarn Resolution Center: "After review, we have determined that a photograph of an item does not constitute the item. A partial refund of $70.00 has been issued. We apologize for the inconvenience." Partial. But you\'ll take it.',
    },
    dispute_lost: {
      speaker: 'BidBarn',
      text: 'BidBarn Resolution Center: "After review, we have determined that the item was shipped as described (\'Item as pictured\'). Transactions completed outside BidBarn Protect are not eligible for resolution. Thank you for being a valued member." You print it out and keep it in your wallet, as a reminder.',
    },
    found_seller: {
      speaker: 'narrator',
      text: 'The trail ends at a fifteen-year-old in Ridgeport with a very expensive new skateboard. You write his mother a polite, detailed letter. Two weeks later, a money order for $140 arrives with a note in angry teenage handwriting: "sorry. my mom made me."',
    },
    lost_seller: {
      speaker: 'narrator',
      text: 'You chase him through three accounts and a mail drop, and then the trail just stops. The last thing you find is his new listing: "ARCTURUS VORTEX 9000 XT — NEW IN BOX!!! RARE!!!" Eleven bids already.',
    },
    framed: {
      speaker: 'narrator',
      text: 'You buy a $4 frame. The Vortex 9000 XT hangs over your desk, glossy and useless. Visitors assume it is ironic. It isn\'t, exactly. It\'s a reminder. It cost you $140 and it will save you much more than that.',
    },
  },
}

const auctionScam: EventDef = {
  id: 'ev_tech_auction_scam',
  category: 'money',
  weight: 1,
  when: { all: [between(dayOf(2002, 0, 15), dayOf(2005, 11, 31)), free, { stat: 'money', gte: 150 }] },
  scene: 'ev_tech_auction_scam_scene',
}

// ─────────────────────────────────────────────────────────────────────────────
// ev_tech_capacitors — the bloat
// ─────────────────────────────────────────────────────────────────────────────
const capsScene: SceneDef = {
  id: 'ev_tech_capacitors_scene',
  channel: 'dialog',
  title: 'The Bloat',
  from: 'your machine',
  start: 'reboot',
  nodes: {
    reboot: {
      speaker: 'narrator',
      text: [
        'Your machine has started rebooting itself. Twice during dinner. Once mid-sentence, in a chat you were enjoying. It doesn\'t crash, exactly; it just blinks out and comes back, like someone who fainted and is pretending they didn\'t.',
        'You open the case and shine a flashlight on the motherboard. Near the processor, three of the little cylindrical capacitors have domed tops, crusted brown, like tiny overcooked muffins.',
        'The board calls it "the bloat": a whole generation of cheap capacitors from one bad factory, dying on schedule in machines all over the world.',
        { if: { background: 'tinkerer' }, text: 'You recapped a boombox when you were twelve. This is the same thing, smaller, and a great deal more expensive to get wrong.' },
        { if: atCompCastle, text: 'At the CompCastle bench, customers bring these boards in every week. You have a drawer of fresh capacitors at work and a key to the drawer.' },
      ],
      choices: [
        {
          tag: '[Hardware]',
          text: 'Borrow a soldering iron and recap it yourself. Twelve capacitors, a steady hand, the right way round.',
          check: {
            skill: 'hardware',
            dc: 14,
            bonuses: [
              { if: { background: 'tinkerer' }, add: 2, label: '+2 (tinkerer)' },
              { if: atCompCastle, add: 2, label: '+2 (you do this at the bench)' },
              { if: { item: 'book_hardware' }, add: 1, label: '+1 (you read the manual, twice)' },
            ],
            success: 'recap_ok',
            fail: 'smoke',
            successEffects: [{ money: -12 }, { xp: 'hardware', add: 40 }, buff(SETTLED), { flag: 'ev_tech.recapped' }],
            failEffects: [{ money: -12 }, buff(FRIED_RIG), { trait: 'ev_tech_scar_magic_smoke' }, { stat: 'stress', add: 6 }],
          },
        },
        {
          text: 'Buy a replacement board. $180 and an afternoon of reinstalling everything.',
          req: { stat: 'money', gte: 180 },
          reqText: 'Requires $180',
          effects: [{ money: -180 }, { xp: 'hardware', add: 10 }, buff(NEW_TOY)],
          goto: 'new_board',
        },
        {
          if: atCompCastle,
          text: 'Bring it to the bench after closing. Employee discount on parts, employee access to the good iron.',
          effects: [{ money: -40 }, { xp: 'hardware', add: 20 }, { stat: 'mood', add: 2 }, { if: deeAtStore, then: [{ npc: 'dee', affinity: 1 }] }],
          goto: 'bench',
        },
        {
          text: 'Keep using it. It only reboots sometimes.',
          effects: [buff(FRIED_RIG), { stat: 'stress', add: 2 }],
          goto: 'limp',
        },
      ],
    },
    recap_ok: {
      speaker: 'narrator',
      text: 'The iron hisses. The old caps come out with a smell like burnt sugar. Twelve new ones go in, stripe side the right way, each joint a tiny silver volcano. It boots. It stays booted. It runs for a week, a month, and forgets it ever fainted. You feel, briefly, like a surgeon.',
    },
    smoke: {
      speaker: 'narrator',
      text: [
        'Eleven go in perfectly. The twelfth goes in backwards.',
        'You find out when you power on: a sharp CRACK, a puff of grey, and a smell that will live in your memory for the rest of your life. The magic smoke — the thing that makes electronics work — has left the building. The board limps now, like it\'s been punched.',
      ],
      choices: [
        {
          text: 'Buy the replacement board now. Lesson learned.',
          req: { stat: 'money', gte: 180 },
          reqText: 'Requires $180',
          effects: [{ money: -180 }, { removeBuff: 'ev_tech_fried_rig' }],
          goto: 'after_smoke',
        },
        { text: 'Live with it until you can afford better.', effects: [{ stat: 'mood', add: -3 }] },
      ],
    },
    after_smoke: {
      speaker: 'narrator',
      text: 'The new board goes in. The scorched one goes on a shelf above your desk, a small burnt monument. You never install a capacitor again without checking the stripe three times.',
    },
    new_board: {
      speaker: 'narrator',
      text: 'The new board is faster than the old one ever was, which is how it always goes: you pay to fix a problem and accidentally buy an upgrade. The dead one goes in the closet with the other dead things.',
    },
    bench: {
      speaker: 'narrator',
      text: [
        'After closing, under the bench lights, with the good iron. It takes forty minutes and goes perfectly.',
        { if: deeAtStore, text: 'Dee walks past on her way out, stops, and stares. "Is that a personal board on my bench?" A long pause. "I am going to pretend I didn\'t see a thing, because I am a saint and I am tired."' },
      ],
    },
    limp: {
      speaker: 'narrator',
      text: 'It reboots twice a day, then three times. You learn to save every ninety seconds. You learn to flinch at the fan changing pitch. Every reboot is a small coin toss. Eventually, you know, it will land on the wrong side.',
    },
  },
}

const capacitors: EventDef = {
  id: 'ev_tech_capacitors',
  category: 'tech',
  weight: 1,
  when: { all: [between(dayOf(2003, 2, 1), dayOf(2007, 6, 1)), free] },
  scene: 'ev_tech_capacitors_scene',
}

// ─────────────────────────────────────────────────────────────────────────────
// ev_tech_game_launch — Embermoor Online, midnight
// ─────────────────────────────────────────────────────────────────────────────
const notAtStore: Cond = { not: atCompCastle }

const launchScene: SceneDef = {
  id: 'ev_tech_game_launch_scene',
  channel: 'dialog',
  title: 'Midnight Launch: Embermoor Online',
  from: 'Sodium Row',
  start: 'line',
  nodes: {
    line: {
      speaker: 'narrator',
      text: [
        { if: notAtStore, text: 'Sodium Row, 11:40 p.m., November drizzle. The line outside Pixel Palace wraps past the Cathode and around the pager shop: two hundred people in wizard hats and rain ponchos, waiting for Embermoor Online — the game the whole board has been posting screenshots of for eighteen months.' },
        { if: atCompCastle, text: 'CompCastle Millgate, 11:40 p.m. Corporate saw the numbers and ordered a midnight launch of Embermoor Online. The line runs from the registers out through the parking lot. The assistant manager has handed you a clipboard. The clipboard is the plan.' },
        { if: around('byteme'), text: 'byteme is somewhere near the front, holding a sign that says I HAVE WAITED 18 MONTHS AND 6 HOURS.' },
        'Somebody has brought a boombox playing the game\'s trailer music on a loop. Somebody else is dressed as a dragon. The dragon is soaked. The dragon does not care. This is the happiest line in Port Lumen.',
      ],
      choices: [
        {
          if: notAtStore,
          tag: '[Fitness]',
          text: 'Hold your place in line, all night, in the rain.',
          check: {
            skill: 'fitness',
            dc: 11,
            bonuses: [
              { if: { trait: 'gym_rat' }, add: 2, label: '+2 (gym rat)' },
              { if: { background: 'arcade_rat' }, add: 1, label: '+1 (you\'ve camped for high scores)' },
            ],
            success: 'got_it',
            fail: 'soaked',
            successEffects: [{ money: -50 }, { flag: 'ev_tech.embermoor' }, buff(ONE_MORE_QUEST), { stat: 'mood', add: 8 }],
            failEffects: [
              { money: -50 },
              { flag: 'ev_tech.embermoor' },
              buff(ONE_MORE_QUEST),
              { stat: 'health', add: -12 },
              { stat: 'energy', add: -15 },
              { chance: 0.5, then: [{ complication: 'health' }] },
            ],
          },
        },
        {
          if: { all: [notAtStore, around('byteme')] },
          text: 'Page byteme and bribe your way into his spot at the front. Pizza is currency.',
          effects: [{ money: -60 }, { flag: 'ev_tech.embermoor' }, buff(ONE_MORE_QUEST), { npc: 'byteme', affinity: 3 }, { stat: 'mood', add: 5 }],
          goto: 'friend_holds',
        },
        {
          if: notAtStore,
          text: 'Buy it off a scalper at the back of the line for double.',
          req: { stat: 'money', gte: 100 },
          reqText: 'Requires $100',
          effects: [{ money: -100 }, { flag: 'ev_tech.embermoor' }, buff(ONE_MORE_QUEST), { stat: 'mood', add: 3 }],
          goto: 'scalper',
        },
        {
          if: notAtStore,
          text: 'Soak in the joy of it for an hour, then go home without the game.',
          effects: [{ stat: 'mood', add: 3 }, { stat: 'stress', add: -3 }, { flag: 'ev_tech.skipped_embermoor' }],
          goto: 'home',
        },
        {
          if: atCompCastle,
          tag: '[Social]',
          text: 'Run the line like air traffic control. Jokes, order, and nobody gets trampled.',
          check: {
            skill: 'social',
            dc: 13,
            bonuses: [
              { if: { background: 'class_clown' }, add: 2, label: '+2 (you can work a crowd)' },
              { if: { trait: 'silver_tongue' }, add: 2, label: '+2 (silver tongue)' },
            ],
            success: 'store_win',
            fail: 'store_riot',
            successEffects: [{ money: 60 }, { stat: 'mood', add: 4 }, { flag: 'ev_tech.embermoor' }, buff(ONE_MORE_QUEST)],
            failEffects: [buff(THIN_ICE), { stat: 'stress', add: 8 }, { chance: 0.4, then: [{ complication: 'work' }] }],
          },
        },
        {
          if: atCompCastle,
          text: 'Hide in the stockroom and let the line sort itself out.',
          effects: [buff(THIN_ICE), { stat: 'mood', add: 1 }],
          goto: 'stockroom',
        },
        {
          if: atCompCastle,
          text: 'Quietly set aside one copy for yourself before the doors open.',
          effects: [{ money: -50 }, { flag: 'ev_tech.embermoor' }, buff(ONE_MORE_QUEST), { chance: 0.3, then: [buff(THIN_ICE)] }],
          goto: 'stash',
        },
      ],
    },
    got_it: {
      speaker: 'narrator',
      text: 'At 12:01 the doors open and the line cheers like a stadium. You walk out with the box held against your chest under your jacket, dry, like a newborn. By 3 a.m. you have a level-9 healer named after your first modem.',
    },
    soaked: {
      speaker: 'narrator',
      text: [
        'You get the game. You also get the rain, all of it, for five hours, and by the time the doors open you cannot feel your feet.',
        'Two days later you are in bed with a fever, playing Embermoor with the laptop on your knees and a box of tissues on the pillow. Worth it? Your immune system has filed a formal complaint.',
      ],
    },
    friend_holds: {
      speaker: 'byteme',
      text: 'byteme: ok ur in. i told the guy behind me ur my "cousin." he knows ur not. he respects the hustle. also u owe me 2 pizzas now not 1, inflation',
    },
    scalper: {
      speaker: 'narrator',
      text: 'The scalper is sixteen and has four copies in a gym bag. He takes your money with the solemnity of a banker. You feel a little dirty and extremely happy.',
    },
    home: {
      speaker: 'narrator',
      text: 'You stand in the rain for an hour, talking to a soaked dragon about the lore. It is one of the best nights of your year. You go home without the game and sleep well. Somewhere across the city, two hundred people do not sleep at all.',
    },
    store_win: {
      speaker: 'narrator',
      text: [
        'You number the line with a marker. You run a trivia contest for the back half. You find the dragon a towel. At 12:01 the registers open and nobody gets trampled, which the district manager, watching from his car, calls "a CompCastle first."',
        'Overtime, a spot bonus, and a copy of the game the assistant manager slides across the counter with a wink. Legendary.',
      ],
    },
    store_riot: {
      speaker: 'narrator',
      text: [
        'At 11:58 the line surges. Someone leans on the cardboard dragon display. The cardboard dragon, eight feet tall, falls on the line with enormous dignity. A kid cries. Somebody\'s dad demands a manager. You are, briefly, the manager.',
        'The district manager watched it all from his car. On Monday your name is on a sticky note on his clipboard.',
      ],
    },
    stockroom: {
      speaker: 'narrator',
      text: 'You spend the launch in the stockroom reading the game\'s manual cover to cover. It is a very good manual. The line sorts itself out, mostly. The assistant manager notices you were gone. Everyone notices you were gone.',
    },
    stash: {
      speaker: 'narrator',
      text: 'One copy, under the counter, under your jacket, in your bag. It is technically paid for. It is technically not allowed. It is technically the most exciting thing you have done at work all year.',
    },
  },
}

const gameLaunch: EventDef = {
  id: 'ev_tech_game_launch',
  category: 'era',
  weight: 3,
  when: { all: [between(dayOf(2004, 10, 1), dayOf(2005, 8, 1)), free] },
  scene: 'ev_tech_game_launch_scene',
}

// ─────────────────────────────────────────────────────────────────────────────
// ev_tech_lighthouse_cam — the Gull Point webcam
// ─────────────────────────────────────────────────────────────────────────────
const camScene: SceneDef = {
  id: 'ev_tech_lighthouse_cam_scene',
  channel: 'forum',
  board: 'offtopic',
  title: 'anyone else watch the Gull Point cam at night?',
  from: 'Lamplighter',
  start: 'post',
  expiresDays: 14,
  nodes: {
    post: {
      speaker: 'Lamplighter',
      text: [
        'There\'s a webcam on the old Gull Point lighthouse, out past the breakwater. One frame every thirty seconds, grey and grainy, the Sound and the lamp room window.',
        'The light\'s been automated since \'89. The last keeper, Anselm Crane, died in the winter of 2000. The cam\'s still up. Somebody still pays the hosting. And every night at 3:10 a.m., the lamp room light goes on for exactly one frame.',
        'Every night. I\'ve watched for a month. Anyone know who runs it?\n\n-- Lamplighter :: "keep a light on" --',
        { if: around('byteme'), text: 'byteme: ok thats creepy and i love it. watching tonight. if i get haunted its ur fault' },
        { if: around('flamer'), text: 'l33tKÎLLƏR: its a TIMER. its a TIMER you absolute NOOBS. (watching tonight tho)' },
      ],
      choices: [
        {
          tag: '[Networking]',
          text: 'Find out who pays for the hosting. The cam has to phone home somewhere.',
          check: {
            skill: 'networking',
            dc: 13,
            bonuses: [{ if: { background: 'arcade_rat' }, add: 2, label: '+2 (you know how these old hosts work)' }],
            success: 'found',
            fail: 'tripped',
            successEffects: [{ flag: 'ev_tech.cam_found' }, { stat: 'mood', add: 4 }, { faction: 'fac.hood', add: 1 }, { xp: 'networking', add: 30 }],
            failEffects: [{ flag: 'ev_tech.cam_dark' }, buff(GUILT), { stat: 'stress', add: 4 }],
          },
        },
        {
          text: 'Stay up and watch for the 3:10 light yourself.',
          effects: [{ stat: 'energy', add: -8 }, { stat: 'mood', add: 3 }, { flag: 'ev_tech.cam_watched' }, buff(SPOOKED)],
          goto: 'watched',
        },
        {
          tag: '[Social]',
          text: 'Post a ghost story so good the whole board starts watching.',
          check: {
            skill: 'social',
            dc: 11,
            bonuses: [{ if: { background: 'class_clown' }, add: 2, label: '+2 (you know how to tell it)' }],
            success: 'lore',
            fail: 'lore_flop',
            successEffects: [{ stat: 'cred', add: 1 }, { stat: 'mood', add: 4 }, { flag: 'ev_tech.cam_legend' }],
            failEffects: [{ stat: 'cred', add: -1 }, { stat: 'mood', add: -2 }],
          },
        },
        { tag: '[Leave]', text: 'Close the tab. Some things should stay unexplained.', effects: [{ stat: 'stress', add: -1 }] },
      ],
    },
    found: {
      speaker: 'narrator',
      text: [
        'The hosting is paid by money order from a post office box on Cannery Row, in the name of Iris Crane. She is eighty-one. You write her a careful, polite note. She writes back, by hand, scanned crooked:',
        '"Anselm kept that light forty years. I can\'t keep it, not really. But I can drive out at ten past three and climb the stairs and flick the switch once, so he knows I\'m still here. Please don\'t tell anyone. Well. You can tell your board it\'s not a ghost. It\'s only me."',
        'You post one line in the thread: "not a ghost. somebody who loves him. leave it be." For once, the board does.',
      ],
    },
    tripped: {
      speaker: 'narrator',
      text: [
        'You poke the little server too hard. Somewhere an automated abuse notice goes out to whoever owns it: SUSPICIOUS ACTIVITY DETECTED ON YOUR ACCOUNT.',
        'The next night, at 3:10, there is no light. The night after, there is no cam. The page just says "offline." The thread fills with people asking what happened, and you don\'t answer, because you know.',
      ],
    },
    watched: {
      speaker: 'narrator',
      text: [
        '3:09. The Sound, grey on grey. 3:10. The lamp room light goes on — and in the window, for one frame, there is a shape. A person. Small. One hand raised, as if waving.',
        '3:10:30. Dark again. You sit in the blue light of the monitor for a long time, not sure if you just saw a ghost or a person, and not sure which one would be sadder.',
      ],
    },
    lore: {
      speaker: 'narrator',
      text: 'Your post — the keeper, the storm of \'78, the lamp he swore he\'d never let go dark — becomes the most-read thread on offtopic. Forty people start watching the cam at 3:10. The Gull Point light becomes a Loft tradition: "see you at ten past."',
    },
    lore_flop: {
      speaker: 'flamer',
      text: 'lmao "the keeper\'s restless spirit" ok grandpa. its a TIMER. nobody cares about ur spooky story. (it was kinda good tho. no it wasnt. forget i said that)',
    },
  },
}

const lighthouseCam: EventDef = {
  id: 'ev_tech_lighthouse_cam',
  category: 'weird',
  weight: 1,
  when: { all: [between(60, dayOf(2004, 11, 31)), free] },
  scene: 'ev_tech_lighthouse_cam_scene',
}

// ─────────────────────────────────────────────────────────────────────────────
// ev_tech_easter_egg — the flight simulator in Ledger 2000
// ─────────────────────────────────────────────────────────────────────────────
const halcyonDesk: Cond = { job: ['job_halcyon_junior', 'job_halcyon_senior', 'job_halcyon_lead'] }

const eggScene: SceneDef = {
  id: 'ev_tech_easter_egg_scene',
  channel: 'dialog',
  title: 'Ledger 2000, Row 2000',
  from: 'your office',
  start: 'egg',
  nodes: {
    egg: {
      speaker: 'narrator',
      text: [
        'It is a slow afternoon. Somebody on the office forum swears that if you open Ledger 2000, go to row 2000, select column X, and hold three keys while clicking the chart wizard, a secret 3D flight simulator launches — built by the Ledger team in secret, inside the product, past every manager at CasementSoft.',
        'You try it. The screen goes black. Then a wireframe landscape unrolls under you, and you are flying over a valley made of spreadsheet cells. At the end of the valley is a mountain, and there are names carved into it.',
        { if: { all: [halcyonDesk, around('priya')] }, text: 'Priya walks past your desk, stops dead, and leans in. "Oh no," she says softly. "Oh, it still works?" She looks, for a second, twenty years younger.' },
      ],
      choices: [
        {
          text: 'Call everyone over. This is the best thing that has happened in this office all year.',
          effects: [{ stat: 'mood', add: 6 }, { stat: 'stress', add: -8 }],
          goto: 'party',
        },
        {
          tag: '[Programming]',
          text: 'Fly to the mountain. There is always a hidden room, and you are going to find it.',
          check: {
            skill: 'programming',
            dc: 15,
            bonuses: [
              { if: { background: 'mathlete' }, add: 2, label: '+2 (you think in grids)' },
              { if: { trait: 'bookworm' }, add: 1, label: '+1 (you\'ve read about eggs like this)' },
            ],
            success: 'dev_room',
            fail: 'crash',
            successEffects: [{ xp: 'programming', add: 40 }, { stat: 'cred', add: 1 }, { stat: 'mood', add: 5 }, { flag: 'ev_tech.found_dev_room' }],
            failEffects: [buff(THIN_ICE), { stat: 'stress', add: 10 }],
          },
        },
        {
          tag: '[Business]',
          text: 'Write a memo proposing the company "innovate with this kind of joy." Attach a screenshot.',
          check: {
            skill: 'business',
            dc: 12,
            success: 'memo_win',
            fail: 'memo_fail',
            successEffects: [{ money: 75 }, { stat: 'mood', add: 3 }],
            failEffects: [buff(THIN_ICE), { stat: 'stress', add: 3 }],
          },
        },
        { tag: '[Leave]', text: 'Close it before your manager walks by.', effects: [{ stat: 'mood', add: 1 }] },
      ],
    },
    party: {
      speaker: 'narrator',
      text: 'Within five minutes there are nine people around your monitor. Within ten, the break-room forum has instructions, and every machine on the floor is flying over the valley. Your manager comes to see what the noise is, watches for a minute, and says, "Move over."',
    },
    dev_room: {
      speaker: 'narrator',
      text: [
        'Behind the mountain, if you fly into it at exactly the right angle, there is a small grey room with a single line of text on the wall:',
        '"If you found this, you\'re one of us. They told us not to. We did it anyway. Ship the thing you believe in. — the Ledger team, 1999."',
        'You sit back. You think about everything you have built for other people and everything you have built because you could not stop yourself. You take a screenshot, and then, after a moment, you delete it. Some rooms should stay hidden.',
      ],
    },
    crash: {
      speaker: 'narrator',
      text: [
        'You fly into the mountain at the wrong angle. Ledger 2000 freezes. Then the network drive it was open on freezes. Then a person three desks down says, "Why did the quarterly numbers just close?"',
        'The shared accounting workbook — the big one, the one with the quarter in it — is locked and corrupt, forty minutes before close.',
      ],
      choices: [
        {
          tag: '[Systems]',
          text: 'Restore it from the overnight copy before anyone traces the lock to your login.',
          check: {
            skill: 'systems',
            dc: 14,
            success: 'restored',
            fail: 'traced_to_you',
            successEffects: [{ removeBuff: 'ev_tech_thin_ice' }, { xp: 'systems', add: 30 }, { stat: 'stress', add: -4 }],
            failEffects: [{ stat: 'stress', add: 6 }, { chance: 0.5, then: [{ complication: 'work' }] }],
          },
        },
        {
          text: 'Walk to your manager\'s office and confess before anyone else figures it out.',
          effects: [{ stat: 'stress', add: 2 }, { stat: 'mood', add: 1 }],
          goto: 'confess',
        },
      ],
    },
    restored: {
      speaker: 'narrator',
      text: 'The overnight copy is six hours old. You rebuild the six hours from the change log, one cell at a time, heart going like a drum. At close, the quarter balances. Nobody ever knows. You never open Ledger 2000 at row 2000 again. Almost never.',
    },
    traced_to_you: {
      speaker: 'narrator',
      text: 'The restore fails; the IT guy doesn\'t. By 5 p.m. there is an email with your login name in it and the words "flight simulator" in quotation marks. Accounting stays until nine. Accounting will remember you.',
    },
    confess: {
      speaker: 'narrator',
      text: 'Your manager listens to the whole thing, face very still. "A flight simulator," he repeats. Then, after a long moment: "Did you find the room behind the mountain?" You did not. "Neither did I," he says. "Go help accounting." You are on thin ice. But it is honest ice.',
    },
    memo_win: {
      speaker: 'narrator',
      text: 'Your manager forwards it up with "thoughts?" and somebody two levels above him writes back "love this energy." You get a $75 spot bonus and a tote bag with the company logo on it. You will never know if anyone opened the screenshot.',
    },
    memo_fail: {
      speaker: 'narrator',
      text: 'Your manager reads it as a joke at his expense. He is not wrong that it is a little bit of one. "Let\'s focus on the deliverables," he says, in a voice like a closing door.',
    },
  },
}

const easterEgg: EventDef = {
  id: 'ev_tech_easter_egg',
  category: 'work',
  weight: 2,
  when: { all: [officeJob, free, actLte(3), { day: true, gte: dayOf(2002, 0, 1) }] },
  scene: 'ev_tech_easter_egg_scene',
}

export default defineContent({
  scenes: [wormScene, pzRoundsScene, pzReckoningScene, auctionScene, capsScene, launchScene, camScene, eggScene],
  quests: [patientZeroQuest],
  events: [worm, auctionScam, capacitors, gameLaunch, lighthouseCam, easterEgg],
})
