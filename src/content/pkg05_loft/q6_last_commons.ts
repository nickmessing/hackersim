/**
 * PKG-05 — fac_loft_q6_last_commons, "The Last Commons" (bible §7.1 step 6; the Loft's
 * `fac_<X>_final`, sequenced by main_a4_q2's `finales` stage, PKG-04).
 *
 * Act IV. Rebuild the scene clean, or hold its funeral → `w.scene_state ∈ {reformed, dark}`. This
 * runs AFTER main_a4_q1's fate finalization, so the rebuild path re-sets Corvid to `vindicated`
 * itself (guarded to survivors) — PKG-05 is her sole in-play writer. Feeds E5 "Keeper of the
 * Commons" (needs `fac.loft.sysop='player'`, `fac.loft.intact`, `w.scene_state='reformed'`,
 * Corvid `succeeded`/`vindicated`).
 */
import { defineContent } from '@/engine/registry'
import type { Cond, Effect, SceneDef, SkillCheck } from '@/engine/types'
import { LOFT, SAFEHOUSE_BUFF, boardGoesDark, boardLive, lostToAperture } from './common'

/** Corvid can be lifted to `vindicated` only if she survived free (not in prison, gone or bought). */
const corvidSurvivedFree: Cond = { npc: 'corvid', fate: ['normal', 'free', 'succeeded', 'vindicated'] }

const rebuildEffects: Effect[] = [
  { flag: 'w.scene_state', set: 'reformed' },
  { faction: LOFT, add: 8 },
  { if: corvidSurvivedFree, then: [{ npc: 'corvid', fate: 'vindicated', affinity: 5 }] },
  // The board that bled comes home: a rebuilt commons is whole again (E5 reads `fac.loft.intact`).
  { flag: 'fac.loft.intact' },
  // A sold-out Switch loses the board he sold; a new_sysop Switch is still the one in the chair.
  { if: { npc: 'switch', fate: 'sellout' }, then: [{ npc: 'switch', fate: 'casualty' }] },
  { buff: SAFEHOUSE_BUFF },
  { flag: 'fac.loft.rebuilt' },
  { flag: 'fac.loft.q6_done' },
]

/** A rough rebuild: the same outcome, paid for in heat, sleep and a few old friends. */
const scarredEffects: Effect[] = [
  ...rebuildEffects,
  { flag: 'fac.loft.rebuilt_scarred' },
  { faction: LOFT, add: -4 },
  { stat: 'heat', add: 8 },
  { stat: 'stress', add: 10 },
]

/**
 * Each way of rebuilding fails its own way (REDESIGN_V2 §D): the board still comes back — E5 must
 * stay reachable — but the failure leaves a different, permanent mark.
 */
const sockPuppetEffects: Effect[] = [...scarredEffects, { trait: 'pkg05_loft_sleepless_sysop' }]
const leakyEffects: Effect[] = [
  ...scarredEffects,
  { flag: 'fac.loft.rebuilt_leaky' },
  { var: 'w.enclosure', add: 1 },
  { chance: 0.5, then: [{ complication: 'social' }] },
]
const vouchedEffects: Effect[] = [
  ...scarredEffects,
  { flag: 'fac.loft.rebuilt_vouched' },
  { trait: 'pkg05_loft_vouched_a_fed' },
  { stat: 'heat', add: 6 },
  { chance: 0.5, then: [{ complication: 'legal' }] },
]

const rebuildBonuses: NonNullable<SkillCheck['bonuses']> = [
  { if: { flag: 'side.corvid_archive' }, add: 2, label: '+2 (Corvid\'s archive: the scene\'s own blueprints)' },
  { if: { flag: 'fac.loft.sysop', eq: 'player' }, add: 1, label: '+1 (you hold the keys)' },
  { if: { flag: 'fac.loft.bleeding' }, add: -2, label: '−2 (the board bled; trust is thin)' },
  { if: { npc: 'switch', fate: 'sellout' }, add: -1, label: '−1 (the blueprints were already sold once)' },
  { if: { flag: 'fac.loft.sysop_contested' }, add: -1, label: '−1 (a third of the board never believed you earned the keys)' },
  { if: { flag: 'fac.bureau.outed' }, add: -2, label: '−2 (the board knows about the booth by the jukebox)' },
]

