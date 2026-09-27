/**
 * events_work — THE TOP OF THE LADDER (Act III–IV). The work pays better and the rooms get quieter.
 * Holding the layoff list; a vendor who keeps sending gifts; a client who wants a report softened
 * before the board reads it; a night shift in the mill where your father worked; a startup that
 * can't make payroll; and, the autumn the markets fell, your own name on somebody else's list.
 *
 * Mini-arc: `ev_work_q_report` — the softened report comes due.
 *
 * HARD RULE: all tech here is invented flavor, never real technique.
 */
import { defineContent } from '@/engine/registry'
import type { Cond, EventDef, QuestDef, SceneDef } from '@/engine/types'
import {
  DEFERRED,
  DEFERRED_HALF,
  GOOD_WORD,
  HALCYON_JOBS,
  LIAISON_PAY,
  MERIDIAN_JOBS,
  PAY_CUT,
  actGte,
  around,
  bumpJob,
  firedNow,
  free,
  fromDate,
  strike,
} from './_shared'

// ── ev_work_layoff_list ─────────────────────────────────────────────────────
// You're the one holding the axe now. Management track, Act III onward.
const MGMT: Cond = { jobTrack: 'management' }
const priyaUp = around('priya')
const deeUp = around('dee')

const listScene: SceneDef = {
  id: 'ev_work_layoff_list_scene',
  channel: 'dialog',
  title: 'The List',
  start: 'memo',
  nodes: {
    memo: {
      speaker: 'narrator',
      text: [
        'The number comes down from above the way weather comes down: without a face to argue with. Headcount is over plan. Your department needs to be twelve percent smaller by the end of the quarter. That is not a request; the spreadsheet has already been built. It just has blanks where the names go, and the names are yours to write.',
        'Finance has helpfully sorted your people by salary. HR has helpfully attached the script. The break room still has the banner from last month\'s all-hands: WE ARE A FAMILY.',
        { if: priyaUp, text: 'Priya finds you staring at the spreadsheet. "Rule six," she says quietly. "The ones who trust you are the cheapest to cut, because they won\'t see it coming." Then, softer: "Don\'t be good at this. Please."' },
      ],
      choices: [
        {
          tag: '[Business]',
          text: 'Fight the number. Take a plan upstairs — attrition, a hiring freeze, cut travel and the koi budget — that saves the jobs.',
          check: {
            skill: 'business',
            dc: 17,
            bonuses: [
              { if: { skill: 'business', gte: 45 }, add: 2, label: '+2 (you can read a P&L in your sleep)' },
              { if: { trait: 'silver_tongue' }, add: 1, label: '+1 (silver tongue)' },
            ],
            success: 'saved_them',
            fail: 'fought_lost',
            successEffects: [{ trait: 'ev_work_straight_shooter' }, ...bumpJob(300), { stat: 'mood', add: 8 }, { faction: 'fac.halcyon', add: 2 }],
            failEffects: [{ stat: 'stress', add: 8 }, { stat: 'mood', add: -4 }],
          },
        },
        {
          text: 'Cut by the spreadsheet. Highest salaries first — the number is the number.',
          effects: [{ trait: 'ev_work_the_axe' }, ...bumpJob(200), { faction: 'fac.halcyon', add: 1 }, { faction: 'fac.hood', add: -3 }, { stat: 'mood', add: -8 }],
          goto: 'by_numbers',
        },
        {
          tag: '[Social]',
          text: 'Do it by hand: protect the ones with kids and mortgages, give everyone real notice, real references, real severance.',
          check: {
            skill: 'social',
            dc: 16,
            bonuses: [
              { if: { trait: 'empath' }, add: 3, label: '+3 (you know what each of them is going home to)' },
              { if: { trait: 'silver_tongue' }, add: 1, label: '+1 (silver tongue)' },
            ],
            success: 'humane',
            fail: 'humane_bad',
            successEffects: [{ faction: 'fac.hood', add: 2 }, { stat: 'mood', add: 2 }, { flag: 'ev_work.laid_off_kindly' }],
            failEffects: [{ stat: 'stress', add: 10 }, { stat: 'mood', add: -6 }, { faction: 'fac.halcyon', add: -1 }],
          },
        },
        {
          text: 'Offer upstairs your own raise back — a fifth of your salary for a year — if it keeps the two most fragile names off the list.',
          effects: [{ buff: PAY_CUT }, { faction: 'fac.hood', add: 2 }, { stat: 'mood', add: 3 }, { flag: 'ev_work.laid_off_kindly' }],
          goto: 'shared_cut',
        },
        {
          tag: '[Leave]',
          text: 'Refuse to write the list. Put your own name on it instead.',
          effects: [...firedNow, { trait: 'ev_work_straight_shooter' }, { faction: 'fac.hood', add: 4 }, { stat: 'mood', add: 4 }],
          goto: 'walked',
        },
      ],
    },
    saved_them: {
      speaker: 'narrator',
      text: [
        'You spend a weekend building a case instead of a list: the cost of rehiring in a year, the cost of severance now, the koi, the offsite, the executive car service nobody uses. You take it upstairs and you do not blink. The number goes away. It just — goes away, the way it came, weather moving off.',
        'Nobody in your department ever knows how close it was. That\'s the job. You keep the spreadsheet with the blank names in a drawer, as a reminder of the week you refused to fill it in.',
        { if: deeUp, text: 'Dee hears about it — Dee hears about everything — and leaves a sticky note on your monitor: "You healed the customer. — D."' },
      ],
    },
    fought_lost: {
      speaker: 'narrator',
      text: [
        'You take the plan upstairs. They listen, and nod, and tell you it\'s "great thinking," and then explain that the number isn\'t about money — it\'s about "signaling discipline to the Street." You cannot fight a signal with a spreadsheet.',
        'The list gets written anyway, by someone above you, faster and colder than you would have. You spend the layoff day walking people out and knowing you tried, which helps them not at all.',
      ],
      effects: [{ faction: 'fac.hood', add: -1 }],
      next: 'aftermath',
    },
    by_numbers: {
      speaker: 'narrator',
      text: [
        'You sort by salary and draw the line. It takes twenty minutes. The senior people — the expensive ones, the ones with the framed photos and the fifteen-year pins — go first. You read the HR script to each of them, word for word, because the script is what legal approved.',
        'You are very good at it. You finish under budget and ahead of schedule, and upstairs notices, and that is the part that keeps you up: not that you did it, but that you did it well.',
      ],
      next: 'aftermath',
    },
    humane: {
      speaker: 'narrator',
      text: [
        'You throw out Finance\'s sort. You do it person by person: who has a kid starting college, who just took a mortgage, who can land somewhere in a week and who can\'t. You fight for severance, you write references on the spot, you give people the news yourself, early, in a room with the door closed and no HR pen scratching.',
        'It is the worst week of your career and you do it right. Two of the people you cut send you cards, afterward, thanking you. You keep them. You never framed anything at that job. You framed those.',
      ],
      next: 'aftermath',
    },
    humane_bad: {
      speaker: 'narrator',
      text: [
        'You try to do it gently and it gets away from you. Word leaks before the meetings — someone sees the calendar invites — and the floor spends three days in open panic, everyone certain and nobody knowing. When you finally give the news, it lands on people who have already grieved and rehearsed their anger. "You could have just told us," one of them says. You could have.',
      ],
      next: 'aftermath',
    },
    aftermath: {
      speaker: 'narrator',
      text: [
        'The WE ARE A FAMILY banner comes down the following week, for a company-values refresh. The new one says WE MOVE FAST. Nobody comments on it. Everybody notices.',
        { if: priyaUp, text: 'Priya doesn\'t say "I told you so." She just brings you a coffee and sits with you for a while, two people who are good at a thing they wish they weren\'t.' },
      ],
    },
    shared_cut: {
      speaker: 'narrator',
      text: [
        'Finance is baffled; nobody has ever offered to be cheaper before. But the arithmetic works, and arithmetic is the only language the number speaks. Two names come off the blanks: a single father in QA and a woman eighteen months from her pension. The rest of the list still gets written, by you, carefully, and it still hurts every single person on it.',
        'Your paystub arrives lighter the next week. You look at it for a long moment, then pin it to the corkboard next to the two names you kept. It is the most expensive thing you have ever bought, and the only one you never second-guess.',
      ],
      next: 'aftermath',
    },
    walked: {
      speaker: 'narrator',
      text: [
        'You email it up the chain in one line: "I won\'t write this list. If the department needs to be twelve percent smaller, start with the person who won\'t do the cutting." You mean it as principle. They take it as an offer.',
        'You clean out your office the same day. On the way to the elevator, three people you didn\'t cut catch your eye and give you a nod you will think about for years. It didn\'t save their jobs. It saved something, though. You\'re just not sure whose.',
      ],
    },
  },
}

