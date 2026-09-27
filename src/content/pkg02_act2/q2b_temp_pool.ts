/**
 * PKG-02 — a2_cmp_temp_pool: the second chance after a flubbed Halcyon interview (bible §6.B:
 * "you flub it, Dee slips you a second-chance temp gig"). REDESIGN_V2 §D makes that a real
 * sub-story instead of a pat on the head: five weeks in Dee's temp pool, one disaster at the copier
 * (a2_temp_copier), and a second interview (a2_temp_interview) that either lands the badge after all
 * or closes the Hill's door for good.
 *
 * Started by a2_priya (node dee_save) on either interview-check fail.
 *
 * PKG-02 owns: quest a2_cmp_temp_pool; scenes a2_temp_copier / a2_temp_interview; flags
 * a2.temp_copier_hero / .temp_copier_mess / .temp_copier_ran / .temp_copier_ducked /
 * .temp_pool_done / .second_chance_hired / .halcyon_door_closed. Sets fac.halcyon.employed on a
 * second-chance hire (the same flag the first interview grants; PKG-09 reads it).
 *
 * Read later: a2.halcyon_door_closed greys a line in Mom's bills (q4) and colours the Halcyon road
 * at the hinge (q7); a2.second_chance_hired colours the hinge too.
 */
import { defineContent } from '@/engine/registry'
import type { Effect, QuestDef, SceneDef, SkillCheck } from '@/engine/types'

const POOL = 'a2_cmp_temp_pool'

const hired: Effect[] = [
  { flag: 'fac.halcyon.employed' },
  { flag: 'a2.second_chance_hired' },
  { flag: 'a2.temp_pool_done' },
  { faction: 'fac.halcyon', add: 8 },
  { npc: 'dee', affinity: 4 },
  { stat: 'mood', add: 6 },
]

const closed: Effect[] = [
  { flag: 'a2.halcyon_door_closed' },
  { flag: 'a2.temp_pool_done' },
  { faction: 'fac.halcyon', add: -8 },
  { npc: 'priya', affinity: -2 },
  { stat: 'stress', add: 6 },
  {
    buff: {
      id: 'buff_a2_passed_over',
      name: 'Passed Over',
      desc: 'Halcyon said no twice. You keep rewriting the answers in the shower.',
      days: 28,
      bad: true,
      mods: [
        { key: 'mood.daily', add: -0.5 },
        { key: 'check.business', add: -1 },
      ],
    },
  },
]

