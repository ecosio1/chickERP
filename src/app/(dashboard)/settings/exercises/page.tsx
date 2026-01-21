"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dumbbell,
  ArrowLeft,
  Plus,
  Trash2,
  Edit,
  Check,
  X,
} from "lucide-react"
import { useLanguage } from "@/hooks/use-language"

interface ExerciseType {
  id: string
  name: string
  nameTl: string | null
  description: string | null
  isActive: boolean
}

export default function ExerciseTypesPage() {
  const { t, language } = useLanguage()
  const [exerciseTypes, setExerciseTypes] = useState<ExerciseType[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    name: "",
    nameTl: "",
    description: "",
  })

  useEffect(() => {
    fetchExerciseTypes()
  }, [])

  const fetchExerciseTypes = async () => {
    try {
      const res = await fetch("/api/conditioning/types")
      if (res.ok) {
        const json = await res.json()
        setExerciseTypes(json.types || [])
      }
    } catch (error) {
      console.error("Failed to fetch exercise types:", error)
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
      const res = await fetch("/api/conditioning/types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          nameTl: formData.nameTl || null,
          description: formData.description || null,
        }),
      })

      if (res.ok) {
        const newType = await res.json()
        setExerciseTypes([...exerciseTypes, newType])
        setShowAddForm(false)
        setFormData({ name: "", nameTl: "", description: "" })
      } else {
        const json = await res.json()
        setError(json.error || "Failed to add exercise type")
      }
    } catch (err) {
      setError("Failed to add exercise type")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this exercise type?")) return

    try {
      const res = await fetch(`/api/conditioning/types/${id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        setExerciseTypes(exerciseTypes.filter((t) => t.id !== id))
      }
    } catch (error) {
      console.error("Failed to delete:", error)
    }
  }

  const getTypeName = (type: ExerciseType) => {
    return language === "tl" && type.nameTl ? type.nameTl : type.name
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
              {t("conditioning.exerciseType")}
            </h1>
            <p className="text-muted-foreground">
              Manage your exercise types for conditioning
            </p>
          </div>
        </div>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Type
        </Button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <Card className="card-warm border-2 border-orange-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-orange-500" />
              New Exercise Type
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
                    placeholder="e.g., Sparring"
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
                    placeholder="e.g., Sparring"
                    className="mt-2 h-12 rounded-xl border-2 border-orange-100"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description" className="text-base">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this exercise"
                  className="mt-2 h-12 rounded-xl border-2 border-orange-100"
                />
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false)
                    setFormData({ name: "", nameTl: "", description: "" })
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

      {/* Exercise Types List */}
      <Card className="card-warm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-700">
            Exercise Types ({exerciseTypes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {exerciseTypes.length > 0 ? (
            <div className="space-y-2">
              {exerciseTypes.map((type) => (
                <div
                  key={type.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-orange-50 hover:bg-orange-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Dumbbell className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="font-semibold text-gray-800">{getTypeName(type)}</p>
                      {type.description && (
                        <p className="text-sm text-muted-foreground">{type.description}</p>
                      )}
                      {type.nameTl && language === "en" && (
                        <p className="text-xs text-muted-foreground">Tagalog: {type.nameTl}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(type.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Dumbbell className="h-12 w-12 mx-auto text-orange-200 mb-3" />
              <p className="text-muted-foreground mb-4">No exercise types yet</p>
              <Button
                onClick={() => setShowAddForm(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Type
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Common Types Suggestions */}
      {exerciseTypes.length === 0 && (
        <Card className="card-warm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-700">
              Common Exercise Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Click to add common exercise types:
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { name: "Sparring", nameTl: "Sparring" },
                { name: "Running", nameTl: "Pagtakbo" },
                { name: "Cord Work", nameTl: "Cord Work" },
                { name: "Flying", nameTl: "Paglipad" },
                { name: "Scratch Box", nameTl: "Scratch Box" },
                { name: "Rest Day", nameTl: "Pahinga" },
              ].map((suggestion) => (
                <Button
                  key={suggestion.name}
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      const res = await fetch("/api/conditioning/types", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(suggestion),
                      })
                      if (res.ok) {
                        fetchExerciseTypes()
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
