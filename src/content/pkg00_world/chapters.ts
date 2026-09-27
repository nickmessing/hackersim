/**
 * PKG-00 — "Chapter Progress" meta-quests (bible §5.5), one per act.
 *
 * Each quest mirrors its act gate (`trig_act2_gate`, `trig_act3_gate`, `trig_act4_gate`) as
 * journal objectives with progress bars and one hint per alternative road. It never completes on
 * its own: a hidden required objective waits for the act to actually change (the gate trigger is
 * the only writer of `act`). A small sync trigger per chapter closes the quest after the act turns
 * even if some mirrored objective never latched (e.g. a volatile condition such as money on hand).
 *
 * Kind is 'tutorial' on purpose: `startQuest` makes every newly started 'main' quest the tracked
 * quest, which would steal tracking from the real story quests that start in the same hours.
 *
 * Latching note: objectives latch once true, but the gates check standing *at that moment*. For
 * volatile conditions (money, faction rep) the objective text is written live (conditional parts)
 * and the progress bar always shows the current value.
 */
import { defineContent } from '@/engine/registry'
import type { Cond, FactionId, ObjectiveDef, QuestDef, SkillId, TriggerDef } from '@/engine/types'
import { SKILLS } from '@/engine/types'

const FACTIONS: FactionId[] = ['fac.loft', 'fac.aperture', 'fac.bureau', 'fac.halcyon', 'fac.hood']

const anyFactionAtLeast = (n: number): Cond => ({ any: FACTIONS.map(f => ({ faction: f, gte: n })) })
const anySkillAtLeast = (n: number): Cond => ({ any: SKILLS.map((s: SkillId) => ({ skill: s, gte: n })) })
const started = (quest: string): Cond => ({ quest })

/** Act-turn lines, logged when a chapter closes (naturally or via its sync trigger). */
const TURN = {
  a2: 'ACT II: "Everyone\'s Getting Paid." The dot-com money is real, and so is everything that comes with it.',
  a3: 'ACT III: "Signal Intelligence." Surveillance is the weather now. Everyone is compromised; the trick is knowing by whom.',
  a4: 'ACT IV: "The Long Tail." The bills come due, and some of them have names.',
  end: 'The long tail ends here. Whatever the epilogue says, you wrote most of it.',
}

// ── Act I → II ───────────────────────────────────────────────────────────────
const chapterOne: QuestDef = {
  id: 'chapter_a1_progress',
  title: 'Chapter Progress: Act I',
  kind: 'tutorial',
  act: 1,
  priority: 50,
  autoStart: { var: 'act', eq: 1 },
  rewards: 'Act II: "Everyone\'s Getting Paid"',
  summary:
    'How Act I ends and Act II begins. The story won\'t rush you, and it won\'t wait for you forever: the next act opens when the story, the calendar and your own life are all ready at once.',
  start: 'track',
  stages: {
    track: {
      text: 'It\'s 2001 and the modem still sings. Act II opens when three things line up: Act I\'s story is finished, spring 2002 has come, and you\'ve opened any two of the four roads below. Mix and match. There is no wrong build.',
      objectives: [
        {
          id: 'story',
          text: [
            {
              if: started('main_a1_q6_grandma_job'),
              text: 'Finish the job at Ruth Alvarez\'s place',
              else: 'See Act I\'s main story to its end',
            },
          ],
          when: { flag: 'a1.grandma_done' },
          hint: 'Follow the tracked main quest. It ends in a neighbor\'s living room, with a very sick PC and a very large plate of empanadas.',
        },
        {
          id: 'spring',
          text: 'Let the calendar reach late April 2002',
          when: { day: true, gte: 240 },
          progress: { of: { day: true }, target: 240 },
          hint: 'Time is a road too. Keep your schedule full: every week you wait, you are also getting better at something.',
        },
        {
          id: 'roads',
          text: 'Open any three of the four roads below',
          when: { flag: 'a1.gate_pair' },
          hint: 'Any three roads count, and they don\'t have to be the same kind. A legit worker, a scene kid and a saver can all get here.',
        },
        {
          id: 'road_skill',
          text: 'Road: get any one skill to 25',
          optional: true,
          when: anySkillAtLeast(25),
          hint: 'Study hard or practice one thing obsessively. The Skills window shows your best.',
        },
        {
          id: 'road_standing',
          text: 'Road: reach level 4 at CompCastle (or level 2 at Halcyon), or Known (20) with the Loft',
          optional: true,
          when: {
            any: [
              { jobLevel: 'job_compcastle_bench', gte: 4 },
              { jobLevel: 'job_halcyon_junior', gte: 2 },
              { faction: 'fac.loft', gte: 20 },
            ],
          },
          progress: { of: { faction: 'fac.loft' }, target: 20 },
          hint: 'Work steady shifts for Dee at CompCastle, or earn the Loft\'s respect with contracts and shared tools. The bar shows Loft rep; either route counts.',
        },
        {
          id: 'road_sides',
          text: 'Road: finish two Act I side quests',
          optional: true,
          when: { flag: 'a1.two_side_done' },
          hint: 'Neighbors, family and friends all have small troubles. Check the Side tab, and answer your mail.',
        },
        {
          id: 'road_money',
          text: [
            {
              if: { stat: 'money', gte: 3000 },
              text: 'Road: hold $3,000 at once (you do, for now: {money})',
              else: 'Road: hold $3,000 at once (you have {money})',
            },
          ],
          optional: true,
          when: { stat: 'money', gte: 3000 },
          progress: { of: { stat: 'money' }, target: 3000 },
          hint: 'Save it up from shifts, gigs and contracts. Living rent-free at your parents\' is the best savings account you will ever have. The road counts what is in your pocket when the act turns.',
        },
        { id: 'act_turns', text: 'Act II begins', hidden: true, when: { var: 'act', gte: 2 } },
      ],
      onComplete: [{ log: TURN.a2, kind: 'story' }],
    },
  },
}

