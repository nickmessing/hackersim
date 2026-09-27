/**
 * events_city — MONEY: windfalls, scams, and the rent.
 *
 *  - ev_city_scratch_ticket  repeatable, all acts: a two-dollar hope at the corner store.
 *  - ev_city_duke_letter     one-off, Act I–IIa: the Count of Vasgonia needs your help moving $24.5M.
 *  - ev_city_sucker_calls    repeatable while you carry the "On a Sucker List" scar: the calls keep coming,
 *                            until you make them stop (a way to shed the scar — or make it worse).
 *  - ev_city_found_wallet    one-off, Act I–II: a banker's wallet under a Cathode booth. Returning it can
 *                            go very wrong, and then — weeks later — very slightly right.
 *  - ev_city_rent_hike       repeatable while renting: the letter every tenant dreads. Obligations,
 *                            cleared automatically by the triggers below if you move out.
 *
 * HARD RULE: the scams are parody and contain nothing usable; the "scam-baiting" is dice and comedy.
 */
import { defineContent } from '@/engine/registry'
import type { BuffDef, Effect, EventDef, SceneDef, TriggerDef } from '@/engine/types'
import {
  CIVIC_PRIDE,
  FLUSH,
  SCAMMED,
  WELL_FED,
  actLte,
  around,
  buff,
  cathodeOpen,
  free,
  momHere,
  onRow,
  RENTED_HOUSING,
  renting,
  salHere,
  stillLight,
  surveilled,
  untilDate,
} from './_shared'

// ── Local buffs ────────────────────────────────────────────────────────────────

const PHONE_WONT_STOP: BuffDef = {
  id: 'ev_city_phone_wont_stop',
  name: 'The Phone Won\'t Stop',
  desc: 'Cruises, refunds, warranties, a man named "Kevin from Accounts." Every ring is a small flinch.',
  days: 21,
  bad: true,
  mods: [{ key: 'stress.gain', mult: 1.06 }, { key: 'efficiency', mult: 0.98 }],
}

const PRECINCT_NIGHT: BuffDef = {
  id: 'ev_city_precinct_night',
  name: 'A Night at the Precinct',
  desc: 'You did the right thing and spent the night explaining it to a man with a typewriter. You keep replaying it in the shower.',
  days: 14,
  bad: true,
  mods: [{ key: 'stress.gain', mult: 1.06 }, { key: 'mood.daily', add: -0.3 }],
}

// ── ev_city_scratch_ticket (repeatable) ──────────────────────────────────────────

