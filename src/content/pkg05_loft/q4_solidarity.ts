/**
 * PKG-05 — fac_loft_q4_solidarity, the journal-mirror of the first raid's Corvid branch
 * (bible §7 "journal-only mirror quests", §7.1 step 4).
 *
 * It owns no scenes and no story effects: the raid itself (CP-B4, PKG-02) already set
 * `a2.solidarity` (you organized the '94-style wipe) or `npc.corvid.charged` (it went wrong).
 * This quest only records, in the Journal and via the constraint flag `fac.loft.marked`, that the
 * Loft is now owed a rescue — which `side_loft_calls_it_in` (PKG-12) later reads.
 */
import { defineContent } from '@/engine/registry'

export default defineContent({
  quests: [
    {
      id: 'fac_loft_q4_solidarity',
      title: 'The Night They Came',
      kind: 'faction',
      faction: 'fac.loft',
      giver: 'corvid',
      act: 2,
      summary: 'They came for the Loft, the way they came for Deadline in \'94. What you did in that hour is a debt the scene keeps — in both directions.',
      rewards: 'The Loft remembers (a debt owed, in Act III)',
      priority: 15,
      autoStart: { any: [{ flag: 'a2.solidarity' }, { flag: 'npc.corvid.charged' }] },
      start: 'record',
      stages: {
        record: {
          text: [
            { if: { flag: 'a2.solidarity' }, text: 'When the men in jackets came for Corvid, you rang the tree and forty drives went to bare metal in a single night, just like \'94. Nobody said a word. She said "thank you" exactly once, and meant it more than anyone ever has. The Loft owes you now, and knows it.' },
            {
              if: { all: [{ flag: 'npc.corvid.charged' }, { not: { flag: 'a2.solidarity' } }] },
              text: 'When the men in jackets came, the wipe went wrong, and Corvid is facing charges for all of it. Somebody panicked; somebody talked. The Loft is owed a rescue, and the clock on it started the moment the door came off its hinges.',
            },
          ],
          onComplete: [{ flag: 'fac.loft.marked' }],
          objectives: [
            {
              id: 'remember',
              text: 'The Loft keeps the account',
              when: { any: [{ flag: 'a2.solidarity' }, { flag: 'npc.corvid.charged' }] },
              hint: 'Nothing to do here — this is the scene\'s memory of the first raid. It will call the debt in later (watch for the Loft in Act III).',
            },
          ],
        },
      },
    },
  ],
})
