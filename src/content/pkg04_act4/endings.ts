/**
 * PKG-04 — all EndingDefs (E1–E10 + E-SECRET, bible §10) and the assembler.
 *
 * Selection is a first-match-wins priority matrix (§10), implemented in `assembleEnding()` as a
 * single nested if/else chain of effects so EXACTLY ONE ending ever fires. `a4.leverage` (the CP-D1
 * choice, or 'none' for the uncommitted) is the PRIMARY key that picks the ending family; state only
 * picks the CUT (normal / darker / warm / per-NPC), realized as conditional `epilogues[]` slides. E9
 * is the unconditional last row; `tests/pkg04_endings.test.ts` enumerates flag combinations and
 * asserts exactly one ending fires and no CP-D1 option A–F resolves to E9.
 *
 * The darker cut is chosen by `end.finale_fail` (§6.D pooled check), never a separate ending, never
 * a game over. E7 and E9 are exempt (they are already floors).
 *
 * Every ending also carries `MARKS` (marks.ts): the "What Followed You" slides that read back the scars,
 * debts and grudges left by failed rolls in Acts III and IV (REDESIGN_V2 §D).
 */
import { defineContent } from '@/engine/registry'
import type { Cond, EndingDef, Effect, Text } from '@/engine/types'
import { finalizeFates } from './fates'
import { MARKS } from './marks'
import {
  INNER_CIRCLE,
  affLte,
  all,
  any,
  fate,
  finaleFail,
  finalePass,
  flag,
  graceWithYou,
  lane,
  married,
  not,
  spine,
  youLeftTown,
} from './shared'

interface Slide {
  if?: Cond
  title: string
  text: Text
}
const ep = (cond: Cond | undefined, title: string, text: Text): Slide => (cond ? { if: cond, title, text } : { title, text })

// ── Reusable slides (per-NPC, per-world, per-faction) ─────────────────────────

/** Warm-room coda (§10): hood_soul ≥ 2 inserts a warm room; ≤ 0 strips it. */
const WARM: Slide[] = [
  ep({ var: 'w.hood_soul', gte: 2 }, 'A Warm Room', [
    {
      if: { var: 'w.cathode_open', eq: 1 },
      text: 'And there is still the Cathode. Sal saves you the stool at the end of the counter; you never asked, he just started doing it, and he has never stopped. Whatever else the decade took, it did not take the stool.',
      else: 'And there is still the Row. Somebody\'s kitchen light is always on, and one of the chairs at one of the tables is understood, without anyone saying so, to be yours.',
    },
    'You are not, it turns out, a person who ended up with nobody. You made sure of that, one Sunday dinner and one late coffee at a time, in the years when it would have been so much easier not to.',
  ]),
  ep({ var: 'w.hood_soul', lte: 0 }, 'A Cold Room', [
    {
      if: { var: 'w.cathode_open', eq: 0 },
      text: 'The Cathode is dark. Sal still gets up at four out of habit and makes coffee for nobody. You are not on the short list of people who would notice if he stopped.',
      else: 'Nobody on the Row keeps a light on for you anymore. You spent the warmth like money, on things that seemed more urgent at the time, and now the account is empty and the bill is quiet.',
    },
  ]),
]

const cityHalcyon: Slide = ep(undefined, 'The Ladder', [
  { if: flag('w.halcyon_state', 'clean'), text: 'Halcyon is smaller and duller than it used to be, and for the first time nobody you know is ashamed to work there. Vale gives interviews about "the hard road back," and mostly means it.' },
  { if: any(flag('w.halcyon_state', 'dead'), flag('w.halcyon_state', 'crashed')), text: 'Halcyon is a foreclosed campus and a punchline. The turtlenecks went first, then the options, then the founder, who is out there somewhere selling the future to a smaller room.' },
  { if: flag('w.halcyon_state', 'rising'), text: 'Halcyon is still up and to the right on every chart, which everyone has agreed to keep believing. The party goes on. You are just no longer on the list.' },
])

const cityCathode: Slide = ep({ var: 'w.cathode_open', eq: 0 }, 'The Diner', 'The Cathode closed. Gentrification, or a second mortgage that came due, or just time. There is a coffee chain there now, and it is fine, and nobody has ever had a hard conversation in one of its booths and never will.')

/** The repeal needs a law to repeal, a published truth, and Councilwoman Briggs (§10 E1, §11.4). */
const repealed: Cond = all({ var: 'w.mnsa', gte: 1 }, lane('publish'), flag('npc.dee.council'))

const cityMnsa: Slide = ep(any({ var: 'w.mnsa', gte: 1 }, flag('a3.vote_resolved')), 'The Law', [
  { if: repealed, text: 'After the hearings, and Councilwoman Briggs\'s swing vote, the Network Security Act was repealed. It is the rarest thing in this city\'s history: a law that got smaller.' },
  { if: all({ var: 'w.mnsa', eq: 1 }, not(repealed)), text: 'The Network Security Act is entrenched. The ISPs keep everything. People say "not in an email" the way their grandparents said "not on the phone," and the young ones don\'t understand why the old ones flinch.' },
  { if: all({ var: 'w.mnsa', eq: 2 }, not(repealed)), text: 'The watered-down Act is law. It keeps less than they wanted and more than anyone admits, which is how these things always end: not with a boot, but with a policy.' },
  { if: { var: 'w.mnsa', eq: 0 }, text: 'The Act died on the council floor and stayed dead. The logs still exist; they just need a warrant now. It is not freedom. It is a receipt for freedom, and you take it.' },
])

const cityMeridian: Slide = ep(undefined, 'The Money', [
  { if: flag('w.meridian_state', 'collapsed'), text: 'Meridian Trust is a dark tower and a recession with a face: For Lease signs on the Row, job ads on the diner napkins, a whole city learning what it means when the old money turns out to have been mostly a story.' },
  { if: flag('w.meridian_state', 'breached'), text: 'Meridian Trust survived the breach and spent a fortune telling everyone it was never breached. The online banking still looks like 2003. Grandmothers on the Row still bank in person, and they were right all along.' },
  { if: flag('w.meridian_state', 'healthy'), text: 'Meridian Trust still owns the Harbor Point skyline, digitizing badly, endlessly, the way old money does everything. Nobody ever found out how close it came.' },
])

const sceneSlide: Slide = ep(undefined, 'The Scene', [
  { if: flag('w.scene_state', 'reformed'), text: 'The Loft rebuilt itself smaller and cleaner: mutual aid, not warez, a back room where the kids learn the ethics before the tools. Nobody gets rich. Nobody gets sold.' },
  { if: flag('w.scene_state', 'vibrant'), text: 'The Loft still argues all night about a thread from 2003 and still meets in the back room on Sodium Row. Loud, broke, unenclosed. Some things the city could not buy.' },
  { if: flag('w.scene_state', 'bleeding'), text: 'The Loft got paid and bled out collecting. The board is still up, with a price list and sponsors, and the old handles log in less every year, like people visiting a neighborhood that got nicer and stopped being theirs.' },
  { if: flag('w.scene_state', 'dark'), text: 'The Loft is dark. The login screen hangs and drops you. Somewhere the old handles are living ordinary lives and not talking about it, which is its own kind of solidarity, the last kind left.' },
])

const apertureSlide: Slide = ep(undefined, 'The Machine', [
  { if: flag('w.aperture_state', 'destroyed'), text: 'Aperture Data Solutions is a dissolved company, a stack of indictments and a granite sign being pried off a Millgate wall. PARALLAX is an exhibit number. The market, it turns out, had names and addresses.' },
  { if: flag('w.aperture_state', 'exposed'), text: 'Aperture survived being exposed the way big things survive: smaller, renamed, lawyered, and still quietly selling risk scores to anyone who can pay. Everyone knows now. Knowing turned out to be the easy part.' },
  { if: flag('w.aperture_state', 'thriving'), text: 'Aperture thrives. The new glass annex in Millgate has a billboard: TRUST IS A DATA POINT. PARALLAX scores the insurance, the loans, the leases. The city was read like a book, and the book sold very well.' },
])

