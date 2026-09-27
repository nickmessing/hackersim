/**
 * COMPLICATIONS — the marks a bad stretch leaves on you.
 *
 * TraitDefs here are SCARS (`scar: true`) — permanent, earned through play, never offered at
 * character creation. Some are pure penalties, some are double-edged, and a few are genuinely
 * good: you can come out of a bad stretch harder than you went in. Each scar also sets a readable
 * `cx_life.scar.*` flag so later scenes in this pack can react to who you have become.
 *
 * The BuffDefs are the temporary, multi-week debuffs (and a few double-edged or kind states)
 * that complication choices hand out; they are applied inline with `{ buff }` effects, so they
 * are exported as plain consts, not registered.
 */
import { defineContent } from '@/engine/registry'
import type { BuffDef, TraitDef } from '@/engine/types'

// ── Scars (permanent traits) ────────────────────────────────────────────────

const traits: TraitDef[] = [
  // — Bad —
  {
    id: 'cx_life_carpal',
    name: 'Wrist Brace',
    desc: 'Years at the keyboard came due. The brace lives on your right wrist now, and some mornings the hands just say no.',
    scar: true,
    bad: true,
    mods: [
      { key: 'hack.speed', mult: 0.92 },
      { key: 'freelance.speed', mult: 0.92 },
      { key: 'xp.programming', mult: 0.94 },
    ],
    flags: ['cx_life.scar.carpal'],
  },
  {
    id: 'cx_life_insomnia',
    name: 'Chronic Insomnia',
    desc: 'The off switch broke somewhere back there. You lie awake doing sums about your life.',
    scar: true,
    bad: true,
    mods: [{ key: 'energy.regen', mult: 0.9 }],
    flags: ['cx_life.scar.insomnia'],
  },
  {
    id: 'cx_life_known_liar',
    name: 'Known to Bend the Truth',
    desc: 'Word got around that your story changes. People double-check you now — and you got very good at stories that survive a double-check.',
    scar: true,
    bad: true,
    mods: [
      { key: 'check.social', add: -2 },
      { key: 'check.opsec', add: 1 },
    ],
    flags: ['cx_life.scar.liar'],
  },
  {
    id: 'cx_life_burned_bridge',
    name: "Words You Can't Take Back",
    desc: 'Somebody who loved you heard exactly what you think of them. A door in this city is closed for good, and you feel the draft where it used to be.',
    scar: true,
    bad: true,
    mods: [{ key: 'mood.daily', add: -0.3 }],
    flags: ['cx_life.scar.bridge'],
  },
  {
    id: 'cx_life_blacklisted',
    name: 'Quietly Blacklisted',
    desc: 'A bad word in the right ear. The good offers stopped coming; the ones that do come, come low.',
    scar: true,
    bad: true,
    mods: [{ key: 'pay', mult: 0.9 }],
    flags: ['cx_life.scar.blacklisted'],
  },
  {
    id: 'cx_life_bad_credit',
    name: 'Bad Credit',
    desc: 'Somewhere a computer decided you are a risk. Deposits are bigger, fees are higher, and every form asks one more question.',
    scar: true,
    bad: true,
    mods: [{ key: 'expenses', mult: 1.04 }],
    flags: ['cx_life.scar.bad_credit'],
  },
  {
    id: 'cx_life_bad_tooth',
    name: 'The Tooth',
    desc: 'You let it go too long. It is fixed, mostly, but it throbs when the weather turns and when you are scared, which is often.',
    scar: true,
    bad: true,
    mods: [
      { key: 'stress.gain', mult: 1.04 },
      { key: 'mood.daily', add: -0.1 },
    ],
    flags: ['cx_life.scar.tooth'],
  },
  {
    id: 'cx_life_fragile',
    name: 'Running on Fumes',
    desc: 'Two burnouts deep. The tank never quite fills anymore, and you can feel the edge coming from further away.',
    scar: true,
    bad: true,
    mods: [
      { key: 'stress.gain', mult: 1.08 },
      { key: 'efficiency', mult: 0.97 },
    ],
    flags: ['cx_life.scar.fumes'],
  },
  // — Double-edged —
  {
    id: 'cx_life_straight_shooter',
    name: 'Straight Shooter',
    desc: 'You told the truth when a lie was easier, and it stuck. People believe you now. You have also forgotten how to lie with a straight face.',
    scar: true,
    mods: [
      { key: 'check.social', add: 1 },
      { key: 'check.opsec', add: -1 },
    ],
    flags: ['cx_life.scar.straight'],
  },
  {
    id: 'cx_life_good_habits',
    name: 'Stretch Breaks',
    desc: 'The physio scared you straight. Every fifty minutes you stand up, roll your wrists and look at something far away. Slower. Steadier.',
    scar: true,
    mods: [
      { key: 'energy.drain', mult: 0.95 },
      { key: 'hack.speed', mult: 0.97 },
      { key: 'health.daily', add: 0.05 },
    ],
    flags: ['cx_life.scar.habits'],
  },
  {
    id: 'cx_life_freelancer_pride',
    name: 'Never Again a Boss',
    desc: 'You got walked out of a building with your stuff in a box. Now you price your own time — and you bristle at anyone who signs your checks.',
    scar: true,
    mods: [
      { key: 'freelance.pay', mult: 1.08 },
      { key: 'jobXp', mult: 0.92 },
    ],
    flags: ['cx_life.scar.freelancer'],
  },
  // — Good —
  {
    id: 'cx_life_thick_skin',
    name: 'Weathered',
    desc: 'They said everything they could think of about you, and you are still here. Less of it lands now.',
    scar: true,
    mods: [
      { key: 'stress.gain', mult: 0.93 },
      { key: 'check.social', add: 1 },
    ],
    flags: ['cx_life.scar.weathered'],
  },
  {
    id: 'cx_life_street_smart',
    name: 'Once Bitten',
    desc: 'You got taken once and swore never again. Now you read the fine print, and the room, a beat faster than everyone else.',
    scar: true,
    mods: [
      { key: 'check.business', add: 1 },
      { key: 'check.opsec', add: 1 },
    ],
    flags: ['cx_life.scar.bitten'],
  },
  {
    id: 'cx_life_iron_nerves',
    name: 'Iron Nerves',
    desc: 'You sat across a table from people who could end you, and your hands did not shake. Not much does now.',
    scar: true,
    mods: [
      { key: 'stress.gain', mult: 0.9 },
      { key: 'check.business', add: 1 },
    ],
    flags: ['cx_life.scar.nerves'],
  },
  {
    id: 'cx_life_sleep_ritual',
    name: 'Lights Out at Midnight',
    desc: 'You fought the 4 a.m. ceiling and won with boring discipline: same time, dark room, no screens. It is the least hacker thing about you, and it works.',
    scar: true,
    mods: [{ key: 'energy.regen', mult: 1.06 }],
    flags: ['cx_life.scar.ritual'],
  },
  {
    id: 'cx_life_hard_way',
    name: 'Learned It the Hard Way',
    desc: 'You have read every line of every bill since the bad year. Money does not surprise you anymore.',
    scar: true,
    mods: [
      { key: 'xp.business', mult: 1.1 },
      { key: 'expenses', mult: 0.98 },
    ],
    flags: ['cx_life.scar.hard_way'],
  },
]