const scratchScene: SceneDef = {
  id: 'ev_city_scratch_ticket_scene',
  channel: 'dialog',
  title: 'Scratch & Win',
  start: 'counter',
  nodes: {
    counter: {
      speaker: 'narrator',
      text: [
        'The corner store under the overpass: a humming cooler, a rack of beef jerky that predates the internet, and behind the counter Hector, who has sold you gum since you were nine and has never once looked up from his crossword.',
        'The roll of scratch tickets hangs by the register like a string of tiny promises. LUCKY HARBOR — WIN UP TO $5,000. Mr. Pruszynski is standing at the end of the counter scratching his fourth one with a quarter, muttering to it in Polish.',
        { if: { stat: 'money', gte: 50000 }, text: 'You could, if you\'re honest, buy the store. You find yourself looking at the tickets anyway.' },
        { if: { stat: 'money', lte: 60 }, text: 'You have, at this exact moment, less money than the top prize on the smallest ticket. You are aware of this.' },
      ],
      choices: [
        {
          text: 'One ticket. Two dollars. For luck.',
          req: { stat: 'money', gte: 2 },
          reqText: 'Requires $2',
          effects: [
            { money: -2 },
            {
              random: [
                { weight: 70, effects: [{ flag: 'ev_city.scratch_result', set: 'nothing' }] },
                { weight: 25, effects: [{ money: 20 }, { flag: 'ev_city.scratch_result', set: 'small' }] },
                { weight: 5, effects: [{ money: 500 }, buff(FLUSH), { flag: 'ev_city.scratch_result', set: 'big' }] },
              ],
            },
          ],
          goto: 'scratched',
        },
        {
          text: 'A whole strip. Forty dollars. You\'re feeling it tonight.',
          req: { stat: 'money', gte: 60 },
          reqText: 'Requires $60',
          effects: [
            { money: -40 },
            {
              random: [
                { weight: 55, effects: [{ money: 10 }, { stat: 'mood', add: -3 }, { flag: 'ev_city.scratch_result', set: 'nothing' }] },
                { weight: 35, effects: [{ money: 60 }, { flag: 'ev_city.scratch_result', set: 'small' }] },
                { weight: 9, effects: [{ money: 250 }, buff(FLUSH), { flag: 'ev_city.scratch_result', set: 'big' }] },
                { weight: 1, effects: [{ money: 5000 }, buff(FLUSH), { flag: 'ev_city.scratch_result', set: 'jackpot' }] },
              ],
            },
          ],
          goto: 'scratched',
        },
        {
          text: 'Buy one for Mr. Pruszynski, who has been losing at this since 1971.',
          req: { stat: 'money', gte: 2 },
          reqText: 'Requires $2',
          effects: [
            { money: -2 },
            { faction: 'fac.hood', add: 1 },
            {
              random: [
                { weight: 88, effects: [{ flag: 'ev_city.scratch_result', set: 'pruszynski_lost' }] },
                { weight: 12, effects: [{ flag: 'ev_city.scratch_result', set: 'pruszynski_won' }, { if: cathodeOpen, then: [buff(WELL_FED)] }, { faction: 'fac.hood', add: 2 }] },
              ],
            },
          ],
          goto: 'pruszynski',
        },
        {
          tag: '[Leave]',
          text: 'Buy the gum. Walk past the tickets. A lottery is a tax on hope, and you\'re saving yours.',
          effects: [{ money: -1 }, { stat: 'mood', add: 1 }],
          goto: 'gum',
        },
      ],
    },
    scratched: {
      speaker: 'narrator',
      text: [
        { if: { flag: 'ev_city.scratch_result', eq: 'nothing' }, text: 'You scratch with a dime until your thumbnail is grey. Three anchors, two lighthouses, one seagull. Nothing. You also win a fine grey film under your nail that lasts until Thursday. Hector does not look up.' },
        { if: { flag: 'ev_city.scratch_result', eq: 'small' }, text: 'Three lighthouses. You win a small, respectable amount of money — enough for dinner and the smug satisfaction of having beaten a system that is specifically designed not to be beaten. Hector pays you out of the register without looking up.' },
        { if: { flag: 'ev_city.scratch_result', eq: 'big' }, text: 'Three anchors. You read it four times. Then you read the back, where the odds are printed, and read it again. Hector looks up from his crossword for the first time in fifteen years. "Huh," he says, and pays you, and goes back to the crossword.' },
        { if: { flag: 'ev_city.scratch_result', eq: 'jackpot' }, text: 'Three gold ships. You drop the dime. Mr. Pruszynski leans over, sees it, and says a word in Polish that you are fairly sure is a prayer. Hector has to call the lottery office. Hector has to put down the pen. By morning the whole Row knows, and three separate cousins you have never heard of call to congratulate you.' },
      ],
    },
    pruszynski: {
      speaker: 'narrator',
      text: [
        { if: { flag: 'ev_city.scratch_result', eq: 'pruszynski_won' }, text: 'He scratches it with his quarter, very slowly, and then very still. Five hundred dollars. The first thing he has won since 1973. He takes your face in both hands and kisses you on both cheeks, and then he walks straight to the Cathode and buys pie for the entire diner, you included, twice.', else: 'He scratches it with the same quarter and the same muttering. Nothing. He shrugs with enormous dignity, pockets the ticket "for the collection," and pats your arm. "Next week," he says. "Next week is the week." He has said this every week since 1971.' },
      ],
    },
    gum: {
      speaker: 'narrator',
      text: 'You buy the gum. On your way out, Mr. Pruszynski wins two dollars and buys another ticket with it, and you both understand, briefly and completely, the entire economy of Port Lumen.',
    },
  },
}

const scratchTicket: EventDef = {
  id: 'ev_city_scratch_ticket',
  category: 'money',
  weight: 1,
  repeatable: true,
  cooldownDays: 180,
  when: { all: [free, { day: true, gte: 21 }] },
  scene: 'ev_city_scratch_ticket_scene',
}

// ── ev_city_duke_letter (one-off, Act I–IIa) ─────────────────────────────────────

