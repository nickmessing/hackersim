/**
 * PKG-11 — parents & extended family (bible §8 Family: `side_y2k_leftovers`,
 * `side_dads_profile`, `side_inheritance_drive`, `side_uncles_pyramid`).
 *
 * Sets: `side.dad_truth`/`side.dad_spared` (read by Dad's bio, PKG-00), `npc.dad.dating`
 * (steering → PKG-04 finalizes `dating_again`), `side.union_files`, `evidence_fragments` (+, read
 * by PKG-04 `trig_evidence`), `w.exposure` (+, shared add-only), Dad/Uncle affinity & fates that
 * these quests solely author (`uncle`).
 *
 * `npc.dad.fate` is NOT written here — PKG-10 is its sole writer (§4.6). We only ever set the
 * `npc.dad.dating` steering flag. `side_uncles_pyramid` DOES own `npc.uncle`'s fate (§4.8).
 *
 * Hacking is fiction: the "refund" and the union-drive recovery are abstract, invented game beats
 * (a skill check against a made-up shell company / a corrupted old drive), never real technique.
 */
import { defineContent } from '@/engine/registry'
import type { QuestDef, SceneDef } from '@/engine/types'
import { momHere, momPassed } from './_shared'

// ── side_y2k_leftovers — Act I ───────────────────────────────────────────────

const y2kQuest: QuestDef = {
  id: 'side_y2k_leftovers',
  title: 'Y2K Leftovers',
  kind: 'side',
  act: 1,
  giver: 'dad',
  priority: 6,
  autoStart: { all: [{ day: true, gte: 60 }, { flag: 'a1.dad_laid_off' }, { npc: 'dad', met: true }] },
  rewards: 'Neighborhood standing · money · a thread of the truth',
  summary:
    'Dad asks you to clean out the office PC his old foreman gave him as a "severance gift." Buried in the leftover files is a memo that says the layoffs were decided months before the "computer problem" the mill blamed. What you do with it is between you and your father.',
  start: 'dig',
  stages: {
    dig: {
      text: 'The foreman\'s old machine still has the mill\'s files on it. One of them is a memo that makes Dad\'s whole story about "the Y2K thing" a lie the company told him. Decide whether he needs to know.',
      onEnter: [{ scene: 'side_y2k_leftovers_scene' }],
      objectives: [
        {
          id: 'decide',
          text: 'Decide what Dad hears about the layoffs',
          when: { any: [{ flag: 'side.dad_truth' }, { flag: 'side.dad_spared' }] },
          hint: 'Read the memo, then choose. The truth is heavier and cleaner; sparing him is lighter and kinder. Neither is wrong.',
        },
      ],
      onComplete: [{ faction: 'fac.hood', add: 5 }, { money: 120 }, { var: 'w.exposure', add: 1 }],
    },
  },
}

