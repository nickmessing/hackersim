/**
 * PKG-04 — `main_a4_q3_the_city` (the montage) and `main_a4_q4_last_day` (the last day + the ending
 * assembler). q3 is started by the exchange finale; q4 by q3; q4's completion sets `{ending}` via the
 * §10 priority matrix (`assembleEnding()`), which pauses the game and shows the ending screen.
 *
 * The soft floor (bible §5.4): the ending will not fire before day 3400 (late December 2010). q4's
 * final objective gates on the date, so a player who reaches Act IV early still gets their last winter.
 *
 * Both scenes read the long tail of failed rolls (REDESIGN_V2 §D): the night the Row's phones went
 * dead in the frame room, the photograph on the doormat, the half-truth told to Grace, Kim still
 * waiting with the light on, the whisper about Mom, a handle greyed out on every board.
 */
import { defineContent } from '@/engine/registry'
import type { Cond, QuestDef } from '@/engine/types'
import { assembleEnding } from './endings'
import { LAST_DAY, all, any, fate, flag, not } from './shared'

/** The repeal is keyed to publish + Dee's council seat, and only means something if a law passed (§6.D, §10 E1). */
const repealed: Cond = all({ var: 'w.mnsa', gte: 1 }, flag('a4.leverage', 'publish'), flag('npc.dee.council'))

const cityMontage: QuestDef = {
  id: 'main_a4_q3_the_city',
  title: 'The City You Made',
  kind: 'main',
  act: 4,
  priority: 100,
  rewards: 'The montage',
  summary: 'Before the last day, the city you made scrolls past: what closed and what held, who rose and who fell, whether the fog rolled in on a recession or a recovery.',
  start: 'montage',
  stages: {
    montage: {
      text: 'The run is done. Before it all resolves into an ending, take one long look at the version of Port Lumen your ten years actually built.',
      // The montage publishes its headlines (their deltas belong to the NewsDefs, PKG-16).
      onEnter: [{ if: repealed, then: [{ news: 'mnsa_repealed' }] }, { scene: 'a4_the_city', delayHours: 12 }],
      objectives: [{ id: 'watched', text: 'See the city you made', when: flag('a4.city_done'), hint: 'A montage plays on its own. Watch it through.' }],
      onComplete: [{ quest: 'main_a4_q4_last_day', start: true }],
    },
  },
}

const lastDay: QuestDef = {
  id: 'main_a4_q4_last_day',
  title: 'The Last Day',
  kind: 'main',
  act: 4,
  priority: 100,
  rewards: 'The end',
  summary: [
    'One more day. Spend it however you like — on the people who are left, in the places that survived, or alone with everything you know.',
    'When it is over, the epilogue you have been writing for a decade finally reads itself back to you.',
  ],
  start: 'day',
  stages: {
    day: {
      text: 'A free day, the last one the story will give you. Warm rooms are only warm if you kept them warm. Go see who is left, or don\'t. Then let the sun go down.',
      onEnter: [{ scene: 'a4_last_day', delayHours: 8 }],
      objectives: [
        { id: 'lived', text: 'Live the last day', when: flag('a4.last_day_done'), hint: 'A dialog opens on its own. Visit whoever is left, then let the day end.' },
        {
          id: 'winter',
          text: 'Let the last winter arrive (late December 2010)',
          when: { day: true, gte: LAST_DAY },
          progress: { of: { day: true }, target: LAST_DAY },
          hint: 'The ending will not come before winter 2010. Spend the days on the people and places you want in your epilogue.',
        },
      ],
      onComplete: [
        ...assembleEnding(),
        { log: 'The long tail ends here. Whatever the epilogue says, you wrote most of it.', kind: 'story' },
      ],
    },
  },
}

