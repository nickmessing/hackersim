/**
 * COMPLICATION PACK — gig source, part 2 (freelance life biting back).
 *
 *   cx_ops_scope_creep     T1-4  repeatable — "one tiny change" becomes forty; hold the line or drown.
 *   cx_ops_blamed_crash    T3-5  once, quest — a client's server dies months after your job and they blame you.
 *   cx_ops_undercutter     T2-5  once — a rival freelancer bids half your rate and badmouths you to clients.
 *   cx_ops_client_bankrupt T2-5  repeatable — the client folds owing you money; creditor meetings or write it off.
 *
 * Every client, rival and business here is invented.
 */
import { defineContent } from '@/engine/registry'
import type { EventDef, QuestDef, SceneDef } from '@/engine/types'
import { buff, debuff, owe, scar } from './_shared'

// ─────────────────────────────────────────────────────────────────────────────
// cx_ops_scope_creep — "just one more tiny thing"
// ─────────────────────────────────────────────────────────────────────────────
const creepScene: SceneDef = {
  id: 'cx_ops_scope_creep_scene',
  channel: 'mail',
  title: 're: re: re: re: FINAL changes (really final this time!!)',
  from: 'Gary at Harbor Blinds & Awnings',
  start: 'mail',
  nodes: {
    mail: {
      speaker: 'Gary at Harbor Blinds & Awnings',
      text: [
        '"Hey buddy! Love what you did, my wife loves it, my brother-in-law has NOTES. Couple tiny things: can the logo spin? Can the prices update themselves from my spreadsheet? Can it work on my cousin\'s computer, which is a different kind of computer? And the guestbook should email me but not too much."',
        '"Shouldn\'t take long for a whiz like you!! Same price obviously, we already agreed on the price. — G"',
        'The job was quoted at eight hours. You are at nineteen. The spreadsheet, you already know, is a photograph of a spreadsheet.',
      ],
      choices: [
        {
          text: 'Send a polite change-order: new work, new invoice.',
          tag: '[Business DC 13]',
          check: {
            skill: 'business',
            dc: 13,
            success: 'order_ok',
            fail: 'order_no',
          },
        },
        {
          text: 'Just do it all. Gary is a nice guy, probably.',
          effects: [
            debuff('cx_ops_creep_grind', 'Scope Creep', 21, [{ key: 'freelance.speed', mult: 0.8 }, { key: 'stress.gain', mult: 1.1 }], 'Gary\'s "tiny things" are eating every freelance hour you have.'),
            { stat: 'stress', add: 6 },
            { flag: 'cx_ops.creep_caved' },
          ],
          goto: 'caved',
        },
        {
          text: 'Walk away from the job. Keep the deposit, lose the client.',
          effects: [{ stat: 'mood', add: 2 }, { stat: 'cred', add: -1 }, { flag: 'cx_ops.creep_walked' }],
          goto: 'walked',
        },
      ],
    },
    order_ok: {
      speaker: 'Gary at Harbor Blinds & Awnings',
      text: '"Oh! Oh, sure, I get it, you gotta eat. Honestly my brother-in-law said you\'d cave. Send the invoice." He pays it, and three weeks later he sends you his sister-in-law, who runs a bakery and has a budget.',
      effects: [{ money: 180 }, { xp: 'business', add: 60 }, scar('cx_ops_scar_hard_bargainer')],
    },
    order_no: {
      speaker: 'Gary at Harbor Blinds & Awnings',
      text: [
        '"Wow. Wow. After I gave you a CHANCE?" The reply is long, typed in caps, and cc\'s his whole family. He pays the original fee, minus a "disappointment discount" of forty dollars, and tells the Harbor Point Merchants\' Association you are "difficult".',
        'For a while, the local shop-owner referrals just stop.',
      ],
      effects: [
        { money: -40 },
        debuff('cx_ops_creep_rep', 'Word Around the Merchants\' Association', 45, [{ key: 'freelance.pay', mult: 0.9 }], 'Small-business owners trade notes, and Gary\'s notes about you are not kind.'),
      ],
    },
    caved: {
      speaker: 'narrator',
      text: 'You do the spinning logo. You do the spreadsheet photograph. You do it on the cousin\'s computer, which turns out to be a toaster-shaped thing from a mail-order catalog. Gary sends a thank-you card with a coupon for 10% off awnings. The rest of your gig queue waits, and waits.',
    },
    walked: {
      speaker: 'narrator',
      text: 'You send a short, civil note and a partial handover. Gary replies with a single sad face. Somewhere, a spinning logo will never be born. You feel lighter than you have in weeks.',
    },
  },
}