// ── Act II → III ─────────────────────────────────────────────────────────────
const repRoad = (id: string, faction: FactionId, label: string, hint: string): ObjectiveDef => ({
  id,
  text: `Road: ${label}`,
  optional: true,
  when: { faction, gte: 50 },
  progress: { of: { faction }, target: 50 },
  hint,
})

const chapterTwo: QuestDef = {
  id: 'chapter_a2_progress',
  title: 'Chapter Progress: Act II',
  kind: 'tutorial',
  act: 2,
  priority: 50,
  autoStart: { var: 'act', eq: 2 },
  rewards: 'Act III: "Signal Intelligence"',
  summary:
    'How Act II ends and Act III begins. This act is long on purpose: a career, a scene, a family and a city all move at once, and the thriller only starts once they have all come due.',
  start: 'track',
  stages: {
    track: {
      text: 'The dot-com money is real, and so is the hangover. Act III opens when this act\'s reckonings have all come due, you have dug up enough of what lies under the city, one faction trusts you properly, and the calendar reaches mid-December 2004.',
      objectives: [
        {
          id: 'raid',
          text: [
            {
              if: started('main_a2_q5_first_raid'),
              text: 'Get through the first raid',
              else: 'Weather the storm that\'s coming (it hasn\'t come yet)',
            },
          ],
          when: { flag: 'a2.first_raid_resolved' },
          hint: 'It will come for you, a friend or the board. Low heat and careful friends decide who it lands on. It can\'t be skipped, only survived.',
        },
        {
          id: 'home',
          text: [
            {
              if: started('main_a2_q4_moms_illness'),
              text: 'Get through Mom\'s hospital bills',
              else: 'Be there when home needs you (it hasn\'t, yet)',
            },
          ],
          when: { flag: 'a2.mom_crisis_resolved' },
          hint: 'When it comes, every road costs something: savings, favors, the Row, or a job you won\'t be proud of. Money in the bank and friends on the Row widen your options.',
        },
        {
          id: 'hinge',
          text: [
            {
              if: started('main_a2_q7_meridian_test'),
              text: 'Answer the Meridian question',
              else: 'Reach the act\'s turning point (later in the story)',
            },
          ],
          when: { flag: 'a2.hinge_done' },
          hint: 'Follow the main quests to the end of Act II. What you choose at the hinge becomes your road through Act III.',
        },
        {
          id: 'exposure',
          text: 'Uncover the pattern (exposure {var:w.exposure} of 6)',
          when: { any: [{ var: 'w.exposure', gte: 6 }, { day: true, gte: 1700 }] },
          progress: { of: { var: 'w.exposure' }, target: 6 },
          hint: 'Exposure only comes from digging: side jobs that smell wrong, refusing the easy money, following breadcrumbs. Side content matters. (If you never dig, the story moves on without you in spring 2006.)',
        },
        {
          id: 'trusted',
          text: [
            {
              if: { day: true, gte: 1600 },
              text: 'Earn standing 35+ with any one faction (the bar has dropped)',
              else: 'Earn Trusted standing (50) with any one faction',
            },
          ],
          when: { any: [anyFactionAtLeast(50), { all: [{ day: true, gte: 1600 }, anyFactionAtLeast(35)] }] },
          hint: 'Pick a side and lean in; each faction has its own steady road, listed below. From mid-January 2006, 35 is enough. The gate checks your standing when it opens, so hold it once you have it.',
        },
        repRoad('rep_loft', 'fac.loft', 'the Loft', 'Loft board contracts (+1 to +3 each), sharing tools, and standing by members when the heat comes.'),
        repRoad('rep_aperture', 'fac.aperture', 'Aperture', 'Aperture retainer work (+2 each) once they know your name. Every step toward Aperture costs you with the Loft.'),
        repRoad('rep_bureau', 'fac.bureau', 'the Bureau', 'Bureau deliveries (+2 each) once you\'re working with them. Every delivery costs the Loft a point of trust.'),
        repRoad('rep_halcyon', 'fac.halcyon', 'the Legit Ladder', 'Climb the IT ladder: +2 for every job level you gain, more for shipping and promotions.'),
        repRoad('rep_hood', 'fac.hood', 'the Neighborhood', 'Visit Ruth, help the neighbors, and spend social time volunteering on the Row once they know you (10+). The Row can\'t be bought, only earned.'),
        {
          id: 'date',
          text: 'Let the calendar reach mid-December 2004',
          when: { day: true, gte: 1200 },
          progress: { of: { day: true }, target: 1200 },
          hint: 'Use the years: school, jobs, friends, and the people you will want in your corner later.',
        },
        { id: 'act_turns', text: 'Act III begins', hidden: true, when: { var: 'act', gte: 3 } },
      ],
      onComplete: [{ log: TURN.a3, kind: 'story' }],
    },
  },
}