// ── Week two: Lorraine eats the CFO's deck ──────────────────────────────────
const copier: SceneDef = {
  id: 'a2_temp_copier',
  channel: 'dialog',
  title: 'Lorraine',
  from: 'dee',
  start: 'jam',
  nodes: {
    jam: {
      speaker: 'narrator',
      text: [
        'Week two in Dee\'s temp pool. Your badge says VISITOR in a font that feels personal. The fourth-floor copier is a beige hulk the size of a hatchback that everyone calls Lorraine, and at 9:20 on a Thursday Lorraine eats the CFO\'s quarterly deck.',
        'Forty copies, collated and stapled, due in the boardroom at ten. The only copies. A grinding noise, a smell like a hair dryer full of pennies, and a small red light that says, in its entirety, CALL SERVICE.',
        'The CFO\'s assistant is breathing into a paper bag. Dee is at the dentist. Every head on the floor turns, slowly and in unison, toward the temp.',
      ],
      choices: [
        {
          text: 'Open Lorraine up. You\'ve fixed uglier machines for worse people.',
          tag: '[Hardware]',
          check: {
            skill: 'hardware',
            dc: 13,
            bonuses: [
              { if: { flag: 'a1.job_started' }, add: 2, label: '+2 (the CompCastle bench taught you where the screws hide)' },
              { if: { background: 'tinkerer' }, add: 1, label: '+1 (Basement Tinkerer)' },
            ],
            success: 'fixed',
            fail: 'toner',
            successEffects: [{ flag: 'a2.temp_copier_hero' }, { faction: 'fac.halcyon', add: 3 }, { xp: 'hardware', add: 15 }],
            failEffects: [
              { flag: 'a2.temp_copier_mess' },
              { faction: 'fac.halcyon', add: -2 },
              { money: -60 },
              { stat: 'stress', add: 5 },
              { chance: 0.3, then: [{ complication: 'work' }] },
            ],
          },
        },
        {
          text: 'Stall the boardroom. Coffee, charm, and a long story about the copier\'s feelings.',
          tag: '[Social]',
          check: {
            skill: 'social',
            dc: 13,
            bonuses: [{ if: { trait: 'silver_tongue' }, add: 2, label: '+2 (Silver Tongue)' }],
            success: 'stalled',
            fail: 'noticed',
            successEffects: [{ flag: 'a2.temp_copier_hero' }, { faction: 'fac.halcyon', add: 2 }],
            failEffects: [
              { flag: 'a2.temp_copier_mess' },
              { faction: 'fac.halcyon', add: -2 },
              { stat: 'stress', add: 5 },
              { stat: 'mood', add: -3 },
            ],
          },
        },
        {
          text: 'Grab the original and sprint it to the print shop on Fifth. In the rain.',
          tag: '[Run it]',
          effects: [
            { flag: 'a2.temp_copier_ran' },
            { money: -45 },
            { stat: 'energy', add: -15 },
            { faction: 'fac.halcyon', add: 1 },
          ],
          goto: 'ran',
        },
        {
          text: 'Not your copier. Keep your head down and let someone with a real badge handle it.',
          tag: '[Duck]',
          effects: [{ flag: 'a2.temp_copier_ducked' }],
          goto: 'ducked',
        },
      ],
    },
    fixed: {
      speaker: 'narrator',
      text: [
        'Two panels, one lever nobody told you about, and a folded staple wedged in the fuser like a splinter in a paw. You ease it out. Lorraine sighs — actually sighs, a long mechanical exhale — and begins to print.',
        'Forty decks, collated, stapled, warm as bread, on the boardroom table at 9:58. The assistant hugs you without asking. By lunch the whole fourth floor knows the temp who talked Lorraine down, and somebody has taped a paper crown to the copier in your honor.',
      ],
      next: 'dee_back',
    },
    toner: {
      speaker: 'narrator',
      text: [
        'You get the side panel off. You get the drum out. You get, in the process, an entire cartridge of toner down the front of the only good shirt you own, the carpet, and — briefly, horribly — the CFO\'s shoes, which arrive in the doorway at exactly the wrong second.',
        'The deck goes into the boardroom at 10:25, smudged, eleven copies short, and faintly warm in a way that suggests a fire nearly happened. The CFO says nothing to you at all. He says your name, later, to someone else. You hear it through a wall.',
        'The dry cleaner looks at the shirt and says "sixty," the way a doctor says "we\'ll do what we can."',
      ],
      next: 'dee_back',
    },
    stalled: {
      speaker: 'narrator',
      text: [
        'You walk into a room full of vice presidents with a tray of coffee and the confidence of someone who has nothing to lose, because you don\'t. You tell them the copier is having a crisis of faith. You tell them the deck is being "hand-finished." You ask the CFO about his boat, because everybody on the fourth floor has a photo of a boat, and it works.',
        'Twenty-five minutes later the facilities guy has Lorraine running, the decks arrive, and a board member asks the assistant who "the funny temp" is. The assistant, who owes you her life, says your name like it\'s a recommendation.',
      ],
      next: 'dee_back',
    },
    noticed: {
      speaker: 'narrator',
      text: [
        'You walk in with the coffee and the charm, and the charm misfires. The joke about the copier\'s feelings lands on a CFO who, it turns out, bought Lorraine personally and is sensitive about it. There is a silence you could cut and serve.',
        '"And you are?" he asks. You tell him. He writes it on the corner of an agenda, which is worse than yelling. The decks arrive at 10:30. The meeting is about cost-cutting. You notice the word "temps" on slide four.',
      ],
      next: 'dee_back',
    },
    ran: {
      speaker: 'narrator',
      text: [
        'You run eleven blocks in the rain with the original under your jacket like a smuggled infant. The kid at the print shop on Fifth takes one look at your face and bumps you to the front. Forty-five dollars, cash, yours.',
        'You make it back at 10:04, soaked, wheezing, decks dry. Nobody claps. The assistant quietly slips you a towel and a granola bar, and the look she gives you is worth more than the forty-five dollars, which is good, because nobody reimburses you.',
      ],
      next: 'dee_back',
    },
    ducked: {
      speaker: 'narrator',
      text: [
        'You keep your eyes on your spreadsheet. Someone from facilities arrives at 10:15. The deck goes in at 10:40. Nobody blames the temp, because nobody noticed the temp, which is exactly what you wanted and exactly the problem.',
      ],
      next: 'dee_back',
    },
    dee_back: {
      speaker: 'dee',
      text: [
        'Dee returns from the dentist at two with half her face asleep and hears the whole thing before she reaches her desk. She hears everything. It is her only vice and her greatest weapon.',
        { if: { flag: 'a2.temp_copier_hero' }, text: '"You healed Lorraine," she says thickly, and her numb mouth tries a smile and gets about halfway. "Nobody heals Lorraine. I\'m putting this in the binder. You\'re in the binder now. People would kill to be in the binder."' },
        { if: { flag: 'a2.temp_copier_mess' }, text: '"You toned the CFO." A long pause, partly anesthesia. "Okay. Okay. We have three weeks. I have survived worse. I once watched a man reinstall Windows on a monitor." She pats your arm. "We heal this."' },
        { if: { flag: 'a2.temp_copier_ran' }, text: '"You ran it to Fifth Street. In the rain." She looks at your shoes, which are still making a noise. "That\'s not glamorous. That\'s better than glamorous. That\'s reliable. HR can\'t spell glamorous but they worship reliable."' },
        { if: { flag: 'a2.temp_copier_ducked' }, text: '"You sat there." She doesn\'t raise her voice. Dee never needs to. "Kid, I don\'t need you to fix every copier. I need you to be the kind of person who stands up when the room turns around. That\'s the whole interview. It always was."' },
      ],
      effects: [
        { if: { flag: 'a2.temp_copier_ducked' }, then: [{ npc: 'dee', affinity: -3 }], else: [{ npc: 'dee', affinity: 2 }] },
      ],
    },
  },
}

