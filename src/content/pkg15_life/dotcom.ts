/**
 * PKG-15 — Life events §9.5: dot-com era news reactions (personal scale).
 *
 *  - life_napster_suit        ~Sep 2002: the record labels' trade group sues local teens; the letter
 *                             is addressed to your household's NorthLink account. Publishes `napster_suit`.
 *  - life_dotcom_layoff_wave  one-off ~2002: Dee is laid off from CompCastle (her farewell mail; PKG-09's
 *                             fac_halcyon_q1 rehires her) and Cal Reeves (`webmaster`) is introduced.
 *                             Sets `npc.webmaster.fate` ('hired' | 'webmaster_dark') and `life.webmaster_dark`.
 *  - life_halcyon_ipo_party   one-off when `w.halcyon_state='rising'`.
 */
import { dayOf } from '@/engine/calendar'
import { defineContent } from '@/engine/registry'
import type { SceneDef, TriggerDef } from '@/engine/types'
import { QUIET_RESET, actGte, around, atParents, free } from './_shared'

const onHalcyonPayroll = { flag: 'fac.halcyon.employed' }

const scenes: SceneDef[] = [
  // ── life_napster_suit ─────────────────────────────────────────────────────
  {
    id: 'life_napster_suit',
    channel: 'dialog',
    title: 'NOTICE OF CLAIM',
    start: 'start',
    nodes: {
      start: {
        speaker: 'narrator',
        text: [
          `The envelope is thick, cream-colored and addressed to THE ACCOUNT HOLDER, NORTHLINK SUBSCRIBER #44-0917-T, which is the household line, which is to say, Dad.`,
          `It's from a law firm representing the Recording Guild of the Commonwealth. It alleges that "an individual using the above account" shared 1,212 copyrighted songs via the TuneSwap file-sharing service. It proposes a settlement of $3,000. It lists, as Exhibit A, twenty of the songs.`,
          { if: around('kim'), text: `Seventeen of the twenty are boy bands. Kim is standing behind Dad, very pale, very still.`, else: `Seventeen of the twenty are boy bands. You have never shared a boy band in your life. Somebody else in this household has been busy.` },
          { if: atParents, text: `Dad reads it twice. "Three thousand dollars," he says. "For songs. I was laid off for less."`, else: `Dad calls you at nine at night. "There's a letter," he says. "From lawyers. About songs. Can you come home?"` },
        ],
        choices: [
          {
            text: `Write back like a lawyer. They can't prove who used the account.`,
            tag: '[Business]',
            check: {
              skill: 'business',
              dc: 14,
              success: 'lawyer_ok',
              fail: 'lawyer_bad',
              successEffects: [{ npc: 'dad', affinity: 4 }, { faction: 'fac.hood', add: 2 }],
              failEffects: [{ money: -600 }, { npc: 'dad', affinity: 2 }, { stat: 'stress', add: 5 }, { chance: 0.3, then: [{ complication: 'legal' }] }],
            },
          },
          {
            text: `Lie low. Wipe the shared folder, uninstall TuneSwap, and let the letter go stale.`,
            tag: '[OpSec]',
            check: {
              skill: 'opsec',
              dc: 13,
              success: 'lowlow',
              fail: 'second_letter',
              successEffects: [{ xp: 'opsec', add: 25 }, { stat: 'heat', add: -2 }],
              failEffects: [
                { money: -300 },
                { obligation: { id: 'pkg15_life_guild_settlement', label: 'Recording Guild settlement (household account)', perDay: 5, days: 120 } },
                { npc: 'kim', affinity: -2 },
                { stat: 'stress', add: 6 },
                { flag: 'life.guild_settled_twice' },
                { chance: 0.3, then: [{ complication: 'legal' }] },
              ],
            },
          },
          {
            text: `"It was me." Take the blame for Kim.`,
            if: around('kim'),
            effects: [{ npc: 'kim', affinity: 8 }, { npc: 'dad', affinity: -2 }, { money: -400 }, { var: 'kim_trajectory', add: 1 }],
            goto: 'blame',
          },
          {
            text: `Pay a settlement. Negotiate it down, but pay it. ($800)`,
            req: { stat: 'money', gte: 800 },
            reqText: 'Requires $800',
            effects: [{ money: -800 }, { npc: 'dad', affinity: 5 }, { stat: 'stress', add: -3 }],
            goto: 'paid',
          },
        ],
      },
      lawyer_ok: {
        speaker: 'narrator',
        text: [
          `Your reply is one page. It notes that the account is shared by a household of five, that an address is not a person, that the firm's evidence consists of a list of song titles and a timestamp, and that you look forward to their proof in discovery.`,
          `They don't write back. Three weeks later the Lumen Ledger runs a story about the firm dropping forty "weak" cases in Port Lumen. Dad frames your letter. It hangs in the hallway between Kim's kindergarten drawing and his union card.`,
        ],
      },
      lawyer_bad: {
        speaker: 'narrator',
        text: `Your reply is sharp. Too sharp: their answer is a second, thicker letter quoting yours back at you as "an admission of household awareness." In the end you settle for $600, which you pay yourself, so Dad doesn't have to. He tries to pay you back in twenties for months. You never take it.`,
      },
      lowlow: {
        speaker: 'narrator',
        text: `Shared folder gone, program gone, the family computer's history cleaned so thoroughly it looks like it was bought yesterday. The firm sends one follow-up, then nothing: they have thousands of letters to send and no interest in a household with nothing left to find. You learn something about how enforcement actually works. It's mostly postage.`,
      },
      second_letter: {
        speaker: 'narrator',
        text: [
          `You clean up. Not fast enough: the firm had already logged the account a second time, the week after the first letter, and the second letter is angrier and more expensive. You settle for $900 — three hundred down, the rest on a payment plan with your name on it, because nobody in this house has nine hundred dollars in a drawer.`,
          `Kim cries in the bathroom. Dad says, "Songs," and nothing else, for a week. NorthLink sends its own letter after that: one more notice on this account and the household line gets cut. It is taped to the fridge now, next to the takeout menus, where everybody has to read it.`,
        ],
      },
      blame: {
        speaker: 'kim',
        text: [
          `You say it before she can. Dad looks at you, then at Kim, then back at you, and you can see him decide not to know.`,
          `Later, in the hallway, Kim hugs you so hard your ribs hurt. "Seventeen boy bands," she whispers. "You took the fall for seventeen boy bands." You settle for $400 out of your own pocket. It is, all things considered, the cheapest loyalty you will ever buy.`,
        ],
      },
      paid: {
        speaker: 'narrator',
        text: `You call the firm, tell a very bored paralegal that you'll pay $800 today to make it go away, and she says "that's fine" so fast that you realize you could have said $400. The letter goes in the drawer with the takeout menus. Dad shakes your hand, formally, like you just bought a car together.`,
      },
    },
  },

  // ── life_dotcom_layoff_wave: Dee's farewell ─────────────────────────────
  {
    id: 'life_dee_laid_off',
    channel: 'mail',
    title: 'FAREWELL (please read) (this is not spam)',
    from: 'dee',
    start: 'start',
    nodes: {
      start: {
        text: [
          `To: all-staff-portlumen, former-staff-portlumen, my personal contacts, Mom`,
          `Friends. Colleagues. Customers I have healed.`,
          `As many of you have heard, CompCastle Regional has "rightsized" the Port Lumen store in response to "market conditions." My position has been eliminated, along with Kevin's, Anita's, the entire Saturday crew, and the popcorn machine.`,
          `I leave you with the lessons of eleven years:\n1. The customer's monitor is unplugged. We do not tell the customer this.\n2. "Have you tried turning it off and on again" is not a question. It is a prayer.\n3. Never, ever let Kevin near the returns cage.`,
          { if: { flag: 'npc.dee.encouraged' }, text: `Some of you have told me I should "run for something." I am considering my options. I have a lot of free time now, and I have always had opinions about the potholes on Fourth.` },
          `Do not worry about me. Dolores Briggs has landed on her feet in three recessions and one marriage.`,
          `— Dee\n(personal email now: the one with the cat in it)`,
        ],
        choices: [
          { text: `Reply: "Best manager I ever had, Dee. Genuinely."`, effects: [{ npc: 'dee', affinity: 5 }] },
          { text: `Reply: "You should run for council. I'm serious."`, effects: [{ npc: 'dee', affinity: 4 }, { flag: 'npc.dee.encouraged' }] },
          { text: `Reply: "RIP popcorn machine."`, effects: [{ npc: 'dee', affinity: 2 }, { stat: 'mood', add: 2 }] },
        ],
      },
    },
  },

  // ── life_dotcom_layoff_wave: Cal Reeves ──────────────────────────────────
  {
    id: 'life_dotcom_layoff_wave',
    channel: 'dialog',
    title: 'WILL CODE HTML FOR FOOD',
    start: 'start',
    nodes: {
      start: {
        speaker: 'narrator',
        effects: [{ npc: 'webmaster', met: true }],
        text: [
          `Terminal Velocity, Millgate, Tuesday afternoon. The cyber-café is full of people who, a year ago, had jobs with foosball tables. Now they have résumés printed on the good paper and the thousand-yard stare of a failed dot-com.`,
          `One of them is sitting across from you with a cardboard sign propped against his laptop: WILL CODE HTML FOR FOOD. It's a joke. It's also, from the look of the half-eaten muffin he's been nursing for two hours, not really a joke.`,
          `"Cal Reeves," he says, sticking out a hand. "Webmaster. Formerly of PetPantry-dot-com, SkyNest, and a company that sold luxury dog umbrellas online, which in retrospect..." He shrugs. He's wearing all three companies' free T-shirts, layered. "I am very good at my job. There are no jobs."`,
          `As he talks, a man in a good coat at the next table slides a business card over to him without a word, and leaves. Cal glances at it and puts it face down.`,
        ],
        choices: [
          {
            text: `"I've got a client who needs a site. It's yours. ($250 of my cut)"`,
            req: { stat: 'money', gte: 250 },
            reqText: 'Requires $250',
            effects: [{ money: -250 }, { npc: 'webmaster', affinity: 8, fate: 'hired' }, { faction: 'fac.hood', add: 2 }],
            goto: 'gig',
          },
          {
            text: `Help him fix his pitch and send him to the one company that's still hiring.`,
            tag: '[Business]',
            check: {
              skill: 'business',
              dc: 13,
              bonuses: [{ if: { any: [{ faction: 'fac.halcyon', gte: 20 }, { npc: 'priya', met: true }] }, add: 2, label: '+2 (you know someone at Halcyon)' }],
              success: 'pitch_ok',
              fail: 'pitch_bad',
              successEffects: [{ npc: 'webmaster', affinity: 6, fate: 'hired' }, { faction: 'fac.halcyon', add: 2 }],
              failEffects: [{ npc: 'webmaster', affinity: 2, fate: 'webmaster_dark' }, { flag: 'life.webmaster_dark' }],
            },
          },
          {
            text: `"The guy who left that card. Don't call him."`,
            tag: '[Social]',
            check: {
              skill: 'social',
              dc: 14,
              bonuses: [{ if: { trait: 'empath' }, add: 2, label: '+2 (you can see how close he is to calling)' }],
              success: 'warned',
              fail: 'calls_anyway',
              successEffects: [{ npc: 'webmaster', affinity: 5, fate: 'hired' }],
              failEffects: [{ npc: 'webmaster', affinity: -2, fate: 'webmaster_dark' }, { flag: 'life.webmaster_dark' }],
            },
          },
          {
            text: `Wish him luck and go back to your coffee.`,
            effects: [{ npc: 'webmaster', fate: 'webmaster_dark' }, { flag: 'life.webmaster_dark' }],
            goto: 'walk',
          },
        ],
      },
      gig: {
        speaker: 'webmaster',
        text: [
          `He builds the site in four days. It's clean, fast, and has no animated GIFs at all, which he describes as "a personal journey." The client is thrilled; the client refers two more.`,
          `A month later Cal sends you a link: his own little studio, REEVES WEB WORKS, above a laundromat on the Row. "Rent's cheap," he writes. "The dryers keep the servers warm." He tears the business card into eight pieces and mails you the pieces, as a joke. You keep them.`,
        ],
      },
      pitch_ok: {
        speaker: 'narrator',
        text: `You rewrite his résumé across two coffees: less "visionary," more "shipped forty sites on time." You point him at the one employer in the city still hiring web people through the bust. He gets the interview. He gets the job. He sends you a photo of his new badge with the words "I AM EMPLOYED" written on it in dry-erase marker. The business card, he says, went in the trash.`,
      },
      pitch_bad: {
        speaker: 'narrator',
        text: [
          `You work on his pitch together. It doesn't matter: the one company still hiring has four hundred applicants for two jobs, and Cal isn't one of the two.`,
          `The next time you see him at Terminal Velocity, a month later, he has a new laptop and new shoes and doesn't meet your eye. "Freelance," he says. "Good clients. Don't ask." You don't ask. You wish you had.`,
        ],
      },
      warned: {
        speaker: 'webmaster',
        text: [
          `Cal turns the card over. It says, in small tasteful letters, only a phone number and the word CONSULTING. "You know him?"`,
          `"I know the type. The work pays great for about a year. Then it pays in lawyers." He looks at you for a long moment, then tears the card in half. "Okay. Okay. Then I guess you're helping me find a real job." You do, eventually. It takes six weeks and a lot of muffins.`,
        ],
      },
      calls_anyway: {
        speaker: 'webmaster',
        text: `"Easy for you to say," Cal says, not unkindly. "You've got a mom with a kitchen. I've got a landlord with a lawyer." He pockets the card. You see him a few more times that winter, always in a hurry, always with new things. He stops coming to Terminal Velocity in the spring.`,
      },
      walk: {
        speaker: 'narrator',
        text: `"Good luck, man." "Yeah. You too." You go back to your coffee. When you leave, twenty minutes later, Cal is on the café's payphone, reading a number off a business card, turned away from the room.`,
      },
    },
  },

  // ── life_halcyon_ipo_party ──────────────────────────────────────────────
  {
    id: 'life_halcyon_ipo_party',
    channel: 'dialog',
    title: 'HLCY',
    start: 'start',
    nodes: {
      start: {
        speaker: 'narrator',
        text: [
          `The Halcyon atrium, Millgate, eleven at night. Four ice sculptures of the company logo, melting. A jazz trio playing a jazz version of Halcyon's own hold music. The ticker on the big screen reads HLCY and it has been going up all day.`,
          { if: onHalcyonPayroll, text: `You're here because you work here. Your options are, as of today, real money, at least on paper, and paper is having a very good night.` },
          { if: { all: [{ not: onHalcyonPayroll }, { npc: 'priya', met: true }] }, text: `You're here as Priya's plus-one. "Moral support," she said. She has been holding the same glass of champagne for two hours without drinking it.` },
          { if: { all: [{ not: onHalcyonPayroll }, { not: { npc: 'priya', met: true } }] }, text: `You're here because Jax found a stack of wristbands in a dumpster behind the caterer's van. Nobody has asked who you are. Nobody is asking anybody anything tonight.` },
          `Marcus Vale is standing on the koi pond's little bridge with a microphone, saying "the future already arrived" for the third time. Everyone cheers every time.`,
        ],
        choices: [
          {
            text: `Work the room. This is where the city's money is standing tonight.`,
            tag: '[Business]',
            check: {
              skill: 'business',
              dc: 13,
              success: 'networked',
              fail: 'cornered',
              successEffects: [{ faction: 'fac.halcyon', add: 4 }, { money: 300 }, { xp: 'business', add: 25 }],
              failEffects: [{ stat: 'stress', add: 4 }, { stat: 'mood', add: -2 }, { stat: 'energy', add: -6 }],
            },
          },
          {
            text: `Get a moment with Marcus Vale.`,
            tag: '[Social]',
            check: {
              skill: 'social',
              dc: 15,
              bonuses: [{ if: { trait: 'silver_tongue' }, add: 2, label: '+2 (silver tongue)' }],
              success: 'vale',
              fail: 'vale_brush',
              successEffects: [{ npc: 'vale', met: true, affinity: 5 }, { faction: 'fac.halcyon', add: 3 }],
              failEffects: [{ npc: 'vale', met: true }, { stat: 'mood', add: -2 }, { stat: 'stress', add: 3 }, { faction: 'fac.halcyon', add: -1 }],
            },
          },
          {
            text: `Find Priya. She's out on the fire escape, isn't she.`,
            if: { npc: 'priya', met: true },
            effects: [{ npc: 'priya', affinity: 5 }, { stat: 'stress', add: -3 }],
            goto: 'priya',
          },
          {
            text: `Drink the free champagne like it's going out of style. It is.`,
            effects: [{ stat: 'mood', add: 8 }, { stat: 'health', add: -3 }, { stat: 'energy', add: -12 }],
            goto: 'champagne',
          },
        ],
      },
      networked: {
        speaker: 'narrator',
        text: `You trade business cards with a venture capitalist, a NorthLink vice-president and a man who says he "does strategy" and won't elaborate. By one a.m. you have two freelance offers and a lunch invitation. One of the offers pays a three-hundred-dollar deposit the next morning, "to show we're serious." The whole city is serious tonight.`,
      },
      cornered: {
        speaker: 'narrator',
        text: `You get cornered by a man who explains, for forty-five minutes, his plan to put every restaurant menu in the city online "with an animated chef." You nod until your neck hurts. He gives you his card. It has an animated chef on it, somehow. You escape to the bathroom and sit there for a while, listening to the jazz.`,
      },
      vale: {
        speaker: 'vale',
        text: [
          `Vale shakes your hand with both of his and holds it a beat too long, looking at you like a man reading a stock ticker. "I know you," he says, which he can't. "You're one of the ones who builds the thing under the thing. We need more of you upstairs."`,
          `He's gone before you can answer, pulled back into a knot of people in expensive glasses. It felt like being picked. Later, you wonder what for.`,
        ],
      },
      vale_brush: {
        speaker: 'narrator',
        text: `You get close. You get so close. Then a woman with an earpiece steps between you and Vale with the practiced grace of a matador, and you find yourself shaking hands with the head of investor relations instead, who thanks you for "being part of the Halcyon family" and asks if you've tried the shrimp.`,
      },
      priya: {
        speaker: 'priya',
        text: [
          `She's on the fire escape with her shoes off, looking out at the mill district, where the old smokestacks are lit up purple for some reason. Her champagne is still full.`,
          `"Everybody in that room is rich tonight," she says. "Do you know how many of them know where the money came from?" She doesn't wait for an answer. "Rule three. When the party's this good, somebody else is paying for it." Then she laughs and clinks her glass against yours. "Ignore me. Congratulations. Really."`,
        ],
      },
      champagne: {
        speaker: 'narrator',
        text: `You drink the champagne, and the other champagne, and something blue out of an ice luge shaped like the Halcyon logo. At some point you dance with a server. At some point you explain dial-up to the jazz trio. You wake up at home with a gift bag containing a Halcyon stress ball, a Halcyon umbrella and, inexplicably, one of the koi. The koi is fine. You name it Synergy II.`,
      },
    },
  },
]

