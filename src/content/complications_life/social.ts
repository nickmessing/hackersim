/**
 * COMPLICATION PACK — 'social' source: the human wreckage of a bad turn.
 *
 * These spawn from failed social checks across the game ({ complication: 'social' }) and from this
 * pack's spawner triggers. Each is a real sub-story: a lie that unravels, a friend whose trust you
 * spent, gossip on the Row, a rift at the kitchen table, a date that keeps following you, and a
 * rival who decides you owe them. Marks: scars (marks.ts), affinity damage on REAL present NPCs
 * (never a fate, never a romance state — those belong to other packages), buffs, faction damage,
 * and cx_life.* flags that later beats here read.
 *
 * Invented one-off people are free-form labels (spaces/caps), never bare npc ids.
 */
import { defineContent } from '@/engine/registry'
import type { Effect, EventDef, QuestDef, SceneDef } from '@/engine/types'
import { CX_HEARTSORE, CX_PROVE, CX_SHAKEN } from './marks'
import { around, close, ending, momHere, owe } from './_shared'

// Hurt whichever inner-circle friend is actually present (narration stays generic, so no {npc} token).
const hurtClosestFriend = (delta: number): Effect => ({
  if: close('jax', 20),
  then: [{ npc: 'jax', affinity: delta }],
  else: [
    {
      if: close('byteme', 20),
      then: [{ npc: 'byteme', affinity: delta }],
      else: [
        { if: close('mira', 20), then: [{ npc: 'mira', affinity: delta }], else: [{ if: close('deadline', 20), then: [{ npc: 'deadline', affinity: delta }] }] },
      ],
    },
  ],
})

const anyFriendAround = { any: [around('jax'), around('byteme'), around('mira'), around('deadline')] }

// ─────────────────────────────────────────────────────────────────────────────
// cx_life_lie_unravels — a small lie you told, coming apart at the seams
// ─────────────────────────────────────────────────────────────────────────────
const lieScene: SceneDef = {
  id: 'cx_life_lie_scene',
  channel: 'chat',
  title: 'so about what you told me',
  from: 'A Loose Thread',
  start: 'ping',
  nodes: {
    ping: {
      speaker: 'A Loose Thread',
      text: [
        'The message window opens with the specific weight of a chicken coming home to roost.',
        '"hey. weird question. you said you were at the thing that night right? cause [someone] said they saw you somewhere else and now the story doesnt add up and people are asking me about it and idk what to say"',
        { if: { flag: 'cx_life.scar.liar' }, text: '"...also, and dont take this wrong, but this keeps happening with you?"' },
        'A cursor blinks. Whatever you type next, more than one person will read.',
      ],
      choices: [
        {
          text: 'Come clean. The whole thing, no varnish.',
          tag: '[Truth]',
          effects: [{ quest: 'cx_life_lie_q', objective: 'answered' }, { flag: 'cx_life.lie_confessed' }],
          goto: 'confess',
        },
        {
          text: 'Patch the lie with a better lie. Airtight this time.',
          tag: '[Social]',
          check: {
            skill: 'social',
            dc: 14,
            success: 'patched',
            fail: 'exposed',
            successEffects: [{ quest: 'cx_life_lie_q', objective: 'answered' }, { flag: 'cx_life.lie_patched' }],
            failEffects: [{ quest: 'cx_life_lie_q', objective: 'answered' }, { flag: 'cx_life.lie_exposed' }],
          },
        },
        {
          text: 'Go quiet. Log off. Let it blow over.',
          effects: [{ quest: 'cx_life_lie_q', objective: 'answered' }, { flag: 'cx_life.lie_exposed' }, { stat: 'stress', add: 5 }],
          goto: 'ghosted',
        },
      ],
    },
    confess: {
      speaker: 'A Loose Thread',
      text: [
        '"...okay. huh. ok. i wasnt expecting that." A long typing pause. "honestly? respect. everybody lies about dumb stuff, not everybody just says it."',
        'It costs you something to say it plainly. It also buys you something you can\'t get any other way.',
      ],
      effects: [
        { stat: 'mood', add: 3 },
        { xp: 'social', add: 40 },
        { flag: 'cx_life.lie_confessed' },
      ],
    },
    patched: {
      speaker: 'A Loose Thread',
      text: '"oh! ok that makes way more sense. i told them you\'d have a reason." The story holds — this time. You add one more thing to the list of things you have to keep straight forever.',
      effects: [{ stat: 'stress', add: 3 }],
    },
    exposed: {
      speaker: 'A Loose Thread',
      text: [
        '"...dude. the times dont even work. i literally talked to you that night." The window goes cold. "why would you even lie about that. thats the part i dont get."',
        'By morning it isn\'t a rumor about where you were. It\'s a rumor about what you\'re like.',
      ],
      effects: [{ stat: 'mood', add: -5 }, { flag: 'cx_life.lie_exposed' }],
    },
    ghosted: {
      speaker: 'narrator',
      text: 'Silence is an answer. Everyone fills it in the worst way. The story sets like concrete while you pretend not to hear it.',
      effects: [{ flag: 'cx_life.lie_exposed' }],
    },
  },
}

const lieQuest: QuestDef = {
  id: 'cx_life_lie_q',
  title: 'Complication: The Loose Thread',
  kind: 'personal',
  priority: 4,
  rewards: 'Save face — or your reputation',
  summary: 'A small lie you told is coming apart, and people are asking around. What you do next decides whether this is a story about that night or a story about you.',
  start: 's1',
  stages: {
    s1: {
      text: 'Someone is pulling on a thread. Answer them in Chat — tell the truth, sell a better story, or go dark.',
      objectives: [
        { id: 'answered', text: 'Deal with the questions', when: { never: true }, hint: 'Open the chat from "A Loose Thread" and pick how to handle it — confess, out-talk it [Social DC 14], or vanish.' },
      ],
      next: [
        { if: { flag: 'cx_life.lie_confessed' }, stage: 'clean' },
        { if: { flag: 'cx_life.lie_patched' }, stage: 'patched' },
        { stage: 'burned' },
      ],
    },
    clean: ending(
      'You told the truth and it landed better than the lie ever did. People know where you stand now.',
      'completed',
      [{ trait: 'cx_life_straight_shooter' }],
    ),
    patched: ending(
      'The story holds. You got away with it — and added another plate to the stack you keep spinning.',
      'completed',
      [{ stat: 'stress', add: 4 }],
    ),
    burned: ending(
      'It got out, and it stuck. For a while, people take what you say with a grain of salt.',
      'failed',
      [{ trait: 'cx_life_known_liar' }, { stat: 'mood', add: -4 }],
    ),
  },
}

const lieUnravels: EventDef = {
  id: 'cx_life_lie_unravels',
  category: 'life',
  complication: { sources: ['social'], minTier: 1, maxTier: 3 },
  effects: [{ quest: 'cx_life_lie_q', start: true }],
  scene: 'cx_life_lie_scene',
}