const scenes: SceneDef[] = [
  {
    id: 'loft_q6_last_commons',
    channel: 'dialog',
    title: 'The Last Commons',
    from: 'corvid',
    start: 'open',
    nodes: {
      open: {
        speaker: 'narrator',
        text: [
          'It is the year everything else finished, and the board is the last loose thread you\'re holding. Ten years of it. A back room, a couch, a fax number taped inside a door.',
          { if: { flag: 'fac.loft.sysop', eq: 'player' }, text: 'You\'re the sysop. The keys are yours. Whatever the Loft becomes now, it becomes because you decided it, at a keyboard, at night, the way everything here was ever decided.' },
          { if: { flag: 'fac.loft.sysop', eq: 'mira' }, text: 'Mira holds the board now, small and clean and careful. She pages you: "It\'s your scene too. Come help me decide what it is."' },
          { if: { flag: 'fac.loft.sysop', eq: 'deadline' }, text: 'Deadline holds the board now, boring everyone into caution from the worst chair in the room. He pages you, in all caps: "COME DECIDE THIS WITH ME. BRING SNACKS."' },
          { if: { flag: 'fac.loft.sysop', eq: 'switch' }, text: 'Switch holds the board now, and runs it like the best-run business on the Row. He pages you: "Even I don\'t want to be the guy who decides this alone. Get down here."' },
          { if: { npc: 'corvid', fate: 'martyred' }, text: 'Corvid decides these things from a payphone now, eight minutes at a time, collect. She still knows everything. She just knows it slower.' },
          { if: { npc: 'corvid', fate: ['free', 'succeeded', 'vindicated'] }, text: 'Corvid is out of the chair and into a garden, and she checks the board every morning and pretends she doesn\'t.' },
          { if: { npc: 'corvid', fate: 'exile' }, text: 'Corvid has been gone since the lights first went out: a postcard a year, never the same city, never a return address.' },
          { if: { npc: 'corvid', fate: 'bought' }, text: 'Corvid works in Millgate now, in a good coat, for people who used to be the enemy. Nobody on the board says her name. Everyone thinks it.' },
          { if: { flag: 'side.corvid_archive' }, text: 'You still have her dead-man\'s archive — twenty years of the scene, sealed, guarded, never read. Whatever you build, you can build it on real ground.' },
        ],
        next: 'choice',
      },
      choice: {
        speaker: 'narrator',
        text: [
          { if: boardLive, text: 'So: the last decision. Rebuild it clean — smaller, careful, honest, a commons that learned — or turn out the light for good and let it be a thing that was.' },
          { if: { flag: 'w.scene_state', eq: 'dark' }, text: 'There is nothing left to rebuild. The board went dark a long time ago. All that\'s left is to decide how to say goodbye to it.' },
        ],
        choices: [
          {
            tag: '[Rebuild]',
            text: 'Bring back the commons. Smaller. Careful. Clean. The scene that learned what it cost and kept the couch anyway.',
            if: boardLive,
            goto: 'rebuild_how',
          },
          {
            tag: '[Rebuild — paid]',
            text: 'The co-op grows up: a real shop, real invoices, and not one real name ever sold.',
            if: { all: [boardLive, { any: [{ flag: 'fac.loft.side_switch' }, { flag: 'fac.loft.coop' }] }] },
            effects: [{ flag: 'fac.loft.broker_reform' }],
            goto: 'rebuild_how',
          },
          {
            tag: '[Funeral]',
            text: 'Wipe it to bare metal one last time, the way Corvid always said to, and let it rest.',
            if: boardLive,
            effects: [{ flag: 'fac.loft.funeral' }, ...boardGoesDark, { flag: 'fac.loft.q6_done' }],
            goto: 'funeral',
          },
          {
            tag: '[Goodbye]',
            text: 'Sit with the dark board one last night. Let it be a thing that was.',
            if: { flag: 'w.scene_state', eq: 'dark' },
            effects: [{ flag: 'fac.loft.q6_done' }],
            goto: 'wake',
          },
        ],
      },

      // ── How you rebuild it (the check decides the scars, not the outcome) ──
      rebuild_how: {
        speaker: 'narrator',
        text: [
          'A scene is not a server. You can buy a server. The question is how you get forty wary people to trust a login prompt again after everything this city has done to them.',
          { if: { npc: 'switch', fate: 'sellout' }, text: 'And first you have to take it back. Half the old member list is sitting in an Aperture filing cabinet with Switch\'s rate card stapled to the front. Whatever you build, you build it knowing someone already sold the blueprints once.' },
        ],
        choices: [
          {
            tag: '[Systems DC 18]',
            text: 'Build it so it can\'t be sold: no member list at all, anywhere, not even for the sysop. Nothing to steal means nothing to buy.',
            check: {
              skill: 'systems',
              dc: 18,
              bonuses: rebuildBonuses,
              success: 'rebuilt',
              fail: 'rebuilt_scarred',
              successEffects: rebuildEffects,
              failEffects: sockPuppetEffects,
            },
          },
          {
            tag: '[Social DC 18]',
            text: 'Call every old handle home yourself, one by one, the way the phone tree worked the night of the wipe.',
            check: {
              skill: 'social',
              dc: 18,
              bonuses: [
                ...rebuildBonuses,
                { if: { flag: 'a2.solidarity' }, add: 2, label: '+2 (they remember the night of the wipe)' },
                { if: { var: 'fac.loft.enclosure_lost', gte: 2 }, add: -1, label: '−1 (some of those numbers ring at Aperture now)' },
              ],
              success: 'rebuilt',
              fail: 'rebuilt_leaky',
              successEffects: rebuildEffects,
              failEffects: leakyEffects,
            },
          },
          {
            tag: '[OpSec DC 18]',
            text: 'Invite-only, vouch chains three deep, the fax number retired at last. Paranoid by design, and proud of it.',
            check: {
              skill: 'opsec',
              dc: 18,
              bonuses: [...rebuildBonuses, { if: { trait: 'paranoid' }, add: 2, label: '+2 (paranoid, finally useful)' }],
              success: 'rebuilt',
              fail: 'rebuilt_vouched',
              successEffects: rebuildEffects,
              failEffects: vouchedEffects,
            },
          },
          {
            tag: '[Inner]',
            text: 'Don\'t rebuild it for them. Rebuild it with them — the whole scene, one weekend, every hand on it.',
            if: { faction: LOFT, gte: 80 },
            effects: rebuildEffects,
            goto: 'rebuilt',
          },
          {
            tag: '[Inner]',
            text: 'Rebuild it with the whole scene behind you.',
            if: { faction: LOFT, lte: 79 },
            req: { faction: LOFT, gte: 80 },
            reqText: 'Requires Loft rep 80 (Inner)',
          },
        ],
      },
      rebuilt_scarred: {
        speaker: 'narrator',
        text: [
          'It comes back. It just comes back bloody. The first week, a polite new member with perfect punctuation and no history turns out to be a sock puppet with a corporate expense account, and it takes you four sleepless nights to find every door he opened.',
          'You close them all. The board survives. Some of the old handles look at the incident report, say "same as it ever was," and never log on again. The couch has more room than you wanted.',
          'But it\'s lit. Against the odds, against this whole decade, it\'s lit.',
        ],
        next: 'rebuilt',
      },
      rebuilt_leaky: {
        speaker: 'narrator',
        text: [
          'You work the old phone tree yourself, forty numbers, one a night, the way it ran the night of the wipe. Most of them are disconnected. Some of them hang up. One of them is answered on the second ring by a very pleasant voice that says "Aperture, Community Insight, how can I direct your call?"',
          {
            if: { flag: 'fac.loft.dawn_drifted' },
            text: 'It was DialUpDawn\'s old number. They gave her desk the line she brought with her. You hang up too late: you have already said "the commons is coming back" and the date and the word "invite."',
            else: 'Somebody\'s old number, reassigned to a Millgate desk. You hang up too late: you have already said "the commons is coming back" and the date and the word "invite."',
          },
          'The board relaunches on schedule. For its first month it has a reader nobody invited, and every thread you post, Aperture reads by lunch. You tighten it. You tighten it again. It holds — but you built the new commons with a window in it, and you know exactly where.',
        ],
        next: 'rebuilt',
      },
      rebuilt_vouched: {
        speaker: 'narrator',
        text: [
          'Invite-only, vouch chains three deep, the fax number retired. You vouch for the first link yourself: someone you\'ve known for years. They vouch for someone they trust. That someone vouches for a quiet, helpful newcomer in a very nice leather jacket.',
          'It takes you two weeks to notice that the newcomer\'s questions are all about who used to run the board, and one afternoon at the Cathode to watch him get into a car with government plates. You pull the whole chain, link by link, while every member watches you do it. The first link is you. It will always be you.',
          'The board survives the purge. The rule you pin afterward survives longer: nobody vouches for anybody in their first year. Nobody argues. Everyone knows who the rule is about.',
        ],
        next: 'rebuilt',
      },
      rebuilt: {
        speaker: 'narrator',
        text: [
          {
            if: { flag: 'fac.loft.broker_reform' },
            text: 'You bring it back as the thing Switch always swore it could be: a real shop with a real ledger, jobs split fair, and a hard wall between the work you sell and the names you never will. It pays rent. It pays people. Some nights you can\'t quite tell if you saved the commons or just gave it a business license — but nobody\'s name has ever left this room, and that has to count.',
            else: 'You bring it back the hard way — invitation only, a rule nobody can buy their way past, the fax number retired at last. The couch is structural, so the couch stays.',
          },
          'The first night the board is live again, forty people log on within an hour, half of them handles you thought were gone for good. Somebody posts ASCII art of a phoenix that is, on close inspection, clearly the couch.',
          { if: { flag: 'fac.loft.bleeding' }, text: 'The handles that drifted to Aperture start drifting back, one sheepish login at a time. At 2 a.m. one of them posts nothing but a single line: "the crypto over there really was boring." The board that bled is whole again — not the same, but whole.' },
          { if: { flag: 'fac.loft.sysop', eq: 'player' }, text: 'You run it. Smaller, careful, clean — cleaner than it ever was when it was big. It will never make anyone rich. It was never supposed to.' },
          { if: { npc: 'corvid', fate: 'martyred' }, text: 'You mail the first screenshot to a prison in careful block capitals. The reply, three weeks later, is two lines: "Good. Don\'t sell the building. — C."' },
          { if: { flag: 'fac.loft.gus_came_back' }, text: 'GreyHat_Gus is the third login of the night. He doesn\'t post. He just changes his signature to a crayon drawing of a parking garage with a big red X through it, and leaves it there.' },
          { if: { all: [{ flag: 'fac.loft.gus_drifted' }, { not: { flag: 'fac.loft.gus_came_back' } }] }, text: 'GreyHat_Gus never logs in. You hear he runs a team at Aperture now. You hear he\'s good at it. You hear he doesn\'t talk about the Row, which you choose to take as a kind of respect.' },
          {
            if: { all: [{ flag: 'fac.loft.marisol_drifted' }, { not: { flag: 'fac.loft.marisol_helped' } }, { not: { flag: 'fac.loft.marisol_filed' } }] },
            text: 'At 3 a.m. Modem_Marisol\'s handle appears on the who\'s-online list. She doesn\'t post. She logs in every night for a week, reads everything, and logs out, the way you visit a house you grew up in and can\'t buy back.',
          },
          { if: { flag: 'fac.loft.marisol_helped' }, text: 'At 3:12 a.m. Modem_Marisol posts for the first time in years. Two words: "closed as duplicate." Nobody else on the board understands it. Somewhere across the city a nurse drives home the short way, and you understand it completely.' },
          { if: { flag: 'fac.loft.marisol_filed' }, text: 'Modem_Marisol never logs in. You get one message, unsigned, from a Millgate helpdesk address, the night the board relaunches: "i\'m glad it\'s back. i\'m sorry about the ticket. i\'m still so tired." You don\'t reply. You don\'t delete it either.' },
          { if: { flag: 'fac.loft.dawn_stung' }, text: 'At 4 a.m. a new member applies with a key fingerprint instead of a handle. You know the fingerprint. The application says only: "told you it wasn\'t boring. still mad. let me in anyway." You let her in. She spends the first week quietly fixing your crypto and leaving comments in the margins that are, you have to admit, correct.' },
          { if: { flag: 'fac.loft.switch_turned_away' }, text: 'Somewhere in Ridgeport a man who can add reads the relaunch post twice and doesn\'t register. You know because the board counts views, and one of them is from a shop in Ridgeport, every day, for a month.' },
          { if: { flag: 'fac.loft.rebuilt_vouched' }, text: 'The pinned rule sits at the top of the board forever: nobody vouches for anybody in their first year. It is the most honest scar a commons has ever worn.' },
          { if: { all: [lostToAperture, { not: { flag: 'fac.loft.bleeding' } }] }, text: 'Not everyone you lost the night of the Enclosure comes home. Some of them are good at their new jobs. That is the part nobody warns you about.' },
        ],
        next: 'close_reformed',
      },
      close_reformed: {
        speaker: 'corvid',
        text: [
          { if: { npc: 'corvid', fate: ['free', 'succeeded', 'vindicated'] }, text: '"Well." Corvid, at your shoulder, in the garden dirt on her hands. "Twenty years I said keep the commons. Turns out I meant: keep it until someone better shows up to keep it." She bumps you with her shoulder. "That\'s you, apparently. Try not to let it go to your head. The head is where they get you."' },
          { if: { npc: 'corvid', fate: 'martyred' }, text: '"Don\'t sell the building." It\'s the only line you ever really needed from her, and you didn\'t. The board she went to prison for is lit up in the dark, and you kept the lights on. It\'s the most you could do. It might be enough.' },
        ],
      },

      funeral: {
        speaker: 'narrator',
        text: [
          'You do it the way she always said to: bare metal, no ceremony, the honest way a scene ends. One by one the old handles get a final message — "commons closed, keep your prints clean, love the mgmt" — and then there\'s nothing on the wire but the hum of a machine nobody will visit again.',
          { if: { flag: 'side.corvid_archive' }, text: 'You keep the archive sealed. Somewhere there is a record of everything the Loft ever was, and it opens for no one, which is the most commons a commons ever gets: a thing held in trust, forever, for people who aren\'t coming.' },
          { if: { not: { flag: 'side.corvid_archive' } }, text: 'There\'s no archive. When the last drive spins down, the twenty years just... aren\'t, anywhere, anymore. That\'s the honest version. She\'d have wanted the honest version.' },
        ],
        next: 'close_dark',
      },
      wake: {
        speaker: 'narrator',
        text: [
          'You sit with the dark board one last night. No lights, no login, just the shape of it in your memory: the couch, the donuts, the fax number, the night forty drives went to bare metal and nobody said a word.',
          'You leave the electric bill unpaid at last. Somewhere, a machine nobody can visit goes quiet, and the Loft is finally, entirely, a thing that was.',
        ],
        next: 'close_dark',
      },
      close_dark: {
        speaker: 'narrator',
        text: [
          { if: { all: [{ npc: 'corvid', fate: 'exile' }, { not: { flag: 'fac.loft.funeral' } }] }, text: 'Corvid went with it, back when the lights first went out. There is a postcard every year, never the same city, never a return address, always the same line: "Better dark than sold." She has the only key to the only copy. She is, in the strictest possible sense, the last of the commons.' },
          { if: { all: [{ npc: 'corvid', fate: 'exile' }, { flag: 'fac.loft.funeral' }] }, text: 'Corvid goes with it. A week later the garden is for rent and her pager number rings out, and a postcard arrives with no return address and one line on the back: "Better dark than sold." Somewhere she has the only key to the only copy, and she is, in the strictest possible sense, the last of the commons.' },
          { if: { npc: 'corvid', fate: 'martyred' }, text: 'You\'ll write to her that it\'s gone. You already know what she\'ll write back: "Good. Better dark than sold." She meant it in \'94 and she\'ll mean it now, from a room with a door that locks from the outside.' },
          { if: { npc: 'corvid', fate: 'succeeded' }, text: 'Corvid takes it better than you do. "It had a good run," she says, planting something. "Longer than most people\'s marriages. Don\'t mourn a scene, kid. Be one, somewhere else, quietly." You think you might.' },
          { if: { npc: 'corvid', fate: 'bought' }, text: 'Corvid doesn\'t come. Nobody expected her to. Somewhere in Millgate there is a woman in a good coat who used to be the conscience of this room, and tonight, maybe, she feels the board go dark like a tooth coming out.' },
        ],
      },
    },
  },
]