const scopeCreep: EventDef = {
  id: 'cx_ops_scope_creep',
  category: 'work',
  complication: { sources: ['gig'], minTier: 1, maxTier: 4 },
  repeatable: true,
  cooldownDays: 150,
  scene: 'cx_ops_scope_creep_scene',
}

// ─────────────────────────────────────────────────────────────────────────────
// cx_ops_blamed_crash — "your code killed our server" (it didn't… probably)
// ─────────────────────────────────────────────────────────────────────────────
const crashAccuse: SceneDef = {
  id: 'cx_ops_blamed_crash_scene',
  channel: 'mail',
  title: 'URGENT — outage caused by your work — legal action',
  from: 'Delmar Freight Office Manager',
  start: 'mail',
  nodes: {
    mail: {
      speaker: 'Delmar Freight Office Manager',
      text: [
        '"Our office server went down Tuesday and we lost four days of shipping records. Our nephew — who is very good with computers — says it was \'the stuff the freelancer installed\'. We expect you to cover the recovery costs of $2,400 or we will be speaking to our attorney."',
        'You finished that job five months ago. You remember the server: a beige tower wedged under a desk next to a space heater, its only backup a stack of unlabeled floppies.',
      ],
      choices: [
        {
          text: 'Go down there and actually diagnose it. Prove what happened.',
          tag: '[Systems DC 16]',
          check: {
            skill: 'systems',
            dc: 16,
            bonuses: [{ if: { skill: 'hardware', gte: 30 }, add: 2, label: '+2 (you know beige boxes)' }],
            success: 'proved',
            fail: 'unclear',
          },
        },
        {
          text: 'Offer to rebuild their system at cost, no admission of fault.',
          effects: [{ flag: 'cx_ops.crash_rebuild' }],
          goto: 'rebuild',
        },
        {
          text: 'Ignore it. They can\'t prove anything.',
          effects: [{ flag: 'cx_ops.crash_ignored' }],
          goto: 'ignored',
        },
      ],
    },
    proved: {
      speaker: 'narrator',
      text: [
        'You kneel under the desk with a flashlight while the whole office watches. The drive is cooked — literally, the space heater has been blowing on it for a year. You print out the drive\'s own failure log, point at the heater, point at the floppies, and do not say "I told you so", though you did tell them so, in writing, in your handover notes.',
        'The office manager goes red, then quiet, then asks if you do maintenance contracts.',
      ],
      effects: [{ flag: 'cx_ops.crash_cleared' }, { xp: 'systems', add: 90 }, { money: 300 }, scar('cx_ops_scar_thick_skin')],
    },
    unclear: {
      speaker: 'narrator',
      text: 'You poke at it for two hours and can\'t say for certain what died first. The nephew hovers, saying "see?" at intervals. The office manager takes your uncertainty as a confession. A letter on law-firm stationery arrives the following week.',
      effects: [{ stat: 'stress', add: 6 }, { flag: 'cx_ops.crash_suit' }],
    },
    rebuild: {
      speaker: 'narrator',
      text: 'You spend a long weekend rebuilding their records from paper manifests and the nephew\'s "backups" (a folder of screenshots). No lawyer, no thanks, and you are out a weekend and some hardware.',
      effects: [{ money: -350 }, { stat: 'stress', add: 5 }, { xp: 'systems', add: 50 }, { flag: 'cx_ops.crash_settled' }],
    },
    ignored: {
      speaker: 'narrator',
      text: 'You file the email under "nope". Two weeks later, a letter on law-firm stationery arrives, heavier than paper has any right to be.',
      effects: [{ flag: 'cx_ops.crash_suit' }],
    },
  },
}