const dukeScene: SceneDef = {
  id: 'ev_city_duke_letter_scene',
  channel: 'mail',
  title: 'URGENT CONFIDENTIAL BUSINESS PROPOSAL (PLEASE READ)!!!',
  from: 'Count Ferdinand Oszlany',
  start: 'letter',
  expiresDays: 21,
  nodes: {
    letter: {
      speaker: 'Count Ferdinand Oszlany',
      text: [
        'From: "COUNT FERDINAND OSZLANY (RET.)" <minister.oszlany@vasgonia-petrol.gov.biz>\nTo: undisclosed-recipients\nSubject: URGENT CONFIDENTIAL BUSINESS PROPOSAL (PLEASE READ)!!!',
        'DEAREST ESTEEMED FRIEND,',
        'I AM COUNT FERDINAND OSZLANY, FORMER MINISTER OF PETROLEUM RESERVES OF THE REPUBLIC OF VASGONIA. I HAVE OBTAINED YOUR CONTACT THROUGH A TRUSTED CHAMBER OF COMMERCE AND YOU ARE HIGHLY RECOMENDED AS A PERSON OF GREAT HONESTY AND DISCRETION.',
        'DUE TO THE REGRETABLE POLITICAL SITUATION (A COUP) I AM IN POSESSION OF $24,500,000.00 (TWENTY FOUR MILLION FIVE HUNDRED THOUSAND DOLLARS) WHICH I MUST MOVE OUT OF VASGONIA WITH URGENCY. I OFFER YOU 30% FOR THE USE OF YOUR ACCOUNT. ONLY A SMALL PROCESSING FEE OF $95.00 IS REQUIRED TO RELEASE THE FUNDS.',
        'PLEASE REPLY WITH YOUR FULL NAME, ADDRESS, TELEPHONE AND FAVORITE COLOR (FOR SECURITY).',
        'GOD BLESS YOU AND YOUR FAMILY,\nCOUNT F. OSZLANY\n(RET.)',
      ],
      choices: [
        {
          tag: '[Gullible]',
          text: 'Send the $95 processing fee. Twenty-four million dollars. What if it\'s real?',
          req: { stat: 'money', gte: 95 },
          reqText: 'Requires $95 (and a certain openness of spirit)',
          effects: [{ money: -95 }, buff(SCAMMED), { trait: 'ev_city_scar_sucker_list' }, { flag: 'ev_city.paid_the_count' }],
          goto: 'paid',
        },
        {
          tag: '[Social]',
          text: 'Scam-bait him. Invent a persona. Waste as much of the Count\'s week as humanly possible.',
          check: {
            skill: 'social',
            dc: 13,
            bonuses: [
              { if: { background: 'class_clown' }, add: 2, label: '+2 (you were built for this)' },
              { if: { trait: 'silver_tongue' }, add: 2, label: '+2 (silver tongue)' },
            ],
            success: 'baited',
            fail: 'baited_back',
            successEffects: [{ stat: 'cred', add: 2 }, { stat: 'mood', add: 6 }, { xp: 'social', add: 20 }, { flag: 'ev_city.scambaiter' }],
            failEffects: [{ trait: 'ev_city_scar_sucker_list' }, { stat: 'stress', add: 6 }],
          },
        },
        {
          if: around('northlink_wes'),
          text: 'Forward it to Wes at NorthLink\'s abuse desk with the subject line "your problem now."',
          effects: [{ npc: 'northlink_wes', affinity: 3 }],
          goto: 'wes',
        },
        {
          tag: '[Leave]',
          text: 'Delete it. Empty the trash. Wash your hands.',
          goto: 'deleted',
        },
      ],
    },
    paid: {
      speaker: 'Count Ferdinand Oszlany',
      text: [
        'DEAREST ESTEEMED FRIEND, THANK YOU FOR YOUR TRUST!!! THE FUNDS ARE NOW 90% RELEASED. UNFORTUNATLY A FURTHER "ANTI-TERRORISM CERTIFICATE" OF $340.00 IS REQUIRED BY THE CENTRAL BANK OF VASGONIA. THIS IS THE FINAL FEE (GUARANTEED).',
        'P.S. YOUR FAVORITE COLOR WAS NOT INCLUDED. PLEASE INCLUDE IT.',
      ],
      choices: [
        {
          text: 'Oh no. Oh, no. Close the laptop and never, ever tell Jax.',
          effects: [{ stat: 'mood', add: -4 }],
          goto: 'realized',
        },
        {
          if: { stat: 'money', gte: 340 },
          tag: '[Gullible]',
          text: 'Send the anti-terrorism certificate fee. You\'re in too deep to stop now.',
          effects: [{ money: -340 }, { stat: 'mood', add: -8 }, { stat: 'stress', add: 6 }],
          goto: 'deeper',
        },
      ],
    },
    realized: {
      speaker: 'narrator',
      text: 'You close the laptop. You sit very still for a while. Ninety-five dollars is gone, and somewhere in a strip-mall office far from any country called Vasgonia, your name, address and phone number have just been added to a list that is traded, sold and resold like baseball cards. You will be hearing from the list.',
    },
    deeper: {
      speaker: 'narrator',
      text: 'The next email asks for $800 for a "courier insurance bond." The one after that is from a different Count. You stop answering. The money is gone, all of it, and the lesson — which, to be fair to you, sticks — was the most expensive thing you bought all year.',
    },
    baited: {
      speaker: 'narrator',
      text: [
        'You become Reverend Cornelius P. Whitlock of the First Church of the Lumen Sound, who is extremely interested in the Count\'s proposal but must first ask a few questions on behalf of his congregation. Many questions. Over eleven days.',
        'By the end, the Count has sent you a photograph of himself holding a sign that reads I LOVE THE CONGREGATION OF THE LUMEN SOUND, a handwritten poem about his late goat, and a scanned "passport" in which his face has clearly been glued on. You post the whole thread to the Loft\'s off-topic board. It is pinned within the hour.',
      ],
    },
    baited_back: {
      speaker: 'narrator',
      text: [
        'It goes great for three emails. Then you get excited and reply from your real account, with your real signature, which — you realize a full second after clicking Send — includes your real name, your real phone number and a very earnest quote about information wanting to be free.',
        'The Count stops answering. Other people start calling. They have your number now, and they are extremely good at being friendly.',
      ],
    },
    wes: {
      speaker: 'northlink_wes',
      text: [
        'Re: your problem now',
        'lol. we get about four hundred of these a day, man. the Count\'s been "retired" since 1998. last month he was a prince. i\'m blocking the whole block of addresses, which will stop him for exactly one afternoon.',
        'thanks though. seriously. you\'re the only customer who ever forwards them instead of replying.\n-- Wes\nNorthLink Network Ops · "We Run the Pipe"',
      ],
    },
    deleted: {
      speaker: 'narrator',
      text: 'You delete it. Two days later, a nearly identical email arrives from a Duchess. Then a Prince. Then a Lieutenant General who has somehow, tragically, lost his entire family and all of his vowels. You delete them all. It is a war of attrition, and you are, for now, winning.',
    },
  },
}

