/**
 * PKG-11 — Grace's romance (bible §8 Romance: `side_grace_first_date`, `side_two_lives`).
 *
 * Grace is the straight-world love interest, met at Mom's crisis (PKG-02) or the `side_zero_day`
 * hospital fallback (PKG-14). `side_grace_first_date` advances the shared ladder to `dating` and
 * stakes `life.partner='grace'` (exclusivity — clearing an existing Mira partner first).
 * `side_two_lives` sets the `side.cover` var read by `main_a3_q6` (PKG-03) for the collateral roll.
 *
 * Sets: `npc.grace` romance, `life.partner` (str), `side.cover` (var).
 */
import { defineContent } from '@/engine/registry'
import type { Choice, Cond, Effect, QuestDef, SceneDef, TriggerDef } from '@/engine/types'
import { AT_LEAST_DATING, breakUpWith, partnerIs, romanceTo, startDating } from './_shared'

/** Grace is still in your life (not driven off by the Hospital Job or Act III). */
const graceAvailable: Cond = { npc: 'grace', fateNot: ['left', 'collateral', 'whistleblower'] }
const lightSpark: Effect = { if: { npc: 'grace', romance: 'none' }, then: romanceTo('grace', 'flirting') }

/** The "dinner, not coffee" choices, shared by the first date and the second chance. */
function askGraceOut(objective: Effect[], together: string, choseGrace: string): Choice[] {
  return [
    {
      text: '"The start of dinner. If you\'ll have me." Choose this life.',
      tag: '[Choose Grace]',
      if: { not: partnerIs('mira') },
      effects: [...startDating('grace', 12), ...objective],
      goto: together,
    },
    {
      text: '"The start of dinner." Say it, even though it means ending things with Mira.',
      tag: '[Leave Mira]',
      if: partnerIs('mira'),
      effects: [...breakUpWith('mira'), ...startDating('grace', 12), ...objective],
      goto: choseGrace,
    },
  ]
}

// ── side_grace_first_date — Act IIb–III ──────────────────────────────────────

const graceDateQuest: QuestDef = {
  id: 'side_grace_first_date',
  title: 'Off the Clock',
  kind: 'side',
  act: 2,
  giver: 'grace',
  priority: 7,
  autoStart: { all: [{ npc: 'grace', met: true }, graceAvailable, { npc: 'grace', romance: ['none', 'flirting'] }, { day: true, gte: 900 }] },
  rewards: 'A life with regular hours in it',
  summary:
    "Grace remembered your name after the worst night of your year, which is a thing ER nurses do not do. When your paths cross at the Cathode she's off the clock, unarmored, and asking — in the flat, unbothered way she has — whether you're going to buy her a coffee or keep pretending you time your visits by accident.",
  start: 'coffee',
  stages: {
    coffee: {
      text: 'Grace is off shift and calling your bluff. Buy the coffee, or don\'t. Either way she\'ll respect the honest version more than the smooth one.',
      onEnter: [{ scene: 'side_grace_first_date_scene' }],
      objectives: [
        {
          id: 'answered',
          text: "Answer the question Grace is actually asking",
          when: { never: true },
          hint: 'She reads people for a living. A [Social] play works, but so does just being straight with her. Where it goes after that is your call.',
        },
      ],
    },
  },
}

