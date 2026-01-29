"use client"

import { Suspense, useEffect, useState, useCallback, useRef, useMemo } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Bird,
  Search,
  Plus,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  X,
  Upload,
  Download,
  Filter,
} from "lucide-react"
import { useLanguage } from "@/hooks/use-language"
import { formatNumber, cn } from "@/lib/utils"

interface BirdRecord {
  id: string
  name: string | null
  sex: string
  status: string
  hatch_date: string
  color: string | null
  coop_id: string | null
  coop: { id: string; name: string } | null
  sire_id: string | null
  dam_id: string | null
  sire: { id: string; name: string | null } | null
  dam: { id: string; name: string | null } | null
  identifiers: Array<{ id_type: string; id_value: string }>
  breed_composition: Array<{ breedId: string; percentage: number }> | null
}

interface Breed {
  id: string
  name: string
  code: string
}

interface Coop {
  id: string
  name: string
}

type SortDirection = "asc" | "desc" | null
type SortColumn = "band" | "wingTag" | "name" | "sex" | "age" | "breed" | "sire" | "dam" | "color" | "coop" | "status"

const PAGE_SIZE_OPTIONS = [25, 50, 100, 250]

interface ColumnFilters {
  band: string
  wingTag: string
  name: string
  sex: string
  sire: string
  dam: string
  color: string
  coop: string
  status: string
  breed: string
}

const initialColumnFilters: ColumnFilters = {
  band: "",
  wingTag: "",
  name: "",
  sex: "",
  sire: "",
  dam: "",
  color: "",
  coop: "",
  status: "IN_STOCK", // Default to showing only active/breeding birds
  breed: "",
}

const STATUS_OPTIONS = ["ACTIVE", "BREEDING", "SOLD", "DECEASED", "CULLED", "RETIRED", "ARCHIVED"]
const SEX_OPTIONS = ["MALE", "FEMALE", "UNKNOWN"]

