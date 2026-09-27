/**
 * PKG-12 — Deadline's two beats: his dog, and his heart.
 *
 * `side_deadline_dog` is Deadline's Loyalty quest (§4.7). `side_deadline_health` is the darker
 * one — it can set him toward `saves_you` (a later escape route) or, if you do nothing, straight to
 * `passed`. The billing hack sets `life.hacked_hospital` (an Aperture memory read by a later beat),
 * exactly per bible §12.6.
 *
 * The "hack" is an abstract skill check against an invented clinic system — no technique, no tools.
 */
import { defineContent } from '@/engine/registry'
import type { QuestDef, SceneDef } from '@/engine/types'

// ── side_deadline_dog — Loyalty: Deadline ─────────────────────────────────────

const deadlineDog: QuestDef = {
  id: 'side_deadline_dog',
  title: 'Loyalty: The Vet Bill',
  kind: 'side',
  act: 2,
  giver: 'deadline',
  priority: 8,
  rewards: "Deadline's loyalty · a very good dog",
  summary:
    "Deadline loves his old dog Biscuit more than he's ever admitted to loving a person, and Biscuit needs a procedure Deadline can't pay for. He'd rather lose the dog than ask. So he isn't asking. He's just sitting in the worst chair, not asking, very loudly.",
  autoStart: {
    all: [{ var: 'act', eq: 2 }, { npc: 'deadline', met: true, fateNot: ['passed', 'dead'] }, { day: true, gte: 260 }],
  },
  start: 'biscuit',
  stages: {
    biscuit: {
      text: "Biscuit needs surgery Deadline can't afford, and Deadline would rather chew glass than say so out loud. Find a way to cover it — pay it, shave the bill, or pass the hat on the Row.",
      onEnter: [{ scene: 'side_deadline_dog_scene' }],
      objectives: [
        {
          id: 'resolve',
          text: "Keep Biscuit off the bad list at the vet",
          when: { flag: 'side.deadline_dog_done' },
          hint: "Find Deadline in the back room. You can pay outright, quietly shave the vet's bill with a check, or organize the Row to chip in.",
        },
      ],
      onComplete: [{ log: 'Biscuit lives. Deadline will never once say thank you, which is how you know.', kind: 'story' }],
    },
  },
}

