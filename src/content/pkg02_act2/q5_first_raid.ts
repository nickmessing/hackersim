/**
 * PKG-02 — main_a2_q5_first_raid: the first raid & first blood by neglect (bible §6.B, CP-B4).
 *
 * The first raid must be the AUTHORED one — never a stray engine raid — so Act II arms `sys.no_raids`
 * (in q0a) and trig_first_raid clears it when the beat fires. The target is computed from flags and
 * neglect into `a2.raid_target`, then the scene branches per target. Being jailed opens the Bureau
 * flip (scene a2_jail). No `dead` outcome exists in Act II; first blood is arrest at most.
 *
 * Pacing: the quest autoStarts once Mom's crisis resolves. Two weeks later the scene smells it coming
 * (a2_raid_rumble); the raid itself fires as soon as heat or a friend's exposure crosses the line, or
 * — the clean-player fallback — when Deadline's courthouse tip lands ~4 months later (a2_raid_tipoff).
 *
 * Engine note: no argmin over "highest exposure then lowest affinity", so the selector is a fixed
 * priority cascade (default Corvid → byteme if used → Jax if exposed/alone → player if hot/raided).
 *
 * PKG-02 owns: main_a2_q5_first_raid, scenes a2_the_raid / a2_jail / a2_raid_rumble / a2_raid_tipoff, trig_first_raid, a2.raid_target,
 * a2.first_blood / .first_raid_resolved / .clean_raid / .solidarity / .took_jax_fall / .informant_seed,
 * npc.jax fate (free/arrested), npc.byteme fate (arrested_young), npc.corvid.charged (flag),
 * fac.bureau.informant / .informant_secret / .on_radar, npc.reyes/.calderon {met},
 * a2.talked_to_calderon / .byteme_named_you / .jail_beating, obligation pkg02_act2_bail_bond.
 *
 * Fail branches (REDESIGN_V2 §D) — every one still reaches `resolved` (a2.first_raid_resolved):
 *  - player stonewall / panic script / run: each fails its own way into `player_taken` — booked
 *    (Prints on File scar), a bail-bond obligation that the Bureau flip quietly erases, the raid and
 *    the cell. Failing the run also costs you a knee (Bad Knee scar).
 *  - talking Calderon down for Jax: she thanks you for the lead (a2.talked_to_calderon, on_radar).
 *  - coaching byteme: he repeats you to the officer, word for word (a2.byteme_named_you).
 *  - rallying the '94 wipe: holes in the wall, and three days later the board asks who talked
 *    (a2_loft_who_talked, q5b_raid_fallout.ts).
 *  - the jail cellmate: a beating, unless your name travels (cred 30+).
 * Reyes reads most of this back to you at the hinge (q7).
 */
import { defineContent } from '@/engine/registry'
import type { Effect, QuestDef, SceneDef, TriggerDef } from '@/engine/types'
import { SCAR } from './scars'

const BAIL = 'pkg02_act2_bail_bond'

// ── The first-raid target selector (bible §6.B). Later entries override earlier. ────────────────
const selector: Effect[] = [
  { flag: 'a2.raid_target', set: 'corvid' },
  {
    if: { all: [{ flag: 'npc.byteme.used' }, { npc: 'byteme', fateNot: ['arrested_young', 'dead', 'turns'] }] },
    then: [{ flag: 'a2.raid_target', set: 'byteme' }],
  },
  {
    if: { all: [{ any: [{ flag: 'npc.jax.exposed' }, { flag: 'npc.jax.alone' }] }, { npc: 'jax', fateNot: ['arrested', 'flipped', 'dead', 'gone'] }] },
    then: [{ flag: 'a2.raid_target', set: 'jax' }],
  },
  {
    if: { any: [{ flag: 'sys.raided' }, { stat: 'heat', gte: 40 }] },
    then: [{ flag: 'a2.raid_target', set: 'player' }],
  },
]

const target = (who: string): { flag: string; eq: string } => ({ flag: 'a2.raid_target', eq: who })

/** CP-B4 Corvid fail (bible: npc.corvid.charged + a2.informant_seed), and the board asks who talked. */
const wallHadHoles: Effect[] = [
  { flag: 'npc.corvid.charged' },
  { flag: 'a2.informant_seed' },
  { faction: 'fac.loft', add: -4 },
  { stat: 'stress', add: 5 },
  { scene: 'a2_loft_who_talked', delayHours: 72 },
]

