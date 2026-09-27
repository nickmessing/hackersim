/**
 * PKG-10 — "Complication: The Lamplighter" (the long tail of a failed intervention with Dad).
 *
 * In `hood_dad_counter` (fates.ts) the player can try to pour Dad's bottle down the sink
 * ([Social DC 15]). Failing it no longer just costs affinity: "not tonight" becomes every night at
 * the Lamplighter on Fifth, until Harbor Point General calls at 2 a.m. The ER bill is real (pay it,
 * sign a payment plan, fight for charity care, or leave it with him), his wrist never sets quite
 * right (`npc.dad.bad_wrist`, read by Coming Home), and the waiting room is one more chance to
 * reach him: `npc.dad.pulled_back` keeps him off the `spiral` fate (§4.6). Leaving him with the
 * bill sets `npc.dad.er_debt` and lets the spiral rules run.
 *
 * Dad's fate stays PKG-10's to write: if the Act IV finalization already wrote `spiral` before the
 * call came, pulling him back in the waiting room undoes it (spiral requires not pulled_back).
 */
import { defineContent } from '@/engine/registry'
import type { Effect } from '@/engine/types'
import { CATHODE_OPEN, HOOD_TRUSTED, KIM_CLOSE, SAL_AROUND } from './shared'

const QUEST = 'fac_hood_dad_lamplighter'
const DONE = 'fac.hood.lamplighter_done'
const ER_BILL = 'pkg10_dad_er_bill'

/** He is coming back. If the Act IV reckoning already wrote him off, it was premature. */
const PULLED_BACK: Effect[] = [
  { flag: 'npc.dad.pulled_back' },
  { flag: 'npc.dad.bad_wrist' },
  { if: { npc: 'dad', fate: 'spiral' }, then: [{ npc: 'dad', fate: 'normal' }] },
  { flag: DONE },
]

