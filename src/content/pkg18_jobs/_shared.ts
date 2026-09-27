/**
 * PKG-18 — shared ids and conditions for jobs, contracts and the reactivity layer.
 *
 * Carries no content of its own (every content file needs a default export, so it exports an
 * empty pack). Job-state flags owned by this package live under `job.*`.
 */
import { defineContent } from '@/engine/registry'
import type { Cond } from '@/engine/types'

/** Every legit employer's jobs, grouped so firing / promotion mails can find "the boss". */
export const COMPCASTLE_JOBS = ['job_compcastle_bench', 'job_compcastle_lead'] as const
export const HALCYON_JOBS = ['job_halcyon_junior', 'job_halcyon_senior', 'job_halcyon_lead'] as const
export const NORTHLINK_JOBS = [
  'job_northlink_helpdesk',
  'job_northlink_field_tech',
  'job_northlink_noc_night',
  'job_northlink_sysadmin',
  'job_northlink_senior_sysadmin',
  'job_northlink_neteng',
  'job_northlink_architect',
] as const
export const MERIDIAN_JOBS = ['job_meridian_support', 'job_meridian_dev', 'job_meridian_secanalyst', 'job_meridian_it_manager'] as const
export const LSU_JOBS = ['job_lsu_helpdesk', 'job_lsu_labtech'] as const
export const COOP_JOBS = ['job_pixelworks_web', 'job_coop_dev', 'job_coop_partner'] as const
export const STARTUP_JOBS = ['job_startup_engineer', 'job_startup_cto'] as const

/** Employed anywhere on a legit, paperwork-and-references job. */
export const LEGIT_JOBS: string[] = [
  ...COMPCASTLE_JOBS,
  ...HALCYON_JOBS,
  ...NORTHLINK_JOBS,
  ...MERIDIAN_JOBS,
  ...LSU_JOBS,
  ...COOP_JOBS,
  ...STARTUP_JOBS,
  'job_datacenter_ops',
  'job_tidewater_consultant',
]

/** Meridian is hiring only while it is a going concern. */
export const meridianOpen: Cond = { not: { flag: 'w.meridian_state', eq: 'collapsed' } }
/** Halcyon is hiring only while it is alive. */
export const halcyonAlive: Cond = { not: { flag: 'w.halcyon_state', eq: 'dead' } }
/** Aperture is hiring only while it has not been dragged into daylight. */
export const apertureStanding: Cond = { flag: 'w.aperture_state', eq: 'thriving' }

export const enrolledOrGrad: Cond = { any: [{ enrolled: true }, { degree: true }] }

export default defineContent({})
