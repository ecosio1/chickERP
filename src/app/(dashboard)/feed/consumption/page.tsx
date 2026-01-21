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
  TrendingDown,
  Calendar,
  Warehouse,
} from "lucide-react"
import { useLanguage } from "@/hooks/use-language"

interface FeedInventory {
  id: string
  feedType: string
  brand: string | null
  quantityKg: number
}

interface Coop {
  id: string
  name: string
  currentOccupancy: number
}

interface Consumption {
  id: string
  date: string
  quantityKg: number
  coop: { id: string; name: string }
  feedInventory: { id: string; feedType: string; brand: string | null }
  recordedBy: { name: string }
  notes: string | null
}

const FEED_TYPE_LABELS: Record<string, string> = {
  STARTER: "Starter",
  GROWER: "Grower",
  FINISHER: "Finisher",
  BREEDER: "Breeder",
  LAYER: "Layer",
  SUPPLEMENT: "Supplement",
}

export default function FeedConsumptionPage() {
  const { t } = useLanguage()
  const [inventory, setInventory] = useState<FeedInventory[]>([])
  const [coops, setCoops] = useState<Coop[]>([])
  const [consumptions, setConsumptions] = useState<Consumption[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [formData, setFormData] = useState({
    coopId: "",
    feedInventoryId: "",
    date: new Date().toISOString().split("T")[0],
    quantityKg: "",
    notes: "",
  })

  useEffect(() => {
    Promise.all([
      fetch("/api/feed/inventory").then((r) => r.json()),
      fetch("/api/coops").then((r) => r.json()),
      fetch("/api/feed/consumption").then((r) => r.json()),
    ]).then(([invData, coopData, consData]) => {
      setInventory(invData.data || [])
      setCoops(coopData.data || [])
      setConsumptions(consData.data || [])
      setLoading(false)
    }).catch((err) => {
      console.error("Failed to fetch data:", err)
      setLoading(false)
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!formData.coopId || !formData.feedInventoryId || !formData.quantityKg) {
      setError("Coop, feed type, and quantity are required")
      return
    }

    setSaving(true)

    try {
      const res = await fetch("/api/feed/consumption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coopId: formData.coopId,
          feedInventoryId: formData.feedInventoryId,
          date: formData.date,
          quantityKg: parseFloat(formData.quantityKg),
          notes: formData.notes || null,
        }),
      })

      if (res.ok) {
        const newConsumption = await res.json()
        setConsumptions([newConsumption.data, ...consumptions])
        setSuccess("Consumption recorded successfully!")
        setFormData({
          ...formData,
          quantityKg: "",
          notes: "",
        })
        // Refresh inventory to get updated quantities
        const invRes = await fetch("/api/feed/inventory")
        const invData = await invRes.json()
        setInventory(invData.data || [])
      } else {
        const json = await res.json()
        setError(json.error || "Failed to record consumption")
      }
    } catch (err) {
      setError("Failed to record consumption")
    } finally {
      setSaving(false)
    }
  }

  const selectedFeed = inventory.find((f) => f.id === formData.feedInventoryId)

  if (loading) {
    return (
      <div className="p-4 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-orange-100 rounded-xl w-48" />
          <div className="h-64 bg-orange-50 rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8 space-y-6 page-transition">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/feed">
          <Button variant="ghost" size="icon" className="rounded-xl">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
            Record Feed Consumption
          </h1>
          <p className="text-muted-foreground">
            Track daily feed usage per coop
          </p>
        </div>
      </div>

      {/* Record Form */}
      <Card className="card-warm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-700 flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-orange-500" />
            New Consumption Record
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm">
                {success}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-base">Coop *</Label>
                <Select
                  value={formData.coopId}
                  onValueChange={(value) => setFormData({ ...formData, coopId: value })}
                >
                  <SelectTrigger className="mt-2 h-12 rounded-xl border-2 border-orange-100">
                    <SelectValue placeholder="Select coop" />
                  </SelectTrigger>
                  <SelectContent>
                    {coops.map((coop) => (
                      <SelectItem key={coop.id} value={coop.id}>
                        {coop.name} ({coop.currentOccupancy} birds)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-base">Feed Type *</Label>
                <Select
                  value={formData.feedInventoryId}
                  onValueChange={(value) => setFormData({ ...formData, feedInventoryId: value })}
                >
                  <SelectTrigger className="mt-2 h-12 rounded-xl border-2 border-orange-100">
                    <SelectValue placeholder="Select feed" />
                  </SelectTrigger>
                  <SelectContent>
                    {inventory.map((feed) => (
                      <SelectItem key={feed.id} value={feed.id}>
                        {FEED_TYPE_LABELS[feed.feedType] || feed.feedType}
                        {feed.brand && ` - ${feed.brand}`}
                        {` (${feed.quantityKg.toFixed(1)} kg available)`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-base">Date *</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="mt-2 h-12 rounded-xl border-2 border-orange-100"
                  required
                />
              </div>

              <div>
                <Label className="text-base">Quantity (kg) *</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.quantityKg}
                  onChange={(e) => setFormData({ ...formData, quantityKg: e.target.value })}
                  placeholder="5.0"
                  className="mt-2 h-12 rounded-xl border-2 border-orange-100"
                  required
                />
                {selectedFeed && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Available: {selectedFeed.quantityKg.toFixed(1)} kg
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label className="text-base">Notes</Label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any observations..."
                className="mt-2 h-12 rounded-xl border-2 border-orange-100"
              />
            </div>

            <Button
              type="submit"
              disabled={saving || inventory.length === 0 || coops.length === 0}
              className="w-full h-12 rounded-xl bg-orange-500 hover:bg-orange-600 text-white"
            >
              {saving ? t("common.loading") : "Record Consumption"}
            </Button>

            {(inventory.length === 0 || coops.length === 0) && (
              <p className="text-sm text-muted-foreground text-center">
                {inventory.length === 0 && "Add feed inventory first. "}
                {coops.length === 0 && "Add coops first."}
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Recent Consumption */}
      <Card className="card-warm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-700">
            Recent Consumption ({consumptions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {consumptions.length > 0 ? (
            <div className="space-y-3">
              {consumptions.slice(0, 20).map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-orange-50 hover:bg-orange-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                      <Wheat className="h-6 w-6 text-orange-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">
                        {FEED_TYPE_LABELS[record.feedInventory.feedType] || record.feedInventory.feedType}
                        {record.feedInventory.brand && ` - ${record.feedInventory.brand}`}
                      </p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Warehouse className="h-3 w-3" />
                          {record.coop.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(record.date).toLocaleDateString()}
                        </span>
                      </div>
                      {record.notes && (
                        <p className="text-xs text-muted-foreground mt-1">{record.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-800">
                      {record.quantityKg.toFixed(1)} kg
                    </p>
                    <p className="text-xs text-muted-foreground">
                      by {record.recordedBy.name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <TrendingDown className="h-12 w-12 mx-auto text-orange-200 mb-3" />
              <p className="text-muted-foreground">No consumption records yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Spacer for mobile */}
      <div className="h-20 lg:hidden" />
    </div>
  )
}
