/**
 * PKG-13 — `side_dee_for_council` (bible §8 #38, Neighborhood · Messenger/Forum · Act IIa).
 *
 * You told Dee Briggs she should run for city council (`npc.dee.encouraged`, planted in
 * `a1_compcastle` / `side_press_any_key`). She did. Now she needs a website, a phone bank, and a
 * campaign manager who knows what a guestbook is. Pure IIa comedy — and it pays off years later as
 * the swing vote on the MNSA (`main_a3_q7` reads `npc.dee.council` + Dee's affinity).
 *
 * The campaign tallies a private var, `side.dee_votes`, from each beat; election night reads it,
 * with a recount check for a close race. Winning sets `npc.dee.council` (idempotent; shared with
 * PKG-15's `trig_dee_council`, which is the no-campaign path) and publishes `news.dee_council`.
 *
 * Sets: `npc.dee.council`, `npc.dee` fate `councilwoman` + affinity, var `side.dee_votes`,
 *       flags `side.dee_campaign.*` (stage latches), `fac.hood(+)`.
 * Reads: `npc.dee.encouraged`, `fac.hood`, Dee affinity, `npc.sal` met, background/traits.
 * Cross-package: news `dee_council` (PKG-16).
 *
 * Hacking is fiction: the website, the guestbook and the phone rig are abstract game flavor.
 */
import { defineContent } from '@/engine/registry'
import type { Effect, QuestDef, SceneDef } from '@/engine/types'

const votes = (n: number): Effect => ({ var: 'side.dee_votes', add: n })

const quest: QuestDef = {
  id: 'side_dee_for_council',
  title: 'Dee Briggs for Ward 3',
  kind: 'side',
  act: 2,
  giver: 'dee',
  priority: 7,
  autoStart: {
    all: [
      { var: 'act', eq: 2 },
      { flag: 'npc.dee.encouraged' },
      { day: true, gte: 300 },
      { not: { flag: 'npc.dee.council' } },
    ],
  },
  rewards: 'A councilwoman who owes you one · Neighborhood standing',
  summary: [
    'You told Dolores "Dee" Briggs she should run for city council. You were being nice. Dee does not hear "nice." Dee hears "mandate."',
    'She has filed. She has a platform: potholes, library hours, and computer literacy for every grandmother on the Row. What she does not have is a website, a phone bank, or any idea what a guestbook is. That is where you come in.',
  ],
  start: 'filing',
  stages: {
    filing: {
      text: 'Dee filed her papers for the Ward 3 council seat, and she has named you her Director of Internet. Answer her page.',
      hint: 'Dee is messaging you on BuddyPager. Say yes (or don\'t).',
      onEnter: [{ scene: 'dee_council_filing' }],
      objectives: [
        {
          id: 'joined',
          text: 'Answer Dee\'s page about the campaign',
          when: { flag: 'side.dee_campaign.joined' },
          hint: 'Open the BuddyPager window and reply to Dee.',
        },
      ],
      next: 'website',
    },
    website: {
      text: 'Dee needs a campaign homepage by Friday. She has opinions about fonts. She has opinions about music. God help you, she has discovered animated GIFs.',
      hint: 'Dee sends her website demands by BuddyPager. Programming, Business or just giving her what she wants all build a site — each helps in its own way.',
      onEnter: [{ scene: 'dee_council_site', delayHours: 20 }],
      objectives: [
        {
          id: 'site',
          text: 'Build BRIGGS FOR WARD 3 (the website)',
          when: { flag: 'side.dee_campaign.site' },
          hint: 'Answer Dee\'s site-building chat.',
        },
      ],
      next: 'rally',
    },
    rally: {
      text: 'The site is live, the guestbook has a troll, and Dee wants a phone bank in the Cathode\'s back booth. Every call counts; Ward 3 turns out about eleven people per pothole.',
      hint: 'Deal with the guestbook thread on the forum, then run the phone bank at the Cathode. Social, Business, Opsec and Networking all have a role.',
      onEnter: [
        { scene: 'dee_council_guestbook', delayHours: 30 },
        { scene: 'dee_council_phonebank', delayHours: 96 },
      ],
      objectives: [
        {
          id: 'guestbook',
          text: 'Deal with the guestbook troll',
          when: { flag: 'side.dee_campaign.guestbook' },
          hint: 'A forum thread about Dee\'s site appears on the general board. Reply to it.',
        },
        {
          id: 'phones',
          text: 'Run the phone bank at the Cathode',
          when: { flag: 'side.dee_campaign.phones' },
          hint: 'The phone bank is a dialog at the Cathode a few days after the site goes up.',
        },
      ],
      next: 'election',
    },
    election: {
      text: 'Election night. The Cathode has a radio, a pot of coffee, and Dee in a blazer she bought for the occasion. Go watch the numbers come in.',
      hint: 'The election-night dialog arrives on its own. If it\'s close, there may be a recount to fight.',
      onEnter: [{ scene: 'dee_council_election', delayHours: 72 }],
      objectives: [
        {
          id: 'result',
          text: 'Be there when Ward 3 reports',
          when: { flag: 'side.dee_campaign.result' },
          hint: 'Play the election-night dialog through.',
        },
      ],
      next: [{ if: { flag: 'npc.dee.council' }, stage: 'won' }, { stage: 'lost' }],
    },
    won: {
      text: 'Councilwoman Dolores Briggs. Ward 3. By eleven votes. She framed the recount. You are, officially, in politics.',
      objectives: [
        {
          id: 'sworn',
          text: 'Watch Dee get sworn in',
          when: { flag: 'npc.dee.council' },
          hint: 'Nothing left to do. She did it.',
        },
      ],
    },
    lost: {
      text: 'Dee lost by eleven votes. She has already bought a calendar for the next cycle and circled the filing deadline in red.',
      outcome: 'failed',
      objectives: [
        {
          id: 'next_time',
          text: 'Next cycle',
          when: { always: true },
          hint: 'The campaign is over — for now. Dee is not a woman who stays lost.',
        },
      ],
    },
  },
}

