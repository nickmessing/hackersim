/**
 * PKG-03 — Act III main, beat 1: `main_a3_q1_the_law_begins` (bible §6.C).
 *
 * The council takes up the Municipal Network Security Act (MNSA). This beat introduces it and
 * seeds `w.public_opinion` — the add-only scalar the vote (q7) reads, sign convention pinned:
 * POSITIVE = anti-surveillance = toward the act FAILING. Loudness (lifetime heat) subtracts, so
 * loud players make passage more likely; that term is applied at the vote, not here.
 *
 * Started by `trig_act3_gate` (this package, triggers.ts). No auto exposure — exposure is earned
 * from side breadcrumbs and the investigative beats q2/q5 (§5.4).
 *
 * Cross-package ids referenced by exact bible id (owners in parentheses):
 *   news.mnsa_introduced (PKG-16).
 */
import { defineContent } from '@/engine/registry'

export default defineContent({
  quests: [
    {
      id: 'main_a3_q1_the_law_begins',
      title: 'The Law Begins',
      kind: 'main',
      act: 3,
      priority: 30,
      summary:
        'Someone downtown finally wrote it down. The Municipal Network Security Act is on the council agenda, and the city is about to argue with itself about what a modem is for.',
      rewards: 'The shape of Act III',
      start: 'open',
      stages: {
        open: {
          text: 'The council has taken up the Municipal Network Security Act — the MNSA — a bill that would make every provider in Port Lumen keep every log forever. Read the notice, and decide whether the city hears your voice.',
          hint: 'Open your mail: a civic alert just landed. What you do about the law starts to move public opinion.',
          onEnter: [
            { news: 'mnsa_introduced' },
            // Public alarm at a scary new law galvanizes opposition (anti-surveillance = positive).
            // Scaled a little by how much of the truth is already surfacing.
            { var: 'w.public_opinion', add: 5 },
            { if: { var: 'w.exposure', gte: 6 }, then: [{ var: 'w.public_opinion', add: 3 }] },
            { if: { var: 'w.exposure', gte: 10 }, then: [{ var: 'w.public_opinion', add: 3 }] },
            { scene: 'a3_mnsa' },
          ],
          objectives: [
            {
              id: 'react',
              text: 'Read the notice about the Network Security Act',
              when: { flag: 'a3.mnsa_live' },
              hint: 'The alert is in your Mail. Read it to the end; you can speak up or keep your head down.',
            },
          ],
          onComplete: [{ quest: 'main_a3_q2_oracle_reveal', start: true }],
        },
      },
    },
  ],
  scenes: [
    {
      id: 'a3_mnsa',
      channel: 'mail',
      title: 'PUBLIC NOTICE: Ordinance 04-217 (Network Security)',
      from: 'Port Lumen Civic Alerts',
      start: 'notice',
      nodes: {
        notice: {
          speaker: 'Port Lumen Civic Alerts',
          text: [
            'FROM: Office of the City Clerk, Port Lumen\nRE: First reading, Ordinance 04-217 — the "Municipal Network Security Act"',
            'The Council will hear public comment on a proposed ordinance requiring all internet service providers operating within city limits to RETAIN CONNECTION LOGS INDEFINITELY and to make them available to law enforcement on request. Sponsors cite "critical infrastructure protection." Public hearings begin next month.',
            'A form letter is attached for residents wishing to express support. There is no attached form for residents wishing to express anything else. You notice that.',
          ],
          next: 'read',
        },
        read: {
          speaker: 'narrator',
          text: [
            'You read it twice. The language is boring on purpose — the kind of boring that a whole city slides past on its way to the sports page.',
            'Keep every log, forever. Hand it over on request. It is the thing the Oracle has been whispering about for two years, printed on civic letterhead with a fax number at the bottom.',
            { if: { var: 'w.exposure', gte: 6 }, text: 'You know what a rule like this is really for. You have the sample. You have watched the phone-home at 3:12 a.m. This law is a loading dock for it.' },
          ],
          choices: [
            {
              tag: '[Speak]',
              text: 'Write to the council, on the record, against it.',
              effects: [
                { var: 'w.public_opinion', add: 6 },
                { stat: 'heat', add: 3 },
                { flag: 'a3.mnsa_live' },
                { log: 'You put your name on a letter to the council. Somewhere, a clerk files it. Somewhere else, someone underlines it.', kind: 'story' },
              ],
              goto: 'spoke',
            },
            {
              text: 'Send the safe form letter of support to keep your head down.',
              effects: [
                { var: 'w.public_opinion', add: -3 },
                { flag: 'a3.mnsa_live' },
              ],
              goto: 'quiet',
            },
            {
              text: 'Delete it. Not your fight. Yet.',
              effects: [{ flag: 'a3.mnsa_live' }],
              goto: 'quiet',
            },
          ],
        },
        spoke: {
          speaker: 'narrator',
          text: 'The letter goes out. It will not stop anything by itself. But letters like it are how a whip count starts, and yours has a name on it now.',
        },
        quiet: {
          speaker: 'narrator',
          text: 'You close the mail. The law will keep moving whether you watch it or not. That, you are starting to understand, is the whole point of a law.',
        },
      },
    },
  ],
})
