"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Skull, Edit } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatDate, formatNumber, calculateAge } from "@/lib/utils"

interface FlockDetails {
  id: string
  batchNumber: string
  breed: string | null
  birdType: string
  source: string | null
  arrivalDate: string
  initialCount: number
  currentCount: number
  stage: string
  status: string
  notes: string | null
  coop: { id: string; name: string } | null
  createdBy: { id: string; name: string }
  mortalityLogs: Array<{
    id: string
    date: string
    count: number
    cause: string | null
  }>
  vaccinations: Array<{
    id: string
    vaccineName: string
    dateAdministered: string
    nextDueDate: string | null
  }>
  healthIncidents: Array<{
    id: string
    dateReported: string
    diagnosis: string | null
    status: string
  }>
}

export default function FlockDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { toast } = useToast()
  const [flock, setFlock] = useState<FlockDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [mortalityOpen, setMortalityOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function fetchFlock() {
    try {
      const res = await fetch(`/api/flocks/${id}`)
      if (res.ok) {
        const data = await res.json()
        setFlock(data)
      }
    } catch (error) {
      console.error("Failed to fetch flock:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFlock()
  }, [id])

  async function recordMortality(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      date: formData.get("date") as string,
      count: parseInt(formData.get("count") as string),
      cause: formData.get("cause") as string || undefined,
      notes: formData.get("notes") as string || undefined,
    }

    try {
      const res = await fetch(`/api/flocks/${id}/mortality`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to record mortality")
      }

      toast({
        title: "Mortality recorded",
        description: `${data.count} deaths have been recorded`,
      })
      setMortalityOpen(false)
      fetchFlock()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to record mortality",
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4 lg:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="h-64 bg-muted rounded-lg" />
        </div>
      </div>
    )
  }

  if (!flock) {
    return (
      <div className="p-4 lg:p-8">
        <p className="text-muted-foreground">Flock not found</p>
      </div>
    )
  }

  const age = calculateAge(flock.arrivalDate)
  const mortalityRate = ((flock.initialCount - flock.currentCount) / flock.initialCount * 100).toFixed(1)

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/flocks">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">{flock.batchNumber}</h1>
            <p className="text-muted-foreground">{flock.breed || "No breed specified"}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={mortalityOpen} onOpenChange={setMortalityOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Skull className="h-4 w-4 mr-2" />
                Record Mortality
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Mortality</DialogTitle>
              </DialogHeader>
              <form onSubmit={recordMortality} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    defaultValue={new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="count">Number of Deaths</Label>
                  <Input
                    id="count"
                    name="count"
                    type="number"
                    min="1"
                    max={flock.currentCount}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cause">Cause</Label>
                  <Input id="cause" name="cause" placeholder="e.g., Disease, Heat stress" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" name="notes" rows={2} />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setMortalityOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Recording..." : "Record"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <Link href={`/flocks/${flock.id}/edit`}>
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Current Count</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(flock.currentCount)}</div>
            <p className="text-xs text-muted-foreground">
              of {formatNumber(flock.initialCount)} initial
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Age</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{age.weeks}w {age.days % 7}d</div>
            <p className="text-xs text-muted-foreground">
              Since {formatDate(flock.arrivalDate)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Mortality Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mortalityRate}%</div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(flock.initialCount - flock.currentCount)} birds lost
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge
              variant={
                flock.status === "ACTIVE"
                  ? "success"
                  : flock.status === "SOLD"
                  ? "secondary"
                  : "destructive"
              }
              className="text-lg px-3 py-1"
            >
              {flock.status}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="mortality">Mortality ({flock.mortalityLogs.length})</TabsTrigger>
          <TabsTrigger value="vaccinations">Vaccinations ({flock.vaccinations.length})</TabsTrigger>
          <TabsTrigger value="health">Health ({flock.healthIncidents.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Flock Information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-muted-foreground">Bird Type</dt>
                  <dd className="font-medium">{flock.birdType}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Stage</dt>
                  <dd className="font-medium">{flock.stage}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Source</dt>
                  <dd className="font-medium">{flock.source || "-"}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Coop</dt>
                  <dd className="font-medium">{flock.coop?.name || "Not assigned"}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Created By</dt>
                  <dd className="font-medium">{flock.createdBy.name}</dd>
                </div>
                {flock.notes && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm text-muted-foreground">Notes</dt>
                    <dd className="font-medium">{flock.notes}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mortality">
          <Card>
            <CardHeader>
              <CardTitle>Mortality Logs</CardTitle>
              <CardDescription>Recent mortality records for this flock</CardDescription>
            </CardHeader>
            <CardContent>
              {flock.mortalityLogs.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No mortality recorded</p>
              ) : (
                <div className="space-y-3">
                  {flock.mortalityLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between border-b pb-3">
                      <div>
                        <p className="font-medium">{log.count} birds</p>
                        <p className="text-sm text-muted-foreground">
                          {log.cause || "Cause not specified"}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">{formatDate(log.date)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vaccinations">
          <Card>
            <CardHeader>
              <CardTitle>Vaccination Records</CardTitle>
            </CardHeader>
            <CardContent>
              {flock.vaccinations.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No vaccinations recorded</p>
              ) : (
                <div className="space-y-3">
                  {flock.vaccinations.map((vax) => (
                    <div key={vax.id} className="flex items-center justify-between border-b pb-3">
                      <div>
                        <p className="font-medium">{vax.vaccineName}</p>
                        <p className="text-sm text-muted-foreground">
                          Administered: {formatDate(vax.dateAdministered)}
                        </p>
                      </div>
                      {vax.nextDueDate && (
                        <Badge variant="outline">Next: {formatDate(vax.nextDueDate)}</Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health">
          <Card>
            <CardHeader>
              <CardTitle>Health Incidents</CardTitle>
            </CardHeader>
            <CardContent>
              {flock.healthIncidents.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No health incidents recorded</p>
              ) : (
                <div className="space-y-3">
                  {flock.healthIncidents.map((incident) => (
                    <div key={incident.id} className="flex items-center justify-between border-b pb-3">
                      <div>
                        <p className="font-medium">{incident.diagnosis || "Undiagnosed"}</p>
                        <p className="text-sm text-muted-foreground">
                          Reported: {formatDate(incident.dateReported)}
                        </p>
                      </div>
                      <Badge
                        variant={
                          incident.status === "RESOLVED"
                            ? "success"
                            : incident.status === "ACTIVE"
                            ? "destructive"
                            : "warning"
                        }
                      >
                        {incident.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
