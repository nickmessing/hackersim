/**
 * PKG-04 — the §4.6 fate-finalization table.
 *
 * `finalizeFates()` returns one effect chain per NPC: ordered rules, first match wins, exactly as the
 * bible's table. Two conventions make it safe to run more than once:
 *
 *  - Genuinely terminal fates (death, arrest, a sentence, a departure) are kept by a leading rule.
 *  - Where a fate has a different sole writer (§13: Corvid/Switch PKG-05, Kroll/Hollis PKG-06,
 *    Reyes/Marlow/Calderon PKG-07, Vale/Okoro/Wes PKG-09, Dad/Sal/Marge PKG-10), the flag rules still
 *    run first (they read the owner's own steering flags, so they agree with the owner), but a legal
 *    fate the owner already wrote is kept before any rep/affinity default is applied.
 *
 * It runs in `main_a4_q1_reckonings` (the table's home) and again in `main_a4_q4_last_day` just before
 * the ending is assembled, because the Act IV faction finales (fac_loft_q6, fac_aperture_q6,
 * fac_halcyon_q6, fac_hood_q5, ...) resolve after q1 and set the very flags this table reads
 * (`w.scene_state='reformed'`, `npc.kroll.made_you`, `end.clean_startup`, Marge's keys...).
 */
import { defineContent } from '@/engine/registry'
import type { Cond, Effect, NpcFate, NpcId } from '@/engine/types'
import { aff, affLte, all, any, fate, flag, met, not } from './shared'

interface Rule {
  if: Cond
  /** Fate to write; `null` keeps whatever is there. */
  fate: NpcFate | null
}

const keep = (npc: NpcId, fates: NpcFate[]): Rule => ({ if: fate(npc, fates), fate: null })
const rule = (c: Cond, f: NpcFate): Rule => ({ if: c, fate: f })

/** Build a first-match-wins chain as nested `if/else` effects. `fallback: null` = leave as is. */
export function fateChain(npc: NpcId, rules: Rule[], fallback: NpcFate | null): Effect {
  let acc: Effect[] = fallback === null ? [] : [{ npc, fate: fallback }]
  for (const r of [...rules].reverse()) {
    acc = [{ if: r.if, then: r.fate === null ? [] : [{ npc, fate: r.fate }], else: acc }]
  }
  const [first] = acc
  return first ?? { log: `(${npc}: no fate rules)` }
}

const onlyIfMet = (npc: NpcId, e: Effect): Effect => ({ if: met(npc), then: [e] })

// ── The table ────────────────────────────────────────────────────────────────

const jaxFreeTrack = any(
  fate('jax', ['free', 'backroom_partner']),
  flag('npc.jax.protected'),
  flag('a2.took_jax_fall'),
  flag('npc.jax.covered'),
  flag('a4.jax_backroom_yes'),
)
const jaxUntouched = all(
  ...['npc.jax.protected', 'npc.jax.exposed', 'npc.jax.alone', 'npc.jax.covered', 'a2.took_jax_fall'].map(f => not(flag(f))),
)

const JAX = fateChain(
  'jax',
  [
    keep('jax', ['dead', 'arrested', 'flipped', 'gone']),
    rule(all(jaxFreeTrack, aff('jax', 60), { var: 'w.cathode_open', eq: 1 }), 'backroom_partner'),
    rule(flag('npc.jax.protected'), 'free'),
    rule(all(affLte('jax', 10), jaxUntouched), 'gone'),
  ],
  'free',
)

const PRIYA = onlyIfMet(
  'priya',
  fateChain(
    'priya',
    [
      rule(flag('a3.whistleblow_prepped'), 'martyr'),
      rule(flag('end.clean_startup'), 'cofounder'),
      rule(flag('npc.priya.you_covered'), 'saved'),
      rule(flag('npc.priya.silenced'), 'complicit'),
      rule(
        any(
          flag('a3.kroll_hunts_priya'),
          all(affLte('priya', 15), not({ item: 'priya_proof' }), { quest: 'main_a3_q3_priya_dilemma', status: 'completed' }),
        ),
        'broken',
      ),
      keep('priya', ['martyr', 'cofounder', 'saved', 'complicit', 'broken']),
    ],
    'complicit',
  ),
)

const CORVID = onlyIfMet(
  'corvid',
  fateChain(
    'corvid',
    [
      keep('corvid', ['martyred']),
      rule(flag('npc.corvid.bought'), 'bought'),
      rule(flag('w.scene_state', 'reformed'), 'vindicated'),
      rule(flag('fac.loft.sysop', 'player'), 'succeeded'),
      rule(all(flag('npc.corvid.charged'), not(flag('a2.solidarity'))), 'martyred'),
      rule(flag('w.scene_state', 'dark'), 'exile'),
      keep('corvid', ['free', 'exile', 'bought', 'succeeded', 'vindicated']),
    ],
    'free',
  ),
)

