/**
 * PKG-12 — Freelance clients. Small paying jobs that double as breadcrumbs.
 *
 * `side_overdue` drops an evidence fragment and `w.exposure` when you follow the thread (the fragment
 * feeds PKG-04's `evidence_fragments` → `end.has_evidence`). `side_politicians_laptop` leaks the MNSA
 * drafts a year early (`w.public_opinion +`, `w.exposure +`, and `side.politicians_leaked` for the
 * Act III vote). `side_church_basement` introduces Marge "dialtone" and sets `side.met_dialtone`, the
 * flag that makes the finale copper route discoverable. `side_divorce_drive` writes
 * `side.fabricated_evidence`. `side_wedding_avi` is pure warmth.
 *
 * Every "recovery" or "trace" is an abstract skill check against an invented system — no technique.
 */
import { defineContent } from '@/engine/registry'
import type { QuestDef, SceneDef } from '@/engine/types'

// ── side_overdue — the bookshop's little infection ────────────────────────────

const overdue: QuestDef = {
  id: 'side_overdue',
  title: 'Overdue',
  kind: 'side',
  act: 1,
  priority: 6,
  rewards: 'Cash · maybe a thread worth pulling',
  summary:
    "Overdue Books, the damp little used-paperback shop on the Row, has a sick front-counter PC — pop-ups, a fan like a jet engine, and something that phones out every night after close. It's a forty-dollar fix. It's also, if you look, a very familiar phone number.",
  autoStart: {
    all: [{ var: 'act', lte: 2 }, { day: true, gte: 45 }],
  },
  start: 'shop',
  stages: {
    shop: {
      text: "The bookshop wants its counter PC fixed. Cleaning it is easy money. Following where the thing phones home is optional — and it's the kind of thread that doesn't let go once you've pulled it.",
      onEnter: [{ scene: 'side_overdue_scene' }],
      objectives: [
        {
          id: 'resolve',
          text: 'Fix the bookshop PC (and decide whether to dig)',
          when: { flag: 'side.overdue_done' },
          hint: "Just clean it and bill them, or trace where it phones home with a Networking check — the trace is where the breadcrumb is.",
        },
      ],
      onComplete: [{ log: 'The bookshop counter boots clean again. Whether you looked deeper is on you.', kind: 'story' }],
    },
  },
}

