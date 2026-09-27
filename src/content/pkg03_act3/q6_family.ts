/**
 * PKG-03 — Act III main, beat 6: `main_a3_q6_family_crosshairs` (bible §6.C).
 *
 * A faction leverages your family. Two path-exclusive variants live inside this one quest (the
 * chain is q5 → q6 → q7, so a single quest id keeps the wiring clean): the KIM variant (`a3_family`)
 * when Mom is alive, and the MEMORY variant (`a3_family_memory`) when `w.mom_gone` — her memory
 * weaponized instead. Kim's `endangered` fate is set ONLY in the fail branch and is restorable in
 * Act IV.
 *
 * Fail branches (REDESIGN_V2 §D): failing either variant opens a second choice with a lasting mark.
 * Kim: the `pkg03_act3_checks_the_street` scar, then walk her to school (a six-week debuff,
 * `a3.kim_walked`, +2 on PKG-04's restore roll), send her to Ridgeport (`a3.kim_sent_away`), or pay
 * the favor (`a3.kim_favor_paid`: Aperture +8, w.enclosure +1, −2 on the restore roll). Memory: stand
 * up at the church basement (`a3.memory_defended`), hunt the source (the `pkg03_act3_holds_a_grudge`
 * scar, heat, a possible complication) or let it burn (`a3.memory_let_burn`, a long debuff).
 *
 * Cross-package ids referenced by exact bible id (owners in parentheses):
 *   flag life.family_shield (PKG-15), var side.cover (PKG-11), var w.mom_gone init (PKG-00),
 *   npc.grace romance (PKG-11).
 */
import { defineContent } from '@/engine/registry'
import type { Effect } from '@/engine/types'

/** If Grace is your partner and your cover is thin, your world may reach her. */
const graceCollateral: Effect = {
  if: { all: [{ npc: 'grace', romance: ['partner', 'engaged', 'married'] }, { var: 'side.cover', lte: 2 }] },
  then: [
    {
      chance: 0.5,
      then: [
        { npc: 'grace', fate: 'collateral' },
        { flag: 'npc.grace.collateral' },
        { notify: 'Your cover was too thin. Someone reached Grace to reach you. She\'s safe now — and she changed the locks.', kind: 'bad' },
      ],
    },
  ],
}

