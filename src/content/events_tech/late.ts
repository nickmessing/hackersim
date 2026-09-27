/**
 * events_tech — LATE one-offs (Act III → Act IV, 2009–2012). The internet was supposed to forget;
 * instead it remembers everything except the things you loved:
 *
 *   ev_tech_privacy_flip       era    2009+    Roster flips everyone to public; a decade of tags goes on the market
 *   ev_tech_homestead_closing  era    2009–10  the free homepage host is closing; save the Row's first pages, or don't
 *   ev_tech_lighthouse_last    weird  2009+    the Gull Point cam's last winter (follow-up to ev_tech_lighthouse_cam)
 *   ev_tech_old_machine        life   Act IV   your first beige box turns up in a closet, with 2001 still inside
 *
 * HARD RULE: invented sites, invented crawlers, invented brokers; no real technique anywhere.
 */
import { dayOf } from '@/engine/calendar'
import { defineContent } from '@/engine/registry'
import type { Cond, EventDef, SceneDef } from '@/engine/types'
import {
  GUILT,
  PINNED,
  ROOTED,
  SETTLED,
  actGte,
  around,
  between,
  buff,
  free,
  momHere,
  owe,
} from './_shared'

const parallaxDeep: Cond = { all: [{ flag: 'w.aperture_state', eq: 'thriving' }, { var: 'w.enclosure', gte: 4 }] }

