/**
 * Content validator. Walks every content def and reports broken references, unreachable scene
 * nodes, flags read but never set, quests/scenes that can never start, missing hints, etc.
 *
 * Run: `npm run validate` (all problems) or `CONTENT_FILTER=act1 npm run validate` (only files
 * whose path contains the filter).
 */
import type { Registry } from '../src/engine/registry'
import type { Cond, Effect, NumRef, SceneDef, Text } from '../src/engine/types'
import { SKILLS } from '../src/engine/types'
import { isFeature } from '../src/engine/unlocks'

export interface Problem {
  file: string
  where: string
  msg: string
  severity: 'error' | 'warn'
}

/** Flags/vars the engine writes itself (content may read them freely). */
const ENGINE_FLAG_PREFIXES = ['sys.', 'edu.']
const ENGINE_VARS = new Set([
  'act',
  'sys.raids',
  'sys.lastRaidDay',
  'sys.daysInDebt',
  'sys.burnouts',
  'sys.hospitalized',
  'sys.hacksDone',
  'sys.hacksFailed',
  'sys.gigsDone',
  'life.extraUpkeep',
  // World multipliers default to 1 when unset.
  'w.heatGain',
  'w.contractPay',
  'w.itSalary',
  'w.rent',
  'w.prices',
  'w.techPrices',
])
const ENGINE_VAR_PREFIXES = ['aff.last.']

interface Refs {
  flagsSet: Map<string, string>
  flagsRead: Map<string, string>
  varsSet: Map<string, string>
  varsRead: Map<string, string>
  scenesDelivered: Set<string>
  questsStarted: Set<string>
  endingsReached: Set<string>
  missionsUsed: Set<string>
  contractsOffered: Set<string>
  newsPublished: Set<string>
  obligationsSet: Set<string>
  obligationsRead: Map<string, string>
  complicationSources: Set<string>
  eventsFiredDirectly: Set<string>
  forumPosted: Set<string>
}