const deadlineDogScene: SceneDef = {
  id: 'side_deadline_dog_scene',
  channel: 'dialog',
  title: 'The Vet Bill',
  from: 'deadline',
  start: 'chair',
  nodes: {
    chair: {
      speaker: 'deadline',
      text: [
        "Deadline is in the worst chair, the one nearest the door, with Biscuit's leash wrapped twice around his fist and no Biscuit on the end of it.",
        '"Dog\'s at the vet," he says, to the middle distance. "They want four hundred to fix her hip. Four hundred." He says the number like it\'s the punchline to a joke he stopped finding funny in 1994.',
        '"I told \'em I\'d think about it." He would not think about it. He would go home and sit in the dark and lose the only thing that\'s never once let him down. "Anyway. How\'s tricks."',
      ],
      choices: [
        {
          text: '"Four hundred. Done. Go get your dog."',
          tag: '[Pay $400]',
          req: { stat: 'money', gte: 400 },
          reqText: 'Requires $400',
          goto: 'paid',
        },
        {
          text: "\"Give me the clinic's name. I'll make the number smaller and nobody the wiser.\"",
          tag: '[Intrusion DC 12]',
          check: {
            skill: 'intrusion',
            dc: 12,
            success: 'shaved',
            fail: 'shaved_fail',
          },
        },
        {
          text: "\"You've got forty friends who owe you their drives from '94. Let me pass the hat.\"",
          goto: 'hat',
        },
        {
          text: '"I can\'t cover it right now, Deadline. I\'m sorry."',
          tag: '[Leave]',
          goto: 'cant',
        },
      ],
    },
    paid: {
      speaker: 'deadline',
      text: [
        "You put four hundred dollars on the worst chair's armrest. Deadline looks at it for a long time.",
        '"You\'re a mark," he says, finally, which is the nicest thing he knows how to say. He goes and gets Biscuit that afternoon.',
        "Biscuit is a bad-hipped, cloudy-eyed miracle who loves you instantly and completely, on the grounds that you smell like the man who came back. Deadline pretends the leash was always this loose.",
      ],
      effects: [
        { npc: 'deadline', affinity: 12 },
        { faction: 'fac.hood', add: 3 },
        { flag: 'side.deadline_dog_saved' },
        { flag: 'side.deadline_dog_done' },
        { stat: 'mood', add: 6 },
      ],
    },
    shaved: {
      speaker: 'narrator',
      text: [
        "The clinic runs its billing on a system held together with duct tape and a login the receptionist wrote on a sticky note in 1998. You don't break anything. You just find the line where a four becomes a one and let a compassionate discount that was always technically available apply itself.",
        'The bill Deadline gets says $150, STAFF PET RATE, in a font the office has never used. He squints at it, then at you, and decides not to ask.',
        '"Huh," he says. "Vet found religion." He pays the hundred and fifty and brings Biscuit home, and never learns how close the number came to being a problem.',
      ],
      effects: [
        { npc: 'deadline', affinity: 10 },
        { money: -150 },
        { stat: 'heat', add: 2 },
        { flag: 'side.deadline_dog_saved' },
        { flag: 'side.deadline_dog_done' },
      ],
    },
    shaved_fail: {
      speaker: 'narrator',
      text: [
        "The system is older and dumber than you gave it credit for, and it does the one thing you didn't plan for: it notices. A little flag, a little note, a receptionist frowning at a screen. Nothing that names you. Just a record that somebody was in there.",
        "You back out clean, but the damage is done to the plan, not to you — so you do the honest thing and just pay the four hundred yourself before anyone looks twice.",
        "Biscuit comes home. Deadline is baffled and grateful and slightly suspicious, all at once. The little flag at the clinic sits there, patient, for later.",
      ],
      effects: [
        { npc: 'deadline', affinity: 8 },
        { money: -400 },
        { stat: 'heat', add: 4 },
        { flag: 'side.deadline_clinic_flag' },
        { flag: 'side.deadline_dog_saved' },
        { flag: 'side.deadline_dog_done' },
        { chance: 0.3, then: [{ complication: 'legal' }] },
      ],
    },
    hat: {
      speaker: 'deadline',
      text: [
        "You don't ask him. You ask the Row. You tell the back room that Deadline needs four hundred for the dog and you watch what forty years of never ratting turns into when it's pointed at something kind.",
        "It's twenties, mostly. Some fives. A ten from byteme that's obviously his whole week. Sal covers the last forty and won't be argued with. The jar fills up before the coffee gets cold.",
        'When Deadline finds out it wasn\'t you — that it was everyone — he has to go stand in the alley for a while. "Damn scene," he says, when he comes back in, and gets down on the floor to wait for his dog.',
      ],
      effects: [
        { npc: 'deadline', affinity: 14 },
        { faction: 'fac.hood', add: 5 },
        { faction: 'fac.loft', add: 4 },
        { flag: 'side.deadline_dog_saved' },
        { flag: 'side.deadline_dog_done' },
        { stat: 'mood', add: 8 },
      ],
    },
    cant: {
      speaker: 'deadline',
      text: [
        '"Course," he says. "Course. You got your own." He waves you off with the empty leash.',
        "You hear later that he found the money. You don't ask how. There are only so many ways a broke sixty-year-old with a criminal record finds four hundred dollars in a weekend, and none of them are good, and Biscuit is worth all of them to him.",
        "The dog lives. Deadline gets quieter. When you see him next he doesn't mention it, and neither do you, and the worst chair feels a little further from the door.",
      ],
      effects: [
        { npc: 'deadline', affinity: -4 },
        { flag: 'side.deadline_dog_saved' },
        { flag: 'side.deadline_dog_done' },
        { stat: 'stress', add: 4 },
      ],
    },
  },
}

