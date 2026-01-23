// Common chicken plumage colors
export interface ChickenColor {
  id: string
  name: string
  nameTl: string // Tagalog name
  hexCode: string // Approximate color for display
}

export const CHICKEN_COLORS: ChickenColor[] = [
  // Solid Colors
  { id: "white", name: "White", nameTl: "Puti", hexCode: "#FFFFFF" },
  { id: "black", name: "Black", nameTl: "Itim", hexCode: "#1a1a1a" },
  { id: "blue", name: "Blue", nameTl: "Asul", hexCode: "#4a6fa5" },
  { id: "splash", name: "Splash", nameTl: "Splash", hexCode: "#b8c9dc" },
  { id: "buff", name: "Buff", nameTl: "Buff", hexCode: "#d4a574" },
  { id: "red", name: "Red", nameTl: "Pula", hexCode: "#8b2500" },
  { id: "wheaten", name: "Wheaten", nameTl: "Wheaten", hexCode: "#c9a86c" },

  // Pattern Colors
  { id: "barred", name: "Barred", nameTl: "May guhit", hexCode: "#4a4a4a" },
  { id: "cuckoo", name: "Cuckoo", nameTl: "Cuckoo", hexCode: "#5c5c5c" },
  { id: "laced", name: "Laced", nameTl: "Laced", hexCode: "#8b7355" },
  { id: "spangled", name: "Spangled", nameTl: "Spangled", hexCode: "#654321" },
  { id: "mottled", name: "Mottled", nameTl: "Mottled", hexCode: "#3d3d3d" },
  { id: "penciled", name: "Penciled", nameTl: "Penciled", hexCode: "#6b5344" },

  // Game Bird Colors (Sabong)
  { id: "kelso", name: "Kelso (Yellow-Red)", nameTl: "Kelso", hexCode: "#b8860b" },
  { id: "hatch", name: "Hatch (Red)", nameTl: "Hatch", hexCode: "#8b0000" },
  { id: "sweater", name: "Sweater (Yellow-Leg)", nameTl: "Sweater", hexCode: "#cd853f" },
  { id: "roundhead", name: "Roundhead", nameTl: "Roundhead", hexCode: "#a0522d" },
  { id: "grey", name: "Grey", nameTl: "Grey/Abu", hexCode: "#808080" },
  { id: "brown-red", name: "Brown Red", nameTl: "Brown Red", hexCode: "#5c3317" },
  { id: "dom", name: "Dom/Dominique", nameTl: "Dom", hexCode: "#696969" },
  { id: "pyle", name: "Pyle", nameTl: "Pyle", hexCode: "#f5deb3" },

  // Other Common Colors
  { id: "silver", name: "Silver", nameTl: "Pilak", hexCode: "#c0c0c0" },
  { id: "golden", name: "Golden", nameTl: "Ginto", hexCode: "#daa520" },
  { id: "partridge", name: "Partridge", nameTl: "Partridge", hexCode: "#6b4423" },
  { id: "columbian", name: "Columbian", nameTl: "Columbian", hexCode: "#f5f5dc" },
  { id: "light-brown", name: "Light Brown", nameTl: "Maputlang Kayumanggi", hexCode: "#c4a35a" },
  { id: "dark-brown", name: "Dark Brown", nameTl: "Maitim na Kayumanggi", hexCode: "#5c4033" },
  { id: "mahogany", name: "Mahogany", nameTl: "Mahogany", hexCode: "#c04000" },
  { id: "chocolate", name: "Chocolate", nameTl: "Tsokolate", hexCode: "#3d1c02" },
  { id: "lavender", name: "Lavender", nameTl: "Lavender", hexCode: "#b8a9c9" },
  { id: "birchen", name: "Birchen", nameTl: "Birchen", hexCode: "#2f2f2f" },
  { id: "duckwing", name: "Duckwing", nameTl: "Duckwing", hexCode: "#8b8378" },
  { id: "crele", name: "Crele", nameTl: "Crele", hexCode: "#6e5c3b" },
  { id: "bb-red", name: "BB Red", nameTl: "BB Red", hexCode: "#722f37" },
  { id: "ginger", name: "Ginger", nameTl: "Ginger", hexCode: "#b06500" },
]

// Get a color by ID
export function getColorById(id: string): ChickenColor | undefined {
  return CHICKEN_COLORS.find((c) => c.id === id)
}

// Get color name by ID (with fallback)
export function getColorName(id: string, language: "en" | "tl" = "en"): string {
  const color = getColorById(id)
  if (!color) return id
  return language === "tl" ? color.nameTl : color.name
}
