/**
 * PKG-04 — `main_a4_q1_reckonings` (bible §6.D): a quiet scene with each person still in your
 * life, then the §4.6 fate finalization. Started by `trig_act4_gate` (PKG-03); the matching
 * autoStart is a belt-and-braces duplicate of the same condition.
 *
 * Pacing: each reckoning arrives a few days after the previous one is finished (delivered with
 * `delayHours` from the stage's onEnter), so Act IV opens as a slow round of visits rather than a
 * pile of modal dialogs. Reckonings with people who are no longer around arrive as mail and count
 * as done on delivery, so the quest can never stall on an unread letter.
 *
 * The long-tail morning also takes stock of what Act III's failed rolls left behind: whoever pulled
 * you out after Meridian (`a3.burned_protector`), the redacted name on the list, the tape, the risk
 * score, a mirror still keeping score.
 */
import { defineContent } from '@/engine/registry'
import type { Cond, Effect, QuestStageDef } from '@/engine/types'
import { earlyFates, finalizeFates } from './fates'
import { all, any, fate, flag, met } from './shared'

const graceReckons: Cond = all(
  met('grace'),
  any({ npc: 'grace', romance: ['flirting', 'dating', 'partner', 'engaged', 'married'] }, fate('grace', ['whistleblower', 'collateral'])),
)

/** A reckoning stage: deliver the scene (or its letter variant), wait for its flag, skip if absent. */
function reckStage(opts: {
  who: string
  text: QuestStageDef['text']
  objective: string
  hint: string
  deliver: Effect[]
  next: string
}): QuestStageDef {
  return {
    text: opts.text,
    onEnter: opts.deliver,
    objectives: [{ id: 'reckon', text: opts.objective, when: flag(`a4.reck.${opts.who}`), hint: opts.hint }],
    next: opts.next,
  }
}

const skip = (who: string): Effect => ({ flag: `a4.reck.${who}` })

