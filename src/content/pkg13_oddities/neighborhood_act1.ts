/**
 * PKG-13 — Act I neighborhood side quests (bible §8: #31 haunted modem, #32 fifty-one floppies,
 * #34 press any key, #36 tamagotchi triage).
 *
 * These are the warm, nostalgic small stakes of the light phase: a phone ghost, a heartbreak of
 * floppies, a boss who can't find the Any key, and a little sister's dying virtual pet. One of them
 * (`side_haunted_modem`) leaves a cold thread hanging that `side_haunted_server` later picks up.
 *
 * Sets: `npc.dee.encouraged` (press_any_key), `kim_trajectory(+)` and Kim affinity (tamagotchi),
 *       `fac.hood(+)`, small money/mood.
 * Reads: `npc.dee` met, `npc.kim` met, background/trait flavor.
 *
 * All four count toward the Act I "two side quests" gate road (PKG-01's ACT1_SIDES).
 * Hacking is fiction: the "ghost", the floppy imaging and the virtual pet are abstract game flavor.
 */
import { defineContent } from '@/engine/registry'
import type { QuestDef, SceneDef } from '@/engine/types'

// ── #31 side_haunted_modem — the phone ghost ──────────────────────────────────

const hauntedModem: QuestDef = {
  id: 'side_haunted_modem',
  title: 'The Ghost on the Line',
  kind: 'side',
  act: 1,
  priority: 6,
  autoStart: { all: [{ var: 'act', eq: 1 }, { day: true, gte: 18 }] },
  rewards: 'Neighborhood standing · and a thread you won\'t be able to leave alone',
  summary: [
    'Vera Ostrowski two blocks over swears her new cordless phone is haunted. A man\'s voice, faint, at odd hours, saying the same few words. Her priest suggested a blessing. Her son suggested you.',
    'It is almost certainly crosstalk. Almost.',
  ],
  start: 'call',
  stages: {
    call: {
      text: 'Vera Ostrowski\'s cordless phone has a ghost in it. Go find out whose.',
      hint: 'Answer the mail and go listen. Any of the routes gets you an answer — the question is what the answer turns out to be.',
      onEnter: [{ scene: 'haunted_modem' }],
      objectives: [
        {
          id: 'ghost',
          text: 'Find the source of the voice on Vera\'s line',
          when: { flag: 'side.haunted_modem.done' },
          hint: 'Open Vera\'s mail. Hardware, Networking or just talking to the neighbors all work.',
        },
      ],
    },
  },
}

