/**
 * COMPLICATION PACK — hack source, low/mid tier (traces & exposure).
 *
 *   cx_ops_trace_beacon    T1-2  repeatable — a target hardened and a beacon fired; a lingering trace debuff.
 *   cx_ops_sysadmin_nastygram T1-2 repeatable — a furious admin emails your handle; apologize / taunt / ignore.
 *   cx_ops_isp_cutoff      T1-2  once — NorthLink terminates your account (pay / grovel / burner line).
 *   cx_ops_mystery_package T2-3  once — someone mails you a printout of your own logs as a warning.
 *   cx_ops_copycat_handle  T1-3  once, quest — a copycat pulls dirty jobs as YOU; disavow / hunt / let it ride.
 *   cx_ops_burned_alias    T2-3  once, quest — the board outs your handle as sloppy; rebuild or retire it.
 *
 * All "tracing", "beacons" and "burner lines" are invented, abstract game mechanics — never a real procedure.
 */
import { defineContent } from '@/engine/registry'
import type { EventDef, QuestDef, SceneDef } from '@/engine/types'
import { buff, debuff, hasScar, scar } from './_shared'

// ─────────────────────────────────────────────────────────────────────────────
// cx_ops_trace_beacon — you poked something that poked back
// ─────────────────────────────────────────────────────────────────────────────
const traceBeaconScene: SceneDef = {
  id: 'cx_ops_trace_beacon_scene',
  channel: 'mail',
  title: 'automated notice: unusual activity',
  from: 'Sentinel Monitoring',
  start: 'note',
  nodes: {
    note: {
      speaker: 'Sentinel Monitoring',
      text: [
        'It comes in overnight, an ugly auto-generated thing with a logo like a lighthouse: SENTINEL MONITORING SERVICES, on behalf of a client you touched last week.',
        '"Our systems recorded an access attempt matching a known pattern. A notification beacon has been logged. This message confirms the event was recorded." No name. No threat. Just: we saw a shape, and the shape looked like you.',
        "Nothing happens. That's the point. Somewhere your handle is a line in a spreadsheet now, and the next time you come near that client, the line gets longer.",
      ],
      choices: [
        {
          text: 'Cool the handle for a couple of weeks and reroute everything.',
          effects: [
            { stat: 'stress', add: 4 },
            debuff('cx_ops_beaconed', 'Beaconed', 14, [{ key: 'trace', mult: 0.85 }], 'A monitoring service flagged your pattern; traces come faster until it ages out.'),
            { flag: 'cx_ops.tripped_beacon' },
          ],
        },
        {
          text: '"Recorded" is not "identified." Delete it and keep working.',
          effects: [
            { stat: 'heat', add: 3 },
            debuff('cx_ops_beaconed', 'Beaconed', 21, [{ key: 'trace', mult: 0.8 }], "You ignored a monitoring flag; it's still watching for your shape."),
            { flag: 'cx_ops.tripped_beacon' },
          ],
        },
      ],
    },
  },
}

const traceBeacon: EventDef = {
  id: 'cx_ops_trace_beacon',
  category: 'underground',
  complication: { sources: ['hack'], minTier: 1, maxTier: 2 },
  repeatable: true,
  cooldownDays: 90,
  scene: 'cx_ops_trace_beacon_scene',
}