const MIRA = onlyIfMet(
  'mira',
  fateChain(
    'mira',
    [
      keep('mira', ['casualty']),
      rule({ npc: 'mira', romance: ['partner', 'engaged', 'married'] }, 'partner'),
      rule(all(flag('a3.chose_speed_over_mira'), { mission: 'a3_signal_intelligence', status: 'lost' }), 'casualty'),
      rule(all(flag('npc.mira.betrayed'), { faction: 'fac.aperture', gte: 50 }), 'rival'),
      rule(flag('npc.mira.betrayed'), 'flips_you'),
      keep('mira', ['gone']),
      rule(flag('a4.mira_stays'), 'rival'),
      rule(flag('a4.mira_goes'), 'gone'),
      rule(affLte('mira', 15), 'gone'),
      keep('mira', ['rival', 'flips_you']),
      rule(aff('mira', 40), 'rival'),
    ],
    'gone',
  ),
)

const MOM = fateChain(
  'mom',
  [keep('mom', ['healthy', 'recovered_dark', 'passed', 'estranged']), rule({ var: 'w.mom_gone', eq: 1 }, 'passed')],
  'healthy',
)

const DAD = fateChain(
  'dad',
  [
    keep('dad', ['retrained', 'spiral', 'mill_ghost', 'dating_again']),
    rule(flag('npc.dad.mill_job'), 'mill_ghost'),
    rule({ quest: 'fac_hood_q2_dad', status: 'completed' }, 'retrained'),
    rule(flag('npc.dad.dating'), 'dating_again'),
    rule(all(affLte('dad', 15), { var: 'w.mom_gone', eq: 1 }, not(flag('npc.dad.pulled_back'))), 'spiral'),
  ],
  null,
)

const KIM = fateChain(
  'kim',
  [
    rule(flag('a4.kim_restored'), 'thriving'),
    // A failed scrub (a4_kim_way_out): she watched over your shoulder and learned.
    rule(flag('a4.kim_followed'), 'follows_in'),
    keep('kim', ['endangered']),
    rule(flag('a4.kim_steered'), 'thriving'),
    rule(flag('a4.kim_blessed'), 'follows_in'),
    rule({ var: 'kim_trajectory', gte: 2 }, 'thriving'),
    rule({ var: 'kim_trajectory', lte: -2 }, 'follows_in'),
    rule(affLte('kim', 10), 'estranged'),
    keep('kim', ['thriving', 'follows_in', 'estranged']),
  ],
  'thriving',
)

const KROLL = onlyIfMet(
  'kroll',
  fateChain(
    'kroll',
    [
      keep('kroll', ['arrested']),
      rule(flag('npc.kroll.made_you'), 'made_you'),
      rule(all(flag('npc.kroll.charged'), { faction: 'fac.bureau', gte: 50 }, flag('a3.whistleblow_prepped')), 'arrested'),
      rule(flag('npc.kroll.flips_set'), 'flips'),
      rule(flag('npc.kroll.charged'), 'cut_loose'),
      keep('kroll', ['boss', 'cut_loose', 'flips', 'made_you']),
      rule({ faction: 'fac.aperture', gte: 50 }, 'boss'),
    ],
    'cut_loose',
  ),
)

const REYES = onlyIfMet(
  'reyes',
  fateChain(
    'reyes',
    [
      rule(flag('npc.reyes.broke_whistle'), 'broken'),
      rule(all(flag('fac.bureau.informant'), flag('end.clean_startup')), 'turned'),
      rule(flag('fac.bureau.informant'), 'handler'),
      keep('reyes', ['broken', 'turned', 'handler', 'nemesis']),
      rule(any(flag('a3.fed_the_wire'), flag('fac.bureau.onto_you_hard'), { faction: 'fac.bureau', lte: -20 }), 'nemesis'),
      rule({ faction: 'fac.bureau', gte: 0 }, 'handler'),
    ],
    'nemesis',
  ),
)

const MARLOW = onlyIfMet(
  'marlow',
  fateChain(
    'marlow',
    [
      rule(flag('npc.marlow.exposed'), 'exposed'),
      rule(flag('a4.bonfire_bureau_done'), 'exposed'),
      keep('marlow', ['exposed', 'promoted']),
    ],
    'entrenched',
  ),
)

const CALDERON = onlyIfMet(
  'calderon',
  fateChain(
    'calderon',
    [
      keep('calderon', ['the_one_who_cuffs_you']),
      rule(flag('npc.calderon.ally_case'), 'ally'),
      keep('calderon', ['ally', 'expanded', 'forced_out']),
      rule({ var: 'w.mnsa', gte: 1 }, 'expanded'),
    ],
    'forced_out',
  ),
)

const VALE = fateChain(
  'vale',
  [
    rule(flag('npc.vale.reformed'), 'reformed'),
    rule(flag('npc.vale.exposed'), 'exposed'),
    rule(flag('fac.halcyon.made_partner'), 'patron'),
    rule(flag('w.halcyon_state', 'dead'), 'flames_out'),
    keep('vale', ['flames_out', 'escapes_clean', 'patron', 'exposed', 'reformed']),
  ],
  'escapes_clean',
)

