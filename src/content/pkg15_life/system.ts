/**
 * PKG-15 — system triggers (bible §9.0) owned by this package.
 *
 *  - trig_dee_council      Act II, day ≥ 700, Dee encouraged and fond of you → she wins her seat.
 *                          Single writer of this path's `npc.dee.council` / councilwoman fate /
 *                          `dee_council` news (side_dee_for_council is the alternative campaign path;
 *                          guarded so the two never double-fire).
 *  - trig_datacenter_open  Act III start: `w.datacenter_open = 1`, publishes `mill_datacenter`.
 *  - life_quiet_clock      daily +1 on `life.quiet_days` (every PKG-15 beat resets it).
 *  - trig_director         ~45 quiet days → pull a weighted beat from the act's pool (director.ts).
 */
import { DAYS_PER_STEP } from '@/engine/balance'
import { defineContent } from '@/engine/registry'
import type { Effect, SceneDef, TriggerDef } from '@/engine/types'
import { QUIET_RESET, actGte, actIs, around, free } from './_shared'

const scenes: SceneDef[] = [
  {
    id: 'life_dee_wins',
    channel: 'mail',
    title: 'WE DID IT (recount pending) (we still did it)',
    from: 'dee',
    start: 'start',
    nodes: {
      start: {
        text: [
          `To: everyone. Literally everyone. Mom.`,
          `Friends, customers, colleagues, and the gentleman who kept stealing my lawn signs (I know it was you, Harold):`,
          `As of 11:52 p.m. last night, Dolores Briggs is the new councilwoman for the Cannery–Millgate Ward. BY ELEVEN VOTES. There will be a recount. I have already framed the recount notice.`,
          `My priorities are as follows:\n1. The potholes on Fourth.\n2. Library hours.\n3. Computer classes for every grandmother on the Row, so that no one ever has to tell a nice lady her monitor is unplugged ever again.`,
          `Someone told me years ago I should run. I'm not naming names. (It was you.)`,
          { if: { flag: 'side.dee_campaign.lost' }, text: `P.S. Second time's the charm. Last time I lost by eleven votes and a box in the wrong room. This time I carried the senior center's absentee box to the clerk MYSELF, in my car, with the seatbelt on it.` },
          { if: { flag: 'side.dee_cyber_scandal' }, text: `P.P.S. Fitch tried the "Briggs Hack" business again at the debate. I said, "Harlan, I still cannot find the any key." The room laughed for a full minute. We are never speaking of that website again.` },
          { if: { flag: 'side.pratt_grudge' }, text: `P.P.P.S. Councilman Pratt asked me at orientation whether I knew "the repair kid." I said I know a great many kids. He did not like that. I did.` },
          `The customer has been HEALED.`,
          `— Councilwoman Dee Briggs\n(still answering this email personally, until they give me a staff)`,
        ],
        choices: [
          { text: `Reply: "Congratulations, Councilwoman. I'll be watching those potholes."`, effects: [{ npc: 'dee', affinity: 5 }, { faction: 'fac.hood', add: 2 }] },
          { text: `Reply: "Eleven votes. I want you to know one of them was Grandma Ruth voting twice."`, effects: [{ npc: 'dee', affinity: 4 }, { stat: 'mood', add: 4 }] },
        ],
      },
    },
  },
]

// ── The director's pools ─────────────────────────────────────────────────────

const FALLBACK: Effect = { scene: 'life_dir_quiet_evening' }

const poolLight: Effect = {
  random: [
    { weight: 3, effects: [{ if: around('jax'), then: [{ scene: 'life_dir_lan_invite' }], else: [FALLBACK] }] },
    { weight: 2, effects: [{ if: { var: 'w.cathode_open', eq: 1 }, then: [{ scene: 'life_dir_sal_pie' }], else: [FALLBACK] }] },
    { weight: 2, effects: [{ if: around('kim'), then: [{ scene: 'life_dir_kim_cd' }], else: [FALLBACK] }] },
    { weight: 2, effects: [{ scene: 'life_dir_flamewar' }] },
    { weight: 1, effects: [FALLBACK] },
  ],
}
const poolAct3: Effect = {
  random: [
    { weight: 3, effects: [{ if: { flag: 'npc.dee.council' }, then: [{ scene: 'life_dir_dee_newsletter' }], else: [{ scene: 'life_dir_flamewar' }] }] },
    { weight: 2, effects: [{ if: around('jax'), then: [{ scene: 'life_dir_jax_page' }], else: [FALLBACK] }] },
    { weight: 2, effects: [{ if: { var: 'life.toaster_visits', gte: 1 }, then: [{ scene: 'life_dir_szabo_theory' }], else: [FALLBACK] }] },
    { weight: 2, effects: [{ if: { var: 'w.cathode_open', eq: 1 }, then: [{ scene: 'life_dir_sal_pie' }], else: [FALLBACK] }] },
    { weight: 1, effects: [FALLBACK] },
  ],
}
const poolAct4: Effect = {
  random: [
    { weight: 3, effects: [{ scene: 'life_dir_old_photo' }] },
    { weight: 2, effects: [{ if: { var: 'w.cathode_open', eq: 1 }, then: [{ scene: 'life_dir_sal_stool' }], else: [FALLBACK] }] },
    { weight: 2, effects: [{ if: { flag: 'npc.dee.council' }, then: [{ scene: 'life_dir_dee_newsletter' }], else: [FALLBACK] }] },
    { weight: 1, effects: [FALLBACK] },
  ],
}

const triggers: TriggerDef[] = [
  {
    id: 'trig_dee_council',
    when: {
      all: [
        actIs(2),
        { day: true, gte: 700 },
        { flag: 'npc.dee.encouraged' },
        { npc: 'dee', affinityGte: 30 },
        { not: { flag: 'npc.dee.council' } },
        { not: { quest: 'side_dee_for_council', status: 'active' } },
      ],
    },
    atHour: 9,
    effects: [
      QUIET_RESET,
      { flag: 'npc.dee.council' },
      { npc: 'dee', fate: 'councilwoman' },
      { news: 'dee_council' },
      { scene: 'life_dee_wins', delayHours: 3 },
    ],
  },
  {
    id: 'trig_datacenter_open',
    when: actGte(3),
    atHour: 8,
    effects: [{ var: 'w.datacenter_open', set: 1 }, { news: 'mill_datacenter' }],
  },
  {
    id: 'life_quiet_clock',
    when: { always: true },
    once: false,
    cooldownDays: 1,
    atHour: 0,
    effects: [{ var: 'life.quiet_days', add: DAYS_PER_STEP }],
  },
  {
    id: 'trig_director',
    when: { all: [{ var: 'life.quiet_days', gte: 45 }, free, { not: { flag: 'sys.postgame' } }] },
    once: false,
    cooldownDays: 20,
    atHour: 18,
    effects: [
      QUIET_RESET,
      { if: { var: 'act', lte: 2 }, then: [poolLight], else: [{ if: actIs(3), then: [poolAct3], else: [poolAct4] }] },
    ],
  },
]

export default defineContent({ scenes, triggers })
