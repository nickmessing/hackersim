/**
 * PKG-03 — Act III main, beat 2: `main_a3_q2_oracle_reveal` (bible §6.C, §4.5).
 *
 * The Oracle delivers the conspiracy's shape in evidence-gated tiers, and its identity resolves
 * here by dominant faction rep (candidates filtered to exclude a dead/arrested source; fall back
 * to Kroll). PKG-00's Oracle bio reads exactly three resolution flags — `npc.oracle.is_deadline`,
 * `npc.oracle.is_reyes`, `npc.oracle.is_kroll` — so the Neighborhood-dominant branch maps to the
 * Deadline handle (Kroll if Deadline has passed) rather than a Dialtone variant the bio can't show.
 *
 * "Dominant faction" is approximated with an ordered high-then-low rep chain (the engine has no
 * cross-faction max), which matches the spirit of §4.5 for every ordinary build.
 *
 * Cross-package ids referenced by exact bible id (owners in parentheses):
 *   items aperture_sample / kroll_recording (PKG-00, granted by PKG-01/02);
 *   flags a2.building_a_case (PKG-06/09), a2.double_dealer (PKG-02);
 *   var a3.own_branches is set by this package's `trig_a3_own_branches`.
 */
import { defineContent } from '@/engine/registry'
import type { Effect } from '@/engine/types'

/** Set the Oracle to Deadline's old handle, or Kroll if Deadline has passed. */
const deadlineOrKroll: Effect = {
  if: { npc: 'deadline', fateNot: 'passed' },
  then: [{ flag: 'npc.oracle.is_deadline' }],
  else: [{ flag: 'npc.oracle.is_kroll' }],
}

