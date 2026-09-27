/**
 * COMPLICATION PACK — 'work' source: the job turning on you.
 *
 * Spawned by failed work checks across the game ({ complication: 'work' }) and this pack's spawners.
 * Written up, demoted, fired, quietly blacklisted, and a boss who decides to make it personal.
 *
 * GUARD: a real firing ({ job: null }) only happens in a non-arc job (see ARC_JOBS). While employed
 * in a story-critical job (Halcyon / Aperture / Bureau / the Cage), the worst outcome here is a
 * formal write-up or a demotion buff — never job loss — so we never yank a job an arc depends on.
 * Bosses in these stories are invented labels, never canonical NPCs.
 *
 * Each story here fires at most once per run (the engine never re-opens a finished quest, and a
 * career that gets laid off seven times stops meaning anything). The layoff draws only from the
 * 'work' pool, never the generic 'any' fallback, so a legal or gig failure can't cost you a job.
 */
import { defineContent } from '@/engine/registry'
import type { EventDef, QuestDef, SceneDef } from '@/engine/types'
import { CX_NIGHTS, CX_PAYCUT, CX_PROBATION, CX_PROVE, CX_SCRAPING } from './marks'
import { ending, employed, onArcJob, owe, techJob } from './_shared'

// ─────────────────────────────────────────────────────────────────────────────
// cx_life_written_up — a formal warning lands in your file
// ─────────────────────────────────────────────────────────────────────────────
const writeupScene: SceneDef = {
  id: 'cx_life_writeup_scene',
  channel: 'dialog',
  title: "A Meeting With 'HR'",
  start: 'open',
  nodes: {
    open: {
      speaker: 'Your Supervisor',
      text: [
        'The meeting invite had no agenda, which is how you knew. Now there\'s a form on the desk with your name at the top and a lot of small boxes, most of them checked.',
        '"This is a formal corrective action," your supervisor reads, in the flat voice of someone who\'d rather be anywhere else. "Attendance. Focus. A few... incidents. We\'re documenting it. You\'ll sign to acknowledge — signing isn\'t agreeing — and we\'ll review in ninety days."',
        { if: onArcJob, text: 'This place matters to more than your paycheck. Whatever this is, it can\'t become the thing that ends the bigger thing.' },
      ],
      choices: [
        {
          text: 'Own the parts that are true and commit to specifics. No excuses.',
          tag: '[Social DC 15]',
          check: {
            skill: 'social',
            dc: 15,
            success: 'owned',
            fail: 'defensive',
            successEffects: [{ quest: 'cx_life_writeup_q', objective: 'faced' }, { flag: 'cx_life.writeup_owned' }],
            failEffects: [{ quest: 'cx_life_writeup_q', objective: 'faced' }, { flag: 'cx_life.writeup_escalated' }],
          },
        },
        {
          text: 'Push back — half of this is exaggerated and you can prove it.',
          tag: '[Business DC 16]',
          check: {
            skill: 'business',
            dc: 16,
            success: 'contested',
            fail: 'defensive',
            successEffects: [{ quest: 'cx_life_writeup_q', objective: 'faced' }, { flag: 'cx_life.writeup_contested' }],
            failEffects: [{ quest: 'cx_life_writeup_q', objective: 'faced' }, { flag: 'cx_life.writeup_escalated' }],
          },
        },
        {
          text: 'Sign it, say nothing, and quietly stop caring.',
          effects: [{ quest: 'cx_life_writeup_q', objective: 'faced' }, { flag: 'cx_life.writeup_checkedout' }, { buff: CX_PROBATION }],
          goto: 'checkout',
        },
      ],
    },
    owned: {
      speaker: 'Your Supervisor',
      text: '"...Honestly? That\'s the best response I\'ve gotten in this chair." They make a note that isn\'t on the form. "Hit the specifics you just listed and this expires clean at review. Don\'t make me right about the boxes." You walk out on a short leash — but a leash, not a noose.',
      effects: [{ xp: 'social', add: 45 }, { buff: CX_PROBATION }],
    },
    contested: {
      speaker: 'narrator',
      text: 'You calmly walk through the timeline, the tickets you actually closed, the "incident" that was someone else\'s. Two of the boxes get unchecked, on the record. It\'s still a write-up. It\'s a smaller, fairer one, and everyone in the room now knows you keep receipts.',
      effects: [{ xp: 'business', add: 50 }, { buff: { ...CX_PROBATION, days: 21 } }, { trait: 'cx_life_street_smart' }],
    },
    defensive: {
      speaker: 'narrator',
      text: 'You come in hot and prove several of their boxes for them in real time. "We\'ll note that the corrective action was not well received," your supervisor sighs, checking one more. The ninety-day review just got a lot more important, and a lot less winnable.',
      effects: [{ flag: 'cx_life.writeup_escalated' }, { buff: { ...CX_PROBATION, days: 42 } }, { stat: 'stress', add: 6 }],
    },
    checkout: {
      speaker: 'narrator',
      text: 'You sign without reading and let something go out behind your eyes. You keep the job. You stop bringing the good part of yourself to it, which is the kind of thing that shows up in the next review whether you mean it to or not.',
      effects: [{ stat: 'mood', add: -4 }],
    },
  },
}