const raidScene: SceneDef = {
  id: 'a2_the_raid',
  channel: 'dialog',
  title: 'The Men in Jackets',
  start: 'hits',
  nodes: {
    hits: {
      speaker: 'narrator',
      text: [
        'They come at dawn, the way they always do, because dawn is when people are slow and honest. A grey sedan, then two, then a van with the back doors already open. Windbreakers with three-letter acronyms. A local detective with a cheap coat and expensive eyes, and behind her a federal agent in sensible shoes, watching, not speaking, writing in a notebook she actually uses.',
        { if: target('player'), text: 'They come for YOU. Your name, your door, your rig. The heat you\'ve been carrying finally set off the smoke alarm across town.' },
        { if: { all: [target('player'), { flag: 'a2.bank_bloom' }] }, text: 'Clipped to the warrant — you\'ll find out later — is a Meridian Trust fraud reference number from the night your mother was in the hospital. The corkboard remembered.' },
        { if: target('jax'), text: 'They come for Jax. His name was in a file it should never have touched, and files like that get read out loud eventually. You get there in time to see him on the sidewalk in his socks.' },
        { if: { all: [target('jax'), { flag: 'a2.jax_debt_defaulted' }] }, text: 'The complaint that opened his file, it turns out, was filed by a Millgate firm called Tallow & Keel Recovery. They never forget an account.' },
        { if: { all: [target('jax'), { flag: 'a2.jax_left_holding' }] }, text: 'They couldn\'t find you, so they found him. He looks at you across the street like he always knew it would go this way.' },
        { if: target('byteme'), text: 'They come for byteme — Kevin, sixteen, in a Metroid shirt, blinking in the flashers like he\'s been woken from the best dream of his life into the worst morning of it. He used a tool you handed him.' },
        { if: { all: [target('byteme'), { flag: 'a2.mirror_suspect', eq: 'byteme' }, { flag: 'a2.mirror_accused' }] }, text: 'The last real thing you said to him, weeks ago, was an accusation. He hasn\'t paged you since. He looks for you in the crowd anyway.' },
        { if: target('corvid'), text: 'They come for the board. For Corvid. Nobody\'s "exposed," exactly — the Loft just got too loud to ignore, and she\'s the name on everyone\'s lips, so she\'s the name on the warrant.' },
      ],
      effects: [
        { npc: 'calderon', met: true },
        { npc: 'reyes', met: true },
      ],
      next: 'cp_b4',
    },
    cp_b4: {
      speaker: 'player',
      text: 'This is the moment the scene has been telling stories about since before you arrived. What you do now becomes one of those stories.',
      choices: [
        // ── Player at your door ──────────────────────────────────────────────
        {
          text: 'Wipe everything and stonewall. Name, and nothing else.',
          tag: '[Stonewall]',
          if: target('player'),
          check: {
            skill: 'opsec',
            dc: 16,
            success: 'player_clean',
            fail: 'stonewall_fail',
            successEffects: [{ flag: 'a2.clean_raid' }, { faction: 'fac.loft', add: 15 }],
            failEffects: [{ stat: 'stress', add: 6 }],
          },
        },
        {
          text: 'Trigger the panic script — scrub the disks before they\'re unplugged.',
          tag: '[Panic script]',
          if: target('player'),
          check: {
            skill: 'systems',
            dc: 16,
            success: 'player_clean',
            fail: 'panic_fail',
            successEffects: [{ flag: 'a2.clean_raid' }, { faction: 'fac.loft', add: 15 }],
            failEffects: [{ stat: 'stress', add: 6 }],
          },
        },
        {
          text: 'Pull the drive, go out the bathroom window, and run.',
          tag: '[Run]',
          if: target('player'),
          check: {
            skill: 'fitness',
            dc: 15,
            bonuses: [{ if: { trait: 'gym_rat' }, add: 2, label: '+2 (Gym Rat)' }],
            success: 'player_ran',
            fail: 'fence',
            successEffects: [{ flag: 'a2.clean_raid' }, { faction: 'fac.loft', add: 10 }, { stat: 'heat', add: 5 }],
            failEffects: [{ trait: SCAR.badKnee }, { stat: 'health', add: -18 }, { stat: 'heat', add: 5 }],
          },
        },
        {
          text: 'Let Mom answer the door and lie to the men in jackets.',
          tag: '[Family]',
          if: target('player'),
          req: { flag: 'life.family_shield' },
          reqText: 'Requires: your family covered for you (life_family_finds_gear)',
          goto: 'player_shield',
        },
        // ── Jax ──────────────────────────────────────────────────────────────
        {
          text: 'Rush the scene and take the fall for him. Loudly, publicly, on the record.',
          tag: '[Take the fall]',
          if: target('jax'),
          effects: [
            { flag: 'a2.took_jax_fall' },
            { faction: 'fac.loft', add: 25 },
            { npc: 'jax', fate: 'free', affinity: 30 },
          ],
          goto: 'jax_fall',
        },
        {
          text: 'Stay back. Let him face it. It was his job, his risk.',
          tag: '[Stay back]',
          if: target('jax'),
          effects: [
            { npc: 'jax', fate: 'arrested', affinity: -10 },
            { news: 'jax_arrest' },
          ],
          goto: 'jax_taken',
        },
        {
          text: 'Walk up to the detective and talk her down. The file is thin; Jax is a nobody.',
          tag: '[Talk her down]',
          if: target('jax'),
          check: {
            skill: 'social',
            dc: 16,
            bonuses: [{ if: { flag: 'npc.jax.covered' }, add: 2, label: '+2 (you already cleaned up his trail once)' }],
            success: 'jax_talked',
            fail: 'jax_talk_fail',
            successEffects: [{ npc: 'jax', fate: 'free', affinity: 15 }, { flag: 'npc.jax.protected' }, { faction: 'fac.loft', add: 10 }],
            // Fail: Jax is still arrested (bible) — and the detective now has your name as well.
            failEffects: [
              { npc: 'jax', fate: 'arrested', affinity: -4 },
              { news: 'jax_arrest' },
              { flag: 'fac.bureau.on_radar' },
              { flag: 'a2.talked_to_calderon' },
              { stat: 'heat', add: 8 },
            ],
          },
        },
        // ── byteme ───────────────────────────────────────────────────────────
        {
          text: 'Lawyer him up. Spend the money, keep the kid clean.',
          tag: '[Pay $2000]',
          if: target('byteme'),
          req: { stat: 'money', gte: 2000 },
          reqText: 'Requires: $2000 for a real lawyer',
          effects: [{ money: -2000 }, { npc: 'byteme', affinity: 10 }],
          goto: 'byteme_safe',
        },
        {
          text: 'Get to him first. Coach him to say nothing at all.',
          tag: '[Coach him]',
          if: target('byteme'),
          check: {
            skill: 'social',
            dc: 14,
            success: 'byteme_safe',
            fail: 'byteme_coach_fail',
            successEffects: [{ npc: 'byteme', affinity: 6 }],
            // Fail: still arrested_young (bible) — and your name ends up in his statement.
            failEffects: [
              { npc: 'byteme', fate: 'arrested_young', affinity: -4 },
              { flag: 'fac.bureau.on_radar' },
              { flag: 'a2.byteme_named_you' },
              { stat: 'heat', add: 10 },
            ],
          },
        },
        {
          text: 'Take the fall for him. He\'s a kid. You\'re not.',
          tag: '[Take the fall]',
          if: target('byteme'),
          effects: [{ npc: 'byteme', affinity: 12 }, { faction: 'fac.loft', add: 15 }],
          goto: 'byteme_you_fall',
        },
        {
          text: 'Do nothing. Let his mother find out from the officers.',
          tag: '[Stay back]',
          if: target('byteme'),
          goto: 'byteme_young',
        },
        // ── Corvid / the board ───────────────────────────────────────────────
        {
          text: 'Organize the \'94 move — the whole scene wipes in solidarity, tonight.',
          tag: '[Rally]',
          if: target('corvid'),
          check: {
            skill: 'social',
            dc: 14,
            success: 'corvid_solidarity',
            fail: 'corvid_charged',
            successEffects: [{ faction: 'fac.loft', add: 30 }, { flag: 'a2.solidarity' }],
            failEffects: wallHadHoles,
          },
        },
        {
          text: 'Kill the board\'s uplink and push the \'94 signal over every relay at once.',
          tag: '[Pull the plug]',
          if: target('corvid'),
          check: {
            skill: 'networking',
            dc: 15,
            success: 'corvid_solidarity',
            fail: 'corvid_charged',
            successEffects: [{ faction: 'fac.loft', add: 30 }, { flag: 'a2.solidarity' }],
            failEffects: wallHadHoles,
          },
        },
        {
          text: 'Keep your own head down. It\'s her board, her problem.',
          tag: '[Stay back]',
          if: target('corvid'),
          effects: [{ flag: 'npc.corvid.charged' }, { faction: 'fac.loft', add: -10 }],
          goto: 'corvid_alone',
        },
      ],
    },
    // ── Outcomes ────────────────────────────────────────────────────────────
    stonewall_fail: {
      speaker: 'narrator',
      text: [
        'You give them your name and nothing else, exactly the way Deadline taught you, and for eleven minutes it holds. Then the wipe you triggered finishes half a beat too late — one drive still spinning when a gloved hand steadies the tower — and the room fills with the specific quiet of professionals who have just found the thing they came for.',
        'Calderon reads your silence like a page she\'s seen a hundred times. "Everybody\'s brave until the drive doesn\'t finish," she says, not unkindly, and nods at the uniform with the evidence bags.',
      ],
      next: 'player_taken',
    },
    panic_fail: {
      speaker: 'narrator',
      text: [
        'The panic routine runs — you watch the little progress bar you built for exactly this morning — and it is, cruelly, four percent too slow. They unplug the tower with the bar still crawling, and everything you meant to erase goes into the van intact, warm, and labelled.',
        'You wrote that script at two in the morning telling yourself you\'d never need it. You needed it. It wasn\'t enough.',
      ],
      next: 'player_taken',
    },
    fence: {
      speaker: 'narrator',
      text: [
        'You go out the bathroom window with the drive in your teeth, exactly like the story you always told it as — right up to the fence. The fence is higher than the story. Your foot doesn\'t clear it, your knee finds the top rail, and the sound it makes is one you\'ll be hearing on cold mornings for the rest of your life.',
        'You go down in the alley in a heap of pain and adrenaline, and the hands that pick you up are wearing gloves. They keep the drive. They keep you. The knee they leave you, more or less.',
      ],
      next: 'player_taken',
    },
    player_taken: {
      speaker: 'narrator',
      text: [
        'They read you your rights in the fog while the neighbors watch from behind curtains. Downtown, they take your photograph and roll each of your fingers across a scanner, one at a time, with the bored patience of people who do this all day. The ink is imaginary now; the record is not. You are in the system, and the system is very good at faces.',
        'Bail is set — not enormous, but more than you have in the account after everything — and posting it means a bondsman on Harbor Street who charges by the week and never, ever forgets a name.',
        'It\'s not the end of anything. It\'s the start of a different thing — a cell, a phone call, and a federal agent who, it turns out, has a proposal.',
      ],
      effects: [
        { raid: true },
        { jail: 3 },
        { flag: 'fac.bureau.on_radar' },
        { trait: SCAR.printsOnFile },
        { obligation: { id: BAIL, label: 'Harbor Street bail bond (weekly)', perDay: 12, days: 200 } },
        { scene: 'a2_jail', delayHours: 2 },
      ],
      next: 'resolved',
    },
    jax_talk_fail: {
      speaker: 'calderon',
      text: [
        'You walk up talking, calm and specific, and Calderon lets you finish — that\'s the trap. When you\'re done she tilts her head. "So you know an awful lot about a job you say he did alone." She writes something down. It has your name at the top of it. "He\'s still coming with us. And now, so are you — later. When it\'s convenient for me."',
        'They put Jax in the van. He looks at you with something worse than blame: gratitude, for trying. The federal agent in the sensible shoes writes down that you inserted yourself. That will matter.',
      ],
      effects: [{ news: 'jax_arrest' }],
      next: 'resolved',
    },
    byteme_coach_fail: {
      speaker: 'narrator',
      text: [
        'You get to Kevin first and drill it into him — say nothing, nothing, not even to be polite. And he tries. He really tries. But he\'s sixteen and terrified and desperate to be helpful to the nice adult with the badge, and when she asks who taught him, the coaching comes back out of him in a rush, your exact words, your exact name.',
        '"He was just repeating what somebody told him," Calderon says, almost gently, closing her notebook on your name. They take the kid anyway. His mother arrives as the van doors shut, and the look she gives you is one you\'ll cross streets to avoid for years.',
      ],
      next: 'resolved',
    },
    player_clean: {
      speaker: 'narrator',
      text: [
        'By the time the last disk is out of the tower it\'s a paperweight — nothing on it but zeros and a rude message you left for exactly this occasion. You answer every question with your name and nothing else, the way Deadline taught you, the way Corvid organized in \'94.',
        'The detective — Calderon, her card says — looks almost impressed. The federal agent writes something down and doesn\'t. They leave with a van full of nothing, and the whole Row hears you didn\'t crack.',
      ],
      next: 'resolved',
    },
    player_ran: {
      speaker: 'narrator',
      text: [
        'You are out the bathroom window with the drive in your teeth before the first knock finishes. Fire escape, alley, a fence you have no business clearing, and then you\'re three blocks away in a laundromat, sweating into a stranger\'s dryer heat, with the only copy of anything that matters in your pocket.',
        'They take the tower, the monitor and your good keyboard. They take nothing that can hurt anyone. By noon the story on the Row is that you vaulted a fence like a cat, and by evening it\'s two fences, and a dog.',
      ],
      next: 'resolved',
    },
    jax_talked: {
      speaker: 'calderon',
      text: [
        'You walk straight up to the detective in the cheap coat and talk — calm, specific, boring on purpose. A thin file. A kid with a sick sister. A client who is the actual story, if she ever wants a real one.',
        '"You\'re either his lawyer or his idiot," Calderon says. She studies you a long moment, then waves the uniform off Jax. "I\'ve got a budget of nothing and bigger fish. He walks. You, I\'m going to remember." She hands you her card. It has coffee on it.',
      ],
      next: 'resolved',
    },
    player_shield: {
      speaker: 'mom',
      text: [
        'Your mother meets them at the door in her robe with a cup of tea and a lie so smooth it belongs in a museum. "My child? A computer criminal?" She laughs at them, warmly, and offers them cookies, and describes a completely fictional honor-roll student who volunteers at the library.',
        'They leave confused and slightly hungry. Later she puts the tea down in front of you without a word, and you understand that she has always known exactly who you are, and decided a long time ago to be on your side about it.',
      ],
      effects: [{ faction: 'fac.loft', add: 10 }, { stat: 'mood', add: 6 }],
      next: 'resolved',
    },
    jax_fall: {
      speaker: 'narrator',
      text: [
        'You do the loudest, dumbest, bravest thing you know how to do: you walk into the middle of it and say it was you. All of it. You make it true enough to hold, and you let them put the cuffs on your wrists instead of his.',
        'Jax stands on the sidewalk in his socks and watches them take you, and the sound he makes is not one you will forget. Ten days, they say. Ten days is nothing. Ten days is everything. He will owe you forever, and he will spend the rest of his life trying to pay it back in pizza and showing up at 3 a.m. for anyone but himself.',
      ],
      effects: [{ jail: 10 }, { flag: 'a2.took_a_fall' }, { scene: 'a2_jail', delayHours: 2 }],
      next: 'resolved',
    },
    jax_taken: {
      speaker: 'narrator',
      text: [
        'You stay on the far side of the street where it\'s safe, and you watch your best friend since sixth grade fold into the back of a van. He looks for you in the crowd. You let him not find you.',
        'It was his job. It was his risk. You tell yourself that on a loop for a long time, and it never once helps. LOCAL MAN CHARGED IN DATA THEFT, the paper will say. His mother keeps his room exactly as it was.',
      ],
      next: 'resolved',
    },
    byteme_safe: {
      speaker: 'narrator',
      text: [
        'You get between the kid and the worst version of his morning. A lawyer, or just the right words at the right moment — "you say nothing, Kevin, nothing, not even to be polite" — and the case against a scared sixteen-year-old who technically did very little quietly falls apart.',
        'He calls you that night, for once not in a panic. "i didn\'t say anything," he types. "just like you said." Then, after a while: "i\'m gonna be more careful. i mean it this time." Maybe he even does. One day he\'s going to be better than you.',
      ],
      effects: [{ log: 'You kept byteme out of the system. The kid gets another chance to grow careful.', kind: 'good' }],
      next: 'resolved',
    },
    byteme_you_fall: {
      speaker: 'narrator',
      text: [
        'You put yourself between the kid and the van. It costs you ten days and a fresh line on a record that\'s getting crowded, and it buys Kevin a future he doesn\'t fully understand you paid for.',
        'He visits once, white-faced, and can\'t look at you through the glass. "why," he types on a scrap of paper he holds up. Because somebody should have done it for you, you think, and didn\'t.',
      ],
      effects: [{ jail: 10 }, { flag: 'a2.took_a_fall' }, { scene: 'a2_jail', delayHours: 2 }],
      next: 'resolved',
    },
    byteme_young: {
      speaker: 'narrator',
      text: [
        'You do nothing, and nothing turns out to be a decision with a body count. A scared kid says too much to friendly-seeming adults, the way scared kids do, and by noon Kevin Pham is a case number and his mother is a woman who won\'t look at you in the street ever again.',
        'Arrested before he was old enough to vote. Your recklessness rubbed off on him, and then you weren\'t there to catch what fell.',
      ],
      effects: [{ npc: 'byteme', fate: 'arrested_young', affinity: -8 }],
      next: 'resolved',
    },
    corvid_solidarity: {
      speaker: 'narrator',
      text: [
        'You get on every channel you have and you say one word — the old word, the \'94 word — and the scene does the thing it exists to do. Forty drives wipe in a single night. Forty people say the same nothing to forty different officers. A wall of quiet that no warrant can get a grip on.',
        'When it\'s over, Corvid finds you. She doesn\'t hug you — she\'s not built that way — but she puts a hand on your shoulder and says "thank you," exactly once, and means it more than anyone ever has. The board survives. The commons holds.',
      ],
      effects: [{ log: 'You organized the solidarity wipe. Corvid stays free. The commons holds.', kind: 'good' }],
      next: 'resolved',
    },
    corvid_charged: {
      speaker: 'narrator',
      text: [
        'You try to rally the scene and it doesn\'t take — half of them are too scared, and one of them, somewhere, is already deciding that the safest thing to be is useful to the men in jackets. The wipe is patchy. The wall has holes.',
        'They leave Corvid facing charges, and they leave a crack in the scene that someone is going to widen. She keeps running the board like nothing\'s wrong, which is how you know everything is.',
      ],
      next: 'resolved',
    },
    corvid_alone: {
      speaker: 'narrator',
      text: [
        'You keep your own head down and your own drives clean and you let the board be somebody else\'s problem. It\'s the smart move. It\'s the move Switch would make, and be right about.',
        'They leave Corvid facing charges. She looks at you once, across the street, and there\'s no anger in it, which is worse. She just stops saving you a seat.',
      ],
      next: 'resolved',
    },
    resolved: {
      speaker: 'narrator',
      text: 'By the time the vans are gone, the scene is a different thing than it was at dawn. Everyone knows there\'s a before and an after now, and everyone knows which side of the line you stood on. The city writes it down. So does the Row.',
      effects: [
        { flag: 'a2.first_raid_resolved' },
        { flag: 'a2.first_blood' },
        { news: 'first_raid_public' },
        { var: 'w.exposure', add: 1 },
      ],
    },
  },
}