// ─────────────────────────────────────────────────────────────────────────────
// cx_life_friend_used — a friend feels used, and they're not wrong
// ─────────────────────────────────────────────────────────────────────────────
const friendScene: SceneDef = {
  id: 'cx_life_friend_scene',
  channel: 'dialog',
  title: 'A Talk That Was Coming',
  start: 'open',
  nodes: {
    open: {
      speaker: 'narrator',
      text: [
        'They ask you to meet somewhere neutral, which is how you know it\'s bad. They\'re already sitting when you get there, hands around a coffee they haven\'t touched.',
        '"I\'m not mad," they say, which means they are, but the quiet kind that lasts. "I just figured out I only hear from you when you need something. And I kept telling myself that\'s not what this is. But it kind of is, right?"',
        { if: { flag: 'cx_life.scar.bridge' }, text: 'You\'ve been across this exact table before, with someone else. You recognize the look. It\'s the one right before a door closes.' },
      ],
      choices: [
        {
          text: '"You\'re right. I\'ve been a bad friend. Let me actually show up." Mean it.',
          tag: '[Social]',
          check: {
            skill: 'social',
            dc: 15,
            success: 'mended',
            fail: 'hollow',
            successEffects: [{ quest: 'cx_life_friend_q', objective: 'faced' }, { flag: 'cx_life.friend_mended' }],
            failEffects: [{ quest: 'cx_life_friend_q', objective: 'faced' }, { flag: 'cx_life.friend_hurt' }],
          },
        },
        {
          text: '"That\'s not fair. You know how much I\'ve got going on." Defend yourself.',
          effects: [{ quest: 'cx_life_friend_q', objective: 'faced' }, { flag: 'cx_life.friend_hurt' }],
          goto: 'defend',
        },
        {
          text: 'Say you\'re sorry, hand them something — money, a favor, a thing — and leave.',
          tag: '[Smooth it over]',
          effects: [{ quest: 'cx_life_friend_q', objective: 'faced' }, { flag: 'cx_life.friend_bought' }, { money: -60 }],
          goto: 'bought',
        },
      ],
    },
    mended: {
      speaker: 'narrator',
      text: [
        'You don\'t make a speech. You just listen, all the way to the end, and then you say the true thing, which is that you\'ve been treating the people who\'d never leave like they\'d never leave.',
        'They let out a breath they\'ve been holding for weeks. "Okay," they say. "Okay. Just — don\'t make me chase you." You buy the next coffee. It\'s a start.',
      ],
      effects: [
        { xp: 'social', add: 50 },
        hurtClosestFriend(10),
        { flag: 'cx_life.friend_mended' },
      ],
    },
    hollow: {
      speaker: 'narrator',
      text: 'The words are right but they come out like a form letter, and you both hear it. "Sure," they say, standing up. "I\'ll see you around." You know you won\'t, not the way it was.',
      effects: [
        hurtClosestFriend(-12),
        { flag: 'cx_life.friend_hurt' },
      ],
    },
    defend: {
      speaker: 'narrator',
      text: '"Everyone\'s got stuff going on," they say quietly. "That\'s not the flex you think it is." They leave the coffee on the table, still full. That image stays with you longer than the argument does.',
      effects: [
        hurtClosestFriend(-15),
        { flag: 'cx_life.friend_hurt' },
      ],
    },
    bought: {
      speaker: 'narrator',
      text: 'They take it, because it would be weird not to, and you both know exactly what it is: a payment, not an apology. "Thanks," they say, to the table. The friendship survives on paper. Something in it doesn\'t.',
      effects: [
        hurtClosestFriend(-6),
        { flag: 'cx_life.friend_bought' },
      ],
    },
  },
}

const friendQuest: QuestDef = {
  id: 'cx_life_friend_q',
  title: 'Complication: A Friend, Owed',
  kind: 'personal',
  priority: 5,
  rewards: 'Keep a friend — or lose one honestly',
  summary: 'Someone who has always shown up for you finally said so, out loud. You can hear it, or you can win the argument.',
  start: 's1',
  stages: {
    s1: {
      text: 'A friend called you out and they\'re not wrong. Meet them and decide what kind of friend you actually are.',
      objectives: [
        { id: 'faced', text: 'Have the conversation', when: { never: true }, hint: 'The dialog "A Talk That Was Coming" opens it — really apologize [Social DC 15], defend yourself, or smooth it over with a gift.' },
      ],
      next: [
        { if: { flag: 'cx_life.friend_mended' }, stage: 'closer' },
        { if: { flag: 'cx_life.friend_bought' }, stage: 'papered' },
        { stage: 'colder' },
      ],
    },
    closer: ending(
      'You showed up, for real, and they let you back in. Some friendships come out of a fight stronger.',
      'completed',
      [{ buff: { ...CX_PROVE, id: 'cx_life_prove', name: 'Held Onto Someone', desc: 'You almost lost a good one and didn\'t. It steadies you.' } }],
    ),
    papered: ending('You kept the friendship on paper. It\'ll do, until the next time you need something.', 'completed'),
    colder: ending(
      'You won the argument. The friendship is the thing you lost.',
      'failed',
      [{ buff: CX_HEARTSORE }, { if: { any: [close('jax', 20), close('byteme', 20), close('mira', 20), close('deadline', 20)] }, then: [], else: [{ trait: 'cx_life_burned_bridge' }] }],
    ),
  },
}

const friendUsed: EventDef = {
  id: 'cx_life_friend_used',
  category: 'life',
  when: anyFriendAround,
  complication: { sources: ['social'], minTier: 1, maxTier: 4 },
  effects: [{ quest: 'cx_life_friend_q', start: true }],
  scene: 'cx_life_friend_scene',
}

// ─────────────────────────────────────────────────────────────────────────────
// cx_life_gossip — a story about you is doing laps of the Row / the scene
// ─────────────────────────────────────────────────────────────────────────────
const gossipScene: SceneDef = {
  id: 'cx_life_gossip_scene',
  channel: 'mail',
  title: "thought you should hear it from a friend",
  from: 'Someone Looking Out For You',
  start: 'note',
  nodes: {
    note: {
      speaker: 'Someone Looking Out For You',
      text: [
        'The mail is kind, which is almost worse. Somebody you half-know, doing you the courtesy of telling you what everybody else is already saying.',
        '"Not trying to stir anything up. But your name\'s been coming up, and not great. People are saying [things]. Figured you\'d rather know than not. What you do with it is your business."',
        'You read it twice. You can feel the shape of the thing without being told the words.',
      ],
      choices: [
        {
          text: 'Get ahead of it. Set the record straight with the people who matter.',
          tag: '[Social DC 15]',
          check: {
            skill: 'social',
            dc: 15,
            success: 'ahead',
            fail: 'worse',
          },
        },
        {
          text: 'Find out who started it.',
          tag: '[OpSec DC 14]',
          check: {
            skill: 'opsec',
            dc: 14,
            success: 'source',
            fail: 'noise',
          },
        },
        {
          text: 'Rise above it. Rumors starve without oxygen.',
          effects: [{ flag: 'cx_life.gossip_ignored' }, { stat: 'stress', add: 4 }, { buff: { ...CX_SHAKEN, id: 'cx_life_gossip_cloud', name: 'Under a Cloud', desc: 'People look at you a beat too long. You feel it, even when it\'s nothing.', days: 14 } }],
        },
      ],
    },
    ahead: {
      speaker: 'narrator',
      text: 'You don\'t get defensive; you just show up, be exactly who you are, and let the story die of boredom. The ones who matter shrug it off. The rest were never going to like you anyway.',
      effects: [
        { xp: 'social', add: 45 },
        { stat: 'mood', add: 2 },
        { trait: 'cx_life_thick_skin' },
      ],
    },
    worse: {
      speaker: 'narrator',
      text: 'You protest a little too much to a couple of people, and protesting too much is its own kind of confirmation. The rumor picks up a second chapter: that you\'re rattled about it.',
      effects: [
        { flag: 'cx_life.gossip_spread' },
        { faction: 'fac.hood', add: -4 },
        { stat: 'mood', add: -5 },
      ],
    },
    source: {
      speaker: 'narrator',
      text: [
        'It doesn\'t take long. Gossip leaves fingerprints. It traces back to exactly the kind of small, bored person you\'d expect — someone who needed you to be smaller so they could feel bigger.',
        'Knowing who it is doesn\'t make it untrue to everyone else. But it does make it easier to carry.',
      ],
      effects: [
        { xp: 'opsec', add: 40 },
        { flag: 'cx_life.gossip_source_known' },
        { stat: 'cred', add: 1 },
      ],
    },
    noise: {
      speaker: 'narrator',
      text: 'Everyone heard it from someone who heard it from someone. There\'s no source, just a fog with your name in it. You waste a week chasing an echo and end up more rattled than when you started.',
      effects: [
        { flag: 'cx_life.gossip_spread' },
        { buff: CX_SHAKEN },
      ],
    },
  },
}