const dukeLetter: EventDef = {
  id: 'ev_city_duke_letter',
  category: 'money',
  weight: 2,
  when: { all: [free, { day: true, gte: 30 }, untilDate(2004, 6, 1), { any: [actLte(1), stillLight] }] },
  scene: 'ev_city_duke_letter_scene',
}

// ── ev_city_sucker_calls (repeatable while scarred) ──────────────────────────────

const suckerScene: SceneDef = {
  id: 'ev_city_sucker_calls_scene',
  channel: 'dialog',
  title: 'Unknown Caller',
  start: 'ring',
  nodes: {
    ring: {
      speaker: 'Unknown Caller',
      effects: [{ var: 'ev_city.sucker_calls', add: 1 }],
      text: [
        { if: { var: 'ev_city.sucker_calls', lte: 1 }, text: '"Congratulations! You have been SELECTED for a complimentary Caribbean cruise for two! To confirm your prize, I just need a small port-fee deposit and the long number on the front of—" It\'s a recording. The recording is very excited for you.' },
        { if: { all: [{ var: 'ev_city.sucker_calls', eq: 2 }] }, text: '"Good afternoon, this is Kevin from the National Consumer Refund Bureau. Our records show you were overcharged by a foreign lottery, and you are entitled to a full refund, less a small processing—" Kevin sounds tired. Kevin has made this call four hundred times today.' },
        { if: { var: 'ev_city.sucker_calls', gte: 3 }, text: '"Hello, this is Technical Support. Your computer has been sending us error messages. Very serious errors. If you could just go to your computer and—" You look at your computer. Your computer, as far as you know, has not been sending anyone anything, because you would know.' },
        'It\'s the fourth call this week. Your number is on a list. The list has friends.',
      ],
      choices: [
        {
          text: 'Change your number. Forty dollars and a week of telling everyone you know.',
          req: { stat: 'money', gte: 40 },
          reqText: 'Requires $40',
          effects: [
            { money: -40 },
            { trait: 'ev_city_scar_sucker_list', remove: true },
            { removeBuff: 'ev_city_phone_wont_stop' },
            { stat: 'stress', add: 3 },
            { if: around('jax'), then: [{ npc: 'jax', affinity: -1 }] },
          ],
          goto: 'new_number',
        },
        {
          tag: '[OpSec]',
          text: 'Feed them a dead-end identity so thin it gets your number flagged "bad lead" on whatever list they trade.',
          check: {
            skill: 'opsec',
            dc: 13,
            bonuses: [
              { if: { trait: 'paranoid' }, add: 2, label: '+2 (you have been preparing for this call your whole life)' },
              { if: { background: 'latchkey' }, add: 1, label: '+1 (you learned to lie to phones early)' },
            ],
            success: 'dead_lead',
            fail: 'mom_name',
            successEffects: [{ trait: 'ev_city_scar_sucker_list', remove: true }, { removeBuff: 'ev_city_phone_wont_stop' }, { stat: 'mood', add: 5 }, { xp: 'opsec', add: 20 }],
            failEffects: [
              { stat: 'stress', add: 6 },
              { if: momHere, then: [{ npc: 'mom', affinity: -3 }, { flag: 'ev_city.mom_on_the_list' }] },
            ],
          },
        },
        {
          tag: '[Social]',
          text: 'Keep them on the line. As long as humanly possible. Ask about their weekend.',
          check: {
            skill: 'social',
            dc: 14,
            bonuses: [{ if: { flag: 'ev_city.scambaiter' }, add: 2, label: '+2 (the Reverend Whitlock rides again)' }],
            success: 'long_call',
            fail: 'more_calls',
            successEffects: [{ stat: 'mood', add: 8 }, { stat: 'cred', add: 1 }],
            failEffects: [buff(PHONE_WONT_STOP), { stat: 'stress', add: 4 }],
          },
        },
        {
          tag: '[Leave]',
          text: 'Hang up. Unplug the phone. Plug it back in when you need it.',
          effects: [{ stat: 'stress', add: 2 }],
          goto: 'unplug',
        },
      ],
    },
    new_number: {
      speaker: 'narrator',
      text: [
        'The new number is one digit off from the Cathode\'s, which means for a month you get calls asking if the pie is fresh. The pie is always fresh. You tell them so. It\'s nicer than the cruises.',
        { if: around('jax'), text: 'Jax is personally offended by the change and calls your old number four times "out of respect" before accepting it.' },
      ],
    },
    dead_lead: {
      speaker: 'narrator',
      text: [
        'You become Doreen, eighty-three, very interested, very hard of hearing, with a bank account at an institution that does not exist and a date of birth that is also, if anyone checked, the date of the Battle of Hastings.',
        'Somewhere, on some list, your number gets a little note next to it that means "waste of time." The calls stop over the next two weeks, one flavor at a time, like a party emptying out.',
      ],
    },
    mom_name: {
      speaker: 'narrator',
      text: [
        'You make up a name. It\'s your mother\'s maiden name, because it\'s the first one your panicking brain offers up. You realize this at the same moment the caller says, "Thank you, Mrs.—", and repeats it back.',
        { if: momHere, text: 'A week later Mom calls, bewildered, to ask why a man named Kevin keeps phoning her about a refund from a foreign lottery she has never entered. You tell her you have no idea. She knows you\'re lying. She doesn\'t know about what. That\'s worse.', else: 'Nobody answers to that name anymore. The calls go to a dead number and ring out. You sit with that for a long time.' },
      ],
    },
    long_call: {
      speaker: 'narrator',
      text: [
        'Forty-seven minutes. You learn that Kevin\'s real name is Dwayne, that his weekend was bad, that his supervisor listens to all the calls and is "a real piece of work," and that Dwayne wanted to be a paramedic. You talk him through the application process. He hangs up on you, finally, but gently.',
        'You still get calls. You don\'t dread them the same way. Somewhere out there, you like to think, Dwayne is filling in a form.',
      ],
    },
    more_calls: {
      speaker: 'narrator',
      text: 'You keep them on for nine minutes, which is apparently long enough to count as "highly engaged." Now you\'re on the premium list. The phone rings at breakfast, at dinner, and once, memorably, at 4:12 a.m., to tell you your car warranty has expired. You don\'t own a car.',
    },
    unplug: {
      speaker: 'narrator',
      text: 'You unplug the phone. The silence is wonderful for eleven hours, until you plug it back in to call for pizza and it rings in your hand before you can dial.',
    },
  },
}

