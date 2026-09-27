/**
 * PKG-17 — Extra terminal missions for story & side contracts (bible §13 PKG-17: "6–10 extra
 * MissionDefs ... that other packages or PKG-18 can reference"). Difficulty ramps across the decade,
 * from a friendly Act-I data recovery to a late-game corporate vault. Ids are `side_*` (tied to the
 * matching side quest in §8, offered as its optional Terminal path) and `contract_*` (procedural /
 * story board jobs PKG-18 can hand to the ⌨-ready board).
 *
 * Each MissionDef is a small INVENTED network — hosts, IPs, banners, "services", files and logs are
 * all authored game flavour (memos, jokes, in-world texture), never a description of any real system.
 * The terminal verbs are invented game commands. Nothing here teaches, describes, or could be used
 * against anything real. No real company, product, protocol, or person appears; everything is fiction.
 *
 * These are self-contained and safe to leave unreferenced until a launcher (a scene `mission:{...}` or
 * a ContractDef `mission:`) points at them by id. The auto-resolve skill/DC belongs to whoever launches
 * them; the suggested primary skill + DC is noted in each header for the wiring package.
 */
import { defineContent } from '@/engine/registry'
import type { MissionDef } from '@/engine/types'

// ── side_inheritance_drive — Act III, data recovery (suggest [Systems] or [Hardware] DC 15) ──────────
// A dying drive of the player's father's union files. Warm, low-heat, no adversary — just a race
// against failing hardware. (side_inheritance_drive itself is PKG-11; this is its Terminal option.)
const side_inheritance_drive: MissionDef = {
  id: 'side_inheritance_drive',
  title: 'The Inheritance Drive',
  briefing: [
    "Cousin Teddy's dead hard drive, clicking like an old knee, holding the only record of the paper mill's union — the meetings the company swore never happened. It gives you one honest run before it goes quiet for good.",
    'Coax the platter up, find the archive, pull it clean off, and never mind the logs — nobody is watching a dead man\'s drive but you.',
  ],
  known: ['drive'],
  traceSeconds: 0,
  logHeat: 0,
  hints: [
    'There is no trace and no adversary here — take your time. `connect` the drive, `probe`, `crack` the one failing partition.',
    'The archive is compressed and garbled — `decrypt union_archive.dat` to reassemble it, then `get` it.',
    'When the file is on your drive, `disconnect`. That is the whole win.',
  ],
  hosts: [
    {
      id: 'drive',
      ip: '10.30.0.7',
      name: "Teddy's Drive (failing)",
      banner: 'QUANTUM-ERA IDE DISK — S.M.A.R.T. status: "unwell" — please stop power-cycling me',
      ports: [{ port: 1, service: 'recovery-mount', difficulty: 2 }],
      logs: false,
      proxy: false,
      files: [
        {
          name: 'readme_teddy.txt',
          size: 240,
          content:
            'A text file in the root, dated years ago:\n"If yer readin this its cause I finally kicked it. The union stuff is all in the\narchive, backed up thrice cause I dont trust these things. We DID organize. We\ndid. Print the loading-dock photo big. — T."',
        },
        {
          name: 'union_archive.dat',
          size: 3800,
          encrypted: true,
          content:
            'UNION ARCHIVE (reassembled)\nThirty years of minutes in Teddy\'s cramped shorthand, grievance forms, a strike vote,\nand a scanned photograph: forty men on the loading dock with a hand-painted banner,\nyour father third from the left, chin up, full head of hair. The company said it never\nhappened. Here it is anyway, in your hands, real again.',
        },
      ],
    },
  ],
  goals: [{ kind: 'download', host: 'drive', file: 'union_archive.dat' }],
}

