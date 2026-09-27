/**
 * PKG-02 — the Oracle's IIb drops (bible §4.5, §6.B).
 *
 * The conspiracy's whisper begins reaching you in Act IIb: drop 1 three weeks after Kroll's dinner
 * (CP-B1), drop 2 once you've dug up enough to be worth warning (w.exposure ≥ 2), drop 3 after the
 * first raid at exposure ≥ 3. Two-to-three escalating,
 * unanswerable pages, each opening the channel (a2.oracle_contact) that side_konami_contact (PKG-13)
 * and the Act III reveal build on. The Oracle's true identity is resolved later by PKG-03.
 *
 * PKG-02 owns: scenes a2_oracle_drop1/2/3, their delivery triggers, flag a2.oracle_contact.
 *
 * Fail branch: a failed trace on drop 1 turns the trail around (a2.oracle_trace_burned: heat, a
 * chance of a 'hack' complication, and drops 2–3 remember that you're on someone's list now).
 */
import { defineContent } from '@/engine/registry'
import type { Effect, SceneDef, TriggerDef } from '@/engine/types'

const openChannel: Effect[] = [{ flag: 'a2.oracle_contact' }]

const drop1: SceneDef = {
  id: 'a2_oracle_drop1',
  channel: 'chat',
  title: 'unknown sender',
  from: 'oracle',
  pause: false,
  start: 'msg',
  nodes: {
    msg: {
      speaker: 'oracle',
      text: [
        'a window opens in the pager that you did not open.',
        { if: { flag: 'a2.refused_kroll' }, text: '"you told vanessa kroll no. people don\'t. that makes you interesting to her, and interesting is not a safe thing to be."', else: '"you had dinner at the top of the meridian tower. the salmon is excellent. the bill is not paid in money."' },
        { if: { flag: 'a2.double_dealer' }, text: '"and you kept a copy. clever. hide it better than you think you need to."' },
        '"you think aperture is the top of this. aperture is a cost center. look at who insures the risk. no — don\'t reply. this channel is already too warm."',
      ],
      effects: openChannel,
      next: 'reply',
    },
    reply: {
      speaker: 'player',
      text: 'The cursor blinks. There\'s no handle, no address, no anything — just words from a nowhere that knows exactly what you\'ve been doing.',
      choices: [
        { text: '"Who is this?"', goto: 'gone' },
        { text: '"Insures the risk. Say more."', goto: 'gone' },
        {
          text: 'Trace the window back before it closes.',
          tag: '[Trace]',
          check: {
            skill: 'networking',
            dc: 16,
            success: 'traced',
            fail: 'trace_burned',
            successEffects: [{ var: 'w.exposure', add: 1 }, { xp: 'networking', add: 25 }],
            // Fail: the trail turns around. Whoever watches the Oracle now watches your line too
            // (a2.oracle_trace_burned is read by drops 2 and 3).
            failEffects: [
              { stat: 'stress', add: 4 },
              { stat: 'heat', add: 6 },
              { flag: 'a2.oracle_trace_burned' },
              { chance: 0.35, then: [{ complication: 'hack' }] },
            ],
          },
        },
      ],
    },
    traced: {
      speaker: 'narrator',
      text: 'You get three hops back before the trail dissolves — a relay in Millgate, a relay on the Hill, and then a hop that answers to a NorthLink block that isn\'t in any directory you\'ve ever seen. Whoever this is, they live inside the pipes. You write the block down on the inside of your wrist like a phone number.',
    },
    trace_burned: {
      speaker: 'narrator',
      text: [
        'You get two hops back — a relay in Millgate, a relay on the Hill — and then the trail does something trails don\'t do. It turns around. For three long seconds something on the far side of the relay looks straight back down the line at you, and your modem light stutters like a held breath.',
        'The window closes. In the morning there\'s a form letter from NorthLink about "unusual session activity on your account." You weren\'t the only one watching that channel. And now someone else knows where it goes when it goes home: your place.',
      ],
    },
    gone: {
      speaker: 'narrator',
      text: 'The window closes itself before your reply finishes sending. Your attempt to capture it saves as a black rectangle. Whoever that was, they were gone before you started typing — and now you can\'t stop thinking about the word insures.',
    },
  },
}