const layoffList: EventDef = {
  id: 'ev_work_layoff_list',
  category: 'work',
  weight: 3,
  when: { all: [MGMT, actGte(3), free] },
  scene: 'ev_work_layoff_list_scene',
}

// ── ev_work_vendor_courtship ──────────────────────────────────────────────────
// A vendor courts the person who signs off. Repeatable quarterly ask; the "on the take" scar path.
const SIGNER: Cond = { jobTrack: ['network', 'security', 'management', 'sysadmin'] }
const onTake: Cond = { trait: 'ev_work_on_the_take' }

const vendorScene: SceneDef = {
  id: 'ev_work_vendor_courtship_scene',
  channel: 'dialog',
  title: 'The Fruit Basket',
  start: 'basket',
  nodes: {
    basket: {
      speaker: 'narrator',
      text: [
        'It starts with a fruit basket the size of a car tire. Then a box of steaks. Then two tickets to the Harbor Point luxury box, "no strings, just say hi." The vendor is Coastal Systems Integration — cabling, racks, "managed services" — and the account manager, a warm man named Dell Pruitt, has decided that you are the person whose signature turns their proposal into a purchase order.',
        'This quarter\'s renewal is on your desk. It is fifteen percent more than last year for the same service. Dell would love to take you golfing to talk it over.',
        { if: onTake, text: 'You\'ve taken Dell\'s hospitality before. There\'s a receipt with your name on it in a drawer in Millgate, and Dell knows exactly where it is.' },
      ],
      choices: [
        {
          tag: '[Business]',
          text: 'Send the basket back and put the renewal out to competitive bid. Do the job the boring, honest way.',
          check: {
            skill: 'business',
            dc: 15,
            bonuses: [
              { if: { skill: 'business', gte: 40 }, add: 2, label: '+2 (you know what it should cost)' },
              { if: onTake, add: -2, label: '−2 (Dell has that receipt)' },
            ],
            success: 'bid_win',
            fail: 'bid_awkward',
            successEffects: [{ trait: 'ev_work_straight_shooter' }, ...bumpJob(250), { faction: 'fac.halcyon', add: 2 }, { stat: 'mood', add: 4 }],
            failEffects: [{ stat: 'stress', add: 6 }, { stat: 'mood', add: -3 }],
          },
        },
        {
          text: 'Take the box seats. Sign the renewal. Everybody does this; it\'s just how business works.',
          effects: [
            { trait: 'ev_work_on_the_take' },
            { money: 60 },
            { stat: 'heat', add: 3 },
            { buff: LIAISON_PAY },
            { flag: 'ev_work.took_the_deal' },
          ],
          goto: 'took',
        },
        {
          tag: '[Social]',
          text: 'Keep Dell as a friend and the contract as a contract: enjoy the lunch, then negotiate him down hard.',
          check: {
            skill: 'social',
            dc: 14,
            bonuses: [
              { if: { trait: 'silver_tongue' }, add: 2, label: '+2 (silver tongue)' },
              { if: { trait: 'empath' }, add: 1, label: '+1 (you know Dell has a quota too)' },
            ],
            success: 'friendly_win',
            fail: 'friendly_bad',
            successEffects: [{ money: 40 }, ...bumpJob(150), { faction: 'fac.halcyon', add: 1 }],
            failEffects: [{ stat: 'stress', add: 5 }, { chance: 0.3, then: strike }],
          },
        },
        {
          if: onTake,
          tag: '[OpSec]',
          text: 'You\'re done being owned. Quietly build a paper trail that ends the arrangement without ending you.',
          check: {
            skill: 'opsec',
            dc: 16,
            bonuses: [{ if: { background: 'latchkey' }, add: 2, label: '+2 (latchkey kid)' }],
            success: 'freed',
            fail: 'freed_bad',
            successEffects: [{ trait: 'ev_work_on_the_take', remove: true }, { stat: 'heat', add: -4 }, { stat: 'mood', add: 6 }],
            failEffects: [{ stat: 'heat', add: 6 }, { stat: 'stress', add: 8 }, { chance: 0.4, then: [{ complication: 'work' }] }],
          },
        },
      ],
    },
    bid_win: {
      speaker: 'narrator',
      text: [
        'You send the basket to the break room, where it is demolished in an afternoon, and you put the renewal out to three vendors. Coastal comes back eighteen percent cheaper than their own "friendly" number the moment they have to actually compete. You save the company real money and Dell, to his credit, shakes your hand and says, "Worth a shot. Respect."',
        'Your boss cites the savings in the quarterly review. You sleep fine. It turns out you can.',
      ],
    },
    bid_awkward: {
      speaker: 'narrator',
      text: [
        'You try to open it to bid and discover Coastal has quietly locked you in: a three-year auto-renew someone signed before your time, an early-termination clause with teeth. You can\'t get out this quarter. Dell is very gracious about it, which is somehow worse. You pay the fifteen percent and start reading every contract in the drawer looking for the next trap.',
      ],
    },
    took: {
      speaker: 'narrator',
      text: [
        'The box seats are incredible. The steaks are incredible. The renewal takes one signature. Dell claps you on the back and says "pleasure doing business," and means it, and you realize the arrangement is now a thing that exists, with a shape and a memory, and that you are inside it.',
        { if: onTake, text: 'It gets easier every quarter. That\'s the part nobody warns you about.' },
      ],
    },
    friendly_win: {
      speaker: 'narrator',
      text: 'You let Dell buy lunch and then, over dessert, take him apart on the numbers with a smile. He respects it — vendors always respect the ones who make them work — and you land a fair renewal at last year\'s price with a service upgrade thrown in. Friends and a fair deal. It can be done. It\'s just harder than the other thing.',
    },
    friendly_bad: {
      speaker: 'narrator',
      text: 'You mean to keep it professional, but three lunches in, the line has moved without your noticing, and now Dell talks about the renewal like it\'s already yours to hand him. When you finally push back on price, he looks genuinely hurt — "after everything?" — and the negotiation goes worse than if you\'d never let him buy the first coffee.',
    },
    freed: {
      speaker: 'narrator',
      text: [
        'You do it carefully. You document every gift, backdated where you can, "for tax purposes." You get the renewal moved to a committee, so no single signature — yours — owns it anymore. When Dell mentions the receipt, you mention the file, and the balance of the conversation changes. He stops sending baskets. You breathe easier than you have in a year.',
      ],
    },
    freed_bad: {
      speaker: 'narrator',
      text: 'You reach for the receipt in the drawer and Dell has already made copies. When you try to unwind the arrangement, he lets it be known — gently, over golf — that a scandal would land on you, not him, and he\'s right. You\'re more tangled than before, and now he knows you tried to get out.',
    },
  },
}