const listSlide: Slide = ep(any(flag('a3.the_list_done'), flag('a3.list_ignored')), 'The List', [
  { if: { var: 'w.list_saved', gte: 4 }, text: 'You warned more of the names on PARALLAX\'s list than anyone thought possible, a day here and three days there, at a cost nobody else ever saw. The people you saved do not know your name. That was the deal. It was a good deal.' },
  { if: all({ var: 'w.list_saved', gte: 1 }, { var: 'w.list_saved', lte: 3 }), text: 'You warned a handful of the names on the list: the ones you could reach, the ones you chose. The rest you think about in the order the sweep took them, which is the one order you will never forget.' },
  { if: { var: 'w.list_saved', lte: 0 }, text: 'You had the list, and the window, and you warned no one. The sweep went exactly the way the machine predicted it would. You were, it turns out, part of the prediction.' },
  { if: flag('a3.redacted_swept'), text: 'And one name you never got to choose at all: Tomas Ruiz, night-shift ER tech at Harbor General, a black bar on the list because you tripped the wall on the way in. He had been flagging insurer denials. He drives a delivery van now. You have never told him why he never got a warning, and you never will.' },
])

const toasterSlide: Slide = ep(undefined, 'The Toaster Man', [
  'And old Mr. Szabo on Cannery Row, who has told everyone since 2001 that the feds tapped his line through the toaster, was finally proven right, narrowly and on a technicality, when the hearings revealed that his building\'s smart meter reported to a PARALLAX feed.',
  { if: flag('a4.toaster_checked'), text: 'He had the transcript framed and hung it over the toaster, next to a note in shaky capitals: CHECKED BY LINH\'S KID. CLEAN. (THEY USED THE METER.) He makes very good toast.', else: 'He had the transcript framed. It hangs over the toaster. He makes very good toast.' },
])

/** For the endings where you leave the city: whoever you loved enough to take along. */
const cameWithYou: Slide = ep(any(graceWithYou, { npc: 'mira', romance: ['partner', 'engaged', 'married'] }), 'Who Came With You', [
  { if: graceWithYou, text: 'Grace came with you. She found a night shift at a hospital where nobody knows your name, and she checks your pupils when you come home late, and she never once asks what you left behind, because she was there when you left it.' },
  { if: { npc: 'mira', romance: ['partner', 'engaged', 'married'] }, text: 'Mira came with you. Of course she did; she was always better at leaving than you were. She bounced your whole old life through three dead exchanges and a forwarding address, and signs the new lease *hugz*.' },
])

