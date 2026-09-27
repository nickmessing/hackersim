/**
 * PKG-10 — fac_hood_q4_save_cathode, "Save the Cathode" (bible §7.5 step 4).
 *
 * Gentrification reaches Sodium Row. The estate that owns the Cathode's building has sold the
 * block to Harborline Renewal Partners; Sal has sixty days and a right of first refusal he cannot
 * afford. The campaign is a timed stage (sys.no_raids for its duration, §5.3) whose heart is a
 * mail from Sal that sits in the inbox until the player is ready to answer it: every prep the
 * idle loop allows (money on hand, time with Sal, the Row's website, the Row's memory of Mom's
 * benefit, Neighborhood trust) shows up as a named bonus on the checks.
 *
 * Outcomes (this package is the sole writer of `w.cathode_open`, `side.saved_cathode`, Sal's fate):
 *  - buy in / fundraise / benefit night → `side.saved_cathode` (the neighbors bought it) and
 *    news.cathode_saved (its rider owns the +1 hood_soul);
 *  - fundraiser falls short → Sal covers it with a second mortgage (`npc.sal.second_mortgage`,
 *    the later took_a_fall seed); open, but not "saved by the Row". The flop's bills land on you
 *    (the unsold cookbooks / the half-empty hall), and at the party you can take on half of Sal's
 *    mortgage as an obligation;
 *  - digging into Harborline and getting caught files a police complaint (`fac.hood.harborline_complaint`,
 *    a likely legal complication) that the party and the last night both remember;
 *  - Councilwoman Briggs landmarks the sign, or dirt on Harborline makes them walk → open;
 *  - let it close, or run out the clock → `w.cathode_open = 0`, Sal `diner_closed`,
 *    news.cathode_closes (its rider owns the −1 hood_soul).
 */
import { defineContent } from '@/engine/registry'
import type { Choice, Cond, Effect, SkillCheck } from '@/engine/types'
import { CLEAR_NO_RAIDS, HOOD_TRUSTED, SET_NO_RAIDS } from './shared'

const FIGHT = 'fac.hood.cathode_fight'
const LET_GO = 'fac.hood.cathode_let_go'
const CHIPPED = 'fac.hood.cathode_chipped'
const DUG_FAIL = 'fac.hood.cathode_dug_fail'

const resolved: Cond = {
  any: [
    { flag: 'side.saved_cathode' },
    { flag: 'npc.sal.second_mortgage' },
    { flag: 'fac.hood.cathode_landmark' },
    { flag: 'fac.hood.cathode_leverage' },
    { flag: LET_GO },
  ],
}

const FUND_BONUSES: SkillCheck['bonuses'] = [
  { if: { flag: CHIPPED }, add: 3, label: 'Your $10,000 seed' },
  { if: { npc: 'sal', affinityGte: 40 }, add: 2, label: 'The regulars are with you' },
  { if: { flag: 'fac.hood.row_website' }, add: 2, label: 'The Row has a website' },
  { if: { flag: 'life.hood_carried_you' }, add: 2, label: 'The Row remembers your mother\'s benefit' },
  { if: HOOD_TRUSTED, add: 2, label: 'The Row trusts you' },
  { if: { flag: 'fac.hood.sold_guestbook' }, add: -2, label: 'The guestbook business' },
]

const savedByRow: Effect[] = [{ flag: 'side.saved_cathode' }, { faction: 'fac.hood', add: 12 }, { npc: 'sal', affinity: 10 }]
/** The drive fell short: Sal quietly mortgages his house (the took_a_fall seed), and the bills for the flop land on you. */
const fellShort: Effect[] = [{ flag: 'npc.sal.second_mortgage' }, { faction: 'fac.hood', add: 5 }, { npc: 'sal', affinity: 5 }, { stat: 'stress', add: 6 }, { stat: 'mood', add: -5 }]
const COOKBOOK_FLOP = 'fac.hood.cookbook_flop'
const BENEFIT_FLOP = 'fac.hood.benefit_flop'
const COMPLAINT = 'fac.hood.harborline_complaint'

