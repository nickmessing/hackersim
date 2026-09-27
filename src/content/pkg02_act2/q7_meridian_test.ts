/**
 * PKG-02 — main_a2_q7_meridian_test: the Act II hinge (bible §6.B, CP-B5).
 *
 * Kroll offers a dry run on Meridian's new online banking; Reyes offers a way out. This sets your Act
 * III spine (`a2.spine`). The wire option (E) is combinable — offered first, then the spine choice —
 * so it stacks with any road. The dial-up handshake, warm since Act I, is inverted here into the
 * sound of a wiretap (bible §6.E, keyed on a2.phase_iib).
 *
 * PKG-02 owns: main_a2_q7_meridian_test, scene a2_hinge, a2.hinge_done / .meridian_recon /
 * .double_agent / .went_straight / .recon_sloppy, a2.spine (str), fac.aperture.* rep,
 * fac.bureau.informant*, item kroll_recording (grant), npc.kroll.wary; end.doubles (+, shared add-only).
 * References mission a2_meridian_recon (PKG-17).
 */
import { defineContent } from '@/engine/registry'
import type { QuestDef, SceneDef, TriggerDef } from '@/engine/types'
import { SCAR } from './scars'

const scene: SceneDef = {
  id: 'a2_hinge',
  channel: 'dialog',
  title: 'The Meridian Test',
  from: 'kroll',
  start: 'open',
  nodes: {
    open: {
      speaker: 'narrator',
      text: [
        'Two offers land in the same week, which is not a coincidence, because in this city nothing is anymore.',
        { if: { flag: 'a2.refused_kroll' }, text: 'Kroll, who you told no once over salmon at the top of her tower, has come back smaller and smarter, exactly as she promised.' },
        { if: { flag: 'fac.bureau.informant' }, text: 'Reyes doesn\'t need to recruit you. You\'re already hers. What she wants now is to know whether you\'ll stay that way when Kroll makes you an offer with more zeroes in it.' },
        { if: { all: [{ flag: 'fac.bureau.on_radar' }, { not: { flag: 'fac.bureau.informant' } }] }, text: 'Reyes already has a folder with your name on it — the raid saw to that. This meeting isn\'t a recruitment so much as a bill coming due, and you both know it.' },
        { if: { flag: 'a2.byteme_named_you' }, text: 'Reyes will also have Kevin Pham\'s statement, the one where a terrified sixteen-year-old repeated your coaching back to a detective word for word, with your handle attached. You have never read it. You can recite it anyway.' },
        { if: { flag: 'a2.jail_beating' }, text: 'Your ribs still tell the weather from the week in holding. Reyes has the intake photos from after, too. She is the kind of person who would bring them to a diner and not show you — just let you know they\'re in the folder.' },
        { if: { flag: 'a2.informant_is_you_rumor' }, text: 'And on the board, half the Loft still types a little more carefully when you\'re online. The rumor that you were the hole in the wall never died; it just went quiet. Which makes a booth with Agent Reyes the single most dangerous place in the city for you to be seen.' },
        { if: { flag: 'a2.talked_to_calderon' }, text: 'And there\'s the detail that keeps you up: the day you talked at Calderon on Jax\'s sidewalk, you put your own name in her notebook. Reyes will have read it. Reyes reads everything Calderon writes.' },
        'Kroll wants a dry run: not the heist, just a look — map Meridian Trust\'s new online-banking rig, leave a quiet beacon, prove it can be done. "Reconnaissance," she calls it, like it\'s a nature walk. And Agent Reyes wants a coffee in a diner where nobody knows her, where she slides a folder across the table and offers you a door marked EXIT that leads, you slowly realize, into a smaller room.',
        'That night you dial in to think, and the modem sings its handshake — that old, warm, two-machines-shaking-hands sound you grew up loving — and for the first time you hear it the way a wiretap transcript would render it: HANDSHAKE INITIATED. SESSION LOGGED. The comfort was always also the surveillance. You just never had a reason to notice.',
      ],
      next: 'wire_q',
    },
    wire_q: {
      speaker: 'player',
      text: [
        'Before you answer either of them, there\'s a smaller, colder question only you can hear: do you protect yourself? Kroll is going to ask you for something on the record, in her own warm voice. That voice, captured, would be worth more than anything in this city.',
      ],
      choices: [
        {
          text: 'Wire yourself. Record Kroll\'s ask as insurance.',
          tag: '[Wire up]',
          check: {
            skill: 'cryptography',
            dc: 17,
            bonuses: [
              { if: { skill: 'hardware', gte: 35 }, add: 1, label: '+1 (you built the rig yourself)' },
              { if: { flag: 'npc.kroll.wary' }, add: -2, label: '−2 (Kroll is already watching your hands)' },
            ],
            success: 'wired',
            fail: 'wire_fail',
            successEffects: [{ item: 'kroll_recording' }],
            // Bible: fail sets npc.kroll.wary (retryable). §D: she also mails you the tape of you
            // testing the wire — the Your Own Voice scar, and a2.wire_failed for later Kroll beats.
            failEffects: [{ flag: 'npc.kroll.wary' }, { flag: 'a2.wire_failed' }, { trait: SCAR.ownVoice }],
          },
        },
        {
          text: 'Go in clean. No wire, no insurance, no evidence trail pointing at you.',
          tag: '[No wire]',
          goto: 'spine',
        },
      ],
    },
    wired: {
      speaker: 'narrator',
      text: 'You build the rig small and mean, encrypted twice, stored in three places, and you test it against your own voice until you trust it. When Kroll speaks, it will listen. The nuclear option, in your pocket, warm as a coal. Now — the actual choice.',
      next: 'spine',
    },
    wire_fail: {
      speaker: 'narrator',
      text: [
        'The rig throws an error at exactly the wrong sensitivity, and worse, you get the feeling Kroll clocked the pause — the half-second where you were doing two things at once. Nothing said. But she files it. She files everything.',
        'Three days later a padded envelope arrives with no return address. Inside: a mini-cassette and a note in Hollis\'s block capitals. The tape is you, in your own room, muttering "testing, testing" into a wire that never worked. She wants you to know she has it. She wants you to hear your own voice and understand who owns the recording in this relationship. Now — the actual choice.',
      ],
      next: 'spine',
    },
    spine: {
      speaker: 'player',
      text: 'This is the hinge. Whatever you decide here becomes the spine of everything that comes after — the version of you that walks into Act III.',
      choices: [
        {
          text: 'Do the recon for Kroll. Hide it from Reyes.',
          tag: '[Aperture]',
          effects: [
            { faction: 'fac.aperture', add: 20 },
            { flag: 'a2.meridian_recon' },
            { flag: 'a2.spine', set: 'aperture' },
            { var: 'w.enclosure', add: 1 },
          ],
          goto: 'recon_brief',
        },
        {
          text: 'Take Reyes\'s deal. Feed her Aperture. Corvid can never know.',
          tag: '[Bureau]',
          if: { not: { flag: 'fac.bureau.informant' } },
          effects: [
            { faction: 'fac.bureau', add: 20 },
            { faction: 'fac.aperture', add: -30 },
            { faction: 'fac.loft', add: -6 },
            { flag: 'fac.bureau.informant' },
            { flag: 'fac.bureau.informant_secret' },
            { flag: 'a2.spine', set: 'bureau' },
          ],
          goto: 'out_bureau',
        },
        {
          text: 'Stay Reyes\'s asset. Give her Kroll\'s offer, word for word.',
          tag: '[Bureau]',
          if: { flag: 'fac.bureau.informant' },
          effects: [
            { faction: 'fac.bureau', add: 15 },
            { faction: 'fac.aperture', add: -25 },
            { faction: 'fac.loft', add: -4 },
            { flag: 'fac.bureau.informant_secret' },
            { flag: 'a2.spine', set: 'bureau' },
          ],
          goto: 'out_bureau',
        },
        {
          text: 'Take the deal — and double-cross her to shield the Loft.',
          tag: '[Double agent]',
          effects: [
            { flag: 'a2.double_agent' },
            { faction: 'fac.bureau', add: 10 },
            { faction: 'fac.loft', add: 10 },
            { flag: 'a2.spine', set: 'double' },
            { var: 'end.doubles', add: 1 },
          ],
          goto: 'out_double',
        },
        {
          text: 'Refuse both. Go clean. Commit to Priya and the straight world.',
          tag: '[Halcyon]',
          effects: [
            { faction: 'fac.halcyon', add: 25 },
            { flag: 'a2.went_straight' },
            { flag: 'a2.spine', set: 'halcyon' },
          ],
          goto: 'out_halcyon',
        },
        {
          text: 'Refuse both. Bring it to Corvid. Go dark with the scene.',
          tag: '[The Loft]',
          req: { faction: 'fac.loft', gte: 20 },
          reqText: 'Requires: the Loft trusts you (rep 20+)',
          effects: [
            { faction: 'fac.loft', add: 20 },
            { faction: 'fac.bureau', add: -10 },
            { faction: 'fac.aperture', add: -10 },
            { flag: 'a2.spine', set: 'loft' },
          ],
          goto: 'out_loft',
        },
      ],
    },
    recon_brief: {
      speaker: 'kroll',
      text: '"Just a look," Kroll reminds you, warm as ever. "Map the staging server, leave me a quiet little beacon, and come home. No alarms. No heroics. This is the easy part, and the easy part is where I learn whether the hard part is worth offering you." The Meridian tower waits, all glass and old money and bad security.',
      mission: {
        mission: 'a2_meridian_recon',
        success: 'recon_clean',
        fail: 'recon_sloppy',
        auto: { skill: 'intrusion', dc: 15 },
      },
    },
    recon_clean: {
      speaker: 'narrator',
      text: 'You map the bank\'s soft underbelly and leave a beacon so quiet it might as well be a held breath. In and out, no ripples. Kroll\'s acknowledgement is a single word — "Lovely." — and you feel the hard part of your life shift a notch closer, exactly as she intended.',
      next: 'done_hinge',
    },
    recon_sloppy: {
      speaker: 'narrator',
      text: [
        'You get the map and the beacon, but you leave scuff marks — a triggered log here, a re-scan there, the kind of noise that a competent security team will find on a Monday and start pulling a thread on.',
        'Kroll doesn\'t scold you. She just says "We\'ll clean that up," in a way that means someone will, and it will be added to your tab. The trace will remember this the next time you come for Meridian.',
      ],
      // Sloppy recon (mission lost / auto fail) is a lasting mark: a2.recon_sloppy is read by the Act III
      // heist and the Act IV exchange — and sometimes Meridian's security team starts pulling the thread now.
      effects: [{ stat: 'heat', add: 15 }, { flag: 'a2.recon_sloppy' }, { chance: 0.35, then: [{ complication: 'hack', tier: 2 }] }],
      next: 'done_hinge',
    },
    out_bureau: {
      speaker: 'reyes',
      text: [
        '"Good," Reyes says, and doesn\'t smile. "Not on your friends. On the ones eating your friends. You give me Aperture, brick by brick, and I keep you and yours out of the fire." She pockets the folder. "And you understand the terms. Corvid never knows. Switch never knows. The day the scene learns you sat in this booth is the day I can\'t protect you from them — which will be, by then, the least of your problems."',
        { if: { flag: 'a2.bank_bloom' }, text: '"And that Meridian fraud flag with your reference number on it?" She taps the folder. "It stays in here. As long as you\'re useful, it\'s a bookmark. The day you stop, it\'s a chapter." She lets that sit.' },
        'You shake her hand. It\'s dry and firm and exactly as long as it should be. You wonder where you learned to notice that.',
      ],
      effects: [{ log: 'You flipped for the Bureau at the hinge. Bureau spine — and a secret that could get you killed.', kind: 'story' }],
      next: 'done_hinge',
    },
    out_double: {
      speaker: 'narrator',
      text: [
        'You take Reyes\'s deal with a straight face and a crossed heart, and you already know you\'re going to feed her a version of the truth that protects the people she wants you to burn. Two masters, one you. The highest wire in the whole circus, and no net under it but your own nerve.',
        'It is the most dangerous thing you\'ve ever agreed to, and some ugly, honest part of you is thrilled by it. That part is going to be a problem.',
      ],
      effects: [{ log: 'You\'re playing the Bureau both ways to save the Loft. A very long con just began.', kind: 'story' }],
      next: 'done_hinge',
    },
    out_halcyon: {
      speaker: 'narrator',
      text: [
        'You tell Kroll no, and you tell Reyes no, and you walk out of both rooms into the daylight of the legit world, where the worst thing that happens to you is a bad performance review. Priya nearly cries when you tell her. "The boring good life," she says. "You have no idea how rare it is that somebody gets to choose it."',
        { if: { flag: 'a2.dee_temp_gig' }, text: 'Dee, who once handed you a temp gig after you flubbed the interview, sends a fruit basket with a laminated card: "WELCOME TO THE LIGHT SIDE. WE HAVE DENTAL."' },
        { if: { not: { flag: 'fac.halcyon.employed' } }, text: 'You don\'t even have the badge yet. You have Priya\'s phone number and a résumé you rewrite four times. It feels like the bravest thing you\'ve done all year.' },
        'The conspiracy will still hunt you — but now as a loose end, from the inside, in meetings with good coffee. You\'ve chosen the daylight. You just haven\'t noticed yet that the daylight has cameras.',
      ],
      effects: [{ log: 'You went straight — Halcyon spine. Priya\'s relieved. The machine still knows your name.', kind: 'story' }],
      next: 'done_hinge',
    },
    out_loft: {
      speaker: 'corvid',
      text: [
        'You bring both offers to Corvid and lay them on the table like dead things. She reads them without touching them. "So the water\'s at the door," she says. "Good that you came to me before it was at the ceiling." She looks at you a long time. "You\'re one of us now. The real way, not the rep-points way. That means we go quiet, and we go careful, and we don\'t sell the building no matter how big the number gets."',
        { if: { flag: 'a2.informant_is_you_rumor' }, text: '"And I know what the board says about you since the wall had holes." She doesn\'t soften it. "Bringing me both offers instead of taking one is the first real answer anybody\'s given to that rumor. I\'ll make sure it gets heard. Quietly. That\'s the only way anything gets heard now."' },
        'You go dark with the scene. It pays worse than everything you just turned down. It is, you\'re fairly sure, the right answer. Corvid starts saving you a seat.',
      ],
      effects: [{ log: 'You brought it to Corvid and went dark with the Loft. The scene spine — the purest road, and the poorest.', kind: 'story' }],
      next: 'done_hinge',
    },
    done_hinge: {
      speaker: 'narrator',
      text: 'The pieces are set. Whoever you are now, you\'re that person for the duration. Act III is the city finding out which one it got.',
      effects: [
        { flag: 'a2.hinge_done' },
        { var: 'w.exposure', add: 1 },
      ],
    },
  },
}