const y2kScene: SceneDef = {
  id: 'side_y2k_leftovers_scene',
  channel: 'dialog',
  title: 'Y2K Leftovers',
  from: 'dad',
  start: 'intro',
  nodes: {
    intro: {
      speaker: 'dad',
      text: [
        'Dad wheels in a beige tower that smells like machine oil and cigarettes. "Ted gave me this when they cleared out the office. Said there might be pictures of the softball team on it. See if you can get \'em off, and then it\'s yours — a real computer, not that thing you soldered."',
        { if: { background: 'tinkerer' }, text: 'You already know from the sound of the fan that the hard drive has maybe a month left in it. You don\'t say so. He\'s proud of the gift.' },
        'He pats it like a horse. "Twenty years on that line and I get a computer that doesn\'t work and a handshake. Ted felt bad, I think. He\'s not a bad guy. It was the Y2K thing, the computers, nobody\'s fault." He believes it. He needs to believe it.',
      ],
      next: 'find',
    },
    find: {
      speaker: 'narrator',
      text: [
        'The softball pictures are there — Dad, younger, squinting, holding a trophy. So is the rest of Ted\'s work drive. And in a folder marked Q1 PLANNING, dated eight months before the "computer problem," is a memo that lays out the whole thing: the line was being cut regardless. The offshore contract was already signed. The "Y2K remediation costs" were the cover story, chosen in a meeting, by name, because "it reads as no-one\'s-fault."',
        'Two hundred men were told a machine took their jobs so that no man had to be the one who did. Your father is one of them, and he still says Ted\'s not a bad guy, and he\'s right, which is somehow the worst part.',
      ],
      next: 'choice',
    },
    choice: {
      speaker: 'player',
      text: 'Dad is in the next room, asking if you found the softball pictures.',
      choices: [
        {
          text: 'Tell him. He deserves the truth, even the heavy kind.',
          tag: '[The truth]',
          effects: [{ flag: 'side.dad_truth' }, { npc: 'dad', affinity: 10 }, { stat: 'stress', add: 4 }],
          goto: 'told',
        },
        {
          text: 'Delete the memo. Give him the softball pictures and let him keep Ted.',
          tag: '[Spare him]',
          effects: [{ flag: 'side.dad_spared' }, { npc: 'dad', affinity: 5 }, { stat: 'mood', add: -4 }],
          goto: 'spared',
        },
        {
          text: 'Keep a copy of the memo, quietly, before you decide anything.',
          tag: '[OpSec DC 10]',
          if: { not: { flag: 'side.y2k_copy_tried' } },
          effects: [{ flag: 'side.y2k_copy_tried' }],
          check: {
            skill: 'opsec',
            dc: 10,
            success: 'kept',
            fail: 'kept_fail',
            successEffects: [{ var: 'evidence_fragments', add: 1 }],
          },
        },
      ],
    },
    told: {
      speaker: 'narrator',
      text: [
        {
          if: { flag: 'side.y2k_photos_lost' },
          text: 'You tell him — from memory, because the drive took the memo, and took the softball pictures with it. You get the dates right. You get the phrase right: "reads as no-one\'s-fault." He listens with his hands flat on the table and he goes very still, and you watch him understand that the machine he\'s spent all winter forgiving didn\'t do anything, that it was people in a room, that the kindest man he knows signed it. Then he asks about the pictures, and you have to tell him that too.',
          else: 'You show him. He reads it twice, slowly, moving his lips the way he does with warranty cards. Then he sets it down and goes very still, and you watch him understand that the machine he\'s spent all winter forgiving didn\'t do anything, that it was people in a room, that the kindest man he knows signed it.',
        },
        '"Huh," he says, finally. That\'s all. Later you hear him in the bathroom fixing the drip he\'s been ignoring for months, and then the squeak in the door, and then the loose stair, one repair after another late into the night — a man fixing everything he\'s allowed to fix. In the morning he thanks you for telling him. He means it. He never mentions Ted again.',
        { if: momHere, text: 'Mom finds you in the hall afterward. "You did right," she says, very low. "He\'d rather be angry than stupid. He\'s always been that way. I married it on purpose."' },
        { if: { flag: 'side.y2k_photos_lost' }, text: 'He takes the second loss harder than the first, which tells you everything about what he actually came into the room hoping for.' },
      ],
      effects: [{ quest: 'side_y2k_leftovers', objective: 'decide' }],
    },
    spared: {
      speaker: 'narrator',
      text: [
        {
          if: { flag: 'side.y2k_photos_lost' },
          text: 'There\'s no memo left to delete and no CD of softball pictures to give him — just the one thumbnail, which you print as big as it will go, which is not big. He holds it at arm\'s length. "Kowalski\'s mustache," he says. "Huh. The drive, huh?" He doesn\'t ask what happened to the rest. He tells you where each man he can\'t see landed anyway — some okay, some not, all still blaming the same blameless machine.',
          else: 'You drag the memo to the trash and you empty it, and you bring your father a CD of the softball pictures instead. He lights up. "Look at Kowalski\'s mustache. God. We were something." He points at each face and tells you where they landed — some okay, some not, all still blaming the same blameless machine.',
        },
        'You let him. Some nights you\'re sure it was mercy. Some nights you\'re sure it was cowardice wearing mercy\'s coat.',
        {
          if: { flag: 'side.y2k_photos_lost' },
          text: 'He tapes the sixty-pixel thumbnail by the workbench, where a real picture should be. He never knows there was anything to know, and you never tell him you lost the rest trying to keep a secret from him.',
          else: 'He hangs the best softball picture by the workbench and never knows there was anything to know.',
        },
      ],
      effects: [{ quest: 'side_y2k_leftovers', objective: 'decide' }],
    },
    kept: {
      speaker: 'narrator',
      text: [
        'You burn a quiet copy first — dated, hashed, tucked somewhere a raid won\'t look — because a small voice you\'re learning to trust says a memo like this might matter later, to someone, in a way you can\'t see yet. Then you go back to the real choice: what your father hears.',
      ],
      next: 'choice',
    },
    kept_fail: {
      speaker: 'narrator',
      text: [
        'You fumble the copy. The old drive coughs, then makes a sound like a spoon in a garbage disposal, and the whole partition starts coming apart under your hands — the memo, the Q1 folder, and then, while you scramble, the folder you were actually asked to save. SOFTBALL_98. SOFTBALL_99. Gone in the order you try to rescue them.',
        'You get exactly one thumbnail out: Kowalski\'s mustache and half of your father\'s grin, sixty pixels wide. Everything else on the machine is now a clicking sound.',
        'You\'ve still read the memo. You still know. But there\'s no artifact to keep now, and there are no softball pictures to hand him, and in the next room your father is asking, cheerfully, whether you found them.',
      ],
      effects: [{ flag: 'side.y2k_photos_lost' }, { npc: 'dad', affinity: -3 }, { stat: 'mood', add: -4 }, { stat: 'stress', add: 3 }],
      next: 'choice',
    },
  },
}