const overdueScene: SceneDef = {
  id: 'side_overdue_scene',
  channel: 'dialog',
  title: 'Overdue Books',
  from: 'Ines at Overdue Books',
  start: 'counter',
  nodes: {
    counter: {
      speaker: 'Ines at Overdue Books',
      text: [
        "Overdue Books smells like every good used bookstore: mildew, old glue, and the ghost of somebody's pipe tobacco from 1974. The owner, Ines, waves at a beige tower under the counter that is screaming like a kettle.",
        '"It went funny after my nephew used it for the \'net," she says. "Now it opens little windows all on its own. Says I\'ve won things. I have not won things. I am seventy-one and I have never won anything in my life."',
        "You crouch under the counter. The machine is a mess of pop-ups and one quiet little program that isn't advertising anything — it just sits there, politely, and calls out to somewhere every night at 3:12 a.m.",
      ],
      choices: [
        {
          text: '"I\'ll scrub it clean and it\'ll boot like new. Forty bucks."',
          goto: 'clean',
        },
        {
          text: "\"...Hang on. Let me see where this last one calls when it thinks nobody's watching.\"",
          tag: '[Networking DC 12]',
          check: {
            skill: 'networking',
            dc: 12,
            bonuses: [{ if: { item: 'aperture_sample' }, add: 3, label: "+3 (you've seen this handwriting before)" }],
            success: 'traced',
            fail: 'traced_fail',
          },
        },
      ],
    },
    clean: {
      speaker: 'Ines at Overdue Books',
      text: [
        "You wipe the junk, close the windows for good, and reboot it to a clean, quiet desktop. Ines is delighted and pays you in exact change and a paperback she insists you'll love.",
        "The little 3:12 program goes with the rest. You don't follow it. Some nights the smart move is to take the forty dollars, take the book, and not learn a single thing you'll have to carry.",
      ],
      effects: [
        { money: 45 },
        { faction: 'fac.hood', add: 2 },
        { stat: 'mood', add: 3 },
        { flag: 'side.overdue_done' },
      ],
    },
    traced: {
      speaker: 'narrator',
      text: [
        "You watch it dial. It's not a scam house in some other time zone; it's local, and boring, and it belongs to a dull little data-hygiene company over in Millgate — the kind of place with a lobby plant and no visitors.",
        "Same address block that a grandmother's infected PC once phoned. Same 3:12 a.m. It's collecting. Just quietly, patiently, from a used-bookshop counter, harvesting whatever a seventy-one-year-old types into a machine she thinks is broken.",
        "You clean the shop's PC and pocket a copy of the little program's homing note, folded into the growing pile of things that, laid side by side, stop looking like coincidences.",
      ],
      effects: [
        { money: 45 },
        { faction: 'fac.hood', add: 2 },
        { var: 'evidence_fragments', add: 1 },
        { var: 'w.exposure', add: 1 },
        { flag: 'side.overdue_traced' },
        { flag: 'side.overdue_done' },
      ],
    },
    traced_fail: {
      speaker: 'narrator',
      text: [
        "It hangs up before you can follow it home — a stub of an address, a bounce through somewhere you can't chase on a bookshop's dial-up, and then nothing. Whoever set it up wanted it dull and forgettable, and dull and forgettable it stays.",
        "You clean the machine anyway. Ines pays you and gives you the paperback regardless. You leave with forty-five dollars and a splinter of a feeling that you just watched something small and organized slip back under a rock.",
        "On the bus home it occurs to you that a thing built to notice when it's being watched probably noticed you watching. You spend the ride rereading the same page of the paperback.",
      ],
      effects: [
        { money: 45 },
        { faction: 'fac.hood', add: 2 },
        { stat: 'stress', add: 3 },
        { flag: 'side.overdue_done' },
        { chance: 0.3, then: [{ complication: 'hack' }] },
      ],
    },
  },
}

// ── side_wedding_avi — the recovered wedding video ────────────────────────────

const weddingAvi: QuestDef = {
  id: 'side_wedding_avi',
  title: 'The First Dance',
  kind: 'side',
  act: 1,
  priority: 6,
  rewards: 'Cash · a good deed · a little joy',
  summary:
    "A newlywed couple's only copy of their wedding video lives on a scratched disc that won't read past the vows. They found your number on the Row's corkboard. There is no version of this job that isn't worth doing.",
  autoStart: {
    all: [{ var: 'act', lte: 2 }, { day: true, gte: 30 }],
  },
  start: 'disc',
  stages: {
    disc: {
      text: "A couple's wedding video is trapped on a dying disc. Recover it. A steady hand and a Hardware check get the whole thing; even a fumble saves the good part.",
      onEnter: [{ scene: 'side_wedding_avi_scene' }],
      objectives: [
        {
          id: 'resolve',
          text: 'Get the couple their wedding back',
          when: { flag: 'side.wedding_avi_done' },
          hint: "It's a delicate Hardware job. Even if you don't get everything, you'll get the part that matters — there's no bad ending, only a smaller one.",
        },
      ],
      onComplete: [{ log: 'Somebody, somewhere, is crying at a wedding video again. Good.', kind: 'story' }],
    },
  },
}

