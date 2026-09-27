import { evalCond } from './conditions'
import { clamp } from './format'
import { C } from './registry'
import { rand, weighted } from './rng'
import { grantItemRaw, npcState } from './state'
import { log, notify, renderLine } from './text'
import type { Effect, GameState } from './types'
import { addSkillXp } from './sim/skills'
import { setJob, addJobXp } from './sim/jobs'
import { raid, sendToJail } from './sim/heat'
import { offerStoryContract } from './sim/contracts'
import { enroll, dropout, grantDegree, completeCourse } from './sim/education'
import { deliverScene, publishNews, postForum, reachEnding } from './story'
import { questEffect } from './quests'
import { moveHousing, setLifestyle } from './sim/life'
import { pause } from './time'
import { fireEvent, triggerComplication } from './events'
import { CONTACTS_UNLOCK_MET, unlock } from './unlocks'

const BOUNDED = new Set(['health', 'energy', 'stress', 'mood', 'heat', 'cred'])

export function addMoney(state: GameState, amount: number): void {
  state.stats.money += amount
  if (amount > 0) state.totals.earned += amount
  else state.totals.spent -= amount
}

export function addStat(state: GameState, stat: keyof GameState['stats'], amount: number): void {
  if (stat === 'money') {
    addMoney(state, amount)
    return
  }
  state.stats[stat] = BOUNDED.has(stat) ? clamp(state.stats[stat] + amount, 0, 100) : state.stats[stat] + amount
}

export function applyEffects(state: GameState, effects: Effect[] | undefined): void {
  if (!effects) return
  for (const e of effects) applyEffect(state, e)
}

