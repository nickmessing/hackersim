/**
 * PKG-06 — `fac_aperture_q6_made` — "Made" (bible §7.2.6), the Aperture Act-IV finale, and the
 * single owner of the "take her seat" scene (launched by CP-D1 option E in PKG-04's
 * `main_a4_q2_last_leverage`). Also the finalizer of `npc.kroll.fate` and `npc.hollis.fate`, of
 * which PKG-06 is the sole writer (bible §13, §4.6).
 *
 * Kroll is being pushed out from above. Her offer of her own chair is real because she's losing
 * it. Take it, save her, burn her, or back Hollis — the branches set the steering flags, and
 * `trig_aperture_fates` (gated on the finale completing) resolves the fates per the §4.6 table for
 * every case the branches leave open.
 *
 * Started by: PKG-04 CP-D1 E (`{quest:'fac_aperture_q6_made',start:true}`), which is why this
 * quest has no autoStart of its own (a documented cross-package dependency). Cross-package reads:
 * `npc.kroll.wants_you`, `a3.truth_t3` (PKG-03), `a4.finale_done`, `a3.whistleblow_prepped`,
 * `w.aperture_state`. Publishes `news.kroll_made` (delta owned by PKG-16).
 *
 * Fail-branch payoffs (REDESIGN_V2 §D): the offer reacts to every mark the arc left — Hollis's open
 * file, the parking structure, the drowned recorder, the asset tag, Ridgeline — taking the chair
 * forgives the retainer clawback, backing Hollis closes your file in writing, and a Hollis who
 * rises with your file still open turns its page (heat, Aperture rep) in `trig_aperture_fates`.
 */
import { defineContent } from '@/engine/registry'
import type { Effect, QuestDef, SceneDef, TriggerDef } from '@/engine/types'

const quest: QuestDef = {
  id: 'fac_aperture_q6_made',
  title: 'Special Accounts: Made',
  kind: 'faction',
  act: 4,
  faction: 'fac.aperture',
  giver: 'kroll',
  priority: 26,
  rewards: 'Her chair — or the leverage to decide who sits in it',
  summary:
    'Vanessa Kroll is being pushed out from above, and she wants to hand you Special Accounts before they take it from her. It is the most generous, most terrifying offer of your life, and it is real precisely because she is finally afraid.',
  start: 'offer',
  stages: {
    offer: {
      text:
        'Kroll offered you her seat. Somewhere above her, people are deciding her future; she\'d rather you were the one holding the pen. Decide what you do with the last, best door Aperture will ever open for you.',
      onEnter: [{ scene: 'aperture_made_offer' }],
      objectives: [
        {
          id: 'answer',
          text: 'Answer Kroll\'s "Made" offer',
          when: { flag: 'fac.aperture.made_done' },
          hint: 'Every road here is final. You can take the chair, save her, burn her, or let Hollis have her — and each decides who runs the machine after you.',
        },
      ],
    },
  },
}