export function validateContent(reg: Registry): Problem[] {
  const problems: Problem[] = []
  const refs: Refs = {
    flagsSet: new Map(),
    flagsRead: new Map(),
    varsSet: new Map(),
    varsRead: new Map(),
    scenesDelivered: new Set(),
    obligationsSet: new Set(),
    obligationsRead: new Map(),
    complicationSources: new Set(),
    eventsFiredDirectly: new Set(),
    questsStarted: new Set(),
    endingsReached: new Set(),
    missionsUsed: new Set(),
    contractsOffered: new Set(),
    newsPublished: new Set(),
    forumPosted: new Set(),
  }
  const fileOf = (kind: string, id: string): string => reg.origin.get(`${kind}:${id}`) ?? '?'
  const err = (file: string, where: string, msg: string): void => {
    problems.push({ file, where, msg, severity: 'error' })
  }
  const warn = (file: string, where: string, msg: string): void => {
    problems.push({ file, where, msg, severity: 'warn' })
  }
  for (const e of reg.errors) err('registry', 'merge', e)

  const skillSet = new Set<string>(SKILLS)
  const checkSkill = (file: string, where: string, s: string): void => {
    if (!skillSet.has(s)) err(file, where, `unknown skill "${s}"`)
  }
  const need = (map: Map<string, unknown>, kind: string, id: string, file: string, where: string): void => {
    if (!map.has(id)) err(file, where, `unknown ${kind} "${id}"`)
  }

  const walkNum = (r: NumRef, file: string, where: string): void => {
    if ('skill' in r) checkSkill(file, where, r.skill)
    else if ('var' in r) refs.varsRead.set(r.var, `${file} ${where}`)
    else if ('faction' in r) need(reg.factions, 'faction', r.faction, file, where)
    else if ('affinity' in r) need(reg.npcs, 'npc', r.affinity, file, where)
    else if ('jobLevel' in r) need(reg.jobs, 'job', r.jobLevel, file, where)
    else if ('flagNum' in r) refs.flagsRead.set(r.flagNum, `${file} ${where}`)
  }

  const walkCond = (c: Cond | undefined, file: string, where: string): void => {
    if (!c) return
    if (typeof c !== 'object') {
      err(file, where, `condition is not an object: ${JSON.stringify(c)}`)
      return
    }
    if ('all' in c) { c.all.forEach(x => { walkCond(x, file, where); }); return; }
    if ('any' in c) { c.any.forEach(x => { walkCond(x, file, where); }); return; }
    if ('not' in c) { walkCond(c.not, file, where); return; }
    if ('flag' in c) {
      refs.flagsRead.set(c.flag, `${file} ${where}`)
      return
    }
    if ('skill' in c) { checkSkill(file, where, c.skill); return; }
    if ('var' in c) {
      refs.varsRead.set(c.var, `${file} ${where}`)
      return
    }
    if ('faction' in c) { need(reg.factions, 'faction', c.faction, file, where); return; }
    if ('n' in c) { walkNum(c.n, file, where); return; }
    if ('npc' in c) { need(reg.npcs, 'npc', c.npc, file, where); return; }
    if ('job' in c) {
      if (c.job === null) return
      for (const j of Array.isArray(c.job) ? c.job : [c.job]) need(reg.jobs, 'job', j, file, where)
      return
    }
    if ('jobLevel' in c) { need(reg.jobs, 'job', c.jobLevel, file, where); return; }
    if ('quest' in c) { need(reg.quests, 'quest', c.quest, file, where); return; }
    if ('item' in c) { need(reg.items, 'item', c.item, file, where); return; }
    if ('housing' in c) {
      for (const h of Array.isArray(c.housing) ? c.housing : [c.housing]) need(reg.housing, 'housing', h, file, where)
      return
    }
    if ('lifestyle' in c) {
      for (const h of Array.isArray(c.lifestyle) ? c.lifestyle : [c.lifestyle]) need(reg.lifestyles, 'lifestyle', h, file, where)
      return
    }
    if ('seen' in c) { need(reg.scenes, 'scene', c.seen, file, where); return; }
    if ('contract' in c) { need(reg.contracts, 'contract', c.contract, file, where); return; }
    if ('mission' in c) { need(reg.missions, 'mission', c.mission, file, where); return; }
    if ('news' in c) { need(reg.news, 'news', c.news, file, where); return; }
    if ('enrolled' in c) {
      if (c.enrolled !== true) need(reg.programs, 'program', c.enrolled, file, where)
      return
    }
    if ('degree' in c) {
      if (c.degree !== true) need(reg.programs, 'program', c.degree, file, where)
      return
    }
    if ('course' in c) { need(reg.courses, 'course', c.course, file, where); return; }
    if ('background' in c) { need(reg.backgrounds, 'background', c.background, file, where); return; }
    if ('trait' in c) { need(reg.traits, 'trait', c.trait, file, where); return; }
    if ('ending' in c) { need(reg.endings, 'ending', c.ending, file, where); return; }
    if ('unlocked' in c) { if (!isFeature(c.unlocked)) err(file, where, `unknown feature "${c.unlocked}"`); return; }
    if ('eventFired' in c) { need(reg.events, 'event', c.eventFired, file, where); return; }
    if ('obligation' in c) { refs.obligationsRead.set(c.obligation, `${file} ${where}`); return; }
    const known = ['always', 'never', 'stat', 'age', 'day', 'hour', 'jobTrack', 'jailed', 'chance']
    if (!known.some(k => k in c)) err(file, where, `unknown condition shape ${JSON.stringify(c)}`)
  }

  const walkText = (t: Text | undefined, file: string, where: string): void => {
    if (t === undefined) return
    const parts = typeof t === 'string' ? [t] : t
    for (const p of parts) {
      const strs = typeof p === 'string' ? [p] : [p.text, p.else ?? '']
      if (typeof p !== 'string') walkCond(p.if, file, where)
      for (const s of strs) {
        for (const m of s.matchAll(/\{(npc|nick):([\w.]+)\}/g)) need(reg.npcs, 'npc', m[2] ?? '', file, `${where} text token`)
        for (const m of s.matchAll(/\{flag:([\w.]+)\}/g)) refs.flagsRead.set(m[1] ?? '', `${file} ${where}`)
      }
    }
  }

  const walkEffects = (list: Effect[] | undefined, file: string, where: string): void => {
    if (!list) return
    if (!Array.isArray(list)) {
      err(file, where, 'effects must be an array')
      return
    }
    for (const e of list) walkEffect(e, file, where)
  }

  const walkEffect = (e: Effect, file: string, where: string): void => {
    if (typeof e !== 'object') {
      err(file, where, `effect is not an object: ${JSON.stringify(e)}`)
      return
    }
    if ('money' in e || 'pause' in e || 'raid' in e || 'dropout' in e || 'jail' in e) return
    if ('stat' in e) return
    if ('xp' in e) { checkSkill(file, where, e.xp); return; }
    if ('flag' in e) {
      refs.flagsSet.set(e.flag, `${file} ${where}`)
      return
    }
    if ('clearFlag' in e) return
    if ('var' in e) {
      refs.varsSet.set(e.var, `${file} ${where}`)
      if (e.var === 'act' && !where.startsWith('trigger:trig_act')) warn(file, where, 'writes `act` outside an act-gate trigger (bible §5)')
      return
    }
    if ('faction' in e) { need(reg.factions, 'faction', e.faction, file, where); return; }
    if ('npc' in e) { need(reg.npcs, 'npc', e.npc, file, where); return; }
    if ('quest' in e) {
      need(reg.quests, 'quest', e.quest, file, where)
      if (e.start || e.stage !== undefined) refs.questsStarted.add(e.quest)
      const q = reg.quests.get(e.quest)
      if (q && e.stage !== undefined && !(e.stage in q.stages)) err(file, where, `quest "${e.quest}" has no stage "${e.stage}"`)
      if (q && e.objective !== undefined) {
        const has = Object.values(q.stages).some(s => s.objectives.some(o => o.id === e.objective))
        if (!has) err(file, where, `quest "${e.quest}" has no objective "${e.objective}"`)
      }
      return
    }
    if ('scene' in e) {
      need(reg.scenes, 'scene', e.scene, file, where)
      refs.scenesDelivered.add(e.scene)
      return
    }
    if ('news' in e) {
      need(reg.news, 'news', e.news, file, where)
      refs.newsPublished.add(e.news)
      return
    }
    if ('item' in e) { need(reg.items, 'item', e.item, file, where); return; }
    if ('job' in e) {
      if (e.job !== null) need(reg.jobs, 'job', e.job, file, where)
      return
    }
    if ('jobXp' in e) { need(reg.jobs, 'job', e.jobXp, file, where); return; }
    if ('housing' in e) { need(reg.housing, 'housing', e.housing, file, where); return; }
    if ('lifestyle' in e) { need(reg.lifestyles, 'lifestyle', e.lifestyle, file, where); return; }
    if ('contract' in e) {
      need(reg.contracts, 'contract', e.contract, file, where)
      refs.contractsOffered.add(e.contract)
      return
    }
    if ('buff' in e) {
      if (!e.buff.id || !e.buff.name) err(file, where, 'buff needs id and name')
      return
    }
    if ('removeBuff' in e) return
    if ('enroll' in e) { need(reg.programs, 'program', e.enroll, file, where); return; }
    if ('degree' in e) { need(reg.programs, 'program', e.degree, file, where); return; }
    if ('course' in e) { need(reg.courses, 'course', e.course, file, where); return; }
    if ('forum' in e) {
      need(reg.forum, 'forum thread', e.forum, file, where)
      refs.forumPosted.add(e.forum)
      return
    }
    if ('ending' in e) {
      need(reg.endings, 'ending', e.ending, file, where)
      refs.endingsReached.add(e.ending)
      return
    }
    if ('notify' in e) { walkText(e.notify, file, where); return; }
    if ('log' in e) { walkText(e.log, file, where); return; }
    if ('chance' in e) {
      walkEffects(e.then, file, where)
      walkEffects(e.else, file, where)
      return
    }
    if ('if' in e) {
      walkCond(e.if, file, where)
      walkEffects(e.then, file, where)
      walkEffects(e.else, file, where)
      return
    }
    if ('random' in e) {
      for (const r of e.random) walkEffects(r.effects, file, where)
      return
    }
    if ('trait' in e) {
      need(reg.traits, 'trait', e.trait, file, where)
      return
    }
    if ('obligation' in e) {
      if (!e.obligation.id || !e.obligation.label) err(file, where, 'obligation needs id and label')
      if (e.obligation.perDay <= 0) err(file, where, 'obligation perDay must be > 0')
      refs.obligationsSet.add(e.obligation.id)
      return
    }
    if ('removeObligation' in e) return
    if ('complication' in e) {
      refs.complicationSources.add(e.complication)
      return
    }
    if ('unlock' in e) {
      for (const id of typeof e.unlock === 'string' ? [e.unlock] : e.unlock) if (!isFeature(id)) err(file, where, `unknown feature "${id}"`)
      return
    }
    if ('event' in e) {
      need(reg.events, 'event', e.event, file, where)
      refs.eventsFiredDirectly.add(e.event)
      return
    }
    err(file, where, `unknown effect shape ${JSON.stringify(e)}`)
  }

  // ── Scenes ────────────────────────────────────────────────────────────────
  const checkScene = (s: SceneDef): void => {
    const file = fileOf('scenes', s.id)
    const w = `scene:${s.id}`
    if (s.from && !reg.npcs.has(s.from) && /^[a-z0-9_]+$/.test(s.from)) {
      err(file, w, `from "${s.from}" looks like an npc id but no such npc exists (use a label with spaces/caps for non-npcs)`)
    }
    if (s.channel === 'forum' && !s.board) warn(file, w, 'forum scene without board (defaults to general)')
    if (!(s.start in s.nodes)) err(file, w, `start node "${s.start}" missing`)
    walkEffects(s.onExpire, file, `${w} onExpire`)
    const reachable = new Set<string>()
    const stack = [s.start]
    const edge = (from: string, to: string | undefined, label: string): void => {
      if (to === undefined) return
      if (!(to in s.nodes)) err(file, `${w} node:${from}`, `${label} → missing node "${to}"`)
      else stack.push(to)
    }
    for (let id = stack.pop(); id !== undefined; id = stack.pop()) {
      if (reachable.has(id)) continue
      reachable.add(id)
      const n = s.nodes[id]
      if (!n) continue
      const nw = `${w} node:${id}`
      walkText(n.text, file, nw)
      walkEffects(n.effects, file, nw)
      if (n.speaker && !['player', 'narrator'].includes(n.speaker) && !reg.npcs.has(n.speaker) && /^[a-z0-9_]+$/.test(n.speaker)) {
        err(file, nw, `speaker "${n.speaker}" looks like an npc id but no such npc exists`)
      }
      edge(id, n.next, 'next')
      if (n.mission) {
        need(reg.missions, 'mission', n.mission.mission, file, nw)
        refs.missionsUsed.add(n.mission.mission)
        checkSkill(file, nw, n.mission.auto.skill)
        edge(id, n.mission.success, 'mission.success')
        edge(id, n.mission.fail, 'mission.fail')
      }
      n.choices?.forEach((c, i) => {
        const cw = `${nw} choice:${i}`
        walkText(c.text, file, cw)
        walkCond(c.if, file, cw)
        walkCond(c.req, file, cw)
        walkEffects(c.effects, file, cw)
        if (c.check) {
          checkSkill(file, cw, c.check.skill)
          for (const b of c.check.bonuses ?? []) walkCond(b.if, file, cw)
          walkEffects(c.check.successEffects, file, cw)
          walkEffects(c.check.failEffects, file, cw)
          edge(id, c.check.success, 'check.success')
          edge(id, c.check.fail, 'check.fail')
          if (c.check.success === c.check.fail) warn(file, cw, 'check success and fail go to the same node')
          if (c.goto) warn(file, cw, 'goto is ignored when check is present')
        } else {
          edge(id, c.goto, 'goto')
        }
      })
    }
    for (const id of Object.keys(s.nodes)) if (!reachable.has(id)) err(file, `${w} node:${id}`, 'unreachable node')
  }
  for (const s of reg.scenes.values()) checkScene(s)

  // ── Quests ────────────────────────────────────────────────────────────────
  for (const q of reg.quests.values()) {
    const file = fileOf('quests', q.id)
    const w = `quest:${q.id}`
    walkText(q.summary, file, w)
    walkCond(q.autoStart, file, `${w} autoStart`)
    if (q.faction) need(reg.factions, 'faction', q.faction, file, w)
    if (q.giver) need(reg.npcs, 'npc', q.giver, file, w)
    if (!(q.start in q.stages)) err(file, w, `start stage "${q.start}" missing`)
    for (const [sid, st] of Object.entries(q.stages)) {
      const sw = `${w} stage:${sid}`
      walkText(st.text, file, sw)
      walkEffects(st.onEnter, file, `${sw} onEnter`)
      walkEffects(st.onComplete, file, `${sw} onComplete`)
      walkEffects(st.onTimeout?.effects, file, `${sw} onTimeout`)
      if (st.onTimeout?.stage !== undefined && !(st.onTimeout.stage in q.stages)) err(file, sw, `onTimeout stage "${st.onTimeout.stage}" missing`)
      if (st.onTimeout && st.timeLimitDays === undefined) warn(file, sw, 'onTimeout without timeLimitDays')
      if (typeof st.next === 'string') {
        if (!(st.next in q.stages)) err(file, sw, `next stage "${st.next}" missing`)
      } else if (st.next) {
        for (const b of st.next) {
          walkCond(b.if, file, sw)
          if (!(b.stage in q.stages)) err(file, sw, `branch stage "${b.stage}" missing`)
        }
      }
      const ids = new Set<string>()
      for (const o of st.objectives) {
        const ow = `${sw} obj:${o.id}`
        if (ids.has(o.id)) err(file, ow, 'duplicate objective id in stage')
        ids.add(o.id)
        walkText(o.text, file, ow)
        walkCond(o.when, file, ow)
        if (o.progress) walkNum(o.progress.of, file, ow)
        if (!o.hidden && o.hint === undefined && st.hint === undefined) err(file, ow, 'objective has no hint (bible §12.9: every objective carries a hint)')
      }
      if (st.objectives.length === 0) warn(file, sw, 'stage has no objectives (completes instantly)')
    }
  }

  // ── Triggers ──────────────────────────────────────────────────────────────
  for (const t of reg.triggers) {
    const file = reg.origin.get(`triggers:${t.id}`) ?? '?'
    const w = `trigger:${t.id}`
    walkCond(t.when, file, w)
    walkEffects(t.effects, file, w)
    if (t.once === false && t.cooldownDays === undefined && t.chance === undefined) {
      warn(file, w, 'repeatable trigger without cooldownDays or chance will fire every hour')
    }
  }

  // ── Other defs ────────────────────────────────────────────────────────────
  for (const n of reg.news.values()) {
    const file = fileOf('news', n.id)
    walkCond(n.ambient, file, `news:${n.id}`)
    walkText(n.body, file, `news:${n.id}`)
    walkEffects(n.effects, file, `news:${n.id}`)
  }
  for (const f of reg.forum.values()) {
    const file = fileOf('forum', f.id)
    walkCond(f.appears, file, `forum:${f.id}`)
    for (const p of f.posts) walkText(p.text, file, `forum:${f.id}`)
  }
  for (const e of reg.endings.values()) {
    const file = fileOf('endings', e.id)
    walkText(e.text, file, `ending:${e.id}`)
    for (const ep of e.epilogues) {
      walkCond(ep.if, file, `ending:${e.id} epilogue`)
      walkText(ep.text, file, `ending:${e.id} epilogue`)
    }
  }
  for (const j of reg.jobs.values()) {
    const file = fileOf('jobs', j.id)
    walkCond(j.req, file, `job:${j.id}`)
    walkCond(j.visible, file, `job:${j.id}`)
    for (const s of Object.keys(j.skillXp)) checkSkill(file, `job:${j.id}`, s)
    if (j.hours < 1 || j.hours > 16) err(file, `job:${j.id}`, `odd shift length ${j.hours}`)
    if (j.shiftStart < 0 || j.shiftStart > 23) err(file, `job:${j.id}`, `shiftStart out of range`)
  }
  for (const p of reg.programs.values()) {
    const file = fileOf('programs', p.id)
    walkCond(p.req, file, `program:${p.id}`)
    walkEffects(p.onGraduate, file, `program:${p.id}`)
  }
  for (const c of reg.courses.values()) {
    const file = fileOf('courses', c.id)
    walkCond(c.req, file, `course:${c.id}`)
    walkEffects(c.onComplete, file, `course:${c.id}`)
  }
  for (const i of reg.items.values()) {
    const file = fileOf('items', i.id)
    walkCond(i.available, file, `item:${i.id}`)
    walkCond(i.req, file, `item:${i.id}`)
  }
  for (const h of reg.housing.values()) {
    const file = fileOf('housing', h.id)
    walkCond(h.req, file, `housing:${h.id}`)
    walkCond(h.available, file, `housing:${h.id}`)
  }
  for (const b of reg.backgrounds.values()) for (const f of b.flags ?? []) refs.flagsSet.set(f, `background:${b.id}`)
  for (const t of reg.traits.values()) for (const f of t.flags ?? []) refs.flagsSet.set(f, `trait:${t.id}`)
  for (const c of reg.contracts.values()) {
    const file = fileOf('contracts', c.id)
    walkEffects(c.onSuccess, file, `contract:${c.id}`)
    walkEffects(c.onFail, file, `contract:${c.id}`)
    for (const s of c.skills) checkSkill(file, `contract:${c.id}`, s)
    for (const f of Object.keys(c.rep ?? {})) need(reg.factions, 'faction', f, file, `contract:${c.id}`)
    if (c.mission) {
      need(reg.missions, 'mission', c.mission, file, `contract:${c.id}`)
      refs.missionsUsed.add(c.mission)
    }
  }
  for (const t of reg.contractTemplates.values()) {
    const file = fileOf('contractTemplates', t.id)
    const w = `template:${t.id}`
    walkCond(t.available, file, w)
    for (const s of t.skills) checkSkill(file, w, s)
    for (const [k, r] of [['dc', t.dc], ['hours', t.hours], ['pay', t.pay], ['heat', t.heat], ['cred', t.cred]] as const) {
      if (r[0] > r[1]) err(file, w, `${k} range reversed`)
    }
    if (t.titles.length === 0 || t.descs.length === 0 || t.clients.length === 0) err(file, w, 'needs titles, descs and clients')
  }
  for (const m of reg.missions.values()) {
    const file = fileOf('missions', m.id)
    const w = `mission:${m.id}`
    const hosts = new Map(m.hosts.map(h => [h.id, h]))
    for (const k of m.known) if (!hosts.has(k)) err(file, w, `known host "${k}" missing`)
    for (const h of m.hosts) for (const l of h.links ?? []) if (!hosts.has(l)) err(file, w, `host ${h.id} links to missing "${l}"`)
    for (const g of m.goals) {
      const h = hosts.get(g.host)
      if (!h) {
        err(file, w, `goal host "${g.host}" missing`)
        continue
      }
      if ((g.kind === 'download' || g.kind === 'delete' || g.kind === 'read') && !h.files.some(f => f.name === g.file)) {
        err(file, w, `goal file "${g.file}" not on host ${g.host}`)
      }
      if (g.kind === 'upload' && !(m.payloads ?? []).some(f => f.name === g.file)) err(file, w, `upload payload "${g.file}" missing`)
    }
  }
  for (const n of reg.npcs.values()) {
    if (n.faction) need(reg.factions, 'faction', n.faction, fileOf('npcs', n.id), `npc:${n.id}`)
    walkText(n.bio, fileOf('npcs', n.id), `npc:${n.id}`)
  }
  for (const f of reg.factions.values()) walkCond(f.revealWhen, fileOf('factions', f.id), `faction:${f.id}`)

  // ── Events & complications ────────────────────────────────────────────────
  for (const ev of reg.events.values()) {
    const file = fileOf('events', ev.id)
    const w = `event:${ev.id}`
    walkCond(ev.when, file, w)
    walkEffects(ev.effects, file, w)
    if (ev.scene) {
      need(reg.scenes, 'scene', ev.scene, file, w)
      refs.scenesDelivered.add(ev.scene)
    }
    if (!ev.scene && !ev.effects?.length) err(file, w, 'event has neither scene nor effects')
    const c = ev.complication
    if (c) {
      if (c.sources.length === 0) err(file, w, 'complication needs at least one source')
      if ((c.minTier ?? 1) > (c.maxTier ?? 5)) err(file, w, 'complication minTier > maxTier')
    }
  }

  // ── Global reachability ───────────────────────────────────────────────────
  for (const [flag, where] of refs.flagsRead) {
    if (ENGINE_FLAG_PREFIXES.some(p => flag.startsWith(p))) continue
    if (!refs.flagsSet.has(flag)) err(where.split(' ')[0] ?? '?', where, `flag "${flag}" is read but never set`)
  }
  for (const [v, where] of refs.varsRead) {
    if (ENGINE_VARS.has(v) || ENGINE_VAR_PREFIXES.some(p => v.startsWith(p))) continue
    if (!refs.varsSet.has(v)) err(where.split(' ')[0] ?? '?', where, `var "${v}" is read but never set`)
  }
  for (const s of reg.scenes.values()) {
    if (!refs.scenesDelivered.has(s.id)) err(fileOf('scenes', s.id), `scene:${s.id}`, 'scene is never delivered by any effect')
  }
  for (const q of reg.quests.values()) {
    if (!q.autoStart && !refs.questsStarted.has(q.id)) err(fileOf('quests', q.id), `quest:${q.id}`, 'quest never starts (no autoStart and no start effect)')
  }
  for (const e of reg.endings.values()) {
    if (!refs.endingsReached.has(e.id)) err(fileOf('endings', e.id), `ending:${e.id}`, 'ending is never reached by any effect')
  }
  for (const m of reg.missions.values()) {
    if (!refs.missionsUsed.has(m.id)) warn(fileOf('missions', m.id), `mission:${m.id}`, 'mission not referenced by any scene or contract')
  }
  for (const c of reg.contracts.values()) {
    if (!refs.contractsOffered.has(c.id)) err(fileOf('contracts', c.id), `contract:${c.id}`, 'story contract is never offered')
  }
  for (const n of reg.news.values()) {
    if (!n.ambient && !refs.newsPublished.has(n.id)) err(fileOf('news', n.id), `news:${n.id}`, 'non-ambient news is never published')
  }
  for (const f of reg.forum.values()) {
    if (!f.appears && !refs.forumPosted.has(f.id)) err(fileOf('forum', f.id), `forum:${f.id}`, 'forum thread never appears')
  }
  // The engine itself spawns 'hack' (traced ops) and 'gig' (failed gigs) complications.
  const spawnable = new Set(['hack', 'gig', 'any', ...refs.complicationSources])
  for (const ev of reg.events.values()) {
    const c = ev.complication
    if (!c || refs.eventsFiredDirectly.has(ev.id)) continue
    const reachable = c.sources.includes('any') || c.sources.some(src => spawnable.has(src))
    if (!reachable) err(fileOf('events', ev.id), `event:${ev.id}`, `complication sources [${c.sources.join(', ')}] are never spawned (no { complication } effect uses them)`)
  }
  for (const [id, where] of refs.obligationsRead) {
    if (!refs.obligationsSet.has(id)) err(where.split(' ')[0] ?? '?', where, `obligation "${id}" is read but never created`)
  }
  return problems
}

export function formatProblems(problems: Problem[], filter?: string): string {
  const shown = filter ? problems.filter(p => p.file.includes(filter) || p.where.includes(filter)) : problems
  const byFile = new Map<string, Problem[]>()
  for (const p of shown) {
    const list = byFile.get(p.file) ?? []
    list.push(p)
    byFile.set(p.file, list)
  }
  const lines: string[] = []
  for (const [file, list] of [...byFile].sort((a, b) => a[0].localeCompare(b[0]))) {
    lines.push(`\n${file}`)
    for (const p of list) lines.push(`  ${p.severity === 'error' ? 'ERROR' : 'warn '} ${p.where}: ${p.msg}`)
  }
  const errors = shown.filter(p => p.severity === 'error').length
  lines.push(`\n${errors} error(s), ${shown.length - errors} warning(s)${filter ? ` (filter: ${filter})` : ''}`)
  return lines.join('\n')
}
