/**
 * PKG-05 — fac_loft_q2_schism, "Sell or Burn" (bible §7.1 step 2).
 *
 * The Loft's founding argument, out loud at last: Corvid wants the scene to stay a commons;
 * Switch wants it to get paid before Aperture takes it for free. Backing a side forks the arc
 * and gates the endgame lanes.
 *  - back Corvid → `fac.loft.side_corvid`
 *  - back Switch → `fac.loft.side_switch`, Corvid affinity −10, opens the sell lane, `w.enclosure +1`
 */
import { defineContent } from '@/engine/registry'
import type { Effect, SceneDef } from '@/engine/types'
import { LOFT } from './common'

const backCorvid: Effect[] = [
  { flag: 'fac.loft.side_corvid' },
  { flag: 'npc.switch.converted' },
  { faction: LOFT, add: 5 },
  { npc: 'corvid', affinity: 8 },
  { npc: 'switch', affinity: -4 },
  { flag: 'fac.loft.q2_done' },
]

const backSwitch: Effect[] = [
  { flag: 'fac.loft.side_switch' },
  { npc: 'switch', affinity: 12 },
  { npc: 'corvid', affinity: -10 },
  { var: 'w.enclosure', add: 1 },
  { flag: 'fac.loft.q2_done' },
]

const stayNeutral: Effect[] = [{ flag: 'fac.loft.q2_hedged' }, { flag: 'fac.loft.q2_done' }]

const threadRead: Effect = { flag: 'fac.loft.q2_thread_read' }

