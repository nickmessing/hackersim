/**
 * PKG-10 — Act III comedy relief in the Neighborhood arc (bible §7.5: "New steps also: 'Kim's
 * science fair,' 'the Row's first website'").
 *
 * - fac_hood_row_website, "Cannery Row Online": the Neighborhood Association wants a website. Pure
 *   comedy, until a data broker offers to "sponsor" it in exchange for the guestbook and the phone
 *   directory. The finished site (`fac.hood.row_website`) helps the Save the Cathode fundraiser.
 * - fac_hood_kims_science_fair, "The Science Fair": Kim drafts you as a judge at the Row's youth
 *   science fair. A potato battery takes out the lights, and a twelve-year-old's radio project
 *   has recorded something from the old mill every night at 3:12 a.m.
 *
 * Neither step writes Kim's trajectory (PKG-11) or world exposure; they read them for flavor.
 *
 * Failing the directory password ([Opsec]) or the scrub leaves the Row's names, numbers and
 * birthdays loose on the internet even if nobody sells them: `trig_hood_web_leak` delivers Ruth's
 * "strange phone calls" letter in its leak variant.
 */
import { defineContent } from '@/engine/registry'
import type { Choice, Cond } from '@/engine/types'
import { CATHODE_OPEN, DAD_RETRAINED, KIM_CLOSE, MET_MARGE, SAL_AROUND, SPRING } from './shared'

const salsCathode: Cond = { all: [CATHODE_OPEN, SAL_AROUND] }
const kimBright: Cond = { var: 'kim_trajectory', gte: 2 }
const kimShady: Cond = { var: 'kim_trajectory', lte: -2 }

const planDone = { flag: 'fac.hood.web_plan' }
const answered = { flag: 'fac.hood.web_broker_answered' }
/** The members' password ended up on the front page. Unless the site gets scrubbed, the directory walks. */
const LEAKY = 'fac.hood.web_password_public'
/** The Row's directory got out without anyone selling it: the password leak, or a scrub that came too late. */
const leakedAnyway: Cond = {
  all: [
    answered,
    { any: [{ flag: LEAKY }, { flag: 'fac.hood.web_scraped' }] },
    { not: { flag: 'fac.hood.web_scrubbed' } },
    { not: { flag: 'fac.hood.sold_guestbook' } },
  ],
}

const directoryChoices: Choice[] = [
  {
    text: '"A directory. Names, numbers, birthdays. Everybody can find everybody."',
    effects: [{ flag: 'fac.hood.web_directory' }],
    goto: 'wrap_up',
  },
  {
    text: '"Phone numbers stay off the internet. Put up the Cathode\'s number, and that\'s it."',
    effects: [{ faction: 'fac.hood', add: 1 }],
    goto: 'no_directory',
  },
  {
    text: '"Members only. The directory goes behind a password."',
    check: {
      skill: 'opsec',
      dc: 12,
      success: 'locked',
      fail: 'password',
      successEffects: [{ flag: 'fac.hood.web_directory_locked' }],
      failEffects: [{ flag: 'fac.hood.web_directory' }, { flag: LEAKY }, { stat: 'stress', add: 3 }],
    },
  },
]

const prizeChoices: Choice[] = [
  {
    text: 'First prize to Danny Ruiz. This is real science, and everybody in this gym should hear you say it.',
    effects: [{ faction: 'fac.hood', add: 3 }, { flag: 'fac.hood.danny_prize' }],
    goto: 'danny_wins',
  },
  {
    text: 'First prize to Danny. Then a quiet word, just the two of you, about where he points that antenna after dark.',
    effects: [{ faction: 'fac.hood', add: 3 }, { flag: 'fac.hood.danny_warned' }, { npc: 'kim', affinity: 2 }, { xp: 'opsec', add: 20 }],
    goto: 'danny_warned',
  },
  {
    text: 'First prize to "Is Pie a Liquid?" The people want pie.',
    effects: [{ faction: 'fac.hood', add: 4 }],
    goto: 'pie_wins',
  },
]

