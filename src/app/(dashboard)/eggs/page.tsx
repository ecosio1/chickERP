"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Egg,
  Plus,
  Bird,
  Calendar,
  ChevronRight,
} from "lucide-react"
import { useLanguage } from "@/hooks/use-language"
import { cn } from "@/lib/utils"

interface EggRecord {
  id: string
  layDate: string
  eggMark: string | null
  weightGrams: number | null
  shellQuality: string | null
  isIncubating: boolean
  isHatched: boolean
  hatchedBirdId: string | null
  hen: {
    id: string
    name: string | null
    identifiers: Array<{ idType: string; idValue: string }>
  }
}

export default function EggsPage() {
  const { t } = useLanguage()
  const [eggs, setEggs] = useState<EggRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "incubating" | "hatched">("all")

  useEffect(() => {
    async function fetchEggs() {
      try {
        const res = await fetch("/api/eggs")
        if (res.ok) {
          const json = await res.json()
          setEggs(json.eggs || [])
        }
      } catch (error) {
        console.error("Failed to fetch eggs:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchEggs()
  }, [])

  const filteredEggs = eggs.filter((egg) => {
    if (filter === "incubating") return egg.isIncubating && !egg.isHatched
    if (filter === "hatched") return egg.isHatched
    return true
  })

  const getHenDisplayId = (hen: EggRecord["hen"]) => {
    return hen.identifiers[0]?.idValue || hen.name || hen.id.slice(-6)
  }

  const getQualityColor = (quality: string | null) => {
    switch (quality) {
      case "GOOD": return "bg-green-100 text-green-700"
      case "FAIR": return "bg-yellow-100 text-yellow-700"
      case "POOR": return "bg-red-100 text-red-700"
      case "SOFT": return "bg-purple-100 text-purple-700"
      default: return "bg-gray-100 text-gray-700"
    }
  }

  // Stats
  const totalEggs = eggs.length
  const incubatingCount = eggs.filter((e) => e.isIncubating && !e.isHatched).length
  const hatchedCount = eggs.filter((e) => e.isHatched).length
  const thisWeekCount = eggs.filter((e) => {
    const layDate = new Date(e.layDate)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return layDate >= weekAgo
  }).length

  return (
    <div className="p-4 lg:p-8 space-y-6 page-transition">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
            {t("egg.title")}
          </h1>
          <p className="text-muted-foreground mt-1">
            Track egg production and incubation
          </p>
        </div>
        <Link href="/eggs/record">
          <Button className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl h-12 px-6">
            <Plus className="h-5 w-5 mr-2" />
            {t("egg.addNew")}
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="card-warm">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-gray-800">{totalEggs}</p>
            <p className="text-sm text-muted-foreground">{t("common.all")}</p>
          </CardContent>
        </Card>
        <Card className="card-warm">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-amber-600">{thisWeekCount}</p>
            <p className="text-sm text-muted-foreground">{t("common.thisWeek")}</p>
          </CardContent>
        </Card>
        <Card className="card-warm">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{incubatingCount}</p>
            <p className="text-sm text-muted-foreground">{t("egg.incubating")}</p>
          </CardContent>
        </Card>
        <Card className="card-warm">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-green-600">{hatchedCount}</p>
            <p className="text-sm text-muted-foreground">{t("egg.hatched")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(["all", "incubating", "hatched"] as const).map((f) => (
          <Button
            key={f}
            variant="outline"
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-xl border-2",
              filter === f
                ? "border-amber-300 bg-amber-50 text-amber-700"
                : "border-orange-100"
            )}
          >
            {f === "all" ? t("common.all") : f === "incubating" ? t("egg.incubating") : t("egg.hatched")}
          </Button>
        ))}
      </div>

      {/* Eggs List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 bg-orange-50 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredEggs.length === 0 ? (
        <Card className="card-warm">
          <CardContent className="p-8 text-center">
            <Egg className="h-16 w-16 mx-auto text-amber-200 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {t("common.noData")}
            </h3>
            <p className="text-muted-foreground mb-4">
              Start recording eggs from your hens
            </p>
            <Link href="/eggs/record">
              <Button className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl">
                <Plus className="h-4 w-4 mr-2" />
                {t("egg.addNew")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredEggs.map((egg) => (
            <Card key={egg.id} className="card-warm hover:shadow-md transition-all">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                      <Egg className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        {egg.eggMark && (
                          <span className="font-semibold text-gray-800">{egg.eggMark}</span>
                        )}
                        {egg.isIncubating && !egg.isHatched && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                            {t("egg.incubating")}
                          </span>
                        )}
                        {egg.isHatched && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                            {t("egg.hatched")}
                          </span>
                        )}
                        {egg.shellQuality && (
                          <span className={cn("text-xs px-2 py-0.5 rounded-full", getQualityColor(egg.shellQuality))}>
                            {egg.shellQuality === "GOOD" ? t("egg.quality.good") :
                             egg.shellQuality === "FAIR" ? t("egg.quality.fair") :
                             egg.shellQuality === "POOR" ? t("egg.quality.poor") :
                             t("egg.quality.soft")}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(egg.layDate).toLocaleDateString()}
                        </span>
                        <Link
                          href={`/birds/${egg.hen.id}`}
                          className="flex items-center gap-1 text-pink-600 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Bird className="h-3 w-3" />
                          {getHenDisplayId(egg.hen)}
                        </Link>
                        {egg.weightGrams && (
                          <span>{egg.weightGrams}g</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Spacer for mobile bottom nav */}
      <div className="h-20 lg:hidden" />
    </div>
  )
}
