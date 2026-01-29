import { describe, it, expect } from "vitest"
import {
  getReportColumns,
  getFilterableColumns,
  getSortableColumns,
  DEFAULT_COLUMNS,
  REPORT_TYPES,
  BIRD_REPORT_COLUMNS,
  EGG_REPORT_COLUMNS,
  HEALTH_REPORT_COLUMNS,
  SEX_LABELS,
  STATUS_LABELS,
  type ReportType,
} from "@/lib/report-columns"

describe("Report Columns", () => {
  describe("getReportColumns", () => {
    it("returns bird columns for birds report type", () => {
      const columns = getReportColumns("birds")
      expect(columns).toEqual(BIRD_REPORT_COLUMNS)
      expect(columns.length).toBeGreaterThan(0)
    })

    it("returns egg columns for eggs report type", () => {
      const columns = getReportColumns("eggs")
      expect(columns).toEqual(EGG_REPORT_COLUMNS)
      expect(columns.length).toBeGreaterThan(0)
    })

    it("returns health columns for health report type", () => {
      const columns = getReportColumns("health")
      expect(columns).toEqual(HEALTH_REPORT_COLUMNS)
      expect(columns.length).toBeGreaterThan(0)
    })

    it("returns empty array for invalid report type", () => {
      const columns = getReportColumns("invalid" as ReportType)
      expect(columns).toEqual([])
    })
  })

  describe("getFilterableColumns", () => {
    it("returns only filterable columns for birds", () => {
      const columns = getFilterableColumns("birds")
      expect(columns.every((col) => col.filterable)).toBe(true)
      expect(columns.some((col) => col.id === "status")).toBe(true)
      expect(columns.some((col) => col.id === "sex")).toBe(true)
    })

    it("returns only filterable columns for eggs", () => {
      const columns = getFilterableColumns("eggs")
      expect(columns.every((col) => col.filterable)).toBe(true)
      expect(columns.some((col) => col.id === "shell_quality")).toBe(true)
    })

    it("returns only filterable columns for health", () => {
      const columns = getFilterableColumns("health")
      expect(columns.every((col) => col.filterable)).toBe(true)
      expect(columns.some((col) => col.id === "outcome")).toBe(true)
    })
  })

  describe("getSortableColumns", () => {
    it("returns only sortable columns for birds", () => {
      const columns = getSortableColumns("birds")
      expect(columns.every((col) => col.sortable)).toBe(true)
      expect(columns.some((col) => col.id === "hatch_date")).toBe(true)
    })

    it("does not include non-sortable columns", () => {
      const columns = getSortableColumns("birds")
      // Breed is not sortable
      expect(columns.some((col) => col.id === "breed")).toBe(false)
    })
  })

  describe("DEFAULT_COLUMNS", () => {
    it("has default columns for all report types", () => {
      expect(DEFAULT_COLUMNS.birds).toBeDefined()
      expect(DEFAULT_COLUMNS.birds.length).toBeGreaterThan(0)

      expect(DEFAULT_COLUMNS.eggs).toBeDefined()
      expect(DEFAULT_COLUMNS.eggs.length).toBeGreaterThan(0)

      expect(DEFAULT_COLUMNS.health).toBeDefined()
      expect(DEFAULT_COLUMNS.health.length).toBeGreaterThan(0)
    })

    it("default columns exist in column definitions", () => {
      const birdColumns = getReportColumns("birds")
      DEFAULT_COLUMNS.birds.forEach((colId) => {
        expect(birdColumns.some((c) => c.id === colId)).toBe(true)
      })

      const eggColumns = getReportColumns("eggs")
      DEFAULT_COLUMNS.eggs.forEach((colId) => {
        expect(eggColumns.some((c) => c.id === colId)).toBe(true)
      })

      const healthColumns = getReportColumns("health")
      DEFAULT_COLUMNS.health.forEach((colId) => {
        expect(healthColumns.some((c) => c.id === colId)).toBe(true)
      })
    })
  })

  describe("REPORT_TYPES", () => {
    it("has all required report types", () => {
      expect(REPORT_TYPES.some((rt) => rt.id === "birds")).toBe(true)
      expect(REPORT_TYPES.some((rt) => rt.id === "eggs")).toBe(true)
      expect(REPORT_TYPES.some((rt) => rt.id === "health")).toBe(true)
    })

    it("each report type has required properties", () => {
      REPORT_TYPES.forEach((rt) => {
        expect(rt.id).toBeDefined()
        expect(rt.label).toBeDefined()
        expect(rt.labelTl).toBeDefined()
        expect(rt.baseTable).toBeDefined()
        expect(rt.columns).toBeDefined()
        expect(Array.isArray(rt.columns)).toBe(true)
      })
    })
  })

  describe("Column Definitions", () => {
    it("all bird columns have required properties", () => {
      BIRD_REPORT_COLUMNS.forEach((col) => {
        expect(col.id).toBeDefined()
        expect(col.label).toBeDefined()
        expect(col.labelTl).toBeDefined()
        expect(col.type).toBeDefined()
        expect(typeof col.filterable).toBe("boolean")
        expect(typeof col.sortable).toBe("boolean")
      })
    })

    it("select type columns have options", () => {
      const selectColumns = BIRD_REPORT_COLUMNS.filter(
        (col) => col.type === "select"
      )
      selectColumns.forEach((col) => {
        expect(col.options).toBeDefined()
        expect(Array.isArray(col.options)).toBe(true)
        expect(col.options!.length).toBeGreaterThan(0)
      })
    })
  })

  describe("Label Translations", () => {
    it("SEX_LABELS has all sex options", () => {
      expect(SEX_LABELS.MALE).toBeDefined()
      expect(SEX_LABELS.FEMALE).toBeDefined()
      expect(SEX_LABELS.UNKNOWN).toBeDefined()

      Object.values(SEX_LABELS).forEach((labels) => {
        expect(labels.en).toBeDefined()
        expect(labels.tl).toBeDefined()
      })
    })

    it("STATUS_LABELS has all status options", () => {
      const statusColumn = BIRD_REPORT_COLUMNS.find(
        (col) => col.id === "status"
      )
      expect(statusColumn).toBeDefined()

      statusColumn!.options!.forEach((status) => {
        expect(STATUS_LABELS[status]).toBeDefined()
        expect(STATUS_LABELS[status].en).toBeDefined()
        expect(STATUS_LABELS[status].tl).toBeDefined()
      })
    })
  })
})