const vendorCourtship: EventDef = {
  id: 'ev_work_vendor_courtship',
  category: 'work',
  weight: 2,
  repeatable: true,
  cooldownDays: 150,
  when: { all: [SIGNER, actGte(3), free] },
  scene: 'ev_work_vendor_courtship_scene',
}

// ── ev_work_soft_report + quest ev_work_q_report ────────────────────────────
// Consulting: the client wants the security assessment softened before the board sees it.
const Q_REPORT = 'ev_work_q_report'
const CONSULT: Cond = { job: ['job_tidewater_consultant', 'job_cage_consultant', 'job_bureau_consultant', 'job_meridian_secanalyst', 'job_meridian_it_manager'] }
const softened = { flag: 'ev_work.report_softened' }

const reportScene: SceneDef = {
  id: 'ev_work_soft_report_scene',
  channel: 'dialog',
  title: 'Executive Summary',
  start: 'call',
  nodes: {
    call: {
      speaker: 'narrator',
      text: [
        'You wrote the assessment honestly: the client — Anchor Mutual, a mid-size insurer in Harbor Point — has serious problems. Old systems, no monitoring, one shared password taped to a monitor in the claims department, customer records anyone on the third floor could read. Your report says all of this, in plain language, on page one.',
        'The client\'s VP of Technology calls you before the board meeting. He is friendly. He is also, you realize, terrified. "The board doesn\'t need the scary version," he says. "Just soften the executive summary. Amber, not red. We\'ll fix it, I promise, we just can\'t look like this in front of them this quarter."',
        'The firm bills Anchor Mutual eighty thousand dollars a year. The VP is the one who signs those invoices.',
      ],
      choices: [
        {
          text: 'Soften it. Amber, not red. It\'s their risk to accept.',
          effects: [{ flag: 'ev_work.report_softened' }, { money: 200 }, { faction: 'fac.halcyon', add: 1 }, { stat: 'mood', add: -4 }, { quest: Q_REPORT, start: true }],
          goto: 'softened',
        },
        {
          tag: '[Business]',
          text: 'Refuse to change the findings — but help him build a fundable remediation plan to bring to the board alongside them.',
          check: {
            skill: 'business',
            dc: 16,
            bonuses: [
              { if: { skill: 'business', gte: 40 }, add: 2, label: '+2 (you can make a fix sound like a strategy)' },
              { if: { trait: 'silver_tongue' }, add: 1, label: '+1 (silver tongue)' },
            ],
            success: 'plan_win',
            fail: 'plan_lose',
            successEffects: [{ trait: 'ev_work_straight_shooter' }, ...bumpJob(300), { faction: 'fac.halcyon', add: 2 }, { stat: 'mood', add: 5 }],
            failEffects: [{ stat: 'stress', add: 8 }, { quest: Q_REPORT, start: true }, { flag: 'ev_work.report_softened' }, { money: 100 }],
          },
        },
        {
          tag: '[Leave]',
          text: '"The report stands. Show the board the red, or find another firm."',
          effects: [{ faction: 'fac.halcyon', add: -2 }, { faction: 'fac.hood', add: 1 }, { stat: 'mood', add: 3 }, { flag: 'ev_work.report_held' }],
          goto: 'held',
        },
      ],
    },
    softened: {
      speaker: 'narrator',
      text: [
        'You change three words and one color and the whole thing goes quiet, the way a smoke detector goes quiet when you take the battery out. The board sees "areas for continued investment." The VP is grateful in a way that makes your skin crawl a little. The invoice gets paid early.',
        'You file the original — the red one — in your own records, with the date. Some instinct tells you you\'ll want to be able to prove what you actually found.',
      ],
    },
    plan_win: {
      speaker: 'narrator',
      text: [
        'You tell the VP the findings don\'t move — but the story can. Instead of "you are dangerously exposed," the board hears "here is a two-year plan to become an industry leader in security, and here is what it costs." Same facts, aimed forward. The VP presents it and gets his budget. Anchor Mutual actually fixes the shared password. Your firm gets a case study and a bigger retainer.',
        'It is the whole trick of the job, and you just did it clean.',
      ],
    },
    plan_lose: {
      speaker: 'narrator',
      text: [
        'You pitch the remediation plan and the VP just — deflates. "I can\'t take a two-year spend to this board," he says. "They\'ll fire me and hire someone who\'ll do the amber version." In the end you meet in the middle: the summary goes amber, the plan goes in an appendix nobody will read. You take the smaller win and the larger unease.',
      ],
    },
    held: {
      speaker: 'narrator',
      text: [
        'The VP is quiet for a long moment. "Okay," he says. "Okay." He does not thank you. Anchor Mutual does not renew the firm\'s contract next quarter, and your partner asks you, pointedly, whether eighty thousand dollars was worth "a principle." You say yes. You\'re mostly sure.',
        'A year later you read that Anchor Mutual had a breach. The board, it turns out, had been shown a red report by a stubborn consultant, and had chosen amber anyway. That part isn\'t in the paper. You know it, though.',
      ],
    },
  },
}

