/**
 * PKG-16 — Story headlines about the Row and the scene (bible §11.4 items 22–24, 27, 41): Corvid's
 * sentence, Dad's second act, the Cathode saved or lost, and the mill that came back as something
 * else.
 *
 * Single-count rule: the `w.hood_soul` swings for the Cathode live here, not in PKG-10's quest.
 * `w.datacenter_open` itself is PKG-15's (`trig_datacenter_open` sets it, then publishes).
 */
import { defineContent } from '@/engine/registry'
import type { NewsDef, TriggerDef } from '@/engine/types'
import { has, printed } from './_shared'

const HERALD = 'The Lumen Herald'
const BIZ = 'Port Lumen Business Journal'
const CRIER = 'The Row Crier'

const news: NewsDef[] = [
  // ── 22 · Corvid goes down (PKG-05 corvidSentenced publishes) ──────────────
  {
    id: 'corvid_trial',
    headline: '\'Sysop\' Sentenced to 8 Years',
    source: HERALD,
    category: 'crime',
    body: [
      'Eleanor Voss, a Sodium Row woman known online by the handle "Corvid," was sentenced Thursday to eight years in federal prison for operating what prosecutors called "the organizing hub of Port Lumen\'s computer underground for nearly two decades."',
      'Voss, whom prosecutors described as the "sysop," or system operator, of an invitation-only bulletin board called the Loft, was not accused of breaking into any computer herself. She was convicted of conspiracy for running the place where others talked about it — and for refusing, across fourteen months of pretrial detention, to name a single one of them.',
      '"The government offered my client a deal every week," her attorney said. "Every week she said the same thing. I\'m told it\'s a phrase from the scene. I won\'t repeat it in a family newspaper."',
      { if: has('a2.solidarity'), text: 'Investigators acknowledged in court that the case had been "hampered" by a coordinated wipe of dozens of computers across the city on the night of an earlier raid. The judge asked who had organized it. Nobody in the gallery answered. Several people smiled.' },
      'Voss made no statement at sentencing. Supporters later circulated what they said was her final message to the board, posted the night before she surrendered. It was two lines long: "Keep the lights on. Don\'t sell the building."',
    ],
  },

  // ── 27 · Dad's second act (PKG-10 trig_hood_dad_booked_solid publishes) ──
  {
    id: 'dad_business',
    headline: 'Cannery Row\'s Own \'PC Doctor\'',
    source: CRIER,
    category: 'local',
    body: [
      'If your computer has made a noise it shouldn\'t, gone blue at the worst possible moment, or started showing you advertisements for things you have never wanted, you have probably already heard the name Robert Tan. If you haven\'t, ask anybody on the Row. They have his card. He gave it to them. Twice.',
      { if: printed('mill_layoffs'), text: 'Tan ran the paper line at the Millgate mill for twenty years until the layoffs of 2001. "They told me the machine didn\'t need fixing anymore, it needed a computer," he says. "So I figured, fine. I\'ll learn to fix the computer."', else: 'Tan spent twenty years keeping the paper line running at the Millgate mill. "My father fixed radios," he says. "I fixed the line. Now I fix these. Long as somebody in the family can fix something."' },
      'He learned, he says, from his kid — "who was very patient with me, mostly, and only sighed a few hundred times" — and from a stack of library books he still keeps in a milk crate in the trunk of his car. These days he is booked three weeks out.',
      'His rates are reasonable and, for seniors, negotiable. Several customers report paying in casseroles. One paid with a working snowblower. "It was a fair trade," Tan says. "Her hard drive was in rough shape. So was the snowblower. I fixed that too."',
      'Asked for his best advice for readers, Tan considered the question for a long moment. "Back up your pictures," he said. "And check your oil."',
    ],
  },

  // ── 24 · The Row buys the Cathode (PKG-10 fac_hood_q4 publishes on side.saved_cathode) ──
  {
    id: 'cathode_saved',
    headline: 'Neighbors Buy the Cathode',
    source: CRIER,
    category: 'local',
    body: [
      'The Cathode Diner is staying open, and as of Friday it belongs, in a small way, to everybody.',
      'More than two hundred Cannery Row residents pooled their money to buy the building out from under Harborline Properties, which had offered owner Sal Moretti a sum he described as "enough to retire on, and not enough to live with." The deed is held by a neighborhood trust. Sal keeps the grill. The trust keeps the rent where it has been since 1987.',
      'The contributions ranged from a Harbor Point dentist\'s cashier\'s check to a coffee can of quarters from the third-graders at Row Elementary, who asked that their share be used "for the pie."',
      { if: printed('mom_fundraiser'), text: '"This street passed the hat for one of its own in this room once," Sal said. "Now it passed the hat for the room. I keep telling people you kids and your modems couldn\'t do what a coffee can does. I was wrong. You did it with both."' },
      'A plaque by the register lists every contributor. It is very long, very small and slightly crooked. Sal says he will fix it. Nobody believes him.',
    ],
    effects: [{ var: 'w.hood_soul', add: 1 }],
  },

  // ── 23 · The Cathode closes (PKG-10 fac_hood_q4 closed stage publishes) ──
  {
    id: 'cathode_closes',
    headline: 'Beloved Diner Closes',
    source: CRIER,
    category: 'local',
    body: [
      'After fifty-four years, the Cathode Diner on Cannery Row will serve its last cup of coffee this weekend. Owner Sal Moretti has sold the building to Harborline Properties, which plans to replace it with "mixed-use live-work lofts with a curated ground-floor café concept."',
      { if: has('fac.hood.cathode_timed_out'), text: 'Neighbors said they had tried to raise the money to keep it, but ran out of time. "Everybody meant to," said one. "Meaning to is how you lose things on this street."', else: '"I held out as long as I could," Sal said. "Then I looked at the number, and I looked at my knees, and my knees won."' },
      'The Cathode has hosted, by the Crier\'s count, four wedding receptions, eleven wakes, a thirty-one-hour benefit, uncountable job interviews, and the entire courtship of at least three couples still married today. Its neon sign — a cathode-ray tube with a coffee cup inside it, lit continuously since 1971 — goes with Sal.',
      { if: printed('jax_arrest'), text: 'Sal says he will also take one booth, the one by the window, which nobody has sat in for years. He would not say why. Everyone on the Row already knows.' },
      'The last night is Saturday. Pie is free. Sal asks that nobody make a speech, which means, regulars say, there will be several.',
    ],
    effects: [{ var: 'w.hood_soul', add: -1 }],
  },

  // ── 41 · The mill comes back (PKG-15 trig_datacenter_open publishes at Act III start) ──
  {
    id: 'mill_datacenter',
    headline: 'Old Paper Mill Reopens as \'Data Campus\'',
    source: BIZ,
    category: 'business',
    body: [
      'The idle half of the Millgate paper mill hummed back to life this week — not with pulp, but with servers. A consortium of regional technology firms has converted the building into what it calls the Millgate Data Campus: a hundred and ten thousand square feet of climate-controlled racks sitting, as a spokesperson put it, "on the best electrical feed in the Sound."',
      'The consortium declined to list its tenants. NorthLink confirmed it leases "a portion" of the space. Other tenants, the spokesperson said, are "partners in the analytics sector who value discretion."',
      { if: printed('mill_layoffs'), text: 'The facility employs thirty-one people, most of them security guards and technicians. The mill once employed six hundred. Asked whether the campus would hire former mill workers, the spokesperson said the company "values the heritage of the site" and would be "honoring it with a tasteful mural in the lobby."' },
      { if: has('npc.dad.mill_job'), text: 'At least one former millhand has already been hired, for the overnight shift. "Same floor I worked twenty years," he said. "Only now it\'s cold, and nothing needs me to fix it. I just walk around and make sure it stays that way."' },
      'Residents on Cannery Row report that on still nights, the mill\'s old smokestack no longer smokes. Instead it hums — a low, steady note, like something breathing in its sleep.',
    ],
  },
]

const triggers: TriggerDef[] = [
  // ── Press desk: print the story from the settled state it reports on (idempotent backups) ──
  { id: 'news_desk_corvid_trial', when: { npc: 'corvid', fate: 'martyred' }, atHour: 7, effects: [{ news: 'corvid_trial' }] },
  { id: 'news_desk_cathode_saved', when: has('side.saved_cathode'), atHour: 7, effects: [{ news: 'cathode_saved' }] },
  { id: 'news_desk_cathode_closes', when: { var: 'w.cathode_open', eq: 0 }, atHour: 7, effects: [{ news: 'cathode_closes' }] },
  { id: 'news_desk_mill_datacenter', when: { var: 'w.datacenter_open', gte: 1 }, atHour: 7, effects: [{ news: 'mill_datacenter' }] },
]

export default defineContent({ news, triggers })
