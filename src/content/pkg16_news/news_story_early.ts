/**
 * PKG-16 — Story headlines, Act I and Act II (bible §11.4 items 1–6, 12, 19, 25, 28, 29, 32, 33),
 * plus the Act II system triggers this package owns: `trig_bureau_office`, `trig_halcyon_ipo`.
 *
 * Single-count rule: every world delta below lives on the NewsDef. The story beats that publish
 * these headlines (PKG-01 layoffs & abuse report, PKG-02 raid & Mom's crisis, PKG-15 council &
 * broadband, PKG-09 IPO party) only publish; they never touch the var themselves.
 *
 * Bodies read state at render time, so every conditional paragraph keys off state that is already
 * settled when the paper prints (flags set before publication, or other headlines via `{ news }`).
 */
import { defineContent } from '@/engine/registry'
import type { NewsDef, TriggerDef } from '@/engine/types'
import { actGte, all, any, d, has, is, not, printed } from './_shared'

const HERALD = 'The Lumen Herald'
const BIZ = 'Port Lumen Business Journal'
const CRIER = 'The Row Crier'
const BYTELINE = 'ByteLine Weekly'

const news: NewsDef[] = [
  // 1 ── The mill (PKG-01 main_a1_q5 publishes; this rider owns w.mill_open).
  {
    id: 'mill_layoffs',
    headline: 'Port Lumen Paper Sheds 200 Jobs',
    source: HERALD,
    category: 'business',
    body: [
      'Port Lumen Paper & Pulp will lay off roughly 200 workers at its Millgate mill before the end of the month, the company confirmed Tuesday, citing "soft demand, rising energy costs and the transition to a leaner, more digital operation."',
      'The mill has run three shifts a day since 1953. Beginning next month it will run one. Gus Arnaud, president of Paperworkers Local 88, said members learned of the cuts from a notice taped beside the time clock. "Twenty, thirty years on that line," Arnaud said, "and they tape it to the clock. Not even a staple. Tape."',
      'On Cannery Row, where many mill families live, the news landed at dinner. "My husband fixed that machine every week for twenty years," one resident said outside the Cathode Diner. "Now they tell him the machine doesn\'t need fixing. It needs a computer."',
      'A company spokesperson declined to say what will become of the idle half of the plant, noting only that "several parties have expressed interest in the site\'s power infrastructure." The mill sits on the city\'s cheapest high-capacity electrical feed.',
    ],
    effects: [{ var: 'w.mill_open', set: 0 }],
  },

  // 2 ── Grandma's botnet, reported (PKG-01 CP-A2 C publishes; this rider owns the heat delta).
  {
    id: 'aperture_alerted',
    headline: 'Abuse Complaints Shrugged Off as Aperture Posts Record Quarter',
    source: BIZ,
    category: 'business',
    body: [
      'Aperture Data Solutions, the Millgate "consumer insight" firm few residents have heard of, reported its strongest quarter to date on Thursday, with revenue up 61 percent on what executives called "unprecedented demand for clean, correlated audience data."',
      'The same week, NorthLink confirmed it had received a customer report of unusual traffic flowing from several home computers on Cannery Row to an address block registered to Aperture. The firm described the traffic as "opt-in research panel software that some panelists may have forgotten installing."',
      '"We take the privacy of every panelist extremely seriously," said Miles Hollis, Aperture\'s director of compliance, in a written statement. "We have reviewed the matter thoroughly. There is no matter."',
      'NorthLink closed the ticket the following morning. Aperture\'s shares, which trade over the counter, rose four percent.',
    ],
    effects: [
      { var: 'w.aperture_alerted', set: 1 },
      { var: 'w.heatGain', add: 0.1 },
    ],
  },

  // 3 ── The first raid, public (PKG-02 main_a2_q5 publishes; backup below).
  {
    id: 'first_raid_public',
    headline: 'PD Cyber Seizes \'Hacker Cache\'',
    source: HERALD,
    category: 'crime',
    body: [
      'Officers from the Port Lumen Police Department\'s Cyber Unit executed a search warrant before dawn Wednesday and carried out what one detective described as "a truckload of beige."',
      { if: is('a2.raid_target', 'corvid'), text: 'The target was a windowless back room on Sodium Row that investigators believe hosted an underground computer bulletin board. The room\'s leaseholder, a woman in her forties, was questioned and released.' },
      { if: is('a2.raid_target', 'player'), text: 'The target was a family apartment on Cannery Row. Neighbors watched officers carry out a computer tower, a monitor and several shoeboxes of CD-Rs while a woman in a bathrobe stood on the stoop and asked whether anyone wanted coffee.' },
      { if: is('a2.raid_target', 'jax'), text: 'The target was a basement apartment on Cannery Row rented by a young man well known at the Cathode Diner, where a waitress described him as "the funniest kid on the Row, God help him."' },
      { if: is('a2.raid_target', 'byteme'), text: 'The target was the bedroom of a Cannery Row teenager, whose mother told reporters he had "promised, on his grandmother, that the computer was for homework."' },
      'Items seized included computers, pagers, "several hundred" burned discs and what the unit\'s inventory lists as "one (1) shoebox, floppy disks, unlabeled, approx. 51."',
      { if: has('a2.solidarity'), text: 'Detectives privately expressed frustration that at least forty computers across the city appear to have been wiped on the same night, within the same hour. "It\'s like they have a phone tree," one said. "It\'s like it\'s 1994."' },
      { if: has('a2.clean_raid'), text: 'A department source said the drives recovered so far had been "wiped cleaner than a church floor."' },
      '"We have a budget of nothing and a modem from 1997," said Detective Ruth Calderon, "and we\'re still going to ruin somebody\'s year." A representative of the new federal task force in Harbor Point observed the search but declined to comment.',
    ],
  },

  // 4 ── Jax (PKG-02 raid / PKG-07 burn notice set the fate; published on the fate).
  {
    id: 'jax_arrest',
    headline: 'Local Man Charged in Data Theft',
    source: HERALD,
    category: 'crime',
    body: [
      'Jacob Ferreira, a Cannery Row man in his twenties, was charged Monday with unauthorized computer access and theft of customer records, according to documents filed in Harbor District court.',
      {
        if: any(has('life.dirty_bank_money'), is('a3.route', 'drain')),
        text: 'Prosecutors allege Ferreira was part of a loosely organized group behind a string of intrusions at Meridian Trust Bank, and that "others, not yet identified" directed the work. They did not say who.',
        else: 'Prosecutors allege Ferreira sold stolen marketing records to a buyer they did not identify, describing him as "a small fish who swam into a very large net."',
      },
      'Ferreira\'s public defender called the charges "wildly overstated" and said her client had taken the work "to pay a child\'s hospital bills, which is a sentence I would like everyone in this city to sit with for a minute."',
      'At the Cathode Diner, where Ferreira was a regular, the owner declined to comment beyond pointing at a booth by the window. "That\'s his," Sal Moretti said. "Nobody sits there."',
    ],
  },

  // 5 ── The Row carries Mom (PKG-02 CP-B3 C publishes; this rider is the ONLY +1 hood_soul for it).
  {
    id: 'mom_fundraiser',
    headline: 'Cannery Row Diner Hosts Benefit',
    source: CRIER,
    category: 'local',
    body: [
      'The Cathode Diner stayed open past its own record on Saturday: thirty-one straight hours of pie, chili and a coffee can on the counter for {npc:mom}, a Cannery Row mother of two whose hospital bills arrived all at once and in capital letters.',
      'Neighbors brought casseroles nobody ordered. The Knights of the Harbor ran a raffle for a used snowblower. A retired telephone operator auctioned off "a story you won\'t believe about the mayor\'s father" and got forty dollars for it.',
      '"You kids and your modems," owner Sal Moretti said, handing a teenager a slice of lemon meringue. "In my day you passed the hat. Turns out you still pass the hat. Eat."',
      'Organizers would not say how much was raised. "Enough," said one, "and that\'s the only number that matters on this street."',
    ],
    effects: [{ var: 'w.hood_soul', add: 1 }],
  },

  // 6 ── PARALLAX reaches the insurers (PKG-02 / PKG-15 publish).
  {
    id: 'insurers_riskscore',
    headline: 'Insurers Adopt \'Risk Scoring\'',
    source: BIZ,
    category: 'business',
    body: [
      'Three of the region\'s largest health insurers have quietly begun pricing and approving claims with the help of a "consumer risk score," a data product licensed from a Millgate analytics firm the companies declined to name.',
      'The score blends purchase histories, public records and what one industry document calls "household behavioral indicators." Insurers say it lets them "reward healthy living." Patient advocates say it lets them say no faster.',
      '"We had a woman denied a procedure because her score flagged household stress," said Tamsin Kaye of the Lumen Sound Patients\' Alliance. "One of the stress indicators was late-night internet use by a member of the household. Her son. He\'s nineteen. Of course he\'s up late."',
      'None of the insurers would explain how a score is calculated, or how a customer can see their own.',
    ],
  },

  // 12 ── The IPO (trig_halcyon_ipo below; this rider owns the 'rising' step).
  {
    id: 'halcyon_ipo',
    headline: 'Halcyon Soars on Debut',
    source: BIZ,
    category: 'business',
    body: [
      'Halcyon Systems, the Millgate software company that survived the dot-com bust on free espresso and sheer nerve, more than doubled on its first day of public trading, closing at $41.20 against an offering price of $18.',
      'Founder and chief executive Marcus Vale rang the opening bell by modem, from the company\'s Millgate campus, over a speakerphone held up to a microphone. "I\'m not selling software," he told a crowd of employees in matching fleece vests. "I\'m selling the feeling that the future already arrived and you\'re standing in it."',
      'The company\'s lobby slide, briefly closed after an incident involving a regional sales manager, reopened for the occasion.',
      'Analysts praised Halcyon\'s "remarkably stable" enterprise customer base, which a prospectus footnote describes as "concentrated."',
    ],
    effects: [{ if: is('w.halcyon_state', 'startup'), then: [{ flag: 'w.halcyon_state', set: 'rising' }] }],
  },

  // 19 ── The Bureau arrives (trig_bureau_office below).
  {
    id: 'bureau_office',
    headline: 'Federal Task Force Opens Field Office',
    source: HERALD,
    category: 'local',
    body: [
      'The Bureau, the federal government\'s cyber-enforcement agency, has opened a permanent field office in Harbor Point, taking the fourth floor of the Quayside Building above a pediatric dentist.',
      '"Port Lumen has a great deal of wire and very few people watching it," said Special Agent in Charge Duke Marlow, who described the office as "a partnership with local industry and local law enforcement, in that order." Asked which local industries, he smiled and said, "The ones with the most data."',
      'The Port Lumen Police Department\'s three-detective Cyber Unit said it welcomed the help. One detective, asked privately whether the Bureau would share its new equipment, laughed for some time.',
      'The office is hiring. Applicants are asked to bring two forms of identification and "an open mind about privacy."',
    ],
  },

  // 25 ── Dee wins (PKG-15 trig_dee_council publishes; backup below).
  {
    id: 'dee_council',
    headline: 'Former Retail Manager Wins Council Seat',
    source: HERALD,
    category: 'local',
    body: [
      'Dolores "Dee" Briggs, a former CompCastle store manager with no political experience and a campaign website that played a MIDI version of the national anthem on loop, has won the Cannery Row–Millgate seat on the city council.',
      'Briggs ran on a platform of "fixing what\'s broken, starting with the parking meters." Her campaign slogan, painted by volunteers on a bedsheet outside the Cathode Diner, read: I WILL HEAL THIS CITY.',
      '"In retail, you learn the customer is never wrong, even when the customer\'s monitor is unplugged," Briggs said at her victory party. "Especially then. You don\'t argue with the city. You plug the city back in."',
      'She said her first act as councilwoman would be to "read everything, every single page, twice," a promise that alarmed several of her new colleagues.',
    ],
  },

  // 28 ── The recovery (dated ~2004; this rider is the SOLE recovery source for w.itSalary).
  {
    id: 'dotcom_recovery',
    headline: 'Tech Hiring Rebounds',
    source: BIZ,
    category: 'business',
    body: [
      'Two years after the bust emptied half of Millgate\'s loft offices, tech employers are hiring again. Listings for programmers, network administrators and help-desk staff are up 40 percent over last spring, according to the Lumen Sound Employment Board.',
      '"The difference is, this time they want to see a working product before they buy the foosball table," said one recruiter. Starting salaries for junior developers have climbed back to their 2000 peak.',
      'Not everyone is celebrating. "I got laid off in \'02 by a company that paid me in stock," said a former webmaster now working the counter at a Sodium Row copy shop. "Now they call me every day. I screen them. It\'s the best part of my week."',
    ],
    effects: [{ var: 'w.itSalary', add: 0.2 }],
  },

  // 29 ── Heat high (press desk trigger below).
  {
    id: 'crackdown',
    headline: 'Mayor Vows \'Zero Tolerance\'',
    source: HERALD,
    category: 'crime',
    body: [
      'Mayor Constance Whitlow promised "zero tolerance for keyboard criminals" on Tuesday after a string of intrusions at local businesses, announcing new overtime money for the police Cyber Unit and a hotline for residents who "notice unusual computer activity in their neighborhood."',
      '"If your neighbor\'s lights are on at four in the morning and you hear screeching," the mayor said, referring to the sound of a dial-up modem, "that\'s worth a phone call."',
      'Civil liberties advocates noted that the description also fits most of the city\'s nurses, bakers and college students.',
      'The hotline received 212 calls in its first week. Police said 190 concerned cordless-phone interference.',
    ],
  },

  // 32 ── Broadband (PKG-15 life_broadband_arrives steps w.broadband; published on the step).
  {
    id: 'broadband_harbor',
    headline: 'NorthLink Brings \'Always-On\' to Harbor Point First',
    source: BYTELINE,
    category: 'tech',
    body: [
      'NorthLink has switched on "always-on" DSL service for Harbor Point, promising speeds "up to twenty times faster than dial-up" and "no more busy signals, ever."',
      'Cannery Row, Sodium Row and the Flats will get the service "in a later phase," according to a NorthLink map on which those neighborhoods are colored a hopeful shade of grey.',
      '"We run the pipe to where the pipe pays for itself," said Wes Tran, NorthLink\'s operations manager. "I just run the pipe, man. Somebody else draws the map."',
      'Early adopters report that the connection is fast, reliable, and eerily quiet. "I keep waiting for the handshake," said one. "The screech. It never comes. I kind of miss it."',
    ],
  },

  // 33 ── The song-swapping suit (dated ~2002).
  {
    id: 'napster_suit',
    headline: 'Music Industry Sues Local Teens',
    source: HERALD,
    category: 'culture',
    body: [
      'The Phonographic Rights Alliance has filed suit against eleven Port Lumen residents it accuses of trading copyrighted songs over a file-sharing program, seeking damages of up to $150,000 per song.',
      'The youngest defendant is twelve. Her mother said the girl had downloaded "one song, eleven times, because the first ten kept cutting off at the chorus."',
      'Another defendant, a seventeen-year-old Cannery Row boy known at the Sodium Row arcades for holding every high score in the building, told reporters he was "basically a god" and then, after a word from his mother, that he had "no comment at this time."',
      'The Alliance said the suits were "about education." A spokesperson did not say what the lesson was.',
    ],
  },
]