const graceDateScene: SceneDef = {
  id: 'side_grace_first_date_scene',
  channel: 'dialog',
  title: 'Off the Clock',
  from: 'grace',
  start: 'intro',
  nodes: {
    intro: {
      speaker: 'grace',
      text: [
        {
          if: { flag: 'a2.mom_crisis_resolved' },
          text: 'The last time you saw Grace Okafor she was telling you, very calmly, at four in the morning, which forms to sign so your mother could keep breathing. She remembered your name. ER nurses don\'t remember names.',
          else: 'The last time you saw Grace Okafor you were on a gurney explaining to her that seventy-two hours awake was "a deliverable, not a problem." She wrote something on your chart that you suspect was not medical.',
        },
        'Grace is in the corner booth at the Cathode in a hoodie instead of scrubs, which is like seeing your teacher at the grocery store. She waves you over with two fingers before you can decide whether to pretend you didn\'t see her. "Sit. You\'ve walked past this window at the end of my shift four times this week. I counted. I count everything, it\'s the job."',
        'She pushes the sugar toward you. "So either you\'re casing the diner, which, given what I hear about you, is not impossible — or you want to buy a tired nurse a coffee and can\'t figure out how to ask. I\'m giving you the coffee option. It\'s the better one."',
      ],
      next: 'choice',
    },
    choice: {
      speaker: 'player',
      text: 'She has decided to make this easy for you, which is somehow harder. She is very steady. You are not.',
      choices: [
        {
          text: 'Match her — dry, easy, honest. Just have the conversation.',
          tag: '[Social DC 13]',
          check: {
            skill: 'social',
            dc: 13,
            success: 'clicked',
            fail: 'clunky',
            bonuses: [{ if: { flag: 'a2.mom_crisis_resolved' }, add: 1, label: '+1 (she already saw you at your worst)' }],
            successEffects: [{ npc: 'grace', affinity: 12 }, lightSpark],
            failEffects: [{ npc: 'grace', affinity: 4 }, { stat: 'mood', add: -2 }, { stat: 'stress', add: 2 }],
          },
        },
        {
          text: '"I want to buy a tired nurse a coffee. I just didn\'t know how to ask." Say the true thing plainly.',
          effects: [{ npc: 'grace', affinity: 10 }, lightSpark],
          goto: 'clicked',
        },
        {
          text: '"Casing the diner, obviously." Deflect with a joke and keep the armor on.',
          effects: [{ npc: 'grace', affinity: 2 }, { stat: 'mood', add: 2 }],
          goto: 'deflect',
        },
        {
          text: '"You probably get this a lot — the families. The grateful ones." Name the thing, and ask anyway.',
          tag: '[Empath]',
          if: { trait: 'empath' },
          effects: [{ npc: 'grace', affinity: 14 }, lightSpark],
          goto: 'seen',
        },
      ],
    },
    seen: {
      speaker: 'narrator',
      text: [
        'Something in her shoulders comes down an inch. "All the time," she says. "They bring cookies. They want to thank the person who was there on the worst night. It\'s lovely and it\'s not about me, it\'s about the night." She looks at you properly. "You\'re not doing that. You\'re asking about the person who goes home after."',
        'So she tells you about the person who goes home after — the plants she forgets to water, the cop show she falls asleep to, the way the quiet sounds after twelve hours of alarms. You listen. Sal refills the coffees without being asked and then pretends to be very busy at the far end of the counter.',
      ],
      next: 'after',
    },
    clicked: {
      speaker: 'narrator',
      text: [
        'You buy the coffee. It turns into two coffees, then pie, then the diner emptying out around you while Sal pointedly mops the same square of floor. She tells you about the ER — the funny stuff, the way people who spend all day near the worst thing get the driest humor there is. You tell her a version of your life that\'s true, just not complete.',
        'She notices the incompleteness. She doesn\'t push. "You\'ve got a wall," she says, not unkindly, stirring her coffee. "That\'s fine. I work nights. I\'m very comfortable with the dark. Just don\'t lie to me and we\'ll get along." It\'s the least romantic sentence you\'ve ever heard and your heart does something stupid anyway.',
      ],
      next: 'after',
    },
    clunky: {
      speaker: 'narrator',
      text: [
        'You try to be smooth and you overshoot into a bit that dies on the table. She lets it die. She watches it die with great professional calm, the way she\'d watch a monitor beep. "Okay," she says. "That was a lot of moves for a cup of coffee."',
        'But she doesn\'t leave, and when you drop the bit and just tell her about your day, the real one, she softens. "There he is," she says. "The one who isn\'t performing. Bring that guy next time." She\'s telling you there\'s a next time. You clock it.',
      ],
      next: 'after',
    },
    deflect: {
      speaker: 'narrator',
      text: [
        'You crack the joke and keep the armor bolted on, and she lets you, because she is not in the business of prying open people who don\'t want to be opened. "Suit yourself," she says, finishing her coffee, standing. "The offer had a shelf life. It was a good offer." She leaves cash on the table for her own coffee, which stings more than anything she could have said.',
        'She\'s gone before you find the nerve. Some doors you can knock on again later. This one you watched close on your own hands.',
      ],
      effects: [{ quest: 'side_grace_first_date', objective: 'answered' }, { scene: 'side_grace_second_chance', delayHours: 24 * 45 }],
    },
    after: {
      speaker: 'grace',
      text: 'She\'s got her keys out, standing, doing the thing where she\'s already decided but wants you to say it. "So. Was this a coffee, or was this the start of you being someone I have dinner with. I need to know which, because I don\'t have time to guess and I don\'t like guessing."',
      choices: [
        ...askGraceOut([{ quest: 'side_grace_first_date', objective: 'answered' }], 'together', 'chose_grace'),
        {
          text: '"Just a coffee. For now." Keep it light — you\'re not ready.',
          effects: [
            { npc: 'grace', affinity: 4 },
            { quest: 'side_grace_first_date', objective: 'answered' },
            { scene: 'side_grace_second_chance', delayHours: 24 * 30 },
          ],
          goto: 'light',
        },
      ],
    },
    together: {
      speaker: 'narrator',
      text: [
        '"Dinner," she confirms, like she\'s charting it. "Thursday. My place. I cook badly and I fall asleep by ten, so manage your expectations." She writes her address on a napkin in nurse-handwriting you can barely read. "And whatever the wall\'s about — you\'ll tell me when you tell me. I\'m patient. I watch monitors for a living."',
        'She kisses you once, quick and certain, and walks out into the fog toward a life with regular hours in it, and you sit in the empty diner holding a napkin like it\'s evidence, which, you\'re starting to understand, it is.',
      ],
    },
    chose_grace: {
      speaker: 'narrator',
      text: [
        'You tell her the truth first, which is that there was someone, and it\'s over, and she was owed better than to hear it after the fact. Grace takes it in with that flat clinical steadiness. "Okay. I appreciate you leading with it. I\'d have found out — I always find out — and it would\'ve gone worse." She considers you. "But you\'re here, and you\'re choosing, and you did the hard part out loud. That\'s more than most."',
        '"Dinner. Thursday." She writes the address on a napkin. "Don\'t make me regret being the one you chose." She won\'t say it warmly. She means it entirely. You walk out into the fog toward a life with regular hours in it.',
      ],
    },
    light: {
      speaker: 'narrator',
      text: [
        'You keep it a coffee. She nods, unoffended — she asked a clean question and you gave a clean answer, and clean is what she likes. "Fair. The offer stays open a while. Not forever. Nothing\'s forever, I\'d know." She taps the table twice, a nurse\'s habit, and goes.',
        'You watch her cross the lot in the fog and think about regular hours, and dinner, and a wall you\'d have to take down, and you tell yourself there\'s time. There\'s usually less than you think.',
      ],
    },
  },
}