// Per-NPC slides used across several endings, each gated on its own fate.
/** Per-person slides, keyed `npc:fate` so an ending can swap in its own version of one. */
const CAST: [string, Slide][] = [
  ['jax:backroom_partner', ep(fate('jax', 'backroom_partner'), 'Jax', 'Jax runs the Cathode back room with you, or in your name: coffee hot, kids honest, door always open. He tells the story of your first bricked crack to every newcomer, and it gets worse every year, and you let him.')],
  ['jax:free', ep(all(fate('jax', 'free'), not(youLeftTown)), 'Jax', 'Jax is free and still Jax. He has started saying "be careful" when you leave, which is new, and which you hate, and which you would not trade for anything.')],
  ['jax:free_away', ep(all(fate('jax', 'free'), youLeftTown), 'Jax', 'Jax leaves a voicemail on a number that still forwards to you, somehow, wherever you are. He doesn\'t ask where. He just says the Cathode misses your face and Rosa says hi.')],
  ['jax:arrested', ep(fate('jax', 'arrested'), 'Jax', 'Jax is behind glass, doing his time in cartoon marks on a wall, Rosa on Sundays. He tells you not to visit so much. You visit exactly that much.')],
  ['jax:flipped', ep(fate('jax', 'flipped'), 'Jax', 'Jax flipped, once, to save himself, and neither of you ever quite got the weight of it off the table. But he still pages you on your birthday, all caps, three exclamation points, like nothing ever happened. Some nights that is enough.')],
  ['jax:gone', ep(fate('jax', 'gone'), 'Jax', 'Jax drifted off, no fight, just a moving truck and a postcard with a very bad drawing of a dog on it. You keep the postcard on the fridge. You do not know why. You do know why.')],
  ['jax:dead', ep(fate('jax', 'dead'), 'Jax', 'Jax is on the hill above the Sound, where he always said the view was wasted on the dead. His pager number still works. You still haven\'t cancelled it. You never will.')],

  ['mira:married', ep({ npc: 'mira', romance: 'married' }, 'Mira', 'Mira signs the grocery list *hugz*, and after all these years it still gets you, and she knows it, which is the whole marriage in one word.')],
  ['mira:partner', ep(all(fate('mira', 'partner'), not({ npc: 'mira', romance: 'married' })), 'Mira', 'Mira is still the cleanest hands you know, and still explains the trick afterward now, slowly, the way she started doing once she stopped keeping score.')],
  ['mira:rival', ep(fate('mira', 'rival'), 'Mira', 'Mira works two floors down, or two states over, on the other side of every problem you have. She is very, very good at it. Sometimes you catch a solution with her fingerprints on it and smile before you remember to be worried.')],
  ['mira:gone', ep(fate('mira', 'gone'), 'Mira', 'Mira left Port Lumen, cleanly, the way she does everything. A handle that stopped logging in. Every so often a puzzle appears on a dead board somewhere, unsigned, exactly the kind she used to leave you. You never solve them fast enough.')],
  ['mira:flips_you', ep(fate('mira', 'flips_you'), 'Mira', 'Mira handed you to the people you feared most, and she was right to, and knowing that is the worst part. You do not blame her. You taught her that some falls you don\'t take twice.')],
  ['mira:casualty', ep(fate('mira', 'casualty'), 'Mira', 'You ran your plan fast instead of right, and Mira paid it. You think about that more than anything else you have ever done. The coffee is never warm anymore.')],

  ['priya:martyr', ep(fate('priya', 'martyr'), 'Priya', 'Priya testified under her own name, and the industry calls her difficult and the city calls her brave and she calls it overdue. She kept the WORLD\'S OKAYEST ENGINEER mug. She uses it on the stand.')],
  ['priya:cofounder', ep(fate('priya', 'cofounder'), 'Priya', 'Priya builds clean things with you now, in an office with both your names on the lease, that pays everyone on time and sells no one. Rule three, finally, in practice.')],
  ['priya:saved', ep(fate('priya', 'saved'), 'Priya', 'You took the fall so Priya\'s name stayed clean, and she has never forgiven you for it, which is how you know she loves you. She writes, though. She always writes.')],
  ['priya:complicit', ep(fate('priya', 'complicit'), 'Priya', 'Priya stopped asking questions. She is good at her job and very well paid and no longer keeps the mug on her desk. When your name comes up she changes the subject with real skill.')],
  ['priya:broken', ep(fate('priya', 'broken'), 'Priya', 'Priya quit and left for somewhere with mountains. Her last letter was one line: "Rule two. Remember rule two." You do. Most days you do.')],

  ['corvid:succeeded', ep(fate('corvid', 'succeeded'), 'Corvid', 'Corvid named you sysop and walked out into a life with a garden in it. She sends seed catalogs with rude notes in the margins. The commons outlived the woman who kept it, which is the only kind of winning she ever believed in.')],
  ['corvid:vindicated', ep(fate('corvid', 'vindicated'), 'Corvid', 'Corvid is back in the worst chair in the back room, pretending not to be pleased that the scene rebuilt itself around her ethic. She still says nobody organized the \'94 wipe. She still organized it.')],
  ['corvid:martyred', ep(fate('corvid', 'martyred'), 'Corvid', 'Corvid got eight years. Her last post was two lines: "Keep the lights on. Don\'t sell the building." Somebody, somewhere, is keeping the lights on. You hope it\'s you.')],
  ['corvid:exile', ep(fate('corvid', 'exile'), 'Corvid', 'Corvid vanished the night the board went dark. Somewhere there is a server nobody can visit and she is the only one with the key. A commons of one. It is the saddest thing you know, and she would hate that you think so.')],
  ['corvid:bought', ep(fate('corvid', 'bought'), 'Corvid', 'Corvid took the glass office and the desk that cost more than your first car. Nobody on the board says her name. She told you once it was warmer than a cell. She wasn\'t wrong. She wasn\'t right either.')],

  ['mom:healthy', ep(fate('mom', 'healthy'), 'Mom', 'Mom walks the Row every morning, doctor\'s orders, reporting the entire neighborhood\'s business like a war correspondent. She still doesn\'t understand what you do. She understands you sleep better now, and a mother can work with that.')],
  ['mom:recovered_dark', ep(fate('mom', 'recovered_dark'), 'Mom', 'Mom is alive on money you will never explain, and she has stopped asking, and sometimes you catch her reading your face like a letter in a language she used to know. She kisses your forehead anyway. That is what love does with what it cannot forgive.')],
  ['mom:passed', ep(fate('mom', 'passed'), 'Mom', 'Mom\'s reading glasses are still on the kitchen windowsill at the flat. Nobody has moved them. You go sometimes and don\'t move them either. It turns out grief is just love with nowhere to be on a Sunday.')],

  ['dad:retrained', ep(all(fate('dad', 'retrained'), not(flag('npc.dad.business'))), 'Dad', 'Dad is the Row\'s tech guy now. Half the neighborhood calls him when the screen goes blue, and he charges in casseroles, and he is happier than the mill ever made him.')],
  ['dad:business', ep(all(fate('dad', 'retrained'), flag('npc.dad.business')), 'Dad', 'PC DOCTOR, booked solid. Dad had cards printed and gives them to everyone twice, including you. He fixed something. Long as one of us can fix something.')],
  ['dad:mill_ghost', ep(fate('dad', 'mill_ghost'), 'Dad', 'Dad walks the same floor he walked for twenty years, between machines that don\'t need him, making sure they stay cold. He calls it just a job. He is careful never to call it the mill, and he calls it the mill anyway, every time.')],
  ['dad:spiral', ep(fate('dad', 'spiral'), 'Dad', 'Dad drinks now, quietly, getting smaller. You could not fix it. Some things do not have a toolbox for the occasion, and he taught you that too, without meaning to, at the end.')],
  ['dad:dating_again', ep(fate('dad', 'dating_again'), 'Dad', 'Dad is seeing Bernadette, who laughs at his jokes, which nobody has done in years. He is so plainly happy you have to look at your plate. It is the best thing you never planned.')],

  ['kim:thriving', ep(fate('kim', 'thriving'), 'Kim', 'Kim got out: the good school upstate, an emergency-contact form with your name on it, a mean streak aimed only at deserving targets. You were a warning that loved her, and it worked.')],
  ['kim:follows_in', ep(fate('kim', 'follows_in'), 'Kim', 'Kim followed you in, frighteningly good, with none of your excuses. You taught her the part where she doesn\'t get caught, and the part where she knows when to stop, and you lie awake wondering if the second part took.')],
  ['kim:endangered', ep(fate('kim', 'endangered'), 'Kim', 'Kim is safe now, mostly. She still sleeps with the light on. She stopped joking about it. You would burn the whole city again to take that light out of her eyes, and you both know it, and neither of you says so.')],
  ['kim:estranged', ep(fate('kim', 'estranged'), 'Kim', 'Kim finds a reason to be at a friend\'s house when you come to dinner. You send birthday cards. They are not returned, exactly. They are just never mentioned.')],

  ['grace:married', ep({ npc: 'grace', romance: 'married' }, 'Grace', 'Grace still checks your pupils when you come home late, and you still let her. Married to one of your two lives, and she chose the one that comes home, and so, it turns out, did you.')],
  ['grace:with', ep(all(graceWithYou, not({ npc: 'grace', romance: 'married' })), 'Grace', 'Grace comes off her night shifts and you off yours, nurse and hacker on the same broken schedule, and it works, most of the time, which is more than either of you expected.')],
  ['grace:whistleblower', ep(fate('grace', 'whistleblower'), 'Grace', 'Grace saved her ward and went public, and the board hates her and her patients send cards by the shoebox. She did the brave thing you spent a decade circling. She makes it look like nothing. It is not nothing.')],
  ['grace:left', ep(fate('grace', 'left'), 'Grace', 'Grace left, and she was right to. You still drive past Harbor General on the way to places that are not on the way.')],

  ['kroll:arrested', ep(fate('kroll', 'arrested'), 'Vanessa Kroll', 'Kroll walked out of Aperture in handcuffs and said good morning to the receptionist by name. She is a cautionary story now, told to interns who don\'t believe the market was ever a person.')],
  ['kroll:cut_loose', ep(fate('kroll', 'cut_loose'), 'Vanessa Kroll', 'Kroll\'s own people burned her. She is in a very nice apartment with a sea view, waiting to see what everyone does now that the warm voice is switched off. Her birthday card still arrives on time. You still don\'t open it right away.')],
  ['kroll:flips', ep(fate('kroll', 'flips'), 'Vanessa Kroll', 'Kroll turned on the whole machine, gracefully, a lawyer on each side and a smile for the cameras. The market, insuring itself. You never did decide if she meant a word of any of it, and you suspect that was always the point.')],

  ['reyes:handler', ep(fate('reyes', 'handler'), 'Agent Reyes', 'Reyes is your handler and, against every odd, your protector. When the office wanted to throw you away, she lost the paperwork. Neither of you says the quiet part. Both of you know it.')],
  ['reyes:broken', ep(fate('reyes', 'broken'), 'Agent Reyes', 'Reyes blew the whistle on her own agency. They took her badge. She kept the notebook. Last you heard she was the only person in any room who had read everything.')],
  ['reyes:nemesis', ep(fate('reyes', 'nemesis'), 'Agent Reyes', 'Reyes hunts you still. It isn\'t personal, and that is what makes it unbearable. You came up the same road, believing the same thing, and split at the one fork that mattered.')],

  ['deadline:saves_you', ep(fate('deadline', 'saves_you'), 'Deadline', 'Deadline knew a way out nobody had used since \'94, and he walked you through it without once saying "I told you so." He got his dog back. He earned the dog.')],
  ['deadline:mentor', ep(fate('deadline', 'mentor'), 'Deadline', 'Deadline is still in the worst chair in the back room, nearest the door, teaching kids to back up their lives and not their data. He is a cautionary tale who lived, which is the rarest kind.')],
  ['deadline:passed', ep(fate('deadline', 'passed'), 'Deadline', 'Deadline is gone, and his chair stays empty, and nobody sits in it, and nobody has to say why.')],

  ['byteme:pro', ep(fate('byteme', 'pro'), 'byteme', 'Kevin grew careful. He uses capital letters now, sometimes, when it matters. One day he is going to be better than you, and you are going to be so proud you\'ll have to leave the room.')],
  ['byteme:arrested_young', ep(fate('byteme', 'arrested_young'), 'byteme', 'Kevin was arrested before he was old enough to vote. His mother won\'t look at you in the street. You taught him the fast part and forgot to teach him the careful part in time.')],
  ['byteme:turns', ep(fate('byteme', 'turns'), 'byteme', 'Kevin felt used, and he turned, and there is a file with your name in it written in all lowercase. You cannot even be angry. You read the file. He was right about most of it.')],
  ['byteme:dead', ep(fate('byteme', 'dead'), 'byteme', 'Kevin is gone, younger than you were when you started. You still have his last page saved: "its fine right. right??" It was not fine. You knew it wasn\'t. You still have the page.')],

  ['dee:councilwoman', ep(fate('dee', 'councilwoman'), 'Councilwoman Briggs', 'Dee won her seat by eleven votes and framed the recount. She campaigned on potholes, library hours, and computer literacy for every grandmother on the Row. She heals the customer. She is, God help everyone, very good at it.')],
  ['sal:base', ep(fate('sal', 'base'), 'Sal', 'Sal\'s back room is yours now. He pretends not to know what goes on back there and charges you for the pie, and the pie is the price of never being alone at three in the morning, and it is cheap at the price.')],
  ['dialtone:honored', ep(fate('dialtone', 'honored'), 'Marge', 'Marge Osgood still walks the Row every morning, counting the old telephone poles like rosary beads. She got her keys back. She got her building back, more or less. Thirty years of somebody\'s working life, honored at last.')],
  ['kroll:boss', ep(fate('kroll', 'boss'), 'Vanessa Kroll', 'Kroll still runs Special Accounts, warm and reasonable and never once lying to you. She sends a car to your birthday dinner every year. You have stopped sending it back.')],
  ['hollis:rising', ep(fate('hollis', 'rising'), 'Miles Hollis', 'Hollis took the seat when Kroll fell. He closes files. Somewhere in a grey cabinet there is one with your name on it, and he has not closed it yet, and he wants you to know that he has not.')],
  ['hollis:your_ally', ep(fate('hollis', 'your_ally'), 'Miles Hollis', 'Hollis keeps his word in the narrow way locks keep faith with keys. Your file stays shut. You traded the warmest monster in the city for the coldest one, and some nights you can hear the drawer not opening.')],
  ['calderon:ally', ep(fate('calderon', 'ally'), 'Detective Calderon', 'Calderon made her arrest with a budget of nothing and a modem from 1997, and ruined exactly the right people\'s year. She still calls you "the civilian" with air quotes you can hear over the phone.')],
  ['calderon:the_one_who_cuffs_you', ep(fate('calderon', 'the_one_who_cuffs_you'), 'Detective Calderon', 'In the end it was Calderon who put the cuffs on you, clean and by the book, and read you your rights like she was sorry about it. She was. She did it anyway. That is the whole difference between her and everyone else who wanted you.')],
  ['calderon:forced_out', ep(fate('calderon', 'forced_out'), 'Detective Calderon', 'Calderon got squeezed out of the Cage, budget first and then badge. She runs security for a hardware store in Ridgeport now and tells anyone who will listen that the city is being read like a book.')],
  ['calderon:expanded', ep(fate('calderon', 'expanded'), 'Detective Calderon', 'Federal money grew the Cage into a real unit: new building, new toys, a waiting list. Calderon hates every minute of it and is very, very good at it, and she is not your friend anymore, if she ever was.')],
  ['vale:flames_out', ep(fate('vale', 'flames_out'), 'Marcus Vale', 'Marcus Vale is selling the future to a smaller room now: a seminar circuit, a book nobody finished, a turtleneck that has seen things. He is still very convincing. He is just convincing fewer people.')],
  ['vale:exposed', ep(fate('vale', 'exposed'), 'Marcus Vale', 'Vale\'s name is a verb in the business pages now, and not a flattering one. He blames the market. The market, for once, has an alibi.')],
  ['vale:escapes_clean', ep(fate('vale', 'escapes_clean'), 'Marcus Vale', 'Vale cashed out at the top and lives on a boat that is also, for tax purposes, a company. He was never charged with anything. That was always the product he was actually selling.')],
  ['switch:sellout', ep(fate('switch', 'sellout'), 'Switch', 'Switch got the scene paid, exactly as promised, and the scene bled out collecting. He drives a nice car past the Sodium Row back room sometimes, slowly, the way you drive past a house you used to live in.')],
  ['switch:converted', ep(fate('switch', 'converted'), 'Switch', 'Switch came back around to the commons, loudly, the way converts do. He still thinks it should pay rent. He just pays it himself now, and does not mention it.')],
  ['switch:new_sysop', ep(fate('switch', 'new_sysop'), 'Switch', 'Switch runs the board. It has a price list now, and a better uptime than it ever had under Corvid, and nobody can quite say what is wrong with it, which is what is wrong with it.')],
  ['switch:casualty', ep(fate('switch', 'casualty'), 'Switch', 'Aperture used Switch and then discarded him, cleanly, the way it discards everything. He sends you a message once, years later, one line: "you were right. corvid was right. it doesn\'t matter now." It matters. You don\'t tell him that.')],
  ['sal:diner_closed', ep(fate('sal', 'diner_closed'), 'Sal', 'Sal sold the Cathode\'s booths to a salvage man for forty dollars apiece. He kept one stool. It is in his kitchen, and nobody is allowed to sit on it, and he will not say who he is saving it for.')],
  ['sal:took_a_fall', ep(fate('sal', 'took_a_fall'), 'Sal', 'When the heat finally reached the Row, Sal took the fall for the back room so nobody else had to. He never said a word about who used it. In my day we had a rotary phone and a knife, he told the judge. The judge did not know what to do with that.')],
  ['sal:anchor', ep(fate('sal', 'anchor'), 'Sal', 'Sal is still behind the counter at four in the morning with a pot in each hand, telling everyone they look like a dropped call. Eat, he says. Eat. Some things the city cannot enclose.')],
  ['dee:promoted', ep(fate('dee', 'promoted'), 'Dee', 'Dee is somebody\'s boss again, absurdly, magnificently, running a department that does not know what RAM is and is proud of it. She still heals the customer. The customer, these days, is a board of directors.')],
  ['rosa:treated', ep(fate('rosa', 'treated'), 'Rosa', 'Rosa Ferreira is well. She is studying nursing, of all things, and she corrects Jax\'s posture at dinner, and she has never once asked where the money came from, which is a kindness she learned from her brother.')],
  ['rosa:worsens', ep(fate('rosa', 'worsens'), 'Rosa', 'Rosa\'s bills never fully got paid. She manages. People manage. That is the word everyone uses, and it covers a lot of nights nobody talks about.')],
  ['okoro:ally', ep(fate('okoro', 'ally'), 'Prof. Okoro', 'Professor Okoro stopped not asking where the rain came from. Her grant is gone, and her new one is smaller and clean, and her students are the best-paranoid class Lumen State has ever graduated.')],
  ['okoro:complicit', ep(fate('okoro', 'complicit'), 'Prof. Okoro', 'Professor Okoro still does not ask the cloud where the rain came from. Her lab has a new wing. Your thesis is in its library, bound in blue, with the chapter you buried missing from the table of contents.')],
  ['northlink_wes:whistle', ep(fate('northlink_wes', 'whistle'), 'Wes Tran', 'Wes leaked the tap with you and lost the job for it, and runs a repair shop now that keeps no logs at all. A sign by the register says so. Customers find it either very reassuring or very suspicious.')],
  ['northlink_wes:company_man', ep(fate('northlink_wes', 'company_man'), 'Wes Tran', 'Wes installed the tap and got promoted, and keeps everything, because the law says to. I just run the pipe, man, he says, and he says it less often every year.')],
  ['list_activist:warned', ep(fate('list_activist', 'warned'), 'Nadia Bell', 'Nadia Bell, a stranger on a list you were never supposed to read, moved her meetings to a church hall because you told her to. Every winter a card comes with no return address. It just says: still here.')],
  ['list_activist:detained', ep(fate('list_activist', 'detained'), 'Nadia Bell', 'Nadia Bell was detained in the sweep and released nineteen days later without charge. She does not organize anymore. You did not warn her. You think about the three days a warning would have cost you, and how cheap they seem now.')],
  ['list_activist:disappeared', ep(fate('list_activist', 'disappeared'), 'Nadia Bell', 'Nadia Bell is still missing. Her bike is still chained outside the Millgate library, rusting in the fog, and nobody from the city has come to cut the lock. You walk past it on purpose.')],
  ['dialtone:passed_keys', ep(fate('dialtone', 'passed_keys'), 'Marge', 'Marge is gone. She left you her keys and a note in careful operator\'s handwriting: "Mind the frame room. It floods." You minded it. You brought the building with you, like she asked.')],
]

