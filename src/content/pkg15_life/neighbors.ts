/**
 * PKG-15 — Life events §9.3: neighbors & the Row (+ the toaster gag's Act IV payoff, §9.6 #30).
 *
 *  - life_haunted_appliance   recurring, Act I–IIa: Mr. Szabo in 14B is certain the feds tapped his
 *                             toaster. Three escalating visits (toaster → microwave clock → clock radio),
 *                             counted in `life.toaster_visits`; being kind to him sets `life.toaster_friend`.
 *  - life_toaster_finale      Act IV: the toaster man was, narrowly, right (motif-inversion table §6.E).
 *  - life_block_party         every July from 2002 while `fac.hood ≥ 20`; reads `w.hood_soul`.
 *  - life_landlord_cameras    one-off, Act II–III, while renting. Leaving the cameras (or botching the
 *                             job) sets `life.landlord_footage`, paid off by life_landlord_footage (Act III).
 *  - life_neighbor_scam_victim  Act II–III once PARALLAX is scoring the Row (`w.enclosure ≥ 2`).
 *                             Tracing the denial is a breadcrumb (`w.exposure +1`).
 */
import { dayOf } from '@/engine/calendar'
import { defineContent } from '@/engine/registry'
import type { BuffDef, SceneDef, TriggerDef } from '@/engine/types'
import {
  BLOCK_PARTY_DAYS,
  QUIET_RESET,
  actGte,
  actIs,
  actLte,
  around,
  darkTurn,
  free,
  momGone,
  momHere,
  onDays,
  partnerIs,
  renting,
  withPartner,
} from './_shared'

/** Fail branch of the Quintero trace: NorthLink quietly throttles the "unusual activity" line. */
const THROTTLED: BuffDef = {
  id: 'life_northlink_throttled',
  name: 'Throttled',
  desc: 'NorthLink has flagged your line for "unusual activity" and is politely strangling it. Everything takes longer. Everything is watched a little closer.',
  days: 28,
  bad: true,
  mods: [
    { key: 'hack.speed', mult: 0.85 },
    { key: 'freelance.speed', mult: 0.92 },
    { key: 'trace', mult: 0.9 },
  ],
}

