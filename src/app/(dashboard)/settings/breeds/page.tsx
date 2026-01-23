"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dna,
  ArrowLeft,
  Plus,
  Trash2,
  Building2,
  Pencil,
} from "lucide-react"
import { useLanguage } from "@/hooks/use-language"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface SourceFarm {
  id: string
  name: string
}

interface Breed {
  id: string
  name: string
  code: string
  description: string | null
  sourceFarms: SourceFarm[]
}

export default function BreedsPage() {
  const { language } = useLanguage()
  const [breeds, setBreeds] = useState<Breed[]>([])
  const [sourceFarms, setSourceFarms] = useState<SourceFarm[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  // Edit farm links dialog state
  const [editingBreed, setEditingBreed] = useState<Breed | null>(null)
  const [selectedFarmIds, setSelectedFarmIds] = useState<string[]>([])
  const [savingFarms, setSavingFarms] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    sourceFarmIds: [] as string[],
  })

  useEffect(() => {
    fetchBreeds()
    fetchSourceFarms()
  }, [])

  const fetchBreeds = async () => {
    try {
      const res = await fetch("/api/breeds")
      if (res.ok) {
        const data = await res.json()
        setBreeds(data || [])
      }
    } catch (error) {
      console.error("Failed to fetch breeds:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSourceFarms = async () => {
    try {
      const res = await fetch("/api/settings/source-farms")
      if (res.ok) {
        const data = await res.json()
        setSourceFarms(data.farms || [])
      }
    } catch (error) {
      console.error("Failed to fetch source farms:", error)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.name.trim()) {
      setError("Breed name is required")
      return
    }

    if (!formData.code.trim()) {
      setError("Breed code is required")
      return
    }

    setSaving(true)

    try {
      const res = await fetch("/api/breeds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          code: formData.code,
          description: formData.description,
          sourceFarmIds: formData.sourceFarmIds,
        }),
      })

      if (res.ok) {
        const newBreed = await res.json()
        setBreeds([...breeds, newBreed].sort((a, b) => a.name.localeCompare(b.name)))
        setShowAddForm(false)
        setFormData({ name: "", code: "", description: "", sourceFarmIds: [] })
      } else {
        const json = await res.json()
        setError(json.error || "Failed to add breed")
      }
    } catch (err) {
      setError("Failed to add breed")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(language === "tl" ? "Sigurado ka bang gusto mong tanggalin ang breed na ito?" : "Are you sure you want to delete this breed?")) return

    try {
      const res = await fetch(`/api/breeds/${id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        setBreeds(breeds.filter((b) => b.id !== id))
      }
    } catch (error) {
      console.error("Failed to delete breed:", error)
    }
  }

  const openEditFarmsDialog = (breed: Breed) => {
    setEditingBreed(breed)
    setSelectedFarmIds(breed.sourceFarms.map((f) => f.id))
  }

  const handleSaveFarms = async () => {
    if (!editingBreed) return

    setSavingFarms(true)
    try {
      const res = await fetch(`/api/breeds/${editingBreed.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceFarmIds: selectedFarmIds }),
      })

      if (res.ok) {
        const updatedBreed = await res.json()
        setBreeds(breeds.map((b) => (b.id === editingBreed.id ? updatedBreed : b)))
        setEditingBreed(null)
      }
    } catch (error) {
      console.error("Failed to update farm links:", error)
    } finally {
      setSavingFarms(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4 lg:p-8 max-w-2xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-orange-100 rounded-xl w-32" />
          <div className="h-32 bg-orange-50 rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto page-transition">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/settings">
          <Button variant="ghost" size="icon" className="rounded-xl">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
            Breeds
          </h1>
          <p className="text-muted-foreground">
            Manage chicken breeds for your flock
          </p>
        </div>
      </div>

      {/* Add Button */}
      {!showAddForm && (
        <Button
          onClick={() => setShowAddForm(true)}
          className="w-full mb-6 h-12 rounded-xl bg-orange-500 hover:bg-orange-600"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Breed
        </Button>
      )}

      {/* Add Form */}
      {showAddForm && (
        <Card className="card-warm mb-6">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              <Dna className="h-5 w-5 text-purple-500" />
              Add New Breed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                  {error}
                </div>
              )}

              <div>
                <Label htmlFor="name">Breed Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Rhode Island Red"
                  className="mt-2 h-12 rounded-xl border-2 border-orange-100 focus:border-orange-300"
                />
              </div>

              <div>
                <Label htmlFor="code">Short Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. RIR"
                  maxLength={10}
                  className="mt-2 h-12 rounded-xl border-2 border-orange-100 focus:border-orange-300 uppercase"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  A short code (max 10 characters) for quick identification
                </p>
              </div>

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the breed..."
                  className="mt-2 rounded-xl border-2 border-orange-100 focus:border-orange-300"
                />
              </div>

              {sourceFarms.length > 0 && (
                <div>
                  <Label>Source Farms (Optional)</Label>
                  <div className="mt-2 space-y-2 p-3 bg-orange-50 rounded-xl">
                    {sourceFarms.map((farm) => (
                      <div key={farm.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`farm-${farm.id}`}
                          checked={formData.sourceFarmIds.includes(farm.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData({
                                ...formData,
                                sourceFarmIds: [...formData.sourceFarmIds, farm.id],
                              })
                            } else {
                              setFormData({
                                ...formData,
                                sourceFarmIds: formData.sourceFarmIds.filter((id) => id !== farm.id),
                              })
                            }
                          }}
                        />
                        <label
                          htmlFor={`farm-${farm.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {farm.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false)
                    setFormData({ name: "", code: "", description: "", sourceFarmIds: [] })
                    setError("")
                  }}
                  className="flex-1 h-12 rounded-xl border-2 border-orange-100"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex-1 h-12 rounded-xl bg-orange-500 hover:bg-orange-600"
                >
                  {saving ? "Saving..." : "Add Breed"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Breeds List */}
      <Card className="card-warm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-700">
            {breeds.length} {breeds.length === 1 ? "Breed" : "Breeds"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {breeds.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Dna className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No breeds added yet</p>
              <p className="text-sm">Add breeds to track your flock&apos;s genetics</p>
            </div>
          ) : (
            <div className="space-y-2">
              {breeds.map((breed) => (
                <div
                  key={breed.id}
                  className="p-3 bg-white rounded-xl border border-orange-100"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                        <span className="text-sm font-bold text-purple-600">
                          {breed.code.slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{breed.name}</p>
                        <p className="text-sm text-muted-foreground">{breed.code}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {sourceFarms.length > 0 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditFarmsDialog(breed)}
                          className="text-teal-600 hover:bg-teal-50"
                          title="Edit source farms"
                        >
                          <Building2 className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(breed.id)}
                        className="text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {breed.sourceFarms && breed.sourceFarms.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1 pl-13">
                      {breed.sourceFarms.map((farm) => (
                        <span
                          key={farm.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-100 text-teal-700 text-xs rounded-full"
                        >
                          <Building2 className="h-3 w-3" />
                          {farm.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Farm Links Dialog */}
      <Dialog open={!!editingBreed} onOpenChange={(open) => !open && setEditingBreed(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-teal-600" />
              {language === "tl" ? "I-edit ang Source Farms" : "Edit Source Farms"}
            </DialogTitle>
            <DialogDescription>
              {language === "tl"
                ? `Piliin ang mga farm kung saan nagmula ang ${editingBreed?.name}`
                : `Select the farms where ${editingBreed?.name} is sourced from`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-4">
            {sourceFarms.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {language === "tl"
                  ? "Walang source farm pa. Magdagdag muna sa Settings."
                  : "No source farms yet. Add some in Settings first."}
              </p>
            ) : (
              sourceFarms.map((farm) => (
                <div key={farm.id} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-orange-50">
                  <Checkbox
                    id={`edit-farm-${farm.id}`}
                    checked={selectedFarmIds.includes(farm.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedFarmIds([...selectedFarmIds, farm.id])
                      } else {
                        setSelectedFarmIds(selectedFarmIds.filter((id) => id !== farm.id))
                      }
                    }}
                  />
                  <label
                    htmlFor={`edit-farm-${farm.id}`}
                    className="flex-1 text-sm font-medium leading-none cursor-pointer"
                  >
                    {farm.name}
                  </label>
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingBreed(null)}
              className="rounded-xl"
            >
              {language === "tl" ? "Kanselahin" : "Cancel"}
            </Button>
            <Button
              onClick={handleSaveFarms}
              disabled={savingFarms}
              className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl"
            >
              {savingFarms
                ? language === "tl" ? "Nagse-save..." : "Saving..."
                : language === "tl" ? "I-save" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
