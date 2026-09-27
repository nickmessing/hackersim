/**
 * PKG-06 — `fac_aperture_q2_retainer` — "The Retainer" (bible §7.2.2).
 *
 * Aperture puts you on a monthly retainer: tidy little "data hygiene" jobs, each of which is a
 * real breach being washed until it reads like a spreadsheet. The moral gradient of the whole arc
 * in one scene — you can keep your head down and get paid, quietly build a case against them, or
 * (at Trusted) become the broker who sells the scene itself.
 *
 * Hacking is fiction: the "work" is abstract records-laundering flavor, never real technique.
 *
 * Sets: `fac.aperture.knowing/.muzzled/.suspect_you`, `a2.building_a_case`, `npc.corvid.bought`,
 * `evidence_fragments` (+, read by PKG-04 `trig_evidence`), `w.enclosure`/`w.exposure` (+).
 * Cross-package reads: `a2.refused_kroll` (PKG-02).
 */
import { defineContent } from '@/engine/registry'
import type { QuestDef, SceneDef } from '@/engine/types'

const quest: QuestDef = {
  id: 'fac_aperture_q2_retainer',
  title: 'Special Accounts: The Retainer',
  kind: 'faction',
  act: 2,
  faction: 'fac.aperture',
  giver: 'kroll',
  priority: 22,
  autoStart: {
    all: [
      { quest: 'fac_aperture_q1_dinner', status: 'completed' },
      { faction: 'fac.aperture', gte: 20 },
      { var: 'act', gte: 2 },
    ],
  },
  rewards: 'Steady dirty money — or the first page of a case against them',
  summary:
    'Aperture wants you on a retainer: a folder of "data hygiene" jobs every month, no questions, generous pay. Every folder is somebody\'s stolen life, ironed flat. Decide what kind of client you\'re going to be.',
  start: 'work',
  stages: {
    work: {
      text:
        'Hollis left a leather folio on your desk and a pen that costs more than your monitor. The retainer is real money on a schedule. Read the first folder, then decide how far in you\'re going.',
      onEnter: [{ scene: 'aperture_retainer' }],
      objectives: [
        {
          id: 'decide',
          text: 'Decide how you\'ll handle Aperture\'s retainer',
          when: { flag: 'fac.aperture.retainer_done' },
          hint: 'Open the dialog from Aperture. Signing the folio is the safe money; skimming a copy is the brave one (and if Compliance catches the skim, they come to audit you); there\'s a third door if the firm already trusts you.',
        },
      ],
    },
  },
}

/**
 * The vendor audit — the skim's fail branch played out (REDESIGN_V2 §D). Every road through it
 * leaves a lasting mark: an asset tag on your machine, an open file in Hollis's folio, or a
 * clawback on the retainer you signed.
 */
