/**
 * PKG-12 — the Loft-family beats: Corvid's dead-man's archive (Loyalty), the last LAN reunion, and
 * the rescue you owe when the board gets marked.
 *
 * `side_corvid_backup` is the writer of `side.corvid_archive` and grants `item.scene_archive`
 * (PKG-00 def). `side_reunion_lan` is the redemption window for a `flipped` Jax (bible §4.1) and
 * the "empty chairs" motif inversion (§6.E). `side_loft_calls_it_in` pays off `fac.loft.marked`
 * (set by PKG-05's `fac_loft_q4_solidarity`).
 */
import { defineContent } from '@/engine/registry'
import type { QuestDef, SceneDef } from '@/engine/types'

// ── side_corvid_backup — Loyalty: Corvid ──────────────────────────────────────

const corvidBackup: QuestDef = {
  id: 'side_corvid_backup',
  title: 'Loyalty: The Dead Drop',
  kind: 'side',
  act: 2,
  giver: 'corvid',
  priority: 8,
  rewards: "Corvid's trust · the scene's insurance",
  summary:
    "Corvid keeps a dead-man's archive: twenty years of the Loft, sealed so it opens only if she can't stop it. She wants to hand you the copy. She wants you to guard it, and never, ever read it. She is watching to see which of those you find harder.",
  autoStart: {
    all: [
      { var: 'act', gte: 2 },
      { var: 'act', lte: 3 },
      { npc: 'corvid', met: true, fateNot: ['exile', 'martyred', 'bought', 'dead'] },
      { faction: 'fac.loft', gte: 25 },
      { day: true, gte: 520 },
    ],
  },
  start: 'entrust',
  stages: {
    entrust: {
      text: "Corvid is trusting you with the scene's insurance policy — a sealed archive of everything the Loft has ever been. Guard it and stay out of it, crack it open, or hand it back and stay clean.",
      onEnter: [{ scene: 'side_corvid_backup_scene' }],
      objectives: [
        {
          id: 'resolve',
          text: "Answer Corvid about the archive",
          when: { flag: 'side.corvid_backup_done' },
          hint: 'Meet her at the Sodium Row back room. Guarding it grants you the sealed archive; reading it costs her trust and the scene\'s.',
        },
      ],
      onComplete: [{ log: "Corvid's archive found a home, for better or worse.", kind: 'story' }],
    },
  },
}