// ── side_uncles_pyramid — Act II ─────────────────────────────────────────────

const unclesQuest: QuestDef = {
  id: 'side_uncles_pyramid',
  title: "Uncle Danh's Big Break",
  kind: 'side',
  act: 2,
  giver: 'uncle',
  priority: 6,
  autoStart: { all: [{ var: 'act', gte: 2 }, { day: true, gte: 300 }] },
  rewards: "Family peace · a breadcrumb toward Aperture",
  summary:
    'Uncle Danh has put his savings — and half the family\'s — into the Lumen Prosperity Circle, which is a pyramid scheme wearing a nice suit. When you look under the suit, the shell company holding the money traces back to an Aperture address. You can expose it, refund him quietly, or stay out of it.',
  start: 'look',
  stages: {
    look: {
      text: "Uncle Danh's \"ground-floor opportunity\" is a Ponzi, and the shell at the bottom of it has an Aperture return address. Decide what happens to Danh — and whether you pull on the thread you just found.",
      onEnter: [{ scene: 'side_uncles_pyramid_scene' }],
      objectives: [
        {
          id: 'resolve',
          text: "Decide what to do about the Prosperity Circle",
          when: { never: true },
          hint: 'Expose it and Danh is ruined but the family is warned; refund him with an [Intrusion] play and only he walks out whole; stay out and let it run its course.',
        },
      ],
    },
  },
}