const scene: SceneDef = {
  id: 'aperture_made_offer',
  channel: 'dialog',
  title: 'The Offer',
  from: 'kroll',
  start: 'intro',
  nodes: {
    intro: {
      speaker: 'kroll',
      text: [
        'She picks the Cathode this time, which tells you everything. Kroll on Sodium Row, in a booth with a tear in the vinyl, drinking Sal\'s terrible coffee like it\'s the good stuff. She looks tired in a way she\'d never let a boardroom see. "They\'re retiring me," she says, no preamble. "Special Accounts got too visible. Someone has to be seen leaving." She smiles. "I get to choose who I hand it to. I choose you."',
        {
          if: { flag: 'a3.truth_t3' },
          text: '"You already know PARALLAX built a profile of the ideal next head of this desk," she adds, almost fond. "You\'ve read it. It\'s you. It was always going to be you — I just had the manners to ask." ',
        },
        {
          if: { flag: 'fac.aperture.hollis_file' },
          text: 'Two booths down, Miles Hollis is eating a grilled cheese with a knife and fork, the leather folio open beside his plate at a tab you recognize from across the room. "He insisted on coming," Kroll says. "You\'re still an open file. Miles likes to close things before he inherits them."',
        },
        {
          if: { any: [{ flag: 'fac.aperture.grace_threads' }, { trait: 'pkg06_aperture_parking_structure' }] },
          text: '"How is your nurse?" she asks, stirring. "Still driving home a different way every night? Miles thought the parking structure was untidy of him. I thought it was untidy of you. We\'re both right. That\'s the job, too."',
        },
        {
          if: { flag: 'fac.aperture.wire_burned' },
          text: 'She glances, once, at your jacket. "No pockets today, darling?" She says it fondly, the way you\'d bring up an old boyfriend\'s haircut.',
        },
        {
          if: { trait: 'pkg06_aperture_asset_tag' },
          text: '"Your machine still has our little tag on it, I\'m told. Forty-oh-thirty-two." She almost laughs. "You never peeled it off. I found that very touching."',
        },
        {
          if: { flag: 'fac.aperture.ridgeline_botched' },
          text: '"You know why I kept calling you, after Ridgeline? Everyone else failed boringly."',
        },
      ],
      next: 'terms',
    },
    terms: {
      speaker: 'kroll',
      text: [
        '"Here\'s the honest version, since you\'ve earned it." She wraps both hands around the mug. "The seat is real. The money is real. You\'d be very good, and you\'d hate yourself in a way that gets quieter every year until you can\'t hear it. That\'s not a threat. That\'s the job description."',
        '"Or you don\'t take it, and it goes to Miles, and Miles opens every file I ever kept closed — starting, I\'d imagine, with yours, and everyone in it." She says it without menace. She\'s just doing you the courtesy of laying out the board.',
        {
          if: { flag: 'fac.aperture.hollis_file' },
          text: '"Yours, of course, he never closed. He won\'t need to open it. He\'ll just need to turn the page."',
        },
        {
          if: { obligation: 'pkg06_aperture_clawback' },
          text: '"And the clawback — clause fourteen, c — goes away the moment you sit down. Consider it a signing bonus. Or a severance. It\'s the same paperwork."',
        },
      ],
      next: 'decide',
    },
    decide: {
      speaker: 'player',
      text: 'Four roads out of this booth. All of them close behind you.',
      choices: [
        {
          text: 'Take the chair. Become Special Accounts.',
          tag: '[Made]',
          effects: [
            { faction: 'fac.aperture', add: 20 },
            { money: 40000 },
            { flag: 'npc.kroll.made_you' },
            { npc: 'kroll', fate: 'made_you' },
            { flag: 'a4.leverage', set: 'made' },
            { flag: 'fac.aperture.made_done' },
            { news: 'kroll_made' },
            { removeObligation: 'pkg06_aperture_clawback' },
          ],
          goto: 'took_it',
        },
        {
          text: 'Refuse — and hand her the leverage to save herself and bury Hollis.',
          tag: '[Save Kroll]',
          effects: [
            { flag: 'npc.kroll.flips_set' },
            { npc: 'kroll', fate: 'flips' },
            { flag: 'npc.hollis.neutralized' },
            { faction: 'fac.aperture', add: 5 },
            { flag: 'fac.aperture.made_done' },
          ],
          goto: 'saved_her',
        },
        {
          text: 'Refuse, and let what\'s coming for her arrive.',
          tag: '[Burn her]',
          effects: [
            { flag: 'npc.kroll.charged' },
            { faction: 'fac.aperture', add: -20 },
            { flag: 'fac.aperture.made_done' },
          ],
          goto: 'burned_her',
        },
        {
          text: 'Back Hollis. Let him frame her and take the seat himself.',
          tag: '[Back Hollis]',
          effects: [
            { flag: 'npc.hollis.your_ally' },
            { flag: 'npc.kroll.charged' },
            { faction: 'fac.aperture', add: 8 },
            { flag: 'fac.aperture.made_done' },
          ],
          goto: 'backed_hollis',
        },
      ],
    },
    took_it: {
      speaker: 'kroll',
      text: [
        'She slides across the table a keycard, a phone with no number on it, and a hand you shake before you\'ve decided to. "There," she says softly, and there\'s real relief in it, and something almost like grief. "It\'s yours. Be better at it than I was. Or don\'t — it runs itself now. That\'s the secret nobody tells you. It stopped needing a person a while ago. You\'re just the one it takes to dinner."',
        'She leaves you the check and walks out into a life with a sea view in it. You sit in the torn booth as the new head of Special Accounts, and Sal, who has known you since you were broke and honest, tops off your coffee without a word, because he doesn\'t know yet, and you can\'t make yourself tell him.',
      ],
      next: 'end',
    },
    saved_her: {
      speaker: 'kroll',
      text: [
        'You give her the one thing she couldn\'t take for herself — the leverage, the timing, the specific page that makes Miles Hollis the one they retire instead. She reads it twice, and for the first time since you\'ve known her, Vanessa Kroll looks surprised. "You\'re helping me *lose gracefully*," she says, working it out. "You\'re getting me out." She laughs, delighted and appalled. "Nobody\'s ever done that. They all wanted the chair."',
        '"Fine," she says, standing, buttoning her coat. "Then I\'ll do the thing that scares them most. I\'ll turn on it. Quietly, with lawyers, from a very nice apartment — but I\'ll turn." She means it. You just made the machine an enemy of the most dangerous person who ever ran it.',
      ],
      next: 'end',
    },
    burned_her: {
      speaker: 'kroll',
      text: [
        'You say no, and you don\'t offer her a hand out, and she understands immediately — she was always faster than you. "Ah," she says, and sets down the mug. "So I get to find out what it\'s like from the other side of the desk. That\'s fair. That\'s almost poetic." No anger. She was never going to give you anger; it would be admitting you\'d landed a blow.',
        'She pays for both coffees on the way out, because of course she does, and whatever is coming for Special Accounts arrives on schedule and finds her sitting exactly where you left her, waiting, with her name still on the door.',
      ],
      next: 'end',
    },
    backed_hollis: {
      speaker: 'hollis',
      text: [
        'You don\'t even have to leave the booth. You just make one call, to a grey man with a leather folio, and tell him where the seam in Vanessa Kroll is. Hollis listens, says "Thank you. That closes a file," and hangs up. Within a week the story writes itself the way he needs it to, and Kroll walks out of Aperture with a story attached to her that isn\'t true and can\'t be disproven.',
        'Hollis keeps his word, in the narrow way locks keep faith with keys. He opens fewer files than he threatened to. Yours stays shut. You traded the warmest monster in the city for the coldest one, and told yourself it was strategy.',
        {
          if: { flag: 'fac.aperture.hollis_file' },
          text: 'A week later a plain envelope arrives with a single sheet inside: the tab from his folio with your name on it, a neat line drawn through it, his initials, the date. "Closed," it says, in square handwriting. It is the most intimate thing a man like that can do, and you keep it in a drawer you never open.',
        },
      ],
      next: 'end',
    },
    end: {
      speaker: 'narrator',
      text:
        'The booth is empty now except for you and a bill and the smell of Sal\'s coffee. Whatever you chose, Special Accounts goes on. It always does. The only question this decade ever asked was who gets to say they didn\'t know.',
    },
  },
}

