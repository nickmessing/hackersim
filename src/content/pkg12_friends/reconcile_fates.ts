/**
 * PKG-12 — the two friend-fate seeds the bible assigns to this package that the rest of the
 * friends content doesn't write on its own (§4.6 table, §11 ownership rows, §13 PKG-12 "Sets").
 *
 *  - `npc.deadline.relapse` — "you pull him into one last job." Taking Deadline on the Meridian
 *    crew (PKG-03 sets `a3.crew_deadline`) is exactly that job. Once the heist has resolved, the
 *    old man sends one tired message, and the relapse is recorded. A Deadline you already saved
 *    (`npc.deadline.saved_you`) is past relapsing: his fate chain resolves to `saves_you` first.
 *  - `npc.byteme.turns_set` — "feels used, becomes a Bureau tip." A kid you taught the quiet stuff
 *    (`npc.byteme.used`), never scared straight (`side.byteme_careful`), and then let drift out of
 *    your life by Act III goes looking for someone who'll call him back. Someone at the Bureau does.
 *
 * PKG-04's fate table (fates.ts) reads both flags when it assembles the epilogue; the Deadline
 * health beat reads the recorded `relapse` fate.
 */
import { defineContent } from '@/engine/registry'
import type { Cond } from '@/engine/types'

const deadlineRelapses: Cond = {
  all: [
    { flag: 'a3.crew_deadline' },
    { flag: 'a3.heist_resolved' },
    { not: { flag: 'npc.deadline.saved_you' } },
    { npc: 'deadline', fateNot: ['passed', 'missing', 'dead', 'saves_you'] },
  ],
}

const bytemeTurns: Cond = {
  all: [
    { var: 'act', gte: 3 },
    { flag: 'npc.byteme.used' },
    { not: { flag: 'side.byteme_careful' } },
    { npc: 'byteme', met: true, affinityLte: 25, fateNot: ['dead', 'arrested_young', 'missing', 'turns'] },
  ],
}

export default defineContent({
  triggers: [
    {
      id: 'trig_friends_deadline_relapse',
      when: deadlineRelapses,
      atHour: 23,
      effects: [
        { flag: 'npc.deadline.relapse' },
        { npc: 'deadline', fate: 'relapse' },
        { scene: 'friends_deadline_one_last_job' },
      ],
    },
    {
      id: 'trig_friends_byteme_turns',
      when: bytemeTurns,
      atHour: 20,
      chance: 0.05,
      effects: [
        { flag: 'npc.byteme.turns_set' },
        { npc: 'byteme', fate: 'turns' },
        { scene: 'friends_byteme_gone_quiet' },
      ],
    },
  ],

  scenes: [
    {
      id: 'friends_deadline_one_last_job',
      channel: 'chat',
      title: 'deadline',
      from: 'deadline',
      expiresDays: 3,
      onExpire: [{ npc: 'deadline', affinity: -2 }],
      start: 'ping',
      nodes: {
        ping: {
          text: [
            'still up. cant sleep. hands wont quit',
            'thirty years i told every kid who sat in that chair: the last job is the one that gets you. and then you asked and i said yes before you finished the sentence',
            'felt good. thats the problem. felt like 94. like i was worth something at 3am again',
            'dont feel bad. i picked it up. i just gotta figure out how to put it down twice',
          ],
          choices: [
            {
              text: 'you were the best one in there. i mean that',
              effects: [{ npc: 'deadline', affinity: 3 }],
              goto: 'best',
            },
            {
              text: "i shouldn't have asked you. i'm sorry",
              effects: [{ npc: 'deadline', affinity: 5 }, { stat: 'stress', add: 3 }],
              goto: 'sorry',
            },
            {
              text: 'go to bed old man. and take the pills',
              effects: [{ npc: 'deadline', affinity: 2 }],
              goto: 'bed',
            },
          ],
        },
        best: { text: 'yeah. that was always the problem too. night kid' },
        sorry: { text: 'dont. you didnt make me. i been waiting for somebody to ask for ten years. just dont ask again ok' },
        bed: { text: 'pills are for people who plan on being old. ok. ok. going' },
      },
    },
    {
      id: 'friends_byteme_gone_quiet',
      channel: 'chat',
      title: 'byteme',
      from: 'byteme',
      expiresDays: 2,
      start: 'ping',
      nodes: {
        ping: {
          text: [
            'hey',
            'so a guy took me to lunch. like a real lunch with a tablecloth',
            'he knew my handle. he knew the snow day. he said i was "a real asset" and nobody ever called me that before, you just called me when you needed something fast',
            'i didnt tell him anything about you. yet. he said im not in trouble as long as im helpful',
            'anyway i dont think we should talk for a while',
          ],
          choices: [
            {
              text: 'byteme. whatever he promised you, he is lying. call me',
              effects: [{ npc: 'byteme', affinity: 3 }, { stat: 'heat', add: 4 }],
              goto: 'lying',
            },
            {
              text: 'you have no idea what you just did',
              effects: [{ npc: 'byteme', affinity: -5 }, { stat: 'heat', add: 8 }],
              goto: 'angry',
            },
            {
              text: '...ok. take care of yourself',
              effects: [{ stat: 'heat', add: 6 }, { stat: 'stress', add: 4 }],
              goto: 'quiet',
            },
          ],
        },
        lying: { text: 'everybody lies to me. at least he buys lunch first' },
        angry: { text: 'yeah i do. i learned from the best' },
        quiet: { text: 'thats the first time you ever said that' },
      },
      onExpire: [{ stat: 'heat', add: 6 }],
    },
  ],
})