/**
 * The cast epilogue: every per-person slide whose condition holds, except the keys (or whole people,
 * by bare npc id) an ending replaces with its own version.
 */
const cast = (...except: string[]): Slide[] =>
  CAST.filter(([k]) => !except.some(e => k === e || (!e.includes(':') && k.startsWith(`${e}:`)))).map(([, slide]) => slide)

/** One person's cast slides. */
const castOf = (npc: string): Slide[] => CAST.filter(([k]) => k.startsWith(`${npc}:`)).map(([, slide]) => slide)

/** Add a guard to a set of slides: they show only while `c` does NOT hold. */
const unless = (c: Cond, slides: Slide[]): Slide[] => slides.map(sl => ({ ...sl, if: sl.if ? all(sl.if, not(c)) : not(c) }))

// The mirror and the Oracle, read as combined identity + outcome (§4.5).
const mirrorSlides = (): Slide[] => [
  ep(flag('mir.outcome', 'redeemed'), 'The Mirror', [
    { if: flag('mir.identity', 'jax'), text: 'It was Jax, all along, every time you forgot to call back getting a little better at being you. You turned him back. The shadow walks half a step behind now, which is where it always secretly wanted to be.' },
    { if: flag('mir.identity', 'mira'), text: 'It was Mira, who learned your methods completely and then chose, in the end, to stand beside them instead of against. The redemption was mutual. It usually is.' },
    { if: flag('mir.identity', 'byteme'), text: 'It was Kevin, the kid who worshipped you and then had to become you, alone. You gave him back to himself. He forgave you the using. That was the harder crack, and you finally read the source.' },
    { if: flag('mir.identity', 'stranger'), text: 'It was Marcus Doyle — l33tKÎLLƏR, the flamer from your first month, who never stopped keeping score. You helped him anyway, and he sent one message, all lowercase, no skulls: "thanks. sorry about the fonts."' },
  ]),
  ep(flag('mir.outcome', 'defeated'), 'The Mirror', 'You beat the shadow, and it cost more than you expected, which is the only way you knew it was real. Somewhere, whoever it was under the handle is living a quieter life, or a bitterer one, or both.'),
  ep(flag('mir.outcome', 'truce'), 'The Mirror', 'You let the mirror win one, to save a life. A truce: the first thing the two of you ever shared. It holds. Truces between people who understand each other completely usually do.'),
  ep(flag('mir.outcome', 'victorious'), 'The Mirror', 'The mirror won, and you let it happen by not showing up, and they noticed. Whoever it was got to be the version of you that never stopped to make friends. They are welcome to it.'),
]

