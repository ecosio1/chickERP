"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

interface Coop {
  id: string
  name: string
  capacity: number
  currentOccupancy: number
}

export default function NewFlockPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [coops, setCoops] = useState<Coop[]>([])

  useEffect(() => {
    async function fetchCoops() {
      try {
        const res = await fetch("/api/coops")
        if (res.ok) {
          const data = await res.json()
          setCoops(data)
        }
      } catch (error) {
        console.error("Failed to fetch coops:", error)
      }
    }
    fetchCoops()
  }, [])

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      batchNumber: formData.get("batchNumber") as string,
      breed: formData.get("breed") as string || undefined,
      birdType: formData.get("birdType") as string,
      source: formData.get("source") as string || undefined,
      arrivalDate: formData.get("arrivalDate") as string,
      initialCount: parseInt(formData.get("initialCount") as string),
      stage: formData.get("stage") as string,
      coopId: formData.get("coopId") as string || undefined,
      notes: formData.get("notes") as string || undefined,
    }

    try {
      const res = await fetch("/api/flocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to create flock")
      }

      toast({
        title: "Flock created",
        description: `Flock ${data.batchNumber} has been created successfully`,
      })
      router.push("/flocks")
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create flock",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/flocks">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">New Flock</h1>
          <p className="text-muted-foreground">Register a new batch of birds</p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Flock Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="batchNumber">Batch Number *</Label>
                <Input
                  id="batchNumber"
                  name="batchNumber"
                  placeholder="e.g., BATCH-2026-001"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="breed">Breed / Strain</Label>
                <Input
                  id="breed"
                  name="breed"
                  placeholder="e.g., Cobb 500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="birdType">Bird Type *</Label>
                <Select name="birdType" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LAYER">Layer</SelectItem>
                    <SelectItem value="BROILER">Broiler</SelectItem>
                    <SelectItem value="BREEDER">Breeder</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stage">Current Stage *</Label>
                <Select name="stage" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CHICK">Chick</SelectItem>
                    <SelectItem value="GROWER">Grower</SelectItem>
                    <SelectItem value="LAYER">Layer</SelectItem>
                    <SelectItem value="BROILER">Broiler</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="source">Source</Label>
                <Input
                  id="source"
                  name="source"
                  placeholder="e.g., ABC Hatchery"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="arrivalDate">Arrival / Hatch Date *</Label>
                <Input
                  id="arrivalDate"
                  name="arrivalDate"
                  type="date"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="initialCount">Initial Bird Count *</Label>
                <Input
                  id="initialCount"
                  name="initialCount"
                  type="number"
                  min="1"
                  placeholder="e.g., 5000"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="coopId">Assign to Coop</Label>
                <Select name="coopId">
                  <SelectTrigger>
                    <SelectValue placeholder="Select coop (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {coops.map((coop) => (
                      <SelectItem key={coop.id} value={coop.id}>
                        {coop.name} ({coop.currentOccupancy}/{coop.capacity})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Additional notes about this flock..."
                rows={3}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Flock"}
              </Button>
              <Link href="/flocks">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
