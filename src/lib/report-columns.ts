// Report column definitions for the dynamic report builder

export type ColumnType = 'text' | 'select' | 'date' | 'number' | 'boolean'
export type ReportType = 'birds' | 'eggs' | 'health'

export interface ReportColumn {
  id: string
  label: string
  labelTl: string
  type: ColumnType
  filterable: boolean
  sortable: boolean
  options?: string[]
  relatedTable?: string
  dbColumn?: string // If different from id
  format?: 'date' | 'number' | 'percentage'
}

export interface ReportTypeConfig {
  id: ReportType
  label: string
  labelTl: string
  baseTable: string
  columns: ReportColumn[]
}

// Bird report columns
export const BIRD_REPORT_COLUMNS: ReportColumn[] = [
  {
    id: 'band_number',
    label: 'Band #',
    labelTl: 'Numero ng Band',
    type: 'text',
    filterable: true,
    sortable: true,
  },
  {
    id: 'wingband_color',
    label: 'Wingband Color',
    labelTl: 'Kulay ng Wingband',
    type: 'text',
    filterable: true,
    sortable: true,
  },
  {
    id: 'name',
    label: 'Name',
    labelTl: 'Pangalan',
    type: 'text',
    filterable: true,
    sortable: true,
  },
  {
    id: 'sex',
    label: 'Sex',
    labelTl: 'Kasarian',
    type: 'select',
    filterable: true,
    sortable: true,
    options: ['MALE', 'FEMALE', 'UNKNOWN'],
  },
  {
    id: 'status',
    label: 'Status',
    labelTl: 'Status',
    type: 'select',
    filterable: true,
    sortable: true,
    options: ['ACTIVE', 'SOLD', 'DECEASED', 'CULLED', 'LOST', 'BREEDING', 'RETIRED', 'ARCHIVED'],
  },
  {
    id: 'hatch_date',
    label: 'Hatch Date',
    labelTl: 'Petsa ng Pagpisa',
    type: 'date',
    filterable: true,
    sortable: true,
    format: 'date',
  },
  {
    id: 'color',
    label: 'Color',
    labelTl: 'Kulay',
    type: 'text',
    filterable: true,
    sortable: true,
  },
  {
    id: 'comb_type',
    label: 'Comb Type',
    labelTl: 'Uri ng Palong',
    type: 'select',
    filterable: true,
    sortable: true,
    options: ['SINGLE', 'PEA', 'ROSE', 'WALNUT', 'BUTTERCUP', 'V_SHAPED', 'CUSHION'],
  },
  {
    id: 'coop',
    label: 'Coop',
    labelTl: 'Kulungan',
    type: 'text',
    filterable: true,
    sortable: true,
    relatedTable: 'coops',
    dbColumn: 'coop_id',
  },
  {
    id: 'breed',
    label: 'Breed',
    labelTl: 'Breed',
    type: 'text',
    filterable: true,
    sortable: false,
  },
  {
    id: 'sire',
    label: 'Sire',
    labelTl: 'Ama',
    type: 'text',
    filterable: true,
    sortable: false,
    relatedTable: 'birds',
    dbColumn: 'sire_id',
  },
  {
    id: 'dam',
    label: 'Dam',
    labelTl: 'Ina',
    type: 'text',
    filterable: true,
    sortable: false,
    relatedTable: 'birds',
    dbColumn: 'dam_id',
  },
  {
    id: 'age',
    label: 'Age',
    labelTl: 'Edad',
    type: 'number',
    filterable: false,
    sortable: true,
  },
  {
    id: 'created_at',
    label: 'Date Added',
    labelTl: 'Petsa ng Pagdagdag',
    type: 'date',
    filterable: true,
    sortable: true,
    format: 'date',
  },
]

// Egg report columns
export const EGG_REPORT_COLUMNS: ReportColumn[] = [
  {
    id: 'bird_name',
    label: 'Bird',
    labelTl: 'Ibon',
    type: 'text',
    filterable: true,
    sortable: true,
  },
  {
    id: 'date',
    label: 'Date',
    labelTl: 'Petsa',
    type: 'date',
    filterable: true,
    sortable: true,
    format: 'date',
  },
  {
    id: 'egg_mark',
    label: 'Egg Mark',
    labelTl: 'Marka ng Itlog',
    type: 'text',
    filterable: true,
    sortable: true,
  },
  {
    id: 'weight_grams',
    label: 'Weight (g)',
    labelTl: 'Timbang (g)',
    type: 'number',
    filterable: false,
    sortable: true,
    format: 'number',
  },
  {
    id: 'shell_quality',
    label: 'Shell Quality',
    labelTl: 'Kalidad ng Balat',
    type: 'select',
    filterable: true,
    sortable: true,
    options: ['GOOD', 'FAIR', 'POOR', 'SOFT'],
  },
  {
    id: 'notes',
    label: 'Notes',
    labelTl: 'Mga Tala',
    type: 'text',
    filterable: false,
    sortable: false,
  },
]

