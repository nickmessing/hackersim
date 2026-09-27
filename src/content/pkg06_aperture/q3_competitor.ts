/**
 * PKG-06 — `fac_aperture_q3_competitor` — "The Competitor" (bible §7.2.3).
 *
 * Aperture wants a rival data-insight startup, Ridgeline Analytics, quietly wrecked before a deal
 * closes. A friend of yours has a contract inside it. Comply and you burn them; warn them and you
 * burn your standing with Kroll. If the friend is Mira, complying is the *only* proper source of
 * `npc.mira.betrayed` (bible §4.4 / §12.4).
 *
 * Hacking is fiction: "sabotage" is abstract corporate-espionage flavor (a poisoned report, a
 * spooked client), never real technique.
 *
 * Sets: `fac.aperture.suspect_you`, `npc.mira.betrayed` (comply, if Mira), `w.enclosure` (+).
 */
import { defineContent } from '@/engine/registry'
import type { Cond, QuestDef, SceneDef } from '@/engine/types'

/** Whether the endangered friend is Mira (met and still in play). */
const MIRA_IS_FRIEND: Cond = {
  npc: 'mira',
  met: true,
  fateNot: ['gone', 'dead', 'arrested', 'rival'],
}

const quest: QuestDef = {
  id: 'fac_aperture_q3_competitor',
  title: 'Special Accounts: The Competitor',
  kind: 'faction',
  act: 2,
  faction: 'fac.aperture',
  giver: 'kroll',
  priority: 23,
  autoStart: {
    all: [
      { quest: 'fac_aperture_q2_retainer', status: 'completed' },
      { faction: 'fac.aperture', gte: 20 },
      { var: 'act', gte: 2 },
    ],
  },
  rewards: 'Aperture\'s gratitude — at a price with a name on it',
  summary:
    'A rival firm, Ridgeline Analytics, is about to eat Aperture\'s lunch. Kroll wants it to have a very bad quarter. The problem is who\'s inside it: someone you know is doing the security audit, and Aperture\'s bad quarter is their disaster.',
  start: 'brief',
  stages: {
    brief: {
      text:
        'Kroll wants Ridgeline Analytics knocked off balance before its funding round. Someone you know is contracting inside it. Whatever you do to the firm, you do to them.',
      onEnter: [{ scene: 'aperture_competitor' }],
      objectives: [
        {
          id: 'choose',
          text: 'Decide what happens to Ridgeline — and to your friend inside it',
          when: { flag: 'fac.aperture.competitor_done' },
          hint: 'Comply and Aperture is grateful; warn your friend and Aperture is not. There\'s a Business play that fools Kroll and spares them — if you can sell it. Botch it and you get the worst of both, plus Compliance\'s full attention.',
        },
      ],
    },
  },
}

