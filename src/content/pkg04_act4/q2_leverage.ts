/**
 * PKG-04 — `main_a4_q2_last_leverage` (bible §6.D): CP-D1, then the `finales` sequencing stage.
 *
 * CP-D1 sets `a4.leverage` (str), the ending matrix's PRIMARY key. Every option is always offered;
 * evidence only unlocks or strengthens options (a publish with no evidence routes to E1's hoax cut).
 *
 * The `finales` stage waits for each arc's Act IV finale to resolve. Those quests are owned by
 * other packages (fac_loft_q6 PKG-05, fac_aperture_q6 PKG-06, fac_bureau_q6 / fac_cage_q3 PKG-07,
 * fac_halcyon_q5/q6 PKG-09, fac_hood_q5 PKG-10). An objective latches when its finale completes or
 * fails, or when the finale is still unstarted a few days into the stage (its autoStart would have
 * fired by then if its prerequisites held); an arc that IS running must finish before the ending.
 * `trig_a4_finale_clock` counts the days, and a 150-day failsafe keeps a stalled arc from holding the
 * ending hostage.
 *
 * CP-D1 E hands off to PKG-06's single "Made" scene, which sets `a4.leverage='made'` only if you take
 * the chair; any other answer brings CP-D1 back (minus the chair) via `trig_a4_made_refused`.
 */
import { DAYS_PER_STEP } from '@/engine/balance'
import { defineContent } from '@/engine/registry'
import type { Choice, Cond, ObjectiveDef, QuestDef } from '@/engine/types'
import { all, any, flag, not } from './shared'

const Q = 'main_a4_q2_last_leverage'

/** Days spent in the `finales` stage, counted by `trig_a4_finale_clock`. */
const waited = (days: number): Cond => ({ var: 'a4.finale_wait', gte: days })

/** An arc's Act IV finale has finished (either way). */
const resolved = (quest: string): Cond => ({ quest, status: ['completed', 'failed'] })
/** Never started. ('inactive' must be passed alone, not in an array.) */
const inactive = (quest: string): Cond => ({ quest, status: 'inactive' })
/**
 * "Settled": finished, or still not begun a few days into the stage (its autoStart would have fired
 * within the hour if its prerequisites held, so it is not coming). The 150-day clause is a last-resort
 * failsafe so a stalled arc can never hold the ending hostage.
 */
const settled = (quest: string, extra?: Cond): Cond => ({
  any: [resolved(quest), all(inactive(quest), waited(3), ...(extra ? [extra] : [])), waited(150)],
})

const finaleObjective = (id: string, text: string, when: Cond, hint: string): ObjectiveDef => ({ id, text, when, hint })

/** Kroll's chair is on the table: she wants you, she is free, Aperture stands, and you have not already answered her. */
const madeOpen: Cond = all(
  flag('npc.kroll.wants_you'),
  { npc: 'kroll', fateNot: ['arrested', 'flips', 'dead'] },
  not(flag('w.aperture_state', 'destroyed')),
)
const madeAnswered: Cond = any(flag('fac.aperture.made_done'), { quest: 'fac_aperture_q6_made', status: ['active', 'completed', 'failed'] })

/** Trusted hands for the handoff (bible §10 E3: available and affinity ≥ 50). */
const priyaHands: Cond = all({ npc: 'priya', met: true }, { npc: 'priya', affinityGte: 50 }, { npc: 'priya', fateNot: ['broken', 'dead'] })
const reyesHands: Cond = all({ npc: 'reyes', met: true }, { npc: 'reyes', affinityGte: 50 }, { npc: 'reyes', fateNot: ['nemesis', 'dead'] })
const corvidHands: Cond = all({ npc: 'corvid', met: true }, { npc: 'corvid', affinityGte: 50 }, { npc: 'corvid', fateNot: ['dead', 'martyred', 'bought', 'exile'] })

