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
  Plus,
  AlertTriangle,
  Package,
  TrendingDown,
} from "lucide-react"
import { useLanguage } from "@/hooks/use-language"

interface FeedInventory {
  id: string
  feedType: string
  brand: string | null
  quantityKg: number
  costPerKg: number | null
  reorderLevel: number | null
  isLowStock: boolean
  _count: {
    consumptions: number
  }
}

const FEED_TYPES = [
  { value: "STARTER", label: "Starter", labelTl: "Starter" },
  { value: "GROWER", label: "Grower", labelTl: "Grower" },
  { value: "FINISHER", label: "Finisher", labelTl: "Finisher" },
  { value: "BREEDER", label: "Breeder", labelTl: "Breeder" },
  { value: "LAYER", label: "Layer", labelTl: "Layer" },
  { value: "SUPPLEMENT", label: "Supplement", labelTl: "Supplement" },
]

export default function FeedPage() {
  const { t, language } = useLanguage()
  const [inventory, setInventory] = useState<FeedInventory[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    feedType: "",
    brand: "",
    quantityKg: "",
    costPerKg: "",
    reorderLevel: "",
  })

  useEffect(() => {
    fetchInventory()
  }, [])

  const fetchInventory = async () => {
    try {
      const res = await fetch("/api/feed/inventory")
      if (res.ok) {
        const json = await res.json()
        setInventory(json.data || [])
      }
    } catch (error) {
      console.error("Failed to fetch inventory:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.feedType || !formData.quantityKg) {
      setError("Feed type and quantity are required")
      return
    }

    setSaving(true)

    try {
      const res = await fetch("/api/feed/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feedType: formData.feedType,
          brand: formData.brand || null,
          quantityKg: parseFloat(formData.quantityKg),
          costPerKg: formData.costPerKg ? parseFloat(formData.costPerKg) : null,
          reorderLevel: formData.reorderLevel ? parseFloat(formData.reorderLevel) : null,
        }),
      })

      if (res.ok) {
        fetchInventory()
        setShowAddForm(false)
        setFormData({ feedType: "", brand: "", quantityKg: "", costPerKg: "", reorderLevel: "" })
      } else {
        const json = await res.json()
        setError(json.error || "Failed to add feed")
      }
    } catch (err) {
      setError("Failed to add feed")
    } finally {
      setSaving(false)
    }
  }

  const getFeedTypeLabel = (type: string) => {
    const feedType = FEED_TYPES.find((f) => f.value === type)
    return language === "tl" ? feedType?.labelTl : feedType?.label
  }

  const totalStock = inventory.reduce((sum, item) => sum + item.quantityKg, 0)
  const lowStockCount = inventory.filter((item) => item.isLowStock).length

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
            {t("nav.feed")}
          </h1>
          <p className="text-muted-foreground">
            Manage feed inventory and track consumption
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/feed/consumption">
            <Button variant="outline" className="rounded-xl border-2 border-orange-100">
              <TrendingDown className="h-5 w-5 mr-2" />
              Record Consumption
            </Button>
          </Link>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Stock
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="card-warm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Stock
            </CardTitle>
            <Package className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-800">
              {totalStock.toFixed(1)} kg
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {inventory.length} feed types
            </p>
          </CardContent>
        </Card>

        <Card className="card-warm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Low Stock Alerts
            </CardTitle>
            <AlertTriangle className={`h-5 w-5 ${lowStockCount > 0 ? "text-red-500" : "text-green-500"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${lowStockCount > 0 ? "text-red-600" : "text-green-600"}`}>
              {lowStockCount}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {lowStockCount > 0 ? "Need restock" : "All stocked"}
            </p>
          </CardContent>
        </Card>

        <Card className="card-warm col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Feed Types
            </CardTitle>
            <Wheat className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-800">
              {inventory.length}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              In inventory
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <Card className="card-warm border-2 border-orange-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              <Wheat className="h-5 w-5 text-orange-500" />
              Add Feed Stock
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
                  <Label className="text-base">Feed Type *</Label>
                  <Select
                    value={formData.feedType}
                    onValueChange={(value) => setFormData({ ...formData, feedType: value })}
                  >
                    <SelectTrigger className="mt-2 h-12 rounded-xl border-2 border-orange-100">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {FEED_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {language === "tl" ? type.labelTl : type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-base">Brand (Optional)</Label>
                  <Input
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="e.g., B-Meg, Vitarich"
                    className="mt-2 h-12 rounded-xl border-2 border-orange-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-base">Quantity (kg) *</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.quantityKg}
                    onChange={(e) => setFormData({ ...formData, quantityKg: e.target.value })}
                    placeholder="50"
                    className="mt-2 h-12 rounded-xl border-2 border-orange-100"
                    required
                  />
                </div>

                <div>
                  <Label className="text-base">Cost per kg</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.costPerKg}
                    onChange={(e) => setFormData({ ...formData, costPerKg: e.target.value })}
                    placeholder="45.00"
                    className="mt-2 h-12 rounded-xl border-2 border-orange-100"
                  />
                </div>

                <div>
                  <Label className="text-base">Reorder Level (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.reorderLevel}
                    onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                    placeholder="10"
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
                    setFormData({ feedType: "", brand: "", quantityKg: "", costPerKg: "", reorderLevel: "" })
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

      {/* Inventory List */}
      <Card className="card-warm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-700">
            Feed Inventory ({inventory.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {inventory.length > 0 ? (
            <div className="space-y-3">
              {inventory.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between p-4 rounded-xl transition-colors ${
                    item.isLowStock ? "bg-red-50 border border-red-200" : "bg-orange-50 hover:bg-orange-100"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      item.isLowStock ? "bg-red-100" : "bg-orange-100"
                    }`}>
                      <Wheat className={`h-6 w-6 ${item.isLowStock ? "text-red-500" : "text-orange-500"}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-800">
                          {getFeedTypeLabel(item.feedType)}
                        </p>
                        {item.isLowStock && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full font-medium">
                            Low Stock
                          </span>
                        )}
                      </div>
                      {item.brand && (
                        <p className="text-sm text-muted-foreground">{item.brand}</p>
                      )}
                      {item.costPerKg && (
                        <p className="text-xs text-muted-foreground">₱{item.costPerKg.toFixed(2)}/kg</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${item.isLowStock ? "text-red-600" : "text-gray-800"}`}>
                      {item.quantityKg.toFixed(1)} kg
                    </p>
                    {item.reorderLevel && (
                      <p className="text-xs text-muted-foreground">
                        Reorder at {item.reorderLevel} kg
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Wheat className="h-12 w-12 mx-auto text-orange-200 mb-3" />
              <p className="text-muted-foreground mb-4">No feed in inventory</p>
              <Button
                onClick={() => setShowAddForm(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Feed
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Spacer for mobile */}
      <div className="h-20 lg:hidden" />
    </div>
  )
}
