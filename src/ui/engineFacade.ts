/** Re-exports used by the session module (keeps game.ts imports tidy). */
export {
  bootstrap,
  createState,
  importSave,
  loadGame,
  saveGame,
  tick,
} from '@/engine'
export { AUTOSAVE_REAL_SECONDS as AUTOSAVE_SECONDS } from '@/engine/balance'