// ── The page: Dee has filed ─────────────────────────────────────────────────

const filing: SceneDef = {
  id: 'dee_council_filing',
  channel: 'chat',
  title: 'Dee Briggs',
  from: 'dee',
  start: 'm1',
  nodes: {
    m1: {
      speaker: 'dee',
      text: [
        'Hello it is Dee. This is my BuddyPager. My niece installed it. It keeps making a door noise.',
        'I DID IT. I filed. $50 filing fee and two hundred signatures. Ward 3. I got ninety of the signatures at the laundromat. People will sign anything while they wait for a dryer.',
        'I am running against Harlan Fitch. He has been councilman for twenty years. His slogan is FITCH GETS IT DONE. Nobody knows what "it" is. I asked. HE doesn\'t know.',
        'You are my Director of Internet. That is not a question. - Dee',
      ],
      choices: [
        {
          text: '"Director of Internet reporting for duty. What do you need?"',
          effects: [{ npc: 'dee', affinity: 5 }, { flag: 'side.dee_campaign.joined' }],
          goto: 'yes',
        },
        {
          text: '"Dee. I was kind of joking when I said you should run."',
          goto: 'joking',
        },
        {
          text: '"I can\'t, Dee. Too much going on. I\'m sorry."',
          tag: '[Decline]',
          goto: 'decline',
        },
      ],
    },
    yes: {
      speaker: 'dee',
      text: [
        'EXCELLENT. I need a website. With a guestbook. Harlan doesn\'t have a website. Harlan has a FAX number.',
        'I will send you my ideas. I have been writing them on the backs of return slips. There are a lot of them. - Dee',
      ],
    },
    joking: {
      speaker: 'dee',
      text: [
        'I know you were joking.',
        'I have been joking my whole life, sweetheart. I joke to customers. I joke to managers. Then one day a kid I taught to label cables looks at me and says a joking thing like they mean it, and I thought, well why not ME.',
        'So. Director of Internet. Yes or yes. - Dee',
      ],
      choices: [
        {
          text: '"...Yes. Obviously yes."',
          effects: [{ npc: 'dee', affinity: 7 }, { flag: 'side.dee_campaign.joined' }],
          goto: 'yes',
        },
        {
          text: '"I really can\'t, Dee."',
          tag: '[Decline]',
          goto: 'decline',
        },
      ],
    },
    decline: {
      speaker: 'dee',
      text: [
        'Oh.',
        'No, that\'s fine. That\'s FINE. You\'re busy. Young people are busy. I will learn the HTML myself. I have a library card.',
        'Still running though. You don\'t get to un-say it. - Dee',
      ],
      effects: [
        { npc: 'dee', affinity: -4 },
        { flag: 'side.dee_campaign.joined' },
        { log: 'You passed on Dee\'s campaign. She is running anyway, armed with a library card and fury.', kind: 'story' },
        { quest: 'side_dee_for_council', fail: true },
      ],
    },
  },
}

// ── The website ─────────────────────────────────────────────────────────────