const scenes: SceneDef[] = [
  // ── The thread that starts it ───────────────────────────────────────────
  {
    id: 'loft_q2_proposal',
    channel: 'forum',
    board: 'warez',
    title: 'PROPOSAL: we get paid (read before you flame)',
    from: 'switch',
    start: 'p1',
    expiresDays: 4,
    onExpire: [threadRead, { log: 'The Loft\'s "get paid" thread ran to eleven pages without you. The argument moves to the back room.', kind: 'story' }],
    nodes: {
      p1: {
        speaker: 'switch',
        text: [
          'Long post. Sorry. Not sorry.',
          'Count the handles on the "who\'s online" list tonight. Now count them in 1999. I\'ll wait. We didn\'t lose those people to the cops. We lost them to salaries. Aperture has a recruiter who reads this board — hi, Kevin from HR, love the tie — and she\'s picking us off one at a time with dental plans.',
          'So here\'s my radical idea: we sell the work before they buy the workers. Group contracts. Real invoices. The Loft becomes a shop instead of a charity with a couch.',
          'Flame away. Then come to the back room Tuesday and flame me in person.',
          '-- switch :: "information wants to be free. i want to be paid. we can both get what we want"',
        ],
        next: 'p2',
      },
      p2: {
        speaker: 'byteme',
        text: 'wait do i get dental. i just turned 18 do i get dental now. asking for me',
        next: 'p3',
      },
      p3: {
        speaker: 'deadline',
        text: [
          'Every scene that ever died, died on a thread titled PROPOSAL.',
          'In \'93 it was the Harbor Street crew. They got paid. Then the people paying them got subpoenaed. Guess whose invoices were in the box.',
          '-- deadline :: back up your LIFE not your data',
        ],
        next: 'p4',
      },
      p4: {
        speaker: 'mira',
        text: [
          '{nick:switch} isn\'t wrong about the numbers. He\'s wrong about who ends up owning the shop.',
          'Also "Kevin from HR" is a real person and he does read this board and he is going to be so hurt.',
        ],
        next: 'p5',
      },
      p5: {
        speaker: 'corvid',
        text: [
          'Tuesday. Back room. Everyone who wants a say, come and say it to faces.',
          'This thread is locked after tonight. Not because it\'s wrong to ask. Because some things shouldn\'t be decided by whoever types fastest at 3 a.m.',
          '-- Corvid :: sysop :: keep the commons',
        ],
        choices: [
          {
            text: 'Reply: "Tuesday. I\'ll be there."',
            effects: [threadRead, { npc: 'corvid', affinity: 1 }],
            goto: 'r_there',
          },
          {
            text: 'Reply: "switch has a point. broke is broke."',
            effects: [threadRead, { npc: 'switch', affinity: 3 }, { flag: 'fac.loft.q2_posted_switch' }],
            goto: 'r_switch',
          },
          {
            text: 'Reply: "deadline has a point. invoices are evidence."',
            effects: [threadRead, { npc: 'deadline', affinity: 3 }, { flag: 'fac.loft.q2_posted_corvid' }],
            goto: 'r_deadline',
          },
          {
            tag: '[Leave]',
            text: 'Lurk. Say it to faces on Tuesday.',
            effects: [threadRead],
          },
        ],
      },
      r_there: {
        speaker: 'byteme',
        text: 'me too. i will bring donuts. i will NOT bring my dental records',
      },
      r_switch: {
        speaker: 'switch',
        text: 'See? One person on this board can add. Tuesday. Bring a calculator and an open mind, in that order.',
      },
      r_deadline: {
        speaker: 'deadline',
        text: 'Thank you. Somebody put that on a t-shirt. Don\'t put your handle on the t-shirt.',
      },
    },
  },
  {
    id: 'loft_q2_schism',
    channel: 'dialog',
    title: 'The Back Room — Sell or Burn',
    from: 'corvid',
    start: 'open',
    nodes: {
      open: {
        speaker: 'narrator',
        text: [
          'The back room above the pager shop, a Tuesday, the good kind of late. The couch is at capacity. Somebody has brought a box of donuts and lost the argument about who gets the maple one.',
          'It stops being a normal night when Switch stands up. He doesn\'t stand up. He\'s a leans-in-the-doorway person. Tonight he stands up.',
        ],
        next: 'switch_opens',
      },
      switch_opens: {
        speaker: 'switch',
        text: [
          '"Okay. Somebody has to say it, so it\'s me. Half the people who used to be in this room are gone. You know where they went? They didn\'t quit. They got jobs. Real ones, at places with fountains, doing exactly what we do here, for money and dental."',
          '"Aperture is hiring the whole scene one handle at a time and calling it a career. In two years there won\'t be a Loft to keep a commons for. So I\'m saying it: let\'s get paid first. Let\'s be the ones who sell the work, before the work sells us."',
        ],
        next: 'corvid_answers',
      },
      corvid_answers: {
        speaker: 'corvid',
        text: [
          'Corvid doesn\'t stand. She never stands.',
          '"The moment you can buy a seat in this room, this room is worth buying. That\'s the whole trick, Ray. It\'s not that they want the tools. They want the list. They want to know who trusts who, and the only way to sell them that is to stop being a place where trust is free."',
          '"Burn it before you sell it. I mean that literally. I have wiped this board to bare metal twice and I will do it a third time before I let it become an org chart."',
        ],
        next: 'to_you',
      },
      to_you: {
        speaker: 'narrator',
        text: [
          'The room turns to look at you, which is new, and which you notice you don\'t entirely hate.',
          { if: { flag: 'npc.switch.courted' }, text: 'Switch tilts his head. You took his side once before, in this same room. He remembers.' },
          { if: { flag: 'a1.diplomat' }, text: 'You have a reputation, lightly, as the one who doesn\'t pick sides. Two faces watch to see if it holds.' },
          { if: { flag: 'fac.aperture.client' }, text: 'You have taken Aperture\'s money. Nobody in this room knows that. You are suddenly very aware of it.' },
          { if: { flag: 'fac.loft.new_locks' }, text: 'Your key to the new lock downstairs still has the hardware-store tag on it. You paid for that lock. Everyone in this room knows why.' },
          { if: { flag: 'fac.bureau.wired_loft' }, text: 'There is no wire on you tonight. You checked twice in the stairwell. Your hand keeps drifting to your collar anyway.' },
        ],
        choices: [
          {
            text: '"Corvid\'s right. The second it has a price, it\'s theirs. Keep the commons."',
            effects: backCorvid,
            goto: 'chose_corvid',
          },
          {
            text: '"Switch is right. Broke and pure is still broke. Get the scene paid while it still can be."',
            effects: backSwitch,
            goto: 'chose_switch',
          },
          {
            tag: '[Business DC 15]',
            text: '"You\'re both right, and you both know it. There\'s a version where we sell the work and never the list. Let me draw it."',
            check: {
              skill: 'business',
              dc: 15,
              bonuses: [
                { if: { flag: 'fac.aperture.client' }, add: 2, label: '+2 (you\'ve seen how they pay)' },
                { if: { flag: 'a1.diplomat' }, add: 1, label: '+1 (they trust you not to have a side)' },
              ],
              success: 'coop',
              fail: 'coop_fail',
              failEffects: [{ trait: 'pkg05_loft_miracle_arrow' }, { flag: 'fac.loft.coop_botched' }, { stat: 'mood', add: -4 }],
            },
          },
          {
            tag: '[Truth]',
            text: '"Before anybody votes: Aperture already tried to buy me. I said no, and I told Corvid. This isn\'t hypothetical. They\'re in the room already."',
            if: { flag: 'a2.refused_kroll' },
            effects: [...backCorvid, { faction: LOFT, add: 3 }, { npc: 'switch', affinity: 2 }],
            goto: 'truth_told',
          },
          {
            tag: '[Truth]',
            text: 'Tell them you took Aperture\'s money — and what it bought.',
            if: { not: { flag: 'a2.refused_kroll' } },
            req: { flag: 'a2.refused_kroll' },
            reqText: 'Requires having turned Aperture down (and told Corvid)',
          },
          {
            text: '"Not my call. This is your board, both of yours. I\'ll live with whatever the room decides."',
            effects: stayNeutral,
            goto: 'neutral',
          },
        ],
      },
      truth_told: {
        speaker: 'narrator',
        text: [
          'The room goes very still. Somebody puts down a donut.',
          'Switch opens his mouth, closes it, and sits back down in the doorway he never sits in. "They came to you," he says. "Directly. And you said no." It isn\'t a question, and his whole speech is lying on the floor between you.',
        ],
        next: 'chose_corvid',
      },
      chose_corvid: {
        speaker: 'corvid',
        text: [
          'Corvid nods once, which from her is a standing ovation.',
          '"Then it stays a commons. Thank you. It costs something to say that in a room where the other guy is holding donuts and a business plan."',
        ],
        next: 'switch_loses',
      },
      switch_loses: {
        speaker: 'switch',
        text: '"Sure. Great. Enjoy the commons." He picks up the maple donut, finally, out of spite. "When the fountain people come for you one at a time, remember I offered you a union first."',
      },
      chose_switch: {
        speaker: 'switch',
        text: [
          'Switch grins like a calculator watch.',
          '"Finally. Somebody in this room can add." He claps you on the shoulder. "We do this careful. We sell the work, not the people. I mean that. I\'m not the villain here."',
        ],
        next: 'corvid_loses',
      },
      corvid_loses: {
        speaker: 'corvid',
        text: [
          'Corvid looks at you for a long moment. Not angry. Worse.',
          '"You will mean to sell the work and not the people. Everyone means that. Then one month rent is short and a name is worth four hundred dollars." She stands up, which she never does. "Keep the lights on. Don\'t sell the building." And she leaves.',
        ],
      },
      coop: {
        speaker: 'narrator',
        text: [
          'You take the whiteboard nobody uses and draw it: a co-op. The Loft contracts real work as a group, splits the pay, and the client never learns a single real name — the board fronts every job under one throwaway handle that belongs to nobody.',
          'Switch studies it. Corvid studies Switch studying it.',
        ],
        next: 'coop_reactions',
      },
      coop_reactions: {
        speaker: 'switch',
        text: '"...huh." He taps the board. "That pays. That actually pays, and nobody\'s name is on it." He looks almost betrayed to agree. "Corvid?"',
        next: 'coop_corvid',
      },
      coop_corvid: {
        speaker: 'corvid',
        text: [
          '"It sells the work and not the list." She says it slowly, testing it for cracks, and doesn\'t find one tonight. "It\'s not a commons. But it\'s not a market either. It\'s a co-op. I can live under a co-op."',
          '"You bought us a few years, whoever you are. Don\'t let the few years make you lazy."',
        ],
        choices: [
          {
            text: 'Take it as a win for both of them.',
            effects: [
              { flag: 'fac.loft.coop' },
              { flag: 'fac.loft.side_corvid' },
              { flag: 'npc.switch.converted' },
              { faction: LOFT, add: 12 },
              { npc: 'corvid', affinity: 6 },
              { npc: 'switch', affinity: 6 },
              { flag: 'fac.loft.q2_done' },
            ],
          },
        ],
      },
      coop_fail: {
        speaker: 'narrator',
        text: [
          'You draw the co-op. It\'s a good idea. You explain it badly — too many boxes, a legend nobody asked for, and one long arrow between "we take the job" and "nobody\'s name is on it" that you have, God help you, actually labeled "and then a miracle happens."',
          'You don\'t notice the label until byteme reads it out loud, reverently, like scripture.',
        ],
        next: 'coop_fail_switch',
      },
      coop_fail_switch: {
        speaker: 'switch',
        text: '"Is that arrow load-bearing?" Switch leans in, delighted and furious at once. "Because that arrow is my entire proposal, and you just drew it as a magic trick. Thanks. Really. I\'ll never get a straight hearing in this room again."',
        next: 'coop_fail_corvid',
      },
      coop_fail_corvid: {
        speaker: 'corvid',
        text: [
          '"I\'ve seen that arrow before." Corvid doesn\'t laugh, which is how you know it\'s bad. "Harbor Street, \'93. A very nice man drew it on a napkin. Then the people paying him got subpoenaed."',
          'The room drifts. The argument you tried to dissolve hardens into two camps, and you stand in the gap holding a marker while somebody photographs the whiteboard "for the archive." By morning the arrow will be a board meme. By next year it will be a legend. Somebody has to pick. Even you.',
        ],
        choices: [
          {
            text: '"...fine. Corvid. Keep the commons."',
            effects: [...backCorvid, { npc: 'switch', affinity: -3 }],
            goto: 'chose_corvid',
          },
          {
            text: '"...fine. Switch. Get us paid."',
            effects: [...backSwitch, { npc: 'corvid', affinity: -3 }],
            goto: 'chose_switch',
          },
          {
            text: '"I\'m out of my depth. It\'s your room." Step back.',
            effects: [...stayNeutral, { faction: LOFT, add: -2 }],
            goto: 'neutral',
          },
        ],
      },
      neutral: {
        speaker: 'narrator',
        text: [
          'You keep your hands up and your mouth shut, and the room settles into an uneasy draw. Corvid still runs the board; Switch still runs the trades; the donuts are gone.',
          'Nobody won. The argument just goes back to sleep, the way it always does, waiting for the next month rent is short.',
        ],
      },
    },
  },
]

