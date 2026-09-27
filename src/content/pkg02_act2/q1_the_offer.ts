/**
 * PKG-02 — main_a2_q1_the_offer: Aperture enters, the dark turn begins (bible §6.B, CP-B1).
 *
 * Vanessa Kroll pages you directly and buys you dinner at Harbor Point. The tone flips to IIb here
 * (`a2.phase_iib`), and the handshake-as-comfort motif is quietly seeded for its inversion at the hinge.
 * On completion the chain moves on with relative timing: Priya's beat lands ~90 days later
 * (main_a2_q2 schedules it) and the Oracle's first page ~3 weeks later.
 *
 * PKG-02 owns: main_a2_q1_the_offer, scenes a2_kroll_page / a2_kroll_dinner, flags a2.phase_iib /
 * a2.double_dealer / a2.refused_kroll / a2.kroll_answered, fac.aperture.client / .retainer,
 * npc.kroll.wary, a2.kroll_lowballed (+ the Bought Cheap scar on a failed negotiation).
 *
 * Cross-package reads: a1.hoarder, npc.corvid.trusts, a1.crack_clean, a1.sold_tool, a1.grandma_done
 * (PKG-01), item aperture_sample (PKG-00).
 */
import { defineContent } from '@/engine/registry'
import type { Effect, QuestDef, SceneDef } from '@/engine/types'
import { SCAR } from './scars'

const answered: Effect = { flag: 'a2.kroll_answered' }

/**
 * CP-B1 D fail (bible: she laughs, you get the job anyway). It is no longer just a laugh: Hollis
 * writes your price down, and it follows you — the Bought Cheap scar, and a2.kroll_lowballed, which
 * Kroll's later calls (Jax's 3 a.m. fix, Mom's bill, the Meridian ask) all remember.
 */
const overreach: Effect[] = [
  { money: 5000 },
  { flag: 'fac.aperture.client' },
  { stat: 'heat', add: 10 },
  { var: 'w.enclosure', add: 1 },
  { flag: 'a2.kroll_lowballed' },
  { trait: SCAR.boughtCheap },
]

const page: SceneDef = {
  id: 'a2_kroll_page',
  channel: 'chat',
  title: 'V. Kroll',
  from: 'kroll',
  pause: true,
  start: 'msg',
  nodes: {
    msg: {
      speaker: 'kroll',
      text: [
        'hello. you don\'t know me, but I know your work, which in my experience is the better way round.',
        'Vanessa Kroll, Aperture Data Solutions. I\'d like to buy you dinner and ask you a question. Tomorrow, 8pm, top floor of the Meridian tower. Wear whatever you like. They\'ll let you in.',
      ],
      choices: [
        { text: '"How did you get this number?"', goto: 'number' },
        { text: '"I\'ll be there."', goto: 'see_you' },
        { text: '"What kind of question?"', goto: 'question' },
      ],
    },
    number: {
      speaker: 'kroll',
      text: 'the same way I get everything, dear. I asked someone who knew. see you at eight.',
    },
    see_you: {
      speaker: 'kroll',
      text: 'lovely. I\'ll order you something you can\'t pronounce.',
    },
    question: {
      speaker: 'kroll',
      text: 'the kind that pays. eight o\'clock. the view alone is worth the elevator.',
    },
  },
}