const hauntedModemScene: SceneDef = {
  id: 'haunted_modem',
  channel: 'mail',
  title: 'the telephone is haunted (not a joke)',
  from: 'Vera Ostrowski',
  start: 'call',
  nodes: {
    call: {
      speaker: 'Vera Ostrowski',
      text: [
        'Hello dear, this is Vera from the blue-shutter house, your mother knows me from the choir.',
        'My son bought me one of the cordless telephones so I can garden and gab. But it has a GHOST. At night, and once in the afternoon, a man\'s voice comes through under the dial tone. Same words. "…still there? …read you… still there." Faint, like from a well.',
        'I am not a foolish woman. But I am asking a young person to come tell me it is not a ghost, because when I ask my son he just says "static, Ma" and changes the subject, and static does not say still there.',
      ],
      next: 'listen',
    },
    listen: {
      speaker: 'narrator',
      text: [
        'Vera\'s parlor is doilies and photographs and, on the sideboard, a shiny new 900-megahertz cordless phone that cost more than her first car. You hold it to your ear in the quiet and wait.',
        'There. Under the hum, a man\'s voice, thin and even: "…still there? …read you five by five… still there." A pause. Then again, exactly the same, exactly the same cadence. Not a conversation. A loop.',
      ],
      choices: [
        {
          text: '[Hardware] Sweep the house for what\'s bleeding onto her channel.',
          check: {
            skill: 'hardware',
            dc: 12,
            bonuses: [{ if: { background: 'tinkerer' }, add: 2, label: '+2 (you built a crystal radio at nine)' }],
            success: 'source_crosstalk',
            fail: 'source_soft',
            successEffects: [{ xp: 'hardware', add: 9 }],
            failEffects: [{ xp: 'hardware', add: 4 }],
          },
        },
        {
          text: '[Networking] Chase the signal — which line, which frequency, how far.',
          check: {
            skill: 'networking',
            dc: 12,
            bonuses: [{ if: { background: 'arcade_rat' }, add: 1, label: '+1 (you know every noise a cabinet makes)' }],
            success: 'source_line',
            fail: 'source_soft',
            successEffects: [{ xp: 'networking', add: 9 }],
            failEffects: [{ xp: 'networking', add: 4 }],
          },
        },
        {
          text: '[Social] Ask the block who else got a new gadget lately.',
          check: {
            skill: 'social',
            dc: 11,
            success: 'source_block',
            fail: 'source_soft',
            successEffects: [{ npc: 'grandma_ruth', affinity: 2 }],
            failEffects: [],
          },
        },
      ],
    },
    // A neighbor's baby monitor — comedy, and it closes cleanly.
    source_block: {
      speaker: 'narrator',
      text: [
        'Six houses. Four porches. Two cups of coffee you couldn\'t refuse. And an answer: the Delgados three doors down just brought their newborn home, along with a top-of-the-line baby monitor on the exact same 900-megahertz band as Vera\'s phone.',
        'The "ghost" is Mr. Delgado, exhausted and delirious at 3 a.m., leaning into the nursery mic and murmuring the only radio he ever learned, from two years in the coast guard: "…you still there? …read you five by five…" to a sleeping infant. It loops because he says it every single night.',
      ],
      effects: [{ faction: 'fac.hood', add: 2 }, { stat: 'mood', add: 5 }],
      next: 'resolve_warm',
    },
    source_crosstalk: {
      speaker: 'narrator',
      text: [
        'You find it in twenty minutes with a borrowed scanner and a lot of walking in slow circles holding the phone at arm\'s length like a dowsing rod. It\'s the Delgados\' new baby monitor, three doors down, riding the same band.',
        'The voice is Mr. Delgado, up at all hours with a newborn, soothing her with the only cadence his tired brain remembers — old coast-guard radio checks. "…you still there? …read you five by five…" Vera\'s ghost is a brand-new father who hasn\'t slept since Tuesday.',
      ],
      effects: [{ faction: 'fac.hood', add: 2 }, { stat: 'mood', add: 5 }],
      next: 'resolve_warm',
    },
    source_line: {
      speaker: 'narrator',
      text: [
        'You trace it properly: not her phone line at all, but an over-the-air collision — another 900-megahertz device three houses west, close enough to bleed. A baby monitor. The Delgados. New baby, new gadget, same channel.',
        'The voice is the new father doing radio checks into the nursery mic at all hours, half asleep, coast-guard habits older than the baby. You could fix it by changing Vera\'s channel. But there\'s a second thing your trace turned up, and it\'s the thing you can\'t put down.',
      ],
      effects: [{ faction: 'fac.hood', add: 2 }, { stat: 'mood', add: 4 }],
      next: 'the_other_signal',
    },
    // Fail-forward: you don't pin it precisely, but you fix her problem and hear the cold note.
    source_soft: {
      speaker: 'narrator',
      text: [
        'You can\'t pin the exact culprit today — the signal comes and goes, and your gear is more enthusiasm than instrument. But you don\'t need to. You bump Vera\'s cordless to a different channel, the voice vanishes, and she nearly weeps with relief and gratitude and a plate of anise cookies.',
        'It was almost certainly a neighbor\'s baby monitor on the same band. Almost certainly. You tell her so and she believes you, which is the whole job.',
      ],
      effects: [{ faction: 'fac.hood', add: 1 }, { stat: 'mood', add: 4 }, { stat: 'energy', add: -5 }, { stat: 'stress', add: 2 }],
      next: 'the_other_signal',
    },
    resolve_warm: {
      speaker: 'narrator',
      text: [
        'You move Vera\'s phone to a clear channel and the ghost lifts. You do NOT tell her it was Mr. Delgado; you tell her it was "old radio waves," which is true enough and lets her keep the good story. She decides the house is blessed after all and sends you home with cookies for the road.',
      ],
      next: 'the_other_signal',
    },
    // The cold thread that seeds side_haunted_server.
    the_other_signal: {
      speaker: 'narrator',
      text: [
        'Here\'s the part you keep to yourself. While you were sweeping the band, you caught a third thing — not the baby monitor, not Vera\'s phone. Older. A weak, automated carrier tone, coming up out of the ground, repeating on a schedule, from the direction of the old switching shed by the tracks that\'s been dark since before you were born.',
        'It\'s not saying "read you five by five." It\'s a machine, dialing out, patiently, to numbers that stopped answering years ago. Somebody\'s box is still running down there. Somebody who, by every account, isn\'t.',
        'You file it in the drawer. But you write this one on the outside of the drawer, so you don\'t forget it\'s there.',
      ],
      effects: [{ flag: 'side.haunted_modem.done' }],
    },
  },
}

