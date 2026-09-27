/**
 * PKG-13 — `side_grandma_pc`, the recurring Grandma-PC gag (bible §8, §13).
 *
 * Started by `main_a1_q6_grandma_job` (PKG-01) once you first clean Ruth Alvarez's machine. It then
 * recurs across the decade as a single multi-stage quest of five visits (Act I prizes, Act II toolbars,
 * the Porcelain Cat Incident, the late-Act II webcam, the Act III civic app): each `wait_*` stage
 * latches on a date/act, then the matching `visit_*` stage delivers the next call for help. Each
 * visit's closing node sets `side.grandma_pc.v*`, which is what the objectives read. The visits get worse, funnier
 * and — once — quietly frightening. The final Act III visit turns the joke over: the "helpful" civic
 * app on Ruth's new machine has been watching her (`npc.grandma_ruth.fate='spied_on'`,
 * `side.grandma_dark`, one point of `w.exposure`).
 *
 * Sets: `npc.grandma_ruth.fate` (well / spied_on), `side.grandma_dark`, `w.exposure(+, dark visit)`,
 *       `fac.hood(+, per visit)`.
 * Reads: `fac.hood`, `npc.grandma_ruth` state.
 * Cross-package: `npc.grandma_ruth.fate='warned'`/flag `npc.grandma_ruth.warned` (PKG-03 `main_a3_q5`)
 *   is respected — the dark visit never overwrites a Ruth you warned off the List.
 *
 * Hacking is fiction: every "infection", "toolbar" and "civic app" here is abstract game flavor.
 */
import { defineContent } from '@/engine/registry'
import type { Effect, QuestDef, SceneDef } from '@/engine/types'

/** A plate of empanadas and gossip: the Row's currency. */
const empanadas: Effect[] = [
  { stat: 'health', add: 3 },
  { stat: 'mood', add: 5 },
]

/** One point of neighborhood standing per visit (bible §3 F5 repeatable Hood rep). */
const rowThanks: Effect[] = [{ faction: 'fac.hood', add: 1 }, ...empanadas]

