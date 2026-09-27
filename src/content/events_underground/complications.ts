/**
 * events_underground — COMPLICATIONS: the underground's own consequence sub-stories.
 *
 * These are never picked by the director. They are pulled by `{ complication }` effects (mine and
 * other packs'), by traced hack ops ('hack'), and by failed social/legal moments, and they leave a
 * lasting mark: a hunting sysadmin who becomes a recurring shadow, or a shakedown that costs you
 * standing, money over time, and a scar. Each offers a way to mitigate — and mitigation can fail.
 *
 * HARD RULE: hacking is invented flavor only.
 */
import { defineContent } from '@/engine/registry'
import type { EventDef, QuestDef, SceneDef } from '@/engine/types'
import { around, buff } from './_shared'

// ── Complication: The Sysadmin Who Remembers (source: hack) ───────────────────
// A trace didn't just cost you a payout — it gave a very good, very bored admin your scent. He
// isn't the law. He's worse: he has time, a grudge, and nothing to lose by being patient.
const grudgeScene: SceneDef = {
  id: 'ev_under_comp_grudge_scene',
  channel: 'mail',
  title: 'you left a door open',
  from: 'a sysadmin named Pell',
  pause: true,
  start: 'letter',
  nodes: {
    letter: {
      speaker: 'a sysadmin named Pell',
      text: [
        'I run the boring end of a boring network you visited recently. I know, because you were not as clean as you think, and I have spent eleven years being exactly this careful for exactly this reason.',
        'I am not the police. The police have paperwork and budgets and other cases. I have a home lab, a grudge, and every log you thought you wiped, cached somewhere you didn\'t know to look.',
        'I have not decided what to do with you yet. That decision is, for now, a hobby. Sleep well. — Pell',
      ],
      choices: [
        {
          tag: '[OpSec]',
          text: 'Find out what he actually has before he decides — quietly work backward from his letter.',
          check: {
            skill: 'opsec',
            dc: 19,
            bonuses: [
              { if: { trait: 'paranoid' }, add: 2, label: '+2 (paranoid)' },
              { if: { item: 'ev_under_hushline' }, add: 1, label: '+1 (the Hushline Relay)' },
            ],
            success: 'measured',
            fail: 'blundered',
            successEffects: [{ quest: 'ev_under_q_pell', start: true }, { xp: 'opsec', add: 30 }, { flag: 'ev_under.pell_measured' }],
            failEffects: [{ quest: 'ev_under_q_pell', start: true }, { stat: 'heat', add: 10 }, { stat: 'stress', add: 8 }, { flag: 'ev_under.pell_angry' }],
          },
        },
        {
          tag: '[Social]',
          text: 'Write back. One professional to another — respect, an apology, an offer to make it right.',
          check: {
            skill: 'social',
            dc: 18,
            bonuses: [{ if: { trait: 'silver_tongue' }, add: 2, label: '+2 (silver tongue)' }],
            success: 'measured',
            fail: 'insulted',
            successEffects: [{ quest: 'ev_under_q_pell', start: true }, { flag: 'ev_under.pell_measured' }],
            failEffects: [{ quest: 'ev_under_q_pell', start: true }, { stat: 'stress', add: 6 }, { stat: 'heat', add: 6 }, { flag: 'ev_under.pell_angry' }],
          },
        },
        {
          text: 'Ignore it. Cranks send letters. Predators don\'t warn you first.',
          effects: [{ quest: 'ev_under_q_pell', start: true }, { stat: 'stress', add: 5 }, { flag: 'ev_under.pell_ignored' }],
          goto: 'ignored',
        },
      ],
    },
    ignored: {
      speaker: 'narrator',
      text: 'You file it under "cranks" and get on with your life. But you catch yourself, twice that week, checking whether the letter is still in the trash, as if it might have moved.',
    },
    measured: {
      speaker: 'narrator',
      text: 'You take his measure and he takes yours, at a distance, like two careful people circling the same dark room. He\'s real, he\'s good, and he\'s decided you\'re worth watching. That\'s a manageable problem — as long as you keep managing it.',
    },
    blundered: {
      speaker: 'narrator',
      text: 'You go looking and you trip a tripwire he left specifically for people who go looking. Now he knows you got the letter, knows it rattled you, and knows exactly how you move when you\'re rattled. You made him better at hunting you.',
    },
    insulted: {
      speaker: 'narrator',
      text: 'You reach for "one professional to another" and it comes out as "please don\'t," which a man like Pell reads as blood in the water. His reply is one line: "Oh, good. You\'re scared. Now it\'s interesting."',
    },
  },
}