// ─────────────────────────────────────────────────────────────────────────────
// cx_ops_sysadmin_nastygram — a very angry human on the other end
// ─────────────────────────────────────────────────────────────────────────────
const nastygramScene: SceneDef = {
  id: 'cx_ops_nastygram_scene',
  channel: 'mail',
  title: 're: re: re: STAY OFF MY NETWORK',
  from: 'The Admin',
  start: 'rant',
  nodes: {
    rant: {
      speaker: 'The Admin',
      text: [
        "The email has been forwarded to your handle through three hops, which means somebody enjoyed the chase of finding a way to reach you at all.",
        `"{handle}. I know it was you. I rebuilt that box on a SATURDAY. I have a kid. I coach little league. I am going to spend my one free weekend a month for the rest of my LIFE hardening every machine you have ever breathed on, and I am going to enjoy it. Sincerely, the guy whose pager you woke up. STAY OFF MY NETWORK."`,
        'It is, weirdly, the most human thing anyone has sent you all month.',
      ],
      choices: [
        {
          text: '[Apologize] "You\'re right. It was sloppy and it won\'t happen again. Go coach your team."',
          tag: '[Social]',
          check: {
            skill: 'social',
            dc: 12,
            success: 'truce',
            fail: 'awkward',
          },
        },
        {
          text: '"little league huh. what division" (needle him)',
          effects: [
            { stat: 'heat', add: 4 },
            { flag: 'cx_ops.admin_enemy' },
            { stat: 'mood', add: 2 },
            debuff('cx_ops_admin_watch', 'Watched by an Admin', 14, [{ key: 'trace', mult: 0.9 }], 'A furious sysadmin is personally hardening everything you touch.'),
          ],
        },
        {
          text: 'Do not dignify it. Close the mail.',
          effects: [{ stat: 'stress', add: 2 }],
        },
      ],
    },
    truce: {
      speaker: 'The Admin',
      text: [
        '"...huh. Nobody\'s ever written back before." A long pause in the reply. "Okay. Truce. But I\'m still checking my logs, kid. Go be sloppy somewhere that isn\'t mine."',
        'He even signs it with his little league team\'s name. You feel, briefly, like a person who did a small right thing.',
      ],
      effects: [
        { stat: 'mood', add: 4 },
        { xp: 'social', add: 40 },
        { flag: 'cx_ops.admin_truce' },
      ],
    },
    awkward: {
      speaker: 'The Admin',
      text: [
        '"Save it. \'Sorry\' is what everyone says right before they do it again." He\'s not wrong, historically.',
        'He goes quiet after that, which is worse than shouting. Somewhere a man is grimly patching every hole you know about.',
      ],
      effects: [
        { stat: 'stress', add: 4 },
        { flag: 'cx_ops.admin_enemy' },
        debuff('cx_ops_admin_watch', 'Watched by an Admin', 14, [{ key: 'trace', mult: 0.9 }], 'A sysadmin who does not believe you is hardening everything you touch.'),
      ],
    },
  },
}

const nastygram: EventDef = {
  id: 'cx_ops_sysadmin_nastygram',
  category: 'underground',
  complication: { sources: ['hack'], minTier: 1, maxTier: 2 },
  repeatable: true,
  cooldownDays: 75,
  scene: 'cx_ops_nastygram_scene',
}

