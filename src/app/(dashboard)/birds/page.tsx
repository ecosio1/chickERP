"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Bird,
  Search,
  Plus,
  ChevronRight,
  X,
  Upload,
  Download,
  Filter,
  SlidersHorizontal,
} from "lucide-react"
import { useLanguage } from "@/hooks/use-language"
import { formatNumber, cn } from "@/lib/utils"
import { BirdFilterSheet, FilterState } from "@/components/birds/BirdFilterSheet"

interface BirdRecord {
  id: string
  name: string | null
  sex: string
  status: string
  hatchDate: string
  color: string | null
  coopId: string | null
  coop: { name: string } | null
  identifiers: Array<{ idType: string; idValue: string }>
  breedComposition: Array<{ breedId: string; percentage: number }> | null
}

interface Breed {
  id: string
  name: string
  code: string
}

interface SourceFarm {
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

export default function BirdsPage() {
  const { t, formatAge } = useLanguage()
  const searchParams = useSearchParams()
  const autoFocusSearch = searchParams.get("search") === "true"

  const [birds, setBirds] = useState<BirdRecord[]>([])
  const [breeds, setBreeds] = useState<Breed[]>([])
  const [sourceFarms, setSourceFarms] = useState<SourceFarm[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [filters, setFilters] = useState<FilterState>(initialFilters)
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)

  const activeFilterCount =
    filters.status.length +
    filters.sex.length +
    filters.breedIds.length +
    filters.colors.length +
    filters.sourceFarmIds.length +
    (filters.ageRange ? 1 : 0)

  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch breeds and source farms for filter options
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [breedsRes, farmsRes] = await Promise.all([
          fetch("/api/breeds"),
          fetch("/api/settings/source-farms"),
        ])
        if (breedsRes.ok) {
          const data = await breedsRes.json()
          setBreeds(data || [])
        }
        if (farmsRes.ok) {
          const data = await farmsRes.json()
          setSourceFarms(data.farms || [])
        }
      } catch (error) {
        console.error("Failed to fetch filter options:", error)
      }
    }
    fetchFilterOptions()
  }, [])

  // Fetch birds with search and filters
  const fetchBirds = useCallback(async (query?: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()

      // Add text search
      if (query && query.length >= 1) params.set("search", query)

      // Add status filters (first one only for API, will filter multiple client-side if needed)
      if (filters.status.length === 1) {
        params.set("status", filters.status[0])
      }

      // Add sex filters (first one only for API)
      if (filters.sex.length === 1) {
        params.set("sex", filters.sex[0])
      }

      // Add color filter (first one only)
      if (filters.colors.length > 0) {
        params.set("color", filters.colors[0])
      }

      // Add breed filter (first one only)
      if (filters.breedIds.length > 0) {
        params.set("breedId", filters.breedIds[0])
      }

      // Add source farm filter (first one only)
      if (filters.sourceFarmIds.length > 0) {
        params.set("sourceFarmId", filters.sourceFarmIds[0])
      }

      // Add age range filter
      if (filters.ageRange) {
        if (filters.ageRange.min !== undefined) {
          params.set("ageMin", filters.ageRange.min.toString())
        }
        if (filters.ageRange.max !== undefined) {
          params.set("ageMax", filters.ageRange.max.toString())
        }
      }

      const res = await fetch(`/api/birds?${params}`)
      if (res.ok) {
        const json = await res.json()
        let filteredBirds = json.birds || []

        // Client-side filtering for multiple selections
        if (filters.status.length > 1) {
          filteredBirds = filteredBirds.filter((b: BirdRecord) =>
            filters.status.includes(b.status)
          )
        }
        if (filters.sex.length > 1) {
          filteredBirds = filteredBirds.filter((b: BirdRecord) =>
            filters.sex.includes(b.sex)
          )
        }
        if (filters.colors.length > 1) {
          filteredBirds = filteredBirds.filter(
            (b: BirdRecord) => b.color && filters.colors.includes(b.color)
          )
        }

        setBirds(filteredBirds)
      }
    } catch (error) {
      console.error("Failed to fetch birds:", error)
    } finally {
      setLoading(false)
      setIsSearching(false)
    }
  }, [filters])

  // Fetch on filter change
  useEffect(() => {
    fetchBirds(searchQuery)
  }, [filters]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-focus search if requested
  useEffect(() => {
    if (autoFocusSearch && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [autoFocusSearch])

  // Search with debounce - filters main list
  const handleSearch = useCallback((query: string) => {
    setIsSearching(true)
    fetchBirds(query)
  }, [fetchBirds])

  const onSearchChange = (value: string) => {
    setSearchQuery(value)

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(value)
    }, 200) // Fast 200ms debounce
  }

  const clearSearch = () => {
    setSearchQuery("")
    fetchBirds("")
    searchInputRef.current?.focus()
  }

  const getDisplayId = (bird: BirdRecord) => {
    return bird.identifiers[0]?.idValue || bird.name || bird.id.slice(-6)
  }

  const getSexColor = (sex: string) => {
    switch (sex) {
      case "MALE":
        return "bg-blue-100 text-blue-600"
      case "FEMALE":
        return "bg-pink-100 text-pink-600"
      default:
        return "bg-gray-100 text-gray-600"
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-700"
      case "SOLD":
        return "bg-yellow-100 text-yellow-700"
      case "DECEASED":
        return "bg-red-100 text-red-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  return (
    <div className="p-4 lg:p-8 space-y-4 page-transition">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
            {t("bird.title")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {formatNumber(birds.length)} {t("bird.title").toLowerCase()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/birds/export">
            <Button variant="outline" className="rounded-xl h-12 px-4 border-2 border-orange-100">
              <Download className="h-5 w-5 mr-2" />
              {t("action.export")}
            </Button>
          </Link>
          <Link href="/birds/import">
            <Button variant="outline" className="rounded-xl h-12 px-4 border-2 border-orange-100">
              <Upload className="h-5 w-5 mr-2" />
              {t("action.import")}
            </Button>
          </Link>
          <Link href="/birds/new">
            <Button className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl h-12 px-6">
              <Plus className="h-5 w-5 mr-2" />
              {t("bird.addNew")}
            </Button>
          </Link>
        </div>
      </div>

      {/* Search Bar with Filter Button */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            ref={searchInputRef}
            type="text"
            placeholder={t("bird.search")}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-12 pr-12 h-14 text-lg rounded-2xl border-2 border-orange-100 focus:border-orange-300 bg-white"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          )}
          {/* Search indicator */}
          {isSearching && (
            <div className="absolute right-12 top-1/2 -translate-y-1/2">
              <div className="w-5 h-5 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Filter Button */}
        <Button
          variant="outline"
          onClick={() => setFilterSheetOpen(true)}
          className={cn(
            "h-14 px-4 rounded-2xl border-2 flex-shrink-0",
            activeFilterCount > 0
              ? "border-orange-400 bg-orange-50 text-orange-700"
              : "border-orange-100 text-gray-600"
          )}
        >
          <SlidersHorizontal className="h-5 w-5" />
          {activeFilterCount > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-orange-500 text-white text-xs font-medium rounded-full">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {/* Active Filters Pills */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.status.map((status) => (
            <span
              key={status}
              className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full"
            >
              {status}
              <button
                onClick={() =>
                  setFilters({
                    ...filters,
                    status: filters.status.filter((s) => s !== status),
                  })
                }
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
                onClick={() =>
                  setFilters({
                    ...filters,
                    sex: filters.sex.filter((s) => s !== sex),
                  })
                }
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
              <button
                onClick={() => setFilters({ ...filters, ageRange: null })}
                className="hover:text-amber-900"
              >
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
                  onClick={() =>
                    setFilters({
                      ...filters,
                      breedIds: filters.breedIds.filter((id) => id !== breedId),
                    })
                  }
                  className="hover:text-purple-900"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )
          })}
          <button
            onClick={() =>
              setFilters({
                status: [],
                sex: [],
                breedIds: [],
                colors: [],
                sourceFarmIds: [],
                ageRange: null,
              })
            }
            className="text-sm text-orange-600 hover:text-orange-700 font-medium"
          >
            {t("action.cancel")} all
          </button>
        </div>
      )}

      {/* Filter Sheet */}
      <BirdFilterSheet
        open={filterSheetOpen}
        onOpenChange={setFilterSheetOpen}
        filters={filters}
        onFiltersChange={setFilters}
        breeds={breeds}
        sourceFarms={sourceFarms}
      />

      {/* Birds List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 bg-orange-50 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : birds.length === 0 ? (
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
      ) : (
        <div className="space-y-3">
          {birds.map((bird) => {
            const ageInDays = Math.floor(
              (Date.now() - new Date(bird.hatchDate).getTime()) / (1000 * 60 * 60 * 24)
            )
            return (
              <Link key={bird.id} href={`/birds/${bird.id}`}>
                <Card className="card-warm hover:shadow-md transition-all cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", getSexColor(bird.sex))}>
                          <Bird className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-800 text-lg">
                              {getDisplayId(bird)}
                            </p>
                            <span className={cn("text-xs px-2 py-0.5 rounded-full", getStatusBadge(bird.status))}>
                              {bird.status === "ACTIVE"
                                ? t("bird.status.active")
                                : bird.status === "SOLD"
                                ? t("bird.status.sold")
                                : bird.status === "DECEASED"
                                ? t("bird.status.deceased")
                                : bird.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                            <span>
                              {bird.sex === "MALE"
                                ? t("bird.sex.male")
                                : bird.sex === "FEMALE"
                                ? t("bird.sex.female")
                                : t("bird.sex.unknown")}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-gray-300" />
                            <span>{formatAge(ageInDays)}</span>
                            {bird.coop && (
                              <>
                                <span className="w-1 h-1 rounded-full bg-gray-300" />
                                <span>{bird.coop.name}</span>
                              </>
                            )}
                          </div>
                          {bird.breedComposition && bird.breedComposition.length > 0 && (
                            <div className="flex items-center gap-1 mt-2">
                              {bird.breedComposition.slice(0, 3).map((comp) => {
                                const breed = breeds.find((b) => b.id === comp.breedId)
                                return (
                                  <span
                                    key={comp.breedId}
                                    className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full"
                                  >
                                    {breed?.code || comp.breedId.slice(-4)} {comp.percentage}%
                                  </span>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}

      {/* Spacer for mobile bottom nav */}
      <div className="h-20 lg:hidden" />
    </div>
  )
}
