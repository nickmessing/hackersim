/**
 * PKG-15 — Life events §9.1: family & home.
 *
 *  - life_get_off_the_phone   recurring, Act I–II, at your parents' on dial-up. Plus the one-time twist
 *                             (life_phone_twist): for once it is YOU who kills someone else's transfer,
 *                             and the transfer is Mom's job application. Sets life.phone_twist and
 *                             life.mom_application ('sent' | 'missed'), read at Thanksgiving.
 *  - life_moms_boss           one-off, Act I–II: the rigged time clock at the cannery office.
 *  - life_family_finds_gear   one-off, Act II–III: heat ≥ 40 while living at home.
 *                             Sets life.family_shield (CP-B4 teaser, main_a3_q6 +2) or
 *                             life.family_may_report (Act III leverage) — which comes due later as
 *                             life_family_report_knock (Dad keeps his word to the detective).
 *  - life_aunt_chain_letter   recurring, Act I–II: Aunt Bien's forwards; the second one is a real
 *                             credential lure routed to a Millgate mail drop (evidence fragment,
 *                             w.exposure +1 on the investigate choice only).
 *  - life_dads_resume         one-off, Act III, after the mill reopens as a data campus.
 *                             Sets the steering flag npc.dad.mill_job (PKG-10 finalizes Dad's fate).
 */
import { defineContent } from '@/engine/registry'
import type { SceneDef, TriggerDef } from '@/engine/types'
import { QUIET_RESET, actGte, actLte, around, atParents, close, free, momGone, momHere, onDialup } from './_shared'

const phoneTwistReady = {
  all: [{ flag: 'a1.dad_laid_off' }, { not: { flag: 'life.phone_twist' } }],
}

// ════════════════════════════════════════════════════════════════════════════
// Scenes
// ════════════════════════════════════════════════════════════════════════════