// ─────────────────────────────────────────────────────────────────────────────
// cx_ops_isp_cutoff — NorthLink pulls your dial-tone
// ─────────────────────────────────────────────────────────────────────────────
const ispScene: SceneDef = {
  id: 'cx_ops_isp_cutoff_scene',
  channel: 'mail',
  title: 'NOTICE OF ACCOUNT TERMINATION',
  from: 'NorthLink Abuse Desk',
  start: 'cut',
  nodes: {
    cut: {
      speaker: 'NorthLink Abuse Desk',
      text: [
        'You pick up the phone to dial in and get a recorded voice instead of a handshake. Then the letter arrives, on real NorthLink letterhead, cheerfully worded and completely final.',
        '"Your account has been TERMINATED for violation of our Acceptable Use Policy following complaints traced to your line. Service has been suspended. To discuss reconnection, contact the Abuse Desk during business hours (please have your account PIN and a good attitude ready)."',
        "Your modem sits there blinking, offended. You are, for the moment, a person with a computer and no way to reach the world.",
      ],
      choices: [
        {
          text: '[Pay the reconnection fee and eat the warning.]',
          tag: '[$120]',
          req: { stat: 'money', gte: 120 },
          reqText: 'Requires $120',
          effects: [
            { money: -120 },
            { flag: 'cx_ops.isp_restored' },
            { flag: 'cx_ops.isp_paid' },
            { removeBuff: 'cx_ops_offline' },
            { notify: 'Back online. NorthLink took your money and your dignity in that order.', kind: 'money' },
          ],
        },
        {
          text: '"There must be a misunderstanding." Charm the Abuse Desk.',
          tag: '[Social DC 13]',
          check: {
            skill: 'social',
            dc: 13,
            success: 'grovel_ok',
            fail: 'grovel_no',
          },
        },
        {
          text: 'Bring up a line under a neighbor\'s name instead.',
          tag: '[OpSec DC 14]',
          check: {
            skill: 'opsec',
            dc: 14,
            success: 'burner_ok',
            fail: 'burner_no',
          },
        },
      ],
    },
    grovel_ok: {
      speaker: 'NorthLink Abuse Desk',
      text: '"...Alright. One-time courtesy reconnect. You\'re on a note now, though — one more complaint and it\'s permanent. Have a NorthLink day." The dial tone comes back like nothing happened.',
      effects: [
        { flag: 'cx_ops.isp_restored' },
        { flag: 'cx_ops.isp_noted' },
        { removeBuff: 'cx_ops_offline' },
        { xp: 'social', add: 45 },
        { stat: 'mood', add: 3 },
      ],
    },
    grovel_no: {
      speaker: 'NorthLink Abuse Desk',
      text: '"Sir. Ma\'am. The termination stands. You may reapply as a NEW customer at the standard connection rate." Click. You are talking to a dead line about a dead line.',
      effects: [{ stat: 'stress', add: 4 }],
      next: 'stuck',
    },
    burner_ok: {
      speaker: 'narrator',
      text: [
        "You knock on 4C's door with a story about a 'work thing' and a crisp explanation of exactly nothing. Twenty minutes later there is a shiny new NorthLink account in the name of a retiree who thinks the internet is a fad, and it is, technically, yours.",
        "You're back online under a name that isn't yours — which is either very smart or a future problem wearing a smart hat.",
      ],
      effects: [
        { flag: 'cx_ops.isp_restored' },
        { flag: 'cx_ops.isp_burner' },
        { removeBuff: 'cx_ops_offline' },
        { xp: 'opsec', add: 50 },
        { stat: 'cred', add: 2 },
      ],
    },
    burner_no: {
      speaker: 'narrator',
      text: "The neighbor gets suspicious halfway through, or the paperwork bounces, or you just lose your nerve at the credit-check question. Either way you're still dark, and now 4C gives you a funny look at the mailboxes.",
      effects: [{ stat: 'stress', add: 5 }],
      next: 'stuck',
    },
    stuck: {
      speaker: 'narrator',
      text: "There's no clever way left. You're offline until you cough up the fee like everyone else.",
      choices: [
        {
          text: '[Pay the reconnection fee.]',
          tag: '[$120]',
          req: { stat: 'money', gte: 120 },
          reqText: 'Requires $120',
          effects: [
            { money: -120 },
            { flag: 'cx_ops.isp_restored' },
            { removeBuff: 'cx_ops_offline' },
            { notify: 'Back online. Expensive lesson.', kind: 'money' },
          ],
        },
        {
          text: 'Stay dark for now and scrape by on borrowed connections.',
          effects: [
            { flag: 'cx_ops.isp_dark' },
            { stat: 'mood', add: -4 },
          ],
        },
      ],
    },
  },
}

const ispSecondChance: SceneDef = {
  id: 'cx_ops_isp_second_chance',
  channel: 'mail',
  title: 'We Miss You! Come Back to NorthLink',
  from: 'NorthLink Customer Retention',
  start: 'offer',
  nodes: {
    offer: {
      speaker: 'NorthLink Customer Retention',
      text: [
        '"Dear Valued Former Customer," it begins, as if the Abuse Desk and the Retention Team have never met, which they probably haven\'t. "We noticed you haven\'t been online with us lately! Rejoin today for a special returning-customer rate."',
        'The fine print mentions a "reinstatement review." The big print has a cartoon modem giving a thumbs-up. You have been dialing in from the library, from a café, from the good graces of friends, and your back hurts.',
      ],
      choices: [
        {
          text: 'Swallow your pride and rejoin.',
          tag: '[$90]',
          req: { stat: 'money', gte: 90 },
          reqText: 'Requires $90',
          effects: [
            { money: -90 },
            { flag: 'cx_ops.isp_restored' },
            { removeBuff: 'cx_ops_offline' },
            { notify: 'Back on NorthLink. The cartoon modem is very happy for you.', kind: 'money' },
          ],
        },
        {
          text: 'Not yet. Keep living on borrowed wires.',
          effects: [
            { stat: 'mood', add: -2 },
            { scene: 'cx_ops_isp_second_chance', delayHours: 504 },
          ],
        },
      ],
    },
  },
}

