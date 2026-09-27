/**
 * PKG-18 — job interviews for the "by invitation" positions (bible §13: "interviews as dialogs
 * with skill checks for the better jobs are welcome").
 *
 * Each interview is a dialog with a skill check; passing sets the `job.offer.*` flag its job's
 * requirement reads, so the posting appears on the Jobs board. Failing is never a dead end — you
 * can try again after a while, and the scene says so. Delivery triggers fire when you're close to
 * qualifying and haven't been offered yet; they retry on a cooldown so a failed interview isn't
 * permanent.
 *
 * These are the sole writers of every `job.offer.*` flag.
 *
 * Failing costs something: a bruised week (stress, mood), sometimes money, and a 30% chance that
 * word gets back to your current job (a `work` complication). The Meridian panel is the dangerous
 * one: fumble the walkthrough and you reveal knowledge nobody outside her team has. Tell the truth
 * (a +2 next time), bluff it past her, or get flagged — `job.meridian_flagged` (heat, a likely
 * `legal` complication, no more Meridian invitations) until she moves on, about a year later.
 */
import { dayOf } from '@/engine/calendar'
import { defineContent } from '@/engine/registry'
import type { Effect, SceneDef, TriggerDef } from '@/engine/types'

/** A failed interview stings: a bad week, and sometimes word gets back to your current job. */
const INTERVIEW_BRUISE: Effect[] = [{ stat: 'stress', add: 6 }, { stat: 'mood', add: -5 }]

/** Meridian's head of security has a note on you now. She'll remember it until she's gone. */
const MERIDIAN_FLAGGED: Effect[] = [
  { flag: 'job.meridian_flagged' },
  { stat: 'heat', add: 10 },
  { stat: 'stress', add: 8 },
  { chance: 0.5, then: [{ complication: 'legal' }] },
]

