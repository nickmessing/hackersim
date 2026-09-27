/**
 * PKG-10 — journal-only mirror steps of the Neighborhood arc (bible §7 preamble, §7.5).
 *
 * Mirror quests own no scenes and no effects: they start and complete on state another package
 * already wrote, and exist so the "Home Directory" arc reads as one story in the Journal.
 *  - fac_hood_q1_grandma mirrors the side_grandma_pc recurrence (PKG-13).
 *  - fac_hood_q3_row_chips_in mirrors CP-B3 C, "Crowd the Row" (PKG-02; the +1 hood_soul belongs
 *    to the news.mom_fundraiser rider, PKG-16).
 */
import { defineContent } from '@/engine/registry'

export default defineContent({
  quests: [
    {
      id: 'fac_hood_q1_grandma',
      title: 'Home Directory',
      kind: 'faction',
      act: 1,
      faction: 'fac.hood',
      giver: 'grandma_ruth',
      priority: 10,
      autoStart: { quest: 'side_grandma_pc' },
      rewards: 'The Row starts to trust you',
      summary: [
        'Ruth Alvarez told her sister, who told the choir, who told the whole of Cannery Row: the Tan kid fixes computers and doesn\'t even make you feel stupid about it.',
        'This is how the Row works. Nobody hires you. Somebody\'s aunt calls, and then somebody\'s aunt\'s neighbor calls, and one day you notice you are part of the furniture.',
      ],
      start: 'calls',
      stages: {
        calls: {
          text: [
            'You cleaned out Ruth\'s PC and she paid you in empanadas and a story about her late husband\'s bowling trophy. Now your name is in the Row\'s phone tree, between the plumber and the priest.',
            { if: { faction: 'fac.hood', gte: 10 }, text: 'People wave at you on the Row now. Mrs. Castellano has stopped calling you "the kid with the modem" and started calling you by your name.' },
          ],
          objectives: [
            {
              id: 'on_call',
              text: 'Be the one Ruth calls when the screen goes blue',
              when: { quest: 'side_grandma_pc' },
              hint: 'Ruth will call again. She always does. Answer when she does.',
            },
            {
              id: 'known',
              text: 'Become someone the Row trusts (Neighborhood 10)',
              when: { any: [{ faction: 'fac.hood', gte: 10 }, { quest: 'side_grandma_pc', status: ['completed', 'failed'] }] },
              progress: { of: { faction: 'fac.hood' }, target: 10 },
              hint: 'Every visit to Ruth\'s PC counts. So does anything else that makes you a neighbor instead of a rumor: helping your family, the odd favor down the block, showing up.',
            },
          ],
        },
      },
    },
    {
      id: 'fac_hood_q3_row_chips_in',
      title: 'The Row Chips In',
      kind: 'faction',
      act: 2,
      faction: 'fac.hood',
      giver: 'sal',
      priority: 10,
      autoStart: { flag: 'life.hood_carried_you' },
      rewards: 'A debt of love, not money',
      summary: [
        'When the hospital bills came for your mother, you didn\'t go to a bank or a client or a man in a good coat. You went to Sal\'s counter, and the Row did what the Row does.',
        'Nobody wrote anything down. Nobody will ever mention it. That is exactly how you know they remember.',
      ],
      start: 'carried',
      stages: {
        carried: {
          text: [
            'The benefit night at the Cathode ran until four in the morning. There was a jar by the register, a raffle for Sal\'s pie of the month for a year, and old Mr. Pruszynski playing accordion until someone paid him to stop.',
            'You owe them now, and not in money. The Row doesn\'t take money back. It takes you showing up.',
          ],
          objectives: [
            {
              id: 'carried',
              text: 'Let the Row carry your family',
              when: { flag: 'life.hood_carried_you' },
              hint: 'This happened when you asked the Row for help with your mother\'s bills.',
            },
            {
              id: 'headline',
              text: 'See the benefit make the paper',
              when: { news: 'mom_fundraiser' },
              optional: true,
              hint: 'Check the News window. The Row made the local page.',
            },
          ],
        },
      },
    },
  ],
})
