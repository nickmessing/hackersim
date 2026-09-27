/**
 * PKG-14 — the shared "enclosure" beat routed here from PKG-13.
 *
 * Bible §8.33 / §13: `side_bbs_that_wouldnt_die` (PKG-13) lets the player *harvest* a dead sysop's
 * user list. PKG-13 does NOT own `w.enclosure`; instead it sets the flag `side.bbs_harvested`, and
 * this package — the owner of the darkness dial — turns that harvest into complicity here, with a
 * short authored aftermath so the +1 is felt, not silent.
 *
 * Contract with PKG-13: when the player harvests the board, `side_bbs_that_wouldnt_die` sets
 * `{ flag: 'side.bbs_harvested' }`. (Listed as a cross-package dependency in the package report.)
 *
 * Sets: adds to the shared counter `w.enclosure`; delivers `bbs_harvest_aftermath`.
 * Reads (cross-package): `side.bbs_harvested` (PKG-13).
 */
import { defineContent } from '@/engine/registry'
import type { SceneDef, TriggerDef } from '@/engine/types'

const trigger: TriggerDef = {
  id: 'trig_bbs_harvest_enclosure',
  once: true,
  when: { flag: 'side.bbs_harvested' },
  effects: [
    { var: 'w.enclosure', add: 1 },
    { scene: 'bbs_harvest_aftermath' },
  ],
}

const scene: SceneDef = {
  id: 'bbs_harvest_aftermath',
  channel: 'mail',
  title: 'RE: that old board',
  pause: false,
  start: 'body',
  nodes: {
    body: {
      speaker: 'narrator',
      text: [
        'The board ran for twenty years after its sysop died, on a forgotten line, on inertia and love. You pulled the user list off it — every handle, every last-login, every private message that dead man\'s machine kept faithfully filing because nobody told it to stop.',
        'Alone it\'s a curiosity: a census of ghosts, teenagers who are grandparents now, handles nobody has typed since the millennium. But a handle is only anonymous until you put it next to one more list, and then it\'s a name, and a name is a product. You know exactly who pays for lists like this now. You know their address block by heart.',
        'You tell yourself you\'re preserving history. History doesn\'t phone home at 3:12 a.m. What you have is inventory, and some part of you already knows you kept it because it was worth something to the people you say you hate.',
      ],
    },
  },
}

export default defineContent({
  triggers: [trigger],
  scenes: [scene],
})