const pellFollowup: SceneDef = {
  id: 'ev_under_comp_grudge_followup_scene',
  channel: 'dialog',
  title: 'Pell Makes His Move',
  from: 'a sysadmin named Pell',
  pause: true,
  start: 'move',
  nodes: {
    move: {
      speaker: 'narrator',
      text: [
        { if: { flag: 'ev_under.pell_angry' }, text: 'Pell moves the way angry patient people move: all at once, after a long silence. Your name is suddenly on three abuse reports, your ISP is "reviewing your account," and a package of printouts arrives at your door with no return address.' },
        { if: { flag: 'ev_under.pell_measured' }, text: 'Pell reaches out first — a single message, oddly courteous. "I\'ve had my fun. I\'m offering you an exit. It costs you something. Everything worth having does."' },
        { if: { flag: 'ev_under.pell_ignored' }, text: 'The silence ends the way silences with men like Pell end: not with a knock, but with a slow tightening. Your accounts get strange. Your heat creeps up from a direction you can\'t trace. He\'s not caught you. He\'s just made your life a little worse every week, patiently, on principle.' },
      ],
      choices: [
        {
          text: 'Pay him off — cash and a promise never to touch anything of his again.',
          req: { stat: 'money', gte: 1500 },
          reqText: 'Requires $1,500',
          effects: [{ money: -1500 }, { stat: 'heat', add: -6 }, { stat: 'stress', add: -8 }, { flag: 'ev_under.pell_settled' }],
          goto: 'paid',
        },
        {
          tag: '[Intrusion]',
          text: 'Find the leverage he must have — everyone patient has a soft spot they\'ve stopped guarding.',
          check: {
            skill: 'intrusion',
            dc: 21,
            bonuses: [{ if: { skill: 'opsec', gte: 50 }, add: 2, label: '+2 (you know how careful people slip)' }],
            success: 'leverage',
            fail: 'leverage_bad',
            successEffects: [{ stat: 'cred', add: 3 }, { stat: 'heat', add: -4 }, { flag: 'ev_under.pell_settled' }, { xp: 'intrusion', add: 40 }],
            failEffects: [{ stat: 'heat', add: 12 }, { obligation: { id: 'ev_under_pell_fine', label: 'Legal fees (the Pell mess)', perDay: 8, days: 90 } }, { trait: 'ev_under_open_file' }, { flag: 'ev_under.pell_won' }],
          },
        },
        {
          text: 'Outlast him. Go grey, change everything, and become too boring to be worth his time.',
          effects: [{ stat: 'heat', add: -10 }, buff({ id: 'ev_under_going_grey', name: 'Going Grey', desc: 'New handle, new hours, new everything. Pell loses your scent, and so does most of the work you used to get.', days: 45, bad: true, mods: [{ key: 'cred.gain', mult: 0.6 }, { key: 'freelance.pay', mult: 0.85 }, { key: 'heat.decay', add: 0.4 }] }), { flag: 'ev_under.pell_settled' }],
          goto: 'grey',
        },
      ],
    },
    paid: {
      speaker: 'a sysadmin named Pell',
      text: 'Wise. A little sad, but wise. The printouts are yours now; there are no copies, and I am a man of my word about the small things because it makes the large things believable. Don\'t visit my networks again. Don\'t visit anyone\'s, if you\'ve any sense. — P',
    },
    leverage: {
      speaker: 'narrator',
      text: 'Everyone patient has a soft spot they\'ve stopped guarding, and Pell\'s is pride: a project, a name, a thing he\'d hate the world to see done badly by his own hand. You don\'t use it. You just let him know you found it. The letters stop that night. Between two careful people, a known truce is the safest peace there is.',
    },
    leverage_bad: {
      speaker: 'narrator',
      text: 'You reach for his soft spot and close on air — he moved it years ago, because of course he did, because being ready for exactly this is his entire personality. Now he\'s genuinely angry, genuinely engaged, and the legal fees start arriving like weather. You woke something that was only ever going to be a hobby, and made it a purpose.',
    },
    grey: {
      speaker: 'narrator',
      text: 'You burn the old handle to the ground and salt the earth. For six weeks you are nobody, working off nothing, getting nothing, and it works: Pell chases a ghost until even he gets bored. You survived him. It cost you the name it took a decade to build. Some wars you win by having less to lose.',
    },
  },
}