export default defineContent({
  scenes,
  quests: [
    {
      id: 'fac_loft_q2_schism',
      title: 'Sell or Burn',
      kind: 'faction',
      faction: 'fac.loft',
      giver: 'corvid',
      act: 2,
      summary: 'The Loft\'s oldest argument finally happens out loud. Corvid wants a commons. Switch wants the scene to get paid. Which future do you back?',
      rewards: 'Sets the Loft\'s direction; Corvid or Switch affinity',
      priority: 20,
      autoStart: { all: [{ quest: 'fac_loft_q1_prove', status: 'completed' }, { faction: LOFT, gte: 25 }, { var: 'act', gte: 2 }] },
      start: 'thread',
      stages: {
        thread: {
          text: 'Switch has posted a PROPOSAL on the members board, and the thread is already on page six. Everyone has an opinion. Nobody has said theirs to anybody\'s face yet.',
          onEnter: [{ scene: 'loft_q2_proposal', delayHours: 8 }],
          objectives: [
            {
              id: 'read',
              text: 'Read Switch\'s thread on the Loft board',
              when: { flag: 'fac.loft.q2_thread_read' },
              hint: 'Open the Forum and look under Warez · Members Only. Reply, or just lurk; either way, Tuesday is coming.',
            },
          ],
          next: 'meet',
        },
        meet: {
          text: 'Switch has called a meeting he won\'t call a meeting, in the back room. Everyone knows what it\'s about. Nobody knows what you\'ll say.',
          onEnter: [{ scene: 'loft_q2_schism', delayHours: 12 }],
          objectives: [
            {
              id: 'decide',
              text: 'Take a side in the back room',
              when: { flag: 'fac.loft.q2_done' },
              hint: 'The scene arrives as a dialog. Back Corvid\'s commons, Switch\'s market, or try to thread the needle with a co-op ([Business DC 15]) — pitch it badly and the room will remember the pitch longer than the idea.',
            },
          ],
        },
      },
    },
  ],
})