const scenes: SceneDef[] = [
  // ── life_haunted_appliance: visit 1, the toaster ────────────────────────────
  {
    id: 'life_toaster_1',
    channel: 'dialog',
    title: '14B',
    start: 'start',
    nodes: {
      start: {
        speaker: 'Mr. Szabo',
        text: [
          `Mr. Szabo from 14B catches you on the stairs. He is seventy-one, retired from forty years of fixing ferry engines, and wearing a cardigan over a second, slightly smaller cardigan.`,
          `"You. The computer one." He lowers his voice to a stage whisper audible from the street. "My toaster is humming. At night. Two in the morning, hmmmmm, like a refrigerator having a thought. It never hummed before the election."`,
          `"I think," he says, with enormous gravity, "they have put a wire in it."`,
        ],
        choices: [
          {
            text: `"Let's have a look at it, Mr. Szabo."`,
            tag: '[Hardware]',
            check: {
              skill: 'hardware',
              dc: 10,
              bonuses: [{ if: { background: 'tinkerer' }, add: 2, label: '+2 (you have opened a toaster before, for science)' }],
              success: 'fixed',
              fail: 'sparks',
              successEffects: [{ faction: 'fac.hood', add: 3 }, { flag: 'life.toaster_friend' }, { xp: 'hardware', add: 15 }],
              failEffects: [{ faction: 'fac.hood', add: 2 }, { flag: 'life.toaster_friend' }, { stat: 'mood', add: 2 }, { stat: 'health', add: -2 }],
            },
          },
          {
            text: `"Mr. Szabo. Nobody is tapping your toaster. What would they even hear? Bread?"`,
            effects: [{ faction: 'fac.hood', add: -1 }, { stat: 'mood', add: 1 }],
            goto: 'bread',
          },
          {
            text: `Make him a tinfoil toaster cozy. Very official. Signal-proof.`,
            effects: [{ faction: 'fac.hood', add: 3 }, { flag: 'life.toaster_friend' }, { stat: 'mood', add: 4 }],
            goto: 'cozy',
          },
        ],
      },
      fixed: {
        speaker: 'narrator',
        text: [
          `The toaster is older than you are and has a crumb tray nobody has emptied since the Carter administration. The hum is the heating element's thermostat, which has a loose contact and chatters when the building's voltage sags at night.`,
          `You bend the contact back, empty the crumb tray (a small, archaeological event) and plug it in. Silence. Mr. Szabo listens with his head on one side for a full minute.`,
          `"So," he says, satisfied. "They have removed it. Because they know that you know." He gives you a jar of pickled peppers that could strip paint.`,
        ],
      },
      sparks: {
        speaker: 'narrator',
        text: [
          `You open it up. You poke the thermostat. The thermostat pokes back, with a small blue spark and a smell of burnt toast from 1983.`,
          `Mr. Szabo is delighted. "You see? You see? A spark! It fights you!" He will not hear another word about loose contacts. He does, however, unplug the toaster at night from now on, which fixes the hum. He tells everyone on the stairs you are "very brave."`,
        ],
      },
      bread: {
        speaker: 'Mr. Szabo',
        text: `He looks at you with deep pity. "Bread," he repeats. "You think they are interested in bread. You are young." He pats your cheek, slightly too hard, and goes back into 14B. Through the door you hear him tell his cat that the computer one is "a nice boy, but naive."`,
      },
      cozy: {
        speaker: 'narrator',
        text: [
          `Three sheets of kitchen foil, a length of electrical tape and a label printed in the most authoritative font you own: SIGNAL SHIELD — MODEL SZ-1 — DO NOT REMOVE.`,
          `Mr. Szabo installs it over the toaster with the solemnity of a man hanging a flag. "Now they hear nothing," he says. He is so happy that you almost feel bad. Then he makes you a paprika sandwich and you don't.`,
        ],
      },
    },
  },

  // ── Visit 2, the microwave ─────────────────────────────────────────────────
  {
    id: 'life_toaster_2',
    channel: 'dialog',
    title: '12:00',
    start: 'start',
    nodes: {
      start: {
        speaker: 'Mr. Szabo',
        text: [
          `Mr. Szabo is waiting for you at the mailboxes. He has been waiting, from the look of the folding chair, for some time.`,
          { if: { flag: 'life.toaster_friend' }, text: `"The shield works," he reports. "The toaster is quiet. So." He leans in. "They moved to the microwave."`, else: `"You didn't believe me about the toaster," he says, without rancour. "Fine. Now they are in the microwave. Come. See for yourself, Mister Bread."` },
          `Every morning, he explains, the microwave clock says 12:00, blinking. Every morning he sets it. Every morning: 12:00. "Somebody," says Mr. Szabo, "is resetting my clock. In the night. Why would they do this unless they are coming in?"`,
        ],
        choices: [
          {
            text: `Stay up with him and watch the microwave. For science.`,
            tag: '[Systems]',
            check: {
              skill: 'systems',
              dc: 11,
              success: 'power',
              fail: 'asleep',
              successEffects: [{ faction: 'fac.hood', add: 4 }, { flag: 'life.toaster_friend' }, { stat: 'energy', add: -10 }],
              failEffects: [{ faction: 'fac.hood', add: 2 }, { stat: 'energy', add: -15 }, { stat: 'mood', add: 3 }],
            },
          },
          {
            text: `"Get your nephew to look at it."`,
            effects: [{ faction: 'fac.hood', add: -1 }],
            goto: 'nephew',
          },
          {
            text: `Ask Dad. Dad has fixed every appliance on this street.`,
            if: around('dad'),
            effects: [{ npc: 'dad', affinity: 3 }, { faction: 'fac.hood', add: 3 }, { flag: 'life.toaster_friend' }],
            goto: 'dad',
          },
        ],
      },
      power: {
        speaker: 'narrator',
        text: [
          `At 3:41 a.m. the lights in 14B flicker, once, so fast you'd miss it if you weren't staring at the kitchen like a stakeout cop. The microwave blinks 12:00. The building's ancient wiring browns out every night when the bakery on the corner fires up its ovens.`,
          `You explain this carefully. Mr. Szabo nods carefully. "So they are in the bakery," he says. Then he laughs, a big ferry-engine laugh. "I know, I know. It's the wiring. But admit it, it was fun, the stakeout." It was, a little. He gives you a thermos of coffee strong enough to hear.`,
        ],
      },
      asleep: {
        speaker: 'narrator',
        text: `You last until 2:15 before you fall asleep on his kitchen chair with your head against the wall. You wake at dawn under a crocheted blanket, with the microwave blinking 12:00 and Mr. Szabo watching you with enormous tenderness. "They came," he whispers. "While you slept. It's okay. Nobody is a good spy the first time."`,
      },
      nephew: {
        speaker: 'Mr. Szabo',
        text: `"My nephew," he says, "sells mortgages in Ridgeport. He thinks a microwave is a kind of wave." He goes back inside. The next morning the microwave has a piece of masking tape across the clock reading NO. It doesn't fix anything, but he seems calmer.`,
      },
      dad: {
        speaker: 'dad',
        text: [
          `Dad stands in 14B's kitchen with his hands in his pockets for exactly nine seconds. "Bakery," he says. "Every night, quarter to four. Browns out the whole side of the building." He fishes a little plug-in battery clock from his jacket (he carries one, apparently, for occasions like this) and sets it on the counter.`,
          `Mr. Szabo and Dad talk about ferry engines for two hours. You go home alone. Dad comes back after midnight smelling of plum brandy and says it was the best conversation he's had since the mill.`,
        ],
      },
    },
  },

  // ── Visit 3, the clock radio ───────────────────────────────────────────────
  {
    id: 'life_toaster_3',
    channel: 'dialog',
    title: 'Voices',
    start: 'start',
    nodes: {
      start: {
        speaker: 'Mr. Szabo',
        text: [
          `This time he knocks on your door at eleven at night, in slippers, holding his clock radio in both hands like a baby bird.`,
          `"Listen." He turns it on. Between stations, under the static, a man's voice, very clearly: "...copy that, Big Pelican, I got a load of frozen shrimp and a bad attitude, over."`,
          `"Big Pelican," says Mr. Szabo, white-faced. "It is a code name."`,
        ],
        choices: [
          {
            text: `Find where it's coming from.`,
            tag: '[Networking]',
            check: {
              skill: 'networking',
              dc: 12,
              success: 'trucker',
              fail: 'static',
              successEffects: [{ faction: 'fac.hood', add: 4 }, { flag: 'life.toaster_friend' }, { xp: 'networking', add: 20 }],
              failEffects: [{ faction: 'fac.hood', add: 2 }, { stat: 'mood', add: 2 }, { stat: 'stress', add: 3 }, { stat: 'energy', add: -6 }],
            },
          },
          {
            text: `Pick up the imaginary radio. "Big Pelican, this is 14B. You're scaring my friend. Over."`,
            effects: [{ faction: 'fac.hood', add: 3 }, { flag: 'life.toaster_friend' }, { stat: 'mood', add: 5 }],
            goto: 'roleplay',
          },
          {
            text: `"Mr. Szabo, it's eleven o'clock. Please."`,
            effects: [{ faction: 'fac.hood', add: -2 }, { stat: 'stress', add: -2 }],
            goto: 'door',
          },
        ],
      },
      trucker: {
        speaker: 'narrator',
        text: [
          `You walk the block with the radio held out in front of you like a dowsing rod, Mr. Szabo two steps behind in his slippers. The voice gets louder by the loading dock of the frozen-fish wholesaler, where a trucker with a CB rig the size of a minibar is idling his engine and complaining about his dispatcher.`,
          `His name is Duane. His handle is Big Pelican. His amplifier is not strictly legal and bleeds into every cheap radio on the Row. Mr. Szabo shakes his hand and asks him about his dispatcher, and they talk for forty minutes. On the way home he says, "So. Not the feds." A pause. "This time."`,
        ],
      },
      static: {
        speaker: 'narrator',
        text: `You can't pin it down. The voice fades in and out as you walk, and eventually a truck pulls away somewhere on the far side of the wholesaler and the static swallows it. Mr. Szabo is quiet the whole way home. At his door he says, "Thank you for walking with me." You realize, too late, that that was the whole point.`,
      },
      roleplay: {
        speaker: 'narrator',
        text: [
          `Mr. Szabo stares at you. Then he takes the imaginary handset from you with great seriousness. "Big Pelican," he says. "This is Ferry Man. We know about the shrimp. Over."`,
          `The radio, by pure cosmic coincidence, crackles: "...ten-four, ten-four, I'm outta here." Mr. Szabo laughs so hard he has to sit down on the stairs. You both do. For a month afterwards he signs every note he leaves you FERRY MAN, OVER.`,
        ],
      },
      door: {
        speaker: 'narrator',
        text: `"Of course. Of course. It's late." He shuffles back down the hall with the radio still hissing in his hands. The next day there's a paper bag hanging on your doorknob with two pastries in it and a note that just says: SORRY, 14B. You feel like the worst person on Cannery Row for at least a week.`,
      },
    },
  },

  // ── life_toaster_finale: Act IV ───────────────────────────────────────────
  {
    id: 'life_toaster_finale',
    channel: 'dialog',
    title: 'Ferry Man',
    start: 'start',
    nodes: {
      start: {
        speaker: 'Mr. Szabo',
        text: [
          `Mr. Szabo is eighty now, or near it, and he has stopped wearing the second cardigan. He shows you into 14B, where there is a new toaster on the counter: chrome, rounded, with a little blue light and a sticker that says HARBORLINE SMART HOME PILOT — THANK YOU FOR PARTICIPATING!`,
          `"The electric company gave it to me," he says. "Free. For the old people. To save energy." He hands you a letter. It's from his insurer, and it is very polite. It mentions, among "lifestyle indicators considered in your updated premium," a pattern of irregular overnight appliance use.`,
          `"Two in the morning," he says quietly. "I make toast when I can't sleep. Since my wife." He taps the letter. "They know when I make toast."`,
          { if: { flag: 'life.toaster_friend' }, text: `"You never laughed at me," he says. "Not really. So I ask you. Am I crazy?"`, else: `"You laughed at me once," he says, without heat. "Bread, you said. So. Now I ask you. Was I crazy?"` },
          { if: { flag: 'a3.truth_t1' }, text: `You know exactly where that data goes. You've seen the correlation tables. Somewhere in a server hall that used to be a paper mill, an old man's insomnia is a risk factor.` },
        ],
        choices: [
          {
            text: `"No. You're not crazy. You were right, Mr. Szabo. Just early."`,
            effects: [{ faction: 'fac.hood', add: 4 }, { var: 'w.hood_soul', add: 1 }, { stat: 'mood', add: -3 }],
            goto: 'truth',
          },
          {
            text: `Get him out of the pilot program, the letter withdrawn, and the premium back.`,
            tag: '[Business]',
            check: {
              skill: 'business',
              dc: 16,
              bonuses: [{ if: { flag: 'a3.truth_t1' }, add: 2, label: '+2 (you know which words make them nervous)' }],
              success: 'opted_out',
              fail: 'form_letter',
              successEffects: [{ faction: 'fac.hood', add: 6 }, { stat: 'mood', add: 4 }],
              failEffects: [{ faction: 'fac.hood', add: 2 }, { stat: 'stress', add: 4 }, { stat: 'mood', add: -3 }],
            },
          },
          {
            text: `Make the smart toaster report a very boring man who sleeps soundly.`,
            tag: '[Systems]',
            check: {
              skill: 'systems',
              dc: 17,
              success: 'boring',
              fail: 'bricked',
              successEffects: [{ faction: 'fac.hood', add: 5 }, { stat: 'heat', add: 2 }, { stat: 'cred', add: 1 }],
              failEffects: [{ stat: 'heat', add: 5 }, { faction: 'fac.hood', add: 1 }, { chance: 0.3, then: [{ complication: 'legal' }] }],
            },
          },
          {
            text: `Bring him an old toaster. The kind with no light. Dad has a shelf of them.`,
            if: { any: [around('dad'), { quest: 'fac_hood_q2_dad', status: 'completed' }] },
            effects: [{ faction: 'fac.hood', add: 5 }, { npc: 'dad', affinity: 3 }, { var: 'w.hood_soul', add: 1 }],
            goto: 'old_toaster',
          },
          {
            text: `"It's just a form letter, Mr. Szabo. Everybody gets them."`,
            tag: '[Lie]',
            effects: [{ faction: 'fac.hood', add: -3 }, { stat: 'mood', add: -5 }],
            goto: 'lie',
          },
        ],
      },
      truth: {
        speaker: 'Mr. Szabo',
        text: [
          `He sits down very slowly at his kitchen table. "Early," he repeats. "Forty years on the ferries, I was never early for anything." He laughs, but it doesn't go anywhere.`,
          `"When I was a boy, in the old country, we knew who was listening. A man in a coat. You could see him. You could hate him." He turns the chrome toaster so the blue light faces the wall. "This one, who do I hate? The toast?"`,
          `You sit with him while he unplugs it. It takes him a while to decide to.`,
        ],
      },
      opted_out: {
        speaker: 'narrator',
        text: [
          `It takes three phone calls, a letter citing the utility's own pilot agreement back at it, and the phrase "elder consumer protection" used exactly twice. The insurer withdraws the "updated premium" with a letter apologizing for a "clerical adjustment."`,
          `Mr. Szabo frames the apology next to his ferry licence. The utility sends a van for the smart toaster. He makes the driver a paprika sandwich before he lets him take it.`,
        ],
      },
      form_letter: {
        speaker: 'narrator',
        text: [
          `You get a supervisor, and then a supervisor's supervisor, and then a recorded voice explaining that premiums reflect "a holistic view of the customer." The letter stands. The best you can do is get him out of the pilot program; the data they already have, they keep.`,
          `"So. They keep the toast," Mr. Szabo says, when you tell him. He takes it better than you do.`,
        ],
      },
      boring: {
        speaker: 'narrator',
        text: [
          `The toaster's little reporting routine is as dumb as it is nosy. You don't break it; you just teach it to be discreet. From now on, as far as the Harborline pilot is concerned, the man in 14B makes two slices at 7:15 every morning and sleeps like a baby.`,
          `"Now they think I am boring?" says Mr. Szabo. You nod. He thinks about it. "Good," he says. "Boring men live forever." He makes toast at two in the morning, out of spite, and nobody knows.`,
        ],
      },
      bricked: {
        speaker: 'narrator',
        text: [
          `The toaster's reporting routine is dumb, but it is not alone: the moment you poke it, it phones home to ask why it's being poked, and then it stops working entirely, blue light blinking an accusing amber.`,
          `The utility sends a very polite email about "tampering with pilot equipment," and a new toaster, and a revised premium. Mr. Szabo puts the new one in the closet and eats his bread untoasted. "Like in the old country," he says, cheerfully. You don't feel cheerful.`,
        ],
      },
      old_toaster: {
        speaker: 'narrator',
        text: [
          `Dad has a whole shelf of them in the back of the flat: chrome slabs from the fifties, a brown one with a lever like a slot machine, all rebuilt, all humming slightly at night.`,
          `You carry the slot-machine one up to 14B. Mr. Szabo plugs it in and holds his hand over the slots like a man warming himself at a fire. "It hums," he says, delighted. "The old way. Nobody listening." He puts the smart one out on the curb with a sign that says FREE — COMES WITH FRIENDS.`,
        ],
      },
      lie: {
        speaker: 'Mr. Szabo',
        text: [
          `He looks at you for a long moment. He was a mechanic for forty years; he knows what a man looks like when he's saying the part is fine.`,
          `"Okay," he says. "Everybody gets them." He folds the letter along its creases and puts it in the drawer with his wife's recipes. You pass 14B a hundred times after that. He always waves. He never asks you about anything again.`,
        ],
      },
    },
  },

  // ── life_block_party ──────────────────────────────────────────────────────
  {
    id: 'life_block_party',
    channel: 'dialog',
    title: 'Cannery Row Block Party',
    start: 'start',
    nodes: {
      start: {
        speaker: 'narrator',
        text: [
          `Third Saturday in July. Somebody's uncle has closed off Cannery Row with sawhorses borrowed from a construction site, and the street smells like charcoal, sunscreen and the Sound. Folding tables. Coolers. A kiddie pool that three adults are sitting in.`,
          { if: { var: 'w.cathode_open', eq: 1 }, text: `Sal has rolled the Cathode's flat-top grill out onto the sidewalk and is working it like a DJ, flipping burgers with two spatulas and a cigarette he has promised his doctor he doesn't smoke.`, else: `Where the Cathode used to be there's a vape shop with frosted windows. Somebody's set up a charcoal grill in front of it anyway, in protest or in memory. Nobody is sure which.` },
          { if: actIs(2), text: `Somebody has run an extension cord out of a second-floor window to power a boombox, a blender, and, alarmingly, a space heater nobody asked for.` },
          { if: actGte(3), text: `The Row looks older. So do you. There are kids running between the tables you've never seen before, and a couple of faces missing you can't stop noticing.` },
          { if: { var: 'w.hood_soul', gte: 2 }, text: `People keep stopping you, clapping you on the shoulder, handing you things. A plate. A beer. A baby, briefly. The Row remembers what you've done for it, loudly.` },
          { if: { var: 'w.hood_soul', lte: -1 }, text: `A few conversations get quieter when you walk past. Nobody's rude. Nobody's quite warm, either.` },
          { if: momHere, text: `Mom has brought three trays of spring rolls and is standing guard over them like a customs officer.` },
          { if: { all: [momGone, around('dad')] }, text: `Dad brought Mom's spring roll recipe, made from the card in her handwriting. They're not quite right. Nobody says so. They're gone in ten minutes.` },
        ],
        choices: [
          {
            text: `Take over the sound system. The Row deserves better than one boombox.`,
            tag: '[Hardware]',
            check: {
              skill: 'hardware',
              dc: 12,
              bonuses: [{ if: { item: 'furn_speakers' }, add: 2, label: '+2 (you brought your own speakers)' }],
              success: 'dj',
              fail: 'fuse',
              successEffects: [{ faction: 'fac.hood', add: 4 }, { stat: 'mood', add: 8 }],
              failEffects: [{ faction: 'fac.hood', add: 2 }, { stat: 'mood', add: 4 }, { money: -20 }, { stat: 'stress', add: 2 }],
            },
          },
          {
            text: `Enter the pie-eating contest. Sal's pies. For glory.`,
            tag: '[Fitness]',
            check: {
              skill: 'fitness',
              dc: 13,
              bonuses: [{ if: { trait: 'iron_stomach' }, add: 3, label: '+3 (iron stomach)' }],
              success: 'pie_win',
              fail: 'pie_lose',
              successEffects: [{ faction: 'fac.hood', add: 3 }, { stat: 'mood', add: 8 }, { npc: 'sal', affinity: 3 }],
              failEffects: [{ faction: 'fac.hood', add: 2 }, { stat: 'health', add: -2 }, { stat: 'mood', add: 4 }],
            },
          },
          {
            text: `Dance with your partner in the street like nobody's watching. Everybody is watching.`,
            if: withPartner,
            effects: [
              { if: partnerIs('mira'), then: [{ npc: 'mira', affinity: 5 }], else: [{ npc: 'grace', affinity: 5 }] },
              { faction: 'fac.hood', add: 3 },
              { stat: 'stress', add: -10 },
            ],
            goto: 'dance',
          },
          {
            text: `Sit on the stoop with your family and watch the street.`,
            if: { any: [momHere, around('dad'), around('kim')] },
            effects: [
              { if: momHere, then: [{ npc: 'mom', affinity: 3 }] },
              { if: around('dad'), then: [{ npc: 'dad', affinity: 3 }] },
              { if: around('kim'), then: [{ npc: 'kim', affinity: 3 }] },
              { stat: 'stress', add: -8 },
              { faction: 'fac.hood', add: 2 },
            ],
            goto: 'stoop',
          },
          {
            text: `Help at the grill until your forearms have no hair left.`,
            effects: [{ faction: 'fac.hood', add: 4 }, { stat: 'energy', add: -10 }, { if: { var: 'w.cathode_open', eq: 1 }, then: [{ npc: 'sal', affinity: 4 }] }],
            goto: 'grill',
          },
        ],
      },
      dj: {
        speaker: 'narrator',
        text: [
          `Two car stereos, a borrowed amp, Jax's cousin's karaoke machine and forty feet of speaker wire later, Cannery Row has a sound system that could be heard on the other side of the Sound.`,
          `You play everything: the old stuff for the old folks, the loud stuff for the kids, a slow song at sunset that makes three couples dance and one couple, visibly, make up. Grandma Ruth requests the same song four times. You play it four times.`,
        ],
      },
      fuse: {
        speaker: 'narrator',
        text: [
          `You plug in the amp. The amp, the boombox, the blender, the space heater and every light on the second floor of number 22 go out at once with a sound like a soda can being stepped on.`,
          `A hundred people turn and look at you. Then somebody's grandpa starts singing, a cappella, very badly, and then everybody is. Dad fixes the fuse with a gum wrapper, which is not safe and which works. The a cappella set is, by consensus, the best part of the party.`,
        ],
      },
      pie_win: {
        speaker: 'sal',
        text: `You eat four slices of Sal's cherry pie in ninety seconds, face first, hands behind your back, while a crowd of children chants your handle, which they have learned from Kim. Sal holds your arm up like a boxer's. "The champ," he announces. "Somebody get the champ a napkin. Somebody get the champ a doctor." The trophy is a pie tin spray-painted gold. You keep it for the rest of your life.`,
      },
      pie_lose: {
        speaker: 'narrator',
        text: `You get through two slices before your body files a formal objection. You are beaten, decisively, by an eleven-year-old named Paulie who does not appear to chew. You spend the rest of the afternoon lying on a lawn chair in the shade while people bring you ginger ale and commiserate. It is honestly not a bad afternoon.`,
      },
      dance: {
        speaker: 'narrator',
        text: [
          { if: partnerIs('mira'), text: `Mira does not dance. Mira announces this. Then Mira dances, extremely well and with a straight face, like she's solving the song. The Row whoops. She pretends not to hear it and doesn't let go of your hand for an hour.`, else: `Grace dances like she's off shift for the first time in a month, which she is: loose, laughing, a little off the beat, entirely unembarrassed. The Row whoops. Mom, from the stoop, looks like she might cry, and pretends it's the charcoal smoke.` },
        ],
      },
      stoop: {
        speaker: 'narrator',
        text: [
          `The stoop of the old building, warm from the sun. Paper plates on your knees. The street in front of you full of people you've known your whole life, getting older, getting louder.`,
          { if: momHere, text: `Mom leans against your shoulder at some point, which she hasn't done since you were small. "This," she says, waving her fork at the whole street, "this is the thing. Don't forget this is the thing."`, else: `Dad sits beside you with a plate he doesn't touch. "Your mother loved this," he says. "She'd be over there bossing the grill." He laughs. It's a real one. You sit until the streetlights come on.` },
        ],
      },
      grill: {
        speaker: 'narrator',
        text: `Four hours at the grill. Three hundred burgers, give or take. You learn to flip with a spatula in each hand, to judge a burger by its sound, and that the correct response to a customer who wants it "well done but juicy" is to nod and do whatever you were going to do anyway. The whole Row eats your food. You smell like smoke for two days and you don't mind at all.`,
      },
    },
  },

  // ── life_landlord_cameras ─────────────────────────────────────────────────
  {
    id: 'life_landlord_cameras',
    channel: 'dialog',
    title: 'For Your Safety',
    start: 'start',
    nodes: {
      start: {
        speaker: 'narrator',
        text: [
          `You come home to a new sign in the lobby, laminated, cheerful: FOR YOUR SAFETY, THIS BUILDING IS NOW MONITORED 24/7 BY LUMENWATCH. — MGMT.`,
          `There are three new cameras. One in the lobby. One on the back stairs. And one on your hallway, bolted to the ceiling at an angle that covers exactly one door, which is yours.`,
          `Under each camera, a small sticker: LumenWatch is a data partner of Harborline Data Holdings.`,
          { if: { flag: 'life.chain_traced' }, text: `Harborline. The same holding company that was collecting your aunt's church friends' passwords. You feel the hair on your arms stand up.` },
        ],
        choices: [
          {
            text: `Pay a late-night visit to the camera on your hall.`,
            tag: '[Hardware]',
            check: {
              skill: 'hardware',
              dc: 14,
              bonuses: [{ if: { trait: 'paranoid' }, add: 2, label: '+2 (you have thought about this exact camera for years)' }],
              success: 'looped',
              fail: 'caught',
              successEffects: [{ faction: 'fac.hood', add: 3 }, { stat: 'heat', add: -3 }],
              failEffects: [{ flag: 'life.landlord_footage' }, { flag: 'life.landlord_photo' }, { money: -150 }, { stat: 'heat', add: 5 }, { stat: 'stress', add: 5 }, { chance: 0.3, then: [{ complication: 'legal' }] }],
            },
          },
          {
            text: `Knock on every door in the building. Nobody signed up for this.`,
            tag: '[Social]',
            check: {
              skill: 'social',
              dc: 13,
              bonuses: [{ if: { faction: 'fac.hood', gte: 30 }, add: 2, label: '+2 (people on the Row know your name)' }],
              success: 'tenants',
              fail: 'shrug',
              successEffects: [{ faction: 'fac.hood', add: 6 }, { var: 'w.hood_soul', add: 1 }],
              failEffects: [{ flag: 'life.landlord_footage' }, { faction: 'fac.hood', add: 1 }, { stat: 'stress', add: 3 }, { stat: 'mood', add: -2 }],
            },
          },
          {
            text: `Find the camera's feed and see who's actually watching.`,
            tag: '[Networking]',
            req: { skill: 'networking', gte: 25 },
            reqText: 'Requires Networking 25',
            check: {
              skill: 'networking',
              dc: 16,
              success: 'feed_found',
              fail: 'feed_lost',
              successEffects: [{ flag: 'life.landlord_footage' }, { xp: 'networking', add: 30 }, { var: 'w.exposure', add: 1 }],
              failEffects: [{ flag: 'life.landlord_footage' }, { stat: 'heat', add: 4 }, { stat: 'stress', add: 3 }, { chance: 0.3, then: [{ complication: 'hack' }] }],
            },
          },
          {
            text: `Leave it. Wear a hat. Use the fire escape more.`,
            effects: [{ flag: 'life.landlord_footage' }, { stat: 'stress', add: 3 }],
            goto: 'leave',
          },
        ],
      },
      looped: {
        speaker: 'narrator',
        text: [
          `Three in the morning, a stepladder, a flashlight in your teeth. The camera is cheap and proud of it. You don't cut anything. You just give it a very nice picture of an empty hallway to look at, forever.`,
          `The next week, Mrs. Petrova from 3C catches you at the mailboxes and says, apropos of nothing, "Such a quiet hallway now. So peaceful." She gives you a jar of sour cherries and a wink that should be illegal.`,
        ],
      },
      caught: {
        speaker: 'narrator',
        text: [
          `The camera has a tamper sensor. You learn this when it emails the management company a crisp little photo of your face, lit from below by a flashlight, looking exactly like a burglar in a public service announcement.`,
          `A letter under your door: a $150 "equipment interference fee" added to your rent, and a note that the incident has been "logged with our security partner." Logged. There's a picture of you somewhere now, in a folder with your name on it.`,
        ],
      },
      tenants: {
        speaker: 'narrator',
        text: [
          `It turns out nobody likes the cameras. The retired couple in 2A. The night-shift nurse in 4B. The family of six in 1C, who have a teenager and therefore opinions. By Sunday you have eleven signatures and a tenants' meeting in the laundry room.`,
          `Management backs down in nine days: the hallway cameras come down, the lobby camera "stays for insurance purposes" and points at the front door and nothing else. The teenager in 1C starts calling you "boss." You don't hate it.`,
        ],
      },
      shrug: {
        speaker: 'narrator',
        text: `Half the doors don't open. The ones that do open say things like "I've got nothing to hide" and "it's probably for the break-ins" and "is this about the recycling?" You get two signatures, one of which is yours. The cameras stay. You start using the fire escape, and feeling stupid about it, and doing it anyway.`,
      },
      feed_found: {
        speaker: 'narrator',
        text: [
          `The feed doesn't go to the management office. It goes to a LumenWatch server in Millgate, where the footage is kept for "up to seven years," tagged by unit number, indexed by motion events. Your door has 214 motion events this month. Most of them are between midnight and five.`,
          `You don't touch it. Touching it would show up. But you save the address, the retention policy and a screenshot of your own door's event count, and you understand, looking at it, that somebody is building a timeline of your nights.`,
        ],
      },
      feed_lost: {
        speaker: 'narrator',
        text: `The feed hops through a relay you don't recognize and drops you cold. A day later the camera over your door has a new little red light that wasn't there before. It might be nothing. It might mean somebody noticed you looking. You stop looking back at it, and that's somehow worse.`,
      },
      leave: {
        speaker: 'narrator',
        text: `You leave it. It's just a camera. You start wearing a hat in the hall, and taking the fire escape when you come home late, and then you notice you come home late a lot, and that the camera has been watching the whole time you were figuring that out.`,
      },
    },
  },
  {
    id: 'life_landlord_footage',
    channel: 'mail',
    title: 'RE: Your LumenWatch Privacy Package',
    from: 'Gorski Property Management',
    start: 'start',
    nodes: {
      start: {
        text: [
          `Dear Resident,`,
          `As a valued tenant, you are eligible for the new LumenWatch Privacy Package. For a one-time fee of $500, footage associated with your unit will be excluded from our partner data-sharing program for the remainder of the retention period.`,
          `Tenants who decline will continue to enjoy the full benefits of our partnership, including improved building security and eligibility for "Verified Tenant" status with participating insurers and lenders.`,
          `We look forward to your prompt reply.\n— M. Gorski, Gorski Property Management\n"Your Home, Our Priority"`,
          `It takes you a moment. He's selling the footage. And he's offering to let you buy yourself out of it.`,
          { if: { flag: 'life.landlord_photo' }, text: `A P.S. in smaller type: "Residents with logged equipment-interference incidents are not eligible for the Premium Tier." Your flashlit face, it seems, has been priced separately.` },
        ],
        choices: [
          {
            text: `Pay the $500. It's cheaper than finding out who's buying.`,
            req: { stat: 'money', gte: 500 },
            reqText: 'Requires $500',
            effects: [{ money: -500 }, { stat: 'stress', add: 3 }],
            goto: 'paid',
          },
          {
            text: `Make your door's archive quietly disappear from the LumenWatch server.`,
            tag: '[Intrusion]',
            check: {
              skill: 'intrusion',
              dc: 16,
              success: 'deleted',
              fail: 'flagged',
              successEffects: [{ clearFlag: 'life.landlord_footage' }, { stat: 'heat', add: 3 }, { stat: 'cred', add: 1 }],
              failEffects: [{ stat: 'heat', add: 8 }, { stat: 'stress', add: 5 }, { flag: 'life.lumenwatch_flagged' }, { var: 'w.enclosure', add: 1 }, { complication: 'legal' }],
            },
          },
          {
            text: `Reply with the tenant-privacy statute he's breaking, and a request for a rent reduction.`,
            tag: '[Business]',
            check: {
              skill: 'business',
              dc: 15,
              success: 'leverage',
              fail: 'lawyer',
              successEffects: [{ faction: 'fac.hood', add: 4 }, { money: 300 }],
              failEffects: [{ stat: 'stress', add: 4 }, { chance: 0.3, then: [{ complication: 'legal' }] }],
            },
          },
          {
            text: `Forward it to Detective Calderon with a one-line note.`,
            if: { npc: 'calderon', met: true },
            effects: [{ npc: 'calderon', affinity: 4 }, { faction: 'fac.hood', add: 3 }, { stat: 'heat', add: 2 }],
            goto: 'calderon',
          },
          {
            text: `Ignore it.`,
            effects: [{ var: 'w.enclosure', add: 1 }],
            goto: 'ignored',
          },
        ],
      },
      paid: {
        text: `You pay. A receipt arrives with a certificate: PRIVACY PACKAGE — PREMIUM TIER, with a gold seal and your unit number. The certificate says nothing about the footage already sold before you paid. You frame it anyway, as a joke, and don't find it funny.`,
      },
      deleted: {
        text: `The LumenWatch archive is organized by building, then by unit. Seven years of motion events for your door come to a few hundred megabytes and a timeline that looks like an EKG of your worst habits. You make it quietly not exist. The server logs a routine maintenance event. So do you.`,
      },
      flagged: {
        text: [
          `The archive has an audit trail, and the audit trail has an alarm. Your session gets cut halfway through, and the next morning LumenWatch emails Gorski, who emails you: "We have been notified of an unauthorized access attempt originating from a residential connection. We take these matters seriously."`,
          `He can't prove it was you. He doesn't need to. A car you don't recognize is parked across the street for the next two nights.`,
          `And your door's archive — the one you tried to delete — gets a new tag in the LumenWatch index. You can see it from the outside now, if you squint: PRIORITY RETENTION. They are not going to throw your nights away after seven years. They are going to keep them.`,
        ],
      },
      leverage: {
        text: `Your reply cites the statute, the section and the fine per violation per unit. Gorski's next email is much shorter: the "privacy package" has been "discontinued," your hallway camera will be "decommissioned," and a courtesy credit of $300 has been applied to your account. The tenants in 2A get one too. They think it's a clerical error. You let them.`,
      },
      lawyer: {
        text: `Gorski's reply comes from a lawyer, on letterhead, and uses the word "defamatory" twice, and "your continued tenancy" once. It doesn't mention the footage. The privacy package stays on offer. You go back to the fire escape, and a dull, reasonable anger that doesn't go anywhere.`,
      },
      calderon: {
        speaker: 'calderon',
        text: `Calderon replies the same afternoon: "Funny. Third one of these I've seen this month. Can't touch the data company, they've got lawyers who eat my budget for breakfast. The landlord, though, the landlord's got code violations." Two weeks later Gorski is fined for eleven of them. The privacy package quietly disappears.`,
      },
      ignored: {
        text: `You delete the mail. The camera keeps watching. Somewhere, somebody buys a timeline of your nights for less than you pay in rent, and files it next to thousands of others, and nobody ever reads any of them, until the day somebody does.`,
      },
    },
  },

  // ── life_neighbor_scam_victim ───────────────────────────────────────────
  {
    id: 'life_neighbor_scam_victim',
    channel: 'dialog',
    title: 'Mrs. Quintero\'s Kitchen',
    start: 'start',
    nodes: {
      start: {
        speaker: 'narrator',
        text: [
          `Teodora Quintero has run the tailoring shop under the laundromat for twenty-two years. She has hemmed your pants since you were in kindergarten. Today she is sitting at her kitchen table with a letter and a calculator, and she has been crying, and is furious about it.`,
          `"The bank said no. For the new machines, the loan, the one I get every five years. Twenty-two years, I never miss a payment." She pushes the letter at you. "It says, my score. What score? I have no score. I have a shop."`,
          `The letter is from Meridian Trust. It cites "a proprietary third-party risk assessment" and "indicators associated with your household and neighborhood." Under that, in tiny print: Assessment reference PLX-.`,
          { if: { var: 'w.enclosure', gte: 4 }, text: `You've seen letters like this before. More of them every month. You know what PLX stands for, and you know that some of the rows it learned from came through jobs with your fingerprints on them.` },
        ],
        choices: [
          {
            text: `Trace the reference number back to whoever scored her.`,
            tag: '[Networking]',
            check: {
              skill: 'networking',
              dc: 15,
              bonuses: [{ if: { flag: 'life.chain_traced' }, add: 2, label: '+2 (you have followed a Harborline thread before)' }],
              success: 'traced',
              fail: 'wall',
              successEffects: [{ var: 'w.exposure', add: 1 }, { faction: 'fac.hood', add: 3 }, { xp: 'networking', add: 25 }],
              failEffects: [{ faction: 'fac.hood', add: 2 }, { stat: 'heat', add: 3 }, { buff: THROTTLED }, { chance: 0.3, then: [{ complication: 'hack' }] }],
            },
          },
          {
            text: `Write the appeal. Twenty-two years of payments, in a spreadsheet, with a bow on it.`,
            tag: '[Business]',
            check: {
              skill: 'business',
              dc: 14,
              success: 'appeal_ok',
              fail: 'appeal_no',
              successEffects: [{ faction: 'fac.hood', add: 6 }, { var: 'w.hood_soul', add: 1 }],
              failEffects: [{ faction: 'fac.hood', add: 3 }, { stat: 'stress', add: 3 }, { stat: 'mood', add: -3 }],
            },
          },
          {
            text: `Lend her the money yourself. ($400)`,
            req: { stat: 'money', gte: 400 },
            reqText: 'Requires $400',
            effects: [{ money: -400 }, { faction: 'fac.hood', add: 7 }, { var: 'w.hood_soul', add: 1 }],
            goto: 'lent',
          },
          {
            text: `"I'm sorry, Mrs. Quintero. There's nothing I can do about banks."`,
            effects: [{ faction: 'fac.hood', add: -3 }, { stat: 'mood', add: -4 }],
            goto: 'looked_away',
          },
        ],
      },
      traced: {
        speaker: 'narrator',
        text: [
          `The reference number is a key, and keys fit locks. Meridian's letter template pulls it from a vendor feed; the vendor is a Harborline subsidiary; Harborline licenses its "neighborhood indicators" from a product it calls PARALLAX, sold by Aperture Data Solutions.`,
          `Mrs. Quintero's score is built from things like: household members with irregular work patterns; late-night residential network traffic; proximity to "elevated-incident" addresses. One of the late-night households on her block, you realize, is yours.`,
          `You print everything. You don't show her the part about your address. You tell her it isn't her. That, at least, is true.`,
        ],
      },
      wall: {
        speaker: 'narrator',
        text: `The reference number leads to a vendor feed, and the vendor feed leads to a login page with a very expensive logo and a very unfriendly security team. By the next morning your connection is being politely throttled by NorthLink "due to unusual activity." Mrs. Quintero makes you a sandwich anyway, for trying. It is the heaviest sandwich you have ever eaten.\n\nThe throttle doesn't lift for a month. Every page loads like 1998. Every job takes longer. Somewhere a line item in a NorthLink report now reads "residential account, unusual activity, elevated," and you know from Mrs. Quintero's letter exactly what kind of report reads those.`,
      },
      appeal_ok: {
        speaker: 'narrator',
        text: `You build her a four-page appeal: every payment in twenty-two years, the shop's receipts, a letter from the parish, photos of her machines with their serial numbers. Meridian's regional office "reconsiders the application in light of additional information." She gets the loan. She hems your good pants for free for the rest of your life, and refuses to discuss it.`,
      },
      appeal_no: {
        speaker: 'narrator',
        text: [
          `The appeal is good. It doesn't matter. Meridian's reply is a form letter that says the decision "reflects a comprehensive assessment" and "cannot be overridden at the branch level." Nobody at Meridian read your four pages. Possibly nobody at Meridian can.`,
          `Mrs. Quintero gets the loan from her cousin in Ridgeport instead, at a worse rate, and a lecture. "At least my cousin," she says, "I can yell at."`,
        ],
      },
      lent: {
        speaker: 'narrator',
        text: `She refuses twice, formally, the way you're supposed to. The third time she takes the envelope and writes you an IOU on a sewing-pattern envelope in beautiful cursive. She pays you back in eleven months, to the dollar, with a twelfth envelope that just has a twenty in it and the word INTEREST, underlined.`,
      },
      looked_away: {
        speaker: 'narrator',
        text: `"No," she says. "No. Of course not." She folds the letter up small. The shop under the laundromat closes in the spring. You walk past the empty window for years, with its faded paper sign: ALTERATIONS — HEMS — WHILE-U-WAIT.`,
      },
    },
  },
]