const triggers: TriggerDef[] = [
  // ── System triggers owned by PKG-16 (bible §9.0) ──
  {
    // Act II start: the Bureau sets up shop (not first contact — that comes later).
    id: 'trig_bureau_office',
    when: actGte(2),
    atHour: 8,
    effects: [{ news: 'bureau_office' }],
  },
  {
    // ~2004: Halcyon survives the bust and IPOs on the recovery.
    id: 'trig_halcyon_ipo',
    when: all({ day: true, gte: 1000 }, is('w.halcyon_state', 'startup')),
    atHour: 9,
    effects: [{ news: 'halcyon_ipo' }],
  },

  // ── Dated era headlines ──
  { id: 'news_desk_napster_suit', when: { day: true, gte: 365 }, atHour: 7, chance: 0.2, effects: [{ news: 'napster_suit' }] },
  { id: 'news_desk_dotcom_recovery', when: { day: true, gte: d(2004, 5, 10) }, atHour: 7, effects: [{ news: 'dotcom_recovery' }] },

  // ── Press desk: print the story from the state it reports on (idempotent backups) ──
  { id: 'news_desk_first_raid', when: has('a2.first_raid_resolved'), atHour: 7, effects: [{ news: 'first_raid_public' }] },
  { id: 'news_desk_jax_arrest', when: { npc: 'jax', fate: 'arrested' }, atHour: 7, effects: [{ news: 'jax_arrest' }] },
  { id: 'news_desk_mom_fundraiser', when: has('life.hood_carried_you'), atHour: 8, effects: [{ news: 'mom_fundraiser' }] },
  {
    id: 'news_desk_insurers',
    when: all({ var: 'w.enclosure', gte: 2 }, is('w.aperture_state', 'thriving'), any(has('a2.mom_crisis_resolved'), { var: 'sys.hospitalized', gte: 1 })),
    atHour: 7,
    chance: 0.25,
    effects: [{ news: 'insurers_riskscore' }],
  },
  { id: 'news_desk_dee_council', when: has('npc.dee.council'), atHour: 7, effects: [{ news: 'dee_council' }] },
  { id: 'news_desk_broadband', when: { var: 'w.broadband', gte: 1 }, atHour: 7, effects: [{ news: 'broadband_harbor' }] },
  {
    // The crackdown loop (§11.3): sustained heat in the city draws the mayor out.
    id: 'news_desk_crackdown',
    when: all(actGte(2), any({ stat: 'heat', gte: 55 }, { var: 'sys.raids', gte: 2 }), not(printed('crackdown'))),
    atHour: 7,
    effects: [{ news: 'crackdown' }],
  },
]

export default defineContent({ news, triggers })
