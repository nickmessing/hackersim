/**
 * PKG-04 — `trig_evidence`: maintains the derived flag `end.has_evidence` (bible §6 conventions).
 *
 *   end.has_evidence = item kroll_recording
 *                   OR a3.ghost_protocol
 *                   OR (item aperture_sample AND item priya_proof)
 *                   OR var evidence_fragments >= 3
 *
 * Edge-triggered: it fires only when the flag disagrees with the formula (evidence gained, or lost,
 * e.g. Priya's proof sold at CP-C1 C), so although it is repeatable it never spams.
 */
import { defineContent } from '@/engine/registry'
import type { Cond } from '@/engine/types'
import { all, any, flag, not } from './shared'

export const EVIDENCE: Cond = any(
  { item: 'kroll_recording' },
  flag('a3.ghost_protocol'),
  all({ item: 'aperture_sample' }, { item: 'priya_proof' }),
  { var: 'evidence_fragments', gte: 3 },
)

export default defineContent({
  triggers: [
    {
      id: 'trig_evidence',
      once: false,
      // Edge-triggered (see header): the `when` is only true while the flag is stale.
      cooldownDays: 0,
      priority: 20,
      when: any(all(EVIDENCE, not(flag('end.has_evidence'))), all(not(EVIDENCE), flag('end.has_evidence'))),
      effects: [
        {
          if: EVIDENCE,
          then: [
            { flag: 'end.has_evidence' },
            {
              notify: 'Corkboard: it holds together now. With what you have, nobody can call it a hoax.',
              kind: 'story',
            },
          ],
          else: [
            { clearFlag: 'end.has_evidence' },
            { notify: 'Corkboard: a piece is missing. What you have left is a story, not proof.', kind: 'bad' },
          ],
        },
      ],
    },
  ],
})
