/**
 * PKG-04 — `main_a4_q3b_the_exchange` (bible §6.D): the finale operation, a 3–4 stage set piece
 * through `place.exchange`, the old Cannery-Millgate copper exchange where the city's past and its
 * surveillance share a wire.
 *
 *   approach → breach → act → escape
 *
 * The "act" stage carries the finale GRAND CHECK: an engine-native `SkillCheck` (Intrusion, or Opsec
 * at +2 DC for builds that never learned to kick doors) whose visible situational `bonuses` are the
 * surviving allies, friendly factions, kept tools, and the old mistakes that follow you in: the
 * bible's computed pool, realized as mod + bonuses (§0.2, no averaging). A publish that lands with
 * proof publishes `aperture_destroyed` (the NewsDef owns `w.aperture_state='destroyed'`). The DC is
 * per `a4.leverage` lane (publish 22 · sell 20 · handoff 21 · bury 16 · made 20 · bonfire 24 · none
 * 18). There is no game over: success sets `end.finale_pass`, failure `end.finale_fail` (the §10
 * darker-cut switch). The terminal mission `mission.a4_copper` (PKG-17) is the hands-on breach; its
 * auto-resolve is the same idea in one skill.
 *
 * Aging (§5.2): the physical approach needs `fitness ≥ 30`; a poorly-maintained body is left the
 * remote route, which is always available. Marge's keys, or a never-met player's night-watchman
 * bribe, open the physical door.
 *
 * Old failures follow you in (REDESIGN_V2 §D): the grand check's visible bonuses read the Act III and
 * Act IV fail branches — a spurned mirror racing you here, the Meridian debt to Kroll, the tape (and
 * whether Stroud contained it), Corvid's logged visit, a sloppy or outed Bonfire — and the breach reads
 * the Oracle's rough map and Mira's parting napkin. New fail branches here: a bad landing off the fence
 * leaves the `pkg04_act4_bad_knee` scar; a clumsy hand in the frame room darkens Cannery Row's phones
 * for a night (`a4.copper_row_dark`, read by the montage and the last day); a caught exit opens
 * `a4_copper_followed` — a photograph on your doormat, answered with a lawyer, an [Opsec DC 18] hunt
 * for the photographer, or the `pkg04_act4_photographed` scar.
 */
import { defineContent } from '@/engine/registry'
import type { Choice, Cond, Effect, QuestDef, SkillId } from '@/engine/types'
import { LANES, aff, all, any, available, flag, not } from './shared'
import type { Lane } from './shared'

const DC_BY_LANE: Record<Lane, number> = {
  publish: 22,
  sell: 20,
  handoff: 21,
  bury: 16,
  made: 20,
  bonfire: 24,
  none: 18,
}

// Surviving allies who can boost the run (bible: "each surviving ally boosts one stage").
const allyBonus = (npc: string, minAff: number, label: string): { if: Cond; add: number; label: string } => ({
  if: all(available(npc), aff(npc, minAff)),
  add: 2,
  label,
})

/** Friendly faction bonus. */
const facBonus = (faction: 'fac.loft' | 'fac.aperture' | 'fac.bureau' | 'fac.halcyon' | 'fac.hood', label: string): { if: Cond; add: number; label: string } => ({
  if: { faction, gte: 50 },
  add: 2,
  label,
})

