/**
 * PKG-05 — fac_loft_q5_sysop, "The Sysop Question" (bible §7.1 step 5).
 *
 * Corvid is stepping down — or facing prison, if the first raid left her charged and nobody
 * organized the wipe. This quest is the sole decider of Corvid `martyred` vs `free`, and where the
 * chair goes:
 *  - already solidarity-saved → she's free; you may be named.
 *  - charged & you fight and win → charges cleared, she's free.
 *  - charged & you don't/can't fight → `martyred` (news.corvid_trial fires ambiently, PKG-16).
 *  - accept → `fac.loft.sysop='player'` (+`a3.you_are_sysop`); decline → a successor among the
 *    available {mira, deadline, switch}; none available → the board goes dark.
 *
 * PKG-05 is the sole writer of `npc.corvid.fate`; the first raid only sets the `.charged` flag.
 * PKG-04's §4.6 finalization keeps a `martyred` set here (its first rule), so a Corvid who goes
 * down stays down even if you take her chair.
 */
import { defineContent } from '@/engine/registry'
import type { Effect, SceneDef } from '@/engine/types'
import {
  LOFT,
  boardGoesDark,
  corvidSentenced,
  corvidStepsDownFree,
  corvidTrialPending,
  deadlineAvailable,
  miraAvailable,
  switchAvailable,
  switchTakesBoard,
} from './common'

/** She is free, and you took the chair: the clean succession. */
const acceptFree: Effect[] = [
  { flag: 'fac.loft.sysop', set: 'player' },
  { flag: 'a3.you_are_sysop' },
  { npc: 'corvid', fate: 'succeeded', affinity: 8 },
  { faction: LOFT, add: 10 },
  { flag: 'fac.loft.q5_done' },
]

/** She is going to prison, and you took the chair anyway: you run what she died for. */
const acceptMartyr: Effect[] = [
  { flag: 'fac.loft.sysop', set: 'player' },
  { flag: 'a3.you_are_sysop' },
  ...corvidSentenced,
  { faction: LOFT, add: 6 },
  { flag: 'fac.loft.q5_done' },
]

const declineDone: Effect[] = [{ flag: 'fac.loft.q5_done' }]