const site: SceneDef = {
  id: 'dee_council_site',
  channel: 'chat',
  title: 'Dee Briggs',
  from: 'dee',
  start: 'm1',
  nodes: {
    m1: {
      speaker: 'dee',
      text: [
        'WEBSITE IDEAS (from return slips):',
        '1. My picture. The good one, from the CompCastle Employee of the Month wall.',
        '2. Music that plays by itself. Something patriotic but also fun.',
        '3. The words BRIGGS FOR WARD 3 on FIRE. Can you make words be on fire.',
        '4. A counter that says how many people visited. I want it to start at a big number so people think it is popular.',
        '5. Potholes, library hours, computer literacy for grandmas. Somewhere. Probably at the bottom. - Dee',
      ],
      choices: [
        {
          text: '[Programming] Build it clean and fast — it has to load on the Row\'s old 28.8 modems.',
          check: {
            skill: 'programming',
            dc: 12,
            success: 'clean_site',
            fail: 'clean_fail',
            successEffects: [votes(1), { xp: 'programming', add: 10 }],
            failEffects: [{ xp: 'programming', add: 5 }, { stat: 'stress', add: 3 }],
          },
        },
        {
          text: '[Business] Flip her list: put potholes, library hours and grandmas at the TOP.',
          check: {
            skill: 'business',
            dc: 13,
            bonuses: [{ if: { background: 'class_clown' }, add: 1, label: '+1 (you know how to work a room)' }],
            success: 'platform_site',
            fail: 'platform_fail',
            successEffects: [votes(2), { xp: 'business', add: 10 }],
            failEffects: [votes(1), { xp: 'business', add: 5 }, { stat: 'stress', add: 2 }],
          },
        },
        {
          text: 'Give her EVERYTHING. Flaming text. A marching-band MIDI. A spinning "under construction" sign.',
          effects: [votes(1), { npc: 'dee', affinity: 6 }, { stat: 'mood', add: 5 }],
          goto: 'maximal',
        },
      ],
    },
    clean_site: {
      speaker: 'narrator',
      text: [
        'You build it in one night: her picture, three plain sections, a guestbook, and it loads in four seconds on the slowest modem on the Row. You sneak in one small flaming BRIGGS as a treat.',
        'Dee\'s reply comes the next morning. "It is very clean. It is like a hospital. I like it. Mrs. Kowalski from the laundromat says she opened it before her kettle boiled. That is the highest praise on this street."',
      ],
      effects: [{ npc: 'dee', affinity: 3 }, { flag: 'side.dee_campaign.site' }],
    },
    clean_fail: {
      speaker: 'narrator',
      text: [
        'You build it clean and fast and then forget to check it anywhere but your own machine. On the free host it comes out in the wrong font, the picture is sideways, and the guestbook link goes to someone\'s page about ferrets.',
        'You fix it by noon. Dee has already called eleven people to tell them to look at it. Four of them now know a great deal about ferrets. "It\'s fine," Dee says. "Ferret people vote."',
      ],
      effects: [{ flag: 'side.dee_campaign.site' }],
    },
    platform_site: {
      speaker: 'narrator',
      text: [
        'You call her and walk her through it: nobody on the Row cares about the fire, Dee. They care that the pothole on Fisher Street ate the mailman\'s tire. They care the library closes at five now. Put that at the top.',
        'There\'s a pause. Then: "That is what I have been SAYING." It isn\'t. But it is now. The site goes up with the potholes first, a photo of the Fisher Street crater with a ruler for scale, and the new library hours in big red letters. The flaming text is at the bottom, where it can\'t hurt anyone.',
      ],
      effects: [{ npc: 'dee', affinity: 4 }, { flag: 'side.dee_campaign.site' }],
    },
    platform_fail: {
      speaker: 'narrator',
      text: [
        'You try to talk her into putting the platform first. She talks you into putting it second, after "a short personal statement," which is nine paragraphs long and includes the full story of the Christmas the CompCastle printers unionized.',
        'Nobody reads past the printers. Everybody reads the printers. Three people write in to the guestbook asking what happened to the printers. It is, somehow, a good start.',
      ],
      effects: [{ npc: 'dee', affinity: 2 }, { flag: 'side.dee_campaign.site' }],
    },
    maximal: {
      speaker: 'narrator',
      text: [
        'You give her everything. BRIGGS FOR WARD 3 in flaming letters. A marching-band MIDI that plays the second the page opens and cannot be stopped. A spinning construction sign, a rainbow divider, and a hit counter that starts at 48,000.',
        'It takes ninety seconds to load. It is hideous. Dee cries a little when she sees it. The grandmothers of the Row, it turns out, think it is the most beautiful thing on the internet, and several of them call Dee to hum the march back to her.',
      ],
      effects: [{ flag: 'side.dee_campaign.site' }],
    },
  },
}

