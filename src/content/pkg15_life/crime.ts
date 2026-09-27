/**
 * PKG-15 — Life events §9.6: the scene's ambient consequences.
 *
 *  - life_script_kiddie_dm   Act II+: a forum kid (a byteme mirror) wants a mentor. Steer him legit /
 *                            teach him caution / ignore him, each with a follow-up (`life.kiddie` str).
 *  - life_old_rival_returns  one-off Act III, once the List exists: l33tKÎLLƏR is on it.
 *                            Sets `npc.flamer.fate` ('helped' | 'schadenfreude'); reads `w.hood_soul`.
 *  - life_webmaster_returns  Act III (`life.webmaster_dark`): Cal Reeves's fraud crew is targeting the
 *                            Row's seniors. Pulling him out redeems him (`npc.webmaster.fate` → 'hired').
 */
import { defineContent } from '@/engine/registry'
import type { SceneDef, TriggerDef } from '@/engine/types'
import { QUIET_RESET, actGte, around, free } from './_shared'

const scenes: SceneDef[] = [
  // ── life_script_kiddie_dm ────────────────────────────────────────────────
  {
    id: 'life_script_kiddie_dm',
    channel: 'chat',
    title: 'u r {handle}??',
    from: 'n0vaKid',
    start: 'start',
    nodes: {
      start: {
        text: [
          `omg u r {handle} right?? THE {handle}`,
          `im n0vaKid. im 15. i read every post u ever made on the board`,
          `i want to be like u. can u teach me?? i already have tools. i got a whole folder off a warez site, it says undetectable`,
          `i dont have a lot of friends irl so`,
        ],
        choices: [
          {
            text: `"delete the folder. then lets talk about programming. real programming"`,
            tag: '[Programming]',
            check: {
              skill: 'programming',
              dc: 13,
              success: 'mentor_ok',
              fail: 'mentor_bored',
              successEffects: [{ flag: 'life.kiddie', set: 'mentored' }, { faction: 'fac.loft', add: 2 }, { stat: 'mood', add: 4 }],
              failEffects: [{ flag: 'life.kiddie', set: 'drifted' }, { stat: 'mood', add: -2 }],
            },
          },
          {
            text: `"rule one: nothing is undetectable. rule two: the person who sold u that is the vulnerability"`,
            tag: '[Social]',
            check: {
              skill: 'social',
              dc: 12,
              bonuses: [{ if: { npc: 'priya', met: true }, add: 2, label: '+2 (you are quoting Priya and it shows)' }],
              success: 'scared_straight',
              fail: 'mentor_bored',
              successEffects: [{ flag: 'life.kiddie', set: 'mentored' }, { faction: 'fac.hood', add: 2 }],
              failEffects: [{ flag: 'life.kiddie', set: 'drifted' }],
            },
          },
          {
            text: `Don't reply.`,
            effects: [{ flag: 'life.kiddie', set: 'ignored' }],
          },
        ],
      },
      mentor_ok: {
        text: [
          `ok. deleted. it was 400mb of stuff i didnt even understand lol`,
          `wait u want me to write a TEXT ADVENTURE? thats like... a game?`,
          `...ok thats actually kind of cool`,
          `ill send it to u when its done. dont laugh at it`,
        ],
      },
      mentor_bored: {
        text: [`ok`, `thats kind of boring tho`, `i thought u were gonna show me the real stuff`, `nvm. ill figure it out myself`],
      },
      scared_straight: {
        text: [
          `wait`,
          `the guy who sold me the tools asked for my home address "for shipping the cd"`,
          `oh no`,
          `ok ok im deleting everything. can u like. check in on me sometimes. so i dont do something dumb`,
        ],
      },
    },
  },
  {
    id: 'life_kiddie_after',
    channel: 'chat',
    title: 'look what i made',
    from: 'n0vaKid',
    start: 'start',
    nodes: {
      start: {
        text: [
          `hey!! remember me. n0va`,
          `i finished it. the text adventure. its called ESCAPE FROM SODIUM ROW. u r in it. ur the wizard`,
          `my cs teacher put it on the school website. 200 ppl played it`,
          `she says i should apply to the lsu summer thing. like the real program`,
          `anyway. thanks. u didnt have to reply to some random kid`,
        ],
        choices: [
          { text: `"the wizard?? im honored. apply to the summer thing. thats an order"`, effects: [{ stat: 'mood', add: 8 }, { faction: 'fac.hood', add: 2 }] },
          { text: `"proud of u kid. keep ur nose clean"`, effects: [{ stat: 'mood', add: 6 }, { stat: 'stress', add: -4 }] },
        ],
      },
    },
  },
  {
    id: 'life_kiddie_gone',
    channel: 'forum',
    board: 'general',
    title: 'anyone heard from n0vaKid?',
    from: 'byteme',
    start: 'start',
    nodes: {
      start: {
        speaker: 'byteme',
        text: [
          `kid used to post here every day. hasnt logged in for 3 weeks. someone said his parents took his computer after "an incident" w the school network`,
          `idk. he was always asking ppl to teach him stuff and nobody ever really did`,
          `reminds me of me lol. except i had ppl`,
          `-- byteme`,
        ],
        choices: [
          { text: `Reply: "he asked me once. i should have answered."`, effects: [{ stat: 'mood', add: -5 }, { npc: 'byteme', affinity: 2 }] },
          { text: `Don't reply.`, effects: [{ stat: 'mood', add: -2 }] },
        ],
      },
    },
  },

  // ── life_old_rival_returns ────────────────────────────────────────────────
  {
    id: 'life_old_rival_returns',
    channel: 'chat',
    title: 'hey. its me',
    from: 'flamer',
    start: 'start',
    nodes: {
      start: {
        effects: [{ npc: 'flamer', met: true }],
        text: [
          `hey. its me. l33tKÎLLƏR. marcus`,
          `i know u hate me. i called u a n00b in 11 fonts. i was 17 and a jerk`,
          `something weird is happening. my insurance got cancelled. my bank froze my card. a guy in a nice car has been parked outside my apartment 3 nights`,
          `somebody on the board said theres a list. like a real list. and my name is on it`,
          `u were always the one who actually knew stuff. i dont know who else to ask`,
          { if: { flag: 'mir.identity', eq: 'stranger' }, text: `You read it twice. After everything he's been to you, the handle on the screen is asking for help. You aren't sure if that makes it easier or much harder.` },
        ],
        choices: [
          {
            text: `"ok. listen carefully and do exactly what i say."`,
            tag: '[OpSec]',
            check: {
              skill: 'opsec',
              dc: 15,
              bonuses: [{ if: { flag: 'a3.the_list_done' }, add: 2, label: '+2 (you know how the List works)' }],
              success: 'helped',
              fail: 'helped_rough',
              successEffects: [{ npc: 'flamer', fate: 'helped', affinity: 20 }, { faction: 'fac.hood', add: 3 }, { var: 'w.hood_soul', add: 1 }],
              failEffects: [{ npc: 'flamer', fate: 'helped', affinity: 10 }, { stat: 'heat', add: 5 }, { flag: 'life.rival_named_you' }, { complication: 'legal' }],
            },
          },
          {
            text: `Get him to Deadline. Deadline knows how to disappear.`,
            if: around('deadline'),
            effects: [{ npc: 'flamer', fate: 'helped', affinity: 15 }, { npc: 'deadline', affinity: 3 }, { faction: 'fac.loft', add: 2 }],
            goto: 'deadline',
          },
          {
            text: `"lol. n00b."`,
            effects: [{ npc: 'flamer', fate: 'schadenfreude', affinity: -20 }, { stat: 'mood', add: 3 }],
            goto: 'schadenfreude',
          },
        ],
      },
      helped: {
        text: [
          `ok. ok. doing it all`,
          `new card from a credit union not a bank. staying at my cousins. phone off. i wrote everything down on PAPER like u said, feels insane`,
          `the car's gone. i dont know if its bc of what we did or bc they got bored`,
          `thanks. seriously`,
          `sorry about the fonts`,
        ],
      },
      helped_rough: {
        text: [
          `ok i did most of it. messed up the part with the phone, i called my mom from it. i know. i KNOW`,
          `the car came back once. then left`,
          `ur name came up tho. when i called my mom. i said "a friend from the board is helping me". i didnt say ur handle. i swear`,
          `anyway. thanks. and sorry. about everything`,
          `oh and my mom told her neighbor who told her cousin who is a "paralegal". so. somebody somewhere has "friend from the board" written on a legal pad. im so sorry`,
        ],
      },
      deadline: {
        speaker: 'deadline',
        text: `Deadline takes the kid in without a word, the way somebody took him in in '94. A week later a text arrives from a number you don't know: "the rival is safe. he talks too much. he cooks surprisingly well. — D." A week after that, one from Marcus: "your friend deadline is TERRIFYING. i love him. sorry about the fonts."`,
      },
      schadenfreude: {
        text: [
          `...`,
          `yeah ok. i deserved that`,
          `forget i asked`,
          { if: { var: 'w.hood_soul', gte: 2 }, text: `You laugh for a minute. Then you don't. On the Row, people you've helped carry around the idea that you are a decent person. You wonder what they'd say about this.`, else: `You laugh for a minute. It's funny. It's funny for almost a whole day.` },
        ],
      },
    },
  },

  // ── life_webmaster_returns ────────────────────────────────────────────────
  {
    id: 'life_webmaster_returns',
    channel: 'dialog',
    title: 'Very Good Typography',
    start: 'start',
    nodes: {
      start: {
        speaker: 'narrator',
        text: [
          `Grandma Ruth hands you a printout at the Cathode. "My pension office has a new website," she says proudly. "I renewed online. I'm modern now."`,
          `It isn't her pension office. It's a perfect copy of it: the right seal, the right colors, a friendly form asking for everything a person has. The typography is beautiful. The layout is clean. There are no animated GIFs at all.`,
          `You know that style. You'd know it anywhere. Somewhere on the Row, Cal Reeves is building fake storefronts for people who steal from grandmothers, and he's very good at his job.`,
        ],
        choices: [
          {
            text: `Take the fake site down before anyone else on the Row fills it in.`,
            tag: '[Intrusion]',
            check: {
              skill: 'intrusion',
              dc: 16,
              success: 'down',
              fail: 'mirror',
              successEffects: [{ faction: 'fac.hood', add: 6 }, { stat: 'heat', add: 4 }, { stat: 'cred', add: 2 }],
              failEffects: [{ faction: 'fac.hood', add: 2 }, { stat: 'heat', add: 7 }, { stat: 'energy', add: -12 }, { stat: 'stress', add: 5 }, { npc: 'webmaster', affinity: -4 }, { chance: 0.3, then: [{ complication: 'hack' }] }],
            },
          },
          {
            text: `Find Cal. Talk to him. Before it's too late for him too.`,
            tag: '[Social]',
            check: {
              skill: 'social',
              dc: 16,
              bonuses: [{ if: { npc: 'webmaster', affinityGte: 5 }, add: 2, label: '+2 (he remembers you tried, once)' }],
              success: 'pulled_out',
              fail: 'cold',
              successEffects: [{ npc: 'webmaster', fate: 'hired', affinity: 10 }, { clearFlag: 'life.webmaster_dark' }, { faction: 'fac.hood', add: 5 }, { var: 'w.hood_soul', add: 1 }],
              failEffects: [{ npc: 'webmaster', affinity: -5 }, { stat: 'mood', add: -4 }, { stat: 'stress', add: 4 }, { chance: 0.3, then: [{ complication: 'social' }] }],
            },
          },
          {
            text: `Hand everything to Detective Calderon.`,
            if: { npc: 'calderon', met: true },
            effects: [{ npc: 'calderon', affinity: 5 }, { faction: 'fac.hood', add: 4 }, { flag: 'life.webmaster_arrested' }],
            goto: 'calderon',
          },
          {
            text: `Just fix Ruth's accounts and warn the Row. Leave Cal to his choices.`,
            effects: [{ faction: 'fac.hood', add: 3 }, { npc: 'grandma_ruth', affinity: 3 }],
            goto: 'warned',
          },
        ],
      },
      down: {
        speaker: 'narrator',
        text: `By morning the beautiful fake pension office shows a plain white page with one line of text: THIS SITE WAS A SCAM. CALL YOUR BANK. — A NEIGHBOR. You spend the afternoon at the Cathode with Ruth and six of her friends, on the payphone and Sal's kitchen line, calling banks. Sal keeps the pie coming. Nobody loses a dime.`,
      },
      mirror: {
        speaker: 'narrator',
        text: `The site goes down, and forty minutes later it's back at a new address, identical, with a little line added at the bottom in the same beautiful font: NICE TRY. Cal always did build for redundancy. You end up doing it the slow way: calling every senior on the Row yourself, one by one, all night.`,
      },
      pulled_out: {
        speaker: 'webmaster',
        text: [
          `You find him in a Millgate loft with four monitors and a bad cough. He looks older than he should. He knows why you're there before you say a word.`,
          `"They pay on time," he says. "That's the thing nobody tells you. The legit clients paid in ninety days. These guys pay Friday." He looks at the screen, at the fake pension seal he drew by hand. "Ruth Alvarez. She used to give me peppermints at the library."`,
          `He deletes the site himself, while you watch. Then the others. It takes an hour. "Reeves Web Works," he says, at the end, hoarsely. "Still got the domain. Still paid up." He looks at you. "You got any clients who pay in ninety days?"`,
        ],
      },
      cold: {
        speaker: 'webmaster',
        text: `"You don't get to do this," Cal says, at the door, not letting you in. "You weren't there when the rent was due. Nobody was." He closes it. The fake site is gone the next day, moved somewhere you can't see. You warn the Row anyway, one door at a time. It isn't the same as saving him.`,
      },
      calderon: {
        speaker: 'calderon',
        text: `Calderon takes the printout, the addresses and the name, and looks at you for a long time. "You know him." You nod. "Then you know this is the good version," she says. "Me, not the feds." Cal is arrested that Thursday. The crew's other sites go dark by the weekend. Ruth sends Calderon a tin of cookies. You don't send anything.`,
      },
      warned: {
        speaker: 'narrator',
        text: `You change Ruth's passwords, call her pension office (the real one), and put a handwritten sign up on the Cathode's corkboard: YOUR PENSION OFFICE WILL NEVER ASK FOR THIS ONLINE. — ASK ME IF YOU'RE NOT SURE. People ask. For months, people ask. Cal's sites keep going up, somewhere else, for somebody else's grandmother.`,
      },
    },
  },
]