const reportBreach: SceneDef = {
  id: 'ev_work_report_breach',
  channel: 'dialog',
  title: 'Page One',
  start: 'news',
  nodes: {
    news: {
      speaker: 'narrator',
      text: [
        'It\'s on the front of the business section: ANCHOR MUTUAL DATA EXPOSED — 40,000 POLICYHOLDERS. The claims-department password, the one from page one of your report. The shared drive anyone could read. Everything you wrote in red, and then rewrote in amber.',
        'The state regulator is asking for every assessment Anchor Mutual commissioned in the last three years. Your firm\'s report is one of them. The softened one. With your name on the cover.',
      ],
      choices: [
        {
          tag: '[OpSec]',
          text: 'Produce the original. You kept the red version, dated, with the change history. Let the record show what you actually found.',
          if: softened,
          check: {
            skill: 'opsec',
            dc: 15,
            bonuses: [
              { if: { trait: 'paranoid' }, add: 2, label: '+2 (you kept everything)' },
              { if: { background: 'latchkey' }, add: 1, label: '+1 (you cover yourself by instinct)' },
            ],
            success: 'exonerated',
            fail: 'implicated',
            successEffects: [{ stat: 'mood', add: 4 }, { flag: 'ev_work.report_vindicated' }],
            failEffects: [...strike, { stat: 'stress', add: 10 }, { chance: 0.4, then: [{ complication: 'legal' }] }],
          },
        },
        {
          tag: '[Business]',
          text: 'Sit with the regulator and walk them through it honestly — what you found, what you were asked to do, what you did.',
          check: {
            skill: 'business',
            dc: 16,
            bonuses: [
              { if: { flag: 'ev_work.report_vindicated' }, add: 3, label: '+3 (you have the paper trail)' },
              { if: { trait: 'silver_tongue' }, add: 1, label: '+1 (silver tongue)' },
            ],
            success: 'testified',
            fail: 'scapegoat',
            successEffects: [{ trait: 'ev_work_straight_shooter' }, ...bumpJob(200), { stat: 'mood', add: 5 }],
            failEffects: [...firedNow, { stat: 'heat', add: 6 }, { obligation: { id: 'ev_work_liability', label: 'Legal fees (the Anchor Mutual inquiry)', perDay: 8, days: 60 } }],
          },
        },
        {
          text: 'Take the blame quietly. Let the firm keep the client and settle it internally.',
          effects: [...strike, { faction: 'fac.halcyon', add: 1 }, { stat: 'mood', add: -6 }, { obligation: { id: 'ev_work_liability', label: 'Legal fees (the Anchor Mutual inquiry)', perDay: 6, days: 45 } }],
          goto: 'took_blame',
        },
      ],
    },
    exonerated: {
      speaker: 'narrator',
      text: 'You hand over the original, red, dated the week you wrote it, with a change log showing exactly who asked for exactly what. The regulator reads it twice. The VP of Technology at Anchor Mutual has a much worse year than you do. Your firm quietly makes you the person who reviews every report before it ships. You keep everything now. You always did.',
    },
    implicated: {
      speaker: 'narrator',
      text: 'You go for the archive and find your "original" is thinner than you remembered — the change history got trimmed in a backup migration, and what\'s left doesn\'t clearly show who softened what. Without the clean trail, it\'s your name on the amber cover and your word against a frightened VP\'s. The inquiry drags. It leaves a mark.',
    },
    testified: {
      speaker: 'narrator',
      text: 'You tell the regulator the whole thing, plainly, the shared password and the amber summary and the phone call before the board meeting. Because you can back every word, they believe you. The finding lands where it belongs. Your firm loses Anchor Mutual and gains a reputation for consultants who won\'t be leaned on, which turns out to be worth more.',
    },
    scapegoat: {
      speaker: 'narrator',
      text: 'You tell the truth without the paper to prove it, and the truth, unbacked, sounds like an excuse. The firm needs a name for the regulator and yours is on the cover. They "part ways" with you in a press-friendly sentence. The VP of Technology keeps his job for another eight months.',
    },
    took_blame: {
      speaker: 'narrator',
      text: 'You fall on it so the firm can keep the client and the partners can keep their story. They\'re grateful, privately, in the way that never shows up in a paycheck. The legal fees are yours. The lesson — that loyalty flows one direction up here — is also yours, and it was expensive.',
    },
  },
}

