/**
 * PKG-04 — Act IV "last favors" (bible §6.D: the span to the day-3400 floor is filled by per-ally
 * last-favor beats, faction finales and the copper run; no time-skips).
 *
 * Small, warm, one-scene beats that arrive while the story waits on the faction finales or on the
 * last winter: each fires at most once, in the morning, only for people who are still in your life.
 * They are deliberately low-stakes. After a decade of leverage, being asked for an ordinary favor
 * by someone who loves you is the point.
 *
 * Their checks are minor (REDESIGN_V2 §D): a failed roll never turns a favor into a disaster, but it
 * always costs something real — a lost night, a wrong part bought, a sentence typed on an open pager
 * — and the smaller warmth that comes back is written into the fail text. Three of them (the all-nighter,
 * the pager, the reply-all) carry a small chance of a complication, because life does that.
 */
import { defineContent } from '@/engine/registry'
import type { Cond, TriggerDef } from '@/engine/types'
import { all, any, available, fateNot } from './shared'

/** The quiet stretches of Act IV: waiting on the finales, or on the last winter. */
const waiting: Cond = any(
  { quest: 'main_a4_q2_last_leverage', status: 'active', stage: 'finales' },
  { quest: 'main_a4_q4_last_day', status: 'active' },
)

/** About once every ~2 weeks per favor while its person is around; mornings only. */
const favor = (id: string, scene: string, when: Cond): TriggerDef => ({
  id,
  when: all(waiting, when),
  atHour: 10,
  chance: 0.07,
  effects: [{ scene }],
})

