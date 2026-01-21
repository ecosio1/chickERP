"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Palette,
  ArrowLeft,
  Plus,
  Trash2,
} from "lucide-react"
import { useLanguage } from "@/hooks/use-language"

interface BirdColor {
  id: string
  name: string
  nameTl: string | null
  hexCode: string | null
  description: string | null
}

export default function BirdColorsPage() {
  const { t, language } = useLanguage()
  const [colors, setColors] = useState<BirdColor[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    name: "",
    nameTl: "",
    hexCode: "#000000",
    description: "",
  })

  useEffect(() => {
    fetchColors()
  }, [])

  const fetchColors = async () => {
    try {
      const res = await fetch("/api/settings/bird-colors")
      if (res.ok) {
        const json = await res.json()
        setColors(json.colors || [])
      }
    } catch (error) {
      console.error("Failed to fetch bird colors:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.name.trim()) {
      setError("Color name is required")
      return
    }

    setSaving(true)

    try {
      const res = await fetch("/api/settings/bird-colors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        const newColor = await res.json()
        setColors([...colors, newColor].sort((a, b) => a.name.localeCompare(b.name)))
        setShowAddForm(false)
        setFormData({ name: "", nameTl: "", hexCode: "#000000", description: "" })
      } else {
        const json = await res.json()
        setError(json.error || "Failed to add color")
      }
    } catch (err) {
      setError("Failed to add color")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(language === "tl" ? "Sigurado ka bang gusto mong tanggalin ang kulay na ito?" : "Are you sure you want to delete this color?")) return

    try {
      const res = await fetch(`/api/settings/bird-colors/${id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        setColors(colors.filter((c) => c.id !== id))
      } else {
        const json = await res.json()
        alert(json.error || "Failed to delete")
      }
    } catch (error) {
      console.error("Failed to delete:", error)
    }
  }

  const getColorName = (color: BirdColor) => {
    return language === "tl" && color.nameTl ? color.nameTl : color.name
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
              {language === "tl" ? "Mga Kulay ng Manok" : "Bird Colors"}
            </h1>
            <p className="text-muted-foreground">
              {language === "tl" ? "Pamahalaan ang mga kulay ng balahibo" : "Manage plumage colors for your birds"}
            </p>
          </div>
        </div>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl"
        >
          <Plus className="h-5 w-5 mr-2" />
          {language === "tl" ? "Magdagdag ng Kulay" : "Add Color"}
        </Button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <Card className="card-warm border-2 border-orange-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              <Palette className="h-5 w-5 text-orange-500" />
              {language === "tl" ? "Bagong Kulay" : "New Color"}
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
                  <Label className="text-base">Color Name (English) *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Red"
                    className="mt-2 h-12 rounded-xl border-2 border-orange-100"
                    required
                  />
                </div>

                <div>
                  <Label className="text-base">Color Name (Tagalog)</Label>
                  <Input
                    value={formData.nameTl}
                    onChange={(e) => setFormData({ ...formData, nameTl: e.target.value })}
                    placeholder="e.g., Pula"
                    className="mt-2 h-12 rounded-xl border-2 border-orange-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-base">{language === "tl" ? "Kulay (Hex)" : "Color (Hex)"}</Label>
                  <div className="flex gap-2 mt-2">
                    <input
                      type="color"
                      value={formData.hexCode}
                      onChange={(e) => setFormData({ ...formData, hexCode: e.target.value })}
                      className="h-12 w-16 rounded-xl border-2 border-orange-100 cursor-pointer"
                    />
                    <Input
                      value={formData.hexCode}
                      onChange={(e) => setFormData({ ...formData, hexCode: e.target.value })}
                      placeholder="#000000"
                      className="h-12 rounded-xl border-2 border-orange-100 flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-base">{language === "tl" ? "Paglalarawan" : "Description"}</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder={language === "tl" ? "Opsyonal na paglalarawan" : "Optional description"}
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
                    setFormData({ name: "", nameTl: "", hexCode: "#000000", description: "" })
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

      {/* Colors List */}
      <Card className="card-warm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-700">
            {language === "tl" ? "Mga Kulay" : "Colors"} ({colors.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {colors.length > 0 ? (
            <div className="space-y-2">
              {colors.map((color) => (
                <div
                  key={color.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-orange-50 hover:bg-orange-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl border-2 border-white shadow-sm"
                      style={{ backgroundColor: color.hexCode || "#808080" }}
                    />
                    <div>
                      <p className="font-semibold text-gray-800">{getColorName(color)}</p>
                      {color.description && (
                        <p className="text-sm text-muted-foreground">{color.description}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(color.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Palette className="h-12 w-12 mx-auto text-orange-200 mb-3" />
              <p className="text-muted-foreground mb-4">
                {language === "tl" ? "Wala pang naka-configure na kulay" : "No colors configured yet"}
              </p>
              <Button
                onClick={() => setShowAddForm(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl"
              >
                <Plus className="h-4 w-4 mr-2" />
                {language === "tl" ? "Magdagdag ng Unang Kulay" : "Add Your First Color"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Suggested Colors */}
      {colors.length === 0 && (
        <Card className="card-warm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-700">
              {language === "tl" ? "Mga Inirerekomendang Kulay" : "Recommended Colors"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {language === "tl"
                ? "I-click para magdagdag ng karaniwang kulay ng manok:"
                : "Click to add common sabong colors:"}
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { name: "Red", nameTl: "Pula", hexCode: "#DC2626" },
                { name: "White", nameTl: "Puti", hexCode: "#F5F5F5" },
                { name: "Black", nameTl: "Itim", hexCode: "#1F2937" },
                { name: "Gray", nameTl: "Abo", hexCode: "#6B7280" },
                { name: "Brown", nameTl: "Kayumanggi", hexCode: "#92400E" },
                { name: "Gold", nameTl: "Ginto", hexCode: "#F59E0B" },
                { name: "Silver", nameTl: "Pilak", hexCode: "#9CA3AF" },
                { name: "Blue", nameTl: "Asul", hexCode: "#3B82F6" },
              ].map((suggestion) => (
                <Button
                  key={suggestion.name}
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      const res = await fetch("/api/settings/bird-colors", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(suggestion),
                      })
                      if (res.ok) {
                        fetchColors()
                      }
                    } catch (error) {
                      console.error("Failed to add:", error)
                    }
                  }}
                  className="rounded-xl border-2 border-orange-100 hover:bg-orange-50"
                >
                  <div
                    className="w-4 h-4 rounded-full mr-2 border"
                    style={{ backgroundColor: suggestion.hexCode }}
                  />
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
