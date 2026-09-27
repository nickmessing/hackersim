/**
 * PKG-03 — Act III main, beat 3: `main_a3_q3_priya_dilemma` (bible §6.C, CP-C1).
 *
 * Priya has the documentation that could end Halcyon's cover for Aperture — and end her, too.
 * Five roads, each with a real cost. This package sets the steering flags; PKG-04 finalizes
 * `npc.priya.fate` from them in Act IV. `item.priya_proof` is granted (A/D-success/E) or removed
 * (C, you sold it). `npc.vale.reformed` is set on the D "force Vale to clean house" success.
 *
 * Fail branch (REDESIGN_V2 §D): a failed D roll still sets `a3.kroll_hunts_priya` (Priya → broken)
 * and resolves the beat, but it also opens `side_a3_krolls_hunt`: a week later Priya pages you from
 * a searched apartment. Drive her out (money + a 90-day upkeep obligation, `a3.priya_fled`), try to
 * lift the folder first ([Opsec DC 17]: `item.priya_proof` back on success; the `pkg03_act3_krolls_file`
 * scar, Aperture −10 and a possible legal complication on failure), or leave her to Halcyon security
 * (`a3.priya_abandoned`). PKG-04's Priya letter and epilogue read all three.
 *
 * Cross-package ids referenced by exact bible id (owners in parentheses):
 *   items priya_proof / kroll_recording (PKG-00);
 *   news.halcyon_crash / news.halcyon_clean (PKG-16, which own the `w.halcyon_state` riders);
 *   flags a2.priya_backstory (PKG-02), a3.mnsa_live (this package q1).
 */
import { defineContent } from '@/engine/registry'

