/**
 * PKG-07 — Faction Arc: The Bureau, "Cooperating Witness" (bible §7.3, §6.B).
 *
 * The federal-informant road. It opens two ways: at the Act II hinge (CP-B5 B/C, PKG-02) or the
 * moment a raid puts you in a corner (the post-raid flip, authored here as `trig_bureau_flip_offer`
 * + `bureau_flip_offer`). From there: the first delivery, the burn notice (the friend they ask you
 * to hand over), the rot upstairs (Reyes turns on her own office), the sting (a journal mirror of
 * the CP-C3 Bureau route), and the Act IV choice to seize the surveillance or serve it to a court.
 *
 * Ownership (bible §13): this package writes `fac.bureau.*`, `npc.reyes/marlow.fate` (+ their
 * steering flags), `npc.jax.flipped` (sole writer), and adds to the shared `end.doubles`. It reads
 * `a2.first_raid_resolved`, `a2.spine`, `a3.heist_resolved` (other packages), and inner-circle
 * availability for the burn target. Corvid's fate stays owned by PKG-05: complying against her sets
 * only the shared `npc.corvid.charged` flag, never a fate.
 *
 * Voice: Reyes is dry, moral, tired — a true believer learning what her badge is bolted to. Marlow
 * is golf and "the map." The player's failures never dead-end; every check has authored fallout.
 *
 * Fail branches (REDESIGN_V2 §D) — each keeps the progression flags (`fac.bureau.q2_done/q3_done`,
 * `leashed`) and adds a lasting mark:
 *  - q2 blown [Double] → Marlow's "Prove It": wear a wire into the Loft's back room
 *    (`fac.bureau.wired_loft`, scar The Wire Itch, the tape's follow-up mail) or be outed to the Row
 *    (`fac.bureau.outed`, scar The Booth by the Jukebox). PKG-05's Loft scenes read both flags.
 *  - q3 blown decoy → Marlow's five-minute clock: burn a friend after all, put yourself on the record
 *    (`fac.bureau.self_statement`, scar Signed Statement, restitution obligation), or be outed.
 *  - q4/q6 react to all of it (Reyes's asides; the tape kept forever or wiped in open court).
 */
import { defineContent } from '@/engine/registry'
import type { Cond, QuestDef, SceneDef, TriggerDef } from '@/engine/types'

// Friends the Bureau can plausibly ask you to burn (met and not already lost / off the board).
const jaxBurnable: Cond = { npc: 'jax', met: true, fateNot: ['dead', 'gone', 'flipped', 'missing'] }
const corvidBurnable: Cond = {
  npc: 'corvid',
  met: true,
  fateNot: ['dead', 'gone', 'exile', 'bought', 'martyred', 'succeeded', 'missing'],
}

// ────────────────────────────────────────────────────────────────────────────
// Scenes
// ────────────────────────────────────────────────────────────────────────────