const scenes: SceneDef[] = [
  // ── NorthLink: Network Engineer (Wes Tran) ──────────────────────────────
  {
    id: 'iv_northlink_neteng',
    channel: 'dialog',
    title: 'NorthLink — Network Engineering',
    from: 'northlink_wes',
    start: 'intro',
    nodes: {
      intro: {
        speaker: 'northlink_wes',
        text: [
          'Wes Tran catches you by the coffee machine, which is where NorthLink makes all its important decisions. "I\'ve got a chair opening up on the engineering side. Real design work — the backbone, the peering, the new trunk through the old copper exchange. Pays a lot better than a pager and a headset."',
          '"I can put your name forward. But the panel\'s going to poke at you first. Show me you actually see the whole map, not just your slice of it."',
        ],
        choices: [
          {
            text: '[Networking DC 18] Whiteboard the city\'s traffic, ring by ring, like you drew it yourself.',
            check: {
              skill: 'networking',
              dc: 18,
              bonuses: [{ if: { jobLevel: 'job_northlink_sysadmin', gte: 3 }, add: 2, label: '+2 (you\'ve run these boxes for years)' }],
              success: 'offered',
              fail: 'not_yet',
              successEffects: [{ flag: 'job.offer.northlink_neteng', set: true }, { npc: 'northlink_wes', affinity: 4 }],
              failEffects: [...INTERVIEW_BRUISE, { npc: 'northlink_wes', affinity: -2 }, { chance: 0.3, then: [{ complication: 'work' }] }],
            },
          },
          {
            text: '"Not yet, Wes. Ask me again when I actually know where the fiber goes."',
            goto: 'decline',
          },
        ],
      },
      offered: {
        speaker: 'northlink_wes',
        text: [
          '"There it is." Wes grins and caps his marker. "That\'s the whole map. Half the panel can\'t do that." He claps you on the shoulder. "Chair\'s yours if you want it — go put in for Network Engineer on the boards. And, hey. When the requests get ugly, and they will, remember you and me have the same job. We just run the pipe."',
        ],
      },
      not_yet: {
        speaker: 'northlink_wes',
        text: [
          '"Close. But you drew your slice, not the whole thing — and the panel eats people who only know their slice." He isn\'t unkind about it. "Get another few months on the boxes, learn where the traffic actually goes, and I\'ll walk you back in. The chair\'s not going anywhere."',
          'He walks you to the elevator and lowers his voice. "Heads up, man. One of the panel guys is your shift lead\'s golf buddy. It\'ll get back to your floor that you interviewed. Keep your head down for a week."',
        ],
      },
      decline: {
        speaker: 'northlink_wes',
        text: ['"Smart. Better to know the map before you draw it." He salutes you with his mug. "Door\'s open when you\'re ready."'],
      },
    },
  },
  // ── Meridian: Security Analyst ──────────────────────────────────────────
  {
    id: 'iv_meridian_secanalyst',
    channel: 'dialog',
    title: 'Meridian Trust — Information Security',
    from: 'a Meridian recruiter',
    start: 'intro',
    nodes: {
      intro: {
        speaker: 'a Meridian recruiter',
        text: [
          'Fourteenth floor, thick carpet, a view of the whole Sound. The head of the new security team has a firm handshake and a haunted look. "We\'re standing up a real practice. Three people and a budget. We need somebody who thinks like the other side — who reads a log and sees a person, not a line."',
          '"Here\'s a mess we caught last quarter. Tell me what happened. And be honest, because half the people I interview tell me what they think a bank wants to hear."',
        ],
        choices: [
          {
            text: '[Intrusion DC 18] Walk the whole intrusion back to front. Show them exactly how you\'d have done it.',
            check: {
              skill: 'intrusion',
              dc: 18,
              bonuses: [
                { if: { skill: 'opsec', gte: 30 }, add: 2, label: '+2 (you know how the trail gets hidden)' },
                { if: { flag: 'job.meridian_honest' }, add: 2, label: '+2 (she knows you won\'t guess)' },
              ],
              success: 'offered',
              fail: 'too_close',
              successEffects: [{ flag: 'job.offer.meridian_secanalyst', set: true }],
              failEffects: [{ stat: 'stress', add: 6 }],
            },
          },
          {
            text: '"Give me a few months. I want to walk in here already knowing the answer."',
            goto: 'decline',
          },
        ],
      },
      offered: {
        speaker: 'a Meridian recruiter',
        text: [
          'You take them through it, quiet and exact, the way you\'d have done it yourself — because you would have. When you finish, the head of security is very still. "That," she says, "is the first honest answer I\'ve had all week. The job\'s yours. Put in for Information Security Analyst on the boards." She pauses. "You\'re going to hate what you find in here. So did I."',
        ],
      },
      too_close: {
        speaker: 'a Meridian recruiter',
        text: [
          'You get the order wrong. You skip a step the intruder must have taken, and then, trying to recover, you describe a step that isn\'t in the report at all: the quiet second box they parked inside the network, the one her team only found last week.',
          'She stops writing. "That wasn\'t in the packet," she says, very evenly. "We haven\'t told anyone about the second box. Not the board. Not the regulators." She puts the pen down. "How did you know it was there?"',
        ],
        choices: [
          {
            text: '"Because that\'s where I would have put it. You asked me to be honest."',
            tag: '[Truth]',
            effects: [{ flag: 'job.meridian_honest' }, { stat: 'heat', add: 3 }],
            goto: 'honest',
          },
          {
            text: '"Lucky guess. There was a case like it in a trade magazine last spring."',
            tag: '[Lie]',
            check: {
              skill: 'social',
              dc: 16,
              success: 'not_yet',
              fail: 'flagged',
              successEffects: [{ stat: 'stress', add: 3 }],
              failEffects: MERIDIAN_FLAGGED,
            },
          },
          {
            text: 'Thank her for her time, stand up, and leave before she picks the pen back up.',
            tag: '[Leave]',
            effects: [...MERIDIAN_FLAGGED, { stat: 'heat', add: -4 }],
            goto: 'walked_out',
          },
        ],
      },
      honest: {
        speaker: 'a Meridian recruiter',
        text: [
          'She looks at you for a long time. Then, unexpectedly, she laughs, one short tired breath. "Well. You did say you\'d be honest." She writes something down. You can\'t see what.',
          '"I can\'t hire you today. You got the order wrong, and the panel would eat me alive." She slides your résumé into a drawer, not the bin. "But I\'ll remember that you told me. Come back when you can walk it front to back without guessing. I\'ll know you\'re not guessing."',
        ],
      },
      not_yet: {
        speaker: 'a Meridian recruiter',
        text: [
          '"You\'ve got the instincts," she says, "but you missed a step, and in this building a missed step is a headline." She slides your résumé into a drawer, not the bin. "Sharpen up and come back. I keep this seat warm on purpose."',
        ],
      },
      flagged: {
        speaker: 'a Meridian recruiter',
        text: [
          '"A trade magazine." She nods slowly, the way people nod at a number they intend to check. "Which one?" You name one. She writes it down. She writes something else down, too, underneath it, and underlines it.',
          '"Thank you for coming in." The handshake is exactly as firm as before. It is also, somehow, a door closing. On your way out you notice the security guard in the lobby looking at a photocopy of your visitor badge.',
        ],
      },
      walked_out: {
        speaker: 'narrator',
        text: [
          'You thank her and leave. She doesn\'t stop you. She doesn\'t need to: your name, your address and your visitor badge photo are already in a folder on her desk, and by the time the elevator reaches the lobby there is a note stapled to the front of it.',
          'Fourteen floors of thick carpet. You feel every one of them on the way down.',
        ],
      },
      decline: {
        speaker: 'a Meridian recruiter',
        text: ['"A person who knows what they don\'t know. Refreshing." She stands. "The seat\'ll be here."'],
      },
    },
  },
  // ── Meridian: the head of security moves on (clears job.meridian_flagged) ─
  {
    id: 'iv_meridian_new_head',
    channel: 'mail',
    title: 'Meridian Trust — personnel announcement',
    from: 'Meridian Trust Communications',
    start: 'notice',
    nodes: {
      notice: {
        text: [
          'MERIDIAN TRUST — INTERNAL & PARTNER BULLETIN',
          'Meridian Trust is pleased to announce that its Head of Information Security has accepted a position with a federal oversight office in the capital. We thank her for building our security practice from three people and a budget line into five people and a slightly larger budget line.',
          'Her successor, formerly of a large insurer in Harbor Point, joins us Monday. He has asked that all pending candidate files be "started fresh," as he "does not read other people\'s handwriting."',
          'Meridian Trust — "Steady Since 1911"',
          'You read the second paragraph twice. Somewhere in a box headed for the capital, there is a folder with your name on it and a note stapled to the front. You hope it stays in the box.',
        ],
        choices: [{ text: 'Archive it. Breathe out.', effects: [{ stat: 'stress', add: -5 }] }],
      },
    },
  },
  // ── Tidewater Assurance Group: Security Consultant ──────────────────────
  {
    id: 'iv_tidewater',
    channel: 'dialog',
    title: 'Tidewater Assurance — Consulting',
    from: 'a Tidewater partner',
    start: 'intro',
    nodes: {
      intro: {
        speaker: 'a Tidewater partner',
        text: [
          'Frosted glass, harbor light, a partner in a suit that costs more than your car. "We tell banks and insurers how bad it really is, and we get paid enormously to say it without flinching. That last part is the whole job. Anyone can find the hole. Very few people can sit across from a board and tell them the truth about it."',
          '"So. Sell me the truth. Convince me you can walk into a room full of frightened rich people and make them thank you for the bad news."',
        ],
        choices: [
          {
            text: '[Business DC 18] Pitch the engagement — findings, risk, price — like you\'ve closed a hundred boards.',
            check: {
              skill: 'business',
              dc: 18,
              bonuses: [{ if: { skill: 'opsec', gte: 45 }, add: 2, label: '+2 (you can actually back every word)' }],
              success: 'offered',
              fail: 'not_yet',
              successEffects: [{ flag: 'job.offer.tidewater', set: true }],
              failEffects: [...INTERVIEW_BRUISE, { money: -180 }, { chance: 0.3, then: [{ complication: 'work' }] }],
            },
          },
          {
            text: '[Social DC 18] Skip the pitch. Read the partner back to themselves until they\'re selling you.',
            check: {
              skill: 'social',
              dc: 18,
              success: 'offered',
              fail: 'not_yet',
              successEffects: [{ flag: 'job.offer.tidewater', set: true }],
              failEffects: [...INTERVIEW_BRUISE, { money: -180 }, { chance: 0.3, then: [{ complication: 'social' }] }],
            },
          },
          {
            text: '"I\'ll come back when I can charge what you charge without laughing."',
            goto: 'decline',
          },
        ],
      },
      offered: {
        speaker: 'a Tidewater partner',
        text: [
          'By the time you finish, the partner has stopped taking notes and started nodding. "Well," they say, refilling two glasses of water like it\'s scotch. "You can do the thing. Most people can\'t do the thing." They slide a card across. "Put in for Security Consultant. Wear the good shoes."',
        ],
      },
      not_yet: {
        speaker: 'a Tidewater partner',
        text: [
          '"Good bones," the partner says, not unkindly. "But you flinched, right at the end, and a board smells a flinch like a shark smells blood." They stand. "Get another year of hard rooms under you and try again. Talent we can\'t teach; nerve we can\'t either, but you can grow it."',
          'Downstairs, the valet hands you a ticket for the parking you didn\'t know was valet-only, and the good shoes you bought for this pinch all the way to the bus stop. The partner, you suspect, will be making a courtesy call to your references. Tidewater always makes the call.',
        ],
      },
      decline: {
        speaker: 'a Tidewater partner',
        text: ['"Honest about your rate. That\'s rarer than skill." They pocket their own card. "Come find us."'],
      },
    },
  },
  // ── Aperture: Special Accounts Analyst (Kroll) ──────────────────────────
  {
    id: 'iv_aperture_analyst',
    channel: 'dialog',
    title: 'Aperture — Special Accounts',
    from: 'kroll',
    start: 'intro',
    nodes: {
      intro: {
        speaker: 'kroll',
        text: [
          'Lunch, of course. Kroll orders for both of you and gets it right, which is somehow the most unsettling thing about her. "You\'ve been doing the folder work beautifully. Quietly. I like quiet." She sets down her fork. "I want you upstairs. Special Accounts. An office with a window and a salary that ends the part of your life where you count money."',
          '"There\'s no test, dear. You passed the test years ago, every time you chose the interesting thing over the safe one. I\'m only asking whether you\'ll say the word out loud."',
        ],
        choices: [
          {
            text: '[Business DC 16] "An office and a window is a starting offer. Let\'s talk about the rest."',
            check: {
              skill: 'business',
              dc: 16,
              success: 'offered_hard',
              fail: 'offered',
              successEffects: [{ flag: 'job.offer.aperture_analyst', set: true }, { faction: 'fac.aperture', add: 5 }],
              failEffects: [{ flag: 'job.offer.aperture_analyst', set: true }, { flag: 'job.kroll_haggle_lost' }, { faction: 'fac.aperture', add: -3 }, { stat: 'stress', add: 5 }],
            },
          },
          {
            text: '"Yes. Upstairs. I\'m done pretending I\'m not already inside."',
            effects: [{ flag: 'job.offer.aperture_analyst', set: true }],
            goto: 'offered',
          },
          {
            text: 'Smile, stall, say you\'ll think about it.',
            goto: 'decline',
          },
        ],
      },
      offered_hard: {
        speaker: 'kroll',
        text: [
          'She laughs, delighted, the real one. "There it is. You made me raise the number and you made me enjoy it." She writes something on the back of a card. "Put in for Special Accounts Analyst. Welcome upstairs, where the air is thin and the view is very, very good."',
        ],
      },
      offered: {
        speaker: 'kroll',
        text: [
          '"Wonderful," Kroll says, and the warmth is genuine, which is the frightening part. "Put in for Special Accounts Analyst. Hollis will hate it, which is a bonus. You\'ll do beautifully, dear. You always do the interesting thing."',
          { if: { flag: 'job.kroll_haggle_lost' }, text: 'She lets the pause after "interesting" sit one beat too long. "And, dear? Don\'t haggle with me again. You aren\'t good at it yet, and it makes me want to win." She smiles. The number on the card is the first number, exactly. It will be the first number for a very long time.' },
        ],
      },
      decline: {
        speaker: 'kroll',
        text: ['"Of course. Think." She dabs her mouth. "You\'ll say yes. Not today. But the number only goes up, and so does the water." She lets you get the door.'],
      },
    },
  },
  // ── Driftwood Labs: Founding Engineer ───────────────────────────────────
  {
    id: 'iv_driftwood',
    channel: 'dialog',
    title: 'Driftwood Labs — Founding Engineer',
    from: 'a Driftwood founder',
    start: 'intro',
    nodes: {
      intro: {
        speaker: 'a Driftwood founder',
        text: [
          'A converted garage in Millgate that smells of solder and cold pizza. The founder talks with their whole body. "We\'re building the thing that lets any corner shop take orders on the web. Six of us. The salary is an insult and the equity is a lottery ticket, and I am not going to pretend otherwise, because pretending is how startups die."',
          '"I don\'t want a résumé. I want to watch you think. Here\'s the problem that\'s been eating us alive for a week. Go."',
        ],
        choices: [
          {
            text: '[Programming DC 16] Take the marker and untangle their week-long bug in ten minutes.',
            check: {
              skill: 'programming',
              dc: 16,
              bonuses: [{ if: { skill: 'business', gte: 25 }, add: 1, label: '+1 (you get why it matters to the customer)' }],
              success: 'offered',
              fail: 'not_yet',
              successEffects: [{ flag: 'job.offer.driftwood', set: true }],
              failEffects: [...INTERVIEW_BRUISE, { stat: 'energy', add: -10 }, { chance: 0.3, then: [{ complication: 'work' }] }],
            },
          },
          {
            text: '"I like the pitch. I don\'t like the odds yet. Ask me again."',
            goto: 'decline',
          },
        ],
      },
      offered: {
        speaker: 'a Driftwood founder',
        text: [
          'You solve it out loud, fast, and the whole garage goes quiet and then loud. "That\'s— we\'ve been— that was a WEEK," the founder says, half-laughing, half-crying. "Okay. Yes. You. Put in for Founding Engineer. Number four. Welcome to the lottery." Someone hands you a beanbag like it\'s a company car.',
        ],
      },
      not_yet: {
        speaker: 'a Driftwood founder',
        text: [
          '"You got most of the way," the founder says, deflating a little. "But \'most of the way\' at a six-person startup is the same as \'no.\' We\'ll be here — or we won\'t, that\'s startups — but if we are, come back sharper. I mean that as a compliment and a threat."',
          'You spend the whole bus ride home solving it properly, in your head, in about four minutes. That is the worst part. You will be solving it in the shower for a week.',
        ],
      },
      decline: {
        speaker: 'a Driftwood founder',
        text: ['"A realist! God, we need one of those." They shake your hand with alarming force. "Door\'s open, number-four-that-got-away."'],
      },
    },
  },
]

