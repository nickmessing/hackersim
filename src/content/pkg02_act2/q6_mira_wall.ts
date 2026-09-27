/**
 * PKG-02 — main_a2_q6_mira_wall (bible §6.B).
 *
 * Mira's Ridgeport past surfaces. The Social check that decides whether she trusts you carries a
 * bonus if you already coaxed the secret out of her (npc.mira.secret_hinted, PKG-01), and a shown
 * penalty that widens as your stress climbs — the bible's "stress widens failure variance."
 *
 * PKG-02 owns: main_a2_q6_mira_wall, scene a2_mira_wall, npc.mira.trusts + Mira romance:'flirting'.
 * Reads npc.mira.secret_hinted/.respect/.rivalry (PKG-01).
 *
 * Fail branch (REDESIGN_V2 §D): fumbling the wall is the bible's affinity −6 toward `gone` — and now
 * it also earns the Counting Exits scar: you caught her oldest habit, and it stays on the sheet.
 */
import { defineContent } from '@/engine/registry'
import type { QuestDef, SceneDef, SkillCheck } from '@/engine/types'
import { SCAR } from './scars'

const wallCheck: SkillCheck = {
  skill: 'social',
  dc: 15,
  bonuses: [
    { if: { flag: 'npc.mira.secret_hinted' }, add: 2, label: '+2 (you already glimpsed Ridgeport)' },
    { if: { npc: 'mira', affinityGte: 40 }, add: 1, label: '+1 (she already half-trusts you)' },
    { if: { stat: 'stress', gte: 70 }, add: -2, label: '−2 (you\'re frayed, and it shows)' },
    { if: { stat: 'stress', gte: 88 }, add: -2, label: '−2 (running on nothing)' },
    { if: { flag: 'a2.mira_misread' }, add: -1, label: '−1 (she still hears "mapped the exits" from the party)' },
    { if: { all: [{ flag: 'a2.mirror_suspect', eq: 'mira' }, { flag: 'a2.mirror_accused' }] }, add: -2, label: '−2 (you once accused her of being mirror)' },
  ],
  success: 'trusts',
  fail: 'wall_holds',
  successEffects: [{ npc: 'mira', affinity: 15 }, { if: { npc: 'mira', romance: 'none' }, then: [{ npc: 'mira', romance: 'flirting' }] }, { flag: 'npc.mira.trusts' }],
  failEffects: [{ npc: 'mira', affinity: -6 }, { trait: SCAR.countingExits }],
}

