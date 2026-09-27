/**
 * PKG-01 — main_a1_q5_dads_layoff and main_a1_q6_grandma_job, the Act I climax (bible §6.A).
 *
 * q5: ~November 2001, the paper mill sheds jobs and Dad is laid off. Money pressure begins, and the
 * mill's future as a "data campus" is planted. Dad is left at 'normal' (no fate set in Act I).
 * q6: fixing Ruth Alvarez's infected PC, you find it phoning home to a Millgate firm called Aperture
 * — the first thread of the conspiracy, played as "huh, weird." CP-A2 sets your early stance.
 *
 * Cross-package: news `mill_layoffs`/`aperture_alerted` (PKG-16), quest `side_grandma_pc` (PKG-13),
 * item `aperture_sample` (PKG-00).
 *
 * Fail branch: a botched cleanup mails Ruth's "YOU HAVE WON" to the whole Row (a1_row_chain_letter).
 * How you handle it moves fac.hood and sets a1.row_fixed / .safety_night / .row_spammed / .vcr_story,
 * which the Row's fundraiser in Mom's crisis (PKG-02, a2_mom_bills) remembers.
 */
import { defineContent } from '@/engine/registry'
import type { Effect, QuestDef, SceneDef } from '@/engine/types'
import { Q5, Q6, inAct1 } from './common'

/**
 * A failed cleanup still cleans (the bible's "auto-success with a laugh — no dead end"), but the
 * malware's parting shot mails the whole Row. That spins into a small neighborhood story whose
 * outcome (a1.row_fixed / .safety_night / .row_spammed, plus fac.hood rep) Act II remembers.
 */
const messyClean: Effect[] = [
  { flag: 'a1.grandma_cleaned' },
  { flag: 'a1.ruth_chain_letter' },
  { scene: 'a1_row_chain_letter', delayHours: 72 },
]

// ── q5: Dad's layoff ─────────────────────────────────────────────────────────
const dadLayoff: SceneDef = {
  id: 'a1_dad_layoff',
  channel: 'dialog',
  title: 'The Mill',
  from: 'dad',
  start: 'home',
  nodes: {
    home: {
      speaker: 'narrator',
      text: [
        "Dad comes home at two in the afternoon, which he has not done on a weekday in twenty years. He sets his toolbox by the door the careful way he sets it down when something's wrong, and he sits at the kitchen table, and he doesn't take his coat off.",
        "Mom is already crying, quietly, at the counter, in the particular way of someone who has decided to be strong later.",
      ],
      next: 'dad_speaks',
    },
    dad_speaks: {
      speaker: 'dad',
      text: [
        "Two hundred of us. They read the names off a printout. Twenty years I kept that paper line running, and a man half my age read my name off a printout and thanked me for my service like I was a soldier who lost.",
        "They're not even keeping the building for paper. Word is some company's buying the whole mill to fill it with computers. A 'data campus.' Computers, in my mill.",
        "My father fixed radios. I fixed the line. And now the line's going to be a room full of machines that don't need anybody to fix them at all.",
      ],
      next: 'react',
    },
    react: {
      speaker: 'narrator',
      text: ["He's not asking you for anything. That's the worst part. He's just telling you, because you're the one who understands the machines that are replacing him."],
      choices: [
        {
          text: '"You kept that line running twenty years, Dad. That doesn’t disappear because a printout says so."',
          effects: [{ npc: 'dad', affinity: 6 }, { flag: 'a1.dad_layoff_seen' }],
          goto: 'comfort',
        },
        {
          text: '"Who’s buying the mill? A company doesn’t just fill a building with computers for no reason."',
          tag: '[Curious]',
          effects: [{ npc: 'dad', affinity: 2 }, { flag: 'a1.dad_layoff_seen' }],
          goto: 'curious',
        },
        {
          text: '"Let me teach you the machines, then. If they’re taking over, we get you fluent in them."',
          if: { background: 'tinkerer' },
          effects: [{ npc: 'dad', affinity: 8 }, { flag: 'a1.dad_layoff_seen' }],
          goto: 'teach',
        },
        {
          text: '"We’ll be okay. I’m going to be making real money soon. Let me carry some of it."',
          effects: [{ npc: 'dad', affinity: 4 }, { npc: 'mom', affinity: 3 }, { flag: 'a1.dad_layoff_seen' }],
          goto: 'carry',
        },
      ],
    },
    comfort: {
      speaker: 'dad',
      text: [
        "...Yeah. Yeah. I know that. Some days I know that.",
        "Go on, do your computer thing. I'm gonna fix that squeaky hinge on the bathroom door. Been meaning to. Long as one of us can still fix something.",
      ],
      next: 'close',
    },
    curious: {
      speaker: 'dad',
      text: [
        "Some outfit from Millgate, the foreman said. Doesn't matter. A company's a company; they came, they counted, they cut. You're the one who understands what they're building in there. Maybe someday you tell me.",
        "For now I'm gonna go fix that hinge.",
      ],
      next: 'close',
    },
    teach: {
      speaker: 'dad',
      text: [
        "You'd teach your old man to use one of those things? Me, on a computer.",
        "...Ask me again in a while. Not today. Today I just want to fix a hinge I can actually see. But — I'll think about it. That means something, you offering. It means something.",
      ],
      next: 'close',
    },
    carry: {
      speaker: 'dad',
      text: [
        "No. No, you're eighteen, you don't carry your father. Not yet. Someday, maybe, that's how it goes, but not at eighteen and not because a printout said so.",
        "You want to help? Be good at something they can't take away with a printout. That's all I ever wanted for you anyway.",
      ],
      next: 'close',
    },
    close: {
      speaker: 'narrator',
      text: [
        "He goes to fix the hinge. You hear it stop squeaking, and then you hear nothing, which is worse.",
        "The mill has a new owner and a new future full of machines. You don't think much of it tonight — it's just a name on a foreman's lips, some Millgate outfit. You'll learn the name soon enough. Everyone will.",
      ],
    },
  },
}

