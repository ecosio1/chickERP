"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Warehouse,
  Plus,
  Bird,
  Settings,
  Trash2,
  Users,
} from "lucide-react"
import { useLanguage } from "@/hooks/use-language"

interface Coop {
  id: string
  name: string
  coopType: string
  capacity: number
  status: string
  notes: string | null
  currentOccupancy: number
  birds: Array<{
    id: string
    name: string | null
    sex: string
  }>
}

const COOP_TYPES = [
  { value: "BREEDING_PEN", label: "Breeding Pen", labelTl: "Breeding Pen" },
  { value: "GROW_OUT", label: "Grow Out", labelTl: "Grow Out" },
  { value: "LAYER_HOUSE", label: "Layer House", labelTl: "Layer House" },
  { value: "BROODER", label: "Brooder", labelTl: "Brooder" },
  { value: "QUARANTINE", label: "Quarantine", labelTl: "Quarantine" },
]

const COOP_STATUS = [
  { value: "ACTIVE", label: "Active", color: "bg-green-100 text-green-700" },
  { value: "MAINTENANCE", label: "Maintenance", color: "bg-yellow-100 text-yellow-700" },
  { value: "INACTIVE", label: "Inactive", color: "bg-gray-100 text-gray-700" },
]

export default function CoopsPage() {
  const { t, language } = useLanguage()
  const [coops, setCoops] = useState<Coop[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    name: "",
    coopType: "",
    capacity: "",
    status: "ACTIVE",
    notes: "",
  })

  useEffect(() => {
    fetchCoops()
  }, [])

  const fetchCoops = async () => {
    try {
      const res = await fetch("/api/coops")
      if (res.ok) {
        const data = await res.json()
        setCoops(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("Failed to fetch coops:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.name || !formData.coopType || !formData.capacity) {
      setError("Name, type, and capacity are required")
      return
    }

    setSaving(true)

    try {
      const res = await fetch("/api/coops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          coopType: formData.coopType,
          capacity: parseInt(formData.capacity),
          status: formData.status,
          notes: formData.notes || null,
        }),
      })

      if (res.ok) {
        fetchCoops()
        setShowAddForm(false)
        setFormData({ name: "", coopType: "", capacity: "", status: "ACTIVE", notes: "" })
      } else {
        const json = await res.json()
        setError(json.error || "Failed to add coop")
      }
    } catch (err) {
      setError("Failed to add coop")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this coop?")) return

    try {
      const res = await fetch(`/api/coops/${id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        setCoops(coops.filter((c) => c.id !== id))
      } else {
        const json = await res.json()
        alert(json.error || "Failed to delete coop")
      }
    } catch (error) {
      console.error("Failed to delete:", error)
    }
  }

  const getCoopTypeLabel = (type: string) => {
    const coopType = COOP_TYPES.find((c) => c.value === type)
    return language === "tl" ? coopType?.labelTl : coopType?.label
  }

  const getStatusBadge = (status: string) => {
    const statusInfo = COOP_STATUS.find((s) => s.value === status)
    return statusInfo || { label: status, color: "bg-gray-100 text-gray-700" }
  }

  const totalCapacity = coops.reduce((sum, coop) => sum + coop.capacity, 0)
  const totalOccupancy = coops.reduce((sum, coop) => sum + coop.currentOccupancy, 0)
  const activeCoops = coops.filter((c) => c.status === "ACTIVE").length

  if (loading) {
    return (
      <div className="p-4 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-orange-100 rounded-xl w-48" />
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-orange-50 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8 space-y-6 page-transition">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
            {t("nav.coops")}
          </h1>
          <p className="text-muted-foreground">
            Manage housing units and bird assignments
          </p>
        </div>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Coop
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-warm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Coops
            </CardTitle>
            <Warehouse className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-800">{coops.length}</div>
            <p className="text-sm text-muted-foreground mt-1">
              {activeCoops} active
            </p>
          </CardContent>
        </Card>

        <Card className="card-warm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Capacity
            </CardTitle>
            <Users className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-800">{totalCapacity}</div>
            <p className="text-sm text-muted-foreground mt-1">birds max</p>
          </CardContent>
        </Card>

        <Card className="card-warm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Current Occupancy
            </CardTitle>
            <Bird className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-800">{totalOccupancy}</div>
            <p className="text-sm text-muted-foreground mt-1">
              {totalCapacity > 0 ? Math.round((totalOccupancy / totalCapacity) * 100) : 0}% full
            </p>
          </CardContent>
        </Card>

        <Card className="card-warm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Available Space
            </CardTitle>
            <Settings className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-800">
              {totalCapacity - totalOccupancy}
            </div>
            <p className="text-sm text-muted-foreground mt-1">spots open</p>
          </CardContent>
        </Card>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <Card className="card-warm border-2 border-orange-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              <Warehouse className="h-5 w-5 text-orange-500" />
              New Coop
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
                  <Label className="text-base">Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Coop A, Breeding Pen 1"
                    className="mt-2 h-12 rounded-xl border-2 border-orange-100"
                    required
                  />
                </div>

                <div>
                  <Label className="text-base">Type *</Label>
                  <Select
                    value={formData.coopType}
                    onValueChange={(value) => setFormData({ ...formData, coopType: value })}
                  >
                    <SelectTrigger className="mt-2 h-12 rounded-xl border-2 border-orange-100">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {COOP_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {language === "tl" ? type.labelTl : type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-base">Capacity *</Label>
                  <Input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    placeholder="20"
                    className="mt-2 h-12 rounded-xl border-2 border-orange-100"
                    required
                  />
                </div>

                <div>
                  <Label className="text-base">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger className="mt-2 h-12 rounded-xl border-2 border-orange-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COOP_STATUS.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-base">Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any additional details..."
                  className="mt-2 rounded-xl border-2 border-orange-100"
                  rows={2}
                />
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false)
                    setFormData({ name: "", coopType: "", capacity: "", status: "ACTIVE", notes: "" })
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

      {/* Coops List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {coops.length > 0 ? (
          coops.map((coop) => {
            const occupancyPercent = coop.capacity > 0
              ? Math.round((coop.currentOccupancy / coop.capacity) * 100)
              : 0
            const statusBadge = getStatusBadge(coop.status)

            return (
              <Card key={coop.id} className="card-warm">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg font-semibold text-gray-800">
                        {coop.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {getCoopTypeLabel(coop.coopType)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusBadge.color}`}>
                        {statusBadge.label}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(coop.id)}
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Occupancy Bar */}
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Occupancy</span>
                        <span className="font-medium">
                          {coop.currentOccupancy} / {coop.capacity}
                        </span>
                      </div>
                      <div className="h-2 bg-orange-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            occupancyPercent > 90
                              ? "bg-red-500"
                              : occupancyPercent > 70
                              ? "bg-yellow-500"
                              : "bg-green-500"
                          }`}
                          style={{ width: `${Math.min(occupancyPercent, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {occupancyPercent}% full
                      </p>
                    </div>

                    {/* Bird Preview */}
                    {coop.birds && coop.birds.length > 0 && (
                      <div className="flex items-center gap-1">
                        {coop.birds.slice(0, 5).map((bird) => (
                          <div
                            key={bird.id}
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                              bird.sex === "MALE"
                                ? "bg-blue-100 text-blue-600"
                                : bird.sex === "FEMALE"
                                ? "bg-pink-100 text-pink-600"
                                : "bg-gray-100 text-gray-600"
                            }`}
                            title={bird.name || bird.id.slice(-4)}
                          >
                            <Bird className="h-3 w-3" />
                          </div>
                        ))}
                        {coop.currentOccupancy > 5 && (
                          <span className="text-xs text-muted-foreground ml-1">
                            +{coop.currentOccupancy - 5} more
                          </span>
                        )}
                      </div>
                    )}

                    {coop.notes && (
                      <p className="text-xs text-muted-foreground border-t border-orange-100 pt-2">
                        {coop.notes}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })
        ) : (
          <Card className="card-warm col-span-full">
            <CardContent className="text-center py-12">
              <Warehouse className="h-12 w-12 mx-auto text-orange-200 mb-3" />
              <p className="text-muted-foreground mb-4">No coops yet</p>
              <Button
                onClick={() => setShowAddForm(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Coop
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Spacer for mobile */}
      <div className="h-20 lg:hidden" />
    </div>
  )
}
