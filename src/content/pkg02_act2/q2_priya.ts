/**
 * PKG-02 — main_a2_q2_priya: the mentor deepens (bible §6.B).
 *
 * If you leaned legit, Priya gets you a Halcyon interview; otherwise she corners you at the Cathode
 * and tries to pull you out. Either way she reveals she was scene once and sold her silence in '99.
 *
 * PKG-02 owns: main_a2_q2_priya, scene a2_priya, flags a2.priya_backstory / npc.priya.warned_you,
 * and (per §12.5) fac.halcyon.employed — set here on the interview branch; PKG-09's job/rep content
 * reads it. Interview gate is the single canonical form (bible §6.B).
 *
 * Fail branches: a flubbed interview starts a2_cmp_temp_pool (q2b_temp_pool.ts) — the second chance
 * is real, and so is losing it. A failed opsec grilling costs a night, a modem, and maybe more.
 */
import { defineContent } from '@/engine/registry'
import type { Cond, Effect, QuestDef, SceneDef } from '@/engine/types'

/**
 * Interview fail (bible: "you flub it, Dee slips you a second-chance temp gig"). HR writes it down,
 * and the temp gig is now a real sub-quest — a2_cmp_temp_pool, a second interview five weeks out
 * that can land the badge after all, or close the Hill's door for good.
 */
const flubbed: Effect[] = [{ stat: 'stress', add: 5 }, { faction: 'fac.halcyon', add: -4 }, { flag: 'a2.halcyon_flubbed' }]

const interviewGate: Cond = { any: [{ faction: 'fac.halcyon', gte: 20 }, { flag: 'a1.job_started' }, { degree: true }, { flag: 'a2.leaned_legit' }] }

