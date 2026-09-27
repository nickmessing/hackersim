/**
 * PKG-00 — the rival and the whisper (bible §4.5) and the minor cast (§4.8).
 *
 * `mirror` and `oracle` are real NpcDefs whose bios resolve their identity from story flags:
 *   mirror: `mir.identity` (str, PKG-02 lock) + `mir.outcome` (str, PKG-03), revealed at `a3.mirror_revealed`.
 *   oracle: `npc.oracle.is_*` (PKG-03), revealed at `a3.oracle_revealed`.
 * The mirror outcome is never written onto the underlying NPC's fate (§4.5); these bios only read it.
 */
import { defineContent } from '@/engine/registry'
import type { Cond } from '@/engine/types'

const mirrorIs = (who: string): Cond => ({ all: [{ flag: 'a3.mirror_revealed' }, { flag: 'mir.identity', eq: who }] })
const mirrorEnded = (outcome: string): Cond => ({ flag: 'mir.outcome', eq: outcome })
const oracleIs = (flag: string): Cond => ({ all: [{ flag: 'a3.oracle_revealed' }, { flag }] })

export default defineContent({
  npcs: [
    // ── §4.5 The rival and the whisper ───────────────────────────────────────
    {
      id: 'mirror',
      name: 'mirror',
      handle: 'mirror',
      role: 'Rival · your shadow',
      avatar: '][',
      color: '#303030',
      bio: [
        {
          if: { flag: 'a3.mirror_revealed' },
          text: 'The shadow has a face now. Knowing it doesn\'t make the last few years any easier to reread.',
          else: 'A handle. Always one move ahead, always the opposite of you. It snipes the contract you were halfway through, leaves a calling card of your own words spelled backwards, and posts a cleaner solution to the board puzzle you just solved, ten minutes after you did.',
        },
        '"We took the same first job, you and me. I just didn\'t stop to make friends." Whoever mirror is, they know you: the way you work, and the way you don\'t.',
        { if: mirrorIs('jax'), text: 'mirror was Jax. All that time. Every time you forgot to call back, he got a little better at being you.' },
        { if: mirrorIs('mira'), text: 'mirror was Mira. She learned your methods the way she learns everything, completely, and then she beat you with them.' },
        { if: mirrorIs('byteme'), text: 'mirror was byteme. The kid who worshipped you became the only one who could keep up, and he did it alone.' },
        { if: mirrorIs('stranger'), text: 'mirror was a stranger: l33tKÎLLƏR, the flamer from your first month on the board, who never stopped keeping score.' },
        { if: mirrorEnded('defeated'), text: 'You beat mirror. It cost more than you expected, which is the only way you know it was real.' },
        { if: mirrorEnded('redeemed'), text: 'You turned mirror. The shadow walks beside you now, half a step behind, which is where it always secretly wanted to be.' },
        { if: mirrorEnded('victorious'), text: 'mirror won. You let it happen by not showing up, and they noticed.' },
        { if: mirrorEnded('truce'), text: 'You let mirror win one to save a life. It\'s a truce: the first thing the two of you have ever shared.' },
      ],
    },
    {
      id: 'oracle',
      name: 'The Oracle',
      role: 'Unknown sender',
      avatar: '?',
      color: '#111111',
      bio: [
        'Nobody. A sender with no address and messages that arrive from nowhere: always short, always right, always gone before you can reply.',
        '"You think Aperture is the top? Aperture is a cost center. Look at who insures the risk. No, don\'t reply. This channel is already too warm."',
        { if: { flag: 'a2.oracle_contact' }, text: 'The channel is open now. Some nights you catch yourself waiting for it.' },
        { if: oracleIs('npc.oracle.is_deadline'), text: 'The Oracle was Deadline, wearing his oldest handle, the one from before \'94, before he learned what it costs to be caught.' },
        { if: oracleIs('npc.oracle.is_reyes'), text: 'The Oracle was Agent Reyes, working off the books against her own office, one untraceable message at a time.' },
        { if: oracleIs('npc.oracle.is_kroll'), text: 'The Oracle was Vanessa Kroll, hedging her bets. Even the market wants insurance.' },
      ],
    },

    // ── §4.8 Minor cast ──────────────────────────────────────────────────────
    {
      id: 'grandma_ruth',
      name: 'Ruth Alvarez',
      handle: 'GrandmaRuth',
      faction: 'fac.hood',
      role: 'Neighbor, three doors down',
      avatar: 'RA',
      color: '#a0522d',
      social: true,
      startAffinity: 25,
      bio: [
        'Mrs. Ruth Alvarez, three doors down: widow, champion baker, and owner of the most thoroughly infected home computer in Port Lumen. Everyone on the Row calls her Grandma Ruth, including several people older than she is.',
        'She clicks on every prize she has ever won, and she has won so many prizes. She pays you in empanadas and gossip, and both are excellent.',
        { if: { flag: 'a1.grandma_done' }, text: 'The first time you cleaned her PC, you found something in it that phoned home to a Millgate company every night. You still think about that.' },
        { if: { npc: 'grandma_ruth', fate: 'well' }, text: 'She\'s well. She has learned to hover over a link before she clicks it, and she is insufferable about it.' },
        { if: { npc: 'grandma_ruth', fate: 'spied_on' }, text: 'The city\'s shiny new civic app was watching her, of all people. She laughed when you told her. Then she covered the webcam with a church bulletin and hasn\'t taken it off since.' },
        { if: { npc: 'grandma_ruth', fate: 'warned' }, text: 'Her name was on the List. You warned her in time. She pretended she had already guessed, then fed you until you couldn\'t stand.' },
      ],
    },
    {
      id: 'uncle',
      name: 'Uncle Danh',
      faction: 'fac.hood',
      role: "Mom's brother · entrepreneur",
      avatar: 'UD',
      color: '#9c7a00',
      social: true,
      startAffinity: 15,
      bio: [
        'Mom\'s younger brother Danh: a gold watch, a firm handshake, and a new business opportunity every holiday. Water filters. Kitchen knives. Long-distance calling cards. Now it\'s something called the Lumen Prosperity Circle, and he would love for you to get in on the ground floor.',
        'He means well. He always means well. That is exactly how he loses everyone\'s money, starting with his own.',
        { if: { npc: 'uncle', fate: 'refunded' }, text: 'You got his money back out of the Prosperity Circle. He called it "a strategic exit" at Thanksgiving, and nobody corrected him.' },
        { if: { npc: 'uncle', fate: 'ruined' }, text: 'The Circle collapsed and took him with it. He\'s selling the gold watch. Mom lends him money and pretends it\'s a gift.' },
        { if: { npc: 'uncle', fate: 'spared' }, text: 'You kept him out of the worst of it. He\'ll never know how close he came, and he\'ll tell everyone he saw it coming.' },
      ],
    },
    {
      id: 'webmaster',
      name: 'Cal Reeves',
      handle: 'WebmasterCal',
      role: 'Webmaster, between dot-coms',
      avatar: 'CR',
      color: '#3b7dd8',
      social: true,
      bio: [
        'Cal Reeves built websites for three dot-coms that no longer exist, and he still wears the free T-shirts from all three. When the bust came, he lost his job, his car and his faith in animated GIFs, in that order.',
        'He\'s talented. He\'s desperate. In this city, that combination always attracts offers.',
        { if: { npc: 'webmaster', fate: 'hired' }, text: 'He got hired, and he\'s building sites again: real ones, with privacy policies he wrote himself and actually reads.' },
        { if: { npc: 'webmaster', fate: 'webmaster_dark' }, text: 'He drifted into a fraud crew. When you see his work now it\'s on a fake storefront with very good typography, and it makes you sad in a way you can\'t quite explain.' },
      ],
    },
    {
      id: 'flamer',
      name: 'Marcus Doyle',
      handle: 'l33tKÎLLƏR',
      role: 'Forum flamer · old nemesis',
      avatar: 'l3',
      color: '#d4380d',
      startAffinity: -15,
      bio: [
        'l33tKÎLLƏR: a legend of the Loft board in his own mind. Types with the caps lock taped down, ends every post with a skull made of semicolons, and once called you a n00b in eleven different fonts.',
        'Behind the handle is Marcus Doyle, a bored kid from Harbor Point with a very expensive computer and nobody to talk to.',
        { if: { npc: 'flamer', fate: 'helped' }, text: 'When his name turned up on the List, you helped him anyway. He sent one message afterwards, all lowercase, no skulls: "thanks. sorry about the fonts."' },
        { if: { npc: 'flamer', fate: 'schadenfreude' }, text: 'When his name turned up on the List, you let it happen. You told yourself it was funny. It was, for about a day.' },
        { if: mirrorIs('stranger'), text: 'He was mirror all along: the kid who never stopped keeping score, and who never once let you see him do it.' },
      ],
    },
    {
      id: 'list_activist',
      name: 'Nadia Bell',
      role: 'Tenant organizer · a name on the List',
      avatar: 'NB',
      color: '#5b7065',
      bio: [
        'Nadia Bell organizes tenants in the Millgate lofts: clipboard, bike helmet, and a stubborn habit of reading every lease out loud at meetings. You have never met her. PARALLAX thinks she\'s a risk.',
        'Her file reads like a life: a sister in Ridgeport, a library card she actually uses, a petition against a rent hike that she won. Nothing in it explains why her name is on a list.',
        { if: { npc: 'list_activist', fate: 'warned' }, text: 'You warned her. She moved her meetings to a church hall and changed her number, and every winter she sends a card with no return address.' },
        { if: { npc: 'list_activist', fate: 'detained' }, text: 'She was detained in the sweep and released nineteen days later without charge. She doesn\'t organize anymore.' },
        { if: { npc: 'list_activist', fate: 'disappeared' }, text: 'Nadia Bell is missing. Her bike is still chained outside the Millgate library.' },
      ],
    },
  ],
})