const crashLetter: SceneDef = {
  id: 'cx_ops_blamed_crash_letter',
  channel: 'mail',
  title: 'Demand letter — Delmar Freight v. you',
  from: 'Okafor & Brandt, Attorneys',
  start: 'letter',
  nodes: {
    letter: {
      speaker: 'Okafor & Brandt, Attorneys',
      text: 'The letter demands $2,400 "in full and final settlement" or they will file. It is exactly as scary as it is meant to be, which is quite scary.',
      choices: [
        {
          text: 'Pay in installments and make it go away.',
          effects: [owe('cx_ops_crash_settlement', 'Delmar Freight settlement', 20, 120), { flag: 'cx_ops.crash_settled' }, scar('cx_ops_scar_botched_rep')],
          goto: 'paid',
        },
        {
          text: 'Write back with your handover notes and the backup warning you sent them.',
          tag: '[Business DC 17]',
          check: {
            skill: 'business',
            dc: 17,
            success: 'dropped',
            fail: 'lost',
          },
        },
      ],
    },
    paid: {
      speaker: 'narrator',
      text: 'You sign the payment plan. It is not an admission, the letter assures you, in the voice of something that is absolutely an admission. Word gets around the freight yards anyway.',
    },
    dropped: {
      speaker: 'Okafor & Brandt, Attorneys',
      text: 'A short reply, three weeks later: "Our client has elected not to pursue this matter." Your handover notes, with the underlined line about backups, did the talking.',
      effects: [{ flag: 'cx_ops.crash_cleared' }, { xp: 'business', add: 80 }, buff('cx_ops_crash_relief', 'Vindicated', 14, [{ key: 'mood.daily', add: 0.5 }])],
    },
    lost: {
      speaker: 'narrator',
      text: 'Your letter is either too angry or not angry enough. They file. The court-ordered judgment is bigger than the demand, and it comes with costs.',
      effects: [owe('cx_ops_crash_judgment', 'Delmar Freight judgment', 28, 120), { flag: 'cx_ops.crash_settled' }, scar('cx_ops_scar_botched_rep'), { stat: 'mood', add: -6 }],
    },
  },
}

const crashQuest: QuestDef = {
  id: 'cx_ops_blamed_crash_q',
  title: 'Complication: The Space Heater Defense',
  kind: 'personal',
  priority: 4,
  rewards: 'Your reputation (and $2,400)',
  summary: 'A former client blames your old work for their server crash and wants you to pay for the damage.',
  start: 'accused',
  stages: {
    accused: {
      text: 'Delmar Freight says your work killed their server. Prove otherwise, make peace, or ignore them and see what happens.',
      onEnter: [{ scene: 'cx_ops_blamed_crash_scene' }],
      objectives: [
        {
          id: 'answer',
          text: 'Answer Delmar Freight',
          when: { any: [{ flag: 'cx_ops.crash_cleared' }, { flag: 'cx_ops.crash_settled' }, { flag: 'cx_ops.crash_suit' }] },
          hint: 'Mail: a Systems check proves the real cause (hardware skill helps); rebuilding at cost avoids lawyers; ignoring them invites a demand letter.',
        },
      ],
      next: [{ if: { flag: 'cx_ops.crash_suit' }, stage: 'letter' }, { stage: 'done' }],
    },
    letter: {
      text: 'Their lawyers sent a demand letter. Settle, or argue your case on paper.',
      onEnter: [{ scene: 'cx_ops_blamed_crash_letter', delayHours: 24 * 14 }],
      objectives: [
        {
          id: 'resolve',
          text: 'Resolve the demand letter',
          when: { any: [{ flag: 'cx_ops.crash_cleared' }, { flag: 'cx_ops.crash_settled' }] },
          hint: 'Paying in installments ends it now. A Business check using your handover notes may make them drop it; failing it means a court judgment.',
        },
      ],
      next: 'done',
    },
    done: {
      text: 'The Delmar Freight business is behind you.',
      objectives: [{ id: 'ok', text: 'Resolved', when: { always: true }, hidden: true, hint: 'Done.' }],
    },
  },
}

