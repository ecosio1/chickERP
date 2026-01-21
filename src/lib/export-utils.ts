// CSV export utilities for ChickERP

/**
 * Escapes a field value for CSV format
 * Handles commas, quotes, and newlines
 */
function escapeField(field: string | number | null | undefined): string {
  if (field === null || field === undefined) {
    return ""
  }
  const str = String(field)
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/**
 * Generates a CSV string from headers and rows
 */
export function generateCSV(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const headerLine = headers.map(escapeField).join(",")
  const dataLines = rows.map((row) => row.map(escapeField).join(","))
  return [headerLine, ...dataLines].join("\r\n")
}

/**
 * Creates a CSV Response with proper headers for file download
 */
export function createCSVResponse(csvContent: string, filename: string): Response {
  return new Response(csvContent, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}.csv"`,
    },
  })
}

/**
 * Format a date to YYYY-MM-DD string
 */
export function formatDateForCSV(date: Date | string | null | undefined): string {
  if (!date) return ""
  const d = typeof date === "string" ? new Date(date) : date
  return d.toISOString().split("T")[0]
}

/**
 * Get bird display name from bird object with identifiers
 */
export function getBirdDisplayName(bird: {
  name: string | null
  identifiers?: Array<{ idType: string; idValue: string }>
} | null): string {
  if (!bird) return ""
  if (bird.name) return bird.name
  if (bird.identifiers && bird.identifiers.length > 0) {
    return bird.identifiers[0].idValue
  }
  return ""
}

// Export type definitions
export type ExportType = "birds" | "weights" | "eggs" | "vaccinations" | "health-incidents" | "fights"

// Template definitions for import templates
export const EXPORT_TEMPLATES = {
  birds: {
    headers: ["name", "sex", "hatch_date", "status", "coop", "sire", "dam", "band_number", "color", "comb_type", "early_life_notes"],
    example: ["Rooster 1", "MALE", "2024-01-15", "ACTIVE", "Coop A", "Father Bird", "Mother Bird", "BAND001", "Red", "SINGLE", "Healthy chick"],
    description: {
      en: "Import template for birds",
      tl: "Template para sa pag-import ng mga ibon",
    },
  },
  weights: {
    headers: ["bird_name", "date", "weight_grams", "milestone", "notes"],
    example: ["Rooster 1", "2024-01-15", "2500", "ADULT", "Weekly weigh-in"],
    description: {
      en: "Import template for weight records",
      tl: "Template para sa mga tala ng timbang",
    },
  },
  eggs: {
    headers: ["bird_name", "date", "egg_mark", "weight_grams", "shell_quality", "notes"],
    example: ["Hen 1", "2024-01-15", "EGG001", "55", "GOOD", "Morning collection"],
    description: {
      en: "Import template for egg records",
      tl: "Template para sa mga tala ng itlog",
    },
  },
  vaccinations: {
    headers: ["bird_name", "vaccine_name", "date_given", "next_due_date", "dosage", "method", "notes"],
    example: ["Rooster 1", "Newcastle Disease", "2024-01-15", "2024-07-15", "0.5ml", "Injection", "First dose"],
    description: {
      en: "Import template for vaccination records",
      tl: "Template para sa mga tala ng bakuna",
    },
  },
} as const