// ── Multi-week debuffs (and a few double-edged or kind states) ──────────────

export const CX_FLARE: BuffDef = {
  id: 'cx_life_flare',
  name: 'RSI Flare-Up',
  desc: 'Wrists on fire. Every keystroke files a grievance.',
  days: 21,
  bad: true,
  mods: [
    { key: 'hack.speed', mult: 0.8 },
    { key: 'freelance.speed', mult: 0.8 },
    { key: 'xp.programming', mult: 0.9 },
  ],
}

export const CX_RELAPSE: BuffDef = {
  id: 'cx_life_relapse',
  name: 'Burnout Relapse',
  desc: 'You went back to the well too soon and it was dry. Everything is underwater again.',
  days: 21,
  bad: true,
  mods: [
    { key: 'efficiency', mult: 0.8 },
    { key: 'stress.gain', mult: 1.15 },
  ],
}

export const CX_SLEEPLESS: BuffDef = {
  id: 'cx_life_sleepless',
  name: 'Sleepless Stretch',
  desc: 'Three hours a night, if you are lucky. The days have a smeared, underwater quality.',
  days: 21,
  bad: true,
  mods: [
    { key: 'energy.regen', mult: 0.85 },
    { key: 'efficiency', mult: 0.9 },
  ],
}

export const CX_SHAKEN: BuffDef = {
  id: 'cx_life_shaken',
  name: 'Rattled',
  desc: 'It keeps replaying. You are half a step behind everything.',
  days: 14,
  bad: true,
  mods: [
    { key: 'mood.daily', add: -0.6 },
    { key: 'check.all', add: -1 },
  ],
}