const audit: SceneDef = {
  id: 'aperture_vendor_audit',
  channel: 'dialog',
  title: 'Routine Vendor Audit',
  from: 'hollis',
  start: 'knock',
  nodes: {
    knock: {
      speaker: 'hollis',
      text: [
        'Saturday, 8:02 a.m. Miles Hollis is at your door in a Saturday version of his grey suit, which is the same suit. Behind him, a tired technician with a rolling hard case and a lanyard that says VISITOR in three languages.',
        '"Routine vendor audit," he says. "Clause fourteen, subsection c, which you signed with a very smooth pen. We image the equipment you use for Aperture work. Forty-eight hours. You\'ll have it back cleaner than you left it." He does not ask to come in. He simply waits to be asked, the way weather waits.',
        {
          if: { flag: 'a2.building_a_case' },
          text: 'The copy you skimmed isn\'t on this machine — you were careful about that much. But the machine knows where you put it, the way a dog knows where the bone is buried, and you have no idea how good their technician is at asking dogs.',
        },
      ],
      choices: [
        {
          tag: '[Comply]',
          text: 'Unplug the tower and hand it over. Let them look.',
          effects: [
            { trait: 'pkg06_aperture_asset_tag' },
            { flag: 'fac.aperture.audited' },
            { faction: 'fac.aperture', add: 3 },
          ],
          goto: 'imaged',
        },
        {
          tag: '[OpSec DC 17]',
          text: 'Hand them the decoy machine you built for exactly this Saturday: boring files, boring history, a boring person.',
          check: {
            skill: 'opsec',
            dc: 17,
            bonuses: [
              { if: { trait: 'paranoid' }, add: 2, label: '+2 (you built it months ago, just in case)' },
              { if: { flag: 'fac.aperture.knowing' }, add: 1, label: '+1 (you know how they audit)' },
            ],
            success: 'decoy_ok',
            fail: 'decoy_caught',
            successEffects: [
              { flag: 'fac.aperture.audit_passed' },
              { faction: 'fac.aperture', add: 2 },
            ],
            failEffects: [
              { trait: 'pkg06_aperture_open_file' },
              { faction: 'fac.aperture', add: -6 },
              { stat: 'heat', add: 6 },
              {
                if: { job: null },
                then: [{ chance: 0.5, then: [{ complication: 'legal' }] }],
                else: [{ chance: 0.5, then: [{ complication: 'work' }] }],
              },
            ],
          },
        },
        {
          tag: '[Refuse]',
          text: '"Get a warrant, Miles."',
          effects: [
            { faction: 'fac.aperture', add: -8 },
            { flag: 'fac.aperture.clawback' },
            { obligation: { id: 'pkg06_aperture_clawback', label: 'Aperture retainer clawback (clause 14c)', perDay: 45, days: 90 } },
          ],
          goto: 'refused',
        },
      ],
    },
    imaged: {
      speaker: 'narrator',
      text: [
        'They bring it back Monday at 8:02 a.m. exactly. Every file where you left it. Every setting untouched. The case has been wiped down, and there is a small laminated tag on the back panel that wasn\'t there before: PROPERTY OF APERTURE CONSUMER INSIGHT — ASSET #40032.',
        { if: { seen: 'loft_switch_discarded' }, text: 'Forty-oh-thirty-two. Switch\'s stolen ficus was forty-oh-thirty-one. You are, apparently, the next thing Aperture owns.' },
        'You try to peel the tag off. It is the kind that leaves a ghost. You boot the machine and it is exactly as fast as it was, and it feels slower, and it feels like someone else\'s.',
      ],
      next: 'imaged_hollis',
    },
    imaged_hollis: {
      speaker: 'hollis',
      text: '"Nothing irregular," Hollis says on the phone, which from him is either an acquittal or a promise. "Ms. Kroll will be pleased. I am rarely pleased. Keep the tag on, please. We like to know where our things are."',
    },
    decoy_ok: {
      speaker: 'narrator',
      text: [
        'The technician images a machine that has never done anything interesting in its life: a tax program, a solitaire high score, a folder of recipes you downloaded for texture. She yawns twice. Hollis reads her report standing in your hallway.',
        '"Remarkably dull," he says, and closes the leather folio on the tab with your name on it. It is the most dangerous compliment you\'ve ever been paid, and you earned every boring byte of it.',
      ],
    },
    decoy_caught: {
      speaker: 'hollis',
      text: [
        'The technician is good. She finds nothing — and then she finds the clock. "Installed Tuesday," she says quietly, to Hollis, not to you. "Everything on it. Tuesday."',
        'Hollis nods as if confirming a lunch order. "A machine born on Tuesday, for an audit scheduled on Monday. That\'s very organized of you." He writes one line in the folio. "You are, at present, an open file. I\'ll be making a few courtesy calls. People who work with you should know you\'re being careful."',
      ],
      next: 'caught_end',
    },
    caught_end: {
      speaker: 'narrator',
      text: 'The door closes. The file stays open. From now on, somewhere in Millgate, every time your name crosses a desk, a grey man reads it twice.',
    },
    refused: {
      speaker: 'hollis',
      text: [
        '"We are not the police," Hollis says, genuinely puzzled that anyone could think so. "We don\'t need warrants. We have contracts. Clause fourteen, subsection c, paragraph two: a vendor who declines review returns the retainer, prorated, by installment." He hands you a statement. It is already printed. It already has your name on it.',
        'Kroll leaves a voicemail that evening, amused: "Miles is very literal about paper, darling. Pay him. It\'s cheaper than being interesting."',
      ],
      choices: [
        {
          tag: '[Pay $4,000]',
          text: 'Write the check now. Every cent. Owe them nothing.',
          if: { stat: 'money', gte: 4000 },
          effects: [{ money: -4000 }, { removeObligation: 'pkg06_aperture_clawback' }, { faction: 'fac.aperture', add: 2 }],
          goto: 'refused_paid',
        },
        {
          text: 'Pay it by the week. Let them wait for their money, the way they make everyone else wait.',
          goto: 'refused_weekly',
        },
      ],
    },
    refused_paid: {
      speaker: 'hollis',
      text: '"Prompt," he says, and it almost sounds like respect. "Most people make me send a second letter." The check disappears into the folio. "We\'ll still be here, of course. We\'re always still here."',
    },
    refused_weekly: {
      speaker: 'narrator',
      text: 'Every week, forty-five dollars a day of your life goes back to Millgate for a pen you signed with once. It is the most honest bill you have ever paid: it says exactly who owns you, and exactly how much.',
    },
  },
}