const ispQuest: QuestDef = {
  id: 'cx_ops_isp_cutoff_q',
  title: 'Complication: Cut Off',
  kind: 'personal',
  priority: 4,
  rewards: 'Get back online',
  summary: 'NorthLink terminated your account after complaints traced to your line. Until you sort it out, your connection is throttled to nothing.',
  start: 'cut',
  stages: {
    cut: {
      text: 'You are offline. Pay NorthLink\'s reconnection fee, charm the Abuse Desk, or bring up a line some other way.',
      objectives: [
        {
          id: 'reconnect',
          text: 'Get your connection back',
          when: { flag: 'cx_ops.isp_restored' },
          hint: 'Answer the termination notice in Mail — pay the fee, pass a Social check with the Abuse Desk, or an OpSec check to bring up a line another way.',
        },
      ],
      next: [
        { if: { flag: 'cx_ops.isp_dark' }, stage: 'dark' },
        { stage: 'back' },
      ],
    },
    back: {
      text: 'You are back online. Whatever it cost, the modem sings again.',
      onEnter: [{ log: 'Connection restored.', kind: 'good' }],
      objectives: [{ id: 'ok', text: 'Back online', when: { always: true }, hidden: true, hint: 'Done.' }],
    },
    dark: {
      text: "You chose to stay dark rather than pay. It's slow going on borrowed lines.",
      onEnter: [
        { scene: 'cx_ops_isp_second_chance', delayHours: 336 },
        debuff('cx_ops_offline', 'Off the Grid', 60, [{ key: 'hack.speed', mult: 0.7 }, { key: 'freelance.speed', mult: 0.7 }], 'No home connection; you work on scraps of borrowed bandwidth until you reconnect.'),
      ],
      objectives: [
        {
          id: 'give_in',
          text: 'Get a real connection back eventually',
          when: { flag: 'cx_ops.isp_restored' },
          hint: 'NorthLink\'s retention team will mail you a comeback offer in a few weeks. Accept it when you can afford it.',
        },
      ],
    },
  },
}

const ispCutoff: EventDef = {
  id: 'cx_ops_isp_cutoff',
  category: 'underground',
  complication: { sources: ['hack'], minTier: 1, maxTier: 2 },
  when: { not: { flag: 'cx_ops.isp_dark' } },
  effects: [
    { quest: 'cx_ops_isp_cutoff_q', start: true },
    debuff('cx_ops_offline', 'Line Suspended', 60, [{ key: 'hack.speed', mult: 0.6 }, { key: 'freelance.speed', mult: 0.6 }], 'NorthLink suspended your line; everything crawls until you reconnect.'),
  ],
  scene: 'cx_ops_isp_cutoff_scene',
}