// Health report columns
export const HEALTH_REPORT_COLUMNS: ReportColumn[] = [
  {
    id: 'bird_name',
    label: 'Bird',
    labelTl: 'Ibon',
    type: 'text',
    filterable: true,
    sortable: true,
  },
  {
    id: 'date_noticed',
    label: 'Date Noticed',
    labelTl: 'Petsa ng Napansin',
    type: 'date',
    filterable: true,
    sortable: true,
    format: 'date',
  },
  {
    id: 'symptoms',
    label: 'Symptoms',
    labelTl: 'Mga Sintomas',
    type: 'text',
    filterable: true,
    sortable: false,
  },
  {
    id: 'diagnosis',
    label: 'Diagnosis',
    labelTl: 'Diagnosis',
    type: 'text',
    filterable: true,
    sortable: false,
  },
  {
    id: 'treatment',
    label: 'Treatment',
    labelTl: 'Gamot',
    type: 'text',
    filterable: true,
    sortable: false,
  },
  {
    id: 'outcome',
    label: 'Outcome',
    labelTl: 'Resulta',
    type: 'select',
    filterable: true,
    sortable: true,
    options: ['RECOVERED', 'ONGOING', 'DECEASED'],
  },
  {
    id: 'notes',
    label: 'Notes',
    labelTl: 'Mga Tala',
    type: 'text',
    filterable: false,
    sortable: false,
  },
]

// Report type configurations
export const REPORT_TYPES: ReportTypeConfig[] = [
  {
    id: 'birds',
    label: 'Birds',
    labelTl: 'Mga Ibon',
    baseTable: 'birds',
    columns: BIRD_REPORT_COLUMNS,
  },
  {
    id: 'eggs',
    label: 'Eggs',
    labelTl: 'Mga Itlog',
    baseTable: 'egg_records',
    columns: EGG_REPORT_COLUMNS,
  },
  {
    id: 'health',
    label: 'Health',
    labelTl: 'Kalusugan',
    baseTable: 'health_incidents',
    columns: HEALTH_REPORT_COLUMNS,
  },
]

// Get columns for a specific report type
export function getReportColumns(reportType: ReportType): ReportColumn[] {
  const config = REPORT_TYPES.find((rt) => rt.id === reportType)
  return config?.columns || []
}

// Get filterable columns for a report type
export function getFilterableColumns(reportType: ReportType): ReportColumn[] {
  return getReportColumns(reportType).filter((col) => col.filterable)
}

// Get sortable columns for a report type
export function getSortableColumns(reportType: ReportType): ReportColumn[] {
  return getReportColumns(reportType).filter((col) => col.sortable)
}

// Default columns to show for each report type
export const DEFAULT_COLUMNS: Record<ReportType, string[]> = {
  birds: ['band_number', 'wingband_color', 'name', 'sex', 'status', 'hatch_date', 'coop'],
  eggs: ['bird_name', 'date', 'egg_mark', 'weight_grams', 'shell_quality'],
  health: ['bird_name', 'date_noticed', 'symptoms', 'outcome'],
}

// Sex display labels
export const SEX_LABELS: Record<string, { en: string; tl: string }> = {
  MALE: { en: 'Stag', tl: 'Tandang' },
  FEMALE: { en: 'Hen', tl: 'Inahin' },
  UNKNOWN: { en: 'Unknown', tl: 'Hindi Alam' },
}

// Status display labels
export const STATUS_LABELS: Record<string, { en: string; tl: string }> = {
  ACTIVE: { en: 'Active', tl: 'Aktibo' },
  BREEDING: { en: 'Breeding', tl: 'Nag-aanak' },
  SOLD: { en: 'Sold', tl: 'Nabenta' },
  DECEASED: { en: 'Deceased', tl: 'Patay' },
  CULLED: { en: 'Culled', tl: 'Inalis' },
  LOST: { en: 'Lost', tl: 'Nawawala' },
  RETIRED: { en: 'Retired', tl: 'Retirado' },
  ARCHIVED: { en: 'Archived', tl: 'Naka-archive' },
}

// Shell quality labels
export const SHELL_QUALITY_LABELS: Record<string, { en: string; tl: string }> = {
  GOOD: { en: 'Good', tl: 'Mabuti' },
  FAIR: { en: 'Fair', tl: 'Katamtaman' },
  POOR: { en: 'Poor', tl: 'Mahina' },
  SOFT: { en: 'Soft', tl: 'Malambot' },
}

// Health outcome labels
export const HEALTH_OUTCOME_LABELS: Record<string, { en: string; tl: string }> = {
  RECOVERED: { en: 'Recovered', tl: 'Gumaling' },
  ONGOING: { en: 'Ongoing', tl: 'Nagpapatuloy' },
  DECEASED: { en: 'Deceased', tl: 'Patay' },
}

// Comb type labels
export const COMB_TYPE_LABELS: Record<string, { en: string; tl: string }> = {
  SINGLE: { en: 'Single', tl: 'Isahan' },
  PEA: { en: 'Pea', tl: 'Pea' },
  ROSE: { en: 'Rose', tl: 'Rose' },
  WALNUT: { en: 'Walnut', tl: 'Walnut' },
  BUTTERCUP: { en: 'Buttercup', tl: 'Buttercup' },
  V_SHAPED: { en: 'V-Shaped', tl: 'Hugis V' },
  CUSHION: { en: 'Cushion', tl: 'Cushion' },
}
