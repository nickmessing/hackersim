/**
 * PKG-15 — life_thanksgiving (bible §9.1 #6): recurring yearly, four authored variants keyed to
 * act + fates so it never repeats identically across eleven Novembers. Each variant reads state
 * back: who is alive and around, your heat, Kim's trajectory, Dad's work, and a hard silence if
 * Mom is gone. Two extra variants: in custody (a mail, "we saved you a plate") and estranged from
 * Mom (Sal's orphans' Thanksgiving at the Cathode).
 */
import { dayOf } from '@/engine/calendar'
import { defineContent } from '@/engine/registry'
import type { Cond, SceneDef, TextPart, TriggerDef } from '@/engine/types'
import { THANKSGIVING_DAYS, QUIET_RESET, atParents, between, close, darkTurn, momGone, momHere, onDays, partnerIs, withPartner } from './_shared'

const inYear = (y: number): Cond => between(dayOf(y, 10, 1), dayOf(y, 11, 31))

/** Lines shared by several variants. */
const TRAVEL: TextPart = {
  if: { not: atParents },
  text: 'You take the bus back to Cannery Row with a store-bought pie on your lap, because you are an adult now and adults bring pie.',
}
const PARTNER_AT_TABLE: TextPart[] = [
  { if: { all: [withPartner, partnerIs('mira')] }, text: 'Mira sits next to you and answers every one of Uncle Danh\'s questions with a single devastating fact. By dessert he is asking her for investment advice.' },
  { if: { all: [withPartner, partnerIs('grace')] }, text: 'Grace came straight off a shift and still has trauma shears clipped to her scrubs. Mom loves her immediately and aggressively, the way she loves people she has decided to feed.' },
]
const JAX_LINE: TextPart[] = [
  { if: close('jax', 30), text: 'Jax and Rosa drift over from the far end of the Row for pie, the way they have every year since sixth grade. Jax eats three slices and calls Mom "Mrs. T" in a voice that makes her swat him with a dish towel.' },
  { if: { npc: 'jax', fate: 'arrested' }, text: 'Mrs. Ferreira sends over a plate wrapped in foil with JAX written on it in marker, out of habit. Nobody knows what to do with it. Eventually Dad puts it in the fridge, and it stays there for a week.' },
  { if: { npc: 'jax', fate: 'dead' }, text: 'Nobody comes over from the far end of the Row for pie this year. Nobody will again.' },
]
const HEAT_LINE: TextPart = {
  if: { stat: 'heat', gte: 50 },
  text: 'During dessert a car idles across the street with its lights off for twenty minutes, then leaves. Only you notice. You think only you notice.',
}

// ════════════════════════════════════════════════════════════════════════════
// Scenes
// ════════════════════════════════════════════════════════════════════════════