// ── side_two_lives — Act II–III ──────────────────────────────────────────────

const twoLivesQuest: QuestDef = {
  id: 'side_two_lives',
  title: 'Two Lives',
  kind: 'side',
  act: 2,
  giver: 'grace',
  priority: 7,
  autoStart: { all: [partnerIs('grace'), graceAvailable, { npc: 'grace', romance: AT_LEAST_DATING }, { day: true, gte: 950 }] },
  rewards: 'A cover that holds · or a wall between you',
  summary:
    'Grace knows there are two of you: the one who buys her coffee and the one who flinches at pagers that aren\'t hers. She isn\'t asking you to give up the second one. She\'s asking which one you\'re bringing to dinner — and how much of the wall between them you\'re willing to build, or take down.',
  start: 'ask',
  stages: {
    ask: {
      text: 'Grace has named the two lives out loud. How you keep them — walled off and safe, or blurred and honest — sets how strong your cover is when the second life comes looking for the first.',
      onEnter: [{ scene: 'side_two_lives_scene' }],
      objectives: [
        {
          id: 'chose',
          text: 'Decide how the two lives fit together',
          when: { never: true },
          hint: 'A hard wall (careful compartments) builds real cover; blurring the line is warmer but leaves her — and you — exposed if the wrong life comes calling.',
        },
      ],
    },
  },
}