const jailScene: SceneDef = {
  id: 'a2_jail',
  channel: 'dialog',
  title: 'Holding',
  start: 'cell',
  nodes: {
    cell: {
      speaker: 'narrator',
      text: [
        'The cell smells like disinfectant and other people\'s worst days. There\'s a phone that takes coins you don\'t have, a bench, a cellmate reading a paperback with no cover, and a lot of time to think about the exact sequence of choices that put you here.',
        { if: { flag: 'a2.took_a_fall' }, text: 'You are here on purpose, which is a strange thing to be in a place like this. Somebody else is sleeping in their own bed tonight because of it. You hold onto that. It helps less than you thought, and more than nothing.', else: 'Your rig is in an evidence locker with a tag on it. So, in a sense, are you.' },
        'The clock stops for you now — the world outside will keep whatever it\'s holding until you\'re back. Somewhere, though, the work you left undone waits, patient as rust.',
      ],
      next: 'choices',
    },
    choices: {
      speaker: 'player',
      text: 'Days are long in here. You can make them count, or just survive them.',
      choices: [
        {
          text: 'Get to know your cellmate. Everyone in here knows somebody.',
          tag: '[Network]',
          check: {
            skill: 'social',
            dc: 12,
            bonuses: [{ if: { stat: 'cred', gte: 30 }, add: 2, label: '+2 (your name travels in here)' }],
            success: 'cellmate_win',
            fail: 'cellmate_fail',
            successEffects: [{ stat: 'cred', add: 4 }, { npc: 'switch', affinity: 3 }],
            // Fail: a beating your reputation can't buy you out of, unless your name already carries.
            failEffects: [
              { if: { stat: 'cred', gte: 30 }, then: [{ stat: 'stress', add: 6 }], else: [{ stat: 'health', add: -20 }, { stat: 'stress', add: 8 }, { flag: 'a2.jail_beating' }] },
            ],
          },
        },
        {
          text: 'Keep your head down and count the ceiling tiles.',
          effects: [{ stat: 'stress', add: 4 }],
          goto: 'quiet',
        },
        {
          text: 'The agent with the notebook is asking to see you. Hear her out.',
          goto: 'reyes',
        },
      ],
    },
    cellmate_win: {
      speaker: 'narrator',
      text: 'Your cellmate turns out to be connected in the small, real way that matters — a name to drop, a favor banked for later, a story about you that\'ll travel the right channels. Cred is cred, and in here it\'s the only currency that spends.',
      next: 'reyes_offer',
    },
    cellmate_fail: {
      speaker: 'narrator',
      text: [
        { if: { stat: 'cred', gte: 30 }, text: 'Your cellmate looks at you, decides your name is worth more intact than broken, and turns a shoulder. You spend the rest of your stay being very interested in the ceiling. It\'s fine. Your reputation walked in ahead of you and bought you a pass.', else: 'You misjudge the room by exactly the amount that gets you hurt. It happens fast, in a corner the camera doesn\'t love, and afterward nobody saw anything. You come out of holding with a limp, a lesson, and a new understanding of how little your outside self is worth in here.' },
      ],
      next: 'reyes_offer',
    },
    quiet: {
      speaker: 'narrator',
      text: 'You do the time the old-fashioned way: quietly, carefully, giving nobody a reason to remember your face. It works. The days blur into one long grey afternoon, and then, eventually, they end.',
      next: 'reyes_offer',
    },
    reyes: {
      speaker: 'reyes',
      text: [
        'Agent Dana Reyes sits down across the little steel table like she has all the time in the world, which, from where you\'re sitting, she does. Sensible shoes. A notebook she actually writes in. The particular calm of someone who has watched a great many people talk themselves into and out of a great many rooms like this one.',
        '"I came to this city to catch the people hollowing it out," she says. "I keep finding out my own office is renting their tools. You\'re small. You\'re smart. You\'re exactly the kind of person I\'d rather turn than cage." She slides a card across the table. "Help me, and this — all of this — goes away."',
      ],
      next: 'reyes_offer',
    },
    reyes_offer: {
      speaker: 'reyes',
      text: '"I need eyes inside," Reyes says, quieter now. "Not on your friends — on the ones eating your friends. Aperture. The money. Say the word and you walk out of here an asset instead of an inmate. Nobody has to know. That part\'s important. Nobody can know."',
      choices: [
        {
          text: 'Flip. Become her asset. Nobody can ever know.',
          tag: '[Flip]',
          effects: [
            { flag: 'fac.bureau.informant' },
            { flag: 'fac.bureau.informant_secret' },
            { flag: 'a2.spine', set: 'bureau' },
            { faction: 'fac.bureau', add: 20 },
            { faction: 'fac.loft', add: -6 },
            { removeObligation: BAIL },
            { quest: 'fac_bureau_q1_approach', start: true },
          ],
          goto: 'flipped',
        },
        {
          text: 'Take the card. Decide later. (Keep the door open.)',
          effects: [{ flag: 'a2.informant_seed' }],
          goto: 'later',
        },
        {
          text: '"I don\'t rat. Not for a badge, not for a cell. We\'re done here."',
          tag: '[Refuse]',
          effects: [{ faction: 'fac.loft', add: 8 }, { npc: 'reyes', affinity: -4 }],
          goto: 'refused',
        },
      ],
    },
    flipped: {
      speaker: 'narrator',
      text: [
        'You say the word. Reyes doesn\'t smile — she just nods, once, like a door closing on one life and opening on another, and makes a note. By morning the charges are a clerical error. By afternoon you\'re on the street with a card in your pocket and a Tuesday phone call you\'ll come to dread.',
        'You\'re her asset now. The scene must never, ever know. The bail bond that was going to bleed you weekly is gone too, quietly, the way everything inconvenient goes away for people Reyes decides to keep. You tell yourself you\'re doing it to eat the real monster. You\'ll get very good at telling yourself that.',
      ],
      effects: [{ log: 'You flipped for the Bureau. This is your Act III spine now — and a secret that could get you killed.', kind: 'story' }],
    },
    later: {
      speaker: 'narrator',
      text: 'You take the card and say nothing that binds you. Reyes lets it go, unbothered — she plays a long game. "The offer keeps," she says, standing. "They usually come back to it. Hunger has a way of making a person reasonable." You keep the card. You hate that you keep the card.',
    },
    refused: {
      speaker: 'reyes',
      text: '"Fair enough," Reyes says, and there\'s something almost like respect in it. "It\'s a rare spine that turns down its own get-out-of-jail card. I\'ll remember you had one." She gathers her notebook. "For what it\'s worth — I hope you\'re right about your friends. In my experience, everybody rats eventually. It\'s just a question of the price and the day."',
    },
  },
}

