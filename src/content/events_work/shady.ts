/**
 * events_work — THE ROOMS BEHIND CURTAINS (the shady track, Act I–IV). The back room at Beep City
 * where machines get new serial stickers; Brightline's windowless call floor, where the script keeps
 * growing fields; and Switch's Friday envelopes, which are occasionally thinner than promised.
 * The money is cash and the consequences are real: heat, write-ups nobody files on paper, and the
 * kind of reputation that follows you out of the building.
 *
 * HARD RULE: everything here is invented flavor. No real technique, no real script, nothing usable.
 */
import { defineContent } from '@/engine/registry'
import type { Cond, EventDef, SceneDef } from '@/engine/types'
import { GOOD_WORD, WATCHED, actGte, around, bumpJob, firedNow, free, onFinalWarning, strike } from './_shared'

// ── ev_work_curtain_serials ─────────────────────────────────────────────────
// Repeatable. A machine comes through the curtain with somebody's life still on it.
const REFURB: Cond = { job: 'job_shady_refurb' }
const RETURNED = 'ev_work.curtain_returned'

const curtainScene: SceneDef = {
  id: 'ev_work_curtain_serials_scene',
  channel: 'dialog',
  title: 'Behind the Bead Curtain',
  start: 'bench',
  nodes: {
    bench: {
      speaker: 'narrator',
      text: [
        'Tuesday night behind the bead curtain. The front of Beep City sells translucent pagers to teenagers; the back room smells of solder, cigarette ash and the little bottle of label remover that Teo keeps on the shelf like holy water. Tonight\'s crate holds six laptops, two towers and a box of power bricks nobody will ever match to anything.',
        { if: { var: RETURNED, lte: 0 }, text: 'You boot the third laptop to check the screen and the desktop loads before you can stop it: a birthday photo, a kid in a paper crown blowing out seven candles, and a folder called TAXES 2002 FINAL final.' },
        { if: { var: RETURNED, gte: 1 }, text: 'You boot the third laptop and it happens again — somebody\'s whole life on the desktop, a wedding folder, a resume half-written. You have done something about this before. Teo has noticed that you are slow on Tuesdays.' },
        'Teo leans on the doorframe. "Wipe, sticker, next," he says, not unkindly. "We don\'t read the mail, we just deliver the envelope."',
        { if: { var: 'act', gte: 3 }, text: 'The crates are fuller these days. Half the machines have corporate asset tags scraped off with a key. Port Lumen is losing jobs, and somebody is selling the furniture.' },
      ],
      choices: [
        {
          text: 'Wipe it, sticker it, next. You\'re paid not to look.',
          effects: [{ money: 45 }, ...bumpJob(120), { stat: 'heat', add: 1 }, { stat: 'mood', add: -3 }],
          goto: 'wiped',
        },
        {
          tag: '[Hardware]',
          text: 'Pull the photos onto a disc before the wipe and leave it, unsigned, at the address on the tax folder.',
          check: {
            skill: 'hardware',
            dc: 13,
            bonuses: [
              { if: { background: 'tinkerer' }, add: 2, label: '+2 (you grew up with a screwdriver)' },
              { if: { var: RETURNED, gte: 1 }, add: 1, label: '+1 (you\'ve done this before)' },
            ],
            success: 'returned',
            fail: 'seen',
            successEffects: [{ var: RETURNED, add: 1 }, { faction: 'fac.hood', add: 2 }, { stat: 'mood', add: 5 }, { stat: 'heat', add: 1 }],
            failEffects: [{ stat: 'heat', add: 6 }, { buff: WATCHED }, { stat: 'stress', add: 6 }, { chance: 0.5, then: [{ complication: 'work' }] }],
          },
        },
        {
          tag: '[Social]',
          text: 'Ask Teo, lightly, where this crate came from.',
          check: {
            skill: 'social',
            dc: 15,
            bonuses: [
              { if: { background: 'class_clown' }, add: 1, label: '+1 (you can ask anything with a grin)' },
              { if: { stat: 'cred', gte: 30 }, add: 2, label: '+2 (the Row knows your name)' },
            ],
            success: 'teo_talks',
            fail: 'teo_cold',
            successEffects: [{ stat: 'cred', add: 2 }, { flag: 'ev_work.knows_the_crates' }],
            failEffects: [{ money: -40 }, { stat: 'stress', add: 5 }, ...strike],
          },
        },
        {
          tag: '[Leave]',
          text: 'Set the laptop down, take off the anti-static strap and walk out through the curtain for the last time.',
          effects: [{ job: null }, { stat: 'mood', add: 4 }, { stat: 'heat', add: -3 }],
          goto: 'quit',
        },
      ],
    },
    wiped: {
      speaker: 'narrator',
      text: [
        'The progress bar crawls. The kid in the paper crown goes grey, then black, then gone. You peel off the old serial sticker with your thumbnail and press a new one into the sticky ghost of it. Next.',
        'Teo slides the envelope across at midnight. It is exactly what he said it would be. He always pays exactly. That\'s how you know it\'s a business.',
      ],
    },
    returned: {
      speaker: 'narrator',
      text: [
        'It takes nine minutes and a blank disc from the spindle by the register. You write nothing on it. On your way home you walk the long way past a narrow house on the Row with a plastic tricycle on the porch, and you slide the disc through the mail slot like a love letter.',
        'You never find out if they figured out what it was. You like to think the kid is eight now and has no idea, and that somebody in that house cried a little at the kitchen table, and that it was the good kind.',
      ],
    },
    seen: {
      speaker: 'narrator',
      text: [
        'The disc drive whines like a dentist\'s drill and Teo is in the doorway before the burn finishes. He doesn\'t shout. He takes the disc, snaps it cleanly in half, and drops it in the bin with the label-remover rags.',
        '"People follow discs," he says. "Discs have fingerprints. Fingerprints have names." He looks at you for a long moment. "Now somebody might follow yours." That week you see the same grey sedan on the Row three times.',
      ],
    },
    teo_talks: {
      speaker: 'narrator',
      text: [
        'Teo lights a cigarette he isn\'t supposed to smoke indoors and tells you, because it\'s late and he likes you: storage units that stop getting paid for, office clear-outs, insurance write-offs, "and a few things I prefer not to know about, which I price accordingly."',
        '"You want to know the trick of this room?" he says. "Everybody who works here thinks they\'re the honest one." It is the most honest thing anybody has said to you all year.',
      ],
    },
    teo_cold: {
      speaker: 'narrator',
      text: [
        'The room goes quiet in the way rooms go quiet before a draw. "Curious," Teo says. "Curious is a front-of-the-store quality." Your envelope is forty short at midnight, and there\'s a note in it in careful block capitals: TUITION.',
        { if: onFinalWarning, text: 'He mentions, as you leave, that curious people have been let go before. Nobody here files paperwork. They don\'t need to.' },
      ],
    },
    quit: {
      speaker: 'narrator',
      text: [
        'The beads clack behind you. At the front counter a fourteen-year-old is agonizing between the purple pager and the green one. You tell her green. You walk out onto Sodium Row with no job and a strange lightness, like you\'ve set down a crate you didn\'t know you were carrying.',
      ],
    },
  },
}