const twoLivesScene: SceneDef = {
  id: 'side_two_lives_scene',
  channel: 'dialog',
  title: 'Two Lives',
  from: 'grace',
  start: 'intro',
  nodes: {
    intro: {
      speaker: 'grace',
      text: [
        'Dinner at her place, badly cooked exactly as promised. Halfway through, a pager goes off — yours — and you do the thing, the small full-body flinch you don\'t know you do, and she sees it, because she sees everything. She sets down her fork.',
        '"You keep two lives," she says, evenly. "I\'m a nurse. I\'m very good at knowing when someone\'s hiding a wound. I\'m not asking you to stop being the second guy. I knew there was a second guy. I\'m asking which one comes to dinner, and whether you\'re going to keep them so separate you get a headache, or let them meet and hope nothing catches fire."',
      ],
      next: 'choice',
    },
    choice: {
      speaker: 'player',
      text: 'She\'s not angry. That\'s what makes it serious. She\'s doing triage on your whole life, right here, over bad chicken.',
      choices: [
        {
          text: 'Build the wall properly. Keep her clean and out of it — real compartments, real discipline.',
          tag: '[OpSec]',
          check: {
            skill: 'opsec',
            dc: 15,
            success: 'walled',
            fail: 'walled_soft',
            successEffects: [{ var: 'side.cover', add: 3 }, { npc: 'grace', affinity: 8 }],
            failEffects: [{ var: 'side.cover', add: 1 }, { npc: 'grace', affinity: 4 }, { stat: 'stress', add: 3 }, { chance: 0.3, then: [{ complication: 'social' }] }],
          },
        },
        {
          text: '"Let them meet." Tell her the real version, all of it, and let the wall come down.',
          tag: '[Honest]',
          effects: [{ var: 'side.cover', add: -1 }, { npc: 'grace', affinity: 16 }],
          goto: 'blurred',
        },
        {
          text: '"I already live like this. Two of everything. It\'s the only way I sleep." Show her the system.',
          tag: '[Paranoid]',
          if: { trait: 'paranoid' },
          effects: [{ var: 'side.cover', add: 3 }, { npc: 'grace', affinity: 6 }, { stat: 'stress', add: 3 }],
          goto: 'paranoid',
        },
        {
          text: 'Give her a cover story she can repeat to anyone — her mother, her charge nurse, a man with a badge.',
          tag: '[Social DC 15]',
          check: {
            skill: 'social',
            dc: 15,
            success: 'story',
            fail: 'story_fail',
            successEffects: [{ var: 'side.cover', add: 2 }, { npc: 'grace', affinity: 10 }],
            failEffects: [
              { npc: 'grace', affinity: -2 },
              { var: 'side.cover', add: -1 },
              { flag: 'side.grace_doug' },
              { scene: 'side_grace_doug_chat', delayHours: 24 * 18 },
            ],
          },
        },
        {
          text: 'Keep the wall by keeping her at arm\'s length — less of you, but safer for her.',
          tag: '[Distance]',
          effects: [{ var: 'side.cover', add: 2 }, { npc: 'grace', affinity: -4 }],
          goto: 'distance',
        },
      ],
    },
    walled: {
      speaker: 'narrator',
      text: [
        'You do it right. Separate phones, separate stories that don\'t contradict, a version of your life she can repeat to her mother without lying and without knowing. You teach yourself to stop flinching. You build the two lives a wall you could bounce a quarter off, and you keep her on the clean side of it, on purpose, with discipline.',
        '"Thank you," she says, later, meaning it. "I don\'t need to know the second guy\'s business. I need to know he\'s careful, and that when it comes for him it doesn\'t come through my front door." It won\'t, if you keep this up. The cover holds. She sleeps better. So do you.',
      ],
      effects: [{ quest: 'side_two_lives', objective: 'chose' }],
    },
    paranoid: {
      speaker: 'narrator',
      text: [
        'You walk her through it: the second pager in the freezer, the notebook of which story you told to whom, the route home that changes on Tuesdays. You expect her to laugh. She doesn\'t. She looks at it the way she looks at a well-kept crash cart.',
        '"This is either the most romantic thing a man has ever shown me or a clinical presentation," she says. "Possibly both." She adds her shift schedule to your notebook in her own handwriting. The cover holds. It turns out a wall is easier to live behind when two people are maintaining it.',
      ],
      effects: [{ quest: 'side_two_lives', objective: 'chose' }],
    },
    story: {
      speaker: 'narrator',
      text: [
        'You build her a story with load-bearing walls: you do "network security consulting" for "clients you can\'t name, it\'s in the contracts," which is boring enough that nobody asks a second question and true enough that she never has to lie outright. You drill it with her over the bad chicken until she can say it half-asleep.',
        '"Network security consulting," she repeats, perfectly bored. "God. I\'d stop listening too." She kisses your forehead. The cover holds, and she carries her half of it like she carries everything — without complaint and without dropping it.',
      ],
      effects: [{ quest: 'side_two_lives', objective: 'chose' }],
    },
    story_fail: {
      speaker: 'narrator',
      text: [
        'You try to hand her a cover story and it has too many moving parts — a fake employer, a fake office, a fake coworker named Doug with a fake divorce. She asks three questions and Doug collapses. "Honey," she says, "I\'ve heard better stories from men on PCP."',
        'She doesn\'t want Doug. She wants to not be lied to. You end the night with no cover at all, just her hand on yours and the understanding that she\'ll improvise if she has to.',
        'The trouble with Doug is that you said him out loud, in detail, at a dinner table, and Grace has a mother who calls every Sunday and a memory like a chart. Doug is out there now. The wall is thinner than it was before you started, because now it has a fake man-shaped hole in it.',
      ],
      effects: [{ quest: 'side_two_lives', objective: 'chose' }],
    },
    walled_soft: {
      speaker: 'narrator',
      text: [
        'You try to build the wall clean and you get most of it — separate phones, a story that mostly holds — but there are seams, a contradiction here, a name you forgot you\'d used there. It\'s better than nothing. It is not the fortress you wanted.',
        '"You\'re trying," she allows, catching one of the seams and letting it go. "I can see you trying. Just don\'t confuse a curtain for a wall." The cover holds, barely, and only as long as nobody leans on it.',
      ],
      effects: [{ quest: 'side_two_lives', objective: 'chose' }],
    },
    blurred: {
      speaker: 'narrator',
      text: [
        'You let it all out — the scene, the heat, the names, the whole shape of the second life — because you\'re tired of the wall and because she asked and because you\'d rather be known than safe. She listens the way she listens to a patient describe a pain, nodding, filing, unshocked.',
        '"Okay," she says at the end. "Now I know where the wound is." It brings you closer than anything has. It also means she\'s inside the blast radius now — no wall, no cover, one life with her standing in the middle of it. She chose that with her eyes open. So did you. You\'ll both find out what it costs.',
      ],
      effects: [{ quest: 'side_two_lives', objective: 'chose' }],
    },
    distance: {
      speaker: 'narrator',
      text: [
        'You keep the wall the coward\'s way — by keeping her at arm\'s length, giving her less of you so there\'s less to endanger. It works. She\'s safe, and cover-clean, and a little further away every week, and she notices, because she notices everything.',
        '"You went quiet on me," she says one night, not accusing, just charting. "You do that. Pull back right when it gets real. I\'m not going to chase a man into his own wall." She\'s safer for it. She\'s also, slowly, leaving, and you\'re the one who built the door.',
      ],
      effects: [{ quest: 'side_two_lives', objective: 'chose' }],
    },
  },
}