// ── #32 side_51_floppies — the fifty-first disk ──────────────────────────────

const fiftyOne: QuestDef = {
  id: 'side_51_floppies',
  title: 'Fifty-One Floppies',
  kind: 'side',
  act: 1,
  priority: 6,
  autoStart: { all: [{ var: 'act', lte: 2 }, { day: true, gte: 40 }] },
  rewards: 'A little money · a lot of mood · a stranger\'s whole heart',
  summary: [
    'Old Mr. Petrakis from the hardware store brings you a shoebox: fifty-one floppy disks, rubber-banded in stacks of ten, each labeled in a dead man\'s handwriting. His brother\'s copy of a space game they played together before the brother passed. The last disk is disk 51 of 51. He wants to play it one more time.',
    'Fifty floppies is a game. The fifty-first is something else.',
  ],
  start: 'box',
  stages: {
    box: {
      text: 'Mr. Petrakis left you a shoebox of fifty-one floppies and a lot of hope. Bring the game back to life.',
      hint: 'Open the mail and sit down at the bench. It\'s a Hardware job — but even if the last disk fails, keep reading. Nothing here is a dead end.',
      onEnter: [{ scene: 'fifty_one_floppies' }],
      objectives: [
        {
          id: 'restore',
          text: "Image the disks and recover what's on them",
          when: { flag: 'side.floppies.done' },
          hint: 'One Hardware check. Success gets the whole game. A near-miss on the last disk still recovers the thing that mattered more.',
        },
      ],
    },
  },
}

