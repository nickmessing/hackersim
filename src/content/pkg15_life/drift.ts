/**
 * PKG-15 — life_drift_ping (bible §4.7): per-NPC neglect warnings, so a bond never dies by surprise.
 *
 * As an inner-circle affinity slides through 25 / 20 / 15, that NPC reaches out once at each
 * threshold (escalating from "you around?" to "…guess not"). A per-NPC, per-threshold flag
 * (`life.drift.<npc>.<n>`) makes each fire exactly once; recovering above a threshold clears its flag
 * so a rekindled-then-neglected bond can warn again. The pings are the game telling you, plainly,
 * that neglect is a choice — the first-blood and mirror selectors read the affinity these track.
 */
import { defineContent } from '@/engine/registry'
import type { Cond, SceneDef, TriggerDef } from '@/engine/types'
import { around } from './_shared'

interface DriftNpc {
  id: string
  handle: string
  /** Chat lines at 25 / 20 / 15. */
  t25: string[]
  t20: string[]
  t15: string[]
}

const PEOPLE: DriftNpc[] = [
  {
    id: 'jax',
    handle: 'jax',
    t25: [`hey stranger`, `u been a ghost lately. everything ok?`, `hit me back when u surface`],
    t20: [`ok now im actually worried`, `u havent answered in weeks man`, `did i do something? just tell me if i did`],
    t15: [`i'll stop bugging u`, `just. u were my best friend since sixth grade`, `i'm still here if u ever come back. thats it. thats the message`],
  },
  {
    id: 'mira',
    handle: 'nyx',
    t25: [`saw your handle on the board. you didn't say hi.`, `i solved the thing we were both stuck on, by the way. you'd have liked it.`, `anyway. you know where to find me.`],
    t20: [`i'm not going to chase you. i did that once, for someone else. i'm not doing it again.`, `but i'd rather you tell me it's over than just... go quiet.`],
    t15: [`i had a partner once who erased me a little at a time until there was nothing left.`, `i swore i'd never let it happen again. so this is me, leaving before it does.`, `take care of yourself. i mean it.`],
  },
  {
    id: 'byteme',
    handle: 'byteme',
    t25: [`yo u alive`, `nobody's seen u on the board`, `i'm not a kid anymore u know. u can actually talk to me`],
    t20: [`ok whatever man`, `i thought we were tight`, `guess i was just the annoying kid to u after all`],
    t15: [`last one i promise`, `u taught me some of this stuff. i remember even if u dont`, `door's open. -byteme`],
  },
  {
    id: 'corvid',
    handle: 'corvid',
    t25: [`Haven't seen you at the back room. The scene's a family, or it's nothing. Come around.`],
    t20: [`I've watched a lot of people drift out of this scene into that other world. I always hope they'll come back. Most don't.`, `Prove me wrong.`],
    t15: [`When the cops came for Deadline in '94, forty of us wiped our drives the same night. Nobody drifted then.`, `I don't know what you are anymore. I hope you do.`],
  },
  {
    id: 'deadline',
    handle: 'Deadline',
    t25: [`kid. you've gone quiet. quiet's how it starts.`, `come have a coffee. the dog misses you. i don't. (i do.)`],
    t20: [`i backed up my life once and forgot to back up my people. don't make my mistake.`, `come around before i'm just another cautionary tale.`],
    t15: [`i'm an old man who talks too much. i get it.`, `but i knew you when you were good. i hope you still are. that's all.`],
  },
  {
    id: 'grace',
    handle: 'grace',
    t25: [`Hey. Haven't heard from you. Long shifts?`, `I'm an ER nurse — I know what it looks like when someone's avoiding something.`],
    t20: [`I told you once I keep two lives straight for a living. I can tell which one you're bringing me lately: neither.`, `I'm not asking for much. Just don't leave me guessing.`],
    t15: [`I can't love someone who's only ever half here.`, `If you want this, show up. If you don't, tell me, and I'll stop waiting up.`],
  },
]

function threshold(id: string, n: 25 | 20 | 15): Cond {
  return {
    all: [
      around(id),
      { npc: id, affinityLte: n },
      { npc: id, affinityGte: n - 4 },
      { not: { flag: `life.drift.${id}.${n}` } },
    ],
  }
}

function chatScene(p: DriftNpc, n: 25 | 20 | 15, lines: string[]): SceneDef {
  return {
    id: `life_drift_${p.id}_${n}`,
    channel: 'chat',
    title: n <= 15 ? '...' : n <= 20 ? 'hey' : 'you around?',
    from: p.id,
    start: 'start',
    nodes: {
      start: {
        text: lines,
        choices: [
          {
            text: `Make time. Reply, and mean it.`,
            effects: [{ npc: p.id, affinity: 6 }, { stat: 'mood', add: 3 }, { clearFlag: `life.drift.${p.id}.${n}` }],
            goto: 'reply',
          },
          { text: `Read it. Close it. You'll deal with it later.`, effects: [{ stat: 'mood', add: -2 }] },
        ],
      },
      reply: {
        text: [
          n <= 15 ? `They take a moment to answer. Then: "ok. ok. i'd given up a little. don't do that again."` : `They answer fast, like they'd been waiting: "there u are."`,
          `It's not fixed. But the line's open again, and that's something you have to keep choosing.`,
        ],
      },
    },
  }
}

const scenes: SceneDef[] = PEOPLE.flatMap(p => [
  chatScene(p, 25, p.t25),
  chatScene(p, 20, p.t20),
  chatScene(p, 15, p.t15),
])

const triggers: TriggerDef[] = PEOPLE.flatMap((p): TriggerDef[] => [
  {
    id: `life_drift_${p.id}_25`,
    when: threshold(p.id, 25),
    atHour: 20,
    chance: 0.25,
    effects: [{ flag: `life.drift.${p.id}.25` }, { scene: `life_drift_${p.id}_25` }],
  },
  {
    id: `life_drift_${p.id}_20`,
    when: threshold(p.id, 20),
    atHour: 20,
    chance: 0.3,
    effects: [{ flag: `life.drift.${p.id}.20` }, { scene: `life_drift_${p.id}_20` }],
  },
  {
    id: `life_drift_${p.id}_15`,
    when: threshold(p.id, 15),
    atHour: 20,
    chance: 0.4,
    effects: [{ flag: `life.drift.${p.id}.15` }, { scene: `life_drift_${p.id}_15` }],
  },
  // Recovering back above a threshold re-arms it, so a rekindled bond can warn again if re-neglected.
  {
    id: `life_drift_${p.id}_rearm25`,
    when: { all: [{ flag: `life.drift.${p.id}.25` }, { npc: p.id, affinityGte: 32 }] },
    once: false,
    cooldownDays: 7,
    effects: [{ clearFlag: `life.drift.${p.id}.25` }],
  },
  {
    id: `life_drift_${p.id}_rearm20`,
    when: { all: [{ flag: `life.drift.${p.id}.20` }, { npc: p.id, affinityGte: 27 }] },
    once: false,
    cooldownDays: 7,
    effects: [{ clearFlag: `life.drift.${p.id}.20` }],
  },
  {
    id: `life_drift_${p.id}_rearm15`,
    when: { all: [{ flag: `life.drift.${p.id}.15` }, { npc: p.id, affinityGte: 22 }] },
    once: false,
    cooldownDays: 7,
    effects: [{ clearFlag: `life.drift.${p.id}.15` }],
  },
])

export default defineContent({ scenes, triggers })
