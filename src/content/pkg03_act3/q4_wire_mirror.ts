/**
 * PKG-03 — Act III main, beat 4: `main_a3_q4_the_wire` (bible §6.C, CP-C2a/b).
 *
 * Two confrontations. The wire (`a3_wire`): someone is recording for the Bureau. The mirror
 * (`a3_mirror`): the anonymous rival, locked in Act IIa, gets a face. They merge only when the
 * wire-wearer and the mirror are the same person.
 *
 * `a3.wire_wearer` (str) resolves by explicit priority jax > mira > byteme, else `none` (the wire is
 * `mir.identity` radicalized and Bureau-turned — so there is always a target). The mirror OUTCOME is
 * written ONLY to `mir.outcome` / `mir.pyrrhic` / `mir.mercy` (and PKG-00's `npc.mirror` bio reads
 * it), never onto the underlying friend's fate.
 *
 * Fail branches (REDESIGN_V2 §D): both CP-C2a fails (`a3.incriminated` from a missed sweep,
 * `fac.bureau.onto_you_hard` from a botched false feed) open `side_a3_wire_fallout` — a federal
 * subject letter answered by lawyering up (retainer obligation, `a3.tape_contained`), a risky call
 * ([Social DC 17]), or the `pkg03_act3_on_the_tape` scar. A failed CP-C2b turn sets
 * `a3.mirror_spurned`: the mirror goes public on the board, skims the Meridian job (q8) and races
 * you to the copper (PKG-04's finale reads it).
 *
 * Cross-package ids referenced by exact bible id (owners in parentheses):
 *   flags npc.jax.flipped (PKG-07), npc.mira.betrayed (PKG-06), npc.byteme.used (PKG-12),
 *   npc.mira.trusts (PKG-02), mir.identity (PKG-02 lock).
 */
import { defineContent } from '@/engine/registry'
import type { Cond, Effect } from '@/engine/types'

/** The mirror wears this friend's face (set at the Act IIa lock). */
const mirrorIs = (who: string): Cond => ({ flag: 'mir.identity', eq: who })
const wireIs = (who: string): Cond => ({ flag: 'a3.wire_wearer', eq: who })

/** Resolve a3.wire_wearer: jax (flipped) > mira (betrayed) > byteme (used) > none. */
const resolveWireWearer: Effect = {
  if: { flag: 'npc.jax.flipped' },
  then: [{ flag: 'a3.wire_wearer', set: 'jax' }],
  else: [
    {
      if: { flag: 'npc.mira.betrayed' },
      then: [{ flag: 'a3.wire_wearer', set: 'mira' }],
      else: [
        {
          if: { flag: 'npc.byteme.used' },
          then: [{ flag: 'a3.wire_wearer', set: 'byteme' }],
          else: [{ flag: 'a3.wire_wearer', set: 'none' }],
        },
      ],
    },
  ],
}