const unclesScene: SceneDef = {
  id: 'side_uncles_pyramid_scene',
  channel: 'dialog',
  title: "Uncle Danh's Big Break",
  from: 'uncle',
  start: 'intro',
  nodes: {
    intro: {
      speaker: 'uncle',
      effects: [{ npc: 'uncle', met: true }],
      text: [
        'Uncle Danh corners you at Sunday dinner with a glossy folder and the gold watch turned so you can see it. "The Lumen Prosperity Circle. Not a scheme, before you make the face — a circle. You bring in two, they bring in two, everybody eats. I put in eight thousand. Your mother put in three. I got Mrs. Castellano in." He beams. "Ground floor. I want you in before the doors close."',
        {
          if: momHere,
          text: 'You already know what it is from the word "circle." But he got Mom in. He got the whole Row in. So you take the folder home and you look.',
          else: 'You already know what it is from the word "circle." Mom would have smelled it from across the room and said so, loudly, in two languages. She isn\'t here to. So you take the folder home and you look.',
        },
      ],
      next: 'trace',
    },
    trace: {
      speaker: 'narrator',
      text: [
        'It\'s a pyramid, textbook, the kind that eats the late joiners to pay the early ones and calls the gap "growth." But when you follow the money past the friendly local front, the account holding everyone\'s "circle deposits" belongs to a shell, and the shell\'s paperwork lists a management company in Millgate you\'ve started seeing everywhere: Aperture Data Solutions.',
        'It\'s not the center of anything. It\'s a fee Aperture collects for laundering a small ugly thing through a smaller uglier one. But it\'s them, again, and the family\'s grocery money is inside it.',
      ],
      next: 'choice',
    },
    choice: {
      speaker: 'player',
      text: 'Uncle Danh, the Row, and an Aperture return address, all in one folder.',
      choices: [
        {
          text: 'Blow it up. Warn the family, expose the Circle, let it collapse.',
          tag: '[Expose]',
          effects: [
            { faction: 'fac.hood', add: 12 },
            { npc: 'uncle', fate: 'ruined' },
            { npc: 'uncle', affinity: -8 },
            { var: 'w.exposure', add: 1 },
            { var: 'evidence_fragments', add: 1 },
          ],
          goto: 'exposed',
        },
        {
          text: "Get Danh's money out quietly, before it folds. Just him.",
          tag: '[Intrusion DC 15]',
          check: {
            skill: 'intrusion',
            dc: 15,
            success: 'refunded',
            fail: 'refund_fail',
            successEffects: [
              { npc: 'uncle', fate: 'refunded' },
              { npc: 'uncle', affinity: 10 },
              { var: 'evidence_fragments', add: 1 },
              { var: 'w.exposure', add: 1 },
            ],
            failEffects: [{ stat: 'heat', add: 12 }, { npc: 'uncle', fate: 'ruined' }, { flag: 'side.uncle_alert_tripped' }, { complication: 'hack' }],
          },
        },
        {
          text: 'Quietly warn the family and Mrs. Castellano off, and leave Danh to learn it himself.',
          tag: '[Spare the Row]',
          effects: [{ faction: 'fac.hood', add: 5 }, { npc: 'uncle', fate: 'spared' }, { npc: 'mom', affinity: 6 }],
          goto: 'spared',
        },
        {
          text: 'Out-pitch him. Sell Danh on a "better opportunity" — his own money, back in his own bank.',
          tag: '[Business DC 14]',
          check: {
            skill: 'business',
            dc: 14,
            success: 'outpitched',
            fail: 'outpitch_fail',
            successEffects: [{ npc: 'uncle', fate: 'spared' }, { npc: 'uncle', affinity: 6 }, { faction: 'fac.hood', add: 4 }],
            failEffects: [{ npc: 'uncle', fate: 'ruined' }, { npc: 'uncle', affinity: -4 }, { money: -40 }, { stat: 'stress', add: 3 }],
          },
        },
        {
          text: 'Stay out of it. Not your circus.',
          tag: '[Leave]',
          effects: [{ npc: 'uncle', fate: 'ruined' }, { stat: 'mood', add: -3 }],
          goto: 'left',
        },
      ],
    },
    exposed: {
      speaker: 'narrator',
      text: [
        'You lay it out for the family plainly, with the numbers, at a kitchen table full of people who love Danh and are about to be very disappointed in him. The Circle folds within the week when the deposits stop. Danh loses the eight thousand and the watch and, for a while, the room whenever he walks into it.',
        '"A strategic exit," he calls it at the next holiday, and nobody corrects him, because the family got its money back and Mrs. Castellano got hers and the Row remembers who did the math. Danh doesn\'t speak to you until Christmas. Then he does, gruffly, because you\'re family, and because deep down he knows.',
      ],
      effects: [{ quest: 'side_uncles_pyramid', objective: 'resolve' }],
    },
    refunded: {
      speaker: 'narrator',
      text: [
        'You slip into the Circle\'s creaky back office of a website and walk Danh\'s deposit back out the way it came, quietly, before the whole thing tips over. To him it looks like the one smart bet of his life paid off and he got out at the top. You let him have that.',
        '"I told you," he says at Thanksgiving, tapping the side of his nose. "You watch the timing. That\'s the whole game." He buys the turkey. He\'ll do the exact same thing again next year with a different circle, and you\'ll be right here, and you keep the copy of the Aperture paperwork you scraped on the way out.',
      ],
      effects: [{ quest: 'side_uncles_pyramid', objective: 'resolve' }],
    },
    refund_fail: {
      speaker: 'narrator',
      text: [
        'The shell\'s books are watched better than a family Ponzi has any right to be — the Aperture hands on it are careful hands. Something you touch trips something you can\'t see, and an alert goes somewhere you\'d rather not be known. You back out fast and empty-handed. Danh\'s money goes down with the Circle when it folds a month later.',
        'He takes it hard. He sells the watch. Somebody in the family lends him money and calls it a gift, and you carry the quiet knowledge that you tried, and that Aperture watches even its garbage.',
        'Three nights later your connection drops at 2 a.m. and comes back slower, and a line in your own logs that you did not write says, politely, *hello*. The careful hands on the Circle\'s books have followed your footprints home. Whatever happens next, you started it over eight thousand dollars and an uncle who will never know.',
      ],
      effects: [{ quest: 'side_uncles_pyramid', objective: 'resolve' }],
    },
    outpitched: {
      speaker: 'narrator',
      text: [
        'You fight a salesman with a salesman. Over three lunches you pitch Danh the Tan Family Reserve Fund — a savings account, a jar, and a spreadsheet with his name at the top in bold — with charts, and urgency, and a "limited window." He can smell a pitch, so you let him think he\'s out-negotiating you. He pulls his deposit out of the Circle to "diversify" two weeks before it folds.',
        '"Diversification," he announces at the next family dinner, tapping his temple, and makes everyone toast it. The rest of the Row gets out on his coattails because Danh cannot keep a winning move to himself. You never tell him the Reserve Fund was a jar. The Aperture paperwork you glimpsed stays in your head, unfiled.',
      ],
      effects: [{ quest: 'side_uncles_pyramid', objective: 'resolve' }],
    },
    outpitch_fail: {
      speaker: 'narrator',
      text: [
        'Danh listens to your pitch with the patience of a man who has given this exact pitch, and then laughs, delighted, and signs you up as his downline. "You\'re a natural! You\'ll be a Gold Circle by spring!" You spend a week getting your name off his list and the Circle folds on schedule with his eight thousand inside it.',
        'He\'s gracious about it, which is worse. "Some of us are closers," he tells you, "and some of us are idea men." Then he borrows forty dollars for gas.',
      ],
      effects: [{ quest: 'side_uncles_pyramid', objective: 'resolve' }],
    },
    spared: {
      speaker: 'narrator',
      text: [
        'You can\'t save Danh from Danh, but you can get the people who trusted him out clean. You take Mom — or, when she isn\'t there to take, Dad — for a walk and lay it out; the family money comes out the next morning, and Mrs. Castellano\'s with it, everyone citing "a bad feeling" so Danh never has to be told his own blood saw through him.',
        'The Circle folds and takes Danh\'s eight thousand. He never learns how close the rest of the family came, and he tells everyone at the funeral of the Circle that he "saw the writing on the wall," which is the one thing he did not do.',
      ],
      effects: [{ quest: 'side_uncles_pyramid', objective: 'resolve' }],
    },
    left: {
      speaker: 'narrator',
      text: [
        'You put the folder in a drawer. It\'s his money and his circle and his mustachioed dream, and you have your own fires. The Circle burns anyway, on schedule, and takes Danh and eight thousand dollars and a slice of the family\'s savings with it.',
        'You could have said something. You knew, and you sat on it, and at the next dinner Danh is smaller and the table is quieter and you eat your food and think about the Aperture address you also chose not to look at any harder. Some doors you leave shut. This one has a draft under it.',
      ],
      effects: [{ quest: 'side_uncles_pyramid', objective: 'resolve' }],
    },
  },
}