const corvidBackupScene: SceneDef = {
  id: 'side_corvid_backup_scene',
  channel: 'dialog',
  title: 'The Dead Drop',
  from: 'corvid',
  start: 'backroom',
  nodes: {
    backroom: {
      speaker: 'corvid',
      text: [
        "The back room, late, everyone else gone home. Corvid has a hard case on the table between you, the kind musicians use, foam-lined. Inside it is a single drive and a sheet of paper folded in thirds.",
        '"Twenty years," she says. "Every board I ever ran. Member lists. Logs. The \'94 night — who wiped, who didn\'t, who I forgave and who I didn\'t. Grudges. Debts. It\'s all in there, sealed."',
        '"It opens on its own if I go dark — arrest, exile, a bus I don\'t see coming. Until then it stays shut." She slides the case a half inch toward you. "I need it somewhere that isn\'t here. Somewhere they\'d never look. Somewhere I trust."',
        { if: { flag: 'npc.corvid.trusts' }, text: '"You brought me the Aperture thing before you told a soul. That\'s why it\'s you and not Switch. Switch would\'ve read it by Tuesday and sold it by Friday."' },
      ],
      choices: [
        {
          text: '"I\'ll keep it safe. I won\'t open it. You have my word."',
          goto: 'guard',
        },
        {
          text: "\"Twenty years of the scene's secrets, and you want me not to look? Corvid, come on.\"",
          tag: '[Read it]',
          goto: 'read',
        },
        {
          text: '"I can\'t be the one holding that. If it opens with my prints on it, I\'m done. Give it to someone else."',
          tag: '[Refuse]',
          goto: 'refuse',
        },
      ],
    },
    guard: {
      speaker: 'corvid',
      text: [
        "She closes the case and pushes it the rest of the way across the table, and something in her shoulders comes down an inch.",
        '"You won\'t open it," she says. It isn\'t a question, but you can hear her needing it to be true. "Good. Then it\'s not a temptation, it\'s a promise. Promises are the only thing the scene ever actually ran on."',
        "You take it home and put it somewhere no raid will ever think to look, and you do not open it, and every day you don't open it is a small quiet vote for the kind of scene worth keeping. If the worst ever happens to her, the truth won't die in a cell. It'll be with you.",
      ],
      effects: [
        { item: 'scene_archive' },
        { flag: 'side.corvid_archive' },
        { npc: 'corvid', affinity: 12 },
        { faction: 'fac.loft', add: 8 },
        { flag: 'side.corvid_backup_done' },
      ],
    },
    read: {
      speaker: 'corvid',
      text: [
        "You take it, and you open it, and you tell yourself it's due diligence. It isn't. It's twenty years of people who trusted her, laid out for you to read like a phone book of the wounded.",
        "You learn things you can't unlearn: who really flipped in '94, whose name Corvid ate to protect, what Switch did before he was Switch. It's a lot of power. It sits in your chest like a swallowed key.",
        "She finds out. Corvid always finds out. She doesn't shout. She just takes the case back with two fingers, like it's something that died, and the board goes cold around you by morning. Some doors, once you open them, close on you.",
      ],
      effects: [
        { faction: 'fac.loft', add: -20 },
        { npc: 'corvid', affinity: -15 },
        { flag: 'npc.corvid.wary' },
        { flag: 'side.corvid_backup_done' },
      ],
    },
    refuse: {
      speaker: 'corvid',
      text: [
        "She takes it back without a flicker. \"Fair,\" she says. \"Fair. A man who knows what he can carry is worth two who don't.\"",
        "But she doesn't slide it to anyone else while you're there, and you both notice that. The seat she saves you stays saved, a little cooler than it was. Some trust you turn down. It doesn't come back around twice.",
      ],
      effects: [
        { npc: 'corvid', affinity: -4 },
        { flag: 'side.corvid_backup_done' },
      ],
    },
  },
}

// ── side_reunion_lan — one last LAN, with empty chairs ─────────────────────────

const reunionLan: QuestDef = {
  id: 'side_reunion_lan',
  title: 'One Last LAN',
  kind: 'side',
  act: 3,
  priority: 7,
  rewards: 'The scene, one more time · a friend, maybe, brought home',
  summary:
    "Somebody floats the idea in the back room: haul the CRTs up the stairs, run the coax, fire up Quake like it's 1999 and nothing has happened since. It's a beautiful idea. It's also going to have some empty chairs at it, and you'll have to look at every one.",
  autoStart: {
    all: [{ var: 'act', gte: 3 }, { day: true, gte: 1350 }],
  },
  start: 'gather',
  stages: {
    gather: {
      text: "Round everyone up, lug the beige boxes into the Cathode back room, and hold one more LAN. Take a couple of weeks to make it happen — the people worth gathering are hard to pin down now.",
      onEnter: [{ scene: 'side_reunion_lan_scene', delayHours: 24 }],
      objectives: [
        {
          id: 'held',
          text: 'Hold the reunion',
          when: { flag: 'side.lan_held' },
          hint: 'The scene arrives in your mail once the word\'s out. Answer it, then show up for the night itself.',
        },
      ],
      onComplete: [{ log: "One more LAN, for whoever was left to come to it.", kind: 'story' }],
    },
  },
}