const reportQuest: QuestDef = {
  id: Q_REPORT,
  title: 'Complication: The Amber Summary',
  kind: 'personal',
  summary: 'You softened a security report so a client\'s board wouldn\'t panic. Reports have a way of being read later.',
  start: 'wait',
  rewards: 'A clean name — or the blame',
  priority: 4,
  stages: {
    wait: {
      text: 'Anchor Mutual\'s board saw "amber" where your report said "red." They promised to fix it. They are, you\'re fairly sure, not fixing it.',
      hint: 'You changed a finding under pressure. Keep the original somewhere safe — if this ever surfaces, the paper trail is the difference between a witness and a scapegoat.',
      onEnter: [{ scene: 'ev_work_report_breach', delayHours: 24 * 160 }],
      objectives: [{ id: 'breach', text: 'See how the amber report ages', when: { any: [{ flag: 'ev_work.report_vindicated' }, { seen: 'ev_work_report_breach' }] } }],
      next: [{ if: { flag: 'ev_work.report_vindicated' }, stage: 'clean' }, { stage: 'marked' }],
    },
    clean: {
      text: 'The report came due and you had the receipts. You are, now and forever, the person who keeps the original.',
      objectives: [{ id: 'done', text: 'Keep your name clean', when: { always: true }, hint: 'Already done.' }],
    },
    marked: {
      text: 'The amber report surfaced, the way they do. However it landed, you\'ll read the next assessment you write a little differently.',
      objectives: [{ id: 'done', text: 'Live with the amber', when: { always: true }, hint: 'Already done.' }],
      outcome: 'completed',
    },
  },
}

const softReport: EventDef = {
  id: 'ev_work_soft_report',
  category: 'work',
  weight: 3,
  when: { all: [CONSULT, actGte(3), free, { quest: Q_REPORT, status: 'inactive' }] },
  scene: 'ev_work_soft_report_scene',
}

// ── ev_work_mill_night ──────────────────────────────────────────────────────
// Night shift in the mill where Dad worked. A locker with his name on it. Purely a family beat.
const dadUp = around('dad')