// ════════════════════════════════════════════════════════════════════════════
// Triggers
// ════════════════════════════════════════════════════════════════════════════

const triggers: TriggerDef[] = [
  {
    id: 'life_haunted_appliance',
    when: {
      all: [
        actLte(2),
        { not: darkTurn },
        free,
        { day: true, gte: 14 },
        { var: 'life.toaster_visits', lte: 2 },
      ],
    },
    once: false,
    cooldownDays: 50,
    atHour: 18,
    chance: 0.06,
    effects: [
      QUIET_RESET,
      { var: 'life.toaster_visits', add: 1 },
      {
        if: { var: 'life.toaster_visits', eq: 1 },
        then: [{ scene: 'life_toaster_1' }],
        else: [{ if: { var: 'life.toaster_visits', eq: 2 }, then: [{ scene: 'life_toaster_2' }], else: [{ scene: 'life_toaster_3' }] }],
      },
    ],
  },
  {
    id: 'life_toaster_finale',
    when: { all: [actGte(4), free, { var: 'life.toaster_visits', gte: 1 }] },
    atHour: 17,
    chance: 0.05,
    effects: [QUIET_RESET, { scene: 'life_toaster_finale' }],
  },
  {
    id: 'life_block_party',
    when: { all: [onDays(BLOCK_PARTY_DAYS), { faction: 'fac.hood', gte: 20 }, free] },
    once: false,
    cooldownDays: 300,
    atHour: 14,
    effects: [QUIET_RESET, { scene: 'life_block_party' }],
  },
  {
    id: 'life_landlord_cameras',
    when: { all: [renting, actGte(2), actLte(3), free, { day: true, gte: dayOf(2002, 8, 1) }] },
    atHour: 19,
    chance: 0.03,
    effects: [QUIET_RESET, { scene: 'life_landlord_cameras' }],
  },
  {
    id: 'life_landlord_footage',
    when: { all: [{ flag: 'life.landlord_footage' }, actGte(3), free, { seen: 'life_landlord_cameras' }] },
    atHour: 9,
    chance: 0.04,
    effects: [QUIET_RESET, { scene: 'life_landlord_footage' }],
  },
  {
    id: 'life_neighbor_scam_victim',
    when: { all: [{ var: 'w.enclosure', gte: 2 }, actGte(2), actLte(3), free] },
    atHour: 16,
    chance: 0.04,
    effects: [QUIET_RESET, { scene: 'life_neighbor_scam_victim' }],
  },
]

export default defineContent({ scenes, triggers })
