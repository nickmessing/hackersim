/**
 * PKG-18 — story contract(s) and the repeatable-rep contract templates (bible §3, §6.A Door B, §13).
 *
 * `a1_crack_starter` is the Act I scene starter Corvid posts (offered by PKG-01 q2_money). It is a
 * real board contract that resolves on a Programming-flavored roll; its fail branch is authored
 * (Jax covers for you), so a bricked first crack is a story beat, never a dead end.
 *
 * The templates are the per-faction repeatable rep sources the bible requires so the Act II
 * "one faction ≥ 50" gate can never soft-lock:
 *   - Aperture retainer  (+2 Aperture)      — after Aperture Known (20).
 *   - Bureau delivery    (+2 Bureau, −1 Loft) — after you've flipped and reached Bureau Known.
 *   - Row volunteering    (+1 Neighborhood)   — the honest, unpaid-ish community work.
 *
 * The Loft's repeatable board is owned by PKG-05 (`loft_favor` etc.). Kroll's CP-B1 job, the CP-B3
 * crisis jobs and Jax's hot contract are authored as dialog beats by PKG-02 (instant money at the
 * choice), so PKG-18 does not add duplicate board contracts for them (that would double-pay).
 *
 * HARD RULE: every "hack" here is invented flavor — dice and texture, never technique.
 */
import { defineContent } from '@/engine/registry'
import type { ContractDef, ContractTemplateDef } from '@/engine/types'

const crackStarter: ContractDef = {
  id: 'a1_crack_starter',
  kind: 'hack',
  title: 'Crack the copy protection: Kobold Keep',
  client: 'Corvid (the Loft board)',
  desc: 'Corvid posted a starter gig for the scene: a forgettable side-scroller called Kobold Keep, wrapped in copy protection that — in her words — "a determined raccoon could open." Crack it, post the method, get your name in the ledger. No real money in it. The money out here is your name.',
  skills: ['programming'],
  dc: 14,
  hours: 8,
  pay: 90,
  heat: 3,
  cred: 6,
  rep: { 'fac.loft': 10 },
  onSuccess: [
    { log: 'Kobold Keep, cracked and posted. The board lights up with a dozen "gg newbie" replies. You have a name now.', kind: 'story' },
  ],
  onFail: [
    { faction: 'fac.loft', add: -3 },
    { npc: 'jax', affinity: 8 },
    { flag: 'a1.jax_covered_you', set: true },
    { log: 'You bricked it in front of the whole board — and Jax jumped in, made it a joke, and took the mockery himself. He never brings it up again.', kind: 'story' },
  ],
}

const apertureRetainer: ContractTemplateDef = {
  id: 'aperture_retainer_job',
  kind: 'hack',
  tier: 2,
  titles: ['Data hygiene: {target}', 'Special Accounts folder — {target}', 'Retainer task: reconcile {target}'],
  descs: [
    'A leather folio from Hollis: {target} needs "reconciling." Clean-looking work, generous pay, and a set of records that reads a little too much like somebody\'s whole life ironed flat. You don\'t ask. That\'s the retainer.',
    'Aperture wants {target} tidied until it looks like it was always this way. No fingerprints, no questions, a number on the invoice with a comma in it. The folder feeds something upstairs called PARALLAX. You are careful not to learn more.',
    'Another month, another folder. {target}, washed until it reads like a spreadsheet. The pen Hollis left you still costs more than your monitor, and it still writes the same word: discretion.',
  ],
  targets: ['a stolen customer list', 'a competitor\'s marketing database', 'an insurer\'s risk file', 'a "legacy contractor" breach'],
  clients: ['Aperture Special Accounts', 'Hollis, via the folio', 'a Brightline Direct cutout', 'Kroll\'s office'],
  skills: ['business', 'intrusion', 'cryptography'],
  dc: [14, 18],
  hours: [10, 22],
  pay: [700, 1600],
  heat: [1, 3],
  cred: [0.5, 1.5],
  rep: { 'fac.aperture': 2, 'fac.loft': -1 },
  available: { all: [{ faction: 'fac.aperture', gte: 20 }, { flag: 'w.aperture_state', eq: 'thriving' }] },
  weight: 2,
}

const bureauDelivery: ContractTemplateDef = {
  id: 'bureau_delivery_job',
  kind: 'freelance',
  tier: 1,
  titles: ['Weekly delivery: {target}', 'Reyes wants a read on {target}', 'Intel package: {target}'],
  descs: [
    'A sanctioned little job for the task force: put together a read on {target} and hand it to Reyes at the usual drop. Legal, quiet, and it pays a consultant\'s day rate. Every delivery you make costs the scene a little of its trust in you — the Loft always knows who\'s been talking.',
    'The Bureau needs paperwork on {target} before their next filing. You have the access; they have the badge that makes it legal. Clean money. The kind of money that leaves a smell in the back room.',
    'Marlow signed off, Reyes runs it, and you do the work: assemble what\'s known about {target}, wrap it, deliver it. The scene will notice you were useful to the wrong people again.',
  ],
  targets: ['a warez courier ring', 'a "person of interest"', 'a fraud crew', 'a Sodium Row handle', 'a Millgate shell company'],
  clients: ['Agent Reyes', 'the field office', 'a task-force liaison', 'the Bureau, off the books'],
  skills: ['opsec', 'social', 'networking'],
  dc: [10, 15],
  hours: [8, 18],
  pay: [200, 700],
  heat: [0, 0],
  cred: [0, 0],
  rep: { 'fac.bureau': 2, 'fac.loft': -1 },
  available: { all: [{ flag: 'fac.bureau.informant' }, { faction: 'fac.bureau', gte: 20 }] },
  weight: 2,
}

const rowVolunteer: ContractTemplateDef = {
  id: 'hood_volunteer_gig',
  kind: 'freelance',
  tier: 1,
  titles: ['Fix it for {target}', 'Row favor: {target}', 'Church-basement tech help: {target}'],
  descs: [
    'Not really a job — {target} needs a hand, and the Row asked for you by name. Little pay, a plate of something warm, and the kind of goodwill you can\'t buy. This is what keeps a neighborhood a neighborhood.',
    'The church basement runs a computer class for seniors and half the machines are held together with tape and prayer. Show up, {target}, fix what you can, stay for the coffee. Sal will hear you did.',
    'Somebody on Cannery Row is underwater with {target}. You help because helping is the whole point. The money is an afterthought; the nod you get is not.',
  ],
  targets: ['Mrs. Alvarez\'s printer', 'the seniors\' email class', 'the food bank\'s spreadsheet', 'the block association\'s newsletter', 'a neighbor\'s dead hard drive'],
  clients: ['the church basement', 'a Cannery Row neighbor', 'the block association', 'Sal, on behalf of a regular'],
  skills: ['hardware', 'systems', 'social'],
  dc: [8, 12],
  hours: [6, 12],
  pay: [30, 120],
  heat: [0, 0],
  cred: [0, 0],
  rep: { 'fac.hood': 1 },
  available: { faction: 'fac.hood', gte: 10 },
  weight: 2,
}

export default defineContent({
  contracts: [crackStarter],
  contractTemplates: [apertureRetainer, bureauDelivery, rowVolunteer],
})