const scenes: SceneDef[] = [
  {
    id: 'loft_q5_sysop',
    channel: 'dialog',
    title: 'The Sysop Question',
    from: 'corvid',
    start: 'open',
    nodes: {
      open: {
        speaker: 'narrator',
        text: [
          'Corvid asks you to the back room on a night nobody else is invited, which has never happened. The couch is empty. She\'s made coffee, which is worse than a threat.',
          { if: { flag: 'a2.solidarity' }, text: 'The charges from the raid went nowhere — forty wiped drives and forty closed mouths saw to that. She\'s free. She just looks tired in a way that isn\'t about sleep.' },
          { if: { flag: 'fac.loft.side_switch' }, text: 'You backed Switch, once. She never brought it up. She\'s bringing you coffee tonight, which is its own kind of comment.' },
          { if: { flag: 'fac.loft.intact' }, text: 'The board she\'s about to hand over is bruised but alive — the couch still fills up to argue over donuts. You did that.' },
          { if: { flag: 'fac.loft.bleeding' }, text: 'The board she\'s about to hand over is half-empty. You both know it. Neither of you says it.' },
          { if: { flag: 'fac.bureau.wired_loft' }, text: 'She pours your coffee and, before she hands it over, rests two fingers on your collar, lightly, the way you\'d check a child for fever. Then she lets it go. You will never know what she knew.' },
          { if: { flag: 'fac.bureau.outed' }, text: 'The whole Row knows about the booth by the jukebox now. She invited you anyway. She hasn\'t said a word about it, which from Corvid is either forgiveness or a very long fuse.' },
        ],
        next: 'her_case',
      },
      her_case: {
        speaker: 'corvid',
        text: [
          { if: corvidTrialPending, text: '"I\'ll say it plainly. They\'re going to convict me. Eight years, my lawyer thinks, and my lawyer is an optimist. So this is the last board meeting I run as a free woman, and I need to know it lands somewhere that won\'t sell it."' },
          {
            if: { not: corvidTrialPending },
            text: '"Twenty years, this chair. I\'m tired, and tired is when people make the mistake that ends a scene. I want to hand it off while I still can choose who to. That means you, if you\'ll have it, or somebody you trust if you won\'t."',
          },
        ],
        choices: [
          {
            tag: '[Business DC 18]',
            text: '"You are not going to prison. Not while the whole Row can crowd a courthouse. Let me organize your defense the way you organized \'94." (Fight the charges.)',
            if: corvidTrialPending,
            check: {
              skill: 'business',
              dc: 18,
              bonuses: [
                { if: { faction: LOFT, gte: 80 }, add: 3, label: '+3 (Inner: the whole scene stands up)' },
                { if: { item: 'scene_archive' }, add: 2, label: '+2 (you guarded her archive)' },
              ],
              success: 'fight_win',
              fail: 'fight_lose_ledger',
              failEffects: [
                { flag: 'fac.loft.defense_debt' },
                { obligation: { id: 'pkg05_loft_defense_debt', label: 'Corvid\'s defense — the lawyer you signed for', perDay: 22, days: 60 } },
                { stat: 'stress', add: 6 },
              ],
            },
          },
          {
            tag: '[Social DC 18]',
            text: '"A jury is just a room full of people, and a room full of people is a thing I know how to talk to. Give me the stand and a week." (Fight the charges.)',
            if: corvidTrialPending,
            check: {
              skill: 'social',
              dc: 18,
              bonuses: [
                { if: { faction: LOFT, gte: 80 }, add: 3, label: '+3 (Inner: the whole scene stands up)' },
                { if: { trait: 'silver_tongue' }, add: 2, label: '+2 (silver tongue)' },
              ],
              success: 'fight_win',
              fail: 'fight_lose_stand',
              failEffects: [
                { flag: 'fac.loft.testified' },
                { trait: 'pkg05_loft_on_the_record' },
                { stat: 'heat', add: 12 },
                { chance: 0.4, then: [{ complication: 'legal' }] },
              ],
            },
          },
          {
            tag: '[Pay $8,000]',
            text: '"You need the best lawyer in Port Lumen, not the cheapest. I\'ll cover it. Every cent." (Fight the charges.)',
            if: { all: [corvidTrialPending, { stat: 'money', gte: 8000 }] },
            effects: [{ money: -8000 }],
            goto: 'fight_win',
          },
          {
            text: '"...I can\'t stop this one. I\'m sorry. I don\'t have the money or the words." (Let it happen.)',
            if: corvidTrialPending,
            goto: 'she_falls',
          },
          {
            text: 'She\'s free, and she\'s asking. Answer the real question: the chair.',
            if: { not: corvidTrialPending },
            goto: 'the_chair',
          },
        ],
      },

      // ── Fighting the charges ─────────────────────────────────────────────
      fight_win: {
        speaker: 'narrator',
        text: [
          'You don\'t win it in a courtroom, exactly. You win it in the weeks before one: character letters from a church-basement computer class, a diner owner who cooks for the jury pool by accident, a confiscation inventory that a good lawyer turns into a story about overreach.',
          'The charges are dismissed on a Thursday. Corvid reads the ruling twice, folds it into a small square, and puts it in her coat pocket like a receipt.',
        ],
        effects: [
          { clearFlag: 'npc.corvid.charged' },
          { flag: 'fac.loft.corvid_cleared' },
          { npc: 'corvid', fate: 'free', affinity: 10 },
          { faction: LOFT, add: 12 },
        ],
        next: 'the_chair',
      },
      fight_lose_ledger: {
        speaker: 'narrator',
        text: [
          'You run the defense like a business, because that\'s what you know: a fund, a spreadsheet, a real lawyer from Millgate with a real hourly rate. The Row chips in the first week. By the third, the jar on the pager-shop counter is mostly pennies and one Canadian quarter.',
          'The lawyer does not work for pennies. When the fund runs dry halfway through the trial, somebody has to sign for the rest. You sign. It seemed like the least you could do. It turns out to be the most expensive least you could do.',
        ],
        next: 'fight_lose',
      },
      fight_lose_stand: {
        speaker: 'narrator',
        text: [
          'They let you take the stand as a character witness, and for twenty minutes you are magnificent: the church-basement class, the kid who learned to read on a donated machine, the woman who never once sold a name.',
          'Then the prosecutor stands up, pleasant as a dentist, and asks one question. "And where were you, personally, the night of the raid?" You answer it, because you are under oath and because you are you. It is true. It is also now a transcript, with your legal name at the top, in a building full of police.',
        ],
        next: 'fight_lose',
      },
      fight_lose: {
        speaker: 'narrator',
        text: [
          'You try. God, you try. But the case is the case, and there is a limit to what letters and a good diner can do against a confiscation inventory read aloud in a flat voice.',
          'She squeezes your shoulder afterward, in the hallway, and says the worst possible thing kindly: "You did more than \'94 got. It just wasn\'t this year\'s year."',
        ],
        next: 'she_falls',
      },
      she_falls: {
        speaker: 'corvid',
        text: [
          '"Eight years. I\'ve had worse Tuesdays." She hasn\'t, and you both know it. "So the chair matters more, not less. Somebody keeps the lights on. Somebody who won\'t sell the building."',
          '"You, if you\'ll take it. From in here I can still name a sysop. It\'s the last thing they can\'t confiscate."',
        ],
        next: 'the_chair_martyr',
      },

      // ── The chair, she's free ────────────────────────────────────────────
      the_chair: {
        speaker: 'corvid',
        text: [
          '"So. The board. It\'s yours if you want it — the handle, the keys, the couch, the twenty years of grudges filed alphabetically."',
          { if: { faction: LOFT, gte: 80 }, text: '"And nobody will fight you for it. You\'re Inner; the whole scene already treats you like the answer. Clean succession, uncontested. I made sure."' },
          '"Or you say no, and we find the next best hands, and I go plant a garden and pretend I don\'t check the board every morning."',
        ],
        choices: [
          {
            text: '"I\'ll take it. Keep the commons. I\'ll wipe the building before I sell it."',
            if: { faction: LOFT, gte: 80 },
            effects: acceptFree,
            goto: 'accepted',
          },
          {
            text: '"I\'ll take it. Keep the commons." (Not everyone on the board will agree.)',
            if: { faction: LOFT, lte: 79 },
            goto: 'contested',
          },
          {
            tag: '[Inner]',
            text: 'Take the chair uncontested, the whole scene behind you.',
            if: { faction: LOFT, lte: 79 },
            req: { faction: LOFT, gte: 80 },
            reqText: 'Requires Loft rep 80 (Inner)',
          },
          {
            text: '"Not me. I\'ll help you pick the right hands." (Name a successor.)',
            effects: [corvidStepsDownFree],
            goto: 'successor',
          },
        ],
      },

      // ── The chair, she's going down ──────────────────────────────────────
      the_chair_martyr: {
        speaker: 'narrator',
        text: 'She is asking you to inherit a fire she is walking into for. There is no clean version of this answer.',
        choices: [
          {
            text: '"I\'ll take it. I\'ll run it exactly like it\'s yours, because it is. I\'ll write to you every week."',
            effects: acceptMartyr,
            goto: 'accepted_martyr',
          },
          {
            text: '"I can\'t be the face of this. But I\'ll make sure it goes to someone who\'ll keep faith." (Name a successor.)',
            effects: corvidSentenced,
            goto: 'successor',
          },
        ],
      },

      // ── A contested chair (below Inner) ──────────────────────────────────
      contested: {
        speaker: 'narrator',
        text: [
          'Word gets out before the coffee is cold. By midnight there is a thread on the members board titled "so we just HAND it to them now??", and by one there is Switch in the doorway, leaning, which means he came to fight.',
          '"No offense," he says, which means offense. "But Corvid picking her own heir is how we got a monarchy with a couch. Some of us think the board should vote. Some of us think it should be someone who\'s been here longer than a couple of years."',
          { if: { flag: 'fac.loft.side_switch' }, text: 'He sounds almost apologetic. You backed him once. He hasn\'t forgotten; it just doesn\'t change the math.' },
        ],
        choices: [
          {
            tag: '[Social DC 16]',
            text: '"Then let\'s vote. Right now, on the board, in public. I\'ll post my case and I\'ll live with the count."',
            check: {
              skill: 'social',
              dc: 16,
              bonuses: [
                { if: { flag: 'a2.solidarity' }, add: 2, label: '+2 (you organized the night of the wipe)' },
                { if: { flag: 'fac.loft.intact' }, add: 2, label: '+2 (you held the board together)' },
                { if: { flag: 'fac.loft.side_switch' }, add: -1, label: '−1 (you told the board to get paid)' },
                { if: { var: 'fac.loft.enclosure_lost', gte: 2 }, add: -2, label: '−2 (the handles who\'d have voted for you work at Aperture now)' },
                { if: { flag: 'fac.bureau.outed' }, add: -3, label: '−3 (the board knows about the booth by the jukebox)' },
                { if: { flag: 'fac.loft.testified' }, add: 1, label: '+1 (you took the stand for her)' },
              ],
              success: 'contest_won',
              fail: 'contest_lost',
              failEffects: [{ stat: 'stress', add: 4 }],
            },
          },
          {
            tag: '[Programming DC 17]',
            text: 'Don\'t argue — show them. Push the board patch you\'ve been sitting on: the one that makes it impossible to sell the member list, even for the sysop.',
            check: {
              skill: 'programming',
              dc: 17,
              bonuses: [
                { if: { item: 'scene_archive' }, add: 2, label: '+2 (Corvid\'s archive shows you how the board was built)' },
                { if: { flag: 'fac.loft.marisol_drifted' }, add: -1, label: '−1 (Marisol isn\'t here to catch your typos)' },
                { if: { flag: 'fac.loft.marisol_stung' }, add: -1, label: '−1 (her unpaid scripts stopped running months ago)' },
              ],
              success: 'contest_won',
              fail: 'contest_patch_broke',
              failEffects: [{ flag: 'fac.loft.patch_outage' }, { stat: 'stress', add: 8 }, { faction: LOFT, add: -3 }, { npc: 'byteme', affinity: -2 }],
            },
          },
          {
            text: '"...you\'re right. It shouldn\'t be handed down like a ring. Let someone else have it." (Step back and name a successor.)',
            effects: [corvidStepsDownFree],
            goto: 'successor',
          },
        ],
      },
      contest_patch_broke: {
        speaker: 'narrator',
        text: [
          'The patch is beautiful. It is also, at 1:14 a.m., the reason nobody can log in. Including you. Including the machine that holds the patch. The board goes dark for three days while you rebuild the login code by hand in the back room on a borrowed keyboard with a sticky E.',
          'Three days is a long time for a scene to stare at a dead login prompt. byteme assumes it\'s a raid and wipes his drive. Then, to be safe, his mother\'s. Somebody starts a rumor that you did it on purpose to cancel the vote, and it never quite stops being repeated.',
          { if: { flag: 'fac.loft.marisol_stung' }, text: 'On the second night you find Marisol\'s old recovery script, the one she ran by hand every time the login died, with a comment at the top in her lowercase: "if you\'re reading this i\'m not here. sorry. — m." You run it. It\'s eight years out of date. It almost works.' },
          'When the board comes back, the vote happens anyway. You can guess how that goes.',
        ],
        next: 'contest_lost',
      },
      contest_won: {
        speaker: 'switch',
        text: [
          'The count comes in by three a.m.: not a landslide, but not close. Switch reads it off the screen out loud, like a man reading his own parking ticket.',
          '"Fine. Fine! It\'s you." He offers a hand, and when you take it he doesn\'t let go right away. "Don\'t make me right about the monarchy thing."',
        ],
        effects: acceptFree,
        next: 'accepted',
      },
      contest_lost: {
        speaker: 'narrator',
        text: [
          'You make your case, and it\'s a good case, and the board splits down the middle and stays split. The count ties. Then a recount ties. Somebody posts an ASCII drawing of a coin.',
          'In the end Corvid breaks it herself, because she always could. You get the keys. You also get a board where a third of the handles will never quite believe you earned them, and a Switch who stops returning your pages for a month.',
        ],
        effects: [...acceptFree, { flag: 'fac.loft.sysop_contested' }, { faction: LOFT, add: -6 }, { npc: 'switch', affinity: -8 }],
        next: 'accepted',
      },

      accepted: {
        speaker: 'corvid',
        text: [
          'She takes off the ring of keys she\'s worn since before you could spell your own handle and puts it in your hand, warm from her pocket.',
          '"You\'re the sysop. God help you." She almost smiles. "The couch is structural. Do not throw it out. People have proposed on that couch."',
        ],
      },
      accepted_martyr: {
        speaker: 'corvid',
        text: [
          'She takes off the ring of keys and closes your fingers around it.',
          '"Keep the lights on. Don\'t sell the building." Her last words as a free woman are the same as her first ones ever were to you. "I\'ll know if you do. I know everything. I\'ll just know it slower now."',
        ],
      },

      // ── Naming a successor ───────────────────────────────────────────────
      successor: {
        speaker: 'corvid',
        text: [
          '"Alright. Not you. Then who keeps faith with it? Say a name, and I\'ll hand them the keys myself." She lists the ones still standing.',
          { if: { not: { any: [miraAvailable, deadlineAvailable, switchAvailable] } }, text: 'It\'s a short list. It\'s no list at all. Everyone who could have held it is gone, gone quiet, or gone somewhere you can\'t follow.' },
        ],
        choices: [
          {
            text: '"Mira. She\'s the cleanest hands on the board and she\'s never once sold anyone."',
            if: miraAvailable,
            effects: [
              { flag: 'fac.loft.sysop', set: 'mira' },
              { npc: 'mira', affinity: 6 },
              { faction: LOFT, add: 5 },
              ...declineDone,
            ],
            goto: 'named_mira',
          },
          {
            text: '"Deadline. He\'s survived every mistake there is. Let him keep others from making them."',
            if: deadlineAvailable,
            effects: [
              { flag: 'fac.loft.sysop', set: 'deadline' },
              { npc: 'deadline', affinity: 6 },
              { faction: LOFT, add: 4 },
              ...declineDone,
            ],
            goto: 'named_deadline',
          },
          {
            text: '"Switch. He\'ll run it like a business — but he\'ll run it, and it\'ll survive."',
            if: switchAvailable,
            effects: [...switchTakesBoard, { faction: LOFT, add: 2 }, ...declineDone],
            goto: 'named_switch',
          },
          {
            text: '"Mira."',
            if: { all: [{ npc: 'mira', met: true }, { not: miraAvailable }] },
            req: miraAvailable,
            reqText: 'Mira isn\'t on the board anymore',
          },
          {
            text: '"...there\'s no one left who\'d keep it a commons. Let it go dark. Better dark than sold." (Close the board.)',
            effects: [...boardGoesDark, ...declineDone],
            goto: 'gone_dark',
          },
        ],
      },
      named_mira: {
        speaker: 'corvid',
        text: '"Nyx." Corvid nods, slow. "Yes. She\'ll keep it small and clean and she\'ll never let anyone in who shouldn\'t be. Good. Better than good." She looks relieved in a way that costs her something to show.',
      },
      named_deadline: {
        speaker: 'corvid',
        text: '"Theo." A real laugh, the first one all night. "He\'ll bore them all into caution. He\'ll make them back up their lives, not their data. Yes. Give the old man the chair he\'s been sitting near the door of for thirty years."',
      },
      named_switch: {
        speaker: 'corvid',
        text: [
          { if: { npc: 'switch', fate: 'sellout' }, text: '"Ray." She says it the way you\'d read a diagnosis. "You know where he\'ll take it. So do I. Fountains and dental and a member list with a price tag." A long breath. "But you picked him, and it\'s your call tonight, not mine. I\'ll hand him the keys myself so nobody can say I didn\'t."' },
          {
            if: { not: { npc: 'switch', fate: 'sellout' } },
            text: '"Ray." She weighs it. "He\'ll get it paid, and he\'ll keep it alive, and I will spend whatever\'s left of my life not asking what it cost."',
          },
          '"It\'s not what I built. But it beats a dark room and a padlock. Tell him the couch is structural."',
        ],
      },
      gone_dark: {
        speaker: 'corvid',
        text: [
          'She takes the ring of keys back off the table and pockets it, and just like that the board is a room again, a couch again, an electric bill somebody will pay out of grief for a while.',
          '"You\'re right. Better dark than sold. I\'ve wiped this thing to bare metal twice for less." She turns out the light on her way to the door. "Somewhere there\'ll be a server nobody can visit. I\'ll be the only one with the key. It\'s the most honest a scene ever gets."',
        ],
      },
    },
  },
]