// ── side_divorce_drive — Act II, freelance recovery (suggest [Intrusion] DC 13) ──────────────────────
// Pull an ex's abandoned drive for a bitter client. The mission just recovers the truth; the moral
// choice (honest / fabricate / flip) lives in the PKG-12 scene.
const side_divorce_drive: MissionDef = {
  id: 'side_divorce_drive',
  title: 'The Divorce Drive',
  briefing: [
    'A client slid you a drive in a Ziploc bag like contraband. "Everything she deleted. For the lawyers." The drive is a mess of half-formatted partitions and a life nobody meant you to read.',
    'Recover the deleted files and get out. What the drive ends up saying is a decision for later — for now, just make it readable.',
  ],
  known: ['exdrive'],
  traceSeconds: 0,
  logHeat: 0,
  hints: [
    'No adversary — a bench job. `connect`, `probe`, `crack` the corrupted partition to mount it.',
    'The deleted files come back scrambled: `decrypt recovered.img`, then `get` it.',
    'That is the recovery done. The rest is a conversation you have topside.',
  ],
  hosts: [
    {
      id: 'exdrive',
      ip: '10.30.1.4',
      name: 'Recovered Drive',
      banner: 'consumer IDE disk — 12GB — half-formatted in anger, judging by the timestamps',
      ports: [{ port: 1, service: 'recovery-mount', difficulty: 3 }],
      logs: false,
      proxy: false,
      files: [
        {
          name: 'whats_here.txt',
          size: 220,
          content:
            'Undeleted directory listing:\n  /recipes        (147 files, one titled "MOM\'S, DO NOT LOSE")\n  /job_apps       (drafts, hopeful, unsent)\n  /photos/beach   (two kids, squinting, happy)\n  /deleted        (recoverable, and even more ordinary)\nThere is no monster on here. There is just a person.',
        },
        {
          name: 'recovered.img',
          size: 2200,
          encrypted: true,
          content:
            'RECOVERED (deleted items, reassembled)\nMore recipes. A resignation letter never sent. A note to a lawyer that starts "I just\nwant the kids to be okay." The cruelest thing on this drive is how kind it is. Whatever\nthe client wanted to find, it is not here, because it was never a thing that existed.',
        },
      ],
    },
  ],
  goals: [{ kind: 'download', host: 'exdrive', file: 'recovered.img' }],
}

// ── side_haunted_server — Act II–III, oddity (suggest [Intrusion] DC 14) ─────────────────────────────
// A dead phreaker's dead-man's-switch board. Reward downstream: item.old_tool (granted by the PKG-13
// scene on success). Spooky, warm, low stakes.
const side_haunted_server: MissionDef = {
  id: 'side_haunted_server',
  title: "The Dead Man's Board",
  briefing: [
    'An old BBS number that should be disconnected still answers at 3 a.m. It belonged to a phreaker who died two winters ago and left the machine running with instructions: "If nobody logs in for a year, the board tells its secret." Nobody logged in.',
    'Get onto the board, find what he left, and take it. He wanted it found by someone who could get in. Prove you\'re that someone, and wipe the guest log so his ghost stays private.',
  ],
  known: ['board'],
  traceSeconds: 90,
  logHeat: 3,
  hints: [
    'The board is a single old machine — `connect`, `probe`, `crack` the login. The trace is slow and forgiving; this is not a bank.',
    'His legacy file is encrypted with a puzzle he left the answer to in plain sight — `cat` the welcome file, then `decrypt bequest.txt` and `get` it.',
    '`wipe` the guest log before you go. He was a private man.',
  ],
  hosts: [
    {
      id: 'board',
      ip: '10.13.6.6',
      name: "The Nightowl BBS (still up)",
      banner: 'NIGHTOWL BBS /// SysOp: (deceased) /// "if you can read this, you were worth waiting for"',
      ports: [{ port: 300, service: 'bbs-login', difficulty: 3 }],
      logs: true,
      proxy: false,
      files: [
        {
          name: 'welcome.ans',
          size: 300,
          content:
            'WELCOME TO NIGHTOWL. 1 node. 0 users online. 1 user, ever, remembered.\nThe old man\'s sign-off, still scrolling: "The tools aren\'t the scene. The people\nare. Be kind on the wires. The passphrase for the important thing is the name of\nmy dog, who was a good boy: PIXEL. Log off before dawn."',
        },
        {
          name: 'bequest.txt',
          size: 900,
          encrypted: true,
          content:
            "A DEAD MAN'S BEQUEST\nInside: a lovingly documented toolkit of tricks from the copper age — line tones,\nrouting lore, the shape of a network that mostly doesn't exist anymore — and a letter.\n\"Whoever you are: I kept the scene's memory so it wouldn't die when we did. Take the\ntoolbox. Use it gently, and when it's your turn, leave it for the next one. That's the\nwhole job, kid. That was always the whole job.\"",
        },
      ],
    },
  ],
  goals: [
    { kind: 'download', host: 'board', file: 'bequest.txt' },
    { kind: 'wipeLogs', host: 'board' },
  ],
}