// ── side_deadline_health — the collapse ───────────────────────────────────────

const deadlineHealth: QuestDef = {
  id: 'side_deadline_health',
  title: "Deadline's Heart",
  kind: 'side',
  act: 2,
  giver: 'deadline',
  priority: 9,
  rewards: 'A mentor kept, or lost',
  summary:
    "Deadline went down in the back room mid-sentence, coffee still swinging in his hand. The scene doesn't do hospitals — hospitals ask questions, hospitals keep records. But this is his heart, and his heart doesn't care about opsec.",
  autoStart: {
    all: [{ var: 'act', gte: 2 }, { var: 'act', lte: 3 }, { npc: 'deadline', met: true, fateNot: ['passed', 'dead'] }, { day: true, gte: 820 }],
  },
  start: 'down',
  stages: {
    down: {
      text: "Deadline collapsed. He's stable, scared, and buried in bills he'll die refusing to pay. Cover his care the honest way, shave the hospital bill and hope nobody notices, or leave it to a man who's decided he's already had enough years.",
      onEnter: [{ scene: 'side_deadline_health_scene' }],
      objectives: [
        {
          id: 'resolve',
          text: 'Decide what Deadline is worth to you',
          when: { flag: 'side.deadline_health_done' },
          hint: "He's at Harbor Point General, hating it. Pay the bills, quietly fix the billing at the cost of an Aperture-shaped memory, or do nothing and let him make his own peace.",
        },
      ],
      onComplete: [{ log: "You made a call about an old man's heart. He'll remember it, however long he's got.", kind: 'story' }],
    },
  },
}