const fiftyOneScene: SceneDef = {
  id: 'fifty_one_floppies',
  channel: 'dialog',
  title: 'Fifty-One Floppies',
  start: 'box',
  nodes: {
    box: {
      speaker: 'narrator',
      text: [
        'You lay them out in order across the bench: fifty-one 3.5-inch floppies, the good kind, the kind that cost real money once. Every label is the same neat block capitals — GALAXY FREIGHTER, DISK 1 OF 51, DISK 2 OF 51 — up to DISK 51 OF 51, which has, beneath the number, one extra word in a shakier hand: "&."',
        'Just an ampersand. Disk 51 of 51, GALAXY FREIGHTER, &. You image them one at a time, the drive chattering its old chatter, a little séance of clicks. Fifty disks come up clean. Then you feed it disk fifty-one.',
      ],
      choices: [
        {
          text: '[Hardware] Coax the fifty-first disk to read.',
          check: {
            skill: 'hardware',
            dc: 12,
            bonuses: [{ if: { background: 'tinkerer' }, add: 2, label: '+2 (you\'ve resurrected worse)' }],
            success: 'full_win',
            fail: 'the_letter',
            successEffects: [{ xp: 'hardware', add: 10 }],
            failEffects: [{ xp: 'hardware', add: 6 }],
          },
        },
      ],
    },
    full_win: {
      speaker: 'narrator',
      text: [
        'Disk fifty-one is tired but not gone. You clean the heads, drop the drive speed, and give it three careful passes, and on the third the light goes solid and the last block comes home. GALAXY FREIGHTER lives — a chunky, glorious, two-color space-trading sim, the freighter a wedge of pixels hauling ore between stars.',
        'And tucked in the last of the disk\'s free space, saved right beside the game\'s final data, a plain text file. GREG.TXT. You shouldn\'t. You do. It\'s a letter. From the brother, to Mr. Petrakis, written the winter before he died and never sent — thanking him for a lifetime of Sunday games, for teaching him the trade routes and never once letting him win on purpose.',
        'You print the letter on the bench\'s dot-matrix, feed-holes and all, and put it in the box on top of the disks.',
      ],
      effects: [{ money: 60 }, { stat: 'mood', add: 10 }, { faction: 'fac.hood', add: 2 }],
      next: 'petrakis',
    },
    // Fail-forward: the game's last chunk is gone, but the letter survives.
    the_letter: {
      speaker: 'narrator',
      text: [
        'Disk fifty-one fights you and loses itself doing it. The last of the game data is unrecoverable — a bad sector right through the freighter\'s save routine, the kind of damage no amount of patience fixes. GALAXY FREIGHTER will boot, but it will never quite finish loading. The one thing Mr. Petrakis asked for is the one thing gone.',
        'You\'re about to give him the bad news when the recovery pass spits up one intact fragment from the disk\'s free space: a plain text file, GREG.TXT, whole and unhurt. A letter. From the brother, written the winter before he died and never sent — thanking Mr. Petrakis for a lifetime of Sunday games, for the trade routes, for never once letting him win on purpose.',
        'The "&" on the label. Not part of the game. Something added after. You print the letter on the dot-matrix, feed-holes and all.',
      ],
      effects: [{ money: 40 }, { stat: 'mood', add: 8 }, { faction: 'fac.hood', add: 2 }],
      next: 'petrakis',
    },
    petrakis: {
      speaker: 'narrator',
      text: [
        'Mr. Petrakis comes for the box the next morning smelling of pipe smoke and machine oil. You tell him about the game — how much you got back, and what you didn\'t. He nods along, patient, the way old men are patient about machines.',
        'Then you give him the letter, and he goes very still, and reads it standing up at your bench with his hat in his hand, and when he\'s done he folds it into four and puts it in his shirt pocket over his heart and says, "You know, I always let him think he found the fast trade route himself." He pays you, refuses change, and takes the whole shoebox including the disk that will never fully load, because his brother\'s handwriting is on it.',
      ],
      effects: [{ flag: 'side.floppies.done' }],
    },
  },
}

// ── #34 side_press_any_key — Dee's PC, and the seed of a career ────────────────

const pressAnyKey: QuestDef = {
  id: 'side_press_any_key',
  title: 'Press Any Key',
  kind: 'side',
  act: 1,
  giver: 'dee',
  priority: 6,
  autoStart: { all: [{ var: 'act', eq: 1 }, { npc: 'dee', met: true }] },
  rewards: 'Dee\'s undying loyalty · and maybe a councilwoman',
  summary: [
    'Dee Briggs has a customer\'s PC on the bench displaying the four most feared words in tech support: PRESS ANY KEY TO CONTINUE. She has been pressing keys for eleven minutes. She has, she reports, "pressed most of them."',
    'What she needs is the Any key. What she\'s about to get is a much bigger idea.',
  ],
  start: 'bench',
  stages: {
    bench: {
      text: 'Dee cannot find the Any key. Help her, and try not to laugh where she can see you.',
      hint: 'This one comes to you at the bench (dialog). Play along — and watch for the moment to plant an idea.',
      onEnter: [{ scene: 'press_any_key' }],
      objectives: [
        {
          id: 'help',
          text: 'Solve the Case of the Missing Any Key',
          when: { flag: 'side.press_any_key.done' },
          hint: 'Follow the conversation. There is a moment to tell Dee something about herself she hasn\'t heard yet.',
        },
      ],
    },
  },
}