const scene: SceneDef = {
  id: 'a2_priya',
  channel: 'dialog',
  title: 'root_cause',
  from: 'priya',
  start: 'open',
  nodes: {
    open: {
      speaker: 'narrator',
      text: [
        'Priya Raman finds you the way she does everything: efficiently, and slightly before you\'re ready. Reading glasses up in her hair, a mug in her hand that says WORLD\'S OKAYEST ENGINEER, and the specific tiredness of a legend who went straight and never quite got the scene to forgive her.',
        { if: interviewGate, text: 'This time it\'s a folder with a Halcyon logo and a real chair on the other side of a real desk. "I put your name in," she says. "Try not to make me regret it in the first ten minutes."' },
        { if: { not: interviewGate }, text: 'This time it\'s a booth at the Cathode at an hour when only hard conversations happen. She slides a coffee across before you sit down. "We need to talk about your road," she says. "Specifically, where it ends."' },
      ],
      effects: [{ npc: 'priya', met: true, affinity: 5 }],
      next: 'branch',
    },
    branch: {
      speaker: 'priya',
      text: [
        { if: interviewGate, text: '"Halcyon\'s hiring juniors and Vale signs whatever HR puts in front of him. The work is real. The building has good coffee and worse secrets. You\'d have benefits, a title, a badge that opens the parking garage." A pause. "Show them you can think. That\'s the whole interview. The rest is theater."' },
        { if: { not: interviewGate }, text: '"You\'re getting good," she says. "Good enough that the wrong people are starting to notice. I need you to hear this from someone who loves you and has already made the mistake."' },
      ],
      choices: [
        {
          text: 'Walk them through a real fix, live, on their own whiteboard.',
          tag: '[Show, don\'t tell]',
          if: interviewGate,
          check: {
            skill: 'programming',
            dc: 12,
            bonuses: [{ if: { flag: 'a2.leaned_school' }, add: 1, label: '+1 (fresh from Lumen State lectures)' }],
            success: 'hired',
            fail: 'interview_flub',
            failEffects: flubbed,
          },
        },
        {
          text: 'Sell them the version of you they want to hire.',
          tag: '[Pitch]',
          if: interviewGate,
          check: {
            skill: 'business',
            dc: 12,
            bonuses: [{ if: { flag: 'a2.two_hats' }, add: 1, label: '+1 (you already sell yourself twice a week)' }],
            success: 'hired',
            fail: 'interview_flub',
            failEffects: flubbed,
          },
        },
        {
          text: 'Let the diploma — or your Halcyon reputation — do the talking.',
          tag: '[Credentials]',
          if: interviewGate,
          req: { any: [{ degree: true }, { faction: 'fac.halcyon', gte: 20 }] },
          reqText: 'Requires: a degree or Halcyon standing (rep 20+)',
          goto: 'hired',
        },
        {
          text: '"Tell me what mistake you made."',
          tag: '[Listen]',
          if: { not: interviewGate },
          effects: [{ npc: 'priya', affinity: 3 }, { flag: 'npc.priya.warned_you' }],
          goto: 'backstory',
        },
        {
          text: '"I\'m careful. Ask me anything — I\'ll show you how careful."',
          tag: '[Prove it]',
          if: { not: interviewGate },
          check: {
            skill: 'opsec',
            dc: 13,
            success: 'careful_win',
            fail: 'careful_fail',
            successEffects: [{ npc: 'priya', affinity: 4 }, { flag: 'npc.priya.warned_you' }],
            // Fail: an all-nighter, a modem you can't afford, and one hole somebody had already used.
            failEffects: [
              { stat: 'heat', add: -3 },
              { stat: 'stress', add: 6 },
              { stat: 'energy', add: -12 },
              { money: -150 },
              { flag: 'npc.priya.warned_you' },
              { chance: 0.3, then: [{ complication: 'hack' }] },
            ],
          },
        },
        {
          text: '"I\'m not you. I know when to stop."',
          tag: '[Push back]',
          if: { not: interviewGate },
          effects: [{ npc: 'priya', affinity: -2 }, { flag: 'npc.priya.warned_you' }],
          goto: 'backstory',
        },
      ],
    },
    careful_win: {
      speaker: 'priya',
      text: [
        'She fires questions like a pen-tester — where you keep your logs, who knows your real name, what you\'d do if the phone rang at 6 a.m. — and you answer every one without flinching. She sits back, a little surprised.',
        '"Okay. You\'re better than I was at your age." She doesn\'t sound relieved. "That\'s the problem. Careful people get invited to nicer dinners."',
      ],
      next: 'backstory',
    },
    careful_fail: {
      speaker: 'priya',
      text: [
        'Her third question lands in a hole you didn\'t know you had. Her fourth finds another. By the sixth you\'re quiet and she\'s writing a list on a napkin: things to fix, tonight, before anyone else notices.',
        '"Don\'t look at me like that. Do the list." You do the list. It takes all night and a replacement modem you can\'t afford, and some heat you\'d been carrying bleeds off with it.',
        'At dawn she calls with one more thing, in her flattest voice. "The fourth hole. There were footprints in it that weren\'t yours. Maybe nothing." A pause. "Maybe not." Then she hangs up, which is Priya for a hug.',
      ],
      next: 'backstory',
    },
    hired: {
      speaker: 'priya',
      text: [
        '"There it is," Priya says, and lets herself smile. "You\'re in. Junior, underpaid, a cubicle with a view of another cubicle. Congratulations, you have a normal job. Some people would kill for a normal job."',
        '"Keep your head down and your side projects dark, and this can be the boring, good life. I mean that as the highest compliment I know how to give."',
      ],
      effects: [
        { flag: 'fac.halcyon.employed' },
        { faction: 'fac.halcyon', add: 10 },
        { log: 'Halcyon took you on. Priya vouched. The badge opens the parking garage and, eventually, worse doors.', kind: 'story' },
      ],
      next: 'backstory',
    },
    interview_flub: {
      speaker: 'narrator',
      text: [
        'You blank. Not completely — just enough. A stammered answer, a whiteboard you fill with the wrong confident thing, and an HR person whose smile never reaches the part of the face that decides.',
        'Priya buys you a bad coffee afterward and doesn\'t say I-told-you-so, which is worse.',
      ],
      next: 'dee_save',
    },
    dee_save: {
      speaker: 'dee',
      text: [
        '"Heard you ate it up on the Hill." Dee Briggs materializes with a binder and the terrifying warmth of a manager who has decided to fix you. "Lucky for you, I run the office temp pool now, and I need a warm body who knows which end of a keyboard is dangerous. It\'s not glamorous. It\'s a foot in the door. Now heal the door."',
        { if: { flag: 'a1.dee_probation' }, text: '"And yes, you\'re on probation. Again. Some people are born on it. I say that with love and a clipboard."' },
        '"Five weeks at the copier, no mistakes, and I march you back into HR myself. They put a sticky note on your file. I\'ve seen it. I\'ve beaten worse sticky notes."',
      ],
      effects: [
        { npc: 'dee', met: true, affinity: 6 },
        { money: 200 },
        { flag: 'a2.dee_temp_gig' },
        { quest: 'a2_cmp_temp_pool', start: true },
        { log: 'You flubbed the Halcyon interview; Dee slid you into her temp pool with a second shot at HR. There are no dead ends where Dee is concerned — only detours.', kind: 'good' },
      ],
      next: 'backstory',
    },
    backstory: {
      speaker: 'priya',
      text: [
        'She turns the mug in her hands, reading the old joke on it like it might have changed.',
        { if: { flag: 'fac.aperture.client' }, text: '"I know Vanessa Kroll bought you dinner," she says quietly. "Don\'t ask how. Everyone in this city who has ever eaten that salmon knows everyone else who has."' },
        { if: { flag: 'a2.refused_kroll' }, text: '"I heard you told Vanessa Kroll no." Something like pride crosses her face and is carefully put away. "Nobody tells her no. That\'s why I\'m telling you this now, while you still can."' },
        '"In \'99 I found something inside a client. A prototype — a way to take everything a company knew about you and turn it into a number that decides things about your life. I wrote it up. I did everything right." A thin laugh. "And they bought the report. And they bought my silence with it, and I let them, because I had a mortgage and a mother and a very good reason every single time."',
        '"That thing has a name now. PARALLAX. It\'s bigger than I ever imagined, and I helped it grow up quiet. Rule two, remember? You are a person who bought a machine. So am I. I\'m just further down the road, waving at you to slow down."',
      ],
      effects: [{ flag: 'a2.priya_backstory' }],
      choices: [
        {
          text: '"Then help me stop it. When it\'s time."',
          effects: [{ npc: 'priya', affinity: 6 }],
          goto: 'close',
        },
        {
          text: '"Or help me survive it. Not everyone gets to be brave."',
          goto: 'close',
        },
        {
          text: '"You didn\'t fail. You survived. That\'s allowed."',
          tag: '[Empath]',
          if: { trait: 'empath' },
          effects: [{ npc: 'priya', affinity: 10 }, { stat: 'mood', add: 4 }],
          goto: 'close',
        },
      ],
    },
    close: {
      speaker: 'priya',
      text: '"Good talk," she says, in the flat way that means it actually was. She pushes her glasses back down. "Whatever you decide, decide it with your eyes open. That\'s the only rule I\'ve never broken." She leaves the mug. You keep it.',
    },
  },
}

