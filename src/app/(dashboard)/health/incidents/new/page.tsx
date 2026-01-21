"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertTriangle,
  ArrowLeft,
  Bird,
  Search,
  X,
  Plus,
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

export default function NewHealthIncidentPage() {
  const { t } = useLanguage()
  const router = useRouter()

  const [formData, setFormData] = useState({
    dateNoticed: new Date().toISOString().split("T")[0],
    symptoms: "",
    diagnosis: "",
    treatment: "",
    outcome: "ONGOING",
    notes: "",
  })
  const [selectedBirds, setSelectedBirds] = useState<BirdSearchResult[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  // Bird search state
  const [birdSearch, setBirdSearch] = useState("")
  const [birdResults, setBirdResults] = useState<BirdSearchResult[]>([])
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
        // Filter out already selected birds
        const filtered = (json.results || []).filter(
          (b: BirdSearchResult) => !selectedBirds.find((sb) => sb.id === b.id)
        )
        setBirdResults(filtered)
      }
    } catch (error) {
      console.error("Bird search failed:", error)
    }
  }

  const addBird = (bird: BirdSearchResult) => {
    setSelectedBirds([...selectedBirds, bird])
    setBirdSearch("")
    setBirdResults([])
    setShowBirdSearch(false)
  }

  const removeBird = (birdId: string) => {
    setSelectedBirds(selectedBirds.filter((b) => b.id !== birdId))
  }

  const getDisplayId = (bird: BirdSearchResult) => {
    return bird.identifiers[0]?.idValue || bird.name || bird.id.slice(-6)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (selectedBirds.length === 0) {
      setError("Please select at least one bird")
      return
    }

    if (!formData.symptoms.trim()) {
      setError("Please describe the symptoms")
      return
    }

    setSaving(true)

    try {
      const res = await fetch("/api/health/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          birdIds: selectedBirds.map((b) => b.id),
        }),
      })

      if (res.ok) {
        router.push("/health")
      } else {
        const json = await res.json()
        setError(json.error || "Failed to record health incident")
      }
    } catch (err) {
      setError("Failed to record health incident")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto page-transition">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/health">
          <Button variant="ghost" size="icon" className="rounded-xl">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
            Record Health Issue
          </h1>
          <p className="text-muted-foreground">
            Track illness or health problems
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
            {error}
          </div>
        )}

        {/* Select Birds */}
        <Card className="card-warm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              <Bird className="h-5 w-5 text-orange-500" />
              Affected Birds *
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Selected birds */}
            {selectedBirds.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedBirds.map((bird) => (
                  <div
                    key={bird.id}
                    className="flex items-center gap-2 px-3 py-2 bg-orange-100 rounded-xl"
                  >
                    <Bird className={`h-4 w-4 ${
                      bird.sex === "MALE" ? "text-blue-600" : bird.sex === "FEMALE" ? "text-pink-600" : "text-gray-600"
                    }`} />
                    <span className="font-medium">{getDisplayId(bird)}</span>
                    <button
                      type="button"
                      onClick={() => removeBird(bird.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                value={birdSearch}
                onChange={(e) => {
                  setBirdSearch(e.target.value)
                  searchBird(e.target.value)
                }}
                onFocus={() => setShowBirdSearch(true)}
                placeholder="Search to add birds..."
                className="pl-12 h-12 rounded-xl border-2 border-orange-100 focus:border-orange-300"
              />
              {showBirdSearch && birdResults.length > 0 && (
                <Card className="absolute top-full left-0 right-0 mt-2 z-50 shadow-xl">
                  <CardContent className="p-2 max-h-48 overflow-y-auto">
                    {birdResults.map((bird) => (
                      <button
                        key={bird.id}
                        type="button"
                        onClick={() => addBird(bird)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-orange-50 rounded-xl text-left"
                      >
                        <Plus className="h-4 w-4 text-green-500" />
                        <Bird className={`h-5 w-5 ${
                          bird.sex === "MALE" ? "text-blue-600" : bird.sex === "FEMALE" ? "text-pink-600" : "text-gray-600"
                        }`} />
                        <span className="font-medium">{getDisplayId(bird)}</span>
                      </button>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Incident Details */}
        <Card className="card-warm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Incident Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="dateNoticed" className="text-base">Date Noticed *</Label>
              <Input
                id="dateNoticed"
                type="date"
                value={formData.dateNoticed}
                onChange={(e) => setFormData({ ...formData, dateNoticed: e.target.value })}
                className="mt-2 h-12 rounded-xl border-2 border-orange-100 focus:border-orange-300"
                required
              />
            </div>

            <div>
              <Label htmlFor="symptoms" className="text-base">{t("health.symptoms")} *</Label>
              <Textarea
                id="symptoms"
                value={formData.symptoms}
                onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                placeholder="Describe what you observed..."
                className="mt-2 min-h-24 rounded-xl border-2 border-orange-100 focus:border-orange-300"
                required
              />
            </div>

            <div>
              <Label htmlFor="diagnosis" className="text-base">{t("health.diagnosis")} (Optional)</Label>
              <Input
                id="diagnosis"
                value={formData.diagnosis}
                onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                placeholder="Identified condition or disease"
                className="mt-2 h-12 rounded-xl border-2 border-orange-100 focus:border-orange-300"
              />
            </div>

            <div>
              <Label htmlFor="treatment" className="text-base">{t("health.treatment")} (Optional)</Label>
              <Textarea
                id="treatment"
                value={formData.treatment}
                onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
                placeholder="What treatment was given?"
                className="mt-2 min-h-20 rounded-xl border-2 border-orange-100 focus:border-orange-300"
              />
            </div>

            <div>
              <Label htmlFor="outcome" className="text-base">{t("health.outcome")}</Label>
              <Select
                value={formData.outcome}
                onValueChange={(value) => setFormData({ ...formData, outcome: value })}
              >
                <SelectTrigger className="mt-2 h-12 rounded-xl border-2 border-orange-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ONGOING">{t("health.outcome.ongoing")}</SelectItem>
                  <SelectItem value="RECOVERED">{t("health.outcome.recovered")}</SelectItem>
                  <SelectItem value="DECEASED">{t("health.outcome.deceased")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes" className="text-base">{t("bird.notes")} (Optional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes..."
                className="mt-2 min-h-20 rounded-xl border-2 border-orange-100 focus:border-orange-300"
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-4">
          <Link href="/health" className="flex-1">
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
            disabled={saving || selectedBirds.length === 0}
            className="flex-1 h-14 rounded-xl bg-red-500 hover:bg-red-600 text-white text-lg"
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