const pressAnyKeyScene: SceneDef = {
  id: 'press_any_key',
  channel: 'dialog',
  title: 'Press Any Key',
  from: 'dee',
  start: 'bench',
  nodes: {
    bench: {
      speaker: 'dee',
      text: [
        '"There you are. Look at this." She turns the monitor. PRESS ANY KEY TO CONTINUE, blinking cursor, patient as death.',
        '"I have pressed," she counts on her fingers, "the space bar, the big Enter, the little Enter, all the F ones, the Windows flag, and the one that looks like a menu. I have pressed keys for eleven minutes. There is no Any key. I checked the keyboard twice. Somebody at the factory forgot the Any key."',
      ],
      choices: [
        {
          text: '"Dee. Any key means any key. It already worked." (Reach over and tap space.)',
          effects: [{ npc: 'dee', affinity: 4 }],
          goto: 'reveal',
        },
        {
          text: '[Social] Keep a straight face and "diagnose" it properly for her dignity.',
          check: {
            skill: 'social',
            dc: 10,
            bonuses: [{ if: { background: 'class_clown' }, add: 2, label: '+2 (you kept a straight face through detention)' }],
            success: 'graceful',
            fail: 'snort',
            successEffects: [{ npc: 'dee', affinity: 6 }],
            failEffects: [{ npc: 'dee', affinity: 2 }, { flag: 'npc.dee.snorted' }],
          },
        },
        {
          text: '"Every keyboard is missing the Any key, Dee. It\'s a manufacturing conspiracy." (Play along.)',
          effects: [{ npc: 'dee', affinity: 5 }, { stat: 'mood', add: 3 }],
          goto: 'conspiracy',
        },
      ],
    },
    reveal: {
      speaker: 'dee',
      text: [
        'The screen advances the instant you tap space. Dee stares at it. "That was the space bar," she says, with the flat calm of a woman recalculating her entire afternoon. "The space bar is the Any key."',
        '"The space bar is ANY key," she repeats, louder, to the whole store, as if announcing a policy. "Why does it not SAY that. Write to them. Write to the key people."',
      ],
      next: 'the_idea',
    },
    graceful: {
      speaker: 'narrator',
      text: [
        'You do it beautifully. You "run a diagnostic" (you tap the space bar while blocking her view), announce that the system "just needed a moment to synchronize its key buffer," and let Dee believe she softened it up with eleven minutes of pressure. She takes full credit. The customer will be told the machine was "heat-fatigued." Nobody is embarrassed. This is the whole art of the CompCastle bench and you have just passed the practical exam.',
      ],
      next: 'the_idea',
    },
    snort: {
      speaker: 'narrator',
      text: [
        'You almost make it. You get as far as "it just needed a moment to synchro—" before a snort escapes you like air from a whoopee cushion. Dee\'s eyes narrow. "Oh, it\'s FUNNY," she says, tapping the space bar herself now, watching it work, filing the knowledge away. "The kid thinks it\'s funny." She is not actually mad. She is, if anything, impressed you lasted eight seconds.',
      ],
      next: 'the_idea',
    },
    conspiracy: {
      speaker: 'dee',
      text: [
        '"I KNEW it." She slaps the bench. "A conspiracy. The key people leave off the Any key so we have to call the — the key hotline, and pay for the — you\'re messing with me." She points a finger at your nose. "You\'re messing with me and I let you, because it\'s the most fun I\'ve had at this job since the Christmas the printers unionized." She taps the space bar. It works. "…huh."',
      ],
      next: 'the_idea',
    },
    the_idea: {
      speaker: 'narrator',
      text: [
        'She rings the customer through and comes back wiping her hands on her CompCastle polo, still chewing on the injustice of the missing Any key, the manufacturing conspiracy, the key hotline. And you watch her get genuinely, righteously worked up about a small stupid thing that affects ordinary people, in front of a room, with total conviction and zero self-doubt, and a thought arrives fully formed.',
      ],
      choices: [
        {
          text: '"Dee. You should run for city council."',
          effects: [
            { flag: 'npc.dee.encouraged' },
            { npc: 'dee', affinity: 8 },
            { log: 'You planted the idea. Dee Briggs for city council. God help the council.', kind: 'story' },
          ],
          goto: 'run',
        },
        {
          text: 'Say nothing. Some ideas are dangerous. (Keep it to yourself.)',
          effects: [{ npc: 'dee', affinity: 3 }],
          goto: 'nothing',
        },
      ],
    },
    run: {
      speaker: 'dee',
      text: [
        'She laughs so hard she has to sit down on the returns stool. "City council. Me. With the — " she gestures at herself, the polo, the store, the whole beautiful ridiculous life. "That\'s the nicest dumb thing anybody\'s said to me all year."',
        'Then she stops laughing. She looks out the front windows at the street, at the potholes and the flickering streetlight and the library with its cut hours, and something clicks behind her eyes that you recognize, because it\'s the exact look she gets right before she reorganizes the entire stockroom without being asked.',
        '"What\'s the filing fee," she says. Not to you. To the window.',
      ],
      effects: [{ flag: 'side.press_any_key.done' }],
    },
    nothing: {
      speaker: 'narrator',
      text: 'You keep the thought to yourself. Dee goes back to her bench, muttering about the key people, and the world stays exactly as strange as it was. Some doors you can always come back and open later.',
      effects: [{ flag: 'side.press_any_key.done' }],
    },
  },
}

