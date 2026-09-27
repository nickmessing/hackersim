/**
 * e-Shop presentation data: storefront labels, department names and ASCII product "photos".
 * Purely cosmetic; prices, availability and purchases come from the engine.
 */
import { HW_SLOTS } from '@/engine'
import type { HardwareSlot, ItemCategory, ItemDef, ShopId } from '@/engine'

export interface ShopMeta {
  id: ShopId
  label: string
  tagline: string
}

export const SHOPS: readonly ShopMeta[] = [
  { id: 'computer', label: 'Computers & Parts', tagline: 'Upgrade your rig. Your modem will thank you.' },
  { id: 'software', label: 'Software', tagline: 'Shrink-wrapped, licensed, and only slightly overpriced.' },
  { id: 'books', label: 'Books', tagline: 'Doorstop-sized manuals, and paperbacks for the bus ride.' },
  { id: 'life', label: 'Home & Life', tagline: 'Chairs, coffee, and the other things that keep a coder alive.' },
  { id: 'blackmarket', label: 'Back Alley', tagline: 'No receipts. No refunds. No names.' },
]

export const CATEGORY_ORDER: readonly ItemCategory[] = [
  'cpu',
  'ram',
  'storage',
  'network',
  'monitor',
  'software',
  'tool',
  'book',
  'furniture',
  'gadget',
  'vehicle',
  'misc',
]

export const CATEGORY_LABELS: Record<ItemCategory, string> = {
  cpu: 'Processors & PCs',
  ram: 'Memory',
  storage: 'Hard Drives',
  network: 'Modems & Net',
  monitor: 'Monitors',
  software: 'Software',
  tool: 'Utilities',
  book: 'Books',
  furniture: 'Furniture',
  gadget: 'Gadgets',
  vehicle: 'Vehicles',
  misc: 'Odds & Ends',
}

export const SLOT_LABELS: Record<HardwareSlot, string> = {
  cpu: 'Processor',
  ram: 'Memory',
  storage: 'Storage',
  network: 'Network',
  monitor: 'Monitor',
}

export function isHardware(def: ItemDef): def is ItemDef & { category: HardwareSlot } {
  return (HW_SLOTS as readonly string[]).includes(def.category)
}

export function categoryRank(c: ItemCategory): number {
  return CATEGORY_ORDER.indexOf(c)
}

/** Stable sort for shelves: department, then tier, then price. */
export function shelfSort(a: ItemDef, b: ItemDef): number {
  return (
    categoryRank(a.category) - categoryRank(b.category) ||
    (a.tier ?? 0) - (b.tier ?? 0) ||
    a.price - b.price ||
    a.name.localeCompare(b.name)
  )
}

/** ASCII product shots (categories drawn with CSS instead are omitted). */
export const ASCII_ART: Partial<Record<ItemCategory, string>> = {
  cpu: [' ._______.', ' | [___] |', ' | [___] |', ' |  ::: o|', ' |  :::  |', ' |_______|'].join('\n'),
  ram: [' ____________', '|[][][][][][]|', '|[][][][][][]|', '|____________|', ' |||||||||||| '].join('\n'),
  storage: [' ___________', '|  _______  |', '| /  ___  \\ |', '| | ( o ) | |', '| \\_______/ |', '|___________|'].join('\n'),
  network: ['  ____________', ' /___________/|', '|o o o o  ===||', '|____________|/', '  ~~ 56k ~~'].join('\n'),
  tool: [' ._________.', ' | |_____| |', ' |  _____  |', ' | |     | |', ' | | 3.5"| |', ' |_|_____|_|'].join('\n'),
  furniture: ['   ______', '  |      |', '  |______|', ' ___|__|___', '     ||', '   _/  \\_'].join('\n'),
  gadget: ['  _______', ' | [___] |', ' | 1 2 3 |', ' | 4 5 6 |', ' | 7 8 9 |', ' |_______|'].join('\n'),
  vehicle: ['     _______', '  __/  |    \\__', ' |  _       _  |', " '-(_)-----(_)-'"].join('\n'),
  misc: ['   __________', '  /_________/|', ' | FRAGILE  ||', ' | THIS SIDE||', ' |____UP____|/'].join('\n'),
}

export const MONITOR_CRT = [' .---------.', ' | >_      |', ' |         |', ' |_________|', '    _|_|_'].join('\n')
export const MONITOR_FLAT = [' ____________', '| >_         |', '|            |', '|____________|', '     _||_'].join('\n')

/** A finished checkout, shown by the order dialog. */
export interface OrderReceipt {
  def: ItemDef
  price: number
  ok: boolean
  number: string
  /** Hardware that went straight into the rig. */
  installed: boolean
  balance: number
  shady: boolean
}