/** Fail-branch fallout of the botched cover story: "Doug" escapes into the wild. */
const dougChat: SceneDef = {
  id: 'side_grace_doug_chat',
  channel: 'chat',
  title: 'grace',
  from: 'grace',
  pause: false,
  expiresDays: 14,
  onExpire: [{ npc: 'grace', affinity: -3 }, { var: 'side.cover', add: -1 }],
  start: 'ping',
  nodes: {
    ping: {
      speaker: 'grace',
      text: [
        'so. my mother asked me on the phone tonight how doug\'s divorce is going',
        'i did not tell her about doug. i have never told anyone about doug. doug does not exist',
        'which means she heard it from my sister, who heard it from me, at 4am, after a triple, when i was apparently narrating your cover story in my sleep',
        'doug has a following now. my aunt is praying for him',
      ],
      choices: [
        {
          text: 'kill doug. tell your mom he moved to ridgeport and we lost touch. clean break',
          effects: [{ npc: 'grace', affinity: 3 }, { stat: 'stress', add: 2 }],
          goto: 'killed',
        },
        {
          text: 'keep doug alive. give him a boring second act. nobody questions a man who takes up golf',
          effects: [{ var: 'side.cover', add: 1 }, { npc: 'grace', affinity: -3 }, { stat: 'stress', add: 4 }],
          goto: 'kept',
        },
        {
          text: 'tell her the truth. the real job. your mother can handle it better than doug can',
          if: { flag: 'side.partner_knows' },
          effects: [{ var: 'side.cover', add: -1 }, { npc: 'grace', affinity: 6 }, { stat: 'stress', add: -3 }],
          goto: 'truth',
        },
      ],
    },
    killed: {
      speaker: 'grace',
      text: ['ridgeport. ok. he moved to ridgeport', 'my aunt is going to be devastated. she was making him a casserole', 'rest in peace doug. you were a bad lie and you deserved better'],
    },
    kept: {
      speaker: 'grace',
      text: [
        'golf. fine. doug takes up golf',
        'you understand i now have to remember doug\'s handicap. for the rest of my life. at every family dinner',
        'this is what i meant by dont lie to me. i did not mean make me lie to my aunt about a man named doug',
      ],
    },
    truth: {
      speaker: 'grace',
      text: ['...ok', 'you\'re right. i\'ll tell her. not all of it. enough', 'she\'s going to pray for you instead of doug. i think that\'s a promotion'],
    },
  },
}

