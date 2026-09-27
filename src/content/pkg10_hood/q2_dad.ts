/**
 * PKG-10 — fac_hood_q2_dad, "Dad's Comeback" (bible §7.5 step 2; renamed from side_dad_comeback).
 *
 * Act IIa comedy with a warm center. Robert Tan has been out of the mill for a year and has fixed
 * every toaster on Cannery Row; now he wants to learn the computer. The player teaches him across
 * three lesson mails (his typing improves from stuck caps lock to a proper signature), then rides
 * along on his first real house call and decides how much to invest in him.
 *
 * Neglect is mechanized without a timer: each lesson mail can be skipped or left to expire, and
 * three skips (or Act III arriving with the lessons unfinished) and he quietly puts the computer
 * back in its box. The quest then fails and `npc.dad.brushed_off` steers him toward `spiral` —
 * but only if Mom is also gone (§4.6).
 *
 * Bad rolls leave marks: every lesson that goes sideways adds to `fac.hood.dad_doubts` (two or more
 * and he freezes at the house call: reactive text and a −2 on letting him lead), and fumbling the
 * payroll machine yourself scrambles the cannery's payroll file — rebuild it overnight, pay the
 * Row's bounced-check fees, own up, or let `fac.hood.payroll_late` follow the Tan name around
 * (a −2 on the business pitch, and the Row brings it up years later).
 *
 * Fate: completing this quest sets `npc.dad.fate = 'retrained'` (this package is the sole writer).
 * `npc.dad.business` marks the "PC Doctor, booked solid" variant and publishes news.dad_business.
 */
import { defineContent } from '@/engine/registry'
import type { Choice, Cond, Effect } from '@/engine/types'
import { DAD_RETRAINED, HOOD_KNOWN, MOM_HOME } from './shared'

const LESSONS = 'fac.hood.dad_lessons'
const SKIPS = 'fac.hood.dad_skips'
/** Every lesson that goes sideways chips at his nerve; the house call reads it. */
const DOUBTS = 'fac.hood.dad_doubts'

const lessonGain: Effect = { var: LESSONS, add: 1 }
const skip: Effect[] = [{ var: SKIPS, add: 1 }, { npc: 'dad', affinity: -3 }]
/** A lesson that went wrong: no progress, a tired evening, and one more reason for him to doubt himself. */
const badLesson: Effect[] = [{ var: DOUBTS, add: 1 }, { npc: 'dad', affinity: -1 }, { stat: 'stress', add: 3 }, { stat: 'energy', add: -6 }]
const shaken: Cond = { var: DOUBTS, gte: 2 }
const PAYROLL_LATE = 'fac.hood.payroll_late'

const inLessons: Cond = { quest: 'fac_hood_q2_dad', status: 'active', stage: 'lessons' }
const lessonDue = (n: number): Cond => ({ all: [inLessons, { var: LESSONS, eq: n }, { var: SKIPS, lte: 2 }] })

const TINKERER = { if: { background: 'tinkerer' }, add: 2, label: 'You learned at his bench' }
const EMPATH = { if: { trait: 'empath' }, add: 2, label: 'Empath' }
const HOTHEAD = { if: { trait: 'hothead' }, add: -2, label: 'Short fuse' }

const skipChoice: Choice = {
  text: '"Can\'t this week, Dad. Next week. Promise."',
  tag: '[Skip]',
  effects: skip,
  goto: 'skip',
}

/** How the house call went changes the opening of the aftermath; the choices are shared. */
const investChoices: Choice[] = [
  {
    text: 'Business cards, a proper toolkit, and an ad in the Row newsletter. On me.',
    tag: '[Invest $400]',
    req: { stat: 'money', gte: 400 },
    reqText: 'Requires $400',
    effects: [
      { money: -400 },
      { flag: 'npc.dad.business' },
      { npc: 'dad', affinity: 10 },
      { faction: 'fac.hood', add: 6 },
    ],
    goto: 'invest_end',
  },
  {
    text: 'Do it properly: a price sheet, his own phone line, and Sal puts his card by the register.',
    check: {
      skill: 'business',
      dc: 14,
      bonuses: [
        { if: HOOD_KNOWN, add: 2, label: 'The Row knows your family' },
        { if: { all: [{ flag: 'fac.hood.payroll_late' }, { not: { flag: 'fac.hood.payroll_fees_paid' } }] }, add: -2, label: 'The Row heard about payroll Friday' },
      ],
      success: 'price_end',
      fail: 'casserole_end',
      successEffects: [{ flag: 'npc.dad.business' }, { npc: 'dad', affinity: 8 }, { faction: 'fac.hood', add: 4 }],
      failEffects: [{ flag: 'npc.dad.casseroles' }, { npc: 'dad', affinity: 4 }, { faction: 'fac.hood', add: 2 }, { stat: 'energy', add: -8 }, { money: -100 }],
    },
  },
  {
    if: { background: 'tinkerer' },
    text: 'Give him his bench back. The one in the basement he taught you on, still carved with your initials.',
    effects: [{ flag: 'npc.dad.business' }, { npc: 'dad', affinity: 12 }, { faction: 'fac.hood', add: 4 }],
    goto: 'bench_end',
  },
  {
    text: '"You don\'t need a plan from me, Dad. You never did."',
    effects: [{ npc: 'dad', affinity: 6 }, { stat: 'mood', add: 5 }],
    goto: 'own_way_end',
  },
]

const houseCallDone: Effect = { flag: 'fac.hood.dad_house_call_done' }