const triggers: TriggerDef[] = [
  {
    id: 'life_napster_suit',
    when: { all: [{ day: true, gte: dayOf(2002, 8, 15) }, around('dad'), free] },
    atHour: 19,
    chance: 0.05,
    effects: [QUIET_RESET, { news: 'napster_suit' }, { scene: 'life_napster_suit' }],
  },
  {
    id: 'life_dotcom_layoff_wave',
    when: { all: [{ day: true, gte: 180 }, { any: [actGte(2), { day: true, gte: dayOf(2002, 3, 15) }] }, free] },
    atHour: 10,
    chance: 0.1,
    effects: [
      QUIET_RESET,
      { flag: 'life.dee_laid_off' },
      { if: { npc: 'dee', met: true }, then: [{ scene: 'life_dee_laid_off' }] },
      { scene: 'life_dotcom_layoff_wave', delayHours: 30 },
    ],
  },
  {
    id: 'life_halcyon_ipo_party',
    when: { all: [{ flag: 'w.halcyon_state', eq: 'rising' }, free, { any: [{ flag: 'fac.halcyon.employed' }, { npc: 'priya', met: true }, around('jax')] }] },
    atHour: 20,
    effects: [QUIET_RESET, { news: 'halcyon_ipo' }, { scene: 'life_halcyon_ipo_party' }],
  },
]

export default defineContent({ scenes, triggers })
