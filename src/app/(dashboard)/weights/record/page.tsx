"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Scale,
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

interface BirdSearchResult {
  id: string
  name: string | null
  sex: string
  identifiers: Array<{ idType: string; idValue: string }>
}

export default function RecordWeightPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedBirdId = searchParams.get("birdId")

  const [formData, setFormData] = useState({
    birdId: preselectedBirdId || "",
    date: new Date().toISOString().split("T")[0],
    weightGrams: "",
    milestone: "",
    notes: "",
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  // Bird search state
  const [birdSearch, setBirdSearch] = useState("")
  const [birdResults, setBirdResults] = useState<BirdSearchResult[]>([])
  const [selectedBird, setSelectedBird] = useState<BirdSearchResult | null>(null)
  const [showBirdSearch, setShowBirdSearch] = useState(false)

  const searchBird = async (query: string) => {
    if (query.length < 2) {
      setBirdResults([])
      return
    }

    try {
      const res = await fetch(`/api/birds/search?q=${encodeURIComponent(query)}`)
      if (res.ok) {
        const json = await res.json()
        setBirdResults(json.results || [])
      }
    } catch (error) {
      console.error("Bird search failed:", error)
    }
  }

  const selectBird = (bird: BirdSearchResult) => {
    setSelectedBird(bird)
    setFormData({ ...formData, birdId: bird.id })
    setBirdSearch("")
    setBirdResults([])
    setShowBirdSearch(false)
  }

  const getDisplayId = (bird: BirdSearchResult) => {
    return bird.identifiers[0]?.idValue || bird.name || bird.id.slice(-6)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.birdId) {
      setError("Please select a bird")
      return
    }

    if (!formData.weightGrams) {
      setError("Please enter weight")
      return
    }

    setSaving(true)

    try {
      const res = await fetch("/api/weights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          birdId: formData.birdId,
          date: formData.date,
          weightGrams: parseFloat(formData.weightGrams),
          milestone: formData.milestone || null,
          notes: formData.notes || null,
        }),
      })

      if (res.ok) {
        if (preselectedBirdId) {
          router.push(`/birds/${preselectedBirdId}`)
        } else {
          router.push("/birds")
        }
      } else {
        const json = await res.json()
        setError(json.error || "Failed to record weight")
      }
    } catch (err) {
      setError("Failed to record weight")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto page-transition">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/birds">
          <Button variant="ghost" size="icon" className="rounded-xl">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
            {t("weight.record")}
          </h1>
          <p className="text-muted-foreground">
            Record weight for a bird
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
            {error}
          </div>
        )}

        {/* Select Bird */}
        <Card className="card-warm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              <Bird className="h-5 w-5 text-orange-500" />
              Select Bird *
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedBird ? (
              <div className="flex items-center justify-between p-4 bg-orange-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    selectedBird.sex === "MALE" ? "bg-blue-100" : selectedBird.sex === "FEMALE" ? "bg-pink-100" : "bg-gray-100"
                  }`}>
                    <Bird className={`h-6 w-6 ${
                      selectedBird.sex === "MALE" ? "text-blue-600" : selectedBird.sex === "FEMALE" ? "text-pink-600" : "text-gray-600"
                    }`} />
                  </div>
                  <div>
                    <span className="font-semibold text-lg">{getDisplayId(selectedBird)}</span>
                    <p className="text-sm text-muted-foreground">
                      {selectedBird.sex === "MALE" ? t("bird.sex.male") : selectedBird.sex === "FEMALE" ? t("bird.sex.female") : t("bird.sex.unknown")}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedBird(null)
                    setFormData({ ...formData, birdId: "" })
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
                  value={birdSearch}
                  onChange={(e) => {
                    setBirdSearch(e.target.value)
                    searchBird(e.target.value)
                  }}
                  onFocus={() => setShowBirdSearch(true)}
                  placeholder="Search for a bird by name or band number..."
                  className="pl-12 h-14 text-lg rounded-xl border-2 border-orange-100 focus:border-orange-300"
                />
                {showBirdSearch && birdResults.length > 0 && (
                  <Card className="absolute top-full left-0 right-0 mt-2 z-50 shadow-xl">
                    <CardContent className="p-2 max-h-64 overflow-y-auto">
                      {birdResults.map((bird) => (
                        <button
                          key={bird.id}
                          type="button"
                          onClick={() => selectBird(bird)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-orange-50 rounded-xl text-left"
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            bird.sex === "MALE" ? "bg-blue-100" : bird.sex === "FEMALE" ? "bg-pink-100" : "bg-gray-100"
                          }`}>
                            <Bird className={`h-5 w-5 ${
                              bird.sex === "MALE" ? "text-blue-600" : bird.sex === "FEMALE" ? "text-pink-600" : "text-gray-600"
                            }`} />
                          </div>
                          <span className="font-medium">{getDisplayId(bird)}</span>
                        </button>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weight Details */}
        <Card className="card-warm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              <Scale className="h-5 w-5 text-green-500" />
              Weight Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date" className="text-base">{t("egg.date")} *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="mt-2 h-12 rounded-xl border-2 border-orange-100 focus:border-orange-300"
                  required
                />
              </div>

              <div>
                <Label htmlFor="weightGrams" className="text-base">{t("weight.grams")} *</Label>
                <Input
                  id="weightGrams"
                  type="number"
                  value={formData.weightGrams}
                  onChange={(e) => setFormData({ ...formData, weightGrams: e.target.value })}
                  placeholder="Enter weight"
                  className="mt-2 h-12 rounded-xl border-2 border-orange-100 focus:border-orange-300"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="milestone" className="text-base">{t("weight.milestone")} (Optional)</Label>
              <Select
                value={formData.milestone}
                onValueChange={(value) => setFormData({ ...formData, milestone: value })}
              >
                <SelectTrigger className="mt-2 h-12 rounded-xl border-2 border-orange-100">
                  <SelectValue placeholder="Select milestone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HATCH">Hatch</SelectItem>
                  <SelectItem value="WEEK_1">Week 1</SelectItem>
                  <SelectItem value="WEEK_2">Week 2</SelectItem>
                  <SelectItem value="WEEK_4">Week 4</SelectItem>
                  <SelectItem value="WEEK_6">Week 6</SelectItem>
                  <SelectItem value="WEEK_8">Week 8</SelectItem>
                  <SelectItem value="WEEK_12">Week 12</SelectItem>
                  <SelectItem value="WEEK_16">Week 16</SelectItem>
                  <SelectItem value="WEEK_20">Week 20</SelectItem>
                  <SelectItem value="ADULT">Adult</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes" className="text-base">{t("bird.notes")} (Optional)</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any notes about this weight"
                className="mt-2 h-12 rounded-xl border-2 border-orange-100 focus:border-orange-300"
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-4">
          <Link href="/birds" className="flex-1">
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
            disabled={saving || !formData.birdId || !formData.weightGrams}
            className="flex-1 h-14 rounded-xl bg-green-500 hover:bg-green-600 text-white text-lg"
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
