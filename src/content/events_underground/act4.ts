/**
 * events_underground — ACT IV (days ~2900+). The long tail. Bills come due, the scene is mostly
 * memory, and a name that mattered for a decade is a weight to carry, not a badge to wear. The
 * comedy survives only as gallows humour; every beat reads what a decade of choices did to the cast
 * and the city (guarded hard on fates — anyone could be dead, jailed, gone, or bought by now).
 *
 *  - ev_under_old_debt_called   once · chat · a favour from the early days comes back (Business / Social)
 *  - ev_under_scene_wake        once · dialog · the Row gathers at the Cathode; who's left (no check, weight)
 *  - ev_under_apprentice        repeatable · chat · a kid wants what you know (Social / OpSec)
 *  - ev_under_last_envoy        once · dialog · a final, quiet offer to disappear comfortably (Business / OpSec)
 *
 * HARD RULE: hacking is invented flavor only.
 */
import { defineContent } from '@/engine/registry'
import type { BuffDef, EventDef, SceneDef } from '@/engine/types'
import { actGte, around, boardLive, buff, bump, cathodeOpen, free } from './_shared'

// ── ev_under_old_debt_called ──────────────────────────────────────────────────
// Somebody you ran discs for, or did dirty work for, once, comes to collect on the fact that you
// were once the kind of person who said yes. Reads early-game flags so a decade actually echoes.
const debtScene: SceneDef = {
  id: 'ev_under_old_debt_scene',
  channel: 'chat',
  title: 'long time. u owe me one tho',
  from: 'Switch',
  start: 'pitch',
  expiresDays: 14,
  onExpire: [{ npc: 'switch', affinity: -2 }, { stat: 'stress', add: 4 }],
  nodes: {
    pitch: {
      speaker: 'switch',
      text: [
        { if: { flag: 'ev_under.ran_for_switch' }, text: 'remember when u carried a stack of discs across the Row for forty bucks and a flat tire? i do. i remember everybody who ever showed up for me. its a short list' },
        { if: { not: { flag: 'ev_under.ran_for_switch' } }, text: 'we go back. not close, but back. back counts for something at our age' },
        'im calling it in. small thing. a name needs a soft landing — papers that say a boring life, a couple of doors held open, nothing that touches you. u still know how to do that in ur sleep',
        { if: { flag: 'ev_under.did_odette_job' }, text: '"and dont give me the clean-hands speech. i know what u did for Odette. i know what that number was. this is smaller AND kinder. do the kind one for once."' },
        'one favour. then we\'re square, and being square with me is worth more than u think, this late in the day',
      ],
      choices: [
        {
          text: 'You owe him. Pay it. Do the soft landing, quietly, for free.',
          effects: [{ npc: 'switch', affinity: 6 }, { stat: 'heat', add: 5 }, { faction: 'fac.loft', add: 2 }, { stat: 'mood', add: 3 }, { flag: 'ev_under.paid_old_debt' }],
          goto: 'paid',
        },
        {
          tag: '[Business]',
          text: '"I\'ll do it. But a favour this old comes with a favour back — I decide when, and it\'s a big one."',
          check: {
            skill: 'business',
            dc: 18,
            bonuses: [{ if: { stat: 'cred', gte: 55 }, add: 2, label: '+2 (your name still opens doors)' }],
            success: 'terms_ok',
            fail: 'terms_bad',
          },
        },
        {
          tag: '[Social]',
          text: '"I\'m out, Ray. For real. Let me help you find someone who isn\'t." End it kindly, keep the friend.',
          check: {
            skill: 'social',
            dc: 17,
            bonuses: [{ if: { trait: 'empath' }, add: 2, label: '+2 (empath)' }, { if: { trait: 'ev_under_street_smart' }, add: 1, label: '+1 (street smart)' }],
            success: 'bowed_out',
            fail: 'bow_bad',
            successEffects: [{ npc: 'switch', affinity: 3 }, { stat: 'mood', add: 4 }, { flag: 'ev_under.declined_old_debt_clean' }],
            failEffects: [{ npc: 'switch', affinity: -6 }, { trait: 'ev_under_burned_bridge' }, { stat: 'mood', add: -5 }, { flag: 'ev_under.stiffed_switch' }],
          },
        },
        {
          text: '"I don\'t owe you a decade of my life over a flat tire." Say no and mean it.',
          effects: [{ npc: 'switch', affinity: -5 }, { stat: 'cred', add: -2 }, { flag: 'ev_under.stiffed_switch' }],
          goto: 'refused',
        },
      ],
    },
    paid: {
      speaker: 'switch',
      text: 'done. clean. u did it in an afternoon like it was nothing, which is how i know it wasnt nothing. we\'re square. and hey — of everybody from back then, ur one of maybe three still standing and still urself. dont waste that',
    },
    terms_ok: {
      speaker: 'switch',
      text: 'ha. ok. OK. a favour for a favour, ur call, big one. thats not a no, thats a contract, and i respect a contract. deal. u were always going to outlast me',
      effects: [{ stat: 'heat', add: 5 }, { faction: 'fac.loft', add: 1 }, { flag: 'ev_under.switch_owes_you' }, { flag: 'ev_under.paid_old_debt' }, { xp: 'business', add: 20 }],
    },
    terms_bad: {
      speaker: 'switch',
      text: 'a favour for a favour? at our age?? no. i asked u for one thing on the strength of who u used to be and u handed me an invoice. do it or dont, but dont dress it up',
      choices: [
        {
          text: 'Fine. Do it for free. Some invoices aren\'t worth sending.',
          effects: [{ npc: 'switch', affinity: 2 }, { stat: 'heat', add: 5 }, { flag: 'ev_under.paid_old_debt' }],
          goto: 'paid',
        },
        {
          text: 'Then no. We\'re not who we were.',
          effects: [{ npc: 'switch', affinity: -5 }, { flag: 'ev_under.stiffed_switch' }],
          goto: 'refused',
        },
      ],
    },
    bowed_out: {
      speaker: 'switch',
      text: 'yeah. yeah ok. i hear it. u actually mean it this time. thats. good, honestly. u found the door. most of us never do. ill find someone. take care of urself, {handle}. i mean that',
    },
    bow_bad: {
      speaker: 'switch',
      text: 'dont. dont give me the speech and the pity in the same breath. i asked a friend for a favour and got a therapist. forget it. forget i called. forget the whole decade if it\'s so heavy',
    },
    refused: {
      speaker: 'switch',
      text: 'wow. ok. noted. filed. i\'ll remember this the exact way i remembered the good stuff — completely. we\'re not square. we\'re the other thing now',
    },
  },
}

