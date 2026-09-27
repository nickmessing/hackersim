# HackerSim 2001

**A hacker & programmer life simulator with a branching CRPG story.** A love letter to the
obscure 2000s freeware "hacker life" sims — rebuilt as a retro fake desktop where time keeps
moving, your schedule runs your life, and every choice leaves a mark.

It's September 2001 in Port Lumen, a fog-soaked port city on the dial-up frontier. You're 18,
living with your parents, with a beige PC and a 33.6k modem. Over the next ten years you'll climb a
career, earn a name in the underground, juggle rent, health, family and friends — and end up
holding the leverage to expose, sell, burn or walk away from a machine that quietly learned to read
the whole city.

Everything in it — the city, the companies, the people, the networks — is fictional. The hacking
is make-believe: skill checks, dice and an invented terminal.

## Features

- **Learn by discovery** — a new game starts on an empty desktop. Act 0 walks you through your
  first week, and every program appears the first time you need it: Mail with your first letter,
  BuddyPager when someone pages you, the Forum when something is posted, and so on.
- **Retro desktop** — a Windows-XP-era fake OS with draggable windows, a taskbar, Start menu, tray
  clock and toasts. Mail, a messenger (BuddyPager), an underground BBS, a news portal, an e-shop,
  a quest journal, a career center, a daily planner and a terminal.
- **Idle life sim in weekly turns** — paint a 24-hour routine (sleep, work, classes, study,
  hacking, freelance, exercise, social, relax) and watch the weeks roll by. Energy, stress, mood,
  health, housing, lifestyle, rent, debt, burnout, aging.
- **Career ladders** — ~40 jobs from flyer delivery and CompCastle retail to help desk, dev shops,
  NOC night shifts, network engineering, security consulting, management and startups. University
  degrees and certification courses.
- **Terminal hacking** — every hack is a procedurally generated network played in an Uplink-style
  terminal against a live trace timer: scan, connect, crack, bounce, grab the files, wipe your
  logs, get out. Scheduled "recon" hours make ops easier. Firewalls, watchdogs, honeypots, found
  credentials. Heat builds; raids happen.
- **Freelance gigs** — a work queue of gigs with careful / normal / fast approaches.
- **A branching story** — four acts that turn from nostalgic comedy into a techno-thriller, five
  factions with reputation, ~30 characters whose fates you decide, 11 endings with epilogues.
- **D&D-style checks with teeth** — d20 + skill vs DC, shown up front. Failure isn't a slap on the
  wrist: it branches into complications with lasting consequences — scars (permanent traits),
  fines and lawsuits that bill you daily, grudges, lost jobs, faction damage.
- **Something always happening** — an event director draws from ~120 random events and dozens of
  side quests, reacting to your job, housing, relationships, background and traits.
- **Fully offline** — plays in the browser or as a fullscreen desktop app with no internet access.

## Play

```bash
npm install
npm run dev          # http://localhost:5173
```

Controls: **Space** pause/resume · **1–4** speed · **Esc** close window · **F11** fullscreen.

### Desktop app (fullscreen, offline)

Built with [Tauri 2](https://tauri.app). The game is bundled into the binary and a strict content
security policy blocks all network requests.

```bash
npm run app:dev      # desktop window with hot reload
npm run app:build    # .deb, .rpm and .AppImage in src-tauri/target/release/bundle/
```

Linux build prerequisites (Fedora): `webkit2gtk4.1-devel openssl-devel libappindicator-gtk3-devel
librsvg2-devel` and a Rust toolchain. See the [Tauri prerequisites](https://tauri.app/start/prerequisites/)
for other platforms. Saves live in the app's WebView storage; use Control Panel → Save & Load →
export to back them up.

## Development

```bash
npm run typecheck    # vue-tsc, strict
npm run lint         # ESLint: typescript-eslint strict type-checked + eslint-plugin-vue
npm test             # engine, ops, events, terminal, solver and content-validation tests
npm run validate     # content reference/reachability report only
BALANCE=1 npx vitest run tests/balance.test.ts   # headless playtest bots (slow)
```

Stack: Vue 3 (`<script setup>`), TypeScript, Vite, Vitest, Tauri 2.

### Layout

| Path | What |
|---|---|
| `src/engine/` | The simulation, pure TypeScript: time loop, schedule, jobs, skills, education, life, contracts & heat, ops generator, events & complications, scenes/quests/triggers, save/load. Data model in `types.ts`, all tunables in `balance.ts`. |
| `src/content/` | All game data: story acts, faction arcs, side quests, events, complications, jobs, items, news, forum threads, missions. Each file does `export default defineContent({...})` and is discovered automatically. |
| `src/ui/` | The Vue desktop: shell, window manager, apps, story channels (mail/chat/forum/dialog), the terminal. |
| `tests/` | Engine mechanics, content validator, ops/terminal/solver tests, and the balance bots. |
| `docs/` | `STORY_BIBLE.md` (cast, factions, acts, endings, flags), `CONTENT_GUIDE.md` (how to write content), `UI_GUIDE.md`, `REDESIGN_V2.md`. |
| `src-tauri/` | Desktop app shell. |

### Writing content

Read `docs/CONTENT_GUIDE.md`. Content is typed data — scenes (dialogue graphs delivered by mail,
chat, forum or dialog), quests with objectives and hints, triggers, events, complications — using
the condition/effect vocabulary in `src/engine/types.ts`. `npm run validate` catches broken ids,
unreachable nodes, flags read but never set, and quests that can never start.

## License

[MIT](LICENSE)