/** Two weeks after the crisis: the scene can smell it coming. */
const rumble: SceneDef = {
  id: 'a2_raid_rumble',
  channel: 'forum',
  board: 'general',
  title: 'anyone else seeing grey sedans on sodium row??',
  from: 'byteme',
  pause: false,
  start: 'post',
  nodes: {
    post: {
      speaker: 'byteme',
      text: [
        'like 3 days in a row now. same car. guy just sits there eating a sandwich for 4 hours. nobody eats a sandwich for 4 hours',
        '— byteme · "undetectable" since 2001',
      ],
      next: 'replies',
    },
    replies: {
      speaker: 'Loft BBS',
      text: [
        'switch: could be a guy who likes sandwiches. could be the new federal field office with a fresh budget and nothing to show for it yet. place your bets.',
        'deadline: every sedan is a cop until proven a dentist. wipe what you don\'t need. back up your LIFE, not your data. i will keep saying it until one of you listens.',
        'corvid: Nobody panic. Nobody get cute, either. If anything happens, you know the word.',
      ],
      choices: [
        { text: 'Post: "Noted. Cleaning house tonight."', effects: [{ stat: 'heat', add: -4 }, { faction: 'fac.loft', add: 1 }], goto: 'done' },
        { text: 'Post: "It\'s a guy who likes sandwiches. Relax."', effects: [{ npc: 'byteme', affinity: -1 }], goto: 'done' },
        { text: 'Say nothing. Check your own street.', tag: '[OpSec]', goto: 'done' },
      ],
    },
    done: {
      speaker: 'narrator',
      text: 'The thread scrolls off the front page in a day. The sedan does not.',
    },
  },
}

