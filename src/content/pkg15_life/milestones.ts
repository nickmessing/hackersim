/**
 * PKG-15 — reactions to engine-driven life events (no bible number; §1.4 "failure is setback").
 *
 *  - life_first_job        the first time you're on anyone's payroll.
 *  - life_moving_out       the first night you sleep somewhere that isn't your parents' flat
 *                          (+ Mom's care package, `life_care_package`, two days later).
 *  - custody tracking      `life.in_custody` latches while jailed; on release:
 *      · life_raid_aftermath   if a raid happened since the last release (`sys.raids` vs `life.raids_seen`):
 *                              the first raid gets a full scene (coming home to the empty desk),
 *      · life_raid_again       later raids a shorter one,
 *      · life_jail_release     jail without a raid (a `{ jail }` story effect).
 *  - life_deep_debt        the engine's `sys.deep_debt` (money < −$2,000): who you turn to.
 *                          One episode at a time (`life.debt_episode`); loans add to `life.extraUpkeep`
 *                          and are paid off by a scheduled mail that removes exactly what they added.
 *  - life_debt_clear       the episode ends when you're back above zero.
 */
import { defineContent } from '@/engine/registry'
import type { Cond, SceneDef, TriggerDef } from '@/engine/types'
import { QUIET_RESET, around, atParents, close, momGone, momHere, withPartner } from './_shared'

/** True when the engine counter has moved past what we've narrated. */
function behind(engineVar: string, seenVar: string, max = 12): Cond {
  const rows: Cond[] = []
  for (let k = 1; k <= max; k++) rows.push({ all: [{ var: engineVar, gte: k }, { var: seenVar, lte: k - 1 }] })
  return { any: rows }
}