/** The full pool of visible situational bonuses for the grand check. */
const GRAND_BONUSES: { if: Cond; add: number; label: string }[] = [
  allyBonus('mira', 40, '+2 (Mira on crypto)'),
  allyBonus('jax', 40, '+2 (Jax talks you past the guard)'),
  { if: all(available('corvid'), aff('corvid', 40), not(flag('a4.corvid_shut_door'))), add: 2, label: '+2 (Corvid knows the board’s old tricks)' },
  allyBonus('deadline', 30, '+2 (Deadline remembers the ’94 routes)'),
  allyBonus('priya', 40, '+2 (Priya maps the data trunk)'),
  { if: all({ npc: 'dialtone', met: true }, { npc: 'dialtone', fate: ['honored'] }), add: 2, label: '+2 (Marge walks the copper with you)' },
  { if: all({ flag: 'a3.oracle_revealed' }, { flag: 'a4.oracle_briefed' }), add: 2, label: '+2 (the Oracle drew you the junction)' },
  facBonus('fac.loft', '+2 (the scene has your back)'),
  facBonus('fac.hood', '+2 (the Row keeps watch)'),
  facBonus('fac.bureau', '+2 (a badge clears your path)'),
  { if: { item: 'old_tool' }, add: 2, label: '+2 (the phreaker’s toolbox)' },
  { if: { item: 'exchange_keys' }, add: 1, label: '+1 (you own the doors)' },
  { if: { flag: 'mir.outcome', eq: 'redeemed' }, add: 2, label: '+2 (the mirror runs interference)' },
  { if: all({ flag: 'a4.leverage', eq: 'made' }, { faction: 'fac.aperture', gte: 50 }), add: 2, label: '+2 (Special Accounts holds the door)' },
  { if: all({ flag: 'a4.leverage', eq: 'sell' }, { faction: 'fac.aperture', gte: 20 }), add: 1, label: '+1 (your buyer wants this to work)' },
  { if: { skill: 'opsec', gte: 50 }, add: 1, label: '+1 (Opsec 50: you leave no shape)' },
  { if: { skill: 'social', gte: 50 }, add: 1, label: '+1 (Social 50: you keep the crew calm)' },
  { if: { flag: 'a2.recon_sloppy' }, add: -1, label: '−1 (your Meridian recon was sloppy)' },
  { if: all({ flag: 'a3.incriminated' }, not({ flag: 'a3.tape_contained' })), add: -2, label: '−2 (they have you on a wire, talking freely)' },
  { if: all({ flag: 'a3.incriminated' }, { flag: 'a3.tape_contained' }), add: -1, label: '−1 (the tape, which Stroud kept a tape. Mostly.)' },
  { if: { flag: 'a3.mirror_spurned' }, add: -1, label: '−1 (mirror is racing you to the copper)' },
  {
    if: all({ flag: 'a3.owes_kroll' }, not({ flag: 'a4.leverage', eq: 'made' }), not({ flag: 'a4.leverage', eq: 'sell' })),
    add: -1,
    label: '−1 (Kroll pulled you out of Meridian; she knows your habits)',
  },
  { if: { flag: 'a4.corvid_shut_door' }, add: -1, label: '−1 (Corvid logged your visit, and someone upstairs read the log)' },
  { if: all({ flag: 'a4.leverage', eq: 'bonfire' }, { flag: 'a4.bonfire_sloppy' }), add: -1, label: '−1 (your fires were sloppy; everyone is looking)' },
  { if: all({ flag: 'a4.leverage', eq: 'bonfire' }, { flag: 'a4.bonfire_outed' }), add: -1, label: '−1 (the scene is hunting you, not the machine)' },
  { if: { flag: 'a4.copper_out_trace' }, add: -1, label: '−1 (a trace is already awake)' },
  { if: { stat: 'stress', gte: 80 }, add: -1, label: '−1 (your hands will not stop shaking)' },
]

const lane = (l: Lane): Cond => ({ flag: 'a4.leverage', eq: l })

/** Any lane other than `none` is set; `none` (or a missing lane) shows the undecided run. */
const laneVisible = (l: Lane): Cond =>
  l === 'none' ? not({ any: LANES.filter(x => x !== 'none').map(lane) }) : lane(l)

const PASS_EFFECTS = (l: Lane): Effect[] => [
  { flag: 'end.finale_pass' },
  { clearFlag: 'end.finale_fail' },
  // The story publishes the headline; the NewsDef owns the world delta (§11.4 single-count rule).
  ...(l === 'publish' ? [{ if: { flag: 'end.has_evidence' }, then: [{ news: 'aperture_destroyed' }] } satisfies Effect] : []),
]
const FAIL_EFFECTS: Effect[] = [{ flag: 'end.finale_fail' }, { clearFlag: 'end.finale_pass' }, { stat: 'heat', add: 20 }]

/** The grand check's two routes per lane (one visible set): Intrusion, or Opsec at +2 DC. */
function grandChoices(l: Lane): Choice[] {
  return [grandChoice(l, 'intrusion', 0), grandChoice(l, 'opsec', 2)]
}

function grandChoice(l: Lane, skill: SkillId, dcAdd: number): Choice {
  const text =
    skill === 'intrusion'
      ? `[Intrusion] Make the run: ${LANE_VERB[l]}, through the copper.`
      : `[Opsec] Go slow and invisible instead: ${LANE_VERB[l]}, one careful hop at a time.`
  return {
    text,
    if: laneVisible(l),
    check: {
      skill,
      dc: DC_BY_LANE[l] + dcAdd,
      bonuses: GRAND_BONUSES,
      success: 'act_pass',
      fail: 'act_fail',
      successEffects: PASS_EFFECTS(l),
      failEffects: FAIL_EFFECTS,
    },
  }
}