const scene: SceneDef = {
  id: 'aperture_retainer',
  channel: 'dialog',
  title: 'The Retainer',
  from: 'hollis',
  start: 'intro',
  nodes: {
    intro: {
      speaker: 'hollis',
      text: [
        'Miles Hollis sets the folio down as if it might bruise. "Ms. Kroll authorized a retainer. Monthly. You will receive folders. You will return them clean." He slides the pen across. "This is a compliment. Compliments at Aperture come with signatures."',
        'You open the first folder. It is a customer database from a regional pharmacy chain — names, refill histories, addresses of people who buy the medicines you don\'t say out loud. Your job is to "reconcile" it: strip the part that proves it was stolen, keep the part that PARALLAX can sell.',
        {
          if: { flag: 'a2.refused_kroll' },
          text: 'A second card is paperclipped to the inside cover, in Kroll\'s hand: "You said no last time. I respected that. So this one pays double, and you can stop whenever your conscience does. — V." It is, somehow, the most generous threat you have ever received.',
        },
      ],
      next: 'pitch',
    },
    pitch: {
      speaker: 'hollis',
      text: [
        '"The work is dull," Hollis says, which at Aperture is the highest praise a task can earn. "Dull is safe. Dull does not end up on the news." He caps and uncaps the pen. "Ms. Kroll would like you to find it dull too."',
        'The folder in your hands is a real breach. You can smell it. Somewhere a small firm is still telling its customers everything is fine.',
      ],
      choices: [
        {
          text: 'Sign the folio. Do the work, don\'t look too hard.',
          tag: '[Comply]',
          effects: [
            { faction: 'fac.aperture', add: 10 },
            { money: 4000 },
            { var: 'w.enclosure', add: 1 },
            { flag: 'fac.aperture.knowing' },
            { flag: 'fac.aperture.muzzled' },
            { flag: 'fac.aperture.retainer_done' },
          ],
          goto: 'signed',
        },
        {
          text: 'Do the work — but skim a copy of the raw breach for yourself.',
          tag: '[Opsec 16]',
          check: {
            skill: 'opsec',
            dc: 16,
            success: 'skim_ok',
            fail: 'skim_flagged',
            bonuses: [
              {
                if: { flag: 'fac.aperture.knowing' },
                add: 2,
                label: '+2 (you know how they audit now)',
              },
            ],
            successEffects: [
              { faction: 'fac.aperture', add: 8 },
              { money: 4000 },
              { flag: 'a2.building_a_case' },
              { var: 'evidence_fragments', add: 1 },
              { var: 'w.exposure', add: 1 },
              { flag: 'fac.aperture.muzzled' },
              { flag: 'fac.aperture.retainer_done' },
            ],
            failEffects: [
              { faction: 'fac.aperture', add: 4 },
              { money: 4000 },
              { flag: 'a2.building_a_case' },
              { var: 'evidence_fragments', add: 1 },
              { var: 'w.exposure', add: 1 },
              { flag: 'fac.aperture.suspect_you' },
              { flag: 'fac.aperture.muzzled' },
              { flag: 'fac.aperture.retainer_done' },
              { stat: 'heat', add: 10 },
              // Hollis doesn't let a tripped checksum go: a "routine vendor audit" is coming.
              { scene: 'aperture_vendor_audit', delayHours: 24 * 10 },
            ],
          },
        },
        {
          text: 'Ask Kroll what a person could really make, moving things Aperture can\'t touch.',
          tag: '[Broker]',
          req: { faction: 'fac.aperture', gte: 50 },
          reqText: 'Requires: Aperture Trusted (rep 50)',
          goto: 'broker',
        },
        {
          text: '"Keep the pen. I\'m out of the folder business."',
          tag: '[Walk away]',
          effects: [
            { faction: 'fac.aperture', add: -8 },
            { flag: 'npc.kroll.wary' },
            { flag: 'fac.aperture.retainer_done' },
          ],
          goto: 'walk',
        },
      ],
    },
    signed: {
      speaker: 'hollis',
      text: [
        'You sign. The pen is very smooth. Hollis takes it back before the ink is dry, as if the pen, too, is on a retainer.',
        '"You\'ll do well here," he says, and for once it doesn\'t sound like a threat. That is worse. The folder goes back in the folio clean, and a number lands in an account with no name on it.',
        {
          if: { trait: 'empath' },
          text: 'You find yourself reading one of the names twice — a woman on Cannery Row, three refills a month. You close the folder before you can memorize the street. Some doors you shut so you can keep walking.',
        },
      ],
      next: 'end_signed',
    },
    end_signed: {
      speaker: 'narrator',
      text:
        'The retainer is yours now. So is the small, expensive silence that comes with it. Dull is safe. You are getting very good at dull.',
    },
    skim_ok: {
      speaker: 'player',
      text: [
        'You do the reconciliation exactly as asked — and while their audit tool is looking at the front door, you copy the whole ugly original out the back. Clean. Unhurried. The way Mira would.',
        'It goes somewhere only you know about. A first page. A firm this careful will have thousands of pages, and now you have proof the pages exist.',
      ],
      next: 'end_skim',
    },
    end_skim: {
      speaker: 'narrator',
      text:
        'Aperture got its clean folder. You got the receipt Aperture spends millions to never leave. Keep collecting them. Three of these and you\'ve got a sample nobody can call a rumor.',
    },
    skim_flagged: {
      speaker: 'hollis',
      text: [
        'You get the copy. You also trip something — a quiet checksum on the raw file that you didn\'t know was there until it was already behind you.',
        'The next morning there is a second folio on your desk, empty, and a note in Hollis\'s square hand: "We audit the auditors. Nothing is wrong. I merely wanted you to know that I could tell if it were." He knows. He can\'t prove it. Yet.',
        'Stapled to the back of the note, a form: VENDOR COMPLIANCE REVIEW — SCHEDULED. There is a date on it. It is a Saturday.',
      ],
      next: 'end_skim_flagged',
    },
    end_skim_flagged: {
      speaker: 'narrator',
      text:
        'You kept the copy. That was the point, and it\'s still true. But somewhere in Millgate a grey man has written your name at the top of a clean page, and Saturday is coming.',
    },
    broker: {
      speaker: 'kroll',
      text: [
        'Kroll takes the call herself, of course. "There it is," she says, delighted, as if you\'d finally gotten a joke she told years ago. "You want to know the number."',
        '"The scene you run with keeps a list. Contacts, handles, real names, who owes whom. Corvid\'s little census of everyone who ever trusted her." A pause you could park a car in. "I don\'t want it stolen. I want it *sold*, by someone it will believe. That someone is worth a great deal to me."',
      ],
      choices: [
        {
          text: 'Sell them Corvid\'s list.',
          tag: '[Sell the scene]',
          effects: [
            { faction: 'fac.aperture', add: 20 },
            { money: 25000 },
            { faction: 'fac.loft', add: -40 },
            { flag: 'npc.corvid.bought' },
            { var: 'w.enclosure', add: 2 },
            { flag: 'fac.aperture.muzzled' },
            { flag: 'fac.aperture.retainer_done' },
          ],
          goto: 'sold_list',
        },
        {
          text: '"The list isn\'t mine to sell. Give me a folder instead."',
          tag: '[Refuse]',
          effects: [
            { faction: 'fac.aperture', add: 6 },
            { money: 4000 },
            { flag: 'fac.aperture.knowing' },
            { flag: 'fac.aperture.muzzled' },
            { flag: 'fac.aperture.retainer_done' },
          ],
          goto: 'broker_declined',
        },
      ],
    },
    sold_list: {
      speaker: 'kroll',
      text: [
        'It is the easiest theft you will ever commit, because it isn\'t one. Corvid hands you the archive herself, for safekeeping, and you keep it — in Aperture\'s hands. The money is obscene and arrives before you\'ve finished feeling anything about it.',
        '"You understand this can\'t be undone," Kroll says gently, not as a warning — as a comfort. "Nobody will ever know it was you. I\'ll make sure of it. That\'s what Special Accounts *is*, darling. We make the not-knowing." Somewhere a board of forty people that has never ratted anyone just did, through you.',
      ],
      next: 'end_broker',
    },
    broker_declined: {
      speaker: 'kroll',
      text:
        '"No," she agrees, unbothered, already moving on. "Of course not. It\'s good that you have a line. I\'ll enjoy finding out where it is." She sends a folder instead, and a fruit basket, and a card that just says "Someday."',
      next: 'end_broker',
    },
    end_broker: {
      speaker: 'narrator',
      text:
        'The retainer runs on. Whatever you did at the top of the ladder, the folders keep coming at the bottom, every month, patient as rent.',
    },
    walk: {
      speaker: 'kroll',
      text: [
        'Kroll calls that evening, warm as ever. "You dropped the pen," she says. "Metaphorically. It\'s fine. Most people can\'t hold it." No anger. No leverage, even — just the sound of a door being left, deliberately, unlocked.',
        '"When the folders start looking like the only way to pay for something you love, you\'ll call. They always love something." She isn\'t wrong, and you both hear that she isn\'t.',
      ],
    },
  },
}

export default defineContent({
  quests: [quest],
  scenes: [scene, audit],
})