export default defineContent({
  quests: [
    {
      id: QUEST,
      title: 'Complication: The Lamplighter',
      kind: 'personal',
      act: 3,
      faction: 'fac.hood',
      giver: 'dad',
      priority: 30,
      rewards: 'Your father, if you get there in time',
      summary: [
        'You told your father what goes in the sink, and he told you not tonight. "Not tonight" has turned into every night at the Lamplighter on Fifth.',
        'Sooner or later, a phone rings at two in the morning. Everybody on the Row knows that. Everybody on the Row is waiting for it.',
      ],
      start: 'drift',
      stages: {
        drift: {
          text: [
            'Your father still walks to the Lamplighter every night. You know because Sal watches him to the corner, and Kim counts the bottles, and both of them have stopped telling you, which is how you know it\'s worse.',
            'You are waiting for a phone call. You hope you are wrong about that.',
          ],
          onEnter: [{ scene: 'hood_dad_er', delayHours: 24 * 12 }],
          objectives: [
            {
              id: 'call',
              text: 'Answer the call from Harbor Point General',
              when: { flag: DONE },
              hint: 'It will come at night. Those calls always do.',
            },
          ],
          next: [{ if: { flag: 'npc.dad.pulled_back' }, stage: 'mending' }, { stage: 'alone' }],
        },
        mending: {
          text: 'Six weeks in a cast. He can\'t hold a screwdriver, so he holds a coffee cup instead, all day, like a man keeping his hand busy on purpose. You come by more than you used to. He notices. He doesn\'t say so.',
          onEnter: [{ scene: 'hood_dad_cast_off', delayHours: 24 * 42 }],
          objectives: [
            {
              id: 'cast',
              text: 'Get him through six weeks in a cast',
              when: { flag: 'fac.hood.cast_off' },
              hint: 'Time, mostly. Dad will write when the cast comes off.',
            },
          ],
        },
        alone: {
          text: [
            {
              if: { flag: 'npc.dad.er_debt' },
              text: 'You left the bill with him. He is paying it off the only way he knows how: slowly, in cash, in person, and without mentioning it to anyone. The Lamplighter still keeps his stool.',
              else: 'You paid for the wrist. You couldn\'t find the words for the rest, and he took a cab home rather than hear you try again. Some nights he still walks down Fifth. The Lamplighter still keeps his stool.',
            },
          ],
          objectives: [
            {
              id: 'alone',
              text: 'Let him carry it',
              when: { always: true },
              hint: 'This resolves on its own. That is the problem.',
            },
          ],
          outcome: 'failed',
        },
      },
    },
  ],

  scenes: [
    // ── 2:14 a.m. ──────────────────────────────────────────────────────────
    {
      id: 'hood_dad_er',
      channel: 'dialog',
      title: 'Harbor Point General, 2:14 a.m.',
      start: 'call',
      nodes: {
        call: {
          speaker: 'narrator',
          text: [
            {
              if: { all: [CATHODE_OPEN, SAL_AROUND] },
              text: 'The phone rings at 2:14 a.m. It\'s Sal, and Sal never calls. "KID. Your old man. The back steps at the Lamplighter, the ice. They took him to General. I followed the ambulance in my car. I\'m in the lot. I\'m not going in, he wouldn\'t want me to see. Get down here."',
              else: 'The phone rings at 2:14 a.m. A nurse at Harbor Point General, with the voice of someone who has made this call a thousand times: your father slipped on the back steps of a bar on Fifth. He has asked for nobody. Your number was in his wallet, behind your mother\'s picture.',
            },
            { if: KIM_CLOSE, text: 'Kim is already awake when you call her. She says she\'ll meet you there. She says she\'s been sleeping in her clothes for a month, just in case.' },
          ],
          next: 'er',
        },
        er: {
          speaker: 'narrator',
          text: [
            'The emergency room at three in the morning is the loneliest room in Port Lumen. Your father is on a gurney in the hallway with his left wrist in a splint and six stitches over one eyebrow. He sees you and closes his eyes, the way you close a door on a room you didn\'t clean.',
            'A billing clerk named Doreen finds you before the doctor does. The mill\'s insurance ended with the layoff. The wrist needs a surgeon to set it properly. The total, before the surgeon, is eighteen hundred dollars. "We can do a payment plan," she says, gently, "in the name of whoever signs."',
          ],
          choices: [
            {
              text: 'Pay it. Tonight. Every cent.',
              tag: '[Pay $1,800]',
              req: { stat: 'money', gte: 1800 },
              reqText: 'Requires $1,800',
              effects: [{ money: -1800 }, { flag: 'npc.dad.er_paid' }],
              goto: 'waiting',
            },
            {
              text: 'Sign the payment plan. Your name on it, not his.',
              effects: [{ obligation: { id: ER_BILL, label: 'Dad\'s ER bill (Harbor Point General)', perDay: 12, days: 150 } }],
              goto: 'waiting',
            },
            {
              text: 'Find the charity-care office. There is always a form. Fill in every single one of them.',
              check: {
                skill: 'business',
                dc: 14,
                bonuses: [
                  { if: HOOD_TRUSTED, add: 2, label: 'The Row\'s priest will vouch by phone' },
                  { if: { flag: 'a1.dad_laid_off' }, add: 1, label: 'The mill layoff is on record' },
                ],
                success: 'charity',
                fail: 'charity_no',
                successEffects: [{ flag: 'fac.hood.charity_care' }, { stat: 'energy', add: -10 }],
                failEffects: [
                  { obligation: { id: ER_BILL, label: 'Dad\'s ER bill (Harbor Point General)', perDay: 14, days: 150 } },
                  { stat: 'stress', add: 6 },
                  { stat: 'energy', add: -10 },
                ],
              },
            },
            {
              text: 'Leave the bill with him. He\'s a grown man. He made his choices.',
              effects: [
                { npc: 'dad', affinity: -8 },
                { flag: 'npc.dad.er_debt' },
                { flag: 'npc.dad.bad_wrist' },
                { faction: 'fac.hood', add: -3 },
                { stat: 'stress', add: 4 },
                { flag: DONE },
              ],
              goto: 'left',
            },
          ],
        },
        charity: {
          speaker: 'narrator',
          text: 'It takes until dawn, eleven forms, two phone calls to the Row and one to a priest who answers on the first ring at five in the morning. Doreen reads the last form twice, stamps it APPROVED, and slides it back to you with a vending-machine coffee on top. "Most people give up at form four," she says. "Go sit with him."',
          next: 'waiting',
        },
        charity_no: {
          speaker: 'narrator',
          text: 'Denied. "The fund is for patients without family able to contribute," Doreen reads off the form, apologetically, at 6 a.m. "You\'re family. You\'re able." She slides the payment-plan papers across the counter, and you sign them, and you both pretend they weren\'t always going to be yours.',
          next: 'waiting',
        },
        waiting: {
          speaker: 'dad',
          text: [
            'Dawn, the waiting room, a plastic chair by the vending machine. They\'ve set the wrist. His arm is in a cast to the elbow, and he holds it in his lap like something he\'s been asked to carry for somebody else.',
            '"Your mother would have known what to say right now." He doesn\'t look at you. "I just keep thinking I broke the one thing I was ever good at. Getting home."',
            { if: { flag: 'npc.dad.sink_refused' }, text: '"You were right, that night. About the sink." He turns the cast a quarter turn in his lap, the way he turns a coffee cup. "I just couldn\'t hear it from you. Not from my kid."' },
          ],
          choices: [
            {
              text: '"You taught me how to fix things, Dad. Let me fix this one with you."',
              effects: [...PULLED_BACK, { npc: 'dad', affinity: 10 }],
              goto: 'dawn',
            },
            {
              text: 'Don\'t say anything. Drive him home. Stay the week.',
              effects: [...PULLED_BACK, { npc: 'dad', affinity: 8 }, { stat: 'stress', add: 6 }, { stat: 'energy', add: -10 }],
              goto: 'dawn_quiet',
            },
            {
              text: 'Tell him the truth: you\'re scared you\'re going to lose him too.',
              check: {
                skill: 'social',
                dc: 13,
                bonuses: [
                  { if: { trait: 'empath' }, add: 2, label: 'Empath' },
                  { if: KIM_CLOSE, add: 1, label: 'Kim is holding his other hand' },
                ],
                success: 'dawn_truth',
                fail: 'shut',
                successEffects: [...PULLED_BACK, { npc: 'dad', affinity: 12 }],
                failEffects: [{ npc: 'dad', affinity: -2 }, { flag: 'npc.dad.bad_wrist' }, { stat: 'mood', add: -8 }, { flag: DONE }],
              },
            },
          ],
        },
        dawn: {
          speaker: 'narrator',
          text: [
            'He is quiet for a long time. Then he holds up the cast and looks at it. "Can\'t hold a screwdriver for six weeks," he says. "Guess you\'ll have to hold it. I\'ll tell you where it goes."',
            'You drive him home. At the door he stops, and looks down Fifth toward the Lamplighter\'s sign, and then goes inside and doesn\'t look back.',
          ],
        },
        dawn_quiet: {
          speaker: 'narrator',
          text: [
            'You drive him home and you don\'t leave. You sleep on the couch. You make terrible eggs. On the third night he says, from the kitchen doorway, "You don\'t have to stay." On the fifth night he stops saying it.',
            'On the seventh morning he pours the last bottle in the cupboard down the sink himself, one-handed, while you pretend to read the paper. He rinses the sink afterwards, because your mother hated a sticky sink.',
          ],
        },
        dawn_truth: {
          speaker: 'dad',
          text: [
            'It comes out badly and all at once, the way true things do at six in the morning. He listens to all of it. Then he puts his good hand on the back of your neck, the way he did when you were small and had a fever.',
            '"I\'m still here, kid," he says. "I got lost for a while. I know the way back. I built half the streets." He almost laughs. "Paper streets. But I know them."',
          ],
        },
        shut: {
          speaker: 'dad',
          text: [
            'It comes out wrong. Too much, too fast, at six in the morning, in a room full of strangers. You watch it hit him like a draft from an open door.',
            '"Don\'t," he says. "Not here." He gets up, holding the cast against his chest, and asks the nurse to call him a cab. He tells you to go home and get some sleep. He says it kindly. He means it like a wall.',
            'He takes the cab to his building. You watch the taillights turn down Fifth. They don\'t turn toward the Lamplighter. Tonight.',
          ],
        },
        left: {
          speaker: 'narrator',
          text: [
            'You tell Doreen to send the bill to him. She writes it down without looking up, which is its own kind of judgment.',
            'You go home. You don\'t sleep. A week later Kim tells you he paid the first installment in person, in cash, in quarters and singles, at the cashier\'s window, with his cast. He didn\'t ask anybody for a ride.',
          ],
        },
      },
    },

    // ── The cast comes off ─────────────────────────────────────────────────
    {
      id: 'hood_dad_cast_off',
      channel: 'mail',
      title: 'cast off (typed with one hand, forgive me)',
      from: 'dad',
      start: 'letter',
      nodes: {
        letter: {
          text: [
            'kid,',
            'the cast came off today. the doctor says the wrist will never be quite right, it will tell me when it rains. i said it is port lumen, it is always going to rain. he did not laugh. doctors do not laugh.',
            'i went to the lamplighter one more time, to pay my tab. i ordered a ginger ale. the bartender looked at me like i had asked for a ginger ale.',
            { if: { obligation: ER_BILL }, text: 'i know whose name is on the hospital papers. i am paying you back. do not argue. there will be an envelope. it will be in the regular mail too.' },
            'thank you for the six weeks. i know what they cost.',
            'dad',
          ],
          choices: [
            { text: '"Proud of you, Dad. Ginger ale suits you."', effects: [{ flag: 'fac.hood.cast_off' }, { npc: 'dad', affinity: 4 }, { stat: 'mood', add: 5 }], goto: 'proud' },
            { text: '"Sunday dinner. I\'m cooking. You\'re supervising."', effects: [{ flag: 'fac.hood.cast_off' }, { npc: 'dad', affinity: 5 }, { faction: 'fac.hood', add: 2 }], goto: 'sunday' },
          ],
        },
        proud: { text: ['kid,', 'it does not suit me. it tastes like a penny. i am drinking it anyway.', 'dad'] },
        sunday: { text: ['kid,', 'i have seen you cook. i will bring pork chops as a backup. do not tell your sister she is invited, she will bring a salad on purpose.', 'dad'] },
      },
    },
  ],
})
