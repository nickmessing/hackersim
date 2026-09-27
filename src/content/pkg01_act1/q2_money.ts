/**
 * PKG-01 — main_a1_q2_first_money and the little tutorial coda main_a1_q2b_first_upgrade (§6.A).
 *
 * Two non-exclusive doors to your first paycheck: a legit bench job at CompCastle under Dee
 * (a1_compcastle), or a starter cracking contract Corvid posts for the scene (a1_crack_starter,
 * owned by PKG-18). Then a nudge to spend your first real money on your first real upgrade, so the
 * shop stops being a mystery.
 *
 * Cross-package: job `job_compcastle_bench` and contract `a1_crack_starter` are PKG-18.
 */
import { defineContent } from '@/engine/registry'
import type { QuestDef, SceneDef } from '@/engine/types'
import { BENCH_JOB, CRACK_CONTRACT, Q2, Q2B, Q3, boughtUpgrade, inAct1 } from './common'

// ── The fork: where does the first dollar come from? ─────────────────────────
const firstMoney: SceneDef = {
  id: 'a1_first_money',
  channel: 'dialog',
  title: 'The First Dollar',
  from: 'jax',
  start: 'intro',
  nodes: {
    intro: {
      speaker: 'jax',
      text: [
        "so here's the thing nobody tells you: being good at computers and having MONEY are two completely different problems. you're about to be good at computers. you are extremely broke.",
        'two doors, and you can walk through both. Door one: CompCastle. the big blue box store on the highway. they hire kids to fix Windows and they pay actual dollars. Dee runs the bench and she is... a lot. you’ll see.',
        "door two: the scene. Corvid posted a starter gig on the board — crack the copy protection on some game, prove you can. no real money in it, but cred. and cred is a currency out here, i promise.",
      ],
      choices: [
        {
          text: 'CompCastle. A steady paycheck sounds amazing right now.',
          effects: [{ flag: 'a1.chose_door' }, { scene: 'a1_compcastle' }],
          goto: 'legit',
        },
        {
          text: "Corvid's gig. I want to earn it out here, not fold sweaters.",
          effects: [{ flag: 'a1.chose_door' }],
          goto: 'scene_gig',
        },
        {
          text: "Why not both? I need money AND a name.",
          effects: [{ flag: 'a1.chose_door' }, { scene: 'a1_compcastle' }],
          goto: 'scene_gig',
        },
        {
          text: '[Arcade rat] "Corvid’s gig. I cracked arcade machines for free games, this is the same thing with better snacks."',
          if: { background: 'arcade_rat' },
          effects: [{ flag: 'a1.chose_door' }, { npc: 'jax', affinity: 2 }],
          goto: 'scene_gig',
        },
      ],
    },
    legit: {
      speaker: 'jax',
      text: [
        "beautiful. go put on your least-wrinkled shirt. Dee hired me in nine minutes once, mostly because i knew where the power button was. the bar is on the FLOOR.",
        "clock in, do your shifts, watch the little job bar fill up. that's a real paycheck, dude. that's rent someday.",
      ],
    },
    scene_gig: {
      speaker: 'narrator',
      text: [
        "Corvid's post is three lines long and signed with a single black feather. A game — some forgettable side-scroller — wrapped in copy protection that, in Corvid's words, \"a determined raccoon could open.\" Crack it, post the method, get your name in the ledger.",
        "It'll land on your board as an offer. Take it in the Operations window when you're ready, and it'll run itself while you work — but the *choosing* is yours.",
        "There's one more question Corvid didn't ask out loud, but everyone's watching for the answer: once you've cracked it, what do you do with the key?",
      ],
      effects: [{ contract: CRACK_CONTRACT }],
      choices: [
        {
          text: 'Keep it clean. Prove I can do it, and leave it at that.',
          effects: [{ flag: 'a1.crack_clean' }],
          goto: 'clean',
        },
        {
          text: "Once it's done, I'll pass the tool around — byteme, the board, whoever wants it.",
          tag: '[Generous]',
          effects: [{ flag: 'a1.sold_tool' }],
          goto: 'shared',
        },
        {
          text: '[Latchkey] Say nothing. Crack it, share nothing, keep my prints off it.',
          if: { background: 'latchkey' },
          effects: [{ flag: 'a1.crack_clean' }, { npc: 'corvid', affinity: 2 }],
          goto: 'quiet',
        },
      ],
    },
    clean: {
      speaker: 'narrator',
      text: [
        "One clean proof, no copies, no bragging. It's the careful move, and out here careful is a compliment.",
        'Now go earn it. The gig is on your board.',
      ],
    },
    shared: {
      speaker: 'narrator',
      text: [
        "Generous. The kids will love you for it, and a tool that helps somebody today has a way of turning up in strange hands a long time from now. But that's a worry for a you who's older and has more to lose.",
        'For now: go crack the thing. The gig is on your board.',
      ],
    },
    quiet: {
      speaker: 'narrator',
      text: [
        'You learned young: the quietest hands leave the fewest marks. You crack it, you learn from it, and it goes nowhere. Corvid, who notices everything, notices that too.',
        'The gig is on your board.',
      ],
    },
  },
}

