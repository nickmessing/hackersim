/**
 * PKG-14 — Side (Dark, late-game): `side_byteme_funeral` (bible §8.42).
 *
 * The game's quietest, hardest room. It exists only if the kid died — reachable solely through the
 * Act III heist casualty after you used him and ignored the warning (bible §4.4 byteme `dead`). No
 * mechanics, no reward: just a wake, and the question of who you can stand to look at. Who's there,
 * who isn't, and how much it costs you, is written out of everything you did.
 *
 * Sets: `side.byteme_funeral_seen` (read by PKG-04 for epilogue tone).
 * Reads (cross-package): `npc.byteme.fate` (PKG-03/04), `npc.byteme.used` (PKG-12), and the
 * availability of Jax / Corvid (their own arcs). `w.cathode_open` chooses the room (PKG-00/10).
 */
import { defineContent } from '@/engine/registry'
import type { Cond, QuestDef, SceneDef } from '@/engine/types'

const jaxHere: Cond = { npc: 'jax', met: true, fateNot: ['dead', 'arrested', 'jailed', 'gone', 'missing', 'flipped'] }
const corvidHere: Cond = {
  npc: 'corvid',
  met: true,
  fateNot: ['martyred', 'exile', 'dead', 'missing', 'arrested', 'jailed', 'bought'],
}

const quest: QuestDef = {
  id: 'side_byteme_funeral',
  title: "byteme's Funeral",
  kind: 'side',
  act: 3,
  priority: 20,
  autoStart: { npc: 'byteme', fate: 'dead' },
  rewards: 'Nothing. You go because he was a kid, and he was yours.',
  summary:
    'Kevin Pham\'s wake is Thursday. There is a room, and the people in it, and the empty chairs. There is nothing to hack and nothing to win. You go anyway, and you decide who you can bear to face.',
  start: 'attend',
  stages: {
    attend: {
      text:
        'They\'re holding the wake for Kevin — byteme — on Thursday. There is no version of this where you don\'t go. Go, and get through the room.',
      onEnter: [{ scene: 'dark_byteme_funeral' }],
      objectives: [
        {
          id: 'go',
          text: 'Go to the wake',
          when: { flag: 'side.byteme_funeral_seen' },
          hint: 'Open the dialog. There is no right choice and no reward — only who you can look at, and what you say to them.',
        },
      ],
    },
  },
}

