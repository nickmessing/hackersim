/**
 * PKG-04 — `main_a4_q2b_bonfire` (bible §6.D CP-D1 F, §10 E8): the authored path to Scorched Earth.
 *
 * Three sabotages, each a scene with a fail-forward check; every one drives one or two factions
 * toward Hostile. When all three are set, `a4.bonfire_done` unblocks the leverage quest's wait stage.
 * `trig_factions_hostile` recomputes `factions_at_hostile` (a count of factions at ≤ −20), which E8's
 * second condition reads for the double-agent variant.
 *
 * `a4.bonfire_bureau_done` (set by fire one, which hands the Bureau's own informants to the Loft) is
 * read by the §4.6 table to push Marlow to `exposed`: burning the rot up the chain is still exposing
 * it. Fire two publishes `aperture_exposed` and the finished bonfire publishes `economy_recession`
 * (their world deltas belong to the NewsDefs, PKG-16).
 *
 * Fail branches (REDESIGN_V2 §D): every fire still lights (the three `_done` flags are set on both
 * outcomes, so the lane can never stall), but a botched roll opens its own sub-story:
 *  - fire one → `a4_bonfire_outed`: a grown-up CaptainCarrierWave (the kid who doxxed himself in
 *    2001) traces the scrubber signature and gives you 48 hours. Own it, deflect it ([Social DC 18],
 *    which escalates on a fail), or stay silent — the `pkg04_act4_marked_traitor` scar, a4.bonfire_outed.
 *  - fire two → `a4_bonfire_suit`: Aperture's insurer sues Doe 1 as subrogee. Settle, fight (a
 *    retainer obligation), counter with discovery ([Business DC 18]) or ignore it (a year-long
 *    garnishment obligation, a legal complication).
 *  - fire three → `a4_bonfire_survivors`: the CFO who got away blacklists you (a 120-day pay debuff,
 *    maybe a work complication) unless you light a fourth fire.
 * `a4.bonfire_sloppy`, `a4.bonfire_outed` and the suit flags are read by the finale's grand check
 * (q3b_exchange) and by the epilogue's "What Followed You" slides (marks.ts).
 */
import { defineContent } from '@/engine/registry'
import type { Effect, FactionId, QuestDef } from '@/engine/types'
import { flag } from './shared'

// ── Fail-branch consequences (see header) ─────────────────────────────────────

/** The scene names you: the scar, the cred, and the people who come asking. */
const namedTraitor: Effect[] = [
  { trait: 'pkg04_act4_marked_traitor' },
  { flag: 'a4.bonfire_outed' },
  { stat: 'cred', add: -10 },
]

/** A court judgment against Doe 1: garnished for a year. */
const judgment: Effect[] = [
  { obligation: { id: 'pkg04_act4_judgment', label: 'Court judgment: Coastline Mutual v. Doe 1 (garnishment)', perDay: 70, days: 365 } },
  { flag: 'a4.suit_lost' },
]

/** Douglas Wren's note next to your name: heavier doors for four months. */
const blacklisted: Effect = {
  buff: {
    id: 'pkg04_act4_blacklisted',
    name: 'Blacklisted in Harbor Point',
    desc: 'A man with a very large Rolodex wrote a small note next to your name. Offers come in lower; callbacks come in slower; nobody will say why.',
    days: 120,
    bad: true,
    mods: [
      { key: 'pay', mult: 0.88 },
      { key: 'freelance.pay', mult: 0.85 },
    ],
  },
}

const FACTIONS: FactionId[] = ['fac.loft', 'fac.aperture', 'fac.bureau', 'fac.halcyon', 'fac.hood']

