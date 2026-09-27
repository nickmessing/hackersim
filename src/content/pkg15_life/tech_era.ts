/**
 * PKG-15 — Life events §9.4 (tech mishaps & dial-up nostalgia) + the broadband era steps (§9.0).
 *
 *  - life_download_98        Act I–II on dial-up: the 98% failure.
 *  - life_modem_song         one-off: record the handshake → `life.modem_song` (read at broadband).
 *  - life_aol_disc_tower     Act I: the free-trial disc sculpture (all discs fictional brands).
 *  - life_crt_dies           rare, still on the starter 14" CRT: a forced hardware decision.
 *  - life_y2k_holdout        one-off Act I–II: Gus's bunker network → `life.y2k_safehouse`
 *                            (a fail schedules a second chance, so the flag is always reachable).
 *                            life_y2k_safehouse: Act IV heat-decay buff while the heat is on.
 *  - life_broadband_arrives  ~2003: `w.broadband` 0→1, publishes `broadband_harbor`.
 *  - trig_broadband_2        ~day 1400: `w.broadband` → 2 (cable).
 *  - trig_broadband_3        ~day 3300: `w.broadband` → 3 (fiber).
 *  - life_camera_phone       ~2004: surveillance normalization, via Kim (or Jax).
 */
import { dayOf } from '@/engine/calendar'
import { defineContent } from '@/engine/registry'
import type { BuffDef, SceneDef, TriggerDef } from '@/engine/types'
import { QUIET_RESET, actGte, actLte, around, atParents, close, free, onDialup } from './_shared'

const TV_MONITOR: BuffDef = {
  id: 'life_tv_monitor',
  name: 'Squinting at a TV',
  desc: 'You are using a 13-inch television as a monitor. Everything is blurry and slightly orange.',
  days: 21,
  bad: true,
  mods: [
    { key: 'efficiency', mult: 0.92 },
    { key: 'stress.gain', mult: 1.05 },
  ],
}
const SAFEHOUSE: BuffDef = {
  id: 'life_y2k_bunker',
  name: 'Gus\'s Bunker',
  desc: 'A concrete room under Cannery Row with its own generator, its own phone line and no windows. Nobody looks for you there.',
  days: 20,
  mods: [{ key: 'heat.decay', add: 0.5 }],
}

const oldMonitorOnly = {
  all: [{ item: 'crt_14in' }, { not: { item: 'crt_17in' } }, { not: { item: 'crt_19in' } }, { not: { item: 'monitor_lcd' } }],
}