const scenes: SceneDef[] = [
  // ── life_get_off_the_phone ───────────────────────────────────────────────
  {
    id: 'life_get_off_the_phone',
    channel: 'dialog',
    title: 'GET OFF THE PHONE',
    start: 'start',
    nodes: {
      start: {
        speaker: 'narrator',
        text: [
          'Forty-one minutes into a download. The progress bar has the patience of a glacier and the confidence of a man who has never once been interrupted.',
          {
            if: { flag: 'life.phone_deal' },
            text: 'You have a deal. The deal is laminated. The deal is on the fridge. And yet here comes the sound of your mother climbing the stairs with the specific rhythm of a woman who has decided the deal does not apply to emergencies.',
            else: 'Then, from the bottom of the stairs, in a voice that could strip varnish: "GET OFF THE PHONE! Your Aunt Bien has been getting a busy signal for an HOUR!"',
          },
          { if: { flag: 'life.phone_twist' }, text: 'Since the night of the marina application, she doesn\'t yell up the stairs anymore. She knocks. It is so much worse.' },
        ],
        choices: [
          {
            text: '"Coming, Ma!" Hang up. Say goodbye to the download.',
            effects: [{ stat: 'mood', add: -2 }, { npc: 'mom', affinity: 2 }],
            goto: 'yield',
          },
          {
            text: '"It\'s for school!"',
            tag: '[Lie]',
            check: {
              skill: 'social',
              dc: 11,
              bonuses: [{ if: { enrolled: true }, add: 3, label: '+3 (it is technically, occasionally, true)' }],
              success: 'lie_ok',
              fail: 'lie_bad',
              successEffects: [{ xp: 'programming', add: 20 }],
              failEffects: [{ npc: 'mom', affinity: -1 }, { stat: 'mood', add: -3 }, { stat: 'stress', add: 2 }],
            },
          },
          {
            text: '"FIVE MORE MINUTES!"',
            effects: [{ npc: 'mom', affinity: -2 }, { stat: 'stress', add: 2 }, { xp: 'networking', add: 15 }],
            goto: 'stubborn',
          },
          {
            text: '"Let\'s negotiate. Phone hours after ten, and I do dishes all week."',
            tag: '[Business]',
            if: { not: { flag: 'life.phone_deal' } },
            check: {
              skill: 'business',
              dc: 12,
              bonuses: [{ if: { background: 'class_clown' }, add: 1, label: '+1 (she laughs before she can stop herself)' }],
              success: 'deal_ok',
              fail: 'deal_bad',
              successEffects: [{ flag: 'life.phone_deal' }, { npc: 'mom', affinity: 1 }],
              failEffects: [{ stat: 'stress', add: 3 }, { stat: 'energy', add: -5 }],
            },
          },
        ],
      },
      yield: {
        speaker: 'mom',
        text: [
          'The modem gives its little death rattle. Downstairs, the phone rings within four seconds, like it was waiting.',
          '"Bien! Yes. Yes, he was on the computer. I know. I KNOW." A pause. Then, calling up the stairs, much sweeter: "Thank you, sweetheart. There\'s pho on the stove."',
        ],
      },
      lie_ok: {
        speaker: 'mom',
        text: '"School." A long, long pause, the kind that has an entire cross-examination folded up inside it. "Twenty minutes. Then Bien gets her phone call and you get your dinner." The download finishes with nine seconds to spare. You learned something from it. Possibly how to lie to your mother.',
      },
      lie_bad: {
        speaker: 'narrator',
        text: [
          'She picks up the extension in the kitchen. The modem screams into her ear like a wounded fax machine, the connection dies, and in the ringing silence afterwards the download dialog helpfully displays the file name: MEGA_ARENA_3_DEMO_FULL.ZIP.',
          '"School," says Mom, through the floor. You can hear her not saying anything else for a full minute.',
        ],
      },
      stubborn: {
        speaker: 'narrator',
        text: 'Five more minutes turns into twelve. The download finishes. You feel like a king for almost the entire time it takes her to come up the stairs, stand in your doorway with her arms crossed, and say nothing at all. Aunt Bien, it turns out, was calling about Grandpa\'s birthday.',
      },
      deal_ok: {
        speaker: 'mom',
        text: '"After ten. Dishes. All week. AND you take out the recycling, which is mostly your cans." She writes it on an index card and sticks it to the fridge with the magnet shaped like a lobster. Kim laminates it the next day, unasked, "for posterity."',
      },
      deal_bad: {
        speaker: 'mom',
        text: '"Counter-offer," says Mom, who has done the cannery office\'s books for nineteen years and has negotiated with men far scarier than you. "You get off the phone now, AND you do the dishes all week, because you tried to negotiate with me." You lose the download and the dishes. Somewhere, a bookkeeper is smiling.',
      },
    },
  },

  // ── life_phone_twist ─────────────────────────────────────────────────────
  {
    id: 'life_phone_twist',
    channel: 'dialog',
    title: 'The Line Is Busy',
    start: 'start',
    nodes: {
      start: {
        speaker: 'narrator',
        text: [
          'For once it is you who needs the line. A contract deadline, a board meeting, a file that has to go out tonight. You double-click the dialer and get, instead of the handshake, a busy signal.',
          'Nobody should be on the phone. Dad is asleep in front of the television. Kim is at a friend\'s. You pick up the extension in the hallway and get an earful of a modem, somebody else\'s modem, halfway through something long.',
          'Downstairs, the family computer (the one Kim set up so Mom could "do email like a person") is glowing in the dark kitchen.',
        ],
        choices: [
          {
            text: 'Hang up quietly. Whatever it is, it can have the line.',
            effects: [{ stat: 'mood', add: -2 }, { flag: 'life.mom_application', set: 'sent' }, { npc: 'mom', affinity: 4 }, { faction: 'fac.hood', add: 2 }],
            goto: 'waited',
          },
          {
            text: '"WHO IS ON THE PHONE?" Yank the kitchen cord out of the wall and take the line.',
            goto: 'yanked',
          },
        ],
      },
      waited: {
        speaker: 'mom',
        text: [
          'Twenty minutes later there is a soft knock. Mom, in her reading glasses and the cardigan with the missing button, holding a floppy disk like it\'s a lottery ticket.',
          '"I\'m sorry, I was on the line. The marina office on Harbor Point needs an evening bookkeeper, and the application had to be in by midnight, and Kim showed me how to attach it." She takes a breath. "It went. The little bar went all the way across. Is that good? That\'s good, right?"',
          '"That\'s good, Ma."',
          '"Don\'t tell your father yet. Just in case."',
        ],
      },
      yanked: {
        speaker: 'narrator',
        text: [
          'The kitchen goes dark and quiet. You have the line. You have exactly four seconds of victory before you hear the chair scrape downstairs.',
          'Mom is standing by the family computer, a printed résumé in one hand and a floppy disk in the other. On the screen: CONNECTION LOST. SEND FAILED. It is 11:52.',
          '"The marina office," she says, very calmly, the way she says everything that matters. "Evening bookkeeping. It was due at midnight. Kim showed me how to attach it." She looks at the clock. "Your father doesn\'t know I applied."',
        ],
        choices: [
          {
            text: '"Give me the disk. I can still get it there."',
            tag: '[Networking]',
            check: {
              skill: 'networking',
              dc: 11,
              bonuses: [{ if: { skill: 'programming', gte: 15 }, add: 1, label: '+1 (you know the mail client\'s moods)' }],
              success: 'rescued',
              fail: 'missed',
              successEffects: [{ flag: 'life.mom_application', set: 'sent' }, { npc: 'mom', affinity: -3 }],
              failEffects: [{ flag: 'life.mom_application', set: 'missed' }, { npc: 'mom', affinity: -8 }, { faction: 'fac.hood', add: -5 }, { stat: 'stress', add: 6 }],
            },
          },
          {
            text: '"I didn\'t know. I\'m sorry. I didn\'t know."',
            effects: [{ flag: 'life.mom_application', set: 'missed' }, { npc: 'mom', affinity: -8 }, { faction: 'fac.hood', add: -5 }, { stat: 'mood', add: -8 }],
            goto: 'missed',
          },
        ],
      },
      rescued: {
        speaker: 'narrator',
        text: [
          'You redial with your hands shaking a little. The handshake sings. You attach the file, check the address twice, and hit send at 11:58. The little bar crawls all the way across.',
          'Mom lets out a breath she has been holding since Dad came home from the mill with a cardboard box. "Thank you," she says. And then, not unkindly: "Next time, come downstairs and ask who\'s on the phone."',
        ],
      },
      missed: {
        speaker: 'narrator',
        text: [
          'By the time the line is back it\'s 12:07. The marina office\'s auto-reply says the position is closed to new applicants, have a wonderful evening.',
          'Mom turns off the computer, puts the floppy in the drawer with the takeout menus, and goes to bed without saying goodnight. The next morning she makes you breakfast anyway. She never mentions it again. You will think about it for years.',
        ],
      },
    },
  },
  {
    id: 'life_mom_new_job',
    channel: 'mail',
    title: 'GOOD NEWS (DONT TELL DAD YET)',
    from: 'mom',
    start: 'start',
    nodes: {
      start: {
        text: [
          'Honey,',
          'The marina office called!!! I start Monday, evenings, Tuesday to Friday. It is only bookkeeping for boats but the man said my ledgers were "museum quality" which I think is a compliment.',
          'I am telling your father at dinner. Please act surprised. You are not good at acting surprised so maybe just eat.',
          'Kim says I have to put a signature at the bottom now that I have two jobs so here it is:',
          'Linh Tan\nBookkeeper (x2)',
        ],
        effects: [{ npc: 'mom', affinity: 3 }, { stat: 'mood', add: 5 }],
        choices: [
          { text: 'Reply: "Museum quality. I\'m framing this email."', effects: [{ npc: 'mom', affinity: 2 }] },
          { text: 'Reply: "Proud of you, Ma. I\'ll act SO surprised."', effects: [{ npc: 'mom', affinity: 2 }, { faction: 'fac.hood', add: 1 }] },
        ],
      },
    },
  },

  // ── life_moms_boss ───────────────────────────────────────────────────────
  {
    id: 'life_moms_boss',
    channel: 'dialog',
    title: 'Seven Minutes',
    start: 'start',
    nodes: {
      start: {
        speaker: 'mom',
        text: [
          'Mom has a stack of time cards spread across the kitchen table and the look she gets when a column won\'t add up. Columns always add up for Mom. When they don\'t, somebody is lying.',
          '"Mr. Pruitt put in a new time clock at the cannery office. Very modern. Beeps." She taps a card. "Every punch-out rounds down. Seven minutes. Every shift, every worker on the line. Seven minutes times forty people times five days." She has already done the math. She did it in pen.',
          '"You\'re good with machines. So tell me: is it the machine, or is it him?"',
        ],
        choices: [
          {
            text: '"Let me look at the clock after hours."',
            tag: '[Systems]',
            check: {
              skill: 'systems',
              dc: 12,
              bonuses: [{ if: { background: 'tinkerer' }, add: 2, label: '+2 (you have opened worse things than a time clock)' }],
              success: 'clock_fixed',
              fail: 'clock_8888',
              successEffects: [{ faction: 'fac.hood', add: 6 }, { npc: 'mom', affinity: 4 }, { xp: 'systems', add: 25 }],
              failEffects: [{ faction: 'fac.hood', add: 3 }, { npc: 'mom', affinity: 2 }, { stat: 'stress', add: 2 }],
            },
          },
          {
            text: '"I\'m coming with you tomorrow. We\'ll ask Pruitt together."',
            tag: '[Social]',
            check: {
              skill: 'social',
              dc: 13,
              bonuses: [{ if: { npc: 'mom', affinityGte: 60 }, add: 1, label: '+1 (she has your back, and it shows)' }],
              success: 'confront_ok',
              fail: 'confront_bad',
              successEffects: [{ faction: 'fac.hood', add: 8 }, { npc: 'mom', affinity: 5 }, { stat: 'stress', add: -3 }],
              failEffects: [{ npc: 'mom', affinity: -2 }, { stat: 'stress', add: 6 }, { flag: 'life.mom_written_warning' }, { chance: 0.3, then: [{ complication: 'work' }] }],
            },
          },
          {
            text: '"Quietly copy the clock\'s records and send them to the labor board. No names."',
            tag: '[Intrusion]',
            check: {
              skill: 'intrusion',
              dc: 14,
              success: 'labor_ok',
              fail: 'labor_bad',
              successEffects: [{ stat: 'heat', add: 3 }, { faction: 'fac.hood', add: 10 }, { stat: 'cred', add: 1 }],
              failEffects: [{ stat: 'heat', add: 6 }, { faction: 'fac.hood', add: 4 }, { npc: 'mom', affinity: -4 }, { stat: 'stress', add: 5 }, { flag: 'life.pruitt_watching' }, { chance: 0.3, then: [{ complication: 'work' }] }],
            },
          },
          {
            text: '"Draft a formal complaint. Dates, totals, the statute. Something the union can\'t ignore."',
            req: { skill: 'business', gte: 20 },
            reqText: 'Requires Business 20',
            effects: [{ faction: 'fac.hood', add: 8 }, { npc: 'mom', affinity: 4 }],
            goto: 'complaint',
          },
          {
            text: '"Ma, you\'ll get yourself fired. Let it go."',
            effects: [{ npc: 'mom', affinity: -3 }, { faction: 'fac.hood', add: -2 }],
            goto: 'let_go',
          },
        ],
      },
      clock_fixed: {
        speaker: 'narrator',
        text: [
          'The time clock\'s settings menu is guarded by a four-digit code, and the four-digit code is the year the cannery was founded, which is painted over the door in letters two feet high.',
          'Rounding rule: ALWAYS DOWN, IN FAVOR OF EMPLOYER. You set it to the nearest minute, print the old setting on the clock\'s own little receipt printer, and pin it to the break-room board next to the fire-drill map.',
          'By Friday, forty people have read it. By the following Friday, there is back pay. Mom says nothing about it at dinner except "pass the rice, genius."',
        ],
      },
      clock_8888: {
        speaker: 'narrator',
        text: [
          'The settings menu wants a manager key. You try to coax it. The display blinks, thinks about it, and settles on 88:88, where it stays, forever, like a small digital scream.',
          'Mom laughs so hard she has to hold the counter. Then she takes her own ledger (seven minutes, forty people, five days, in pen) straight to the state labor office on her lunch break. It takes them a month. They find it anyway. "Machines," she says, patting your cheek. "Not always the answer."',
        ],
      },
      confront_ok: {
        speaker: 'narrator',
        text: [
          'Mr. Pruitt is a soft man in a hard tie. You let Mom do the math out loud. You just stand next to her and nod at the right moments, and at the end you mention, very pleasantly, that the labor board has a phone number.',
          'Pruitt blusters. Pruitt says "recalibrate" four times. Two weeks later the clock rounds to the minute and there is a line on everyone\'s pay stub that says ADJUSTMENT. The line workers buy Mom a sheet cake. She brings you a slice.',
        ],
      },
      confront_bad: {
        speaker: 'narrator',
        text: [
          'You talk too fast and too loud. Pruitt stops looking at the time cards and starts looking at Mom. "Linh. I didn\'t realize we had a family problem. Maybe we should discuss your hours."',
          'She walks you out to the parking lot with a hand on your arm, firm as a clamp. "Next time," she says, "let me fight my own boss." She gets a written warning. She fights him anyway, her way, with a ledger and a month of patience, and wins. She doesn\'t bring you cake.',
        ],
      },
      labor_ok: {
        speaker: 'narrator',
        text: [
          'The clock keeps a record of every punch, as honest as the rule it was told to follow. Copying it out is embarrassingly easy. An envelope with no return address lands on the labor board\'s desk on Monday.',
          'The audit comes in March, and the back pay with it. At the cannery they say the envelope came from a disgruntled supervisor. On the Row, over coffee at the Cathode, they say it with a wink.',
        ],
      },
      labor_bad: {
        speaker: 'narrator',
        text: [
          'The clock\'s records come out garbled: half the punches duplicated, a column of dates from 1970. You send it anyway. The labor board audits. The audit works.',
          'But the envelope carried a detail only somebody in the office could know, and Pruitt knows exactly who does the books. He can\'t prove anything. He just watches Mom now. She takes the bus home a different way for a month, and she asks you, very quietly, what exactly you did.',
        ],
      },
      complaint: {
        speaker: 'narrator',
        text: 'Four pages, single-spaced: every shift, every stolen seven minutes, the total to the cent, and the paragraph of labor code it violates, quoted in full. The union rep reads it in the break room with his reading glasses on his forehead and says, "Who wrote this, a lawyer?" Mom says, "My kid." The back pay comes in six weeks.',
      },
      let_go: {
        speaker: 'mom',
        text: '"Let it go." She gathers the time cards into a neat stack, squaring the corners against the table, the way she does when she\'s done talking. "Forty people, seven minutes. That\'s somebody\'s bus fare. That\'s somebody\'s kid\'s shoes." She goes to fight it alone. She wins, eventually. She doesn\'t ask you for help with anything for a while.',
      },
    },
  },

  // ── life_family_finds_gear ───────────────────────────────────────────────
  {
    id: 'life_family_finds_gear',
    channel: 'dialog',
    title: 'The Kitchen Table',
    start: 'start',
    nodes: {
      start: {
        speaker: 'narrator',
        text: [
          'You come home and every light in the flat is on. On the kitchen table, laid out like evidence at a trial, is your life: the shoebox of burned discs with the labels in shorthand, the notebook of handles, the pager that is not the pager they bought you, a printout you should have shredded weeks ago.',
          'Mom sits on one side of the table. Dad stands behind her with his hand on her chair. Nobody is eating.',
          { if: around('kim'), text: 'Kim is in the doorway to the hall in her pajamas, pretending very hard to be getting a glass of water.' },
          '"A man came by," says Dad. "Nice suit. Asked if you still lived here. Said it was about a job." He lets that sit. "It wasn\'t about a job."',
        ],
        choices: [
          {
            text: '"I\'ll tell you the truth. Most of it."',
            tag: '[Social]',
            check: {
              skill: 'social',
              dc: 14,
              bonuses: [
                { if: { npc: 'mom', affinityGte: 60 }, add: 2, label: '+2 (she wants to believe you)' },
                { if: { npc: 'dad', affinityGte: 60 }, add: 1, label: '+1 (Dad has been waiting for you to talk to him)' },
              ],
              success: 'shield',
              fail: 'frightened',
              successEffects: [{ flag: 'life.family_shield' }, { npc: 'mom', affinity: 4 }, { npc: 'dad', affinity: 2 }, { stat: 'stress', add: -5 }],
              failEffects: [{ flag: 'life.family_may_report' }, { npc: 'mom', affinity: -4 }, { npc: 'dad', affinity: -4 }, { stat: 'stress', add: 8 }],
            },
          },
          {
            text: '"It\'s for a security course. At LSU. It\'s homework."',
            tag: '[Lie]',
            check: {
              skill: 'social',
              dc: 16,
              bonuses: [{ if: { enrolled: true }, add: 4, label: '+4 (you really are enrolled, which helps the lie)' }],
              success: 'lie_holds',
              fail: 'lie_breaks',
              successEffects: [{ stat: 'stress', add: 4 }],
              failEffects: [{ flag: 'life.family_may_report' }, { npc: 'mom', affinity: -6 }, { stat: 'stress', add: 6 }],
            },
          },
          {
            text: 'Look at Kim.',
            if: close('kim', 50),
            effects: [{ flag: 'life.family_shield' }, { npc: 'kim', affinity: 3 }, { npc: 'mom', affinity: 1 }],
            goto: 'kim',
          },
          {
            text: 'Say nothing. Pack it all up and move it out tonight.',
            tag: '[OpSec]',
            check: {
              skill: 'opsec',
              dc: 13,
              bonuses: [{ if: { trait: 'paranoid' }, add: 2, label: '+2 (you already had a plan for this)' }],
              success: 'moved_ok',
              fail: 'moved_seen',
              successEffects: [{ stat: 'heat', add: -5 }, { npc: 'mom', affinity: -2 }],
              failEffects: [{ faction: 'fac.hood', add: -3 }, { stat: 'heat', add: 4 }, { npc: 'mom', affinity: -2 }, { chance: 0.3, then: [{ complication: 'social' }] }],
            },
          },
        ],
      },
      shield: {
        speaker: 'mom',
        text: [
          'You tell them. Not the names, not the numbers, but the shape of it: what you do, why it pays, why a man in a nice suit might come asking. Dad sits down halfway through. Mom never looks away.',
          'When you\'re done she folds her hands. "Here is what happens," she says. "If anyone comes to this door asking about you, you were here. Doing homework. Eating my soup. You have been eating my soup every night of your life."',
          '"Linh," says Dad.',
          '"Every night," says Mom. "Now eat. You look like a dropped call." She got that one from Sal. She has been waiting years to use it.',
        ],
      },
      frightened: {
        speaker: 'dad',
        text: [
          'The truth comes out wrong: too fast, too proud, the names of things they have only ever heard on the news. Mom goes pale. Dad goes very quiet, which is worse.',
          '"Twenty years I worked the line," he says finally. "Never took a pencil home that wasn\'t mine." He puts his hand flat on the notebook. "If the police come to this door, I won\'t lie to them. I won\'t. Don\'t make me choose between you and that."',
          'Nobody sleeps much that night. In the morning the notebook is gone from the table, and Dad\'s jacket is on the hook with a detective\'s business card sticking out of the pocket — the nice suit left one, it turns out. Dad didn\'t throw it away.',
        ],
      },
      lie_holds: {
        speaker: 'narrator',
        text: 'You explain the syllabus of a course that does not exist in the calm voice of somebody reading it off a brochure. Dad nods along. Mom watches your hands. Eventually she sighs, "Homework," and puts the kettle on, and you realize she has decided to believe you, which is different from believing you. The man in the suit does not come back. Not yet.',
      },
      lie_breaks: {
        speaker: 'mom',
        text: [
          '"Which course," says Mom.',
          'You name one. She gets up, goes to the drawer with the takeout menus, and comes back with the LSU continuing-ed catalogue she has been keeping in case you ever wanted to go back to school. She turns the pages slowly. The course isn\'t there.',
          '"If they come back," she says, "I will not stand in front of this door for a lie." She means it. You can see it cost her something to mean it.',
        ],
      },
      kim: {
        speaker: 'kim',
        text: [
          'Kim rolls her eyes so hard it\'s almost audible. "Oh my God. It\'s the board. It\'s a computer club. Half the kids in my class have a pager. Mrs. Alvarez has a pager. You guys think everything is the mafia."',
          'She says it with such withering fourteen-going-on-forty contempt that Dad actually laughs, and the room breaks open. Mom looks at you for a long time. "If anyone comes asking," she says slowly, "you were here." It isn\'t a question.',
          'Later, in the hall, Kim holds out her hand. "That was worth at least four CDs," she whispers. "Burned. With printed labels."',
        ],
      },
      moved_ok: {
        speaker: 'narrator',
        text: 'You don\'t argue. You don\'t explain. You pack the shoebox, the notebook and the pager into a gym bag and walk it to a storage unit on Sodium Row that you pay for in cash. When you come home at 3 a.m. the kitchen light is still on and your plate is in the oven, covered in foil. Nobody asks. The silence in the flat has a new texture, and it lasts for weeks.',
      },
      moved_seen: {
        speaker: 'narrator',
        text: 'Carrying boxes down Cannery Row at two in the morning is not, it turns out, invisible. Grandma Ruth sees you from her window. By breakfast, half the Row has heard that the Tan kid was moving "equipment" out in the middle of the night, and by lunch the story involves a van. Mom hears it at the laundromat. She doesn\'t say a word to you about it, which says plenty.',
      },
    },
  },

  // ── life_aunt_chain_letter (and friends) ─────────────────────────────────
  {
    id: 'life_chain_angels',
    channel: 'mail',
    title: 'FW: FW: FW: FW: an ANGEL is watching you!!!',
    from: 'Aunt Bien',
    start: 'start',
    nodes: {
      start: {
        text: [
          '>>>> THIS ANGEL HAS BEEN SENT TO YOU FOR GOOD LUCK. IT HAS BEEN AROUND THE WORLD 9 TIMES.',
          '>>>> Forward to 10 people in 10 minutes and something WONDERFUL will happen to you. A man in Ridgeport did not forward it and his car made a noise.',
          '>>>>',
          '>>>>        *   (\\ /)   *\n>>>>          ( o.o )\n>>>>         o(")(")o',
          '(I think the angel is a bunny, the picture did not come out right. Still counts!!)',
          'Love you honey, tell your mother I said the thing about the rice was a JOKE',
          'Auntie Bien :-) :-) :-)',
        ],
        choices: [
          { text: 'Forward it to Jax with the subject line "your car is making a noise".', effects: [{ npc: 'jax', affinity: 1 }, { stat: 'mood', add: 3 }] },
          { text: 'Reply: "Thanks Auntie! Got my luck. Also that\'s a bunny."', effects: [{ faction: 'fac.hood', add: 1 }, { stat: 'mood', add: 2 }] },
          { text: 'Delete it. Brave. Reckless. You hear a car make a noise outside.', effects: [{ stat: 'mood', add: 1 }] },
        ],
      },
    },
  },
  {
    id: 'life_aunt_chain_letter',
    channel: 'mail',
    title: 'FW: FW: NorthLink LOYALTY REWARD - 100 FREE HOURS!!!',
    from: 'Aunt Bien',
    start: 'start',
    nodes: {
      start: {
        text: [
          'Honey this one is REAL, my friend Loan at church already got hers!!! You just reply with your login and password and they add the hours. I did mine already!!! Tell your mother.',
          '>> Dear Valued NorthLink Member,',
          '>> As a thank-you for your loyalty, NorthLink is awarding 100 FREE HOURS of internet access! To confirm your account, simply reply to this message with your username and password. Offer expires in 48 hours. Thank you for choosing NorthLink - "Your City, Connected."',
          'Love, Auntie Bien :-) :-) :-)',
          'The logo is a fuzzy scan. The reply-to address isn\'t NorthLink\'s. And the mail headers, if you squint at them, route somewhere in Millgate.',
          { if: { flag: 'a1.grandma_done' }, text: 'Somewhere in Millgate that you have seen once before, on Ruth Alvarez\'s infected PC, phoning home every night at 3:12 a.m.' },
        ],
        choices: [
          {
            text: 'Follow the headers back and see where the "confirmations" actually go.',
            tag: '[Networking]',
            check: {
              skill: 'networking',
              dc: 13,
              bonuses: [{ if: { flag: 'a1.grandma_done' }, add: 2, label: '+2 (you recognize the address block)' }],
              success: 'traced',
              fail: 'cold',
              successEffects: [{ flag: 'life.chain_traced' }, { var: 'evidence_fragments', add: 1 }, { var: 'w.exposure', add: 1 }, { faction: 'fac.hood', add: 2 }],
              failEffects: [{ faction: 'fac.hood', add: 2 }, { stat: 'stress', add: 2 }, { chance: 0.3, then: [{ complication: 'hack' }] }],
            },
          },
          {
            text: 'Reply-all to the whole family: "DO NOT REPLY WITH YOUR PASSWORD. THIS IS A SCAM."',
            effects: [{ faction: 'fac.hood', add: 3 }, { npc: 'mom', affinity: 2 }],
            goto: 'reply_all',
          },
          {
            text: 'Forward it to Corvid without comment.',
            if: { npc: 'corvid', met: true },
            effects: [{ faction: 'fac.loft', add: 2 }, { npc: 'corvid', affinity: 2 }],
            goto: 'corvid',
          },
          {
            text: 'Ignore it. It\'s Aunt Bien. It\'s always something.',
            effects: [{ faction: 'fac.hood', add: -1 }],
            goto: 'ignored',
          },
        ],
      },
      traced: {
        text: [
          'The "confirmations" don\'t go to NorthLink. They go to a mail drop registered to Lumen Consumer Insight Partners, which is a subsidiary of Harborline Data Holdings, which shares a Millgate street address, a fax number and, according to a dusty business filing, two directors with Aperture Data Solutions.',
          'A dull little data company, collecting the passwords of church ladies. You save everything: the headers, the filings, the fuzzy logo. It isn\'t proof of anything yet. It is a thread.',
          'You also call Aunt Bien and walk her through changing her password, twice, because the first time she types it into the search box.',
        ],
      },
      cold: {
        text: [
          'The trail goes through a relay that throws away its logs, and your careful little map dissolves into a question mark somewhere under the Millgate overpass. Whoever built this was careful.',
          'You do manage the important part: you call Aunt Bien and get her password changed before anybody uses it. She tells everyone at church you are a genius. Several of them call you about their printers.',
        ],
      },
      reply_all: {
        text: [
          'Your reply-all goes out to forty-three relatives on four continents. Aunt Bien replies-all back, hurt, then replies-all again an hour later, grateful, then replies-all a third time to ask how to change a password.',
          'Uncle Danh replies-all to ask if anyone is interested in a water-filter business opportunity. Mom calls you to say she is proud of you and also please stop the emails.',
        ],
      },
      corvid: {
        speaker: 'corvid',
        text: 'Corvid replies an hour later, one line: "Keep this. It\'ll matter. And tell your aunt to change her password." You do both.',
      },
      ignored: {
        text: 'Two weeks later Aunt Bien\'s email account starts sending everyone in her address book a link to cheap watches. Mom asks you to "fix Bien\'s computer." It takes a whole Sunday, and there are no free hours at the end of it.',
      },
    },
  },
  {
    id: 'life_chain_modem',
    channel: 'mail',
    title: 'FW: FW: FW: FW: FW: IMPORTANT VIRUS WARNING!!!!! READ NOW',
    from: 'Aunt Bien',
    start: 'start',
    nodes: {
      start: {
        text: [
          '>>>>> WARNING!!! If you receive an email called "A GIFT FOR YOU" DO NOT OPEN IT!!! It will ERASE YOUR HARD DRIVE and ALSO your MODEM and possibly your FAX. NorthLink announced this on the radio!!!',
          '>>>>> Forward this to EVERYONE you know!!!',
          'Honey is this true?? Should I unplug the computer? I unplugged the computer. I am writing this from the library.',
          'Auntie Bien :-) :-)',
        ],
        choices: [
          {
            text: 'Reply: "It\'s a hoax, Auntie. Plug it back in. The fax is safe."',
            effects: [{ faction: 'fac.hood', add: 1 }, { stat: 'mood', add: 2 }],
            goto: 'calm',
          },
          {
            text: 'Walk over and plug it back in yourself. Stay for dinner.',
            effects: [{ faction: 'fac.hood', add: 2 }, { stat: 'stress', add: -4 }, { stat: 'energy', add: -5 }],
            goto: 'dinner',
          },
        ],
      },
      calm: {
        text: 'She writes back from the library: "OK!!! Plugging it in. If it erases I am blaming you :-)". It does not erase. She forwards your reply to forty-three relatives under the subject line "FW: MY NEPHEW SAYS ITS FINE".',
      },
      dinner: {
        text: 'The computer is unplugged, the modem is unplugged, the fax is unplugged, and for good measure so is the toaster. You plug everything back in. She feeds you three kinds of spring rolls and asks, again, when you are getting married. The fax, for the record, is fine.',
      },
    },
  },
  {
    id: 'life_chain_soup',
    channel: 'mail',
    title: 'FW: Chicken soup for the modem soul',
    from: 'Aunt Bien',
    start: 'start',
    nodes: {
      start: {
        text: [
          '>>> A little boy asked his grandfather, "Why is the internet so slow?" And the grandfather said, "Because love takes time to download." <<<',
          '>>> Send this to someone you have not talked to in a while. They are waiting to hear from you. <<<',
          'This one made me cry a little. Call your mother.',
          'Auntie Bien',
        ],
        choices: [
          {
            text: 'Actually call Mom.',
            if: momHere,
            effects: [{ npc: 'mom', affinity: 3 }, { stat: 'stress', add: -3 }],
            goto: 'called',
          },
          {
            text: 'Send it to someone you haven\'t talked to in a while.',
            effects: [{ stat: 'mood', add: 3 }],
            goto: 'sent',
          },
          { text: 'Roll your eyes. Save it anyway, in a folder called KEEP.', effects: [{ stat: 'mood', add: 2 }] },
        ],
      },
      called: {
        speaker: 'mom',
        text: '"Bien sent you the soup one? She sent me the soup one." A pause. "I\'m glad you called anyway." You talk for forty minutes about nothing. It is the best forty minutes of your week.',
      },
      sent: {
        text: 'You pick a name from the bottom of your address book and hit forward before you can think about it. Three days later a reply arrives: "ha. i was literally just thinking about you. how ARE you?" The internet is slow. Some things download anyway.',
      },
    },
  },

  // ── life_dads_resume ─────────────────────────────────────────────────────
  {
    id: 'life_dads_resume',
    channel: 'dialog',
    title: 'Former Mill Employees Encouraged to Apply',
    start: 'start',
    nodes: {
      start: {
        speaker: 'dad',
        text: [
          'Dad has a printout on the table, smoothed flat with the side of his hand so many times the ink has gone soft. FACILITIES TECHNICIAN, MILLGATE DATA CAMPUS. FORMER PORT LUMEN PAPER EMPLOYEES ENCOURAGED TO APPLY.',
          { if: momGone, text: 'The kitchen is too clean. It has been too clean since Mom. Dad keeps it that way like a promise he made to someone who can\'t check.' },
          '"Same building," he says. "Same floor, even. They kept the old crane rails in the ceiling. For character." He laughs, not much. "They want someone who knows the building. Nobody knows that building like I do."',
          { if: { quest: 'fac_hood_q2_dad', status: 'completed' }, text: '"And I can fix a PC now. You taught me. They want that too, it says so right here."' },
          '"I need a résumé. The last one I wrote was on a typewriter. Help your old man out?"',
          { if: { flag: 'a3.truth_t1' }, text: 'You know what runs through that building now. You know whose trunk line is bolted to the old crane rails. He doesn\'t.' },
        ],
        choices: [
          {
            text: '"Let\'s make you sound like the best hire they\'ll ever make."',
            tag: '[Business]',
            check: {
              skill: 'business',
              dc: 13,
              success: 'resume_great',
              fail: 'resume_stiff',
              successEffects: [{ flag: 'npc.dad.mill_job' }, { npc: 'dad', affinity: 8 }, { stat: 'mood', add: 3 }],
              failEffects: [{ flag: 'npc.dad.mill_job' }, { flag: 'life.dad_night_security' }, { npc: 'dad', affinity: 3 }],
            },
          },
          {
            text: '"Forget the paper. I\'ll coach you for the interview."',
            tag: '[Social]',
            check: {
              skill: 'social',
              dc: 12,
              success: 'coach_ok',
              fail: 'coach_ramble',
              successEffects: [{ flag: 'npc.dad.mill_job' }, { npc: 'dad', affinity: 6 }],
              failEffects: [{ flag: 'npc.dad.mill_job' }, { npc: 'dad', affinity: 2 }, { stat: 'stress', add: 2 }],
            },
          },
          {
            text: '"Dad. Don\'t. That building isn\'t what they say it is."',
            tag: '[Social]',
            if: { flag: 'a3.truth_t1' },
            check: {
              skill: 'social',
              dc: 15,
              bonuses: [{ if: { npc: 'dad', affinityGte: 50 }, add: 2, label: '+2 (he trusts you)' }],
              success: 'talked_out',
              fail: 'applies_alone',
              successEffects: [{ flag: 'life.dad_declined_mill' }, { npc: 'dad', affinity: 4 }],
              failEffects: [{ flag: 'npc.dad.mill_job' }, { flag: 'life.dad_applied_alone' }, { npc: 'dad', affinity: -6 }, { stat: 'mood', add: -4 }],
            },
          },
          {
            text: '"You don\'t need them, Dad. The Row needs you."',
            req: { quest: 'fac_hood_q2_dad', status: 'completed' },
            reqText: 'Requires: Dad\'s Comeback completed',
            effects: [{ flag: 'life.dad_declined_mill' }, { npc: 'dad', affinity: 6 }, { faction: 'fac.hood', add: 3 }],
            goto: 'row_needs_you',
          },
          {
            text: '"Let me mail it for you." Then don\'t.',
            tag: '[Lie]',
            effects: [{ flag: 'life.dad_resume_lost' }, { npc: 'dad', affinity: -2 }, { stat: 'mood', add: -4 }],
            goto: 'lost',
          },
        ],
      },
      resume_great: {
        speaker: 'narrator',
        text: [
          'You turn "fixed stuff for twenty years" into a page that could make a hiring manager weep: MAINTAINED CONTINUOUS OPERATION OF A 24/7 INDUSTRIAL LINE. REDUCED UNPLANNED DOWNTIME. INTIMATE KNOWLEDGE OF SITE ELECTRICAL AND STRUCTURE. All true. Every word.',
          'Dad reads it three times. "Is this me?" he asks. "This guy sounds like he knows what he\'s doing." They call him back in four days. He starts the Monday after, in a grey polo shirt with a lanyard, walking the floor he walked for twenty years, between machines that hum instead of roar.',
        ],
      },
      resume_stiff: {
        speaker: 'narrator',
        text: [
          'The résumé comes out stiff as cardboard: dates, duties, a section titled OBJECTIVE that says "to work." Dad thanks you like you built him a house.',
          'They hire him anyway. Not as a technician: as night-shift floor security, walking the building with a flashlight from ten to six. "It\'s a start," he says. "I know where every door is." He starts on a Monday.',
        ],
      },
      coach_ok: {
        speaker: 'narrator',
        text: 'You run practice questions at the kitchen table until he stops answering "I just fix it" and starts answering with stories: the night the dryer section caught fire and he had it running again by dawn; the year he rewired the loading dock with parts from his own garage. They hire him on the spot. The manager used to deliver newspapers to the mill gate when he was a kid. He remembers Dad\'s thermos.',
      },
      coach_ramble: {
        speaker: 'narrator',
        text: 'In the actual interview he forgets everything you practiced and talks for twenty minutes about the old number-four paper machine, lovingly, in detail, like a man describing a horse he had to put down. They hire him anyway. The interviewer\'s father worked the number-four machine too.',
      },
      talked_out: {
        speaker: 'dad',
        text: [
          'You don\'t tell him everything. You tell him enough: whose money built the campus, what the new trunk line carries, who reads it.',
          'He listens with his hands flat on the table. Then he folds the printout in half, and in half again, and puts it in his shirt pocket, next to his reading glasses. "Twenty years that building took from me," he says. "It doesn\'t get the rest." He makes coffee. He doesn\'t mention it again, but he keeps the folded paper in his pocket for a month, like a stone.',
        ],
      },
      applies_alone: {
        speaker: 'dad',
        text: [
          'It comes out wrong. He hears "you\'re too old," "you\'re not good enough," "they don\'t want you." Every word you say about the building, he hears about himself.',
          '"I kept this family fed for twenty years in that building," he says, standing up. "I think I can manage a few computers." He writes the résumé himself, on the library\'s computer, with one finger. They hire him. He doesn\'t tell you his start date. Mom\'s old friend at the laundromat does.',
        ],
      },
      row_needs_you: {
        speaker: 'dad',
        text: [
          '"Mrs. Alvarez called me twice this week," he admits. "Her screen went blue. Then her other screen went blue." He looks at the printout. "The Quinteros want their kid\'s computer fixed before school starts. The church wants a whole network, whatever that is."',
          'He crumples the posting into a ball and makes a very bad shot at the wastebasket. "Robert Tan," he says. "PC Doctor. Makes house calls." He pauses. "Charges in casseroles."',
        ],
      },
      lost: {
        speaker: 'narrator',
        text: [
          'You take the envelope. You tell him it went out. It goes in the bottom drawer of your desk instead, with the other things you don\'t look at.',
          'He waits for a call for three weeks. He checks the answering machine every time he comes in. At the end of the third week he says, to nobody, "Guess they wanted somebody younger," and goes to bed early. It works. He is safe from that building. You did that. You tell yourself that\'s what you did.',
        ],
      },
    },
  },
  // ── life_family_report_knock — the fail branch of the kitchen table comes due ──
  {
    id: 'life_family_report_knock',
    channel: 'dialog',
    title: 'Dad Keeps His Word',
    start: 'start',
    nodes: {
      start: {
        speaker: 'dad',
        text: [
          'Dad calls and asks you to come by. Not "stop by when you can." Come by. He is at the kitchen table when you arrive, in his good shirt, with the detective\'s card squared to the edge of the placemat.',
          { if: momHere, text: 'Mom is at the stove with her back to both of you, stirring something that does not need stirring.' },
          '"He came back," Dad says. "Tuesday. Asked if I knew what you do on the computer." He turns the card a quarter turn. "I told you I wouldn\'t lie to them. I didn\'t. I said there were things on this table I didn\'t understand. I said I didn\'t know where they went." He looks at you. "That\'s the truth. It\'s all the truth I had, because you didn\'t give me any more."',
          '"He wants to talk again. Friday. He asked if you\'d be here."',
        ],
        choices: [
          {
            text: '"You did what you said you\'d do, Dad. I\'m not angry. I\'ll handle Friday."',
            effects: [{ npc: 'dad', affinity: 5 }, { stat: 'heat', add: 8 }, { flag: 'life.dad_gave_statement' }, { complication: 'legal' }],
            goto: 'handled',
          },
          {
            text: '"Let\'s call him back together. Tonight. Let me tell him the boring version — with you in the room, so you know it\'s true."',
            tag: '[Social]',
            check: {
              skill: 'social',
              dc: 15,
              bonuses: [{ if: { npc: 'dad', affinityGte: 50 }, add: 2, label: '+2 (he wants this to be okay)' }],
              success: 'together',
              fail: 'together_bad',
              successEffects: [{ npc: 'dad', affinity: 8 }, { stat: 'heat', add: -4 }, { clearFlag: 'life.family_may_report' }, { flag: 'life.family_shield' }],
              failEffects: [{ npc: 'dad', affinity: -4 }, { stat: 'heat', add: 12 }, { flag: 'life.dad_gave_statement' }, { complication: 'legal' }],
            },
          },
          {
            text: '"Don\'t talk to him again without a lawyer. I\'ll pay for one. Today."',
            tag: '[Pay $600]',
            req: { stat: 'money', gte: 600 },
            reqText: 'Requires $600',
            effects: [{ money: -600 }, { stat: 'heat', add: 2 }, { npc: 'dad', affinity: -2 }],
            goto: 'lawyer',
          },
        ],
      },
      handled: {
        speaker: 'narrator',
        text: [
          'Friday you sit across from a tired man in a good suit at your parents\' kitchen table and say as little as the law allows. He writes down all of it. He writes down, you notice, that your father offered him coffee and you did not.',
          'Dad walks him to the door. When he comes back he puts his hand on your shoulder, once, heavy, the way he did when you were small and had done something brave and stupid in the same breath. "I didn\'t lie," he says. "Now you know I won\'t. Be the kind of kid I don\'t have to."',
        ],
      },
      together: {
        speaker: 'narrator',
        text: [
          'You dial. You put it on speaker. You give the detective the most boring true story ever told in Cannery Row — contract IT, bad hours, a pager because clients panic at midnight — and you let Dad hear every word of it, and you watch him decide it is enough.',
          '"My son works too much," Dad says into the phone, at the end, gruff. "That\'s the crime. You want to arrest him for that, get in line behind his mother." The detective laughs despite himself. He doesn\'t come Friday. Dad throws the card away in front of you, which is its own kind of speech.',
        ],
      },
      together_bad: {
        speaker: 'narrator',
        text: [
          'The detective lets you talk. That\'s the trick, you realize too late: he lets you talk, and you fill the silence, and every boring true thing has a date attached that he already has in a folder. Dad listens to you stumble over a date and goes grey.',
          'After you hang up he sits for a long time. "He knew that already," he says. "The thing you said about March. He knew it and you said it anyway." He doesn\'t say anything else. Friday, the detective comes anyway, and this time he asks Dad the questions, and Dad — who does not lie — answers every one.',
        ],
      },
      lawyer: {
        speaker: 'narrator',
        text: [
          'The lawyer is a woman from the Hill with a voice like a closing door. She calls the detective before you are back on the bus. Friday nobody comes. The following Friday nobody comes either.',
          'Dad is quiet about it for a week. "A lawyer," he says finally, over dinner, like the word tastes of pennies. "For a man who never took a pencil home." He eats his soup. He doesn\'t throw the card away. He puts it in the drawer with the takeout menus, which is where this family keeps the things it hasn\'t decided about.',
        ],
      },
    },
  },
]