// ── side_dads_profile — Act III (after w.mom_gone) ───────────────────────────

const dadsProfileQuest: QuestDef = {
  id: 'side_dads_profile',
  title: "Dad's Profile",
  kind: 'side',
  act: 3,
  giver: 'dad',
  priority: 6,
  autoStart: { all: [momPassed, { var: 'act', gte: 3 }, { npc: 'dad', met: true }, { npc: 'dad', fateNot: ['spiral', 'mill_ghost'] }] },
  rewards: "Dad's second act",
  summary:
    'A year after Mom, Dad shyly asks you to help him "with the computer part" of an online dating site. He is terrible at it and hopeful in a way that hurts. One of the women writing to him is a scammer. The rest of it is your father trying to be alive again.',
  start: 'help',
  stages: {
    help: {
      text: 'Dad wants help with a dating profile. He is bashful and brave about it. One of his matches is running a sweetheart scam; the rest of the evening is teaching a grieving man to hope on the internet.',
      onEnter: [{ scene: 'side_dads_profile_scene' }],
      objectives: [
        {
          id: 'helped',
          text: "Help Dad back into the world",
          when: { flag: 'npc.dad.dating' },
          hint: 'Vet the scammer with a [Social] read, then help him write a profile that sounds like him. This is why he asked you, even if he called it "the computer part."',
        },
      ],
    },
  },
}