// ── The eleven endings ────────────────────────────────────────────────────────

const E_SECRET: EndingDef = {
  id: 'end_long_con',
  title: 'The Long Con',
  tagline: 'You played everyone, and nobody knows it was you.',
  tone: 'weird',
  text: [
    'Here is the thing about being a double agent for long enough: eventually you are not lying to anyone in particular. You are just the only person holding the whole picture, and the picture is a machine you built out of everybody else\'s certainties.',
    'The Bureau thinks you were theirs. Aperture thinks you were theirs. The Loft thinks you never left. Each of them is right, and each of them is wrong, and the seam where those two facts meet is exactly your size.',
    { if: finaleFail, text: 'Almost. There is one record you couldn\'t reach, one loose thread in an operation of ten thousand tight ones. It is nothing. It is probably nothing. You have started sleeping in a different room every few nights, is all.' },
    { if: finalePass, text: 'You walk out of the whole decade clean, rich enough, free, and unbelievably tired, carrying the one thing none of them will ever have: the truth about all of them, and the peace of never needing to use it.' },
  ],
  epilogues: [
    ep(all({ var: 'w.mnsa', eq: 0 }, flag('a3.vote_resolved')), 'The Law', 'The surveillance law is dead, and you are one of maybe three people alive who knows how many hands it took to kill it, and that two of those hands were pretending to build it.'),
    ep(flag('w.aperture_state', 'destroyed'), 'The Machine', 'Aperture is ash. You were on the org chart the whole time. Your severance cleared last week.'),
    ep(not(flag('w.scene_state', 'dark')), 'The Scene', 'The Loft still meets. They tell a story about a ghost who was on every side and no side, and they have it almost exactly wrong, which is how you know you did it right.'),
    apertureSlide,
    listSlide,
    ...cast(),
    ...mirrorSlides(),
    ep(finaleFail, 'The Knock That Hasn\'t Come', 'You keep a bag packed. Not from fear, exactly. From respect. One surviving record, somewhere, with a shape that might one day be recognized as yours. The con was long. It may not be over. The best ones never quite are.'),
    ...MARKS,
    ...WARM,
  ],
}

const E8: EndingDef = {
  id: 'end_scorched',
  title: 'Scorched Earth',
  tagline: 'You proved you could end it. That was never the same as saving it.',
  tone: 'bad',
  text: [
    'Aperture, the Bureau office, Halcyon — all of it burning in overlapping scandals you set with your own hands, each fire true enough that nobody could call it a lie. The Network Security Act collapsed in the smoke. Nobody is watching anyone now. Nobody has the budget.',
    'It is a Pyrrhic bonfire. The city\'s whole tech economy craters; good people lose jobs alongside the guilty; the recession has a face on the Row and you put it there. You are the only one who understands why all of it happened, and there is no one left to explain it to.',
    { if: finalePass, text: 'You are somewhere far away when the last of it goes up, feeding coins to a payphone, genuinely unsure whether you saved this city or just proved you could be the one to end it.' },
    { if: finaleFail, text: 'You are implicated in the last of it, and there was no far away to get to in time. It was a bus ticket, not a phone call. You watch the smoke from the window of a Greyhound and cannot tell if you are crying or if it is just the diesel.' },
  ],
  epilogues: [
    ep(undefined, 'The Recession', 'Downtown vacancies climb. The salaries you burned don\'t come back for years. The people who lost the least were the ones most responsible, because they always are, because burning it all down turns out to hurt the bottom worst of all.'),
    ep(fate('jax', ['free', 'backroom_partner']), 'Jax', 'Jax leaves a voicemail you don\'t return, then another, then he stops. He never once asks whether it was you. That is the part you can\'t forgive: that he already knows, and loves you anyway, and you burned the town he lives in.'),
    apertureSlide,
    cameWithYou,
    ...cast('jax:free', 'jax:free_away', 'jax:backroom_partner', 'sal:base', 'grace:with', 'grace:married', 'mira:married', 'mira:partner'),
    ...MARKS,
    ...WARM,
  ],
}

const E1: EndingDef = {
  id: 'end_reckoning',
  title: 'The Reckoning',
  tagline: 'The city is poorer, freer, and remembers your handle.',
  tone: 'bittersweet',
  text: [
    { if: all(flag('end.has_evidence'), finalePass), text: 'You published everything, and it held. Aperture collapses; NorthLink\'s surveillance contracts cancel overnight; the whole quiet machine that learned to read a city is dragged into daylight and does not survive the light.' },
    { if: all(flag('end.has_evidence'), finaleFail), text: 'You published everything, and it landed — but the run went wrong at the end, and the trace closed on you before the story did on them. Aperture falls. So, in a quieter way, do you. Martyrdom was never the plan. It rarely is.' },
    { if: not(flag('end.has_evidence')), text: 'You published everything you had, which was not quite enough. They called it a hoax, a disgruntled fantasy, and mostly buried it — but you named them, out loud, with your own name, and some things cannot be un-named. The seed is in the ground. It will be a long winter.' },
    'You are a hunted celebrity, indicted and adored, the handle that finally said it. You skip the city, or take a plea and become a reform advocate. Either way, you are done being anonymous.',
  ],
  epilogues: [
    ep(spine('loft'), 'How It Was Told', 'They told it the Loft way: no byline, raw, Robin Hood with a modem. The scene claims you. You let them. It was always more theirs than yours.'),
    ep(spine('bureau'), 'How It Was Told', 'They told it the Bureau way: chain of custody, a court, your name on the docket and the witness list. Clean. Cold. It stuck, which the Loft way never quite does.'),
    ep(all(not(spine('loft')), not(spine('bureau'))), 'How It Was Told', 'They told it the only way left to you: one civilian with the whole truth and no institution to hide behind. Just a person and a stack of proof and a very deep breath.'),
    cityMnsa,
    apertureSlide,
    cityMeridian,
    ep(fate('priya', 'martyr'), 'Priya', 'Priya testifies beside you. Two difficult, overdue people, finally in the same room telling the same truth. The industry never forgives either of you. Neither of you asked it to.'),
    ep(fate('corvid', ['vindicated', 'succeeded']), 'Corvid', 'Corvid reopens the board, or blesses whoever does. The commons was right. It took the whole machine burning to prove it, but the commons was right.'),
    ep(all(fate('jax', 'backroom_partner'), { var: 'w.cathode_open', eq: 1 }, not(youLeftTown)), 'Jax', 'And Jax runs the Cathode back room, coffee hot and door open, telling everyone he always knew you\'d be the one to bring the whole thing down. He did, actually. He always said it. Nobody believed him but you.'),
    cityHalcyon,
    cityCathode,
    sceneSlide,
    listSlide,
    toasterSlide,
    ...cast('priya:martyr', 'corvid:vindicated', 'corvid:succeeded', 'jax:backroom_partner'),
    ...mirrorSlides(),
    ep(finaleFail, 'The Cost', 'You paid for the reckoning with your own freedom. Somewhere there is a cell, or a border, or a witness-protection town with your new dull name. The city is free-er. You are not. You decided that trade a long time ago, at a kitchen table, and you would decide it again.'),
    ...MARKS,
    ...WARM,
  ],
}