const weddingAviScene: SceneDef = {
  id: 'side_wedding_avi_scene',
  channel: 'dialog',
  title: 'The First Dance',
  from: 'The Okonjos',
  start: 'kitchen',
  nodes: {
    kitchen: {
      speaker: 'The Okonjos',
      text: [
        "They're maybe a year older than you and married about six months, and they've cleared their whole tiny kitchen table so the disc can sit in the middle of it like a patient. The bride keeps not-quite-touching it.",
        '"The videographer put it all on this one disc and then went out of business," the groom says. "It plays the ceremony and then it just... stops. Right when the dancing starts. My mother\'s on there. She passed in the spring." He stops. The kitchen is very quiet.',
        "The disc has a long scratch across the back half like a scar. Whatever's under it is fragile, and reading it wrong once could take the rest with it.",
      ],
      choices: [
        {
          text: "\"Let me take this slow and careful. I think I can get all of it.\"",
          tag: '[Hardware DC 12]',
          check: {
            skill: 'hardware',
            dc: 12,
            bonuses: [
              { if: { background: 'tinkerer' }, add: 3, label: '+3 (basement tinkerer)' },
              { if: { trait: 'iron_stomach' }, add: 1, label: '+1 (steady hands)' },
            ],
            success: 'full',
            fail: 'partial',
          },
        },
        {
          text: '"I\'ll be honest — this needs a specialist rig. Give me two days."',
          req: { stat: 'money', gte: 60 },
          reqText: 'Requires $60 for parts',
          goto: 'specialist',
        },
      ],
    },
    full: {
      speaker: 'narrator',
      text: [
        "You go slow. You read the good half twice, ease across the scar a sliver at a time, and coax the frightened little disc into giving up everything it's holding — vows, cake, the terrible band, all of it.",
        "The dance is there. His mother is there, in a blue dress, laughing at something off-camera, alive for four and a half minutes at 30 frames a second, forever.",
        "You burn it to three fresh discs, because you have learned the one true lesson of this whole life: back up your life, not your data. The couple watches the first thirty seconds and then can't watch any more, and pays you double, and you let them.",
      ],
      effects: [
        { money: 120 },
        { faction: 'fac.hood', add: 4 },
        { stat: 'mood', add: 12 },
        { flag: 'side.wedding_avi_done' },
      ],
    },
    partial: {
      speaker: 'narrator',
      text: [
        "The scar wins the second half. You get the ceremony clean and the first ninety seconds of the dance and then the disc gives up what's left in a shower of digital confetti that won't ever come back. You could push harder. Pushing harder is how you lose the ninety seconds too.",
        "So you stop. Ninety seconds. His mother in the blue dress, laughing at something off-camera, for exactly long enough. You burn what you saved to three discs and hand them over quietly.",
        '"It cut off," the groom says, watching, and then his wife takes his hand, because his mother is right there for a minute and a half and a minute and a half is not nothing. It is, in fact, everything. They pay you, and thank you like you gave them more than you did.',
      ],
      effects: [
        { money: 70 },
        { faction: 'fac.hood', add: 3 },
        { stat: 'mood', add: 8 },
        { stat: 'stress', add: 3 },
        { flag: 'side.wedding_avi_done' },
      ],
    },
    specialist: {
      speaker: 'narrator',
      text: [
        "You don't gamble with something this fragile. You spend sixty dollars of your own on a decent optical drive and a night of patience, and you read the disc the boring, safe, slow way that a scared machine actually deserves.",
        "It all comes back. Every frame. The blue dress, the bad band, the whole night. You clear a modest profit and hand them three copies and the strong suggestion that they mail one to a relative in another city today.",
        "They watch ten seconds and have to stop. That's the good kind of stopping. You let yourself feel good about this one all the way home.",
      ],
      effects: [
        { money: 60 },
        { faction: 'fac.hood', add: 4 },
        { stat: 'mood', add: 10 },
        { flag: 'side.wedding_avi_done' },
      ],
    },
  },
}

// ── side_church_basement — Marge, and the old copper ──────────────────────────

const churchBasement: QuestDef = {
  id: 'side_church_basement',
  title: 'The Church Basement',
  kind: 'side',
  act: 2,
  priority: 6,
  rewards: 'Row goodwill · an elder worth knowing',
  summary:
    "The Cannery Row parish talked you into teaching a Saturday email class to a dozen seniors in the church basement. One of them, a small woman in a cardigan, keeps correcting your wiring. The others call her Marge. The old phreaks call her something else.",
  autoStart: {
    all: [{ var: 'act', eq: 2 }, { day: true, gte: 360 }],
  },
  start: 'class',
  stages: {
    class: {
      text: "Teach a dozen seniors how email works without losing your mind. However it goes, you'll meet Marge Osgood — and Marge Osgood knows every wire this city ever laid.",
      onEnter: [{ scene: 'side_church_basement_scene' }],
      objectives: [
        {
          id: 'resolve',
          text: "Get through the email class",
          when: { flag: 'side.church_done' },
          hint: 'A patient Social check keeps the class from dissolving into chaos — but either way, stay after and talk to the woman correcting your wiring.',
        },
      ],
      onComplete: [{ log: "You met Marge 'dialtone' Osgood. Remember that, when the copper matters.", kind: 'story' }],
    },
  },
}