const gossip: EventDef = {
  id: 'cx_life_gossip',
  category: 'life',
  when: { var: 'cx_life.gossip_count', lte: 1 },
  complication: { sources: ['social', 'any'], minTier: 1, maxTier: 3 },
  // A rumor can find you twice in a life, a year or more apart. The scene has no quest and its
  // flags are per-run, so they are wiped each time it fires.
  repeatable: true,
  cooldownDays: 365,
  effects: [
    { var: 'cx_life.gossip_count', add: 1 },
    { clearFlag: 'cx_life.gossip_ignored' },
    { clearFlag: 'cx_life.gossip_spread' },
    { clearFlag: 'cx_life.gossip_source_known' },
  ],
  scene: 'cx_life_gossip_scene',
}

// ─────────────────────────────────────────────────────────────────────────────
// cx_life_family_rift — the fight you've been not-having with a parent
// ─────────────────────────────────────────────────────────────────────────────
const riftScene: SceneDef = {
  id: 'cx_life_rift_scene',
  channel: 'dialog',
  title: 'The Kitchen Table',
  start: 'open',
  nodes: {
    open: {
      speaker: 'mom',
      text: [
        'It starts about something small — a missed dinner, a tone, a door closed one too many times — and then it isn\'t small at all.',
        '"I don\'t know what you do up there," Mom says, and her voice is doing the thing where it stays level on purpose. "I know you don\'t sleep. I know you jump when the phone rings. I stopped asking because you stopped answering. So I\'m asking now, at my own table: what is happening to my child?"',
        { if: { flag: 'cx_life.scar.bridge' }, text: 'You have been careless with people before. Not with her. Never quite with her.' },
      ],
      choices: [
        {
          text: 'Sit down. Tell her something true — not everything, but not a lie.',
          tag: '[Social DC 14]',
          check: {
            skill: 'social',
            dc: 14,
            success: 'honest',
            fail: 'stumble',
            successEffects: [{ quest: 'cx_life_rift_q', objective: 'faced' }, { flag: 'cx_life.rift_mended' }],
            failEffects: [{ quest: 'cx_life_rift_q', objective: 'faced' }, { flag: 'cx_life.rift_open' }],
          },
        },
        {
          text: '"I\'m fine, Ma. Stop." Shut it down.',
          effects: [{ quest: 'cx_life_rift_q', objective: 'faced' }, { flag: 'cx_life.rift_open' }],
          goto: 'shutdown',
        },
        {
          text: 'Say the cruel, true thing that ends the conversation.',
          tag: '[Burn it]',
          effects: [{ quest: 'cx_life_rift_q', objective: 'faced' }, { flag: 'cx_life.rift_burned' }],
          goto: 'cruel',
        },
      ],
    },
    honest: {
      speaker: 'mom',
      text: [
        'You leave the machines out of it. You tell her you\'re tired, that you\'re in over your head sometimes, that you\'re scared of turning into someone she wouldn\'t recognize. All of that is true.',
        'She reaches across the table and holds your wrist, the one that aches. "There he is," she says. "There\'s my kid." You don\'t fix anything. You just stop pretending, for one evening, and it turns out that was the thing she needed.',
      ],
      effects: [
        { xp: 'social', add: 45 },
        { npc: 'mom', affinity: 8 },
        { stat: 'mood', add: 5 },
      ],
    },
    stumble: {
      speaker: 'mom',
      text: 'You try, but it comes out wrong, half a truth wrapped in a deflection, and she can always hear the seam. "Okay," she says, and starts clearing plates that are already clean. The quiet that follows lasts for days.',
      effects: [
        { npc: 'mom', affinity: -5 },
        { buff: CX_HEARTSORE },
      ],
    },
    shutdown: {
      speaker: 'mom',
      text: '"Fine," she echoes, and the word has a lid on it. She doesn\'t bring it up again. She also stops asking how your day was, which you don\'t notice until you notice, and then you can\'t stop noticing.',
      effects: [
        { npc: 'mom', affinity: -8 },
        { buff: CX_HEARTSORE },
      ],
    },
    cruel: {
      speaker: 'narrator',
      text: [
        'You say the thing designed to make her stop. It works. It always works. You watch it land and you would give anything, in the second after, to take it back.',
        'She doesn\'t cry. She just nods, like she\'s filing it away, and says, "Okay." The apology you eventually make doesn\'t fully close the distance. Some words don\'t come back.',
      ],
      effects: [
        { npc: 'mom', affinity: -14 },
        { trait: 'cx_life_burned_bridge' },
        { buff: CX_HEARTSORE },
      ],
    },
  },
}

const riftQuest: QuestDef = {
  id: 'cx_life_rift_q',
  title: 'Complication: The Kitchen Table',
  kind: 'personal',
  priority: 6,
  rewards: 'Family, kept or cracked',
  summary: 'A parent finally asked the question you\'ve been dodging. How you answer at that table follows you home for a long time.',
  start: 's1',
  stages: {
    s1: {
      text: 'The rift is out in the open now. Sit at the table and answer — honestly, defensively, or cruelly.',
      objectives: [
        { id: 'faced', text: 'Get through the conversation', when: { never: true }, hint: 'The dialog "The Kitchen Table" opens it — tell a partial truth [Social DC 14], shut it down, or end it with something cruel.' },
      ],
      next: [
        { if: { flag: 'cx_life.rift_mended' }, stage: 'mended' },
        { if: { flag: 'cx_life.rift_burned' }, stage: 'burned' },
        { stage: 'cold' },
      ],
    },
    mended: ending('You stopped pretending for one evening and it was enough. The table feels like home again.', 'completed', [{ buff: { ...CX_HEARTSORE, id: 'cx_life_rift_warm', name: 'Seen', desc: 'Someone who loves you knows a little more of the truth, and loves you anyway.', bad: false, mods: [{ key: 'mood.daily', add: 0.4 }, { key: 'stress.relief', mult: 1.1 }] } }]),
    cold: ending('You kept the door shut. The house got quieter, and so did the space between you.', 'failed'),
    burned: ending('You said the unsayable thing. The apology helped. It didn\'t erase it.', 'failed'),
  },
}