const blamedCrash: EventDef = {
  id: 'cx_ops_blamed_crash',
  category: 'money',
  complication: { sources: ['gig'], minTier: 3, maxTier: 5 },
  effects: [{ quest: 'cx_ops_blamed_crash_q', start: true }],
}

// ─────────────────────────────────────────────────────────────────────────────
// cx_ops_undercutter — the half-price kid
// ─────────────────────────────────────────────────────────────────────────────
const undercutScene: SceneDef = {
  id: 'cx_ops_undercutter_scene',
  channel: 'forum',
  board: 'jobs',
  title: 'WEB SITES $99!!! fast cheap BEST in Port Lumen (not like SOME ppl)',
  from: 'Web Wizard Deluxe',
  start: 'post',
  nodes: {
    post: {
      speaker: 'Web Wizard Deluxe',
      text: [
        '"Tired of overpriced freelancers who miss deadlines??? I do FULL sites for $99, flash intro included, 24hr turnaround. Ask the Delgado Bakery about the LAST guy they hired lol."',
        'You were the last guy the Delgado Bakery hired. You finished on time. Two of your regular clients have already emailed to ask if your rates are "flexible".',
      ],
      choices: [
        {
          text: 'Reply publicly with your portfolio and references.',
          tag: '[Social DC 14]',
          check: { skill: 'social', dc: 14, success: 'won_thread', fail: 'flame_war' },
        },
        {
          text: 'Match his price for a while and keep your clients.',
          effects: [debuff('cx_ops_price_war', 'Price War', 60, [{ key: 'freelance.pay', mult: 0.8 }], 'You matched a $99 rival to keep your clients. Your rates will take a while to recover.')],
          goto: 'matched',
        },
        {
          text: 'Ignore him. Good work speaks for itself.',
          effects: [debuff('cx_ops_undercut_quiet', 'Undercut', 30, [{ key: 'freelance.pay', mult: 0.9 }], 'Some clients went for the $99 guy.')],
          goto: 'ignored',
        },
      ],
    },
    won_thread: {
      speaker: 'narrator',
      text: [
        'You post three links, two client quotes and a calm list of what "24hr turnaround" usually means. Someone replies with a screenshot of one of the Wizard\'s sites, which is mostly a spinning skull and a hit counter. The thread turns.',
        'By the end of the week, the Delgado Bakery owner herself posts: "the last guy was great actually, please leave me out of this". Your inbox fills up with people who read the thread.',
      ],
      effects: [{ xp: 'social', add: 60 }, buff('cx_ops_thread_win', 'Won the Thread', 45, [{ key: 'freelance.pay', mult: 1.1 }], 'Everyone on the jobs board saw you handle that with class.'), scar('cx_ops_scar_thick_skin')],
    },
    flame_war: {
      speaker: 'narrator',
      text: [
        'Your reply is correct and completely too long. He answers in all caps. You answer the all caps. Forty posts later, a moderator locks it with the note "both of you, grow up", and the people who hire freelancers have learned one thing: you are the one who argues.',
      ],
      effects: [{ stat: 'stress', add: 5 }, { stat: 'cred', add: -1 }, debuff('cx_ops_flame_rep', 'The Guy From That Thread', 60, [{ key: 'freelance.pay', mult: 0.85 }], 'The flame war on the jobs board is the first thing new clients find about you.')],
    },
    matched: {
      speaker: 'narrator',
      text: 'You drop your rates and keep your regulars. Six weeks later, the Web Wizard Deluxe account goes quiet, and his last post is a question about why nobody is paying his invoices.',
    },
    ignored: {
      speaker: 'narrator',
      text: 'You let the thread scroll off the front page. A couple of clients drift away to the $99 kid; one of them comes back three months later, sheepish, with a site that plays music automatically and cannot be stopped.',
    },
  },
}