// Each delivery trigger fires when you're close to qualifying and haven't been offered yet;
// once:false + cooldown so a failed interview can be retried. The offer flag stops it once passed.
const triggers: TriggerDef[] = [
  {
    id: 'trig_iv_northlink_neteng',
    when: {
      all: [
        { skill: 'networking', gte: 40 },
        { not: { flag: 'job.offer.northlink_neteng' } },
        { any: [{ jobLevel: 'job_northlink_sysadmin', gte: 2 }, { jobLevel: 'job_northlink_field_tech', gte: 3 }, { jobLevel: 'job_northlink_noc_night', gte: 4 }] },
      ],
    },
    once: false,
    cooldownDays: 60,
    atHour: 11,
    effects: [{ scene: 'iv_northlink_neteng' }],
  },
  {
    id: 'trig_iv_meridian_secanalyst',
    when: {
      all: [
        { skill: 'intrusion', gte: 40 },
        { skill: 'opsec', gte: 28 },
        { not: { flag: 'w.meridian_state', eq: 'collapsed' } },
        { not: { flag: 'job.offer.meridian_secanalyst' } },
        { not: { flag: 'job.meridian_flagged' } },
      ],
    },
    once: false,
    cooldownDays: 60,
    atHour: 10,
    effects: [{ scene: 'iv_meridian_secanalyst' }],
  },
  {
    // The note in her folder outlives her tenure, but not by much: roughly a year on, she moves on.
    id: 'trig_iv_meridian_unflag',
    when: { flag: 'job.meridian_flagged' },
    once: false,
    chance: 1 / 360,
    atHour: 9,
    effects: [{ clearFlag: 'job.meridian_flagged' }, { scene: 'iv_meridian_new_head' }],
  },
  {
    id: 'trig_iv_tidewater',
    when: {
      all: [
        { skill: 'intrusion', gte: 55 },
        { skill: 'opsec', gte: 45 },
        { skill: 'business', gte: 22 },
        { not: { flag: 'job.offer.tidewater' } },
      ],
    },
    once: false,
    cooldownDays: 75,
    atHour: 10,
    effects: [{ scene: 'iv_tidewater' }],
  },
  {
    id: 'trig_iv_aperture_analyst',
    when: {
      all: [
        { faction: 'fac.aperture', gte: 50 },
        { flag: 'w.aperture_state', eq: 'thriving' },
        { not: { flag: 'job.offer.aperture_analyst' } },
      ],
    },
    once: false,
    cooldownDays: 90,
    atHour: 12,
    effects: [{ scene: 'iv_aperture_analyst' }],
  },
  {
    id: 'trig_iv_driftwood',
    when: {
      all: [
        { day: true, gte: dayOf(2004, 3, 1) },
        { skill: 'programming', gte: 40 },
        { skill: 'business', gte: 18 },
        { not: { flag: 'job.offer.driftwood' } },
      ],
    },
    once: false,
    cooldownDays: 75,
    atHour: 11,
    effects: [{ scene: 'iv_driftwood' }],
  },
]

export default defineContent({ scenes, triggers })