export default defineContent({
  quests: [
    {
      id: 'main_a4_q1_reckonings',
      title: 'Reckonings',
      kind: 'main',
      act: 4,
      priority: 100,
      autoStart: { var: 'act', gte: 4 },
      rewards: 'Fates settle · the last favors',
      summary: [
        'Act IV: The Long Tail. Nobody is calling with a job tonight. The calls you get now are the other kind: people you owe, people who owe you, people who want to see you one more time before whatever is coming comes.',
        'Sit down with each of them. What they become is mostly already decided. Mostly.',
      ],
      start: 'open',
      stages: {
        open: {
          text: 'The long tail. You wake up older than you expected to be, in a city that turned out the way you and everyone else made it. Take a morning to look at it.',
          onEnter: [...earlyFates(), { scene: 'a4_long_tail', delayHours: 6 }],
          objectives: [{ id: 'look', text: 'Take stock of the city', when: flag('a4.opened'), hint: 'A dialog opens on its own. Read it through.' }],
          next: 'jax',
        },
        jax: reckStage({
          who: 'jax',
          text: [
            {
              if: fate('jax', 'dead'),
              text: 'There is a hill above the Row with a view of the Sound. Jax always said it was wasted on the dead. Go and tell him he was right.',
              else: 'Jax wants to see you. He was the first person you ever built anything with; it is right that he is the first reckoning.',
            },
          ],
          objective: 'See Jax',
          hint: 'He will page you in a few days. The scene opens on its own.',
          deliver: [{ scene: 'a4_reck_jax', delayHours: 60 }],
          next: 'family',
        }),
        family: reckStage({
          who: 'family',
          text: [
            {
              if: fate('mom', 'passed'),
              text: 'Dad has started cooking Sunday dinner. It is not good. Go anyway. Kim will be there, and the chair nobody sits in.',
              else: 'Mom is making Sunday dinner, which means it is not a request. Kim will be there. So will every question you have been avoiding.',
            },
          ],
          objective: 'Go home for Sunday dinner',
          hint: 'Dinner is set for a few days from now. Just keep living; the scene opens on its own.',
          deliver: [{ scene: 'a4_reck_family', delayHours: 96 }],
          next: 'mira',
        }),
        mira: reckStage({
          who: 'mira',
          text: [
            {
              if: fate('mira', 'gone'),
              text: 'Mira left Port Lumen. There is a letter on its way that says so properly.',
              else: 'Mira. Whatever the two of you are to each other, it deserves one honest conversation before the end.',
            },
          ],
          objective: 'Settle things with Mira',
          hint: 'She reaches out when she is ready. If she is gone, watch your Mail.',
          deliver: [
            {
              if: all(met('mira'), fate('mira', ['casualty', 'dead'])),
              then: [skip('mira')],
              else: [
                {
                  if: fate('mira', 'gone'),
                  then: [{ scene: 'a4_reck_mira_letter', delayHours: 72 }],
                  else: [{ scene: 'a4_reck_mira', delayHours: 84 }],
                },
              ],
            },
          ],
          next: 'grace',
        }),
        grace: reckStage({
          who: 'grace',
          text: 'Grace works nights. She has always known when someone is hiding a wound. Tonight she is going to ask about yours.',
          objective: 'Talk to Grace',
          hint: 'She will be off shift soon. The scene opens on its own.',
          deliver: [{ if: graceReckons, then: [{ scene: 'a4_reck_grace', delayHours: 72 }], else: [skip('grace')] }],
          next: 'priya',
        }),
        priya: reckStage({
          who: 'priya',
          text: [
            {
              if: fate('priya', 'broken'),
              text: 'Priya left the city a long time ago. Some part of her never stopped writing to you.',
              else: 'Priya taught you rule one and rule two. There has always been a rule three. She has decided you are finally old enough to hear it.',
            },
          ],
          objective: 'Hear rule three',
          hint: 'Priya will find you. If she has left the city, look in your Mail.',
          deliver: [
            {
              if: met('priya'),
              then: [
                {
                  if: fate('priya', 'broken'),
                  then: [{ scene: 'a4_reck_priya_letter', delayHours: 72 }],
                  else: [{ scene: 'a4_reck_priya', delayHours: 96 }],
                },
              ],
              else: [skip('priya')],
            },
          ],
          next: 'corvid',
        }),
        corvid: reckStage({
          who: 'corvid',
          text: 'Corvid ran the board before you could spell your own handle. Whatever became of the Loft, she wants to talk about what happens to it next.',
          objective: 'Answer Corvid',
          hint: 'Corvid reaches out in her own way: in person, or on the board.',
          deliver: [
            {
              if: met('corvid'),
              then: [
                {
                  if: fate('corvid', 'exile'),
                  then: [{ scene: 'a4_reck_corvid_post', delayHours: 72 }],
                  else: [{ scene: 'a4_reck_corvid', delayHours: 96 }],
                },
              ],
              else: [skip('corvid')],
            },
          ],
          next: 'oracle',
        }),
        oracle: reckStage({
          who: 'oracle',
          text: [
            {
              if: flag('a3.oracle_revealed'),
              text: 'The Oracle wants a meeting. In person, for once. Whoever has been whispering to you all these years has one more thing to say, and it is about a building.',
              else: 'A message with no sender asks for a meeting. It is about a building.',
            },
          ],
          objective: 'Meet the Oracle',
          hint: 'The last reckoning. The scene opens on its own.',
          deliver: [{ scene: 'a4_reck_oracle', delayHours: 120 }],
          next: 'finalize',
        }),
        finalize: {
          text: 'The visits are done. The people in your life have become, mostly, who they were going to be. What you do with what you know is still yours.',
          onEnter: [...finalizeFates(), { flag: 'a4.fates_final' }, { log: 'The reckonings are over. Fates have settled.', kind: 'story' }],
          objectives: [{ id: 'settled', text: 'Let the fates settle', when: flag('a4.fates_final'), hint: 'This happens on its own.' }],
          onComplete: [{ quest: 'main_a4_q2_last_leverage', start: true }],
        },
      },
    },
  ],
  scenes: [
    {
      id: 'a4_long_tail',
      channel: 'dialog',
      title: 'The Long Tail',
      start: 'wake',
      nodes: {
        wake: {
          speaker: 'narrator',
          text: [
            'You wake at 6:40 without an alarm, which is new. Somewhere in the last few years your body started keeping its own schedule. It does not consult you.',
            'You are {age}. The coffee maker is the same one. The city outside the window is not.',
            { if: { var: 'w.broadband', gte: 3 }, text: 'Fiber went in under the street last spring. The modem that used to sing you to sleep is in a box in the closet, cable wrapped around it like a sleeping cat.' , else: 'Nobody dials up anymore. The modem that used to sing you to sleep is in a box in the closet, cable wrapped around it like a sleeping cat.' },
          ],
          next: 'city',
        },
        city: {
          speaker: 'narrator',
          text: [
            {
              if: flag('w.aperture_state', 'exposed'),
              text: 'Aperture Data Solutions still has its name on the Millgate building, but half the windows are dark and the lobby has a security guard reading the newspaper about his own employer.',
              else: 'Aperture Data Solutions has a new glass annex in Millgate. The billboard on the overpass says TRUST IS A DATA POINT. Nobody on the Row has ever found it reassuring.',
            },
            {
              if: { var: 'w.mnsa', eq: 1 },
              text: 'Since the council passed the Network Security Act, the ISPs keep everything. People have started saying "don\'t put that in an email" the way their grandparents said "not on the phone."',
            },
            { if: { var: 'w.mnsa', eq: 2 }, text: 'The watered-down Network Security Act is law. It keeps less than they wanted and more than anyone admits.' },
            { if: all({ var: 'w.mnsa', eq: 0 }, flag('a3.vote_resolved')), text: 'The Network Security Act died on the council floor. The logs still exist; they just need a warrant now. It is not nothing.' },
            {
              if: flag('w.meridian_state', 'collapsed'),
              text: 'Meridian Trust\'s tower still dominates Harbor Point, emptied out and lit at night by a skeleton crew. The recession has a face on the Row: the For Lease signs, the diner napkins with job ads on them.',
            },
            {
              if: any(flag('w.halcyon_state', 'dead'), flag('w.halcyon_state', 'crashed')),
              text: 'Halcyon Systems is a rumor with a foreclosed campus.',
            },
            { if: flag('w.halcyon_state', 'clean'), text: 'Halcyon is smaller and duller than it used to be, and for the first time, nobody you know is ashamed to work there.' },
          ],
          next: 'people',
        },
        people: {
          speaker: 'narrator',
          text: [
            'You make a list in your head, the way you used to list open ports. Who is still here. Who you still owe.',
            { if: fate('jax', 'dead'), text: 'Jax is not on it. You write his name anyway, then cross it out, then write it again.' },
            { if: fate('jax', 'arrested'), text: 'Jax is on it, behind glass.' },
            { if: fate('mom', 'passed'), text: 'Mom is not on it. Her reading glasses are still on the kitchen windowsill at the flat.' },
            { if: fate('byteme', 'dead'), text: 'Kevin is not on it. You still have his last page saved.' },
            { if: fate('deadline', 'passed'), text: 'Deadline\'s chair in the back room stays empty.' },
            { if: flag('a3.burned_protector', 'deadline'), text: 'Deadline is on it twice: once for the \'94 way out of the city after Meridian, and once for never saying I told you so.' },
            { if: flag('a3.burned_protector', 'kroll'), text: 'Kroll is on it, the way a landlord is on a list. She made the Meridian footage a maintenance glitch. You still take her calls. You have never once decided to.' },
            { if: flag('a3.burned_protector', 'reyes'), text: 'Reyes is on it, and so is a federal file with "cooperating individual" typed beside your name, and so is every kid on Sodium Row who heard you came in.' },
            { if: flag('a3.burned_protector', 'vale'), text: 'Halcyon\'s outside counsel is on it. The invoices still arrive marked COURTESY RATE, as if gratitude were a subscription.' },
            { if: flag('a3.burned_protector', 'row'), text: 'The whole Row is on it: a month on a laundromat cot, forty people who had never heard of you, and the men in good coats who have been back since to ask them again.' },
            { if: flag('a3.burned_protector', 'nobody'), text: 'After Meridian you went to ground alone and came up owing no one. You notice, making the list, that nobody on it owes you either.' },
            { if: flag('a3.redacted_swept'), text: 'Tomas Ruiz is on it, in pencil: the night-shift ER tech who was a black bar on the list when it mattered. You found out his name. You always find out.' },
            { if: { trait: 'pkg03_act3_on_the_tape' }, text: 'Somewhere an evidence locker holds an hour of you, talking freely. It has not come up. It is filed where things wait.' },
            { if: { trait: 'pkg03_act3_parallax_scored' }, text: 'Your renter\'s insurance went up again in the spring. The letter cited "updated risk factors." You know exactly which factor.' },
            { if: flag('a3.mirror_spurned'), text: 'And mirror, who has not posted since the retrospective, and who you are fairly sure is still keeping score.' },
            'Everyone else is scattered across the city like the pieces of a machine somebody took apart to see how it worked. You were the one holding the screwdriver.',
          ],
          choices: [
            {
              text: 'Make the coffee strong and start with the people.',
              effects: [{ stat: 'mood', add: 4 }],
              goto: 'end_people',
            },
            {
              text: 'Log in to the old board, just to see who is awake.',
              effects: [{ stat: 'stress', add: -3 }],
              goto: 'end_board',
            },
            {
              text: 'Go for a long walk by the Sound first.',
              if: { skill: 'fitness', gte: 20 },
              effects: [
                { stat: 'stress', add: -6 },
                { stat: 'energy', add: -5 },
              ],
              goto: 'end_walk',
            },
          ],
        },
        end_people: {
          speaker: 'narrator',
          text: 'You pour the coffee. Your pager goes off before it cools, and you know without looking who it is. Of course it is him. It was always going to start with him.',
          effects: [{ flag: 'a4.opened' }],
        },
        end_board: {
          speaker: 'narrator',
          text: [
            {
              if: flag('w.scene_state', 'dark'),
              text: 'The login screen hangs, then drops you. The board is dark. You sit with your hand on the mouse for a while anyway, the way people sit by a phone.',
              else: 'Three handles online at seven in the morning, two of them still arguing about a thread from 2003. Some things the city cannot enclose.',
            },
            'Your pager goes off. You know who it is.',
          ],
          effects: [{ flag: 'a4.opened' }],
        },
        end_walk: {
          speaker: 'narrator',
          text: 'The fog comes off the Lumen Sound in sheets. A container ship sounds its horn, low and long, like the city clearing its throat. By the time you get home, your pager has a message on it, and you already know whose.',
          effects: [{ flag: 'a4.opened' }],
        },
      },
    },
  ],
})