const dadsProfileScene: SceneDef = {
  id: 'side_dads_profile_scene',
  channel: 'dialog',
  title: "Dad's Profile",
  from: 'dad',
  start: 'intro',
  nodes: {
    intro: {
      speaker: 'dad',
      text: [
        'Dad won\'t look at you. He\'s got a printout — he always has a printout — of a dating site, half filled in, in the careful capital letters he uses for forms. "The, ah. The computer part. Your aunt Bien signed me up for this and I can\'t make the pictures go on and I don\'t— " He stops. "It\'s been a year. She\'d have told me to. Your mother. She\'d have said, \'Robert, you can\'t fix a radio to a widower forever.\'"',
        'He finally looks up. "Just the computer part. That\'s all I\'m asking."',
      ],
      next: 'scam',
    },
    scam: {
      speaker: 'narrator',
      text: [
        'You get his photos on — the good one from the church picnic, not the one where he\'s holding a wrench like a hostage. He has three messages already. Two are lovely, local, real. The third is "Vivian," whose photos are a stock model, whose grammar is a passport stamp, and who has, on message four, already mentioned a customs fee and a temporary hardship.',
        'She\'s a sweetheart scammer, the assembly-line kind, and your father — kind, lonely, sixty, freshly widowed — is exactly the shape of person she\'s fishing for.',
      ],
      next: 'choice',
    },
    choice: {
      speaker: 'player',
      text: 'Dad is reading "Vivian"\'s message over your shoulder, hopeful. "She seems nice," he says.',
      choices: [
        {
          text: 'Gently prove "Vivian" is a scam without crushing his nerve for the whole thing.',
          tag: '[Social DC 14]',
          check: {
            skill: 'social',
            dc: 14,
            success: 'vetted',
            fail: 'vet_fail',
            successEffects: [{ flag: 'npc.dad.dating' }, { npc: 'dad', affinity: 12 }],
            failEffects: [{ npc: 'dad', affinity: 4 }, { money: -400 }, { flag: 'npc.dad.dating' }, { flag: 'side.dad_scammed' }, { trait: 'pkg11_family_scammed_twice' }, { stat: 'stress', add: 5 }],
          },
        },
        {
          text: 'Just block "Vivian" and say nothing. Fix it silently.',
          tag: '[Quiet]',
          effects: [{ flag: 'npc.dad.dating' }, { npc: 'dad', affinity: 6 }],
          goto: 'silent',
        },
        {
          text: 'Turn it into a lesson: sit with him and teach him to spot the next one himself.',
          tag: '[Systems DC 12]',
          check: {
            skill: 'systems',
            dc: 12,
            success: 'taught',
            fail: 'lesson_fail',
            successEffects: [{ flag: 'npc.dad.dating' }, { npc: 'dad', affinity: 10 }, { faction: 'fac.hood', add: 3 }],
            failEffects: [{ flag: 'npc.dad.dating' }, { flag: 'side.dad_inbox_duty' }, { npc: 'dad', affinity: 3 }, { stat: 'stress', add: 2 }],
          },
        },
      ],
    },
    vetted: {
      speaker: 'narrator',
      text: [
        'You don\'t say "she\'s a scammer, Dad." You say, "Ask her to say your name on a phone call," and you watch him watch "Vivian" find seven reasons not to, and you let him arrive at it himself so it\'s his knowledge and not your verdict. He deflates for a second, then squares up. "Right. Okay. So the pictures were fake." A beat. "The other two, though. Bernadette in the second one. She\'s real?"',
        'She\'s real. He writes Bernadette back with your help — sounds like himself, mentions the radios, asks about her garden. Three weeks later he shaves before a Tuesday and won\'t say why. He\'s dating again. He carries a photo of your mother in his wallet still, in the front, where it belongs, and that\'s exactly right, and he\'s alive.',
      ],
      effects: [{ quest: 'side_dads_profile', objective: 'helped' }],
    },
    vet_fail: {
      speaker: 'narrator',
      text: [
        'You warn him about "Vivian," but you do it too bluntly and it lands as "you\'re a foolish old man," and he digs in the way he does, and by the time you\'ve untangled it he\'s already wired her four hundred dollars for a "customs fee." You claw back what you can and eat the rest.',
        'It stings him, and it stings you worse to watch. But he learns from it — hard — and when Bernadette writes a week later he asks her to say his name on the phone before he\'ll even reply. She laughs and does it. He\'s dating again, more careful now, four hundred dollars wiser, and still, somehow, hopeful.',
      ],
      effects: [{ quest: 'side_dads_profile', objective: 'helped' }],
    },
    silent: {
      speaker: 'narrator',
      text: [
        'You block "Vivian" and delete the thread and say nothing about it. He notices she stopped writing and shrugs — "guess she wasn\'t that interested" — and moves on to Bernadette, who is real, and kind, and laughs at the radio joke.',
        'He never knows how close he came, which is a kind of gift you\'re getting practiced at giving the men in your family. He shaves before a Tuesday. He\'s dating again. He keeps Mom\'s photo in the front of his wallet, and Bernadette, when she eventually sees it, understands completely.',
      ],
      effects: [{ quest: 'side_dads_profile', objective: 'helped' }],
    },
    lesson_fail: {
      speaker: 'narrator',
      text: [
        'You try to teach it properly and it becomes a two-hour lecture on headers, forwarding chains and the anatomy of a wire transfer, and somewhere around the word "protocol" your father\'s eyes go gently out of focus like a screensaver. "I\'m sure that\'s right," he says kindly. "Could you just tell me which ones are real?"',
        'So you do. Bernadette is real. He writes her back about the radios and her garden, and she writes back the same day. He\'s dating again. He still couldn\'t spot a scam if it wore a name tag, so you add "check Dad\'s inbox" to your Sunday list, and he pretends not to know that you do.',
      ],
      effects: [{ quest: 'side_dads_profile', objective: 'helped' }],
    },
    taught: {
      speaker: 'narrator',
      text: [
        'You sit with him for two hours and turn "Vivian" into a field guide: the stock photo, the borrowed grammar, the hardship on message four, the reason it\'s always a customs fee. He takes notes on the back of the printout in his form-capitals. "So it\'s the same trick as the driveway-sealer guys," he says, delighted. "Just with a girlfriend." Exactly, Dad.',
        'He becomes, of all things, the Row\'s scam-spotter — the retiree the retirees call before they wire anyone anything. And he writes Bernadette back, careful and hopeful, and asks her about her garden. He\'s dating again, and he taught the whole block to be a little harder to fool, and somewhere your mother is saying "I told you so, Robert."',
      ],
      effects: [{ quest: 'side_dads_profile', objective: 'helped' }],
    },
  },
}

// ── side_inheritance_drive — Act III–IV ──────────────────────────────────────

