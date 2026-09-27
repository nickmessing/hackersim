/**
 * PKG-04 — "What Followed You": the epilogue slides for the long tail of failed rolls (REDESIGN_V2
 * §D). Every ending in endings.ts appends `MARKS`, so a scar, a debt or a grudge earned on a fail
 * branch in Act III or Act IV is read back at the very end, whatever the ending family.
 *
 * Sources (all set in PKG-03 / PKG-04 fail branches):
 *   Act III — the tape (`pkg03_act3_on_the_tape`, `a3.tape_contained`), who pulled you out after
 *   Meridian (`a3.burned_protector`), the PARALLAX score, Kroll's file, the spurned mirror, the favor
 *   paid for Kim, the whisper about Mom (`a3.memory_*`).
 *   Act IV — the bad knee, the photograph, the Bonfire's blacklist and lawsuit, the half-truth told
 *   to Grace.
 *
 * Exports helpers only; every file under src/content is auto-discovered, so it also exports an
 * (empty) content pack.
 */
import { defineContent } from '@/engine/registry'
import type { EndingDef } from '@/engine/types'
import { all, flag, graceWithYou, not } from './shared'

type Slide = EndingDef['epilogues'][number]

const apertureGone = flag('w.aperture_state', 'destroyed')

export const MARKS: Slide[] = [
  // ── Act III ────────────────────────────────────────────────────────────────
  {
    if: all({ trait: 'pkg03_act3_on_the_tape' }, not(flag('a3.tape_contained'))),
    title: 'The Tape',
    text: 'An hour of you, talking freely, still sits in a federal evidence locker with a transcript clipped to the box and your handle highlighted in yellow by someone who used a ruler. It has never come up. Every few months, for the rest of your life, you will remember that it could.',
  },
  {
    if: flag('a3.tape_contained'),
    title: 'The Tape',
    text: 'Abigail Stroud kept the tape a tape. Her last invoice came with a note in fountain pen: "Stay boring." You have tried. The locker is still there. So is the tape. It just never became anything else, which is what you paid for, every week, for four months.',
  },
  {
    if: flag('a3.burned_protector', 'kroll'),
    title: 'Who Pulled You Out',
    text: [
      'After Meridian, Kroll made the lobby footage a maintenance glitch, and you have taken her calls ever since. Nobody ever called it a debt. That is what made it one.',
      { if: apertureGone, text: 'Aperture is gone now. The calls stopped. You still flinch when the phone rings at nine on a Sunday, which is when she liked to call.' },
    ],
  },
  {
    if: flag('a3.burned_protector', 'reyes'),
    title: 'Who Pulled You Out',
    text: 'After Meridian you walked into the federal building and asked for Reyes by name. It kept you out of a cell. It also kept you in a file under a heading Sodium Row never forgave, and kids who were not born when you started still know the word for what you did.',
  },
  {
    if: flag('a3.burned_protector', 'vale'),
    title: 'Who Pulled You Out',
    text: 'Halcyon\'s lawyers turned the Meridian night into an offsite with forty witnesses and a catering receipt. The courtesy-rate invoices came every week for five months. You kept the last one. It says THANK YOU FOR YOUR BUSINESS, which is the most honest thing Halcyon ever printed.',
  },
  {
    if: flag('a3.burned_protector', 'row'),
    title: 'Who Pulled You Out',
    text: 'After Meridian the Row hid you on a laundromat cot for a month, and forty people who had known you since you were eight told a man in a good coat they had never heard of you. You have spent every year since trying to be worth forty people\'s silence.',
  },
  {
    if: flag('a3.burned_protector', 'nobody'),
    title: 'Who Pulled You Out',
    text: 'Nobody pulled you out of Meridian. You went to ground alone and came up owing no one, and you have never quite managed to explain to anyone why that feels less like freedom than it should.',
  },
  {
    if: { trait: 'pkg03_act3_parallax_scored' },
    title: 'The Score',
    text: [
      'PARALLAX scored you the night you tripped its wall, and the score outlived the night. Insurers, landlords, a bank that declined you for a credit card with a very polite letter: they all read the same number.',
      { if: apertureGone, text: 'The machine is gone. The score was sold before it went. That is the thing about a number: it does not need anyone to believe in it anymore to keep working.' },
    ],
  },
  {
    if: { trait: 'pkg03_act3_krolls_file' },
    title: 'The File',
    text: [
      { if: apertureGone, text: 'Special Accounts\' file on you became a court exhibit when Aperture fell. Your photograph is in the public record now: you on Priya\'s stairs, folder under your arm, looking scared. It is a good photograph. You look very young.', else: 'Somewhere in Millgate there is still a file with your photograph in it: you on Priya\'s stairs, folder under your arm, looking scared. Once a year a copy arrives in your mail with no note, just to let you know it is being kept current.' },
    ],
  },
  {
    if: flag('a3.mirror_spurned'),
    title: 'The Mirror, Still',
    text: 'mirror never posted again after the retrospective. But every so often a contract you were about to bid on goes to someone else an hour before you get there, and the winning bid is always one dollar lower than yours. You have stopped taking it personally. You have not stopped noticing.',
  },
  {
    if: flag('a3.kim_favor_paid'),
    title: 'The Favor',
    text: 'You did Aperture one small favor to get a black sedan away from your sister\'s school. They never asked for a second one. They never had to; you both knew they could, and knowing was the leash.',
  },
  {
    if: flag('a3.memory_defended'),
    title: 'Her Name',
    text: 'The jar with Mom\'s photo taped to it is back by the Cathode register, where it belongs. Every year on her birthday somebody on the Row drops in a twenty and a note that says FOR THE RECEIPTS. Nobody knows who starts it. You know who starts it.',
  },
  {
    if: flag('a3.memory_let_burn'),
    title: 'Her Name',
    text: 'You let the whisper about Mom\'s fundraiser burn itself out, and it did, mostly. Some people on the Row still believe it. They are kind to you anyway, in the careful way people are kind to someone whose mother they think was a little bit of a liar. You let that happen too.',
  },
  {
    if: flag('a3.memory_hunted'),
    title: 'Her Name',
    text: 'The reputation outfit in Millgate that sold your mother\'s grief as a pressure point is a nail salon now. You walk past it sometimes. You enjoyed what you did to them, and you are still not sure what that makes you, and you have stopped asking the question out loud.',
  },

  // ── Act IV ─────────────────────────────────────────────────────────────────
  {
    if: { trait: 'pkg04_act4_bad_knee' },
    title: 'The Knee',
    text: 'Your left knee forecasts the fog better than the radio does. It came off the exchange fence wrong, a decade older than it thought it was, and it has been filing complaints ever since. You take the stairs slower now. You tell people it is a sports injury. It is, technically.',
  },
  {
    if: { trait: 'pkg04_act4_photographed' },
    title: 'The Photograph',
    text: 'Somebody still has the negative. You have never found out who, and the not-knowing has settled into you like a posture: the glance at parked cars, the check of the window across the street, the space just behind your own reflection in shop glass.',
  },
  {
    if: { trait: 'pkg04_act4_marked_traitor' },
    title: 'The Blacklist',
    text: [
      'Your handle is on every blacklist from here to Ridgeport, a ban reason beside it in small letters: FIRST FIRE. Kids who were not born when you started learn it as a warning before they learn it as a name.',
      { if: flag('a4.bonfire_confessed'), text: 'Three old handles still send you a message every New Year\'s Eve. The same two words, every year: "at least." You keep all of them.' },
    ],
  },
  {
    if: flag('a4.bonfire_deflected'),
    title: 'The Ghost You Blamed',
    text: 'The scene still blames a dead handle for the first fire: an account that stopped logging in years ago and never got to answer back. CaptainCarrierWave never posted again. You taught him to look, and then you taught him to look away, and of everything you burned, that is the one you cannot stop smelling.',
  },
  {
    if: flag('a4.bonfire_sued'),
    title: 'Coastline Mutual v. Doe 1',
    text: [
      { if: flag('a4.suit_dropped'), text: 'The machine\'s insurers sued you, and then read your discovery request, and then quietly decided you were a cost of doing business. The dismissal is framed in your bathroom, where it belongs.' },
      { if: flag('a4.suit_settled'), text: 'You paid the machine\'s insurers twenty-five thousand dollars and signed a promise never to describe a building that was on fire. You have kept the promise. You have described it in a great many other words.' },
      { if: flag('a4.suit_fought'), text: 'You fought the machine\'s insurers invoice by invoice until they got bored. It took five months. Your lawyer sends you a card every Christmas. It is the most expensive friendship you have.' },
      { if: flag('a4.suit_lost'), text: 'The machine burned. Its insurers garnished you for a year anyway. It turns out you can sue the person who lit a fire, and it turns out the person who lit it pays, in small regular amounts, like weather.' },
    ],
  },
  {
    if: all(flag('a4.grace_half_truth'), graceWithYou),
    title: 'Most of the Truth',
    text: 'You told Grace most of it, once, at the Cathode at 3 a.m., and she said she would take most of it, and she did. She has never asked again. Some nights, when she is asleep and you are not, you rehearse the rest of it to the ceiling. The ceiling is a very good listener. It is not her.',
  },
]

export default defineContent({})