// ─────────────────────────────────────────────────────────────────────────────
// ev_tech_privacy_flip — "We've updated your privacy settings!"
// ─────────────────────────────────────────────────────────────────────────────
const privacyScene: SceneDef = {
  id: 'ev_tech_privacy_flip_scene',
  channel: 'mail',
  title: 'We\'ve updated your privacy settings to give you more control!',
  from: 'Roster',
  start: 'notice',
  pause: true,
  expiresDays: 14,
  onExpire: [buff(PINNED), { stat: 'heat', add: 4 }],
  nodes: {
    notice: {
      speaker: 'Roster',
      text: [
        'Hi {name}! At Roster, we believe the world is better when it\'s more open. That\'s why, starting today, your photos, friends, check-ins and tags are visible to Everyone by default!\n\n(To change this, visit Settings › Privacy › Advanced › More › Visibility › Legacy.)',
        { if: { flag: 'ev_tech.no_roster' }, text: 'You don\'t have a Roster. It turns out that doesn\'t matter: other people do, and they tagged you. Roster has helpfully built you a "shadow profile" out of their photos, waiting for you to claim it.' },
        { if: { not: { flag: 'ev_tech.no_roster' } }, text: 'You click through to see what "Everyone" can see now. It is everything. Every photo anyone ever tagged you in, going back years, in a neat public grid.' },
        { if: { all: [around('jax'), { var: 'w.cathode_open', eq: 1 }] }, text: 'You and Jax in a Cathode booth at 2 a.m., both holding coffee like it\'s a weapon.' },
        { if: around('switch'), text: 'You and Switch outside the back room on Sodium Row, his hand up to block the camera, too late.' },
        'A party photo where, behind your shoulder, a monitor is showing a login screen you would rather nobody recognized.',
        { if: parallaxDeep, text: 'Somewhere in Millgate, you know exactly who is buying this. A PARALLAX crawler is having the best night of its life.' },
      ],
      choices: [
        {
          tag: '[OpSec]',
          text: 'Untag, delete, lock down — everything, tonight, before the crawlers get there.',
          check: {
            skill: 'opsec',
            dc: 17,
            bonuses: [
              { if: { trait: 'paranoid' }, add: 2, label: '+2 (paranoid)' },
              { if: { flag: 'ev_tech.no_roster' }, add: 2, label: '+2 (there was less of you to find)' },
              { if: { flag: 'ev_tech.on_the_map' }, add: 1, label: '+1 (you\'ve been burned before)' },
            ],
            success: 'scrubbed',
            fail: 'scraped',
            successEffects: [{ stat: 'heat', add: -3 }, { xp: 'opsec', add: 40 }, buff(SETTLED)],
            failEffects: [
              buff(PINNED),
              { stat: 'heat', add: 8 },
              { trait: 'ev_tech_scar_on_the_map' },
              { flag: 'ev_tech.profile_scraped' },
              { chance: 0.5, then: [{ complication: 'legal' }] },
            ],
          },
        },
        {
          tag: '[Social]',
          text: 'Ask everyone who ever tagged you to take the photos down. Nicely. Individually.',
          check: {
            skill: 'social',
            dc: 14,
            bonuses: [{ if: { trait: 'empath' }, add: 1, label: '+1 (empath)' }],
            success: 'asked',
            fail: 'asked_fail',
            successEffects: [{ stat: 'heat', add: -2 }, { stat: 'mood', add: 2 }, { if: around('jax'), then: [{ npc: 'jax', affinity: 2 }] }],
            failEffects: [{ stat: 'heat', add: 4 }, { stat: 'stress', add: 4 }],
          },
        },
        {
          if: { not: { flag: 'ev_tech.no_roster' } },
          text: 'Delete your Roster account entirely.',
          effects: [{ stat: 'heat', add: -1 }, { stat: 'mood', add: -2 }, { flag: 'ev_tech.no_roster' }, { if: momHere, then: [{ npc: 'mom', affinity: -2 }] }],
          goto: 'deleted',
        },
        {
          tag: '[Intrusion]',
          text: 'Find the broker who bought the crawl, get inside their copy, and bury yourself under a thousand fake yous.',
          req: { skill: 'intrusion', gte: 45 },
          reqText: 'Requires Intrusion 45',
          effects: [
            { stat: 'heat', add: 3 },
            { stat: 'cred', add: 2 },
            { xp: 'intrusion', add: 40 },
            { flag: 'ev_tech.poisoned_broker' },
            { if: parallaxDeep, then: [{ faction: 'fac.aperture', add: -2 }] },
            { chance: 0.3, then: [{ complication: 'hack', tier: 3 }] },
          ],
          goto: 'poisoned',
        },
      ],
    },
    scrubbed: {
      speaker: 'narrator',
      text: 'You work until four. Untag, untag, untag. Settings › Privacy › Advanced, until the words stop meaning anything. When you finally sit back, your public grid is empty: a grey silhouette and a name. The crawlers came at 2 a.m. They got a silhouette and a name.',
    },
    scraped: {
      speaker: 'narrator',
      text: [
        'You are fast. The crawlers are faster. By the time you reach the photos from three years ago, a data broker called Clearsight Consumer Insight has already copied everything — the tags, the faces, the places, the times.',
        'It will be on sale by Friday, in a file with your name at the top. You will never see it. Other people will.',
        { if: parallaxDeep, text: 'You don\'t have to guess who the biggest customer is. PARALLAX has a new chapter on you.' },
      ],
    },
    asked: {
      speaker: 'narrator',
      text: 'You write thirty-one messages. Twenty-eight people untag you within a day, most of them with "omg of course, sorry!!" The other three had already deleted their accounts. Your grid shrinks to a handful of photos of you with birthday cake. You can live with birthday cake.',
    },
    asked_fail: {
      speaker: 'narrator',
      text: [
        'Half of them think you\'re being paranoid. A few of them take it as a challenge. One — you have a guess who — reposts the back-room photo with the caption "WHO IS THIS MYSTERIOUS FIGURE" and forty people like it.',
        'Asking made it a story. Stories spread.',
      ],
    },
    deleted: {
      speaker: 'narrator',
      text: [
        'You delete it. Roster asks you four times if you are sure and shows you photos of friends who will "miss you." You are sure. The account is gone. The tags other people made of you are not; they just belong to nobody now.',
        { if: momHere, text: 'Mom calls the next day, hurt, because she thinks you unfriended her. You explain. She understands about half of it, and forgives you all of it.' },
      ],
    },
    poisoned: {
      speaker: 'narrator',
      text: 'Clearsight\'s copy of you now has eleven hundred birthdays, four hundred home addresses, and a job history that includes "lighthouse keeper," "professional ghost," and "dolphin." Any file built on it is garbage. They will notice eventually. By then they won\'t be able to tell which of you was real.',
    },
  },
}