const churchBasementScene: SceneDef = {
  id: 'side_church_basement_scene',
  channel: 'dialog',
  title: 'The Church Basement',
  from: 'dialtone',
  start: 'basement',
  nodes: {
    basement: {
      speaker: 'narrator',
      text: [
        "The church basement has folding chairs, a coffee urn the size of a water heater, and a dozen seniors arranged in front of donated PCs like nervous pilots. You've got two hours to teach them email. Some of them are holding the mouse like it might bite.",
        "In the front row, a small woman in a cat-eye glasses and a cardigan is not holding her mouse like it might bite. She's already reading the back of the machine, muttering about the phone line, entirely unbothered.",
        "Somebody's PC makes a sound like a dying seagull. Somebody else has managed to open forty windows. The class looks at you. This is going to be a very long two hours.",
      ],
      choices: [
        {
          text: "Slow way down, one click at a time, and make them all feel like geniuses.",
          tag: '[Social DC 12]',
          check: {
            skill: 'social',
            dc: 12,
            bonuses: [{ if: { background: 'class_clown' }, add: 2, label: '+2 (class clown)' }],
            success: 'good_class',
            fail: 'chaos',
          },
        },
        {
          text: "Just get through it and hope the cardigan lady doesn't heckle.",
          goto: 'chaos',
        },
      ],
    },
    good_class: {
      speaker: 'dialtone',
      text: [
        "You throw out the lesson plan and teach it the human way: one click, one victory, one round of applause when a woman named Dorothy successfully emails her grandson a picture of a cat. By the end they're teaching each other. It's the best two hours you've had in a while.",
        "The cardigan lady stays after to help you coil the cables, which she does better than you, in perfect over-under loops. \"Marge Osgood,\" she says, offering a small dry hand. \"I patched this city's calls for thirty years. Some of these young men on your funny boards used to call me dialtone, when they wanted something.\"",
        '"You did all right today, love. You explained it like it mattered, which it does." She nods at the wall, where an old phone junction sleaks a hundred dead wires. "Come find me sometime. I\'ll show you which wires they forgot to disconnect. There\'s a building down by the water where the old copper still meets the new — and I\'ve still got the keys."',
      ],
      effects: [
        { faction: 'fac.hood', add: 6 },
        { flag: 'side.met_dialtone' },
        { npc: 'dialtone', met: true, affinity: 10 },
        { xp: 'networking', add: 12 },
        { stat: 'mood', add: 6 },
        { flag: 'side.church_done' },
      ],
    },
    chaos: {
      speaker: 'dialtone',
      text: [
        "It's chaos. Windows multiply. A man named Herb sends the same blank email eleven times to the parish office. Dorothy's cat photo ends up, somehow, as everyone's desktop wallpaper. You are sweating.",
        "The cardigan lady watches the whole shipwreck with obvious enjoyment, then wades in and fixes three machines while you fix one. \"You know the wires,\" she observes, \"but not the people. That's backwards, for this work.\"",
        '"Marge Osgood." A small dry handshake. "They called me dialtone once, the phone boys, when they wanted a favor. Come find me when you\'re less green. There\'s an old exchange down by the water — copper meets fiber, old net meets new — and I\'ve kept the keys thirty years past when I should\'ve handed them in." She pats your arm. "You\'ll want to know about that building. Sooner than you think."',
      ],
      effects: [
        { faction: 'fac.hood', add: 3 },
        { flag: 'side.met_dialtone' },
        { npc: 'dialtone', met: true, affinity: 6 },
        { stat: 'stress', add: 5 },
        { stat: 'mood', add: -3 },
        { flag: 'side.church_done' },
      ],
    },
  },
}

