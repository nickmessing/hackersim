/**
 * People & faction presentation: relationship tiers, romance and fate wording, faction ranks,
 * and the neglect ("drift") forecast. Wording only — the rules themselves live in the engine
 * (social activity in time.ts, weekly affinity drift in time.ts).
 */
import { C, countSlots, evalCond } from '@/engine'
import type { FactionDef, GameState, NpcDef, NpcFate, NpcState, RomanceState } from '@/engine'
import { humanize, type Tone } from './util'

// ── Relationship tiers ─────────────────────────────────────────────────────

export interface Relation {
  label: string
  tone: Tone
  /** Short flavor shown under the affinity bar. */
  blurb: string
}

export function relationOf(affinity: number): Relation {
  if (affinity <= -40) return { label: 'Hostile', tone: 'bad', blurb: 'Would hang up on you. Twice.' }
  if (affinity < 0) return { label: 'On thin ice', tone: 'bad', blurb: 'Things are frosty between you.' }
  if (affinity < 20) return { label: 'Acquaintance', tone: 'muted', blurb: 'You know each other to nod at.' }
  if (affinity < 40) return { label: 'Friendly', tone: 'info', blurb: 'Glad to see you. Might lend you a CD-R.' }
  if (affinity < 70) return { label: 'Close', tone: 'good', blurb: 'Picks up at 2 a.m. and means it.' }
  return { label: 'Inner circle', tone: 'story', blurb: 'Family you chose. Would help you move \u2014 four flights, no elevator.' }
}

/** Tick marks for relationship bars (tier boundaries). */
export const RELATION_TICKS = [-40, 0, 20, 40, 70] as const

// ── Romance ────────────────────────────────────────────────────────────────

export const ROMANCE_LABELS: Record<RomanceState, { label: string; tone: Tone }> = {
  none: { label: 'Just friends', tone: 'muted' },
  flirting: { label: 'Flirting', tone: 'story' },
  dating: { label: 'Dating', tone: 'story' },
  partner: { label: 'Partner', tone: 'good' },
  engaged: { label: 'Engaged', tone: 'good' },
  married: { label: 'Married', tone: 'good' },
  ex: { label: 'Ex', tone: 'muted' },
}

// ── Fates ──────────────────────────────────────────────────────────────────

export interface FateInfo {
  label: string
  /** Period-flavored status line for the contact card. */
  line: string
  tone: Tone
  /** Can you still spend time with them? */
  reachable: boolean
}

/** Fates the engine itself treats as "can't socialize" (sim/time.ts social activity). */
const ENGINE_UNREACHABLE: readonly NpcFate[] = ['dead', 'missing', 'gone', 'jailed', 'arrested']

type FateRow = [label: string, line: string, tone: Tone, reachable?: boolean]

