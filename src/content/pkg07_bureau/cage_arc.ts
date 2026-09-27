/**
 * PKG-07 — Calderon / PD Cyber "the Cage" mini-arc (bible §7.8) — the clean-law route.
 *
 * Detective Ruth Calderon runs the Port Lumen PD Cyber Unit out of a chain-link corner of the
 * evidence floor: three detectives, one closet of confiscated hardware, a modem from 1997. She is
 * local, stubborn, broke — and, crucially, not the Bureau. Three beats: the post-raid interview
 * (q1), feeding her a real Aperture case in Act III (q2), and the Act IV clean-law arrest (q3).
 *
 * Ownership (bible §13, §4.6): this package writes `npc.calderon.fate` and `.ally_case`. It reads
 * `a2.first_raid_resolved` (PKG-02) to open, the evidence items (PKG-00), and `fac.bureau` rep to
 * decide whether the feds squeezed her out. Kroll's fate stays owned by PKG-06 — the clean arrest
 * reacts to it in text but never writes it.
 *
 * Voice: Calderon is the underdog with a grudge and a conscience — gallows-dry, generous with the
 * worst coffee in the precinct, and completely unbought.
 *
 * Fail branches (REDESIGN_V2 §D): a slip in the interview leaves a folded page in her pocket
 * (`npc.calderon.saw_your_shape`, read in q2/q3); a frayed dig in q2 brings the trace home to her
 * desk — wear the heat, re-route it ([OpSec DC 16]), or let her be squeezed out of the Cage
 * (`npc.calderon.squeezed`, fate `forced_out` on the spot). A surviving half-case opens the q2
 * "rest" stage: bring her real evidence before Act IV and she still gets `npc.calderon.ally_case`.
 */
import { defineContent } from '@/engine/registry'
import type { Cond, QuestDef, SceneDef } from '@/engine/types'

// The player is holding something a detective could actually build a case on.
const hasEvidence: Cond = {
  any: [{ item: 'aperture_sample' }, { item: 'kroll_recording' }, { item: 'priya_proof' }],
}

// Some contact with the Bureau (informant, or rep swung either way) — she'll bite on the "feds" line.
const bureauKnown: Cond = {
  any: [{ flag: 'fac.bureau.informant' }, { faction: 'fac.bureau', gte: 1 }, { faction: 'fac.bureau', lte: -1 }],
}