// ── side_divorce_drive — whose side are you on ────────────────────────────────

const divorceDrive: QuestDef = {
  id: 'side_divorce_drive',
  title: 'The Divorce Drive',
  kind: 'side',
  act: 2,
  priority: 6,
  rewards: 'Cash · and a stain, if you want one',
  summary:
    "A client wants everything recovered off an ex's abandoned hard drive — 'for the lawyers.' The drive is a mess and the story's messier. You can pull the truth, salt it with a lie that pays better, or quietly warn the person on the other end.",
  autoStart: {
    all: [{ var: 'act', eq: 2 }, { day: true, gte: 420 }],
  },
  start: 'drive',
  stages: {
    drive: {
      text: "A bitter client wants an ex's drive turned inside out for a custody fight. Recover it straight, fabricate something juicier, or flip and warn the other side. Each pays differently, and one of them costs you something you can't bill for.",
      onEnter: [{ scene: 'side_divorce_drive_scene' }],
      objectives: [
        {
          id: 'resolve',
          text: 'Decide whose story the drive tells',
          when: { flag: 'side.divorce_done' },
          hint: "Recover the honest files, cook up fabricated evidence for a bigger fee, or warn the ex — the client won't know which, but you will.",
        },
      ],
      onComplete: [{ log: 'The divorce drive is handled. What it says now is what you decided it should.', kind: 'story' }],
    },
  },
}

const divorceDriveScene: SceneDef = {
  id: 'side_divorce_drive_scene',
  channel: 'dialog',
  title: 'The Divorce Drive',
  from: 'A very angry client',
  start: 'meeting',
  nodes: {
    meeting: {
      speaker: 'A very angry client',
      text: [
        "The client meets you at the Cathode counter and slides a drive across in a Ziploc bag like it's contraband, which, emotionally, it is. He's vibrating with the specific fury of a man losing a custody fight.",
        '"Everything on there," he says. "Emails, chats, whatever she deleted, I want it. My lawyer says the right files and I keep my kids. She\'s not who everyone thinks she is." He leans in. "And if there\'s nothing good on there... maybe you help me out. You know. Make sure there is."',
        "You take the drive home. It's an ordinary, sad, ordinary drive: recipes, half-finished job applications, a folder of photos of two kids at a beach. The deleted stuff, when you ease it back, is even more ordinary. There's no monster on here. There's just a person.",
      ],
      choices: [
        {
          text: "Recover exactly what's there — the true, boring, human files — and hand it over.",
          tag: '[Recover honestly]',
          goto: 'honest',
        },
        {
          text: "Give him what he's paying for: a story the drive doesn't actually tell.",
          tag: '[Fabricate]',
          goto: 'fabricate',
        },
        {
          text: "Quietly reach the ex and warn her what's coming.",
          tag: '[Flip]',
          goto: 'flip',
        },
      ],
    },
    honest: {
      speaker: 'A very angry client',
      text: [
        "You give him the truth: a clean, honest recovery of a drive that has nothing on it but a life. Recipes. Job hunts. Two kids at a beach.",
        "He's furious. He wanted a weapon and you handed him a photo album. \"This is nothing,\" he spits. \"I paid for nothing.\" He pays anyway, because you did the job, and the job was real.",
        "You never find out how the custody fight goes. But you know the drive didn't decide it, and you know you didn't put a lie in front of a judge who'd have believed it. Some nights that's the whole win.",
      ],
      effects: [
        { money: 250 },
        { flag: 'side.divorce_honest' },
        { stat: 'mood', add: 3 },
        { flag: 'side.divorce_done' },
      ],
    },
    fabricate: {
      speaker: 'narrator',
      text: [
        "It's easy. That's the horror of it. A few timestamps, a message that sounds like her, a folder named the right ugly thing, all seeded so cleanly that a court's expert would sign off on it. You build a monster where there wasn't one and you make it fit her exactly.",
        "The client is thrilled. He pays you double and shakes your hand with both of his. Somewhere across town, a woman who liked recipes and job hunts and taking her kids to the beach is about to lose them to something you invented in an evening.",
        "The money's good. You keep a copy of what you built — you always keep a copy — and it sits in your files like a swallowed stone, proof of exactly what your hands can do when someone pays enough.",
      ],
      effects: [
        { money: 600 },
        { flag: 'side.fabricated_evidence' },
        { stat: 'stress', add: 8 },
        { stat: 'mood', add: -6 },
        { flag: 'side.divorce_done' },
      ],
    },
    flip: {
      speaker: 'narrator',
      text: [
        "You do the thing you're not supposed to: you find her. A careful, anonymous note — you don't know me, someone's coming for your drive, here's what's on it, here's a lawyer who works cheap, protect your kids.",
        "She never writes back. But two weeks later the angry client corners you at the Cathode, incandescent, because his ambush turned into a fair fight and fair fights are not what he paid for. He doesn't pay you the rest. You didn't expect him to.",
        "The Row hears a version of it — that you don't cook evidence, that you tipped somebody off, that your hands have a line in them. It's not money. It's the other kind of currency, and on the Row it spends better.",
      ],
      effects: [
        { money: 100 },
        { faction: 'fac.hood', add: 6 },
        { flag: 'side.divorce_flipped' },
        { stat: 'mood', add: 6 },
        { notify: 'Word gets around the Row: you don\'t cook evidence for a fee. That buys something money can\'t.', kind: 'good' },
        { flag: 'side.divorce_done' },
      ],
    },
  },
}