/** The date fallback (~120 days after the crisis): the raid comes for a clean player too. */
const tipoff: SceneDef = {
  id: 'a2_raid_tipoff',
  channel: 'chat',
  title: 'deadline',
  from: 'deadline',
  pause: true,
  start: 'msg',
  nodes: {
    msg: {
      speaker: 'deadline',
      text: [
        'kid. my old contact at the courthouse says there\'s paper moving. search warrants, plural, loft-adjacent.',
        'i don\'t know whose door. nobody ever knows whose door until it\'s theirs.',
        'if you have friends, now\'s when you find out what kind.',
      ],
      choices: [
        { text: '"Thanks, Theo. I owe you."', effects: [{ npc: 'deadline', affinity: 3 }] },
        { text: '"How long do we have?"', goto: 'how_long' },
      ],
    },
    how_long: {
      speaker: 'deadline',
      text: 'in \'94 it was nine hours. assume less. they learned.',
    },
  },
}

const trigFirstRaid: TriggerDef = {
  id: 'trig_first_raid',
  once: true,
  priority: 40,
  when: {
    all: [
      { var: 'act', eq: 2 },
      { quest: 'main_a2_q5_first_raid', stage: 'bracing' },
      { seen: 'a2_raid_rumble' },
      { jailed: false },
      {
        any: [
          { flag: 'sys.raided' },
          { stat: 'heat', gte: 40 },
          { flag: 'npc.jax.exposed' },
          { flag: 'npc.jax.alone' },
          { flag: 'npc.byteme.used' },
          { all: [{ flag: 'fac.aperture.client' }, { stat: 'heat', gte: 30 }] },
          { seen: 'a2_raid_tipoff' },
        ],
      },
    ],
  },
  effects: [...selector, { clearFlag: 'sys.no_raids' }, { quest: 'main_a2_q5_first_raid', stage: 'raid' }, { scene: 'a2_the_raid', delayHours: 5 }],
}