const reunionLanScene: SceneDef = {
  id: 'side_reunion_lan_scene',
  channel: 'dialog',
  title: 'One Last LAN',
  from: 'Sodium Row back room',
  start: 'night',
  nodes: {
    night: {
      speaker: 'narrator',
      text: [
        "The back room smells like it did a decade ago: hot dust off warm CRTs, cold pizza, the sweet ozone tang of too many power strips daisy-chained off one long-suffering outlet. Somebody found the old coax. Somebody else found the Quake CDs. The frag count is already a war crime.",
        { if: { npc: 'byteme', fate: ['pro', 'turns'] }, text: 'byteme has capital letters now, and a job, and he still screams like a kettle every time he gets railgunned. Some things hold.' },
        { if: { any: [{ npc: 'jax', fate: 'dead' }, { npc: 'jax', fate: 'arrested' }] }, text: "There's a chair by the door with nobody in it. Everybody knows whose it is. Nobody sits in it. Somebody put a warm can of Mountain Dew in front of it and that's the closest anyone comes to saying his name." },
        { if: { npc: 'byteme', fate: ['dead', 'arrested_young'] }, text: "The smallest chair is empty. Kevin was always the smallest. The screen at his spot still has a login prompt blinking on it, patient, for a kid who isn't coming." },
        { if: { npc: 'deadline', fate: 'passed' }, text: "The worst chair, the one nearest the door, sits empty on purpose. There's a dog under the table who keeps looking at it." },
        { if: { npc: 'mira', fate: 'gone' }, text: "One handle never logged in. You keep glancing at the empty slot on the scoreboard where nyx should be, five rows above everyone, warming her coffee." },
        { if: { trait: 'pkg12_friends_burned_marker' }, text: "There's a spot near the door where Patch used to mirror everyone's tools. He isn't here; he got swept the night your marker got called and nobody came. Switch doesn't look at you. He doesn't have to." },
        "For one night it's enough to be in a warm room full of the sound of dial-up nostalgia and friendly gunfire. For one night nobody's compromised, nobody's a source, nobody's a file.",
      ],
      choices: [
        {
          text: "Bring Jax in from the cold — he flipped, but he was ours first.",
          tag: '[Redeem Jax]',
          if: { npc: 'jax', fate: 'flipped' },
          goto: 'redeem_jax',
        },
        {
          text: "Raise a warm can to the empty chairs, and mean it.",
          goto: 'toast',
        },
        {
          text: "Frag your friends until sunrise and don't say a single true thing all night.",
          goto: 'frag',
        },
      ],
    },
    redeem_jax: {
      speaker: 'jax',
      text: [
        "He almost doesn't come. He stands in the doorway with his coat still on like he's ready to be thrown out, because a man who flipped knows exactly what a room like this owes him.",
        "You go get him. You put a controller in his hand and a bad chair under him and you say, loud enough for everyone, \"He's on my team.\" And that's it. That's the whole ceremony. The scene doesn't forgive with speeches. It forgives by handing you a spawn point.",
        '"I didn\'t—" he starts, and you say "I know," and he shuts up, and by the third map he\'s trash-talking Switch again like nothing was ever broken. It was broken. You just decided it could be un-broken, and so it was.',
      ],
      effects: [
        { npc: 'jax', fate: 'free', affinity: 20 },
        { flag: 'side.jax_redeemed' },
        { faction: 'fac.loft', add: 8 },
        { stat: 'mood', add: 12 },
        { flag: 'side.lan_held' },
      ],
    },
    toast: {
      speaker: 'narrator',
      text: [
        "At some grey hour you pause the game — mutiny, technically — and everyone groans, and then everyone stops groaning, because they can see your face.",
        "You lift a warm can toward the empty chairs. You don't make a speech; the scene doesn't do speeches. You just say the names, the ones who can be said, and let the room hold the ones that can't.",
        "Then somebody unpauses out of sheer emotional cowardice and the war resumes, and it's better for the pause, the way a room is better for a window even when it's dark outside.",
      ],
      effects: [
        { faction: 'fac.loft', add: 6 },
        { faction: 'fac.hood', add: 3 },
        { stat: 'mood', add: 10 },
        { flag: 'side.lan_held' },
      ],
    },
    frag: {
      speaker: 'narrator',
      text: [
        "You don't do the emotional part. You can't, tonight; there's too much of it and not enough of you. So you just play, hard and fast and mean, until the sun comes up grey over the Sound and the last CRT gets switched off with that little collapsing dot.",
        "It was good. It was enough. You carry it out into the morning like a warm cup, and it lasts about as long, and you don't regret a second of the not-talking.",
      ],
      effects: [
        { faction: 'fac.loft', add: 4 },
        { stat: 'mood', add: 8 },
        { flag: 'side.lan_held' },
      ],
    },
  },
}