const pellQuest: QuestDef = {
  id: 'ev_under_q_pell',
  title: 'Complication: The Sysadmin Who Remembers',
  kind: 'personal',
  priority: 6,
  rewards: 'Peace, if you can afford it',
  summary: 'A trace gave a patient, brilliant, bored sysadmin named Pell your scent. He isn\'t the law. He\'s worse — he has time. Settle it before it settles you.',
  start: 'wait',
  stages: {
    wait: {
      text: 'Pell has your scent and a hobby. He\'s deciding, slowly, what to do about you. Whatever you did in that first reply, it\'s bought you time, not safety.',
      hint: 'Pell will make his move in a few weeks. Keep your heat down and your options open until he does.',
      onEnter: [{ scene: 'ev_under_comp_grudge_followup_scene', delayHours: 24 * 12 }],
      objectives: [
        {
          id: 'settle',
          text: 'Settle things with Pell',
          when: { any: [{ flag: 'ev_under.pell_settled' }, { flag: 'ev_under.pell_won' }] },
          hint: 'Answer when Pell makes his move — pay him, find leverage, or go grey until he loses interest.',
        },
      ],
      onComplete: [
        { if: { flag: 'ev_under.pell_won' }, then: [{ log: 'Pell won this round. The legal fees are yours to carry, and your name is in one more folder than it was.', kind: 'bad' }], else: [{ log: 'The Pell problem is closed. However it went, you learned the oldest lesson in the scene: the log you don\'t make is the case they can\'t build.', kind: 'story' }] },
      ],
    },
  },
}

const grudgeComplication: EventDef = {
  id: 'ev_under_comp_sysadmin_grudge',
  category: 'underground',
  weight: 2,
  complication: { sources: ['hack'], minTier: 3, maxTier: 5 },
  scene: 'ev_under_comp_grudge_scene',
}