// ── side_politicians_laptop — the MNSA drafts, a year early ────────────────────

const politiciansLaptop: QuestDef = {
  id: 'side_politicians_laptop',
  title: "The Councilman's Laptop",
  kind: 'side',
  act: 2,
  priority: 7,
  rewards: 'Cash · or a head start on the whole city',
  summary:
    "Councilman Ford Pratt's aide brings you his laptop for a 'quiet, discreet' repair. On it, a year before anyone's supposed to see them, are the working drafts of something called the Municipal Network Security Act — the law that turns every wire in the city into a witness.",
  autoStart: {
    all: [{ var: 'act', gte: 2 }, { not: { flag: 'a3.mnsa_live' } }, { day: true, gte: 600 }],
  },
  start: 'laptop',
  stages: {
    laptop: {
      text: "You're holding the surveillance law a year before it goes public. Fix the laptop and forget you saw it, quietly copy the drafts for leverage, or leak them now and put the whole city on notice.",
      onEnter: [{ scene: 'side_politicians_laptop_scene' }],
      objectives: [
        {
          id: 'resolve',
          text: 'Decide what to do with the drafts',
          when: { flag: 'side.politicians_done' },
          hint: "Return the laptop clean, copy the drafts on the quiet with an Intrusion check, or leak them — leaking moves public opinion against the law long before the vote.",
        },
      ],
      onComplete: [{ log: 'The councilman gets his laptop back. Whether the city gets a warning is the part you chose.', kind: 'story' }],
    },
  },
}