const curtainSerials: EventDef = {
  id: 'ev_work_curtain_serials',
  category: 'work',
  weight: 3,
  repeatable: true,
  cooldownDays: 110,
  when: { all: [REFURB, free] },
  scene: 'ev_work_curtain_serials_scene',
}

// ── ev_work_extra_fields ────────────────────────────────────────────────────
// Once. Brightline's "verification" script grows three new fields, and one caller is too trusting.
const BRIGHTLINE: Cond = { job: 'job_shady_verification' }

const fieldsScene: SceneDef = {
  id: 'ev_work_extra_fields_scene',
  channel: 'dialog',
  title: 'Script Revision 4',
  start: 'floor',
  nodes: {
    floor: {
      speaker: 'narrator',
      text: [
        'Monday on the Brightline floor. The windowless room hums with forty headsets and a ventilation system that has never once smelled like outside. The supervisor, a cheerful man named Corwin Blythe who calls everyone "champ," hands out Script Revision 4 with a box of glazed donuts.',
        'Revision 4 has three new fields. They have nothing to do with "verifying consumer records." They are the kind of questions a friendly voice should never ask a stranger, and the script has little smiley faces printed beside them.',
        'Your first call is Mrs. Adaeze Oduya of Tern Street, eighty-one, who is delighted that someone has called, and who would be happy to answer anything at all, dear, just give her a moment to find her glasses.',
        { if: { faction: 'fac.aperture', gte: 30 }, text: 'You know whose logo is on the checks that pay for these donuts. You\'ve seen the Millgate lobby fountain. You have a good guess where the new fields go.' },
      ],
      choices: [
        {
          text: 'Read the script. Every field. Smile while you do it — they can hear the smile.',
          effects: [{ money: 60 }, ...bumpJob(200), { faction: 'fac.aperture', add: 3 }, { faction: 'fac.hood', add: -2 }, { stat: 'mood', add: -8 }],
          goto: 'read_it',
        },
        {
          tag: '[Social]',
          text: 'Skip the new fields and keep your numbers up anyway, charming your way through the quota so nobody checks.',
          check: {
            skill: 'social',
            dc: 16,
            bonuses: [
              { if: { trait: 'silver_tongue' }, add: 2, label: '+2 (silver tongue)' },
              { if: { trait: 'empath' }, add: 1, label: '+1 (you know how to end a call kindly)' },
            ],
            success: 'skipped',
            fail: 'flagged',
            successEffects: [{ buff: GOOD_WORD }, { stat: 'mood', add: 3 }, { flag: 'ev_work.skipped_fields' }],
            failEffects: [...strike, { buff: WATCHED }, { stat: 'stress', add: 8 }, { if: onFinalWarning, then: [{ trait: 'ev_work_difficult' }] }],
          },
        },
        {
          tag: '[OpSec]',
          text: 'Memorize the call-routing codes on Corwin\'s clipboard. Somebody outside this room should know what Revision 4 is for.',
          check: {
            skill: 'opsec',
            dc: 17,
            bonuses: [
              { if: { background: 'latchkey' }, add: 2, label: '+2 (latchkey kid)' },
              { if: { faction: 'fac.bureau', gte: 20 }, add: 1, label: '+1 (you know who to hand it to)' },
            ],
            success: 'smuggled',
            fail: 'caught_looking',
            successEffects: [{ faction: 'fac.aperture', add: -3 }, { faction: 'fac.hood', add: 3 }, { faction: 'fac.bureau', add: 2 }, { flag: 'ev_work.leaked_revision4' }, { stat: 'heat', add: 3 }],
            failEffects: [...firedNow, { trait: 'ev_work_difficult' }, { faction: 'fac.aperture', add: -6 }, { stat: 'heat', add: 8 }, { buff: WATCHED }, { complication: 'work' }],
          },
        },
        {
          tag: '[Leave]',
          text: 'Tell Mrs. Oduya, gently, to hang up — and never tell anyone who calls her these things. Then take off the headset.',
          effects: [{ job: null }, { faction: 'fac.hood', add: 4 }, { faction: 'fac.aperture', add: -4 }, { stat: 'mood', add: 6 }],
          goto: 'hung_up',
        },
      ],
    },
    read_it: {
      speaker: 'narrator',
      text: [
        'Mrs. Oduya finds her glasses. She answers everything. She tells you about her late husband, who fixed trams, and her grandson in Tacoma, and at the end she says, "You\'ve been so kind to call, dear," and you type the last smiley-face field into the form and press SUBMIT.',
        'Corwin gives you a gold star on the leaderboard. You are top of the floor by Thursday. You don\'t eat any of the donuts all week, and you couldn\'t tell anyone why.',
      ],
    },
    skipped: {
      speaker: 'narrator',
      text: [
        'You verify Mrs. Oduya\'s name and street, the way a verification clerk is supposed to, and then you let her tell you about the trams for four minutes because she wants to, and you end the call with the new fields blank.',
        'You do it all day. You talk faster and warmer than anyone on the floor, and your call count is so high nobody looks at the empty boxes. Corwin calls you "champ" twice. Somewhere a form arrives at Millgate with forty missing answers. It\'s not a revolution. It is forty.',
      ],
    },
    flagged: {
      speaker: 'narrator',
      text: [
        'The quality team pulls a random sample on Wednesday, and your sample is all blank boxes. Corwin comes by with a donut and a printout. "Champ," he says, "the fields are the job." He writes something on a sticky note and puts it in a folder, and the folder goes into a drawer that locks.',
        { if: onFinalWarning, text: 'Your file is thick now. Somewhere in the Brightline system you have a one-word summary. You find out later, from a reference call that goes badly, what the word is.' },
        'A man in a nice suit you have never seen before stands at the back of the floor for an hour that afternoon, watching. Mostly watching you.',
      ],
    },
    smuggled: {
      speaker: 'narrator',
      text: [
        'You never write anything down. You just keep glancing at the clipboard between calls, the way a bored clerk glances at the clock, and by lunch you have it. That night it goes, word by word, into an envelope and under the right door.',
        'Three weeks later the Herald runs a small item, page nine: CONSUMER GROUP QUESTIONS "VERIFICATION" CALL CENTERS. Revision 5 arrives on the floor soon after. It has two fewer fields. Corwin doesn\'t know why. You do.',
      ],
    },
    caught_looking: {
      speaker: 'narrator',
      text: [
        'You glance one time too many. Corwin notices, and Corwin — it turns out — is not only cheerful. By two o\'clock you are in a small room with a security man and a very long form of your own to sign, the one about "proprietary process confidentiality."',
        'They walk you out through the loading dock so the floor won\'t see. Your badge stops working before you reach the street. The grey sedan in the lot doesn\'t leave until you do.',
      ],
    },
    hung_up: {
      speaker: 'narrator',
      text: [
        '"Mrs. Oduya," you say, quietly, off-script. "Please hang up now. And if anybody ever calls and asks you these things, even somebody nice — especially somebody nice — hang up on them too." A long pause. "Oh," she says. "Oh, I see. Thank you, dear." Click.',
        'You set the headset on the desk. Corwin calls "champ?" after you, sounding genuinely wounded, all the way to the door. The Millgate air outside smells like diesel and rain, and it is the best thing you have ever breathed.',
      ],
    },
  },
}