const writeupQuest: QuestDef = {
  id: 'cx_life_writeup_q',
  title: 'Complication: On the Record',
  kind: 'personal',
  priority: 4,
  rewards: 'Survive a write-up with your prospects intact',
  summary: 'A formal warning is going in your file with a ninety-day clock on it. How you take the meeting decides how heavy that clock feels.',
  start: 's1',
  stages: {
    s1: {
      text: 'You\'re being written up. Own it, contest it, or check out.',
      objectives: [
        { id: 'faced', text: 'Get through the meeting', when: { never: true }, hint: 'The dialog "A Meeting With \'HR\'" opens it — own it [Social DC 15], contest it [Business DC 16], or just sign.' },
      ],
      next: [
        { if: { flag: 'cx_life.writeup_escalated' }, stage: 'clock_hard' },
        { stage: 'clock' },
      ],
    },
    clock: ending('You\'re on a short leash for a while, but a fair one. Keep your head down and it expires clean.', 'completed'),
    clock_hard: ending('The meeting made it worse. You\'re on a long, unforgiving probation now, and everyone\'s watching the review date.', 'failed'),
  },
}

const writtenUp: EventDef = {
  id: 'cx_life_written_up',
  category: 'work',
  when: { all: [employed, techJob] },
  complication: { sources: ['work'], minTier: 1, maxTier: 3 },
  effects: [{ quest: 'cx_life_writeup_q', start: true }],
  scene: 'cx_life_writeup_scene',
}

// ─────────────────────────────────────────────────────────────────────────────
// cx_life_demoted — reorg, and you're on the wrong side of it
// ─────────────────────────────────────────────────────────────────────────────
const demoteScene: SceneDef = {
  id: 'cx_life_demote_scene',
  channel: 'mail',
  title: 'Organizational Update — Please Read',
  from: 'Management',
  start: 'note',
  nodes: {
    note: {
      speaker: 'Management',
      text: [
        'The email uses the word "exciting" three times, which is how you know it\'s bad.',
        '"As part of an exciting realignment, your role is being restructured. Effective Monday you\'ll report to [redacted] in a revised capacity at a revised band. We\'re confident this positions you for future growth."',
        'Translated: smaller title, smaller check, same desk. Someone drew a box on a slide and you were in the wrong part of it.',
      ],
      choices: [
        {
          text: 'Request a meeting and make the case for your old role.',
          tag: '[Business DC 17]',
          check: {
            skill: 'business',
            dc: 17,
            success: 'saved',
            fail: 'stuck',
            successEffects: [{ quest: 'cx_life_demote_q', objective: 'answered' }, { flag: 'cx_life.demote_reversed' }],
            failEffects: [{ quest: 'cx_life_demote_q', objective: 'answered' }, { flag: 'cx_life.demote_stuck' }],
          },
        },
        {
          text: 'Take the demotion, bank the paycheck, and start looking.',
          effects: [{ quest: 'cx_life_demote_q', objective: 'answered' }, { flag: 'cx_life.demote_accepted' }, { buff: CX_PAYCUT }],
          goto: 'accept',
        },
        {
          text: 'Refuse the new role on principle.',
          if: { not: onArcJob },
          tag: '[Walk]',
          effects: [{ quest: 'cx_life_demote_q', objective: 'answered' }, { flag: 'cx_life.demote_quit' }, { job: null }],
          goto: 'quit',
        },
      ],
    },
    saved: {
      speaker: 'narrator',
      text: 'You come in with numbers, not feelings — what you own, what breaks without you, what it costs to replace you. The box on the slide gets redrawn. "Let\'s call it a lateral," someone says, saving face for both of you. You kept your title and taught them not to pencil you in lightly.',
      effects: [{ xp: 'business', add: 60 }, { trait: 'cx_life_iron_nerves' }],
    },
    stuck: {
      speaker: 'narrator',
      text: 'You make the case and they nod along and nothing changes, because the decision was made two org charts above your supervisor. Monday comes. The nameplate is a sticker over the old one. It grates every time you see it.',
      effects: [{ flag: 'cx_life.demote_stuck' }, { buff: CX_PAYCUT }],
    },
    accept: {
      speaker: 'narrator',
      text: 'You take it, because rent, and you start quietly reading job listings on your lunch break. Demotions have a way of becoming permanent if you let them settle. You don\'t intend to let this one.',
      effects: [{ buff: CX_PROVE }],
    },
    quit: {
      speaker: 'narrator',
      text: 'You reply with two sentences and clean out your desk before Monday. It feels incredible for about a day and a half. Then the math arrives, and the math is quieter and more persistent than the feeling was.',
      effects: [{ buff: CX_SCRAPING }, { trait: 'cx_life_freelancer_pride' }],
    },
  },
}