/** Runs after Kroll (reads her fate). */
const HOLLIS = onlyIfMet(
  'hollis',
  fateChain(
    'hollis',
    [
      rule(flag('npc.hollis.your_ally'), 'your_ally'),
      rule(flag('npc.hollis.neutralized'), 'neutralized'),
      keep('hollis', ['rising', 'neutralized', 'your_ally']),
      rule(all(fate('kroll', ['arrested', 'cut_loose', 'flips']), not(flag('npc.kroll.made_you'))), 'rising'),
    ],
    'neutralized',
  ),
)

const DEE = onlyIfMet(
  'dee',
  fateChain(
    'dee',
    [
      rule(flag('npc.dee.council'), 'councilwoman'),
      rule(flag('npc.dee.promoted'), 'promoted'),
      keep('dee', ['councilwoman', 'promoted', 'rehired_halcyon']),
    ],
    'rehired_halcyon',
  ),
)

const SAL = fateChain(
  'sal',
  [
    keep('sal', ['took_a_fall']),
    rule({ var: 'w.cathode_open', eq: 0 }, 'diner_closed'),
    rule(flag('npc.sal.base'), 'base'),
    keep('sal', ['took_a_fall', 'base', 'diner_closed']),
    rule(any({ faction: 'fac.hood', lte: -20 }, { var: 'w.hood_soul', lte: -2 }), 'took_a_fall'),
  ],
  'anchor',
)

const GRACE = fateChain(
  'grace',
  [
    rule({ npc: 'grace', romance: ['partner', 'engaged', 'married'] }, 'partner'),
    keep('grace', ['whistleblower', 'collateral', 'left']),
    rule(all(met('grace'), any({ npc: 'grace', romance: 'ex' }, flag('life.partner', 'mira'))), 'left'),
  ],
  null,
)

const DEADLINE = onlyIfMet(
  'deadline',
  fateChain(
    'deadline',
    [
      keep('deadline', ['passed', 'missing', 'dead']),
      rule(flag('npc.deadline.saved_you'), 'saves_you'),
      rule(flag('npc.deadline.relapse'), 'relapse'),
      keep('deadline', ['saves_you', 'relapse']),
    ],
    'mentor',
  ),
)

const BYTEME = onlyIfMet(
  'byteme',
  fateChain(
    'byteme',
    [
      keep('byteme', ['dead', 'arrested_young', 'missing']),
      rule(flag('npc.byteme.turns_set'), 'turns'),
      keep('byteme', ['turns', 'pro']),
    ],
    'pro',
  ),
)

const SWITCH = onlyIfMet(
  'switch',
  fateChain(
    'switch',
    [
      rule(all(flag('w.scene_state', 'bleeding'), flag('fac.loft.side_switch')), 'sellout'),
      rule(flag('npc.switch.converted'), 'converted'),
      rule(flag('fac.loft.sysop', 'switch'), 'new_sysop'),
      keep('switch', ['sellout', 'converted', 'casualty', 'new_sysop']),
      rule(all(flag('fac.loft.side_switch'), flag('w.scene_state', 'dark')), 'casualty'),
    ],
    'converted',
  ),
)

const DIALTONE = fateChain(
  'dialtone',
  [keep('dialtone', ['honored', 'evicted', 'passed_keys']), rule(flag('side.met_dialtone'), 'honored')],
  null,
)

const WES = onlyIfMet('northlink_wes', fateChain('northlink_wes', [keep('northlink_wes', ['whistle', 'company_man', 'neutral'])], 'neutral'))
const OKORO = onlyIfMet('okoro', fateChain('okoro', [keep('okoro', ['mentor', 'complicit', 'ally'])], 'mentor'))

/** The whole table, in dependency order (Kroll before Hollis). */
export function finalizeFates(): Effect[] {
  return [JAX, PRIYA, CORVID, MIRA, MOM, DAD, KIM, KROLL, REYES, MARLOW, CALDERON, VALE, HOLLIS, DEE, SAL, GRACE, DEADLINE, BYTEME, SWITCH, DIALTONE, WES, OKORO]
}

/**
 * The early pass, run when Act IV opens so the reckoning scenes can read settled fates. It covers
 * only people whose rules read state that is already final by then; it skips Jax and Mira (their
 * reckonings offer real choices the table then reads) and the fates owned by Act IV faction finales
 * (Kroll/Hollis, Reyes/Marlow/Calderon, Vale, Dad/Sal/Marge, Switch). Every chain puts its flag rules
 * before its keep rules, so the full pass at the end re-derives anything that changed since.
 */
export function earlyFates(): Effect[] {
  return [PRIYA, CORVID, MOM, KIM, GRACE, DEADLINE, BYTEME]
}

export default defineContent({})