const scenes: SceneDef[] = [
  // ── life_first_job ───────────────────────────────────────────────────────
  {
    id: 'life_first_job',
    channel: 'mail',
    title: 'FIRST PAYCHECK!!!',
    from: 'mom',
    start: 'start',
    nodes: {
      start: {
        text: [
          `Honey,`,
          `Your father told me you are officially EMPLOYED. He said it at dinner like he was announcing a wedding. Then he went outside and stood on the stoop for ten minutes, which is what he does when he is too happy to sit still.`,
          { if: { jobTrack: 'odd' }, text: `I know it is only odd jobs for now. Your grandfather started sweeping the cannery floor and ended up running the whole third shift. Sweeping is how everybody starts.` },
          { if: { jobTrack: 'support' }, text: `Kim says you "fix people's computers for a living" now. I told Mrs. Alvarez. She has already written down your number. I am sorry in advance.` },
          { if: { jobTrack: ['dev', 'sysadmin', 'network', 'security'] }, text: `I don't understand the job title. I read it three times. I am telling everyone at the laundromat you are "in computers," which I think covers it.` },
          `Some advice from a woman who has done the books for thirty years: put a little away from every check. Even ten dollars. Future-you is a real person and she is going to be very tired.`,
          `Love,\nMom\n(Kim says to tell you she wants a "cut")`,
        ],
        choices: [
          { text: `Reply: "Taking you all to the Cathode on Friday. My treat."`, req: { stat: 'money', gte: 60 }, reqText: 'Requires $60', effects: [{ money: -60 }, { npc: 'mom', affinity: 4 }, { npc: 'dad', affinity: 3 }, { faction: 'fac.hood', add: 3 }, { stat: 'mood', add: 5 }] },
          { text: `Reply: "Ten dollars a check. Promise."`, effects: [{ npc: 'mom', affinity: 3 }, { stat: 'stress', add: -3 }] },
          { text: `Reply: "Tell Kim her cut is a burned CD."`, effects: [{ npc: 'mom', affinity: 1 }, { npc: 'kim', affinity: 2 }] },
        ],
      },
    },
  },
  {
    id: 'life_first_job_dad',
    channel: 'mail',
    title: 'proud of you',
    from: 'dad',
    start: 'start',
    nodes: {
      start: {
        text: [
          `Kid,`,
          `Heard you got a job. Your mother would have made a cake. I bought one. It is not as good. I ate some for both of us.`,
          `Show up on time. Fix what you say you'll fix. The rest takes care of itself.`,
          `Dad`,
        ],
        choices: [
          { text: `Reply: "Save me a slice. I'll come by Sunday."`, effects: [{ npc: 'dad', affinity: 5 }, { stat: 'mood', add: 3 }] },
          { text: `Reply: "Thanks, Dad."`, effects: [{ npc: 'dad', affinity: 2 }] },
        ],
      },
    },
  },

  // ── life_moving_out ──────────────────────────────────────────────────────
  {
    id: 'life_moving_out',
    channel: 'dialog',
    title: 'First Night',
    start: 'start',
    nodes: {
      start: {
        speaker: 'narrator',
        text: [
          `Your own place. Well: your own key, anyway.`,
          { if: { housing: 'dorm_room' }, text: `A dorm room on the Hill with cinderblock walls painted the color of weak tea, a roommate's bed that is currently a pile of laundry, and a window that looks out at the observatory dome. Somebody down the hall is playing the same song for the ninth time.` },
          { if: { housing: 'shared_room' }, text: `A room in a shared flat above a Sodium Row noodle shop. The walls are thin enough to hear your roommate's opinions about his ex. Everything smells faintly, permanently, of star anise.` },
          { if: { housing: ['studio_flat', 'millgate_onebed', 'harbor_loft', 'harbor_penthouse', 'cannery_house', 'millgate_condo', 'hill_house'] }, text: `Four walls that are all yours, a radiator that knocks like it wants to be let in, and a floor you can see the whole of from the door. It's the biggest room you've ever lived in, because it's the only one you've ever paid for.` },
          `Your computer is set up on a box that used to hold your computer. The phone jack works. It's quiet. It's so quiet. There's nobody to yell "get off the phone."`,
        ],
        choices: [
          {
            text: `Call home.`,
            if: { any: [momHere, around('dad')] },
            effects: [{ if: momHere, then: [{ npc: 'mom', affinity: 4 }], else: [{ npc: 'dad', affinity: 4 }] }, { stat: 'stress', add: -5 }],
            goto: 'call',
          },
          {
            text: `Throw a housewarming. Tonight. Everybody.`,
            if: around('jax'),
            effects: [{ npc: 'jax', affinity: 5 }, { stat: 'mood', add: 8 }, { stat: 'energy', add: -15 }, { money: -40 }],
            goto: 'party',
          },
          {
            text: `Stay up until 5 a.m. because nobody can stop you.`,
            effects: [{ stat: 'mood', add: 6 }, { stat: 'energy', add: -20 }, { xp: 'programming', add: 30 }],
            goto: 'late',
          },
          {
            text: `Lie on the floor and look at the ceiling for a while.`,
            effects: [{ stat: 'stress', add: -8 }, { stat: 'mood', add: 2 }],
            goto: 'floor',
          },
        ],
      },
      call: {
        speaker: 'narrator',
        text: [
          { if: momHere, text: `Mom picks up on the first ring. "Are you eating?" You've been gone six hours. "I'm fine, Ma." "Kim is already in your room. She says it's a 'studio' now. She's put up a poster." A pause. "It's very quiet here without the modem," she says, and you both pretend that's a complaint.`, else: `Dad picks up after a while. "Kid." You tell him about the radiator. He tells you exactly how to bleed it, with a butter knife, in detail, for eleven minutes. It's the most he's said to you in a month. You don't have a butter knife. You go buy one.` },
        ],
      },
      party: {
        speaker: 'jax',
        text: `Jax arrives with a folding table, a case of soda and eleven people, four of whom you know. Somebody brings a lava lamp as a gift. Somebody else brings a single, enormous cactus. By 2 a.m. there are people asleep in your bathtub, your one chair and your closet. Jax, from the floor: "This is the good part. Remember I said. This is the good part."`,
      },
      late: {
        speaker: 'narrator',
        text: `You code until the sky goes grey over the rooftops. Nobody knocks. Nobody sighs. Nobody turns off the router "for your own good." At five you eat cereal out of the box standing up at the window, watching the first bus go by, and feel like the king of a very small, very messy country.`,
      },
      floor: {
        speaker: 'narrator',
        text: `The ceiling has a water stain shaped roughly like the Lumen Sound. You lie there and look at it. You can hear the city: a siren, a bus, somebody laughing on a fire escape. For eighteen years every sound around you belonged to your family. Now they're strangers' sounds. It's lonely. It's also, somehow, the best feeling you've ever had.`,
      },
    },
  },
  {
    id: 'life_care_package',
    channel: 'mail',
    title: 'Care package (DO NOT OPEN UPSIDE DOWN)',
    from: 'mom',
    start: 'start',
    nodes: {
      start: {
        text: [
          `Honey,`,
          `There is a box at your door. Inside: soup (frozen, eat by Thursday), rice (you have no rice, I know you have no rice), a blanket, three lightbulbs, a first aid kit, and the good scissors, which I want BACK.`,
          `Also a roll of quarters for the laundry machine. Separate your whites. You won't. Try.`,
          `Your room is exactly how you left it. Kim has not moved in. (Kim has moved in.)`,
          `Love, Mom`,
        ],
        effects: [{ stat: 'health', add: 4 }, { stat: 'mood', add: 5 }],
        choices: [
          { text: `Reply: "Got it. Eating the soup right now. Love you."`, effects: [{ npc: 'mom', affinity: 3 }] },
          { text: `Reply: "I'm keeping the scissors."`, effects: [{ npc: 'mom', affinity: 2 }, { stat: 'mood', add: 2 }] },
        ],
      },
    },
  },

  // ── Release after a raid ────────────────────────────────────────────────
  {
    id: 'life_raid_aftermath',
    channel: 'dialog',
    title: 'The Empty Desk',
    start: 'start',
    nodes: {
      start: {
        speaker: 'narrator',
        text: [
          `They let you out at six in the morning with your belt and shoelaces in a paper bag. The air smells like diesel and rain. You walk home because you don't have bus fare, because they took your wallet's cash as "evidence."`,
          `Your door has a new lock, courtesy of the city, and a copy of the warrant taped to it. Inside, your room looks like a mouth with the teeth pulled. There's a clean rectangle in the dust on the desk where your tower used to sit. The cables are still there, plugged into nothing.`,
          `They took the machine, the drives, the boxes of discs. They left your posters, your mattress, and a single floppy under the bed that says TAXES 2001, which they apparently decided wasn't interesting. You sit on the floor for a long time.`,
          { if: { all: [atParents, momHere] }, text: `Mom has swept the room. She's put the chair back straight and folded the clothes they pulled out of your drawers. She doesn't say anything when you come in. She just puts a bowl of rice porridge on the floor next to you and sits down on the bed.` },
          { if: withPartner, text: `Your partner is sitting on your steps when you get there, in the rain, with two coffees, one of them cold. They've been there since dawn.` },
          { if: { all: [{ not: withPartner }, close('jax', 30)] }, text: `Jax shows up an hour later with his old beige tower in his arms like a sleeping kid. "It's slow," he says. "It's ugly. It's yours. Don't argue."` },
        ],
        choices: [
          {
            text: `Take the loaner machine and start over from nothing.`,
            if: close('jax', 30),
            effects: [{ item: 'beige_pc_p2' }, { item: 'hdd_4gb' }, { npc: 'jax', affinity: 5 }, { stat: 'mood', add: 5 }],
            goto: 'rebuild',
          },
          {
            text: `Talk about it. Out loud, to someone who isn't a cop.`,
            if: { any: [momHere, withPartner, close('jax', 30), close('kim', 30)] },
            effects: [{ stat: 'stress', add: -15 }, { stat: 'mood', add: 4 }],
            goto: 'talk',
          },
          {
            text: `Inventory what's left. Every backup, every hiding place, every mistake.`,
            tag: '[OpSec]',
            check: {
              skill: 'opsec',
              dc: 13,
              bonuses: [{ if: { trait: 'paranoid' }, add: 2, label: '+2 (you always had a plan for this)' }],
              success: 'inventory',
              fail: 'inventory_bad',
              successEffects: [{ xp: 'opsec', add: 40 }, { stat: 'stress', add: -5 }],
              failEffects: [{ stat: 'stress', add: 6 }, { stat: 'mood', add: -4 }, { trait: 'pkg15_life_paranoid_sleeper' }],
            },
          },
          {
            text: `Sleep. Just sleep.`,
            effects: [{ stat: 'energy', add: 25 }, { stat: 'stress', add: -8 }],
            goto: 'sleep',
          },
        ],
      },
      rebuild: {
        speaker: 'narrator',
        text: `Jax's old tower wheezes when you turn it on, like an old dog getting up. It has a sticker of a cartoon frog on the side and a hard drive full of his save games. You don't delete them. You set up a clean system, one careful step at a time, and at three in the afternoon the modem sings its song, and you're back. Slower. More careful. Back.`,
      },
      talk: {
        speaker: 'narrator',
        text: `You tell it the way it happened: the knock, the voices, the man who apologized for stepping on your foot, the fluorescent room, the questions you didn't answer. It comes out in the wrong order. Nobody interrupts. When you're done, the room is just a room again, emptier than it was, and you can breathe in it.`,
      },
      inventory: {
        speaker: 'narrator',
        text: `You sit down with a notebook (paper, now, for this) and write down everything: what they took, what they missed, what they might have seen, and every habit that made it easy for them. It's a long list. It's also the first useful thing you've done in days. By evening you know exactly how you'll never make this mistake again.`,
      },
      inventory_bad: {
        speaker: 'narrator',
        text: `You try to list what they could have found, and the list keeps growing: the saved chats, the notebook of handles, the discs you meant to wipe months ago. You don't know what's on half of them anymore. You end up lying awake doing the math of everything you can't remember, over and over, until the sun comes up.\n\nThe next night you do it again. And the next. The list never gets finished; it just gets quieter. Months later you still wake at 4 a.m. at the sound of a car door on the street, already counting.`,
      },
      sleep: {
        speaker: 'narrator',
        text: `You sleep for fourteen hours on a mattress they flipped over looking for something. When you wake up it's dark, and for about four seconds you don't remember. Those are good seconds. Then you get up, and look at the clean rectangle on the desk, and start thinking about what comes next.`,
      },
    },
  },
  {
    id: 'life_raid_again',
    channel: 'mail',
    title: 'Home Again',
    from: 'Note to self',
    start: 'start',
    nodes: {
      start: {
        text: [
          `Raid number {var:sys.raids}. Released this morning.`,
          `You know the drill now. The new lock on the door. The warrant copy. The dust rectangle on the desk where the machine was. You knew which drawer they'd open first, and they opened it.`,
          `That you know the drill is its own kind of news.`,
          { if: { any: [momHere, withPartner] }, text: `Somebody has left groceries on the counter and a note that says CALL ME. You do. They don't ask anything. They've stopped asking.` },
        ],
        choices: [
          { text: `Change everything. New habits, new hiding places.`, effects: [{ xp: 'opsec', add: 30 }, { stat: 'stress', add: -4 }] },
          { text: `Ask yourself, honestly, how many more of these you have in you.`, effects: [{ stat: 'stress', add: -8 }, { stat: 'mood', add: -3 }] },
        ],
      },
    },
  },
  {
    id: 'life_jail_release',
    channel: 'dialog',
    title: 'Released',
    start: 'start',
    nodes: {
      start: {
        speaker: 'narrator',
        text: [
          `The gate buzzes. A guard hands you a clear plastic bag with your keys, your pager and a stick of gum you don't remember owning, and says "Don't come back," the way a waiter says "enjoy."`,
          `Outside it's bright and ordinary. People are buying coffee. A bus goes by with an ad for NorthLink on the side: ALWAYS CONNECTED. You stand on the sidewalk for a minute, not sure which direction is home.`,
          { if: momHere, text: `Then you see Mom's old hatchback idling at the curb, hazard lights on, illegally parked. She leans over and pushes the passenger door open. She doesn't say a word the whole drive home. She holds your hand at every red light.` },
          { if: { all: [{ not: momHere }, close('jax', 30)] }, text: `Then you see Jax across the street, sitting on the hood of a car that isn't his, eating a sandwich. "They said nine," he says. "I got here at seven. In case." He hands you the other half.` },
          { if: { all: [{ not: momHere }, { not: close('jax', 30) }] }, text: `Nobody's waiting. You didn't tell anyone when. You tell yourself that's why. You take the bus.` },
        ],
        choices: [
          { text: `Go home and shower for an hour.`, effects: [{ stat: 'stress', add: -10 }, { stat: 'mood', add: 4 }] },
          { text: `Go straight to the Cathode. Sal will know what to do.`, if: { var: 'w.cathode_open', eq: 1 }, effects: [{ npc: 'sal', affinity: 3 }, { stat: 'health', add: 5 }, { stat: 'stress', add: -8 }], goto: 'sal' },
        ],
      },
      sal: {
        speaker: 'sal',
        text: `Sal looks at you, looks at the plastic bag, and says nothing at all. He puts down a plate of eggs, hash browns, toast, a side of pancakes nobody ordered, and a cup of coffee. "On the house," he says. "The jailbird special. Only served to people who came back." He goes back to the grill. You eat everything.`,
      },
    },
  },

  // ── Deep debt ────────────────────────────────────────────────────────────
  {
    id: 'life_deep_debt',
    channel: 'dialog',
    title: 'In the Red',
    start: 'start',
    nodes: {
      start: {
        speaker: 'narrator',
        text: [
          `The phone rings at 8:02 a.m., the minute collection agencies are allowed to call. Then again at 8:40. Then at noon. You've started letting the answering machine get it; the answering machine is full.`,
          `You owe more than two thousand dollars to people who don't send birthday cards. You're eating the cheapest thing in the store. The math, which you have done on the back of an envelope maybe forty times, doesn't get better when you do it again.`,
        ],
        choices: [
          {
            text: `Ask Mom.`,
            if: momHere,
            effects: [{ money: 1000 }, { npc: 'mom', affinity: -2 }, { stat: 'stress', add: -10 }],
            goto: 'mom',
          },
          {
            text: `Ask Dad.`,
            if: { all: [momGone, around('dad')] },
            effects: [{ money: 700 }, { npc: 'dad', affinity: 2 }, { stat: 'stress', add: -8 }],
            goto: 'dad',
          },
          {
            text: `Sell things. The good chair, the speakers, the collection of games in their boxes.`,
            tag: '[Business]',
            check: {
              skill: 'business',
              dc: 12,
              success: 'sold_well',
              fail: 'sold_cheap',
              successEffects: [{ money: 900 }, { stat: 'mood', add: -3 }],
              failEffects: [{ money: 400 }, { stat: 'mood', add: -5 }, { stat: 'stress', add: 4 }],
            },
          },
          {
            text: `Take the storefront loan on Sodium Row. "LUMEN QUIKCASH — NO CREDIT? NO PROBLEM!"`,
            effects: [{ money: 1500 }, { var: 'life.extraUpkeep', add: 22 }, { flag: 'life.quikcash' }, { scene: 'life_loan_paid', delayHours: 24 * 100 }, { stat: 'stress', add: 4 }],
            goto: 'quikcash',
          },
          {
            text: `Borrow from Switch. He always has cash, and he always has terms.`,
            if: { npc: 'switch', met: true },
            effects: [{ money: 1500 }, { var: 'life.extraUpkeep', add: 18 }, { scene: 'life_switch_loan_paid', delayHours: 24 * 100 }, { faction: 'fac.loft', add: -2 }, { npc: 'switch', affinity: 3 }],
            goto: 'switch',
          },
          {
            text: `Grit your teeth. Work more, spend nothing, answer none of the calls.`,
            effects: [{ stat: 'stress', add: 8 }, { stat: 'mood', add: -4 }, { xp: 'business', add: 20 }],
            goto: 'grit',
          },
        ],
      },
      mom: {
        speaker: 'mom',
        text: [
          `She doesn't ask what it's for. She just gets out the checkbook from the drawer with the takeout menus and writes it in her beautiful bookkeeper's hand, and tears it off along the perforation, carefully.`,
          `"This is a loan," she says. "Not because I want it back. Because you need to be a person who pays things back." She puts it in your hand and closes your fingers over it. "And you're going to let me look at your budget. Sunday. Bring a pencil."`,
        ],
      },
      dad: {
        speaker: 'dad',
        text: `Dad hands you an envelope that's been in the back of the freezer, which is where the family has always kept emergency money, for reasons nobody remembers. "Your mother's," he says. "She'd want it spent on something that matters. You matter." He doesn't want it back. You pay it back anyway, into the same freezer, in the same envelope, over a year.`,
      },
      sold_well: {
        speaker: 'narrator',
        text: `You photograph everything in good light, write listings that make an office chair sound like a spiritual experience, and sell it all in a weekend to a Harbor Point kid with his dad's credit card. The room's emptier. The phone's quieter. You're still in the hole, but you can see the edge of it.`,
      },
      sold_cheap: {
        speaker: 'narrator',
        text: `The pawn shop on Sodium Row offers you forty cents on the dollar and a look that says he's seen a hundred of you. You take it. Everybody takes it. You walk home with a lot less stuff and not nearly enough money, feeling like you sold your own furniture to strangers, because you did.`,
      },
      quikcash: {
        speaker: 'narrator',
        text: `The man behind the bulletproof glass is very friendly. The contract is fourteen pages and the interest rate is printed in the kind of type you need a magnifying glass for. You sign. The cash is real. So is the daily payment, which starts tomorrow and runs for a hundred days. The poster on the wall says WE BELIEVE IN YOU. It is the only one who does.`,
      },
      switch: {
        speaker: 'switch',
        text: `Switch counts out fifteen hundred in fifties at the back of the Sodium Row room without looking at them. "Hundred days. Eighteen a day. I'm not a bank, I'm a friend with a spreadsheet." He grins. "And if a job comes up that needs your hands, you'll remember who was around when your pockets were empty." It isn't a question. With Switch it never is.`,
      },
      grit: {
        speaker: 'narrator',
        text: `You unplug the answering machine. You eat rice and eggs, rice and eggs, rice and eggs. You say yes to every shift and no to every invitation. It's slow and it's joyless, and it's yours: nobody owns a piece of you at the end. You check the balance every night like a man checking a wound.`,
      },
    },
  },
  {
    id: 'life_loan_paid',
    channel: 'mail',
    title: 'Congratulations, Valued Customer!',
    from: 'Lumen QuikCash',
    start: 'start',
    nodes: {
      start: {
        text: [
          `Your QuikCash loan has been PAID IN FULL! You paid a total of $2,200 on a $1,500 advance. Thank you for your business!`,
          `As a valued customer, you are PRE-APPROVED for a new advance of up to $3,000. Just stop by! We believe in you!`,
        ],
        effects: [{ var: 'life.extraUpkeep', add: -22 }, { clearFlag: 'life.quikcash' }, { stat: 'mood', add: 4 }],
        choices: [{ text: `Delete it. Very firmly.`, effects: [{ stat: 'stress', add: -3 }] }],
      },
    },
  },
  {
    id: 'life_switch_loan_paid',
    channel: 'chat',
    title: 'square',
    from: 'switch',
    start: 'start',
    nodes: {
      start: {
        effects: [{ var: 'life.extraUpkeep', add: -18 }],
        text: [`last payment came in. we're square`, `told u i'm not a bank. banks don't say thank u`, `thank u`, `the offer about the job still stands tho ;)`],
        choices: [
          { text: `"thanks switch. genuinely"`, effects: [{ npc: 'switch', affinity: 3 }] },
          { text: `"we're square. that means square"`, effects: [{ npc: 'switch', affinity: -1 }, { faction: 'fac.loft', add: 1 }] },
        ],
      },
    },
  },
  {
    id: 'life_debt_clear',
    channel: 'mail',
    title: 'Balance: $0.00',
    from: 'Note to self',
    start: 'start',
    nodes: {
      start: {
        text: [
          `You check the balance four times, because the first three you don't believe it. Zero. Then a little more than zero.`,
          `The phone stops ringing at 8:02. You plug the answering machine back in, and it just sits there, blinking a calm green zero, like it forgives you.`,
          `You write a rule on an index card and stick it to the monitor: NEVER AGAIN. You've written that card before. You mean it more this time.`,
        ],
        effects: [{ stat: 'stress', add: -10 }, { stat: 'mood', add: 6 }],
      },
    },
  },
]