const scenes: SceneDef[] = [
  // ── Act I: the first one ──────────────────────────────────────────────────
  {
    id: 'life_thanksgiving_a1',
    channel: 'dialog',
    title: 'Thanksgiving at the Tans\'',
    start: 'start',
    nodes: {
      start: {
        speaker: 'narrator',
        text: [
          'The flat is ten degrees too warm and smells like four cuisines at once: Mom\'s turkey, Mom\'s spring rolls, a pot of pho "for people who don\'t like turkey" (Dad), and whatever Grandma Ruth brought in the casserole dish she has been bringing since 1987.',
          'Aunt Bien has brought her new camera and is photographing every dish before anyone can eat it. Uncle Danh has brought a gold watch, a firm handshake and a box of water filters. Kim has brought an attitude.',
          {
            if: { flag: 'a1.dad_laid_off' },
            text: 'Dad sits at the head of the table the way he always has. It\'s been a few weeks since the mill. He carves the turkey with great care, like it\'s the last job in the city, and nobody says the word "layoff" once, loudly.',
            else: 'Dad spends the first ten minutes complaining about the mill\'s new computer system, which he refers to exclusively as "that box."',
          },
          ...JAX_LINE,
        ],
        choices: [
          {
            text: 'Stand up. Propose a toast to Dad.',
            effects: [{ npc: 'dad', affinity: 5 }, { faction: 'fac.hood', add: 2 }, { stat: 'mood', add: 4 }],
            goto: 'toast',
          },
          {
            text: '"Uncle Danh, walk me through the numbers on these water filters."',
            tag: '[Business]',
            check: {
              skill: 'business',
              dc: 12,
              success: 'filters_ok',
              fail: 'filters_bad',
              successEffects: [{ stat: 'mood', add: 5 }, { faction: 'fac.hood', add: 1 }, { npc: 'mom', affinity: 2 }],
              failEffects: [{ money: -40 }, { npc: 'uncle', affinity: 4 }, { stat: 'mood', add: 2 }],
            },
          },
          {
            text: 'Touch football on the Row before pie.',
            tag: '[Fitness]',
            check: {
              skill: 'fitness',
              dc: 10,
              bonuses: [{ if: { trait: 'gym_rat' }, add: 2, label: '+2 (gym rat)' }],
              success: 'football_ok',
              fail: 'football_hedge',
              successEffects: [{ stat: 'mood', add: 6 }, { xp: 'fitness', add: 20 }, { npc: 'kim', affinity: 2 }, { npc: 'jax', affinity: 2 }],
              failEffects: [{ stat: 'health', add: -3 }, { stat: 'mood', add: 3 }, { npc: 'kim', affinity: 3 }],
            },
          },
          {
            text: 'Slip upstairs to check the board. Just for a minute.',
            effects: [{ npc: 'mom', affinity: -2 }, { xp: 'programming', add: 10 }],
            goto: 'upstairs',
          },
        ],
      },
      toast: {
        speaker: 'player',
        text: [
          { if: { flag: 'a1.dad_laid_off' }, text: 'You don\'t plan it. You just stand up with your glass of orange soda and say, "To Dad, who fixed everything in this house, and that mill, for twenty years, and who is going to fix whatever comes next." It comes out shakier than you meant.', else: 'You stand up with your orange soda and toast Dad, "who has been at war with that box for three months and is, I believe, winning." It gets a laugh.' },
          'Dad looks at his plate for a moment. Then he raises his beer. "To the kid," he says. Mom squeezes your hand under the table and doesn\'t let go through the whole of Aunt Bien\'s photography.',
        ],
        next: 'end',
      },
      filters_ok: {
        speaker: 'narrator',
        text: 'You ask about margins. You ask about the distributor. You ask, gently, how many filters are currently in his garage. Uncle Danh deflates like a pool toy in October, then laughs louder than anybody. "This one," he says, pointing his fork at you. "This one should be in business." Mom winks at you over the cranberry sauce.',
        next: 'end',
      },
      filters_bad: {
        speaker: 'narrator',
        text: 'You ask about margins. He answers with a story about a man in Ridgeport who retired at thirty-one. You ask about the distributor. He answers with a handshake. Somehow, by the time the pie comes out, you have agreed to buy six water filters "at family price." They arrive in a box the size of a dishwasher.',
        next: 'end',
      },
      football_ok: {
        speaker: 'narrator',
        text: 'The Row in November, breath fogging, a football that belongs to nobody. You throw one perfect spiral in your life and it happens today, in front of Kim, who will deny it forever. You come in red-cheeked and starving, and the pie tastes like a prize.',
        next: 'end',
      },
      football_hedge: {
        speaker: 'narrator',
        text: 'Kim tackles you. Kim, who weighs about as much as a bag of rice. You go sideways into Mrs. Alvarez\'s hedge and come out with twigs in your hair and a scratch across one cheek. Kim tells the story at dinner with gestures. Everyone agrees it is the best thing that has happened all year.',
        next: 'end',
      },
      upstairs: {
        speaker: 'narrator',
        text: 'Just a minute turns into forty. The board is quiet, which is the point of checking. When you come back down, the pie is gone, Uncle Danh is asleep in Dad\'s chair, and Kim is guarding a single slice on a paper plate. "Four dollars," she says. "Holiday pricing."',
        next: 'end',
      },
      end: {
        speaker: 'narrator',
        text: 'Later, in the kitchen, Mom hands you a dish towel without a word, and you dry while she washes, the way you did when you were small. The radio plays something old. Outside, the Row\'s windows are all lit up and fogged over. It is, you will think later, a very good night.',
        effects: [{ stat: 'stress', add: -8 }, { stat: 'mood', add: 4 }, { npc: 'mom', affinity: 2 }],
      },
    },
  },

  // ── Act II: everyone's getting paid (and then) ────────────────────────────
  {
    id: 'life_thanksgiving_a2',
    channel: 'dialog',
    title: 'Thanksgiving',
    start: 'start',
    nodes: {
      start: {
        speaker: 'narrator',
        text: [
          TRAVEL,
          { if: inYear(2002), text: 'The first Thanksgiving where you have real money. You bring the good pie from the Hill bakery and an envelope for Mom that she will refuse three times and then put in the flour tin.' },
          { if: inYear(2003), text: 'Uncle Danh has upgraded from water filters to a binder. The binder has tabs. Everyone is very careful not to ask about the binder.' },
          { if: inYear(2004), text: 'The table is louder this year, the way tables get when everyone is working again. Half the conversation is about which of Kim\'s friends\' parents got hired where.' },
          {
            if: momGone,
            text: 'Dad cooks. He has never cooked. He does it from her recipe cards, in her handwriting, with his reading glasses on, and he burns the rolls, and nobody says anything. Kim sets Mom\'s place at the table anyway. Nobody moves it.',
          },
          { if: { all: [momHere, { npc: 'mom', fate: 'healthy' }] }, text: 'Mom is thinner since the hospital, and bossier, which the doctors say is a good sign. She runs the kitchen from a chair like a general.' },
          { if: { all: [momHere, { npc: 'mom', fate: 'recovered_dark' }] }, text: 'Mom says grace and thanks God for "the insurance money." She looks at you when she says it, and then she doesn\'t, for the rest of the night.' },
          { if: { flag: 'life.mom_application', eq: 'sent' }, text: 'Mom tells marina stories now: a yacht named INVOICE, a millionaire who pays in quarters. She has two jobs and more opinions than ever.' },
          { if: { flag: 'life.mom_application', eq: 'missed' }, text: 'The marina office sent a holiday card to the whole Row this year. Mom puts it in the drawer with the takeout menus without opening it.' },
          { if: { all: [momHere, { flag: 'life.mom_written_warning' }] }, text: 'Mom keeps Pruitt\'s written warning in the drawer with the takeout menus. She takes it out after dinner to show Aunt Bien, the way other women show wedding photos. "Seven minutes," she says. "I won anyway." She does not look at you when she says the part about winning anyway.' },
          { if: { all: [momHere, { flag: 'life.pruitt_watching' }] }, text: 'Mom still takes the long way home from the cannery. She says it\'s for the exercise. Pruitt still watches her books like a hawk watching a mouse that already escaped once, and she still hasn\'t asked you again what exactly you did. She is waiting for you to tell her.' },
          { if: { flag: 'life.guild_settled_twice' }, text: 'The NorthLink warning letter is still taped to the fridge — ONE MORE NOTICE ON THIS ACCOUNT — and Dad has written, under it, in his form capitals: NO SONGS. Kim will not make eye contact with the fridge.' },
          ...PARTNER_AT_TABLE,
          ...JAX_LINE,
          { if: darkTurn, text: 'You put your pager face-down next to your plate. It buzzes twice during grace. Everyone pretends not to hear it.' },
          HEAT_LINE,
        ],
        choices: [
          {
            text: [{ if: momGone, text: 'Say grace, the way she did.', else: 'Say grace this year.' }],
            effects: [{ faction: 'fac.hood', add: 2 }, { npc: 'dad', affinity: 3 }, { npc: 'kim', affinity: 2 }],
            goto: 'grace',
          },
          {
            text: 'Deflect every single question about what you do for work.',
            tag: '[Social]',
            check: {
              skill: 'social',
              dc: 14,
              bonuses: [{ if: { flag: 'fac.halcyon.employed' }, add: 3, label: '+3 (you have a boring legit job to hide behind)' }],
              success: 'deflect_ok',
              fail: 'deflect_bad',
              successEffects: [{ stat: 'stress', add: -4 }, { stat: 'mood', add: 3 }],
              failEffects: [{ npc: 'mom', affinity: -2 }, { stat: 'stress', add: 4 }, { flag: 'life.mom_suspects' }, { chance: 0.3, then: [{ complication: 'social' }] }],
            },
          },
          {
            text: 'The pager buzzes a third time. Take the call. Leave early.',
            if: darkTurn,
            effects: [{ stat: 'cred', add: 2 }, { npc: 'mom', affinity: -3 }, { npc: 'dad', affinity: -2 }, { faction: 'fac.hood', add: -2 }],
            goto: 'left_early',
          },
          {
            text: 'Stay late. Do the dishes.',
            effects: [{ if: momHere, then: [{ npc: 'mom', affinity: 4 }], else: [{ npc: 'dad', affinity: 4 }] }, { stat: 'stress', add: -6 }],
            goto: 'dishes',
          },
        ],
      },
      grace: {
        speaker: 'player',
        text: [
          { if: momGone, text: 'You say it the way she did: fast, a little impatient, with the part at the end about "and everyone who is not at a table tonight." Dad closes his eyes. Kim holds your hand so hard it hurts.', else: 'You say grace. You are terrible at it. You thank God for the turkey, for Mom, for Dad, for Kim "mostly," and for the fact that Uncle Danh has not yet opened the binder. Everyone says amen very loudly.' },
        ],
        next: 'end',
      },
      deflect_ok: {
        speaker: 'narrator',
        text: '"Consulting," you say. "Mostly databases. Very boring." You make it so boring that Aunt Bien changes the subject to her gallbladder within ninety seconds. Only Kim watches you across the table with a small, knowing smile, and helps herself to your roll as a fee.',
        next: 'end',
      },
      deflect_bad: {
        speaker: 'narrator',
        text: '"But what do you actually DO?" says Uncle Danh, the one person at the table with the stamina to ask three times. You say "computers." He says "what kind." You say "the internet kind." Mom puts down her fork and looks at you the way she looks at a column that doesn\'t add up, and keeps looking at you, off and on, all night.\n\nAunt Bien, who runs the Row\'s phone tree, heard every word. By Monday "the internet kind" has become three different stories on three different stoops, and in one of them you are in the Mafia.',
        next: 'end',
      },
      left_early: {
        speaker: 'narrator',
        text: 'You say "work thing" and "sorry" and "I\'ll call," and you are down the stairs with a foil-wrapped plate before anyone can argue. On the bus you check the pager. It was important. It was also, you realize around the third stop, not more important than this.',
      },
      dishes: {
        speaker: 'narrator',
        text: [
          { if: momHere, text: 'Mom washes, you dry. She talks about the Row: who\'s sick, who\'s pregnant, who\'s "running around." Then, without looking up from the sink: "You\'re careful? With whatever it is?" You say you are. She hands you a plate. "Be more careful."', else: 'Dad washes, you dry. He doesn\'t say much. At the end he hangs the dish towel over the oven door exactly the way she used to, squares it, and stands there for a second with his hand on it.' },
        ],
        next: 'end',
      },
      end: {
        speaker: 'narrator',
        text: 'You leave with enough leftovers to survive a siege and a slice of pie wrapped in a napkin for the bus. The Row is quiet. Somebody\'s radio is playing through a wall. For a few blocks, nothing is wrong.',
        effects: [{ stat: 'stress', add: -6 }, { stat: 'mood', add: 4 }],
      },
    },
  },

  // ── Act III: signal intelligence ─────────────────────────────────────────
  {
    id: 'life_thanksgiving_a3',
    channel: 'dialog',
    title: 'Thanksgiving',
    start: 'start',
    nodes: {
      start: {
        speaker: 'narrator',
        text: [
          TRAVEL,
          {
            if: momGone,
            text: 'The table has one fewer chair than it needs and one more than anyone can look at. Dad has gotten better at the recipe cards. The spring rolls are almost right. Almost right is somehow harder than wrong.',
            else: 'Mom has started saying "while we\'re all still here" when she means "sit down." Everyone sits down.',
          },
          { if: { flag: 'npc.dad.mill_job' }, text: 'Dad has to leave by seven for his shift at the data campus. He eats in his grey polo with the lanyard still around his neck, and every time the badge swings you think about what\'s humming on the floor he walks.' },
          { if: { flag: 'life.dad_declined_mill' }, text: 'Dad still carries the folded job posting in his wallet. You saw it when he paid for the rolls. He says it\'s to remind him of something. He won\'t say what.' },
          { if: { flag: 'life.dad_night_security' }, text: 'Dad eats fast; he walks the data campus with a flashlight from ten to six now, night security, because the résumé you wrote him said "OBJECTIVE: to work." He says he likes the quiet. He knows every door in the building. You try not to think about what is behind them.' },
          { if: { flag: 'life.dad_applied_alone' }, text: 'Dad talks about his new job to everyone at the table except you. When you ask, he says "fine," and passes the rolls. You told him the building wasn\'t what they said, and he heard that you thought he wasn\'t good enough. He is still proving you wrong, one shift at a time.' },
          { if: { flag: 'life.dad_gave_statement' }, text: 'Dad says grace this year, and at the end he adds, looking at his plate, "and keep this family honest." Everyone says amen. Only you know it was addressed to you.' },
          { if: { flag: 'life.dad_resume_lost' }, text: 'Dad makes a joke about "those data campus people wanting somebody younger." Everyone laughs politely. You laugh too, which is the worst thing you do all day.' },
          { if: { var: 'kim_trajectory', gte: 2 }, text: 'Kim has college brochures in her bag and pretends they\'re for a friend. When nobody\'s looking she leaves one next to your plate with a sticky note: "tell dad for me??"' },
          { if: { var: 'kim_trajectory', lte: -2 }, text: 'Kim spends dinner with a pager in her lap, thumbing messages under the table in a shorthand you recognize because you invented it.' },
          { if: { npc: 'kim', fate: 'endangered' }, text: 'Kim jumps when the doorbell rings. It\'s only Grandma Ruth with a casserole. Kim laughs about it, too loud, and you can\'t eat for a while.' },
          { if: { all: [momHere, { flag: 'life.mom_suspects' }] }, text: 'Mom has stopped asking what you do. She asks everyone else instead — Kim, your partner, Uncle Danh — little casual questions when she thinks you\'re in the kitchen, like a woman balancing a column she doesn\'t trust.' },
          { if: { flag: 'side.green_bean_dinner' }, text: 'There are no green beans. There have been no green beans at a family meal since the dinner where Dad asked about "the hacking thing" in front of everyone. It is the family\'s only unanimous policy.' },
          { if: { var: 'w.mnsa', eq: 1 }, text: 'Uncle Danh jokes that the government is listening to the turkey. Nobody laughs. Dad glances at the phone on the wall.' },
          ...PARTNER_AT_TABLE,
          ...JAX_LINE,
          HEAT_LINE,
        ],
        choices: [
          {
            text: 'Raise a glass to the people who aren\'t at the table.',
            effects: [{ faction: 'fac.hood', add: 3 }, { stat: 'mood', add: -2 }, { stat: 'stress', add: -4 }],
            goto: 'absent',
          },
          {
            text: 'Kim and Dad are one sentence from a real fight. Step in.',
            tag: '[Social]',
            check: {
              skill: 'social',
              dc: 15,
              bonuses: [{ if: { npc: 'kim', affinityGte: 50 }, add: 2, label: '+2 (Kim will listen to you)' }],
              success: 'peace',
              fail: 'fight',
              successEffects: [{ npc: 'kim', affinity: 4 }, { npc: 'dad', affinity: 3 }],
              failEffects: [{ npc: 'kim', affinity: -2 }, { npc: 'dad', affinity: -3 }, { var: 'kim_trajectory', add: -1 }, { stat: 'stress', add: 5 }, { flag: 'life.tg_three_way_fight' }],
            },
          },
          {
            text: 'Before dessert, step outside and check the street.',
            tag: '[OpSec]',
            check: {
              skill: 'opsec',
              dc: 14,
              success: 'street_clear',
              fail: 'street_paranoid',
              successEffects: [{ stat: 'stress', add: -5 }, { stat: 'heat', add: -2 }],
              failEffects: [{ stat: 'stress', add: 6 }, { npc: 'kim', affinity: -1 }, { var: 'kim_trajectory', add: -1 }, { flag: 'life.kim_saw_you_watching' }],
            },
          },
          {
            text: 'Leave your pager in the car. Just be here.',
            effects: [{ stat: 'stress', add: -8 }, { stat: 'mood', add: 5 }, { if: momHere, then: [{ npc: 'mom', affinity: 3 }], else: [{ npc: 'dad', affinity: 3 }] }],
            goto: 'present',
          },
        ],
      },
      absent: {
        speaker: 'player',
        text: [
          '"To everybody who isn\'t here," you say, and the room goes quiet in a way that tells you everyone has their own list.',
          { if: momGone, text: 'Dad says her name. Just her name. It\'s the first time he has said it out loud at this table since.' },
          { if: { npc: 'jax', fate: ['arrested', 'dead', 'gone'] }, text: 'You think about the booth at the Cathode with the initials carved under the table.' },
          'Glasses touch. The candles gutter. Somebody passes the rolls, because somebody always passes the rolls.',
        ],
        next: 'end',
      },
      peace: {
        speaker: 'narrator',
        text: 'You catch Kim\'s eye and tell a story, the one about the hedge, the one from the first Thanksgiving, and by the time you get to the twigs in your hair Dad is laughing and Kim is correcting your details. The fight doesn\'t happen. It will happen some other day, but not today, and today is what you had.',
        next: 'end',
      },
      fight: {
        speaker: 'narrator',
        text: 'You say the wrong thing at the right moment and suddenly it is three people fighting instead of two. Kim leaves the table. Dad stares at his plate. Twenty minutes later Kim comes back for pie without a word, which in this family is the same as an apology, but the rest of the night has a crack in it.\n\nThe crack doesn\'t close. Kim stops coming home on Sundays. When she does come, she and Dad talk to each other through you, like you are the phone line they share, and you are, and you put yourself there.',
        next: 'end',
      },
      street_clear: {
        speaker: 'narrator',
        text: 'The street is just a street: parked cars you recognize, the Quinteros\' Christmas lights already up, a cat on the Alvarez steps. No idling engines, nobody sitting too long in a car. You stand there long enough to be sure, then go back in, and the warm air hits you like a hug.',
        next: 'end',
      },
      street_paranoid: {
        speaker: 'narrator',
        text: 'A van you don\'t recognize. A man walking a dog that doesn\'t look like his dog. You stand on the steps for twenty minutes cataloguing license plates until Kim opens the door behind you and says, very quietly, "Hey. Who are you looking for?" You don\'t have an answer she should hear.\n\nShe doesn\'t ask again. But the next time you visit, you catch her at the front window before dinner, doing it — the parked cars, the plates, the man with the wrong dog — with your exact posture. You taught her that on a stoop without saying a word.',
        next: 'end',
      },
      present: {
        speaker: 'narrator',
        text: 'Without the pager your hand keeps reaching for your pocket, like a phantom limb. After an hour it stops. You hear the whole of Aunt Bien\'s gallbladder story. You learn Kim\'s best friend\'s name. You notice how gray Dad has gone at the temples. You were here for all of it.',
        next: 'end',
      },
      end: {
        speaker: 'narrator',
        text: 'On the way out you stop at the door and look back at the lit windows. The Row has changed; the city has changed; you have. This room, somehow, has not. You take the leftovers. You always take the leftovers.',
        effects: [{ stat: 'stress', add: -5 }, { stat: 'mood', add: 3 }],
      },
    },
  },

  // ── Act IV: the long tail ────────────────────────────────────────────────
  {
    id: 'life_thanksgiving_a4',
    channel: 'dialog',
    title: 'Thanksgiving',
    start: 'start',
    nodes: {
      start: {
        speaker: 'narrator',
        text: [
          'You\'re {age}. You bring two pies now, and a bottle of something decent, and you park your own car on the Row where you used to throw a football that belonged to nobody.',
          {
            if: momGone,
            text: 'Dad hosts. He has her recipe cards laminated. The spring rolls are right now, exactly right, and he watches your face when you take the first bite, and you nod, and he looks away fast.',
            else: 'Mom lets Kim cook this year, and supervises, and criticizes, and at the end says it\'s the best turkey she ever had, which is a lie she tells with her whole heart.',
          },
          { if: { npc: 'dad', fate: 'spiral' }, text: 'Dad drinks steadily through dinner, not loudly. Kim moves the bottle to the kitchen twice. He finds it twice.' },
          { if: { npc: 'kim', fate: 'thriving' }, text: 'Kim brought her scholarship letter in a frame "as a joke." It is not a joke. Dad reads it out loud at the table, twice.' },
          { if: { npc: 'kim', fate: 'follows_in' }, text: 'Kim asks you, quietly, over the potatoes, if you\'ve ever heard of a handle called by a name you gave her once. You have. She\'s very good. She has none of your excuses, and all of your habits.' },
          { if: { any: [{ npc: 'mira', romance: 'married' }, { npc: 'grace', romance: 'married' }] }, text: 'Your spouse sits beside you and steals your cranberry sauce with the ease of long practice. Mom, or the empty chair where Mom sat, has finally gotten what she wanted from you.' },
          { if: { flag: 'life.tg_three_way_fight' }, text: 'Kim and Dad sit at opposite ends of the table, the way they have since the year the fight became three people. They are polite. They pass each other things. You are still the phone line between them.' },
          { if: { flag: 'life.kim_saw_you_watching' }, text: 'Before dessert, Kim goes to the front window and checks the street — the plates, the idling cars — then comes back and sits down like nothing happened. She catches you watching her do it. Neither of you says a word.' },
          { if: { flag: 'side.wedding_yes_speech' }, text: 'Kim does her impression of your wedding vows — "I— yes. All of it. Yes." — every single year since the wedding. It still gets a standing ovation. You still deserve it.' },
          { if: { npc: 'jax', fate: 'backroom_partner' }, text: 'Jax comes in without knocking, the way he has for twenty years, with Rosa and a pie from the Cathode. He runs the back room with you now. He still calls your mother Mrs. T.' },
          { if: { npc: 'jax', fate: 'free' }, text: 'Jax drops by for pie, older, careful now. He says "be careful" when he leaves. You hate it. You say it back.' },
          { if: { npc: 'jax', fate: ['arrested', 'dead', 'gone', 'flipped'] }, text: 'Nobody comes over from the far end of the Row for pie. You notice the time when they used to.' },
          HEAT_LINE,
        ],
        choices: [
          {
            text: 'Tell them you love them. Out loud. At the table. Like a crazy person.',
            effects: [{ faction: 'fac.hood', add: 3 }, { npc: 'kim', affinity: 4 }, { if: momHere, then: [{ npc: 'mom', affinity: 4 }], else: [{ npc: 'dad', affinity: 4 }] }],
            goto: 'love',
          },
          {
            text: 'Tell them the truth. All of it. Finally.',
            tag: '[Social]',
            check: {
              skill: 'social',
              dc: 16,
              bonuses: [{ if: { flag: 'life.family_shield' }, add: 3, label: '+3 (they covered for you once; they already know)' }],
              success: 'truth_ok',
              fail: 'truth_bad',
              successEffects: [{ stat: 'stress', add: -12 }, { faction: 'fac.hood', add: 4 }],
              failEffects: [{ stat: 'stress', add: 6 }, { npc: 'kim', affinity: -2 }, { stat: 'mood', add: -4 }],
            },
          },
          {
            text: 'Just eat. Just be here. Say nothing that matters and let that be enough.',
            effects: [{ stat: 'mood', add: 5 }, { stat: 'stress', add: -6 }],
            goto: 'eat',
          },
        ],
      },
      love: {
        speaker: 'narrator',
        text: 'It is mortifying. Kim throws a roll at you. Dad clears his throat four separate times. And then, one by one, around the table, everyone says it back, in their own worst way: "yeah, okay," "you too, weirdo," "pass the gravy, I love you." Nobody will ever mention it again, and nobody will ever forget it.',
        next: 'end',
      },
      truth_ok: {
        speaker: 'narrator',
        text: [
          'You tell it like a story, from the beige box and the 33.6 modem to now. Not the names that would hurt anyone. Everything else.',
          'Nobody interrupts. When you\'re done the candles have burned down to stubs. Kim says, "I knew most of that." Dad says, "I knew some." And then someone says, "Well. You\'re here," and that turns out to be the whole verdict.',
        ],
        next: 'end',
      },
      truth_bad: {
        speaker: 'narrator',
        text: 'You start. You get as far as the first contract before the words run out, or the nerve, or both. You say "anyway" and reach for the potatoes. Kim looks at you for a long moment and then, kindly, which is worse, starts talking about her job. The truth goes back where you keep it.',
        next: 'end',
      },
      eat: {
        speaker: 'narrator',
        text: 'You eat. Aunt Bien photographs the pie. Uncle Danh explains the economy. The radio plays the same old song it played the first year. You say nothing that matters for three hours, and it is exactly, precisely enough.',
        next: 'end',
      },
      end: {
        speaker: 'narrator',
        text: 'When you leave, the Row is dark and cold and the windows of the flat are fogged gold. You sit in the car for a minute before you start it. You have been doing this for a long time now. You would like to keep doing it for a long time more.',
        effects: [{ stat: 'stress', add: -6 }, { stat: 'mood', add: 4 }],
      },
    },
  },

  // ── In custody ─────────────────────────────────────────────────────────────
  {
    id: 'life_thanksgiving_jail',
    channel: 'mail',
    title: 'We saved you a plate',
    from: 'Home',
    start: 'start',
    nodes: {
      start: {
        text: [
          { if: momHere, text: 'Sweetheart,', else: 'Kid,' },
          { if: momHere, text: 'We ate at four like always. I made the spring rolls you like and nobody was allowed to take the last two. They are in the freezer with your name on them. Kim wrote your name. She drew a skull on it, I told her that was not funny, she said it was a little funny.', else: 'We ate at four. I did the rolls from your mother\'s cards. Burned some. Saved you the good ones, they\'re in the freezer.' },
          'Your chair was there. Nobody sat in it.',
          { if: momHere, text: 'Eat something in there. Don\'t let them see you scared. Come home.\n\nMom', else: 'Keep your head down. Come home.\n\nDad' },
        ],
        effects: [{ stat: 'mood', add: 6 }, { stat: 'stress', add: -4 }],
        choices: [
          { text: 'Read it again. Then again.', effects: [{ stat: 'mood', add: 2 }] },
          { text: 'Write back on the jail stationery: "Save me the skull ones."', effects: [{ npc: 'kim', affinity: 3 }, { faction: 'fac.hood', add: 1 }] },
        ],
      },
    },
  },

  // ── Estranged: Sal's table ───────────────────────────────────────────────
  {
    id: 'life_thanksgiving_cathode',
    channel: 'dialog',
    title: 'Orphans\' Thanksgiving',
    start: 'start',
    nodes: {
      start: {
        speaker: 'narrator',
        text: [
          'Mom doesn\'t call. You didn\'t expect her to. You walk past the flat at four and the curtain moves, and then it doesn\'t.',
          {
            if: { var: 'w.cathode_open', eq: 1 },
            text: 'The Cathode has a hand-lettered sign on the door: CLOSED FOR THANKSGIVING. EXCEPT FOR YOU. KNOCK. Inside, Sal has pushed three tables together under the neon for everyone who has nowhere else: two night-shift cabbies, a nurse on her break, Grandma Ruth\'s nephew, a kid from the board you only know by handle.',
            else: 'The Cathode is dark now. But Sal has pushed his own kitchen table against a card table in his apartment above the dry cleaner\'s, for everyone who has nowhere else: two cabbies, a nurse, a kid from the board you only know by handle.',
          },
          'Sal puts a plate in front of you before you can take off your coat. "Eat," he says. "You look like a dropped call."',
        ],
        choices: [
          {
            text: 'Help Sal carve. Earn your plate.',
            effects: [{ npc: 'sal', affinity: 5 }, { faction: 'fac.hood', add: 3 }],
            goto: 'carve',
          },
          {
            text: 'Call Mom from the payphone. Just to say it.',
            tag: '[Social]',
            check: {
              skill: 'social',
              dc: 16,
              success: 'called',
              fail: 'voicemail',
              successEffects: [{ npc: 'mom', affinity: 6 }, { stat: 'mood', add: 4 }],
              failEffects: [{ stat: 'mood', add: -4 }, { npc: 'mom', affinity: -2 }, { stat: 'stress', add: 3 }],
            },
          },
          {
            text: 'Eat in silence. Be grateful somebody set a place.',
            effects: [{ stat: 'stress', add: -6 }],
            goto: 'quiet',
          },
        ],
      },
      carve: {
        speaker: 'sal',
        text: '"Thinner. Thinner. What are you, cutting bread for giants?" He takes the knife back after two slices and hands you the gravy instead. "You\'re on gravy. Gravy is a position of trust." You pour gravy for eleven strangers, and by the end of the night you know all their names.',
        next: 'end',
      },
      called: {
        speaker: 'mom',
        text: 'It rings seven times. Then: "Hello." You say it. Happy Thanksgiving. That\'s all. There is a long silence, and a sound you can\'t identify, and then she says, "Did you eat?" You say Sal fed you. She says, "Good. Sal is a good man." She hangs up. It is the longest conversation you\'ve had in a year, and you stand at the payphone for a while afterwards.',
        next: 'end',
      },
      voicemail: {
        text: 'The answering machine picks up. Dad\'s voice from years ago: "You\'ve reached the Tans, leave a message." You open your mouth. Nothing comes out. The machine beeps, waits, and cuts you off. You go back inside, and Sal has put pie in front of your chair.',
        next: 'end',
      },
      quiet: {
        speaker: 'narrator',
        text: 'Nobody makes you talk. The cabbies argue about a football game. The nurse falls asleep sitting up. The kid from the board shows you a trick on his pager that you taught somebody who taught him. It is a strange, warm, lonely table, and you are glad of every chair.',
        next: 'end',
      },
      end: {
        speaker: 'narrator',
        text: 'Sal sends everybody home with foil packages and refuses all money. "Next year," he says, "you bring the pie." It\'s not family. It\'s something. Some years, something is what there is.',
        effects: [{ stat: 'mood', add: 3 }, { stat: 'stress', add: -4 }],
      },
    },
  },
]

// ════════════════════════════════════════════════════════════════════════════
// Trigger
// ════════════════════════════════════════════════════════════════════════════

const triggers: TriggerDef[] = [
  {
    id: 'life_thanksgiving',
    when: onDays(THANKSGIVING_DAYS),
    once: false,
    cooldownDays: 300,
    atHour: 16,
    effects: [
      QUIET_RESET,
      {
        if: { jailed: true },
        then: [{ scene: 'life_thanksgiving_jail' }],
        else: [
          {
            if: { all: [{ npc: 'mom', fate: 'estranged' }, { not: momGone }] },
            then: [{ scene: 'life_thanksgiving_cathode' }],
            else: [
              {
                if: { var: 'act', lte: 1 },
                then: [{ scene: 'life_thanksgiving_a1' }],
                else: [
                  {
                    if: { var: 'act', eq: 2 },
                    then: [{ scene: 'life_thanksgiving_a2' }],
                    else: [{ if: { var: 'act', eq: 3 }, then: [{ scene: 'life_thanksgiving_a3' }], else: [{ scene: 'life_thanksgiving_a4' }] }],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
]


export default defineContent({ scenes, triggers })
