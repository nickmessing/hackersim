import { dayOf } from '@/engine/calendar'
import { defineContent } from '@/engine/registry'

/**
 * ECON — Procedural HACK contract templates for the underground board, TIERS 1–2 (the early
 * board). Tiers 3–5 live in the sibling file `contracts_hack_t345.ts`. The board instantiates
 * these into concrete jobs, substituting a random `{target}` and picking a `titles`/`descs`/
 * `clients` variant. Tiers gate on `cred` (engine `CRED_TIERS`); some also gate on era or
 * world state, and some pay out small faction rep.
 *
 * Every template carries an `op` recipe: the network archetype, the goal and the loot the
 * procedural terminal op is generated from, plus a few in-world flavor documents to find on the
 * hosts. Pay and heat here are FINAL (the engine's per-tier pay multipliers are retired). Weekly-turn
 * balance: hack money is untaxed and a skilled hacker runs roughly one op a turn, so pay stays modest
 * and base heat climbs steeply with tier (before opsec, gear and approach cut it down):
 *   tier 1  $150–400      heat 3–6
 *   tier 2  $450–1,250    heat 6–11
 *   tier 3  $900–2,250    heat 14–22
 *   tier 4  $1,500–3,600  heat 29–43
 *   tier 5  $3,000–6,000  heat 46–70
 *
 * HARD RULE: all "hacking" here is texture, not technique — invented sites, invented networks,
 * invented files and office gossip. No real targets, tools, commands or procedures appear below.
 */

const Y2002 = dayOf(2002, 0, 1)
const Y2003 = dayOf(2003, 0, 1)

