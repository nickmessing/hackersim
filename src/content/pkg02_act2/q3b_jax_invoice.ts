/**
 * PKG-02 — a2_jax_invoice: the bill for a blown cover (main_a2_q3 CP-B2 C fail, either skill).
 *
 * The buyer you tried to fool doesn't call the police. He calls collectors. Five days after the
 * 3 a.m. booth, "Tallow & Keel Recovery" writes to you as Jax's "guarantor of record" — because your
 * hands were on the fake. How you answer is a small fork with a long tail:
 *
 *  - pay it outright           → a2.jax_debt_settled (money)
 *  - a payment plan            → a2.jax_debt_shared + a 180-day restitution obligation
 *  - call Kroll (if a client)  → a2.kroll_paid_jax_debt (+ enclosure; Tallow & Keel are hers too)
 *  - vanish ([OpSec DC 15])    → a2.jax_left_holding on success (they go after Jax alone),
 *                                a2.jax_debt_defaulted + a 'legal' complication on fail
 *  - ignore it / let it expire → a2.jax_debt_defaulted (heat, Jax's grudge, maybe 'legal')
 *
 * Read later: the first raid names Tallow & Keel when it comes for Jax (q5, a2_the_raid).
 */
import { defineContent } from '@/engine/registry'
import type { Effect, SceneDef } from '@/engine/types'

const T_AND_K = 'Tallow & Keel Recovery'
const OWE = 'pkg02_act2_jax_restitution'

const defaulted: Effect[] = [
  { flag: 'a2.jax_debt_defaulted' },
  { stat: 'heat', add: 8 },
  { npc: 'jax', affinity: -4 },
  { chance: 0.5, then: [{ complication: 'legal' }] },
]