export const CX_ON_EDGE: BuffDef = {
  id: 'cx_life_on_edge',
  name: 'On Edge',
  desc: 'Your heart keeps trying to leave without you. You flinch at the phone.',
  days: 14,
  bad: true,
  mods: [
    { key: 'stress.gain', mult: 1.2 },
    { key: 'check.all', add: -1 },
  ],
}

export const CX_HEARTSORE: BuffDef = {
  id: 'cx_life_heartsore',
  name: 'Heartsore',
  desc: 'Someone you care about is not speaking to you, and the quiet has weight.',
  days: 21,
  bad: true,
  mods: [
    { key: 'mood.daily', add: -0.5 },
    { key: 'stress.relief', mult: 0.85 },
  ],
}

export const CX_PAYCUT: BuffDef = {
  id: 'cx_life_paycut',
  name: 'Demoted',
  desc: 'Smaller title, smaller check, same work. The new nameplate is a sticker over the old one.',
  days: 56,
  bad: true,
  mods: [
    { key: 'pay', mult: 0.85 },
    { key: 'jobXp', mult: 0.7 },
  ],
}

export const CX_PROBATION: BuffDef = {
  id: 'cx_life_probation',
  name: 'On Probation',
  desc: 'A formal warning sits in your file. Nobody is going to promote you until it ages out.',
  days: 28,
  bad: true,
  mods: [
    { key: 'jobXp', mult: 0.5 },
    { key: 'stress.gain', mult: 1.08 },
  ],
}

export const CX_NIGHTS: BuffDef = {
  id: 'cx_life_nights',
  name: 'Stuck on the Bad Shifts',
  desc: 'The worst hours, the worst desk, the worst tickets. Your manager calls it "coverage."',
  days: 28,
  bad: true,
  mods: [
    { key: 'energy.regen', mult: 0.9 },
    { key: 'stress.gain', mult: 1.12 },
  ],
}

export const CX_TOOTHACHE: BuffDef = {
  id: 'cx_life_toothache',
  name: 'Toothache',
  desc: 'A hot, dumb throb on the left side of your face. You chew on the right and think about nothing else.',
  days: 21,
  bad: true,
  mods: [
    { key: 'efficiency', mult: 0.88 },
    { key: 'mood.daily', add: -0.4 },
  ],
}

export const CX_SCRAPING: BuffDef = {
  id: 'cx_life_scraping',
  name: 'Scraping By',
  desc: 'Every dollar has a job before it arrives. You check the balance twice a day.',
  days: 28,
  bad: true,
  mods: [
    { key: 'stress.gain', mult: 1.1 },
    { key: 'mood.daily', add: -0.3 },
  ],
}

export const CX_LYING_LOW: BuffDef = {
  id: 'cx_life_lying_low',
  name: 'Lying Low',
  desc: 'Nothing off the books, nothing that leaves a mark. Boring on purpose. It works.',
  days: 21,
  mods: [
    { key: 'heat.decay', add: 0.6 },
    { key: 'hack.speed', mult: 0.85 },
    { key: 'freelance.speed', mult: 0.85 },
  ],
}

export const CX_PROVE: BuffDef = {
  id: 'cx_life_prove',
  name: 'Something to Prove',
  desc: 'They wrote you off. You are running on pure spite, and spite, it turns out, ships code.',
  days: 21,
  mods: [
    { key: 'xp.all', mult: 1.12 },
    { key: 'stress.gain', mult: 1.1 },
  ],
}

export const CX_MENDED: BuffDef = {
  id: 'cx_life_mended',
  name: 'Mended',
  desc: 'You fixed something that mattered more than any machine. It sits warm in your chest all week.',
  days: 14,
  mods: [
    { key: 'mood.daily', add: 0.5 },
    { key: 'stress.relief', mult: 1.15 },
  ],
}

export const CX_RESTING: BuffDef = {
  id: 'cx_life_resting',
  name: 'Doctor’s Orders',
  desc: 'Real rest, on purpose. Less gets done. More of you is left at the end of it.',
  days: 14,
  mods: [
    { key: 'efficiency', mult: 0.85 },
    { key: 'stress.relief', mult: 1.4 },
    { key: 'energy.regen', mult: 1.1 },
  ],
}

export default defineContent({ traits })
