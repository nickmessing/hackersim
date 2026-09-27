/**
 * PKG-02 — main_a2_q3_jax_overreach (bible §6.B, CP-B2).
 *
 * Jax took an Aperture contract behind your back — too hot — to cover Rosa's medical bills, and
 * calls you at 3 a.m. from the Cathode. How you answer sets the flags his fate hangs on.
 *
 * PKG-02 owns: main_a2_q3_jax_overreach, scene a2_jax_3am, npc.jax.protected/.aborted/.covered/.alone,
 * npc.jax.exposed. Rosa's fate here (treated/worsens) is a legal §4.6 value handed to PKG-11's Rosa arc.
 *
 * Fail branches: a blown cover (CP-B2 C, either skill) still sets npc.jax.exposed exactly as the
 * bible says, and now also mails you the bill — a2_jax_invoice (q3b_jax_invoice.ts), a restitution
 * demand from the spooked buyer's collectors with its own lasting outcomes. A misread of Jax in the
 * cagey chat (a2.missed_jax_signs) is remembered at the 3 a.m. booth.
 */
import { defineContent } from '@/engine/registry'
import type { Effect, QuestDef, SceneDef, TriggerDef } from '@/engine/types'

/**
 * CP-B2 C fail (bible: client spooked, heat +15, npc.jax.exposed, Jax +4). Kept verbatim — and the
 * spooked buyer sends collectors: a2_jax_invoice lands five days later with its own fork.
 */
const failedCover: Effect[] = [
  { stat: 'heat', add: 15 },
  { flag: 'npc.jax.exposed' },
  { npc: 'jax', affinity: 4 },
  { scene: 'a2_jax_invoice', delayHours: 5 * 24 },
]