const politiciansLaptopScene: SceneDef = {
  id: 'side_politicians_laptop_scene',
  channel: 'dialog',
  title: "The Councilman's Laptop",
  from: "Pratt's aide",
  start: 'repair',
  nodes: {
    repair: {
      speaker: "Pratt's aide",
      text: [
        "The aide is twenty-four, expensive, and nervous. He hands you Councilman Pratt's laptop like it's a live thing. \"It won't hold a charge and it's full of — work. Confidential work. So, discreet, yes? Fix the battery thing. Don't be curious.\"",
        "The battery thing takes ten minutes. Being incurious takes more discipline than you have, because sitting right there in a folder helpfully labeled MNSA — WORKING is a document nobody in this city is supposed to see for another year.",
        "You read the first page with the aide getting coffee upstairs. Municipal Network Security Act. Mandatory log retention. 'Lawful access' taps at every ISP. A quiet clause that makes running an anonymous board a crime. The whole cage, drafted, with margins full of a lobbyist's polite handwriting.",
      ],
      choices: [
        {
          text: "Fix the battery, close the folder, and hand it back like you saw nothing.",
          tag: '[Return it clean]',
          goto: 'return',
        },
        {
          text: "Quietly copy the drafts for later. Knowledge is leverage.",
          tag: '[Intrusion DC 15]',
          check: {
            skill: 'intrusion',
            dc: 15,
            success: 'copied',
            fail: 'copied_fail',
          },
        },
        {
          text: "Leak it. Put the whole thing in front of the city a year before they mean to.",
          tag: '[Leak now]',
          goto: 'leak',
        },
      ],
    },
    return: {
      speaker: "Pratt's aide",
      text: [
        "You fix the battery, close the folder, and hand it back with your blandest face. The aide pays you the agreed 'discretion premium' in cash and tells you three times how discreet you're being.",
        "You keep your word. You also keep the memory, whole and heavy, of exactly what's coming and roughly when. Knowing a storm's on the way isn't the same as warning anyone. But it's a start, and it's yours.",
      ],
      effects: [
        { money: 200 },
        { flag: 'side.politicians_done' },
      ],
    },
    copied: {
      speaker: 'narrator',
      text: [
        "You fix the battery in plain sight and copy the drafts in the quiet — the whole cage, the margins, the lobbyist's handwriting, all of it — onto something small and yours, without the machine ever noticing a guest.",
        "The aide gets his laptop back, clean and charged, and pays you the discretion premium for a discretion you are absolutely not practicing. You now hold the surveillance law a year early, with a lobbyist's fingerprints in the margins. When the time comes, that's a card you get to play — or trade.",
        "You don't leak it yet. You just... have it. Sometimes the strongest move is the one nobody knows you made.",
      ],
      effects: [
        { money: 200 },
        { flag: 'side.mnsa_drafts_held' },
        { var: 'w.exposure', add: 1 },
        { flag: 'side.politicians_done' },
      ],
    },
    copied_fail: {
      speaker: 'narrator',
      text: [
        "You get the drafts — but the machine coughs at the wrong moment, a login prompt where there shouldn't be one, a little event written to a log you can't reach, and the aide's footsteps on the stairs. You back out fast and hand it over smiling.",
        "You've got the documents. You've also left the faintest scuff behind you, on a councilman's machine, on a night with a date. Probably nothing. Nothing is a lot of things until it isn't.",
        "You keep the drafts. You keep the small cold feeling too.",
      ],
      effects: [
        { money: 200 },
        { flag: 'side.mnsa_drafts_held' },
        { flag: 'side.pratt_scuff' },
        { var: 'w.exposure', add: 1 },
        { stat: 'heat', add: 10 },
        { flag: 'side.politicians_done' },
        { scene: 'side_pratt_aide_mail', delayHours: 24 * 21 },
      ],
    },
    leak: {
      speaker: 'narrator',
      text: [
        "You copy the whole thing and, before you can talk yourself out of it, you put it where the city can't unsee it — a plain envelope of drafts, no fingerprints, dropped into the hands of a reporter who's been sniffing at the Aperture money for a year.",
        "It lands like a brick through a window. A YEAR EARLY: THE SURVEILLANCE LAW THEY DIDN'T WANT YOU TO READ. Suddenly it's not a done deal quietly greased in a back room — it's a fight, in daylight, with the public on notice and the lobbyist's own margins printed in the paper.",
        "Councilman Pratt is furious and can't say why without admitting what was on his laptop. The heat of doing it comes home to you. But the whole board changes when the pieces are face-up, and you just flipped this one over a year before anyone expected.",
      ],
      effects: [
        { money: 200 },
        { flag: 'side.politicians_leaked' },
        { var: 'w.public_opinion', add: 12 },
        { var: 'w.exposure', add: 1 },
        { stat: 'heat', add: 15 },
        { faction: 'fac.hood', add: 5 },
        { notify: 'The MNSA drafts hit the papers a year early. The city is watching now. So is the councilman.', kind: 'story' },
        { flag: 'side.politicians_done' },
      ],
    },
  },
}