/** The offer "had a shelf life" — this is the one reminder she gives before it expires. */
const secondChanceScene: SceneDef = {
  id: 'side_grace_second_chance',
  channel: 'chat',
  title: 'end of shift',
  from: 'grace',
  pause: false,
  expiresDays: 6,
  onExpire: [{ npc: 'grace', affinity: -4 }],
  start: 'ping',
  nodes: {
    ping: {
      speaker: 'grace',
      text: [
        'this is grace. okafor. from the ER. i got your handle from sal, who says you "look like a dropped call" and should eat',
        'i am off at 7am. the cathode does a decent breakfast. i said the offer had a shelf life',
        'this is the shelf',
      ],
      choices: [
        ...askGraceOut([], 'together', 'chose'),
        {
          text: 'breakfast, sure. as friends?',
          effects: [{ npc: 'grace', affinity: 2 }],
          goto: 'friends',
        },
      ],
    },
    together: {
      speaker: 'grace',
      text: ['good. 7:15. i will be the one who looks like she just ran a code', 'and then dinner. thursday. i cook badly. manage expectations'],
    },
    chose: {
      speaker: 'grace',
      text: [
        'you ended it first. before breakfast. before asking me',
        'that\'s the right order. i\'m glad you know that',
        '7:15. don\'t make me regret being the one you chose',
      ],
    },
    friends: {
      speaker: 'grace',
      text: ['as friends. copy that', 'i\'ll still let you pay'],
    },
  },
}

/** Grace was left as a coffee-friend and you've kept showing up; eventually she asks one more time. */
const graceAgainTrigger: TriggerDef = {
  id: 'side_grace_again',
  atHour: 8,
  chance: 0.2,
  when: {
    all: [
      { quest: 'side_grace_first_date', status: 'completed' },
      graceAvailable,
      { npc: 'grace', romance: ['none', 'flirting'] },
      { npc: 'grace', affinityGte: 40 },
      { seen: 'side_grace_second_chance' },
      { not: partnerIs('grace') },
      { day: true, gte: 1300 },
    ],
  },
  effects: [{ scene: 'side_grace_second_chance' }],
}

export default defineContent({
  quests: [graceDateQuest, twoLivesQuest],
  scenes: [graceDateScene, twoLivesScene, secondChanceScene, dougChat],
  triggers: [graceAgainTrigger],
})