const demoteQuest: QuestDef = {
  id: 'cx_life_demote_q',
  title: 'Complication: Realigned',
  kind: 'personal',
  priority: 4,
  rewards: 'Fight a demotion — or leave on your terms',
  summary: 'A reorg put you in the wrong box on someone\'s slide. Smaller title, smaller check, same work.',
  start: 's1',
  stages: {
    s1: {
      text: 'You\'ve been demoted in a reorg. Fight for your role, take it and plot, or walk.',
      objectives: [
        { id: 'answered', text: 'Respond to the reorg', when: { never: true }, hint: 'Answer the "Organizational Update" mail — make your case [Business DC 17], accept the demotion, or (non-arc jobs) refuse and quit.' },
      ],
      next: [
        { if: { flag: 'cx_life.demote_reversed' }, stage: 'kept' },
        { if: { flag: 'cx_life.demote_quit' }, stage: 'left' },
        { stage: 'demoted' },
      ],
    },
    kept: ending('You made the numbers argument and won. They won\'t pencil you in lightly again.', 'completed'),
    demoted: ending('You\'re working the same job for less, under a sticker nameplate. It grates — which is exactly the fuel to get out.', 'failed'),
    left: ending('You walked out with your pride and a much thinner cushion. Now you get to prove the pride was earned.', 'completed'),
  },
}

const demoted: EventDef = {
  id: 'cx_life_demoted',
  category: 'work',
  when: { all: [employed, techJob] },
  complication: { sources: ['work'], minTier: 2, maxTier: 4 },
  effects: [{ quest: 'cx_life_demote_q', start: true }],
  scene: 'cx_life_demote_scene',
}

// ─────────────────────────────────────────────────────────────────────────────
// cx_life_fired — let go (non-arc jobs only)
// ─────────────────────────────────────────────────────────────────────────────
const firedScene: SceneDef = {
  id: 'cx_life_fired_scene',
  channel: 'dialog',
  title: 'A Short Meeting',
  start: 'open',
  nodes: {
    open: {
      speaker: 'Your Manager',
      text: [
        'There\'s a second person in the room you don\'t know, and a box for your things already flattened out on the desk, and that\'s the whole story right there before anyone says a word.',
        '"We\'re letting you go, effective today. It\'s not a conversation, it\'s a notification — I\'m sorry, I know that\'s cold. [The other person] will walk you out. Your final check clears Friday."',
        'Fifteen minutes ago you had a job. Somebody upstairs did some math and now you have a box.',
      ],
      choices: [
        {
          text: 'Negotiate: severance, a reference, and you go quietly.',
          tag: '[Business DC 16]',
          check: {
            skill: 'business',
            dc: 16,
            success: 'severance',
            fail: 'nothing',
            successEffects: [{ quest: 'cx_life_fired_q', objective: 'walked' }, { flag: 'cx_life.fired_severance' }, { job: null }],
            failEffects: [{ quest: 'cx_life_fired_q', objective: 'walked' }, { flag: 'cx_life.fired_clean' }, { job: null }],
          },
        },
        {
          text: 'Threaten to lawyer up over how they did it.',
          tag: '[Bluff]',
          check: {
            skill: 'social',
            dc: 17,
            success: 'settled',
            fail: 'burned',
            successEffects: [{ quest: 'cx_life_fired_q', objective: 'walked' }, { flag: 'cx_life.fired_settled' }, { job: null }],
            failEffects: [{ quest: 'cx_life_fired_q', objective: 'walked' }, { flag: 'cx_life.fired_burned' }, { job: null }],
          },
        },
        {
          text: 'Take the box. Hold your head up. Leave.',
          effects: [{ quest: 'cx_life_fired_q', objective: 'walked' }, { flag: 'cx_life.fired_clean' }, { job: null }],
          goto: 'dignified',
        },
      ],
    },
    severance: {
      speaker: 'narrator',
      text: 'You keep your voice level and your asks specific: two weeks, a neutral reference on file, and your last expense report paid. To their surprise and yours, they say yes to most of it. You leave with a box and a cushion, which is a much better way to leave.',
      effects: [{ money: 900 }, { xp: 'business', add: 55 }, { trait: 'cx_life_freelancer_pride' }],
    },
    settled: {
      speaker: 'narrator',
      text: 'You don\'t actually have a case and you both half-know it, but "I\'ll be talking to someone about the process" makes the second person shift in their seat. A modest "transition payment" appears to make you go away smoothly. It does.',
      effects: [{ money: 600 }, { flag: 'cx_life.fired_settled' }],
    },
    nothing: {
      speaker: 'narrator',
      text: 'You ask and they\'ve clearly rehearsed the no. "Everything\'s already been decided by comp." You get the standard nothing, plus the small extra humiliation of having asked. The box is heavier than a box should be on the way to the bus.',
      effects: [{ buff: CX_SCRAPING }],
    },
    burned: {
      speaker: 'narrator',
      text: 'The lawyer threat lands like a wet firework. "You\'re welcome to," the stranger says, sliding a card across the desk, and now the reference you\'ll get is the legal-minimum "dates of employment only." Word travels that you left ugly.',
      effects: [{ buff: CX_SCRAPING }, { trait: 'cx_life_blacklisted' }],
    },
    dignified: {
      speaker: 'narrator',
      text: 'You pack the box neatly, thank the one coworker who ever helped you, and walk out with your spine straight. It doesn\'t pay the rent. It does mean that when you look back at this, you like how you left.',
      effects: [{ trait: 'cx_life_freelancer_pride' }, { stat: 'mood', add: -2 }],
    },
  },
}