const privacyFlip: EventDef = {
  id: 'ev_tech_privacy_flip',
  category: 'era',
  weight: 3,
  when: { all: [{ day: true, gte: dayOf(2009, 5, 1) }, actGte(3), free] },
  scene: 'ev_tech_privacy_flip_scene',
}

// ─────────────────────────────────────────────────────────────────────────────
// ev_tech_homestead_closing — the first pages
// ─────────────────────────────────────────────────────────────────────────────
const deadlinePassed: Cond = { all: [{ npc: 'deadline', met: true }, { npc: 'deadline', fate: 'passed' }] }

const homesteadScene: SceneDef = {
  id: 'ev_tech_homestead_closing_scene',
  channel: 'mail',
  title: 'Homestead Heights is closing its doors on October 26',
  from: 'Homestead Heights',
  start: 'notice',
  expiresDays: 21,
  onExpire: [{ stat: 'mood', add: -3 }, { flag: 'ev_tech.homestead_gone' }],
  nodes: {
    notice: {
      speaker: 'Homestead Heights',
      text: [
        'Dear Homesteader,\n\nAfter thirteen wonderful years, Homestead Heights — the free home on the web for thirty-eight million personal pages — will close on October 26. All pages, guestbooks and files will be permanently deleted.\n\nThank you for building the neighborhood with us.',
        'You know what\'s on there. Your own first page, from 2001: black background, a flaming skull, a hit counter stuck at 000412, and a song file you would prefer not to name.',
        { if: around('grandma_ruth'), text: 'Grandma Ruth\'s page, "RUTH\'S KITCHEN & CATS," forty recipes and a photo of every cat she has ever owned, each with a caption in a different font.' },
        { if: { npc: 'dad', fate: 'retrained' }, text: 'Your father\'s page — "BOB TAN PC DOCTOR, CANNERY ROW, NO JOB TOO SMALL" — which you built for him on a Sunday and which still gets him calls.' },
        { if: deadlinePassed, text: 'And Deadline\'s page. "THEO\'S DEN — est. 1996." His guestbook is still open. The last entry is from this spring: "miss you old man."' },
        { if: around('deadline'), text: 'And Deadline\'s page from \'96: a plain grey list of every book the police took from him in \'94, each with a note on whether he ever got it back.' },
        'Half of the Row\'s first internet is on those servers. In a few weeks it will not be anywhere.',
      ],
      choices: [
        {
          tag: '[Systems]',
          text: 'Archive all of it: every page anyone you know ever made, before the lights go out.',
          check: {
            skill: 'systems',
            dc: 16,
            bonuses: [
              { if: { flag: 'ev_tech.migrated_board' }, add: 2, label: '+2 (you\'ve saved an archive before)' },
              { if: { flag: 'ev_tech.lost_it_all' }, add: 1, label: '+1 (you know what losing it feels like)' },
            ],
            success: 'archived',
            fail: 'banned',
            successEffects: [{ faction: 'fac.hood', add: 3 }, { faction: 'fac.loft', add: 2 }, buff(ROOTED), { flag: 'ev_tech.homestead_saved' }, { xp: 'systems', add: 50 }, { stat: 'mood', add: 6 }],
            failEffects: [{ flag: 'ev_tech.homestead_half' }, { stat: 'mood', add: -6 }, { stat: 'stress', add: 6 }],
          },
        },
        {
          if: around('webmaster'),
          text: 'Call Cal Reeves. He built half these pages for money in \'99. He\'ll have copies.',
          effects: [{ npc: 'webmaster', affinity: 4 }, { faction: 'fac.hood', add: 2 }, { flag: 'ev_tech.homestead_cal' }, buff(ROOTED)],
          goto: 'cal',
        },
        {
          text: 'Save only your own page. The skull. The counter. All of it.',
          effects: [{ stat: 'mood', add: 4 }, { flag: 'ev_tech.kept_skull' }],
          goto: 'own_page',
        },
        {
          tag: '[Leave]',
          text: 'Let it go. The internet was never supposed to be forever.',
          effects: [{ stat: 'mood', add: -2 }, { stat: 'stress', add: -1 }, { flag: 'ev_tech.homestead_gone' }],
          goto: 'let_go',
        },
      ],
    },
    archived: {
      speaker: 'narrator',
      text: [
        'You build a patient crawler that asks nicely and waits between asks, and you let it run for eleven nights. By October 25 you have two hundred and six pages of the Row on a drive: recipes, fan shrines, a church bake-sale page with a spinning cross, three band sites, your skull.',
        { if: deadlinePassed, text: 'Theo\'s Den is on it, guestbook and all. You add one line to the guestbook before the host goes dark. You don\'t tell anyone what you wrote.' },
        'You burn copies and hand them out at the laundromat like church bulletins. Somebody\'s grandmother cries. Somebody else asks if you can put it "back on the internet." You can. You do.',
      ],
    },
    banned: {
      speaker: 'narrator',
      text: [
        'You are too hungry. The host sees a crawler pulling thousands of pages an hour and bans it at 58%. You don\'t know which half you got until you look.',
        { if: deadlinePassed, text: 'Theo\'s Den is in the missing half. The guestbook with "miss you old man" in it is in the missing half.' },
        { if: { all: [{ not: deadlinePassed }, around('grandma_ruth')] }, text: 'Ruth\'s kitchen is in the missing half. Forty recipes. Every cat.' },
        { if: { all: [{ not: deadlinePassed }, { not: around('grandma_ruth') }] }, text: 'Most of the Row is in the missing half: the bake sale, the fan shrines, the band that broke up in 2003.' },
      ],
      choices: [
        {
          tag: '[Networking]',
          text: 'Try again, slowly, from Terminal Velocity\'s connection. Thirteen days left.',
          check: {
            skill: 'networking',
            dc: 15,
            success: 'second_try',
            fail: 'lost_half',
            successEffects: [{ clearFlag: 'ev_tech.homestead_half' }, { flag: 'ev_tech.homestead_saved' }, { faction: 'fac.hood', add: 2 }, buff(ROOTED), { stat: 'mood', add: 4 }],
            failEffects: [buff(GUILT), { stat: 'mood', add: -4 }],
          },
        },
        { text: 'Keep the half you have. Half is better than nothing.', effects: [{ faction: 'fac.hood', add: 1 }, { stat: 'mood', add: -2 }] },
      ],
    },
    second_try: {
      speaker: 'narrator',
      text: 'The café\'s old line is slow and nobody watches it. Your crawler goes gently, like a visitor with good manners, one page every nine seconds for twelve days. On the last night it finishes with four hours to spare. You get the rest. You get all of it.',
    },
    lost_half: {
      speaker: 'narrator',
      text: 'The host is ready for you this time. The second crawler is banned within the hour, and then the servers go dark a week early for "maintenance," and stay dark. Half of the Row\'s first internet is simply gone, the way the paper mill\'s whistle is gone. You were the one who could have kept it.',
    },
    cal: {
      speaker: 'webmaster',
      text: [
        { if: { flag: 'life.webmaster_dark' }, text: 'He picks up on the second ring, too fast, from a number you don\'t recognize. When you explain, his voice changes — goes back ten years. "Oh, man. Yeah. Yeah, I\'ve got those. Basement. Hang on."' },
        { if: { not: { flag: 'life.webmaster_dark' } }, text: '"Homestead? Oh, man." You can hear him smiling. "I have every page I ever built on CD-R in a shoebox. Every one. My wife says it\'s a fire hazard. Come over. Bring a drive."' },
        'Cal\'s shoebox holds forty pages of the Row from \'98 to \'02, including the Cathode\'s first menu page, which has a typo in "cheeseburger" that Sal has never forgiven. You put them back online together. It\'s the happiest you\'ve heard him in years.',
      ],
    },
    own_page: {
      speaker: 'narrator',
      text: 'You save it. The skull flames. The counter says 000412. The song starts, and you laugh until you have to put your head down on the desk, and then for a second it isn\'t laughing. You were so young. You were so sure the internet would stay exactly like this.',
    },
    let_go: {
      speaker: 'narrator',
      text: 'On October 26 you load your old address one last time, at 11:58 p.m., and watch the skull flicker. At midnight, the page doesn\'t load. Nothing loads. Thirty-eight million homes, empty. You close the tab and sit for a minute in the quiet, listening to the rain.',
    },
  },
}