// ─────────────────────────────────────────────────────────────────────────────
// cx_ops_mystery_package — a warning with your own logs in it
// ─────────────────────────────────────────────────────────────────────────────
const packageScene: SceneDef = {
  id: 'cx_ops_mystery_package_scene',
  channel: 'dialog',
  title: 'A Padded Envelope',
  from: 'An Anonymous Sender',
  start: 'mail',
  nodes: {
    mail: {
      speaker: 'narrator',
      text: [
        'No return address. Inside the padded envelope: a printout. Your handle, timestamps, a session you\'d recognize anywhere — because you were there — and one host you very much did not think anyone else could see.',
        'A yellow sticky note on top, block capitals, no signature: "YOU LEFT THIS LYING AROUND. NEXT PERSON WHO FINDS IT WON\'T MAIL IT BACK. — A FRIEND."',
        'Someone watched you work, kept the receipts, and then chose, for reasons of their own, to warn you instead of sell you.',
      ],
      choices: [
        {
          text: 'Treat it as the gift it is. Tear your operation down and rebuild it clean.',
          tag: '[OpSec DC 15]',
          check: {
            skill: 'opsec',
            dc: 15,
            success: 'rebuild',
            fail: 'spooked',
          },
        },
        {
          text: 'Who sent this? Trace the envelope, the paper, the postmark.',
          tag: '[Networking DC 16]',
          check: {
            skill: 'networking',
            dc: 16,
            success: 'traced',
            fail: 'dead_end',
          },
        },
        {
          text: 'Burn it in the sink and pretend you never saw it.',
          goto: 'deny',
        },
      ],
    },
    rebuild: {
      speaker: 'narrator',
      text: 'You spend a hard, humbling weekend pulling your own setup apart with the eyes of a stranger. You find the gap the friend found. You close it. You sleep better and worse at the same time.',
      effects: [
        { xp: 'opsec', add: 80 },
        scar('cx_ops_scar_street_smart'),
        { flag: 'cx_ops.warned' },
        { stat: 'stress', add: 3 },
      ],
    },
    spooked: {
      speaker: 'narrator',
      text: 'You try to rebuild but you\'re rattled, jumping at your own reflection in the monitor. You harden a few things badly and lie awake cataloguing every job you\'ve ever done.',
      effects: [
        { flag: 'cx_ops.warned' },
        scar('cx_ops_scar_paranoid_sleeper'),
        { stat: 'stress', add: 8 },
      ],
    },
    traced: {
      speaker: 'narrator',
      text: 'The postmark and a smudge of toner narrow it to a copy shop on Sodium Row and a very specific afternoon. You never get a name — but you get a shape, and the shape is almost fond of you. A rival, maybe. A future ally. A ghost keeping you honest.',
      effects: [
        { xp: 'networking', add: 60 },
        { flag: 'cx_ops.warned' },
        { flag: 'cx_ops.package_traced' },
        { stat: 'cred', add: 2 },
      ],
    },
    dead_end: {
      speaker: 'narrator',
      text: 'Nothing. The trail is deliberately, professionally cold — which is its own kind of message. Whoever this is, they are better at not being found than you are at finding people.',
      effects: [
        { flag: 'cx_ops.warned' },
        { stat: 'stress', add: 5 },
      ],
    },
    deny: {
      speaker: 'narrator',
      text: 'The ash goes down the drain. The knowledge does not. For weeks you will feel eyes on the back of your neck every time the modem lights blink — because someone, somewhere, is not bluffing.',
      effects: [
        { flag: 'cx_ops.warned' },
        scar('cx_ops_scar_paranoid_sleeper'),
        { stat: 'mood', add: -4 },
      ],
    },
  },
}

const mysteryPackage: EventDef = {
  id: 'cx_ops_mystery_package',
  category: 'underground',
  complication: { sources: ['hack'], minTier: 2, maxTier: 3 },
  scene: 'cx_ops_mystery_package_scene',
}

// ─────────────────────────────────────────────────────────────────────────────
// cx_ops_copycat_handle — someone is being you, badly
// ─────────────────────────────────────────────────────────────────────────────
const copycatThread: SceneDef = {
  id: 'cx_ops_copycat_thread',
  channel: 'forum',
  board: 'general',
  title: 'is {handle} running rip-and-runs now?? lame',
  from: 'A Board Regular',
  start: 'thread',
  nodes: {
    thread: {
      speaker: 'A Board Regular',
      text: [
        '>> A Board Regular wrote:',
        `"yo so someone calling themselves {handle} just stiffed my cousin on a job AND left his logs wide open so the client came after HIM. thought {handle} was supposed to be clean? guess the rep was fake lol"`,
        '>> replies are piling up. Some defend you. Most enjoy the drama. Either way, your name is on a stranger\'s mess, and the heat their sloppiness draws is drifting toward the real you.',
      ],
      effects: [{ stat: 'heat', add: 5 }],
      choices: [
        {
          text: 'Post a signed disavowal the board can verify.',
          tag: '[OpSec DC 14]',
          check: {
            skill: 'opsec',
            dc: 14,
            success: 'disavow_ok',
            fail: 'disavow_no',
          },
        },
        {
          text: 'Say nothing publicly — find the copycat yourself.',
          tag: '[Networking DC 15]',
          check: {
            skill: 'networking',
            dc: 15,
            success: 'found',
            fail: 'lost',
          },
        },
        {
          text: 'Let it ride. Rumors die. Handles are cheap.',
          effects: [
            { flag: 'cx_ops.copycat_ignored' },
            scar('cx_ops_scar_marked_handle'),
            { stat: 'cred', add: -4 },
            { stat: 'heat', add: 4 },
          ],
        },
      ],
    },
    disavow_ok: {
      speaker: 'narrator',
      text: 'You sign a message the way only the real {handle} could, and the board does the math. The imposter\'s thread dies in ridicule. Someone even apologizes to their cousin on your behalf.',
      effects: [
        { flag: 'cx_ops.copycat_disavowed' },
        { xp: 'opsec', add: 50 },
        { stat: 'cred', add: 3 },
      ],
    },
    disavow_no: {
      speaker: 'narrator',
      text: 'Your "proof" is thin and the board smells desperation. "sure sure, the guilty one always shows up loudest." Now you look like a copycat denying being a copycat, which is somehow worse.',
      effects: [
        { flag: 'cx_ops.copycat_denied_badly' },
        { stat: 'cred', add: -5 },
        { stat: 'heat', add: 3 },
      ],
    },
    found: {
      speaker: 'narrator',
      text: 'It takes three nights of quiet listening, but the copycat leaves the same clumsy signature everywhere. You have a channel, a rough location, and the sudden, ugly power of knowing exactly where to knock.',
      effects: [
        { flag: 'cx_ops.copycat_found' },
        { xp: 'networking', add: 60 },
      ],
    },
    lost: {
      speaker: 'narrator',
      text: 'You chase shadows for a week and catch nothing but a headache. Whoever it is stays one clumsy step ahead — and every day they wear your name, more of their heat becomes yours.',
      effects: [
        { flag: 'cx_ops.copycat_loose' },
        { stat: 'heat', add: 5 },
        { stat: 'stress', add: 5 },
      ],
    },
  },
}

