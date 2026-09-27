/**
 * The "free shell" — a cosy fake operating system (LumenOS 2.1) you get when the Terminal is
 * opened with no mission. Pure logic: the Vue layer hands it a snapshot of the player and a line
 * of input, and gets back lines to print (and, for `launch`, a mission to open). Everything is
 * invented flavour; no command here touches or describes a real system.
 */
import type { OutLine, Tone } from './sim'

export interface ShellMissionEntry {
  kind: 'thread' | 'contract'
  uid: number
  title: string
  detail: string
}

export interface ShellCtx {
  handle: string
  name: string
  dateStr: string
  clockStr: string
  hardware: { slot: string; name: string }[]
  skills: { label: string; level: number }[]
  missions: ShellMissionEntry[]
  history: string[]
  /** Deterministic-enough index the caller advances so `fortune` doesn't repeat. */
  fortuneSeed: number
}

export interface ShellResult {
  lines: OutLine[]
  clear?: boolean
  launch?: { threadUid?: number; contractUid?: number }
}

function line(text: string, tone: Tone = 'out'): OutLine {
  return { text, tone }
}

export const BANNER: OutLine[] = [
  { text: '  LumenOS 2.1  (Millgate build)', tone: 'sys' },
  { text: '  “It boots. Most of the time.”', tone: 'dim' },
  { text: "  Type `help` for a list of commands, `fortune` for wisdom.", tone: 'dim' },
]

const FORTUNES: string[] = [
  'There are 10 kinds of people: those who read binary, and those who don’t.',
  'A user interface is like a joke. If you have to explain it, it’s not that good.',
  'To understand recursion, first understand recursion.',
  'Real programmers count from zero. That’s why there are only nine planets.',
  'The modem handshake is the sound of two machines agreeing to disagree slowly.',
  'Y2K came and went and the toaster still works. Suspicious.',
  '“Works on my machine” is not a deployment strategy, but it is a lifestyle.',
  'Never trust a network you can hear.',
  'A clean desk is a sign of a cluttered hard drive.',
  'Tabs vs spaces is the only holy war where both sides are wrong about whitespace.',
  'The download was at 98%. Then Mom picked up the phone. We do not talk about it.',
  'Backups are like flossing: everyone agrees, nobody does it, dentists get rich.',
  'The `s` in IoT stands for security. (There is no `s`.)',
  'A good password is like a good secret: useless the moment you tell CompCastle.',
  'Rubber duck says: have you tried turning your assumptions off and on again?',
  'Ninety percent of coding is done. The other ninety percent is the trace timer.',
  'DNS is not the problem. Except when it is. It is always DNS.',
  'The floppy holds 1.44MB, of which 1.39MB is a driver you will never use.',
]

const CAT_TOP = '     /\\_/\\'
const CAT_MID = '    ( o.o )'
const CAT_BOT = '     > ^ <'

function saycat(text: string): OutLine[] {
  const say = text || 'meow'
  const bar = '-'.repeat(Math.min(say.length, 44) + 2)
  return [
    line(`  ${bar}`, 'dim'),
    line(`  < ${say.slice(0, 44)} >`, 'good'),
    line(`  ${bar}`, 'dim'),
    line(CAT_TOP, 'out'),
    line(CAT_MID, 'out'),
    line(CAT_BOT, 'out'),
  ]
}

function helpLines(): OutLine[] {
  return [
    line('LumenOS 2.1 — available commands', 'sys'),
    line('  help            this screen'),
    line('  whoami          who the machine thinks you are'),
    line('  date            current date & time'),
    line('  sysinfo         your rig: equipped hardware'),
    line('  skills          your skill levels'),
    line('  missions        story jobs & contracts ready for the terminal'),
    line('  launch <n>      open mission #n from the list'),
    line('  fortune         a nugget of period wisdom'),
    line('  saycat <text>   the LumenOS cat says your text'),
    line('  history         commands you have typed'),
    line('  clear           wipe the screen'),
    line('  echo <text>     print text back'),
    line('  (there are a few things not on this list. poke around.)', 'dim'),
  ]
}

function missionLines(ctx: ShellCtx): OutLine[] {
  if (ctx.missions.length === 0) {
    return [
      line('No jobs are waiting for the terminal right now.', 'dim'),
      line('Story missions arrive through mail and chat; contracts you accept in Operations', 'dim'),
      line('show up here once they’re ready to run by hand.', 'dim'),
    ]
  }
  const out: OutLine[] = [line('JOBS READY FOR THE TERMINAL', 'sys')]
  ctx.missions.forEach((m, i) => {
    out.push(line(`  ${i + 1}. [${m.kind === 'thread' ? 'story' : 'contract'}] ${m.title}`, 'good'))
    out.push(line(`       ${m.detail}`, 'dim'))
  })
  out.push(line('Run one with:  launch <n>', 'dim'))
  return out
}

