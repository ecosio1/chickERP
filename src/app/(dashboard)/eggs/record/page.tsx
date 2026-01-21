"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Egg,
  ArrowLeft,
  Bird,
  Search,
  X,
} from "lucide-react"
import { useLanguage } from "@/hooks/use-language"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface HenSearchResult {
  id: string
  name: string | null
  identifiers: Array<{ idType: string; idValue: string }>
}

export default function RecordEggPage() {
  const { t } = useLanguage()
  const router = useRouter()

  const [formData, setFormData] = useState({
    henId: "",
    layDate: new Date().toISOString().split("T")[0],
    eggMark: "",
    weightGrams: "",
    shellQuality: "",
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  // Hen search state
  const [henSearch, setHenSearch] = useState("")
  const [henResults, setHenResults] = useState<HenSearchResult[]>([])
  const [selectedHen, setSelectedHen] = useState<HenSearchResult | null>(null)
  const [showHenSearch, setShowHenSearch] = useState(false)

  const searchHen = async (query: string) => {
    if (query.length < 2) {
      setHenResults([])
      return
    }

    try {
      const res = await fetch(`/api/birds/search?q=${encodeURIComponent(query)}&sex=FEMALE`)
      if (res.ok) {
        const json = await res.json()
        setHenResults(json.results || [])
      }
    } catch (error) {
      console.error("Hen search failed:", error)
    }
  }

  const selectHen = (hen: HenSearchResult) => {
    setSelectedHen(hen)
    setFormData({ ...formData, henId: hen.id })
    setHenSearch("")
    setHenResults([])
    setShowHenSearch(false)
  }

  const getDisplayId = (hen: HenSearchResult) => {
    return hen.identifiers[0]?.idValue || hen.name || hen.id.slice(-6)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.henId) {
      setError("Please select a hen")
      return
    }

    setSaving(true)

    try {
      const res = await fetch("/api/eggs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          henId: formData.henId,
          layDate: formData.layDate,
          eggMark: formData.eggMark || null,
          weightGrams: formData.weightGrams ? parseInt(formData.weightGrams) : null,
          shellQuality: formData.shellQuality || null,
        }),
      })

      if (res.ok) {
        router.push("/eggs")
      } else {
        const json = await res.json()
        setError(json.error || "Failed to record egg")
      }
    } catch (err) {
      setError("Failed to record egg")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto page-transition">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/eggs">
          <Button variant="ghost" size="icon" className="rounded-xl">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
            {t("egg.addNew")}
          </h1>
          <p className="text-muted-foreground">
            Record a new egg from one of your hens
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
            {error}
          </div>
        )}

        {/* Select Hen */}
        <Card className="card-warm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              <Bird className="h-5 w-5 text-pink-500" />
              Select Hen *
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedHen ? (
              <div className="flex items-center justify-between p-4 bg-pink-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center">
                    <Bird className="h-6 w-6 text-pink-600" />
                  </div>
                  <div>
                    <span className="font-semibold text-lg">{getDisplayId(selectedHen)}</span>
                    <p className="text-sm text-muted-foreground">{t("bird.sex.female")}</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedHen(null)
                    setFormData({ ...formData, henId: "" })
                  }}
                  className="text-red-500"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  value={henSearch}
                  onChange={(e) => {
                    setHenSearch(e.target.value)
                    searchHen(e.target.value)
                  }}
                  onFocus={() => setShowHenSearch(true)}
                  placeholder="Search for a hen by name or band number..."
                  className="pl-12 h-14 text-lg rounded-xl border-2 border-orange-100 focus:border-orange-300"
                />
                {showHenSearch && henResults.length > 0 && (
                  <Card className="absolute top-full left-0 right-0 mt-2 z-50 shadow-xl">
                    <CardContent className="p-2 max-h-64 overflow-y-auto">
                      {henResults.map((hen) => (
                        <button
                          key={hen.id}
                          type="button"
                          onClick={() => selectHen(hen)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-orange-50 rounded-xl text-left"
                        >
                          <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center">
                            <Bird className="h-5 w-5 text-pink-600" />
                          </div>
                          <span className="font-medium">{getDisplayId(hen)}</span>
                        </button>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Egg Details */}
        <Card className="card-warm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              <Egg className="h-5 w-5 text-amber-500" />
              Egg Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="layDate" className="text-base">{t("egg.date")} *</Label>
              <Input
                id="layDate"
                type="date"
                value={formData.layDate}
                onChange={(e) => setFormData({ ...formData, layDate: e.target.value })}
                className="mt-2 h-12 rounded-xl border-2 border-orange-100 focus:border-orange-300"
                required
              />
            </div>

            <div>
              <Label htmlFor="eggMark" className="text-base">{t("egg.mark")} (Optional)</Label>
              <Input
                id="eggMark"
                value={formData.eggMark}
                onChange={(e) => setFormData({ ...formData, eggMark: e.target.value })}
                placeholder="e.g., A1, B2, or any marking"
                className="mt-2 h-12 rounded-xl border-2 border-orange-100 focus:border-orange-300"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="weightGrams" className="text-base">{t("egg.weight")}</Label>
                <Input
                  id="weightGrams"
                  type="number"
                  value={formData.weightGrams}
                  onChange={(e) => setFormData({ ...formData, weightGrams: e.target.value })}
                  placeholder="Weight in grams"
                  className="mt-2 h-12 rounded-xl border-2 border-orange-100 focus:border-orange-300"
                />
              </div>

              <div>
                <Label htmlFor="shellQuality" className="text-base">{t("egg.quality")}</Label>
                <Select
                  value={formData.shellQuality}
                  onValueChange={(value) => setFormData({ ...formData, shellQuality: value })}
                >
                  <SelectTrigger className="mt-2 h-12 rounded-xl border-2 border-orange-100">
                    <SelectValue placeholder="Select quality" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GOOD">{t("egg.quality.good")}</SelectItem>
                    <SelectItem value="FAIR">{t("egg.quality.fair")}</SelectItem>
                    <SelectItem value="POOR">{t("egg.quality.poor")}</SelectItem>
                    <SelectItem value="SOFT">{t("egg.quality.soft")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-4">
          <Link href="/eggs" className="flex-1">
            <Button
              type="button"
              variant="outline"
              className="w-full h-14 rounded-xl border-2 border-orange-100 text-lg"
            >
              {t("action.cancel")}
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={saving || !formData.henId}
            className="flex-1 h-14 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-lg"
          >
            {saving ? t("common.loading") : t("action.save")}
          </Button>
        </div>
      </form>

      {/* Spacer for mobile bottom nav */}
      <div className="h-20 lg:hidden" />
    </div>
  )
}