// ── Act III → IV ─────────────────────────────────────────────────────────────
const chapterThree: QuestDef = {
  id: 'chapter_a3_progress',
  title: 'Chapter Progress: Act III',
  kind: 'tutorial',
  act: 3,
  priority: 50,
  autoStart: { var: 'act', eq: 3 },
  rewards: 'Act IV: "The Long Tail"',
  summary:
    'How Act III ends and Act IV begins. The city is watching now. The last act opens only once the truth is out, the big questions are settled, and you have become someone in particular.',
  start: 'track',
  stages: {
    track: {
      text: 'Signal Intelligence. Act IV opens when the truth is in the open, the mirror has been faced, the council has voted, Meridian is settled, consequences have landed on real people, and you\'ve committed to a side, or run out the clock trying not to. Not before August 2009.',
      objectives: [
        {
          id: 'oracle',
          text: 'Learn who the Oracle really is',
          when: { flag: 'a3.oracle_revealed' },
          hint: 'The main story drags the voice in the wires into the open. Evidence you hold unlocks deeper tiers of the truth.',
        },
        {
          id: 'mirror',
          text: 'Face the mirror',
          when: { flag: 'a3.mirror_revealed' },
          hint: 'Your shadow has matched you move for move since your first month on the board. The main story puts you in the same room. How you treated your friends decides whose face it wears.',
        },
        {
          id: 'vote',
          text: [
            {
              if: { flag: 'a3.mnsa_live' },
              text: 'See the council vote on the Network Security Act through',
              else: 'See the city\'s big decision through',
            },
          ],
          when: { flag: 'a3.vote_resolved' },
          hint: 'Public opinion, friends on the council, leaks, lobbies and your own noise all move the whip count. Watch the News window.',
        },
        {
          id: 'heist',
          text: [
            {
              if: started('main_a3_q8_meridian_heist'),
              text: 'Resolve the Meridian job',
              else: 'Settle the Meridian question for good',
            },
          ],
          when: { flag: 'a3.heist_resolved' },
          hint: 'Your Act II hinge decides which routes open. Crew, recon and evidence change the odds. When someone warns you about who you bring, listen.',
        },
        {
          id: 'exposure',
          text: 'Expose the machine (exposure {var:w.exposure} of 12)',
          when: { any: [{ var: 'w.exposure', gte: 12 }, { day: true, gte: 3200 }] },
          progress: { of: { var: 'w.exposure' }, target: 12 },
          hint: 'Keep digging: odd jobs with Aperture fingerprints on them, the Oracle\'s tiers, the List. Side content matters here as much as the main story. (By mid-2010 the story moves on regardless.)',
        },
        {
          id: 'fates',
          text: 'Let consequences land (lives changed: {var:a3.real_fates} of 3)',
          when: { any: [{ var: 'a3.real_fates', gte: 3 }, { day: true, gte: 3200 }] },
          progress: { of: { var: 'a3.real_fates' }, target: 3 },
          hint: 'Real consequences: someone saved, arrested, turned or gone. The people around you have to become who they are going to be, through the main story and their own quests.',
        },
        {
          id: 'commit',
          text: [
            {
              if: { flag: 'a3.committed' },
              text: 'Commit to a side (done; there\'s no going back)',
              else: 'Commit to a side, or let the fog decide',
            },
          ],
          when: { any: [{ flag: 'a3.committed' }, { day: true, gte: 3300 }] },
          hint: 'Two roads below. Commit, or wait for the fog.',
        },
        {
          id: 'commit_poles',
          text: 'Road: one faction at 50+ while another sits at −20 or lower, or two rivals both at 50+',
          optional: true,
          when: { flag: 'a3.committed' },
          hint: 'Lean all the way into someone. The trade-offs you have been making since Act II add up to a shape; make it a clear one.',
        },
        {
          id: 'commit_fog',
          text: 'Road: the fog (mid-September 2010)',
          optional: true,
          when: { day: true, gte: 3300 },
          progress: { of: { day: true }, target: 3300 },
          hint: 'If you never picked a side, the fog takes you (day 3300). The story goes on, but it will remember that you wouldn\'t choose.',
        },
        {
          id: 'date',
          text: 'Let the calendar reach August 2009',
          when: { day: true, gte: 2900 },
          progress: { of: { day: true }, target: 2900 },
          hint: 'Act III spans years. The city changes whether you act or not; keep the people you love in your schedule.',
        },
        { id: 'act_turns', text: 'Act IV begins', hidden: true, when: { var: 'act', gte: 4 } },
      ],
      onComplete: [{ log: TURN.a4, kind: 'story' }],
    },
  },
}