// ── Week five: HR, again ────────────────────────────────────────────────────
const interviewBonuses: SkillCheck['bonuses'] = [
  { if: { flag: 'a2.temp_copier_hero' }, add: 2, label: '+2 (the whole fourth floor heard about Lorraine)' },
  { if: { flag: 'a2.temp_copier_ran' }, add: 1, label: '+1 (reliable, in the rain)' },
  { if: { flag: 'a2.temp_copier_mess' }, add: -2, label: '−2 (the CFO remembers the toner)' },
  { if: { flag: 'a2.leaned_school' }, add: 1, label: '+1 (fresh from Lumen State lectures)' },
]

const interview: SceneDef = {
  id: 'a2_temp_interview',
  channel: 'dialog',
  title: 'Second Interview',
  from: 'dee',
  start: 'room',
  nodes: {
    room: {
      speaker: 'narrator',
      text: [
        'Same conference room. Same whiteboard, now faintly ghosted with the wrong confident thing you wrote on it five weeks ago. The HR woman has your file open, and there it is on the cover: a yellow sticky note in careful ballpoint that says, simply, NERVES?',
        { if: { not: { flag: 'a2.temp_copier_ducked' } }, text: 'Dee is in the corner chair with a binder on her knees and the expression of a lawyer who has already won and is only here for the paperwork.' },
        { if: { flag: 'a2.temp_copier_ducked' }, text: 'Dee is not in the room. She said she had a meeting. Dee has never once in her life had a meeting she couldn\'t move.' },
        '"So," the HR woman says, peeling the sticky note off the file and holding it up between two fingers. "Let\'s see if we can throw this away."',
      ],
      next: 'ask',
    },
    ask: {
      speaker: 'Halcyon HR',
      text: '"Same question as last time. Walk me through how you\'d solve a real problem here. Take your time. Nobody\'s timing you." Somebody is absolutely timing you.',
      choices: [
        {
          text: 'Go back to the whiteboard and finish the fix you fumbled — properly, this time.',
          tag: '[Programming]',
          check: {
            skill: 'programming',
            dc: 13,
            bonuses: interviewBonuses,
            success: 'hired',
            fail: 'blanked',
            successEffects: hired,
            failEffects: closed,
          },
        },
        {
          text: 'Tell her the Lorraine story, and sell the version of you it proves.',
          tag: '[Business]',
          check: {
            skill: 'business',
            dc: 13,
            bonuses: interviewBonuses,
            success: 'hired',
            fail: 'blanked',
            successEffects: hired,
            failEffects: closed,
          },
        },
        {
          text: 'Look at Dee. Let her open the binder.',
          tag: '[Dee]',
          if: { not: { flag: 'a2.temp_copier_ducked' } },
          check: {
            skill: 'social',
            dc: 11,
            bonuses: [{ if: { npc: 'dee', affinityGte: 20 }, add: 2, label: '+2 (Dee would walk into traffic for you)' }],
            success: 'dee_wins',
            fail: 'dee_overreach',
            successEffects: hired,
            failEffects: closed,
          },
        },
        {
          text: 'Let the diploma — or your Halcyon standing — do the talking.',
          tag: '[Credentials]',
          req: { any: [{ degree: true }, { faction: 'fac.halcyon', gte: 20 }] },
          reqText: 'Requires: a degree or Halcyon standing (rep 20+)',
          effects: hired,
          goto: 'hired',
        },
        {
          text: '"You know what? Keep the sticky note. I don\'t need a badge to know what I\'m worth."',
          tag: '[Walk out]',
          effects: [{ flag: 'a2.halcyon_door_closed' }, { flag: 'a2.temp_pool_done' }, { faction: 'fac.halcyon', add: -4 }, { faction: 'fac.loft', add: 2 }, { stat: 'mood', add: 2 }],
          goto: 'walked',
        },
      ],
    },
    hired: {
      speaker: 'Halcyon HR',
      text: [
        'She listens all the way through without writing anything, which you have learned is the good kind of silence. Then she crumples the sticky note into a small, final ball and drops it in the recycling.',
        '"Junior developer. Start Monday. You\'ll want a better shirt." A pause. "Dee says you owe her a copier." You do. You will be paying it back in favors for years, and you will be glad to.',
      ],
      effects: [{ log: 'Second interview, second chance: Halcyon hired you the long way round. Dee has you in the binder for life.', kind: 'good' }],
    },
    dee_wins: {
      speaker: 'dee',
      text: [
        'Dee opens the binder. There are tabs. There are colour-coded tabs. There is a laminated timeline of the Lorraine incident with a diagram. The HR woman, who has worked with Dee for four years, visibly decides not to fight it.',
        '"Fine," she says. "Fine. Monday." Dee closes the binder with the gentle finality of a woman closing a coffin on a vampire. In the hallway she says, not looking at you: "I\'ve been told I should run for something. Nobody ever tells me I should run for HR. Their loss."',
      ],
      effects: [{ log: 'Dee opened the binder and HR folded. You start at Halcyon Monday.', kind: 'good' }],
    },
    blanked: {
      speaker: 'narrator',
      text: [
        'It happens again. Not all of it — just the middle, the part where the answer should be, which goes white and quiet like a screen with the cable pulled. You hear yourself saying "so basically" three times in a row.',
        'The HR woman is kind about it, which is how you know. She puts the sticky note back on the file, smooths it down with her thumb, and closes the folder on it. "We\'ll keep your résumé on file," she says, in the voice of someone who has said it to a thousand people and meant it for none of them.',
        { if: { not: { flag: 'a2.temp_copier_ducked' } }, text: 'Dee walks you to the elevator, furious — not at you, at the building. "Their loss," she says. "I\'m writing that in the binder. THEIR LOSS." She means it. It doesn\'t help, and it helps.' },
        'On the way down you pass Priya\'s floor. Her door is closed. She\'ll have heard by now. She won\'t mention it, which is its own sentence.',
      ],
      effects: [{ log: 'Halcyon passed on you twice. That door is closed — at least this way in.', kind: 'bad' }],
    },
    dee_overreach: {
      speaker: 'dee',
      text: [
        'Dee opens the binder and does not stop. Tab one is the Lorraine incident. Tab two is your CompCastle record. Tab three is, somehow, a list of HR\'s own procedural violations going back to 1999, and it is while Dee is reading tab three aloud that you watch the job leave the room without you.',
        '"I stand by every word," Dee says in the elevator, pale with vindication. "Every. Word." A long pause. "I may have cost you that. I\'m sorry, kid. I\'m also not." She presses the button for the lobby like it owes her money.',
      ],
      effects: [
        { npc: 'dee', affinity: 3 },
        { log: 'Dee went to war with HR on your behalf. She lost the battle, and you lost the job. She\'s prouder of you than ever.', kind: 'bad' },
      ],
    },
    walked: {
      speaker: 'narrator',
      text: [
        'You stand up, button the jacket you borrowed, and leave the sticky note right where it is. The HR woman looks genuinely surprised, which you decide to treat as a victory.',
        'It feels magnificent for about four floors. Somewhere around the lobby it starts to feel like rent. Outside, the Hill is bright and expensive and completely indifferent, and you walk down it anyway, toward the parts of the city that never asked you for a résumé.',
      ],
      effects: [{ log: 'You walked out of Halcyon\'s second interview. Proud, broke, and done with the Hill — for now.', kind: 'story' }],
    },
  },
}