const drop2: SceneDef = {
  id: 'a2_oracle_drop2',
  channel: 'chat',
  title: 'unknown sender',
  from: 'oracle',
  pause: false,
  start: 'msg',
  nodes: {
    msg: {
      speaker: 'oracle',
      text: [
        'it\'s late. the pager lights up on its own.',
        '"they call it PARALLAX. a number for every person in this city — how much they cost, how much they\'ll pay, how likely they are to make trouble. insurers buy it. a federal office rents it. a nice software company launders the smell off it."',
        '"kroll takes you to dinner because dinner is cheaper than a lawsuit. she is a face they put on it. faces are replaceable. remember that when you start to like her."',
        {
          if: { flag: 'a2.oracle_trace_burned' },
          text: '"and don\'t chase me again. last time you followed me back, the people who watch me followed YOU. your line is on a list now. that one\'s my fault — i was traceable. it won\'t happen twice."',
        },
      ],
      effects: openChannel,
      next: 'reply',
    },
    reply: {
      speaker: 'player',
      text: 'You\'re wide awake now. The room is very quiet, and the modem light on your rig is blinking when nothing should be talking to it.',
      choices: [
        { text: '"Why are you telling me?"', goto: 'gone' },
        { text: '"You want me to do something. What?"', goto: 'gone' },
        { text: 'Unplug the modem. Just to be sure.', effects: [{ stat: 'stress', add: 3 }], goto: 'gone' },
      ],
    },
    gone: {
      speaker: 'narrator',
      text: '"not yet," the last line says, and then the window is gone, and the modem light goes still, and you sit in the dark deciding whether you imagined the whole thing. You didn\'t. You know you didn\'t. That\'s the worst part.',
    },
  },
}

const drop3: SceneDef = {
  id: 'a2_oracle_drop3',
  channel: 'chat',
  title: 'unknown sender',
  from: 'oracle',
  pause: false,
  start: 'msg',
  nodes: {
    msg: {
      speaker: 'oracle',
      text: [
        '3:12 a.m. the exact time the botnet on that grandmother\'s pc used to phone home. the pager wakes you.',
        '"you\'re getting closer, and they\'re getting curious about you. that cuts both ways. a system that scores everyone eventually asks what YOU would score. what you\'d be worth. what seat you\'d fill."',
        '"i can\'t tell you who i am yet — for your sake more than mine. but soon you\'ll have earned the whole shape of it, and then you\'ll wish you hadn\'t. sleep while you still sleep."',
        {
          if: { flag: 'a2.oracle_trace_burned' },
          text: '"your line is still on their list, by the way. since the night you chased me. every time you dial in, a small light blinks on a desk you will never see."',
        },
      ],
      effects: openChannel,
      next: 'reply',
    },
    reply: {
      speaker: 'player',
      text: 'The timestamp is a message all its own. Whoever this is, they know about the Grandma Job. They know the thing you thought only you noticed.',
      choices: [
        { text: '"You know about the botnet. How?"', goto: 'gone' },
        { text: '"When do I get the whole shape?"', goto: 'gone' },
        { text: 'Say nothing. Just watch the channel, and wait.', goto: 'gone' },
      ],
    },
    gone: {
      speaker: 'narrator',
      text: 'No answer comes. The channel stays open a long moment, humming with someone\'s attention, and then it lets you go. You don\'t sleep. You lie in the dark doing the arithmetic they left you: what would a machine that reads a whole city decide you were worth?',
    },
  },
}

// Drop 1 is delivered by main_a2_q1 (three weeks after Kroll's dinner — "after CP-B1").
const triggers: TriggerDef[] = [
  {
    id: 'trig_oracle_drop2',
    once: true,
    atHour: 22,
    when: { all: [{ seen: 'a2_oracle_drop1' }, { var: 'w.exposure', gte: 2 }] },
    effects: [{ scene: 'a2_oracle_drop2' }],
  },
  {
    id: 'trig_oracle_drop3',
    once: true,
    atHour: 3,
    when: { all: [{ seen: 'a2_oracle_drop2' }, { seen: 'a2_the_raid' }, { var: 'w.exposure', gte: 3 }] },
    effects: [{ scene: 'a2_oracle_drop3' }],
  },
]

export default defineContent({
  scenes: [drop1, drop2, drop3],
  triggers,
})