// ── side_loft_calls_it_in — the rescue you owe ────────────────────────────────

const loftCallsItIn: QuestDef = {
  id: 'side_loft_calls_it_in',
  title: 'The Loft Calls It In',
  kind: 'side',
  act: 3,
  priority: 9,
  rewards: 'A debt to the scene, paid — or not',
  summary:
    "You owe the Loft a rescue, and the Loft is collecting. Patch — a quiet kid who mirrors half the board's tools and never asks for credit — is about to get swept. The word came through Corvid's old channel: your marker, called in.",
  autoStart: {
    all: [{ var: 'act', eq: 3 }, { flag: 'fac.loft.marked' }],
  },
  start: 'call',
  stages: {
    call: {
      text: "Patch is hours from a sweep and the scene is looking at you, because you owe it one. Pull the kid out — cleanly, expensively, or by taking the heat yourself — or decide the debt's cheaper than the risk.",
      onEnter: [{ scene: 'side_loft_calls_it_in_scene' }],
      objectives: [
        {
          id: 'resolve',
          text: 'Answer the marker',
          when: { flag: 'side.loft_call_done' },
          hint: 'It comes as an urgent page. You can sweep Patch\'s trail clean with a check, buy him a lawyer, take the heat onto yourself, or let it go and eat the reputation hit.',
        },
      ],
      onComplete: [{ log: "The marker's called. Whatever you did about it, the scene watched.", kind: 'story' }],
    },
  },
}

