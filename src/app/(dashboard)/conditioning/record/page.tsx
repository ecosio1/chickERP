"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dumbbell,
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

interface ExerciseType {
  id: string
  name: string
  nameTl: string | null
}

function RecordExercisePageContent() {
  const { t, language } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedBirdId = searchParams.get("birdId")

  const [exerciseTypes, setExerciseTypes] = useState<ExerciseType[]>([])
  const [formData, setFormData] = useState({
    birdId: preselectedBirdId || "",
    exerciseTypeId: "",
    date: new Date().toISOString().split("T")[0],
    durationMinutes: "",
    intensity: "",
    notes: "",
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  // Bird search state
  const [birdSearch, setBirdSearch] = useState("")
  const [birdResults, setBirdResults] = useState<BirdSearchResult[]>([])
  const [selectedBird, setSelectedBird] = useState<BirdSearchResult | null>(null)
  const [showBirdSearch, setShowBirdSearch] = useState(false)

  useEffect(() => {
    async function fetchExerciseTypes() {
      try {
        const res = await fetch("/api/conditioning/types")
        if (res.ok) {
          const json = await res.json()
          setExerciseTypes(json.types || [])
        }
      } catch (error) {
        console.error("Failed to fetch exercise types:", error)
      }
    }
    fetchExerciseTypes()
  }, [])

  const searchBird = async (query: string) => {
    if (query.length < 2) {
      setBirdResults([])
      return
    }

    try {
      // Only search for males (roosters)
      const res = await fetch(`/api/birds/search?q=${encodeURIComponent(query)}&sex=MALE`)
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

  const getTypeName = (type: ExerciseType) => {
    return language === "tl" && type.nameTl ? type.nameTl : type.name
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.birdId) {
      setError("Please select a rooster")
      return
    }

    if (!formData.exerciseTypeId) {
      setError("Please select an exercise type")
      return
    }

    setSaving(true)

    try {
      const res = await fetch("/api/conditioning/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          birdId: formData.birdId,
          exerciseTypeId: formData.exerciseTypeId,
          date: formData.date,
          durationMinutes: formData.durationMinutes ? parseInt(formData.durationMinutes) : null,
          intensity: formData.intensity || null,
          notes: formData.notes || null,
        }),
      })

      if (res.ok) {
        if (preselectedBirdId) {
          router.push(`/birds/${preselectedBirdId}`)
        } else {
          router.push("/conditioning")
        }
      } else {
        const json = await res.json()
        setError(json.error || "Failed to record exercise")
      }
    } catch (err) {
      setError("Failed to record exercise")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto page-transition">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/conditioning">
          <Button variant="ghost" size="icon" className="rounded-xl">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
            {t("conditioning.record")}
          </h1>
          <p className="text-muted-foreground">
            Log an exercise session for a rooster
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
              <Bird className="h-5 w-5 text-blue-500" />
              Select Rooster *
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedBird ? (
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <Bird className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <span className="font-semibold text-lg">{getDisplayId(selectedBird)}</span>
                    <p className="text-sm text-muted-foreground">{t("bird.sex.male")}</p>
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
                  placeholder="Search for a rooster..."
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
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Bird className="h-5 w-5 text-blue-600" />
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

        {/* Exercise Details */}
        <Card className="card-warm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-orange-500" />
              Exercise Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="exerciseType" className="text-base">{t("conditioning.exerciseType")} *</Label>
              <Select
                value={formData.exerciseTypeId}
                onValueChange={(value) => setFormData({ ...formData, exerciseTypeId: value })}
              >
                <SelectTrigger className="mt-2 h-12 rounded-xl border-2 border-orange-100">
                  <SelectValue placeholder="Select exercise type" />
                </SelectTrigger>
                <SelectContent>
                  {exerciseTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {getTypeName(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {exerciseTypes.length === 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  No exercise types yet.{" "}
                  <Link href="/settings/exercises" className="text-orange-600 hover:underline">
                    Add some first
                  </Link>
                </p>
              )}
            </div>

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
                <Label htmlFor="duration" className="text-base">{t("conditioning.duration")}</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.durationMinutes}
                  onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                  placeholder="Minutes"
                  className="mt-2 h-12 rounded-xl border-2 border-orange-100 focus:border-orange-300"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="intensity" className="text-base">{t("conditioning.intensity")}</Label>
              <Select
                value={formData.intensity}
                onValueChange={(value) => setFormData({ ...formData, intensity: value })}
              >
                <SelectTrigger className="mt-2 h-12 rounded-xl border-2 border-orange-100">
                  <SelectValue placeholder="Select intensity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Light">{t("conditioning.intensity.light")}</SelectItem>
                  <SelectItem value="Medium">{t("conditioning.intensity.medium")}</SelectItem>
                  <SelectItem value="Hard">{t("conditioning.intensity.hard")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes" className="text-base">{t("bird.notes")} (Optional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any observations or notes..."
                className="mt-2 min-h-20 rounded-xl border-2 border-orange-100 focus:border-orange-300"
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-4">
          <Link href="/conditioning" className="flex-1">
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
            disabled={saving || !formData.birdId || !formData.exerciseTypeId}
            className="flex-1 h-14 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-lg"
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

export default function RecordExercisePage() {
  return (
    <Suspense fallback={<div className="p-4 lg:p-8"><div className="h-20 bg-orange-50 rounded-2xl animate-pulse" /></div>}>
      <RecordExercisePageContent />
    </Suspense>
  )
}