const scenes: SceneDef[] = [
  // ── The post-raid flip (the "arrest opens a branch" pillar) ────────────────
  {
    id: 'bureau_flip_offer',
    channel: 'mail',
    from: 'reyes',
    title: 'a way this goes easier',
    expiresDays: 20,
    onExpire: [{ log: 'You never answered the agent\'s note. It circles back eventually.', kind: 'info' }],
    start: 'card',
    nodes: {
      card: {
        speaker: 'reyes',
        text: [
          'No letterhead, no signature — just a card in a plain envelope, slid under a story you already know the ending of.',
          { if: { jailed: true }, text: '"You\'re looking at a cage and a court date. I\'m looking at you like a person who still gets a choice. Those are two different windows and only one of them is open."' },
          {
            if: { jailed: false },
            text: '"They took your machines. Next time they take your calendar. I can make the next time not happen — Dana Reyes, and yes, that\'s my real name, which is more than the last three people who called you a friend can say."',
          },
          '"I don\'t want the scene. I want the people hollowing out this city. Help me point at them and you stop being a name in a folder. Cathode diner, any night, the booth by the jukebox. Order the pie. It\'s terrible. It\'s a test of character."',
        ],
        choices: [
          {
            text: 'Order the pie. Take the deal.',
            tag: '[Flip]',
            effects: [
              { faction: 'fac.bureau', add: 20 },
              { faction: 'fac.loft', add: -6 },
              { flag: 'fac.bureau.informant' },
              { flag: 'fac.bureau.informant_secret' },
              { quest: 'fac_bureau_q1_approach', start: true },
            ],
            goto: 'accepted',
          },
          {
            text: 'Hear her out. Commit to nothing.',
            goto: 'noncommittal',
          },
          {
            text: 'Throw the card in the Sound.',
            tag: '[Refuse]',
            effects: [
              { flag: 'fac.bureau.flip_declined' },
              { faction: 'fac.bureau', add: -2 },
              { faction: 'fac.loft', add: 2 },
            ],
            goto: 'declined',
          },
        ],
      },
      accepted: {
        speaker: 'reyes',
        text: [
          'She doesn\'t smile so much as let the corner of her mouth off its leash for a second. She writes a number on the napkin and a second number under it.',
          '"Top one is me. Bottom one is a voicemail that calls you back. You\'re not a rat, {name}. You\'re a witness. Say it with me: witness." You don\'t say it. She lets that go, for now.',
        ],
      },
      noncommittal: {
        speaker: 'reyes',
        text: [
          'She nods like you just told her something true. "Smart. Stay smart. The card doesn\'t expire, and neither does the thing that made you read it twice."',
          'She leaves the pie. You leave the pie. The pie was, in fact, terrible.',
        ],
      },
      declined: {
        speaker: 'narrator',
        text: [
          'The card goes into the grey water off the pier and is gone before it lands. It felt good for about four seconds.',
          'You are still a name in a folder. You just don\'t have a number to call about it.',
        ],
      },
    },
  },

  // ── q2 — First Delivery ────────────────────────────────────────────────────
  {
    id: 'bureau_first_delivery',
    channel: 'dialog',
    from: 'reyes',
    title: 'The First Delivery',
    start: 'brief',
    nodes: {
      brief: {
        speaker: 'reyes',
        text: [
          'The booth by the jukebox. A manila folder she doesn\'t open. A coffee she doesn\'t drink.',
          '"I need a name. Small, real, provable — someone moving weight through the scene. Not your favorite person. Just a person." She slides a pen across the formica like it weighs something.',
          { if: { flag: 'fac.bureau.leashed' }, text: 'Marlow\'s been reading your file over her shoulder lately. She keeps glancing at the door. "And this time, make it check out."' },
          '"Or you wear a wire to the next back-room meet and I don\'t make you say a single name out loud. Your call, and I mean that — it\'s the last time it\'ll feel like a call."',
        ],
        choices: [
          { text: 'Give her a real name from the board.', tag: '[Inform]', goto: 'real' },
          {
            text: 'Feed her a fake that will survive a check.',
            tag: '[Double]',
            check: {
              skill: 'opsec',
              dc: 20,
              success: 'false_ok',
              fail: 'false_bad',
            },
          },
          { text: 'Give her someone who genuinely has it coming.', tag: '[Hedge]', goto: 'nobody' },
          {
            text: 'Take the wire. No names out loud. Just be in the room.',
            tag: '[Wire]',
            effects: [{ faction: 'fac.bureau', add: 2 }, { flag: 'fac.bureau.q2_done' }],
            goto: 'wire_night',
          },
          { text: 'Tell her the well is dry.', tag: '[Stall]', goto: 'stall' },
        ],
      },
      real: {
        speaker: 'reyes',
        text: [
          'She writes it down without looking at the paper, the way you sign for a package you didn\'t want. "Thank you. I hate that I mean it."',
          'The name will make an arrest in six weeks. You will read about it and recognize a handle before you recognize a face. The board will never know it was you — which is somehow worse.',
        ],
        effects: [
          { faction: 'fac.bureau', add: 8 },
          { faction: 'fac.loft', add: -10 },
          { stat: 'cred', add: -3 },
          { flag: 'fac.bureau.q2_done' },
        ],
      },
      false_ok: {
        speaker: 'reyes',
        text: [
          'You build a person out of true-sounding parts: a handle nobody uses, a heat signature you salted a week ago, a trail that ends in a rented mailbox. It is a small, perfect lie, and it walks.',
          'Reyes reads it, nods, files it. Somewhere a fake gets investigated for months, and a real one you like keeps breathing. You feel like a magician and a liar in the exact same muscle.',
        ],
        effects: [
          { var: 'end.doubles', add: 1 },
          { faction: 'fac.bureau', add: 5 },
          { flag: 'fac.bureau.double_fed' },
          { flag: 'fac.bureau.q2_done' },
        ],
      },
      false_bad: {
        speaker: 'reyes',
        text: [
          'The lie has a seam and Marlow finds it in a day. Reyes calls you at an hour that isn\'t for good news. "He wants to know if you\'re slow or crooked. I told him slow. Don\'t make a liar of me twice."',
          'The leash is shorter now. You can feel it when you turn your head.',
        ],
        effects: [
          { faction: 'fac.bureau', add: 2 },
          { stat: 'heat', add: 5 },
          { flag: 'fac.bureau.leashed' },
          { flag: 'fac.bureau.q2_done' },
        ],
        next: 'prove_it',
      },

      // ── The blown [Double]: Marlow's "Prove It" (REDESIGN_V2 §D) ──────────────
      prove_it: {
        speaker: 'marlow',
        text: [
          'Four days later it isn\'t Reyes in the booth by the jukebox. It\'s SAC Duke Marlow, in a golf windbreaker, with a slice of pie he has no intention of eating and a small grey box the size of a pager sitting next to it.',
          '"Son, a man who hands me a fake once is either a genius or a problem, and I don\'t have the budget for geniuses." He nudges the grey box across the formica with one finger. "So you\'re going to show me you\'re just slow. Next back-room night above the pager shop, you wear this. Tape under the collar. You don\'t have to say a word. You just have to be in the room."',
          '"Or don\'t. Your choice — I\'m a big believer in choices. But then I let the neighborhood know which booth you sit in, and let them figure out what you are. They\'re quicker at that than we are."',
          { if: { flag: 'fac.loft.side_corvid' }, text: 'You stood up for Corvid\'s commons in that back room. He knows that too. He is smiling like a man who has read the minutes.' },
        ],
        next: 'prove_it_choice',
      },
      prove_it_choice: {
        speaker: 'narrator',
        text: 'Reyes is two booths down, pretending to read a menu she knows by heart. She doesn\'t look up. The grey box doesn\'t either.',
        choices: [
          {
            tag: '[Wear the wire]',
            text: 'Pocket the box. One night. You won\'t say anything. You\'ll just be in the room.',
            goto: 'wire_night',
          },
          {
            tag: '[Social DC 16]',
            text: 'Walk two booths down. Ask Reyes to tell him the fake was her mistake — her source, her bad read, her paperwork.',
            check: {
              skill: 'social',
              dc: 16,
              bonuses: [
                { if: { npc: 'reyes', affinityGte: 30 }, add: 2, label: '+2 (she likes you more than she lets on)' },
                { if: { trait: 'silver_tongue' }, add: 1, label: '+1 (silver tongue)' },
              ],
              success: 'reyes_covers',
              fail: 'reyes_wont',
              successEffects: [
                { flag: 'fac.bureau.reyes_covered' },
                { npc: 'reyes', affinity: 4 },
                { faction: 'fac.bureau', add: -2 },
              ],
              failEffects: [{ npc: 'reyes', affinity: -6 }, { stat: 'stress', add: 6 }],
            },
          },
          {
            tag: '[Refuse]',
            text: '"Tell them, Duke. I\'m not taping my friends."',
            goto: 'outed',
          },
        ],
      },
      wire_night: {
        speaker: 'narrator',
        text: [
          'Tuesday. The back room above the pager shop, the couch at capacity, somebody arguing about the maple donut. The tape under your collar is warm and itches like guilt with an adhesive backing.',
          'You say almost nothing all night. You don\'t have to. The room talks the way it always talks when it thinks it\'s alone.',
          {
            if: { npc: 'byteme', fateNot: ['dead', 'arrested_young', 'missing'] },
            text: 'byteme talks about his mother\'s shift schedule at the laundromat, at length, because someone asked if she\'d been promoted.',
            else: 'Somebody tells a story about byteme, the kid who used to sign everything, and the room goes quiet for a while.',
          },
          {
            if: { npc: 'deadline', fateNot: ['passed', 'dead'] },
            text: 'Deadline tells the \'94 story again, the long version, with the dog\'s vet records.',
          },
          'Two regulars trade the name of a landlord portal nobody should know about. The grey box hears all of it and never once laughs at the right parts.',
          {
            if: { all: [{ npc: 'corvid', fate: ['normal', 'free'] }, { not: { flag: 'npc.corvid.bought' } }] },
            text: 'On the stairs going down, Corvid holds the door for you and says "night," the way she says it to everyone. You say it back. That\'s on the tape too.',
            else: 'On the stairs going down, somebody holds the door for you and says "night," the way the back room says it to everyone. You say it back. That\'s on the tape too.',
          },
        ],
        effects: [
          { flag: 'fac.bureau.wired_loft' },
          { trait: 'pkg07_bureau_wire_itch' },
          { faction: 'fac.bureau', add: 6 },
          { faction: 'fac.loft', add: -6 },
          { stat: 'stress', add: 8 },
          { stat: 'mood', add: -8 },
          { scene: 'bureau_tape_played', delayHours: 24 * 5 },
        ],
        next: 'wire_after',
      },
      wire_after: {
        speaker: 'narrator',
        text: [
          {
            if: { flag: 'fac.bureau.leashed' },
            text: '"Slow, then," Marlow says the next morning, turning the grey box over in his hand like a golf ball he just found in the rough. "Slow I can use." He leaves you the check for the pie. The leash doesn\'t get any longer. It just stops choking you for a while, which from Marlow is the same as a raise.',
            else: 'Reyes collects the grey box the next morning in the Cathode parking lot, without a word, the way you\'d take back a borrowed umbrella. "No names out loud," she says finally. "That was the deal, and you kept it." She doesn\'t say the rest: that the tape says every name anyway, in everybody else\'s voice.',
          },
        ],
      },
      reyes_covers: {
        speaker: 'reyes',
        text: [
          'She puts the menu down. For a second you think she\'s going to say no, and then she gets up, walks to Marlow\'s booth, and tells him flatly that the fake came from her own source, that she read it wrong, that she\'s written herself up for it.',
          'Marlow looks at her for a long time. "That so." He pockets the grey box. "Then it\'s your leash now, Agent. Hold it tight." He leaves. Reyes sits back down across from you and doesn\'t say anything for a full minute.',
          '"That\'s one," she says finally. "I don\'t have a two. Don\'t ever make me find out if I do."',
        ],
      },
      reyes_wont: {
        speaker: 'reyes',
        text: [
          'She doesn\'t even let you finish. "I already lied for you. I told him slow. I don\'t get to lie twice in one week to a man who counts his teeth after lunch." Her voice is very quiet and very tired. "You picked the fake. You don\'t get to pick who pays for it."',
          'Two booths down, Marlow watched the whole thing. He doesn\'t need a wire to know what a person asking for cover looks like. He picks up his windbreaker.',
        ],
        effects: [{ stat: 'heat', add: 6 }],
        next: 'outed',
      },
      outed: {
        speaker: 'narrator',
        text: [
          'Marlow doesn\'t do anything dramatic. He never does. He just has lunch at the Cathode three days running, in the booth by the jukebox, and on the third day he tells Sal — loudly, genially, tipping well — to "save the booth for my friend {name}, same as always."',
          'By the weekend the whole Row knows. By Monday the back room does. Nobody says anything to your face. The pager goes quiet in a way you have never heard it go quiet, and the next time you walk into the pager shop, the conversation behind the counter stops, and then starts again about the weather.',
        ],
        effects: [
          { trait: 'pkg07_bureau_outed' },
          { flag: 'fac.bureau.outed' },
          { flag: 'fac.bureau.outed_early' },
          { faction: 'fac.loft', add: -12 },
          { faction: 'fac.bureau', add: -4 },
          { stat: 'cred', add: -4 },
          { stat: 'mood', add: -6 },
          { chance: 0.3, then: [{ complication: 'social' }] },
        ],
        next: 'outed_after',
      },
      outed_after: {
        speaker: 'reyes',
        text: [
          '"He does this," Reyes says, the next time you meet, somewhere that isn\'t the Cathode anymore. "He doesn\'t burn assets. He just turns the lights on and lets the neighborhood do it. That way it\'s never his fingerprints."',
          '"You\'re still mine, for what it\'s worth. Mine is worth less than it was on Tuesday. So are you." She doesn\'t say it cruelly. She says it like a weather report, which is somehow worse.',
        ],
      },
      nobody: {
        speaker: 'reyes',
        text: [
          'You give her the fraud crew running skim jobs on grandmothers off the Row — nobody\'s friend, everybody\'s problem. She recognizes the mercy for what it is and lets you have it.',
          '"Convenient, that the guy you don\'t like is also guilty." She isn\'t wrong. You tell yourself it counts anyway, and mostly it does.',
        ],
        effects: [
          { faction: 'fac.bureau', add: 4 },
          { flag: 'fac.bureau.q2_done' },
        ],
      },
      stall: {
        speaker: 'reyes',
        text: [
          '"Dry." She lets the word sit. "I can work with dry once. I can\'t work with dry twice, and neither can he." She caps the pen. The folder goes back into the bag unopened, which is the most threatening thing about it.',
          'You keep your hands clean for one more night. The price is that the next ask won\'t be a booth and a pen. It\'ll be a name they already picked.',
        ],
        effects: [
          { faction: 'fac.bureau', add: -5 },
          { flag: 'fac.bureau.leashed' },
          { flag: 'fac.bureau.q2_done' },
        ],
      },
    },
  },

  // ── The tape (the wire's second beat) ──────────────────────────────────────
  {
    id: 'bureau_tape_played',
    channel: 'mail',
    from: 'reyes',
    title: 're: tuesday',
    expiresDays: 14,
    onExpire: [
      { stat: 'mood', add: -4 },
      { log: 'You never answered Reyes about the tape. The two regulars got their knock anyway.', kind: 'story' },
    ],
    start: 'mail',
    nodes: {
      mail: {
        speaker: 'reyes',
        text: [
          'No greeting.',
          'He played it in the conference room. Twice. Everyone laughed at the donut argument, which I guess is a kind of review. Then he stopped it on the part about the landlord portal and wrote two handles on the whiteboard.',
          'They get a knock next week. Not an arrest — a knock. A card, a conversation, a "we\'d like to keep this friendly." You know what a knock is. You got one.',
          'I\'m telling you because nobody told me, the first time I sat in a room like that. Delete this.',
          '— D.',
        ],
        choices: [
          {
            tag: '[Warn them]',
            text: 'Find the two regulars before the knock does. Tell them to clean house — and don\'t tell them how you know.',
            effects: [
              { faction: 'fac.loft', add: 3 },
              { faction: 'fac.bureau', add: -4 },
              { stat: 'heat', add: 4 },
              { flag: 'fac.bureau.warned_the_tape' },
            ],
            goto: 'warned',
          },
          {
            text: 'Reply: "Destroy it."',
            goto: 'destroy',
          },
          {
            tag: '[Leave]',
            text: 'Delete it, the way she asked. Then sit with the empty trash for a while.',
            effects: [{ stat: 'mood', add: -4 }, { stat: 'stress', add: 3 }],
          },
        ],
      },
      warned: {
        speaker: 'narrator',
        text: [
          'You catch them at the laundromat, which is the only place on the Row nobody ever records anything. You tell them the portal is burned and to wipe what they touched, and when they ask how you know, you say "a feeling," and they look at you the way people look at a feeling.',
          'The knock comes on schedule and finds two clean drives and two very bored young men. Marlow notices. He always notices. The leash twitches, once, like a fishing line.',
        ],
      },
      destroy: {
        speaker: 'reyes',
        text: 'It\'s evidence now. It has a number and a shelf and a sign-out sheet. Nobody destroys anything in this building — we just file it somewhere worse. I\'ll know where it is. That\'s the most I can do. Delete this.',
        effects: [{ npc: 'reyes', affinity: 2 }, { stat: 'mood', add: -2 }],
      },
    },
  },

  // ── q3 — The Line You Won't Cross (the burn notice) ────────────────────────
  {
    id: 'bureau_burn_notice',
    channel: 'dialog',
    from: 'reyes',
    title: 'The Line You Won\'t Cross',
    start: 'demand',
    nodes: {
      demand: {
        speaker: 'reyes',
        text: [
          'This time Marlow comes himself. He orders pie he won\'t touch and talks to the window. "The deal was cooperation. Cooperation has a shape, son, and the shape is a name I already know, said by a mouth I already own."',
          'Reyes stands behind him with her hands in her pockets and her jaw set. She won\'t look at you. That\'s how you know it\'s bad.',
          {
            if: { npc: 'jax', fate: 'arrested' },
            text: '"Ferreira\'s already in the net. I want you on the record against him. Sign, and he wears the whole weight. Don\'t, and he\'s just a scared kid alone in a room, and scared kids make deals of their own."',
            else: '"Give me one of your own. Doesn\'t have to be the worst one. Has to be one you\'d miss — that\'s the point. That\'s how I know it took."',
          },
        ],
        choices: [
          {
            text: 'Hand them {npc:jax}.',
            tag: '[Burn]',
            if: jaxBurnable,
            goto: 'gave_jax',
          },
          {
            text: 'Hand them {npc:corvid}.',
            tag: '[Burn]',
            if: corvidBurnable,
            goto: 'gave_corvid',
          },
          {
            text: 'Refuse. You don\'t sell people.',
            tag: '[Refuse]',
            goto: 'refuse',
          },
          {
            text: 'Feed them a decoy — a target that isn\'t real.',
            tag: '[Decoy]',
            check: {
              skill: 'social',
              dc: 17,
              success: 'decoy_ok',
              fail: 'decoy_bad',
            },
          },
        ],
      },
      gave_jax: {
        speaker: 'narrator',
        text: [
          { if: { npc: 'jax', fate: 'arrested' }, text: 'You sign the statement. Every line is true and every line is a knife. Jax reads it later; his lawyer tells you he read it twice, then folded it very small and put it in his shirt pocket, over the heart, where you\'d want it and where it would hurt the most.' },
          { if: { npc: 'jax', fateNot: 'arrested' }, text: 'They come for Jax at dawn, because dawn is when a man is furthest from his lawyer and closest to a confession. You aren\'t there. You made very sure you wouldn\'t be there. That\'s the part he\'ll never forgive, and he\'ll be right.' },
          { if: { flag: 'fac.bureau.decoy_blown' }, text: 'You tried a ghost first. You will tell yourself that for years, as if it counts. It doesn\'t make this better. It only made it take longer, in a parking lot, with a man holding a pie.' },
          'Marlow shakes your hand like you closed a deal. Reyes doesn\'t.',
        ],
        effects: [
          { npc: 'jax', fate: 'arrested', affinity: -40 },
          { faction: 'fac.bureau', add: 15 },
          { faction: 'fac.loft', add: -25 },
          { faction: 'fac.hood', add: -10 },
          { stat: 'mood', add: -20 },
          { flag: 'fac.bureau.burn_complied' },
          { flag: 'fac.bureau.exposed_self' },
          { flag: 'fac.bureau.q3_done' },
        ],
      },
      gave_corvid: {
        speaker: 'narrator',
        text: [
          'You give them Corvid. Eleanor Voss, sysop since before you could spell your handle, the woman who organized the night forty drives died so one friend wouldn\'t. They charge her by end of week.',
          'She doesn\'t call you. She doesn\'t post about it. She just quietly stops saving you a seat, and the board learns her silence like a new grammar.',
          { if: { flag: 'fac.bureau.decoy_blown' }, text: 'You tried a ghost first. It doesn\'t make this better. It only made it take longer, in a parking lot, with a man holding a pie.' },
          'Marlow calls it "leadership decapitation." Reyes calls it nothing. She walks out to the parking lot and stands in the cold for a while.',
        ],
        effects: [
          { npc: 'corvid', affinity: -30 },
          { faction: 'fac.bureau', add: 15 },
          { faction: 'fac.loft', add: -25 },
          { flag: 'npc.corvid.charged' },
          { flag: 'fac.bureau.burn_complied' },
          { flag: 'fac.bureau.exposed_self' },
          { flag: 'fac.bureau.q3_done' },
        ],
      },
      refuse: {
        speaker: 'player',
        text: [
          {
            if: { flag: 'fac.bureau.decoy_blown' },
            text: 'Marlow pockets his phone and gets into his own car, a sedan so beige it looks like a filing cabinet. He rolls the window down. "Then the deal is smaller than you thought it was. Everything is, from here." He drives off with the pie.',
            else: '"No." One word, and the diner gets very quiet, and the jukebox picks that exact moment to run out of song.',
          },
          {
            if: { not: { flag: 'fac.bureau.decoy_blown' } },
            text: 'Marlow doesn\'t get angry. Angry would be a compliment. He just picks up his hat. "Then the deal is smaller than you thought it was. Everything is, from here."',
          },
          { if: { npc: 'jax', fate: 'arrested' }, text: 'And because you wouldn\'t sign, Jax — alone, scared, out of road — signs something of his own. He flips. To save himself, which is the only thing anyone ever flips to save. You can\'t even be angry. You left him in that room.' },
          {
            if: { all: [{ npc: 'jax', fateNot: 'arrested' }, { flag: 'fac.bureau.outed' }] },
            text: 'You kept your line. The Row knows you sat with a fed; it will never know you refused to sell anyone while you did. You did it for nothing anyone will see, and paid for it with the one thing they can. That is also, somehow, the only way it counts.',
          },
          {
            if: { all: [{ npc: 'jax', fateNot: 'arrested' }, { not: { flag: 'fac.bureau.outed' } }] },
            text: 'You kept your line. The line cost you the only protection a badge was ever going to give you. The board doesn\'t know you refused, so it can\'t thank you. You did it for nothing anyone will see, which is the only way it counts.',
          },
        ],
        effects: [
          { faction: 'fac.bureau', add: -20 },
          { faction: 'fac.loft', add: 12 },
          { flag: 'fac.bureau.refused_burn' },
          { if: { npc: 'jax', fate: 'arrested' }, then: [{ npc: 'jax', fate: 'flipped' }, { flag: 'npc.jax.flipped' }] },
          { flag: 'fac.bureau.q3_done' },
        ],
      },
      decoy_ok: {
        speaker: 'narrator',
        text: [
          'You build them a ghost: a target with a history, a schedule, a pattern of movement, and no pulse. Everything about the file is true except the person at the center of it, who does not exist.',
          'Marlow chases the ghost for a month and comes back thinner. Reyes knows exactly what you did and says only, "Careful. He counts his teeth after you leave." Nobody real got sold. This time.',
        ],
        effects: [
          { faction: 'fac.bureau', add: 5 },
          { flag: 'fac.bureau.decoy' },
          { flag: 'fac.bureau.q3_done' },
        ],
      },
      decoy_bad: {
        speaker: 'narrator',
        text: [
          'The ghost has a shadow it shouldn\'t, and Marlow is exactly the kind of man who checks for shadows. He doesn\'t say a word. He just tightens something, somewhere, and after that every ask comes with a shorter rope.',
          'Reyes catches you on the way out. "He knows it was a decoy. He can\'t prove it. That\'s the worst place to be with him — he\'ll make you prove yourself instead, forever."',
        ],
        effects: [
          { faction: 'fac.bureau', add: -5 },
          { stat: 'heat', add: 10 },
          { stat: 'stress', add: 10 },
          { flag: 'fac.bureau.leashed' },
          { flag: 'fac.bureau.decoy_blown' },
          { flag: 'fac.bureau.q3_done' },
        ],
        next: 'decoy_pick',
      },

      // ── The blown decoy: Marlow picks the clock (REDESIGN_V2 §D) ──────────────
      decoy_pick: {
        speaker: 'marlow',
        text: [
          'He doesn\'t let you get to the parking lot. Marlow is waiting by your car with his hands in his windbreaker, and the pie from the booth in a to-go box, which is somehow the most menacing thing you have ever seen a man carry.',
          '"A ghost." He says it almost fondly. "You built me a ghost. Beautiful work. Shadow on it you could park a truck in." He checks his watch. "Here\'s what\'s going to happen. In five minutes I make a phone call. Either I\'m calling in a real name you gave me, or I\'m calling about you. Your choice. I\'m a big believer in choices."',
          { if: { flag: 'fac.bureau.outed' }, text: '"And don\'t tell me the neighborhood already knows about you. The neighborhood knows you sit with me. It doesn\'t know what you\'ve signed. There\'s always a next floor down, son."' },
          'Reyes is standing by the diner door in the cold, watching. She doesn\'t come over. You understand, suddenly, that she isn\'t allowed to.',
        ],
        choices: [
          {
            tag: '[Burn]',
            text: 'Give him {npc:jax}. You tried. You\'re out of ghosts.',
            if: jaxBurnable,
            goto: 'gave_jax',
          },
          {
            tag: '[Burn]',
            text: 'Give him {npc:corvid}. You tried. You\'re out of ghosts.',
            if: corvidBurnable,
            goto: 'gave_corvid',
          },
          {
            tag: '[On the record]',
            text: '"Then call about me. My name, my statement, my charges. You want someone you\'d miss? You\'d miss me. I\'m the best asset you have."',
            goto: 'on_record',
          },
          {
            tag: '[Call his bluff]',
            text: '"Make the call, Duke."',
            goto: 'call_bluff',
          },
        ],
      },
      on_record: {
        speaker: 'narrator',
        text: [
          'Marlow looks at you for a long moment, and for the first time since you\'ve known him, he looks genuinely surprised. Then he laughs, once, and opens the car door for you like a valet.',
          'The statement takes four hours in a room with no clock. Everything you ever did for the Bureau, everything you did before it, the booth, the ghost, the nights you\'d rather not have had. Your legal name at the top. Your signature at the bottom, above a line that says the undersigned understands this may be used. Reyes witnesses it. Her hand shakes when she signs, very slightly, and she hides it with the other one.',
          '"Nobody real got sold," she says in the elevator, not looking at you. "Except you. I hope you know what you just bought."',
        ],
        effects: [
          { trait: 'pkg07_bureau_signed_statement' },
          { flag: 'fac.bureau.exposed_self' },
          { flag: 'fac.bureau.self_statement' },
          { faction: 'fac.bureau', add: -8 },
          { faction: 'fac.loft', add: 6 },
          { npc: 'reyes', affinity: 8 },
          { stat: 'heat', add: 10 },
          { obligation: { id: 'pkg07_bureau_restitution', label: 'Restitution order (your own signed statement)', perDay: 12, days: 120 } },
          { chance: 0.4, then: [{ complication: 'legal' }] },
        ],
        next: 'on_record_after',
      },
      on_record_after: {
        speaker: 'marlow',
        text: '"You\'re a strange one," Marlow says at the curb, handing you the pie. "Most people would sell their mother to stay off paper. You climbed onto it to keep a friend off." He shakes his head. "It won\'t make you a hero. It\'ll make you a file. But I\'ll say this: it\'s a file I\'ll read." The restitution order arrives in the mail a week later, itemized to the cent, like a receipt for a conscience.',
      },
      call_bluff: {
        speaker: 'narrator',
        text: [
          'He isn\'t bluffing. He never bluffs; bluffing is for men who can\'t afford to lose. He makes the call right there by your car, pleasant and brief, to someone who writes things down.',
          {
            if: { flag: 'fac.bureau.outed_early' },
            text: 'The Row already knew you sat with a fed. Now it hears the word "signed" — cooperating witness, sworn, a file number read out loud over somebody\'s kitchen phone. The back room had been deciding what you were. By the end of the week it stops deciding.',
            else: 'He doesn\'t name a charge. He doesn\'t need one. By the end of the week the whole Row knows you\'ve been sitting in the booth by the jukebox with a federal agent, and the version that reaches the back room has you sitting there a lot longer than you did.',
          },
        ],
        effects: [
          { trait: 'pkg07_bureau_outed' },
          { flag: 'fac.bureau.outed' },
          { faction: 'fac.loft', add: -8 },
          { stat: 'cred', add: -3 },
          { chance: 0.3, then: [{ complication: 'social' }] },
        ],
        next: 'refuse',
      },
    },
  },

  // ── q4 — The Rot Upstairs ──────────────────────────────────────────────────
  {
    id: 'bureau_the_rot',
    channel: 'dialog',
    from: 'reyes',
    title: 'The Rot Upstairs',
    start: 'reveal',
    nodes: {
      reveal: {
        speaker: 'reyes',
        text: [
          'She meets you somewhere with no cameras, which for Reyes is a confession all by itself. She has a folder of her own now, and her hands aren\'t as steady as her voice.',
          '"I chased the money and it went in a circle and the circle went through my own building. Aperture hands us a map of every bad actor in this city, and Marlow won\'t let anyone set fire to the map — because the map is the whole reason we got the funding. My office is renting their tools. I put people in cages using a machine built by the people I came here to catch."',
          { if: { flag: 'fac.bureau.decoy' }, text: '"You\'ve been feeding him ghosts. I noticed. I let it ride. Figure that tells you which side of this I\'m already on."' },
          { if: { flag: 'fac.bureau.leashed' }, text: '"He\'s had you on a short leash — which means he had one hand busy the whole time he thought he was watching you with both."' },
          { if: { flag: 'fac.bureau.wired_loft' }, text: '"Your tape from the back room is on shelf nine, box four. I signed it out last week and listened to all of it. The donut argument. The landlord portal. The way everybody says \'night\' on the stairs." She doesn\'t look at you. "That\'s what the map is made of. Rooms like that one, taped by people like you, for men like him."' },
          { if: { flag: 'fac.bureau.outed' }, text: '"He turned the lights on you at the Cathode to teach you a lesson. That\'s what he does with assets who get creative. I\'ve started wondering what he does with agents."' },
          { if: { flag: 'fac.bureau.warned_the_tape' }, text: '"Somebody warned those two kids off the landlord portal before the knock. Marlow thinks it was me." A tired shrug. "I let him. It\'s the most useful thing anyone\'s suspected me of in years."' },
          { if: { flag: 'fac.bureau.reyes_covered' }, text: '"I lied to him for you once. In the diner. I told myself it was to protect an asset." A short, unhappy laugh. "It was practice."' },
          { if: { flag: 'fac.bureau.self_statement' }, text: '"You signed your own name so nobody else\'s went on the paper. I witnessed it. I\'ve been thinking about that signature for months. It\'s the only honest document in my whole case file."' },
          '"So. I can burn it down and go down with it. I can pretend I never opened the folder. Or you can do the thing you\'re good at and turn a bad situation into a profitable one. Tell me which of us I\'m talking to."',
        ],
        choices: [
          { text: 'Help her blow the whistle on the office.', tag: '[Whistle]', goto: 'whistle' },
          { text: 'Talk her back off the ledge.', tag: '[Handle]', goto: 'talk' },
          { text: 'Use it. Bury the rot and climb the tree.', tag: '[Exploit]', goto: 'exploit' },
        ],
      },
      whistle: {
        speaker: 'reyes',
        text: [
          'You help her document it: chain of custody, procurement records, the invoices that call a surveillance backbone a "risk-analytics subscription." She files it up, then over the chain of command she no longer trusts, then out.',
          'Marlow is named in the referral. He keeps the putter. He loses almost everything else. Reyes loses the badge she came here to be worthy of, and keeps the notebook, and says the trade was fair even though her voice cracks on the word.',
          '"On the record now. Both of us. No hiding after this." She almost smiles. "Feels like the first honest day I\'ve had since the drive up here."',
        ],
        effects: [
          { flag: 'npc.marlow.exposed' },
          { npc: 'marlow', fate: 'exposed' },
          { flag: 'npc.reyes.broke_whistle' },
          { npc: 'reyes', fate: 'broken' },
          { flag: 'npc.reyes.testifies' },
          { news: 'bureau_scandal' },
          { faction: 'fac.bureau', add: -20 },
          { faction: 'fac.hood', add: 8 },
          { var: 'w.public_opinion', add: 5 },
          { var: 'w.exposure', add: 1 },
          { flag: 'fac.bureau.q4_done' },
        ],
      },
      talk: {
        speaker: 'player',
        text: [
          '"You blow this now, alone, and you\'re a disgruntled agent with a folder. Marlow writes the press release before your car leaves the lot. Wait. Build it right. Stay useful until the day it can actually land."',
          'She hates it. She knows it\'s true. She puts the folder in a drawer with a lock you both pretend is enough. "Fine. Handler and asset. We keep our heads down and our hands dirty and we call it patience." She doesn\'t believe the last part. Neither do you.',
        ],
        effects: [
          { npc: 'reyes', fate: 'handler', affinity: 8 },
          { faction: 'fac.bureau', add: 5 },
          { flag: 'fac.bureau.q4_done' },
        ],
      },
      exploit: {
        speaker: 'narrator',
        text: [
          'You take the folder, and you take it the wrong way up the ladder — to Marlow, with a bow on it. "Your agent has a problem. I have a solution. It costs a promotion."',
          'Marlow reads you like a man reading his own good luck. The rot gets sealed under new carpet. Reyes gets a transfer request denied and a reputation for instability. Marlow gets headquarters, and the map goes with him, and you get a hand on a lever you\'ll pull for years.',
        ],
        effects: [
          { npc: 'marlow', fate: 'promoted' },
          { faction: 'fac.bureau', add: 15 },
          { flag: 'fac.bureau.exploited' },
          { var: 'w.enclosure', add: 1 },
          { flag: 'fac.bureau.q4_done' },
        ],
      },
    },
  },

  // ── q6 — Seize or Serve (Act IV finale of the arc) ─────────────────────────
  {
    id: 'bureau_seize_or_serve',
    channel: 'dialog',
    from: 'reyes',
    title: 'Seize or Serve',
    start: 'choice',
    nodes: {
      choice: {
        speaker: 'narrator',
        text: [
          'It\'s over, more or less, and now someone has to decide what "over" means. The machine that read a whole city is a pile of drives and contracts and a warrant with your fingerprints all over the paperwork.',
          { if: { flag: 'npc.marlow.exposed' }, text: 'Marlow is gone, so it\'s the acting SAC on the phone, quoting him like scripture: keep it, for safekeeping, for the state.' },
          { if: { not: { flag: 'npc.marlow.exposed' } }, text: 'Marlow wants it kept — "for safekeeping" — which is what a man says about a knife he intends to use.' },
          { if: { npc: 'reyes', fate: ['handler', 'broken', 'turned'] }, text: 'Reyes wants it destroyed in open court, on the record, where a judge can see every wire. "Seize it and we become them. Serve it and maybe we deserved the badge after all."' },
          { if: { npc: 'reyes', fateNot: ['handler', 'broken', 'turned'] }, text: 'There\'s no one left who\'ll argue for the court. That leaves it to you, which is either an honor or a trap, and at this point they\'re the same word.' },
        ],
        choices: [
          { text: 'Seize it. Keep the god-view for the state.', tag: '[Seize]', goto: 'seize' },
          { text: 'Serve it. Dismantle it under a judge.', tag: '[Serve]', goto: 'serve' },
        ],
      },
      seize: {
        speaker: 'narrator',
        text: [
          'The drives don\'t die. They move — into a locked room with a better lock, under a mandate written to sound like caution. The city is watched by nicer people now, which is the most dangerous kind.',
          'You told yourself the difference was who held the key. You\'re holding it. You still can\'t sleep with the light off.',
          { if: { flag: 'fac.bureau.wired_loft' }, text: 'Somewhere on those drives, filed under a number, is a tape of a back room above a pager shop: a donut argument, two kids and a landlord portal, somebody saying "night" on the stairs. It will be kept forever now. For safekeeping.' },
        ],
        effects: [
          { flag: 'fac.bureau.seized' },
          { if: { not: { flag: 'npc.marlow.exposed' } }, then: [{ npc: 'marlow', fate: 'promoted' }] },
          { faction: 'fac.bureau', add: 10 },
          { var: 'w.enclosure', add: 1 },
          { flag: 'fac.bureau.q6_done' },
        ],
      },
      serve: {
        speaker: 'narrator',
        text: [
          'You do it the slow, humiliating, public way: a courtroom, a chain of custody read aloud, a judge who makes everyone say what the machine actually did in words a jury can hold. The drives are wiped on the record, one at a time, by a clerk who doesn\'t know she\'s making history.',
          'It doesn\'t feel like winning. It feels like the first honest paperwork of your life, and Reyes — wherever she ended up — would sign it right under your name.',
          { if: { flag: 'fac.bureau.wired_loft' }, text: 'Shelf nine, box four goes too. The clerk wipes the tape from the back room without listening to it, and you watch the little counter run down to zero and don\'t breathe until it gets there. The collar still itches. It will always itch. But the tape is gone.' },
          { if: { flag: 'fac.bureau.self_statement' }, text: 'Your own signed statement is in the stack. The judge reads your name aloud, and then the clerk wipes that too, along with everything it was attached to. Whatever is left of the restitution order is vacated in the same breath. What you already paid stays paid. Some receipts you keep.' },
        ],
        effects: [
          { flag: 'fac.bureau.served' },
          { removeObligation: 'pkg07_bureau_restitution' },
          { if: { npc: 'reyes', fate: ['handler'] }, then: [{ npc: 'reyes', affinity: 10 }] },
          { faction: 'fac.hood', add: 10 },
          { var: 'w.public_opinion', add: 5 },
          { flag: 'fac.bureau.q6_done' },
        ],
      },
    },
  },
]