const dadQuest: QuestDef = {
  id: Q5,
  title: "Dad's Layoff",
  kind: 'main',
  act: 1,
  priority: 96,
  giver: 'dad',
  autoStart: { all: [inAct1, { day: true, gte: 60 }, { seen: 'a1_mira_dunk' }] },
  rewards: 'The stakes get real',
  summary:
    "The paper mill is cutting two hundred jobs, and Dad's name was on the list. The easy months are over. And the mill's next life — a building full of computers — will matter more than anyone in your kitchen can guess tonight.",
  start: 'hear',
  stages: {
    hear: {
      text: 'Dad came home at two in the afternoon with his coat still on. Go sit at the kitchen table.',
      onEnter: [
        { news: 'mill_layoffs' },
        { flag: 'a1.dad_laid_off' },
        { stat: 'stress', add: 8 },
        { scene: 'a1_dad_layoff' },
      ],
      objectives: [
        {
          id: 'ack',
          text: 'Be there when Dad gets home',
          when: { flag: 'a1.dad_layoff_seen' },
          hint: 'The scene opens itself. Sit with him.',
        },
      ],
      onComplete: [{ quest: Q6, start: true }],
    },
  },
}

// ── q6: The Grandma Job (Act I climax) ───────────────────────────────────────
const grandmaDiscovery: SceneDef = {
  id: 'a1_grandma_discovery',
  channel: 'dialog',
  title: "Ruth's Computer",
  from: 'grandma_ruth',
  start: 'arrive',
  nodes: {
    arrive: {
      speaker: 'grandma_ruth',
      effects: [{ npc: 'grandma_ruth', met: true }],
      text: [
        "Oh, thank goodness, the computer boy! Mrs. Alvarez, three doors down, but you call me Ruth or Grandma Ruth like everyone. Sit, sit, I'll get empanadas, you're too thin.",
        "The computer's gone haywire, mijo. Every time I turn it on it tells me I've WON things. A cruise! A laptop! Ten thousand dollars, twice! I clicked to claim the cruise and now there are little windows EVERYWHERE and it plays a trumpet and it will not stop.",
      ],
      next: 'assess',
    },
    assess: {
      speaker: 'narrator',
      text: [
        "The machine is a museum of every bad decision a trusting person can make online. Toolbars stacked six deep. A cursor with a tail. Something in the corner cheerfully counting down to a prize that does not exist. It is, honestly, kind of magnificent.",
        "You crack your knuckles. This part you can do in your sleep.",
      ],
      choices: [
        {
          text: 'Trace and pull the junk by hand, one hook at a time.',
          tag: '[Hardware]',
          check: {
            skill: 'hardware',
            dc: 10,
            success: 'clean_clean',
            fail: 'clean_messy',
            successEffects: [{ flag: 'a1.grandma_cleaned' }],
            failEffects: messyClean,
          },
        },
        {
          text: 'Kill the processes, purge the startup, scrub it clean from the inside.',
          tag: '[Systems]',
          check: {
            skill: 'systems',
            dc: 10,
            success: 'clean_clean',
            fail: 'clean_messy',
            successEffects: [{ flag: 'a1.grandma_cleaned' }],
            failEffects: messyClean,
          },
        },
        {
          text: '[Tinkerer] Just back up her photos and reinstall the whole thing fresh.',
          if: { background: 'tinkerer' },
          effects: [{ flag: 'a1.grandma_cleaned' }, { npc: 'grandma_ruth', affinity: 4 }],
          goto: 'clean_clean',
        },
      ],
    },
    clean_clean: {
      speaker: 'narrator',
      text: [
        "Twenty minutes and it's a different machine. The trumpet dies mid-fanfare. The tails, the toolbars, the phantom prizes — gone. Ruth watches over your shoulder making sounds of pure wonder, as if you're a magician and not a teenager deleting nonsense.",
        "You're about to call it done. And then you notice the thing that isn't nonsense.",
      ],
      next: 'discovery',
    },
    clean_messy: {
      speaker: 'narrator',
      text: [
        "It fights you. You clear one hook and two more sprout; the trumpet gets a second wind; at one point the cursor gains a SECOND tail, which you didn't know was possible and now can never unknow. Ruth brings you a second plate of empanadas as combat rations.",
        "And somewhere in the fight, the machine gets off one last shot. A cheerful little whoosh from the speakers — SENT — from Ruth's own account, to every single name in her address book, under the subject line YOU HAVE WON!!! (Ruth says hi). You stare at the screen. The screen does not apologize.",
        "But you get there — messy, sweating, victorious, and quietly doomed. And in the wreckage, cleaning up, you notice the thing that was hiding under all the noise.",
      ],
      next: 'discovery',
    },
    discovery: {
      speaker: 'narrator',
      effects: [{ flag: 'a1.grandma_noticed' }],
      text: [
        "Under all the clown-nose garbage, quiet and tidy and not advertising itself at all, is something else. Not a prize scam. Not a toolbar. A small, patient program that wakes at 3:14 every morning, phones a block of addresses across town, whispers something, and goes back to sleep.",
        "You follow the address. It's registered to a Millgate company. “Aperture Data Solutions.” Data hygiene and consumer insight, says their website, above a stock photo of a lighthouse. Whatever that means, it does not obviously involve a widow's dusty PC in Cannery Row.",
        "Ruth's machine has been quietly telling a company across town... something. Every night. For who knows how long. Huh. Weird.",
      ],
      next: 'cp_a2',
    },
    cp_a2: {
      speaker: 'narrator',
      text: [
        "It's probably nothing. It's a botnet, some spam operation, a thousand grandmas' PCs muttering to a marketing firm in their sleep. Boring, even.",
        "But it's the first genuinely strange thing you've found out here, and out here strange things are currency. What do you do with it?",
      ],
      choices: [
        {
          text: 'Tell Corvid everything. She reads this stuff for a living.',
          effects: [
            { faction: 'fac.loft', add: 8 },
            { flag: 'npc.corvid.trusts' },
            { npc: 'corvid', affinity: 5 },
            { var: 'w.exposure', add: 1 },
            { flag: 'a1.grandma_chose' },
          ],
          goto: 'told_corvid',
        },
        {
          text: 'Clean it, say nothing, keep a copy of the little program for yourself.',
          tag: '[Hoard]',
          effects: [
            { item: 'aperture_sample' },
            { flag: 'a1.hoarder' },
            { var: 'w.exposure', add: 1 },
            { flag: 'a1.grandma_chose' },
          ],
          goto: 'kept',
        },
        {
          text: "Report it to NorthLink's abuse line. That's what a responsible person does.",
          tag: '[Report]',
          effects: [
            { faction: 'fac.halcyon', add: 5 },
            { news: 'aperture_alerted' },
            { var: 'w.exposure', add: 1 },
            { flag: 'a1.grandma_chose' },
          ],
          goto: 'reported',
        },
      ],
    },
    told_corvid: {
      speaker: 'corvid',
      text: [
        "...Say the name again. Aperture. Three-fourteen a.m., you said.",
        "Good instinct, bringing this to me instead of posting it. Don't post it. Don't mention it. Finish the grandmother's machine, take the empanadas, and let me look into it quietly. You did right.",
        "(She goes very still when you say the name, in a way you'll remember much later, when still is the last thing anyone can afford to be.)",
      ],
      next: 'wrap',
    },
    kept: {
      speaker: 'narrator',
      text: [
        "You leave Ruth's machine spotless and say nothing about the quiet little program — except that you keep your own copy, tucked away where a raid couldn't find it, because knowledge is capital and you're broke.",
        "You don't know what it is. But you have a feeling, the specific feeling that says: hold onto this. You might be the only person who noticed, and being the only one who noticed is sometimes the most valuable thing there is.",
      ],
      next: 'wrap',
    },
    reported: {
      speaker: 'narrator',
      text: [
        "You do the clean, responsible thing: you write it up plainly and send it to NorthLink's abuse desk. Suspicious nightly traffic from a home PC to an address block registered to Aperture Data Solutions. Please investigate.",
        "You get an automated reply thanking you for your report. Somewhere, a flag goes up on a desk that is not NorthLink's, and a firm that was not worried becomes, very slightly, worried — not about being caught, but about being watched. You've done a good deed. Good deeds, you'll learn, are not free.",
      ],
      next: 'wrap',
    },
    wrap: {
      speaker: 'grandma_ruth',
      text: [
        "All better?! You're a genius, mijo, a genius. Take the empanadas, take these ones too, take them for your mother. And you come back whenever, prize or no prize.",
        {
          if: { flag: 'a1.ruth_chain_letter' },
          text: "And the computer sent everybody a little note to say I'm fine! All by itself! Wasn't that thoughtful of it?",
        },
        "...There won't be more prizes though, will there. I really thought I won that cruise.",
      ],
    },
  },
}