/** Fail-branch fallout of the scuffed copy: the councilman's people found the log entry. */
const prattAideMail: SceneDef = {
  id: 'side_pratt_aide_mail',
  channel: 'mail',
  title: 'Re: battery repair (URGENT — please read)',
  from: "Pratt's aide",
  pause: true,
  expiresDays: 14,
  onExpire: [{ flag: 'side.pratt_grudge' }, { stat: 'heat', add: 8 }, { complication: 'legal' }],
  start: 'mail',
  nodes: {
    mail: {
      speaker: "Pratt's aide",
      text: [
        'From: T. Whitcombe, Office of Councilman F. Pratt',
        'Subject: Re: battery repair (URGENT — please read)',
        "Hi. So. The Councilman's IT contractor ran one of those security reviews they do now, and there's an entry on the laptop from the night you had it. 9:14 p.m. A folder being opened that I was very clear about. I have been asked to \"find out what the repair guy saw.\" I have been asked in a voice.",
        "I'm not a bad guy. I'm twenty-four and I need this job and I told them you were discreet, several times, in writing. Please tell me what I'm supposed to tell them. Please tell me it was the battery.",
        '— Todd (sent from the Council building — please do not reply-all)',
      ],
      choices: [
        {
          text: 'Send the premium back, plus a "diagnostic fee refund." Tell him the folder opened itself during a battery test.',
          tag: '[Pay $400]',
          req: { stat: 'money', gte: 400 },
          reqText: 'Requires $400',
          effects: [{ money: -400 }, { stat: 'heat', add: -6 }, { flag: 'side.pratt_settled' }],
          goto: 'settled',
        },
        {
          text: '"It was the battery, Todd. Nobody touched your folder. Tell them that, in that voice."',
          tag: '[Lie]',
          effects: [{ flag: 'side.pratt_grudge' }, { stat: 'heat', add: 8 }, { complication: 'legal' }],
          goto: 'stonewalled',
        },
        {
          text: 'Get ahead of it. Put the drafts in front of a reporter tonight, before anyone can bury you with them.',
          tag: '[Leak now]',
          effects: [
            { flag: 'side.politicians_leaked' },
            { var: 'w.public_opinion', add: 8 },
            { stat: 'heat', add: 12 },
            { faction: 'fac.hood', add: 4 },
            { flag: 'side.pratt_grudge' },
            { notify: 'The MNSA drafts hit the papers a year early — and the councilman knows exactly whose repair shop they came from.', kind: 'story' },
          ],
          goto: 'leaked',
        },
      ],
    },
    settled: {
      speaker: "Pratt's aide",
      text: [
        'From: T. Whitcombe · Subject: Re: Re: battery repair',
        "Thank you. I told them it was a battery test. They wanted it to be a battery test, so it was. The refund helped it be a battery test.",
        "I'm deleting this thread. Please delete this thread. I'm going to go lie down in my car.",
      ],
    },
    stonewalled: {
      speaker: "Pratt's aide",
      text: [
        'From: T. Whitcombe · Subject: Re: Re: battery repair',
        "Okay. I told them. They didn't believe me either. Somebody from the Councilman's lawyer's office has your name now and a copy of the invoice. I'm sorry. I really did say you were discreet.",
        'They asked me whether you do a lot of \"computer work for people in this city.\" I said I didn\'t know. I don\'t, do I.',
      ],
    },
    leaked: {
      speaker: 'narrator',
      text: [
        "You don't answer Todd. You answer the city. A plain envelope, a reporter who has been sniffing at the Aperture money for a year, and by Thursday it's a front page: A YEAR EARLY: THE SURVEILLANCE LAW THEY DIDN'T WANT YOU TO READ.",
        "It's the right card played from the wrong hand. The public gets its warning. Councilman Pratt gets a name to hate, because the only people who ever held that laptop were his aide and his repair guy — and Todd, you are fairly sure, is going to be fine. You are going to be known.",
      ],
    },
  },
}

export default defineContent({
  quests: [overdue, weddingAvi, churchBasement, divorceDrive, politiciansLaptop],
  scenes: [overdueScene, weddingAviScene, churchBasementScene, divorceDriveScene, politiciansLaptopScene, prattAideMail],
})