const familyRift: EventDef = {
  id: 'cx_life_family_rift',
  category: 'family',
  when: momHere,
  complication: { sources: ['social'], minTier: 2, maxTier: 4 },
  effects: [{ quest: 'cx_life_rift_q', start: true }],
  scene: 'cx_life_rift_scene',
}

// ─────────────────────────────────────────────────────────────────────────────
// cx_life_bad_date — a date that goes wrong and then keeps going
// ─────────────────────────────────────────────────────────────────────────────
const dateScene: SceneDef = {
  id: 'cx_life_date_scene',
  channel: 'dialog',
  title: 'The Second Half of the Date',
  start: 'open',
  nodes: {
    open: {
      speaker: 'narrator',
      text: [
        'It was going fine. Better than fine. And then somewhere between the entrée and the check, a question landed wrong — "so what is it you actually do?" — and you heard yourself building a version of your life with load-bearing lies in it.',
        'Robin (kind eyes, works at the aquarium, laughed at your dumb joke) is watching you talk yourself into a corner. "You\'re doing a bit, right?" they say, half-smiling, giving you an out. "Like, that\'s not a real answer."',
      ],
      choices: [
        {
          text: 'Drop the act. Tell them the honest, complicated truth.',
          tag: '[Honest]',
          effects: [{ quest: 'cx_life_date_q', objective: 'resolved' }, { flag: 'cx_life.date_honest' }],
          goto: 'honest',
        },
        {
          text: 'Double down. Make the lie charming enough to survive.',
          tag: '[Social DC 16]',
          check: {
            skill: 'social',
            dc: 16,
            success: 'charmed',
            fail: 'caught',
            successEffects: [{ quest: 'cx_life_date_q', objective: 'resolved' }, { flag: 'cx_life.date_charmed' }],
            failEffects: [{ quest: 'cx_life_date_q', objective: 'resolved' }, { flag: 'cx_life.date_blew_up' }],
          },
        },
        {
          text: 'Fake a page from "work," leave cash on the table, and bolt.',
          effects: [{ quest: 'cx_life_date_q', objective: 'resolved' }, { flag: 'cx_life.date_bolted' }, { money: -40 }, { stat: 'stress', add: 4 }],
          goto: 'bolt',
        },
      ],
    },
    honest: {
      speaker: 'narrator',
      text: [
        '"Okay. Real answer." And you give it — the day job, the other thing, the part where you\'re not always sure which one is the real one. Robin listens without flinching.',
        '"That\'s a lot," they say finally. "I don\'t know if I\'m in for all of it. But I\'d rather know the real thing than date a bit." Maybe it goes somewhere. Maybe it doesn\'t. Either way you didn\'t start it on a lie.',
      ],
      effects: [{ stat: 'mood', add: 4 }, { xp: 'social', add: 35 }, { flag: 'cx_life.date_honest' }],
    },
    charmed: {
      speaker: 'narrator',
      text: 'You spin it into a whole comic mythology and Robin laughs the whole way home. You got away with it — which means the next date starts with a lie you now have to remember exactly.',
      effects: [{ stat: 'mood', add: 2 }, { flag: 'cx_life.date_charmed' }],
    },
    caught: {
      speaker: 'narrator',
      text: [
        'The lie collapses under its own weight, and Robin\'s face does something complicated — not angry, just done. "I had a nice time until about ten minutes ago," they say, gathering their coat.',
        'That would be the end of it, except Robin knows people you know, and "watch out for that one, total fabulist" is a light, dinner-party kind of warning that travels surprisingly far.',
      ],
      effects: [{ stat: 'mood', add: -4 }, { flag: 'cx_life.date_blew_up' }],
    },
    bolt: {
      speaker: 'narrator',
      text: 'You do the pager thing. Robin\'s expression tells you they\'ve seen the pager thing. "Sure," they say. "Go save the world." You are three blocks away before you realize the story of how you ran will outlive any story of the actual date.',
      effects: [{ flag: 'cx_life.date_bolted' }],
    },
  },
}

const dateFollowup: SceneDef = {
  id: 'cx_life_date_followup',
  channel: 'chat',
  title: 'small world',
  from: 'A Mutual Friend',
  start: 'ping',
  nodes: {
    ping: {
      speaker: 'A Mutual Friend',
      text: [
        'Weeks later, out of nowhere:',
        { if: { flag: 'cx_life.date_blew_up' }, text: '"lol ok so i was talking to Robin from the aquarium and your NAME came up and the story they told. anyway just so you know that ones making the rounds"', else: '"random but Robin from the aquarium says hi? said you were \'a lot but not in a bad way\' which honestly for you is a rave review"' },
      ],
      choices: [
        { if: { flag: 'cx_life.date_blew_up' }, text: 'Ugh. Owe it, live it down.', effects: [{ stat: 'mood', add: -3 }, { trait: 'cx_life_thick_skin' }] },
        { if: { not: { flag: 'cx_life.date_blew_up' } }, text: '"tell them the aquarium still owes me a rain check."', effects: [{ stat: 'mood', add: 3 }] },
        { text: 'Change the subject.', effects: [] },
      ],
    },
  },
}

const dateQuest: QuestDef = {
  id: 'cx_life_date_q',
  title: 'Complication: A Date, Compromised',
  kind: 'personal',
  priority: 3,
  rewards: 'Live down (or live up to) a first impression',
  summary: 'A promising date ran into the wall of your double life. How you handled it decides what a stranger says about you at other people\'s dinner tables.',
  start: 's1',
  stages: {
    s1: {
      text: 'The date hit the question you can\'t answer cleanly. Handle the moment.',
      objectives: [
        { id: 'resolved', text: 'Get through the date', when: { never: true }, hint: 'The dialog "The Second Half of the Date" opens it — come clean, out-charm it [Social DC 16], or make an exit.' },
      ],
      next: 's2',
    },
    s2: {
      text: 'The date\'s over. Whatever impression you left is out in the world now, wandering around without you.',
      onEnter: [{ scene: 'cx_life_date_followup', delayHours: 24 * 21 }],
      objectives: [
        { id: 'echo', text: 'See how the story travels', when: { seen: 'cx_life_date_followup' }, hint: 'A mutual friend will bring it up in Chat in a few weeks. Nothing to do but wait — and answer when it comes.' },
      ],
    },
  },
}

const badDate: EventDef = {
  id: 'cx_life_bad_date',
  category: 'romance',
  complication: { sources: ['social'], minTier: 1, maxTier: 3 },
  effects: [{ quest: 'cx_life_date_q', start: true }],
  scene: 'cx_life_date_scene',
}