// Safety: if the hinge somehow closes without a spine (e.g. an expired thread), stamp the dominant
// faction so Act III always has a spine to branch on (bible §6.B fallback).
const spineFallback: TriggerDef = {
  id: 'trig_spine_fallback',
  once: true,
  priority: 60,
  when: { all: [{ flag: 'a2.hinge_done' }, { not: { flag: 'a2.spine' } }] },
  effects: [
    { flag: 'a2.spine', set: 'halcyon' },
    { if: { faction: 'fac.loft', gte: 20 }, then: [{ flag: 'a2.spine', set: 'loft' }] },
    { if: { faction: 'fac.aperture', gte: 20 }, then: [{ flag: 'a2.spine', set: 'aperture' }] },
    { if: { faction: 'fac.bureau', gte: 20 }, then: [{ flag: 'a2.spine', set: 'bureau' }] },
  ],
}

/** Two offers in one week: Kroll's page... */
const krollAsk: SceneDef = {
  id: 'a2_hinge_kroll',
  channel: 'chat',
  title: 'V. Kroll',
  from: 'kroll',
  pause: false,
  start: 'msg',
  nodes: {
    msg: {
      speaker: 'kroll',
      text: [
        { if: { flag: 'a2.refused_kroll' }, text: 'you told me no once. I respected it. I\'m back with something smaller, because I\'m patient and you\'re worth it.', else: 'hello again. I have something small. small things are how large things get started.' },
        'Meridian Trust is rolling out online banking. I\'d like a look at it before anyone else does. Just a look. We\'ll talk details over something that isn\'t salmon.',
      ],
      choices: [
        { text: '"Just a look?"', goto: 'look' },
        { text: '"I\'ll hear you out."', goto: 'hear' },
      ],
    },
    look: { speaker: 'kroll', text: 'just a look. I never lie to you, dear. it\'s the one luxury I allow myself.' },
    hear: { speaker: 'kroll', text: 'that\'s all I ever ask. soon.' },
  },
}