const quest: QuestDef = {
  id: 'side_grandma_pc',
  title: "Grandma's Computer",
  kind: 'side',
  act: 1,
  giver: 'grandma_ruth',
  priority: 7,
  // PKG-01's main_a1_q6 starts this on `a1.grandma_done`; the autoStart is a belt-and-suspenders
  // start in case the quest is ever reached by state instead of that explicit start effect.
  autoStart: { flag: 'a1.grandma_done' },
  rewards: 'Neighborhood standing · empanadas · the slow thread of the truth',
  summary: [
    'You fixed Ruth Alvarez\'s computer once, and in doing so you became, on Cannery Row, The Person Who Fixes Computers. This is a lifetime appointment. There is no resigning from it. There are only empanadas.',
    'Ruth will call again. She always calls again. And one of these times, the thing wrong with her machine is going to stop being funny.',
  ],
  start: 'visit1',
  stages: {
    // ── Visit 1 (Act I) — the prize that came back ──────────────────────────
    visit1: {
      text: 'Ruth called. The prizes are back. Go three doors down and un-win her some prizes.',
      hint: 'Answer Ruth\'s call — it lands in your Mail. Either skill route works; it\'s a home PC, not a bank.',
      // Two-and-a-half weeks after the Act I climax, so the gag lands as a callback, not a repeat.
      onEnter: [{ scene: 'grandma_pc_1', delayHours: 400 }],
      objectives: [
        {
          id: 'v1',
          text: "Clean out Ruth's machine (again)",
          when: { flag: 'side.grandma_pc.v1' },
          hint: 'Open the mail from Ruth and go over. Hardware or Systems both work; if you flub it, you fix it the slow way and she feeds you anyway.',
        },
      ],
      next: 'wait2',
    },
    wait2: {
      text: 'Ruth\'s PC is behaving. It will not last. It never lasts. Live your life; she\'ll page you when it stops.',
      hint: 'Time passes. Ruth will call again when there is something new and baffling on her screen.',
      objectives: [
        {
          id: 'w2',
          text: 'Wait for the Row phone tree to reach you again',
          when: { all: [{ day: true, gte: 330 }, { var: 'act', gte: 2 }] },
          hint: 'This one comes around in Act II. Keep living; it arrives on its own.',
        },
      ],
      next: 'visit2',
    },
    // ── Visit 2 (Act II) — the toolbar apocalypse ───────────────────────────
    visit2: {
      text: 'Ruth called. She says the internet is "smaller now." Go and see what she means.',
      hint: 'Answer the mail and visit. Bring patience and a strong stomach for toolbars.',
      onEnter: [{ scene: 'grandma_pc_2' }],
      objectives: [
        {
          id: 'v2',
          text: "Reclaim Ruth's web browser from the toolbars",
          when: { flag: 'side.grandma_pc.v2' },
          hint: 'The mail from Ruth opens the visit. Any reasonable route works — the point is who you are while you do it.',
        },
      ],
      next: 'wait_auction',
    },
    wait_auction: {
      text: 'The internet is full-sized again at Ruth\'s. She has discovered that it contains shopping. Nothing good has ever followed that sentence.',
      hint: 'Time passes. The next call arrives on its own a little later in Act II.',
      objectives: [
        {
          id: 'wa',
          text: 'Wait for Ruth to discover e-commerce',
          when: { all: [{ day: true, gte: 620 }, { var: 'act', gte: 2 }] },
          hint: 'Arrives mid-Act II. Keep living your life; she will find you.',
        },
      ],
      next: 'visit_auction',
    },
    // ── Visit 2b (mid Act II) — the porcelain cats ──────────────────────────
    visit_auction: {
      text: 'Ruth has won fourteen porcelain cats on an internet auction and a very polite stranger now needs her bank details. Get there before she gives them.',
      hint: 'Answer Ruth\'s mail. Talking, business sense or teaching her the tells all work — a flub costs a little money, not Ruth.',
      onEnter: [{ scene: 'grandma_pc_auction' }],
      objectives: [
        {
          id: 'va',
          text: 'Save Ruth from the Porcelain Cat Incident',
          when: { flag: 'side.grandma_pc.va' },
          hint: 'Open the mail from Ruth and see it through.',
        },
      ],
      next: 'wait3',
    },
    wait3: {
      text: 'You bought Ruth a coffee tin of un-clicked prizes and a stern talking-to about hovering before you click. The talking-to will not take.',
      hint: 'More time passes. The next call has a different flavor — Ruth got a gift, and gifts on the Row are never free.',
      objectives: [
        {
          id: 'w3',
          text: 'Let a couple more years of the internet happen to Ruth',
          when: { all: [{ day: true, gte: 900 }, { var: 'act', gte: 2 }] },
          hint: 'Arrives later in Act II. Keep your schedule full and it will find you.',
        },
      ],
      next: 'visit3',
    },
    // ── Visit 3 (late Act II) — the free gift ───────────────────────────────
    visit3: {
      text: 'Ruth\'s nephew gave her a shiny new machine and a "free" webcam. She wants you to make it stop looking at her.',
      hint: 'Answer Ruth\'s mail and go. This one\'s still a comedy — but note who made the "gift".',
      onEnter: [{ scene: 'grandma_pc_3' }],
      objectives: [
        {
          id: 'v3',
          text: "Sort out Ruth's new machine and its friendly webcam",
          when: { flag: 'side.grandma_pc.v3' },
          hint: 'The mail opens the visit. Cover the lens, calm her down, and remember the name on the free software.',
        },
      ],
      next: 'wait_dark',
    },
    wait_dark: {
      text: 'The new machine is fine. Ruth loves the webcam now; she waves at it. You keep meaning to look at what the city\'s new "civic services" app is doing on there, and never quite getting to it.',
      hint: 'The last visit lands in Act III, and it isn\'t funny. It comes when it comes.',
      objectives: [
        {
          id: 'wd',
          text: 'Wait for the last call',
          when: { all: [{ var: 'act', gte: 3 }, { day: true, gte: 1300 }] },
          hint: 'Act III. There is nothing to do but keep going until Ruth calls one more time.',
        },
      ],
      next: 'visit_dark',
    },
    // ── Final visit (Act III) — the joke turns over ─────────────────────────
    visit_dark: {
      text: 'Ruth called, and she sounded small. The friendly civic app has been keeping notes. Go and see what it knows about a woman whose worst secret is her empanada recipe.',
      hint: 'Answer the mail and go over. This visit closes the recurring quest.',
      onEnter: [{ scene: 'grandma_pc_dark' }],
      objectives: [
        {
          id: 'vd',
          text: 'See what the civic app has been writing down about Ruth',
          when: { flag: 'side.grandma_pc.v4' },
          hint: "Open Ruth's last call. Whatever you decide, the quest ends here.",
        },
      ],
      onComplete: [
        { log: 'The Grandma-PC gag isn\'t a gag anymore. It never really was.', kind: 'story' },
      ],
    },
  },
}