// ────────────────────────────────────────────────────────────────────────────
// Quests
// ────────────────────────────────────────────────────────────────────────────

const quests: QuestDef[] = [
  // q1 — journal mirror of the flip (CP-B5 B/C or the post-raid entry). No scenes, no effects.
  {
    id: 'fac_bureau_q1_approach',
    title: 'Cooperating Witness: The Approach',
    kind: 'faction',
    faction: 'fac.bureau',
    giver: 'reyes',
    priority: 20,
    rewards: 'A handler, a leash, and a road out of a cell',
    summary:
      'You took Agent Reyes\'s deal. On paper you\'re a witness. In the back room they\'d use a shorter word. Either way, there\'s a number you call now, and a number that calls you.',
    autoStart: { flag: 'fac.bureau.informant' },
    start: 'done',
    stages: {
      done: {
        text: 'You flipped. Reyes protects you as far as her badge reaches; past that, you\'re on your own with a wire and a conscience.',
        objectives: [
          {
            id: 'flipped',
            text: 'You became a Bureau informant',
            when: { flag: 'fac.bureau.informant' },
            hint: 'This chapter records a choice you already made — at the diner, at the hinge, or in a cell.',
          },
        ],
      },
    },
  },

  // q2 — First Delivery
  {
    id: 'fac_bureau_q2_first_delivery',
    title: 'Cooperating Witness: First Delivery',
    kind: 'faction',
    faction: 'fac.bureau',
    giver: 'reyes',
    priority: 20,
    rewards: 'Bureau standing — paid for in someone else\'s name',
    summary:
      'Reyes wants your first real delivery: a name off the board she can act on. You can give her a true one, a false one that survives a check, a target who has it coming, a night in the back room with a wire under your collar, or nothing at all — each with its own cost.',
    autoStart: {
      all: [{ quest: 'fac_bureau_q1_approach', status: 'completed' }, { faction: 'fac.bureau', gte: 20 }, { var: 'act', gte: 2 }],
    },
    start: 'meet',
    stages: {
      meet: {
        text: 'The booth by the jukebox, a folder she won\'t open, and a pen that weighs more than it should. Give her something, or tell her the well is dry — but decide who pays for it.',
        onEnter: [{ scene: 'bureau_first_delivery' }],
        objectives: [
          {
            id: 'deliver',
            text: 'Make your first delivery to the Bureau',
            when: { flag: 'fac.bureau.q2_done' },
            hint: 'Open the dialog from Reyes. A [Double] costs an Opsec DC 20 but sells no one — blow it and Marlow will want proof you\'re slow and not crooked, the kind of proof you wear under a collar. A [Hedge] gives up someone who has it coming.',
          },
        ],
      },
    },
  },

  // q3 — The Line You Won't Cross (the burn notice)
  {
    id: 'fac_bureau_q3_the_line',
    title: 'Cooperating Witness: The Line You Won\'t Cross',
    kind: 'faction',
    faction: 'fac.bureau',
    giver: 'reyes',
    priority: 25,
    rewards: 'A friend\'s freedom, or your own line',
    summary:
      'Marlow wants a name you\'d miss — that\'s the whole point. Hand over a friend, refuse and lose the deal, or feed them a decoy that fools a man who counts his teeth after you leave.',
    autoStart: {
      all: [
        { quest: 'fac_bureau_q2_first_delivery', status: 'completed' },
        { flag: 'fac.bureau.informant' },
        { var: 'act', gte: 2 },
        { faction: 'fac.bureau', gte: 30 },
        { any: [jaxBurnable, corvidBurnable] },
      ],
    },
    start: 'ultimatum',
    stages: {
      ultimatum: {
        text: 'The deal has a shape, Marlow says, and the shape is a friend. Whatever you do here, someone remembers it for a decade.',
        onEnter: [{ scene: 'bureau_burn_notice' }],
        objectives: [
          {
            id: 'answer',
            text: 'Answer the burn notice',
            when: { flag: 'fac.bureau.q3_done' },
            hint: 'You can hand over a friend, refuse (and jeopardize the deal), or run a [Social DC 17] decoy — if Marlow spots the ghost, he gives you five minutes to pick someone real, and "yourself" counts. Refusing an already-arrested Jax leaves him alone — and scared people make their own deals.',
          },
        ],
      },
    },
  },

  // q4 — The Rot Upstairs
  {
    id: 'fac_bureau_q4_rot',
    title: 'Cooperating Witness: The Rot Upstairs',
    kind: 'faction',
    faction: 'fac.bureau',
    giver: 'reyes',
    priority: 25,
    rewards: 'A whistle, a handler, or a lever',
    summary:
      'Reyes followed the money in a circle and it came back through her own building. Help her burn it down, talk her off the ledge, or take her folder the wrong way up the ladder.',
    autoStart: {
      all: [
        { any: [{ quest: 'fac_bureau_q3_the_line', status: 'completed' }, { quest: 'fac_bureau_q3_the_line', status: 'inactive' }] },
        { flag: 'fac.bureau.informant' },
        { var: 'act', gte: 3 },
      ],
    },
    start: 'offbook',
    stages: {
      offbook: {
        text: 'Reyes has gone off-book, somewhere with no cameras, holding a folder that names her own boss. Which version of her walks out of this room is up to you.',
        onEnter: [{ scene: 'bureau_the_rot' }],
        objectives: [
          {
            id: 'decide_rot',
            text: 'Decide what happens to the rot upstairs',
            when: { flag: 'fac.bureau.q4_done' },
            hint: 'Whistleblowing exposes Marlow and lets Reyes testify (it moves the MNSA vote). Exploiting it promotes Marlow and darkens the city.',
          },
        ],
      },
    },
  },

  // q5 — journal mirror of the Bureau sting (CP-C3 Bureau route). No scenes, no effects.
  {
    id: 'fac_bureau_q5_sting',
    title: 'Cooperating Witness: The Sting',
    kind: 'faction',
    faction: 'fac.bureau',
    giver: 'reyes',
    priority: 20,
    rewards: 'Mass arrests — some of them earned',
    summary:
      'Meridian was a Bureau operation, run your way with a badge behind it. You chose the targets. The city\'s biggest night belonged, for once, to the law — and the law is a blunt instrument.',
    autoStart: { all: [{ flag: 'a3.heist_resolved' }, { flag: 'a2.spine', eq: 'bureau' }] },
    start: 'done',
    stages: {
      done: {
        text: 'You ran Meridian as a sting. Whoever you protected walked; whoever you didn\'t, didn\'t. This chapter just remembers which was which.',
        objectives: [
          {
            id: 'stung',
            text: 'The Meridian sting is on the record',
            when: { flag: 'a3.heist_resolved' },
            hint: 'Resolved during the Act III climax on the Bureau route.',
          },
        ],
      },
    },
  },

  // q6 — Seize or Serve (fac_<X>_final for the Bureau)
  {
    id: 'fac_bureau_q6_seize_or_serve',
    title: 'Cooperating Witness: Seize or Serve',
    kind: 'faction',
    faction: 'fac.bureau',
    giver: 'reyes',
    priority: 30,
    rewards: 'The god-view — kept, or killed in open court',
    summary:
      'The surveillance machine is a pile of drives and a warrant now. Keep it for the state "for safekeeping," or serve it to a judge and watch it die on the record. This is how the Bureau road ends.',
    autoStart: {
      all: [
        { var: 'act', eq: 4 },
        { flag: 'fac.bureau.informant' },
        { any: [{ quest: 'fac_bureau_q5_sting', status: ['completed', 'failed'] }, { quest: 'fac_bureau_q5_sting', status: 'inactive' }] },
      ],
    },
    start: 'ending',
    stages: {
      ending: {
        text: 'Someone has to decide what "over" means. Seize the machine, or serve it to the court. Reyes, if she\'s still standing, is arguing for the court.',
        onEnter: [{ scene: 'bureau_seize_or_serve' }],
        objectives: [
          {
            id: 'seize_or_serve',
            text: 'Decide the fate of the surveillance machine',
            when: { flag: 'fac.bureau.q6_done' },
            hint: 'Seize keeps the god-view for the state (a darker Cooperating Witness ending). Serve dismantles it under a judge (the honest badge).',
          },
        ],
      },
    },
  },
]

// ────────────────────────────────────────────────────────────────────────────
// Triggers
// ────────────────────────────────────────────────────────────────────────────

const triggers: TriggerDef[] = [
  // The post-raid flip offer (bible §6.B, "arrest opens a branch"). Recurring, but self-limiting:
  // it stops once you flip or explicitly refuse, and an unanswered offer expires and can return.
  {
    id: 'trig_bureau_flip_offer',
    when: {
      all: [
        { flag: 'sys.raided' },
        { flag: 'a2.first_raid_resolved' },
        { var: 'act', gte: 2 },
        { not: { flag: 'fac.bureau.informant' } },
        { not: { flag: 'fac.bureau.flip_declined' } },
      ],
    },
    once: false,
    cooldownDays: 75,
    atHour: 9,
    effects: [{ scene: 'bureau_flip_offer' }],
  },
]

export default defineContent({ scenes, quests, triggers })