const inheritanceQuest: QuestDef = {
  id: 'side_inheritance_drive',
  title: 'The Inheritance Drive',
  kind: 'side',
  act: 3,
  giver: 'dad',
  priority: 6,
  autoStart: { all: [{ npc: 'dad', met: true }, { var: 'act', gte: 3 }, { day: true, gte: 1400 }] },
  rewards: "Dad's history · a piece of the Row's",
  summary:
    "When a relative passes, a dead hard drive comes to your father in a box of papers. On it are the files from Dad's years quietly organizing the paper-mill union — the meetings the company said never happened. Recover them and you hand your father back a part of himself, and the Row a part of its memory.",
  start: 'recover',
  stages: {
    recover: {
      text: "A failing old drive in a box of a relative's effects holds Dad's union-organizing files from the mill years. Recover them. It's slow, delicate work on failing hardware, and it matters more than money.",
      onEnter: [{ scene: 'side_inheritance_drive_scene' }],
      objectives: [
        {
          id: 'recovered',
          text: "Recover the union files from the dying drive",
          when: { flag: 'side.union_files' },
          hint: 'A [Hardware] repair to keep the platter spinning, or a patient [Systems] recovery of what\'s left. Either can save it; both honor him.',
        },
      ],
    },
  },
}

const inheritanceScene: SceneDef = {
  id: 'side_inheritance_drive_scene',
  channel: 'dialog',
  title: 'The Inheritance Drive',
  from: 'dad',
  start: 'intro',
  nodes: {
    intro: {
      speaker: 'dad',
      text: [
        'Dad sets a shoebox on your desk. "Cousin Teddy passed. God rest him. This was in his effects — he was the recording secretary, back when." He lifts out a hard drive so old it has a manufacturer nobody remembers, clicking faintly when he tilts it. "It\'s the union stuff. From the mill. All the minutes, the grievances, the— everything they said we never did."',
        'He doesn\'t quite meet your eye. "The company always said there was no organizing. Said we imagined it. It\'s all on here, or it was. I\'d like to have it. To know it was real. Can you—?" He gestures at the clicking drive, at you, at the whole idea that the past can be repaired.',
        { if: { all: [{ flag: 'side.dad_inbox_duty' }, { not: { flag: 'side.dad_scammed' } }] }, text: 'He\'s already printed out his inbox for you, the way he does every Sunday since the dating site, so you can circle the fake ones. There are two this week. One of them is from a "customs office." He is very proud to have guessed which.' },
        { if: { flag: 'side.dad_scammed' }, text: 'He asks you to double-check the shipping label before he trusts it to the mail, twice, because since the Vivian business he double-checks everything, quietly, and it breaks your heart a little every time.' },
      ],
      next: 'assess',
    },
    assess: {
      speaker: 'narrator',
      text: [
        'The drive is dying and half-dead already: the bearings are shot, the platter clicks like an old knee, and every spin-up might be the last one you get. Whatever\'s on here — a decade of your father\'s other life, the one where he stood up in a rented hall and spoke — is one power cycle from silence.',
        'You get one honest run at it.',
      ],
      next: 'choice',
    },
    choice: {
      speaker: 'player',
      text: 'The drive clicks on the desk. Somewhere on it, your father is thirty years old and unafraid.',
      choices: [
        {
          text: 'Coax the hardware back to life — freeze it, steady the platter, one clean read.',
          tag: '[Hardware DC 14]',
          check: {
            skill: 'hardware',
            dc: 14,
            success: 'saved',
            fail: 'partial',
            successEffects: [{ flag: 'side.union_files' }, { npc: 'dad', affinity: 14 }, { faction: 'fac.hood', add: 4 }],
          },
        },
        {
          text: 'Skip the hardware heroics — recover the data structure patiently from what still reads.',
          tag: '[Systems DC 15]',
          check: {
            skill: 'systems',
            dc: 15,
            success: 'saved',
            fail: 'partial',
            successEffects: [{ flag: 'side.union_files' }, { npc: 'dad', affinity: 14 }, { faction: 'fac.hood', add: 4 }],
          },
        },
        {
          text: 'Don\'t gamble with it. Ship the drive to a clean-room recovery lab across the Sound.',
          tag: '[Pay $600]',
          req: { stat: 'money', gte: 600 },
          reqText: 'Requires $600',
          effects: [{ money: -600 }, { flag: 'side.union_files' }, { npc: 'dad', affinity: 10 }],
          goto: 'lab',
        },
      ],
    },
    lab: {
      speaker: 'narrator',
      text: [
        'Some things you don\'t roll dice on. You pack the drive in anti-static foam like a transplant organ and ship it to a recovery lab in Ridgeport where people in bunny suits do this all day. It comes back three weeks later with an invoice that makes you wince and a disc that makes Dad sit down.',
        'Everything. The minutes, the grievances, the scanned photograph of forty men on the loading dock under a hand-painted banner, your father third from the left with his chin up. "You paid for this," he says, not quite a question. "Worth it," you say. He doesn\'t argue, which is how you know he agrees. The picture goes up next to the softball team.',
        { if: { flag: 'side.y2k_photos_lost' }, text: 'It goes up next to the sixty-pixel thumbnail of the softball team, the only thing that survived the last drive you tried to save for him. This time you didn\'t gamble. He notices that. He taps the frame twice.' },
      ],
      effects: [{ quest: 'side_inheritance_drive', objective: 'recovered' }, { scene: 'side_inheritance_forum', delayHours: 48 }],
    },
    saved: {
      speaker: 'narrator',
      text: [
        'It comes back. All of it — the minutes in Teddy\'s cramped shorthand, the grievance forms, the photograph someone scanned of forty men on the loading dock with a hand-painted banner, your father third from the left with a full head of hair and his chin up. Meetings the company swore into non-existence, alive again on your screen.',
        'You print the loading-dock photo big and give it to him with the files on a disc labelled, in your best capitals, THE MILL — REAL. He looks at it for a long time. "That\'s Kowalski. That\'s— we did that. We really did that." He hangs it next to the softball team. The Row gets copies; the old-timers argue happily for a month about who\'s in the back row. You gave your father proof that his other life happened. There isn\'t a price on that.',
        { if: { flag: 'side.y2k_photos_lost' }, text: 'Later you catch him standing at the workbench looking from the loading-dock photo to the little softball thumbnail and back. "Second time you\'ve had one of those dying drives in your hands," he says. "Better luck this time." He says it like a joke. It isn\'t entirely.' },
      ],
      effects: [{ quest: 'side_inheritance_drive', objective: 'recovered' }, { scene: 'side_inheritance_forum', delayHours: 48 }],
    },
    partial: {
      speaker: 'narrator',
      text: [
        'The drive gives up halfway through, one last click and then the quiet you were dreading. But halfway is not nothing. You save what you can: a run of minutes, a fistful of grievance forms, and — by luck — the scanned photograph of forty men on the loading dock with a banner, your father third from the left, chin up.',
        'You bring him the photo and the partial files and you brace for his disappointment. It doesn\'t come. "That\'s Kowalski," he says, touching the screen. "That\'s us." He doesn\'t need the whole archive. He needed the one true picture, and you got it out before the drive died. He hangs it by the workbench. The company said it never happened. Here it is anyway.',
      ],
      effects: [{ quest: 'side_inheritance_drive', objective: 'recovered' }, { scene: 'side_inheritance_forum', delayHours: 48 }, { flag: 'side.union_files' }, { flag: 'side.union_files_partial' }, { stat: 'stress', add: 3 }],
    },
  },
}