const firedQuest: QuestDef = {
  id: 'cx_life_fired_q',
  title: 'Complication: The Box',
  kind: 'personal',
  priority: 6,
  rewards: 'Leave a burning job the smart way',
  summary: 'Somebody upstairs did the math and now you have a box instead of a job. The only thing left to negotiate is how you go.',
  start: 's1',
  stages: {
    s1: {
      text: 'You\'re being let go, today. Negotiate a soft landing, bluff for a settlement, or leave with your head up.',
      objectives: [
        { id: 'walked', text: 'Get out the door', when: { never: true }, hint: 'The dialog "A Short Meeting" opens it — negotiate severance [Business DC 16], threaten to lawyer up [Social DC 17], or take the box and go.' },
      ],
      next: 's2',
    },
    s2: {
      text: 'You\'re out of work. The rent doesn\'t care why. Line something up before the cushion runs out.',
      onEnter: [{ notify: 'You\'re unemployed. Time to hit the job board — or make freelance carry you.', kind: 'bad' }],
      objectives: [
        { id: 'reland', text: 'Get back on a payroll (or commit to freelance)', when: { any: [{ not: { job: null } }, { skill: 'business', gte: 45 }] }, hint: 'Take any job from the Careers board — or lean on freelance gigs until you\'re back on your feet.' },
      ],
      next: 'landed',
    },
    landed: ending('Back on your feet. However this one ended, it taught you not to build your whole floor on someone else\'s payroll.', 'completed'),
  },
}

const fired: EventDef = {
  id: 'cx_life_fired',
  category: 'work',
  when: { all: [employed, techJob, { not: onArcJob }] },
  complication: { sources: ['work'], minTier: 2, maxTier: 4 },
  effects: [{ quest: 'cx_life_fired_q', start: true }],
  scene: 'cx_life_fired_scene',
}

// ─────────────────────────────────────────────────────────────────────────────
// cx_life_blacklisted — the industry quietly closes ranks
// ─────────────────────────────────────────────────────────────────────────────
const blacklistScene: SceneDef = {
  id: 'cx_life_blacklist_scene',
  channel: 'mail',
  title: "re: your application (and, off the record, some advice)",
  from: 'A Recruiter Being Honest',
  start: 'note',
  nodes: {
    note: {
      speaker: 'A Recruiter Being Honest',
      text: [
        'The rejection is boilerplate. The second paragraph is not, and the recruiter clearly knows they shouldn\'t be writing it.',
        '"Off the record, because I\'ve placed you before and I think you\'re good: something\'s attached to your name in this market. I can\'t tell you what — I heard it third-hand — but it\'s making hiring managers pass before they meet you. In this town that stuff spreads on the golf course, not on paper. Thought you\'d want to know it\'s a wall, not bad luck."',
        'It explains the last three "we went another direction" emails all at once.',
      ],
      choices: [
        {
          text: 'Find the source and clear it at the root.',
          tag: '[OpSec DC 17]',
          check: {
            skill: 'opsec',
            dc: 17,
            success: 'cleared',
            fail: 'walled',
            successEffects: [{ quest: 'cx_life_blacklist_q', objective: 'answered' }, { flag: 'cx_life.blacklist_cleared' }],
            failEffects: [{ quest: 'cx_life_blacklist_q', objective: 'answered' }, { flag: 'cx_life.blacklist_stuck' }],
          },
        },
        {
          text: 'Go where your name isn\'t known — freelance, out-of-town, under the radar.',
          effects: [{ quest: 'cx_life_blacklist_q', objective: 'answered' }, { flag: 'cx_life.blacklist_pivot' }, { buff: CX_PROVE }, { trait: 'cx_life_freelancer_pride' }],
          goto: 'pivot',
        },
        {
          text: 'Rage-apply everywhere and hope volume beats the wall.',
          effects: [{ quest: 'cx_life_blacklist_q', objective: 'answered' }, { flag: 'cx_life.blacklist_stuck' }, { stat: 'stress', add: 6 }],
          goto: 'rage',
        },
      ],
    },
    cleared: {
      speaker: 'narrator',
      text: 'It takes patience you didn\'t know you had, but you find the origin — a single sour reference, repeated until it became "everyone knows" — and you neutralize it: a documented correction, a better reference to bury it, the truth placed where the whisper used to live. The wall doesn\'t vanish overnight. But the next callback comes.',
      effects: [{ xp: 'opsec', add: 65 }, { stat: 'cred', add: 2 }, { trait: 'cx_life_street_smart' }],
    },
    walled: {
      speaker: 'narrator',
      text: 'You chase it and hit fog — nobody will say it to your face, so there\'s nothing to correct. The wall stays a wall. You start pricing your whole career around a market that decided something about you in a room you\'ll never sit in.',
      effects: [{ flag: 'cx_life.blacklist_stuck' }, { trait: 'cx_life_blacklisted' }],
    },
    pivot: {
      speaker: 'narrator',
      text: 'You stop knocking on the doors that are painted shut and go build your own. It\'s scrappier and lonelier and entirely yours. In a year the same managers who passed will be asking how you got so busy.',
      effects: [{ stat: 'cred', add: 2 }],
    },
    rage: {
      speaker: 'narrator',
      text: 'You fire your résumé at everything with a pulse and hear back from almost nothing, and each silence confirms the wall a little more. It\'s exhausting and it doesn\'t work, and by the end you half-believe the whisper yourself.',
      effects: [{ trait: 'cx_life_blacklisted' }],
    },
  },
}