/** ...and Reyes's note, two days later. */
const reyesNote: SceneDef = {
  id: 'a2_hinge_reyes',
  channel: 'mail',
  title: '(no subject)',
  from: 'D. Reyes',
  pause: true,
  start: 'msg',
  nodes: {
    msg: {
      speaker: 'D. Reyes',
      text: [
        { if: { flag: 'fac.bureau.informant' }, text: 'Our usual Tuesday is moving. Something\'s about to land on your desk from Millgate, and I want to be sitting across from you when it does.', else: 'You don\'t know me, except you do: sensible shoes, the raid, the notebook. I know who bought you dinner in the Meridian tower. I know what she\'s about to ask you.' },
        'There\'s a diner on the far side of the Sound where nobody knows my face. Thursday, 7 a.m. Come alone. Come hungry — they do an honest omelet, which in this city is rarer than it should be.',
        '— D.R.',
        'P.S. Delete this. I know you won\'t. Nobody ever does.',
      ],
    },
  },
}

const quest: QuestDef = {
  id: 'main_a2_q7_meridian_test',
  title: 'The Meridian Test',
  kind: 'main',
  act: 2,
  summary:
    'Kroll wants a dry run on Meridian Trust. Reyes offers a way out. Whatever you choose here becomes the spine of Act III — Aperture, Bureau, double agent, Halcyon, or the Loft.',
  // Started by main_a2_q6 on completion; the two offers land ~3 weeks later, never before day 1100.
  priority: 30,
  rewards: 'Your Act III spine · maybe a recording of Kroll',
  start: 'wait',
  stages: {
    wait: {
      text: 'Two offers are circling — one from Kroll, one from Reyes. They\'ll land in the same week, because in this city nothing is a coincidence.',
      hint: 'A few weeks. Cryptography helps you wire yourself first; Loft rep 20+ opens the scene\'s road.',
      onEnter: [{ scene: 'a2_hinge_kroll', delayHours: 18 * 24 }, { scene: 'a2_hinge_reyes', delayHours: 20 * 24 }],
      objectives: [
        { id: 'offers', text: 'Hear both offers', when: { seen: 'a2_hinge_reyes' }, hint: 'Kroll pages first; Reyes writes two days later.' },
        { id: 'date', text: 'Let the season turn', when: { day: true, gte: 1100 }, hint: 'The hinge never lands before late 2004.' },
      ],
      next: 'hinge',
    },
    hinge: {
      text: 'The hinge of the whole story: Kroll\'s recon, Reyes\'s deal, and the version of yourself you\'re about to become. Choose your spine.',
      hint: 'The dialog auto-pauses. Wiring yourself stacks with any road. There\'s a Loft road if the scene trusts you (rep 20+).',
      onEnter: [{ scene: 'a2_hinge', delayHours: 36 }],
      objectives: [
        { id: 'choose', text: 'Answer the Meridian test', when: { flag: 'a2.hinge_done' }, hint: 'Open the dialog and choose your Act III spine.' },
      ],
    },
  },
}

export default defineContent({
  quests: [quest],
  scenes: [scene, krollAsk, reyesNote],
  triggers: [spineFallback],
})