const extraFields: EventDef = {
  id: 'ev_work_extra_fields',
  category: 'work',
  weight: 4,
  when: { all: [BRIGHTLINE, actGte(2), free] },
  scene: 'ev_work_extra_fields_scene',
}

// ── ev_work_thin_envelope ───────────────────────────────────────────────────
// Repeatable. Switch's Friday envelope comes up short, and the crew is watching what you do.
const CREW: Cond = { job: 'job_shady_switch_crew' }
const switchHere: Cond = { all: [around('switch'), { npc: 'switch', fateNot: ['sellout'] }] }

const envelopeScene: SceneDef = {
  id: 'ev_work_thin_envelope_scene',
  channel: 'dialog',
  title: 'Friday Envelope',
  start: 'count',
  nodes: {
    count: {
      speaker: 'narrator',
      text: [
        'Friday in the Sodium Row back room. Switch hands out the envelopes like a teacher returning tests, each one with a sticky note: "commons don\'t pay rent." Yours is thin. You count it twice under the table. It\'s a third short.',
        'Across the room, a kid called Pim who does the teardowns has counted his too. He\'s looking at the floor. Nobody says anything. Everybody is waiting for somebody else to.',
        { if: { flag: 'npc.switch.courted' }, text: 'You took Switch\'s side in the back room once. He glances at you, and for a second the calculator-watch cool slips — he knows you\'ve noticed.' },
        { if: { npc: 'switch', fate: 'new_sysop' }, text: 'Switch runs the whole board now, and the envelopes have got more regular, not less. Which makes a thin one stranger.' },
      ],
      choices: [
        {
          text: 'Pocket it and let it go. Switch is good for it. Probably.',
          effects: [{ money: 30 }, { npc: 'switch', affinity: 2 }, { stat: 'mood', add: -2 }],
          goto: 'let_go',
        },
        {
          tag: '[Business]',
          text: 'Ask to see the ledger after everyone leaves. Find where the money actually went.',
          check: {
            skill: 'business',
            dc: 14,
            bonuses: [
              { if: { background: 'mathlete' }, add: 2, label: '+2 (mathlete)' },
              { if: { npc: 'switch', affinityGte: 40 }, add: 1, label: '+1 (he trusts you with the book)' },
            ],
            success: 'ledger',
            fail: 'ledger_bad',
            successEffects: [{ money: 70 }, { npc: 'switch', affinity: 5 }, { faction: 'fac.loft', add: 3 }, { buff: GOOD_WORD }],
            failEffects: [{ npc: 'switch', affinity: -6 }, { faction: 'fac.loft', add: -3 }, { stat: 'stress', add: 6 }],
          },
        },
        {
          tag: '[Social]',
          text: 'Say it out loud, for Pim and everyone else: "Ray. We\'re short."',
          check: {
            skill: 'social',
            dc: 15,
            bonuses: [
              { if: { stat: 'cred', gte: 40 }, add: 2, label: '+2 (the crew respects you)' },
              { if: { trait: 'silver_tongue' }, add: 1, label: '+1 (silver tongue)' },
            ],
            success: 'called_out',
            fail: 'called_bad',
            successEffects: [{ money: 70 }, { faction: 'fac.loft', add: 4 }, { stat: 'cred', add: 3 }, { npc: 'switch', affinity: -1 }],
            failEffects: [{ job: null }, { npc: 'switch', affinity: -10 }, { stat: 'cred', add: -4 }, { stat: 'mood', add: -5 }],
          },
        },
        {
          tag: '[$50]',
          req: { stat: 'money', gte: 50 },
          reqText: 'Requires $50',
          text: 'Slip Pim fifty of your own on the way out. He has a kid sister and rent on Tern Street.',
          effects: [{ money: -20 }, { faction: 'fac.hood', add: 3 }, { stat: 'mood', add: 4 }],
          goto: 'pim',
        },
      ],
    },
    let_go: {
      speaker: 'narrator',
      text: [
        'You fold the envelope into your jacket and say nothing. On Monday Switch claps your shoulder, a beat too long, and says "appreciate you." The next Friday your envelope is full, with an extra twenty and no note at all.',
      ],
    },
    ledger: {
      speaker: 'narrator',
      text: [
        'The ledger is a spiral notebook in handwriting like barbed wire, but the numbers are honest, and after forty minutes you find it: a buyer who "paid" in a promise, and Switch covering the gap out of everyone\'s wages instead of his own cut.',
        '"You\'re right," Switch says, after a long silence that costs him something. "Crew gets paid first. That\'s the rule. I broke it." He makes it right on the spot, out of his own duffel, and — for the first time — starts leaving the book open on the table on Fridays.',
      ],
    },
    ledger_bad: {
      speaker: 'narrator',
      text: [
        'You get lost in the barbed-wire handwriting and end up pointing at a number that turns out to be a phone number. Switch closes the notebook. "Auditor," he says flatly. "Didn\'t know I hired an auditor." For a month you get the worst setups and the latest teardowns and not one Friday joke.',
      ],
    },
    called_out: {
      speaker: 'narrator',
      text: [
        'The room goes very still. Switch looks at you, then at Pim, then at the eight other thin envelopes. Then he laughs — a real one — and empties his own duffel onto the table. "Okay. Okay! Democracy. Look at us, a real commons." Everybody gets paid. Pim buys you a soda on the way out and can\'t quite look at you, which is how you know it mattered.',
      ],
    },
    called_bad: {
      speaker: 'narrator',
      text: [
        'You say it and nobody backs you. Not Pim, not anyone; they all need next Friday too. Switch smiles, very friendly, and takes your envelope back out of your hand. "Short\'s better than none," he says. "You want none, that\'s fine too." You are off the crew before you reach the door.',
      ],
    },
    pim: {
      speaker: 'narrator',
      text: [
        'You fold the fifty into Pim\'s hand in the stairwell and say "don\'t" before he can say anything. He doesn\'t. Next week he gives you thirty back, crumpled, which is more than he can spare and exactly what he decided he owed. You keep the thirty. You never spend those particular three tens.',
      ],
    },
  },
}

const thinEnvelope: EventDef = {
  id: 'ev_work_thin_envelope',
  category: 'work',
  weight: 3,
  repeatable: true,
  cooldownDays: 130,
  when: { all: [CREW, switchHere, free] },
  scene: 'ev_work_thin_envelope_scene',
}

export default defineContent({
  scenes: [curtainScene, fieldsScene, envelopeScene],
  events: [curtainSerials, extraFields, thinEnvelope],
})