// ── side_uncles_pyramid — Act II, family (suggest [Intrusion] DC 15) ─────────────────────────────────
// Quietly walk Uncle Danh's deposit back out of the Ponzi shell before it folds. The shell traces to
// an Aperture front — an early breadcrumb. Adversary-light but the shell watches better than it should.
const side_uncles_pyramid: MissionDef = {
  id: 'side_uncles_pyramid',
  title: 'The Prosperity Circle',
  briefing: [
    'The "Lumen Prosperity Circle" is a pyramid wearing a nice suit, and Uncle Danh put in eight thousand dollars he does not have. The shell holding everyone\'s "deposits" traces back, of all places, to a Millgate data firm you\'ve started seeing everywhere.',
    'Get into the Circle\'s creaky back office, walk Danh\'s deposit back out the way it came before the whole thing tips over, and grab a copy of the Aperture paperwork on your way past. The books are watched better than a family Ponzi has any right to be — be quick.',
  ],
  known: ['front'],
  traceSeconds: 45,
  logHeat: 6,
  hints: [
    'The public "opportunity" site (10.42.0.9) is wide open. `scan` it to reach the deposits ledger behind it.',
    'The ledger is guarded — the Aperture hands on it are careful. `bounce` the marketing box (a willing relay) before you connect, then `crack` the ledger.',
    'Reverse Danh\'s deposit (`put refund.txn`), `get` the shell paperwork for evidence, and `wipe` the ledger log before you `disconnect`.',
  ],
  payloads: [{ name: 'refund.txn', size: 320, content: "A single reversing transaction. Walks Uncle Danh's eight thousand back out the door as if it never came in. To him it will look like the one smart bet of his life." }],
  hosts: [
    {
      id: 'front',
      ip: '10.42.0.9',
      name: 'Prosperity Circle — Public',
      banner: 'LUMEN PROSPERITY CIRCLE — "It\'s not a scheme, it\'s a CIRCLE!" — Ground floor closing soon!!',
      ports: [{ port: 80, service: 'signup-page', difficulty: 0 }],
      logs: false,
      proxy: false,
      links: ['mktg', 'ledger'],
      files: [
        {
          name: 'pitch.txt',
          size: 240,
          content:
            'THE CIRCLE EXPLAINED (glossy folder text)\n"You bring in two. They bring in two. Everybody eats!" [a diagram that is, unmistakably,\na pyramid, labeled "definitely not a pyramid"]. Testimonials from "real members" whose\nphotos are stock. Small print, one line, size 4: returns not guaranteed and also not real.',
        },
      ],
    },
    {
      id: 'mktg',
      ip: '10.42.0.20',
      name: 'Circle Marketing Box',
      banner: 'mailer / relay — sends the newsletters, forwards for anyone, asks no questions',
      ports: [{ port: 8080, service: 'mail-relay', difficulty: 0 }],
      logs: false,
      proxy: true,
      files: [
        {
          name: 'newsletter.txt',
          size: 160,
          content: 'DRAFT: "URGENT: The Circle is 94% full! Act now!" (The Circle has been 94% full for eleven months. It is a number the founder likes.)',
        },
      ],
    },
    {
      id: 'ledger',
      ip: '10.42.4.2',
      name: 'Deposits Ledger (shell)',
      banner: 'ACCT-SHELL /// managed by: [redacted in ticket] /// "pragmatic bookkeeping"',
      ports: [{ port: 22, service: 'acct-lock', difficulty: 4 }],
      logs: true,
      proxy: false,
      files: [
        {
          name: 'deposits.txt',
          size: 420,
          content:
            'CIRCLE DEPOSITS (partial)\n  Osgood, no. Tan, L. — $3,000. Tan (uncle), D. — $8,000. Castellano — $2,500.\n  ...(early joiners paid from late joiners, the usual, the sad usual)\n  Danh\'s money is right here, whole, for about another three weeks. Then it isn\'t.',
        },
        {
          name: 'management.txt',
          size: 360,
          content:
            'SHELL MANAGEMENT AGREEMENT\nBeneficial owner / manager: Aperture Data Solutions, Millgate. Fee: a slice of every\ndeposit, for "processing and consumer insight." This is not the center of anything —\nit is a fee Aperture collects for laundering a small ugly thing through a smaller uglier\none. But it is them, again, in writing, next to your family\'s grocery money.',
        },
      ],
    },
  ],
  goals: [
    { kind: 'upload', host: 'ledger', file: 'refund.txn' },
    { kind: 'download', host: 'ledger', file: 'management.txt' },
    { kind: 'wipeLogs', host: 'ledger' },
  ],
}