const invoice: SceneDef = {
  id: 'a2_jax_invoice',
  channel: 'mail',
  title: 'Account 0318-J — Notice of Discrepancy',
  from: T_AND_K,
  pause: true,
  expiresDays: 21,
  onExpire: [
    ...defaulted,
    { notify: 'You never answered Tallow & Keel. They found someone who would: Jax.', kind: 'bad' },
  ],
  start: 'notice',
  nodes: {
    notice: {
      speaker: T_AND_K,
      text: [
        'To the Guarantor of Record,',
        'Our client has completed his review of the deliverable supplied under the above account and finds it to be — we quote his assessment in full — "decorative." Our forensic contractor further identifies two sets of hands on the item. One belongs to our client\'s original vendor ("J."). The other, we are pleased to inform you, is yours.',
        'Restitution has been assessed at $2,400: the deposit, a modest inconvenience fee, and the cost of this letter, which is printed on very good paper.',
        'J. has received an identical notice. He has not responded. In our experience, guarantors usually do.',
        'Please indicate your preferred settlement option below.',
        'Warm regards,\nAccounts, Tallow & Keel Recovery · Millgate\n"We never forget an account."',
      ],
      choices: [
        {
          text: 'Pay it. All of it. Today. Make this go away before Jax has to open his.',
          tag: '[Pay $2400]',
          req: { stat: 'money', gte: 2400 },
          reqText: 'Requires: $2400 on hand',
          effects: [{ money: -2400 }, { flag: 'a2.jax_debt_settled' }, { npc: 'jax', affinity: 5 }],
          goto: 'paid',
        },
        {
          text: 'Sign their payment plan in your name. Jax can pay you back in pizza.',
          tag: '[Payment plan]',
          effects: [
            { obligation: { id: OWE, label: 'Tallow & Keel: restitution for Jax\'s blown job', perDay: 14, days: 180 } },
            { flag: 'a2.jax_debt_shared' },
            { npc: 'jax', affinity: 3 },
          ],
          goto: 'plan',
        },
        {
          text: 'Call Kroll. Something tells you she knows these people.',
          tag: '[Call Kroll]',
          if: { any: [{ flag: 'fac.aperture.client' }, { flag: 'fac.aperture.retainer' }] },
          effects: [
            { flag: 'a2.kroll_paid_jax_debt' },
            { faction: 'fac.aperture', add: 4 },
            { faction: 'fac.loft', add: -2 },
            { var: 'w.enclosure', add: 1 },
          ],
          goto: 'kroll',
        },
        {
          text: 'Burn the thread they used to find you. Make the "guarantor" disappear.',
          tag: '[Vanish]',
          check: {
            skill: 'opsec',
            dc: 15,
            bonuses: [
              { if: { trait: 'paranoid' }, add: 2, label: '+2 (Paranoid: you were half-vanished already)' },
              { if: { background: 'latchkey' }, add: 1, label: '+1 (Latchkey Kid: nobody ever knew where you were)' },
            ],
            success: 'vanished',
            fail: 'found',
            successEffects: [{ flag: 'a2.jax_left_holding' }, { stat: 'heat', add: -4 }, { npc: 'jax', affinity: -6 }],
            failEffects: [
              { flag: 'a2.jax_debt_defaulted' },
              { stat: 'heat', add: 12 },
              { stat: 'stress', add: 6 },
              { npc: 'jax', affinity: -2 },
              { complication: 'legal' },
            ],
          },
        },
        {
          text: 'Ignore it. It\'s a form letter with a threat stapled to it.',
          tag: '[Ignore]',
          effects: defaulted,
          goto: 'ignored',
        },
      ],
    },
    paid: {
      speaker: 'narrator',
      text: [
        'You pay it at a bank counter with a teller who does not ask what "Account 0318-J" is and clearly wants to. A receipt arrives two days later on the same very good paper, with a handwritten line at the bottom: "A pleasure. — T&K."',
        'Jax finds out from his own letter, which now says PAID IN FULL across it in red. He calls you and doesn\'t say anything for a long time. "I\'m putting you in my will," he says finally. "You get my boat. In Galleon. It\'s a really good boat."',
      ],
      effects: [{ log: 'You paid off Jax\'s blown job. Expensive. Clean. Nobody\'s knocking.', kind: 'money' }],
    },
    plan: {
      speaker: 'narrator',
      text: [
        'You sign the plan. The first withdrawal comes out the next morning, small and punctual, and so will the next hundred and seventy-nine. It is the least dramatic way anyone has ever been extorted.',
        'Jax brings over a pizza the first Friday, and the second, and the third, and on the fourth he brings a crumpled envelope with forty dollars in it and won\'t let you give it back. "Installment," he says. "I have a plan too. My plan is pizza and guilt."',
      ],
      effects: [{ log: 'You\'re paying Tallow & Keel by the day for Jax\'s blown job. Pizza helps.', kind: 'money' }],
    },
    kroll: {
      speaker: 'kroll',
      text: [
        '"Tallow and Keel?" Kroll laughs, delighted, like you\'ve mentioned a mutual friend. "Oh, they\'re mine, dear. Most collectors in this city are, one way or another. Consider the account closed."',
        { if: { flag: 'a2.kroll_lowballed' }, text: '"Put it on your tab," she adds. "At your rate, it\'ll be a while."', else: '"No, no. You don\'t owe me anything." You have heard that sentence from her before. It is getting more expensive every time.' },
        'The letter to Jax never arrives. Neither does the next one. It\'s like the whole thing never happened — which, you are starting to understand, is the product Aperture actually sells.',
      ],
      effects: [{ log: 'Kroll made Jax\'s collectors disappear. They were hers all along.', kind: 'story' }],
    },
    vanished: {
      speaker: 'narrator',
      text: [
        'You burn it properly: the mailbox, the relay, the name on the relay, the habit that led to the name. By the weekend there is no guarantor of record — just a returned envelope and a very confused accountant in Millgate.',
        'It works. That\'s the problem. Tallow & Keel can\'t find you, so they spend all their very good paper on the one hand they can find. Jax gets a second letter, then a third, then a man in a nice coat at Rosa\'s school pickup, asking politely which child is his sister.',
        '"They can\'t find you," Jax says on the phone, flat. "Cool. Good for you. That\'s really great for you." He hangs up before you can answer.',
      ],
      effects: [{ log: 'You vanished from Tallow & Keel\'s books. They went after Jax alone.', kind: 'bad' }],
    },
    found: {
      speaker: 'narrator',
      text: [
        'You burn the thread — and it turns out they had two. The next letter arrives at your actual door, hand-delivered, in an envelope with your full legal name on it spelled correctly, which nobody has ever managed on the first try.',
        'Inside: the same invoice, a new line item ("Locating fee: $600"), and a photocopy of a complaint someone has quietly filed with the city, naming you and "J." as parties of interest. It isn\'t a lawsuit yet. It\'s a demonstration of what a lawsuit would look like.',
      ],
      effects: [{ log: 'You tried to vanish on Tallow & Keel and they found you anyway. There\'s paperwork with your name on it now.', kind: 'bad' }],
    },
    ignored: {
      speaker: 'narrator',
      text: [
        'You drop it in the recycling. It\'s a form letter. Form letters are how the powerless pretend to be powerful. That\'s what you tell yourself.',
        'Two weeks later Jax calls from a payphone. "Did you get a letter," he says, not really a question. "Because I got four. And a guy came to Rosa\'s school." A pause full of traffic. "Just — next time you\'re gonna ignore something, maybe tell me first, so I can ignore it too."',
      ],
      effects: [{ log: 'You ignored Tallow & Keel. They didn\'t ignore Jax.', kind: 'bad' }],
    },
  },
}

export default defineContent({
  scenes: [invoice],
})