const E2: EndingDef = {
  id: 'end_ghost_king',
  title: 'The Ghost King',
  tagline: 'You wake at 6:14. The model predicted 6:15.',
  tone: 'bad',
  text: [
    { if: fate('kroll', 'made_you'), text: 'Kroll handed you her seat and retired somewhere with a sea view. You are Special Accounts now. The warm voice on the phone that used to make you feel like the smartest person at the table — that\'s you, these days. You are very good at it. That is the problem.' },
    { if: not(fate('kroll', 'made_you')), text: 'You sold it. All of it. The wire cleared before dawn and you are richer than the mill paid your father in thirty years, and dirty in a way no shower reaches. You won the game the world actually plays. Your friends were playing a different one.' },
    'You wake at 6:14. The model predicted 6:15. You are inside the machine now, or you are its best customer, and either way it knows you better than anyone who loves you ever managed to, because you sold it every version of yourself for a good price.',
    { if: finaleFail, text: 'Or — the run went wrong, and the machine got the key without quite getting you. Absorbed and forgotten, a login that still works attached to a person who no longer matters. The seat was real. The power in it was always someone else\'s.' },
  ],
  epilogues: [
    ep({ faction: 'fac.hood', gte: 21 }, 'The Guilty Benefactor', 'You quietly fund the Row from inside the machine: a scholarship here, a diner\'s back rent there, all anonymous, all untraceable, all a kind of apology nobody asked for and nobody would accept if they knew the source. It is the most honest thing you do now, and you do it in the dark.'),
    ep(fate('kroll', 'made_you'), 'Vanessa Kroll', 'Kroll sends a birthday card every year, on time, from the coast. You tell interns about her the way she once told you about the market: warmly, and as a warning, and you cannot tell anymore which one you mean.'),
    ep(fate('jax', ['free', 'backroom_partner', 'gone', 'flipped']), 'Jax', 'Jax doesn\'t return your pages. Not out of anger. Out of a kind of mercy, maybe: he can see what you\'ve become, and he loved the other guy, and he is letting that guy stay dead in his memory rather than watch him answer the phone.'),
    ep(fate('jax', ['dead', 'arrested']), 'Jax', 'Jax is gone or behind glass, and you have the money now that could have changed everything if it had come a decade and a different person earlier. You send it anyway. It bounces off the past like light off a dark monitor.'),
    ep(all(fate('mira', ['rival', 'partner']), not({ npc: 'mira', romance: ['partner', 'married'] })), 'Mira', 'Mira works two floors down and does not look at you in the elevator. She read the source on you years ago and found the flaw and had coffee. She was always going to be right. It was the one thing you hoped she\'d be wrong about.'),
    ep(married, 'The Final Shot', 'And your own child, asleep down the hall in a house the machine paid for, whose whole life it has already started quietly scoring. You watch the crib on a monitor you did not choose to install. It came with the seat. Everything comes with the seat.'),
    apertureSlide,
    listSlide,
    ...cast('kroll', 'jax', 'mira:rival', 'mira:partner'),
    ep(finaleFail, 'Absorbed', 'The system needed your key, not you. It has the key now. You are a line item it keeps meaning to review. There are worse fates than being the villain. Being the villain\'s spare login is one of them.'),
    ...MARKS,
    ...WARM,
  ],
}

const E3: EndingDef = {
  id: 'end_handoff',
  title: 'The Handoff',
  tagline: 'You gave up being the protagonist so the ending could be good.',
  tone: 'bittersweet',
  text: [
    'You gave the whole truth to the one person you trust to use it right, and then you did the hardest thing a person who needs to be the one who solves it can do: you stepped out of the story so it could end better than you could make it end.',
    { if: finalePass, text: 'You vanish clean. A postcard to the Row, no return address. The scene tells stories about the ghost who held the entire thing in one hand and walked away with nothing, and cannot decide if it is the best or the saddest thing they ever heard. It is both. It is always both.' },
    { if: finaleFail, text: 'You meant to vanish clean. The handoff landed, but the run didn\'t, and when the trace closed it was your survivor it burned instead of you — the very person you trusted to finish it, now finishing it from the wrong side of a door. You are free. They are not. You would give it back if there were a window to give it back through.' },
  ],
  epilogues: [
    ep(flag('a4.handoff_to', 'priya'), 'Priya', 'Priya finishes what you couldn\'t. She wrote the first true report in \'99 and watched it die in a drawer; she was never going to let this one die. Rule three, at last, done by the one person who had waited longest to do it.'),
    ep(flag('a4.handoff_to', 'reyes'), 'Reyes', 'Reyes builds the case she was never allowed to make, off the books at first and then, when it\'s too big to bury, very much on them. She keeps your name out of it. She keeps the notebook.'),
    ep(flag('a4.handoff_to', 'corvid'), 'Corvid', 'Corvid takes the truth and does with it exactly what twenty years of keeping a commons taught her: she shares it, carefully, with everyone at once, so that no single person can be made to carry it or be broken for it. Including you. Especially you.'),
    ep(finaleFail, 'The One You Trusted', 'The person you handed it to paid the price you meant to pay. They finished the job from inside a cell, or across a border, or from a witness stand with a target on their back. They don\'t blame you. That is the cruelest part: they understood, and they did it anyway, which is exactly why you chose them.'),
    cameWithYou,
    apertureSlide,
    ...cast('priya', 'reyes', 'corvid', 'jax:backroom_partner', 'sal:base', 'grace:with', 'grace:married', 'mira:married', 'mira:partner'),
    ...unless(flag('a4.handoff_to', 'priya'), castOf('priya')),
    ...unless(flag('a4.handoff_to', 'reyes'), castOf('reyes')),
    ...unless(flag('a4.handoff_to', 'corvid'), castOf('corvid')),
    ...mirrorSlides(),
    ep(undefined, 'The Ghost', 'Somewhere warm, or somewhere cold, a person with a dull new name reads about a machine that got taken apart and feels, for one clean second, like they used to feel when a download finished at exactly 100%. Then they get up and make coffee, and are nobody, and it is enough.'),
    ...MARKS,
    ...WARM,
  ],
}

const E10: EndingDef = {
  id: 'end_vesting',
  title: 'Vesting',
  tagline: 'The straight road had an ending after all.',
  tone: 'good',
  text: [
    { if: flag('end.clean_startup'), text: 'You walked out of the whole rotten arrangement and built something clean with Priya. Small, careful, pays everyone on time, sells no one. It will never be Halcyon. That is the entire point of it.' },
    { if: all(not(flag('end.clean_startup')), flag('fac.halcyon.made_partner')), text: 'You made partner. You ascended the legit ladder all the way to the top and discovered, at the top, that you had become the conspiracy in a better suit. The stock vested. The options cleared. The view is excellent. You earned every inch of it, which is the trouble.' },
    { if: finaleFail, text: 'Though the last run left a hairline crack in the clean story — a source of seed money you didn\'t look at hard enough, a rung you\'d rather nobody inspects. Nothing came of it. Nothing has come of it yet.' },
  ],
  epilogues: [
    ep(all(flag('end.clean_startup'), fate('priya', 'cofounder')), 'The Founders', 'You and Priya, names on the same lease, arguing about the coffee budget and the privacy policy with equal seriousness. She kept the mug. She uses it in every all-hands. Rule three, incorporated.'),
    ep(all(flag('end.clean_startup'), fate('reyes', 'turned')), 'Reyes', 'Reyes quit the Bureau and consults for you now: the only person in any room who has read everything, keeping your clean thing honest by knowing exactly how dirty things get.'),
    ep(fate('vale', 'patron'), 'Vale', 'Vale keeps his secret and you keep his, and his protection covers your friends like an expensive umbrella you try not to look up at too often.'),
    ep(fate('vale', 'reformed'), 'Vale', 'Vale cut the dirty money loose and got, somehow, more likeable for it. He tells the story of the hard road back and mostly means it, and you are, God help you, mostly glad for him.'),
    ep(all(flag('end.clean_startup'), finaleFail), 'The Seed Money', 'The clean company took one check it should not have, early, from a fund with a pleasant name and a Millgate address. Nobody has noticed. Priya has not noticed. You noticed, and you keep meaning to give it back, and every quarter it gets a little harder to find the edges of.'),
    ep(all(not(flag('end.clean_startup')), flag('fac.halcyon.made_partner'), finaleFail), 'The Same 6:14', 'You wake at 6:14. The model predicted 6:15. You are not Special Accounts, exactly. You are just partner at a firm that buys from them, and tells itself that is a different thing, and is technically correct, and technically correct is the suit you wear now.'),
    cityMeridian,
    apertureSlide,
    ...cast('priya:cofounder', 'vale'),
    ...mirrorSlides(),
    ...MARKS,
    ...WARM,
  ],
}