const triggers: TriggerDef[] = [
  {
    id: 'life_first_job',
    when: { all: [{ not: { job: null } }, { jailed: false }] },
    atHour: 19,
    effects: [
      QUIET_RESET,
      { if: momHere, then: [{ scene: 'life_first_job' }], else: [{ if: around('dad'), then: [{ scene: 'life_first_job_dad' }] }] },
    ],
  },
  {
    id: 'life_moving_out',
    when: { all: [{ not: atParents }, { jailed: false }] },
    atHour: 21,
    effects: [QUIET_RESET, { scene: 'life_moving_out' }, { if: momHere, then: [{ scene: 'life_care_package', delayHours: 44 }] }],
  },

  // Custody tracking (engine jail → release).
  {
    id: 'life_custody_in',
    when: { all: [{ jailed: true }, { not: { flag: 'life.in_custody' } }] },
    once: false,
    cooldownDays: 0,
    effects: [{ flag: 'life.in_custody' }],
  },
  {
    id: 'life_custody_out',
    when: { all: [{ jailed: false }, { flag: 'life.in_custody' }] },
    once: false,
    cooldownDays: 0,
    effects: [
      QUIET_RESET,
      { clearFlag: 'life.in_custody' },
      {
        if: behind('sys.raids', 'life.raids_seen'),
        then: [
          { var: 'life.raids_seen', add: 1 },
          { if: { var: 'life.raids_seen', eq: 1 }, then: [{ scene: 'life_raid_aftermath' }], else: [{ scene: 'life_raid_again' }] },
        ],
        else: [{ scene: 'life_jail_release' }],
      },
    ],
  },

  // Deep debt.
  {
    id: 'life_deep_debt',
    when: { all: [{ flag: 'sys.deep_debt' }, { not: { flag: 'life.debt_episode' } }, { jailed: false }] },
    once: false,
    cooldownDays: 30,
    atHour: 9,
    effects: [QUIET_RESET, { flag: 'life.debt_episode' }, { scene: 'life_deep_debt' }],
  },
  {
    id: 'life_debt_clear',
    when: { all: [{ flag: 'life.debt_episode' }, { stat: 'money', gte: 0 }] },
    once: false,
    cooldownDays: 1,
    atHour: 10,
    effects: [{ clearFlag: 'life.debt_episode' }, { scene: 'life_debt_clear' }],
  },
]

export default defineContent({ scenes, triggers })