const millScene: SceneDef = {
  id: 'ev_work_mill_night_scene',
  channel: 'dialog',
  title: 'Line 3',
  start: 'aisle',
  nodes: {
    aisle: {
      speaker: 'narrator',
      text: [
        '3:10 a.m., walking the aisles of the Millgate Data Campus with a cart of replacement drives. Where the pulp line used to run there are now rows of racks, blinking, and cold air that smells — faintly, impossibly — of wet paper.',
        'Behind the racks, where the renovation crews got lazy, the old wall still stands: a bank of steel employee lockers, painted over grey. One has letters scratched deep through the paint, by someone who wanted them to last: R. TAN — LINE 3 — \'79.',
        { if: { flag: 'npc.dad.mill_job' }, text: 'Dad works here now — days, in facilities. You pass each other at the badge gate at six, him coming in, you going out. He always says "Busy night?" as if either of you could answer that honestly.' },
      ],
      choices: [
        {
          text: 'Photograph the locker on your break and bring Dad the picture on Sunday.',
          effects: [{ if: dadUp, then: [{ npc: 'dad', affinity: 6 }] }, { stat: 'mood', add: 5 }],
          goto: 'photo',
        },
        {
          tag: '[Hardware]',
          text: 'The paint\'s cracked at the seam. Carefully work the old door open — see what he left behind.',
          check: {
            skill: 'hardware',
            dc: 12,
            bonuses: [{ if: { background: 'tinkerer' }, add: 2, label: '+2 (you grew up in his toolbox)' }],
            success: 'opened',
            fail: 'jammed',
            successEffects: [{ if: dadUp, then: [{ npc: 'dad', affinity: 8 }] }, { flag: 'ev_work.locker_found' }, { stat: 'mood', add: 4 }],
            failEffects: [{ stat: 'stress', add: 4 }, { stat: 'mood', add: -3 }],
          },
        },
        {
          tag: '[Leave]',
          text: 'Leave it be. Walk the aisle, swap the drives. It\'s just a building now.',
          effects: [{ stat: 'mood', add: -2 }],
          goto: 'walk_on',
        },
      ],
    },
    photo: {
      speaker: 'dad',
      text: [
        { if: { flag: 'npc.dad.mill_job' }, text: 'Dad studies the photo over Sunday dinner for a long time. "I know," he says finally. "I eat lunch in front of it. Tuesdays." He hands it back — then takes it again. "Can I keep this one?"', else: 'Dad studies the photo over Sunday dinner for a long time, running his thumb across the scratched letters like he can feel them. "Twenty-two years on Line 3," he says. "And a girl in Human Resources typed a number and it was gone in an afternoon." Then he laughs, softer. "It\'s still my locker, though. Isn\'t it. You found my locker." He puts the photo in his shirt pocket, over his heart, and leaves it there all evening.' },
        { if: { var: 'w.mom_gone', eq: 1 }, text: 'He doesn\'t say anything about the empty chair. He doesn\'t have to.' },
      ],
    },
    opened: {
      speaker: 'narrator',
      text: [
        'The old door gives with a groan that echoes down the whole cold hall. Inside, untouched since the layoffs: a union card, ROBERT TAN, LOCAL 212. A dented lunch pail with a note taped inside the lid, in your mother\'s handwriting — "Eat the apple too. Love you. — L." And a snapshot of a young couple on the Cannery Row pier, laughing at whoever held the camera.',
        { if: { var: 'w.mom_gone', eq: 1 }, text: 'You sit down on the cold floor with the note in your hands and stay there a while. Then you bring it to Dad. He reads it once, and puts his face in his hands, and you sit with him at the kitchen table until the kettle boils and then until it goes cold again.' },
        { if: { not: { var: 'w.mom_gone', eq: 1 } }, text: 'You bring it all home on Sunday. Mom reads the note, turns bright red, and says "Robert, you KEPT that?" and Dad says "Where was I going to put it," and for one minute at the kitchen table the two of them are twenty-two on a pier again.' },
      ],
    },
    jammed: {
      speaker: 'narrator',
      text: 'The door is welded half-shut and rusted the rest of the way; you get it open two inches, enough to see a folded scrap of paper you can\'t reach and a shape that might be a lunch pail. You stand there in the cold hum for a while, arm in up to the elbow, and then you stop, because forcing it feels wrong, like breaking into something that was already given away.',
    },
    walk_on: {
      speaker: 'narrator',
      text: 'You push the cart past Row K without slowing down. Swap the failed drive in rack forty-one, log it, move on. It\'s just a building. You tell yourself that twice, and then a third time at the badge gate, where the six a.m. shift is filing in with their coffees and their tired good mornings, the way a mill crew used to.',
    },
  },
}

const millNight: EventDef = {
  id: 'ev_work_mill_night',
  category: 'family',
  weight: 3,
  when: { all: [{ job: 'job_datacenter_ops' }, dadUp, free] },
  scene: 'ev_work_mill_night_scene',
}

// ── ev_work_startup_payroll ─────────────────────────────────────────────────
// Driftwood can't make payroll. Defer your salary, take half, or walk.
const startupUp: Cond = { job: ['job_startup_engineer', 'job_startup_cto'] }