const scene: SceneDef = {
  id: 'a2_jax_3am',
  channel: 'dialog',
  title: '3 A.M. at the Cathode',
  from: 'jax',
  start: 'open',
  nodes: {
    open: {
      speaker: 'narrator',
      text: [
        'The pager goes off at 3:04 a.m. — JAX, and then, ninety seconds later, JAX again, and then the payphone number for the Cathode, which he only ever uses when his cell is off because he doesn\'t want a record.',
        'You find him in the corner booth, the one with his initials under the table, hands wrapped around a coffee he hasn\'t touched. He looks like he\'s aged since Tuesday.',
      ],
      next: 'confess',
    },
    confess: {
      speaker: 'jax',
      text: [
        '"Okay. Okay, don\'t — don\'t do the face. I took a job. A real one. Aperture money, through a cutout, and I know, I KNOW, but Rosa\'s bills came and the number had a comma in it I\'ve never seen before and I just—" He drags a hand down his face.',
        { if: { flag: 'a1.jax_covered_you' }, text: '"You remember when you bricked that crack and I told the whole board it was my fault? I\'m not calling that in. I just — I remember it. I\'m hoping you do."' },
        { if: { flag: 'a2.missed_jax_signs' }, text: '"I almost told you, you know. Last month. You asked what was going on and I said boring database stuff and you just… let me." He isn\'t accusing you. That\'s what makes it land.' },
        {
          if: { all: [{ flag: 'a2.mirror_suspect', eq: 'jax' }, { flag: 'a2.mirror_accused' }] },
          text: '"And before you ask — no. I\'m still not mirror." A crooked, exhausted almost-laugh. "I figured if you still thought I was, you wouldn\'t come. You came. So."',
        },
        '"It\'s too hot. It\'s way over my head. There\'s a trace on it I can\'t shake and a client who wants delivery in eighteen hours or he does something I don\'t want to think about. I didn\'t know who else— you\'re the only one who— " He stops. "Please. Tell me what to do."',
      ],
      next: 'cp_b2',
    },
    cp_b2: {
      speaker: 'player',
      text: 'His sister\'s name is on an envelope in his jacket pocket. You can see the corner of it. Whatever you decide, decide it now.',
      choices: [
        {
          text: 'Take it over. Finish it for him — put the heat on you.',
          tag: '[Protect]',
          effects: [
            { stat: 'heat', add: 20 },
            { npc: 'jax', affinity: 20 },
            { flag: 'npc.jax.protected' },
            { npc: 'rosa', fate: 'treated' },
          ],
          goto: 'took_over',
        },
        {
          text: 'Talk him out of it. Abort, eat the loss, keep him clean.',
          tag: '[Abort]',
          effects: [
            { npc: 'rosa', fate: 'worsens' },
            { flag: 'npc.jax.aborted' },
            { npc: 'jax', affinity: -4 },
          ],
          goto: 'aborted',
        },
        {
          text: 'Feed the client a convincing partial — talk him into believing it\'s whole.',
          tag: '[Con the client]',
          check: {
            skill: 'social',
            dc: 15,
            bonuses: [{ if: { flag: 'a1.bond_jax' }, add: 1, label: '+1 (you and Jax can finish each other\'s lies)' }],
            success: 'covered',
            fail: 'exposed',
            successEffects: [{ flag: 'npc.jax.covered' }, { faction: 'fac.aperture', add: 5 }],
            failEffects: failedCover,
          },
        },
        {
          text: 'Ship a believable fake — code that looks exactly like what he paid for.',
          tag: '[Forge it]',
          check: {
            skill: 'programming',
            dc: 15,
            bonuses: [{ if: { flag: 'fac.aperture.client' }, add: 1, label: '+1 (you know what Aperture deliveries look like)' }],
            success: 'covered',
            fail: 'exposed',
            successEffects: [{ flag: 'npc.jax.covered' }, { faction: 'fac.aperture', add: 5 }],
            failEffects: failedCover,
          },
        },
        {
          text: 'Pay Rosa\'s bill yourself, tonight. Then kill the job and walk him out of it.',
          tag: '[Pay $3000]',
          req: { stat: 'money', gte: 3000 },
          reqText: 'Requires: $3000 on hand',
          effects: [
            { money: -3000 },
            { npc: 'rosa', fate: 'treated' },
            { flag: 'npc.jax.aborted' },
            { flag: 'npc.jax.protected' },
            { npc: 'jax', affinity: 12 },
          ],
          goto: 'paid',
        },
        {
          text: 'Call the number Kroll gave you. Ask her to make this particular problem go away.',
          tag: '[Call Kroll]',
          if: { any: [{ flag: 'fac.aperture.client' }, { flag: 'fac.aperture.retainer' }] },
          effects: [
            { flag: 'npc.jax.covered' },
            { npc: 'rosa', fate: 'treated' },
            { faction: 'fac.aperture', add: 8 },
            { faction: 'fac.loft', add: -4 },
            { var: 'w.enclosure', add: 1 },
            { npc: 'jax', affinity: 6 },
          ],
          goto: 'kroll_fix',
        },
        {
          text: '"This one\'s yours, man. You have to handle it."',
          tag: '[Walk away]',
          effects: [{ flag: 'npc.jax.alone' }, { npc: 'jax', affinity: -6 }],
          goto: 'alone',
        },
      ],
    },
    paid: {
      speaker: 'narrator',
      text: [
        'You write the check on the Cathode counter with Sal\'s pen, the one chained to the register. Rosa\'s name on the memo line. Then you sit with Jax while he sends the client the shortest, politest "no" in the history of crime and pulls every trace of himself off the job.',
        '"I\'m paying you back," he says. "Every cent. With interest. With pizza interest." He won\'t, not all of it, and you both know that\'s not the point. The point is Rosa gets her treatment and Jax gets to be a guy who didn\'t have to become someone else to pay for it.',
      ],
      effects: [{ flag: 'a2.jax_answered' }, { log: 'You paid Rosa\'s bill yourself and walked Jax out clean. It cost you money. It cost him nothing he can\'t live with.', kind: 'good' }],
    },
    kroll_fix: {
      speaker: 'narrator',
      text: [
        'She picks up on the second ring at 3:40 in the morning like she was expecting you. You explain. She listens without interrupting, which is somehow worse.',
        '"Consider it handled, dear. The client is one of mine, as it happens — most of them are." A pause, perfectly weighted. "And your friend\'s sister will be fine. I\'ll see to it. You don\'t owe me a thing." You hang up knowing that is the single most expensive sentence anyone has ever said to you.',
        { if: { flag: 'a2.kroll_lowballed' }, text: 'Just before the line clicks, she adds, pleasantly: "Consider it a gift. At the rate Miles wrote down for you, you could never afford it anyway."' },
      ],
      effects: [{ flag: 'a2.jax_answered' }, { log: 'Kroll made Jax\'s problem disappear with one phone call. You don\'t owe her anything. That\'s what she said.', kind: 'story' }],
    },
    took_over: {
      speaker: 'narrator',
      text: [
        'You take the laptop out of his hands. You spend the ugly small hours cleaning up a mess that was never yours, and by dawn the trace is chasing you instead, and Rosa\'s bill is somebody else\'s problem now — yours.',
        'Jax watches you work with the expression of a man watching someone bail out his boat with their bare hands. When it\'s done he tries to say thank you three different ways and lands on none of them, so he just goes and gets more coffee. He owes you now, forever, and you both know he\'ll pay it back in pizza and showing up.',
      ],
      effects: [{ flag: 'a2.jax_answered' }, { log: 'You took Jax\'s hot contract onto your own head. Rosa\'s bills get covered. The heat is yours now.', kind: 'story' }],
    },
    aborted: {
      speaker: 'jax',
      text: [
        '"Yeah," he says, when you finally get through to him. "Yeah, you\'re right. Kill it. Walk away." He kills it. He walks away.',
        'And then he sits there staring at the envelope in his hand, and the comma in the number, and the thing he can\'t buy with a cleared conscience. "It was the right call," he says, not looking at you. "It was. Rosa doesn\'t care about the right call." He calls you less, after that. Not out of anger. Just — a little farther away.',
      ],
      effects: [{ flag: 'a2.jax_answered' }, { log: 'You talked Jax off the ledge. He\'s safe, and ashamed, and a step farther from you. Rosa\'s treatment stalls.', kind: 'story' }],
    },
    covered: {
      speaker: 'narrator',
      text: [
        'You don\'t finish the job and you don\'t kill it — you feed the client exactly enough to make him believe he got what he paid for. A partial dressed up as a whole. Smoke that reads as fire on every gauge that matters.',
        'The trace loses interest. The client sends a satisfied little acknowledgement. Somewhere, without knowing why, Kroll makes a note that whoever cleaned this up has a smooth touch. Jax exhales for what looks like the first time in a day. "You," he says, "are a terrifying human being, and I love you."',
      ],
      effects: [{ flag: 'a2.jax_answered' }, { log: 'You covered Jax with a convincing fake. Everyone walks. Aperture noticed your smooth hands.', kind: 'story' }],
    },
    exposed: {
      speaker: 'narrator',
      text: [
        'The fake doesn\'t hold. The client is smarter, or luckier, or just more paranoid than you gambled on, and the whole thing lights up — a spooked buyer, a live trace, and Jax\'s name now sitting in a file it should never have been near.',
        '"It\'s okay," Jax says, in the voice of someone for whom it is very much not okay. "You tried. That\'s more than— you tried." He starts checking the street before he gets out of the car. He\'ll do that for years.',
        'Worse: your hands are on the fake now, too. The buyer didn\'t just get spooked — he got a second fingerprint. Men like that don\'t call the police. They call accountants.',
      ],
      effects: [{ flag: 'a2.jax_answered' }, { log: 'The cover blew. Jax is exposed now — his name is in a file that will come looking for him.', kind: 'bad' }],
    },
    alone: {
      speaker: 'jax',
      text: [
        'Something closes in his face, quietly, like a door in another room. "No. Yeah. You\'re right. It\'s mine." He stands, leaves money on the table you both know he can\'t spare, and squares his shoulders at 3 a.m. like he\'s walking into weather.',
        '"Thanks for coming," he says, and means it, and it\'s the loneliest thank-you you\'ve ever heard. He handles it. Sort of. He handles it alone.',
      ],
      effects: [{ flag: 'a2.jax_answered' }, { log: 'You let Jax face it alone. He did — sort of. Remember that, when the men in jackets come.', kind: 'bad' }],
    },
  },
}