// ── The guestbook troll (forum) ─────────────────────────────────────────────

const guestbook: SceneDef = {
  id: 'dee_council_guestbook',
  channel: 'forum',
  board: 'general',
  title: 'has anyone seen the DEE BRIGGS FOR WARD 3 page lmao',
  from: 'ReplyGuy2000',
  start: 'op',
  nodes: {
    op: {
      speaker: 'ReplyGuy2000',
      text: [
        'some lady from compcastle is running for city council and her site has a GUESTBOOK. i signed it. i said "good luck dee." i meant it. i am going soft',
        'but somebody named Concerned_Citizen_W3 has signed it like 40 times. "DEE BRIGGS CANT EVEN FIND THE ANY KEY." "A VOTE FOR BRIGGS IS A VOTE FOR CHOAS." he spelled chaos wrong every single time lol',
        '-- ReplyGuy2000 · "first!!!"',
      ],
      next: 'replies',
    },
    replies: {
      speaker: 'narrator',
      text: [
        'xXShadowPhreakXx: how does he know about the any key. thats inside info. INSIDE JOB',
        'Concerned_Citizen_W3: im just a regular concerned citizen who is concerned. FITCH GETS IT DONE. briggs is choas',
        'ReplyGuy2000: dude',
        'You know one other place in Port Lumen where "chaos" is spelled C-H-O-A-S: the Fitch campaign flyer stapled to every pole on the Row. "Don\'t Let Ward 3 Descend Into CHOAS."',
      ],
      choices: [
        {
          text: '[Opsec] Line up his posts against the flyer — same misspelling, same sign-off, same late-night hours — and let the forum draw its own conclusion.',
          check: {
            skill: 'opsec',
            dc: 12,
            bonuses: [{ if: { trait: 'paranoid' }, add: 2, label: '+2 (you notice everything)' }],
            success: 'unmasked',
            fail: 'unmask_fail',
            successEffects: [votes(2), { xp: 'opsec', add: 10 }],
            failEffects: [
              votes(1),
              { xp: 'opsec', add: 4 },
              { flag: 'side.dee_wrong_name' },
              { stat: 'stress', add: 4 },
              { chance: 0.3, then: [{ complication: 'legal' }] },
            ],
          },
        },
        {
          text: '[Social] Kill him with kindness: invite "Concerned Citizen" to Dee\'s open coffee at the Cathode.',
          check: {
            skill: 'social',
            dc: 13,
            bonuses: [{ if: { trait: 'silver_tongue' }, add: 2, label: '+2 (silver tongue)' }],
            success: 'kindness',
            fail: 'kindness_fail',
            successEffects: [votes(1), { xp: 'social', add: 10 }],
            failEffects: [{ xp: 'social', add: 4 }, { stat: 'stress', add: 2 }],
          },
        },
        {
          text: 'Get into Fitch\'s own campaign page and put flaming CHOAS on it.',
          tag: '[Dirty]',
          check: {
            skill: 'intrusion',
            dc: 13,
            success: 'dirty_win',
            fail: 'dirty_fail',
            successEffects: [votes(-1), { stat: 'heat', add: 3 }, { xp: 'intrusion', add: 8 }],
            failEffects: [votes(-1), { stat: 'heat', add: 5 }, { flag: 'side.dee_cyber_scandal' }, { faction: 'fac.hood', add: -3 }, { complication: 'legal' }],
          },
        },
        {
          text: 'Don\'t feed the troll. Delete the guestbook spam and move on.',
          effects: [{ flag: 'side.dee_campaign.guestbook' }],
          goto: 'ignore',
        },
      ],
    },
    unmasked: {
      speaker: 'narrator',
      text: [
        'You don\'t touch anything that isn\'t public. You just post the flyer next to his forty guestbook entries, circle CHOAS in each, and note that Concerned Citizen signs off every message with "Rgds, H.F.J." and the Fitch campaign treasurer is one Harlan Fitch Junior.',
        'The forum does the rest in an hour. By morning the Port Lumen Courier\'s city desk has called Fitch\'s office to ask what "choas" means. Fitch Gets It Done has, for the first time in twenty years, a bad news cycle.',
      ],
      effects: [{ flag: 'side.dee_campaign.guestbook' }, { npc: 'dee', affinity: 3 }],
    },
    unmask_fail: {
      speaker: 'narrator',
      text: [
        'You post your comparison at three in the morning and get one detail wrong — you misread the treasurer\'s name off a blurry flyer photo — and the "H.F.J." you name is not Harlan Fitch Junior. It is Hal F. Jablonski, seventy-four, retired crossing guard at St. Anselm\'s, who has never touched a computer and whose grandson reads the forum.',
        'Concerned Citizen pounces on it for a week. So does the grandson. By Thursday there is a letter in the Courier titled MY GRANDFATHER IS NOT A TROLL, and a lawyer\'s cousin has "a few questions" for whoever posted the comparison. Mr. Jablonski himself says nothing. He just stops waving at you from his porch, and on the Row that is louder than a lawsuit.',
        'But the CHOAS thing sticks. People start spelling it that way on purpose, in the laundromat, on the bus. "Don\'t let Ward 3 descend into choas," says the butcher, winking, bagging Dee\'s pork chops. It becomes her unofficial slogan.',
      ],
      effects: [{ flag: 'side.dee_campaign.guestbook' }],
    },
    kindness: {
      speaker: 'narrator',
      text: [
        'You reply: "Concerned Citizen, Dee would love to hear your concerns in person. Thursday, 7 a.m., the Cathode, coffee\'s on her." You figure he won\'t come.',
        'He comes. He is nineteen, pimpled, and Harlan Fitch\'s nephew, and by the second refill Dee has him talking about the pothole that swallowed his bike when he was twelve. He leaves with a DEE BRIGGS button. He does not sign the guestbook again. He tells three friends.',
      ],
      effects: [{ flag: 'side.dee_campaign.guestbook' }, { npc: 'dee', affinity: 3 }, { faction: 'fac.hood', add: 1 }],
    },
    kindness_fail: {
      speaker: 'narrator',
      text: [
        'You invite Concerned Citizen to Dee\'s open coffee. He replies: "NICE TRY BRIGGS BOT. I KNOW ITS A TRAP." Then signs the guestbook forty more times, now in all caps.',
        'Dee reads them over her reading glasses. "He can\'t spell and he\'s afraid of coffee," she says. "I\'ve had worse customers." She adds a line to the site: ALL CONCERNED CITIZENS WELCOME. EVEN THAT ONE.',
      ],
      effects: [{ flag: 'side.dee_campaign.guestbook' }],
    },
    dirty_win: {
      speaker: 'narrator',
      text: [
        'Fitch\'s page is held together with a password his secretary taped to a monitor in 1996. By midnight the top of it says FITCH GETS IT CHOAS in flaming letters. The forum loves it. The forum gives you a standing ovation in the form of forty "LMAO" replies.',
        'Dee does not love it. She calls you at 6 a.m. "Take it down," she says. Not loud. Worse than loud. "I win on the potholes or I don\'t win. The minute we do what he does, we\'re just two Fitches." The Courier runs a story about "campaign dirty tricks" that doesn\'t name anyone but doesn\'t help anyone either.',
      ],
      effects: [{ flag: 'side.dee_campaign.guestbook' }, { npc: 'dee', affinity: -6 }],
    },
    dirty_fail: {
      speaker: 'narrator',
      text: [
        'You fumble it. You never get in — but you leave enough noise on Fitch\'s host that his webmaster notices, and on Friday Fitch holds a press conference about "cyber-attacks by the Briggs campaign," reading from notes, pronouncing it "cyber-attacks" like a new kind of weather.',
        'Dee calls you that night. She doesn\'t yell. "If it was you," she says, "don\'t tell me, and don\'t do it again. I win on the potholes or I don\'t win." Then she hangs up and spends the weekend knocking on doors to undo it.',
        'The Courier gives the story a name — THE BRIGGS HACK — and a name is a thing that lasts. Fitch\'s webmaster gives his logs to someone at the county. Somebody at the county gives them to somebody whose job is logs. None of them know it was you. Yet.',
      ],
      effects: [{ flag: 'side.dee_campaign.guestbook' }, { npc: 'dee', affinity: -6 }],
    },
    ignore: {
      speaker: 'narrator',
      text: 'You delete the forty guestbook entries, set the book to hold new posts for approval, and leave the forum thread to burn itself out. It does, mostly. Concerned Citizen moves on to the letters page of the Courier, where "choas" gets past the copy desk twice.',
    },
  },
}