const undercutter: EventDef = {
  id: 'cx_ops_undercutter',
  category: 'work',
  complication: { sources: ['gig'], minTier: 2, maxTier: 5 },
  scene: 'cx_ops_undercutter_scene',
}

// ─────────────────────────────────────────────────────────────────────────────
// cx_ops_client_bankrupt — the check that will never clear
// ─────────────────────────────────────────────────────────────────────────────
const bankruptScene: SceneDef = {
  id: 'cx_ops_client_bankrupt_scene',
  channel: 'mail',
  title: 'Notice to creditors — Pacific Rim Dot Com Solutions (in liquidation)',
  from: 'Court-appointed Trustee',
  start: 'notice',
  nodes: {
    notice: {
      speaker: 'Court-appointed Trustee',
      text: [
        '"You are listed as an unsecured creditor of Pacific Rim Dot Com Solutions, which has entered liquidation. Unsecured creditors may expect a distribution of approximately 4 to 9 cents on the dollar, payable within 18 to 36 months."',
        'They owed you $1,800. Their founder, according to the local paper, is "exploring new opportunities" from a sailboat.',
      ],
      choices: [
        {
          text: 'Go to the creditors\' meeting and argue for your share.',
          tag: '[Business DC 15]',
          check: { skill: 'business', dc: 15, success: 'meeting_ok', fail: 'meeting_no' },
        },
        {
          text: 'Write it off and chalk it up to experience.',
          effects: [{ stat: 'mood', add: -3 }, { flag: 'cx_ops.bankrupt_written_off' }],
          goto: 'written_off',
        },
      ],
    },
    meeting_ok: {
      speaker: 'narrator',
      text: [
        'The meeting is in a rented hotel conference room with bad coffee and a lot of angry printers\' reps. You bring the signed statement of work and a copy of every invoice, in order, in a folder. The trustee likes folders.',
        'Your claim gets classed ahead of the "consulting fees" the founder paid himself. It is not all of it. It is a lot more than four cents.',
      ],
      effects: [{ money: 900 }, { xp: 'business', add: 80 }, scar('cx_ops_scar_hard_bargainer')],
    },
    meeting_no: {
      speaker: 'narrator',
      text: 'You lose the room at "per my previous email". Your claim goes into the big pile. Eighteen months from now, a check for $97.20 will arrive, and you will laugh, and then you will not.',
      effects: [{ money: 97 }, { stat: 'stress', add: 4 }, debuff('cx_ops_bad_debt', 'Bad Debt', 30, [{ key: 'mood.daily', add: -0.4 }], 'Money you earned is gone for good, and you keep doing the math.')],
    },
    written_off: {
      speaker: 'narrator',
      text: 'You file the notice in the drawer with the other things you try not to think about. From now on, deposits up front. Always. Probably.',
      effects: [{ xp: 'business', add: 30 }],
    },
  },
}

const clientBankrupt: EventDef = {
  id: 'cx_ops_client_bankrupt',
  category: 'money',
  complication: { sources: ['gig'], minTier: 2, maxTier: 5 },
  repeatable: true,
  cooldownDays: 365,
  scene: 'cx_ops_client_bankrupt_scene',
}

export default defineContent({
  events: [scopeCreep, blamedCrash, undercutter, clientBankrupt],
  scenes: [creepScene, crashAccuse, crashLetter, undercutScene, bankruptScene],
  quests: [crashQuest],
})