// ── #36 side_tamagotchi_triage — Kim's dying pet (beat 1 of her arc) ──────────

const tamagotchi: QuestDef = {
  id: 'side_tamagotchi_triage',
  title: 'DinoPal Triage',
  kind: 'side',
  act: 1,
  giver: 'kim',
  priority: 6,
  autoStart: { all: [{ var: 'act', eq: 1 }, { npc: 'kim', met: true }, { day: true, gte: 12 }] },
  rewards: "Kim's trust · and the first thing you teach her about shortcuts",
  summary: [
    'Kim\'s DinoPal — the little egg-shaped keychain pet she\'s kept alive for ninety-one days, a school record — is dying. She left it on your keyboard at 6 a.m. with a note: "FIX IT. do not tell anyone i cried."',
    'This is the first time your little sister has ever asked you to hack something. What you teach her here, she keeps.',
  ],
  start: 'egg',
  stages: {
    egg: {
      text: 'Kim\'s virtual pet is flat-lining and she\'s pretending she doesn\'t care. Decide what kind of help you are.',
      hint: 'Kim left it on your desk (dialog). How you save the DinoPal is the actual lesson — and it nudges who she becomes.',
      onEnter: [{ scene: 'tamagotchi_triage' }],
      objectives: [
        {
          id: 'triage',
          text: "Save (or don't) Kim's DinoPal",
          when: { flag: 'side.tamagotchi.done' },
          hint: 'Play it through. There\'s an honest way, a shortcut, and a way that does the work for her.',
        },
      ],
    },
  },
}