/** Known fate strings. Content may use others; they fall back to a humanized label. */
const FATES: Record<string, FateRow> = {
  // Engine-common fates
  ally: ['Ally', 'Has your back, no questions asked.', 'good'],
  enemy: ['Enemy', 'Would cross the street to avoid you — or to find you.', 'bad'],
  arrested: ['Arrested', 'Picked up by the police. Calls go straight to a public defender.', 'bad', false],
  jailed: ['Behind bars', 'Doing time. Letters take three weeks and arrive already opened.', 'bad', false],
  missing: ['Missing', 'Pager goes unanswered. Nobody on the Row has seen them in weeks.', 'bad', false],
  dead: ['Deceased', 'Gone for good. Their away message is still up.', 'bad', false],
  gone: ['Moved away', 'Left Port Lumen. The number you have dialed is no longer in service.', 'muted', false],
  betrayer: ['Betrayed you', 'Sold you out. You found out the hard way.', 'bad'],
  informant: ['Informant', 'Talks to the feds. Mind what you say on the phone.', 'warn'],
  // Common story outcomes
  passed: ['Passed away', 'Rest easy. The service was on a grey, foggy morning.', 'bad', false],
  passed_keys: ['Passed away', 'Left you a set of keys and a note in careful handwriting.', 'bad', false],
  disappeared: ['Disappeared', 'Vanished without a word. Their apartment was cleared out overnight.', 'bad', false],
  detained: ['Detained', 'Held somewhere without a phone call.', 'bad', false],
  arrested_young: ['Arrested', 'Picked up young. Too young.', 'bad', false],
  martyred: ['Imprisoned', 'Serving a long sentence. The scene still toasts to them.', 'bad', false],
  exile: ['In exile', 'Went dark and left town. The board is silent.', 'muted', false],
  left: ['Walked away', 'Wanted a quieter life than the one you were offering.', 'muted', false],
  evicted: ['Evicted', 'Pushed out of the neighborhood by the redevelopment.', 'warn'],
  free: ['Free', 'Walking free — and staying that way.', 'good'],
  backroom_partner: ['Business partner', 'Runs the back room with you. Coffee is always on.', 'good'],
  partner: ['Partner', 'Building a life with you, one quiet evening at a time.', 'good'],
  flipped: ['Cooperating', 'Working with the authorities now.', 'warn'],
  turns: ['Turned on you', 'Feels used. Has been talking to the wrong people.', 'bad'],
  sellout: ['Sold out', 'Took the corporate money and never looked back.', 'bad'],
  converted: ['Back in the fold', 'Came around to the commons, grudgingly.', 'good'],
  casualty: ['Used up', 'Chewed up and spat out by people with nicer offices.', 'bad'],
  new_sysop: ['Sysop', 'Runs the board now. Power suits them badly.', 'info'],
  honored: ['Honored elder', 'The scene stands up when they walk in.', 'good'],
  mentor: ['Mentor', 'Still in your corner, still giving advice you ignore.', 'good'],
  pro: ['Professional', 'Grew careful. Grew up.', 'good'],
  relapse: ['Relapsed', 'Went back to the old life. You know why.', 'bad'],
  saves_you: ['Saved your skin', 'Knew a way out when you needed one.', 'good'],
  nemesis: ['Nemesis', 'Has a file on you and a very long memory.', 'bad'],
  handler: ['Your handler', 'Keeps you out of a cell, for a price.', 'info'],
  broken: ['Burned out', 'Blew the whistle on their own people. It cost everything.', 'warn'],
  turned: ['Quit the job', 'Walked away from the badge.', 'info'],
  whistleblower: ['Whistleblower', 'Went public. The papers love them; the bosses do not.', 'info'],
  collateral: ['Collateral damage', 'Got hurt because of what you do.', 'bad'],
  treated: ['In treatment', 'The bills got paid. Recovering slowly.', 'good'],
  worsens: ['Getting worse', 'The bills went unpaid.', 'warn'],
  exposed: ['Exposed', 'Their secrets are on the front page.', 'warn'],
  reformed: ['Reformed', 'Cleaned house. Mostly.', 'good'],
  promoted: ['Promoted', 'Moved up in the world.', 'info'],
  entrenched: ['Entrenched', 'Dug in and untouchable.', 'muted'],
  boss: ['Your boss', 'Signs your checks now.', 'info'],
  cut_loose: ['Cut loose', 'Their own people burned them.', 'warn'],
  flips: ['Turned on them', 'Switched sides against the people who made them.', 'info'],
  made_you: ['Handed you the keys', 'Gave you their seat at the table.', 'story'],
  rising: ['Rising', 'Climbing fast over other people’s careers.', 'warn'],
  neutralized: ['Neutralized', 'Out of the game.', 'muted'],
  your_ally: ['Your ally', 'Owes you, and knows it.', 'good'],
  anchor: ['The anchor', 'Still there every morning, coffee on.', 'good'],
  diner_closed: ['Closed up shop', 'The diner is dark now. The sign still hums.', 'muted'],
  base: ['Home base', 'Their back room is your headquarters.', 'good'],
  took_a_fall: ['Took the fall', 'Paid for something that wasn’t theirs.', 'bad'],
  flames_out: ['Flamed out', 'Crashed in public, all at once.', 'bad'],
  escapes_clean: ['Cashed out', 'Got out clean with a golden parachute.', 'muted'],
  patron: ['Your patron', 'Protects you, as long as you keep quiet.', 'info'],
  well: ['Doing well', 'Sends you forwarded chain letters. Thriving.', 'good'],
  spied_on: ['Under watch', 'Somebody is keeping tabs on them.', 'warn'],
  warned: ['Warned', 'Knows what’s coming, thanks to you.', 'info'],
  refunded: ['Got the money back', 'Out of the pyramid, a little wiser.', 'good'],
  ruined: ['Ruined', 'Lost it all.', 'bad'],
  spared: ['Spared', 'Dodged the worst of it.', 'good'],
  hired: ['Back at work', 'Found a job and kept it.', 'good'],
  helped: ['Back on track', 'You gave them a hand when it counted.', 'good'],
  schadenfreude: ['Down on their luck', 'Life caught up with them.', 'muted'],
  retrained: ['Retrained', 'Learned a new trade at an age most people don’t.', 'good'],
  mill_ghost: ['Night shift', 'Works nights where the mill used to be.', 'warn'],
  spiral: ['Spiraling', 'Drinking. Not answering the phone.', 'bad'],
  dating_again: ['Seeing someone', 'Found somebody. It’s sweet, and a little awkward.', 'good'],
  rehired_halcyon: ['Rehired', 'Landed on their feet at a new desk.', 'good'],
  councilwoman: ['City Council', 'Holds a seat on the City Council.', 'info'],
  neutral: ['Keeping out of it', 'Keeps their head down and the pipes running.', 'muted'],
  whistle: ['Whistleblower', 'Leaked what they knew, with your help.', 'info'],
  company_man: ['Company man', 'Did what the company asked. Got a nice office.', 'warn'],
  expanded: ['Expanded', 'Federal money grew their unit into something serious.', 'warn'],
  forced_out: ['Forced out', 'Budget cut out from under them.', 'muted'],
  the_one_who_cuffs_you: ['Closing in', 'Has your name on a warrant.', 'bad'],
  complicit: ['Looked away', 'Chose not to see where the money came from.', 'warn'],
  bought: ['Bought', 'Took the money. Everybody has a price.', 'bad'],
  succeeded: ['Stepped down', 'Handed the board over to you.', 'good'],
  vindicated: ['Vindicated', 'The scene came around to their way of thinking.', 'good'],
}

