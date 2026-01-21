"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Wheat,
  ArrowLeft,
  Plus,
  Trash2,
  Calendar,
} from "lucide-react"
import { useLanguage } from "@/hooks/use-language"

interface FeedStage {
  id: string
  name: string
  nameTl: string | null
  feedType: string
  minAgeDays: number
  maxAgeDays: number | null
  notes: string | null
}

const FEED_TYPES = [
  { value: "STARTER", label: "Starter" },
  { value: "GROWER", label: "Grower" },
  { value: "FINISHER", label: "Finisher" },
  { value: "BREEDER", label: "Breeder" },
  { value: "LAYER", label: "Layer" },
  { value: "SUPPLEMENT", label: "Supplement" },
]

export default function FeedStagesPage() {
  const { t, language } = useLanguage()
  const [stages, setStages] = useState<FeedStage[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    name: "",
    nameTl: "",
    feedType: "",
    minAgeDays: "",
    maxAgeDays: "",
    notes: "",
  })

  useEffect(() => {
    fetchStages()
  }, [])

  const fetchStages = async () => {
    try {
      const res = await fetch("/api/settings/feed-stages")
      if (res.ok) {
        const json = await res.json()
        setStages(json.stages || [])
      }
    } catch (error) {
      console.error("Failed to fetch feed stages:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.name.trim() || !formData.feedType || !formData.minAgeDays) {
      setError("Name, feed type, and min age are required")
      return
    }

    setSaving(true)

    try {
      const res = await fetch("/api/settings/feed-stages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          nameTl: formData.nameTl || null,
          feedType: formData.feedType,
          minAgeDays: formData.minAgeDays,
          maxAgeDays: formData.maxAgeDays || null,
          notes: formData.notes || null,
        }),
      })

      if (res.ok) {
        const newStage = await res.json()
        setStages([...stages, newStage].sort((a, b) => a.minAgeDays - b.minAgeDays))
        setShowAddForm(false)
        setFormData({ name: "", nameTl: "", feedType: "", minAgeDays: "", maxAgeDays: "", notes: "" })
      } else {
        const json = await res.json()
        setError(json.error || "Failed to add feed stage")
      }
    } catch (err) {
      setError("Failed to add feed stage")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this feed stage?")) return

    try {
      const res = await fetch(`/api/settings/feed-stages/${id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        setStages(stages.filter((s) => s.id !== id))
      }
    } catch (error) {
      console.error("Failed to delete:", error)
    }
  }

  const getStageName = (stage: FeedStage) => {
    return language === "tl" && stage.nameTl ? stage.nameTl : stage.name
  }

  const formatAgeRange = (stage: FeedStage) => {
    if (stage.maxAgeDays) {
      return `${stage.minAgeDays} - ${stage.maxAgeDays} days`
    }
    return `${stage.minAgeDays}+ days`
  }

  if (loading) {
    return (
      <div className="p-4 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-orange-100 rounded-xl w-48" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-orange-50 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8 space-y-6 page-transition">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/settings">
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
              {t("feedStage.title")}
            </h1>
            <p className="text-muted-foreground">
              Configure feed stages based on bird age
            </p>
          </div>
        </div>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Stage
        </Button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <Card className="card-warm border-2 border-orange-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              <Wheat className="h-5 w-5 text-orange-500" />
              New Feed Stage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-base">Stage Name (English) *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Chick Starter"
                    className="mt-2 h-12 rounded-xl border-2 border-orange-100"
                    required
                  />
                </div>

                <div>
                  <Label className="text-base">Stage Name (Tagalog)</Label>
                  <Input
                    value={formData.nameTl}
                    onChange={(e) => setFormData({ ...formData, nameTl: e.target.value })}
                    placeholder="e.g., Starter ng Sisiw"
                    className="mt-2 h-12 rounded-xl border-2 border-orange-100"
                  />
                </div>
              </div>

              <div>
                <Label className="text-base">Feed Type *</Label>
                <Select
                  value={formData.feedType}
                  onValueChange={(value) => setFormData({ ...formData, feedType: value })}
                >
                  <SelectTrigger className="mt-2 h-12 rounded-xl border-2 border-orange-100">
                    <SelectValue placeholder="Select feed type" />
                  </SelectTrigger>
                  <SelectContent>
                    {FEED_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-base">Min Age (days) *</Label>
                  <Input
                    type="number"
                    value={formData.minAgeDays}
                    onChange={(e) => setFormData({ ...formData, minAgeDays: e.target.value })}
                    placeholder="0"
                    className="mt-2 h-12 rounded-xl border-2 border-orange-100"
                    required
                  />
                </div>

                <div>
                  <Label className="text-base">Max Age (days)</Label>
                  <Input
                    type="number"
                    value={formData.maxAgeDays}
                    onChange={(e) => setFormData({ ...formData, maxAgeDays: e.target.value })}
                    placeholder="Leave empty for no limit"
                    className="mt-2 h-12 rounded-xl border-2 border-orange-100"
                  />
                </div>
              </div>

              <div>
                <Label className="text-base">Notes</Label>
                <Input
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional information about this stage"
                  className="mt-2 h-12 rounded-xl border-2 border-orange-100"
                />
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false)
                    setFormData({ name: "", nameTl: "", feedType: "", minAgeDays: "", maxAgeDays: "", notes: "" })
                    setError("")
                  }}
                  className="flex-1 h-12 rounded-xl border-2 border-orange-100"
                >
                  {t("action.cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex-1 h-12 rounded-xl bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {saving ? t("common.loading") : t("action.save")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Stages List */}
      <Card className="card-warm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-700">
            Feed Stages ({stages.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stages.length > 0 ? (
            <div className="space-y-2">
              {stages.map((stage) => (
                <div
                  key={stage.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-orange-50 hover:bg-orange-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                      <Wheat className="h-5 w-5 text-orange-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{getStageName(stage)}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="px-2 py-0.5 bg-orange-100 rounded-full text-xs font-medium">
                          {stage.feedType}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatAgeRange(stage)}
                        </span>
                      </div>
                      {stage.notes && (
                        <p className="text-xs text-muted-foreground mt-1">{stage.notes}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(stage.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Wheat className="h-12 w-12 mx-auto text-orange-200 mb-3" />
              <p className="text-muted-foreground mb-4">No feed stages configured yet</p>
              <Button
                onClick={() => setShowAddForm(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Stage
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Suggested Stages */}
      {stages.length === 0 && (
        <Card className="card-warm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-700">
              Recommended Feed Stages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Click to add standard sabong feed stages:
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { name: "Starter", nameTl: "Starter", feedType: "STARTER", minAgeDays: 0, maxAgeDays: 21 },
                { name: "Grower", nameTl: "Grower", feedType: "GROWER", minAgeDays: 22, maxAgeDays: 84 },
                { name: "Finisher", nameTl: "Finisher", feedType: "FINISHER", minAgeDays: 85, maxAgeDays: 150 },
                { name: "Breeder", nameTl: "Breeder", feedType: "BREEDER", minAgeDays: 151, maxAgeDays: null },
              ].map((suggestion) => (
                <Button
                  key={suggestion.name}
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      const res = await fetch("/api/settings/feed-stages", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(suggestion),
                      })
                      if (res.ok) {
                        fetchStages()
                      }
                    } catch (error) {
                      console.error("Failed to add:", error)
                    }
                  }}
                  className="rounded-xl border-2 border-orange-100 hover:bg-orange-50"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {suggestion.name} ({suggestion.minAgeDays}-{suggestion.maxAgeDays || "∞"} days)
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Spacer for mobile bottom nav */}
      <div className="h-20 lg:hidden" />
    </div>
  )
}
