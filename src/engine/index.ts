/**
 * Public engine API. The UI should import from here (or from specific modules for helpers).
 * All functions take the (reactive) GameState as the first argument and mutate it.
 */
export * from './types'
export * as balance from './balance'
export { C, defineContent } from './registry'
export { createState, hydrate, npcState, defaultSchedule, START_HOUSING, START_LIFESTYLE } from './state'
export type { NewGameOptions } from './state'
export { evalCond, describeCond, numRef } from './conditions'
export { applyEffects, applyEffect, addMoney } from './effects'
export { renderText, renderLine, interpolate, onToast, log, notify } from './text'
export { formatDate, formatWeek, formatShortDate, formatClock, ageOn, dayOf, dateOf, yearOf } from './calendar'
export { money, signed, pct, clamp, hoursLabel } from './format'
export { modOf, modMult, modAdd, modSources } from './mods'
export {
  tick,
  simulateHour,
  simulateHours,
  pause,
  resume,
  setSpeed,
  maxSpeed,
  currentActivity,
  efficiency,
  bootstrap,
  touchNpc,
} from './time'
export {
  deliverScene,
  choicesFor,
  choose,
  advance,
  finishThread,
  markRead,
  missionResult,
  missionAuto,
  activeDialog,
  sceneOf,
  nodeOf,
  findThread,
  isTerminal,
  previewCheck,
  rollCheck,
  checkMod,
  chanceOf,
  publishNews,
  postForum,
  reachEnding,
} from './story'
export type { ChoiceView, CheckPreview, ChooseResult } from './story'
export { startQuest, checkQuests, daysLeft, hasTimedQuest, objectiveDone } from './quests'
export { setJob, canTakeJob, dailyPay, jobProgress, jobLevelProgress } from './sim/jobs'
export { setSlot, applyPreset, PRESETS, jobHours, classHours, countSlots } from './sim/schedule'
export { enroll, dropout, buyCourse } from './sim/education'
export type { EnrollResult } from './sim/education'
export {
  expenseBreakdown,
  dailyExpenses,
  moveHousing,
  setLifestyle,
  buyItem,
  canBuy,
  itemPrice,
} from './sim/life'
export type { ExpenseLine } from './sim/life'
export {
  acceptContract,
  abandonContract,
  resolveContract,
  refreshBoard,
  successChance,
  workSpeed,
  effectiveHours,
  canAccept,
  hackTier,
  freelanceTier,
} from './sim/contracts'
export type { ContractResult } from './sim/contracts'
export { gainHeat, raidChance, dailyHeatDecay } from './sim/heat'
export { addSkillXp, skillProgress, avgSkill } from './sim/skills'
export {
  saveGame,
  loadGame,
  listSaves,
  deleteSave,
  exportSave,
  importSave,
  serialize,
  deserialize,
  SLOTS,
} from './save'
export type { SaveSlot, SaveMeta } from './save'
export { fireEvent, triggerComplication, directorTick, directorChance } from './events'

// ── Ops engine (REDESIGN_V2 §A/§B): terminal ops + gig queue ──────────────────
export {
  completeOp,
  scriptOp,
  scriptChance,
  opMission,
  prepPerks,
  moveContract,
  offerStoryContract,
  practiceHour,
  workHour,
  dailyContracts,
} from './sim/contracts'
export {
  generateMission,
  missionProblems,
  tierFromDc,
  portDifficultyFor,
  traceSecondsFor,
  OP_NETWORKS,
  OP_GOALS,
  CHAIN_BY_TIER,
} from './sim/missiongen'
export type { GenOptions } from './sim/missiongen'
export { FEATURES, isUnlocked, unlock, unlockAll, featureLabel } from './unlocks'
export type { Feature } from './unlocks'
