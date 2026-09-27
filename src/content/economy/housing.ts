import { dayOf } from '@/engine/calendar'
import { defineContent } from '@/engine/registry'

/**
 * ECON — Housing. `comfort` scales sleep energy regen (0.85–1.35); `rentPerDay` is a daily
 * expense (scaled by the world `w.rent` multiplier); owned homes cost a lump `moveCost` and
 * have no rent. The engine requires the id `parents_flat` (START_HOUSING). The dorm is gated on
 * university enrolment. Nicer places quiet the mind a little (small stress relief / heat decay).
 */
export default defineContent({
  housing: [
    {
      id: 'parents_flat',
      name: "Parents' Flat",
      desc: 'Your childhood room in the Flats, unchanged since middle school. Free, warm, and full of a mother who picks up the kitchen phone the second you connect. Family is close — which is comfort, and also exposure.',
      rentPerDay: 0,
      moveCost: 0,
      comfort: 1.0,
      mods: [],
    },
    {
      id: 'dorm_room',
      name: 'LSU Dorm Room',
      desc: 'A cinderblock double on the Hill with a bunk, a shared bathroom down the hall, and a roommate who games until 4 a.m. Cheap, loud, and thrillingly far from your parents. Requires enrolment.',
      rentPerDay: 9,
      moveCost: 150,
      comfort: 0.95,
      req: { enrolled: true },
      mods: [{ key: 'stress.gain', mult: 1.05 }],
    },
    {
      id: 'shared_room',
      name: 'Shared Room, Millgate',
      desc: 'A room in a converted mill loft with three roommates, a rotating cast of their friends, and one bathroom that has seen things. It is not quiet, but it is yours-ish, and nobody asks what you do at night.',
      rentPerDay: 12,
      moveCost: 200,
      comfort: 0.9,
      mods: [],
    },
    {
      id: 'studio_flat',
      name: 'Studio, Sodium Row',
      desc: 'One room over a shuttered arcade: bed, desk, hotplate, and a window full of neon that never fully turns off. Small, but the door locks and the rig is finally under your own roof.',
      rentPerDay: 24,
      moveCost: 400,
      comfort: 1.05,
      mods: [
        { key: 'stress.relief', mult: 1.05 },
        { key: 'heat.decay', add: 0.04 },
      ],
    },
    {
      id: 'millgate_onebed',
      name: 'One-Bed, Millgate Lofts',
      desc: 'Exposed brick, tall windows, and a separate room for the bed so the workstation isn\'t the last thing you see at night. The gentrification that priced out the scene works in your favor now. Awkward, that.',
      rentPerDay: 38,
      moveCost: 900,
      comfort: 1.15,
      available: { day: true, gte: dayOf(2003, 0, 1) },
      mods: [
        { key: 'stress.relief', mult: 1.08 },
        { key: 'heat.decay', add: 0.06 },
      ],
    },
    {
      id: 'harbor_loft',
      name: 'Loft, Harbor Point',
      desc: 'A wide, bright loft with a view of the water and the Meridian tower, in the part of town where nobody would think to look for you. Quiet, private, and a monthly rent that keeps you honest about your income.',
      rentPerDay: 65,
      moveCost: 2000,
      comfort: 1.25,
      available: { day: true, gte: dayOf(2004, 0, 1) },
      mods: [
        { key: 'stress.relief', mult: 1.12 },
        { key: 'heat.decay', add: 0.1 },
        { key: 'mood.daily', add: 0.3 },
      ],
    },
    {
      id: 'harbor_penthouse',
      name: 'Harbor Point Penthouse',
      desc: 'Top floor, private elevator, a terrace over the Sound, and a doorman who has been paid, thoroughly, not to remember faces. This is what selling out looks like from the inside. It looks incredible.',
      rentPerDay: 140,
      moveCost: 6000,
      comfort: 1.35,
      available: { day: true, gte: dayOf(2006, 0, 1) },
      mods: [
        { key: 'stress.relief', mult: 1.15 },
        { key: 'heat.decay', add: 0.14 },
        { key: 'mood.daily', add: 0.6 },
      ],
    },

    // ── Owned homes (no rent; buy outright) ─────────────────────────────────
    {
      id: 'cannery_house',
      name: 'House on Cannery Row',
      desc: "A small clapboard house two streets from your parents, with a porch, a basement to fill with servers, and a mortgage-free deed with your name on it. Coming home, but as the person you became.",
      rentPerDay: 0,
      moveCost: 160000,
      comfort: 1.2,
      owned: true,
      available: { day: true, gte: dayOf(2005, 0, 1) },
      mods: [
        { key: 'stress.relief', mult: 1.1 },
        { key: 'heat.decay', add: 0.08 },
      ],
    },
    {
      id: 'millgate_condo',
      name: 'Millgate Condo',
      desc: 'A sharp two-bedroom in a new-build that used to be a warehouse where the scene once threw parties. High ceilings, secure entry, and the strange feeling of owning a piece of the thing that ate your youth.',
      rentPerDay: 0,
      moveCost: 260000,
      comfort: 1.3,
      owned: true,
      available: { day: true, gte: dayOf(2006, 0, 1) },
      mods: [
        { key: 'stress.relief', mult: 1.13 },
        { key: 'heat.decay', add: 0.12 },
        { key: 'mood.daily', add: 0.4 },
      ],
    },
    {
      id: 'hill_house',
      name: 'House on the Hill',
      desc: 'A real house above the university with a study, a garden, and a garage you converted before the moving truck left. Far enough up the slope that the fog off the Sound never quite reaches you. Money did this.',
      rentPerDay: 0,
      moveCost: 400000,
      comfort: 1.35,
      owned: true,
      available: { day: true, gte: dayOf(2008, 0, 1) },
      mods: [
        { key: 'stress.relief', mult: 1.16 },
        { key: 'heat.decay', add: 0.14 },
        { key: 'mood.daily', add: 0.6 },
      ],
    },
  ],
})