export default defineContent({
  scenes,
  quests: [
    {
      id: 'fac_loft_q6_last_commons',
      title: 'The Last Commons',
      kind: 'faction',
      faction: 'fac.loft',
      giver: 'corvid',
      act: 4,
      summary: 'One last decision about the Loft: bring it back clean and small, or hold its funeral and let it rest. Whatever you choose, it\'s the shape the scene keeps forever.',
      rewards: 'The scene\'s final state; feeds your ending',
      priority: 25,
      autoStart: { all: [{ var: 'act', eq: 4 }, { quest: 'fac_loft_q5_sysop', status: ['completed', 'failed'] }] },
      start: 'decide',
      stages: {
        decide: {
          text: 'The board is the last thread you\'re holding. Ten years of it come down to one choice: rebuild the commons clean, or turn out the light for good.',
          onEnter: [{ scene: 'loft_q6_last_commons', delayHours: 12 }],
          objectives: [
            {
              id: 'decide',
              text: 'Decide what the Loft becomes',
              when: { flag: 'fac.loft.q6_done' },
              hint: 'A dialog arrives. If the board still lives, you can rebuild it clean (reformed) or hold its funeral (dark). How you rebuild decides what it costs you if it goes wrong. If it already went dark, all that\'s left is to say goodbye.',
            },
          ],
        },
      },
    },
  ],
})