const scene: SceneDef = {
  id: 'aperture_competitor',
  channel: 'dialog',
  title: 'The Competitor',
  from: 'kroll',
  start: 'intro',
  nodes: {
    intro: {
      speaker: 'kroll',
      text: [
        { if: { flag: 'fac.aperture.hollis_file' }, text: 'Hollis is at the next table, alone, eating soup with the concentration of a man reading. He doesn\'t look over once. That is how you know he\'s listening.' },
        { if: { flag: 'fac.aperture.clawback' }, text: 'Kroll slides a small envelope across before the menus arrive: this month\'s clawback statement, hand-delivered. "Miles insisted," she says. "He thinks it builds character. I think it builds resentment. Let\'s see which of us is right."' },
        'Kroll orders for both of you and gets it right. "Ridgeline Analytics," she says. "Four kids and a whiteboard. They have a product that\'s honestly better than ours, which is why they need to have a genuinely terrible spring." She says it the way you\'d describe weather.',
        '"Nothing dramatic. Their big client gets nervous, the funding round gets postponed, the four kids go back to being three kids and a lawsuit. Aperture buys the whiteboard for parts." She butters a roll. "You\'d spook the client. You\'re good at spooking."',
      ],
      next: 'reveal',
    },
    reveal: {
      speaker: 'narrator',
      text: [
        'You pull Ridgeline\'s vendor list on the way home. There, on the security audit, is a name that stops you on the sidewalk.',
        {
          if: MIRA_IS_FRIEND,
          text: 'nyx. Mira. She took the Ridgeline contract because it was clean, legal work with her real name on the invoice — the exact thing she moved to Port Lumen to be able to do. If Ridgeline goes down spooked, her name goes down with it. Again. The way it went down in Ridgeport.',
          else: 'It\'s a name from the Row — a friend doing their first honest, above-board contract, the kind you\'re supposed to be happy for. If Ridgeline collapses, they eat the blame.',
        },
      ],
      next: 'choice',
    },
    choice: {
      speaker: 'player',
      text: 'So. What kind of quarter is Ridgeline going to have.',
      choices: [
        {
          text: 'Spook the client. Wreck Ridgeline. Take the win.',
          tag: '[Comply]',
          effects: [
            { faction: 'fac.aperture', add: 15 },
            { money: 8000 },
            { faction: 'fac.hood', add: -10 },
            { var: 'w.enclosure', add: 1 },
            { flag: 'fac.aperture.competitor_done' },
            {
              if: MIRA_IS_FRIEND,
              then: [
                { flag: 'npc.mira.betrayed' },
                { npc: 'mira', affinity: -30 },
              ],
              else: [{ stat: 'cred', add: -2 }],
            },
          ],
          goto: 'complied',
        },
        {
          text: 'Warn them. Let Ridgeline see it coming.',
          tag: '[Warn]',
          effects: [
            { faction: 'fac.aperture', add: -15 },
            { flag: 'fac.aperture.suspect_you' },
            { faction: 'fac.hood', add: 10 },
            { flag: 'fac.aperture.competitor_done' },
            {
              if: MIRA_IS_FRIEND,
              then: [{ npc: 'mira', affinity: 14 }],
              else: [{ stat: 'cred', add: 2 }],
            },
          ],
          goto: 'warned',
        },
        {
          text: 'Hand Kroll a convincing partial — enough to look done, not enough to land.',
          tag: '[Business 17]',
          check: {
            skill: 'business',
            dc: 17,
            success: 'faked_ok',
            fail: 'faked_bad',
            bonuses: [
              { if: { flag: 'fac.aperture.knowing' }, add: 2, label: '+2 (you know what she checks)' },
              { if: { flag: 'fac.aperture.audit_passed' }, add: 1, label: '+1 (Hollis closed your tab)' },
              { if: { flag: 'fac.aperture.hollis_file' }, add: -2, label: '−2 (Hollis has an open file on you)' },
              { if: { trait: 'pkg06_aperture_asset_tag' }, add: -1, label: '−1 (they\'ve seen inside your machine)' },
            ],
            successEffects: [
              { faction: 'fac.aperture', add: 6 },
              { money: 6000 },
              { flag: 'fac.aperture.competitor_done' },
              {
                if: MIRA_IS_FRIEND,
                then: [{ npc: 'mira', affinity: 6 }],
                else: [],
              },
            ],
            failEffects: [
              { faction: 'fac.aperture', add: -8 },
              { flag: 'fac.aperture.suspect_you' },
              { flag: 'fac.aperture.ridgeline_botched' },
              { trait: 'pkg06_aperture_open_file' },
              { stat: 'heat', add: 15 },
              { flag: 'fac.aperture.competitor_done' },
              {
                if: MIRA_IS_FRIEND,
                then: [{ flag: 'npc.mira.betrayed' }, { npc: 'mira', affinity: -15 }],
                else: [{ stat: 'cred', add: -1 }, { faction: 'fac.hood', add: -6 }],
              },
              // Ridgeline's lawyers go looking for whoever started the rumor.
              { chance: 0.4, then: [{ complication: 'legal' }] },
            ],
          },
        },
        {
          text: '"Find someone else. I don\'t do friends."',
          tag: '[Refuse the job]',
          effects: [
            { faction: 'fac.aperture', add: -6 },
            { flag: 'fac.aperture.suspect_you' },
            { flag: 'fac.aperture.competitor_done' },
          ],
          goto: 'refused',
        },
      ],
    },
    complied: {
      speaker: 'narrator',
      text: [
        'It is not hard. Ridgeline\'s big client gets a very concerned, very anonymous heads-up, sourced impeccably, and by Thursday the round is "on pause." Three kids and a lawsuit, exactly as ordered.',
        {
          if: MIRA_IS_FRIEND,
          text: 'Mira calls once. She doesn\'t shout. "Ridgeport," she says, and hangs up, and that one word is the worst thing anyone has ever said to you. She knows it was you. She always knows.',
          else: 'Your friend from the Row loses the contract and the reference. They never find out it was you, which is the only mercy in it, and it isn\'t much of one.',
        },
      ],
      next: 'complied_kroll',
    },
    complied_kroll: {
      speaker: 'kroll',
      text:
        '"Clean," Kroll says, meaning it as the compliment it is. "You didn\'t leave a mark, and you didn\'t flinch. Miles owes me twenty dollars; he bet you\'d flinch." She sounds proud. She sounds like your mother would if your mother sold cities.',
    },
    warned: {
      speaker: 'narrator',
      text: [
        'You tip them off. Ridgeline\'s client gets an even more concerned, even more anonymous heads-up that the *first* heads-up is coming and is garbage. The round closes on time. Four kids, one whiteboard, still standing.',
        {
          if: MIRA_IS_FRIEND,
          text: 'Mira never says thank you — that isn\'t how she works — but a week later a coffee shows up on your desk, still warm, no note. From her, it\'s a symphony.',
          else: 'Your friend keeps the reference and never knows how close it came. You keep that too.',
        },
      ],
      next: 'warned_kroll',
    },
    warned_kroll: {
      speaker: 'kroll',
      text:
        'Kroll figures it out within the day. She isn\'t angry — anger is for people who lose. "You have a soft spot," she says, filing it. "Everyone does. I just learned where yours is. Thank you for that." Hollis, in the background, does not look up from his folio. He was right, is the thing his silence says.',
    },
    faked_ok: {
      speaker: 'narrator',
      text: [
        'You give Kroll a masterpiece of nothing: a report that reads like sabotage, cites like sabotage, and does no sabotage at all. Ridgeline wobbles for a news cycle and recovers. Aperture logs a win. Your friend keeps their name.',
        'It is the hardest kind of job — the kind where everyone is happy and everyone is wrong about why.',
      ],
      next: 'faked_kroll',
    },
    faked_kroll: {
      speaker: 'kroll',
      text:
        '"Effective," Kroll says, and you feel your pulse in your neck until she moves on. She never sees the seam. Someday she might. For now, you sold her a forgery of your own loyalty and she bought it retail.',
    },
    faked_bad: {
      speaker: 'kroll',
      text: [
        'The seam shows. Kroll reads your "sabotage" twice, sets it down, and looks at you the way a locksmith looks at a lock that\'s been picked badly. "Interesting," she says, which is the coldest word she owns.',
        'Ridgeline survives anyway — you tried — but now Kroll knows you tried to have it both ways, and Hollis has opened a new tab in the folio with your name on it.',
        {
          if: MIRA_IS_FRIEND,
          text: 'Worse: your clumsy half-measure spooked the client after all. Mira\'s contract is collateral. She hears your name in the wreckage and draws the obvious, correct conclusion.',
          else: 'Worse: your clumsy half-measure spooked the client after all. Your friend from the Row loses the contract, the reference and a month of rent, and on the Row a thing like that gets talked about on stoops until somebody\'s name attaches to it. Yours is the one that sticks.',
        },
      ],
      next: 'faked_bad_hollis',
    },
    faked_bad_hollis: {
      speaker: 'hollis',
      text: [
        'Hollis visits the next morning, which he never does. He stands in your doorway holding the folio against his chest like a hymnal. "Ms. Kroll finds you interesting," he says. "I find you untidy. Those are different problems, and only one of them is mine."',
        '"You are, at present, an open file." He says it gently, the way a doctor says a word you\'ll be looking up later. "I\'d keep your receipts. Ridgeline\'s lawyers are asking the client who called them first. The client is asking us. We are, as a courtesy, going to let them keep asking."',
      ],
      next: 'faked_bad_end',
    },
    faked_bad_end: {
      speaker: 'narrator',
      text:
        'You reached for the clever third door and put your hand through the glass. Aperture watches you closer now, a lawsuit is looking for a name to staple itself to, and you got none of the money and most of the guilt.',
    },
    refused: {
      speaker: 'kroll',
      text:
        '"No friends," Kroll repeats, tasting it. "That\'s a line I can respect and still find useful." She has someone else spook the client by Friday. Ridgeline dies anyway; you just didn\'t hold the knife. She lets you keep believing that\'s different, because letting you believe things is also a kind of leverage.',
      effects: [{ faction: 'fac.hood', add: 4 }],
    },
  },
}

export default defineContent({
  quests: [quest],
  scenes: [scene],
})