const loftCallsItInScene: SceneDef = {
  id: 'side_loft_calls_it_in_scene',
  channel: 'dialog',
  title: 'The Loft Calls It In',
  from: 'switch',
  pause: true,
  start: 'page',
  nodes: {
    page: {
      speaker: 'switch',
      text: [
        "Switch never pages you. That's how you know it's real before you even read it.",
        '"Patch is about to get swept. Tonight, maybe. Kid never hurt anybody — mirrors tools, patches the board, asks for nothing. But his trail\'s a mess and somebody upstream is pulling it." A pause on the line. "You\'ve got a marker with the scene. Corvid\'s old paper. We\'re calling it."',
        { if: { npc: 'corvid', fate: ['martyred', 'exile', 'bought'] }, text: '"Corvid\'s not here to call it herself. So I\'m calling it for her. Same paper. Same debt."' },
        '"So? You a man who pays what he owes, or a man who used to be?"',
      ],
      choices: [
        {
          text: "\"Give me his trail. I'll wipe it so clean the sweep finds a ghost.\"",
          tag: '[Opsec DC 16]',
          check: {
            skill: 'opsec',
            dc: 16,
            bonuses: [
              { if: { item: 'scene_archive' }, add: 2, label: "+2 (you know the scene's old ground)" },
              { if: { flag: 'life.y2k_safehouse' }, add: 2, label: '+2 (a clean place to work from)' },
            ],
            success: 'wiped',
            fail: 'wiped_fail',
          },
        },
        {
          text: "\"Get him the good lawyer. I'll cover it. Tell him not to say one word.\"",
          tag: '[Pay $2,500]',
          req: { stat: 'money', gte: 2500 },
          reqText: 'Requires $2,500',
          goto: 'lawyer',
        },
        {
          text: "\"Point the trail at me instead. I can carry heat the kid can't.\"",
          tag: '[Take the heat]',
          goto: 'took_heat',
        },
        {
          text: "\"I can't risk it right now, Switch. I'm sorry. Tell him to run.\"",
          tag: '[Leave the debt]',
          goto: 'left',
        },
      ],
    },
    wiped: {
      speaker: 'switch',
      text: [
        "You work all night on somebody else's mess, cleaning a trail you didn't make for a kid you've barely met, and by dawn Patch is a smudge nobody can quite bring into focus. The sweep comes, finds a ghost, and moves on.",
        '"Huh," Switch says, when the word comes back clear. "You actually did it." He sounds, for once, like he means the good version. "Debt\'s paid. The scene remembers who pays. That matters more than you think, where this is all going."',
        "Patch never knows it was you. That's the job. That's the whole job.",
      ],
      effects: [
        { faction: 'fac.loft', add: 15 },
        { flag: 'side.loft_debt_paid' },
        { flag: 'side.loft_call_done' },
        { stat: 'stress', add: 6 },
      ],
    },
    wiped_fail: {
      speaker: 'switch',
      text: [
        "You go in fast and you go in tired, and somewhere in the middle of somebody else's mess you lose the thread. Not caught — you're better than that — but you can't clean what you can't hold, and the sweep comes while you're still in it.",
        "They take Patch at 4 a.m. Quiet, no drama, a kid in a hoodie folded into a grey car. The board goes silent for a day the way it does when everyone's checking their own trail at once.",
        '"You tried," Switch says, flat. "I\'ll give you that. Tried isn\'t paid, though." The marker\'s spent and the debt\'s worse than it was, because now the scene watched you fail at it.',
      ],
      effects: [
        { faction: 'fac.loft', add: -12 },
        { flag: 'side.loft_debt_failed' },
        { flag: 'side.loft_call_done' },
        { trait: 'pkg12_friends_burned_marker' },
        { stat: 'stress', add: 10 },
      ],
    },
    lawyer: {
      speaker: 'switch',
      text: [
        "You don't hide the kid. You armor him. The best defense lawyer twenty-five hundred dollars can rent is on Patch's doorstep before the sweep is, with a single instruction hand-delivered: say nothing, sign nothing, call this number.",
        "The grey car still comes. But it comes to a door with a lawyer behind it, and a lawyered kid who keeps his mouth shut is a bad afternoon for the men in the car and a survivable one for Patch. He's out in a day. Rattled, clean, still on the board.",
        '"Money\'s a blunt tool," Switch admits, "but it swings. Debt\'s paid. Scene noticed." He almost sounds like he respects it.',
      ],
      effects: [
        { faction: 'fac.loft', add: 12 },
        { money: -2500 },
        { flag: 'side.loft_debt_paid' },
        { flag: 'side.loft_call_done' },
      ],
    },
    took_heat: {
      speaker: 'switch',
      text: [
        "You do the reckless, generous thing: you make yourself the louder target. You leave a trail of your own where the sweep is looking, bright and deniable and pointed away from a kid who couldn't survive it, and you let some of the heat that was headed for Patch come home to you instead.",
        "It works because you can take it and he can't. Patch never even knows there was a night. He wakes up to a scene that's still there and a marker he'll spend a lifetime not knowing he owes you.",
        '"That was dumb," Switch says, with something like warmth. "That was Corvid-dumb. That\'s the highest thing I know how to say." The heat sits on you now. Worth it. Mostly.',
      ],
      effects: [
        { faction: 'fac.loft', add: 18 },
        { stat: 'heat', add: 18 },
        { flag: 'side.loft_debt_paid' },
        { flag: 'side.loft_call_done' },
      ],
    },
    left: {
      speaker: 'switch',
      text: [
        "There's a silence on the line long enough to hear the whole scene in it.",
        '"Yeah," Switch says, at last. "Yeah, okay." He doesn\'t argue. That\'s the worst part; the pragmatist of all people just accepts it, like he expected it, like he always knew what your marker was actually worth.',
        "Patch runs, and doesn't run fast enough, and gets swept anyway. The board doesn't say your name. It doesn't have to. Everyone knows the marker got called and nobody came, and a scene that stops paying its markers is just a market with worse lighting.",
      ],
      effects: [
        { faction: 'fac.loft', add: -15 },
        { flag: 'side.loft_debt_failed' },
        { flag: 'side.loft_call_done' },
        { trait: 'pkg12_friends_burned_marker' },
      ],
    },
  },
}

export default defineContent({
  quests: [corvidBackup, reunionLan, loftCallsItIn],
  scenes: [corvidBackupScene, reunionLanScene, loftCallsItInScene],
})