// ─────────────────────────────────────────────────────────────────────────────
// cx_life_rival_revenge — someone you bested decides you owe them
// ─────────────────────────────────────────────────────────────────────────────
const rivalScene: SceneDef = {
  id: 'cx_life_rival_scene',
  channel: 'mail',
  title: 'we should talk about what you did',
  from: 'Someone With A Long Memory',
  start: 'note',
  nodes: {
    note: {
      speaker: 'Someone With A Long Memory',
      text: [
        'You beat somebody, once. A gig, an argument, a girl, a bragging-rights thing — you\'ve honestly half-forgotten which. They have not forgotten. They have, if anything, been curating it.',
        '"You probably don\'t even remember me. That\'s the funny part. I\'ve spent a while telling people who you really are, and lately they\'ve started to listen. Just wanted you to know it\'s me. Sleep tight."',
        'It\'s petty. It\'s also working — you\'ve felt a few doors get colder lately and now you know why.',
      ],
      effects: [{ stat: 'cred', add: -2 }],
      choices: [
        {
          text: 'Reach out. Defuse it — everyone can be talked to.',
          tag: '[Social DC 16]',
          check: {
            skill: 'social',
            dc: 16,
            success: 'defused',
            fail: 'escalated',
            successEffects: [{ quest: 'cx_life_rival_q', objective: 'handled' }, { flag: 'cx_life.rival_defused' }],
            failEffects: [{ quest: 'cx_life_rival_q', objective: 'handled' }, { flag: 'cx_life.rival_escalated' }],
          },
        },
        {
          text: 'Find the leverage. Everyone has a pressure point.',
          tag: '[OpSec DC 15]',
          check: {
            skill: 'opsec',
            dc: 15,
            success: 'leverage',
            fail: 'escalated',
            successEffects: [{ quest: 'cx_life_rival_q', objective: 'handled' }, { flag: 'cx_life.rival_leveraged' }],
            failEffects: [{ quest: 'cx_life_rival_q', objective: 'handled' }, { flag: 'cx_life.rival_escalated' }],
          },
        },
        {
          text: 'Ignore it. Outlast them by being unbothered.',
          effects: [{ quest: 'cx_life_rival_q', objective: 'handled' }, { flag: 'cx_life.rival_ignored' }, { buff: { ...CX_SHAKEN, id: 'cx_life_needled', name: 'Needled', desc: 'Someone out there is chipping at your name and you\'ve decided not to care. Deciding takes effort.', days: 21 } }],
          goto: 'ignore',
        },
      ],
    },
    defused: {
      speaker: 'narrator',
      text: [
        'You do the hardest thing, which is take them seriously. You find out what the actual wound was — it\'s always smaller and older than the grudge — and you say the thing they needed to hear back then.',
        '"...huh," they write, after a long time. "I hated you for a lot of years for nothing, kind of." It doesn\'t become a friendship. It stops being a war, which is enough.',
      ],
      effects: [{ xp: 'social', add: 55 }, { stat: 'cred', add: 2 }, { trait: 'cx_life_iron_nerves' }],
    },
    leverage: {
      speaker: 'narrator',
      text: [
        'You don\'t threaten them. You just let them know, gently, precisely, that you could — that you know the thing they\'d least like known, and that you\'re choosing not to.',
        'The whisper campaign stops that night. You won. You also learned something about yourself you\'re not thrilled about: how easily you reached for the knife.',
      ],
      effects: [{ xp: 'opsec', add: 50 }, { flag: 'cx_life.rival_leveraged' }, { stat: 'stress', add: 4 }, { trait: 'cx_life_street_smart' }],
    },
    escalated: {
      speaker: 'narrator',
      text: [
        'It goes sideways. Whatever you tried, they read it as fear, and fear is blood in the water. The campaign gets louder and more specific, and now some of it is even true.',
        'You spend weeks smaller than you should be, watching what you say, wondering who\'s heard what.',
      ],
      effects: [{ flag: 'cx_life.rival_escalated' }, { stat: 'cred', add: -3 }, { buff: CX_SHAKEN }],
    },
    ignore: {
      speaker: 'narrator',
      text: 'You go about your life and let them shout into the wind. It mostly works. It costs more than "mostly works" should, because unbothered is a performance you have to keep up.',
      effects: [{ flag: 'cx_life.rival_ignored' }],
    },
  },
}

const rivalQuest: QuestDef = {
  id: 'cx_life_rival_q',
  title: 'Complication: A Long Memory',
  kind: 'personal',
  priority: 4,
  rewards: 'End a grudge, one way or another',
  summary: 'Someone you barely remember beating has spent a long time turning that into a story about you. Now it\'s spreading.',
  start: 's1',
  stages: {
    s1: {
      text: 'An old rival is running a quiet campaign against your name. Defuse it, out-maneuver it, or outlast it.',
      objectives: [
        { id: 'handled', text: 'Deal with the grudge', when: { never: true }, hint: 'Answer the mail "we should talk about what you did" — talk them down [Social DC 16], find leverage [OpSec DC 15], or ignore it.' },
      ],
      next: [
        { if: { flag: 'cx_life.rival_defused' }, stage: 'peace' },
        { if: { flag: 'cx_life.rival_leveraged' }, stage: 'won' },
        { if: { flag: 'cx_life.rival_ignored' }, stage: 'endured' },
        { stage: 'lost' },
      ],
    },
    peace: ending('You turned an enemy into a truce. It\'s the rarest kind of win.', 'completed'),
    won: ending('You found the knife and only had to show it. The campaign died overnight — and you learned what you\'re willing to do.', 'completed'),
    endured: ending('You waited them out. It worked, mostly, at a cost you\'ll never fully add up.', 'completed'),
    lost: ending('It got louder, then true, then everywhere. Some of the doors that closed this month aren\'t opening again soon.', 'failed', [{ trait: 'cx_life_blacklisted' }]),
  },
}

const rivalRevenge: EventDef = {
  id: 'cx_life_rival_revenge',
  category: 'life',
  complication: { sources: ['social'], minTier: 2, maxTier: 4 },
  effects: [{ quest: 'cx_life_rival_q', start: true }],
  scene: 'cx_life_rival_scene',
}

// ─────────────────────────────────────────────────────────────────────────────
// cx_life_owed_money — money between friends, souring
// ─────────────────────────────────────────────────────────────────────────────
const owedScene: SceneDef = {
  id: 'cx_life_owed_scene',
  channel: 'chat',
  title: 'hey so awkward thing',
  from: 'A Friend Who Fronted You',
  start: 'ping',
  nodes: {
    ping: {
      speaker: 'A Friend Who Fronted You',
      text: [
        'You forgot about it. They didn\'t. That\'s how money between friends always goes.',
        '"ok this is so awkward and i hate that im typing it but. the money from a while back? i\'m kind of underwater this month and i keep waiting for you to bring it up and you havent so. yeah. sorry. hate this"',
        'It\'s not a fortune. It\'s enough that they had to swallow their pride to ask, which means it mattered, which means how you handle it matters more than the number.',
      ],
      choices: [
        {
          text: 'Pay it back today, plus a little, and apologize for forgetting.',
          tag: '[$140]',
          req: { stat: 'money', gte: 140 },
          reqText: 'Requires $140',
          effects: [{ money: -140 }, { quest: 'cx_life_owed_q', objective: 'settled' }, { flag: 'cx_life.owed_paid' }],
          goto: 'paid',
        },
        {
          text: '"I\'m good for it — give me two weeks." Mean it this time.',
          effects: [{ quest: 'cx_life_owed_q', objective: 'settled' }, { flag: 'cx_life.owed_promised' }],
          goto: 'promise',
        },
        {
          text: '"Are you sure it was that much? I thought it was less." Haggle.',
          effects: [{ quest: 'cx_life_owed_q', objective: 'settled' }, { flag: 'cx_life.owed_haggled' }, hurtClosestFriend(-8)],
          goto: 'haggle',
        },
      ],
    },
    paid: {
      speaker: 'A Friend Who Fronted You',
      text: '"oh thank god. and you didnt have to add extra you dork. ok we\'re good, genuinely, thank you." Squared up, same day, no weirdness. That\'s worth more than the money.',
      effects: [hurtClosestFriend(8), { stat: 'mood', add: 3 }],
    },
    promise: {
      speaker: 'narrator',
      text: 'They say "no rush!" and mean "some rush." Now there\'s a clock on it — a small obligation with a friend\'s face on it, ticking in the back of your mind until you clear it.',
      effects: [owe('cx_life_iou', 'IOU to a friend', 5, 21), { flag: 'cx_life.owed_promised' }],
    },
    haggle: {
      speaker: 'A Friend Who Fronted You',
      text: '"...wow. ok. no, you know what, forget it. keep it." They log off. You saved a few bucks and spent something you can\'t get back at an ATM.',
      effects: [{ stat: 'mood', add: -4 }],
    },
  },
}