/** The war-room options, shared by every node of Sal's mail. After you chip in, the seed option becomes "cover the rest". */
const PLAN_CHOICES: Choice[] = [
  {
    if: { flag: CHIPPED },
    text: 'Cover the rest yourself.',
    tag: '[Pay $15,000]',
    req: { stat: 'money', gte: 15000 },
    reqText: 'Requires $15,000',
    effects: [
      { money: -15000 },
      { flag: 'side.saved_cathode' },
      { flag: 'fac.hood.cathode_partner' },
      { faction: 'fac.hood', add: 12 },
      { npc: 'sal', affinity: 15 },
    ],
    goto: 'bought',
  },
  {
    if: { not: { flag: CHIPPED } },
    text: 'Buy in. All of it. Tonight.',
    tag: '[Pay $25,000]',
    req: { stat: 'money', gte: 25000 },
    reqText: 'Requires $25,000',
    effects: [
      { money: -25000 },
      { flag: 'side.saved_cathode' },
      { flag: 'fac.hood.cathode_partner' },
      { faction: 'fac.hood', add: 15 },
      { npc: 'sal', affinity: 15 },
    ],
    goto: 'bought',
  },
  {
    if: { not: { flag: CHIPPED } },
    text: 'Seed it. Put in ten thousand of your own, and raise the rest with the Row.',
    tag: '[Pay $10,000]',
    req: { stat: 'money', gte: 10000 },
    reqText: 'Requires $10,000',
    effects: [{ money: -10000 }, { flag: CHIPPED }, { faction: 'fac.hood', add: 3 }, { npc: 'sal', affinity: 5 }],
    goto: 'chipped',
  },
  {
    text: 'Run a real fundraiser: a pledge drive, a raffle, and The Cathode Cookbook, sold at every register on the Row.',
    check: {
      skill: 'business',
      dc: 15,
      bonuses: FUND_BONUSES,
      success: 'fund_win',
      fail: 'fund_short',
      successEffects: savedByRow,
      failEffects: [...fellShort, { flag: COOKBOOK_FLOP }, { money: -400 }],
    },
  },
  {
    text: 'Throw a benefit night. One night, every booth, the whole Row, and you work the room.',
    check: {
      skill: 'social',
      dc: 16,
      bonuses: FUND_BONUSES,
      success: 'benefit_win',
      fail: 'fund_short',
      successEffects: savedByRow,
      failEffects: [...fellShort, { flag: BENEFIT_FLOP }, { money: -250 }, { chance: 0.3, then: [{ complication: 'social' }] }],
    },
  },
  {
    text: 'Call Councilwoman Briggs. That neon sign is older than the Harborline lawyers.',
    req: { flag: 'npc.dee.council' },
    reqText: 'Requires a friend on the city council',
    effects: [{ flag: 'fac.hood.cathode_landmark' }, { npc: 'dee', affinity: 5 }, { faction: 'fac.hood', add: 8 }, { npc: 'sal', affinity: 10 }],
    goto: 'landmark',
  },
  {
    if: { not: { flag: DUG_FAIL } },
    text: 'Find out who Harborline really is, and what they would rather nobody knew.',
    check: {
      skill: 'intrusion',
      dc: 18,
      bonuses: [{ if: { item: 'old_tool' }, add: 1, label: 'Phreaker\'s toolbox' }],
      success: 'leverage',
      fail: 'dug_fail',
      successEffects: [{ flag: 'fac.hood.cathode_leverage' }, { stat: 'heat', add: 12 }, { faction: 'fac.hood', add: 5 }, { npc: 'sal', affinity: 8 }],
      failEffects: [
        { flag: DUG_FAIL },
        { flag: COMPLAINT },
        { stat: 'heat', add: 18 },
        { stat: 'stress', add: 6 },
        { npc: 'sal', affinity: -4 },
        { chance: 0.5, then: [{ complication: 'legal' }] },
      ],
    },
  },
  {
    if: { not: { flag: CHIPPED } },
    text: '"Sal. Take their money. Rest. You\'ve earned it."',
    effects: [{ flag: LET_GO }, { faction: 'fac.hood', add: -5 }, { npc: 'sal', affinity: -5 }],
    goto: 'let_go',
  },
]