const scenes: SceneDef[] = [
  // ── life_download_98 ─────────────────────────────────────────────────────
  {
    id: 'life_download_98',
    channel: 'dialog',
    title: '98%',
    start: 'start',
    nodes: {
      start: {
        speaker: 'narrator',
        text: [
          `Three hours and forty minutes. Forty-one megabytes of a shareware racing game at 3.8 kilobytes a second, through a phone line that also carries your mother's opinions about the phone bill.`,
          `The progress bar says 98%. ESTIMATED TIME REMAINING: 1 MINUTE. You have been awake for twenty hours for this.`,
          `Then, from the modem, a sound like a small robot choking on a grape. CONNECTION TO REMOTE HOST LOST. Your download manager, a free program with a cartoon frog mascot, thinks about it, and displays: FILE INCOMPLETE. RESTART DOWNLOAD?`,
        ],
        choices: [
          {
            text: `No. The frog can resume. Coax the partial file back to life.`,
            tag: '[Networking]',
            check: {
              skill: 'networking',
              dc: 10,
              success: 'resumed',
              fail: 'garbage',
              successEffects: [{ stat: 'mood', add: 8 }, { xp: 'networking', add: 20 }],
              failEffects: [{ stat: 'mood', add: -4 }, { xp: 'networking', add: 10 }, { stat: 'stress', add: 2 }, { stat: 'energy', add: -4 }],
            },
          },
          {
            text: `Restart. From zero. Three hours and forty minutes. You are a monk.`,
            effects: [{ stat: 'energy', add: -12 }, { stat: 'mood', add: 3 }, { stat: 'stress', add: 3 }],
            goto: 'monk',
          },
          {
            text: `Page Jax. He has the game. He has everything.`,
            if: around('jax'),
            effects: [{ npc: 'jax', affinity: 2 }, { stat: 'mood', add: 4 }],
            goto: 'jax',
          },
          {
            text: `Throw the mouse. Not hard. Just enough.`,
            effects: [{ stat: 'stress', add: -4 }, { stat: 'mood', add: -2 }],
            goto: 'mouse',
          },
        ],
      },
      resumed: {
        speaker: 'narrator',
        text: `You redial, point the frog at the partial file, and tell it, very gently, to pick up where it left off. The server thinks about it. The server agrees. Twelve seconds later: DOWNLOAD COMPLETE. You unzip it, install it, and play it for eleven minutes before falling asleep on the keyboard. The frog is your best friend now.`,
      },
      garbage: {
        speaker: 'narrator',
        text: `The resumed file is the right size and completely wrong inside: the archive opens to a single text file, 41 megabytes of the same ASCII drawing of a sailboat, repeated four hundred thousand times. Somewhere a server has a sense of humor. You print one sailboat and pin it to the wall as a warning. Then you restart the download.`,
      },
      monk: {
        speaker: 'narrator',
        text: `You click RESTART with the serenity of a man stepping into a cold lake. At 3:10 a.m. the bar hits 98% again, and you watch it like a hawk watches a field mouse, and at 3:11 it completes. You have never been prouder of anything. You tell no one, because there is no one awake to tell.`,
      },
      jax: {
        speaker: 'jax',
        text: [`"98%?? DUDE. that is the WORST percent"`, `"i have it on cd. i burned it tuesday. u could have ASKED"`, `"bringing it over. also bringing chips. also i am staying to watch u play it"`],
      },
      mouse: {
        speaker: 'narrator',
        text: `The mouse hits the wall, the ball pops out, rolls under the bed, and is gone forever. You spend twenty minutes on your stomach with a flashlight looking for it. You find a pen, a quarter, a floppy labelled DO NOT FORMAT, and a crushing sense of perspective. Not the ball.`,
      },
    },
  },

  // ── life_modem_song ──────────────────────────────────────────────────────
  {
    id: 'life_modem_song',
    channel: 'dialog',
    title: 'Handshake',
    start: 'start',
    nodes: {
      start: {
        speaker: 'narrator',
        text: [
          `Two in the morning. The house asleep. You click CONNECT and the modem does what it does every night: the dial tone, the eleven quick notes of the number, and then the song. The rising whistle. The crunch. The two machines screaming politely at each other across the city, bargaining over how fast they're allowed to talk.`,
          `You've heard it a thousand times. Tonight, for some reason, you actually listen to it. It sounds like a door opening.`,
        ],
        choices: [
          {
            text: `Record it. Mic from the old karaoke machine, pressed against the speaker.`,
            effects: [{ flag: 'life.modem_song' }, { stat: 'mood', add: 6 }, { stat: 'stress', add: -4 }],
            goto: 'recorded',
          },
          {
            text: `Hum along. Nobody has to know.`,
            effects: [{ stat: 'mood', add: 4 }],
            goto: 'hum',
          },
          {
            text: `Turn the modem speaker off in the settings. You have neighbors.`,
            effects: [{ stat: 'stress', add: -2 }],
            goto: 'mute',
          },
        ],
      },
      recorded: {
        speaker: 'narrator',
        text: `Forty-one seconds, saved as HANDSHAKE.WAV, 3.1 megabytes, which is an insane amount of hard drive for a noise. You burn it onto a CD by itself, label it in marker (SONG OF MY PEOPLE) and put it in the shoebox with the things you'll keep. You don't know yet why. You will.`,
      },
      hum: {
        speaker: 'narrator',
        text: `You hum the rising part. You try the crunchy part and fail, and laugh at yourself in the dark, and the modem finishes its song and goes quiet, connected. Down the hall, Kim, who was also awake, texts your pager a single word: "nerd". She was humming too. You both know it.`,
      },
      mute: {
        speaker: 'narrator',
        text: `One checkbox and the modem goes silent. It connects anyway, in the dark, without a word, like someone slipping out of a party. It's more efficient. It's also, for reasons you can't explain, a little sad. You leave it off.`,
      },
    },
  },

  // ── life_aol_disc_tower ──────────────────────────────────────────────────
  {
    id: 'life_aol_disc_tower',
    channel: 'dialog',
    title: '500 FREE HOURS',
    start: 'start',
    nodes: {
      start: {
        speaker: 'narrator',
        text: [
          `They arrive in the mail. They arrive in cereal boxes. They are handed out at the supermarket checkout and left on the seats of city buses. PortalOne: 500 FREE HOURS! NorthLink Freedom: 700 FREE HOURS! A company called SkyNest nobody has ever heard of: 1,000 FREE HOURS, FIRST MONTH ONLY, CONDITIONS APPLY!`,
          `There are, by Kim's careful count, one hundred and thirty-seven free-trial discs in the flat. They are shiny. They are useless. They are, she points out, a building material.`,
        ],
        choices: [
          {
            text: `Build a tower. A proper one, with a spire, to the ceiling.`,
            tag: '[Hardware]',
            check: {
              skill: 'hardware',
              dc: 9,
              success: 'tower',
              fail: 'collapse',
              successEffects: [{ npc: 'kim', affinity: 4 }, { stat: 'mood', add: 6 }],
              failEffects: [{ npc: 'kim', affinity: 3 }, { stat: 'mood', add: 4 }, { stat: 'energy', add: -4 }],
            },
          },
          {
            text: `Sell them to the Cathode as coasters.`,
            tag: '[Business]',
            check: {
              skill: 'business',
              dc: 11,
              success: 'coasters',
              fail: 'coasters_no',
              successEffects: [{ money: 25 }, { npc: 'sal', affinity: 2 }],
              failEffects: [{ npc: 'sal', affinity: 1 }, { stat: 'mood', add: -1 }],
            },
          },
          {
            text: `Hang them in the window. Every bus on the Row gets a disco ball.`,
            effects: [{ faction: 'fac.hood', add: 2 }, { stat: 'mood', add: 4 }],
            goto: 'window',
          },
        ],
      },
      tower: {
        speaker: 'narrator',
        text: [
          `It takes an afternoon, a hot-glue gun and a sophisticated architectural dispute about load-bearing SkyNest discs. The finished tower is five feet tall, spirals like a seashell, and catches the light so hard it projects rainbows onto the ceiling.`,
          `Kim names it THE MONUMENT TO FREE HOURS. Dad photographs it. Mom dusts it once a week for three years and refuses every attempt to move it.`,
        ],
      },
      collapse: {
        speaker: 'narrator',
        text: `At four feet the tower achieves consciousness and chooses death. One hundred and thirty-seven discs pour across the living room floor like a silver avalanche. Kim lies down in them and makes a disc angel. You join her. Mom comes home, looks at the two of you lying in a pile of garbage, and says, "Good. You're finally resting."`,
      },
      coasters: {
        speaker: 'sal',
        text: `"A coaster that says 700 free hours," says Sal, turning one over. "My customers could use a laugh." He buys forty of them for a quarter each, gives you a free pie to seal the deal, and puts a sign on the counter: TAKE A COASTER — FREE INTERNET NOT INCLUDED.`,
      },
      coasters_no: {
        speaker: 'sal',
        text: `Sal looks at a disc for a long time. "Kid, I got coasters. I got cardboard coasters, I got a guy." He gives you a cup of coffee on the house, though, and uses one of your discs to level the wobbly table by the window. It's still there years later.`,
      },
      window: {
        speaker: 'narrator',
        text: `You string sixty discs on fishing line across the front window. At four in the afternoon the sun comes down the Row and the flat throws light across the whole street: little spinning rainbows on the laundromat, the bus stop, the side of the 22 bus. A little girl across the road waves at them every day for a year.`,
      },
    },
  },

  // ── life_crt_dies ────────────────────────────────────────────────────────
  {
    id: 'life_crt_dies',
    channel: 'dialog',
    title: 'Degauss',
    start: 'start',
    nodes: {
      start: {
        speaker: 'narrator',
        text: [
          `Your fourteen-inch monitor, faithful servant, warm curved window onto the world, makes a noise you've never heard it make: a high thin whine, a pop, and a smell like a hair dryer eating a hot dog.`,
          `The picture shrinks to a single horizontal line across the middle of the screen, glows there for a moment like the last thought of a dying man, and goes out.`,
        ],
        choices: [
          {
            text: `Buy the 17-inch CRT at CompCastle. ($180)`,
            req: { stat: 'money', gte: 180 },
            reqText: 'Requires $180',
            effects: [{ money: -180 }, { item: 'crt_17in' }, { stat: 'mood', add: 4 }],
            goto: 'new',
          },
          {
            text: `Get a used one from the pawn shop on Sodium Row. ($90)`,
            req: { stat: 'money', gte: 90 },
            reqText: 'Requires $90',
            effects: [{ money: -90 }, { item: 'crt_17in' }],
            goto: 'pawn',
          },
          {
            text: `Open it up and bring it back from the dead.`,
            tag: '[Hardware]',
            check: {
              skill: 'hardware',
              dc: 14,
              bonuses: [{ if: around('dad'), add: 2, label: '+2 (Dad holds the flashlight and tells you not to touch the big capacitor)' }],
              success: 'revived',
              fail: 'tv',
              successEffects: [{ xp: 'hardware', add: 40 }, { stat: 'mood', add: 6 }],
              failEffects: [{ buff: TV_MONITOR }, { stat: 'stress', add: 4 }],
            },
          },
          {
            text: `Plug the computer into the little kitchen TV for now.`,
            effects: [{ buff: TV_MONITOR }],
            goto: 'tv',
          },
        ],
      },
      new: {
        speaker: 'narrator',
        text: `You carry it home in its box on the bus, hugging it like a child, because it is too heavy to hold any other way. It takes up the whole desk. It hums a slightly different note. The first time you turn it on, the degauss thunk rattles the window, and the picture is so crisp you can see the pixels in your own handle.`,
      },
      pawn: {
        speaker: 'narrator',
        text: `The pawn-shop monitor has a sticker on the side that says PROPERTY OF LUMEN STATE UNIV — DO NOT REMOVE, which you remove. It has a faint burn-in of a spreadsheet in the top left corner, a ghost of somebody else's work. You get used to it. After a while you even like it. You call it Gerald.`,
      },
      revived: {
        speaker: 'narrator',
        text: `A cracked solder joint on the flyback board, a joint the size of a grain of rice. You find it with a magnifying glass and fix it with a soldering iron you bought for a school project in the eighth grade. The screen blinks, thunks, and comes back, a little dimmer and a little greener, alive. You feel like a surgeon. You smell like one too.`,
      },
      tv: {
        speaker: 'narrator',
        text: `The kitchen TV works, technically. Everything is blurry and slightly orange, the text is the size of a billboard, and at the edges of the screen the menus bend like they're underwater. You squint through three weeks of this. It is character-building. Your character, it turns out, is mostly a headache.`,
      },
    },
  },

  // ── life_y2k_holdout ─────────────────────────────────────────────────────
  {
    id: 'life_y2k_holdout',
    channel: 'dialog',
    title: 'The Bunker',
    start: 'start',
    nodes: {
      start: {
        speaker: 'Gus Pellegrino',
        text: [
          `Gus Pellegrino runs the hardware store on the corner and, it turns out, a concrete room under it, down a ladder, behind a door that used to belong to a bank vault.`,
          `Inside: canned peaches to the ceiling. Two generators. A hand-crank radio. Four computers wired together with more cable than the city library, blinking, all of them set to the date December 31, 1999.`,
          `"Everybody laughed," says Gus. "Y2K was a hoax, they said. Nothing happened." He folds his arms. "Nothing happened because people like me were READY. But the network's gone funny. The machines won't talk to each other. And you're the computer kid."`,
        ],
        choices: [
          {
            text: `Untangle the network.`,
            tag: '[Systems]',
            check: {
              skill: 'systems',
              dc: 13,
              bonuses: [{ if: { background: 'tinkerer' }, add: 2, label: '+2 (you have been in worse basements)' }],
              success: 'fixed',
              fail: 'fried',
              successEffects: [{ flag: 'life.y2k_safehouse' }, { faction: 'fac.hood', add: 3 }, { xp: 'systems', add: 30 }],
              failEffects: [{ stat: 'mood', add: -2 }, { stat: 'health', add: -3 }, { scene: 'life_y2k_second_try', delayHours: 24 * 20 }],
            },
          },
          {
            text: `Rewire it by hand, one cable at a time.`,
            tag: '[Hardware]',
            check: {
              skill: 'hardware',
              dc: 12,
              success: 'fixed',
              fail: 'fried',
              successEffects: [{ flag: 'life.y2k_safehouse' }, { faction: 'fac.hood', add: 3 }, { xp: 'hardware', add: 30 }],
              failEffects: [{ stat: 'mood', add: -2 }, { stat: 'health', add: -3 }, { scene: 'life_y2k_second_try', delayHours: 24 * 20 }],
            },
          },
          {
            text: `"Gus, it's been two years. You can let the machines have 2002."`,
            effects: [{ faction: 'fac.hood', add: -1 }, { scene: 'life_y2k_second_try', delayHours: 24 * 45 }],
            goto: 'refuse',
          },
        ],
      },
      fixed: {
        speaker: 'Gus Pellegrino',
        text: [
          `Two hours on your back under a folding table with a flashlight in your teeth. The four machines were fighting over the same address, like four brothers claiming the same bedroom. You give each of them a room of its own. The lights settle into a steady, happy blink.`,
          `Gus watches with his arms crossed, then uncrossed. Then he takes a key off his ring (big, brass, heavy) and puts it in your hand. "The bunker. Anytime. Own phone line, own power, nobody's name on it." He looks at you over his glasses. "I watch the news, kid. Someday you might need a room with no windows."`,
        ],
      },
      fried: {
        speaker: 'narrator',
        text: `You swap one cable too many and one of the generators coughs, bangs, and fills the bunker with smoke that smells like a birthday cake on fire. Gus hustles you up the ladder. "Not your fault," he says, coughing. "The generator's from 1979. Come back when I've got a new one. I'll call you." He's not angry. He's writing it down on a list.`,
      },
      refuse: {
        speaker: 'Gus Pellegrino',
        text: `"2002," he says, scornfully. "2002 is when they get you, when you think it's over." He gets you a can of peaches for the road anyway. "The offer stands. You'll come around. Everybody comes around to the bunker, eventually."`,
      },
    },
  },
  {
    id: 'life_y2k_second_try',
    channel: 'mail',
    title: 'NEW GENERATOR. BUNKER. YOU.',
    from: 'Gus Pellegrino',
    start: 'start',
    nodes: {
      start: {
        text: [
          `Kid,`,
          `Got a new generator. Diesel. Sounds like a truck. The computers still don't talk. Come down Saturday. I've got coffee and I've got peaches and I have finally, finally, set the date to 2002, God help me.`,
          `— Gus\nPellegrino Hardware, "If We Don't Have It, You Don't Need It"`,
        ],
        choices: [
          {
            text: `Go down Saturday and do it properly this time.`,
            tag: '[Systems]',
            check: {
              skill: 'systems',
              dc: 11,
              bonuses: [{ if: { skill: 'hardware', gte: 15 }, add: 2, label: '+2 (you know the cabling now)' }],
              success: 'done',
              fail: 'gus_does_it',
              successEffects: [{ flag: 'life.y2k_safehouse' }, { faction: 'fac.hood', add: 3 }],
              failEffects: [{ flag: 'life.y2k_safehouse' }, { faction: 'fac.hood', add: 1 }],
            },
          },
          { text: `Reply: "Can't this weekend, Gus. Sorry."`, effects: [{ faction: 'fac.hood', add: -1 }] },
        ],
      },
      done: {
        text: `This time it goes clean. The four machines blink in unison like a row of patient cats. Gus presses the brass key into your palm: "Anytime. Nobody's name on it." You put it on your keyring. It's the heaviest thing on there. It will be, for years.`,
      },
      gus_does_it: {
        text: `You get it three-quarters of the way and run out of ideas. Gus, watching over your shoulder for two hours, finishes it himself with a trick he read about in a magazine in 1998. "See," he says, "we make a team." He gives you a key to the bunker anyway. "For the moral support."`,
      },
    },
  },

  // ── life_broadband_arrives ───────────────────────────────────────────────
  {
    id: 'life_broadband_arrives',
    channel: 'dialog',
    title: 'Always On',
    start: 'start',
    nodes: {
      start: {
        speaker: 'narrator',
        text: [
          `The NorthLink van is parked on Harbor Point with a banner on its side: ALWAYS ON. NEVER A BUSY SIGNAL. NorthLink DSL — Harbor Point First! Men in hard hats are feeding orange cable into the ground outside the yacht club.`,
          `The Row, of course, is not first. The Row is "Phase 3, subject to demand." But for the first time you can buy it, if you can find a line, and it changes the math of everything: no handshake, no dialing, no Mom picking up the extension. Just a little green light that never goes out.`,
          { if: { flag: 'life.modem_song' }, text: `That night you play HANDSHAKE.WAV once, on purpose, before bed. Forty-one seconds. It sounds like somebody you used to know.` },
        ],
        choices: [
          {
            text: `Put your name on the waiting list today.`,
            effects: [{ stat: 'mood', add: 4 }],
            goto: 'list',
          },
          {
            text: `Stay on dial-up out of loyalty. The modem has been good to you.`,
            if: onDialup,
            effects: [{ stat: 'mood', add: 3 }, { stat: 'stress', add: -2 }],
            goto: 'loyal',
          },
          {
            text: `Call Jax. This changes the LAN parties forever.`,
            if: around('jax'),
            effects: [{ npc: 'jax', affinity: 3 }],
            goto: 'jax',
          },
        ],
      },
      list: {
        speaker: 'narrator',
        text: `The NorthLink rep on the phone is so excited she sounds like she's on commission, which she is. "Once you go always-on," she says, "you'll never remember how you lived without it." You laugh. Later, it occurs to you that the line is a little bit sinister, and that she didn't mean it that way, and that it's true.`,
      },
      loyal: {
        speaker: 'narrator',
        text: `You pat the modem. It is a beige plastic box with three blinking lights and no feelings. It connects that night with its usual song, and you listen to the whole thing, and you feel like you're sitting with an old dog who doesn't know about the new puppy yet.`,
      },
      jax: {
        speaker: 'jax',
        text: [`"ALWAYS ON. dude. DUDE."`, `"no more 'ok everyone hang up ur phones at the same time on 3'"`, `"we could play from our own HOUSES. like. at the same time. like the future"`, `"...wait then why would u come over. no. we keep the garage. the garage is sacred"`],
      },
    },
  },
  {
    id: 'life_broadband_cable',
    channel: 'mail',
    title: 'NorthLink CableRocket is on your street!',
    from: 'NorthLink',
    start: 'start',
    nodes: {
      start: {
        text: [
          `Good news, neighbor!`,
          `NorthLink CableRocket high-speed internet is now available in YOUR neighborhood. Download a full song in under a minute! Stream video without the wait! Share your photos with family across the Sound!`,
          `Plus: with CableRocket, your connection is protected by NorthLink's award-winning Network Care team, who monitor our network around the clock so you don't have to.`,
          `NorthLink. "Your City, Connected."`,
          { if: { flag: 'a2.phase_iib' }, text: `Monitor our network around the clock. You read that line three times.` },
        ],
        choices: [{ text: `File it.`, effects: [{ stat: 'mood', add: 1 }] }],
      },
    },
  },
  {
    id: 'life_broadband_fiber',
    channel: 'mail',
    title: 'Welcome to the LightLine Era',
    from: 'NorthLink',
    start: 'start',
    nodes: {
      start: {
        text: [
          `NorthLink LightLine fiber has arrived in Port Lumen.`,
          `The speed of light, delivered to your door. Every home. Every device. Every moment of your connected life, faster than ever before.`,
          `Note: LightLine service includes NorthLink SmartInsights, which uses anonymized usage patterns to improve your experience. Participation is required under the Municipal Network Security framework where applicable.`,
          `There is no handshake anymore. There hasn't been for years. The fiber just is, like the weather, like the fog off the Sound, and it goes everywhere, and it remembers.`,
        ],
        choices: [
          { text: `File it.`, effects: [{ stat: 'mood', add: -1 }] },
          { text: `Dig the old modem out of the closet and hold it for a minute.`, effects: [{ stat: 'mood', add: 2 }, { stat: 'stress', add: -3 }] },
        ],
      },
    },
  },

  // ── life_camera_phone ────────────────────────────────────────────────────
  {
    id: 'life_camera_phone',
    channel: 'chat',
    title: 'look at THIS',
    from: 'kim',
    start: 'start',
    nodes: {
      start: {
        text: [
          `omg my phone has a CAMERA now`,
          `[photo: you, asleep on Mom's couch, mouth open, a cheese puff on your chest]`,
          `[photo: you, at the Cathode, from across the street, through the window]`,
          `[photo: you, getting on the 22 bus, from BEHIND, i was in the back]`,
          `i took 40 today. i am basically a spy. u never even noticed lol`,
        ],
        choices: [
          { text: `"delete the cheese puff one. i am begging"`, effects: [{ npc: 'kim', affinity: 2 }, { stat: 'mood', add: 3 }], goto: 'cheese' },
          {
            text: `"lesson 1: if u can see me, i should see u first"`,
            tag: '[OpSec]',
            check: {
              skill: 'opsec',
              dc: 12,
              success: 'lesson',
              fail: 'lesson_bad',
              successEffects: [{ npc: 'kim', affinity: 3 }, { xp: 'opsec', add: 20 }],
              failEffects: [{ npc: 'kim', affinity: 1 }, { var: 'kim_trajectory', add: -1 }, { stat: 'stress', add: 2 }],
            },
          },
          { text: `"...wait. u followed me to the bus?"`, effects: [{ stat: 'stress', add: 2 }], goto: 'uneasy' },
        ],
      },
      cheese: { text: [`NEVER`, `it is my screensaver now`, `it is going in the slideshow at ur wedding`] },
      lesson: {
        text: [`ok that was creepy and cool`, `u just told me where i was standing for all 3 without looking`, `...how many ppl could do that to u. with a phone. every day`, `nvm dont answer that`],
      },
      lesson_bad: { text: [`lol ok spy master`, `[photo: you, right now, reading this, taken through ur bedroom door]`, `lesson 1 failed`] },
      uneasy: {
        text: [`just for fun!! it's like a game`, `everybody's doing it. half my class has a camera phone now, u cant go anywhere without being in somebody's pictures`, `anyway u look fine in all of them. except the cheese puff`],
      },
    },
  },
  {
    id: 'life_camera_phone_jax',
    channel: 'chat',
    title: 'cameraphone!!',
    from: 'jax',
    start: 'start',
    nodes: {
      start: {
        text: [
          `DUDE my new phone takes PICTURES`,
          `[photo: a blurry thumb]`,
          `[photo: you at the Cathode. from outside. through the window. u look like a sad detective]`,
          `every phone in the city is gonna have one of these by next year. we're all gonna be on camera all the time lol`,
        ],
        choices: [
          { text: `"cool cool cool. extremely normal thing to be excited about"`, effects: [{ npc: 'jax', affinity: 2 }], goto: 'lol' },
          { text: `"jax. delete the ones of the back room. now."`, effects: [{ npc: 'jax', affinity: -1 }, { stat: 'heat', add: -2 }], goto: 'delete' },
        ],
      },
      lol: { text: [`it IS normal. it's the future`, `smile for the future :)`] },
      delete: { text: [`...oh`, `oh. yeah. ok. deleted`, `man i didnt even think about that`, `that's kinda the scary part huh`] },
    },
  },
]