const blacklistQuest: QuestDef = {
  id: 'cx_life_blacklist_q',
  title: 'Complication: The Wall',
  kind: 'personal',
  priority: 5,
  rewards: 'Break a quiet blacklist',
  summary: 'Something is attached to your name in this market, and it\'s making people pass before they meet you. It spreads on the golf course, not on paper.',
  start: 's1',
  stages: {
    s1: {
      text: 'A quiet blacklist is costing you jobs. Root out the source, route around it, or brute-force it.',
      objectives: [
        { id: 'answered', text: 'Take on the blacklist', when: { never: true }, hint: 'Answer the recruiter\'s mail — trace the source [OpSec DC 17], pivot to where your name is unknown, or rage-apply.' },
      ],
      next: [
        { if: { flag: 'cx_life.blacklist_cleared' }, stage: 'clear' },
        { if: { flag: 'cx_life.blacklist_pivot' }, stage: 'pivot' },
        { stage: 'walled' },
      ],
    },
    clear: ending('You found the root and pulled it. The market has a short memory when you give it a reason.', 'completed'),
    pivot: ending('You stopped knocking on painted-shut doors and built your own. It suits you better anyway.', 'completed'),
    walled: ending('The wall held. You\'ll be pricing your career around it for a while.', 'failed'),
  },
}

const blacklisted: EventDef = {
  id: 'cx_life_blacklisted',
  category: 'work',
  complication: { sources: ['work'], minTier: 3, maxTier: 5 },
  effects: [{ quest: 'cx_life_blacklist_q', start: true }],
  scene: 'cx_life_blacklist_scene',
}