// ── Act IV → the end ─────────────────────────────────────────────────────────
const chapterFour: QuestDef = {
  id: 'chapter_a4_progress',
  title: 'Chapter Progress: Act IV',
  kind: 'tutorial',
  act: 4,
  priority: 50,
  autoStart: { var: 'act', eq: 4 },
  rewards: 'An ending you have been writing for a decade',
  summary:
    'There is no next act, only the end and what it says about you. Everything you have done is on the table now.',
  start: 'track',
  stages: {
    track: {
      text: 'The Long Tail. Settle things with the people who are left, decide what to do with everything you know, go through the copper, and live out the last day. Warm rooms only survive if you kept them warm.',
      objectives: [
        {
          id: 'reckon',
          text: 'Sit down with everyone who\'s left',
          when: { quest: 'main_a4_q1_reckonings', status: ['completed', 'failed'] },
          hint: 'One quiet scene with each person still in your life. Fates settle here; affinity and your past choices decide how.',
        },
        {
          id: 'evidence',
          text: [
            {
              if: { flag: 'end.has_evidence' },
              text: 'Corkboard: enough evidence to make it stick',
              else: 'Corkboard: not enough evidence yet',
            },
          ],
          optional: true,
          when: { flag: 'end.has_evidence' },
          hint: 'Any one of these holds up: Kroll\'s recorded ask; a clean ghost pull from Meridian; the Aperture sample together with Priya\'s proof; or three evidence fragments from side jobs. Without it, going public looks like a hoax.',
        },
        {
          id: 'leverage',
          text: 'Decide what to do with what you know',
          when: { flag: 'a4.leverage' },
          hint: 'Publish it, bury it, sell it, hand it to someone you trust, take a seat you are offered, or burn everything down. Each is a different ending, and your allies change the odds.',
        },
        {
          id: 'finale',
          text: 'Go through the copper',
          when: { flag: 'a4.finale_done' },
          hint: 'The old Cannery-Millgate exchange. Marge\'s keys or a fit body open the physical route; the remote route is always there. Every surviving ally makes one stage easier.',
        },
        {
          id: 'last_day',
          text: 'Live until the last day (late December 2010)',
          when: { day: true, gte: 3400 },
          progress: { of: { day: true }, target: 3400 },
          hint: 'The ending won\'t come before winter 2010. Spend the time on the people and places you want in your epilogue.',
        },
        { id: 'the_end', text: 'The end', hidden: true, when: { quest: 'main_a4_q4_last_day', status: ['completed', 'failed'] } },
      ],
      onComplete: [{ log: TURN.end, kind: 'story' }],
    },
  },
}

/**
 * Close a chapter once the act has really turned, even if some mirrored objective never latched.
 * Priority 1: runs before the gate triggers (default 100), so on the hour a gate fires this sees the
 * old act and waits; the quest then completes naturally an hour later, and this only fires if not.
 */
const sync = (quest: string, when: Cond, log: string): TriggerDef => ({
  id: `trig_${quest}_sync`,
  when: { all: [{ quest, status: 'active' }, when] },
  once: true,
  priority: 1,
  effects: [{ quest, complete: true }, { log, kind: 'story' }],
})

export default defineContent({
  quests: [chapterOne, chapterTwo, chapterThree, chapterFour],
  triggers: [
    sync('chapter_a1_progress', { var: 'act', gte: 2 }, TURN.a2),
    sync('chapter_a2_progress', { var: 'act', gte: 3 }, TURN.a3),
    sync('chapter_a3_progress', { var: 'act', gte: 4 }, TURN.a4),
    sync('chapter_a4_progress', { quest: 'main_a4_q4_last_day', status: ['completed', 'failed'] }, TURN.end),
  ],
})