const quest: QuestDef = {
  id: 'main_a2_q2_priya',
  title: 'Root Cause',
  kind: 'main',
  act: 2,
  giver: 'priya',
  summary:
    'Priya Raman wants to either get you a job or get you out. Either way, she has a confession from 1999 that reframes everything: the mentor was complicit first.',
  // Started by main_a2_q1 on completion; Priya's beat lands ~90 days later (bible §5.4: q1 +90).
  priority: 20,
  rewards: 'A mentor · maybe a legit job',
  start: 'wait',
  stages: {
    wait: {
      text: 'The dust from Kroll\'s dinner settles into your carpet and your conscience. Priya Raman has been asking around about you.',
      hint: 'Priya will find you in about three months. Anything you build before then — Halcyon rep, a job, a degree — changes which conversation you get.',
      onEnter: [{ scene: 'a2_priya', delayHours: 90 * 24 }],
      objectives: [
        { id: 'found', text: 'Let Priya find you', when: { seen: 'a2_priya' }, hint: 'Keep playing; the beat lands on its own.' },
      ],
      next: 'meet',
    },
    meet: {
      text: 'Priya Raman wants to talk — a Halcyon interview if you\'ve leaned legit, a hard conversation at the Cathode if you haven\'t. Hear her out.',
      hint: 'Halcyon standing (20+), an Act I job, or a degree gets you the interview instead of the intervention.',
      objectives: [
        { id: 'talk', text: 'Hear Priya\'s confession', when: { flag: 'a2.priya_backstory' }, hint: 'See the dialog through to her story about 1999.' },
      ],
      onComplete: [{ quest: 'main_a2_q3_jax_overreach', start: true }],
    },
  },
}

export default defineContent({
  quests: [quest],
  scenes: [scene],
})