export default defineContent({
  triggers: [
    favor('trig_a4_favor_jax', 'a4_favor_jax', all(available('jax'), fateNot('jax', ['flipped']), fateNot('rosa', ['passed']))),
    favor('trig_a4_favor_kim', 'a4_favor_kim', fateNot('kim', ['estranged'])),
    favor('trig_a4_favor_sal', 'a4_favor_sal', { var: 'w.cathode_open', eq: 1 }),
    favor('trig_a4_favor_deadline', 'a4_favor_deadline', available('deadline')),
    favor('trig_a4_favor_dad', 'a4_favor_dad', fateNot('dad', ['spiral'])),
    favor('trig_a4_favor_toaster', 'a4_favor_toaster', { always: true }),
  ],
  scenes: [
    // ── Jax: the application that died at 98% ────────────────────────────────
    {
      id: 'a4_favor_jax',
      channel: 'chat',
      title: 'JaxAttack',
      from: 'jax',
      start: 'open',
      nodes: {
        open: {
          speaker: 'jax',
          text: [
            'DUDE. emergency. not a real emergency. a rosa emergency',
            'she did her whole nursing school application online. 3 hours. essay and everything. it died at 98%. NINETY EIGHT',
            'she is not crying. i am crying a little. can u look at her laptop',
          ],
          choices: [
            {
              text: '[Systems] "bring it over. nothing ever really dies at 98%. it just hides."',
              check: {
                skill: 'systems',
                dc: 14,
                bonuses: [{ if: { background: 'tinkerer' }, add: 2, label: '+2 (you have been unbricking things since you were nine)' }],
                success: 'saved',
                fail: 'half',
                successEffects: [{ npc: 'jax', affinity: 6 }, { npc: 'rosa', affinity: 8 }, { stat: 'mood', add: 6 }],
                failEffects: [
                  { npc: 'jax', affinity: 2 },
                  { npc: 'rosa', affinity: 3 },
                  { stat: 'energy', add: -10 },
                  { stat: 'stress', add: 3 },
                  // An all-nighter in someone else's temp folders, at your age.
                  { chance: 0.2, then: [{ complication: 'health' }] },
                ],
              },
            },
            {
              text: '"tell her to open a text editor and start typing. i\'m coming over with pizza. we\'ll do it together."',
              effects: [{ npc: 'jax', affinity: 5 }, { npc: 'rosa', affinity: 6 }, { stat: 'stress', add: -4 }, { money: -18 }],
              goto: 'together',
            },
            {
              text: '"can\'t tonight, man. i\'m sorry. really."',
              effects: [{ npc: 'jax', affinity: -3 }],
              goto: 'cant',
            },
          ],
        },
        saved: {
          speaker: 'jax',
          text: [
            'U FOUND IT??',
            'the whole essay. in a temp folder. she is reading it out loud to prove its real',
            'she says ur her favorite nerd. i said hey. she said ur her SECOND favorite nerd and i am not a nerd, i am "a lot"',
            '*hugz* (from rosa. she made me type it)',
          ],
        },
        half: {
          speaker: 'jax',
          text: [
            'ok so u got the first half back and not the ending',
            'BUT. she rewrote the ending and its better?? she says losing the first one made her figure out what she actually wanted to say',
            'so basically u broke it on purpose. thats the story im telling. ur welcome',
            'also u were in her temp folders til 4am and u look like a dropped call. go to sleep. thats an order from rosa',
          ],
        },
        together: {
          speaker: 'jax',
          text: [
            'we did it in 2 hours. u typed, she talked, i ate most of the pizza',
            'she submitted it at 11:58pm. deadline was midnight. very on brand for this family',
            'thanks man. like actually',
          ],
        },
        cant: {
          speaker: 'jax',
          text: ['np np. we got it. i think. brb googling "where does a laptop keep its ghosts"'],
        },
      },
    },

    // ── Kim: the reference letter ────────────────────────────────────────────
    {
      id: 'a4_favor_kim',
      channel: 'mail',
      title: 'favor (DON\'T make it weird)',
      from: 'kim',
      start: 'open',
      expiresDays: 12,
      onExpire: [{ npc: 'kim', affinity: -3 }],
      nodes: {
        open: {
          speaker: 'kim',
          text: [
            'From: kimcognito',
            'I need a reference letter for a scholarship. It has to be from "a professional in the field who has known the applicant for many years." That is you. Congratulations, you are a professional in the field.',
            'Tell them I\'m trustworthy. Tell them I\'m careful. Do not, under any circumstances, tell them about the Tamagotchi.',
            'Due in two weeks. — K',
          ],
          choices: [
            {
              text: '[Social] Write the honest version: sharp, stubborn, and the most careful person you know.',
              check: {
                skill: 'social',
                dc: 13,
                success: 'honest',
                fail: 'honest_clumsy',
                successEffects: [{ npc: 'kim', affinity: 8 }, { stat: 'mood', add: 5 }],
                failEffects: [{ npc: 'kim', affinity: 2 }, { stat: 'stress', add: 3 }, { stat: 'energy', add: -5 }],
              },
            },
            {
              text: '[Business] Write it like a pitch deck. Quantify her. Make the committee feel it would be stupid to say no.',
              check: {
                skill: 'business',
                dc: 14,
                success: 'pitch',
                fail: 'pitch_flop',
                successEffects: [{ npc: 'kim', affinity: 6 }, { stat: 'mood', add: 4 }],
                failEffects: [{ npc: 'kim', affinity: 1 }, { stat: 'energy', add: -8 }, { stat: 'stress', add: 2 }],
              },
            },
            {
              text: 'Write "She is great. Hire her." and a very large signature.',
              effects: [{ npc: 'kim', affinity: 2 }],
              goto: 'short',
            },
          ],
        },
        honest: {
          speaker: 'kim',
          text: [
            'Re: favor',
            'I read it before I sent it. Obviously. I\'m not an idiot.',
            'You said I was "the kind of careful that is really just caring with better posture." I had to go sit in the car for a minute.',
            'I got it, by the way. The scholarship. Don\'t make it weird. — K',
          ],
        },
        honest_clumsy: {
          speaker: 'kim',
          text: [
            'Re: favor',
            'You used the word "resilient" four times. FOUR. I counted. Nobody is that resilient.',
            'It was nice, though. Under all the resilience. It also took you three drafts and a whole Sunday, which I know because you called me twice to ask how to spell "meticulous." I sent it anyway. — K',
          ],
        },
        pitch: {
          speaker: 'kim',
          text: [
            'Re: favor',
            'The committee chair called me "a sound investment" to my face. I think you broke her.',
            'I got it. Thanks. You\'re a menace. — K',
          ],
        },
        pitch_flop: {
          speaker: 'kim',
          text: [
            'Re: favor',
            'It had a chart. Why did it have a chart. There was a bar labeled "GRIT."',
            'I made you rewrite it at dinner and the second version was actually good, so I guess the chart was a draft. I\'m keeping the chart. For blackmail. — K',
          ],
        },
        short: {
          speaker: 'kim',
          text: [
            'Re: favor',
            'Five words and a signature the size of my face.',
            'They loved it, apparently. The committee said it was "refreshingly confident." I hate that this worked. — K',
          ],
        },
      },
    },

    // ── Sal: the Christmas Eve register ──────────────────────────────────────
    {
      id: 'a4_favor_sal',
      channel: 'mail',
      title: 'the register',
      from: 'sal',
      start: 'open',
      pause: true,
      nodes: {
        open: {
          speaker: 'sal',
          text: [
            'Kid. The register died. The computer one my nephew made me buy in 2004. It beeps and then it thinks and then it stops thinking.',
            'It is the busiest week of the year and I have forty people who want pie and a machine that wants to have a conversation. Come eat something and look at it. Or don\'t eat something, but you should eat something. You look like a dropped call.',
            '— Sal Moretti, the Cathode',
          ],
          choices: [
            {
              text: '[Hardware] Come in, open it up, and give the thing a talking-to.',
              check: {
                skill: 'hardware',
                dc: 14,
                success: 'fixed',
                fail: 'rotary',
                successEffects: [{ npc: 'sal', affinity: 8 }, { faction: 'fac.hood', add: 3 }, { stat: 'mood', add: 5 }],
                failEffects: [{ npc: 'sal', affinity: 3 }, { faction: 'fac.hood', add: 1 }, { money: -90 }, { stat: 'energy', add: -8 }],
              },
            },
            {
              text: 'Bring the old cash drawer up from the basement and work the counter with him until close.',
              effects: [{ npc: 'sal', affinity: 7 }, { faction: 'fac.hood', add: 3 }, { stat: 'energy', add: -12 }, { stat: 'stress', add: -6 }],
              goto: 'counter',
            },
            {
              text: 'Send the number of a repair guy you trust.',
              effects: [{ npc: 'sal', affinity: 1 }],
              goto: 'number',
            },
          ],
        },
        fixed: {
          speaker: 'sal',
          text: 'It was a fan full of forty years of fry grease and one very flat battery, you tell him. He looks at the register like it betrayed him personally. "Six years I talk to this machine nice," he says. Then he gives you pie, and does not charge you, and tells the whole counter you fixed it with your mind.',
        },
        rotary: {
          speaker: 'sal',
          text: [
            'You cannot save it. You drive to Millgate for a replacement board ($90, non-refundable, the wrong model, as it turns out, by one digit) and it dies anyway, with dignity, mid-receipt.',
            'Sal considers the corpse, goes to the back, and returns with a hand-crank adding machine from 1961 that still works perfectly. "In my day," he announces to forty customers, "we had this and a knife." Everyone applauds. The machine is back on the counter for good. The ninety-dollar board lives in his junk drawer, where he shows it to people as a warning.',
          ],
        },
        counter: {
          speaker: 'sal',
          text: 'You make change out of a cigar box until two in the morning, Sal calling the orders, you writing tickets by hand. At close he counts the drawer, counts it again, and says it is the best night the diner has had since 1998. It is not. He says it anyway, and you let him.',
        },
        number: {
          speaker: 'sal',
          text: 'Re: the register\n\nYour guy came. He was fine. He did not eat anything. I do not trust a man who does not eat anything. — Sal',
        },
      },
    },

    // ── Deadline: Biscuit's birthday ─────────────────────────────────────────
    {
      id: 'a4_favor_deadline',
      channel: 'chat',
      title: 'Deadline',
      from: 'deadline',
      start: 'open',
      nodes: {
        open: {
          speaker: 'deadline',
          text: [
            'You busy Saturday.',
            'Don\'t answer that. Everybody\'s busy. It\'s the dog\'s birthday. She\'s fourteen. That\'s ninety-something in dog, which makes her older than me, which she knows.',
            'Nobody comes to a dog\'s birthday. I\'m not asking you to come. I\'m telling you there\'s cake and I bought too much.',
          ],
          choices: [
            {
              text: '"i\'ll bring a tennis ball. the good kind."',
              effects: [{ npc: 'deadline', affinity: 8 }, { stat: 'mood', add: 6 }, { stat: 'stress', add: -5 }],
              goto: 'come',
            },
            {
              text: '[Opsec] "i\'ll come if you finally tell me the one thing you never wrote down in \'94."',
              check: {
                skill: 'opsec',
                dc: 15,
                success: 'secret',
                fail: 'no_secret',
                successEffects: [{ npc: 'deadline', affinity: 6 }, { xp: 'opsec', add: 60 }],
                failEffects: [
                  { npc: 'deadline', affinity: 1 },
                  { stat: 'heat', add: 3 },
                  { stat: 'stress', add: 2 },
                  // '94 on an unencrypted pager: somebody else may have read it too.
                  { chance: 0.25, then: [{ complication: 'legal' }] },
                ],
              },
            },
            {
              text: '"can\'t make it. give her a scratch from me."',
              effects: [{ npc: 'deadline', affinity: -2 }],
              goto: 'no',
            },
          ],
        },
        come: {
          speaker: 'deadline',
          text: [
            'She ate the tennis ball. Not all of it. Enough of it.',
            'Good day. Thanks for coming. Don\'t tell anyone I said that.',
          ],
        },
        secret: {
          speaker: 'deadline',
          text: [
            'Fine. Here\'s the thing I never wrote down: I didn\'t get caught because I was sloppy. I got caught because I trusted a machine to remember for me.',
            'Back up your life, not your data. The life is the part they can\'t subpoena. That\'s it. That\'s the whole secret. Bring cake plates.',
          ],
        },
        no_secret: {
          speaker: 'deadline',
          text: [
            'You asked me that on a pager. An unencrypted pager. In \'94 that sentence would have been Exhibit C.',
            'Nice try. Come anyway. The secret is you have to eat the cake first. And you are going to sit through the lecture about what you just typed, with frosting.',
            '(You go. There is no secret. There is a very old dog in a paper hat, and forty minutes on pager hygiene, and it turns out that was the secret.)',
          ],
        },
        no: {
          speaker: 'deadline',
          text: ['Scratch delivered. She sighed at it. That\'s dog for "tell them they\'re missed."'],
        },
      },
    },

    // ── Dad: the union mailing list ──────────────────────────────────────────
    {
      id: 'a4_favor_dad',
      channel: 'mail',
      title: 'Computer question (sorry)',
      from: 'dad',
      start: 'open',
      nodes: {
        open: {
          speaker: 'dad',
          text: [
            'Hi. It\'s Dad. I\'m using the email.',
            'The fellas from the mill want to do a reunion. Forty-one guys. Some of them have email and some of them have a daughter with email. I want to send one letter to all of them at once without everybody seeing everybody\'s address, because Hank Brody will reply-all to every single one. You know Hank.',
            'Can you show me how. I\'ll make dinner. — Robert Tan (your father)',
          ],
          choices: [
            {
              text: '[Social] Teach him properly, patiently, at the kitchen table, until he can do it without you.',
              check: {
                skill: 'social',
                dc: 12,
                bonuses: [{ if: { quest: 'fac_hood_q2_dad', status: 'completed' }, add: 2, label: '+2 (you taught him before; he remembers)' }],
                success: 'taught',
                fail: 'hank',
                successEffects: [{ npc: 'dad', affinity: 8 }, { stat: 'mood', add: 5 }],
                failEffects: [
                  { npc: 'dad', affinity: 3 },
                  { stat: 'stress', add: 4 },
                  { stat: 'energy', add: -6 },
                  // Forty-one men replying all: someone in that thread has your number now.
                  { chance: 0.3, then: [{ complication: 'social' }] },
                ],
              },
            },
            {
              text: 'Just do it for him, fast, and stay for dinner.',
              effects: [{ npc: 'dad', affinity: 4 }, { stat: 'stress', add: -3 }],
              goto: 'did_it',
            },
          ],
        },
        taught: {
          speaker: 'dad',
          text: 'He sends the letter himself, blind-copied, forty-one addresses, and sits back from the screen like a man who just landed a plane. Thirty-eight of the fellas come to the reunion. Hank Brody replies to Dad privately to say it was the best-organized thing the union has done since 1979. Dad prints the email out and puts it on the fridge.',
        },
        hank: {
          speaker: 'dad',
          text: 'It goes almost perfectly. Then Dad, confident now, sends the follow-up himself, and forgets the blind copy. Hank Brody replies all. Forty-one men reply all to Hank. The reunion is the best-attended in union history, mostly by men who want to yell at Hank in person. You spend the Saturday before it on his couch, untangling forty-one reply-alls and one accidental unsubscribe from the entire internet. Dad calls it a success, and he is right.',
        },
        did_it: {
          speaker: 'dad',
          text: 'You send it in two minutes. Dad watches over your shoulder, nodding like he is following, and is not following, and is so proud of you that he does not mind. Dinner is pork chops. They are overcooked. You have seconds.',
        },
      },
    },

    // ── The toaster man ──────────────────────────────────────────────────────
    {
      id: 'a4_favor_toaster',
      channel: 'dialog',
      title: 'Mr. Szabo\'s Toaster',
      start: 'open',
      nodes: {
        open: {
          speaker: 'narrator',
          text: [
            'Old Mr. Szabo from the third floor of the building on Cannery Row flags you down in the street. He has told everyone since 2001 that the feds tapped his phone line through his toaster. He is holding the toaster.',
            '"You. The computer one. Linh\'s kid." He pushes it into your hands, warm. "Check it. I know what I know. Ten years they have been listening to my breakfast."',
          ],
          choices: [
            {
              text: '[Hardware] Open it up, right there on the stoop, and look properly.',
              check: {
                skill: 'hardware',
                dc: 10,
                success: 'toast_clean',
                fail: 'toast_broke',
                successEffects: [{ flag: 'a4.toaster_checked' }, { faction: 'fac.hood', add: 2 }, { stat: 'mood', add: 4 }],
                failEffects: [{ flag: 'a4.toaster_checked' }, { money: -25 }, { stat: 'stress', add: 2 }],
              },
            },
            {
              text: '[Cryptography] Humor him. Explain, gravely, that a toaster is a very poor cipher.',
              check: {
                skill: 'cryptography',
                dc: 12,
                success: 'toast_cipher',
                fail: 'toast_cipher_fail',
                successEffects: [{ flag: 'a4.toaster_checked' }, { faction: 'fac.hood', add: 1 }, { stat: 'mood', add: 5 }],
                failEffects: [{ flag: 'a4.toaster_checked' }, { stat: 'stress', add: 3 }, { stat: 'energy', add: -4 }],
              },
            },
            {
              text: '"Mr. Szabo, it\'s a toaster." Hand it back.',
              effects: [{ stat: 'mood', add: 1 }],
              goto: 'toast_refuse',
            },
          ],
        },
        toast_clean: {
          speaker: 'narrator',
          text: [
            'Crumbs. A decade of crumbs, one heating element, a spring. No wires that should not be there.',
            {
              if: { var: 'w.mnsa', eq: 1 },
              text: 'You hand it back and tell him it is clean. You do not tell him that the smart meter on his building reports to a feed you have read, because on a technicality, narrowly, he has been right the whole time.',
              else: 'You hand it back and tell him it is clean. He looks almost disappointed. "Then they are using the fridge," he says darkly, and goes inside to make toast.',
            },
          ],
        },
        toast_broke: {
          speaker: 'narrator',
          text: 'The spring goes somewhere. The spring is never seen again. You buy him a new toaster from the hardware store on the corner, and he inspects it for a full minute before declaring it "probably one of theirs, but a better model." He waves at you from the window every morning after that.',
        },
        toast_cipher: {
          speaker: 'narrator',
          text: '"A toaster," you explain, "has two states. Toast, and not toast. You cannot hide a conversation in two states. They would get one bit a morning." Mr. Szabo considers this with enormous seriousness. "One bit," he repeats. "Then they know I eat breakfast." He nods, satisfied. "Let them know. I eat a very good breakfast."',
        },
        toast_cipher_fail: {
          speaker: 'narrator',
          text: 'You start explaining information theory and lose him at "entropy." He pats your arm kindly, the way you pat someone who is also, clearly, being listened to. "You too, eh?" he says. "It\'s all right. Come have toast." The toast is excellent. You are there for an hour and a half. He has a lot of theories, and all of them come with toast.',
        },
        toast_refuse: {
          speaker: 'narrator',
          text: '"That is exactly what they would want you to say," says Mr. Szabo, and takes his toaster home, and you feel oddly like you failed a test you did not know you were taking.',
        },
      },
    },
  ],
})
