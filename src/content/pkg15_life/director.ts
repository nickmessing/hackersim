/**
 * PKG-15 — the director's pool (delivered only by trig_director in system.ts).
 * Small, repeatable vignettes that fill dead air: light in Acts I–II, gallows comedy in Act III,
 * memory in Act IV. Each reads current state so a repeat never lands exactly the same way.
 */
import { defineContent } from '@/engine/registry'
import type { SceneDef } from '@/engine/types'
import { around, close, darkTurn, momGone, momHere, withPartner } from './_shared'

const scenes: SceneDef[] = [
  {
    id: 'life_dir_quiet_evening',
    channel: 'dialog',
    title: 'A Quiet Evening',
    start: 'start',
    nodes: {
      start: {
        speaker: 'narrator',
        text: [
          `Nothing is on fire. Nobody is paging you. The contract board is quiet, the forum is arguing about something that doesn't concern you, and the fog is coming in off the Sound in long slow sheets.`,
          { if: darkTurn, text: `You can't remember the last time an evening was just an evening. You don't quite trust it.`, else: `It's the kind of evening you'll forget completely, and miss, years from now, without knowing which one it was.` },
        ],
        choices: [
          { text: `Read a book. A paper one.`, effects: [{ stat: 'stress', add: -8 }, { xp: 'programming', add: 10 }] },
          { text: `Walk down to the water.`, effects: [{ stat: 'stress', add: -6 }, { stat: 'mood', add: 4 }, { xp: 'fitness', add: 10 }] },
          { text: `Call someone you haven't called in a while.`, if: { any: [momHere, around('dad'), around('jax'), around('kim')] }, effects: [{ stat: 'mood', add: 5 }, { if: momHere, then: [{ npc: 'mom', affinity: 2 }], else: [{ if: around('jax'), then: [{ npc: 'jax', affinity: 2 }], else: [{ npc: 'dad', affinity: 2 }] }] }] },
        ],
      },
    },
  },
  {
    id: 'life_dir_lan_invite',
    channel: 'chat',
    title: 'LAN SAT!!!',
    from: 'jax',
    start: 'start',
    nodes: {
      start: {
        text: [
          `LAN. MY GARAGE. SATURDAY`,
          `my mom made 40 lbs of empanadas and she says if they are not eaten she will "know"`,
          `bring ur box. bring a power strip. bring a SECOND power strip, last time we tripped the whole block`,
          { if: darkTurn, text: `also i need this man. things are weird lately. i need 12 hrs of blowing up my friends in a video game` },
        ],
        choices: [
          { text: `"im there. im bringing 3 power strips"`, effects: [{ npc: 'jax', affinity: 5 }, { stat: 'mood', add: 8 }, { stat: 'stress', add: -8 }, { stat: 'energy', add: -12 }], goto: 'there' },
          { text: `"cant this week. next time for sure"`, effects: [{ npc: 'jax', affinity: -1 }], goto: 'cant' },
        ],
      },
      there: { text: [`YES`, `i am going to destroy u with the rocket launcher`, `lovingly`] },
      cant: { text: [`boo`, `ok. saving u an empanada. maybe. no promises`] },
    },
  },
  {
    id: 'life_dir_sal_pie',
    channel: 'mail',
    title: 'New pie',
    from: 'sal',
    start: 'start',
    nodes: {
      start: {
        text: [
          `Kid.`,
          `Made a new pie. Coconut cream with a graham crust. Nobody asked for it. The regulars say "Sal, where's the cherry." The cherry is still there. This is ALSO there.`,
          `Come eat a slice and tell me it's good. If it's not good lie.`,
          `— Sal\nThe Cathode. Open 24 hrs. Mostly.`,
        ],
        choices: [
          { text: `Go eat the pie. Tell him the truth: it's great.`, effects: [{ npc: 'sal', affinity: 3 }, { faction: 'fac.hood', add: 2 }, { stat: 'stress', add: -6 }, { stat: 'health', add: 2 }] },
          { text: `Reply: "Too busy this week, Sal. Save me one?"`, effects: [{ npc: 'sal', affinity: -1 }] },
        ],
      },
    },
  },
  {
    id: 'life_dir_kim_cd',
    channel: 'chat',
    title: 'favor',
    from: 'kim',
    start: 'start',
    nodes: {
      start: {
        text: [`i need a mix cd`, `for a boy`, `DONT say anything`, `it needs to say "i am cool and mysterious" but also "i like u" but NOT TOO MUCH`],
        choices: [
          { text: `Burn her a genuinely excellent mix.`, effects: [{ npc: 'kim', affinity: 5 }, { stat: 'mood', add: 4 }], goto: 'good' },
          { text: `Burn her 74 minutes of modem noises.`, effects: [{ npc: 'kim', affinity: 2 }, { stat: 'mood', add: 6 }], goto: 'modem' },
          { text: `"ur 14. no boys. only algebra"`, effects: [{ npc: 'kim', affinity: -2 }], goto: 'no' },
        ],
      },
      good: { text: [`ok this is actually really good`, `i'm writing "made by me" on it`, `u will never get credit. this is the price of being an older sibling`] },
      modem: { text: [`I HATE YOU`, `...`, `track 6 is kind of a banger tho`, `i'm keeping it. i'm still mad`] },
      no: { text: [`wow ok grandpa`, `i'm asking jax. jax will do it`, `jax will put a song about a pirate on it i just KNOW`] },
    },
  },
  {
    id: 'life_dir_flamewar',
    channel: 'forum',
    board: 'offtopic',
    title: 'REAL PROGRAMMERS use ______ (FIGHT)',
    from: 'byteme',
    start: 'start',
    nodes: {
      start: {
        speaker: 'byteme',
        text: [
          `ok settle this. my friend says real programmers use a text editor with 400 keyboard shortcuts and no mouse. i say real programmers use whatever doesnt make them cry`,
          `> the one with the shortcuts is the only true editor. everything else is a word processor for cowards  --  posted by 0xDEADBEEF`,
          `> i write all my code in notepad and i have never been happier or more alone  --  posted by nullpointer`,
          `> ASCII ART INCOMING\n>   (╯°□°)╯︵ ┻━┻\n>  --  posted by table_flipper`,
          `page 14 of 14. this thread is older than some of the posters.`,
        ],
        choices: [
          { text: `Post: "real programmers use whatever ships."`, effects: [{ stat: 'cred', add: 1 }, { stat: 'mood', add: 3 }] },
          { text: `Post a 40-line ASCII art dragon eating a keyboard. Say nothing else.`, effects: [{ stat: 'mood', add: 6 }, { faction: 'fac.loft', add: 1 }] },
          { text: `Close the thread. Get some actual work done.`, effects: [{ xp: 'programming', add: 20 }] },
        ],
      },
    },
  },
  {
    id: 'life_dir_dee_newsletter',
    channel: 'mail',
    title: 'COUNCILWOMAN BRIGGS\' MONTHLY UPDATE (read to the end, there is a raffle)',
    from: 'dee',
    start: 'start',
    nodes: {
      start: {
        text: [
          `Dear Constituents (and you, you are on this list whether you like it or not),`,
          `POTHOLES: Fourth Street has been repaved. Fifth Street is jealous. Fifth Street is next.`,
          `LIBRARY: Now open until 9 p.m. on weekdays. The computer lab has twelve new machines. I personally checked that every monitor is plugged in.`,
          { if: { flag: 'a3.mnsa_live' }, text: `THE NETWORK SECURITY ACT: I have received four hundred letters about this and read every one. I have questions. I am asking them. Loudly. In meetings. People have started to sigh when I raise my hand, and I consider that progress.` },
          `RAFFLE: First prize is a CompCastle gift certificate I found in my desk. It may be expired. It may be valid in a store that no longer exists. That is part of the fun.`,
          `— Councilwoman Dee Briggs, Cannery–Millgate Ward\n"Healing the Customer. Now With Zoning Authority."`,
        ],
        choices: [
          { text: `Enter the raffle.`, effects: [{ npc: 'dee', affinity: 2 }, { stat: 'mood', add: 3 }] },
          { text: `Reply with a pothole on Sixth Street. Photo attached.`, effects: [{ npc: 'dee', affinity: 3 }, { faction: 'fac.hood', add: 1 }] },
        ],
      },
    },
  },
  {
    id: 'life_dir_jax_page',
    channel: 'chat',
    title: 'u up',
    from: 'jax',
    start: 'start',
    nodes: {
      start: {
        text: [
          `u up`,
          `i think my microwave is listening to me`,
          `jk`,
          `...mostly jk. did u see the new law thing. they can keep EVERYTHING now. like my search for "is it normal for a cat to eat a sock"`,
          `the feds know about my cat's sock problem man`,
        ],
        choices: [
          { text: `"ur cat's sock problem is safe with me. the feds are another matter"`, effects: [{ npc: 'jax', affinity: 3 }, { stat: 'mood', add: 4 }], goto: 'lol' },
          { text: `"honestly? be careful what u type. i mean it"`, effects: [{ npc: 'jax', affinity: 2 }, { stat: 'stress', add: 2 }], goto: 'serious' },
        ],
      },
      lol: { text: [`lol`, `thank u for ur service`, `the cat says thank u too. the cat is eating a sock right now`] },
      serious: { text: [`...yeah`, `yeah i know`, `remember when the worst thing that could happen was ur mom picking up the phone`, `i miss that`] },
    },
  },
  {
    id: 'life_dir_szabo_theory',
    channel: 'mail',
    title: 'A THEORY (handwritten, scanned at the library)',
    from: 'Mr. Szabo',
    start: 'start',
    nodes: {
      start: {
        text: [
          `To the computer one,`,
          `The librarian scanned this for me. She is very patient. She says the machine will send my handwriting to you through the telephone, which I think is how they will read it too, but fine.`,
          `New theory. The streetlight outside 14B. It turned on eleven minutes early on Tuesday. ELEVEN. It has been on the same timer since 1974. Why would a streetlight change its mind?`,
          `I do not need you to fix it. I only need a second witness.`,
          `FERRY MAN, OVER`,
        ],
        choices: [
          { text: `Go sit on the stoop with him and watch the streetlight come on.`, effects: [{ faction: 'fac.hood', add: 3 }, { stat: 'stress', add: -5 }, { flag: 'life.toaster_friend' }] },
          { text: `Reply: "Witnessed. Over."`, effects: [{ faction: 'fac.hood', add: 1 }, { stat: 'mood', add: 2 }] },
        ],
      },
    },
  },
  {
    id: 'life_dir_old_photo',
    channel: 'dialog',
    title: 'Fall 2001',
    start: 'start',
    nodes: {
      start: {
        speaker: 'narrator',
        text: [
          `Looking for a cable in a box you haven't opened in years, you find a photo instead. A real one, printed at the drugstore, a little faded. Fall 2001. Your beige computer, your 14-inch monitor, and you in front of it, eighteen, grinning at nothing, in a shirt you'd forgotten existed.`,
          { if: close('jax', 20), text: `Jax is in the corner of the frame, mid-laugh, holding a bag of chips like a trophy.` },
          { if: { npc: 'jax', fate: ['dead', 'arrested', 'gone'] }, text: `Jax is in the corner of the frame, mid-laugh. You look at him for a long time.` },
          { if: momHere, text: `On the back, in Mom's bookkeeper's handwriting: "First day on the internet. Would not come to dinner."` },
          { if: momGone, text: `On the back, in Mom's handwriting: "First day on the internet. Would not come to dinner." You had forgotten she took it. You had forgotten a lot of things.` },
          `The kid in the photo has no idea what's coming. You'd like to tell him something. You're not sure what.`,
        ],
        choices: [
          { text: `Pin it above your desk.`, effects: [{ stat: 'mood', add: 4 }, { stat: 'stress', add: -4 }] },
          { text: `Send a copy to someone who's in it, or should have been.`, if: { any: [withPartner, around('jax'), around('kim'), momHere] }, effects: [{ stat: 'mood', add: 6 }, { if: around('jax'), then: [{ npc: 'jax', affinity: 3 }], else: [{ if: momHere, then: [{ npc: 'mom', affinity: 3 }], else: [{ npc: 'kim', affinity: 3 }] }] }] },
          { text: `Put it back in the box.`, effects: [{ stat: 'mood', add: -2 }] },
        ],
      },
    },
  },
  {
    id: 'life_dir_sal_stool',
    channel: 'dialog',
    title: 'Your Stool',
    start: 'start',
    nodes: {
      start: {
        speaker: 'sal',
        text: [
          `The Cathode at 3 a.m. Sal is older and slower and still at the grill. The third stool from the end has a strip of masking tape on it with your handle written in marker. It has been there for years. You never asked him to do it.`,
          `"You look like a dropped call," he says, the way he has said it a thousand times, and puts down a cup of coffee you didn't order.`,
          { if: { var: 'w.hood_soul', gte: 2 }, text: `"You did good by this street," he adds, not looking at you. "Don't make a thing of it."` },
        ],
        choices: [
          { text: `Stay until the sun comes up.`, effects: [{ npc: 'sal', affinity: 4 }, { stat: 'stress', add: -10 }, { stat: 'health', add: 3 }] },
          { text: `Ask Sal how he's doing, for once.`, effects: [{ npc: 'sal', affinity: 6 }, { faction: 'fac.hood', add: 2 }], goto: 'sal' },
        ],
      },
      sal: {
        speaker: 'sal',
        text: `He stops wiping the counter. Nobody asks Sal how he's doing. "My knees are bad and my accountant is worse," he says. "And every night some kid comes in here who looks like you did, and I feed him, and I think: that one's gonna be okay." He shrugs. "Mostly I'm right. Eat your eggs."`,
      },
    },
  },
]

export default defineContent({ scenes })
