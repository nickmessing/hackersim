/**
 * PKG-16 — Story headlines, Act III and Act IV: the power stories (bible §11.4 items 7–11, 13, 14,
 * 16–18, 20, 36, 38, 40, 42, 43). The law, the bank, the broker, the ladder, the badge.
 *
 * Single-count rule: every world delta below lives on the NewsDef. The beats that publish these
 * (PKG-03 vote & heist, PKG-04 bonfire / exchange / montage / endings, PKG-06 hospital & "Made",
 * PKG-07 Reyes's whistle, PKG-09 the Halcyon scandal & reform) only publish; they never touch
 * the var themselves. State-machine riders are guarded so a late headline never walks a world
 * state backwards (an "exposed" story can't resurrect a destroyed Aperture, and so on).
 *
 * Press-desk backups at the bottom print a story from the settled state it reports on, so a
 * headline still lands if its story beat's publish is ever missed. Publishing is idempotent.
 */
import { defineContent } from '@/engine/registry'
import type { NewsDef, TriggerDef } from '@/engine/types'
import { actGte, all, any, has, is, not, printed } from './_shared'

const HERALD = 'The Lumen Herald'
const BIZ = 'Port Lumen Business Journal'
const BYTELINE = 'ByteLine Weekly'

const news: NewsDef[] = [
  // ── 7 · The law arrives (PKG-03 main_a3_q1 publishes) ──────────────────────
  {
    id: 'mnsa_introduced',
    headline: 'Council Weighs \'Network Security Act\'',
    source: HERALD,
    category: 'local',
    body: [
      'The Port Lumen City Council on Monday took up the Municipal Network Security Act, a forty-one-page ordinance that would require every internet provider operating in the city to keep a record of every connection its customers make, "for a period not less than indefinite," and to hand those records to law enforcement on request.',
      'The bill\'s sponsor, Councilman Harold Pruett of Harbor Point, called it "a seatbelt for the information superhighway." Asked whether seatbelts usually keep a record of everywhere the car has been, Pruett said he was "not going to get into automotive technicalities."',
      'Special Agent in Charge Duke Marlow of the Bureau\'s Harbor Point field office testified in support, describing the logs as "the digital equivalent of a neighborhood watch." NorthLink, the city\'s largest provider, said it would comply with "whatever the council decides," and declined to say how much storage "indefinite" would require.',
      { if: printed('crackdown'), text: 'Mayor Constance Whitlow, whose "zero tolerance" hotline is now in its fourth year, praised the bill as "the next logical step." Civil liberties advocates agreed that it was the next step. They disputed "logical."' },
      { if: has('npc.dee.council'), text: 'Councilwoman Dolores Briggs of Cannery Row–Millgate said she had not yet formed an opinion. "I\'m going to read it," she said. "All forty-one pages. Twice. Then I\'m going to call the people it\'s about and ask them what they think, which I notice nobody has done yet."' },
      { if: { var: 'w.exposure', gte: 6 }, text: 'The bill arrives in a season of uneasy rumors about who, exactly, already has access to the city\'s data. Several residents who packed the gallery carried hand-lettered signs. One read: WHO\'S READING THIS SIGN?' },
      'Public hearings begin next month. The council is expected to vote before the end of the session.',
    ],
  },

  // ── 8 · Passed (PKG-03 main_a3_q7 publishes; this rider owns the +0.25 and 'high') ──
  {
    id: 'mnsa_passed',
    headline: 'Council Passes Act; ISPs to Retain All Logs',
    source: HERALD,
    category: 'local',
    body: [
      { if: printed('dee_swing_vote'), text: 'After a deadlocked chamber and a long, silent minute, the Port Lumen City Council passed the Municipal Network Security Act by a single vote on Thursday night.', else: 'The Port Lumen City Council passed the Municipal Network Security Act on Thursday night by a vote of nine to four, with little debate and less eye contact.' },
      'Beginning in the new year, every internet provider in the city must retain complete connection records for every customer, indefinitely, and surrender them to police or federal investigators on request. No warrant is required below what the ordinance calls "the threshold of significant inconvenience," a term it does not define.',
      '"This is a great day for public safety," said Councilman Harold Pruett, the bill\'s sponsor. Special Agent in Charge Duke Marlow called the vote "a partnership" and thanked "our friends in the private sector, who made the technical side of this so painless you won\'t even notice it."',
      'At NorthLink\'s Millgate operations center, a technician who asked not to be named said the company had begun installing the new recording equipment "about six weeks ago, actually." Asked how NorthLink had known the bill would pass, he said, "Good guess, I guess," and hung up.',
      { if: { var: 'w.heat_lifetime', gte: 800 }, text: 'Supporters repeatedly cited a "wave of computer crime" in the city. Opponents noted, quietly, that the wave had been real, and loud, and that whoever had been making it had handed the council its best argument.' },
      'The gallery was nearly empty when the gavel fell. A custodian stacking chairs afterward said he had "never seen a room get so quiet about something so big."',
    ],
    effects: [
      { var: 'w.heatGain', add: 0.25 },
      { var: 'w.mnsa', set: 1 },
      { flag: 'w.surveillance', set: 'high' },
    ],
  },

  // ── 10 · Gutted (PKG-03 main_a3_q7 publishes; this rider owns the +0.10) ──
  {
    id: 'mnsa_gutted',
    headline: 'Watered-Down Act Passes',
    source: HERALD,
    category: 'local',
    body: [
      { if: printed('dee_swing_vote'), text: 'A deadlocked Port Lumen City Council passed an amended Municipal Network Security Act on Thursday night by one vote, after eleven hours of amendments, three recesses and a pizza delivery that briefly interrupted the roll call.', else: 'The Port Lumen City Council passed an amended Municipal Network Security Act on Thursday night by a vote of seven to six, after eleven hours of amendments, three recesses and a pizza delivery that briefly interrupted the roll call.' },
      'The final ordinance requires providers to keep connection records for eighteen months rather than "indefinitely," and to release them only with a signed request from a supervising officer. The warrantless "significant inconvenience" clause was struck. A provision allowing "pilot data-sharing partnerships" with private contractors survived, reworded twice and moved to page thirty-eight.',
      '"Nobody got what they wanted," said one council aide, "which around here we call a win." Councilman Harold Pruett, the bill\'s sponsor, called the result "a foundation to build on," a phrase that alarmed the bill\'s opponents more than anything else said all night.',
      'Privacy advocates outside City Hall could not agree on whether to celebrate. Several held their signs at half-mast.',
    ],
    effects: [
      { var: 'w.heatGain', add: 0.1 },
      { var: 'w.mnsa', set: 2 },
    ],
  },

  // ── 9 · Failed (PKG-03 main_a3_q7 publishes). Leak wording only if a leak happened. ──
  {
    id: 'mnsa_failed',
    headline: 'CITIZENS WIN: Council Kills Network Security Act',
    source: HERALD,
    category: 'local',
    body: [
      { if: has('a3.whistleblow_prepped'), text: 'After an explosive leak that put the bill\'s private backers on every front page in the Sound, the Port Lumen City Council voted down the Municipal Network Security Act on Thursday night. By the time the roll was called, two of the bill\'s original co-sponsors had asked to have their names removed from it.', else: 'The Port Lumen City Council voted down the Municipal Network Security Act on Thursday night, ending a year-long fight over whether the city\'s internet providers should be required to record everything their customers do online.' },
      'The gallery, packed past the fire marshal\'s patience, erupted when the final tally was read. Someone had brought a boombox. Someone else, a retired phone operator in her seventies, had brought an air horn, and would not say where she got it.',
      '"The people of this city just told us they don\'t want to be watched," said one councilmember who switched sides in the final week. "I\'d like the record to show I was listening. I\'d also like the record to be deleted after eighteen months. That\'s a joke. Mostly."',
      { if: has('npc.reyes.testifies'), text: 'The turning point, several members said privately, was the testimony of a federal agent who described, under oath and in careful detail, what her own office had planned to do with the logs.' },
      'Councilman Harold Pruett, the bill\'s sponsor, left through a side door. Special Agent in Charge Duke Marlow of the Bureau said only that "the need for these tools hasn\'t gone anywhere," and that he would be "patient."',
    ],
    effects: [{ flag: 'w.surveillance', set: 'low' }],
  },

  // ── 11 · Repealed (PKG-04 montage publishes on publish + Dee; the rider SUBTRACTS, never resets) ──
  {
    id: 'mnsa_repealed',
    headline: 'Amid Scandal, Council Repeals Law',
    source: HERALD,
    category: 'local',
    body: [
      'Four years after it passed, the Municipal Network Security Act is gone. The Port Lumen City Council voted Tuesday to repeal the ordinance in its entirety and ordered every provider in the city to destroy the connection records it has kept under the law.',
      'The repeal was introduced by Councilwoman Dolores Briggs, who read the motion aloud herself, all six pages, twice. "I promised I would read everything," she said. "I read what that law was used for. Now everybody has. So here we are."',
      { if: printed('aperture_destroyed'), text: 'The vote follows the collapse of Aperture Data Solutions and the indictment of several of its executives on evidence that, according to court filings, included records the firm obtained through "arrangements" made possible by the act.', else: 'The vote follows months of revelations about how the retained logs were shared, sold and searched, and by whom.' },
      'NorthLink said it would comply with the destruction order "promptly and completely." A technician at the company\'s Millgate operations center said the shredding had already begun. "It\'s a whole floor," he said. "You wouldn\'t believe what a whole floor of other people\'s lives sounds like going through a shredder. Kind of like a modem, actually."',
      'Councilman Harold Pruett, the act\'s original sponsor, abstained.',
    ],
    effects: [
      { var: 'w.heatGain', add: -0.25 },
      { var: 'w.mnsa', set: 0 },
      { flag: 'w.surveillance', set: 'low' },
    ],
  },

  // ── 40 · Dee decides it (PKG-03 publishes only on a real deadlock; branches on the outcome) ──
  {
    id: 'dee_swing_vote',
    headline: 'Council Deadlocked; Briggs Casts Deciding Ballot',
    source: HERALD,
    category: 'local',
    body: [
      'With the Municipal Network Security Act tied at six votes apiece, the entire Port Lumen City Council turned on Thursday night to its newest and least predictable member: Dolores "Dee" Briggs of Cannery Row–Millgate, the former CompCastle manager who has missed exactly zero meetings and read every page of every agenda, twice.',
      'Briggs had declined to announce her vote in advance. Aides on both sides described her as "undecided," "unreachable" and, in one case, "terrifying."',
      {
        if: { var: 'w.mnsa', eq: 0 },
        text: '"No," she said, when the clerk reached her name, and then, into the silence, "In retail, when a customer asks you to keep their receipts forever, you say sure. When a store decides on its own to keep everybody\'s receipts forever, you call the manager. I\'m the manager. No."',
        else: '"Aye," she said, when the clerk reached her name, so quietly that the clerk asked her to repeat it. She did not look at the gallery. Afterward, asked whether she had any regrets, she said, "Ask me in five years," and got into her car.',
      },
      { if: { npc: 'dee', affinityGte: 40 }, text: 'Several people in the gallery said she seemed to be looking for someone in the crowd just before the vote. Whoever it was, she found them.' },
      'Councilman Harold Pruett, the bill\'s sponsor, said he respected the councilwoman\'s "process." He did not say which part.',
    ],
  },

  // ── 16 · The bank falls (PKG-03 drain route publishes; sole ×0.8-equivalent) ──
  {
    id: 'meridian_collapse',
    headline: 'Meridian Insolvent',
    source: BIZ,
    category: 'business',
    body: [
      'Meridian Trust Bank, the 140-year-old institution whose tower has anchored the Harbor Point skyline since before the skyline had anything else in it, did not open its doors on Monday. State regulators seized the bank before dawn after what they described as "a sudden and total loss of liquidity."',
      'Meridian\'s management has not explained where the money went. Sources close to the investigation described a series of transfers over a single weekend, routed through "the bank\'s new online platform, which appears to have worked exactly as designed, for someone."',
      'Depositors lined up along Quay Street by six a.m. Most will be made whole by federal insurance. The city\'s pension fund, two hospitals and dozens of small businesses on Cannery Row, which kept operating accounts above the insured limit, may not be.',
      '"My grandmother banked here," said a Millgate software developer holding a folder of printed statements. "My mother banked here. I set up online banking in 2003 because the website said it was safe. The website had a picture of a lighthouse. I trusted a clip-art lighthouse."',
      'Economists warned that the collapse will ripple through the region\'s job market for years. Tech employers, many of them Meridian borrowers, froze hiring by afternoon.',
    ],
    effects: [
      { flag: 'w.meridian_state', set: 'collapsed' },
      { var: 'w.itSalary', add: -0.2 },
    ],
  },

  // ── 42 · The recession (Meridian's fall, or the finished bonfire) ──
  {
    id: 'economy_recession',
    headline: 'Downtown Vacancies Climb',
    source: BIZ,
    category: 'business',
    body: [
      'One in four storefronts in Harbor Point now sits empty, according to the Lumen Sound Commercial Realty Board, and the "For Lease" signs have begun climbing the office towers floor by floor.',
      {
        if: is('w.meridian_state', 'collapsed'),
        text: 'The slide began the week Meridian Trust failed. Businesses that kept their payroll accounts at the bank missed payroll; the businesses that sold to them missed theirs. "It\'s dominoes," said one realtor, "except the dominoes are people\'s jobs, and they don\'t stand back up when you\'re done."',
        else: 'Analysts trace the slide to a cascade of scandals that hit the city\'s biggest employers in the same season: a data broker in ruins, a software darling in court, a federal office under investigation. "Every pillar fell on the one next to it," said one. "It\'s like somebody planned it."',
      },
      'Rents are falling for the first time in a decade. So are salaries. At the Lumen Sound Employment Board, listings for programmers and network administrators are down by a third, and applications for every remaining opening are up fivefold.',
      'On Cannery Row, where the last recession never really left, residents greeted the news with a shrug. "Welcome to the neighborhood," said the owner of a Sodium Row pawn shop, who reported record business in used laptops.',
    ],
    effects: [
      { var: 'w.rent', add: -0.1 },
      { var: 'w.itSalary', add: -0.1 },
    ],
  },

  // ── 17 · Aperture in daylight (PKG-03 expose, non-hoax only; PKG-04 bonfire fire two) ──
  {
    id: 'aperture_exposed',
    headline: 'LEAKED: How a \'Marketing\' Firm Sold the City\'s Secrets',
    source: HERALD,
    category: 'crime',
    body: [
      {
        if: has('a4.bonfire_aperture_done'),
        text: 'The documents arrived everywhere at once: in the Herald\'s mailroom, on a dozen mirror sites, in the inboxes of every councilmember, prosecutor and insurance regulator in the state. By noon they had been copied so many times that Aperture Data Solutions\' lawyers had stopped sending takedown letters and started sending résumés.',
        else: 'Shortly after midnight on Saturday, a trove of internal records from Aperture Data Solutions appeared on a string of mirror sites hosted, as far as anyone can tell, everywhere. By morning, half of Port Lumen had read them.',
      },
      'The records describe a data product called PARALLAX, which Aperture has sold for years to insurers, lenders and, according to invoices included in the leak, at least one federal agency. PARALLAX assigned "risk scores" to residents of Port Lumen by correlating purchase histories, medical billing codes, phone records and internet activity — much of it, the documents suggest, bought from people who had stolen it.',
      { if: printed('insurers_riskscore'), text: 'It was PARALLAX, the records confirm, that three regional insurers used to approve and deny claims. One internal memo describes a denied hospital patient as "a successful outcome for the client."' },
      'The documents also describe a unit called "Special Accounts," which appears to have arranged favors, silences and "quiet resolutions" for Aperture\'s biggest customers. Several names in its ledger belong to elected officials.',
      { if: has('a3.folk_hero'), text: 'The leak was signed with a single handle. Nobody at the Herald knows whose it is. On Cannery Row, people are already saying it like a name they grew up with.' },
      {
        if: printed('aperture_alerted'),
        text: '"We take the privacy of every panelist extremely seriously," Aperture\'s director of compliance, Miles Hollis, said in a written statement. It was the same statement, word for word, that the company issued years ago, the last time someone complained. This time Hollis added one sentence: "I would like to speak to a lawyer."',
        else: 'Aperture\'s director of compliance, Miles Hollis, said in a written statement that the firm "takes the privacy of every panelist extremely seriously" and that the documents were "taken out of context." Asked what the context was, he said he would like to speak to a lawyer.',
      },
    ],
    effects: [{ if: is('w.aperture_state', 'thriving'), then: [{ flag: 'w.aperture_state', set: 'exposed' }] }],
  },

  // ── 18 · Aperture ends (PKG-04 publish lane with evidence; the rider owns 'destroyed') ──
  {
    id: 'aperture_destroyed',
    headline: 'Aperture Dissolved; Executives Indicted',
    source: HERALD,
    category: 'crime',
    body: [
      'A federal grand jury on Friday returned a sixty-count indictment against Aperture Data Solutions and several of its officers, and a Harbor District judge ordered the Millgate firm dissolved, its servers seized and its data "destroyed under court supervision, all of it, down to the last backup tape in the last closet."',
      'Prosecutors called the evidence "the most complete record of a criminal enterprise this office has ever received," and declined repeated requests to say who provided it. "Someone who was very careful," said one. "And someone who wanted it to be over."',
      { if: has('npc.kroll.charged'), text: 'Among those charged is Vanessa Kroll, the firm\'s vice president of "Special Accounts," who surrendered at the courthouse in a camel coat and told reporters, pleasantly, that she had "no regrets and an excellent memory."', else: 'The indictment names several officers but not the head of the firm\'s "Special Accounts" unit, whose whereabouts prosecutors described as "a subject of ongoing interest."' },
      { if: has('npc.hollis.your_ally'), text: 'Miles Hollis, Aperture\'s director of compliance, is cooperating with prosecutors. His lawyer said Hollis intends to tell prosecutors "everything, in order, with footnotes."' },
      'The insurers that licensed Aperture\'s risk scores have suspended their use "pending review." Patients denied care under the scores may be entitled to have their claims reopened. The Lumen Sound Patients\' Alliance has set up a hotline. It rang for nine hours straight on the first day.',
      {
        if: printed('aperture_alerted'),
        text: 'Outside Aperture\'s shuttered Millgate office, someone had taped a sheet of printer paper to the glass door. It read, in marker: THERE IS NO MATTER.',
        else: 'Outside Aperture\'s shuttered Millgate office, someone had taped a sheet of printer paper to the glass door. It read, in marker: WE TAKE YOUR PRIVACY EXTREMELY SERIOUSLY.',
      },
    ],
    effects: [{ flag: 'w.aperture_state', set: 'destroyed' }],
  },

  // ── 13 · The Halcyon scandal (PKG-09 fac_halcyon_q4 publishes once; the rider owns 'wobble') ──
  {
    id: 'halcyon_crash',
    headline: 'Halcyon Shares Slide as Scandal Spreads',
    source: BIZ,
    category: 'business',
    body: [
      'Shares of Halcyon Systems fell 38 percent on Wednesday after the Business Journal reported that the Millgate software company\'s largest customer — the one its IPO prospectus called "concentrated" — is a data broker with no apparent use for Halcyon\'s software.',
      'Documents reviewed by the Journal show the customer paid Halcyon millions of dollars a year in licensing fees for products it never installed, in what two former employees described as "a laundromat with a lobby slide."',
      'Founder Marcus Vale, reached on his boat, said the reports were "a misunderstanding about the nature of enterprise partnerships." Asked to describe the nature of the partnership, he said, "Visionary," and the line went dead.',
      'This is not 2001. Halcyon survived the dot-com bust on grit and free espresso, and analysts had called it the proof that Port Lumen could build something that lasted. "The bust was the market being wrong about the future," one said. "This is the company being wrong about itself. That\'s harder to come back from."',
      'The lobby slide has been closed again. A company spokesperson said it was for maintenance.',
    ],
    effects: [
      {
        if: any(is('w.halcyon_state', 'rising'), is('w.halcyon_state', 'startup')),
        then: [{ flag: 'w.halcyon_state', set: 'wobble' }],
      },
    ],
  },

  // ── 14 · Halcyon comes clean (PKG-09 Vale's reform publishes; the SOLE writer of 'clean') ──
  {
    id: 'halcyon_clean',
    headline: 'Halcyon Cuts Ties to Data Broker',
    source: BIZ,
    category: 'business',
    body: [
      'Halcyon Systems announced Monday that it has terminated every contract with Aperture Data Solutions, turned its records of the relationship over to state regulators, and restated four years of earnings to remove what founder Marcus Vale called "revenue we should never have taken, from a customer we should never have had."',
      'The restatement cuts Halcyon\'s reported revenue by nearly forty percent. The stock fell on the news, then, to the surprise of nearly everyone, rose.',
      '"I spent a long time selling the feeling that the future already arrived," Vale said at a press conference held, for the first time in company history, without fleece vests. "Turns out the future is a lot of paperwork. We\'re doing the paperwork."',
      { if: printed('halcyon_crash'), text: 'The move comes months after reports that Aperture\'s licensing fees had propped up Halcyon\'s growth. Several analysts said it was the first time they had seen a company respond to a scandal by making it smaller on purpose.' },
      'Employees described the mood on the Millgate campus as "weirdly good." The lobby slide has reopened. It is, a spokesperson noted, "just a slide now."',
    ],
    effects: [{ if: not(is('w.halcyon_state', 'dead')), then: [{ flag: 'w.halcyon_state', set: 'clean' }] }],
  },

  // ── 36 · The hospital job (PKG-06 fac_aperture_q5 "do it" publishes) ──
  {
    id: 'hospital_scandal',
    headline: 'Harbor Point General Billing Breach',
    source: HERALD,
    category: 'crime',
    body: [
      'Harbor Point General Hospital has notified more than three hundred former patients that their records were "altered by an unauthorized party" last spring, in a breach the hospital did not detect for four months.',
      'The changes were small and precise: a diagnostic code here, a history note there. Their effect was not. Patients on a single fourth-floor ward suddenly appeared, to their insurers, to be far sicker and far more expensive than they were. Claims were denied. Coverage was dropped. At least two patients delayed treatment they could not afford to pay for themselves.',
      { if: printed('insurers_riskscore'), text: 'All of the affected patients were insured by companies that price coverage using a "consumer risk score" licensed from a Millgate analytics firm. The hospital declined to speculate on whether the timing was a coincidence. So did the insurers. So, when asked, did the Millgate firm.' },
      '"Whoever did this knew exactly which boxes to change," said a nurse on the ward, who resigned in the weeks after the breach was discovered. "They didn\'t steal anything. They just made people look like they weren\'t worth saving. I don\'t know what you call that. I know it isn\'t hacking."',
      'Police said the investigation is ongoing. The hospital has hired a consultant.',
    ],
  },

  // ── 38 · Made (PKG-06 fac_aperture_q6 "take the chair" publishes) ──
  {
    id: 'kroll_made',
    headline: 'Aperture Names New Head of \'Special Accounts\'',
    source: BIZ,
    category: 'business',
    body: [
      'Aperture Data Solutions on Friday announced the appointment of {name}, {age}, as vice president of Special Accounts, succeeding Vanessa Kroll, who is "stepping back to spend time with her portfolio."',
      'The release describes the new vice president as "a Port Lumen native with an unusually complete understanding of the city\'s infrastructure, its communities and its vulnerabilities," and notes that {name} "came up through the local technology scene." It does not say which part of it.',
      { if: is('w.aperture_state', 'exposed'), text: 'The appointment is the first executive change at the embattled firm since leaked documents described Special Accounts as a "favors network" serving Aperture\'s largest clients. A spokesperson called the new hire "a fresh start," then asked that the phrase not be quoted, then said it was fine.', else: 'Few outside the firm have heard of Special Accounts. Those who have tend to lower their voices when they describe it, as if it might be listening. A spokesperson called that "a charming local superstition."' },
      'Reached at home, Kroll said she was "delighted" by the choice. "Very reasonable person," she said. "Always did the math. Tell them I said to keep a spare key."',
      'On Cannery Row, a woman who said she had known the new vice president "since they were in diapers, and a dear, dear kid" hung up without giving her name.',
    ],
  },

  // ── 20 · The badge, exposed (PKG-07 Reyes's whistle publishes) ──
  {
    id: 'bureau_scandal',
    headline: 'Federal Office Accused of Renting Tools',
    source: HERALD,
    category: 'crime',
    body: [
      'A Bureau agent assigned to the Harbor Point field office has filed a formal complaint accusing her own supervisors of "renting" surveillance capabilities from a private data broker in Millgate, bypassing warrants, oversight and, the complaint alleges, "several laws the office was created to enforce."',
      'According to procurement records attached to the complaint, the office paid for what invoices call a "risk-analytics subscription." The agent, Dana Reyes, alleges the subscription gave field agents the ability to search the phone, banking and internet records of Port Lumen residents "the way you\'d search a phone book," without a court ever knowing.',
      'Special Agent in Charge Duke Marlow, named in the complaint, has been placed on administrative leave. Reached at a Harbor Point driving range, Marlow said the office had "done nothing any reasonable person wouldn\'t do with the tools available," and asked the reporter to stand back from his swing.',
      { if: has('npc.reyes.testifies'), text: 'Reyes has agreed to testify before the city council and a federal oversight panel. Her attorney said she had surrendered her badge voluntarily. "She kept the notebook," the attorney added. "She was very clear about that part."' },
      'The Port Lumen Police Department\'s Cyber Unit, which shares no equipment with the Bureau, declined to comment. One detective was reportedly seen smiling for the first time in several years.',
    ],
  },

  // ── 43 · The Ghost King (PKG-04 end_ghost_king publishes; 2nd-person surveillance voice) ──
  {
    id: 'became_ghost_king',
    headline: 'Port Lumen \'Safest Connected City\'',
    source: BYTELINE,
    category: 'tech',
    body: [
      'For the second year running, Port Lumen has topped the Regional Connectivity Council\'s list of the "Safest Connected Cities," with reported computer crime down 71 percent and what the council calls "exceptional coordination between public agencies and private data partners."',
      'Nobody interviewed for this story could say exactly who coordinates the coordination. "It just works now," said a NorthLink spokesperson. "You don\'t see it. That\'s how you know it\'s good."',
      'Residents describe a city that is quieter, cleaner and strangely attentive. The buses run on time. Ads know your size. The pharmacy calls before you run out. "I was thinking about getting a dog," said one Millgate resident, "and the next morning I had a coupon for dog food. I hadn\'t told anybody. I hadn\'t even said it out loud."',
      { if: { faction: 'fac.hood', gte: 21 }, text: 'On Cannery Row, an anonymous benefactor has paid off the diner\'s mortgage, the clinic\'s back rent and the heating bills of every senior on three blocks. Nobody knows who. The benefactor\'s checks arrive exactly when they are needed, a day before anyone asks, as if someone somewhere had done the math.' },
      'You read this over coffee at 6:15, which is when the model predicted you would. You are Special Accounts now. You know which parts of this story are true. You wrote most of them.',
    ],
  },
]