// ── Complication: The Row Turns (sources: social, legal) ──────────────────────
// A social or legal misstep becomes a rumour, and a rumour on the Row becomes a fact. You pay in
// standing, in an obligation to make it right, and in a scar — unless you can get ahead of it.
const shakedownScene: SceneDef = {
  id: 'ev_under_comp_shakedown_scene',
  channel: 'dialog',
  title: 'The Room Goes Quiet',
  from: 'Sodium Row back room',
  pause: true,
  start: 'quiet',
  nodes: {
    quiet: {
      speaker: 'narrator',
      text: [
        'You walk into the back room and the conversation stops for exactly one beat too long before it starts up again, too loud, about nothing.',
        'The story — whatever the story is now, after it went through six mouths — has decided who you are. Somebody says you talked. Somebody says you skimmed. It doesn\'t matter which; on the Row, the accusation is the sentence, and the appeal is a formality.',
        { if: { trait: 'ev_under_marked_snitch' }, text: 'It\'s not the first time your name has been in this particular sentence. That makes it worse, not better. Twice is a pattern.' },
      ],
      choices: [
        {
          tag: '[Social]',
          text: 'Get in front of it — call a meeting, tell the whole truth before the rumour finishes setting.',
          check: {
            skill: 'social',
            dc: 18,
            bonuses: [
              { if: { trait: 'silver_tongue' }, add: 2, label: '+2 (silver tongue)' },
              { if: { faction: 'fac.loft', gte: 50 }, add: 2, label: '+2 (the scene has trusted you a long time)' },
              { if: { trait: 'ev_under_burned_bridge' }, add: -2, label: '−2 (you\'ve burned bridges here before)' },
            ],
            success: 'cleared',
            fail: 'backfired',
            successEffects: [{ faction: 'fac.loft', add: 2 }, { stat: 'cred', add: 1 }, { stat: 'mood', add: 3 }, { flag: 'ev_under.shakedown_cleared' }],
            failEffects: [
              { faction: 'fac.loft', add: -5 },
              { trait: 'ev_under_burned_bridge' },
              { stat: 'cred', add: -3 },
              { obligation: { id: 'ev_under_making_amends', label: 'Making amends (the Row remembers)', perDay: 4, days: 60 } },
              { flag: 'ev_under.shakedown_lost' },
            ],
          },
        },
        {
          text: 'Pay the tax — cover the "loss" you didn\'t cause, buy back the doubt with cash.',
          req: { stat: 'money', gte: 800 },
          reqText: 'Requires $800',
          effects: [{ money: -800 }, { faction: 'fac.loft', add: 1 }, { stat: 'cred', add: -1 }, { stat: 'mood', add: -3 }, { flag: 'ev_under.shakedown_cleared' }, { flag: 'ev_under.paid_the_tax' }],
          goto: 'paid',
        },
        {
          text: 'Let it burn. You don\'t owe the room an explanation. Walk out with your head up.',
          effects: [{ faction: 'fac.loft', add: -6 }, { trait: 'ev_under_marked_snitch' }, { stat: 'cred', add: -2 }, { stat: 'stress', add: 6 }, { flag: 'ev_under.shakedown_lost' }],
          goto: 'burned',
        },
      ],
    },
    cleared: {
      speaker: 'narrator',
      text: [
        'You stand in the middle of the worst room in the world and tell it the whole unflattering truth, faster than the rumour can set, and — because you got there first, and because the truth has a texture a lie never quite manages — the room believes you.',
        'It doesn\'t undo the beat of silence when you walked in. But it means there won\'t be a second one.',
      ],
    },
    paid: {
      speaker: 'narrator',
      text: 'You cover a loss you didn\'t cause, because being right is cheaper than being trusted and you can only afford one of them today. The room warms back up, a few degrees, transactionally. You bought your way back in. You\'ll feel the price of that longer than the price of the cash.',
    },
    backfired: {
      speaker: 'narrator',
      text: [
        'You call the meeting and it turns into a trial, and you are not the judge. Someone has a detail. Someone else has a worse read on a true thing. By the time you\'ve finished defending yourself you\'ve confirmed, in the room\'s ear, that there was something to defend.',
        'You leave owing the scene something you can\'t pay in one lump — a slow, weekly making-of-amends that everyone will watch you make.',
      ],
    },
    burned: {
      speaker: 'narrator',
      text: 'You walk out with your head up and the door shuts behind you on a room that has already decided. Head-up is a good look. It is not a strategy. The Row keeps a long memory and a short list, and you just moved from one to the other.',
    },
  },
}

const shakedownComplication: EventDef = {
  id: 'ev_under_comp_row_turns',
  category: 'underground',
  weight: 2,
  complication: { sources: ['social', 'legal'] },
  when: around('deadline'),
  scene: 'ev_under_comp_shakedown_scene',
}

export default defineContent({
  events: [grudgeComplication, shakedownComplication],
  quests: [pellQuest],
  scenes: [grudgeScene, pellFollowup, shakedownScene],
})