const E6: EndingDef = {
  id: 'end_witness',
  title: 'Cooperating Witness',
  tagline: 'You did good, and it cost the exact people who taught you how.',
  tone: 'bittersweet',
  text: [
    'Expunged record, a consultant badge, a Bureau salary. You put real predators away — and some friends among them. You made the city safer by the numbers, and the numbers are real, and you check them some nights the way other people check a lock.',
    { if: { faction: 'fac.loft', lte: -20 }, text: 'The scene is destroyed, and you are the reason. The Row doesn\'t invite you to things. You tell yourself the math worked. Some nights you believe it.' },
    { if: not({ faction: 'fac.loft', lte: -20 }), text: 'You kept some bridges standing, somehow, threading the one needle nobody thought could be threaded: an honest badge that never quite forgot which side of the glass it came up on.' },
    { if: finaleFail, text: 'And the last run went wrong, and in the sorting-out of it you learned that cooperating witnesses have owners too, and that you had traded one for a worse one. The badge is real. So is the leash you can\'t quite see.' },
  ],
  epilogues: [
    ep(fate('reyes', 'handler'), 'Reyes', 'Reyes is your partner, and neither of you says the quiet part, and both of you know it, and that unspoken thing is the closest either of you has to a home.'),
    ep(fate('marlow', 'promoted'), 'The Machine', 'They kept the surveillance "for safekeeping." Marlow took the map to headquarters and a promotion with it. You put away the small predators and helped the largest one file for a bigger office. That is the fine print of every deal like yours.'),
    ep(fate('marlow', 'exposed'), 'The Machine', 'You and Reyes ate the rot at the top too, in the end. Marlow\'s hearings ran for weeks. He kept the putter. It is the one clean thing in the whole arrangement, and you hold onto it.'),
    ep(fate('corvid', 'martyred'), 'Corvid', 'Corvid got eight years, and some of the evidence had your fingerprints on the chain of custody. You were Corvid\'s friend once. A young hacker asks you, sometimes, what happened. You never have the words. There aren\'t any that survive being said out loud.'),
    ep({ faction: 'fac.hood', lte: 10 }, 'The Row', 'You don\'t come to the Row much. It is easier for everyone. The people who taught you the craft you now sell back to the government would rather remember the kid than meet the consultant.'),
    ep(flag('fac.bureau.seized'), 'Safekeeping', 'The machine went into a federal building in a truck with no markings, "for safekeeping." You signed the chain of custody. It is the only thing you have ever signed that you would give your hand to unsign.'),
    ep(flag('fac.bureau.served'), 'Served', 'The machine was served to a judge and died on the record, drive by drive, in a courtroom with bad fluorescent lights. Reyes sat in the back row and did not smile until it was over, and then she did not stop.'),
    ep(any(fate('kim', 'follows_in'), fate('byteme', 'pro')), 'The Question', 'A young hacker you half-know corners you at a conference, badge on your lanyard, and asks: "You were Corvid\'s friend once. What happened?" You open your mouth. Nothing that survives being said out loud comes out.'),
    apertureSlide,
    listSlide,
    ...cast('reyes:handler', 'corvid:martyred'),
    ...mirrorSlides(),
    ...MARKS,
    ...WARM,
  ],
}

const E5: EndingDef = {
  id: 'end_keeper',
  title: 'Keeper of the Commons',
  tagline: 'You beat them by outlasting them as something worth belonging to.',
  tone: 'good',
  text: [
    'You run the board now. Smaller, careful, clean — mutual aid, not warez. You did not beat Aperture by destroying it. You beat it by still being here, being the thing a person would rather belong to, long after the machine forgot why it was winning.',
    'The commons held. Forty drives in one night in \'94, and a thousand small refusals since, and now you, keeping the lights on and not selling the building, the way Corvid taught you, the way you\'ll teach whoever comes next.',
    { if: finaleFail, text: 'It is a commons in exile, mostly — the last run cost you the open door, and the board lives on a server nobody can quite visit anymore, passed hand to hand like a rumor. But it lives. That was always the whole assignment: make sure it lives.' },
  ],
  epilogues: [
    ep(fate('byteme', 'pro'), 'byteme', 'byteme — Kevin — is your right hand now, grown and careful and using capital letters when it matters. He is going to be better than you. You are counting on it. That is what a commons is for.'),
    ep(fate('deadline', ['mentor', 'saves_you']), 'Deadline', 'Deadline gets his dog, and the worst chair in the back room, and a standing invitation to tell the \'94 story to anyone who hasn\'t heard it, which by now is almost no one, which does not slow him down at all.'),
    ep(fate('corvid', 'succeeded'), 'Corvid', 'Corvid sends seed catalogs with rude notes in the margins. She named you and walked out clean, into a garden, and checks in exactly often enough to remind you not to sell the building.'),
    ep(fate('corvid', 'vindicated'), 'Corvid', 'Corvid is back in the chair beside yours, and the two of you keep the board together, and she still insists nobody organized the \'94 wipe, and you have stopped arguing, because keeping the commons was never about who gets the credit.'),
    ep({ var: 'w.cathode_open', eq: 1 }, 'The Cathode', 'The Cathode stays open. Sal saves you the stool. The back room and the diner, the board and the counter — the whole small, stubborn, unenclosed geography of a scene that refused to become a market.'),
    ep(flag('fac.loft.side_switch'), 'The Broker', 'It is not a perfect commons. You sold access, once, to keep the lights on, and the scene got paid but lost a little of its soul in the transaction, and Switch reminds you of it with a smile every single time. He is not wrong. He is just not the whole story.'),
    ep(all(finalePass, not(flag('side.corvid_archive'))), 'No Archive', 'There is no dead-man\'s archive behind the board, no off-site copy of the scene\'s memory. You never guarded it when Corvid asked. So the commons lives only in the people who show up, which Corvid would say is the only place it ever lived.'),
    sceneSlide,
    listSlide,
    ...cast('byteme:pro', 'deadline:mentor', 'deadline:saves_you', 'corvid:succeeded', 'corvid:vindicated'),
    ...mirrorSlides(),
    ep(finaleFail, 'In Exile', 'The board is a server nobody can visit now, passed like a key that opens a door that no longer stands anywhere in particular. A commons in exile is still a commons. You tell yourself that. Most days it is even true.'),
    ...MARKS,
    ...WARM,
  ],
}

const E4: EndingDef = {
  id: 'end_civilian',
  title: 'The Civilian',
  tagline: 'You know what you know, and you sleep anyway. Mostly.',
  tone: 'good',
  text: [
    'You buried it, and you chose the light, and the game refuses to fully condemn you for it. A normal job. A mortgage in Millgate. A life on the near side of every glass panel, where the only logs are the ones on the fire.',
    { if: fate('vale', 'reformed'), text: 'You work at Halcyon-clean, of all places, writing dull honest software for a company that learned its lesson expensively.' },
    { if: not(fate('vale', 'reformed')), text: 'You work at a modest firm nobody has heard of, doing work nobody will ever make a movie about, and you go home at six.' },
    'The conspiracy grinds on without you, smaller for your absence, larger than your peace. You know what you know. You sleep anyway. Mostly. It is a happy ending the game lets you feel a little guilty about, which is the only honest kind.',
    { if: finaleFail, text: 'Though you didn\'t get out quite as clean as you meant to, and some years from now there will be a knock, and you will already know, before you open the door, exactly what it is about.' },
  ],
  epilogues: [
    ep(married, 'The Marriage', [
      { if: { npc: 'grace', romance: 'married' }, text: 'You married Grace, who still checks your pupils when you come home late, and lets you keep the one life now instead of the two. The wound healed crooked and strong.' },
      { if: { npc: 'mira', romance: 'married' }, text: 'You married Mira, and the fridge note still says *hugz* - buy milk, and the router is still tired, and it is, against every projection she ran, a life.' },
    ]),
    ep(all(fate('mom', 'healthy'), married), 'The Grandchild', 'Mom holds a grandchild on a Sunday, reporting the entire maternity ward\'s business, and does not understand what you used to do, and does not need to, because you don\'t do it anymore.'),
    ep(flag('side.slideshow_done'), 'The Photos', 'The photos got digitized. Four Sunday evenings of a scanner and a shoebox, back when it seemed like the least important thing you were doing. It turned out to be one of the only ones that lasted.'),
    ep(fate('kim', 'thriving'), 'Kim', 'Kim graduates, and you sit in the audience being ordinary, being a civilian, being the sibling who got out and made getting out look possible. It is the best work you ever did and nobody will ever know it was work.'),
    ep(flag('fac.bureau.exposed_self'), 'The Knock', 'Years later, a knock. You put yourself on the record once, a long time ago, and records are patient. You open the door. You were always going to open the door. That is the difference between you and the people you buried.'),
    cityHalcyon,
    cityMeridian,
    sceneSlide,
    toasterSlide,
    ...cast('kim:thriving', 'grace:married', 'mira:married'),
    ...mirrorSlides(),
    ...MARKS,
    ...WARM,
  ],
}