const oldDebtCalled: EventDef = {
  id: 'ev_under_old_debt_called',
  category: 'underground',
  weight: 2,
  when: { all: [actGte(4), around('switch'), { npc: 'switch', fateNot: ['sellout'] }, free] },
  scene: 'ev_under_old_debt_scene',
}

// ── ev_under_scene_wake ───────────────────────────────────────────────────────
// The Row gathers at the Cathode one last time. No check — just weight, and a mirror of your cast.
const wakeScene: SceneDef = {
  id: 'ev_under_scene_wake_scene',
  channel: 'dialog',
  title: 'Last Call at the Cathode',
  from: 'The Cathode Diner',
  pause: true,
  start: 'gather',
  nodes: {
    gather: {
      speaker: 'narrator',
      text: [
        { if: cathodeOpen, text: 'Somebody put the word out and the old crowd came, the way the old crowd does when there\'s nothing left to lose by being seen together. Sal has pushed the tables into one long line and stopped charging around 9 p.m., which for Sal is a eulogy.' },
        { if: { not: cathodeOpen }, text: 'The Cathode is gone — a cell-phone store with frosted windows where the counter used to be — so the old crowd gathers on the sidewalk out front anyway, coffee from paper cups, standing in the ghost of the place.' },
        { if: { npc: 'deadline', fate: 'passed' }, text: 'The worst chair by the door is here, carried over from the back room. Nobody sits in it. There\'s a coffee on the seat, going cold the way he liked it. It\'s the only chair everyone makes room for.' },
        { if: around('deadline'), text: 'Deadline holds court from the worst chair, older and slower and still ominous, telling the \'94 story to a table of people who have all heard it and want to hear it again.' },
        { if: { npc: 'corvid', fate: 'martyred' }, text: 'Someone taped Corvid\'s last board post to the napkin dispenser: "Keep the lights on. Don\'t sell the building." A few people touch it on the way past like it\'s a saint\'s hem.' },
        { if: around('corvid'), text: 'Corvid is here, quieter than the legend, watching the room she kept alive for twenty years fill up one last time.' },
        { if: { npc: 'byteme', fate: 'dead' }, text: 'Kevin isn\'t here. Kevin is why half of these people finally answered the phone. His mother sent a tray of food and a note that nobody can read out loud.' },
        { if: { all: [around('byteme'), { npc: 'byteme', fate: 'pro' }] }, text: 'byteme — Kevin, grown, careful, using capital letters now — buys the first round and won\'t let anyone see him tear up, which everyone kindly pretends to allow.' },
        'You came up in this room. Whatever you are now, you learned the first version of it here, from these people, on a modem that screamed.',
      ],
      choices: [
        {
          text: 'Stand up and say the true thing: what this scene was, and what it cost, and that it was worth it.',
          effects: [{ faction: 'fac.loft', add: 3 }, { faction: 'fac.hood', add: 2 }, { stat: 'mood', add: 8 }, { flag: 'ev_under.gave_the_eulogy' }],
          goto: 'eulogy',
        },
        {
          text: 'Say nothing. Sit with it. Buy the room a round and let the silence do the talking.',
          req: { stat: 'money', gte: 200 },
          reqText: 'Requires $200 for the room',
          effects: [{ money: -200 }, { faction: 'fac.hood', add: 3 }, { stat: 'mood', add: 5 }, { faction: 'fac.loft', add: 1 }],
          goto: 'round',
        },
        {
          text: 'You can\'t do this tonight. Leave a bill on the counter and slip out before anyone clocks you.',
          effects: [{ money: -60 }, { stat: 'mood', add: -3 }, { stat: 'stress', add: 4 }, { flag: 'ev_under.left_the_wake' }],
          goto: 'slipped',
        },
      ],
    },
    eulogy: {
      speaker: 'narrator',
      text: [
        'You stand up. The room goes quiet the way only a loud room can. You tell them what it was — a family that became a market that became evidence, and a handful of people who kept choosing each other anyway, right up until they couldn\'t.',
        { if: around('deadline'), text: 'Deadline lifts his cold coffee. "That," he says, "is the smartest thing anyone\'s said in this diner since I got out in \'95." Coming from him it is the Nobel Prize.' },
        'Somebody starts a slow clap and it turns into something warmer. For one hour, on one night, the scene is a family again, and you were the one who said so out loud.',
      ],
    },
    round: {
      speaker: 'narrator',
      text: 'You catch Sal\'s eye and make a small circle with one finger: everyone. The coffee and the pie go around, and around, and nobody has to make a speech, and the not-having-to is its own kind of speech. You stay until the lights go low.',
    },
    slipped: {
      speaker: 'narrator',
      text: [
        'You leave enough on the counter to cover a lot of coffee and you go out the back, past the walk-in freezer, past the door to the back room that isn\'t the back room anymore.',
        'Halfway down the block the laughter reaches you, the way it always has. You keep walking. Some goodbyes you have to say from a distance or you don\'t survive saying them at all.',
      ],
    },
  },
}