export default defineContent({
  scenes,
  quests: [
    {
      id: 'fac_loft_q5_sysop',
      title: 'The Sysop Question',
      kind: 'faction',
      faction: 'fac.loft',
      giver: 'corvid',
      act: 3,
      summary: 'Corvid is stepping down — or being taken away. Either way, the chair she\'s kept for twenty years needs a new occupant, and she wants you to decide who.',
      rewards: 'Decides Corvid\'s fate and who holds the board',
      priority: 25,
      autoStart: {
        all: [
          { faction: LOFT, gte: 50 },
          { quest: 'fac_loft_q2_schism', status: 'completed' },
          { npc: 'corvid', fateNot: ['bought', 'exile', 'succeeded', 'martyred', 'dead', 'missing'] },
          { any: [{ var: 'act', gte: 3 }, { flag: 'a2.spine', eq: 'loft' }] },
        ],
      },
      start: 'summons',
      stages: {
        summons: {
          text: 'Corvid wants the back room, alone, on a night nobody else is invited. She has made coffee. Something is ending, and she wants you there when it does.',
          onEnter: [{ scene: 'loft_q5_sysop', delayHours: 24 }],
          onComplete: [{ if: { not: { flag: 'w.scene_state', eq: 'dark' } }, then: [{ scene: 'loft_q5_announcement', delayHours: 10 }] }],
          objectives: [
            {
              id: 'decide',
              text: 'Answer the sysop question',
              when: { flag: 'fac.loft.q5_done' },
              hint: 'A dialog arrives. If the raid left Corvid charged, you can fight for her ([Business/Social DC 18], or pay for the best lawyer) before deciding who takes the chair — you, a trusted successor, or nobody. A lost fight still costs whoever fought it.',
            },
          ],
        },
      },
    },
  ],
})