// ── side_politicians_laptop — Act II–III, freelance (suggest [Intrusion] DC 15) ──────────────────────
// Copy the MNSA drafts off a councilman's laptop a year early. Quiet, single-host, but it's a
// politician's machine on a dated night — leaving a log matters.
const side_politicians_laptop: MissionDef = {
  id: 'side_politicians_laptop',
  title: "The Councilman's Laptop",
  briefing: [
    'A "quiet, discreet" battery repair on Councilman Pratt\'s laptop. The battery takes ten minutes. The folder labeled MNSA — WORKING takes the rest of your composure: the whole surveillance law, drafted, a year before anyone is supposed to see it, with a lobbyist\'s polite handwriting in the margins.',
    'Copy the drafts onto something small and yours without the machine ever noticing a guest, then wipe your visit. This is a councilman\'s laptop on a night with a date. Leave nothing.',
  ],
  known: ['laptop'],
  traceSeconds: 50,
  logHeat: 10,
  hints: [
    'One host, one shot. `connect`, `probe`, `crack` the user session while the aide is upstairs getting coffee.',
    'The drafts are password-locked — `decrypt mnsa_working.enc`, then `get` them.',
    '`wipe` the access log before you hand it back smiling. A scuff on this machine goes somewhere you\'d rather not be known.',
  ],
  hosts: [
    {
      id: 'laptop',
      ip: '10.55.7.1',
      name: "Councilman Pratt's Laptop",
      banner: 'PORT LUMEN CITY COUNCIL — property of Ford Pratt — "PLEASE do not touch, this means IT"',
      ports: [{ port: 139, service: 'user-session', difficulty: 4 }],
      logs: true,
      proxy: false,
      files: [
        {
          name: 'desktop_notes.txt',
          size: 300,
          content:
            "Councilman's own notes, on the desktop:\n- Fundraiser Thursday. Wear the blue tie. The donors like the blue tie.\n- Ask [lobbyist] to soften the 'anonymous board = crime' clause. Or don't. He's paying.\n- Golf Sat. DELETE THE OTHER FOLDER (he did not delete the other folder)",
        },
        {
          name: 'mnsa_working.enc',
          size: 3200,
          encrypted: true,
          content:
            'MUNICIPAL NETWORK SECURITY ACT — WORKING DRAFT (CONFIDENTIAL)\nMandatory log retention at every ISP. "Lawful access" taps, standing. A clause that makes\nrunning an anonymous board a crime. And in the margins, a lobbyist\'s neat blue hand, softening\nnothing, adding teeth. The whole cage, a year before it goes public, with fingerprints on it.\nYou are holding the future of the city, in draft, and it is worse than the rumors.',
        },
      ],
    },
  ],
  goals: [
    { kind: 'download', host: 'laptop', file: 'mnsa_working.enc' },
    { kind: 'wipeLogs', host: 'laptop' },
  ],
}

