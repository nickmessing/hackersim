/**
 * PKG-18 — degree programs (bible §2.3 org.lsu, §7.6; CONTENT_GUIDE §6).
 *
 * Classes run every day in the placed block (weekly turns: a 4-hour block banks 28 class hours a
 * turn). 364 class hours per semester is 13 turns (~3 months), so the associate takes ~1 year and
 * the bachelor's ~2 years of in-game time. The night-school certificate (3-hour evening block,
 * 150 hours per semester) runs 18:00–21:00 for players who keep a day job and takes ~3 months.
 */
import { defineContent } from '@/engine/registry'
import type { ProgramDef } from '@/engine/types'

const programs: ProgramDef[] = [
  {
    id: 'lsu_cs_assoc',
    name: 'Associate of Science in Computer Science — Lumen State',
    desc: 'Two years on the Hill: intro programming in a lecture hall with a broken projector, a systems course taught by a man who still says "the information superhighway," and a lab in the CS basement that stays open all night. Classes 10:00–14:00. Entrance exam: Programming.',
    tuitionPerSemester: 1200,
    semesters: 4,
    classStart: 10,
    classHours: 4,
    skillXp: { programming: 5, systems: 3, cryptography: 1 },
    exam: { skill: 'programming', dc: 12 },
    hoursPerSemester: 364,
    onGraduate: [
      { faction: 'fac.halcyon', add: 5 },
      { notify: 'An associate degree, framed. Mom will want a copy for the fridge.', kind: 'good' },
    ],
  },
  {
    id: 'lsu_cs_bs',
    name: 'Bachelor of Science in Computer Science — Lumen State',
    desc: 'The full four years: algorithms, operating systems, networks, a cryptography elective that ruins your sleep, and a thesis supervised by faculty whose grants come from places the brochure does not name. Classes 10:00–14:00. Entrance exam: Programming.',
    tuitionPerSemester: 1800,
    semesters: 8,
    classStart: 10,
    classHours: 4,
    skillXp: { programming: 5, systems: 3, networking: 2, cryptography: 2 },
    exam: { skill: 'programming', dc: 12 },
    hoursPerSemester: 364,
    onGraduate: [
      { faction: 'fac.halcyon', add: 8 },
      { notify: 'A bachelor\'s degree from Lumen State. Every recruiter in Port Lumen just learned your name.', kind: 'good' },
    ],
  },
  {
    id: 'lsu_night_cert',
    name: 'Night-School Certificate in Network Administration — Lumen State Extension',
    desc: 'Three evenings of fluorescent classroom a night, taught by a NorthLink engineer who moonlights as a teacher and is visibly tired of both. The certificate is short, practical, and fits around a day job. Classes 18:00–21:00. No entrance exam; a pulse and the fee are enough.',
    tuitionPerSemester: 700,
    semesters: 2,
    classStart: 18,
    classHours: 3,
    skillXp: { networking: 5, systems: 3 },
    hoursPerSemester: 150,
    onGraduate: [
      { faction: 'fac.halcyon', add: 3 },
      { notify: 'Night-school certificate earned. NorthLink\'s recruiters keep a stack of these on the desk.', kind: 'good' },
    ],
  },
]

export default defineContent({ programs })