export default defineContent({
  contractTemplates: [
    // ─────────────────────────── TIER 1 ────────────────────────────
    {
      id: 'h1_deface',
      kind: 'hack',
      tier: 1,
      titles: ['Redecorate {target}', 'Leave a mark on {target}', 'Graffiti job: {target}'],
      descs: [
        'A client wants a rival\'s homepage replaced with something embarrassing. {target} is held together with duct tape and optimism. In and out before the webmaster wakes up.',
        'Petty, harmless, and good for the reputation. Swap {target}\'s front page for a calling card. Nobody gets hurt except an ego.',
        'A guestbook feud escalated. Deface {target}, sign it pretty, and let the flame war do the rest.',
      ],
      targets: ['a fan-site for a defunct boy band', 'a rival BBS landing page', "a jerk's HomeSteader shrine", "a local band's free-host page"],
      clients: ['a spiteful ex-webmaster', 'someone with a grudge', 'a forum regular', 'an anonymous tipster'],
      skills: ['intrusion'],
      dc: [10, 13],
      hours: [6, 12],
      pay: [150, 300],
      heat: [3, 5],
      cred: [0.5, 1.2],
      op: {
        network: 'isp',
        goal: 'upload',
        loot: ['calling_card.html', 'index_new.html', 'greetz_page.html'],
        docs: [
          {
            name: 'webmaster_todo.txt',
            content:
              'TODO (updated 3 months ago):\n- fix the spinning skull gif, it spins the wrong way\n- answer guestbook entry #212 ("ur site sux")\n- ANSWER IT WITTILY\n- buy more hit counter digits, we are almost at 1000',
          },
          {
            name: 'guestbook_recent.txt',
            content:
              '#214  "cool site!!! check out mine"  — xX_DarkAngel_Xx\n#215  "the midi on the front page will not stop playing. please. i have a family"  — anon\n#216  "sign my guestbook back!!!"  — xX_DarkAngel_Xx',
          },
        ],
      },
    },
    {
      id: 'h1_gradebump',
      kind: 'hack',
      tier: 1,
      titles: ['Fix a grade at {target}', 'Report-card special: {target}', 'A little help at {target}'],
      descs: [
        'Some kid at {target} needs a C to become a B. The gradebook software is from a decade ago and trusts everyone. Quiet work, quiet pay.',
        'A desperate student found your handle. {target} keeps its records on a machine that still boots to a smiley face. Nudge one number, change one life, allegedly.',
        'Attendance, not grades, this time — {target} logs it in a spreadsheet a toddler could edit. Make a truant look diligent.',
      ],
      targets: ['Lumen Central High', 'St. Brigid Academy', 'the community college', 'Harbor Vocational'],
      clients: ['a panicking senior', "somebody's kid brother", 'a very nervous sophomore', 'a parent who won\'t ask questions'],
      skills: ['intrusion', 'systems'],
      dc: [10, 14],
      hours: [8, 14],
      pay: [170, 360],
      heat: [3, 6],
      cred: [0.6, 1.4],
      op: {
        network: 'school',
        goal: 'upload',
        loot: ['gradebook_patch.dat', 'attendance_fix.csv', 'term_marks_{target}.upd'],
        docs: [
          {
            name: 'staffroom_notice.txt',
            content:
              'TO ALL STAFF: the gradebook machine is NOT a coffee coaster. It is also not a footrest. It is a computer, and it is the only one we have. — Admin Office',
          },
          {
            name: 'mr_dorsey_notes.txt',
            content:
              'Period 3 again pretending the fire drill "counted as a quiz." It did not. Half of them are going to fail geometry and the other half are going to fail geometry loudly.',
          },
        ],
      },
    },
    {
      id: 'h1_crack_shareware',
      kind: 'hack',
      tier: 1,
      titles: ['Crack {target}', 'Kill the nag screen on {target}', 'Free {target}'],
      descs: [
        'Somebody wants {target} without the thirty-day timer. The vendor keeps its registration list on the same little server as its storefront. Lift the list, ship the keys, feel like a wizard.',
        '{target} nags for registration every launch. Make it stop, forever. The scene will thank you; the developer will not.',
        'A classic warez request: get the unlock codes for {target} off the vendor\'s server and post them. Low risk, decent cred.',
      ],
      targets: ['a screensaver suite', 'a shareware paint program', 'a fax utility', 'a CD-burning tool', 'a solitaire collection'],
      clients: ['a cheapskate on the forum', 'a warez board regular', 'the whole scene, really', 'a lurker with a pager'],
      skills: ['programming', 'intrusion'],
      dc: [11, 14],
      hours: [7, 13],
      pay: [150, 320],
      heat: [3, 5],
      cred: [0.8, 1.5],
      op: {
        network: 'shop',
        goal: 'download',
        loot: ['regkeys.db', 'serials_master.txt', 'unlock_codes.lst'],
        docs: [
          {
            name: 'from_the_developer.txt',
            content:
              'Dear user: this program was written by one man in one spare bedroom over four winters. Registration is $15. That is less than a pizza. I have eaten a lot of pizza for this program. Please register.',
          },
          {
            name: 'sales_tally.txt',
            content: 'Registrations this month: 11\nDownloads this month: 4,203\nMood: philosophical',
          },
        ],
      },
    },
    {
      id: 'h1_snoop_mail',
      kind: 'hack',
      tier: 1,
      titles: ['Read {target}\'s webmail', 'Peek at {target}', 'Quiet look inside {target}'],
      descs: [
        'A client is sure their partner is cheating and wants proof from {target}. The account guards itself with a hint question a stranger could answer. Grim, easy money.',
        'Somebody wants to know what {target} is really saying about them. Get in, read, get out, tell no one. Especially not the client\'s better judgment.',
        'Low, petty, human. {target} keeps a lifetime of mail behind a login nobody has changed since the modem was new. You\'ll feel like you need a shower.',
      ],
      targets: ["a suspicious spouse's inbox", "a business partner's account", "an ex's webmail", "a landlord's mailbox"],
      clients: ['a jealous partner', 'a paranoid tenant', 'a private investigator, unlicensed', 'someone who won\'t meet your eyes'],
      skills: ['intrusion', 'social'],
      dc: [10, 13],
      hours: [6, 12],
      pay: [180, 380],
      heat: [4, 6],
      cred: [0.5, 1.3],
      op: {
        network: 'isp',
        goal: 'read',
        loot: ['inbox.mbx', 'drafts.mbx', 'sent_items.mbx'],
        docs: [
          {
            name: 'service_banner.txt',
            content:
              'LumenMail FREE — now with 4 MB of storage! That\'s room for over 400 emails! Upgrade to LumenMail PLUS for a mailbox so big you\'ll never delete anything again (you will).',
          },
          {
            name: 'abuse_queue.txt',
            content: 'Open abuse reports: 1,882\nReports closed this week: 3\nNote from night shift: "we need more people or fewer customers"',
          },
        ],
      },
    },
    {
      id: 'h1_arcade_score',
      kind: 'hack',
      tier: 1,
      titles: ['Own the leaderboard at {target}', 'High-score heist: {target}', 'Immortalize a name at {target}'],
      descs: [
        'A regular wants their initials at the top of every machine in {target}, forever. The cabinets report their scores to a little box in the office that forgets nothing and questions less.',
        'Rig the online leaderboard for {target} so one lucky kid rules it. Pure ego, pure fun, barely a crime.',
        'The scene at {target} has a rivalry and a budget. Put your client on top and keep them there.',
      ],
      targets: ['the Sodium Row arcade', 'the pizza-place cabinet', "Cathode's back-corner machine", 'the online score board'],
      clients: ['an arcade legend', 'a teenager with allowance money', 'a nostalgic thirty-something', 'the byteme crowd'],
      skills: ['intrusion', 'hardware'],
      dc: [10, 12],
      hours: [6, 11],
      pay: [150, 260],
      heat: [3, 4],
      cred: [0.6, 1.4],
      rep: { 'fac.hood': 1 },
      op: {
        network: 'shop',
        goal: 'upload',
        loot: ['hiscore.tbl', 'leaderboard_new.tbl', 'initials_forever.tbl'],
        docs: [
          {
            name: 'manager_memo.txt',
            content:
              'Reminder: the token machine is not "broken," it is "hungry." Kick it gently, on the left side, and only once. And whoever keeps entering "BUT" as their initials: we see you. We have always seen you.',
          },
          {
            name: 'tech_log.txt',
            content: 'Cab 4: joystick sticky (soda). Cab 7: joystick sticky (unknown). Cab 9: sticky everything. Ordered more wipes.',
          },
        ],
      },
    },
    {
      id: 'h1_isp_hours',
      kind: 'hack',
      tier: 1,
      titles: ['Free hours from {target}', 'Bottomless dial-up on {target}', 'Never log off {target}'],
      descs: [
        'The client is tired of {target} metering their internet by the minute. Their billing runs on trust and a modem bank. Make the meter forget last month ever happened.',
        '{target} bills overage minutes in a nightly batch. Lose the client\'s page of it. Classic, victimless-ish, and a rite of passage.',
        'A dial-up account on {target} that never bills and never disconnects. The kind of favor that earns you a friend for life.',
      ],
      targets: ['a walled-garden ISP', 'the free-trial disc people', 'a regional dial-up', 'a national online service'],
      clients: ['a broke college kid', 'a family of four sharing one line', 'a fellow scene member', 'a night-owl neighbor'],
      skills: ['networking', 'intrusion'],
      dc: [11, 14],
      hours: [8, 15],
      pay: [160, 340],
      heat: [4, 6],
      cred: [0.7, 1.5],
      op: {
        network: 'isp',
        goal: 'delete',
        loot: ['minutes_ledger.dat', 'overage_batch.dat', 'meter_queue.dat'],
        docs: [
          {
            name: 'retention_script.txt',
            content:
              'IF CUSTOMER WANTS TO CANCEL: 1. Express sadness. 2. Offer 50 free hours. 3. Offer 100 free hours. 4. Remind them about the free CD. 5. Put them on hold until they forget why they called.',
          },
          {
            name: 'noc_whiteboard.txt',
            content: 'Busy signals reported: yes\nBusy signals fixed: no\nDays since last "the internet is down" call: 0',
          },
        ],
      },
    },
    {
      id: 'h1_forum_justice',
      kind: 'hack',
      tier: 1,
      titles: ['Settle a score on {target}', 'Moderator problem at {target}', 'Fix the flame war on {target}'],
      descs: [
        'A tyrant sysop on {target} banned the client for a bad opinion. Lift the ban from the board\'s own machine — which, as it happens, lives in the sysop\'s basement next to the water heater.',
        '{target} is run by a power-tripping sysop out of his spare room. Quietly undo the client\'s exile and let the drama write itself.',
        'The client got doxxed on {target} and wants it scrubbed. Get in, delete the thread, leave the sysop to wonder where it went.',
      ],
      targets: ['a car-enthusiast BBS', 'a wrestling fan forum', 'a regional message board', 'a hobbyist bulletin board'],
      clients: ['a banned regular', 'a humiliated poster', 'a lurker with a grudge', 'a moderator\'s rival'],
      skills: ['intrusion', 'social'],
      dc: [10, 13],
      hours: [6, 12],
      pay: [150, 300],
      heat: [3, 5],
      cred: [0.5, 1.3],
      op: {
        network: 'home',
        goal: 'delete',
        loot: ['banlist.cfg', 'thread_4471.msg', 'dox_thread.msg'],
        docs: [
          {
            name: 'sysop_rules.txt',
            content:
              'RULES OF THE BOARD\n1. The sysop is always right.\n2. If the sysop is wrong, see rule 1.\n3. No flaming (the sysop may flame).\n4. Board is down Tuesdays when Mom needs the phone.',
          },
          {
            name: 'mom_note.txt',
            content: 'KEVIN. The computer is making the dial noise at 3 AM again. Some of us have work. Also there is lasagna in the fridge. — Mom',
          },
        ],
      },
    },
    {
      id: 'h1_phreak_call',
      kind: 'hack',
      tier: 1,
      titles: ['Free the line at {target}', 'Long-distance favor on {target}', 'Phone gremlin: {target}'],
      descs: [
        'The client\'s family is overseas and {target} charges a fortune per minute. The routing gear is old and forgetful. Teach it one new, generous habit and look away.',
        '{target} routes calls through gear older than you are. An elder in the scene told you stories about machines like this. Time to live one.',
        'A homesick client just wants to talk to their mother without a hundred-dollar bill. {target} can afford the favor and won\'t notice.',
      ],
      targets: ['the regional phone exchange', 'a long-distance carrier', 'an old switching station', 'a calling-card service'],
      clients: ['a homesick immigrant', 'an elderly widower', 'a college kid far from home', 'a scene old-timer'],
      skills: ['networking', 'hardware'],
      dc: [11, 14],
      hours: [7, 14],
      pay: [160, 330],
      heat: [4, 6],
      cred: [0.8, 1.5],
      rep: { 'fac.hood': 1 },
      op: {
        network: 'isp',
        goal: 'upload',
        loot: ['calling_plan_override.cfg', 'free_trunk.rt', 'family_rate.rt'],
        docs: [
          {
            name: 'lineman_log.txt',
            content:
              'Frame 3 humming again. Checked it, talked to it, it stopped. Do not tell the new guys I talk to it. — M.O.',
          },
          {
            name: 'retirement_card.txt',
            content: '"Thirty-one years and you never once dropped a call you didn\'t mean to. Enjoy the fishing." — everyone on second shift',
          },
        ],
      },
    },
    {
      id: 'h1_yearbook',
      kind: 'hack',
      tier: 1,
      titles: ['Leak the yearbook at {target}', 'Superlative intel: {target}', 'Read the proofs at {target}'],
      descs: [
        'The yearbook committee at {target} voted on "Most Likely To" categories, and the client must know — tonight — whether they won "Most Likely to Peak in High School." Grab the proofs before the printer does.',
        'Somebody at {target} is certain the senior quotes page will ruin their life. Get the draft so they can prepare emotionally, or transfer schools.',
        'The client wants a preview of {target}\'s yearbook before it ships. The committee\'s machine lives in a closet next to the mascot costume. Nobody guards the mascot costume either.',
      ],
      targets: ['Lumen Central High', 'Harbor Vocational', 'Millgate Prep', 'Cannery Row Middle'],
      clients: ['a nervous class treasurer', 'the homecoming runner-up', 'a senior with a secret', 'the yearbook committee\'s ex-member'],
      skills: ['intrusion', 'systems'],
      dc: [10, 13],
      hours: [6, 12],
      pay: [150, 280],
      heat: [3, 4],
      cred: [0.5, 1.2],
      op: {
        network: 'school',
        goal: 'download',
        loot: ['superlatives_final.doc', 'senior_quotes.txt', 'yearbook_proofs.zip'],
        docs: [
          {
            name: 'committee_minutes.txt',
            content:
              'Motion to rename "Class Clown" to "Most Likely to Be Asked to Leave": passed 4-1.\nMotion to stop using Comic Sans: failed 1-4.\nMotion to buy more pizza: passed unanimously, forever.',
          },
          {
            name: 'advisor_note.txt',
            content: 'Kids — the printer deadline is FRIDAY. Not "Friday-ish." Not "the Friday after." I am begging you. — Ms. Albright',
          },
        ],
      },
    },
    {
      id: 'h1_radio_contest',
      kind: 'hack',
      tier: 1,
      titles: ['Rig the countdown at {target}', 'Top Nine at Nine: {target}', 'Be caller number nine at {target}'],
      descs: [
        'A Cannery Row garage band has been one vote short of the Top Nine at Nine on {target} for eleven straight weeks. The tally lives on a machine behind the studio. Make it twelve and done.',
        '{target} runs a call-in contest for concert tickets and the client has called four hundred times. Just once, let them be caller number nine.',
        'The request countdown on {target} is decided by a spreadsheet and an intern. Give the intern a pleasant surprise and the band a shot at fame.',
      ],
      targets: ['KLUM 94.1', 'the college radio station', 'a classic-rock AM station', 'the Sound\'s late-night request show'],
      clients: ['a garage band\'s drummer', 'a superfan with a busy-signal problem', 'the band\'s mom', 'a DJ with a grudge against the playlist'],
      skills: ['intrusion', 'social'],
      dc: [10, 13],
      hours: [6, 12],
      pay: [150, 300],
      heat: [3, 5],
      cred: [0.6, 1.3],
      rep: { 'fac.hood': 1 },
      op: {
        network: 'media',
        goal: 'upload',
        loot: ['countdown_votes.dat', 'request_tally.dat', 'caller_queue.dat'],
        docs: [
          {
            name: 'program_director.txt',
            content:
              'Reminder to all DJs: we are contractually obligated to play the power ballad twice an hour. I know. I KNOW. Take it up with the station owner\'s wife.',
          },
          {
            name: 'intern_log.txt',
            content: 'Took 212 calls. 200 were the same guy. Very polite guy. Voted for the same band every time. Kind of rooting for him now.',
          },
        ],
      },
    },
    {
      id: 'h1_cleanup_friend',
      kind: 'hack',
      tier: 1,
      titles: ['Tidy up after a friend at {target}', 'Erase the footprints at {target}', 'Janitor duty: {target}'],
      descs: [
        'A friend of a friend went poking around {target} on a dare and left their fingerprints all over the visitor records. They are fourteen and very sorry. Make the evening not have happened.',
        'Somebody clumsy wandered through {target} last week and the admin is starting to squint at the logs. Get there first and leave nothing to squint at.',
        'The client didn\'t steal anything at {target} — they just looked, badly. Now they want the looking erased before a very stern letter gets written.',
      ],
      targets: ['the LSU computer lab', 'the public library network', 'a high-school library terminal', 'the community-center PC room'],
      clients: ['a panicked freshman', 'a kid who took a dare', 'a friend of byteme\'s', 'a remorseful lurker'],
      skills: ['opsec', 'systems'],
      dc: [11, 14],
      hours: [6, 12],
      pay: [170, 340],
      heat: [3, 5],
      cred: [0.7, 1.4],
      op: {
        network: 'school',
        goal: 'wipeLogs',
        loot: ['lab_signin.dat', 'visitor_book.dat', 'session_history.dat'],
        docs: [
          {
            name: 'lab_rules.txt',
            content:
              'COMPUTER LAB RULES: No food. No drinks. No games. No chatting. No fun of any kind. Printing is 10 cents a page and the printer knows if you lie.',
          },
          {
            name: 'admin_sticky.txt',
            content: 'Someone logged in as "HACKERMAN" at 4:12 PM Thursday. Probably the Pham kid. Probably harmless. Look into it after lunch. (After lunch.)',
          },
        ],
      },
    },

    // ─────────────────────────── TIER 2 ────────────────────────────
    {
      id: 'h2_deface_corp',
      kind: 'hack',
      tier: 2,
      titles: ['Embarrass {target}', 'Corporate defacement: {target}', 'Make {target} apologize'],
      descs: [
        'A client wants {target} taken down a peg after a bad deal. Their web presence is a brochure guarded by a wet paper towel. Leave a message the local paper will notice.',
        '{target} stiffed the wrong contractor. Deface the site, embarrass the brand, get paid twice the value of the invoice they never sent.',
        'Activists want {target}\'s greenwashing site replaced with the truth. Louder than tier one, and hotter — brands hire people to be angry.',
      ],
      targets: ['a strip-mall developer', 'a payday-loan chain', 'a used-car megastore', 'a local property firm'],
      clients: ['a stiffed subcontractor', 'a neighborhood group', 'an angry former employee', 'a scrappy activist collective'],
      skills: ['intrusion', 'networking'],
      dc: [14, 16],
      hours: [12, 24],
      pay: [450, 900],
      heat: [6, 10],
      cred: [1.2, 2.2],
      op: {
        network: 'corp',
        goal: 'upload',
        loot: ['front_page_fixed.html', 'our_apology.html', 'truth_in_advertising.html'],
        docs: [
          {
            name: 'marketing_brief.doc',
            content:
              'Brand pillars: TRUST. FAMILY. VALUE. Do not use the word "fees" on the homepage. If the word "fees" must appear, make it very small and a pleasant shade of grey.',
          },
          {
            name: 'web_guy_invoice.txt',
            content: 'Invoice #0031 — homepage refresh — $1,400 — 94 days overdue. Third notice. I have your logo. I know where your logo lives.',
          },
        ],
      },
    },
    {
      id: 'h2_db_dump',
      kind: 'hack',
      tier: 2,
      titles: ['Pull the list from {target}', 'Mailing-list grab: {target}', 'Exfiltrate {target}\'s customers'],
      descs: [
        'A marketing client wants {target}\'s customer list. The database is a spreadsheet with delusions of grandeur. Copy it, hand it over, don\'t think too hard about the people in the rows.',
        '{target} keeps its mailing list behind a login that hasn\'t changed since the site launched. Someone will pay well for that many names.',
        'A competitor wants to know exactly who {target} sells to. Get the table, ship it clean, collect. The rows are just numbers until they aren\'t.',
      ],
      targets: ['a boutique catalog company', 'a regional newsletter', 'an online hobby shop', 'a subscription magazine'],
      clients: ['a rival marketer', 'a list broker', 'a "growth consultant"', 'a competing shop owner'],
      skills: ['intrusion', 'systems'],
      dc: [15, 17],
      hours: [16, 28],
      pay: [585, 1170],
      heat: [8, 11],
      cred: [1.4, 2.5],
      op: {
        network: 'shop',
        goal: 'download',
        loot: ['customers.db', 'mailing_list.csv', 'subscribers_master.dat'],
        docs: [
          {
            name: 'owner_note.txt',
            content:
              'Our customers are FAMILY. Which is why we will be mailing them the spring catalog, the summer catalog, the summer catalog again (typo fix), and the "we miss you" postcard.',
          },
          {
            name: 'returns_log.txt',
            content: 'Returned: 1 decorative goose (wrong goose). 1 decorative goose (too many geese). 1 decorative goose (no reason given, customer seemed shaken).',
          },
        ],
      },
    },
    {
      id: 'h2_crack_game',
      kind: 'hack',
      tier: 2,
      titles: ['Crack {target}', 'Break the protection on {target}', 'Release {target}'],
      descs: [
        'The boxed release of {target} ships with real copy protection this time — a disc check with teeth. The publisher\'s build server has the master keys. Bring them home, and the scene remembers your name for a decade.',
        '{target} wants a CD in the drive every launch. Free it. This is the work that builds legends and burns weekends.',
        'A courier group needs {target} released before a rival group beats them to it. The gold master is sitting on a publisher server with a sign on it that says "please don\'t." Speed and pride, in equal measure.',
      ],
      targets: ['a hyped strategy game', 'a flight simulator', 'a big-budget RPG', 'a racing sim', 'an office suite'],
      clients: ['a warez release group', 'a courier crew', 'the whole scene', 'a rival cracker who tapped out'],
      skills: ['programming', 'cryptography'],
      dc: [15, 17],
      hours: [18, 30],
      pay: [495, 990],
      heat: [6, 10],
      cred: [1.6, 2.5],
      rep: { 'fac.loft': 2 },
      op: {
        network: 'corp',
        goal: 'download',
        loot: ['gold_master_keys.bin', 'disc_check_keys.bin', 'release_candidate.pak'],
        docs: [
          {
            name: 'crunch_memo.txt',
            content:
              'Team: we are three weeks from gold. Showers are optional. Sleep is optional. The pizza budget is NOT optional and has been doubled. Thank you for your sacrifice. — Production',
          },
          {
            name: 'bug_4417.txt',
            content: 'BUG #4417: If the player names their horse "Gerald," the horse becomes invincible. STATUS: Won\'t fix. Gerald has earned it.',
          },
        ],
      },
    },
    {
      id: 'h2_snoop_competitor',
      kind: 'hack',
      tier: 2,
      titles: ['Snoop on {target}', 'Competitive intel: {target}', 'Look inside {target}'],
      descs: [
        'A client wants to know what {target} is bidding on the same contract. Their internal share is guarded like a diary. Read it, summarize it, never mention it again.',
        '{target} is a small firm with big secrets and a small IT budget. Slip in, note the pricing, slip out. Corporate snooping, tastefully done.',
        'Two shops are at war over one city account. Tell your client what {target} is planning before the meeting. Discreetly.',
      ],
      targets: ['a rival contractor', 'a competing agency', 'a family-owned firm', 'an upstart startup'],
      clients: ['a competing owner', 'a nervous sales director', 'a "consultant"', 'a bidding rival'],
      skills: ['intrusion', 'opsec'],
      dc: [15, 17],
      hours: [14, 26],
      pay: [540, 1080],
      heat: [8, 11],
      cred: [1.3, 2.4],
      op: {
        network: 'corp',
        goal: 'read',
        loot: ['bid_pricing.xls', 'city_account_pitch.doc', 'strategy_q3.doc'],
        docs: [
          {
            name: 'all_staff.txt',
            content:
              'Friendly reminder that the conference room is for CONFERENCES. It is not a nap room. It is especially not a nap room during a client visit, Doug.',
          },
          {
            name: 'pitch_rehearsal.txt',
            content: 'Opening line options: (a) "Synergy." (b) "Let\'s talk synergy." (c) Just walk in and say "synergy" and leave. Vote by Friday.',
          },
        ],
      },
    },
    {
      id: 'h2_transcript',
      kind: 'hack',
      tier: 2,
      titles: ['Rewrite a transcript at {target}', 'Academic laundering: {target}', 'Clean record at {target}'],
      descs: [
        'A client needs their college transcript from {target} to say something kinder. The registrar\'s system is a fortress with the gate left open. Careful — this one gets people expelled.',
        '{target} keeps academic records on a server that trusts anyone on the campus network. Add a class, remove a failure, bill accordingly.',
        'Someone wants a degree from {target} they didn\'t quite finish. Real risk, real money, real second thoughts.',
      ],
      targets: ['Lumen State University', 'a rival state college', 'a private university', 'a technical institute'],
      clients: ['a graduate who came up short', 'a job applicant', 'a professional needing a credential', 'a dropout with a plan'],
      skills: ['intrusion', 'social'],
      dc: [16, 17],
      hours: [18, 30],
      pay: [720, 1260],
      heat: [9, 11],
      cred: [1.5, 2.5],
      op: {
        network: 'school',
        goal: 'upload',
        loot: ['transcript_amend.rec', 'registrar_batch.upd', 'degree_audit_patch.dat'],
        docs: [
          {
            name: 'registrar_faq.txt',
            content:
              'Q: Can I change my grade? A: No.\nQ: What if I ask nicely? A: No.\nQ: What if I bring muffins? A: Leave the muffins at the front desk and then no.',
          },
          {
            name: 'deans_list.txt',
            content: 'Dean\'s List, Fall term: 212 students. Dean\'s Other List (the one on the fridge): 4 students, all of whom know what they did.',
          },
        ],
      },
    },
    {
      id: 'h2_loyalty',
      kind: 'hack',
      tier: 2,
      titles: ['Drain the points at {target}', 'Loyalty-program job: {target}', 'Cash out {target}'],
      descs: [
        'A client found a soft spot in {target}\'s rewards program and wants it used before the vendor notices. Points become gift cards become cash. Move fast.',
        '{target} runs a loyalty scheme on a back end nobody has touched since launch. Mint points, launder them into merchandise, split the take.',
        'Turn {target}\'s "free" rewards into real money. Low violence, medium heat, and a client who insists everybody does it.',
      ],
      targets: ['a coffee chain', 'a grocery co-op', 'a gas-station rewards program', 'an airline miles scheme'],
      clients: ['a grey-market reseller', 'a bored insider', 'a "points guy"', 'a small fraud crew'],
      skills: ['programming', 'business'],
      dc: [15, 17],
      hours: [16, 28],
      pay: [630, 1215],
      heat: [8, 11],
      cred: [1.2, 2.3],
      op: {
        network: 'shop',
        goal: 'upload',
        loot: ['points_credit.txn', 'rewards_batch.txn', 'bonus_ledger.upd'],
        docs: [
          {
            name: 'rewards_tiers.txt',
            content:
              'BRONZE: a free small coffee on your birthday.\nSILVER: a free medium coffee on your birthday.\nGOLD: we sing.\nPLATINUM: we sing, and we mean it.',
          },
          {
            name: 'store_17_complaint.txt',
            content: 'Customer demanded to redeem 40,000 points for "the espresso machine behind the counter." Explained it is not for sale. Customer redeemed 40,000 points for a mug and wept.',
          },
        ],
      },
    },
    {
      id: 'h2_wardial',
      kind: 'hack',
      tier: 2,
      titles: ['Map the lines at {target}', 'Dial-tone survey: {target}', 'Find the back door to {target}'],
      descs: [
        'Before anyone moves on {target}, someone has to find out what it forgot it owns. Read their equipment inventory and hand over an annotated map. Recon pays.',
        '{target} has an old maintenance line nobody remembers. Find the paperwork that remembers it for them. Patient, quiet, valuable work.',
        'A client planning something bigger at {target} needs the lay of the land first. Read the map they keep of themselves. Set them up; let them take the risk.',
      ],
      targets: ['a shipping company', 'a regional freight office', 'a hospital annex\'s billing wing', 'a factory'],
      clients: ['a bigger crew scoping a job', 'a penetration tester off the books', 'a rival firm', 'a curious insider'],
      skills: ['networking', 'opsec'],
      dc: [14, 16],
      hours: [12, 24],
      pay: [450, 855],
      heat: [6, 9],
      cred: [1.4, 2.4],
      op: {
        network: 'corp',
        goal: 'read',
        loot: ['equipment_inventory.txt', 'dialin_lines.txt', 'site_map.txt'],
        docs: [
          {
            name: 'facilities_note.txt',
            content:
              'The beige box in closet B is "important" according to a sticker from 1994. Nobody knows what it does. Nobody is allowed to unplug it. We dust it with reverence.',
          },
          {
            name: 'phone_list.txt',
            content: 'Front desk: x100. Shipping: x210. Bob: x211 (don\'t call Bob before 10). The number on the fax machine: nobody knows, it has never received a fax.',
          },
        ],
      },
    },
    {
      id: 'h2_finale_script',
      kind: 'hack',
      tier: 2,
      titles: ['Leak the finale from {target}', 'Spoiler heist: {target}', 'Who shot the captain? Ask {target}'],
      descs: [
        'Port Lumen\'s beloved soap "Harbor Lights" ends its season on a cliffhanger, and a tabloid will pay good money to know who pushed the captain off the pier. The scripts live on {target}\'s servers.',
        'A fan-site owner wants the season finale of "Harbor Lights" from {target} a week early. Glory, traffic, and a network executive having a very bad Monday.',
        'The whole Row is betting on who the evil twin really is. Get the script from {target} and let the client settle every bet in town.',
      ],
      targets: ['the Channel 6 studio', 'a production office in Millgate', 'the network\'s script vault', 'a writers\' room file server'],
      clients: ['a tabloid editor', 'a fan-site webmaster', 'a bookie with a soft spot for soaps', 'a jilted former cast member'],
      skills: ['intrusion', 'opsec'],
      dc: [14, 17],
      hours: [14, 26],
      pay: [495, 1035],
      heat: [6, 10],
      cred: [1.2, 2.3],
      available: { day: true, gte: Y2002 },
      op: {
        network: 'media',
        goal: 'download',
        loot: ['finale_draft_v3.doc', 'season_arc.doc', 'twin_reveal.doc'],
        docs: [
          {
            name: 'writers_room.txt',
            content:
              'Ideas board:\n- The captain has amnesia (AGAIN)\n- The lighthouse is haunted (by the captain\'s twin)\n- Everyone was a dream (NO. We did this in season 4. Never again.)',
          },
          {
            name: 'cast_memo.txt',
            content: 'To the cast: please stop telling your hairdressers the plot. The hairdressers are telling their clients. The clients are calling the station.',
          },
        ],
      },
    },
    {
      id: 'h2_auction_feedback',
      kind: 'hack',
      tier: 2,
      titles: ['Polish a reputation on {target}', 'Five stars from {target}', 'Feedback facelift: {target}'],
      descs: [
        'A seller on {target} got three bad reviews over a "slightly haunted" lamp and now nobody will buy his vintage lunchboxes. Reach into the ratings table and turn his one stars into five. Nobody checks; everybody trusts a number.',
        'The client sells collectibles on {target} and a feud tanked his feedback score. Rewrite the numbers, bury the grudge reviews, and let commerce resume.',
        'A rival seller is stuffing {target} with fake bad reviews of the client. Level the field — quietly delete the smears and gild the client\'s record while you are in there.',
      ],
      targets: ['a big online auction site', 'a collectibles marketplace', 'a classifieds board', 'a regional swap-meet site'],
      clients: ['a small-time seller', 'a collectibles dealer', 'a garage-sale mogul', 'a wounded five-star ego'],
      skills: ['intrusion', 'business'],
      dc: [14, 16],
      hours: [12, 22],
      pay: [450, 855],
      heat: [6, 10],
      cred: [1.1, 2.1],
      op: {
        network: 'shop',
        goal: 'upload',
        loot: ['feedback_scores.tbl', 'ratings_override.upd', 'seller_reputation.dat'],
        docs: [
          {
            name: 'trust_and_safety.txt',
            content:
              'This month\'s disputes:\n- "item not as described" (item was exactly as described; buyer had not read the description)\n- "haunted" (x14, same lamp)\n- "seller is my ex" (not a policy violation, sorry)',
          },
          {
            name: 'top_seller_tips.txt',
            content: 'HOW TO BE A POWER SELLER: 1. Ship fast. 2. Photograph honestly. 3. Answer questions kindly. 4. Do not, under any circumstances, sell a lamp you personally believe to be haunted.',
          },
        ],
      },
    },
    {
      id: 'h2_cable_unlock',
      kind: 'hack',
      tier: 2,
      titles: ['Unlock the premium tiers on {target}', 'Free the channels on {target}', 'Descramble {target}'],
      descs: [
        'A whole apartment block wants every channel {target} keeps behind a paywall, and the client is collecting per door. The entitlement list lives on a provisioning box that trusts anything polite. Flip the flags, pocket the cash.',
        '{target} decides who gets the movie channels from a table on one dusty server. Add the client\'s box to the "everything" list and let them watch the fights for free.',
        'The client runs a little side business turning {target}\'s cheapest package into its most expensive one. Update the subscriber entitlements, collect a cut, and try not to think about it as stealing.',
      ],
      targets: ['a regional cable provider', 'a satellite TV service', 'a pay-per-view operator', 'a premium-channel bundler'],
      clients: ['a building super with a scheme', 'a bar owner tired of PPV fees', 'a neighborhood fixer', 'a client who "knows a guy" (you are the guy)'],
      skills: ['networking', 'systems'],
      dc: [14, 17],
      hours: [14, 24],
      pay: [495, 990],
      heat: [8, 11],
      cred: [1.2, 2.2],
      available: { day: true, gte: Y2003 },
      op: {
        network: 'media',
        goal: 'upload',
        loot: ['entitlements_{target}.upd', 'subscriber_flags.tbl', 'premium_unlock.cfg'],
        docs: [
          {
            name: 'provisioning_notes.txt',
            content:
              'If a box "loses" the movie channels, do NOT reset the whole headend again. Last time the whole east side lost the shopping network during a jewelry event and the phones did not stop for a week.',
          },
          {
            name: 'winback_offer.txt',
            content: 'RETENTION SCRIPT: offer the sports package free for 3 months. If they still cancel, offer the movie package free for 3 months. If they still cancel, ask if everything is okay at home.',
          },
        ],
      },
    },
  ],
})