function BirdsPageContent() {
  const { t } = useLanguage()
  const searchParams = useSearchParams()
  const autoFocusSearch = searchParams.get("search") === "true"

  const [birds, setBirds] = useState<BirdRecord[]>([])
  const [breeds, setBreeds] = useState<Breed[]>([])
  const [coops, setCoops] = useState<Coop[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  // Sorting state
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)

  // Column filters state
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>(initialColumnFilters)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  const searchInputRef = useRef<HTMLInputElement>(null)

  // Check if any filter is active (excluding default "IN_STOCK" status)
  const hasActiveFilters = useMemo(() => {
    return Object.entries(columnFilters).some(([key, v]) => {
      if (key === "status") return v !== "" && v !== "IN_STOCK"
      return v !== ""
    })
  }, [columnFilters])

  // Get unique values for dropdowns from current data
  const uniqueSires = useMemo(() => {
    const sires = new Map<string, string>()
    birds.forEach((b) => {
      if (b.sire?.name) sires.set(b.sire_id!, b.sire.name)
    })
    return Array.from(sires.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name))
  }, [birds])

  const uniqueDams = useMemo(() => {
    const dams = new Map<string, string>()
    birds.forEach((b) => {
      if (b.dam?.name) dams.set(b.dam_id!, b.dam.name)
    })
    return Array.from(dams.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name))
  }, [birds])

  const uniqueColors = useMemo(() => {
    const colors = new Set<string>()
    birds.forEach((b) => {
      if (b.color) colors.add(b.color)
    })
    return Array.from(colors).sort()
  }, [birds])

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [birdsRes, breedsRes, coopsRes] = await Promise.all([
          fetch("/api/birds?limit=1000"),
          fetch("/api/breeds"),
          fetch("/api/coops"),
        ])
        if (birdsRes.ok) {
          const json = await birdsRes.json()
          setBirds(json.birds || [])
        }
        if (breedsRes.ok) {
          const data = await breedsRes.json()
          setBreeds(data || [])
        }
        if (coopsRes.ok) {
          const data = await coopsRes.json()
          setCoops(data.coops || [])
        }
      } catch (error) {
        console.error("Failed to fetch data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Auto-focus search if requested
  useEffect(() => {
    if (autoFocusSearch && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [autoFocusSearch])

  // Helper functions
  const getBandNumber = (bird: BirdRecord) => {
    const band = bird.identifiers?.find((id) => id.id_type === "BAND")
    return band?.id_value || ""
  }

  const getWingTag = (bird: BirdRecord) => {
    const wingBand = bird.identifiers?.find((id) => id.id_type === "WING_BAND")
    return wingBand?.id_value || ""
  }

  const getAgeInDays = (hatchDate: string) => {
    return Math.floor((Date.now() - new Date(hatchDate).getTime()) / (1000 * 60 * 60 * 24))
  }

  const formatHatchDate = (hatchDate: string) => {
    const date = new Date(hatchDate)
    if (isNaN(date.getTime())) return "-"
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${month}/${year}`
  }

  const formatBreedComposition = (composition: Array<{ breedId: string; percentage: number }> | null) => {
    if (!composition || composition.length === 0) return "-"
    const breedMap = new Map(breeds.map((b) => [b.id, b]))
    const sorted = [...composition].sort((a, b) => b.percentage - a.percentage)
    const parts = sorted.map((bc) => {
      const breed = breedMap.get(bc.breedId)
      const name = breed?.code || breed?.name || bc.breedId.slice(0, 6)
      if (bc.percentage === 100) return name
      return `${name} ${bc.percentage}%`
    })
    return parts.join(" / ")
  }

  const getBreedSearchString = (composition: Array<{ breedId: string; percentage: number }> | null) => {
    if (!composition || composition.length === 0) return ""
    const breedMap = new Map(breeds.map((b) => [b.id, b]))
    return composition.map((bc) => {
      const breed = breedMap.get(bc.breedId)
      return `${breed?.name || ""} ${breed?.code || ""}`.toLowerCase()
    }).join(" ")
  }

  // Sorting
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      // Cycle: asc -> desc -> null
      if (sortDirection === "asc") {
        setSortDirection("desc")
      } else if (sortDirection === "desc") {
        setSortColumn(null)
        setSortDirection(null)
      }
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  // Filter and sort birds
  const filteredAndSortedBirds = useMemo(() => {
    let result = [...birds]

    // Apply filters (AND logic)
    if (columnFilters.band) {
      const search = columnFilters.band.toLowerCase()
      result = result.filter((b) => getBandNumber(b).toLowerCase().includes(search))
    }
    if (columnFilters.wingTag) {
      const search = columnFilters.wingTag.toLowerCase()
      result = result.filter((b) => getWingTag(b).toLowerCase().includes(search))
    }
    if (columnFilters.name) {
      const search = columnFilters.name.toLowerCase()
      result = result.filter((b) => (b.name || "").toLowerCase().includes(search))
    }
    if (columnFilters.sex) {
      result = result.filter((b) => b.sex === columnFilters.sex)
    }
    if (columnFilters.sire) {
      result = result.filter((b) => b.sire_id === columnFilters.sire)
    }
    if (columnFilters.dam) {
      result = result.filter((b) => b.dam_id === columnFilters.dam)
    }
    if (columnFilters.color) {
      const search = columnFilters.color.toLowerCase()
      result = result.filter((b) => (b.color || "").toLowerCase().includes(search))
    }
    if (columnFilters.coop) {
      result = result.filter((b) => b.coop_id === columnFilters.coop)
    }
    if (columnFilters.status) {
      if (columnFilters.status === "IN_STOCK") {
        // Show only active and breeding birds (birds still in inventory)
        result = result.filter((b) => b.status === "ACTIVE" || b.status === "BREEDING")
      } else {
        result = result.filter((b) => b.status === columnFilters.status)
      }
    }
    if (columnFilters.breed) {
      const search = columnFilters.breed.toLowerCase()
      result = result.filter((b) => getBreedSearchString(b.breed_composition).includes(search))
    }

    // Apply sorting
    if (sortColumn && sortDirection) {
      result.sort((a, b) => {
        let comparison = 0
        switch (sortColumn) {
          case "band":
            comparison = getBandNumber(a).localeCompare(getBandNumber(b))
            break
          case "wingTag":
            comparison = getWingTag(a).localeCompare(getWingTag(b))
            break
          case "name":
            comparison = (a.name || "").localeCompare(b.name || "")
            break
          case "sex":
            comparison = a.sex.localeCompare(b.sex)
            break
          case "age":
            comparison = getAgeInDays(a.hatch_date) - getAgeInDays(b.hatch_date)
            break
          case "breed":
            comparison = formatBreedComposition(a.breed_composition).localeCompare(formatBreedComposition(b.breed_composition))
            break
          case "sire":
            comparison = (a.sire?.name || "").localeCompare(b.sire?.name || "")
            break
          case "dam":
            comparison = (a.dam?.name || "").localeCompare(b.dam?.name || "")
            break
          case "color":
            comparison = (a.color || "").localeCompare(b.color || "")
            break
          case "coop":
            comparison = (a.coop?.name || "").localeCompare(b.coop?.name || "")
            break
          case "status":
            comparison = a.status.localeCompare(b.status)
            break
        }
        return sortDirection === "asc" ? comparison : -comparison
      })
    }

    return result
  }, [birds, columnFilters, sortColumn, sortDirection, breeds])

  // Paginated results
  const totalPages = Math.max(1, Math.ceil(filteredAndSortedBirds.length / pageSize))
  const paginatedBirds = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredAndSortedBirds.slice(startIndex, startIndex + pageSize)
  }, [filteredAndSortedBirds, currentPage, pageSize])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [columnFilters, sortColumn, sortDirection, pageSize])

  const clearAllFilters = () => {
    setColumnFilters(initialColumnFilters) // Resets to default with IN_STOCK status
    setCurrentPage(1)
  }

  const getSexRowColor = (sex: string) => {
    switch (sex) {
      case "MALE": return "bg-blue-50/70 hover:bg-blue-100/80"
      case "FEMALE": return "bg-pink-50/70 hover:bg-pink-100/80"
      default: return "bg-gray-50 hover:bg-gray-100"
    }
  }

  const getSexBadge = (sex: string) => {
    switch (sex) {
      case "MALE": return "bg-blue-100 text-blue-700"
      case "FEMALE": return "bg-pink-100 text-pink-700"
      default: return "bg-gray-100 text-gray-600"
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE": return "bg-green-100 text-green-700"
      case "SOLD": return "bg-amber-100 text-amber-700"
      case "DECEASED": return "bg-red-100 text-red-700"
      case "BREEDING": return "bg-purple-100 text-purple-700"
      case "RETIRED": return "bg-gray-200 text-gray-700"
      default: return "bg-gray-100 text-gray-700"
    }
  }

  // Sortable header component
  const SortableHeader = ({ column, children, className }: { column: SortColumn; children: React.ReactNode; className?: string }) => (
    <th
      className={cn(
        "text-left py-3 px-3 font-semibold text-gray-700 whitespace-nowrap cursor-pointer select-none hover:bg-orange-100 transition-colors",
        className
      )}
      onClick={() => handleSort(column)}
    >
      <div className="flex items-center gap-1">
        {children}
        <span className="w-4 h-4 flex items-center justify-center">
          {sortColumn === column && sortDirection === "asc" && <ChevronUp className="h-4 w-4 text-orange-600" />}
          {sortColumn === column && sortDirection === "desc" && <ChevronDown className="h-4 w-4 text-orange-600" />}
        </span>
      </div>
    </th>
  )

  return (
    <div className="p-4 lg:p-8 space-y-4 page-transition">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
            {t("bird.title")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {filteredAndSortedBirds.length > 0 ? (
              <>
                Showing {formatNumber((currentPage - 1) * pageSize + 1)}-{formatNumber(Math.min(currentPage * pageSize, filteredAndSortedBirds.length))} of {formatNumber(filteredAndSortedBirds.length)}
                {filteredAndSortedBirds.length !== birds.length && ` (${formatNumber(birds.length)} total)`}
              </>
            ) : (
              `0 of ${formatNumber(birds.length)} ${t("bird.title").toLowerCase()}`
            )}
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

      {/* Filter Toggle & Clear */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "rounded-xl h-10 px-4 border-2",
            showFilters || hasActiveFilters
              ? "border-orange-400 bg-orange-50 text-orange-700"
              : "border-orange-100 text-gray-600"
          )}
        >
          <Filter className="h-4 w-4 mr-2" />
          {showFilters ? "Hide Filters" : "Show Filters"}
          {hasActiveFilters && !showFilters && (
            <span className="ml-2 px-2 py-0.5 bg-orange-500 text-white text-xs font-medium rounded-full">
              Active
            </span>
          )}
        </Button>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            onClick={clearAllFilters}
            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
          >
            <X className="h-4 w-4 mr-1" />
            Clear all filters
          </Button>
        )}
      </div>

      {/* Birds Table */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-12 bg-orange-50 rounded-lg animate-pulse" />
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
        <Card className="card-warm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                {/* Sortable Headers */}
                <tr className="bg-orange-50 border-b border-orange-100">
                  <SortableHeader column="band">Band #</SortableHeader>
                  <SortableHeader column="wingTag">Wingband Color</SortableHeader>
                  <SortableHeader column="name">Name</SortableHeader>
                  <SortableHeader column="sex">Sex</SortableHeader>
                  <SortableHeader column="age">Hatch</SortableHeader>
                  <SortableHeader column="breed">Breed %</SortableHeader>
                  <SortableHeader column="sire">Sire</SortableHeader>
                  <SortableHeader column="dam">Dam</SortableHeader>
                  <SortableHeader column="color">Color</SortableHeader>
                  <SortableHeader column="coop">Coop</SortableHeader>
                  <SortableHeader column="status">Status</SortableHeader>
                  <th className="w-8"></th>
                </tr>

                {/* Filter Row */}
                {showFilters && (
                  <tr className="bg-orange-25 border-b border-orange-100">
                    {/* Band filter */}
                    <td className="py-2 px-2">
                      <Input
                        placeholder="Filter..."
                        value={columnFilters.band}
                        onChange={(e) => setColumnFilters({ ...columnFilters, band: e.target.value })}
                        className="h-8 text-xs rounded-lg border-orange-200"
                      />
                    </td>
                    {/* Wing Tag filter */}
                    <td className="py-2 px-2">
                      <Input
                        placeholder="Filter..."
                        value={columnFilters.wingTag}
                        onChange={(e) => setColumnFilters({ ...columnFilters, wingTag: e.target.value })}
                        className="h-8 text-xs rounded-lg border-orange-200"
                      />
                    </td>
                    {/* Name filter */}
                    <td className="py-2 px-2">
                      <Input
                        placeholder="Filter..."
                        value={columnFilters.name}
                        onChange={(e) => setColumnFilters({ ...columnFilters, name: e.target.value })}
                        className="h-8 text-xs rounded-lg border-orange-200"
                      />
                    </td>
                    {/* Sex filter */}
                    <td className="py-2 px-2">
                      <Select
                        value={columnFilters.sex || "all"}
                        onValueChange={(v) => setColumnFilters({ ...columnFilters, sex: v === "all" ? "" : v })}
                      >
                        <SelectTrigger className="h-8 text-xs rounded-lg border-orange-200 w-20">
                          <SelectValue placeholder="All" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          {SEX_OPTIONS.map((s) => (
                            <SelectItem key={s} value={s}>{s[0]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    {/* Age - no filter for now */}
                    <td className="py-2 px-2">
                      <span className="text-xs text-gray-400">-</span>
                    </td>
                    {/* Breed filter */}
                    <td className="py-2 px-2">
                      <Input
                        placeholder="Filter..."
                        value={columnFilters.breed}
                        onChange={(e) => setColumnFilters({ ...columnFilters, breed: e.target.value })}
                        className="h-8 text-xs rounded-lg border-orange-200"
                      />
                    </td>
                    {/* Sire filter */}
                    <td className="py-2 px-2">
                      <Select
                        value={columnFilters.sire || "all"}
                        onValueChange={(v) => setColumnFilters({ ...columnFilters, sire: v === "all" ? "" : v })}
                      >
                        <SelectTrigger className="h-8 text-xs rounded-lg border-orange-200 w-24">
                          <SelectValue placeholder="All" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          {uniqueSires.map((s) => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    {/* Dam filter */}
                    <td className="py-2 px-2">
                      <Select
                        value={columnFilters.dam || "all"}
                        onValueChange={(v) => setColumnFilters({ ...columnFilters, dam: v === "all" ? "" : v })}
                      >
                        <SelectTrigger className="h-8 text-xs rounded-lg border-orange-200 w-24">
                          <SelectValue placeholder="All" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          {uniqueDams.map((d) => (
                            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    {/* Color filter */}
                    <td className="py-2 px-2">
                      <Input
                        placeholder="Filter..."
                        value={columnFilters.color}
                        onChange={(e) => setColumnFilters({ ...columnFilters, color: e.target.value })}
                        className="h-8 text-xs rounded-lg border-orange-200 w-20"
                      />
                    </td>
                    {/* Coop filter */}
                    <td className="py-2 px-2">
                      <Select
                        value={columnFilters.coop || "all"}
                        onValueChange={(v) => setColumnFilters({ ...columnFilters, coop: v === "all" ? "" : v })}
                      >
                        <SelectTrigger className="h-8 text-xs rounded-lg border-orange-200 w-24">
                          <SelectValue placeholder="All" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          {coops.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    {/* Status filter */}
                    <td className="py-2 px-2">
                      <Select
                        value={columnFilters.status || "all"}
                        onValueChange={(v) => setColumnFilters({ ...columnFilters, status: v === "all" ? "" : v })}
                      >
                        <SelectTrigger className="h-8 text-xs rounded-lg border-orange-200 w-28">
                          <SelectValue placeholder="All" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="IN_STOCK">In Stock</SelectItem>
                          <SelectItem value="all">All</SelectItem>
                          {STATUS_OPTIONS.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td></td>
                  </tr>
                )}
              </thead>
              <tbody>
                {paginatedBirds.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-8 text-center text-gray-500">
                      No birds match your filters
                    </td>
                  </tr>
                ) : (
                  paginatedBirds.map((bird) => (
                    <tr
                      key={bird.id}
                      onClick={() => window.location.href = `/birds/${bird.id}`}
                      className={cn(
                        "border-b border-orange-50 cursor-pointer transition-colors",
                        getSexRowColor(bird.sex)
                      )}
                    >
                      <td className="py-2.5 px-3 font-mono text-xs whitespace-nowrap">
                        {getBandNumber(bird) || "-"}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-xs whitespace-nowrap">
                        {getWingTag(bird) || "-"}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-gray-800 whitespace-nowrap max-w-[120px] truncate">
                        {bird.name || "-"}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", getSexBadge(bird.sex))}>
                          {bird.sex === "MALE" ? "M" : bird.sex === "FEMALE" ? "F" : "?"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-gray-600 whitespace-nowrap">
                        {formatHatchDate(bird.hatch_date)}
                      </td>
                      <td className="py-2.5 px-3 text-gray-600 whitespace-nowrap max-w-[150px] truncate" title={formatBreedComposition(bird.breed_composition)}>
                        {formatBreedComposition(bird.breed_composition)}
                      </td>
                      <td className="py-2.5 px-3 text-gray-600 whitespace-nowrap max-w-[100px] truncate">
                        {bird.sire?.name || "-"}
                      </td>
                      <td className="py-2.5 px-3 text-gray-600 whitespace-nowrap max-w-[100px] truncate">
                        {bird.dam?.name || "-"}
                      </td>
                      <td className="py-2.5 px-3 text-gray-600 whitespace-nowrap max-w-[80px] truncate">
                        {bird.color || "-"}
                      </td>
                      <td className="py-2.5 px-3 text-gray-600 whitespace-nowrap max-w-[100px] truncate">
                        {bird.coop?.name || "-"}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", getStatusBadge(bird.status))}>
                          {bird.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-2">
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {filteredAndSortedBirds.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-orange-100 bg-orange-50/50">
              {/* Page size selector */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Show</span>
                <Select
                  value={pageSize.toString()}
                  onValueChange={(v) => setPageSize(Number(v))}
                >
                  <SelectTrigger className="h-9 w-20 rounded-lg border-orange-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZE_OPTIONS.map((size) => (
                      <SelectItem key={size} value={size.toString()}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-sm text-gray-600">per page</span>
              </div>

              {/* Page navigation */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="h-9 px-3 rounded-lg border-orange-200 disabled:opacity-50"
                >
                  First
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-9 px-3 rounded-lg border-orange-200 disabled:opacity-50"
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600 px-3">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-9 px-3 rounded-lg border-orange-200 disabled:opacity-50"
                >
                  Next
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="h-9 px-3 rounded-lg border-orange-200 disabled:opacity-50"
                >
                  Last
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Spacer for mobile bottom nav */}
      <div className="h-20 lg:hidden" />
    </div>
  )
}

export default function BirdsPage() {
  return (
    <Suspense fallback={<div className="p-4 lg:p-8"><div className="h-20 bg-orange-50 rounded-2xl animate-pulse" /></div>}>
      <BirdsPageContent />
    </Suspense>
  )
}
