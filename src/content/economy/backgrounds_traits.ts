import { defineContent } from '@/engine/registry'

/**
 * ECON — Character-creation backgrounds and traits. Ids are fixed (other packages branch on them
 * with `{ background: 'tinkerer' }` / `{ trait: 'empath' }`). Each background grants starting
 * skill points, seed money, and a `bg.<id>` flag; pick two traits, each a small bundle of mods
 * that shapes how the whole run plays. Numbers per CONTENT_GUIDE §6.
 */
export default defineContent({
  backgrounds: [
    {
      id: 'tinkerer',
      name: 'Basement Tinkerer',
      desc: 'You grew up with a soldering iron and a milk crate of dead electronics, resurrecting things nobody else could. Hardware is your mother tongue.',
      skills: { hardware: 8, systems: 4 },
      money: 250,
      flags: ['bg.tinkerer'],
    },
    {
      id: 'mathlete',
      name: 'Math Olympiad',
      desc: 'Trophies, proofs, and a brain that treats an unsolved problem as a personal insult. Ciphers and code come easy; small talk, less so.',
      skills: { cryptography: 8, programming: 5 },
      money: 150,
      flags: ['bg.mathlete'],
    },
    {
      id: 'class_clown',
      name: 'Class Clown',
      desc: 'You talked your way out of every detention and into every party. You read a room instantly and you have never met a rule you couldn\'t charm.',
      skills: { social: 10, business: 2 },
      money: 200,
      flags: ['bg.class_clown'],
    },
    {
      id: 'latchkey',
      name: 'Latchkey Kid',
      desc: 'Home alone since you were small, you learned to cover your tracks, keep your business quiet, and slip through systems that assumed someone was watching. Nobody was.',
      skills: { opsec: 6, intrusion: 4 },
      money: 300,
      flags: ['bg.latchkey'],
    },
    {
      id: 'arcade_rat',
      name: 'Arcade Rat',
      desc: 'You practically lived on Sodium Row, memorizing patterns, trading tokens, and figuring out which machines could be talked into a free game. Quick hands, quicker reflexes.',
      skills: { networking: 5, intrusion: 5, fitness: 2 },
      money: 120,
      flags: ['bg.arcade_rat'],
    },
  ],
  traits: [
    {
      id: 'night_owl',
      name: 'Night Owl',
      desc: 'The world makes sense after midnight. You do your best work when everyone else is asleep — and pay for it a little when the sun comes up.',
      mods: [
        { key: 'hack.speed', mult: 1.12 },
        { key: 'freelance.speed', mult: 1.08 },
        { key: 'energy.regen', mult: 0.96 },
      ],
    },
    {
      id: 'caffeine_fiend',
      name: 'Caffeine Fiend',
      desc: 'You run on coffee and spite. Everything gets done faster; you just vibrate a little while it happens.',
      mods: [
        { key: 'efficiency', mult: 1.06 },
        { key: 'stress.gain', mult: 1.1 },
      ],
    },
    {
      id: 'empath',
      name: 'Empath',
      desc: 'You feel the room before anyone speaks. People trust you, and their trust doesn\'t weigh on you the way it weighs on others.',
      mods: [
        { key: 'check.social', add: 1 },
        { key: 'stress.relief', mult: 1.1 },
        { key: 'mood.daily', add: 0.3 },
      ],
    },
    {
      id: 'paranoid',
      name: 'Paranoid',
      desc: "They're not out to get you, but you cover your tracks as if they are — which keeps your heat down and your nerves shredded.",
      mods: [
        { key: 'heat.decay', add: 0.16 },
        { key: 'trace', mult: 1.15 },
        { key: 'stress.gain', mult: 1.12 },
      ],
    },
    {
      id: 'silver_tongue',
      name: 'Silver Tongue',
      desc: 'You could sell sand in a desert and a warranty on the sand. Words open doors that locks won\'t.',
      mods: [{ key: 'check.social', add: 2 }],
    },
    {
      id: 'bookworm',
      name: 'Bookworm',
      desc: 'You learn from the manual, cover to cover, while everyone else guesses. Studying anything comes faster — talking to people, not so much.',
      mods: [
        { key: 'xp.all', mult: 1.12 },
        { key: 'check.social', add: -1 },
      ],
    },
    {
      id: 'gym_rat',
      name: 'Gym Rat',
      desc: 'A body that can survive the career. You recover fast, you stay healthy, and you actually enjoy the part where you stand up.',
      mods: [
        { key: 'xp.fitness', mult: 1.25 },
        { key: 'health.daily', add: 0.2 },
        { key: 'energy.drain', mult: 0.96 },
      ],
    },
    {
      id: 'hothead',
      name: 'Hothead',
      desc: 'You go in hard and fast and you win a lot of rolls on nerve alone — right up until your temper picks a fight your mouth can\'t finish.',
      mods: [
        { key: 'hack.roll', add: 1 },
        { key: 'stress.gain', mult: 1.1 },
        { key: 'check.social', add: -1 },
      ],
    },
    {
      id: 'iron_stomach',
      name: 'Iron Stomach',
      desc: 'Ramen, gas-station coffee, three-day-old pizza — it all runs the same engine. You live cheap and it never seems to hurt you.',
      mods: [
        { key: 'expenses', mult: 0.9 },
        { key: 'health.daily', add: 0.1 },
      ],
    },
    {
      id: 'glass_cannon',
      name: 'Glass Cannon',
      desc: 'You burn white-hot and get more done than anyone — as long as nothing knocks you over, because you break easy and mend slow.',
      mods: [
        { key: 'efficiency', mult: 1.1 },
        { key: 'health.daily', add: -0.15 },
      ],
    },
  ],
})