const scene: SceneDef = {
  id: 'dark_byteme_funeral',
  channel: 'dialog',
  title: 'The Wake',
  start: 'arrive',
  nodes: {
    arrive: {
      speaker: 'narrator',
      text: [
        {
          if: { var: 'w.cathode_open', eq: 1 },
          text: 'They hold it in the Cathode\'s back room, because there was nowhere else it made sense. Sal turned the sign to CLOSED for the first time anyone can remember, put out the good urn of coffee, and stands behind the counter not making anyone pay, wiping a clean spot on the same square of formica for an hour.',
          else: 'They hold it in a church basement on the Row, folding chairs and a hot-plate coffee urn, because the diner is gone and there was nowhere else. Somebody printed his handle on the little paper program, in lowercase, because that\'s how he wrote it, and the sight of it in the funeral font is almost too much.',
        },
        'There\'s a table of photos. byteme at a LAN party, grinning, holding a keyboard over his head like a trophy. byteme at maybe twelve, gap-toothed, in front of a monitor bigger than he was. He was sixteen when you met him. He was younger than you were when you started. Somebody has propped his pager on the table, still on, and every so often it buzzes and the whole room flinches.',
        {
          if: { npc: 'jax', fate: ['dead', 'arrested', 'jailed'] },
          text: 'There is a chair that would have been Jax\'s. It is empty, and nobody sits in it, and nobody says why.',
        },
        {
          if: { flag: 'npc.byteme.used' },
          text: 'You taught him the thing that got him in the room where it happened. He learned it from you because he wanted to be you, and he never once said no to you, and you knew that, and you used it. Everyone here knows the crew went in short-handed and hot. Not everyone knows why. You do.',
        },
      ],
      next: 'who',
    },
    who: {
      speaker: 'narrator',
      text: 'The room is small and full and very quiet. You can\'t stand at the edge of it forever. You have to walk toward someone.',
      choices: [
        {
          text: "Go to Kevin's mother.",
          tag: '[The hardest one]',
          goto: 'mother',
        },
        {
          text: 'Find Jax. Stand with him. Neither of you has to say the thing.',
          if: jaxHere,
          goto: 'jax',
        },
        {
          text: 'Stand with Corvid at the back, where the elders keep their grief.',
          if: corvidHere,
          goto: 'corvid',
        },
        {
          text: "Stay by the wall. Don't make anyone carry your face tonight too.",
          tag: '[Keep to the back]',
          goto: 'back',
        },
      ],
    },
    mother: {
      speaker: "Kevin's mother",
      text: [
        'She is smaller than you expected, and steadier, in the terrible way of a person holding themselves together with both hands so no one has to see the seams. She takes your hand in both of hers before you can decide what your face is doing.',
        '"You\'re the one he talked about." Not an accusation. Worse. "The smart one. He had a — a notebook, of things you said. He wrote them down." Her voice does not break. She has clearly decided it will not, tonight, in front of people. "He wanted so badly to be good at it. Was he? Will you tell me he was good at it?"',
      ],
      choices: [
        {
          text: '"He was better than me. He just didn\'t have my luck." — the truth, dressed for her.',
          tag: '[Honest]',
          effects: [
            { stat: 'mood', add: -8 },
            { flag: 'side.byteme_funeral_seen' },
          ],
          goto: 'mother_honest',
        },
        {
          text: '"He was the best of us, and none of it was his fault." — the lie she needs.',
          tag: '[The kind lie]',
          effects: [
            { stat: 'mood', add: -6 },
            { flag: 'side.byteme_funeral_seen' },
          ],
          goto: 'mother_lie',
        },
      ],
    },
    mother_honest: {
      speaker: 'narrator',
      text: [
        '"He was better than me," you say, and mean it. "Faster. Cleaner instincts. He just started younger, and the world doesn\'t give the young ones a second draft." You leave out whose luck ran out where. You leave out the notebook full of your voice. You give her the true sentence with the true weight sanded off the front of it, and she holds it like it\'s him.',
        {
          if: { flag: 'npc.byteme.used' },
          text: '"Thank you," she says, and you have to look at the photos, because you cannot look at her, because you know exactly how good he was and exactly what you spent it on.',
          else: '"Thank you," she says, and squeezes your hand once, hard, and lets go to greet the next person, and you make it to the coffee urn before your knees remember they\'re optional.',
        },
      ],
    },
    mother_lie: {
      speaker: 'narrator',
      text: [
        '"He was the best of us," you tell her, "and none of it was on him." It is the sentence she needs, and it is a mercy, and it is a lie by the exact weight of everything you\'re not saying. Her whole body loosens half an inch. Somewhere a mother gets to keep a son who was only ever brilliant and unlucky and blameless.',
        'You gave her that. It cost you nothing she can see and everything you\'ll carry, and you decide, walking away, that this is one you get to keep. Not every truth is owed to the person who\'d be destroyed by it. Some you just carry out of the room yourself.',
      ],
    },
    jax: {
      speaker: 'jax',
      text: [
        'Jax is by the photo table, and he does the thing he does, which is find the one that\'s funny — byteme with the keyboard held aloft — and he says, thick, "He set the school library printer to print nothing but the word \'undetectable\' for six hours. Sixth grade. I have never been prouder of anyone." And then his face folds and he grips your shoulder and neither of you says the thing.',
        'You stand with him a while. It is the first time all week you have felt like a person instead of a suspect. Grief is easier standing next to somebody who loved the same kid. He doesn\'t ask you what happened. You don\'t make him.',
      ],
      choices: [
        {
          text: 'Stay. Trade the good stories until the room empties out.',
          effects: [
            { npc: 'jax', affinity: 6 },
            { stat: 'mood', add: 2 },
            { flag: 'side.byteme_funeral_seen' },
          ],
          goto: 'jax_stay',
        },
      ],
    },
    jax_stay: {
      speaker: 'narrator',
      text: [
        'You stay until the coffee\'s gone and the folding chairs are stacked and the pager on the table has stopped buzzing because whoever was paging him has finally, somewhere, gotten the news. You and Jax carry the photo boards out to his car in the dark and don\'t talk and it\'s okay not to talk.',
        '"Same time next month?" he says, at the car, meaning nothing, meaning everything, meaning don\'t you dare be a stranger now. "Yeah," you say. And you mean it, because you have just seen, laid out on a folding table, exactly what it costs to let a friendship drift until it\'s a photo somebody props up.',
      ],
    },
    corvid: {
      speaker: 'corvid',
      text: [
        'Corvid stands at the back in her black coat, which for once is the right coat for the room. She doesn\'t look at you. She looks at the photos, and the kids clustered near them — the next byteme, and the one after that, already here, already too young.',
        '"We tell ourselves it\'s a family," she says, very low. "And it is. Right up until somebody\'s kid is on a table and we all knew, and none of us said the thing loud enough." A long pause. "I\'ve been to too many of these. I keep thinking I\'ll stop coming. I keep coming."',
      ],
      choices: [
        {
          text: '"Then we say it louder. Starting now." Make it a promise, out loud, to her.',
          effects: [
            { npc: 'corvid', affinity: 5 },
            { stat: 'mood', add: -2 },
            { flag: 'side.byteme_funeral_seen' },
          ],
          goto: 'corvid_promise',
        },
        {
          text: 'Say nothing. Just stand with her and let the silence be honest.',
          effects: [
            { stat: 'mood', add: -4 },
            { flag: 'side.byteme_funeral_seen' },
          ],
          goto: 'corvid_silence',
        },
      ],
    },
    corvid_promise: {
      speaker: 'corvid',
      text: [
        '"Louder," she repeats, testing the word like a tool she isn\'t sure will hold weight. She finally looks at you. "You mean that, you\'d better mean it in daylight, in front of the young ones, when it costs you something. Not here. Here\'s easy. Everybody\'s good at a funeral."',
        'She lets that sit. Then, almost gently: "But — yes. Louder. It\'s the only thing that was ever going to be worth anything." She goes back to watching the kids by the photos, and you stand with her, and it is not nothing, to be believed by Corvid on a night like this.',
      ],
    },
    corvid_silence: {
      speaker: 'narrator',
      text: [
        'You don\'t say anything, because there\'s nothing to say that wouldn\'t be for you instead of for him. You stand with Corvid and watch the kids by the photo table, and she lets you, which is its own kind of forgiveness, or its own kind of judgment, and tonight you can\'t tell which and it doesn\'t matter.',
        'After a while she says, "Go home. Sleep. Grief\'s a young man\'s game and you look older than you are." It is the closest thing to kindness she has in her tonight, and you take it, and you go.',
      ],
    },
    back: {
      speaker: 'narrator',
      text: [
        'You stay by the wall, near the coats, where you can see the whole room and no one has to hold your face on top of everything else they\'re carrying. You sign the book. You look at the photos long enough to owe him that. byteme with the keyboard over his head, grinning, sixteen forever.',
        {
          if: { flag: 'npc.byteme.used' },
          text: 'You don\'t go to his mother. You can\'t. You know what you\'d have to hold in your face while she thanked you, and you are a coward about exactly this one thing, tonight, and you let yourself be. You leave before the room empties, so no one can ask you to stay.',
          else: 'You didn\'t know him as well as the others did — you told yourself that on the drive over, and it\'s even true, and it doesn\'t help. You leave before the room empties, and you sit in the car a while before you can make your hands start it.',
        },
      ],
    },
  },
}

export default defineContent({
  quests: [quest],
  scenes: [scene],
})
