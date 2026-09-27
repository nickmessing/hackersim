import { defineContent } from '@/engine/registry'

/**
 * ECON — Lifestyles (how you feed yourself). A daily cost with daily health/mood/stress deltas.
 * `moms_cooking` (the engine's START_LIFESTYLE) is free but only available while you live in the
 * parents' flat. `instant_ramen` is the cheapest paid option. Costs scale with `w.prices`.
 */
export default defineContent({
  lifestyles: [
    {
      id: 'instant_ramen',
      name: 'Instant Ramen',
      desc: 'Twenty cents a brick, salt for a personality, and a faint sense that you are slowly turning into one of the noodles. Keeps you alive. Barely counts as keeping you alive.',
      costPerDay: 3,
      healthPerDay: -0.3,
      moodPerDay: -0.3,
      stressPerDay: 0.1,
    },
    {
      id: 'moms_cooking',
      name: "Mom's Cooking",
      desc: 'Free, hot, and served with a full interrogation about your sleep, your posture, and whether that girl on the messenger is nice. You eat well. You leave the table exhausted.',
      costPerDay: 0,
      healthPerDay: 0.1,
      moodPerDay: 0,
      stressPerDay: 0.2,
      req: { housing: 'parents_flat' },
    },
    {
      id: 'life_groceries',
      name: 'Normal Groceries',
      desc: 'A real fridge with real food you cook yourself, or at least assemble. Nothing fancy, nothing punishing. The default of a functioning adult, or a convincing impression of one.',
      costPerDay: 9,
      healthPerDay: 0,
      moodPerDay: 0,
      stressPerDay: 0,
    },
    {
      id: 'life_decent',
      name: 'Decent Eating',
      desc: 'Fresh produce, some protein that isn\'t beige, and the occasional vegetable you actually chose. Your body stops sending you increasingly worried memos.',
      costPerDay: 18,
      healthPerDay: 0.1,
      moodPerDay: 0.2,
      stressPerDay: 0,
    },
    {
      id: 'life_good',
      name: 'Good Living',
      desc: 'Takeout from the places with the long lines, groceries you didn\'t check the price of, coffee that came from a bean and not a can. It shows. In the mirror and in the mood.',
      costPerDay: 35,
      healthPerDay: 0.2,
      moodPerDay: 0.4,
      stressPerDay: -0.2,
    },
    {
      id: 'life_luxury',
      name: 'Luxury',
      desc: 'Chef-adjacent, delivered, and a wine you can pronounce only after the second glass. The kind of eating that quietly announces you have made it — to yourself, mostly, at a table for one.',
      costPerDay: 80,
      healthPerDay: 0.3,
      moodPerDay: 0.7,
      stressPerDay: -0.4,
    },
  ],
})