const copycatConfront: SceneDef = {
  id: 'cx_ops_copycat_confront',
  channel: 'chat',
  title: 'found you',
  from: 'Gh0st_Of_You',
  start: 'open',
  nodes: {
    open: {
      speaker: 'Gh0st_Of_You',
      text: [
        'The message window opens and there they are, pretending to be you, and very bad at it.',
        `"...oh. oh no. you're the real one aren't you. look i just needed the rep, nobody hires a nobody, i figured {handle} was big enough to spare some—"`,
        'They are maybe sixteen. They are terrified. They are also actively getting you investigated.',
      ],
      choices: [
        {
          text: '"Drop the handle tonight or I drop YOU to everyone. We clear?"',
          tag: '[OpSec DC 13]',
          check: {
            skill: 'opsec',
            dc: 13,
            success: 'scared_off',
            fail: 'defiant',
          },
        },
        {
          text: '"You want a rep? Earn one. Real name\'s expensive — here\'s a starter one, and rules."',
          tag: '[Social DC 15]',
          check: {
            skill: 'social',
            dc: 15,
            success: 'mentored',
            fail: 'defiant',
          },
        },
        {
          text: 'Report the channel to the board mods and wash your hands of it.',
          goto: 'reported',
        },
      ],
    },
    scared_off: {
      speaker: 'narrator',
      text: 'You lay it out cold and specific, and the kid deletes everything in real time in front of you, apologizing in a dozen typo\'d messages. The handle is yours alone again. The heat they piled on you starts to cool.',
      effects: [
        { flag: 'cx_ops.copycat_cleared' },
        { stat: 'heat', add: -6 },
        scar('cx_ops_scar_street_smart'),
      ],
    },
    mentored: {
      speaker: 'narrator',
      text: 'Against your better judgment, you give the kid a clean handle of their own and three rules to live by. They cry, a little, in ASCII. Your name is clear, and somewhere out there is a stray who owes you.',
      effects: [
        { flag: 'cx_ops.copycat_cleared' },
        { stat: 'heat', add: -5 },
        { stat: 'cred', add: 3 },
        { faction: 'fac.loft', add: 2 },
        { stat: 'mood', add: 4 },
      ],
    },
    defiant: {
      speaker: 'Gh0st_Of_You',
      text: '"pfft. make me. the name\'s not copyrighted." They log off. They keep the handle. They keep being sloppy in your name, and the heat keeps rolling downhill to you.',
      effects: [
        { flag: 'cx_ops.copycat_loose' },
        scar('cx_ops_scar_marked_handle'),
        { stat: 'heat', add: 5 },
        { stat: 'stress', add: 4 },
      ],
    },
    reported: {
      speaker: 'narrator',
      text: 'The mods nuke the channel and ban the handle-thief on sight. Clean, quick, a little cold — and a couple of scene regulars note that you went to the mods instead of handling it yourself. Small marks. They add up.',
      effects: [
        { flag: 'cx_ops.copycat_cleared' },
        { stat: 'heat', add: -4 },
        { faction: 'fac.loft', add: -1 },
      ],
    },
  },
}