const homesteadClosing: EventDef = {
  id: 'ev_tech_homestead_closing',
  category: 'era',
  weight: 3,
  when: { all: [between(dayOf(2009, 3, 1), dayOf(2010, 5, 30)), actGte(3), free] },
  scene: 'ev_tech_homestead_closing_scene',
}

// ─────────────────────────────────────────────────────────────────────────────
// ev_tech_lighthouse_last — the Gull Point cam's last winter
// ─────────────────────────────────────────────────────────────────────────────
const camFound: Cond = { flag: 'ev_tech.cam_found' }
const camDark: Cond = { flag: 'ev_tech.cam_dark' }
const camOther: Cond = { all: [{ not: camFound }, { not: camDark }] }

const lighthouseLastScene: SceneDef = {
  id: 'ev_tech_lighthouse_last_scene',
  channel: 'mail',
  title: 'Gull Point',
  from: 'Iris Crane',
  start: 'letter',
  expiresDays: 21,
  onExpire: [{ stat: 'mood', add: -3 }, { flag: 'ev_tech.light_went_out' }],
  nodes: {
    letter: {
      speaker: 'Iris Crane',
      text: [
        { if: camFound, text: 'A handwritten letter, scanned, a little crooked, like the first one:\n\n"Dear young person who wrote to me years ago. My knees won\'t do the stairs anymore. The company that holds the camera page is closing its old accounts at the new year. I would like someone to keep the light. I thought of you."' },
        { if: camDark, text: 'After six years of "offline," the Gull Point cam is back. One grey frame every thirty seconds: the Sound, the lamp room window. The page title has changed. It reads: "Sorry I got frightened. The account closes at the new year. — I.C."\n\nUnder it, an email address. You write. She writes back the same night.' },
        { if: camOther, text: 'The Gull Point cam page has a new line of text under the frame, for the first time since you started watching: "Hosting ends December 31. Thank you for watching. Keep a light on. — I.C."\n\nThere is an email address. You write. She writes back by hand, scanned crooked.' },
        'She is nearly ninety now. She tells you about Anselm, about forty years of storms, about the night in \'78 he stayed up with the lamp when the automatic one failed. "People think the light is for ships," she writes. "It was always a little bit for us."',
      ],
      choices: [
        {
          text: 'Take over the hosting. A dollar a day to keep a light on.',
          effects: [
            owe('ev_tech_lighthouse_hosting', 'Gull Point cam hosting (a light you keep on)', 1),
            buff(ROOTED),
            { faction: 'fac.hood', add: 2 },
            { stat: 'mood', add: 6 },
            { flag: 'ev_tech.kept_the_light' },
          ],
          goto: 'hosting',
        },
        {
          tag: '[Hardware]',
          text: 'Drive out to Gull Point and wire a timer to the lamp-room switch, so it flicks on at 3:10 forever.',
          check: {
            skill: 'hardware',
            dc: 15,
            bonuses: [{ if: { flag: 'ev_tech.magic_smoke' }, add: 1, label: '+1 (you respect the smoke)' }],
            success: 'timer',
            fail: 'stairs',
            successEffects: [{ flag: 'ev_tech.kept_the_light' }, buff(ROOTED), { xp: 'hardware', add: 30 }, { stat: 'mood', add: 5 }],
            failEffects: [{ stat: 'health', add: -15 }, { stat: 'stress', add: 4 }, { chance: 0.4, then: [{ complication: 'health' }] }],
          },
        },
        {
          tag: '[Programming]',
          text: 'Build an archive of every frame since 1998 — something that will outlive both of you.',
          check: {
            skill: 'programming',
            dc: 14,
            success: 'archive',
            fail: 'archive_fail',
            successEffects: [{ flag: 'ev_tech.cam_archive' }, { stat: 'mood', add: 4 }, { xp: 'programming', add: 30 }],
            failEffects: [{ stat: 'mood', add: -3 }, { stat: 'stress', add: 3 }],
          },
        },
        { tag: '[Leave]', text: 'Write back kindly. Tell her it\'s all right to let it go dark.', effects: [{ stat: 'mood', add: -3 }, { flag: 'ev_tech.light_went_out' }], goto: 'dark' },
      ],
    },
    hosting: {
      speaker: 'Iris Crane',
      text: [
        '"Thank you," she writes, underlined twice. "Anselm would have liked you. He liked anyone who kept things running."',
        'The cam stays up. Every night at 3:10 the lamp room light goes on for one frame — you never find out how, now that she can\'t climb the stairs, and you decide not to ask.',
      ],
    },
    timer: {
      speaker: 'narrator',
      text: [
        'Gull Point in December is wind and salt and a hundred and nine iron stairs. The lamp room switch is older than your father. You wire a little timer behind it, sealed against the damp, set it to 3:10:00, and test it three times.',
        'That night you watch from home. At 3:10 the light goes on. In the window, for one frame, there is nobody — just the light, doing its job. Iris writes the next morning: "I saw. I cried. Thank you."',
      ],
    },
    stairs: {
      speaker: 'narrator',
      text: [
        'The eleventh stair from the top is not there. It is a rusted suggestion of a stair, and you find out about it with your whole body.',
        'You wire the timer anyway, with a sprained wrist and blood in your mouth. It works for nine nights and then the damp gets it. The light goes dark on the tenth night. Iris writes: "You tried. That\'s more than the lighthouse company ever did."',
      ],
    },
    archive: {
      speaker: 'narrator',
      text: 'Four million frames, eleven years, one lamp room window. You stitch them into a slow, silent film: seasons turning over the Sound, and every night at 3:10 a single flash. You send it to Iris. She says she watched it all the way through, twice, in one sitting, and that she could see him in it.',
    },
    archive_fail: {
      speaker: 'narrator',
      text: 'The old frames are in four different formats and three of them fight you. Your script mangles half of 2002 into grey noise before you catch it. You send Iris what survived. She thanks you. You know which winters are missing, and so, you suspect, does she.',
    },
    dark: {
      speaker: 'Iris Crane',
      text: '"I think you\'re right," she writes. "Everything goes dark. That\'s what makes it worth lighting." On January 1st the page says "offline," and this time it means it. You find, to your surprise, that you check it anyway, now and then, at 3:10.',
    },
  },
}

