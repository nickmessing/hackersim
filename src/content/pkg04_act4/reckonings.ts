/**
 * PKG-04 — the Act IV reckoning scenes delivered by `main_a4_q1_reckonings`.
 *
 * Each scene sets its `a4.reck.<who>` flag at a terminal node so the quest can advance. A few
 * reckonings write steering flags the §4.6 table reads (`a4.jax_backroom_yes`, `a4.mira_stays`/
 * `a4.mira_goes`, `a4.kim_restored`/`a4.kim_steered`/`a4.kim_blessed`) — these are the only fate
 * inputs the endgame itself contributes, and each is a real, offered choice.
 *
 * Fail branches (REDESIGN_V2 §D): a failed Kim restore sends `a4_kim_way_out` (pay, a hard Opsec
 * scrub that can turn her into `follows_in`, or leave her waiting: `a4.kim_left_waiting`, read on the
 * last day); a failed "stay" costs Mira and a long debuff, and leaves her parting cipher
 * (`a4.mira_napkin`, +1 in the frame room); a failed Corvid plea shuts her door
 * (`a4.corvid_shut_door`: no Corvid bonus at the copper, and −1 on the grand check); a failed Oracle
 * question leaves only a rough map (`a4.oracle_rough_map`, −1 on the breach); a failed truth with
 * Grace leaves `a4.grace_half_truth` for the last day and the epilogue (marks.ts).
 *
 * Voice, per §4: Jax loud and loyal; Mira quiet and devastating; Priya short surgical sentences; the
 * family warm and sharp; the Oracle a whisper. Reactivity comes from conditional `TextPart`s on
 * fates, world state and past choices.
 */
import { defineContent } from '@/engine/registry'
import type { Cond } from '@/engine/types'
import { all, any, fate, flag, not } from './shared'

const done = (who: string): { flag: string }[] => [{ flag: `a4.reck.${who}` }]

const jaxDead: Cond = fate('jax', 'dead')
const jaxArrested: Cond = fate('jax', 'arrested')
const jaxFlipped: Cond = fate('jax', 'flipped')