/** Fate info for display, or undefined for the default ("normal") fate. */
export function fateOf(fate: NpcFate): FateInfo | undefined {
  if (fate === 'normal' || fate === '') return undefined
  const row = FATES[fate]
  const reachable = !ENGINE_UNREACHABLE.includes(fate) && (row?.[3] ?? true)
  if (!row) return { label: humanize(fate), line: '', tone: 'muted', reachable }
  return { label: row[0], line: row[1], tone: row[2], reachable }
}

/** True if spending social time with this NPC is possible (met, reachable fate). */
export function canSocialize(def: NpcDef, st: NpcState): boolean {
  if (!def.social || !st.met) return false
  return fateOf(st.fate)?.reachable ?? true
}

// ── Met NPCs ───────────────────────────────────────────────────────────────

export interface Person {
  def: NpcDef
  st: NpcState
}

/** Read-only NPC state (never inserts into `state.npcs`). */
export function personState(state: GameState, def: NpcDef): NpcState {
  return (
    state.npcs[def.id] ?? {
      met: def.startsMet ?? false,
      affinity: def.startAffinity ?? 0,
      fate: 'normal',
      romance: 'none',
    }
  )
}

/** Everyone you have met, joined with their definitions. */
export function metPeople(state: GameState): Person[] {
  const out: Person[] = []
  for (const def of C.npcs.values()) {
    const st = personState(state, def)
    if (st.met) out.push({ def, st })
  }
  return out
}

// ── Neglect / drift forecast ───────────────────────────────────────────────

/** Days without contact before the Contacts app starts warning about drift. */
export const DRIFT_WARN_DAYS = 4

