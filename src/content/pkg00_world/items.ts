/**
 * PKG-00 — story items (bible §12.8). None of these are sold: they are granted by story beats.
 * Evidence items are `hidden` so the generic raid can never confiscate them (a raid may only take
 * one in a dedicated, authored scene). `old_tool` is a `tool` but also hidden, per the bible.
 */
import { defineContent } from '@/engine/registry'

export default defineContent({
  items: [
    {
      id: 'aperture_sample',
      name: 'Aperture Sample',
      category: 'misc',
      shop: 'blackmarket',
      price: 0,
      unique: true,
      hidden: true,
      tier: 1,
      mods: [],
      desc: [
        "A copy of the \"you've won a prize!\" junk you scraped off Ruth Alvarez's PC, burned to a CD-R labelled RECIPES in your worst handwriting. Under the prize nonsense, the thing phones home every night at 3:12 a.m. to an address block that belongs to a dull little Millgate data company.",
        'Portable evidence. On its own it is a curiosity; next to other proof it becomes a story nobody can call a hoax. Hidden well enough that a raid will not find it.',
      ],
    },
    {
      id: 'kroll_recording',
      name: "Kroll's Ask (recording)",
      category: 'misc',
      shop: 'blackmarket',
      price: 0,
      unique: true,
      hidden: true,
      tier: 3,
      mods: [],
      desc: [
        'A voice recording, encrypted twice and stored in three places, of Vanessa Kroll laughing warmly and asking you for something extremely illegal in complete, grammatical sentences. You can hear the ice in her glass.',
        'The nuclear option. Enough on its own to prove what Special Accounts is.',
      ],
    },
    {
      id: 'priya_proof',
      name: "Priya's Proof",
      category: 'misc',
      shop: 'blackmarket',
      price: 0,
      unique: true,
      hidden: true,
      tier: 3,
      mods: [],
      desc: [
        "Priya Raman's documentation: purchase orders, a 1999 report she was paid to forget, and a decade of margin notes in tidy engineer's handwriting, all tracing Aperture money through Halcyon's books.",
        'Next to the Aperture sample, it is proof. Somebody would pay a great deal to make it disappear, and somebody else would risk everything to read it aloud.',
      ],
    },
    {
      id: 'scene_archive',
      name: 'The Scene Archive',
      category: 'misc',
      shop: 'blackmarket',
      price: 0,
      unique: true,
      hidden: true,
      tier: 3,
      mods: [],
      desc: [
        "Corvid's dead-man's archive: twenty years of the Loft — logs, member lists, old grudges, the '94 night — sealed so that it opens only if she can't stop it. She trusted you to guard it and not to read it.",
        'Keeping it safe keeps the commons alive in exile, whatever happens to the board.',
      ],
    },
    {
      id: 'exchange_keys',
      name: 'Exchange Keys',
      category: 'misc',
      shop: 'blackmarket',
      price: 0,
      unique: true,
      hidden: true,
      tier: 4,
      mods: [],
      desc: [
        "A heavy iron ring of keys to the old Cannery-Millgate telephone exchange, each one tagged in faded ballpoint by Marge Osgood: FRAME ROOM. CABLE VAULT. DO NOT — (the rest is worn off).",
        'The physical way into the building where the city\'s old copper and its new data trunk meet. Thirty years of somebody\'s working life, handed to you.',
      ],
    },
    {
      id: 'old_tool',
      name: "Phreaker's Toolbox",
      category: 'tool',
      shop: 'blackmarket',
      price: 0,
      unique: true,
      hidden: true,
      tier: 3,
      mods: [
        { key: 'trace', mult: 1.2 },
        { key: 'crack.speed', mult: 1.1 },
      ],
      desc: [
        "A dead phone phreak's kit, recovered from the server that wouldn't die: a dented lineman's handset, a notebook of switch-room folklore, and a floppy of routines so old and strange that modern systems don't recognize them as a threat.",
        'In the terminal, traces take longer to find you and locks give way a little faster. It hides in plain sight; no raid team has ever looked twice at an old phone.',
      ],
    },
  ],
})