const dinner: SceneDef = {
  id: 'a2_kroll_dinner',
  channel: 'dialog',
  title: 'Dinner at Harbor Point',
  from: 'kroll',
  start: 'arrive',
  nodes: {
    arrive: {
      speaker: 'narrator',
      text: [
        'The restaurant is on the top floor of the Meridian Trust tower, all glass and hush, the kind of place where the menu has no prices because if you have to ask you are at the wrong table. Below, Port Lumen is a circuit board someone left running.',
        'Vanessa Kroll stands to greet you like you\'re the one doing her the favor. Silver bob, reading glasses on a chain, a handshake that is warm and dry and lasts exactly as long as it should. A grey man is already seated, folio closed in front of him, watching you the way a lock watches a key.',
      ],
      // The tone flips: IIb begins. Kroll and Hollis are now known.
      effects: [{ flag: 'a2.phase_iib' }, { npc: 'kroll', met: true }, { npc: 'hollis', met: true }],
      next: 'intro',
    },
    intro: {
      speaker: 'kroll',
      text: [
        '"You came. Good. I was worried the tower would put you off — everyone your age thinks a building like this is where dreams go to get audited." She laughs, and you catch yourself laughing too. "Sit. This is Miles Hollis, my colleague in Compliance. He says almost nothing and remembers all of it."',
        { if: { flag: 'a1.hoarder' }, text: '"I like to know who I\'m talking to before I talk to them," she adds, lightly. "You kept something you found once, on a neighbor\'s machine. Curious hands. That\'s a compliment, in my line of work."' },
        { if: { flag: 'npc.corvid.trusts' }, text: '"I hear you\'re close with the old guard. Corvid vouches for people so rarely I assumed it was a myth." A small, precise smile.' },
        { if: { flag: 'a2.leaned_legit' }, text: '"And you\'re going straight, I hear. A desk, a badge, a dental plan. Admirable. Boring. We\'ll see how long it lasts."' },
        { if: { flag: 'a2.leaned_school' }, text: '"A student, too. Lumen State. I sit on a donor committee up there, which means I have eaten more bad catered salmon on the Hill than anyone alive."' },
        { if: { flag: 'a2.two_hats' }, text: '"Two lives at once, and you keep them both fed. You would be astonished how few adults can manage one."' },
        { if: { flag: 'a2.overcommitted' }, text: '"I also hear you tried to live two lives at once and dropped both of them in a pizza box," she adds, amused. "Don\'t look so alarmed. Everyone tells me everything. It\'s my only talent."' },
      ],
      next: 'pitch',
    },
    pitch: {
      speaker: 'kroll',
      text: [
        'The plates arrive without anyone ordering. Hollis does not touch his.',
        '"Here\'s the shape of it. There\'s a firm across town — a competitor of a client of mine — sitting on a marketing database they scraped without asking. Names, buying habits, the usual. I would like a copy. You would be, at most, correcting a theft with a theft." She refills your water. "Clean job. Quiet target. And the number is five thousand dollars, which I understand is a great deal of money to you, and is a rounding error to me, and I find that gap between us genuinely charming."',
        '"I\'m not the bad guy, before you ask. I\'m the market. Aren\'t you glad it\'s someone who takes you to dinner first?"',
        { if: { flag: 'a2.settling_wary' }, text: 'Somewhere in the back of your head, a voice you used on Jax a long time ago says: nothing this easy stays this easy.' },
      ],
      next: 'cp_b1',
    },
    cp_b1: {
      speaker: 'kroll',
      text: '"So." She sets down her glass. "What are we doing?"',
      choices: [
        {
          text: 'Take it. Deliver it clean, no games.',
          tag: '[Accept]',
          effects: [
            { money: 5000 },
            { faction: 'fac.aperture', add: 15 },
            { faction: 'fac.loft', add: -6 },
            { stat: 'heat', add: 10 },
            { flag: 'fac.aperture.client' },
            { var: 'w.enclosure', add: 1 },
          ],
          goto: 'out_clean',
        },
        {
          text: 'Take it — and quietly keep a copy of your own.',
          tag: '[Skim]',
          effects: [
            { money: 5000 },
            { faction: 'fac.aperture', add: 15 },
            { faction: 'fac.loft', add: 2 },
            { stat: 'heat', add: 10 },
            { flag: 'fac.aperture.client' },
            { flag: 'a2.double_dealer' },
            { var: 'w.enclosure', add: 1 },
          ],
          goto: 'out_skim',
        },
        {
          text: 'Refuse. And tell Corvid that Aperture is recruiting.',
          tag: '[Refuse]',
          effects: [
            { faction: 'fac.aperture', add: -10 },
            { faction: 'fac.loft', add: 12 },
            { flag: 'a2.refused_kroll' },
            { var: 'w.exposure', add: 1 },
          ],
          goto: 'out_refuse',
        },
        {
          text: '"Not a one-off. Put me on retainer — or give me a piece."',
          tag: '[Negotiate]',
          check: {
            skill: 'business',
            dc: 14,
            bonuses: [{ if: { flag: 'a2.two_hats' }, add: 1, label: '+1 (you already run two books)' }],
            success: 'out_retainer',
            fail: 'out_client_fail',
            successEffects: [{ flag: 'fac.aperture.retainer' }, { faction: 'fac.aperture', add: 20 }, { money: 5000 }, { var: 'w.enclosure', add: 1 }],
            failEffects: overreach,
          },
        },
        {
          text: 'Read her back to herself — and name your price.',
          tag: '[Charm]',
          check: {
            skill: 'social',
            dc: 15,
            bonuses: [{ if: { trait: 'silver_tongue' }, add: 1, label: '+1 (you could sell sand to the Sound)' }],
            success: 'out_retainer',
            fail: 'out_client_fail',
            successEffects: [{ flag: 'fac.aperture.retainer' }, { faction: 'fac.aperture', add: 20 }, { money: 5000 }, { var: 'w.enclosure', add: 1 }],
            failEffects: overreach,
          },
        },
        {
          text: '"I know about the botnet. The thing phoning home to your address block."',
          tag: '[Leverage]',
          req: { item: 'aperture_sample' },
          reqText: 'Requires: the Aperture sample (kept from the Grandma Job)',
          effects: [{ money: 7500 }, { faction: 'fac.aperture', add: 10 }, { flag: 'npc.kroll.wary' }, { flag: 'fac.aperture.client' }, { var: 'w.enclosure', add: 1 }],
          goto: 'out_sample',
        },
      ],
    },
    out_clean: {
      speaker: 'kroll',
      text: [
        '"Wonderful." She doesn\'t smile bigger, exactly; the smile just gets warmer, like a thermostat you didn\'t know she controlled. "You\'ll find the details in your inbox by morning. Simple. Discreet. The way I like everything."',
        'Hollis makes a single note in his folio and closes it. You never see what he wrote. Somewhere far below, a dial-up modem sings its little handshake song — that old, comforting sound of two machines agreeing to talk — and for the first time in your life it makes the back of your neck cold.',
      ],
      effects: [answered, { log: 'You\'re Aperture\'s client now. Kroll never lied to you. That\'s the frightening part.', kind: 'story' }],
    },
    out_skim: {
      speaker: 'narrator',
      text: [
        'You take the job, and you take something else too — a private copy, tucked away where nobody thinks to look. Insurance. Leverage. A bad habit dressed as a good idea.',
        'Kroll walks you to the elevator with a hand not quite touching your back. "You\'re going to do well," she says, and means it, and you spend the whole ride down deciding whether that was a compliment or a diagnosis.',
      ],
      effects: [answered, { log: 'You skimmed a copy of Kroll\'s data. Someday she may find out.', kind: 'story' }],
    },
    out_refuse: {
      speaker: 'kroll',
      text: [
        'You say no, plainly, and something behind her eyes updates a spreadsheet you can\'t see. She is not angry. She is delighted.',
        '"Oh, good," she says, standing. "You have a spine. Do you know how rare that is, and how much it costs to buy? I\'ll be in touch, and next time the number will be bigger, because now I know you\'re worth persuading." She shakes your hand exactly as long as she should. "Give Corvid my regards. Tell her the water\'s already rising."',
      ],
      effects: [answered, { log: 'You refused Kroll and warned the Loft. She respected it — which is somehow worse.', kind: 'story' }],
    },
    out_retainer: {
      speaker: 'kroll',
      text: [
        'You don\'t take the job. You take the table. By the time the coffee comes you\'ve talked yourself into being a fixture instead of a favor — a retainer, a line item, a name Hollis will have to learn to spell.',
        '"Now that," Kroll says, genuinely pleased, "is the correct answer. Anyone can do a job. Very few people know how to become a cost of doing business." Hollis, for the first time, looks at you like a problem instead of a task.',
      ],
      effects: [answered, { log: 'You negotiated an Aperture retainer. You\'re inside the machine now, and getting paid to stay.', kind: 'story' }],
    },
    out_client_fail: {
      speaker: 'kroll',
      text: [
        'You reach for more than you can hold, and she lets you, and then she laughs — kindly, which is the worst way.',
        '"Ambitious. I like ambitious. But you don\'t have leverage yet, dear, you have promise, and promise is what I buy cheap." She slides the job across anyway. "Take the five thousand. Do it well. We\'ll talk about equity when you\'re someone I can\'t replace."',
      ],
      effects: [answered],
      next: 'hollis_note',
    },
    hollis_note: {
      speaker: 'hollis',
      text: [
        'Hollis opens his folio for the first time all evening. He writes a single line, turns it so Kroll can read it, and closes it again. She glances down and smiles like someone approving a very reasonable invoice.',
        '"Miles thinks you\'re a four-thousand-dollar person who asked to be a fifty-thousand-dollar person," she says pleasantly. "He\'s usually right. Don\'t take it personally — it\'s only a number, and numbers are the one thing in this city that never lie to you."',
        'Hollis says nothing. He doesn\'t need to. You are, at present, an open file — and now the file has a price written on the tab.',
      ],
      effects: [{ log: 'You overreached. Kroll gave you the job anyway, on her terms — and Hollis wrote down what you\'re worth.', kind: 'bad' }],
    },
    out_sample: {
      speaker: 'kroll',
      text: [
        'You lay the word "botnet" on the table like a card, and for half a second — half — the warmth in her face is a thing she is choosing to keep there. Hollis\'s pen stops.',
        '"Well," she says softly. "Aren\'t you full of surprises." The smile returns, but it\'s wearing a coat now. "Then you understand exactly what I do, and you came to dinner anyway. That tells me more about you than any job would." She raises the offer without being asked — seventy-five hundred — and slides it across. "Careful hands. I\'ll be watching them."',
      ],
      effects: [answered, { log: 'You showed Kroll you know what Aperture is. She\'s wary of you now — and interested.', kind: 'story' }],
    },
  },
}