export interface Drift {
  /** Day of last contact, or undefined if never. */
  lastDay: number | undefined
  /** Days since last contact, or undefined if never. */
  since: number | undefined
  /** Weekly loss when neglected (0 = this person doesn't drift). */
  decay: number
  /**
   * - `none`: this person doesn't drift (no decay, no positive affinity, or unreachable)
   * - `covered`: your scheduled Social hours keep in touch with them daily
   * - `ok`: in touch recently
   * - `warn`: neglected, and the next weekly check will cost affinity
   */
  level: 'none' | 'covered' | 'ok' | 'warn'
  /** The weekly check day on which affinity drops if nothing changes. */
  lossDay: number | undefined
}

/**
 * Mirrors the engine's weekly neglect check (at the start of every day divisible by 7, an NPC with
 * `decay` loses that much affinity if the last contact was 7+ days before). Display only.
 */
export function driftOf(state: GameState, p: Person): Drift {
  const lastDay = state.vars[`aff.last.${p.def.id}`]
  const day = state.time.day
  const since = lastDay === undefined ? undefined : Math.max(0, day - lastDay)
  const decay = p.def.decay ?? 0
  const base = { lastDay, since, decay }
  const drifts = decay > 0 && p.st.affinity > 0 && fateOf(p.st.fate)?.reachable !== false
  if (!drifts) return { ...base, level: 'none', lossDay: undefined }
  if (state.focus.social === p.def.id && canSocialize(p.def, p.st) && countSlots(state, 'social') > 0) {
    return { ...base, level: 'covered', lossDay: undefined }
  }
  const nextCheck = (Math.floor(day / 7) + 1) * 7
  const last = lastDay ?? -999
  let lossDay = nextCheck
  while (lossDay - last < 7) lossDay += 7
  const neglected = since === undefined || since >= DRIFT_WARN_DAYS
  return { ...base, level: neglected && lossDay === nextCheck ? 'warn' : 'ok', lossDay }
}

// ── Factions ───────────────────────────────────────────────────────────────

export interface Rank {
  at: number
  label: string
}

/** Default tier ladder (bible §3) for factions that don't define their own ranks. */
const DEFAULT_RANKS: Rank[] = [
  { at: -100, label: 'Hostile' },
  { at: -39, label: 'Wary' },
  { at: 0, label: 'Neutral' },
  { at: 20, label: 'Known' },
  { at: 50, label: 'Trusted' },
  { at: 80, label: 'Inner' },
]

export function ranksOf(def: FactionDef): Rank[] {
  const list = def.ranks && def.ranks.length > 0 ? def.ranks : DEFAULT_RANKS
  return [...list].sort((a, b) => a.at - b.at)
}

export interface RankView {
  ladder: Rank[]
  current: Rank | undefined
  next: Rank | undefined
  label: string
}

export function rankOf(def: FactionDef, rep: number): RankView {
  const ladder = ranksOf(def)
  let current: Rank | undefined
  let next: Rank | undefined
  for (const r of ladder) {
    if (r.at <= rep) current = r
    else next ??= r
  }
  const label = current?.label ?? (rep < 0 ? 'Distrusted' : 'Unknown')
  return { ladder, current, next, label }
}

export function repTone(rep: number): Tone {
  if (rep <= -40) return 'bad'
  if (rep < 0) return 'warn'
  if (rep < 20) return 'muted'
  if (rep < 50) return 'info'
  if (rep < 80) return 'good'
  return 'story'
}

/** Factions currently visible to the player. */
export function revealedFactions(state: GameState): FactionDef[] {
  return [...C.factions.values()].filter(f => evalCond(state, f.revealWhen))
}

/** Faction def for an NPC, only if that faction is revealed (spoiler-safe). */
export function revealedFactionOf(state: GameState, def: NpcDef): FactionDef | undefined {
  if (!def.faction) return undefined
  const f = C.factions.get(def.faction)
  return f && evalCond(state, f.revealWhen) ? f : undefined
}