// ── The parting shot: Ruth's machine mailed the whole Row (failed cleanup only) ─
const chainLetter: SceneDef = {
  id: 'a1_row_chain_letter',
  channel: 'mail',
  title: 'FW: FW: FW: YOU HAVE WON!!! (Ruth says hi)',
  from: 'sal',
  start: 'msg',
  nodes: {
    msg: {
      speaker: 'sal',
      text: [
        'Kid.',
        "Ruth's computer sent everybody on the Row a letter that says she won a cruise and we can too if we click the blue thing. Mrs. Ferraro clicked the blue thing. The church office clicked the blue thing TWICE because the first time \"nothing happened.\" Deadline says he didn't click it and I believe him about as far as I can throw the walk-in.",
        "Ruth is telling everybody her computer kid fixed it. Ruth is also telling everybody the cruise is still pending. So half the Row thinks you're a genius and the other half thinks you're the reason the church office computer plays a trumpet now.",
        "Fix it or don't. But decide before Sunday, because I am not explaining this to the bingo committee.",
        '— Sal\nThe Cathode · Open 6 to "whenever"\nP.S. Eat something. You look like a dropped call.',
      ],
      choices: [
        {
          text: 'Go door to door and fix every machine on the Row. For free.',
          tag: '[Fix it all]',
          effects: [
            { flag: 'a1.row_fixed' },
            { faction: 'fac.hood', add: 8 },
            { npc: 'grandma_ruth', affinity: 3 },
            { stat: 'energy', add: -20 },
            { stat: 'stress', add: 6 },
          ],
          goto: 'door_to_door',
        },
        {
          text: 'Turn it into a free "Internet Safety Night" in the Cathode\'s back booth.',
          tag: '[Host]',
          check: {
            skill: 'social',
            dc: 12,
            bonuses: [{ if: { flag: 'a1.posted_cringe' }, add: 1, label: '+1 (you know a thing or two about public embarrassment)' }],
            success: 'safety_night',
            fail: 'safety_flop',
            successEffects: [
              { flag: 'a1.row_fixed' },
              { flag: 'a1.safety_night' },
              { faction: 'fac.hood', add: 10 },
              { npc: 'grandma_ruth', affinity: 4 },
              { npc: 'sal', affinity: 3 },
            ],
            // Minor check, real cost: a wasted night, Sal's coffee urn on your tab, and a story the
            // Row tells for years (a1.vcr_story) — with a chance it turns into something worse.
            failEffects: [
              { flag: 'a1.row_fixed' },
              { flag: 'a1.vcr_story' },
              { faction: 'fac.hood', add: 3 },
              { money: -20 },
              { stat: 'energy', add: -25 },
              { stat: 'stress', add: 8 },
              { chance: 0.3, then: [{ complication: 'social', tier: 1 }] },
            ],
          },
        },
        {
          text: '"It\'s spam, Sal. Everybody gets spam. Tell them to stop clicking things."',
          tag: '[Shrug]',
          effects: [{ flag: 'a1.row_spammed' }, { faction: 'fac.hood', add: -6 }, { npc: 'grandma_ruth', affinity: -3 }],
          goto: 'shrug',
        },
      ],
    },
    door_to_door: {
      speaker: 'narrator',
      text: [
        'You spend a Saturday being passed from kitchen to kitchen like a casserole. Every machine on the Row is a small disaster with a doily on it. You fix eleven. You are fed at nine.',
        'Mrs. Ferraro pinches your cheek and tells the whole street you are "the good kind of computer person," which on Cannery Row is practically a title of nobility. You sleep for fourteen hours and wake up with a reputation.',
      ],
    },
    safety_night: {
      speaker: 'narrator',
      text: [
        'Fourteen people, one whiteboard, Sal\'s coffee, and a single slide that says DO NOT CLICK THE BLUE THING in letters a foot high. You explain what a pop-up is, why cruises are never free, and how to tell a prize from a trap. (Hint: the prize never plays a trumpet.)',
        'Ruth sits in the front row taking notes in a spiral pad. At the end the room applauds like you cured something, and in a small, neighborhood way, you did. Sal refuses to let you pay for coffee for a month.',
      ],
    },
    safety_flop: {
      speaker: 'narrator',
      text: [
        'Nobody comes. Well — three people come, and all three want help setting the clock on a VCR, and you set all three, because what else are you going to do.',
        'Sal charges you twenty dollars for the coffee urn nobody drank. "On principle," Sal says. "The principle is you made coffee for fourteen and three came."',
        'Then you go door to door anyway, tired and humbled, fixing machines until your eyes cross. The Row appreciates it. The Row also tells the VCR story at your expense for years.',
      ],
    },
    shrug: {
      speaker: 'narrator',
      text: [
        'Sal writes back a single line: "Okay, genius." That\'s all. Sal never needs more than a line.',
        'The Row doesn\'t forget. For weeks, when you walk past the church office, the trumpet plays through the open window like a small brass accusation. Ruth still waves at you from her porch. She waves a little less.',
      ],
    },
  },
}