/** Resolve `npc.oracle.is_*` by dominant faction rep (ordered, high threshold then low). */
const resolveOracleIdentity: Effect[] = [
  {
    if: { faction: 'fac.loft', gte: 50 },
    then: [deadlineOrKroll],
    else: [
      {
        if: { faction: 'fac.bureau', gte: 50 },
        then: [{ flag: 'npc.oracle.is_reyes' }],
        else: [
          {
            if: { any: [{ faction: 'fac.aperture', gte: 50 }, { faction: 'fac.halcyon', gte: 50 }] },
            then: [{ flag: 'npc.oracle.is_kroll' }],
            else: [
              {
                if: { faction: 'fac.hood', gte: 50 },
                then: [deadlineOrKroll],
                else: [
                  {
                    if: { faction: 'fac.loft', gte: 25 },
                    then: [deadlineOrKroll],
                    else: [
                      {
                        if: { faction: 'fac.bureau', gte: 25 },
                        then: [{ flag: 'npc.oracle.is_reyes' }],
                        else: [
                          {
                            if: { faction: 'fac.hood', gte: 25 },
                            then: [deadlineOrKroll],
                            else: [{ flag: 'npc.oracle.is_kroll' }],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
]

export default defineContent({
  quests: [
    {
      id: 'main_a3_q2_oracle_reveal',
      title: 'The Whisper Has a Shape',
      kind: 'main',
      act: 3,
      priority: 30,
      summary:
        'The voice in the wires wants to meet — as close to a meeting as a ghost can manage. It has waited until you could stand to hear all of it. Bring whatever proof you have; the truth unfolds in layers, and each layer needs a key.',
      rewards: 'The truth, in as many tiers as you can unlock',
      start: 'wait',
      stages: {
        wait: {
          text: 'The Oracle has gone quiet, which is somehow worse than the messages. Something is coming, and it wants the room to be right first.',
          hint: 'Give the story a few weeks. The more of the truth you have already dug up (exposure, the sample, a recording), the deeper the Oracle can take you.',
          objectives: [
            {
              id: 'wait',
              text: 'Wait for the Oracle to open the channel',
              when: { day: true, gte: 1290 },
              hint: 'Keep living. Keep digging on the side. The channel opens on its own.',
            },
          ],
          onComplete: [{ scene: 'a3_oracle' }],
          next: 'listen',
        },
        listen: {
          text: 'The Oracle is on the line, patient for once. It will tell you exactly as much as you can already prove — no more, because a truth you cannot back is just a way to get killed politely.',
          hint: 'Hear the Oracle out. Evidence you already hold unlocks the deeper tiers on the spot.',
          objectives: [
            {
              id: 'heard',
              text: 'Hear the Oracle out and learn who it is',
              when: { flag: 'a3.oracle_revealed' },
              hint: 'Follow the conversation to the end. The Oracle names itself before it goes.',
            },
          ],
          onComplete: [{ quest: 'main_a3_q3_priya_dilemma', start: true }],
        },
      },
    },
  ],
  scenes: [
    {
      id: 'a3_oracle',
      channel: 'dialog',
      title: 'The Oracle',
      from: 'oracle',
      start: 'open',
      nodes: {
        // Tier 1 — always.
        open: {
          speaker: 'oracle',
          text: [
            'The window opens by itself. No login, no ring. Just a cursor, already blinking, already halfway through a sentence.',
            '"You made it this far without getting bought or buried. Good. Then you can hear the shape of it, and I only have to say it once."',
          ],
          effects: [{ flag: 'a3.truth_t1' }],
          next: 't1',
        },
        t1: {
          speaker: 'oracle',
          text: [
            '"Aperture buys breaches. Real ones — the messy database spills nobody reports. It launders them into a product called PARALLAX: a risk score for every warm body in this city. It sells the score to insurers, to landlords, to anyone who wants to price a person before meeting them."',
            '"NorthLink carries the traffic. The Bureau rents the god-view and calls it a partnership. And Halcyon\'s beautiful stock price keeps the whole thing looking like a success story instead of a wound."',
            { if: { all: [{ flag: 'a2.double_dealer' }, { not: { item: 'kroll_recording' } }] }, text: '"By the way — Kroll knows you skimmed her database. She hasn\'t decided what that costs you yet. She\'s a patient woman. So am I."' },
          ],
          effects: [
            {
              if: { all: [{ flag: 'a2.double_dealer' }, { not: { item: 'kroll_recording' } }] },
              then: [
                { faction: 'fac.aperture', add: -10 },
                { log: 'The double-deal caught up with you: Aperture knows you kept a copy.', kind: 'bad' },
              ],
            },
          ],
          next: 't2gate',
        },
        // Tier 2 — needs the sample plus a recording or a live case.
        t2gate: {
          speaker: 'narrator',
          text: 'The cursor pauses, the way a person pauses when they are deciding whether you can be trusted with the next thing.',
          choices: [
            {
              text: 'Show it what you have. (You can prove the sample is real.)',
              if: { all: [{ item: 'aperture_sample' }, { any: [{ item: 'kroll_recording' }, { flag: 'a2.building_a_case' }] }] },
              goto: 't2',
            },
            {
              tag: '[Locked]',
              text: 'Go deeper — but you have nothing solid to put on the table.',
              req: { all: [{ item: 'aperture_sample' }, { any: [{ item: 'kroll_recording' }, { flag: 'a2.building_a_case' }] }] },
              reqText: 'Requires the Aperture sample AND a Kroll recording or a case you\'re building',
              goto: 't1_only',
            },
            {
              text: '"That\'s enough. I don\'t want to know more than I can survive."',
              goto: 't1_only',
            },
          ],
        },
        t2: {
          speaker: 'oracle',
          text: [
            '"Then here\'s the part that will keep you up. \'Special Accounts\' — Kroll\'s little unit — isn\'t a job title. It\'s a *seat*. A function the company needs filled. Kroll is just the person warming it right now."',
            '"Take her out and the seat doesn\'t disappear. It advertises. That should frighten you more than she does."',
          ],
          effects: [{ flag: 'a3.truth_t2' }],
          next: 't3gate',
        },
        t1_only: {
          speaker: 'oracle',
          text: '"Wise. Or scared. From here they look the same, and both of them keep you alive."',
          next: 'name',
        },
        // Tier 3 — needs deep complicity (w.enclosure >= 4, via a3.own_branches).
        t3gate: {
          speaker: 'narrator',
          text: 'You are about to close the window when one more line arrives, slower than the rest, as if it cost something to type.',
          choices: [
            {
              text: '"There\'s more. Say it."',
              if: { all: [{ var: 'w.enclosure', gte: 4 }, { flag: 'a3.own_branches' }] },
              goto: 't3',
            },
            {
              tag: '[Locked]',
              text: '"There\'s more, isn\'t there." (You haven\'t gone deep enough to be shown.)',
              req: { all: [{ var: 'w.enclosure', gte: 4 }, { flag: 'a3.own_branches' }] },
              reqText: 'The Oracle only shows this to someone already in deep',
              goto: 'name',
            },
            { text: '"Not tonight. Goodnight, whoever you are."', goto: 'name' },
          ],
        },
        t3: {
          speaker: 'oracle',
          text: [
            '"PARALLAX has been running a search. Not for a target. For a *hire*. It\'s been modeling the ideal next head of Special Accounts — the temperament, the access, the debts, the people you\'d sell first."',
            '"I pulled the top of the ranked list. It\'s a dossier. It\'s you."',
            '"Kroll didn\'t recruit you. The model did. She just took you to dinner."',
          ],
          effects: [
            { flag: 'a3.truth_t3' },
            { flag: 'npc.kroll.wants_you' },
            { stat: 'stress', add: 8 },
          ],
          next: 'name',
        },
        // Identity resolves here.
        name: {
          speaker: 'oracle',
          text: [
            '"You\'ve earned one true thing from me. Here it is."',
            { if: { faction: 'fac.loft', gte: 25 }, text: 'The next line arrives in an old, old format — a handle style nobody has used since before the \'94 raids. You know exactly one person who still types like that.' },
            { if: { all: [{ faction: 'fac.bureau', gte: 25 }, { faction: 'fac.loft', lte: 24 }, { faction: 'fac.aperture', lte: 49 }, { faction: 'fac.halcyon', lte: 49 }, { faction: 'fac.hood', lte: 24 }] }, text: 'The routing is federal, and clumsily hidden, the way someone hides a thing from their own office. Only one agent in this city has a reason to work against her own building.' },
            { if: { any: [{ faction: 'fac.aperture', gte: 50 }, { faction: 'fac.halcyon', gte: 50 }] }, text: 'The line is warm, and precise, and it remembers your drink order. Even the market, it turns out, wants insurance.' },
            '"Now forget you know it. Knowing it is the most dangerous thing you own."',
          ],
          effects: [
            { flag: 'a3.oracle_revealed' },
            { var: 'w.exposure', add: 2 },
            ...resolveOracleIdentity,
          ],
        },
      },
    },
  ],
})