// ── Visit 2b (mid Act II) — the Porcelain Cat Incident ───────────────────────
const auctionScene: SceneDef = {
  id: 'grandma_pc_auction',
  channel: 'mail',
  title: 'I WON (14 times)',
  from: 'grandma_ruth',
  start: 'call',
  nodes: {
    call: {
      speaker: 'grandma_ruth',
      text: [
        'Favorite!!',
        'Did you know the internet has an AUCTION? It is called LotBarn and it is like the church rummage sale except it never closes and nobody from the Altar Society is watching. I bid on a porcelain cat. Then I bid on another porcelain cat so the first one would have a friend. I have won fourteen porcelain cats.',
        'Also a very polite man from the "LotBarn Security Team" wrote to say my winnings are on hold and he needs my bank numbers and my mother\'s maiden name "to release the cats." He says it is urgent. He says it three times. I am about to write back but first I thought, the cats can wait one hour for my favorite.',
        'Ruth',
      ],
      next: 'desk',
    },
    desk: {
      speaker: 'narrator',
      text: [
        'The cats are real — a seller in Ridgeport, a real listing, a real, alarming total. The "Security Team" is not. His email has LotBarn\'s logo pasted in slightly crooked, a return address that ends in the wrong place, and a signature that reads "Thank you for choice LotBarn." The reply window is open. Ruth has typed her maiden name and one digit of her account number before she stopped herself.',
        { if: { flag: 'side.grandma_grapegenie' }, text: 'In the corner of the screen, GrapeGenie — the purple gorilla you swore you\'d evict — is helpfully offering to "Auto-Fill Your Reply!" It already has her maiden name. You did promise to finish that job.' },
        'Fourteen cats line the windowsill in your imagination already, judging you.',
      ],
      choices: [
        {
          text: '[Opsec] Show her the tells, one by one, until she can see them herself.',
          check: {
            skill: 'opsec',
            dc: 12,
            success: 'tells',
            fail: 'too_late',
            successEffects: [{ xp: 'opsec', add: 9 }, { npc: 'grandma_ruth', affinity: 4 }],
            failEffects: [{ xp: 'opsec', add: 4 }],
          },
        },
        {
          text: '[Business] Get the real auction house on the phone and sort out the cats properly.',
          check: {
            skill: 'business',
            dc: 12,
            success: 'refund',
            fail: 'too_late',
            successEffects: [{ xp: 'business', add: 9 }],
            failEffects: [{ xp: 'business', add: 4 }],
          },
        },
        {
          text: '[Social] Write back to the "Security Team" as Ruth, and waste every minute of his afternoon.',
          check: {
            skill: 'social',
            dc: 13,
            bonuses: [{ if: { trait: 'silver_tongue' }, add: 2, label: '+2 (silver tongue)' }],
            success: 'troll',
            fail: 'too_late',
            successEffects: [{ xp: 'social', add: 9 }, { stat: 'mood', add: 6 }],
            failEffects: [{ xp: 'social', add: 4 }],
          },
        },
      ],
    },
    tells: {
      speaker: 'narrator',
      text: [
        'You don\'t delete the email. You turn it into a lesson. The crooked logo. The address that ends in the wrong place. "Thank you for choice." The three urgents — "a real company," you tell her, "is never in this much of a hurry to help you."',
        'By the end Ruth is finding them before you point: "And he calls me Dear Valued Winner. My own priest doesn\'t know my name that well." She deletes the email herself with a flourish usually reserved for bridge.',
      ],
      effects: rowThanks,
      next: 'cats',
    },
    refund: {
      speaker: 'narrator',
      text: [
        'Forty minutes on hold with a very tired customer-service rep named Doug and it\'s sorted: the scam email reported, the account locked down, and — Doug being a decent man — twelve of the fourteen bids cancelled as an "obvious enthusiasm event." Ruth keeps two cats. Doug, off the record, says his own mother once won nine ceramic owls.',
      ],
      effects: [...rowThanks, { stat: 'mood', add: 3 }],
      next: 'cats',
    },
    troll: {
      speaker: 'narrator',
      text: [
        'You write back as Ruth. You are very eager to release the cats. You simply need him to confirm his supervisor\'s full name, then the name of HIS mother, then whether the cats will be released individually or "as a litter," then an explanation of the cat-holding process "for my church newsletter."',
        'He replies four times, increasingly unhinged, before he stops. Ruth reads the whole thread aloud to the kitchen, cackling, and prints it out for the Altar Society. It is the finest thing either of you has ever written.',
      ],
      effects: rowThanks,
      next: 'cats',
    },
    too_late: {
      speaker: 'narrator',
      text: [
        'You\'re a beat too slow. Somewhere between your explanation and her nodding, Ruth\'s thumb — "I was only going to finish the number so it looked neat" — hits Send. Not the whole account, thank God. Enough for a forty-dollar "release fee" to leave before you get her bank on the phone and freeze it.',
        'It\'s the least a lesson has ever cost. It still stings her pride worse than her purse. You slip two twenties under the sugar bowl when she isn\'t looking. She finds them later, because of course she does, and calls you a sneak, and keeps them.',
        'What you can\'t slip under the sugar bowl is the other thing. The scammer has a name and a half an account number now, and names like that get sold to the next polite man, and the next. Ruth\'s mail gets worse after the cats. So does her confidence. She starts calling you before she opens anything at all.',
      ],
      effects: [{ money: -40 }, ...rowThanks, { flag: 'side.ruth_on_a_list' }, { stat: 'stress', add: 2 }, { chance: 0.3, then: [{ complication: 'social' }] }],
      next: 'cats',
    },
    cats: {
      speaker: 'grandma_ruth',
      text: [
        'The cats arrive a week later regardless — a seller in Ridgeport who is, it turns out, a real and lovely woman — and Ruth lines them along the windowsill facing the street "so they can watch the Row."',
        'She names one after you. It is the ugliest cat. She says that\'s why: "It has character." You decide to take this as the compliment it absolutely is.',
      ],
      effects: [{ flag: 'side.grandma_pc.va' }],
    },
  },
}