const owedQuest: QuestDef = {
  id: 'cx_life_owed_q',
  title: 'Complication: The Money Thing',
  kind: 'personal',
  priority: 3,
  rewards: 'Keep a friendship out of the red',
  summary: 'A friend fronted you money and finally had to ask for it back. The number is small. The test is not.',
  start: 's1',
  stages: {
    s1: {
      text: 'A friend needs the money back and hated having to ask. Settle it well, promise honestly, or nickel-and-dime them.',
      objectives: [
        { id: 'settled', text: 'Handle the debt', when: { never: true }, hint: 'Answer the chat "hey so awkward thing" — pay it back with interest, promise a real deadline, or haggle.' },
      ],
      next: [
        { if: { flag: 'cx_life.owed_paid' }, stage: 'square' },
        { if: { flag: 'cx_life.owed_promised' }, stage: 'clock' },
        { stage: 'sour' },
      ],
    },
    square: ending('Squared up same-day, no weirdness. The friendship is fine. Better, even.', 'completed'),
    clock: {
      text: 'You promised two weeks and meant it. There\'s a small IOU on the books now, paid down a little every day for three weeks until you and your friend are square.',
      objectives: [
        { id: 'cleared', text: 'Actually pay them back', when: { not: { obligation: 'cx_life_iou' } }, hint: 'The IOU pays itself down over three weeks (its end date is in the Obligations panel). Keep enough money on hand to cover it and the quest closes when it clears.' },
      ],
      next: 'square',
    },
    sour: ending('You saved a few dollars and lost a little of a good friend\'s regard. Bad trade.', 'failed'),
  },
}

const owedMoney: EventDef = {
  id: 'cx_life_owed_money',
  category: 'money',
  when: anyFriendAround,
  complication: { sources: ['social'], minTier: 1, maxTier: 3 },
  effects: [{ quest: 'cx_life_owed_q', start: true }],
  scene: 'cx_life_owed_scene',
}

// ─────────────────────────────────────────────────────────────────────────────
// cx_life_public_blowup — you lost it in public, and people saw
// ─────────────────────────────────────────────────────────────────────────────
const blowupScene: SceneDef = {
  id: 'cx_life_blowup_scene',
  channel: 'dialog',
  title: 'The Thing At The Diner',
  start: 'open',
  nodes: {
    open: {
      speaker: 'narrator',
      text: [
        { if: { var: 'w.cathode_open', eq: 1 }, text: 'It happens at the Cathode, of all places — the one warm room you have — which makes it worse.', else: 'It happens in a diner with too much fluorescent light and too many witnesses.' },
        'You were already frayed, and someone said the wrong small thing, and you came apart at the seams — loud, ugly, all of it. By the time you hear your own voice you\'re standing up and a fork has been dropped somewhere and everyone is very carefully not looking.',
        'The silence after is the part you\'ll remember.',
      ],
      choices: [
        {
          text: 'Apologize to the room, right now, out loud. Own it.',
          tag: '[Social DC 13]',
          check: {
            skill: 'social',
            dc: 13,
            success: 'owned',
            fail: 'worse',
          },
        },
        {
          text: 'Walk out. Deal with the fallout later.',
          effects: [{ flag: 'cx_life.blowup_fled' }, { stat: 'stress', add: 6 }, { buff: { ...CX_SHAKEN, id: 'cx_life_mortified', name: 'Mortified', desc: 'You keep replaying it. Every room feels like the one you stormed out of.', days: 10 } }],
          goto: 'walk',
        },
        {
          text: 'Double down. You weren\'t wrong.',
          effects: [{ if: { var: 'w.cathode_open', eq: 1 }, then: [{ faction: 'fac.hood', add: -4 }] }, { flag: 'cx_life.blowup_doubled' }, { stat: 'mood', add: -3 }],
          goto: 'double',
        },
      ],
    },
    owned: {
      speaker: 'narrator',
      text: [
        'You make yourself do it: "That was me, not you. I\'m having a bad stretch and I took it out on the room. I\'m sorry." It\'s excruciating and it takes about nine seconds.',
        'Somebody says "we\'ve all been there," and somebody else refills your coffee, and the room exhales. You didn\'t undo it. You did the next best thing, which people remember.',
      ],
      effects: [{ xp: 'social', add: 40 }, { trait: 'cx_life_thick_skin' }, { stat: 'mood', add: 2 }],
    },
    worse: {
      speaker: 'narrator',
      text: 'You try to apologize and somehow make a second, smaller scene inside the apology. "It\'s okay, honey," someone says, in the voice you\'d use on a barking dog. That one stings for weeks.',
      effects: [{ flag: 'cx_life.blowup_fled' }, { buff: CX_SHAKEN }],
    },
    walk: {
      speaker: 'narrator',
      text: 'The door swings shut behind you. In the version of the story that circulates, you\'re either scary or fragile, and neither is the one you\'d pick.',
      effects: [],
    },
    double: {
      speaker: 'narrator',
      text: 'You defend the indefensible and the room turns fully cold. You "win," in that nobody argues back. You also become, for a while, the person people warn the new kid about.',
      effects: [{ flag: 'cx_life.blowup_doubled' }],
    },
  },
}

const publicBlowup: EventDef = {
  id: 'cx_life_public_blowup',
  category: 'life',
  when: { var: 'cx_life.blowup_count', lte: 1 },
  complication: { sources: ['social', 'any'], minTier: 1, maxTier: 3 },
  // At most twice, a year or more apart; per-run flags are wiped each time it fires.
  repeatable: true,
  cooldownDays: 365,
  effects: [
    { var: 'cx_life.blowup_count', add: 1 },
    { clearFlag: 'cx_life.blowup_fled' },
    { clearFlag: 'cx_life.blowup_doubled' },
  ],
  scene: 'cx_life_blowup_scene',
}