const copycatQuest: QuestDef = {
  id: 'cx_ops_copycat_handle_q',
  title: 'Complication: Someone Is Being You',
  kind: 'personal',
  priority: 5,
  rewards: 'Your name back',
  summary: 'A copycat is pulling sloppy jobs under your handle and the heat is drifting to the real you. Clear your name — publicly, quietly, or not at all.',
  start: 'react',
  stages: {
    react: {
      text: 'Your handle is on someone else\'s mess. Answer the board thread: disavow publicly, hunt the copycat quietly, or let the rumor ride.',
      objectives: [
        {
          id: 'decide',
          text: 'Deal with the imposter',
          when: { any: [{ flag: 'cx_ops.copycat_disavowed' }, { flag: 'cx_ops.copycat_denied_badly' }, { flag: 'cx_ops.copycat_found' }, { flag: 'cx_ops.copycat_loose' }, { flag: 'cx_ops.copycat_ignored' }] },
          hint: 'Read the forum thread about {handle}. Sign a disavowal (OpSec), track the copycat (Networking), or let it ride.',
        },
      ],
      next: [
        { if: { flag: 'cx_ops.copycat_found' }, stage: 'confront' },
        { stage: 'settled' },
      ],
    },
    confront: {
      text: 'You found the copycat. Time to have a word.',
      onEnter: [{ scene: 'cx_ops_copycat_confront' }],
      objectives: [
        {
          id: 'talk',
          text: 'Confront the copycat',
          when: { any: [{ flag: 'cx_ops.copycat_cleared' }, { flag: 'cx_ops.copycat_loose' }] },
          hint: 'Open the chat with the copycat and scare them off (OpSec), set them straight (Social), or report the channel.',
        },
      ],
    },
    settled: {
      text: 'The dust settles on your name — cleaner or dirtier, depending on how you played it.',
      onEnter: [{ log: 'The copycat business is over, for better or worse.', kind: 'story' }],
      objectives: [{ id: 'ok', text: 'Resolved', when: { always: true }, hidden: true, hint: 'Done.' }],
    },
  },
}

const copycatEvent: EventDef = {
  id: 'cx_ops_copycat_handle',
  category: 'underground',
  complication: { sources: ['hack'], minTier: 1, maxTier: 3 },
  effects: [{ quest: 'cx_ops_copycat_handle_q', start: true }],
  scene: 'cx_ops_copycat_thread',
}

