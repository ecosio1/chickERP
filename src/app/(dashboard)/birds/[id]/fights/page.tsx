"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Trophy,
  ArrowLeft,
  Bird,
  Plus,
  Calendar,
  MapPin,
} from "lucide-react"
import { useLanguage } from "@/hooks/use-language"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface FightRecord {
  id: string
  date: string
  outcome: string
  location: string | null
  notes: string | null
}

interface BirdInfo {
  id: string
  name: string | null
  identifiers: Array<{ idType: string; idValue: string }>
}

export default function BirdFightsPage() {
  const { t } = useLanguage()
  const params = useParams()
  const router = useRouter()

  const [bird, setBird] = useState<BirdInfo | null>(null)
  const [fights, setFights] = useState<FightRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    outcome: "",
    location: "",
    notes: "",
  })

  useEffect(() => {
    async function fetchData() {
      try {
        const [birdRes, fightsRes] = await Promise.all([
          fetch(`/api/birds/${params.id}`),
          fetch(`/api/birds/${params.id}/fights`),
        ])

        if (birdRes.ok) {
          const birdJson = await birdRes.json()
          setBird(birdJson)
        }
        if (fightsRes.ok) {
          const fightsJson = await fightsRes.json()
          setFights(fightsJson.fights || [])
        }
      } catch (error) {
        console.error("Failed to fetch data:", error)
      } finally {
        setLoading(false)
      }
    }
    if (params.id) fetchData()
  }, [params.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.outcome) {
      setError("Please select an outcome")
      return
    }

    setSaving(true)

    try {
      const res = await fetch(`/api/birds/${params.id}/fights`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: formData.date,
          outcome: formData.outcome,
          location: formData.location || null,
          notes: formData.notes || null,
        }),
      })

      if (res.ok) {
        const newFight = await res.json()
        setFights([newFight, ...fights])
        setShowAddForm(false)
        setFormData({
          date: new Date().toISOString().split("T")[0],
          outcome: "",
          location: "",
          notes: "",
        })
      } else {
        const json = await res.json()
        setError(json.error || "Failed to record fight")
      }
    } catch (err) {
      setError("Failed to record fight")
    } finally {
      setSaving(false)
    }
  }

  const getDisplayId = () => {
    if (!bird) return ""
    return bird.identifiers[0]?.idValue || bird.name || bird.id.slice(-6)
  }

  const getOutcomeStyle = (outcome: string) => {
    switch (outcome) {
      case "WIN":
        return "bg-green-100 text-green-700 border-green-200"
      case "LOSS":
        return "bg-red-100 text-red-700 border-red-200"
      case "DRAW":
        return "bg-yellow-100 text-yellow-700 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  // Calculate stats
  const wins = fights.filter((f) => f.outcome === "WIN").length
  const losses = fights.filter((f) => f.outcome === "LOSS").length
  const draws = fights.filter((f) => f.outcome === "DRAW").length
  const total = fights.length
  const winPercentage = total > 0 ? Math.round((wins / total) * 100) : 0

  if (loading) {
    return (
      <div className="p-4 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-orange-100 rounded-xl w-48" />
          <div className="h-32 bg-orange-50 rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8 space-y-6 page-transition">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/birds/${params.id}`}>
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
              {t("fights.title")}
            </h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <Bird className="h-4 w-4" />
              {getDisplayId()}
            </p>
          </div>
        </div>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl"
        >
          <Plus className="h-5 w-5 mr-2" />
          {t("fights.addFight")}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="card-warm">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-green-600">{wins}</p>
            <p className="text-sm text-muted-foreground">{t("fights.outcome.win")}</p>
          </CardContent>
        </Card>
        <Card className="card-warm">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-red-600">{losses}</p>
            <p className="text-sm text-muted-foreground">{t("fights.outcome.loss")}</p>
          </CardContent>
        </Card>
        <Card className="card-warm">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-yellow-600">{draws}</p>
            <p className="text-sm text-muted-foreground">{t("fights.outcome.draw")}</p>
          </CardContent>
        </Card>
        <Card className="card-warm">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-gray-800">{winPercentage}%</p>
            <p className="text-sm text-muted-foreground">{t("fights.winPercentage")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Add Fight Form */}
      {showAddForm && (
        <Card className="card-warm border-2 border-orange-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-orange-500" />
              {t("fights.record")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date" className="text-base">{t("egg.date")} *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="mt-2 h-12 rounded-xl border-2 border-orange-100"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="outcome" className="text-base">{t("fights.outcome")} *</Label>
                  <Select
                    value={formData.outcome}
                    onValueChange={(value) => setFormData({ ...formData, outcome: value })}
                  >
                    <SelectTrigger className="mt-2 h-12 rounded-xl border-2 border-orange-100">
                      <SelectValue placeholder="Select outcome" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WIN">{t("fights.outcome.win")}</SelectItem>
                      <SelectItem value="LOSS">{t("fights.outcome.loss")}</SelectItem>
                      <SelectItem value="DRAW">{t("fights.outcome.draw")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="location" className="text-base">{t("fights.location")}</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Derby name or location"
                  className="mt-2 h-12 rounded-xl border-2 border-orange-100"
                />
              </div>

              <div>
                <Label htmlFor="notes" className="text-base">{t("bird.notes")}</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any notes about the fight..."
                  className="mt-2 rounded-xl border-2 border-orange-100"
                />
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 h-12 rounded-xl border-2 border-orange-100"
                >
                  {t("action.cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={saving || !formData.outcome}
                  className="flex-1 h-12 rounded-xl bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {saving ? t("common.loading") : t("action.save")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Fight History */}
      <Card className="card-warm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-700">
            Fight History ({total} {t("fights.totalFights").toLowerCase()})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {fights.length > 0 ? (
            <div className="space-y-3">
              {fights.map((fight) => (
                <div
                  key={fight.id}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-xl border-2",
                    getOutcomeStyle(fight.outcome)
                  )}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Trophy className={cn(
                        "h-5 w-5",
                        fight.outcome === "WIN" ? "text-green-600" :
                        fight.outcome === "LOSS" ? "text-red-600" :
                        "text-yellow-600"
                      )} />
                      <span className="font-bold text-lg">
                        {fight.outcome === "WIN" ? t("fights.outcome.win") :
                         fight.outcome === "LOSS" ? t("fights.outcome.loss") :
                         t("fights.outcome.draw")}
                      </span>
                    </div>
                    {fight.location && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {fight.location}
                      </p>
                    )}
                    {fight.notes && (
                      <p className="text-sm text-muted-foreground mt-1">{fight.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {new Date(fight.date).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Trophy className="h-12 w-12 mx-auto text-orange-200 mb-3" />
              <p className="text-muted-foreground mb-4">{t("common.noData")}</p>
              <Button
                onClick={() => setShowAddForm(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t("fights.addFight")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Spacer for mobile bottom nav */}
      <div className="h-20 lg:hidden" />
    </div>
  )
}