export default defineContent({
  scenes: [
    // ── Jax ────────────────────────────────────────────────────────────────
    {
      id: 'a4_reck_jax',
      channel: 'dialog',
      title: 'Jax',
      from: 'jax',
      start: 'open',
      nodes: {
        open: {
          speaker: 'narrator',
          text: [
            { if: jaxDead, text: 'The hill above the Row. Somebody keeps the grass short; you have never caught them at it. You brought two coffees out of habit and set one down on the stone.' },
            { if: all(jaxArrested, not(jaxDead)), text: 'Visiting hours at the county facility. Jax on the other side of a scratched acrylic panel, phone handset that smells of every hand before yours. He looks older. He looks like his dad.' },
            { if: all(jaxFlipped, not(jaxDead), not(jaxArrested)), text: 'The Cathode, the back booth, your initials still under the table. Jax got there first and ordered for both of you. He does not quite meet your eye.' },
            { if: all(not(jaxDead), not(jaxArrested), not(jaxFlipped)), text: 'The Cathode, the back booth, your initials under the table. Jax slides in across from you with two coffees and the grin he has had since sixth grade, when he traded you half a cassette player for a whole bike.' },
            { if: all({ npc: 'jax', affinityLte: 10 }, not(jaxDead), not(jaxArrested)), text: 'It took three pages before he answered, and his coffee is already half gone, like he wanted a reason to leave early. You used to finish each other\'s sentences. Now you both wait politely for the other one to start.' },
          ],
          next: 'talk',
        },
        talk: {
          speaker: 'jax',
          text: [
            { if: jaxDead, text: '(You do most of the talking. He was always better at that, but you have had more practice at the silences.)' },
            { if: fate('jax', 'backroom_partner'), text: 'Remember when the scariest thing in the world was your mom picking up the phone mid-download? Look at us. We run a place. We have a coffee budget. I have OPINIONS about the coffee budget.' },
            { if: all(jaxArrested, not(jaxDead)), text: 'Eighteen months. I do the math on the wall, like a cartoon. Rosa visits Sundays. Ma still won\'t. You look terrible, by the way. Are you sleeping? Don\'t answer, I know you\'re not.' },
            { if: all(jaxFlipped, not(jaxDead), not(jaxArrested)), text: 'I gave them a name to save my own. You know that. Everybody knows that. I keep waiting for you to say it out loud so we can be done, and you never do, and somehow that\'s worse.' },
            { if: all(not(jaxDead), not(jaxArrested), not(jaxFlipped), not(fate('jax', 'backroom_partner'))), text: 'You did all right, you know. For a kid who bricked his first crack in front of the whole board. I covered for you that night and I\'d do it again, but between us? It was really bad.' },
          ],
          choices: [
            {
              text: 'Say the thing you have both been avoiding.',
              if: all(jaxFlipped, not(jaxDead), not(jaxArrested)),
              effects: [{ npc: 'jax', affinity: 8 }, { stat: 'mood', add: 4 }],
              goto: 'flipped_absolution',
            },
            {
              text: '"Run the back room with me. For real. Door always open, kids stay honest."',
              if: all(fate('jax', ['free', 'normal']), { npc: 'jax', affinityGte: 55 }, { var: 'w.cathode_open', eq: 1 }, not(jaxDead)),
              effects: [{ flag: 'a4.jax_backroom_yes' }, { flag: 'npc.sal.base' }, { npc: 'jax', affinity: 6, fate: 'backroom_partner' }, { stat: 'mood', add: 8 }],
              goto: 'backroom_yes',
            },
            {
              text: '[Social] Make him laugh, one more time, the way you used to.',
              if: not(jaxDead),
              check: {
                skill: 'social',
                dc: 12,
                success: 'laugh',
                fail: 'no_laugh',
                successEffects: [{ npc: 'jax', affinity: 5 }, { stat: 'mood', add: 6 }],
                failEffects: [{ stat: 'mood', add: -2 }, { stat: 'stress', add: 3 }, { npc: 'jax', affinity: -2 }],
              },
            },
            {
              text: 'Just sit with him a while and say nothing much.',
              effects: [{ stat: 'stress', add: -5 }],
              goto: 'sit',
            },
          ],
        },
        flipped_absolution: {
          speaker: 'player',
          text: [
            '"You flipped. I know. If it had been me alone in that room with them, I don\'t know what I\'d have done, and neither do you, so let\'s stop pretending we do."',
            'He looks at you for a long second, then his whole face comes loose, like a held breath.',
          ],
          effects: done('jax'),
        },
        backroom_yes: {
          speaker: 'jax',
          text: '"...Yeah. Yeah, okay." He puts out his hand like it\'s a business deal, then pulls you into a hug that spills both coffees. "Partners. God help this neighborhood."',
          effects: done('jax'),
        },
        laugh: {
          speaker: 'jax',
          text: 'It works. It always works. He laughs so hard the waitress looks over, and for exactly as long as it lasts, you are both fifteen and nothing has happened yet.',
          effects: done('jax'),
        },
        no_laugh: {
          speaker: 'jax',
          text: 'The joke lands flat between you. He smiles anyway, kindly, the way you smile at someone who is trying. "It\'s okay," he says. "We were never funny. We just had time."',
          effects: done('jax'),
        },
        sit: {
          speaker: 'narrator',
          text: [
            { if: jaxDead, text: 'You finish your coffee, and his, because it is cold and nobody is going to drink it. The fog comes up off the Sound. You tell him he was right about the hill. You tell him a couple of other things too, and then you go back down to the living.' },
            { if: all(jaxArrested, not(jaxDead)), text: 'You sit until the guard raps the glass. Neither of you says much. It turns out you did not come to say anything; you came so he could see a face he chose, on a day full of faces he didn\'t.' },
            { if: all(not(jaxDead), not(jaxArrested)), text: 'You sit in the booth until the coffee is gone and then a while past that. Two guys who built things together before either of you knew what you were building. It is enough. It was always enough.' },
          ],
          effects: done('jax'),
        },
      },
    },

    // ── Family ─────────────────────────────────────────────────────────────
    {
      id: 'a4_reck_family',
      channel: 'dialog',
      title: 'Sunday Dinner',
      start: 'open',
      nodes: {
        open: {
          speaker: 'narrator',
          text: [
            { if: fate('mom', 'passed'), text: 'The flat smells wrong: Dad\'s cooking, not Mom\'s. He has been trying. There is a chair at the table nobody sits in, and a place set at it, because Kim refuses to stop.' },
            { if: fate('mom', 'estranged'), text: 'You are not sure you are welcome. Kim let you in when you knocked, glancing back at the kitchen where the curtain of Mom\'s silence hangs across the whole flat.' },
            { if: all(not(fate('mom', 'passed')), not(fate('mom', 'estranged'))), text: 'The flat smells like home: Mom\'s cooking, the good rice, the window fogged with it. She is already yelling that you look thin before you get your coat off.' },
          ],
          next: 'kim_open',
        },
        kim_open: {
          speaker: 'kim',
          text: [
            { if: fate('kim', 'endangered'), text: '(Kim corners you by the coats. She keeps her voice down, the way she has since it happened.) "Somebody came to my school. Because of you. Because of whatever you do. I\'m not asking you to explain. I\'m asking you to make it stop being true."' },
            { if: all(fate('kim', 'endangered'), flag('a3.kim_walked')), text: '"You walked me to school for six weeks. Every day. I know what that cost you. I just need to know it wasn\'t the only thing you\'ve got."' },
            { if: all(fate('kim', 'endangered'), flag('a3.kim_sent_away')), text: '"Ridgeport was fine. Aunt Thuy\'s cooking was not. The car was gone when I came back, and then one day it wasn\'t."' },
            { if: all(fate('kim', 'endangered'), flag('a3.kim_favor_paid')), text: '"And don\'t tell me you handled it. I know what \'handled\' means when you say it. I found the business card in Mom\'s kitchen drawer. Good coat. No name."' },
            { if: fate('kim', 'follows_in'), text: '(Kim finds you in the hall, and there is a flash drive in her hand she doesn\'t quite hide.) "I have a handle now. I\'ve had one for years. I learned it all watching you not close your windows. So. You gonna yell, or you gonna teach me the part where I don\'t get caught?"' },
            { if: fate('kim', 'thriving'), text: '"I got in. Full ride, the good school upstate." She is trying not to grin and failing. "I put you as an emergency contact. Don\'t make it weird."' },
            { if: all(not(fate('kim', 'endangered')), not(fate('kim', 'follows_in')), not(fate('kim', 'thriving'))), text: '"You actually came." Kim says it flat, but she sets an extra plate. "Fourteen years I\'ve been telling people my sibling\'s a big deal. Prove me right or prove me wrong, just pick one."' },
          ],
          choices: [
            {
              text: '[Social] "You are getting out of this city, and I am going to make sure of it. Whatever it costs me."',
              if: fate('kim', 'endangered'),
              check: {
                skill: 'social',
                dc: 15,
                bonuses: [
                  { if: flag('life.family_shield'), add: 2, label: '+2 (Mom lied for you once; Kim knows)' },
                  { if: flag('a3.kim_walked'), add: 2, label: '+2 (you walked her to school for six weeks)' },
                  { if: flag('a3.kim_favor_paid'), add: -2, label: '−2 (she knows you made a deal with them)' },
                ],
                success: 'kim_restored',
                fail: 'kim_tries',
                successEffects: [{ flag: 'a4.kim_restored' }, { npc: 'kim', affinity: 12, fate: 'thriving' }, { stat: 'mood', add: 8 }],
                // Fail is not the end of it: Kim writes a few days later and names her price (a4_kim_way_out).
                failEffects: [{ npc: 'kim', affinity: 2 }, { stat: 'stress', add: 4 }, { scene: 'a4_kim_way_out', delayHours: 120 }],
              },
            },
            {
              text: '"Sit down. I\'ll teach you the part where you don\'t get caught, and the part where you know when to stop."',
              if: fate('kim', 'follows_in'),
              effects: [{ flag: 'a4.kim_blessed' }, { npc: 'kim', affinity: 8 }],
              goto: 'kim_blessed',
            },
            {
              text: '"Don\'t be me. Be better than me. Here\'s what better looks like."',
              if: any(fate('kim', 'thriving'), all(not(fate('kim', 'endangered')), not(fate('kim', 'follows_in')))),
              effects: [{ flag: 'a4.kim_steered' }, { npc: 'kim', affinity: 8 }, { stat: 'mood', add: 5 }],
              goto: 'kim_steered',
            },
            {
              text: 'Deflect. Some things you cannot say at a dinner table.',
              effects: [{ stat: 'stress', add: 3 }],
              goto: 'table',
            },
          ],
        },
        kim_restored: {
          speaker: 'kim',
          text: '"Okay." She lets out a breath she has been holding since it happened. "Okay. I believe you. I hate that I believe you, but I do." She goes and sits at the table, and for the first time in months she sits with her back to the door.',
          next: 'table',
        },
        kim_tries: {
          speaker: 'kim',
          text: [
            'She nods, but the light stays on in her eyes the way it has since it happened. "You\'ll try," she says. "I know you\'ll try." It is not the same as being safe, and you both know it.',
            'At the door, coat half on, she adds without looking at you: "I\'ll write you. What it would actually take. You said whatever it costs. I\'m going to find out if you meant it."',
          ],
          next: 'table',
        },
        kim_blessed: {
          speaker: 'kim',
          text: '"Finally," she says, and she means it, and it terrifies you exactly as much as it should. You spend the rest of dinner drawing threat models on a napkin while Dad pretends not to watch, proud and afraid in equal measure.',
          next: 'table',
        },
        kim_steered: {
          speaker: 'kim',
          text: 'She rolls her eyes, but she keeps the napkin you wrote on, folds it into her pocket like it is worth something. Maybe it is. Maybe that is the whole trick of an older sibling: being a warning that loved them.',
          next: 'table',
        },
        table: {
          speaker: 'narrator',
          text: [
            { if: fate('dad', 'spiral'), text: 'Dad drinks through dinner, quietly, getting smaller. You cannot fix it at a table. You are not sure you can fix it at all.' },
            { if: fate('dad', 'mill_ghost'), text: 'Dad talks about the data center like it is the mill, catches himself, stops. He works the same floor he worked for twenty years, between machines that do not need him, making sure they stay cold.' },
            { if: fate('dad', 'retrained'), text: 'Dad hands you a business card. PC DOCTOR. He hands you a second one in case you lose the first. He is booked solid on casseroles.' },
            { if: fate('dad', 'dating_again'), text: 'Dad brought Bernadette. She laughs at his jokes, which nobody has done in years, and he is so plainly happy that you have to look at your plate.' },
            { if: fate('mom', 'passed'), text: 'Somebody says grace over the empty chair. It is Kim. Nobody planned it. Nobody stops her.' },
            { if: flag('a3.memory_defended'), text: 'Mrs. Alvarez sent a pie up the stairs with Kim. The card, in shaky capitals: FOR LINH\'S KID, WHO READ THE RECEIPTS.' },
            { if: flag('a3.memory_let_burn'), text: 'It took Dad most of a year after the whisper to ask you back to Sunday dinner. He sets your plate down a little too carefully, the way you handle a thing that broke once and got glued.' },
            { if: flag('a3.memory_hunted'), text: 'Dad watches you over the rice the way he used to watch the mill foreman: carefully, like a man who has learned what you are capable of and is not sure yet what he thinks of it.' },
            { if: fate('mom', 'healthy'), text: 'Mom walks the Row every morning now, doctor\'s orders, and she reports the entire neighborhood\'s business over dinner like a war correspondent.' },
            { if: fate('mom', 'recovered_dark'), text: 'Mom is alive because of money you will never explain. She has stopped asking where it came from. Sometimes you catch her reading your face like a letter in a language she used to know.' },
            'You do the dishes. Kim dries. It is the most ordinary thing in the world, and you would trade every dollar you ever made to keep doing it forever.',
          ],
          effects: done('family'),
        },
      },
    },

    // ── Kim, after a failed restore: what it would actually take ─────────────
    {
      id: 'a4_kim_way_out',
      channel: 'mail',
      title: 'what it would actually take',
      from: 'kim',
      pause: true,
      expiresDays: 14,
      onExpire: [{ flag: 'a4.kim_left_waiting' }, { npc: 'kim', affinity: -6 }],
      start: 'open',
      nodes: {
        open: {
          speaker: 'kim',
          text: [
            'From: kimcognito',
            'You said whatever it costs. I looked it up. Here is what it costs.',
            'Option one: the program upstate takes early admits in January if somebody pays the housing deposit and the first semester up front. $6,000. I would be three hundred miles from whatever file I am in, with a meal plan.',
            'Option two: you do the thing you do, and I stop being in the file at all. I would rather option one. I am not stupid. I know what option two means for you.',
            'I have been sleeping with the light on for a long time. Pick one or tell me to wait. Just don\'t say "I\'ll try" again. — K',
          ],
          choices: [
            {
              tag: '[Pay · $6,000 + rent]',
              text: 'Wire the deposit tonight, and set up her rent upstate for the spring.',
              req: { stat: 'money', gte: 6000 },
              reqText: 'Requires $6,000',
              effects: [
                { money: -6000 },
                { obligation: { id: 'pkg04_act4_kim_upstate', label: "Kim's room upstate", perDay: 20, days: 120 } },
                { flag: 'a4.kim_restored' },
                { npc: 'kim', affinity: 10, fate: 'thriving' },
                { stat: 'mood', add: 6 },
              ],
              goto: 'paid',
            },
            {
              tag: '[Opsec DC 17]',
              text: 'Option two. Make her so boring to the machine that it forgets her name.',
              check: {
                skill: 'opsec',
                dc: 17,
                bonuses: [{ if: flag('life.family_shield'), add: 1, label: '+1 (the family already closes ranks)' }],
                success: 'scrubbed',
                fail: 'followed',
                successEffects: [{ flag: 'a4.kim_restored' }, { npc: 'kim', affinity: 6, fate: 'thriving' }, { stat: 'heat', add: 6 }],
                failEffects: [{ flag: 'a4.kim_followed' }, { npc: 'kim', affinity: 4, fate: 'follows_in' }, { stat: 'heat', add: 8 }, { stat: 'stress', add: 6 }],
              },
            },
            {
              tag: '[Not yet]',
              text: '"Hold on a little longer. I have to finish one thing first, and then I can do it right."',
              effects: [{ flag: 'a4.kim_left_waiting' }, { npc: 'kim', affinity: -6 }],
              goto: 'waiting',
            },
          ],
        },
        paid: {
          speaker: 'kim',
          text: [
            'Re: what it would actually take',
            'The acceptance came with a parking permit and a roommate questionnaire. Question 14 is "How do you feel about noise at night?" I wrote "I would like there to be some."',
            'I turned the light off last night. Just to see. It was fine. It was actually fine. — K',
          ],
        },
        scrubbed: {
          speaker: 'narrator',
          text: [
            'You spend three nights making your little sister boring to a machine: every record that could be bought or sold about her, quietly made dull, duplicated into nonsense, folded back into the crowd. It is the most careful work you have ever done, and nobody will ever know it was work.',
            'The scholarship clears. The car never comes back. Kim sends a single-line mail: "the light is off." You read it nine times.',
          ],
        },
        followed: {
          speaker: 'narrator',
          text: [
            'You do it at the kitchen table at the flat, because it is the only place you can reach her records without leaving a trail back to your own. You do not hear her come in behind you. You do not know how long she has been watching.',
            '"Wait," Kim says, very quietly, leaning over your shoulder. "Go back. What did you just do there?" And you, God help you, show her.',
            'By spring she has a handle. By summer she is better at the quiet part than you were at twice her age. She is not in the file anymore. She is writing her own.',
          ],
        },
        waiting: {
          speaker: 'kim',
          text: [
            'Re: what it would actually take',
            'ok.',
            'I\'ll leave the light on, then. — K',
          ],
        },
      },
    },

    // ── Mira (present) ───────────────────────────────────────────────────────
    {
      id: 'a4_reck_mira',
      channel: 'dialog',
      title: 'nyx',
      from: 'mira',
      start: 'open',
      nodes: {
        open: {
          speaker: 'narrator',
          text: [
            { if: { npc: 'mira', romance: ['partner', 'engaged', 'married'] }, text: 'Your kitchen. Two desks, one very tired router, a fridge note that just says buy milk. Mira is at hers, and she does not turn around, but she leaves a coffee at the edge of your desk, still warm.' },
            { if: fate('mira', 'rival'), text: 'A cafe on neutral ground in Harbor Point, chosen by her, which means it is watched by nobody and overheard by nobody and she checked. Mira is already there, coffee gone cold, which for her is a message.' },
            { if: all(not({ npc: 'mira', romance: ['partner', 'engaged', 'married'] }), not(fate('mira', 'rival'))), text: 'The Cathode, late. Mira in the corner with her back to the wall, reading the room the way she reads source. She saw you before you saw her. She always does.' },
          ],
          next: 'talk',
        },
        talk: {
          speaker: 'mira',
          text: [
            { if: fate('mira', 'rival'), text: '"You brute-forced your whole life, you know that? I read the source. I found the flaw. The flaw was thinking any of them wouldn\'t sell you." A beat. "I don\'t hate you. That would be a waste of a good afternoon."' },
            { if: { npc: 'mira', romance: ['partner', 'engaged', 'married'] }, text: '"The coffee\'s still warm if you want to see how I did it." She finally turns around. "We made it. Do you understand how unlikely that is? I ran the numbers. We should not have made it."' },
            { if: flag('npc.mira.trusts'), text: '"I told you once, at four in the morning, that I trusted you, and then I pretended the line dropped. It didn\'t drop. I meant it. I have never said it to anyone since Ridgeport, and I said it to you." She looks at the table. "So. Here we are, at the end of it."' },
            { if: all(not(fate('mira', 'rival')), not({ npc: 'mira', romance: ['partner', 'engaged', 'married'] }), not(flag('npc.mira.trusts'))), text: '"We were never a crew. I don\'t do crews. But we were something. I still haven\'t got a word for it, and I\'m usually good with words." She almost smiles. "You brute-forced it. I read the source. Somewhere in the middle we became the same story."' },
          ],
          choices: [
            {
              text: '[Social] "Stay. Whatever\'s coming, face it here. With me."',
              if: all(not(fate('mira', 'rival')), not({ npc: 'mira', romance: ['partner', 'engaged', 'married'] })),
              check: {
                skill: 'social',
                dc: 16,
                bonuses: [{ if: flag('npc.mira.trusts'), add: 3, label: '+3 (she trusts you)' }],
                success: 'stays',
                fail: 'goes',
                successEffects: [{ flag: 'a4.mira_stays' }, { npc: 'mira', affinity: 10 }, { stat: 'mood', add: 6 }],
                failEffects: [
                  { flag: 'a4.mira_goes' },
                  // Her parting cipher (the `goes` node) is read at the exchange: +1 in the frame room.
                  { flag: 'a4.mira_napkin' },
                  { npc: 'mira', affinity: -3 },
                  { stat: 'mood', add: -4 },
                  {
                    buff: {
                      id: 'pkg04_act4_empty_chair',
                      name: 'The Empty Chair',
                      desc: 'Mira left, in daylight, with her own name. Every puzzle you solve now, you solve alone, and you notice.',
                      days: 45,
                      bad: true,
                      mods: [{ key: 'mood.daily', add: -0.6 }, { key: 'check.cryptography', add: -1 }],
                    },
                  },
                ],
              },
            },
            {
              text: '"You should go. Get out of this city before it finishes closing. Don\'t make my mistake."',
              if: not({ npc: 'mira', romance: ['partner', 'engaged', 'married'] }),
              effects: [{ flag: 'a4.mira_goes' }, { npc: 'mira', affinity: 4 }, { stat: 'mood', add: -3 }],
              goto: 'let_go',
            },
            {
              text: '"We made it. Both of us. Say it back to me so I believe it."',
              if: { npc: 'mira', romance: ['partner', 'engaged', 'married'] },
              effects: [{ npc: 'mira', affinity: 8 }, { stat: 'mood', add: 8 }],
              goto: 'made_it',
            },
            {
              text: '[Cryptography] Trade one last puzzle, the way you always did.',
              check: {
                skill: 'cryptography',
                dc: 14,
                success: 'puzzle_win',
                fail: 'puzzle_lose',
                successEffects: [{ npc: 'mira', affinity: 5 }, { stat: 'mood', add: 4 }],
                failEffects: [{ npc: 'mira', affinity: 1 }, { stat: 'stress', add: 3 }, { stat: 'energy', add: -6 }],
              },
            },
          ],
        },
        stays: {
          speaker: 'mira',
          text: '"...Fine. I\'ll stay. But if this goes the way I think it goes, I\'m the one who says I told you so, and I\'m going to say it a lot." She puts her hand flat on the table, palm up, which for Mira is a declaration read from a rooftop.',
          effects: done('mira'),
        },
        goes: {
          speaker: 'mira',
          text: [
            '"No." Gently, but it is a locked door. "I ran once and let a man erase me. This time I choose it, in daylight, with my own name. That\'s the difference, and it\'s the whole difference." She stands. "Take care of yourself. You never once did."',
            'She leaves her half of the check and a folded napkin with a single line of cipher on it. You break it on the walk home. It says: *the copper floods. go in dry.* It is the last clean advice anyone will give you, and she will not be there when you need the rest.',
          ],
          effects: done('mira'),
        },
        let_go: {
          speaker: 'mira',
          text: 'She studies you for a long moment, surprised, maybe, that you would give her the exit. "Okay," she says. "Okay." At the door she stops. "For the record: you weren\'t the one who erased me. You\'re the only one who didn\'t." Then she is gone, cleanly, the way she does everything.',
          effects: done('mira'),
        },
        made_it: {
          speaker: 'mira',
          text: '"We made it." She says it once, evenly, the way you confirm a checksum. Then she signs an imaginary note in the air between you: hugz. After all these years it still gets you, and she knows it, and that is the whole marriage in one gesture.',
          effects: done('mira'),
        },
        puzzle_win: {
          speaker: 'narrator',
          text: 'You solve hers in your head before she finishes stating it. Her eyebrows go up a fraction of an inch, which from Mira is a standing ovation. "Look at you," she says. "Turns out you were paying attention."',
          effects: done('mira'),
        },
        puzzle_lose: {
          speaker: 'narrator',
          text: 'You get it wrong. Of course you get it wrong; she made it. But she explains it afterward, slowly, the way she started doing once she stopped keeping score, and that is the point of the whole thing.',
          effects: done('mira'),
        },
      },
    },
    {
      id: 'a4_reck_mira_letter',
      channel: 'mail',
      title: 'no subject',
      from: 'mira',
      pause: true,
      start: 'read',
      nodes: {
        read: {
          speaker: 'mira',
          text: [
            'No return address. Postmarked from a city three states over, then forwarded twice, the way she taught you to bounce a connection.',
            '"I left. You know why, and if you don\'t, that\'s why. Don\'t come looking; you\'d find me, you were always better at that than at everything else, and it wouldn\'t help either of us.',
            'I read the source on this whole city, in the end. The flaw was structural. You can\'t patch it, only leave it. I left. I hope you find your own door before it closes.',
            'You weren\'t the one who erased me. Remember that when the fog comes in. — n"',
          ],
          effects: [{ npc: 'mira', affinity: 2 }, { stat: 'mood', add: -4 }, ...done('mira')],
        },
      },
    },

    // ── Grace ────────────────────────────────────────────────────────────────
    {
      id: 'a4_reck_grace',
      channel: 'dialog',
      title: 'Off Shift',
      from: 'grace',
      start: 'open',
      nodes: {
        open: {
          speaker: 'narrator',
          text: [
            { if: fate('grace', 'collateral'), text: 'Grace changed the locks after your world reached hers. She gave you the new code anyway, eventually, which is its own kind of answer. She is on the couch in scrubs, too tired to have moved.' },
            { if: fate('grace', 'whistleblower'), text: 'Grace saved her ward and went public, and the hospital board has hated her ever since, and her patients send cards by the shoebox-full. She is off shift, feet up, reading one of them.' },
            { if: all(not(fate('grace', 'collateral')), not(fate('grace', 'whistleblower'))), text: 'The all-night window at the Cathode, 3 a.m., the hour when nurses and hackers keep the same schedule. Grace comes off shift and slides in beside you smelling of antiseptic and coffee.' },
          ],
          next: 'talk',
        },
        talk: {
          speaker: 'grace',
          text: [
            '"You keep two lives. I told you that the day I met you." She takes your hand, turns it over, reads it like a chart. "I\'m very good at knowing when someone\'s hiding a wound.',
            { if: { npc: 'grace', romance: ['engaged', 'married'] }, text: 'I married one of your lives. I need to know, before whatever you\'re about to do, which one it was."' },
            { if: { npc: 'grace', romance: ['dating', 'partner'] }, text: 'I keep choosing to stay. I need to know if I\'m choosing the one who comes home, or the one who\'s always half out the door."' },
            { if: { npc: 'grace', romance: ['flirting', 'none'] }, text: 'You never fully brought either one to dinner. That\'s an answer too, I think. I just want to hear you say it."' },
          ],
          choices: [
            {
              text: '[Social] Tell her the truth. All of it. The wound and the two lives both.',
              check: {
                skill: 'social',
                dc: 15,
                bonuses: [{ if: flag('side.partner_knows'), add: 3, label: '+3 (she already knows most of it)' }],
                success: 'truth',
                fail: 'truth_fail',
                successEffects: [{ npc: 'grace', affinity: 12 }, { stat: 'mood', add: 8 }],
                failEffects: [{ npc: 'grace', affinity: -3 }, { stat: 'stress', add: 5 }, { flag: 'a4.grace_half_truth' }],
              },
            },
            {
              text: '"The one who comes home. I\'m done with the other one. I mean it this time."',
              if: { npc: 'grace', romance: ['dating', 'partner', 'engaged', 'married'] },
              effects: [{ npc: 'grace', affinity: 8 }, { stat: 'mood', add: 6 }],
              goto: 'comes_home',
            },
            {
              text: 'Say nothing true. Let her keep the version of you she can live with.',
              effects: [{ npc: 'grace', affinity: -4 }, { stat: 'stress', add: 6 }],
              goto: 'silence',
            },
          ],
        },
        truth: {
          speaker: 'grace',
          text: 'She listens the way she listens to a heart: completely, without flinching, filing everything. When you finish she is quiet for a while. Then: "Okay. That\'s the wound. Now I can work with it." She does not let go of your hand.',
          effects: done('grace'),
        },
        truth_fail: {
          speaker: 'grace',
          text: 'It comes out tangled, defensive, less than the truth even when you meant to tell all of it. She hears the shape of what you are not saying. "That\'s most of it," she says. "I\'ll take most of it. I\'ve taken less." It is not nothing. It is not everything. She will never ask you again, and you will spend years wishing she would.',
          effects: done('grace'),
        },
        comes_home: {
          speaker: 'grace',
          text: '"Good." She checks your pupils, an old reflex, half a joke. "Because I already knew, and I stayed anyway, and I was starting to feel stupid about it." She kisses your forehead like she is discharging a patient. "Go do your last thing. Then come home for real."',
          effects: done('grace'),
        },
        silence: {
          speaker: 'grace',
          text: 'She waits, and you give her the smooth version, the one with no wound in it. She nods slowly, and something closes behind her eyes, gently, the way she closes a door on a room where someone is sleeping. "Okay," she says. "Okay." She has heard smoother lies. She has never heard one from someone she wanted to believe.',
          effects: done('grace'),
        },
      },
    },

    // ── Priya ────────────────────────────────────────────────────────────────
    {
      id: 'a4_reck_priya',
      channel: 'dialog',
      title: 'Rule Three',
      from: 'priya',
      start: 'open',
      nodes: {
        open: {
          speaker: 'narrator',
          text: [
            { if: fate('priya', 'martyr'), text: 'A conference room she borrowed from her own lawyers. Priya has been testifying for weeks; the industry calls her difficult and the city calls her brave and she calls it overdue. She looks lighter than you have ever seen her.' },
            { if: fate('priya', 'complicit'), text: 'The good coffee place near the Halcyon campus. Priya orders like someone who has stopped counting the cost of things. The WORLD\'S OKAYEST ENGINEER mug is not on her desk anymore; you noticed, walking in.' },
            { if: fate('priya', 'cofounder'), text: 'Your office. The one with both your names on the lease, that pays everyone on time and sells no one. Priya has her feet on a box that has not been unpacked in a year.' },
            { if: fate('priya', 'saved'), text: 'A bar she picked because nobody from either of your worlds drinks there. She took a fall so your name stayed clean; you took a fall so hers did. Neither of you has ever forgiven the other for it, which is how you both know.' },
            { if: all(not(fate('priya', 'martyr')), not(fate('priya', 'complicit')), not(fate('priya', 'cofounder')), not(fate('priya', 'saved'))), text: 'The CS basement, after hours, where she still has a key. Priya at the whiteboard that has not been fully erased since 1994.' },
          ],
          next: 'talk',
        },
        talk: {
          speaker: 'priya',
          text: [
            '"Rule one: the machine is never the vulnerability. Rule two: you are a person who bought a machine." She caps the marker. "I never told you rule three, because you weren\'t old enough, and now, God help you, you are.',
            '"Rule three: the report is never enough. In \'99 I wrote the truest thing I ever wrote, and they bought it, and bought my silence with it, and I told myself the writing was the brave part. It wasn\'t. The brave part is what you do the morning after you\'re proven right and nothing has changed.',
            'You\'re about to be proven right about something. I can see it on you. Rule three is: don\'t let being right be the end of the sentence."',
          ],
          choices: [
            {
              text: '"I won\'t. Whatever I do with what I know, it won\'t just be a report in a drawer."',
              effects: [{ npc: 'priya', affinity: 8 }, { stat: 'mood', add: 5 }],
              goto: 'promise',
            },
            {
              text: '[Social] "You WERE brave. Let yourself have that. I need you to have that."',
              check: {
                skill: 'social',
                dc: 16,
                success: 'absolve',
                fail: 'absolve_fail',
                successEffects: [{ npc: 'priya', affinity: 10 }, { stat: 'mood', add: 6 }],
                failEffects: [{ npc: 'priya', affinity: 1 }, { stat: 'stress', add: 4 }],
              },
            },
            {
              text: 'Ask her, plainly, whether it was worth it. Any of it.',
              effects: [{ stat: 'stress', add: 3 }],
              goto: 'worth_it',
            },
          ],
        },
        promise: {
          speaker: 'priya',
          text: 'She studies you, then nods once, the way she nods at code that compiles clean. "Then you learned the only thing I had left to teach. Go on. I\'ll keep the mug warm." She does not have the mug anymore, and you both let the lie stand, because it is a kind one.',
          effects: done('priya'),
        },
        absolve: {
          speaker: 'priya',
          text: 'For once she does not have a counterargument ready. She looks at the whiteboard, at fifteen years of half-erased truth, and something in her shoulders comes down an inch. "Okay," she says quietly. "Okay. I was brave once. I forgot I was allowed to keep it."',
          effects: done('priya'),
        },
        absolve_fail: {
          speaker: 'priya',
          text: '"Don\'t," she says, not unkindly, and holds up a hand. "I know what you\'re doing and I love you for it and it won\'t take. Some wounds you don\'t heal, you just get strong around. I got strong around this one." She smiles. "Rule three. Go be right about something for both of us."',
          effects: done('priya'),
        },
        worth_it: {
          speaker: 'priya',
          text: [
            'She thinks about it longer than you expected. "No," she says finally. "And also yes. Both, at the same time, forever. That\'s adulthood, mostly: holding two answers and not dropping either one.',
            '"Ask me again in ten years. I\'ll have a third answer by then, and I\'ll be holding all three."',
          ],
          effects: done('priya'),
        },
      },
    },
    {
      id: 'a4_reck_priya_letter',
      channel: 'mail',
      title: 'Rule Three',
      from: 'priya',
      pause: true,
      start: 'read',
      nodes: {
        read: {
          speaker: 'priya',
          text: [
            'She quit and left the city a long time ago. The letter is postmarked from somewhere with mountains.',
            { if: flag('a3.priya_fled'), text: '"You drove me to the county line at three in the morning and paid for a room over a bait shop for three months. I never thanked you. This is me thanking you, badly, in the only format I trust anymore."' },
            { if: flag('a3.priya_abandoned'), text: '"You told me to call Halcyon security. I did. You know who they called. I don\'t hold it against you. I just wanted you to know that I know you knew."' },
            { if: flag('a3.priya_folder_saved'), text: '"You got the folder out of my apartment with a car idling at the curb. I hope it was worth what it cost you. I hope you use it. Otherwise you just stole my guilt and put it in a nicer drawer."' },
            { if: flag('a3.priya_folder_lost'), text: '"They sent me a fruit basket. Did I ever tell you that? THANK YOU FOR YOUR YEARS OF SERVICE. I kept the card. It is on my fridge, next to a picture of the mountains, so I remember which one I chose."' },
            '"You never got rule three, because I never gave it to you, because I was too busy proving I didn\'t need it. Here it is, late, like everything I ever gave you: the report is never enough. Being right is where the work starts, not where it ends.',
            '"I wrote the truest thing I ever wrote and let it die in a drawer, and I told myself the writing was the brave part. It wasn\'t. Don\'t make my mistake. You\'re about to be right about something. Do the thing that comes after right.',
            'Rule two. Remember rule two. — P"',
          ],
          effects: [{ npc: 'priya', affinity: 2 }, { stat: 'mood', add: -2 }, ...done('priya')],
        },
      },
    },

    // ── Corvid ───────────────────────────────────────────────────────────────
    {
      id: 'a4_reck_corvid',
      channel: 'dialog',
      title: 'The Commons',
      from: 'corvid',
      start: 'open',
      nodes: {
        open: {
          speaker: 'narrator',
          text: [
            { if: fate('corvid', 'succeeded'), text: 'A house with a garden in it, which you would not have believed of her. Corvid in an apron, hands in the dirt, the black coat over a chair. She named you sysop and walked out clean, and she sends you seed catalogs with rude notes in the margins.' },
            { if: fate('corvid', 'vindicated'), text: 'The back room on Sodium Row, fuller than it has been in years. Corvid is back in the chair, pretending not to be pleased. The scene rebuilt itself around her ethic, and here she is at the center of it, complaining about the coffee.' },
            { if: fate('corvid', 'bought'), text: 'A glass office in Millgate that used to be a fish warehouse. Corvid behind a desk that costs more than your first car. Nobody on the board says her name anymore. She said yours, to get you in the building.' },
            { if: all(not(fate('corvid', 'succeeded')), not(fate('corvid', 'vindicated')), not(fate('corvid', 'bought'))), text: 'The back room, quieter than it used to be. Corvid in her black coat, grey streak gone fully grey, keeping the ethics the way she has since before you could spell your own handle.' },
          ],
          next: 'talk',
        },
        talk: {
          speaker: 'corvid',
          text: [
            { if: fate('corvid', 'bought'), text: '"Don\'t look at me like that. I built the commons and watched it starve for twenty years while men in glass boxes got rich off what we gave away for free. So I took the box. At least in here, some of it goes to people who need it." She almost believes it. "You\'d have done the same. You did worse, probably."' },
            { if: not(fate('corvid', 'bought')), text: '"The scene isn\'t the tools. It never was. It\'s that when they came for Deadline in \'94, forty of us wiped our drives the same night and nobody said a word." She looks at you, level. "The question I\'ve been asking for a decade is whether that\'s still true. You\'re about to answer it, one way or another. So tell me. Is the building worth keeping?"' },
          ],
          choices: [
            {
              text: '"It\'s worth keeping. Smaller, careful, clean. Mutual aid, not warez. I\'ll keep the lights on."',
              if: not(fate('corvid', 'bought')),
              effects: [{ npc: 'corvid', affinity: 8 }, { stat: 'mood', add: 5 }],
              goto: 'keep',
            },
            {
              text: '[Social] "You didn\'t take the box because you wanted it. You took it because you were tired. Come home."',
              if: fate('corvid', 'bought'),
              check: {
                skill: 'social',
                dc: 18,
                success: 'come_home',
                fail: 'come_home_fail',
                successEffects: [{ npc: 'corvid', affinity: 8 }, { stat: 'mood', add: 6 }],
                // She shuts the door, and logs the visit: no Corvid at your back at the exchange.
                failEffects: [
                  { npc: 'corvid', affinity: -6 },
                  { stat: 'mood', add: -3 },
                  { flag: 'a4.corvid_shut_door' },
                  { faction: 'fac.aperture', add: -5 },
                  { stat: 'heat', add: 5 },
                  { chance: 0.3, then: [{ complication: 'social' }] },
                ],
              },
            },
            {
              text: 'Ask about \'94. You have never heard the whole of it.',
              effects: [{ stat: 'stress', add: -3 }],
              goto: 'ninety_four',
            },
          ],
        },
        keep: {
          speaker: 'corvid',
          text: '"Good answer." She almost smiles. "It was always the only answer. The rest is just how long it takes people to say it." She pours you a coffee from the pot that has been on since 1994. "Keep the lights on. Don\'t sell the building. That\'s the whole liturgy."',
          effects: done('corvid'),
        },
        come_home: {
          speaker: 'corvid',
          text: 'For a long moment she is very still, the desk between you like a border. Then she takes off the expensive watch and sets it down, gently, as if it were made of glass. "Tired," she repeats. "Yeah. I was tired." She does not promise anything. But she leaves the watch on the desk when she walks you out.',
          effects: done('corvid'),
        },
        come_home_fail: {
          speaker: 'corvid',
          text: '"Home," she says, and the word does something ugly to her face for half a second before the glass comes back down. "I don\'t have one of those anymore. I have this." She gestures at the office, the view, the desk. "It\'s warmer than a cell. Ask Deadline." She is polite to you the rest of the meeting, which is worse than anything.\n\nAt the elevator she says, to the doors and not to you: "I\'ll have to log this visit. You understand. Everything in this building gets logged." You understand. Whatever you do at the copper, Corvid will not be on the other end of the wire.',
          effects: done('corvid'),
        },
        ninety_four: {
          speaker: 'corvid',
          text: [
            '"Forty drives in one night," she says. "No phone tree, no plan. Somebody knocked on somebody\'s door and it just... went. Like the whole neighborhood exhaling at once." She turns her mug in her hands. "People think I organized it. I didn\'t. I just refused to be the one who broke it. That\'s all leadership ever is, in a scene. Refusing to be the one who breaks it first."',
            'She looks at you. "Your turn\'s coming. Don\'t be the one who breaks it."',
          ],
          effects: done('corvid'),
        },
      },
    },
    {
      id: 'a4_reck_corvid_post',
      channel: 'forum',
      title: 'lights out',
      from: 'corvid',
      board: 'warez',
      pause: true,
      start: 'read',
      nodes: {
        read: {
          speaker: 'corvid',
          text: [
            'The board went dark the night she left. This post is the last thing on it, dated the day of, still there because nobody can log in to take it down.',
            '"Keep the lights on. Don\'t sell the building. If you\'re reading this, the lights are already out and the building is already sold, so instead: remember it. Somewhere there\'s a server nobody can visit, and I\'m the only one with the key, and that\'s the commons now. A locked room and a memory.',
            '"You were a good one. Most of you were. That\'s the part they can never enclose. — C"',
          ],
          effects: [{ npc: 'corvid', affinity: 2 }, { stat: 'mood', add: -4 }, ...done('corvid')],
        },
      },
    },

    // ── The Oracle ───────────────────────────────────────────────────────────
    {
      id: 'a4_reck_oracle',
      channel: 'dialog',
      title: 'The Whisper, in Person',
      start: 'open',
      nodes: {
        open: {
          speaker: 'narrator',
          text: [
            'The meeting place is the observation deck above the mill-district, closed for years, chain cut cleanly by someone who has done it before. From here you can see the whole shape of it: the old paper mill glowing with server light, the copper exchange squatting dark beside it, the fiber trunk running between them like a suture.',
            { if: flag('a3.oracle_revealed'), text: 'The Oracle is already there, and you know the face now, and it is exactly as strange to see it in daylight as you always feared.' },
            { if: not(flag('a3.oracle_revealed')), text: 'The Oracle is a shape at the rail, back to you, hood up. "Don\'t come closer," they say. "Some things are easier to say to the fog."' },
          ],
          next: 'who',
        },
        who: {
          speaker: 'oracle',
          text: [
            { if: flag('npc.oracle.is_deadline'), text: '"You knew it was me. \'94 taught me the only lesson worth having: they can take the rig, the books, the dog\'s vet records. They can\'t take the thing you never wrote down." (Deadline\'s voice, from before the beard went grey.) "I\'ve been the thing nobody wrote down. Whispering. It\'s all an old man\'s good for."' },
            { if: flag('npc.oracle.is_reyes'), text: '"Off the books. Always off the books." (Reyes, working against her own office one untraceable message at a time.) "I came here to catch the people hollowing out this city and found my own agency renting their tools. So I became a leak with a badge. Somebody had to point you at the right building."' },
            { if: flag('npc.oracle.is_kroll'), text: '"Even the market wants insurance, sweetheart." (Kroll\'s laugh, warm as ever.) "I sold you the whole conspiracy one whisper at a time, and do you know why? Because I could see the shape of the day I\'d need someone outside the machine who owed me the truth. Hello. You\'re that someone."' },
            { if: not(flag('a3.oracle_revealed')), text: '"It doesn\'t matter who I am. It never did. What matters is the building under us." (The voice stays a whisper, deliberately shapeless.) "I pointed you here because you\'re the only one left who can walk into it and out again."' },
            'You think Aperture is the top? Aperture was always a cost center. Look at who insures the risk. The whole machine runs on one assumption: that the old copper and the new fiber never touch, that nobody remembers how the city was wired before it was watched. Somebody does. You do, now.',
          ],
          choices: [
            {
              text: '"Why me? Really. Not the flattery. The truth."',
              effects: [{ stat: 'stress', add: 2 }],
              goto: 'why_you',
            },
            {
              text: '[Networking] Ask the only question that matters: how the copper and the fiber meet.',
              check: {
                skill: 'networking',
                dc: 16,
                success: 'the_map',
                fail: 'the_map_fail',
                successEffects: [{ flag: 'a4.oracle_briefed' }, { stat: 'mood', add: 4 }],
                // The rough sketch follows you into the frame room (−1 on the breach, PKG-04 q3b).
                failEffects: [{ stat: 'stress', add: 4 }, { flag: 'a4.oracle_rough_map' }],
              },
            },
            {
              text: 'Just listen. You have listened to this voice for years. One more time.',
              goto: 'listen',
            },
          ],
        },
        why_you: {
          speaker: 'oracle',
          text: [
            { if: flag('a3.truth_t3'), text: '"Because PARALLAX already picked you. It profiled the ideal next head of Special Accounts and it drew your face. The machine wants you. That means you\'re the one variable it can\'t model: the one who knows he\'s the answer to the wrong question."' },
            { if: not(flag('a3.truth_t3')), text: '"Because you\'re the only one who was there for all of it. You cleaned the first infected PC. You took the first dinner. You warned who you warned and sold who you sold. The machine is a decade long and you\'re the only continuous thread through it."' },
            '"Everyone else is a piece. You\'re the screwdriver. That\'s why."',
          ],
          effects: [...done('oracle')],
        },
        the_map: {
          speaker: 'narrator',
          text: 'They tell you, precisely, and it slots into a decade of half-guesses like the last card in a house of cards holding. The frame room in the old exchange. The trunk splice. The one junction where the city\'s past and its surveillance share a wire. You could draw it now with your eyes closed. You will need to.',
          effects: [...done('oracle')],
        },
        the_map_fail: {
          speaker: 'oracle',
          text: '"You\'re tired," the Oracle observes, not unkindly. "It\'s in your questions. Rest, then. The building will still be there. It\'s been there a hundred years. It can wait a week for you to sleep." They give you the shape of it anyway, roughly, enough to start. The rest you will have to find in the dark.',
          effects: [...done('oracle')],
        },
        listen: {
          speaker: 'oracle',
          text: [
            '"The nostalgia was always the trap," the voice says, softer now. "The dial-up handshake you loved? Same sound a wiretap makes when it syncs. They didn\'t build a new machine to watch you. They just kept the old one running and stopped disconnecting the wires. The past is the surveillance. It was always the past.',
            'Whatever you decide to do with everything you know, do it through the copper. That\'s the one door they forgot they left open, because they forgot the copper was ever a door. Go home, thread. The long tail ends in a room full of old wires."',
          ],
          effects: [...done('oracle')],
        },
      },
    },
  ],
})
