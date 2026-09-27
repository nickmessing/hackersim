/**
 * PKG-05 — the Loft's repeatable reputation sources and rank perks (bible §3 F1, §3 "Repeatable
 * rep sources": "Loft +1–3 per sub.loft board contract completed (procedural, board 'warez' +
 * Loft gate)").
 *
 * The Loft's members-only board (`'warez'`, gated on Loft Known) posts underground leads. Each one
 * completed pays a little Loft reputation, so the Act II "one faction ≥ 50" gate never soft-locks
 * for a scene build. Leaking corporate data to the scene (never selling it) is Loft-positive and
 * Aperture-negative — the rivalry, authored as explicit rep deltas.
 *
 * Rank perks (bible §3 F1): Trusted (50) — "we don't rat" cover, a heat-decay/stress buff refreshed
 * while you hold the tier; Inner (80) — the safehouse (halved hacking heat, +2 rolls, the good
 * tools), refreshed while you hold the tier. Both are engine buffs, kept topped up by a slow
 * repeatable trigger rather than a one-shot so they persist as a standing of the tier.
 *
 * HARD RULE: every "hack" here is invented flavor — dice and texture, never technique.
 */
import { defineContent } from '@/engine/registry'
import { LOFT, SAFEHOUSE_BUFF, onTheBoard } from './common'

/** Leads post only while the members board is open to you and still running. */
const loftGate = onTheBoard

export default defineContent({
  contractTemplates: [
    {
      id: 'loft_favor',
      kind: 'hack',
      tier: 1,
      titles: ['Scene favor: {target}', 'Loft mutual aid — {target}', 'Quiet one for the board: {target}'],
      descs: [
        'A member is in a small jam with {target} and the board passed the hat for a favor instead of cash. Low stakes, high goodwill. This is what the Loft is for.',
        'Not a job, a favor. {target} needs a light touch and a closed mouth, and the board vouched for you to do it. Do it clean and the couch remembers.',
        'Somebody on the board is underwater with {target}. Bail them out, take nothing but the nod you get afterward. That nod is the whole economy in here.',
      ],
      targets: ['a member\'s landlord portal', 'a locked-out old account', 'a friend\'s bricked release', 'a member\'s stuck upload'],
      clients: ['a Loft regular', 'the board, collectively', 'a member down on their luck', 'byteme (again)'],
      skills: ['intrusion', 'systems'],
      dc: [10, 13],
      hours: [6, 12],
      pay: [40, 120],
      heat: [1, 3],
      cred: [0.5, 1.2],
      rep: { 'fac.loft': 1 },
      available: loftGate,
      weight: 2,
    },
    {
      id: 'loft_release_cover',
      kind: 'hack',
      tier: 2,
      titles: ['Cover a release: {target}', 'Front the crew on {target}', 'Take the heat for {target}'],
      descs: [
        'A courier crew is shipping {target} and needs a clean front so no real handle ends up on the release notes. You be the name that isn\'t a name. The scene splits the credit; nobody splits the risk onto a kid.',
        'The board wants {target} out before a rival group beats them to it, fronted by the co-op handle that belongs to nobody. Fast, quiet, and the whole scene owes you a round.',
        'Somebody has to sign for {target} so that nobody has to. That\'s the job: be the throwaway name, protect the real ones. It\'s the oldest work in here.',
      ],
      targets: ['a hyped strategy game', 'a boxed RPG', 'an office suite', 'a demo-scene compilation'],
      clients: ['a courier crew', 'the co-op board', 'a warez release group', 'the whole scene'],
      skills: ['programming', 'opsec'],
      dc: [15, 18],
      hours: [16, 30],
      pay: [300, 700],
      heat: [4, 7],
      cred: [1.6, 2.6],
      rep: { 'fac.loft': 2 },
      available: loftGate,
      weight: 2,
    },
    {
      id: 'loft_scrub_trail',
      kind: 'hack',
      tier: 2,
      titles: ['Scrub a member\'s trail: {target}', 'Cool off {target}', 'Pull {target} out of the fire'],
      descs: [
        'A Loft member left prints all over {target} and the heat is climbing. Get in, tidy up after them, get out — the "we don\'t rat" rule works both ways, and this is the other way. Protecting members is Loft-positive by definition.',
        '{target} has a member\'s handle sitting in a log where it shouldn\'t be. Make it not. This is mutual aid with a keyboard, and the board notices who shows up for it.',
        'Somebody careless brushed against {target} and now they\'re scared. Reassure them by making the problem quietly disappear. That\'s what standing means in here.',
      ],
      targets: ['a corp\'s abuse desk', 'an ISP\'s complaint queue', 'a bulletin board\'s watch list', 'a store\'s fraud flag'],
      clients: ['a spooked member', 'a Loft regular in over their head', 'the board, quietly', 'a courier who slipped'],
      skills: ['opsec', 'systems'],
      dc: [15, 18],
      hours: [14, 26],
      pay: [250, 650],
      heat: [3, 6],
      cred: [1.4, 2.4],
      rep: { 'fac.loft': 2 },
      available: loftGate,
      weight: 2,
    },
    {
      id: 'loft_leak_not_sell',
      kind: 'hack',
      tier: 3,
      titles: ['Leak it, don\'t sell it: {target}', 'Give {target} to the scene', 'Robin Hood {target}'],
      descs: [
        'You could sell what\'s inside {target}. Instead the board wants it given away — posted free, credited to nobody, useful to everybody. Leaking (not selling) is the line that separates the Loft from Aperture, and the whole scene is watching which side you land on.',
        '{target} is sitting on data that ought to be everyone\'s. Take it and give it away. It pays in reputation, not dollars, and it costs you with the people who\'d rather have sold it.',
        'A corp is hoarding something the Row could use. The Loft doesn\'t sell — it leaks. Free {target}, sign it nothing, and let the scene remember who did it for free.',
      ],
      targets: ['a data broker\'s price list', 'a landlord network\'s tenant files', 'a collections firm\'s scripts', 'an insurer\'s risk model'],
      clients: ['the Loft board', 'an anonymous tipster', 'Corvid, indirectly', 'the commons'],
      skills: ['intrusion', 'cryptography'],
      dc: [18, 21],
      hours: [24, 44],
      pay: [400, 1100],
      heat: [7, 11],
      cred: [2.4, 3.8],
      rep: { 'fac.loft': 3, 'fac.aperture': -1 },
      available: loftGate,
      weight: 1,
    },
  ],

  triggers: [
    // Trusted (50): "we don't rat" cover — the scene helps you cool off and carries the stress.
    {
      id: 'trig_loft_trusted_perk',
      when: { all: [{ faction: LOFT, gte: 50 }, { faction: LOFT, lte: 79 }] },
      once: false,
      cooldownDays: 20,
      effects: [
        {
          buff: {
            id: 'loft_cover',
            name: 'We Don\'t Rat',
            desc: 'The scene watches your back: heat cools faster and the stress of the life sits a little lighter. A standing of being Trusted by the Loft.',
            days: 30,
            mods: [
              { key: 'heat.decay', add: 0.3 },
              { key: 'stress.relief', mult: 1.1 },
            ],
          },
        },
      ],
    },
    // Inner (80): the safehouse — the room above the pager shop, the good tools, halved heat.
    {
      id: 'trig_loft_inner_safehouse',
      when: { faction: LOFT, gte: 80 },
      once: false,
      cooldownDays: 40,
      effects: [{ removeBuff: 'loft_cover' }, { buff: SAFEHOUSE_BUFF }],
    },
  ],
})