export default defineContent({
  quests: [
    {
      id: 'main_a3_q4_the_wire',
      title: 'The Wire and the Mirror',
      kind: 'main',
      act: 3,
      priority: 30,
      summary:
        'Two shadows resolve into people. One of your own is carrying a wire for the Bureau. And the rival who has matched you move for move since your first week on the board finally wants to be seen.',
      rewards: "The mirror's outcome; the wire, handled",
      start: 'wait',
      stages: {
        wait: {
          text: 'The back room feels watched lately. And the rival — mirror — has stopped sniping your contracts. That, somehow, is more ominous than the sniping.',
          hint: 'A little time. Then the room gets loud.',
          objectives: [
            { id: 'wait', text: 'Wait for the two of them to surface', when: { day: true, gte: 1570 }, hint: 'Live your life. Both confrontations come to you.' },
          ],
          onComplete: [{ scene: 'a3_wire' }],
          next: 'wire',
        },
        wire: {
          text: 'Someone in the back room is wearing a wire. You can smell it — a friend who won\'t meet your eyes, a joke that lands a beat late. Find out who, or feed the tape a story.',
          hint: 'Sweep the room (Opsec or Networking), feed the Bureau false gospel (Social), or cut the wearer out cold. Every road has a real cost.',
          objectives: [
            { id: 'wire', text: 'Handle the wire', when: { flag: 'a3.wire_confronted' }, hint: 'Follow the scene to a choice.' },
          ],
          onComplete: [{ scene: 'a3_mirror' }],
          next: 'mirror',
        },
        mirror: {
          text: 'And then the rival, at last, in the same room as you. Whoever it turned out to be, they know you cold — because for a while, when you weren\'t looking, they practiced being you.',
          hint: 'Defeat them, turn them (a hard Social roll, easier with shared history), let them win one to save a life, or walk away. It decides who stands where at the very end.',
          objectives: [
            { id: 'mirror', text: 'Face the mirror', when: { flag: 'a3.mirror_revealed' }, hint: 'Follow the confrontation to its close.' },
          ],
          onComplete: [{ quest: 'main_a3_q5_the_list', start: true }],
        },
      },
    },
    // ── Fail branch of CP-C2a: the Bureau has you, one way or another. ─────
    {
      id: 'side_a3_wire_fallout',
      title: 'Subject of an Investigation',
      kind: 'personal',
      act: 3,
      summary:
        'The wire got you. Either you talked freely into it for an hour, or you tried to play it and the man on the other end noticed. Now there is paperwork with your name typed on it, which is how the federal government says hello.',
      rewards: 'How much of the tape follows you into Act IV',
      start: 'letter',
      stages: {
        letter: {
          text: 'A letter is coming, the kind that arrives by certified mail and is signed by someone with a title. How you answer it decides whether the tape is a problem you manage or a scar you carry.',
          hint: 'Watch your Mail. Lawyer up (money and a monthly retainer), talk to them yourself (a hard Social roll that can make it worse), or ignore it and carry the scar.',
          objectives: [
            {
              id: 'answered',
              text: 'Answer the federal letter',
              when: { flag: 'a3.wire_fallout_done' },
              hint: 'Open the certified letter in your Mail and pick a response before it goes stale.',
            },
          ],
        },
      },
    },
  ],
  scenes: [
    // ── The wire (CP-C2a) ──────────────────────────────────────────────────
    {
      id: 'a3_wire',
      channel: 'dialog',
      title: 'The Wire',
      start: 'open',
      nodes: {
        open: {
          speaker: 'narrator',
          text: [
            'It comes together slowly, the way a bad feeling does. A friend who sits a little too square to the door. A conversation that keeps circling back to names, dates, who did what.',
            'Someone is recording the back room for the Bureau. The only question is who — and whether you want to know.',
          ],
          effects: [resolveWireWearer],
          choices: [
            {
              tag: '[Opsec DC 16]',
              text: 'Sweep the spot before anyone speaks. Find the device.',
              check: { skill: 'opsec', dc: 16, success: 'swept', fail: 'talked' },
            },
            {
              tag: '[Networking DC 16]',
              text: 'Sniff the uplink — whatever it is, it has to phone home.',
              check: { skill: 'networking', dc: 16, success: 'swept', fail: 'talked' },
            },
            {
              tag: '[Social DC 17]',
              text: 'Say nothing true. Feed the tape a story that will burn the Bureau instead.',
              check: {
                skill: 'social',
                dc: 17,
                success: 'burned_bureau',
                fail: 'burned_you',
                successEffects: [
                  { faction: 'fac.bureau', add: -20 },
                  { flag: 'a3.fed_the_wire' },
                  { var: 'end.doubles', add: 1 },
                ],
                failEffects: [
                  { flag: 'fac.bureau.onto_you_hard' },
                  { stat: 'heat', add: 15 },
                ],
              },
            },
            {
              tag: '[Cold]',
              text: 'Don\'t play games. Cut the wearer out of your life, tonight, without a word of why.',
              effects: [{ flag: 'a3.wire_cut' }],
              goto: 'cut',
            },
          ],
        },
        swept: {
          speaker: 'narrator',
          text: [
            'You find it — small, cheap, standard issue — and now you know the hand that\'s carrying it.',
            { if: wireIs('jax'), text: 'It\'s Jax. Of course it\'s Jax; they always squeeze the one with the most to lose. He flipped to save himself, and now he sweats through his shirt every time you laugh.' },
            { if: wireIs('mira'), text: 'It\'s Mira. You broke her trust once, and Mira does not forget the shape of a wound. She warned you, in her way, that she does not run twice.' },
            { if: wireIs('byteme'), text: 'It\'s byteme. The kid you used until he felt like a tool instead of a friend. He wears the wire like a dare, waiting for you to notice.' },
            { if: wireIs('none'), text: 'It\'s the rival — mirror — radicalized and Bureau-turned, wearing your methods and now their badge. The circle closes: your shadow is on the payroll of the people you fear most.' },
            'You palm the device. You know. Now you have to decide what knowing is worth.',
          ],
          effects: [{ flag: 'a3.wire_confronted' }],
        },
        talked: {
          speaker: 'narrator',
          text: [
            'You miss it. You talk the way you always talk in that room — free, easy, damning — for a full hour before the wrongness registers, and by then the tape is full of you.',
            'Somewhere, an evidence bag gets a new sticker with your handle on it.',
          ],
          effects: [
            { flag: 'a3.incriminated' },
            { flag: 'a3.wire_confronted' },
            { quest: 'side_a3_wire_fallout', start: true },
            { scene: 'a3_wire_fallout', delayHours: 96 },
          ],
        },
        burned_bureau: {
          speaker: 'narrator',
          text: [
            'You perform the best hour of your life. Every word is a gift-wrapped lie: names that don\'t exist, a heist that never happens, a mole two floors up who is entirely invented.',
            'The Bureau spends three months and a small budget chasing a ghost you built for them out of spare parts. When the wire wearer plays the tape back, they hear you signing off — with a soft, familiar *hugz*, aimed like a knife.',
          ],
          effects: [{ flag: 'a3.wire_confronted' }],
        },
        burned_you: {
          speaker: 'narrator',
          text: [
            'Your story is too clever by half. The wearer\'s handler — Marlow, you\'d bet — smells the performance and marks you as the one who tried to game the tape.',
            'They don\'t arrest you. They do something worse: they get patient, and specific, and they start pulling on your threads.',
          ],
          effects: [
            { flag: 'a3.wire_confronted' },
            { faction: 'fac.bureau', add: -5 },
            { quest: 'side_a3_wire_fallout', start: true },
            { scene: 'a3_wire_fallout', delayHours: 96 },
          ],
        },
        cut: {
          speaker: 'narrator',
          text: [
            'You don\'t confront them. You just close the door — no calls returned, no seat saved, no reason given. Let them wonder if you know.',
            'It is the coldest thing you have done, and the safest, and both of those will keep you company for a long time.',
          ],
          effects: [{ flag: 'a3.wire_confronted' }],
        },
      },
    },
    // ── The mirror (CP-C2b) ────────────────────────────────────────────────
    {
      id: 'a3_mirror',
      channel: 'dialog',
      title: 'mirror',
      start: 'open',
      nodes: {
        open: {
          speaker: 'mirror',
          text: [
            { if: { all: [mirrorIs('jax'), wireIs('jax')] }, text: 'It\'s the same face twice over: the wire and the mirror are one person, and that person is your best friend. The knife and the reflection, both Jax.' },
            { if: { all: [mirrorIs('mira'), wireIs('mira')] }, text: 'The wire and the mirror are one. Mira learned your methods AND turned them on you, and did both so quietly you never felt the floor tilt.' },
            { if: { all: [mirrorIs('byteme'), wireIs('byteme')] }, text: 'The kid was the wire and the mirror both. He kept up with you, and then he kept score, and you were too busy to notice either.' },
            'A message, on a channel you never gave anyone. "We took the same first job, you and me. I just didn\'t stop to make friends. Ready to see who that made us?"',
            { if: mirrorIs('jax'), text: 'It\'s Jax. Every time you forgot to call back, he got a little better at being you — until being you was all he had left.' },
            { if: mirrorIs('mira'), text: 'It\'s Mira. She learned your methods completely, the way she learns everything, and then she used them to stay one clean step ahead.' },
            { if: mirrorIs('byteme'), text: 'It\'s byteme, grown up alone. The worship curdled into competition somewhere you weren\'t looking.' },
            { if: mirrorIs('stranger'), text: 'It\'s l33tKÎLLƏR — the flamer from your first month, Marcus Doyle, who never once let you see how carefully he was keeping score.' },
          ],
          effects: [{ flag: 'a3.mirror_revealed' }],
          choices: [
            {
              tag: '[Reveal]',
              text: '"Mira, it\'s me." Drop every pretense and remind her who you were before all this.',
              if: { all: [mirrorIs('mira'), { flag: 'npc.mira.trusts' }] },
              effects: [
                { flag: 'mir.outcome', set: 'redeemed' },
                { npc: 'mira', affinity: 10 },
                { log: 'The mask comes off, on both sides. The oldest thing you two ever shared turns out to be the truest.', kind: 'story' },
              ],
              goto: 'redeemed',
            },
            {
              tag: '[Defeat]',
              text: 'End it. Beat them at the thing that made them — cleanly, completely, cruelly if you have to.',
              effects: [
                { flag: 'mir.outcome', set: 'defeated' },
                { flag: 'mir.pyrrhic' },
                { stat: 'mood', add: -8 },
              ],
              goto: 'defeated',
            },
            {
              tag: '[Social DC 20]',
              text: 'Turn them. Use everything you share to bring the shadow back into the light.',
              check: {
                skill: 'social',
                dc: 20,
                bonuses: [
                  { if: mirrorIs('jax'), add: 3, label: '+3 (a lifetime of history with Jax)' },
                  { if: { flag: 'npc.mira.trusts' }, add: 3, label: '+3 (Mira trusts you)' },
                ],
                success: 'redeemed',
                fail: 'turn_fail',
                successEffects: [{ flag: 'mir.outcome', set: 'redeemed' }],
              },
            },
            {
              tag: '[Mercy]',
              text: 'Let them win this one — because winning it yourself would cost a life you can\'t spend.',
              effects: [
                { flag: 'mir.outcome', set: 'truce' },
                { flag: 'mir.mercy' },
              ],
              goto: 'truce',
            },
            {
              tag: '[Walk away]',
              text: 'Refuse the confrontation entirely. Log off. Let them think what they like.',
              effects: [{ flag: 'mir.outcome', set: 'victorious' }],
              goto: 'ignored',
            },
          ],
        },
        redeemed: {
          speaker: 'mirror',
          text: '"…Okay," they type, after a silence long enough to hear the modem breathe. "Okay. Half a step behind you, then. It\'s where I always was anyway." The shadow becomes an ally, and a strange peace settles where the rivalry used to be.',
        },
        defeated: {
          speaker: 'narrator',
          text: 'You take them apart at their own game, and it works, and it is hollow in exactly the way you feared. You won. The reflection cracks and goes dark, and you learn what it costs to break the only person who truly understood you.',
        },
        turn_fail: {
          speaker: 'mirror',
          text: [
            'You reach for the history between you, and it isn\'t enough — or it\'s too much. They flinch from it. "Don\'t," they say. "You don\'t get to make this nice now."',
            'The channel closes. They stay the shadow, unturned, out there matching you still. Some walls you built too well to talk through.',
            'And now they know exactly where you are soft. You can feel them file it away.',
          ],
          effects: [
            { flag: 'mir.outcome', set: 'victorious' },
            // Spurned, the mirror stops matching you and starts hunting you (read by the heist and the finale).
            { flag: 'a3.mirror_spurned' },
            { stat: 'mood', add: -5 },
            { scene: 'a3_mirror_retrospective', delayHours: 48 },
          ],
        },
        truce: {
          speaker: 'narrator',
          text: 'You throw the match on purpose, and let them have the win, because the alternative was a body. They know you did it. Neither of you says so. It is the first thing you have ever shared that isn\'t a rivalry.',
        },
        ignored: {
          speaker: 'narrator',
          text: 'You close the window without answering. The confrontation you didn\'t have becomes a win they didn\'t earn, and they notice — the silence says more than any beating would have.',
        },
      },
    },
    // ── Fallout: the federal letter (CP-C2a fail) ──────────────────────────
    {
      id: 'a3_wire_fallout',
      channel: 'mail',
      title: 'CERTIFIED: Notice to Subject of Grand Jury Investigation',
      from: 'Office of the U.S. Attorney, Port Lumen',
      pause: true,
      expiresDays: 14,
      onExpire: [
        { trait: 'pkg03_act3_on_the_tape' },
        { flag: 'a3.wire_fallout_done' },
        { chance: 0.5, then: [{ complication: 'legal' }] },
      ],
      start: 'letter',
      nodes: {
        letter: {
          speaker: 'Office of the U.S. Attorney, Port Lumen',
          text: [
            'RE: In the Matter of the Grand Jury Investigation No. 04-GJ-117',
            'You are hereby advised that you are a SUBJECT of an investigation being conducted by a federal grand jury sitting in the Western District. A "subject" is a person whose conduct is within the scope of the grand jury\'s investigation. You are invited, but not required, to contact this office.',
            { if: { flag: 'a3.incriminated' }, text: 'Enclosed as a courtesy: transcript excerpt, pages 14 through 16. Your handle has been highlighted in yellow. Someone used a ruler.' },
            { if: { flag: 'fac.bureau.onto_you_hard' }, text: 'Also enclosed: a copy of the subpoena served on your internet provider, your bank, and — in a touch you take personally — the Port Lumen Public Library, for your borrowing history since 1999.' },
            'The letter is signed in blue ink by an Assistant U.S. Attorney whose name you look up, and who has never lost a computer case. There is a phone number at the bottom. It is a direct line. They want you to notice that.',
          ],
          choices: [
            {
              tag: '[Lawyer up · $2,500 + retainer]',
              text: 'Call Abigail Stroud, who defended half the \'94 board and won most of it back on appeal.',
              req: { stat: 'money', gte: 2500 },
              reqText: 'Requires $2,500 for the retainer',
              effects: [
                { money: -2500 },
                { obligation: { id: 'pkg03_act3_counsel', label: 'Legal retainer (Stroud & Pell)', perDay: 30, days: 120 } },
                { flag: 'a3.tape_contained' },
                { stat: 'heat', add: -8 },
                { flag: 'a3.wire_fallout_done' },
              ],
              goto: 'counsel',
            },
            {
              tag: '[Social DC 17]',
              text: 'Call the direct line yourself. Be boring. Be cooperative about nothing. Talk your way out of being interesting.',
              check: {
                skill: 'social',
                dc: 17,
                bonuses: [
                  { if: { trait: 'silver_tongue' }, add: 1, label: '+1 (you could bore a prosecutor to tears)' },
                  { if: { flag: 'a3.incriminated' }, add: -2, label: '−2 (they have an hour of you on tape)' },
                ],
                success: 'talked_down',
                fail: 'talked_worse',
                successEffects: [{ flag: 'a3.tape_contained' }, { stat: 'heat', add: -5 }, { flag: 'a3.wire_fallout_done' }],
                failEffects: [
                  { trait: 'pkg03_act3_on_the_tape' },
                  { flag: 'fac.bureau.onto_you_hard' },
                  { stat: 'heat', add: 10 },
                  { complication: 'legal' },
                  { flag: 'a3.wire_fallout_done' },
                ],
              },
            },
            {
              tag: '[Ignore]',
              text: 'Put the letter in a drawer. Change nothing. If they were going to arrest you, they would have.',
              effects: [
                { trait: 'pkg03_act3_on_the_tape' },
                { stat: 'stress', add: 6 },
                { chance: 0.5, then: [{ complication: 'legal' }] },
                { flag: 'a3.wire_fallout_done' },
              ],
              goto: 'drawer',
            },
          ],
        },
        counsel: {
          speaker: 'Abigail Stroud, Esq.',
          text: [
            '"Don\'t call them. Don\'t write to them. Don\'t post about them on that bulletin board of yours, and yes, I know about the bulletin board." Stroud talks like a woman billing in six-minute increments, because she is.',
            '"A tape isn\'t a case. A tape is a tape. My job is to make sure it stays a tape." She does. It costs you every week, like rent on a room you never get to sleep in. The tape stays in its locker. So does your name, mostly.',
          ],
        },
        talked_down: {
          speaker: 'narrator',
          text: [
            'You call. You are polite, vague, and so profoundly uninteresting for forty minutes that you can hear the Assistant U.S. Attorney start doing something else with her other hand.',
            '"Thank you for your time," she says at last, in the voice people use to end a call with a timeshare salesman. The file does not close. But it slides to the bottom of a very tall pile, which in federal terms is almost the same thing.',
          ],
        },
        talked_worse: {
          speaker: 'narrator',
          text: [
            'You call, and you are clever, and clever is the one thing you should not have been. Every careful non-answer tells her exactly which questions matter. She thanks you warmly. She sounds, for the first time, interested.',
            'Two weeks later a second subpoena goes out, for things you did not know anyone knew to ask for. You are not a subject anymore. You are a project.',
          ],
        },
        drawer: {
          speaker: 'narrator',
          text: 'The letter goes in the drawer under the phone book. You do not open the drawer again. You find, over the following months, that you do not like talking in rooms you did not check first — and that the heat on your name never quite cools all the way, as if someone keeps a hand on it.',
        },
      },
    },
    // ── Fallout: the spurned mirror goes public (CP-C2b fail) ──────────────
    {
      id: 'a3_mirror_retrospective',
      channel: 'forum',
      board: 'general',
      title: 'RETROSPECTIVE: one handle\'s greatest hits, 2001-present',
      from: 'mirror',
      start: 'post',
      nodes: {
        post: {
          speaker: 'mirror',
          text: [
            'figured the new kids should know who they\'re copying. a retrospective, lovingly archived, every post timestamped. i kept everything. i always keep everything.',
            '  exhibit A: first week on the board. a "tutorial" so wrong it became a meme.',
            { if: { flag: 'a1.posted_cringe' }, text: '  exhibit A.5: THE post. you know the one. i have it in three formats.' },
            '  exhibit B: the crack that bricked in front of everyone. screenshots.',
            '  exhibit C: every contract i sniped off you, with dates. 14 of them. you noticed maybe four.',
            'no hard feelings. i just thought a legend should have a complete bibliography.',
            '-- mirror | "we took the same first job. i just didn\'t stop to make friends."',
          ],
          choices: [
            {
              tag: '[Own it]',
              text: 'Reply with your own worst code, fully annotated: "we all started somewhere. here\'s where i started."',
              effects: [{ stat: 'cred', add: 3 }, { faction: 'fac.loft', add: 3 }, { stat: 'stress', add: -2 }],
              goto: 'own_it',
            },
            {
              tag: '[Flame]',
              text: 'Answer in kind. You have been keeping a little archive of your own.',
              effects: [{ stat: 'cred', add: 2 }, { faction: 'fac.loft', add: -4 }, { stat: 'heat', add: 4 }, { flag: 'a3.mirror_flamewar' }],
              goto: 'flame',
            },
            {
              tag: '[Ignore]',
              text: 'Say nothing. Let the thread sink under the warez requests.',
              effects: [{ stat: 'cred', add: -5 }, { stat: 'mood', add: -3 }],
              goto: 'sink',
            },
          ],
        },
        own_it: {
          speaker: 'narrator',
          text: [
            {
              if: { all: [{ npc: 'corvid', met: true }, { npc: 'corvid', fateNot: ['exile', 'martyred', 'bought'] }] },
              text: 'Corvid pins your reply and locks the thread under it. Her only comment: "This is what a scene looks like. Everyone was bad once. Some of us admit it."',
              else: 'A moderator pins your reply and locks the thread under it with one line: "this is what a scene looks like. everyone was bad once."',
            },
            'The new kids post their own worst code under yours for a week. mirror does not post again. Somewhere they are still keeping score, and they have just lost a point, and they know it.',
          ],
        },
        flame: {
          speaker: 'narrator',
          text: [
            'Forty-one replies by midnight, ASCII skulls, a moderator warning, a poll. Half the board picks a side. The other half picks both and sells popcorn.',
            'You win the thread. It feels like winning a thread. By morning mirror has quietly moved on from the board to somewhere you can\'t see — which, you realize later, was the point of starting it.',
          ],
        },
        sink: {
          speaker: 'narrator',
          text: 'The thread gets ninety replies without you. Some are kind. The ones that aren\'t get quoted in other threads for months. The new kids learn your handle as a punchline first and a person second, and you let it happen, and you notice that you let it happen.',
        },
      },
    },
  ],
})