const quest: QuestDef = {
  id: 'main_a2_q1_the_offer',
  title: 'The Offer',
  kind: 'main',
  act: 2,
  giver: 'kroll',
  summary:
    'Vanessa Kroll paged you personally and bought you dinner at the top of the Meridian tower. The food is free. The job is not. This is where the light part ends.',
  // Bible gate: act 2, day ≥ 700, and Aperture has a reason to know you (the sample, Corvid's trust,
  // or a clean first crack). A day-820 catch-all keeps a player who touched none of those from
  // soft-locking the main chain — Kroll finds everyone eventually.
  autoStart: {
    all: [
      { var: 'act', eq: 2 },
      { day: true, gte: 700 },
      { flag: 'a1.grandma_done' },
      {
        any: [
          { flag: 'a1.hoarder' },
          { flag: 'npc.corvid.trusts' },
          { flag: 'a1.crack_clean' },
          { flag: 'a1.sold_tool' },
          { day: true, gte: 820 },
        ],
      },
    ],
  },
  priority: 20,
  rewards: "Aperture's attention · money",
  start: 'page',
  stages: {
    page: {
      text: 'A stranger named Vanessa Kroll paged you by name. She wants to buy you dinner at the top of the Meridian tower and ask you "a question."',
      hint: 'Answer the page, then wait for the dinner — it lands the next evening.',
      onEnter: [{ scene: 'a2_kroll_page' }, { scene: 'a2_kroll_dinner', delayHours: 30 }],
      objectives: [
        { id: 'arrive', text: 'Go to dinner at Harbor Point', when: { seen: 'a2_kroll_dinner' }, hint: 'The dinner dialog arrives on its own about a day after her page.' },
      ],
      next: 'dinner',
    },
    dinner: {
      text: 'Kroll wants a favor: pull a database from a rival firm. Clean-looking, great money. Decide what kind of person picks up that fork.',
      hint: 'Every road out has a cost — even refusing. A kept sample from the Grandma Job unlocks a sharper answer.',
      objectives: [
        { id: 'answer', text: "Answer Kroll's first offer", when: { flag: 'a2.kroll_answered' }, hint: 'Finish the dinner dialog and choose.' },
      ],
      onComplete: [
        { quest: 'main_a2_q2_priya', start: true },
        { scene: 'a2_oracle_drop1', delayHours: 21 * 24 },
      ],
    },
  },
}

export default defineContent({
  quests: [quest],
  scenes: [page, dinner],
})
