/**
 * PKG-02 — Act IIa spine: "Settling In" (bible §6.B IIa comedy phase).
 *
 * The light dramedy phase. Started by trig_act2_gate (PKG-01) the moment Act II opens (and also
 * autoStarts on act=2 as a belt-and-braces), long before Kroll's dinner (main_a2_q1, day ≥ 700), so
 * the comedy lands first. It frames the parallel IIa pool owned by other packages (LSU exam ·
 * edu_lsu_q1, Dee's layoff-then-rehire · life_dotcom_layoff_wave + fac_halcyon_q1, the council gag ·
 * side_dee_for_council, LAN parties) and ends on the first-apartment party.
 *
 * It also arms the first-raid suppression (`sys.no_raids`) that trig_first_raid clears (bible §6.B):
 * the first raid of Act II must be the authored one.
 *
 * PKG-02 owns: main_a2_q0a_settling_in, scenes a2_settling_in / a2_first_party, flags
 * a2.leaned_school / .leaned_legit / .leaned_scene / .two_hats / .settling_wary / .party_*.
 */
import { defineContent } from '@/engine/registry'
import type { QuestDef, SceneDef } from '@/engine/types'

const atParents = { housing: 'parents_flat' }

const settlingScene: SceneDef = {
  id: 'a2_settling_in',
  channel: 'dialog',
  title: "Everyone's Getting Paid",
  from: 'jax',
  start: 'open',
  nodes: {
    open: {
      speaker: 'narrator',
      text: [
        'The money showed up the way weather does. One year you were fixing grandmothers\' PCs for empanadas; the next, a recruiter left a voicemail that used the word "compensation" four times and never once said a number under five figures.',
        'Jax is on your floor surrounded by pizza boxes and the specific glow of a CRT that cost more than a month of the old rent.',
        {
          if: atParents,
          text: 'You are, technically, still at your parents\'. Mom refills the chip bowl without being asked and lingers a half-second too long in the doorway, reading the room like a spreadsheet.',
          else: 'You have your own place now. It smells like fresh paint and somebody else\'s cigarettes, and it is the best thing you have ever owned.',
        },
      ],
      next: 'jax_pitch',
    },
    jax_pitch: {
      speaker: 'jax',
      text: [
        '"Okay, okay, hear me out." Jax has the expression he gets right before a bad idea he\'s already committed to. "The whole city is printing money. NorthLink\'s hiring. Halcyon\'s hiring. There\'s a company in Millgate that pays people to think about databases, like, as a feeling."',
        '"We can type, and grown adults are throwing checks at us. This is the good part. I need you to acknowledge that this is the good part before it stops being the good part."',
      ],
      choices: [
        {
          text: '"This is the good part."',
          effects: [{ stat: 'mood', add: 6 }, { npc: 'jax', affinity: 4 }],
          goto: 'plans',
        },
        {
          text: '"Nothing this easy stays this easy."',
          tag: '[Skeptic]',
          effects: [{ flag: 'a2.settling_wary' }, { stat: 'stress', add: 3 }],
          goto: 'plans',
        },
        {
          text: '"Acknowledged. Now give me a slice before I bill you for the acknowledgement."',
          tag: '[Class Clown]',
          if: { background: 'class_clown' },
          effects: [{ stat: 'mood', add: 8 }, { npc: 'jax', affinity: 6 }],
          goto: 'plans',
        },
      ],
    },
    plans: {
      speaker: 'jax',
      text: [
        '"So what\'s the plan, genius? Because everybody I know is picking a lane." He counts on greasy fingers. "Priya\'s trying to get you a real desk. There\'s a whole college up on the Hill that\'ll take a check and give you a piece of paper that opens doors. And Corvid says the board\'s got work if you want to stay… you know. Us."',
        '"Also Dee got laid off from CompCastle. Dee. They laid off the only person who knew where the returns bin was. She\'s already got a binder about it."',
      ],
      choices: [
        {
          text: '"I\'m going to get the paper. Lumen State, the whole nine."',
          effects: [{ flag: 'a2.leaned_school' }, { stat: 'mood', add: 3 }],
          goto: 'school',
        },
        {
          text: '"A real desk. Benefits. A chair that isn\'t a milk crate."',
          effects: [{ flag: 'a2.leaned_legit' }, { faction: 'fac.halcyon', add: 2 }],
          goto: 'legit',
        },
        {
          text: '"Us. The board. I\'m not trading the scene for a lanyard."',
          effects: [{ flag: 'a2.leaned_scene' }, { npc: 'jax', affinity: 6 }, { faction: 'fac.loft', add: 3 }],
          goto: 'scene',
        },
        {
          text: '"Why pick one? I\'ll run two lives and bill both."',
          tag: '[Hustle]',
          check: {
            skill: 'business',
            dc: 12,
            success: 'hustle_win',
            fail: 'hustle_fail',
            successEffects: [{ flag: 'a2.two_hats' }, { stat: 'mood', add: 4 }],
            // Fail: you try to run two lives anyway, for six ugly weeks — and Kroll hears about it.
            failEffects: [
              { stat: 'stress', add: 8 },
              { stat: 'mood', add: -3 },
              { flag: 'a2.overcommitted' },
              {
                buff: {
                  id: 'buff_a2_spread_thin',
                  name: 'Spread Thin',
                  desc: 'Two lives, one body, zero margin. Everything takes a little longer and costs a little more.',
                  days: 42,
                  bad: true,
                  mods: [
                    { key: 'efficiency', mult: 0.95 },
                    { key: 'stress.gain', mult: 1.08 },
                  ],
                },
              },
            ],
          },
        },
      ],
    },
    school: {
      speaker: 'jax',
      text: '"Lumen State. My man." Jax salutes with a crust. "There\'s an entrance exam. Some professor named Okoro is supposed to be terrifying in a fun way. Go be a nerd about it. I\'ll visit the dorm and eat your meal plan."',
      next: 'dee_bit',
    },
    legit: {
      speaker: 'jax',
      text: '"Suit-and-badge guy. Respect." He does not fully mean it, and that is fine. "Just remember who taught you to Alt-F4 out of trouble when the office starts feeling like a very polite trap."',
      next: 'dee_bit',
    },
    scene: {
      speaker: 'jax',
      text: '"Yes. YES." He nearly knocks over a two-liter. "Family. That\'s the right answer. That\'s always the right answer." A beat. "It pays worse. But it\'s the right answer."',
      next: 'dee_bit',
    },
    hustle_win: {
      speaker: 'jax',
      text: '"Two lives." Jax whistles. "You absolute menace. Okay. But when the wires cross — and they always cross — you call me first, not last." He means it more than he lets on.',
      next: 'dee_bit',
    },
    hustle_fail: {
      speaker: 'jax',
      text: [
        '"Two lives," you say, and Jax watches you try to hold three thoughts at once and drop all of them into the pizza box. "Yeah. Maybe walk before you juggle chainsaws, huh?" It stings because he\'s right.',
        'You try anyway, because being told you can\'t is the most reliable fuel you own. For the next six weeks you run a schedule that would embarrass a hospital: missed calls, a half-finished gig, one entire Tuesday lost to a nap you don\'t remember starting. People notice. In this city, people always notice.',
      ],
      next: 'dee_bit',
    },
    dee_bit: {
      speaker: 'jax',
      text: [
        '"Anyway. Dee." Jax leans in like it\'s classified. "She stood in the CompCastle parking lot for an hour after they let her go. Then she looked at the city council building across the street and got this LOOK. You know the look. The pothole look."',
        {
          if: { flag: 'npc.dee.encouraged' },
          text: '"And apparently SOMEBODY already told her she should run. She quotes you. She has you on a slide. There is a laminated slide with your name on it, dude."',
          else: '"If somebody told her she should run for office, she would absolutely, catastrophically run for office."',
        },
        {
          if: { flag: 'a1.dee_probation' },
          text: '"She still calls you Probation, by the way. Affectionately. Mostly. She asked if you\'d finally learned when to stop talking and I said no, and she looked so happy."',
        },
      ],
      choices: [
        {
          text: '"Somebody should tell her. Loudly."',
          effects: [{ stat: 'mood', add: 4 }, { npc: 'dee', affinity: 2 }],
          goto: 'close',
        },
        {
          text: '"Let\'s not weaponize Dee. The Row isn\'t ready."',
          effects: [{ npc: 'jax', affinity: 1 }],
          goto: 'close',
        },
      ],
    },
    close: {
      speaker: 'narrator',
      text: [
        'You eat the last slice standing up, both of you quiet in the good way. Outside, the modems of Port Lumen sing their busy little handshake songs, and for a while nothing is on fire.',
        'It won\'t last. It never does. But tonight it\'s the good part, and you both know enough to notice it while it\'s here.',
      ],
    },
  },
}