const quest: QuestDef = {
  id: 'main_a4_q2b_bonfire',
  title: 'The Bonfire',
  kind: 'main',
  act: 4,
  priority: 90,
  rewards: 'Scorched earth',
  summary: [
    'You are going to burn all of it down: the scene, the machine, the badge, the boardroom, the whole rotten market. Three fires, set carefully, each one true enough that nobody can call it a lie.',
    'When they are lit, there will be nothing left standing to hold against you — because there will be nothing left standing at all.',
  ],
  start: 'fires',
  stages: {
    fires: {
      text: 'Three matches. The Loft to the Bureau, Aperture to the press, the ladder to the ground. Set them in any order. Each one costs you a bridge on purpose.',
      onEnter: [
        { scene: 'a4_bonfire_loft', delayHours: 6 },
        { scene: 'a4_bonfire_aperture', delayHours: 30 },
        { scene: 'a4_bonfire_ladder', delayHours: 54 },
      ],
      objectives: [
        { id: 'fire_loft', text: 'Fire one: feed the scene to the badge', when: flag('a4.bonfire_loft_done'), hint: 'The first sabotage scene opens on its own. Hand the Loft to the Bureau, then poison the Bureau with the Loft.' },
        { id: 'fire_aperture', text: 'Fire two: hand Aperture to everyone', when: flag('a4.bonfire_aperture_done'), hint: 'The second sabotage scene opens on its own. Leak the machine wide and salt it.' },
        { id: 'fire_ladder', text: 'Fire three: pull down the ladder', when: flag('a4.bonfire_ladder_done'), hint: 'The third sabotage scene opens on its own. Burn Halcyon and everyone who climbed with it.' },
      ],
      onComplete: [
        { flag: 'a4.bonfire_done' },
        { news: 'economy_recession' },
        { log: 'All three fires are set. Now you just have to be somewhere else when they catch.', kind: 'bad' },
      ],
    },
  },
}