const triggers: TriggerDef[] = [
  {
    id: 'life_download_98',
    when: { all: [onDialup, actLte(2), free, { day: true, gte: 3 }] },
    atHour: 22,
    chance: 0.04,
    effects: [QUIET_RESET, { scene: 'life_download_98' }],
  },
  {
    id: 'life_modem_song',
    when: { all: [onDialup, free, { day: true, gte: 10 }, { var: 'w.broadband', eq: 0 }] },
    atHour: 2,
    chance: 0.08,
    effects: [QUIET_RESET, { scene: 'life_modem_song' }],
  },
  {
    id: 'life_aol_disc_tower',
    when: { all: [actLte(1), atParents, around('kim'), free, { day: true, gte: 25 }] },
    atHour: 15,
    chance: 0.05,
    effects: [QUIET_RESET, { scene: 'life_aol_disc_tower' }],
  },
  {
    id: 'life_crt_dies',
    when: { all: [oldMonitorOnly, free, { day: true, gte: 90 }] },
    atHour: 21,
    chance: 0.004,
    effects: [QUIET_RESET, { scene: 'life_crt_dies' }],
  },
  {
    id: 'life_y2k_holdout',
    when: { all: [actLte(2), free, { day: true, gte: 40 }, { not: { flag: 'a2.phase_iib' } }] },
    atHour: 11,
    chance: 0.03,
    effects: [QUIET_RESET, { scene: 'life_y2k_holdout' }],
  },
  {
    id: 'life_y2k_safehouse',
    when: { all: [{ flag: 'life.y2k_safehouse' }, actGte(4), { stat: 'heat', gte: 35 }, free] },
    once: false,
    cooldownDays: 30,
    atHour: 23,
    effects: [
      { buff: SAFEHOUSE },
      { notify: `You go to ground in Gus's bunker for a while. Nobody looks for you under a hardware store.`, kind: 'heat' },
    ],
  },
  {
    id: 'life_broadband_arrives',
    when: { all: [{ day: true, gte: dayOf(2003, 3, 1) }, { var: 'w.broadband', lte: 0 }] },
    atHour: 10,
    effects: [QUIET_RESET, { var: 'w.broadband', add: 1 }, { news: 'broadband_harbor' }, { if: free, then: [{ scene: 'life_broadband_arrives' }] }],
  },
  {
    id: 'trig_broadband_2',
    when: { all: [{ day: true, gte: 1400 }, { var: 'w.broadband', eq: 1 }] },
    atHour: 9,
    effects: [{ var: 'w.broadband', add: 1 }, { scene: 'life_broadband_cable' }],
  },
  {
    id: 'trig_broadband_3',
    when: { all: [{ day: true, gte: 3300 }, { var: 'w.broadband', eq: 2 }] },
    atHour: 9,
    effects: [{ var: 'w.broadband', add: 1 }, { scene: 'life_broadband_fiber' }],
  },
  {
    id: 'life_camera_phone',
    when: { all: [{ day: true, gte: dayOf(2004, 4, 1) }, free, { any: [close('kim', 20), around('jax')] }] },
    atHour: 17,
    chance: 0.06,
    effects: [QUIET_RESET, { if: close('kim', 20), then: [{ scene: 'life_camera_phone' }], else: [{ scene: 'life_camera_phone_jax' }] }],
  },
]

export default defineContent({ scenes, triggers })