/** The housewarming (or, for the ones who stayed home, the basement LAN). Pure IIa comedy. */
const partyScene: SceneDef = {
  id: 'a2_first_party',
  channel: 'dialog',
  title: 'The Housewarming',
  from: 'jax',
  start: 'doorbell',
  nodes: {
    doorbell: {
      speaker: 'narrator',
      text: [
        {
          if: atParents,
          text: 'Mom agreed to "a few friends" in the basement, on the strict condition that nobody touches the good towels. By nine there are eleven people, six computers and one power strip, and Dad is hovering on the stairs pretending to look for a screwdriver so he can watch the Quake match.',
          else: 'Your first real party in your first real place. By nine there are eleven people in a room rated for four, six computers daisy-chained off a single power strip, and a neighbor who has knocked twice to ask, sincerely, whether you are running a bakery or a data center.',
        },
        'Jax is DJing from a burned CD labeled MIX #9 (DO NOT PLAY AT FUNERALS). byteme has brought a crate of energy drinks and the fervor of a sixteen-year-old allowed out past ten.',
        {
          if: { all: [{ flag: 'a1.mira_probe_burned' }, { not: { flag: 'a1.probe_apologized' } }] },
          text: 'Mira came, which nobody expected — least of all you, since she hasn\'t said ten words to you since the café — and is standing near the door like it\'s a fire exit she\'s already mapped.',
          else: 'Mira came, which nobody expected, and is standing near the door like it\'s a fire exit she\'s already mapped.',
        },
        { if: { flag: 'a1.row_fixed' }, text: 'Two of the guests are Mrs. Ferraro\'s grandsons, who have been told you are "the good kind of computer person" and are visibly waiting for proof.' },
      ],
      next: 'crisis',
    },
    crisis: {
      speaker: 'byteme',
      text: [
        '"ok so dont be mad," byteme says, which is how every disaster in his life begins, "but i plugged in the fog machine."',
        'The lights dim. The CRTs flicker. The power strip, which was never meant to carry the dreams of an entire generation, makes a sound like a moth dying in a toaster.',
      ],
      choices: [
        {
          text: 'Rebalance the load across three outlets before anything pops.',
          tag: '[Hardware]',
          check: {
            skill: 'hardware',
            dc: 12,
            bonuses: [{ if: { background: 'tinkerer' }, add: 2, label: '+2 (you have been doing this since you were nine)' }],
            success: 'saved_lan',
            fail: 'blown_fuse',
            successEffects: [{ stat: 'mood', add: 6 }, { npc: 'byteme', affinity: 4 }, { faction: 'fac.loft', add: 2 }],
            failEffects: [
              { stat: 'mood', add: -2 },
              { stat: 'stress', add: 3 },
              { money: -40 },
              { if: { not: atParents }, then: [{ chance: 0.3, then: [{ complication: 'social' }] }] },
            ],
          },
        },
        {
          text: 'Turn the outage into the party. Candles, a boombox, and ghost stories about the \'94 raid.',
          tag: '[Host]',
          check: {
            skill: 'social',
            dc: 12,
            success: 'candles',
            fail: 'candles_flop',
            successEffects: [{ stat: 'mood', add: 8 }, { npc: 'jax', affinity: 3 }, { npc: 'mira', affinity: 3 }],
            // Minor: the board keeps the receipt ("ghost story guy"), and sometimes a joke grows teeth.
            failEffects: [
              { stat: 'stress', add: 4 },
              { stat: 'mood', add: -3 },
              { stat: 'cred', add: -1 },
              { chance: 0.3, then: [{ complication: 'social' }] },
            ],
          },
        },
        {
          text: 'Unplug the fog machine and give byteme The Talk about amperage.',
          effects: [{ npc: 'byteme', affinity: 2 }, { stat: 'mood', add: 2 }],
          goto: 'the_talk',
        },
      ],
    },
    saved_lan: {
      speaker: 'narrator',
      text: 'Three extension cords, a lamp sacrificed to the cause, and a load calculation done on the back of a pizza box. The CRTs steady. The match resumes. byteme looks at you the way people in old paintings look at saints. "you just KNEW where the amps were," he whispers. Somebody starts chanting your handle, ironically at first, and then not.',
      next: 'mira_door',
    },
    blown_fuse: {
      speaker: 'narrator',
      text: [
        'You reach for the right plug and grab the wrong one. There is a pop, a smell, and then the complete, velvet darkness of a blown fuse.',
        {
          if: atParents,
          text: 'Dad, a man who has waited three years to be useful to a computer person, finds the fuse box by memory in the dark. He replaces it with a spare he\'s kept since 1989. He says nothing. He is radiant. You owe him a new one, and forty dollars of pizza for everyone who lost their save.',
          else: 'The landlord\'s fuse box is behind a locked panel in the laundry room. The replacement costs forty dollars and a very long conversation with a man named Gus. When the power comes back, everyone cheers like you won something.',
        },
      ],
      next: 'mira_door',
    },
    candles: {
      speaker: 'narrator',
      text: 'You light every candle you own, which is four, and every candle Jax brought, which is a jar that says OCEAN BREEZE. You tell the \'94 story the way Deadline tells it — the forty drives, the same night, nobody saying a word — and in the dark eleven people go completely quiet listening. When the lights come back nobody wants them.',
      next: 'mira_door',
    },
    candles_flop: {
      speaker: 'narrator',
      text: [
        'You try to rally the room with a ghost story and forget the ending halfway through. Jax rescues you by doing an impression of Dee discovering a monitor was unplugged, which kills. It\'s fine. It\'s a good party. Nobody remembers your story. Everybody remembers the Dee impression.',
        'By morning somebody has posted "ghost story guy forgot the ending" on the board, with a timeline. It gets eleven replies. You read all eleven.',
      ],
      next: 'mira_door',
    },
    the_talk: {
      speaker: 'byteme',
      text: '"so like. its not unlimited," byteme repeats slowly, after your two-minute lecture on the power strip. "the wall. has a LIMIT." He looks genuinely shaken, like you told him the ocean has a bottom. He will carry this knowledge for the rest of his life. It might save him, one day, from a much worse surge.',
      next: 'mira_door',
    },
    mira_door: {
      speaker: 'mira',
      text: [
        'Near midnight you find Mira still by the door, coat on, drink untouched. "Nice party," she says, in the tone of someone rating a firewall. "Your network\'s wide open, by the way. Anyone on this floor could see what your roommate downloads."',
        {
          if: { flag: 'npc.mira.respect' },
          text: 'Then, almost a smile. "I fixed it. You\'re welcome. Don\'t make it weird."',
          else: 'She lets that sit like a scoreboard. "I didn\'t fix it. Figured you\'d want the practice."',
        },
      ],
      choices: [
        {
          text: '"Stay for one more round. I\'ll let you win."',
          effects: [{ npc: 'mira', affinity: 3 }],
          goto: 'mira_stays',
        },
        {
          text: '"You mapped the exits the second you walked in, didn\'t you."',
          tag: '[Perceptive]',
          check: {
            skill: 'social',
            dc: 13,
            bonuses: [{ if: { trait: 'empath' }, add: 2, label: '+2 (Empath)' }],
            success: 'mira_seen',
            fail: 'mira_misread',
            successEffects: [{ npc: 'mira', affinity: 5 }],
            failEffects: [{ npc: 'mira', affinity: -3 }, { flag: 'a2.mira_misread' }],
          },
        },
        {
          text: 'Let her go. Some people do parties in small doses.',
          goto: 'mira_leaves',
        },
      ],
    },
    mira_stays: {
      speaker: 'narrator',
      text: 'She takes her coat off. She does not let you win. She beats you twice at rail-guns and then, very quietly, shows you the one trick she used, which from Mira is practically a love letter written in rocket jumps.',
      next: 'dawn',
    },
    mira_seen: {
      speaker: 'mira',
      text: '"Two windows, one fire escape, and your bathroom has a skylight a determined person could fit through." She looks at you a long second, surprised to be caught. "Old habit. Ridgeport habit." It\'s the first time she has said the word to you like it wasn\'t a door slammed shut. She stays another hour.',
      next: 'dawn',
    },
    mira_misread: {
      speaker: 'mira',
      text: [
        '"Mapped the exits." She says it back flatly, like reading a charge sheet. "Right. Because I\'m the one who runs." It isn\'t what you meant — you meant *I see you* — but it lands as *I\'ve got your number*, and with Mira those are opposite sentences.',
        'She\'s gone down the stairs before the song ends. This time it is a little bit a rejection, and you both know which of you caused it.',
      ],
      next: 'dawn',
    },
    mira_leaves: {
      speaker: 'narrator',
      text: 'She gives you a two-finger salute and is gone down the stairs before the song ends. It\'s not a rejection. It\'s just Mira. You get the feeling she\'ll count this as a night she almost enjoyed, which is its own kind of progress.',
      next: 'dawn',
    },
    dawn: {
      speaker: 'narrator',
      text: [
        'The last guest leaves at 4 a.m. byteme is asleep under the desk with a controller on his chest. Jax is washing cups in your sink, humming MIX #9.',
        '"Best party of the year," he says. "I\'m calling it. Nobody got arrested, nothing caught fire, and Mira stayed longer than a minute." He dries his hands on his shirt. "Write this one down, man. We\'re gonna want to remember what it looked like when it was easy."',
      ],
      effects: [{ flag: 'a2.party_done' }, { stat: 'stress', add: -8 }, { npc: 'jax', affinity: 3 }],
    },
  },
}