const suckerCalls: EventDef = {
  id: 'ev_city_sucker_calls',
  category: 'money',
  weight: 2,
  repeatable: true,
  cooldownDays: 120,
  when: { all: [free, { trait: 'ev_city_scar_sucker_list' }] },
  scene: 'ev_city_sucker_calls_scene',
}

// ── ev_city_found_wallet (one-off, Act I–II) + the apology weeks later ──────────

const walletScene: SceneDef = {
  id: 'ev_city_found_wallet_scene',
  channel: 'dialog',
  title: 'Finders',
  start: 'found',
  nodes: {
    found: {
      speaker: 'narrator',
      text: [
        { if: cathodeOpen, text: 'It\'s wedged down between the cushions of the back booth at the Cathode.', else: 'It\'s lying under the bench at the Sodium Row bus stop, across from where the Cathode used to be.' },
        'Brown leather, good leather, soft as a glove. Inside, three hundred and forty dollars in crisp twenties, a Harbor Point address, two school photos of freckled kids, and a business card: GERALD WHITCOMBE — VICE PRESIDENT, RETAIL LENDING — MERIDIAN TRUST BANK.',
        { if: { stat: 'money', lte: 200 }, text: 'Three hundred and forty dollars is more than you have. It is, if you\'re being honest, more than you have ever had at one time.' },
      ],
      choices: [
        {
          text: 'Take it back to him yourself. Harbor Point. Today.',
          goto: 'harbor',
        },
        {
          if: salHere,
          text: 'Give it to Sal. The Cathode has a lost-and-found older than you, and Sal will know what to do.',
          effects: [{ faction: 'fac.hood', add: 2 }, { npc: 'sal', affinity: 2 }, { money: 10 }],
          goto: 'sal',
        },
        {
          text: 'Keep the cash. Mail the wallet back. He\'s a bank vice president; he\'ll live.',
          effects: [{ money: 340 }, { stat: 'mood', add: -3 }, { flag: 'ev_city.kept_wallet_cash' }],
          goto: 'mailed',
        },
        {
          text: 'Keep all of it. Finders keepers.',
          effects: [
            { money: 340 },
            { flag: 'ev_city.kept_wallet_cash' },
            { chance: 0.35, then: [{ stat: 'heat', add: 4 }, { flag: 'ev_city.wallet_on_camera' }, { complication: 'legal', tier: 1 }] },
          ],
          goto: 'kept',
        },
      ],
    },
    harbor: {
      speaker: 'narrator',
      text: [
        'The Whitcombe house has a lawn so green it looks painted and a doorbell that plays four notes. Gerald answers in a golf sweater. He takes the wallet, and then — right there on the step, in front of you — he opens it and starts counting.',
        '"There was three-eighty in here," he says, not quite looking at you. "I\'m almost certain there was three-eighty."',
      ],
      choices: [
        {
          tag: '[Social]',
          text: '"Mr. Whitcombe, I drove forty minutes to bring it back. If I wanted your money, I\'d have all of it." Say it kindly. Mean it.',
          check: {
            skill: 'social',
            dc: 12,
            bonuses: [
              { if: { trait: 'silver_tongue' }, add: 2, label: '+2 (silver tongue)' },
              { if: { trait: 'hothead' }, add: -2, label: '−2 (you are already annoyed)' },
              { if: { stat: 'heat', gte: 40 }, add: -1, label: '−1 (you look like someone the police want to talk to, because they do)' },
            ],
            success: 'thanked',
            fail: 'accused',
            successEffects: [{ money: 100 }, { flag: 'ev_city.whitcombe_thanked' }, { stat: 'mood', add: 6 }],
            failEffects: [
              { stat: 'heat', add: 8 },
              { stat: 'stress', add: 10 },
              buff(PRECINCT_NIGHT),
              { flag: 'ev_city.wallet_accused' },
              { complication: 'legal', tier: 1 },
              { scene: 'ev_city_whitcombe_apology', delayHours: 24 * 28 },
            ],
          },
        },
        {
          text: 'Hand him forty dollars of your own. "Maybe it fell out. Here." Leave before he can say anything.',
          req: { stat: 'money', gte: 40 },
          reqText: 'Requires $40',
          effects: [{ money: -40 }, { stat: 'mood', add: -2 }, { flag: 'ev_city.paid_whitcombe' }],
          goto: 'paid_him',
        },
      ],
    },
    thanked: {
      speaker: 'narrator',
      text: [
        'He stops counting. He looks at you, properly, for the first time, and something in his face goes pink and embarrassed. "You\'re right. God. I\'m sorry. I\'ve had a week." He presses a hundred-dollar bill into your hand and won\'t take it back.',
        '"If you ever need anything at Meridian," he says, "you call me. I mean it." He writes his direct line on the back of the card. You keep it in your own wallet, which is not as nice as his.',
      ],
    },
    accused: {
      speaker: 'narrator',
      text: [
        'You say it wrong. It comes out sharp, and he steps back into his doorway like you raised a hand. "I think," Gerald Whitcombe says, "I\'d better call someone."',
        'Harbor Point private security arrives in four minutes; the police in twelve. You spend the evening at the Harbor Point precinct explaining to a sergeant with a typewriter that you are the person who returned the wallet. He writes that down. He also writes down your name, your address, and "known associate: computers." They let you go at 2 a.m. without charges.',
        { if: salHere, text: 'Sal comes to pick you up in the Cathode\'s delivery van, in his apron, without being asked. He tells the desk sergeant exactly what he thinks of Harbor Point. The desk sergeant, it turns out, eats at the Cathode on Thursdays, and apologizes.' },
      ],
    },
    paid_him: {
      speaker: 'narrator',
      text: 'He takes the forty dollars. He actually takes it. You walk back to the bus stop with your face burning, forty dollars lighter, having paid a bank vice president for the privilege of being honest. Port Lumen, you think, is a very specific kind of city.',
    },
    sal: {
      speaker: 'sal',
      text: [
        '"Harbor Point," he says, reading the card, with a face like he\'s smelled milk on the turn. "I\'ll mail it. Registered. So nobody can say nothing."',
        'Two weeks later a card arrives at the Cathode addressed TO THE HONEST PERSON, with a twenty inside. Sal gives you ten and keeps ten "for handling." He pins the card up behind the register anyway, next to the health inspection and a signed photo of a bowler nobody remembers.',
      ],
    },
    mailed: {
      speaker: 'narrator',
      text: 'You mail it back in a padded envelope with no return address, minus the cash. The kids\' photos are in it. You made sure the kids\' photos are in it. You tell yourself that\'s the part that matters, and you almost believe it, most days.',
    },
    kept: {
      speaker: 'narrator',
      text: [
        'You keep it: the cash, the good leather, the card. You throw the school photos in the trash bin behind the laundromat and then, ten minutes later, climb into the bin to get them back, and mail them to the Harbor Point address in a plain envelope.',
        { if: { flag: 'ev_city.wallet_on_camera' }, text: 'You don\'t notice the ATM camera over the laundromat door. Somebody, eventually, does.' },
      ],
    },
  },
}