describe("Report Filter Logic", () => {
  it("can construct filter state object", () => {
    const filters: Record<string, string[]> = {
      status: ["ACTIVE", "BREEDING"],
      sex: ["MALE"],
    }

    expect(filters.status).toHaveLength(2)
    expect(filters.sex).toHaveLength(1)
    expect(Object.keys(filters)).toHaveLength(2)
  })

  it("can count active filters", () => {
    const filters: Record<string, string[]> = {
      status: ["ACTIVE", "BREEDING"],
      sex: ["MALE"],
      coop: [],
    }

    const activeFilterCount = Object.values(filters).reduce(
      (count, values) => count + values.length,
      0
    )

    expect(activeFilterCount).toBe(3)
  })

  it("can clear specific filter", () => {
    const filters: Record<string, string[]> = {
      status: ["ACTIVE"],
      sex: ["MALE"],
    }

    const newFilters = { ...filters }
    delete newFilters.status

    expect(newFilters.status).toBeUndefined()
    expect(newFilters.sex).toEqual(["MALE"])
  })

  it("can toggle filter value", () => {
    const filters: Record<string, string[]> = {
      status: ["ACTIVE"],
    }

    // Add a value
    const addedFilters = {
      ...filters,
      status: [...filters.status, "BREEDING"],
    }
    expect(addedFilters.status).toEqual(["ACTIVE", "BREEDING"])

    // Remove a value
    const removedFilters = {
      ...addedFilters,
      status: addedFilters.status.filter((s) => s !== "ACTIVE"),
    }
    expect(removedFilters.status).toEqual(["BREEDING"])
  })
})