// ─────────────────────────────────────────────────────────────────────────────
// cx_life_roommate_feud — living with someone gets ugly
// ─────────────────────────────────────────────────────────────────────────────
const roomScene: SceneDef = {
  id: 'cx_life_room_scene',
  channel: 'mail',
  title: 'HOUSE MEETING (not optional)',
  from: 'Your Housemate',
  start: 'note',
  nodes: {
    note: {
      speaker: 'Your Housemate',
      text: [
        'A note, taped to the fridge, typed in a font that means business:',
        '"We need to talk. The modem noise ALL NIGHT. The strangers you buzz up. The \'work calls\' at 3am. Rent was late again and I covered it AGAIN. I\'m not your mom and I\'m not your bank. House meeting. Tonight. I made an agenda."',
        'There is, in fact, an agenda. It has bullet points. Some of them are fair.',
      ],
      choices: [
        {
          text: 'Show up, listen, and actually meet them halfway.',
          tag: '[Social DC 14]',
          check: {
            skill: 'social',
            dc: 14,
            success: 'truce',
            fail: 'cold_war',
            successEffects: [{ quest: 'cx_life_room_q', objective: 'met' }, { flag: 'cx_life.room_truce' }],
            failEffects: [{ quest: 'cx_life_room_q', objective: 'met' }, { flag: 'cx_life.room_war' }],
          },
        },
        {
          text: 'Buy peace: cover the back rent and their groceries for a month.',
          tag: '[$200]',
          req: { stat: 'money', gte: 200 },
          reqText: 'Requires $200',
          effects: [{ money: -200 }, { quest: 'cx_life_room_q', objective: 'met' }, { flag: 'cx_life.room_bought' }],
          goto: 'bought',
        },
        {
          text: 'Skip the meeting. It\'s your place too.',
          effects: [{ quest: 'cx_life_room_q', objective: 'met' }, { flag: 'cx_life.room_war' }, { stat: 'stress', add: 5 }],
          goto: 'skip',
        },
      ],
    },
    truce: {
      speaker: 'narrator',
      text: 'You sit through the agenda without getting defensive, agree to the reasonable bits, and negotiate the rest. Quiet hours after midnight; no strangers without a text; rent on the first, no exceptions. It\'s a little humiliating and completely worth it. The apartment stops being a war zone.',
      effects: [{ xp: 'social', add: 40 }, { stat: 'stress', add: -3 }, { flag: 'cx_life.room_truce' }],
    },
    cold_war: {
      speaker: 'narrator',
      text: 'The meeting turns into a scorekeeping match neither of you wins. Now you live in a cold war with shared appliances — passive-aggressive notes, labeled milk, the works. Home stops being restful.',
      effects: [{ buff: { ...CX_HEARTSORE, id: 'cx_life_cold_home', name: 'Cold War at Home', desc: 'Your own front door feels like enemy territory. You sleep worse for it.', mods: [{ key: 'energy.regen', mult: 0.9 }, { key: 'stress.gain', mult: 1.1 }] } }, { flag: 'cx_life.room_war' }],
    },
    bought: {
      speaker: 'Your Housemate',
      text: '"...okay. Okay, that actually helps a lot, thank you." Money smooths it for now. It doesn\'t fix the modem noise or the strangers, so you both know you\'re renting peace by the month.',
      effects: [{ stat: 'stress', add: -2 }],
    },
    skip: {
      speaker: 'narrator',
      text: 'You don\'t show. They hold the meeting anyway, with an empty chair, which is somehow the most damning thing possible. The notes on the fridge get shorter and colder until they\'re just initials and dollar amounts.',
      effects: [{ buff: { ...CX_HEARTSORE, id: 'cx_life_cold_home', name: 'Cold War at Home', desc: 'Your own front door feels like enemy territory. You sleep worse for it.', mods: [{ key: 'energy.regen', mult: 0.9 }, { key: 'stress.gain', mult: 1.1 }] } }],
    },
  },
}

const roomQuest: QuestDef = {
  id: 'cx_life_room_q',
  title: 'Complication: House Meeting',
  kind: 'personal',
  priority: 3,
  rewards: 'Peace at home',
  summary: 'Your housemate has an agenda, some fair points, and a fridge covered in evidence. Home is on the line.',
  start: 's1',
  stages: {
    s1: {
      text: 'The house meeting is tonight. Show up and compromise, buy your way to quiet, or blow it off.',
      objectives: [
        { id: 'met', text: 'Handle the housemate', when: { never: true }, hint: 'Answer the "HOUSE MEETING" mail — meet them halfway [Social DC 14], pay to smooth it over ($200), or skip it.' },
      ],
      next: [
        { if: { flag: 'cx_life.room_truce' }, stage: 'peace' },
        { if: { flag: 'cx_life.room_bought' }, stage: 'rented' },
        { stage: 'war' },
      ],
    },
    peace: ending('You found a set of rules you can both live with. Home is home again.', 'completed'),
    rented: ending('Money bought quiet for now. The underlying problem is still your roommate.', 'completed'),
    war: ending('You live in a cold war with shared appliances now. It follows you home every single night.', 'failed'),
  },
}

const roommateFeud: EventDef = {
  id: 'cx_life_roommate_feud',
  category: 'life',
  when: { housing: 'shared_room' },
  complication: { sources: ['social'], minTier: 1, maxTier: 3 },
  effects: [{ quest: 'cx_life_room_q', start: true }],
  scene: 'cx_life_room_scene',
}

// ─────────────────────────────────────────────────────────────────────────────
// cx_life_whisper_campaign — a professional/social whisper that costs you work
// ─────────────────────────────────────────────────────────────────────────────
const whisperScene: SceneDef = {
  id: 'cx_life_whisper_scene',
  channel: 'mail',
  title: 're: your name came up',
  from: 'A Contact Who Owes You One',
  start: 'note',
  nodes: {
    note: {
      speaker: 'A Contact Who Owes You One',
      text: [
        'A quiet heads-up from someone in a position to give you one:',
        '"You didn\'t hear this from me. Your name came up in a room you\'d want to be liked in, and it went badly — someone painting you as unreliable, maybe worse. I don\'t know if it\'s true and I don\'t need to. I\'m telling you because in this town a whisper like that can dry up your work before you notice it\'s gone."',
        'This is the kind of thing that doesn\'t announce itself. It just shows up later, as offers that never come.',
      ],
      choices: [
        {
          text: 'Do the rounds. Reassure the people who matter, in person.',
          tag: '[Business DC 16]',
          check: {
            skill: 'business',
            dc: 16,
            success: 'salvaged',
            fail: 'faded',
            successEffects: [{ quest: 'cx_life_whisper_q', objective: 'answered' }, { flag: 'cx_life.whisper_beat' }],
            failEffects: [{ quest: 'cx_life_whisper_q', objective: 'answered' }, { flag: 'cx_life.whisper_stuck' }],
          },
        },
        {
          text: 'Let the work speak. Deliver something undeniable and let it circulate.',
          tag: '[Prove it]',
          effects: [{ quest: 'cx_life_whisper_q', objective: 'answered' }, { flag: 'cx_life.whisper_prove' }, { buff: CX_PROVE }],
          goto: 'prove',
        },
        {
          text: 'Nothing you can do about rooms you\'re not in. Move on.',
          effects: [{ quest: 'cx_life_whisper_q', objective: 'answered' }, { flag: 'cx_life.whisper_stuck' }],
          goto: 'shrug',
        },
      ],
    },
    salvaged: {
      speaker: 'narrator',
      text: 'You spend a hard, unglamorous month reminding people who you are — coffees, callbacks, showing up early, doing the boring reliable things loudly. Reputations are built slow and this is the slow part. It holds.',
      effects: [{ xp: 'business', add: 55 }, { stat: 'cred', add: 2 }],
    },
    faded: {
      speaker: 'narrator',
      text: 'You make the rounds but the whisper got there first and stuck to you. A couple of your reassurances land like a guilty man\'s alibi. The good offers thin out to a trickle you can feel.',
      effects: [{ flag: 'cx_life.whisper_stuck' }, { trait: 'cx_life_blacklisted' }],
    },
    prove: {
      speaker: 'narrator',
      text: 'You put your head down and make something nobody can argue with, and you make sure the right people see it. It\'s the long way around a short problem, and it works better than any amount of talking would have.',
      effects: [{ stat: 'cred', add: 3 }, { xp: 'business', add: 40 }],
    },
    shrug: {
      speaker: 'narrator',
      text: 'You decide it\'s beneath you to fight. The whisper doesn\'t agree, and it isn\'t beneath the whisper. Months later you\'re still wondering why the calls slowed down.',
      effects: [{ flag: 'cx_life.whisper_stuck' }, { trait: 'cx_life_blacklisted' }],
    },
  },
}