export default defineContent({
  quests: [quest],
  triggers: [
    {
      id: 'trig_factions_hostile',
      once: false,
      cooldownDays: 1,
      priority: 25,
      when: { var: 'act', gte: 4 },
      effects: [
        { var: 'factions_at_hostile', set: 0 },
        ...FACTIONS.map(f => ({ if: { faction: f, lte: -20 }, then: [{ var: 'factions_at_hostile', add: 1 }] })),
      ],
    },
  ],
  scenes: [
    {
      id: 'a4_bonfire_loft',
      channel: 'dialog',
      title: 'Fire One: The Scene',
      start: 'open',
      nodes: {
        open: {
          speaker: 'narrator',
          text: [
            'You call your Bureau contact and give them the Loft: names, meets, the back room on Sodium Row. All true. Then you give the Loft the Bureau: which agent, which safehouse, who has been talking. Also true.',
            'Two fires from one match. By the time either side works out you lit it, they will each be too busy with the other to look at you.',
          ],
          choices: [
            {
              text: '[Opsec] Set it so cleanly that neither side ever traces the spark to you.',
              check: {
                skill: 'opsec',
                dc: 18,
                success: 'clean',
                fail: 'messy',
                successEffects: [
                  { faction: 'fac.loft', add: -60 },
                  { faction: 'fac.bureau', add: -50 },
                  { flag: 'a4.bonfire_loft_done' },
                  { flag: 'a4.bonfire_bureau_done' },
                ],
                failEffects: [
                  { faction: 'fac.loft', add: -60 },
                  { faction: 'fac.bureau', add: -50 },
                  { stat: 'heat', add: 30 },
                  { flag: 'a4.bonfire_loft_done' },
                  { flag: 'a4.bonfire_bureau_done' },
                  { flag: 'a4.bonfire_sloppy' },
                  { scene: 'a4_bonfire_outed', delayHours: 48 },
                ],
              },
            },
            {
              text: '[Social] Don\'t call anyone. Let a rumor reach the right ear on each side and watch them find each other.',
              check: {
                skill: 'social',
                dc: 17,
                bonuses: [{ if: { trait: 'silver_tongue' }, add: 1, label: '+1 (you could sell a rumor to a priest)' }],
                success: 'clean',
                fail: 'messy',
                successEffects: [
                  { faction: 'fac.loft', add: -60 },
                  { faction: 'fac.bureau', add: -50 },
                  { flag: 'a4.bonfire_loft_done' },
                  { flag: 'a4.bonfire_bureau_done' },
                ],
                failEffects: [
                  { faction: 'fac.loft', add: -60 },
                  { faction: 'fac.bureau', add: -50 },
                  { stat: 'heat', add: 25 },
                  { flag: 'a4.bonfire_loft_done' },
                  { flag: 'a4.bonfire_bureau_done' },
                  { flag: 'a4.bonfire_sloppy' },
                  { scene: 'a4_bonfire_outed', delayHours: 48 },
                ],
              },
            },
            {
              text: 'Set it fast and dirty. Let them wonder. Let them all wonder.',
              effects: [
                { faction: 'fac.loft', add: -60 },
                { faction: 'fac.bureau', add: -50 },
                { stat: 'heat', add: 15 },
                { flag: 'a4.bonfire_loft_done' },
                { flag: 'a4.bonfire_bureau_done' },
              ],
              goto: 'dirty',
            },
          ],
        },
        clean: {
          speaker: 'narrator',
          text: 'It goes up silent and total. Within a week the Loft is convinced the Bureau has an informant at the highest level, the Bureau is convinced the Loft made one of its agents, and both are right, and neither is looking at the person who told them so. The back room empties for good.',
          effects: [{ stat: 'stress', add: 6 }],
        },
        messy: {
          speaker: 'narrator',
          text: [
            'It catches, but it catches loud. A raid team a day behind you instead of a week; a Bureau safehouse emptied an hour before the Loft\'s kids arrived to photograph it, as if somebody had warned both sides at once. Somebody had.',
            'And a thread on the board, two days later, with a title in capitals, started by a handle you have not thought about in years. The fire is set. So is the smell of it, on you.',
          ],
          effects: [{ stat: 'stress', add: 10 }],
        },
        dirty: {
          speaker: 'narrator',
          text: 'You do not bother covering the tracks. Let them see a shape moving in the smoke. Let them each decide it was the other one. The back room burns down to the studs, metaphorically and, a month later, when someone gets careless with a space heater, for real.',
          effects: [{ stat: 'stress', add: 8 }],
        },
      },
    },
    {
      id: 'a4_bonfire_aperture',
      channel: 'dialog',
      title: 'Fire Two: The Machine',
      start: 'open',
      nodes: {
        open: {
          speaker: 'narrator',
          text: [
            'Everything you have on Aperture goes everywhere at once: the press, the regulators, three rival firms, a warez board in another country, and, for spite, printed and mailed to every home on the Row so nobody can say they were not warned.',
            {
              if: flag('end.has_evidence'),
              text: 'It is airtight. Special Accounts stops being a rumor and becomes a court exhibit overnight.',
              else: 'It is not airtight, but there is so much of it, in so many places, that airtight stops mattering. You bury them in smoke and let the fire find the fuel.',
            },
          ],
          choices: [
            {
              text: '[Intrusion] Push it out through channels they can never fully close.',
              check: {
                skill: 'intrusion',
                dc: 17,
                success: 'wide',
                fail: 'traced',
                successEffects: [
                  { faction: 'fac.aperture', add: -60 },
                  { news: 'aperture_exposed' },
                  { flag: 'a4.bonfire_aperture_done' },
                ],
                failEffects: [
                  { faction: 'fac.aperture', add: -60 },
                  { news: 'aperture_exposed' },
                  { stat: 'heat', add: 35 },
                  { flag: 'a4.bonfire_aperture_done' },
                  { flag: 'a4.bonfire_sloppy' },
                  { flag: 'a4.bonfire_traced' },
                  { scene: 'a4_bonfire_suit', delayHours: 96 },
                ],
              },
            },
            {
              text: '[Networking] Mirror it through every dead exchange on the Sound, so there is no single place to pull the plug.',
              check: {
                skill: 'networking',
                dc: 17,
                success: 'wide',
                fail: 'traced',
                successEffects: [
                  { faction: 'fac.aperture', add: -60 },
                  { news: 'aperture_exposed' },
                  { flag: 'a4.bonfire_aperture_done' },
                ],
                failEffects: [
                  { faction: 'fac.aperture', add: -60 },
                  { news: 'aperture_exposed' },
                  { stat: 'heat', add: 30 },
                  { flag: 'a4.bonfire_aperture_done' },
                  { flag: 'a4.bonfire_sloppy' },
                  { flag: 'a4.bonfire_traced' },
                  { scene: 'a4_bonfire_suit', delayHours: 96 },
                ],
              },
            },
            {
              text: 'Lead with Kroll\'s own voice. Let the city hear Special Accounts ask for it, in her words.',
              req: { item: 'kroll_recording' },
              reqText: 'Requires the recording of Kroll\'s ask',
              effects: [
                { faction: 'fac.aperture', add: -70 },
                { news: 'aperture_exposed' },
                { flag: 'a4.bonfire_aperture_done' },
              ],
              goto: 'her_voice',
            },
            {
              text: 'Just dump it. Volume is its own kind of security.',
              effects: [
                { faction: 'fac.aperture', add: -60 },
                { news: 'aperture_exposed' },
                { stat: 'heat', add: 20 },
                { flag: 'a4.bonfire_aperture_done' },
              ],
              goto: 'dump',
            },
          ],
        },
        wide: {
          speaker: 'narrator',
          text: 'It goes everywhere and it stays everywhere. By morning "PARALLAX" is a word ordinary people say with a curl in their lip. Aperture spends a fortune trying to recall a fire, which is not a thing anyone has ever managed.',
          effects: [{ var: 'w.enclosure', add: -1 }],
        },
        traced: {
          speaker: 'narrator',
          text: [
            'The story lands, huge and unkillable. So does the trace: somebody at Aperture, or at the Bureau, now knows exactly who lit this. You are out of the shadows for good. But the machine is burning, and it will not stop for you.',
            'Somewhere in a Harbor Point tower, an actuary opens a new file and types your handle into the field marked RESPONSIBLE PARTY. Machines burn. Their insurance policies do not.',
          ],
          effects: [{ stat: 'stress', add: 10 }],
        },
        her_voice: {
          speaker: 'narrator',
          text: [
            'The evening news plays it twice, and then everyone plays it forever: a warm, reasonable voice at a Harbor Point dinner table, explaining exactly what she wants stolen and why it is good business. "I\'m not the bad guy. I\'m the market."',
            'No one ever again has to take your word for anything. That was the whole point of keeping it all these years. It turns out the loudest thing you can do to a whisper is play it back.',
          ],
          effects: [{ var: 'w.enclosure', add: -1 }, { stat: 'stress', add: 4 }],
        },
        dump: {
          speaker: 'narrator',
          text: 'No finesse. A hundred thousand pages into the wind. Half of it is unreadable and all of it is damning by association, and Aperture drowns trying to sort the true from the merely plausible. The market cannot survive being a punchline.',
          effects: [{ var: 'w.enclosure', add: -1 }],
        },
      },
    },
    {
      id: 'a4_bonfire_ladder',
      channel: 'dialog',
      title: 'Fire Three: The Ladder',
      start: 'open',
      nodes: {
        open: {
          speaker: 'narrator',
          text: [
            'The last fire is the one that costs you. Halcyon, the legit ladder, the straight world that was supposed to be your way out — you pull the pin on all of it. The books, the offshore money, the names of everyone who knew and climbed anyway.',
            'Good people lose jobs alongside the guilty. You knew that going in. That is what a bonfire is.',
          ],
          choices: [
            {
              text: '[Business] Time it to take the whole board down, not just the founder.',
              check: {
                skill: 'business',
                dc: 18,
                success: 'total',
                fail: 'partial',
                successEffects: [
                  { faction: 'fac.halcyon', add: -60 },
                  { faction: 'fac.hood', add: -25 },
                  { flag: 'a4.bonfire_ladder_done' },
                ],
                failEffects: [
                  { faction: 'fac.halcyon', add: -60 },
                  { faction: 'fac.hood', add: -25 },
                  { stat: 'heat', add: 25 },
                  { flag: 'a4.bonfire_ladder_done' },
                  { scene: 'a4_bonfire_survivors', delayHours: 72 },
                ],
              },
            },
            {
              text: '[Social] Give it to three reporters who hate each other, and let the race do the burning.',
              check: {
                skill: 'social',
                dc: 16,
                success: 'total',
                fail: 'partial',
                successEffects: [
                  { faction: 'fac.halcyon', add: -60 },
                  { faction: 'fac.hood', add: -25 },
                  { flag: 'a4.bonfire_ladder_done' },
                ],
                failEffects: [
                  { faction: 'fac.halcyon', add: -55 },
                  { faction: 'fac.hood', add: -25 },
                  { stat: 'heat', add: 20 },
                  { flag: 'a4.bonfire_ladder_done' },
                  { scene: 'a4_bonfire_survivors', delayHours: 72 },
                ],
              },
            },
            {
              text: 'Burn the founder and let the rest scatter. Somebody has to be left to tell the story.',
              effects: [
                { faction: 'fac.halcyon', add: -50 },
                { faction: 'fac.hood', add: -20 },
                { flag: 'a4.bonfire_ladder_done' },
              ],
              goto: 'founder',
            },
          ],
        },
        total: {
          speaker: 'narrator',
          text: 'It all comes down: the campus, the options, the founder, the board, the men who told themselves they were the good kind of rich. The recession that follows has a face on the Row, and you put it there, and you knew you would, and you did it anyway.',
          effects: [{ stat: 'stress', add: 12 }],
        },
        partial: {
          speaker: 'narrator',
          text: [
            'You aimed for the whole board and got the founder and most of the wall behind him. Close enough. The rest scatter into other companies and other names, carrying the fire with them without meaning to. That is how a bonfire spreads: on the backs of the people fleeing it.',
            'One of them, you notice too late, left eleven days before the reporters arrived, with his options vested and his Rolodex under his arm. He is the kind of man who writes letters.',
          ],
          effects: [{ stat: 'stress', add: 12 }],
        },
        founder: {
          speaker: 'narrator',
          text: 'You take the founder and leave the survivors to explain him. It is almost mercy, or it is just tidiness; at this point you cannot tell the difference anymore, and you have stopped trying. Three fires. Time to be somewhere else.',
          effects: [{ stat: 'stress', add: 10 }],
        },
      },
    },

    // ── Fire one, botched: the scene works out who lit it ────────────────────
    {
      id: 'a4_bonfire_outed',
      channel: 'forum',
      board: 'general',
      title: 'who lit the first fire (READ BEFORE YOU REPLY)',
      from: 'CaptainCarrierWave',
      pause: true,
      expiresDays: 14,
      onExpire: [...namedTraitor, { chance: 0.5, then: [{ complication: 'social' }] }],
      start: 'post',
      nodes: {
        post: {
          speaker: 'CaptainCarrierWave',
          text: [
            'ok. i have been sitting on this for a week and i am done sitting on it.',
            'the Bureau safehouse list and the list of our meets went out 36 hours apart. different drops, different routes, different "sources." same person. i can prove it three ways and i am only going to say one of them out loud: both files went through the same scrubber, and that scrubber leaves a signature if you know where to look. i know where to look. somebody on this board taught me.',
            {
              if: { seen: 'loft_newbie_doxxed_himself' },
              text: 'some of you remember me. i was the kid who posted his home address in his intro. somebody here got it taken down and walked me through the rules: a handle, a hobby, nothing a stranger could drive to. i have kept every one of those rules for nine years. that is why it took me so long to believe the rest of this.',
            },
            'i am not posting the name yet. i am giving them 48 hours to post it themselves. after that i post the proof and the name, and the rest of you can decide what we do about it.',
            '-- CaptainCarrierWave :: (location: earth. still.)',
          ],
          choices: [
            {
              tag: '[Own it]',
              text: 'Reply under your own handle: "It was me. Both lists. Here is why, and here is what the rest of the city gets for it."',
              effects: [...namedTraitor, { flag: 'a4.bonfire_confessed' }, { stat: 'stress', add: -4 }],
              goto: 'owned',
            },
            {
              tag: '[Social DC 18]',
              text: 'Get ahead of him. Point the thread, gently and plausibly, at a ghost: a burned account that cannot answer back.',
              check: {
                skill: 'social',
                dc: 18,
                bonuses: [
                  { if: { trait: 'silver_tongue' }, add: 1, label: '+1 (you could sell a rumor to a priest)' },
                  { if: { stat: 'cred', gte: 60 }, add: 2, label: '+2 (the board still believes your handle)' },
                ],
                success: 'deflected',
                fail: 'exposed',
                successEffects: [{ flag: 'a4.bonfire_deflected' }, { stat: 'stress', add: 6 }, { stat: 'mood', add: -4 }],
                failEffects: [...namedTraitor, { stat: 'cred', add: -5 }, { stat: 'heat', add: 10 }, { complication: 'social' }],
              },
            },
            {
              tag: '[Silence]',
              text: 'Say nothing. Let the forty-eight hours run out. Let him do what he is going to do.',
              effects: [...namedTraitor, { chance: 0.5, then: [{ complication: 'social' }] }],
              goto: 'named',
            },
          ],
        },
        owned: {
          speaker: 'CaptainCarrierWave',
          text: [
            'ok.',
            'thank you for saying it yourself. i mean that. it doesn\'t fix anything. it isn\'t supposed to.',
            'locking the thread. nobody post anybody\'s address. that\'s the only rule left.',
          ],
          next: 'owned_after',
        },
        owned_after: {
          speaker: 'narrator',
          text: 'By morning your handle is on the blacklists of every board from here to Ridgeport. But three old handles, people you have not heard from since the modem years, send you the same two words in private: "at least." You keep all three messages. You are not sure why. You are sure why.',
        },
        deflected: {
          speaker: 'narrator',
          text: [
            'It works. It works horribly well. By the next evening the thread has a new villain: a handle that stopped logging in two years ago and cannot defend itself. The replies turn, the way replies do, all at once and with total confidence.',
            'CaptainCarrierWave posts one more time. "guess i was wrong. sorry everyone." Then his handle goes grey and stays grey. You taught him to look. Now you have taught him to look away.',
          ],
        },
        exposed: {
          speaker: 'CaptainCarrierWave',
          text: [
            'nice try.',
            'you ran your reply through the same scrubber. you scrubbed the lie. same signature, three posts up. i put the two side by side in the attachment so nobody has to take my word for anything.',
            'that\'s the name. {handle}. i\'m done.',
          ],
          next: 'exposed_after',
        },
        exposed_after: {
          speaker: 'narrator',
          text: 'Two hundred replies by midnight. Somebody posts your old ASCII signature with a skull drawn over it. Somebody else posts the street you grew up on, and a moderator takes it down in four minutes, and you notice the four minutes, and it does not help at all.',
        },
        named: {
          speaker: 'CaptainCarrierWave',
          text: [
            '48 hours. nothing.',
            'ok. the name is {handle}. proof attached. i wanted to be wrong about this for a week and i was not wrong.',
            'you taught me not to post an address. you forgot to teach me what to do when it\'s one of us. i guess this is what you do.',
          ],
        },
      },
    },

    // ── Fire two, traced: the machine's insurer sends the bill ───────────────
    {
      id: 'a4_bonfire_suit',
      channel: 'mail',
      title: 'Coastline Mutual Assurance v. Doe 1: Notice of Civil Action',
      from: 'Harrow, Vance & Quill LLP',
      pause: true,
      expiresDays: 14,
      onExpire: [...judgment, { chance: 0.5, then: [{ complication: 'legal' }] }],
      start: 'letter',
      nodes: {
        letter: {
          speaker: 'Harrow, Vance & Quill LLP',
          effects: [{ flag: 'a4.bonfire_sued' }],
          text: [
            'RE: Coastline Mutual Assurance Co., as subrogee of Aperture Data Solutions, Inc. v. John/Jane Doe 1, a/k/a "{handle}"',
            'Please be advised that this firm represents Coastline Mutual Assurance, underwriter of certain professional-liability and data-security policies issued to Aperture Data Solutions. Having indemnified its insured for losses arising from the unauthorized disclosure of proprietary materials, our client is subrogated to its insured\'s rights and now asserts them against you.',
            'Enclosed: a complaint for misappropriation of trade secrets, tortious interference and defamation per se (forty-one pages); a demand that you preserve all computing equipment in your possession; and a courtesy settlement offer, valid for fourteen days.',
            { if: { flag: 'a3.oracle_revealed' }, text: 'You read the letterhead three times. Look at who insures the risk, the Oracle said. Here they are, in a very nice typeface. They would like to be reimbursed.' },
            'Very truly yours, R. Harrow, Partner',
          ],
          choices: [
            {
              tag: '[Settle · $25,000]',
              text: 'Pay it. Sign the release. Make the insurers go away the way insurers always go away: with a check.',
              req: { stat: 'money', gte: 25000 },
              reqText: 'Requires $25,000',
              effects: [{ money: -25000 }, { flag: 'a4.suit_settled' }],
              goto: 'settled',
            },
            {
              tag: '[Fight · $4,000 + retainer]',
              text: 'Hire a lawyer and fight it, invoice by invoice, for as long as it takes.',
              req: { stat: 'money', gte: 4000 },
              reqText: 'Requires $4,000 for the retainer',
              effects: [
                { money: -4000 },
                { obligation: { id: 'pkg04_act4_suit_counsel', label: 'Defense counsel (Coastline Mutual v. Doe 1)', perDay: 45, days: 150 } },
                { flag: 'a4.suit_fought' },
                { stat: 'stress', add: 4 },
              ],
              goto: 'fought',
            },
            {
              tag: '[Business DC 18]',
              text: 'Answer with a discovery request of your own: every page of their underwriting on PARALLAX, to be read aloud in open court.',
              check: {
                skill: 'business',
                dc: 18,
                bonuses: [{ if: { flag: 'end.has_evidence' }, add: 2, label: '+2 (you can prove what they were insuring)' }],
                success: 'dropped',
                fail: 'judgment',
                successEffects: [{ flag: 'a4.suit_dropped' }, { stat: 'cred', add: 3 }],
                failEffects: [...judgment, { complication: 'legal' }],
              },
            },
            {
              tag: '[Ignore]',
              text: 'You cannot sue a fire. Put it in the drawer with the other letters.',
              effects: [...judgment, { chance: 0.5, then: [{ complication: 'legal' }] }],
              goto: 'default',
            },
          ],
        },
        settled: {
          speaker: 'Harrow, Vance & Quill LLP',
          text: [
            'Thank you for your prompt attention to this matter. Our client considers it closed.',
            '(Enclosed, for your signature: a release in which you promise never again to "publish, disclose or characterize" Coastline Mutual\'s insured. It is the funniest sentence you have ever signed. You sign it anyway. Twenty-five thousand dollars, to promise not to describe a building that is on fire.)',
          ],
        },
        fought: {
          speaker: 'narrator',
          text: [
            {
              if: { flag: 'a3.tape_contained' },
              text: 'Abigail Stroud picks up on the first ring. "Again," she says. "Of course again." She reads the complaint twice and laughs once, a short bark, like a woman who bills in six-minute increments and has decided this one is on the house. It is not on the house.',
              else: 'Your lawyer is a tired woman named Beatriz Ocampo who spent twenty years defending dockworkers and says insurance companies are just longshoremen with better shoes. She reads the complaint twice and laughs once.',
            },
            '"They are not suing you to win," she says. "They are suing you so that for the next year, every time you think about what you did, you also think about an invoice." The invoices arrive weekly. She is right about everything.',
          ],
        },
        dropped: {
          speaker: 'narrator',
          text: 'Nine days later, a single page: Coastline Mutual Assurance voluntarily dismisses its action without prejudice. No explanation. You know the explanation. Somewhere in a Harbor Point tower, a general counsel read your discovery request, pictured PARALLAX\'s underwriting files read aloud to a jury of people with insurance, and quietly reclassified you as a cost of doing business.',
        },
        judgment: {
          speaker: 'narrator',
          text: 'Your answer is clever, and late, and filed on the wrong form, and a judge who has never heard of PARALLAX enters judgment against Doe 1 on a Tuesday morning, between a parking dispute and a divorce. The garnishment starts the following week. The machine is burning. The machine\'s insurers are, somehow, fine.',
        },
        default: {
          speaker: 'narrator',
          text: 'Thirty days later a judge enters default judgment against Doe 1, a/k/a you, and the garnishment arrives like weather: small, regular, all year. You cannot sue a fire. You can, it turns out, sue the person who lit it.',
        },
      },
    },

    // ── Fire three, partial: the ones who got away ───────────────────────────
    {
      id: 'a4_bonfire_survivors',
      channel: 'mail',
      title: 'A note, between professionals',
      from: 'Douglas Wren',
      start: 'letter',
      nodes: {
        letter: {
          speaker: 'Douglas Wren',
          effects: [blacklisted, { flag: 'a4.ladder_survivors' }, { chance: 0.4, then: [{ complication: 'work' }] }],
          text: [
            'From: Douglas Wren, Chief Talent Officer, Brightwater Staffing Group (formerly Chief Financial Officer, Halcyon Systems)',
            'I want to be clear that this is not a threat. People who make threats have not thought things through.',
            'You took the founder and most of the wall. You did not take me. I left Halcyon eleven days before your reporters did, with my options vested and my Rolodex intact, and I now place senior talent at forty-one firms between Harbor Point and Ridgeport.',
            'Your name is in the Rolodex now. I have written a small note beside it. You will never read the note. You will simply notice, over the coming months, that certain doors have become heavier than they used to be.',
            'With professional regards, D. Wren. P.S. Please do not reply. I have people who read my mail for me.',
          ],
          choices: [
            {
              text: 'Don\'t reply. Let him have his Rolodex. You have bigger fires.',
              effects: [{ stat: 'mood', add: -2 }],
              goto: 'ignored',
            },
            {
              tag: '[A fourth fire]',
              text: 'Light one more. Everyone Brightwater ever placed, and exactly what each of them knew at Halcyon.',
              effects: [
                { removeBuff: 'pkg04_act4_blacklisted' },
                { flag: 'a4.fourth_fire' },
                { faction: 'fac.halcyon', add: -10 },
                { stat: 'heat', add: 15 },
                { stat: 'stress', add: 6 },
              ],
              goto: 'fourth',
            },
            {
              tag: '[Fruit basket · $80]',
              text: 'Send him a fruit basket. Have the card read: THANK YOU FOR YOUR YEARS OF SERVICE.',
              if: { flag: 'a3.priya_folder_lost' },
              effects: [{ money: -80 }, { stat: 'mood', add: 5 }],
              goto: 'basket',
            },
          ],
        },
        ignored: {
          speaker: 'narrator',
          text: 'You do not reply. The doors get heavier, just as he said: a contract that goes to someone else at the last minute, an interview that ends ten minutes early, a recruiter who stops returning calls mid-sentence. It is not ruin. It is friction, applied by a professional, and it is very well done.',
        },
        fourth: {
          speaker: 'narrator',
          text: [
            'It takes you one night. Brightwater\'s placements, cross-referenced against Halcyon\'s org chart and the offshore ledgers you already burned, make a very tidy spreadsheet of who knew what and went where. You send it to the same three reporters. They are delighted. They are always delighted.',
            'Douglas Wren\'s Rolodex becomes a list of defendants. Your name is in it too, of course. But nobody is reading his notes anymore, and the doors swing easy again, and the smoke over Harbor Point gets a little thicker, and you have stopped counting fires.',
          ],
        },
        basket: {
          speaker: 'narrator',
          text: 'Pears, a pineapple, a card in careful capitals. Two days later a Brightwater courier returns it unopened, with a note: "Mr. Wren does not accept perishables." You eat the pineapple on the fire escape. It is the best thing you have tasted in months.',
        },
      },
    },
  ],
})