const E7: EndingDef = {
  id: 'end_burnout',
  title: 'Burnout',
  tagline: 'The conspiracy didn\'t get you. The idle drift did.',
  tone: 'bad',
  text: [
    'No prison. No glory. Just a body that quit. You are thirty and you feel fifty, and the machine you spent a decade circling never had to lay a finger on you, because the years did the job for it: the hours at the screen while people left the room, one unanswered page at a time.',
    'This is the quiet ending, the one the game was warning you about from the first Sunday you skipped. Not a villain. Not a martyr. Just the slow arithmetic of a life spent optimizing everything except the part that was alive.',
  ],
  epilogues: [
    ep({ var: 'w.hood_soul', gte: 2 }, 'One Warm Room', 'There is one room left that stays warm for you: a counter, a stool, a person who saves it without being asked. You almost let even that one go dark. You didn\'t, quite. Hold onto it. It is the whole difference between this ending and the empty version of it.'),
    ep({ var: 'w.hood_soul', lte: 1 }, 'The Empty Rooms', 'Who still visits: almost no one. What you never finished: almost everything that wasn\'t a job. The apartment is very quiet, and very organized, and you keep the schedule out of habit, painting activities onto hours that don\'t need filling anymore.'),
    ep(fate('mom', 'passed'), 'What It Cost', 'Mom went while you were heads-down on something urgent that you cannot now remember the name of. The glasses are still on the windowsill. You could go move them. You keep meaning to. You keep being busy.'),
    ...CAST.filter(([k]) => /:(dead|arrested|gone|passed|broken|martyred|exile|estranged|left)$/.test(k)).map(([, slide]) => slide),
    ...MARKS,
    ep(undefined, 'The Drift', 'Time passed whether you acted or not. People aged, drifted, got sick, gave up, married strangers, forgot your number. The idle scheduler was the whole moral of the thing, in the end: neglect was a choice, and it had a body count, and the last body on the list is yours, still breathing, staring at a screen.'),
  ],
}

const E9: EndingDef = {
  id: 'end_fog',
  title: 'Fog Over the Lumen Sound',
  tagline: 'The enclosure happened around you.',
  tone: 'bittersweet',
  text: [
    { if: flag('end.uncommitted'), text: 'You never picked a side. You hedged every bet, kept every door half-open, and the fog came in off the Sound the way it always does for people who won\'t choose: quietly, from every direction at once, until the doors didn\'t matter because you couldn\'t find any of them.' },
    { if: not(flag('end.uncommitted')), text: 'The decade closed the way decades do, without a verdict, the enclosure finishing itself around you while you were busy with the parts of it that felt urgent. No reckoning. No ledger. Just the fog, and the sound of a container ship somewhere out in it, clearing its throat.' },
    'The city is watched now, and solvent, and it will not remember your handle, because you never gave it a reason to. You are a person things happened near. It is not the worst way to have lived. It is only the one that leaves the least behind.',
  ],
  epilogues: [
    ep({ var: 'w.cathode_open', eq: 0 }, 'The Diner', 'The Cathode closed, and you didn\'t fight for it, and that is the sentence that sums up the whole decade if you let it: you didn\'t fight for it. Any of it. There was always going to be time.'),
    ep({ var: 'w.hood_soul', gte: 2 }, 'The Stool', 'Sal still saves you a stool, even now, even after everything you didn\'t do. He never explains why. Some people keep a light on out of stubbornness, and it is the only reason the fog didn\'t take you completely.'),
    ep({ var: 'w.hood_soul', lte: 0 }, 'The Counter', 'The counter\'s gone, or it might as well be. There is nobody in this city keeping anything warm for you, and the strange thing is how gradually that happened, how reasonable each step was, how you could not point to the day it became true.'),
    cityMnsa,
    cityMeridian,
    apertureSlide,
    sceneSlide,
    listSlide,
    ...cast(),
    ...mirrorSlides(),
    ...MARKS,
    toasterSlide,
    ep(undefined, 'The Sound', 'Fog over the Lumen Sound, the grey inland sea the city was named for and named nothing after. It comes in every autumn and it does not care who chose what. You watch it from a window. You have gotten very good at watching things from windows.'),
  ],
}

export const ENDINGS: EndingDef[] = [E_SECRET, E8, E1, E2, E3, E10, E6, E5, E4, E7, E9]

// ── The assembler (priority matrix) ───────────────────────────────────────────

const eSecretCond: Cond = all(
  flag('a2.double_agent'),
  flag('end.has_evidence'),
  { var: 'end.doubles', gte: 2 },
  any({ skill: 'opsec', gte: 70 }, all({ skill: 'opsec', gte: 60 }, flag('life.y2k_safehouse'))),
)
const e8Cond: Cond = any(lane('bonfire'), all({ var: 'end.doubles', gte: 2 }, { var: 'factions_at_hostile', gte: 3 }))
const e1Cond: Cond = lane('publish')
const e2Cond: Cond = lane('sell', 'made')
const e3Cond: Cond = lane('handoff')
const e10Cond: Cond = all(
  spine('halcyon'),
  lane('bury', 'none', 'handoff'),
  any(flag('end.clean_startup'), flag('fac.halcyon.made_partner')),
)
const e6Cond: Cond = all(spine('bureau'), flag('fac.bureau.informant'))
const e5Cond: Cond = all(
  flag('fac.loft.sysop', 'player'),
  flag('fac.loft.intact'),
  flag('w.scene_state', 'reformed'),
  fate('corvid', ['succeeded', 'vindicated']),
)
const e4Cond: Cond = all(
  any(lane('bury'), all(lane('none'), any(married, all(any(fate('mom', 'healthy'), fate('kim', 'thriving')), { faction: 'fac.hood', gte: 50 })))),
  not(flag('end.burnout')),
)

/** E7's state condition (also the burnout pre-pass). */
export const e7Cond: Cond = all(
  any({ n: { var: 'sys.burnouts' }, gte: 3 }, { stat: 'health', lte: 25 }),
  ...INNER_CIRCLE.map(n => affLte(n, 15)),
  not(flag('end.has_evidence')),
)

/** The ordered priority chain, first match wins. Returns the ending id it would pick. */
export const ENDING_MATRIX: { id: string; cond: Cond; also?: Effect[] }[] = [
  { id: 'end_long_con', cond: eSecretCond },
  { id: 'end_scorched', cond: e8Cond },
  { id: 'end_reckoning', cond: e1Cond },
  // The headline is the story's to publish (§11.4 news.became_ghost_king); its NewsDef is PKG-16's.
  { id: 'end_ghost_king', cond: e2Cond, also: [{ news: 'became_ghost_king' }] },
  { id: 'end_handoff', cond: e3Cond },
  { id: 'end_vesting', cond: e10Cond },
  { id: 'end_witness', cond: e6Cond },
  { id: 'end_keeper', cond: e5Cond },
  { id: 'end_civilian', cond: e4Cond },
  { id: 'end_burnout', cond: flag('end.burnout') },
]

/**
 * The full assembler: re-finalize fates (Act IV faction finales resolved after q1), set `end.burnout`
 * if E7's state matches, then a nested if/else chain that reaches exactly one ending (E9 is the else).
 */
export function assembleEnding(): Effect[] {
  const burnoutPre: Effect = { if: e7Cond, then: [{ flag: 'end.burnout' }] }
  // Build the nested chain bottom-up; the innermost else is E9.
  let chain: Effect[] = [{ ending: 'end_fog' }]
  for (const row of [...ENDING_MATRIX].reverse()) {
    chain = [{ if: row.cond, then: [...(row.also ?? []), { ending: row.id }], else: chain }]
  }
  return [...finalizeFates(), burnoutPre, ...chain]
}

export default defineContent({ endings: ENDINGS })