// ─────────────────────────────────────────────────────────────────────────────
// cx_life_boss_grudge — a manager who's decided to make it personal
// ─────────────────────────────────────────────────────────────────────────────
const grudgeScene: SceneDef = {
  id: 'cx_life_grudge_scene',
  channel: 'chat',
  title: 'you see the new schedule?',
  from: 'A Coworker',
  start: 'ping',
  nodes: {
    ping: {
      speaker: 'A Coworker',
      text: [
        '"ok so did you do something to [the boss]? because you got EVERY bad shift next month. and the printer duty. and youre off the good account."',
        '"like this isnt random. this is a Message. what did you DO"',
        'You didn\'t do anything, or you did one small thing weeks ago that you\'d forgotten and they hadn\'t. Either way, the schedule is a knife with your name filed into the handle.',
      ],
      choices: [
        {
          text: 'Kill it with competence — take the bad shifts and be undeniably excellent.',
          tag: '[Grind it out]',
          effects: [{ quest: 'cx_life_grudge_q', objective: 'handled' }, { flag: 'cx_life.grudge_grind' }, { buff: CX_NIGHTS }],
          goto: 'grind',
        },
        {
          text: 'Confront the boss directly, professionally, on the record.',
          tag: '[Business DC 16]',
          check: {
            skill: 'business',
            dc: 16,
            success: 'called',
            fail: 'worse',
            successEffects: [{ quest: 'cx_life_grudge_q', objective: 'handled' }, { flag: 'cx_life.grudge_called' }],
            failEffects: [{ quest: 'cx_life_grudge_q', objective: 'handled' }, { flag: 'cx_life.grudge_worse' }, { buff: CX_NIGHTS }],
          },
        },
        {
          text: 'Go over their head to their boss.',
          tag: '[Social DC 17]',
          check: {
            skill: 'social',
            dc: 17,
            success: 'escalated_win',
            fail: 'escalated_loss',
            successEffects: [{ quest: 'cx_life_grudge_q', objective: 'handled' }, { flag: 'cx_life.grudge_over' }],
            failEffects: [{ quest: 'cx_life_grudge_q', objective: 'handled' }, { flag: 'cx_life.grudge_worse' }, { buff: CX_NIGHTS }, { stat: 'stress', add: 5 }],
          },
        },
      ],
    },
    grind: {
      speaker: 'narrator',
      text: 'You take every rotten shift and turn in flawless work on all of them, cheerfully, in a way that gives them nothing to write down. It\'s exhausting and a little petty and it works: a grudge needs friction, and you refuse to provide any. Eventually the schedule quietly goes back to normal.',
      effects: [{ xp: 'business', add: 45 }, { trait: 'cx_life_iron_nerves' }],
    },
    called: {
      speaker: 'narrator',
      text: '"I want to make sure I\'m reading the schedule right," you say, evenly, with a copy in hand, "because from here it looks like a pattern, and I\'d rather solve a misunderstanding than document one." They didn\'t expect calm. The bad shifts get redistributed the next week, with a new coldness but no more knives.',
      effects: [{ xp: 'business', add: 55 }, { trait: 'cx_life_street_smart' }],
    },
    escalated_win: {
      speaker: 'narrator',
      text: 'You bring it upstairs the right way — facts, no whining, a clear ask — and the boss\'s boss, who has their own file on your boss, is quietly glad to have a reason. The grudge doesn\'t end so much as get outranked. Your manager knows it was you. That\'s a cost you\'ll keep paying.',
      effects: [{ flag: 'cx_life.grudge_over' }, { xp: 'social', add: 50 }, { stat: 'stress', add: 3 }],
    },
    worse: {
      speaker: 'narrator',
      text: 'You confront them and they smile the smile of someone who has done this before and won. Now it\'s documented as YOU being "confrontational," and the schedule gets creative in ways that are technically fine and personally brutal.',
      effects: [{ flag: 'cx_life.grudge_worse' }],
    },
    escalated_loss: {
      speaker: 'narrator',
      text: 'You go over their head and it comes right back down on yours — the upstairs boss "circles back" with your manager, who now knows exactly what you did and has all the time in the world. The next schedule is a masterpiece of quiet cruelty.',
      effects: [{ flag: 'cx_life.grudge_worse' }],
    },
  },
}

const grudgeQuest: QuestDef = {
  id: 'cx_life_grudge_q',
  title: 'Complication: The Schedule',
  kind: 'personal',
  priority: 4,
  rewards: 'Outlast a boss with a grudge',
  summary: 'Your manager has decided to make it personal, one shift assignment at a time. The schedule is a message and your name is all over it.',
  start: 's1',
  stages: {
    s1: {
      text: 'A boss is running a grudge through the schedule. Out-work it, confront it, or escalate it.',
      objectives: [
        { id: 'handled', text: 'Deal with the boss', when: { never: true }, hint: 'Answer the coworker\'s chat — grind out the bad shifts, confront the boss [Business DC 16], or go over their head [Social DC 17].' },
      ],
      next: [
        { if: { flag: 'cx_life.grudge_worse' }, stage: 'lost' },
        { stage: 'won' },
      ],
    },
    won: ending('You gave the grudge nothing to hold onto and it starved. The schedule\'s back to normal.', 'completed'),
    lost: ending('You gave them a reason, and they had all the time in the world. The schedule is a slow, quiet punishment now.', 'failed'),
  },
}

const bossGrudge: EventDef = {
  id: 'cx_life_boss_grudge',
  category: 'work',
  when: { all: [employed, techJob] },
  complication: { sources: ['work'], minTier: 1, maxTier: 3 },
  effects: [{ quest: 'cx_life_grudge_q', start: true }],
  scene: 'cx_life_grudge_scene',
}