const whitcombeApologyScene: SceneDef = {
  id: 'ev_city_whitcombe_apology',
  channel: 'mail',
  title: 'An apology (and the forty dollars)',
  from: 'Gerald Whitcombe',
  start: 'letter',
  expiresDays: 28,
  nodes: {
    letter: {
      speaker: 'Gerald Whitcombe',
      text: [
        'From: Gerald Whitcombe <g.whitcombe@meridiantrust.example>\nSubject: An apology (and the forty dollars)',
        'I found the forty dollars. It was in my other coat. It had been in my other coat the entire time.',
        'I have been trying to write this for a week. I called the police on someone who drove forty minutes to return my wallet, because they didn\'t look like they belonged on my street. My daughter asked me why the police were at the door, and I told her the truth, and I have never been so ashamed of an answer.',
        'I have spoken to the precinct. I would like to do something more than speak. Please tell me what.\n\nGerald Whitcombe\nMeridian Trust Bank · Retail Lending',
      ],
      choices: [
        {
          text: '"Call the precinct back and have my name taken off that report. All of it."',
          effects: [{ stat: 'heat', add: -6 }, { removeBuff: 'ev_city_precinct_night' }, { clearFlag: 'ev_city.wallet_accused' }, { flag: 'ev_city.wallet_cleared' }],
          goto: 'cleared',
        },
        {
          tag: '[Business]',
          text: '"There\'s a diner on Sodium Row that needs a new walk-in freezer, and a bank that never lends south of the overpass. Fix one of those."',
          check: {
            skill: 'business',
            dc: 14,
            bonuses: [{ if: onRow(20), add: 1, label: '+1 (you know exactly what the Row needs)' }],
            success: 'loan',
            fail: 'pen',
            successEffects: [{ faction: 'fac.hood', add: 5 }, { flag: 'ev_city.whitcombe_loan' }, { stat: 'heat', add: -3 }, buff(CIVIC_PRIDE)],
            failEffects: [{ money: 50 }, { stat: 'mood', add: -2 }],
          },
        },
        {
          text: 'Accept the apology. Ask for nothing. Let him carry it.',
          effects: [{ stat: 'mood', add: 4 }, { stat: 'heat', add: -2 }],
          goto: 'nothing',
        },
      ],
    },
    cleared: {
      speaker: 'Gerald Whitcombe',
      text: 'Done. The sergeant was not delighted, but it\'s done — the report now says you returned lost property and a resident made an error. Which is what happened. Thank you for telling me what to do. Most people just want me to feel bad, and I do, and it doesn\'t help anyone.\n— G.W.',
    },
    loan: {
      speaker: 'narrator',
      text: [
        'He writes back in an hour. Then again the next day, from a different, more official address. By spring, Meridian Trust\'s "Neighborhood Renewal Desk" has made its first ever loan south of the overpass: eleven thousand dollars at a decent rate to a diner on Sodium Row for a walk-in freezer.',
        { if: salHere, text: 'Sal pretends it has nothing to do with you. He also names the freezer after you, in black marker, on the door.' },
        'Gerald also has the police report amended. He sends you a copy with a note: "It should never have been written. I\'m sorry it took a freezer to prove it."',
      ],
    },
    pen: {
      speaker: 'narrator',
      text: 'He gets cagey. His reply is three paragraphs long and contains the phrases "risk appetite," "lending criteria" and "not really my department." It comes with a check for fifty dollars and a Meridian Trust ballpoint pen. The pen is very nice. The report stays on file.',
    },
    nothing: {
      speaker: 'narrator',
      text: 'You write back one line: "Apology accepted. Be kinder to the next one." He replies with one line too: "I will." You have no way of knowing if he means it. A month later, a small item in the Courier mentions a Harbor Point banker who volunteered to coach a youth soccer team on the Row. You decide he does.',
    },
  },
}