const LANE_VERB: Record<Lane, string> = {
  publish: 'push everything out at once',
  sell: 'make the drop to the buyer',
  handoff: 'send the one clean copy',
  bury: 'scrub every copy and seal it away',
  made: 'show them whose hand is on the wire',
  bonfire: 'light the last match',
  none: 'do whatever it is you came to do',
}

const quest: QuestDef = {
  id: 'main_a4_q3b_the_exchange',
  title: 'Through the Copper',
  kind: 'main',
  act: 4,
  priority: 100,
  rewards: 'The finale run',
  summary: [
    'The old Cannery-Millgate telephone exchange. A hundred years of copper in the dark, and running through the middle of it, spliced in where nobody thinks to look, the fiber trunk that carries the city’s new nervous system.',
    'Old net and new net, in one room, full circle. Whatever you decided to do with the truth, you do it here.',
  ],
  start: 'approach',
  stages: {
    approach: {
      text: 'Getting in. Marge’s keys and a working body open the front; the night watchman opens to a bribe; and the remote route is always there for anyone who kept up their networking. Pick your door.',
      onEnter: [{ scene: 'a4_copper_approach', delayHours: 4 }],
      objectives: [{ id: 'in', text: 'Reach the frame room', when: flag('a4.copper_in'), hint: 'The scene opens on its own. Keys + fitness, a Hardware bribe, or a Networking route in remotely.' }],
      next: 'breach',
    },
    breach: {
      text: 'The frame room. Ten thousand cross-connects, and one of them is the splice the machine forgot was ever a door. Find it, and open it.',
      onEnter: [{ scene: 'a4_copper_breach', delayHours: 2 }],
      objectives: [{ id: 'open', text: 'Open the splice', when: flag('a4.copper_open'), hint: 'Crack it by hand [Intrusion], or open the terminal and run mission a4_copper.' }],
      next: 'act',
    },
    act: {
      text: 'You are in. The whole city’s traffic runs under your hands, past and present on the same copper. This is the moment you have been walking toward for a decade. Do the thing.',
      onEnter: [{ scene: 'a4_copper_act', delayHours: 1 }],
      objectives: [{ id: 'did', text: 'Do the thing', when: flag('a4.copper_acted'), hint: 'The grand check. Your surviving allies, friendly factions and kept tools all add to the roll — the screen shows every bonus.' }],
      next: 'escape',
    },
    escape: {
      text: 'Now get out. The building is old and the night is long and somewhere a trace is waking up. Walk, do not run.',
      onEnter: [{ scene: 'a4_copper_escape', delayHours: 1 }],
      objectives: [{ id: 'out', text: 'Get out clean', when: flag('a4.copper_out'), hint: 'One last [Opsec] check. Whatever happens, you survive it.' }],
      onComplete: [
        { flag: 'a4.finale_done' },
        { quest: 'main_a4_q3_the_city', start: true },
        { log: 'It is done. Whatever it was, it is done. The copper is quiet again.', kind: 'story' },
      ],
    },
  },
}

