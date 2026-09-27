import { defineContent } from '@/engine/registry'

/**
 * ECON — Procedural HACK contract templates, tiers 3–5 (the deep end of the underground board).
 * The board instantiates these into concrete jobs, substituting a random `{target}` and picking a
 * `titles`/`descs`/`clients` variant. These tiers gate on `cred` (engine `CRED_TIERS`); some also
 * gate on era or world state (`w.broadband`) and some pay out small faction rep.
 *
 * Every template carries an `op` recipe (network archetype, goal, loot, a few flavor docs). Pay and
 * heat here are FINAL (the engine's per-tier pay multipliers are retired). Weekly-turn balance keeps
 * untaxed op pay modest and makes the deep end loud — a clean tier-5 run still leaves a mark:
 *   tier 3  $900–2,250    heat 14–22
 *   tier 4  $1,500–3,600  heat 29–43
 *   tier 5  $3,000–6,000  heat 46–70
 *
 * HARD RULE: all "hacking" here is texture, not technique — invented sites, invented networks,
 * invented files and office gossip. No real targets, tools, commands or procedures appear below.
 */

export default defineContent({
  contractTemplates: [
    // ─────────────────────────── TIER 3 ────────────────────────────
    {
      id: 'h3_espionage',
      kind: 'hack',
      tier: 3,
      titles: ['Steal the roadmap from {target}', 'Industrial espionage: {target}', "Lift {target}'s secrets"],
      descs: [
        "A client will pay serious money for {target}'s unreleased product plans. Their crown jewels sit on a share that assumes nobody hostile is ever inside. Prove them wrong, quietly.",
        '{target} is about to announce something big. Your client wants it first. Get the deck, the specs, the timeline — and leave nothing behind but a warm server.',
        'Corporate war, fought in the dark. Bring back everything {target} is hiding from the market, and let the client decide who gets hurt.',
      ],
      targets: ['a hardware startup', 'a software house', 'a biotech firm', 'a games studio'],
      clients: ['a competitor with deep pockets', 'a venture fund', 'a "strategic advisor"', 'an activist short-seller'],
      skills: ['intrusion', 'opsec'],
      dc: [17, 19],
      hours: [26, 44],
      pay: [1100, 2100],
      heat: [14, 20],
      cred: [2.2, 3.6],
      op: {
        network: 'corp',
        goal: 'download',
        loot: ['product_roadmap.ppt', 'unreleased_specs.doc', 'launch_timeline.xls', 'skunkworks_{target}.zip'],
        docs: [
          {
            name: 'all_hands_deck.txt',
            content:
              'SLIDE 1: The Future Is Ours\nSLIDE 2: (also the competitor\'s, if they ever hire a decent contractor, which they won\'t)\nSLIDE 14: synergy\nSLIDE 15: please hold questions until the offsite',
          },
          {
            name: 'project_codenames.txt',
            content: 'Reminder: the codename is "OTTER." It is not "the otter thing." It is not "you know, the animal one." It is OTTER, and marketing will rename it something worse before launch anyway.',
          },
        ],
      },
    },
    {
      id: 'h3_credit_union',
      kind: 'hack',
      tier: 3,
      titles: ['Probe {target}', 'Soft target: {target}', 'Test the walls at {target}'],
      descs: [
        '{target} just put its accounts online and did it badly. The client wants to know exactly how badly — no theft, just a map of every unlocked door. Extremely hot even so.',
        'A small financial outfit, {target}, is the practice run before anyone dreams bigger. Read the layout, document the weaknesses, get out clean. The bank job with training wheels.',
        '{target} thinks its new web portal is safe because a vendor said so. Read the proof that it isn\'t for a client who wants leverage, not cash. Yet.',
      ],
      targets: ['a neighborhood credit union', 'a small savings bank', 'a check-cashing chain', 'a regional lender'],
      clients: ['a rival lender', 'a leverage-seeker', 'a would-be whistleblower', 'a crew scoping the big one'],
      skills: ['intrusion', 'networking'],
      dc: [18, 20],
      hours: [30, 50],
      pay: [1000, 1900],
      heat: [15, 22],
      cred: [2.5, 4],
      op: {
        network: 'bank',
        goal: 'read',
        loot: ['network_map.txt', 'open_ports_audit.txt', 'access_matrix.txt'],
        docs: [
          {
            name: 'it_committee.txt',
            content:
              'MINUTES: The online banking vendor assured us the system is "military grade." When asked which military, the vendor said "a good one." Motion to accept: passed. Motion to ask a second question: tabled indefinitely.',
          },
          {
            name: 'password_policy.txt',
            content: 'New password rules: minimum 6 characters. We wanted 8 but Sharon in loans said 8 was "a lot." Compromise reached at 6. Sharon is very persuasive.',
          },
        ],
      },
    },
    {
      id: 'h3_domain',
      kind: 'hack',
      tier: 3,
      titles: ['Hijack {target}', 'Take the domain of {target}', 'Redirect {target}'],
      descs: [
        "A client wants control of {target}'s web address — the name itself, not just the site. The registrar confirms changes with a form a child could forge. Own the name, own the traffic.",
        '{target} forgot to renew part of its paperwork. Slide in, transfer the record, and hand the client the keys to a brand\'s entire online front door.',
        'Point everyone who types {target} to wherever the client wants them to go. High-value, high-heat, and impossible to hide for long.',
      ],
      targets: ['a popular download site', "a rival's storefront", 'a news portal', 'a community hub'],
      clients: ['a domain squatter', 'a competitor', 'a "brand strategist"', 'a spiteful ex-partner'],
      skills: ['social', 'intrusion'],
      dc: [17, 20],
      hours: [24, 42],
      pay: [900, 1800],
      heat: [14, 20],
      cred: [2, 3.5],
      op: {
        network: 'isp',
        goal: 'upload',
        loot: ['zone_records_{target}.cfg', 'nameserver_override.cfg', 'redirect_rules.cfg'],
        docs: [
          {
            name: 'registrar_ticket.txt',
            content:
              'TICKET #88213: Customer wants to transfer domain. Verified identity by asking for the answer to their security question ("favorite pet"). They said "the internet." Close enough. Approved.',
          },
          {
            name: 'renewals_overdue.txt',
            content: 'Domains expiring this week that nobody has paid for: 47. Number whose owners will notice before it is too late: historically, about two.',
          },
        ],
      },
    },
    {
      id: 'h3_payroll',
      kind: 'hack',
      tier: 3,
      titles: ["Skim {target}'s payroll", 'Ghost employee at {target}', 'Adjust the books at {target}'],
      descs: [
        "A client wants a phantom name added to {target}'s payroll run — small enough that nobody notices for a while. The accounting server was set up by someone who has since quit. Careful money.",
        '{target} pays hundreds of people twice a month and reconciles it never. Insert a ghost, let it collect, vanish before the audit. This is where it stops being a prank.',
        'Slip a new line into every pay run at {target} and route it somewhere friendly. Old trick, real jail time if it goes wrong.',
      ],
      targets: ['a logistics company', 'a hospital system', 'a manufacturing plant', 'a retail chain'],
      clients: ['an inside man', 'a fraud crew', 'a disgruntled accountant', 'a very calm stranger'],
      skills: ['systems', 'business'],
      dc: [18, 20],
      hours: [30, 48],
      pay: [1300, 2250],
      heat: [15, 22],
      cred: [2.4, 3.8],
      op: {
        network: 'corp',
        goal: 'upload',
        loot: ['payroll_run_{target}.upd', 'ghost_employee.rec', 'direct_deposit.upd'],
        docs: [
          {
            name: 'accounting_readme.txt',
            content:
              'IF THE PAYROLL LOOKS WRONG: it is probably right and you are tired. IF IT LOOKS RIGHT: double-check, that never happens. The macro that runs it was written by Terrence. Terrence is gone. We do not speak of Terrence.',
          },
          {
            name: 'audit_schedule.txt',
            content: 'Next external audit: "sometime in Q3." Last external audit: cancelled because the auditor got a better offer. We have never actually been audited. Please act normal about this.',
          },
        ],
      },
    },
    {
      id: 'h3_pbx',
      kind: 'hack',
      tier: 3,
      titles: ['Own the phones at {target}', 'PBX takeover: {target}', 'Listen in on {target}'],
      descs: [
        "A client wants to hear {target}'s phone system — every extension, every voicemail, every recorded line. The switch is a beige box in a closet nobody has opened since installation.",
        '{target} runs its calls through equipment with a default code printed in a manual anyone can download. Read the whole voicemail spool; it alone is worth the fee.',
        "Turn {target}'s corporate phone network into your client's listening post. Deeply illegal, deeply lucrative.",
      ],
      targets: ['a law firm', 'a real-estate brokerage', 'an insurance office', 'a small newsroom'],
      clients: ['a jealous competitor', 'a private eye', 'a leverage-seeker', 'a "corporate security" contractor'],
      skills: ['networking', 'systems'],
      dc: [17, 19],
      hours: [26, 46],
      pay: [1000, 1950],
      heat: [14, 20],
      cred: [2.2, 3.6],
      op: {
        network: 'corp',
        goal: 'read',
        loot: ['voicemail_spool.dat', 'call_recordings.idx', 'extension_directory.dat'],
        docs: [
          {
            name: 'phone_system_faq.txt',
            content:
              'Q: How do I check voicemail? A: Nobody knows.\nQ: How do I transfer a call? A: You don\'t, you say "hold please" and walk it over.\nQ: What is the manager code? A: It is printed on a sticker on the box, which is the whole problem, isn\'t it.',
          },
          {
            name: 'greeting_scripts.txt',
            content: '"You have reached the desk of someone who is definitely at their desk." — do not use this one again, legal called.',
          },
        ],
      },
    },
    {
      id: 'h3_leak',
      kind: 'hack',
      tier: 3,
      titles: ['Leak the files from {target}', 'Exfiltrate {target}', 'Get the documents out of {target}'],
      descs: [
        'A journalist needs internal documents from {target} that prove what everyone suspects. Their document server assumes the enemy is outside the building. Get the files to daylight.',
        '{target} is hiding something the public should see. Pull the memos, hand them off, and let someone braver publish. Robin Hood work, if Robin Hood carried a modem.',
        "A whistleblower at {target} lost their nerve; your client wants what they couldn't bring out. Quiet extraction, loud consequences.",
      ],
      targets: ['a polluting factory', 'a shady developer', 'a lobbying firm', 'a city contractor'],
      clients: ['an investigative reporter', 'a watchdog group', 'a rival firm', 'a frightened insider'],
      skills: ['intrusion', 'opsec'],
      dc: [17, 20],
      hours: [28, 46],
      pay: [900, 1800],
      heat: [14, 19],
      cred: [2.4, 4],
      rep: { 'fac.loft': 2, 'fac.hood': 1 },
      op: {
        network: 'corp',
        goal: 'download',
        loot: ['internal_memos_{target}.zip', 'the_real_numbers.xls', 'legal_hold_do_not_read.doc', 'board_minutes.doc'],
        docs: [
          {
            name: 'retention_policy.txt',
            content:
              'REMINDER: sensitive emails should be deleted after 90 days. (They are not. Nobody deletes anything. The intern tried once and took down the whole file server. We gave up. It is all still here. All of it.)',
          },
          {
            name: 'crisis_comms_draft.txt',
            content: 'DRAFT statement (do not send): "We take these allegations seriously." DRAFT statement 2: "We take these allegations somewhat seriously." DRAFT statement 3: just the shrug emoji. Legal prefers option 1.',
          },
        ],
      },
    },
    {
      id: 'h3_toll',
      kind: 'hack',
      tier: 3,
      titles: ['Scrub the violations at {target}', 'Clear the record on {target}', 'Erase the tickets from {target}'],
      descs: [
        "A client has a glovebox full of citations from {target} and a wedding to attend before their license is suspended. The violations database is a museum piece that trusts the maintenance account. Make the tickets not exist.",
        '{target} logs every plate, every toll, every red light on a system somebody\'s cousin built in the nineties. Delete the client\'s history and a few decoys so it doesn\'t look targeted.',
        'The client swears the camera at {target} is a scam. Whether it is or not, they want their record wiped. Get into the violations table and let them off the hook.',
      ],
      targets: ['the transit authority', 'the toll-road system', 'the parking enforcement office', 'the red-light camera network'],
      clients: ['a serial red-light runner', 'a delivery driver drowning in tickets', 'a client with one point left', 'a very unlucky commuter'],
      skills: ['intrusion', 'systems'],
      dc: [17, 20],
      hours: [24, 44],
      pay: [950, 1700],
      heat: [14, 20],
      cred: [2, 3.4],
      op: {
        network: 'gov',
        goal: 'delete',
        loot: ['violations_{target}.db', 'plate_history.dat', 'citation_queue.dat'],
        docs: [
          {
            name: 'enforcement_memo.txt',
            content:
              'The camera at 4th and Harbor has issued 11,000 citations this year. It is pointed at a billboard. The billboard has an excellent driving record. IT has been "looking into it" since March.',
          },
          {
            name: 'appeals_backlog.txt',
            content: 'Pending appeals: 4,412. Appeals reviewed this month: 0. Reason: the appeals officer is also the person who runs the cameras, and he is, understandably, conflicted.',
          },
        ],
      },
    },
    {
      id: 'h3_scalp',
      kind: 'hack',
      tier: 3,
      titles: ['Corner the tickets at {target}', 'Presale heist: {target}', 'Grab the block from {target}'],
      descs: [
        "A scalping crew wants the good seats to the reunion tour before {target} lets the public near them. The ticketing back end holds an inventory table it barely guards. Pull the block, hand it over, and let the markups begin.",
        '{target} releases the hot show on Friday and the client wants the front rows now. Copy the seat manifest and the presale codes; the crew turns them into rent.',
        'Every parent in the city will fight for these tickets. The client would rather not fight. Lift the allotment from {target} and sell dawn to the desperate at noon.',
      ],
      targets: ['a national ticketing service', 'a venue box-office system', "the arena's presale portal", 'a concert promoter'],
      clients: ['a scalping crew', 'a "secondary market specialist"', 'a broker with a phone bank', 'a client with three teenage daughters'],
      skills: ['programming', 'business'],
      dc: [17, 19],
      hours: [26, 42],
      pay: [1000, 1800],
      heat: [14, 20],
      cred: [2.1, 3.5],
      op: {
        network: 'media',
        goal: 'download',
        loot: ['seat_manifest_{target}.dat', 'presale_codes.lst', 'inventory_hold.tbl'],
        docs: [
          {
            name: 'onsale_runbook.txt',
            content:
              'FRIDAY 10AM ONSALE PLAN:\n1. Pray.\n2. The queue system will fall over at 10:00:04. This is normal.\n3. Blame the fans for "too much demand."\n4. The good seats were never in the pool anyway. You know this. We know this. Say nothing.',
          },
          {
            name: 'fee_schedule.txt',
            content: 'Convenience fee. Facility fee. Service fee. Processing fee. Fee-processing fee. The ticket is $40. The fees are $41. This is, legally, fine.',
          },
        ],
      },
    },
    {
      id: 'h3_dealership',
      kind: 'hack',
      tier: 3,
      titles: ['Rewind the odometer records at {target}', 'Clean the history on {target}', 'Retitle a car through {target}'],
      descs: [
        "A shady lot wants a flood-damaged wreck to read as a one-owner cream puff. {target} keeps its title and history records on a system built to sell cars, not to stop lies. Edit the paperwork; the buyer will find out on the first rainy day.",
        '{target} logs every mileage reading and accident report a dealer submits. The client needs one car\'s story rewritten before it hits the front row. Grim, profitable, and exactly as sleazy as it sounds.',
        'A client bought back a lemon and wants its record laundered before the resale. Get into {target} and turn a salvage title into something that smells like new-car.',
      ],
      targets: ['the DMV title system', 'a vehicle-history service', 'a dealer finance network', 'the auto registry'],
      clients: ['a curbstone car dealer', 'a wholesale flipper', 'a "certified pre-owned" liar', 'a client with a very wet car'],
      skills: ['intrusion', 'business'],
      dc: [18, 20],
      hours: [28, 46],
      pay: [1100, 2000],
      heat: [15, 22],
      cred: [2.3, 3.7],
      op: {
        network: 'gov',
        goal: 'upload',
        loot: ['title_history_{target}.upd', 'odometer_records.upd', 'salvage_flags.tbl'],
        docs: [
          {
            name: 'inspection_notes.txt',
            content:
              'Vehicle passed inspection. Inspector notes: "smells like a lake." "Seats squish." "Radio only plays one station, very loud, cannot turn off." "10/10 would not buy." Passed anyway; quota is quota.',
          },
          {
            name: 'sales_floor_pep.txt',
            content: 'REMEMBER THE ABC\'s: Always Be Closing. Also remember the D: Do not let them test-drive the wet one in the rain. And the E: Everything is "certified" if you say it confidently enough.',
          },
        ],
      },
    },

    // ─────────────────────────── TIER 4 ────────────────────────────
    {
      id: 'h4_datacenter',
      kind: 'hack',
      tier: 4,
      titles: ['Breach the colo at {target}', 'Data-center job: {target}', 'Get inside {target}'],
      descs: [
        'A client wants a foothold inside {target}, a real data center full of other people\'s machines. This is the deep end — layered defenses, watchful eyes, and a trace clock that starts the moment you knock.',
        '{target} hosts a hundred companies behind one careless perimeter. Get in, plant the client\'s access, and get out before the night operators finish their coffee.',
        "The kind of job that makes a career or ends one. Breach {target}'s racks, own the pipe, and try very hard not to become a headline.",
      ],
      targets: ['a Millgate colocation facility', 'a regional hosting provider', 'a corporate data campus', 'a telecom exchange'],
      clients: ['a well-funded crew', 'a corporate raider', 'a foreign competitor', 'a client who never gives a name'],
      skills: ['intrusion', 'networking'],
      dc: [20, 23],
      hours: [44, 72],
      pay: [1800, 3300],
      heat: [29, 38],
      cred: [3.2, 4.8],
      available: { var: 'w.broadband', gte: 1 },
      op: {
        network: 'corp',
        goal: 'upload',
        loot: ['persistent_access_{target}.kit', 'jump_host.cfg', 'backdoor_cron.job'],
        docs: [
          {
            name: 'noc_night_shift.txt',
            content:
              'NIGHT SHIFT LOG 03:14 — all quiet. 03:15 — coffee machine down, this is a P1 incident, escalating. 03:47 — coffee restored. 03:48 — post-incident review scheduled. Everything else: fine, probably, who\'s checking.',
          },
          {
            name: 'rack_labels.txt',
            content: 'Rack B7: "important, do not touch." Rack B8: "ALSO important." Rack B9: "we think this one is a customer\'s? nobody has logged into it since 2001. it hums. we leave it be."',
          },
        ],
      },
    },
    {
      id: 'h4_exec_mailbox',
      kind: 'hack',
      tier: 4,
      titles: ["Open the CEO's mailbox at {target}", 'Executive access: {target}', 'Read the top floor of {target}'],
      descs: [
        "A client wants everything in the mailbox of {target}'s chief executive — the deals, the affairs, the crimes. The account is guarded by importance and nothing else. What you find is the real product.",
        "{target}'s leadership emails plainly, confidently, and forever. Get the archive. The leverage writes itself, and you don't want to know for whom.",
        'The person at the top of {target} thinks the rules are for other people. Prove them wrong. Very hot, very well paid, morally radioactive.',
      ],
      targets: ['a shipping conglomerate', 'a media company', 'a bank holding group', 'a defense contractor'],
      clients: ['a corporate blackmailer', 'an activist fund', 'a rival board member', 'a client with a long memory'],
      skills: ['social', 'intrusion'],
      dc: [21, 24],
      hours: [40, 68],
      pay: [1950, 3600],
      heat: [31, 41],
      cred: [3.4, 5],
      op: {
        network: 'corp',
        goal: 'read',
        loot: ['ceo_inbox.mbx', 'private_folder.mbx', 'the_deal_we_dont_talk_about.mbx'],
        docs: [
          {
            name: 'exec_assistant_notes.txt',
            content:
              'Reminders for the boss: 1. Board call at 2 (he will "forget"). 2. Do NOT reply-all to the whole company again. 3. The password is on the sticky note under the phone, which I have asked him to move 400 times.',
          },
          {
            name: 'calendar_conflicts.txt',
            content: 'THU: "strategy lunch" (golf). FRI: "investor sync" (also golf). SAT: "family time" (golf, but he says it counts). The empire runs itself, apparently, from the ninth hole.',
          },
        ],
      },
    },
    {
      id: 'h4_trading',
      kind: 'hack',
      tier: 4,
      titles: ['Front-run {target}', 'Skim the trades at {target}', 'Get ahead of {target}'],
      descs: [
        "A client wants a peek at {target}'s order flow a half-second before the market does. Their trading system was built for speed, not safety. The math is beautiful; the sentence would be long.",
        "Sit quietly inside {target}'s brokerage systems and read the future by minutes. The client trades on it; you take a flat fee and no witnesses.",
        "Copy {target}'s order book before it clears in a way the auditors won't model until it's far too late. This is the job that gets its own task force.",
      ],
      targets: ['a boutique brokerage', 'a regional exchange', 'a hedge fund', 'a clearing house'],
      clients: ['a rogue trader', 'a quant with a plan', 'a very wealthy stranger', 'an offshore fund'],
      skills: ['programming', 'cryptography'],
      dc: [21, 24],
      hours: [48, 78],
      pay: [2100, 3600],
      heat: [31, 41],
      cred: [3.5, 5],
      available: { var: 'w.broadband', gte: 1 },
      op: {
        network: 'bank',
        goal: 'read',
        loot: ['order_flow_{target}.log', 'pending_book.dat', 'settlement_queue.dat'],
        docs: [
          {
            name: 'risk_desk_memo.txt',
            content:
              'The risk model says we are fine. The risk model has said we are fine every day, including the days we were extremely not fine. We keep the risk model for morale. His name is Kevin. Say hi to Kevin.',
          },
          {
            name: 'compliance_wink.txt',
            content: 'ALL TRADERS: reminder that trading on non-public information is illegal, unethical, and against firm policy. That said, great quarter, everyone. Truly uncanny timing across the board. Anyway. Illegal. Don\'t.',
          },
        ],
      },
    },
    {
      id: 'h4_utility',
      kind: 'hack',
      tier: 4,
      titles: ['Get into the control panel at {target}', 'Infrastructure job: {target}', 'Own the board at {target}'],
      descs: [
        "A client wants access to {target}'s operations dashboard — not to break anything, they insist, just to watch. You don't believe them. The systems are old, isolated, and terrifyingly trusting.",
        '{target} runs a piece of the city on software older than the internet. Get the client a window into it and try not to think about what a less careful buyer would do.',
        "The kind of access that makes governments nervous. Read {target}'s monitoring layer, hand over the keys, and hope your client is only bluffing about why.",
      ],
      targets: ['a water-treatment utility', 'a regional power co-op', 'a transit authority', 'a port operations center'],
      clients: ['a "resilience consultant"', 'a foreign buyer', 'a doomsday prepper with money', 'a client you should have refused'],
      skills: ['systems', 'networking'],
      dc: [22, 24],
      hours: [50, 80],
      pay: [2250, 3600],
      heat: [34, 43],
      cred: [3.6, 5],
      op: {
        network: 'gov',
        goal: 'read',
        loot: ['scada_console.snap', 'control_credentials.dat', 'operations_dashboard.cfg'],
        docs: [
          {
            name: 'control_room_sign.txt',
            content:
              'IN CASE OF ALARM: 1. It is probably the sensor again. 2. Check if it is the sensor again. 3. It was the sensor again. 4. Silence the alarm. 5. Do not, whatever you do, actually replace the sensor; that requires a form.',
          },
          {
            name: 'shift_handover.txt',
            content: 'Handover notes: everything nominal. Valve 12 makes a noise now. It is a new noise. We have named it. It is called Gerald. Gerald seems fine. Monitor Gerald.',
          },
        ],
      },
    },
    {
      id: 'h4_broker_snoop',
      kind: 'hack',
      tier: 4,
      titles: ['Snoop the data broker {target}', 'Peek inside {target}', 'Sample the files at {target}'],
      descs: [
        'A client wants a sample of what {target}, a "consumer insight" firm, actually keeps on people. What you find in there will keep you up at night. Very hot; someone protects places like this.',
        '{target} sells the correlations no one admits to buying. Get inside, copy a slice, and understand for the first time how much of the city is already for sale.',
        'A cautious client suspects {target} is more than a marketing company. Bring back proof — and be ready for the possibility that {target} noticed you looking.',
      ],
      targets: ['a consumer-data firm', 'a "risk scoring" outfit', 'a credit-analytics company', 'a marketing-intelligence shop'],
      clients: ['a nervous journalist', 'a privacy activist', 'a rival broker', 'a client who seems to already know too much'],
      skills: ['intrusion', 'opsec'],
      dc: [21, 24],
      hours: [46, 76],
      pay: [1800, 3300],
      heat: [31, 41],
      cred: [3.5, 5],
      rep: { 'fac.loft': 2 },
      op: {
        network: 'corp',
        goal: 'download',
        loot: ['profile_sample_{target}.db', 'correlation_engine.cfg', 'scored_households.csv', 'client_list_buyers.txt'],
        docs: [
          {
            name: 'product_overview.txt',
            content:
              'What we sell: a number. A single number, for every person, that says how much they are worth and how much they can be trusted. What the number is based on: everything. What we tell people the number is based on: nothing, ideally.',
          },
          {
            name: 'ethics_review.txt',
            content: 'Q3 ETHICS REVIEW\nAttendees: 0\nMinutes: none\nAction items: hold an ethics review\nStatus: rolled over from Q2, which rolled over from Q1. We are, ethically, extremely behind.',
          },
        ],
      },
    },
    {
      id: 'h4_casino',
      kind: 'hack',
      tier: 4,
      titles: ['Lift the whale list from {target}', 'Comp the client at {target}', 'Own the floor systems at {target}'],
      descs: [
        "A client wants {target}'s list of high-rollers — who they are, what they owe, and exactly how much the house lets them lose. The player-tracking system logs everything and guards almost nothing. The list is the whole payday.",
        "{target} tracks every card, every comp, every marker on a floor system that assumes the enemy tips in chips. Copy the high-roller database; someone will pay a fortune to know who those people are.",
        "The client runs a discreet business built on other people's gambling debts and needs {target}'s player files to feed it. Get in through the loyalty back end and out before the pit boss blinks.",
      ],
      targets: ['a riverboat casino', 'a resort gaming floor', 'a card room on the Sound', 'a tribal gaming operation'],
      clients: ['a loan shark with a spreadsheet', 'a rival house', 'a "hospitality consultant"', 'a client who buys debts'],
      skills: ['intrusion', 'business'],
      dc: [20, 23],
      hours: [44, 72],
      pay: [1650, 3150],
      heat: [29, 38],
      cred: [3.3, 4.8],
      op: {
        network: 'corp',
        goal: 'download',
        loot: ['high_rollers_{target}.db', 'markers_outstanding.dat', 'player_tracking.db', 'comp_ledger.dat'],
        docs: [
          {
            name: 'pit_boss_notes.txt',
            content:
              'Whale in seat 3 is down forty grand and very happy. Comp him the steak. Comp him two steaks. Comp him the honeymoon suite even though he came alone. A happy whale is a returning whale. Sad whales stay home.',
          },
          {
            name: 'surveillance_log.txt',
            content: 'Eye in the sky report: card counter at table 7 (asked politely to enjoy the buffet instead). Man arguing with a slot machine at table nobody, there is no table there, he brought his own chair. Quiet night otherwise.',
          },
        ],
      },
    },
    {
      id: 'h4_airline',
      kind: 'hack',
      tier: 4,
      titles: ['Mint miles at {target}', 'Upgrade the client on {target}', "Loot the loyalty vault at {target}"],
      descs: [
        "A crew wants {target}'s frequent-flyer program bled for everything it's worth — miles minted, status granted, awards booked and resold before the airline reconciles. The loyalty back end is a relic bolted to a modern site. Classic points-laundering, jet fuel edition.",
        "{target} hands out miles like confetti and tracks them like an afterthought. Credit the client's accounts, elevate them to the good cabin, and let the crew turn air into cash.",
        "The client resells first-class award seats they never paid for. Get into {target}'s program database, top up the balances, and vanish before an auditor learns to fly.",
      ],
      targets: ['a regional airline', 'a national carrier loyalty program', 'an alliance rewards hub', 'a charter operator'],
      clients: ['a miles-broker crew', 'a "travel hacker" gone pro', 'a reseller of award seats', 'a client who is never home'],
      skills: ['programming', 'systems'],
      dc: [20, 23],
      hours: [46, 74],
      pay: [1500, 2850],
      heat: [29, 38],
      cred: [3.2, 4.7],
      available: { var: 'w.broadband', gte: 1 },
      op: {
        network: 'corp',
        goal: 'upload',
        loot: ['miles_credit_{target}.txn', 'status_override.upd', 'award_booking.txn'],
        docs: [
          {
            name: 'loyalty_terms.txt',
            content:
              'Miles have no cash value, expire unpredictably, cannot be used on the flights you want, and may be devalued at any time for any reason. They are, legally, "a feeling." Enjoy your feeling. Fly again soon.',
          },
          {
            name: 'gate_agent_log.txt',
            content: 'Upgrade requests today: 212. Upgrades available: 1. Awarded to: the man who cried, out of the 212 who cried. It was the quietest crying. Very dignified. He earned it.',
          },
        ],
      },
    },

    // ─────────────────────────── TIER 5 ────────────────────────────
    {
      id: 'h5_bank_vault',
      kind: 'hack',
      tier: 5,
      titles: ['Drain {target}', 'The big one: {target}', 'Empty the vault at {target}'],
      descs: [
        'The job people whisper about. {target} moved its wealth online and its security stayed in the last century. The take is life-changing; so is the sentence. Nothing about this is quiet.',
        "{target} is the bank at the top of the tower. Get in, move the money in ways the auditors can't follow for days, and disappear. Miss, and every agency in the region learns your handle.",
        'One night, {target}, and never having to work again — or ever again being able to. The heat this throws off can be seen from space.',
      ],
      targets: ['Meridian Trust', 'the Harbor Point clearing bank', 'a national retail bank', 'a private wealth vault'],
      clients: ['a crew assembling for the score', 'a client with a getaway already planned', 'a syndicate', 'yourself, honestly'],
      skills: ['intrusion', 'cryptography'],
      dc: [25, 28],
      hours: [70, 120],
      pay: [3750, 6000],
      heat: [52, 70],
      cred: [5, 7],
      available: { var: 'w.broadband', gte: 1 },
      op: {
        network: 'bank',
        goal: 'download',
        loot: ['wire_transfers_{target}.txn', 'vault_ledger.dat', 'account_master.db', 'reconciliation.dat'],
        docs: [
          {
            name: 'vault_procedures.txt',
            content:
              'DUAL CONTROL POLICY: no single employee may authorize a large transfer alone. (In practice, Doreen has both keys because Frank is "bad with keys." So: one control. It is one control. It has always been one control. Frank, get it together.)',
          },
          {
            name: 'core_banking_readme.txt',
            content: 'The core system runs on a mainframe installed the year the tower opened. Nobody who understands it still works here. We feed it, we do not question it, and once a month we bring it a small offering (a tape backup nobody has ever tested).',
          },
        ],
      },
    },
    {
      id: 'h5_gov_records',
      kind: 'hack',
      tier: 5,
      titles: ['Own the records at {target}', 'Municipal vault: {target}', 'Rewrite {target}'],
      descs: [
        'A client wants deep, permanent access to {target}\'s records — identities, deeds, warrants, the machinery of who officially exists. The systems are ancient, sprawling, and guarded now by federal money.',
        '{target} is the city\'s memory. Get inside and your client can make a person, erase a person, or own a person. The scariest job on the board, and the best paid.',
        'Whoever controls {target} controls the paperwork of a whole city. Own it, hand over the keys, and understand that this is the kind of thing wars are fought over.',
      ],
      targets: ['the county records office', 'the municipal identity registry', 'the courts data center', 'the vehicle registry mainframe'],
      clients: ['a forger with ambitions', 'an identity syndicate', 'a client erasing themselves', 'a power broker'],
      skills: ['systems', 'intrusion'],
      dc: [25, 28],
      hours: [72, 120],
      pay: [3000, 5700],
      heat: [49, 67],
      cred: [4.5, 7],
      op: {
        network: 'gov',
        goal: 'upload',
        loot: ['identity_registry_{target}.upd', 'deed_records.upd', 'warrant_index.upd', 'birth_records.upd'],
        docs: [
          {
            name: 'records_office_sign.txt',
            content:
              'PUBLIC NOTICE: Records requests take 6-8 weeks. Records corrections take 6-8 months. Records that have been "in review" the longest: a man trying to prove he is not dead. He is not dead. The system disagrees. It has disagreed since 1998.',
          },
          {
            name: 'migration_status.txt',
            content: 'The great records digitization project is 40% complete and has been 40% complete for four years. The other 60% is in a basement, in boxes, under a leak. The leak is winning.',
          },
        ],
      },
    },
    {
      id: 'h5_exchange',
      kind: 'hack',
      tier: 5,
      titles: ['Tap the backbone at {target}', 'Own the trunk: {target}', 'Sit on the wire at {target}'],
      descs: [
        "A client wants a permanent, invisible read on {target}, the trunk that half the city's data crosses. Do it once, do it perfectly, and you hear the flow of a metropolis. Do it wrong and you own a cell.",
        '{target} is a chokepoint — old copper and new fiber braided together where nobody thinks to look. Whoever reads it reads everything. Your client wants to be that whoever.',
        "The purest, most dangerous access there is. Read {target} without a ripple, and hand your client the nervous system of Port Lumen.",
      ],
      targets: ['the copper exchange', 'the NorthLink core', 'the Millgate fiber trunk', 'the regional peering point'],
      clients: ['an intelligence buyer', 'a data broker', 'a syndicate', 'a client whose name you will never learn'],
      skills: ['networking', 'opsec'],
      dc: [25, 28],
      hours: [72, 120],
      pay: [3600, 6000],
      heat: [52, 70],
      cred: [5, 7],
      available: { var: 'w.broadband', gte: 2 },
      op: {
        network: 'isp',
        goal: 'read',
        loot: ['trunk_traffic_{target}.cap', 'routing_tables.dat', 'peering_agreements.dat', 'lawful_intercept.cfg'],
        docs: [
          {
            name: 'exchange_history.txt',
            content:
              'This building has switched the city\'s calls since 1952. It survived the fire, the flood, the strike, and the year the pigeons got in. The new fiber crew calls it "legacy." Marge calls it "the only thing here that still works."',
          },
          {
            name: 'maintenance_log.txt',
            content: 'Frame 3 still hums. Do not fix the hum. The hum is load-bearing. Three separate contractors have "fixed" the hum and each time something two floors up stopped working. The hum stays. Respect the hum.',
          },
        ],
      },
    },
    {
      id: 'h5_pharma',
      kind: 'hack',
      tier: 5,
      titles: ['Lift the research from {target}', 'Crown jewels: {target}', 'Steal the future from {target}'],
      descs: [
        "A client will pay a fortune for {target}'s core research — a decade of work compressed into a few encrypted drives behind the best security money forgot to renew. Nation-state money hunts jobs like this.",
        '{target} is sitting on something worth billions and defending it like it\'s worth thousands. Get the whole archive out clean; the client\'s buyer is already waiting.',
        "The kind of theft that reshapes an industry. Breach {target}, take the encrypted archive around the good stuff, and hand your client the keys to somebody else's decade.",
      ],
      targets: ['a pharma research lab', 'a chip-design house', 'an aerospace firm', 'a materials-science startup'],
      clients: ['a foreign conglomerate', 'a competitor gone desperate', 'a broker for a state', 'an anonymous buyer with unlimited funds'],
      skills: ['cryptography', 'intrusion'],
      dc: [26, 28],
      hours: [80, 120],
      pay: [3900, 6000],
      heat: [49, 67],
      cred: [5, 7],
      available: { var: 'w.broadband', gte: 1 },
      op: {
        network: 'lab',
        goal: 'download',
        loot: ['research_archive_{target}.enc', 'trial_data.enc', 'formulation_notes.enc', 'the_good_stuff.enc'],
        docs: [
          {
            name: 'lab_notebook_excerpt.txt',
            content:
              'Day 1,847 of the project. Batch 12 failed. Batch 13 failed. Batch 14 failed but in an interesting way that made everyone go very quiet. Batch 15 is in the freezer with a sticky note that just says "maybe??" We do not touch batch 15.',
          },
          {
            name: 'security_reminder.txt',
            content: 'Reminder: the research drives are encrypted, air-gapped, and stored in a vault. (The vault code is the founder\'s anniversary. He mentions it in every all-hands. His wife has asked him to stop. He has not stopped.)',
          },
        ],
      },
    },
    {
      id: 'h5_offshore',
      kind: 'hack',
      tier: 5,
      titles: ['Crack the shells at {target}', 'Follow the money through {target}', 'Own the offshore book at {target}'],
      descs: [
        "A client wants the hidden ownership behind {target}, an offshore bank that exists to make money forget where it came from. The account tree is a labyrinth built to never be read from the outside. Read it. Someone very powerful wants to know who owns whom.",
        "{target} launders the region's dirtiest fortunes through a nest of shell companies. Copy the beneficial-ownership records; the client turns other people's secrets into leverage.",
        'The client is either a tax investigator or a blackmailer — you honestly cannot tell, and the fee is identical. Get into {target}\'s offshore ledgers and bring back who really owns the money.',
      ],
      targets: ['an island private bank', 'a shell-company registry', 'an offshore trust service', 'a "wealth privacy" firm'],
      clients: ['a tax investigator off the books', 'a blackmailer with ambition', 'a rival launderer', 'a client who wants a name on a list'],
      skills: ['cryptography', 'business'],
      dc: [25, 28],
      hours: [76, 120],
      pay: [3300, 5850],
      heat: [46, 64],
      cred: [4.6, 6.8],
      available: { var: 'w.broadband', gte: 1 },
      op: {
        network: 'bank',
        goal: 'download',
        loot: ['beneficial_owners_{target}.enc', 'shell_registry.db', 'trust_deeds.enc', 'the_real_names.txt'],
        docs: [
          {
            name: 'onboarding_faq.txt',
            content:
              'Q: Will anyone know I own this company? A: No.\nQ: Will *I* know I own this company? A: Only if you write it down, which we strongly advise against.\nQ: Is this legal? A: It is legal *here*. Where you are is your own affair.',
          },
          {
            name: 'client_nicknames.txt',
            content: 'For discretion, high-value clients are referred to only by animal codename. Currently active: the Heron, the Mongoose, two separate Foxes (awkward at the gala), and one client who insisted on being "the Kevin." We do not ask.',
          },
        ],
      },
    },
  ],
})
