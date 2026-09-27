/**
 * PKG-00 — the five factions of Port Lumen (bible §3).
 *
 * Rep is a signed integer −100..+100. Tier labels are shared by every faction so that the
 * bible's "Known / Trusted / Inner" language means the same thing everywhere:
 *   Hostile ≤ −40 · Wary −39..−1 · Neutral 0..19 · Known 20..49 · Trusted 50..79 · Inner ≥ 80.
 */
import { defineContent } from '@/engine/registry'
import type { FactionDef } from '@/engine/types'

const TIERS: FactionDef['ranks'] = [
  { at: -100, label: 'Hostile' },
  { at: -39, label: 'Wary' },
  { at: 0, label: 'Neutral' },
  { at: 20, label: 'Known' },
  { at: 50, label: 'Trusted' },
  { at: 80, label: 'Inner' },
]

export default defineContent({
  factions: [
    {
      id: 'fac.loft',
      name: 'The Loft',
      short: 'Loft',
      color: '#2f7a4a',
      icon: '⌂',
      ranks: TIERS,
      desc: [
        "Port Lumen's underground scene: not a syndicate, a friend group with a private board and a back room above a pager shop on Sodium Row. Warez, phone-line folklore, mutual aid, enormous egos and one ancient couch that has absorbed a decade of spilled cola.",
        'Corvid has run the board since the BBS days and keeps its one law: we don\'t rat. Switch thinks the scene should finally get paid. Both of them think they are protecting it.',
        'Known (20): the Loft contract board and tool trades at cost. Trusted (50): the back room as a base, one alibi per act, and friends who won\'t flip on you — unless you let the friendship rot. Inner (80): the safehouse, the good tools, and a clean shot at the sysop chair.',
        'They love: shared tools, leaks that are given away, members protected from heat. They hate: selling out a member, hoarding for profit, anyone with a badge, anyone with Aperture money.',
        { if: { flag: 'fac.loft.side_corvid' }, text: 'You backed Corvid in the schism. The commons stays a commons, as long as someone keeps paying for it in other ways.' },
        { if: { flag: 'fac.loft.side_switch' }, text: 'You backed Switch in the schism. The scene is getting paid now. Nobody agrees on what it cost.' },
        { if: { flag: 'w.scene_state', eq: 'bleeding' }, text: 'Lately the board is quieter. Old handles go dark one by one, and the ones that stay talk about rates.' },
        { if: { flag: 'w.scene_state', eq: 'dark' }, text: 'The board is dark. The back room is a storage closet again. Somebody still pays the electric bill, out of habit or grief.' },
        { if: { flag: 'w.scene_state', eq: 'reformed' }, text: 'The board is back: smaller, careful, and cleaner than it ever was. The couch survived.' },
      ],
    },
    {
      id: 'fac.aperture',
      name: 'Aperture Data Solutions',
      short: 'Aperture',
      color: '#8e1b3a',
      icon: '◉',
      ranks: TIERS,
      // Hidden until the player has any real contact with Aperture's orbit.
      revealWhen: {
        any: [
          { flag: 'a1.grandma_done' },
          { npc: 'kroll', met: true },
          { faction: 'fac.aperture', gte: 1 },
          { faction: 'fac.aperture', lte: -1 },
        ],
      },
      desc: [
        'A "data hygiene and consumer insight" firm in a converted Millgate warehouse, with a lobby fountain and a receptionist who remembers your name the second time. Its product is PARALLAX, a risk-scoring engine that insurers adore.',
        { if: { npc: 'kroll', met: true }, text: 'Vanessa Kroll runs Special Accounts: the part of Aperture that buys what other people steal and washes it until it looks like a spreadsheet. She is warm, funny and never lies to you. Miles Hollis, from Compliance, would like her chair and considers you an open file.' },
        'Known (20): clean-looking contracts with ugly insides and fat pay. Trusted (50): a career track, lawyers who shrink fines, and problems that go away. Inner (80): a retainer, and a road to a seat at the table.',
        'They reward delivery, discretion and quiet profitable betrayal. They punish leaks, sermons, and anyone who helps the Bureau look at them too closely. Every step toward them costs you something with the Loft.',
        { if: { flag: 'a3.truth_t1' }, text: 'You know what it really is now: the laundry at the center of the city. Breaches go in one side, PARALLAX comes out the other, NorthLink carries it and the Bureau rents it.' },
        { if: { flag: 'w.aperture_state', eq: 'exposed' }, text: 'The leak is everywhere. Reporters camp outside the fountain. Aperture\'s statement says "a small number of legacy contractors" twelve times.' },
        { if: { flag: 'w.aperture_state', eq: 'destroyed' }, text: 'Dissolved. The warehouse is for lease. The fountain has been drained, and someone has written a handle in the dust at the bottom.' },
      ],
    },
    {
      id: 'fac.bureau',
      name: 'The Bureau',
      short: 'Bureau',
      color: '#2b3f5c',
      icon: '★',
      ranks: TIERS,
      // The federal office arrives in Act II; before that it is just a rumor on the board.
      revealWhen: {
        any: [
          { var: 'act', gte: 2 },
          { npc: 'reyes', met: true },
          { faction: 'fac.bureau', gte: 1 },
          { faction: 'fac.bureau', lte: -1 },
        ],
      },
      desc: [
        'The federal cyber-enforcement effort, riding the post-crisis money into a Port Lumen satellite office with new carpet and old coffee. They arrived in Act II and have not left.',
        { if: { npc: 'reyes', met: true }, text: 'Agent Dana Reyes came here to catch the people hollowing out the city and is finding out her own office rents their tools. Her boss, SAC Duke Marlow, calls Aperture "the map" and does not want it set on fire.' },
        'Known (20): the harassment stops. Trusted (50): immunity deals, a consultant stipend, and raid protection while you are an active asset — on sanctioned work only. Inner (80): a clean record and the power to make somebody else\'s year very bad.',
        'They reward informing, flipping, evidence and closed cases. They punish tip-offs, destroyed evidence and going dark. Every delivery you make costs you with the Loft, and they know it.',
        { if: { flag: 'fac.bureau.informant' }, text: 'You are on their books now. There is a number you call, and a number that calls you.' },
        { if: { flag: 'npc.marlow.exposed' }, text: 'The office is in the news for the wrong reasons. The new carpet is still there.' },
      ],
    },
    {
      id: 'fac.halcyon',
      name: 'The Legit Ladder',
      short: 'Legit',
      color: '#0a7e8c',
      icon: '◆',
      ranks: TIERS,
      desc: [
        'The straight world: CompCastle\'s service bench, NorthLink\'s network ops, the Lumen State placement office — and at the top of the ladder, Halcyon Systems, the dot-com darling selling "project management for the connected enterprise" out of a Millgate loft with a slide in it.',
        'This is how a normal life happens: a title, a badge, stock options, a 401k, dental. It can be a slow death of the soul or a genuinely good life. Most people get a bit of both.',
        'Known (20): the Halcyon interview and a junior dev seat. Trusted (50): promotions, real health insurance, and options that vest. Inner (80): executive power — enough to protect your friends, or to become the thing they needed protecting from.',
        'They reward shipping, promotions, closed deals and staying clean. They punish moonlighting, scandals and sabotage. Priya Raman works here. So does Marcus Vale, and Marcus Vale is always working.',
        { if: { flag: 'a3.truth_t1' }, text: 'You know whose money keeps the slide polished now. Halcyon is Aperture\'s clean shirt.' },
        { if: { flag: 'w.halcyon_state', eq: 'rising' }, text: 'Halcyon is public now. The stock ticker runs across the lobby wall and people check it the way they used to check the weather.' },
        { if: { flag: 'w.halcyon_state', eq: 'wobble' }, text: 'The ticker in the lobby has been switched off "for maintenance."' },
        { if: { flag: 'w.halcyon_state', eq: 'clean' }, text: 'Halcyon cut its ties to the data broker. Smaller now, poorer, and for the first time in years nobody lowers their voice in the elevator.' },
        { if: { flag: 'w.halcyon_state', eq: 'dead' }, text: 'Halcyon is gone. Somebody bought the slide at the liquidation auction.' },
      ],
    },
    {
      id: 'fac.hood',
      name: 'The Neighborhood',
      short: 'Row',
      color: '#a4561f',
      icon: '☕',
      ranks: TIERS,
      desc: [
        'Cannery Row, the Flats: your parents, the neighbors, the Cathode Diner, the old BBS grognards and the church-basement computer class. Nobody runs it. Nobody can buy it. It is where you are from, whether you like it or not.',
        'Sal keeps the coffee on at the Cathode. Mom keeps count of who has eaten. Marge Osgood, who patched this city\'s phone calls for thirty years, keeps the stories.',
        'Known (20): home cooking and the Cathode as places to put yourself back together, and Row volunteering. Trusted (50): gossip worth hearing, forgiveness, and cheap Row rent. Inner (80): not for sale — the Row carries you when everything else drops you.',
        'They love it when you help a neighbor, show up for family, stay human, and keep the diner open. They notice neglect, heat on their doorsteps, and a kid who became a stranger. No rival faction hates them. They are simply the price of everything else.',
        { if: { var: 'w.cathode_open', eq: 0 }, text: 'The Cathode is closed. People still meet on the corner out of habit, and then stand there not knowing where to go.' },
        { if: { var: 'w.hood_soul', gte: 2 }, text: 'Something holds here that didn\'t break. People leave the porch lights on.' },
      ],
    },
  ],
})