const lighthouseLast: EventDef = {
  id: 'ev_tech_lighthouse_last',
  category: 'weird',
  weight: 3,
  when: {
    all: [
      actGte(3),
      { day: true, gte: dayOf(2009, 0, 1) },
      { any: [camFound, camDark, { flag: 'ev_tech.cam_watched' }, { flag: 'ev_tech.cam_legend' }] },
      free,
    ],
  },
  scene: 'ev_tech_lighthouse_last_scene',
}

// ─────────────────────────────────────────────────────────────────────────────
// ev_tech_old_machine — the beige box
// ─────────────────────────────────────────────────────────────────────────────
const jaxDead: Cond = { all: [{ npc: 'jax', met: true }, { npc: 'jax', fate: 'dead' }] }
const jaxInside: Cond = { all: [{ npc: 'jax', met: true }, { npc: 'jax', fate: 'arrested' }] }
const jaxFlipped: Cond = { all: [{ npc: 'jax', met: true }, { npc: 'jax', fate: 'flipped' }] }
const jaxGone: Cond = { all: [{ npc: 'jax', met: true }, { npc: 'jax', fate: 'gone' }] }
const jaxHere: Cond = { all: [around('jax'), { not: jaxFlipped }] }
const bytemeDead: Cond = { all: [{ npc: 'byteme', met: true }, { npc: 'byteme', fate: 'dead' }] }
const momGone: Cond = { var: 'w.mom_gone', eq: 1 }