// ── The phone bank (dialog, the Cathode) ────────────────────────────────────

const phonebank: SceneDef = {
  id: 'dee_council_phonebank',
  channel: 'dialog',
  title: 'The Phone Bank',
  start: 'booth',
  nodes: {
    booth: {
      speaker: 'narrator',
      text: [
        'The back booth of the Cathode, 6 p.m., three borrowed phones on long cords and a stack of church directories held together with a rubber band. Dee is in a blazer. She has a clipboard. The clipboard has a clipboard.',
        { if: { npc: 'sal', met: true }, text: 'Sal has cleared the booth, run the cords himself, and put out a plate of fries "for the campaign." "Twenty years Fitch has been saying he\'ll fix Fisher Street," he says. "My delivery kid lost a hubcap in that hole. Call everybody. Tell them Sal sent you."' },
        '"Ward 3 has four thousand registered voters," says Dee. "Last time eleven hundred voted. Fitch won by three hundred. We need three hundred and one people who hate potholes more than they love staying home. Go."',
      ],
      choices: [
        {
          text: '[Social] Take a phone and just talk to people. Grandmothers, night-shift guys, the whole Row.',
          check: {
            skill: 'social',
            dc: 13,
            bonuses: [{ if: { faction: 'fac.hood', gte: 20 }, add: 2, label: '+2 (the Row knows your face)' }],
            success: 'calls_win',
            fail: 'calls_fail',
            successEffects: [votes(2), { xp: 'social', add: 12 }],
            failEffects: [votes(1), { xp: 'social', add: 5 }, { stat: 'stress', add: 4 }],
          },
        },
        {
          text: '[Business] Organize it properly: a script, a call sheet, volunteers in shifts, rides to the polls.',
          check: {
            skill: 'business',
            dc: 13,
            success: 'org_win',
            fail: 'org_fail',
            successEffects: [votes(2), { xp: 'business', add: 12 }],
            failEffects: [votes(1), { xp: 'business', add: 5 }, { stat: 'stress', add: 3 }, { stat: 'mood', add: -2 }],
          },
        },
        {
          text: '[Networking] Hook four old modems to the Cathode\'s spare lines and play a recorded message from Dee to every number in the directory.',
          check: {
            skill: 'networking',
            dc: 12,
            bonuses: [{ if: { background: 'tinkerer' }, add: 2, label: '+2 (you have a drawer of old modems)' }],
            success: 'robo_win',
            fail: 'robo_fail',
            successEffects: [votes(1), { xp: 'networking', add: 10 }],
            failEffects: [{ xp: 'networking', add: 5 }, { money: -25 }, { npc: 'sal', affinity: -2 }],
          },
        },
      ],
    },
    calls_win: {
      speaker: 'narrator',
      text: [
        'You call for four hours. You talk to a widower about his late wife\'s tomato plants for twenty minutes and he promises to vote. You talk to a night-shift nurse who says the bus doesn\'t run early enough for her to vote and Dee, overhearing, grabs the phone and promises to drive her personally.',
        'By ten you have a list of a hundred and twelve people who said yes and meant it. Dee reads it like a love letter.',
      ],
      next: 'wrap',
    },
    calls_fail: {
      speaker: 'narrator',
      text: [
        'The first forty calls go badly. You get hung up on, yelled at, and asked twice if you are selling siding. One woman thinks you are her grandson and you don\'t have the heart to correct her; she promises her grandson she\'ll vote for "that nice store lady."',
        'You get better around call fifty. Not great. Better. Dee pats your shoulder. "The first forty are for you," she says. "The rest are for the ward."',
      ],
      next: 'wrap',
    },
    org_win: {
      speaker: 'narrator',
      text: [
        'You build a machine out of paper: a two-line script, a call sheet by street, volunteers in two-hour shifts, and a sign-up list for rides on election day. By eight the booth runs itself. Sal\'s delivery kid volunteers his car. So does the Reverend from St. Anselm\'s, who has a van and opinions.',
        'Dee watches her campaign turn into an operation and gets a look on her face you last saw when she reorganized the entire CompCastle stockroom by colour and size. "This," she says, "is the most beautiful spreadsheet I have ever seen."',
      ],
      next: 'wrap',
    },
    org_fail: {
      speaker: 'narrator',
      text: [
        'You write a beautiful script, a call sheet and a volunteer schedule. Dee reads the script, says "no, too stiff," and throws it away. The volunteers come at all the wrong times. Two people call the same street twice.',
        'But the ride sign-up sheet survives, and by election day it has forty names on it. Sometimes the only part of the plan that works is the one that matters.',
      ],
      next: 'wrap',
    },
    robo_win: {
      speaker: 'narrator',
      text: [
        'Four modems, one tape recorder, a tangle of cords, and Dee reading into a microphone: "Hello. This is Dee Briggs. I am running for council. I want to fix Fisher Street and open the library past five. That is all. Thank you. Please vote. This is a recording. I am not actually on the phone. Hang up now." It is perfect.',
        'The rig dials the whole church directory in one night. Two hundred people call back the next day to talk to Dee, because nobody on the Row has ever been robocalled by someone they know.',
      ],
      next: 'wrap',
    },
    robo_fail: {
      speaker: 'narrator',
      text: [
        'The rig works perfectly, and dials the first number on the list — which, it turns out, is Dee\'s own house. Then her sister\'s. Then, somehow, the Cathode, where all four modems call each other in a loop and scream for eleven minutes before Sal pulls the plug out of the wall with a fork.',
        '"Well," says Dee into the smoking silence, "that\'s one vote I\'ve got locked." She goes back to calling by hand. Sal charges the campaign for a new fuse.',
      ],
      next: 'wrap',
    },
    wrap: {
      speaker: 'dee',
      text: [
        'At closing, Dee stacks the directories and straightens the phones and sits across from you in the booth, blazer off, shoes off, feet on the seat, a thing she would fire anyone else for.',
        '"Twenty years I told people how to fix their computers," she says. "I told them to turn it off and on again. Mostly that worked. You know what nobody ever told me? That you could do that with a city." She holds up her coffee. "To turning it off and on again."',
      ],
      effects: [{ flag: 'side.dee_campaign.phones' }, { npc: 'dee', affinity: 4 }],
    },
  },
}