// ── CompCastle: the hire, the comedy, and Dee ────────────────────────────────
const compCastle: SceneDef = {
  id: 'a1_compcastle',
  channel: 'dialog',
  title: 'CompCastle — Service Bench',
  from: 'dee',
  start: 'interview',
  nodes: {
    interview: {
      speaker: 'dee',
      effects: [{ npc: 'dee', met: true, affinity: 3 }],
      text: [
        'Dolores Briggs. Everybody calls me Dee, including people who shouldn’t. I run this bench like a field hospital and the customers are the wounded. You want to work here?',
        'One question, and there is a wrong answer. A customer calls. The internet is "broken." The whole internet. What do you do?',
      ],
      choices: [
        {
          text: '"Ask them to check the cables and the modem lights first."',
          check: {
            skill: 'systems',
            dc: 8,
            success: 'hired_good',
            fail: 'hired_shaky',
            successEffects: [{ npc: 'dee', affinity: 4 }],
            // Minor check, real cost: Dee hires you on probation, and she never quite forgets it.
            failEffects: [{ npc: 'dee', affinity: -2 }, { stat: 'stress', add: 3 }, { flag: 'a1.dee_probation' }],
          },
        },
        {
          text: '"Tell them the whole internet isn’t broken, it’s probably just them."',
          tag: '[Blunt]',
          goto: 'hired_ok',
        },
        {
          text: '[Silver Tongue] "I make them feel like a genius for calling, then I fix it before they hang up."',
          if: { trait: 'silver_tongue' },
          effects: [{ npc: 'dee', affinity: 6 }],
          goto: 'hired_great',
        },
        {
          text: '[Class clown] "Tell them to try turning the internet off and on again. The whole thing."',
          if: { background: 'class_clown' },
          effects: [{ npc: 'dee', affinity: 3 }],
          goto: 'hired_ok',
        },
      ],
    },
    hired_good: {
      speaker: 'dee',
      text: [
        "Cables and lights. Good. You'd be shocked how many geniuses skip that and start reinstalling Windows. Nine times in ten the monitor’s just unplugged, and here's the sacred rule of this bench:",
        'We do NOT tell the customer the monitor was unplugged. We *heal* the customer. They leave thinking a wizard touched their machine, they tip, they come back. You start Monday.',
      ],
      next: 'plant',
    },
    hired_shaky: {
      speaker: 'dee',
      text: [
        'Cables and lights. Good. And then you keep going. Unprompted, you explain IRQ conflicts, the entire history of the modem, and something about ferrite beads you read on a forum at two in the morning. Dee\'s eyebrows climb until they are nearly a hairline.',
        '"Kid. The customer hung up four minutes ago. The customer is at home crying into a mouse pad." She sighs through her nose. "You know your stuff. You do not know when to stop. So: you\'re hired, on probation. First month you\'re on the returns bin, which is where I put people until they learn the fix is the easy part. Bring a lunch. The returns bin does not break for lunch."',
      ],
      effects: [{ log: 'Dee hired you on probation. The returns bin awaits. So does the nickname.', kind: 'info' }],
      next: 'plant',
    },
    hired_ok: {
      speaker: 'dee',
      text: [
        'Blunt. Technically correct. Emotionally, a disaster. The customer is not broken, the customer is SCARED, and a scared customer does not tip.',
        "But you showed up, you know where the power button is, and that puts you ahead of half my applicants. You start Monday. First lesson: we heal the customer. Go heal the customer.",
      ],
      next: 'plant',
    },
    hired_great: {
      speaker: 'dee',
      text: [
        "...Say that again slower, I want to write it down. \"Make them feel like a genius.\" That's it. That's the whole job. I have managers who never figured that out.",
        "You're hired, and you're wasted on the bench, and I mean that as the highest compliment I have. Start Monday.",
      ],
      next: 'plant',
    },
    plant: {
      speaker: 'dee',
      text: [
        'Oh — and if a customer gets mouthy, you send them to me. I have run this store for eleven years, I have opinions about EVERYTHING, and I have been told, more than once, that I should run for something.',
        'City council, somebody said last week. Me! Can you imagine.',
      ],
      choices: [
        {
          text: '"Honestly? You should. This whole neighborhood could use a Dee."',
          effects: [{ flag: 'npc.dee.encouraged' }, { npc: 'dee', affinity: 4 }],
          goto: 'encouraged',
        },
        {
          text: '"One disaster at a time, boss."',
          goto: 'onward',
        },
      ],
    },
    encouraged: {
      speaker: 'dee',
      text: [
        'Huh. You’re the second person to say that this month. First one I laughed at.',
        "...What's the filing fee for a thing like that, do you know? Never mind. Punch in. We have monitors to plug back in and souls to heal.",
      ],
      effects: [{ flag: 'a1.job_started' }, { faction: 'fac.halcyon', add: 5 }, { job: BENCH_JOB }],
    },
    onward: {
      speaker: 'dee',
      text: ['Smart. Punch in. The customers are already scared and it’s not even Monday.'],
      effects: [{ flag: 'a1.job_started' }, { faction: 'fac.halcyon', add: 5 }, { job: BENCH_JOB }],
    },
  },
}