/** The Row's old-timers get the loading-dock photo — the "news beat" of the union files, told by the Row itself. */
const inheritanceForum: SceneDef = {
  id: 'side_inheritance_forum',
  channel: 'forum',
  board: 'offtopic',
  title: '[PIC] Port Lumen Paper, loading dock, 1979 — who can name the back row??',
  from: 'R. Tan (Cannery Row)',
  pause: false,
  start: 'op',
  nodes: {
    op: {
      speaker: 'R. Tan (Cannery Row)',
      text: [
        'MY KID SCANNED THIS. IT IS THE LOCAL 114 ORGANIZING MEETING, SUMMER 1979. THE COMPANY SAID THERE WAS NO MEETING. HERE IS THE MEETING.',
        'I AM THIRD FROM THE LEFT. I HAD HAIR. WHO IS THE BIG GUY BEHIND KOWALSKI. IT IS DRIVING ME CRAZY.',
        '-- R. Tan / radios fixed, reasonable rates, Cannery Row',
      ],
      next: 'replies',
    },
    replies: {
      speaker: 'narrator',
      text: [
        'GRIZZLED_OPERATOR: that\'s Big Lou Petrakis. he carried the banner because he was the only one tall enough to keep it out of the puddles. RIP Lou.',
        'sal_says_eat: I KNOW THAT BANNER. my father painted that banner in the back of the diner. he used the good red. mom was furious.',
        'harborgrrl77: my grandpa is second row, the one looking the wrong way. he told us about this for 20 years and nobody believed him. printing this for my grandma. thank you mr tan\'s kid',
        'rtan_fixes_radios: YOU ARE WELCOME. ALSO HOW DO I TURN OFF THE CAPITAL LETTERS',
        'rtan_fixes_radios: NEVER MIND I LIKE THEM',
        { if: { flag: 'side.union_files_partial' }, text: 'GRIZZLED_OPERATOR: shame the minutes didnt make it. the drive was too far gone your kid said. still. the picture is the thing. the picture is everything.' },
      ],
      choices: [
        {
          text: 'Reply: "Caps Lock, Dad. The key with the little light."',
          effects: [{ npc: 'dad', affinity: 2 }, { stat: 'mood', add: 3 }],
        },
        {
          text: 'Say nothing. Let him have the thread.',
          effects: [{ faction: 'fac.hood', add: 2 }, { stat: 'mood', add: 2 }],
        },
      ],
    },
  },
}

export default defineContent({
  quests: [y2kQuest, unclesQuest, dadsProfileQuest, inheritanceQuest],
  scenes: [y2kScene, unclesScene, dadsProfileScene, inheritanceScene, inheritanceForum],
})