// ── Election night (dialog, the Cathode) ────────────────────────────────────

const election: SceneDef = {
  id: 'dee_council_election',
  channel: 'dialog',
  title: 'Election Night',
  start: 'radio',
  nodes: {
    radio: {
      speaker: 'narrator',
      text: [
        'The Cathode, 9 p.m., the radio on the counter turned up to the local station, where a man who sounds like he\'s reading a grocery list is reading precinct numbers. Dee sits at the end of the counter in her blazer with a slice of pie she hasn\'t touched. Half the Row is in the booths. The grandmothers have brought a cake shaped like a pothole.',
        { if: { faction: 'fac.hood', gte: 20 }, text: 'People keep stopping by your stool to say they voted. Mrs. Kowalski. The butcher. Otis from the rail yard. They say it to you, not to Dee, as if you\'re the one who asked them. You were.' },
        { if: { flag: 'side.otis_paid_off' }, text: 'Otis the yard watchman is on the stool next to yours with his thermos. "Voted," he says, not looking up from his crossword. "Didn\'t see you there, though." He holds out his palm, deadpan, and then laughs so hard he has to put the thermos down. It is, you are fairly sure, the best twenty dollars you ever spent.' },
        { if: { flag: 'side.dee_wrong_name' }, text: 'Old Hal Jablonski is in the corner booth with his grandson, wearing a FITCH GETS IT DONE button the size of a saucer. He does not look at you. He has not looked at you in a month.' },
        { if: { flag: 'side.dee_cyber_scandal' }, text: 'Somebody has taped the Courier\'s THE BRIGGS HACK headline to the jukebox. Sal takes it down. Somebody tapes it back up. Dee pretends not to see either of them.' },
        '"Precinct 3-B," says the radio. "Fitch, four-oh-two. Briggs, three-ninety-one." A groan through the diner. Dee picks up her fork and puts it down again.',
      ],
      effects: [
        { if: { faction: 'fac.hood', gte: 20 }, then: [votes(1)] },
        { if: { npc: 'dee', affinityGte: 30 }, then: [votes(1)] },
      ],
      choices: [
        {
          text: 'Keep listening.',
          if: { var: 'side.dee_votes', gte: 5 },
          goto: 'landslide',
        },
        {
          text: 'Keep listening.',
          if: { var: 'side.dee_votes', lte: 4 },
          goto: 'close',
        },
      ],
    },
    landslide: {
      speaker: 'narrator',
      text: [
        '"Precinct 3-C," says the radio. "The Cannery Row senior center." A breath. "Briggs, two-sixty-one. Fitch, forty." The diner comes apart. The grandmothers bang their cake forks on the table like a gavel. Somebody starts the marching-band MIDI song, humming.',
        'When the last precinct reports, Dee Briggs has won Ward 3 by eleven votes. Eleven. Fitch demands a recount by ten-thirty. The recount finishes at 2 a.m. and finds, of all things, one more vote for Dee.',
      ],
      next: 'win',
    },
    close: {
      speaker: 'narrator',
      text: [
        'It goes like that all night, precinct by precinct, back and forth, ten votes this way, eight votes that. At 11:40 the radio man clears his throat. "With all precincts reporting in Ward 3: Fitch, one thousand two hundred and six. Briggs, one thousand one hundred and ninety-five. Councilman Fitch appears to have held his seat by eleven votes."',
        'The diner goes very quiet. Dee takes a long breath through her nose, and then she stands up and puts her blazer back on. "Recount," she says. "Eleven votes is a clerical error in a nice hat."',
        'At the county clerk\'s office at midnight a tired clerk shows you the tally sheets. One box is listed as "received" and not "counted": ABSENTEE — CANNERY ROW SENIOR CENTER. It isn\'t on any table.',
      ],
      choices: [
        {
          text: '[Business] Read the chain-of-custody forms like a contract and find where the box went.',
          check: {
            skill: 'business',
            dc: 13,
            success: 'box_found',
            fail: 'box_lost',
            successEffects: [{ xp: 'business', add: 12 }],
            failEffects: [{ xp: 'business', add: 5 }],
          },
        },
        {
          text: '[Social] Charm the night clerk into walking every room in the building with you.',
          check: {
            skill: 'social',
            dc: 13,
            bonuses: [{ if: { npc: 'grandma_ruth', met: true }, add: 2, label: '+2 (Ruth voted absentee and TOLD everyone)' }],
            success: 'box_found',
            fail: 'box_lost',
            successEffects: [{ xp: 'social', add: 12 }],
            failEffects: [{ xp: 'social', add: 5 }],
          },
        },
      ],
    },
    box_found: {
      speaker: 'narrator',
      text: [
        'It\'s in the Millgate precinct\'s room, under a stack of their boxes, misfiled by a volunteer who read "Row" as "Room." Two hundred and nine absentee ballots from the Cannery Row senior center, including one from Ruth Alvarez, who drew a small heart next to Dee\'s name, which technically spoils nothing.',
        'The recount finishes at 4 a.m. Dee Briggs has won Ward 3 by eleven votes.',
      ],
      next: 'win',
    },
    box_lost: {
      speaker: 'narrator',
      text: [
        'You look everywhere. The clerk looks everywhere. At 4 a.m. the box is still not anywhere, and the law says what is not counted by dawn is not counted.',
        { if: { flag: 'side.dee_cyber_scandal' }, text: 'On the radio, Fitch thanks the voters for "rejecting cyber-attack politics." You are fairly sure that sentence was worth more than eleven votes.' },
        'Fitch holds his seat by eleven votes. The box turns up two weeks later in a Millgate storage closet, misfiled by a volunteer who read "Row" as "Room." It would not have been enough. It would have been close. It would have been something.',
      ],
      next: 'loss',
    },
    win: {
      speaker: 'dee',
      text: [
        'Dee stands on a chair in the Cathode at dawn in her blazer and her socks. She thanks the grandmothers. She thanks Sal. She thanks the butcher, who wept. She thanks the Christmas the CompCastle printers unionized, "which taught me everything I know about organizing."',
        'Then she looks straight at you. "And the kid who told me I should run," she says, "when I was pressing every key on the keyboard looking for the one that said ANY." She raises her coffee. "Fisher Street. You\'re next."',
        { if: { flag: 'npc.dee.snorted' }, text: '"Who also laughed at me," she adds, to the whole diner, "for eight full seconds. I have never forgotten it. I will put it on my headstone." The Row roars. You will be hearing about the eight seconds at every ribbon-cutting for the rest of your life.' },
        'She frames the recount printout. It hangs over her desk at City Hall for years, next to the Employee of the Month photo.',
      ],
      effects: [
        { flag: 'npc.dee.council' },
        { npc: 'dee', fate: 'councilwoman', affinity: 10 },
        { news: 'dee_council' },
        { faction: 'fac.hood', add: 5 },
        { stat: 'mood', add: 10 },
        { flag: 'side.dee_campaign.result' },
        { log: 'Dee Briggs won Ward 3 by eleven votes. Somewhere down the line, the city is going to need her to remember who helped.', kind: 'story' },
      ],
    },
    loss: {
      speaker: 'dee',
      text: [
        'Dee takes it standing up, in the parking lot of the clerk\'s office at dawn, blazer over her arm. "Eleven votes," she says. "Two hundred people in a box in the wrong room." She laughs, short and tired. "That\'s just a bad ticket. I\'ve closed worse tickets."',
        'She thanks you. She thanks everyone. Then she goes home, sleeps four hours, and buys a calendar for the next election cycle, and circles the filing deadline in red, and puts a sticky note on it that says ANY KEY.',
      ],
      effects: [
        { npc: 'dee', affinity: 4 },
        { faction: 'fac.hood', add: 2 },
        { stat: 'mood', add: -4 },
        { flag: 'side.dee_campaign.lost' },
        { flag: 'side.dee_campaign.result' },
      ],
    },
  },
}

export default defineContent({
  quests: [quest],
  scenes: [filing, site, guestbook, phonebank, election],
})