export default defineContent({
  quests: [
    {
      id: 'fac_hood_q4_save_cathode',
      title: 'Save the Cathode',
      kind: 'faction',
      act: 3,
      faction: 'fac.hood',
      giver: 'sal',
      priority: 40,
      autoStart: {
        all: [
          { var: 'act', gte: 3 },
          { var: 'w.cathode_open', eq: 1 },
          {
            any: [
              { all: [{ quest: 'fac_hood_row_website', status: ['completed', 'failed'] }, { day: true, gte: 1826 }] },
              { day: true, gte: 2007 },
            ],
          },
          { not: { quest: 'main_a3_q5_the_list', status: 'active' } },
          { jailed: false },
        ],
      },
      rewards: 'Keep the Cathode open · Neighborhood rep',
      summary: [
        'The Cathode has been open twenty-four hours a day under the Sodium Row overpass since 1958. Sal\'s father ran it, and then Sal did. Every hard conversation in this city has happened in one of its booths.',
        'Now the building is sold, the block is going to be lofts, and somebody at Harborline Renewal Partners has decided the neighborhood should be called "SoRo."',
      ],
      start: 'notice',
      stages: {
        notice: {
          text: 'Sal wants to see you after close. Sal has never once asked to see you. He just feeds you.',
          onEnter: [{ scene: 'hood_cathode_notice', delayHours: 6 }],
          objectives: [
            {
              id: 'hear',
              text: 'Hear Sal out',
              when: { any: [{ flag: FIGHT }, { flag: LET_GO }] },
              hint: 'A dialog opens on its own, late at night, at the Cathode.',
            },
          ],
          next: [{ if: { flag: LET_GO }, stage: 'closed' }, { stage: 'campaign' }],
        },
        campaign: {
          text: [
            'Sixty days until the lease runs out. Sal needs $25,000 down to match Harborline\'s offer, or the Cathode closes. He has sent you a plan. He says it is a plan.',
            'Answer Sal\'s mail when you\'re ready. Everything you do for the Row in the meantime counts: money in the bank, nights at the counter, the Row\'s website, and whatever the Row still owes you, or you owe it.',
          ],
          timeLimitDays: 60,
          onEnter: [SET_NO_RAIDS, { scene: 'hood_cathode_plan', delayHours: 12 }],
          objectives: [
            {
              id: 'money',
              text: 'Optional: have $25,000 on hand to buy in outright',
              optional: true,
              when: { stat: 'money', gte: 25000 },
              progress: { of: { stat: 'money' }, target: 25000 },
              hint: 'Contracts, a good job, or savings. Ten thousand is enough to seed a fundraiser.',
            },
            {
              id: 'regulars',
              text: 'Optional: win over the regulars (Sal affinity 40)',
              optional: true,
              when: { npc: 'sal', affinityGte: 40 },
              progress: { of: { affinity: 'sal' }, target: 40 },
              hint: 'Pick Sal in Contacts and schedule some social time at the counter.',
            },
            {
              id: 'word',
              text: 'Optional: get the word out online',
              optional: true,
              when: { flag: 'fac.hood.row_website' },
              hint: 'If you built the Row\'s website, it is already working for you. If not, the phone tree still works.',
            },
            {
              id: 'stand',
              text: 'Answer Sal\'s plan before the lease runs out',
              when: resolved,
              hint: 'Sal\'s email sits in your Mail. Answer it when you\'re ready, but answer it: at sixty days, the Cathode closes.',
            },
          ],
          next: [{ if: { flag: LET_GO }, stage: 'closed' }, { stage: 'saved' }],
          onTimeout: { stage: 'closed', effects: [{ flag: 'fac.hood.cathode_timed_out' }] },
        },
        saved: {
          text: [
            { if: { flag: 'side.saved_cathode' }, text: 'The neighbors bought the Cathode. There is going to be a party, and a plaque, and Sal is pretending neither of those things is making him emotional.' },
            { if: { flag: 'npc.sal.second_mortgage' }, text: 'The Cathode stays open. The Row came up six thousand short, and Sal covered it. He won\'t say how. You can guess.' },
            { if: { flag: 'fac.hood.cathode_landmark' }, text: 'The Cathode\'s neon sign is a historic landmark now, and Harborline has lost interest in a building it can\'t tear the face off.' },
            { if: { flag: 'fac.hood.cathode_leverage' }, text: 'Harborline walked away from the block, suddenly and without explanation. You know the explanation. So, now, do they.' },
          ],
          onEnter: [
            CLEAR_NO_RAIDS,
            { npc: 'sal', fate: 'anchor' },
            {
              if: { flag: 'side.saved_cathode' },
              then: [{ news: 'cathode_saved' }],
              else: [{ log: 'The Cathode stays open.', kind: 'story' }],
            },
            { scene: 'hood_cathode_reopening', delayHours: 30 },
          ],
          objectives: [
            {
              id: 'party',
              text: 'Come to the party at the Cathode',
              when: { flag: 'fac.hood.reopening_done' },
              hint: 'A dialog opens on its own the night of the party.',
            },
          ],
        },
        closed: {
          text: [
            {
              if: { flag: 'fac.hood.cathode_timed_out' },
              text: 'Sixty days came and went, and Sal\'s email never got an answer. The Cathode is closing. There will be one last night.',
              else: 'The Cathode is closing. Sal is taking Harborline\'s money and his father\'s neon sign. There will be one last night.',
            },
          ],
          onEnter: [
            CLEAR_NO_RAIDS,
            { var: 'w.cathode_open', set: 0 },
            { npc: 'sal', fate: 'diner_closed' },
            { news: 'cathode_closes' },
            { faction: 'fac.hood', add: -10 },
            { scene: 'hood_cathode_last_night', delayHours: 30 },
          ],
          objectives: [
            {
              id: 'goodbye',
              text: 'Be there for the last pot of coffee',
              when: { flag: 'fac.hood.last_night_done' },
              hint: 'A dialog opens on its own, on the Cathode\'s last night.',
            },
          ],
          outcome: 'failed',
        },
      },
    },
  ],

  scenes: [
    // ── The letter ─────────────────────────────────────────────────────────
    {
      id: 'hood_cathode_notice',
      channel: 'dialog',
      title: 'After Close',
      start: 'counter',
      nodes: {
        counter: {
          speaker: 'narrator',
          text: [
            'The Cathode, a little after two in the morning. The last cab driver has gone home. The C in the neon CATHODE sign has been flickering for eleven years, and Sal refuses to fix it because "that\'s the brand."',
            'Sal is sitting on the customer side of his own counter. You have never once seen him do that. There is a letter in front of him, and the coffee pot beside it has gone cold, which you have also never seen.',
          ],
          next: 'sal',
        },
        sal: {
          speaker: 'sal',
          text: [
            '"Sit."',
            '"The Petrakis family owns this building. Owned. Mrs. Petrakis passed at Easter, God rest her, and her son lives in Harbor Point and has never once eaten here." He taps the letter. "Harborline Renewal Partners. They bought the whole block. Lofts. They\'re gonna call it \'SoRo.\'" He says it like a swear word, because it is one.',
            { if: { var: 'w.datacenter_open', eq: 1 }, text: '"Ever since they put the computers in the old mill, every rat on Sodium Row has got a real estate agent."' },
            '"Lease is up in sixty days. They\'re not renewing."',
          ],
          next: 'clause',
        },
        clause: {
          speaker: 'sal',
          text: [
            '"There\'s a clause. Old man Petrakis put it in back in \'71, when he bought the building off the bank and my father signed the new lease. Right of first refusal: I can match their offer on the building. Twenty-five thousand down by the closing and the bank carries the rest."',
            'He laughs, with nothing funny in it. "Twenty-five thousand. I make pie, kid."',
            {
              if: { any: [{ flag: 'a3.truth_t1' }, { var: 'w.exposure', gte: 6 }] },
              text: 'You read the letterhead upside down. Harborline\'s lawyers are Whitcombe & Vey, the same firm that filed the paperwork turning the old mill into a "data campus." Small city. Or not small enough.',
            },
          ],
          choices: [
            {
              text: '"We fight it, Sal. Give me the sixty days."',
              effects: [{ flag: FIGHT }, { npc: 'sal', affinity: 5 }],
              goto: 'fight',
            },
            {
              if: { flag: 'npc.dee.council' },
              text: '"We fight it. And I know exactly who on the city council eats here."',
              effects: [{ flag: FIGHT }, { npc: 'sal', affinity: 5 }],
              goto: 'fight',
            },
            {
              text: '"Sal. Maybe it\'s time. You\'ve been behind this counter forty years."',
              goto: 'confirm',
            },
          ],
        },
        confirm: {
          speaker: 'sal',
          text: [
            '"Maybe." He looks down the counter, at the stools, at the pie case, at the booth where your mother used to sit when she was your age, which he has told you about many times.',
            '"Say it again. Say it like you mean it, and I\'ll believe you."',
          ],
          choices: [
            {
              text: '"I mean it. Take their money and rest."',
              effects: [{ flag: LET_GO }, { faction: 'fac.hood', add: -5 }, { npc: 'sal', affinity: -5 }],
              goto: 'let_go',
            },
            {
              text: '"No. I didn\'t mean it. We fight."',
              effects: [{ flag: FIGHT }, { npc: 'sal', affinity: 5 }],
              goto: 'fight',
            },
          ],
        },
        fight: {
          speaker: 'sal',
          text: [
            '"Sixty days." He gets up and puts on a fresh pot, the way other men might load a shotgun.',
            '"Okay. Okay. I\'ll write you a plan. I don\'t know how to write a plan. I\'ll write you something. Go home. Sleep. You look like a dropped call."',
          ],
        },
        let_go: {
          speaker: 'narrator',
          text: [
            'He nods for a long time. Then he folds the letter into quarters, puts it in his apron pocket, and pours you a cup of the cold coffee.',
            'You drink it, because it\'s his.',
          ],
        },
      },
    },

    // ── The plan ───────────────────────────────────────────────────────────
    {
      id: 'hood_cathode_plan',
      channel: 'mail',
      title: 'THE PLAN (TYPED BY SAL)',
      from: 'sal',
      expiresDays: 59,
      start: 'plan',
      nodes: {
        plan: {
          text: [
            'KID',
            'MY NEPHEW SET UP THE EMAIL. HE SAYS I DONT HAVE TO TYPE IN CAPITALS. I DO IT ANYWAY SO YOU KNOW ITS SERIOUS',
            'HERE IS THE PLAN. THERE IS NO PLAN. HERE IS WHAT I GOT',
            '1. 25000 DOWN BY THE CLOSING. THATS THE WHOLE THING\n2. RUTH SAYS THE ROW CAN RAISE MONEY. RUTH ALSO SAYS HER CAT CAN HEAR THE RADIO IN HER HEAD SO\n3. THE LAWYER FOR HARBORLINE IS A MAN NAMED PRUITT WHO ORDERS TEA IN A DINER\n4. I DONT WANT CHARITY. I WILL TAKE CHARITY',
            { if: { flag: 'fac.hood.row_website' }, text: '5. RUTH SAYS PUT IT ON THE WEBSITE. I SAID WHAT WEBSITE. SHE SHOWED ME. THERES A CAT ON IT' },
            { if: { flag: 'life.hood_carried_you' }, text: 'THE JAR FROM YOUR MOTHERS NIGHT IS STILL UNDER THE REGISTER. EMPTY. NOBODY WANTS TO THROW IT OUT' },
            { if: { flag: 'npc.dee.council' }, text: 'ALSO BRIGGS WAS IN. COUNCILWOMAN BRIGGS. SHE HAD THE MEATLOAF AND ASKED ABOUT YOU' },
            'YOU TELL ME WHAT WE DO. I MAKE PIE',
            'SAL',
          ],
          choices: PLAN_CHOICES,
        },
        chipped: {
          text: [
            'YOU DID WHAT',
            'OK. OK. I DIDNT CRY. THE ONIONS CRIED',
            'SO NOW WE NEED FIFTEEN. YOU TELL ME HOW',
            'SAL',
          ],
          choices: PLAN_CHOICES,
        },
        bought: {
          text: [
            'KID',
            'I READ YOUR EMAIL FOUR TIMES. THEN I CALLED THE BANK TO MAKE SURE IT WASNT A JOKE. IT IS NOT A JOKE',
            'YOU ARE A PARTNER NOW. FORTY NINE PERCENT. I KEEP FIFTY ONE BECAUSE IM OLD AND I EARNED IT',
            'EVERYBODY WHO PUT IN GOES ON A PLAQUE BY THE REGISTER. RUTH PUT IN TWENTY DOLLARS AND A PIE TIN. YOUR NAME GOES FIRST. I AM SPELLING IT WRONG ON PURPOSE SO YOU DONT GET A BIG HEAD',
            'SAL',
          ],
        },
        fund_win: {
          text: [
            'KID',
            'THE COOKBOOK SOLD NINE HUNDRED COPIES. NINE HUNDRED. RUTHS EMPANADAS ARE PAGE FOUR. MRS CASTELLANOS LASAGNA IS PAGE NINE AND SHE WANTS IT KNOWN SHE LEFT OUT ONE INGREDIENT ON PURPOSE',
            'THE RAFFLE WAS A PIE A MONTH FOR A YEAR. THE PRUSZYNSKIS BOUGHT FORTY TICKETS. THEY WON. OF COURSE THEY WON',
            'TWO HUNDRED AND TWELVE PEOPLE PUT IN. TWO HUNDRED AND TWELVE. THE ROW BOUGHT THE CATHODE. ALL THE NAMES GO ON A PLAQUE BY THE REGISTER. I DONT CARE HOW BIG THE PLAQUE HAS TO BE',
            'SAL',
          ],
        },
        benefit_win: {
          text: [
            'KID',
            'I HAVE NEVER SEEN THE ROW LIKE THAT. NOT WHEN THE MILL CLOSED. NOT WHEN THE HARBOR FROZE IN 79. EVERY BOOTH. PEOPLE STANDING. THE FIRE MARSHAL CAME AND STAYED FOR PIE',
            'YOU WORKED THAT ROOM LIKE YOUR MOTHER WORKS A CHURCH SUPPER. I MEAN THAT AS THE HIGHEST THING I CAN SAY',
            'TWO HUNDRED AND TWELVE PEOPLE PUT IN. THE ROW BOUGHT THE CATHODE. ALL THE NAMES GO ON A PLAQUE BY THE REGISTER',
            'SAL',
          ],
        },
        fund_short: {
          text: [
            'KID',
            'WE CAME UP SHORT. SIX THOUSAND TWO HUNDRED SHORT',
            { if: { flag: COOKBOOK_FLOP }, text: 'THE COOKBOOK SOLD ONE HUNDRED AND NINE COPIES. THE PRINT SHOP ON WEIR STREET PRINTED ONE THOUSAND. THEY SENT THE BILL FOR THE OTHER EIGHT HUNDRED AND NINETY ONE TO YOU. I TOLD THEM TO. SORRY KID. THERE ARE COOKBOOKS IN MY WALK IN WHERE THE FISH SHOULD BE' },
            { if: { flag: BENEFIT_FLOP }, text: 'THE BENEFIT WAS HALF EMPTY. IT RAINED AND THE BAND DIDNT COME AND MR PRUSZYNSKI PLAYED BLUE MOON NINE TIMES TO FORTY PEOPLE. YOU PAID THE HALL AND THE RAFFLE PRINTING OUT OF YOUR POCKET. I SAW YOU DO IT. DONT THINK I DIDNT' },
            'I COVERED IT. DONT ASK HOW',
            'IT DOESNT MATTER HOW. THE CATHODE STAYS OPEN. THATS WHAT MATTERS. EVERYBODY WHO PUT IN STILL GETS THEIR NAME BY THE REGISTER',
            'DONT ASK HOW',
            'SAL',
          ],
        },
        landmark: {
          text: [
            'KID',
            'BRIGGS CAME IN WITH A CLIPBOARD AND A MAN FROM THE CITY WITH A CAMERA. SHE STOOD IN THE MIDDLE OF MY DINER AND SAID "WE DO NOT TELL THE DEVELOPER NO. WE HEAL THE DEVELOPER." I DONT KNOW WHAT THAT MEANS. PRUITT DIDNT EITHER',
            'THE SIGN IS HISTORIC NOW. 1958. A LANDMARK. NOBODY CAN TOUCH THE SIGN OR THE FRONT. TURNS OUT HARBORLINE DONT WANT A BUILDING THEY CANT PUT GLASS ON',
            'THE PETRAKIS BOY SIGNED ME A TWENTY YEAR LEASE. HE SAID HIS MOTHER WOULD HAVE WANTED IT. HIS MOTHER WOULD HAVE HIT HIM WITH A SPOON',
            'SAL',
          ],
        },
        leverage: {
          text: [
            'KID',
            'PRUITT CALLED ME HIMSELF. HE SAID HARBORLINE IS "REPRIORITIZING." THEN HE ASKED ME NOT TO READ THE COURIER TOMORROW. SO I READ IT TWICE',
            'CITY PLANNER. HIS WIFES CONSULTING COMPANY. HARBORLINES PERMITS. IT WAS ALL IN THERE. SOMEBODY SENT IT TO THE PAPER WITH A BOW ON IT',
            'THE PETRAKIS BOY RENEWED MY LEASE AT THE OLD RENT. I DONT KNOW WHAT YOU DID AND I DONT WANT TO. EAT SOMETHING',
            'SAL',
          ],
        },
        dug_fail: {
          text: [
            'KID',
            'PRUITT CALLED ME. HE SAID SOMEBODY HAS BEEN "POKING AROUND" HARBORLINE AND IF IT KEEPS UP THEY WILL MOVE UP THE CLOSING AND CALL THE POLICE',
            'HE ALREADY CALLED THE POLICE. A DETECTIVE CAME IN AND HAD THE MEATLOAF AND ASKED ME WHO USES THE PAYPHONE. I SAID EVERYBODY. HE WROTE DOWN EVERYBODY',
            'WAS THAT YOU. DONT ANSWER THAT',
            'WHATEVER IT WAS DONT DO IT AGAIN. WHAT ELSE WE GOT',
            'SAL',
          ],
          choices: PLAN_CHOICES,
        },
        let_go: {
          text: [
            'OK KID. OK',
            'I ALWAYS SAID ID RETIRE WHEN THEY CARRIED ME OUT. TURNS OUT THEY JUST SEND A LETTER',
            'SAL',
          ],
        },
      },
    },

    // ── The party ──────────────────────────────────────────────────────────
    {
      id: 'hood_cathode_reopening',
      channel: 'dialog',
      title: 'The Party at the Cathode',
      start: 'party',
      nodes: {
        party: {
          speaker: 'narrator',
          text: [
            'Every booth, every stool, and a crowd on the sidewalk under the overpass holding paper plates. Somebody has strung Christmas lights along the counter in June. Mr. Pruszynski has brought the accordion, and nobody has yet had the heart to take it away from him.',
            { if: { flag: 'side.saved_cathode' }, text: 'By the register there is a brass plaque the size of a road sign, crowded with names in tiny letters. Yours is near the top. It is spelled wrong.' },
            { if: { flag: 'fac.hood.cathode_landmark' }, text: 'Councilwoman Briggs cuts a ribbon across the door with a pair of kitchen shears and gives a speech about "civic heritage" that is mostly about pie. It is the best speech you have ever heard a politician give.' },
            { if: { flag: 'fac.hood.cathode_leverage' }, text: 'A copy of the Port Lumen Courier is taped to the wall behind the register, the Harborline story circled in grease pencil. Nobody asks you about it. Several people buy you pie.' },
            { if: { flag: 'npc.sal.second_mortgage' }, text: 'Sal works the room like it\'s any other night. He laughs a little too loud. Twice you see him stop by the kitchen door and rub his eyes with the heel of his hand.' },
            { if: { flag: COOKBOOK_FLOP }, text: 'Every table has a copy of The Cathode Cookbook on it as a centerpiece. There are eight hundred more in the walk-in. Sal is giving them out as party favors. People are being very polite about it.' },
            { if: { flag: COMPLAINT }, text: 'Harborline\'s complaint letter about "unauthorized inquiries" is taped up behind the register, next to the health certificate. Sal circled the word "unauthorized" in grease pencil and wrote underneath it: WE DONT KNOW NOTHING.' },
          ],
          next: 'speech',
        },
        speech: {
          speaker: 'sal',
          text: [
            'Sal climbs up on a chair, which the fire marshal pretends not to see.',
            '"My father opened this place in 1958 with a loan from his brother and a stove he stole from a church. It\'s been open every hour since. Blizzards. The strike. The night the harbor caught fire. It stays open."',
            '"Eat something. All of you. You look like dropped calls."',
            'He climbs down. On the way past, he puts a hand on your shoulder and steers you, without a word, through the kitchen and out the back.',
          ],
          next: 'back_room',
        },
        back_room: {
          speaker: 'sal',
          text: [
            'The back room: a storeroom with a door that locks, a window onto the alley, a phone line nobody has used since the eighties, and a couch that has absorbed three decades of spilled coffee.',
            '"It\'s yours if you want it," Sal says. "No questions. I don\'t know what you do on those computers. I don\'t want to know. A person needs a room nobody\'s looking at." He shrugs. "I charge for pie."',
            { if: { npc: 'jax', fate: ['free', 'normal', 'backroom_partner'] }, text: '"Your pal Jax already measured the wall for a second couch. I told him it\'s not up to me."' },
          ],
          choices: [
            {
              text: '"I\'ll take it, Sal. Thank you."',
              effects: [
                { flag: 'npc.sal.base' },
                { npc: 'sal', fate: 'base' },
                {
                  buff: {
                    id: 'hood_back_room',
                    name: 'The Cathode Back Room',
                    desc: 'A room nobody is looking at, behind a diner that never closes. Heat cools off faster when you lie low here.',
                    days: 540,
                    mods: [{ key: 'heat.decay', add: 0.3 }],
                  },
                },
              ],
              goto: 'base',
            },
            {
              text: '"Keep it clean, Sal. You\'ve done enough for me. More than enough."',
              effects: [{ faction: 'fac.hood', add: 3 }, { npc: 'sal', affinity: 3 }],
              goto: 'clean',
            },
            {
              if: { flag: 'npc.sal.second_mortgage' },
              text: '"Sal. The six thousand. How did you cover it?"',
              goto: 'mortgage',
            },
          ],
        },
        mortgage: {
          speaker: 'sal',
          text: [
            'He looks at you for a long moment. "The house," he says. "Second mortgage. It\'s fine. It\'s a house. I only sleep there."',
            '"Don\'t make a face. My father borrowed the stove money from his brother and paid it back one pie at a time. I\'ll pay it back one pie at a time. Now. The room. Yes or no."',
          ],
          choices: [
            {
              text: '"Then half that mortgage is mine. Every month. You don\'t get a vote."',
              effects: [
                { obligation: { id: 'pkg10_sal_mortgage', label: 'Half of Sal\'s second mortgage', perDay: 9, days: 365 } },
                { flag: 'fac.hood.split_sal_mortgage' },
                { npc: 'sal', affinity: 8 },
                { faction: 'fac.hood', add: 4 },
              ],
              goto: 'split',
            },
            {
              text: '"Yes. And I\'m paying you rent for it, whatever you say."',
              effects: [
                { flag: 'npc.sal.base' },
                { npc: 'sal', fate: 'base' },
                { npc: 'sal', affinity: 3 },
                {
                  buff: {
                    id: 'hood_back_room',
                    name: 'The Cathode Back Room',
                    desc: 'A room nobody is looking at, behind a diner that never closes. Heat cools off faster when you lie low here.',
                    days: 540,
                    mods: [{ key: 'heat.decay', add: 0.3 }],
                  },
                },
              ],
              goto: 'base',
            },
            {
              text: '"No. You\'ve got enough riding on this place without my trouble in the back."',
              effects: [{ faction: 'fac.hood', add: 3 }, { npc: 'sal', affinity: 3 }],
              goto: 'clean',
            },
          ],
        },
        split: {
          speaker: 'sal',
          text: [
            'He looks at you like you\'ve insulted his pie. Then he looks away, at the kitchen door, for a long time.',
            '"My father paid back the stove one pie at a time," he says finally. "You\'re gonna pay back the house one month at a time. Fine. FINE." He wipes the counter where it is already clean. "The room\'s still yours if you want it. We\'ll talk about it when you\'re not being a pain in my neck."',
          ],
          choices: [
            {
              text: '"I\'ll take the room."',
              effects: [
                { flag: 'npc.sal.base' },
                { npc: 'sal', fate: 'base' },
                {
                  buff: {
                    id: 'hood_back_room',
                    name: 'The Cathode Back Room',
                    desc: 'A room nobody is looking at, behind a diner that never closes. Heat cools off faster when you lie low here.',
                    days: 540,
                    mods: [{ key: 'heat.decay', add: 0.3 }],
                  },
                },
              ],
              goto: 'base',
            },
            {
              text: '"Keep it clean, Sal. One of us should have nothing to explain."',
              effects: [{ faction: 'fac.hood', add: 3 }, { npc: 'sal', affinity: 3 }],
              goto: 'clean',
            },
          ],
        },
        base: {
          speaker: 'narrator',
          effects: [{ flag: 'fac.hood.reopening_done' }, { stat: 'mood', add: 10 }],
          text: [
            'He hands you a key on a loop of kitchen string. It is warm from his pocket.',
            'Back out front, Mr. Pruszynski has started "Blue Moon" for the fourth time. Nobody stops him. Somewhere around two in the morning, you realize you have not thought about work in six hours.',
          ],
        },
        clean: {
          speaker: 'sal',
          effects: [{ flag: 'fac.hood.reopening_done' }, { stat: 'mood', add: 10 }],
          text: [
            '"Suit yourself." But he looks relieved, and then, a second later, looks ashamed of looking relieved, and covers it by telling you your hair looks terrible.',
            'Back out front, Mr. Pruszynski has started "Blue Moon" for the fourth time. Nobody stops him. Somewhere around two in the morning, you realize you have not thought about work in six hours.',
          ],
        },
      },
    },

    // ── The last night ─────────────────────────────────────────────────────
    {
      id: 'hood_cathode_last_night',
      channel: 'dialog',
      title: 'The Last Pot of Coffee',
      start: 'last',
      nodes: {
        last: {
          speaker: 'narrator',
          text: [
            'The last night of the Cathode. Everybody came: the cab drivers, the nurses off shift, the Row in its good coats, a man nobody knows who says he proposed to his wife in the third booth in 1966.',
            {
              if: { flag: 'fac.hood.cathode_timed_out' },
              text: 'Sal\'s email is still in your inbox, unanswered. He hasn\'t mentioned it. He isn\'t going to.',
            },
            { if: { flag: COMPLAINT }, text: 'Pruitt from Harborline comes in at midnight, orders tea, and asks the waitress, pleasantly, whether "the one who was poking around" will be here tonight. Sal serves him personally, and charges him eleven dollars for the tea.' },
            'By four in the morning it\'s just you and Sal, and the hum of the pie case, and the flickering C.',
          ],
          next: 'sal',
        },
        sal: {
          speaker: 'sal',
          text: [
            '"Forty years behind this counter. Near fifty years this place has been open, every hour of every day. You know what the Harborline man asked me? He asked me where the key to the front door is."',
            '"There isn\'t one. Never needed one."',
            'He pours two cups from the last pot, one for you and one for him, and sits on the customer side of the counter.',
          ],
          choices: [
            {
              text: 'Help him stack the chairs. Somebody has to, and it shouldn\'t be him alone.',
              effects: [{ npc: 'sal', affinity: 4 }],
              goto: 'chairs',
            },
            {
              text: '"Sal. Can I have the C? From the sign."',
              effects: [{ flag: 'fac.hood.neon_c' }, { npc: 'sal', affinity: 3 }],
              goto: 'neon',
            },
            {
              text: 'Just drink the coffee.',
              goto: 'coffee',
            },
          ],
        },
        chairs: {
          speaker: 'narrator',
          effects: [{ flag: 'fac.hood.last_night_done' }, { stat: 'mood', add: -10 }],
          text: [
            'You stack them upside-down on the tables, the way he\'s done ten thousand times, while he wipes the counter one last time. Neither of you says anything. You don\'t need to.',
            'At five-thirty he turns off the grill. At five-thirty-one he turns off the neon. The street under the overpass goes a color you have never seen it before, which is the color of every other street.',
          ],
        },
        neon: {
          speaker: 'narrator',
          effects: [{ flag: 'fac.hood.last_night_done' }, { stat: 'mood', add: -10 }],
          text: [
            'He laughs, the first real laugh all night. "The broken one? It\'s the only letter that\'s been honest in eleven years."',
            'At dawn you stand on the counter together and unbolt it. It\'s heavier than it looks, and warm, and it buzzes a little in your arms even unplugged. He writes on the back of it in grease pencil: THE BRAND.',
          ],
        },
        coffee: {
          speaker: 'narrator',
          effects: [{ flag: 'fac.hood.last_night_done' }, { stat: 'mood', add: -10 }],
          text: [
            'It\'s the best cup of coffee you have ever had, and you know it only because it\'s the last one.',
            'When the pot is empty, Sal rinses it, dries it, and puts it back on the burner, out of habit. Then he takes it off again, and holds it, and doesn\'t seem to know where to put it down.',
          ],
        },
      },
    },
  ],
})