const deadlineHealthScene: SceneDef = {
  id: 'side_deadline_health_scene',
  channel: 'dialog',
  title: "Deadline's Heart",
  from: 'deadline',
  start: 'ward',
  nodes: {
    ward: {
      speaker: 'deadline',
      text: [
        "They've got him in a paper gown in a curtained bay at Harbor Point General, wired to a machine that beeps his heart back at him in green. He looks ten years older and mortally offended by all of it.",
        '"Records," he croaks, when he sees you. "First thing they did. Name, address, insurance I don\'t have. Thirty years I kept my name off everything and I gave it up for a *chest pain*." He tries to laugh and the machine tells on him.',
        { if: { npc: 'deadline', fate: 'relapse' }, text: '"Shouldn\'t\'ve done that last job with you," he says, not unkindly. "Body keeps a log too, turns out."' },
        { if: { flag: 'side.deadline_clinic_flag' }, text: '"Funny thing," he rasps. "Admitting nurse said my file already had a note on it. From that vet-bill business, years back — some flag the clinic passed up the chain. Small world, the record-keeping business." He watches you not react. He knows.' },
        '"There\'s a bill coming that\'s got more zeros than my whole life. Don\'t you dare do anything stupid about it." He absolutely means: please do something stupid about it.',
      ],
      choices: [
        {
          text: "\"You're getting the good doctor and the whole stay. I'll handle the bill. Rest.\"",
          tag: '[Pay the bills]',
          req: { stat: 'money', gte: 2000 },
          reqText: 'Requires $2,000',
          goto: 'paid',
        },
        {
          text: "\"The hospital runs its billing on a machine older than you are. Let me make this disappear.\"",
          tag: '[Intrusion DC 17]',
          check: {
            skill: 'intrusion',
            dc: 17,
            bonuses: [{ if: { item: 'old_tool' }, add: 2, label: "+2 (dialtone's old kit)" }],
            success: 'hacked',
            fail: 'hacked_fail',
          },
        },
        {
          text: '"...Okay. Your call. What do you want me to do?"',
          tag: '[Let him decide]',
          goto: 'nothing',
        },
      ],
    },
    paid: {
      speaker: 'deadline',
      text: [
        "You put the whole thing on your own tab — the good cardiologist, the full stay, the follow-ups he'd otherwise skip. You do it loudly and legally, which he hates, and which keeps his name out of any file but the hospital's own.",
        '"You\'re a mark," he says, for the second time in your life, with his eyes shut. "A soft touch. I taught you better." He didn\'t. Nobody taught you this. You taught yourself it in a curtained bay watching a green line.',
        "He gets better. He gets *careful*, which for Deadline is a personality transplant. And somewhere in the back of his head he files a way out of a burning building that only a man who owes you his life would ever offer you.",
      ],
      effects: [
        { npc: 'deadline', affinity: 15 },
        { money: -2000 },
        { flag: 'npc.deadline.saved_you' },
        { flag: 'side.deadline_health_done' },
        { stat: 'mood', add: 6 },
      ],
    },
    hacked: {
      speaker: 'narrator',
      text: [
        "The hospital's billing runs on the same tired system that couldn't hold a grudge about a vet bill, scaled up and just as tired. You slip in, find Deadline's account, and let a charity write-off that was always theoretically possible become, for one old man, real.",
        "His statement comes back at zero. BALANCE FORGIVEN, it says. He reads it four times and decides, with enormous effort, not to understand it.",
        "It works. It also means you were inside a hospital's records with your own hands, on a night with a date and a time, and a place like Aperture keeps every scrap of every system it can reach. Somewhere, quietly, that becomes a thing that is known about you.",
      ],
      effects: [
        { npc: 'deadline', affinity: 12 },
        { flag: 'npc.deadline.saved_you' },
        { flag: 'life.hacked_hospital' },
        { stat: 'heat', add: 8 },
        { flag: 'side.deadline_health_done' },
      ],
    },
    hacked_fail: {
      speaker: 'narrator',
      text: [
        "You're in and moving when the billing office does the thing hospitals have started doing: it flinches. An automated review, a flag on the account, a note that routes somewhere you can't see. You get the write-off applied — Deadline's balance still drops to nothing — but you leave a scuff mark on the way out.",
        "You wipe what you can and get gone. Deadline is treated and clear. The scuff is not. It gets swept up, weeks later, into the same quiet Millgate machine that keeps everything, filed under a night with your fingerprints on it.",
        "\"Balance forgiven,\" his statement says. He's alive to read it. You'll pay for the rest of it later, on someone else's schedule.",
        { if: { flag: 'side.deadline_clinic_flag' }, text: "And the review has a friend now: the old vet-clinic note on the same name, the same kind of scuff, years apart. One flag is noise. Two flags on one old man's file is a pattern, and somebody whose job is patterns is going to pull on it." },
      ],
      effects: [
        { npc: 'deadline', affinity: 10 },
        { flag: 'npc.deadline.saved_you' },
        { flag: 'life.hacked_hospital' },
        { stat: 'heat', add: 15 },
        { flag: 'side.deadline_health_done' },
        // A second billing scuff on the same file (the old vet-clinic flag) is a pattern, not a glitch.
        { if: { flag: 'side.deadline_clinic_flag' }, then: [{ complication: 'legal' }], else: [{ chance: 0.3, then: [{ complication: 'legal' }] }] },
      ],
    },
    nothing: {
      speaker: 'deadline',
      text: [
        '"Nothing," he says. "That\'s what I want you to do. I mean it." He catches your wrist with a grip that\'s weaker than it was and stronger than it has any right to be.',
        '"I\'ve had a good long run of borrowed time. Fourteen months of the state\'s and a lot of years of my own. I\'m not spending your money or your neck to buy a few more I\'ll only waste being scared." He lets go. "Sit with me a while, though. If you got a while."',
        "You sit. You lose the argument, because it isn't yours to win. Deadline goes out on his own terms, a few weeks later, with the worst chair kept empty for him and a dog that waits by the door of a room he isn't in anymore.",
      ],
      effects: [
        { npc: 'deadline', fate: 'passed', affinity: 5 },
        { stat: 'stress', add: 10 },
        { flag: 'side.deadline_health_done' },
      ],
    },
  },
}

export default defineContent({
  quests: [deadlineDog, deadlineHealth],
  scenes: [deadlineDogScene, deadlineHealthScene],
})