export default defineContent({
  quests: [
    {
      id: 'main_a3_q6_family_crosshairs',
      title: 'Family in the Crosshairs',
      kind: 'main',
      act: 3,
      priority: 30,
      summary:
        'They have finally read the one file they were never supposed to need: the people you love. Now they hold up the person you would do anything to protect, and ask, politely, what anything is worth.',
      rewards: 'Your family, defended or endangered',
      start: 'wait',
      stages: {
        wait: {
          text: 'It was always going to come to this. The machine learned who you are by learning who you would bleed for. Now someone means to use it.',
          hint: 'A little time. Then it comes home.',
          objectives: [
            { id: 'wait', text: 'Brace for it', when: { day: true, gte: 1850 }, hint: 'Keep the people you love close; it decides how much this hurts.' },
          ],
          next: [
            { if: { var: 'w.mom_gone', eq: 1 }, stage: 'memory' },
            { stage: 'kim' },
          ],
        },
        kim: {
          text: "They've put Kim in the frame — a scholarship application flagged, a scary phone call, a black car outside her school. Defuse it before it becomes real.",
          hint: 'Talk it down (Social) or out-maneuver the surveillance (Opsec). A family shield helps. Fail and Kim is endangered — but that can be undone later.',
          onEnter: [{ scene: 'a3_family' }],
          objectives: [
            { id: 'done', text: 'Defuse the threat to Kim', when: { flag: 'a3.family_resolved' }, hint: 'Follow the scene to a choice; both skills reach the same shot.' },
          ],
          onComplete: [{ flag: 'a3.kim_leveraged' }, { quest: 'main_a3_q7_the_vote', start: true }],
        },
        memory: {
          text: "Mom is gone, but they found a use for her anyway: a leaked hospital record, a whisper that the fundraiser was a scam, a threat to drag her name through it. Protect what's left of her.",
          hint: 'Shut it down with a cool head (Social) or by pulling the record yourself (Opsec). Failing costs you, but never her — she\'s already beyond their reach.',
          onEnter: [{ scene: 'a3_family_memory' }],
          objectives: [
            { id: 'done', text: "Protect your mother's memory", when: { flag: 'a3.family_resolved' }, hint: 'Follow the scene to a choice.' },
          ],
          onComplete: [{ flag: 'a3.kim_leveraged' }, { quest: 'main_a3_q7_the_vote', start: true }],
        },
      },
    },
  ],
  scenes: [
    {
      id: 'a3_family',
      channel: 'dialog',
      title: 'Kim in the Frame',
      start: 'open',
      nodes: {
        open: {
          speaker: 'narrator',
          text: [
            'It starts small and specific, the way real threats do. Kim\'s scholarship goes "under review." A man in a good coat asks her, at the bus stop, how her big sibling is doing. A black sedan idles outside the school two days running.',
            'The message is not subtle. They want you to know they can reach her whenever they like. They want you to feel it in your teeth.',
          ],
          choices: [
            {
              tag: '[Social DC 16]',
              text: 'Get the leverage-holder on the phone and make the cost of touching her clear.',
              check: {
                skill: 'social',
                dc: 16,
                bonuses: [{ if: { flag: 'life.family_shield' }, add: 2, label: '+2 (your family closes ranks)' }],
                success: 'saved',
                fail: 'failed',
              },
            },
            {
              tag: '[Opsec DC 16]',
              text: 'Scrub Kim out of every system that could be used against her, quietly.',
              check: {
                skill: 'opsec',
                dc: 16,
                bonuses: [{ if: { flag: 'life.family_shield' }, add: 2, label: '+2 (your family closes ranks)' }],
                success: 'saved',
                fail: 'failed',
              },
            },
          ],
        },
        saved: {
          speaker: 'narrator',
          text: [
            'You make it stop. However you did it — a threat returned with interest, a paper trail dissolved — the sedan doesn\'t come back, and the scholarship "review" quietly clears.',
            'Kim never quite learns how close it got. She notices you check the street now, though. She\'s started doing it too, and pretends she isn\'t.',
          ],
          effects: [
            { flag: 'a3.kim_protected' },
            { npc: 'kim', affinity: 10 },
          ],
          next: 'after',
        },
        failed: {
          speaker: 'narrator',
          text: [
            'You come up short, and they let you watch it land. Kim is safe — they were never going to hurt her, that was never the point — but she\'s a piece on the board now, and she knows it.',
            'She sleeps with the light on. She\'s stopped joking about your "other job." That silence is the price, and it is yours.',
          ],
          effects: [{ npc: 'kim', fate: 'endangered' }, { trait: 'pkg03_act3_checks_the_street' }],
          next: 'failed_choice',
        },
        failed_choice: {
          speaker: 'kim',
          text: [
            'She calls you from the school office phone, because she does not trust her own anymore. "The car was there again. Same man. He waved." A breath. "He knew my locker number. What do I do? What do YOU do? Because you\'re going to do something. I can hear it."',
          ],
          choices: [
            {
              tag: '[Bodyguard]',
              text: '"Nothing, today. Tomorrow I walk you to school. And the day after. Until the car stops coming."',
              effects: [
                {
                  buff: {
                    id: 'pkg03_act3_walking_kim',
                    name: 'Walking Kim to School',
                    desc: 'Every morning at 7:15, the long way, checking reflections in shop windows. Your days start late and tired.',
                    days: 42,
                    bad: true,
                    mods: [
                      { key: 'efficiency', mult: 0.92 },
                      { key: 'stress.relief', mult: 0.9 },
                    ],
                  },
                },
                { npc: 'kim', affinity: 6 },
                { flag: 'a3.kim_walked' },
              ],
              goto: 'walked',
            },
            {
              tag: '[Send her away · $2,500]',
              text: '"Pack for a semester. Aunt Thuy in Ridgeport has a spare room and no internet. I\'ll cover everything."',
              effects: [
                { money: -2500 },
                { npc: 'kim', affinity: -6 },
                { npc: 'mom', affinity: -4 },
                { flag: 'a3.kim_sent_away' },
              ],
              goto: 'sent',
            },
            {
              tag: '[Pay them]',
              text: 'Call the number the man in the good coat left. Ask what the one small favor is. Do it, once.',
              effects: [
                { faction: 'fac.aperture', add: 8 },
                { var: 'w.enclosure', add: 1 },
                { stat: 'stress', add: 8 },
                { flag: 'a3.kim_favor_paid' },
              ],
              goto: 'paid',
            },
          ],
        },
        walked: {
          speaker: 'narrator',
          text: [
            'Six weeks of 7:15 a.m. You learn the route by heart: the bakery with the reflective window, the corner where the bus shelter shows you the whole street behind you. Kim pretends to be mortified and walks closer to you than she has since she was nine.',
            'On the thirty-first morning the sedan is not there. On the thirty-second it is not there either. You keep walking her anyway, for another ten days, because you are not an idiot, and because it turns out you like it.',
          ],
          next: 'after',
        },
        sent: {
          speaker: 'narrator',
          text: [
            'Kim goes to Ridgeport with two duffel bags and a look that says she will be bringing this up at every family dinner for the rest of your life. Mom does not speak to you for a week, and then speaks to you for an hour, which is worse.',
            'She is safe, in a house with a rotary phone and a great-aunt who watches game shows at full volume. She writes you one letter. It says: "I hate it here. Thank you. Don\'t make it weird."',
          ],
          next: 'after',
        },
        paid: {
          speaker: 'narrator',
          text: [
            'The favor is small, the way the first one always is. A door left unlocked on a system you were going to be near anyway. Nobody gets hurt that you can see. The sedan is gone by Friday and the scholarship "review" clears on Monday.',
            'Kim never learns what it cost. You learn it every time a warm voice on the phone says your first name like it belongs to them now.',
          ],
          next: 'after',
        },
        after: {
          speaker: 'narrator',
          text: 'You sit with it a while, in the dark, listening to the house. Whatever else this decade has taught you, this is the lesson that finally sticks: access is intimacy, and they have all of yours.',
          effects: [graceCollateral, { flag: 'a3.family_resolved' }],
        },
      },
    },
    {
      id: 'a3_family_memory',
      channel: 'dialog',
      title: "Your Mother's Name",
      start: 'open',
      nodes: {
        open: {
          speaker: 'narrator',
          text: [
            'They can\'t threaten Mom. So they threaten her memory instead. A hospital record surfaces where it shouldn\'t. A whisper starts that the Row\'s fundraiser for her was some kind of scam. A voice on the phone offers to make it all go away, for the right cooperation.',
            'It is a smaller, meaner cruelty than a black sedan. It works on you anyway.',
          ],
          choices: [
            {
              tag: '[Social DC 16]',
              text: 'Answer cold. Make it clear her name is not a lever you will let them pull.',
              check: {
                skill: 'social',
                dc: 16,
                bonuses: [{ if: { faction: 'fac.hood', gte: 20 }, add: 2, label: '+2 (the Row would not stand for it)' }],
                success: 'saved',
                fail: 'failed',
              },
            },
            {
              tag: '[Opsec DC 16]',
              text: 'Pull the leaked record yourself and salt the ground so it can never be used.',
              check: {
                skill: 'opsec',
                dc: 16,
                bonuses: [{ if: { faction: 'fac.hood', gte: 20 }, add: 2, label: '+2 (the Row would not stand for it)' }],
                success: 'saved',
                fail: 'failed',
              },
            },
          ],
        },
        saved: {
          speaker: 'narrator',
          text: [
            'You shut it down. The record goes back where it belongs and stays there; the whisper dies for lack of oxygen. Her name is safe, and small, and yours.',
            'You visit the windowsill where her reading glasses still sit. Nobody has moved them. Nobody will.',
          ],
          effects: [{ npc: 'kim', affinity: 4 }],
          next: 'after',
        },
        failed: {
          speaker: 'narrator',
          text: [
            'You can\'t stop all of it. The whisper gets loose for a week and does its ugly little work before it fades. It costs you sleep and something harder to name.',
            'It doesn\'t reach her. She is past their reach, the only person in your life who finally is. That is the one clean thing left, and you hold onto it.',
          ],
          effects: [{ stat: 'stress', add: 10 }, { faction: 'fac.hood', add: -5 }, { npc: 'dad', affinity: -3 }],
          next: 'failed_choice',
        },
        failed_choice: {
          speaker: 'narrator',
          text: [
            'The whisper reaches the Row by Sunday. Somebody\'s cousin heard the fundraiser money went "somewhere." The jar by the Cathode register, the one with her photo taped to it, gets moved behind the pie case. Dad hears about it at the hardware store and comes home and sits in the car for an hour.',
            'You can let it run its course. Or you can do something about it, and live with what doing something makes you.',
          ],
          choices: [
            {
              tag: '[Stand up]',
              text: 'Go to the church basement on Thursday, stand up in front of the whole Row, and read the receipts out loud.',
              effects: [
                { stat: 'energy', add: -15 },
                { stat: 'stress', add: 4 },
                { faction: 'fac.hood', add: 8 },
                { npc: 'dad', affinity: 6 },
                { flag: 'a3.memory_defended' },
              ],
              goto: 'stood_up',
            },
            {
              tag: '[Hunt]',
              text: 'Find whoever started it. Make them understand exactly whose mother they picked.',
              effects: [
                { trait: 'pkg03_act3_holds_a_grudge' },
                { stat: 'heat', add: 8 },
                { flag: 'a3.memory_hunted' },
                { chance: 0.3, then: [{ complication: 'hack' }] },
              ],
              goto: 'hunted',
            },
            {
              tag: '[Let it burn out]',
              text: 'Say nothing. Whispers die if you don\'t feed them. You have too much else on fire.',
              effects: [
                { faction: 'fac.hood', add: -6 },
                { npc: 'dad', affinity: -6 },
                {
                  buff: {
                    id: 'pkg03_act3_the_whisper',
                    name: 'The Whisper',
                    desc: 'You keep hearing it in the diner, at the laundromat, in the pause before someone says hello. It is fading. Slowly.',
                    days: 45,
                    bad: true,
                    mods: [{ key: 'mood.daily', add: -1 }],
                  },
                },
                { flag: 'a3.memory_let_burn' },
              ],
              goto: 'let_burn',
            },
          ],
        },
        stood_up: {
          speaker: 'narrator',
          text: [
            'Folding chairs, burnt coffee, forty people who knew her. You read every receipt: the pharmacy, the specialist, the parking at Harbor General that cost more than the gas to get there. Your voice cracks on the ninth one. Nobody looks away.',
            'Mrs. Alvarez stands up after you and says, "Linh fed half this room," and sits down, and that is the end of the whisper. Dad drives you home and does not say anything, and puts his hand on the back of your neck at a red light, the way he did when you were small.',
          ],
          next: 'after',
        },
        hunted: {
          speaker: 'narrator',
          text: [
            'It takes you four nights. The whisper started at a reputation-management outfit in Millgate — two rooms, a water cooler, a client list that reads like a menu of people who needed someone else to look bad. PARALLAX had sold them a list of pressure points, and your mother was on it, filed under "leverage, grief."',
            'You make sure they understand. You are careful about how. You are less careful about how it feels, and you notice that you enjoyed it, and you notice that noticing did not stop you.',
          ],
          next: 'after',
        },
        let_burn: {
          speaker: 'narrator',
          text: [
            'You let it burn. It burns for a month. The jar stays behind the pie case until Sal moves it back out without a word, and by then some people on the Row have already decided what they believe.',
            'Dad stops asking you to Sunday dinner for a while. He does not say why. He does not have to.',
          ],
          next: 'after',
        },
        after: {
          speaker: 'narrator',
          text: 'Grief, it turns out, is also an attack surface. You add it to the list of things this city taught you to defend.',
          effects: [{ flag: 'a3.family_resolved' }],
        },
      },
    },
  ],
})
