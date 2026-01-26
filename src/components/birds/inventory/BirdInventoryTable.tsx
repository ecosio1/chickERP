"use client"

import { useEffect, useState, useCallback, useMemo, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Bird, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useLanguage } from "@/hooks/use-language"
import { useColumnPreferences } from "@/hooks/use-column-preferences"
import { useBirdSelection } from "@/hooks/use-bird-selection"
import { BirdInventoryRecord, SortState } from "@/lib/bird-columns"
import { BirdFilterSheet, FilterState } from "@/components/birds/BirdFilterSheet"
import { InventoryToolbar } from "./InventoryToolbar"
import { BirdDataTable } from "./BirdDataTable"
import { BirdMobileList } from "./BirdMobileList"
import { BulkActionBar } from "./BulkActionBar"
import { ColumnCustomizer } from "./ColumnCustomizer"

interface Breed {
  id: string
  name: string
  code: string
}

interface SourceFarm {
  id: string
  name: string
}

interface Coop {
  id: string
  name: string
}

const initialFilters: FilterState = {
  status: [],
  sex: [],
  breedIds: [],
  colors: [],
  sourceFarmIds: [],
  ageRange: null,
}

export function BirdInventoryTable() {
  const { t } = useLanguage()
  const searchParams = useSearchParams()
  const autoFocusSearch = searchParams.get("search") === "true"

  // Data state
  const [birds, setBirds] = useState<BirdInventoryRecord[]>([])
  const [breeds, setBreeds] = useState<Breed[]>([])
  const [sourceFarms, setSourceFarms] = useState<SourceFarm[]>([])
  const [coops, setCoops] = useState<Coop[]>([])
  const [loading, setLoading] = useState(true)

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [filters, setFilters] = useState<FilterState>(initialFilters)
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Sort state
  const [sortState, setSortState] = useState<SortState>({
    column: null,
    direction: null,
  })

  // Column preferences
  const {
    visibleColumns,
    toggleColumn,
    resetToDefault,
  } = useColumnPreferences()

  // Selection state
  const birdIds = useMemo(() => birds.map((b) => b.id), [birds])
  const {
    selectedIds,
    selectedCount,
    selectionState,
    isSelectionMode,
    toggleSelection,
    toggleSelectAll,
    clearSelection,
    enterSelectionMode,
    exitSelectionMode,
  } = useBirdSelection({ birdIds })

  // Responsive state
  const [isMobile, setIsMobile] = useState(false)

  // Check viewport size
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Active filter count
  const activeFilterCount =
    filters.status.length +
    filters.sex.length +
    filters.breedIds.length +
    filters.colors.length +
    filters.sourceFarmIds.length +
    (filters.ageRange ? 1 : 0)

  // Fetch filter options
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [breedsRes, farmsRes, coopsRes] = await Promise.all([
          fetch("/api/breeds"),
          fetch("/api/settings/source-farms"),
          fetch("/api/coops"),
        ])
        if (breedsRes.ok) {
          const data = await breedsRes.json()
          setBreeds(data || [])
        }
        if (farmsRes.ok) {
          const data = await farmsRes.json()
          setSourceFarms(data.farms || [])
        }
        if (coopsRes.ok) {
          const data = await coopsRes.json()
          setCoops(data.coops || [])
        }
      } catch (error) {
        console.error("Failed to fetch filter options:", error)
      }
    }
    fetchFilterOptions()
  }, [])

  // Fetch birds
  const fetchBirds = useCallback(async (query?: string) => {
    console.log("[BirdInventory] fetchBirds called with query:", query)
    setLoading(true)
    try {
      const params = new URLSearchParams()

      if (query && query.length >= 1) params.set("search", query)
      if (filters.status.length === 1) params.set("status", filters.status[0])
      if (filters.sex.length === 1) params.set("sex", filters.sex[0])
      if (filters.colors.length > 0) params.set("color", filters.colors[0])
      if (filters.breedIds.length > 0) params.set("breedId", filters.breedIds[0])
      if (filters.sourceFarmIds.length > 0) params.set("sourceFarmId", filters.sourceFarmIds[0])
      if (filters.ageRange) {
        if (filters.ageRange.min !== undefined) params.set("ageMin", filters.ageRange.min.toString())
        if (filters.ageRange.max !== undefined) params.set("ageMax", filters.ageRange.max.toString())
      }

      console.log("[BirdInventory] Fetching from:", `/api/birds?${params}`)
      const res = await fetch(`/api/birds?${params}`)
      console.log("[BirdInventory] Response status:", res.status)

      if (res.ok) {
        const json = await res.json()
        console.log("[BirdInventory] API response:", { total: json.total, birdCount: json.birds?.length })
        let filteredBirds = json.birds || []

        // Client-side filtering for multiple selections
        if (filters.status.length > 1) {
          filteredBirds = filteredBirds.filter((b: BirdInventoryRecord) =>
            filters.status.includes(b.status)
          )
        }
        if (filters.sex.length > 1) {
          filteredBirds = filteredBirds.filter((b: BirdInventoryRecord) =>
            filters.sex.includes(b.sex)
          )
        }
        if (filters.colors.length > 1) {
          filteredBirds = filteredBirds.filter(
            (b: BirdInventoryRecord) => b.color && filters.colors.includes(b.color)
          )
        }

        console.log("[BirdInventory] Setting birds state, count:", filteredBirds.length)
        setBirds(filteredBirds)
      } else {
        const errorText = await res.text()
        console.error("[BirdInventory] API error:", res.status, errorText)
      }
    } catch (error) {
      console.error("[BirdInventory] Failed to fetch birds:", error)
    } finally {
      setLoading(false)
      setIsSearching(false)
    }
  }, [filters])

  // Initial fetch on mount
  useEffect(() => {
    console.log("[BirdInventory] Component mounted, starting initial fetch")
    fetchBirds("")
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch on filter change
  useEffect(() => {
    fetchBirds(searchQuery)
  }, [filters]) // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setIsSearching(true)

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      fetchBirds(value)
    }, 200)
  }

  const handleClearSearch = () => {
    setSearchQuery("")
    fetchBirds("")
  }

  // Sorting
  const handleSort = (column: string) => {
    setSortState((prev) => {
      if (prev.column === column) {
        if (prev.direction === "asc") return { column, direction: "desc" }
        if (prev.direction === "desc") return { column: null, direction: null }
      }
      return { column, direction: "asc" }
    })
  }

  // Sort birds client-side
  const sortedBirds = useMemo(() => {
    if (!sortState.column || !sortState.direction) return birds

    return [...birds].sort((a, b) => {
      const direction = sortState.direction === "asc" ? 1 : -1
      const column = sortState.column

      switch (column) {
        case "identifier":
          const idA = a.identifiers[0]?.idValue || a.name || ""
          const idB = b.identifiers[0]?.idValue || b.name || ""
          return idA.localeCompare(idB) * direction

        case "name":
          return (a.name || "").localeCompare(b.name || "") * direction

        case "sex":
          return a.sex.localeCompare(b.sex) * direction

        case "status":
          return a.status.localeCompare(b.status) * direction

        case "age":
          const ageA = new Date(a.hatchDate).getTime()
          const ageB = new Date(b.hatchDate).getTime()
          return (ageA - ageB) * direction

        case "coop":
          return (a.coop?.name || "").localeCompare(b.coop?.name || "") * direction

        case "breed":
          const breedA = a.breedComposition?.[0]?.breedId || ""
          const breedB = b.breedComposition?.[0]?.breedId || ""
          return breedA.localeCompare(breedB) * direction

        case "color":
          return (a.color || "").localeCompare(b.color || "") * direction

        case "fightRecord":
          const winsA = a.fightRecord?.wins || 0
          const winsB = b.fightRecord?.wins || 0
          return (winsA - winsB) * direction

        case "offspringCount":
          return ((a.offspringCount || 0) - (b.offspringCount || 0)) * direction

        default:
          return 0
      }
    })
  }, [birds, sortState])

  // Clear active filter
  const clearFilter = (type: string, value?: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev }
      switch (type) {
        case "status":
          newFilters.status = value ? prev.status.filter((s) => s !== value) : []
          break
        case "sex":
          newFilters.sex = value ? prev.sex.filter((s) => s !== value) : []
          break
        case "breed":
          newFilters.breedIds = value ? prev.breedIds.filter((id) => id !== value) : []
          break
        case "ageRange":
          newFilters.ageRange = null
          break
        case "all":
          return initialFilters
      }
      return newFilters
    })
  }

  // Refresh after bulk action
  const handleBulkActionComplete = () => {
    fetchBirds(searchQuery)
  }

  return (
    <div className="p-4 lg:p-8 space-y-4 page-transition">
      {/* Toolbar */}
      <InventoryToolbar
        totalCount={birds.length}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onClearSearch={handleClearSearch}
        isSearching={isSearching}
        activeFilterCount={activeFilterCount}
        onOpenFilters={() => setFilterSheetOpen(true)}
        visibleColumns={visibleColumns}
        onToggleColumn={toggleColumn}
        onResetColumns={resetToDefault}
        autoFocusSearch={autoFocusSearch}
        isMobile={isMobile}
      />

      {/* Active filters pills */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.status.map((status) => (
            <span
              key={status}
              className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full"
            >
              {status}
              <button
                onClick={() => clearFilter("status", status)}
                className="hover:text-green-900"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {filters.sex.map((sex) => (
            <span
              key={sex}
              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full"
            >
              {sex === "MALE" ? t("bird.sex.male") : sex === "FEMALE" ? t("bird.sex.female") : t("bird.sex.unknown")}
              <button
                onClick={() => clearFilter("sex", sex)}
                className="hover:text-blue-900"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {filters.ageRange && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 text-sm rounded-full">
              {filters.ageRange.min === 0 && filters.ageRange.max === 6
                ? "< 6 months"
                : filters.ageRange.min === 6 && filters.ageRange.max === 12
                ? "6-12 months"
                : filters.ageRange.min === 12 && filters.ageRange.max === 24
                ? "1-2 years"
                : "> 2 years"}
              <button onClick={() => clearFilter("ageRange")} className="hover:text-amber-900">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {filters.breedIds.map((breedId) => {
            const breed = breeds.find((b) => b.id === breedId)
            return (
              <span
                key={breedId}
                className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full"
              >
                {breed?.code || breedId}
                <button
                  onClick={() => clearFilter("breed", breedId)}
                  className="hover:text-purple-900"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )
          })}
          <button
            onClick={() => clearFilter("all")}
            className="text-sm text-orange-600 hover:text-orange-700 font-medium"
          >
            {t("action.cancel")} all
          </button>
        </div>
      )}

      {/* Mobile column customizer */}
      {isMobile && (
        <div className="flex justify-end">
          <ColumnCustomizer
            visibleColumns={visibleColumns}
            onToggleColumn={toggleColumn}
            onResetToDefault={resetToDefault}
            isMobile={true}
          />
        </div>
      )}

      {/* Filter sheet */}
      <BirdFilterSheet
        open={filterSheetOpen}
        onOpenChange={setFilterSheetOpen}
        filters={filters}
        onFiltersChange={setFilters}
        breeds={breeds}
        sourceFarms={sourceFarms}
      />

      {/* Main content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-orange-50 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : sortedBirds.length === 0 ? (
        <Card className="card-warm">
          <CardContent className="p-8 text-center">
            <Bird className="h-16 w-16 mx-auto text-orange-200 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {t("common.noData")}
            </h3>
            <p className="text-muted-foreground mb-4">
              Start by adding your first bird
            </p>
            <Link href="/birds/new">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl">
                <Plus className="h-4 w-4 mr-2" />
                {t("bird.addNew")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : isMobile ? (
        // Mobile view
        <BirdMobileList
          birds={sortedBirds}
          breeds={breeds}
          selectedIds={selectedIds}
          selectionState={selectionState}
          isSelectionMode={isSelectionMode}
          onToggleSelection={toggleSelection}
          onToggleSelectAll={toggleSelectAll}
          onEnterSelectionMode={enterSelectionMode}
          onExitSelectionMode={exitSelectionMode}
        />
      ) : (
        // Desktop view
        <BirdDataTable
          birds={sortedBirds}
          breeds={breeds}
          visibleColumns={visibleColumns}
          selectedIds={selectedIds}
          selectionState={selectionState}
          onToggleSelection={toggleSelection}
          onToggleSelectAll={toggleSelectAll}
          sortState={sortState}
          onSort={handleSort}
        />
      )}

      {/* Bulk action bar */}
      <BulkActionBar
        selectedCount={selectedCount}
        selectedIds={selectedIds}
        coops={coops}
        onClearSelection={clearSelection}
        onActionComplete={handleBulkActionComplete}
      />

      {/* Spacer for mobile bottom nav */}
      <div className="h-20 lg:hidden" />
    </div>
  )
}
