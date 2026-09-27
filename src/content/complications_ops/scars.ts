/**
 * COMPLICATION PACK — scars.
 *
 * Permanent traits earned by bad (and occasionally not-so-bad) outcomes in this pack's sub-stories.
 * All are `scar: true`; `bad: true` ones show in red. A few are double-edged or outright positive
 * (you survived something and learned from it). Trait `flags` expose a readable `cx_ops.*` flag so
 * later scenes in this pack can react to who you've become.
 *
 * Names are distinct from the similar marks other packs hand out ("Known to Police", "Street Smart",
 * "Paranoid Sleeper", "Burned Bridge"), and grants go through `scar()` in _shared.ts, which refuses
 * a mark when its sibling is already held, so the mods never stack.
 */
import { defineContent } from '@/engine/registry'
import type { TraitDef } from '@/engine/types'

const traits: TraitDef[] = [
  {
    id: 'cx_ops_scar_known_to_police',
    name: 'Precinct Regular',
    desc: 'Your name sits in a folder in a cold building. Heat clings to you longer than it should.',
    scar: true,
    bad: true,
    mods: [{ key: 'heat.decay', add: -0.2 }],
    flags: ['cx_ops.known_to_police'],
  },
  {
    id: 'cx_ops_scar_on_probation',
    name: 'On Paper',
    desc: 'You are in the system now — a name, a number, a monthly check-in. Trouble finds you faster and lawyers cost money.',
    scar: true,
    bad: true,
    mods: [
      { key: 'heat.decay', add: -0.15 },
      { key: 'expenses', mult: 1.03 },
    ],
    flags: ['cx_ops.on_probation'],
  },
  {
    id: 'cx_ops_scar_marked_handle',
    name: 'Marked Handle',
    desc: 'Someone tied your alias to a real trail and told the wrong people. The scene still trusts you a little less, and traces come a little quicker.',
    scar: true,
    bad: true,
    mods: [
      { key: 'cred.gain', mult: 0.9 },
      { key: 'trace', mult: 0.9 },
    ],
    flags: ['cx_ops.marked_handle'],
  },
  {
    id: 'cx_ops_scar_burned_bridge',
    name: 'Stiffed a Talker',
    desc: 'You stiffed someone who talks, and they talked. A few doors that used to be open are just walls now.',
    scar: true,
    bad: true,
    mods: [
      { key: 'check.social', add: -1 },
      { key: 'cred.gain', mult: 0.95 },
    ],
    flags: ['cx_ops.burned_bridge'],
  },
  {
    id: 'cx_ops_scar_botched_rep',
    name: 'Botched-Job Rep',
    desc: 'Word got around about a job that went sideways. Clients haggle harder and tip lower.',
    scar: true,
    bad: true,
    mods: [{ key: 'freelance.pay', mult: 0.9 }],
    flags: ['cx_ops.botched_rep'],
  },
  {
    id: 'cx_ops_scar_carpal_tunnel',
    name: 'Carpal Tunnel',
    desc: 'Twenty years of bad posture arrived early. Your hands ache at the keyboard and the long sessions cost you.',
    scar: true,
    bad: true,
    mods: [
      { key: 'hack.speed', mult: 0.92 },
      { key: 'freelance.speed', mult: 0.92 },
      { key: 'health.daily', add: -0.02 },
    ],
    flags: ['cx_ops.carpal_tunnel'],
  },
  {
    id: 'cx_ops_scar_paranoid_sleeper',
    name: 'Modem-Light Vigil',
    desc: 'You sleep with one eye on the modem lights now. You rest worse — but nothing sneaks up on you either.',
    scar: true,
    mods: [
      { key: 'energy.regen', mult: 0.95 },
      { key: 'heat.decay', add: 0.12 },
    ],
    flags: ['cx_ops.paranoid_sleeper'],
  },
  {
    id: 'cx_ops_scar_gun_shy',
    name: 'Gun-Shy',
    desc: 'A close call taught you to slow down and cover your tracks twice. Quieter work, slower work.',
    scar: true,
    mods: [
      { key: 'hack.heat', mult: 0.88 },
      { key: 'hack.speed', mult: 0.94 },
    ],
    flags: ['cx_ops.gun_shy'],
  },
  {
    id: 'cx_ops_scar_street_smart',
    name: 'Trace-Wise',
    desc: "You learned the hard way exactly how the game gets watched — so now you watch back. You read a room and read a trace better than you used to.",
    scar: true,
    mods: [
      { key: 'check.social', add: 1 },
      { key: 'heat.decay', add: 0.1 },
    ],
    flags: ['cx_ops.street_smart'],
  },
  {
    id: 'cx_ops_scar_thick_skin',
    name: 'Thick Skin',
    desc: "You've been screamed at by professionals and lived. Very little rattles you at the keyboard anymore.",
    scar: true,
    mods: [{ key: 'stress.gain', mult: 0.93 }],
    flags: ['cx_ops.thick_skin'],
  },
  {
    id: 'cx_ops_scar_criminal_record',
    name: 'Criminal Record',
    desc: 'There is a line on a background check now. Interviews go quiet when it comes up, and the police remember the name.',
    scar: true,
    bad: true,
    mods: [
      { key: 'pay', mult: 0.95 },
      { key: 'heat.decay', add: -0.1 },
    ],
    flags: ['cx_ops.criminal_record'],
  },
  {
    id: 'cx_ops_scar_on_a_list',
    name: 'On a List',
    desc: 'A federal file with your name on the tab. Nobody is kicking your door in. Everybody is paying attention.',
    scar: true,
    bad: true,
    mods: [
      { key: 'trace', mult: 0.9 },
      { key: 'heat.decay', add: -0.1 },
    ],
    flags: ['cx_ops.on_a_list'],
  },
  {
    id: 'cx_ops_scar_hard_bargainer',
    name: 'Hard Bargainer',
    desc: 'You stood in front of a judge with a stack of invoices and won. Clients sense it. You name a price and you mean it.',
    scar: true,
    mods: [
      { key: 'check.business', add: 1 },
      { key: 'freelance.pay', mult: 1.04 },
    ],
    flags: ['cx_ops.hard_bargainer'],
  },
  {
    id: 'cx_ops_scar_courtroom_composure',
    name: 'Courtroom Composure',
    desc: 'You have sat in the hard chair with the fluorescent hum and kept your voice level. Most rooms feel smaller now.',
    scar: true,
    mods: [
      { key: 'check.social', add: 1 },
      { key: 'stress.gain', mult: 0.97 },
    ],
    flags: ['cx_ops.courtroom_composure'],
  },
  {
    id: 'cx_ops_scar_mom_worries',
    name: 'Mom Worries',
    desc: 'She knows. She waits up now, and she counts the hours the modem light is on. You come home earlier, and you feel it.',
    scar: true,
    mods: [
      { key: 'mood.daily', add: -0.05 },
      { key: 'heat.decay', add: 0.05 },
    ],
    flags: ['cx_ops.mom_worries'],
  },
]

export default defineContent({ traits })