export default defineContent({
  quests: [
    {
      id: 'main_a3_q3_priya_dilemma',
      title: "Priya's Dilemma",
      kind: 'main',
      act: 3,
      priority: 30,
      giver: 'priya',
      summary:
        'Priya has kept the receipts since 1999 — the report they paid her to forget, and everything since. She is done keeping them. She wants to know what you are, before she decides what she is.',
      rewards: "A choice that shapes Priya's fate and Halcyon's",
      start: 'wait',
      stages: {
        wait: {
          text: 'Priya has been quiet since the Oracle went loud. Give her room; she is working up to something that scares her more than the scene ever did.',
          hint: 'A little time. Then Priya reaches out — meet her.',
          objectives: [
            { id: 'wait', text: 'Wait for Priya to call the meeting', when: { day: true, gte: 1430 }, hint: 'Keep living your life. She will page you when she is ready.' },
          ],
          onComplete: [{ scene: 'a3_priya' }],
          next: 'decide',
        },
        decide: {
          text: 'Priya laid it all on the Cathode table: the 1999 report, the purchase orders, a decade of tidy margin notes. Now she is watching your face to see which way you break.',
          hint: 'Every road costs something. Helping her whistleblow burns Halcyon; forcing Vale to reform needs a strong Business or Social roll; selling her out pays enormously and damns her.',
          objectives: [
            { id: 'chose', text: "Decide what to do with Priya's proof", when: { flag: 'a3.priya_resolved' }, hint: 'Follow the conversation to a choice. There is no clean option, only ones you can live with.' },
          ],
          onComplete: [{ quest: 'main_a3_q4_the_wire', start: true }],
        },
      },
    },
    // ── Fail branch of CP-C1 D: Vale called Kroll. Now she hunts. ──────────
    {
      id: 'side_a3_krolls_hunt',
      title: "Kroll's Hunt",
      kind: 'personal',
      act: 3,
      giver: 'priya',
      summary:
        'You read Marcus Vale wrong, and he made one phone call before your car was out of the lot. Vanessa Kroll knows Priya has receipts. She will not raise her voice. She will simply take everything, one quiet piece at a time, starting with Priya.',
      rewards: "Whatever you can salvage of Priya's week",
      start: 'hunted',
      stages: {
        hunted: {
          text: 'Kroll is moving on Priya — quietly, the way Special Accounts does everything. Priya will reach out when she notices. Decide what you are willing to spend on her when she does.',
          hint: 'Priya will page you within a few days. Get her out (costly, lasting), try to save the folder (a hard Opsec roll with real downside), or leave her to Halcyon security.',
          objectives: [
            {
              id: 'answered',
              text: 'Answer Priya when Kroll comes for her',
              when: { flag: 'a3.priya_hunt_resolved' },
              hint: 'Watch your BuddyPager. If you let her message sit unanswered, that is an answer too.',
            },
          ],
        },
      },
    },
  ],
  scenes: [
    {
      id: 'a3_priya',
      channel: 'dialog',
      title: 'Priya, at the Cathode',
      from: 'priya',
      start: 'open',
      nodes: {
        open: {
          speaker: 'priya',
          text: [
            'She has taken the back booth, the one with a view of both doors. There is a manila folder on the table and a coffee she hasn\'t touched.',
            '"I\'m going to show you something, and then you\'re going to help me decide whether I\'m brave or just tired." She slides the folder across.',
            { if: { flag: 'a2.priya_backstory' }, text: '"You already know the shape of it. \'99. The report. The silence they bought. Well — I kept a copy of everything I signed away. Turns out guilt is an excellent archivist."' },
          ],
          next: 'ask',
        },
        ask: {
          speaker: 'priya',
          text: [
            'You read enough to know it\'s real. Aperture money, threaded through Halcyon\'s books, page after page, initialed by people whose names are on the sides of buildings.',
            '"This ends it, if I put my name on it. It also ends me — my career, maybe more. So." She finally drinks the coffee, cold. "What do we do?"',
          ],
          choices: [
            {
              tag: '[Whistleblow]',
              text: 'Help her blow the whistle. All the way, on the record.',
              goto: 'whistle',
            },
            {
              tag: '[Protect her]',
              text: '"Burn the copy. Stay quiet. Stay alive." Talk her down.',
              goto: 'silence',
            },
            {
              tag: '[Business DC 18]',
              text: 'Force Vale to clean house himself — make it his idea, his win.',
              check: {
                skill: 'business',
                dc: 18,
                bonuses: [{ if: { faction: 'fac.halcyon', gte: 50 }, add: 2, label: '+2 (you have Vale\'s ear)' }],
                success: 'vale_win',
                fail: 'vale_fail',
              },
            },
            {
              tag: '[Social DC 18]',
              text: 'Corner Vale privately; convince him reform is the only exit that keeps him rich.',
              check: {
                skill: 'social',
                dc: 18,
                bonuses: [{ if: { faction: 'fac.halcyon', gte: 50 }, add: 2, label: '+2 (you have Vale\'s ear)' }],
                success: 'vale_win',
                fail: 'vale_fail',
              },
            },
            {
              tag: '[Sell it]',
              text: 'Take the folder to Kroll. She will pay a fortune to make it vanish.',
              goto: 'sell',
            },
            {
              tag: '[Take the fall]',
              text: '"Give it to me. If this blows up, it was me, not you." Take the fall so her name stays clean.',
              if: { flag: 'a3.mnsa_live' },
              goto: 'cover',
            },
          ],
        },
        whistle: {
          speaker: 'narrator',
          text: [
            'You spend three nights helping her build it into something a reporter can\'t ignore and a lawyer can\'t bury: sourced, sequenced, undeniable.',
            'Halcyon\'s stock will not survive the morning it drops. Neither, quite, will the version of Priya who used to keep the mug on her desk. She looks lighter than you have ever seen her.',
            '"Rule two," she says. "I was a person who bought a machine. Not anymore."',
          ],
          effects: [
            { flag: 'a3.whistleblow_prepped' },
            { item: 'priya_proof' },
            { npc: 'priya', affinity: 12 },
            { faction: 'fac.halcyon', add: -40 },
            { faction: 'fac.bureau', add: 15 },
            { var: 'w.exposure', add: 2 },
            { news: 'halcyon_crash' },
            { flag: 'a3.priya_resolved' },
          ],
        },
        silence: {
          speaker: 'priya',
          text: [
            'You lay it out gently: the odds, the reach of the people in that folder, the specific way they make problems disappear. She listens, and something in her goes quiet and stays quiet.',
            '"Okay," she says, and slides the folder into her bag. "Okay. You\'re right. You\'re probably right." She pays for both coffees and leaves before you do.',
            'She becomes, a little, the thing she hated. She is very good at her job. She stops keeping the mug on her desk.',
          ],
          effects: [
            { flag: 'npc.priya.silenced' },
            { faction: 'fac.halcyon', add: 10 },
            { npc: 'priya', affinity: -3 },
            { flag: 'a3.priya_resolved' },
          ],
        },
        vale_win: {
          speaker: 'vale',
          text: [
            'You get to Vale before Priya\'s name is ever on anything. You make cutting Aperture loose sound like his boldest move yet — the founder who saw the rot and had the nerve to burn it out.',
            'He buys it because he needs to be the hero of the story more than he needs the money. Halcyon gets smaller. Priya keeps her name. You keep the proof, just in case heroes forget their lines.',
            '"Family," he says, gripping your hand too long. "This is what family does."',
          ],
          effects: [
            { flag: 'npc.vale.reformed' },
            { item: 'priya_proof' },
            { faction: 'fac.halcyon', add: 20 },
            { npc: 'priya', affinity: 8 },
            { news: 'halcyon_clean' },
            { flag: 'a3.priya_resolved' },
          ],
        },
        vale_fail: {
          speaker: 'narrator',
          text: [
            'You misjudge him. Vale nods along, walks you out warmly — and calls Kroll before your car is out of the lot. Reform was never on the menu; he just wanted to know who was asking.',
            'By the weekend Kroll knows Priya has receipts. She does not raise her voice. She never does. She simply starts, very quietly, to hunt.',
          ],
          effects: [
            { flag: 'a3.kroll_hunts_priya' },
            { npc: 'priya', affinity: -4 },
            { stat: 'heat', add: 10 },
            { flag: 'a3.priya_resolved' },
            // The fail is its own story: Kroll's hunt plays out over the next week.
            { quest: 'side_a3_krolls_hunt', start: true },
            { scene: 'a3_priya_hunted', delayHours: 72 },
          ],
        },
        sell: {
          speaker: 'kroll',
          text: [
            'You call the number you were told never to write down. Kroll answers on the first ring, warm as ever, and names a figure before you finish the sentence. It is more money than your parents made in their lives, combined.',
            'The folder changes hands in a parking structure. Kroll thanks you by your mother\'s name. Somewhere across town, Priya reaches for a copy that is no longer where she left it, and understands.',
          ],
          effects: [
            { money: 90000 },
            { faction: 'fac.aperture', add: 30 },
            { item: 'priya_proof', remove: true },
            { flag: 'a3.kroll_hunts_priya' },
            { npc: 'priya', affinity: -40 },
            { var: 'w.enclosure', add: 1 },
            { flag: 'a3.priya_resolved' },
          ],
        },
        cover: {
          speaker: 'priya',
          text: [
            'You take the folder and make it yours: your fingerprints on every copy, your name in every log, your heat, your risk. If it ever surfaces the wrong way, it was you, alone, a lone crank with a grudge.',
            'Priya doesn\'t argue, which is how you know she\'s been thinking about letting you. "You shouldn\'t," she says, and takes your hand across the table, and doesn\'t let go for a while. "I\'m not going to forgive you for this."',
            '"I know," you say. That is how you know she means the opposite.',
          ],
          effects: [
            { flag: 'npc.priya.you_covered' },
            { item: 'priya_proof' },
            { npc: 'priya', affinity: 10 },
            { stat: 'heat', add: 18 },
            { flag: 'a3.priya_resolved' },
          ],
        },
      },
    },
    {
      id: 'a3_priya_hunted',
      channel: 'chat',
      title: 'root_cause',
      from: 'priya',
      pause: true,
      expiresDays: 14,
      onExpire: [
        { flag: 'a3.priya_abandoned' },
        { npc: 'priya', affinity: -8 },
        { flag: 'a3.priya_hunt_resolved' },
        { notify: 'Priya stopped paging. A week later her Halcyon badge stopped working. A month later her phone did.', kind: 'bad' },
      ],
      start: 'open',
      nodes: {
        open: {
          speaker: 'priya',
          text: [
            'someone was in my apartment.',
            'nothing taken. the copy of the folder moved two inches. the mug on the counter was turned so the handle faces the door.',
            'that last part is a message. i know the people who teach that one.',
            'i am not panicking. i would like it noted that i am not panicking. what do i do.',
          ],
          choices: [
            {
              tag: '[Get her out · $1,200 + upkeep]',
              text: '"pack one bag. no laptop. i\'m driving you out of the city tonight."',
              effects: [
                { money: -1200 },
                { obligation: { id: 'pkg03_act3_priya_hideout', label: "Priya's room upstate (cash, no questions)", perDay: 25, days: 90 } },
                { flag: 'a3.priya_fled' },
                { npc: 'priya', affinity: 8 },
                { stat: 'stress', add: 4 },
              ],
              goto: 'drive',
            },
            {
              tag: '[Opsec DC 17]',
              text: '"don\'t touch anything. i\'m coming to get the folder out before they come back for it."',
              check: {
                skill: 'opsec',
                dc: 17,
                bonuses: [{ if: { trait: 'paranoid' }, add: 1, label: '+1 (you already assume the building is watched)' }],
                success: 'folder_saved',
                fail: 'folder_lost',
                successEffects: [
                  { item: 'priya_proof' },
                  { flag: 'a3.priya_folder_saved' },
                  { npc: 'priya', affinity: 4 },
                  { stat: 'heat', add: 6 },
                ],
                failEffects: [
                  { flag: 'a3.priya_folder_lost' },
                  { trait: 'pkg03_act3_krolls_file' },
                  { faction: 'fac.aperture', add: -10 },
                  { stat: 'heat', add: 12 },
                  { npc: 'priya', affinity: -2 },
                  { chance: 0.3, then: [{ complication: 'legal' }] },
                ],
              },
            },
            {
              tag: '[Stay out of it]',
              text: '"call halcyon security. file a report. they owe you that much."',
              effects: [{ flag: 'a3.priya_abandoned' }, { npc: 'priya', affinity: -10 }],
              goto: 'alone',
            },
          ],
        },
        drive: {
          speaker: 'narrator',
          text: [
            'You pick her up at 2 a.m. at the corner, not the door. One bag, as ordered, and the WORLD\'S OKAYEST ENGINEER mug wrapped in a sweater, which was not.',
            'At a rest stop off the county road she takes the folder out of the bag, looks at it for a long time, and feeds it page by page into the trash-can fire someone left burning. "If they want it they can have the ashes," she says. "Rule two. I bought a machine. I\'m done being one."',
            'You pay three months up front on a room over a bait shop with a view of a parking lot. The money goes out of your account every week after that, quiet as a pulse. She never once asks you to stop.',
          ],
          effects: [{ flag: 'a3.priya_hunt_resolved' }],
        },
        folder_saved: {
          speaker: 'narrator',
          text: [
            'You go in the back way, in a delivery jacket that fits nobody, and do everything Deadline ever told you about a building you think is watched: no lights, no hurry, no straight lines.',
            'The folder is where she said. You are back on the street in four minutes, and there is a car at the curb that was not there when you went in, engine off, nobody visible inside. You do not look at it. It does not follow you. That is somehow worse.',
            'Priya reads your page — "got it. don\'t go home tonight." — and doesn\'t. She leaves the city a month later anyway. The folder stays with you, in a place nobody would think to look.',
          ],
          effects: [{ flag: 'a3.priya_hunt_resolved' }],
        },
        folder_lost: {
          speaker: 'narrator',
          text: [
            'They are already there. Not in the apartment — in the hallway, a pleasant man with a clipboard and a lanyard from a building-management company that does not exist, holding the door for you like a concierge.',
            'You turn around without a word. On the stairs a camera flashes once, politely, like at a wedding. When Priya gets home the folder is gone and a Halcyon-branded fruit basket is on her kitchen table, with a card: THANK YOU FOR YOUR YEARS OF SERVICE.',
            'Somewhere in Millgate a file with your name on it gets a new photograph. It is a good one. You look scared.',
          ],
          effects: [{ flag: 'a3.priya_hunt_resolved' }],
        },
        alone: {
          speaker: 'priya',
          text: [
            'ok.',
            'that\'s a real answer. i asked a real question and you gave me a real answer. i\'m not being sarcastic. i\'m writing it down.',
            '(She files the report. Halcyon security forwards it to the founder\'s office. The founder\'s office forwards it to a number in Millgate. A month later her badge stops working, and a week after that, her phone does.)',
          ],
          effects: [{ flag: 'a3.priya_hunt_resolved' }],
        },
      },
    },
  ],
})