// ── contract_records_scrub — Act II–III, mid-tier hack contract (suggest [Intrusion] DC 17) ──────────
// A generic "make a record go away" job for the ⌨-ready board (PKG-18). Two hosts, real trace, a
// delete goal — the mechanical heart of a mid-game contract.
const contract_records_scrub: MissionDef = {
  id: 'contract_records_scrub',
  title: 'Records Scrub',
  briefing: [
    'A client with more money than history wants a single entry gone from a collections agency\'s files — a debt that was paid, they swear, though the swearing is not your problem. The agency runs its records behind a call-center front that has never once passed an audit.',
    'Get in, delete the flagged record, and wipe the log so the deletion itself leaves no shadow. In and out. A clean scrub is an invisible one.',
  ],
  known: ['portal'],
  traceSeconds: 55,
  logHeat: 12,
  hints: [
    'The client portal (10.71.0.5) is thin — `scan` it to reach the records server behind it.',
    'The records server is guarded; `bounce` the fax gateway (yes, a fax gateway, it\'s that kind of shop) before you connect and `crack` in.',
    '`rm` the flagged record, then `wipe` the log — deleting a record without wiping the log just documents that you deleted a record.',
  ],
  hosts: [
    {
      id: 'portal',
      ip: '10.71.0.5',
      name: 'Meridian Collections — Portal',
      banner: 'ACCOUNTS RESOLUTION SERVICES — "We help you help yourself pay us." Hold time: 40 min.',
      ports: [{ port: 80, service: 'client-portal', difficulty: 0 }],
      logs: false,
      proxy: false,
      links: ['fax', 'records'],
      files: [
        {
          name: 'about.txt',
          size: 200,
          content: 'ARS is a proud family business (the family sold it in 1996). We resolve accounts with compassion (we do not). Payment plans available (they are worse than the debt).',
        },
      ],
    },
    {
      id: 'fax',
      ip: '10.71.0.9',
      name: 'ARS Fax Gateway',
      banner: 'fax-to-email bridge, circa forever, relays for anyone who still owns a fax machine',
      ports: [{ port: 8080, service: 'fax-relay', difficulty: 0 }],
      logs: false,
      proxy: true,
      files: [{ name: 'queue.txt', size: 120, content: 'Fax queue: 4,102 unread. Oldest: 1997. The machine has achieved a kind of peace.' }],
    },
    {
      id: 'records',
      ip: '10.71.4.4',
      name: 'ARS Records Server',
      banner: 'RECORDS-DB /// "the debt is eternal, the database less so" /// authorized staff only',
      ports: [{ port: 1433, service: 'db-lock', difficulty: 5 }],
      logs: true,
      proxy: false,
      files: [
        {
          name: 'flagged_record.rec',
          size: 480,
          content:
            'ACCOUNT #88213 — STATUS: DELINQUENT (disputed)\nA paid debt that the system, and three form letters, insist is unpaid. The paperwork\nproving payment exists somewhere in a box in a warehouse the agency also lost. To the\nmachine, the debt is real because the machine says so. Deleting this record is the only\nway anyone has ever won an argument with it.',
        },
        {
          name: 'internal.txt',
          size: 240,
          content: 'STAFF MEMO: Do not tell debtors the dispute line goes to the same desk as the collections line. It is the same person. Her name is Brenda. Be nice to Brenda; none of this is her fault.',
        },
      ],
    },
  ],
  goals: [
    { kind: 'delete', host: 'records', file: 'flagged_record.rec' },
    { kind: 'wipeLogs', host: 'records' },
  ],
}