// ─────────────────────────────────────────────────────────────────────────────
// cx_life_moonlight_caught — caught using the day job for the night work
// ─────────────────────────────────────────────────────────────────────────────
const moonlightScene: SceneDef = {
  id: 'cx_life_moonlight_scene',
  channel: 'dialog',
  title: 'A Question About Your Access Logs',
  start: 'open',
  nodes: {
    open: {
      speaker: 'IT Security',
      text: [
        'A person you\'ve never spoken to from a department you forgot existed asks you to "grab a room for five minutes." They have a folder. The folder is thin, which is worse than thick.',
        '"We do quarterly access reviews," they say pleasantly. "Yours flagged. After-hours sessions, some traffic that doesn\'t match your role, a couple of tools that aren\'t on the approved list. I\'m not accusing you of anything. I\'m giving you the chance to explain it before this becomes someone else\'s conversation."',
        'It is, of course, exactly what it looks like: you\'ve been using the good bandwidth and the quiet hours for your own work.',
      ],
      choices: [
        {
          text: 'A clean, boring explanation. Sell the mundane version.',
          tag: '[Social DC 17]',
          check: {
            skill: 'social',
            dc: 17,
            success: 'talked',
            fail: 'caught',
            successEffects: [{ quest: 'cx_life_moonlight_q', objective: 'faced' }, { flag: 'cx_life.moon_talked' }],
            failEffects: [{ quest: 'cx_life_moonlight_q', objective: 'faced' }, { flag: 'cx_life.moon_caught' }],
          },
        },
        {
          text: 'Muddy the logs and buy yourself time.',
          tag: '[OpSec DC 16]',
          check: {
            skill: 'opsec',
            dc: 16,
            success: 'muddied',
            fail: 'caught',
            successEffects: [{ quest: 'cx_life_moonlight_q', objective: 'faced' }, { flag: 'cx_life.moon_muddied' }, { stat: 'heat', add: 4 }],
            failEffects: [{ quest: 'cx_life_moonlight_q', objective: 'faced' }, { flag: 'cx_life.moon_caught' }, { stat: 'heat', add: 6 }],
          },
        },
        {
          text: 'Own it, offer to stop, and take the write-up.',
          effects: [{ quest: 'cx_life_moonlight_q', objective: 'faced' }, { flag: 'cx_life.moon_owned' }, { buff: CX_PROBATION }],
          goto: 'owned',
        },
      ],
    },
    talked: {
      speaker: 'narrator',
      text: 'You have a real, dull, half-true story ready — a side certification you\'re studying for, permission you "thought" you had, tools you\'ll happily remove. It\'s plausible enough and you\'re calm enough that they close the folder. "Get the tools off by Friday," they say. You do, and you move the real work off-site for good.',
      effects: [{ xp: 'social', add: 55 }, { trait: 'cx_life_street_smart' }],
    },
    muddied: {
      speaker: 'narrator',
      text: 'You make the trail ambiguous enough that "we can\'t conclusively say" enters the report, which in a big enough company is the same as innocent. You bought your freedom with a favor to future-you, who now has to be twice as careful. It counts as a win, barely.',
      effects: [{ flag: 'cx_life.moon_muddied' }, { trait: 'cx_life_street_smart' }],
    },
    caught: {
      speaker: 'narrator',
      text: 'The story doesn\'t hold, or the logs are too clear, and their pleasant face goes professional. "We\'re going to have to escalate this." A formal write-up, the good bandwidth revoked, and a small permanent asterisk next to your name in a system you can\'t see.',
      effects: [{ flag: 'cx_life.moon_caught' }, { buff: { ...CX_PROBATION, days: 42 } }, { stat: 'heat', add: 5 }],
    },
    owned: {
      speaker: 'narrator',
      text: 'You put your hands up: yes, you did, it stops today, here\'s everything. Honesty doesn\'t make it free — there\'s still a write-up — but it takes the fun out of hunting you, and the reviewer even respects it a little. The night work moves home, where it should have been.',
      effects: [{ xp: 'social', add: 35 }],
    },
  },
}

const moonlightQuest: QuestDef = {
  id: 'cx_life_moonlight_q',
  title: 'Complication: Access Review',
  kind: 'personal',
  priority: 5,
  rewards: 'Survive getting caught moonlighting',
  summary: 'A quarterly access review flagged your after-hours use of the day job for the night work. Someone has a thin folder and a patient smile.',
  start: 's1',
  stages: {
    s1: {
      text: 'Security caught you using work resources for your own work. Talk your way out, cover your tracks, or own it.',
      objectives: [
        { id: 'faced', text: 'Handle the access review', when: { never: true }, hint: 'The dialog "A Question About Your Access Logs" opens it — sell a mundane story [Social DC 17], obscure the logs [OpSec DC 16], or own it and take the write-up.' },
      ],
      next: [
        { if: { flag: 'cx_life.moon_caught' }, stage: 'flagged' },
        { stage: 'clear' },
      ],
    },
    clear: ending('You got out of it and moved the real work off company property for good. Lesson learned the cheap way.', 'completed'),
    flagged: ending('It went in your file, and the good bandwidth is gone. There\'s an asterisk by your name now, in a system you can\'t see.', 'failed'),
  },
}

const moonlightCaught: EventDef = {
  id: 'cx_life_moonlight_caught',
  category: 'work',
  when: { all: [employed, techJob] },
  complication: { sources: ['work'], minTier: 2, maxTier: 4 },
  effects: [{ quest: 'cx_life_moonlight_q', start: true }],
  scene: 'cx_life_moonlight_scene',
}