const whisperQuest: QuestDef = {
  id: 'cx_life_whisper_q',
  title: 'Complication: A Whisper in the Wrong Room',
  kind: 'personal',
  priority: 5,
  rewards: 'Protect your reputation',
  summary: 'Someone painted you badly in a room that decides who gets work. Left alone, a whisper like that dries up the offers before you know they\'re gone.',
  start: 's1',
  stages: {
    s1: {
      text: 'A whisper is spreading where your work comes from. Get ahead of it in person, out-deliver it, or let it be.',
      objectives: [
        { id: 'answered', text: 'Respond to the whisper', when: { never: true }, hint: 'Answer the mail "re: your name came up" — work the rooms [Business DC 16], let undeniable work circulate, or move on.' },
      ],
      next: [
        { if: { flag: 'cx_life.whisper_beat' }, stage: 'held' },
        { if: { flag: 'cx_life.whisper_prove' }, stage: 'proved' },
        { stage: 'stuck' },
      ],
    },
    held: ending('You did the slow, boring work of being reliable out loud. The whisper couldn\'t compete.', 'completed'),
    proved: ending('You answered a rumor with a result. Nothing shuts up a whisper like proof.', 'completed'),
    stuck: ending('The whisper won the room, and the room decides who gets work. The good offers stopped coming.', 'failed'),
  },
}

const whisperCampaign: EventDef = {
  id: 'cx_life_whisper_campaign',
  category: 'work',
  complication: { sources: ['social'], minTier: 3, maxTier: 5 },
  effects: [{ quest: 'cx_life_whisper_q', start: true }],
  scene: 'cx_life_whisper_scene',
}

// ─────────────────────────────────────────────────────────────────────────────
// cx_life_kim_repeat — Kim repeats something you said; it lands at home (guarded)
// ─────────────────────────────────────────────────────────────────────────────
const kimScene: SceneDef = {
  id: 'cx_life_kim_scene',
  channel: 'chat',
  title: 'i think i messed up',
  from: 'kim',
  start: 'ping',
  nodes: {
    ping: {
      speaker: 'kim',
      text: [
        '"ok before you get mad. i didnt know it was a SECRET secret."',
        '"i might have repeated a thing you said. about the money stuff. to mom. she did NOT take it as a joke and now shes doing the quiet thing and i\'m pretty sure i\'m going to get blamed and i wanted to warn you and also say sorry and also can you not tell her i told you i told her"',
        'Fourteen and already fluent in damage control. She learned it somewhere.',
      ],
      choices: [
        {
          text: '"Not your fault. I put you in that spot. I\'ll fix it." Take the hit.',
          tag: '[Cover for her]',
          effects: [{ npc: 'kim', affinity: 8 }, { flag: 'cx_life.kim_covered' }, { quest: 'cx_life_kim_q', objective: 'handled' }],
          goto: 'cover',
        },
        {
          text: '"Kim. Come on. You know better." Let her feel it a little.',
          effects: [{ npc: 'kim', affinity: -6 }, { flag: 'cx_life.kim_scolded' }, { quest: 'cx_life_kim_q', objective: 'handled' }],
          goto: 'scold',
        },
        {
          text: '"Tell mom it was a story you read online." Coach her to cover.',
          tag: '[Teach a bad habit]',
          effects: [{ npc: 'kim', affinity: 3 }, { flag: 'cx_life.kim_taught_lie' }, { quest: 'cx_life_kim_q', objective: 'handled' }],
          goto: 'coach',
        },
      ],
    },
    cover: {
      speaker: 'narrator',
      text: 'You take the conversation with Mom yourself, kid safely out of the blast radius. It costs you an evening and some pride. Kim doesn\'t say thank you in words — she just starts saving you the good half of things again, which is Kim for I love you.',
      effects: [{ stat: 'mood', add: 3 }],
    },
    scold: {
      speaker: 'kim',
      text: '"...wow. ok. cool. next time i\'ll just let you walk into it then." She logs off. She\'ll get over it. She\'ll also remember that when it counted you made it about her mistake instead of your secret.',
      effects: [{ buff: { ...CX_HEARTSORE, id: 'cx_life_kim_cool', name: 'Kim Is Not Speaking To You', desc: 'Your sister is doing the cold shoulder with the specific talent of a teenager.', days: 14, mods: [{ key: 'mood.daily', add: -0.3 }] } }],
    },
    coach: {
      speaker: 'narrator',
      text: 'You walk her through a plausible cover story, step by step, and she picks it up frighteningly fast. The immediate problem goes away. You try not to think about the thing you just taught your little sister to do well.',
      effects: [{ flag: 'cx_life.kim_taught_lie' }],
    },
  },
}

const kimQuest: QuestDef = {
  id: 'cx_life_kim_q',
  title: 'Complication: Loose Lips',
  kind: 'personal',
  priority: 4,
  rewards: 'Protect your sister — or don\'t',
  summary: 'Kim repeated something she shouldn\'t have, and it landed at the kitchen table. How you handle her teaches her something either way.',
  start: 's1',
  stages: {
    s1: {
      text: 'Kim let something slip to Mom. Take the hit for her, scold her, or teach her to cover it up.',
      objectives: [
        { id: 'handled', text: 'Answer Kim', when: { never: true }, hint: 'Answer Kim\'s chat "i think i messed up" — cover for her, let her feel it, or coach her to lie.' },
      ],
      next: 'done',
    },
    done: ending('Whatever you taught her today, she was watching closely. She always is.', 'completed'),
  },
}

const kimRepeat: EventDef = {
  id: 'cx_life_kim_repeat',
  category: 'family',
  when: { all: [momHere, around('kim')] },
  complication: { sources: ['social'], minTier: 1, maxTier: 3 },
  effects: [{ quest: 'cx_life_kim_q', start: true }],
  scene: 'cx_life_kim_scene',
}

export default defineContent({
  scenes: [
    lieScene,
    friendScene,
    gossipScene,
    riftScene,
    dateScene,
    dateFollowup,
    rivalScene,
    owedScene,
    blowupScene,
    roomScene,
    whisperScene,
    kimScene,
  ],
  quests: [lieQuest, friendQuest, riftQuest, dateQuest, rivalQuest, owedQuest, roomQuest, whisperQuest, kimQuest],
  events: [
    lieUnravels,
    friendUsed,
    gossip,
    familyRift,
    badDate,
    rivalRevenge,
    owedMoney,
    publicBlowup,
    roommateFeud,
    whisperCampaign,
    kimRepeat,
  ],
})