const cagey: SceneDef = {
  id: 'a2_jax_cagey',
  channel: 'chat',
  title: 'Jax',
  from: 'jax',
  pause: false,
  start: 'a',
  nodes: {
    a: {
      speaker: 'jax',
      text: ['hey', 'sorry been MIA. work stuff', 'not work work. side stuff. its fine', 'rosa says hi. she drew u a picture of a robot. its u. u have 6 arms'],
      choices: [
        { text: '"what kind of side stuff?"', goto: 'dodge' },
        { text: '"tell rosa the robot is accurate. 6 arms, 0 sleep"', effects: [{ npc: 'jax', affinity: 2 }], goto: 'lol' },
        {
          text: '"you sound off. whats going on"',
          tag: '[Read him]',
          check: {
            skill: 'social',
            dc: 13,
            bonuses: [{ if: { trait: 'empath' }, add: 2, label: '+2 (Empath)' }],
            success: 'crack',
            fail: 'misread',
            successEffects: [{ npc: 'jax', affinity: 2 }],
            // Minor: you push the wrong way, he closes up, and he remembers you let it go.
            failEffects: [{ stat: 'stress', add: 3 }, { npc: 'jax', affinity: -1 }, { flag: 'a2.missed_jax_signs' }],
          },
        },
      ],
    },
    dodge: {
      speaker: 'jax',
      text: ['just freelance', 'boring database stuff lol', 'gtg. brb. ttyl. all the letters'],
    },
    misread: {
      speaker: 'jax',
      text: [
        'lol what is this, an intervention',
        'im FINE. u sound like my mom. u sound like MY mom pretending to be YOUR mom',
        'its just freelance. boring database stuff. seriously drop it',
        '[JaxAttack is away: "brb saving the world (from boredom)"]',
      ],
    },
    lol: {
      speaker: 'jax',
      text: ['LOL she will be so proud', 'ok gtg. talk soon. for real this time'],
    },
    crack: {
      speaker: 'jax',
      text: ['...', 'its just money stuff man. rosas bills. i got it handled', 'i got it handled', 'if i DONT have it handled ur the first call. promise'],
    },
  },
}