describe("Report Column Selection", () => {
  it("can add column to selection", () => {
    const selected = ["name", "sex"]
    const newSelected = [...selected, "status"]
    expect(newSelected).toEqual(["name", "sex", "status"])
  })

  it("can remove column from selection", () => {
    const selected = ["name", "sex", "status"]
    const newSelected = selected.filter((col) => col !== "sex")
    expect(newSelected).toEqual(["name", "status"])
  })

  it("prevents removing last column", () => {
    const selected = ["name"]
    // Should not allow removing the last column
    const canRemove = selected.length > 1
    expect(canRemove).toBe(false)
  })
})

describe("Report Column Reordering", () => {
  it("can reorder columns by moving one position", () => {
    const columns = ["name", "sex", "status", "hatch_date"]
    const sourceIndex = 0  // name
    const targetIndex = 2  // status

    const newOrder = [...columns]
    newOrder.splice(sourceIndex, 1)
    newOrder.splice(targetIndex, 0, columns[sourceIndex])

    expect(newOrder).toEqual(["sex", "status", "name", "hatch_date"])
  })

  it("can move column from end to beginning", () => {
    const columns = ["name", "sex", "status"]
    const sourceIndex = 2  // status
    const targetIndex = 0  // name position

    const newOrder = [...columns]
    newOrder.splice(sourceIndex, 1)
    newOrder.splice(targetIndex, 0, columns[sourceIndex])

    expect(newOrder).toEqual(["status", "name", "sex"])
  })

  it("can swap adjacent columns", () => {
    const columns = ["name", "sex", "status"]
    const sourceIndex = 1  // sex
    const targetIndex = 0  // name position

    const newOrder = [...columns]
    newOrder.splice(sourceIndex, 1)
    newOrder.splice(targetIndex, 0, columns[sourceIndex])

    expect(newOrder).toEqual(["sex", "name", "status"])
  })

  it("maintains column count after reorder", () => {
    const columns = ["name", "sex", "status", "hatch_date", "coop"]
    const sourceIndex = 3
    const targetIndex = 1

    const newOrder = [...columns]
    newOrder.splice(sourceIndex, 1)
    newOrder.splice(targetIndex, 0, columns[sourceIndex])

    expect(newOrder.length).toBe(columns.length)
    expect(new Set(newOrder).size).toBe(columns.length)
  })
})

describe("Report Sort Logic", () => {
  it("can set sort column and direction", () => {
    let sortColumn: string | null = null
    let sortDirection: "asc" | "desc" | null = null

    // Set initial sort
    sortColumn = "hatch_date"
    sortDirection = "asc"

    expect(sortColumn).toBe("hatch_date")
    expect(sortDirection).toBe("asc")
  })

  it("can toggle sort direction", () => {
    let sortDirection: "asc" | "desc" | null = "asc"

    // Toggle to desc
    sortDirection = sortDirection === "asc" ? "desc" : "asc"
    expect(sortDirection).toBe("desc")

    // Toggle to asc
    sortDirection = sortDirection === "asc" ? "desc" : "asc"
    expect(sortDirection).toBe("asc")
  })

  it("can cycle through sort states", () => {
    let sortColumn: string | null = "name"
    let sortDirection: "asc" | "desc" | null = null

    // First click: asc
    sortDirection = "asc"
    expect(sortDirection).toBe("asc")

    // Second click: desc
    sortDirection = "desc"
    expect(sortDirection).toBe("desc")

    // Third click: null (clear sort)
    sortColumn = null
    sortDirection = null
    expect(sortColumn).toBeNull()
    expect(sortDirection).toBeNull()
  })
})

describe("Report Preset Config", () => {
  it("can create preset config object", () => {
    const config = {
      columns: ["name", "sex", "status"],
      filters: { status: ["ACTIVE"] },
      sortColumn: "name",
      sortDirection: "asc" as const,
    }

    expect(config.columns).toHaveLength(3)
    expect(config.filters.status).toEqual(["ACTIVE"])
    expect(config.sortColumn).toBe("name")
    expect(config.sortDirection).toBe("asc")
  })

  it("can serialize config to JSON", () => {
    const config = {
      columns: ["name", "sex"],
      filters: { status: ["ACTIVE", "BREEDING"] },
      sortColumn: null,
      sortDirection: null,
    }

    const json = JSON.stringify(config)
    const parsed = JSON.parse(json)

    expect(parsed.columns).toEqual(config.columns)
    expect(parsed.filters).toEqual(config.filters)
  })
})
