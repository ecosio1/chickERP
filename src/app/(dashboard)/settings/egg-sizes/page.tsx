"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Egg,
  ArrowLeft,
  Plus,
  Trash2,
} from "lucide-react"
import { useLanguage } from "@/hooks/use-language"

interface EggSizeCategory {
  id: string
  name: string
  nameTl: string | null
  minWeightG: number | null
  maxWeightG: number | null
}

export default function EggSizesPage() {
  const { t, language } = useLanguage()
  const [categories, setCategories] = useState<EggSizeCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    name: "",
    nameTl: "",
    minWeightG: "",
    maxWeightG: "",
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/settings/egg-sizes")
      if (res.ok) {
        const json = await res.json()
        setCategories(json.categories || [])
      }
    } catch (error) {
      console.error("Failed to fetch egg sizes:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.name.trim()) {
      setError("Name is required")
      return
    }

    setSaving(true)

    try {
      const res = await fetch("/api/settings/egg-sizes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          nameTl: formData.nameTl || null,
          minWeightG: formData.minWeightG || null,
          maxWeightG: formData.maxWeightG || null,
        }),
      })

      if (res.ok) {
        const newCategory = await res.json()
        setCategories([...categories, newCategory])
        setShowAddForm(false)
        setFormData({ name: "", nameTl: "", minWeightG: "", maxWeightG: "" })
      } else {
        const json = await res.json()
        setError(json.error || "Failed to add egg size")
      }
    } catch (err) {
      setError("Failed to add egg size")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this egg size category?")) return

    try {
      const res = await fetch(`/api/settings/egg-sizes/${id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        setCategories(categories.filter((c) => c.id !== id))
      }
    } catch (error) {
      console.error("Failed to delete:", error)
    }
  }

  const getCategoryName = (category: EggSizeCategory) => {
    return language === "tl" && category.nameTl ? category.nameTl : category.name
  }

  if (loading) {
    return (
      <div className="p-4 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-orange-100 rounded-xl w-48" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
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
              {t("eggSize.title")}
            </h1>
            <p className="text-muted-foreground">
              Define egg size categories for classification
            </p>
          </div>
        </div>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Size
        </Button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <Card className="card-warm border-2 border-orange-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              <Egg className="h-5 w-5 text-orange-500" />
              New Egg Size Category
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
                  <Label htmlFor="name" className="text-base">Name (English) *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Small, Medium, Large"
                    className="mt-2 h-12 rounded-xl border-2 border-orange-100"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="nameTl" className="text-base">Name (Tagalog)</Label>
                  <Input
                    id="nameTl"
                    value={formData.nameTl}
                    onChange={(e) => setFormData({ ...formData, nameTl: e.target.value })}
                    placeholder="e.g., Maliit, Katamtaman, Malaki"
                    className="mt-2 h-12 rounded-xl border-2 border-orange-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minWeight" className="text-base">Min Weight (g)</Label>
                  <Input
                    id="minWeight"
                    type="number"
                    step="0.1"
                    value={formData.minWeightG}
                    onChange={(e) => setFormData({ ...formData, minWeightG: e.target.value })}
                    placeholder="e.g., 45"
                    className="mt-2 h-12 rounded-xl border-2 border-orange-100"
                  />
                </div>

                <div>
                  <Label htmlFor="maxWeight" className="text-base">Max Weight (g)</Label>
                  <Input
                    id="maxWeight"
                    type="number"
                    step="0.1"
                    value={formData.maxWeightG}
                    onChange={(e) => setFormData({ ...formData, maxWeightG: e.target.value })}
                    placeholder="e.g., 55"
                    className="mt-2 h-12 rounded-xl border-2 border-orange-100"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false)
                    setFormData({ name: "", nameTl: "", minWeightG: "", maxWeightG: "" })
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

      {/* Categories List */}
      <Card className="card-warm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-700">
            Egg Size Categories ({categories.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {categories.length > 0 ? (
            <div className="space-y-2">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-orange-50 hover:bg-orange-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Egg className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="font-semibold text-gray-800">{getCategoryName(category)}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {category.minWeightG !== null && category.maxWeightG !== null ? (
                          <span>{category.minWeightG}g - {category.maxWeightG}g</span>
                        ) : category.minWeightG !== null ? (
                          <span>Min: {category.minWeightG}g</span>
                        ) : category.maxWeightG !== null ? (
                          <span>Max: {category.maxWeightG}g</span>
                        ) : (
                          <span>No weight range set</span>
                        )}
                      </div>
                      {category.nameTl && language === "en" && (
                        <p className="text-xs text-muted-foreground">Tagalog: {category.nameTl}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(category.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Egg className="h-12 w-12 mx-auto text-orange-200 mb-3" />
              <p className="text-muted-foreground mb-4">No egg size categories yet</p>
              <Button
                onClick={() => setShowAddForm(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Size
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Common Sizes Suggestions */}
      {categories.length === 0 && (
        <Card className="card-warm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-700">
              Common Egg Sizes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Click to add standard egg size categories:
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { name: "Small", nameTl: "Maliit", minWeightG: 35, maxWeightG: 44 },
                { name: "Medium", nameTl: "Katamtaman", minWeightG: 45, maxWeightG: 54 },
                { name: "Large", nameTl: "Malaki", minWeightG: 55, maxWeightG: 64 },
                { name: "Extra Large", nameTl: "Sobrang Laki", minWeightG: 65, maxWeightG: 74 },
                { name: "Jumbo", nameTl: "Jumbo", minWeightG: 75, maxWeightG: null },
              ].map((suggestion) => (
                <Button
                  key={suggestion.name}
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      const res = await fetch("/api/settings/egg-sizes", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(suggestion),
                      })
                      if (res.ok) {
                        fetchCategories()
                      }
                    } catch (error) {
                      console.error("Failed to add:", error)
                    }
                  }}
                  className="rounded-xl border-2 border-orange-100 hover:bg-orange-50"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {suggestion.name}
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
