/**
 * PKG-06 — Aperture arc, journal-only mirror quests (bible §7 "Journal-only mirror quests" + §7.2).
 *
 * These own no scenes and no consequential effects: they exist so the Aperture arc reads as a
 * continuous story in the Journal even though the *decisions* live in the Act II / Act III main
 * quests (`main_a2_q1` Kroll's dinner; `main_a3_q8` the Meridian heist, Aperture route). Each
 * autoStarts and immediately completes on a flag the main quest already set.
 *
 * Cross-package reads (owners write them): `a2_kroll_dinner` scene (PKG-02), `a3.heist_resolved`
 * and `a2.spine` (PKG-02/03). Expected "unknown scene / flag read but never set" in isolated
 * validation until those packages ship.
 */
import { defineContent } from '@/engine/registry'
import type { QuestDef } from '@/engine/types'

/** §7.2.1 — mirror of CP-B1 (Kroll's first contract at Harbor Point). */
const q1Dinner: QuestDef = {
  id: 'fac_aperture_q1_dinner',
  title: 'Special Accounts: The First Dinner',
  kind: 'faction',
  act: 2,
  faction: 'fac.aperture',
  giver: 'kroll',
  priority: 20,
  autoStart: { seen: 'a2_kroll_dinner' },
  rewards: 'Opens the Aperture retainer',
  summary:
    'Vanessa Kroll took you to dinner and offered you clean-looking money for a dirty little job. However you answered, you are on her radar now — and her radar is very, very good.',
  start: 'done',
  stages: {
    done: {
      text: [
        'You have had dinner with Aperture. Whatever you told Vanessa Kroll across the white tablecloth at Harbor Point, she wrote it down somewhere kind.',
        {
          if: { flag: 'fac.aperture.client' },
          text: 'You took the job. The money was real and the receipt was not. She calls you a "friend of the firm" now, and means it the way a spider means the web is home.',
        },
        {
          if: { flag: 'a2.refused_kroll' },
          text: 'You told her no. She smiled, paid the check, and said she\'d keep your seat warm. She will. That is the frightening part.',
        },
      ],
      objectives: [
        {
          id: 'had_dinner',
          text: 'Hear out Kroll\'s first offer',
          when: { seen: 'a2_kroll_dinner' },
          hint: 'This chapter opens by itself once you\'ve had the dinner at Harbor Point (Act II main story).',
        },
      ],
    },
  },
}

/** §7.2.4 — mirror of the CP-C3 Meridian heist, Aperture "drain it" route. */
const q4Meridian: QuestDef = {
  id: 'fac_aperture_q4_meridian',
  title: 'Special Accounts: The Withdrawal',
  kind: 'faction',
  act: 3,
  faction: 'fac.aperture',
  giver: 'kroll',
  priority: 20,
  autoStart: { all: [{ flag: 'a3.heist_resolved' }, { flag: 'a2.spine', eq: 'aperture' }] },
  rewards: 'Aperture standing; a very large number in a very quiet account',
  summary:
    'You ran the Meridian job Aperture\'s way — not to expose the bank, but to bleed it. The city will feel it for years. Kroll sent a card. It did not say thank you; it said "well done," which from her is warmer.',
  start: 'done',
  stages: {
    done: {
      text:
        'The Meridian withdrawal is finished and Aperture got exactly what it paid for. Nobody at the firm will ever put your name near it, which is precisely how you know it worked.',
      objectives: [
        {
          id: 'drained',
          text: 'Complete the Meridian job for Aperture',
          when: { flag: 'a3.heist_resolved' },
          hint: 'This chapter closes itself once the Act III heist resolves on the Aperture route.',
        },
      ],
    },
  },
}

export default defineContent({
  quests: [q1Dinner, q4Meridian],
})