export function runShell(ctx: ShellCtx, raw: string): ShellResult {
  const input = raw.trim()
  if (input === '') return { lines: [] }
  const parts = input.split(/\s+/)
  const cmd = (parts[0] ?? '').toLowerCase()
  const rest = input.slice(cmd.length).trim()
  const arg = parts[1] ?? ''

  switch (cmd) {
    case 'help':
    case '?':
      return { lines: helpLines() }
    case 'whoami':
      return {
        lines: [
          line(`${ctx.handle}  (${ctx.name})`, 'good'),
          line('uid=1000  groups=users,dialup,theloft', 'dim'),
          line('You are exactly as important as you make yourself. The machine has no opinion.', 'dim'),
        ],
      }
    case 'date':
      return { lines: [line(`${ctx.dateStr}  ${ctx.clockStr}`)] }
    case 'uname':
      return { lines: [line('LumenOS 2.1 millgate i586 (single-user, single-modem)', 'sys')] }
    case 'sysinfo': {
      const out: OutLine[] = [line('THIS RIG', 'sys')]
      if (ctx.hardware.length === 0) out.push(line('  (nothing equipped — you are running on hopes and a borrowed CRT)', 'dim'))
      for (const h of ctx.hardware) out.push(line(`  ${h.slot.padEnd(9)} ${h.name}`))
      return { lines: out }
    }
    case 'skills': {
      const out: OutLine[] = [line('SKILLS', 'sys')]
      for (const s of ctx.skills) {
        const bars = '█'.repeat(Math.round(s.level / 10)) + '░'.repeat(10 - Math.round(s.level / 10))
        out.push(line(`  ${s.label.padEnd(12)} ${bars} ${s.level}`))
      }
      return { lines: out }
    }
    case 'missions':
    case 'jobs':
      return { lines: missionLines(ctx) }
    case 'launch':
    case 'run': {
      if (ctx.missions.length === 0) return { lines: [line('Nothing to launch. Type `missions`.', 'err')] }
      const n = Number.parseInt(arg, 10)
      if (Number.isNaN(n) || n < 1 || n > ctx.missions.length) {
        return { lines: [line(`launch: pick a number 1..${ctx.missions.length} (see \`missions\`).`, 'err')] }
      }
      const m = ctx.missions[n - 1]
      if (!m) return { lines: [line('launch: no such job.', 'err')] }
      const launch = m.kind === 'thread' ? { threadUid: m.uid } : { contractUid: m.uid }
      return { lines: [line(`Opening terminal session: ${m.title}...`, 'good')], launch }
    }
    case 'fortune':
      return { lines: [line(FORTUNES[Math.abs(ctx.fortuneSeed) % FORTUNES.length] ?? FORTUNES[0] ?? '', 'good')] }
    case 'saycat':
    case 'cowsay':
      return { lines: saycat(rest) }
    case 'echo':
      return { lines: [line(rest)] }
    case 'history': {
      if (ctx.history.length === 0) return { lines: [line('(no history yet)', 'dim')] }
      return { lines: ctx.history.slice(-20).map((h, i) => line(`  ${String(i + 1).padStart(3)}  ${h}`, 'dim')) }
    }
    case 'clear':
    case 'cls':
      return { lines: [], clear: true }
    case 'ls':
    case 'dir':
      return {
        lines: [
          line('Documents/   Downloads/   warez/   demos/   coursework/   .theloft/', 'out'),
          line('(this is the free shell — real files live in a mission)', 'dim'),
        ],
      }
    // ── easter eggs ──────────────────────────────────────────────────────────
    case 'sudo':
      return { lines: [line('LumenOS: nice try. This incident has been logged. (It hasn’t.)', 'warn')] }
    case 'hack':
    case 'crack':
      return {
        lines: [
          line('ACCESS THE MAINFRAME? (Y/N)', 'warn'),
          line('...just kidding. Real jobs run in a mission — type `missions`.', 'dim'),
          line('This shell only hacks your own free time.', 'dim'),
        ],
      }
    case 'matrix':
      return {
        lines: [
          line('01001100 01110101 01101101 01100101 01101110', 'good'),
          line('あガシトノ 7 3 ミ レ ラ  ハク 0 1', 'good'),
          line('▓▒░ the rain is just characters falling ░▒▓', 'dim'),
        ],
      }
    case 'coffee':
    case 'brew':
      return { lines: [line('Brewing... ERROR 418: LumenOS is a teapot. Try the Cathode Diner.', 'warn')] }
    case 'ping':
      return { lines: [line(`PING ${arg || 'localhost'}: reply in 4000ms (it’s dial-up, be patient)`, 'dim')] }
    case 'xyzzy':
      return { lines: [line('Nothing happens.', 'dim')] }
    case 'theloft':
      return { lines: [line('The Loft BBS says: lurk more, post less, back up your floppies. o/', 'good')] }
    case 'exit':
    case 'quit':
    case 'logout':
      return { lines: [line('There is no exit from LumenOS. Only the little X in the corner.', 'dim')] }
    case 'rm':
      return { lines: [line('rm: refusing to remove your only friend. (Nice try.)', 'warn')] }
    default:
      return { lines: [line(`${cmd}: command not found. Type \`help\`.`, 'err')] }
  }
}

const SHELL_COMMANDS = [
  'help',
  'whoami',
  'date',
  'sysinfo',
  'skills',
  'missions',
  'launch',
  'fortune',
  'saycat',
  'history',
  'clear',
  'echo',
  'uname',
  'ls',
]

export function completeShell(ctx: ShellCtx, input: string): string[] {
  const parts = input.split(/\s+/)
  if (parts.length <= 1) {
    const p = (parts[0] ?? '').toLowerCase()
    return SHELL_COMMANDS.filter(c => c.startsWith(p))
  }
  const cmd = (parts[0] ?? '').toLowerCase()
  const frag = parts[parts.length - 1] ?? ''
  if (cmd === 'launch' || cmd === 'run') {
    return ctx.missions.map((_, i) => String(i + 1)).filter(s => s.startsWith(frag))
  }
  return []
}