const triggers: TriggerDef[] = [
  // ── The recession follows the bank (bible §11.3 economy-bleed loop). ~a week or two after. ──
  {
    id: 'news_desk_recession',
    when: is('w.meridian_state', 'collapsed'),
    atHour: 7,
    chance: 0.1,
    effects: [{ news: 'economy_recession' }],
  },

  // ── Press desk: print the story from the settled state it reports on (idempotent backups) ──
  {
    id: 'news_desk_mnsa_introduced',
    when: any({ quest: 'main_a3_q1_the_law_begins', status: ['active', 'completed'] }, has('a3.mnsa_live')),
    atHour: 7,
    effects: [{ news: 'mnsa_introduced' }],
  },
  { id: 'news_desk_mnsa_passed', when: all(has('a3.vote_resolved'), { var: 'w.mnsa', eq: 1 }), atHour: 7, effects: [{ news: 'mnsa_passed' }] },
  { id: 'news_desk_mnsa_gutted', when: all(has('a3.vote_resolved'), { var: 'w.mnsa', eq: 2 }), atHour: 7, effects: [{ news: 'mnsa_gutted' }] },
  {
    id: 'news_desk_mnsa_failed',
    when: all(has('a3.vote_resolved'), { var: 'w.mnsa', eq: 0 }, not(printed('mnsa_passed')), not(printed('mnsa_gutted'))),
    atHour: 7,
    effects: [{ news: 'mnsa_failed' }],
  },
  {
    id: 'news_desk_dee_swing_vote',
    when: all(has('a3.vote_resolved'), has('npc.dee.council'), { var: 'a3.votescore', gte: -9, lte: 9 }),
    atHour: 7,
    effects: [{ news: 'dee_swing_vote' }],
  },
  {
    // The drain succeeded (a failed run is `a3.burned`; the solo cipher pull only breaches).
    id: 'news_desk_meridian_collapse',
    when: all(has('a3.heist_resolved'), is('a3.route', 'drain'), not(has('a3.burned')), not(has('a3.ghost_protocol'))),
    atHour: 7,
    effects: [{ news: 'meridian_collapse' }],
  },
  {
    // The non-hoax expose makes you a folk hero; the bonfire's second fire hands Aperture to everyone.
    id: 'news_desk_aperture_exposed',
    when: any(has('a3.folk_hero'), has('a4.bonfire_aperture_done')),
    atHour: 7,
    effects: [{ news: 'aperture_exposed' }],
  },
  { id: 'news_desk_halcyon_clean', when: all(actGte(3), has('npc.vale.reformed')), atHour: 7, effects: [{ news: 'halcyon_clean' }] },
  { id: 'news_desk_hospital_scandal', when: has('fac.aperture.hospital_done'), atHour: 7, effects: [{ news: 'hospital_scandal' }] },
  { id: 'news_desk_kroll_made', when: { npc: 'kroll', fate: 'made_you' }, atHour: 7, effects: [{ news: 'kroll_made' }] },
  { id: 'news_desk_bureau_scandal', when: has('npc.marlow.exposed'), atHour: 7, effects: [{ news: 'bureau_scandal' }] },
]

export default defineContent({ news, triggers })