const grandmaQuest: QuestDef = {
  id: Q6,
  title: 'The Grandma Job',
  kind: 'main',
  act: 1,
  priority: 95,
  giver: 'grandma_ruth',
  autoStart: { all: [{ flag: 'a1.dad_laid_off' }, { day: true, gte: 90 }] },
  rewards: 'The first loose thread of something much larger',
  summary:
    "Ruth Alvarez three doors down has the most infected PC in Port Lumen and a bottomless supply of empanadas. Clean it up — and notice the one thing hiding under the noise that isn't a joke at all.",
  start: 'wait',
  stages: {
    wait: {
      text: "Ruth's been asking after the 'computer boy.' Give it a little time — the machine, like the trouble it's hiding, isn't going anywhere.",
      objectives: [
        {
          id: 'ripen',
          text: 'Settle into the autumn of 2001',
          when: { day: true, gte: 90 },
          progress: { of: { day: true }, target: 90 },
          hint: 'Keep living your life — work, study, the board. Ruth’s house call comes due in a few weeks.',
        },
      ],
      next: 'fix_it',
    },
    fix_it: {
      text: "Ruth's PC is a carnival of popups and phantom prizes. Go three doors down and clean it up.",
      onEnter: [{ scene: 'a1_grandma_discovery' }],
      objectives: [
        {
          id: 'clean',
          text: 'Clean the malware off Ruth’s machine',
          when: { flag: 'a1.grandma_cleaned' },
          hint: 'Either route works — it’s a home PC. Even a failed check clears it, just messier — and the mess has a way of getting out onto the Row.',
        },
      ],
      next: 'discovery',
    },
    discovery: {
      text: 'Under all the noise, something quiet is phoning a company across town every night. Follow it.',
      objectives: [
        {
          id: 'notice',
          text: 'Notice what’s hiding under the junk',
          when: { flag: 'a1.grandma_noticed' },
          hint: 'Keep reading the scene — the discovery lands on its own.',
        },
      ],
      next: 'choice',
    },
    choice: {
      text: "You found Aperture's fingerprint in a neighbor's PC. It's probably nothing. Decide what to do with it anyway.",
      objectives: [
        {
          id: 'decide',
          text: 'Decide what to do with what you found',
          when: { flag: 'a1.grandma_chose' },
          hint: 'Tell Corvid, keep a sample for yourself, or report it to NorthLink. There’s no wrong answer — only different ones, and they all matter later.',
        },
      ],
      onComplete: [
        { flag: 'a1.grandma_done' },
        { quest: 'side_grandma_pc', start: true },
        { log: 'Act I is over. You have a name in your pocket — Aperture — and no idea yet what it costs to carry it.', kind: 'story' },
      ],
    },
  },
}

export default defineContent({
  scenes: [dadLayoff, grandmaDiscovery, chainLetter],
  quests: [dadQuest, grandmaQuest],
})