const scenes: SceneDef[] = [
  // ── q1 — The Interview ─────────────────────────────────────────────────────
  {
    id: 'cage_interview',
    channel: 'dialog',
    from: 'calderon',
    title: 'The Cage',
    start: 'room',
    nodes: {
      room: {
        speaker: 'calderon',
        effects: [{ npc: 'calderon', met: true, affinity: 2 }],
        text: [
          'The interview room is behind a chain-link partition everyone calls the Cage, next to a closet of confiscated towers and a coffee maker that predates most of the suspects. Detective Ruth Calderon drops a folder that\'s mostly air.',
          '"I\'ve got a budget of nothing and a modem from 1997, and I\'m still going to ruin somebody\'s year. Question is whose. I\'m not the Bureau — those clowns get toys on loan and act like the toys were their idea. I\'m local. I stay after they leave."',
          'She slides a card across the table. No threats on it. Just a name and a number, and under the number, in pen: *when it\'s the right kind of bad.*',
        ],
        choices: [
          {
            text: 'Say nothing. Ask for a lawyer.',
            tag: '[OpSec]',
            check: {
              skill: 'opsec',
              dc: 14,
              success: 'silent_clean',
              fail: 'silent_slip',
              failEffects: [
                { flag: 'npc.calderon.saw_your_shape' },
                { stat: 'stress', add: 3 },
                { chance: 0.3, then: [{ complication: 'legal' }] },
              ],
            },
          },
          {
            text: 'Feel her out — is she really not the Bureau?',
            tag: '[Social DC 14]',
            check: {
              skill: 'social',
              dc: 14,
              success: 'read_ok',
              fail: 'read_bad',
              failEffects: [
                { npc: 'calderon', affinity: -3 },
                { stat: 'stress', add: 2 },
                { chance: 0.3, then: [{ complication: 'legal' }] },
              ],
            },
          },
          {
            text: 'Tell her the feds are the real problem here.',
            tag: '[Talk]',
            if: bureauKnown,
            goto: 'feds',
          },
          {
            text: 'Take the card. Leave.',
            goto: 'leave',
          },
        ],
      },
      silent_clean: {
        speaker: 'calderon',
        text: [
          'You give her a wall, cleanly, without the twitch that turns a wall into a tell. She actually looks pleased. "Good. People who talk in here are usually the ones with nothing worth saying."',
          'She taps the card. "Keep it. I only chase the ones who deserve chasing. When you meet one — and in this town you will — you\'ll know which number to call."',
        ],
        effects: [{ flag: 'npc.calderon.interviewed' }],
      },
      silent_slip: {
        speaker: 'calderon',
        text: [
          'You mean to give her nothing and instead give her a shape: a pause in the wrong place, a name you almost say. She doesn\'t pounce. She just writes something small and underlines it once.',
          '"Relax. I\'m not building a case on you today. Today I\'m building a picture. You just told me you\'ve got somebody worth protecting." She smiles, not unkindly. "That\'s a start."',
          'She tears the page out of the pad, folds it once, and puts it in her breast pocket instead of the folder. You would have preferred the folder. Folders get lost.',
        ],
        effects: [{ flag: 'npc.calderon.interviewed' }, { stat: 'heat', add: 5 }],
      },
      read_ok: {
        speaker: 'calderon',
        text: [
          'You watch her the way she\'s watching you, and what you see isn\'t a fed. It\'s a person who has been told "leave it alone" one too many times and stopped listening. When you steer the talk toward Aperture, something behind her eyes leans forward.',
          '"Data-hygiene firm in Millgate. Real quiet. Real clean. Too clean." She says it like she\'s been saving it. "You ever find something with their fingerprints on it — real, provable, not a rumor — you bring it here. Not to the Bureau. Here. They\'d bury it. I\'d hang it on the wall."',
        ],
        effects: [{ flag: 'npc.calderon.interviewed' }, { flag: 'npc.calderon.trust_seed' }, { npc: 'calderon', affinity: 5 }],
      },
      read_bad: {
        speaker: 'calderon',
        text: [
          'You push to read her and overplay it — one question too pointed, and now she\'s reading you instead. "Easy, kid. You\'re fishing in a police station. That\'s a special kind of dumb."',
          'She keeps it light, but you can feel the door you were trying to open quietly click shut for today. She still gives you the card. She\'s just going to make you earn the number twice — and on your way out, you see her pick up the desk phone and read your name off the intake sheet, slowly, the way you spell something for someone who is writing it down.',
        ],
        effects: [{ flag: 'npc.calderon.interviewed' }, { stat: 'cred', add: -2 }],
      },
      feds: {
        speaker: 'calderon',
        text: [
          '"Oh, I know," she says, before you finish. "I know exactly what the feds are. They roll in, requisition my one good hard drive, rent a machine off a company they\'re supposed to be investigating, and call it a task force." She drinks the terrible coffee like a punishment she\'s decided to keep taking.',
          '"So here\'s my pitch. When you\'ve got something on the people renting that machine out — you come to the underdog with the modem from 1997. I can\'t promise you much. I can promise you I won\'t sell it back to them."',
        ],
        effects: [{ flag: 'npc.calderon.interviewed' }, { flag: 'npc.calderon.trust_seed' }, { npc: 'calderon', affinity: 3 }],
      },
      leave: {
        speaker: 'narrator',
        text: [
          'You pocket the card and go. It rides in your wallet for a long time, working its way to the back, the way a thing you might need someday always does.',
        ],
        effects: [{ flag: 'npc.calderon.interviewed' }],
      },
    },
  },

  // ── q2 — A Real Case ───────────────────────────────────────────────────────
  {
    id: 'cage_real_case',
    channel: 'dialog',
    from: 'calderon',
    title: 'The Right Kind of Bad',
    start: 'ask',
    nodes: {
      ask: {
        speaker: 'calderon',
        text: [
          'She meets you at the Cathode this time, in the corner booth, because the Cage has ears now — federal ears, on loan, with a light that blinks. "I\'ve got a folder on Aperture three inches thick and not one page of it will survive a defense lawyer. I need a real thread. Something a judge can hold."',
          'She turns her mug in slow circles. "You\'re the kind of person who finds threads. So. Have you got one for me, or do I keep filing paper nobody reads?"',
          { if: { flag: 'npc.calderon.trust_seed' }, text: '"You read me right, back in the Cage. So I\'ll return the favor: if you go digging, their old vendor ledgers sit on a box nobody at Aperture remembers owning. Start there."' },
          { if: { flag: 'npc.calderon.saw_your_shape' }, text: 'She taps her breast pocket, where a folded page still lives. "I kept that shape you gave me in the interview room. The pause in the wrong place. I\'ve been filling it in on slow nights." She says it gently. "I\'d rather be filling in theirs."' },
        ],
        choices: [
          {
            text: 'Hand her what you\'re carrying.',
            tag: '[Evidence]',
            if: hasEvidence,
            goto: 'evidence',
          },
          {
            text: 'Dig one up for her.',
            tag: '[Intrusion DC 17]',
            check: {
              skill: 'intrusion',
              dc: 17,
              bonuses: [{ if: { flag: 'npc.calderon.trust_seed' }, add: 2, label: '+2 (she told you where to look)' }],
              success: 'dug_ok',
              fail: 'dug_bad',
            },
          },
          {
            text: 'Keep her out of it — this is too big for the Cage.',
            tag: '[Protect]',
            goto: 'protect',
          },
        ],
      },
      evidence: {
        speaker: 'calderon',
        text: [
          'You slide it across: the real thing, provable, with a chain you can testify to. She reads it once, then again, then puts her hand flat on it like it might blow away.',
          '"This is a case." She says it quietly, like a person who\'s waited years to be handed exactly this. "This is a real, actual, put-someone-in-a-courtroom case. I\'m going to build it slow and clean, and when I make the arrest, it\'s going to hold. Thank you. I mean that in a way I don\'t usually mean things."',
          'She buys you the worst coffee in Port Lumen to seal it. It is genuinely terrible. It is one of the better handshakes of your life.',
        ],
        effects: [
          { flag: 'npc.calderon.ally_case' },
          { npc: 'calderon', affinity: 6 },
          { faction: 'fac.bureau', add: -5 },
          { var: 'w.exposure', add: 1 },
          { flag: 'npc.calderon.q2_done' },
        ],
      },
      dug_ok: {
        speaker: 'calderon',
        text: [
          'You go and get it — a clean, careful pull, the kind that leaves a thread a detective can follow without anyone ever knowing you touched the far end. You hand it over like it grew on a tree.',
          '"I\'m not going to ask where this came from." She\'s already reading. "I\'m going to ask you to never tell me. And then I\'m going to build the case of my career on it. Deal?"',
        ],
        effects: [
          { flag: 'npc.calderon.ally_case' },
          { npc: 'calderon', affinity: 5 },
          { stat: 'heat', add: 5 },
          { var: 'w.exposure', add: 1 },
          { flag: 'npc.calderon.q2_done' },
        ],
      },
      dug_bad: {
        speaker: 'calderon',
        text: [
          'The pull goes wrong halfway — nothing that burns you tonight, but the thread frays in your hands, and what you carry back is half a case and a trace warm enough to worry about.',
          'She reads the partial and sighs the sigh of a woman who\'s read a hundred partials. "Not enough. Never enough. But it\'s more than I had, and I\'m a patient woman with a bad modem." She takes it back to the Cage to run it down from her own desk, where the federal ears on loan blink their little light.',
        ],
        effects: [{ stat: 'heat', add: 8 }, { npc: 'calderon', affinity: 2 }, { flag: 'npc.calderon.q2_done' }],
        next: 'dug_trace',
      },
      protect: {
        speaker: 'calderon',
        text: [
          '"Too big for the Cage." She says it back to you flat, and you can\'t tell if she\'s hurt or just tired. "Everything\'s too big for the Cage. That\'s the whole job." She lets it go. Mostly.',
          '"Alright. You keep your thread. Just — if it ever gets too big for you, too, you know which underdog to call." She leaves the coffee. You leave the coffee. Some things are sacred.',
          {
            if: { flag: 'npc.calderon.saw_your_shape' },
            text: 'At the door she touches her breast pocket. "Then I keep the page. Not to use. Just so somebody\'s holding it." For the next month a patrol car rolls past your building at odd hours, slow, the way a person rereads a sentence.',
          },
        ],
        effects: [
          { npc: 'calderon', affinity: -4 },
          { if: { flag: 'npc.calderon.saw_your_shape' }, then: [{ stat: 'heat', add: 5 }, { flag: 'npc.calderon.kept_the_page' }] },
          { flag: 'npc.calderon.q2_done' },
        ],
      },

      // ── The frayed pull comes home (REDESIGN_V2 §D) ─────────────────────────
      dug_trace: {
        speaker: 'narrator',
        text: [
          'The trace comes home on a Thursday. The frayed end you left behind tripped something in Millgate, and Millgate did what Millgate does: it called a friend. By noon the federal liaison with the blinking light in the Cage is asking Calderon, very politely, why her new partial on Aperture carries the same timestamps as an "intrusion attempt" Aperture\'s Compliance desk reported that morning.',
          'Your pager buzzes at 6 p.m. "they\'re asking about my thread. yours, i mean. i haven\'t said a word. i\'m going to have to say something by monday."',
        ],
        choices: [
          {
            tag: '[Take the heat]',
            text: 'Light yourself up. Make the frayed end so loud and so obviously some reckless kid\'s that nobody believes a detective ever touched it.',
            effects: [
              { stat: 'heat', add: 15 },
              { npc: 'calderon', affinity: 6 },
              { flag: 'npc.calderon.partial_case' },
              { chance: 0.5, then: [{ complication: 'hack' }] },
            ],
            goto: 'dug_heat',
          },
          {
            tag: '[OpSec DC 16]',
            text: 'Re-route the fray: walk it back until it dead-ends inside one of Aperture\'s own test boxes, so it reads like their system coughing in its sleep.',
            check: {
              skill: 'opsec',
              dc: 16,
              bonuses: [{ if: { trait: 'paranoid' }, add: 2, label: '+2 (you always leave yourself a back door)' }],
              success: 'dug_rerouted',
              fail: 'dug_squeezed',
              successEffects: [{ npc: 'calderon', affinity: 3 }, { flag: 'npc.calderon.partial_case' }],
              failEffects: [{ stat: 'heat', add: 10 }, { stat: 'stress', add: 6 }],
            },
          },
          {
            tag: '[Leave it]',
            text: 'Let her handle it. She\'s the cop. She knew what she was asking for.',
            effects: [{ npc: 'calderon', affinity: -8 }],
            goto: 'dug_squeezed',
          },
        ],
      },
      dug_heat: {
        speaker: 'narrator',
        text: [
          'You go back in the loud way, on purpose: sloppy hours, a signature swagger, a trail that practically signs its own name as some kid on the Row with more nerve than sense. It is the most careless work you have ever done, and you do it very, very carefully.',
          'By Monday the liaison has a new theory, and it isn\'t a detective. It\'s you — or someone exactly your shape. Calderon\'s thread survives, a little singed. Your heat does not come down for a long time.',
        ],
        next: 'dug_rest',
      },
      dug_rerouted: {
        speaker: 'narrator',
        text: 'You walk the fray back through three rooms nobody at Aperture remembers renting, and leave it curled up asleep inside a test box in Millgate. By Monday the "intrusion attempt" is a ticket in Aperture\'s own queue, marked SELF-INFLICTED — CONFIG DRIFT, and the federal liaison has lost interest in a precinct with a modem from 1997.',
        next: 'dug_rest',
      },
      dug_rest: {
        speaker: 'calderon',
        text: [
          '"Okay," she says when you meet, and lets out a breath she\'s been holding since Thursday. "Okay. I still have half a case, and nobody\'s taking my stapler."',
          '"Half isn\'t enough to hang anybody. But it\'s enough to hang the rest on. Bring me the rest — something real, with their fingerprints on it — before this city runs out of chapters. I\'ll keep the half warm."',
        ],
      },
      dug_squeezed: {
        speaker: 'calderon',
        text: [
          'Monday comes. She says the only true thing she can without saying your name: that the partial came from a confidential source, that she didn\'t ask how. The liaison writes it down in a very nice pen.',
          'It happens the slow way. A budget line gets "reviewed." The closet of confiscated towers gets requisitioned for a federal task force. The modem from 1997 goes in a box. By spring the Cage is a storage room with a chain-link door, and Detective Ruth Calderon is doing security consulting for a hardware store in Ridgeport.',
          '"Don\'t," she says, when you try to apologize, on the phone, from the hardware store. "Somebody had to wear it. I\'d rather it was me than the thread." A pause. "I kept the nameplate. It\'s in the glovebox. I look at it at red lights."',
        ],
        effects: [
          { flag: 'npc.calderon.squeezed' },
          { npc: 'calderon', fate: 'forced_out' },
          { faction: 'fac.hood', add: -3 },
          { stat: 'mood', add: -8 },
        ],
      },
    },
  },

  // ── q2b — The rest of it (the frayed thread's second chance) ───────────────
  {
    id: 'cage_the_rest',
    channel: 'chat',
    from: 'calderon',
    title: 'Calderon',
    expiresDays: 14,
    onExpire: [
      { flag: 'npc.calderon.case_cold' },
      { npc: 'calderon', affinity: -3 },
      { log: 'Calderon\'s half a case went cold in a drawer. She stopped asking.', kind: 'story' },
    ],
    start: 'open',
    nodes: {
      open: {
        text: [
          'hey. it\'s the underdog.',
          'word on the row is you\'re carrying something heavy with aperture\'s fingerprints on it. i\'m not asking what. i\'m asking if it\'s the rest of my half.',
        ],
        choices: [
          {
            tag: '[Evidence]',
            text: 'it is. same booth, tonight.',
            effects: [
              { flag: 'npc.calderon.ally_case' },
              { npc: 'calderon', affinity: 6 },
              { faction: 'fac.bureau', add: -5 },
              { var: 'w.exposure', add: 1 },
            ],
            goto: 'given',
          },
          {
            text: 'it\'s spoken for. i\'m sorry.',
            effects: [{ flag: 'npc.calderon.case_cold' }, { npc: 'calderon', affinity: -4 }],
            goto: 'kept',
          },
        ],
      },
      given: {
        text: [
          'ok.',
          'ok ok ok. i\'m going to put it next to the half and see if they\'re the same shape. i think they are. i think they\'ve been the same shape this whole time.',
          'coffee\'s on me. it will be terrible. that\'s the handshake.',
        ],
      },
      kept: {
        text: 'understood. half a case goes in the drawer, then. it\'s a good drawer. it\'s got a lot of halves in it. night, kid.',
      },
    },
  },

  // ── q3 — The Clean Arrest ──────────────────────────────────────────────────
  {
    id: 'cage_clean_arrest',
    channel: 'dialog',
    from: 'calderon',
    title: 'The One Who Cuffs',
    start: 'endgame',
    nodes: {
      endgame: {
        speaker: 'narrator',
        text: [
          'Years of the worst coffee in the precinct come down to a phone call at the end.',
          {
            if: { all: [{ flag: 'npc.calderon.ally_case' }, { not: { faction: 'fac.bureau', gte: 50 } }] },
            text: 'Calderon has a warrant with her name on the bottom and a case built slow and clean off the thread you gave her. "It\'ll hold," she says, and for once she isn\'t hoping. "Give me the word and I go make the collar the old-fashioned way. No task force. No renting anybody\'s machine. Just a detective, a warrant, and a very bad morning for the right person."',
          },
          {
            if: { flag: 'npc.calderon.squeezed' },
            text: 'The call comes from a hardware store in Ridgeport. Calderon has been out of the Cage since the spring the frayed thread came home, and she sounds almost cheerful about it, the way people do about a bruise they\'ve stopped pressing. "They\'re making the big arrests without me. Good. Somebody should." A pause. "Nobody\'s fixed the Cage\'s coffee maker, by the way. I checked. I still have a key."',
          },
          {
            if: { all: [{ faction: 'fac.bureau', gte: 50 }, { not: { flag: 'npc.calderon.squeezed' } }] },
            text: 'The Bureau has been standing on the Cage\'s air hose for years now, and the last of the budget went with the last agent to sneer at her modem. Calderon calls to tell you it\'s out of her hands — the feds took the case, the credit, and the closet of confiscated towers. "I built it. They\'re arresting it. That\'s policing, apparently." She keeps the Cage\'s old nameplate in her glovebox.',
          },
          {
            if: { all: [{ not: { flag: 'npc.calderon.ally_case' } }, { not: { faction: 'fac.bureau', gte: 50 } }, { not: { flag: 'npc.calderon.squeezed' } }] },
            text: 'The federal money finally came — a grant, a mandate, a real unit with real toys where the Cage used to be. Calderon runs it now, and she is not sure she likes what it\'s becoming. "Got everything I asked for and I miss the modem," she says. "Careful what you build a wall around. It stops being a cage for them and starts being one for you."',
          },
        ],
        choices: [
          {
            text: 'Give her the word. Let her make the collar.',
            tag: '[Clean arrest]',
            if: { all: [{ flag: 'npc.calderon.ally_case' }, { not: { faction: 'fac.bureau', gte: 50 } }] },
            goto: 'cuffs',
          },
          {
            text: 'Let it play out however it plays out.',
            goto: 'default',
          },
        ],
      },
      cuffs: {
        speaker: 'calderon',
        text: [
          'She does it herself. No SWAT, no cameras, no federal task force reading her lines. Just Detective Ruth Calderon, a warrant, and a very bad morning for the right person.',
          {
            if: { npc: 'kroll', fate: ['arrested', 'charged', 'cut_loose'] },
            text: 'She cuffs Kroll in the Aperture lobby, gently, and reads the rights like she means every word, while the receptionist Kroll has always greeted by name watches from behind the desk.',
            else: 'She reads the rights like she means every word — because she does, and because someone in this whole story finally gets to do the job the way the job is supposed to be done.',
          },
          '"That," she says, snapping the folder shut, "is what the Cage was for."',
        ],
        effects: [{ npc: 'calderon', fate: 'the_one_who_cuffs_you' }, { npc: 'calderon', affinity: 5 }, { flag: 'npc.calderon.q3_done' }],
      },
      default: {
        speaker: 'narrator',
        text: [
          { if: { flag: 'npc.calderon.squeezed' }, text: 'The arrests happen on the news, the way arrests do now: a podium, a flag, a task force thanking "our local partners" without naming one. Somewhere in Ridgeport a woman who built half the case watches it on a TV behind the paint counter and goes back to cutting keys.' },
          { if: { all: [{ faction: 'fac.bureau', gte: 50 }, { not: { flag: 'npc.calderon.squeezed' } }] }, text: 'The feds make the arrest, take the podium, and thank "our local partners" without naming one. Calderon watches it on a TV in a bar and buys a round for nobody.' },
          { if: { flag: 'npc.calderon.case_cold' }, text: 'The half a case you two survived stays in her drawer. She mentions it once, the way people mention a dog they had as a kid.' },
          { if: { all: [{ not: { faction: 'fac.bureau', gte: 50 } }, { not: { flag: 'npc.calderon.squeezed' } }] }, text: 'The Cage becomes a real unit, and Calderon becomes a real supervisor, and somewhere in the trade she stopped being the underdog with the modem. It\'s a promotion. She wears it like a slightly wrong-sized coat.' },
          { if: { flag: 'npc.calderon.kept_the_page' }, text: 'A week later a folded page arrives in a precinct envelope: the one from her breast pocket, the shape you gave her in the interview room. She never wrote a name on it. Under the pause and the almost-said word there is one line in pen: "Didn\'t need it. Wanted you to know I could have." You keep it with the card.' },
        ],
        effects: [
          {
            if: { any: [{ flag: 'npc.calderon.squeezed' }, { faction: 'fac.bureau', gte: 50 }] },
            then: [{ npc: 'calderon', fate: 'forced_out' }],
            else: [{ npc: 'calderon', fate: 'expanded' }],
          },
          { flag: 'npc.calderon.q3_done' },
        ],
      },
    },
  },
]