const quest: QuestDef = {
  id: Q,
  title: 'The Last Leverage',
  kind: 'main',
  act: 4,
  priority: 100,
  rewards: 'The choice that names your ending',
  summary: [
    'You have spent a decade collecting the truth in pieces, and paying for each piece with something you cannot get back. Now there is only one question left, and it has never had a good answer: what is the truth for?',
    'Decide. Then let every thread you started finish braiding itself, and go through the copper.',
  ],
  start: 'leverage',
  stages: {
    leverage: {
      text: 'Everything you know, in one place at last, on a corkboard or in your head or in a shoebox under the bed. The city is asleep. Nobody is telling you what to do with it. For the first time in ten years, the next move is entirely yours.',
      onEnter: [{ scene: 'a4_leverage', delayHours: 8 }],
      objectives: [
        {
          id: 'chose',
          text: 'Decide what the truth is for',
          when: any(flag('a4.leverage_done'), flag('a4.leverage', 'made')),
          hint: 'A dialog opens on its own. Publish, bury, sell, hand it off, take Kroll\'s seat, burn it all down, or decide nothing at all.',
        },
      ],
      onComplete: [{ flag: 'a4.leverage_done' }],
      next: [{ if: flag('a4.leverage', 'bonfire'), stage: 'bonfire_wait' }, { stage: 'finales' }],
    },
    bonfire_wait: {
      text: 'You chose the bonfire. Before the ending can come, the fires have to be set: three sabotages, each one a bridge you are burning on purpose. Light them.',
      objectives: [
        { id: 'burned', text: 'Set all three fires', when: flag('a4.bonfire_done'), hint: 'Open the Bonfire quest in your journal and complete its three sabotage objectives.' },
      ],
      next: 'finales',
    },
    finales: {
      text: 'The choice is made. Now the threads finish on their own: the scene, the machine, the badge, the boardroom, the neighborhood. Live your days; each one resolves when it is ready. Nothing you started will be left hanging.',
      onEnter: [{ var: 'a4.finale_wait', set: 0 }],
      objectives: [
        finaleObjective(
          'loft',
          'The scene decides what it becomes',
          settled('fac_loft_q6_last_commons', not({ quest: 'fac_loft_q5_sysop', status: 'active' })),
          'If the Loft\'s sysop question is settled, its last chapter follows: rebuild the commons clean, or hold its funeral.',
        ),
        finaleObjective('aperture', 'Aperture\'s last offer is answered', settled('fac_aperture_q6_made'), 'Only if you chose to take Kroll\'s meeting. Otherwise this settles itself.'),
        finaleObjective(
          'bureau',
          'The Bureau keeps or dismantles the machine',
          settled('fac_bureau_q6_seize_or_serve'),
          'If you are the Bureau\'s asset, decide whether the surveillance is kept for the state or dismantled under a court.',
        ),
        finaleObjective(
          'halcyon',
          'The ladder\'s last rung',
          all(settled('fac_halcyon_q5_handcuffs'), settled('fac_halcyon_q6_founders')),
          'If you are still climbing at Halcyon, Vale has one last offer. If you walked out with Priya, finish founding something clean.',
        ),
        finaleObjective('cage', 'Detective Calderon closes her file', settled('fac_cage_q3_clean_arrest'), 'If you fed the Cage a real case, Calderon has one arrest left to make.'),
        finaleObjective(
          'hood',
          'Coming home',
          settled('fac_hood_q5_coming_home', { day: true, gte: 3101 }),
          'Close things with the Row. Marge\'s keys to the copper are here, one way or another.',
        ),
      ],
      onComplete: [{ quest: 'main_a4_q3b_the_exchange', start: true }],
    },
  },
}

const choiceNone: Choice = {
  text: '[Decide nothing.] Leave it on the table. Walk into the copper and let the night decide for you.',
  effects: [
    { flag: 'a4.leverage', set: 'none' },
    { flag: 'a4.leverage_done' },
    { log: 'You did not decide. The fog decides for people who do not.', kind: 'story' },
  ],
  goto: 'none_confirm',
}

