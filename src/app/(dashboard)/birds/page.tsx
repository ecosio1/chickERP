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
  Filter,
  ChevronRight,
  X,
  Upload,
  Download,
} from "lucide-react"
import { useLanguage } from "@/hooks/use-language"
import { formatNumber, cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface BirdRecord {
  id: string
  name: string | null
  sex: string
  status: string
  hatchDate: string
  coopId: string | null
  coop: { name: string } | null
  identifiers: Array<{ idType: string; idValue: string }>
  breedComposition: Record<string, number> | null
}

export default function BirdsPage() {
  const { t, formatAge } = useLanguage()
  const searchParams = useSearchParams()
  const autoFocusSearch = searchParams.get("search") === "true"

  const [birds, setBirds] = useState<BirdRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [filterSex, setFilterSex] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [showFilters, setShowFilters] = useState(false)

  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch birds with search and filters
  const fetchBirds = useCallback(async (query?: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterSex !== "all") params.set("sex", filterSex)
      if (filterStatus !== "all") params.set("status", filterStatus)
      if (query && query.length >= 1) params.set("search", query)

      const res = await fetch(`/api/birds?${params}`)
      if (res.ok) {
        const json = await res.json()
        setBirds(json.birds || [])
      }
    } catch (error) {
      console.error("Failed to fetch birds:", error)
    } finally {
      setLoading(false)
      setIsSearching(false)
    }
  }, [filterSex, filterStatus])

  // Fetch on filter change
  useEffect(() => {
    fetchBirds(searchQuery)
  }, [filterSex, filterStatus]) // eslint-disable-line react-hooks/exhaustive-deps

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

      {/* Search Bar - Prominently placed */}
      <div className="relative">
        <div className="relative">
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
        </div>

        {/* Search indicator */}
        {isSearching && (
          <div className="absolute right-12 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "rounded-xl border-2",
            showFilters ? "border-orange-300 bg-orange-50" : "border-orange-100"
          )}
        >
          <Filter className="h-4 w-4 mr-2" />
          {t("action.filter")}
        </Button>

        {showFilters && (
          <>
            <Select value={filterSex} onValueChange={setFilterSex}>
              <SelectTrigger className="w-32 rounded-xl border-2 border-orange-100">
                <SelectValue placeholder={t("bird.sex")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all")}</SelectItem>
                <SelectItem value="MALE">{t("bird.sex.male")}</SelectItem>
                <SelectItem value="FEMALE">{t("bird.sex.female")}</SelectItem>
                <SelectItem value="UNKNOWN">{t("bird.sex.unknown")}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32 rounded-xl border-2 border-orange-100">
                <SelectValue placeholder={t("bird.status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all")}</SelectItem>
                <SelectItem value="ACTIVE">{t("bird.status.active")}</SelectItem>
                <SelectItem value="SOLD">{t("bird.status.sold")}</SelectItem>
                <SelectItem value="DECEASED">{t("bird.status.deceased")}</SelectItem>
              </SelectContent>
            </Select>
          </>
        )}
      </div>

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
                          {bird.breedComposition && Object.keys(bird.breedComposition).length > 0 && (
                            <div className="flex items-center gap-1 mt-2">
                              {Object.entries(bird.breedComposition).slice(0, 3).map(([breed, pct]) => (
                                <span
                                  key={breed}
                                  className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full"
                                >
                                  {breed} {pct}%
                                </span>
                              ))}
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