const quest: QuestDef = {
  id: 'main_a2_q5_first_raid',
  title: 'The Men in Jackets',
  kind: 'main',
  act: 2,
  summary:
    'Heat has a way of setting off alarms across town. Somebody in your orbit is about to get raided, and the target is whoever you left most exposed. How you respond becomes scene legend.',
  autoStart: { all: [{ var: 'act', eq: 2 }, { flag: 'a2.mom_crisis_resolved' }] },
  priority: 30,
  rewards: 'First blood · scene standing',
  start: 'bracing',
  stages: {
    bracing: {
      text: 'The scene is holding its breath. Grey sedans, long lunches, a new federal office with a budget to justify. When it lands, be ready to answer for who you protected and who you didn\'t.',
      hint: 'The raid comes when your heat (40+) or a friend\'s exposure crosses the line — or, if you\'ve stayed clean, within about four months anyway. Loyalty quests and paying down heat change who it hits.',
      onEnter: [{ scene: 'a2_raid_rumble', delayHours: 14 * 24 }, { scene: 'a2_raid_tipoff', delayHours: 118 * 24 }],
      objectives: [
        {
          id: 'raid',
          text: 'Weather the first raid',
          when: { never: true },
          hint: 'It will come. Keep your friends close and your drives wiped.',
        },
      ],
    },
    raid: {
      text: 'Dawn. Sedans. Windbreakers with three letters on the back. It\'s happening.',
      hint: 'The raid dialog auto-pauses. Every target has a skill route and a sacrifice route.',
      objectives: [
        { id: 'settle', text: 'Answer the raid', when: { flag: 'a2.first_raid_resolved' }, hint: 'See the raid dialog through to the end.' },
      ],
      onComplete: [{ quest: 'main_a2_q6_mira_wall', start: true }],
    },
  },
}

export default defineContent({
  quests: [quest],
  scenes: [raidScene, jailScene, rumble, tipoff],
  triggers: [trigFirstRaid],
})