export default defineContent({
  quests: [quest],
  scenes: [
    // ── Approach ─────────────────────────────────────────────────────────────
    {
      id: 'a4_copper_approach',
      channel: 'dialog',
      title: 'The Exchange',
      start: 'open',
      nodes: {
        open: {
          speaker: 'narrator',
          text: [
            'The exchange squats at the edge of the mill district, brick and blackout glass, a NO TRESPASSING sign so old it is polite. Inside is the frame room, and inside that is the one wire that matters.',
            { if: { item: 'exchange_keys' }, text: 'Marge’s keys are a cold weight in your pocket, each one tagged in her faded ballpoint. FRAME ROOM. CABLE VAULT. DO NOT — (the rest worn off).' },
            {
              if: all({ npc: 'dialtone', fate: 'honored' }, not({ item: 'exchange_keys' })),
              text: 'Marge is waiting across the street in her cardigan, pretending to walk a dog she does not own. "Thirty years I patched this city," she says. "Let’s go see what they did to my frame room."',
            },
            { if: flag('a2.spine', 'aperture'), text: 'You have been inside the machine long enough to know exactly which door nobody checks.' },
            { if: flag('a4.mira_napkin'), text: 'Mira’s napkin is in your wallet, folded to the size of a stamp: *the copper floods. go in dry.* You have read it so many times the ink is going.' },
            { if: flag('a3.mirror_spurned'), text: 'Somebody has been here before you, recently: a fresh scuff on the fence, a padlock hanging open like a punchline. mirror. Of course mirror, racing you to your own ending.' },
          ],
          choices: [
            {
              text: '[Fitness] Go in the front with the keys, quick and quiet.',
              req: all({ item: 'exchange_keys' }, { skill: 'fitness', gte: 30 }),
              reqText: 'Requires Marge\'s keys to the exchange and Fitness 30 (the fences have not gotten lower)',
              check: {
                skill: 'fitness',
                dc: 14,
                bonuses: [{ if: all(available('deadline'), aff('deadline', 30)), add: 2, label: '+2 (Deadline’s old routes)' }],
                success: 'in_clean',
                fail: 'in_knee',
                successEffects: [{ flag: 'a4.copper_in' }],
                failEffects: [{ flag: 'a4.copper_in' }, { stat: 'heat', add: 10 }, { stat: 'health', add: -8 }, { trait: 'pkg04_act4_bad_knee' }],
              },
            },
            {
              text: '[Fitness] Follow Marge in the way she used to, back when it was hers.',
              if: all({ npc: 'dialtone', fate: 'honored' }, { flag: 'side.met_dialtone' }, { skill: 'fitness', gte: 30 }, not({ item: 'exchange_keys' })),
              check: {
                skill: 'fitness',
                dc: 12,
                success: 'in_marge',
                fail: 'in_marge_hard',
                successEffects: [{ flag: 'a4.copper_in' }],
                failEffects: [
                  { flag: 'a4.copper_in' },
                  { stat: 'heat', add: 8 },
                  { stat: 'health', add: -4 },
                  { stat: 'stress', add: 4 },
                  // A 1974 puddle and a wrist that is no longer nineteen.
                  { chance: 0.3, then: [{ complication: 'health' }] },
                ],
              },
            },
            {
              text: '[Hardware] Bribe the night watchman and walk in past him.',
              check: {
                skill: 'hardware',
                dc: 16,
                success: 'in_bribe',
                fail: 'in_bribe_fail',
                successEffects: [{ flag: 'a4.copper_in' }, { money: -400 }],
                failEffects: [
                  { flag: 'a4.copper_in' },
                  { money: -400 },
                  { stat: 'heat', add: 15 },
                  { flag: 'a4.watchman_saw' },
                  { chance: 0.3, then: [{ complication: 'legal' }] },
                ],
              },
            },
            {
              text: '[Networking] Skip the building. Do it all remotely; the copper doesn’t care where you sit.',
              check: {
                skill: 'networking',
                dc: 15,
                bonuses: [{ if: all(available('priya'), aff('priya', 40)), add: 2, label: '+2 (Priya mapped the trunk)' }],
                success: 'in_remote',
                fail: 'in_remote_fail',
                successEffects: [{ flag: 'a4.copper_in' }, { flag: 'a4.copper_remote' }],
                failEffects: [{ flag: 'a4.copper_in' }, { flag: 'a4.copper_remote' }, { stat: 'heat', add: 12 }],
              },
            },
          ],
        },
        in_clean: { speaker: 'narrator', text: 'The third key fits on the first try. Marge tags them well. The frame-room door swings in on a hundred years of dust and a smell like a warm CRT, and you are inside.' },
        in_marge: { speaker: 'narrator', text: 'Marge goes first, sure-footed in the dark, one hand trailing the wall the way you trail a familiar banister. "Mind the frame room," she murmurs. "It floods." You are inside.' },
        in_knee: {
          speaker: 'narrator',
          text: [
            'The fence is higher than your knees remember. You go over it the way you did at nineteen and come down the way you are now: wrong, on the left side, with a sound inside your leg like a knuckle cracking under a car door.',
            'You sit in the weeds for a full minute, teeth together, not making a noise. Then you get up, because the keys still fit and the night is not getting longer. You will limp out of this building. You will limp, a little, for the rest of your life. But you are inside.',
          ],
        },
        in_marge_hard: {
          speaker: 'narrator',
          text: 'Marge takes the loading-dock step like a staircase in her own house. You take it like a man who has not been in a loading dock since the Clinton administration, and go down on one hand in a puddle that has been a puddle since 1974. She hauls you up by the collar without breaking stride. "Thirty years," she says. "Every new tech, that step. Every single one." You are inside, wet to the wrist, with a scrape and a lecture.',
        },
        in_bribe: { speaker: 'narrator', text: 'Four hundred dollars and the watchman discovers an urgent need to check the far end of the lot. He does not look at your face, which is the whole point of a good bribe. You are inside.' },
        in_bribe_fail: {
          speaker: 'narrator',
          text: 'He takes the money and then, halfway to the lot, thinks better of it and reaches for his radio. You are past him before he keys it, but he got a long look at you under the sodium light, the kind of look a man takes when he expects to be asked to describe someone later. Inside, at a cost. He will be at the gate when you come out.',
        },
        in_remote: { speaker: 'narrator', text: 'You never leave your desk. The copper does not care where you sit; a splice is a splice whether your hand is on it or your packets are. You route in through three dead exchanges and one very much alive one, and the frame room opens to you like a book.' },
        in_remote_fail: { speaker: 'narrator', text: 'You get in remotely, but you leave a wake doing it — a log you cannot reach to wipe, a light blinking somewhere it will be noticed. You are in. You are also, faintly, on a clock now.', effects: [{ flag: 'a4.copper_out_trace' }] },
      },
    },
    // ── Breach ───────────────────────────────────────────────────────────────
    {
      id: 'a4_copper_breach',
      channel: 'dialog',
      title: 'The Frame Room',
      start: 'open',
      nodes: {
        open: {
          speaker: 'narrator',
          text: [
            'Ten thousand cross-connects rise floor to ceiling, jumpers looping between them like ivy on a trellis. Somewhere in this cathedral of copper is the splice where the old exchange meets the new trunk: one green pair among thousands, carrying the whole city’s watched traffic.',
            { if: { item: 'old_tool' }, text: 'You unroll the phreaker’s toolbox. The dented lineman’s handset finds tones no modern meter looks for. The dead man who owned it would have loved this room.' },
            { if: { flag: 'a4.copper_remote' }, text: 'From your desk, the frame room is a map and a listing, and the splice is a single anomalous route you can almost taste.' },
            { if: flag('a4.oracle_rough_map'), text: 'The Oracle’s sketch is on the back of a receipt: three boxes, an arrow, a word you think says SPLICE. It is not a map. It is a rumor of a map.' },
          ],
          choices: [
            {
              text: '[Intrusion] Find the splice and open it by hand.',
              check: {
                skill: 'intrusion',
                dc: 17,
                bonuses: [
                  { if: all(available('mira'), aff('mira', 40)), add: 2, label: '+2 (Mira on the crypto)' },
                  { if: { item: 'old_tool' }, add: 1, label: '+1 (phreaker’s toolbox)' },
                  { if: flag('a4.oracle_briefed'), add: 1, label: '+1 (the Oracle drew you the junction)' },
                  { if: flag('a4.oracle_rough_map'), add: -1, label: '−1 (the Oracle only sketched it)' },
                  { if: flag('a4.mira_napkin'), add: 1, label: '+1 (Mira’s napkin: the copper floods, go in dry)' },
                ],
                success: 'open_hand',
                fail: 'open_hand_fail',
                successEffects: [{ flag: 'a4.copper_open' }],
                failEffects: [
                  { flag: 'a4.copper_open' },
                  { flag: 'a4.copper_out_trace' },
                  { stat: 'heat', add: 15 },
                  { flag: 'a4.copper_row_dark' },
                  { faction: 'fac.hood', add: -6 },
                ],
              },
            },
            {
              text: '⌨ Open the terminal and do it properly.',
              goto: 'terminal',
            },
          ],
        },
        terminal: {
          speaker: 'narrator',
          text: 'You drop into the terminal. The frame room resolves into hosts and ports and one anomalous route with the whole city hanging off it. Do it by hand, or let the auto-resolve make the call.',
          mission: {
            mission: 'a4_copper',
            success: 'open_term',
            fail: 'open_term_fail',
            auto: { skill: 'intrusion', dc: 18 },
          },
        },
        open_hand: { speaker: 'narrator', text: 'You trace it by ear and by feel, the way Marge would, the way the dead man’s handset was built to. The green pair. You clip in. The city’s whole nervous system hums under your fingers, patient, unaware.' },
        open_hand_fail: {
          speaker: 'narrator',
          text: [
            'You find it, but you are clumsy about it. Your elbow catches a bundle of jumpers on the way in and a whole block of them comes loose with a soft, terrible zip, like a seam giving out. An alarm wakes on a circuit you did not expect to be live.',
            'You are in the splice. The building knows a door opened. And somewhere across the mill district, you realize, reading the tags on the jumpers in your fist, every landline on Cannery Row has just gone quiet at once. Mrs. Alvarez’s. The laundromat’s. Your parents’. Move faster now. Somebody will have to fix what you broke, and it will not be you, and it will not be tonight.',
          ],
        },
        open_term: { speaker: 'narrator', text: 'Through the terminal it is almost elegant: the splice resolves out of the noise like a name out of a crowd. You are in.', effects: [{ flag: 'a4.copper_open' }] },
        open_term_fail: {
          speaker: 'narrator',
          text: 'The terminal fights you the whole way and something on the far end notices before you finish. You get the splice open, but a trace is awake now, and it is looking for the shape of you, and it has already found the outline. Keep moving.',
          effects: [
            { flag: 'a4.copper_open' },
            { flag: 'a4.copper_out_trace' },
            { stat: 'heat', add: 15 },
            // A traced op is a traced op, finale or not (REDESIGN_V2 §A).
            { chance: 0.5, then: [{ complication: 'hack' }] },
          ],
        },
      },
    },
    // ── Act (the grand check) ────────────────────────────────────────────────
    {
      id: 'a4_copper_act',
      channel: 'dialog',
      title: 'Old Net, New Net',
      start: 'open',
      nodes: {
        open: {
          speaker: 'narrator',
          text: [
            'This is it. The splice is open, the city is under your hands, and everyone who ever helped you or hurt you is somewhere out there in the dark on the other end of a wire.',
            {
              if: flag('a4.leverage', 'publish'),
              text: 'Everything you know, ready to go everywhere at once. One keystroke and the city cannot un-know it.',
            },
            { if: flag('a4.leverage', 'sell'), text: 'The buyer’s dead-drop address is loaded. One clean transfer through a line nobody can subpoena, and you are rich and gone.' },
            { if: flag('a4.leverage', 'handoff'), text: 'One encrypted copy, addressed to the one person you trust to finish it. Send it clean and step out of the story.' },
            { if: flag('a4.leverage', 'bury'), text: 'You are not here to publish. You are here to make sure it stays buried: scrub the copies, close the splice behind you, leave the machine a little blinder about you than it was.' },
            { if: flag('a4.leverage', 'made'), text: 'You are here to take your seat, and taking it means proving you can put your hand on the city’s throat and choose, calmly, not to squeeze — where they can see you do it.' },
            { if: flag('a4.leverage', 'bonfire'), text: 'The three fires are set and the last match is here, at the junction, where old net and new net meet. Light it and the whole thing goes up at once.' },
            { if: flag('a4.leverage', 'none'), text: 'You never did decide, not really. But you are here now, hands on the wire, and something is going to happen whether you name it or not.' },
            'Whatever you brought with you — the people who stayed, the reps you earned, the tools you kept — it all comes down to this next move.',
          ],
          choices: LANES.flatMap(grandChoices),
        },
        act_pass: {
          speaker: 'narrator',
          text: [
            'It works. Cleanly, completely, exactly as you meant it. For one held breath the whole city passes through your hands and comes out the other side changed.',
            'You did the thing you came to do. Now leave, before the copper remembers you were here.',
          ],
          effects: [{ flag: 'a4.copper_acted' }, { stat: 'mood', add: 6 }],
        },
        act_fail: {
          speaker: 'narrator',
          text: [
            'It works — but not clean. Something slips: a trace closes early, a copy escapes you, a door bangs open two rooms away. You do the thing you came to do, and you do it with the building coming down around you.',
            { if: flag('a4.leverage', 'publish'), text: 'Most of it lands. Some of it goes out stripped of its proof by a trace that bit at the wrong millisecond, and every copy carries your fingerprints in the headers.' },
            { if: flag('a4.leverage', 'sell'), text: 'The drop clears, and something official sees the shape of it clear. The buyer pays. Within the hour the buyer also stops returning your calls.' },
            { if: flag('a4.leverage', 'handoff'), text: 'The copy gets out. So does a second one you never meant to send, to an address you do not recognize, and you will never find out whose.' },
            { if: flag('a4.leverage', 'bury'), text: 'You scrub nine copies. The tenth was already moving when you reached for it.' },
            { if: flag('a4.leverage', 'made'), text: 'They watched you choose not to squeeze. They also watched your hand shake while you did it. Nobody will mention the shake. Everybody will remember it.' },
            { if: flag('a4.leverage', 'bonfire'), text: 'The last match lights, and the flame runs back up the wire toward you faster than it runs toward them.' },
            { if: flag('a4.leverage', 'none'), text: 'Something happens. You are not entirely sure what you did. Neither, for a while, is anyone else, which is the only thing that saves you.' },
            { if: flag('a3.mirror_spurned'), text: 'On your way out of the session a single line scrolls past on a channel you never opened: "same first job. i just got here first." mirror, making sure you know who closed the trace.' },
            'It is done. It will just cost more than you wanted it to. It always does. Get out.',
          ],
          effects: [{ flag: 'a4.copper_acted' }, { stat: 'stress', add: 10 }],
        },
      },
    },
    // ── Escape ───────────────────────────────────────────────────────────────
    {
      id: 'a4_copper_escape',
      channel: 'dialog',
      title: 'Walk, Don’t Run',
      start: 'open',
      nodes: {
        open: {
          speaker: 'narrator',
          text: [
            { if: flag('a4.copper_remote'), text: 'You have to get your session out as clean as you got it in, unspooling the route behind you exchange by dead exchange while something warm and official gropes for the other end.' },
            { if: not(flag('a4.copper_remote')), text: 'The frame room is behind you. The long hall, the polite old sign, the lot where the watchman is or is not waiting. Walk, do not run. Running is how they know it was you.' },
          ],
          choices: [
            {
              text: '[Opsec] Cover your exit the way Deadline taught the whole scene to.',
              check: {
                skill: 'opsec',
                dc: 16,
                bonuses: [
                  { if: all(available('deadline'), aff('deadline', 30)), add: 2, label: '+2 (Deadline knows the way out)' },
                  { if: { flag: 'life.y2k_safehouse' }, add: 2, label: '+2 (the safehouse to go to ground in)' },
                  { if: { trait: 'pkg03_act3_ghost_habits' }, add: 1, label: '+1 (you still live like weather)' },
                  { if: { flag: 'a4.copper_out_trace' }, add: -2, label: '−2 (a trace is already awake)' },
                  { if: all({ flag: 'a4.watchman_saw' }, not({ flag: 'a4.copper_remote' })), add: -1, label: '−1 (the watchman is at the gate, and he knows your face)' },
                  { if: all({ trait: 'pkg04_act4_bad_knee' }, not({ flag: 'a4.copper_remote' })), add: -1, label: '−1 (your knee, on the stairs)' },
                  { if: { trait: 'pkg03_act3_burned' }, add: -1, label: '−1 (the city’s cameras know the shape of your walk)' },
                ],
                success: 'out_clean',
                fail: 'out_caught',
                successEffects: [{ flag: 'a4.copper_out' }],
                failEffects: [{ flag: 'a4.copper_out' }, { stat: 'heat', add: 20 }, { flag: 'a4.copper_followed' }, { scene: 'a4_copper_followed', delayHours: 72 }],
              },
            },
            {
              text: 'Do not bother hiding. Let them come. You are past caring who sees.',
              effects: [{ flag: 'a4.copper_out' }, { stat: 'heat', add: 15 }, { stat: 'stress', add: 5 }],
              goto: 'out_open',
            },
          ],
        },
        out_clean: { speaker: 'narrator', text: 'You come out of the exchange the way fog comes off the Sound: without a sound, without a shape, as if you were never a solid thing at all. Behind you the copper is quiet again. Ahead of you, the rest of your life.', effects: [{ stat: 'stress', add: -4 }] },
        out_caught: {
          speaker: 'narrator',
          text: [
            'You get out, but not clean. A face on a camera, a plate in a lot, a trace that found the last hop before you could burn it.',
            { if: all(flag('a4.watchman_saw'), not(flag('a4.copper_remote'))), text: 'The watchman is at the gate, exactly where he said he would not be, radio in hand. He does not stop you. He just watches you go, lips moving, memorizing.' },
            'It is done — but it followed you home. Three days later, you will find out exactly how far.',
          ],
          effects: [{ stat: 'stress', add: 8 }],
        },
        out_open: { speaker: 'narrator', text: 'You walk out the front like you own it, because in every way that matters tonight, you did. If anyone is watching, let them watch. The thing is done, and no amount of watching undoes a thing that is done.', effects: [{ stat: 'stress', add: 4 }] },
      },
    },
    // ── Fail branch of the escape: it followed you home ──────────────────────
    {
      id: 'a4_copper_followed',
      channel: 'mail',
      title: '(no subject)',
      from: 'Unknown sender',
      pause: true,
      expiresDays: 14,
      onExpire: [{ trait: 'pkg04_act4_photographed' }, { stat: 'stress', add: 6 }, { flag: 'a4.copper_photo_kept' }],
      start: 'letter',
      nodes: {
        letter: {
          speaker: 'narrator',
          text: [
            'No stamp. No return address. Somebody walked it to your door and slid it under, sometime between 2 and 5 a.m., on the one night this month you slept through.',
            {
              if: flag('a4.copper_remote'),
              text: 'Inside, a single sheet of green-bar printout: a trace log, eleven hops, the last one circled twice in red ballpoint. Under the circle, in the same pen, your street address, and a small, neat drawing of your window.',
              else: 'Inside, a single glossy eight-by-ten: you, in the exchange lot at 3 a.m., keys in hand, looking straight at a lens you never saw. It is a very good photograph. Whoever took it has done this before.',
            },
            { if: flag('a4.leverage', 'made'), text: 'On the back, in a warm, round hand: "Welcome to the family. We keep pictures of all our family." No signature. It does not need one.' },
            { if: all(flag('fac.bureau.informant'), not(flag('a4.leverage', 'made'))), text: 'On the back, a case number and a yellow sticky note in block capitals: STILL OURS. — M.' },
            { if: not(any(flag('a4.leverage', 'made'), flag('fac.bureau.informant'))), text: 'On the back, nothing at all. That is the message.' },
          ],
          choices: [
            {
              tag: '[Lawyer up · $4,000 + retainer]',
              text: 'Put it in an envelope, put the envelope in a lawyer\'s safe, and let someone who bills by the hour worry about what it is for.',
              req: { stat: 'money', gte: 4000 },
              reqText: 'Requires $4,000 for the retainer',
              effects: [
                { money: -4000 },
                { obligation: { id: 'pkg04_act4_photo_counsel', label: 'Counsel on retainer ("in the matter of the photograph")', perDay: 35, days: 90 } },
                { stat: 'heat', add: -8 },
                { flag: 'a4.copper_photo_lawyered' },
              ],
              goto: 'counsel',
            },
            {
              tag: '[Opsec DC 18]',
              text: 'Find the photographer before they decide what the picture is for.',
              check: {
                skill: 'opsec',
                dc: 18,
                bonuses: [
                  { if: { trait: 'paranoid' }, add: 1, label: '+1 (you already assumed there was a camera)' },
                  { if: { trait: 'pkg03_act3_ghost_habits' }, add: 1, label: '+1 (you know how people vanish; you know how they get found)' },
                  { if: all(available('deadline'), aff('deadline', 30)), add: 1, label: '+1 (Deadline knows every long lens in the city)' },
                ],
                success: 'found',
                fail: 'found_you',
                successEffects: [{ stat: 'heat', add: -10 }, { flag: 'a4.copper_photo_found' }],
                failEffects: [{ trait: 'pkg04_act4_photographed' }, { stat: 'heat', add: 10 }, { complication: 'legal' }, { flag: 'a4.copper_photo_kept' }],
              },
            },
            {
              tag: '[Burn it]',
              text: 'Burn it in the sink and go on living. They wanted you scared. Refuse the assignment.',
              effects: [{ trait: 'pkg04_act4_photographed' }, { stat: 'stress', add: 6 }, { flag: 'a4.copper_photo_kept' }],
              goto: 'burned',
            },
          ],
        },
        counsel: {
          speaker: 'narrator',
          text: 'The lawyer holds it by the edges, like a lab sample, and puts it in a safe that is older than both of you. "Photographs are only threats while nobody else has seen them," she says. "Now I have seen it. Now it is evidence of harassment, and they know that I know." The weekly invoice is the price of someone else holding your fear for you. It is worth it most weeks.',
        },
        found: {
          speaker: 'narrator',
          text: [
            'It takes four days and a borrowed car. The photographer is a freelancer with a long lens and a short memory who works for whoever pays by the roll. You pay by the roll.',
            'You get the negatives, and the name of the person who paid him first, which you memorize and do not write down. Deadline would be proud of that part. Deadline would also tell you to stop smiling about it, and he would be right.',
          ],
        },
        found_you: {
          speaker: 'narrator',
          text: [
            'You go looking for the photographer and the photographer is waiting for you to go looking. On the second night, in the parking structure where you thought you had him, a flash goes off behind you, polite as a wedding.',
            'The next envelope arrives on Friday. It is a photograph of you, looking for the photographer. Somebody wants you to understand the difference between hunting and being hunted, and has explained it very clearly, twice.',
          ],
        },
        burned: {
          speaker: 'narrator',
          text: 'It curls in the sink and goes up green at the edges, the way old photo paper does. It does not help at all. Whoever took it has the negative, and you have a habit now of glancing at parked cars, and at windows across the street, and at the space just behind your own reflection in shop glass.',
        },
      },
    },
  ],
})
