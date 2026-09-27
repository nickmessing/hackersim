/**
 * PKG-06 — `fac_aperture_q5_hospital` — "The Hospital Job" (bible §7.2.5), the arc's moral event
 * horizon, plus its authored fail-forward rescue beat.
 *
 * PARALLAX wants a ward at Harbor Point General "re-scored": patient records quietly adjusted so
 * the insurer risk model reads the people in those beds as more expensive, and starts saying no.
 * Grace works that ward. Do it, refuse it, or fake it — protect the patients and fool Kroll.
 *
 * Hacking is fiction: the "job" is abstract records-tampering flavor with human stakes, never real
 * technique or real medicine.
 *
 * Sets (sole writer of `npc.grace.fate`): `npc.grace.fate` (left / whistleblower), the steering
 * flags `npc.grace.collateral`/`.whistleblower`, `fac.aperture.hospital_done/.faked_hospital`,
 * `w.enclosure` (+); may grant `item.kroll_recording` (the Social wire, bible §6). Publishes
 * `news.hospital_scandal` (delta owned by PKG-16).
 */
import { defineContent } from '@/engine/registry'
import type { QuestDef, SceneDef } from '@/engine/types'

const quest: QuestDef = {
  id: 'fac_aperture_q5_hospital',
  title: 'Special Accounts: The Hospital Job',
  kind: 'faction',
  act: 3,
  faction: 'fac.aperture',
  giver: 'kroll',
  priority: 25,
  autoStart: {
    all: [
      { quest: 'fac_aperture_q3_competitor', status: 'completed' },
      { var: 'act', eq: 3 },
      { faction: 'fac.aperture', gte: 50 },
    ],
  },
  rewards: 'The last line you have — and what\'s on the other side of it',
  summary:
    'PARALLAX wants a ward at Harbor Point General re-scored, so the insurance model starts saying no to people in beds. Grace works that ward. This is the job Aperture has been walking you toward since the first dinner.',
  start: 'ward',
  stages: {
    ward: {
      text:
        'Kroll needs a ward "reconciled" at Harbor Point General. The math turns sick people into expensive people and then into denied people. Grace is on that ward tonight. Decide who you are.',
      onEnter: [{ scene: 'aperture_hospital' }, { npc: 'grace', met: true }],
      objectives: [
        {
          id: 'answer',
          text: 'Answer Aperture on the Hospital Job',
          when: { flag: 'fac.aperture.hospital_resolved' },
          hint: 'This is the moral floor of the whole arc. There is a hard Opsec play that spares the ward and fools Kroll — and a way to get her on record first. Get caught at either and Kroll stops being patient with you, and starts being patient with Grace. (Anyone you lost to Aperture the night of the Enclosure may be working the other side of that rescue.)',
        },
      ],
    },
  },
}