const oldMachineScene: SceneDef = {
  id: 'ev_tech_old_machine_scene',
  channel: 'dialog',
  title: 'The Beige Box',
  from: 'the back of a closet',
  start: 'closet',
  nodes: {
    closet: {
      speaker: 'narrator',
      text: [
        'It turns up behind a garbage bag of old cables: the beige tower you started on. The Kobold Keep sticker, half peeled. The dent in the side panel from the time Kim kicked it. The yellowed power button that always stuck.',
        'It hasn\'t been switched on in years. Somewhere inside it is a drive, and on the drive is a BuddyPager log from the autumn of 2001: every conversation you had before you were anybody.',
        { if: { flag: 'ev_tech.framed_vortex' }, text: 'On the wall above where it used to sit, the framed photograph of a Vortex 9000 XT is still hanging, very slightly crooked.' },
      ],
      choices: [
        {
          tag: '[Hardware]',
          text: 'Coax it back to life: a new power supply, reseat everything, and pray to the old gods of IRQ.',
          check: {
            skill: 'hardware',
            dc: 14,
            bonuses: [
              { if: { background: 'tinkerer' }, add: 2, label: '+2 (you built this thing)' },
              { if: { flag: 'ev_tech.recapped' }, add: 1, label: '+1 (you know these old boards)' },
            ],
            success: 'booted',
            fail: 'dead_box',
            successEffects: [buff(ROOTED), { stat: 'mood', add: 8 }, { flag: 'ev_tech.read_old_log' }],
            failEffects: [{ stat: 'mood', add: -6 }, { stat: 'stress', add: 4 }],
          },
        },
        {
          text: 'Don\'t turn it on. Put it back in the closet. Some things are better left as they were.',
          effects: [{ stat: 'mood', add: 2 }, { stat: 'stress', add: -2 }],
          goto: 'closet_back',
        },
        {
          text: 'Wipe it and donate it to the Row\'s community room, for some kid who needs a first machine.',
          effects: [{ faction: 'fac.hood', add: 2 }, { stat: 'mood', add: 3 }],
          goto: 'donate',
        },
      ],
    },
    booted: {
      speaker: 'narrator',
      text: [
        'The fan whines like a jet. The drive ticks, thinks about it, and spins. A startup chime you had forgotten you knew plays through a speaker full of dust. And there it is: BuddyPager, autumn 2001.',
        { if: jaxDead, text: 'JaxAttack: "dude. DUDE. i got it running on the library machine. best day of my LIFE and also i think i broke the school." You read it four times. Then you sit very still for a long time, with the screen light on your face, and you don\'t close the window.' },
        { if: jaxInside, text: 'JaxAttack: "dude. DUDE. i got it running on the library machine. best day of my LIFE." You print the page. At the next visiting day you slide it across the table. He reads it and laughs so hard the guard looks over, and then he doesn\'t laugh at all.' },
        { if: jaxFlipped, text: 'JaxAttack: "dude. DUDE. i got it running on the library machine. best day of my LIFE." The last time you saw him he was walking out of the Bureau office without looking at you. You forward it anyway. Nine hours later, one line: "i remember." Nothing else. It is more than you expected.' },
        { if: jaxGone, text: 'JaxAttack: "dude. DUDE. i got it running on the library machine." You think about sending it to him. You realize you don\'t have an address for him anymore. You don\'t know when that happened. That is the worst part.' },
        { if: jaxHere, text: 'JaxAttack: "dude. DUDE. i got it running on the library machine. best day of my LIFE." You forward it to him. Four minutes later: "DELETE THIS." Then: "no wait dont." Then: "come to the Cathode. im buying."' },
        { if: momGone, text: 'Halfway down, a line from Kim\'s account, typed one letter at a time: "IS THIS HOW IT WORKS. THIS IS MOM. DINNER IS READY." You read it nine times. You save it in four places.' },
        { if: momHere, text: 'Halfway down, a line from Kim\'s account: "IS THIS HOW IT WORKS. THIS IS MOM. DINNER IS READY." You call her. She doesn\'t remember writing it, and is delighted, and asks if you\'ve eaten.' },
        { if: bytemeDead, text: 'Near the end, a message from a number you didn\'t know yet: "r u the one who knows jax? i need help w/ my modem, it goes slow." Sixteen. You close your eyes.' },
        { if: { all: [around('byteme'), { not: bytemeDead }] }, text: 'Near the end, a message from a stranger who became byteme: "r u the one who knows jax? my modem goes slow." You send it to him. He replies with nine crying-laughing faces and "DELETE THIS IMMEDIATELY."' },
        'You copy the whole log onto three drives, and then you sit with the old machine humming beside you for a while, the way you would sit with an old dog.',
      ],
    },
    dead_box: {
      speaker: 'narrator',
      text: [
        'You flip the switch. There is a crack from near the power supply and a smell you know from years ago: the magic smoke, leaving. The drive never spins up. You try everything you know. Nothing.',
        'Whatever you said to each other in the autumn of 2001 is gone. Or not gone — just locked in a box you can no longer open, which is somehow worse.',
      ],
      choices: [
        {
          text: 'Take the drive to the recovery lab in Millgate. Whatever it costs.',
          req: { stat: 'money', gte: 400 },
          reqText: 'Requires $400',
          effects: [{ money: -400 }, buff(ROOTED), { stat: 'mood', add: 6 }, { flag: 'ev_tech.read_old_log' }],
          goto: 'lab',
        },
        {
          text: 'Let it be. You remember enough of it. Probably.',
          effects: [{ flag: 'ev_tech.old_log_lost' }, { stat: 'mood', add: -2 }],
          goto: 'let_be',
        },
      ],
    },
    lab: {
      speaker: 'narrator',
      text: [
        'The same clean-room lab. A younger technician now. Six days later: one CD-R, labeled in marker, BUDDYPAGER 2001.',
        { if: { any: [jaxDead, jaxInside, jaxFlipped, jaxGone] }, text: 'The first line is from Jax. It says "dude." You have to stop reading for a while after that.', else: 'The first line is from Jax. It says "dude." Of course it does.' },
        'You read it all, from the beginning, in one sitting, like a book about someone you used to know very well.',
      ],
    },
    let_be: {
      speaker: 'narrator',
      text: 'You put the dead box back behind the cables. You tell yourself you remember how it went. You mostly do. The details have gone soft, like an old photograph left in a window. Maybe that\'s how memory is supposed to work.',
    },
    closet_back: {
      speaker: 'narrator',
      text: 'You put it back behind the cables and tape a note on the side: DO NOT RECYCLE. Some things you keep not because you will use them again, but because the day you threw them out would be a day you became someone else.',
    },
    donate: {
      speaker: 'narrator',
      text: 'You wipe it clean. Two weeks later you see it through the community-room window on the Row: a skinny kid, maybe twelve, leaning so close to the old monitor his nose nearly touches it, typing with two fingers, absolutely lost in something. You don\'t go in. You don\'t need to.',
    },
  },
}

const oldMachine: EventDef = {
  id: 'ev_tech_old_machine',
  category: 'life',
  weight: 3,
  when: { all: [actGte(4), free] },
  scene: 'ev_tech_old_machine_scene',
}

export default defineContent({
  scenes: [privacyScene, homesteadScene, lighthouseLastScene, oldMachineScene],
  events: [privacyFlip, homesteadClosing, lighthouseLast, oldMachine],
})