const foundWallet: EventDef = {
  id: 'ev_city_found_wallet',
  category: 'money',
  weight: 2,
  when: { all: [free, actLte(2), { day: true, gte: 40 }] },
  scene: 'ev_city_found_wallet_scene',
}

// ── ev_city_rent_hike (repeatable while renting) ─────────────────────────────────

/** Rent increase per day by housing (scaled to what each place already costs). */
const HIKE: Record<(typeof RENTED_HOUSING)[number], number> = {
  shared_room: 1,
  studio_flat: 2,
  millgate_onebed: 3,
  harbor_loft: 5,
  harbor_penthouse: 10,
}

/** Apply the rent hike obligation for whichever housing you rent, `extra` dollars/day steeper. */
function hikeFor(extra: number, days: number, label: string): Effect[] {
  return RENTED_HOUSING.map((h): Effect => ({
    if: { housing: h },
    then: [
      { obligation: { id: 'ev_city_rent_hike', label, perDay: HIKE[h] + extra, days } },
      { flag: 'ev_city.hike_at', set: h },
    ],
  }))
}

const rentHikeScene: SceneDef = {
  id: 'ev_city_rent_hike_scene',
  channel: 'mail',
  title: 'NOTICE OF RENT ADJUSTMENT',
  from: 'Property Management Office',
  start: 'notice',
  expiresDays: 21,
  onExpire: [...hikeFor(0, 180, 'Rent adjustment (you never answered the letter)')],
  nodes: {
    notice: {
      speaker: 'Property Management Office',
      text: [
        'Dear Valued Resident,',
        { if: { flag: 'ev_city.tenants_union' }, text: '(The laundry-room committee has already photocopied this letter and pinned it to the corkboard with a note: MEETING THURSDAY. BRING COOKIES.)' },
        { if: { flag: 'ev_city.landlord_inspection' }, text: 'We also remind you that the file regarding unauthorized electrical modifications in your unit remains open.' },
        'In light of rising operating costs, market conditions, and our ongoing commitment to excellence in residential living, your monthly rent will be adjusted effective the first of next month.',
        { if: { var: 'w.rent', gte: 1.1 }, text: 'As you may be aware, the neighborhood is increasingly "up and coming." We are confident you will agree that the privilege of being down and going in an up-and-coming neighborhood is worth a little extra.' },
        { if: { housing: 'harbor_penthouse' }, text: 'The Residences Board also notes that the lobby orchid program and concierge valet will be "enhanced." Nobody asked for them to be enhanced. The orchids were fine.' },
        { if: surveilled, text: 'Please also note the building\'s new "Smart Entry" system will now log resident comings and goings "for your security." There is no opt-out form. There is, the letter implies, no need for one.' },
        'We value you as a resident and look forward to serving you in the years to come.\n\nSincerely,\nProperty Management',
      ],
      choices: [
        {
          text: 'Pay it. Everybody\'s rent is going up. That\'s just the city now.',
          effects: [...hikeFor(0, 180, 'Rent adjustment')],
          goto: 'paid',
        },
        {
          tag: '[Business]',
          text: 'Reply with comparable listings, your spotless payment history, and a very calm threat to move.',
          check: {
            skill: 'business',
            dc: 14,
            bonuses: [
              { if: { background: 'class_clown' }, add: 1, label: '+1 (you can sell anything, including yourself as a tenant)' },
              { if: { flag: 'ev_city.local_fixture' }, add: 1, label: '+1 (local fixture)' },
            ],
            success: 'held',
            fail: 'called_bluff',
            successEffects: [{ stat: 'mood', add: 4 }, { xp: 'business', add: 15 }],
            failEffects: [...hikeFor(1, 240, 'Rent adjustment (plus a "correspondence fee")'), { stat: 'stress', add: 5 }],
          },
        },
        {
          tag: '[Social]',
          text: 'Get the building together. A landlord can raise one rent. It\'s harder to raise forty.',
          check: {
            skill: 'social',
            dc: 13,
            bonuses: [
              { if: around('list_activist'), add: 2, label: '+2 (Nadia Bell has done this before and lends you her clipboard)' },
              { if: onRow(30), add: 1, label: '+1 (people answer your knock)' },
            ],
            success: 'tenants',
            fail: 'singled_out',
            successEffects: [{ faction: 'fac.hood', add: 4 }, buff(CIVIC_PRIDE), { flag: 'ev_city.tenants_union' }, { if: around('list_activist'), then: [{ npc: 'list_activist', affinity: 4 }] }],
            failEffects: [
              ...hikeFor(0, 180, 'Rent adjustment'),
              { stat: 'heat', add: 3 },
              { stat: 'stress', add: 6 },
              { flag: 'ev_city.landlord_inspection' },
              { chance: 0.3, then: [{ complication: 'legal' }] },
            ],
          },
        },
      ],
    },
    paid: {
      speaker: 'narrator',
      text: 'You sign the new lease. The number at the bottom is bigger than the old one, in the same font, as if that makes it the same number. On the stairs you pass a neighbor holding the same letter. You nod at each other like people at a funeral for somebody neither of you liked.',
    },
    held: {
      speaker: 'Property Management Office',
      text: 'Dear Valued Resident, Upon review of your account and your correspondence, we are pleased to offer you a rent freeze for the next lease term in recognition of your excellent payment history. We value long-term residents. Please do not share the terms of this offer with other residents.\n\n(You share it with every other resident.)',
    },
    called_bluff: {
      speaker: 'Property Management Office',
      text: 'Dear Valued Resident, We have noted your concerns. We have also noted that the comparable listings you enclosed are no longer available, as they have been leased at higher rates. Your adjustment stands, and a correspondence processing fee has been applied. We look forward to serving you.\n\n(They are, you realize, very good at this.)',
    },
    tenants: {
      speaker: 'narrator',
      text: [
        'Thirty-one units, one sign-up sheet taped inside the mailroom, and a meeting in the laundry room with folding chairs and store-brand cookies. You don\'t have to make a speech. The woman from 3C who works nights at the port makes it for you, and she\'s better at it than you would have been.',
        'Property Management backs down in nine days with a letter full of phrases like "in the spirit of community." The laundry-room meetings keep happening after, every month, long after anyone remembers the rent. They\'re mostly about cookies now. It\'s nice.',
      ],
    },
    singled_out: {
      speaker: 'narrator',
      text: [
        'The meeting is you, the woman from 3C, and a man who came for the cookies. Two days later, Property Management schedules a "routine safety inspection" of exactly one apartment. Yours.',
        'The inspector spends forty minutes photographing your desk: the extension cords, the power strips daisy-chained into power strips, the rig humming under a blanket for cooling. The report calls it "unauthorized electrical modification." The rent goes up anyway. Your apartment now has a file, and the file has pictures.',
      ],
    },
  },
}