/**
 * Finalizes `npc.kroll.fate` and `npc.hollis.fate` from the steering flags once the finale is done
 * (bible §4.6). Runs after the Made offer and the copper finale have both had their say, so the
 * q6 branches that set a fate directly (made_you / flips) are already applied; this trigger only
 * resolves the cases they left `normal` (charged → arrested/cut_loose, boss, cut_loose default),
 * then finalizes Hollis (who reads the just-resolved Kroll fate).
 */
const finalizeKroll: Effect = {
  if: { npc: 'kroll', fate: 'normal' },
  then: [
    {
      if: { flag: 'npc.kroll.made_you' },
      then: [{ npc: 'kroll', fate: 'made_you' }],
      else: [
        {
          if: {
            all: [
              { flag: 'npc.kroll.charged' },
              { faction: 'fac.bureau', gte: 50 },
              { flag: 'a3.whistleblow_prepped' },
            ],
          },
          then: [{ npc: 'kroll', fate: 'arrested' }],
          else: [
            {
              if: { flag: 'npc.kroll.flips_set' },
              then: [{ npc: 'kroll', fate: 'flips' }],
              else: [
                {
                  if: { flag: 'npc.kroll.charged' },
                  then: [{ npc: 'kroll', fate: 'cut_loose' }],
                  else: [
                    {
                      if: { faction: 'fac.aperture', gte: 50 },
                      then: [{ npc: 'kroll', fate: 'boss' }],
                      else: [{ npc: 'kroll', fate: 'cut_loose' }],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}

const finalizeHollis: Effect = {
  if: { npc: 'hollis', fate: 'normal' },
  then: [
    {
      if: { flag: 'npc.hollis.your_ally' },
      then: [{ npc: 'hollis', fate: 'your_ally' }],
      else: [
        {
          if: { flag: 'npc.hollis.neutralized' },
          then: [{ npc: 'hollis', fate: 'neutralized' }],
          else: [
            {
              if: {
                all: [
                  { npc: 'kroll', fate: ['cut_loose', 'arrested', 'flips'] },
                  { not: { flag: 'npc.kroll.made_you' } },
                ],
              },
              then: [{ npc: 'hollis', fate: 'rising' }],
              else: [{ npc: 'hollis', fate: 'neutralized' }],
            },
          ],
        },
      ],
    },
  ],
}

/** An open file doesn't stay closed when its reader gets the desk (REDESIGN_V2 §D payoff). */
const hollisOpensYourFile: Effect = {
  if: { all: [{ npc: 'hollis', fate: 'rising' }, { flag: 'fac.aperture.hollis_file' }] },
  then: [
    { stat: 'heat', add: 12 },
    { faction: 'fac.aperture', add: -10 },
    {
      notify: 'Miles Hollis inherits Special Accounts. The first file he opens is yours. It was never closed; he only had to turn the page.',
      kind: 'heat',
    },
  ],
}

const trigger: TriggerDef = {
  id: 'trig_aperture_fates',
  once: true,
  priority: 60,
  when: { flag: 'a4.finale_done' },
  effects: [finalizeKroll, finalizeHollis, hollisOpensYourFile],
}

export default defineContent({
  quests: [quest],
  scenes: [scene],
  triggers: [trigger],
})
