// Bird inventory table column configuration

import { ReactNode } from "react"

export interface BirdColumnDef {
  id: string
  labelKey: string // Translation key
  width: number // Min width in pixels
  minWidth?: number
  sticky?: boolean // For checkbox, photo, ID columns
  sortable?: boolean
  mobilePriority: number // Lower = shown first, -1 = hidden on mobile
  defaultVisible: boolean
  align?: "left" | "center" | "right"
}

export const BIRD_COLUMNS: BirdColumnDef[] = [
  {
    id: "select",
    labelKey: "inventory.select",
    width: 48,
    minWidth: 48,
    sticky: true,
    sortable: false,
    mobilePriority: 1,
    defaultVisible: true,
    align: "center",
  },
  {
    id: "photo",
    labelKey: "inventory.photo",
    width: 56,
    minWidth: 56,
    sticky: true,
    sortable: false,
    mobilePriority: 2,
    defaultVisible: true,
    align: "center",
  },
  {
    id: "identifier",
    labelKey: "inventory.idBand",
    width: 140,
    minWidth: 100,
    sticky: true,
    sortable: true,
    mobilePriority: 3,
    defaultVisible: true,
    align: "left",
  },
  {
    id: "name",
    labelKey: "bird.name",
    width: 140,
    minWidth: 100,
    sortable: true,
    mobilePriority: 10,
    defaultVisible: true,
    align: "left",
  },
  {
    id: "sex",
    labelKey: "bird.sex",
    width: 80,
    minWidth: 70,
    sortable: true,
    mobilePriority: 4,
    defaultVisible: true,
    align: "center",
  },
  {
    id: "status",
    labelKey: "bird.status",
    width: 100,
    minWidth: 80,
    sortable: true,
    mobilePriority: 5,
    defaultVisible: true,
    align: "center",
  },
  {
    id: "age",
    labelKey: "bird.age",
    width: 100,
    minWidth: 80,
    sortable: true,
    mobilePriority: 6,
    defaultVisible: true,
    align: "left",
  },
  {
    id: "coop",
    labelKey: "bird.coop",
    width: 120,
    minWidth: 100,
    sortable: true,
    mobilePriority: 7,
    defaultVisible: true,
    align: "left",
  },
  {
    id: "breed",
    labelKey: "bird.breed",
    width: 140,
    minWidth: 100,
    sortable: true,
    mobilePriority: 8,
    defaultVisible: true,
    align: "left",
  },
  {
    id: "color",
    labelKey: "inventory.color",
    width: 100,
    minWidth: 80,
    sortable: true,
    mobilePriority: -1,
    defaultVisible: false,
    align: "left",
  },
  {
    id: "sire",
    labelKey: "bird.father",
    width: 140,
    minWidth: 100,
    sortable: true,
    mobilePriority: -1,
    defaultVisible: false,
    align: "left",
  },
  {
    id: "dam",
    labelKey: "bird.mother",
    width: 140,
    minWidth: 100,
    sortable: true,
    mobilePriority: -1,
    defaultVisible: false,
    align: "left",
  },
  {
    id: "fightRecord",
    labelKey: "inventory.fightRecord",
    width: 100,
    minWidth: 80,
    sortable: true,
    mobilePriority: -1,
    defaultVisible: false,
    align: "center",
  },
  {
    id: "offspringCount",
    labelKey: "inventory.offspringCount",
    width: 100,
    minWidth: 80,
    sortable: true,
    mobilePriority: -1,
    defaultVisible: false,
    align: "center",
  },
  {
    id: "notes",
    labelKey: "inventory.notes",
    width: 60,
    minWidth: 60,
    sortable: false,
    mobilePriority: -1,
    defaultVisible: false,
    align: "center",
  },
]

// Get the default visible column IDs
export const DEFAULT_VISIBLE_COLUMNS = BIRD_COLUMNS
  .filter((col) => col.defaultVisible)
  .map((col) => col.id)

// Get columns that can be toggled (excluding checkbox)
export const TOGGLEABLE_COLUMNS = BIRD_COLUMNS.filter(
  (col) => col.id !== "select"
)

// Get sticky columns
export const STICKY_COLUMNS = BIRD_COLUMNS.filter((col) => col.sticky)

// Type for sort direction
export type SortDirection = "asc" | "desc" | null

// Type for sort state
export interface SortState {
  column: string | null
  direction: SortDirection
}

// Extended bird record type for the inventory table
export interface BirdInventoryRecord {
  id: string
  name: string | null
  sex: string
  status: string
  hatchDate: string
  color: string | null
  coopId: string | null
  coop: { id: string; name: string } | null
  identifiers: Array<{ idType: string; idValue: string }>
  breedComposition: Array<{ breedId: string; percentage: number }> | null
  notes: string | null
  sire: { id: string; identifiers: Array<{ idValue: string }> } | null
  dam: { id: string; identifiers: Array<{ idValue: string }> } | null
  photos: Array<{ url: string }> | null
  fightRecord?: { wins: number; losses: number; draws: number }
  offspringCount?: number
}

// Utility to get display ID for a bird
export function getDisplayId(bird: BirdInventoryRecord): string {
  return bird.identifiers[0]?.idValue || bird.name || bird.id.slice(-6)
}

// Utility to calculate age in days
export function calculateAgeInDays(hatchDate: string): number {
  return Math.floor(
    (Date.now() - new Date(hatchDate).getTime()) / (1000 * 60 * 60 * 24)
  )
}