const rentHike: EventDef = {
  id: 'ev_city_rent_hike',
  category: 'money',
  weight: 1.5,
  repeatable: true,
  cooldownDays: 365,
  when: { all: [free, renting, { day: true, gte: 300 }, { not: { obligation: 'ev_city_rent_hike' } }] },
  scene: 'ev_city_rent_hike_scene',
}

/** Moving out ends the hike on the old place. One small watcher per rented housing. */
const rentHikeCleanup: TriggerDef[] = RENTED_HOUSING.map((h): TriggerDef => ({
  id: `ev_city_rent_hike_moved_${h}`,
  when: { all: [{ obligation: 'ev_city_rent_hike' }, { flag: 'ev_city.hike_at', eq: h }, { not: { housing: h } }] },
  effects: [
    { removeObligation: 'ev_city_rent_hike' },
    { clearFlag: 'ev_city.hike_at' },
    { log: 'You moved out. The old rent increase is somebody else\'s problem now.', kind: 'money' },
  ],
  once: false,
  cooldownDays: 7,
}))

export default defineContent({
  scenes: [scratchScene, dukeScene, suckerScene, walletScene, whitcombeApologyScene, rentHikeScene],
  events: [scratchTicket, dukeLetter, suckerCalls, foundWallet, rentHike],
  triggers: rentHikeCleanup,
})