const hospital: SceneDef = {
  id: 'aperture_hospital',
  channel: 'dialog',
  title: 'The Hospital Job',
  from: 'kroll',
  start: 'intro',
  nodes: {
    intro: {
      speaker: 'kroll',
      text: [
        'She meets you in the hospital\'s own café, because she thinks it\'s funny, and because Kroll is never more relaxed than at the scene of the thing. "Harbor Point General," she says, stirring a tea she won\'t drink. "Oncology and cardiac, the fourth floor. PARALLAX has a blind spot up there. Records are messy. We\'d like them tidy."',
        '"Tidy" means re-scored. It means the model looks at a floor full of people fighting for their lives and, once you\'re done, sees a floor full of liabilities. The letters go out a month later. Coverage denied. Pre-existing. Try our appeals line.',
        { if: { flag: 'fac.aperture.ridgeline_botched' }, text: '"After Ridgeline, Miles told me not to call you." She smiles into the tea. "I told Miles that people who fail interestingly are the only ones worth a second job. Don\'t make me wrong in front of him."' },
      ],
      next: 'stakes',
    },
    stakes: {
      speaker: 'kroll',
      text: [
        '"It\'s a data job," she says, reading your face and answering it. "You won\'t touch a single patient. You\'ll touch a spreadsheet. I know that isn\'t the same to you. I\'m telling you it is the same to the machine, and the machine is what pays." She sets a number on the table, folded. It is enormous.',
        {
          if: { npc: 'grace', romance: ['flirting', 'dating', 'partner', 'engaged', 'married'] },
          text: 'Across the café, through the glass, you can see the fourth-floor elevator. Grace came off shift twenty minutes ago and is still here, sitting with someone\'s frightened family because that\'s who she is. She doesn\'t know you\'re in the building. She doesn\'t know what\'s in the folded paper.',
          else: 'You know the nurse who runs nights on that floor — Grace, steady hands, sees straight through people. If those letters go out, she\'s the one who has to stand in the doorway and explain them.',
        },
      ],
      next: 'wire_prompt',
    },
    wire_prompt: {
      speaker: 'narrator',
      text:
        'Kroll has never been this direct. She has never had to be. If you were ever going to get her saying the quiet part into something that remembers, it is right now, in a hospital café, over a tea she won\'t drink.',
      choices: [
        {
          text: 'Wire yourself. Get her asking for this, in her own voice.',
          tag: '[Social 18]',
          check: {
            skill: 'social',
            dc: 18,
            bonuses: [
              { if: { trait: 'silver_tongue' }, add: 2, label: '+2 (silver tongue)' },
              { if: { flag: 'fac.aperture.suspect_you' }, add: -2, label: '−2 (she already suspects you)' },
            ],
            success: 'wired_ok',
            fail: 'wired_bad',
            successEffects: [{ item: 'kroll_recording' }],
            failEffects: [{ flag: 'npc.kroll.wary' }, { stat: 'stress', add: 6 }],
          },
        },
        { text: 'Don\'t risk it. Just answer her.', tag: '[Skip]', goto: 'decide' },
      ],
    },
    wired_ok: {
      speaker: 'player',
      text:
        'You keep her talking — about the model, the letters, the fourth floor, all of it — and let the little machine in your pocket do the remembering. She gives you the whole thing, warm and reasonable and utterly damning, and never once suspects, because Kroll believes she\'s the only one at the table who records people.',
      next: 'decide',
    },
    wired_bad: {
      speaker: 'kroll',
      text:
        'Her eyes flick to your jacket, once, and something behind them closes a drawer. "You\'re fidgeting," she says lightly, and slides her chair back six inches, and everything she says after that is boilerplate you could read off a brochure. You got nothing but her attention, and now you have all of it.',
      next: 'wired_caught',
    },
    wired_caught: {
      speaker: 'kroll',
      text: [
        'Then she holds out her hand, palm up, the way you\'d ask a child for the thing in their fist. "The jacket pocket, darling. The left one. I\'d rather not ask Miles to ask."',
        'Across the café, a grey man you hadn\'t noticed puts down a newspaper he wasn\'t reading.',
      ],
      choices: [
        {
          text: 'Hand her the recorder.',
          effects: [{ flag: 'fac.aperture.wire_burned' }, { faction: 'fac.aperture', add: -6 }],
          goto: 'wire_drowned',
        },
        {
          tag: '[Lie]',
          text: '"It\'s a pager. Old habit — I fidget when the numbers get big." Hold her eyes and make it true.',
          check: {
            skill: 'social',
            dc: 16,
            bonuses: [{ if: { trait: 'silver_tongue' }, add: 2, label: '+2 (silver tongue)' }],
            success: 'wire_lie_ok',
            fail: 'wire_lie_bad',
            failEffects: [
              { flag: 'fac.aperture.wire_burned' },
              { flag: 'fac.aperture.suspect_you' },
              { trait: 'pkg06_aperture_open_file' },
              { faction: 'fac.aperture', add: -10 },
              { stat: 'heat', add: 10 },
            ],
          },
        },
      ],
    },
    wire_drowned: {
      speaker: 'kroll',
      text: [
        'She turns the little machine over once, admiring it the way you\'d admire a child\'s drawing, then drops it into the tea she was never going to drink. It fizzes, briefly, like a thought.',
        '"There. Now we can talk like adults." She is not angry. She is something worse: pleased that you tried. "I\'ll remember this. Not as a grudge. As a compliment. Nobody has wired me since 1994, and he was very good, and he sells insurance now."',
      ],
      next: 'decide',
    },
    wire_lie_ok: {
      speaker: 'kroll',
      text: 'She studies you for a long three seconds, then withdraws her hand and laughs, softly, at herself. "A pager. God. I\'m getting paranoid in my old age. Miles is rubbing off on me." The grey man picks his newspaper back up. Your heart does not slow down for an hour.',
      next: 'decide',
    },
    wire_lie_bad: {
      speaker: 'hollis',
      text: [
        'The grey man is at your elbow before you finish the sentence. Miles Hollis lifts the recorder out of your pocket with two fingers, like a man removing a hair from soup, and reads the little red light as if it were a signature.',
        '"A pager," he says, to nobody. He pockets it. "You are, at present, an open file." Kroll watches the whole thing over the rim of her cup with an expression you will spend years trying to name. "Sit down, darling," she says. "We still have business. We always still have business."',
      ],
      next: 'decide',
    },
    decide: {
      speaker: 'kroll',
      text: '"So," Kroll says, unfolding the paper so you can both see the number. "What are we doing on the fourth floor?"',
      choices: [
        {
          text: 'Take the number. Re-score the ward.',
          tag: '[Do it]',
          effects: [
            { money: 18000 },
            { faction: 'fac.aperture', add: 20 },
            { stat: 'heat', add: 15 },
            { var: 'w.enclosure', add: 1 },
            { flag: 'fac.aperture.hospital_done' },
            { flag: 'fac.aperture.hospital_resolved' },
            { npc: 'grace', fate: 'left' },
            {
              if: { npc: 'grace', romance: ['flirting', 'dating', 'partner', 'engaged', 'married'] },
              then: [{ npc: 'grace', romance: 'ex' }],
            },
            { news: 'hospital_scandal' },
          ],
          goto: 'did_it',
        },
        {
          text: '"No. Not this. Take your tea and go."',
          tag: '[Refuse]',
          effects: [
            { faction: 'fac.aperture', add: -25 },
            { flag: 'fac.aperture.hospital_resolved' },
            { npc: 'grace', fate: 'whistleblower' },
            { flag: 'npc.grace.whistleblower' },
            { stat: 'cred', add: 4 },
          ],
          goto: 'refused',
        },
        {
          text: 'Deliver a "reconciliation" that changes nothing and looks like everything.',
          tag: '[Opsec 20]',
          check: {
            skill: 'opsec',
            dc: 20,
            success: 'faked_ok',
            fail: 'faked_bad',
            bonuses: [
              { if: { skill: 'social', gte: 40 }, add: 2, label: '+2 (you can talk past the desk)' },
              { if: { flag: 'fac.aperture.wire_burned' }, add: -2, label: '−2 (she\'s watching your hands now)' },
              { if: { flag: 'fac.aperture.hollis_file' }, add: -2, label: '−2 (Hollis has an open file on you)' },
              { if: { flag: 'fac.loft.dawn_drifted' }, add: -2, label: '−2 (DialUpDawn audits Aperture\'s reconciliations now)' },
              { if: { flag: 'fac.loft.dawn_stung' }, add: -1, label: '−1 (and she audits yours personally)' },
              { if: { flag: 'fac.aperture.audit_passed' }, add: 1, label: '+1 (Compliance thinks you\'re boring)' },
            ],
            successEffects: [
              { money: 12000 },
              { faction: 'fac.aperture', add: 8 },
              { flag: 'fac.aperture.faked_hospital' },
              { flag: 'fac.aperture.hospital_resolved' },
              { npc: 'grace', affinity: 15 },
              { stat: 'cred', add: 3 },
            ],
            failEffects: [
              { faction: 'fac.aperture', add: -10 },
              { flag: 'fac.aperture.suspect_you' },
              { flag: 'fac.aperture.hospital_resolved' },
              { flag: 'npc.grace.collateral' },
              { stat: 'heat', add: 20 },
              { scene: 'aperture_grace_rescue', delayHours: 18 },
            ],
          },
        },
      ],
    },
    did_it: {
      speaker: 'narrator',
      text: [
        'It takes an afternoon. You never see the fourth floor. You touch a spreadsheet, exactly as promised, and a month later a hundred and eleven letters go out with a logo on them and a phone number nobody answers.',
        'Grace works out what happened faster than Aperture ever will — she watches her own patients get the letters, she knows the timing, and she knows you. She doesn\'t scream. She just stops looking at you like you\'re someone she\'s decided about. The next time you reach for her, there\'s no one there.',
      ],
      next: 'did_it_end',
    },
    did_it_end: {
      speaker: 'kroll',
      text:
        '"There," Kroll says, gentle as a nurse herself. "The world didn\'t end. It never does. It just gets a little more expensive for the people who can\'t argue." She pays for your coffee. You are, now, exactly what she needed you to be, and she would never rub it in. That\'s what makes it unbearable.',
    },
    refused: {
      speaker: 'narrator',
      text: [
        'You push the folded paper back across the table. Kroll looks at it, then at you, and — this is the part that stays with you — she looks *pleased*, in some remote wing of herself. "Good," she says quietly. "Someone should still be able to."',
        'Then Compliance takes over, and the warmth is gone. But Grace hears, later, that someone stood in front of the letters and said no, and she works out who, and she does the thing you couldn\'t: she takes it public. She saves the ward and burns her own career doing it.',
      ],
      next: 'refused_end',
    },
    refused_end: {
      speaker: 'grace',
      text:
        '"You had the number in your hand," Grace says, when it\'s all over and she\'s unemployed and the fourth floor still has its coverage. "And you gave it back." She almost smiles. "I\'m going to go on the record about all of it. You should be somewhere very boring when I do." It is, from her, a way of saying goodbye that leaves the door open.',
    },
    faked_ok: {
      speaker: 'player',
      text: [
        'You build Aperture a masterpiece of nothing. The reconciliation report is beautiful — audited, cross-checked, exactly the shape Kroll expects — and it moves not one patient by one point. The fourth floor keeps its coverage and never knows how close it came. Kroll gets her afternoon\'s work and never sees the hollow center.',
        'Grace notices the letters that didn\'t come. She doesn\'t know it was you, but she knows the ward got lucky, and she starts saving you a coffee for reasons she can\'t name.',
      ],
      next: 'faked_ok_end',
    },
    faked_ok_end: {
      speaker: 'narrator',
      text:
        'You fooled the market and protected the beds and got paid for both. It is the best you have felt in a long time, and you will spend the rest of the arc praying Kroll never re-runs the numbers.',
    },
    faked_bad: {
      speaker: 'kroll',
      text: [
        'She re-runs the numbers. Of course she does; she re-runs everything. Two weeks later she calls, and there\'s no warmth in it at all — just the flat, final register she keeps for closing files. "Your reconciliation didn\'t reconcile anything," she says. "That was a choice. I understand choices. I also understand that the nurse on that floor is the reason you made it."',
        'She hangs up. She doesn\'t threaten you. She threatens the only thing that would work, and she does it by naming it and saying nothing else. Grace is exposed now, and Aperture is a patient, patient organization.',
        { if: { flag: 'fac.loft.dawn_drifted' }, text: 'The audit note on your reconciliation is initialed D.D. You know those initials. You tried to talk them out of a fountain once, at midnight, on a pager, and failed. She did a beautiful job on your work. She always did beautiful work.' },
        { if: { flag: 'fac.loft.dawn_stung' }, text: 'Under the initials, in the margin, one line in pencil that Kroll either didn\'t notice or left there on purpose: "not boring."' },
      ],
      next: 'faked_bad_end',
    },
    faked_bad_end: {
      speaker: 'narrator',
      text:
        'You spared the ward and Kroll spotted the seam. Now Compliance has a reason to be interested in Grace, and you have about a day to get to her first. Watch your mail.',
    },
  },
}