const tamagotchiScene: SceneDef = {
  id: 'tamagotchi_triage',
  channel: 'dialog',
  title: 'DinoPal Triage',
  from: 'kim',
  start: 'egg',
  nodes: {
    egg: {
      speaker: 'narrator',
      text: [
        'The DinoPal is a beige plastic egg the size of a walnut, and on its tiny liquid-crystal screen a pixel dinosaur is lying on its side with a single pixel Z drifting up from it and three skulls where its happiness used to be. The note is in Kim\'s furious block capitals: FIX IT. do not tell anyone i cried. p.s. it is named Steve.',
        'Ninety-one days. That\'s a school record; she told you, once, pretending it was stupid. Steve is very sick, and it is 6 a.m., and your fourteen-year-old sister has trusted you with the thing she loves and would die before admitting she loves.',
      ],
      choices: [
        {
          text: '[Hardware] Nurse Steve back the honest way — feed, clean, sit with the little guy.',
          check: {
            skill: 'hardware',
            dc: 10,
            success: 'honest_win',
            fail: 'honest_slow',
            successEffects: [{ xp: 'hardware', add: 6 }],
            failEffects: [{ xp: 'hardware', add: 3 }],
          },
        },
        {
          text: '[Systems] Crack Steve open and set his hunger and health to never run down again.',
          check: {
            skill: 'systems',
            dc: 12,
            success: 'immortal',
            fail: 'immortal_fail',
            successEffects: [{ xp: 'systems', add: 8 }],
            failEffects: [{ xp: 'systems', add: 4 }],
          },
        },
        {
          text: 'Do it all for her while she\'s at school. Hand it back perfect. Take the credit.',
          effects: [{ var: 'kim_trajectory', add: -1 }, { npc: 'kim', affinity: 6 }, { stat: 'mood', add: 3 }],
          goto: 'for_her',
        },
      ],
    },
    honest_win: {
      speaker: 'narrator',
      text: [
        'You don\'t cheat Steve. You feed him, clean up after him, play the little number-guessing game that makes him happy, and sit with the beige egg through a slow beige recovery until the skulls turn back into a smile and the dinosaur stands up and does a two-pixel jump. It takes the whole morning. You are late for everything.',
        'When Kim gets home you hand her the egg and walk her through exactly what you did and why, and when she says "that\'s so slow" you say "yeah — that\'s the part they don\'t sell you," and something in her face goes thoughtful under the eye-roll.',
      ],
      effects: [{ var: 'kim_trajectory', add: 1 }, { npc: 'kim', affinity: 8 }, { stat: 'mood', add: 5 }],
      next: 'kim_home',
    },
    honest_slow: {
      speaker: 'narrator',
      text: [
        'You almost lose Steve. There\'s a bad half-hour where the screen goes to two skulls and you seriously consider that you are going to have to tell a fourteen-year-old her dinosaur died on your watch. But you keep at it — feed, clean, wait, feed — and Steve pulls through by the skin of his pixel teeth.',
        'You show Kim the whole ugly rescue when she gets home, near-death and all. "You almost KILLED Steve," she breathes, delighted and horrified, and you say "almost — but I didn\'t quit," and that, it turns out, is the lesson that sticks.',
      ],
      effects: [{ var: 'kim_trajectory', add: 1 }, { npc: 'kim', affinity: 8 }, { stat: 'mood', add: 4 }, { stat: 'energy', add: -6 }, { stat: 'stress', add: 3 }],
      next: 'kim_home',
    },
    immortal: {
      speaker: 'narrator',
      text: [
        'It takes you four minutes. You pop the back, find the two bytes that matter, and pin Steve\'s hunger and happiness at maximum forever. The dinosaur springs up, cured, immortal, incapable of ever being sad or hungry again. It is, frankly, a beautiful piece of work on a walnut-sized computer.',
        'When Kim gets home you show her the trick — how you found the bytes, how you froze them — and her eyes light up like a slot machine. "So it can NEVER die," she says, turning the egg over. "You just… told it not to." She is not thinking about Steve anymore. She is thinking about everything.',
      ],
      effects: [{ var: 'kim_trajectory', add: -2 }, { npc: 'kim', affinity: 8 }, { stat: 'mood', add: 4 }],
      next: 'kim_home',
    },
    immortal_fail: {
      speaker: 'narrator',
      text: [
        'You crack Steve open and reach for the two bytes that matter — and you fumble the write. For one horrible second the screen fills with garbage, then blanks. You hold your breath and power-cycle the egg, and Steve reboots as a fresh baby dinosaur, ninety-one days wiped to zero.',
        'You spend the next hour carefully raising a new Steve to the point where Kim might not notice, which is its own kind of shortcut lesson. When she gets home she notices immediately — "he\'s doing the BABY walk" — and you come clean about the botched hack, and she\'s quiet, and then she asks you to teach her to do it right next time. Which is the best and most dangerous thing she could have said.',
      ],
      effects: [{ var: 'kim_trajectory', add: -1 }, { npc: 'kim', affinity: 5 }, { stat: 'mood', add: 2 }, { flag: 'side.kim.steve_reset' }],
      next: 'kim_home',
    },
    for_her: {
      speaker: 'narrator',
      text: [
        'You take care of it while she\'s at school — the honest way, quietly, no fuss — and leave Steve on her pillow, cured, with the note flipped over and "you\'re welcome. i told no one" written under her own words.',
        'She never asks how you did it. She just knows that when something she loves is dying, you make it live and you don\'t make her watch. It\'s a kindness. It also teaches her that the machinery is somebody else\'s job, which is either the safest thing you could teach her or the loneliest, and you won\'t know which for about ten years.',
      ],
      next: 'kim_home',
    },
    kim_home: {
      speaker: 'kim',
      text: [
        'That night she leaves a burned CD-R outside your door with STEVE LIVES (do not make it weird) written on it in marker. It has one MP3 on it, a song you both like, ripped slightly wrong so it skips at the good part.',
        'It is the single nicest thing she has ever done for you, and if you mention it she will deny it under oath.',
      ],
      effects: [{ flag: 'side.tamagotchi.done' }],
    },
  },
}

export default defineContent({
  quests: [hauntedModem, fiftyOne, pressAnyKey, tamagotchi],
  scenes: [hauntedModemScene, fiftyOneScene, pressAnyKeyScene, tamagotchiScene],
})