const sceneWake: EventDef = {
  id: 'ev_under_scene_wake',
  category: 'underground',
  weight: 3,
  when: { all: [actGte(4), { day: true, gte: 3000 }, free] },
  scene: 'ev_under_scene_wake_scene',
}

// ── ev_under_apprentice ───────────────────────────────────────────────────────
// A kid wants what you know. Repeatable: the last question a legend answers is what to pass on.
const APPRENTICE_COUNT = 'ev_under.apprentice_count'

const LEGACY: BuffDef = {
  id: 'ev_under_legacy',
  name: 'Passing It On',
  desc: 'You\'re teaching someone to be careful in a way nobody taught you. It\'s slow, and it\'s the best thing you do all week.',
  days: 28,
  mods: [
    { key: 'stress.relief', mult: 1.1 },
    { key: 'mood.daily', add: 0.5 },
  ],
}

const apprenticeScene: SceneDef = {
  id: 'ev_under_apprentice_scene',
  channel: 'chat',
  title: 'ur the {handle} right. the real one',
  from: 'young handle',
  start: 'ask',
  expiresDays: 14,
  nodes: {
    ask: {
      speaker: 'young handle',
      text: [
        { if: { var: APPRENTICE_COUNT, lte: 1 }, text: 'ok this is so weird to type but ur like. a legend. my older cousin has ur board posts printed OUT. in a BINDER' },
        { if: { var: APPRENTICE_COUNT, gte: 2 }, text: 'hi. another one. word gets around that u actually answer. i\'m not like the others tho i swear. ok everyone says that' },
        'i want to learn. for real, not the "undetectable trust me" stuff off the boards. the real thing. how u lasted. how u didnt get caught. will u teach me',
        { if: { flag: 'ev_under.byteme_scare' }, text: 'they said u used to teach a guy named kevin. they said u were good at it. they said he turned out ok. is that true' },
      ],
      choices: [
        {
          tag: '[OpSec]',
          text: 'Teach them the only lesson that matters: how to be boring, careful, and still here in ten years.',
          check: {
            skill: 'opsec',
            dc: 16,
            bonuses: [
              { if: { trait: 'ev_under_paranoid_sleeper' }, add: 2, label: '+2 (you learned this the hard way)' },
              { if: { trait: 'ev_under_street_smart' }, add: 1, label: '+1 (street smart)' },
            ],
            success: 'taught_well',
            fail: 'taught_scared',
            successEffects: [{ stat: 'cred', add: 2 }, { faction: 'fac.loft', add: 2 }, { stat: 'mood', add: 5 }, buff(LEGACY), { flag: 'ev_under.took_apprentice' }],
            failEffects: [{ stat: 'mood', add: -3 }, { stat: 'stress', add: 4 }, { flag: 'ev_under.scared_off_apprentice' }],
          },
        },
        {
          tag: '[Social]',
          text: 'Talk them out of it, gently — the door you found, held open for one more person.',
          check: {
            skill: 'social',
            dc: 15,
            bonuses: [{ if: { trait: 'empath' }, add: 2, label: '+2 (empath)' }],
            success: 'talked_out',
            fail: 'talk_bad',
            successEffects: [{ faction: 'fac.hood', add: 2 }, { stat: 'mood', add: 4 }, { flag: 'ev_under.saved_a_kid' }],
            failEffects: [{ stat: 'mood', add: -4 }, { flag: 'ev_under.kid_went_anyway' }],
          },
        },
        {
          text: '"I\'m not a legend, I\'m a cautionary tale. Read a different binder." Log off.',
          effects: [{ stat: 'cred', add: -1 }, { stat: 'mood', add: -2 }],
          goto: 'brushed',
        },
      ],
    },
    taught_well: {
      speaker: 'young handle',
      text: [
        'ok. OK. i wrote all of it down. "boring is a skill." "the log you don\'t make is the case they don\'t have." "back up ur LIFE not ur data" — that one\'s from someone called deadline right?? i looked him up',
        'nobody ever taught me the careful part before. everyone just wants to look cool. thank u. i\'m gonna last ten years and then i\'m gonna teach someone else. thats a promise',
      ],
    },
    taught_scared: {
      speaker: 'young handle',
      text: 'oh. um. that was. a lot. i think i get it? mostly? some of it was kind of scary honestly. u kept saying "and thats how they get you". like nine times. i gotta go. thanks tho',
    },
    talked_out: {
      speaker: 'young handle',
      text: 'huh. i thought u\'d be the one person who\'d say do it. and u\'re the one person who said dont. thats. actually why i believe u. ok. yeah. maybe i\'ll build games instead. u can build games right? like normal? ok. thanks {handle}',
    },
    talk_bad: {
      speaker: 'young handle',
      text: 'ok grandpa lol. "its dangerous" "i lost people" — yeah yeah. u did it and ur fine and famous. i\'ll be fine too. watch. u\'ll see my handle around',
    },
    brushed: {
      speaker: 'narrator',
      text: 'You log off. The kid types "?" three times into a window that isn\'t there anymore. Somewhere out there they find someone who does say yes, someone with worse advice and a better sales pitch. You try not to think about which.',
    },
  },
}