export default defineContent({
  quests: [
    {
      id: 'fac_hood_q2_dad',
      title: "Dad's Comeback",
      kind: 'faction',
      act: 2,
      faction: 'fac.hood',
      giver: 'dad',
      priority: 20,
      autoStart: {
        all: [
          { flag: 'a1.dad_laid_off' },
          { var: 'act', gte: 2 },
          { any: [{ quest: 'fac_hood_q1_grandma', status: 'completed' }, { day: true, gte: 420 }] },
        ],
      },
      rewards: 'Dad back on his feet · Neighborhood rep',
      summary: [
        'The mill let your father go. He still gets up at 5:40 every morning, puts on a flannel shirt and looks for something to fix. By now he has fixed every toaster on Cannery Row.',
        'What the Row has left is broken computers. And he knows exactly one person who understands them.',
      ],
      start: 'ask',
      stages: {
        ask: {
          text: 'Your father has turned the kitchen table into a repair shop for the whole street. Your mother says he has something to ask you, and that you should come to supper and let him ask it.',
          onEnter: [{ scene: 'hood_dad_ask', delayHours: 3 }],
          objectives: [
            {
              id: 'talk',
              text: 'Hear Dad out at the kitchen table',
              when: { flag: 'fac.hood.dad_asked' },
              hint: 'A dialog opens on its own at supper time.',
            },
          ],
          next: 'lessons',
        },
        lessons: {
          text: [
            'Dad wants to learn the computer. Not the games — "the part where it works." He will mail you when he is ready for a lesson, and he will pretend it doesn\'t matter if you can\'t make it.',
            { if: { var: SKIPS, gte: 2 }, text: 'You have put him off twice now. He stopped mentioning the lessons at supper. He has not stopped setting up the machine on the kitchen table every week, just in case.' },
          ],
          objectives: [
            {
              id: 'lessons',
              text: 'Teach Dad the basics (three lessons)',
              when: { var: LESSONS, gte: 3 },
              progress: { of: { var: LESSONS }, target: 3 },
              hint: 'Watch your Mail for Dad. Answer and show up; a patient lesson always works, a clever one can go sideways. Skip three and he will put the computer back in its box.',
            },
          ],
          next: 'house_call',
        },
        house_call: {
          text: 'Three lessons in, and your mother has already told somebody at the cannery that her husband "fixes computers now." Brace yourself.',
          onEnter: [{ scene: 'hood_dad_house_call', delayHours: 36 }],
          objectives: [
            {
              id: 'call',
              text: 'Go with Dad on his first house call',
              when: { flag: 'fac.hood.dad_house_call_done' },
              hint: 'The phone rings early one morning. A dialog opens on its own.',
            },
          ],
          onComplete: [{ npc: 'dad', fate: 'retrained' }],
        },
      },
    },
  ],

  scenes: [
    // ── The ask ────────────────────────────────────────────────────────────
    {
      id: 'hood_dad_ask',
      channel: 'dialog',
      title: "Dad's Question",
      start: 'kitchen',
      nodes: {
        kitchen: {
          speaker: 'narrator',
          text: [
            {
              if: { housing: 'parents_flat' },
              text: 'Supper at the kitchen table, same as every night of your life, except that tonight you have to eat around a toaster.',
              else: 'Your mother calls to say she made too much pork for three people, which is how she says come home for supper. You come home for supper.',
            },
            'The table has been colonized. There is a toaster in pieces on a sheet of newspaper, a clock radio with its back off, and Mrs. Castellano\'s hair dryer, which has been "nearly done" since Tuesday.',
            'Your father is eating with one hand and testing a fuse with the other.',
          ],
          next: 'mom',
        },
        mom: {
          speaker: 'mom',
          text: '"Tell them," your mother says, to your father, about you. "Robert. Tell them what Ruth said."',
          next: 'dad',
        },
        dad: {
          speaker: 'dad',
          text: [
            '"Ruth Alvarez asked me to look at her computer," he says, not looking up. "Not her radio. Her computer. I said I\'d have to ask the expert."',
            '"Eleven months I\'ve been fixing every toaster on this street. For free. Mrs. Castellano paid me in lasagna, which, fair. But there\'s no broken toaster left on the Row, kid. There\'s a Row full of broken computers."',
            '"So." He sets the fuse down. "Teach me the computer. Not the games. The part where it works."',
          ],
          choices: [
            {
              text: '"Yes. Tuesdays. I\'ll bring the good mouse pad."',
              effects: [{ npc: 'dad', affinity: 4 }, { flag: 'fac.hood.dad_asked' }],
              goto: 'yes',
            },
            {
              text: '"Better. First we build you your own machine. From parts."',
              check: {
                skill: 'hardware',
                dc: 12,
                bonuses: [TINKERER],
                success: 'build_ok',
                fail: 'build_smoke',
                successEffects: [
                  { money: -80 },
                  lessonGain,
                  { npc: 'dad', affinity: 6 },
                  { flag: 'npc.dad.own_pc' },
                  { flag: 'fac.hood.dad_asked' },
                ],
                failEffects: [
                  { money: -80 },
                  { npc: 'dad', affinity: 8 },
                  { flag: 'npc.dad.own_pc' },
                  { flag: 'fac.hood.dad_asked' },
                  { flag: 'fac.hood.castellano_dryer' },
                  { faction: 'fac.hood', add: -1 },
                  { xp: 'hardware', add: 30 },
                  { stat: 'mood', add: -3 },
                ],
              },
            },
            {
              text: '"Dad, the CompCastle warehouse is hiring. Wouldn\'t that be simpler?"',
              goto: 'warehouse',
            },
            {
              text: '"I\'m slammed right now. Can we do this later?"',
              tag: '[Not now]',
              effects: [...skip, { npc: 'dad', affinity: -1 }, { flag: 'fac.hood.dad_asked' }],
              goto: 'later',
            },
          ],
        },
        warehouse: {
          speaker: 'dad',
          text: [
            '"I put in at the warehouse. And the hardware store, and the bus company, and the new call center by the ferry." He counts them off on fingers that still have mill grease in the creases.',
            '"The call center said I have \'a great deal of experience for this role.\' That\'s how they say old, kid."',
            '"I don\'t want simpler. I want to be useful."',
          ],
          choices: [
            {
              text: '"Then Tuesdays it is."',
              effects: [{ npc: 'dad', affinity: 2 }, { flag: 'fac.hood.dad_asked' }],
              goto: 'yes',
            },
            {
              text: '"Later, Dad. I mean it. Just not this week."',
              tag: '[Not now]',
              effects: [...skip, { npc: 'dad', affinity: -1 }, { flag: 'fac.hood.dad_asked' }],
              goto: 'later',
            },
          ],
        },
        yes: {
          speaker: 'narrator',
          text: [
            '"Tuesdays," your father says, and goes back to the fuse. He is smiling at it.',
            'Your mother puts another piece of pork on your plate without asking. In this family, that is a medal.',
          ],
        },
        build_ok: {
          speaker: 'narrator',
          text: [
            'Saturday you raid the CompCastle returns bin with the focus of a surgeon and the ethics of a raccoon. By Sunday night there is a beige tower on the kitchen table that is, technically, better than yours.',
            'You narrate every part as it goes in. This is the brain. This is the memory. This is where the files live. He asks where the fuse is. You explain that there isn\'t exactly a fuse. He looks at you like you\'ve told him the car has no brakes.',
            '"This counts as the first lesson," you tell him. He writes that down on the back of an envelope, in capital letters, and underlines it twice.',
          ],
        },
        build_smoke: {
          speaker: 'narrator',
          text: [
            'Your machine lasts four seconds. Then comes a thin, sweet smell of burning dust, and silence.',
            'Your father leans in and sniffs, once, like a man tasting soup. "That\'s your power supply," he says. Before you can argue he has it out of the case and on the newspaper next to the toaster.',
            'He replaces the blown part with one from Mrs. Castellano\'s hair dryer. It boots. You will never tell anyone about this, and neither, you suspect, will Mrs. Castellano, who now owns a hair dryer that no longer works at all.',
            'You never get to the actual lesson. He spends the rest of the night explaining the hair dryer to you.',
            'Mrs. Castellano will, in fact, tell people about it. She will tell them for years. On the Row, a borrowed thing that comes back broken is a story, and a story is forever.',
          ],
        },
        later: {
          speaker: 'narrator',
          text: [
            '"Sure. Later." He picks the fuse back up and turns it over in his fingers, as if something might have changed about it.',
            'Your mother looks at you over her reading glasses for a long, long second, and says nothing, which is worse.',
          ],
        },
      },
    },

    // ── Lesson 1: caps lock ────────────────────────────────────────────────
    {
      id: 'hood_dad_lesson_1',
      channel: 'mail',
      title: 'LESSON TUESDAY??',
      from: 'dad',
      expiresDays: 5,
      onExpire: [{ var: SKIPS, add: 1 }, { npc: 'dad', affinity: -2 }],
      start: 'ask',
      nodes: {
        ask: {
          text: [
            'KID,',
            {
              if: { var: SKIPS, gte: 1 },
              text: 'YOU SAID NEXT WEEK. IT IS NEXT WEEK. THE MACHINE IS STILL ON THE KITCHEN TABLE. YOUR MOTHER IS EATING AROUND IT.',
              else: 'YOUR MOTHER SET UP THE ELECTRONIC MAIL. SHE SAYS I DON\'T HAVE TO YELL. THE KEYBOARD IS YELLING ON ITS OWN AND I DON\'T KNOW HOW TO MAKE IT STOP.',
            },
            'TUESDAY AFTER SUPPER? I HAVE NOT TOUCHED THE MACHINE SINCE IT MADE THE NOISE.',
            'DAD',
          ],
          choices: [
            {
              text: '[Tuesday] Sit beside him, put your hand over his on the mouse, and go slow. As many times as it takes.',
              check: {
                skill: 'social',
                dc: 11,
                bonuses: [EMPATH, HOTHEAD],
                success: 'notes_good',
                fail: 'notes_bad',
                successEffects: [lessonGain, { npc: 'dad', affinity: 3 }],
                failEffects: badLesson,
              },
            },
            {
              text: '[Tuesday] Explain it like a machine: the mouse is a lever, the pointer is the part that moves.',
              check: {
                skill: 'hardware',
                dc: 11,
                bonuses: [TINKERER],
                success: 'notes_machine',
                fail: 'notes_fulcrum',
                successEffects: [lessonGain, { npc: 'dad', affinity: 3 }],
                failEffects: badLesson,
              },
            },
            {
              text: '[Tuesday] Say nothing. Bring crackers. Let him get it wrong until he gets it right.',
              tag: '[Patient]',
              effects: [lessonGain, { npc: 'dad', affinity: 2 }, { stat: 'energy', add: -12 }, { stat: 'stress', add: 5 }],
              goto: 'notes_slow',
            },
            skipChoice,
          ],
        },
        notes_good: {
          text: [
            'LESSON 1 NOTES',
            'THE MOUSE IS NOT A PLANE. YOU DO NOT PULL BACK TO GO UP.',
            'DOUBLE CLICK = TWO KNOCKS. LIKE THE DOOR CODE AT THE MILL, EXCEPT THE DOOR CODE WAS KNOCK KNOCK WAIT KNOCK, WHICH IS WHY IT DID NOT WORK THE FIRST NINE TIMES.',
            'I DID IT FORTY TIMES AFTER YOU LEFT. YOUR MOTHER SAYS IF I DOUBLE CLICK ONE MORE TIME SHE WILL DOUBLE CLICK ME.',
            'THANK YOU KID. DAD',
            'P.S. HOW DO YOU MAKE IT STOP YELLING',
          ],
        },
        notes_machine: {
          text: [
            'LESSON 1 NOTES',
            'YOU SAID IT IS A LEVER. I UNDERSTAND LEVERS.',
            'AFTER YOU LEFT I TOOK THE MOUSE APART TO SEE THE BALL. THE BALL WAS FILTHY. THERE WAS A CRUMB IN THERE FROM THE SIXTIES. I CLEANED THE ROLLERS WITH A COTTON SWAB AND NOW IT GOES LIKE BUTTER.',
            'YOU DID NOT TEACH ME THAT PART. I TAUGHT YOU THAT PART. WE ARE EVEN.',
            'DAD',
          ],
        },
        notes_bad: {
          text: [
            'LESSON 1 NOTES',
            'I KNOW I WAS SLOW. AROUND THE TENTH TIME THE ARROW WENT OFF THE EDGE OF THE SCREEN YOUR VOICE WENT FLAT AND I HEARD IT. IT\'S ALL RIGHT. I SOUNDED LIKE THAT TEACHING YOU TO DRIVE.',
            'THE MOUSE IS IN THE DRAWER. IT KNOWS WHAT IT DID.',
            'NEXT WEEK. I WILL PRACTICE ON MY OWN FIRST SO I DON\'T WASTE YOUR TIME.',
            'DAD',
          ],
        },
        notes_fulcrum: {
          text: [
            'LESSON 1 NOTES',
            'YOU SAID IT WAS A LEVER. IT IS NOT A LEVER. A LEVER HAS A FULCRUM. I LOOKED. THERE IS NO FULCRUM.',
            'I SPENT THE REST OF THE EVENING LOOKING FOR THE FULCRUM. YOUR MOTHER WENT TO BED.',
            'WE WILL TRY AGAIN NEXT WEEK, WHEN YOU HAVE THOUGHT ABOUT IT.',
            'DAD',
          ],
        },
        notes_slow: {
          text: [
            'LESSON 1 NOTES',
            'THREE HOURS. YOU DIDN\'T SAY ONE WORD. YOU ATE ALL THE CRACKERS AND LET ME GET IT WRONG UNTIL I GOT IT RIGHT.',
            'THAT IS HOW MY FATHER TAUGHT ME RADIOS. I DIDN\'T KNOW YOU KNEW THAT.',
            'DAD',
          ],
        },
        skip: {
          text: 'OK. NEXT WEEK. DAD',
        },
      },
    },

    // ── Lesson 2: lowercase ────────────────────────────────────────────────
    {
      id: 'hood_dad_lesson_2',
      channel: 'mail',
      title: 'lesson 2 (i found the yelling button)',
      from: 'dad',
      expiresDays: 5,
      onExpire: [{ var: SKIPS, add: 1 }, { npc: 'dad', affinity: -2 }],
      start: 'ask',
      nodes: {
        ask: {
          text: [
            'kid,',
            'i found the button that was yelling. it is called caps lock. i have locked it forever.',
            {
              if: { var: SKIPS, gte: 1 },
              text: 'i know you\'re busy. your mother says i should stop asking and i said i will stop asking when the tax papers are in the computer. so this is me asking.',
              else: 'your mother wants to put the tax papers in the computer. i said the tax papers go in the green box in the hall closet, where they have gone since 1979. she says that is what the computer is FOR. (i unlocked it for that word and locked it again.)',
            },
            { if: { var: DOUBTS, gte: 1 }, text: 'i tried the machine on my own after last time. it did not go great. i will not be telling you about it.' },
            'i need you to show me where things GO in there. i opened a thing called my documents and it was empty, and that made me nervous. like opening the toolbox and finding no tools.',
            'thursday?',
            'dad',
          ],
          choices: [
            {
              text: '[Thursday] Use his own garage: every tool gets a place, every place gets a label. Folders are drawers.',
              check: {
                skill: 'systems',
                dc: 12,
                bonuses: [TINKERER],
                success: 'notes_drawers',
                fail: 'notes_lost',
                successEffects: [lessonGain, { npc: 'dad', affinity: 3 }],
                failEffects: badLesson,
              },
            },
            {
              text: '[Thursday] Let him drive. Every time he stalls, ask: "Where would you put it in the garage? Put it there."',
              check: {
                skill: 'social',
                dc: 12,
                bonuses: [EMPATH, HOTHEAD],
                success: 'notes_drive',
                fail: 'notes_lost',
                successEffects: [lessonGain, { npc: 'dad', affinity: 3 }],
                failEffects: badLesson,
              },
            },
            {
              text: '[Thursday] Practice on a shoebox of Mom\'s receipts, one at a time, all evening.',
              tag: '[Patient]',
              effects: [lessonGain, { npc: 'dad', affinity: 2 }, { npc: 'mom', affinity: 2 }, { stat: 'energy', add: -12 }, { stat: 'stress', add: 4 }],
              goto: 'notes_receipts',
            },
            skipChoice,
          ],
        },
        notes_drawers: {
          text: [
            'lesson 2 notes',
            'a folder is a drawer. a drawer can have a drawer inside it. that is the whole trick, and nobody told me in fifty years.',
            'i made a folder called IMPORTANT and put everything in it, including a folder called IMPORTANT 2. your mother says that defeats the purpose. she is right. i am keeping it.',
            'dad',
          ],
        },
        notes_drive: {
          text: [
            'lesson 2 notes',
            'where would i put it in the garage. put it there.',
            'i wrote that on a piece of tape and stuck it on the bottom of the screen. it is the best instruction manual anybody has ever given me, including the one for the winder, which was in german.',
            'dad',
          ],
        },
        notes_receipts: {
          text: [
            'lesson 2 notes',
            'four hundred and twelve receipts. one folder per year. one folder per store. your mother came in at eleven and saw the screen and didn\'t say anything, she just put her hand on my shoulder for a second.',
            'we are a paperless household now. except for the green box. the green box stays.',
            'dad',
          ],
        },
        notes_lost: {
          text: [
            'lesson 2 notes',
            'i lost the tax papers. not the real ones. those are in the green box. the computer ones.',
            'they are somewhere inside IMPORTANT, or maybe inside IMPORTANT 2, or maybe the machine ate them. we will try again. i am not upset.',
            'i am a little upset.',
            'dad',
          ],
        },
        skip: {
          text: 'ok. next week. dad',
        },
      },
    },

    // ── Lesson 3: proper case ──────────────────────────────────────────────
    {
      id: 'hood_dad_lesson_3',
      channel: 'mail',
      title: 'Lesson 3: The Internet (Briefly)',
      from: 'dad',
      expiresDays: 5,
      onExpire: [{ var: SKIPS, add: 1 }, { npc: 'dad', affinity: -2 }],
      start: 'ask',
      nodes: {
        ask: {
          text: [
            'Kid,',
            'Proper capital letters this time. Kim showed me the shift key and then charged me a dollar.',
            { if: { var: DOUBTS, gte: 2 }, text: 'I will be honest with you, because your mother says I should be. I am starting to think the machine and I do not get along. Twice now the lessons have gone sideways. I can fix a winder blindfolded and I cannot make a folder stay where I put it.' },
            'Last lesson, if you\'re willing. The Internet. I want to find the fellows from the mill. Stosh Wierzbicki, Big Eddie, Ramon from the pulper. Nobody has called anybody since the layoffs. Kim says there are "forums" for everything. I don\'t believe there\'s a forum for paper men, but she says I\'ll be surprised.',
            {
              if: { var: SKIPS, gte: 1 },
              text: 'I know it\'s been a while. The eggs are the same eggs. Come when you can.',
              else: 'Saturday morning. I\'ll make eggs.',
            },
            'Robert Tan\nPaper Line, Port Lumen Mill, 1981–2001\n(Retired, temporarily)',
          ],
          choices: [
            {
              text: '[Saturday] Get him online yourself: the dialer settings, the handshake, and a heroic amount of patience with NorthLink support.',
              check: {
                skill: 'networking',
                dc: 12,
                success: 'notes_online',
                fail: 'notes_hold',
                successEffects: [lessonGain, { npc: 'dad', affinity: 5 }],
                failEffects: [...badLesson, { money: -20 }],
              },
            },
            {
              text: '[Saturday] Sit on your hands and let him type the question himself: "where do paper mill men talk."',
              check: {
                skill: 'social',
                dc: 12,
                bonuses: [EMPATH, HOTHEAD],
                success: 'notes_found',
                fail: 'notes_petfood',
                successEffects: [lessonGain, { npc: 'dad', affinity: 5 }],
                failEffects: badLesson,
              },
            },
            {
              text: '[Saturday] Eat the eggs. Take all morning. Let the modem sing as many times as he wants to hear it.',
              tag: '[Patient]',
              effects: [lessonGain, { npc: 'dad', affinity: 4 }, { stat: 'energy', add: -12 }, { stat: 'stress', add: 3 }],
              goto: 'notes_online',
            },
            skipChoice,
          ],
        },
        notes_online: {
          text: [
            'Lesson 3 notes.',
            'The noise it makes when it connects sounds exactly like the pulper warming up on a cold morning. I sat and listened to it twice after you left.',
            'There IS a forum for paper men. "PaperHands of the Sound." Forty-one members. Stosh is on it. He drives a school bus now and says the kids are worse than the foreman. Big Eddie sells insurance and says it\'s worse than the mill. Ramon passed in March. Nobody told me. I suppose there was nobody to tell me.',
            'I wrote something for him on there. Twelve people answered. I read all of them to your mother.',
            'Thank you for Saturday. I mean it.',
            'Robert Tan\nPaper Line, Port Lumen Mill, 1981–2001\n(Retired, temporarily)',
          ],
        },
        notes_found: {
          text: [
            'Lesson 3 notes.',
            'You didn\'t touch the keyboard once. I could see it was killing you.',
            'I typed "where do paper mill men talk" and the machine gave me four hundred answers, and the ninth one was us. "PaperHands of the Sound." Stosh is on it. Big Eddie is on it. Ramon passed in March. Nobody told me.',
            'I found it myself, kid. I want you to know I know you let me.',
            'Robert Tan\nPaper Line, Port Lumen Mill, 1981–2001\n(Retired, temporarily)',
          ],
        },
        notes_hold: {
          text: [
            'Lesson 3 notes.',
            'We did not get on the Internet. We got on hold with NorthLink for two hours and ten minutes.',
            'A young man named Terrence at the support line tried very hard. He is coming for dinner on Sunday. Your mother has already started cooking. I don\'t know how that happened either.',
            'Next weekend, then. Terrence says to "try turning it off and on again" in the meantime. I\'ve been doing that my whole life.',
            'Your mother found the support call on the phone bill. Twenty dollars. She circled it in red and stuck it to the machine. I think it is a message for both of us.',
            'Dad',
          ],
        },
        notes_petfood: {
          text: [
            'Lesson 3 notes.',
            'I typed "where do paper mill men talk" into the wrong box and now the machine thinks I want to buy forty pounds of dog food. It keeps offering. I don\'t have a dog.',
            'You laughed so hard you had to go outside. I heard you through the window. It\'s all right, I laughed too, after.',
            'Next weekend. Eggs again. Bring your good patience.',
            'Dad',
          ],
        },
        skip: {
          text: 'All right. Another Saturday. — Dad',
        },
      },
    },

    // ── The house call ─────────────────────────────────────────────────────
    {
      id: 'hood_dad_house_call',
      channel: 'dialog',
      title: 'The House Call',
      start: 'phone',
      nodes: {
        phone: {
          speaker: 'narrator',
          text: 'Thursday, 7:40 in the morning. The phone rings the way phones only ring when something is on fire.',
          next: 'phone_dad',
        },
        phone_dad: {
          speaker: 'dad',
          text: [
            '"Kid. Don\'t be mad at your mother."',
            '"She told the cannery office I fix computers now. Their payroll machine died last night. Two hundred people get paid tomorrow, and Mr. Halvorsen is standing in the parking lot sweating through a very nice shirt."',
            '"I told him nine o\'clock. It\'s eight forty. I\'m in the car. I think I need you in the car too."',
          ],
          choices: [
            { text: '"On my way. Don\'t touch anything until I get there."', goto: 'office' },
            {
              text: '"You\'ve got this, Dad. I\'ll meet you there. As backup."',
              effects: [{ npc: 'dad', affinity: 2 }],
              goto: 'office',
            },
          ],
        },
        office: {
          speaker: 'narrator',
          text: [
            'The cannery office smells like fish, toner and panic. The payroll machine squats under the window: a beige tower old enough to have its own pension, with a strip of masking tape across the front that reads PAYROLL — DO NOT TOUCH — HALVORSEN.',
            {
              if: MOM_HOME,
              text: 'Your mother is at her desk across the room, reconciling invoices with enormous concentration. She does not look up. Her ears are pointed at you like satellite dishes.',
            },
            'Mr. Halvorsen shakes your hand, then your father\'s, then yours again. "It was fine yesterday," he says, which is what everyone says about everything. "Then there was a smell."',
            'Your father kneels beside the tower and sniffs, once, like a man tasting soup.',
            { if: shaken, text: 'Then he looks up at you, and waits. Two lessons that went sideways have taught him to wait for you. You wish they hadn\'t.' },
          ],
          choices: [
            {
              text: 'Pop the case and find the fault yourself. Fast. Two hundred paychecks.',
              check: {
                skill: 'hardware',
                dc: 14,
                bonuses: [TINKERER, { if: { flag: 'npc.dad.own_pc' }, add: 1, label: 'You built his machine' }],
                success: 'you_fix',
                fail: 'dad_fix',
              },
            },
            {
              text: '"Don\'t open it yet, Dad. Tell me what you see. What you smell." Make him lead.',
              check: {
                skill: 'social',
                dc: 13,
                bonuses: [
                  { if: { var: LESSONS, gte: 3 }, add: 2, label: 'Three lessons in' },
                  { if: shaken, add: -2, label: 'He has stopped trusting himself' },
                  EMPATH,
                  HOTHEAD,
                ],
                success: 'dad_leads',
                fail: 'you_take_over',
              },
            },
            {
              text: 'Hand him the screwdriver and keep your mouth shut. It\'s his house call.',
              tag: '[Trust him]',
              goto: 'dad_slow',
            },
          ],
        },
        you_fix: {
          speaker: 'narrator',
          text: [
            'Nine minutes. The power supply has given up the ghost; there is a spare in the supply closet behind a box of hairnets. The machine chimes, and Mr. Halvorsen makes a sound like a kettle.',
            'He pumps your hand. Over his shoulder you can see your father at the window, looking out at the cannery lot, holding the screwdriver he never got to use.',
          ],
          choices: [
            {
              text: '"Dad found it. He smelled it before I opened the case. I just held the flashlight."',
              effects: [{ npc: 'dad', affinity: 5 }, { faction: 'fac.hood', add: 2 }],
              goto: 'after',
            },
            {
              text: 'Take the handshake. Take the forty dollars Halvorsen presses on you.',
              effects: [{ money: 40 }, { npc: 'dad', affinity: -2 }, { flag: 'npc.dad.overshadowed' }],
              goto: 'after',
            },
          ],
        },
        dad_fix: {
          speaker: 'narrator',
          text: [
            'You pull the wrong card first. Then the right card, which turns out to also be the wrong card. Behind you, your father says, gently, "Kid."',
            '"That\'s a capacitor." He points with the screwdriver. "See the top? Swollen. Like a bad can of tomatoes."',
            'He has a soldering iron in his coat pocket. Of course he does. He has a spare from a dead clock radio in the other pocket. Of course he does. Twenty minutes later the payroll machine chimes, and Mr. Halvorsen hugs him, and your father pats his back twice, the way men of his generation hug.',
          ],
          effects: [{ npc: 'dad', affinity: 8 }, { stat: 'mood', add: -3 }],
          next: 'payroll_scrambled',
        },
        payroll_scrambled: {
          speaker: 'narrator',
          text: [
            'The hug lasts exactly until Mr. Halvorsen opens the payroll program. Tomorrow\'s batch, two hundred names, is a wall of question marks and little empty boxes. The first card you pulled, the wrong one, was the one talking to the disk at the time.',
            '"That\'s tomorrow," Halvorsen says, very quietly. "That\'s everybody."',
            { if: MOM_HOME, text: 'Across the room your mother has stopped pretending not to listen. She knows every name in that file. Half of them came to her wedding.' },
            'Your father looks at the screen, then at you. There is nothing on this machine he can smell.',
          ],
          choices: [
            {
              text: 'Rebuild the batch tonight from the paper timecards. Every name, every hour, by hand.',
              check: {
                skill: 'programming',
                dc: 14,
                bonuses: [
                  { if: { skill: 'systems', gte: 25 }, add: 1, label: 'You know how these old boxes keep their files' },
                  { if: MOM_HOME, add: 2, label: 'Mom knows every timecard by heart' },
                ],
                success: 'payroll_saved',
                fail: 'payroll_late',
                successEffects: [{ stat: 'energy', add: -20 }, { stat: 'stress', add: 6 }, { faction: 'fac.hood', add: 3 }, { npc: 'dad', affinity: 3 }],
                failEffects: [
                  { flag: PAYROLL_LATE },
                  { faction: 'fac.hood', add: -5 },
                  { if: MOM_HOME, then: [{ npc: 'mom', affinity: -3 }] },
                  { npc: 'dad', affinity: -2 },
                  { stat: 'energy', add: -20 },
                  { stat: 'stress', add: 8 },
                  { chance: 0.3, then: [{ complication: 'social' }] },
                ],
              },
            },
            {
              text: 'Tell Halvorsen payroll goes out a day late, and you\'ll cover every bounced-check fee on the Row yourself.',
              tag: '[Pay $400]',
              req: { stat: 'money', gte: 400 },
              reqText: 'Requires $400',
              effects: [{ money: -400 }, { flag: PAYROLL_LATE }, { flag: 'fac.hood.payroll_fees_paid' }, { faction: 'fac.hood', add: -1 }, { stat: 'stress', add: 4 }],
              goto: 'payroll_covered',
            },
            {
              text: 'Tell Halvorsen the truth, in front of everyone: your father fixed the machine. You broke the file.',
              tag: '[Honest]',
              effects: [{ flag: PAYROLL_LATE }, { flag: 'fac.hood.payroll_owned_up' }, { faction: 'fac.hood', add: -3 }, { npc: 'dad', affinity: 4 }, { stat: 'stress', add: 5 }],
              goto: 'payroll_truth',
            },
          ],
        },
        payroll_saved: {
          speaker: 'narrator',
          text: [
            'You and your father spread two hundred timecards across the cannery office floor like the world\'s worst jigsaw puzzle. He reads the hours out loud in his foreman\'s voice; you type.',
            { if: MOM_HOME, text: 'Your mother brings coffee at midnight, takes one look at the stack, and starts reading the names from memory, faster than either of you can find the cards.' },
            'At 5:52 a.m. the batch runs clean. Two hundred people get paid on time tomorrow and will never know how close it was. Mr. Halvorsen is asleep in his very nice shirt, in a chair, with his mouth open. Your father puts a coat over him.',
          ],
          next: 'after',
        },
        payroll_late: {
          speaker: 'narrator',
          text: [
            'At six in the morning you are still typing. At nine, two hundred people line up at the cannery office window for checks that are not there. Mr. Halvorsen tells them the computer broke. He doesn\'t say who broke it. He doesn\'t have to. He just looks at the door, where your father is standing with his toolkit.',
            'By Monday the story on the Row is that the Tan kid fried the cannery payroll. By Wednesday the story is that Robert Tan did. Stories on the Row always end up on the oldest name available.',
            { if: MOM_HOME, text: 'Your mother goes to work every day that week with her chin up, and eats lunch at her desk.' },
          ],
          next: 'after',
        },
        payroll_covered: {
          speaker: 'narrator',
          text: [
            'Payroll goes out a day late. You hand Mr. Halvorsen an envelope and a list: any bank fee, any bounced rent check, any late charge on anything, send it to you.',
            'Eleven people do. One of them is Mrs. Castellano, whose fee is four dollars and whose note is two pages. The Row notices that you paid. The Row notices everything, and it files the payroll under "handled," which is the second-best drawer there is.',
          ],
          next: 'after',
        },
        payroll_truth: {
          speaker: 'narrator',
          text: [
            'You tell Halvorsen, in front of your father, in front of the whole office: the wrong card was yours. Your father fixed the machine. You broke the file.',
            'Payroll goes out a day late. On the Row, the story becomes that the Tan kid broke it and owned it, which on the Row is almost as good as not breaking it. In the car your father says, "You didn\'t have to do that." Then, a block later: "Yes you did."',
          ],
          next: 'after',
        },
        dad_leads: {
          speaker: 'narrator',
          text: [
            'You ask questions. He answers them. "Smells like the motor on the number two winder," he says, "the week before it quit." You ask what he did about the winder. He tells you. You say, "So do that."',
            'He finds it himself: a swollen capacitor on the power board, the size of a thumbnail. He fixes it himself. Mr. Halvorsen pays him sixty dollars cash, and your father folds the bills slowly, like they\'re a letter.',
            {
              if: MOM_HOME,
              text: 'Across the room your mother dabs at her eyes with a tissue and informs nobody in particular that it\'s the toner.',
              else: 'On the way out he stops in the doorway and looks back at the machine, humming away under the window, the way he used to look back at the paper line at the end of a shift.',
            },
          ],
          effects: [{ npc: 'dad', affinity: 8 }, { faction: 'fac.hood', add: 3 }],
          next: 'after',
        },
        you_take_over: {
          speaker: 'narrator',
          text: [
            'He talks too slowly. Halvorsen keeps checking his watch. Around the fourth "now, what I\'m seeing here," you hear yourself say "Here, let me," and take the screwdriver out of your father\'s hand.',
            'It works. Payroll runs. Two hundred people will be paid tomorrow.',
            'In the car, your father doesn\'t turn the radio on.',
          ],
          effects: [{ npc: 'dad', affinity: -4 }, { flag: 'npc.dad.overshadowed' }],
          next: 'after',
        },
        dad_slow: {
          speaker: 'narrator',
          text: [
            'It takes him two hours and ten minutes. He reads the sticker on every part. He reads the manual, which was printed in 1996 and is mostly about warranties.',
            'Twice Mr. Halvorsen opens his mouth. Twice your father raises one finger without looking up, the way he used to raise a finger on the mill floor, and twice Mr. Halvorsen closes his mouth again.',
            'At 11:49 the machine chimes. Payroll runs with eleven minutes to spare. You have aged a year. He has, somehow, gotten younger.',
          ],
          effects: [{ npc: 'dad', affinity: 6 }, { stat: 'stress', add: 5 }, { faction: 'fac.hood', add: 2 }],
          next: 'after',
        },
        after: {
          speaker: 'dad',
          text: [
            'Afterwards, in the car, with the heater ticking.',
            { if: { all: [{ flag: PAYROLL_LATE }, { not: { flag: 'fac.hood.payroll_owned_up' } }] }, text: '"Two hundred people got paid a day late," he says, "because of us." He says us. He means it kindly. It sits in the car between you anyway, like a third passenger.' },
            '"So," he says. "I think somebody might pay me to do that again."',
            {
              if: { flag: 'npc.dad.overshadowed' },
              text: '"Or maybe this isn\'t for me." He watches the windshield wipers. "You did it faster. You do everything faster. That\'s how it should be, I suppose."',
            },
          ],
          choices: [
            {
              if: { flag: 'npc.dad.overshadowed' },
              text: '"Dad. Today was on me. You had it, and I took it from you."',
              effects: [{ npc: 'dad', affinity: 4 }, { flag: 'npc.dad.mended' }],
              goto: 'after_mended',
            },
            ...investChoices,
          ],
        },
        after_mended: {
          speaker: 'dad',
          text: [
            'He is quiet for a block. Then he snorts.',
            '"I took the car keys off my father once. He was halfway through backing out of the driveway. I thought he was going too slow." A long pause. "He wasn\'t."',
            '"All right. So. Somebody might pay me to do that again."',
          ],
          choices: investChoices,
        },
        invest_end: {
          speaker: 'narrator',
          text: [
            'The cards come back from the print shop on Weir Street a week later. ROBERT TAN — COMPUTER REPAIR — HOUSE CALLS. He reads the first one four times. He puts the second one in his wallet, behind your mother\'s picture.',
            'The toolkit has forty-two pieces and a case that snaps shut with a sound he makes you listen to more than once. The Row newsletter runs his ad between the Knights of the Harbor fish fry and a lost cat named Modem.',
          ],
          effects: [houseCallDone],
        },
        price_end: {
          speaker: 'narrator',
          text: [
            'You write it all out on a legal pad at the Cathode: a price for a house call, a price for a virus, a price for "my grandson did something." Sal reads it over your shoulder and adds a line at the bottom — "Sal: free" — and tapes your father\'s card to the register himself.',
            'Your father reads the price sheet like a contract with the devil. Then he signs the bottom of it, which it did not need, and folds it into his shirt pocket.',
          ],
          effects: [houseCallDone],
        },
        casserole_end: {
          speaker: 'narrator',
          text: [
            'The price sheet is a work of art. He reads it, nods, and folds it very small.',
            '"I\'m not charging Ruth Alvarez forty dollars," he says. "She brought me soup when your grandmother died. I\'m not charging Mrs. Castellano. I\'m not charging anybody on this street who knew me when I had a job."',
            'Within the month he is the busiest unpaid technician in Port Lumen. He is paid in casseroles, pierogi, a tray of baklava the size of a manhole cover, and, on one occasion, a live chicken. Your mother has had to buy a second freezer. You paid for half of it. Nobody has paid for the price sheet.',
          ],
          effects: [houseCallDone],
        },
        own_way_end: {
          speaker: 'narrator',
          text: [
            'He doesn\'t say anything. He doesn\'t have to. He drives the long way home, past the mill with its gates chained shut, and for the first time in a year he doesn\'t slow down to look at it.',
            'By the end of the month Ruth\'s PC is running, Mrs. Castellano\'s hair dryer has been returned to her in better condition than it left, and three more neighbors have his number written on the inside of a cupboard door.',
          ],
          effects: [houseCallDone],
        },
        bench_end: {
          speaker: 'narrator',
          text: [
            'You carry the bench up from the basement together, the way you carried it down together when you were eleven and he decided you were old enough. Your initials are still in the corner where you carved them with his good awl, and got grounded for it.',
            'He runs his thumb over them. "Still a terrible job," he says. "Looks like a ransom note."',
            'By the end of the month there is a hand-lettered sign in the front window of the flat: R. TAN — REPAIRS — RADIOS, TOASTERS, COMPUTERS. The computers were your idea. The order was his.',
          ],
          effects: [houseCallDone],
        },
      },
    },

    // ── He put it back in the box ──────────────────────────────────────────
    {
      id: 'hood_dad_gave_up',
      channel: 'mail',
      title: 'the computer',
      from: 'mom',
      start: 'letter',
      nodes: {
        letter: {
          text: [
            '{name},',
            'Your father put the computer back in its box tonight. He did it very carefully, the way he packs up his tools. He said you\'re busy, and that\'s all right, and that he\'s too old for it anyway.',
            'He is not too old for it. He is fifty-one.',
            'I\'m not writing to make you feel bad. I\'m writing because he won\'t.',
            'Mom',
            'P.S. There is pork in the freezer with your name on it. Literally. I wrote on the bag.',
          ],
          choices: [
            { text: '"I\'m sorry, Mom. Tell him I\'m sorry."', effects: [{ npc: 'mom', affinity: 1 }], goto: 'tell_him' },
            { text: '"I\'ve had a lot going on. He knows that."', effects: [{ npc: 'mom', affinity: -2 }], goto: 'knows' },
          ],
        },
        tell_him: {
          text: ['Tell him yourself. He\'s in the garage. He\'s always in the garage now.', 'Mom'],
        },
        knows: {
          text: ['He knows. That\'s the part I wanted you to think about.', 'Mom'],
        },
      },
    },
    {
      id: 'hood_dad_gave_up_kim',
      channel: 'chat',
      title: 'dad',
      from: 'kim',
      start: 'ping',
      nodes: {
        ping: {
          text: [
            'hey',
            'dad put the computer back in the box',
            'he said ur busy and its fine',
            'its not fine. just fyi',
          ],
          choices: [
            { text: 'ill call him', effects: [{ npc: 'kim', affinity: 1 }], goto: 'call' },
            { text: 'kim i literally cant rn', effects: [{ npc: 'kim', affinity: -2 }], goto: 'cant' },
          ],
        },
        call: { text: 'k. he picks up on the 4th ring now. he didnt used to' },
        cant: { text: 'yeah. nobody can. thats kind of the problem' },
      },
    },

    // ── PC Doctor, booked solid ────────────────────────────────────────────
    {
      id: 'hood_dad_booked_solid',
      channel: 'mail',
      title: 'Re: Re: PC DOCTOR (please forward to all)',
      from: 'dad',
      start: 'letter',
      nodes: {
        letter: {
          effects: [{ money: 150 }, { log: 'Dad sent a "consulting fee": +$150.', kind: 'money' }],
          text: [
            'Kid,',
            'I have to tell you something, and I have to tell you in writing so it\'s official.',
            'I am booked through the end of next month. BOOKED. Ruth Alvarez told the choir, the choir told the Knights, and the Knights told the entire cannery. Mr. Halvorsen wants me "on retainer." I had to ask what a retainer is.',
            {
              if: MOM_HOME,
              text: 'Your mother keeps the books. She says I\'m the only man on the Row who ever turned a profit on a hair dryer. I have hired Tommy Castellano\'s big brother to carry the heavy monitors, and I pay him in actual money.',
              else: 'I keep the books myself now. I do it at the kitchen table, where she did. I have hired Tommy Castellano\'s big brother to carry the heavy monitors, and I pay him in actual money.',
            },
            'There is a check in this envelope. I know it is an email. I put a check in the envelope anyway. It is in the regular mail too. Don\'t argue.',
            'Robert Tan\nPC DOCTOR — House Calls, Cannery Row & Environs\n"Long as one of us can fix something."',
          ],
          choices: [
            { text: '"Proud of you, Dad. Seriously."', effects: [{ npc: 'dad', affinity: 3 }, { stat: 'mood', add: 5 }], goto: 'proud' },
            { text: '"You still owe me a business card."', effects: [{ npc: 'dad', affinity: 2 }, { stat: 'mood', add: 3 }], goto: 'card' },
          ],
        },
        proud: {
          text: [
            'Kid,',
            'I read that one out loud to the kitchen. The kitchen was very moved.',
            'Robert Tan\nPC DOCTOR',
          ],
        },
        card: {
          text: [
            'Kid,',
            'I have given you FOUR business cards. I have given the mailman six. Check your wallet.',
            'Robert Tan\nPC DOCTOR',
          ],
        },
      },
    },
  ],

  triggers: [
    // One lesson mail at a time; a skipped or expired lesson comes back a few days later.
    { id: 'trig_hood_dad_lesson_1', when: lessonDue(0), once: false, cooldownDays: 5, atHour: 18, chance: 0.6, effects: [{ scene: 'hood_dad_lesson_1' }] },
    { id: 'trig_hood_dad_lesson_2', when: lessonDue(1), once: false, cooldownDays: 5, atHour: 18, chance: 0.35, effects: [{ scene: 'hood_dad_lesson_2' }] },
    { id: 'trig_hood_dad_lesson_3', when: lessonDue(2), once: false, cooldownDays: 5, atHour: 18, chance: 0.35, effects: [{ scene: 'hood_dad_lesson_3' }] },
    {
      // Three skips, or the world turned dark before the lessons were done: he gives up.
      id: 'trig_hood_dad_gave_up',
      when: {
        all: [
          { quest: 'fac_hood_q2_dad', status: 'active', stage: ['ask', 'lessons'] },
          { any: [{ var: SKIPS, gte: 3 }, { var: 'act', gte: 3 }] },
        ],
      },
      atHour: 21,
      effects: [
        { flag: 'npc.dad.brushed_off' },
        { npc: 'dad', affinity: -6 },
        { faction: 'fac.hood', add: -3 },
        { quest: 'fac_hood_q2_dad', fail: true },
        { if: MOM_HOME, then: [{ scene: 'hood_dad_gave_up' }], else: [{ scene: 'hood_dad_gave_up_kim' }] },
      ],
    },
    {
      id: 'trig_hood_dad_booked_solid',
      when: { all: [DAD_RETRAINED, { flag: 'npc.dad.business' }] },
      atHour: 9,
      chance: 1 / 30,
      effects: [{ scene: 'hood_dad_booked_solid' }, { news: 'dad_business' }],
    },
  ],
})
