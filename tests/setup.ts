// Tests and balance bots need reproducible runs; the game itself uses real randomness.
import { setSeededRandom } from '../src/engine/rng'

setSeededRandom(true)