const payrollScene: SceneDef = {
  id: 'ev_work_startup_payroll_scene',
  channel: 'dialog',
  title: 'The Bridge',
  start: 'garage',
  nodes: {
    garage: {
      speaker: 'narrator',
      text: [
        'The founder calls a stand-up that isn\'t on the calendar, which is never good. Everyone gathers in the garage — or the real office now, if Driftwood made it that far — and the founder, who talks with their whole body, is very still.',
        '"The round slipped," they say. "Term sheet\'s real, the money\'s real, it\'s just six weeks out and payroll is Friday. I can make rent or I can make payroll. I can\'t make both." A long breath. "So I\'m asking. Not telling. Asking."',
        { if: { flag: 'ev_work.payroll_deferred' }, text: 'You\'ve done this before, the last time the round "slipped." The equity certificate in your drawer is getting to be quite thick, and quite theoretical.' },
      ],
      choices: [
        {
          text: 'Defer your whole salary until the round closes. All in.',
          effects: [{ buff: DEFERRED }, { flag: 'ev_work.payroll_deferred' }, ...bumpJob(200), { stat: 'stress', add: 4 }],
          goto: 'deferred',
        },
        {
          text: 'Take half now, half later. Split the risk.',
          effects: [{ buff: DEFERRED_HALF }, { flag: 'ev_work.payroll_deferred' }, ...bumpJob(120)],
          goto: 'half',
        },
        {
          tag: '[Business]',
          text: 'Get in the room with them and the investors. If everyone\'s betting their pay, the term sheet needs to get better — today.',
          check: {
            skill: 'business',
            dc: 16,
            bonuses: [
              { if: { skill: 'business', gte: 45 }, add: 2, label: '+2 (you can read a term sheet)' },
              { if: { jobLevel: 'job_startup_cto', gte: 1 }, add: 2, label: '+2 (you\'re the CTO; you\'re in the room already)' },
            ],
            success: 'renegotiated',
            fail: 'renegotiate_bad',
            successEffects: [{ money: 500 }, ...bumpJob(300), { faction: 'fac.halcyon', add: 2 }, { stat: 'mood', add: 6 }],
            failEffects: [{ buff: DEFERRED }, { flag: 'ev_work.payroll_deferred' }, { stat: 'stress', add: 8 }],
          },
        },
        {
          tag: '[Leave]',
          text: '"I have rent too. I can\'t do this again." Take the paycheck you\'re owed and go.',
          effects: [{ job: null }, { money: 200 }, { stat: 'mood', add: -4 }, { flag: 'ev_work.left_startup' }],
          goto: 'left',
        },
      ],
    },
    deferred: {
      speaker: 'narrator',
      text: [
        'You eat ramen for six weeks and tell your landlord a story. The founder cries a little when you say yes — not performatively, just tired-person tears — and works twenty-hour days out of what looks like pure guilt.',
        { if: { flag: 'ev_work.startup_paid_off' }, text: 'The round closes. It always felt like it wouldn\'t, and then it does.', else: 'The round might close. It might not. That\'s the whole game. You bought a bigger slice of a lottery ticket with money you needed for groceries, and the strange thing is you don\'t regret it.' },
      ],
      effects: [{ scene: 'ev_work_startup_resolution', delayHours: 24 * 49 }],
    },
    half: {
      speaker: 'narrator',
      text: 'Half a paycheck, half the risk, half the ramen. The founder nods — it\'s fair, and they know it\'s fair — and the team splits roughly down the middle between the all-in believers and the half-in realists, which is, you\'ll notice, exactly how it\'ll split when the equity pays out or doesn\'t.',
      effects: [{ scene: 'ev_work_startup_resolution', delayHours: 24 * 49 }],
    },
    renegotiated: {
      speaker: 'narrator',
      text: [
        'You put on the one clean shirt and get in the room. You point out, calmly, that a company where the engineers are deferring salary is a company the investors are about to get very cheaply, and that "very cheaply" is a two-way street. The lead investor looks at you for a long moment and then, unexpectedly, smiles. The term sheet improves. Payroll runs Friday. On time.',
        'The founder introduces you to the investors afterward as "the reason we\'re still standing," and for once it isn\'t startup hyperbole.',
      ],
      effects: [{ flag: 'ev_work.startup_paid_off' }],
    },
    renegotiate_bad: {
      speaker: 'narrator',
      text: 'You get in the room and overplay it. The lead investor is not moved by a junior person explaining leverage to them; they\'ve been doing this since before you had a driver\'s license. The term sheet doesn\'t budge, the founder is mortified, and you end up deferring your salary anyway, having spent your goodwill for nothing.',
      effects: [{ scene: 'ev_work_startup_resolution', delayHours: 24 * 49 }],
    },
    left: {
      speaker: 'narrator',
      text: [
        'You take what you\'re owed and hand in your badge — or your beanbag. The founder hugs you and says they understand, and they do, and it still feels like leaving a sinking boat while people you like keep bailing. You never find out, for a long time, whether they made it. Then one day you see the logo on a billboard, or you don\'t, and either way it lands like a stone.',
      ],
    },
  },
}

const startupResolution: SceneDef = {
  id: 'ev_work_startup_resolution',
  channel: 'mail',
  title: 'we did it (or: we didn\'t)',
  from: 'the Driftwood founder',
  start: 'm',
  nodes: {
    m: {
      speaker: 'the Driftwood founder',
      text: [
        { if: { flag: 'ev_work.startup_paid_off' }, text: 'IT CLOSED. The wire hit at 4:58 on a Friday and I refreshed the bank page a hundred times. Back pay goes out Monday, with interest I calculated myself and probably got wrong in your favor. You bet on us when it was ramen. I will not forget it. — the founder', else: 'The round closed. Smaller than we wanted, mean little terms, but it closed. Back pay goes out over the next two months. Thank you for eating ramen for us. I mean it. We\'re still here because a handful of you decided we should be. — the founder' },
      ],
      choices: [
        {
          if: { flag: 'ev_work.startup_paid_off' },
          text: 'Collect the back pay — with the founder\'s creative interest.',
          effects: [{ money: 1400 }, { stat: 'mood', add: 6 }],
        },
        {
          if: { not: { flag: 'ev_work.startup_paid_off' } },
          text: 'Collect the back pay. Slowly.',
          effects: [{ money: 700 }, { stat: 'mood', add: 3 }],
        },
      ],
    },
  },
}

const startupPayroll: EventDef = {
  id: 'ev_work_startup_payroll',
  category: 'money',
  weight: 3,
  when: { all: [startupUp, free] },
  scene: 'ev_work_startup_payroll_scene',
}

// ── ev_work_recession_axe ────────────────────────────────────────────────────
// The autumn the markets fell (2008–2009). This time the list has your name on it.
const laidOffJobs = [...HALCYON_JOBS, ...MERIDIAN_JOBS, 'job_pixelworks_web', 'job_coop_dev', 'job_datacenter_ops', 'job_northlink_sysadmin', 'job_northlink_senior_sysadmin']