export default defineContent({
  quests: [quest],
  triggers: [
    {
      id: 'trig_a4_finale_clock',
      once: false,
      atHour: 2,
      cooldownDays: 1,
      when: { quest: Q, status: 'active', stage: 'finales' },
      effects: [{ var: 'a4.finale_wait', add: DAYS_PER_STEP }],
    },
    {
      // Kroll's chair was answered with anything but "yes": CP-D1 comes back around, minus her seat.
      id: 'trig_a4_made_refused',
      when: all(
        { quest: Q, status: 'active', stage: 'leverage' },
        flag('fac.aperture.made_done'),
        not(flag('a4.leverage', 'made')),
        not(flag('a4.leverage_done')),
      ),
      effects: [{ scene: 'a4_leverage', delayHours: 12 }],
    },
  ],
  scenes: [
    {
      id: 'a4_leverage',
      channel: 'dialog',
      title: 'What the Truth Is For',
      start: 'open',
      pause: true,
      nodes: {
        open: {
          speaker: 'narrator',
          text: [
            'You lay it all out one last time. Ten years of it.',
            {
              if: flag('end.has_evidence'),
              text: 'And it holds. Whatever you decide, you can make it stick: nobody alive can call this a hoax.',
              else: 'And it does not quite hold. You have the shape of the truth but not the weight of it; a story, not a proof. Some doors on this table are open anyway. Some of them, if you walk through, will slam behind you and be called a lie.',
            },
            {
              if: flag('npc.oracle.is_kroll'),
              text: 'The Oracle\'s last words are still in your ears. Do it through the copper. Even the market wants insurance.',
              else: 'The Oracle\'s last words are still in your ears. Do it through the copper. That\'s the door they forgot they left open.',
            },
            {
              if: all(flag('fac.aperture.made_done'), not(flag('a4.leverage', 'made'))),
              text: 'You walked out of the Cathode without Kroll\'s chair. The corkboard is exactly where you left it, and it is still waiting for an answer.',
            },
            // What Act III's failed rolls left on the table (REDESIGN_V2 §D).
            { if: flag('a3.owes_kroll'), text: 'Your phone is face-down beside the corkboard. Kroll has not called in a month, since Meridian, since the footage became a maintenance glitch. That is how you know she is about to.' },
            { if: flag('a3.burned_came_in'), text: 'Reyes left a voicemail last week, three words long: "Call me first." A cooperating individual is expected to.' },
            {
              if: all({ trait: 'pkg03_act3_on_the_tape' }, not(flag('a3.tape_contained'))),
              text: 'And there is the tape. Whatever you decide tonight, a federal locker already holds one version of you, talking freely. You are only choosing which version gets to be the last.',
            },
            'So. What is it for?',
          ],
          choices: [
            {
              text: '[Publish everything.] Put it all where everyone can see it. Let the chips fall on the guilty and on you.',
              effects: [
                { flag: 'a4.leverage', set: 'publish' },
                { flag: 'a4.leverage_done' },
                {
                  if: flag('end.has_evidence'),
                  then: [{ log: 'You are going to publish. This is the Reckoning.', kind: 'story' }],
                  else: [{ log: 'You are going to publish without proof. Pray it isn\'t called a hoax.', kind: 'bad' }],
                },
              ],
              goto: 'publish_confirm',
            },
            {
              text: '[Bury it.] Lock it away, live a quiet life, let the machine grind on without you in it.',
              effects: [
                { flag: 'a4.leverage', set: 'bury' },
                { flag: 'a4.leverage_done' },
                { log: 'You are going to bury it. Some peace is worth the price.', kind: 'story' },
              ],
              goto: 'bury_confirm',
            },
            {
              text: '[Sell it.] Retire rich and dirty. The truth is worth more to the people it would ruin than to anyone else.',
              effects: [
                { money: 250000 },
                { flag: 'a4.leverage', set: 'sell' },
                { flag: 'a4.leverage_done' },
                { var: 'w.enclosure', add: 1 },
                { log: 'You sold it. You are going to be very rich, and very alone.', kind: 'money' },
              ],
              goto: 'sell_confirm',
            },
            {
              text: '[Hand it off.] Give it to the one person who will use it right, and step out of the story.',
              req: all(flag('end.has_evidence'), any(priyaHands, reyesHands, corvidHands)),
              reqText: 'Requires proof that holds, and someone you trust (Priya, Reyes or Corvid) at 50+ affinity and still in reach',
              goto: 'handoff_pick',
            },
            {
              text: '[Kroll\'s "Made" offer.] Take her seat. Become Special Accounts. Win the game the world actually plays.',
              if: not(madeAnswered),
              req: madeOpen,
              reqText: 'Requires Kroll wanting you for her seat, still free, and Aperture still standing',
              effects: [{ log: 'You are taking the meeting. God help you.', kind: 'story' }],
              goto: 'made_launch',
            },
            {
              text: '[Burn them all.] The Bonfire. Turn every faction against every other and salt the earth behind you.',
              effects: [
                { flag: 'a4.leverage', set: 'bonfire' },
                { flag: 'a4.leverage_done' },
                { quest: 'main_a4_q2b_bonfire', start: true },
                { log: 'The Bonfire. You are going to end all of them, and probably yourself.', kind: 'bad' },
              ],
              goto: 'bonfire_confirm',
            },
            choiceNone,
          ],
        },
        publish_confirm: {
          speaker: 'narrator',
          text: [
            { if: flag('a2.spine', 'loft'), text: 'You will do it the Loft way: leak it wide, no byline, let the city read it raw. Robin Hood, if Robin Hood used a modem.' },
            { if: flag('a2.spine', 'bureau'), text: 'You will do it the Bureau way: a clean chain of custody, a court, a witness stand with your name on the docket.' },
            { if: all(not(flag('a2.spine', 'loft')), not(flag('a2.spine', 'bureau'))), text: 'You will do it as yourself: one civilian with the whole truth and no institution to hide behind.' },
            'It has to go through the copper to land clean. One last run. After that, there is no unpublishing a city.',
          ],
        },
        bury_confirm: {
          speaker: 'narrator',
          text: 'You put it in the shoebox. You put the shoebox somewhere even you will have trouble finding. The relief is immediate and enormous and, underneath it, something you will be arguing with for the rest of your life. But tonight you will sleep.',
        },
        sell_confirm: {
          speaker: 'narrator',
          text: 'The wire clears before dawn. It is more money than the mill paid your father in thirty years. You feel the weight of it settle over you like a very good coat in a very cold country you did not want to move to.',
        },
        handoff_pick: {
          speaker: 'narrator',
          text: 'Someone you trust. Someone who will finish what you could never finish clean, because they still believe finishing is possible. Who gets the whole truth, and your place in the story with it?',
          choices: [
            {
              text: 'Priya. She wrote the first true report and watched it die in a drawer. Let her write the last one.',
              if: priyaHands,
              effects: [
                { flag: 'a4.leverage', set: 'handoff' },
                { flag: 'a4.leverage_done' },
                { flag: 'a4.handoff_to', set: 'priya' },
              ],
              goto: 'handoff_confirm',
            },
            {
              text: 'Reyes. She has read everything and kept her notebook. Give her the case she was never allowed to make.',
              if: reyesHands,
              effects: [
                { flag: 'a4.leverage', set: 'handoff' },
                { flag: 'a4.leverage_done' },
                { flag: 'a4.handoff_to', set: 'reyes' },
              ],
              goto: 'handoff_confirm',
            },
            {
              text: 'Corvid. She kept the commons for twenty years. Trust her to know what to do with a truth this big.',
              if: corvidHands,
              effects: [
                { flag: 'a4.leverage', set: 'handoff' },
                { flag: 'a4.leverage_done' },
                { flag: 'a4.handoff_to', set: 'corvid' },
              ],
              goto: 'handoff_confirm',
            },
            {
              text: 'On second thought — keep it yourself, for now.',
              goto: 'open',
            },
          ],
        },
        handoff_confirm: {
          speaker: 'narrator',
          text: 'You make the copy. One copy, encrypted the way Mira taught you, addressed to a person instead of the world. It still has to go through the copper: even a handoff needs the one clean line out. After that, you become a story other people tell.',
        },
        made_launch: {
          speaker: 'narrator',
          text: [
            'You page the number she gave you years ago and never used. It rings once.',
            '"There you are," says Kroll\'s voice, warm as a fire in a house you cannot afford. "I was starting to think I\'d read you wrong. Come see me. We have a chair to discuss."',
            'You take the meeting. Whether you take the chair is a conversation for a booth at the Cathode, and she already knows which booth.',
          ],
          // The seat-taking scene belongs to PKG-06 (fac_aperture_q6_made): taking the chair there sets
          // a4.leverage='made' and npc.kroll.made_you. Any other answer sets fac.aperture.made_done
          // without a lane, and trig_a4_made_refused brings CP-D1 back around.
          effects: [{ quest: 'fac_aperture_q6_made', start: true }],
        },
        none_confirm: {
          speaker: 'narrator',
          text: 'You leave it all on the table, pinned and labeled and unanswered, and put on your coat. Maybe the right move will be obvious once your hands are on the wire. People have told themselves that about every fork in every road, and some of them were even right.',
        },
        bonfire_confirm: {
          speaker: 'narrator',
          text: 'You start making the calls. A word to the Bureau about Aperture. A word to Aperture about the Loft. A word to the Loft about who really talked. Each one is true. Each one is a match. By the time you are done, the whole city will be too busy burning to look at you — or that is the plan.',
        },
      },
    },
  ],
})