export default defineContent({
  quests: [
    {
      id: 'fac_hood_row_website',
      title: 'Cannery Row Online',
      kind: 'faction',
      act: 3,
      faction: 'fac.hood',
      giver: 'grandma_ruth',
      priority: 15,
      autoStart: { all: [{ var: 'act', gte: 3 }, { faction: 'fac.hood', gte: 10 }, { day: true, gte: 1370 }] },
      rewards: 'The Row gets a website · Neighborhood rep',
      summary: [
        'The Cannery Row Neighborhood Association has noticed that Harbor Point has a website. The Harbor Point Garden Society has a website. The yacht club has a website with a picture of a yacht on it.',
        'Ruth Alvarez, chair, has convened an emergency meeting. You are the emergency.',
      ],
      start: 'committee',
      stages: {
        committee: {
          text: 'The Neighborhood Association wants a website "like the Harbor Point people have, but nicer." You have been appointed Webmaster by a unanimous vote you were not present for.',
          onEnter: [{ scene: 'hood_web_committee', delayHours: 4 }],
          objectives: [
            {
              id: 'meeting',
              text: 'Survive the committee meeting',
              when: planDone,
              hint: 'A dialog opens on its own. Bring patience. Ruth will bring empanadas.',
            },
          ],
          next: 'launch',
        },
        launch: {
          text: [
            { if: { flag: 'fac.hood.web_style', eq: 'chaos' }, text: 'You are building a website designed by a committee vote: eleven colors, three fonts, and a cat for a logo. It is the ugliest thing you have ever made. The committee is thrilled.' },
            { if: { flag: 'fac.hood.web_style', eq: 'kim' }, text: 'Kim is building the Row\'s website, which means it will be done fast, done well, and contain at least one thing you will not find until much later.' },
            'The site goes up over the weekend. Ruth has already told the choir to "go on the internet and look at us."',
          ],
          onEnter: [{ scene: 'hood_web_launch', delayHours: 96 }],
          objectives: [
            {
              id: 'live',
              text: 'Get the site online',
              when: { flag: 'fac.hood.row_website' },
              hint: 'It goes up on its own in a few days. Watch your Mail for Ruth.',
            },
          ],
          next: 'broker',
        },
        broker: {
          text: 'Cannery Row is on the internet: a guestbook, a menu, a lost cat, and a hit counter Ruth checks every morning like a stock ticker. Somebody else has noticed the site, too.',
          onEnter: [{ scene: 'hood_web_broker', delayHours: 120 }],
          objectives: [
            {
              id: 'sponsor',
              text: 'Answer the "community sponsorship" offer',
              when: answered,
              hint: 'A company wants to sponsor the Row\'s site. Read the fine print in your Mail.',
            },
          ],
        },
      },
    },
    {
      id: 'fac_hood_kims_science_fair',
      title: 'The Science Fair',
      kind: 'faction',
      act: 3,
      faction: 'fac.hood',
      giver: 'kim',
      priority: 15,
      autoStart: {
        all: [{ var: 'act', gte: 3 }, SPRING, KIM_CLOSE, { npc: 'kim', fateNot: ['endangered'] }, { npc: 'kim', affinityGte: 15 }],
      },
      rewards: 'Kim owes you one · Neighborhood rep',
      summary: 'Kim is running the Cannery Row youth science fair for her service hours, and she needs a judge who knows computers. She has asked you, which for Kim is practically a hug.',
      start: 'ask',
      stages: {
        ask: {
          text: 'Kim needs a judge for the youth science fair at the community center. She says it\'s "not a big deal." She has messaged you about it four times.',
          onEnter: [{ scene: 'hood_fair_ask', delayHours: 2 }],
          objectives: [
            {
              id: 'yes',
              text: 'Answer Kim',
              when: { flag: 'fac.hood.fair_yes' },
              hint: 'Kim is messaging you on BuddyPager. She won\'t wait forever.',
            },
          ],
          next: 'fair',
        },
        fair: {
          text: 'Saturday, ten a.m., the community center gym. Wear a shirt with buttons. There is, according to Kim, "a potato battery situation developing."',
          objectives: [
            {
              id: 'judge',
              text: 'Judge the science fair',
              when: { flag: 'fac.hood.fair_done' },
              hint: 'A dialog opens on the day of the fair.',
            },
          ],
        },
      },
    },
  ],

  scenes: [
    // ── The committee ──────────────────────────────────────────────────────
    {
      id: 'hood_web_committee',
      channel: 'dialog',
      title: 'The Committee',
      start: 'open',
      nodes: {
        open: {
          speaker: 'narrator',
          text: [
            {
              if: salsCathode,
              text: 'The Cathode, after the dinner rush. Sal has pushed two booths together and put out a pot of coffee and a pie with one slice already missing, which he denies.',
              else: 'Ruth Alvarez\'s living room, among the porcelain cats. Somebody has brought folding chairs from the community center. Somebody else has brought a folding chair that will not unfold, and is sitting on it anyway.',
            },
            'The Cannery Row Neighborhood Association is in session. Ruth has brought empanadas and a printout of the Harbor Point Garden Society\'s website, across which she has written, in red pen: THIS BUT NICER.',
          ],
          next: 'ruth',
        },
        ruth: {
          speaker: 'grandma_ruth',
          text: [
            '"Order. Order. Tommy, put that down."',
            '"The Harbor Point people have a website. The yacht club has a website with a picture of a yacht. The Garden Society has a website, {name}, and they grow one kind of rose." She lets that sink in. "We would like a website."',
            '"You have been elected Webmaster. It was unanimous. You weren\'t here, so it was very easy."',
          ],
          next: 'wishlist',
        },
        wishlist: {
          speaker: 'narrator',
          text: [
            'Everybody has a request, and everybody has written it down.',
            'Ruth wants a guestbook "so people can say hello" and a page for recipes, "the real ones, not the ones I give out at church."',
            { if: salsCathode, text: 'Sal wants the menu up. He wants the hours up. He does not want a picture of himself up, and says so three times, looking directly at you.' },
            { if: MET_MARGE, text: 'Marge Osgood, secretary, because she types ninety words a minute and thinks in switchboards, wants a directory. "Everybody\'s name and number, like the old exchange book. Birthdays too. People should know each other\'s birthdays."' },
            'Mrs. Castellano wants a page for her cat, Modem, who has been missing since Thursday and whom she describes, with total confidence, as "very recognizable."',
            { if: { flag: 'fac.hood.castellano_dryer' }, text: 'She would also like it entered into the minutes that her hair dryer has never been the same, and she looks at you while she says it, and Ruth writes it down.' },
            { if: { flag: 'fac.hood.payroll_late' }, text: 'Mr. Halvorsen from the cannery office has come "as a concerned neighbor" and asks, twice, whether the website will be "on the same kind of computer as payroll." Nobody answers him. Everybody remembers payroll Friday.' },
            { if: DAD_RETRAINED, text: 'Your father wants "a page for the business," and has brought his business card so you can "scan it into the computer," and has brought a second business card for you, personally.' },
            { if: KIM_CLOSE, text: 'Kim, slouched in the corner, raises one hand without looking up from her phone. "Please. I am begging you. No music."' },
          ],
          choices: [
            {
              text: 'Hand-code it yourself. Clean, fast, and it loads on a 28.8 modem in a church basement.',
              check: {
                skill: 'programming',
                dc: 14,
                success: 'clean',
                fail: 'only_mine',
                successEffects: [{ flag: 'fac.hood.web_style', set: 'clean' }],
                failEffects: [{ flag: 'fac.hood.web_style', set: 'builder' }, { stat: 'energy', add: -10 }, { stat: 'stress', add: 4 }, { stat: 'mood', add: -3 }],
              },
            },
            {
              text: '"We\'ll design it together. Every decision goes to a vote."',
              check: {
                skill: 'social',
                dc: 13,
                success: 'democracy',
                fail: 'chaos',
                successEffects: [{ flag: 'fac.hood.web_style', set: 'democracy' }, { faction: 'fac.hood', add: 2 }],
                failEffects: [{ flag: 'fac.hood.web_style', set: 'chaos' }, { faction: 'fac.hood', add: 3 }, { npc: 'kim', affinity: -2 }, { stat: 'stress', add: 4 }],
              },
            },
            {
              text: 'Use a free page builder. HomeSteader has templates, a guestbook widget, and a hit counter.',
              effects: [{ flag: 'fac.hood.web_style', set: 'builder' }],
              goto: 'builder',
            },
            {
              if: KIM_CLOSE,
              text: '"Kim. You build it. I\'ll supervise."',
              effects: [{ flag: 'fac.hood.web_style', set: 'kim' }, { npc: 'kim', affinity: 3 }],
              goto: 'kim_builds',
            },
          ],
        },
        clean: {
          speaker: 'narrator',
          text: [
            'You sketch it on a napkin: one page, big type, the menu, the guestbook, the hours. No blinking. No music. It will load before the kettle boils.',
            'Ruth looks at the napkin for a long time. "It\'s very plain," she says. Then, grudgingly: "It looks like a church bulletin. People trust a church bulletin."',
          ],
          next: 'directory',
        },
        only_mine: {
          speaker: 'narrator',
          text: [
            'You hand-code a beautiful, elegant page. It renders perfectly on exactly one computer in Port Lumen: yours.',
            'On Ruth\'s machine it is a blank white screen with the word "undefined" in the corner. On Mrs. Castellano\'s machine it is somehow entirely in italics. You give up at one in the morning and use the free page builder like everybody else.',
          ],
          next: 'directory',
        },
        democracy: {
          speaker: 'narrator',
          text: [
            'You run the meeting like a town hall. Every decision goes to a show of hands. Tommy Castellano, nine, is allowed to vote on the font, and chooses well.',
            'Against every law of committees, it works. The site comes out orange, friendly, and coherent. Ruth calls it "our website" four times before you\'ve built it.',
          ],
          next: 'directory',
        },
        chaos: {
          speaker: 'narrator',
          text: [
            'Democracy is a beautiful idea. By ten o\'clock the committee has voted for eleven background colors, three fonts, a looping recording of "Blue Moon" played on a church organ, and Modem the cat as the official logo.',
            'Kim puts her head down on the table. Ruth declares it the most beautiful website on the Sound. It is the ugliest thing you have ever made. The Row will love it with its whole heart.',
          ],
          next: 'directory',
        },
        builder: {
          speaker: 'narrator',
          text: [
            'HomeSteader gives you a template called "Cozy Hearth," a guestbook, a hit counter, and a banner ad for discount cruises that you cannot remove without paying.',
            'The committee admires the hit counter the way their grandparents admired the first television on the block.',
          ],
          next: 'directory',
        },
        kim_builds: {
          speaker: 'kim',
          text: [
            {
              if: kimShady,
              text: '"Fine." She has a laptop out before you finish the sentence, and it is a much better laptop than a student should own. "Give me till Sunday. Don\'t look at the source."',
              else: '"Fine." But she is already sketching on the back of Ruth\'s printout, fast and neat. "Give me till Sunday. And I\'m putting my name in the footer, because I\'m applying to things."',
            },
          ],
          next: 'directory',
        },
        directory: {
          speaker: 'grandma_ruth',
          text: [
            '"Now," says Ruth. "The directory."',
            {
              if: MET_MARGE,
              text: 'Marge taps her pen on the table. "Names, numbers, birthdays," she says. "On the old party lines everybody knew everybody. That was the whole point."',
              else: '"Everybody\'s name and number and birthday," Ruth says. "So when Mrs. Castellano\'s cat goes missing, the whole Row can call the whole Row."',
            },
          ],
          choices: directoryChoices,
        },
        no_directory: {
          speaker: 'narrator',
          text: [
            'There is some grumbling. Mrs. Castellano asks how anybody will know Modem\'s birthday.',
            {
              if: MET_MARGE,
              text: 'Then Marge Osgood laughs, one short bark. "The kid\'s right," she says. "We had a rule on the party line: you never say your own number on the party line. Anybody could be listening. Somebody always was."',
              else: 'Then Mr. Pruszynski, who has not said a word all evening, clears his throat. "Kid\'s right. You don\'t write your number on a wall. You don\'t know who reads walls."',
            },
          ],
          next: 'wrap_up',
        },
        locked: {
          speaker: 'narrator',
          text: [
            'You put the directory behind a members\' password and give it out at the meeting on slips of paper, with a speech about not writing it down anywhere. Everyone writes it down immediately, on the same slip of paper you gave them. It is, still, a good deal better than nothing.',
          ],
          next: 'wrap_up',
        },
        password: {
          speaker: 'narrator',
          text: [
            'You put the directory behind a password. The password, after a vote, is "cathode."',
            'Ruth, trying to be helpful, types it onto the front page of the site in bold so members won\'t forget it. You find this out on Sunday. It is still there. By then the hit counter has gone up by three hundred, and not one of those visitors is from the Row.',
          ],
          next: 'wrap_up',
        },
        wrap_up: {
          speaker: 'grandma_ruth',
          effects: [planDone, { faction: 'fac.hood', add: 2 }],
          text: [
            '"Then it\'s settled." Ruth bangs a spoon on the table in place of a gavel. "Meeting adjourned. Webmaster, you have until Sunday."',
            'Everyone applauds you. Nobody has asked if you have plans on Sunday. You didn\'t, until now.',
          ],
        },
      },
    },
    {
      id: 'hood_web_launch',
      channel: 'mail',
      title: 'WE ARE ON THE INTERNET!!!',
      from: 'grandma_ruth',
      start: 'letter',
      nodes: {
        letter: {
          effects: [{ flag: 'fac.hood.row_website' }, { faction: 'fac.hood', add: 5 }],
          text: [
            'Dear {name},',
            'WE ARE ON THE INTERNET. I told the choir to "go on the internet and look at us" and Father\'s housekeeper did it and cried. We have forty-seven visitors on the counter! I check it every morning with my coffee. Some of them are me.',
            'I am so proud of the guestbook. Look at all the people saying hello:',
            [
              '  "Sal was here. Pie is good. — Sal"',
              '  "Is this where you put the recipes? I have put the recipe. — R. Alvarez"',
              '  "MODEM COME HOME. — the Castellanos"',
            ].join('\n'),
            { if: DAD_RETRAINED, text: '  "PC DOCTOR. House calls. Reasonable rates. See card. — R. Tan"' },
            { if: MET_MARGE, text: '  "This is a party line. Mind what you say on it. — M.O."' },
            { if: KIM_CLOSE, text: '  "first" — Kim' },
            '  "Nice site!!! Visit my site for FREE PRIZES and a GIFT CARD!!!"',
            'Isn\'t that last one nice? A total stranger. I haven\'t clicked it yet because I wanted to ask you first, you are always telling me that.',
            'Love, Ruth Alvarez\nChair, Cannery Row Neighborhood Association\nwww.canneryrow-online.org (you can click it!)',
          ],
          choices: [
            {
              text: '"Please, please don\'t click that last one, Ruth. I\'ll delete it tonight."',
              effects: [{ npc: 'grandma_ruth', affinity: 2 }, { xp: 'opsec', add: 10 }],
              goto: 'reply_prize',
            },
            {
              text: '"Congratulations, Madam Chair. Forty-seven is a lot of visitors."',
              effects: [{ npc: 'grandma_ruth', affinity: 3 }],
              goto: 'reply_proud',
            },
          ],
        },
        reply_prize: {
          text: [
            'Oh, all right. You are no fun, and you are right.',
            'I have won so many prizes, {name}. I have never once received a prize.',
            'Ruth',
          ],
        },
        reply_proud: {
          text: [
            'Forty-eight now! I checked while I was writing this. That one was me too.',
            'Ruth',
          ],
        },
      },
    },
    {
      id: 'hood_web_broker',
      channel: 'mail',
      title: 'A Community Sponsorship Opportunity for canneryrow-online.org',
      from: 'ClearHarbor Data Partners',
      expiresDays: 10,
      onExpire: [answered, { log: 'The ClearHarbor offer lapsed. The Row\'s site stays as it is.', kind: 'info' }],
      start: 'offer',
      nodes: {
        offer: {
          text: [
            'Dear Webmaster,',
            'Congratulations on the launch of canneryrow-online.org! At ClearHarbor Data Partners, we believe every neighborhood deserves a first-class online home.',
            {
              if: { any: [{ flag: 'fac.hood.web_directory' }, { flag: 'fac.hood.web_directory_locked' }] },
              text: 'Through our Community Sponsorship Program, we would be pleased to offer your association premium hosting at no cost, a professional redesign, and a one-time Community Grant of $1,500. In return, we ask only for anonymized engagement data from your guestbook and member directory, used solely to help local businesses better understand the neighborhoods they serve.',
              else: 'Through our Community Sponsorship Program, we would be pleased to offer your association premium hosting at no cost and a one-time Community Grant of $600. In return, we ask only for anonymized engagement data from your guestbook and visitor logs, used solely to help local businesses better understand the neighborhoods they serve.',
            },
            'Simply reply to accept. We look forward to growing together.',
            'Warm regards,\nDenise Achterberg\nCommunity Partnerships Lead\nClearHarbor Data Partners · Millgate · "Insight Is a Neighborhood"',
          ],
          choices: [
            {
              if: { any: [{ flag: 'fac.hood.web_directory' }, { flag: 'fac.hood.web_directory_locked' }] },
              text: 'Accept. Fifteen hundred dollars is a lot of pie, and "anonymized" is right there in the letter.',
              tag: '[Take $1,500]',
              effects: [{ money: 1500 }, { var: 'w.enclosure', add: 1 }, { flag: 'fac.hood.sold_guestbook' }, answered],
              goto: 'welcome',
            },
            {
              if: { not: { any: [{ flag: 'fac.hood.web_directory' }, { flag: 'fac.hood.web_directory_locked' }] } },
              text: 'Accept. It\'s only the guestbook, and six hundred dollars buys the Association a new coffee urn.',
              tag: '[Take $600]',
              effects: [{ money: 600 }, { var: 'w.enclosure', add: 1 }, { flag: 'fac.hood.sold_guestbook' }, answered],
              goto: 'welcome',
            },
            {
              text: 'Decline. Politely. The Row isn\'t a data set.',
              effects: [{ faction: 'fac.hood', add: 3 }, answered],
              goto: 'declined',
            },
            {
              text: 'Decline, then scrub the site properly: the directory comes down, the logs get shredded, the guestbook stops keeping email addresses.',
              check: {
                skill: 'opsec',
                dc: 14,
                success: 'scrubbed',
                fail: 'scraped',
                successEffects: [{ faction: 'fac.hood', add: 6 }, { flag: 'fac.hood.web_scrubbed' }, { npc: 'dialtone', affinity: 3 }, answered],
                failEffects: [{ faction: 'fac.hood', add: 2 }, { flag: 'fac.hood.web_scraped' }, answered],
              },
            },
            {
              if: { not: { flag: 'fac.hood.web_traced' } },
              text: 'Before you answer: find out where ClearHarbor\'s mail actually comes from.',
              check: {
                skill: 'networking',
                dc: 15,
                success: 'traced',
                fail: 'bounced',
                successEffects: [{ flag: 'fac.hood.web_traced' }],
                failEffects: [{ flag: 'fac.hood.web_traced' }, { stat: 'heat', add: 4 }, { stat: 'stress', add: 3 }, { chance: 0.3, then: [{ complication: 'hack' }] }],
              },
            },
          ],
        },
        traced: {
          text: [
            {
              if: { flag: 'a1.grandma_done' },
              text: 'The headers are clean, professional, and lying. Three hops back, under the polish, the mail comes out of a Millgate address block you have seen once before: in 2001, on Ruth Alvarez\'s PC, phoning home every night at 3:12 a.m.',
              else: 'The headers are clean, professional, and lying. Three hops back, under the polish, the mail comes out of an address block in Millgate that belongs to a data company nobody on the Row has ever heard of, which is exactly how that kind of company likes it.',
            },
            'The offer is still sitting there, warm and reasonable, waiting for your answer.',
          ],
          choices: [
            {
              text: 'Answer it.',
              goto: 'offer_again',
            },
          ],
        },
        bounced: {
          text: [
            'The trail runs into a mail relay in some other country that answers every question with a cheerful error message. Whoever ClearHarbor is, they are paying somebody good to not be found by somebody like you.',
            'An hour later your own connection hiccups, twice, in a rhythm that isn\'t NorthLink\'s. Somebody on the other end of that relay just looked back.',
            'The offer is still sitting there, waiting for your answer.',
          ],
          choices: [
            {
              text: 'Answer it.',
              goto: 'offer_again',
            },
          ],
        },
        offer_again: {
          text: 'We look forward to growing together. — ClearHarbor Data Partners',
          choices: [
            {
              if: { any: [{ flag: 'fac.hood.web_directory' }, { flag: 'fac.hood.web_directory_locked' }] },
              text: 'Accept anyway. The money is real, and so is the coffee urn.',
              tag: '[Take $1,500]',
              effects: [{ money: 1500 }, { var: 'w.enclosure', add: 1 }, { flag: 'fac.hood.sold_guestbook' }, answered],
              goto: 'welcome',
            },
            {
              if: { not: { any: [{ flag: 'fac.hood.web_directory' }, { flag: 'fac.hood.web_directory_locked' }] } },
              text: 'Accept anyway. It\'s only a guestbook.',
              tag: '[Take $600]',
              effects: [{ money: 600 }, { var: 'w.enclosure', add: 1 }, { flag: 'fac.hood.sold_guestbook' }, answered],
              goto: 'welcome',
            },
            {
              text: 'Decline. The Row isn\'t a data set.',
              effects: [{ faction: 'fac.hood', add: 3 }, answered],
              goto: 'declined',
            },
            {
              text: 'Decline, and scrub the site so there\'s nothing left to sell.',
              check: {
                skill: 'opsec',
                dc: 14,
                success: 'scrubbed',
                fail: 'scraped',
                successEffects: [{ faction: 'fac.hood', add: 6 }, { flag: 'fac.hood.web_scrubbed' }, { npc: 'dialtone', affinity: 3 }, answered],
                failEffects: [{ faction: 'fac.hood', add: 2 }, { flag: 'fac.hood.web_scraped' }, answered],
              },
            },
          ],
        },
        welcome: {
          speaker: 'ClearHarbor Data Partners',
          text: [
            'Welcome to the ClearHarbor family! Your Community Grant has been issued. Our team will be in touch about the transition of your data assets.',
            'This is an automated message. Replies to this address are not monitored.',
          ],
        },
        declined: {
          speaker: 'ClearHarbor Data Partners',
          text: 'We understand completely, and our offer remains open should your association\'s needs change. This is an automated message. Replies to this address are not monitored.',
        },
        scrubbed: {
          speaker: 'narrator',
          text: [
            'You take the site apart and put it back together with nothing worth stealing in it. No directory. No stored addresses. The logs go into the digital equivalent of a shredder and then the digital equivalent of a fire.',
            {
              if: MET_MARGE,
              text: 'Marge Osgood reads your explanation at the next meeting, nods once, and moves the phone tree back to paper: a mimeographed sheet, hand-delivered. "Some things," she says, "you keep off the wire."',
              else: 'At the next meeting you explain why the directory is gone. Ruth moves the phone tree back to paper, a mimeographed sheet, hand-delivered, and nobody complains, because everybody likes getting mail.',
            },
          ],
        },
        scraped: {
          speaker: 'narrator',
          text: [
            'You scrub the site clean: the directory, the logs, the stored addresses. Then, a week later, you find ClearHarbor\'s crawler in the old access logs you forgot to shred. It visited every page, every night, starting the day the site went up.',
            'Whatever was there, they already have it. The Row\'s site is clean now. It just wasn\'t clean in time.',
          ],
        },
      },
    },
    {
      id: 'hood_web_fallout',
      channel: 'mail',
      title: 'strange phone calls',
      from: 'grandma_ruth',
      start: 'letter',
      nodes: {
        letter: {
          text: [
            'Dear {name},',
            'Something funny is happening and I don\'t know who else to ask.',
            'A very polite young man from an insurance company called to wish me a happy birthday. It was my birthday! Then he offered me a policy "for people in your situation." I asked him what my situation was. He knew. He knew about my hip and he knew Arturo passed and he knew I live alone.',
            'Mrs. Castellano got a call too. So did the Pruszynskis. Mr. Pruszynski\'s caller knew the name of his dog.',
            { if: { not: { flag: 'fac.hood.sold_guestbook' } }, text: 'A man from a "home security company" came to the Oduyas\' door and knew both of the twins\' birthdays. Their birthdays are in the directory. I put them there myself.' },
            'Is it the website? You would tell me if it was the website.',
            'Ruth',
          ],
          choices: [
            {
              if: { flag: 'fac.hood.sold_guestbook' },
              text: 'Tell her the truth. You sold the guestbook to ClearHarbor.',
              effects: [{ npc: 'grandma_ruth', affinity: -8 }, { faction: 'fac.hood', add: 4 }, { flag: 'fac.hood.web_confessed' }],
              goto: 'truth',
            },
            {
              if: { not: { flag: 'fac.hood.sold_guestbook' } },
              text: 'Tell her the truth. The directory was never locked well enough, and somebody walked off with all of it. That was your job.',
              effects: [{ npc: 'grandma_ruth', affinity: -3 }, { faction: 'fac.hood', add: 2 }, { flag: 'fac.hood.web_confessed' }],
              goto: 'truth_leak',
            },
            {
              text: '"I\'ll look into it, Ruth. Don\'t give anybody your details on the phone."',
              effects: [{ npc: 'grandma_ruth', affinity: -2 }],
              goto: 'lie',
            },
          ],
        },
        truth_leak: {
          text: [
            'Thank you for telling me. I know whose idea the password on the front page was, and it was not yours. I am old, not stupid.',
            'But you are the Webmaster, and a Webmaster is like a lifeguard. It isn\'t your fault somebody drowned. It is your job that they didn\'t.',
            'Take the directory down, please. We\'ll go back to the phone tree. I will be calling everyone on it personally to tell them not to answer strangers, which will take me until Easter.',
            'Ruth',
          ],
        },
        truth: {
          text: [
            'Thank you for telling me. That can\'t have been easy to write.',
            'I have been alive a long time, {name}. I know people do things for money. I only thought it would be somebody else who did them to us.',
            'Take it down, please. We\'ll go back to the phone tree. At least on the phone tree you can hear who\'s breathing.',
            'Ruth',
          ],
        },
        lie: {
          text: [
            'You\'re a good kid. I knew it wouldn\'t be you.',
            'Ruth',
          ],
        },
      },
    },

    // ── The science fair ───────────────────────────────────────────────────
    {
      id: 'hood_fair_ask',
      channel: 'chat',
      title: 'kim',
      from: 'kim',
      expiresDays: 3,
      onExpire: [{ npc: 'kim', affinity: -3 }, { quest: 'fac_hood_kims_science_fair', fail: true }],
      start: 'ping',
      nodes: {
        ping: {
          text: [
            'ok so dont laugh',
            'im running the youth science fair at the community center. its for my service hours. dont ask',
            { if: { npc: 'rosa', fate: 'treated' }, text: 'rosa is my deputy. she has a clipboard. she is drunk with power' },
            'i need a judge who knows computers and isnt a felon',
            '...allegedly',
            'saturday 10am. please. there is a potato battery situation developing',
          ],
          choices: [
            {
              text: 'im in. what is a potato battery situation',
              effects: [{ flag: 'fac.hood.fair_yes' }, { npc: 'kim', affinity: 3 }, { scene: 'hood_fair_day', delayHours: 48 }],
              goto: 'yes',
            },
            {
              text: 'cant this weekend kim. sorry',
              effects: [{ npc: 'kim', affinity: -4 }, { quest: 'fac_hood_kims_science_fair', fail: true }],
              goto: 'no',
            },
          ],
        },
        yes: { text: 'ur the best. wear a shirt with buttons. the judges table has a tablecloth' },
        no: { text: 'k. ill ask mr halvorsen. he owns a calculator' },
      },
    },
    {
      id: 'hood_fair_day',
      channel: 'dialog',
      title: 'The Science Fair',
      start: 'gym',
      nodes: {
        gym: {
          speaker: 'narrator',
          text: [
            'The Cannery Row Community Center gym: basketball lines on the floor, a smell of floor wax and nervous children, and twenty-three folding tables of science.',
            'You tour the aisles with a clipboard. "Is Pie a Liquid?" (Tommy Castellano, 9), which has a very persuasive pie. "My Dog Can Count" (Priscilla Nwosu, 10). The dog cannot count. The dog is having the best day of its life anyway. "The Potato Battery Pager" (the Oduya twins, 11), a pager wired to forty potatoes, which does not work, and which the twins are currently plugging into the wall "to charge it faster."',
            { if: salsCathode, text: 'The pie, it turns out, was donated by Sal, who is standing at the back with his arms folded, prepared to defend its honor.' },
          ],
          next: 'kim',
        },
        kim: {
          speaker: 'kim',
          text: [
            {
              if: { npc: 'rosa', fate: 'treated' },
              text: '"Okay. Rosa has the timetable. Don\'t argue with Rosa. Nobody argues with Rosa." Rosa Ferreira, twelve, waves her clipboard at you like a riot baton.',
              else: '"Okay. Judges go at eleven. Three prizes. The trophies are bowling trophies with the bowling guy snapped off. Don\'t tell anyone."',
            },
            '"And whatever you do, don\'t let the Oduya twins near the—"',
          ],
          next: 'blackout',
        },
        blackout: {
          speaker: 'narrator',
          text: [
            'There is a pop, a smell of hot potato, and every light in the gym goes out.',
            'Twenty-three children scream in delight. Somewhere in the dark, a dog barks exactly four times, which several people will later cite as proof that it can count.',
          ],
          choices: [
            {
              text: 'Find the breaker panel by feel and get the lights back on.',
              check: {
                skill: 'hardware',
                dc: 13,
                bonuses: [{ if: { background: 'tinkerer' }, add: 2, label: 'Basement tinkerer' }],
                success: 'lights',
                fail: 'zap',
                failEffects: [{ stat: 'health', add: -5 }, { stat: 'energy', add: -10 }, { chance: 0.3, then: [{ complication: 'health' }] }],
              },
            },
            {
              text: '"Everybody get out your flashlights! This is now Science By Flashlight!"',
              check: {
                skill: 'social',
                dc: 13,
                bonuses: [{ if: { background: 'class_clown' }, add: 2, label: 'Class clown' }],
                success: 'flashlight',
                fail: 'kim_saves',
                failEffects: [{ faction: 'fac.hood', add: -2 }, { stat: 'mood', add: -4 }, { stat: 'stress', add: 3 }],
              },
            },
            {
              if: kimBright,
              text: 'Look at your sister. She\'s already moving. Let Kim handle it.',
              effects: [{ npc: 'kim', affinity: 4 }],
              goto: 'kim_handles',
            },
            {
              if: kimShady,
              text: 'Look at your sister. She\'s already at the wall, prying open a panel she shouldn\'t know how to open.',
              effects: [{ npc: 'kim', affinity: 2 }],
              goto: 'kim_panel',
            },
          ],
        },
        lights: {
          speaker: 'narrator',
          text: [
            'The panel is behind the stage curtain, labeled in someone\'s handwriting from 1974. You find the tripped breaker, unplug forty potatoes, and flip it back. The lights come up to applause. The Oduya twins look at you with the naked respect of people who have just watched someone undo their crimes.',
          ],
          effects: [{ faction: 'fac.hood', add: 2 }],
          next: 'judging',
        },
        zap: {
          speaker: 'narrator',
          text: [
            'You find the panel. You find the breaker. You also find, with your elbow, a wire that is not supposed to be there, and for one long second you understand electricity on a spiritual level.',
            'The lights come back on. You are lying on the stage. Kim leans over you. "Ladies and gentlemen," she announces to the gym, "the family genius. Still twitching." Everyone applauds, including you, involuntarily.',
          ],
          effects: [{ stat: 'health', add: -5 }, { faction: 'fac.hood', add: 2 }, { npc: 'kim', affinity: 2 }],
          next: 'judging',
        },
        flashlight: {
          speaker: 'narrator',
          text: [
            'Somebody\'s dad has a flashlight. Somebody\'s grandmother has two. Within five minutes every project in the gym is lit from below like a ghost story, and every kid presents in a spooky voice without being asked.',
            '"Is Pie a Liquid?" by flashlight is one of the most haunting things you have ever seen. Twenty minutes later the janitor finds the breaker, and several children ask if they can turn the lights back off.',
          ],
          effects: [{ faction: 'fac.hood', add: 4 }],
          next: 'judging',
        },
        kim_saves: {
          speaker: 'narrator',
          text: [
            'You announce Science By Flashlight. A nine-year-old bursts into tears. Two more join in, in harmony.',
            'Kim sighs, takes the clipboard out of your hands, and restores order in ninety seconds with a combination of threats, bribes and a working knowledge of every child\'s mother. By the time the janitor finds the breaker, the kids are lined up by table number. She doesn\'t even look at you. She doesn\'t have to.',
            'Two of the crying children\'s mothers do look at you, for the rest of the afternoon, the way the Row looks at someone it will be discussing after church.',
          ],
          effects: [{ npc: 'kim', affinity: 3 }],
          next: 'judging',
        },
        kim_handles: {
          speaker: 'narrator',
          text: [
            'Kim is already moving: two teenagers sent to the doors, the twins unplugged, the janitor paged, a parent with a flashlight posted at every aisle. She does it without raising her voice.',
            'When the lights come back she\'s at the front of the gym with the clipboard like nothing happened. You watch her and think, not for the first time, that she\'s going to be all right. More than all right.',
          ],
          effects: [{ faction: 'fac.hood', add: 2 }],
          next: 'judging',
        },
        kim_panel: {
          speaker: 'narrator',
          text: [
            'Kim has the maintenance panel open in about four seconds, with a bobby pin, in the dark. She finds the right breaker without looking at the labels. The lights come up.',
            'She catches you watching her and shrugs. "What? Buildings are just computers with plumbing." She says it the way you used to say things, at her age. You are not sure how you feel about that.',
          ],
          effects: [{ faction: 'fac.hood', add: 2 }],
          next: 'judging',
        },
        judging: {
          speaker: 'narrator',
          text: [
            'Eleven o\'clock. Three finalists. You, Mr. Halvorsen from the cannery office (who does own a calculator) and a retired biology teacher named Mrs. Deakins who has brought her own magnifying glass.',
            '"Is Pie a Liquid?" The crowd favorite. The pie was eaten during the blackout, which the judges agree is a kind of data.',
            '"My Dog Can Count." The dog is asleep. Its counting career is over.',
            '"WHO IS LISTENING TO CANNERY ROW?" (Danny Ruiz, 12). A secondhand radio scanner, an antenna made of coat hangers, and six months of notebooks. Danny has logged every signal on the Row: cordless phones, baby monitors, the pager tower, a cab company. And at the bottom of his chart, circled in red, one strong burst of something, every single night, at 3:12 a.m., from the direction of the old mill.',
          ],
          choices: [
            {
              text: 'Look closer at Danny\'s chart.',
              req: { skill: 'networking', gte: 30 },
              reqText: 'Requires Networking 30',
              goto: 'closer',
            },
            ...prizeChoices,
          ],
        },
        closer: {
          speaker: 'narrator',
          text: [
            'You crouch next to the chart. It isn\'t noise. It\'s too regular for noise: the same length, the same minute, a data burst from the mill, which has not been a mill for a long time.',
            {
              if: { flag: 'a1.grandma_done' },
              text: 'Three twelve in the morning. You have seen that time before, in 2001, on Ruth Alvarez\'s PC, when a "you\'ve won a prize" program phoned home every night to Millgate. Same minute. Different decade. The same habit, grown up and moved into a bigger building.',
              else: 'Somebody, somewhere, has a schedule. Every night at 3:12 a.m. the old mill talks to somebody. Danny Ruiz, twelve, is the only person on the Row who has been listening.',
            },
            'Danny is watching your face. "Is it good?" he asks. "Is it real science?"',
          ],
          effects: [{ flag: 'fac.hood.heard_the_hum' }],
          choices: prizeChoices,
        },
        danny_wins: {
          speaker: 'narrator',
          text: [
            'You stand up in front of the whole gym and say it: this is real science. Six months of notebooks. A hypothesis, a method, data, and a question nobody else thought to ask.',
            'Danny Ruiz receives a bowling trophy with the bowling guy snapped off. He holds it like it is the biggest trophy in the world. His mother takes eleven photographs.',
          ],
          next: 'wrap',
        },
        danny_warned: {
          speaker: 'narrator',
          text: [
            'First prize to Danny Ruiz, and he holds the bowling trophy like it is made of gold.',
            'Afterwards you find him by the bleachers. "Your project\'s brilliant," you tell him. "Do me a favor. Stop pointing the antenna at the mill after dark. Point it at the sky. There\'s cool stuff in the sky." He asks why. You tell him that some people don\'t like being listened to, and that those people are usually the ones worth listening to, and that he should be older before he finds out which.',
            'When you turn around, Kim is watching you from across the gym. She doesn\'t ask. She files it.',
          ],
          next: 'wrap',
        },
        pie_wins: {
          speaker: 'narrator',
          text: [
            'First prize: "Is Pie a Liquid?" The gym erupts. Tommy Castellano is carried around the gym on his uncle\'s shoulders, holding the empty pie plate over his head.',
            { if: salsCathode, text: 'Sal, at the back, would like it known that he had nothing to do with it, and would like the pie plate back.' },
            'Danny Ruiz packs up his notebooks without a word. On the way out you stop him and tell him his was the best project in the room, and that you mean it. He nods like he\'s heard adults say that before. Maybe he has.',
          ],
          next: 'wrap',
        },
        wrap: {
          speaker: 'kim',
          effects: [{ flag: 'fac.hood.fair_done' }, { npc: 'kim', affinity: 6 }, { stat: 'mood', add: 8 }],
          text: [
            'Four o\'clock, folding chairs stacked, floor swept, one potato unaccounted for.',
            {
              if: kimShady,
              text: '"Not bad," Kim says, which from her is a parade. Then, not looking at you: "The kid with the scanner. The mill thing. You looked at it like it was real." She waits. You don\'t say anything. "Yeah," she says. "That\'s what I thought."',
              else: '"Thanks," Kim says, and then, because she is Kim: "You were adequate." She bumps your shoulder with hers on the way to the door, which she has not done since she was fourteen.',
            },
          ],
        },
      },
    },
  ],

  triggers: [
    {
      // Nobody sold the directory, but it got out anyway.
      id: 'trig_hood_web_leak',
      when: leakedAnyway,
      atHour: 10,
      chance: 1 / 25,
      effects: [{ faction: 'fac.hood', add: -4 }, { scene: 'hood_web_fallout' }],
    },
    {
      id: 'trig_hood_web_fallout',
      when: { flag: 'fac.hood.sold_guestbook' },
      atHour: 10,
      chance: 1 / 20,
      effects: [{ faction: 'fac.hood', add: -6 }, { scene: 'hood_web_fallout' }],
    },
  ],
})