export function applyEffect(state: GameState, e: Effect): void {
  if ('money' in e) {
    addMoney(state, e.money)
    return
  }
  if ('stat' in e) {
    if (e.set !== undefined) state.stats[e.stat] = BOUNDED.has(e.stat) ? clamp(e.set, 0, 100) : e.set
    if (e.add !== undefined) addStat(state, e.stat, e.add)
    return
  }
  if ('xp' in e) {
    addSkillXp(state, e.xp, e.add)
    return
  }
  if ('flag' in e) {
    state.flags[e.flag] = e.set ?? true
    return
  }
  if ('clearFlag' in e) {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete state.flags[e.clearFlag]
    return
  }
  if ('var' in e) {
    const cur = state.vars[e.var] ?? 0
    let v = e.set ?? cur
    if (e.add !== undefined) v += e.add
    state.vars[e.var] = v
    return
  }
  if ('faction' in e) {
    const cur = state.factions[e.faction] ?? 0
    state.factions[e.faction] = clamp(cur + e.add, -100, 100)
    const f = C.factions.get(e.faction)
    if (f && e.add !== 0) log(state, `${f.name} reputation ${e.add > 0 ? '+' : ''}${e.add}`, e.add > 0 ? 'good' : 'bad')
    return
  }
  if ('npc' in e) {
    const s = npcState(state, e.npc)
    if (e.met !== undefined) {
      s.met = e.met
      if (e.met && Object.values(state.npcs).filter(n => n.met).length >= CONTACTS_UNLOCK_MET) unlock(state, 'contacts')
    }
    if (e.affinity !== undefined) s.affinity = clamp(s.affinity + e.affinity, -100, 100)
    if (e.fate !== undefined) s.fate = e.fate
    if (e.romance !== undefined) s.romance = e.romance
    return
  }
  if ('quest' in e) {
    questEffect(state, e)
    return
  }
  if ('scene' in e) {
    deliverScene(state, e.scene, e.delayHours)
    return
  }
  if ('news' in e) {
    publishNews(state, e.news)
    return
  }
  if ('item' in e) {
    if (e.remove) {
      state.items = state.items.filter(i => i !== e.item)
      for (const [slot, id] of Object.entries(state.equipped)) {
        if (id === e.item) {
          // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
          delete state.equipped[slot as keyof typeof state.equipped]
        }
      }
    } else {
      grantItemRaw(state, e.item)
      const def = C.items.get(e.item)
      if (def) log(state, `Got: ${def.name}`, 'good')
    }
    return
  }
  if ('job' in e) {
    setJob(state, e.job, true)
    return
  }
  if ('jobXp' in e) {
    addJobXp(state, e.jobXp, e.add)
    return
  }
  if ('housing' in e) {
    moveHousing(state, e.housing, true)
    return
  }
  if ('lifestyle' in e) {
    setLifestyle(state, e.lifestyle)
    return
  }
  if ('contract' in e) {
    offerStoryContract(state, e.contract, e.direct === true)
    return
  }
  if ('buff' in e) {
    state.buffs = state.buffs.filter(b => b.id !== e.buff.id)
    state.buffs.push({ ...e.buff, untilDay: state.time.day + e.buff.days })
    log(state, `${e.buff.bad ? 'Debuff' : 'Buff'}: ${e.buff.name} (${e.buff.days}d)`, e.buff.bad ? 'bad' : 'good')
    return
  }
  if ('removeBuff' in e) {
    state.buffs = state.buffs.filter(b => b.id !== e.removeBuff)
    return
  }
  if ('jail' in e) {
    sendToJail(state, e.jail)
    return
  }
  if ('raid' in e) {
    raid(state)
    return
  }
  if ('enroll' in e) {
    enroll(state, e.enroll, true)
    return
  }
  if ('dropout' in e) {
    dropout(state)
    return
  }
  if ('degree' in e) {
    grantDegree(state, e.degree)
    return
  }
  if ('course' in e) {
    completeCourse(state, e.course)
    return
  }
  if ('forum' in e) {
    postForum(state, e.forum)
    return
  }
  if ('ending' in e) {
    reachEnding(state, e.ending)
    return
  }
  if ('notify' in e) {
    notify(state, renderLine(state, e.notify), e.kind ?? 'info')
    return
  }
  if ('log' in e) {
    log(state, renderLine(state, e.log), e.kind ?? 'info')
    return
  }
  if ('chance' in e) {
    applyEffects(state, rand(state) < e.chance ? e.then : e.else)
    return
  }
  if ('if' in e) {
    applyEffects(state, evalCond(state, e.if) ? e.then : e.else)
    return
  }
  if ('random' in e) {
    const pickEntry = weighted(state, e.random, r => r.weight)
    if (pickEntry) applyEffects(state, pickEntry.effects)
    return
  }
  if ('trait' in e) {
    const has = state.player.traits.includes(e.trait)
    const def = C.traits.get(e.trait)
    if (e.remove) {
      if (has) {
        state.player.traits = state.player.traits.filter(t => t !== e.trait)
        notify(state, `No longer: ${def?.name ?? e.trait}`, 'good')
      }
    } else if (!has) {
      state.player.traits.push(e.trait)
      for (const f of def?.flags ?? []) state.flags[f] = true
      notify(state, `${def?.scar ? 'Scar' : 'Trait'} gained: ${def?.name ?? e.trait}`, def?.bad ? 'bad' : 'story')
    }
    return
  }
  if ('obligation' in e) {
    const o = e.obligation
    state.obligations = state.obligations.filter(x => x.id !== o.id)
    state.obligations.push({ id: o.id, label: o.label, perDay: o.perDay, untilDay: o.days !== undefined ? state.time.day + o.days : null })
    notify(state, `New obligation: ${o.label} ($${o.perDay}/day${o.days !== undefined ? ` for ${o.days} days` : ''})`, 'bad')
    return
  }
  if ('removeObligation' in e) {
    const before = state.obligations.length
    state.obligations = state.obligations.filter(x => x.id !== e.removeObligation)
    if (state.obligations.length < before) notify(state, 'An obligation is settled.', 'good')
    return
  }
  if ('complication' in e) {
    triggerComplication(state, e.complication, e.tier)
    return
  }
  if ('event' in e) {
    fireEvent(state, e.event)
    return
  }
  if ('unlock' in e) {
    unlock(state, e.unlock)
    return
  }
  // 'pause'
  pause(state)
}