const rescue: SceneDef = {
  id: 'aperture_grace_rescue',
  channel: 'dialog',
  title: 'Get Her Out',
  from: 'grace',
  pause: true,
  start: 'call',
  nodes: {
    call: {
      speaker: 'grace',
      text: [
        'Grace calls at 2 a.m., which is when nurses call, because that\'s when the world is honest. "There was a man in the parking structure," she says, too steady. "He knew my shift. He knew my car. He asked how the fourth floor was doing." A breath. "That\'s you, isn\'t it. That\'s your world, reaching into mine."',
        {
          if: { flag: 'fac.loft.gus_drifted' },
          text: '"He wasn\'t scary, that\'s the thing," she adds. "Thirties. Tired. He had a kid\'s crayon drawing clipped to his sun visor, and he sounded like he hated every word." You know exactly who that is. GreyHat_Gus. You failed to talk him out of a fountain once, and Aperture sent him to stand in a parking garage and frighten a nurse.',
        },
        'Compliance is making a point, the way Aperture makes points: quietly, with plausible deniability, aimed at the soft place. You have tonight to get her clear.',
      ],
      next: 'plan',
    },
    plan: {
      speaker: 'player',
      text: 'You tell her to leave the car, take nothing, and meet you. Then you go to work making Miles Hollis lose interest in a nurse.',
      choices: [
        {
          text: 'Bury her: scrub her from every list Aperture pulls from.',
          tag: '[Opsec 18]',
          check: {
            skill: 'opsec',
            dc: 18,
            success: 'buried',
            fail: 'exposed',
            bonuses: [
              { if: { item: 'kroll_recording' }, add: 3, label: '+3 (you have Kroll on record)' },
              { if: { flag: 'fac.loft.dawn_drifted' }, add: -1, label: '−1 (DialUpDawn built the lists you\'re scrubbing)' },
              { if: { flag: 'fac.aperture.hollis_file' }, add: -1, label: '−1 (Hollis is already watching you)' },
            ],
            successEffects: [
              { npc: 'grace', affinity: 20 },
              { faction: 'fac.aperture', add: -6 },
            ],
            failEffects: [
              { stat: 'heat', add: 15 },
              { trait: 'pkg06_aperture_parking_structure' },
              { flag: 'fac.aperture.grace_threads' },
            ],
          },
        },
        {
          tag: '[Social DC 14]',
          text: 'Page GreyHat_Gus. Ask him what his kid would think of tonight\'s job.',
          if: { flag: 'fac.loft.gus_drifted' },
          check: {
            skill: 'social',
            dc: 14,
            bonuses: [{ if: { trait: 'empath' }, add: 2, label: '+2 (you remember what he was afraid of)' }],
            success: 'gus_stands_down',
            fail: 'gus_reports',
            successEffects: [
              { flag: 'fac.loft.gus_came_back' },
              { npc: 'grace', affinity: 16 },
              { faction: 'fac.aperture', add: -4 },
              { faction: 'fac.loft', add: 3 },
            ],
            failEffects: [
              { stat: 'heat', add: 10 },
              { faction: 'fac.aperture', add: -6 },
              { trait: 'pkg06_aperture_parking_structure' },
              { flag: 'fac.aperture.grace_threads' },
            ],
          },
        },
        {
          tag: '[Social DC 15]',
          text: 'Page Modem_Marisol. She runs Aperture\'s helpdesk now. Ask her to lose one ticket.',
          if: { flag: 'fac.loft.marisol_drifted' },
          check: {
            skill: 'social',
            dc: 15,
            bonuses: [
              { if: { trait: 'empath' }, add: 2, label: '+2 (you heard her, the night she left)' },
              { if: { flag: 'fac.loft.coop' }, add: 1, label: '+1 (the co-op still has her billing rate on file)' },
              { if: { flag: 'fac.loft.marisol_stung' }, add: -2, label: '−2 (the last time you called, you asked her to fix it for free)' },
              { if: { all: [{ flag: 'fac.loft.marisol_drifted' }, { not: { flag: 'fac.loft.marisol_stung' } }] }, add: 1, label: '+1 (you let her go kindly)' },
            ],
            success: 'marisol_loses_it',
            fail: 'marisol_files_it',
            successEffects: [
              { flag: 'fac.loft.marisol_helped' },
              { npc: 'grace', affinity: 14 },
              { faction: 'fac.aperture', add: -4 },
              { faction: 'fac.loft', add: 2 },
            ],
            failEffects: [
              { flag: 'fac.loft.marisol_filed' },
              { stat: 'heat', add: 8 },
              { faction: 'fac.aperture', add: -4 },
              { trait: 'pkg06_aperture_parking_structure' },
              { flag: 'fac.aperture.grace_threads' },
            ],
          },
        },
        {
          text: 'Trade for her: hand Hollis a folder in exchange for leaving her alone.',
          tag: '[Give Aperture a win]',
          effects: [
            { faction: 'fac.aperture', add: 8 },
            { var: 'w.enclosure', add: 1 },
            { npc: 'grace', affinity: 6 },
          ],
          goto: 'traded',
        },
      ],
    },
    buried: {
      speaker: 'narrator',
      text:
        'You take Grace off every list Aperture reads from, cleanly, before Compliance can act on any of it. By morning, as far as PARALLAX is concerned, she\'s a woman who buys yogurt and pays her rent early. Hollis, denied a lever, closes the tab. She\'s a ghost now, and safe, and she looks at you differently — not warmer, exactly, but like someone who finally understands the shape of what you carry.',
      next: 'coda',
    },
    exposed: {
      speaker: 'narrator',
      text: [
        'You get most of the way there. Grace is out of the immediate reach, moved and quiet — but you left threads, and Aperture is nothing if not patient with a loose thread.',
        'A week later the charge nurse gets a courtesy call from "Harbor Point\'s insurance partner" asking about staff who discuss patient scoring outside the building. Nobody says Grace\'s name. Nobody has to. She starts getting the night shifts nobody wants, and she starts checking her mirrors, and so do you.',
      ],
      next: 'exposed_talk',
    },
    exposed_talk: {
      speaker: 'grace',
      text: [
        'She meets you at the Cathode, but she doesn\'t take off her coat. "I changed my locks," she says. "I\'m not giving you the new key. Not because I think you\'d hurt me. Because I think someone would follow you to my door."',
        '"I need you out of my life for a while. I don\'t know how long a while is. I\'m asking you to let me find out."',
      ],
      choices: [
        {
          text: '"Okay." Let her go. It\'s the only protection you have left to give her.',
          effects: [
            { if: { npc: 'grace', romance: ['flirting', 'dating', 'partner', 'engaged'] }, then: [{ npc: 'grace', romance: 'ex' }] },
            { npc: 'grace', affinity: 4 },
            { stat: 'mood', add: -8 },
          ],
          goto: 'coda_alone',
        },
        {
          tag: '[Social DC 17]',
          text: '"Let me carry some of it. Not the key. Just — let me be the one who checks the mirrors with you."',
          check: {
            skill: 'social',
            dc: 17,
            bonuses: [
              { if: { trait: 'empath' }, add: 2, label: '+2 (you hear what she\'s actually asking)' },
              { if: { npc: 'grace', affinityGte: 50 }, add: 2, label: '+2 (she wants to be talked into it)' },
            ],
            success: 'exposed_stays',
            fail: 'exposed_lost',
            successEffects: [{ npc: 'grace', affinity: 6 }],
            failEffects: [
              { if: { npc: 'grace', romance: ['flirting', 'dating', 'partner', 'engaged'] }, then: [{ npc: 'grace', romance: 'ex' }] },
              { npc: 'grace', affinity: -10 },
              { stat: 'mood', add: -10 },
            ],
          },
        },
      ],
    },
    exposed_stays: {
      speaker: 'grace',
      text: '"...you\'re very annoying," she says, and takes off the coat. "Fine. You check the mirrors. I check you. That\'s the deal, and it\'s a bad deal, and I\'m a nurse, I take bad deals all night." She doesn\'t give you the key. She does sit down.',
      next: 'coda',
    },
    exposed_lost: {
      speaker: 'grace',
      text: '"That\'s exactly what someone says right before they get somebody hurt." She says it without any anger at all, which is how you know it\'s final. She pays for her coffee, and yours, and leaves by the kitchen door so nobody watching the front sees which way she goes.',
      next: 'coda_alone',
    },
    coda_alone: {
      speaker: 'narrator',
      text: 'The booth feels very large. Somewhere across the city a nurse is driving home a different way every night, because of you and for you, and she will never tell you which way. That is the shape of what you carry now. It fits in a parking garage.',
    },
    gus_stands_down: {
      speaker: 'narrator',
      text: [
        'He picks up on the fourth ring. You don\'t say hello. You say, "Does she still draw you on the sun visor?" and there is a silence on the line you could park a car in.',
        '"...they told me she was a risk," Gus says finally. "A nurse. They said \'risk\' like it was a diagnosis." Another silence. "I\'m done. I\'m telling Hollis she\'s a dead end. I\'m telling him I\'m a dead end too." He hangs up. By morning his Aperture badge is in a storm drain on Harbor Street, and Grace has a parking structure she can walk through again.',
      ],
      next: 'coda',
    },
    gus_reports: {
      speaker: 'narrator',
      text: [
        'He picks up on the fourth ring, and you say the kid thing, and he goes very quiet in a way that is not the good kind.',
        '"You don\'t get to use my kid on me," Gus says. "Not you. You had your night on the pager." He hangs up, and twenty minutes later Hollis knows exactly who called his parking-structure man at 2 a.m. and why. You try to bury her anyway, fast and angry. You leave threads.',
      ],
      next: 'exposed',
    },
    marisol_loses_it: {
      speaker: 'narrator',
      text: [
        '"helpdesk, this is marisol." She sounds exactly the same: tired, kind, already fixing something. You tell her about the nurse and the parking structure, and the request that is going to come through her queue before dawn to pull a staff file from Harbor Point General.',
        'A long silence, full of a chair that doesn\'t squeak. "you know they log my keystrokes, right." Another silence. "ok. it\'s a duplicate. it\'s a duplicate of a duplicate. nobody ever reopens those. i\'ve been closing them since i was nineteen."',
        'At 3:12 a.m. the ticket closes. Before she hangs up she says, "don\'t call this number again. i mean that nicely." You believe both halves.',
      ],
      next: 'coda',
    },
    marisol_files_it: {
      speaker: 'narrator',
      text: [
        '"helpdesk, this is marisol." You tell her everything, too fast, and she listens all the way to the end, the way she always did.',
        { if: { flag: 'fac.loft.marisol_stung' }, text: '"you\'re calling me at night to ask me to fix something," she says, before you\'re finished. "again." It isn\'t cruel. It\'s just true, and you both hear it.' },
        '"i can\'t." Very quietly. "they log my keystrokes. i have a badge that beeps when i leave the floor. i have a lease." A breath that shakes. "i\'m so tired. i\'m sorry. i have to file it the way it came in."',
        'She does. She adds a note, because the form requires a note, that someone called the helpdesk at 2:40 a.m. asking about it. Twenty minutes later Miles Hollis has a timestamp and a phone number. You try to bury Grace anyway, fast and angry. You leave threads.',
      ],
      next: 'exposed',
    },
    traded: {
      speaker: 'narrator',
      text:
        'You give Hollis exactly what he wants — a folder, a name, someone else\'s bad month — and he loses interest in Grace the instant she stops being the cheapest way to hurt you. She\'s safe. You paid for it in the only currency Aperture takes, and you can feel the balance shifting one more click toward them.',
      next: 'coda',
    },
    coda: {
      speaker: 'grace',
      text:
        'She meets you at the Cathode with a bag she packed in four minutes. "I\'m not going to ask what you did," she says. "I\'ve decided I don\'t want to be able to answer that under oath." She sits down across from you anyway. That she still sits down is the whole miracle of her.',
    },
  },
}

export default defineContent({
  quests: [quest],
  scenes: [hospital, rescue],
})