// ─────────────────────────────────────────────────────────────────────────────
// cx_ops_burned_alias — the board decides your handle is a liability
// ─────────────────────────────────────────────────────────────────────────────
const burnedThread: SceneDef = {
  id: 'cx_ops_burned_alias_thread',
  channel: 'forum',
  board: 'security',
  title: 'PSA: do not work with {handle} (logs inside)',
  from: 'ColdWater',
  start: 'post',
  nodes: {
    post: {
      speaker: 'ColdWater',
      text: [
        '>> ColdWater wrote:',
        `"putting this here so nobody else gets burned. worked a job that {handle} touched. sloppy. left tracks, left a client hot, then went quiet when it went bad. attaching what i've got. judge for yourselves. the rep is not the reality."`,
        'The thread has teeth. It\'s half true, which is the worst kind. Your cred is bleeding out in public in real time, and a couple of people you actually like have gone quiet in the replies.',
      ],
      effects: [{ stat: 'cred', add: -6 }],
      choices: [
        {
          text: 'Answer it head-on: post your side, own what\'s real, refute what isn\'t.',
          tag: '[Social DC 16]',
          check: {
            skill: 'social',
            dc: 16,
            bonuses: [{ if: hasScar('cx_ops_scar_street_smart'), add: 2, label: '+2 (you read traces now)' }],
            success: 'defended',
            fail: 'flamed',
          },
        },
        {
          text: 'Prove the "logs" are cherry-picked and expose coldwater\'s grudge.',
          tag: '[Intrusion DC 17]',
          check: {
            skill: 'intrusion',
            dc: 17,
            success: 'exposed',
            fail: 'flamed',
          },
        },
        {
          text: 'The handle is burned. Retire it and start clean.',
          goto: 'retire',
        },
      ],
    },
    defended: {
      speaker: 'narrator',
      text: 'You post calm, specific, and unflinching — cop to the one real mistake, dismantle the rest. The board respects a straight answer more than a perfect record. coldwater goes quiet. Your rep scars over but holds.',
      effects: [
        { flag: 'cx_ops.alias_defended' },
        { xp: 'social', add: 60 },
        { stat: 'cred', add: 4 },
        scar('cx_ops_scar_thick_skin'),
      ],
    },
    exposed: {
      speaker: 'narrator',
      text: 'You show, gently and completely, that coldwater\'s "logs" were trimmed to lie — and that this is the third handle they\'ve tried to torch this year. The thread flips. coldwater becomes the story. You come out sharper than you went in.',
      effects: [
        { flag: 'cx_ops.alias_defended' },
        { xp: 'intrusion', add: 60 },
        { stat: 'cred', add: 5 },
      ],
    },
    flamed: {
      speaker: 'narrator',
      text: 'Your defense lands wrong — too hot, too thin — and the pile-on gets worse. By morning "{handle}" is shorthand on the board for "sloppy," and it will take real work and real time to be anything else.',
      effects: [
        { flag: 'cx_ops.alias_burned' },
        { stat: 'cred', add: -5 },
        scar('cx_ops_scar_burned_bridge'),
        debuff('cx_ops_burned', 'Burned Handle', 28, [{ key: 'cred.gain', mult: 0.8 }], 'The board thinks your handle is sloppy; rep comes slower until you live it down.'),
      ],
    },
    retire: {
      speaker: 'narrator',
      text: 'You let the old handle die where it stands. There\'s a grief to it — years of small legends attached to a name you\'re now walking away from — but a clean start is a clean start. You are nobody again, which is a kind of freedom.',
      effects: [
        { flag: 'cx_ops.alias_retired' },
        { stat: 'cred', add: -8 },
        { stat: 'mood', add: -3 },
        buff('cx_ops_fresh_start', 'Fresh Start', 21, [{ key: 'heat.decay', add: 0.3 }], 'A brand-new handle: no history, and for now, no heat following it.'),
      ],
    },
  },
}

const burnedQuest: QuestDef = {
  id: 'cx_ops_burned_alias_q',
  title: 'Complication: Burned Handle',
  kind: 'personal',
  priority: 5,
  rewards: 'Your reputation',
  summary: 'Someone torched your handle on the security board with half-true logs. Defend it, expose the grudge behind it, or retire the name and start clean.',
  start: 'burn',
  stages: {
    burn: {
      text: 'Your handle is being publicly torched. Answer the thread on the security board.',
      objectives: [
        {
          id: 'answer',
          text: 'Deal with the burn thread',
          when: { any: [{ flag: 'cx_ops.alias_defended' }, { flag: 'cx_ops.alias_burned' }, { flag: 'cx_ops.alias_retired' }] },
          hint: 'Open the security-board thread and defend yourself (Social), expose the poster (Intrusion), or retire the handle.',
        },
      ],
    },
  },
}

const burnedEvent: EventDef = {
  id: 'cx_ops_burned_alias',
  category: 'underground',
  complication: { sources: ['hack'], minTier: 2, maxTier: 3 },
  when: { stat: 'cred', gte: 6 },
  effects: [{ quest: 'cx_ops_burned_alias_q', start: true }],
  scene: 'cx_ops_burned_alias_thread',
}

const events: EventDef[] = [traceBeacon, nastygram, ispCutoff, mysteryPackage, copycatEvent, burnedEvent]
const scenes: SceneDef[] = [
  traceBeaconScene,
  nastygramScene,
  ispScene,
  ispSecondChance,
  packageScene,
  copycatThread,
  copycatConfront,
  burnedThread,
]
const quests: QuestDef[] = [ispQuest, copycatQuest, burnedQuest]

export default defineContent({ events, scenes, quests })