const listLive = {
  any: [
    { quest: 'main_a3_q5_the_list', status: ['active', 'completed', 'failed'] as ('active' | 'completed' | 'failed')[] },
    { flag: 'a3.the_list_done' },
  ],
}

const triggers: TriggerDef[] = [
  {
    id: 'life_script_kiddie_dm',
    when: { all: [actGte(2), free, { stat: 'cred', gte: 15 }] },
    atHour: 21,
    chance: 0.02,
    effects: [QUIET_RESET, { scene: 'life_script_kiddie_dm' }],
  },
  {
    id: 'life_kiddie_after',
    when: { all: [{ flag: 'life.kiddie', eq: 'mentored' }, free] },
    atHour: 20,
    chance: 0.005,
    effects: [QUIET_RESET, { scene: 'life_kiddie_after' }],
  },
  {
    id: 'life_kiddie_gone',
    when: { any: [{ flag: 'life.kiddie', eq: 'drifted' }, { flag: 'life.kiddie', eq: 'ignored' }] },
    atHour: 22,
    chance: 0.004,
    effects: [QUIET_RESET, { scene: 'life_kiddie_gone' }],
  },
  {
    id: 'life_old_rival_returns',
    when: { all: [actGte(3), listLive, free] },
    atHour: 23,
    chance: 0.06,
    effects: [QUIET_RESET, { scene: 'life_old_rival_returns' }],
  },
  {
    id: 'life_webmaster_returns',
    when: { all: [actGte(3), { flag: 'life.webmaster_dark' }, free] },
    atHour: 12,
    chance: 0.03,
    effects: [QUIET_RESET, { scene: 'life_webmaster_returns' }],
  },
]

export default defineContent({ scenes, triggers })