// ════════════════════════════════════════════════════════════════════════════
// Triggers
// ════════════════════════════════════════════════════════════════════════════

const triggers: TriggerDef[] = [
  {
    id: 'life_get_off_the_phone',
    when: {
      all: [
        atParents,
        momHere,
        onDialup,
        actLte(2),
        free,
        { day: true, gte: 5 },
        // Once there's a laminated deal on the fridge, it happens far less often.
        { any: [{ not: { flag: 'life.phone_deal' } }, { chance: 0.35 }] },
      ],
    },
    once: false,
    cooldownDays: 21,
    atHour: 21,
    chance: 0.14,
    effects: [
      QUIET_RESET,
      {
        if: phoneTwistReady,
        then: [{ flag: 'life.phone_twist' }, { scene: 'life_phone_twist' }],
        else: [{ scene: 'life_get_off_the_phone' }],
      },
    ],
  },
  {
    id: 'life_mom_new_job',
    when: { all: [{ flag: 'life.mom_application', eq: 'sent' }, momHere] },
    atHour: 18,
    chance: 0.08,
    effects: [QUIET_RESET, { scene: 'life_mom_new_job' }],
  },
  {
    id: 'life_moms_boss',
    when: { all: [momHere, actLte(2), free, { day: true, gte: 45 }] },
    atHour: 19,
    chance: 0.05,
    effects: [QUIET_RESET, { scene: 'life_moms_boss' }],
  },
  {
    id: 'life_family_finds_gear',
    when: { all: [{ stat: 'heat', gte: 40 }, atParents, momHere, actGte(2), actLte(3), free] },
    atHour: 19,
    effects: [QUIET_RESET, { scene: 'life_family_finds_gear' }],
  },
  {
    id: 'life_aunt_chain_letter',
    when: { all: [actLte(2), { day: true, gte: 20 }, { var: 'life.chain_count', lte: 3 }] },
    once: false,
    cooldownDays: 45,
    atHour: 9,
    chance: 0.08,
    effects: [
      QUIET_RESET,
      { var: 'life.chain_count', add: 1 },
      {
        if: { var: 'life.chain_count', eq: 1 },
        then: [{ scene: 'life_chain_angels' }],
        else: [
          {
            if: { var: 'life.chain_count', eq: 2 },
            then: [{ scene: 'life_aunt_chain_letter' }],
            else: [{ if: { var: 'life.chain_count', eq: 3 }, then: [{ scene: 'life_chain_modem' }], else: [{ scene: 'life_chain_soup' }] }],
          },
        ],
      },
    ],
  },
  {
    id: 'life_dads_resume',
    when: {
      all: [
        { npc: 'dad', met: true },
        { var: 'w.datacenter_open', eq: 1 },
        around('dad'),
        free,
        { not: { flag: 'npc.dad.mill_job' } },
      ],
    },
    atHour: 18,
    chance: 0.06,
    effects: [QUIET_RESET, { scene: 'life_dads_resume' }],
  },
  {
    id: 'life_family_report_knock',
    when: { all: [{ flag: 'life.family_may_report' }, { stat: 'heat', gte: 45 }, around('dad'), free, { day: true, gte: 60 }] },
    atHour: 19,
    chance: 0.04,
    effects: [QUIET_RESET, { scene: 'life_family_report_knock' }],
  },
]

export default defineContent({ scenes, triggers })