/** The 3 a.m. call really does come at 3 a.m. */
const callTrigger: TriggerDef = {
  id: 'trig_a2_jax_3am',
  once: true,
  atHour: 3,
  chance: 0.35,
  when: { all: [{ quest: 'main_a2_q3_jax_overreach', stage: 'call' }, { jailed: false }] },
  effects: [{ scene: 'a2_jax_3am' }],
}

const quest: QuestDef = {
  id: 'main_a2_q3_jax_overreach',
  title: 'In Over His Head',
  kind: 'main',
  act: 2,
  giver: 'jax',
  summary:
    'Jax took an Aperture job behind your back to pay Rosa\'s medical bills, and it\'s burning him alive. He called you at 3 a.m. What you do here decides how far he falls.',
  // Started by main_a2_q2 on completion; lands ~120 days later (bible §5.4: q2 +120).
  priority: 20,
  rewards: 'Jax\'s fate hangs here',
  start: 'wait',
  stages: {
    wait: {
      text: 'Life is busy, and so is Jax — suspiciously busy. He\'s been dodging your pages for weeks.',
      hint: 'Give it a few months. Spending social time with Jax now never hurts later.',
      onEnter: [{ scene: 'a2_jax_cagey', delayHours: 112 * 24 }],
      objectives: [
        { id: 'cagey', text: 'Hear from Jax', when: { seen: 'a2_jax_cagey' }, hint: 'He\'ll surface on the BuddyPager eventually.' },
      ],
      next: 'call',
    },
    call: {
      text: 'Jax says he\'s got it handled. Jax has never once had anything handled. Keep your pager on at night.',
      hint: 'The call comes in the small hours within a week or so. You can\'t take it from a cell.',
      objectives: [
        { id: 'answer', text: 'Answer Jax at the Cathode', when: { flag: 'a2.jax_answered' }, hint: 'When the 3 a.m. dialog lands, open it and choose.' },
      ],
    },
  },
}

export default defineContent({
  quests: [quest],
  scenes: [scene, cagey],
  triggers: [callTrigger],
})