export default defineContent({
  quests: [cityMontage, lastDay],
  scenes: [
    {
      id: 'a4_the_city',
      channel: 'dialog',
      title: 'The City You Made',
      start: 'open',
      nodes: {
        open: {
          speaker: 'narrator',
          text: [
            'It plays like a slideshow with the projector running a little too fast: the Port Lumen your decade left behind.',
            {
              if: flag('w.meridian_state', 'collapsed'),
              text: 'The Meridian Trust tower, dark and half-empty, lit at night by a skeleton crew. The recession has a face on the Row — the For Lease signs, the diner napkins with job ads printed on the back.',
              else: 'The Meridian Trust tower still owns the Harbor Point skyline, digitizing badly, endlessly, forever, the way old money does everything.',
            },
            {
              if: { var: 'w.datacenter_open', eq: 1 },
              text: 'The old paper mill, glowing from inside with server light, humming where it used to roar. The DATA CAMPUS sign is bright. Your father worked that floor for twenty years. Somebody\'s father always did.',
            },
          ],
          next: 'more',
        },
        more: {
          speaker: 'narrator',
          text: [
            { if: flag('w.halcyon_state', 'clean'), text: 'Halcyon, smaller and duller and finally not ashamed of itself.' },
            { if: any(flag('w.halcyon_state', 'dead'), flag('w.halcyon_state', 'crashed')), text: 'Halcyon, a foreclosed campus with the letters coming off the sign one bolt at a time.' },
            { if: flag('w.aperture_state', 'exposed'), text: 'Aperture, half its windows dark, a guard in the lobby reading the paper about his own employer.' },
            { if: flag('w.aperture_state', 'destroyed'), text: 'Where Aperture used to be: a shuttered building, a name being pried off the granite, a market that turned out to have been a person after all, and then a defendant.' },
            { if: flag('w.aperture_state', 'thriving'), text: 'Aperture, thriving, a new glass annex in Millgate and a billboard that says TRUST IS A DATA POINT and means every word.' },
            {
              if: repealed,
              text: 'The surveillance law, repealed after the hearings, on the kind of close council vote the Row will be arguing about for twenty years. Councilwoman Briggs cast the last yes and then went back to talking about potholes.',
            },
            {
              if: all({ var: 'w.mnsa', eq: 1 }, not(repealed)),
              text: 'The surveillance law, entrenched. The city keeps everything now, and has mostly stopped noticing that it does.',
            },
            { if: all({ var: 'w.mnsa', eq: 2 }, not(repealed)), text: 'The watered-down surveillance law, keeping less than they wanted and more than anyone admits.' },
            { if: all({ var: 'w.mnsa', eq: 0 }, flag('a3.vote_resolved')), text: 'The surveillance law, dead on the council floor, and the small daily freedom of a city whose logs need a warrant again.' },
            {
              if: { var: 'w.cathode_open', eq: 0 },
              text: 'The Cathode, closed, a coffee chain in its booth where nobody will ever have a hard conversation again.',
              else: 'The Cathode, still open, still 24 hours, Sal still behind the counter with a pot in one hand at four in the morning.',
            },
            {
              if: flag('a4.copper_row_dark'),
              text: 'And a paragraph on page nine of the Herald, under the tide tables: every landline on Cannery Row dead for nine hours one October night, "a fault at the old exchange." Mr. Szabo tells anyone who will listen that the feds cut the lines. For once he is only half wrong. It was you.',
            },
            { if: flag('a3.hoax'), text: 'Somewhere in the archive of a dead message board, your Meridian leak is still filed under HOAXES, between a moon-landing thread and a man who believed his cat was a government drone. The names in it are still true. Nobody reads that folder.' },
          ],
          next: 'close',
        },
        close: {
          speaker: 'narrator',
          text: [
            'And running under all of it, invisible, the copper. The old net and the new net sharing a wire in a dark room, the way they always did, the way you finally used.',
            'You made some of this and inherited the rest and are responsible, one way or another, for all of it. That is what a decade is. That is what it means to have been here.',
          ],
          effects: [{ flag: 'a4.city_done' }],
        },
      },
    },
    {
      id: 'a4_last_day',
      channel: 'dialog',
      title: 'The Last Day',
      start: 'open',
      nodes: {
        open: {
          speaker: 'narrator',
          text: [
            'The last day the story will give you before the epilogue takes over. The light is thin and gold, the way December light is on the Sound. You could spend it a hundred ways.',
            { if: flag('a4.copper_photo_kept'), text: 'There is a grey sedan parked across the street with nobody in it. It is probably nobody. You check the mirror twice on the way out anyway, and you will check it tomorrow, and the day after that.' },
            { if: { obligation: 'pkg04_act4_judgment' }, text: 'The garnishment notice from Coastline Mutual is on the fridge under a magnet shaped like a lighthouse. Kim put it there. She thinks it is funny. It is, a little.' },
            'You will only get to spend it once.',
          ],
          choices: [
            {
              text: 'Spend it at the Cathode, in your booth, with whoever wanders in.',
              if: { var: 'w.cathode_open', eq: 1 },
              effects: [{ stat: 'mood', add: 10 }, { stat: 'stress', add: -10 }, { stat: 'health', add: 4 }],
              goto: 'cathode',
            },
            {
              text: 'Spend it at home on the Row, with the family that\'s left.',
              if: not(fate('mom', 'estranged')),
              effects: [{ stat: 'mood', add: 10 }, { stat: 'stress', add: -8 }],
              goto: 'home',
            },
            {
              text: 'Spend it with the person you love.',
              if: any({ npc: 'grace', romance: ['dating', 'partner', 'engaged', 'married'] }, { npc: 'mira', romance: ['dating', 'partner', 'engaged', 'married'] }),
              effects: [{ stat: 'mood', add: 12 }, { stat: 'stress', add: -10 }],
              goto: 'love',
            },
            {
              text: 'Spend it on the hill above the Sound, alone, with the people who aren\'t here anymore.',
              effects: [{ stat: 'stress', add: -6 }, { stat: 'mood', add: 2 }],
              goto: 'hill',
            },
            {
              text: 'Spend it at the screen, one last time, because that is who you are.',
              effects: [{ stat: 'stress', add: 2 }],
              goto: 'screen',
            },
          ],
        },
        cathode: {
          speaker: 'narrator',
          text: [
            'Sal saves you the stool without being asked, the way he has for years. The coffee is terrible and endless. People drift in and out of the booth all day — some you helped, some you failed, some who never knew you did either.',
            { if: fate('jax', 'backroom_partner'), text: 'Jax is behind the back-room counter, arguing about the coffee budget, and it is the best job either of you ever had.' },
            'It is an ordinary day in an ordinary diner, and you would not trade it for any of the extraordinary ones.',
          ],
          effects: [{ flag: 'a4.last_day_done' }],
        },
        home: {
          speaker: 'narrator',
          text: [
            'The flat smells like home. Somebody does the dishes and somebody dries. Kim gives you a look; Dad asks if you\'ve checked your oil.',
            { if: flag('a4.kim_left_waiting'), text: 'The light in Kim\'s old room is on at noon. She is not in there. She just leaves it on now, the way other people leave a radio going. You told her to hold on a little longer, and she did, and she is still holding.' },
            { if: flag('a3.memory_defended'), text: 'Mom\'s photo is back by the register at the Cathode, and a copy of it is here, on the fridge, next to the church-basement flyer from the night you read the receipts out loud. Dad keeps the flyer. He will not say why. He does not have to.' },
            { if: flag('a3.memory_let_burn'), text: 'Nobody mentions the whisper about Mom\'s fundraiser. Nobody has mentioned it in a year. That is how you know the Row still remembers it, and still remembers that you let it run.' },
            { if: flag('a3.memory_hunted'), text: 'Dad asks, carefully, whatever happened to that reputation outfit in Millgate, the one that went out of business so suddenly. You say you have no idea. He nods, and passes the rice, and does not ask again.' },
            { if: flag('a4.copper_row_dark'), text: 'Mrs. Alvarez comes up the stairs with a casserole and a story about the night every phone on the Row went dead, and how she walked to the Cathode in her slippers to call her sister from Sal\'s. You laugh in the right places. You do not tell her whose elbow it was.' },
            { if: fate('mom', 'passed'), text: 'Her chair is still at the table. Nobody sits in it and nobody moves it, and today it feels less like a wound and more like a place being kept.' },
            { if: fate('mom', 'healthy'), text: 'Mom reports the whole neighborhood\'s business and tells you you look thin, and you have never been so glad to be told you look thin.' },
            'You are, for one whole day, just somebody\'s kid and somebody\'s sibling, in a small warm flat on Cannery Row, and nothing is on fire, and nobody is watching.',
          ],
          effects: [{ flag: 'a4.last_day_done' }],
        },
        love: {
          speaker: 'narrator',
          text: [
            { if: { npc: 'grace', romance: ['dating', 'partner', 'engaged', 'married'] }, text: 'Grace comes off shift and you make her breakfast at three in the afternoon, and she checks your pupils out of habit, and you let her. Two people on one broken schedule, choosing each other in the last of the light.' },
            {
              if: all({ npc: 'grace', romance: ['dating', 'partner', 'engaged', 'married'] }, flag('a4.grace_half_truth')),
              text: 'Once, over the eggs, she looks at you as if she is about to ask the question again, the one you answered with most of the truth. She doesn\'t. She said she wouldn\'t, and she keeps her word better than you kept yours. You almost tell her anyway. The moment passes, the way you have always let it.',
            },
            { if: { npc: 'mira', romance: ['dating', 'partner', 'engaged', 'married'] }, text: 'Mira trades you one last puzzle over cold coffee and then, for once, just sits with you and says nothing much. She signs the air between you: *hugz*. After all these years, it still gets you.' },
            'Whatever comes tomorrow, today there is a person, and they are here, and they know at least one of your lives and stayed anyway.',
          ],
          effects: [{ flag: 'a4.last_day_done' }],
        },
        hill: {
          speaker: 'narrator',
          text: [
            'The hill above the Sound, where the view is wasted on the dead. You bring coffees for the ones who can\'t drink them and set them on the stones, an old habit now, a private liturgy.',
            { if: fate('jax', 'dead'), text: 'You tell Jax he was right about the view. You tell him a few other things too.' },
            { if: fate('mom', 'passed'), text: 'You tell Mom you finally started sleeping. You think she\'d have liked to know that.' },
            { if: fate('byteme', 'dead'), text: 'You tell Kevin it was never his fault, which is true, and which you should have told him while he could hear it.' },
            'The fog comes in off the water. A ship sounds its horn, low and long. Then you go back down, one more time, to the living.',
          ],
          effects: [{ flag: 'a4.last_day_done' }],
        },
        screen: {
          speaker: 'narrator',
          text: [
            'Of course it\'s the screen. It was always going to be the screen. You boot the old beige box one last time out of the closet, cable wrapped around it like a sleeping cat, and it wakes with the sound you loved before you knew what it cost: the dial-up handshake, the two modems finding each other in the dark.',
            {
              if: all(not(flag('w.scene_state', 'dark')), not(flag('a4.bonfire_outed'))),
              text: 'Three handles online. Somebody says hey. You say hey back. The scene, still here, still awake at the wrong hour, still yours.',
            },
            {
              if: all(not(flag('w.scene_state', 'dark')), flag('a4.bonfire_outed')),
              text: 'Three handles online. You type hey. Nobody says hey back. Your handle is grey on the user list, a ban reason beside it in small letters: FIRST FIRE. The scene is still here, still awake at the wrong hour. It just is not yours anymore, and it is right not to be.',
            },
            {
              if: flag('w.scene_state', 'dark'),
              text: 'Nobody answers. The board is dark. But the handshake still sings, and for one last minute you let it, and it is enough, and it is not enough, and that was always the whole story.',
            },
          ],
          effects: [{ flag: 'a4.last_day_done' }],
        },
      },
    },
  ],
})