const quests: QuestDef[] = [
  {
    id: 'fac_cage_q1_interview',
    title: 'The Cage: The Interview',
    kind: 'faction',
    giver: 'calderon',
    priority: 15,
    rewards: 'A card, a number, and an underdog who isn\'t the Bureau',
    summary:
      'After the raid, a local detective wants a word. Ruth Calderon runs the PD Cyber Unit on spite and a modem from 1997. She\'s not the Bureau — and she\'d like that on the record.',
    autoStart: { flag: 'a2.first_raid_resolved' },
    start: 'interview',
    stages: {
      interview: {
        text: 'Detective Calderon has you behind the chain-link. She isn\'t building a case on you today — she\'s building a picture, and offering a card for when you meet the right kind of bad.',
        onEnter: [{ scene: 'cage_interview' }],
        objectives: [
          {
            id: 'sit',
            text: 'Sit for Calderon\'s interview',
            when: { flag: 'npc.calderon.interviewed' },
            hint: 'Open the dialog from Detective Calderon. Reading her right ([Social DC 14]) opens the clean-law route toward Aperture.',
          },
        ],
      },
    },
  },
  {
    id: 'fac_cage_q2_real_case',
    title: 'The Cage: A Real Case',
    kind: 'faction',
    giver: 'calderon',
    priority: 15,
    rewards: 'A clean-law road to Aperture (opens "let PD make the arrest")',
    summary:
      'Calderon has a folder on Aperture three inches thick and not one page that survives a defense lawyer. Give her a real thread — held evidence or a fresh pull — and she\'ll build the case of her career.',
    autoStart: { all: [{ quest: 'fac_cage_q1_interview', status: 'completed' }, { var: 'act', gte: 3 }] },
    start: 'case',
    stages: {
      case: {
        text: 'The Cage has federal ears now, so she meets you at the Cathode. She needs one real thread a judge can hold. Hand her evidence, dig one up ([Intrusion DC 17]), or keep her out of it.',
        onEnter: [{ scene: 'cage_real_case' }],
        objectives: [
          {
            id: 'feed',
            text: 'Give Calderon a case she can use — or decide not to',
            when: { flag: 'npc.calderon.q2_done' },
            hint: 'A real case sets her up to make a clean arrest in Act IV. Aperture evidence (a sample, a recording, Priya\'s proof) hands it over directly. Dig one up and fray it, and the trace comes home to her desk — decide fast who wears it.',
          },
        ],
        next: [{ if: { flag: 'npc.calderon.partial_case' }, stage: 'rest' }],
      },
      rest: {
        text: 'Calderon is keeping half a case warm — the frayed thread you both survived. It won\'t hang anyone by itself. Bring her the rest, something real with Aperture\'s fingerprints on it, before the city runs out of chapters.',
        objectives: [
          {
            id: 'rest',
            text: 'Bring Calderon the rest of the case',
            when: { any: [hasEvidence, { var: 'act', gte: 4 }] },
            hint: 'Aperture evidence — the sample, a Kroll recording, Priya\'s proof — finishes it. If Act IV arrives first, the half goes cold in her drawer.',
          },
        ],
        onComplete: [
          {
            if: { all: [hasEvidence, { var: 'act', lte: 3 }] },
            then: [{ scene: 'cage_the_rest' }],
            else: [
              { flag: 'npc.calderon.case_cold' },
              { npc: 'calderon', affinity: -3 },
              { log: 'Calderon\'s half a case went cold in a drawer. The city ran out of chapters first.', kind: 'story' },
            ],
          },
        ],
      },
    },
  },
  {
    id: 'fac_cage_q3_clean_arrest',
    title: 'The Cage: The One Who Cuffs',
    kind: 'faction',
    giver: 'calderon',
    priority: 20,
    rewards: 'A clean arrest — or a squeezed-out detective',
    summary:
      'The end of the clean-law road. If you fed her a real case and the feds didn\'t squeeze her out, Calderon makes the collar the old-fashioned way. If they did, she keeps the Cage\'s nameplate in her glovebox.',
    autoStart: {
      all: [
        { quest: 'fac_cage_q1_interview', status: 'completed' },
        { var: 'act', eq: 4 },
        { not: { quest: 'fac_cage_q2_real_case', status: 'active' } },
      ],
    },
    start: 'arrest',
    stages: {
      arrest: {
        text: 'Whatever the Cage became — a warrant with her name on it, a case the feds took, or a real unit she doesn\'t recognize — it comes down to one last call.',
        onEnter: [{ scene: 'cage_clean_arrest' }],
        objectives: [
          {
            id: 'closes',
            text: 'See how the Cage\'s story closes',
            when: { flag: 'npc.calderon.q3_done' },
            hint: 'The outcome depends on whether you gave her a real case and whether the Bureau squeezed her budget.',
          },
        ],
      },
    },
  },
]

export default defineContent({ scenes, quests })