const apprentice: EventDef = {
  id: 'ev_under_apprentice',
  category: 'underground',
  weight: 2,
  repeatable: true,
  cooldownDays: 120,
  when: { all: [actGte(4), { stat: 'cred', gte: 40 }, boardLive, free] },
  effects: [bump(APPRENTICE_COUNT)],
  scene: 'ev_under_apprentice_scene',
}

// ── ev_under_last_envoy ───────────────────────────────────────────────────────
// A final, quiet offer to disappear comfortably: a clean identity, a soft exit, no more looking over
// your shoulder — for a price you can't unpay. A cutout, so it survives any Kroll/Aperture fate.
const GHOSTED: BuffDef = {
  id: 'ev_under_ghosted',
  name: 'A Clean Exit',
  desc: 'New name, new papers, no more heat. The past can\'t find you — and neither, some nights, can you.',
  days: 60,
  mods: [
    { key: 'heat.decay', add: 0.6 },
    { key: 'cred.gain', mult: 0.5 },
  ],
}

const lastEnvoyScene: SceneDef = {
  id: 'ev_under_last_envoy_scene',
  channel: 'dialog',
  title: 'A Way Out',
  from: 'a woman with no card',
  pause: true,
  start: 'offer',
  nodes: {
    offer: {
      speaker: 'a woman with no card',
      text: [
        'She doesn\'t hand you a card this time. She\'s past cards. She sits down across from you like she\'s done it a hundred times, because she has, with a hundred people at exactly this moment in their lives.',
        '"You\'ve had a long run. Longer than most. I represent people who reward long runs — not with money, you have money, or you don\'t and it\'s too late for it to matter. With a door. A clean name. Papers that go all the way down. A quiet place where nobody\'s ever heard your handle."',
        { if: { stat: 'heat', gte: 50 }, text: '"And you need it. I\'ve seen your heat. You\'re one bad Tuesday from a cell, and you know it, and that\'s why you\'re still sitting here instead of walking."' },
        { if: { faction: 'fac.hood', gte: 50 }, text: '"The catch is the catch you already guessed: you don\'t get to say goodbye. Not to the Row, not to family, not to anyone. A clean exit is only clean if it\'s complete."' },
      ],
      choices: [
        {
          text: 'Take the door. Disappear clean. Some runs should end while you can still choose how.',
          effects: [{ stat: 'heat', add: -40 }, { faction: 'fac.hood', add: -6 }, { faction: 'fac.loft', add: -4 }, buff(GHOSTED), { flag: 'ev_under.took_the_door' }, { stat: 'stress', add: -10 }, { stat: 'mood', add: -6 }],
          goto: 'took',
        },
        {
          tag: '[Business]',
          text: '"A door that erases me is worth more to you than to me. What are you really buying — my silence, or my absence?" Read the deal behind the deal.',
          check: {
            skill: 'business',
            dc: 20,
            bonuses: [{ if: { stat: 'cred', gte: 60 }, add: 2, label: '+2 (you know your own worth by now)' }],
            success: 'read_ok',
            fail: 'read_bad',
            successEffects: [{ stat: 'cred', add: 2 }, { flag: 'ev_under.made_them_show_a_card' }],
            failEffects: [{ stat: 'stress', add: 8 }, { flag: 'ev_under.rattled_by_the_offer' }, { complication: 'legal' }],
          },
        },
        {
          tag: '[OpSec]',
          text: 'Say no, then quietly find out who she works for before she reaches the door.',
          check: {
            skill: 'opsec',
            dc: 21,
            bonuses: [{ if: { item: 'ev_under_hushline' }, add: 2, label: '+2 (the Hushline Relay)' }, { if: { trait: 'paranoid' }, add: 2, label: '+2 (paranoid)' }],
            success: 'traced_her',
            fail: 'lost_her',
            successEffects: [{ stat: 'cred', add: 3 }, { flag: 'ev_under.traced_the_fixer' }, { xp: 'opsec', add: 40 }],
            failEffects: [{ complication: 'legal' }, { stat: 'heat', add: 10 }, { trait: 'ev_under_open_file' }, { flag: 'ev_under.tipped_them_off' }],
          },
        },
        {
          text: '"I\'m staying. Whatever it costs. This is my city, and these are my people, and I\'d rather be caught here than safe nowhere."',
          effects: [{ faction: 'fac.hood', add: 5 }, { faction: 'fac.loft', add: 3 }, { stat: 'cred', add: 2 }, { stat: 'mood', add: 4 }, { flag: 'ev_under.refused_the_door' }],
          goto: 'stayed',
        },
      ],
    },
    took: {
      speaker: 'narrator',
      text: [
        'You take the door. The heat bleeds off you like a fever breaking. New name, new papers, a quiet place. Nobody there has ever heard your handle, which is the whole point, and which is also, at 3 a.m., unbearable.',
        'You got out clean. You spend a long time learning that "clean" and "whole" are not the same word.',
      ],
    },
    read_ok: {
      speaker: 'a woman with no card',
      text: '"...My absence, then, put plainly: my clients would like you filed under \'resolved\' rather than \'loose\'. You\'re smart. You knew that." She stands. "The offer stays open. It always stays open, for people like you. That\'s the frightening part, isn\'t it — that it\'s real, and it\'s kind, and it\'s a cage." She leaves you the check for the coffee, which is either a joke or a message.',
    },
    read_bad: {
      speaker: 'narrator',
      text: 'You push, and she pushes back, softer and harder at once, and somewhere in the conversation you say a sentence you can\'t take back — a name, a place, a detail that confirms something she only suspected. She leaves satisfied. You leave with a new, cold certainty that you just paid for that coffee with something you can\'t itemize.',
    },
    traced_her: {
      speaker: 'narrator',
      text: 'You say no, walk her to the door, shake her hand — and in the shaking, in the hour after, you follow the thread she left without meaning to. You don\'t get a name. You get a shape: who sends the woman with no card, and why, and to whom. Not a weapon. But you know where the door goes now, and that changes how it feels to have said no.',
    },
    lost_her: {
      speaker: 'narrator',
      text: [
        'You say no and then you get greedy — you go looking, and she was always better at this than you, and she feels you looking the way a spider feels a web.',
        'She doesn\'t come back. What comes back, a month later, is a folder with your name on it and a great deal more inside it than there used to be.',
      ],
    },
    stayed: {
      speaker: 'narrator',
      text: [
        '"I thought you\'d say that." And — strangest thing — she looks almost glad. "Most of the ones worth the offer do. It\'s the ones who take it I lose sleep over." She leaves without the coffee, without a card, without a trace.',
        'You stay. It costs what it costs. But it\'s yours to pay, in a city that\'s yours to lose, among people who are yours to keep. That was always the only deal worth making.',
      ],
    },
  },
}

const lastEnvoy: EventDef = {
  id: 'ev_under_last_envoy',
  category: 'underground',
  weight: 2,
  when: { all: [actGte(4), { stat: 'cred', gte: 45 }, { day: true, gte: 3050 }, free] },
  scene: 'ev_under_last_envoy_scene',
}

export default defineContent({
  events: [oldDebtCalled, sceneWake, apprentice, lastEnvoy],
  scenes: [debtScene, wakeScene, apprenticeScene, lastEnvoyScene],
})