const recessionScene: SceneDef = {
  id: 'ev_work_recession_axe_scene',
  channel: 'dialog',
  title: 'Twelve Percent',
  start: 'room',
  nodes: {
    room: {
      speaker: 'narrator',
      text: [
        'The whole city can feel it this autumn. The Lumen Ledger runs a new number every morning and every number is worse. Two floors of the Meridian tower go dark. The koi-pond company freezes hiring, then salaries, then breath.',
        'Then it\'s your turn in the small windowless room with the box of tissues at a meaningful angle. "It\'s not performance," HR says, and for once it\'s even true. "It\'s the environment." Your position is being "eliminated." There is a severance number on the page. It is smaller than the number you were owed in dignity.',
        { if: { trait: 'ev_work_the_axe' }, text: 'You have sat on the other side of this table. You recognize the script. You wrote a version of it once. It reads differently from this chair.' },
      ],
      choices: [
        {
          tag: '[Business]',
          text: 'Negotiate the exit: more severance, extended benefits, a real reference, the consulting contract they\'ll need in three months anyway.',
          check: {
            skill: 'business',
            dc: 16,
            bonuses: [
              { if: { skill: 'business', gte: 40 }, add: 2, label: '+2 (you know what you\'re worth to them)' },
              { if: { trait: 'ev_work_straight_shooter' }, add: 1, label: '+1 (they know you don\'t bluff)' },
              { if: { trait: 'silver_tongue' }, add: 1, label: '+1 (silver tongue)' },
            ],
            success: 'good_exit',
            fail: 'bad_exit',
            successEffects: [{ job: null }, { money: 4000 }, { faction: 'fac.halcyon', add: 1 }, { stat: 'mood', add: 2 }, { flag: 'ev_work.negotiated_exit' }],
            failEffects: [{ job: null }, { money: 800 }, { stat: 'mood', add: -8 }, { stat: 'stress', add: 8 }],
          },
        },
        {
          tag: '[Social]',
          text: 'Take the box gracefully — and spend the walk to the door collecting phone numbers and promises from everyone who owes you one.',
          check: {
            skill: 'social',
            dc: 14,
            bonuses: [
              { if: { trait: 'empath' }, add: 1, label: '+1 (people want to help you)' },
              { if: { flag: 'ev_work.laid_off_kindly' }, add: 2, label: '+2 (you did right by people when you held the list)' },
            ],
            success: 'network',
            fail: 'network_bad',
            successEffects: [{ job: null }, { money: 1500 }, { buff: GOOD_WORD }, { flag: 'ev_work.severance_network' }, { stat: 'mood', add: 3 }],
            failEffects: [{ job: null }, { money: 1500 }, { stat: 'mood', add: -6 }, { stat: 'stress', add: 6 }],
          },
        },
        {
          text: 'Sign it. Take the box. Don\'t give them the satisfaction of a scene.',
          effects: [{ job: null }, { money: 1500 }, { trait: 'ev_work_once_fired' }, { stat: 'mood', add: -6 }, { stat: 'stress', add: 6 }],
          goto: 'signed',
        },
      ],
    },
    good_exit: {
      speaker: 'narrator',
      text: [
        'You don\'t cry and you don\'t beg. You open your own folder — every project you saved, every fire you put out, the exact dollar cost of replacing you in a year — and you negotiate like it\'s someone else\'s severance. You walk out with four times the offer, six months of benefits, a glowing reference, and a handshake deal to consult through the transition. The box has a plant in it. You leave the plant. You don\'t need it.',
        { if: { trait: 'ev_work_the_axe' }, text: 'On the way out you think about the people you cut, and whether any of them fought like this, and whether you let them.' },
      ],
    },
    bad_exit: {
      speaker: 'narrator',
      text: 'You try to negotiate and HR just slides the standard packet back across the table. "Everyone\'s getting the same thing," they say, which is a lie, but a lie with a legal department behind it. You take the standard severance and the standard box and the standard walk past the standard averted eyes, and it is exactly as bad as everyone always said it was.',
    },
    network: {
      speaker: 'narrator',
      text: [
        'You take the box and, on the long walk to the elevator, you shake every hand that\'s ever owed you one. "Call me." "You know I will." "Wherever you land, I\'m coming with you." Half of them mean it. In this market, half is a fortune. Two of those numbers turn into interviews before your severance runs out.',
        { if: { flag: 'ev_work.laid_off_kindly' }, text: 'People remember that you did this decently when you were the one holding the list. It comes back to you now, exactly when you need it.' },
      ],
    },
    network_bad: {
      speaker: 'narrator',
      text: 'You mean to work the room on the way out, but grief gets there first, and your voice does something you don\'t forgive it for, and mostly you just get pitying looks and one guy from Accounting who says "tough break" and means "please don\'t ask me for anything." You get the standard severance and a very quiet drive home.',
    },
    signed: {
      speaker: 'narrator',
      text: 'You sign where the little plastic arrow points. You carry the box out yourself, past the desks, past the people pretending to type. The parking lot is full of other people\'s cars and completely empty. You sit in yours for a while. Then you drive home, and you start, that night, the long strange work of figuring out who you are when the badge stops working.',
    },
  },
}

const recessionAxe: EventDef = {
  id: 'ev_work_recession_axe',
  category: 'work',
  weight: 4,
  when: { all: [{ job: laidOffJobs }, fromDate(2008, 8, 15), free] },
  scene: 'ev_work_recession_axe_scene',
}

export default defineContent({
  scenes: [listScene, vendorScene, reportScene, reportBreach, millScene, payrollScene, startupResolution, recessionScene],
  quests: [reportQuest],
  events: [layoffList, vendorCourtship, softReport, millNight, startupPayroll, recessionAxe],
})