const quest: QuestDef = {
  id: 'main_a2_q0a_settling_in',
  title: 'Settling In',
  kind: 'main',
  act: 2,
  giver: 'jax',
  summary:
    "The dot-com money is real and everyone's picking a lane. Find your feet in the new city: a place to live, a way to make it, and one loud opinion about Dee's future.",
  autoStart: { var: 'act', eq: 2 },
  priority: 5,
  rewards: 'A direction · mood · a party worth remembering',
  start: 'arrive',
  stages: {
    arrive: {
      text: 'Act II is open. The money is real. Have a slice with Jax and decide, at least out loud, what you\'re chasing.',
      hint: 'A dialog lands within a few hours. Until then, keep painting your schedule.',
      // Arm the first-raid suppression the moment Act II opens: the FIRST raid of the act must be
      // the authored one (main_a2_q5). trig_first_raid clears it when it fires (bible §6.B).
      onEnter: [{ flag: 'sys.no_raids' }, { scene: 'a2_settling_in', delayHours: 6 }],
      objectives: [
        {
          id: 'talk',
          text: 'Talk it over with Jax',
          when: { seen: 'a2_settling_in' },
          hint: 'Open the dialog when it arrives — it auto-pauses the game.',
        },
      ],
      next: 'find_feet',
    },
    find_feet: {
      text: 'Get your feet under you. Move out if you can afford it, and start down whichever road you called — a desk, a degree, or the board.',
      hint: 'Your own place is optional but it\'s the whole point of a paycheck. Otherwise level a skill, hold a job, or build faction standing. Lumen State, Dee\'s council run and the Loft board all have their own threads this year.',
      objectives: [
        {
          id: 'moved_out',
          text: 'Get a place of your own',
          optional: true,
          when: { not: { housing: 'parents_flat' } },
          hint: 'Rent through the Housing screen once you\'ve saved a move-in deposit.',
        },
        {
          id: 'making_it',
          text: 'Make a name for yourself (a skill at 30, a job, or Known with a faction)',
          when: {
            any: [
              { skill: 'programming', gte: 30 },
              { skill: 'intrusion', gte: 30 },
              { skill: 'networking', gte: 30 },
              { skill: 'systems', gte: 30 },
              { skill: 'business', gte: 30 },
              { faction: 'fac.loft', gte: 20 },
              { faction: 'fac.halcyon', gte: 20 },
              { not: { job: null } },
              { enrolled: true },
              { day: true, gte: 560 },
            ],
          },
          hint: 'Level a skill, hold a job, enroll at Lumen State, or build standing. Time counts too — the city finds everyone eventually.',
        },
      ],
      onComplete: [{ scene: 'a2_first_party', delayHours: 30 }],
      next: 'party',
    },
    party: {
      text: 'Jax has declared that your new life requires a party. He has already invited eleven people and a fog machine.',
      hint: 'The party dialog arrives on its own. Enjoy it — this is the good part.',
      objectives: [
        {
          id: 'party',
          text: 'Survive your own party',
          when: { flag: 'a2.party_done' },
          hint: 'Open the party dialog and see the night through.',
        },
      ],
    },
  },
}

export default defineContent({
  quests: [quest],
  scenes: [settlingScene, partyScene],
})