// ── Jax nudges you toward the shop (q2b) ─────────────────────────────────────
const shopTip: SceneDef = {
  id: 'a1_first_upgrade',
  channel: 'chat',
  title: 'JaxAttack',
  from: 'jax',
  start: 'tip',
  nodes: {
    tip: {
      speaker: 'jax',
      text: [
        'YO you have MONEY now. do you know what money is FOR',
        "its for making your beige box less sad. open the e-Shop. get a real modem, or more RAM, or a book that isn't from the library and 40% underlined already",
        "even a $30 book. buy ONE thing that makes you better. thats the whole game man. spend a little, get a little faster, earn a little more. round and round til youre rich",
      ],
      choices: [
        {
          text: "On it. What should I get first?",
          goto: 'advice',
        },
        {
          text: '[Tinkerer] "I could just build something cheaper myself, you know."',
          if: { background: 'tinkerer' },
          goto: 'tinker',
        },
      ],
    },
    advice: {
      speaker: 'jax',
      text: [
        'depends! more RAM if your machine chokes, a faster modem if downloads make you cry, a book for whatever skill you’re grinding. the shop tells you what each thing does.',
        "just pick one. i believe in you. i believe in your terrible little computer",
      ],
    },
    tinker: {
      speaker: 'jax',
      text: [
        'i mean, yeah, YOU could. show-off. fine, build it, solder it, whatever gets that machine off life support.',
        'the shop still counts as buying an upgrade if you cave. no judgment. some.',
      ],
    },
  },
}

// ── Quests ───────────────────────────────────────────────────────────────────
const firstMoneyQuest: QuestDef = {
  id: Q2,
  title: 'First Money',
  kind: 'main',
  act: 1,
  priority: 99,
  giver: 'jax',
  rewards: 'A paycheck, and a name on the board',
  summary:
    "Talent doesn't pay the phone bill. Find your first income — a steady bench job at CompCastle, a starter gig for the Loft, or both — and put $200 in your pocket.",
  start: 'choose',
  stages: {
    choose: {
      text: 'Two doors to your first dollar: CompCastle’s service bench, or Corvid’s starter contract. Pick one, or walk through both.',
      onEnter: [{ scene: 'a1_first_money' }],
      objectives: [
        {
          id: 'door',
          text: 'Decide how you’ll earn your first money',
          when: { flag: 'a1.chose_door' },
          hint: 'Follow the conversation with Jax. Taking a shift at CompCastle and taking Corvid’s gig are both fine — you can even do both.',
        },
      ],
      next: 'earn',
    },
    earn: {
      text: 'Now go make it real. Work shifts, run the gig, and save up your first $200.',
      objectives: [
        {
          id: 'payday',
          text: 'Hold $200',
          when: { stat: 'money', gte: 200 },
          progress: { of: { stat: 'money' }, target: 200 },
          hint: 'If you took the CompCastle job, clock in via the schedule and collect paychecks. If you took Corvid’s gig, accept it in the Operations window and let it run. Either way, watch the money add up.',
        },
      ],
      onComplete: [
        { log: 'Two hundred dollars. It won’t change your life. It absolutely changes your week.', kind: 'money' },
        { quest: Q3, start: true },
      ],
    },
  },
}

const firstUpgradeQuest: QuestDef = {
  id: Q2B,
  title: 'One Nice Thing',
  kind: 'tutorial',
  act: 1,
  priority: 40,
  giver: 'jax',
  autoStart: { all: [inAct1, { quest: Q2, status: 'completed' }] },
  rewards: 'A faster, happier machine',
  summary:
    "You have money now. Money is for turning into a better machine, and a better machine into more money. Buy your first upgrade and start the wheel turning.",
  start: 'spend',
  stages: {
    spend: {
      text: 'Open the e-Shop and buy one thing that makes you better — a faster modem, more RAM, a book, a decent chair. The wheel starts turning here.',
      onEnter: [{ scene: 'a1_first_upgrade' }],
      objectives: [
        {
          id: 'buy',
          text: 'Buy your first upgrade',
          when: boughtUpgrade,
          hint: 'Open the e-Shop. Hardware makes your machine faster; books speed up study; a chair or coffee machine keeps you going. Even a cheap book counts — pick one and buy it.',
        },
      ],
      onComplete: [
        { notify: 'Upgrade installed. Spend a little, get a little faster, earn a little more — that’s the whole game.', kind: 'good' },
      ],
    },
  },
}

export default defineContent({
  scenes: [firstMoney, compCastle, shopTip],
  quests: [firstMoneyQuest, firstUpgradeQuest],
})
