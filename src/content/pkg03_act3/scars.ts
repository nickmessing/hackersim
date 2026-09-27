/**
 * PKG-03 — Act III scars (REDESIGN_V2 §C/§D): permanent traits earned on the fail branches of the
 * Act III main beats. Each is a `TraitDef` with `scar: true` (never offered at character creation),
 * `bad: true` where it is mostly a wound. A few are double-edged, because surviving a bad night
 * teaches you something even when it costs you.
 *
 * Ids are prefixed with the package dir so parallel writers never collide.
 */
import { defineContent } from '@/engine/registry'

export default defineContent({
  traits: [
    {
      id: 'pkg03_act3_on_the_tape',
      name: 'On the Tape',
      desc: 'Somewhere in a federal evidence locker there is an hour of you talking freely, and a transcript with your handle in the margins. Heat cools slower; every stranger who asks a friendly question sounds like a wire.',
      scar: true,
      bad: true,
      mods: [
        { key: 'heat.decay', add: -0.08 },
        { key: 'stress.gain', mult: 1.05 },
      ],
    },
    {
      id: 'pkg03_act3_parallax_scored',
      name: 'Scored by PARALLAX',
      desc: 'You tripped the machine on the way to its list, and it wrote you onto one of its own. Insurers, landlords and lenders now see a risk score with your name on it. Everything costs a little more.',
      scar: true,
      bad: true,
      mods: [{ key: 'expenses', mult: 1.06 }],
    },
    {
      id: 'pkg03_act3_checks_the_street',
      name: 'Checks the Street',
      desc: 'Since the black sedan outside Kim\'s school, you look out the window before you open the door. Every time. It keeps you a little safer and a lot more tired.',
      scar: true,
      mods: [
        { key: 'heat.decay', add: 0.05 },
        { key: 'stress.gain', mult: 1.06 },
      ],
    },
    {
      id: 'pkg03_act3_holds_a_grudge',
      name: 'Holds a Grudge',
      desc: 'Someone dragged your mother\'s name through the mud to get to you, and you went looking for them. You are sharper for it, and you sleep worse.',
      scar: true,
      mods: [
        { key: 'check.intrusion', add: 1 },
        { key: 'mood.daily', add: -0.2 },
      ],
    },
    {
      id: 'pkg03_act3_krolls_file',
      name: 'In Kroll\'s File',
      desc: 'Aperture\'s people photographed you walking out of Priya\'s building with a folder under your arm. Special Accounts keeps a file on you now, with pictures. They like to let you know it exists.',
      scar: true,
      bad: true,
      mods: [
        { key: 'heat.decay', add: -0.06 },
        { key: 'check.opsec', add: -1 },
      ],
    },
    {
      id: 'pkg03_act3_burned',
      name: 'Burned',
      desc: 'The Meridian job came apart with your fingerprints on it. Whoever pulled you out, you walked away owing, and the city\'s cameras know the shape of your walk. Heat never quite goes all the way down.',
      scar: true,
      bad: true,
      mods: [
        { key: 'heat.decay', add: -0.1 },
        { key: 'cred.gain', mult: 0.85 },
      ],
    },
    {
      id: 'pkg03_act3_owned',
      name: 'Owned',
      desc: 'Kroll made the Meridian mess disappear, and now there is a warm voice that calls when it wants something. Aperture keeps the heat off you. It also keeps the leash.',
      scar: true,
      bad: true,
      mods: [
        { key: 'heat.decay', add: 0.15 },
        { key: 'cred.gain', mult: 0.8 },
        { key: 'mood.daily', add: -0.2 },
      ],
    },
    {
      id: 'pkg03_act3_ghost_habits',
      name: 'Ghost Habits',
      desc: 'You went to ground alone after Meridian, and you learned to live like weather: cash, no routines, a different café every morning. It keeps you hard to find. It keeps everyone else at arm\'s length too.',
      scar: true,
      mods: [
        { key: 'heat.decay', add: 0.12 },
        { key: 'check.social', add: -1 },
      ],
    },
  ],
})