const scene: SceneDef = {
  id: 'a2_mira_wall',
  channel: 'dialog',
  title: 'nyx, after midnight',
  from: 'mira',
  start: 'open',
  nodes: {
    open: {
      speaker: 'narrator',
      text: [
        'The raid changed the temperature of everything, and it changed the temperature between you and Mira most of all. You find her on the fire escape outside the Sodium Row back room at some indecent hour, a cigarette she isn\'t smoking burning down between her fingers, watching the neon fail to reach the water.',
        { if: { flag: 'npc.mira.rivalry' }, text: 'Even now she keeps score — she nods at you like the next round is about to start. But her guard is down a millimeter, and with Mira a millimeter is a canyon.' },
        { if: { flag: 'npc.mira.respect' }, text: 'She actually saved you the good spot on the railing, which from Mira is nearly a declaration.' },
        { if: { flag: 'a2.mira_misread' }, text: 'She shifts over to make room, then shifts back half an inch, and you both remember the party — your "you mapped the exits," her face closing like a laptop lid. She hasn\'t brought it up since. Mira never brings anything up. She just keeps it.' },
        { if: { all: [{ flag: 'a2.mirror_suspect', eq: 'mira' }, { flag: 'a2.mirror_accused' }] }, text: 'The last time you two really talked, you asked her if she was mirror. She answered. She has not forgiven the question, and she is here anyway, which tells you how bad the week has been.' },
        { if: { flag: 'a2.jail_beating' }, text: 'She clocks the way you lower yourself onto the railing — the ribs, the careful left side — and her jaw sets. "Holding," she says. Not a question. "Somebody should have told you which corner the camera doesn\'t love."' },
      ],
      next: 'ridgeport',
    },
    ridgeport: {
      speaker: 'mira',
      text: [
        '"When the vans came, I didn\'t breathe until they were gone," she says, not looking at you. "Not because I was scared for me. Because I\'ve seen how this goes. Somebody you trust decides you\'re the safest thing to hand over, and then you\'re just — gone. Scrubbed. Like you never had a handle at all."',
        '"That\'s Ridgeport. That\'s the whole story, if you want it. I took a fall for someone I loved, and he made me disappear off everything we built, and I let him, because I thought that\'s what it looked like to be trusted." She finally turns to you. "So. Are you going to be careful with what I just gave you, or are you going to be another person I have to watch walk away?"',
      ],
      next: 'cp',
    },
    cp: {
      speaker: 'player',
      text: 'Mira Okonkwo just handed you the softest, most dangerous part of herself and asked you not to drop it. There is no smooth play here. There\'s only whether you mean it.',
      choices: [
        {
          text: 'Tell her the truth about you, all of it — meet her where she is.',
          tag: '[Open up]',
          check: wallCheck,
        },
        {
          text: '"You saw what I did when the vans came. That\'s who I am when it counts."',
          tag: '[Proof]',
          req: { any: [{ flag: 'a2.took_a_fall' }, { flag: 'a2.solidarity' }, { flag: 'a2.clean_raid' }] },
          reqText: 'Requires: you stood your ground in the raid (took a fall, rallied the scene, or stonewalled clean)',
          effects: [{ npc: 'mira', affinity: 10 }, { if: { npc: 'mira', romance: 'none' }, then: [{ npc: 'mira', romance: 'flirting' }] }, { flag: 'npc.mira.trusts' }],
          goto: 'trusts',
        },
        {
          text: 'Say nothing clever. Just sit with her and don\'t leave.',
          tag: '[Stay]',
          effects: [{ npc: 'mira', affinity: 6 }],
          goto: 'quiet',
        },
        {
          text: 'Find the exact words that make her believe you.',
          tag: '[Silver Tongue]',
          if: { trait: 'silver_tongue' },
          effects: [{ npc: 'mira', affinity: 12 }, { if: { npc: 'mira', romance: 'none' }, then: [{ npc: 'mira', romance: 'flirting' }] }, { flag: 'npc.mira.trusts' }],
          goto: 'trusts',
        },
        {
          text: 'Change the subject. Some walls are load-bearing.',
          tag: '[Deflect]',
          effects: [{ npc: 'mira', affinity: -2 }],
          goto: 'deflect',
        },
      ],
    },
    trusts: {
      speaker: 'mira',
      text: [
        'You tell her the true things — the ones that cost you something to say — and you watch her decide, in real time, to believe you. It is the bravest thing you have ever seen her do, and she does it like it\'s nothing, which is how you know it\'s everything.',
        '"Okay," she says finally. Just that. "Okay." She lets her shoulder rest against yours, and the neon still doesn\'t reach the water, and for once neither of you needs it to. Later she\'ll pretend the connection dropped. You\'ll let her.',
      ],
      effects: [{ flag: 'a2.mira_wall_done' }, { log: 'Mira trusts you. Whatever this is, it\'s real now — and it can still break.', kind: 'good' }],
    },
    wall_holds: {
      speaker: 'mira',
      text: [
        'You reach for the right thing and you come up with something almost-right, and almost-right is the one thing Mira has no defense against and no forgiveness for. She watches you fumble the most important thing you\'ve been handed all year, and something in her closes with a click you can almost hear.',
        '"Yeah," she says, standing, grinding out the cigarette she never smoked. "That\'s what I thought." She doesn\'t slam anything. Mira never slams anything. She just leaves, and the space where she was gets colder, and you understand you\'ve started her counting the exits again.',
      ],
      effects: [{ flag: 'a2.mira_wall_done' }, { log: 'You fumbled Mira\'s trust. She\'s counting the exits again — one step toward gone.', kind: 'bad' }],
    },
    quiet: {
      speaker: 'narrator',
      text: [
        'You don\'t perform. You don\'t pitch her a version of yourself. You just stay, shoulder to shoulder on a cold railing, until the cigarette burns out and the sky starts thinking about grey.',
        '"You\'re not good at talking," she says eventually, almost fond. "But you showed up and you stayed. That\'s a different language. I speak that one too." It isn\'t everything. But it isn\'t nothing, and with Mira, not-nothing is a door left open.',
      ],
      effects: [{ flag: 'a2.mira_wall_done' }, { log: 'You sat with Mira instead of solving her. She noticed. The door stays open.', kind: 'good' }],
    },
    deflect: {
      speaker: 'mira',
      text: [
        'You steer away from the deep water, gently, the way you\'d route around a bad sector. She lets you. She even laughs at the thing you say to change the subject.',
        'But she files it — the flinch, the swerve — the way she files everything. "Sure," she says. "Some other night." There won\'t be some other night for this. You both know it. You just chose the version where you don\'t have to find out what she needed.',
      ],
      effects: [{ flag: 'a2.mira_wall_done' }, { npc: 'mira', affinity: -2 }],
    },
  },
}

const quest: QuestDef = {
  id: 'main_a2_q6_mira_wall',
  title: "Mira's Wall",
  kind: 'main',
  act: 2,
  giver: 'mira',
  summary:
    'The raid cracked something open in Mira. Her Ridgeport past is finally close to the surface. Whether she lets you in — or starts counting the exits — is decided in one conversation on a cold fire escape.',
  // Started by main_a2_q5 on completion; lands ~60 days later (bible §5.4: q5 +60).
  priority: 20,
  rewards: "Mira's trust · a romance, maybe",
  start: 'wait',
  stages: {
    wait: {
      text: 'Mira has been quiet since the raid — quieter than usual, which is saying something. She\'ll surface when she\'s ready.',
      hint: 'About two months. Social time with Mira beforehand, and keeping your stress down, both help.',
      onEnter: [{ scene: 'a2_mira_wall', delayHours: 60 * 24 }],
      objectives: [{ id: 'wait', text: 'Wait for Mira to surface', when: { seen: 'a2_mira_wall' }, hint: 'Keep playing; she\'ll find you.' }],
      next: 'wall',
    },
    wall: {
      text: 'Mira is on the fire escape at the back room, offering you the truth about Ridgeport. Don\'t drop it.',
      hint: 'The core is a Social check. High stress widens your failure variance; glimpsing her secret earlier helps, and standing your ground in the raid unlocks a surer answer.',
      objectives: [{ id: 'talk', text: 'Meet Mira on the fire escape', when: { flag: 'a2.mira_wall_done' }, hint: 'Open the dialog and choose.' }],
      onComplete: [{ quest: 'main_a2_q7_meridian_test', start: true }],
    },
  },
}

export default defineContent({
  quests: [quest],
  scenes: [scene],
})
