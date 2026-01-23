"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Plus, Trash2, Building2, X } from "lucide-react"
import { useLanguage } from "@/hooks/use-language"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface SourceFarm {
  id: string
  name: string
  _count: {
    breeds: number
  }
}

export default function SourceFarmsPage() {
  const { language } = useLanguage()
  const [farms, setFarms] = useState<SourceFarm[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ name: "" })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchFarms()
  }, [])

  const fetchFarms = async () => {
    try {
      const res = await fetch("/api/settings/source-farms")
      if (res.ok) {
        const data = await res.json()
        setFarms(data.farms || [])
      }
    } catch (error) {
      console.error("Failed to fetch farms:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      setError(language === "tl" ? "Kailangan ang pangalan" : "Name is required")
      return
    }

    setSaving(true)
    setError("")

    try {
      const res = await fetch("/api/settings/source-farms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formData.name.trim() }),
      })

      if (res.ok) {
        setFormData({ name: "" })
        setShowForm(false)
        fetchFarms()
      } else {
        const data = await res.json()
        setError(data.error || "Failed to add farm")
      }
    } catch (err) {
      setError("Failed to add farm")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/settings/source-farms/${id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        fetchFarms()
      }
    } catch (error) {
      console.error("Failed to delete farm:", error)
    }
  }

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto page-transition">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/settings">
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
              {language === "tl" ? "Mga Pinagmulang Farm" : "Source Farms"}
            </h1>
            <p className="text-muted-foreground">
              {language === "tl"
                ? "Pamahalaan ang mga farm kung saan nagmula ang mga breed"
                : "Manage farms where breeds are sourced from"}
            </p>
          </div>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4 mr-2" />}
          {showForm ? "" : language === "tl" ? "Magdagdag" : "Add Farm"}
        </Button>
      </div>

      {/* Add Form */}
      {showForm && (
        <Card className="card-warm mb-6">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-700">
              {language === "tl" ? "Bagong Source Farm" : "New Source Farm"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                  {error}
                </div>
              )}

              <div>
                <Label htmlFor="name">
                  {language === "tl" ? "Pangalan ng Farm" : "Farm Name"}
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ name: e.target.value })}
                  placeholder={language === "tl" ? "Halimbawa: Farm ni Juan" : "e.g., Juan's Farm"}
                  className="mt-2 h-12 rounded-xl border-2 border-orange-100 focus:border-orange-300"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false)
                    setFormData({ name: "" })
                    setError("")
                  }}
                  className="flex-1 rounded-xl"
                >
                  {language === "tl" ? "Kanselahin" : "Cancel"}
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-xl"
                >
                  {saving
                    ? language === "tl" ? "Nagse-save..." : "Saving..."
                    : language === "tl" ? "I-save" : "Save"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Farms List */}
      <Card className="card-warm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-700 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-orange-500" />
            {language === "tl" ? "Mga Source Farm" : "Source Farms"}
            <span className="text-sm font-normal text-muted-foreground">
              ({farms.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              {language === "tl" ? "Naglo-load..." : "Loading..."}
            </div>
          ) : farms.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 mx-auto text-orange-200 mb-3" />
              <p className="text-muted-foreground">
                {language === "tl"
                  ? "Walang source farm pa. Magdagdag ng isa!"
                  : "No source farms yet. Add one!"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {farms.map((farm) => (
                <div
                  key={farm.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-orange-50 hover:bg-orange-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{farm.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {farm._count.breeds}{" "}
                        {farm._count.breeds === 1
                          ? language === "tl" ? "breed" : "breed"
                          : language === "tl" ? "mga breed" : "breeds"}
                      </p>
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {language === "tl" ? "I-delete ang farm?" : "Delete farm?"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {language === "tl"
                            ? `Sigurado ka bang gusto mong i-delete ang "${farm.name}"? Maaalis ito sa lahat ng breed na naka-link dito.`
                            : `Are you sure you want to delete "${farm.name}"? This will remove it from all linked breeds.`}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>
                          {language === "tl" ? "Kanselahin" : "Cancel"}
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(farm.id)}
                          className="bg-red-500 hover:bg-red-600"
                        >
                          {language === "tl" ? "I-delete" : "Delete"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Spacer for mobile */}
      <div className="h-20 lg:hidden" />
    </div>
  )
}