const quest: QuestDef = {
  id: POOL,
  title: 'Complication: Five Weeks at the Copier',
  kind: 'personal',
  act: 2,
  giver: 'dee',
  summary:
    'You flubbed the Halcyon interview. Dee put you in her temp pool with a promise: five weeks, no disasters, and she walks you back into HR herself. There will be a disaster. There is always a disaster.',
  rewards: 'A second shot at the Halcyon badge — or a closed door',
  priority: 15,
  start: 'copier',
  stages: {
    copier: {
      text: 'Dee\'s temp pool: a VISITOR badge, a desk by the fire exit, and a copier named Lorraine with opinions. Keep your head down and your nose clean for five weeks.',
      hint: 'Keep playing. Something will go wrong on the fourth floor within a couple of weeks — how you handle it is the real interview.',
      onEnter: [{ scene: 'a2_temp_copier', delayHours: 14 * 24 }],
      objectives: [{ id: 'lorraine', text: 'Survive the fourth floor', when: { seen: 'a2_temp_copier' }, hint: 'The copier dialog opens on its own.' }],
      next: 'reinterview',
    },
    reinterview: {
      text: 'Five weeks are up. Same room, same whiteboard, same sticky note on your file. Dee has a binder.',
      hint: 'How the copier went counts. Programming, Business or Dee herself can carry the room — and so can a degree or Halcyon standing.',
      onEnter: [{ scene: 'a2_temp_interview', delayHours: 21 * 24 }],
      objectives: [
        { id: 'sit', text: 'Take the second interview', when: { flag: 'a2.temp_pool_done' }, hint: 'The interview dialog opens on its own about three weeks after the copier.' },
      ],
      next: [{ if: { flag: 'a2.second_chance_hired' }, stage: 'badge' }, { stage: 'closed' }],
    },
    badge: {
      text: 'You got the Halcyon badge the long way round. Dee has you in the binder, which is a lifetime appointment.',
      objectives: [{ id: 'badge', text: 'Get hired at Halcyon (second chance)', when: { flag: 'a2.second_chance_hired' }, hint: 'Done — the badge is yours.' }],
      onComplete: [{ log: 'The temp pool paid off. Halcyon badge acquired.', kind: 'quest' }],
    },
    closed: {
      text: 'Halcyon passed on you twice. The Hill\'s front door is closed; the rest of the city never had one.',
      objectives: [
        { id: 'closed', text: 'Walk away from the Hill', when: { flag: 'a2.halcyon_door_closed' }, hint: 'Done. There are other roads — the board, the Row, a degree, and Halcyon rep earned the hard way.' },
      ],
      outcome: 'failed',
    },
  },
}

export default defineContent({
  quests: [quest],
  scenes: [copier, interview],
})