// ── contract_aperture_retainer — Act III, high-tier retainer job (suggest [Intrusion] DC 20) ─────────
// The shape of an Aperture "clean-looking, high-pay" retainer contract (fac_aperture_q2 flavor): you
// launder a real breach into a "consumer insight" upload. Multi-hop, encrypted, and quietly damning.
const contract_aperture_retainer: MissionDef = {
  id: 'contract_aperture_retainer',
  title: 'Retainer Delivery',
  briefing: [
    '"Nothing you\'d lose sleep over," the Aperture handler says, which is how you know to lose sleep over it. A competitor\'s customer database, already breached by someone else, is sitting on a staging box; your job is to pull it, "normalize" it, and deliver it upstream to the ingest node, where it becomes "consumer insight" and stops being a crime by sheer force of vocabulary.',
    'Pull the breach set, deliver it to the aggregator, and wipe your route. The pay is very good. That is the point, and it is the problem.',
  ],
  known: ['drop'],
  traceSeconds: 60,
  logHeat: 14,
  hints: [
    'The handler\'s drop box (10.80.0.3) is your entry. `scan` for the staging box holding the breach set, and the ingest node upstream.',
    'Two guarded hops — `bounce` the drop box (it relays) before you push into staging and ingest, and `crack` each lock.',
    '`decrypt` and `get` the breach set from staging, `put` it to the ingest node, then `wipe` both logs. The money lands when the upload does.',
  ],
  payloads: [{ name: 'normalized.set', size: 1200, content: "A 'normalized consumer insight dataset,' which is a stolen customer database with the word 'stolen' removed and the word 'insight' added. Ten thousand real people, reduced to a product, ready for upload." }],
  hosts: [
    {
      id: 'drop',
      ip: '10.80.0.3',
      name: 'Handler Drop Box',
      banner: 'SPECIAL ACCOUNTS — dead-drop node — "discretion is the whole product"',
      ports: [{ port: 22, service: 'drop-lock', difficulty: 3 }],
      logs: false,
      proxy: true,
      links: ['staging', 'ingest'],
      files: [
        {
          name: 'brief.txt',
          size: 300,
          content:
            'RETAINER BRIEF (verbal, transcribed against the rules)\n"Pull the set off staging. Don\'t read the names — reading the names is how people develop\nopinions, and opinions are inefficient. Normalize it, deliver to ingest. You\'ll be paid\nbefore you\'ve washed your hands. Welcome to Special Accounts." — [handler]',
        },
      ],
    },
    {
      id: 'staging',
      ip: '10.80.4.1',
      name: 'Breach Staging',
      banner: 'STAGING /// "someone else\'s crime, our opportunity" /// do not attribute',
      ports: [{ port: 443, service: 'staging-lock', difficulty: 5 }],
      logs: true,
      proxy: false,
      files: [
        {
          name: 'breach_set.enc',
          size: 3400,
          encrypted: true,
          content:
            'BREACH SET (source: "not our problem")\nTen thousand people who bought a mattress online and are about to become a risk score.\nNames, addresses, purchase histories, the small embarrassing truths of ordinary lives.\nSomeone stole it. You are about to make it legitimate. That is worse than stealing it,\nand it pays better, and both of those facts are the job.',
        },
      ],
    },
    {
      id: 'ingest',
      ip: '10.80.9.1',
      name: 'PARALLAX Ingest',
      banner: 'PARALLAX INGEST /// "we read the envelope, not the letter" /// authorized only',
      ports: [{ port: 8443, service: 'ingest-lock', difficulty: 6 }],
      logs: true,
      proxy: false,
      files: [
        {
          name: 'ingest_readme.txt',
          size: 260,
          content: 'INGEST: uploads here are correlated, scored, and never deleted. "We do not judge people," the readme says. "We predict them." There is a difference. It is not a comforting one.',
        },
      ],
    },
  ],
  goals: [
    { kind: 'download', host: 'staging', file: 'breach_set.enc' },
    { kind: 'upload', host: 'ingest', file: 'normalized.set' },
    { kind: 'wipeLogs', host: 'staging' },
    { kind: 'wipeLogs', host: 'ingest' },
  ],
}

export default defineContent({
  missions: [
    side_inheritance_drive,
    side_divorce_drive,
    side_haunted_server,
    side_uncles_pyramid,
    side_politicians_laptop,
    contract_records_scrub,
    contract_aperture_retainer,
  ],
})