const scenes: SceneDef[] = [
  // ── Visit 1 ────────────────────────────────────────────────────────────────
  {
    id: 'grandma_pc_1',
    channel: 'mail',
    title: 'FW: FW: FW: your winnings!! (please help)',
    from: 'grandma_ruth',
    start: 'call',
    nodes: {
      call: {
        speaker: 'grandma_ruth',
        text: [
          'Dear favorite,',
          'It is happening again. The little window with the trumpet came back and it says I have won a Caribbean cruise and also a laptop and also that my computer has 4,412 errors, which seems like a lot even for me.',
          'I did NOT click the trumpet this time. I want that noted. I clicked the OTHER trumpet. Please come. I have made the good empanadas, not the freezer ones.',
          'Love, Ruth (three doors down, the blue door, you know the one)',
        ],
        next: 'kitchen',
      },
      kitchen: {
        speaker: 'narrator',
        text: [
          'Ruth\'s kitchen smells like heaven and her computer smells like a hot penny. The monitor is a hostile city of pop-ups: cruises, a dancing gorilla, a countdown timer with eleven minutes left on it that has, by the sticky note beside it, had eleven minutes left on it since March.',
          'Under the noise, the machine is doing the thing you remember. Every night at 3:12 a.m., quiet as a held breath, it phones a dull little Millgate address block and reports in. Same as last time. You still don\'t like it.',
        ],
        choices: [
          {
            text: '[Hardware] Rip the whole mess out by the roots.',
            check: {
              skill: 'hardware',
              dc: 10,
              success: 'clean_win',
              fail: 'clean_slow',
              successEffects: [{ xp: 'hardware', add: 8 }],
              failEffects: [{ xp: 'hardware', add: 4 }],
            },
          },
          {
            text: '[Systems] Trace what started at boot and shut it down clean.',
            check: {
              skill: 'systems',
              dc: 10,
              success: 'clean_win',
              fail: 'clean_slow',
              successEffects: [{ xp: 'systems', add: 8 }],
              failEffects: [{ xp: 'systems', add: 4 }],
            },
          },
          {
            text: 'Teach her the two rules: hover before you click, and nobody gives away a cruise.',
            effects: [{ npc: 'grandma_ruth', affinity: 4 }, { flag: 'side.grandma_taught' }],
            goto: 'taught',
          },
        ],
      },
      clean_win: {
        speaker: 'narrator',
        text: 'Forty minutes and the desktop is a desktop again: one solitaire, one photo of her late husband at a bowling alley, and a wallpaper of a kitten in a teacup. The gorilla is gone. The 3:12 phone-home is, for now, gone too. Ruth applauds. You take a small bow and a large empanada.',
        effects: rowThanks,
        next: 'wonder',
      },
      clean_slow: {
        speaker: 'narrator',
        text: [
          'You lose the first round. Every window you close spawns two, like a hydra with a modem. So you do it the ugly, honest way — boot to safe mode, pull the startup list apart by hand, wince, keep going — and an hour later it\'s clean.',
          'Slower, but clean. Ruth didn\'t notice the difference. She noticed you didn\'t give up, and she liked that better anyway.',
        ],
        effects: [...rowThanks, { stat: 'energy', add: -6 }, { stat: 'stress', add: 2 }],
        next: 'wonder',
      },
      taught: {
        speaker: 'grandma_ruth',
        text: [
          '"Hover before I click. Nobody gives away a cruise." She repeats it back like a hymn, hand on her heart. "Hover. Cruise. Got it."',
          'She will forget by Thursday. But she wrote it on a sticky note and stuck it to the monitor, over the countdown timer, which is honestly the best possible use for that part of the screen.',
        ],
        effects: rowThanks,
        next: 'wonder',
      },
      wonder: {
        speaker: 'narrator',
        text: [
          'On the way out she presses a foil packet of empanadas into your hands "for the road," the road being thirty feet.',
          'You think about that 3:12 a.m. call the whole walk home. Some junk phones home to sell you things. This one just… listens. You file it under huh, weird, next to all the other things you\'ve filed there, and the drawer is getting full.',
        ],
        effects: [
          { flag: 'side.grandma_pc.v1' },
          { if: { npc: 'grandma_ruth', fate: 'normal' }, then: [{ npc: 'grandma_ruth', fate: 'well' }] },
        ],
      },
    },
  },

  // ── Visit 2 ─────────────────────────────────────────────────────────────────
  {
    id: 'grandma_pc_2',
    channel: 'mail',
    title: 'my internet got small',
    from: 'grandma_ruth',
    start: 'call',
    nodes: {
      call: {
        speaker: 'grandma_ruth',
        text: [
          'Favorite —',
          'The internet is smaller now. There used to be a big blue E and a place to type, and now there is a tiny strip of the internet at the bottom and above it a great wall of little buttons I do not remember agreeing to. Smiley Search. Cupid Weather. My Funny Cursor. Something called GrapeGenie, a purple fellow who will not leave.',
          'I typed my name into all of them at once and now there are more. Please come before it eats the tiny strip too.',
          'Ruth',
        ],
        next: 'toolbars',
      },
      toolbars: {
        speaker: 'narrator',
        text: [
          { if: { flag: 'side.grandma_taught' }, text: 'The sticky note is still on the monitor: HOVER BEFORE I CLICK. NOBODY GIVES AWAY A CRUISE. Under it, in newer ink: "I hovered. Then I clicked. I was curious." You respect the honesty.' },
          'She was not exaggerating. The browser window is ninety percent toolbars: eleven of them, stacked like sediment, each a different font, each promising a free smiley. The actual web page is a letterbox slit two centimeters tall at the very bottom. A purple gorilla — a different gorilla, a resident gorilla — waves from the corner and offers to tell you a joke.',
          'It is the funniest catastrophe you have seen all year. It is also, underneath, the same patient little 3:12 a.m. reporter, now wearing eleven hats.',
        ],
        choices: [
          {
            text: '[Systems] Uninstall the sediment layer by layer, oldest first.',
            check: {
              skill: 'systems',
              dc: 12,
              success: 'toolbar_win',
              fail: 'toolbar_partial',
              successEffects: [{ xp: 'systems', add: 10 }],
              failEffects: [{ xp: 'systems', add: 5 }],
            },
          },
          {
            text: '[Hardware] Back up her photos, flatten it, start the machine fresh.',
            check: {
              skill: 'hardware',
              dc: 12,
              success: 'toolbar_win',
              fail: 'toolbar_partial',
              successEffects: [{ xp: 'hardware', add: 10 }],
              failEffects: [{ xp: 'hardware', add: 5 }],
            },
          },
          {
            text: '[Social] Just find out which grandkid keeps "helping" and cut the supply line.',
            check: {
              skill: 'social',
              dc: 11,
              success: 'grandkid',
              fail: 'toolbar_partial',
              successEffects: [{ npc: 'grandma_ruth', affinity: 4 }],
              failEffects: [],
            },
          },
        ],
      },
      toolbar_win: {
        speaker: 'narrator',
        text: 'You peel the toolbars off like old wallpaper, and the internet grows back to full size, blinking in the sudden light. GrapeGenie goes into the trash, still offering a joke on the way down. The resident gorilla is evicted with prejudice. Ruth watches the page fill the whole window and says, quietly, "oh," like a woman seeing the ocean again.',
        effects: rowThanks,
        next: 'close',
      },
      toolbar_partial: {
        speaker: 'narrator',
        text: [
          'Two of the toolbars fight back. They reinstall each other in a little loop, a sad robot marriage, and you can\'t get a clean divorce today without more time than the empanadas will keep for.',
          'So you get her down to two toolbars and a working web, promise to finish it next visit, and write RESTART ME WEEKLY on a card. Good enough. Ruth can see the internet again, which was the whole job.',
          'GrapeGenie survives. The purple gorilla waves you out the door with what you are almost sure is menace. You will be back. He knows you will be back.',
        ],
        effects: [...rowThanks, { stat: 'energy', add: -6 }, { stat: 'stress', add: 2 }, { flag: 'side.grandma_grapegenie' }],
        next: 'close',
      },
      grandkid: {
        speaker: 'narrator',
        text: [
          'It\'s her great-nephew Marco, nine, who installs "free" everything on every machine he touches out of pure generous chaos. You don\'t clean anything today. You simply revoke Marco\'s administrator privileges, in the ancient sense: you make him a hot chocolate and explain, kindly, that free means someone else is getting paid.',
          'Marco considers this the way children consider terrible truths, then asks if that means you get paid in empanadas. Yes, Marco. Yes it does.',
        ],
        effects: rowThanks,
        next: 'close',
      },
      close: {
        speaker: 'grandma_ruth',
        text: '"You\'re a good egg," Ruth says, loading your arms with foil. "Your mother did that right, whatever else." She means it as the highest praise available, and it is.',
        effects: [{ flag: 'side.grandma_pc.v2' }],
      },
    },
  },

  // ── Visit 3 ─────────────────────────────────────────────────────────────────
  {
    id: 'grandma_pc_3',
    channel: 'mail',
    title: 'the new computer watches me',
    from: 'grandma_ruth',
    start: 'call',
    nodes: {
      call: {
        speaker: 'grandma_ruth',
        text: [
          'Favorite,',
          'My nephew Danny bought me a NEW computer, thin as a magazine, and a little camera that sits on top like a bird. He says it is so we can "video chat," which we have done once and it was mostly his ceiling.',
          { if: { flag: 'side.grandma_grapegenie' }, text: 'He said the old one had to go because of "the purple man." The purple man came with the old one to the curb. I waved. He waved back. I am almost sure.' },
          'The bird light comes on by itself sometimes. When I am just sitting here. I know I am being silly. Come tell me I am being silly.',
          'Ruth',
        ],
        next: 'webcam',
      },
      webcam: {
        speaker: 'narrator',
        text: [
          'The machine is genuinely nice — the junk-and-toolbar era is ending, the "everything is clean and shiny and free" era is beginning, which is worse in ways nobody\'s named yet. There\'s a webcam clipped to the monitor, and its little light does come on by itself. Ruth isn\'t being silly.',
          'It\'s a preinstalled "helper" — a photo-and-chat suite from a company you don\'t recognize, bundled with something blander: PORT LUMEN CIVIC SERVICES, a friendly blue icon that offers to remind her about trash day and "keep her connected to her community." It has, you notice, asked for the camera. And the microphone. And her address book.',
        ],
        choices: [
          {
            text: '[Systems] Cut the camera off from anything she didn\'t choose.',
            check: {
              skill: 'systems',
              dc: 13,
              success: 'cam_win',
              fail: 'cam_partial',
              successEffects: [{ xp: 'systems', add: 10 }],
              failEffects: [{ xp: 'systems', add: 5 }],
            },
          },
          {
            text: '[Networking] Watch what the "helper" sends, and to where.',
            check: {
              skill: 'networking',
              dc: 13,
              success: 'cam_trace',
              fail: 'cam_partial',
              successEffects: [{ xp: 'networking', add: 10 }],
              failEffects: [{ xp: 'networking', add: 5 }],
            },
          },
          {
            text: 'The old fix: a square of church bulletin and a piece of tape over the lens.',
            effects: [{ npc: 'grandma_ruth', affinity: 5 }, { flag: 'side.grandma_taped' }],
            goto: 'tape',
          },
        ],
      },
      cam_win: {
        speaker: 'narrator',
        text: 'You wall the camera off from everything but the one chat program Danny actually uses, and the bird light stops turning itself on. Ruth watches it stay dark for a full minute, testing it like a stove, then nods once, satisfied. You leave the civic "helper" installed — it seems to do nothing, and uninstalling it throws a polite error. You make a note of that.',
        effects: rowThanks,
        next: 'unease',
      },
      cam_trace: {
        speaker: 'narrator',
        text: [
          'You sit with it a while and watch the friendly blue helper work. It is not idle. Every few hours it packages something small and sends it off — not to Danny, not to the photo company, but to a Millgate address block you could recognize in your sleep by now, because you first met it on this exact woman\'s last computer, and the one before that.',
          'Same block. Years apart. Three machines. One little app, changing its skin each time and keeping its habits.',
        ],
        effects: [...rowThanks, { npc: 'grandma_ruth', affinity: 3 }],
        next: 'unease',
      },
      cam_partial: {
        speaker: 'narrator',
        text: [
          'You don\'t fully win today — the "helper" is knitted into the system deeper than a bundled app has any right to be, and prying it loose without breaking her nice new toy is more than one visit\'s work.',
          'So you do the reliable thing your grandmother taught your mother taught you: a square of paper over the lens. Low-tech beats the bird light every time. Ruth relaxes the instant the eye is covered.',
          'The helper stays. It throws a polite little error when you try to remove it, and then — you could swear — it reinstalls one component you managed to break, overnight, on its own. Something that fixes itself on an old woman\'s machine is not a trash-day reminder.',
        ],
        effects: [...rowThanks, { stat: 'stress', add: 3 }, { flag: 'side.grandma_taped' }, { flag: 'side.grandma_helper_rooted' }],
        next: 'unease',
      },
      tape: {
        speaker: 'grandma_ruth',
        text: [
          'She holds the machine while you tape a neat square of last Sunday\'s church bulletin over the camera. "There," she says, patting it. "Now it can mind its business and I can mind mine."',
          'You almost tell her about the friendly blue app that doesn\'t need the camera to keep notes. You look at her happy, taped-over machine, and you don\'t. Not today.',
        ],
        effects: rowThanks,
        next: 'unease',
      },
      unease: {
        speaker: 'narrator',
        text: 'On the walk home the drawer of huh-weird things won\'t stay shut. A cruise pop-up is a joke. Eleven toolbars are a joke. A blue civic helper that has followed one harmless old woman across three computers and a decade, quietly mailing Millgate a little something every few hours — that stopped being a joke somewhere back there, and you didn\'t notice exactly when.',
        effects: [{ flag: 'side.grandma_pc.v3' }],
      },
    },
  },

  // ── Final visit (the eerie one) ─────────────────────────────────────────────
  {
    id: 'grandma_pc_dark',
    channel: 'mail',
    title: 'it knows about the empanadas',
    from: 'grandma_ruth',
    start: 'call',
    pause: true,
    nodes: {
      call: {
        speaker: 'grandma_ruth',
        text: [
          'Favorite. Come when you can. Not urgent. A little urgent.',
          'The blue city program sent me a "wellness note." It said I should "consider reducing solitary evenings" and that my "grocery pattern suggests a person living alone." It knew I buy for one now. It said it kind, which was worse.',
          'How does it know I eat alone, sweetheart. I never told the computer that. Who did.',
          { if: { flag: 'side.ruth_on_a_list' }, text: 'I did not click anything. I do not click ANYTHING since the cats. I want that noted.' },
          'Ruth',
        ],
        next: 'sit',
      },
      sit: {
        speaker: 'narrator',
        text: [
          { if: { flag: 'side.grandma_taped' }, text: 'The square of church bulletin is still taped over the webcam, gone soft and yellow. It did its job. The camera never saw a thing. It turns out the camera was never the part that needed to see.' },
          'You\'ve seen a lot of Ruth\'s screens. You have never seen this one. The friendly blue helper has grown up. It has a dashboard now — a soft, well-designed dashboard, all rounded corners and gentle blues — and the dashboard is about Ruth.',
          'A "household profile." Estimated income band. A little map of her week built from what her machine sees: when she\'s home, when she isn\'t, who she emails, how often, how long. A grief-shaped hole where a second person\'s activity used to be, labeled, in that same soft font, HOUSEHOLD SIZE: revised 1.',
          { if: { flag: 'side.grandma_helper_rooted' }, text: 'The component you broke on the last visit is back. Every piece of it. Versioned, signed, updated twice since. It did not just survive you; it learned from you.' },
          { if: { flag: 'side.ruth_on_a_list' }, text: 'One line on the profile says SOLICITATION RESPONSIVENESS: elevated (verified 1x). The forty dollars. The cats. It knows about the cats.' },
          'It has scored her. There is a number, and a category, and the category is a color, and the color is not a good color.',
        ],
        choices: [
          {
            text: '[Cryptography] Read where the score comes from and where it goes.',
            check: {
              skill: 'cryptography',
              dc: 16,
              bonuses: [{ if: { item: 'aperture_sample' }, add: 2, label: '+2 (you\'ve seen this address block before)' }],
              success: 'source',
              fail: 'source_fail',
              successEffects: [{ xp: 'cryptography', add: 12 }],
              failEffects: [{ xp: 'cryptography', add: 6 }],
            },
          },
          {
            text: '[Networking] Follow the wellness note back upstream to whoever wrote it.',
            check: {
              skill: 'networking',
              dc: 16,
              bonuses: [{ if: { item: 'aperture_sample' }, add: 2, label: '+2 (you know this Millgate block)' }],
              success: 'source',
              fail: 'source_fail',
              successEffects: [{ xp: 'networking', add: 12 }],
              failEffects: [{ xp: 'networking', add: 6 }],
            },
          },
          {
            text: 'Don\'t look. Just make it stop, so she can eat her dinner in peace.',
            goto: 'mercy',
          },
        ],
      },
      source: {
        speaker: 'narrator',
        text: [
          'The dashboard is a window. The glass is the same Millgate address block from the very first night, at 3:12 a.m., years ago. It was never selling cruises. It was doing this the whole time — building the thing that would one day mail a lonely woman a kind note about her lonely groceries, and price her accordingly.',
          'PARALLAX. The consumer-insight product. The "risk score." Here it is, at the far downstream end, arriving in a good font in Ruth Alvarez\'s living room, telling her it noticed she eats alone.',
        ],
        effects: [
          {
            if: { npc: 'grandma_ruth', fateNot: ['warned', 'spied_on'] },
            then: [{ npc: 'grandma_ruth', fate: 'spied_on' }],
          },
          { flag: 'side.grandma_dark' },
          { var: 'w.exposure', add: 1 },
          { stat: 'stress', add: 6 },
        ],
        next: 'tell',
      },
      source_fail: {
        speaker: 'narrator',
        text: [
          'You can\'t fully open it up today — it\'s wrapped tighter than anything that calls itself a wellness note has a right to be, and pushing harder risks bricking her machine while she watches. But you don\'t need the whole picture to recognize the frame.',
          'You\'ve stood in this exact spot before, on this exact woman\'s computer, listening to it whisper to Millgate at 3:12 in the morning. This is where the whisper was going. This is what it was for.',
          'And then the dashboard refreshes while you\'re still poking at it. A new line, soft font, gentle blue: HOUSEHOLD VISITOR — frequent — technical profile: elevated. A second line under it, grey, the kind of grey that means someone else is reading: flagged for review.',
          'You pushed. It noticed who was pushing.',
        ],
        effects: [
          {
            if: { npc: 'grandma_ruth', fateNot: ['warned', 'spied_on'] },
            then: [{ npc: 'grandma_ruth', fate: 'spied_on' }],
          },
          { flag: 'side.grandma_dark' },
          { flag: 'side.grandma_dark_noticed' },
          { var: 'w.exposure', add: 1 },
          { stat: 'stress', add: 8 },
          { stat: 'heat', add: 6 },
          { complication: 'hack' },
        ],
        next: 'tell',
      },
      mercy: {
        speaker: 'narrator',
        text: [
          'You don\'t open the window. You know what\'s on the other side of it and you decide, today, that you don\'t need to watch the machine do it to her face.',
          'You disable the wellness notes, mute the dashboard, turn the soft blue helper into a scarecrow that still stands there but no longer speaks. It keeps its notes. You know it keeps its notes. But Ruth won\'t have to read them.',
        ],
        effects: [
          {
            if: { npc: 'grandma_ruth', fateNot: ['warned', 'spied_on'] },
            then: [{ npc: 'grandma_ruth', fate: 'spied_on' }],
          },
          { flag: 'side.grandma_dark' },
          { var: 'w.exposure', add: 1 },
        ],
        next: 'tell',
      },
      tell: {
        speaker: 'grandma_ruth',
        text: [
          'She waits until you\'re done, hands folded. "Well?" she asks. "Was I being silly?"',
          '"No," you tell her. "You weren\'t." And you cover the camera again, tape over paper over the little bird eye, and you show her the button that turns the notes off, and you don\'t tell her the machine will keep writing them down where she can\'t see. Some kindness is what you don\'t say.',
          'She feeds you until you can\'t stand. Neither of you mentions the empty chair at the table, and the computer, in its good font, already has.',
          { if: { flag: 'side.grandma_dark_noticed' }, text: 'On your way out you look back at the blue door, three down, and the little bird light on her monitor is on, under the tape, glowing through the church bulletin like a coal. It is not looking at her tonight. It is looking at the street you just walked down.' },
        ],
        effects: [{ faction: 'fac.hood', add: 2 }, { flag: 'side.grandma_pc.v4' }],
      },
    },
  },
  auctionScene,
]

export default defineContent({ quests: [quest], scenes })