// ─────────────────────────────────────────────────────────────────────────────
// cx_life_layoff — a blameless layoff (still hurts) — non-arc jobs
// ─────────────────────────────────────────────────────────────────────────────
const layoffScene: SceneDef = {
  id: 'cx_life_layoff_scene',
  channel: 'mail',
  title: 'Company-Wide Announcement',
  from: 'The CEO',
  start: 'note',
  nodes: {
    note: {
      speaker: 'The CEO',
      text: [
        'The all-hands email arrives at 7 a.m., which is when they send the ones you can\'t un-read.',
        '"Team — after a difficult period, we\'ve made the hard decision to reduce our workforce by a significant percentage, effective immediately. This does not reflect the affected employees\' contributions. Those impacted will be contacted individually this morning. To everyone: thank you for your resilience."',
        'Your phone lights up at 7:14. It\'s a calendar invite. The title is just your name and a time.',
      ],
      choices: [
        {
          text: 'Take the meeting, take the package, and land the next thing fast.',
          effects: [{ flag: 'cx_life.layoff_took' }, { job: null }, owe('cx_life_gap', 'Between paychecks', 6, 28), { buff: CX_SCRAPING }, { quest: 'cx_life_layoff_q', objective: 'processed' }],
          goto: 'took',
        },
        {
          text: 'Negotiate the exit hard — you know exactly what you\'re owed.',
          tag: '[Business DC 15]',
          check: {
            skill: 'business',
            dc: 15,
            success: 'good_package',
            fail: 'standard',
            successEffects: [{ job: null }, { flag: 'cx_life.layoff_good' }, { quest: 'cx_life_layoff_q', objective: 'processed' }],
            failEffects: [{ job: null }, { flag: 'cx_life.layoff_took' }, owe('cx_life_gap', 'Between paychecks', 6, 28), { buff: CX_SCRAPING }, { quest: 'cx_life_layoff_q', objective: 'processed' }],
          },
        },
      ],
    },
    took: {
      speaker: 'narrator',
      text: 'It\'s not personal, which somehow doesn\'t help at all. You clean out your desk with a dozen other stunned people, trade numbers with the ones you liked, and step out into a Tuesday that\'s suddenly wide open and terrifying.',
      effects: [{ stat: 'mood', add: -4 }],
    },
    good_package: {
      speaker: 'narrator',
      text: 'You come to the meeting knowing your tenure, your accrued time, and the number they low-balled at first. You leave with a real cushion — enough that the next few weeks are a search, not a scramble. Getting laid off well is a skill, and you\'ve just learned it.',
      effects: [{ money: 1600 }, { xp: 'business', add: 45 }, { trait: 'cx_life_hard_way' }],
    },
    standard: {
      speaker: 'narrator',
      text: 'You push, but their offer is a template and their sympathy is real and useless. You get the standard package and a firm handshake. It\'ll cover a little. It won\'t cover a lot.',
      effects: [{ stat: 'mood', add: -3 }],
    },
  },
}

const layoffQuest: QuestDef = {
  id: 'cx_life_layoff_q',
  title: 'Complication: Reduction in Force',
  kind: 'personal',
  priority: 6,
  rewards: 'Weather a layoff',
  summary: 'The company cut deep and you were on the wrong side of the line. Nobody\'s fault, everyone\'s problem, and now it\'s yours.',
  start: 's1',
  stages: {
    s1: {
      text: 'You\'ve been laid off. Take the package or negotiate a better one — then find your feet.',
      objectives: [
        { id: 'processed', text: 'Get through the exit', when: { never: true }, hint: 'Answer the layoff mail — take the package, or negotiate a better one [Business DC 15].' },
      ],
      next: 's2',
    },
    s2: {
      text: 'The cushion is thin and shrinking. Get back on a payroll, or make freelance carry you.',
      objectives: [
        { id: 'reland', text: 'Get income coming in again', when: { any: [{ not: { job: null } }, { skill: 'business', gte: 40 }] }, hint: 'Take any job from the Careers board — or lean on freelance gigs until the gap closes.' },
      ],
      next: 'landed',
    },
    landed: ending('Income\'s flowing again. You\'ll never quite trust an all-hands email at 7 a.m. the same way.', 'completed'),
  },
}

const layoff: EventDef = {
  id: 'cx_life_layoff',
  category: 'work',
  when: { all: [employed, techJob, { not: onArcJob }] },
  complication: { sources: ['work'], minTier: 2, maxTier: 4 },
  effects: [{ quest: 'cx_life_layoff_q', start: true }],
  scene: 'cx_life_layoff_scene',
}

export default defineContent({
  scenes: [
    writeupScene,
    demoteScene,
    firedScene,
    blacklistScene,
    grudgeScene,
    moonlightScene,
    layoffScene,
  ],
  quests: [writeupQuest, demoteQuest, firedQuest, blacklistQuest, grudgeQuest, moonlightQuest, layoffQuest],
  events: [writtenUp, demoted, fired, blacklisted, bossGrudge, moonlightCaught, layoff],
})
